
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ICONS } from '../constants';
import { storageService } from '../services/storageService';
import { Culto } from '../types';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [activeCulto, setActiveCulto] = useState<Culto | null>(null);
  const [counts, setCounts] = useState({ kids: 0, sessions: 0, latest: [] as Culto[] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      const [kids, cultos] = await Promise.all([
        storageService.getCriancas(),
        storageService.getCultos()
      ]);
      
      setCounts({
        kids: kids.length,
        sessions: cultos.length,
        latest: cultos.slice(0, 4)
      });
      setLoading(false);
    };

    loadData();
    const unsubscribe = storageService.subscribeToActiveCulto(setActiveCulto);
    return () => unsubscribe();
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center h-40 text-purple-main font-bold">Carregando painel...</div>;
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 text-center lg:text-left">
        <div>
          <h1 className="text-3xl font-black text-purple-dark tracking-tight uppercase">Painel Principal</h1>
          <p className="text-gray-text text-sm font-medium">Controle de fluxo em tempo real.</p>
        </div>
        
        {!activeCulto ? (
          <button
            onClick={() => navigate('/cultos/iniciar')}
            className="bg-yellow-main hover:bg-yellow-secondary text-purple-dark font-black px-8 py-4 rounded-[1.5rem] shadow-xl flex items-center justify-center gap-3 transition-all transform active:scale-95 group text-sm"
          >
            <span className="bg-purple-dark text-white p-2 rounded-xl group-hover:scale-110 transition-transform">{ICONS.Play}</span>
            INICIAR NOVO CULTO
          </button>
        ) : (
          <button
            onClick={() => navigate(`/cultos/ativo/${activeCulto.id}`)}
            className="bg-green-500 hover:bg-green-600 text-white font-black px-8 py-4 rounded-[1.5rem] shadow-xl flex items-center justify-center gap-3 transition-all transform active:scale-95 group text-sm"
          >
            <span className="bg-white text-green-600 p-2 rounded-xl group-hover:scale-110 transition-transform">{ICONS.QrCode}</span>
            GERENCIAR CULTO ATIVO
          </button>
        )}
      </header>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
        <div className="bg-white p-5 md:p-7 rounded-[2rem] shadow-sm border border-gray-100 group hover:shadow-md transition-shadow">
          <div className="bg-purple-main/10 w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center text-purple-main mb-3 md:mb-4">
            {ICONS.Baby}
          </div>
          <p className="text-gray-text font-black uppercase text-[10px] md:text-xs tracking-widest mb-1">Crianças</p>
          <p className="text-3xl md:text-4xl font-black text-purple-dark tracking-tighter">{counts.kids}</p>
        </div>

        <div className="bg-white p-5 md:p-7 rounded-[2rem] shadow-sm border border-gray-100 group hover:shadow-md transition-shadow">
          <div className="bg-yellow-main/10 w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center text-yellow-main mb-3 md:mb-4">
            {ICONS.Calendar}
          </div>
          <p className="text-gray-text font-black uppercase text-[10px] md:text-xs tracking-widest mb-1">Total Cultos</p>
          <p className="text-3xl md:text-4xl font-black text-purple-dark tracking-tighter">{counts.sessions}</p>
        </div>

        <div className="col-span-2 md:col-span-1 bg-white p-5 md:p-7 rounded-[2rem] shadow-sm border border-gray-100 flex flex-col justify-center">
          <p className="text-gray-text font-black uppercase text-xs tracking-widest mb-3">Acesso Rápido Pais</p>
          <div className="bg-gray-light p-4 rounded-2xl flex items-center gap-3 border-2 border-dashed border-gray-200">
            <div className="bg-white p-2.5 rounded-xl shadow-sm text-purple-main">{ICONS.QrCode}</div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-black text-purple-main truncate">/pais</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <section className="lg:col-span-8 bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-black text-purple-dark uppercase tracking-tight">Últimos Cultos</h2>
            <button onClick={() => navigate('/cultos')} className="text-purple-main font-black text-xs bg-purple-main/10 px-4 py-2 rounded-full hover:bg-purple-main hover:text-white transition-all">Ver Histórico</button>
          </div>
          
          <div className="space-y-2 md:space-y-3">
            {counts.latest.map(culto => (
              <div key={culto.id} className="flex items-center justify-between p-3 md:p-5 bg-gray-light rounded-2xl hover:bg-gray-200/50 transition-colors group">
                <div className="flex items-center gap-3 md:gap-5">
                  <div className="hidden md:block bg-white p-3.5 rounded-xl shadow-sm text-purple-main group-hover:scale-110 transition-transform">
                    {ICONS.Calendar}
                  </div>
                  <div>
                    <h4 className="font-black text-purple-dark text-sm md:text-base">{culto.tipo === 'Outros' ? culto.tipoManual : culto.tipo}</h4>
                    <p className="text-[10px] md:text-xs text-gray-text font-bold uppercase tracking-tight">{new Date(culto.data).toLocaleDateString()} • {culto.horaInicio}</p>
                  </div>
                </div>
                <div className={`px-3 py-1 md:px-4 md:py-1.5 rounded-full text-[8px] md:text-[10px] font-black uppercase tracking-widest ${
                  culto.status === 'ativo' ? 'bg-green-100 text-green-600 animate-pulse' : 'bg-gray-200 text-gray-500'
                }`}>
                  {culto.status === 'ativo' ? 'ATIVO' : 'FINALIZADO'}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="lg:col-span-4 bg-purple-main p-8 rounded-[2.5rem] shadow-xl text-white relative overflow-hidden">
          <div className="absolute top-[-20px] right-[-20px] w-32 h-32 bg-white/10 rounded-full blur-2xl" />
          <h2 className="kids-font text-2xl font-bold mb-4">Nuvem Kids</h2>
          <p className="text-white/80 font-medium leading-relaxed text-sm mb-8">
            Os dados são sincronizados automaticamente em todos os dispositivos da equipe.
          </p>
          <div className="bg-white/10 p-4 rounded-2xl border border-white/20 flex items-center gap-4">
             <div className="bg-yellow-main text-purple-dark p-2.5 rounded-xl shadow-lg">{ICONS.CheckCircle}</div>
             <p className="text-xs font-black uppercase tracking-widest">Sincronizado</p>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Dashboard;
