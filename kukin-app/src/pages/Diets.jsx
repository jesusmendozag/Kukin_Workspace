import React from 'react';
import { IconFire, IconDumbbell, IconHeart, IconMoon } from '../components/Icons';

const dietGoals = [
  { title: "Bajar de peso", desc: "Plan hipocalórico con alimentos saciantes", icon: <IconFire/>, color: "#E84B2D", bg: "#FEF2F0", kcal: "1,400 kcal" },
  { title: "Ganar masa muscular", desc: "Alta proteína, carbohidratos estratégicos", icon: <IconDumbbell/>, color: "#2563EB", bg: "#EFF6FF", kcal: "2,800 kcal" },
  { title: "Salud cardiovascular", desc: "Omega 3, antioxidantes y fibra", icon: <IconHeart/>, color: "#DB2777", bg: "#FDF2F8", kcal: "2,000 kcal" },
  { title: "Descanso y bienestar", desc: "Magnesio y triptófano naturales", icon: <IconMoon/>, color: "#7C3AED", bg: "#F5F3FF", kcal: "1,800 kcal" },
];

function Diets() {
  return (
    <div className="w-full px-6 md:px-12 pt-8 md:pt-4">
      <div className="mb-16">
        <h1 className="text-4xl md:text-6xl font-black text-gray-900 tracking-tighter mb-4" style={{ fontFamily: "Fraunces, serif" }}>
          Dietas
        </h1>
        <p className="text-lg text-gray-500">Selecciona tu objetivo y ruta</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {dietGoals.map((g) => (
          <div key={g.title} className="bg-white p-8 md:p-12 flex flex-col justify-between">
            <div className="mb-12">
              <div className="w-16 h-16 flex items-center justify-center rounded-full mb-6" style={{ background: g.bg, color: g.color }}>
                {g.icon}
              </div>
              <h3 className="text-2xl font-black text-gray-900 mb-2 tracking-tight" style={{ fontFamily: "Fraunces, serif" }}>{g.title}</h3>
              <p className="text-lg text-gray-500 leading-snug">{g.desc}</p>
            </div>
            
            <div className="flex items-center justify-between border-t border-gray-100 pt-6">
              <span className="text-base font-bold text-gray-900">{g.kcal} / día</span>
              <button className="text-sm font-bold px-6 py-3 rounded-full text-white" style={{ background: g.color }}>
                Activar
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Diets;