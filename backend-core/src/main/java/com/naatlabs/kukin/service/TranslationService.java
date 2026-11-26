package com.naatlabs.kukin.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.naatlabs.kukin.repository.IngredientSubstitutionRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Traducción inglés → español en el servidor (la app nunca llama a servicios externos).
 *
 * - Usa el endpoint gratuito de Google Translate (client=gtx, sin API key) por POST, así los textos largos
 *   no rompen el límite de la URL.
 * - Traduce por lotes: varios textos se unen con saltos de línea y viajan en UNA sola petición,
 *   para no provocar bloqueos por exceso de peticiones (HTTP 429).
 * - Antes de traducir un ingrediente revisa la tabla ingredient_substitution (equivalente mexicano).
 * - Si Google no responde, devuelve el texto original: la receta se guarda igual y no se rompe nada.
 */
@Service
public class TranslationService {

    private static final Logger log = LoggerFactory.getLogger(TranslationService.class);
    private static final String URL = "https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=es&dt=t";
    /** Google corta textos muy largos; los lotes se parten antes de este tamaño. */
    private static final int MAX_CHARS_PER_REQUEST = 4500;

    private final RestTemplate restTemplate;
    private final IngredientSubstitutionRepository substitutions;
    private final Map<String, String> cache = new ConcurrentHashMap<>();

    public TranslationService(RestTemplateBuilder builder, IngredientSubstitutionRepository substitutions) {
        this.restTemplate = builder
                .setConnectTimeout(Duration.ofSeconds(5))
                .setReadTimeout(Duration.ofSeconds(15))
                .build();
        this.substitutions = substitutions;
    }

    /** Traduce un texto suelto (título, instrucciones). */
    public String translate(String text) {
        List<String> out = translateAll(List.of(text == null ? "" : text));
        return out.get(0);
    }

    /**
     * Google traduce a español de España ("patatas", "guisantes"). Esto lo pasa a como se dice en México.
     * Se aplica palabra por palabra, respetando mayúscula inicial y plural.
     */
    private static final Map<String, String> MX_WORDS = Map.ofEntries(
            Map.entry("patata", "papa"), Map.entry("patatas", "papas"),
            Map.entry("guisante", "chícharo"), Map.entry("guisantes", "chícharos"),
            Map.entry("batata", "camote"), Map.entry("batatas", "camotes"),
            Map.entry("seta", "hongo"), Map.entry("setas", "hongos"),
            Map.entry("zumo", "jugo"), Map.entry("nata", "crema"),
            Map.entry("melocotón", "durazno"), Map.entry("melocotones", "duraznos"),
            Map.entry("albaricoque", "chabacano"), Map.entry("albaricoques", "chabacanos"),
            Map.entry("cacahuete", "cacahuate"), Map.entry("cacahuetes", "cacahuates"),
            Map.entry("gamba", "camarón"), Map.entry("gambas", "camarones"),
            Map.entry("judías", "ejotes"), Map.entry("calabacín", "calabacita"), Map.entry("calabacines", "calabacitas"),
            Map.entry("ternera", "res"), Map.entry("cebolleta", "cebollín"), Map.entry("cebolletas", "cebollines"),
            Map.entry("pimentón", "paprika"), Map.entry("aove", "aceite de oliva extra virgen"),
            Map.entry("bol", "tazón"), Map.entry("nevera", "refrigerador"), Map.entry("frigorífico", "refrigerador"),
            Map.entry("cacerola", "olla")
    );

    public String mexicanize(String text) {
        if (text == null || text.isBlank()) return text;
        StringBuilder out = new StringBuilder();
        java.util.regex.Matcher m = java.util.regex.Pattern.compile("[\\p{L}]+").matcher(text);
        int last = 0;
        while (m.find()) {
            out.append(text, last, m.start());
            String word = m.group();
            String mx = MX_WORDS.get(word.toLowerCase(Locale.forLanguageTag("es")));
            if (mx != null && Character.isUpperCase(word.charAt(0))) mx = capitalize(mx);
            out.append(mx != null ? mx : word);
            last = m.end();
        }
        out.append(text.substring(last));
        return out.toString();
    }

    /** Nombre de ingrediente: primero el equivalente mexicano de la BD, si no, Google. */
    public List<String> translateIngredientNames(List<String> namesEn) {
        List<String> result = new ArrayList<>(namesEn);
        List<Integer> pending = new ArrayList<>();
        for (int i = 0; i < namesEn.size(); i++) {
            String mx = substitutions.findEquivalentMx(namesEn.get(i)).orElse(null);
            if (mx != null) result.set(i, mx);
            else pending.add(i);
        }
        List<String> toTranslate = pending.stream().map(namesEn::get).toList();
        List<String> translated = translateAll(toTranslate);
        for (int k = 0; k < pending.size(); k++) {
            result.set(pending.get(k), capitalize(translated.get(k)));
        }
        return result;
    }

    /**
     * Traduce una lista conservando el orden. Cada elemento debe ser de un renglón
     * (los saltos de línea internos se reemplazan por espacios).
     */
    public List<String> translateAll(List<String> texts) {
        List<String> result = new ArrayList<>(texts.size());
        List<Integer> pending = new ArrayList<>();
        for (int i = 0; i < texts.size(); i++) {
            String clean = clean(texts.get(i));
            String cached = cache.get(clean);
            result.add(cached != null ? cached : clean);
            if (cached == null && !clean.isBlank()) pending.add(i);
        }

        // Arma lotes que no rebasen el tamaño máximo
        int start = 0;
        while (start < pending.size()) {
            int end = start;
            int size = 0;
            while (end < pending.size() && (end == start || size + result.get(pending.get(end)).length() + 1 < MAX_CHARS_PER_REQUEST)) {
                size += result.get(pending.get(end)).length() + 1;
                end++;
            }
            List<Integer> batch = pending.subList(start, end);
            String joined = String.join("\n", batch.stream().map(result::get).toList());
            String translated = callGoogle(joined);
            if (translated != null) {
                String[] lines = translated.split("\\r?\\n", -1);
                // Solo se acepta si regresa el mismo número de renglones (si no, el orden no es confiable)
                if (lines.length == batch.size()) {
                    for (int k = 0; k < batch.size(); k++) {
                        String original = result.get(batch.get(k));
                        String es = mexicanize(lines[k].trim());
                        if (!es.isEmpty()) {
                            cache.put(original, es);
                            result.set(batch.get(k), es);
                        }
                    }
                } else if (batch.size() > 1) {
                    // Respaldo: uno por uno
                    for (Integer idx : batch) {
                        String es = callGoogle(result.get(idx));
                        if (es != null && !es.isBlank()) {
                            String mx = mexicanize(es.trim());
                            cache.put(result.get(idx), mx);
                            result.set(idx, mx);
                        }
                    }
                }
            }
            start = end;
        }
        return result;
    }

    /** Español → inglés, para que un ingrediente creado por el usuario coincida con las recetas de Spoonacular. */
    public String toEnglish(String textEs) {
        if (textEs == null || textEs.isBlank()) return textEs;
        String out = callGoogle(textEs, URL.replace("sl=en&tl=es", "sl=es&tl=en"));
        return out == null || out.isBlank() ? textEs : out.trim().toLowerCase(Locale.ROOT);
    }

    private String callGoogle(String text) {
        return callGoogle(text, URL);
    }

    private String callGoogle(String text, String url) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
            MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
            form.add("q", text);
            JsonNode root = restTemplate.postForObject(url, new HttpEntity<>(form, headers), JsonNode.class);
            if (root == null || !root.path(0).isArray()) return null;
            StringBuilder sb = new StringBuilder();
            for (JsonNode sentence : root.path(0)) {
                if (sentence.path(0).isTextual()) sb.append(sentence.path(0).asText());
            }
            return unescape(sb.toString());
        } catch (RestClientException e) {
            log.warn("No se pudo traducir con Google: {}", e.getClass().getSimpleName());
            return null;
        }
    }

    /** Quita HTML y etiquetas XML como <X Id="1"/>, y deja un solo renglón. */
    private static String clean(String text) {
        if (text == null) return "";
        return unescape(text.replaceAll("<[^>]*>", " "))
                .replaceAll("[\\r\\n]+", " ")
                .replaceAll("\\s{2,}", " ")
                .trim();
    }

    private static String unescape(String s) {
        return s.replace("&amp;", "&").replace("&quot;", "\"").replace("&#39;", "'")
                .replace("&lt;", "<").replace("&gt;", ">").replace("&nbsp;", " ");
    }

    private static String capitalize(String s) {
        if (s == null || s.isBlank()) return s;
        return s.substring(0, 1).toUpperCase(Locale.forLanguageTag("es")) + s.substring(1);
    }
}
