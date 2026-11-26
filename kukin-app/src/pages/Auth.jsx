import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { TOKEN_KEY, getErrorMessage } from '../services/api';
import { IconLeaf } from '../components/Icons';

function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const endpoint = isLogin ? '/auth/login' : '/auth/register';
      const payload = isLogin
        ? { email: formData.email.trim(), password: formData.password }
        : { ...formData, name: formData.name.trim(), email: formData.email.trim() };
      const response = await api.post(endpoint, payload);
      localStorage.setItem(TOKEN_KEY, response.data.data.token);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setError('');
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#F7F3EE]">
      {/* Visual plano, sin gradientes ni sombras, enfocado en el color de la marca */}
      <div className="md:w-1/2 bg-[#2D7A47] text-white flex flex-col justify-center px-8 pb-12 pt-safe-16 md:p-24">
        <IconLeaf className="w-16 h-16 mb-6" />
        <h1 className="text-5xl md:text-7xl font-black leading-tight tracking-tighter mb-4" style={{ fontFamily: "Fraunces, serif" }}>
          Kukin
        </h1>
        <p className="text-xl font-medium opacity-90 max-w-sm">
          Convierte lo que tienes en casa en platillos extraordinarios.
        </p>
      </div>

      <div className="flex-1 flex flex-col justify-center px-8 py-12 md:p-24 bg-[#F7F3EE]">
        <div className="max-w-md w-full mx-auto">
          <h2 className="text-4xl font-black text-gray-900 mb-2 tracking-tight" style={{ fontFamily: "Fraunces, serif" }}>
            {isLogin ? 'Bienvenido' : 'Comienza tu viaje'}
          </h2>
          <p className="text-base text-gray-500 mb-10">
            {isLogin ? 'Inicia sesión para ver tu alacena.' : 'Regístrate para reducir el desperdicio.'}
          </p>

          <form onSubmit={handleSubmit} className="space-y-5 mb-8">
            {!isLogin && (
              <div>
                <label htmlFor="name" className="text-sm font-bold text-gray-900 mb-2 block">Nombre completo</label>
                <input id="name" type="text" name="name" value={formData.name} onChange={handleChange} required autoComplete="name"
                  className="w-full px-5 py-4 bg-white text-base text-gray-900 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#2D7A47]" />
              </div>
            )}
            <div>
              <label htmlFor="email" className="text-sm font-bold text-gray-900 mb-2 block">Correo electrónico</label>
              <input id="email" type="email" name="email" value={formData.email} onChange={handleChange} required autoComplete="email"
                inputMode="email" autoCapitalize="none"
                className="w-full px-5 py-4 bg-white text-base text-gray-900 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#2D7A47]" />
            </div>
            <div>
              <label htmlFor="password" className="text-sm font-bold text-gray-900 mb-2 block">Contraseña</label>
              <input id="password" type="password" name="password" value={formData.password} onChange={handleChange} required
                autoComplete={isLogin ? 'current-password' : 'new-password'} minLength={isLogin ? undefined : 8}
                className="w-full px-5 py-4 bg-white text-base text-gray-900 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#2D7A47]" />
              {!isLogin && (
                <p className="text-xs text-gray-500 mt-2">Mínimo 8 caracteres, con al menos una letra y un número.</p>
              )}
            </div>

            {error && (
              <p role="alert" className="text-sm font-bold text-[#991B1B] bg-[#FEE2E2] px-4 py-3 rounded-2xl">{error}</p>
            )}

            <button type="submit" disabled={loading}
              className="w-full py-5 bg-[#2D7A47] text-white font-bold text-lg rounded-full mt-4 active:scale-95 transition-transform disabled:opacity-60">
              {loading ? 'Un momento…' : isLogin ? 'Iniciar sesión' : 'Crear cuenta'}
            </button>
          </form>

          <button type="button" onClick={toggleMode} className="w-full text-center text-sm font-bold text-[#2D7A47]">
            {isLogin ? '¿No tienes cuenta? Regístrate gratis' : '¿Ya tienes cuenta? Inicia sesión'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default Auth;
