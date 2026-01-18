import Group from '../models/Group.js';
import Expense from '../models/Expense.js';
import { validationResult } from 'express-validator';
import {
  calculateEqualSplits,
  calculatePercentageSplits,
} from '../utils/expenseCalculator.js';

// @desc    Get all groups for the logged-in user
// @route   GET /api/groups
// @access  Private
export const getGroups = async (req, res) => {
  try {
    const userId = req.user._id;

    // Get groups where user is creator or participant
    const groups = await Group.find({
      $or: [
        { creator: userId },
        { 'participants.user': userId }
      ]
    })
      .populate('creator', 'name email avatarSeed')
      .populate('participants.user', 'name email avatarSeed')
      .sort({ updatedAt: -1 });

    res.json(groups);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get a single group by ID
// @route   GET /api/groups/:id
// @access  Private
export const getGroup = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id)
      .populate('creator', 'name email avatarSeed')
      .populate('participants.user', 'name email avatarSeed');

    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // Check if user has access to this group
    if (!group.isUserInGroup(req.user._id.toString())) {
      return res.status(403).json({ message: 'Not authorized to access this group' });
    }

    res.json(group);
  } catch (error) {
    console.error(error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Group not found' });
    }
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Create a new group
// @route   POST /api/groups
// @access  Private
export const createGroup = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, participants } = req.body;
    const userId = req.user._id;

    // Validate participant count
    const participantArray = participants || [];
    if (participantArray.length > 3) {
      return res.status(400).json({ 
        message: 'A group can have a maximum of 3 participants (plus the creator = 4 total)' 
      });
    }

    // Ensure creator is not in participants list
    const filteredParticipants = participantArray.filter(
      p => p.user && p.user.toString() !== userId.toString()
    );

    // Create group
    const group = await Group.create({
      name,
      creator: userId,
      participants: filteredParticipants,
    });

    const populatedGroup = await Group.findById(group._id)
      .populate('creator', 'name email avatarSeed')
      .populate('participants.user', 'name email avatarSeed');

    res.status(201).json(populatedGroup);
  } catch (error) {
    console.error(error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update a group
// @route   PUT /api/groups/:id
// @access  Private (creator only)
export const updateGroup = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const group = await Group.findById(req.params.id);

    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // Check if user is the creator
    if (group.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the group creator can update the group' });
    }

    const { name, participants } = req.body;

    // Validate participant count
    if (participants && participants.length > 3) {
      return res.status(400).json({ 
        message: 'A group can have a maximum of 3 participants (plus the creator = 4 total)' 
      });
    }

    // If updating participants, cascade expenses for removed participants
    if (participants !== undefined) {
      const currentParticipantIds = group.participants.map(p => p.user.toString());
      const newParticipantIds = participants
        .filter(p => p.user)
        .map(p => p.user.toString());
      
      // Find removed participants
      const removedParticipantIds = currentParticipantIds.filter(
        id => !newParticipantIds.includes(id)
      );

      // Cascade expenses for removed participants
      if (removedParticipantIds.length > 0) {
        // Get all remaining user IDs (creator + remaining participants)
        const remainingUserIds = [group.creator.toString(), ...newParticipantIds];
        
        // Find a replacement user (prefer creator, then first participant)
        const replacementUserId = group.creator.toString() || (newParticipantIds.length > 0 ? newParticipantIds[0] : null);
        
        if (!replacementUserId || remainingUserIds.length === 0) {
          return res.status(400).json({
            message: 'Cannot remove participant: at least one member must remain in the group.',
          });
        }

        for (const removedId of removedParticipantIds) {
          // Find all expenses where removed participant is involved
          const affectedExpenses = await Expense.find({
            group: group._id,
            $or: [
              { payer: removedId },
              { 'splits.participant': removedId }
            ]
          });

          // Update each affected expense
          for (const expense of affectedExpenses) {
            // Remove participant from splits
            const remainingSplits = expense.splits.filter(
              split => split.participant.toString() !== removedId
            );

            // If no one left to split with, delete the expense
            if (remainingSplits.length === 0) {
              await Expense.findByIdAndDelete(expense._id);
              continue;
            }

            // If removed participant was the payer, reassign to replacement
            if (expense.payer.toString() === removedId) {
              expense.payer = replacementUserId;
            }

            // Recalculate splits based on split mode
            if (expense.splitMode === 'equal') {
              // Recalculate equal splits among remaining participants
              const remainingParticipantIds = remainingSplits.map(s => s.participant.toString());
              expense.splits = calculateEqualSplits(expense.amount, remainingParticipantIds);
            } else if (expense.splitMode === 'custom') {
              // Redistribute removed participant's amount equally among remaining participants
              const removedSplit = expense.splits.find(
                split => split.participant.toString() === removedId
              );
              
              if (removedSplit) {
                const removedAmount = removedSplit.amount || 0;
                const redistributionPerPerson = removedAmount / remainingSplits.length;
                
                expense.splits = remainingSplits.map(split => ({
                  participant: split.participant,
                  amount: (split.amount || 0) + redistributionPerPerson,
                }));
              } else {
                expense.splits = remainingSplits.map(s => ({
                  participant: s.participant,
                  amount: s.amount,
                }));
              }
            } else if (expense.splitMode === 'percentage') {
              // Remove their percentage and recalculate percentages for remaining participants
              const removedSplit = expense.splits.find(
                split => split.participant.toString() === removedId
              );
              
              if (removedSplit) {
                const removedPercentage = removedSplit.percentage || 0;
                const remainingPercentage = 100 - removedPercentage;
                
                // Redistribute the removed percentage proportionally among remaining participants
                const remainingTotalPercentage = remainingSplits.reduce(
                  (sum, s) => sum + (s.percentage || 0), 
                  0
                );
                
                // Calculate new percentages - redistribute proportionally
                let updatedPercentageSplits;
                if (remainingTotalPercentage > 0 && remainingTotalPercentage <= 100) {
                  // Redistribute proportionally based on their current percentage share
                  updatedPercentageSplits = remainingSplits.map(split => {
                    const oldPercentage = split.percentage || 0;
                    // Scale up each percentage to use the full 100%
                    const newPercentage = (oldPercentage / remainingTotalPercentage) * 100;
                    
                    return {
                      participant: split.participant,
                      percentage: newPercentage,
                    };
                  });
                } else {
                  // If percentages don't make sense, distribute equally
                  updatedPercentageSplits = remainingSplits.map(split => ({
                    participant: split.participant,
                    percentage: 100 / remainingSplits.length,
                  }));
                }
                
                expense.splits = calculatePercentageSplits(expense.amount, updatedPercentageSplits);
              } else {
                expense.splits = remainingSplits.map(s => ({
                  participant: s.participant,
                  amount: s.amount,
                  percentage: s.percentage,
                }));
              }
            }

            await expense.save();
          }
        }
      }

      // Filter out creator from participants
      const filteredParticipants = participants.filter(
        p => p.user && p.user.toString() !== group.creator.toString()
      );
      group.participants = filteredParticipants;
    }

    // Update fields
    if (name !== undefined) {
      group.name = name;
    }

    const updatedGroup = await group.save();

    const populatedGroup = await Group.findById(updatedGroup._id)
      .populate('creator', 'name email')
      .populate('participants.user', 'name email');

    res.json(populatedGroup);
  } catch (error) {
    console.error(error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message });
    }
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Group not found' });
    }
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete a group
// @route   DELETE /api/groups/:id
// @access  Private (creator only)
export const deleteGroup = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);

    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // Check if user is the creator
    if (group.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the group creator can delete the group' });
    }

    // Cascade delete: Delete all expenses in this group
    await Expense.deleteMany({ group: group._id });

    // Delete the group
    await Group.findByIdAndDelete(req.params.id);

    res.json({ message: 'Group deleted successfully' });
  } catch (error) {
    console.error(error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Group not found' });
    }
    res.status(500).json({ message: 'Server error' });
  }
};
