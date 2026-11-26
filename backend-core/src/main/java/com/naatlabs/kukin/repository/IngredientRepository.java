package com.naatlabs.kukin.repository;

import com.naatlabs.kukin.entity.Ingredient;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface IngredientRepository extends JpaRepository<Ingredient, Long> {
    Page<Ingredient> findByNameEsContainingIgnoreCaseOrNameEnContainingIgnoreCase(
            String nameEs, String nameEn, Pageable pageable);
    List<Ingredient> findByNameEsContainingIgnoreCaseOrNameEnContainingIgnoreCase(String nameEs, String nameEn);

    Optional<Ingredient> findFirstByNameEnIgnoreCase(String nameEn);

    Optional<Ingredient> findByExternalId(String externalId);
}