import { Escala, ModeloEscala, PrevisaoDia, Turno } from '../types/escala';

function minutosDesdeMeiaNoite(horario: string): number {
    const [h, m] = horario.split(':').map(Number);
    return h * 60 + m;
}

export function turnoAtravessaMeiaNoite(turno: Turno): boolean {
    return minutosDesdeMeiaNoite(turno.horaFim) <= minutosDesdeMeiaNoite(turno.horaInicio);
}

export function duracaoTurnoMinutos(turno: Turno): number {
    const inicio = minutosDesdeMeiaNoite(turno.horaInicio);
    let fim = minutosDesdeMeiaNoite(turno.horaFim);
    if (fim <= inicio) {
        fim += 24 * 60;
    }
    return fim - inicio - turno.intervaloMinutos;
}

export function formatarDuracao(minutos: number): string {
    const horas = Math.floor(minutos / 60);
    const restante = minutos % 60;
    return `${horas}h${restante.toString().padStart(2, '0')}`;
}

function diasEntre(a: Date, b: Date): number {
    const diaA = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
    const diaB = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());
    return Math.round((diaB - diaA) / 86400000);
}

function tamanhoDoCiclo(modelo: ModeloEscala): number | null {
    if (modelo === ModeloEscala.JORNADA_24X72) return 4;
    if (modelo === ModeloEscala.JORNADA_12X36) return 2;
    return null;
}

export function ehDiaDeTrabalho(escala: Escala, data: Date): boolean {
    const ciclo = tamanhoDoCiclo(escala.modelo);

    if (ciclo !== null) {
        if (!escala.dataReferencia) return false;
        const referencia = new Date(escala.dataReferencia);
        const diff = diasEntre(referencia, data);
        const posicao = ((diff % ciclo) + ciclo) % ciclo;
        return posicao === 0;
    }

    if (escala.modelo === ModeloEscala.COMERCIAL_5X2) {
        const diaSemana = data.getDay();
        if (escala.diasSemana && escala.diasSemana.length > 0) {
            return escala.diasSemana.includes(diaSemana);
        }
        return diaSemana >= 1 && diaSemana <= 5;
    }

    if (escala.diasSemana && escala.diasSemana.length > 0) {
        return escala.diasSemana.includes(data.getDay());
    }

    return true;
}

export function gerarPrevisao(escala: Escala, dataInicio: Date, quantidadeDias: number): PrevisaoDia[] {
    const previsao: PrevisaoDia[] = [];

    for (let i = 0; i < quantidadeDias; i++) {
        const data = new Date(dataInicio);
        data.setDate(data.getDate() + i);
        const trabalha = ehDiaDeTrabalho(escala, data);

        previsao.push({
            data: data.toISOString().slice(0, 10),
            trabalha,
            turnos: trabalha ? escala.turnos : [],
        });
    }

    return previsao;
}

export function exigeDataReferencia(modelo: ModeloEscala): boolean {
    return modelo === ModeloEscala.JORNADA_24X72 || modelo === ModeloEscala.JORNADA_12X36;
}