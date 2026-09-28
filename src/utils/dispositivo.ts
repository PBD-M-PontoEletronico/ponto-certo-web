const CHAVE = 'meuponto:dispositivoId';

// Gera (uma única vez) e persiste um identificador de aparelho no localStorage.
// É o que o backend usa pra saber se é "o mesmo aparelho de sempre" (WEB-07).
export function obterIdentificadorDispositivo(): string {
  let id = localStorage.getItem(CHAVE);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(CHAVE, id);
  }
  return id;
}