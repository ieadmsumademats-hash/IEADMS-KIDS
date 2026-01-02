
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
    return <div className="flex items-center justify-center h-64 text-purple-main font-bold">Carregando painel...</div>;
  }

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-purple-dark tracking-tight mb-2">Página Inicial</h1>
          <p className="text-gray-text text-lg font-medium">Gestão de fluxo e segurança para o Culto Kids.</p>
        </div>
        
        {!activeCulto ? (
          <button
            onClick={() => navigate('/cultos/iniciar')}
            className="bg-yellow-main hover:bg-yellow-secondary text-purple-dark font-black px-10 py-5 rounded-[2rem] shadow-2xl flex items-center justify-center gap-4 transition-all transform hover:-translate-y-1 active:scale-95 group"
          >
            <span className="bg-purple-dark text-white p-2 rounded-xl group-hover:scale-110 transition-transform">{ICONS.Play}</span>
            INICIAR NOVO CULTO
          </button>
        ) : (
          <button
            onClick={() => navigate(`/cultos/ativo/${activeCulto.id}`)}
            className="bg-green-500 hover:bg-green-600 text-white font-black px-10 py-5 rounded-[2rem] shadow-2xl flex items-center justify-center gap-4 transition-all transform hover:-translate-y-1 active:scale-95 group"
          >
            <span className="bg-white text-green-600 p-2 rounded-xl group-hover:scale-110 transition-transform">{ICONS.QrCode}</span>
            GERENCIAR CULTO ATIVO
          </button>
        )}
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-gray-100 relative overflow-hidden group">
          <div className="bg-purple-main/10 w-16 h-16 rounded-[1.5rem] flex items-center justify-center text-purple-main mb-6 transition-transform group-hover:scale-110">
            {ICONS.Baby}
          </div>
          <p className="text-gray-text font-black uppercase text-xs tracking-widest mb-1">Crianças Cadastradas</p>
          <p className="text-5xl font-black text-purple-dark">{counts.kids}</p>
        </div>

        <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-gray-100 relative overflow-hidden group">
          <div className="bg-yellow-main/10 w-16 h-16 rounded-[1.5rem] flex items-center justify-center text-yellow-main mb-6 transition-transform group-hover:scale-110">
            {ICONS.Calendar}
          </div>
          <p className="text-gray-text font-black uppercase text-xs tracking-widest mb-1">Total de Cultos</p>
          <p className="text-5xl font-black text-purple-dark">{counts.sessions}</p>
        </div>

        <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-gray-100 flex flex-col justify-center">
          <p className="text-gray-text font-black uppercase text-xs tracking-widest mb-4">Acesso aos Pais</p>
          <div className="bg-gray-light p-4 rounded-2xl flex items-center gap-3 border-2 border-dashed border-gray-200">
            <div className="bg-white p-3 rounded-xl shadow-sm">{ICONS.QrCode}</div>
            <div className="flex-1 overflow-hidden">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">Portal do Responsável</p>
              <p className="text-sm font-bold text-purple-main truncate">/pais</p>
            </div>
          </div>
          <button 
            onClick={() => navigate('/pais')}
            className="mt-6 text-purple-main font-black text-xs uppercase tracking-widest flex items-center gap-2 hover:translate-x-1 transition-transform"
          >
            Abrir Portal dos Pais {ICONS.ChevronRight}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <section className="lg:col-span-8 bg-white p-10 rounded-[2.5rem] shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-10">
            <h2 className="text-2xl font-black text-purple-dark">Últimos Eventos</h2>
            <button onClick={() => navigate('/cultos')} className="text-purple-main font-bold text-sm bg-purple-main/5 px-4 py-2 rounded-full hover:bg-purple-main hover:text-white transition-all">Ver Histórico</button>
          </div>
          
          <div className="space-y-4">
            {counts.latest.map(culto => (
              <div key={culto.id} className="flex items-center justify-between p-6 bg-gray-light rounded-[2rem] hover:bg-gray-100 transition-colors cursor-pointer group">
                <div className="flex items-center gap-5">
                  <div className="bg-white p-4 rounded-2xl shadow-sm text-purple-main group-hover:scale-110 transition-transform">
                    {ICONS.Calendar}
                  </div>
                  <div>
                    <h4 className="font-black text-purple-dark text-lg">{culto.tipo === 'Outros' ? culto.tipoManual : culto.tipo}</h4>
                    <p className="text-xs text-gray-text font-bold uppercase tracking-wider">{new Date(culto.data).toLocaleDateString('pt-BR')} • {culto.horaInicio}</p>
                  </div>
                </div>
                <div className={`px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest ${
                  culto.status === 'ativo' ? 'bg-green-100 text-green-600' : 'bg-gray-200 text-gray-500'
                }`}>
                  {culto.status === 'ativo' ? 'EM ANDAMENTO' : 'FINALIZADO'}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="lg:col-span-4 space-y-8">
          <div className="bg-purple-main p-10 rounded-[2.5rem] shadow-2xl text-white relative overflow-hidden">
            <h2 className="kids-font text-3xl font-bold mb-6">Nuvem IEADMS</h2>
            <p className="text-white/80 font-medium leading-relaxed mb-8">
              Todos os dados estão sendo sincronizados com o banco de dados oficial em tempo real. Segurança total para os pequeninos.
            </p>
            <div className="bg-white/10 p-5 rounded-2xl border border-white/10 flex items-center gap-4">
               <div className="bg-yellow-main text-purple-dark p-3 rounded-xl">{ICONS.CheckCircle}</div>
               <p className="text-xs font-bold leading-tight uppercase tracking-tight">Sincronização Ativa e Segura.</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Dashboard;
