import { foldAccents } from './ingredients';

/**
 * Lista del súper guardada en el celular.
 * Cada elemento: { id, name, amount, recipe, checked }.
 * - amount: cuánto se necesita ("2 cda"), opcional.
 * - recipe: receta para la que se necesita, opcional (sirve para agrupar la lista).
 */
const KEY = 'kukin-shopping-list';
const EVENT = 'kukin-shopping-list-change';

/** Elementos guardados con la versión anterior ("note": "2 cda · Receta") se separan en cantidad y receta. */
const normalize = (item) => {
  if (item.note === undefined) return item;
  const { note, ...rest } = item;
  const [amount = '', ...recipe] = String(note || '').split(' · ');
  return { ...rest, amount, recipe: recipe.join(' · ') };
};

export function getShoppingList() {
  try {
    return (JSON.parse(localStorage.getItem(KEY)) || []).map(normalize);
  } catch {
    return [];
  }
}

function save(list) {
  localStorage.setItem(KEY, JSON.stringify(list));
  window.dispatchEvent(new Event(EVENT));
  return list;
}

/** Agrega a la lista sin repetir (compara sin acentos ni mayúsculas). Regresa cuántos se agregaron. */
export function addToShoppingList(items) {
  const list = getShoppingList();
  const known = new Set(list.map((i) => foldAccents(i.name).trim()));
  let added = 0;
  for (const { name, amount = '', recipe = '' } of items) {
    const key = foldAccents(name).trim();
    if (!key || known.has(key)) continue;
    known.add(key);
    list.push({ id: `${Date.now()}-${added}`, name: name.trim(), amount, recipe, checked: false });
    added++;
  }
  save(list);
  return added;
}

export const toggleShoppingItem = (id) =>
  save(getShoppingList().map((i) => (i.id === id ? { ...i, checked: !i.checked } : i)));

export const removeShoppingItem = (id) => save(getShoppingList().filter((i) => i.id !== id));

export const clearCheckedItems = () => save(getShoppingList().filter((i) => !i.checked));

export const clearShoppingList = () => save([]);

/** Para escuchar cambios desde otras pantallas. Regresa la función para dejar de escuchar. */
export function onShoppingListChange(callback) {
  window.addEventListener(EVENT, callback);
  return () => window.removeEventListener(EVENT, callback);
}

/** Texto para compartir por WhatsApp, agrupado por receta. */
export function shoppingListText(list) {
  const pending = list.filter((i) => !i.checked);
  const groups = new Map();
  for (const i of pending) {
    const g = i.recipe || '';
    if (!groups.has(g)) groups.set(g, []);
    groups.get(g).push(`• ${i.name}${i.amount ? ` (${i.amount})` : ''}`);
  }
  const blocks = [...groups.entries()].map(([recipe, lines]) => `${recipe ? `*${recipe}*\n` : ''}${lines.join('\n')}`);
  return `🛒 Lista del súper (Kukin)\n\n${blocks.join('\n\n')}`;
}
