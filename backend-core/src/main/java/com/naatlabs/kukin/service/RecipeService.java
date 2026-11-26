package com.naatlabs.kukin.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.naatlabs.kukin.dto.RecipeDtos;
import com.naatlabs.kukin.entity.Ingredient;
import com.naatlabs.kukin.entity.Inventory;
import com.naatlabs.kukin.entity.Recipe;
import com.naatlabs.kukin.entity.User;
import com.naatlabs.kukin.exception.KukinApiException;
import com.naatlabs.kukin.repository.IngredientRepository;
import com.naatlabs.kukin.repository.InventoryRepository;
import com.naatlabs.kukin.repository.RecipeRepository;
import com.naatlabs.kukin.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.stream.StreamSupport;

@Service
public class RecipeService {

    public static final String SOURCE_OWN = "OWN";
    public static final String SOURCE_SPOONACULAR = "SPOONACULAR";

    /** Regla de negocio: sugerir recetas propias solo si el usuario tiene al menos el 50% de los ingredientes. */
    private static final int MIN_MATCH_PERCENTAGE = 50;
    private static final int SPOONACULAR_RESULTS = 10;

    private final RecipeRepository recipeRepository;
    private final InventoryRepository inventoryRepository;
    private final UserRepository userRepository;
    private final IngredientRepository ingredientRepository;
    private final SpoonacularClient spoonacular;

    public RecipeService(RecipeRepository recipeRepository, InventoryRepository inventoryRepository,
                         UserRepository userRepository, IngredientRepository ingredientRepository,
                         SpoonacularClient spoonacular) {
        this.recipeRepository = recipeRepository;
        this.inventoryRepository = inventoryRepository;
        this.userRepository = userRepository;
        this.ingredientRepository = ingredientRepository;
        this.spoonacular = spoonacular;
    }

    @Transactional(readOnly = true)
    public List<RecipeDtos.RecipeSuggestionResponse> getSuggestions(String email) {
        List<Inventory> userInventory = getInventory(email);

        // 1) Spoonacular (si hay API key configurada y el usuario tiene ingredientes)
        List<String> namesEn = userInventory.stream()
                .map(inv -> inv.getIngredient().getNameEn())
                .distinct()
                .toList();
        Optional<JsonNode> remote = spoonacular.searchByIngredients(namesEn, SPOONACULAR_RESULTS);
        if (remote.isPresent()) {
            List<RecipeDtos.RecipeSuggestionResponse> fromApi = mapSpoonacularSearch(remote.get());
            if (!fromApi.isEmpty()) return fromApi;
        }

        // 2) Respaldo: recetas propias guardadas en la base de datos
        return getLocalSuggestions(userInventory);
    }

    @Transactional(readOnly = true)
    public RecipeDtos.RecipeDetailResponse getDetail(String email, Long idRecipe, String source) {
        List<Inventory> userInventory = getInventory(email);

        if (SOURCE_SPOONACULAR.equalsIgnoreCase(source)) {
            JsonNode node = spoonacular.getRecipeInformation(idRecipe)
                    .orElseThrow(() -> new KukinApiException(HttpStatus.BAD_GATEWAY, "RECIPE_PROVIDER_UNAVAILABLE",
                            "No se pudo obtener la receta del proveedor externo"));
            return mapSpoonacularDetail(node, userInventory);
        }

        Recipe recipe = recipeRepository.findById(idRecipe)
                .orElseThrow(() -> new KukinApiException(HttpStatus.NOT_FOUND, "RECIPE_NOT_FOUND", "Receta no encontrada"));
        return mapLocalDetail(recipe, userInventory);
    }

    // ---------------------------------------------------------------- recetas propias

    private List<RecipeDtos.RecipeSuggestionResponse> getLocalSuggestions(List<Inventory> userInventory) {
        Set<Long> userIngredientIds = userInventory.stream()
                .map(inv -> inv.getIngredient().getIdIngredient())
                .collect(Collectors.toSet());

        List<RecipeDtos.RecipeSuggestionResponse> suggestions = new ArrayList<>();
        for (Recipe recipe : recipeRepository.findAllWithIngredients()) {
            int totalIngredients = recipe.getIngredients().size();
            if (totalIngredients == 0) continue;

            int matchCount = 0;
            List<RecipeDtos.MissingIngredientDto> missing = new ArrayList<>();
            for (var reqIngredient : recipe.getIngredients()) {
                Long ingId = reqIngredient.getIngredient().getIdIngredient();
                if (userIngredientIds.contains(ingId)) {
                    matchCount++;
                } else {
                    missing.add(new RecipeDtos.MissingIngredientDto(ingId, reqIngredient.getIngredient().getNameEs()));
                }
            }

            int matchPercentage = (int) Math.round(((double) matchCount / totalIngredients) * 100);
            if (matchPercentage >= MIN_MATCH_PERCENTAGE) {
                List<String> dietNames = recipe.getDiets().stream().map(d -> d.getName()).toList();
                suggestions.add(new RecipeDtos.RecipeSuggestionResponse(
                        recipe.getIdRecipe(), recipe.getTitleRecipe(), recipe.getTimePreparation(),
                        recipe.getUrlImage(), matchPercentage, missing, dietNames, SOURCE_OWN));
            }
        }

        // De mayor a menor coincidencia
        suggestions.sort(Comparator.comparingInt(RecipeDtos.RecipeSuggestionResponse::getMatchPercentage).reversed());
        return suggestions;
    }

    private RecipeDtos.RecipeDetailResponse mapLocalDetail(Recipe recipe, List<Inventory> userInventory) {
        Set<Long> userIngredientIds = userInventory.stream()
                .map(inv -> inv.getIngredient().getIdIngredient())
                .collect(Collectors.toSet());

        List<RecipeDtos.RecipeIngredientDetailDto> ingredients = recipe.getIngredients().stream()
                .map(ri -> new RecipeDtos.RecipeIngredientDetailDto(
                        ri.getIngredient().getIdIngredient(),
                        ri.getIngredient().getNameEs(),
                        ri.getAmount(),
                        ri.getUnit().getSymbol(),
                        userIngredientIds.contains(ri.getIngredient().getIdIngredient())))
                .toList();

        // Las instrucciones propias se guardan como texto con un paso por renglón
        List<String> steps = Arrays.stream(recipe.getInstructions().split("\\r?\\n"))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .toList();

        return new RecipeDtos.RecipeDetailResponse(
                recipe.getIdRecipe(), recipe.getTitleRecipe(), recipe.getInstructions(), steps,
                recipe.getTimePreparation(), null, recipe.getUrlImage(), SOURCE_OWN,
                recipe.getDiets().stream().map(d -> d.getName()).toList(), ingredients);
    }

    // ---------------------------------------------------------------- Spoonacular

    private List<RecipeDtos.RecipeSuggestionResponse> mapSpoonacularSearch(JsonNode root) {
        Map<String, String> es = spanishNames();
        List<RecipeDtos.RecipeSuggestionResponse> list = new ArrayList<>();
        for (JsonNode r : iterable(root.path("results"))) {
            int used = r.path("usedIngredientCount").asInt(0);
            int missed = r.path("missedIngredientCount").asInt(0);
            int match = (used + missed) == 0 ? 0 : (int) Math.round(used * 100.0 / (used + missed));

            List<RecipeDtos.MissingIngredientDto> missing = new ArrayList<>();
            for (JsonNode m : iterable(r.path("missedIngredients"))) {
                missing.add(new RecipeDtos.MissingIngredientDto(m.path("id").asLong(), translate(m.path("name").asText(), es)));
            }
            List<String> diets = new ArrayList<>();
            for (JsonNode d : iterable(r.path("diets"))) diets.add(d.asText());

            list.add(new RecipeDtos.RecipeSuggestionResponse(
                    r.path("id").asLong(),
                    r.path("title").asText(),
                    r.path("readyInMinutes").isMissingNode() ? null : r.path("readyInMinutes").asInt(),
                    r.path("image").asText(null),
                    match, missing, diets, SOURCE_SPOONACULAR));
        }
        list.sort(Comparator.comparingInt(RecipeDtos.RecipeSuggestionResponse::getMatchPercentage).reversed());
        return list;
    }

    private RecipeDtos.RecipeDetailResponse mapSpoonacularDetail(JsonNode d, List<Inventory> userInventory) {
        Map<String, String> es = spanishNames();
        Set<String> userNamesEn = userInventory.stream()
                .map(inv -> inv.getIngredient().getNameEn().toLowerCase(Locale.ROOT))
                .collect(Collectors.toSet());

        List<RecipeDtos.RecipeIngredientDetailDto> ingredients = new ArrayList<>();
        for (JsonNode ing : iterable(d.path("extendedIngredients"))) {
            String nameEn = ing.path("name").asText("");
            String lower = nameEn.toLowerCase(Locale.ROOT);
            boolean inInventory = userNamesEn.stream().anyMatch(lower::contains);
            ingredients.add(new RecipeDtos.RecipeIngredientDetailDto(
                    ing.path("id").asLong(),
                    translate(nameEn, es),
                    BigDecimal.valueOf(ing.path("amount").asDouble(0)).stripTrailingZeros(),
                    ing.path("unit").asText(""),
                    inInventory));
        }

        List<String> steps = new ArrayList<>();
        for (JsonNode block : iterable(d.path("analyzedInstructions"))) {
            for (JsonNode step : iterable(block.path("steps"))) steps.add(step.path("step").asText());
        }
        List<String> diets = new ArrayList<>();
        for (JsonNode diet : iterable(d.path("diets"))) diets.add(diet.asText());

        return new RecipeDtos.RecipeDetailResponse(
                d.path("id").asLong(),
                d.path("title").asText(),
                d.path("instructions").asText(""),
                steps,
                d.path("readyInMinutes").isMissingNode() ? null : d.path("readyInMinutes").asInt(),
                d.path("servings").isMissingNode() ? null : d.path("servings").asInt(),
                d.path("image").asText(null),
                SOURCE_SPOONACULAR,
                diets,
                ingredients);
    }

    // ---------------------------------------------------------------- utilidades

    private List<Inventory> getInventory(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new KukinApiException(HttpStatus.NOT_FOUND, "USER_NOT_FOUND", "Usuario no encontrado"));
        return inventoryRepository.findByUserIdUserOrderByExpirationDateAsc(user.getIdUser());
    }

    /** Diccionario inglés → español a partir del catálogo de ingredientes de la BD. */
    private Map<String, String> spanishNames() {
        Map<String, String> map = new HashMap<>();
        for (Ingredient i : ingredientRepository.findAll()) {
            map.put(i.getNameEn().toLowerCase(Locale.ROOT), i.getNameEs());
        }
        return map;
    }

    private static String translate(String nameEn, Map<String, String> es) {
        return es.getOrDefault(nameEn.toLowerCase(Locale.ROOT), nameEn);
    }

    private static Iterable<JsonNode> iterable(JsonNode node) {
        return () -> StreamSupport.stream(node.spliterator(), false).iterator();
    }
}
