
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
    const unsubscribe = storageService.subscribeToActiveCulto((culto) => {
      setActiveCulto(culto);
    });
    return () => unsubscribe();
  }, []);

  const menuItems = [
    { label: 'Painel', path: '/', icon: ICONS.Dashboard },
    { label: 'Crianças', path: '/criancas', icon: ICONS.Baby },
    { label: 'Histórico', path: '/cultos', icon: ICONS.Calendar },
    { label: 'Estatísticas', path: '/estatisticas', icon: ICONS.BarChart },
  ];

  const isAtivoPage = location.pathname.includes('/cultos/ativo');

  if (!isAdmin || location.pathname.startsWith('/pais') || location.pathname === '/login') {
    return <div className="min-h-screen bg-gray-light font-sans">{children}</div>;
  }

  return (
    <div className="min-h-screen bg-gray-light flex flex-col md:flex-row">
      <aside className="hidden md:flex flex-col w-64 bg-purple-dark text-white sticky top-0 h-screen shadow-2xl z-40">
        <div className="p-6 border-b border-purple-main/20">
          <div className="flex items-center gap-3">
            <div className="bg-white p-2 rounded-lg shadow-lg">
              <img src="https://api.dicebear.com/7.x/shapes/svg?seed=ieadms" alt="Logo" className="w-6 h-6" />
            </div>
            <div>
              <h1 className="kids-font text-xl font-bold leading-tight text-white">IEADMS</h1>
              <span className="text-yellow-main font-black tracking-widest text-[10px] uppercase">Culto Kids</span>
            </div>
          </div>
        </div>

        <nav className="flex-1 py-6 px-4 space-y-2">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-4 px-5 py-3.5 rounded-2xl transition-all duration-300 font-bold text-sm lg:text-base ${
                  isActive 
                    ? 'bg-purple-main text-white shadow-lg scale-[1.02]' 
                    : 'text-white/70 hover:bg-white/5 hover:text-white'
                }`}
              >
                <span className={`${isActive ? 'text-yellow-main' : 'opacity-80'} transition-transform duration-300`}>{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        {activeCulto && (
          <div className="m-4 p-4 bg-green-500/10 border border-green-500/20 rounded-2xl">
            <div className="flex items-center gap-2 text-green-400 mb-1 text-[9px] font-black uppercase tracking-widest">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              Culto Ativo
            </div>
            <p className="text-xs font-black mb-3 text-white truncate">{activeCulto.tipo}</p>
            <button 
              onClick={() => navigate(`/cultos/ativo/${activeCulto.id}`)}
              className="w-full bg-green-600 hover:bg-green-500 text-white py-1.5 rounded-lg text-[9px] font-black transition-colors uppercase"
            >
              ABRIR
            </button>
          </div>
        )}

        <button 
          onClick={onLogout}
          className="m-6 flex items-center gap-3 text-white/40 hover:text-red-400 transition-colors font-bold px-4 text-[10px]"
        >
          {ICONS.LogOut}
          <span>Sair</span>
        </button>
      </aside>

      <header className="md:hidden bg-purple-dark text-white p-3 flex items-center justify-between sticky top-0 z-50 shadow-xl">
        <div className="flex items-center gap-2">
          <img src="https://api.dicebear.com/7.x/shapes/svg?seed=ieadms" alt="Logo" className="w-5 h-5 bg-white p-0.5 rounded" />
          <span className="kids-font font-bold text-sm uppercase tracking-tight">IEADMS Kids</span>
        </div>
        <button onClick={onLogout} className="text-white/60 p-1 scale-90">{ICONS.LogOut}</button>
      </header>

      <main className="flex-1 p-4 md:p-6 pb-20 md:pb-6 max-w-[1400px] mx-auto w-full">
        {children}
      </main>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 flex justify-around py-2 px-2 z-50 shadow-[0_-5px_15px_rgba(0,0,0,0.05)]">
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
              <div className="scale-75">{item.icon}</div>
              <span className="text-[8px] font-black uppercase tracking-tight">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
};

export default Layout;
