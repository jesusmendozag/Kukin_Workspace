import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { IconHome, IconSearch, IconUser, IconLeaf } from './Icons';

function Layout({ children }) {
  const navigate = useNavigate();
  const currentPath = useLocation().pathname;

  const navItems = [
    { path: '/dashboard', icon: <IconHome />, label: 'Inicio' },
    { path: '/recipes', icon: <IconSearch />, label: 'Recetas' },
    { path: '/diets', icon: <IconLeaf />, label: 'Dietas' },
    { path: '/profile', icon: <IconUser />, label: 'Perfil' },
  ];

  return (
    <div className="min-h-screen bg-[#F7F3EE] flex flex-col font-sans text-gray-900 selection:bg-green-200">
      <main className="flex-1 w-full max-w-xl mx-auto relative pb-28">
        {children}
      </main>

      {/* Navegación App Nativa (Flotante) */}
      <nav className="fixed bottom-6 left-6 right-6 md:left-1/2 md:-translate-x-1/2 md:max-w-md bg-white/90 backdrop-blur-xl shadow-2xl rounded-full px-6 py-4 flex justify-between items-center z-50">
        {navItems.map((item) => {
          const isActive = currentPath === item.path;
          return (
            <button 
              key={item.path}
              onClick={() => navigate(item.path)}
              className="relative flex flex-col items-center gap-1 transition-transform active:scale-90"
            >
              <div className={`transition-colors duration-300 ${isActive ? "text-[#2D7A47]" : "text-gray-400"}`}>
                {item.icon}
              </div>
              <span className={`text-[10px] transition-all duration-300 ${isActive ? "font-black text-[#2D7A47]" : "font-semibold text-gray-400"}`}>
                {item.label}
              </span>
              {isActive && (
                <div className="absolute -top-3 w-1 h-1 bg-[#2D7A47] rounded-full animate-fade-in-up" />
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
}

export default Layout;