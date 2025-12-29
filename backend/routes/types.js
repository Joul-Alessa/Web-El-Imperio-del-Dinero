import { Router } from 'express';
import TypeController from '../controllers/types.js';

const router = Router();

router.get('/', TypeController.getAll);

export default router;
