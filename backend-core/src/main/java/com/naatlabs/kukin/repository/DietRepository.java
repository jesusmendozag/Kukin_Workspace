package com.naatlabs.kukin.repository;

import com.naatlabs.kukin.entity.Diet;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface DietRepository extends JpaRepository<Diet, Short> {
    Optional<Diet> findByNameIgnoreCase(String name);
}