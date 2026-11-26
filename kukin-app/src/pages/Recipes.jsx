import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { IconClock } from '../components/Icons';
import { PageTitle, ErrorBox, EmptyState, PotLoader, OfflineNotice } from '../components/ui';
import api, { getErrorMessage } from '../services/api';
import { traducirPalabra } from '../services/translator';
import { getIngredientMeta } from '../services/ingredients';
import { DIET_GOALS, getDietGoal } from '../services/dietGoal';

const toCard = (r) => ({
  id: r.idRecipe,
  source: r.source,
  title: r.titleRecipe,
  image: r.urlImage,
  time: r.timePreparation || 30,
  match: r.matchPercentage ?? 0, // ?? respeta el 0 %
  diets: (r.diets || []).map(traducirPalabra),
  missing: (r.missingIngredients || []).map((m) => m.ingredientName),
  expiring: r.expiringIngredients || [],
  ingredientCount: r.ingredientCount ?? 0,
  needsOven: !!r.needsOven,
  calories: r.calories ?? null,
  protein: r.proteinG ?? null,
  price: r.pricePerServing ?? null, // centavos de dólar por porción
  healthScore: r.healthScore ?? null,
});

/** Badge de coincidencia: alta ≥ 80 (verde), media 40–79 (ámbar), baja (blanco). */
const matchStyle = (m) => {
  if (m >= 80) return 'bg-basil text-white';
  if (m >= 40) return 'bg-amber/90 text-navy';
  return 'bg-white/90 text-navy';
};

/** Filtros. Solo se muestran los que tienen al menos una receta. */
const buildFilters = (goal) => [
  { id: 'all', label: 'Todas', test: () => true },
  goal && { id: 'goal', label: `🎯 ${DIET_GOALS[goal].short}`, test: DIET_GOALS[goal].test },
  { id: 'expiring', label: '⏰ Aprovecha', test: (r) => r.expiring.length > 0 },
  { id: 'quick', label: 'Rápidas', test: (r) => r.time <= 30 },
  { id: 'full', label: 'Al 100%', test: (r) => r.match >= 100 },
  { id: 'cheap', label: 'Económicas', test: (r) => r.price != null && r.price <= 150 },
  { id: 'nooven', label: 'Sin horno', test: (r) => !r.needsOven },
  { id: 'few', label: 'Pocos ingredientes', test: (r) => r.ingredientCount > 0 && r.ingredientCount <= 6 },
].filter(Boolean);

function Recipes() {
  const navigate = useNavigate();
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchParams] = useSearchParams();
  const [filter, setFilter] = useState(() => searchParams.get('f') || 'all');
  const [goal] = useState(getDietGoal);
  const [reloadKey, setReloadKey] = useState(0);
  const [offline, setOffline] = useState(false);

  // Las sugerencias las calcula el backend con base en la alacena (y trae recetas nuevas ya en español)
  useEffect(() => {
    let cancelled = false;
    api.get('/recipes/suggestions', { timeout: 60000, offlineCache: true })
      .then(({ data, fromCache }) => {
        if (cancelled) return;
        setSuggestions(data.data.map(toCard));
        setOffline(!!fromCache);
        setError('');
      })
      .catch((err) => !cancelled && setError(getErrorMessage(err)))
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, [reloadKey]);

  const discover = () => { setLoading(true); setError(''); setReloadKey((k) => k + 1); };

  const filters = useMemo(() => buildFilters(goal)
    .map((f) => ({ ...f, count: suggestions.filter(f.test).length }))
    .filter((f) => f.id === 'all' || f.count > 0 || f.id === filter), [goal, suggestions, filter]);
  const active = filters.find((f) => f.id === filter) || filters[0];
  const shown = useMemo(() => suggestions.filter(active.test), [suggestions, active]);

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
        {(loading ? filters.slice(0, 1) : filters).map((f) => (
          <button key={f.id} type="button" onClick={() => setFilter(f.id)} aria-pressed={active.id === f.id}
            className={`shrink-0 min-h-11 px-5 rounded-full font-bold active:scale-95 transition-all ${
              active.id === f.id ? 'bg-navy text-white' : 'bg-white text-navy shadow-sm'}`}>
            {f.label}
          </button>
        ))}
      </div>

      <div className="px-5 space-y-5">
        <ErrorBox message={error} onRetry={discover} />
        <OfflineNotice show={offline && !loading} />

        {loading ? (
          <PotLoader text="Buscando recetas con lo que tienes…" className="py-16" />
        ) : suggestions.length === 0 && !error ? (
          <EmptyState emoji="🍳" title="Aún no hay sugerencias"
            text="Agrega más ingredientes a tu alacena para encontrar recetas que puedas preparar."
            actionLabel="Agregar ingredientes" onAction={() => navigate('/add')} />
        ) : shown.length === 0 && !error ? (
          <EmptyState emoji="🥄" title="Nada por aquí"
            text={active.id === 'goal' ? 'Aún no hay recetas con datos de nutrición para tu objetivo. Toca «Descubrir» para buscar más.' : 'Prueba con otro filtro.'} />
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
                    {recipe.expiring.length > 0 && (
                      <span className="absolute left-4 bottom-4 right-4 truncate px-3.5 py-1.5 rounded-full bg-alert text-white font-bold text-[0.85rem] w-fit max-w-[calc(100%-2rem)]">
                        ⏰ Usa tu {recipe.expiring.slice(0, 2).join(' y ').toLowerCase()} antes de que caduque
                      </span>
                    )}
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
                      <span className="flex items-center gap-3 font-bold text-soft tabular">
                        <span className="flex items-center gap-1.5"><IconClock /> {recipe.time} min</span>
                        {recipe.calories != null && <span>🔥 {recipe.calories} kcal</span>}
                      </span>
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
