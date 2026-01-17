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

  // Calculate positions for cards in circular path
  const getCardPosition = (index, total) => {
    const radius = 150; // Radius for circular path arrangement
    const angle = (index * 360) / total - 90; // Start from top
    const radian = (angle * Math.PI) / 180;
    const x = Math.cos(radian) * radius;
    const y = Math.sin(radian) * radius;
    return { x, y };
  };

  const summaryCards = [
    {
      title: 'Total Spent',
      value: summary.totalSpent,
      color: 'blue',
      icon: (
        <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9.75m0 0h-.75m.75 0h.75m0 0h8.25m-8.25 0v-.375c0-.621.504-1.125 1.125-1.125h9.75c.621 0 1.125.504 1.125 1.125v9.75m-12 0v-.375c0-.621.504-1.125 1.125-1.125h9.75c.621 0 1.125.504 1.125 1.125v9.75" />
        </svg>
      ),
    },
    {
      title: 'Owed to You',
      value: summary.totalOwedToUser,
      color: 'green',
      icon: (
        <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      title: 'You Owe',
      value: summary.totalUserOwes,
      color: 'red',
      icon: (
        <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="min-h-screen" style={{ 
      background: 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)',
      fontFamily: 'Inter, sans-serif'
    }}>
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Main Layout: Split on desktop */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Left Side: Dashboard heading + Groups */}
          <div className="lg:col-span-3">
            {/* Dashboard Header */}
            <div className="mb-6">
              <h1 className="text-4xl font-bold text-gray-800 mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>
                Dashboard
              </h1>
              <p className="text-gray-600 text-lg">
                Welcome back, <span className="font-semibold text-gray-800">{user?.name || user?.email}</span>!
              </p>
            </div>
            
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold text-gray-800">Your Groups</h2>
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="px-5 py-2.5 text-white font-medium transition-all duration-300"
                style={{
                  background: '#1f2937',
                  borderRadius: '8px',
                  boxShadow: 'none',
                }}
              >
                + Create Group
              </button>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                <p className="ml-3 text-gray-600">Loading groups...</p>
              </div>
            ) : groups.length === 0 ? (
              <div className="soft-blob-gray p-12 text-center">
                <svg
                  className="mx-auto h-16 w-16 text-gray-400 mb-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
                <h3 className="mt-2 text-lg font-semibold text-gray-800">No groups yet</h3>
                <p className="mt-2 text-gray-600 mb-6">
                  Get started by creating your first expense group.
                </p>
                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="px-6 py-3 text-white font-medium transition-all duration-300"
                  style={{
                    background: '#1f2937',
                    borderRadius: '8px',
                    boxShadow: 'none',
                  }}
                >
                  Create Your First Group
                </button>
              </div>
            ) : (
              <div className="flex flex-wrap gap-6">
                {groups.map((group) => (
                  <GroupCard key={group._id} group={group} />
                ))}
              </div>
            )}
          </div>

           {/* Right Side: Summary Cards in Circular Layout */}
           <div className="lg:col-span-2">
             <div className="lg:sticky lg:top-8" style={{ position: 'relative', zIndex: 1 }}>
               {summaryLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                </div>
              ) : (
                <div className="relative mx-auto" style={{ width: '100%', maxWidth: '450px', height: '450px', overflow: 'visible' }}>
                  {/* Soft Blob Container - wraps everything in blob shape */}
                  <div
                    className="absolute inset-0"
                    style={{
                      borderRadius: '60% 40% 30% 70% / 60% 30% 70% 40%',
                      background: 'linear-gradient(145deg, #e5e7eb, #d1d5db)',
                      boxShadow: '20px 20px 60px #868C8F, -20px -20px 60px #ffffff, inset 0 0 0 rgba(255, 255, 255, 0.3)',
                      border: '2px solid rgba(134, 140, 143, 0.3)',
                      overflow: 'visible',
                    }}
                  >
                    {/* Unfilled Circle Outline - visual guide showing circular path */}
                    <svg
                      className="absolute pointer-events-none"
                      style={{
                        left: '50%',
                        top: '50%',
                        transform: 'translate(-50%, -50%)',
                        width: '360px',
                        height: '360px',
                      }}
                    >
                      <circle
                        cx="180"
                        cy="180"
                        r="160"
                        fill="none"
                        stroke="#868C8F"
                        strokeWidth="2"
                        strokeDasharray="5,5"
                        opacity="0.5"
                      />
                    </svg>

                    {/* Cards arranged in circular path inside blob */}
                    <div
                      className="absolute"
                      style={{
                        left: '50%',
                        top: '50%',
                        transform: 'translate(-50%, -50%)',
                        width: '360px',
                        height: '360px',
                      }}
                    >
                      {summaryCards.map((card, index) => {
                        const position = getCardPosition(index, summaryCards.length);
                        return (
                          <div
                            key={index}
                            className="absolute"
                            style={{
                              left: `calc(50% + ${position.x}px)`,
                              top: `calc(50% + ${position.y}px)`,
                              transform: 'translate(-50%, -50%)',
                              zIndex: 10,
                            }}
                          >
                            <SummaryCard
                              title={card.title}
                              value={card.value}
                              color={card.color}
                              icon={card.icon}
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

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
