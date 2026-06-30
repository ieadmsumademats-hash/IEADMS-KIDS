import React, { useState, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { ICONS } from '../constants';
import { formatPhone, normalizePhone } from '../utils';
import { storageService } from '../services/storageService';
import { PreCheckIn, Crianca, Culto, CheckIn } from '../types';
import PaisBackground from '../components/PaisBackground';
import { globalProgress } from '../components/GlobalProgress';

const PreCheckin: React.FC = () => {
  const navigate = useNavigate();
  const [activeCulto, setActiveCulto] = useState<Culto | null>(null);
  const [kids, setKids] = useState<Crianca[]>([]);
  const [preCheckins, setPreCheckins] = useState<PreCheckIn[]>([]);
  const [currentCheckins, setCurrentCheckins] = useState<CheckIn[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [phoneSearch, setPhoneSearch] = useState('');
  const [step, setStep] = useState<'phone' | 'select' | 'done'>('phone');
  const [showValidationAnim, setShowValidationAnim] = useState(false);
  const [noKidsModal, setNoKidsModal] = useState(false);
  
  const [generated, setGenerated] = useState<string | null>(null);
  const [selectedKidId, setSelectedKidId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      const culto = await storageService.getActiveCulto();
      setActiveCulto(culto);

      if (culto) {
        const [allPres, allChecks] = await Promise.all([
          storageService.getPreCheckins(),
          storageService.getCheckins(culto.id)
        ]);
        setPreCheckins(allPres);
        setCurrentCheckins(allChecks);
      }
      setLoading(false);
    };
    loadData();
  }, []);

  const handlePhoneSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const digits = normalizePhone(phoneSearch);
    if (digits.length < 10) {
      alert('Telefone do responsável está incompleto.');
      return;
    }

    setIsProcessing(true);
    globalProgress.start('Validando...');
    
    try {
      const formatted = formatPhone(phoneSearch);
      const linkedKids = await storageService.getCriancasByPhone(formatted);
      
      if (linkedKids.length > 0) {
        setKids(linkedKids);
        setShowValidationAnim(true);
        setTimeout(() => {
          setShowValidationAnim(false);
          setStep('select');
        }, 1500);
      } else {
        setNoKidsModal(true);
      }
    } catch (e) {
      alert("Erro ao consultar telefone.");
    } finally {
      setIsProcessing(false);
      globalProgress.stop();
    }
  };

  const handleSelect = async (kidId: string) => {
    if (!activeCulto || isProcessing) return;
    
    const kidName = kids.find(k => k.id === kidId)?.nome || "A criança";
    const alreadyPresent = currentCheckins.some(c => c.idCrianca === kidId && c.status === 'presente');
    if (alreadyPresent) {
      alert(`${kidName} já está no Culto Kids!`);
      return;
    }

    const existing = preCheckins.find(p => p.idCrianca === kidId && p.idCulto === activeCulto.id && p.status === 'pendente');
    if (existing) {
      setSelectedKidId(kidId);
      setGenerated(existing.codigo);
      setStep('done');
      return;
    }

    setIsProcessing(true);
    globalProgress.start('Gerando código...');
    
    const code = `KIDS-${Math.floor(1000 + Math.random() * 8999)}`;
    const newPre: Omit<PreCheckIn, 'id'> = {
      idCrianca: kidId,
      idCulto: activeCulto.id,
      codigo: code,
      status: 'pendente',
      dataHoraPreCheckin: new Date().toISOString()
    };

    try {
      await storageService.addPreCheckin(newPre);
      setSelectedKidId(kidId);
      setGenerated(code);
      setStep('done');
    } catch (e) {
      alert("Erro ao gerar código.");
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
        <button onClick={() => {
          if (step === 'phone') navigate('/pais');
          else if (step === 'select') setStep('phone');
          else navigate('/pais');
        }} className="mb-6 mt-2 flex items-center gap-2 text-white font-black uppercase text-[10px] tracking-widest hover:text-yellow-main transition-colors">
          {ICONS.ArrowLeft} Voltar
        </button>

        {showValidationAnim && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/90 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="flex flex-col items-center animate-in zoom-in slide-in-from-bottom-4 duration-300">
              <div className="w-24 h-24 bg-green-100 text-green-500 rounded-full flex items-center justify-center text-5xl mb-4 shadow-xl border-4 border-green-200 animate-[bounce_1s_ease-in-out]">
                {ICONS.CheckCircle}
              </div>
              <h2 className="kids-font text-3xl font-black text-purple-dark uppercase tracking-tight">Validado telefone</h2>
            </div>
          </div>
        )}

        {noKidsModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-purple-dark/80 backdrop-blur-sm">
            <div className="bg-white w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl text-center animate-in zoom-in duration-300">
              <div className="bg-red-100 text-red-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 text-2xl">
                ⚠️
              </div>
              <h2 className="text-xl font-black text-purple-dark mb-4 uppercase">Ops!</h2>
              <p className="text-gray-text font-bold mb-8 text-sm">Não existem crianças vinculadas a esse número.</p>
              <button 
                onClick={() => setNoKidsModal(false)}
                className="w-full bg-purple-main text-white font-black py-4 rounded-[2rem] shadow-xl text-xs uppercase tracking-widest hover:bg-purple-dark transition-colors"
              >
                TENTAR NOVAMENTE
              </button>
            </div>
          </div>
        )}

        {step === 'phone' && !showValidationAnim && (
          <div className="bg-white rounded-[2.5rem] p-8 shadow-2xl border-b-8 border-yellow-main animate-in slide-in-from-right duration-500">
             <h2 className="kids-font text-3xl font-black text-purple-dark mb-2 uppercase tracking-tight">Buscar Criança</h2>
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
        )}

        {step === 'select' && !showValidationAnim && (
          <div className="bg-white rounded-[2.5rem] p-8 shadow-2xl border-b-8 border-yellow-main animate-in slide-in-from-right duration-500">
             <h2 className="kids-font text-3xl font-black text-purple-dark mb-2 uppercase tracking-tight">Selecione</h2>
             <p className="text-gray-text text-sm font-bold mb-8 opacity-70 uppercase">Qual criança fará check-in?</p>
             
             <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1 custom-scrollbar">
                {kids.map(k => (
                  <button key={k.id} onClick={() => handleSelect(k.id)} disabled={isProcessing} className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-yellow-100 hover:border-yellow-300 rounded-[2rem] border-2 border-transparent transition-all group shadow-sm hover:shadow-md disabled:opacity-50 text-left">
                    <div className="flex items-center gap-4">
                       <div className="w-12 h-12 rounded-full bg-white shadow-inner overflow-hidden border-2 border-gray-200 group-hover:border-yellow-400 transition-colors flex-shrink-0">
                         <img 
                           src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${k.nome}&backgroundColor=${k.sexo === 'F' ? 'ffdfbf' : 'b6e3f4'}`} 
                           alt={k.nome} 
                           className="w-full h-full object-cover"
                         />
                       </div>
                       <div className="flex-1 min-w-0">
                         <p className="kids-font text-xl font-black text-purple-dark group-hover:text-purple-900 transition-colors truncate">{k.nome} {k.sobrenome}</p>
                         <p className="text-[10px] font-bold uppercase opacity-60 tracking-widest text-gray-500 group-hover:text-purple-700 truncate">Resp: {k.responsavelNome.split(' | ')[0]}</p>
                       </div>
                    </div>
                    <div className="bg-white p-3 rounded-full text-purple-main shadow-sm group-hover:bg-yellow-main group-hover:text-purple-dark group-hover:scale-110 transition-all flex-shrink-0 ml-2">{ICONS.ChevronRight}</div>
                  </button>
                ))}
             </div>
          </div>
        )}

        {step === 'done' && (
          <div className="bg-white rounded-[2.5rem] p-8 md:p-12 shadow-2xl text-center animate-in zoom-in duration-500 relative overflow-hidden border-b-8 border-yellow-main">
             <div className="bg-green-100 text-green-600 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl shadow-inner border-4 border-green-200">
                {ICONS.CheckCircle}
             </div>
             <h2 className="kids-font text-4xl font-black text-purple-dark mb-2 uppercase tracking-tight">Pronto!</h2>
             
             <p className="text-gray-text font-bold mb-6 text-sm uppercase opacity-70 px-2">Apresente este código na recepção:</p>
             <div className="bg-purple-dark text-yellow-main p-8 rounded-[2.5rem] shadow-2xl mb-8 transform transition-transform select-none border-b-8 border-purple-main relative overflow-hidden">
                <div className="absolute -right-10 -top-10 w-32 h-32 bg-white/5 rounded-full blur-2xl"></div>
                <div className="absolute -left-10 -bottom-10 w-32 h-32 bg-white/5 rounded-full blur-2xl"></div>
                <span className="text-[10px] font-black uppercase tracking-[0.3em] opacity-50 block mb-3 text-white relative z-10">Código de Hoje</span>
                <span className="kids-font text-5xl md:text-6xl font-black tracking-widest block relative z-10">{generated}</span>
             </div>
             <button onClick={() => navigate('/pais')} className="w-full bg-yellow-main text-purple-dark font-black py-5 rounded-[2rem] shadow-xl text-sm uppercase tracking-widest hover:bg-yellow-400 transition-all border-b-8 border-yellow-600 active:border-b-0 active:translate-y-2 flex items-center justify-center gap-2">VOLTAR AO INÍCIO</button>
             
             <p className="mt-8 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] leading-relaxed">
                Importante: Quando terminar o culto, apresente-se à equipe para buscar a criança.
             </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PreCheckin;
