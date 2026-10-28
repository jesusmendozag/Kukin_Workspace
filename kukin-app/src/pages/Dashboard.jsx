import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { IconPlus } from '../components/Icons';

function Dashboard() {
  const [inventory, setInventory] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    // Simulación de carga (reemplaza con tu api.get)
    setInventory([
      { idInventory: 1, idIngredient: 3, ingredientName: "Huevo", quantity: 12, unitSymbol: "pza", expirationDate: "2026-11-15" },
      { idInventory: 2, idIngredient: 1, ingredientName: "Jitomate", quantity: 5, unitSymbol: "pza", expirationDate: "2026-10-30" }
    ]);
  }, []);

  const getUrgency = (dateString) => {
    const days = Math.ceil((new Date(dateString) - new Date()) / (1000 * 60 * 60 * 24));
    if (days <= 3) return { text: `Vence en ${days}d`, bg: "#FEE2E2", textCol: "#991B1B" };
    return { text: `Vence en ${days}d`, bg: "#DCFCE7", textCol: "#166534" };
  };

  return (
    <div className="w-full px-6 pt-12 animate-fade-in-up">
      <div className="mb-10 flex justify-between items-center">
        <div>
          <h1 className="text-5xl font-black text-gray-900 tracking-tighter mb-1" style={{ fontFamily: "Fraunces, serif" }}>Alacena</h1>
          <p className="text-base font-bold text-gray-400">{inventory.length} ingredientes</p>
        </div>
        <button 
          onClick={() => navigate('/add')}
          className="w-14 h-14 bg-[#2D7A47] text-white rounded-full flex items-center justify-center shadow-xl active:scale-90 transition-transform"
        >
          <IconPlus />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {inventory.map((item, index) => {
          const status = getUrgency(item.expirationDate);
          const meta = {
            1: { emoji: '🍅', bg: '#FEF2F2' },
            2: { emoji: '🧅', bg: '#FDF8F0' },
            3: { emoji: '🥚', bg: '#FEF3C7' },
            4: { emoji: '🍗', bg: '#FEE2E2' }
          }[item.idIngredient] || { emoji: '🥫', bg: '#F0FDF4' };

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
              </div>
              <div>
                <h3 className="text-xl font-black text-gray-900 leading-tight mb-1" style={{ fontFamily: "Fraunces, serif" }}>
                  {item.ingredientName}
                </h3>
                <p className="text-sm font-bold text-gray-400 mb-3">{item.quantity} {item.unitSymbol}</p>
                <div className="inline-block text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-full" style={{ background: status.bg, color: status.textCol }}>
                  {status.text}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default Dashboard;