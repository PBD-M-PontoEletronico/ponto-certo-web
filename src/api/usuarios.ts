import { apiClient } from './client';
import type { Pagina, Usuario, UsuarioFiltro, UsuarioRequest } from '../types';

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

export async function buscarUsuarios(
  filtro: UsuarioFiltro,
  pagina: number,
  tamanho = 10,
): Promise<Pagina<Usuario>> {
  const { data } = await apiClient.get<Pagina<Usuario>>('/usuarios/busca', {
    params: { ...filtro, page: pagina, size: tamanho },
  });
  return data;
}