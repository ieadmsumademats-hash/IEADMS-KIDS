
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ICONS } from '../constants';
import { storageService } from '../services/storageService';
import { Crianca, CheckIn } from '../types';

const CultoAtivo: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [culto, setCulto] = useState(storageService.getCultos().find(c => c.id === id));
  const [checkins, setCheckins] = useState(storageService.getCheckins().filter(c => c.idCulto === id));
  const [allCriancas, setAllCriancas] = useState(storageService.getCriancas());
  
  const [searchTerm, setSearchTerm] = useState('');
  const [codeQuery, setCodeQuery] = useState('');
  const [showCheckout, setShowCheckout] = useState<CheckIn | null>(null);
  const [checkoutName, setCheckoutName] = useState('');

  useEffect(() => {
    if (!culto || culto.status === 'encerrado') {
      navigate('/cultos');
    }
  }, [culto, navigate]);

  const activeCheckins = checkins.filter(c => c.status === 'presente');

  const handleManualCheckin = (kid: Crianca) => {
    if (activeCheckins.some(c => c.idCrianca === kid.id)) {
      alert(`${kid.nome} já está presente.`);
      return;
    }

    const newCheck: CheckIn = {
      id: Date.now().toString(),
      idCrianca: kid.id,
      idCulto: id!,
      horaEntrada: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      status: 'presente'
    };

    storageService.addCheckin(newCheck);
    setCheckins([...checkins, newCheck]);
    setSearchTerm('');
  };

  const handleCodeCheckin = () => {
    const code = codeQuery.trim().toUpperCase();
    const pre = storageService.getPreCheckins().find(p => p.codigo === code && p.status === 'pendente');
    
    if (!pre) {
      alert('Código inválido ou já confirmado.');
      return;
    }

    const kid = allCriancas.find(k => k.id === pre.idCrianca);
    if (kid) {
      handleManualCheckin(kid);
      storageService.updatePreCheckin({ ...pre, status: 'confirmado', dataHoraCheckin: new Date().toISOString() });
      setCodeQuery('');
      alert(`Check-in confirmado para ${kid.nome}!`);
    }
  };

  const handleConfirmCheckout = () => {
    if (!showCheckout || !checkoutName) return;

    const updated: CheckIn = {
      ...showCheckout,
      status: 'saiu',
      horaSaida: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      quemRetirou: checkoutName
    };

    storageService.updateCheckin(updated);
    setCheckins(checkins.map(c => c.id === updated.id ? updated : c));
    setShowCheckout(null);
    setCheckoutName('');
  };

  const handleEndCulto = () => {
    if (activeCheckins.length > 0) {
      alert('Ainda há crianças presentes no Kids. Libere todas antes de encerrar.');
      return;
    }

    if (confirm('Deseja encerrar este culto definitivamente?')) {
      const updated = { ...culto!, status: 'encerrado' as const, horaFim: new Date().toLocaleTimeString('pt-BR') };
      storageService.updateCulto(updated);
      navigate('/cultos');
    }
  };

  const filteredKids = searchTerm.length > 1 
    ? allCriancas.filter(k => (k.nome + ' ' + k.sobrenome).toLowerCase().includes(searchTerm.toLowerCase()))
    : [];

  return (
    <div className="space-y-8 pb-20">
      {/* Operação Header - Fixo em Mobile */}
      <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border-l-[12px] border-green-500 flex flex-col lg:flex-row lg:items-center justify-between gap-8 sticky top-0 z-30">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <span className="bg-green-100 text-green-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest animate-pulse">🟢 Em Andamento</span>
            <span className="text-gray-400 font-bold text-xs">{culto?.data}</span>
          </div>
          <h1 className="text-3xl font-black text-purple-dark uppercase tracking-tight">{culto?.tipo === 'Outros' ? culto.tipoManual : culto?.tipo}</h1>
          <div className="flex items-center gap-6 mt-2 text-sm font-medium text-gray-text">
            <span className="flex items-center gap-1">{ICONS.Users} {culto?.responsaveis}</span>
            <span className="flex items-center gap-1">{ICONS.Clock} Início: {culto?.horaInicio}</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="bg-purple-main px-8 py-4 rounded-3xl text-white flex flex-col items-center justify-center shadow-lg">
            <span className="text-3xl font-black leading-none">{activeCheckins.length}</span>
            <span className="text-[10px] font-black uppercase tracking-tighter opacity-80 mt-1">Presentes</span>
          </div>
          <button 
            onClick={handleEndCulto}
            className="bg-red-500 hover:bg-red-600 text-white font-black px-8 py-4 rounded-3xl shadow-xl transition-all transform active:scale-95 flex items-center gap-3"
          >
            {ICONS.LogOut}
            <span className="hidden sm:inline">ENCERRAR</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Lado Esquerdo: Check-in */}
        <div className="lg:col-span-5 space-y-8">
          <div className="bg-yellow-main p-8 rounded-[2.5rem] shadow-xl">
             <h3 className="text-purple-dark font-black mb-6 flex items-center gap-2 uppercase tracking-wide">
               {ICONS.QrCode} Entrada com Código
             </h3>
             <div className="flex gap-2">
                <input 
                  type="text"
                  placeholder="KIDS-1234"
                  value={codeQuery}
                  onChange={(e) => setCodeQuery(e.target.value)}
                  className="flex-1 p-5 rounded-2xl bg-white/50 border-2 border-transparent focus:border-purple-main outline-none font-black text-2xl placeholder:text-purple-dark/20 uppercase"
                />
                <button 
                  onClick={handleCodeCheckin}
                  className="bg-purple-dark text-white px-8 rounded-2xl font-black shadow-lg hover:scale-105 transition-transform"
                >
                  OK
                </button>
             </div>
          </div>

          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
            <h3 className="text-purple-dark font-black mb-6 flex items-center gap-2 uppercase tracking-wide">
              {ICONS.Search} Check-in Manual
            </h3>
            <div className="relative mb-6">
              <span className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400">{ICONS.Search}</span>
              <input 
                type="text"
                placeholder="Nome da criança..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-14 pr-6 py-5 rounded-2xl bg-gray-light border-2 border-transparent focus:border-purple-main outline-none font-bold"
              />
            </div>

            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
              {filteredKids.map(kid => (
                <div key={kid.id} className="flex items-center justify-between p-4 bg-gray-light rounded-2xl border border-gray-100 group">
                  <div>
                    <p className="font-black text-purple-dark">{kid.nome} {kid.sobrenome}</p>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{kid.responsavelNome}</p>
                  </div>
                  <button 
                    onClick={() => handleManualCheckin(kid)}
                    className="bg-purple-main text-white p-3 rounded-xl shadow-lg hover:rotate-6 transition-transform"
                  >
                    {ICONS.Plus}
                  </button>
                </div>
              ))}
              {searchTerm.length > 1 && filteredKids.length === 0 && (
                <div className="text-center py-6 text-gray-400">
                   <p className="text-sm font-bold italic mb-3">Nenhum cadastro encontrado.</p>
                   <button 
                    onClick={() => navigate('/criancas')}
                    className="text-purple-main font-black text-xs uppercase underline decoration-2 underline-offset-4"
                   >
                     Cadastrar Agora
                   </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Lado Direito: Lista de Presentes */}
        <div className="lg:col-span-7">
           <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden min-h-[500px]">
              <div className="p-8 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
                 <h2 className="font-black text-purple-dark text-xl uppercase tracking-widest">Lista de Chamada</h2>
                 <span className="bg-purple-dark text-white px-3 py-1 rounded-full text-[10px] font-black uppercase">{activeCheckins.length} Presentes</span>
              </div>
              
              <div className="divide-y divide-gray-50">
                 {activeCheckins.length > 0 ? activeCheckins.map(check => {
                   const kid = allCriancas.find(k => k.id === check.idCrianca);
                   return (
                     <div key={check.id} className="p-6 md:p-8 flex items-center justify-between group hover:bg-purple-main/5 transition-colors">
                        <div className="flex items-center gap-5">
                           <div className="bg-purple-main text-white w-14 h-14 rounded-2xl flex items-center justify-center font-black text-2xl shadow-md transform group-hover:rotate-3 transition-transform">
                              {kid?.nome[0]}
                           </div>
                           <div>
                              <h4 className="font-black text-purple-dark text-xl">{kid?.nome} {kid?.sobrenome}</h4>
                              <div className="flex items-center gap-4 mt-1">
                                 <span className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Entrada: {check.horaEntrada}</span>
                                 <a 
                                  href={`https://wa.me/${kid?.whatsapp}`} 
                                  target="_blank" 
                                  className="text-green-500 hover:scale-110 transition-transform"
                                 >
                                    {ICONS.Phone}
                                 </a>
                              </div>
                           </div>
                        </div>
                        <button 
                          onClick={() => setShowCheckout(check)}
                          className="bg-yellow-main hover:bg-yellow-secondary text-purple-dark px-6 py-3 rounded-2xl font-black text-sm shadow-md transition-all active:scale-95"
                        >
                           SAÍDA
                        </button>
                     </div>
                   )
                 }) : (
                   <div className="flex flex-col items-center justify-center py-32 text-gray-300">
                      <div className="scale-150 mb-6">{ICONS.Users}</div>
                      <p className="font-black uppercase tracking-widest text-sm">Aguardando check-in...</p>
                   </div>
                 )}
              </div>
           </div>
        </div>
      </div>

      {/* Modal de Checkout */}
      {showCheckout && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-purple-dark/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-lg rounded-[3rem] p-10 shadow-2xl animate-in zoom-in-95 duration-300">
            <h2 className="text-3xl font-black text-purple-dark mb-4">Confirmar Retirada</h2>
            <p className="text-gray-text font-medium mb-10 text-lg">
              Registrando a saída de <span className="text-purple-main font-black underline decoration-yellow-main decoration-4 underline-offset-4">
                {allCriancas.find(k => k.id === showCheckout.idCrianca)?.nome}
              </span>.
            </p>

            <div className="space-y-8">
              <div>
                 <label className="block text-xs font-black text-gray-text uppercase tracking-widest mb-3">Quem está retirando a criança?</label>
                 <input 
                  autoFocus
                  type="text"
                  value={checkoutName}
                  onChange={(e) => setCheckoutName(e.target.value)}
                  placeholder="Nome do responsável..."
                  className="w-full bg-gray-light border-2 border-transparent focus:border-purple-main outline-none p-6 rounded-3xl font-bold text-xl"
                 />
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <button 
                  onClick={() => setShowCheckout(null)}
                  className="bg-gray-100 text-gray-500 font-black py-5 rounded-3xl"
                 >
                    CANCELAR
                 </button>
                 <button 
                  onClick={handleConfirmCheckout}
                  className="bg-purple-main text-white font-black py-5 rounded-3xl shadow-xl shadow-purple-main/20"
                 >
                    CONFIRMAR
                 </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CultoAtivo;
