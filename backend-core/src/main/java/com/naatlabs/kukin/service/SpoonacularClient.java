package com.naatlabs.kukin.service;

import com.fasterxml.jackson.databind.JsonNode;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.time.Duration;
import java.util.Collection;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Único punto de contacto con la API de Spoonacular.
 * La API key vive solo en el servidor (variable de entorno SPOONACULAR_API_KEY),
 * nunca dentro de la app móvil.
 */
@Component
public class SpoonacularClient {

    private static final Logger log = LoggerFactory.getLogger(SpoonacularClient.class);

    private final RestTemplate restTemplate;
    private final String apiKey;
    private final String baseUrl;

    /** Caché simple del detalle: el plan gratuito de Spoonacular tiene un límite diario de llamadas. */
    private final Map<Long, JsonNode> detailCache = new ConcurrentHashMap<>();

    public SpoonacularClient(RestTemplateBuilder builder,
                             @Value("${kukin.spoonacular.api-key:}") String apiKey,
                             @Value("${kukin.spoonacular.base-url:https://api.spoonacular.com}") String baseUrl) {
        this.restTemplate = builder
                .setConnectTimeout(Duration.ofSeconds(5))
                .setReadTimeout(Duration.ofSeconds(10))
                .build();
        this.apiKey = apiKey;
        this.baseUrl = baseUrl;
    }

    public boolean isEnabled() {
        return apiKey != null && !apiKey.isBlank();
    }

    /** Busca recetas que usen los ingredientes indicados (nombres en inglés). */
    public Optional<JsonNode> searchByIngredients(Collection<String> ingredientNamesEn, int number) {
        if (!isEnabled() || ingredientNamesEn.isEmpty()) return Optional.empty();
        String url = UriComponentsBuilder.fromHttpUrl(baseUrl + "/recipes/complexSearch")
                .queryParam("includeIngredients", String.join(",", ingredientNamesEn))
                .queryParam("addRecipeInformation", true)
                .queryParam("fillIngredients", true)
                .queryParam("ignorePantry", true)
                .queryParam("sort", "max-used-ingredients")
                .queryParam("number", number)
                .queryParam("apiKey", apiKey)
                .build().encode().toUriString();
        return get(url);
    }

    public Optional<JsonNode> getRecipeInformation(Long id) {
        if (!isEnabled()) return Optional.empty();
        JsonNode cached = detailCache.get(id);
        if (cached != null) return Optional.of(cached);

        String url = UriComponentsBuilder.fromHttpUrl(baseUrl + "/recipes/" + id + "/information")
                .queryParam("apiKey", apiKey)
                .build().encode().toUriString();
        Optional<JsonNode> result = get(url);
        result.ifPresent(node -> detailCache.put(id, node));
        return result;
    }

    private Optional<JsonNode> get(String url) {
        try {
            return Optional.ofNullable(restTemplate.getForObject(url, JsonNode.class));
        } catch (RestClientException e) {
            // No se registra la URL completa para no escribir la API key en los logs
            log.warn("Spoonacular no respondió correctamente: {}", e.getClass().getSimpleName());
            return Optional.empty();
        }
    }
}
