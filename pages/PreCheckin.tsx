
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

  // Listener para notificações quando uma criança é selecionada
  useEffect(() => {
    if (selectedKidId && notificationsEnabled) {
      const unsub = storageService.subscribeToNotificacoes(selectedKidId, (n) => {
        if (window.Notification && Notification.permission === 'granted') {
          new Notification('IEADMS Kids', {
            body: n.mensagem,
            icon: 'https://api.dicebear.com/7.x/shapes/svg?seed=kids'
          });
          
          if (navigator.vibrate) {
            navigator.vibrate([200, 100, 200, 100, 500]);
          }
        }
      });
      return () => unsub();
    }
  }, [selectedKidId, notificationsEnabled]);

  const requestNotificationPermission = async () => {
    // Detectar se é iPhone
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isStandalone = (window.navigator as any).standalone || window.matchMedia('(display-mode: standalone)').matches;

    if (!('Notification' in window)) {
      if (isIOS && !isStandalone) {
        alert('📱 PARA IPHONE: Toque no ícone de "Compartilhar" (quadrado com seta) e depois em "ADICIONAR À TELA DE INÍCIO". Só assim o alerta poderá tocar no seu celular!');
      } else {
        alert('Este navegador não suporta alertas automáticos. Fique atento ao WhatsApp, avisaremos por lá também!');
      }
      return;
    }

    if (Notification.permission === 'denied') {
      alert('Você bloqueou os avisos. Toque no ícone de "Cadeado" lá em cima ao lado do site e mude "Notificações" para "Permitir".');
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        setNotificationsEnabled(true);
        alert('✅ SUCESSO! Agora seu celular vai apitar quando seu filho estiver pronto.');
      }
    } catch (err) {
      console.error("Erro ao pedir permissão:", err);
    }
  };

  const filtered = search.length > 1 
    ? kids.filter(k => (k.nome + ' ' + k.sobrenome).toLowerCase().includes(search.toLowerCase()))
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
             
             {!notificationsEnabled ? (
                <div className="relative group mb-8">
                  <div className="absolute -inset-1 bg-gradient-to-r from-yellow-main via-white to-yellow-main rounded-[2rem] blur opacity-75 group-hover:opacity-100 animate-pulse transition duration-1000 group-hover:duration-200"></div>
                  <button 
                    onClick={requestNotificationPermission} 
                    className="relative bg-yellow-main border-4 border-yellow-secondary text-purple-dark p-6 rounded-[2rem] text-xs font-black uppercase tracking-tight w-full shadow-2xl transform active:scale-95 transition-all flex flex-col items-center gap-2"
                  >
                    <span className="text-2xl animate-bounce">🔔</span>
                    <span>CLIQUE AQUI PARA ATIVAR O AVISO DE CHAMADA NO SEU CELULAR!</span>
                    <span className="text-[8px] opacity-70">(O celular apita quando seu filho terminar)</span>
                  </button>
                </div>
             ) : (
                <div className="bg-green-50 border-2 border-green-200 text-green-700 p-4 rounded-2xl mb-8 text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-3">
                   <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                   Avisos de Chamada Ativados
                </div>
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
