import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../services/api';
import { IconSearch } from '../components/Icons';

const commonIngredients = [
  { term: "Jitomate", emoji: "🍅" },
  { term: "Cebolla", emoji: "🧅" },
  { term: "Aguacate", emoji: "🥑" },
  { term: "Limón", emoji: "🍋" },
  { term: "Chile", emoji: "🌶️" },
  { term: "Frijoles", emoji: "🫘" },
  { term: "Tortilla", emoji: "🌽" },
  { term: "Cilantro", emoji: "🌿" },
];

// NUEVO: Catálogo completo de unidades sincronizado con los IDs de MySQL
const unitOptions = [
  { id: 1, name: 'Piezas' },
  { id: 2, name: 'Gramos' },
  { id: 3, name: 'Mililitros' },
  { id: 4, name: 'Tazas' },
  { id: 5, name: 'Cucharadas' },
  { id: 6, name: 'Cucharaditas' },
  { id: 7, name: 'Onzas' },
  { id: 8, name: 'Libras' },
  { id: 9, name: 'Dientes' },
  { id: 10, name: 'Pizcas' },
  { id: 11, name: 'Latas' },
  { id: 12, name: 'Kilogramos (kg)' },
  { id: 13, name: 'Litros (L)' },
  { id: 14, name: 'Manojos' }
];

function AddIngredient() {
  const navigate = useNavigate();
  const location = useLocation();
  
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [selectedIngredient, setSelectedIngredient] = useState(null);
  
  const [quantity, setQuantity] = useState('');
  // Guardamos el ID directamente (1 = Piezas por defecto)
  const [unitId, setUnitId] = useState(1); 
  const [expiration, setExpiration] = useState('');

  useEffect(() => {
    if (location.state && location.state.preselected) {
      handleSelect(location.state.preselected);
    }
  }, [location.state]);

  useEffect(() => {
    const searchIngredients = async () => {
      if (query.trim().length < 2) {
        setResults([]);
        return;
      }
      if (selectedIngredient && (selectedIngredient.name_es === query || selectedIngredient.name === query)) {
        return;
      }
      
      try {
        const response = await api.get(`/ingredients?search=${query}`);
        setResults(response.data.data || []);
      } catch (error) {
        console.error("Error buscando:", error);
      }
    };
    const timeoutId = setTimeout(searchIngredients, 300);
    return () => clearTimeout(timeoutId);
  }, [query, selectedIngredient]);

  const handleQuickSelect = async (item) => {
    setQuery("Buscando..."); 
    setResults([]);
    
    try {
      const response = await api.get(`/ingredients?search=${item.term}`);
      const data = response.data.data || [];
      
      const exactMatch = data.find(ing => {
        const dbName = (ing.name_es || ing.name || "").toLowerCase();
        return dbName.includes(item.term.toLowerCase());
      });

      if (exactMatch) {
        setSelectedIngredient({ ...exactMatch, emoji: item.emoji });
        setQuery(exactMatch.name_es || exactMatch.name); 
      } else {
        alert(`"${item.term}" no está en tu base de datos. Solo puedes agregar ingredientes que la app ya conozca por las recetas descubiertas.`);
        setQuery('');
        setSelectedIngredient(null);
      }
    } catch (error) {
      console.error("Error buscando ingrediente rápido:", error);
      setQuery('');
    }
  };

  const handleSelect = (ing) => {
    setSelectedIngredient(ing);
    setQuery(ing.name_es || ing.name);
    setResults([]);
  };

  const estimateExpiration = (name) => {
    const today = new Date();
    const lowerName = name.toLowerCase();
    let daysToAdd = 5; 

    const isPantry = ['lata', 'enlatado', 'bote', 'caja', 'arroz', 'frijol', 'lenteja', 'sal', 'azúcar', 'aceite', 'pasta'].some(kw => lowerName.includes(kw));
    const isMeat = ['carne', 'pollo', 'pescado', 'res', 'cerdo'].some(kw => lowerName.includes(kw));

    if (isPantry) daysToAdd = 90; 
    if (isMeat) daysToAdd = 3;    

    today.setDate(today.getDate() + daysToAdd);
    const offset = today.getTimezoneOffset() * 60000;
    return (new Date(today - offset)).toISOString().split('T')[0];
  };

  const handleSave = async () => {
    if (!selectedIngredient || !quantity) {
      alert("Selecciona un ingrediente de la lista y escribe una cantidad");
      return;
    }

    let finalExpiration = expiration;
    if (!finalExpiration) {
       finalExpiration = estimateExpiration(selectedIngredient.name_es || selectedIngredient.name);
    }

    const payload = {
      id_ingredient: selectedIngredient.id_ingredient || selectedIngredient.id,
      quantity: parseFloat(quantity),
      id_unit: unitId,
      expiration_date: finalExpiration
    };

    try {
      // 1. Intentamos agregarlo como nuevo
      await api.post('/inventory', payload);
      navigate('/dashboard');
    } catch (error) {
      // 2. Si el backend responde 409 Conflict (DUPLICADO), cumplimos la prueba ofreciendo actualizar
      if (error.response?.status === 409 || error.response?.data?.code === "INGREDIENT_ALREADY_IN_INVENTORY") {
         
         const confirmUpdate = window.confirm("Este ingrediente ya está en tu alacena. ¿Deseas sumar esta nueva cantidad y actualizar su fecha de caducidad?");
         
         if (confirmUpdate) {
           try {
             // 3. Hacemos la petición PUT para actualizar
             await api.put(`/inventory/${payload.id_ingredient}`, payload);
             navigate('/dashboard');
           } catch (updateError) {
             alert("Hubo un problema al actualizar la cantidad.");
           }
         }
      } else {
         alert("Ocurrió un error al guardar.");
      }
    }
  };

  return (
    <div className="w-full px-6 pt-12 min-h-screen bg-[#FDFBF7]">
      <div className="flex items-center gap-4 mb-8">
        <button 
          onClick={() => navigate(-1)}
          className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm text-xl font-black active:scale-90 transition-transform"
        >
          ←
        </button>
        <h1 className="text-3xl font-black text-[#0B1E36] tracking-tighter" style={{ fontFamily: "Fraunces, serif" }}>
          Añadir
        </h1>
      </div>

      <div className="mb-8">
        <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Básicos de Cocina</h4>
        <div className="flex flex-wrap gap-3">
          {commonIngredients.map((item, idx) => {
            const isActive = selectedIngredient && 
              (selectedIngredient.name_es?.toLowerCase().includes(item.term.toLowerCase()) || 
               selectedIngredient.name?.toLowerCase().includes(item.term.toLowerCase()));
            
            return (
              <button 
                key={idx}
                onClick={() => handleQuickSelect(item)}
                className={`bg-white border px-4 py-2.5 rounded-full text-sm font-bold flex items-center gap-2 transition-all shadow-sm ${isActive ? 'border-[#2D7A47] bg-[#E8F5E9] text-[#2D7A47]' : 'border-gray-100 text-gray-700 hover:border-gray-300'}`}
              >
                <span>{item.emoji}</span> {item.term}
              </button>
            );
          })}
        </div>
      </div>

      <div className="relative mb-6">
        <div className={`bg-white rounded-[20px] flex items-center px-5 py-4 shadow-sm border transition-all ${selectedIngredient ? 'border-[#2D7A47] ring-2 ring-[#2D7A47]/10' : 'border-gray-100 focus-within:border-gray-300'}`}>
          <div className="w-8 h-8 flex items-center justify-center text-xl mr-2">
            {selectedIngredient ? (selectedIngredient.emoji || '✅') : '🥫'}
          </div>
          <input 
            type="text" 
            placeholder="¿Qué vas a guardar?" 
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIngredient(null);
            }}
            className="flex-1 bg-transparent text-base font-bold text-[#0B1E36] outline-none placeholder-gray-400"
          />
        </div>
        
        {results.length > 0 && !selectedIngredient && (
           <div className="absolute top-16 left-0 right-0 bg-white rounded-[20px] shadow-xl border border-gray-100 overflow-hidden z-20">
             {results.map((result) => (
               <div 
                 key={result.id_ingredient || result.id}
                 onClick={() => handleSelect(result)}
                 className="px-5 py-4 hover:bg-gray-50 cursor-pointer text-sm font-bold text-[#0B1E36] border-b border-gray-50 last:border-0"
               >
                 {result.name_es || result.name}
               </div>
             ))}
           </div>
        )}
      </div>

      <div className="flex gap-4 mb-6">
        <div className="flex-1 bg-white rounded-[20px] p-4 shadow-sm border border-gray-100">
          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Cantidad</label>
          <input 
            type="number" 
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            placeholder="0"
            className="w-full text-xl font-black text-[#0B1E36] outline-none bg-transparent"
          />
        </div>
        <div className="flex-1 bg-white rounded-[20px] p-4 shadow-sm border border-gray-100">
          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Unidad</label>
          <select 
            value={unitId}
            onChange={(e) => setUnitId(Number(e.target.value))}
            className="w-full text-sm font-bold text-[#0B1E36] outline-none bg-transparent appearance-none"
          >
            {unitOptions.map(option => (
              <option key={option.id} value={option.id}>
                {option.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-[20px] p-4 shadow-sm border border-gray-100 mb-8">
        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Fecha de caducidad</label>
        <div className="flex items-center gap-3">
          <input 
            type="date"
            value={expiration}
            onChange={(e) => setExpiration(e.target.value)}
            className="flex-1 text-sm font-bold text-[#0B1E36] outline-none bg-transparent"
          />
          {!expiration && (
            <span className="text-[10px] text-gray-400 italic">Autocálculo activado</span>
          )}
        </div>
      </div>

      <button 
        onClick={handleSave}
        className="w-full bg-[#0B1E36] text-white font-bold text-lg py-4 rounded-full shadow-lg active:scale-95 transition-transform"
      >
        Guardar en alacena
      </button>
    </div>
  );
}

export default AddIngredient;