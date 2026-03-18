
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ICONS } from '../constants';
import { storageService } from '../services/storageService';
import { Culto } from '../types';
import PaisBackground from '../components/PaisBackground';

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
    <div className="min-h-screen flex flex-col items-center p-6 pb-20 overflow-hidden relative">
      <PaisBackground />

      <header className="w-full max-w-lg mt-6 text-center space-y-6 animate-in fade-in slide-in-from-top-4 duration-700 relative z-10">
        <div className="inline-block transform hover:rotate-3 transition-transform bg-white p-4 rounded-[2rem] shadow-xl">
          <img 
            src="https://raw.githubusercontent.com/ieadmsumademats-hash/imagens/main/logokids.PNG" 
            alt="Logo IEADMS Kids" 
            className="w-24 h-24 object-contain" 
          />
        </div>
        <div className="space-y-1">
          <h1 className="kids-font text-3xl font-black text-white leading-tight drop-shadow-sm">Olá, Família!</h1>
          <p className="text-white/80 text-base font-medium px-4">Pronto para o Culto Kids de hoje?</p>
        </div>
      </header>

      {loading ? (
        <div className="mt-20 flex flex-col items-center gap-4 relative z-10">
          <div className="w-10 h-10 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="w-full max-w-lg mt-12 space-y-4 animate-in fade-in slide-in-from-bottom-6 duration-700 relative z-10">
          <button 
            onClick={() => navigate('/pais/pre-checkin')}
            disabled={!activeCulto}
            className={`w-full relative overflow-hidden p-6 rounded-[2rem] text-left transition-all transform active:scale-95 shadow-xl flex items-center justify-between border-b-6 ${
              activeCulto 
                ? 'bg-white text-purple-dark border-purple-200' 
                : 'bg-white/50 text-purple-dark/50 border-white/20 cursor-not-allowed grayscale'
            }`}
          >
            <div className="relative z-10 flex-1">
              <h2 className="text-2xl font-black mb-1 uppercase tracking-tighter">PRÉ-CHECK-IN</h2>
              <p className="text-xs font-bold opacity-80">Já cadastrado? Gere seu código.</p>
            </div>
            <div className={`p-4 rounded-2xl relative z-10 ${activeCulto ? 'bg-purple-main text-white' : 'bg-purple-main/20 text-white/50'}`}>{ICONS.QrCode}</div>
          </button>

          <button 
            onClick={() => navigate('/pais/cadastro')}
            className="w-full group relative overflow-hidden p-6 rounded-[2rem] text-left transition-all transform active:scale-95 shadow-xl flex items-center justify-between bg-white border-b-6 border-yellow-main"
          >
            <div className="relative z-10 flex-1">
              <h2 className="text-2xl font-black text-purple-dark mb-1 uppercase tracking-tighter">CADASTRAR CRIANÇA</h2>
              <p className="text-xs font-bold text-gray-text">Primeira vez conosco? Cadastre aqui.</p>
            </div>
            <div className="bg-yellow-main text-purple-dark p-4 rounded-2xl relative z-10">{ICONS.Plus}</div>
          </button>

          {!activeCulto && !error && (
            <div className="bg-white/10 backdrop-blur-sm text-white p-5 rounded-[1.5rem] border-2 border-dashed border-white/20 text-center">
               <p className="text-[10px] font-black uppercase tracking-widest opacity-90 italic">O check-in abre apenas no horário do culto.</p>
            </div>
          )}
        </div>
      )}

      <footer className="mt-auto pt-10 text-center relative z-10">
         <button onClick={() => navigate('/login')} className="text-white/40 text-[9px] font-black uppercase tracking-[0.2em] hover:text-white transition-colors">Acesso Administrativo</button>
      </footer>
    </div>
  );
};

export default PaisArea;
