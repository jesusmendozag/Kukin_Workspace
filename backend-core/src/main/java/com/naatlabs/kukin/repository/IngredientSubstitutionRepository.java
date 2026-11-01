package com.naatlabs.kukin.repository;

import com.naatlabs.kukin.entity.IngredientSubstitution;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface IngredientSubstitutionRepository extends JpaRepository<IngredientSubstitution, Integer> {
    
    // El @Param es clave para que Spring Boot enlace correctamente la variable en la consulta
    @Query("SELECT s.nameMx FROM IngredientSubstitution s WHERE LOWER(s.nameEn) = LOWER(:nameEn)")
    Optional<String> findEquivalentMx(@Param("nameEn") String nameEn);
}