import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { getErrorMessage } from '../services/api';
import { daysUntil, scheduleExpirationReminders } from '../services/notifications';
import { getIngredientMeta } from '../services/ingredients';
import { IconPlus, IconClose, IconCart, IconEdit } from '../components/Icons';
import { getShoppingList, onShoppingListChange } from '../services/shoppingList';
import { PageTitle, ErrorBox, EmptyState, Floating, OfflineNotice } from '../components/ui';

/** Fresco (> 3 días) o alerta (≤ 3 días o caducado). */
const getStatus = (dateString) => {
  const days = daysUntil(dateString);
  if (days === null) return { alert: false, text: 'Sin caducidad', days: Infinity };
  if (days < 0) return { alert: true, text: `Venció hace ${-days} ${-days === 1 ? 'día' : 'días'}`, days };
  if (days === 0) return { alert: true, text: 'Vence hoy', days };
  if (days <= 3) return { alert: true, text: `Vence en ${days} ${days === 1 ? 'día' : 'días'}`, days };
  return { alert: false, text: `Vence en ${days} días`, days };
};

const formatQty = (q) => Number(q).toLocaleString('es-MX', { maximumFractionDigits: 2 });

const toIsoDate = (date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

// De 50 en 50 para gramos/mililitros, de cuarto en cuarto para kilos/litros, de 1 en 1 para piezas
const stepFor = (unit) => {
  const u = (unit || '').toLowerCase();
  if (u === 'g' || u === 'ml') return 50;
  if (u === 'kg' || u === 'l' || u === 'lb') return 0.25;
  return 1;
};

/** Hoja para cambiar cuánto queda y la caducidad de un ingrediente. */
function EditSheet({ item, onClose, onSaved }) {
  const meta = getIngredientMeta(item.ingredientName, item.category);
  const [quantity, setQuantity] = useState(Number(item.quantity));
  const [date, setDate] = useState(item.expirationDate || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const step = stepFor(item.unitSymbol);

  const save = async (qty = quantity) => {
    setSaving(true);
    setError('');
    try {
      await api.patch(`/inventory/${item.idInventory}`, { quantity: qty, expirationDate: date || null });
      onSaved({ ...item, quantity: qty, expirationDate: date || item.expirationDate });
    } catch (err) {
      setError(getErrorMessage(err));
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end" role="dialog" aria-modal="true" aria-labelledby="edit-title">
      <button type="button" className="absolute inset-0 bg-navy/45 animate-fade-in-up [animation-duration:0.2s]" aria-label="Cerrar" onClick={onClose} />
      <div className="sheet-up relative w-full bg-cream rounded-t-[40px] px-5 pt-3 pb-[calc(var(--safe-bottom)+1.25rem)]">
        <div className="mx-auto w-12 h-1.5 rounded-full bg-hairline mb-5" aria-hidden="true" />
        <div className="flex items-center gap-3">
          <span className="w-14 h-14 rounded-[16px] flex items-center justify-center text-[2rem]" style={{ background: meta.bg }} aria-hidden="true">{meta.emoji}</span>
          <h2 id="edit-title" className="font-display font-black text-navy text-[1.7rem] leading-tight">{item.ingredientName}</h2>
        </div>

        <p className="label-micro mt-6 mb-1.5">¿Cuánto te queda?</p>
        <div className="flex items-center justify-between rounded-[24px] bg-white shadow-sm p-1.5">
          <button type="button" onClick={() => setQuantity((q) => Math.max(0, Math.round((q - step) * 100) / 100))}
            aria-label="Menos" className="w-14 h-14 rounded-[18px] bg-cream text-3xl font-black text-basil active:scale-90 transition-transform">−</button>
          <label className="flex items-baseline gap-1.5">
            <span className="sr-only">Cantidad</span>
            <input type="number" inputMode="decimal" min="0" step="any" value={quantity}
              onChange={(e) => setQuantity(e.target.value === '' ? '' : Number(e.target.value))}
              className="w-24 text-center text-[1.6rem] font-black tabular bg-transparent focus:outline-none" />
            <span className="font-bold text-soft">{item.unitSymbol}</span>
          </label>
          <button type="button" onClick={() => setQuantity((q) => Math.round((Number(q) + step) * 100) / 100)}
            aria-label="Más" className="w-14 h-14 rounded-[18px] bg-cream text-3xl font-black text-basil active:scale-90 transition-transform">+</button>
        </div>

        <p className="label-micro mt-5 mb-1.5">Caducidad</p>
        <input type="date" value={date} min={toIsoDate(new Date())} onChange={(e) => setDate(e.target.value)}
          aria-label={`Caducidad de ${item.ingredientName}`} className="field" />

        {error && <div className="mt-4"><ErrorBox message={error} /></div>}

        <div className="mt-6 grid grid-cols-[auto_1fr] gap-3">
          <button type="button" onClick={() => save(0)} disabled={saving}
            className="min-h-14 px-5 rounded-full bg-alert-bg text-alert font-bold active:scale-95 transition-transform disabled:opacity-60">
            Se acabó
          </button>
          <button type="button" onClick={() => save()} disabled={saving || !(Number(quantity) >= 0) || quantity === ''}
            className="min-h-14 rounded-full bg-navy text-white font-bold text-[1.06rem] active:scale-95 transition-transform disabled:opacity-60">
            {saving ? 'Guardando…' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  );
}

function Dashboard() {
  const navigate = useNavigate();
  const [inventory, setInventory] = useState([]);
  const [readyCount, setReadyCount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [confirmId, setConfirmId] = useState(null);
  const [filter, setFilter] = useState('all');
  const [reloadKey, setReloadKey] = useState(0);
  const [editing, setEditing] = useState(null);
  const [offline, setOffline] = useState(false);
  const [listCount, setListCount] = useState(() => getShoppingList().filter((i) => !i.checked).length);

  useEffect(() => onShoppingListChange(() => setListCount(getShoppingList().filter((i) => !i.checked).length)), []);

  useEffect(() => {
    let cancelled = false;
    api.get('/inventory', { offlineCache: true })
      .then(({ data, fromCache }) => {
        if (cancelled) return;
        setInventory(data.data);
        setOffline(!!fromCache);
        setError('');
        if (!fromCache) scheduleExpirationReminders(data.data);
      })
      .catch((err) => !cancelled && setError(getErrorMessage(err)))
      .finally(() => !cancelled && setLoading(false));

    // Cuántas recetas se pueden hacer ya (no bloquea la pantalla si falla)
    api.get('/recipes/suggestions')
      .then(({ data }) => !cancelled && setReadyCount(data.data.filter((r) => (r.matchPercentage ?? 0) >= 80).length))
      .catch(() => {});
    return () => { cancelled = true; };
  }, [reloadKey]);

  const retry = () => { setLoading(true); setReloadKey((k) => k + 1); };

  // Lo que caduca primero, arriba
  const items = useMemo(() => inventory
    .map((item) => ({ ...item, status: getStatus(item.expirationDate) }))
    .sort((a, b) => a.status.days - b.status.days), [inventory]);
  const expiringCount = items.filter((i) => i.status.alert).length;
  const shown = filter === 'expiring' ? items.filter((i) => i.status.alert) : items;

  const handleDelete = async (idInventory) => {
    try {
      await api.delete(`/inventory/${idInventory}`);
      setConfirmId(null);
      const updated = inventory.filter((i) => i.idInventory !== idInventory);
      setInventory(updated);
      scheduleExpirationReminders(updated);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const handleSaved = (updated) => {
    setEditing(null);
    const next = Number(updated.quantity) <= 0
      ? inventory.filter((i) => i.idInventory !== updated.idInventory)
      : inventory.map((i) => (i.idInventory === updated.idInventory ? updated : i));
    setInventory(next);
    scheduleExpirationReminders(next);
  };

  return (
    <div className="animate-fade-in-up">
      <PageTitle title="Mi inventario"
        subtitle={loading ? 'Revisando tu alacena…' : `${items.length} ${items.length === 1 ? 'ingrediente' : 'ingredientes'} guardados`}
        action={
          <button type="button" onClick={() => navigate('/shopping')} aria-label={`Lista del súper${listCount ? `, ${listCount} pendientes` : ''}`}
            className="relative w-12 h-12 rounded-full bg-white shadow-sm text-navy flex items-center justify-center active:scale-90 transition-transform">
            <IconCart className="w-6 h-6" />
            {listCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-6 h-6 px-1 rounded-full bg-basil text-white text-[0.75rem] font-black tabular flex items-center justify-center border-2 border-cream">
                {listCount}
              </span>
            )}
          </button>
        } />

      <div className="px-5 space-y-5">
        <ErrorBox message={error} onRetry={retry} />
        <OfflineNotice show={offline} />

        {/* Para ti: recetas que ya se pueden cocinar */}
        {!loading && items.length > 0 && (
          <button type="button" onClick={() => navigate('/recipes')}
            className="w-full bg-discover-bg text-discover rounded-[24px] p-5 flex items-center gap-4 text-left active:scale-95 transition-transform">
            <span className="text-4xl" aria-hidden="true">🍳</span>
            <span className="flex-1">
              <span className="block label-micro text-discover/80!">Para ti</span>
              <span className="block font-display font-black text-[1.35rem] leading-tight">
                {readyCount ? `${readyCount} ${readyCount === 1 ? 'receta lista' : 'recetas listas'} con lo que tienes` : 'Descubre qué cocinar hoy'}
              </span>
            </span>
            <span aria-hidden="true" className="text-3xl font-black">›</span>
          </button>
        )}

        {!loading && expiringCount > 0 && (
          <div className="flex gap-2" role="group" aria-label="Filtrar inventario">
            {[
              { id: 'all', label: 'Todo' },
              { id: 'expiring', label: `Por caducar (${expiringCount})` },
            ].map((f) => (
              <button key={f.id} type="button" onClick={() => setFilter(f.id)} aria-pressed={filter === f.id}
                className={`min-h-11 px-5 rounded-full font-bold active:scale-95 transition-transform ${
                  filter === f.id ? 'bg-navy text-white' : 'bg-white text-navy shadow-sm'}`}>
                {f.label}
              </button>
            ))}
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-2 gap-4" aria-busy="true" aria-label="Cargando inventario">
            {[1, 2, 3, 4].map((i) => <div key={i} className="h-[150px] bg-white rounded-[24px] animate-pulse" />)}
          </div>
        ) : items.length === 0 && !error ? (
          <EmptyState emoji="🧺" title="Tu alacena está vacía"
            text="Agrega lo que tienes en casa y te sugerimos qué cocinar."
            actionLabel="Agregar ingredientes" onAction={() => navigate('/add')} />
        ) : (
          <ul className="grid grid-cols-2 gap-4">
            {shown.map((item, index) => {
              const meta = getIngredientMeta(item.ingredientName, item.category);
              const confirming = confirmId === item.idInventory;
              return (
                <li key={item.idInventory}
                  className="relative bg-white rounded-[24px] shadow-sm min-h-[150px] overflow-hidden animate-fade-in-up"
                  style={{ animationDelay: `${index * 50}ms` }}>
                  {/* Esquina con el emoji sobre su color pastel */}
                  <div className="pointer-events-none absolute top-0 right-0 w-16 h-16 rounded-bl-[24px] flex items-center justify-center text-[2rem]"
                    style={{ background: meta.bg }} aria-hidden="true">
                    {meta.emoji}
                  </div>

                  {confirming ? (
                    <div className="absolute inset-0 z-10 bg-white flex flex-col items-center justify-center gap-2 p-3 text-center">
                      <p className="font-bold leading-tight">¿Quitar {item.ingredientName}?</p>
                      <button type="button" onClick={() => handleDelete(item.idInventory)}
                        className="w-full min-h-12 rounded-full bg-alert text-white font-bold active:scale-95 transition-transform">
                        Sí, quitar
                      </button>
                      <button type="button" onClick={() => setConfirmId(null)}
                        className="w-full min-h-11 rounded-full font-bold text-soft active:scale-95 transition-transform">
                        Cancelar
                      </button>
                    </div>
                  ) : (
                    <button type="button" onClick={() => setConfirmId(item.idInventory)} aria-label={`Quitar ${item.ingredientName}`}
                      className="absolute top-1 left-1 z-[5] w-11 h-11 flex items-center justify-center active:scale-90 transition-transform">
                      <span className="w-8 h-8 bg-white text-red-500 border border-red-100 rounded-full shadow-md flex items-center justify-center">
                        <IconClose className="w-4 h-4" />
                      </span>
                    </button>
                  )}

                  {/* Tocar la tarjeta abre la edición de cantidad y caducidad */}
                  <button type="button" onClick={() => setEditing(item)} aria-label={`Editar ${item.ingredientName}`}
                    className="block w-full text-left pt-16 px-4 pb-4 active:scale-[0.97] transition-transform">
                    <h3 className="font-display font-black text-navy text-[1.3rem] leading-tight">{item.ingredientName}</h3>
                    <p className="font-bold text-soft tabular flex items-center gap-1.5">
                      {formatQty(item.quantity)} {item.unitSymbol}
                      <IconEdit className="w-4 h-4 text-soft/70" />
                    </p>
                    <span className={`mt-2 inline-block rounded-full px-3 py-1 text-[0.8rem] font-black ${
                      item.status.alert ? 'bg-alert-bg text-alert' : 'bg-fresh-bg text-fresh'}`}>
                      {item.status.text}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {editing && (
        <Floating>
          <EditSheet item={editing} onClose={() => setEditing(null)} onSaved={handleSaved} />
        </Floating>
      )}

      {(loading || items.length > 0) && (
        <Floating>
          <button type="button" onClick={() => navigate('/add')} aria-label="Agregar ingrediente"
            className="hide-on-keyboard fixed right-6 bottom-fab z-30 w-16 h-16 rounded-[22px] bg-basil text-white flex items-center justify-center shadow-[0_10px_24px_-8px_rgb(45_122_71/0.7)] rotate-3 active:rotate-0 active:scale-90 transition-transform">
            <IconPlus className="w-8 h-8" />
          </button>
        </Floating>
      )}
    </div>
  );
}

export default Dashboard;
