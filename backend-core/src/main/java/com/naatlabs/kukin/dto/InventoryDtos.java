package com.naatlabs.kukin.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

public class InventoryDtos {

    public static class AddInventoryRequest {
        @NotNull(message = "id_ingredient es obligatorio")
        private Long idIngredient;

        @NotNull(message = "quantity es obligatoria")
        @DecimalMin(value = "0.01", message = "La cantidad debe ser mayor a 0")
        private BigDecimal quantity;

        @NotNull(message = "id_unit es obligatorio")
        private Short idUnit;

        private LocalDate expirationDate;

        public Long getIdIngredient() { return idIngredient; }
        public void setIdIngredient(Long idIngredient) { this.idIngredient = idIngredient; }
        public BigDecimal getQuantity() { return quantity; }
        public void setQuantity(BigDecimal quantity) { this.quantity = quantity; }
        public Short getIdUnit() { return idUnit; }
        public void setIdUnit(Short idUnit) { this.idUnit = idUnit; }
        public LocalDate getExpirationDate() { return expirationDate; }
        public void setExpirationDate(LocalDate expirationDate) { this.expirationDate = expirationDate; }
    }

    public static class InventoryCreatedResponse {
        private Long idInventory;
        private Long idIngredient;
        private Instant dateRegistration;

        public InventoryCreatedResponse(Long idInventory, Long idIngredient, Instant dateRegistration) {
            this.idInventory = idInventory;
            this.idIngredient = idIngredient;
            this.dateRegistration = dateRegistration;
        }

        public Long getIdInventory() { return idInventory; }
        public Long getIdIngredient() { return idIngredient; }
        public Instant getDateRegistration() { return dateRegistration; }
    }

    public static class InventoryItemResponse {
        private Long idInventory;
        private Long idIngredient;
        private String ingredientName;
        private String category;
        private BigDecimal quantity;
        private Short idUnit;
        private String unitSymbol;
        private LocalDate expirationDate;
        private Instant dateRegistration;

        public InventoryItemResponse(Long idInventory, Long idIngredient, String ingredientName,
                                     String category, BigDecimal quantity, Short idUnit,
                                     String unitSymbol, LocalDate expirationDate, Instant dateRegistration) {
            this.idInventory = idInventory;
            this.idIngredient = idIngredient;
            this.ingredientName = ingredientName;
            this.category = category;
            this.quantity = quantity;
            this.idUnit = idUnit;
            this.unitSymbol = unitSymbol;
            this.expirationDate = expirationDate;
            this.dateRegistration = dateRegistration;
        }

        public Long getIdInventory() { return idInventory; }
        public Long getIdIngredient() { return idIngredient; }
        public String getIngredientName() { return ingredientName; }
        public String getCategory() { return category; }
        public BigDecimal getQuantity() { return quantity; }
        public Short getIdUnit() { return idUnit; }
        public String getUnitSymbol() { return unitSymbol; }
        public LocalDate getExpirationDate() { return expirationDate; }
        public Instant getDateRegistration() { return dateRegistration; }
    }
}