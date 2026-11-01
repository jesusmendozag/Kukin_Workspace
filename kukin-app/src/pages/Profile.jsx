import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function Profile() {
  const navigate = useNavigate();
  const [modalOpen, setModalOpen] = useState(false);
  
  // SOLUCIÓN: Leemos el nombre guardado en Auth.jsx
  const userName = localStorage.getItem('userName') || 'Usuario';
  const initial = userName.charAt(0).toUpperCase();

  const handleLogout = () => {
    // SOLUCIÓN: Limpiamos toda la sesión, incluyendo el nombre
    localStorage.removeItem('token');
    localStorage.removeItem('userName');
    navigate('/');
  };

  return (
    <div className="w-full px-6 pt-12 animate-fade-in-up flex flex-col min-h-[85vh]">
      <div className="mb-10">
        <h1 className="text-5xl font-black text-gray-900 tracking-tighter" style={{ fontFamily: "Fraunces, serif" }}>Tú</h1>
      </div>

      <div className="bg-white rounded-[40px] p-8 shadow-sm flex flex-col items-center text-center mb-8 border border-gray-50">
        <div className="w-28 h-28 bg-[#2D7A47] text-white flex items-center justify-center font-black text-5xl rounded-[32px] mb-6 rotate-3">
          {initial}
        </div>
        <h2 className="text-2xl font-black text-[#0B1E36]">
          {userName}
        </h2>
        <p className="text-xs font-black uppercase tracking-widest text-white mt-2 bg-gray-900 px-4 py-2 rounded-full">Premium</p>
      </div>

      <div className="space-y-3 mb-8">
        <button onClick={() => setModalOpen(true)} className="w-full p-5 bg-white text-left font-bold text-gray-900 rounded-[24px] shadow-sm flex justify-between items-center active:scale-95 transition-transform">
          <span>⚙️ Preferencias de Dieta</span>
          <span className="text-gray-300">→</span>
        </button>
        <button onClick={() => setModalOpen(true)} className="w-full p-5 bg-white text-left font-bold text-gray-900 rounded-[24px] shadow-sm flex justify-between items-center active:scale-95 transition-transform">
          <span>🔔 Notificaciones</span>
          <span className="text-gray-300">→</span>
        </button>
      </div>

      <div className="mt-auto">
        <button onClick={handleLogout} 
          className="w-full py-5 bg-[#FFF0F0] text-[#E84B2D] font-black text-lg rounded-[28px] active:scale-95 transition-transform shadow-sm">
          Cerrar Sesión
        </button>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-6 animate-fade-in-up">
          <div className="bg-white rounded-[36px] p-8 w-full max-w-sm text-center shadow-2xl">
            <h2 className="text-xl font-black text-gray-900 mb-2">Próximamente</h2>
            <p className="text-sm text-gray-500 font-bold mb-6">Esta función estará disponible en la próxima actualización de Kukin.</p>
            <button onClick={() => setModalOpen(false)} className="w-full py-4 bg-[#2D7A47] text-white font-black rounded-full active:scale-95 transition-transform">
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Profile;