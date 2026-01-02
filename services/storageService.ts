
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { supabaseConfig } from './supabaseConfig';
import { Crianca, Culto, CheckIn, PreCheckIn } from '../types';

// Helper para validar se a string é uma URL válida
const isValidUrl = (url: string) => {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
};

let supabase: SupabaseClient;

// Inicializa o cliente Supabase apenas se a URL for minimamente válida
// Se for inválida, criamos um Proxy que lança erro apenas ao ser usado,
// evitando que o app quebre inteiramente no import inicial (White Screen of Death)
if (isValidUrl(supabaseConfig.url)) {
  supabase = createClient(supabaseConfig.url, supabaseConfig.anonKey, {
    db: { schema: supabaseConfig.schema }
  });
} else {
  console.warn("⚠️ Supabase: URL inválida ou não configurada em services/supabaseConfig.ts");
  supabase = new Proxy({} as SupabaseClient, {
    get: () => {
      return () => {
        console.error("❌ Erro: Tentativa de acessar o banco de dados sem configuração válida do Supabase.");
        return Promise.resolve({ data: null, error: new Error("Configuração pendente no arquivo supabaseConfig.ts") });
      };
    }
  });
}

const TABLES = {
  CRIANCAS: 'criancas',
  CULTOS: 'cultos',
  CHECKINS: 'checkins',
  PRECHECKINS: 'pre_checkins'
};

export const storageService = {
  // Criancas
  getCriancas: async () => {
    const { data, error } = await supabase
      .from(TABLES.CRIANCAS)
      .select('*')
      .order('nome', { ascending: true });
    
    if (error) throw error;
    return (data || []).map(d => ({
      id: d.id,
      nome: d.nome,
      sobrenome: d.sobrenome,
      dataNascimento: d.data_nascimento,
      responsavelNome: d.responsavel_nome,
      whatsapp: d.whatsapp,
      observacoes: d.observacoes,
      createdAt: d.created_at
    } as Crianca));
  },

  addCrianca: async (c: Omit<Crianca, 'id'>) => {
    const { data, error } = await supabase
      .from(TABLES.CRIANCAS)
      .insert([{
        nome: c.nome,
        sobrenome: c.sobrenome,
        data_nascimento: c.dataNascimento,
        responsavel_nome: c.responsavelNome,
        whatsapp: c.whatsapp,
        observacoes: c.observacoes
      }])
      .select();
    if (error) throw error;
    return data[0];
  },

  // Cultos
  getCultos: async () => {
    const { data, error } = await supabase
      .from(TABLES.CULTOS)
      .select('*')
      .order('data', { ascending: false });
    
    if (error) throw error;
    return (data || []).map(d => ({
      id: d.id,
      tipo: d.tipo,
      tipoManual: d.tipo_manual,
      data: d.data,
      horaInicio: d.hora_inicio,
      horaFim: d.hora_fim,
      responsaveis: d.responsaveis,
      status: d.status
    } as Culto));
  },

  getActiveCulto: async () => {
    const { data, error } = await supabase
      .from(TABLES.CULTOS)
      .select('*')
      .eq('status', 'ativo')
      .limit(1)
      .maybeSingle();
    
    if (error) throw error;
    if (!data) return null;
    return {
      id: data.id,
      tipo: data.tipo,
      tipoManual: data.tipo_manual,
      data: data.data,
      horaInicio: data.hora_inicio,
      horaFim: data.hora_fim,
      responsaveis: data.responsaveis,
      status: data.status
    } as Culto;
  },

  subscribeToActiveCulto: (callback: (culto: Culto | null) => void) => {
    // Primeiro carrega o estado inicial
    storageService.getActiveCulto().then(callback).catch(e => console.error("ActiveCulto Sync:", e));

    // Depois escuta mudanças
    return supabase
      .channel('public:active_culto')
      .on('postgres_changes', { event: '*', schema: supabaseConfig.schema, table: TABLES.CULTOS }, (payload) => {
        storageService.getActiveCulto().then(callback);
      })
      .subscribe();
  },

  addCulto: async (c: Omit<Culto, 'id'>) => {
    const { data, error } = await supabase
      .from(TABLES.CULTOS)
      .insert([{
        tipo: c.tipo,
        tipo_manual: c.tipoManual,
        data: c.data,
        hora_inicio: c.horaInicio,
        responsaveis: c.responsaveis,
        status: 'ativo'
      }])
      .select();
    if (error) throw error;
    return data[0];
  },

  updateCulto: async (id: string, updated: Partial<Culto>) => {
    const payload: any = {};
    if (updated.status) payload.status = updated.status;
    if (updated.horaFim) payload.hora_fim = updated.horaFim;

    const { error } = await supabase
      .from(TABLES.CULTOS)
      .update(payload)
      .eq('id', id);
    if (error) throw error;
  },

  // Checkins
  getCheckins: async (idCulto: string) => {
    const { data, error } = await supabase
      .from(TABLES.CHECKINS)
      .select('*')
      .eq('id_culto', idCulto);
    
    if (error) throw error;
    return (data || []).map(d => ({
      id: d.id,
      idCrianca: d.id_crianca,
      idCulto: d.id_culto,
      horaEntrada: d.hora_entrada,
      horaSaida: d.hora_saida,
      quemRetirou: d.quem_retirou,
      status: d.status
    } as CheckIn));
  },

  getAllCheckins: async () => {
    const { data, error } = await supabase
      .from(TABLES.CHECKINS)
      .select('*');
    
    if (error) throw error;
    return (data || []).map(d => ({
      id: d.id,
      idCrianca: d.id_crianca,
      idCulto: d.id_culto,
      horaEntrada: d.hora_entrada,
      horaSaida: d.hora_saida,
      quemRetirou: d.quem_retirou,
      status: d.status
    } as CheckIn));
  },

  subscribeToCheckins: (idCulto: string, callback: (checkins: CheckIn[]) => void) => {
    storageService.getCheckins(idCulto).then(callback).catch(e => console.error("Checkins Sync:", e));

    return supabase
      .channel(`public:checkins:${idCulto}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: supabaseConfig.schema, 
        table: TABLES.CHECKINS,
        filter: `id_culto=eq.${idCulto}`
      }, () => {
        storageService.getCheckins(idCulto).then(callback);
      })
      .subscribe();
  },

  addCheckin: async (c: Omit<CheckIn, 'id'>) => {
    const { error } = await supabase
      .from(TABLES.CHECKINS)
      .insert([{
        id_crianca: c.idCrianca,
        id_culto: c.idCulto,
        hora_entrada: c.horaEntrada,
        status: 'presente'
      }]);
    if (error) throw error;
  },

  updateCheckin: async (id: string, updated: Partial<CheckIn>) => {
    const payload: any = {};
    if (updated.status) payload.status = updated.status;
    if (updated.horaSaida) payload.hora_saida = updated.horaSaida;
    if (updated.quemRetirou) payload.quem_retirou = updated.quemRetirou;

    const { error } = await supabase
      .from(TABLES.CHECKINS)
      .update(payload)
      .eq('id', id);
    if (error) throw error;
  },

  // PreCheckins
  getPreCheckins: async () => {
    const { data, error } = await supabase
      .from(TABLES.PRECHECKINS)
      .select('*');
    
    if (error) throw error;
    return (data || []).map(d => ({
      id: d.id,
      idCrianca: d.id_crianca,
      idCulto: d.id_culto,
      codigo: d.codigo,
      status: d.status,
      dataHoraPreCheckin: d.data_hora_pre_checkin,
      dataHoraCheckin: d.data_hora_checkin
    } as PreCheckIn));
  },

  subscribeToPreCheckins: (callback: (pre: PreCheckIn[]) => void) => {
    storageService.getPreCheckins().then(callback).catch(e => console.error("PreCheckins Sync:", e));

    return supabase
      .channel('public:pre_checkins')
      .on('postgres_changes', { event: '*', schema: supabaseConfig.schema, table: TABLES.PRECHECKINS }, () => {
        storageService.getPreCheckins().then(callback);
      })
      .subscribe();
  },

  addPreCheckin: async (p: Omit<PreCheckIn, 'id'>) => {
    const { error } = await supabase
      .from(TABLES.PRECHECKINS)
      .insert([{
        id_crianca: p.idCrianca,
        id_culto: p.idCulto,
        codigo: p.codigo,
        status: 'pendente'
      }]);
    if (error) throw error;
  },

  updatePreCheckin: async (id: string, updated: Partial<PreCheckIn>) => {
    const payload: any = {};
    if (updated.status) payload.status = updated.status;
    if (updated.dataHoraCheckin) payload.data_hora_checkin = updated.dataHoraCheckin;

    const { error } = await supabase
      .from(TABLES.PRECHECKINS)
      .update(payload)
      .eq('id', id);
    if (error) throw error;
  }
};
