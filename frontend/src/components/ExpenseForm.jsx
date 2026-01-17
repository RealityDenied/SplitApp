import { useState, useEffect } from 'react';
import api from '../services/api';

const ExpenseForm = ({ group, onSubmit, onCancel, initialExpense = null }) => {
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [payer, setPayer] = useState('');
  const [splitMode, setSplitMode] = useState('equal');
  const [selectedParticipants, setSelectedParticipants] = useState([]);
  const [customSplits, setCustomSplits] = useState({});
  const [percentageSplits, setPercentageSplits] = useState({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Get all users in the group (creator + participants)
  const allUsers = [];
  if (group) {
    if (group.creator) {
      allUsers.push({
        _id: group.creator._id,
        name: group.creator.name || group.creator.email.split('@')[0],
        email: group.creator.email,
      });
    }
    if (group.participants) {
      group.participants.forEach(p => {
        allUsers.push({
          _id: p.user._id || p.user,
          name: p.user.name || p.user.email?.split('@')[0] || p.name,
          email: p.user.email || '',
        });
      });
    }
  }

  // Initialize form with initial expense data (for editing)
  useEffect(() => {
    if (initialExpense) {
      setAmount(initialExpense.amount.toString());
      setDescription(initialExpense.description);
      setDate(new Date(initialExpense.date).toISOString().split('T')[0]);
      setPayer(initialExpense.payer._id || initialExpense.payer);
      setSplitMode(initialExpense.splitMode);

      if (initialExpense.splitMode === 'equal') {
        const participants = initialExpense.splits.map(s => s.participant._id || s.participant);
        setSelectedParticipants(participants);
      } else if (initialExpense.splitMode === 'custom') {
        const splits = {};
        initialExpense.splits.forEach(s => {
          const participantId = s.participant._id || s.participant;
          splits[participantId] = s.amount;
        });
        setCustomSplits(splits);
        setSelectedParticipants(Object.keys(splits));
      } else if (initialExpense.splitMode === 'percentage') {
        const splits = {};
        initialExpense.splits.forEach(s => {
          const participantId = s.participant._id || s.participant;
          splits[participantId] = s.percentage;
        });
        setPercentageSplits(splits);
        setSelectedParticipants(Object.keys(splits));
      }
    } else {
      // Default payer to first user if available
      if (group) {
        if (group.creator && !payer) {
          setPayer(group.creator._id);
        } else if (group.participants && group.participants.length > 0 && !payer) {
          const firstParticipantId = group.participants[0].user._id || group.participants[0].user;
          setPayer(firstParticipantId);
        }
      }
    }
  }, [initialExpense, group, payer]);

  const handleParticipantToggle = (userId) => {
    setError('');
    if (selectedParticipants.includes(userId)) {
      setSelectedParticipants(selectedParticipants.filter(id => id !== userId));
      // Clear custom/percentage splits for removed participant
      if (splitMode === 'custom') {
        const newSplits = { ...customSplits };
        delete newSplits[userId];
        setCustomSplits(newSplits);
      } else if (splitMode === 'percentage') {
        const newSplits = { ...percentageSplits };
        delete newSplits[userId];
        setPercentageSplits(newSplits);
      }
    } else {
      setSelectedParticipants([...selectedParticipants, userId]);
      // Initialize splits for new participant
      if (splitMode === 'custom') {
        setCustomSplits({ ...customSplits, [userId]: '' });
      } else if (splitMode === 'percentage') {
        setPercentageSplits({ ...percentageSplits, [userId]: '' });
      }
    }
  };

  const handleSplitModeChange = (newMode) => {
    setError('');
    setSplitMode(newMode);
    // Clear splits when changing mode
    if (newMode === 'equal') {
      setCustomSplits({});
      setPercentageSplits({});
    } else if (newMode === 'custom') {
      setPercentageSplits({});
      // Initialize custom splits for selected participants
      const splits = {};
      selectedParticipants.forEach(id => {
        splits[id] = '';
      });
      setCustomSplits(splits);
    } else if (newMode === 'percentage') {
      setCustomSplits({});
      // Initialize percentage splits for selected participants
      const splits = {};
      selectedParticipants.forEach(id => {
        splits[id] = '';
      });
      setPercentageSplits(splits);
    }
  };

  const handleCustomAmountChange = (userId, value) => {
    setCustomSplits({ ...customSplits, [userId]: parseFloat(value) || '' });
  };

  const handlePercentageChange = (userId, value) => {
    setPercentageSplits({ ...percentageSplits, [userId]: parseFloat(value) || '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!amount || parseFloat(amount) <= 0) {
        setError('Please enter a valid amount');
        setLoading(false);
        return;
      }

      if (!description.trim()) {
        setError('Please enter a description');
        setLoading(false);
        return;
      }

      if (!payer) {
        setError('Please select a payer');
        setLoading(false);
        return;
      }

      if (selectedParticipants.length === 0) {
        setError('Please select at least one participant');
        setLoading(false);
        return;
      }

      let participants = [];

      if (splitMode === 'equal') {
        participants = selectedParticipants;
      } else if (splitMode === 'custom') {
        // Validate custom splits
        let total = 0;
        for (const userId of selectedParticipants) {
          const splitAmount = customSplits[userId];
          if (!splitAmount || splitAmount <= 0) {
            setError('Please enter valid amounts for all participants');
            setLoading(false);
            return;
          }
          total += splitAmount;
          participants.push({
            participant: userId,
            amount: splitAmount,
          });
        }

        if (Math.abs(total - parseFloat(amount)) > 0.01) {
          setError(`Total split amounts ($${total.toFixed(2)}) must equal expense amount ($${parseFloat(amount).toFixed(2)})`);
          setLoading(false);
          return;
        }
      } else if (splitMode === 'percentage') {
        // Validate percentage splits
        let total = 0;
        for (const userId of selectedParticipants) {
          const percentage = percentageSplits[userId];
          if (!percentage || percentage <= 0 || percentage > 100) {
            setError('Please enter valid percentages (0-100) for all participants');
            setLoading(false);
            return;
          }
          total += percentage;
          participants.push({
            participant: userId,
            percentage: percentage,
          });
        }

        if (Math.abs(total - 100) > 0.01) {
          setError(`Percentages must sum to 100%. Current total: ${total.toFixed(2)}%`);
          setLoading(false);
          return;
        }
      }

      const expenseData = {
        group: group._id,
        amount: parseFloat(amount),
        description: description.trim(),
        date: date,
        payer: payer,
        splitMode: splitMode,
        participants: participants,
      };

      if (initialExpense) {
        // Update existing expense
        await api.put(`/expenses/${initialExpense._id}`, expenseData);
      } else {
        // Create new expense
        await api.post('/expenses', expenseData);
      }

      onSubmit();
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.errors?.[0]?.msg || 'Failed to save expense');
    } finally {
      setLoading(false);
    }
  };

  const totalPercentage = Object.values(percentageSplits).reduce((sum, val) => sum + (parseFloat(val) || 0), 0);
  const totalCustom = Object.values(customSplits).reduce((sum, val) => sum + (parseFloat(val) || 0), 0);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Amount *
          </label>
          <input
            type="number"
            step="0.01"
            min="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Date *
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Description *
        </label>
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Enter expense description"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Paid By *
        </label>
        <select
          value={payer}
          onChange={(e) => setPayer(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        >
          <option value="">Select payer</option>
          {allUsers.map(user => (
            <option key={user._id} value={user._id}>
              {user.name} {user._id === group?.creator?._id ? '(Creator)' : ''}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Split Mode *
        </label>
        <select
          value={splitMode}
          onChange={(e) => handleSplitModeChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        >
          <option value="equal">Equal Split</option>
          <option value="custom">Custom Amount</option>
          <option value="percentage">Percentage</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Participants *
        </label>
        <div className="space-y-2 max-h-40 overflow-y-auto border border-gray-200 rounded-md p-3">
          {allUsers.map(user => (
            <div key={user._id} className="flex items-center justify-between">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedParticipants.includes(user._id)}
                  onChange={() => handleParticipantToggle(user._id)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-gray-700">
                  {user.name} {user._id === group?.creator?._id ? '(Creator)' : ''}
                </span>
              </label>

              {selectedParticipants.includes(user._id) && splitMode === 'custom' && (
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={customSplits[user._id] || ''}
                  onChange={(e) => handleCustomAmountChange(user._id, e.target.value)}
                  placeholder="Amount"
                  className="w-24 px-2 py-1 border border-gray-300 rounded text-sm"
                />
              )}

              {selectedParticipants.includes(user._id) && splitMode === 'percentage' && (
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={percentageSplits[user._id] || ''}
                  onChange={(e) => handlePercentageChange(user._id, e.target.value)}
                  placeholder="%"
                  className="w-24 px-2 py-1 border border-gray-300 rounded text-sm"
                />
              )}
            </div>
          ))}
        </div>

        {splitMode === 'custom' && (
          <p className="mt-2 text-sm text-gray-600">
            Total: ${totalCustom.toFixed(2)} / ${amount || '0.00'}
            {amount && Math.abs(totalCustom - parseFloat(amount)) > 0.01 && (
              <span className="text-red-600 ml-2">Must equal expense amount</span>
            )}
          </p>
        )}

        {splitMode === 'percentage' && (
          <p className="mt-2 text-sm text-gray-600">
            Total: {totalPercentage.toFixed(2)}% / 100%
            {Math.abs(totalPercentage - 100) > 0.01 && (
              <span className="text-red-600 ml-2">Must sum to 100%</span>
            )}
          </p>
        )}
      </div>

      <div className="flex justify-end space-x-3 pt-4 border-t">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Saving...' : initialExpense ? 'Update Expense' : 'Add Expense'}
        </button>
      </div>
    </form>
  );
};

export default ExpenseForm;
