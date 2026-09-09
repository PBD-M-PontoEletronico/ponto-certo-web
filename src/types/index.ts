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

// Espelha LoginResponseDTO.java
export interface LoginResponse {
  token: string;
  nome: string;
  perfil: Perfil;
  empresaId: string | null;
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
  dataInicio: string;
  dataFim: string | null;
}

// Espelha AlocacaoRequestDTO.java
export interface AlocacaoRequest {
  usuarioId: string; 
  setorId: string;
  dataInicio: string;
  dataFim?: string;
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