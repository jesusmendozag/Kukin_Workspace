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
    <div className="min-h-screen bg-[#F7F3EE] flex flex-col font-sans text-gray-900">
      <main className="flex-1 w-full max-w-md mx-auto relative pb-32">
        {children}
      </main>

      {/* Navegación Sólida y Accesible (Sin Glassmorphism) */}
      <nav className="fixed bottom-6 left-6 right-6 md:left-1/2 md:-translate-x-1/2 md:w-full md:max-w-md bg-white shadow-[0_20px_40px_-15px_rgba(0,0,0,0.15)] rounded-[40px] px-6 py-4 flex justify-between items-center z-50">
        {navItems.map((item) => {
          const isActive = currentPath === item.path;
          return (
            <button 
              key={item.path}
              onClick={() => navigate(item.path)}
              className="relative flex flex-col items-center gap-1 transition-transform duration-300 active:scale-90 w-16"
            >
              <div className={`transition-all duration-300 ${isActive ? "text-[#2D7A47] -translate-y-1" : "text-gray-400 hover:text-gray-600"}`}>
                {item.icon}
              </div>
              <span className={`text-[10px] transition-all duration-300 absolute -bottom-1 ${isActive ? "font-black text-[#2D7A47] opacity-100" : "font-semibold text-gray-400 opacity-0"}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}

export default Layout;