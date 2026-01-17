import express from 'express';
import {
  getExpenses,
  createExpense,
  updateExpense,
  deleteExpense,
} from '../controllers/expenseController.js';
import { protect } from '../middleware/auth.js';
import { body } from 'express-validator';

const router = express.Router();

// All routes are protected
router.use(protect);

// Validation rules
const createExpenseValidation = [
  body('group').isMongoId().withMessage('Valid group ID is required'),
  body('amount')
    .isFloat({ min: 0.01 })
    .withMessage('Amount must be a positive number greater than 0'),
  body('description')
    .trim()
    .notEmpty()
    .withMessage('Description is required'),
  body('date').optional().isISO8601().toDate().withMessage('Valid date is required'),
  body('payer').isMongoId().withMessage('Valid payer ID is required'),
  body('splitMode')
    .isIn(['equal', 'custom', 'percentage'])
    .withMessage('Split mode must be equal, custom, or percentage'),
  body('participants')
    .isArray({ min: 1 })
    .withMessage('At least one participant is required'),
];

const updateExpenseValidation = [
  body('amount')
    .optional()
    .isFloat({ min: 0.01 })
    .withMessage('Amount must be a positive number greater than 0'),
  body('description').optional().trim().notEmpty().withMessage('Description cannot be empty'),
  body('date').optional().isISO8601().toDate().withMessage('Valid date is required'),
  body('payer').optional().isMongoId().withMessage('Valid payer ID is required'),
  body('splitMode')
    .optional()
    .isIn(['equal', 'custom', 'percentage'])
    .withMessage('Split mode must be equal, custom, or percentage'),
];

// Routes
router.get('/groups/:groupId/expenses', getExpenses);
router.post('/', createExpenseValidation, createExpense);
router.put('/:id', updateExpenseValidation, updateExpense);
router.delete('/:id', deleteExpense);

export default router;
