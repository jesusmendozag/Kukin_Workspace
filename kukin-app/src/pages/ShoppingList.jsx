import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { IconPlus, IconCheck, IconClose, IconShare, IconPantry } from '../components/Icons';
import { PageTitle, EmptyState, Floating } from '../components/ui';
import { getIngredientMeta } from '../services/ingredients';
import {
  getShoppingList, addToShoppingList, toggleShoppingItem, removeShoppingItem, clearCheckedItems,
  onShoppingListChange, shoppingListText,
} from '../services/shoppingList';

/** Un renglón de la lista: se toca para marcarlo como comprado. */
function Row({ item }) {
  const meta = getIngredientMeta(item.name);
  return (
    <li className={`flex items-center gap-3 p-3 rounded-[20px] transition-all ${item.checked ? 'bg-transparent' : 'bg-white shadow-sm'}`}>
      <button type="button" onClick={() => toggleShoppingItem(item.id)} aria-pressed={item.checked}
        aria-label={item.checked ? `Desmarcar ${item.name}` : `Marcar ${item.name} como comprado`}
        className="flex-1 min-w-0 flex items-center gap-3 text-left active:scale-[0.98] transition-transform">
        <span aria-hidden="true" className={`w-7 h-7 shrink-0 rounded-full border-2 flex items-center justify-center text-white transition-colors ${
          item.checked ? 'bg-basil border-basil' : 'border-gray-300 bg-white'}`}>
          {item.checked && <IconCheck className="w-4 h-4 check-pop" />}
        </span>
        <span className="w-10 h-10 shrink-0 rounded-[12px] flex items-center justify-center text-[1.35rem]" style={{ background: meta.bg }} aria-hidden="true">{meta.emoji}</span>
        <span className={`flex-1 min-w-0 ${item.checked ? 'opacity-50' : ''}`}>
          <span className={`block font-bold text-[1.03rem] first-letter:uppercase truncate ${item.checked ? 'line-through' : ''}`}>{item.name}</span>
          {item.note && <span className="block text-[0.85rem] text-soft truncate">{item.note}</span>}
        </span>
      </button>
      <button type="button" onClick={() => removeShoppingItem(item.id)} aria-label={`Quitar ${item.name} de la lista`}
        className="w-11 h-11 shrink-0 rounded-full flex items-center justify-center text-soft active:scale-90 transition-transform">
        <IconClose className="w-5 h-5" />
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
    <div className="min-h-dvh animate-fade-in-up pb-40">
      <div className="sticky top-0 z-20 bg-cream/95 backdrop-blur">
        <div className="hide-on-keyboard">
          <PageTitle title="Lista del súper" back
            subtitle={list.length ? `${pending.length} por comprar` : undefined}
            action={pending.length > 0 && (
              <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" aria-label="Compartir por WhatsApp"
                className="min-h-12 px-4 rounded-full bg-white shadow-sm text-navy font-bold flex items-center gap-2 active:scale-95 transition-transform">
                <IconShare className="w-5 h-5" /> Compartir
              </a>
            )} />
        </div>
        <div className="show-on-keyboard h-(--safe-top)" aria-hidden="true" />
        <form onSubmit={add} className="flex gap-2 px-5 pb-3 keyboard-open:pt-3">
          <label className="flex-1">
            <span className="sr-only">Agregar a la lista</span>
            <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Agrega: tortillas, jabón…"
              enterKeyHint="done" autoComplete="off" className="field" />
          </label>
          <button type="submit" disabled={!text.trim()} aria-label="Agregar"
            className="w-14 h-14 shrink-0 rounded-[20px] bg-basil text-white flex items-center justify-center active:scale-90 transition-transform disabled:opacity-40">
            <IconPlus className="w-7 h-7" />
          </button>
        </form>
      </div>

      <div className="px-5 pt-2">
        {list.length === 0 ? (
          <EmptyState emoji="🛒" title="Tu lista está vacía"
            text="En una receta, toca «Agregar lo que falta a mi lista», o escribe aquí arriba." />
        ) : (
          <>
            <ul className="space-y-2.5">
              {pending.map((item) => <Row key={item.id} item={item} />)}
            </ul>
            {bought.length > 0 && (
              <>
                <div className="mt-8 mb-3 flex items-center justify-between">
                  <p className="label-micro">Comprado ({bought.length})</p>
                  <button type="button" onClick={clearCheckedItems} className="min-h-11 px-3 font-bold text-soft">Borrar</button>
                </div>
                <ul className="space-y-1">
                  {bought.map((item) => <Row key={item.id} item={item} />)}
                </ul>
              </>
            )}
          </>
        )}
      </div>

      {bought.length > 0 && (
        <Floating>
          <div className="hide-on-keyboard fixed inset-x-0 bottom-0 z-20 bg-cream/95 backdrop-blur px-5 pt-3 pb-[calc(var(--safe-bottom)+1rem)] animate-fade-in-up">
            <button type="button" onClick={moveToPantry}
              className="w-full min-h-14 rounded-full bg-navy text-white font-bold text-[1.06rem] flex items-center justify-center gap-2 active:scale-95 transition-transform">
              <IconPantry className="w-6 h-6" /> Ya lo compré: guardar en alacena ({bought.length})
            </button>
          </div>
        </Floating>
      )}
    </div>
  );
}

export default ShoppingList;
