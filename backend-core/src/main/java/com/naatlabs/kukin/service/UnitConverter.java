package com.naatlabs.kukin.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Map;

/**
 * Conversión entre las unidades del catálogo (tabla unit).
 *
 * - Peso: g, kg, oz, lb.  Volumen: ml, L, tz, cda, cdta.
 * - Entre peso y volumen se usa la aproximación de cocina 1 ml ≈ 1 g (agua, leche, caldo); para harina o azúcar
 *   no es exacto, pero sirve para estimar cuánto queda en la alacena.
 * - Las unidades por pieza (pza, diente, lata, manojo, pizca) solo se convierten a sí mismas.
 */
public final class UnitConverter {

    private UnitConverter() {}

    /** Cuántos gramos (o mililitros) equivale una unidad. */
    private static final Map<String, BigDecimal> MASS_G = Map.of(
            "g", BigDecimal.ONE, "kg", new BigDecimal("1000"), "oz", new BigDecimal("28.35"), "lb", new BigDecimal("453.6"));
    private static final Map<String, BigDecimal> VOLUME_ML = Map.of(
            "ml", BigDecimal.ONE, "l", new BigDecimal("1000"), "tz", new BigDecimal("240"),
            "cda", new BigDecimal("15"), "cdta", new BigDecimal("5"));

    /**
     * Convierte {@code amount} de la unidad {@code from} a la unidad {@code to} (símbolos del catálogo).
     * Regresa null si no se puede convertir (ej. piezas a gramos).
     */
    public static BigDecimal convert(BigDecimal amount, String from, String to) {
        if (amount == null || from == null || to == null) return null;
        String f = from.trim().toLowerCase();
        String t = to.trim().toLowerCase();
        if (f.equals(t)) return amount;
        BigDecimal base = toBase(f);
        BigDecimal target = toBase(t);
        if (base == null || target == null) return null;
        return amount.multiply(base).divide(target, 2, RoundingMode.HALF_UP);
    }

    private static BigDecimal toBase(String unit) {
        BigDecimal v = MASS_G.get(unit);
        return v != null ? v : VOLUME_ML.get(unit);
    }
}
