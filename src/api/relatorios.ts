import axios from 'axios';
import { apiClient } from './client';
import type { RelatorioFiltro, RelatorioPrevistoRealizado } from '../types';

// Tira campos vazios para não mandar "setorId=" na URL.
function parametros(filtro: RelatorioFiltro) {
  return Object.fromEntries(
    Object.entries(filtro).filter(([, valor]) => valor !== undefined && valor !== ''),
  );
}

export async function buscarPrevistoRealizado(
  filtro: RelatorioFiltro,
): Promise<RelatorioPrevistoRealizado> {
  const { data } = await apiClient.get<RelatorioPrevistoRealizado>(
    '/relatorios/previsto-realizado',
    { params: parametros(filtro) },
  );
  return data;
}

// Baixa o CSV e dispara o download no navegador.
export async function baixarPrevistoRealizadoCsv(filtro: RelatorioFiltro): Promise<void> {
  try {
    const { data } = await apiClient.get<Blob>('/relatorios/previsto-realizado/csv', {
      params: parametros(filtro),
      responseType: 'blob',
    });

    const url = URL.createObjectURL(data);
    const link = document.createElement('a');
    link.href = url;
    link.download = `previsto-realizado_${filtro.inicio}_${filtro.fim}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  } catch (err) {
    // Com responseType "blob", o JSON de erro da API também chega como Blob:
    // converte de volta para o formato normal antes de repassar o erro.
    if (axios.isAxiosError(err) && err.response?.data instanceof Blob) {
      try {
        err.response.data = JSON.parse(await err.response.data.text());
      } catch {
        // não era JSON: deixa como está
      }
    }
    throw err;
  }
}
