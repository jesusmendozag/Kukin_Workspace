package com.naatlabs.kukin.repository;

import com.naatlabs.kukin.entity.Recipe;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface RecipeRepository extends JpaRepository<Recipe, Long> {

    @Query("SELECT DISTINCT r FROM Recipe r LEFT JOIN FETCH r.ingredients ri LEFT JOIN FETCH ri.ingredient")
    List<Recipe> findAllWithIngredients();

    @Query("SELECT DISTINCT r FROM Recipe r JOIN r.diets d LEFT JOIN FETCH r.ingredients ri LEFT JOIN FETCH ri.ingredient WHERE LOWER(d.name) = LOWER(:dietName)")
    List<Recipe> findByDietNameWithIngredients(@Param("dietName") String dietName);
}