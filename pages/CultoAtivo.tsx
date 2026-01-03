
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ICONS } from '../constants';
import { storageService } from '../services/storageService';
import { Crianca, CheckIn, Culto, PreCheckIn } from '../types';

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
      const updatedCheckins = await storageService.getCheckins(id!);
      const lastCheck = updatedCheckins.find(c => c.idCrianca === kid.id && c.status === 'presente');
      if (lastCheck) triggerLabelPrint(kid, lastCheck);
      setSearchTerm('');
    } catch (e) {
      alert("Erro ao realizar check-in.");
    }
  };

  const handleCodeCheckin = async () => {
    const code = codeQuery.trim().toUpperCase();
    
    const pre = preCheckins.find(p => {
        const matchCode = p.codigo.trim().toUpperCase() === code;
        const matchStatus = p.status === 'pendente';
        const matchCulto = String(p.idCulto) === String(id);
        return matchCode && matchStatus && matchCulto;
    });
    
    if (!pre) { 
      alert('Código não encontrado ou já confirmado. Verifique se o código está correto para este culto.'); 
      return; 
    }

    const kid = allCriancas.find(k => k.id === pre.idCrianca);
    if (kid) {
      if (activeCheckins.some(c => c.idCrianca === kid.id)) {
        await storageService.updatePreCheckin(pre.id, { status: 'confirmado' });
        setCodeQuery('KIDS-');
        alert(`${kid.nome} já estava na sala. Código confirmado.`);
        return;
      }

      await handleManualCheckin(kid);
      await storageService.updatePreCheckin(pre.id, { 
        status: 'confirmado', 
        dataHoraCheckin: new Date().toISOString() 
      });
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
              <div className="bg-yellow-main p-4 rounded-2xl shadow-sm">
                  <h2 className="text-[10px] font-black text-purple-dark mb-2 uppercase flex items-center gap-2">
                  {ICONS.QrCode} Confirmar Código
                  </h2>
                  <div className="flex bg-white rounded-xl overflow-hidden shadow-inner border border-yellow-secondary">
                    <input 
                        type="text" 
                        value={codeQuery}
                        onChange={handleCodeChange}
                        className="flex-1 min-w-0 p-3 font-black text-sm tracking-widest uppercase outline-none"
                    />
                    <button onClick={handleCodeCheckin} className="bg-purple-dark text-white px-4 font-black text-[10px] uppercase">OK</button>
                  </div>
              </div>

              <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-[10px] font-black text-purple-dark uppercase flex items-center gap-2">
                        {ICONS.Search} Busca Manual
                    </h2>
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
