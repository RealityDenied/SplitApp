import { useState } from 'react';
import api from '../services/api';

const CreateGroupModal = ({ isOpen, onClose, onGroupCreated }) => {
  const [name, setName] = useState('');
  const [participants, setParticipants] = useState([]);
  const [participantEmail, setParticipantEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAddParticipant = () => {
    if (participants.length >= 3) {
      setError('Maximum 3 participants allowed (plus you = 4 total)');
      return;
    }

    if (!participantEmail.trim()) {
      setError('Please enter an email');
      return;
    }

    // For now, we'll just store the email
    // In a real app, you'd search for users by email
    // For now, we'll create participant objects with email (backend will need to handle this)
    const newParticipant = {
      email: participantEmail.trim(),
      name: participantEmail.trim().split('@')[0],
      color: `#${Math.floor(Math.random()*16777215).toString(16)}`, // Random color
    };

    setParticipants([...participants, newParticipant]);
    setParticipantEmail('');
    setError('');
  };

  const handleRemoveParticipant = (index) => {
    setParticipants(participants.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Note: Backend expects participants with user IDs, not emails
      // For now, we'll send participants as empty array or handle user lookup
      // This is a simplified version - you might want to add user search functionality later
      const groupData = {
        name,
        participants: [], // Empty for now - we'll add user lookup later
      };

      const response = await api.post('/groups', groupData);
      onGroupCreated(response.data);
      handleClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create group');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setName('');
    setParticipants([]);
    setParticipantEmail('');
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Create New Group</h2>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="groupName" className="block text-sm font-medium text-gray-700 mb-1">
              Group Name
            </label>
            <input
              id="groupName"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter group name"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Participants (Optional - Max 3)
            </label>
            <p className="text-xs text-gray-500 mb-2">
              You can add participants later when editing the group
            </p>
            {/* For now, we'll skip adding participants during creation */}
            {/* This will be enhanced in Phase 3 when we add participant management */}
          </div>

          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Group'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateGroupModal;
