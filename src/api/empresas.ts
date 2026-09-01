import { apiClient } from './client';
import type { Empresa, EmpresaRequest } from '../types';

export async function listarEmpresas(): Promise<Empresa[]> {
  const { data } = await apiClient.get<Empresa[]>('/empresas');
  return data;
}

export async function criarEmpresa(request: EmpresaRequest): Promise<Empresa> {
  const { data } = await apiClient.post<Empresa>('/empresas', request);
  return data;
}

export async function atualizarSituacaoEmpresa(
  id: string,
  ativa: boolean
): Promise<Empresa> {
  const { data } = await apiClient.patch<Empresa>(
    `/empresas/${id}/situacao`,
    null,
    { params: { ativa } }
  );
  return data;
}
