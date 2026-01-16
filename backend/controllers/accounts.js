import AccountModel from '../models/accounts.js';
import pool from '../startup/db.js';

const AccountController = {
  create: async (req, res) => {
    try {
      const { nombre } = req.body;

      if(nombre == null) {
        return res.status(400).json({
          message: 'Nombre de la cuenta inválido'
        });
      }

      const accounts = await AccountModel.create(nombre);
      
      return res.status(201).json({
        message: 'Cuenta creada correctamente',
        data: accounts
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        message: 'La cuenta no pudo ser creada'
      });
    }
  },
  getAll: async (req, res) => {
    try {
      const accounts = await AccountModel.findAll();
      return res.status(200).json(accounts);
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        message: 'Error al obtener cuentas'
      });
    }
  },
  getOne: async (req, res) => {
    try {
      const { id } = req.params;

      if(id == null) {
        return res.status(400).json({
          message: 'Identificador de la cuenta inválido'
        });
      }

      const idNumber = Number(id);

      if (!Number.isInteger(idNumber) || idNumber <= 0) {
        return res.status(400).json({
          message: "El identificador debe ser un número entero positivo"
        });
      }
      
      const accounts = await AccountModel.findOne(id);

      if(accounts != null) {
        return res.status(200).json(accounts);
      }

      return res.status(204).json({
        message: 'Cuenta no encontrada'
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        message: 'Error al obtener la cuenta'
      });
    }
  },
  update: async (req, res) => {
    try {
      const { id } = req.params;
      const { nombre } = req.body;

      if(id == null) {
        return res.status(400).json({
          message: 'Identificador de la cuenta inválido'
        });
      }

      const idNumber = Number(id);

      if (!Number.isInteger(idNumber) || idNumber <= 0) {
        return res.status(400).json({
          message: "El identificador debe ser un número entero positivo"
        });
      }

      if(nombre == null) {
        return res.status(400).json({
          message: 'Nombre de la cuenta inválido'
        });
      }
      
      const accounts = await AccountModel.updateOne({
        id: id,
        nombre: nombre
      });

      if(accounts == null) {
        return res.status(400).json({
          message: 'No se modificó ninguna cuenta. No se encontró la cuenta'
        });
      }

      return res.status(200).json(accounts);
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        message: 'Error al obtener cuentas'
      });
    }
  },
  delete: async (req, res) => {
    try {
      const { id } = req.params;

      if(id == null) {
        return res.status(400).json({
          message: 'Identificador de la cuenta inválido'
        });
      }

      const idNumber = Number(id);

      if (!Number.isInteger(idNumber) || idNumber <= 0) {
        return res.status(400).json({
          message: "El identificador debe ser un número entero positivo"
        });
      }

      const accounts = await AccountModel.deleteOne(id);

      if(accounts == null) {
        return res.status(400).json({
          message: 'No se eliminó ninguna cuenta. No se encontró la cuenta'
        });
      }

      return res.status(200).json(accounts);
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        message: 'Error al obtener cuentas'
      });
    }
  }
};

export default AccountController;