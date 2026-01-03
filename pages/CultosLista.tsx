
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { storageService } from '../services/storageService';
import { ICONS } from '../constants';
import { Culto, CheckIn, Crianca } from '../types';

const CultosLista: React.FC = () => {
  const navigate = useNavigate();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [cultos, setCultos] = useState<Culto[]>([]);
  const [allCheckins, setAllCheckins] = useState<CheckIn[]>([]);
  const [allKids, setAllKids] = useState<Crianca[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [cultosList, checkinsList, kidsList] = await Promise.all([
          storageService.getCultos(),
          storageService.getAllCheckins(),
          storageService.getCriancas()
        ]);
        setCultos(cultosList);
        setAllCheckins(checkinsList);
        setAllKids(kidsList);
      } catch (error) {
        console.error("Erro ao carregar histórico:", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  if (loading) {
    return <div className="text-center py-20 text-purple-main font-bold">Carregando histórico...</div>;
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
       <header className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black text-purple-dark uppercase tracking-tight">Histórico</h1>
            <p className="text-xs text-gray-text font-bold opacity-60 uppercase tracking-widest">Todas as sessões registradas</p>
          </div>
          <button 
            onClick={() => navigate('/cultos/iniciar')}
            className="bg-purple-main text-white p-3 rounded-xl shadow-lg hover:scale-110 transition-transform"
          >
             {ICONS.Plus}
          </button>
       </header>

       <div className="space-y-3">
          {cultos.map(culto => {
            const isExpanded = expandedId === culto.id;
            const sessionCheckins = allCheckins.filter(c => c.idCulto === culto.id);

            return (
              <div key={culto.id} className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden transition-all">
                 <div 
                  onClick={() => setExpandedId(isExpanded ? null : culto.id)}
                  className="p-5 md:p-6 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"
                 >
                    <div className="flex items-center gap-4">
                       <div className={`p-3 rounded-2xl ${culto.status === 'ativo' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                          {ICONS.Calendar}
                       </div>
                       <div>
                          <h3 className="text-base font-black text-purple-dark uppercase tracking-tight">
                            {culto.tipo === 'Outros' ? culto.tipoManual : culto.tipo}
                          </h3>
                          <div className="flex items-center gap-2">
                             <span className="text-[10px] font-bold text-gray-400 uppercase">{new Date(culto.data).toLocaleDateString('pt-BR')}</span>
                             <span className="w-1 h-1 rounded-full bg-gray-300" />
                             <span className="text-[10px] font-black text-purple-main uppercase">{sessionCheckins.length} Kids</span>
                          </div>
                       </div>
                    </div>

                    <div className={`text-purple-main transition-transform duration-500 ${isExpanded ? 'rotate-180' : ''}`}>
                       {ICONS.ChevronRight}
                    </div>
                 </div>

                 {isExpanded && (
                   <div className="px-5 pb-8 pt-2 bg-gray-50/30 animate-in slide-in-from-top-4 duration-500 border-t border-gray-100">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 my-6">
                         <div className="bg-white p-4 rounded-2xl border border-gray-100">
                            <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Responsáveis</p>
                            <p className="text-xs font-bold text-gray-700 truncate">{culto.responsaveis}</p>
                         </div>
                         <div className="bg-white p-4 rounded-2xl border border-gray-100">
                            <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Início</p>
                            <p className="text-xs font-bold text-gray-700">{culto.horaInicio}</p>
                         </div>
                         <div className="bg-white p-4 rounded-2xl border border-gray-100">
                            <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Término</p>
                            <p className="text-xs font-bold text-gray-700">{culto.horaFim || '--:--'}</p>
                         </div>
                         <div className="bg-white p-4 rounded-2xl border border-gray-100">
                            <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Status</p>
                            <p className={`text-[10px] font-black ${culto.status === 'ativo' ? 'text-green-600' : 'text-gray-400'} uppercase`}>{culto.status}</p>
                         </div>
                      </div>

                      <div className="bg-white rounded-[2rem] border border-gray-100 overflow-hidden shadow-sm">
                        <div className="bg-purple-dark p-4 flex justify-between items-center">
                          <h4 className="text-[10px] font-black text-white uppercase tracking-widest">Lista de Presença</h4>
                          <span className="bg-white/20 text-white px-3 py-1 rounded-full text-[9px] font-black">{sessionCheckins.length} TOTAL</span>
                        </div>
                        
                        <div className="overflow-x-auto">
                          <table className="w-full text-left">
                            <thead className="bg-gray-50 border-b border-gray-100">
                              <tr>
                                <th className="p-4 text-[9px] font-black text-gray-400 uppercase">Criança</th>
                                <th className="p-4 text-[9px] font-black text-gray-400 uppercase">Responsável</th>
                                <th className="p-4 text-[9px] font-black text-gray-400 uppercase">Check-in</th>
                                <th className="p-4 text-[9px] font-black text-gray-400 uppercase">Check-out</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                              {sessionCheckins.map(check => {
                                const kid = allKids.find(k => k.id === check.idCrianca);
                                return (
                                  <tr key={check.id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="p-4">
                                      <p className="text-[11px] font-black text-purple-dark">{kid?.nome} {kid?.sobrenome}</p>
                                    </td>
                                    <td className="p-4">
                                      <p className="text-[10px] font-bold text-gray-500 uppercase">{kid?.responsavelNome}</p>
                                    </td>
                                    <td className="p-4">
                                      <span className="bg-green-100 text-green-600 px-2 py-1 rounded-lg text-[10px] font-black">{check.horaEntrada}</span>
                                    </td>
                                    <td className="p-4">
                                      {check.status === 'saiu' ? (
                                        <div className="flex flex-col">
                                          <span className="text-[10px] font-black text-red-500">{check.horaSaida}</span>
                                          <span className="text-[8px] font-bold text-gray-400 uppercase">Por: {check.quemRetirou}</span>
                                        </div>
                                      ) : (
                                        <span className="text-[9px] font-black text-yellow-600 uppercase italic opacity-60">Na sala</span>
                                      )}
                                    </td>
                                  </tr>
                                )
                              })}
                              {sessionCheckins.length === 0 && (
                                <tr>
                                  <td colSpan={4} className="p-10 text-center text-xs font-bold text-gray-400 uppercase tracking-widest italic">Nenhuma criança registrada nesta sessão.</td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                   </div>
                 )}
              </div>
            )
          })}
       </div>
    </div>
  );
};

export default CultosLista;
