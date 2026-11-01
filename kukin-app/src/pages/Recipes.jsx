import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { IconClock } from '../components/Icons';
import api from '../services/api';

const filtrosDisponibles = ["Todas", "Rápidas", "Al 100%", "Mexicanas", "Ligeras"];

function Recipes() {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [activeFilter, setActiveFilter] = useState("Todas");
  const navigate = useNavigate();

  const loadRecipesFromDB = async () => {
    try {
      setLoading(true);
      // Asegúrate de que la ruta llame a 'suggestions' para que Java haga la matemática
      const response = await api.get('/recipes/suggestions');
      setRecipes(response.data.data || []);
    } catch (error) {
      if (error.response?.status === 401 || error.response?.status === 403) {
        localStorage.removeItem('token');
        navigate('/');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecipesFromDB();
  }, []);

  const handleDiscover = async () => {
    if (!window.confirm("¿Buscar nuevas recetas en internet?")) return;
    try {
      setSyncing(true);
      await api.post('/recipes/discover');
      loadRecipesFromDB(); 
    } catch (error) {
      alert("Error al descubrir recetas. Revisa la consola del backend.");
    } finally {
      setSyncing(false);
    }
  };

  // MOTOR DE FILTRADO INTERACTIVO
  const filteredRecipes = recipes.filter(recipe => {
    if (activeFilter === "Todas") return true;

    // Uso de "??" para respetar el 0% y evitar el bug de JavaScript
    const match = recipe.matchPercentage ?? recipe.match_percentage ?? 0;
    const time = recipe.timePreparation ?? recipe.time_preparation ?? 30;
    const dietas = recipe.diets || recipe.dietas || [];

    if (activeFilter === "Rápidas") return time <= 30;
    if (activeFilter === "Al 100%") return match === 100;
    if (activeFilter === "Mexicanas") {
      return dietas.some(d => d.toLowerCase().includes("mexican")) || 
             (recipe.titleRecipe || recipe.title_recipe || "").toLowerCase().includes("taco");
    }
    if (activeFilter === "Ligeras") return dietas.some(d => d.toLowerCase().includes("ligera") || d.toLowerCase().includes("keto"));
    
    return true;
  });

  return (
    <div className="w-full px-6 pt-12 bg-[#FDFBF7] min-h-screen animate-fade-in-up">
      <div className="mb-6 flex justify-between items-start">
        <div>
          <h1 className="text-4xl font-black text-[#0B1E36] tracking-tighter mb-1" style={{ fontFamily: "Fraunces, serif" }}>Para Ti</h1>
          <p className="text-sm font-bold text-gray-400">Recetas sugeridas</p>
        </div>
        
        <button 
          onClick={handleDiscover}
          disabled={syncing}
          className="bg-[#2D7A47] text-white text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-[14px] shadow-lg shadow-green-900/20 active:scale-90 transition-transform flex items-center gap-2"
        >
          {syncing ? <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : "➕ Descubrir"}
        </button>
      </div>

      {/* BOTONES INTERACTIVOS */}
      <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-6 -mx-6 px-6">
        {filtrosDisponibles.map((filter) => (
          <button 
            key={filter} 
            onClick={() => setActiveFilter(filter)}
            className={`whitespace-nowrap px-5 py-2.5 rounded-[14px] text-sm font-black transition-all duration-300 active:scale-95 ${
              activeFilter === filter 
                ? "bg-[#0B1E36] text-white shadow-lg scale-105" 
                : "bg-white text-gray-500 border border-gray-100 shadow-sm opacity-80 hover:opacity-100"
            }`}
          >
            {filter}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-6">
          {[1, 2].map(i => (
            <div key={i} className="w-full bg-white rounded-[24px] overflow-hidden shadow-sm animate-pulse h-72" />
          ))}
        </div>
      ) : (
        <div className="space-y-6 pb-32">
          {filteredRecipes.map((recipe, index) => {
            const id = recipe.id_recipe || recipe.idRecipe;
            const title = recipe.title_recipe || recipe.titleRecipe || "Receta sin título";
            const image = recipe.url_image || recipe.urlImage || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=800";
            const time = recipe.time_preparation || recipe.timePreparation || 30;
            const match = recipe.matchPercentage ?? recipe.match_percentage ?? 0;
            const dietas = recipe.diets || recipe.dietas || [];

            return (
              <div 
                key={id || index} 
                onClick={() => navigate(`/recipe/${id}`)} 
                className="bg-white rounded-[24px] overflow-hidden shadow-sm active:scale-[0.97] transition-transform cursor-pointer animate-fade-in-up border border-gray-50 flex flex-col"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="relative w-full h-48 bg-gray-200 overflow-hidden">
                  <img 
                    src={image} 
                    alt={title} 
                    className="w-full h-full object-cover" 
                    onError={(e) => { e.target.src = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=800" }}
                  />
                  <div className={`absolute top-4 right-4 px-3 py-1.5 backdrop-blur-md font-black text-[10px] rounded-lg shadow-sm ${
                    match >= 80 ? 'bg-[#2D7A47]/90 text-white' : 
                    match >= 40 ? 'bg-[#F59E0B]/90 text-white' : 
                    'bg-white/90 text-[#0B1E36]'
                  }`}>
                    {match}% Coincidencia
                  </div>
                </div>

                <div className="p-5">
                  <div className="flex flex-wrap gap-2 mb-2">
                    {dietas.length > 0 ? (
                      dietas.map((diet, idx) => (
                        <span key={idx} className="text-[9px] font-black uppercase tracking-widest text-[#2D7A47] bg-[#E8F5E9] px-2.5 py-1 rounded-md">
                          {diet}
                        </span>
                      ))
                    ) : (
                      <span className="text-[9px] font-black uppercase tracking-widest text-gray-500 bg-gray-100 px-2.5 py-1 rounded-md">
                        Cocina Libre
                      </span>
                    )}
                  </div>

                  <h3 className="text-xl font-black text-[#0B1E36] leading-tight mb-3" style={{ fontFamily: "Fraunces, serif" }}>
                    {title}
                  </h3>
                  
                  <div className="flex items-center justify-between mt-auto">
                    <span className="flex items-center gap-1.5 text-xs font-bold text-gray-400">
                      <IconClock className="w-4 h-4"/> {time} min
                    </span>
                    <div className="w-8 h-8 bg-gray-50 rounded-full flex items-center justify-center text-[#0B1E36] font-black transition-colors group-hover:bg-[#2D7A47] group-hover:text-white">
                      →
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {filteredRecipes.length === 0 && (
            <div className="text-center p-8 bg-white rounded-[24px] shadow-sm animate-fade-in-up">
              <div className="text-4xl mb-4">🔍</div>
              <p className="font-bold text-[#0B1E36]">No hay recetas que coincidan.</p>
              <p className="text-sm text-gray-500 mt-2">Intenta cambiar de filtro o descubre nuevas recetas.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default Recipes;