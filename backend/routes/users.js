import express from 'express';
import { searchUsers, updateAvatar } from '../controllers/userController.js';
import { protect } from '../middleware/auth.js';
import { body } from 'express-validator';

const router = express.Router();

// All routes are protected
router.use(protect);

router.get('/', searchUsers);

router.put(
  '/avatar',
  [body('avatarSeed').trim().notEmpty().withMessage('Avatar seed is required')],
  updateAvatar
);

export default router;
