
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

    // Verifica estado atual da permissão
    if (window.Notification && Notification.permission === 'granted') {
      setNotificationsEnabled(true);
    }
  }, []);

  // Listener para notificações
  useEffect(() => {
    if (selectedKidId && notificationsEnabled) {
      const unsub = storageService.subscribeToNotificacoes(selectedKidId, (n) => {
        if (window.Notification && Notification.permission === 'granted') {
          new Notification('IEADMS Kids', {
            body: n.mensagem,
            icon: 'https://api.dicebear.com/7.x/shapes/svg?seed=kids'
          });
          
          if (navigator.vibrate) {
            navigator.vibrate([300, 100, 300, 100, 500]);
          }
        }
      });
      return () => unsub();
    }
  }, [selectedKidId, notificationsEnabled]);

  const requestNotificationPermission = async () => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isStandalone = (window.navigator as any).standalone || window.matchMedia('(display-mode: standalone)').matches;

    // Se o navegador não suportar a API de Notificação (comum em iPhone se não estiver "instalado")
    if (!('Notification' in window)) {
      if (isIOS && !isStandalone) {
        alert('📱 ATENÇÃO PAPAI/MAMÃE: No iPhone, você precisa primeiro clicar no botão de "Compartilhar" (o quadradinho com seta no meio) e depois em "Adicionar à Tela de Início".\n\nAbra o app por esse novo ícone que vai aparecer e aí este botão de alertas vai funcionar!');
      } else {
        alert('Seu navegador não suporta avisos automáticos. Mas não se preocupe, chamaremos você pelo WhatsApp!');
      }
      return;
    }

    // Se o usuário já bloqueou anteriormente
    if (Notification.permission === 'denied') {
      alert('⚠️ Os avisos estão bloqueados no seu celular. Para ativar, clique no ícone de "Cadeado" lá em cima (ao lado do endereço do site) e mude Notificações para "Permitir".');
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        setNotificationsEnabled(true);
        alert('✅ TUDO CERTO! Agora seu celular vai apitar quando seu filho estiver pronto para ser buscado.');
      } else {
        alert('Você não autorizou os alertas. Caso mude de idéia, clique no botão amarelo novamente e escolha "Permitir".');
      }
    } catch (err) {
      console.error("Erro ao solicitar permissão:", err);
      alert('Ocorreu um erro ao tentar ativar os alertas. Tente atualizar a página.');
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
                <div className="relative group mb-10">
                  {/* Efeito de Brilho em volta do botão */}
                  <div className="absolute -inset-2 bg-gradient-to-r from-yellow-main via-white to-yellow-main rounded-[2.5rem] blur-lg opacity-75 group-hover:opacity-100 animate-pulse transition duration-1000"></div>
                  
                  <button 
                    onClick={requestNotificationPermission} 
                    className="relative bg-yellow-main border-4 border-yellow-secondary text-purple-dark p-6 rounded-[2.5rem] shadow-2xl transform active:scale-95 transition-all flex flex-col items-center gap-3 w-full"
                  >
                    <div className="text-3xl animate-bounce">🔔</div>
                    <div className="flex flex-col gap-1">
                      <span className="text-sm font-black uppercase leading-tight tracking-tight">
                        TOQUE AQUI PARA SER AVISADO NO CELULAR QUANDO SEU FILHO ESTIVER PRONTO!
                      </span>
                      <span className="text-[9px] font-bold opacity-70 uppercase tracking-widest">
                        (Ative para seu celular apitar e vibrar)
                      </span>
                    </div>
                  </button>
                </div>
             ) : (
                <div className="bg-green-50 border-2 border-green-200 text-green-700 p-4 rounded-2xl mb-8 text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-3">
                   <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                   Avisos Ativados no Celular
                </div>
             )}

             <p className="text-gray-text font-bold mb-6 text-sm leading-tight px-2">Apresente este código na recepção:</p>
             <div className="bg-purple-dark text-yellow-main p-8 rounded-[2.5rem] shadow-2xl mb-8 transform transition-transform select-none border-b-8 border-purple-main">
                <span className="text-[9px] font-black uppercase tracking-[0.3em] opacity-40 block mb-3 text-white">Código de Hoje</span>
                <span className="text-5xl md:text-6xl font-black tracking-widest block font-mono">{generated}</span>
             </div>
             <button onClick={() => navigate('/pais')} className="w-full bg-gray-light text-purple-dark font-black py-4 rounded-2xl shadow-md text-[10px] uppercase tracking-widest">VOLTAR AO INÍCIO</button>
             
             <p className="mt-8 text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] leading-relaxed">
                Importante: Mantenha esta página aberta em segundo plano para o alerta funcionar.
             </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PreCheckin;
