package com.naatlabs.kukin.controller;

import com.naatlabs.kukin.dto.ApiResponse;
import com.naatlabs.kukin.dto.RecipeDtos;
import com.naatlabs.kukin.service.RecipeService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/recipes")
public class RecipeController {

    private final RecipeService recipeService;

    public RecipeController(RecipeService recipeService) {
        this.recipeService = recipeService;
    }

    // Catálogo general (Lee de MySQL)
    @GetMapping
    public ResponseEntity<ApiResponse<List<RecipeDtos.RecipeSuggestionResponse>>> getAllRecipes() {
        List<RecipeDtos.RecipeSuggestionResponse> response = recipeService.getAllRecipes();
        return ResponseEntity.ok(new ApiResponse<>(response));
    }

    // Detalle de receta (Lee de MySQL)
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<RecipeDtos.RecipeDetailResponse>> getRecipeDetail(@PathVariable Long id) {
        RecipeDtos.RecipeDetailResponse response = recipeService.getRecipeById(id);
        return ResponseEntity.ok(new ApiResponse<>(response));
    }

    // Sugerencias basadas en el inventario del usuario
    @GetMapping("/suggestions")
    public ResponseEntity<ApiResponse<List<RecipeDtos.RecipeSuggestionResponse>>> getSuggestions(Authentication authentication) {
        List<RecipeDtos.RecipeSuggestionResponse> response = recipeService.getSuggestions(authentication.getName());
        return ResponseEntity.ok(new ApiResponse<>(response));
    }

    // NUEVO ENDPOINT: Descubrir recetas de Spoonacular directamente desde Java
    @PostMapping("/discover")
    public ResponseEntity<ApiResponse<String>> discoverNewRecipes() {
        recipeService.discoverAndSaveRecipesFromSpoonacular();
        return ResponseEntity.status(HttpStatus.CREATED).body(new ApiResponse<>("Nuevas recetas descubiertas y guardadas en MySQL exitosamente"));
    }
}