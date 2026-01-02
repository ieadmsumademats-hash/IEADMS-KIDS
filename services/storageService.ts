
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { supabaseConfig } from './supabaseConfig';
import { Crianca, Culto, CheckIn, PreCheckIn } from '../types';

const isValidUrl = (url: string) => {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
};

const PROJECT_SCHEMA = "kids_ieadms";

let supabase: any;

if (isValidUrl(supabaseConfig.url)) {
  supabase = createClient(supabaseConfig.url, supabaseConfig.anonKey, {
    db: { 
      schema: PROJECT_SCHEMA 
    }
  });
} else {
  supabase = new Proxy({} as any, {
    get: () => () => Promise.resolve({ data: null, error: new Error("URL do Supabase inválida.") })
  });
}

const TABLES = {
  CRIANCAS: 'criancas',
  CULTOS: 'cultos',
  CHECKINS: 'checkins',
  PRECHECKINS: 'pre_checkins'
};

// Função auxiliar para tratar erros de Schema não exposto (406)
const handleError = (error: any, context: string) => {
  if (error?.message?.includes('406') || error?.code === '406' || error?.status === 406) {
    console.error(`🚨 ERRO DE CONFIGURAÇÃO (406) em ${context}: O schema '${PROJECT_SCHEMA}' não está exposto no Dashboard do Supabase. Vá em Settings > API > Exposed Schemas e adicione '${PROJECT_SCHEMA}'.`);
  } else {
    console.error(`❌ Erro em ${context}:`, error);
  }
  throw error;
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
    } catch (e) { return handleError(e, 'getCriancas'); }
  },

  addCrianca: async (c: Omit<Crianca, 'id'>) => {
    try {
      const { data, error } = await supabase.from(TABLES.CRIANCAS).insert([{
        nome: c.nome, sobrenome: c.sobrenome, data_nascimento: c.dataNascimento,
        responsavel_nome: c.responsavelNome, whatsapp: c.whatsapp, observacoes: c.observacoes
      }]).select();
      if (error) throw error;
      return data[0];
    } catch (e) { return handleError(e, 'addCrianca'); }
  },

  getCultos: async () => {
    try {
      const { data, error } = await supabase.from(TABLES.CULTOS).select('*').order('data', { ascending: false });
      if (error) throw error;
      return (data || []).map((d: any) => ({
        id: d.id, tipo: d.tipo, tipoManual: d.tipo_manual, data: d.data,
        horaInicio: d.hora_inicio, horaFim: d.hora_fim, responsaveis: d.responsaveis, status: d.status
      } as Culto));
    } catch (e) { return handleError(e, 'getCultos'); }
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
    } catch (e) { return handleError(e, 'getActiveCulto'); }
  },

  subscribeToActiveCulto: (callback: (culto: Culto | null) => void) => {
    storageService.getActiveCulto().then(callback).catch(e => {
      handleError(e, 'subscribeToActiveCulto initial fetch');
      callback(null);
    });

    const channel = supabase.channel(`${PROJECT_SCHEMA}:active_culto`)
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
    } catch (e) { return handleError(e, 'addCulto'); }
  },

  updateCulto: async (id: string, updated: Partial<Culto>) => {
    try {
      const payload: any = {};
      if (updated.status) payload.status = updated.status;
      if (updated.horaFim) payload.hora_fiem = updated.horaFim;
      const { error } = await supabase.from(TABLES.CULTOS).update(payload).eq('id', id);
      if (error) throw error;
    } catch (e) { return handleError(e, 'updateCulto'); }
  },

  getCheckins: async (idCulto: string) => {
    try {
      const { data, error } = await supabase.from(TABLES.CHECKINS).select('*').eq('id_culto', idCulto);
      if (error) throw error;
      return (data || []).map((d: any) => ({
        id: d.id, idCrianca: d.id_crianca, idCulto: d.id_culto, horaEntrada: d.hora_entrada,
        horaSaida: d.hora_saida, quemRetirou: d.quem_retirou, status: d.status
      } as CheckIn));
    } catch (e) { return handleError(e, 'getCheckins'); }
  },

  getAllCheckins: async () => {
    try {
      const { data, error } = await supabase.from(TABLES.CHECKINS).select('*');
      if (error) throw error;
      return (data || []).map((d: any) => ({
        id: d.id, idCrianca: d.id_crianca, idCulto: d.id_culto, horaEntrada: d.hora_entrada,
        horaSaida: d.hora_saida, quemRetirou: d.quem_retirou, status: d.status
      } as CheckIn));
    } catch (e) { return handleError(e, 'getAllCheckins'); }
  },

  subscribeToCheckins: (idCulto: string, callback: (checkins: CheckIn[]) => void) => {
    storageService.getCheckins(idCulto).then(callback).catch(e => {
      handleError(e, 'subscribeToCheckins initial fetch');
      callback([]);
    });

    const channel = supabase.channel(`${PROJECT_SCHEMA}:checkins:${idCulto}`)
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
    } catch (e) { return handleError(e, 'addCheckin'); }
  },

  updateCheckin: async (id: string, updated: Partial<CheckIn>) => {
    try {
      const payload: any = {};
      if (updated.status) payload.status = updated.status;
      if (updated.horaSaida) payload.hora_saida = updated.horaSaida;
      if (updated.quemRetirou) payload.quem_retirou = updated.quemRetirou;
      const { error } = await supabase.from(TABLES.CHECKINS).update(payload).eq('id', id);
      if (error) throw error;
    } catch (e) { return handleError(e, 'updateCheckin'); }
  },

  getPreCheckins: async () => {
    try {
      const { data, error } = await supabase.from(TABLES.PRECHECKINS).select('*');
      if (error) throw error;
      return (data || []).map((d: any) => ({
        id: d.id, idCrianca: d.id_crianca, idCulto: d.id_culto, codigo: d.codigo,
        status: d.status, dataHoraPreCheckin: d.data_hora_pre_checkin, dataHoraCheckin: d.data_hora_checkin
      } as PreCheckIn));
    } catch (e) { return handleError(e, 'getPreCheckins'); }
  },

  subscribeToPreCheckins: (callback: (pre: PreCheckIn[]) => void) => {
    storageService.getPreCheckins().then(callback).catch(e => {
      handleError(e, 'subscribeToPreCheckins initial fetch');
      callback([]);
    });

    const channel = supabase.channel(`${PROJECT_SCHEMA}:pre_checkins`)
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
    } catch (e) { return handleError(e, 'addPreCheckin'); }
  },

  updatePreCheckin: async (id: string, updated: Partial<PreCheckIn>) => {
    try {
      const payload: any = {};
      if (updated.status) payload.status = updated.status;
      if (updated.dataHoraCheckin) payload.data_hora_checkin = updated.dataHoraCheckin;
      const { error } = await supabase.from(TABLES.PRECHECKINS).update(payload).eq('id', id);
      if (error) throw error;
    } catch (e) { return handleError(e, 'updatePreCheckin'); }
  }
};
