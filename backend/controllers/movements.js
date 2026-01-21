import MovementModel from '../models/movements.js';

const MovementController = {
  create: async (req, res) => {
    try {
      const movement = req.body;

      // Espacio para validar el payload

      console.log(movement);

      const movements = await MovementModel.create(movement);
      
      return res.status(201).json({
        message: 'Movimiento registrado correctamente',
        data: movements
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        message: 'El movimiento no pudo ser registrado'
      });
    }
  },
  getAll: async (req, res) => {
    try {
      const movements = await MovementModel.findAll();
      return res.status(200).json(movements);
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        message: 'Error al obtener movimientos'
      });
    }
  },
  getOne: async (req, res) => {
    try {
      const { id } = req.params;

      if(id == null) {
        return res.status(400).json({
          message: 'Identificador del movimiento inválido'
        });
      }

      const idNumber = Number(id);

      if (!Number.isInteger(idNumber) || idNumber <= 0) {
        return res.status(400).json({
          message: "El identificador debe ser un número entero positivo"
        });
      }
      
      const movements = await MovementModel.findOne(id);

      if(movements != null) {
        return res.status(200).json(movements);
      }

      return res.status(204).json({
        message: 'Movimiento no encontrado'
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        message: 'Error al obtener el movimiento'
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

      // Espacio para validar el payload
      
      const movements = await MovementModel.updateOne({
        id: id,
        fecha: req.body.fecha,
        persona: req.body.persona,
        tipo: req.body.tipo,
        cuenta: req.body.cuenta,
        descripcion: req.body.descripcion,
        monto: req.body.monto
      });

      if(movements == null) {
        return res.status(400).json({
          message: 'No se modificó ningún movimiento. No se encontró el movimiento'
        });
      }

      return res.status(200).json(movements);
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        message: 'Error al obtener movimientos'
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

      const movements = await MovementModel.deleteOne(id);

      if(movements == null) {
        return res.status(400).json({
          message: 'No se eliminó ningún movimiento. No se encontró el movimiento'
        });
      }

      return res.status(200).json(movements);
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        message: 'Error al obtener movimientos'
      });
    }
  }
};

export default MovementController;