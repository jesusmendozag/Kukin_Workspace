package com.naatlabs.kukin.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "ingredient_substitution")
public class IngredientSubstitution {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_sub")
    private Integer idSub;

    @Column(name = "name_en", nullable = false, unique = true, length = 100)
    private String nameEn;

    @Column(name = "name_mx", nullable = false, length = 100)
    private String nameMx;

    // Constructores
    public IngredientSubstitution() {}

    public IngredientSubstitution(String nameEn, String nameMx) {
        this.nameEn = nameEn;
        this.nameMx = nameMx;
    }

    // Getters y Setters
    public Integer getIdSub() {
        return idSub;
    }

    public void setIdSub(Integer idSub) {
        this.idSub = idSub;
    }

    public String getNameEn() {
        return nameEn;
    }

    public void setNameEn(String nameEn) {
        this.nameEn = nameEn;
    }

    public String getNameMx() {
        return nameMx;
    }

    public void setNameMx(String nameMx) {
        this.nameMx = nameMx;
    }
}