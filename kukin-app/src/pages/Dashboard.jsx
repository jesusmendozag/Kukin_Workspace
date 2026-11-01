import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { IconPlus } from '../components/Icons';

function Dashboard() {
  const [inventory, setInventory] = useState([]);
  const [possibleRecipesCount, setPossibleRecipesCount] = useState(0);
  const [loading, setLoading] = useState(true);
  
  // NUEVO: Estado para controlar el filtro activo
  const [activeFilter, setActiveFilter] = useState('all'); 
  const navigate = useNavigate();

  const fetchData = async () => {
    try {
      setLoading(true);
      const invResponse = await api.get('/inventory');
      const invData = invResponse.data.data || [];
      setInventory(invData);

      if (invData.length > 0) {
        const recResponse = await api.get('/recipes/suggestions');
        setPossibleRecipesCount(recResponse.data.data?.length || 0);
      }
    } catch (error) {
      if (error.response?.status === 401 || error.response?.status === 403) {
        localStorage.removeItem('token');
        navigate('/');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [navigate]);

  const handleRemove = async (idIngredient, e) => {
    e.stopPropagation(); 
    try {
      await api.delete(`/inventory/${idIngredient}`);
      fetchData(); 
    } catch (error) {
      console.error("Error al eliminar ingrediente:", error);
    }
  };

  const getExpirationDate = (item) => {
    const explicitDate = item.expirationDate || item.expiration_date;
    if (explicitDate) return new Date(`${explicitDate}T00:00:00`);
    const regDateStr = item.dateRegistration || item.date_registration;
    const baseDate = regDateStr ? new Date(regDateStr) : new Date();
    
    const name = (item.ingredientName || item.ingredient_name || item.ingredient?.name_es || '').toLowerCase();
    let daysToSpoil = 7; 
    if (['lata', 'enlatado', 'bote', 'caja', 'arroz', 'frijol', 'lenteja', 'sal', 'azúcar', 'aceite', 'pasta'].some(kw => name.includes(kw))) {
      daysToSpoil = 90;
    } else if (['carne', 'pollo', 'pescado', 'res', 'cerdo'].some(kw => name.includes(kw))) {
      daysToSpoil = 3;
    } else if (['huevo', 'leche', 'queso', 'mantequilla'].some(kw => name.includes(kw))) {
      daysToSpoil = 14; 
    }
    baseDate.setDate(baseDate.getDate() + daysToSpoil);
    return baseDate;
  };

  const getUrgency = (item) => {
    const expirationDate = getExpirationDate(item);
    const today = new Date();
    today.setHours(0,0,0,0);
    expirationDate.setHours(0,0,0,0);
    
    const days = Math.ceil((expirationDate - today) / (1000 * 60 * 60 * 24));
    
    if (days < 0) return { text: "Caducado", bg: "bg-red-100", textCol: "text-red-700", isExpiring: true };
    if (days === 0) return { text: "Vence hoy", bg: "bg-red-100", textCol: "text-red-700", isExpiring: true };
    if (days <= 3) return { text: `Vence en ${days} días`, bg: "bg-red-50", textCol: "text-red-600", isExpiring: true };
    return { text: `Vence en ${days} días`, bg: "bg-[#E8F5E9]", textCol: "text-[#2D7A47]", isExpiring: false };
  };

  const getVisualMeta = (name) => {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('jitomate') || lowerName.includes('tomate')) return { emoji: '🍅', cornerBg: 'bg-[#FFF3E0]' };
    if (lowerName.includes('cebolla')) return { emoji: '🧅', cornerBg: 'bg-[#FDF4E3]' };
    if (lowerName.includes('aguacate')) return { emoji: '🥑', cornerBg: 'bg-[#E8F5E9]' };
    if (lowerName.includes('limón') || lowerName.includes('limon')) return { emoji: '🍋', cornerBg: 'bg-[#FFF9C4]' };
    if (lowerName.includes('chile')) return { emoji: '🌶️', cornerBg: 'bg-[#FFEBEE]' };
    if (lowerName.includes('elote') || lowerName.includes('maíz') || lowerName.includes('tortilla')) return { emoji: '🌽', cornerBg: 'bg-[#FFF8E1]' };
    if (lowerName.includes('frijol')) return { emoji: '🫘', cornerBg: 'bg-[#EFEBE9]' };
    if (lowerName.includes('huevo')) return { emoji: '🥚', cornerBg: 'bg-[#FFF8E1]' };
    if (lowerName.includes('leche')) return { emoji: '🥛', cornerBg: 'bg-[#F3F4F6]' };
    if (lowerName.includes('carne') || lowerName.includes('pollo')) return { emoji: '🥩', cornerBg: 'bg-[#FFEBEE]' };
    return { emoji: '🥫', cornerBg: 'bg-gray-100' }; 
  };

  const expiringItems = inventory.filter(item => getUrgency(item).isExpiring);
  const expiringCount = expiringItems.length;

  // NUEVO: Filtramos la lista según el botón que el usuario tocó
  const displayedInventory = activeFilter === 'expiring' ? expiringItems : inventory;

  const userName = localStorage.getItem('userName') || 'Cocinero';

  return (
    <div className="w-full px-6 pt-12 pb-32 bg-[#FDFBF7] min-h-screen">
      <div className="flex justify-between items-center mb-6 animate-fade-in-up">
        <div>
          <p className="text-sm font-semibold text-gray-500 mb-1">Hola, {userName} 👋</p>
          <h1 className="text-3xl font-black text-[#0B1E36] tracking-tight" style={{ fontFamily: "Fraunces, serif" }}>
            Mi inventario
          </h1>
        </div>
        <div className="w-12 h-12 rounded-full overflow-hidden border border-gray-200 shadow-sm">
          <img src="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=150" alt="Perfil" className="w-full h-full object-cover"/>
        </div>
      </div>

      {/* TARJETAS INTERACTIVAS */}
      <div className="grid grid-cols-3 gap-3 mb-8 animate-fade-in-up delay-100">
        <button 
          onClick={() => setActiveFilter('all')}
          className={`rounded-[20px] p-4 flex flex-col items-center justify-center text-center transition-all duration-300 active:scale-95 ${activeFilter === 'all' ? 'bg-[#E8F5E9] ring-2 ring-[#2E7D32]/30 shadow-md scale-105' : 'bg-white border border-gray-100 shadow-sm opacity-70 hover:opacity-100'}`}
        >
          <span className="text-2xl mb-1">🥦</span>
          <span className="text-xl font-black text-[#2E7D32]">{inventory.length}</span>
          <span className="text-[10px] font-bold text-[#2E7D32]/80 leading-tight mt-1">Ingredientes</span>
        </button>

        <button 
          onClick={() => setActiveFilter('expiring')}
          className={`rounded-[20px] p-4 flex flex-col items-center justify-center text-center transition-all duration-300 active:scale-95 ${activeFilter === 'expiring' ? 'bg-[#FFEBEE] ring-2 ring-[#C62828]/30 shadow-md scale-105' : 'bg-white border border-gray-100 shadow-sm opacity-70 hover:opacity-100'}`}
        >
          <span className="text-2xl mb-1">⏰</span>
          <span className="text-xl font-black text-[#C62828]">{expiringCount}</span>
          <span className="text-[10px] font-bold text-[#C62828]/80 leading-tight mt-1">Por vencer</span>
        </button>

        <button 
          onClick={() => navigate('/recipes')}
          className="bg-white border border-gray-100 rounded-[20px] p-4 flex flex-col items-center justify-center text-center shadow-sm opacity-70 hover:opacity-100 hover:bg-[#EDE7F6] transition-all duration-300 active:scale-95"
        >
          <span className="text-2xl mb-1">📖</span>
          <span className="text-xl font-black text-[#4527A0]">{possibleRecipesCount}</span>
          <span className="text-[10px] font-bold text-[#4527A0]/80 leading-tight mt-1">Descubrir</span>
        </button>
      </div>

      {!loading && activeFilter === 'expiring' && expiringCount > 0 && (
        <div className="bg-red-50 border border-red-100 rounded-[24px] p-5 mb-8 shadow-sm flex items-start gap-4 animate-fade-in-up">
          <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center text-xl shrink-0">⚠️</div>
          <div>
            <h3 className="text-red-800 font-black text-sm uppercase tracking-widest mb-1">Filtro Activo</h3>
            <p className="text-sm font-bold text-red-600 leading-tight">
              Mostrando {expiringCount} {expiringCount === 1 ? 'ingrediente' : 'ingredientes'} en riesgo.
            </p>
          </div>
        </div>
      )}

      <div className="flex justify-between items-end mb-4 animate-fade-in-up delay-200">
        <h2 className="text-xs font-black text-gray-500 uppercase tracking-widest">
          {activeFilter === 'all' ? 'Guardados' : 'Por Vencer'}
        </h2>
        {activeFilter === 'expiring' && (
          <button onClick={() => setActiveFilter('all')} className="text-xs font-bold text-[#2D7A47]">Ver todos</button>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(i => <div key={i} className="bg-white rounded-[24px] h-32 animate-pulse" />)}
        </div>
      ) : displayedInventory.length === 0 ? (
        <div className="bg-white rounded-[32px] p-8 text-center shadow-sm animate-fade-in-up delay-200">
          <div className="text-5xl mb-4">{activeFilter === 'expiring' ? '✨' : '🧊'}</div>
          <h3 className="text-xl font-black text-[#0B1E36] mb-2" style={{ fontFamily: "Fraunces, serif" }}>
            {activeFilter === 'expiring' ? 'Todo está fresco' : 'Tu refri está vacío'}
          </h3>
          <p className="text-sm text-gray-500">
            {activeFilter === 'expiring' ? 'No tienes alimentos próximos a vencer.' : 'Agrega ingredientes para descubrir recetas.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {displayedInventory.map((item, index) => {
            const rawId = item.idIngredient || item.id_ingredient || item.ingredient?.idIngredient || item.ingredient?.id_ingredient;
            const name = item.ingredientName || item.ingredient_name || item.ingredient?.name_es || 'Ingrediente';
            const unit = item.unitSymbol || item.unit_symbol || item.unit?.symbol || 'pza';
            
            const meta = getVisualMeta(name);
            const status = getUrgency(item);

            return (
              <div 
                key={item.idInventory || item.id_inventory || index} 
                className="bg-white rounded-[24px] p-4 shadow-sm flex flex-col justify-between relative overflow-hidden group animate-fade-in-up"
                style={{ animationDelay: `${index * 50}ms`, minHeight: '130px' }}
              >
                <button 
                  onClick={(e) => handleRemove(rawId, e)}
                  className="absolute top-2 left-2 w-7 h-7 bg-white text-red-500 border border-red-100 rounded-full flex items-center justify-center text-xs font-black active:scale-90 transition-all z-20 shadow-md"
                >✕</button>

                <div className={`absolute top-0 right-0 w-14 h-14 ${meta.cornerBg} rounded-bl-[24px] flex items-center justify-center text-2xl z-10`}>
                  {meta.emoji}
                </div>
                
                <div className="mt-auto relative z-10 pt-8">
                  <h3 className="text-[15px] font-black text-[#0B1E36] leading-tight mb-0.5 truncate">{name}</h3>
                  <p className="text-xs font-semibold text-gray-400 mb-2">{item.quantity} {unit}</p>
                  <div className={`inline-block text-[10px] font-black px-2 py-1 rounded-md ${status.bg} ${status.textCol}`}>
                    {status.text}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <button 
        onClick={() => navigate('/add')} 
        className="fixed bottom-28 right-6 w-16 h-16 bg-[#2D7A47] text-white rounded-[20px] flex items-center justify-center shadow-xl shadow-green-900/20 active:scale-90 transition-transform z-40 rotate-3 hover:rotate-0">
        <IconPlus className="w-8 h-8" />
      </button>
    </div>
  );
}

export default Dashboard;