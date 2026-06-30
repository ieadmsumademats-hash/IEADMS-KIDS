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

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = storageService.subscribeToActiveCulto((culto) => {
      setActiveCulto(culto);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const fetchActive = async () => {
      const culto = await storageService.getActiveCulto();
      setActiveCulto(culto);
    };
    fetchActive();
  }, [location.pathname]);

  const menuItems = [
    { label: 'Painel', path: '/', icon: ICONS.Dashboard },
    { label: 'Crianças', path: '/criancas', icon: ICONS.Baby },
    { label: 'Histórico', path: '/cultos', icon: ICONS.Calendar },
    { label: 'Estatísticas', path: '/estatisticas', icon: ICONS.BarChart },
  ];

  const currentMenuLabel = menuItems.find(m => m.path === location.pathname)?.label || 'Menu';

  if (!isAdmin || location.pathname.startsWith('/pais') || location.pathname === '/login') {
    return <div className="min-h-screen bg-transparent font-sans print:min-h-0 print:bg-transparent">{children}</div>;
  }

  return (
    <div className="min-h-screen bg-gray-light print:bg-transparent flex flex-col lg:flex-row print:block print:min-h-0">
      <aside className="print:hidden hidden lg:flex flex-col w-64 bg-purple-dark text-white sticky top-0 h-screen shadow-2xl z-40 transition-all duration-300">
        <div className="p-6 border-b border-purple-main/20 flex justify-start">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center transition-transform hover:scale-110">
              <img 
                src="https://raw.githubusercontent.com/ieadmsumademats-hash/imagens/main/logokids.PNG" 
                alt="Logo" 
                className="w-12 h-12 object-contain" 
              />
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
                title={item.label}
                className={`flex items-center justify-start gap-4 p-3 px-5 py-3.5 rounded-2xl transition-all duration-300 font-bold text-base ${
                  isActive 
                    ? 'bg-purple-main text-white shadow-lg scale-[1.02]' 
                    : 'text-white/70 hover:bg-white/5 hover:text-white'
                }`}
              >
                <span className={`${isActive ? 'text-yellow-main' : 'opacity-80'} transition-transform duration-300`}>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {activeCulto && (
          <div className="m-4 p-4 bg-green-500/10 border border-green-500/20 rounded-2xl flex flex-col items-stretch text-left">
            <div className="flex items-center justify-start gap-2 text-green-400 mb-1 text-[9px] font-black uppercase tracking-widest">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              <span>Culto Ativo</span>
            </div>
            <p className="text-xs font-black mb-3 text-white truncate">{activeCulto.tipo}</p>
            <button 
              onClick={() => navigate(`/cultos/ativo/${activeCulto.id}`)}
              title="Abrir Culto Ativo"
              className="w-full bg-green-600 hover:bg-green-500 text-white py-1.5 rounded-lg text-[9px] font-black transition-colors uppercase flex justify-center items-center"
            >
              <span>ABRIR</span>
            </button>
          </div>
        )}

        <button 
          onClick={onLogout}
          title="Sair"
          className="m-6 flex items-center justify-start gap-3 text-white/40 hover:text-red-400 transition-colors font-bold px-4 text-[10px]"
        >
          {ICONS.LogOut}
          <span>Sair</span>
        </button>
      </aside>

      <header className="print:hidden lg:hidden bg-purple-dark text-white p-3 flex items-center justify-between sticky top-0 z-40 shadow-xl">
        <div className="flex items-center gap-2">
          <div className="flex items-center">
            <img 
              src="https://raw.githubusercontent.com/ieadmsumademats-hash/imagens/main/logokids.PNG" 
              alt="Logo" 
              className="w-9 h-9 object-contain" 
            />
          </div>
          <span className="kids-font font-bold text-sm uppercase tracking-tight">IEADMS Kids</span>
        </div>
        <button onClick={onLogout} className="text-white/60 p-1 scale-90">{ICONS.LogOut}</button>
      </header>

      <main className="flex-1 pb-10 max-w-[1400px] mx-auto w-full print:p-0 print:m-0 print:max-w-none print:w-auto relative">
        <div className="print:hidden lg:hidden p-4 pb-0 z-30">
          <button 
            onClick={() => setIsMobileMenuOpen(true)}
            aria-label="Abrir menu"
            className="w-full bg-purple-main text-white font-black py-4 px-4 rounded-2xl shadow-md flex items-center justify-center gap-2 uppercase tracking-widest text-xs active:scale-95 transition-transform"
          >
            <span>{currentMenuLabel}</span>
            <span className="opacity-80 scale-75">▼</span>
          </button>
        </div>

        <div className="p-4 md:p-6 w-full">
          {children}
        </div>
      </main>

      {isMobileMenuOpen && (
        <div className="print:hidden lg:hidden fixed inset-0 z-50 bg-purple-dark/95 backdrop-blur-sm flex flex-col p-4 overflow-y-auto">
          <div className="flex justify-end mb-6">
            <button 
              onClick={() => setIsMobileMenuOpen(false)}
              className="bg-white/10 text-white w-10 h-10 rounded-full flex items-center justify-center font-bold"
            >
              X
            </button>
          </div>
          <div className="grid grid-cols-2 gap-4 auto-rows-fr">
            {menuItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex flex-col items-center justify-center gap-3 p-6 rounded-3xl transition-all shadow-lg ${
                    isActive 
                      ? 'bg-purple-main text-white border-2 border-yellow-main' 
                      : 'bg-white text-purple-dark hover:bg-gray-100'
                  }`}
                >
                  <div className={`scale-150 ${isActive ? 'text-yellow-main' : 'text-purple-main'}`}>
                    {item.icon}
                  </div>
                  <span className="text-[11px] font-black uppercase tracking-tight text-center">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {activeCulto && (
        <div className="print:hidden lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-green-500 text-white text-center py-1 text-[9px] font-black uppercase tracking-widest shadow-[0_-2px_10px_rgba(0,0,0,0.1)]">
          CULTO ATIVO
        </div>
      )}
    </div>
  );
};

export default Layout;