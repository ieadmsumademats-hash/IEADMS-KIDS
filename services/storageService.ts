
import { Crianca, Culto, CheckIn, PreCheckIn } from '../types';

const KEYS = {
  CRIANCAS: 'ieadms_v2_criancas',
  CULTOS: 'ieadms_v2_cultos',
  CHECKINS: 'ieadms_v2_checkins',
  PRECHECKINS: 'ieadms_v2_precheckins'
};

export const storageService = {
  get: <T,>(key: string): T[] => {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  },
  
  save: <T,>(key: string, data: T[]): void => {
    localStorage.setItem(key, JSON.stringify(data));
  },

  // Criancas
  getCriancas: () => storageService.get<Crianca>(KEYS.CRIANCAS),
  addCrianca: (c: Crianca) => storageService.save(KEYS.CRIANCAS, [...storageService.getCriancas(), c]),

  // Cultos
  getCultos: () => storageService.get<Culto>(KEYS.CULTOS),
  getActiveCulto: () => storageService.getCultos().find(c => c.status === 'ativo'),
  addCulto: (c: Culto) => storageService.save(KEYS.CULTOS, [...storageService.getCultos(), c]),
  updateCulto: (updated: Culto) => {
    const list = storageService.getCultos().map(c => c.id === updated.id ? updated : c);
    storageService.save(KEYS.CULTOS, list);
  },

  // Checkins
  getCheckins: () => storageService.get<CheckIn>(KEYS.CHECKINS),
  addCheckin: (c: CheckIn) => storageService.save(KEYS.CHECKINS, [...storageService.getCheckins(), c]),
  updateCheckin: (updated: CheckIn) => {
    const list = storageService.getCheckins().map(c => c.id === updated.id ? updated : c);
    storageService.save(KEYS.CHECKINS, list);
  },

  // PreCheckins
  getPreCheckins: () => storageService.get<PreCheckIn>(KEYS.PRECHECKINS),
  addPreCheckin: (p: PreCheckIn) => storageService.save(KEYS.PRECHECKINS, [...storageService.getPreCheckins(), p]),
  updatePreCheckin: (updated: PreCheckIn) => {
    const list = storageService.getPreCheckins().map(p => p.id === updated.id ? updated : p);
    storageService.save(KEYS.PRECHECKINS, list);
  }
};
