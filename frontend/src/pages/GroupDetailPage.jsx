import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import UserDropdown from '../components/UserDropdown';
import ExpenseForm from '../components/ExpenseForm';
import ExpenseList from '../components/ExpenseList';
import BalanceSummary from '../components/BalanceSummary';
import ExpenseFilters from '../components/ExpenseFilters';

const GroupDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isEditMode, setIsEditMode] = useState(false);
  const [editName, setEditName] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [showAddParticipant, setShowAddParticipant] = useState(false);
  const [removingParticipantId, setRemovingParticipantId] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [expensesLoading, setExpensesLoading] = useState(false);
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [balanceRefreshTrigger, setBalanceRefreshTrigger] = useState(0);
  const [expenseFilters, setExpenseFilters] = useState({
    search: '',
    participant: '',
    dateFrom: '',
    dateTo: '',
    amountMin: '',
    amountMax: '',
  });

  useEffect(() => {
    fetchGroup();
    fetchExpenses();
  }, [id]);

  const fetchGroup = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/groups/${id}`);
      setGroup(response.data);
      setEditName(response.data.name);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load group');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateGroup = async (e) => {
    e.preventDefault();
    try {
      const response = await api.put(`/groups/${id}`, { name: editName });
      setGroup(response.data);
      setIsEditMode(false);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update group');
    }
  };

  const handleDeleteGroup = async () => {
    try {
      await api.delete(`/groups/${id}`);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete group');
      setDeleteConfirm(false);
    }
  };

  const handleAddParticipant = async (selectedUser) => {
    try {
      setError('');
      
      // Check if already max participants (3 + creator = 4)
      const currentParticipants = group.participants || [];
      if (currentParticipants.length >= 3) {
        setError('Maximum 3 participants allowed (plus creator = 4 total)');
        return;
      }

      // Check if user is already a participant
      const isAlreadyParticipant = currentParticipants.some(
        p => p.user._id === selectedUser._id || p.user === selectedUser._id
      );
      
      if (isAlreadyParticipant) {
        setError('This user is already a participant');
        return;
      }

      // Prepare new participants array
      const newParticipant = {
        user: selectedUser._id,
        name: selectedUser.name || selectedUser.email.split('@')[0],
        color: `#${Math.floor(Math.random() * 16777215).toString(16)}`, // Random color
      };

      const updatedParticipants = [...currentParticipants, newParticipant];

      // Update group with new participant
      const response = await api.put(`/groups/${id}`, {
        name: group.name,
        participants: updatedParticipants,
      });

      setGroup(response.data);
      setShowAddParticipant(false);
      setError('');
      // Trigger balance refresh in case there are existing expenses
      setBalanceRefreshTrigger(prev => prev + 1);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add participant');
    }
  };

  const fetchExpenses = async (filters = expenseFilters) => {
    try {
      setExpensesLoading(true);
      // Build query string from filters
      const params = new URLSearchParams();
      if (filters.search) params.append('search', filters.search);
      if (filters.participant) params.append('participant', filters.participant);
      if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
      if (filters.dateTo) params.append('dateTo', filters.dateTo);
      if (filters.amountMin) params.append('amountMin', filters.amountMin);
      if (filters.amountMax) params.append('amountMax', filters.amountMax);

      const queryString = params.toString();
      const url = `/expenses/groups/${id}/expenses${queryString ? `?${queryString}` : ''}`;
      const response = await api.get(url);
      setExpenses(response.data);
    } catch (err) {
      console.error('Failed to fetch expenses:', err);
    } finally {
      setExpensesLoading(false);
    }
  };

  const handleFilterChange = (filters) => {
    setExpenseFilters(filters);
    fetchExpenses(filters);
  };

  const handleExpenseSubmit = () => {
    setShowExpenseForm(false);
    setEditingExpense(null);
    fetchExpenses();
    // Trigger balance refresh
    setBalanceRefreshTrigger(prev => prev + 1);
  };

  const handleEditExpense = (expense) => {
    setEditingExpense(expense);
    setShowExpenseForm(true);
  };

  const handleDeleteExpense = async (expenseId) => {
    try {
      await api.delete(`/expenses/${expenseId}`);
      fetchExpenses();
      // Trigger balance refresh
      setBalanceRefreshTrigger(prev => prev + 1);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete expense');
    }
  };

  const handleRemoveParticipant = async (participantUserId) => {
    try {
      setError('');
      setRemovingParticipantId(participantUserId);

      // Filter out the participant to remove
      const updatedParticipants = group.participants.filter(p => {
        const participantId = p.user._id ? p.user._id.toString() : p.user.toString();
        return participantId !== participantUserId;
      });

      // Update group
      const response = await api.put(`/groups/${id}`, {
        name: group.name,
        participants: updatedParticipants,
      });

      setGroup(response.data);
      setRemovingParticipantId(null);
      setError('');
      // Trigger balance refresh in case there are existing expenses
      setBalanceRefreshTrigger(prev => prev + 1);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to remove participant');
      setRemovingParticipantId(null);
    }
  };

  const isCreator = group && group.creator?._id === user?._id;

  // Get list of user IDs to exclude from dropdown (creator + existing participants)
  const excludeUserIds = [];
  if (group) {
    if (group.creator?._id) {
      excludeUserIds.push(group.creator._id);
    }
    if (group.participants) {
      group.participants.forEach(p => {
        const participantId = p.user._id ? p.user._id : p.user;
        excludeUserIds.push(participantId);
      });
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Loading group...</p>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Group not found</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const totalParticipants = 1 + (group.participants?.length || 0);
  const canAddMoreParticipants = (group.participants?.length || 0) < 3;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-start mb-6">
          <button
            onClick={() => navigate('/dashboard')}
            className="text-blue-600 hover:text-blue-700 flex items-center"
          >
            ← Back to Dashboard
          </button>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-between items-start mb-4">
            {isEditMode ? (
              <form onSubmit={handleUpdateGroup} className="flex-1">
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="text-2xl font-bold text-gray-900 border border-gray-300 rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
                <div className="mt-3 flex space-x-2">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditMode(false);
                      setEditName(group.name);
                    }}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <>
                <h1 className="text-2xl font-bold text-gray-900">{group.name}</h1>
                {isCreator && (
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setIsEditMode(true)}
                      className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                    >
                      Edit
                    </button>
                    {!deleteConfirm ? (
                      <button
                        onClick={() => setDeleteConfirm(true)}
                        className="px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm"
                      >
                        Delete
                      </button>
                    ) : (
                      <div className="flex space-x-2">
                        <button
                          onClick={handleDeleteGroup}
                          className="px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm"
                        >
                          Confirm Delete
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(false)}
                          className="px-3 py-1 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 text-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          <div className="border-t pt-4 mt-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Group Details</h2>
            <div className="space-y-2">
              <p className="text-gray-600">
                <span className="font-medium">Total Members:</span> {totalParticipants}
              </p>
              <p className="text-gray-600">
                <span className="font-medium">Created by:</span> {group.creator?.name || group.creator?.email}
              </p>
              <p className="text-gray-600">
                <span className="font-medium">Created:</span> {new Date(group.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>

          <div className="border-t pt-4 mt-4">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-lg font-semibold text-gray-900">Participants</h2>
              {isCreator && canAddMoreParticipants && (
                <button
                  onClick={() => setShowAddParticipant(!showAddParticipant)}
                  className="px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
                >
                  {showAddParticipant ? 'Cancel' : '+ Add Participant'}
                </button>
              )}
            </div>

            {showAddParticipant && isCreator && canAddMoreParticipants && (
              <div className="mb-4 p-4 bg-gray-50 rounded-md">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search and select a user to add:
                </label>
                <UserDropdown
                  onSelectUser={handleAddParticipant}
                  excludeUserIds={excludeUserIds}
                  placeholder="Search users by email or name..."
                />
              </div>
            )}

            {/* Creator */}
            <div className="mb-2 p-3 bg-gray-50 rounded-md flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-medium"
                  style={{ backgroundColor: '#3B82F6' }}
                >
                  {(group.creator?.name || group.creator?.email || '?').charAt(0).toUpperCase()}
                </div>
                <div>
                  <span className="font-medium text-gray-900">
                    {group.creator?.name || group.creator?.email}
                  </span>
                  <span className="ml-2 text-xs text-gray-500">(Creator)</span>
                </div>
              </div>
            </div>

            {/* Participants */}
            {group.participants && group.participants.length > 0 ? (
              <div className="space-y-2">
                {group.participants.map((participant, index) => {
                  const participantId = participant.user._id
                    ? participant.user._id.toString()
                    : participant.user.toString();
                  const isRemoving = removingParticipantId === participantId;

                  return (
                    <div
                      key={index}
                      className="p-3 bg-gray-50 rounded-md flex items-center justify-between"
                    >
                      <div className="flex items-center space-x-3">
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-medium"
                          style={{
                            backgroundColor: participant.color || '#3B82F6',
                          }}
                        >
                          {(participant.name ||
                            participant.user?.name ||
                            participant.user?.email ||
                            '?').charAt(0).toUpperCase()}
                        </div>
                        <span className="text-gray-700">
                          {participant.name ||
                            participant.user?.name ||
                            participant.user?.email ||
                            'Unknown'}
                        </span>
                      </div>
                      {isCreator && (
                        <button
                          onClick={() => handleRemoveParticipant(participantId)}
                          disabled={isRemoving}
                          className="px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isRemoving ? 'Removing...' : 'Remove'}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              !showAddParticipant && (
                <p className="text-gray-500 text-sm">No participants added yet.</p>
              )
            )}

            {!canAddMoreParticipants && isCreator && (
              <p className="mt-2 text-sm text-gray-500">
                Maximum participants reached (3 + creator = 4 total)
              </p>
            )}
          </div>
        </div>

        {/* Balance Summary Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Balance Summary</h2>
          <BalanceSummary groupId={id} refreshTrigger={balanceRefreshTrigger} />
        </div>

        {/* Expenses Section */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Expenses</h2>
            <button
              onClick={() => {
                setEditingExpense(null);
                setShowExpenseForm(!showExpenseForm);
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
            >
              {showExpenseForm ? 'Cancel' : '+ Add Expense'}
            </button>
          </div>

          {showExpenseForm && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {editingExpense ? 'Edit Expense' : 'Add New Expense'}
              </h3>
              <ExpenseForm
                group={group}
                onSubmit={handleExpenseSubmit}
                onCancel={() => {
                  setShowExpenseForm(false);
                  setEditingExpense(null);
                }}
                initialExpense={editingExpense}
              />
            </div>
          )}

          <ExpenseFilters
            group={group}
            onFilterChange={handleFilterChange}
            filters={expenseFilters}
          />

          <ExpenseList
            expenses={expenses}
            onEdit={handleEditExpense}
            onDelete={handleDeleteExpense}
            currentUserId={user?._id}
            loading={expensesLoading}
            hasFilters={Object.values(expenseFilters).some(val => val !== '')}
          />
        </div>
      </div>
    </div>
  );
};

export default GroupDetailPage;
