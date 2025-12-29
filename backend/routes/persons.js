import { Router } from 'express';
import PersonController from '../controllers/persons.js';

const router = Router();

router.get('/', PersonController.getAll);

export default router;
