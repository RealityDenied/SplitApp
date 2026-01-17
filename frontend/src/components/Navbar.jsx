import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import Avatar from './Avatar';
import AvatarSelector from './AvatarSelector';
import api from '../services/api';

const Navbar = () => {
  const { user, logout, updateUser } = useContext(AuthContext);
  const navigate = useNavigate();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showAvatarSelector, setShowAvatarSelector] = useState(false);
  const [newAvatarSeed, setNewAvatarSeed] = useState(user?.avatarSeed || '');
  const [updatingAvatar, setUpdatingAvatar] = useState(false);
  const menuRef = useRef(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
      // Don't close avatar selector modal on outside click - use backdrop click instead
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAvatarSelect = (seed) => {
    setNewAvatarSeed(seed);
  };

  const handleSaveAvatar = async () => {
    if (!newAvatarSeed || newAvatarSeed.trim() === '') {
      alert('Please select an avatar');
      return;
    }

    try {
      setUpdatingAvatar(true);
      const response = await api.put('/users/avatar', { avatarSeed: newAvatarSeed.trim() });
      
      // Refresh user data from backend to get updated avatar
      const userResponse = await api.get('/auth/me');
      if (updateUser && userResponse.data) {
        updateUser(userResponse.data);
      }
      
      setShowAvatarSelector(false);
      setShowProfileMenu(false);
    } catch (error) {
      console.error('Failed to update avatar:', error);
      alert(error.response?.data?.message || 'Failed to update avatar. Please try again.');
    } finally {
      setUpdatingAvatar(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo/Brand */}
          <div
            onClick={() => navigate('/dashboard')}
            className="flex items-center cursor-pointer"
          >
            <h1 className="text-xl font-bold text-blue-600">SplitMint</h1>
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-3">
            {/* Edit Avatar Button */}
            <button
              onClick={() => {
                setShowAvatarSelector(true);
                setNewAvatarSeed(user?.avatarSeed || user?.email || '');
              }}
              className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              title="Edit Avatar"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
              <span className="hidden sm:inline">Edit Avatar</span>
            </button>

            {/* Profile Menu */}
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <Avatar
                  seed={user?.avatarSeed || user?.email}
                  name={user?.name || user?.email}
                  size="md"
                />
                <div className="hidden md:block text-left">
                  <p className="text-sm font-medium text-gray-900">
                    {user?.name || 'User'}
                  </p>
                  <p className="text-xs text-gray-500">{user?.email}</p>
                </div>
                <svg
                  className="w-5 h-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>

              {/* Dropdown Menu */}
              {showProfileMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                  <div className="px-4 py-3 border-b border-gray-200">
                    <div className="flex items-center space-x-3">
                      <Avatar
                        seed={user?.avatarSeed || user?.email}
                        name={user?.name || user?.email}
                        size="md"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {user?.name || 'User'}
                        </p>
                        <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                      />
                    </svg>
                    <span>Logout</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Avatar Selector Modal */}
          {showAvatarSelector && (
            <div 
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
              onClick={(e) => {
                // Close modal when clicking backdrop
                if (e.target === e.currentTarget) {
                  setShowAvatarSelector(false);
                  setNewAvatarSeed(user?.avatarSeed || user?.email || '');
                }
              }}
            >
              <div 
                className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                  <h3 className="text-xl font-semibold text-gray-900">Change Avatar</h3>
                  <button
                    onClick={() => {
                      setShowAvatarSelector(false);
                      setNewAvatarSeed(user?.avatarSeed || user?.email || '');
                    }}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                </div>
                <div className="p-6 overflow-y-auto flex-1">
                  <AvatarSelector
                    currentSeed={newAvatarSeed || user?.avatarSeed || user?.email}
                    onSelect={handleAvatarSelect}
                    label=""
                  />
                </div>
                <div className="p-6 border-t border-gray-200 flex space-x-3">
                  <button
                    onClick={handleSaveAvatar}
                    disabled={updatingAvatar}
                    className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-base font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {updatingAvatar ? 'Saving...' : 'Save Avatar'}
                  </button>
                  <button
                    onClick={() => {
                      setShowAvatarSelector(false);
                      setNewAvatarSeed(user?.avatarSeed || user?.email || '');
                    }}
                    className="px-6 py-3 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 text-base font-medium transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
