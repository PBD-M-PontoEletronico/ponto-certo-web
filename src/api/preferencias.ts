import { apiClient } from './client';
import type { PreferenciaUsuario, Tema } from '../types';

export async function obterPreferencias(): Promise<PreferenciaUsuario> {
  const { data } = await apiClient.get<PreferenciaUsuario>('/me/preferencias');
  return data;
}

export async function atualizarTema(tema: Tema): Promise<PreferenciaUsuario> {
  const { data } = await apiClient.patch<PreferenciaUsuario>('/me/preferencias', { tema });
  return data;
}
