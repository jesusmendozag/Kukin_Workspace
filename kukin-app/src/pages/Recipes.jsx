import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { IconClock } from '../components/Icons';

function Recipes() {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSpoonacularRecipes = async () => {
      try {
        const SPOONACULAR_API_KEY = '26be8efc306049ac8ceb0be40a18a38e'; 
        
        // Usamos fetch nativo para evitar conflictos con tu api.js (Axios)
        const url = `https://api.spoonacular.com/recipes/complexSearch?apiKey=${SPOONACULAR_API_KEY}&includeIngredients=egg,tomato&addRecipeInformation=true&fillIngredients=true&number=2`;
        
        const response = await fetch(url);
        
        if (!response.ok) {
          throw new Error(`Spoonacular rechazó la petición (Código: ${response.status})`);
        }
        
        const data = await response.json();

        // Mapeamos el JSON al formato de tus tarjetas de React
        const kukinFormattedRecipes = data.results.map(recipe => {
          const totalIngredients = recipe.extendedIngredients?.length || 1;
          const missed = recipe.missedIngredientCount || 0;
          const matchPct = Math.round(((totalIngredients - missed) / totalIngredients) * 100);

          return {
            idRecipe: recipe.id,
            titleRecipe: recipe.title,
            urlImage: recipe.image,
            timePreparation: recipe.readyInMinutes || 30,
            matchPercentage: matchPct > 0 ? matchPct : 65,
            diets: recipe.diets ? recipe.diets.slice(0, 3) : [],
            missingIngredients: recipe.missedIngredients?.map(ing => ({
              idIngredient: ing.id,
              ingredientName: ing.name
            })) || []
          };
        });

        setSuggestions(kukinFormattedRecipes);
      } catch (error) {
        console.error('Error al conectar con Spoonacular:', error);
        alert('Error al cargar recetas: ' + error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchSpoonacularRecipes();
  }, []);

  return (
    <div className="w-full h-full pt-8 md:pt-12 px-6 md:px-0">
      
      {/* 🏷️ HEADER RESPONSIVO */}
      <div className="mb-8 md:mb-12">
        <p className="text-xs md:text-sm font-bold text-gray-400 uppercase tracking-widest mb-1 md:mb-3">
          Sugerencias Inteligentes
        </p>
        <h1 className="text-3xl md:text-5xl font-bold text-gray-900 leading-tight" style={{ fontFamily: "Fraunces, serif" }}>
          Recetas para ti
        </h1>
      </div>

      {/* 🗂️ FILTROS (Visuales por ahora) */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-6 mb-2">
        {["Todas", "Rápidas", "Sin faltantes", "Mexicanas"].map((filter, i) => (
          <button key={filter} className="whitespace-nowrap px-5 py-2.5 rounded-full text-xs font-bold transition-colors border"
            style={{
              background: i === 0 ? "#2D7A47" : "transparent",
              color: i === 0 ? "white" : "#6B7280",
              borderColor: i === 0 ? "#2D7A47" : "#E5E7EB"
            }}>
            {filter}
          </button>
        ))}
      </div>

      {/* 🍱 GRID DE RECETAS */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-green-200 border-t-green-700 rounded-full animate-spin"></div>
        </div>
      ) : suggestions.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-gray-100">
          <p className="text-lg text-gray-500" style={{ fontFamily: "Fraunces, serif" }}>
            No encontramos recetas con tu inventario actual.
          </p>
          <p className="text-sm text-gray-400 mt-2">Agrega más ingredientes a tu alacena.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {suggestions.map((recipe) => (
            <div key={recipe.idRecipe} className="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100 group hover:shadow-md transition-all flex flex-col">
              
              {/* Imagen y Badges */}
              <div className="relative h-48 md:h-56 bg-gray-200 overflow-hidden">
                {recipe.urlImage ? (
                  <img src={recipe.urlImage} alt={recipe.titleRecipe} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400">Sin imagen</div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                
                {/* Porcentaje de coincidencia */}
                <div className="absolute top-4 right-4 px-3 py-1.5 rounded-full text-xs font-black text-white backdrop-blur-md shadow-sm"
                  style={{ background: recipe.matchPercentage >= 100 ? "#2D7A47" : "#F5A623" }}>
                  {recipe.matchPercentage}% coincide
                </div>
              </div>

              {/* Información */}
              <div className="p-5 md:p-6 flex-1 flex flex-col">
                <h3 className="text-xl font-bold text-gray-900 mb-2 leading-tight" style={{ fontFamily: "Fraunces, serif" }}>
                  {recipe.titleRecipe}
                </h3>
                
                <div className="flex items-center gap-4 text-xs font-medium text-gray-500 mb-4">
                  <span className="flex items-center gap-1.5"><IconClock/> {recipe.timePreparation} min</span>
                </div>

                {/* Ingredientes faltantes */}
                {recipe.missingIngredients && recipe.missingIngredients.length > 0 && (
                  <div className="mb-4">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Te falta comprar:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {recipe.missingIngredients.map((missing) => (
                        <span key={missing.idIngredient} className="text-[10px] font-semibold px-2 py-1 rounded-md bg-red-50 text-red-700 border border-red-100">
                          {missing.ingredientName}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Dietas */}
                <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-50">
                  <div className="flex gap-1.5">
                    {recipe.diets && recipe.diets.map((diet) => (
                      <span key={diet} className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-green-50 text-green-700">
                        {diet}
                      </span>
                    ))}
                  </div>
                  <button className="text-xs font-bold text-white px-5 py-2.5 rounded-xl transition-colors hover:bg-green-800" style={{ background: "#2D7A47" }}>
                    Ver receta
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Recipes;