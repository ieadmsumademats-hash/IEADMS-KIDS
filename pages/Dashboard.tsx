
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ICONS } from '../constants';
import { storageService } from '../services/storageService';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const activeCulto = storageService.getActiveCulto();
  const kidsCount = storageService.getCriancas().length;
  const sessionsCount = storageService.getCultos().length;

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
          <p className="text-5xl font-black text-purple-dark">{kidsCount}</p>
          <div className="absolute -right-6 -bottom-6 text-purple-main/5 transform -rotate-12">{ICONS.Baby}</div>
        </div>

        <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-gray-100 relative overflow-hidden group">
          <div className="bg-yellow-main/10 w-16 h-16 rounded-[1.5rem] flex items-center justify-center text-yellow-main mb-6 transition-transform group-hover:scale-110">
            {ICONS.Calendar}
          </div>
          <p className="text-gray-text font-black uppercase text-xs tracking-widest mb-1">Total de Cultos</p>
          <p className="text-5xl font-black text-purple-dark">{sessionsCount}</p>
          <div className="absolute -right-6 -bottom-6 text-yellow-main/5 transform -rotate-12">{ICONS.Calendar}</div>
        </div>

        <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-gray-100 flex flex-col justify-center">
          <p className="text-gray-text font-black uppercase text-xs tracking-widest mb-4">Acesso aos Pais</p>
          <div className="bg-gray-light p-4 rounded-2xl flex items-center gap-3 border-2 border-dashed border-gray-200">
            <div className="bg-white p-3 rounded-xl shadow-sm">{ICONS.QrCode}</div>
            <div className="flex-1 overflow-hidden">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">Link de Cadastro</p>
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
            {storageService.getCultos().slice(-4).reverse().map(culto => (
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
            {sessionsCount === 0 && (
              <div className="text-center py-16">
                <div className="text-gray-200 mb-4 scale-150 inline-block">{ICONS.Calendar}</div>
                <p className="text-gray-text font-bold italic">Nenhum culto registrado ainda.</p>
              </div>
            )}
          </div>
        </section>

        <section className="lg:col-span-4 space-y-8">
          <div className="bg-purple-main p-10 rounded-[2.5rem] shadow-2xl text-white relative overflow-hidden">
            <h2 className="kids-font text-3xl font-bold mb-6">Aviso Rápido</h2>
            <p className="text-white/80 font-medium leading-relaxed mb-8">
              O pré-check-in gera um código KIDS-#### que expira ao fim do culto. Utilize o buscador por código para agilizar a entrada!
            </p>
            <div className="bg-white/10 p-5 rounded-2xl border border-white/10 flex items-center gap-4">
               <div className="bg-yellow-main text-purple-dark p-3 rounded-xl">{ICONS.Info}</div>
               <p className="text-xs font-bold leading-tight uppercase tracking-tight">Sempre verifique o WhatsApp do responsável.</p>
            </div>
            <div className="absolute top-[-20px] right-[-20px] bg-white/5 w-32 h-32 rounded-full" />
          </div>

          <div className="bg-yellow-main p-10 rounded-[2.5rem] shadow-xl">
             <h3 className="text-purple-dark font-black text-lg mb-4 uppercase tracking-tighter">Próximo Passo?</h3>
             <button 
              onClick={() => navigate('/criancas')}
              className="w-full bg-purple-dark text-white font-black py-4 rounded-2xl flex items-center justify-center gap-3 shadow-lg hover:scale-[1.02] transition-transform"
             >
                {ICONS.Plus} CADASTRAR CRIANÇA
             </button>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Dashboard;
