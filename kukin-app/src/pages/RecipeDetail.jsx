import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { IconClock } from '../components/Icons';
import { traducirPalabra, traducirTexto } from '../services/translator';

function RecipeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [recipe, setRecipe] = useState(null);

  useEffect(() => {
    const fetchAndTranslate = async () => {
      try {
        const SPOONACULAR_API_KEY = '26be8efc306049ac8ceb0be40a18a38e';
        const response = await fetch(`https://api.spoonacular.com/recipes/${id}/information?apiKey=${SPOONACULAR_API_KEY}`);
        const data = await response.json();

        // 🌐 Traducción profunda de los pasos (Párrafos)
        let pasosTraducidos = [];
        if (data.analyzedInstructions?.[0]?.steps) {
          pasosTraducidos = await Promise.all(
            data.analyzedInstructions[0].steps.map(async (step) => ({
              number: step.number,
              // Llamada a la API de traducción para cada paso
              text: await traducirTexto(step.step)
            }))
          );
        }

        setRecipe({
          title: await traducirTexto(data.title),
          image: data.image,
          time: data.readyInMinutes,
          servings: data.servings,
          ingredients: data.extendedIngredients.map(ing => ({
            name: traducirPalabra(ing.name),
            amount: ing.amount,
            unit: ing.unit
          })),
          steps: pasosTraducidos
        });
      } catch (error) {
        console.error(error);
      }
    };
    fetchAndTranslate();
  }, [id]);

  if (!recipe) return (
    <div className="min-h-screen bg-[#F7F3EE] flex flex-col items-center justify-center gap-4">
      <div className="w-12 h-12 border-4 border-gray-300 border-t-[#2D7A47] rounded-full animate-spin"></div>
      <p className="text-gray-500 font-bold animate-pulse">Traduciendo receta...</p>
    </div>
  );

  return (
    <div className="w-full bg-white min-h-screen pb-10 animate-fade-in-up">
      {/* Hero Inmersivo */}
      <div className="relative w-full h-[50vh] bg-gray-300 rounded-b-[40px] overflow-hidden shadow-2xl">
        <img src={recipe.image} alt={recipe.title} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
        
        <button onClick={() => navigate(-1)} className="absolute top-8 left-6 w-12 h-12 bg-white/20 backdrop-blur-xl text-white rounded-full flex items-center justify-center font-black active:scale-90 transition-transform">
          ←
        </button>

        <div className="absolute bottom-10 left-6 right-6">
          <h1 className="text-4xl font-black text-white leading-tight mb-4" style={{ fontFamily: "Fraunces, serif" }}>{recipe.title}</h1>
          <div className="flex items-center gap-6 text-sm font-bold text-white/90">
            <span className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full backdrop-blur-md"><IconClock/> {recipe.time} min</span>
            <span className="bg-white/20 px-4 py-2 rounded-full backdrop-blur-md">🍽️ {recipe.servings} px</span>
          </div>
        </div>
      </div>

      <div className="px-6 mt-10 space-y-12">
        {/* Ingredientes con Checkbox UI */}
        <div>
          <h3 className="text-2xl font-black text-gray-900 mb-6 tracking-tight" style={{ fontFamily: "Fraunces, serif" }}>Ingredientes</h3>
          <div className="space-y-4">
            {recipe.ingredients.map((ing, i) => (
              <label key={i} className="flex items-center justify-between p-5 bg-[#F7F3EE] rounded-3xl active:scale-[0.98] transition-transform">
                <div className="flex items-center gap-4">
                  <div className="w-6 h-6 rounded-full border-2 border-gray-300 bg-white" />
                  <span className="text-lg font-bold text-gray-900 capitalize">{ing.name}</span>
                </div>
                <span className="text-sm font-black text-gray-400">{ing.amount} {ing.unit || 'pza'}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Procedimiento Traducido */}
        <div>
          <h3 className="text-2xl font-black text-gray-900 mb-6 tracking-tight" style={{ fontFamily: "Fraunces, serif" }}>Preparación</h3>
          {recipe.steps.length > 0 ? (
            <div className="space-y-8">
              {recipe.steps.map((step) => (
                <div key={step.number} className="flex gap-5">
                  <div className="w-10 h-10 rounded-full bg-[#2D7A47] text-white flex items-center justify-center font-black flex-shrink-0 shadow-lg shadow-green-900/20">
                    {step.number}
                  </div>
                  <p className="text-lg text-gray-700 leading-relaxed font-medium pt-1">
                    {step.text}
                  </p>
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