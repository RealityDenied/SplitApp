import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useContext } from 'react';
import { Pencil, X, Plus, Info } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import UserDropdown from '../components/UserDropdown';
import ExpenseForm from '../components/ExpenseForm';
import ExpenseList from '../components/ExpenseList';
import BalanceSummary from '../components/BalanceSummary';
import ExpenseFilters from '../components/ExpenseFilters';
import Avatar from '../components/Avatar';

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
      setError('');
      const response = await api.delete(`/expenses/${expenseId}`);
      if (response.status === 200) {
        fetchExpenses();
        // Trigger balance refresh
        setBalanceRefreshTrigger(prev => prev + 1);
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to delete expense';
      setError(errorMessage);
      console.error('Delete expense error:', err);
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
                    className="px-4 py-2 rounded-md text-sm font-medium transition-all duration-200"
                    style={{
                      background: 'linear-gradient(145deg, #d1d5db, #9ca3af)',
                      boxShadow: '4px 4px 8px #868C8F, -4px -4px 8px #ffffff',
                      color: '#1f2937',
                      border: '1px solid rgba(134, 140, 143, 0.3)'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.boxShadow = '5px 5px 10px #868C8F, -5px -5px 10px #ffffff';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.boxShadow = '4px 4px 8px #868C8F, -4px -4px 8px #ffffff';
                    }}
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
                <div className="flex space-x-2 items-center">
                  {/* Info Button */}
                  <div className="relative inline-block group">
                    <button
                      className="p-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
                      title="Group Details"
                    >
                      <Info size={18} />
                    </button>
                    
                    {/* Hover Card */}
                    <div className="absolute left-0 top-full mt-2 z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                      <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-4 min-w-[200px]">
                        <div className="space-y-2">
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Total Members:</span> {totalParticipants}
                          </p>
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Created by:</span> {group.creator?.name || group.creator?.email}
                          </p>
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Created:</span> {new Date(group.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {isCreator && (
                    <>
                      <button
                        onClick={() => setIsEditMode(true)}
                        className="p-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
                        title="Edit"
                      >
                        <Pencil size={18} />
                      </button>
                    {!deleteConfirm ? (
                      <button
                        onClick={() => setDeleteConfirm(true)}
                        className="p-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
                        title="Delete"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/>
                          <path d="M3 6h18"/>
                          <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                        </svg>
                      </button>
                    ) : (
                      <div className="flex space-x-2">
                        <button
                          onClick={handleDeleteGroup}
                          className="p-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
                          title="Confirm Delete"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/>
                            <path d="M3 6h18"/>
                            <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                          </svg>
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(false)}
                          className="p-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
                          title="Cancel"
                        >
                          <X size={18} />
                        </button>
                      </div>
                    )}
                    </>
                  )}
                </div>
              </>
            )}
          </div>

          <div className="border-t pt-4 mt-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Participants</h2>

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
                <button
                  onClick={() => setShowAddParticipant(false)}
                  className="mt-3 px-3 py-1 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 text-sm"
                >
                  Cancel
                </button>
              </div>
            )}

            {/* Participants - Horizontal Cards */}
            <div className="flex flex-wrap gap-4">
              {/* Creator Card */}
              <div
                className="rounded-lg p-4 flex flex-col items-center justify-center relative"
                style={{
                  width: '200px',
                  height: '124px',
                  borderRadius: '10px',
                  background: 'linear-gradient(145deg, #ffffff, #f9fafb)',
                  boxShadow: '8px 8px 16px #d1d5db, -8px -8px 16px #ffffff',
                  border: '1px solid rgba(134, 140, 143, 0.15)'
                }}
              >
                <Avatar
                  seed={group.creator?.avatarSeed || group.creator?.email}
                  name={group.creator?.name || group.creator?.email}
                  size="lg"
                />
                <p className="mt-2 text-sm font-medium text-gray-900 text-center truncate w-full">
                  {group.creator?.name || group.creator?.email}
                </p>
                <span className="text-xs text-gray-500">(Creator)</span>
              </div>

              {/* Participant Cards */}
              {group.participants && group.participants.length > 0 && (
                <>
                  {group.participants.map((participant, index) => {
                    const participantId = participant.user._id
                      ? participant.user._id.toString()
                      : participant.user.toString();
                    const isRemoving = removingParticipantId === participantId;
                    const participantName =
                      participant.name ||
                      participant.user?.name ||
                      participant.user?.email ||
                      'Unknown';

                    return (
                      <div
                        key={index}
                        className="rounded-lg p-4 flex flex-col items-center justify-center relative transition-all duration-200"
                        style={{
                          width: '200px',
                          height: '124px',
                          borderRadius: '10px',
                          background: 'linear-gradient(145deg, #ffffff, #f9fafb)',
                          boxShadow: '8px 8px 16px #d1d5db, -8px -8px 16px #ffffff',
                          border: '1px solid rgba(134, 140, 143, 0.15)'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.boxShadow = '10px 10px 20px #d1d5db, -10px -10px 20px #ffffff';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.boxShadow = '8px 8px 16px #d1d5db, -8px -8px 16px #ffffff';
                        }}
                      >
                        <Avatar
                          seed={
                            participant.user?.avatarSeed ||
                            participant.user?.email ||
                            participant.name ||
                            'default'
                          }
                          name={participantName}
                          size="lg"
                        />
                        <p className="mt-2 text-sm font-medium text-gray-900 text-center truncate w-full">
                          {participantName}
                        </p>
                        {isCreator && (
                          <button
                            onClick={() => handleRemoveParticipant(participantId)}
                            disabled={isRemoving}
                            className="absolute top-2 right-2 p-1.5 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Remove"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/>
                              <path d="M3 6h18"/>
                              <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                            </svg>
                          </button>
                        )}
                      </div>
                    );
                  })}
                </>
              )}

              {/* Add Participant Button Card */}
              {isCreator && canAddMoreParticipants && (
                <button
                  onClick={() => setShowAddParticipant(!showAddParticipant)}
                  className="rounded-lg flex flex-col items-center justify-center transition-all duration-200"
                  style={{
                    width: '180px',
                    height: '111px',
                    borderRadius: '10px',
                    background: 'linear-gradient(145deg, #e5e7eb, #d1d5db)',
                    boxShadow: '6px 6px 12px #868C8F, -6px -6px 12px #ffffff',
                    border: '2px dashed rgba(134, 140, 143, 0.4)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = '8px 8px 16px #868C8F, -8px -8px 16px #ffffff';
                    e.currentTarget.style.borderColor = 'rgba(134, 140, 143, 0.6)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = '6px 6px 12px #868C8F, -6px -6px 12px #ffffff';
                    e.currentTarget.style.borderColor = 'rgba(134, 140, 143, 0.4)';
                  }}
                  title="Add Participant"
                >
                  <Plus size={32} className="text-gray-500" strokeWidth={2.5} />
                  <span className="mt-2 text-xs text-gray-600 font-medium">Add</span>
                </button>
              )}

              {/* Empty State */}
              {(!group.participants || group.participants.length === 0) && !isCreator && (
                <p className="text-gray-500 text-sm">No participants added yet.</p>
              )}

              {!canAddMoreParticipants && isCreator && (
                <p className="text-sm text-gray-500 flex items-center">
                  Maximum participants reached (3 + creator = 4 total)
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Balance Summary Section */}
        <div className="rounded-lg p-6 mb-6" style={{
          background: 'linear-gradient(145deg, #f3f4f6, #e5e7eb)',
          boxShadow: '12px 12px 24px #d1d5db, -12px -12px 24px #ffffff',
          border: '1px solid rgba(134, 140, 143, 0.2)'
        }}>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Balance Summary</h2>
          <BalanceSummary groupId={id} refreshTrigger={balanceRefreshTrigger} />
        </div>

        {/* Expenses Section */}
        <div className="rounded-lg p-6" style={{
          background: 'linear-gradient(145deg, #f3f4f6, #e5e7eb)',
          boxShadow: '12px 12px 24px #d1d5db, -12px -12px 24px #ffffff',
          border: '1px solid rgba(134, 140, 143, 0.2)'
        }}>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Expenses</h2>
            <button
              onClick={() => {
                setEditingExpense(null);
                setShowExpenseForm(!showExpenseForm);
              }}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 text-sm font-medium transition-colors"
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
