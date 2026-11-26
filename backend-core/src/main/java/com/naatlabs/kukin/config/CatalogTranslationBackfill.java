package com.naatlabs.kukin.config;

import com.naatlabs.kukin.entity.Ingredient;
import com.naatlabs.kukin.entity.Inventory;
import com.naatlabs.kukin.entity.Recipe;
import com.naatlabs.kukin.entity.RecipeIngredient;
import com.naatlabs.kukin.repository.IngredientRepository;
import com.naatlabs.kukin.repository.RecipeRepository;
import com.naatlabs.kukin.service.IngredientNames;
import com.naatlabs.kukin.service.RecipeImportService;
import com.naatlabs.kukin.service.SpoonacularClient;
import com.naatlabs.kukin.service.TranslationService;
import com.naatlabs.kukin.service.UnitConverter;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
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
    private final SpoonacularClient spoonacular;

    /** Pasos de relleno que guardaban las versiones anteriores cuando una receta no traía instrucciones. */
    private static final String OLD_PLACEHOLDER = "Reúne todos los ingredientes.";
    /** Palabras muy comunes en recetas en inglés: si aparecen varias, el texto no se tradujo. */
    private static final java.util.regex.Pattern ENGLISH = java.util.regex.Pattern.compile(
            "\\b(the|and|with|into|until|bowl|add|mix|minutes|heat|serve|salad|stir|place)\\b",
            java.util.regex.Pattern.CASE_INSENSITIVE);

    @PersistenceContext
    private EntityManager em;

    public CatalogTranslationBackfill(IngredientRepository ingredientRepository, RecipeRepository recipeRepository,
                                      TranslationService translator, SpoonacularClient spoonacular) {
        this.ingredientRepository = ingredientRepository;
        this.recipeRepository = recipeRepository;
        this.translator = translator;
        this.spoonacular = spoonacular;
    }

    @EventListener(ApplicationReadyEvent.class)
    @org.springframework.core.annotation.Order(1)
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

        // Algunos datos viejos guardaron el nombre en español también como "inglés" ("pechuga de pollo"),
        // y la búsqueda en Spoonacular usa ese campo: se traduce al inglés ("chicken breast")
        for (Ingredient i : all) {
            if (i.getNameEn() == null || i.getNameEs() == null || !i.getNameEn().trim().equalsIgnoreCase(i.getNameEs().trim())) continue;
            String en = translator.toEnglish(i.getNameEs());
            if (en != null && !en.equalsIgnoreCase(i.getNameEs().trim())) i.setNameEn(truncate(en, 120));
        }

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
            String title = r.getTitleRecipe();
            String steps = r.getInstructions() == null ? "" : r.getInstructions();

            // Pasos de relleno: se piden los pasos reales a Spoonacular (si no hay, se deja sin pasos)
            if (steps.startsWith(OLD_PLACEHOLDER)) {
                steps = realSteps(r);
            } else if (looksEnglish(steps)) {
                // Si los pasos quedaron en inglés, el título también: se traducen los dos
                steps = String.join("\n", translator.translateAll(List.of(steps.split("\\r?\\n"))));
                title = translator.translate(title);
            }
            title = translator.mexicanize(title);
            steps = translator.mexicanize(steps);
            if (!Objects.equals(title, r.getTitleRecipe()) || !Objects.equals(steps, r.getInstructions())) {
                r.setTitleRecipe(truncate(title, 150));
                r.setInstructions(steps);
                changed.add(r);
            }
        }
        recipeRepository.saveAll(changed);
        return changed.size();
    }

    private static boolean looksEnglish(String text) {
        if (text == null || text.isBlank()) return false;
        var m = ENGLISH.matcher(text);
        int hits = 0;
        while (m.find() && hits < 2) hits++;
        return hits >= 2;
    }

    private String realSteps(Recipe r) {
        try {
            var info = spoonacular.getRecipeInformation(Long.parseLong(r.getExternalId()));
            if (info.isEmpty()) return r.getInstructions(); // sin API key o sin conexión: se intenta en el próximo arranque
            List<String> en = RecipeImportService.stepsEnOf(info.get());
            if (en.isEmpty()) return RecipeImportService.NO_STEPS;
            return String.join("\n", translator.translateAll(en).stream().filter(s -> !s.isBlank()).toList());
        } catch (NumberFormatException e) {
            return RecipeImportService.NO_STEPS;
        }
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
                moveReferences(dup, keep);
                merged++;
            }
        }
        em.flush();
        em.clear();
        return merged;
    }

    /**
     * Pasa recetas y alacenas del ingrediente repetido al que se conserva, y borra el repetido.
     * Con JPA (no SQL propio de MySQL) para que funcione igual en MySQL y en la base H2 de las pruebas.
     */
    private void moveReferences(Ingredient dup, Ingredient keep) {
        // Alacena: si el usuario ya tiene el conservado, se suman cantidades (convirtiendo la unidad si se puede)
        List<Inventory> dupItems = em.createQuery(
                "SELECT i FROM Inventory i WHERE i.ingredient = :dup", Inventory.class)
                .setParameter("dup", dup).getResultList();
        for (Inventory d : dupItems) {
            Inventory k = em.createQuery(
                    "SELECT i FROM Inventory i WHERE i.ingredient = :keep AND i.user = :user", Inventory.class)
                    .setParameter("keep", keep).setParameter("user", d.getUser())
                    .getResultStream().findFirst().orElse(null);
            if (k == null) {
                d.setIngredient(keep);
                continue;
            }
            BigDecimal extra = UnitConverter.convert(d.getQuantity(), d.getUnit().getSymbol(), k.getUnit().getSymbol());
            if (extra != null) k.setQuantity(k.getQuantity().add(extra));
            em.remove(d);
        }

        // Recetas: si la receta ya tiene el conservado, se quita la fila repetida; si no, se cambia de ingrediente
        List<RecipeIngredient> dupDetails = em.createQuery(
                "SELECT ri FROM RecipeIngredient ri WHERE ri.ingredient = :dup", RecipeIngredient.class)
                .setParameter("dup", dup).getResultList();
        for (RecipeIngredient d : dupDetails) {
            long already = em.createQuery(
                    "SELECT COUNT(ri) FROM RecipeIngredient ri WHERE ri.recipe = :recipe AND ri.ingredient = :keep", Long.class)
                    .setParameter("recipe", d.getRecipe()).setParameter("keep", keep).getSingleResult();
            if (already > 0) {
                d.getRecipe().getIngredients().remove(d); // orphanRemoval la borra
            } else {
                d.setIngredient(keep);
            }
        }
        em.flush();
        em.remove(dup);
    }

    private static String lower(String s) {
        return s == null ? "" : s.toLowerCase(Locale.ROOT).trim();
    }

    private static String truncate(String s, int max) {
        return s == null || s.length() <= max ? s : s.substring(0, max);
    }
}
