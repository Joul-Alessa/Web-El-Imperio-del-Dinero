import pool from '../startup/db.js';

const MovementModel = {
  findAll: async () => {
    const query = `
      SELECT *
      FROM movimietos
      ORDER BY id;
    `;
    const { rows } = await pool.query(query);
    return rows;
  }
};

export default MovementModel;