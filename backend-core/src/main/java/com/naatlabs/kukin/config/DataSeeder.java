package com.naatlabs.kukin.config;

import com.naatlabs.kukin.entity.Diet;
import com.naatlabs.kukin.entity.Ingredient;
import com.naatlabs.kukin.entity.Recipe;
import com.naatlabs.kukin.entity.RecipeIngredient;
import com.naatlabs.kukin.entity.Unit;
import com.naatlabs.kukin.repository.IngredientRepository;
import com.naatlabs.kukin.repository.RecipeRepository;
import com.naatlabs.kukin.repository.UnitRepository;
import jakarta.persistence.EntityManager;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.Map;

/**
 * Carga los catálogos base (unidades, ingredientes y algunas recetas propias) la primera vez
 * que se arranca con una base de datos vacía. Si las tablas ya tienen datos NO modifica nada.
 */
@Component
public class DataSeeder implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(DataSeeder.class);

    private final UnitRepository unitRepository;
    private final IngredientRepository ingredientRepository;
    private final RecipeRepository recipeRepository;
    private final EntityManager entityManager;

    public DataSeeder(UnitRepository unitRepository, IngredientRepository ingredientRepository,
                      RecipeRepository recipeRepository, EntityManager entityManager) {
        this.unitRepository = unitRepository;
        this.ingredientRepository = ingredientRepository;
        this.recipeRepository = recipeRepository;
        this.entityManager = entityManager;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (unitRepository.count() == 0) {
            seedUnits();
        }
        if (ingredientRepository.count() == 0) {
            seedIngredients();
        }
        if (recipeRepository.count() == 0 && unitRepository.count() > 0) {
            seedRecipes();
        }
    }

    private void seedUnits() {
        // El orden importa: la app asume 1 = pieza, 2 = gramo, 3 = mililitro
        String[][] units = {
            {"Pieza", "pza"}, {"Gramo", "g"}, {"Mililitro", "ml"},
            {"Kilogramo", "kg"}, {"Litro", "l"}, {"Taza", "tz"}, {"Cucharada", "cda"}
        };
        for (String[] u : units) {
            Unit unit = new Unit();
            unit.setName(u[0]);
            unit.setSymbol(u[1]);
            unitRepository.save(unit);
        }
        log.info("Catálogo de unidades inicial cargado ({} registros)", units.length);
    }

    private void seedIngredients() {
        // El orden importa: la app asume 1 = jitomate, 2 = cebolla, 3 = huevo, 4 = pollo
        String[][] ingredients = {
            {"Jitomate", "tomato", "Verduras"}, {"Cebolla", "onion", "Verduras"},
            {"Huevo", "egg", "Proteínas"}, {"Pollo", "chicken", "Proteínas"},
            {"Ajo", "garlic", "Verduras"}, {"Chile serrano", "serrano pepper", "Verduras"},
            {"Aguacate", "avocado", "Frutas"}, {"Limón", "lime", "Frutas"},
            {"Arroz", "rice", "Granos"}, {"Frijol", "beans", "Granos"},
            {"Tortilla de maíz", "corn tortilla", "Granos"}, {"Queso", "cheese", "Lácteos"},
            {"Leche", "milk", "Lácteos"}, {"Mantequilla", "butter", "Lácteos"},
            {"Papa", "potato", "Verduras"}, {"Zanahoria", "carrot", "Verduras"},
            {"Lechuga", "lettuce", "Verduras"}, {"Carne de res", "beef", "Proteínas"},
            {"Pasta", "pasta", "Granos"}, {"Cilantro", "cilantro", "Verduras"}
        };
        for (String[] i : ingredients) {
            Ingredient ing = new Ingredient();
            ing.setNameEs(i[0]);
            ing.setNameEn(i[1]);
            ing.setCategory(i[2]);
            ingredientRepository.save(ing);
        }
        log.info("Catálogo de ingredientes inicial cargado ({} registros)", ingredients.length);
    }

    private void seedRecipes() {
        Map<String, Ingredient> byEn = new HashMap<>();
        ingredientRepository.findAll().forEach(i -> byEn.put(i.getNameEn(), i));
        Map<String, Unit> bySymbol = new HashMap<>();
        unitRepository.findAll().forEach(u -> bySymbol.put(u.getSymbol(), u));

        Diet vegetarian = findOrCreateDiet("vegetarian");
        Diet glutenFree = findOrCreateDiet("gluten free");

        createRecipe("Huevos a la mexicana", 15,
                "Pica el jitomate, la cebolla y el chile serrano.\n"
                + "Sofríe la cebolla y el chile en un sartén con un poco de aceite.\n"
                + "Agrega el jitomate y cocina 2 minutos.\n"
                + "Añade los huevos batidos y mezcla hasta que estén cocidos.\n"
                + "Sazona con sal y sirve con tortillas.",
                null, // Sin foto: la app muestra una ilustración
                new Object[][] {{"egg", 4, "pza"}, {"tomato", 2, "pza"}, {"onion", 0.5, "pza"}, {"serrano pepper", 1, "pza"}},
                byEn, bySymbol, vegetarian, glutenFree);

        createRecipe("Pollo en salsa de jitomate", 35,
                "Cuece el pollo en agua con sal y un trozo de cebolla.\n"
                + "Licúa el jitomate con el ajo y el resto de la cebolla.\n"
                + "Fríe la salsa en una olla durante 5 minutos.\n"
                + "Agrega el pollo deshebrado y deja hervir 10 minutos más.",
                null, // Sin foto: la app muestra una ilustración
                new Object[][] {{"chicken", 500, "g"}, {"tomato", 3, "pza"}, {"onion", 1, "pza"}, {"garlic", 2, "pza"}},
                byEn, bySymbol, glutenFree);

        createRecipe("Guacamole tradicional", 10,
                "Machaca los aguacates en un molcajete.\n"
                + "Pica finamente el jitomate, la cebolla y el cilantro.\n"
                + "Mezcla todo con el jugo de limón y sal al gusto.",
                null, // Sin foto: la app muestra una ilustración
                new Object[][] {{"avocado", 2, "pza"}, {"tomato", 1, "pza"}, {"onion", 0.25, "pza"}, {"lime", 1, "pza"}, {"cilantro", 10, "g"}},
                byEn, bySymbol, vegetarian, glutenFree);

        log.info("Recetas propias iniciales cargadas (3 registros)");
    }

    /** La columna name de diet es única: se reutiliza la dieta si ya existe. */
    private Diet findOrCreateDiet(String name) {
        return entityManager.createQuery("SELECT d FROM Diet d WHERE d.name = :name", Diet.class)
                .setParameter("name", name)
                .getResultStream()
                .findFirst()
                .orElseGet(() -> {
                    Diet diet = new Diet();
                    diet.setName(name);
                    entityManager.persist(diet);
                    return diet;
                });
    }

    private void createRecipe(String title, int minutes, String instructions, String image, Object[][] items,
                              Map<String, Ingredient> byEn, Map<String, Unit> bySymbol, Diet... diets) {
        Recipe recipe = new Recipe();
        recipe.setTitleRecipe(title);
        recipe.setTimePreparation(minutes);
        recipe.setInstructions(instructions);
        recipe.setUrlImage(image);
        recipe.setSource(Recipe.SourceType.OWN);
        for (Object[] item : items) {
            Ingredient ingredient = byEn.get((String) item[0]);
            Unit unit = bySymbol.get((String) item[2]);
            if (ingredient == null || unit == null) continue; // Catálogo distinto al esperado: se omite
            RecipeIngredient ri = new RecipeIngredient();
            ri.setRecipe(recipe);
            ri.setIngredient(ingredient);
            ri.setUnit(unit);
            ri.setAmount(new BigDecimal(item[1].toString()));
            recipe.getIngredients().add(ri);
        }
        for (Diet d : diets) recipe.getDiets().add(d);
        recipeRepository.save(recipe);
    }
}
