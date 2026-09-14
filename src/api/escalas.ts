import { apiClient } from './client';
import { AtualizarEscalaPayload, CriarEscalaPayload, Escala, PrevisaoDia } from '../types/escala';

export async function listarEscalas(empresaId?: string): Promise<Escala[]> {
    const resposta = await apiClient.get<Escala[]>('/escalas', {
        params: empresaId ? { empresaId } : undefined,
    });
    return resposta.data;
}

export async function obterEscala(id: string): Promise<Escala> {
    const resposta = await apiClient.get<Escala>(`/escalas/${id}`);
    return resposta.data;
}

export async function criarEscala(payload: CriarEscalaPayload): Promise<Escala> {
    const resposta = await apiClient.post<Escala>('/escalas', payload);
    return resposta.data;
}

export async function atualizarEscala(id: string, payload: AtualizarEscalaPayload): Promise<Escala> {
    const resposta = await apiClient.put<Escala>(`/escalas/${id}`, payload);
    return resposta.data;
}

export async function removerEscala(id: string): Promise<void> {
    await apiClient.delete(`/escalas/${id}`);
}

export async function obterPrevisaoEscala(
    id: string,
    dataInicio: string,
    quantidadeDias: number,
): Promise<PrevisaoDia[]> {
    const resposta = await apiClient.get<PrevisaoDia[]>(`/escalas/${id}/previsao`, {
        params: { dataInicio, dias: quantidadeDias },
    });
    return resposta.data;
}