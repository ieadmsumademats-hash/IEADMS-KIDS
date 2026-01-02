
import React from 'react';
import { storageService } from '../services/storageService';
import { ICONS } from '../constants';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const Estatisticas: React.FC = () => {
  const cultos = storageService.getCultos();
  const kids = storageService.getCriancas();
  const checkins = storageService.getCheckins();

  const chartData = cultos.slice(-6).map(c => ({
    name: new Date(c.data).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
    total: checkins.filter(ch => ch.idCulto === c.id).length
  }));

  const avgAttendance = cultos.length > 0 ? (checkins.length / cultos.length).toFixed(1) : '0';

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
       <header>
          <h1 className="text-4xl font-black text-purple-dark">Estatísticas</h1>
          <p className="text-gray-text font-medium">Insights sobre a frequência e crescimento do ministério.</p>
       </header>

       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {[
            { label: 'Total Kids', val: kids.length, color: 'text-purple-main', bg: 'bg-purple-main/5' },
            { label: 'Média/Culto', val: avgAttendance, color: 'text-yellow-main', bg: 'bg-yellow-main/10' },
            { label: 'Frequência Total', val: checkins.length, color: 'text-green-500', bg: 'bg-green-500/10' },
            { label: 'Sessões', val: cultos.length, color: 'text-blue-500', bg: 'bg-blue-500/10' }
          ].map((card, i) => (
            <div key={i} className={`${card.bg} p-10 rounded-[2.5rem] border border-transparent hover:border-white transition-all`}>
               <p className="text-[10px] font-black text-gray-text uppercase tracking-widest mb-2">{card.label}</p>
               <p className={`text-5xl font-black ${card.color}`}>{card.val}</p>
            </div>
          ))}
       </div>

       <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-gray-100">
          <div className="flex items-center gap-4 mb-10">
             <div className="bg-purple-main text-white p-3 rounded-2xl">{ICONS.BarChart}</div>
             <h3 className="text-2xl font-black text-purple-dark uppercase tracking-tight">Presença nos Últimos 6 Cultos</h3>
          </div>
          
          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#999', fontSize: 12, fontWeight: 'bold'}} dy={15} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#999', fontSize: 12, fontWeight: 'bold'}} />
                <Tooltip cursor={{fill: '#f9f9f9'}} contentStyle={{borderRadius: '24px', border: 'none', boxShadow: '0 20px 40px rgba(0,0,0,0.1)', padding: '15px'}} />
                <Bar dataKey="total" radius={[12, 12, 0, 0]} barSize={50}>
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
