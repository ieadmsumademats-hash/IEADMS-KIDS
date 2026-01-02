
import React, { useState } from 'react';
import { storageService } from '../services/storageService';
import { ICONS } from '../constants';
import { Crianca } from '../types';

const CriancasLista: React.FC = () => {
  const [kids, setKids] = useState(storageService.getCriancas());
  const [search, setSearch] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const [form, setForm] = useState({
    nome: '', sobrenome: '', dataNascimento: '', responsavelNome: '', whatsapp: '', observacoes: ''
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const newKid: Crianca = {
      id: Date.now().toString(),
      ...form,
      createdAt: new Date().toISOString()
    };
    storageService.addCrianca(newKid);
    setKids([...kids, newKid]);
    setIsAdding(false);
    setForm({ nome: '', sobrenome: '', dataNascimento: '', responsavelNome: '', whatsapp: '', observacoes: '' });
  };

  const filtered = kids.filter(k => 
    (k.nome + ' ' + k.sobrenome).toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
       <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div>
            <h1 className="text-4xl font-black text-purple-dark">Crianças</h1>
            <p className="text-gray-text font-medium">Histórico de cadastros e contatos.</p>
          </div>
          <button 
            onClick={() => setIsAdding(true)}
            className="bg-purple-main text-white font-black px-10 py-5 rounded-3xl shadow-xl flex items-center justify-center gap-3 hover:scale-105 transition-all"
          >
             {ICONS.Plus} NOVO CADASTRO
          </button>
       </header>

       <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full">
             <span className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400">{ICONS.Search}</span>
             <input 
              type="text"
              placeholder="Buscar por nome ou sobrenome..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-16 pr-6 py-5 rounded-2xl bg-gray-light border-2 border-transparent focus:border-purple-main outline-none font-bold"
             />
          </div>
       </div>

       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filtered.map(kid => (
            <div key={kid.id} className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 p-8 flex items-start gap-6 hover:shadow-xl hover:border-purple-main/20 transition-all group">
               <div className="bg-purple-main/10 text-purple-main w-16 h-16 rounded-2xl flex items-center justify-center font-black text-2xl shrink-0 group-hover:bg-purple-main group-hover:text-white transition-colors">
                  {kid.nome[0]}
               </div>
               <div className="flex-1 overflow-hidden">
                  <h3 className="font-black text-purple-dark text-xl truncate mb-1">{kid.nome} {kid.sobrenome}</h3>
                  <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Responsável: {kid.responsavelNome}</p>
                  
                  <div className="flex items-center gap-3">
                     <a 
                      href={`https://wa.me/${kid.whatsapp}`} 
                      target="_blank" 
                      className="bg-green-500 text-white p-3 rounded-xl shadow-md hover:scale-110 transition-transform"
                     >
                        {ICONS.Phone}
                     </a>
                     <div className="bg-gray-light px-4 py-2 rounded-xl">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-tighter block">Nascimento</span>
                        <span className="text-xs font-bold text-gray-700">{new Date(kid.dataNascimento).toLocaleDateString()}</span>
                     </div>
                  </div>
               </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="col-span-full py-20 text-center text-gray-300">
               <div className="scale-150 mb-6 inline-block">{ICONS.Users}</div>
               <p className="font-black uppercase tracking-widest">Nenhum registro encontrado.</p>
            </div>
          )}
       </div>

       {isAdding && (
         <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-purple-dark/80 backdrop-blur-md">
            <div className="bg-white w-full max-w-3xl rounded-[3rem] p-10 shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar">
               <h2 className="text-3xl font-black text-purple-dark mb-10 uppercase tracking-tight">Cadastro Completo</h2>
               <form onSubmit={handleSave} className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                      <label className="block text-xs font-black text-gray-text uppercase tracking-widest mb-3">Nome</label>
                      <input required type="text" value={form.nome} onChange={e => setForm({...form, nome: e.target.value})} className="w-full bg-gray-light p-5 rounded-2xl font-bold border-2 border-transparent focus:border-purple-main outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs font-black text-gray-text uppercase tracking-widest mb-3">Sobrenome</label>
                      <input required type="text" value={form.sobrenome} onChange={e => setForm({...form, sobrenome: e.target.value})} className="w-full bg-gray-light p-5 rounded-2xl font-bold border-2 border-transparent focus:border-purple-main outline-none" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                      <label className="block text-xs font-black text-gray-text uppercase tracking-widest mb-3">Data de Nascimento</label>
                      <input required type="date" value={form.dataNascimento} onChange={e => setForm({...form, dataNascimento: e.target.value})} className="w-full bg-gray-light p-5 rounded-2xl font-bold border-2 border-transparent focus:border-purple-main outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs font-black text-gray-text uppercase tracking-widest mb-3">Responsável Legal</label>
                      <input required type="text" value={form.responsavelNome} onChange={e => setForm({...form, responsavelNome: e.target.value})} className="w-full bg-gray-light p-5 rounded-2xl font-bold border-2 border-transparent focus:border-purple-main outline-none" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-black text-gray-text uppercase tracking-widest mb-3">WhatsApp de Contato (Com DDD)</label>
                    <input required type="tel" value={form.whatsapp} onChange={e => setForm({...form, whatsapp: e.target.value})} placeholder="67999999999" className="w-full bg-gray-light p-5 rounded-2xl font-bold border-2 border-transparent focus:border-purple-main outline-none" />
                  </div>

                  <div>
                    <label className="block text-xs font-black text-gray-text uppercase tracking-widest mb-3">Observações Importantes (Alergias, etc)</label>
                    <textarea rows={3} value={form.observacoes} onChange={e => setForm({...form, observacoes: e.target.value})} className="w-full bg-gray-light p-5 rounded-2xl font-bold border-2 border-transparent focus:border-purple-main outline-none resize-none" />
                  </div>

                  <div className="grid grid-cols-2 gap-6 pt-4">
                    <button type="button" onClick={() => setIsAdding(false)} className="bg-gray-100 text-gray-500 font-black py-5 rounded-3xl">CANCELAR</button>
                    <button type="submit" className="bg-purple-main text-white font-black py-5 rounded-3xl shadow-xl shadow-purple-main/20">SALVAR DADOS</button>
                  </div>
               </form>
            </div>
         </div>
       )}
    </div>
  );
};

export default CriancasLista;
