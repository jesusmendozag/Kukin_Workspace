const diccionarioCocina = {
  "gluten free": "Sin gluten", "dairy free": "Sin lácteos", "vegan": "Vegano", "vegetarian": "Vegetariano",
  "egg": "Huevo", "eggs": "Huevos", "tomato": "Jitomate", "tomatoes": "Jitomates", "onion": "Cebolla", 
  "garlic": "Ajo", "chicken": "Pollo", "cheese": "Queso", "water": "Agua", "salt": "Sal", 
  "pepper": "Pimienta", "butter": "Mantequilla", "bell peppers": "Pimientos", "tomato sauce": "Salsa de tomate",
  "canned tomatoes": "Tomates enlatados", "parsley": "Perejil", "ground beef": "Carne molida", 
  "ground turkey": "Pavo molido", "olive oil": "Aceite de oliva", "sugar": "Azúcar"
};

export const traducirPalabra = (word) => {
  if (!word) return "";
  const lower = word.toLowerCase().trim();
  return diccionarioCocina[lower] || word;
};

// Traducción asíncrona robusta a través de API
export const traducirTexto = async (texto) => {
  if (!texto) return "";
  // Revisión rápida en diccionario local para evitar llamadas innecesarias
  if (diccionarioCocina[texto.toLowerCase().trim()]) {
    return diccionarioCocina[texto.toLowerCase().trim()];
  }
  try {
    const res = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(texto)}&langpair=en|es`);
    const data = await res.json();
    return data.responseData.translatedText;
  } catch (error) {
    return texto;
  }
};