import { apiClient } from './client';
import type { Alocacao, AlocacaoRequest } from '../types';

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

export async function historicoDoUsuario(usuarioId: string): Promise<Alocacao[]> {
  const { data } = await apiClient.get<Alocacao[]>(`/usuarios/${usuarioId}/alocacoes`);
  return data;
}

export async function alocadosAtualmenteNoSetor(setorId: string): Promise<Alocacao[]> {
  const { data } = await apiClient.get<Alocacao[]>(`/setores/${setorId}/alocacoes-atuais`);
  return data;
}