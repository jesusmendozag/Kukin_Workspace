package com.naatlabs.kukin.controller;

import com.naatlabs.kukin.dto.ApiResponse;
import com.naatlabs.kukin.dto.InventoryDtos;
import com.naatlabs.kukin.service.InventoryService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/inventory")
public class InventoryController {

    private final InventoryService inventoryService;

    public InventoryController(InventoryService inventoryService) {
        this.inventoryService = inventoryService;
    }

    @PostMapping
    public ResponseEntity<ApiResponse<InventoryDtos.InventoryCreatedResponse>> addIngredient(
            @Valid @RequestBody InventoryDtos.AddInventoryRequest request,
            Authentication authentication) {
        
        // authentication.getName() extrae automáticamente el email del token JWT
        InventoryDtos.InventoryCreatedResponse response = inventoryService.addIngredientToInventory(authentication.getName(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(new ApiResponse<>(response));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<InventoryDtos.InventoryItemResponse>>> getInventory(Authentication authentication) {
        List<InventoryDtos.InventoryItemResponse> response = inventoryService.getUserInventory(authentication.getName());
        return ResponseEntity.ok(new ApiResponse<>(response));
    }
}