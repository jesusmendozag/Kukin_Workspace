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
      // Cuenta nueva: directo a llenar la alacena tocando ingredientes
      navigate(isLogin ? '/dashboard' : '/add', { replace: true });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => { setIsLogin(!isLogin); setError(''); };

  return (
    <div className="min-h-dvh flex flex-col bg-sand animate-fade-in-up">
      {/* Bloque de marca verde, compacto, que llega detrás de la barra de estado */}
      <div className="bg-basil text-white rounded-b-[40px] pt-safe">
        <div className="px-7 pt-6 pb-9 max-w-md mx-auto w-full">
          <div className="flex items-center gap-3">
            <IconLeaf className="w-10 h-10" />
            <p className="font-display font-black text-[2.6rem] leading-none tracking-tighter">Kukin</p>
          </div>
          <p className="mt-3 text-[1.1rem] font-semibold text-white/90">
            Convierte lo que tienes en casa en platillos extraordinarios.
          </p>
        </div>
      </div>

      <main className="flex-1 px-7 pt-8 pb-[calc(var(--safe-bottom)+2rem)] w-full max-w-md mx-auto">
        <h1 className="font-display font-black text-navy text-[2.1rem] leading-tight tracking-tight">
          {isLogin ? 'Bienvenido a Kukin.' : 'Comienza tu viaje.'}
        </h1>
        <p className="text-soft mt-1 mb-7">
          {isLogin ? 'Inicia sesión para ver tu alacena.' : 'Regístrate gratis y reduce el desperdicio.'}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label htmlFor="name" className="label-micro mb-2 block">Nombre</label>
              <input id="name" type="text" name="name" value={formData.name} onChange={handleChange} required
                autoComplete="name" enterKeyHint="next" className="field" />
            </div>
          )}
          <div>
            <label htmlFor="email" className="label-micro mb-2 block">Correo electrónico</label>
            <input id="email" type="email" name="email" value={formData.email} onChange={handleChange} required
              autoComplete="email" inputMode="email" autoCapitalize="none" enterKeyHint="next" className="field" />
          </div>
          <div>
            <label htmlFor="password" className="label-micro mb-2 block">Contraseña</label>
            <input id="password" type="password" name="password" value={formData.password} onChange={handleChange} required
              autoComplete={isLogin ? 'current-password' : 'new-password'} minLength={isLogin ? undefined : 8}
              enterKeyHint="go" className="field" />
            {!isLogin && <p className="text-[0.9rem] text-soft mt-2">Mínimo 8 caracteres, con al menos una letra y un número.</p>}
          </div>

          {error && (
            <p role="alert" className="font-bold text-alert bg-alert-bg px-5 py-3.5 rounded-[20px]">{error}</p>
          )}

          <button type="submit" disabled={loading}
            className="w-full min-h-14 mt-2 rounded-full bg-basil text-white font-bold text-[1.1rem] active:scale-95 transition-transform disabled:opacity-60">
            {loading ? 'Un momento…' : isLogin ? 'Iniciar sesión' : 'Crear cuenta'}
          </button>
        </form>

        <button type="button" onClick={toggleMode} className="mt-5 w-full min-h-12 font-bold text-basil">
          {isLogin ? '¿No tienes cuenta? Regístrate gratis' : '¿Ya tienes cuenta? Inicia sesión'}
        </button>
      </main>
    </div>
  );
}

export default Auth;
