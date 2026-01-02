
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
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-purple-dark tracking-tight">Painel Principal</h1>
          <p className="text-gray-text text-sm font-medium">Gestão de fluxo e segurança Kids.</p>
        </div>
        
        {!activeCulto ? (
          <button
            onClick={() => navigate('/cultos/iniciar')}
            className="bg-yellow-main hover:bg-yellow-secondary text-purple-dark font-black px-6 py-3 rounded-2xl shadow-lg flex items-center justify-center gap-3 transition-all transform active:scale-95 group text-sm"
          >
            <span className="bg-purple-dark text-white p-1.5 rounded-lg group-hover:scale-105 transition-transform">{ICONS.Play}</span>
            INICIAR NOVO CULTO
          </button>
        ) : (
          <button
            onClick={() => navigate(`/cultos/ativo/${activeCulto.id}`)}
            className="bg-green-500 hover:bg-green-600 text-white font-black px-6 py-3 rounded-2xl shadow-lg flex items-center justify-center gap-3 transition-all transform active:scale-95 group text-sm"
          >
            <span className="bg-white text-green-600 p-1.5 rounded-lg group-hover:scale-105 transition-transform">{ICONS.QrCode}</span>
            GERENCIAR CULTO ATIVO
          </button>
        )}
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 group">
          <div className="bg-purple-main/10 w-12 h-12 rounded-xl flex items-center justify-center text-purple-main mb-3">
            {ICONS.Baby}
          </div>
          <p className="text-gray-text font-black uppercase text-[10px] tracking-widest mb-0.5">Crianças</p>
          <p className="text-3xl font-black text-purple-dark">{counts.kids}</p>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 group">
          <div className="bg-yellow-main/10 w-12 h-12 rounded-xl flex items-center justify-center text-yellow-main mb-3">
            {ICONS.Calendar}
          </div>
          <p className="text-gray-text font-black uppercase text-[10px] tracking-widest mb-0.5">Total Cultos</p>
          <p className="text-3xl font-black text-purple-dark">{counts.sessions}</p>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col justify-center">
          <p className="text-gray-text font-black uppercase text-[10px] tracking-widest mb-2">Acesso Pais</p>
          <div className="bg-gray-light p-3 rounded-xl flex items-center gap-2 border border-dashed border-gray-200">
            <div className="bg-white p-2 rounded-lg shadow-sm">{ICONS.QrCode}</div>
            <div className="flex-1 overflow-hidden">
              <p className="text-xs font-bold text-purple-main truncate">/pais</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <section className="lg:col-span-8 bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-black text-purple-dark">Últimos Cultos</h2>
            <button onClick={() => navigate('/cultos')} className="text-purple-main font-bold text-xs bg-purple-main/5 px-3 py-1.5 rounded-full">Ver tudo</button>
          </div>
          
          <div className="space-y-2">
            {counts.latest.map(culto => (
              <div key={culto.id} className="flex items-center justify-between p-4 bg-gray-light rounded-2xl group">
                <div className="flex items-center gap-4">
                  <div className="bg-white p-3 rounded-xl shadow-sm text-purple-main">
                    {ICONS.Calendar}
                  </div>
                  <div>
                    <h4 className="font-black text-purple-dark text-sm">{culto.tipo === 'Outros' ? culto.tipoManual : culto.tipo}</h4>
                    <p className="text-[10px] text-gray-text font-bold uppercase">{new Date(culto.data).toLocaleDateString()} • {culto.horaInicio}</p>
                  </div>
                </div>
                <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase ${
                  culto.status === 'ativo' ? 'bg-green-100 text-green-600' : 'bg-gray-200 text-gray-500'
                }`}>
                  {culto.status === 'ativo' ? 'ATIVO' : 'FIM'}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="lg:col-span-4 bg-purple-main p-6 rounded-3xl shadow-xl text-white">
          <h2 className="kids-font text-xl font-bold mb-3">Nuvem IEADMS</h2>
          <p className="text-white/80 font-medium leading-snug text-xs mb-6">
            Dados sincronizados em tempo real com segurança total.
          </p>
          <div className="bg-white/10 p-3 rounded-xl border border-white/10 flex items-center gap-3">
             <div className="bg-yellow-main text-purple-dark p-2 rounded-lg">{ICONS.CheckCircle}</div>
             <p className="text-[10px] font-black uppercase tracking-tight">Status: Online e Seguro</p>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Dashboard;
