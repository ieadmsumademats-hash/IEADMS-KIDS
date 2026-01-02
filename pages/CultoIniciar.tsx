
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
    <div className="max-w-xl mx-auto animate-in zoom-in-95 duration-500">
      <button 
        onClick={() => navigate(-1)}
        className="mb-6 flex items-center gap-2 text-purple-main font-black uppercase tracking-widest text-[10px] hover:gap-3 transition-all"
      >
        {ICONS.ArrowLeft} Voltar
      </button>

      <div className="bg-white rounded-[2rem] shadow-xl overflow-hidden border-b-8 border-yellow-main">
        <div className="bg-purple-main p-6 md:p-8 text-white">
          <h1 className="text-xl md:text-2xl font-black mb-1 tracking-tight uppercase text-white">Iniciar Novo Culto</h1>
          <p className="text-white/70 font-medium text-xs">Defina os detalhes da sessão de hoje.</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6">
          <section>
            <label className="block text-[10px] font-black text-gray-text uppercase tracking-widest mb-3 px-1">Tipo de Celebração</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {CULTO_TYPES.map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTipo(t as CultoType)}
                  className={`p-2.5 rounded-xl border-2 font-black transition-all text-[11px] uppercase tracking-wide ${
                    tipo === t 
                      ? 'bg-purple-main border-purple-main text-white shadow-md' 
                      : 'bg-white border-gray-100 text-gray-500 hover:border-purple-main/20'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </section>

          {tipo === 'Outros' && (
            <div className="animate-in fade-in slide-in-from-top-2 duration-300">
              <label className="block text-[10px] font-black text-gray-text uppercase tracking-widest mb-2 px-1">Nome do culto</label>
              <input
                type="text"
                required
                value={tipoManual}
                onChange={(e) => setTipoManual(e.target.value)}
                className="w-full bg-gray-light border-2 border-transparent focus:border-purple-main outline-none p-3 rounded-xl font-bold text-sm"
                placeholder="Ex: Congresso Kids"
              />
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black text-gray-text uppercase tracking-widest mb-2 px-1">Data</label>
              <input
                type="date"
                required
                value={data}
                onChange={(e) => setData(e.target.value)}
                className="w-full bg-gray-light border-2 border-transparent focus:border-purple-main outline-none p-3 rounded-xl font-bold text-sm"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-gray-text uppercase tracking-widest mb-2 px-1">Início</label>
              <div className="w-full bg-gray-100 p-3 rounded-xl font-black text-sm text-gray-400 flex items-center gap-2">
                {ICONS.Clock} {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-black text-gray-text uppercase tracking-widest mb-2 px-1">Responsáveis</label>
            <textarea
              required
              rows={2}
              value={responsaveis}
              onChange={(e) => setResponsaveis(e.target.value)}
              className="w-full bg-gray-light border-2 border-transparent focus:border-purple-main outline-none p-3 rounded-xl font-bold text-sm resize-none"
              placeholder="Tios e voluntários de hoje..."
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-yellow-main hover:bg-yellow-secondary text-purple-dark font-black py-4 rounded-2xl shadow-lg transition-all transform active:scale-95 text-xs tracking-widest uppercase disabled:opacity-50"
          >
            {isSubmitting ? 'INICIANDO...' : 'ABRIR CHECK-IN AGORA'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CultoIniciar;
