import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { IconClock } from '../components/Icons';
import api, { getErrorMessage } from '../services/api';
import { traducirPalabra, traducirTexto } from '../services/translator';

const formatAmount = (n) => Number(n).toLocaleString('es-MX', { maximumFractionDigits: 2 });

function RecipeDetail() {
  const { source, id } = useParams();
  const navigate = useNavigate();
  const [recipe, setRecipe] = useState(null);
  const [error, setError] = useState('');
  const [checked, setChecked] = useState({});

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const { data } = await api.get(`/recipes/${id}`, { params: { source } });
        const r = data.data;
        // Las recetas propias ya están en español; las de Spoonacular se traducen
        const needsTranslation = r.source === 'SPOONACULAR';
        const [title, steps] = await Promise.all([
          needsTranslation ? traducirTexto(r.titleRecipe) : r.titleRecipe,
          Promise.all((r.steps || []).map((s) => (needsTranslation ? traducirTexto(s) : s))),
        ]);
        if (cancelled) return;
        setRecipe({
          title,
          image: r.urlImage,
          time: r.timePreparation,
          servings: r.servings,
          ingredients: (r.ingredients || []).map((ing) => ({
            name: traducirPalabra(ing.ingredientName),
            amount: ing.amount,
            unit: ing.unitSymbol,
            inInventory: ing.inUserInventory,
          })),
          steps,
        });
      } catch (err) {
        if (!cancelled) setError(getErrorMessage(err));
      }
    };
    load();
    return () => { cancelled = true; };
  }, [id, source]);

  if (error) return (
    <div className="min-h-screen bg-[#F7F3EE] flex flex-col items-center justify-center gap-6 px-8 text-center">
      <p role="alert" className="text-lg font-bold text-[#991B1B]">{error}</p>
      <button onClick={() => navigate(-1)} className="px-6 py-3 bg-[#2D7A47] text-white font-bold rounded-full">Regresar</button>
    </div>
  );

  if (!recipe) return (
    <div className="min-h-screen bg-[#F7F3EE] flex flex-col items-center justify-center gap-4">
      <div className="w-12 h-12 border-4 border-gray-300 border-t-[#2D7A47] rounded-full animate-spin"></div>
      <p className="text-gray-500 font-bold animate-pulse">Preparando receta...</p>
    </div>
  );

  return (
    <div className="w-full bg-white min-h-screen pb-safe-10 animate-fade-in-up">
      {/* Hero inmersivo */}
      <div className="relative w-full h-[50vh] bg-[#2D7A47] rounded-b-[40px] overflow-hidden shadow-2xl flex items-center justify-center">
        {recipe.image ? (
          <img src={recipe.image} alt={recipe.title} className="w-full h-full object-cover" />
        ) : (
          <span className="text-9xl -mt-16" aria-hidden="true">🍲</span>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />

        <button onClick={() => navigate(-1)} aria-label="Regresar"
          className="absolute top-safe-8 left-6 w-12 h-12 bg-white/20 backdrop-blur-xl text-white rounded-full flex items-center justify-center font-black active:scale-90 transition-transform">
          ←
        </button>

        <div className="absolute bottom-10 left-6 right-6">
          <h1 className="text-4xl font-black text-white leading-tight mb-4" style={{ fontFamily: "Fraunces, serif" }}>{recipe.title}</h1>
          <div className="flex items-center gap-3 text-sm font-bold text-white/90">
            {recipe.time && <span className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full backdrop-blur-md"><IconClock /> {recipe.time} min</span>}
            {recipe.servings && <span className="bg-white/20 px-4 py-2 rounded-full backdrop-blur-md">🍽️ {recipe.servings} porciones</span>}
          </div>
        </div>
      </div>

      <div className="px-6 mt-10 space-y-12">
        {/* Ingredientes: se pueden ir marcando mientras se cocina */}
        <div>
          <h3 className="text-2xl font-black text-gray-900 mb-6 tracking-tight" style={{ fontFamily: "Fraunces, serif" }}>Ingredientes</h3>
          <div className="space-y-4">
            {recipe.ingredients.map((ing, i) => (
              <label key={i} className="flex items-center justify-between p-5 bg-[#F7F3EE] rounded-3xl active:scale-[0.98] transition-transform cursor-pointer">
                <div className="flex items-center gap-4">
                  <input type="checkbox" className="sr-only" checked={!!checked[i]}
                    onChange={() => setChecked((c) => ({ ...c, [i]: !c[i] }))} />
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs text-white transition-colors ${checked[i] ? 'bg-[#2D7A47] border-[#2D7A47]' : 'border-gray-300 bg-white'}`}>
                    {checked[i] && '✓'}
                  </div>
                  <div>
                    <span className={`text-lg font-bold capitalize ${checked[i] ? 'text-gray-400 line-through' : 'text-gray-900'}`}>{ing.name}</span>
                    {ing.inInventory && <span className="block text-[11px] font-black uppercase text-[#2D7A47]">En tu alacena</span>}
                  </div>
                </div>
                <span className="text-sm font-black text-gray-400">{formatAmount(ing.amount)} {ing.unit || 'pza'}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Preparación */}
        <div>
          <h3 className="text-2xl font-black text-gray-900 mb-6 tracking-tight" style={{ fontFamily: "Fraunces, serif" }}>Preparación</h3>
          {recipe.steps.length > 0 ? (
            <div className="space-y-8">
              {recipe.steps.map((text, index) => (
                <div key={index} className="flex gap-5">
                  <div className="w-10 h-10 rounded-full bg-[#2D7A47] text-white flex items-center justify-center font-black flex-shrink-0 shadow-lg shadow-green-900/20">
                    {index + 1}
                  </div>
                  <p className="text-lg text-gray-700 leading-relaxed font-medium pt-1">{text}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-lg text-gray-500 font-bold bg-[#F7F3EE] p-6 rounded-3xl">Instrucciones no disponibles.</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default RecipeDetail;
