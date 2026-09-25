import { apiClient } from './client';
import type { Afastamento, AfastamentoRequest } from '../types';

export async function listarAfastamentos(empresaId?: string): Promise<Afastamento[]> {
  const { data } = await apiClient.get<Afastamento[]>('/afastamentos', {
    params: empresaId ? { empresaId } : undefined,
  });
  return data;
}

// O cadastro vai como multipart/form-data porque pode levar um arquivo (anexo).
export async function criarAfastamento(request: AfastamentoRequest): Promise<Afastamento> {
  const formulario = new FormData();
  formulario.append('usuarioId', request.usuarioId);
  formulario.append('tipo', request.tipo);
  formulario.append('dataInicio', request.dataInicio);
  formulario.append('dataFim', request.dataFim);
  if (request.anexo) {
    formulario.append('anexo', request.anexo);
  }

  const { data } = await apiClient.post<Afastamento>('/afastamentos', formulario, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}

export async function excluirAfastamento(id: string): Promise<void> {
  await apiClient.delete(`/afastamentos/${id}`);
}

// O anexo exige o token no cabeçalho, então não dá para ser um link simples:
// busca o arquivo pela API e dispara o download no navegador.
export async function baixarAnexo(afastamento: Afastamento): Promise<void> {
  const { data } = await apiClient.get<Blob>(`/afastamentos/${afastamento.id}/anexo`, {
    responseType: 'blob',
  });

  const url = URL.createObjectURL(data);
  const link = document.createElement('a');
  link.href = url;
  link.download = afastamento.anexoNome ?? 'anexo';
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
