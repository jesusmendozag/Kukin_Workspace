// Emoji por ingrediente, por PALABRAS COMPLETAS (antes "sal" coincidía dentro de "salsa" y "papa" dentro de "papaya").
// En español el sustantivo principal va primero ("jugo de limón", "aceite de oliva"), así que manda la primera palabra.

// Frases que se revisan antes que las palabras sueltas
const EMOJI_PHRASES = [
  ['salsa de soya', '🍶'], ['salsa de soja', '🍶'], ['polvo para hornear', '🥄'], ['nuez moscada', '🧂'],
  ['leche de coco', '🥥'], ['crema de cacahuate', '🥜'], ['mantequilla de cacahuate', '🥜'], ['pan molido', '🍞'],
  ['carne molida', '🥩'], ['agua mineral', '💧'],
];

// Palabra (sin acentos, singular) → emoji
const EMOJI_WORDS = {
  // verduras
  jitomate: '🍅', tomate: '🍅', tomatillo: '🍅', cebolla: '🧅', cebollin: '🧅', chalote: '🧅', puerro: '🧅', ajo: '🧄',
  chile: '🌶️', jalapeno: '🌶️', serrano: '🌶️', poblano: '🌶️', chipotle: '🌶️', habanero: '🌶️', guajillo: '🌶️',
  pimiento: '🫑', papa: '🥔', camote: '🍠', zanahoria: '🥕', lechuga: '🥬', espinaca: '🥬', col: '🥬', repollo: '🥬',
  acelga: '🥬', kale: '🥬', berro: '🥬', arugula: '🥬', apio: '🥬', brocoli: '🥦', coliflor: '🥦', calabaza: '🎃',
  calabacita: '🥒', pepino: '🥒', chayote: '🥒', nopal: '🌵', champinon: '🍄', hongo: '🍄', seta: '🍄', elote: '🌽',
  maiz: '🌽', esparrago: '🌱', chicharo: '🫛', ejote: '🫛', berenjena: '🍆', betabel: '🫜', rabano: '🫜', nabo: '🫜',
  jicama: '🥔', jengibre: '🫚', cilantro: '🌿', perejil: '🌿', epazote: '🌿', albahaca: '🌿', hierbabuena: '🌿',
  menta: '🌿', romero: '🌿', tomillo: '🌿', oregano: '🌿', salvia: '🌿', estragon: '🌿', laurel: '🍃', hierba: '🌿',
  // frutas
  aguacate: '🥑', limon: '🍋', lima: '🍋', naranja: '🍊', mandarina: '🍊', toronja: '🍊', clementina: '🍊',
  platano: '🍌', manzana: '🍎', fresa: '🍓', pina: '🍍', mango: '🥭', uva: '🍇', pasa: '🍇', sandia: '🍉', melon: '🍈',
  papaya: '🍈', pera: '🍐', durazno: '🍑', chabacano: '🍑', cereza: '🍒', coco: '🥥', kiwi: '🥝', arandano: '🫐',
  mora: '🫐', frambuesa: '🫐', guayaba: '🍐', ciruela: '🍑', datil: '🌴', aceituna: '🫒',
  // carnes, pescado y huevo
  pollo: '🍗', pechuga: '🍗', muslo: '🍗', pavo: '🍗', res: '🥩', carne: '🥩', bistec: '🥩', arrachera: '🥩',
  cecina: '🥩', costilla: '🍖', chuleta: '🍖', cerdo: '🥓', puerco: '🥓', tocino: '🥓', jamon: '🥓', panceta: '🥓',
  chorizo: '🌭', salchicha: '🌭', longaniza: '🌭', pescado: '🐟', atun: '🐟', salmon: '🐟', tilapia: '🐟',
  sardina: '🐟', caballa: '🐟', bacalao: '🐟', filete: '🐟', camaron: '🦐', cangrejo: '🦀', huevo: '🥚',
  // lácteos
  leche: '🥛', crema: '🥛', yogur: '🥛', yogurt: '🥛', queso: '🧀', requeson: '🧀', mantequilla: '🧈', manteca: '🧈',
  // granos, panes y abarrotes
  arroz: '🍚', frijol: '🫘', lenteja: '🫘', garbanzo: '🫘', soya: '🫘', pasta: '🍝', fideo: '🍝', espagueti: '🍝',
  macarron: '🍝', rigatoni: '🍝', ramen: '🍜', tortilla: '🫓', masa: '🫓', tostada: '🫓', pan: '🍞', bolillo: '🥖',
  telera: '🥖', baguette: '🥖', pita: '🫓', harina: '🌾', maicena: '🌾', avena: '🥣', cereal: '🥣', quinoa: '🌾',
  cuscus: '🌾', galleta: '🍪', aceite: '🫒', vinagre: '🍶', mirin: '🍶', salsa: '🥫', catsup: '🥫', pure: '🥫',
  mostaza: '🫙', mayonesa: '🫙', aderezo: '🫙', miel: '🍯', jarabe: '🍯', azucar: '🍬', piloncillo: '🍬',
  chocolate: '🍫', cacao: '🍫', cacahuate: '🥜', nuez: '🌰', almendra: '🌰', avellana: '🌰', pistache: '🌰',
  pinon: '🌰', semilla: '🌱', ajonjoli: '🌱', sesamo: '🌱', levadura: '🥄', bicarbonato: '🥄', gelatina: '🍮',
  // especias y caldos
  sal: '🧂', pimienta: '🧂', comino: '🧂', paprika: '🧂', clavo: '🧂', curry: '🧂', especia: '🧂', canela: '🪵',
  vainilla: '🌼', caldo: '🍲', consome: '🍲', polvo: '🧂',
  // bebidas
  jugo: '🧃', agua: '💧', cafe: '☕', te: '🍵', vino: '🍷', cerveza: '🍺', refresco: '🥤',
};

const toWords = (s = '') => foldAccents(s).split(/[^a-z0-9ñ]+/).filter(Boolean);

/** Emoji de una palabra (acepta plurales: "nopales", "limones", "nueces"). */
const emojiForWord = (w) => {
  const candidates = [w, w.replace(/es$/, ''), w.replace(/s$/, ''), w.replace(/ces$/, 'z')];
  for (const c of candidates) if (EMOJI_WORDS[c]) return EMOJI_WORDS[c];
  return null;
};

/** Emoji del ingrediente según su nombre, o null si no se reconoce. */
const emojiFromName = (name = '') => {
  const folded = foldAccents(name);
  const phrase = EMOJI_PHRASES.find(([p]) => folded.includes(p));
  if (phrase) return phrase[1];
  const words = toWords(name);
  // Primero el sustantivo principal; luego el resto de las palabras en orden
  for (const w of words) {
    const e = emojiForWord(w);
    if (e) return e;
  }
  return null;
};

/** Emoji del ingrediente (nunca vacío). */
export const getIngredientEmoji = (name = '', category = '') =>
  emojiFromName(name) || GROUP_EMOJI[getIngredientGroup(name, category)];

// Fondo pastel de la esquina del emoji, según el grupo del alimento
const GROUP_BG = {
  frutas: '#FFF3E0', verduras: '#FFF9C4', granos: '#FDF4E3', lacteos: '#E3F2FD', carnes: '#EFEBE9', especias: '#FFF8E1',
  otros: '#F3F4F6',
};
const GROUP_EMOJI = {
  frutas: '🍎', verduras: '🥬', granos: '🌾', lacteos: '🥛', carnes: '🍗', especias: '🧂', otros: '🥫',
};

/** Emoji y fondo pastel del ingrediente. */
export const getIngredientMeta = (name = '', category = '') => {
  const group = getIngredientGroup(name, category);
  return { emoji: emojiFromName(name) || GROUP_EMOJI[group], bg: GROUP_BG[group] };
};

/** Los ingredientes de todos los días en una cocina mexicana: aparecen primero al agregar. */
export const COMMON_INGREDIENTS = [
  'huevo', 'jitomate', 'cebolla', 'chile serrano', 'tortilla de maíz', 'frijol', 'arroz', 'aguacate',
  'limón', 'ajo', 'pollo', 'queso', 'leche', 'papa', 'cilantro', 'zanahoria', 'carne de res',
  'pasta', 'mantequilla', 'lechuga',
];

/** Quita acentos para buscar "limon" y encontrar "Limón". */
export const foldAccents = (s = '') => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/** Grupos que se muestran como filtros al agregar ingredientes. */
export const CATEGORIES = [
  { id: 'verduras', label: 'Verduras', emoji: '🥬' },
  { id: 'frutas', label: 'Frutas', emoji: '🍋' },
  { id: 'carnes', label: 'Carnes y huevo', emoji: '🍗' },
  { id: 'lacteos', label: 'Lácteos', emoji: '🧀' },
  { id: 'granos', label: 'Granos y abarrotes', emoji: '🌾' },
  { id: 'especias', label: 'Especias', emoji: '🧂' },
  { id: 'otros', label: 'Otros', emoji: '🥫' },
];

// Palabras (sin acentos) que identifican cada grupo. Se revisan en este orden.
const GROUP_WORDS = [
  ['especias', ['polvo', 'sal', 'pimienta', 'oregano', 'comino', 'canela', 'clavo', 'laurel', 'tomillo', 'romero',
    'paprika', 'nuez moscada', 'especia', 'consome', 'caldo', 'vainilla', 'curry', 'jengibre']],
  ['carnes', ['pollo', 'res', 'carne', 'cerdo', 'puerco', 'tocino', 'jamon', 'chorizo', 'salchicha', 'pavo', 'pescado',
    'atun', 'salmon', 'camaron', 'huevo', 'bistec', 'molida', 'costilla', 'pechuga', 'muslo', 'filete', 'tilapia',
    'panceta', 'caballa', 'cangrejo', 'tofu', 'sardina', 'bacalao', 'chuleta', 'arrachera', 'cecina', 'longaniza']],
  ['lacteos', ['leche', 'queso', 'crema', 'yogur', 'yogurt', 'mantequilla', 'requeson', 'nata']],
  ['frutas', ['aguacate', 'limon', 'naranja', 'platano', 'manzana', 'fresa', 'pina', 'mango', 'uva', 'sandia', 'melon',
    'papaya', 'pera', 'durazno', 'guayaba', 'coco', 'fruta', 'lima', 'toronja', 'mora', 'frambuesa', 'arandano', 'kiwi',
    'cereza', 'pasa', 'datil', 'ciruela']],
  ['verduras', ['jitomate', 'tomate', 'tomatillo', 'cebolla', 'cebollin', 'ajo', 'chile', 'jalapeno', 'serrano', 'poblano',
    'chipotle', 'pimiento', 'papa', 'camote', 'zanahoria', 'lechuga', 'espinaca', 'col', 'repollo', 'brocoli', 'coliflor',
    'calabaza', 'calabacita', 'pepino', 'nopal', 'champinon', 'hongo', 'elote', 'apio', 'betabel', 'rabano', 'cilantro',
    'perejil', 'epazote', 'verdura', 'ejote', 'chicharo', 'albahaca', 'hierbabuena', 'menta', 'puerro', 'chalote', 'berenjena',
    'acelga', 'esparrago', 'nabo', 'berro', 'colinabo', 'alcachofa', 'kale', 'arugula', 'jicama', 'chayote', 'cebollin', 'estragon', 'salvia']],
  ['granos', ['arroz', 'frijol', 'lenteja', 'garbanzo', 'avena', 'harina', 'pan', 'tortilla', 'pasta', 'fideo', 'espagueti',
    'maiz', 'cereal', 'galleta', 'tostada', 'azucar', 'aceite', 'vinagre', 'salsa', 'mayonesa', 'mostaza', 'catsup', 'miel',
    'chocolate', 'cacahuate', 'nuez', 'almendra', 'semilla', 'quinoa',
    'avellana', 'bolillo', 'telera', 'baguette', 'masa', 'cuscus', 'macarron', 'rigatoni', 'pinon', 'sesamo', 'ramen', 'pita', 'soya', 'mirin', 'wasabi', 'crutones', 'empanizador']],
];

// Categorías tal como están en la base de datos → grupo (respaldo cuando el nombre no da pistas)
const DB_CATEGORY_GROUP = {
  verduras: 'verduras', 'frutas y verduras': 'verduras', frutas: 'frutas', carnes: 'carnes', proteinas: 'carnes',
  lacteos: 'lacteos', 'lacteos y huevos': 'lacteos', abarrotes: 'granos', granos: 'granos', panaderia: 'granos',
  especias: 'especias',
};

/** Una palabra coincide si es igual (o su plural); las palabras largas también por prefijo ("nopales" → nopal). */
const wordMatches = (words, kw) => {
  if (kw.includes(' ')) return words.join(' ').includes(kw);
  return words.some((w) => w === kw || w === `${kw}s` || w === `${kw}es` || (kw.length >= 5 && w.startsWith(kw)));
};

/** Grupo del ingrediente según su nombre en español; si no hay pistas, según su categoría en la BD. */
export const getIngredientGroup = (nameEs = '', category = '') => {
  const words = toWords(nameEs);
  if (!words.length) return DB_CATEGORY_GROUP[foldAccents(category)] || 'otros';
  // "Chile en polvo", "ajo en polvo": son condimentos aunque empiecen con una verdura
  if (words.includes('polvo')) return 'especias';
  // 1) El sustantivo principal manda: "salsa de tomate" es abarrote, "caldo de pollo" es especia/caldo
  for (const [group, kws] of GROUP_WORDS) {
    if (kws.some((kw) => !kw.includes(' ') && wordMatches([words[0]], kw))) return group;
  }
  // 2) Si no, cualquier palabra del nombre
  for (const [group, kws] of GROUP_WORDS) {
    if (kws.some((kw) => wordMatches(words, kw))) return group;
  }
  return DB_CATEGORY_GROUP[foldAccents(category)] || 'otros';
};
