import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

function AddIngredient() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    idIngredient: '3', 
    quantity: '',
    idUnit: '1',       
    expirationDate: ''
  });

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      let expDate = formData.expirationDate;
      const parsedIdIngredient = parseInt(formData.idIngredient, 10);
      
      if (!expDate) {
        const shelfLife = { 1: 10, 2: 21, 3: 21, 4: 3 };
        const daysToAdd = shelfLife[parsedIdIngredient] || 7; 
        const targetDate = new Date();
        targetDate.setDate(targetDate.getDate() + daysToAdd);
        expDate = `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, '0')}-${String(targetDate.getDate()).padStart(2, '0')}`;
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
      alert('Error: ' + errorMsg);
    }
  };

  return (
    <div className="w-full px-6 md:px-12 pt-8 md:pt-4 max-w-2xl mx-auto flex flex-col min-h-[85vh]">
      <div className="mb-12">
        <h1 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tighter" style={{ fontFamily: "Fraunces, serif" }}>
          Nuevo Ingrediente
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 flex-1">
        
        <div>
          <label className="text-base font-bold text-gray-900 mb-3 block">Ingrediente</label>
          <select name="idIngredient" value={formData.idIngredient} onChange={handleChange} required
            className="w-full bg-white text-lg text-gray-900 px-5 py-4 focus:outline-none cursor-pointer">
            <option value="1">Jitomate</option>
            <option value="2">Cebolla</option>
            <option value="3">Huevo</option>
            <option value="4">Pollo</option>
          </select>
        </div>

        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex-1">
            <label className="text-base font-bold text-gray-900 mb-3 block">Cantidad</label>
            <input type="number" step="0.01" min="0.01" name="quantity" value={formData.quantity} onChange={handleChange} placeholder="Ej. 12" required
              className="w-full bg-white text-lg text-gray-900 px-5 py-4 focus:outline-none placeholder-gray-400" />
          </div>

          <div className="flex-1">
            <label className="text-base font-bold text-gray-900 mb-3 block">Medida</label>
            <select name="idUnit" value={formData.idUnit} onChange={handleChange} required
              className="w-full bg-white text-lg text-gray-900 px-5 py-4 focus:outline-none cursor-pointer">
              <option value="1">Piezas (pza)</option>
              <option value="2">Gramos (g)</option>
              <option value="3">Mililitros (ml)</option>
            </select>
          </div>
        </div>

        <div>
          <label className="text-base font-bold text-gray-900 mb-3 block">Caducidad</label>
          <input type="date" name="expirationDate" value={formData.expirationDate} onChange={handleChange}
            className="w-full bg-white text-lg text-gray-900 px-5 py-4 focus:outline-none" />
          <p className="text-sm text-gray-500 mt-2">Déjalo en blanco para estimar automáticamente.</p>
        </div>

        <div className="pt-8">
          <button type="submit" className="w-full py-5 bg-[#2D7A47] text-white font-bold text-lg rounded-full active:scale-95 transition-transform">
            Guardar
          </button>
        </div>
      </form>
    </div>
  );
}

export default AddIngredient;