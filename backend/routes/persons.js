import { Router } from 'express';
import PersonaController from '../controllers/persons.js';

const router = Router();

router.get('/', PersonaController.getAll);

export default router;
