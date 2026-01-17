import ExpenseItem from './ExpenseItem';
import LoadingSpinner from './LoadingSpinner';

const ExpenseList = ({ expenses, onEdit, onDelete, currentUserId, loading, hasFilters = false }) => {
  if (loading) {
    return <LoadingSpinner text="Loading expenses..." />;
  }

  if (!expenses || expenses.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg">
        <svg
          className="mx-auto h-12 w-12 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900">No expenses found</h3>
        <p className="mt-1 text-sm text-gray-500">
          {hasFilters
            ? 'Try adjusting your filters to see more results.'
            : 'Get started by adding your first expense!'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {expenses.map((expense) => (
        <ExpenseItem
          key={expense._id}
          expense={expense}
          onEdit={onEdit}
          onDelete={onDelete}
          currentUserId={currentUserId}
        />
      ))}
    </div>
  );
};

export default ExpenseList;
