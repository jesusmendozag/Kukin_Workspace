import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { getErrorMessage } from '../services/api';
import { daysUntil, scheduleExpirationReminders } from '../services/notifications';
import { getIngredientMeta } from '../services/ingredients';
import { IconPlus, IconClose } from '../components/Icons';
import { PageTitle, ErrorBox, EmptyState, Floating } from '../components/ui';

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

function Dashboard() {
  const navigate = useNavigate();
  const [inventory, setInventory] = useState([]);
  const [readyCount, setReadyCount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [confirmId, setConfirmId] = useState(null);
  const [filter, setFilter] = useState('all');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    api.get('/inventory')
      .then(({ data }) => {
        if (cancelled) return;
        setInventory(data.data);
        setError('');
        scheduleExpirationReminders(data.data);
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

  return (
    <div className="animate-fade-in-up">
      <PageTitle title="Mi inventario"
        subtitle={loading ? 'Revisando tu alacena…' : `${items.length} ${items.length === 1 ? 'ingrediente' : 'ingredientes'} guardados`} />

      <div className="px-5 space-y-5">
        <ErrorBox message={error} onRetry={retry} />

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
                  <div className="absolute top-0 right-0 w-16 h-16 rounded-bl-[24px] flex items-center justify-center text-[2rem]"
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
                      className="absolute top-1 left-1 w-11 h-11 flex items-center justify-center active:scale-90 transition-transform">
                      <span className="w-8 h-8 bg-white text-red-500 border border-red-100 rounded-full shadow-md flex items-center justify-center">
                        <IconClose className="w-4 h-4" />
                      </span>
                    </button>
                  )}

                  <div className="pt-16 px-4 pb-4">
                    <h3 className="font-display font-black text-navy text-[1.3rem] leading-tight">{item.ingredientName}</h3>
                    <p className="font-bold text-soft tabular">{formatQty(item.quantity)} {item.unitSymbol}</p>
                    <span className={`mt-2 inline-block rounded-full px-3 py-1 text-[0.8rem] font-black ${
                      item.status.alert ? 'bg-alert-bg text-alert' : 'bg-fresh-bg text-fresh'}`}>
                      {item.status.text}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

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
