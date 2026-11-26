package com.naatlabs.kukin.controller;

import com.naatlabs.kukin.dto.ApiResponse;
import com.naatlabs.kukin.dto.CatalogDtos;
import com.naatlabs.kukin.repository.IngredientRepository;
import com.naatlabs.kukin.repository.UnitRepository;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/** Catálogos de solo lectura que la app usa para llenar los formularios. */
@RestController
@RequestMapping("/api/v1")
public class CatalogController {

    private final IngredientRepository ingredientRepository;
    private final UnitRepository unitRepository;

    public CatalogController(IngredientRepository ingredientRepository, UnitRepository unitRepository) {
        this.ingredientRepository = ingredientRepository;
        this.unitRepository = unitRepository;
    }

    @GetMapping("/ingredients")
    public ResponseEntity<ApiResponse<List<CatalogDtos.IngredientResponse>>> getIngredients() {
        List<CatalogDtos.IngredientResponse> data = ingredientRepository.findAll(Sort.by("nameEs")).stream()
                .map(i -> new CatalogDtos.IngredientResponse(i.getIdIngredient(), i.getNameEs(), i.getNameEn(), i.getCategory()))
                .toList();
        return ResponseEntity.ok(new ApiResponse<>(data));
    }

    @GetMapping("/units")
    public ResponseEntity<ApiResponse<List<CatalogDtos.UnitResponse>>> getUnits() {
        List<CatalogDtos.UnitResponse> data = unitRepository.findAll(Sort.by("idUnit")).stream()
                .map(u -> new CatalogDtos.UnitResponse(u.getIdUnit(), u.getName(), u.getSymbol()))
                .toList();
        return ResponseEntity.ok(new ApiResponse<>(data));
    }
}
