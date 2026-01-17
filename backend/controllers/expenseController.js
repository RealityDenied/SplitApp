import Expense from '../models/Expense.js';
import Group from '../models/Group.js';
import { validationResult } from 'express-validator';
import {
  calculateEqualSplits,
  validateCustomSplits,
  validatePercentageSplits,
  calculatePercentageSplits,
} from '../utils/expenseCalculator.js';

// @desc    Get all expenses for a group with search and filters
// @route   GET /api/groups/:groupId/expenses
// @access  Private
export const getExpenses = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user._id;
    const { 
      search, 
      participant, 
      dateFrom, 
      dateTo, 
      amountMin, 
      amountMax 
    } = req.query;

    // Verify user has access to the group
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    if (!group.isUserInGroup(userId.toString())) {
      return res.status(403).json({ message: 'Not authorized to access this group' });
    }

    // Build query
    const query = { group: groupId };

    // Search by text (description)
    if (search && search.trim()) {
      query.description = { $regex: search.trim(), $options: 'i' };
    }

    // Filter by participant (payer or in splits)
    if (participant) {
      query.$or = [
        { payer: participant },
        { 'splits.participant': participant }
      ];
    }

    // Filter by date range
    if (dateFrom || dateTo) {
      query.date = {};
      if (dateFrom) {
        query.date.$gte = new Date(dateFrom);
      }
      if (dateTo) {
        // Include the entire day
        const endDate = new Date(dateTo);
        endDate.setHours(23, 59, 59, 999);
        query.date.$lte = endDate;
      }
    }

    // Filter by amount range
    if (amountMin || amountMax) {
      query.amount = {};
      if (amountMin) {
        query.amount.$gte = parseFloat(amountMin);
      }
      if (amountMax) {
        query.amount.$lte = parseFloat(amountMax);
      }
    }

    // Get expenses for the group
    const expenses = await Expense.find(query)
      .populate('payer', 'name email')
      .populate('splits.participant', 'name email')
      .sort({ date: -1, createdAt: -1 });

    res.json(expenses);
  } catch (error) {
    console.error(error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Group not found' });
    }
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Create a new expense
// @route   POST /api/expenses
// @access  Private
export const createExpense = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { group, amount, description, date, payer, splitMode, participants } = req.body;
    const userId = req.user._id;

    // Verify group exists and user has access
    const groupDoc = await Group.findById(group);
    if (!groupDoc) {
      return res.status(404).json({ message: 'Group not found' });
    }

    if (!groupDoc.isUserInGroup(userId.toString())) {
      return res.status(403).json({ message: 'Not authorized to create expenses in this group' });
    }

    // Verify payer is in the group
    const payerIdStr = payer.toString();
    if (!groupDoc.isUserInGroup(payerIdStr)) {
      return res.status(400).json({ message: 'Payer must be a member of the group' });
    }

    // Get all user IDs in the group (creator + participants)
    const allUserIds = groupDoc.getAllUsers().map(u => u.toString());

    // Validate and calculate splits based on split mode
    let splits = [];

    if (splitMode === 'equal') {
      // Validate participants are in the group
      const participantIds = participants || [];
      const invalidParticipants = participantIds.filter(
        id => !allUserIds.includes(id.toString())
      );
      
      if (invalidParticipants.length > 0) {
        return res.status(400).json({ message: 'All participants must be members of the group' });
      }

      if (participantIds.length === 0) {
        return res.status(400).json({ message: 'At least one participant is required' });
      }

      splits = calculateEqualSplits(amount, participantIds);
    } else if (splitMode === 'custom') {
      // Validate custom splits
      const customSplits = participants || [];
      
      if (customSplits.length === 0) {
        return res.status(400).json({ message: 'At least one participant is required' });
      }

      // Validate all participants are in group and amounts are valid
      for (const split of customSplits) {
        if (!allUserIds.includes(split.participant.toString())) {
          return res.status(400).json({ message: 'All participants must be members of the group' });
        }
        if (!split.amount || split.amount <= 0) {
          return res.status(400).json({ message: 'All split amounts must be greater than 0' });
        }
      }

      const validation = validateCustomSplits(amount, customSplits);
      if (!validation.valid) {
        return res.status(400).json({ message: validation.message });
      }

      splits = customSplits.map(s => ({
        participant: s.participant,
        amount: s.amount,
      }));
    } else if (splitMode === 'percentage') {
      // Validate percentage splits
      const percentageSplits = participants || [];
      
      if (percentageSplits.length === 0) {
        return res.status(400).json({ message: 'At least one participant is required' });
      }

      // Validate all participants are in group and percentages are valid
      for (const split of percentageSplits) {
        if (!allUserIds.includes(split.participant.toString())) {
          return res.status(400).json({ message: 'All participants must be members of the group' });
        }
        if (!split.percentage || split.percentage <= 0 || split.percentage > 100) {
          return res.status(400).json({ message: 'All percentages must be between 0 and 100' });
        }
      }

      const validation = validatePercentageSplits(percentageSplits);
      if (!validation.valid) {
        return res.status(400).json({ message: validation.message });
      }

      splits = calculatePercentageSplits(amount, percentageSplits);
    } else {
      return res.status(400).json({ message: 'Invalid split mode' });
    }

    // Create expense
    const expense = await Expense.create({
      group,
      amount,
      description,
      date: date || new Date(),
      payer,
      splitMode,
      splits,
    });

    const populatedExpense = await Expense.findById(expense._id)
      .populate('payer', 'name email')
      .populate('splits.participant', 'name email');

    res.status(201).json(populatedExpense);
  } catch (error) {
    console.error(error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update an expense
// @route   PUT /api/expenses/:id
// @access  Private
export const updateExpense = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const expense = await Expense.findById(req.params.id).populate('group');

    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    // Verify user has access to the group
    if (!expense.group.isUserInGroup(req.user._id.toString())) {
      return res.status(403).json({ message: 'Not authorized to update this expense' });
    }

    const { amount, description, date, payer, splitMode, participants } = req.body;

    // Get group for validation
    const groupDoc = await Group.findById(expense.group._id || expense.group);
    const allUserIds = groupDoc.getAllUsers().map(u => u.toString());

    // Update fields if provided
    if (amount !== undefined) expense.amount = amount;
    if (description !== undefined) expense.description = description;
    if (date !== undefined) expense.date = date;
    if (payer !== undefined) {
      if (!groupDoc.isUserInGroup(payer.toString())) {
        return res.status(400).json({ message: 'Payer must be a member of the group' });
      }
      expense.payer = payer;
    }

    // Recalculate splits if split mode or participants changed
    if (splitMode !== undefined || participants !== undefined) {
      const finalSplitMode = splitMode || expense.splitMode;
      const finalParticipants = participants || expense.splits.map(s => ({
        participant: s.participant,
        amount: s.amount,
        percentage: s.percentage,
      }));
      const finalAmount = amount !== undefined ? amount : expense.amount;

      let splits = [];

      if (finalSplitMode === 'equal') {
        const participantIds = finalParticipants.map(p => p.participant || p);
        if (participantIds.some(id => !allUserIds.includes(id.toString()))) {
          return res.status(400).json({ message: 'All participants must be members of the group' });
        }
        splits = calculateEqualSplits(finalAmount, participantIds);
        expense.splitMode = 'equal';
      } else if (finalSplitMode === 'custom') {
        const validation = validateCustomSplits(finalAmount, finalParticipants);
        if (!validation.valid) {
          return res.status(400).json({ message: validation.message });
        }
        splits = finalParticipants.map(s => ({
          participant: s.participant || s,
          amount: s.amount,
        }));
        expense.splitMode = 'custom';
      } else if (finalSplitMode === 'percentage') {
        const validation = validatePercentageSplits(finalParticipants);
        if (!validation.valid) {
          return res.status(400).json({ message: validation.message });
        }
        splits = calculatePercentageSplits(finalAmount, finalParticipants);
        expense.splitMode = 'percentage';
      }

      expense.splits = splits;
    }

    const updatedExpense = await expense.save();

    const populatedExpense = await Expense.findById(updatedExpense._id)
      .populate('payer', 'name email')
      .populate('splits.participant', 'name email');

    res.json(populatedExpense);
  } catch (error) {
    console.error(error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Expense not found' });
    }
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete an expense
// @route   DELETE /api/expenses/:id
// @access  Private
export const deleteExpense = async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id).populate('group');

    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    // Verify user has access to the group
    if (!expense.group.isUserInGroup(req.user._id.toString())) {
      return res.status(403).json({ message: 'Not authorized to delete this expense' });
    }

    await Expense.findByIdAndDelete(req.params.id);

    res.json({ message: 'Expense deleted successfully' });
  } catch (error) {
    console.error(error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Expense not found' });
    }
    res.status(500).json({ message: 'Server error' });
  }
};
