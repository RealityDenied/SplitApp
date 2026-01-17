import { useNavigate } from 'react-router-dom';

const GroupCard = ({ group }) => {
  const navigate = useNavigate();

  const totalParticipants = 1 + (group.participants?.length || 0); // Creator + participants

  const handleClick = () => {
    navigate(`/groups/${group._id}`);
  };

  return (
    <div
      onClick={handleClick}
      className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-all duration-200 cursor-pointer border border-gray-200 hover:border-blue-500 hover:scale-[1.02]"
    >
      <h3 className="text-xl font-semibold text-gray-900 mb-2">{group.name}</h3>
      <div className="text-sm text-gray-600">
        <p>{totalParticipants} {totalParticipants === 1 ? 'member' : 'members'}</p>
        <p className="mt-1 text-xs text-gray-500">
          Created {new Date(group.createdAt).toLocaleDateString()}
        </p>
      </div>
    </div>
  );
};

export default GroupCard;
