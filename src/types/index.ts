import type { Escala } from './escala';

// Espelha o enum Perfil.java do backend
export type Perfil =
    | 'SUPERADMIN'
    | 'RH_ADMIN'
    | 'GESTOR'
    | 'FUNCIONARIO'
    | 'USUARIO_SETOR';

// Espelha LoginRequestDTO.java
export interface LoginRequest {
  usuario: string;
  senha: string;
}

// Espelha Tema.java
export type Tema = 'CLARO' | 'ESCURO';

// Espelha LoginResponseDTO.java
export interface LoginResponse {
  token: string;
  nome: string;
  perfil: Perfil;
  empresaId: string | null;
  setorsId: string[];
  tema: Tema;
}

// Espelha PreferenciaUsuarioDTO.java
export interface PreferenciaUsuario {
  tema: Tema;
}

// Espelha Empresa.java
export interface Empresa {
  id: string;
  razaoSocial: string;
  contato: string | null;
  ativa: boolean;
}

// Espelha EmpresaRequestDTO.java
export interface EmpresaRequest {
  razaoSocial: string;
  contato?: string;
}

// Espelha Usuario.java (sem a senha, que nunca deve trafegar de volta)
export interface Usuario {
  id: string;
  nome: string;
  usuario: string;
  perfil: Perfil;
  empresaId: string | null; // era "empresa: Empresa | null"
  matricula: string | null;
  cargo: string | null;
}

// Espelha UsuarioRequestDTO.java
export interface UsuarioRequest {
  nome: string;
  usuario: string;
  senha: string;
  perfil: Perfil;
  empresaId?: string;
  matricula?: string; // NOVO — obrigatório quando perfil = FUNCIONARIO
  cargo?: string;      // NOVO
}

// Espelha ErrorResponseDTO.java
export interface ApiError {
  message: string;
  code?: string;
  status: number;
  timestamp: string;
  fields?: Record<string, string> | null;
}

export type PoliticaForaPerimetro = 'BLOQUEAR' | 'PENDENTE_ANALISE';

export interface Setor {
  id: string;
  nome: string;
  endereco: string;
  latitude: number;
  longitude: number;
  raioMetros: number;
  exigirSelfie: boolean;
  politicaForaPerimetro: PoliticaForaPerimetro;
  ignorarLocalizacao: boolean;
  empresa: Empresa;
}

export interface SetorRequest {
  nome: string;
  endereco: string;
  latitude: number;
  longitude: number;
  raioMetros: number;
  exigirSelfie: boolean;
  politicaForaPerimetro: PoliticaForaPerimetro;
  ignorarLocalizacao: boolean;
  empresaId?: string;
}

export interface Alocacao {
  id: string;
  usuario: Usuario;
  setor: Setor;
  escala: Escala;
  dataInicio: string;
  dataFim: string;
}

// Espelha AlocacaoRequestDTO.java
export interface AlocacaoRequest {
  usuarioId: string;
  setorId: string;
  escalaId: string;
  dataInicio: string;
  dataFim: string;
}

// Espelha AgendaTurnoDTO.java
export interface AgendaTurno {
  data: string;
  horaInicio: string;
  horaFim: string;
  atravessaMeiaNoite: boolean;
  setorId: string;
  setorNome: string;
  escalaId: string;
  escalaNome: string;
}

// Espelha TrocaEscalaRequestDTO.java
export interface TrocaEscalaRequest {
  escalaId: string;
  setorId?: string; // vazio = continua no mesmo setor
  dataTroca: string; // primeiro dia da nova escala
  dataFim?: string; // vazio = até o fim que a alocação atual tinha
}

// Espelha TrocaEscalaResponseDTO.java
export interface TrocaEscalaResponse {
  encerrada: Alocacao;
  nova: Alocacao;
}

// Espelha Feriado (FeriadoResponseDTO.java). setorId nulo = empresa inteira.
export interface Feriado {
  id: string;
  data: string;
  descricao: string;
  empresaId: string;
  setorId: string | null;
  setorNome: string | null;
}

// Espelha FeriadoRequestDTO.java
export interface FeriadoRequest {
  data: string;
  descricao: string;
  setorId?: string;
  empresaId?: string;
}

// Espelha o enum TipoAfastamento.java
export type TipoAfastamento = 'FERIAS' | 'ATESTADO' | 'LICENCA' | 'OUTRO';

// Espelha AfastamentoResponseDTO.java
export interface Afastamento {
  id: string;
  usuario: Usuario;
  tipo: TipoAfastamento;
  dataInicio: string;
  dataFim: string;
  temAnexo: boolean;
  anexoNome: string | null;
}

// Campos do formulário de afastamento (a API recebe como multipart/form-data)
export interface AfastamentoRequest {
  usuarioId: string;
  tipo: TipoAfastamento;
  dataInicio: string;
  dataFim: string;
  anexo?: File | null;
}

// Espelham SituacaoDia.java, EspelhoTurnoDTO.java e EspelhoDiaDTO.java
export type SituacaoDia = 'TRABALHO' | 'FOLGA' | 'FERIADO' | 'AFASTAMENTO' | 'SEM_ALOCACAO';

export interface EspelhoTurno {
  horaInicio: string;
  horaFim: string;
  atravessaMeiaNoite: boolean;
  setorId: string;
  setorNome: string;
  escalaNome: string;
}

export interface EspelhoDia {
  data: string;
  situacao: SituacaoDia;
  descricao: string | null; // nome do feriado ou tipo do afastamento
  turnos: EspelhoTurno[];
}

export interface UsuarioFiltro {
  nome?: string;
  usuario?: string;
  perfil?: Perfil;
  empresaId?: string;
  matricula?: string;
  cargo?: string;
}

// Espelha PaginaDTO.java
export interface Pagina<T> {
  conteudo: T[];
  paginaAtual: number;
  tamanhoPagina: number;
  totalElementos: number;
  totalPaginas: number;
}

export const POLITICA_FORA_PERIMETRO_LABELS: Record<PoliticaForaPerimetro, string> = {
  BLOQUEAR: 'Bloquear a marcação',
  PENDENTE_ANALISE: 'Aceitar como pendente de análise',
};

export const PERFIL_LABELS: Record<Perfil, string> = {
  SUPERADMIN: 'Superadministrador',
  RH_ADMIN: 'RH / Administrador',
  GESTOR: 'Gestor',
  FUNCIONARIO: 'Funcionário',
  USUARIO_SETOR: 'Usuário do setor',
};

export const TIPO_AFASTAMENTO_LABELS: Record<TipoAfastamento, string> = {
  FERIAS: 'Férias',
  ATESTADO: 'Atestado',
  LICENCA: 'Licença',
  OUTRO: 'Outro',
};

export const SITUACAO_DIA_LABELS: Record<SituacaoDia, string> = {
  TRABALHO: 'Trabalho',
  FOLGA: 'Folga',
  FERIADO: 'Feriado',
  AFASTAMENTO: 'Afastamento',
  SEM_ALOCACAO: 'Sem alocação',
};
