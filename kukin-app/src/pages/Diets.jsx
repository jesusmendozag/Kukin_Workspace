import { useState } from 'react';
import { IconFire, IconDumbbell, IconHeart, IconMoon } from '../components/Icons';

const dietGoals = [
  { id: 'lose', title: "Bajar de peso", desc: "Plan hipocalórico con alimentos saciantes", icon: <IconFire/>, color: "#E84B2D", bg: "#FEF2F0", kcal: "1,400 kcal" },
  { id: 'muscle', title: "Ganar masa muscular", desc: "Alta proteína, carbohidratos estratégicos", icon: <IconDumbbell/>, color: "#2563EB", bg: "#EFF6FF", kcal: "2,800 kcal" },
  { id: 'heart', title: "Salud cardiovascular", desc: "Omega 3, antioxidantes y fibra", icon: <IconHeart/>, color: "#DB2777", bg: "#FDF2F8", kcal: "2,000 kcal" },
  { id: 'rest', title: "Descanso y bienestar", desc: "Magnesio y triptófano naturales", icon: <IconMoon/>, color: "#7C3AED", bg: "#F5F3FF", kcal: "1,800 kcal" },
];

const STORAGE_KEY = 'kukin-diet-goal';

function Diets() {
  // El objetivo elegido se guarda en el dispositivo
  const [active, setActive] = useState(() => localStorage.getItem(STORAGE_KEY));

  const toggle = (id) => {
    const next = active === id ? null : id;
    if (next) localStorage.setItem(STORAGE_KEY, next);
    else localStorage.removeItem(STORAGE_KEY);
    setActive(next);
  };

  return (
    <div className="w-full px-6 pt-safe-12 animate-fade-in-up">
      <div className="mb-10">
        <h1 className="text-5xl font-black text-gray-900 tracking-tighter mb-2" style={{ fontFamily: "Fraunces, serif" }}>
          Dietas
        </h1>
        <p className="text-base font-bold text-gray-400">Selecciona tu objetivo</p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {dietGoals.map((g) => {
          const isActive = active === g.id;
          return (
            <div key={g.id} className="bg-white p-8 rounded-[32px] shadow-sm flex flex-col justify-between transition-shadow"
              style={isActive ? { boxShadow: `0 0 0 3px ${g.color}` } : undefined}>
              <div className="mb-8">
                <div className="w-16 h-16 flex items-center justify-center rounded-full mb-6" style={{ background: g.bg, color: g.color }}>
                  {g.icon}
                </div>
                <h3 className="text-2xl font-black text-gray-900 mb-2 tracking-tight" style={{ fontFamily: "Fraunces, serif" }}>{g.title}</h3>
                <p className="text-lg text-gray-500 leading-snug">{g.desc}</p>
              </div>

              <div className="flex items-center justify-between border-t border-gray-100 pt-6">
                <span className="text-base font-bold text-gray-900">{g.kcal} / día</span>
                <button onClick={() => toggle(g.id)} aria-pressed={isActive}
                  className="text-sm font-bold px-6 py-3 rounded-full active:scale-95 transition-transform"
                  style={isActive ? { background: g.bg, color: g.color } : { background: g.color, color: '#fff' }}>
                  {isActive ? '✓ Activa' : 'Activar'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default Diets;
