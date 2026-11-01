import React, { useState } from 'react';
import { IconFire, IconDumbbell, IconHeart, IconMoon } from '../components/Icons';

const dietGoals = [
  { title: "Bajar de peso", desc: "Plan hipocalórico con alimentos saciantes", icon: <IconFire/>, color: "#E84B2D", bg: "#FEF2F0", kcal: "1,400 kcal" },
  { title: "Ganar masa muscular", desc: "Alta proteína, carbohidratos estratégicos", icon: <IconDumbbell/>, color: "#2563EB", bg: "#EFF6FF", kcal: "2,800 kcal" },
  { title: "Salud cardiovascular", desc: "Omega 3, antioxidantes y fibra", icon: <IconHeart/>, color: "#DB2777", bg: "#FDF2F8", kcal: "2,000 kcal" },
  { title: "Descanso y bienestar", desc: "Magnesio y triptófano naturales", icon: <IconMoon/>, color: "#7C3AED", bg: "#F5F3FF", kcal: "1,800 kcal" },
];

function Diets() {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState("");

  const handleActivar = (planName) => {
    setSelectedPlan(planName);
    setModalOpen(true);
  };

  return (
    <div className="w-full px-6 pt-12 animate-fade-in-up relative">
      <div className="mb-10">
        <h1 className="text-5xl font-black text-gray-900 tracking-tighter mb-2" style={{ fontFamily: "Fraunces, serif" }}>
          Dietas
        </h1>
        <p className="text-base font-bold text-gray-500">Selecciona tu objetivo y ruta</p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {dietGoals.map((g) => (
          <div key={g.title} className="bg-white p-8 rounded-[36px] shadow-sm flex flex-col justify-between border border-gray-50">
            <div className="mb-8">
              <div className="w-16 h-16 flex items-center justify-center rounded-[20px] mb-6 shadow-inner" style={{ background: g.bg, color: g.color }}>
                {g.icon}
              </div>
              <h3 className="text-2xl font-black text-gray-900 mb-2 tracking-tight" style={{ fontFamily: "Fraunces, serif" }}>{g.title}</h3>
              <p className="text-sm font-bold text-gray-500 leading-snug">{g.desc}</p>
            </div>
            
            <div className="flex items-center justify-between border-t border-gray-100 pt-6">
              <span className="text-sm font-black text-gray-900">{g.kcal} / día</span>
              <button 
                onClick={() => handleActivar(g.title)}
                className="text-sm font-black px-6 py-3 rounded-full text-white active:scale-90 transition-transform shadow-md" 
                style={{ background: g.color }}
              >
                Activar
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal / Ventana Emergente */}
      {modalOpen && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-6 animate-fade-in-up">
          <div className="bg-white rounded-[36px] p-8 w-full max-w-sm text-center shadow-2xl">
            <div className="text-5xl mb-4">🎉</div>
            <h2 className="text-2xl font-black text-gray-900 mb-2" style={{ fontFamily: "Fraunces, serif" }}>¡Plan Activado!</h2>
            <p className="text-sm text-gray-500 font-bold mb-8">Tu dieta "{selectedPlan}" ha sido configurada. Las sugerencias de recetas se ajustarán a tu objetivo.</p>
            <button 
              onClick={() => setModalOpen(false)}
              className="w-full py-4 bg-gray-900 text-white font-black rounded-full active:scale-95 transition-transform"
            >
              ¡Entendido!
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Diets;