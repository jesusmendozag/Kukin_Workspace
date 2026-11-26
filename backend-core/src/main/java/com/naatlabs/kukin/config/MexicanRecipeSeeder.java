package com.naatlabs.kukin.config;

import com.naatlabs.kukin.entity.Ingredient;
import com.naatlabs.kukin.entity.Recipe;
import com.naatlabs.kukin.entity.RecipeIngredient;
import com.naatlabs.kukin.entity.Unit;
import com.naatlabs.kukin.repository.IngredientRepository;
import com.naatlabs.kukin.repository.RecipeRepository;
import com.naatlabs.kukin.repository.UnitRepository;
import com.naatlabs.kukin.service.IngredientNames;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

/**
 * Recetario casero mexicano propio (no depende de Spoonacular): platillos baratos y conocidos para
 * estudiantes foráneos y para cocinar en casa. Se agrega al arrancar si falta; si ya está, no hace nada.
 *
 * Calorías, proteína y costo por porción son aproximados (porción casera típica). El costo va en centavos de
 * dólar para compararse igual que las recetas de Spoonacular en el filtro "Económicas".
 */
@Component
public class MexicanRecipeSeeder {

    private static final Logger log = LoggerFactory.getLogger(MexicanRecipeSeeder.class);

    /** Ingrediente de la receta: nombre en español, nombre en inglés (para cruzar con Spoonacular), cantidad y unidad. */
    private record Ing(String es, String en, String amount, String unit) {}

    private record Dish(String code, String title, int minutes, int servings, int kcal, int protein, int priceCents,
                        List<Ing> ingredients, List<String> steps) {}

    private static Ing i(String es, String en, String amount, String unit) { return new Ing(es, en, amount, unit); }

    private static final List<Dish> DISHES = List.of(
        new Dish("MX-01", "Huevo a la mexicana", 15, 2, 260, 14, 60, List.of(
                i("Huevo", "egg", "4", "pza"), i("Jitomate", "tomato", "1", "pza"), i("Cebolla", "onion", "0.25", "pza"),
                i("Chile serrano", "serrano chile", "1", "pza"), i("Aceite vegetal", "vegetable oil", "1", "cda"), i("Sal", "salt", "1", "pizca")),
            List.of("Pica el jitomate, la cebolla y el chile serrano en cuadritos.",
                "Calienta el aceite en un sartén a fuego medio y sofríe la cebolla y el chile por 2 minutos.",
                "Agrega el jitomate y cocina 3 minutos, hasta que suelte su jugo.",
                "Bate los huevos con una pizca de sal, viértelos al sartén y mueve con una pala hasta que cuajen, unos 3 minutos.",
                "Sirve caliente con tortillas y frijoles.")),
        new Dish("MX-02", "Frijoles de la olla", 150, 6, 230, 14, 35, List.of(
                i("Frijoles", "pinto beans", "500", "g"), i("Cebolla", "onion", "0.5", "pza"), i("Ajo", "garlic", "2", "diente"),
                i("Epazote", "epazote", "1", "manojo"), i("Sal", "salt", "1", "cdta")),
            List.of("Limpia los frijoles quitando piedritas y enjuágalos bien.",
                "Ponlos en una olla con 2.5 litros de agua, la cebolla y el ajo.",
                "Cocina a fuego bajo con la olla tapada por 2 horas, agregando agua caliente si se secan.",
                "Cuando estén suaves, agrega la sal y el epazote y cocina 15 minutos más.",
                "Sírvelos en su caldo o guárdalos para refritos. Duran 4 días en el refri.")),
        new Dish("MX-03", "Sopa de fideo", 25, 4, 210, 6, 45, List.of(
                i("Fideo", "vermicelli", "200", "g"), i("Jitomate", "tomato", "3", "pza"), i("Cebolla", "onion", "0.25", "pza"),
                i("Ajo", "garlic", "1", "diente"), i("Caldo de pollo", "chicken broth", "1", "L"),
                i("Aceite vegetal", "vegetable oil", "2", "cda"), i("Sal", "salt", "1", "pizca")),
            List.of("Licúa el jitomate, la cebolla y el ajo con una taza del caldo.",
                "Calienta el aceite en una olla y dora el fideo moviendo seguido por 3 minutos, hasta que esté dorado.",
                "Vierte lo licuado colándolo y deja que hierva 2 minutos.",
                "Agrega el resto del caldo y la sal. Cocina a fuego medio 10 minutos, hasta que el fideo esté suave.",
                "Sirve con limón, crema o aguacate si tienes.")),
        new Dish("MX-04", "Chilaquiles rojos", 25, 2, 520, 16, 90, List.of(
                i("Tortillas de maíz", "corn tortillas", "8", "pza"), i("Jitomate", "tomato", "3", "pza"),
                i("Chile guajillo", "guajillo chile", "2", "pza"), i("Cebolla", "onion", "0.5", "pza"), i("Ajo", "garlic", "1", "diente"),
                i("Crema", "cream", "4", "cda"), i("Queso fresco", "queso fresco", "50", "g"),
                i("Aceite vegetal", "vegetable oil", "3", "cda"), i("Sal", "salt", "1", "pizca")),
            List.of("Corta las tortillas en triángulos y dóralas en el aceite hasta que estén crujientes. Escúrrelas en servilleta.",
                "Hierve los jitomates y los chiles guajillo sin semillas por 10 minutos.",
                "Licúalos con un trozo de cebolla, el ajo, sal y un poco del agua donde se cocieron.",
                "Calienta la salsa en un sartén 5 minutos y agrega los totopos. Mezcla 1 minuto para que se impregnen.",
                "Sirve con crema, queso fresco desmoronado y cebolla en rodajas.")),
        new Dish("MX-05", "Arroz rojo", 35, 4, 240, 4, 30, List.of(
                i("Arroz blanco", "white rice", "1", "tz"), i("Jitomate", "tomato", "2", "pza"), i("Cebolla", "onion", "0.25", "pza"),
                i("Ajo", "garlic", "1", "diente"), i("Caldo de pollo", "chicken broth", "2", "tz"),
                i("Aceite vegetal", "vegetable oil", "2", "cda"), i("Sal", "salt", "1", "pizca")),
            List.of("Enjuaga el arroz hasta que el agua salga clara y escúrrelo bien.",
                "Fríe el arroz en el aceite a fuego medio, moviendo, por 5 minutos hasta que se vea dorado.",
                "Licúa el jitomate, la cebolla y el ajo, cuélalo y agrégalo al arroz. Cocina 2 minutos.",
                "Agrega el caldo y la sal. Cuando hierva, baja el fuego al mínimo, tapa y cocina 20 minutos sin destapar.",
                "Apaga el fuego y deja reposar tapado 5 minutos. Esponja con un tenedor.")),
        new Dish("MX-06", "Quesadillas", 10, 2, 380, 18, 70, List.of(
                i("Tortillas de maíz", "corn tortillas", "6", "pza"), i("Queso Oaxaca", "oaxaca cheese", "150", "g")),
            List.of("Calienta un comal o sartén a fuego medio.",
                "Deshebra el queso Oaxaca.",
                "Pon una tortilla en el comal, agrega queso en la mitad y dóblala.",
                "Cocina 2 minutos por lado, hasta que el queso se derrita y la tortilla esté doradita.",
                "Sirve con la salsa que tengas.")),
        new Dish("MX-07", "Tacos dorados de papa", 30, 4, 420, 8, 50, List.of(
                i("Papas", "potatoes", "4", "pza"), i("Tortillas de maíz", "corn tortillas", "12", "pza"),
                i("Aceite vegetal", "vegetable oil", "4", "cda"), i("Lechuga", "lettuce", "0.25", "pza"),
                i("Crema", "cream", "4", "cda"), i("Sal", "salt", "1", "cdta")),
            List.of("Pela las papas y hiérvelas en agua con sal por 20 minutos, hasta que estén suaves.",
                "Machácalas con un tenedor y sazona con sal.",
                "Calienta las tortillas para que no se rompan, rellénalas de papa y enróllalas.",
                "Fríe los tacos en el aceite caliente 3 minutos por lado, hasta que estén dorados. Escúrrelos en servilleta.",
                "Sirve con lechuga picada, crema y salsa.")),
        new Dish("MX-08", "Molletes", 15, 2, 450, 19, 70, List.of(
                i("Bolillo / Telera", "bread rolls", "2", "pza"), i("Frijoles", "pinto beans", "1", "tz"),
                i("Queso Manchego", "manchego cheese", "100", "g"), i("Jitomate", "tomato", "1", "pza"),
                i("Cebolla", "onion", "0.25", "pza"), i("Chile serrano", "serrano chile", "1", "pza")),
            List.of("Parte los bolillos a la mitad y quítales un poco de migajón.",
                "Úntales frijoles refritos y cúbrelos con queso rallado.",
                "Cocínalos en un sartén tapado a fuego bajo por 8 minutos, hasta que el queso se derrita.",
                "Mientras, pica jitomate, cebolla y chile para el pico de gallo y ponle sal.",
                "Sirve los molletes con el pico de gallo encima.")),
        new Dish("MX-09", "Calabacitas a la mexicana", 25, 4, 130, 4, 45, List.of(
                i("Calabacita", "zucchini", "4", "pza"), i("Jitomate", "tomato", "2", "pza"), i("Cebolla", "onion", "0.5", "pza"),
                i("Maíz", "corn", "1", "tz"), i("Ajo", "garlic", "1", "diente"),
                i("Aceite vegetal", "vegetable oil", "1", "cda"), i("Sal", "salt", "1", "pizca")),
            List.of("Corta las calabacitas en cubos y pica el jitomate, la cebolla y el ajo.",
                "Sofríe la cebolla y el ajo en el aceite por 2 minutos.",
                "Agrega el jitomate y cocina 3 minutos.",
                "Añade las calabacitas, el elote y la sal. Tapa y cocina a fuego bajo 12 minutos, hasta que estén suaves.",
                "Sirve como guarnición o en tacos con queso.")),
        new Dish("MX-10", "Tinga de pollo", 40, 4, 330, 30, 120, List.of(
                i("Pechuga de pollo", "chicken breast", "500", "g"), i("Jitomate", "tomato", "3", "pza"),
                i("Cebolla", "onion", "1", "pza"), i("Chile chipotle", "chipotle chile", "2", "pza"), i("Ajo", "garlic", "2", "diente"),
                i("Aceite vegetal", "vegetable oil", "2", "cda"), i("Tostadas", "tostadas", "8", "pza"), i("Sal", "salt", "1", "cdta")),
            List.of("Cuece la pechuga en agua con sal, un ajo y un trozo de cebolla por 25 minutos. Deja enfriar y deshébrala.",
                "Licúa los jitomates con los chiles chipotles y el otro ajo.",
                "Fríe la cebolla en tiras en el aceite por 4 minutos, hasta que esté transparente.",
                "Agrega la salsa y cocina 5 minutos. Añade el pollo y cocina 5 minutos más.",
                "Sirve sobre tostadas con crema, lechuga y queso.")),
        new Dish("MX-11", "Enfrijoladas", 20, 2, 480, 20, 60, List.of(
                i("Tortillas de maíz", "corn tortillas", "6", "pza"), i("Frijoles", "pinto beans", "2", "tz"),
                i("Queso fresco", "queso fresco", "60", "g"), i("Crema", "cream", "4", "cda"),
                i("Cebolla", "onion", "0.25", "pza"), i("Aceite vegetal", "vegetable oil", "1", "cda")),
            List.of("Licúa los frijoles cocidos con un poco de su caldo hasta que queden como salsa espesa.",
                "Calienta la salsa de frijol en un sartén 5 minutos y sazona con sal.",
                "Pasa las tortillas por el aceite caliente unos segundos para suavizarlas.",
                "Sumerge cada tortilla en la salsa de frijol y dóblala en cuatro.",
                "Sirve con crema, queso fresco y cebolla picada.")),
        new Dish("MX-12", "Picadillo", 35, 4, 360, 24, 130, List.of(
                i("Carne molida", "ground beef", "500", "g"), i("Papas", "potatoes", "2", "pza"), i("Zanahoria", "carrot", "2", "pza"),
                i("Jitomate", "tomato", "2", "pza"), i("Cebolla", "onion", "0.5", "pza"), i("Ajo", "garlic", "2", "diente"),
                i("Aceite vegetal", "vegetable oil", "1", "cda"), i("Sal", "salt", "1", "cdta")),
            List.of("Pela y corta la papa y la zanahoria en cubos chiquitos.",
                "Fríe la carne en el aceite a fuego alto por 6 minutos, deshaciéndola con la pala.",
                "Licúa el jitomate con la cebolla y el ajo y agrégalo a la carne.",
                "Añade la papa, la zanahoria, la sal y media taza de agua. Tapa y cocina a fuego bajo 15 minutos.",
                "Sirve con arroz y tortillas, o en tacos.")),
        new Dish("MX-13", "Avena con plátano y canela", 10, 2, 290, 10, 35, List.of(
                i("Avena", "oats", "1", "tz"), i("Leche", "milk", "2", "tz"), i("Plátano", "banana", "1", "pza"),
                i("Canela", "cinnamon", "1", "cdta"), i("Azúcar", "sugar", "2", "cda")),
            List.of("Pon la leche con la canela a calentar en una olla a fuego medio.",
                "Cuando empiece a hervir, agrega la avena y el azúcar.",
                "Cocina moviendo por 5 minutos, hasta que espese.",
                "Sirve con el plátano en rodajas encima.")),
        new Dish("MX-14", "Sincronizadas", 10, 2, 420, 22, 90, List.of(
                i("Tortillas de harina", "flour tortillas", "4", "pza"), i("Jamón", "ham", "4", "pza"),
                i("Queso Oaxaca", "oaxaca cheese", "100", "g")),
            List.of("Pon una tortilla de harina en el sartén a fuego medio.",
                "Agrega queso, dos rebanadas de jamón y más queso.",
                "Tapa con otra tortilla y cocina 2 minutos por lado, hasta que el queso se derrita.",
                "Corta en triángulos y sirve con guacamole o salsa."))
    );

    private final RecipeRepository recipeRepository;
    private final IngredientRepository ingredientRepository;
    private final UnitRepository unitRepository;

    public MexicanRecipeSeeder(RecipeRepository recipeRepository, IngredientRepository ingredientRepository,
                               UnitRepository unitRepository) {
        this.recipeRepository = recipeRepository;
        this.ingredientRepository = ingredientRepository;
        this.unitRepository = unitRepository;
    }

    /** Corre después de la limpieza del catálogo, para reutilizar los ingredientes ya unidos. */
    @EventListener(ApplicationReadyEvent.class)
    @Order(10)
    @Transactional
    public void seed() {
        try {
            Map<String, Ingredient> catalog = new HashMap<>();
            for (Ingredient ing : ingredientRepository.findAll()) catalog.putIfAbsent(IngredientNames.key(ing.getNameEs()), ing);
            Map<String, Unit> units = new HashMap<>();
            for (Unit u : unitRepository.findAll()) units.put(u.getSymbol().toLowerCase(Locale.ROOT), u);

            int added = 0;
            for (Dish dish : DISHES) {
                String code = "KUKIN-" + dish.code();
                if (recipeRepository.findByExternalId(code).isPresent()) continue;
                Recipe recipe = new Recipe();
                recipe.setExternalId(code);
                recipe.setSource(Recipe.SourceType.OWN);
                recipe.setTitleRecipe(dish.title());
                recipe.setTimePreparation(dish.minutes());
                recipe.setServings(dish.servings());
                recipe.setCalories(dish.kcal());
                recipe.setProteinG(dish.protein());
                recipe.setPricePerServing(dish.priceCents());
                recipe.setInstructions(String.join("\n", dish.steps()));
                for (Ing ing : dish.ingredients()) {
                    RecipeIngredient detail = new RecipeIngredient();
                    detail.setRecipe(recipe);
                    detail.setIngredient(catalog.computeIfAbsent(IngredientNames.key(ing.es()), k -> createIngredient(ing)));
                    detail.setUnit(units.getOrDefault(ing.unit().toLowerCase(Locale.ROOT), units.get("pza")));
                    detail.setAmount(new BigDecimal(ing.amount()));
                    recipe.getIngredients().add(detail);
                }
                recipeRepository.save(recipe);
                added++;
            }
            if (added > 0) log.info("Recetario mexicano: {} recetas agregadas", added);
        } catch (RuntimeException e) {
            log.warn("No se pudo cargar el recetario mexicano: {}", e.getMessage());
        }
    }

    private Ingredient createIngredient(Ing ing) {
        Ingredient created = new Ingredient();
        created.setNameEs(ing.es());
        created.setNameEn(ing.en());
        created.setCategory("Otros");
        return ingredientRepository.save(created);
    }
}
