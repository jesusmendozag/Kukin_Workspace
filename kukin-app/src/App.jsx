import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { App as CapacitorApp } from '@capacitor/app';
import { StatusBar, Style } from '@capacitor/status-bar';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import AddIngredient from './pages/AddIngredient';
import Recipes from './pages/Recipes';
import RecipeDetail from './pages/RecipeDetail';
import Diets from './pages/Diets';
import Profile from './pages/Profile';
import Layout from './components/Layout';
import { TOKEN_KEY } from './services/api';

const isLoggedIn = () => Boolean(localStorage.getItem(TOKEN_KEY));

/** Solo deja pasar si hay sesión; si no, regresa al login. */
function Protected({ children, withLayout = true }) {
  if (!isLoggedIn()) return <Navigate to="/" replace />;
  return withLayout ? <Layout>{children}</Layout> : children;
}

/** Si ya hay sesión, el login manda directo a la alacena. */
function PublicOnly({ children }) {
  return isLoggedIn() ? <Navigate to="/dashboard" replace /> : children;
}

/** Integra el botón físico "atrás" de Android y la barra de estado del sistema. */
function NativeIntegration() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    // Sobre el verde del login y la foto de la receta: íconos blancos. Sobre el crema: oscuros.
    const overColor = location.pathname === '/' || location.pathname.startsWith('/recipe/');
    StatusBar.setStyle({ style: overColor ? Style.Dark : Style.Light }).catch(() => {});
  }, [location.pathname]);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return undefined;
    const rootScreens = ['/', '/dashboard'];
    const listener = CapacitorApp.addListener('backButton', () => {
      if (rootScreens.includes(location.pathname)) {
        CapacitorApp.exitApp();
      } else {
        navigate(-1);
      }
    });
    return () => {
      listener.then((l) => l.remove());
    };
  }, [location.pathname, navigate]);

  return null;
}

function App() {
  return (
    <BrowserRouter>
      <NativeIntegration />
      <Routes>
        <Route path="/" element={<PublicOnly><Auth /></PublicOnly>} />

        {/* Pantallas con menú de navegación inferior */}
        <Route path="/dashboard" element={<Protected><Dashboard /></Protected>} />
        <Route path="/add" element={<Protected withLayout={false}><AddIngredient /></Protected>} />
        <Route path="/recipes" element={<Protected><Recipes /></Protected>} />
        <Route path="/diets" element={<Protected><Diets /></Protected>} />
        <Route path="/profile" element={<Protected><Profile /></Protected>} />

        {/* Detalle de receta a pantalla completa. source = OWN | SPOONACULAR */}
        <Route path="/recipe/:source/:id" element={<Protected withLayout={false}><RecipeDetail /></Protected>} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
