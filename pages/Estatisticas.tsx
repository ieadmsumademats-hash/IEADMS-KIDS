
import React, { useState, useEffect } from 'react';
import { storageService } from '../services/storageService';
import { ICONS } from '../constants';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Culto, CheckIn, Crianca } from '../types';

const Estatisticas: React.FC = () => {
  const [data, setData] = useState<{ cultos: Culto[], kids: Crianca[], checkins: CheckIn[] } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const [cultos, kids, checkins] = await Promise.all([
        storageService.getCultos(),
        storageService.getCriancas(),
        storageService.getAllCheckins()
      ]);
      setData({ cultos, kids, checkins });
      setLoading(false);
    };
    load();
  }, []);

  if (loading || !data) {
    return <div className="text-center py-20 text-purple-main font-bold">Gerando relatórios...</div>;
  }

  // Cálculos solicitados
  const totalKids = data.kids.length;
  
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const newKids30Days = data.kids.filter(k => k.createdAt && new Date(k.createdAt) >= thirtyDaysAgo).length;

  const ultimoCulto = data.cultos[0];
  const totalUltimoCulto = ultimoCulto ? data.checkins.filter(ch => ch.idCulto === ultimoCulto.id).length : 0;

  const chartData = data.cultos.slice(0, 8).reverse().map(c => ({
    name: new Date(c.data).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
    total: data.checkins.filter(ch => ch.idCulto === c.id).length
  }));

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
       <header>
          <h1 className="text-3xl font-black text-purple-dark uppercase tracking-tight">Estatísticas</h1>
          <p className="text-gray-text text-xs font-bold opacity-60 uppercase tracking-widest">Desempenho do Culto Kids</p>
       </header>

       <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-purple-main/5 p-6 rounded-2xl border border-purple-main/10">
             <p className="text-[9px] font-black text-purple-main uppercase tracking-widest mb-1">Total de Crianças Cadastradas</p>
             <p className="text-4xl font-black text-purple-dark">{totalKids}</p>
          </div>
          <div className="bg-yellow-main/10 p-6 rounded-2xl border border-yellow-main/20">
             <p className="text-[9px] font-black text-yellow-700 uppercase tracking-widest mb-1">Cadastros (Últimos 30 dias)</p>
             <p className="text-4xl font-black text-purple-dark">{newKids30Days}</p>
          </div>
          <div className="bg-green-50 p-6 rounded-2xl border border-green-200">
             <p className="text-[9px] font-black text-green-600 uppercase tracking-widest mb-1">Crianças no Último Culto</p>
             <p className="text-4xl font-black text-purple-dark">{totalUltimoCulto}</p>
          </div>
       </div>

       <div className="bg-white p-6 md:p-10 rounded-3xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-8">
             <div className="bg-purple-main text-white p-2.5 rounded-xl">{ICONS.BarChart}</div>
             <h3 className="text-sm font-black text-purple-dark uppercase tracking-widest">Evolução de quantidade de crianças por culto</h3>
          </div>
          
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#999', fontSize: 10, fontWeight: 'bold'}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#999', fontSize: 10, fontWeight: 'bold'}} />
                <Tooltip cursor={{fill: '#f9f9f9'}} contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', padding: '12px', fontSize: '12px', fontWeight: 'bold'}} />
                <Bar dataKey="total" radius={[8, 8, 0, 0]} barSize={40}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#7E3FA0' : '#FFC800'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
       </div>
    </div>
  );
};

export default Estatisticas;
