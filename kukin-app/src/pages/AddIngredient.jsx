import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

function AddIngredient() {
  const navigate = useNavigate();

  // El secreto está aquí: Inicializar con los IDs reales de la base de datos 
  // para que coincidan con la vista por defecto (Huevo = 3, Pieza = 1)
  const [formData, setFormData] = useState({
    idIngredient: '3', 
    quantity: '',
    idUnit: '1',       
    expirationDate: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

 const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      let expDate = formData.expirationDate;
      const parsedIdIngredient = parseInt(formData.idIngredient, 10);
      
      // Si el usuario no puso fecha, calculamos una estimada según el ingrediente
      if (!expDate) {
        // Diccionario de vida útil estimada en días
        const shelfLife = {
          1: 10, // Jitomate (10 días)
          2: 21, // Cebolla (21 días)
          3: 21, // Huevo (21 días en refri)
          4: 3   // Pollo crudo (3 días)
        };
        
        // Si no está en el diccionario, le damos 7 días por defecto
        const daysToAdd = shelfLife[parsedIdIngredient] || 7; 
        
        const targetDate = new Date();
        targetDate.setDate(targetDate.getDate() + daysToAdd); // Sumamos los días a la fecha de hoy
        
        const yyyy = targetDate.getFullYear();
        const mm = String(targetDate.getMonth() + 1).padStart(2, '0');
        const dd = String(targetDate.getDate()).padStart(2, '0');
        expDate = `${yyyy}-${mm}-${dd}`;
      }

      const payload = {
        idIngredient: parsedIdIngredient,
        id_ingredient: parsedIdIngredient,
        quantity: parseFloat(formData.quantity),
        idUnit: parseInt(formData.idUnit, 10),
        id_unit: parseInt(formData.idUnit, 10),
        expirationDate: expDate,
        expiration_date: expDate
      };

      await api.post('/inventory', payload);
      navigate('/dashboard');
    } catch (error) {
      const errorMsg = error.response?.data?.details?.[0] || error.response?.data?.message || 'Error de conexión';
      alert('No se pudo guardar: ' + errorMsg);
    }
  };

  return (
    <div className="w-full h-full pt-8 md:pt-12 px-6 md:px-0 max-w-xl mx-auto flex flex-col">
      <div className="flex items-center gap-4 mb-8">
        <button 
          onClick={() => navigate(-1)} 
          className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-gray-800 font-bold border border-gray-100 transition-transform active:scale-95"
        >
          ←
        </button>
        <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: "Fraunces, serif" }}>
          Nuevo Ingrediente
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 flex-1">
        
        <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-50">
          <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">¿Qué vas a guardar?</label>
          <select 
            name="idIngredient" 
            value={formData.idIngredient} 
            onChange={handleChange} 
            required
            className="w-full bg-transparent text-sm font-semibold text-gray-800 focus:outline-none pb-1 cursor-pointer"
          >
            <option value="1">Jitomate</option>
            <option value="2">Cebolla</option>
            <option value="3">Huevo</option>
            <option value="4">Pollo</option>
          </select>
        </div>

        <div className="flex gap-4">
          <div className="flex-1 bg-white p-5 rounded-3xl shadow-sm border border-gray-50">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">Cantidad</label>
            <input 
              type="number" 
              step="0.01" 
              min="0.01" 
              name="quantity" 
              value={formData.quantity} 
              onChange={handleChange} 
              placeholder="Ej. 12" 
              required
              className="w-full bg-transparent text-sm font-semibold text-gray-800 focus:outline-none placeholder-gray-300 pb-1" 
            />
          </div>

          <div className="flex-1 bg-white p-5 rounded-3xl shadow-sm border border-gray-50">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">Medida</label>
            <select 
              name="idUnit" 
              value={formData.idUnit} 
              onChange={handleChange} 
              required
              className="w-full bg-transparent text-sm font-semibold text-gray-800 focus:outline-none pb-1 cursor-pointer"
            >
              <option value="1">Piezas (pza)</option>
              <option value="2">Gramos (g)</option>
              <option value="3">Mililitros (ml)</option>
            </select>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-50">
          <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">Caducidad (Opcional)</label>
          <input 
            type="date" 
            name="expirationDate" 
            value={formData.expirationDate} 
            onChange={handleChange}
            className="w-full bg-transparent text-sm font-semibold text-gray-800 focus:outline-none pb-1" 
          />
        </div>

        <button 
          type="submit" 
          className="w-full py-4 rounded-2xl text-white font-bold text-base shadow-lg transition-transform active:scale-95 mt-4"
          style={{ background: "#4CAF50" }}
        >
          Guardar en mi Alacena
        </button>
      </form>
    </div>
  );
}

export default AddIngredient;