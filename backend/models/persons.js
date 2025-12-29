import pool from '../startup/db.js';

const PersonModel = {
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

export default PersonModel;