import { apiClient } from './client';
import type { Setor, SetorRequest } from '../types';

export async function listarSetores(empresaId?: string): Promise<Setor[]> {
    const { data } = await apiClient.get<Setor[]>('/setores', {
        params: empresaId ? { empresaId } : undefined,
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