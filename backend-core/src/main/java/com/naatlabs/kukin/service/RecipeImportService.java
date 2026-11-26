package com.naatlabs.kukin.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.naatlabs.kukin.entity.Diet;
import com.naatlabs.kukin.entity.Ingredient;
import com.naatlabs.kukin.entity.Recipe;
import com.naatlabs.kukin.entity.RecipeIngredient;
import com.naatlabs.kukin.entity.Unit;
import com.naatlabs.kukin.repository.DietRepository;
import com.naatlabs.kukin.repository.IngredientRepository;
import com.naatlabs.kukin.repository.RecipeRepository;
import com.naatlabs.kukin.repository.UnitRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.StreamSupport;

/**
 * Importa recetas de Spoonacular a MySQL, ya traducidas al español.
 *
 * Cada receta se traduce UNA sola vez, en el momento en que se descarga, y se guarda con su external_id.
 * Las siguientes veces se lee de la base de datos (rápido, en español y sin gastar cuota de APIs).
 */
@Service
public class RecipeImportService {

    private static final String SPOONACULAR_CATEGORY = "Otros";

    /** Unidades de Spoonacular → símbolo del catálogo local. */
    private static final Map<String, String> UNIT_SYMBOLS = new HashMap<>();
    static {
        for (String u : List.of("cup", "cups", "c")) UNIT_SYMBOLS.put(u, "tz");
        for (String u : List.of("tablespoon", "tablespoons", "tbsp", "tbs", "tbsps")) UNIT_SYMBOLS.put(u, "cda");
        for (String u : List.of("teaspoon", "teaspoons", "tsp", "tsps")) UNIT_SYMBOLS.put(u, "cdta");
        for (String u : List.of("ounce", "ounces", "oz")) UNIT_SYMBOLS.put(u, "oz");
        for (String u : List.of("pound", "pounds", "lb", "lbs")) UNIT_SYMBOLS.put(u, "lb");
        for (String u : List.of("clove", "cloves")) UNIT_SYMBOLS.put(u, "diente");
        for (String u : List.of("pinch", "pinches", "dash", "dashes")) UNIT_SYMBOLS.put(u, "pizca");
        for (String u : List.of("can", "cans")) UNIT_SYMBOLS.put(u, "lata");
        for (String u : List.of("kg", "kilogram", "kilograms")) UNIT_SYMBOLS.put(u, "kg");
        for (String u : List.of("l", "liter", "liters", "litre", "litres")) UNIT_SYMBOLS.put(u, "l");
        for (String u : List.of("bunch", "bunches")) UNIT_SYMBOLS.put(u, "manojo");
        for (String u : List.of("g", "gram", "grams", "gr")) UNIT_SYMBOLS.put(u, "g");
        for (String u : List.of("ml", "milliliter", "milliliters", "millilitre")) UNIT_SYMBOLS.put(u, "ml");
    }

    private final RecipeRepository recipeRepository;
    private final IngredientRepository ingredientRepository;
    private final UnitRepository unitRepository;
    private final DietRepository dietRepository;
    private final TranslationService translator;

    public RecipeImportService(RecipeRepository recipeRepository, IngredientRepository ingredientRepository,
                               UnitRepository unitRepository, DietRepository dietRepository,
                               TranslationService translator) {
        this.recipeRepository = recipeRepository;
        this.ingredientRepository = ingredientRepository;
        this.unitRepository = unitRepository;
        this.dietRepository = dietRepository;
        this.translator = translator;
    }

    /**
     * Devuelve las recetas de la búsqueda (en el mismo orden) como entidades guardadas.
     * Las que ya existían se reutilizan; las nuevas se traducen y se guardan.
     */
    @Transactional
    public List<Recipe> importAll(JsonNode results) {
        List<Recipe> out = new ArrayList<>();
        List<JsonNode> fresh = new ArrayList<>();
        for (JsonNode r : iterable(results)) {
            Optional<Recipe> existing = recipeRepository.findByExternalId(r.path("id").asText());
            if (existing.isPresent()) {
                applyNutrition(existing.get(), r);
                out.add(existing.get());
            }
            else fresh.add(r);
        }
        if (fresh.isEmpty()) return out;

        // 1) Todos los títulos nuevos en una sola petición
        List<String> titles = translator.translateAll(fresh.stream().map(r -> r.path("title").asText("")).toList());

        // 2) Todos los nombres de ingredientes nuevos (sin repetir) en una sola petición
        Map<String, String> namesEs = translateIngredientNames(fresh);

        // Catálogo por nombre normalizado, para no crear "Huevos" si ya existe "Huevo"
        Map<String, Ingredient> catalogByKey = new HashMap<>();
        for (Ingredient ing : ingredientRepository.findAll()) catalogByKey.putIfAbsent(IngredientNames.key(ing.getNameEs()), ing);

        Map<String, Unit> unitsBySymbol = new HashMap<>();
        for (Unit u : unitRepository.findAll()) unitsBySymbol.put(u.getSymbol().toLowerCase(Locale.ROOT), u);

        for (int i = 0; i < fresh.size(); i++) {
            JsonNode r = fresh.get(i);
            Recipe recipe = new Recipe();
            recipe.setExternalId(r.path("id").asText());
            recipe.setSource(Recipe.SourceType.SPOONACULAR);
            recipe.setTitleRecipe(truncate(titles.get(i), 150));
            recipe.setUrlImage(truncate(r.path("image").asText(null), 255));
            recipe.setTimePreparation(r.path("readyInMinutes").asInt(30));
            if (r.hasNonNull("servings")) recipe.setServings(r.path("servings").asInt());
            applyNutrition(recipe, r);

            // 3) Pasos de esta receta en una petición (un paso por renglón)
            List<String> stepsEn = new ArrayList<>();
            for (JsonNode block : iterable(r.path("analyzedInstructions"))) {
                for (JsonNode step : iterable(block.path("steps"))) stepsEn.add(step.path("step").asText(""));
            }
            if (stepsEn.isEmpty() && r.hasNonNull("instructions")) {
                for (String s : r.path("instructions").asText("").replaceAll("<[^>]*>", "\n").split("\\r?\\n|(?<=\\.)\\s+(?=[A-Z])")) {
                    if (!s.isBlank()) stepsEn.add(s.trim());
                }
            }
            List<String> stepsEs = translator.translateAll(stepsEn);
            String instructions = String.join("\n", stepsEs.stream().filter(s -> !s.isBlank()).toList());
            recipe.setInstructions(instructions.isBlank() ? "Reúne todos los ingredientes.\nCocina a fuego medio.\nSirve y disfruta." : instructions);

            Set<Long> added = new HashSet<>();
            for (JsonNode ing : iterable(ingredientsOf(r))) {
                String nameEn = ing.path("name").asText("").trim();
                if (nameEn.isEmpty()) continue;
                Ingredient ingredient = resolveIngredient(ing.path("id").asText(""), nameEn,
                        namesEs.getOrDefault(nameEn, nameEn), catalogByKey);
                if (!added.add(ingredient.getIdIngredient())) continue;

                RecipeIngredient detail = new RecipeIngredient();
                detail.setRecipe(recipe);
                detail.setIngredient(ingredient);
                detail.setUnit(mapUnit(ing.path("unit").asText(""), unitsBySymbol));
                detail.setAmount(BigDecimal.valueOf(ing.path("amount").asDouble(1)).setScale(2, java.math.RoundingMode.HALF_UP));
                recipe.getIngredients().add(detail);
            }

            for (JsonNode d : iterable(r.path("diets"))) {
                String name = d.asText();
                Diet diet = dietRepository.findByNameIgnoreCase(name).orElseGet(() -> {
                    Diet created = new Diet();
                    created.setName(truncate(name, 40));
                    return dietRepository.save(created);
                });
                recipe.getDiets().add(diet);
            }

            out.add(recipeRepository.save(recipe));
        }
        return out;
    }

    // ---------------------------------------------------------------- ingredientes

    private Map<String, String> translateIngredientNames(List<JsonNode> recipes) {
        LinkedHashMap<String, String> map = new LinkedHashMap<>();
        for (JsonNode r : recipes) {
            for (JsonNode ing : iterable(ingredientsOf(r))) {
                String nameEn = ing.path("name").asText("").trim();
                if (nameEn.isEmpty() || map.containsKey(nameEn)) continue;
                // Si ya existe en el catálogo, no hace falta traducirlo
                Optional<Ingredient> known = findCatalogMatch(nameEn);
                map.put(nameEn, known.map(Ingredient::getNameEs).orElse(null));
            }
        }
        List<String> pending = map.entrySet().stream().filter(e -> e.getValue() == null).map(Map.Entry::getKey).toList();
        List<String> translated = translator.translateIngredientNames(pending);
        for (int i = 0; i < pending.size(); i++) map.put(pending.get(i), translated.get(i));
        return map;
    }

    /**
     * Busca el ingrediente en el catálogo (por id de Spoonacular, por nombre en inglés o por nombre en español
     * ya limpio); si no está, lo crea en español y sin cantidades en el nombre.
     */
    private Ingredient resolveIngredient(String spoonacularId, String nameEn, String nameEs,
                                         Map<String, Ingredient> catalogByKey) {
        if (!spoonacularId.isBlank()) {
            Optional<Ingredient> byExternal = ingredientRepository.findByExternalId(spoonacularId);
            if (byExternal.isPresent()) return byExternal.get();
        }
        Optional<Ingredient> byEn = findCatalogMatch(nameEn);
        if (byEn.isPresent()) return byEn.get();

        String cleanEs = IngredientNames.clean(nameEs);
        Ingredient byEs = catalogByKey.get(IngredientNames.key(cleanEs));
        if (byEs != null) return byEs;

        Ingredient created = new Ingredient();
        created.setNameEn(truncate(nameEn, 120));
        created.setNameEs(truncate(cleanEs, 120));
        created.setCategory(SPOONACULAR_CATEGORY);
        if (!spoonacularId.isBlank()) created.setExternalId(spoonacularId);
        Ingredient saved = ingredientRepository.save(created);
        catalogByKey.put(IngredientNames.key(cleanEs), saved);
        return saved;
    }

    /**
     * Coincidencia con el catálogo: nombre exacto, singular, o el sustantivo principal
     * ("cherry tomatoes" → tomato). Así el % de coincidencia reconoce lo que el usuario ya tiene.
     */
    private Optional<Ingredient> findCatalogMatch(String nameEn) {
        String lower = nameEn.toLowerCase(Locale.ROOT).trim();
        Optional<Ingredient> hit = byNameEn(lower);
        if (hit.isPresent()) return hit;
        String[] words = lower.split("\\s+");
        if (words.length > 1) return byNameEn(words[words.length - 1]);
        return Optional.empty();
    }

    private Optional<Ingredient> byNameEn(String word) {
        for (String candidate : List.of(word, singular(word))) {
            Optional<Ingredient> found = ingredientRepository.findFirstByNameEnIgnoreCase(candidate);
            if (found.isPresent()) return found;
        }
        return Optional.empty();
    }

    private static String singular(String w) {
        if (w.endsWith("oes") || w.endsWith("ches") || w.endsWith("shes")) return w.substring(0, w.length() - 2);
        if (w.endsWith("ies")) return w.substring(0, w.length() - 3) + "y";
        if (w.endsWith("s") && !w.endsWith("ss")) return w.substring(0, w.length() - 1);
        return w;
    }

    private Unit mapUnit(String unitEn, Map<String, Unit> bySymbol) {
        String symbol = UNIT_SYMBOLS.getOrDefault(unitEn.toLowerCase(Locale.ROOT).trim(), "pza");
        Unit unit = bySymbol.get(symbol);
        if (unit == null) unit = bySymbol.get("pza");
        if (unit == null) unit = bySymbol.values().iterator().next();
        return unit;
    }

    private static JsonNode ingredientsOf(JsonNode r) {
        // complexSearch con fillIngredients trae usados + faltantes; information trae extendedIngredients
        if (r.has("extendedIngredients")) return r.path("extendedIngredients");
        List<JsonNode> all = new ArrayList<>();
        r.path("usedIngredients").forEach(all::add);
        r.path("missedIngredients").forEach(all::add);
        return new com.fasterxml.jackson.databind.ObjectMapper().valueToTree(all);
    }

    private static String truncate(String s, int max) {
        if (s == null) return null;
        return s.length() <= max ? s : s.substring(0, max);
    }

    private static Iterable<JsonNode> iterable(JsonNode node) {
        return () -> StreamSupport.stream(node.spliterator(), false).iterator();
    }

    /** Calorías y proteína por porción, precio por porción y puntaje de salud (si Spoonacular los mandó). */
    private static void applyNutrition(Recipe recipe, JsonNode r) {
        for (JsonNode n : iterable(r.path("nutrition").path("nutrients"))) {
            String name = n.path("name").asText("");
            if ("Calories".equalsIgnoreCase(name)) recipe.setCalories((int) Math.round(n.path("amount").asDouble()));
            if ("Protein".equalsIgnoreCase(name)) recipe.setProteinG((int) Math.round(n.path("amount").asDouble()));
        }
        if (r.hasNonNull("pricePerServing")) recipe.setPricePerServing((int) Math.round(r.path("pricePerServing").asDouble()));
        if (r.hasNonNull("healthScore")) recipe.setHealthScore((int) Math.round(r.path("healthScore").asDouble()));
    }
}
