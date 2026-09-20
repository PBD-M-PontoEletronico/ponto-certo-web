import { apiClient } from './client';
import type { Feriado, FeriadoRequest } from '../types';

export async function listarFeriados(empresaId?: string, ano?: number): Promise<Feriado[]> {
  const params: Record<string, string | number> = {};
  if (empresaId) params.empresaId = empresaId;
  if (ano) params.ano = ano;

  const { data } = await apiClient.get<Feriado[]>('/feriados', { params });
  return data;
}

export async function criarFeriado(request: FeriadoRequest): Promise<Feriado> {
  const { data } = await apiClient.post<Feriado>('/feriados', request);
  return data;
}

export async function excluirFeriado(id: string): Promise<void> {
  await apiClient.delete(`/feriados/${id}`);
}
