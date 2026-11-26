import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { TOKEN_KEY, getErrorMessage } from '../services/api';
import { cancelAllReminders } from '../services/notifications';

function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/users/me')
      .then(({ data }) => setUser(data.data))
      .catch((err) => setError(getErrorMessage(err)));
  }, []);

  const logout = async () => {
    await cancelAllReminders();
    localStorage.removeItem(TOKEN_KEY);
    navigate('/', { replace: true });
  };

  const initial = user?.name?.trim()?.charAt(0)?.toUpperCase() || '·';

  return (
    <div className="w-full px-6 pt-safe-12 animate-fade-in-up">
      <div className="mb-12">
        <h1 className="text-5xl font-black text-gray-900 tracking-tighter" style={{ fontFamily: "Fraunces, serif" }}>Perfil</h1>
      </div>

      {error && <p role="alert" className="mb-6 text-sm font-bold text-[#991B1B] bg-[#FEE2E2] px-5 py-4 rounded-3xl">{error}</p>}

      <div className="bg-white rounded-[40px] p-8 shadow-xl shadow-gray-200/50 flex flex-col items-center text-center mb-8">
        <div className="w-28 h-28 bg-gradient-to-br from-[#2D7A47] to-[#4CAF6B] text-white flex items-center justify-center font-black text-5xl rounded-[32px] mb-6 shadow-lg rotate-3" style={{ fontFamily: "Fraunces, serif" }}>
          {initial}
        </div>
        {user ? (
          <>
            <h2 className="text-2xl font-black text-gray-900 tracking-tight" style={{ fontFamily: "Fraunces, serif" }}>{user.name}</h2>
            <p className="text-base text-gray-500 mt-1 break-all">{user.email}</p>
            <p className="text-sm font-bold text-[#2D7A47] mt-3 bg-[#DCFCE7] px-4 py-1.5 rounded-full inline-block">
              Plan {user.typePlan === 'PREMIUM' ? 'Premium' : 'Gratuito'}
            </p>
          </>
        ) : !error && (
          <div className="space-y-2 w-full flex flex-col items-center">
            <div className="h-6 w-40 bg-gray-200 rounded-full animate-pulse" />
            <div className="h-4 w-52 bg-gray-100 rounded-full animate-pulse" />
          </div>
        )}
      </div>

      <button onClick={logout}
        className="w-full py-6 bg-[#FEE2E2] text-[#991B1B] font-black text-lg rounded-[32px] active:scale-95 transition-transform shadow-sm">
        Cerrar sesión
      </button>
    </div>
  );
}

export default Profile;
