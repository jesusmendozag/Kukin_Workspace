package com.naatlabs.kukin.config;

import com.naatlabs.kukin.entity.Ingredient;
import com.naatlabs.kukin.entity.Recipe;
import com.naatlabs.kukin.repository.IngredientRepository;
import com.naatlabs.kukin.repository.RecipeRepository;
import com.naatlabs.kukin.service.IngredientNames;
import com.naatlabs.kukin.service.TranslationService;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Set;

/**
 * Arreglo automático del catálogo al arrancar el backend (no hay que correr SQL a mano):
 *
 * 1. Traduce los ingredientes que siguieron en inglés (importaciones donde falló la traducción).
 * 2. Pasa nombres y recetas de Spoonacular a español de México (patatas → papas…).
 * 3. Limpia nombres que traían cantidades o preparación ("5 tallos de apio" → "Apio").
 * 4. Junta ingredientes repetidos ("Apio" y "5 tallos de apio", "Huevo" y "huevos"): las recetas y las
 *    alacenas que usaban el repetido pasan al que se conserva, y el repetido se borra.
 *
 * Es idempotente: si el catálogo ya está limpio, no cambia nada.
 */
@Component
public class CatalogTranslationBackfill {

    private static final Logger log = LoggerFactory.getLogger(CatalogTranslationBackfill.class);
    private static final Set<String> GENERIC_CATEGORIES = Set.of("spoonacular", "otros", "general", "");

    private final IngredientRepository ingredientRepository;
    private final RecipeRepository recipeRepository;
    private final TranslationService translator;

    @PersistenceContext
    private EntityManager em;

    public CatalogTranslationBackfill(IngredientRepository ingredientRepository, RecipeRepository recipeRepository,
                                      TranslationService translator) {
        this.ingredientRepository = ingredientRepository;
        this.recipeRepository = recipeRepository;
        this.translator = translator;
    }

    @EventListener(ApplicationReadyEvent.class)
    @Transactional
    public void run() {
        try {
            int names = fixIngredientNames();
            int recipes = fixRecipes();
            em.flush();
            int merged = mergeDuplicates();
            if (names + recipes + merged > 0) {
                log.info("Catálogo: {} nombres corregidos, {} recetas al español de México, {} ingredientes repetidos unidos",
                        names, recipes, merged);
            }
        } catch (RuntimeException e) {
            // Nunca debe impedir que el backend arranque
            log.warn("No se pudo completar la limpieza del catálogo: {}", e.getMessage());
        }
    }

    /** Traducción, español de México y limpieza de cada nombre. */
    private int fixIngredientNames() {
        List<Ingredient> all = ingredientRepository.findAll();

        List<Ingredient> english = all.stream()
                .filter(i -> i.getNameEn() != null && i.getNameEs() != null
                        && i.getNameEs().trim().equalsIgnoreCase(i.getNameEn().trim()))
                .toList();
        List<String> translated = translator.translateIngredientNames(english.stream().map(Ingredient::getNameEn).toList());
        Map<Ingredient, String> spanish = new LinkedHashMap<>();
        for (int k = 0; k < english.size(); k++) spanish.put(english.get(k), translated.get(k));

        List<Ingredient> changed = new ArrayList<>();
        for (Ingredient i : all) {
            String name = spanish.getOrDefault(i, i.getNameEs());
            name = IngredientNames.clean(translator.mexicanize(name));
            if (name != null && !name.isBlank() && !Objects.equals(name, i.getNameEs())) {
                i.setNameEs(truncate(name, 120));
                changed.add(i);
            }
        }
        ingredientRepository.saveAll(changed);
        return changed.size();
    }

    private int fixRecipes() {
        List<Recipe> changed = new ArrayList<>();
        for (Recipe r : recipeRepository.findAll()) {
            if (r.getSource() != Recipe.SourceType.SPOONACULAR) continue;
            String title = translator.mexicanize(r.getTitleRecipe());
            String steps = translator.mexicanize(r.getInstructions());
            if (!Objects.equals(title, r.getTitleRecipe()) || !Objects.equals(steps, r.getInstructions())) {
                r.setTitleRecipe(truncate(title, 150));
                r.setInstructions(steps);
                changed.add(r);
            }
        }
        recipeRepository.saveAll(changed);
        return changed.size();
    }

    /** Junta los ingredientes con el mismo nombre (sin acentos y en singular). */
    private int mergeDuplicates() {
        Map<String, List<Ingredient>> byKey = new LinkedHashMap<>();
        for (Ingredient i : ingredientRepository.findAll()) {
            byKey.computeIfAbsent(IngredientNames.key(i.getNameEs()), k -> new ArrayList<>()).add(i);
        }
        int merged = 0;
        for (List<Ingredient> group : byKey.values()) {
            if (group.size() < 2) continue;
            // Se conserva: el de categoría real (del catálogo), luego el más antiguo
            group.sort(Comparator
                    .comparing((Ingredient i) -> GENERIC_CATEGORIES.contains(lower(i.getCategory())) ? 1 : 0)
                    .thenComparing(Ingredient::getIdIngredient));
            Ingredient keep = group.get(0);
            for (Ingredient dup : group.subList(1, group.size())) {
                moveReferences(dup.getIdIngredient(), keep.getIdIngredient());
                merged++;
            }
        }
        em.clear();
        return merged;
    }

    /** Pasa recetas y alacenas del ingrediente repetido al que se conserva, y borra el repetido. */
    private void moveReferences(Long dup, Long keep) {
        // Alacena: si el usuario tiene ambos con la misma unidad, se suman cantidades
        em.createNativeQuery("UPDATE inventory k JOIN inventory d ON d.id_user = k.id_user AND d.id_unit = k.id_unit "
                + "SET k.quantity = k.quantity + d.quantity WHERE k.id_ingredient = :keep AND d.id_ingredient = :dup")
                .setParameter("keep", keep).setParameter("dup", dup).executeUpdate();
        // ...y el repetido se quita (la restricción única no permite dos registros del mismo ingrediente)
        em.createNativeQuery("DELETE d FROM inventory d JOIN inventory k ON k.id_user = d.id_user "
                + "WHERE d.id_ingredient = :dup AND k.id_ingredient = :keep")
                .setParameter("keep", keep).setParameter("dup", dup).executeUpdate();
        em.createNativeQuery("UPDATE inventory SET id_ingredient = :keep WHERE id_ingredient = :dup")
                .setParameter("keep", keep).setParameter("dup", dup).executeUpdate();

        // Recetas: si la receta ya tiene el conservado, se borra la fila repetida
        em.createNativeQuery("DELETE d FROM recipe_ingredient d JOIN recipe_ingredient k ON k.id_recipe = d.id_recipe "
                + "WHERE d.id_ingredient = :dup AND k.id_ingredient = :keep")
                .setParameter("keep", keep).setParameter("dup", dup).executeUpdate();
        em.createNativeQuery("UPDATE recipe_ingredient SET id_ingredient = :keep WHERE id_ingredient = :dup")
                .setParameter("keep", keep).setParameter("dup", dup).executeUpdate();

        em.createNativeQuery("DELETE FROM ingredient WHERE id_ingredient = :dup")
                .setParameter("dup", dup).executeUpdate();
    }

    private static String lower(String s) {
        return s == null ? "" : s.toLowerCase(Locale.ROOT).trim();
    }

    private static String truncate(String s, int max) {
        return s == null || s.length() <= max ? s : s.substring(0, max);
    }
}
