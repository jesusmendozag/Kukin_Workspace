package com.naatlabs.kukin;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.time.LocalDate;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Pruebas de integración de la API completa (seguridad + controladores + servicios + JPA)
 * usando la base de datos H2 en memoria del perfil "demo". No tocan MySQL ni llaman a Spoonacular.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("demo")
@TestPropertySource(properties = {
        "kukin.spoonacular.api-key=",          // Fuerza el uso de recetas propias (sin red)
        "kukin.jwt.secret=clave-de-pruebas-automatizadas-de-32-bytes-o-mas"
})
class KukinApiIntegrationTest {

    private static final String API = "/api/v1";

    @Autowired private MockMvc mvc;
    @Autowired private ObjectMapper mapper;

    // ------------------------------------------------------------------ helpers

    private String uniqueEmail() {
        return "test-" + UUID.randomUUID() + "@kukin.app";
    }

    private String register(String email) throws Exception {
        MvcResult res = mvc.perform(post(API + "/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Usuario Prueba\",\"email\":\"" + email + "\",\"password\":\"Kukin2026\"}"))
                .andExpect(status().isCreated())
                .andReturn();
        return json(res).path("data").path("token").asText();
    }

    private JsonNode json(MvcResult res) throws Exception {
        return mapper.readTree(res.getResponse().getContentAsString(java.nio.charset.StandardCharsets.UTF_8));
    }

    private long addToInventory(String token, long idIngredient) throws Exception {
        String body = "{\"id_ingredient\":" + idIngredient + ",\"quantity\":3,\"id_unit\":1,\"expiration_date\":\""
                + LocalDate.now().plusDays(5) + "\"}";
        MvcResult res = mvc.perform(post(API + "/inventory")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isCreated())
                .andReturn();
        return json(res).path("data").path("id_inventory").asLong();
    }

    // ------------------------------------------------------------------ autenticación

    @Test
    @DisplayName("Registro devuelve 201 con token JWT")
    void registerReturnsToken() throws Exception {
        String token = register(uniqueEmail());
        assertThat(token).isNotBlank().contains(".");
    }

    @Test
    @DisplayName("Registro con correo duplicado devuelve 409")
    void duplicateEmailReturnsConflict() throws Exception {
        String email = uniqueEmail();
        register(email);
        mvc.perform(post(API + "/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Otro\",\"email\":\"" + email + "\",\"password\":\"Kukin2026\"}"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("EMAIL_ALREADY_EXISTS"));
    }

    @Test
    @DisplayName("Contraseña débil devuelve 422 con detalle de validación")
    void weakPasswordReturnsValidationError() throws Exception {
        mvc.perform(post(API + "/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"X\",\"email\":\"" + uniqueEmail() + "\",\"password\":\"123\"}"))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"))
                .andExpect(jsonPath("$.details").isNotEmpty());
    }

    @Test
    @DisplayName("Login correcto devuelve token; contraseña incorrecta devuelve 401")
    void loginFlow() throws Exception {
        String email = uniqueEmail();
        register(email);

        mvc.perform(post(API + "/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"" + email + "\",\"password\":\"Kukin2026\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.token").isNotEmpty())
                .andExpect(jsonPath("$.data.expires_in").value(3600));

        mvc.perform(post(API + "/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"" + email + "\",\"password\":\"incorrecta1\"}"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("INVALID_CREDENTIALS"));
    }

    @Test
    @DisplayName("Endpoints protegidos sin token o con token inválido devuelven 401")
    void protectedEndpointsRequireToken() throws Exception {
        mvc.perform(get(API + "/inventory")).andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("UNAUTHORIZED"));
        mvc.perform(get(API + "/inventory").header("Authorization", "Bearer token.falso.123"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("CORS permite el origen de la app móvil (Capacitor)")
    void corsAllowsCapacitorOrigin() throws Exception {
        mvc.perform(options(API + "/auth/login")
                        .header("Origin", "capacitor://localhost")
                        .header("Access-Control-Request-Method", "POST"))
                .andExpect(status().isOk())
                .andExpect(header().string("Access-Control-Allow-Origin", "capacitor://localhost"));

        // Un sitio ajeno no está autorizado
        mvc.perform(options(API + "/auth/login")
                        .header("Origin", "https://sitio-malicioso.example")
                        .header("Access-Control-Request-Method", "POST"))
                .andExpect(status().isForbidden());
    }

    // ------------------------------------------------------------------ perfil y catálogos

    @Test
    @DisplayName("GET /users/me devuelve los datos del usuario autenticado")
    void profileReturnsCurrentUser() throws Exception {
        String email = uniqueEmail();
        String token = register(email);
        mvc.perform(get(API + "/users/me").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.email").value(email))
                .andExpect(jsonPath("$.data.name").value("Usuario Prueba"))
                .andExpect(jsonPath("$.data.type_plan").value("FREE"));
    }

    @Test
    @DisplayName("Catálogos de ingredientes y unidades vienen precargados")
    void catalogsAreSeeded() throws Exception {
        String token = register(uniqueEmail());
        mvc.perform(get(API + "/ingredients").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.length()", org.hamcrest.Matchers.greaterThanOrEqualTo(20))) // + los del recetario mexicano
                .andExpect(jsonPath("$.data[0].name_es").isNotEmpty());
        mvc.perform(get(API + "/units").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].symbol").value("pza"));
    }

    // ------------------------------------------------------------------ inventario

    @Test
    @DisplayName("Agregar, listar y eliminar ingredientes del inventario")
    void inventoryCrud() throws Exception {
        String token = register(uniqueEmail());
        long idInventory = addToInventory(token, 3); // Huevo

        mvc.perform(get(API + "/inventory").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.length()").value(1))
                .andExpect(jsonPath("$.data[0].ingredient_name").value("Huevo"))
                .andExpect(jsonPath("$.data[0].unit_symbol").value("pza"));

        // Agregar el mismo ingrediente suma la cantidad en lugar de duplicar
        addToInventory(token, 3);
        mvc.perform(get(API + "/inventory").header("Authorization", "Bearer " + token))
                .andExpect(jsonPath("$.data.length()").value(1))
                .andExpect(jsonPath("$.data[0].quantity").value(6.0));

        mvc.perform(delete(API + "/inventory/" + idInventory).header("Authorization", "Bearer " + token))
                .andExpect(status().isNoContent());
        mvc.perform(get(API + "/inventory").header("Authorization", "Bearer " + token))
                .andExpect(jsonPath("$.data.length()").value(0));
    }

    @Test
    @DisplayName("Un usuario no puede borrar el inventario de otro (404)")
    void cannotDeleteOtherUsersInventory() throws Exception {
        String owner = register(uniqueEmail());
        String intruder = register(uniqueEmail());
        long idInventory = addToInventory(owner, 1);

        mvc.perform(delete(API + "/inventory/" + idInventory).header("Authorization", "Bearer " + intruder))
                .andExpect(status().isNotFound());
        mvc.perform(get(API + "/inventory").header("Authorization", "Bearer " + owner))
                .andExpect(jsonPath("$.data.length()").value(1));
    }

    @Test
    @DisplayName("Cantidad inválida devuelve 422 y fecha mal formada devuelve 400")
    void inventoryValidation() throws Exception {
        String token = register(uniqueEmail());
        mvc.perform(post(API + "/inventory").header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"id_ingredient\":1,\"quantity\":0,\"id_unit\":1}"))
                .andExpect(status().isUnprocessableEntity());
        mvc.perform(post(API + "/inventory").header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"id_ingredient\":1,\"quantity\":2,\"id_unit\":1,\"expiration_date\":\"31/12/2026\"}"))
                .andExpect(status().isBadRequest());
        mvc.perform(post(API + "/inventory").header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"id_ingredient\":9999,\"quantity\":2,\"id_unit\":1}"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("INGREDIENT_NOT_FOUND"));
    }

    // ------------------------------------------------------------------ recetas

    @Test
    @DisplayName("Sugerencias usan el inventario y el detalle trae pasos e ingredientes")
    void recipeSuggestionsAndDetail() throws Exception {
        String token = register(uniqueEmail());

        // Sin ingredientes no hay sugerencias
        mvc.perform(get(API + "/recipes/suggestions").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.length()").value(0));

        addToInventory(token, 3); // Huevo
        addToInventory(token, 1); // Jitomate

        MvcResult res = mvc.perform(get(API + "/recipes/suggestions").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].title_recipe").value("Huevos a la mexicana"))
                .andExpect(jsonPath("$.data[0].match_percentage").value(50))
                .andExpect(jsonPath("$.data[0].source").value("OWN"))
                .andReturn();
        long idRecipe = json(res).path("data").get(0).path("id_recipe").asLong();

        mvc.perform(get(API + "/recipes/" + idRecipe).param("source", "OWN")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.steps.length()").value(5))
                .andExpect(jsonPath("$.data.ingredients.length()").value(4));

        mvc.perform(get(API + "/recipes/999999").header("Authorization", "Bearer " + token))
                .andExpect(status().isNotFound());
    }

    // ------------------------------------------------------------------ v1.4

    private MvcResult patchInventory(String token, long idInventory, String quantity) throws Exception {
        return mvc.perform(patch(API + "/inventory/" + idInventory).header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON).content("{\"quantity\":" + quantity + "}"))
                .andReturn();
    }

    @Test
    @DisplayName("Editar cantidad: cambia lo que queda y con 0 se quita de la alacena")
    void updateInventoryQuantity() throws Exception {
        String token = register(uniqueEmail());
        long idInventory = addToInventory(token, 3);

        assertThat(patchInventory(token, idInventory, "1.5").getResponse().getStatus()).isEqualTo(204);
        mvc.perform(get(API + "/inventory").header("Authorization", "Bearer " + token))
                .andExpect(jsonPath("$.data[0].quantity").value(1.5));

        assertThat(patchInventory(token, idInventory, "-1").getResponse().getStatus()).isEqualTo(422);

        assertThat(patchInventory(token, idInventory, "0").getResponse().getStatus()).isEqualTo(204);
        mvc.perform(get(API + "/inventory").header("Authorization", "Bearer " + token))
                .andExpect(jsonPath("$.data.length()").value(0));
    }

    @Test
    @DisplayName("No se puede editar la alacena de otro usuario")
    void cannotUpdateOtherUsersInventory() throws Exception {
        String owner = register(uniqueEmail());
        String intruder = register(uniqueEmail());
        long idInventory = addToInventory(owner, 3);
        assertThat(patchInventory(intruder, idInventory, "0").getResponse().getStatus()).isEqualTo(404);
        mvc.perform(get(API + "/inventory").header("Authorization", "Bearer " + owner))
                .andExpect(jsonPath("$.data.length()").value(1));
    }

    @Test
    @DisplayName("Crear ingrediente: limpia el nombre y no duplica los que ya existen")
    void createIngredient() throws Exception {
        String token = register(uniqueEmail());
        String name = "2 jícamas" + UUID.randomUUID().toString().substring(0, 6) + " picadas";

        MvcResult created = mvc.perform(post(API + "/ingredients").header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON).content("{\"name\":\"" + name + "\"}"))
                .andExpect(status().isCreated())
                .andReturn();
        JsonNode data = json(created).path("data");
        assertThat(data.path("name_es").asText()).startsWith("Jícamas").doesNotContain("picadas");

        // El mismo nombre con otro formato regresa el existente (200), no crea otro
        String again = data.path("name_es").asText().toUpperCase();
        mvc.perform(post(API + "/ingredients").header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON).content("{\"name\":\"" + again + "\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.id_ingredient").value(data.path("id_ingredient").asLong()));

        mvc.perform(post(API + "/ingredients").header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON).content("{\"name\":\"  \"}"))
                .andExpect(status().isUnprocessableEntity());
    }

    @Test
    @DisplayName("El objetivo de Dietas se guarda en la cuenta")
    void dietGoal() throws Exception {
        String token = register(uniqueEmail());
        mvc.perform(put(API + "/users/me/diet-goal").header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON).content("{\"goal\":\"muscle\"}"))
                .andExpect(status().isOk());
        mvc.perform(get(API + "/users/me").header("Authorization", "Bearer " + token))
                .andExpect(jsonPath("$.data.diet_goal").value("muscle"));

        mvc.perform(put(API + "/users/me/diet-goal").header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON).content("{\"goal\":\"pizza\"}"))
                .andExpect(status().isUnprocessableEntity());

        mvc.perform(put(API + "/users/me/diet-goal").header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON).content("{\"goal\":null}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.diet_goal").doesNotExist());
    }

    @Test
    @DisplayName("Recetario mexicano: aparece con lo que tienes y trae lo de tu alacena en tu unidad")
    void mexicanRecipesAndPantryInfo() throws Exception {
        String token = register(uniqueEmail());
        MvcResult catalog = mvc.perform(get(API + "/ingredients").header("Authorization", "Bearer " + token)).andReturn();
        long tortillas = -1;
        long queso = -1;
        for (JsonNode ing : json(catalog).path("data")) {
            String key = com.naatlabs.kukin.service.IngredientNames.key(ing.path("name_es").asText());
            if (key.equals("tortilla de maiz")) tortillas = ing.path("id_ingredient").asLong();
            if (key.equals("queso oaxaca")) queso = ing.path("id_ingredient").asLong();
        }
        assertThat(tortillas).isPositive();
        assertThat(queso).isPositive();
        addToInventory(token, tortillas);
        addToInventory(token, queso);

        MvcResult res = mvc.perform(get(API + "/recipes/suggestions").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andReturn();
        JsonNode quesadillas = null;
        for (JsonNode r : json(res).path("data")) {
            if (r.path("title_recipe").asText().equals("Quesadillas")) quesadillas = r;
        }
        assertThat(quesadillas).as("Quesadillas sugeridas").isNotNull();
        assertThat(quesadillas.path("match_percentage").asInt()).isEqualTo(100);
        assertThat(quesadillas.path("needs_oven").asBoolean()).isFalse();
        assertThat(quesadillas.path("calories").asInt()).isPositive();

        mvc.perform(get(API + "/recipes/" + quesadillas.path("id_recipe").asLong()).param("source", "OWN")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.servings").value(2))
                .andExpect(jsonPath("$.data.ingredients[0].id_inventory").isNumber())
                .andExpect(jsonPath("$.data.ingredients[0].inventory_quantity").value(3))
                .andExpect(jsonPath("$.data.ingredients[0].amount_in_inventory_unit").value(6));
    }
}
