
import { createClient } from '@supabase/supabase-js';
import { supabaseConfig } from './supabaseConfig';
import { Crianca, Culto, CheckIn, PreCheckIn, NotificacaoAtiva } from '../types';

// Sanitize configuration to prevent common "Failed to fetch" issues
const sanitizeUrl = (url: string) => (url || "").trim().replace(/\/$/, "");
const sanitizeKey = (key: string) => (key || "").trim();

const SUPABASE_URL = sanitizeUrl(supabaseConfig.url);
const SUPABASE_KEY = sanitizeKey(supabaseConfig.anonKey);
const PROJECT_SCHEMA = supabaseConfig.schema || "public";

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
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
  let errorMessage = "Erro desconhecido";
  
  if (error instanceof Error) {
    errorMessage = error.message;
  } else if (typeof error === 'string') {
    errorMessage = error;
  } else if (error && typeof error === 'object') {
    errorMessage = (error as any).message || JSON.stringify(error);
  }

  // Specific check for fetch failures
  if (errorMessage.includes("Failed to fetch") || errorMessage.includes("fetch")) {
    console.error(`❌ Erro de Conexão em ${context}: Não foi possível alcançar o servidor Supabase em ${SUPABASE_URL}. Verifique sua internet ou se o projeto está ativo.`);
  } else if (errorMessage.includes("schema cache") || errorMessage.includes("not found")) {
    console.warn(`⚠️ [SCHEMA ${PROJECT_SCHEMA}] Tabela ou Schema '${context}' não encontrada. Verifique se o schema '${PROJECT_SCHEMA}' está exposto nas configurações de API do Supabase.`);
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
      return {
        id: data[0].id, nome: data[0].nome, sobrenome: data[0].sobrenome, dataNascimento: data[0].data_nascimento,
        responsavelNome: data[0].responsavel_nome, whatsapp: data[0].whatsapp, observacoes: data[0].observacoes, createdAt: data[0].created_at
      } as Crianca;
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
        id: data.id, tipo: data.id, tipoManual: data.tipo_manual, data: data.data,
        horaInicio: data.hora_inicio, horaFim: data.hora_fim, responsaveis: data.responsaveis, status: data.status
      } as Culto;
    } catch (e) { handleError(e, 'getActiveCulto'); return null; }
  },

  subscribeToActiveCulto: (callback: (culto: Culto | null) => void) => {
    storageService.getActiveCulto().then(callback).catch(() => callback(null));
    const channel = supabase.channel('active_culto_changes')
      .on('postgres_changes', { event: '*', schema: PROJECT_SCHEMA, table: TABLES.CULTOS }, () => {
        storageService.getActiveCulto().then(callback).catch(() => callback(null));
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
    storageService.getCheckins(idCulto).then(callback).catch(() => callback([]));
    const channel = supabase.channel(`checkins_${idCulto}`)
      .on('postgres_changes', { event: '*', schema: PROJECT_SCHEMA, table: TABLES.CHECKINS, filter: `id_culto=eq.${idCulto}` }, () => {
        storageService.getCheckins(idCulto).then(callback).catch(() => callback([]));
      }).subscribe();
    return () => { supabase.removeChannel(channel); };
  },

  addCheckin: async (c: Omit<CheckIn, 'id'>) => {
    try {
      // Re-validação rigorosa e atômica no banco antes de inserir
      const { data: existing, error: checkError } = await supabase.from(TABLES.CHECKINS)
        .select('id')
        .eq('id_crianca', c.idCrianca)
        .eq('id_culto', c.idCulto)
        .eq('status', 'presente')
        .maybeSingle();

      if (checkError) throw checkError;
      if (existing) {
        throw new Error("ALREADY_PRESENT");
      }

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
      // Fixed: The property in CheckIn interface is 'quemRetirou', not 'quem_retirou'
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
    storageService.getPreCheckins().then(callback).catch(() => callback([]));
    const channel = supabase.channel('pre_checkins_changes')
      .on('postgres_changes', { event: '*', schema: PROJECT_SCHEMA, table: TABLES.PRECHECKINS }, () => {
        storageService.getPreCheckins().then(callback).catch(() => callback([]));
      }).subscribe();
    return () => { supabase.removeChannel(channel); };
  },

  addPreCheckin: async (p: Omit<PreCheckIn, 'id'>) => {
    try {
      const { data: existing } = await supabase.from(TABLES.PRECHECKINS)
        .select('id')
        .eq('id_crianca', p.idCrianca)
        .eq('id_culto', p.idCulto)
        .eq('status', 'pendente')
        .maybeSingle();
      
      if (existing) return;

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

  clearPreCheckins: async (idCulto: string) => {
    try {
      const { error } = await supabase.from(TABLES.PRECHECKINS).delete().eq('id_culto', idCulto);
      if (error) throw error;
    } catch (e) {
      handleError(e, 'clearPreCheckins');
    }
  },

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
      console.warn("Aviso: Falha ao limpar notificações.");
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
