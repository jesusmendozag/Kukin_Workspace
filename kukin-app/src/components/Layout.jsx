import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { IconHome, IconSearch, IconUser, IconLeaf } from './Icons';

function Layout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;

  const navItems = [
    { path: '/dashboard', icon: <IconHome />, label: 'Inicio' },
    { path: '/recipes', icon: <IconSearch />, label: 'Recetas' },
    { path: '/diets', icon: <IconLeaf />, label: 'Dietas' },
    { path: '/profile', icon: <IconUser />, label: 'Perfil' },
  ];

  return (
    <div className="min-h-screen bg-[#F7F3EE] flex flex-col font-sans">
      
      {/* 🖥️ TOP NAV PARA ESCRITORIO (Estilo Partake Foods) */}
      <nav className="hidden md:flex items-center justify-between px-12 py-6 bg-[#FDF8F0] border-b border-gray-200/50 sticky top-0 z-50">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/dashboard')}>
          <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center text-green-800">
            <IconLeaf />
          </div>
          <span className="text-2xl font-black text-gray-900 tracking-tight" style={{ fontFamily: "Fraunces, serif" }}>
            Kukin
          </span>
        </div>

        <div className="flex items-center gap-8">
          {navItems.map((item) => (
            <button 
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`text-sm font-bold tracking-wide transition-colors ${
                currentPath === item.path ? 'text-[#2D7A47]' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-4">
          <button className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-colors">
            <IconUser />
          </button>
        </div>
      </nav>

      {/* CONTENIDO DINÁMICO (Aquí se inyectan tus pantallas) */}
      <main className="flex-1 w-full max-w-7xl mx-auto md:px-12 relative pb-24 md:pb-10">
        {children}
      </main>

      {/* 📱 BOTTOM NAV PARA MÓVIL (Estilo App Nativa) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-gray-100 px-6 py-4 flex justify-around items-center z-50 pb-safe">
        {navItems.map((item) => {
          const isActive = currentPath === item.path;
          return (
            <button 
              key={item.path}
              onClick={() => navigate(item.path)}
              className="flex flex-col items-center gap-1.5 transition-transform active:scale-95"
            >
              <div className={isActive ? "text-[#2D7A47]" : "text-gray-400"}>
                {item.icon}
              </div>
              <span className={`text-[10px] ${isActive ? "font-bold text-[#2D7A47]" : "font-medium text-gray-400"}`}>
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