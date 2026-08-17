import PersonModel from '../models/persons.js';

const PersonController = {
  getAll: async (req, res) => {
    try {
      const persons = await PersonModel.findAll();
      res.status(200).json(persons);
    } catch (error) {
      console.error(error);
      res.status(500).json({
        message: 'Error al obtener personas'
      });
    }
  }
};

export default PersonController;