import User from '../models/User.js';

// @desc    Search users by email or name
// @route   GET /api/users
// @access  Private
export const searchUsers = async (req, res) => {
  try {
    const { search } = req.query;
    const currentUserId = req.user._id;

    // Build search query
    let query = { _id: { $ne: currentUserId } }; // Exclude current user

    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i'); // Case-insensitive search
      query.$or = [
        { email: searchRegex },
        { name: searchRegex },
      ];
    }

    // Get users (limit to 20 for performance)
    const users = await User.find(query)
      .select('_id email name')
      .limit(20)
      .sort({ email: 1 });

    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};
