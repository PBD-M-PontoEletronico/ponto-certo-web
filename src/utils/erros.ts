import { extrairErro } from '../api/client';

// Mensagem pronta para mostrar na tela. Quando a API devolve erro de
// validação de campos ("Erro de validação" + lista por campo), mostra os
// detalhes de cada campo em vez do título genérico.
export function mensagemDoErro(err: unknown): string {
  const erro = extrairErro(err);
  const campos = erro.fields ? Object.values(erro.fields) : [];
  return campos.length > 0 ? campos.join('. ') : erro.message;
}
