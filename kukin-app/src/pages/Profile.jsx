import React from 'react';
import { useNavigate } from 'react-router-dom';

function Profile() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/');
  };

  return (
    <div className="w-full h-full pt-8 md:pt-12 px-6 md:px-0 max-w-2xl mx-auto">
      <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 text-center mb-6">
        <div className="w-24 h-24 rounded-full bg-green-100 border-4 border-white shadow-lg mx-auto flex items-center justify-center text-green-700 font-black text-3xl mb-4" style={{ fontFamily: "Fraunces, serif" }}>
          U
        </div>
        <h2 className="text-2xl font-bold text-gray-900" style={{ fontFamily: "Fraunces, serif" }}>Tu Cuenta</h2>
        <p className="text-sm text-gray-400 mt-1">Configuración y Preferencias</p>
      </div>

      <div className="bg-white rounded-3xl p-2 shadow-sm border border-gray-100">
        <button onClick={handleLogout} className="w-full p-4 text-center text-red-600 font-bold text-sm rounded-2xl hover:bg-red-50 transition-colors">
          Cerrar Sesión
        </button>
      </div>
    </div>
  );
}

export default Profile;