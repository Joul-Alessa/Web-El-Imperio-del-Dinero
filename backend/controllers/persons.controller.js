import PersonaModel from '../models/persons.model.js';

const PersonaController = {
  getAll: async (req, res) => {
    try {
      console.log("aaaaaa");
      const personas = await PersonaModel.findAll();
      res.status(200).json(personas);
    } catch (error) {
      console.error(error);
      res.status(500).json({
        message: 'Error al obtener personas'
      });
    }
  }
};

export default PersonaController;