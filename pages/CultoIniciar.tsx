
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CULTO_TYPES, ICONS } from '../constants';
import { storageService } from '../services/storageService';
import { CultoType } from '../types';

const CultoIniciar: React.FC = () => {
  const navigate = useNavigate();
  const [tipo, setTipo] = useState<CultoType>('Santa Ceia');
  const [tipoManual, setTipoManual] = useState('');
  const [responsaveis, setResponsaveis] = useState('');
  const [data, setData] = useState(new Date().toISOString().split('T')[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const active = await storageService.getActiveCulto();
    if (active) {
      alert('Já existe um culto ativo. Encerre-o antes de iniciar outro.');
      setIsSubmitting(false);
      return;
    }

    const newCulto = {
      tipo,
      tipoManual: tipo === 'Outros' ? tipoManual : undefined,
      data,
      horaInicio: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      responsaveis,
      status: 'ativo' as const
    };

    try {
      const docRef = await storageService.addCulto(newCulto);
      navigate(`/cultos/ativo/${docRef.id}`);
    } catch (error) {
      alert('Erro ao iniciar culto. Tente novamente.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto animate-in zoom-in-95 duration-500">
      <button 
        onClick={() => navigate(-1)}
        className="mb-10 flex items-center gap-2 text-purple-main font-black uppercase tracking-widest text-xs hover:gap-3 transition-all"
      >
        {ICONS.ArrowLeft} Voltar
      </button>

      <div className="bg-white rounded-[3rem] shadow-2xl overflow-hidden border-b-[12px] border-yellow-main">
        <div className="bg-purple-main p-10 md:p-14 text-white">
          <h1 className="text-4xl font-black mb-4 tracking-tighter uppercase text-white">Iniciar Novo Culto</h1>
          <p className="text-white/70 font-medium text-lg">Defina os detalhes da sessão de hoje para abrir o check-in.</p>
        </div>

        <form onSubmit={handleSubmit} className="p-10 md:p-14 space-y-10">
          <section>
            <label className="block text-xs font-black text-gray-text uppercase tracking-widest mb-6">Tipo de Celebração</label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {CULTO_TYPES.map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTipo(t as CultoType)}
                  className={`p-5 rounded-3xl border-2 font-black transition-all text-sm uppercase tracking-wide ${
                    tipo === t 
                      ? 'bg-purple-main border-purple-main text-white shadow-xl scale-105' 
                      : 'bg-white border-gray-100 text-gray-500 hover:border-purple-main/20'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </section>

          {tipo === 'Outros' && (
            <div className="animate-in fade-in slide-in-from-top-4 duration-300">
              <label className="block text-xs font-black text-gray-text uppercase tracking-widest mb-3">Qual o nome deste culto?</label>
              <input
                type="text"
                required
                value={tipoManual}
                onChange={(e) => setTipoManual(e.target.value)}
                className="w-full bg-gray-light border-2 border-transparent focus:border-purple-main outline-none p-6 rounded-[1.5rem] font-bold text-lg"
                placeholder="Ex: Congresso Kids Regional"
              />
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <label className="block text-xs font-black text-gray-text uppercase tracking-widest mb-3">Data do Evento</label>
              <input
                type="date"
                required
                value={data}
                onChange={(e) => setData(e.target.value)}
                className="w-full bg-gray-light border-2 border-transparent focus:border-purple-main outline-none p-6 rounded-[1.5rem] font-bold text-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-black text-gray-text uppercase tracking-widest mb-3">Hora de Início (Auto)</label>
              <div className="w-full bg-gray-100 p-6 rounded-[1.5rem] font-black text-lg text-gray-400 flex items-center gap-3">
                {ICONS.Clock} {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-black text-gray-text uppercase tracking-widest mb-3">Equipe Responsável</label>
            <textarea
              required
              rows={3}
              value={responsaveis}
              onChange={(e) => setResponsaveis(e.target.value)}
              className="w-full bg-gray-light border-2 border-transparent focus:border-purple-main outline-none p-6 rounded-[1.5rem] font-bold text-lg resize-none"
              placeholder="Ex: Tio João, Tia Maria, Voluntária Sarah..."
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-yellow-main hover:bg-yellow-secondary text-purple-dark font-black py-8 rounded-[2rem] shadow-2xl transition-all transform hover:-translate-y-1 active:scale-95 text-xl tracking-tight uppercase disabled:opacity-50"
          >
            {isSubmitting ? 'INICIANDO...' : 'ABRIR CHECK-IN AGORA'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CultoIniciar;
