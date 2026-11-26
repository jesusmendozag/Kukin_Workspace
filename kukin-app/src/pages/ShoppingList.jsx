import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { IconPlus, IconCheck, IconClose, IconShare, IconPantry, IconBack } from '../components/Icons';
import { EmptyState, Floating } from '../components/ui';
import { getIngredientMeta } from '../services/ingredients';
import {
  getShoppingList, addToShoppingList, toggleShoppingItem, removeShoppingItem, clearCheckedItems,
  onShoppingListChange, shoppingListText,
} from '../services/shoppingList';

/** Un renglón: se toca para pasarlo al carrito. La cantidad va en una pastilla a la derecha. */
function Row({ item }) {
  const meta = getIngredientMeta(item.name);
  const done = item.checked;
  return (
    <li className={`flex items-center rounded-[20px] transition-all duration-300 ${done ? 'bg-white/50' : 'bg-white shadow-sm'}`}>
      <button type="button" onClick={() => toggleShoppingItem(item.id)} aria-pressed={done}
        aria-label={done ? `Regresar ${item.name} a la lista` : `Marcar ${item.name} como comprado`}
        className="flex-1 min-w-0 flex items-center gap-3 p-3 pr-1 text-left active:scale-[0.98] transition-transform">
        <span aria-hidden="true" className={`w-7 h-7 shrink-0 rounded-full border-2 flex items-center justify-center text-white transition-colors ${
          done ? 'bg-basil border-basil' : 'border-gray-300 bg-white'}`}>
          {done && <IconCheck className="w-4 h-4 check-pop" />}
        </span>
        <span className={`w-11 h-11 shrink-0 rounded-[14px] flex items-center justify-center text-[1.45rem] transition-opacity ${done ? 'opacity-50' : ''}`}
          style={{ background: meta.bg }} aria-hidden="true">{meta.emoji}</span>
        <span className={`flex-1 min-w-0 font-bold text-[1.05rem] leading-tight first-letter:uppercase line-clamp-2 ${done ? 'line-through text-soft' : 'text-navy'}`}>
          {item.name}
        </span>
        {item.amount && (
          <span className={`shrink-0 rounded-full px-2.5 py-1 text-[0.85rem] font-black tabular ${done ? 'text-soft' : 'bg-fresh-bg text-fresh'}`}>
            {item.amount}
          </span>
        )}
      </button>
      <button type="button" onClick={() => removeShoppingItem(item.id)} aria-label={`Quitar ${item.name} de la lista`}
        className="w-11 h-11 mr-1 shrink-0 rounded-full flex items-center justify-center text-soft/70 active:scale-90 transition-transform">
        <IconClose className="w-[18px] h-[18px]" />
      </button>
    </li>
  );
}

/** Lista del súper: lo que falta para las recetas, más lo que agregues a mano. Se comparte por WhatsApp. */
function ShoppingList() {
  const navigate = useNavigate();
  const [list, setList] = useState(getShoppingList);
  const [text, setText] = useState('');

  useEffect(() => onShoppingListChange(() => setList(getShoppingList())), []);

  const pending = list.filter((i) => !i.checked);
  const bought = list.filter((i) => i.checked);
  const progress = list.length ? Math.round((bought.length / list.length) * 100) : 0;

  // Lo pendiente, agrupado por receta; lo que se agregó a mano va al final
  const groups = useMemo(() => {
    const map = new Map();
    for (const item of pending) {
      const key = item.recipe || '';
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(item);
    }
    return [...map.entries()].sort(([a], [b]) => (a === '') - (b === ''));
  }, [pending]);

  const add = (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    addToShoppingList([{ name: text.trim() }]);
    setText('');
  };

  // "Ya lo compré": se abre Añadir con esos ingredientes ya elegidos y se quitan de la lista
  const moveToPantry = () => {
    const names = bought.map((i) => i.name);
    clearCheckedItems();
    navigate('/add', { state: { preselect: names } });
  };

  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shoppingListText(list))}`;

  return (
    <div className={`min-h-dvh animate-fade-in-up ${bought.length ? 'pb-36' : 'pb-12'}`}>
      <header className="hide-on-keyboard pt-safe px-5">
        {/* Botones arriba y título abajo a todo lo ancho: el título nunca se parte en tres renglones */}
        <div className="pt-4 flex items-center justify-between">
          <button type="button" onClick={() => navigate(-1)} aria-label="Regresar"
            className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm active:scale-90 transition-transform">
            <IconBack className="w-6 h-6" />
          </button>
          {pending.length > 0 && (
            <a href={whatsappUrl} target="_blank" rel="noopener noreferrer"
              className="min-h-12 pl-4 pr-5 rounded-full bg-white shadow-sm text-navy font-bold flex items-center gap-2 active:scale-95 transition-transform">
              <IconShare className="w-5 h-5 text-basil" /> Compartir
            </a>
          )}
        </div>
        <h1 className="mt-4 font-display font-black text-navy text-[2.25rem] leading-[1.05]">Lista del súper</h1>
        {list.length > 0 && (
          <p className="mt-1 font-semibold text-soft">
            {pending.length === 0 ? 'Ya tienes todo' : `${pending.length} por comprar`}
          </p>
        )}
      </header>

      <div className="show-on-keyboard h-(--safe-top)" aria-hidden="true" />

      {/* Agregar a mano: el botón vive dentro del campo */}
      <form onSubmit={add} className="px-5 mt-5 keyboard-open:mt-3">
        <label className="relative block">
          <span className="sr-only">Agregar a la lista</span>
          <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Agrega: tortillas, jabón…"
            enterKeyHint="done" autoComplete="off" className="field pr-16" />
          <button type="submit" disabled={!text.trim()} aria-label="Agregar a la lista"
            className="absolute right-2 top-1/2 -translate-y-1/2 w-11 h-11 rounded-[14px] bg-basil text-white flex items-center justify-center active:scale-90 transition-all disabled:bg-cream disabled:text-soft/60">
            <IconPlus className="w-6 h-6" />
          </button>
        </label>
      </form>

      <div className="px-5 mt-5">
        {list.length === 0 ? (
          <EmptyState emoji="🛒" title="Tu lista está vacía"
            text="En una receta, toca «Agregar lo que falta a mi lista», o escribe aquí arriba." />
        ) : (
          <>
            {/* Avance de la compra */}
            <div className="hide-on-keyboard bg-white rounded-[24px] shadow-sm p-4 flex items-center gap-4" role="status">
              <span className="text-3xl" aria-hidden="true">{pending.length === 0 ? '🎉' : '🛒'}</span>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-navy">
                  {pending.length === 0 ? '¡Compraste todo!' : `${bought.length} de ${list.length} en el carrito`}
                </p>
                <div className="mt-2 h-2 rounded-full bg-hairline overflow-hidden" aria-hidden="true">
                  <div className="h-full rounded-full bg-basil transition-[width] duration-500 ease-out" style={{ width: `${progress}%` }} />
                </div>
              </div>
            </div>

            {groups.map(([recipe, items]) => (
              <section key={recipe || 'manual'} className="mt-6" aria-label={recipe ? `Para ${recipe}` : 'Agregados por ti'}>
                <div className="mb-2.5 flex items-center gap-2 px-1">
                  <span aria-hidden="true">{recipe ? '🍲' : '✍️'}</span>
                  <p className="flex-1 min-w-0 truncate font-bold text-soft text-[0.95rem]">
                    {recipe ? <>Para <span className="text-navy">{recipe}</span></> : 'Agregados por ti'}
                  </p>
                  <span className="shrink-0 text-[0.85rem] font-black text-soft tabular">{items.length}</span>
                </div>
                <ul className="space-y-2.5">
                  {items.map((item) => <Row key={item.id} item={item} />)}
                </ul>
              </section>
            ))}

            {bought.length > 0 && (
              <section className="mt-8" aria-label="En el carrito">
                <div className="mb-2.5 flex items-center justify-between px-1">
                  <p className="label-micro">En el carrito ({bought.length})</p>
                  <button type="button" onClick={clearCheckedItems} className="min-h-11 px-2 font-bold text-soft active:scale-95 transition-transform">
                    Vaciar
                  </button>
                </div>
                <ul className="space-y-2">
                  {bought.map((item) => <Row key={item.id} item={item} />)}
                </ul>
              </section>
            )}
          </>
        )}
      </div>

      {bought.length > 0 && (
        <Floating>
          <div className="hide-on-keyboard fixed inset-x-0 bottom-0 z-20 bg-cream/95 backdrop-blur px-5 pt-3 pb-[calc(var(--safe-bottom)+1rem)] animate-fade-in-up">
            <button type="button" onClick={moveToPantry}
              className="w-full min-h-14 rounded-full bg-navy text-white font-bold text-[1.06rem] flex items-center justify-center gap-2 active:scale-95 transition-transform">
              <IconPantry className="w-6 h-6" /> Guardar lo comprado en alacena ({bought.length})
            </button>
          </div>
        </Floating>
      )}
    </div>
  );
}

export default ShoppingList;
