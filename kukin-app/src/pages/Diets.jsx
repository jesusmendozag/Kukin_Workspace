import React from 'react';
import { IconFire, IconDumbbell, IconHeart, IconMoon } from '../components/Icons';

const dietGoals = [
  { title: "Bajar de peso", desc: "Plan hipocalórico con alimentos saciantes", icon: <IconFire/>, color: "#E84B2D", bg: "#FEF2F0", pct: 62, kcal: "1,400 kcal/día", tag: "Popular" },
  { title: "Ganar masa muscular", desc: "Alta proteína, carbohidratos estratégicos", icon: <IconDumbbell/>, color: "#2563EB", bg: "#EFF6FF", pct: 45, kcal: "2,800 kcal/día", tag: "Recomendado" },
  { title: "Salud cardiovascular", desc: "Omega 3, antioxidantes y fibra", icon: <IconHeart/>, color: "#DB2777", bg: "#FDF2F8", pct: 78, kcal: "2,000 kcal/día", tag: null },
  { title: "Descanso y bienestar", desc: "Magnesio y triptófano naturales", icon: <IconMoon/>, color: "#7C3AED", bg: "#F5F3FF", pct: 30, kcal: "1,800 kcal/día", tag: "Nuevo" },
];

function Diets() {
  return (
    <div className="w-full h-full pt-8 md:pt-12 px-6 md:px-0">
      
      {/* 🏷️ HEADER RESPONSIVO */}
      <div className="mb-8 md:mb-12 flex flex-col md:flex-row md:items-end justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2 md:mb-4">
            <div className="px-3 py-1.5 rounded-full text-xs font-black shadow-sm" style={{ background: "linear-gradient(135deg,#F5A623,#E84B2D)", color: "white" }}>
              ⚡ Premium
            </div>
            <span className="text-xs md:text-sm font-bold text-gray-400 uppercase tracking-widest">Planes Personalizados</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-bold text-gray-900 leading-tight" style={{ fontFamily: "Fraunces, serif" }}>
            Tu objetivo,<br className="md:hidden"/> tu camino
          </h1>
        </div>
      </div>

      {/* 🍱 GRID DE DIETAS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4 md:gap-6">
        {dietGoals.map((g) => (
          <div key={g.title} className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow flex flex-col">
            <div className="flex items-start gap-4 mb-5">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: g.bg, color: g.color }}>
                {g.icon}
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-base md:text-lg font-bold text-gray-900" style={{ fontFamily: "Fraunces, serif" }}>{g.title}</h3>
                  {g.tag && (
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full text-white" style={{ background: g.color }}>{g.tag}</span>
                  )}
                </div>
                <p className="text-xs md:text-sm text-gray-500 leading-relaxed">{g.desc}</p>
              </div>
            </div>
            
            <div className="mt-auto">
              <div className="flex justify-between mb-2">
                <span className="text-[10px] md:text-xs font-semibold text-gray-400 uppercase tracking-wider">Adherencia semanal</span>
                <span className="text-[10px] md:text-xs font-black" style={{ color: g.color }}>{g.pct}%</span>
              </div>
              <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden mb-6">
                <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${g.pct}%`, background: `linear-gradient(90deg,${g.color}88,${g.color})` }}/>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-xs md:text-sm font-bold text-gray-500">🔥 {g.kcal}</span>
                <button className="text-xs md:text-sm font-bold px-6 py-3 rounded-xl text-white transition-transform active:scale-95 shadow-md hover:opacity-90" style={{ background: g.color }}>
                  Activar plan
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Diets;