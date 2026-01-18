import Group from '../models/Group.js';
import Expense from '../models/Expense.js';
import { validationResult } from 'express-validator';

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

    // If updating participants, check if any removed participant has expenses
    if (participants !== undefined) {
      const currentParticipantIds = group.participants.map(p => p.user.toString());
      const newParticipantIds = participants
        .filter(p => p.user)
        .map(p => p.user.toString());
      
      // Find removed participants
      const removedParticipantIds = currentParticipantIds.filter(
        id => !newParticipantIds.includes(id)
      );

      // Check if any removed participant has expenses
      if (removedParticipantIds.length > 0) {
        for (const removedId of removedParticipantIds) {
          const hasExpenses = await Expense.findOne({
            group: group._id,
            $or: [
              { payer: removedId },
              { 'splits.participant': removedId }
            ]
          });

          if (hasExpenses) {
            return res.status(400).json({
              message: 'Cannot remove participant who has expenses in this group. Please delete their expenses first.',
            });
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
