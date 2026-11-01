package com.naatlabs.kukin.service;

import com.naatlabs.kukin.dto.RecipeDtos;
import com.naatlabs.kukin.entity.*;
import com.naatlabs.kukin.exception.KukinApiException;
import com.naatlabs.kukin.repository.*;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class RecipeService {

    private final RecipeRepository recipeRepository;
    private final InventoryRepository inventoryRepository;
    private final UserRepository userRepository;
    private final IngredientRepository ingredientRepository;
    private final UnitRepository unitRepository;
    private final DietRepository dietRepository;
    // INYECCIÓN DEL REPOSITORIO DE SUSTITUCIONES
    private final IngredientSubstitutionRepository substitutionRepo;

    public RecipeService(RecipeRepository recipeRepository, InventoryRepository inventoryRepository, 
                         UserRepository userRepository, IngredientRepository ingredientRepository, 
                         UnitRepository unitRepository, DietRepository dietRepository,
                         IngredientSubstitutionRepository substitutionRepo) {
        this.recipeRepository = recipeRepository;
        this.inventoryRepository = inventoryRepository;
        this.userRepository = userRepository;
        this.ingredientRepository = ingredientRepository;
        this.unitRepository = unitRepository;
        this.dietRepository = dietRepository;
        this.substitutionRepo = substitutionRepo;
    }

    // 1. Obtener todas las recetas del catálogo general
    @Transactional(readOnly = true)
    public List<RecipeDtos.RecipeSuggestionResponse> getAllRecipes() {
        List<Recipe> allRecipes = recipeRepository.findAllWithIngredients();
        return allRecipes.stream().map(recipe -> {
            List<String> dietNames = recipe.getDiets().stream().map(Diet::getName).collect(Collectors.toList());
            return new RecipeDtos.RecipeSuggestionResponse(
                    recipe.getIdRecipe(),
                    recipe.getTitleRecipe(),
                    recipe.getTimePreparation(),
                    recipe.getUrlImage(),
                    100, // Coincidencia base
                    new ArrayList<>(),
                    dietNames
            );
        }).collect(Collectors.toList());
    }

    // 2. Obtener el detalle de una receta específica
    @Transactional(readOnly = true)
    public RecipeDtos.RecipeDetailResponse getRecipeById(Long id) {
        Recipe recipe = recipeRepository.findById(id)
                .orElseThrow(() -> new KukinApiException(HttpStatus.NOT_FOUND, "RECIPE_NOT_FOUND", "La receta no existe"));

        List<String> dietNames = recipe.getDiets().stream().map(Diet::getName).collect(Collectors.toList());
        
        List<RecipeDtos.RecipeIngredientDetailDto> ingredients = recipe.getIngredients().stream().map(ri ->
                new RecipeDtos.RecipeIngredientDetailDto(
                        ri.getIngredient().getIdIngredient(),
                        ri.getIngredient().getNameEs(),
                        ri.getAmount(),
                        ri.getUnit().getSymbol(),
                        false 
                )
        ).collect(Collectors.toList());

        return new RecipeDtos.RecipeDetailResponse(
                recipe.getIdRecipe(),
                recipe.getTitleRecipe(),
                recipe.getInstructions(),
                recipe.getTimePreparation(),
                recipe.getUrlImage(),
                recipe.getSource().name(),
                dietNames,
                ingredients
        );
    }

    // 3. Lógica original de sugerencias por coincidencia
    @Transactional(readOnly = true)
    public List<RecipeDtos.RecipeSuggestionResponse> getSuggestions(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new KukinApiException(HttpStatus.NOT_FOUND, "USER_NOT_FOUND", "Usuario no encontrado"));

        List<Inventory> userInventory = inventoryRepository.findByUserIdUserOrderByExpirationDateAsc(user.getIdUser());
        Set<Long> userIngredientIds = userInventory.stream()
                .map(inv -> inv.getIngredient().getIdIngredient())
                .collect(Collectors.toSet());

        List<Recipe> allRecipes = recipeRepository.findAllWithIngredients();
        List<RecipeDtos.RecipeSuggestionResponse> suggestions = new ArrayList<>();

        for (Recipe recipe : allRecipes) {
            int totalIngredients = recipe.getIngredients().size();
            if (totalIngredients == 0) continue;

            int matchCount = 0;
            List<RecipeDtos.MissingIngredientDto> missing = new ArrayList<>();

            for (var reqIngredient : recipe.getIngredients()) {
                Long ingId = reqIngredient.getIngredient().getIdIngredient();
                if (userIngredientIds.contains(ingId)) {
                    matchCount++;
                } else {
                    missing.add(new RecipeDtos.MissingIngredientDto(ingId, reqIngredient.getIngredient().getNameEs()));
                }
            }

            int matchPercentage = (int) Math.round(((double) matchCount / totalIngredients) * 100);

            // SOLUCIÓN: Agregamos todas las recetas sin importar si tienes 0% o 100%, 
            // el sort de abajo se encargará de poner las mejores hasta arriba.
            List<String> dietNames = recipe.getDiets().stream().map(Diet::getName).collect(Collectors.toList());
            suggestions.add(new RecipeDtos.RecipeSuggestionResponse(
                    recipe.getIdRecipe(), recipe.getTitleRecipe(), recipe.getTimePreparation(),
                    recipe.getUrlImage(), matchPercentage, missing, dietNames
            ));
        }
        suggestions.sort((a, b) -> Integer.compare(b.getMatchPercentage(), a.getMatchPercentage()));
        return suggestions;
    }

    // --- INTERCEPTOR DE GASTRONOMÍA MEXICANA (VERSIÓN AUTOMATIZADA) ---
    private String getMexicanEquivalent(String englishName) {
        if (englishName == null) return null;
        
        // Java va a la base de datos automáticamente. 
        // Si existe un sustituto, lo devuelve. Si no, devuelve null y deja que Google lo traduzca.
        return substitutionRepo.findEquivalentMx(englishName).orElse(null);
    }

    // --- MICRO-TRADUCTOR CON GOOGLE TRANSLATE (GRATUITO Y SIN API KEY) ---
    private String translateEnToEs(String text) {
        if (text == null || text.trim().isEmpty()) return text;
        try {
            // Limpiamos comillas y HTML previo
            String cleanText = text.replaceAll("<[^>]*>", "").replace("\"", "");
            
            String url = "https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=es&dt=t&q=" 
                       + java.net.URLEncoder.encode(cleanText, java.nio.charset.StandardCharsets.UTF_8.toString());
            
            org.springframework.web.client.RestTemplate restTemplate = new org.springframework.web.client.RestTemplate();
            java.util.List response = restTemplate.getForObject(url, java.util.List.class);
            
            if (response != null && !response.isEmpty()) {
                java.util.List sentences = (java.util.List) response.get(0);
                StringBuilder translatedText = new StringBuilder();
                
                for (Object sentenceObj : sentences) {
                    java.util.List sentenceParts = (java.util.List) sentenceObj;
                    if (sentenceParts.get(0) != null) {
                        translatedText.append(sentenceParts.get(0).toString());
                    }
                }
                
                return translatedText.toString()
                        .replace("&amp;", "&")
                        .replace("&quot;", "\"")
                        .replace("&#39;", "'");
            }
        } catch (Exception e) {
            System.err.println("Error Google Translate: " + e.getMessage()); 
        }
        return text; 
    }

    private short mapSpoonacularUnitToLocal(String spoonacularUnit) {
        if (spoonacularUnit == null || spoonacularUnit.trim().isEmpty()) return 1; // pza por defecto
        
        String u = spoonacularUnit.toLowerCase().trim();
        
        if (u.equals("cup") || u.equals("cups") || u.equals("c")) return 4; 
        if (u.equals("tablespoon") || u.equals("tablespoons") || u.equals("tbsp") || u.equals("tbs") || u.equals("T")) return 5; 
        if (u.equals("teaspoon") || u.equals("teaspoons") || u.equals("tsp") || u.equals("t")) return 6; 
        if (u.equals("ounce") || u.equals("ounces") || u.equals("oz")) return 7; 
        if (u.equals("pound") || u.equals("pounds") || u.equals("lb") || u.equals("lbs")) return 8; 
        if (u.equals("clove") || u.equals("cloves")) return 9; 
        if (u.equals("pinch") || u.equals("pinches") || u.equals("dash")) return 10; 
        if (u.equals("can") || u.equals("cans")) return 11; 
        if (u.equals("kg") || u.equals("kilogram") || u.equals("kilograms")) return 12; 
        if (u.equals("l") || u.equals("liter") || u.equals("liters")) return 13; 
        if (u.equals("bunch") || u.equals("bunches")) return 14; 
        if (u.equals("g") || u.equals("gram") || u.equals("grams")) return 2; 
        if (u.equals("ml") || u.equals("milliliter") || u.equals("milliliters")) return 3; 
        
        return 1; // Fallback: Si manda algo rarísimo, lo dejamos como pieza (1)
    }

    // --- DESCUBRIDOR MEJORADO (CON MEMORIA LOCAL) ---
    @Transactional
    public void discoverAndSaveRecipesFromSpoonacular() {
        final String SPOONACULAR_API_KEY = "***ELIMINADO***";
        int randomOffset = new java.util.Random().nextInt(800);
        
        String url = "https://api.spoonacular.com/recipes/complexSearch?apiKey=" + SPOONACULAR_API_KEY 
                   + "&addRecipeInformation=true&fillIngredients=true&instructionsRequired=true&number=2&offset=" + randomOffset;
        
        org.springframework.web.client.RestTemplate restTemplate = new org.springframework.web.client.RestTemplate();
        
        try {
            @SuppressWarnings("unchecked")
            java.util.Map<String, Object> response = restTemplate.getForObject(url, java.util.Map.class);
            if (response == null || !response.containsKey("results")) return;
            
            @SuppressWarnings("unchecked")
            List<java.util.Map<String, Object>> results = (List<java.util.Map<String, Object>>) response.get("results");

            for (java.util.Map<String, Object> r : results) {
                String externalId = String.valueOf(r.get("id"));

                if (recipeRepository.existsByExternalId(externalId)) continue; 

                Recipe recipe = new Recipe();
                recipe.setExternalId(externalId);
                
                // 1. Título (1 Petición)
                String titleEn = String.valueOf(r.get("title"));
                recipe.setTitleRecipe(translateEnToEs(titleEn));
                
                recipe.setUrlImage(String.valueOf(r.get("image")));
                recipe.setTimePreparation(r.containsKey("readyInMinutes") ? (Integer) r.get("readyInMinutes") : 30);
                recipe.setSource(Recipe.SourceType.SPOONACULAR);

                // 2. Instrucciones: Armamos todo en inglés primero (1 Petición masiva)
                StringBuilder instructionsEn = new StringBuilder();
                if (r.containsKey("analyzedInstructions")) {
                    @SuppressWarnings("unchecked")
                    List<java.util.Map<String, Object>> analyzed = (List<java.util.Map<String, Object>>) r.get("analyzedInstructions");
                    if (!analyzed.isEmpty() && analyzed.get(0).containsKey("steps")) {
                        @SuppressWarnings("unchecked")
                        List<java.util.Map<String, Object>> steps = (List<java.util.Map<String, Object>>) analyzed.get(0).get("steps");
                        for (java.util.Map<String, Object> step : steps) {
                            instructionsEn.append(step.get("number")).append(". ").append(step.get("step")).append("\n");
                        }
                    }
                }
                
                if (instructionsEn.length() == 0 && r.containsKey("instructions") && r.get("instructions") != null) {
                    instructionsEn.append(String.valueOf(r.get("instructions")).replaceAll("<[^>]*>", ""));
                }
                
                String finalInstructions = translateEnToEs(instructionsEn.toString());
                if (finalInstructions.trim().isEmpty()) {
                    finalInstructions = "1. Reúne todos los ingredientes.\n2. Cocina a fuego medio.\n3. Sirve y disfruta.";
                }
                recipe.setInstructions(finalInstructions);

                // 3. Ingredientes: Proceso por Lotes (Batch)
                if (r.containsKey("extendedIngredients")) {
                    @SuppressWarnings("unchecked")
                    List<java.util.Map<String, Object>> extIngredients = (List<java.util.Map<String, Object>>) r.get("extendedIngredients");
                    
                    // PASO A: Extraer solo los que necesitan traducción
                    List<String> namesToTranslateEn = new ArrayList<>();
                    for (java.util.Map<String, Object> extIng : extIngredients) {
                        String ingEn = String.valueOf(extIng.get("name"));
                        if (getMexicanEquivalent(ingEn) == null && !namesToTranslateEn.contains(ingEn)) {
                            namesToTranslateEn.add(ingEn);
                        }
                    }

                    // PASO B: Traducir TODOS los ingredientes en 1 sola petición
                    java.util.Map<String, String> translatedCache = new java.util.HashMap<>();
                    if (!namesToTranslateEn.isEmpty()) {
                        String combinedEn = String.join("\n", namesToTranslateEn);
                        String combinedEs = translateEnToEs(combinedEn); // <-- AQUÍ OCURRE LA MAGIA (1 Petición)
                        String[] splitEs = combinedEs.split("\n");
                        
                        for (int i = 0; i < namesToTranslateEn.size(); i++) {
                            String translatedName = (i < splitEs.length) ? splitEs[i].trim() : namesToTranslateEn.get(i);
                            translatedCache.put(namesToTranslateEn.get(i), translatedName);
                        }
                    }
                    
                    // PASO C: Guardar en MySQL usando nuestro caché
                    java.util.Set<Long> addedIngredientsIds = new java.util.HashSet<>();
                    for (java.util.Map<String, Object> extIng : extIngredients) {
                        String ingNameEn = String.valueOf(extIng.get("name"));
                        
                        String localizedName = getMexicanEquivalent(ingNameEn);
                        final String ingNameEs = (localizedName != null) ? localizedName : translatedCache.getOrDefault(ingNameEn, ingNameEn); 
                        
                        Ingredient ingredient = ingredientRepository.findByNameEsContainingIgnoreCaseOrNameEnContainingIgnoreCase(ingNameEs, ingNameEn)
                                .stream().findFirst()
                                .orElseGet(() -> {
                                    Ingredient newIng = new Ingredient();
                                    newIng.setNameEs(ingNameEs);
                                    newIng.setNameEn(ingNameEn); 
                                    newIng.setCategory("Spoonacular"); 
                                    return ingredientRepository.save(newIng);
                                });

                        if (addedIngredientsIds.contains(ingredient.getIdIngredient())) continue;
                        addedIngredientsIds.add(ingredient.getIdIngredient());

                        String unitEn = extIng.containsKey("unit") ? String.valueOf(extIng.get("unit")) : "";
                        short localUnitId = mapSpoonacularUnitToLocal(unitEn);
                        Unit unit = unitRepository.findById(localUnitId).orElseGet(() -> unitRepository.findById((short) 1).orElseThrow());

                        RecipeIngredient detail = new RecipeIngredient();
                        detail.setRecipe(recipe);
                        detail.setIngredient(ingredient);
                        detail.setUnit(unit);
                        detail.setAmount(new java.math.BigDecimal(extIng.get("amount").toString()));
                        
                        recipe.getIngredients().add(detail);
                    }
                }
                recipeRepository.save(recipe);
            }
        } catch (Exception e) {
            throw new KukinApiException(org.springframework.http.HttpStatus.INTERNAL_SERVER_ERROR, "SPOONACULAR_SYNC_FAILED", "Error sincronizando recetas: " + e.getMessage());
        }
    }
}