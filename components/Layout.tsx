
import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ICONS } from '../constants';
import { storageService } from '../services/storageService';
import { Culto } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  isAdmin: boolean;
  onLogout: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, isAdmin, onLogout }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeCulto, setActiveCulto] = useState<Culto | null>(null);

  useEffect(() => {
    if (isAdmin) {
      const unsubscribe = storageService.subscribeToActiveCulto((culto) => {
        setActiveCulto(culto);
      });
      return () => unsubscribe();
    }
  }, [isAdmin]);

  const menuItems = [
    { label: 'Painel', path: '/', icon: ICONS.Dashboard },
    { label: 'Crianças', path: '/criancas', icon: ICONS.Baby },
    { label: 'Histórico', path: '/cultos', icon: ICONS.Calendar },
    { label: 'Estatísticas', path: '/estatisticas', icon: ICONS.BarChart },
  ];

  if (!isAdmin || location.pathname.startsWith('/pais') || location.pathname === '/login') {
    return <div className="min-h-screen bg-gray-light font-sans">{children}</div>;
  }

  return (
    <div className="min-h-screen bg-gray-light flex flex-col md:flex-row">
      <aside className="hidden md:flex flex-col w-60 bg-purple-dark text-white sticky top-0 h-screen shadow-2xl z-40">
        <div className="p-5 border-b border-purple-main/20">
          <div className="flex items-center gap-3">
            <div className="bg-white p-1.5 rounded-xl shadow-lg">
              <img src="https://api.dicebear.com/7.x/shapes/svg?seed=ieadms" alt="Logo" className="w-8 h-8" />
            </div>
            <div>
              <h1 className="kids-font text-lg font-bold leading-tight text-white">IEADMS</h1>
              <span className="text-yellow-main font-black tracking-widest text-[10px] uppercase">Culto Kids</span>
            </div>
          </div>
        </div>

        <nav className="flex-1 py-6 px-3 space-y-1">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 font-bold text-sm ${
                  isActive 
                    ? 'bg-purple-main text-white shadow-lg translate-x-1' 
                    : 'text-purple-light hover:bg-purple-main/10 hover:text-white'
                }`}
              >
                <span className={isActive ? 'text-yellow-main' : ''}>{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        {activeCulto && (
          <div className="m-4 p-4 bg-green-500/10 border border-green-500/30 rounded-2xl">
            <div className="flex items-center gap-2 text-green-400 mb-1">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
              <span className="text-[9px] font-black uppercase tracking-widest">Culto Ativo</span>
            </div>
            <p className="text-xs font-black mb-2 text-white truncate">{activeCulto.tipo}</p>
            <button 
              onClick={() => navigate(`/cultos/ativo/${activeCulto.id}`)}
              className="w-full bg-green-600 hover:bg-green-500 text-white py-1.5 rounded-lg text-[10px] font-bold transition-colors"
            >
              GERENCIAR
            </button>
          </div>
        )}

        <button 
          onClick={onLogout}
          className="m-6 flex items-center gap-2 text-red-400 hover:text-red-300 transition-colors font-bold px-4 text-xs"
        >
          {ICONS.LogOut}
          <span>Sair</span>
        </button>
      </aside>

      <header className="md:hidden bg-purple-dark text-white p-4 flex items-center justify-between sticky top-0 z-50 shadow-xl">
        <div className="flex items-center gap-2">
          <div className="bg-white p-1 rounded-lg">
            <img src="https://api.dicebear.com/7.x/shapes/svg?seed=ieadms" alt="Logo" className="w-6 h-6" />
          </div>
          <span className="kids-font font-bold text-md">IEADMS Kids</span>
        </div>
        <button onClick={onLogout} className="text-red-400 p-2">{ICONS.LogOut}</button>
      </header>

      <main className="flex-1 p-4 md:p-8 pb-20 md:pb-8 max-w-[1200px] mx-auto w-full">
        {children}
      </main>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 flex justify-around py-2 px-4 z-50 shadow-[0_-5px_15px_rgba(0,0,0,0.05)]">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center gap-0.5 transition-colors ${
                isActive ? 'text-purple-main' : 'text-gray-400'
              }`}
            >
              {item.icon}
              <span className="text-[9px] font-black uppercase tracking-tight">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
};

export default Layout;
