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
  setorId: string | null; // NOVO — só preenchido quando perfil = USUARIO_SETOR
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
  setorId?: string;    // NOVO — só preenchido quando perfil = USUARIO_SETOR
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

// W10 — o que aconteceu no dia. ajuste = false: batida no aparelho (original);
// ajuste = true: criada por pedido de ajuste aprovado.
export interface EspelhoMarcacao {
  id: string;
  tipo: TipoMarcacao;
  hora: string; // instante ISO (já corrigido pelo desvio do relógio)
  status: StatusMarcacao;
  offline: boolean;
  ajuste: boolean;
  solicitacaoId: string | null;
  aprovadoPorNome: string | null;
  aprovadoEm: string | null;
}

export interface EspelhoJustificativa {
  solicitacaoId: string;
  ocorrencia: TipoOcorrencia;
  status: StatusSolicitacao;
  parecer: string | null;
  analisadoPorNome: string | null;
  analisadoEm: string | null;
}

export interface EspelhoDia {
  data: string;
  situacao: SituacaoDia;
  descricao: string | null; // nome do feriado ou tipo do afastamento
  turnos: EspelhoTurno[];
  marcacoes: EspelhoMarcacao[];
  justificativas: EspelhoJustificativa[];
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

export type TipoDispositivo = 'PESSOAL' | 'RELOGIO_SETOR';

export interface Dispositivo {
  id: string;
  tipo: TipoDispositivo;
  identificador: string;
  usuarioId: string;
  usuarioNome: string;
  usuarioPerfil: Perfil;
  empresaId: string | null;
  empresaNome: string | null;
  setorId: string | null;
  setorNome: string | null;
  ativo: boolean;
  dataVinculo: string;
  ultimoAcesso: string;
}

export interface DispositivoFiltro {
  usuarioNome?: string;
  tipo?: TipoDispositivo;
  setorId?: string;
  ativo?: boolean;
  empresaId?: string;
  ultimoAcessoDe?: string;
  ultimoAcessoAte?: string;
  dataVinculoDe?: string;
  dataVinculoAte?: string;
}

export const TIPO_DISPOSITIVO_LABELS: Record<TipoDispositivo, string> = {
  PESSOAL: 'Pessoal',
  RELOGIO_SETOR: 'Relógio de setor',
};

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

// Espelha TipoMarcacao.java (nomes exatos — também usados no app mobile)
export type TipoMarcacao = 'ENTRADA' | 'SAIDA_INTERVALO' | 'RETORNO_INTERVALO' | 'SAIDA';

// Espelha MetodoConfirmacao.java
export type MetodoConfirmacao = 'FOTO' | 'DIGITAL';

// Espelha StatusMarcacao.java
export type StatusMarcacao = 'VALIDA' | 'PENDENTE_ANALISE' | 'RECUSADA';

// Espelha MarcacaoResponseDTO.java
export interface Marcacao {
  id: string;
  usuarioId: string;
  usuarioNome: string;
  registradoPorId: string | null;
  registradoPorNome: string | null;
  setorId: string | null;
  setorNome: string | null;
  empresaId: string | null;
  empresaNome: string | null;
  tipo: TipoMarcacao;
  horaAparelho: string;
  horaCorrigida: string; // hora "de verdade" do toque — use esta pra exibir
  offline: boolean;
  recebidaEm: string;
  latitude: number | null;
  longitude: number | null;
  metodoConfirmacao: MetodoConfirmacao | null; // nulo nas marcações de ajuste
  temSelfie: boolean;
  status: StatusMarcacao;
  motivoRecusa: string | null;
  ajuste: boolean; // W10 — criada por pedido de ajuste aprovado
  solicitacaoId: string | null;
}

export interface MarcacaoFiltro {
  usuarioNome?: string;
  setorId?: string;
  empresaId?: string;
  status?: StatusMarcacao;
  tipo?: TipoMarcacao;
  dataDe?: string;
  dataAte?: string;
}

export const TIPO_MARCACAO_LABELS: Record<TipoMarcacao, string> = {
  ENTRADA: 'Entrada',
  SAIDA_INTERVALO: 'Saída para intervalo',
  RETORNO_INTERVALO: 'Retorno do intervalo',
  SAIDA: 'Saída',
};

export const STATUS_MARCACAO_LABELS: Record<StatusMarcacao, string> = {
  VALIDA: 'Válida',
  PENDENTE_ANALISE: 'Pendente de análise',
  RECUSADA: 'Recusada',
};

export interface SetorFiltro {
  nome?: string;
  empresaId?: string;
  exigirSelfie?: boolean;
  ignorarLocalizacao?: boolean;
  politicaForaPerimetro?: PoliticaForaPerimetro;
}
// ---------------------------------------------------------------------------
// W10 — justificativas e solicitações de ajuste

// Espelha TipoSolicitacao.java, TipoOcorrencia.java e StatusSolicitacao.java
export type TipoSolicitacao = 'JUSTIFICATIVA' | 'AJUSTE';
export type TipoOcorrencia = 'ATRASO' | 'FALTA' | 'SAIDA_ANTECIPADA';
export type StatusSolicitacao = 'PENDENTE' | 'APROVADA' | 'RECUSADA';

// Espelha SolicitacaoResponseDTO.java
export interface Solicitacao {
  id: string;
  tipo: TipoSolicitacao;
  status: StatusSolicitacao;
  usuarioId: string;
  usuarioNome: string;
  usuarioMatricula: string | null;
  empresaId: string | null;
  empresaNome: string | null;
  solicitanteId: string;
  solicitanteNome: string;
  criadoEm: string;
  data: string;
  ocorrencia: TipoOcorrencia | null;
  tipoMarcacao: TipoMarcacao | null;
  horaPretendida: string | null; // "08:00:00"
  motivo: string;
  temAnexo: boolean;
  anexoNome: string | null;
  parecer: string | null;
  analisadoPorId: string | null;
  analisadoPorNome: string | null;
  analisadoEm: string | null;
  marcacaoGeradaId: string | null;
}

// Campos do formulário (a API recebe como multipart/form-data)
export interface SolicitacaoRequest {
  usuarioId?: string;
  tipo: TipoSolicitacao;
  data: string;
  ocorrencia?: TipoOcorrencia;
  tipoMarcacao?: TipoMarcacao;
  horaPretendida?: string; // "HH:mm"
  motivo: string;
  anexo?: File | null;
}

export interface SolicitacaoFiltro {
  usuarioNome?: string;
  empresaId?: string;
  status?: StatusSolicitacao;
  tipo?: TipoSolicitacao;
  dataDe?: string;
  dataAte?: string;
}

// Espelha SolicitacaoContextoDTO.java
export interface SolicitacaoContexto {
  situacao: SituacaoDia;
  descricao: string | null;
  turnosPrevistos: EspelhoTurno[];
  marcacoesDoDia: Marcacao[];
  periodoFechado: boolean;
}

// Espelha FechamentoResponseDTO.java
export interface Fechamento {
  id: string;
  empresaId: string;
  mes: string; // "AAAA-MM"
  fechadoEm: string;
  fechadoPorNome: string;
}

export const TIPO_SOLICITACAO_LABELS: Record<TipoSolicitacao, string> = {
  JUSTIFICATIVA: 'Justificativa',
  AJUSTE: 'Ajuste de ponto',
};

export const TIPO_OCORRENCIA_LABELS: Record<TipoOcorrencia, string> = {
  ATRASO: 'Atraso',
  FALTA: 'Falta',
  SAIDA_ANTECIPADA: 'Saída antecipada',
};

export const STATUS_SOLICITACAO_LABELS: Record<StatusSolicitacao, string> = {
  PENDENTE: 'Pendente',
  APROVADA: 'Aprovado',
  RECUSADA: 'Recusado',
};
