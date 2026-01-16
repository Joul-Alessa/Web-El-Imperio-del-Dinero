import pool from '../startup/db.js';

const AccountModel = {
  create: async (req) => {
    const query = `
      INSERT INTO cuentas (nombre)
      VALUES ($1)
      RETURNING *;
    `;
    const { rows } = await pool.query(query, [req]);
    return rows[0] || null;
  },
  findAll: async () => {
    const query = `
      SELECT *
      FROM cuentas
      ORDER BY id;
    `;
    const { rows } = await pool.query(query);
    return rows;
  },
  findOne: async (id) => {
    const query = `
      SELECT *
      FROM cuentas
      WHERE id = $1
      ORDER BY id;
    `;
    const { rows } = await pool.query(query, [id]);
    return rows[0] || null;
  },
  updateOne: async (req) => {
    const query = `
      UPDATE cuentas
      SET nombre = $2
      WHERE id = $1;
    `;
    await pool.query(query, [req.id, req.nombre]);

    const queryReturn = `
      SELECT *
      FROM cuentas
      WHERE id = $1
      ORDER BY id;
    `;
    const { rows } = await pool.query(queryReturn, [req.id]);
    return rows[0] || null;
  },
  deleteOne: async (id) => {
    const queryReturn = `
      SELECT *
      FROM cuentas
      WHERE id = $1
      ORDER BY id;
    `;
    const { rows } = await pool.query(queryReturn, [id]);
    
    const query = `
      DELETE FROM cuentas
      WHERE id = $1;
    `;
    await pool.query(query, [id]);

    return rows[0] || null;
  },
};

export default AccountModel;