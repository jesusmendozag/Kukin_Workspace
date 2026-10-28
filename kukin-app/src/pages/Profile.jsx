import React from 'react';
import { useNavigate } from 'react-router-dom';

function Profile() {
  const navigate = useNavigate();

  return (
    <div className="w-full px-6 pt-12 animate-fade-in-up">
      <div className="mb-12">
        <h1 className="text-5xl font-black text-gray-900 tracking-tighter" style={{ fontFamily: "Fraunces, serif" }}>Perfil</h1>
      </div>

      <div className="bg-white rounded-[40px] p-8 shadow-xl shadow-gray-200/50 flex flex-col items-center text-center mb-8">
        <div className="w-28 h-28 bg-gradient-to-br from-[#2D7A47] to-[#4CAF6B] text-white flex items-center justify-center font-black text-5xl rounded-[32px] mb-6 shadow-lg rotate-3" style={{ fontFamily: "Fraunces, serif" }}>
          J
        </div>
        <h2 className="text-2xl font-black text-gray-900 tracking-tight" style={{ fontFamily: "Fraunces, serif" }}>Jesús Mendoza Gómez</h2>
        <p className="text-base font-bold text-gray-400 mt-1 bg-gray-50 px-4 py-1.5 rounded-full inline-block">Ingeniero de Software</p>
      </div>

      <button onClick={() => { localStorage.removeItem('token'); navigate('/'); }} 
        className="w-full py-6 bg-[#FEE2E2] text-[#991B1B] font-black text-lg rounded-[32px] active:scale-95 transition-transform shadow-sm">
        Cerrar Sesión
      </button>
    </div>
  );
}

export default Profile;