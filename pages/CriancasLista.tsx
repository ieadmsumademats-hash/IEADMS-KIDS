
import React, { useState, useEffect } from 'react';
import { storageService } from '../services/storageService';
import { ICONS } from '../constants';
import { Crianca } from '../types';

const formatPhone = (value: string) => {
  if (!value) return value;
  const phoneNumber = value.replace(/[^\d]/g, '');
  const phoneNumberLength = phoneNumber.length;
  if (phoneNumberLength < 3) return phoneNumber;
  if (phoneNumberLength < 7) {
    return `(${phoneNumber.slice(0, 2)}) ${phoneNumber.slice(2)}`;
  }
  return `(${phoneNumber.slice(0, 2)}) ${phoneNumber.slice(2, 7)}-${phoneNumber.slice(7, 11)}`;
};

const CriancasLista: React.FC = () => {
  const [kids, setKids] = useState<Crianca[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [editingKidId, setEditingKidId] = useState<string | null>(null);
  const [deletingKidId, setDeletingKidId] = useState<string | null>(null);

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

  const handleEdit = (kid: Crianca) => {
    setEditingKidId(kid.id);
    setForm({
      nome: kid.nome,
      sobrenome: kid.sobrenome,
      dataNascimento: kid.dataNascimento,
      responsavelNome: kid.responsavelNome,
      whatsapp: kid.whatsapp,
      observacoes: kid.observacoes || ''
    });
    setIsAdding(true);
  };

  const handleDelete = async () => {
    if (!deletingKidId) return;
    try {
      await storageService.deleteCrianca(deletingKidId);
      await loadKids();
      setDeletingKidId(null);
    } catch (e) {
      alert("Erro ao excluir cadastro. Verifique se a criança possui histórico de check-ins.");
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingKidId) {
        await storageService.updateCrianca(editingKidId, form);
      } else {
        const newKid: Omit<Crianca, 'id'> = {
          ...form,
          createdAt: new Date().toISOString()
        };
        await storageService.addCrianca(newKid);
      }
      await loadKids();
      closeModal();
    } catch (error) {
      alert("Erro ao salvar cadastro. Tente novamente.");
    }
  };

  const closeModal = () => {
    setIsAdding(false);
    setEditingKidId(null);
    setForm({ nome: '', sobrenome: '', dataNascimento: '', responsavelNome: '', whatsapp: '', observacoes: '' });
  };

  const filtered = kids.filter(k => 
    (k.nome + ' ' + k.sobrenome).toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
       <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-black text-purple-dark uppercase tracking-tight">Crianças</h1>
            <p className="text-sm text-gray-text font-medium">Gestão de cadastros e histórico individual.</p>
          </div>
          <button 
            onClick={() => setIsAdding(true)}
            className="bg-purple-main text-white font-black px-8 py-4 rounded-2xl shadow-xl flex items-center justify-center gap-3 hover:scale-105 transition-all text-xs uppercase tracking-widest"
          >
             {ICONS.Plus} Novo Cadastro
          </button>
       </header>

       <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100">
          <div className="relative w-full">
             <span className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400">{ICONS.Search}</span>
             <input 
              type="text"
              placeholder="Buscar por nome ou sobrenome..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-14 pr-6 py-4 rounded-2xl bg-gray-light border-2 border-transparent focus:border-purple-main outline-none font-bold text-base"
             />
          </div>
       </div>

       {loading ? (
         <div className="text-center py-20 text-purple-main font-bold">Carregando base de dados...</div>
       ) : (
         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map(kid => (
              <div key={kid.id} className="bg-white rounded-[2rem] shadow-sm border border-gray-100 p-6 flex items-start gap-5 hover:border-purple-main/30 hover:shadow-md transition-all group">
                 <div className="bg-purple-main/10 text-purple-main w-14 h-14 rounded-2xl flex items-center justify-center font-black text-2xl shrink-0 group-hover:bg-purple-main group-hover:text-white transition-colors">
                    {kid.nome[0]}
                 </div>
                 <div className="flex-1 overflow-hidden">
                    <h3 className="font-black text-purple-dark text-lg truncate mb-1">{kid.nome} {kid.sobrenome}</h3>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Resp: {kid.responsavelNome}</p>
                    
                    <div className="flex items-center gap-2">
                       <a 
                        href={`https://wa.me/${kid.whatsapp.replace(/[^\d]/g, '')}`} 
                        target="_blank" 
                        className="bg-green-500 text-white p-2.5 rounded-xl shadow-lg hover:bg-green-600 transition-colors"
                        title="Abrir WhatsApp"
                       >
                          {ICONS.Phone}
                       </a>
                       
                       <button 
                        onClick={() => handleEdit(kid)}
                        className="bg-purple-main text-white p-2.5 rounded-xl shadow-lg hover:bg-purple-dark transition-colors"
                        title="Editar Cadastro"
                       >
                          {ICONS.Edit}
                       </button>

                       <button 
                        onClick={() => setDeletingKidId(kid.id)}
                        className="bg-red-500 text-white p-2.5 rounded-xl shadow-lg hover:bg-red-600 transition-colors"
                        title="Excluir Cadastro"
                       >
                          {ICONS.Trash}
                       </button>

                       <div className="bg-gray-light px-3 py-2 rounded-xl border border-gray-200/50 flex-1 min-w-0">
                          <span className="text-[9px] font-black text-gray-400 uppercase block leading-none mb-1">Idade</span>
                          <span className="text-xs font-black text-gray-700">{new Date().getFullYear() - new Date(kid.dataNascimento).getFullYear()} anos</span>
                       </div>
                    </div>
                    <p className="mt-3 text-[10px] font-black text-gray-400">{formatPhone(kid.whatsapp)}</p>
                 </div>
              </div>
            ))}
         </div>
       )}

       {/* Modal Adicionar / Editar */}
       {isAdding && (
         <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-purple-dark/70 backdrop-blur-md">
            <div className="bg-white w-full max-w-2xl rounded-[2.5rem] p-10 shadow-2xl overflow-y-auto max-h-[90vh] animate-in zoom-in duration-300">
               <h2 className="text-2xl font-black text-purple-dark mb-8 uppercase tracking-tight">
                {editingKidId ? 'Editar Cadastro' : 'Novo Cadastro Geral'}
               </h2>
               <form onSubmit={handleSave} className="space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-gray-400 px-1">Nome</label>
                      <input required placeholder="Ex: Lucas" value={form.nome} onChange={e => setForm({...form, nome: e.target.value})} className="w-full bg-gray-light p-4 rounded-xl font-bold text-sm border-2 border-transparent focus:border-purple-main outline-none" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-gray-400 px-1">Sobrenome</label>
                      <input required placeholder="Ex: Silva" value={form.sobrenome} onChange={e => setForm({...form, sobrenome: e.target.value})} className="w-full bg-gray-light p-4 rounded-xl font-bold text-sm border-2 border-transparent focus:border-purple-main outline-none" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-gray-400 px-1">Nascimento</label>
                      <input required type="date" value={form.dataNascimento} onChange={e => setForm({...form, dataNascimento: e.target.value})} className="w-full bg-gray-light p-4 rounded-xl font-bold text-sm border-2 border-transparent focus:border-purple-main outline-none" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-gray-400 px-1">Responsável</label>
                      <input required placeholder="Nome do Pai/Mãe" value={form.responsavelNome} onChange={e => setForm({...form, responsavelNome: e.target.value})} className="w-full bg-gray-light p-4 rounded-xl font-bold text-sm border-2 border-transparent focus:border-purple-main outline-none" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-gray-400 px-1">WhatsApp</label>
                    <input required placeholder="(67) 99999-9999" value={form.whatsapp} onChange={e => setForm({...form, whatsapp: formatPhone(e.target.value)})} className="w-full bg-gray-light p-4 rounded-xl font-bold text-sm border-2 border-transparent focus:border-purple-main outline-none" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-gray-400 px-1">Observações Médicas</label>
                    <textarea rows={2} placeholder="Alergias, restrições..." value={form.observacoes} onChange={e => setForm({...form, observacoes: e.target.value})} className="w-full bg-gray-light p-4 rounded-xl font-bold text-sm resize-none border-2 border-transparent focus:border-purple-main outline-none" />
                  </div>
                  <div className="grid grid-cols-2 gap-6 pt-4">
                    <button type="button" onClick={closeModal} className="bg-gray-100 text-gray-500 font-black py-5 rounded-2xl text-xs uppercase tracking-widest hover:bg-gray-200 transition-colors">CANCELAR</button>
                    <button type="submit" className="bg-purple-main text-white font-black py-5 rounded-2xl shadow-xl text-xs uppercase tracking-widest hover:bg-purple-dark transition-colors">
                      {editingKidId ? 'ATUALIZAR' : 'SALVAR CADASTRO'}
                    </button>
                  </div>
               </form>
            </div>
         </div>
       )}

       {/* Modal de Confirmação de Exclusão */}
       {deletingKidId && (
         <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-red-900/80 backdrop-blur-md">
            <div className="bg-white w-full max-w-sm rounded-[2.5rem] p-10 shadow-2xl text-center animate-in zoom-in duration-300 border-t-8 border-red-500">
                <div className="bg-red-100 text-red-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 text-2xl">
                    {ICONS.Trash}
                </div>
                <h2 className="text-2xl font-black text-purple-dark mb-3 uppercase">Excluir Cadastro?</h2>
                <p className="text-gray-text font-bold mb-10 text-sm">Esta ação é irreversível. A criança não poderá mais realizar check-ins até um novo cadastro.</p>
                <div className="flex flex-col gap-3">
                    <button 
                        onClick={handleDelete}
                        className="w-full bg-red-500 text-white font-black py-5 rounded-2xl shadow-xl shadow-red-500/20 text-xs uppercase tracking-widest hover:bg-red-600 transition-colors"
                    >
                        SIM, EXCLUIR AGORA
                    </button>
                    <button 
                        onClick={() => setDeletingKidId(null)}
                        className="w-full bg-gray-100 text-gray-500 font-black py-4 rounded-2xl text-xs uppercase tracking-widest hover:bg-gray-200 transition-colors"
                    >
                        CANCELAR
                    </button>
                </div>
            </div>
         </div>
       )}
    </div>
  );
};

export default CriancasLista;
