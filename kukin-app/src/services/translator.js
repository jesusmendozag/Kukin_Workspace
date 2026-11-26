// Las recetas, ingredientes e instrucciones ya llegan en español desde el backend
// (se traducen y se guardan en MySQL al importarlas). La app no llama a ningún traductor externo.
// Aquí solo queda un diccionario local para las etiquetas de dieta que manda Spoonacular.
const DIETAS = {
  'gluten free': 'Sin gluten',
  'dairy free': 'Sin lácteos',
  vegan: 'Vegano',
  vegetarian: 'Vegetariano',
  'lacto ovo vegetarian': 'Vegetariano',
  'lacto vegetarian': 'Lactovegetariano',
  'ovo vegetarian': 'Ovovegetariano',
  pescatarian: 'Pescetariano',
  pescetarian: 'Pescetariano',
  paleolithic: 'Paleo',
  paleo: 'Paleo',
  primal: 'Primal',
  ketogenic: 'Keto',
  keto: 'Keto',
  'whole 30': 'Whole30',
  'fodmap friendly': 'Bajo en FODMAP',
};

export const traducirPalabra = (word) => {
  if (!word) return '';
  return DIETAS[word.toLowerCase().trim()] || word;
};
