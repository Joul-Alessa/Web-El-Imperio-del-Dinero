import { Router } from 'express';
import MovementController from '../controllers/movements.js';

const router = Router();

router.post('/', MovementController.create);
router.post('/query', MovementController.getAll);
router.get('/:id', MovementController.getOne);
router.put('/:id', MovementController.update);
router.delete('/:id', MovementController.delete);

export default router;
