
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
  const [codeQuery, setCodeQuery] = useState('');
  const [showCheckout, setShowCheckout] = useState<CheckIn | null>(null);
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
      setCodeQuery('');
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
    if (activeCheckins.length > 0) { alert('Libere todas as crianças antes.'); return; }
    if (confirm('Encerrar culto?')) {
      await storageService.updateCulto(id!, { status: 'encerrado', horaFim: new Date().toLocaleTimeString('pt-BR') });
      navigate('/cultos');
    }
  };

  const filteredKids = searchTerm.length > 1 
    ? allCriancas.filter(k => (k.nome + ' ' + k.sobrenome).toLowerCase().includes(searchTerm.toLowerCase()))
    : [];

  if (loading) return <div className="text-center py-10 text-purple-main font-bold">Carregando...</div>;

  return (
    <div className="space-y-4 pb-10 print:hidden">
      {/* Header Compacto */}
      <div className="bg-white p-4 rounded-3xl shadow-lg border-l-8 border-green-500 flex items-center justify-between gap-4 sticky top-0 z-30">
        <div>
          <span className="text-[9px] font-black uppercase tracking-widest text-green-600 bg-green-50 px-2 py-0.5 rounded-full mb-1 inline-block">ATIVO</span>
          <h1 className="text-lg font-black text-purple-dark uppercase truncate max-w-[200px] md:max-w-none">
            {culto?.tipo === 'Outros' ? culto.tipoManual : culto?.tipo}
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-purple-main px-4 py-2 rounded-xl text-white text-center min-w-[60px]">
            <span className="text-xl font-black block leading-none">{activeCheckins.length}</span>
            <span className="text-[8px] font-black uppercase tracking-tighter opacity-80">Presentes</span>
          </div>
          <button onClick={handleEndCulto} className="bg-red-500 text-white font-black px-4 py-2 rounded-xl text-xs flex items-center gap-2">
            {ICONS.LogOut} <span className="hidden sm:inline uppercase">SAIR</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-yellow-main p-5 rounded-3xl shadow-md">
            <h2 className="text-sm font-black text-purple-dark mb-3 uppercase flex items-center gap-2">
              {ICONS.QrCode} Código
            </h2>
            <div className="flex gap-2">
              <input 
                type="text" 
                placeholder="Ex: KIDS-1234"
                value={codeQuery}
                onChange={(e) => setCodeQuery(e.target.value)}
                className="flex-1 p-3 rounded-xl font-black text-lg tracking-widest uppercase outline-none"
              />
              <button onClick={handleCodeCheckin} className="bg-purple-dark text-white px-4 rounded-xl font-black text-sm">OK</button>
            </div>
          </div>

          <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-black text-purple-dark uppercase flex items-center gap-2">
                {ICONS.Search} Busca
              </h2>
              <button onClick={() => setIsAddingNew(true)} className="text-[10px] font-black uppercase text-purple-main bg-purple-main/5 px-2 py-1 rounded-lg">+ Novo</button>
            </div>
            <input 
              type="text" 
              placeholder="Nome da criança..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-gray-light p-3 rounded-xl font-bold mb-3 outline-none text-sm"
            />
            <div className="space-y-1 max-h-[150px] overflow-y-auto custom-scrollbar">
              {filteredKids.map(kid => (
                <button 
                  key={kid.id}
                  onClick={() => handleManualCheckin(kid)}
                  className="w-full flex items-center justify-between p-2.5 hover:bg-purple-main/5 rounded-xl transition-colors text-xs font-bold text-gray-700"
                >
                  <span>{kid.nome} {kid.sobrenome}</span>
                  <span className="text-purple-main">{ICONS.Plus}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-8">
          <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 min-h-[300px]">
            <h2 className="text-sm font-black text-purple-dark mb-4 uppercase flex items-center gap-2">
              {ICONS.Baby} Sala ({activeCheckins.length})
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {activeCheckins.map(check => {
                const kid = allCriancas.find(k => k.id === check.idCrianca);
                return (
                  <div key={check.id} className="bg-gray-light p-4 rounded-2xl flex flex-col justify-between">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1 overflow-hidden mr-2">
                        <h4 className="font-black text-purple-dark text-sm truncate leading-tight">{kid?.nome} {kid?.sobrenome}</h4>
                        <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">{check.horaEntrada}</p>
                      </div>
                      <button onClick={() => triggerLabelPrint(kid!, check)} className="text-purple-main p-1.5 bg-white rounded-lg shadow-sm">{ICONS.QrCode}</button>
                    </div>
                    <button onClick={() => setShowCheckout(check)} className="w-full bg-white text-purple-main border border-purple-main/20 hover:bg-purple-main hover:text-white py-2 rounded-lg font-black text-[10px] transition-all uppercase">LIBERAR</button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Modal Cadastro Compacto */}
      {isAddingNew && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-purple-dark/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-lg rounded-2xl p-6 shadow-2xl animate-in zoom-in duration-300">
            <h2 className="text-lg font-black text-purple-dark mb-4 uppercase">Cadastro Rápido</h2>
            <form onSubmit={handleQuickRegister} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <input required placeholder="Nome" value={newKidForm.nome} onChange={e => setNewKidForm({...newKidForm, nome: e.target.value})} className="bg-gray-light p-3 rounded-lg font-bold text-sm" />
                <input required placeholder="Sobrenome" value={newKidForm.sobrenome} onChange={e => setNewKidForm({...newKidForm, sobrenome: e.target.value})} className="bg-gray-light p-3 rounded-lg font-bold text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input required type="date" value={newKidForm.dataNascimento} onChange={e => setNewKidForm({...newKidForm, dataNascimento: e.target.value})} className="bg-gray-light p-3 rounded-lg font-bold text-sm" />
                <input required placeholder="Responsável" value={newKidForm.responsavelNome} onChange={e => setNewKidForm({...newKidForm, responsavelNome: e.target.value})} className="bg-gray-light p-3 rounded-lg font-bold text-sm" />
              </div>
              <input required placeholder="WhatsApp" value={newKidForm.whatsapp} onChange={e => setNewKidForm({...newKidForm, whatsapp: e.target.value})} className="w-full bg-gray-light p-3 rounded-lg font-bold text-sm" />
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button type="button" onClick={() => setIsAddingNew(false)} className="bg-gray-100 text-gray-500 font-black py-3 rounded-xl text-xs uppercase">CANCELAR</button>
                <button type="submit" className="bg-purple-main text-white font-black py-3 rounded-xl shadow-lg text-xs uppercase">SALVAR E ENTRAR</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Saída Compacto */}
      {showCheckout && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-purple-dark/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-sm rounded-2xl p-6 shadow-2xl text-center">
            <h2 className="text-lg font-black text-purple-dark mb-1 uppercase">Liberar Criança</h2>
            <p className="text-xs font-bold text-gray-500 mb-6">Quem veio buscar {allCriancas.find(k => k.id === showCheckout.idCrianca)?.nome}?</p>
            <input type="text" placeholder="Nome do responsável..." autoFocus value={checkoutName} onChange={(e) => setCheckoutName(e.target.value)} className="w-full bg-gray-light p-4 rounded-xl font-bold mb-6 outline-none text-sm" />
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => setShowCheckout(null)} className="bg-gray-100 text-gray-500 font-black py-4 rounded-xl text-xs">VOLTAR</button>
              <button onClick={handleConfirmCheckout} disabled={!checkoutName} className="bg-green-500 text-white font-black py-4 rounded-xl shadow-lg disabled:opacity-50 text-xs uppercase">CONFIRMAR</button>
            </div>
          </div>
        </div>
      )}

      {/* Preview Etiqueta Otimizado */}
      {labelData && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 print:hidden">
          <div className="bg-white p-6 rounded-2xl shadow-2xl text-center max-w-xs w-full">
            <p className="text-[10px] font-black text-purple-main mb-4 uppercase">Etiqueta</p>
            <div className="border border-dashed border-gray-300 p-3 mb-6 bg-gray-50 rounded-lg">
               <h3 className="text-xl font-black text-black leading-tight">{labelData.kid.nome.toUpperCase()}</h3>
               <p className="text-xs font-bold text-gray-600 truncate">{labelData.kid.sobrenome}</p>
               <div className="my-2 border-t border-gray-200"></div>
               <p className="text-[8px] font-black uppercase text-gray-400">Responsável</p>
               <p className="text-[10px] font-bold">{labelData.kid.responsavelNome}</p>
            </div>
            <button onClick={() => setLabelData(null)} className="w-full bg-purple-main text-white py-3 rounded-xl font-black uppercase text-[10px]">FECHAR</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CultoAtivo;
