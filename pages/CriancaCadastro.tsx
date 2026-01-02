
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ICONS } from '../constants';
import { storageService } from '../services/storageService';
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

const CriancaCadastro: React.FC = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [form, setForm] = useState({
    nome: '', sobrenome: '', dataNascimento: '', responsavelNome: '', whatsapp: '', observacoes: ''
  });

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formattedValue = formatPhone(e.target.value);
    setForm({ ...form, whatsapp: formattedValue });
  };

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
        <div className="bg-white w-full max-w-md rounded-[2.5rem] p-10 shadow-2xl text-center animate-in zoom-in duration-500">
          <div className="bg-green-100 text-green-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 text-2xl">
            {ICONS.CheckCircle}
          </div>
          <h2 className="text-2xl font-black text-purple-dark mb-3 uppercase">Sucesso!</h2>
          <p className="text-gray-text font-bold mb-8 text-sm">Agora você já pode realizar o Pré-Check-in.</p>
          <button 
            onClick={() => navigate('/pais')}
            className="w-full bg-purple-main text-white font-black py-4 rounded-2xl shadow-xl text-xs uppercase"
          >
            VOLTAR AO INÍCIO
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-light p-4 flex flex-col items-center">
      <div className="w-full max-w-2xl">
        <button 
          onClick={() => navigate('/pais')}
          className="mb-6 mt-2 flex items-center gap-2 text-purple-main font-black uppercase text-[10px] tracking-widest"
        >
          {ICONS.ArrowLeft} Voltar
        </button>

        <div className="bg-white rounded-[2.5rem] p-7 md:p-10 shadow-2xl border-b-6 border-yellow-main">
          <h1 className="text-2xl font-black text-purple-dark mb-1 uppercase tracking-tight">Cadastro</h1>
          <p className="text-gray-text font-bold mb-8 text-xs uppercase opacity-60">Primeiro acesso do seu filho.</p>

          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5 px-1">Nome</label>
                <input required type="text" value={form.nome} onChange={e => setForm({...form, nome: e.target.value})} className="w-full bg-gray-light p-3.5 rounded-xl font-bold border-2 border-transparent focus:border-purple-main outline-none text-sm" placeholder="Ex: Lucas" />
              </div>
              <div>
                <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5 px-1">Sobrenome</label>
                <input required type="text" value={form.sobrenome} onChange={e => setForm({...form, sobrenome: e.target.value})} className="w-full bg-gray-light p-3.5 rounded-xl font-bold border-2 border-transparent focus:border-purple-main outline-none text-sm" placeholder="Ex: Silva" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5 px-1">Nascimento</label>
                <input required type="date" value={form.dataNascimento} onChange={e => setForm({...form, dataNascimento: e.target.value})} className="w-full bg-gray-light p-3.5 rounded-xl font-bold border-2 border-transparent focus:border-purple-main outline-none text-sm appearance-none" style={{ minWidth: '100%' }} />
              </div>
              <div>
                <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5 px-1">Responsável</label>
                <input required type="text" value={form.responsavelNome} onChange={e => setForm({...form, responsavelNome: e.target.value})} className="w-full bg-gray-light p-3.5 rounded-xl font-bold border-2 border-transparent focus:border-purple-main outline-none text-sm" placeholder="Nome do Pai/Mãe" />
              </div>
            </div>

            <div>
              <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5 px-1">WhatsApp</label>
              <input required type="tel" value={form.whatsapp} onChange={handlePhoneChange} className="w-full bg-gray-light p-3.5 rounded-xl font-bold border-2 border-transparent focus:border-purple-main outline-none text-sm" placeholder="(67) 99999-9999" />
            </div>

            <div>
              <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5 px-1">Obs. Médicas</label>
              <textarea rows={2} value={form.observacoes} onChange={e => setForm({...form, observacoes: e.target.value})} className="w-full bg-gray-light p-3.5 rounded-xl font-bold border-2 border-transparent focus:border-purple-main outline-none resize-none text-sm" placeholder="Alergias ou restrições..." />
            </div>

            <button 
              type="submit" 
              disabled={isSubmitting}
              className="w-full bg-purple-main text-white font-black py-5 rounded-2xl shadow-xl hover:bg-purple-dark transition-all disabled:opacity-50 text-xs uppercase tracking-widest"
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
