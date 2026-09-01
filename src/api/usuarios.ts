import { apiClient } from './client';
import type { Usuario, UsuarioRequest } from '../types';

export async function criarUsuario(request: UsuarioRequest): Promise<Usuario> {
  const { data } = await apiClient.post<Usuario>('/usuarios', request);
  return data;
}

// NOTA: o backend ainda não tem um GET /usuarios (só o POST de cadastro foi
// construído até agora). Esta função já está pronta pra quando esse endpoint
// existir — basta o Spring Boot expor GET /usuarios (com filtro por empresa
// já resolvido pelo TenantContext, igual foi feito em /setores).
export async function listarUsuarios(): Promise<Usuario[]> {
  const { data } = await apiClient.get<Usuario[]>('/usuarios');
  return data;
}
