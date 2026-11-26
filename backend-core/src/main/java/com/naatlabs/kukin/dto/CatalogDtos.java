package com.naatlabs.kukin.dto;

public class CatalogDtos {

    public record IngredientResponse(Long idIngredient, String nameEs, String nameEn, String category) {}

    public record UnitResponse(Short idUnit, String name, String symbol) {}

    public record UserProfileResponse(Long idUser, String name, String email, String typePlan) {}
}
