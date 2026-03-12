
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ICONS } from '../constants';
import { storageService } from '../services/storageService';
import { Crianca, CheckIn, Culto, PreCheckIn, Responsavel } from '../types';

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
  const [timeoutExpired, setTimeoutExpired] = useState(false);

  // Estados para modal de check-in
  const [pendingCheckinKid, setPendingCheckinKid] = useState<Crianca | null>(null);
  const [pendingPreCheckinId, setPendingPreCheckinId] = useState<string | null>(null);
  const [checkinAuthorized, setCheckinAuthorized] = useState('');
  const [isOtherGuardianCheckin, setIsOtherGuardianCheckin] = useState(false);
  const [otherGuardianNameCheckin, setOtherGuardianNameCheckin] = useState('');

  // Estados para novo cadastro dentro do culto
  const [isRegistering, setIsRegistering] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState<Crianca | null>(null);
  const [regForm, setRegForm] = useState({
    nome: '', sobrenome: '', dataNascimento: '', observacoes: ''
  });
  const [responsaveis, setResponsaveis] = useState<Responsavel[]>([
    { nome: '', whatsapp: '', parentesco: 'Pai' }
  ]);

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

  const activeCheckins = checkins.filter(c => c.status === 'presente');
  const finishedCheckins = checkins.filter(c => c.status === 'saiu');

  const triggerLabelPrint = (kid: Crianca, checkin: CheckIn) => {
    setLabelData({ kid, checkin });
    setTimeout(() => {
        window.print();
        setLabelData(null);
    }, 500);
  };

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
    if (!pendingCheckinKid) return;
    const authorized = isOtherGuardianCheckin ? otherGuardianNameCheckin : checkinAuthorized;
    if (!authorized) {
      alert('Selecione ou informe quem poderá retirar a criança.');
      return;
    }

    const newCheck: Omit<CheckIn, 'id'> = {
      idCrianca: pendingCheckinKid.id,
      idCulto: id!,
      horaEntrada: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      autorizadoRetirar: authorized,
      status: 'presente'
    };
    try {
      await storageService.addCheckin(newCheck);
      const updatedCheckins = await storageService.getCheckins(id!);
      const lastCheck = updatedCheckins.find(c => c.idCrianca === pendingCheckinKid.id && c.status === 'presente');
      if (lastCheck) triggerLabelPrint(pendingCheckinKid, lastCheck);
      
      if (pendingPreCheckinId) {
        await storageService.updatePreCheckin(pendingPreCheckinId, { 
          status: 'confirmado', 
          dataHoraCheckin: new Date().toISOString() 
        });
      }

      setSearchTerm('');
      setCodeQuery('KIDS-');
      setPendingCheckinKid(null);
      setPendingPreCheckinId(null);
    } catch (e: any) {
      if (e.message === "ALREADY_PRESENT") {
        alert(`${pendingCheckinKid.nome} já está na sala.`);
      } else {
        alert(e.message || "Erro ao realizar check-in.");
      }
    }
  };

  const handleCodeCheckin = async () => {
    if (isProcessingCode) return;
    
    const code = codeQuery.trim().toUpperCase();
    if (code === 'KIDS-') return;

    setIsProcessingCode(true);
    setTimeoutExpired(false);

    let kidInserted = false;
    
    const timeoutId = setTimeout(() => {
        if (!kidInserted) {
            console.warn(`[DEBUG PreCheckIn] TIMEOUT para o código: ${code}`);
            setTimeoutExpired(true);
            setIsProcessingCode(false);
        }
    }, 8000);
    
    console.group(`[DEBUG PreCheckIn] Processando código: ${code}`);
    try {
      const pre = preCheckins.find(p => {
          const matchCode = p.codigo.trim().toUpperCase() === code;
          const matchStatus = p.status === 'pendente';
          const matchCulto = String(p.idCulto) === String(id);
          return matchCode && matchStatus && matchCulto;
      });
      
      if (!pre) { 
        clearTimeout(timeoutId);
        alert('Código não encontrado ou já confirmado.'); 
        setIsProcessingCode(false);
        console.groupEnd();
        return; 
      }

      const kid = allCriancas.find(k => k.id === pre.idCrianca);
      if (kid) {
        if (activeCheckins.some(c => c.idCrianca === kid.id)) {
          kidInserted = true;
          clearTimeout(timeoutId);
          await storageService.updatePreCheckin(pre.id, { status: 'confirmado' });
          setCodeQuery('KIDS-');
          setIsProcessingCode(false);
          console.groupEnd();
          return;
        }

        handleManualCheckin(kid, pre.id);
        kidInserted = true;
        clearTimeout(timeoutId);
        setIsProcessingCode(false);
        console.groupEnd();
        return;
      } else {
        clearTimeout(timeoutId);
        setIsProcessingCode(false);
      }
    } catch (error) {
      clearTimeout(timeoutId);
      setIsProcessingCode(false);
    }
    console.groupEnd();
  };

  const handleSaveNewKid = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const newKidData: Omit<Crianca, 'id'> = {
        ...regForm,
        responsavelNome: '',
        whatsapp: '',
        responsaveis,
        createdAt: new Date().toISOString()
      };
      const createdKid = await storageService.addCrianca(newKidData);
      setRegistrationSuccess(createdKid);
      setAllCriancas(prev => [...prev, createdKid].sort((a,b) => a.nome.localeCompare(b.nome)));
    } catch (error) {
      alert("Erro ao salvar cadastro.");
    }
  };

  const handleConfirmCheckout = async () => {
    if (!showCheckout) return;
    const retirou = isOtherGuardianCheckout ? checkoutName : checkoutName;
    if (!retirou) {
      alert('Selecione ou informe quem retirou a criança.');
      return;
    }
    
    console.log("[DEBUG CHECKOUT] Iniciando processo para ID:", showCheckout.id);
    
    try {
      await storageService.updateCheckin(showCheckout.id, {
        status: 'saiu',
        horaSaida: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        quemRetirou: retirou
      });
      
      console.log("[DEBUG CHECKOUT] Chamada de serviço concluída com sucesso.");
      setShowCheckout(null);
      setCheckoutName('');
      setIsOtherGuardianCheckout(false);
    } catch (error: any) {
      console.error("[DEBUG CHECKOUT] Falha crítica no checkout:", error);
      alert(`Erro ao liberar criança: ${error.message || "Problema de conexão com o banco."}`);
    }
  };

  const handleEndCulto = async () => {
    if (activeCheckins.length > 0) { 
        alert('Libere todas as crianças antes de encerrar o culto.'); 
        setShowEndConfirm(false);
        return; 
    }
    
    try {
      await storageService.clearPreCheckins(id!);
      await storageService.updateCulto(id!, { 
        status: 'encerrado', 
        horaFim: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) 
      });
      navigate('/cultos');
    } catch (error) {
      alert("Erro ao finalizar sessão.");
    }
  };

  const filteredKids = searchTerm.length > 1 
    ? allCriancas.filter(k => (k.nome + ' ' + k.sobrenome).toLowerCase().includes(searchTerm.toLowerCase()))
    : [];

  if (loading) return <div className="text-center py-10 text-purple-main font-bold">Carregando painel ativo...</div>;

  return (
    <div className="space-y-4 pb-8 -mt-2">
      <div id="print-section" className="hidden flex-col items-center justify-center text-center p-4">
        {labelData && (
          <div className="flex flex-col items-center w-full">
            <h1 className="font-black leading-tight uppercase" style={{ fontSize: '28pt' }}>{labelData.kid.nome}</h1>
            <h2 className="font-bold leading-tight uppercase opacity-70" style={{ fontSize: '18pt' }}>{labelData.kid.sobrenome}</h2>
            <div className="w-full border-t-2 border-black my-6"></div>
            <p className="font-black" style={{ fontSize: '14pt' }}>Resp: {labelData.kid.responsavelNome.split(' | ')[0]}</p>
            {labelData.checkin.autorizadoRetirar && (
              <p className="font-bold mt-2" style={{ fontSize: '12pt' }}>Autorizado: {labelData.checkin.autorizadoRetirar}</p>
            )}
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
                                <h4 className="font-black text-purple-dark text-[11px] truncate">{kid?.nome} {kid?.sobrenome}</h4>
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
                                  {ICONS.QrCode}
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
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-purple-dark/60 backdrop-blur-sm">
            <div className="bg-white w-full max-w-sm rounded-2xl p-6 shadow-2xl text-center animate-in zoom-in duration-200">
                <h2 className="text-sm font-black text-purple-dark mb-4 uppercase">Quem poderá retirar?</h2>
                <p className="text-xs font-bold text-gray-500 mb-4">{pendingCheckinKid.nome} {pendingCheckinKid.sobrenome}</p>
                
                <div className="space-y-2 mb-4 text-left">
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
                  <input 
                    type="text" 
                    placeholder="Nome do responsável temporário..." 
                    autoFocus 
                    value={otherGuardianNameCheckin} 
                    onChange={(e) => setOtherGuardianNameCheckin(e.target.value)} 
                    className="w-full bg-gray-light p-3 rounded-xl font-bold mb-4 outline-none border border-transparent focus:border-purple-main text-xs" 
                  />
                )}

                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => { setPendingCheckinKid(null); setPendingPreCheckinId(null); }} className="bg-gray-100 text-gray-500 font-black py-3 rounded-xl text-[10px] uppercase">CANCELAR</button>
                  <button onClick={confirmCheckin} disabled={isOtherGuardianCheckin ? !otherGuardianNameCheckin : !checkinAuthorized} className="bg-green-500 text-white font-black py-3 rounded-xl shadow-lg disabled:opacity-50 text-[10px] uppercase">CONFIRMAR</button>
                </div>
            </div>
            </div>
        )}

        {showCheckout && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-purple-dark/60 backdrop-blur-sm">
            <div className="bg-white w-full max-w-sm rounded-2xl p-6 shadow-2xl text-center animate-in zoom-in duration-200">
                <h2 className="text-sm font-black text-purple-dark mb-4 uppercase">Quem retirou a criança?</h2>
                
                <div className="space-y-2 mb-4 text-left">
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
                  <input 
                    type="text" 
                    placeholder="Nome de quem buscou..." 
                    autoFocus 
                    value={checkoutName} 
                    onChange={(e) => setCheckoutName(e.target.value)} 
                    className="w-full bg-gray-light p-3 rounded-xl font-bold mb-4 outline-none border border-transparent focus:border-purple-main text-xs" 
                  />
                )}

                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => { setShowCheckout(null); setCheckoutName(''); setIsOtherGuardianCheckout(false); }} className="bg-gray-100 text-gray-500 font-black py-3 rounded-xl text-[10px] uppercase">VOLTAR</button>
                  <button onClick={handleConfirmCheckout} disabled={!checkoutName} className="bg-green-500 text-white font-black py-3 rounded-xl shadow-lg disabled:opacity-50 text-[10px] uppercase">CONFIRMAR</button>
                </div>
            </div>
            </div>
        )}

        {showEndConfirm && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-red-900/60 backdrop-blur-sm">
            <div className="bg-white w-full max-w-xs rounded-2xl p-6 shadow-2xl text-center">
                <h2 className="text-sm font-black text-red-600 mb-2 uppercase">Encerrar Sessão?</h2>
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => setShowEndConfirm(false)} className="bg-gray-100 text-gray-500 font-black py-3 rounded-xl text-[10px] uppercase">CANCELAR</button>
                  <button onClick={handleEndCulto} className="bg-red-500 text-white font-black py-3 rounded-xl shadow-lg text-[10px] uppercase">ENCERRAR</button>
                </div>
            </div>
            </div>
        )}

        {isRegistering && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-purple-dark/80 backdrop-blur-sm">
            <div className="bg-white w-full max-w-2xl rounded-[2.5rem] p-8 shadow-2xl overflow-y-auto max-h-[90vh] animate-in zoom-in duration-300">
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
                    
                    <button type="submit" className="w-full bg-purple-main text-white font-black py-4 rounded-2xl shadow-xl text-xs uppercase tracking-widest hover:bg-purple-dark transition-colors mt-4">
                      SALVAR CADASTRO
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
