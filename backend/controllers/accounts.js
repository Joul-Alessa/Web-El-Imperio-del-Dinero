import AccountModel from '../models/accounts.js';
import pool from '../startup/db.js';

const AccountController = {
  create: async (req, res) => {
    try {
      const body = req.body;

      if(body["nombre"] == null) {
        res.status(400).json({
          message: 'Nombre de la cuenta inválido'
        });
        return;
      }

      const query = `
        INSERT INTO cuentas (nombre)
        VALUES ($1)
        RETURNING *;
      `;

      const values = [body["nombre"]];
      const { rows } = await pool.query(query, values);
      res.status(201).json({
        message: 'Cuenta creada correctamente',
        data: rows[0]
      });
      return;
    } catch (error) {
      console.error(error);
      res.status(500).json({
        message: 'La cuenta no pudo ser creada'
      });
    }
  },
  getAll: async (req, res) => {
    try {
      const accounts = await AccountModel.findAll();
      res.status(200).json(accounts);
    } catch (error) {
      console.error(error);
      res.status(500).json({
        message: 'Error al obtener cuentas'
      });
    }
  },
  getOne: async (req, res) => {
    try {
      res.status(503).json({
        message: 'Servicio aún no disponible'
      });
      return;
      
      const accounts = await AccountModel.findAll();
      res.status(200).json(accounts);
    } catch (error) {
      console.error(error);
      res.status(500).json({
        message: 'Error al obtener cuentas'
      });
    }
  },
  update: async (req, res) => {
    try {
      res.status(503).json({
        message: 'Servicio aún no disponible'
      });
      return;
      
      const accounts = await AccountModel.findAll();
      res.status(200).json(accounts);
    } catch (error) {
      console.error(error);
      res.status(500).json({
        message: 'Error al obtener cuentas'
      });
    }
  },
  delete: async (req, res) => {
    try {
      res.status(503).json({
        message: 'Servicio aún no disponible'
      });
      return;
      
      const accounts = await AccountModel.findAll();
      res.status(200).json(accounts);
    } catch (error) {
      console.error(error);
      res.status(500).json({
        message: 'Error al obtener cuentas'
      });
    }
  }
};

export default AccountController;