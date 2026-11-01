package com.naatlabs.kukin.controller;

import com.naatlabs.kukin.dto.ApiResponse;
import com.naatlabs.kukin.entity.Ingredient;
import com.naatlabs.kukin.repository.IngredientRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/ingredients")
public class IngredientController {

    private final IngredientRepository ingredientRepository;

    public IngredientController(IngredientRepository ingredientRepository) {
        this.ingredientRepository = ingredientRepository;
    }

    // Prueba S5: Buscador con autocompletado
    @GetMapping
    public ResponseEntity<ApiResponse<List<Ingredient>>> searchIngredients(@RequestParam String search) {
        // Retorna máximo 10 resultados para no saturar la UI móvil
        List<Ingredient> results = ingredientRepository.findByNameEsContainingIgnoreCaseOrNameEnContainingIgnoreCase(search, search)
                                    .stream().limit(10).toList();
        return ResponseEntity.ok(new ApiResponse<>(results));
    }
}