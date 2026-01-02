
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ICONS } from '../constants';
import { storageService } from '../services/storageService';
import { Crianca } from '../types';

const CriancaCadastro: React.FC = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [form, setForm] = useState({
    nome: '', sobrenome: '', dataNascimento: '', responsavelNome: '', whatsapp: '', observacoes: ''
  });

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const newKid: Omit<Crianca, 'id'> = {
        ...form,
        createdAt: new Date().toISOString()
      };
      await storageService.addCrianca(newKid);
      setDone(true);
    } catch (error) {
      alert("Erro ao salvar cadastro. Verifique os dados.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="min-h-screen bg-gray-light flex items-center justify-center p-6">
        <div className="bg-white w-full max-w-md rounded-[3rem] p-10 shadow-2xl text-center animate-in zoom-in duration-500">
          <div className="bg-green-100 text-green-600 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl">
            {ICONS.CheckCircle}
          </div>
          <h2 className="text-3xl font-black text-purple-dark mb-4">CADASTRO REALIZADO!</h2>
          <p className="text-gray-text font-bold mb-8">Agora você já pode realizar o Pré-Check-in do seu filho.</p>
          <button 
            onClick={() => navigate('/pais')}
            className="w-full bg-purple-main text-white font-black py-5 rounded-3xl shadow-xl"
          >
            VOLTAR AO INÍCIO
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-light p-6 flex flex-col items-center">
      <div className="w-full max-w-2xl">
        <button 
          onClick={() => navigate('/pais')}
          className="mb-8 flex items-center gap-2 text-purple-main font-black uppercase text-xs"
        >
          {ICONS.ArrowLeft} Voltar
        </button>

        <div className="bg-white rounded-[3rem] p-8 md:p-12 shadow-2xl border-b-8 border-yellow-main">
          <h1 className="text-3xl font-black text-purple-dark mb-2 uppercase tracking-tight">Cadastro Kids</h1>
          <p className="text-gray-text font-medium mb-10 text-sm">Preencha os dados do seu filho para o primeiro acesso.</p>

          <form onSubmit={handleSave} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Nome</label>
                <input required type="text" value={form.nome} onChange={e => setForm({...form, nome: e.target.value})} className="w-full bg-gray-light p-4 rounded-2xl font-bold border-2 border-transparent focus:border-purple-main outline-none" placeholder="Ex: Lucas" />
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Sobrenome</label>
                <input required type="text" value={form.sobrenome} onChange={e => setForm({...form, sobrenome: e.target.value})} className="w-full bg-gray-light p-4 rounded-2xl font-bold border-2 border-transparent focus:border-purple-main outline-none" placeholder="Ex: Silva" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Data de Nascimento</label>
                <input required type="date" value={form.dataNascimento} onChange={e => setForm({...form, dataNascimento: e.target.value})} className="w-full bg-gray-light p-4 rounded-2xl font-bold border-2 border-transparent focus:border-purple-main outline-none" />
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Responsável</label>
                <input required type="text" value={form.responsavelNome} onChange={e => setForm({...form, responsavelNome: e.target.value})} className="w-full bg-gray-light p-4 rounded-2xl font-bold border-2 border-transparent focus:border-purple-main outline-none" placeholder="Nome do Pai/Mãe" />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">WhatsApp (DDD + Número)</label>
              <input required type="tel" value={form.whatsapp} onChange={e => setForm({...form, whatsapp: e.target.value})} className="w-full bg-gray-light p-4 rounded-2xl font-bold border-2 border-transparent focus:border-purple-main outline-none" placeholder="67999999999" />
            </div>

            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Observações Médicas</label>
              <textarea rows={2} value={form.observacoes} onChange={e => setForm({...form, observacoes: e.target.value})} className="w-full bg-gray-light p-4 rounded-2xl font-bold border-2 border-transparent focus:border-purple-main outline-none resize-none" placeholder="Alergias, restrições alimentares, etc..." />
            </div>

            <button 
              type="submit" 
              disabled={isSubmitting}
              className="w-full bg-purple-main text-white font-black py-6 rounded-[2rem] shadow-xl hover:bg-purple-dark transition-all disabled:opacity-50"
            >
              {isSubmitting ? 'SALVANDO...' : 'FINALIZAR CADASTRO'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CriancaCadastro;
