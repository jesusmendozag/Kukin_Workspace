// Ilustración por ingrediente (por nombre en español del catálogo)
const INGREDIENT_META = {
  jitomate: { emoji: '🍅', bg: '#FEF2F2' },
  cebolla: { emoji: '🧅', bg: '#FDF8F0' },
  huevo: { emoji: '🥚', bg: '#FEF3C7' },
  pollo: { emoji: '🍗', bg: '#FEE2E2' },
  ajo: { emoji: '🧄', bg: '#FAF5FF' },
  'chile serrano': { emoji: '🌶️', bg: '#FEF2F2' },
  aguacate: { emoji: '🥑', bg: '#F0FDF4' },
  limón: { emoji: '🍋', bg: '#FEFCE8' },
  arroz: { emoji: '🍚', bg: '#F8FAFC' },
  frijol: { emoji: '🫘', bg: '#FDF8F0' },
  'tortilla de maíz': { emoji: '🫓', bg: '#FEF3C7' },
  queso: { emoji: '🧀', bg: '#FEFCE8' },
  leche: { emoji: '🥛', bg: '#F8FAFC' },
  mantequilla: { emoji: '🧈', bg: '#FEFCE8' },
  papa: { emoji: '🥔', bg: '#FDF8F0' },
  zanahoria: { emoji: '🥕', bg: '#FFF7ED' },
  lechuga: { emoji: '🥬', bg: '#F0FDF4' },
  'carne de res': { emoji: '🥩', bg: '#FEE2E2' },
  pasta: { emoji: '🍝', bg: '#FEF3C7' },
  cilantro: { emoji: '🌿', bg: '#F0FDF4' },
};
export const getIngredientMeta = (name = '') =>
  INGREDIENT_META[name.toLowerCase()] || { emoji: '🥫', bg: '#F0FDF4' };
