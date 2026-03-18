
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
          <div className="bg-white rounded-[2.5rem] p-8 shadow-2xl border-b-6 border-yellow-main animate-in slide-in-from-right duration-500">
             <h2 className="text-2xl font-black text-purple-dark mb-2 uppercase tracking-tight">Buscar Filho</h2>
             <p className="text-gray-text text-xs font-bold mb-8">Digite o nome para gerar o código.</p>
             <div className="relative mb-6">
                <span className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400">{ICONS.Search}</span>
                <input type="text" placeholder="Nome da criança..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-14 pr-5 py-4 rounded-2xl bg-gray-light border-2 border-transparent focus:border-purple-main outline-none font-bold text-base" />
             </div>
             <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1 custom-scrollbar">
                {filtered.map(k => (
                  <button key={k.id} onClick={() => handleSelect(k.id)} className="w-full flex items-center justify-between p-4 bg-purple-main/5 hover:bg-purple-main hover:text-white rounded-2xl border-2 border-transparent transition-all group">
                    <div className="text-left">
                       <p className="font-black text-sm group-hover:text-white text-purple-dark">{k.nome} {k.sobrenome}</p>
                       <p className="text-[9px] font-black uppercase opacity-60 tracking-widest group-hover:text-white">Resp: {k.responsavelNome.split(' | ')[0]}</p>
                    </div>
                    <div className="bg-white p-2.5 rounded-xl text-purple-main shadow-sm group-hover:scale-110 transition-transform">{ICONS.ChevronRight}</div>
                  </button>
                ))}
             </div>
          </div>
        ) : (
          <div className="bg-white rounded-[2.5rem] p-8 md:p-12 shadow-2xl text-center animate-in zoom-in duration-500 relative overflow-hidden">
             <div className="absolute top-0 left-0 w-full h-3 bg-green-500" />
             <div className="bg-green-100 text-green-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 text-2xl shadow-inner">
                {ICONS.CheckCircle}
             </div>
             <h2 className="text-2xl font-black text-purple-dark mb-2 uppercase">PRONTO!</h2>
             
             <p className="text-gray-text font-bold mb-6 text-sm leading-tight px-2">Apresente este código na recepção:</p>
             <div className="bg-purple-dark text-yellow-main p-8 rounded-[2.5rem] shadow-2xl mb-8 transform transition-transform select-none border-b-8 border-purple-main">
                <span className="text-[9px] font-black uppercase tracking-[0.3em] opacity-40 block mb-3 text-white">Código de Hoje</span>
                <span className="text-5xl md:text-6xl font-black tracking-widest block font-mono">{generated}</span>
             </div>
             <button onClick={() => navigate('/pais')} className="w-full bg-yellow-main text-purple-dark font-black py-4 rounded-2xl shadow-md text-[10px] uppercase tracking-widest hover:bg-yellow-400 transition-colors border-b-4 border-yellow-600">VOLTAR AO INÍCIO</button>
             
             <p className="mt-8 text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] leading-relaxed">
                Importante: Quando terminar o culto, apresente-se à equipe para buscar seu filho.
             </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PreCheckin;
