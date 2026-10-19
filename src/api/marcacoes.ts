import { apiClient } from './client';
import type { Marcacao, MarcacaoFiltro, Pagina } from '../types';

export async function buscarMarcacoes(
  filtro: MarcacaoFiltro,
  pagina: number,
  tamanho = 10,
): Promise<Pagina<Marcacao>> {
  const { data } = await apiClient.get<Pagina<Marcacao>>('/marcacoes', {
    params: { ...filtro, page: pagina, size: tamanho },
  });
  return data;
}

export async function revisarMarcacao(
  id: string,
  novoStatus: 'VALIDA' | 'RECUSADA',
  motivo?: string,
): Promise<Marcacao> {
  const { data } = await apiClient.patch<Marcacao>(`/marcacoes/${id}/revisar`, {
    novoStatus,
    motivo,
  });
  return data;
}

export function urlSelfie(id: string): string {
  return `${apiClient.defaults.baseURL}/marcacoes/${id}/selfie`;
}