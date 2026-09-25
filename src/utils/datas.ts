// Datas no formato ISO "AAAA-MM-DD", que é o que a API troca com a web.
// Tudo aqui usa o fuso LOCAL do navegador: new Date().toISOString() daria
// o dia seguinte depois das 21h no Brasil (converte para UTC).

function paraISO(data: Date): string {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  const dia = String(data.getDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
}

export function hojeISO(): string {
  return paraISO(new Date());
}

// "AAAA-MM" do mês atual, para o campo <input type="month">
export function mesAtualISO(): string {
  return hojeISO().slice(0, 7);
}

export function ultimoDiaDoMes(dataISO: string): string {
  const [ano, mes] = dataISO.split('-').map(Number);
  const ultimoDia = new Date(ano, mes, 0).getDate();
  return `${ano}-${String(mes).padStart(2, '0')}-${String(ultimoDia).padStart(2, '0')}`;
}

export function somarDias(dataISO: string, dias: number): string {
  const [ano, mes, dia] = dataISO.split('-').map(Number);
  return paraISO(new Date(ano, mes - 1, dia + dias));
}

// "2026-09-21" -> "21/09/2026"
export function formatarData(dataISO: string): string {
  const [ano, mes, dia] = dataISO.split('-');
  return `${dia}/${mes}/${ano}`;
}

// "2026-09-21" -> "seg"
export function diaDaSemana(dataISO: string): string {
  const [ano, mes, dia] = dataISO.split('-').map(Number);
  return new Date(ano, mes - 1, dia)
    .toLocaleDateString('pt-BR', { weekday: 'short' })
    .replace('.', '');
}

// "08:00:00" -> "08:00"
export function formatarHora(hora: string): string {
  return hora.slice(0, 5);
}
