
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ICONS } from '../constants';
import { storageService } from '../services/storageService';
import { Crianca, CheckIn, Culto, PreCheckIn } from '../types';

const formatPhone = (value: string) => {
  if (!value) return value;
  const phoneNumber = value.replace(/[^\d]/g, '');
  const phoneNumberLength = phoneNumber.length;
  if (phoneNumberLength < 3) return phoneNumber;
  if (phoneNumberLength < 7) {
    return `(${phoneNumber.slice(0, 2)}) ${phoneNumber.slice(2)}`;
  }
  return `(${phoneNumber.slice(0, 2)}) ${phoneNumber.slice(2, 7)}-${phoneNumber.slice(7, 11)}`;
};

const CultoAtivo: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [culto, setCulto] = useState<Culto | null>(null);
  const [checkins, setCheckins] = useState<CheckIn[]>([]);
  const [allCriancas, setAllCriancas] = useState<Crianca[]>([]);
  const [preCheckins, setPreCheckins] = useState<PreCheckIn[]>([]);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [codeQuery, setCodeQuery] = useState('KIDS-');
  const [showCheckout, setShowCheckout] = useState<CheckIn | null>(null);
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const [checkoutName, setCheckoutName] = useState('');
  const [loading, setLoading] = useState(true);

  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newKidForm, setNewKidForm] = useState({ nome: '', sobrenome: '', dataNascimento: '', responsavelNome: '', whatsapp: '', observacoes: '' });
  const [labelData, setLabelData] = useState<{ kid: Crianca, checkin: CheckIn } | null>(null);

  useEffect(() => {
    if (!id) return;
    const loadBasics = async () => {
      const kids = await storageService.getCriancas();
      setAllCriancas(kids);
    };
    loadBasics();

    const unsubCulto = storageService.subscribeToActiveCulto((c) => {
      if (!c || c.id !== id) {
        storageService.getCultos().then(list => {
          const found = list.find(item => item.id === id);
          if (found) setCulto(found);
          else navigate('/cultos');
        });
      } else {
        setCulto(c);
      }
    });

    const unsubCheckins = storageService.subscribeToCheckins(id, (list) => {
      setCheckins(list);
      setLoading(false);
    });

    const unsubPre = storageService.subscribeToPreCheckins(setPreCheckins);

    return () => {
      unsubCulto();
      unsubCheckins();
      unsubPre();
    };
  }, [id, navigate]);

  const activeCheckins = checkins.filter(c => c.status === 'presente');
  const finishedCheckins = checkins.filter(c => c.status === 'saiu');

  const triggerLabelPrint = (kid: Crianca, checkin: CheckIn) => {
    setLabelData({ kid, checkin });
    setTimeout(() => {
        window.print();
        setLabelData(null);
    }, 500);
  };

  const handleSendNotification = async (kidId: string) => {
    if (!id) return;
    const success = await storageService.sendNotificacao(kidId, id);
    if (success) {
      alert('Notificação enviada ao celular do responsável!');
    } else {
      alert('Tabela de notificações não encontrada. Peça ao administrador para criar a tabela "notificacoes_ativas" no Supabase.');
    }
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.toUpperCase();
    if (!val.startsWith('KIDS-')) {
      val = 'KIDS-' + val.replace('KIDS-', '');
    }
    setCodeQuery(val);
  };

  const handleManualCheckin = async (kid: Crianca) => {
    // TRAVA: Verifica se já está presente neste culto específico
    if (activeCheckins.some(c => c.idCrianca === kid.id)) {
      alert(`Atenção: ${kid.nome} já está presente neste culto.`);
      setSearchTerm('');
      return;
    }

    const newCheck: Omit<CheckIn, 'id'> = {
      idCrianca: kid.id,
      idCulto: id!,
      horaEntrada: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      status: 'presente'
    };
    try {
      await storageService.addCheckin(newCheck);
      const updatedCheckins = await storageService.getCheckins(id!);
      const lastCheck = updatedCheckins.find(c => c.idCrianca === kid.id && c.status === 'presente');
      if (lastCheck) triggerLabelPrint(kid, lastCheck);
      setSearchTerm('');
    } catch (e) {
      alert("Erro ao realizar check-in. Tente novamente.");
    }
  };

  const handleQuickRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const newKid = await storageService.addCrianca({ ...newKidForm, createdAt: new Date().toISOString() });
      const kids = await storageService.getCriancas();
      setAllCriancas(kids);
      await handleManualCheckin(newKid);
      setIsAddingNew(false);
      setNewKidForm({ nome: '', sobrenome: '', dataNascimento: '', responsavelNome: '', whatsapp: '', observacoes: '' });
    } catch (error) {
      alert("Erro ao cadastrar criança.");
    }
  };

  const handleCodeCheckin = async () => {
    const code = codeQuery.trim().toUpperCase();
    const pre = preCheckins.find(p => p.codigo === code && p.status === 'pendente' && p.idCulto === id);
    
    if (!pre) { 
      alert('Código inválido ou já utilizado para este culto.'); 
      return; 
    }

    const kid = allCriancas.find(k => k.id === pre.idCrianca);
    if (kid) {
      // TRAVA: Verifica duplicidade antes de confirmar o código
      if (activeCheckins.some(c => c.idCrianca === kid.id)) {
        alert(`${kid.nome} já realizou a entrada anteriormente.`);
        await storageService.updatePreCheckin(pre.id, { status: 'confirmado' }); // Marca como resolvido para sumir da lista
        setCodeQuery('KIDS-');
        return;
      }

      await handleManualCheckin(kid);
      await storageService.updatePreCheckin(pre.id, { status: 'confirmado', dataHoraCheckin: new Date().toISOString() });
      setCodeQuery('KIDS-');
    }
  };

  const handleConfirmCheckout = async () => {
    if (!showCheckout || !checkoutName) return;
    await storageService.updateCheckin(showCheckout.id, {
      status: 'saiu',
      horaSaida: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      quemRetirou: checkoutName
    });
    setShowCheckout(null);
    setCheckoutName('');
  };

  const handleEndCulto = async () => {
    if (activeCheckins.length > 0) { 
        alert('Libere todas as crianças antes.'); 
        setShowEndConfirm(false);
        return; 
    }
    try {
        await storageService.clearNotificacoes(id!);
        await storageService.updateCulto(id!, { 
            status: 'encerrado', 
            horaFim: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) 
        });
        navigate('/cultos');
    } catch (e) {
        alert("Erro ao encerrar culto.");
    }
  };

  const filteredKids = searchTerm.length > 1 
    ? allCriancas.filter(k => (k.nome + ' ' + k.sobrenome).toLowerCase().includes(searchTerm.toLowerCase()))
    : [];

  if (loading) return <div className="text-center py-20 text-purple-main font-bold">Carregando dados...</div>;

  return (
    <div className="space-y-6 pb-12">
      {/* Seção de Impressão */}
      <div id="print-section" className="hidden flex-col items-center justify-center text-center p-4">
        {labelData && (
          <div className="flex flex-col items-center w-full">
            <h1 className="font-black leading-tight uppercase" style={{ fontSize: '28pt' }}>{labelData.kid.nome}</h1>
            <h2 className="font-bold leading-tight uppercase opacity-70" style={{ fontSize: '18pt' }}>{labelData.kid.sobrenome}</h2>
            <div className="w-full border-t-2 border-black my-6"></div>
            <div className="text-center">
                <p className="text-xs font-black uppercase tracking-widest text-gray-400 mb-1">Responsável</p>
                <p className="font-black" style={{ fontSize: '14pt' }}>{labelData.kid.responsavelNome}</p>
            </div>
            <div className="w-full border-t border-black/20 my-4"></div>
            <p className="font-bold text-gray-500" style={{ fontSize: '10pt' }}>
                Entrada: {new Date(culto?.data || '').toLocaleDateString('pt-BR')} às {labelData.checkin.horaEntrada}
            </p>
          </div>
        )}
      </div>

      <div className="print:hidden space-y-6">
        <div className="bg-white p-6 rounded-[2.5rem] shadow-xl border-l-[10px] border-green-500 flex items-center justify-between gap-6 sticky top-0 z-30">
            <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-green-600 bg-green-50 px-3 py-1 rounded-full mb-2 inline-block">ATIVO AGORA</span>
            <h1 className="text-2xl font-black text-purple-dark uppercase truncate">
                {culto?.tipo === 'Outros' ? culto.tipoManual : culto?.tipo}
            </h1>
            </div>

            <div className="flex items-center gap-4">
            <div className="bg-purple-main px-6 py-3 rounded-2xl text-white text-center shadow-lg">
                <span className="text-2xl font-black block leading-none">{activeCheckins.length}</span>
                <span className="text-[9px] font-black uppercase tracking-widest opacity-80 mt-1">Crianças</span>
            </div>
            <button onClick={() => setShowEndConfirm(true)} className="bg-red-500 hover:bg-red-600 text-white font-black px-6 py-3 rounded-2xl text-xs flex items-center gap-3 transition-colors shadow-lg">
                {ICONS.LogOut} <span className="hidden sm:inline uppercase tracking-widest">ENCERRAR</span>
            </button>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-4 space-y-6">
            <div className="bg-yellow-main p-7 rounded-[2rem] shadow-lg flex flex-col items-center">
                <h2 className="w-full text-base font-black text-purple-dark mb-4 uppercase flex items-center gap-3">
                {ICONS.QrCode} Confirmar Código
                </h2>
                <div className="flex bg-white rounded-xl overflow-hidden w-full border-4 border-white shadow-inner">
                <input 
                    type="text" 
                    placeholder="EX: KIDS-1234"
                    value={codeQuery}
                    onChange={handleCodeChange}
                    className="flex-1 min-w-0 p-4 font-black text-xl tracking-widest uppercase outline-none focus:bg-gray-50"
                />
                <button 
                    onClick={handleCodeCheckin} 
                    className="bg-purple-dark text-white px-6 font-black text-sm hover:bg-purple-main transition-colors uppercase whitespace-nowrap"
                >
                    OK
                </button>
                </div>
            </div>

            <div className="bg-white p-7 rounded-[2rem] shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-5">
                <h2 className="text-base font-black text-purple-dark uppercase flex items-center gap-3">
                    {ICONS.Search} Busca Manual
                </h2>
                <button onClick={() => setIsAddingNew(true)} className="text-[10px] font-black uppercase text-purple-main bg-purple-main/10 px-3 py-1.5 rounded-xl hover:bg-purple-main hover:text-white transition-all">+ Novo</button>
                </div>
                <input 
                type="text" 
                placeholder="Nome da criança..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-gray-light p-4 rounded-xl font-bold mb-4 outline-none border-2 border-transparent focus:border-purple-main text-sm"
                />
                <div className="space-y-1.5 max-h-[220px] overflow-y-auto custom-scrollbar">
                {filteredKids.map(kid => (
                    <button 
                    key={kid.id}
                    onClick={() => handleManualCheckin(kid)}
                    className="w-full flex items-center justify-between p-3.5 hover:bg-purple-main/10 rounded-xl transition-all text-sm font-bold text-gray-700 group"
                    >
                    <span>{kid.nome} {kid.sobrenome}</span>
                    <span className="text-purple-main group-hover:scale-125 transition-transform">{ICONS.Plus}</span>
                    </button>
                ))}
                </div>
            </div>

            <div className="bg-white p-7 rounded-[2rem] shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-base font-black text-purple-dark uppercase flex items-center gap-3">
                        {ICONS.CheckCircle} Checkouts Realizados
                    </h2>
                    <span className="bg-gray-light text-gray-400 px-3 py-1 rounded-full text-[10px] font-black">{finishedCheckins.length}</span>
                </div>
                <div className="space-y-3 max-h-[350px] overflow-y-auto custom-scrollbar">
                    {finishedCheckins.map(check => {
                        const kid = allCriancas.find(k => k.id === check.idCrianca);
                        return (
                            <div key={check.id} className="p-4 bg-gray-50 rounded-2xl border border-gray-100 hover:bg-white hover:shadow-md transition-all group">
                                <div className="flex justify-between items-start mb-1">
                                    <h4 className="font-black text-xs text-purple-dark truncate mr-2">{kid?.nome} {kid?.sobrenome}</h4>
                                    <span className="text-[9px] font-black text-purple-main bg-purple-main/10 px-2 py-0.5 rounded-full">{check.horaSaida}</span>
                                </div>
                                <div className="flex items-center gap-1.5 text-gray-400">
                                    <span className="text-[9px] font-black uppercase tracking-widest">Retirado por:</span>
                                    <span className="text-[10px] font-bold text-gray-600 truncate">{check.quemRetirou}</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
            </div>

            <div className="lg:col-span-8">
            <div className="bg-white p-7 rounded-[2rem] shadow-sm border border-gray-100 min-h-[450px]">
                <h2 className="text-base font-black text-purple-dark mb-6 uppercase flex items-center gap-3">
                {ICONS.Baby} Crianças na Sala ({activeCheckins.length})
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-2 gap-3">
                {activeCheckins.map(check => {
                    const kid = allCriancas.find(k => k.id === check.idCrianca);
                    const hasPreCheckin = preCheckins.some(p => p.idCrianca === check.idCrianca && p.idCulto === id && p.status === 'confirmado');
                    
                    return (
                    <div key={check.id} className="bg-gray-light p-4 rounded-2xl flex items-center justify-between border-2 border-transparent hover:border-purple-main/20 transition-all shadow-sm group">
                        <div className="flex-1 overflow-hidden mr-4">
                            <h4 className="font-black text-purple-dark text-sm truncate leading-tight">{kid?.nome} {kid?.sobrenome}</h4>
                            <div className="flex items-center gap-3 mt-0.5">
                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Entrada: {check.horaEntrada}</p>
                                {kid?.observacoes && (
                                    <span className="bg-red-100 text-red-500 text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-tighter" title={kid.observacoes}>MED: {kid.observacoes}</span>
                                )}
                            </div>
                        </div>
                        
                        <div className="flex items-center gap-1.5">
                            <button onClick={() => triggerLabelPrint(kid!, check)} className="text-purple-main p-2.5 bg-white rounded-xl shadow-sm hover:bg-purple-main hover:text-white transition-all transform active:scale-90" title="Imprimir Etiqueta">
                              {ICONS.QrCode}
                            </button>
                            {hasPreCheckin && (
                                <button onClick={() => handleSendNotification(kid!.id)} className="text-purple-dark p-2.5 bg-yellow-main rounded-xl shadow-sm hover:bg-yellow-secondary transition-all transform active:scale-90" title="Notificar Responsável">
                                  <div className="animate-pulse">{ICONS.Info}</div>
                                </button>
                            )}
                            <a href={`https://wa.me/${kid?.whatsapp.replace(/[^\d]/g, '')}?text=Olá, ${kid?.responsavelNome}. Sua criança ${kid?.nome} está te aguardando no Culto Kids.`} target="_blank" className="text-white p-2.5 bg-green-500 rounded-xl shadow-sm hover:bg-green-600 transition-all transform active:scale-90 flex items-center justify-center">
                              {ICONS.Phone}
                            </a>
                            <button onClick={() => setShowCheckout(check)} className="text-white p-2.5 bg-red-500 rounded-xl shadow-sm hover:bg-red-600 transition-all transform active:scale-95" title="Realizar Saída">
                                {ICONS.X}
                            </button>
                        </div>
                    </div>
                    );
                })}
                </div>
            </div>
            </div>
        </div>

        {/* Modal Saída */}
        {showCheckout && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-purple-dark/70 backdrop-blur-md">
            <div className="bg-white w-full max-sm rounded-[2rem] p-8 shadow-2xl text-center animate-in zoom-in duration-300">
                <h2 className="text-xl font-black text-purple-dark mb-2 uppercase tracking-tight">Confirmar Saída</h2>
                <p className="text-sm font-bold text-gray-500 mb-8 px-4">Quem veio buscar {allCriancas.find(k => k.id === showCheckout.idCrianca)?.nome}?</p>
                <input type="text" placeholder="Nome do responsável..." autoFocus value={checkoutName} onChange={(e) => setCheckoutName(e.target.value)} className="w-full bg-gray-light p-5 rounded-2xl font-bold mb-8 outline-none border-2 border-transparent focus:border-purple-main text-sm" />
                <div className="grid grid-cols-2 gap-4">
                <button onClick={() => setShowCheckout(null)} className="bg-gray-100 text-gray-500 font-black py-5 rounded-2xl text-xs tracking-widest">VOLTAR</button>
                <button onClick={handleConfirmCheckout} disabled={!checkoutName} className="bg-green-500 text-white font-black py-5 rounded-2xl shadow-xl disabled:opacity-50 text-xs uppercase tracking-widest">CONFIRMAR</button>
                </div>
            </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default CultoAtivo;
