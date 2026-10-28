package com.naatlabs.kukin.entity;

import jakarta.persistence.*;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Entity
@Table(name = "recipe")
public class Recipe {

    public enum SourceType { OWN, SPOONACULAR }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_recipe")
    private Long idRecipe;

    @Column(name = "title_recipe", nullable = false, length = 150)
    private String titleRecipe;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String instructions;

    @Column(name = "time_preparation", nullable = false)
    private Integer timePreparation;

    @Column(name = "url_image", length = 255)
    private String urlImage;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SourceType source = SourceType.OWN;

    @Column(name = "external_id", unique = true, length = 40)
    private String externalId;

    @OneToMany(mappedBy = "recipe", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<RecipeIngredient> ingredients = new ArrayList<>();

    @ManyToMany
    @JoinTable(
        name = "recipe_diet",
        joinColumns = @JoinColumn(name = "id_recipe"),
        inverseJoinColumns = @JoinColumn(name = "id_diet")
    )
    private Set<Diet> diets = new HashSet<>();

    public Long getIdRecipe() { return idRecipe; }
    public void setIdRecipe(Long idRecipe) { this.idRecipe = idRecipe; }
    public String getTitleRecipe() { return titleRecipe; }
    public void setTitleRecipe(String titleRecipe) { this.titleRecipe = titleRecipe; }
    public String getInstructions() { return instructions; }
    public void setInstructions(String instructions) { this.instructions = instructions; }
    public Integer getTimePreparation() { return timePreparation; }
    public void setTimePreparation(Integer timePreparation) { this.timePreparation = timePreparation; }
    public String getUrlImage() { return urlImage; }
    public void setUrlImage(String urlImage) { this.urlImage = urlImage; }
    public SourceType getSource() { return source; }
    public void setSource(SourceType source) { this.source = source; }
    public String getExternalId() { return externalId; }
    public void setExternalId(String externalId) { this.externalId = externalId; }
    public List<RecipeIngredient> getIngredients() { return ingredients; }
    public Set<Diet> getDiets() { return diets; }
}