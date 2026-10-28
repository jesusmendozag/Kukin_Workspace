package com.naatlabs.kukin.service;

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
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class RecipeService {

    private final RecipeRepository recipeRepository;
    private final InventoryRepository inventoryRepository;
    private final UserRepository userRepository;

    public RecipeService(RecipeRepository recipeRepository, InventoryRepository inventoryRepository, UserRepository userRepository) {
        this.recipeRepository = recipeRepository;
        this.inventoryRepository = inventoryRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public List<RecipeDtos.RecipeSuggestionResponse> getSuggestions(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new KukinApiException(HttpStatus.NOT_FOUND, "USER_NOT_FOUND", "Usuario no encontrado"));

        List<Inventory> userInventory = inventoryRepository.findByUserIdUserOrderByExpirationDateAsc(user.getIdUser());
        Set<Long> userIngredientIds = userInventory.stream()
                .map(inv -> inv.getIngredient().getIdIngredient())
                .collect(Collectors.toSet());

        List<Recipe> allRecipes = recipeRepository.findAllWithIngredients();
        List<RecipeDtos.RecipeSuggestionResponse> suggestions = new ArrayList<>();

        for (Recipe recipe : allRecipes) {
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

            // Regla de negocio: Sugerir solo si tiene al menos el 50% de los ingredientes listos
            if (matchPercentage >= 50) {
                List<String> dietNames = recipe.getDiets().stream().map(d -> d.getName()).collect(Collectors.toList());
                suggestions.add(new RecipeDtos.RecipeSuggestionResponse(
                        recipe.getIdRecipe(),
                        recipe.getTitleRecipe(),
                        recipe.getTimePreparation(),
                        recipe.getUrlImage(),
                        matchPercentage,
                        missing,
                        dietNames
                ));
            }
        }

        // Ordenar las recetas de mayor a menor coincidencia
        suggestions.sort((a, b) -> Integer.compare(b.getMatchPercentage(), a.getMatchPercentage()));
        return suggestions;
    }
}