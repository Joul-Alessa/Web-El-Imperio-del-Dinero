import pool from '../startup/db.js';

const AccountModel = {
  findAll: async () => {
    const query = `
      SELECT *
      FROM cuentas
      ORDER BY id;
    `;
    const { rows } = await pool.query(query);
    return rows;
  }
};

export default AccountModel;