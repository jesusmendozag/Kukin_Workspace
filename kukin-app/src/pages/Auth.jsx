import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { IconLeaf, IconGoogle, IconInstagram } from '../components/Icons';

function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const endpoint = isLogin ? '/auth/login' : '/auth/register';
      const payload = isLogin ? { email: formData.email, password: formData.password } : formData;
      
      const response = await api.post(endpoint, payload);
      localStorage.setItem('token', response.data.data.token);
      
      navigate('/dashboard'); // Descomentar cuando la pantalla Dashboard esté enrutada
    } catch (error) {
      alert('Error: ' + (error.response?.data?.message || 'Conexión fallida'));
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FDF8F0] md:max-w-md md:mx-auto md:shadow-2xl">
      {/* Header Visual */}
      <div className="relative h-64 overflow-hidden" style={{ background: "linear-gradient(160deg,#2D7A47 0%,#4CAF6B 60%,#8BC34A 100%)" }}>
        <div className="absolute -top-8 -left-8 w-40 h-40 rounded-full border-8 border-white/10" />
        <div className="absolute -top-4 -left-4 w-28 h-28 rounded-full border-4 border-white/10" />
        <div className="absolute -bottom-12 -right-12 w-52 h-52 rounded-full border-8 border-white/10" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
          <div className="w-20 h-20 bg-white rounded-3xl shadow-2xl flex items-center justify-center text-green-700 mb-3">
            <IconLeaf className="w-10 h-10" />
          </div>
          <div className="text-white font-black text-3xl tracking-tight" style={{ fontFamily: "Fraunces, serif" }}>Kukin</div>
          <div className="text-green-100 text-xs mt-0.5 font-medium uppercase tracking-widest">by Naat Labs</div>
        </div>
      </div>

      {/* Formulario */}
      <div className="flex-1 px-8 pt-8 pb-6 flex flex-col">
        <h2 className="text-2xl font-bold text-gray-900 mb-1" style={{ fontFamily: "Fraunces, serif" }}>
          {isLogin ? 'Bienvenido de vuelta' : 'Comienza tu viaje'}
        </h2>
        <p className="text-sm text-gray-400 mb-8">
          {isLogin ? 'Inicia sesión para ver tus recetas' : 'Regístrate para reducir el desperdicio'}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4 mb-6">
          {!isLogin && (
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1.5 block uppercase tracking-wide">Nombre completo</label>
              <input type="text" name="name" placeholder="Tu Nombre" value={formData.name} onChange={handleChange} required
                className="w-full px-4 py-3.5 rounded-2xl bg-white border border-gray-100 text-sm text-gray-800 placeholder-gray-300 shadow-sm focus:outline-none focus:border-green-500" />
            </div>
          )}
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1.5 block uppercase tracking-wide">Correo electrónico</label>
            <input type="email" name="email" placeholder="tu@correo.com" value={formData.email} onChange={handleChange} required
              className="w-full px-4 py-3.5 rounded-2xl bg-white border border-gray-100 text-sm text-gray-800 placeholder-gray-300 shadow-sm focus:outline-none focus:border-green-500" />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1.5 block uppercase tracking-wide">Contraseña</label>
            <input type="password" name="password" placeholder="••••••••" value={formData.password} onChange={handleChange} required
              className="w-full px-4 py-3.5 rounded-2xl bg-white border border-gray-100 text-sm text-gray-800 placeholder-gray-300 shadow-sm focus:outline-none focus:border-green-500" />
            {isLogin && (
              <div className="text-right mt-2">
                <button type="button" className="text-xs font-semibold text-green-700">¿Olvidaste tu contraseña?</button>
              </div>
            )}
          </div>
          <button type="submit" className="w-full py-4 rounded-2xl text-white font-bold text-base mt-2 shadow-lg transition-transform active:scale-95"
            style={{ background: "linear-gradient(135deg,#2D7A47,#4CAF6B)" }}>
            {isLogin ? 'Iniciar sesión' : 'Crear cuenta'}
          </button>
        </form>

        <div className="flex items-center gap-3 mb-5">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-xs text-gray-400 font-medium">o continuar con</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        <div className="flex gap-3 mb-6">
          <button type="button" className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-white border border-gray-100 shadow-sm text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50">
            <IconGoogle /> Google
          </button>
          <button type="button" className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-white border border-gray-100 shadow-sm text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50">
            <IconInstagram /> Instagram
          </button>
        </div>

        <p className="text-center text-xs text-gray-400 mt-auto">
          {isLogin ? '¿Sin cuenta? ' : '¿Ya tienes cuenta? '}
          <button onClick={() => setIsLogin(!isLogin)} className="font-bold text-green-700">
            {isLogin ? 'Regístrate gratis' : 'Inicia sesión'}
          </button>
        </p>
      </div>
    </div>
  );
}

export default Auth;