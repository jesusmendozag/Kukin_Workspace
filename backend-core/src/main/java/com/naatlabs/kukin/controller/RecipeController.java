package com.naatlabs.kukin.controller;

import com.naatlabs.kukin.dto.ApiResponse;
import com.naatlabs.kukin.dto.RecipeDtos;
import com.naatlabs.kukin.service.RecipeService;
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

    @GetMapping("/suggestions")
    public ResponseEntity<ApiResponse<List<RecipeDtos.RecipeSuggestionResponse>>> getSuggestions(Authentication authentication) {
        List<RecipeDtos.RecipeSuggestionResponse> response = recipeService.getSuggestions(authentication.getName());
        return ResponseEntity.ok(new ApiResponse<>(response));
    }
}