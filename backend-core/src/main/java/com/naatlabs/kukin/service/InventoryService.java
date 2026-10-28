package com.naatlabs.kukin.service;

import com.naatlabs.kukin.dto.InventoryDtos;
import com.naatlabs.kukin.entity.Ingredient;
import com.naatlabs.kukin.entity.Inventory;
import com.naatlabs.kukin.entity.Unit;
import com.naatlabs.kukin.entity.User;
import com.naatlabs.kukin.exception.KukinApiException;
import com.naatlabs.kukin.repository.IngredientRepository;
import com.naatlabs.kukin.repository.InventoryRepository;
import com.naatlabs.kukin.repository.UnitRepository;
import com.naatlabs.kukin.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class InventoryService {

    private final InventoryRepository inventoryRepository;
    private final UserRepository userRepository;
    private final IngredientRepository ingredientRepository;
    private final UnitRepository unitRepository;

    public InventoryService(InventoryRepository inventoryRepository, UserRepository userRepository,
                            IngredientRepository ingredientRepository, UnitRepository unitRepository) {
        this.inventoryRepository = inventoryRepository;
        this.userRepository = userRepository;
        this.ingredientRepository = ingredientRepository;
        this.unitRepository = unitRepository;
    }

    @Transactional
    public InventoryDtos.InventoryCreatedResponse addIngredientToInventory(String email, InventoryDtos.AddInventoryRequest request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new KukinApiException(HttpStatus.NOT_FOUND, "USER_NOT_FOUND", "Usuario no encontrado"));

        Ingredient ingredient = ingredientRepository.findById(request.getIdIngredient())
                .orElseThrow(() -> new KukinApiException(HttpStatus.NOT_FOUND, "INGREDIENT_NOT_FOUND", "Ingrediente no encontrado"));

        Unit unit = unitRepository.findById(request.getIdUnit())
                .orElseThrow(() -> new KukinApiException(HttpStatus.NOT_FOUND, "UNIT_NOT_FOUND", "Unidad de medida no encontrada"));

        Optional<Inventory> existingItem = inventoryRepository.findByUserIdUserAndIngredientIdIngredient(user.getIdUser(), ingredient.getIdIngredient());

        Inventory inventory;
        if (existingItem.isPresent()) {
            inventory = existingItem.get();
            inventory.setQuantity(inventory.getQuantity().add(request.getQuantity()));
            inventory.setExpirationDate(request.getExpirationDate()); // Actualiza a la caducidad más reciente
        } else {
            inventory = new Inventory();
            inventory.setUser(user);
            inventory.setIngredient(ingredient);
            inventory.setUnit(unit);
            inventory.setQuantity(request.getQuantity());
            inventory.setExpirationDate(request.getExpirationDate());
        }

        Inventory savedInventory = inventoryRepository.save(inventory);

        return new InventoryDtos.InventoryCreatedResponse(
                savedInventory.getIdInventory(),
                ingredient.getIdIngredient(),
                savedInventory.getDateRegistration()
            );
    }

    @Transactional(readOnly = true)
    public List<InventoryDtos.InventoryItemResponse> getUserInventory(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new KukinApiException(HttpStatus.NOT_FOUND, "USER_NOT_FOUND", "Usuario no encontrado"));

        List<Inventory> items = inventoryRepository.findByUserIdUserOrderByExpirationDateAsc(user.getIdUser());

        return items.stream().map(item -> new InventoryDtos.InventoryItemResponse(
                item.getIdInventory(),
                item.getIngredient().getIdIngredient(),
                item.getIngredient().getNameEs(),
                item.getIngredient().getCategory(),
                item.getQuantity(),
                item.getUnit().getIdUnit(),
                item.getUnit().getSymbol(),
                item.getExpirationDate(),
                item.getDateRegistration()
        )).collect(Collectors.toList());
    }
}