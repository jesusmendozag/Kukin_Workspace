import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { getErrorMessage } from '../services/api';
import { getIngredientMeta, getIngredientGroup, COMMON_INGREDIENTS, CATEGORIES, foldAccents } from '../services/ingredients';
import { IconSearch, IconClose, IconCheck, IconPlus } from '../components/Icons';
import { PageTitle, ErrorBox, Floating } from '../components/ui';

// Caducidad automática: +90 días abarrotes, +3 carnes, +5 frescos por defecto
const SHELF_LIFE_BY_NAME = { huevo: 21, cebolla: 21, ajo: 30, papa: 30 };
const SHELF_LIFE_BY_CATEGORY = { Proteínas: 3, Granos: 90, Especias: 90 };

// Medida con la que normalmente se compra cada cosa (símbolos del catálogo de unidades)
const DEFAULT_UNIT_BY_NAME = {
  leche: 'L', arroz: 'kg', frijol: 'kg', pasta: 'g', 'carne de res': 'kg', pollo: 'kg', queso: 'g',
  mantequilla: 'g', 'tortilla de maíz': 'kg', ajo: 'diente', cilantro: 'manojo',
};

const toIsoDate = (date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

const estimateExpiration = (ingredient) => {
  const name = ingredient?.nameEs?.toLowerCase();
  const days = SHELF_LIFE_BY_NAME[name] ?? SHELF_LIFE_BY_CATEGORY[ingredient?.category] ?? 5;
  const target = new Date();
  target.setDate(target.getDate() + days);
  return toIsoDate(target);
};

const pickUnit = (ingredient, units) => {
  const wanted = (DEFAULT_UNIT_BY_NAME[ingredient.nameEs.toLowerCase()] || 'pza').toLowerCase();
  return (units.find((u) => u.symbol?.toLowerCase() === wanted) || units[0])?.idUnit;
};

const formatQty = (q) => Number(q).toLocaleString('es-MX', { maximumFractionDigits: 2 });

// Categorías genéricas de la BD: si hay un duplicado, se prefiere el registro con categoría real
const GENERIC_CATEGORIES = new Set(['spoonacular', 'otros', 'general', '']);

/**
 * El catálogo puede traer el mismo nombre repetido (ej. dos "Nopales").
 * Se deja uno solo: el que ya está en la alacena, si no el que tiene categoría real, si no el más antiguo.
 * Además se le asigna su grupo (Verduras, Frutas…) y se ordena alfabéticamente.
 */
const dedupeCatalog = (list, ownedById) => {
  const score = (i) => (ownedById[i.idIngredient] ? 0 : GENERIC_CATEGORIES.has(foldAccents(i.category || '')) ? 2 : 1);
  const byName = new Map();
  for (const i of list) {
    const key = foldAccents(i.nameEs).trim();
    const prev = byName.get(key);
    if (!prev || score(i) < score(prev) || (score(i) === score(prev) && i.idIngredient < prev.idIngredient)) {
      byName.set(key, i);
    }
  }
  return [...byName.values()]
    .map((i) => ({ ...i, group: getIngredientGroup(i.nameEs, i.category) }))
    .sort((a, b) => a.nameEs.localeCompare(b.nameEs, 'es'));
};

/** Tarjeta de ingrediente que se toca para elegirla. */
function PickCard({ ingredient, selected, owned, onToggle }) {
  const meta = getIngredientMeta(ingredient.nameEs, ingredient.category);
  return (
    <li className="relative">
      <button type="button" onClick={() => onToggle(ingredient)} aria-pressed={selected}
        className={`w-full h-[118px] bg-white rounded-[20px] border-2 flex flex-col items-center justify-center gap-2 px-1 text-center active:scale-95 transition-transform ${
          selected ? 'border-basil shadow-[0_6px_16px_-8px_rgb(45_122_71/0.6)]' : 'border-transparent shadow-sm'}`}>
        <span className="w-14 h-14 rounded-[16px] flex items-center justify-center text-[2rem]" style={{ background: meta.bg }} aria-hidden="true">
          {meta.emoji}
        </span>
        <span className="font-bold text-[0.95rem] leading-tight line-clamp-2">{ingredient.nameEs}</span>
      </button>
      {selected && (
        <span aria-hidden="true" className="absolute -top-2 -right-1 w-8 h-8 rounded-full bg-basil text-white flex items-center justify-center border-[3px] border-cream">
          <IconCheck className="w-4 h-4" />
        </span>
      )}
      {owned && !selected && (
        <span className="absolute top-2 left-2 rounded-full bg-fresh-bg text-fresh px-2 py-0.5 text-[0.7rem] font-black">Ya tienes</span>
      )}
    </li>
  );
}

function AddIngredient() {
  const navigate = useNavigate();
  const [ingredients, setIngredients] = useState([]);
  const [units, setUnits] = useState([]);
  const [owned, setOwned] = useState({}); // idIngredient -> registro de la alacena
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState(null);
  const [selected, setSelected] = useState({}); // idIngredient -> { quantity, idUnit, expirationDate }
  const [step, setStep] = useState('pick');
  const [saving, setSaving] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    let cancelled = false;
    Promise.all([api.get('/ingredients'), api.get('/units'), api.get('/inventory')])
      .then(([ing, uni, inv]) => {
        if (cancelled) return;
        const ownedById = Object.fromEntries(inv.data.data.map((i) => [i.idIngredient, i]));
        setIngredients(dedupeCatalog(ing.data.data, ownedById));
        setUnits(uni.data.data);
        setOwned(ownedById);
        setError('');
      })
      .catch((err) => !cancelled && setError(getErrorMessage(err)))
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, [reloadKey]);

  const byId = useMemo(() => Object.fromEntries(ingredients.map((i) => [i.idIngredient, i])), [ingredients]);

  const common = useMemo(() => {
    const byName = Object.fromEntries(ingredients.map((i) => [foldAccents(i.nameEs), i]));
    return COMMON_INGREDIENTS.map((n) => byName[foldAccents(n)]).filter(Boolean);
  }, [ingredients]);

  // Cuántos ingredientes hay en cada grupo (solo se muestran los filtros que tienen algo)
  const groupCounts = useMemo(() => ingredients.reduce((acc, i) => {
    acc[i.group] = (acc[i.group] || 0) + 1;
    return acc;
  }, {}), [ingredients]);

  const results = useMemo(() => {
    const q = foldAccents(query.trim());
    if (!q && !category) return null;
    return ingredients.filter((i) =>
      (!category || i.group === category) &&
      (!q || foldAccents(i.nameEs).includes(q) || foldAccents(i.nameEn || '').includes(q)));
  }, [ingredients, query, category]);

  // Al escribir o cambiar de categoría, los resultados empiezan arriba (visibles aunque el teclado esté abierto)
  useEffect(() => {
    if (step === 'pick') window.scrollTo({ top: 0 });
  }, [query, category, step]);

  const toggle = (ingredient) => {
    setSelected((s) => {
      const next = { ...s };
      if (next[ingredient.idIngredient]) {
        delete next[ingredient.idIngredient];
      } else {
        // Si ya lo tiene, se suma con la misma unidad que ya está guardada
        const existing = owned[ingredient.idIngredient];
        next[ingredient.idIngredient] = {
          quantity: 1,
          idUnit: existing?.idUnit ?? pickUnit(ingredient, units),
          expirationDate: '',
        };
      }
      return next;
    });
  };

  // Si lo que escribió no está en el catálogo, se puede agregar (el backend limpia el nombre y evita repetidos)
  const typed = query.trim();
  const canCreate = typed.length >= 2 && !ingredients.some((i) => foldAccents(i.nameEs) === foldAccents(typed));

  const createIngredient = async () => {
    setError('');
    setCreating(true);
    try {
      const { data } = await api.post('/ingredients', { name: typed });
      const created = data.data;
      const ingredient = { ...created, group: getIngredientGroup(created.nameEs, created.category) };
      setIngredients((list) => (list.some((i) => i.idIngredient === created.idIngredient)
        ? list
        : [...list, ingredient].sort((a, b) => a.nameEs.localeCompare(b.nameEs, 'es'))));
      if (!selected[created.idIngredient]) toggle(ingredient);
      setCategory(null);
      setQuery(created.nameEs);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setCreating(false);
    }
  };

  const createButton = (
    <button type="button" onClick={createIngredient} disabled={creating}
      className="mt-4 w-full min-h-14 rounded-full bg-basil text-white font-bold text-[1.06rem] flex items-center justify-center gap-2 active:scale-95 transition-transform disabled:opacity-60">
      <IconPlus className="w-5 h-5" />
      {creating ? 'Agregando…' : `Agregar «${typed}»`}
    </button>
  );

  const update = (id, patch) => setSelected((s) => ({ ...s, [id]: { ...s[id], ...patch } }));
  const selectedIds = Object.keys(selected).map(Number);
  const count = selectedIds.length;
  const validAmounts = selectedIds.every((id) => Number(selected[id].quantity) > 0 && selected[id].idUnit);

  const save = async () => {
    setError('');
    setSaving(true);
    try {
      for (const id of selectedIds) {
        const item = selected[id];
        await api.post('/inventory', {
          idIngredient: id,
          quantity: Number(item.quantity),
          idUnit: Number(item.idUnit),
          expirationDate: item.expirationDate || estimateExpiration(byId[id]),
        });
      }
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const bottomBar = 'hide-on-keyboard fixed inset-x-0 bottom-0 z-20 bg-cream/95 backdrop-blur px-5 pt-3 pb-[calc(var(--safe-bottom)+1rem)]';

  /* ───────── Paso 2: cantidades ───────── */
  if (step === 'amounts') {
    return (
      <div className="min-h-dvh animate-fade-in-up">
        <div className="sticky top-0 z-20 bg-cream/95 backdrop-blur">
          <PageTitle title="¿Cuánto tienes?"
            action={
              <button type="button" onClick={() => setStep('pick')}
                className="min-h-11 px-4 rounded-full bg-white shadow-sm font-bold active:scale-95 transition-transform">
                Volver
              </button>
            } />
        </div>

        <ul className="px-5 space-y-4 pb-40">
          {selectedIds.map((id, index) => {
            const ing = byId[id];
            const item = selected[id];
            const meta = getIngredientMeta(ing.nameEs, ing.category);
            const existing = owned[id];
            const qty = Number(item.quantity) || 0;
            return (
              <li key={id} className="bg-white rounded-[24px] shadow-sm p-5 animate-fade-in-up" style={{ animationDelay: `${index * 50}ms` }}>
                <div className="flex items-center gap-3">
                  <span className="w-14 h-14 rounded-[16px] flex items-center justify-center text-[2rem]" style={{ background: meta.bg }} aria-hidden="true">{meta.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <h2 className="font-display font-black text-[1.35rem] leading-tight">{ing.nameEs}</h2>
                    {existing && (
                      <p className="text-[0.92rem] font-semibold text-fresh">
                        Ya tienes {formatQty(existing.quantity)} {existing.unitSymbol}; se sumará.
                      </p>
                    )}
                  </div>
                  <button type="button" onClick={() => toggle(ing)} aria-label={`Quitar ${ing.nameEs}`}
                    className="w-11 h-11 rounded-full flex items-center justify-center text-soft active:scale-90 transition-transform">
                    <IconClose className="w-6 h-6" />
                  </button>
                </div>

                <div className="mt-4 grid grid-cols-[auto_1fr] gap-3">
                  <div>
                    <p className="label-micro mb-1.5">Cantidad</p>
                    <div className="flex items-center rounded-[20px] bg-cream">
                      <button type="button" onClick={() => update(id, { quantity: Math.max(qty - 1, 0.5) })}
                        aria-label="Menos" className="w-12 h-14 text-2xl font-black text-basil active:scale-90 transition-transform">−</button>
                      <input type="number" inputMode="decimal" min="0.01" step="0.01" value={item.quantity}
                        onChange={(e) => update(id, { quantity: e.target.value })} aria-label={`Cantidad de ${ing.nameEs}`}
                        className="w-12 text-center text-[1.15rem] font-black tabular bg-transparent focus:outline-none" />
                      <button type="button" onClick={() => update(id, { quantity: qty < 1 ? 1 : qty + 1 })}
                        aria-label="Más" className="w-12 h-14 text-2xl font-black text-basil active:scale-90 transition-transform">+</button>
                    </div>
                  </div>
                  <div className="min-w-0">
                    <p className="label-micro mb-1.5">Unidad</p>
                    <select value={item.idUnit ?? ''} onChange={(e) => update(id, { idUnit: e.target.value })}
                      disabled={Boolean(existing)} aria-label={`Unidad de ${ing.nameEs}`}
                      className="field bg-cream shadow-none disabled:opacity-70">
                      {units.map((u) => <option key={u.idUnit} value={u.idUnit}>{u.name} ({u.symbol})</option>)}
                    </select>
                  </div>
                </div>

                <div className="mt-3">
                  <p className="label-micro mb-1.5">Caducidad (opcional)</p>
                  <input type="date" value={item.expirationDate} min={toIsoDate(new Date())}
                    onChange={(e) => update(id, { expirationDate: e.target.value })}
                    aria-label={`Caducidad de ${ing.nameEs}`} className="field bg-cream shadow-none" />
                  {!item.expirationDate && <p className="mt-1.5 text-[0.9rem] text-soft">Si la dejas vacía, la calculamos por ti.</p>}
                </div>
              </li>
            );
          })}
          {error && <li><ErrorBox message={error} /></li>}
        </ul>

        <Floating>
          <div className={bottomBar}>
            <button type="button" onClick={save} disabled={saving || !validAmounts || count === 0}
              className="w-full min-h-14 rounded-full bg-navy text-white font-bold text-[1.06rem] active:scale-95 transition-transform disabled:opacity-60">
              {saving ? 'Guardando…' : `Guardar en alacena (${count})`}
            </button>
          </div>
        </Floating>
      </div>
    );
  }

  /* ───────── Paso 1: elegir ───────── */
  return (
    <div className="min-h-dvh animate-fade-in-up">
      <div className="sticky top-0 z-20 bg-cream/95 backdrop-blur shadow-[0_8px_16px_-14px_rgb(11_30_54/0.35)]">
        {/* Mientras se escribe, el título se oculta para dejar más espacio a los resultados */}
        <div className="hide-on-keyboard"><PageTitle title="Añadir" back /></div>
        <div className="show-on-keyboard h-(--safe-top)" aria-hidden="true" />
        <label className="relative block px-5 pt-0 keyboard-open:pt-3">
          <span className="sr-only">Buscar ingrediente</span>
          <IconSearch className="w-6 h-6 absolute left-9 top-1/2 -translate-y-1/2 text-soft pointer-events-none" />
          <input type="search" value={query} onChange={(e) => setQuery(e.target.value)}
            placeholder="Busca: chile, leche, pollo…" enterKeyHint="search" autoComplete="off"
            className="field pl-12 pr-12" />
          {query && (
            <button type="button" onClick={() => setQuery('')} aria-label="Borrar búsqueda"
              className="absolute right-6 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full flex items-center justify-center text-soft">
              <IconClose className="w-5 h-5" />
            </button>
          )}
        </label>

      <div role="group" aria-label="Categorías" className="flex gap-2 overflow-x-auto scrollbar-hide px-5 py-3">
        {CATEGORIES.filter((c) => groupCounts[c.id]).map((c) => {
          const on = category === c.id;
          return (
            <button key={c.id} type="button" onClick={() => setCategory(on ? null : c.id)} aria-pressed={on}
              className={`shrink-0 min-h-11 px-4 rounded-full font-bold flex items-center gap-2 active:scale-95 transition-transform ${
                on ? 'bg-navy text-white' : 'bg-white text-navy shadow-sm'}`}>
              <span aria-hidden="true">{c.emoji}</span>{c.label}
              <span className={`tabular text-[0.8rem] ${on ? 'text-white/75' : 'text-soft'}`}>{groupCounts[c.id]}</span>
            </button>
          );
        })}
      </div>
      </div>

      <div className="px-5 pt-4 pb-40">
        {error && <div className="mb-4"><ErrorBox message={error} onRetry={() => { setLoading(true); setReloadKey((k) => k + 1); }} /></div>}

        {loading ? (
          <div className="grid grid-cols-3 gap-3" aria-busy="true" aria-label="Cargando ingredientes">
            {Array.from({ length: 9 }).map((_, i) => <div key={i} className="h-[118px] bg-white rounded-[20px] animate-pulse" />)}
          </div>
        ) : results ? (
          results.length === 0 ? (
            <div className="bg-white rounded-[24px] shadow-sm p-6 text-center">
              <div className="text-5xl mb-2" aria-hidden="true">🔍</div>
              <p className="font-display font-black text-[1.3rem]">
                {query.trim() ? `No encontramos «${query.trim()}»` : 'No hay ingredientes aquí'}
              </p>
              <p className="text-soft mt-1">
                {canCreate ? 'Puedes agregarlo tú y queda guardado para la próxima.'
                  : category && query.trim() ? 'Quita el filtro de categoría para buscar en todo.' : 'Prueba con otra palabra u otra categoría.'}
              </p>
              {canCreate && createButton}
              {category && !canCreate && (
                <button type="button" onClick={() => setCategory(null)}
                  className="mt-4 min-h-11 px-5 rounded-full bg-navy text-white font-bold active:scale-95 transition-transform">
                  Ver todas las categorías
                </button>
              )}
            </div>
          ) : (
            <>
              <ul className="grid grid-cols-3 gap-3">
                {results.map((i) => (
                  <PickCard key={i.idIngredient} ingredient={i} selected={!!selected[i.idIngredient]} owned={!!owned[i.idIngredient]} onToggle={toggle} />
                ))}
              </ul>
              {canCreate && (
                <div className="mt-6 text-center">
                  <p className="text-soft">¿No es ninguno de estos?</p>
                  {createButton}
                </div>
              )}
            </>
          )
        ) : (
          <>
            <p className="label-micro mb-3">Básicos de cocina</p>
            <ul className="grid grid-cols-3 gap-3">
              {common.map((i) => (
                <PickCard key={i.idIngredient} ingredient={i} selected={!!selected[i.idIngredient]} owned={!!owned[i.idIngredient]} onToggle={toggle} />
              ))}
            </ul>
            {ingredients.length > common.length && (
              <p className="mt-6 text-center text-soft">¿No está aquí? Búscalo arriba o elige una categoría.</p>
            )}
          </>
        )}
      </div>

      {count > 0 && (
        <Floating>
          <div className={`${bottomBar} animate-fade-in-up`}>
            <div className="flex items-center gap-2 mb-3 overflow-x-auto scrollbar-hide" aria-label="Elegidos">
              {selectedIds.map((id) => (
                <span key={id} className="text-[1.8rem] leading-none" title={byId[id]?.nameEs}>
                  {getIngredientMeta(byId[id]?.nameEs, byId[id]?.category).emoji}
                </span>
              ))}
            </div>
            <button type="button" onClick={() => setStep('amounts')}
              className="w-full min-h-14 rounded-full bg-basil text-white font-bold text-[1.06rem] active:scale-95 transition-transform">
              Siguiente: cantidades ({count})
            </button>
          </div>
        </Floating>
      )}
    </div>
  );
}

export default AddIngredient;
