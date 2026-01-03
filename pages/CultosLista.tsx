
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
            <p className="text-xs text-gray-text font-bold opacity-60 uppercase tracking-widest">Registros de todas as sessões</p>
          </div>
          <button 
            onClick={() => navigate('/cultos/iniciar')}
            className="bg-white text-purple-main p-3 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
          >
             {ICONS.Plus}
          </button>
       </header>

       <div className="space-y-3">
          {cultos.map(culto => {
            const isExpanded = expandedId === culto.id;
            const sessionCheckins = allCheckins.filter(c => c.idCulto === culto.id);
            const totalKids = sessionCheckins.length;

            return (
              <div key={culto.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden transition-all">
                 <div 
                  onClick={() => setExpandedId(isExpanded ? null : culto.id)}
                  className="p-5 md:p-6 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"
                 >
                    <div className="flex items-center gap-4">
                       <div className={`p-3 rounded-xl ${culto.status === 'ativo' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                          {ICONS.Calendar}
                       </div>
                       <div>
                          <h3 className="text-sm font-black text-purple-dark uppercase tracking-tight truncate max-w-[150px] sm:max-w-none">
                            {culto.tipo === 'Outros' ? culto.tipoManual : culto.tipo}
                          </h3>
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                            {new Date(culto.data).toLocaleDateString('pt-BR')} • {totalKids} Kids
                          </p>
                       </div>
                    </div>

                    <div className={`text-purple-main transition-transform duration-300 ${isExpanded ? 'rotate-90' : ''}`}>
                       {ICONS.ChevronRight}
                    </div>
                 </div>

                 {isExpanded && (
                   <div className="px-5 pb-6 pt-2 bg-gray-50/50 animate-in slide-in-from-top-2 duration-300 border-t border-gray-100">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 mb-6">
                         <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                            <p className="text-[8px] font-black text-gray-400 uppercase mb-1 tracking-widest">Responsáveis</p>
                            <p className="text-xs font-bold text-gray-700 truncate">{culto.responsaveis}</p>
                         </div>
                         <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                            <p className="text-[8px] font-black text-gray-400 uppercase mb-1 tracking-widest">Horário</p>
                            <p className="text-xs font-bold text-gray-700">{culto.horaInicio} às {culto.horaFim || '--:--'}</p>
                         </div>
                         <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                            <p className="text-[8px] font-black text-gray-400 uppercase mb-1 tracking-widest">Status</p>
                            <p className={`text-xs font-bold ${culto.status === 'ativo' ? 'text-green-600' : 'text-gray-500'} uppercase`}>{culto.status}</p>
                         </div>
                      </div>

                      {/* Lista de Crianças no Culto */}
                      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="bg-purple-main/5 p-3 border-b border-gray-100">
                          <h4 className="text-[10px] font-black text-purple-dark uppercase tracking-widest flex items-center gap-2">
                            {ICONS.Baby} Lista de Presença
                          </h4>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse">
                            <thead>
                              <tr className="bg-gray-50 border-b border-gray-100">
                                <th className="p-3 text-[9px] font-black text-gray-400 uppercase tracking-widest">Criança</th>
                                <th className="p-3 text-[9px] font-black text-gray-400 uppercase tracking-widest">Responsável</th>
                                <th className="p-3 text-[9px] font-black text-gray-400 uppercase tracking-widest">Entrada</th>
                                <th className="p-3 text-[9px] font-black text-gray-400 uppercase tracking-widest">Saída</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                              {sessionCheckins.length === 0 ? (
                                <tr>
                                  <td colSpan={4} className="p-4 text-center text-[10px] font-bold text-gray-400 italic">Nenhum check-in registrado.</td>
                                </tr>
                              ) : (
                                sessionCheckins.map(check => {
                                  const kid = allKids.find(k => k.id === check.idCrianca);
                                  return (
                                    <tr key={check.id} className="hover:bg-gray-50/50">
                                      <td className="p-3">
                                        <p className="text-[11px] font-black text-purple-dark">{kid?.nome} {kid?.sobrenome}</p>
                                      </td>
                                      <td className="p-3">
                                        <p className="text-[10px] font-bold text-gray-600 uppercase tracking-tight">{kid?.responsavelNome}</p>
                                      </td>
                                      <td className="p-3">
                                        <div className="flex items-center gap-1.5 text-green-600">
                                          <span className="text-[10px] font-black">{check.horaEntrada}</span>
                                        </div>
                                      </td>
                                      <td className="p-3">
                                        {check.status === 'saiu' ? (
                                          <div className="space-y-0.5">
                                            <p className="text-[10px] font-black text-red-500">{check.horaSaida}</p>
                                            <p className="text-[8px] font-bold text-gray-400 uppercase leading-none">Por: {check.quemRetirou}</p>
                                          </div>
                                        ) : (
                                          <span className="text-[9px] font-bold text-gray-300 uppercase tracking-widest italic">Presente</span>
                                        )}
                                      </td>
                                    </tr>
                                  );
                                })
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                      
                      {culto.status === 'ativo' && (
                        <button 
                          onClick={(e) => { e.stopPropagation(); navigate(`/cultos/ativo/${culto.id}`); }}
                          className="mt-4 w-full bg-purple-main text-white font-black py-4 rounded-xl shadow-lg uppercase tracking-widest text-[10px]"
                        >
                          Retornar ao Painel Ativo
                        </button>
                      )}
                   </div>
                 )}
              </div>
            )
          })}
          {cultos.length === 0 && (
             <div className="py-20 text-center text-gray-300">
                <p className="font-black uppercase tracking-widest text-xs">Nenhum histórico encontrado.</p>
             </div>
          )}
       </div>
    </div>
  );
};

export default CultosLista;
