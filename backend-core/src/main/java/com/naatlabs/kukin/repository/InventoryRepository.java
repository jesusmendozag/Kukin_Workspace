package com.naatlabs.kukin.repository;

import com.naatlabs.kukin.entity.Inventory;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface InventoryRepository extends JpaRepository<Inventory, Long> {
    List<Inventory> findByUserIdUserOrderByExpirationDateAsc(Long idUser);
    boolean existsByUserIdUserAndIngredientIdIngredient(Long idUser, Long idIngredient);
    Optional<Inventory> findByUserIdUserAndIngredientIdIngredient(Long idUser, Long idIngredient);
}