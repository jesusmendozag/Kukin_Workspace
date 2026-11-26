import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { IconClock } from '../components/Icons';
import api, { getErrorMessage } from '../services/api';
import { traducirPalabra } from '../services/translator';

// Convierte la respuesta del backend al formato que usa la tarjeta
const toCard = (r) => ({
  id: r.idRecipe,
  source: r.source,
  title: r.titleRecipe,
  image: r.urlImage,
  time: r.timePreparation || 30,
  match: r.matchPercentage,
  diets: (r.diets || []).slice(0, 2).map(traducirPalabra),
  missing: (r.missingIngredients || []).map((m) => traducirPalabra(m.ingredientName)),
});

function Recipes() {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Las sugerencias las calcula el backend con base en la alacena del usuario.
  // La API key de Spoonacular se queda en el servidor, nunca en la app.
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    api.get('/recipes/suggestions')
      .then(({ data }) => {
        if (cancelled) return;
        setSuggestions(data.data.map(toCard));
        setError('');
      })
      .catch((err) => !cancelled && setError(getErrorMessage(err)))
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, [reloadKey]);

  const retry = () => {
    setLoading(true);
    setError('');
    setReloadKey((k) => k + 1);
  };

  return (
    <div className="w-full px-6 pt-safe-12 animate-fade-in-up">
      <div className="mb-8">
        <h1 className="text-5xl font-black text-gray-900 tracking-tighter mb-2" style={{ fontFamily: "Fraunces, serif" }}>Recetas</h1>
        <p className="text-base font-bold text-gray-400">Según lo que tienes en tu alacena</p>
      </div>

      {error && (
        <div role="alert" className="mb-6 text-sm font-bold text-[#991B1B] bg-[#FEE2E2] px-5 py-4 rounded-3xl">
          {error}
          <button onClick={retry} className="block mt-2 underline">Reintentar</button>
        </div>
      )}

      {loading ? (
        <div className="space-y-6">
          {[1, 2].map((i) => <div key={i} className="w-full h-72 bg-gray-200 rounded-[32px] animate-pulse" />)}
        </div>
      ) : suggestions.length === 0 && !error ? (
        <div className="bg-white rounded-[32px] p-8 text-center shadow-sm">
          <div className="text-5xl mb-4">🍳</div>
          <h3 className="text-2xl font-black text-gray-900 mb-2" style={{ fontFamily: "Fraunces, serif" }}>Aún no hay sugerencias</h3>
          <p className="text-gray-500 mb-6">Agrega más ingredientes a tu alacena para encontrar recetas que puedas preparar.</p>
          <button onClick={() => navigate('/add')} className="px-6 py-3 bg-[#2D7A47] text-white font-bold rounded-full active:scale-95 transition-transform">
            Agregar ingrediente
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {suggestions.map((recipe, index) => (
            <button
              type="button"
              key={`${recipe.source}-${recipe.id}`}
              onClick={() => navigate(`/recipe/${recipe.source}/${recipe.id}`)}
              className="block w-full text-left bg-white rounded-[32px] overflow-hidden shadow-xl shadow-gray-200/50 active:scale-95 transition-all cursor-pointer animate-fade-in-up"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="relative w-full h-56 bg-[#DCFCE7] flex items-center justify-center">
                {recipe.image ? (
                  <img src={recipe.image} alt={recipe.title} className="w-full h-full object-cover" loading="lazy" />
                ) : (
                  <span className="text-7xl" aria-hidden="true">🍲</span>
                )}
                <div className="absolute top-4 right-4 px-4 py-2 bg-white/90 backdrop-blur-md text-gray-900 font-black text-xs rounded-full">
                  {recipe.match}% Alacena
                </div>
              </div>

              <div className="p-6">
                <h3 className="text-2xl font-black text-gray-900 mb-4 leading-tight" style={{ fontFamily: "Fraunces, serif" }}>{recipe.title}</h3>

                {recipe.missing.length > 0 && (
                  <p className="text-sm text-gray-500 mb-4">
                    <span className="font-bold text-gray-700">Te falta:</span> {recipe.missing.join(', ')}
                  </p>
                )}

                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex gap-2">
                    {recipe.diets.map((diet) => (
                      <span key={diet} className="text-[10px] font-black uppercase tracking-wide text-[#2D7A47] bg-[#DCFCE7] px-3 py-1.5 rounded-full">{diet}</span>
                    ))}
                  </div>
                  <span className="flex items-center gap-1.5 text-sm font-bold text-gray-400">
                    <IconClock /> {recipe.time} min
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default Recipes;
