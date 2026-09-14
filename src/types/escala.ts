export enum ModeloEscala {
    JORNADA_24X72 = 'JORNADA_24X72',
    JORNADA_12X36 = 'JORNADA_12X36',
    TURNO_DIURNO = 'TURNO_DIURNO',
    COMERCIAL_5X2 = 'COMERCIAL_5X2',
}

export interface Turno {
    id?: string;
    horaInicio: string;
    horaFim: string;
    intervaloMinutos: number;
}

export interface Escala {
    id: string;
    empresaId: string;
    nome: string;
    modelo: ModeloEscala;
    turnos: Turno[];
    dataReferencia: string | null;
    diasSemana: number[] | null;
}

export type CriarEscalaPayload = Omit<Escala, 'id' | 'empresaId'> & { empresaId?: string };
export type AtualizarEscalaPayload = CriarEscalaPayload;

export interface PrevisaoDia {
    data: string;
    trabalha: boolean;
    turnos: Turno[];
}