package com.naatlabs.kukin.service;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

import static org.assertj.core.api.Assertions.assertThat;

/** Limpieza de nombres de ingredientes y llave para detectar repetidos. */
class IngredientNamesTest {

    @ParameterizedTest(name = "{0} → {1}")
    @DisplayName("Quita cantidades, unidades, etiquetas y preparación")
    @CsvSource(delimiter = '|', value = {
            "5 tallos de apio|Apio",
            "1 oz de jugo <x id=\"1\"/> de limón exprimido|Jugo de limón",
            "diente de ajo|Ajo",
            "2 tazas de arroz blanco|Arroz blanco",
            "cebolla, picada finamente|Cebolla",
            "queso (rallado)|Queso",
            "1/2 cucharadita de sal|Sal",
            "SETAS BELLA BABY|Setas bella baby",
            "Queso Oaxaca|Queso Oaxaca",
            "cilantro al gusto|Cilantro",
            "Queso de cabra%27s|Queso de cabra",
    })
    void clean(String raw, String expected) {
        assertThat(IngredientNames.clean(raw)).isEqualTo(expected);
    }

    @ParameterizedTest(name = "{0} = {1}")
    @DisplayName("Sin acentos, sin mayúsculas y en singular, para unir repetidos")
    @CsvSource(delimiter = '|', value = {
            "Huevos|huevo",
            "Frijoles|frijol",
            "nueces|nuez",
            "Plátano|platano",
            "Tortillas de maíz|tortilla de maiz",
            "Limones|limon",
    })
    void key(String name, String expected) {
        assertThat(IngredientNames.key(name)).isEqualTo(expected);
    }
}
