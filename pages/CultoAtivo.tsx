
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
  const [isProcessingCode, setIsProcessingCode] = useState(false);
  const [timeoutExpired, setTimeoutExpired] = useState(false);

  // Estados para novo cadastro dentro do culto
  const [isRegistering, setIsRegistering] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState<Crianca | null>(null);
  const [regForm, setRegForm] = useState({
    nome: '', sobrenome: '', dataNascimento: '', responsavelNome: '', whatsapp: '', observacoes: ''
  });

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
      alert('Aviso enviado ao celular do responsável!');
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
    // Validação preventiva local
    if (activeCheckins.some(c => c.idCrianca === kid.id)) {
      alert(`${kid.nome} já está na sala.`);
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
      // O estado checkins será atualizado via subscription
      const updatedCheckins = await storageService.getCheckins(id!);
      const lastCheck = updatedCheckins.find(c => c.idCrianca === kid.id && c.status === 'presente');
      if (lastCheck) triggerLabelPrint(kid, lastCheck);
      setSearchTerm('');
    } catch (e: any) {
      if (e.message === "ALREADY_PRESENT") {
        alert(`${kid.nome} já está na sala.`);
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

    // Variável para rastrear se a criança foi inserida
    let kidInserted = false;
    
    // Timer de 8 segundos para timeout
    const timeoutId = setTimeout(() => {
        if (!kidInserted) {
            console.warn(`[DEBUG PreCheckIn] TIMEOUT de 8 segundos atingido para o código: ${code}`);
            setTimeoutExpired(true);
            setIsProcessingCode(false);
        }
    }, 8000);
    
    console.group(`[DEBUG PreCheckIn] Processando código: ${code}`);
    try {
      console.log(`[DEBUG PreCheckIn] Buscando em ${preCheckins.length} pré-checkins carregados.`);
      
      const pre = preCheckins.find(p => {
          const matchCode = p.codigo.trim().toUpperCase() === code;
          const matchStatus = p.status === 'pendente';
          const matchCulto = String(p.idCulto) === String(id);
          
          if (matchCode) {
            console.log(`[DEBUG PreCheckIn] Match de código encontrado! Status: ${p.status}, CultoID: ${p.idCulto} (Atual: ${id})`);
          }
          
          return matchCode && matchStatus && matchCulto;
      });
      
      if (!pre) { 
        console.error(`[DEBUG PreCheckIn] Código ${code} não encontrado nos critérios: Pendente + Culto ${id}`);
        console.table(preCheckins.map(p => ({ codigo: p.codigo, status: p.status, id_culto: p.idCulto })));
        
        clearTimeout(timeoutId);
        alert('Código não encontrado ou já confirmado.'); 
        setIsProcessingCode(false);
        console.groupEnd();
        return; 
      }

      const kid = allCriancas.find(k => k.id === pre.idCrianca);
      if (kid) {
        console.log(`[DEBUG PreCheckIn] Criança identificada: ${kid.nome} ${kid.sobrenome} (ID: ${kid.id})`);
        
        // Se já está na sala, apenas confirma o código
        if (activeCheckins.some(c => c.idCrianca === kid.id)) {
          console.log(`[DEBUG PreCheckIn] Criança já presente na sala. Apenas confirmando o código.`);
          kidInserted = true;
          clearTimeout(timeoutId);
          await storageService.updatePreCheckin(pre.id, { status: 'confirmado' });
          setCodeQuery('KIDS-');
          setIsProcessingCode(false);
          console.groupEnd();
          return;
        }

        // Realiza o check-in
        console.log(`[DEBUG PreCheckIn] Executando handleManualCheckin para inserir no culto.`);
        await handleManualCheckin(kid);
        kidInserted = true;
        clearTimeout(timeoutId);
        
        console.log(`[DEBUG PreCheckIn] Atualizando status do pré-checkin para CONFIRMADO no banco.`);
        await storageService.updatePreCheckin(pre.id, { 
          status: 'confirmado', 
          dataHoraCheckin: new Date().toISOString() 
        });
        
        setCodeQuery('KIDS-');
        setIsProcessingCode(false);
        console.log(`[DEBUG PreCheckIn] Processo concluído com sucesso.`);
      } else {
        console.error(`[DEBUG PreCheckIn] ERRO FATAL: Criança com ID ${pre.idCrianca} não encontrada na lista geral de crianças.`);
        clearTimeout(timeoutId);
        setIsProcessingCode(false);
      }
    } catch (error) {
      clearTimeout(timeoutId);
      console.error("[DEBUG PreCheckIn] ERRO DURANTE O PROCESSAMENTO:", error);
      setIsProcessingCode(false);
    }
    console.groupEnd();
  };

  const handleSaveNewKid = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const newKidData: Omit<Crianca, 'id'> = {
        ...regForm,
        createdAt: new Date().toISOString()
      };
      const createdKid = await storageService.addCrianca(newKidData);
      setRegistrationSuccess(createdKid);
      setAllCriancas(prev => [...prev, createdKid].sort((a,b) => a.nome.localeCompare(b.nome)));
    } catch (error) {
      alert("Erro ao salvar cadastro. Verifique os dados.");
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
        alert('Libere todas as crianças antes de encerrar o culto.'); 
        setShowEndConfirm(false);
        return; 
    }
    
    try {
      await storageService.clearNotificacoes(id!);
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
            <p className="font-black" style={{ fontSize: '14pt' }}>Resp: {labelData.kid.responsavelNome}</p>
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

                  {timeoutExpired && (
                    <div className="mt-4 p-3 bg-white/90 rounded-xl border border-red-200 animate-in fade-in slide-in-from-top-2 duration-300">
                      <p className="text-[9px] font-black text-red-600 uppercase mb-2 leading-tight">O tempo de espera expirou (8s). A conexão pode estar lenta.</p>
                      <div className="flex flex-col gap-1.5">
                        <button 
                          onClick={() => {
                            setTimeoutExpired(false);
                            handleCodeCheckin();
                          }}
                          className="w-full bg-purple-main text-white py-2 rounded-lg text-[9px] font-black uppercase"
                        >
                          Tentar novamente
                        </button>
                        <button 
                          onClick={() => {
                            setTimeoutExpired(false);
                            setSearchTerm(''); // Foca na busca manual
                          }}
                          className="w-full bg-gray-100 text-gray-500 py-2 rounded-lg text-[9px] font-black uppercase"
                        >
                          Incluir manualmente no culto
                        </button>
                      </div>
                    </div>
                  )}
              </div>

              <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-[10px] font-black text-purple-dark uppercase flex items-center gap-2">
                        {ICONS.Search} Busca Manual
                    </h2>
                    <button 
                      onClick={() => {
                        setRegForm({ nome: '', sobrenome: '', dataNascimento: '', responsavelNome: '', whatsapp: '', observacoes: '' });
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
                        const hasPreCheckin = preCheckins.some(p => p.idCrianca === check.idCrianca && p.idCulto === id && p.status === 'confirmado');
                        
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
                                    href={`https://wa.me/55${kid?.whatsapp.replace(/[^\d]/g, '')}`} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-white p-1.5 bg-green-500 rounded-lg shadow-sm active:scale-90 transition-transform flex items-center justify-center"
                                    title="WhatsApp dos Pais"
                                >
                                    {ICONS.WhatsApp}
                                </a>
                                <button onClick={() => triggerLabelPrint(kid!, check)} className="text-purple-main p-1.5 bg-white rounded-lg shadow-sm active:scale-90 transition-transform">
                                  {ICONS.QrCode}
                                </button>
                                {hasPreCheckin && (
                                    <button onClick={() => handleSendNotification(kid!.id)} className="text-purple-dark p-1.5 bg-yellow-main rounded-lg shadow-sm active:scale-90 transition-transform">
                                      {ICONS.Info}
                                    </button>
                                )}
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

        {/* Modal Cadastro de Criança Contextual (Dentro do Culto) */}
        {isRegistering && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-6 bg-purple-dark/80 backdrop-blur-md">
            <div className="bg-white w-full max-w-xl rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in duration-300 overflow-y-auto max-h-[90vh]">
              {!registrationSuccess ? (
                <>
                  <h2 className="text-xl font-black text-purple-dark mb-6 uppercase tracking-tight">Cadastro Rápido</h2>
                  <form onSubmit={handleSaveNewKid} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-[9px] font-black uppercase text-gray-400 mb-1 block">Nome</label>
                        <input required value={regForm.nome} onChange={e => setRegForm({...regForm, nome: e.target.value})} className="w-full bg-gray-light p-3 rounded-xl font-bold text-xs outline-none border-2 border-transparent focus:border-purple-main" />
                      </div>
                      <div>
                        <label className="text-[9px] font-black uppercase text-gray-400 mb-1 block">Sobrenome</label>
                        <input required value={regForm.sobrenome} onChange={e => setRegForm({...regForm, sobrenome: e.target.value})} className="w-full bg-gray-light p-3 rounded-xl font-bold text-xs outline-none border-2 border-transparent focus:border-purple-main" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-[9px] font-black uppercase text-gray-400 mb-1 block">Nascimento</label>
                        <input type="date" required value={regForm.dataNascimento} onChange={e => setRegForm({...regForm, dataNascimento: e.target.value})} className="w-full bg-gray-light p-3 rounded-xl font-bold text-xs outline-none border-2 border-transparent focus:border-purple-main" />
                      </div>
                      <div>
                        <label className="text-[9px] font-black uppercase text-gray-400 mb-1 block">Responsável</label>
                        <input required value={regForm.responsavelNome} onChange={e => setRegForm({...regForm, responsavelNome: e.target.value})} className="w-full bg-gray-light p-3 rounded-xl font-bold text-xs outline-none border-2 border-transparent focus:border-purple-main" />
                      </div>
                    </div>
                    <div>
                      <label className="text-[9px] font-black uppercase text-gray-400 mb-1 block">WhatsApp</label>
                      <input required value={regForm.whatsapp} onChange={e => setRegForm({...regForm, whatsapp: formatPhone(e.target.value)})} className="w-full bg-gray-light p-3 rounded-xl font-bold text-xs outline-none border-2 border-transparent focus:border-purple-main" />
                    </div>
                    <div className="grid grid-cols-2 gap-3 pt-4">
                      <button type="button" onClick={() => setIsRegistering(false)} className="bg-gray-100 text-gray-500 font-black py-4 rounded-xl text-[10px] uppercase">CANCELAR</button>
                      <button type="submit" className="bg-purple-main text-white font-black py-4 rounded-xl shadow-lg text-[10px] uppercase">SALVAR DADOS</button>
                    </div>
                  </form>
                </>
              ) : (
                <div className="text-center py-6">
                  <div className="bg-green-100 text-green-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
                    {ICONS.CheckCircle}
                  </div>
                  <h2 className="text-xl font-black text-purple-dark mb-2 uppercase">CADASTRO REALIZADO!</h2>
                  <p className="text-xs font-bold text-gray-500 mb-8">Criança cadastrada com sucesso no sistema.</p>
                  
                  <div className="flex flex-col gap-3">
                    <button 
                      onClick={() => {
                        handleManualCheckin(registrationSuccess);
                        setIsRegistering(false);
                      }}
                      className="w-full bg-green-500 text-white font-black py-5 rounded-2xl shadow-xl text-xs uppercase tracking-widest hover:scale-[1.02] transition-transform"
                    >
                      👉 Adicionar criança ao culto
                    </button>
                    <button 
                      onClick={() => setIsRegistering(false)}
                      className="w-full bg-gray-100 text-gray-400 font-black py-4 rounded-2xl text-[10px] uppercase"
                    >
                      APENAS FECHAR
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {showCheckout && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-purple-dark/60 backdrop-blur-sm">
            <div className="bg-white w-full max-w-xs rounded-2xl p-6 shadow-2xl text-center">
                <h2 className="text-sm font-black text-purple-dark mb-4 uppercase">Liberar Criança</h2>
                <input type="text" placeholder="Nome de quem buscou..." autoFocus value={checkoutName} onChange={(e) => setCheckoutName(e.target.value)} className="w-full bg-gray-light p-3 rounded-xl font-bold mb-4 outline-none border border-transparent focus:border-purple-main text-xs" />
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => setShowCheckout(null)} className="bg-gray-100 text-gray-500 font-black py-3 rounded-xl text-[10px] uppercase">VOLTAR</button>
                  <button onClick={handleConfirmCheckout} disabled={!checkoutName} className="bg-green-500 text-white font-black py-3 rounded-xl shadow-lg disabled:opacity-50 text-[10px] uppercase">CONFIRMAR</button>
                </div>
            </div>
            </div>
        )}

        {showEndConfirm && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-red-900/60 backdrop-blur-sm">
            <div className="bg-white w-full max-w-xs rounded-2xl p-6 shadow-2xl text-center">
                <h2 className="text-sm font-black text-red-600 mb-2 uppercase">Encerrar Sessão?</h2>
                <p className="text-[10px] font-bold text-gray-500 mb-6">Esta ação limpa os códigos temporários.</p>
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => setShowEndConfirm(false)} className="bg-gray-100 text-gray-500 font-black py-3 rounded-xl text-[10px] uppercase">CANCELAR</button>
                  <button onClick={handleEndCulto} className="bg-red-500 text-white font-black py-3 rounded-xl shadow-lg text-[10px] uppercase">ENCERRAR</button>
                </div>
            </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default CultoAtivo;
