package com.naatlabs.kukin.controller;

import com.naatlabs.kukin.dto.ApiResponse;
import com.naatlabs.kukin.dto.CatalogDtos;
import com.naatlabs.kukin.entity.Ingredient;
import com.naatlabs.kukin.repository.IngredientRepository;
import com.naatlabs.kukin.repository.UnitRepository;
import com.naatlabs.kukin.service.IngredientNames;
import com.naatlabs.kukin.service.TranslationService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/** Catálogos que la app usa para llenar los formularios (y alta de ingredientes que no estaban). */
@RestController
@RequestMapping("/api/v1")
public class CatalogController {

    private final IngredientRepository ingredientRepository;
    private final UnitRepository unitRepository;
    private final TranslationService translator;

    public CatalogController(IngredientRepository ingredientRepository, UnitRepository unitRepository,
                             TranslationService translator) {
        this.ingredientRepository = ingredientRepository;
        this.unitRepository = unitRepository;
        this.translator = translator;
    }

    @GetMapping("/ingredients")
    public ResponseEntity<ApiResponse<List<CatalogDtos.IngredientResponse>>> getIngredients() {
        List<CatalogDtos.IngredientResponse> data = ingredientRepository.findAll(Sort.by("nameEs")).stream()
                .map(i -> new CatalogDtos.IngredientResponse(i.getIdIngredient(), i.getNameEs(), i.getNameEn(), i.getCategory()))
                .toList();
        return ResponseEntity.ok(new ApiResponse<>(data));
    }

    /**
     * Agrega al catálogo un ingrediente que el usuario no encontró ("Jícama").
     * El nombre se limpia ("2 jícamas picadas" → "Jícamas") y, si ya existe con otro plural o acentos,
     * se regresa el existente en vez de crear un repetido. Responde 201 si se creó y 200 si ya existía.
     */
    @PostMapping("/ingredients")
    @Transactional
    public ResponseEntity<ApiResponse<CatalogDtos.IngredientResponse>> createIngredient(
            @Valid @RequestBody CatalogDtos.CreateIngredientRequest request) {
        String name = IngredientNames.clean(request.name().trim());
        String key = IngredientNames.key(name);
        Ingredient existing = ingredientRepository.findAll().stream()
                .filter(i -> IngredientNames.key(i.getNameEs()).equals(key))
                .findFirst().orElse(null);
        if (existing != null) {
            return ResponseEntity.ok(new ApiResponse<>(toResponse(existing)));
        }
        Ingredient created = new Ingredient();
        created.setNameEs(name);
        created.setNameEn(truncate(translator.toEnglish(name), 120));
        created.setCategory("Otros");
        created = ingredientRepository.save(created);
        return ResponseEntity.status(HttpStatus.CREATED).body(new ApiResponse<>(toResponse(created)));
    }

    private static CatalogDtos.IngredientResponse toResponse(Ingredient i) {
        return new CatalogDtos.IngredientResponse(i.getIdIngredient(), i.getNameEs(), i.getNameEn(), i.getCategory());
    }

    private static String truncate(String s, int max) {
        return s == null || s.length() <= max ? s : s.substring(0, max);
    }

    @GetMapping("/units")
    public ResponseEntity<ApiResponse<List<CatalogDtos.UnitResponse>>> getUnits() {
        List<CatalogDtos.UnitResponse> data = unitRepository.findAll(Sort.by("idUnit")).stream()
                .map(u -> new CatalogDtos.UnitResponse(u.getIdUnit(), u.getName(), u.getSymbol()))
                .toList();
        return ResponseEntity.ok(new ApiResponse<>(data));
    }
}
