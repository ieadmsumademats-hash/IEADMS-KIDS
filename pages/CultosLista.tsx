
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { storageService } from '../services/storageService';
import { ICONS } from '../constants';
import { Culto } from '../types';

const CultosLista: React.FC = () => {
  const navigate = useNavigate();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const cultos = storageService.getCultos().reverse();

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-500">
       <header className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-black text-purple-dark">Histórico</h1>
            <p className="text-gray-text font-medium">Todos os cultos realizados e seus dados.</p>
          </div>
          <button 
            onClick={() => navigate('/cultos/iniciar')}
            className="bg-white text-purple-main p-4 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
          >
             {ICONS.Plus}
          </button>
       </header>

       <div className="space-y-4">
          {cultos.map(culto => {
            const isExpanded = expandedId === culto.id;
            const sessionCheckins = storageService.getCheckins().filter(c => c.idCulto === culto.id);
            const totalKids = sessionCheckins.length;
            const uniqueKids = new Set(sessionCheckins.map(c => c.idCrianca)).size;

            return (
              <div key={culto.id} className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden transition-all duration-300">
                 <div 
                  onClick={() => setExpandedId(isExpanded ? null : culto.id)}
                  className="p-8 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"
                 >
                    <div className="flex items-center gap-6">
                       <div className={`p-4 rounded-2xl shadow-inner ${culto.status === 'ativo' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                          {ICONS.Calendar}
                       </div>
                       <div>
                          <h3 className="text-xl font-black text-purple-dark uppercase tracking-tight">{culto.tipo === 'Outros' ? culto.tipoManual : culto.tipo}</h3>
                          <p className="text-xs font-black text-gray-400 uppercase tracking-widest">{new Date(culto.data).toLocaleDateString('pt-BR')} • Início: {culto.horaInicio}</p>
                       </div>
                    </div>

                    <div className="flex items-center gap-6">
                       <div className="hidden sm:block text-right">
                          <p className="text-lg font-black text-purple-main">{totalKids} Crianças</p>
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{culto.status === 'ativo' ? 'EM ANDAMENTO' : 'FINALIZADO'}</p>
                       </div>
                       <div className={`text-purple-main transition-transform duration-500 ${isExpanded ? 'rotate-90' : ''}`}>
                          {ICONS.ChevronRight}
                       </div>
                    </div>
                 </div>

                 {isExpanded && (
                   <div className="px-10 pb-10 pt-2 bg-gray-50/50 animate-in slide-in-from-top-4 duration-500">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-6">
                         <div className="bg-white p-6 rounded-[1.5rem] shadow-sm">
                            <p className="text-[10px] font-black text-gray-400 uppercase mb-2 tracking-widest">Responsáveis</p>
                            <p className="font-bold text-gray-700">{culto.responsaveis}</p>
                         </div>
                         <div className="bg-white p-6 rounded-[1.5rem] shadow-sm">
                            <p className="text-[10px] font-black text-gray-400 uppercase mb-2 tracking-widest">Horário Total</p>
                            <p className="font-bold text-gray-700">{culto.horaInicio} às {culto.horaFim || '--:--'}</p>
                         </div>
                         <div className="bg-white p-6 rounded-[1.5rem] shadow-sm">
                            <p className="text-[10px] font-black text-gray-400 uppercase mb-2 tracking-widest">Total Presenças</p>
                            <p className="font-bold text-purple-main">{totalKids}</p>
                         </div>
                         <div className="bg-white p-6 rounded-[1.5rem] shadow-sm">
                            <p className="text-[10px] font-black text-gray-400 uppercase mb-2 tracking-widest">Unicidade</p>
                            <p className="font-bold text-yellow-600">{uniqueKids} Crianças Únicas</p>
                         </div>
                      </div>
                      
                      {culto.status === 'ativo' && (
                        <button 
                          onClick={(e) => { e.stopPropagation(); navigate(`/cultos/ativo/${culto.id}`); }}
                          className="mt-8 w-full bg-purple-main text-white font-black py-5 rounded-2xl shadow-xl shadow-purple-main/20 uppercase tracking-widest text-xs"
                        >
                          Continuar Gerenciamento Ativo
                        </button>
                      )}
                   </div>
                 )}
              </div>
            )
          })}
          {cultos.length === 0 && (
             <div className="py-32 text-center text-gray-300">
                <div className="scale-150 mb-6 inline-block">{ICONS.Calendar}</div>
                <p className="font-black uppercase tracking-widest">Nenhum histórico encontrado.</p>
             </div>
          )}
       </div>
    </div>
  );
};

export default CultosLista;
