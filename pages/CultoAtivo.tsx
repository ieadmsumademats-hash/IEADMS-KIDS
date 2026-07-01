
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ICONS } from '../constants';
import { normalizeString } from '../utils';
import { storageService } from '../services/storageService';
import { Crianca, CheckIn, Culto, PreCheckIn, Responsavel } from '../types';
import { globalProgress } from '../components/GlobalProgress';
import { NeurodivergentBadge } from '../components/NeurodivergentBadge';

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
  const [isOtherGuardianCheckout, setIsOtherGuardianCheckout] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isProcessingCode, setIsProcessingCode] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [timeoutExpired, setTimeoutExpired] = useState(false);

  // Estados para modal de check-in
  const [pendingCheckinKid, setPendingCheckinKid] = useState<Crianca | null>(null);
  const [pendingPreCheckinId, setPendingPreCheckinId] = useState<string | null>(null);
  const [checkinAuthorized, setCheckinAuthorized] = useState('');
  const [isOtherGuardianCheckin, setIsOtherGuardianCheckin] = useState(false);
  const [otherGuardianNameCheckin, setOtherGuardianNameCheckin] = useState('');

  // Estado para sucesso do check-in
  const [checkinSuccessData, setCheckinSuccessData] = useState<{ kid: Crianca, checkin: CheckIn } | null>(null);

  // Estados para o resumo do culto
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [summaryData, setSummaryData] = useState<{ nome: string, duration: string, count: number } | null>(null);

  // Estados para novo cadastro dentro do culto
  const [isRegistering, setIsRegistering] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState<Crianca | null>(null);
  const [regForm, setRegForm] = useState({
    nome: '', sobrenome: '', dataNascimento: '', observacoes: ''
  });
  const [responsaveis, setResponsaveis] = useState<Responsavel[]>([
    { nome: '', whatsapp: '', parentesco: 'Pai' }
  ]);
  const [neurodivergente, setNeurodivergente] = useState<boolean | null>(null);
  const [neurodivergenteOpcoes, setNeurodivergenteOpcoes] = useState<string[]>([]);
  const [neurodivergenteOutro, setNeurodivergenteOutro] = useState('');

  const handleNeuroChange = (isNeuro: boolean) => {
    setNeurodivergente(isNeuro);
    if (!isNeuro) {
      setNeurodivergenteOpcoes([]);
      setNeurodivergenteOutro('');
    }
  };

  const toggleNeuroOpcao = (opcao: string) => {
    setNeurodivergenteOpcoes(prev => {
      const isSelected = prev.includes(opcao);
      const newOptions = isSelected ? prev.filter(o => o !== opcao) : [...prev, opcao];
      if (isSelected && opcao === 'Outro') {
        setNeurodivergenteOutro('');
      }
      return newOptions;
    });
  };

  const handleResponsavelChange = (index: number, field: keyof Responsavel, value: string) => {
    const newResponsaveis = [...responsaveis];
    if (field === 'whatsapp') {
      newResponsaveis[index][field] = formatPhone(value);
    } else {
      newResponsaveis[index][field] = value;
    }
    setResponsaveis(newResponsaveis);
  };

  const addResponsavel = () => {
    if (responsaveis.length < 3) {
      setResponsaveis([...responsaveis, { nome: '', whatsapp: '', parentesco: 'Mãe' }]);
    }
  };

  const removeResponsavel = (index: number) => {
    if (responsaveis.length > 1) {
      const newResponsaveis = [...responsaveis];
      newResponsaveis.splice(index, 1);
      setResponsaveis(newResponsaveis);
    }
  };

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

  const activeCheckins = useMemo(() => checkins.filter(c => c.status === 'presente'), [checkins]);
  const finishedCheckins = useMemo(() => checkins.filter(c => c.status === 'saiu'), [checkins]);

  const triggerLabelPrint = useCallback((kid: Crianca, checkin: CheckIn) => {
    setLabelData({ kid, checkin });
    setTimeout(() => {
        window.print();
    }, 50);
  }, []);

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.toUpperCase();
    if (!val.startsWith('KIDS-')) {
      val = 'KIDS-' + val.replace('KIDS-', '');
    }
    setCodeQuery(val);
  };

  const handleManualCheckin = (kid: Crianca, preCheckinId?: string) => {
    if (activeCheckins.some(c => c.idCrianca === kid.id)) {
      alert(`${kid.nome} já está na sala.`);
      setSearchTerm('');
      return;
    }
    setPendingCheckinKid(kid);
    setPendingPreCheckinId(preCheckinId || null);
    setCheckinAuthorized('');
    setIsOtherGuardianCheckin(false);
    setOtherGuardianNameCheckin('');
  };

  const confirmCheckin = async () => {
    if (!pendingCheckinKid || isProcessing) return;
    const authorized = isOtherGuardianCheckin ? otherGuardianNameCheckin : checkinAuthorized;
    if (!authorized) {
      alert('Selecione ou informe quem poderá retirar a criança.');
      return;
    }

    setIsProcessing(true);
    globalProgress.start('Confirmando...');

    const newCheck: Omit<CheckIn, 'id'> = {
      idCrianca: pendingCheckinKid.id,
      idCulto: id!,
      horaEntrada: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      autorizadoRetirar: authorized,
      status: 'presente'
    };
    try {
      await storageService.addCheckin(newCheck);
      const lastCheck = { ...newCheck, id: 'temp' } as CheckIn;
      
      if (pendingPreCheckinId) {
        await storageService.updatePreCheckin(pendingPreCheckinId, { 
          status: 'confirmado', 
          dataHoraCheckin: new Date().toISOString() 
        });
      }

      const kidToSuccess = pendingCheckinKid;

      setSearchTerm('');
      setCodeQuery('KIDS-');
      setPendingCheckinKid(null);
      setPendingPreCheckinId(null);

      setCheckinSuccessData({ kid: kidToSuccess, checkin: lastCheck });
    } catch (e: any) {
      if (e.message === "ALREADY_PRESENT") {
        alert(`${pendingCheckinKid.nome} já está na sala.`);
      } else {
        alert(e.message || "Erro ao realizar check-in.");
      }
    } finally {
      setIsProcessing(false);
      globalProgress.stop();
    }
  };

  const handleCodeCheckin = async () => {
    if (isProcessingCode) return;
    
    const code = codeQuery.trim().toUpperCase();
    if (code === 'KIDS-') return;

    setIsProcessingCode(true);
    
    console.group(`[DEBUG PreCheckIn] Processando código: ${code}`);
    try {
      const pre = preCheckins.find(p => {
          const matchCode = p.codigo.trim().toUpperCase() === code;
          const matchStatus = p.status === 'pendente';
          const matchCulto = String(p.idCulto) === String(id);
          return matchCode && matchStatus && matchCulto;
      });
      
      if (!pre) { 
        alert('Código não encontrado ou já confirmado.'); 
        setIsProcessingCode(false);
        console.groupEnd();
        return; 
      }

      const kid = allCriancas.find(k => k.id === pre.idCrianca);
      if (kid) {
        if (activeCheckins.some(c => c.idCrianca === kid.id)) {
          await storageService.updatePreCheckin(pre.id, { status: 'confirmado' });
          setCodeQuery('KIDS-');
          setIsProcessingCode(false);
          console.groupEnd();
          return;
        }

        handleManualCheckin(kid, pre.id);
        setIsProcessingCode(false);
        console.groupEnd();
        return;
      } else {
        setIsProcessingCode(false);
      }
    } catch (error) {
      setIsProcessingCode(false);
    }
    console.groupEnd();
  };

  const handleSaveNewKid = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isProcessing) return;

    if (neurodivergente === true) {
      if (neurodivergenteOpcoes.length === 0) {
        alert("Por favor, selecione pelo menos uma opção de neurodivergência.");
        return;
      }
      if (neurodivergenteOpcoes.includes('Outro') && !neurodivergenteOutro.trim()) {
        alert("Por favor, informe qual a neurodivergência no campo 'Outro'.");
        return;
      }
    }

    setIsProcessing(true);
    globalProgress.start('Salvando...');

    try {
      const finalNeuroOpcoes = neurodivergente ? neurodivergenteOpcoes : [];
      const finalNeuroOutro = neurodivergente && neurodivergenteOpcoes.includes('Outro') ? neurodivergenteOutro.trim() : '';

      const newKidData: Omit<Crianca, 'id'> = {
        ...regForm,
        responsavelNome: '',
        whatsapp: '',
        responsaveis,
        neurodivergente: neurodivergente === true,
        neurodivergenteOpcoes: finalNeuroOpcoes,
        neurodivergenteOutro: finalNeuroOutro,
        createdAt: new Date().toISOString()
      };
      const createdKid = await storageService.addCrianca(newKidData);
      setRegistrationSuccess(createdKid);
      setAllCriancas(prev => [...prev, createdKid].sort((a,b) => a.nome.localeCompare(b.nome)));
    } catch (error) {
      alert("Erro ao salvar cadastro.");
    } finally {
      setIsProcessing(false);
      globalProgress.stop();
    }
  };

  const handleConfirmCheckout = async () => {
    if (!showCheckout || isProcessing) return;
    const retirou = isOtherGuardianCheckout ? checkoutName : checkoutName;
    if (!retirou) {
      alert('Selecione ou informe quem retirou a criança.');
      return;
    }
    
    setIsProcessing(true);
    globalProgress.start('Confirmando...');

    console.log("[DEBUG CHECKOUT] Iniciando processo para ID:", showCheckout.id);
    
    try {
      await storageService.updateCheckin(showCheckout.id, {
        status: 'saiu',
        horaSaida: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        quemRetirou: retirou
      });

      await storageService.deletePreCheckin(showCheckout.idCrianca, showCheckout.idCulto);
      
      console.log("[DEBUG CHECKOUT] Chamada de serviço concluída com sucesso.");
      setShowCheckout(null);
      setCheckoutName('');
      setIsOtherGuardianCheckout(false);
    } catch (error: any) {
      console.error("[DEBUG CHECKOUT] Falha crítica no checkout:", error);
      alert(`Erro ao liberar criança: ${error.message || "Problema de conexão com o banco."}`);
    } finally {
      setIsProcessing(false);
      globalProgress.stop();
    }
  };

  const handleEndCulto = async () => {
    if (activeCheckins.length > 0) { 
        alert('Libere todas as crianças antes de encerrar o culto.'); 
        setShowEndConfirm(false);
        return; 
    }
    
    if (isProcessing) return;
    setIsProcessing(true);
    globalProgress.start('Encerrando...');

    try {
      const horaFim = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      await storageService.clearPreCheckins(id!);
      await storageService.updateCulto(id!, { 
        status: 'encerrado', 
        horaFim 
      });
      
      // Calculate duration
      let durationStr = 'Duração não disponível';
      if (culto && culto.data && culto.horaInicio) {
        try {
          const startTime = new Date(`${culto.data}T${culto.horaInicio}:00`);
          const endTime = new Date(`${culto.data}T${horaFim}:00`);
          if (endTime < startTime) {
            endTime.setDate(endTime.getDate() + 1); // Crossed midnight
          }
          const diffMs = endTime.getTime() - startTime.getTime();
          if (!isNaN(diffMs)) {
            const diffMinutes = Math.floor(diffMs / 60000);
            const hours = Math.floor(diffMinutes / 60);
            const minutes = diffMinutes % 60;
            
            let dStr = '';
            if (hours > 0) dStr += `${hours}h `;
            if (minutes > 0 || hours === 0) dStr += `${minutes}min`;
            durationStr = dStr.trim();
          }
        } catch (e) {
          console.error("Erro ao calcular duração", e);
        }
      }

      // Count unique checkins
      const uniqueKidsCount = new Set(checkins.map(c => c.idCrianca)).size;

      setSummaryData({
        nome: culto?.tipo === 'Outros' ? (culto.tipoManual || 'Culto') : (culto?.tipo || 'Culto'),
        duration: durationStr,
        count: uniqueKidsCount
      });
      
      setShowEndConfirm(false);
      setShowSummaryModal(true);

    } catch (error) {
      alert("Erro ao finalizar sessão.");
    } finally {
      setIsProcessing(false);
      globalProgress.stop();
    }
  };

  const allCriancasNormalized = useMemo(() => {
    return allCriancas.map(k => ({
      ...k,
      normalizedFullName: normalizeString(`${k.nome} ${k.sobrenome}`)
    }));
  }, [allCriancas]);

  const normalizedSearchTerm = useMemo(() => normalizeString(searchTerm), [searchTerm]);

  const filteredKids = useMemo(() => {
    if (searchTerm.length <= 1) return [];
    return allCriancasNormalized.filter(k => k.normalizedFullName.includes(normalizedSearchTerm));
  }, [allCriancasNormalized, searchTerm, normalizedSearchTerm]);

  if (loading) return <div className="text-center py-10 text-purple-main font-bold">Carregando painel ativo...</div>;

  return (
    <div className="print:p-0 print:m-0 print:space-y-0 space-y-4 pb-8 -mt-2">
      <div id="print-section" className="hidden print:flex flex-col items-center justify-center text-center p-0 m-0 w-[50mm] h-[15mm] overflow-hidden">
        {labelData && (
          <div className="flex flex-col items-center justify-center w-full h-full">
            <h1 className="font-black leading-none uppercase text-black m-0 p-0" style={{ fontSize: '18pt' }}>
              {labelData.kid.nome?.split(' ')[0] || ''}
            </h1>
            <h2 className="font-bold leading-none uppercase text-black m-0 p-0" style={{ fontSize: '14pt' }}>
              {labelData.kid.sobrenome?.split(' ')[0] || ''}
            </h2>
          </div>
        )}
      </div>

      <div className="print:hidden space-y-4">
        <div className="bg-white p-3 px-5 rounded-2xl shadow-sm border-l-8 border-green-500 flex items-center justify-between sticky top-0 z-30">
            <div className="flex items-center gap-3">
              <div className="bg-green-50 px-2 py-0.5 rounded text-[9px] font-black text-green-600 uppercase">ATIVO</div>
              <h1 className="text-lg font-black text-purple-dark uppercase truncate max-w-[150px] sm:max-w-none">
                  {culto?.tipo === 'Outros' ? culto.tipoManual : culto?.tipo}
              </h1>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 bg-purple-main px-3 py-1.5 rounded-xl text-white shadow-sm">
                  <span className="text-sm font-black">{activeCheckins.length}</span>
                  <span className="text-[9px] font-bold opacity-70 uppercase">Kids</span>
              </div>
              <button onClick={() => setShowEndConfirm(true)} className="bg-red-500 hover:bg-red-600 text-white p-1.5 rounded-xl transition-all shadow-sm">
                  {ICONS.LogOut}
              </button>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            <div className="lg:col-span-4 space-y-4">
              <div className={`bg-yellow-main p-4 rounded-2xl shadow-sm transition-all ${timeoutExpired ? 'ring-4 ring-red-500 ring-offset-2' : ''}`}>
                  <h2 className="text-[10px] font-black text-purple-dark mb-2 uppercase flex items-center gap-2">
                  {ICONS.QrCode} Confirmar Código
                  </h2>
                  <div className="flex bg-white rounded-xl overflow-hidden shadow-inner border border-yellow-secondary">
                    <input 
                        type="text" 
                        value={codeQuery}
                        onChange={handleCodeChange}
                        disabled={isProcessingCode}
                        className="flex-1 min-w-0 p-3 font-black text-sm tracking-widest uppercase outline-none disabled:opacity-50"
                    />
                    <button 
                      onClick={handleCodeCheckin} 
                      disabled={isProcessingCode || codeQuery === 'KIDS-'}
                      className="bg-purple-dark text-white px-4 font-black text-[10px] uppercase disabled:opacity-50"
                    >
                      {isProcessingCode ? '...' : 'OK'}
                    </button>
                  </div>
              </div>

              <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-[10px] font-black text-purple-dark uppercase flex items-center gap-2">
                        {ICONS.Search} Busca Manual
                    </h2>
                      <button 
                        onClick={() => {
                          setRegForm({ nome: '', sobrenome: '', dataNascimento: '', observacoes: '' });
                          setResponsaveis([{ nome: '', whatsapp: '', parentesco: 'Pai' }]);
                          setNeurodivergente(null);
                          setNeurodivergenteOpcoes([]);
                          setNeurodivergenteOutro('');
                          setRegistrationSuccess(null);
                          setIsRegistering(true);
                        }}
                        className="text-[9px] font-black text-purple-main uppercase bg-purple-main/10 px-2 py-1 rounded-lg flex items-center gap-1 hover:bg-purple-main hover:text-white transition-all"
                    >
                      {ICONS.Plus} Novo Cadastro
                    </button>
                  </div>
                  <input 
                    type="text" 
                    placeholder="Nome da criança..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-gray-light p-2.5 rounded-xl font-bold mb-2 outline-none border border-transparent focus:border-purple-main text-xs"
                  />
                  <div className="space-y-1 max-h-[140px] overflow-y-auto custom-scrollbar">
                    {filteredKids.map(kid => (
                        <button key={kid.id} onClick={() => handleManualCheckin(kid)} className="w-full flex items-center justify-between p-2 hover:bg-purple-main/5 rounded-lg transition-all text-[11px] font-bold text-gray-700">
                          <span className="truncate">{kid.nome} {kid.sobrenome}</span>
                          <span className="text-purple-main">{ICONS.Plus}</span>
                        </button>
                    ))}
                  </div>
              </div>

              <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                  <h2 className="text-[10px] font-black text-purple-dark uppercase mb-3 flex items-center gap-2">
                      {ICONS.CheckCircle} Checkouts ({finishedCheckins.length})
                  </h2>
                  <div className="space-y-1.5 max-h-[160px] overflow-y-auto custom-scrollbar">
                      {finishedCheckins.map(check => {
                          const kid = allCriancas.find(k => k.id === check.idCrianca);
                          return (
                              <div key={check.id} className="p-2 px-3 bg-gray-50 rounded-xl border border-gray-100 text-[10px]">
                                  <div className="flex justify-between items-center">
                                      <span className="font-black text-purple-dark truncate mr-2">{kid?.nome}</span>
                                      <span className="text-purple-main font-bold">{check.horaSaida}</span>
                                  </div>
                              </div>
                          );
                      })}
                  </div>
              </div>
            </div>

            <div className="lg:col-span-8">
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 min-h-[400px]">
                  <h2 className="text-[10px] font-black text-purple-dark mb-4 uppercase flex items-center gap-2">
                    {ICONS.Baby} Crianças na Sala ({activeCheckins.length})
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {activeCheckins.map(check => {
                        const kid = allCriancas.find(k => k.id === check.idCrianca);
                        return (
                        <div key={check.id} className="bg-gray-light p-2.5 px-3 rounded-xl flex items-center justify-between border border-transparent hover:border-purple-main/10 transition-all">
                            <div className="flex-1 overflow-hidden pr-2">
                                <h4 className="font-black text-purple-dark text-[11px] truncate flex items-center gap-1">
                                  {kid?.nome} {kid?.sobrenome}
                                  {kid && (
                                    <NeurodivergentBadge neurodivergente={kid.neurodivergente} opcoes={kid.neurodivergenteOpcoes} />
                                  )}
                                </h4>
                                <div className="flex items-center gap-2">
                                  <span className="text-[8px] font-bold text-gray-400 uppercase">Entrada: {check.horaEntrada}</span>
                                  {kid?.observacoes && <span className="bg-red-500 text-white text-[7px] font-black px-1 rounded uppercase">!</span>}
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-1">
                                <a 
                                    href={`https://wa.me/55${kid?.whatsapp.split(' | ')[0].replace(/[^\d]/g, '')}`} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-white p-1.5 bg-green-500 rounded-lg shadow-sm active:scale-90 transition-transform flex items-center justify-center"
                                >
                                    {ICONS.WhatsApp}
                                </a>
                                <button onClick={() => triggerLabelPrint(kid!, check)} className="text-purple-main p-1.5 bg-white rounded-lg shadow-sm active:scale-90 transition-transform">
                                  {ICONS.Printer}
                                </button>
                                <button onClick={() => setShowCheckout(check)} className="text-white p-1.5 bg-red-500 rounded-lg shadow-sm active:scale-90 transition-transform">
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

        {pendingCheckinKid && (
            <div className="print:hidden fixed inset-0 z-[100] flex items-center justify-center p-4 bg-purple-dark/60 backdrop-blur-sm overflow-y-auto">
            <div className="bg-white w-full max-w-sm rounded-2xl p-6 shadow-2xl text-center animate-in zoom-in duration-200 my-auto max-h-[90vh] flex flex-col">
                <h2 className="text-sm font-black text-purple-dark mb-4 uppercase flex-shrink-0">Quem poderá retirar?</h2>
                <p className="text-xs font-bold text-gray-500 mb-4 flex-shrink-0">{pendingCheckinKid.nome} {pendingCheckinKid.sobrenome}</p>
                
                <div className="space-y-2 mb-4 text-left overflow-y-auto custom-scrollbar pr-1 flex-1 min-h-0">
                  {pendingCheckinKid.responsaveis?.map((resp, idx) => (
                    <label key={idx} className="flex items-center gap-3 p-3 rounded-xl border-2 border-gray-100 cursor-pointer hover:border-purple-main transition-colors">
                      <input 
                        type="radio" 
                        name="checkinAuth" 
                        value={resp.nome}
                        checked={!isOtherGuardianCheckin && checkinAuthorized === resp.nome}
                        onChange={() => {
                          setIsOtherGuardianCheckin(false);
                          setCheckinAuthorized(resp.nome);
                        }}
                        className="w-4 h-4 text-purple-main"
                      />
                      <span className="text-xs font-bold text-gray-700">{resp.nome} ({resp.parentesco})</span>
                    </label>
                  ))}
                  
                  <label className="flex items-center gap-3 p-3 rounded-xl border-2 border-gray-100 cursor-pointer hover:border-purple-main transition-colors">
                    <input 
                      type="radio" 
                      name="checkinAuth" 
                      checked={isOtherGuardianCheckin}
                      onChange={() => {
                        setIsOtherGuardianCheckin(true);
                        setCheckinAuthorized('');
                      }}
                      className="w-4 h-4 text-purple-main"
                    />
                    <span className="text-xs font-bold text-gray-700">Outro Responsável</span>
                  </label>
                </div>

                {isOtherGuardianCheckin && (
                  <div className="flex-shrink-0 mt-2">
                    <input 
                      type="text" 
                      placeholder="Nome do responsável..." 
                      autoFocus 
                      value={otherGuardianNameCheckin} 
                      onChange={(e) => setOtherGuardianNameCheckin(e.target.value)} 
                      className="w-full bg-gray-light p-3 rounded-xl font-bold mb-4 outline-none border border-transparent focus:border-purple-main text-xs" 
                    />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2 flex-shrink-0 mt-2">
                  <button onClick={() => { setPendingCheckinKid(null); setPendingPreCheckinId(null); }} className="bg-gray-100 text-gray-500 font-black py-3 rounded-xl text-[10px] uppercase">CANCELAR</button>
                  <button onClick={confirmCheckin} disabled={(isOtherGuardianCheckin ? !otherGuardianNameCheckin : !checkinAuthorized) || isProcessing} className="bg-green-500 text-white font-black py-3 rounded-xl shadow-lg disabled:opacity-50 text-[10px] uppercase">{isProcessing ? 'CONFIRMANDO...' : 'CONFIRMAR'}</button>
                </div>
            </div>
            </div>
        )}

        {checkinSuccessData && (
            <div className="print:hidden fixed inset-0 z-[100] flex items-center justify-center p-4 bg-purple-dark/60 backdrop-blur-sm">
            <div className="bg-white w-full max-w-sm rounded-2xl p-6 shadow-2xl text-center animate-in zoom-in duration-200">
                <div className="bg-green-100 text-green-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
                  {ICONS.CheckCircle}
                </div>
                <h2 className="text-lg font-black text-purple-dark mb-2 uppercase">Check-in Concluído!</h2>
                <p className="text-sm font-bold text-gray-500 mb-6">{checkinSuccessData.kid.nome} {checkinSuccessData.kid.sobrenome}</p>
                
                <div className="flex flex-col gap-3">
                  <button onClick={() => {
                    triggerLabelPrint(checkinSuccessData.kid, checkinSuccessData.checkin);
                  }} className="bg-purple-main text-white font-black py-4 rounded-xl shadow-lg text-xs uppercase flex items-center justify-center gap-2">
                    {ICONS.Printer} Emitir Etiqueta
                  </button>
                  <button onClick={() => setCheckinSuccessData(null)} className="bg-gray-100 text-gray-500 font-black py-4 rounded-xl text-xs uppercase">
                    Fechar
                  </button>
                </div>
            </div>
            </div>
        )}

        {showCheckout && (
            <div className="print:hidden fixed inset-0 z-[100] flex items-center justify-center p-4 bg-purple-dark/60 backdrop-blur-sm overflow-y-auto">
            <div className="bg-white w-full max-w-sm rounded-2xl p-6 shadow-2xl text-center animate-in zoom-in duration-200 my-auto max-h-[90vh] flex flex-col">
                <h2 className="text-sm font-black text-purple-dark mb-4 uppercase flex-shrink-0">Quem retirou a criança?</h2>
                
                <div className="space-y-2 mb-4 text-left overflow-y-auto custom-scrollbar pr-1 flex-1 min-h-0">
                  {allCriancas.find(k => k.id === showCheckout.idCrianca)?.responsaveis?.map((resp, idx) => (
                    <label key={idx} className="flex items-center gap-3 p-3 rounded-xl border-2 border-gray-100 cursor-pointer hover:border-purple-main transition-colors">
                      <input 
                        type="radio" 
                        name="checkoutAuth" 
                        value={resp.nome}
                        checked={!isOtherGuardianCheckout && checkoutName === resp.nome}
                        onChange={() => {
                          setIsOtherGuardianCheckout(false);
                          setCheckoutName(resp.nome);
                        }}
                        className="w-4 h-4 text-purple-main"
                      />
                      <span className="text-xs font-bold text-gray-700">{resp.nome} ({resp.parentesco})</span>
                    </label>
                  ))}

                  {showCheckout.autorizadoRetirar && !allCriancas.find(k => k.id === showCheckout.idCrianca)?.responsaveis?.some(r => r.nome === showCheckout.autorizadoRetirar) && (
                    <label className="flex items-center gap-3 p-3 rounded-xl border-2 border-gray-100 cursor-pointer hover:border-purple-main transition-colors">
                      <input 
                        type="radio" 
                        name="checkoutAuth" 
                        value={showCheckout.autorizadoRetirar}
                        checked={!isOtherGuardianCheckout && checkoutName === showCheckout.autorizadoRetirar}
                        onChange={() => {
                          setIsOtherGuardianCheckout(false);
                          setCheckoutName(showCheckout.autorizadoRetirar!);
                        }}
                        className="w-4 h-4 text-purple-main"
                      />
                      <span className="text-xs font-bold text-gray-700">{showCheckout.autorizadoRetirar} (Autorizado no Check-in)</span>
                    </label>
                  )}
                  
                  <label className="flex items-center gap-3 p-3 rounded-xl border-2 border-gray-100 cursor-pointer hover:border-purple-main transition-colors">
                    <input 
                      type="radio" 
                      name="checkoutAuth" 
                      checked={isOtherGuardianCheckout}
                      onChange={() => {
                        setIsOtherGuardianCheckout(true);
                        setCheckoutName('');
                      }}
                      className="w-4 h-4 text-purple-main"
                    />
                    <span className="text-xs font-bold text-gray-700">Outro Responsável</span>
                  </label>
                </div>

                {isOtherGuardianCheckout && (
                  <div className="flex-shrink-0 mt-2">
                    <input 
                      type="text" 
                      placeholder="Nome de quem buscou..." 
                      autoFocus 
                      value={checkoutName} 
                      onChange={(e) => setCheckoutName(e.target.value)} 
                      className="w-full bg-gray-light p-3 rounded-xl font-bold mb-4 outline-none border border-transparent focus:border-purple-main text-xs" 
                    />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2 flex-shrink-0 mt-2">
                  <button onClick={() => { setShowCheckout(null); setCheckoutName(''); setIsOtherGuardianCheckout(false); }} className="bg-gray-100 text-gray-500 font-black py-3 rounded-xl text-[10px] uppercase">VOLTAR</button>
                  <button onClick={handleConfirmCheckout} disabled={!checkoutName || isProcessing} className="bg-green-500 text-white font-black py-3 rounded-xl shadow-lg disabled:opacity-50 text-[10px] uppercase">{isProcessing ? 'CONFIRMANDO...' : 'CONFIRMAR'}</button>
                </div>
            </div>
            </div>
        )}

        {showEndConfirm && (
            <div className="print:hidden fixed inset-0 z-[100] flex items-center justify-center p-4 bg-red-900/60 backdrop-blur-sm">
            <div className="bg-white w-full max-w-xs rounded-2xl p-6 shadow-2xl text-center">
                <h2 className="text-sm font-black text-red-600 mb-2 uppercase">Encerrar Sessão?</h2>
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => setShowEndConfirm(false)} disabled={isProcessing} className="bg-gray-100 text-gray-500 font-black py-3 rounded-xl text-[10px] uppercase disabled:opacity-50">CANCELAR</button>
                  <button onClick={handleEndCulto} disabled={isProcessing} className="bg-red-500 text-white font-black py-3 rounded-xl shadow-lg text-[10px] uppercase disabled:opacity-50">{isProcessing ? 'ENCERRANDO...' : 'ENCERRAR'}</button>
                </div>
            </div>
            </div>
        )}

        {showSummaryModal && summaryData && (
            <div className="print:hidden fixed inset-0 z-[100] flex items-center justify-center p-4 bg-purple-dark/80 backdrop-blur-sm">
            <div className="bg-white w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl text-center animate-in zoom-in duration-300">
                <div className="bg-green-100 text-green-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 text-2xl">
                  {ICONS.CheckCircle}
                </div>
                <h2 className="kids-font text-3xl font-black text-purple-dark mb-8 uppercase tracking-tight">Culto Finalizado</h2>
                
                <div className="space-y-4 mb-8 text-left">
                  <div className="bg-gray-50 p-4 rounded-2xl border-2 border-gray-100 flex justify-between items-center">
                    <span className="text-xs font-black uppercase text-gray-500">Nome do culto:</span>
                    <span className="text-sm font-black text-purple-dark truncate max-w-[60%]">{summaryData.nome}</span>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-2xl border-2 border-gray-100 flex justify-between items-center">
                    <span className="text-xs font-black uppercase text-gray-500">Tempo de duração:</span>
                    <span className="text-sm font-black text-purple-dark">{summaryData.duration}</span>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-2xl border-2 border-gray-100 flex justify-between items-center">
                    <span className="text-xs font-black uppercase text-gray-500">Crianças que fizeram check-in:</span>
                    <span className="text-xl font-black text-purple-main">{summaryData.count}</span>
                  </div>
                </div>

                <button 
                  onClick={() => {
                    setShowSummaryModal(false);
                    navigate('/cultos');
                  }} 
                  className="w-full bg-purple-main text-white font-black py-5 rounded-[2rem] shadow-xl text-sm uppercase tracking-widest hover:bg-purple-dark transition-all"
                >
                  FECHAR
                </button>
            </div>
            </div>
        )}

        {isRegistering && (
          <div className="print:hidden fixed inset-0 z-[100] flex items-center justify-center p-4 bg-purple-dark/80 backdrop-blur-sm overflow-y-auto">
            <div className="bg-white w-full max-w-2xl rounded-[2.5rem] p-4 sm:p-8 shadow-2xl overflow-y-auto my-auto max-h-[90vh] animate-in zoom-in duration-300">
              {registrationSuccess ? (
                <div className="text-center py-8">
                  <div className="bg-green-100 text-green-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 text-2xl">
                    {ICONS.CheckCircle}
                  </div>
                  <h2 className="text-2xl font-black text-purple-dark mb-2 uppercase tracking-tight">Sucesso!</h2>
                  <p className="text-sm font-bold text-gray-500 mb-8">Cadastro realizado com sucesso.</p>
                  
                  <div className="flex flex-col gap-3">
                    <button 
                      onClick={() => {
                        handleManualCheckin(registrationSuccess);
                        setIsRegistering(false);
                        setRegistrationSuccess(null);
                      }}
                      className="bg-purple-main text-white font-black py-4 rounded-2xl shadow-xl hover:bg-purple-dark transition-all text-xs uppercase tracking-widest flex items-center justify-center gap-2"
                    >
                      {ICONS.CheckCircle} Adicionar criança ao culto
                    </button>
                    <button 
                      onClick={() => {
                        setIsRegistering(false);
                        setRegistrationSuccess(null);
                      }}
                      className="bg-gray-100 text-gray-500 font-black py-4 rounded-2xl hover:bg-gray-200 transition-all text-xs uppercase tracking-widest"
                    >
                      Voltar ao Painel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-black text-purple-dark uppercase tracking-tight">Novo Cadastro</h2>
                    <button onClick={() => setIsRegistering(false)} className="text-gray-400 hover:text-red-500 p-2">
                      {ICONS.X}
                    </button>
                  </div>
                  
                  <form onSubmit={handleSaveNewKid} className="space-y-5">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase text-gray-400 px-1">Nome</label>
                        <input required placeholder="Ex: Lucas" value={regForm.nome} onChange={e => setRegForm({...regForm, nome: e.target.value})} className="w-full bg-gray-light p-3.5 rounded-xl font-bold text-sm border-2 border-transparent focus:border-purple-main outline-none" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase text-gray-400 px-1">Sobrenome</label>
                        <input required placeholder="Ex: Silva" value={regForm.sobrenome} onChange={e => setRegForm({...regForm, sobrenome: e.target.value})} className="w-full bg-gray-light p-3.5 rounded-xl font-bold text-sm border-2 border-transparent focus:border-purple-main outline-none" />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase text-gray-400 px-1">Nascimento</label>
                        <input required type="date" value={regForm.dataNascimento} onChange={e => setRegForm({...regForm, dataNascimento: e.target.value})} className="w-full bg-gray-light p-3.5 rounded-xl font-bold text-sm border-2 border-transparent focus:border-purple-main outline-none" />
                      </div>
                    </div>

                    <div className="mt-6 mb-4">
                      <h3 className="text-sm font-black text-purple-dark uppercase tracking-widest border-b-2 border-gray-100 pb-2 mb-4">Responsáveis</h3>
                      
                      {responsaveis.map((resp, index) => (
                        <div key={index} className="bg-gray-50 p-4 rounded-2xl mb-4 border border-gray-200 relative">
                          {index > 0 && (
                            <button 
                              type="button" 
                              onClick={() => removeResponsavel(index)}
                              className="absolute top-3 right-3 text-red-500 hover:text-red-700 p-1"
                            >
                              {ICONS.Trash}
                            </button>
                          )}
                          <h4 className="text-[10px] font-black text-purple-main uppercase tracking-widest mb-3">Responsável {index + 1} {index === 0 && '(Principal)'}</h4>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                            <div>
                              <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5 px-1">Nome</label>
                              <input required type="text" value={resp.nome} onChange={e => handleResponsavelChange(index, 'nome', e.target.value)} className="w-full bg-white p-3.5 rounded-xl font-bold border-2 border-transparent focus:border-purple-main outline-none text-sm shadow-sm" placeholder="Ex: João" />
                            </div>
                            <div>
                              <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5 px-1">Parentesco</label>
                              <select required value={resp.parentesco} onChange={e => handleResponsavelChange(index, 'parentesco', e.target.value)} className="w-full bg-white p-3.5 rounded-xl font-bold border-2 border-transparent focus:border-purple-main outline-none text-sm shadow-sm appearance-none">
                                <option value="Pai">Pai</option>
                                <option value="Mãe">Mãe</option>
                                <option value="Avô/Avó">Avô/Avó</option>
                                <option value="Tio/Tia">Tio/Tia</option>
                                <option value="Outro">Outro</option>
                              </select>
                            </div>
                          </div>
                          <div>
                            <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5 px-1">WhatsApp</label>
                            <input required type="tel" value={resp.whatsapp} onChange={e => handleResponsavelChange(index, 'whatsapp', e.target.value)} className="w-full bg-white p-3.5 rounded-xl font-bold border-2 border-transparent focus:border-purple-main outline-none text-sm shadow-sm" placeholder="(67) 99999-9999" />
                          </div>
                        </div>
                      ))}

                      {responsaveis.length < 3 && (
                        <button 
                          type="button" 
                          onClick={addResponsavel}
                          className="w-full border-2 border-dashed border-purple-main text-purple-main font-black py-3 rounded-2xl hover:bg-purple-50 transition-all text-xs uppercase tracking-widest flex items-center justify-center gap-2"
                        >
                          {ICONS.Plus} Adicionar outro responsável
                        </button>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase text-gray-400 px-1">Observações Médicas</label>
                      <textarea rows={2} placeholder="Alergias, restrições..." value={regForm.observacoes} onChange={e => setRegForm({...regForm, observacoes: e.target.value})} className="w-full bg-gray-light p-3.5 rounded-xl font-bold text-sm resize-none border-2 border-transparent focus:border-purple-main outline-none" />
                    </div>

                    <div className="bg-gray-50 p-5 rounded-[2rem] border-2 border-gray-100 mt-4">
                      <label className="block text-[10px] font-black text-purple-main uppercase tracking-widest mb-3 px-1">A criança é neurodivergente?</label>
                      <div className="flex gap-4">
                        <button
                          type="button"
                          onClick={() => handleNeuroChange(true)}
                          className={`flex-1 py-3 px-4 rounded-xl font-black text-sm uppercase tracking-widest transition-all ${neurodivergente === true ? 'bg-purple-main text-white shadow-md' : 'bg-white border-2 border-gray-200 text-gray-400 hover:border-purple-300'}`}
                        >
                          SIM
                        </button>
                        <button
                          type="button"
                          onClick={() => handleNeuroChange(false)}
                          className={`flex-1 py-3 px-4 rounded-xl font-black text-sm uppercase tracking-widest transition-all ${neurodivergente === false ? 'bg-purple-main text-white shadow-md' : 'bg-white border-2 border-gray-200 text-gray-400 hover:border-purple-300'}`}
                        >
                          NÃO
                        </button>
                      </div>

                      {neurodivergente === true && (
                        <div className="mt-4 animate-in fade-in slide-in-from-top-2">
                          <div className="grid grid-cols-2 md:flex md:flex-wrap gap-3 mb-4">
                            {['TEA', 'TDAH'].map(opcao => (
                              <label key={opcao} className="flex items-center gap-2 cursor-pointer bg-white px-4 py-2 rounded-xl border-2 border-gray-100 hover:border-purple-200 transition-colors justify-center md:justify-start">
                                <input 
                                  type="checkbox" 
                                  checked={neurodivergenteOpcoes.includes(opcao)}
                                  onChange={() => toggleNeuroOpcao(opcao)}
                                  className="w-4 h-4 accent-purple-main"
                                />
                                <span className="font-bold text-sm text-gray-600">{opcao}</span>
                              </label>
                            ))}
                            <label className="col-span-2 flex items-center gap-2 cursor-pointer bg-white px-4 py-2 rounded-xl border-2 border-gray-100 hover:border-purple-200 transition-colors justify-center md:justify-start md:w-auto w-full">
                              <input 
                                type="checkbox" 
                                checked={neurodivergenteOpcoes.includes('Outro')}
                                onChange={() => toggleNeuroOpcao('Outro')}
                                className="w-4 h-4 accent-purple-main"
                              />
                              <span className="font-bold text-sm text-gray-600">Outro</span>
                            </label>
                          </div>
                          
                          {neurodivergenteOpcoes.includes('Outro') && (
                            <div className="animate-in fade-in zoom-in duration-200">
                              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Informe qual:</label>
                              <input 
                                required 
                                type="text" 
                                value={neurodivergenteOutro} 
                                onChange={e => setNeurodivergenteOutro(e.target.value)} 
                                className="w-full bg-white p-4 rounded-2xl font-bold border-2 border-gray-200 focus:border-purple-main transition-colors outline-none text-sm shadow-sm" 
                                placeholder="Digite aqui..." 
                              />
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    
                    <button type="submit" disabled={isProcessing} className="w-full bg-purple-main text-white font-black py-4 rounded-2xl shadow-xl text-xs uppercase tracking-widest hover:bg-purple-dark transition-colors mt-4 disabled:opacity-50">
                      {isProcessing ? 'SALVANDO...' : 'SALVAR CADASTRO'}
                    </button>
                  </form>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CultoAtivo;
