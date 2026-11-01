import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { IconLeaf } from '../components/Icons';

function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const endpoint = isLogin ? '/auth/login' : '/auth/register';
      const payload = isLogin ? { email: formData.email, password: formData.password } : formData;
      const response = await api.post(endpoint, payload);
      
      // SOLUCIÓN: Guardamos el token y también el nombre del usuario
      localStorage.setItem('token', response.data.data.token);
      localStorage.setItem('userName', response.data.data.name || 'Cocinero');
      
      navigate('/dashboard');
    } catch (error) {
      alert(error.response?.data?.message || 'Conexión fallida');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F3EE] flex flex-col max-w-md mx-auto relative overflow-hidden">
      
      {/* Círculo decorativo de fondo */}
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-[#2D7A47]/10 rounded-full blur-3xl"></div>

      <div className="flex-1 flex flex-col justify-center px-8 py-12 relative z-10 animate-fade-in-up">
        
        <div className="w-16 h-16 bg-[#2D7A47] text-white rounded-[24px] flex items-center justify-center shadow-2xl shadow-green-900/20 mb-8 rotate-3">
          <IconLeaf className="w-8 h-8" />
        </div>

        <h1 className="text-5xl font-black text-gray-900 tracking-tighter mb-3 leading-none" style={{ fontFamily: "Fraunces, serif" }}>
          {isLogin ? 'Bienvenido a Kukin.' : 'Únete a Kukin.'}
        </h1>
        <p className="text-lg text-gray-500 font-medium mb-10 leading-snug">
          {isLogin ? 'Tu alacena inteligente te espera.' : 'Comienza a reducir el desperdicio hoy mismo.'}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4 mb-8">
          {!isLogin && (
            <input type="text" name="name" value={formData.name} onChange={handleChange} required placeholder="Nombre completo"
              className="w-full px-6 py-5 bg-white/60 backdrop-blur-md rounded-[24px] text-lg text-gray-900 font-semibold placeholder-gray-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#2D7A47]/10 transition-all shadow-sm" />
          )}
          <input type="email" name="email" value={formData.email} onChange={handleChange} required placeholder="Correo electrónico"
            className="w-full px-6 py-5 bg-white/60 backdrop-blur-md rounded-[24px] text-lg text-gray-900 font-semibold placeholder-gray-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#2D7A47]/10 transition-all shadow-sm" />
          
          <input type="password" name="password" value={formData.password} onChange={handleChange} required placeholder="Contraseña"
            className="w-full px-6 py-5 bg-white/60 backdrop-blur-md rounded-[24px] text-lg text-gray-900 font-semibold placeholder-gray-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#2D7A47]/10 transition-all shadow-sm" />
          
          <button type="submit" disabled={loading} className="w-full py-5 bg-[#2D7A47] text-white font-bold text-lg rounded-[24px] mt-4 active:scale-95 transition-transform shadow-xl shadow-green-900/20 flex justify-center">
            {loading ? <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin" /> : (isLogin ? 'Iniciar sesión' : 'Crear cuenta')}
          </button>
        </form>

        <button onClick={() => setIsLogin(!isLogin)} className="w-full text-center text-sm font-bold text-gray-500 hover:text-[#2D7A47] transition-colors">
          {isLogin ? '¿Nuevo aquí? Crea una cuenta' : '¿Ya tienes cuenta? Inicia sesión'}
        </button>
      </div>
    </div>
  );
}

export default Auth;