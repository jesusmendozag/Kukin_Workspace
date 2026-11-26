package com.naatlabs.kukin.dto;

public class CatalogDtos {

    public record IngredientResponse(Long idIngredient, String nameEs, String nameEn, String category) {}

    public record CreateIngredientRequest(
            @jakarta.validation.constraints.NotBlank(message = "Escribe el nombre del ingrediente")
            @jakarta.validation.constraints.Size(max = 80, message = "El nombre es demasiado largo")
            String name) {}

    public record UnitResponse(Short idUnit, String name, String symbol) {}

    public record UserProfileResponse(Long idUser, String name, String email, String typePlan) {}
}
