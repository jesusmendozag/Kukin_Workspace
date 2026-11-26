import { NavLink } from 'react-router-dom';
import { IconHome, IconPot, IconLeaf, IconUser } from './Icons';

const NAV_ITEMS = [
  { path: '/dashboard', Icon: IconHome, label: 'Inicio' },
  { path: '/recipes', Icon: IconPot, label: 'Recetas' },
  { path: '/diets', Icon: IconLeaf, label: 'Dietas' },
  { path: '/profile', Icon: IconUser, label: 'Perfil' },
];

/** Pantallas principales con la barra de navegación flotante (se oculta mientras se escribe). */
function Layout({ children }) {
  return (
    <div className="min-h-dvh flex flex-col">
      <div className="status-scrim" aria-hidden="true" />
      <main className="flex-1 w-full max-w-xl mx-auto pb-nav">{children}</main>

      <nav aria-label="Navegación principal"
        className="hide-on-keyboard fixed bottom-nav left-4 right-4 z-40 mx-auto max-w-md bg-white rounded-full shadow-[0_10px_30px_-8px_rgb(11_30_54/0.25)]">
        <ul className="flex px-2 py-1.5">
          {NAV_ITEMS.map(({ path, Icon, label }) => (
            <li key={path} className="flex-1">
              <NavLink to={path}
                className="min-h-14 flex flex-col items-center justify-center gap-0.5 rounded-full active:scale-90 transition-transform">
                {({ isActive }) => (
                  <>
                    <Icon className={`w-6 h-6 ${isActive ? 'text-basil' : 'text-soft'}`} />
                    <span className={`text-[0.78rem] ${isActive ? 'font-black text-basil' : 'font-semibold text-soft'}`}>{label}</span>
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}

export default Layout;
