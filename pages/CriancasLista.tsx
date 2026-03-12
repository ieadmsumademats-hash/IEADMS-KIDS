
import React, { useState, useEffect } from 'react';
import { storageService } from '../services/storageService';
import { ICONS } from '../constants';
import { Crianca, Responsavel } from '../types';

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
  const [selectedKids, setSelectedKids] = useState<string[]>([]);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);

  const [form, setForm] = useState({
    nome: '', sobrenome: '', dataNascimento: '', observacoes: ''
  });
  const [responsaveis, setResponsaveis] = useState<Responsavel[]>([
    { nome: '', whatsapp: '', parentesco: 'Pai' }
  ]);

  useEffect(() => {
    loadKids();
  }, []);

  const loadKids = async () => {
    setLoading(true);
    const list = await storageService.getCriancas();
    setKids(list);
    setLoading(false);
  };

  const handleResponsavelChange = (index: number, field: keyof Responsavel, value: string) => {
    const newResponsaveis = [...responsaveis];
    if (field === 'whatsapp') {
      newResponsaveis[index][field] = formatPhone(value);
    } else {
      newResponsaveis[index][field] = value;
    }
    setResponsaveis(newResponsaveis);
  };

  const addResponsavel = () => {
    if (responsaveis.length < 3) {
      setResponsaveis([...responsaveis, { nome: '', whatsapp: '', parentesco: 'Mãe' }]);
    }
  };

  const removeResponsavel = (index: number) => {
    if (responsaveis.length > 1) {
      const newResponsaveis = [...responsaveis];
      newResponsaveis.splice(index, 1);
      setResponsaveis(newResponsaveis);
    }
  };

  const handleEdit = (kid: Crianca) => {
    setEditingKidId(kid.id);
    setForm({
      nome: kid.nome,
      sobrenome: kid.sobrenome,
      dataNascimento: kid.dataNascimento,
      observacoes: kid.observacoes || ''
    });
    setResponsaveis(kid.responsaveis && kid.responsaveis.length > 0 ? kid.responsaveis : [{ nome: kid.responsavelNome, whatsapp: kid.whatsapp, parentesco: 'Outro' }]);
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

  const toggleSelectKid = (id: string) => {
    setSelectedKids(prev => 
      prev.includes(id) ? prev.filter(k => k !== id) : [...prev, id]
    );
  };

  const handleBulkDelete = async () => {
    if (selectedKids.length === 0) return;
    try {
      for (const id of selectedKids) {
        await storageService.deleteCrianca(id);
      }
      await loadKids();
      setSelectedKids([]);
      setShowBulkDeleteConfirm(false);
    } catch (e) {
      alert("Erro ao excluir cadastros. Tente novamente.");
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingKidId) {
        await storageService.updateCrianca(editingKidId, { ...form, responsaveis });
      } else {
        const newKid: Omit<Crianca, 'id'> = {
          ...form,
          responsavelNome: '',
          whatsapp: '',
          responsaveis,
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
    setForm({ nome: '', sobrenome: '', dataNascimento: '', observacoes: '' });
    setResponsaveis([{ nome: '', whatsapp: '', parentesco: 'Pai' }]);
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

       <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 flex gap-4 items-center">
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
          <button 
            onClick={() => selectedKids.length > 0 && setShowBulkDeleteConfirm(true)}
            disabled={selectedKids.length === 0}
            className={`font-black px-6 py-4 rounded-2xl shadow-xl uppercase tracking-widest text-xs whitespace-nowrap flex items-center gap-2 transition-colors ${selectedKids.length > 0 ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
          >
            {ICONS.Trash} Excluir
          </button>
       </div>

       {loading ? (
         <div className="text-center py-20 text-purple-main font-bold">Carregando base de dados...</div>
       ) : (
         <div className="flex flex-col gap-3">
            {filtered.map(kid => (
              <div key={kid.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex items-center gap-4 hover:border-purple-main/30 hover:shadow-md transition-all">
                 <input 
                   type="checkbox" 
                   checked={selectedKids.includes(kid.id)} 
                   onChange={() => toggleSelectKid(kid.id)} 
                   className="w-5 h-5 accent-purple-main cursor-pointer" 
                 />
                 <span 
                   className="font-black text-purple-dark text-lg cursor-pointer hover:underline flex-1" 
                   onClick={() => handleEdit(kid)}
                 >
                   {kid.nome} {kid.sobrenome}
                 </span>
              </div>
            ))}
         </div>
       )}

       {/* Modal Adicionar / Editar */}
       {isAdding && (
         <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-purple-dark/70 backdrop-blur-md">
            <div className="bg-white w-full max-w-2xl rounded-[2.5rem] p-10 shadow-2xl overflow-y-auto max-h-[90vh] animate-in zoom-in duration-300">
               <button 
                 type="button" 
                 onClick={closeModal} 
                 className="flex items-center gap-2 text-gray-500 font-black text-xs uppercase tracking-widest hover:text-purple-main mb-6 transition-colors"
               >
                 {ICONS.ArrowLeft} VOLTAR
               </button>
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
                  </div>

                  <div className="mt-6 mb-4">
                    <h3 className="text-sm font-black text-purple-dark uppercase tracking-widest border-b-2 border-gray-100 pb-2 mb-4">Responsáveis</h3>
                    
                    {responsaveis.map((resp, index) => (
                      <div key={index} className="bg-gray-50 p-4 rounded-2xl mb-4 border border-gray-200 relative">
                        {index > 0 && (
                          <button 
                            type="button" 
                            onClick={() => removeResponsavel(index)}
                            className="absolute top-3 right-3 text-red-500 hover:text-red-700 p-1"
                          >
                            {ICONS.Trash}
                          </button>
                        )}
                        <h4 className="text-[10px] font-black text-purple-main uppercase tracking-widest mb-3">Responsável {index + 1} {index === 0 && '(Principal)'}</h4>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                          <div>
                            <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5 px-1">Nome</label>
                            <input required type="text" value={resp.nome} onChange={e => handleResponsavelChange(index, 'nome', e.target.value)} className="w-full bg-white p-3.5 rounded-xl font-bold border-2 border-transparent focus:border-purple-main outline-none text-sm shadow-sm" placeholder="Ex: João" />
                          </div>
                          <div>
                            <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5 px-1">Parentesco</label>
                            <select required value={resp.parentesco} onChange={e => handleResponsavelChange(index, 'parentesco', e.target.value)} className="w-full bg-white p-3.5 rounded-xl font-bold border-2 border-transparent focus:border-purple-main outline-none text-sm shadow-sm appearance-none">
                              <option value="Pai">Pai</option>
                              <option value="Mãe">Mãe</option>
                              <option value="Avô/Avó">Avô/Avó</option>
                              <option value="Tio/Tia">Tio/Tia</option>
                              <option value="Outro">Outro</option>
                            </select>
                          </div>
                        </div>
                        <div>
                          <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5 px-1">WhatsApp</label>
                          <input required type="tel" value={resp.whatsapp} onChange={e => handleResponsavelChange(index, 'whatsapp', e.target.value)} className="w-full bg-white p-3.5 rounded-xl font-bold border-2 border-transparent focus:border-purple-main outline-none text-sm shadow-sm" placeholder="(67) 99999-9999" />
                        </div>
                      </div>
                    ))}

                    {responsaveis.length < 3 && (
                      <button 
                        type="button" 
                        onClick={addResponsavel}
                        className="w-full border-2 border-dashed border-purple-main text-purple-main font-black py-3 rounded-2xl hover:bg-purple-50 transition-all text-xs uppercase tracking-widest flex items-center justify-center gap-2"
                      >
                        {ICONS.Plus} Adicionar outro responsável
                      </button>
                    )}
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

       {/* Modal de Confirmação de Exclusão em Massa */}
       {showBulkDeleteConfirm && (
         <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-red-900/80 backdrop-blur-md">
            <div className="bg-white w-full max-w-sm rounded-[2.5rem] p-10 shadow-2xl text-center animate-in zoom-in duration-300 border-t-8 border-red-500">
                <div className="bg-red-100 text-red-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 text-2xl">
                    {ICONS.Trash}
                </div>
                <h2 className="text-2xl font-black text-purple-dark mb-3 uppercase">Excluir {selectedKids.length} Cadastro{selectedKids.length > 1 ? 's' : ''}?</h2>
                <p className="text-gray-text font-bold mb-10 text-sm">Tem certeza que deseja excluir o(s) cadastro(s) selecionado(s)? Esta ação é irreversível.</p>
                <div className="flex flex-col gap-3">
                    <button 
                        onClick={handleBulkDelete}
                        className="w-full bg-red-500 text-white font-black py-5 rounded-2xl shadow-xl shadow-red-500/20 text-xs uppercase tracking-widest hover:bg-red-600 transition-colors"
                    >
                        SIM, EXCLUIR AGORA
                    </button>
                    <button 
                        onClick={() => setShowBulkDeleteConfirm(false)}
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
