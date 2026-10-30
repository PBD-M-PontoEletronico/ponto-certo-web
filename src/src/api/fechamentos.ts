import { apiClient } from './client';
import type { Fechamento } from '../types';

export async function listarFechamentos(empresaId?: string): Promise<Fechamento[]> {
  const { data } = await apiClient.get<Fechamento[]>('/fechamentos', {
    params: empresaId ? { empresaId } : undefined,
  });
  return data;
}

// mes no formato "AAAA-MM"
export async function fecharMes(mes: string, empresaId?: string): Promise<Fechamento> {
  const { data } = await apiClient.post<Fechamento>('/fechamentos', { mes, empresaId });
  return data;
}

export async function reabrirMes(id: string): Promise<void> {
  await apiClient.delete(`/fechamentos/${id}`);
}
