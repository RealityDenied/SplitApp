import { useState } from 'react';
import Avatar from './Avatar';

const ExpenseItem = ({ expense, onEdit, onDelete, currentUserId }) => {
  const [showDetails, setShowDetails] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  const canEdit = true; // All group members can edit/delete expenses (or restrict if needed)

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const handleDelete = () => {
    if (deleteConfirm) {
      onDelete(expense._id);
    } else {
      setDeleteConfirm(true);
      // Auto-cancel confirmation after 3 seconds
      setTimeout(() => setDeleteConfirm(false), 3000);
    }
  };

  const payerId = expense.payer._id || expense.payer;
  const isCurrentUserPayer = payerId === currentUserId;

  return (
    <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-2">
            <h3 className="text-lg font-semibold text-gray-900">{expense.description}</h3>
            <span className="text-lg font-bold text-blue-600">{formatCurrency(expense.amount)}</span>
          </div>

          <div className="flex items-center space-x-4 text-sm text-gray-600 mb-2">
            <span className="flex items-center space-x-2">
              <span className="font-medium">Paid by:</span>
              <Avatar
                seed={expense.payer.avatarSeed || expense.payer.email}
                name={expense.payer.name || expense.payer.email}
                size="xs"
              />
              <span className={isCurrentUserPayer ? 'font-semibold text-blue-600' : ''}>
                {expense.payer.name || expense.payer.email || 'Unknown'}
              </span>
            </span>
            <span>
              <span className="font-medium">Date:</span> {formatDate(expense.date)}
            </span>
            <span>
              <span className="font-medium">Split:</span> {expense.splitMode}
            </span>
          </div>

          {showDetails && (
            <div className="mt-3 pt-3 border-t border-gray-200">
              <h4 className="text-sm font-semibold text-gray-700 mb-2">Split Details:</h4>
              <div className="space-y-1">
                {expense.splits.map((split, index) => {
                  const participantId = split.participant._id || split.participant;
                  const participantName = split.participant.name || split.participant.email || 'Unknown';
                  const splitAmount = split.amount || 0;

                  return (
                    <div key={index} className="flex justify-between text-sm">
                      <span className="text-gray-600">
                        {participantName}
                        {split.percentage && ` (${split.percentage.toFixed(2)}%)`}
                      </span>
                      <span className="font-medium text-gray-900">{formatCurrency(splitAmount)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="flex space-x-2 ml-4">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
          >
            {showDetails ? 'Hide' : 'Details'}
          </button>
          {canEdit && onEdit && (
            <button
              onClick={() => onEdit(expense)}
              className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              Edit
            </button>
          )}
          {canEdit && onDelete && (
            <button
              onClick={handleDelete}
              className={`px-3 py-1 text-sm rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors ${
                deleteConfirm
                  ? 'bg-red-700 text-white hover:bg-red-800 focus:ring-red-500'
                  : 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500'
              }`}
            >
              {deleteConfirm ? 'Confirm' : 'Delete'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExpenseItem;
