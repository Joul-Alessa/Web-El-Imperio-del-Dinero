import pool from '../startup/db.js';

const TypeModel = {
  findAll: async () => {
    const query = `
      SELECT *
      FROM tipos
      ORDER BY id;
    `;
    const { rows } = await pool.query(query);
    return rows;
  }
};

export default TypeModel;