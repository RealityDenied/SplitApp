import { useState, useEffect } from 'react';
import api from '../services/api';
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import Avatar from './Avatar';

const BalanceSummary = ({ groupId, refreshTrigger }) => {
  const { user } = useContext(AuthContext);
  const [balanceData, setBalanceData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchBalances();
  }, [groupId, refreshTrigger]);

  const fetchBalances = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/groups/${groupId}/balances`);
      setBalanceData(response.data);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load balances');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
        <p className="ml-3 text-gray-600">Loading balances...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
        {error}
      </div>
    );
  }

  if (!balanceData) {
    return null;
  }

  const currentUserId = user?._id;

  // Check if there are any expenses
  const hasExpenses = balanceData.totalSpent > 0;

  if (!hasExpenses) {
    return (
      <div className="text-center py-8 bg-gray-50 rounded-lg">
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
            d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
          />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900">No expenses yet</h3>
        <p className="mt-1 text-sm text-gray-500">
          Add expenses to see balance calculations and settlement suggestions.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Net Balances Table */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Net Balances</h3>
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Member
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Balance
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {balanceData.netBalances.map((item, index) => {
                const isCurrentUser = item.user._id === currentUserId;
                const isPositive = item.balance > 0;
                const isNegative = item.balance < 0;
                const isZero = Math.abs(item.balance) < 0.01;

                return (
                  <tr
                    key={index}
                    className={
                      isCurrentUser
                        ? 'bg-blue-50 font-medium'
                        : ''
                    }
                  >
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center space-x-2">
                        <Avatar
                          seed={item.user.avatarSeed || item.user.email}
                          name={item.user.name || item.user.email}
                          size="sm"
                        />
                        <span>
                          {item.user.name || item.user.email}
                          {isCurrentUser && <span className="ml-2 text-blue-600">(You)</span>}
                        </span>
                      </div>
                    </td>
                    <td
                      className={`px-4 py-3 whitespace-nowrap text-sm text-right font-medium ${
                        isPositive
                          ? 'text-green-600'
                          : isNegative
                          ? 'text-red-600'
                          : 'text-gray-500'
                      }`}
                    >
                      {isPositive && '+'}
                      {formatCurrency(Math.abs(item.balance))}
                      {isPositive && <span className="ml-1 text-xs text-gray-500">(owed to them)</span>}
                      {isNegative && <span className="ml-1 text-xs text-gray-500">(they owe)</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Who Owes Whom Table */}
      {balanceData.directionalBalances && balanceData.directionalBalances.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Who Owes Whom</h3>
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    From
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    To
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {balanceData.directionalBalances.map((item, index) => {
                  const isFromCurrentUser = item.from._id === currentUserId;
                  const isToCurrentUser = item.to._id === currentUserId;

                  return (
                    <tr key={index}>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex items-center space-x-2">
                          <Avatar
                            seed={item.from.avatarSeed || item.from.email}
                            name={item.from.name || item.from.email}
                            size="sm"
                          />
                          <span>
                            {item.from.name || item.from.email}
                            {isFromCurrentUser && <span className="ml-2 text-red-600 font-medium">(You)</span>}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex items-center space-x-2">
                          <Avatar
                            seed={item.to.avatarSeed || item.to.email}
                            name={item.to.name || item.to.email}
                            size="sm"
                          />
                          <span>
                            {item.to.name || item.to.email}
                            {isToCurrentUser && <span className="ml-2 text-green-600 font-medium">(You)</span>}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-right font-medium text-gray-900">
                        {formatCurrency(item.amount)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Settlement Suggestions */}
      {balanceData.settlements && balanceData.settlements.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            Settlement Suggestions (Minimize Transactions)
          </h3>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-sm text-gray-700 mb-3">
              To settle all balances with the minimum number of transactions:
            </p>
            <div className="space-y-2">
              {balanceData.settlements.map((settlement, index) => {
                const isFromCurrentUser = settlement.from._id === currentUserId;
                const isToCurrentUser = settlement.to._id === currentUserId;

                return (
                  <div
                    key={index}
                    className="bg-white rounded-md p-3 border border-green-300"
                  >
                    <div className="flex items-center space-x-2">
                      <Avatar
                        seed={settlement.from.avatarSeed || settlement.from.email}
                        name={settlement.from.name || settlement.from.email}
                        size="sm"
                      />
                      <p className="text-sm font-medium text-gray-900 flex-1">
                        <span className={isFromCurrentUser ? 'text-red-600 font-semibold' : ''}>
                          {settlement.from.name || settlement.from.email}
                          {isFromCurrentUser && ' (You)'}
                        </span>
                        {' should pay '}
                        <span className="font-bold text-green-600">
                          {formatCurrency(settlement.amount)}
                        </span>
                        {' to '}
                      </p>
                      <Avatar
                        seed={settlement.to.avatarSeed || settlement.to.email}
                        name={settlement.to.name || settlement.to.email}
                        size="sm"
                      />
                      <span className={isToCurrentUser ? 'text-green-600 font-semibold' : 'text-sm font-medium text-gray-900'}>
                        {settlement.to.name || settlement.to.email}
                        {isToCurrentUser && ' (You)'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Total Spent */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm font-medium text-gray-700">
          Total Spent in Group: <span className="font-bold text-blue-600">{formatCurrency(balanceData.totalSpent)}</span>
        </p>
      </div>
    </div>
  );
};

export default BalanceSummary;
