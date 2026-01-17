import { useMemo } from 'react';

const Avatar = ({ seed, name, size = 'md', className = '' }) => {
  // Use DiceBear API with "personas" style
  // Fallback to email or name if seed not provided
  const avatarSeed = seed || name || 'default';
  
  // DiceBear API URL - using "personas" style
  const avatarUrl = useMemo(() => {
    return `https://api.dicebear.com/7.x/personas/svg?seed=${encodeURIComponent(avatarSeed)}`;
  }, [avatarSeed]);

  const sizeClasses = {
    xs: 'w-6 h-6',
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-16 h-16',
    xl: 'w-20 h-20',
    '2xl': 'w-32 h-32',
  };

  return (
    <div className={`${sizeClasses[size]} ${className} rounded-full overflow-hidden bg-gray-100 flex items-center justify-center flex-shrink-0`}>
      <img
        src={avatarUrl}
        alt={name || 'Avatar'}
        className="w-full h-full object-contain"
        onError={(e) => {
          // Fallback to initials if image fails to load
          e.target.style.display = 'none';
          e.target.parentElement.innerHTML = `<span class="text-gray-600 font-medium text-xs">${(name || '?').charAt(0).toUpperCase()}</span>`;
        }}
      />
    </div>
  );
};

export default Avatar;
