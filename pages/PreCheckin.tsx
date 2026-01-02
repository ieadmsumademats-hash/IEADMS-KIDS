
import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { ICONS } from '../constants';
import { storageService } from '../services/storageService';
import { PreCheckIn } from '../types';

const PreCheckin: React.FC = () => {
  const navigate = useNavigate();
  const activeCulto = storageService.getActiveCulto();
  const [search, setSearch] = useState('');
  const [step, setStep] = useState(1);
  const [generated, setGenerated] = useState<string | null>(null);

  const kids = storageService.getCriancas();
  const filtered = search.length > 1 
    ? kids.filter(k => (k.nome + ' ' + k.sobrenome).toLowerCase().includes(search.toLowerCase()))
    : [];

  const handleSelect = (kidId: string) => {
    if (!activeCulto) return;

    // Verificar se já existe precheckin pendente
    const existing = storageService.getPreCheckins().find(p => p.idCrianca === kidId && p.idCulto === activeCulto.id && p.status === 'pendente');
    
    if (existing) {
      setGenerated(existing.codigo);
      setStep(2);
      return;
    }

    const code = `KIDS-${Math.floor(1000 + Math.random() * 8999)}`;
    const newPre: PreCheckIn = {
      id: Date.now().toString(),
      idCrianca: kidId,
      idCulto: activeCulto.id,
      codigo: code,
      status: 'pendente',
      dataHoraPreCheckin: new Date().toISOString()
    };

    storageService.addPreCheckin(newPre);
    setGenerated(code);
    setStep(2);
  };

  // Fixed: Imported Navigate from react-router-dom to fix 'Cannot find name Navigate' error
  if (!activeCulto) return <Navigate to="/pais" />;

  return (
    <div className="min-h-screen bg-gray-light p-6 flex flex-col items-center">
      <div className="w-full max-w-lg">
        <button 
          onClick={() => step === 1 ? navigate('/pais') : setStep(1)}
          className="mb-8 flex items-center gap-2 text-purple-main font-black uppercase text-xs"
        >
          {ICONS.ArrowLeft} Voltar
        </button>

        {step === 1 ? (
          <div className="bg-white rounded-[3rem] p-10 shadow-2xl border-b-8 border-purple-main animate-in slide-in-from-right duration-500">
             <h2 className="text-3xl font-black text-purple-dark mb-2 uppercase tracking-tight">Identifique seu Filho</h2>
             <p className="text-gray-text font-medium mb-10">Busque pelo nome cadastrado para gerar o código de acesso.</p>
             
             <div className="relative mb-8">
                <span className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400">{ICONS.Search}</span>
                <input 
                  type="text"
                  placeholder="Nome da criança..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-16 pr-6 py-6 rounded-3xl bg-gray-light border-2 border-transparent focus:border-purple-main outline-none font-bold text-xl"
                />
             </div>

             <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {filtered.map(k => (
                  <button 
                    key={k.id}
                    onClick={() => handleSelect(k.id)}
                    className="w-full flex items-center justify-between p-6 bg-purple-main/5 hover:bg-purple-main hover:text-white rounded-3xl border-2 border-transparent transition-all group"
                  >
                    <div className="text-left">
                       <p className="font-black text-lg group-hover:text-white text-purple-dark">{k.nome} {k.sobrenome}</p>
                       <p className="text-[10px] font-black uppercase opacity-60 tracking-widest">{k.responsavelNome}</p>
                    </div>
                    <div className="bg-white p-3 rounded-2xl text-purple-main shadow-md">{ICONS.ChevronRight}</div>
                  </button>
                ))}
                {search.length > 1 && filtered.length === 0 && (
                   <div className="text-center py-10 bg-gray-50 rounded-[2rem] border-2 border-dashed border-gray-200">
                      <p className="text-gray-text font-bold mb-4 italic">Nenhum cadastro encontrado.</p>
                      <button 
                        onClick={() => navigate('/pais/cadastro')}
                        className="bg-yellow-main text-purple-dark px-6 py-3 rounded-2xl font-black text-sm shadow-md"
                      >
                         CADASTRAR MEU FILHO
                      </button>
                   </div>
                )}
             </div>
          </div>
        ) : (
          <div className="bg-white rounded-[3rem] p-10 md:p-14 shadow-2xl text-center animate-in zoom-in duration-500 relative overflow-hidden">
             <div className="absolute top-0 left-0 w-full h-4 bg-green-500" />
             
             <div className="bg-green-100 text-green-600 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-8 text-4xl shadow-inner">
                {ICONS.CheckCircle}
             </div>

             <h2 className="text-3xl font-black text-purple-dark mb-4 uppercase">PRONTO!</h2>
             <p className="text-gray-text font-bold mb-10 text-lg leading-tight px-4">
                Apresente este código na recepção do Kids para confirmar a entrada:
             </p>

             <div className="bg-purple-dark text-yellow-main p-10 rounded-[2.5rem] shadow-2xl mb-12 transform hover:scale-105 transition-transform cursor-pointer active:scale-95 select-none group">
                <span className="text-[10px] font-black uppercase tracking-[0.3em] opacity-50 block mb-4">Código Kids de Hoje</span>
                <span className="text-6xl md:text-7xl font-black tracking-widest block font-mono">{generated}</span>
             </div>

             <button 
              onClick={() => navigate('/pais')}
              className="w-full bg-gray-light text-purple-dark font-black py-6 rounded-3xl hover:bg-gray-200 transition-colors shadow-md"
             >
                VOLTAR AO INÍCIO
             </button>
             
             <p className="mt-8 text-[10px] font-black text-gray-400 uppercase tracking-widest leading-relaxed">
                Atenção: Este código expira<br/>automaticamente ao fim deste culto.
             </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PreCheckin;
