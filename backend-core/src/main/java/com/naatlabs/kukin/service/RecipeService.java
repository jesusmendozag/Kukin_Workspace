package com.naatlabs.kukin.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.naatlabs.kukin.dto.RecipeDtos;
import com.naatlabs.kukin.entity.Inventory;
import com.naatlabs.kukin.entity.Recipe;
import com.naatlabs.kukin.entity.User;
import com.naatlabs.kukin.exception.KukinApiException;
import com.naatlabs.kukin.repository.InventoryRepository;
import com.naatlabs.kukin.repository.RecipeRepository;
import com.naatlabs.kukin.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Sugerencias y detalle de recetas. Todo se sirve desde MySQL y en español:
 * las recetas de Spoonacular se traducen y guardan la primera vez que aparecen (RecipeImportService).
 */
@Service
public class RecipeService {

    public static final String SOURCE_OWN = "OWN";
    public static final String SOURCE_SPOONACULAR = "SPOONACULAR";

    /** Regla de negocio: de la biblioteca local solo se sugieren recetas con al menos 50% de coincidencia. */
    private static final int MIN_MATCH_PERCENTAGE = 50;
    private static final int SPOONACULAR_RESULTS = 10;

    private final RecipeRepository recipeRepository;
    private final InventoryRepository inventoryRepository;
    private final UserRepository userRepository;
    private final SpoonacularClient spoonacular;
    private final RecipeImportService importer;

    public RecipeService(RecipeRepository recipeRepository, InventoryRepository inventoryRepository,
                         UserRepository userRepository, SpoonacularClient spoonacular,
                         RecipeImportService importer) {
        this.recipeRepository = recipeRepository;
        this.inventoryRepository = inventoryRepository;
        this.userRepository = userRepository;
        this.spoonacular = spoonacular;
        this.importer = importer;
    }

    @Transactional
    public List<RecipeDtos.RecipeSuggestionResponse> getSuggestions(String email) {
        List<Inventory> userInventory = getInventory(email);
        Set<Long> userIngredientIds = userInventory.stream()
                .map(inv -> inv.getIngredient().getIdIngredient())
                .collect(Collectors.toSet());

        List<RecipeDtos.RecipeSuggestionResponse> suggestions = new ArrayList<>();
        Set<Long> seen = new HashSet<>();

        // 1) Búsqueda en Spoonacular: lo nuevo se traduce y se guarda; lo conocido sale de MySQL
        List<String> namesEn = userInventory.stream().map(inv -> inv.getIngredient().getNameEn()).distinct().toList();
        Optional<JsonNode> remote = spoonacular.searchByIngredients(namesEn, SPOONACULAR_RESULTS);
        if (remote.isPresent()) {
            for (Recipe recipe : importer.importAll(remote.get().path("results"))) {
                if (seen.add(recipe.getIdRecipe())) suggestions.add(toSuggestion(recipe, userIngredientIds));
            }
        }

        // 2) Biblioteca local (recetas propias y las importadas antes) con coincidencia suficiente
        for (Recipe recipe : recipeRepository.findAllWithIngredients()) {
            if (seen.contains(recipe.getIdRecipe()) || recipe.getIngredients().isEmpty()) continue;
            RecipeDtos.RecipeSuggestionResponse s = toSuggestion(recipe, userIngredientIds);
            if (s.getMatchPercentage() >= MIN_MATCH_PERCENTAGE) {
                seen.add(recipe.getIdRecipe());
                suggestions.add(s);
            }
        }

        suggestions.sort(Comparator.comparingInt(RecipeDtos.RecipeSuggestionResponse::getMatchPercentage).reversed());
        return suggestions;
    }

    @Transactional(readOnly = true)
    public RecipeDtos.RecipeDetailResponse getDetail(String email, Long idRecipe, String source) {
        List<Inventory> userInventory = getInventory(email);
        Optional<Recipe> recipe = recipeRepository.findById(idRecipe);
        // Compatibilidad: enlaces viejos que usaban el id de Spoonacular
        if (recipe.isEmpty() && SOURCE_SPOONACULAR.equalsIgnoreCase(source)) {
            recipe = recipeRepository.findByExternalId(String.valueOf(idRecipe));
        }
        return mapDetail(recipe.orElseThrow(() ->
                new KukinApiException(HttpStatus.NOT_FOUND, "RECIPE_NOT_FOUND", "Receta no encontrada")), userInventory);
    }

    // ---------------------------------------------------------------- mapeo

    private RecipeDtos.RecipeSuggestionResponse toSuggestion(Recipe recipe, Set<Long> userIngredientIds) {
        int total = recipe.getIngredients().size();
        int matchCount = 0;
        List<RecipeDtos.MissingIngredientDto> missing = new ArrayList<>();
        for (var ri : recipe.getIngredients()) {
            Long ingId = ri.getIngredient().getIdIngredient();
            if (userIngredientIds.contains(ingId)) matchCount++;
            else missing.add(new RecipeDtos.MissingIngredientDto(ingId, ri.getIngredient().getNameEs()));
        }
        int matchPercentage = total == 0 ? 0 : (int) Math.round(matchCount * 100.0 / total);
        List<String> diets = recipe.getDiets().stream().map(d -> d.getName()).toList();
        return new RecipeDtos.RecipeSuggestionResponse(
                recipe.getIdRecipe(), recipe.getTitleRecipe(), recipe.getTimePreparation(), recipe.getUrlImage(),
                matchPercentage, missing, diets, recipe.getSource().name());
    }

    private RecipeDtos.RecipeDetailResponse mapDetail(Recipe recipe, List<Inventory> userInventory) {
        Set<Long> userIngredientIds = userInventory.stream()
                .map(inv -> inv.getIngredient().getIdIngredient())
                .collect(Collectors.toSet());

        List<RecipeDtos.RecipeIngredientDetailDto> ingredients = recipe.getIngredients().stream()
                .map(ri -> new RecipeDtos.RecipeIngredientDetailDto(
                        ri.getIngredient().getIdIngredient(),
                        ri.getIngredient().getNameEs(),
                        ri.getAmount().stripTrailingZeros(),
                        ri.getUnit().getSymbol(),
                        userIngredientIds.contains(ri.getIngredient().getIdIngredient())))
                .toList();

        // Un paso por renglón; se quita la numeración "1." porque la app ya numera
        List<String> steps = Arrays.stream(recipe.getInstructions().split("\\r?\\n"))
                .map(s -> s.replaceFirst("^\\s*\\d+\\s*[.)-]\\s*", "").trim())
                .filter(s -> !s.isEmpty())
                .toList();

        return new RecipeDtos.RecipeDetailResponse(
                recipe.getIdRecipe(), recipe.getTitleRecipe(), recipe.getInstructions(), steps,
                recipe.getTimePreparation(), recipe.getServings(), recipe.getUrlImage(), recipe.getSource().name(),
                recipe.getDiets().stream().map(d -> d.getName()).toList(), ingredients);
    }

    private List<Inventory> getInventory(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new KukinApiException(HttpStatus.NOT_FOUND, "USER_NOT_FOUND", "Usuario no encontrado"));
        return inventoryRepository.findByUserIdUserOrderByExpirationDateAsc(user.getIdUser());
    }
}
