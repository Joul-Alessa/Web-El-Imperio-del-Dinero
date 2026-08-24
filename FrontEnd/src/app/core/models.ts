export interface Persona {
  id?: number;
  nombre: string;
}

export interface Institucion {
  id?: number;
  nombre: string;
  tipo: string; // banco, fintech, broker, gobierno
}

export interface Divisa {
  id?: number;
  codigo: string; // MXN, USD
  nombre: string;
  simbolo: string;
}

export interface Instrumento {
  id?: number;
  nombre: string;
  tipo: string; // renta fija, renta variable, ETF
  riesgo?: string | null; // bajo, medio, alto
  divisa_base_id?: number | null;
  institucion_id?: number | null;
  metadata?: any;
  // joined
  divisa_codigo?: string;
  divisa_nombre?: string;
  institucion_nombre?: string;
}

export type TipoCuenta = 'efectivo' | 'débito' | 'crédito' | 'apartado' | 'inversión';

export interface Cuenta {
  id?: number;
  persona_id: number;
  institucion_id: number | null;
  tipo: string;
  instrumento_id?: number | null;
  divisa_id: number;
  nombre: string;
  plazo?: string | null;
  descripcion?: string | null;
  activo?: number;
  // joined
  persona_nombre?: string;
  institucion_nombre?: string;
  institucion_tipo?: string;
  divisa_codigo?: string;
  divisa_nombre?: string;
  divisa_simbolo?: string;
  instrumento_nombre?: string;
  instrumento_tipo?: string;
}

export type TipoMovimiento = 'ingreso' | 'gasto' | 'revalorizacion';

export interface Movimiento {
  id?: number;
  fecha: string;
  persona_id: number;
  cuenta_id: number;
  tipo: string;
  monto: number;
  divisa_id: number;
  instrumento_id?: number | null;
  cantidad?: number | null;
  precio_unitario?: number | null;
  descripcion?: string | null;
  // joined
  persona_nombre?: string;
  cuenta_nombre?: string;
  cuenta_tipo?: string;
  institucion_nombre?: string;
  divisa_codigo?: string;
  divisa_simbolo?: string;
  instrumento_nombre?: string;
}

// Payload for a "revalorizacion" movement (backend computes the delta).
export interface RevalorizacionPayload {
  tipo: 'revalorizacion';
  cuenta_id: number;
  valor_actual_nuevo: number;
  fecha: string;
  persona_id: number;
  divisa_id?: number;
  descripcion?: string;
  cantidad?: number | null;
  precio_unitario?: number | null;
}

export interface MovimientoFiltros {
  persona_id?: (number | string)[];
  cuenta_id?: (number | string)[];
  institucion_id?: (number | string)[];
  tipo?: string;
  fecha_desde?: string;
  fecha_hasta?: string;
  instrumento_id?: number | string;
  divisa_id?: number | string;
  busqueda?: string;
  page?: number;
  pageSize?: number;
}

export interface MovimientosPaginados {
  data: Movimiento[];
  total: number;
  page: number;
  pageSize: number;
  totalIngresos: number;
  totalGastos: number;
}

export interface Historial {
  id: number;
  fecha: string;
  entidad: string;
  entidad_id: number;
  accion: string;
  detalle: any;
}

export interface HistorialFiltros {
  limit?: number;
  offset?: number;
  entidad?: string;
  accion?: string;
}

export interface CuentaFiltros {
  persona_id?: (number | string)[];
  institucion_id?: (number | string)[];
  tipo?: string;
  divisa_id?: number | string;
  instrumento_id?: number | string;
}
