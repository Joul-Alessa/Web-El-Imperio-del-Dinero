const { describe, it, expect } = require('vitest');
const { calcularBalance, calcularDeltaRevalorizacion } = require('../lib/balances');

describe('calcularBalance', () => {
  it('retorna 0 con lista vacía', () => {
    expect(calcularBalance([])).toBe(0);
  });

  it('suma ingresos correctamente', () => {
    const movs = [
      { tipo: 'ingreso', monto: 1000 },
      { tipo: 'ingreso', monto: 500 },
    ];
    expect(calcularBalance(movs)).toBe(1500);
  });

  it('resta gastos correctamente', () => {
    const movs = [
      { tipo: 'ingreso', monto: 1000 },
      { tipo: 'gasto', monto: 300 },
    ];
    expect(calcularBalance(movs)).toBe(700);
  });

  it('maneja montos como strings (vienen de SQLite)', () => {
    const movs = [
      { tipo: 'ingreso', monto: '1000.50' },
      { tipo: 'gasto', monto: '200.25' },
    ];
    expect(calcularBalance(movs)).toBeCloseTo(800.25);
  });

  it('permite balance negativo', () => {
    const movs = [
      { tipo: 'ingreso', monto: 100 },
      { tipo: 'gasto', monto: 500 },
    ];
    expect(calcularBalance(movs)).toBe(-400);
  });
});

describe('calcularDeltaRevalorizacion', () => {
  it('retorna null cuando delta es cero', () => {
    expect(calcularDeltaRevalorizacion(1000, 1000)).toBeNull();
  });

  it('retorna ingreso cuando el valor nuevo es mayor', () => {
    const result = calcularDeltaRevalorizacion(1000, 1500);
    expect(result).toEqual({ delta: 500, tipo: 'ingreso', monto: 500 });
  });

  it('retorna gasto cuando el valor nuevo es menor', () => {
    const result = calcularDeltaRevalorizacion(1000, 700);
    expect(result).toEqual({ delta: -300, tipo: 'gasto', monto: 300 });
  });

  it('maneja valorNuevo como string', () => {
    const result = calcularDeltaRevalorizacion(1000, '1200');
    expect(result).toEqual({ delta: 200, tipo: 'ingreso', monto: 200 });
  });
});
