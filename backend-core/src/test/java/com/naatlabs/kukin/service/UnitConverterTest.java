package com.naatlabs.kukin.service;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;

/** Conversión entre unidades para calcular cuánto queda en la alacena después de cocinar. */
class UnitConverterTest {

    private static BigDecimal convert(String amount, String from, String to) {
        return UnitConverter.convert(new BigDecimal(amount), from, to);
    }

    @Test
    @DisplayName("Misma unidad: no cambia")
    void sameUnit() {
        assertThat(convert("3", "pza", "pza")).isEqualByComparingTo("3");
    }

    @Test
    @DisplayName("Peso: kilos, gramos, libras y onzas")
    void mass() {
        assertThat(convert("1", "kg", "g")).isEqualByComparingTo("1000");
        assertThat(convert("500", "g", "kg")).isEqualByComparingTo("0.5");
        assertThat(convert("1", "lb", "g")).isEqualByComparingTo("453.6");
        assertThat(convert("2", "oz", "g")).isEqualByComparingTo("56.7");
    }

    @Test
    @DisplayName("Volumen: tazas, cucharadas, litros (sin importar mayúsculas)")
    void volume() {
        assertThat(convert("1", "tz", "ml")).isEqualByComparingTo("240");
        assertThat(convert("2", "cda", "ml")).isEqualByComparingTo("30");
        assertThat(convert("3", "cdta", "cda")).isEqualByComparingTo("1");
        assertThat(convert("1", "tz", "L")).isEqualByComparingTo("0.24");
    }

    @Test
    @DisplayName("Entre peso y volumen se aproxima 1 ml ≈ 1 g")
    void massToVolume() {
        assertThat(convert("1", "tz", "g")).isEqualByComparingTo("240");
    }

    @Test
    @DisplayName("Piezas no se convierten a peso: regresa null")
    void notConvertible() {
        assertThat(convert("2", "pza", "g")).isNull();
        assertThat(convert("1", "diente", "g")).isNull();
        assertThat(UnitConverter.convert(null, "g", "kg")).isNull();
    }
}
