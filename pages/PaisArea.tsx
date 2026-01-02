
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ICONS } from '../constants';
import { storageService } from '../services/storageService';
import { Culto } from '../types';

const PaisArea: React.FC = () => {
  const navigate = useNavigate();
  const [activeCulto, setActiveCulto] = useState<Culto | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = storageService.subscribeToActiveCulto((culto) => {
      setActiveCulto(culto);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  return (
    <div className="min-h-screen bg-gray-light flex flex-col items-center p-6 pb-20 overflow-hidden">
      {/* Background Shapes */}
      <div className="fixed top-[-100px] right-[-100px] w-80 h-80 bg-purple-main/5 rounded-full blur-3xl -z-10" />
      <div className="fixed bottom-[-50px] left-[-50px] w-60 h-60 bg-yellow-main/5 rounded-full blur-3xl -z-10" />

      <header className="w-full max-w-lg mt-10 text-center space-y-8 animate-in fade-in slide-in-from-top-4 duration-700">
        <div className="inline-block bg-white p-6 rounded-[2.5rem] shadow-2xl transform hover:rotate-6 transition-transform group">
          <img src="https://api.dicebear.com/7.x/shapes/svg?seed=kids" alt="Fun" className="w-24 h-24 group-hover:scale-110 transition-transform" />
        </div>
        <div className="space-y-2">
          <h1 className="kids-font text-5xl font-black text-purple-dark">Seja Bem-vindo!</h1>
          <p className="text-gray-text text-lg font-medium px-4">Culto Kids IEADMS - Cuidando do que Deus te deu de mais precioso.</p>
        </div>
      </header>

      {loading ? (
        <div className="mt-20 text-purple-main font-bold">Verificando cultos...</div>
      ) : (
        <div className="w-full max-w-lg mt-16 space-y-6 animate-in fade-in slide-in-from-bottom-6 duration-700">
          <button 
            onClick={() => navigate('/pais/pre-checkin')}
            disabled={!activeCulto}
            className={`w-full group relative overflow-hidden p-8 rounded-[2.5rem] text-left transition-all transform active:scale-95 shadow-xl flex items-center justify-between border-b-8 ${
              activeCulto 
                ? 'bg-purple-main text-white border-purple-dark hover:-translate-y-1' 
                : 'bg-gray-200 text-gray-400 border-gray-300 cursor-not-allowed grayscale'
            }`}
          >
            <div className="relative z-10 flex-1">
              <h2 className="text-3xl font-black mb-1 uppercase tracking-tighter text-white">PRÉ-CHECK-IN</h2>
              <p className="text-sm font-bold opacity-80 max-w-[200px] text-white">Já possui cadastro? Gere seu código rápido.</p>
            </div>
            <div className="bg-white/20 p-5 rounded-3xl relative z-10 text-white">{ICONS.QrCode}</div>
            <div className="absolute right-[-20px] top-[-20px] bg-white/5 w-32 h-32 rounded-full group-hover:scale-150 transition-transform" />
          </button>

          <button 
            onClick={() => navigate('/pais/cadastro')}
            className="w-full group relative overflow-hidden p-8 rounded-[2.5rem] text-left transition-all transform active:scale-95 shadow-xl flex items-center justify-between bg-white border-b-8 border-yellow-main hover:-translate-y-1"
          >
            <div className="relative z-10 flex-1">
              <h2 className="text-3xl font-black text-purple-dark mb-1 uppercase tracking-tighter">CADASTRO</h2>
              <p className="text-sm font-bold text-gray-text max-w-[200px]">Primeira vez conosco? Cadastre seu filho.</p>
            </div>
            <div className="bg-yellow-main text-purple-dark p-5 rounded-3xl relative z-10">{ICONS.Plus}</div>
          </button>

          {!activeCulto && (
            <div className="bg-red-50 text-red-500 p-6 rounded-[2rem] border-2 border-dashed border-red-200 text-center animate-in zoom-in duration-500">
               <p className="text-sm font-black uppercase tracking-widest">Portões Fechados</p>
               <p className="text-xs font-bold opacity-80 mt-1">O check-in só fica disponível durante o horário dos cultos.</p>
            </div>
          )}
        </div>
      )}

      <footer className="mt-auto pt-16 text-center space-y-4">
         <div className="bg-white px-6 py-2 rounded-full shadow-sm text-[10px] font-black uppercase tracking-widest text-purple-main border border-gray-100">IEADMS Sede Campo Grande</div>
         <button onClick={() => navigate('/login')} className="text-gray-300 text-[10px] font-bold uppercase tracking-widest hover:text-purple-main transition-colors">Acesso Administrativo</button>
      </footer>
    </div>
  );
};

export default PaisArea;
