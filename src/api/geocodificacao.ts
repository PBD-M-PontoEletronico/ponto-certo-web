export interface ResultadoGeocodificacao {
  latitude: number;
  longitude: number;
  enderecoEncontrado: string;
}

// Usa o Nominatim (OpenStreetMap) — gratuito, sem chave de API.
// Política de uso: https://operations.osmfoundation.org/policies/nominatim/
async function consultarNominatim(query: string): Promise<ResultadoGeocodificacao | null> {
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=br&q=${encodeURIComponent(query)}`;
  const resposta = await fetch(url, {
    headers: { 'Accept-Language': 'pt-BR' },
  });

  if (!resposta.ok) {
    throw new Error('Não foi possível buscar o endereço agora. Tente novamente.');
  }

  const resultados = await resposta.json();
  if (!resultados || resultados.length === 0) {
    return null;
  }

  const primeiro = resultados[0];
  return {
    latitude: Number(primeiro.lat),
    longitude: Number(primeiro.lon),
    enderecoEncontrado: primeiro.display_name,
  };
}

// Normaliza uma faixa de número (ex: "354-472") para o primeiro número ("354") —
// o Nominatim não entende faixas, só números únicos.
function normalizarFaixaDeNumero(endereco: string): string {
  return endereco.replace(/(\d+)\s*-\s*\d+/, '$1');
}

// Remove o número da rua inteiramente, como última tentativa — melhor achar
// a rua aproximadamente do que não achar nada.
function removerNumero(endereco: string): string {
  return endereco.replace(/,?\s*\d+[\w-]*/, '');
}

export async function buscarCoordenadas(endereco: string): Promise<ResultadoGeocodificacao | null> {
  // 1ª tentativa: endereço como foi digitado
  let resultado = await consultarNominatim(endereco);
  if (resultado) return resultado;

  // 2ª tentativa: corrige faixa de número ("354-472" -> "354")
  const enderecoSemFaixa = normalizarFaixaDeNumero(endereco);
  if (enderecoSemFaixa !== endereco) {
    resultado = await consultarNominatim(enderecoSemFaixa);
    if (resultado) return resultado;
  }

  // 3ª tentativa: sem número nenhum (acha a rua, mesmo que não o número exato)
  const enderecoSemNumero = removerNumero(enderecoSemFaixa);
  if (enderecoSemNumero !== enderecoSemFaixa) {
    resultado = await consultarNominatim(enderecoSemNumero);
    if (resultado) return resultado;
  }

  return null;
}