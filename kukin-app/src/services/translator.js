const diccionario = {
  "gluten free": "Sin gluten", "dairy free": "Sin lácteos", "vegan": "Vegano", 
  "vegetarian": "Vegetariano", "paleolithic": "Paleo", "primal": "Primal",
  "egg": "Huevo", "eggs": "Huevos", "tomato": "Jitomate", "tomatoes": "Jitomates", 
  "onion": "Cebolla", "garlic": "Ajo", "chicken": "Pollo", "cheese": "Queso",
  "water": "Agua", "salt": "Sal", "pepper": "Pimienta", "butter": "Mantequilla"
};

export const traducirPalabra = (word) => {
  if (!word) return "";
  const lower = word.toLowerCase().trim();
  return diccionario[lower] || word;
};

// Traducción asíncrona para textos largos (Instrucciones)
export const traducirTexto = async (texto) => {
  if (!texto) return "";
  try {
    const res = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(texto)}&langpair=en|es`);
    const data = await res.json();
    return data.responseData.translatedText;
  } catch (error) {
    return texto; // Fallback al inglés si falla la red
  }
};