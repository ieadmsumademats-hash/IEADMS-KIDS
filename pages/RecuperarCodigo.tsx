import React, { useState, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { ICONS } from '../constants';
import { formatPhone, normalizePhone } from '../utils';
import { storageService } from '../services/storageService';
import { Culto, Crianca, PreCheckIn } from '../types';
import PaisBackground from '../components/PaisBackground';
import { globalProgress } from '../components/GlobalProgress';

const RecuperarCodigo: React.FC = () => {
  const navigate = useNavigate();
  const [activeCulto, setActiveCulto] = useState<Culto | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [phoneSearch, setPhoneSearch] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [recoveredKids, setRecoveredKids] = useState<{crianca: Crianca, codigo: string}[]>([]);
  const [noPreCheckinModal, setNoPreCheckinModal] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      const culto = await storageService.getActiveCulto();
      setActiveCulto(culto);
      setLoading(false);
    };
    loadData();
  }, []);

  const handlePhoneSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCulto) return;
    
    const digits = normalizePhone(phoneSearch);
    if (digits.length < 10) {
      alert('Telefone do responsável está incompleto.');
      return;
    }

    setIsProcessing(true);
    globalProgress.start('Validando...');
    
    try {
      const formatted = formatPhone(phoneSearch);
      
      const [linkedKids, preCheckins] = await Promise.all([
        storageService.getCriancasByPhone(formatted),
        storageService.getPreCheckins()
      ]);
      
      const kidsWithCode: {crianca: Crianca, codigo: string}[] = [];
      
      linkedKids.forEach(kid => {
        const pre = preCheckins.find(p => p.idCrianca === kid.id && p.idCulto === activeCulto.id);
        if (pre) {
          kidsWithCode.push({ crianca: kid, codigo: pre.codigo });
        }
      });
      
      if (kidsWithCode.length > 0) {
        setRecoveredKids(kidsWithCode);
        setHasSearched(true);
      } else {
        setNoPreCheckinModal(true);
      }
    } catch (e) {
      alert("Erro ao consultar telefone.");
    } finally {
      setIsProcessing(false);
      globalProgress.stop();
    }
  };

  if (loading) return <div className="text-center py-20 text-white font-bold text-xs bg-purple-main min-h-screen">CARREGANDO...</div>;
  if (!activeCulto) return <Navigate to="/pais" />;

  return (
    <div className="min-h-screen p-4 flex flex-col items-center relative overflow-hidden">
      <PaisBackground />
      <div className="w-full max-w-lg relative z-10">
        <button onClick={() => navigate('/pais')} className="mb-6 mt-2 flex items-center gap-2 text-white font-black uppercase text-[10px] tracking-widest hover:text-yellow-main transition-colors">
          {ICONS.ArrowLeft} Voltar
        </button>

        {noPreCheckinModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-purple-dark/80 backdrop-blur-sm">
            <div className="bg-white w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl text-center animate-in zoom-in duration-300">
              <div className="bg-red-100 text-red-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 text-2xl">
                ⚠️
              </div>
              <h2 className="text-xl font-black text-purple-dark mb-4 uppercase">Ops!</h2>
              <p className="text-gray-text font-bold mb-8 text-sm">Não há pré-check-in realizado para esse número. Faça o pré-check-in.</p>
              <button 
                onClick={() => setNoPreCheckinModal(false)}
                className="w-full bg-purple-main text-white font-black py-4 rounded-[2rem] shadow-xl text-xs uppercase tracking-widest hover:bg-purple-dark transition-colors"
              >
                TENTAR NOVAMENTE
              </button>
            </div>
          </div>
        )}

        {!hasSearched ? (
          <div className="bg-white rounded-[2.5rem] p-8 shadow-2xl border-b-8 border-yellow-main animate-in slide-in-from-right duration-500">
             <h2 className="kids-font text-3xl font-black text-purple-dark mb-2 uppercase tracking-tight">Recuperar Código</h2>
             <p className="text-gray-text text-sm font-bold mb-8 opacity-70 uppercase">Telefone do responsável</p>
             <form onSubmit={handlePhoneSearch}>
               <div className="relative mb-6">
                  <span className="absolute left-5 top-1/2 -translate-y-1/2 text-purple-main/50">📱</span>
                  <input 
                    type="tel" 
                    inputMode="tel"
                    required
                    placeholder="(67) 99999-9999" 
                    value={phoneSearch} 
                    onChange={(e) => setPhoneSearch(formatPhone(e.target.value))} 
                    className="w-full pl-14 pr-5 py-4 rounded-[2rem] bg-gray-50 border-2 border-gray-200 focus:bg-white focus:border-purple-main focus:ring-4 focus:ring-purple-100 outline-none font-bold text-base transition-all shadow-inner" 
                  />
               </div>
               <button 
                 type="submit"
                 disabled={isProcessing}
                 className="w-full bg-purple-main text-white font-black py-5 rounded-[2rem] shadow-xl text-sm uppercase tracking-widest hover:bg-purple-dark transition-all disabled:opacity-50"
               >
                 {isProcessing ? 'Validando...' : 'AVANÇAR'}
               </button>
             </form>
          </div>
        ) : (
          <div className="bg-white rounded-[2.5rem] p-8 md:p-12 shadow-2xl text-center animate-in zoom-in duration-500 relative overflow-hidden border-b-8 border-yellow-main">
             <div className="bg-green-100 text-green-600 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl shadow-inner border-4 border-green-200">
                {ICONS.CheckCircle}
             </div>
             <h2 className="kids-font text-4xl font-black text-purple-dark mb-2 uppercase tracking-tight">Pronto!</h2>
             
             <p className="text-gray-text font-bold mb-6 text-sm uppercase opacity-70 px-2">Apresente este código na recepção:</p>
             
             <div className="space-y-4 mb-8">
               {recoveredKids.map(({crianca, codigo}) => (
                 <div key={crianca.id} className="bg-purple-dark text-yellow-main p-6 rounded-[2.5rem] shadow-2xl transform transition-transform select-none border-b-8 border-purple-main relative overflow-hidden text-left">
                   <div className="absolute -right-10 -top-10 w-32 h-32 bg-white/5 rounded-full blur-2xl"></div>
                   <div className="absolute -left-10 -bottom-10 w-32 h-32 bg-white/5 rounded-full blur-2xl"></div>
                   
                   <p className="font-black text-white text-sm uppercase tracking-wide truncate relative z-10 mb-4">{crianca.nome} {crianca.sobrenome}</p>
                   <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-50 block mb-1 text-white relative z-10">Código</p>
                   <span className="kids-font text-4xl font-black tracking-widest block relative z-10">{codigo}</span>
                 </div>
               ))}
             </div>
             
             <button onClick={() => navigate('/pais')} className="w-full bg-yellow-main text-purple-dark font-black py-5 rounded-[2rem] shadow-xl text-sm uppercase tracking-widest hover:bg-yellow-400 transition-all border-b-8 border-yellow-600 active:border-b-0 active:translate-y-2 flex items-center justify-center gap-2">VOLTAR AO INÍCIO</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecuperarCodigo;
