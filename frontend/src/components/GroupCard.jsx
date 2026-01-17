import { useNavigate } from 'react-router-dom';
import Avatar from './Avatar';

const GroupCard = ({ group }) => {
  const navigate = useNavigate();

  const totalParticipants = 1 + (group.participants?.length || 0); // Creator + participants

  // Get all users (creator + participants) for avatar stack
  const allUsers = [];
  if (group.creator) {
    allUsers.push({
      _id: group.creator._id || group.creator,
      name: group.creator.name || group.creator.email,
      email: group.creator.email,
      avatarSeed: group.creator.avatarSeed,
    });
  }
  if (group.participants) {
    group.participants.forEach((participant) => {
      if (participant.user) {
        allUsers.push({
          _id: participant.user._id || participant.user,
          name: participant.user.name || participant.user.email,
          email: participant.user.email,
          avatarSeed: participant.user.avatarSeed,
        });
      }
    });
  }

  // Show max 5 avatars, then show "+X" for remaining
  const maxAvatars = 5;
  const visibleUsers = allUsers.slice(0, maxAvatars);
  const remainingCount = allUsers.length - maxAvatars;

  const handleClick = () => {
    navigate(`/groups/${group._id}`);
  };

  // Golden ratio: φ = 1.618
  // For cards: if width is W, height = W / φ
  // Using width of ~320px, height = 320 / 1.618 ≈ 198px
  // Border radius based on golden ratio: smaller radius = base / φ
  const cardWidth = 320;
  const cardHeight = cardWidth / 1.618; // ≈ 198px
  const baseRadius = 16;
  const borderRadius = baseRadius / 1.618; // ≈ 10px

  return (
    <div
      className="cursor-pointer relative"
      style={{
        background: 'linear-gradient(145deg, #e5e7eb, #d1d5db)',
        borderRadius: `${borderRadius}px`,
        border: '1px solid rgba(134, 140, 143, 0.2)',
        boxShadow: '0 4px 12px rgba(134, 140, 143, 0.3), 0 2px 6px rgba(134, 140, 143, 0.2)',
        width: `${cardWidth}px`,
        height: `${cardHeight}px`,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        overflow: 'hidden',
      }}
      onClick={handleClick}
    >
      <div className="flex-1 flex flex-col p-6 pr-16">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="text-xl font-bold text-gray-800 mb-2 truncate" style={{ fontFamily: 'Inter, sans-serif' }}>
              {group.name}
            </h3>
          </div>
        </div>
        <div className="flex items-center space-x-2 mb-3">
          {/* Avatar Stack */}
          <div className="flex items-center" style={{ marginLeft: '-8px' }}>
            {visibleUsers.map((user, index) => (
              <div
                key={user._id}
                style={{
                  marginLeft: index > 0 ? '-12px' : '0',
                  zIndex: visibleUsers.length - index,
                }}
                className="relative"
              >
                <div className="border-2 border-white rounded-full">
                  <Avatar
                    seed={user.avatarSeed || user.email}
                    name={user.name || user.email}
                    size="sm"
                  />
                </div>
              </div>
            ))}
            {remainingCount > 0 && (
              <div
                style={{
                  marginLeft: '-12px',
                  zIndex: 0,
                }}
                className="relative"
              >
                <div className="border-2 border-white rounded-full bg-gray-200 flex items-center justify-center" style={{ width: '32px', height: '32px' }}>
                  <span className="text-xs font-semibold text-gray-700">+{remainingCount}</span>
                </div>
              </div>
            )}
          </div>
          {/* Member count text */}
          <span className="text-xs text-gray-600 font-medium whitespace-nowrap">
            {totalParticipants} {totalParticipants === 1 ? 'member' : 'members'}
          </span>
        </div>
      </div>
      <p className="text-xs text-gray-500 mt-auto px-6 pb-6">
        Created {new Date(group.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
      </p>
      
      {/* Full-height arrow button on right - no background, arrow matches card height */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          handleClick();
        }}
        className="absolute right-0 top-0 bottom-0 w-20 flex items-center justify-center transition-all duration-200 z-10 bg-transparent"
      >
        <svg 
          className="text-gray-500" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          style={{ 
            width: `${cardHeight * 0.6}px`, 
            height: `${cardHeight * 0.6}px`,
            color: '#6b7280'
          }}
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth="16"
            d="M25 20 L75 50 L25 80" 
          />
        </svg>
      </button>
    </div>
  );
};

export default GroupCard;
