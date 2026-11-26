package com.naatlabs.kukin.service;

import java.text.Normalizer;
import java.util.Locale;
import java.util.regex.Pattern;

/**
 * Limpieza de nombres de ingredientes.
 *
 * Las importaciones viejas guardaron renglones completos de la receta como nombre
 * ("5 tallos de apio", "1 oz de jugo <x id="1"/> de limón exprimido"). Un ingrediente del catálogo
 * debe ser solo el alimento ("Apio", "Jugo de limón"); la cantidad y la preparación van en la receta.
 */
public final class IngredientNames {

    private IngredientNames() {}

    private static final Locale ES = Locale.forLanguageTag("es");

    /** Etiquetas que deja el traductor o el HTML: <x id="1"/>, <b>, etc. */
    private static final Pattern TAGS = Pattern.compile("<[^>]*>");

    /** Cantidad al inicio: "5", "1/2", "1 1/2", "½", "2-3", "0.5". */
    private static final Pattern LEADING_QTY = Pattern.compile("^[\\d\\s.,/½¼¾⅓⅔⅛\\-–]+");

    /** Unidad o recipiente al inicio, seguido de "de": "tallos de", "oz de", "una lata de". */
    private static final Pattern LEADING_UNIT = Pattern.compile(
            "^(?:(?:un|una|unos|unas|medio|media)\\s+)?"
            + "(?:oz|onzas?|tazas?|tz|cucharadas?|cdas?|cucharaditas?|cdtas?|tallos?|ramas?|ramitas?|dientes?|latas?|"
            + "paquetes?|bolsas?|frascos?|botellas?|pizcas?|manojos?|rebanadas?|rodajas?|trozos?|pedazos?|piezas?|pzas?|"
            + "libras?|lbs?|gramos?|g|gr|kilos?|kilogramos?|kg|mililitros?|ml|litros?|l|hojas?|cabezas?|puñados?|"
            + "chorritos?|gotas?|cubos?|tiras?|filetes?)\\.?\\s+(?:de\\s+)?",
            Pattern.CASE_INSENSITIVE | Pattern.UNICODE_CASE);

    /** Palabras de preparación que no forman parte del alimento. */
    private static final Pattern PREPARATION = Pattern.compile(
            "\\b(?:finamente|grueso|gruesamente|recién|recien)?\\s*"
            + "(?:picad[oa]s?|exprimid[oa]s?|rallad[oa]s?|cortad[oa]s?|troceado?s?|machacad[oa]s?|"
            + "pelad[oa]s?|lavad[oa]s?|escurrid[oa]s?|derretid[oa]s?|batid[oa]s?|tamizad[oa]s?|"
            + "en cubos|en cubitos|en rodajas|en tiras|en trozos|al gusto|opcional|para decorar|para servir|"
            + "a temperatura ambiente|dividid[oa]s?|cocid[oa]s? y escurrid[oa]s?)\\b",
            Pattern.CASE_INSENSITIVE | Pattern.UNICODE_CASE);

    /** Nombre limpio y con mayúscula inicial. Si al limpiar no queda nada, regresa el original sin etiquetas. */
    public static String clean(String raw) {
        if (raw == null) return null;
        String noTags = TAGS.matcher(raw).replaceAll(" ").replace("&quot;", "").replace("\"", "")
                // Apóstrofo codificado o posesivo del inglés que dejó la traducción: "Queso de cabra%27s"
                .replace("%27", "'").replace("&#39;", "'").replaceAll("'s\\b", "").replace("'", "")
                .replaceAll("\\s+", " ").trim();
        String s = noTags;
        // Lo que va después de una coma suele ser preparación: "cebolla, picada"
        int comma = s.indexOf(',');
        if (comma > 2) s = s.substring(0, comma);
        // Lo que va entre paréntesis también: "queso (rallado)"
        s = s.replaceAll("\\([^)]*\\)", " ");
        s = LEADING_QTY.matcher(s).replaceFirst("");
        s = LEADING_UNIT.matcher(s).replaceFirst("");
        s = LEADING_QTY.matcher(s).replaceFirst("");
        s = PREPARATION.matcher(s).replaceAll(" ");
        s = s.replaceAll("\\s+de\\s*$", "").replaceAll("\\s{2,}", " ").replaceAll("^[\\s,.;:-]+|[\\s,.;:-]+$", "").trim();
        if (s.length() < 2) s = noTags;
        // Solo se pasa a minúsculas lo que venía TODO EN MAYÚSCULAS ("SETAS BELLA BABY"); "Queso Chihuahua" se respeta
        if (s.equals(s.toUpperCase(ES)) && !s.equals(s.toLowerCase(ES))) s = s.toLowerCase(ES);
        return capitalize(s);
    }

    /**
     * Llave para detectar duplicados: sin acentos, sin mayúsculas y en singular
     * ("Huevos" = "huevo", "Frijoles" = "frijol", "nueces" = "nuez").
     */
    public static String key(String name) {
        if (name == null) return "";
        String n = Normalizer.normalize(name, Normalizer.Form.NFD).replaceAll("\\p{M}", "")
                .toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9 ]", " ").replaceAll("\\s+", " ").trim();
        StringBuilder sb = new StringBuilder();
        for (String w : n.split(" ")) {
            if (sb.length() > 0) sb.append(' ');
            sb.append(singular(w));
        }
        return sb.toString();
    }

    private static String singular(String w) {
        if (w.length() <= 3) return w;
        if (w.endsWith("ces")) return w.substring(0, w.length() - 3) + "z";
        if (w.endsWith("es") && "lnrdj".indexOf(w.charAt(w.length() - 3)) >= 0) return w.substring(0, w.length() - 2);
        if (w.endsWith("s") && !w.endsWith("ss")) return w.substring(0, w.length() - 1);
        return w;
    }

    public static String capitalize(String s) {
        if (s == null || s.isBlank()) return s;
        return s.substring(0, 1).toUpperCase(ES) + s.substring(1);
    }
}
