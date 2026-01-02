
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ICONS } from '../constants';
import { storageService } from '../services/storageService';
import { Culto } from '../types';

const PaisArea: React.FC = () => {
  const navigate = useNavigate();
  const [activeCulto, setActiveCulto] = useState<Culto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    try {
      unsubscribe = storageService.subscribeToActiveCulto((culto) => {
        setActiveCulto(culto);
        setLoading(false);
        setError(null);
      });
    } catch (e) {
      setLoading(false);
      setError("Erro de conexão com o servidor.");
    }
    return () => { if (unsubscribe) unsubscribe(); };
  }, []);

  return (
    <div className="min-h-screen bg-gray-light flex flex-col items-center p-6 pb-20 overflow-hidden">
      <div className="fixed top-[-100px] right-[-100px] w-80 h-80 bg-purple-main/5 rounded-full blur-3xl -z-10" />
      <div className="fixed bottom-[-50px] left-[-50px] w-60 h-60 bg-yellow-main/5 rounded-full blur-3xl -z-10" />

      <header className="w-full max-w-lg mt-6 text-center space-y-6 animate-in fade-in slide-in-from-top-4 duration-700">
        <div className="inline-block bg-white p-4 rounded-[2rem] shadow-xl transform hover:rotate-3 transition-transform">
          <img src="https://api.dicebear.com/7.x/shapes/svg?seed=kids" alt="Fun" className="w-16 h-16" />
        </div>
        <div className="space-y-1">
          <h1 className="kids-font text-3xl font-black text-purple-dark leading-tight">Olá, Família!</h1>
          <p className="text-gray-text text-base font-medium px-4 opacity-80">Pronto para o Culto Kids de hoje?</p>
        </div>
      </header>

      {loading ? (
        <div className="mt-20 flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-purple-main border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="w-full max-w-lg mt-12 space-y-4 animate-in fade-in slide-in-from-bottom-6 duration-700">
          <button 
            onClick={() => navigate('/pais/pre-checkin')}
            disabled={!activeCulto}
            className={`w-full relative overflow-hidden p-6 rounded-[2rem] text-left transition-all transform active:scale-95 shadow-xl flex items-center justify-between border-b-6 ${
              activeCulto 
                ? 'bg-purple-main text-white border-purple-dark' 
                : 'bg-gray-200 text-gray-400 border-gray-300 cursor-not-allowed grayscale'
            }`}
          >
            <div className="relative z-10 flex-1">
              <h2 className="text-2xl font-black mb-1 uppercase tracking-tighter text-white">PRÉ-CHECK-IN</h2>
              <p className="text-xs font-bold opacity-80 text-white">Já cadastrado? Gere seu código.</p>
            </div>
            <div className="bg-white/20 p-4 rounded-2xl relative z-10 text-white">{ICONS.QrCode}</div>
          </button>

          <button 
            onClick={() => navigate('/pais/cadastro')}
            className="w-full group relative overflow-hidden p-6 rounded-[2rem] text-left transition-all transform active:scale-95 shadow-xl flex items-center justify-between bg-white border-b-6 border-yellow-main"
          >
            <div className="relative z-10 flex-1">
              <h2 className="text-2xl font-black text-purple-dark mb-1 uppercase tracking-tighter">CRIAR CONTA</h2>
              <p className="text-xs font-bold text-gray-text">Primeira vez conosco? Cadastre aqui.</p>
            </div>
            <div className="bg-yellow-main text-purple-dark p-4 rounded-2xl relative z-10">{ICONS.Plus}</div>
          </button>

          {!activeCulto && !error && (
            <div className="bg-red-50 text-red-500 p-5 rounded-[1.5rem] border-2 border-dashed border-red-200 text-center">
               <p className="text-[10px] font-black uppercase tracking-widest opacity-80 italic">O check-in abre apenas no horário do culto.</p>
            </div>
          )}
        </div>
      )}

      <footer className="mt-auto pt-10 text-center">
         <button onClick={() => navigate('/login')} className="text-gray-300 text-[9px] font-black uppercase tracking-[0.2em] hover:text-purple-main transition-colors">Acesso Administrativo</button>
      </footer>
    </div>
  );
};

export default PaisArea;
