import { apiClient } from './client';
import type { Dispositivo, DispositivoFiltro, Pagina } from '../types';

export async function buscarDispositivos(
  filtro: DispositivoFiltro,
  pagina: number,
  tamanho = 10,
): Promise<Pagina<Dispositivo>> {
  const { data } = await apiClient.get<Pagina<Dispositivo>>('/dispositivos', {
    params: { ...filtro, page: pagina, size: tamanho },
  });
  return data;
}

export async function revogarDispositivo(id: string): Promise<void> {
  await apiClient.patch(`/dispositivos/${id}/revogar`);
}