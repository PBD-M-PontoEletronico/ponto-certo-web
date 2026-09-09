import { apiClient } from './client';
import type { Usuario, UsuarioRequest } from '../types';

export async function criarUsuario(request: UsuarioRequest): Promise<Usuario> {
  const { data } = await apiClient.post<Usuario>('/usuarios', request);
  return data;
}

export async function listarUsuarios(empresaId?: string): Promise<Usuario[]> {
  const { data } = await apiClient.get<Usuario[]>('/usuarios', {
    params: empresaId ? { empresaId } : undefined,
  });
  return data;
}
