import { apiClient } from './client';
import type {
  AgendaTurno,
  Alocacao,
  AlocacaoRequest,
  EspelhoDia,
  TrocaEscalaRequest,
  TrocaEscalaResponse,
} from '../types';

export async function alocar(request: AlocacaoRequest): Promise<Alocacao> {
  const { data } = await apiClient.post<Alocacao>('/alocacoes', request);
  return data;
}

export async function encerrarAlocacao(id: string, dataFim: string): Promise<Alocacao> {
  const { data } = await apiClient.patch<Alocacao>(`/alocacoes/${id}/encerrar`, null, {
    params: { dataFim },
  });
  return data;
}

// Encerra a alocação atual no dia anterior e abre a nova na data da troca
export async function trocarEscala(
  id: string,
  request: TrocaEscalaRequest,
): Promise<TrocaEscalaResponse> {
  const { data } = await apiClient.post<TrocaEscalaResponse>(
    `/alocacoes/${id}/trocar-escala`,
    request,
  );
  return data;
}

export async function historicoDoUsuario(usuarioId: string): Promise<Alocacao[]> {
  const { data } = await apiClient.get<Alocacao[]>(`/usuarios/${usuarioId}/alocacoes`);
  return data;
}

export async function alocadosAtualmenteNoSetor(setorId: string): Promise<Alocacao[]> {
  const { data } = await apiClient.get<Alocacao[]>(`/setores/${setorId}/alocacoes-atuais`);
  return data;
}

export async function agendaDoUsuario(
  usuarioId: string,
  dataInicio: string,
  dataFim: string,
): Promise<AgendaTurno[]> {
  const { data } = await apiClient.get<AgendaTurno[]>(`/usuarios/${usuarioId}/agenda`, {
    params: { dataInicio, dataFim },
  });
  return data;
}

// mes no formato "AAAA-MM"
export async function espelhoDoUsuario(usuarioId: string, mes: string): Promise<EspelhoDia[]> {
  const { data } = await apiClient.get<EspelhoDia[]>(`/usuarios/${usuarioId}/espelho`, {
    params: { mes },
  });
  return data;
}
