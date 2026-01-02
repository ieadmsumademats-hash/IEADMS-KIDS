
import React, { useState, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { ICONS } from '../constants';
import { storageService } from '../services/storageService';
import { PreCheckIn, Crianca, Culto, CheckIn } from '../types';

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
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

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

    if (window.Notification && Notification.permission === 'granted') {
      setNotificationsEnabled(true);
    }
  }, []);

  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
      alert('Atenção: Seu celular não suporta alertas automáticos.');
      return;
    }
    if (Notification.permission === 'denied') {
      alert('Acesso bloqueado. Autorize as notificações no seu navegador.');
      return;
    }
    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') setNotificationsEnabled(true);
    } catch (err) {
      console.error(err);
    }
  };

  const filtered = search.length > 1 
    ? kids.filter(k => (k.nome + ' ' + k.sobrenome).toLowerCase().includes(search.toLowerCase()))
    : [];

  const handleSelect = async (kidId: string) => {
    if (!activeCulto) return;
    
    const kidName = kids.find(k => k.id === kidId)?.nome || "A criança";

    // TRAVA 1: Verificar se a criança já está PRESENTE (Check-in já confirmado)
    const alreadyPresent = currentCheckins.some(c => c.idCrianca === kidId && c.status === 'presente');
    if (alreadyPresent) {
      alert(`${kidName} já está no Culto Kids! Aproveite o culto.`);
      setSearch('');
      return;
    }

    // TRAVA 2: Verificar se já existe um Pré-Check-in pendente para este culto
    const existing = preCheckins.find(p => p.idCrianca === kidId && p.idCulto === activeCulto.id && p.status === 'pendente');
    if (existing) {
      setSelectedKidId(kidId);
      setGenerated(existing.codigo);
      setStep(2);
      return;
    }

    // Se passou pelas travas, gera novo código
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

  if (loading) return <div className="text-center py-20 text-purple-main font-bold text-xs">CARREGANDO...</div>;
  if (!activeCulto) return <Navigate to="/pais" />;

  return (
    <div className="min-h-screen bg-gray-light p-4 flex flex-col items-center">
      <div className="w-full max-w-lg">
        <button onClick={() => step === 1 ? navigate('/pais') : setStep(1)} className="mb-6 mt-2 flex items-center gap-2 text-purple-main font-black uppercase text-[10px] tracking-widest">
          {ICONS.ArrowLeft} Voltar
        </button>

        {step === 1 ? (
          <div className="bg-white rounded-[2.5rem] p-8 shadow-2xl border-b-6 border-purple-main animate-in slide-in-from-right duration-500">
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
                       <p className="text-[9px] font-black uppercase opacity-60 tracking-widest group-hover:text-white">Resp: {k.responsavelNome}</p>
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
             
             {!notificationsEnabled && (
                <button onClick={requestNotificationPermission} className="bg-yellow-main border-4 border-yellow-secondary text-purple-dark p-5 rounded-[2rem] mb-8 text-xs font-black uppercase tracking-tight w-full animate-pulse shadow-[0_0_20px_rgba(255,200,0,0.4)]">
                  🔔 TOQUE AQUI PARA ATIVAR O AVISO DE CHAMADA NO SEU CELULAR!
                </button>
             )}

             <p className="text-gray-text font-bold mb-8 text-sm leading-tight px-2">Apresente este código na recepção:</p>
             <div className="bg-purple-dark text-yellow-main p-8 rounded-[2rem] shadow-2xl mb-8 transform transition-transform select-none border-b-8 border-purple-main">
                <span className="text-[9px] font-black uppercase tracking-[0.3em] opacity-40 block mb-3 text-white">Código de Hoje</span>
                <span className="text-5xl md:text-6xl font-black tracking-widest block font-mono">{generated}</span>
             </div>
             <button onClick={() => navigate('/pais')} className="w-full bg-gray-light text-purple-dark font-black py-4 rounded-2xl shadow-md text-[10px] uppercase tracking-widest">VOLTAR AO INÍCIO</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PreCheckin;
