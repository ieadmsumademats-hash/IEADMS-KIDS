
export type CultoType = 'Santa Ceia' | 'Reunião de Obreiros' | 'Umademats' | 'CIFAD' | 'Outros';

export interface Responsavel {
  nome: string;
  whatsapp: string;
  parentesco: string;
}

export interface Crianca {
  id: string;
  nome: string;
  sobrenome: string;
  dataNascimento: string;
  sexo?: 'M' | 'F';
  responsavelNome: string;
  whatsapp: string;
  responsaveis: Responsavel[];
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
  autorizadoRetirar?: string;
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
