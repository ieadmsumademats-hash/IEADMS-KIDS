
export type CultoType = 'Santa Ceia' | 'Reunião de Obreiros' | 'Umademats' | 'CIFAD' | 'Outros';

export interface Crianca {
  id: string;
  nome: string;
  sobrenome: string;
  dataNascimento: string;
  responsavelNome: string;
  whatsapp: string;
  observacoes?: string;
  createdAt: string;
}

export interface CheckIn {
  id: string;
  idCrianca: string;
  idCulto: string;
  horaEntrada: string;
  horaSaida?: string;
  quemRetirou?: string;
  status: 'presente' | 'saiu';
}

export interface PreCheckIn {
  id: string;
  idCrianca: string;
  idCulto: string;
  codigo: string; // KIDS-####
  status: 'pendente' | 'confirmado';
  dataHoraPreCheckin: string;
  dataHoraCheckin?: string;
}

export interface Culto {
  id: string;
  tipo: CultoType;
  tipoManual?: string;
  data: string;
  horaInicio: string;
  horaFim?: string;
  responsaveis: string;
  status: 'ativo' | 'encerrado';
}

export interface NotificacaoAtiva {
  id: string;
  id_crianca: string;
  id_culto: string;
  mensagem: string;
  created_at: string;
}
