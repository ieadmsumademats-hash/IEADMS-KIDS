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

  const triggerLabelPrint = (kid: Crianca, checkin: CheckIn) => {
    setLabelData({ kid, checkin });
    setTimeout(() => window.print(), 500);
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
      alert(`${kid.nome} já está presente.`);
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
    const pre = preCheckins.find(p => p.codigo === code && p.status === 'pendente');
    if (!pre) { alert('Código inválido.'); return; }
    const kid = allCriancas.find(k => k.id === pre.idCrianca);
    if (kid) {
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
    <div className="space-y-6 pb-12 print:hidden">
      {/* Header Intermediário */}
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
        </div>

        <div className="lg:col-span-8">
          <div className="bg-white p-7 rounded-[2rem] shadow-sm border border-gray-100 min-h-[450px]">
            <h2 className="text-base font-black text-purple-dark mb-6 uppercase flex items-center gap-3">
              {ICONS.Baby} Crianças na Sala ({activeCheckins.length})
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {activeCheckins.map(check => {
                const kid = allCriancas.find(k => k.id === check.idCrianca);
                return (
                  <div key={check.id} className="bg-gray-light p-5 rounded-[1.5rem] flex flex-col justify-between border-2 border-transparent hover:border-purple-main/20 transition-all shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1 overflow-hidden mr-3">
                        <h4 className="font-black text-purple-dark text-base truncate leading-tight">{kid?.nome} {kid?.sobrenome}</h4>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Entrada: {check.horaEntrada}</p>
                      </div>
                      <button onClick={() => triggerLabelPrint(kid!, check)} className="text-purple-main p-2.5 bg-white rounded-xl shadow-md hover:bg-purple-main hover:text-white transition-all">{ICONS.QrCode}</button>
                    </div>
                    <button onClick={() => setShowCheckout(check)} className="w-full bg-white text-purple-main border-2 border-purple-main/20 hover:border-purple-main hover:bg-purple-main hover:text-white py-2.5 rounded-xl font-black text-[11px] transition-all uppercase tracking-widest shadow-sm">REALIZAR SAÍDA</button>
                  </div>
                );
              })}
              {activeCheckins.length === 0 && (
                <div className="col-span-full py-20 text-center text-gray-300 font-bold uppercase tracking-widest">Nenhuma criança na sala no momento.</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal Cadastro Rápido */}
      {isAddingNew && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-purple-dark/70 backdrop-blur-md">
          <div className="bg-white w-full max-w-lg rounded-[2rem] p-8 shadow-2xl animate-in zoom-in duration-300">
            <h2 className="text-xl font-black text-purple-dark mb-6 uppercase tracking-tight">Novo Cadastro Rápido</h2>
            <form onSubmit={handleQuickRegister} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <input required placeholder="Nome" value={newKidForm.nome} onChange={e => setNewKidForm({...newKidForm, nome: e.target.value})} className="bg-gray-light p-4 rounded-xl font-bold text-sm" />
                <input required placeholder="Sobrenome" value={newKidForm.sobrenome} onChange={e => setNewKidForm({...newKidForm, sobrenome: e.target.value})} className="bg-gray-light p-4 rounded-xl font-bold text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <input required type="date" value={newKidForm.dataNascimento} onChange={e => setNewKidForm({...newKidForm, dataNascimento: e.target.value})} className="bg-gray-light p-4 rounded-xl font-bold text-sm" />
                <input required placeholder="Responsável" value={newKidForm.responsavelNome} onChange={e => setNewKidForm({...newKidForm, responsavelNome: e.target.value})} className="bg-gray-light p-4 rounded-xl font-bold text-sm" />
              </div>
              <input required placeholder="WhatsApp (DDD + Número)" value={newKidForm.whatsapp} onChange={e => setNewKidForm({...newKidForm, whatsapp: formatPhone(e.target.value)})} className="w-full bg-gray-light p-4 rounded-xl font-bold text-sm" />
              <div className="grid grid-cols-2 gap-4 pt-4">
                <button type="button" onClick={() => setIsAddingNew(false)} className="bg-gray-100 text-gray-500 font-black py-4 rounded-2xl text-xs uppercase tracking-widest">CANCELAR</button>
                <button type="submit" className="bg-purple-main text-white font-black py-4 rounded-2xl shadow-xl text-xs uppercase tracking-widest">SALVAR E ENTRAR</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Saída */}
      {showCheckout && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-purple-dark/70 backdrop-blur-md">
          <div className="bg-white w-full max-w-sm rounded-[2rem] p-8 shadow-2xl text-center animate-in zoom-in duration-300">
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

      {/* Modal Customizado Encerrar Culto */}
      {showEndConfirm && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-red-900/80 backdrop-blur-md">
          <div className="bg-white w-full max-w-sm rounded-[2.5rem] p-10 shadow-2xl text-center animate-in zoom-in duration-300 border-t-8 border-red-500">
             <div className="bg-red-100 text-red-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 text-2xl">
                {ICONS.LogOut}
             </div>
             <h2 className="text-2xl font-black text-purple-dark mb-3 uppercase">ENCERRAR CULTO?</h2>
             <p className="text-gray-text font-bold mb-10 text-sm">Esta ação finalizará o registro de todas as atividades de hoje.</p>
             <div className="flex flex-col gap-3">
                <button 
                    onClick={handleEndCulto}
                    className="w-full bg-red-500 text-white font-black py-5 rounded-2xl shadow-xl shadow-red-500/20 text-xs uppercase tracking-widest hover:bg-red-600 transition-colors"
                >
                    SIM, ENCERRAR AGORA
                </button>
                <button 
                    onClick={() => setShowEndConfirm(false)}
                    className="w-full bg-gray-100 text-gray-500 font-black py-4 rounded-2xl text-xs uppercase tracking-widest hover:bg-gray-200 transition-colors"
                >
                    NÃO, VOLTAR
                </button>
             </div>
          </div>
        </div>
      )}

      {/* Preview Etiqueta */}
      {labelData && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 print:hidden">
          <div className="bg-white p-8 rounded-[2rem] shadow-2xl text-center max-w-xs w-full animate-in slide-in-from-bottom-10">
            <p className="text-[10px] font-black text-purple-main mb-6 uppercase tracking-[0.3em]">Gerando Etiqueta...</p>
            <div className="border-4 border-dashed border-gray-200 p-6 mb-8 bg-gray-50 rounded-2xl">
               <h3 className="text-2xl font-black text-black leading-tight mb-1">{labelData.kid.nome.toUpperCase()}</h3>
               <p className="text-sm font-bold text-gray-600 truncate mb-4">{labelData.kid.sobrenome}</p>
               <div className="my-4 border-t-2 border-gray-200"></div>
               <p className="text-[10px] font-black uppercase text-gray-400 mb-1">Responsável</p>
               <p className="text-sm font-black text-purple-dark">{labelData.kid.responsavelNome}</p>
            </div>
            <button onClick={() => setLabelData(null)} className="w-full bg-purple-main text-white py-4 rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-xl">FECHAR PREVIEW</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CultoAtivo;