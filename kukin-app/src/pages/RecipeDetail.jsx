import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { IconClock } from '../components/Icons';
import api from '../services/api';

function RecipeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Estados para la interactividad
  const [checkedIngs, setCheckedIngs] = useState({});
  const [completedSteps, setCompletedSteps] = useState([]);

  useEffect(() => {
    const fetchRecipeFromDB = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/recipes/${id}`);
        setRecipe(response.data.data || response.data);
      } catch (error) {
        console.error("Error cargando detalle desde la BD:", error);
        setRecipe({
          title_recipe: "Receta de Prueba Local",
          url_image: "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&q=80&w=800",
          time_preparation: 30, servings: 2,
          ingredients: [{ ingredient_name: "Pollo", amount: 1, unit_symbol: "pza" }],
          instructions: "1. Información de prueba porque falló la conexión con Java."
        });
      } finally {
        setLoading(false);
      }
    };
    if (id !== "undefined") {
      fetchRecipeFromDB();
    }
  }, [id]);

  // Funciones de interacción
  const toggleIngredient = (index) => {
    setCheckedIngs(prev => ({ ...prev, [index]: !prev[index] }));
  };

  const toggleStep = (index) => {
    if (completedSteps.includes(index)) {
      setCompletedSteps(completedSteps.filter(i => i !== index));
    } else {
      setCompletedSteps([...completedSteps, index]);
    }
  };

  if (loading || !recipe) return (
    <div className="min-h-screen bg-[#FDFBF7] flex flex-col items-center justify-center gap-4 relative overflow-hidden">
      <div className="w-12 h-12 border-4 border-gray-200 border-t-[#2D7A47] rounded-full animate-spin mb-4" />
      <h2 className="text-xl font-black text-[#0B1E36] tracking-tight" style={{ fontFamily: "Fraunces, serif" }}>
        Sirviendo la mesa...
      </h2>
    </div>
  );

  // Procesamos las instrucciones: Las decodificamos por si Java no limpió los %2C y las dividimos en pasos
  const rawInstructions = recipe.instructions ? decodeURIComponent(recipe.instructions) : "";
  const pasosArray = rawInstructions.split('\n').filter(step => step.trim() !== '');
  
  // Cálculo de progreso para la barra superior
  const progress = pasosArray.length > 0 ? Math.round((completedSteps.length / pasosArray.length) * 100) : 0;

  return (
    <div className="w-full bg-[#0B1E36] min-h-screen relative">
      <button 
        onClick={() => navigate(-1)} 
        className="fixed top-8 left-6 w-12 h-12 bg-white/90 backdrop-blur-md text-[#0B1E36] rounded-full flex items-center justify-center text-xl font-black active:scale-90 transition-transform duration-300 shadow-xl z-50 border border-white/20"
      >
        ←
      </button>

      <div className="w-full h-[55vh] sticky top-0 z-0">
        <img 
          src={recipe.url_image || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=800"} 
          alt={recipe.title_recipe} 
          className="w-full h-full object-cover opacity-90" 
          onError={(e) => { e.target.src = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=800" }}
        />
      </div>

      <div className="relative z-10 bg-[#FDFBF7] rounded-t-[48px] -mt-[15vh] min-h-screen px-6 pt-8 pb-32 shadow-[0_-20px_40px_rgba(0,0,0,0.2)] animate-fade-in-up">
        <div className="w-16 h-1.5 bg-gray-300/60 rounded-full mx-auto mb-10" />

        <h1 className="text-4xl md:text-5xl font-black text-[#0B1E36] leading-tight mb-6 tracking-tighter" style={{ fontFamily: "Fraunces, serif" }}>
          {decodeURIComponent(recipe.title_recipe)}
        </h1>

        <div className="flex flex-wrap items-center gap-3 mb-10">
          <span className="flex items-center gap-2 bg-white text-[#0B1E36] font-black px-5 py-3 rounded-[16px] shadow-sm text-sm border border-gray-100">
            <IconClock className="w-5 h-5 text-[#2D7A47]"/> {recipe.time_preparation || 0} min
          </span>
          <span className="bg-white text-[#0B1E36] font-black px-5 py-3 rounded-[16px] shadow-sm text-sm border border-gray-100">
            🍽️ {recipe.servings || 2} porciones
          </span>
        </div>

        <div className="space-y-12">
          {/* SECCIÓN INGREDIENTES */}
          {recipe.ingredients && recipe.ingredients.length > 0 && (
            <div>
              <h3 className="text-2xl font-black text-[#0B1E36] mb-6 flex items-center justify-between" style={{ fontFamily: "Fraunces, serif" }}>
                Ingredientes
                <span className="text-[10px] font-black uppercase tracking-widest text-[#2D7A47] bg-[#E8F5E9] px-3 py-1.5 rounded-full font-sans">
                  {recipe.ingredients.length} items
                </span>
              </h3>
              
              <div className="space-y-3">
                {recipe.ingredients.map((ing, i) => {
                  const isChecked = checkedIngs[i];
                  return (
                    <div 
                      key={i} 
                      onClick={() => toggleIngredient(i)}
                      className={`flex items-center justify-between p-4 rounded-[24px] shadow-sm active:scale-[0.97] transition-all duration-300 cursor-pointer border ${isChecked ? 'bg-gray-50 border-gray-100 opacity-60' : 'bg-white border-transparent hover:border-[#2D7A47]/30'}`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-300 flex-shrink-0 ${isChecked ? 'bg-[#2D7A47] border-[#2D7A47]' : 'border-gray-300 bg-white'}`}>
                          {isChecked && <span className="text-white text-xs font-bold">✓</span>}
                        </div>
                        <span className={`text-[15px] font-semibold capitalize leading-tight transition-all duration-300 ${isChecked ? 'text-gray-400 line-through' : 'text-[#0B1E36]'}`}>
                          {decodeURIComponent(ing.ingredient_name || ing.name_es)}
                        </span>
                      </div>
                      <span className={`text-xs font-black px-3 py-1.5 rounded-[10px] transition-all duration-300 flex-shrink-0 whitespace-nowrap ${isChecked ? 'bg-gray-200 text-gray-500' : 'bg-[#E8F5E9] text-[#2D7A47]'}`}>
                        {ing.amount} {ing.unit_symbol}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* SECCIÓN PREPARACIÓN INTERACTIVA */}
          <div>
            <div className="flex justify-between items-end mb-6">
              <h3 className="text-2xl font-black text-[#0B1E36]" style={{ fontFamily: "Fraunces, serif" }}>
                Preparación
              </h3>
              {pasosArray.length > 0 && (
                <span className="text-xs font-bold text-[#2D7A47]">{progress}%</span>
              )}
            </div>

            {/* Barra de Progreso Dinámica */}
            {pasosArray.length > 0 && (
              <div className="w-full bg-gray-200 h-1.5 rounded-full mb-8 overflow-hidden">
                <div 
                  className="h-full bg-[#2D7A47] transition-all duration-500 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
            )}

            {pasosArray.length > 0 ? (
              <div className="space-y-4">
                {pasosArray.map((paso, index) => {
                  const isDone = completedSteps.includes(index);
                  // Limpiamos la enumeración cruda ("1. ", "2. ")
                  const cleanText = paso.replace(/^\d+\.\s*/, '');
                  
                  return (
                    <div 
                      key={index}
                      onClick={() => toggleStep(index)}
                      className={`relative flex gap-4 p-5 rounded-[24px] cursor-pointer transition-all duration-300 active:scale-[0.98] border ${
                        isDone 
                          ? 'bg-gray-50 border-gray-100 opacity-60 shadow-none' 
                          : 'bg-white border-transparent shadow-sm hover:border-[#2D7A47]/30'
                      }`}
                    >
                      <div className={`w-8 h-8 shrink-0 rounded-full flex items-center justify-center text-sm font-black transition-colors ${
                        isDone ? 'bg-[#2D7A47] text-white' : 'bg-[#E8F5E9] text-[#2D7A47]'
                      }`}>
                        {isDone ? '✓' : index + 1}
                      </div>
                      
                      <p className={`text-[15px] font-semibold mt-1 leading-relaxed transition-colors ${
                        isDone ? 'text-gray-400 line-through' : 'text-gray-700'
                      }`}>
                        {cleanText}
                      </p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-white p-8 rounded-[32px] shadow-sm text-center border border-gray-50">
                <div className="text-4xl mb-3">🥗</div>
                <p className="text-lg text-[#0B1E36] font-black" style={{ fontFamily: "Fraunces, serif" }}>Mezcla todo y disfruta</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default RecipeDetail;