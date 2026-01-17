import mongoose from 'mongoose';

const participantSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  name: {
    type: String,
    trim: true,
  },
  color: {
    type: String,
    default: '#3B82F6', // Default blue color
  },
  avatar: {
    type: String,
    default: null,
  },
}, { _id: false });

const groupSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Group name is required'],
      trim: true,
      maxlength: [100, 'Group name cannot exceed 100 characters'],
    },
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    participants: {
      type: [participantSchema],
      validate: {
        validator: function (participants) {
          // Max 3 participants (creator is always included separately in the total count)
          // Actually, creator + max 3 other participants = 4 total
          // But we store creator separately, so max 3 in participants array
          return participants.length <= 3;
        },
        message: 'A group can have a maximum of 3 participants (plus the creator = 4 total)',
      },
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
groupSchema.index({ creator: 1 });
groupSchema.index({ 'participants.user': 1 });

// Method to get all users in the group (creator + participants)
groupSchema.methods.getAllUsers = function () {
  return [this.creator, ...this.participants.map(p => p.user)];
};

// Method to check if a user is in the group
// Handles both populated and non-populated references
groupSchema.methods.isUserInGroup = function (userId) {
  const userIdStr = userId.toString();
  
  // Check creator (handles both ObjectId and populated object)
  const creatorId = this.creator._id ? this.creator._id.toString() : this.creator.toString();
  if (creatorId === userIdStr) {
    return true;
  }
  
  // Check participants (handles both ObjectId and populated object)
  return this.participants.some(p => {
    const participantId = p.user._id ? p.user._id.toString() : p.user.toString();
    return participantId === userIdStr;
  });
};

const Group = mongoose.model('Group', groupSchema);

export default Group;
