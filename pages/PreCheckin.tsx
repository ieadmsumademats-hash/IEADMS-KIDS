
import React, { useState, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { ICONS } from '../constants';
import { normalizeString } from '../utils';
import { storageService } from '../services/storageService';
import { PreCheckIn, Crianca, Culto, CheckIn } from '../types';
import PaisBackground from '../components/PaisBackground';

const PreCheckin: React.FC = () => {
  const navigate = useNavigate();
  const [activeCulto, setActiveCulto] = useState<Culto | null>(null);
  const [kids, setKids] = useState<Crianca[]>([]);
  const [preCheckins, setPreCheckins] = useState<PreCheckIn[]>([]);
  const [currentCheckins, setCurrentCheckins] = useState<CheckIn[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [search, setSearch] = useState('');
  const [step, setStep] = useState(1);
  const [generated, setGenerated] = useState<string | null>(null);
  const [selectedKidId, setSelectedKidId] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      const culto = await storageService.getActiveCulto();
      setActiveCulto(culto);

      if (culto) {
        const [allKids, allPres, allChecks] = await Promise.all([
          storageService.getCriancas(),
          storageService.getPreCheckins(),
          storageService.getCheckins(culto.id)
        ]);
        setKids(allKids);
        setPreCheckins(allPres);
        setCurrentCheckins(allChecks);
      }
      setLoading(false);
    };
    loadData();
  }, []);

  const filtered = search.length > 1 
    ? kids.filter(k => normalizeString(k.nome + ' ' + k.sobrenome).includes(normalizeString(search)))
    : [];

  const handleSelect = async (kidId: string) => {
    if (!activeCulto) return;
    
    const kidName = kids.find(k => k.id === kidId)?.nome || "A criança";
    const alreadyPresent = currentCheckins.some(c => c.idCrianca === kidId && c.status === 'presente');
    if (alreadyPresent) {
      alert(`${kidName} já está no Culto Kids!`);
      setSearch('');
      return;
    }

    const existing = preCheckins.find(p => p.idCrianca === kidId && p.idCulto === activeCulto.id && p.status === 'pendente');
    if (existing) {
      setSelectedKidId(kidId);
      setGenerated(existing.codigo);
      setStep(2);
      return;
    }

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
      setStep(2);
    } catch (e) {
      alert("Erro ao gerar código.");
    }
  };

  if (loading) return <div className="text-center py-20 text-white font-bold text-xs bg-purple-main min-h-screen">CARREGANDO...</div>;
  if (!activeCulto) return <Navigate to="/pais" />;

  return (
    <div className="min-h-screen p-4 flex flex-col items-center relative overflow-hidden">
      <PaisBackground />
      <div className="w-full max-w-lg relative z-10">
        <button onClick={() => step === 1 ? navigate('/pais') : setStep(1)} className="mb-6 mt-2 flex items-center gap-2 text-white font-black uppercase text-[10px] tracking-widest hover:text-yellow-main transition-colors">
          {ICONS.ArrowLeft} Voltar
        </button>

        {step === 1 ? (
          <div className="bg-white rounded-[2.5rem] p-8 shadow-2xl border-b-8 border-yellow-main animate-in slide-in-from-right duration-500">
             <h2 className="kids-font text-3xl font-black text-purple-dark mb-2 uppercase tracking-tight">Buscar Criança</h2>
             <p className="text-gray-text text-sm font-bold mb-8 opacity-70 uppercase">Digite o nome para gerar o código</p>
             <div className="relative mb-6">
                <span className="absolute left-5 top-1/2 -translate-y-1/2 text-purple-main/50">{ICONS.Search}</span>
                <input type="text" placeholder="Qual o nome da criança?" value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-14 pr-5 py-4 rounded-[2rem] bg-gray-50 border-2 border-gray-200 focus:bg-white focus:border-purple-main focus:ring-4 focus:ring-purple-100 outline-none font-bold text-base transition-all shadow-inner" />
             </div>
             <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1 custom-scrollbar">
                {filtered.map(k => (
                  <button key={k.id} onClick={() => handleSelect(k.id)} className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-yellow-100 hover:border-yellow-300 rounded-[2rem] border-2 border-transparent transition-all group shadow-sm hover:shadow-md">
                    <div className="text-left flex items-center gap-4">
                       <div className="w-12 h-12 rounded-full bg-white shadow-inner overflow-hidden border-2 border-gray-200 group-hover:border-yellow-400 transition-colors">
                         <img 
                           src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${k.nome}&backgroundColor=${k.sexo === 'F' ? 'ffdfbf' : 'b6e3f4'}`} 
                           alt={k.nome} 
                           className="w-full h-full object-cover"
                         />
                       </div>
                       <div>
                         <p className="kids-font text-xl font-black text-purple-dark group-hover:text-purple-900 transition-colors">{k.nome} {k.sobrenome}</p>
                         <p className="text-[10px] font-bold uppercase opacity-60 tracking-widest text-gray-500 group-hover:text-purple-700">Resp: {k.responsavelNome.split(' | ')[0]}</p>
                       </div>
                    </div>
                    <div className="bg-white p-3 rounded-full text-purple-main shadow-sm group-hover:bg-yellow-main group-hover:text-purple-dark group-hover:scale-110 transition-all">{ICONS.ChevronRight}</div>
                  </button>
                ))}
             </div>
          </div>
        ) : (
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
