import express from 'express';
import {
  getGroups,
  getGroup,
  createGroup,
  updateGroup,
  deleteGroup,
} from '../controllers/groupController.js';
import { getGroupBalances } from '../controllers/balanceController.js';
import { protect } from '../middleware/auth.js';
import { body } from 'express-validator';

const router = express.Router();

// All routes are protected
router.use(protect);

// Validation rules
const createGroupValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Group name is required')
    .isLength({ max: 100 })
    .withMessage('Group name cannot exceed 100 characters'),
  body('participants')
    .optional()
    .isArray()
    .withMessage('Participants must be an array')
    .custom((participants) => {
      if (participants && participants.length > 3) {
        throw new Error('Maximum 3 participants allowed (plus creator = 4 total)');
      }
      return true;
    }),
  body('participants.*.user')
    .optional()
    .isMongoId()
    .withMessage('Invalid participant user ID'),
  body('participants.*.name').optional().trim(),
  body('participants.*.color').optional().isString(),
];

const updateGroupValidation = [
  body('name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Group name cannot be empty')
    .isLength({ max: 100 })
    .withMessage('Group name cannot exceed 100 characters'),
  body('participants')
    .optional()
    .isArray()
    .withMessage('Participants must be an array')
    .custom((participants) => {
      if (participants && participants.length > 3) {
        throw new Error('Maximum 3 participants allowed (plus creator = 4 total)');
      }
      return true;
    }),
];

router
  .route('/')
  .get(getGroups)
  .post(createGroupValidation, createGroup);

router
  .route('/:id')
  .get(getGroup)
  .put(updateGroupValidation, updateGroup)
  .delete(deleteGroup);

router.get('/:id/balances', getGroupBalances);

export default router;
