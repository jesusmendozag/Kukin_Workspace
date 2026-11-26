import { foldAccents } from './ingredients';

/**
 * Lista del súper guardada en el celular.
 * Cada elemento: { id, name, note, checked }. "note" sirve para la receta de origen o la cantidad.
 */
const KEY = 'kukin-shopping-list';
const EVENT = 'kukin-shopping-list-change';

export function getShoppingList() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || [];
  } catch {
    return [];
  }
}

function save(list) {
  localStorage.setItem(KEY, JSON.stringify(list));
  window.dispatchEvent(new Event(EVENT));
  return list;
}

/** Agrega nombres a la lista sin repetir (compara sin acentos ni mayúsculas). Regresa cuántos se agregaron. */
export function addToShoppingList(items) {
  const list = getShoppingList();
  const known = new Set(list.map((i) => foldAccents(i.name).trim()));
  let added = 0;
  for (const { name, note = '' } of items) {
    const key = foldAccents(name).trim();
    if (!key || known.has(key)) continue;
    known.add(key);
    list.push({ id: `${Date.now()}-${added}`, name: name.trim(), note, checked: false });
    added++;
  }
  save(list);
  return added;
}

export const isInShoppingList = (name) =>
  getShoppingList().some((i) => foldAccents(i.name).trim() === foldAccents(name).trim());

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

/** Texto para compartir por WhatsApp. */
export function shoppingListText(list) {
  const pending = list.filter((i) => !i.checked);
  return `🛒 Lista del súper (Kukin)\n${pending.map((i) => `• ${i.name}${i.note ? ` (${i.note})` : ''}`).join('\n')}`;
}
