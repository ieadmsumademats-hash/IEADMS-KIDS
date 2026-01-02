
import React, { useState, useEffect } from 'react';
import { storageService } from '../services/storageService';
import { ICONS } from '../constants';
import { Crianca } from '../types';

const CriancasLista: React.FC = () => {
  const [kids, setKids] = useState<Crianca[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const [form, setForm] = useState({
    nome: '', sobrenome: '', dataNascimento: '', responsavelNome: '', whatsapp: '', observacoes: ''
  });

  useEffect(() => {
    loadKids();
  }, []);

  const loadKids = async () => {
    setLoading(true);
    const list = await storageService.getCriancas();
    setKids(list);
    setLoading(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const newKid: Omit<Crianca, 'id'> = {
      ...form,
      createdAt: new Date().toISOString()
    };
    await storageService.addCrianca(newKid);
    await loadKids();
    setIsAdding(false);
    setForm({ nome: '', sobrenome: '', dataNascimento: '', responsavelNome: '', whatsapp: '', observacoes: '' });
  };

  const filtered = kids.filter(k => 
    (k.nome + ' ' + k.sobrenome).toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
       <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-purple-dark uppercase tracking-tight">Crianças</h1>
            <p className="text-xs text-gray-text font-medium">Gestão de cadastros e históricos.</p>
          </div>
          <button 
            onClick={() => setIsAdding(true)}
            className="bg-purple-main text-white font-black px-6 py-3 rounded-2xl shadow-lg flex items-center justify-center gap-2 hover:scale-105 transition-all text-xs uppercase"
          >
             {ICONS.Plus} Novo Cadastro
          </button>
       </header>

       <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
          <div className="relative w-full">
             <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">{ICONS.Search}</span>
             <input 
              type="text"
              placeholder="Pesquisar..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-3 rounded-xl bg-gray-light border-2 border-transparent focus:border-purple-main outline-none font-bold text-sm"
             />
          </div>
       </div>

       {loading ? (
         <div className="text-center py-10 text-purple-main font-bold">Carregando...</div>
       ) : (
         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(kid => (
              <div key={kid.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex items-start gap-4 hover:border-purple-main/20 transition-all">
                 <div className="bg-purple-main/10 text-purple-main w-12 h-12 rounded-xl flex items-center justify-center font-black text-xl shrink-0">
                    {kid.nome[0]}
                 </div>
                 <div className="flex-1 overflow-hidden">
                    <h3 className="font-black text-purple-dark text-sm truncate">{kid.nome} {kid.sobrenome}</h3>
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-3">Resp: {kid.responsavelNome}</p>
                    
                    <div className="flex items-center gap-2">
                       <a 
                        href={`https://wa.me/${kid.whatsapp}`} 
                        target="_blank" 
                        className="bg-green-500 text-white p-2 rounded-lg shadow-md"
                       >
                          {ICONS.Phone}
                       </a>
                       <div className="bg-gray-light px-3 py-1 rounded-lg">
                          <span className="text-[8px] font-black text-gray-400 uppercase block">Idade</span>
                          <span className="text-[10px] font-bold text-gray-700">{new Date().getFullYear() - new Date(kid.dataNascimento).getFullYear()} anos</span>
                       </div>
                    </div>
                 </div>
              </div>
            ))}
         </div>
       )}

       {isAdding && (
         <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-purple-dark/60 backdrop-blur-sm">
            <div className="bg-white w-full max-w-xl rounded-2xl p-6 shadow-2xl overflow-y-auto max-h-[90vh]">
               <h2 className="text-xl font-black text-purple-dark mb-6 uppercase tracking-tight">Novo Cadastro</h2>
               <form onSubmit={handleSave} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <input required placeholder="Nome" value={form.nome} onChange={e => setForm({...form, nome: e.target.value})} className="bg-gray-light p-3 rounded-xl font-bold text-sm" />
                    <input required placeholder="Sobrenome" value={form.sobrenome} onChange={e => setForm({...form, sobrenome: e.target.value})} className="bg-gray-light p-3 rounded-xl font-bold text-sm" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <input required type="date" value={form.dataNascimento} onChange={e => setForm({...form, dataNascimento: e.target.value})} className="bg-gray-light p-3 rounded-xl font-bold text-sm" />
                    <input required placeholder="Responsável" value={form.responsavelNome} onChange={e => setForm({...form, responsavelNome: e.target.value})} className="bg-gray-light p-3 rounded-xl font-bold text-sm" />
                  </div>
                  <input required placeholder="WhatsApp" value={form.whatsapp} onChange={e => setForm({...form, whatsapp: e.target.value})} className="w-full bg-gray-light p-3 rounded-xl font-bold text-sm" />
                  <textarea rows={2} placeholder="Observações" value={form.observacoes} onChange={e => setForm({...form, observacoes: e.target.value})} className="w-full bg-gray-light p-3 rounded-xl font-bold text-sm resize-none" />
                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <button type="button" onClick={() => setIsAdding(false)} className="bg-gray-100 text-gray-500 font-black py-4 rounded-xl text-xs uppercase">FECHAR</button>
                    <button type="submit" className="bg-purple-main text-white font-black py-4 rounded-xl shadow-lg text-xs uppercase">SALVAR</button>
                  </div>
               </form>
            </div>
         </div>
       )}
    </div>
  );
};

export default CriancasLista;
