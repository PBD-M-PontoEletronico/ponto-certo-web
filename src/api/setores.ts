import { apiClient } from './client';
import type { Setor, SetorRequest, Pagina, SetorFiltro } from '../types';

export async function listarSetores(empresaId?: string): Promise<Setor[]> {
    const { data } = await apiClient.get<Setor[]>('/setores', {
        params: empresaId ? { empresaId } : undefined,
    });
    return data;
}

export async function buscarSetores(
  filtro: SetorFiltro,
  pagina: number,
  tamanho = 10,
): Promise<Pagina<Setor>> {
  const { data } = await apiClient.get<Pagina<Setor>>('/setores/busca', {
    params: { ...filtro, page: pagina, size: tamanho },
  });
  return data;
}

export async function criarSetor(request: SetorRequest): Promise<Setor> {
    const { data } = await apiClient.post<Setor>('/setores', request);
    return data;
}

export async function excluirSetor(id: string): Promise<void> {
    await apiClient.delete(`/setores/${id}`);
}