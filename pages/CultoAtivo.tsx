
import React, { useState, useEffect } from 'react';
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

  useEffect(() => {
    if (!id) return;

    const loadBasics = async () => {
      const kids = await storageService.getCriancas();
      setAllCriancas(kids);
    };
    loadBasics();

    const unsubCulto = storageService.subscribeToActiveCulto((c) => {
      if (!c || c.id !== id) {
        // Se o culto ativo não for este, voltamos para a listagem
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

    await storageService.addCheckin(newCheck);
    setSearchTerm('');
  };

  const handleCodeCheckin = async () => {
    const code = codeQuery.trim().toUpperCase();
    const pre = preCheckins.find(p => p.codigo === code && p.status === 'pendente');
    
    if (!pre) {
      alert('Código inválido ou já confirmado.');
      return;
    }

    const kid = allCriancas.find(k => k.id === pre.idCrianca);
    if (kid) {
      await handleManualCheckin(kid);
      await storageService.updatePreCheckin(pre.id, { 
        status: 'confirmado', 
        dataHoraCheckin: new Date().toISOString() 
      });
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
    if (activeCheckins.length > 0) {
      alert('Ainda há crianças presentes no Kids. Libere todas antes de encerrar.');
      return;
    }

    if (confirm('Deseja encerrar este culto definitivamente?')) {
      await storageService.updateCulto(id!, { 
        status: 'encerrado', 
        horaFim: new Date().toLocaleTimeString('pt-BR') 
      });
      navigate('/cultos');
    }
  };

  const filteredKids = searchTerm.length > 1 
    ? allCriancas.filter(k => (k.nome + ' ' + k.sobrenome).toLowerCase().includes(searchTerm.toLowerCase()))
    : [];

  if (loading) return <div className="text-center py-20 text-purple-main font-bold">Carregando culto ativo...</div>;

  return (
    <div className="space-y-8 pb-20">
      {/* Header Fixo de Gestão */}
      <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border-l-[12px] border-green-500 flex flex-col lg:flex-row lg:items-center justify-between gap-8 sticky top-0 z-30">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${culto?.status === 'ativo' ? 'bg-green-100 text-green-600 animate-pulse' : 'bg-gray-100 text-gray-500'}`}>
              {culto?.status === 'ativo' ? '🟢 Em Andamento' : '⚪ Finalizado'}
            </span>
          </div>
          <h1 className="text-3xl font-black text-purple-dark uppercase tracking-tight">
            {culto?.tipo === 'Outros' ? culto.tipoManual : culto?.tipo}
          </h1>
        </div>

        <div className="flex items-center gap-4">
          <div className="bg-purple-main px-8 py-4 rounded-3xl text-white flex flex-col items-center justify-center shadow-lg">
            <span className="text-3xl font-black leading-none">{activeCheckins.length}</span>
            <span className="text-[10px] font-black uppercase tracking-tighter opacity-80 mt-1">Presentes</span>
          </div>
          {culto?.status === 'ativo' && (
            <button onClick={handleEndCulto} className="bg-red-500 hover:bg-red-600 text-white font-black px-8 py-4 rounded-3xl shadow-xl transition-all flex items-center gap-3">
              {ICONS.LogOut} <span>ENCERRAR</span>
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Coluna de Entrada (Check-in) */}
        <div className="lg:col-span-5 space-y-8">
          <div className="bg-yellow-main p-8 rounded-[3rem] shadow-lg">
            <h2 className="text-xl font-black text-purple-dark mb-6 uppercase flex items-center gap-3">
              {ICONS.QrCode} Check-in por Código
            </h2>
            <div className="flex gap-3">
              <input 
                type="text" 
                placeholder="Ex: KIDS-1234"
                value={codeQuery}
                onChange={(e) => setCodeQuery(e.target.value)}
                className="flex-1 p-5 rounded-2xl font-black text-2xl tracking-widest uppercase outline-none focus:ring-4 focus:ring-purple-main/20"
              />
              <button 
                onClick={handleCodeCheckin}
                className="bg-purple-dark text-white px-8 rounded-2xl font-black hover:bg-purple-main transition-colors"
              >
                OK
              </button>
            </div>
          </div>

          <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-gray-100">
            <h2 className="text-xl font-black text-purple-dark mb-6 uppercase flex items-center gap-3">
              {ICONS.Search} Busca Manual
            </h2>
            <input 
              type="text" 
              placeholder="Nome da criança..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-gray-light p-5 rounded-2xl font-bold mb-4 outline-none focus:border-purple-main border-2 border-transparent"
            />
            
            <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar">
              {filteredKids.map(kid => (
                <button 
                  key={kid.id}
                  onClick={() => handleManualCheckin(kid)}
                  className="w-full flex items-center justify-between p-4 hover:bg-purple-main/5 rounded-2xl transition-colors group"
                >
                  <span className="font-bold text-gray-700">{kid.nome} {kid.sobrenome}</span>
                  <span className="text-purple-main opacity-0 group-hover:opacity-100 transition-opacity">{ICONS.Plus}</span>
                </button>
              ))}
              {searchTerm.length > 1 && filteredKids.length === 0 && (
                <p className="text-center py-4 text-gray-400 text-sm font-bold">Criança não cadastrada.</p>
              )}
            </div>
          </div>
        </div>

        {/* Coluna de Presentes (Checkout) */}
        <div className="lg:col-span-7">
          <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-gray-100 min-h-[500px]">
            <h2 className="text-xl font-black text-purple-dark mb-8 uppercase flex items-center gap-3">
              {ICONS.Baby} Crianças na Sala
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {activeCheckins.map(check => {
                const kid = allCriancas.find(k => k.id === check.idCrianca);
                return (
                  <div key={check.id} className="bg-gray-light p-6 rounded-[2rem] border-2 border-transparent hover:border-purple-main/20 transition-all flex flex-col justify-between">
                    <div>
                      <h4 className="font-black text-purple-dark text-lg truncate">{kid?.nome}</h4>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Entrada: {check.horaEntrada}</p>
                    </div>
                    <button 
                      onClick={() => setShowCheckout(check)}
                      className="w-full bg-white text-purple-main border-2 border-purple-main hover:bg-purple-main hover:text-white py-3 rounded-xl font-black text-xs transition-all uppercase tracking-widest"
                    >
                      REALIZAR SAÍDA
                    </button>
                  </div>
                );
              })}
              {activeCheckins.length === 0 && (
                <div className="col-span-full py-20 text-center opacity-20">
                  <div className="scale-150 mb-4">{ICONS.Users}</div>
                  <p className="font-black uppercase tracking-widest">Nenhuma criança na sala.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Checkout */}
      {showCheckout && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-purple-dark/80 backdrop-blur-md">
          <div className="bg-white w-full max-w-md rounded-[3rem] p-10 shadow-2xl animate-in zoom-in duration-300">
            <h2 className="text-2xl font-black text-purple-dark mb-2 uppercase">Confirmar Saída</h2>
            <p className="text-gray-text font-bold mb-8">
              Quem está vindo buscar {allCriancas.find(k => k.id === showCheckout.idCrianca)?.nome}?
            </p>
            
            <input 
              type="text" 
              placeholder="Nome do responsável..."
              autoFocus
              value={checkoutName}
              onChange={(e) => setCheckoutName(e.target.value)}
              className="w-full bg-gray-light p-5 rounded-2xl font-bold border-2 border-transparent focus:border-purple-main outline-none mb-8"
            />

            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => { setShowCheckout(null); setCheckoutName(''); }}
                className="bg-gray-100 text-gray-500 font-black py-5 rounded-2xl"
              >
                CANCELAR
              </button>
              <button 
                onClick={handleConfirmCheckout}
                disabled={!checkoutName}
                className="bg-green-500 text-white font-black py-5 rounded-2xl shadow-xl disabled:opacity-50"
              >
                CONFIRMAR
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CultoAtivo;
