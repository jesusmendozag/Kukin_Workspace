import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { getErrorMessage } from '../services/api';
import { daysUntil, scheduleExpirationReminders } from '../services/notifications';
import { IconPlus } from '../components/Icons';
import { getIngredientMeta } from '../services/ingredients';

const getUrgency = (dateString) => {
  const days = daysUntil(dateString);
  if (days === null) return { text: 'Sin caducidad', bg: '#F3F4F6', textCol: '#4B5563' };
  if (days < 0) return { text: `Venció hace ${-days}d`, bg: '#FEE2E2', textCol: '#991B1B' };
  if (days === 0) return { text: 'Vence hoy', bg: '#FEE2E2', textCol: '#991B1B' };
  if (days <= 3) return { text: `Vence en ${days}d`, bg: '#FEE2E2', textCol: '#991B1B' };
  return { text: `Vence en ${days}d`, bg: '#DCFCE7', textCol: '#166534' };
};

const formatQty = (q) => Number(q).toLocaleString('es-MX', { maximumFractionDigits: 2 });

function Dashboard() {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [confirmId, setConfirmId] = useState(null);
  const navigate = useNavigate();

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
    return () => { cancelled = true; };
  }, [reloadKey]);

  const retry = () => {
    setLoading(true);
    setReloadKey((k) => k + 1);
  };

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
    <div className="w-full px-6 pt-safe-12 animate-fade-in-up">
      <div className="mb-10 flex justify-between items-center">
        <div>
          <h1 className="text-5xl font-black text-gray-900 tracking-tighter mb-1" style={{ fontFamily: "Fraunces, serif" }}>Alacena</h1>
          <p className="text-base font-bold text-gray-400">
            {inventory.length} {inventory.length === 1 ? 'ingrediente' : 'ingredientes'}
          </p>
        </div>
        <button
          onClick={() => navigate('/add')}
          aria-label="Agregar ingrediente"
          className="w-14 h-14 bg-[#2D7A47] text-white rounded-full flex items-center justify-center shadow-xl active:scale-90 transition-transform"
        >
          <IconPlus />
        </button>
      </div>

      {error && (
        <div role="alert" className="mb-6 text-sm font-bold text-[#991B1B] bg-[#FEE2E2] px-5 py-4 rounded-3xl">
          {error}
          <button onClick={retry} className="block mt-2 underline">Reintentar</button>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => <div key={i} className="h-52 bg-gray-200 rounded-[32px] animate-pulse" />)}
        </div>
      ) : inventory.length === 0 && !error ? (
        <div className="bg-white rounded-[32px] p-8 text-center shadow-sm">
          <div className="text-5xl mb-4">🧺</div>
          <h3 className="text-2xl font-black text-gray-900 mb-2" style={{ fontFamily: "Fraunces, serif" }}>Tu alacena está vacía</h3>
          <p className="text-gray-500 mb-6">Agrega lo que tienes en casa y te sugerimos qué cocinar.</p>
          <button onClick={() => navigate('/add')} className="px-6 py-3 bg-[#2D7A47] text-white font-bold rounded-full active:scale-95 transition-transform">
            Agregar ingrediente
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {inventory.map((item, index) => {
            const status = getUrgency(item.expirationDate);
            const meta = getIngredientMeta(item.ingredientName);
            const confirming = confirmId === item.idInventory;

            return (
              <div
                key={item.idInventory}
                className="bg-white rounded-[32px] p-6 shadow-sm flex flex-col justify-between h-52 animate-fade-in-up"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex justify-between items-start">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl" style={{ background: meta.bg }}>
                    {meta.emoji}
                  </div>
                  {confirming ? (
                    <div className="flex flex-col items-end gap-1">
                      <button onClick={() => handleDelete(item.idInventory)} className="text-[11px] font-black text-white bg-[#991B1B] px-3 py-1.5 rounded-full">
                        Eliminar
                      </button>
                      <button onClick={() => setConfirmId(null)} className="text-[11px] font-bold text-gray-400 px-2">
                        Cancelar
                      </button>
                    </div>
                  ) : (
                    <button onClick={() => setConfirmId(item.idInventory)} aria-label={`Eliminar ${item.ingredientName}`}
                      className="w-8 h-8 rounded-full text-gray-300 hover:text-gray-500 text-xl leading-none">
                      ×
                    </button>
                  )}
                </div>
                <div>
                  <h3 className="text-xl font-black text-gray-900 leading-tight mb-1" style={{ fontFamily: "Fraunces, serif" }}>
                    {item.ingredientName}
                  </h3>
                  <p className="text-sm font-bold text-gray-400 mb-3">{formatQty(item.quantity)} {item.unitSymbol}</p>
                  <div className="inline-block text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-full" style={{ background: status.bg, color: status.textCol }}>
                    {status.text}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default Dashboard;
