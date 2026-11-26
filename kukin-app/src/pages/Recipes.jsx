import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { IconClock } from '../components/Icons';
import { PageTitle, ErrorBox, EmptyState, PotLoader } from '../components/ui';
import api, { getErrorMessage } from '../services/api';
import { traducirPalabra } from '../services/translator';
import { getIngredientMeta } from '../services/ingredients';

const toCard = (r) => ({
  id: r.idRecipe,
  source: r.source,
  title: r.titleRecipe,
  image: r.urlImage,
  time: r.timePreparation || 30,
  match: r.matchPercentage ?? 0, // ?? respeta el 0 %
  diets: (r.diets || []).map(traducirPalabra),
  missing: (r.missingIngredients || []).map((m) => m.ingredientName),
});

/** Badge de coincidencia: alta ≥ 80 (verde), media 40–79 (ámbar), baja (blanco). */
const matchStyle = (m) => {
  if (m >= 80) return 'bg-basil text-white';
  if (m >= 40) return 'bg-amber/90 text-navy';
  return 'bg-white/90 text-navy';
};

const FILTERS = [
  { id: 'all', label: 'Todas' },
  { id: 'quick', label: 'Rápidas' },
  { id: 'full', label: 'Al 100%' },
];

function Recipes() {
  const navigate = useNavigate();
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [reloadKey, setReloadKey] = useState(0);

  // Las sugerencias las calcula el backend con base en la alacena (y trae recetas nuevas ya en español)
  useEffect(() => {
    let cancelled = false;
    api.get('/recipes/suggestions', { timeout: 60000 })
      .then(({ data }) => {
        if (cancelled) return;
        setSuggestions(data.data.map(toCard));
        setError('');
      })
      .catch((err) => !cancelled && setError(getErrorMessage(err)))
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, [reloadKey]);

  const discover = () => { setLoading(true); setError(''); setReloadKey((k) => k + 1); };

  const shown = useMemo(() => suggestions.filter((r) =>
    filter === 'all' || (filter === 'quick' ? r.time <= 30 : r.match >= 100)), [suggestions, filter]);

  return (
    <div className="animate-fade-in-up">
      <PageTitle title="Para Ti" subtitle="Recetas sugeridas"
        action={
          <button type="button" onClick={discover} disabled={loading}
            className="min-h-11 px-4 rounded-full bg-basil text-white label-micro text-white! active:scale-95 transition-transform disabled:opacity-60">
            Descubrir
          </button>
        } />

      <div role="group" aria-label="Filtrar recetas" className="flex gap-2 overflow-x-auto scrollbar-hide px-5 pb-5">
        {FILTERS.map((f) => (
          <button key={f.id} type="button" onClick={() => setFilter(f.id)} aria-pressed={filter === f.id}
            className={`shrink-0 min-h-11 px-5 rounded-full font-bold active:scale-95 transition-all ${
              filter === f.id ? 'bg-navy text-white' : 'bg-white text-navy shadow-sm'}`}>
            {f.label}
          </button>
        ))}
      </div>

      <div className="px-5 space-y-5">
        <ErrorBox message={error} onRetry={discover} />

        {loading ? (
          <PotLoader text="Buscando recetas con lo que tienes…" className="py-16" />
        ) : suggestions.length === 0 && !error ? (
          <EmptyState emoji="🍳" title="Aún no hay sugerencias"
            text="Agrega más ingredientes a tu alacena para encontrar recetas que puedas preparar."
            actionLabel="Agregar ingredientes" onAction={() => navigate('/add')} />
        ) : shown.length === 0 && !error ? (
          <EmptyState emoji="🥄" title="Nada por aquí" text="Prueba con otro filtro." />
        ) : (
          <ul className="space-y-5">
            {shown.map((recipe, index) => (
              <li key={`${recipe.source}-${recipe.id}`} className="animate-fade-in-up" style={{ animationDelay: `${Math.min(index, 8) * 60}ms` }}>
                <button type="button" onClick={() => navigate(`/recipe/${recipe.source}/${recipe.id}`)}
                  className="group block w-full text-left bg-white rounded-[32px] overflow-hidden shadow-[0_12px_30px_-14px_rgb(11_30_54/0.25)] active:scale-[0.97] transition-transform">
                  <div className="relative h-52 bg-fresh-bg flex items-center justify-center overflow-hidden">
                    {recipe.image ? (
                      <img src={recipe.image} alt="" loading="lazy"
                        className="w-full h-full object-cover transition-transform duration-500 group-active:scale-105" />
                    ) : (
                      <span className="text-7xl" aria-hidden="true">🍲</span>
                    )}
                    <span className={`absolute top-4 right-4 px-3.5 py-1.5 rounded-full font-black text-[0.8rem] tabular backdrop-blur-md ${matchStyle(recipe.match)}`}>
                      {recipe.match}% Coincidencia
                    </span>
                  </div>

                  <div className="p-5">
                    <p className="label-micro">
                      <span className="inline-block rounded-full bg-cream px-2.5 py-1">{recipe.diets[0] || 'Cocina libre'}</span>
                    </p>
                    <h2 className="mt-2 font-display font-black text-navy text-[1.5rem] leading-tight">{recipe.title}</h2>

                    {recipe.missing.length > 0 && (
                      <div className="mt-3 flex flex-wrap items-center gap-1.5">
                        <span className="font-bold text-alert text-[0.92rem] mr-0.5">Te falta:</span>
                        {recipe.missing.slice(0, 3).map((m) => (
                          <span key={m} className="inline-flex items-center gap-1 rounded-full bg-alert-bg text-alert px-2.5 py-0.5 font-bold text-[0.88rem]">
                            <span aria-hidden="true">{getIngredientMeta(m).emoji}</span>{m}
                          </span>
                        ))}
                        {recipe.missing.length > 3 && <span className="font-bold text-soft text-[0.88rem]">+{recipe.missing.length - 3}</span>}
                      </div>
                    )}

                    <div className="mt-4 flex items-center justify-between">
                      <span className="flex items-center gap-1.5 font-bold text-soft tabular"><IconClock /> {recipe.time} min</span>
                      <span aria-hidden="true"
                        className="w-10 h-10 rounded-full bg-cream flex items-center justify-center text-navy font-black text-xl transition-transform group-active:translate-x-1">
                        →
                      </span>
                    </div>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default Recipes;
