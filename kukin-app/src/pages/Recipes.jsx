import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { IconClock } from '../components/Icons';
import { traducirPalabra } from '../services/translator';

function Recipes() {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSpoonacularRecipes = async () => {
      try {
        const SPOONACULAR_API_KEY = '26be8efc306049ac8ceb0be40a18a38e'; 
        const url = `https://api.spoonacular.com/recipes/complexSearch?apiKey=${SPOONACULAR_API_KEY}&includeIngredients=egg,tomato&addRecipeInformation=true&fillIngredients=true&number=4`;
        
        const response = await fetch(url);
        const data = await response.json();

        const format = data.results.map(recipe => ({
          id: recipe.id,
          title: recipe.title.replace('Egg', 'Huevo').replace('Tomato', 'Jitomate'), // Simple regex para títulos
          image: recipe.image,
          time: recipe.readyInMinutes || 30,
          match: Math.round(((recipe.extendedIngredients.length - recipe.missedIngredientCount) / recipe.extendedIngredients.length) * 100),
          diets: recipe.diets ? recipe.diets.slice(0, 2).map(traducirPalabra) : [],
          missing: recipe.missedIngredients?.map(ing => traducirPalabra(ing.name)) || []
        }));

        setSuggestions(format);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchSpoonacularRecipes();
  }, []);

  return (
    <div className="w-full px-6 pt-12 animate-fade-in-up">
      <div className="mb-8">
        <h1 className="text-5xl font-black text-gray-900 tracking-tighter mb-2" style={{ fontFamily: "Fraunces, serif" }}>Recetas</h1>
      </div>

      {loading ? (
        <div className="space-y-6">
          {[1, 2].map(i => <div key={i} className="w-full h-72 bg-gray-200 rounded-[32px] animate-pulse" />)}
        </div>
      ) : (
        <div className="space-y-6">
          {suggestions.map((recipe, index) => (
            <div 
              key={recipe.id} 
              onClick={() => navigate(`/recipe/${recipe.id}`)} 
              className="bg-white rounded-[32px] overflow-hidden shadow-xl shadow-gray-200/50 active:scale-95 transition-all cursor-pointer animate-fade-in-up"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="relative w-full h-56 bg-gray-200">
                <img src={recipe.image} alt={recipe.title} className="w-full h-full object-cover" />
                <div className="absolute top-4 right-4 px-4 py-2 bg-white/90 backdrop-blur-md text-gray-900 font-black text-xs rounded-full">
                  {recipe.match}% Alacena
                </div>
              </div>

              <div className="p-6">
                <h3 className="text-2xl font-black text-gray-900 mb-4 leading-tight" style={{ fontFamily: "Fraunces, serif" }}>{recipe.title}</h3>
                
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex gap-2">
                    {recipe.diets.map((diet, idx) => (
                      <span key={idx} className="text-[10px] font-black uppercase tracking-wide text-[#2D7A47] bg-[#DCFCE7] px-3 py-1.5 rounded-full">{diet}</span>
                    ))}
                  </div>
                  <span className="flex items-center gap-1.5 text-sm font-bold text-gray-400">
                    <IconClock/> {recipe.time} min
                  </span>
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