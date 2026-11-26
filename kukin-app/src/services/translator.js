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

// Traducción asíncrona para textos largos (instrucciones de Spoonacular).
// MyMemory es un servicio gratuito sin API key; si falla o agota su cuota se deja el texto original.
export const traducirTexto = async (texto) => {
  if (!texto) return "";
  try {
    const res = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(texto)}&langpair=en|es`);
    if (!res.ok) return texto;
    const data = await res.json();
    const traducido = data?.responseData?.translatedText;
    if (!traducido || data.responseStatus !== 200 || /MYMEMORY WARNING/i.test(traducido)) return texto;
    return traducido;
  } catch {
    return texto; // Sin red: se muestra en inglés
  }
};
