import { Router } from 'express';
import PersonaController from '../controllers/persons.controller.js';

const router = Router();

router.get('/', PersonaController.getAll);

export default router;
