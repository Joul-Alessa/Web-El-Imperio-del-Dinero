import pool from '../startup/db.js';

const MovementModel = {
  create: async (req) => {
    const query = `
      INSERT INTO movimientos
      (fecha, persona, tipo, cuenta, descripcion, monto)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *;
    `;
    const { rows } = await pool.query(query, [req.fecha, req.persona, req.tipo, req.cuenta, req.descripcion, req.monto]);
    return rows[0] || null;
  },
  findAll: async () => {
    const query = `
      SELECT *
      FROM movimientos
      ORDER BY id;
    `;
    const { rows } = await pool.query(query);
    return rows;
  },
  findOne: async (id) => {
    const query = `
      SELECT *
      FROM movimientos
      WHERE id = $1
      ORDER BY id;
    `;
    const { rows } = await pool.query(query, [id]);
    return rows[0] || null;
  },
  updateOne: async (req) => {
    const query = `
      UPDATE movimientos
      SET fecha = $2,
          persona = $3,
          tipo = $4,
          cuenta = $5,
          descripcion = $6,
          monto = $7
      WHERE id = $1
      RETURNING *;
    `;
    const { rows } = await pool.query(query, [req.id, req.fecha, req.persona, req.tipo, req.cuenta, req.descripcion, req.monto]);
    return rows[0] || null;
  },
  deleteOne: async (id) => {
    const query = `
      DELETE FROM movimientos
      WHERE id = $1
      RETURNING *;
    `;
    const { rows } = await pool.query(query, [id]);

    return rows[0] || null;
  }
};

export default MovementModel;