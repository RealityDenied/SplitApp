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
        <div className="rounded-lg overflow-hidden" style={{
          background: 'linear-gradient(145deg, #f3f4f6, #e5e7eb)',
          boxShadow: '8px 8px 16px #d1d5db, -8px -8px 16px #ffffff',
          border: '1px solid rgba(134, 140, 143, 0.2)'
        }}>
          <table className="min-w-full divide-y" style={{ borderColor: 'rgba(134, 140, 143, 0.2)' }}>
            <thead style={{ background: 'linear-gradient(145deg, #e5e7eb, #d1d5db)' }}>
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Member
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Balance
                </th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: 'rgba(134, 140, 143, 0.2)' }}>
              {balanceData.netBalances.map((item, index) => {
                const isCurrentUser = item.user._id === currentUserId;
                const isPositive = item.balance > 0;
                const isNegative = item.balance < 0;
                const isZero = Math.abs(item.balance) < 0.01;

                return (
                  <tr
                    key={index}
                    className={isCurrentUser ? 'font-medium' : ''}
                    style={isCurrentUser ? { background: 'linear-gradient(145deg, #f9fafb, #f3f4f6)' } : {}}
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

      {/* Who Owes Whom - Card Style with Arrow */}
      {balanceData.directionalBalances && balanceData.directionalBalances.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Who Owes Whom</h3>
          <div className="space-y-3">
            {balanceData.directionalBalances.map((item, index) => {
              const isFromCurrentUser = item.from._id === currentUserId;
              const isToCurrentUser = item.to._id === currentUserId;

                  return (
                <div
                  key={index}
                  className="rounded-lg p-3 transition-all duration-200"
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
                  <div className="flex items-center gap-2">
                    {/* From User */}
                    <div className="flex items-center gap-2 min-w-0">
                      <Avatar
                        seed={item.from.avatarSeed || item.from.email}
                        name={item.from.name || item.from.email}
                        size="sm"
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {item.from.name || item.from.email}
                          {isFromCurrentUser && <span className="ml-1 text-xs text-red-600 font-medium">(You)</span>}
                        </p>
                      </div>
                    </div>

                    {/* Arrow with Amount Above */}
                    <div className="flex-shrink-0 flex flex-col items-center justify-end mx-2 relative">
                      {/* Amount above arrow base - shifted left slightly */}
                      <div className="mb-0.5 -ml-1">
                        <div className="px-2 py-1 rounded-lg inline-block" style={{
                          background: 'linear-gradient(145deg, #e5e7eb, #d1d5db)',
                          boxShadow: 'inset 2px 2px 4px #868C8F, inset -2px -2px 4px #ffffff',
                        }}>
                          <p className="text-sm font-bold text-gray-800 whitespace-nowrap">
                            {formatCurrency(item.amount)}
                          </p>
                        </div>
                      </div>
                      {/* Longer Arrow Icon */}
                      <svg 
                        viewBox="0 0 120 24" 
                        className="text-gray-600"
                        style={{ width: '120px', height: '24px' }}
                      >
                        <path 
                          d="M2 12H108M108 12L98 4M108 12L98 20" 
                          stroke="currentColor"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          fill="none"
                        />
                      </svg>
                    </div>

                    {/* To User */}
                    <div className="flex items-center gap-2 min-w-0">
                      <Avatar
                        seed={item.to.avatarSeed || item.to.email}
                        name={item.to.name || item.to.email}
                        size="sm"
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {item.to.name || item.to.email}
                          {isToCurrentUser && <span className="ml-1 text-xs text-green-600 font-medium">(You)</span>}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Settlement Suggestions */}
      {balanceData.settlements && balanceData.settlements.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            Settlement Suggestions
          </h3>
          <div className="rounded-lg p-4 mb-2" style={{
            background: 'linear-gradient(145deg, #f3f4f6, #e5e7eb)',
            boxShadow: '8px 8px 16px #d1d5db, -8px -8px 16px #ffffff',
            border: '1px solid rgba(134, 140, 143, 0.2)'
          }}>
            <p className="text-sm text-gray-600 mb-4 font-medium">
              To settle all balances with the minimum number of transactions:
            </p>
            <div className="space-y-3">
              {balanceData.settlements.map((settlement, index) => {
                const isFromCurrentUser = settlement.from._id === currentUserId;
                const isToCurrentUser = settlement.to._id === currentUserId;

                return (
                  <div
                    key={index}
                    className="rounded-lg p-3 flex items-center gap-2 relative"
                    style={{
                      background: 'linear-gradient(145deg, #ffffff, #f3f4f6)',
                      boxShadow: '6px 6px 12px #d1d5db, -6px -6px 12px #ffffff',
                      border: '1px solid rgba(134, 140, 143, 0.15)'
                    }}
                  >
                    {/* From User */}
                    <div className="flex items-center gap-2 min-w-0">
                      <Avatar
                        seed={settlement.from.avatarSeed || settlement.from.email}
                        name={settlement.from.name || settlement.from.email}
                        size="sm"
                      />
                      <div className="min-w-0">
                        <p className={`text-sm font-medium truncate ${isFromCurrentUser ? 'text-gray-800 font-semibold' : 'text-gray-900'}`}>
                          {settlement.from.name || settlement.from.email}
                          {isFromCurrentUser && <span className="ml-1 text-xs text-red-600 font-medium">(You)</span>}
                        </p>
                      </div>
                    </div>

                    {/* Arrow with Amount Above */}
                    <div className="flex-shrink-0 flex flex-col items-center justify-end mx-2 relative">
                      {/* Amount above arrow base - shifted left slightly */}
                      <div className="mb-0.5 -ml-1">
                        <div className="px-2 py-1 rounded-lg inline-block" style={{
                          background: 'linear-gradient(145deg, #e5e7eb, #d1d5db)',
                          boxShadow: 'inset 2px 2px 4px #868C8F, inset -2px -2px 4px #ffffff',
                        }}>
                          <p className="text-sm font-bold text-gray-800 whitespace-nowrap">
                            {formatCurrency(settlement.amount)}
                          </p>
                        </div>
                      </div>
                      {/* Longer Arrow Icon */}
                      <svg 
                        viewBox="0 0 120 24" 
                        className="text-gray-600"
                        style={{ width: '120px', height: '24px' }}
                      >
                        <path 
                          d="M2 12H108M108 12L98 4M108 12L98 20" 
                          stroke="currentColor"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          fill="none"
                        />
                      </svg>
                    </div>

                    {/* To User */}
                    <div className="flex items-center gap-2 min-w-0">
                      <Avatar
                        seed={settlement.to.avatarSeed || settlement.to.email}
                        name={settlement.to.name || settlement.to.email}
                        size="sm"
                      />
                      <div className="min-w-0">
                        <p className={`text-sm font-medium truncate ${isToCurrentUser ? 'text-gray-800 font-semibold' : 'text-gray-900'}`}>
                          {settlement.to.name || settlement.to.email}
                          {isToCurrentUser && <span className="ml-1 text-xs text-green-600 font-medium">(You)</span>}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Total Spent */}
      <div className="rounded-lg p-4" style={{
        background: 'linear-gradient(145deg, #f3f4f6, #e5e7eb)',
        boxShadow: '6px 6px 12px #d1d5db, -6px -6px 12px #ffffff',
        border: '1px solid rgba(134, 140, 143, 0.2)'
      }}>
        <p className="text-sm font-medium text-gray-700">
          Total Spent in Group: <span className="font-bold text-gray-900">{formatCurrency(balanceData.totalSpent)}</span>
        </p>
      </div>
    </div>
  );
};

export default BalanceSummary;
