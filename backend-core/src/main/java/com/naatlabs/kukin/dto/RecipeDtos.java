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
        /** OWN (catálogo propio en la BD) o SPOONACULAR (API externa). */
        private String source;

        public RecipeSuggestionResponse(Long idRecipe, String titleRecipe, Integer timePreparation,
                                        String urlImage, int matchPercentage,
                                        List<MissingIngredientDto> missingIngredients, List<String> diets,
                                        String source) {
            this.idRecipe = idRecipe;
            this.titleRecipe = titleRecipe;
            this.timePreparation = timePreparation;
            this.urlImage = urlImage;
            this.matchPercentage = matchPercentage;
            this.missingIngredients = missingIngredients;
            this.diets = diets;
            this.source = source;
        }

        public Long getIdRecipe() { return idRecipe; }
        public String getTitleRecipe() { return titleRecipe; }
        public Integer getTimePreparation() { return timePreparation; }
        public String getUrlImage() { return urlImage; }
        public int getMatchPercentage() { return matchPercentage; }
        public List<MissingIngredientDto> getMissingIngredients() { return missingIngredients; }
        public List<String> getDiets() { return diets; }
        public String getSource() { return source; }

        // Datos para los filtros de la app
        /** Ingredientes del usuario que caducan pronto y que esta receta aprovecha. */
        private List<String> expiringIngredients = List.of();
        private int ingredientCount;
        private boolean needsOven;
        private Integer calories;
        private Integer proteinG;
        private Integer pricePerServing;
        private Integer healthScore;

        public Integer getCalories() { return calories; }
        public Integer getProteinG() { return proteinG; }
        public Integer getPricePerServing() { return pricePerServing; }
        public Integer getHealthScore() { return healthScore; }
        public void setNutrition(Integer calories, Integer proteinG, Integer pricePerServing, Integer healthScore) {
            this.calories = calories;
            this.proteinG = proteinG;
            this.pricePerServing = pricePerServing;
            this.healthScore = healthScore;
        }

        public List<String> getExpiringIngredients() { return expiringIngredients; }
        public void setExpiringIngredients(List<String> expiringIngredients) { this.expiringIngredients = expiringIngredients; }
        public int getIngredientCount() { return ingredientCount; }
        public void setIngredientCount(int ingredientCount) { this.ingredientCount = ingredientCount; }
        public boolean isNeedsOven() { return needsOven; }
        public void setNeedsOven(boolean needsOven) { this.needsOven = needsOven; }
    }

    public static class RecipeIngredientDetailDto {
        private Long idIngredient;
        private String ingredientName;
        private BigDecimal amount;
        private String unitSymbol;
        private boolean inUserInventory;
        // Lo que el usuario tiene en su alacena (null si no lo tiene)
        private Long idInventory;
        private BigDecimal inventoryQuantity;
        private Short inventoryIdUnit;
        private String inventoryUnitSymbol;
        /** Cantidad que usa la receta, expresada en la unidad de la alacena (null si no se puede convertir). */
        private BigDecimal amountInInventoryUnit;

        public RecipeIngredientDetailDto(Long idIngredient, String ingredientName,
                                         BigDecimal amount, String unitSymbol, boolean inUserInventory) {
            this.idIngredient = idIngredient;
            this.ingredientName = ingredientName;
            this.amount = amount;
            this.unitSymbol = unitSymbol;
            this.inUserInventory = inUserInventory;
        }

        public void setPantry(Long idInventory, BigDecimal quantity, Short idUnit, String unitSymbol, BigDecimal amountInUnit) {
            this.idInventory = idInventory;
            this.inventoryQuantity = quantity;
            this.inventoryIdUnit = idUnit;
            this.inventoryUnitSymbol = unitSymbol;
            this.amountInInventoryUnit = amountInUnit;
        }

        public Long getIdInventory() { return idInventory; }
        public BigDecimal getInventoryQuantity() { return inventoryQuantity; }
        public Short getInventoryIdUnit() { return inventoryIdUnit; }
        public String getInventoryUnitSymbol() { return inventoryUnitSymbol; }
        public BigDecimal getAmountInInventoryUnit() { return amountInInventoryUnit; }

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
        private List<String> steps;
        private Integer timePreparation;
        private Integer servings;
        private String urlImage;
        private String source;
        private List<String> diets;
        private List<RecipeIngredientDetailDto> ingredients;

        public RecipeDetailResponse(Long idRecipe, String titleRecipe, String instructions, List<String> steps,
                                    Integer timePreparation, Integer servings, String urlImage, String source,
                                    List<String> diets, List<RecipeIngredientDetailDto> ingredients) {
            this.idRecipe = idRecipe;
            this.titleRecipe = titleRecipe;
            this.instructions = instructions;
            this.steps = steps;
            this.timePreparation = timePreparation;
            this.servings = servings;
            this.urlImage = urlImage;
            this.source = source;
            this.diets = diets;
            this.ingredients = ingredients;
        }

        public Long getIdRecipe() { return idRecipe; }
        public String getTitleRecipe() { return titleRecipe; }
        public String getInstructions() { return instructions; }
        public List<String> getSteps() { return steps; }
        public Integer getTimePreparation() { return timePreparation; }
        public Integer getServings() { return servings; }
        public String getUrlImage() { return urlImage; }
        public String getSource() { return source; }
        public List<String> getDiets() { return diets; }
        public List<RecipeIngredientDetailDto> getIngredients() { return ingredients; }
    }
}
