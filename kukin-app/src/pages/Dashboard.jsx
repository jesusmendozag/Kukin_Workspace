import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { IconPlus } from '../components/Icons';

function Dashboard() {
  const [inventory, setInventory] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchInventory = async () => {
      try {
        const response = await api.get('/inventory');
        setInventory(response.data.data);
      } catch (error) {
        if (error.response?.status === 401 || error.response?.status === 403) {
          localStorage.removeItem('token');
          navigate('/');
        }
      }
    };
    fetchInventory();
  }, [navigate]);

  const getUrgency = (dateString) => {
    if (!dateString) return { text: "Sin caducidad", bg: "#DCFCE7", textCol: "#166534", isUrgent: false, colorBg: "#F0FDF4" };
    const days = Math.ceil((new Date(dateString) - new Date()) / (1000 * 60 * 60 * 24));
    
    if (days < 0) return { text: "Caducado", bg: "#FEE2E2", textCol: "#991B1B", isUrgent: true, colorBg: "#FEF2F2" };
    if (days <= 3) return { text: `Vence en ${days} d`, bg: "#FEE2E2", textCol: "#991B1B", isUrgent: true, colorBg: "#FEF2F2" };
    return { text: `Vence en ${days} d`, bg: "#DCFCE7", textCol: "#166534", isUrgent: false, colorBg: "#F0FDF4" };
  };

  const urgentCount = inventory.filter(i => getUrgency(i.expirationDate).isUrgent).length;

  return (
    <div className="w-full h-full pt-8 md:pt-12 px-6 md:px-0">
      
      {/* 🏷️ HEADER RESPONSIVO */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 md:mb-12">
        <div>
          <p className="text-xs md:text-sm font-bold text-gray-400 uppercase tracking-widest mb-1 md:mb-3">
            Hola de nuevo 👋
          </p>
          <h1 className="text-3xl md:text-5xl font-bold text-gray-900 leading-tight" style={{ fontFamily: "Fraunces, serif" }}>
            Mi Inventario
          </h1>
        </div>
        
        {/* Botón agregar (Solo visible en PC, en móvil flota) */}
        <button 
          onClick={() => navigate('/add')}
          className="hidden md:flex items-center gap-2 px-6 py-3 rounded-xl text-white font-bold transition-transform hover:scale-105 shadow-lg"
          style={{ background: "linear-gradient(135deg,#2D7A47,#4CAF6B)" }}
        >
          <IconPlus /> Agregar Ingrediente
        </button>
      </div>

      {/* 📊 RESUMEN (Tarjetas de métricas) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6 mb-10 md:mb-16">
        <div className="rounded-3xl p-5 md:p-6 text-center shadow-sm" style={{ background: "#DCFCE7" }}>
          <div className="text-3xl md:text-4xl font-black text-[#166534] mb-1" style={{ fontFamily: "Fraunces, serif" }}>{inventory.length}</div>
          <div className="text-[10px] md:text-xs font-bold text-[#166534]/70 uppercase tracking-wide">Ingredientes</div>
        </div>
        <div className="rounded-3xl p-5 md:p-6 text-center shadow-sm" style={{ background: "#FEE2E2" }}>
          <div className="text-3xl md:text-4xl font-black text-[#991B1B] mb-1" style={{ fontFamily: "Fraunces, serif" }}>{urgentCount}</div>
          <div className="text-[10px] md:text-xs font-bold text-[#991B1B]/70 uppercase tracking-wide">Por Vencer</div>
        </div>
        <div className="rounded-3xl p-5 md:p-6 text-center shadow-sm hidden md:block" style={{ background: "#EDE9FE" }}>
          <div className="text-3xl md:text-4xl font-black text-[#5B21B6] mb-1" style={{ fontFamily: "Fraunces, serif" }}>18</div>
          <div className="text-[10px] md:text-xs font-bold text-[#5B21B6]/70 uppercase tracking-wide">Recetas Posibles</div>
        </div>
      </div>

      {/* 🍱 GRID DE ALACENA */}
      <div className="flex items-center justify-between mb-6">
        <span className="text-xs md:text-sm font-bold text-gray-500 uppercase tracking-wider">Guardados Recientemente</span>
      </div>

      {inventory.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-gray-100">
          <p className="text-lg text-gray-500" style={{ fontFamily: "Fraunces, serif" }}>Tu alacena está vacía.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {inventory.map((item, index) => {
            const status = getUrgency(item.expirationDate || item.expiration_date);
            
            // 🛡️ DICCIONARIO VISUAL: Mapeamos los emojis y nombres basados en el ID
            const rawId = item.idIngredient || item.id_ingredient || item.ingredient?.idIngredient;
            const visualMeta = {
              1: { emoji: '🍅', name: 'Jitomate', colorBg: '#FEF2F2', textCol: '#991B1B' },
              2: { emoji: '🧅', name: 'Cebolla', colorBg: '#FDF8F0', textCol: '#8B6F47' },
              3: { emoji: '🥚', name: 'Huevo', colorBg: '#FEF3C7', textCol: '#92400E' },
              4: { emoji: '🍗', name: 'Pollo', colorBg: '#FEE2E2', textCol: '#991B1B' }
            };

            // Extraemos los datos, si no los manda Java, usamos el diccionario como respaldo
            const meta = visualMeta[rawId] || { emoji: '🥫', name: 'Ingrediente', colorBg: '#F0FDF4', textCol: '#166534' };
            const displayName = item.ingredientName || item.ingredient_name || meta.name;
            const displayUnit = item.unitSymbol || item.unit_symbol || 'pza';
            const itemId = item.idInventory || item.id_inventory || index;

            return (
              <div key={itemId} className="bg-white rounded-3xl p-5 md:p-6 shadow-sm border border-gray-100 relative overflow-hidden flex flex-col justify-between group hover:shadow-md transition-shadow">
                
                {/* 🎨 Ícono de esquina con EMOJI */}
                <div className="absolute top-0 right-0 w-16 h-16 rounded-bl-3xl flex items-center justify-center text-3xl shadow-sm" 
                     style={{ background: meta.colorBg }}>
                  {meta.emoji}
                </div>
                
                <div className="mt-8 md:mt-10">
                  <h3 className="text-base md:text-lg font-bold text-gray-900 leading-tight mb-1" style={{ fontFamily: "Fraunces, serif" }}>
                    {displayName}
                  </h3>
                  <div className="text-xs md:text-sm font-bold text-gray-500 mb-4">
                    {item.quantity} <span className="font-medium text-gray-400">{displayUnit}</span>
                  </div>
                  
                  <div className="inline-flex items-center text-[10px] md:text-xs font-bold px-3 py-1.5 rounded-full"
                    style={{ background: status.bg, color: status.textCol }}>
                    {status.text}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 📱 BOTÓN FLOTANTE MÓVIL (Oculto en Escritorio) */}
      <button 
        onClick={() => navigate('/add')} 
        className="md:hidden fixed bottom-24 right-6 w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-xl transition-transform active:scale-95 z-40"
        style={{ background: "linear-gradient(135deg,#2D7A47,#4CAF6B)" }}>
        <IconPlus />
      </button>
    </div>
  );
}

export default Dashboard;