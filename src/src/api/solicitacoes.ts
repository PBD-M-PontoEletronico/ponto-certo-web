import { apiClient } from './client';
import type {
  Pagina,
  Solicitacao,
  SolicitacaoContexto,
  SolicitacaoFiltro,
  SolicitacaoRequest,
} from '../types';

// Fila do gestor/RH: pendentes primeiro (mais antigos no topo), depois os analisados.
export async function buscarSolicitacoes(
  filtro: SolicitacaoFiltro,
  pagina: number,
  tamanho = 10,
): Promise<Pagina<Solicitacao>> {
  const { data } = await apiClient.get<Pagina<Solicitacao>>('/solicitacoes', {
    params: { ...filtro, page: pagina, size: tamanho },
  });
  return data;
}

// Vai como multipart/form-data porque pode levar um anexo (atestado).
export async function criarSolicitacao(request: SolicitacaoRequest): Promise<Solicitacao> {
  const formulario = new FormData();
  if (request.usuarioId) formulario.append('usuarioId', request.usuarioId);
  formulario.append('tipo', request.tipo);
  formulario.append('data', request.data);
  formulario.append('motivo', request.motivo);
  if (request.tipo === 'JUSTIFICATIVA' && request.ocorrencia) {
    formulario.append('ocorrencia', request.ocorrencia);
  }
  if (request.tipo === 'AJUSTE') {
    if (request.tipoMarcacao) formulario.append('tipoMarcacao', request.tipoMarcacao);
    if (request.horaPretendida) formulario.append('horaPretendida', request.horaPretendida);
  }
  if (request.anexo) formulario.append('anexo', request.anexo);

  const { data } = await apiClient.post<Solicitacao>('/solicitacoes', formulario, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}

// O que estava previsto e o que foi batido no dia do pedido.
export async function contextoDaSolicitacao(id: string): Promise<SolicitacaoContexto> {
  const { data } = await apiClient.get<SolicitacaoContexto>(`/solicitacoes/${id}/contexto`);
  return data;
}

export async function analisarSolicitacao(
  id: string,
  decisao: 'APROVADA' | 'RECUSADA',
  parecer: string,
): Promise<Solicitacao> {
  const { data } = await apiClient.patch<Solicitacao>(`/solicitacoes/${id}/analisar`, {
    decisao,
    parecer,
  });
  return data;
}

// Mesmo esquema do anexo de afastamento: precisa do token, então baixa pela API.
export async function baixarAnexo(solicitacao: Solicitacao): Promise<void> {
  const { data } = await apiClient.get<Blob>(`/solicitacoes/${solicitacao.id}/anexo`, {
    responseType: 'blob',
  });

  const url = URL.createObjectURL(data);
  const link = document.createElement('a');
  link.href = url;
  link.download = solicitacao.anexoNome ?? 'anexo';
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
