
import { createClient } from '@supabase/supabase-js';
import { supabaseConfig } from './supabaseConfig';
import { Crianca, Culto, CheckIn, PreCheckIn, NotificacaoAtiva } from '../types';

// O schema deve ser EXATAMENTE o mesmo criado no banco de dados
const PROJECT_SCHEMA = "kids_ieadms";

export const supabase = createClient(supabaseConfig.url, supabaseConfig.anonKey, {
  db: { 
    schema: PROJECT_SCHEMA 
  }
});

const TABLES = {
  CRIANCAS: 'criancas',
  CULTOS: 'cultos',
  CHECKINS: 'checkins',
  PRECHECKINS: 'pre_checkins',
  NOTIFICACOES: 'notificacoes_ativas'
};

const handleError = (error: any, context: string) => {
  const errorMessage = error?.message || (typeof error === 'object' ? JSON.stringify(error) : String(error));
  
  // Se for erro de tabela inexistente, apenas avisa no console sem interromper o app
  if (errorMessage.includes("schema cache") || errorMessage.includes("not found")) {
    console.warn(`⚠️ [SCHEMA ${PROJECT_SCHEMA}] Tabela '${TABLES.NOTIFICACOES}' não encontrada. Notificações desabilitadas.`);
  } else {
    console.error(`❌ Erro em ${context}:`, errorMessage);
  }
  return null;
};

export const storageService = {
  getCriancas: async () => {
    try {
      const { data, error } = await supabase.from(TABLES.CRIANCAS).select('*').order('nome', { ascending: true });
      if (error) throw error;
      return (data || []).map((d: any) => ({
        id: d.id, nome: d.nome, sobrenome: d.sobrenome, dataNascimento: d.data_nascimento,
        responsavelNome: d.responsavel_nome, whatsapp: d.whatsapp, observacoes: d.observacoes, createdAt: d.created_at
      } as Crianca));
    } catch (e) { handleError(e, 'getCriancas'); return []; }
  },

  addCrianca: async (c: Omit<Crianca, 'id'>) => {
    try {
      const { data, error } = await supabase.from(TABLES.CRIANCAS).insert([{
        nome: c.nome, sobrenome: c.sobrenome, data_nascimento: c.dataNascimento,
        responsavel_nome: c.responsavelNome, whatsapp: c.whatsapp, observacoes: c.observacoes
      }]).select();
      if (error) throw error;
      return data[0];
    } catch (e) { handleError(e, 'addCrianca'); throw e; }
  },

  updateCrianca: async (id: string, c: Partial<Crianca>) => {
    try {
      const payload: any = {};
      if (c.nome) payload.nome = c.nome;
      if (c.sobrenome) payload.sobrenome = c.sobrenome;
      if (c.dataNascimento) payload.data_nascimento = c.dataNascimento;
      if (c.responsavelNome) payload.responsavel_nome = c.responsavelNome;
      if (c.whatsapp) payload.whatsapp = c.whatsapp;
      if (c.observacoes !== undefined) payload.observacoes = c.observacoes;
      
      const { error } = await supabase.from(TABLES.CRIANCAS).update(payload).eq('id', id);
      if (error) throw error;
    } catch (e) { handleError(e, 'updateCrianca'); throw e; }
  },

  deleteCrianca: async (id: string) => {
    try {
      const { error } = await supabase.from(TABLES.CRIANCAS).delete().eq('id', id);
      if (error) throw error;
    } catch (e) { handleError(e, 'deleteCrianca'); throw e; }
  },

  getCultos: async () => {
    try {
      const { data, error } = await supabase.from(TABLES.CULTOS).select('*').order('data', { ascending: false });
      if (error) throw error;
      return (data || []).map((d: any) => ({
        id: d.id, tipo: d.tipo, tipoManual: d.tipo_manual, data: d.data,
        horaInicio: d.hora_inicio, horaFim: d.hora_fim, responsaveis: d.responsaveis, status: d.status
      } as Culto));
    } catch (e) { handleError(e, 'getCultos'); return []; }
  },

  getActiveCulto: async () => {
    try {
      const { data, error } = await supabase.from(TABLES.CULTOS).select('*').eq('status', 'ativo').limit(1).maybeSingle();
      if (error) throw error;
      if (!data) return null;
      return {
        id: data.id, tipo: data.tipo, tipoManual: data.tipo_manual, data: data.data,
        horaInicio: data.hora_inicio, horaFim: data.hora_fim, responsaveis: data.responsaveis, status: data.status
      } as Culto;
    } catch (e) { handleError(e, 'getActiveCulto'); return null; }
  },

  subscribeToActiveCulto: (callback: (culto: Culto | null) => void) => {
    storageService.getActiveCulto().then(callback);
    const channel = supabase.channel('active_culto_changes')
      .on('postgres_changes', { event: '*', schema: PROJECT_SCHEMA, table: TABLES.CULTOS }, () => {
        storageService.getActiveCulto().then(callback);
      }).subscribe();
    return () => { supabase.removeChannel(channel); };
  },

  addCulto: async (c: Omit<Culto, 'id'>) => {
    try {
      const { data, error } = await supabase.from(TABLES.CULTOS).insert([{
        tipo: c.tipo, tipo_manual: c.tipoManual, data: c.data, hora_inicio: c.horaInicio,
        responsaveis: c.responsaveis, status: 'ativo'
      }]).select();
      if (error) throw error;
      return data[0];
    } catch (e) { handleError(e, 'addCulto'); throw e; }
  },

  updateCulto: async (id: string, updated: Partial<Culto>) => {
    try {
      const payload: any = {};
      if (updated.status) payload.status = updated.status;
      if (updated.horaFim) payload.hora_fim = updated.horaFim;
      const { error } = await supabase.from(TABLES.CULTOS).update(payload).eq('id', id);
      if (error) throw error;
    } catch (e) { handleError(e, 'updateCulto'); throw e; }
  },

  getCheckins: async (idCulto: string) => {
    try {
      const { data, error } = await supabase.from(TABLES.CHECKINS).select('*').eq('id_culto', idCulto);
      if (error) throw error;
      return (data || []).map((d: any) => ({
        id: d.id, idCrianca: d.id_crianca, idCulto: d.id_culto, horaEntrada: d.hora_entrada,
        horaSaida: d.hora_saida, quemRetirou: d.quem_retirou, status: d.status
      } as CheckIn));
    } catch (e) { handleError(e, 'getCheckins'); return []; }
  },

  getAllCheckins: async () => {
    try {
      const { data, error } = await supabase.from(TABLES.CHECKINS).select('*');
      if (error) throw error;
      return (data || []).map((d: any) => ({
        id: d.id, idCrianca: d.id_crianca, idCulto: d.id_culto, horaEntrada: d.hora_entrada,
        horaSaida: d.hora_saida, quemRetirou: d.quem_retirou, status: d.status
      } as CheckIn));
    } catch (e) { handleError(e, 'getAllCheckins'); return []; }
  },

  subscribeToCheckins: (idCulto: string, callback: (checkins: CheckIn[]) => void) => {
    storageService.getCheckins(idCulto).then(callback);
    const channel = supabase.channel(`checkins_${idCulto}`)
      .on('postgres_changes', { event: '*', schema: PROJECT_SCHEMA, table: TABLES.CHECKINS, filter: `id_culto=eq.${idCulto}` }, () => {
        storageService.getCheckins(idCulto).then(callback);
      }).subscribe();
    return () => { supabase.removeChannel(channel); };
  },

  addCheckin: async (c: Omit<CheckIn, 'id'>) => {
    try {
      const { error } = await supabase.from(TABLES.CHECKINS).insert([{
        id_crianca: c.idCrianca, id_culto: c.idCulto, hora_entrada: c.horaEntrada, status: 'presente'
      }]);
      if (error) throw error;
    } catch (e) { handleError(e, 'addCheckin'); throw e; }
  },

  updateCheckin: async (id: string, updated: Partial<CheckIn>) => {
    try {
      const payload: any = {};
      if (updated.status) payload.status = updated.status;
      if (updated.horaSaida) payload.hora_saida = updated.horaSaida;
      if (updated.quemRetirou) payload.quem_retirou = updated.quemRetirou;
      const { error } = await supabase.from(TABLES.CHECKINS).update(payload).eq('id', id);
      if (error) throw error;
    } catch (e) { handleError(e, 'updateCheckin'); throw e; }
  },

  getPreCheckins: async () => {
    try {
      const { data, error } = await supabase.from(TABLES.PRECHECKINS).select('*');
      if (error) throw error;
      return (data || []).map((d: any) => ({
        id: d.id, idCrianca: d.id_crianca, idCulto: d.id_culto, codigo: d.codigo,
        status: d.status, dataHoraPreCheckin: d.data_hora_pre_checkin, dataHoraCheckin: d.data_hora_checkin
      } as PreCheckIn));
    } catch (e) { handleError(e, 'getPreCheckins'); return []; }
  },

  subscribeToPreCheckins: (callback: (pre: PreCheckIn[]) => void) => {
    storageService.getPreCheckins().then(callback);
    const channel = supabase.channel('pre_checkins_changes')
      .on('postgres_changes', { event: '*', schema: PROJECT_SCHEMA, table: TABLES.PRECHECKINS }, () => {
        storageService.getPreCheckins().then(callback);
      }).subscribe();
    return () => { supabase.removeChannel(channel); };
  },

  addPreCheckin: async (p: Omit<PreCheckIn, 'id'>) => {
    try {
      const { error } = await supabase.from(TABLES.PRECHECKINS).insert([{
        id_crianca: p.idCrianca, id_culto: p.idCulto, codigo: p.codigo, status: 'pendente'
      }]);
      if (error) throw error;
    } catch (e) { handleError(e, 'addPreCheckin'); throw e; }
  },

  updatePreCheckin: async (id: string, updated: Partial<PreCheckIn>) => {
    try {
      const payload: any = {};
      if (updated.status) payload.status = updated.status;
      if (updated.dataHoraCheckin) payload.data_hora_checkin = updated.dataHoraCheckin;
      const { error } = await supabase.from(TABLES.PRECHECKINS).update(payload).eq('id', id);
      if (error) throw error;
    } catch (e) { handleError(e, 'updatePreCheckin'); throw e; }
  },

  // MÉTODOS DE NOTIFICAÇÃO TEMPORÁRIA
  sendNotificacao: async (idCrianca: string, idCulto: string): Promise<boolean> => {
    try {
      const { error } = await supabase.from(TABLES.NOTIFICACOES).insert([{
        id_crianca: idCrianca,
        id_culto: idCulto,
        mensagem: 'Papai/Mamãe sua criança está te aguardando para o Checkout'
      }]);
      if (error) throw error;
      return true;
    } catch (e) { 
      handleError(e, 'sendNotificacao'); 
      return false;
    }
  },

  clearNotificacoes: async (idCulto: string) => {
    try {
      const { error } = await supabase.from(TABLES.NOTIFICACOES).delete().eq('id_culto', idCulto);
      if (error) throw error;
    } catch (e) { 
      // Silencioso para não travar o encerramento do culto
      console.warn("Aviso: Falha ao limpar notificações (tabela pode não existir no schema).");
    }
  },

  subscribeToNotificacoes: (idCrianca: string, callback: (n: any) => void) => {
    const channel = supabase.channel(`notificacao_${idCrianca}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: PROJECT_SCHEMA, 
        table: TABLES.NOTIFICACOES,
        filter: `id_crianca=eq.${idCrianca}` 
      }, (payload) => {
        callback(payload.new);
      }).subscribe();
    return () => { supabase.removeChannel(channel); };
  }
};
