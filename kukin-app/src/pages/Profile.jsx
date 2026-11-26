import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { TOKEN_KEY, clearOfflineCache, getErrorMessage } from '../services/api';
import { cancelAllReminders } from '../services/notifications';
import { clearShoppingList } from '../services/shoppingList';
import { IconLogout } from '../components/Icons';
import { PageTitle, ErrorBox } from '../components/ui';

function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [error, setError] = useState('');
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    api.get('/users/me')
      .then(({ data }) => setUser(data.data))
      .catch((err) => setError(getErrorMessage(err)));
  }, []);

  const logout = async () => {
    await cancelAllReminders();
    clearShoppingList();
    localStorage.removeItem(TOKEN_KEY);
    clearOfflineCache();
    localStorage.removeItem('kukin-diet-goal');
    navigate('/', { replace: true });
  };

  const initial = user?.name?.trim()?.charAt(0)?.toUpperCase() || '·';

  return (
    <div className="animate-fade-in-up">
      <PageTitle title="Tú" />

      <div className="px-5 space-y-5">
        <ErrorBox message={error} />

        <div className="bg-white rounded-[40px] p-8 shadow-[0_12px_30px_-14px_rgb(11_30_54/0.25)] flex flex-col items-center text-center">
          <div className="w-28 h-28 bg-gradient-to-br from-basil to-[#4CAF6B] text-white flex items-center justify-center font-display font-black text-5xl rounded-[32px] mb-6 shadow-lg rotate-3 active:rotate-0 transition-transform" aria-hidden="true">
            {initial}
          </div>
          {user ? (
            <>
              <h2 className="font-display font-black text-navy text-[1.7rem] tracking-tight">{user.name}</h2>
              <p className="text-soft mt-1 break-all">{user.email}</p>
              <p className="mt-4 rounded-full bg-fresh-bg text-fresh px-4 py-1.5 font-bold">
                Plan {user.typePlan === 'PREMIUM' ? 'Premium' : 'Gratuito'}
              </p>
            </>
          ) : !error && (
            <div className="space-y-2 w-full flex flex-col items-center" aria-busy="true">
              <div className="h-6 w-40 bg-hairline rounded-full animate-pulse" />
              <div className="h-4 w-52 bg-hairline/70 rounded-full animate-pulse" />
            </div>
          )}
        </div>

        {confirming ? (
          <div className="bg-alert-bg rounded-[32px] p-5">
            <p className="font-display font-black text-alert text-[1.3rem] mb-4">¿Seguro que quieres salir?</p>
            <div className="flex gap-3">
              <button type="button" onClick={() => setConfirming(false)}
                className="flex-1 min-h-14 rounded-full bg-white font-bold active:scale-95 transition-transform">No, quedarme</button>
              <button type="button" onClick={logout}
                className="flex-1 min-h-14 rounded-full bg-alert text-white font-bold active:scale-95 transition-transform">Sí, salir</button>
            </div>
          </div>
        ) : (
          <button type="button" onClick={() => setConfirming(true)}
            className="w-full min-h-16 bg-alert-bg text-alert font-black text-[1.1rem] rounded-[32px] flex items-center justify-center gap-2 active:scale-95 transition-transform">
            <IconLogout className="w-6 h-6" /> Cerrar sesión
          </button>
        )}
      </div>
    </div>
  );
}

export default Profile;
