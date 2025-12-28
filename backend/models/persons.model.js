import pool from '../startup/db.js';

const PersonaModel = {
  findAll: async () => {
    const query = `
      SELECT *
      FROM personas
      ORDER BY id;
    `;
    const { rows } = await pool.query(query);
    return rows;
  }
};

export default PersonaModel;