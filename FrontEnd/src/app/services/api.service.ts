import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URL } from '../core/api.config';
import {
  Persona, Institucion, Divisa, Instrumento, Cuenta, Movimiento,
  RevalorizacionPayload, MovimientoFiltros, MovimientosPaginados, CuentaFiltros,
  Historial, HistorialFiltros,
} from '../core/models';

@Injectable({ providedIn: 'root' })
export class ApiService {
  constructor(private http: HttpClient) {}

  private buildParams(filtros: Record<string, any>): HttpParams {
    let params = new HttpParams();
    for (const [key, value] of Object.entries(filtros)) {
      if (value === undefined || value === null || value === '') continue;
      if (Array.isArray(value)) {
        for (const v of value) {
          if (v !== undefined && v !== null && v !== '') {
            params = params.append(key, String(v));
          }
        }
      } else {
        params = params.set(key, String(value));
      }
    }
    return params;
  }

  // ---------- Personas ----------
  getPersonas(): Observable<Persona[]> { return this.http.get<Persona[]>(`${API_URL}/personas`); }
  createPersona(p: Persona) { return this.http.post<Persona>(`${API_URL}/personas`, p); }
  updatePersona(id: number, p: Persona) { return this.http.put<Persona>(`${API_URL}/personas/${id}`, p); }
  deletePersona(id: number) { return this.http.delete(`${API_URL}/personas/${id}`); }

  // ---------- Instituciones ----------
  getInstituciones(): Observable<Institucion[]> { return this.http.get<Institucion[]>(`${API_URL}/instituciones`); }
  createInstitucion(i: Institucion) { return this.http.post<Institucion>(`${API_URL}/instituciones`, i); }
  updateInstitucion(id: number, i: Institucion) { return this.http.put<Institucion>(`${API_URL}/instituciones/${id}`, i); }
  deleteInstitucion(id: number) { return this.http.delete(`${API_URL}/instituciones/${id}`); }

  // ---------- Divisas ----------
  getDivisas(): Observable<Divisa[]> { return this.http.get<Divisa[]>(`${API_URL}/divisas`); }
  createDivisa(d: Divisa) { return this.http.post<Divisa>(`${API_URL}/divisas`, d); }
  updateDivisa(id: number, d: Divisa) { return this.http.put<Divisa>(`${API_URL}/divisas/${id}`, d); }
  deleteDivisa(id: number) { return this.http.delete(`${API_URL}/divisas/${id}`); }

  // ---------- Instrumentos ----------
  getInstrumentos(): Observable<Instrumento[]> { return this.http.get<Instrumento[]>(`${API_URL}/instrumentos`); }
  createInstrumento(i: Instrumento) { return this.http.post<Instrumento>(`${API_URL}/instrumentos`, i); }
  updateInstrumento(id: number, i: Instrumento) { return this.http.put<Instrumento>(`${API_URL}/instrumentos/${id}`, i); }
  deleteInstrumento(id: number) { return this.http.delete(`${API_URL}/instrumentos/${id}`); }

  // ---------- Cuentas ----------
  getCuentas(filtros: CuentaFiltros = {}): Observable<Cuenta[]> {
    return this.http.get<Cuenta[]>(`${API_URL}/cuentas`, { params: this.buildParams(filtros) });
  }
  getCuenta(id: number) { return this.http.get<Cuenta>(`${API_URL}/cuentas/${id}`); }
  getCuentasResumen() {
    return this.http.get<{ cuenta_id: number; balance: number; cantidad: number | null; precio_unitario: number | null }[]>(
      `${API_URL}/cuentas/resumen`,
    );
  }
  getCuentaBalance(id: number, fecha: string, excludeMovimientoId?: number) {
    const params: Record<string, any> = { fecha };
    if (excludeMovimientoId != null) params['excludeMovimientoId'] = excludeMovimientoId;
    return this.http.get<{ balance: number }>(`${API_URL}/cuentas/${id}/balance`, {
      params: this.buildParams(params),
    });
  }
  getUltimoMovInversion(cuentaId: number) {
    return this.http.get<{ cantidad: number | null; precio_unitario: number | null }>(
      `${API_URL}/cuentas/${cuentaId}/ultimo-movimiento-inversion`,
    );
  }
  createCuenta(c: Cuenta) { return this.http.post<Cuenta>(`${API_URL}/cuentas`, c); }
  updateCuenta(id: number, c: Cuenta) { return this.http.put<Cuenta>(`${API_URL}/cuentas/${id}`, c); }
  deleteCuenta(id: number) { return this.http.delete(`${API_URL}/cuentas/${id}`); }

  // ---------- Movimientos ----------
  getMovimientos(filtros: MovimientoFiltros = {}): Observable<Movimiento[]> {
    return this.http.get<Movimiento[]>(`${API_URL}/movimientos`, { params: this.buildParams(filtros) });
  }
  getMovimientosPaginado(filtros: MovimientoFiltros = {}): Observable<MovimientosPaginados> {
    return this.http.get<MovimientosPaginados>(`${API_URL}/movimientos/paginado`, { params: this.buildParams(filtros) });
  }
  createMovimiento(m: Movimiento | RevalorizacionPayload) { return this.http.post<any>(`${API_URL}/movimientos`, m); }
  updateMovimiento(id: number, m: Movimiento | RevalorizacionPayload) { return this.http.put<any>(`${API_URL}/movimientos/${id}`, m); }
  deleteMovimiento(id: number) { return this.http.delete(`${API_URL}/movimientos/${id}`); }

  // ---------- Respaldo ----------
  downloadRespaldoSqlite(): Observable<Blob> {
    return this.http.get(`${API_URL}/respaldo/sqlite`, { responseType: 'blob' });
  }

  // ---------- Historial ----------
  getHistorial(filtros: HistorialFiltros = {}): Observable<Historial[]> {
    return this.http.get<Historial[]>(`${API_URL}/historial`, { params: this.buildParams(filtros) });
  }
}
