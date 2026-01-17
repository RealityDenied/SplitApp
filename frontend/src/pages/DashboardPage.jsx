import { useContext, useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import GroupCard from '../components/GroupCard';
import CreateGroupModal from '../components/CreateGroupModal';
import SummaryCard from '../components/SummaryCard';

const DashboardPage = () => {
  const { user, logout } = useContext(AuthContext);
  const location = useLocation();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [summary, setSummary] = useState({
    totalSpent: 0,
    totalOwedToUser: 0,
    totalUserOwes: 0,
  });
  const [summaryLoading, setSummaryLoading] = useState(true);

  useEffect(() => {
    fetchGroups();
    fetchSummary();
  }, []);

  // Refresh data when navigating back to dashboard
  useEffect(() => {
    if (location.pathname === '/dashboard') {
      fetchGroups();
      fetchSummary();
    }
  }, [location.pathname]);

  const fetchGroups = async () => {
    try {
      setLoading(true);
      const response = await api.get('/groups');
      setGroups(response.data);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load groups');
    } finally {
      setLoading(false);
    }
  };

  const handleGroupCreated = (newGroup) => {
    setGroups([newGroup, ...groups]);
    fetchSummary(); // Refresh summary after creating group
  };

  const fetchSummary = async () => {
    try {
      setSummaryLoading(true);
      const response = await api.get('/dashboard/summary');
      setSummary(response.data);
    } catch (err) {
      console.error('Failed to fetch summary:', err);
    } finally {
      setSummaryLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-1 text-gray-600">
            Welcome, <span className="font-semibold">{user?.name || user?.email}</span>!
          </p>
        </div>

        <div className="mb-6">
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            + Create New Group
          </button>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <SummaryCard
            title="Total Spent"
            value={summary.totalSpent}
            color="blue"
            icon={
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            }
          />
          <SummaryCard
            title="Total Owed to You"
            value={summary.totalOwedToUser}
            color="green"
            icon={
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
          <SummaryCard
            title="You Owe"
            value={summary.totalUserOwes}
            color="red"
            icon={
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
            <p className="ml-3 text-gray-600">Loading groups...</p>
          </div>
        ) : groups.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
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
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No groups yet</h3>
            <p className="mt-1 text-sm text-gray-500 mb-4">
              Get started by creating your first expense group.
            </p>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Create Your First Group
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {groups.map((group) => (
              <GroupCard key={group._id} group={group} />
            ))}
          </div>
        )}

        <CreateGroupModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onGroupCreated={handleGroupCreated}
        />
      </div>
    </div>
  );
};

export default DashboardPage;
