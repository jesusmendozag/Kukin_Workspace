import { useState } from 'react';
import { IconFire, IconDumbbell, IconHeart, IconMoon, IconCheck } from '../components/Icons';
import { PageTitle } from '../components/ui';

const dietGoals = [
  { id: 'lose', title: 'Bajar de peso', desc: 'Plan hipocalórico con alimentos saciantes', Icon: IconFire, color: '#C2410C', bg: '#FFF3E0', kcal: '1,400 kcal' },
  { id: 'muscle', title: 'Ganar masa muscular', desc: 'Alta proteína, carbohidratos estratégicos', Icon: IconDumbbell, color: '#1D4ED8', bg: '#E3F2FD', kcal: '2,800 kcal' },
  { id: 'heart', title: 'Salud cardiovascular', desc: 'Omega 3, antioxidantes y fibra', Icon: IconHeart, color: '#BE185D', bg: '#FCE7F3', kcal: '2,000 kcal' },
  { id: 'rest', title: 'Descanso y bienestar', desc: 'Magnesio y triptófano naturales', Icon: IconMoon, color: '#4527A0', bg: '#EDE7F6', kcal: '1,800 kcal' },
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
    <div className="animate-fade-in-up">
      <PageTitle title="Dietas" subtitle="Elige tu objetivo" />

      <ul className="px-5 space-y-4">
        {dietGoals.map(({ id, title, desc, Icon, color, bg, kcal }, index) => {
          const isActive = active === id;
          return (
            <li key={id} className="animate-fade-in-up" style={{ animationDelay: `${index * 50}ms` }}>
              <div className="bg-white rounded-[32px] p-6 shadow-sm transition-shadow"
                style={isActive ? { boxShadow: `0 0 0 3px ${color}` } : undefined}>
                <div className="flex items-start gap-4">
                  <span className="w-14 h-14 shrink-0 rounded-full flex items-center justify-center" style={{ background: bg, color }}>
                    <Icon className="w-7 h-7" />
                  </span>
                  <div className="min-w-0">
                    <h2 className="font-display font-black text-navy text-[1.45rem] leading-tight tracking-tight">{title}</h2>
                    <p className="text-soft mt-1 leading-snug">{desc}</p>
                  </div>
                </div>
                <div className="mt-5 pt-4 border-t border-hairline flex items-center justify-between gap-3">
                  <span className="font-bold tabular">{kcal} / día</span>
                  <button type="button" onClick={() => toggle(id)} aria-pressed={isActive}
                    className="min-h-12 px-6 rounded-full font-bold flex items-center gap-2 active:scale-95 transition-transform"
                    style={isActive ? { background: bg, color } : { background: color, color: '#fff' }}>
                    {isActive ? <><IconCheck className="w-5 h-5" /> Activa</> : 'Activar'}
                  </button>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default Diets;
