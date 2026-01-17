import Group from '../models/Group.js';
import Expense from '../models/Expense.js';
import { calculateNetBalances } from '../utils/balanceCalculator.js';

// @desc    Get dashboard summary for logged-in user
// @route   GET /api/dashboard/summary
// @access  Private
export const getDashboardSummary = async (req, res) => {
  try {
    const userId = req.user._id;

    // Get all groups where user is creator or participant
    const groups = await Group.find({
      $or: [
        { creator: userId },
        { 'participants.user': userId }
      ]
    });

    let totalSpent = 0;
    let totalOwedToUser = 0;
    let totalUserOwes = 0;

    // Process each group
    for (const group of groups) {
      // Get all expenses in this group
      const expenses = await Expense.find({ group: group._id })
        .populate('payer', 'name email')
        .populate('splits.participant', 'name email');

      if (expenses.length === 0) continue;

      // Get all user IDs in the group
      const allUserIds = group.getAllUsers().map(u => {
        const uid = u._id ? u._id.toString() : u.toString();
        return uid;
      });

      // Calculate net balances
      const netBalances = calculateNetBalances(expenses, allUserIds);
      const userBalance = netBalances[userId.toString()] || 0;

      // Calculate total spent by user in this group (if they paid)
      const userExpenses = expenses.filter(e => {
        const payerId = e.payer._id ? e.payer._id.toString() : e.payer.toString();
        return payerId === userId.toString();
      });
      const groupSpent = userExpenses.reduce((sum, e) => sum + e.amount, 0);
      totalSpent += groupSpent;

      // User's net balance: positive = others owe them, negative = they owe others
      if (userBalance > 0) {
        totalOwedToUser += userBalance;
      } else {
        totalUserOwes += Math.abs(userBalance);
      }
    }

    res.json({
      totalSpent: Math.round(totalSpent * 100) / 100,
      totalOwedToUser: Math.round(totalOwedToUser * 100) / 100,
      totalUserOwes: Math.round(totalUserOwes * 100) / 100,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};
