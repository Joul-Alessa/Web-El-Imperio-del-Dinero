function calcularBalance(movimientos) {
  return movimientos.reduce(
    (acc, m) => (m.tipo === 'gasto' ? acc - Number(m.monto) : acc + Number(m.monto)),
    0,
  );
}

function calcularDeltaRevalorizacion(valorAnterior, valorNuevo) {
  const delta = Number(valorNuevo) - valorAnterior;
  if (delta === 0) return null;
  return {
    delta,
    tipo: delta > 0 ? 'ingreso' : 'gasto',
    monto: Math.abs(delta),
  };
}

module.exports = { calcularBalance, calcularDeltaRevalorizacion };
