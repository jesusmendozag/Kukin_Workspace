package com.naatlabs.kukin.dto;

import java.math.BigDecimal;
import java.util.List;

public class RecipeDtos {

    public static class MissingIngredientDto {
        private Long idIngredient;
        private String ingredientName;

        public MissingIngredientDto(Long idIngredient, String ingredientName) {
            this.idIngredient = idIngredient;
            this.ingredientName = ingredientName;
        }
        public Long getIdIngredient() { return idIngredient; }
        public String getIngredientName() { return ingredientName; }
    }

    public static class RecipeSuggestionResponse {
        private Long idRecipe;
        private String titleRecipe;
        private Integer timePreparation;
        private String urlImage;
        private int matchPercentage;
        private List<MissingIngredientDto> missingIngredients;
        private List<String> diets;

        public RecipeSuggestionResponse(Long idRecipe, String titleRecipe, Integer timePreparation,
                                        String urlImage, int matchPercentage,
                                        List<MissingIngredientDto> missingIngredients, List<String> diets) {
            this.idRecipe = idRecipe;
            this.titleRecipe = titleRecipe;
            this.timePreparation = timePreparation;
            this.urlImage = urlImage;
            this.matchPercentage = matchPercentage;
            this.missingIngredients = missingIngredients;
            this.diets = diets;
        }

        public Long getIdRecipe() { return idRecipe; }
        public String getTitleRecipe() { return titleRecipe; }
        public Integer getTimePreparation() { return timePreparation; }
        public String getUrlImage() { return urlImage; }
        public int getMatchPercentage() { return matchPercentage; }
        public List<MissingIngredientDto> getMissingIngredients() { return missingIngredients; }
        public List<String> getDiets() { return diets; }
    }

    public static class RecipeIngredientDetailDto {
        private Long idIngredient;
        private String ingredientName;
        private BigDecimal amount;
        private String unitSymbol;
        private boolean inUserInventory;

        public RecipeIngredientDetailDto(Long idIngredient, String ingredientName,
                                         BigDecimal amount, String unitSymbol, boolean inUserInventory) {
            this.idIngredient = idIngredient;
            this.ingredientName = ingredientName;
            this.amount = amount;
            this.unitSymbol = unitSymbol;
            this.inUserInventory = inUserInventory;
        }

        public Long getIdIngredient() { return idIngredient; }
        public String getIngredientName() { return ingredientName; }
        public BigDecimal getAmount() { return amount; }
        public String getUnitSymbol() { return unitSymbol; }
        public boolean isInUserInventory() { return inUserInventory; }
    }

    public static class RecipeDetailResponse {
        private Long idRecipe;
        private String titleRecipe;
        private String instructions;
        private Integer timePreparation;
        private String urlImage;
        private String source;
        private List<String> diets;
        private List<RecipeIngredientDetailDto> ingredients;

        public RecipeDetailResponse(Long idRecipe, String titleRecipe, String instructions,
                                    Integer timePreparation, String urlImage, String source,
                                    List<String> diets, List<RecipeIngredientDetailDto> ingredients) {
            this.idRecipe = idRecipe;
            this.titleRecipe = titleRecipe;
            this.instructions = instructions;
            this.timePreparation = timePreparation;
            this.urlImage = urlImage;
            this.source = source;
            this.diets = diets;
            this.ingredients = ingredients;
        }

        public Long getIdRecipe() { return idRecipe; }
        public String getTitleRecipe() { return titleRecipe; }
        public String getInstructions() { return instructions; }
        public Integer getTimePreparation() { return timePreparation; }
        public String getUrlImage() { return urlImage; }
        public String getSource() { return source; }
        public List<String> getDiets() { return diets; }
        public List<RecipeIngredientDetailDto> getIngredients() { return ingredients; }
    }

    // DTOs para recibir las recetas desde el Frontend y guardarlas en MySQL
    public static class RecipeBulkRequest {
        private String titleRecipe;
        private String urlImage;
        private Integer timePreparation;
        private List<String> diets;
        private List<RecipeIngredientBulkRequest> ingredients;
        private List<RecipeStepBulkRequest> steps;

        public String getTitleRecipe() { return titleRecipe; }
        public void setTitleRecipe(String titleRecipe) { this.titleRecipe = titleRecipe; }
        public String getUrlImage() { return urlImage; }
        public void setUrlImage(String urlImage) { this.urlImage = urlImage; }
        public Integer getTimePreparation() { return timePreparation; }
        public void setTimePreparation(Integer timePreparation) { this.timePreparation = timePreparation; }
        public List<String> getDiets() { return diets; }
        public void setDiets(List<String> diets) { this.diets = diets; }
        public List<RecipeIngredientBulkRequest> getIngredients() { return ingredients; }
        public void setIngredients(List<RecipeIngredientBulkRequest> ingredients) { this.ingredients = ingredients; }
        public List<RecipeStepBulkRequest> getSteps() { return steps; }
        public void setSteps(List<RecipeStepBulkRequest> steps) { this.steps = steps; }
    }

    public static class RecipeIngredientBulkRequest {
        private String name;
        private BigDecimal amount;
        private String unit;

        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        public BigDecimal getAmount() { return amount; }
        public void setAmount(BigDecimal amount) { this.amount = amount; }
        public String getUnit() { return unit; }
        public void setUnit(String unit) { this.unit = unit; }
    }

    public static class RecipeStepBulkRequest {
        private Integer number;
        private String instruction;

        public Integer getNumber() { return number; }
        public void setNumber(Integer number) { this.number = number; }
        public String getInstruction() { return instruction; }
        public void setInstruction(String instruction) { this.instruction = instruction; }
    }
}