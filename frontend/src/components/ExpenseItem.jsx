import { useState } from 'react';
import { Pencil } from 'lucide-react';
import Avatar from './Avatar';

const ExpenseItem = ({ expense, onEdit, onDelete, currentUserId }) => {
  const [showDetails, setShowDetails] = useState(true);
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

  const handleDelete = async () => {
    if (deleteConfirm) {
      try {
        await onDelete(expense._id);
        setDeleteConfirm(false);
      } catch (error) {
        // Error will be handled by parent component
        setDeleteConfirm(false);
      }
    } else {
      setDeleteConfirm(true);
      // Auto-cancel confirmation after 3 seconds
      setTimeout(() => setDeleteConfirm(false), 3000);
    }
  };

  const payerId = expense.payer._id || expense.payer;
  const isCurrentUserPayer = payerId === currentUserId;

  return (
    <div 
      className="rounded-lg p-4 transition-all duration-200"
      style={{
        background: 'linear-gradient(145deg, #ffffff, #f3f4f6)',
        boxShadow: '6px 6px 12px #d1d5db, -6px -6px 12px #ffffff',
        border: '1px solid rgba(134, 140, 143, 0.15)'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = '8px 8px 16px #d1d5db, -8px -8px 16px #ffffff';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = '6px 6px 12px #d1d5db, -6px -6px 12px #ffffff';
      }}
    >
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
            <div className="mt-3 pt-3" style={{ borderTop: '1px solid rgba(134, 140, 143, 0.2)' }}>
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Split Details:</h4>
              <div className="space-y-2">
                {expense.splits.map((split, index) => {
                  const participantId = split.participant._id || split.participant;
                  const participantName = split.participant.name || split.participant.email || 'Unknown';
                  const splitAmount = split.amount || 0;

                  return (
                    <div 
                      key={index} 
                      className="flex justify-between items-center text-sm px-3 py-2 rounded-lg"
                      style={{
                        background: 'linear-gradient(145deg, #f9fafb, #f3f4f6)',
                        boxShadow: 'inset 2px 2px 4px #d1d5db, inset -2px -2px 4px #ffffff',
                      }}
                    >
                      <span className="text-gray-700 font-medium">
                        {participantName}
                        {split.percentage && <span className="ml-2 text-xs text-gray-500">({split.percentage.toFixed(2)}%)</span>}
                      </span>
                      <span className="font-bold text-gray-900">{formatCurrency(splitAmount)}</span>
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
              className="p-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
              title="Edit"
            >
              <Pencil size={18} />
            </button>
          )}
          {canEdit && onDelete && (
            <button
              onClick={handleDelete}
              className="p-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
              title={deleteConfirm ? 'Confirm Delete' : 'Delete'}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/>
                <path d="M3 6h18"/>
                <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExpenseItem;
