import { Router } from 'express';
import AccountController from '../controllers/accounts.js';

const router = Router();

router.post('/', AccountController.create);
router.get('/', AccountController.getAll);
router.get('/:id', AccountController.getOne);
router.put('/:id', AccountController.update);
router.delete('/:id', AccountController.delete);

export default router;
