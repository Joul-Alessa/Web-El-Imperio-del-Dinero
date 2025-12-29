import TypeModel from '../models/types.js';

const TypeController = {
  getAll: async (req, res) => {
    try {
      const types = await TypeModel.findAll();
      res.status(200).json(types);
    } catch (error) {
      console.error(error);
      res.status(500).json({
        message: 'Error al obtener tipos'
      });
    }
  }
};

export default TypeController;