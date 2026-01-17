import Group from '../models/Group.js';
import Expense from '../models/Expense.js';
import { calculateBalanceSummary } from '../utils/balanceCalculator.js';

// @desc    Get balance summary for a group
// @route   GET /api/groups/:id/balances
// @access  Private
export const getGroupBalances = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    // Get group and verify access
    const group = await Group.findById(id)
      .populate('creator', 'name email avatarSeed')
      .populate('participants.user', 'name email avatarSeed');

    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    if (!group.isUserInGroup(userId.toString())) {
      return res.status(403).json({ message: 'Not authorized to access this group' });
    }

    // Get all expenses for the group
    const expenses = await Expense.find({ group: id })
      .populate('payer', 'name email')
      .populate('splits.participant', 'name email');

    // Get all user IDs in the group (creator + participants)
    const allUserIds = group.getAllUsers().map(u => {
      const userId = u._id ? u._id.toString() : u.toString();
      return userId;
    });

    // Create user map for easier lookup
    const userMap = {};
    if (group.creator) {
      const creatorId = group.creator._id.toString();
      userMap[creatorId] = {
        _id: creatorId,
        name: group.creator.name,
        email: group.creator.email,
        avatarSeed: group.creator.avatarSeed,
      };
    }
    if (group.participants) {
      group.participants.forEach(p => {
        const participantId = p.user._id ? p.user._id.toString() : p.user.toString();
        userMap[participantId] = {
          _id: participantId,
          name: p.user.name || p.name,
          email: p.user.email,
        };
      });
    }

    // Calculate balance summary
    const balanceSummary = calculateBalanceSummary(expenses, allUserIds, userMap);

    // Format response with user details
    const formattedNetBalances = Object.entries(balanceSummary.netBalances).map(([userId, balance]) => ({
      user: userMap[userId] || { _id: userId, name: 'Unknown', email: '' },
      balance: Math.round(balance * 100) / 100, // Round to 2 decimals
    }));

    const formattedDirectional = balanceSummary.directionalBalances.map(b => ({
      from: userMap[b.from] || { _id: b.from, name: 'Unknown', email: '' },
      to: userMap[b.to] || { _id: b.to, name: 'Unknown', email: '' },
      amount: Math.round(b.amount * 100) / 100,
    }));

    const formattedSettlements = balanceSummary.settlements.map(s => ({
      from: userMap[s.from] || { _id: s.from, name: 'Unknown', email: '' },
      to: userMap[s.to] || { _id: s.to, name: 'Unknown', email: '' },
      amount: Math.round(s.amount * 100) / 100,
    }));

    res.json({
      netBalances: formattedNetBalances,
      directionalBalances: formattedDirectional,
      settlements: formattedSettlements,
      totalSpent: Math.round(balanceSummary.totalSpent * 100) / 100,
    });
  } catch (error) {
    console.error(error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Group not found' });
    }
    res.status(500).json({ message: 'Server error' });
  }
};
