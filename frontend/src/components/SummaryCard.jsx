import React from 'react';

const SummaryCard = ({ title, value, icon, color = 'blue' }) => {
  const colorConfig = {
    blue: {
      gradient: 'linear-gradient(135deg, #7EC8F8 0%, #5BA3D1 100%)',
      glow: '0 0 40px rgba(126, 200, 248, 0.4), 0 0 80px rgba(126, 200, 248, 0.2)',
      text: '#0A4A6B',
      bg: 'rgba(126, 200, 248, 0.1)',
    },
    green: {
      gradient: 'linear-gradient(135deg, #4ADE80 0%, #22C55E 100%)',
      glow: '0 0 40px rgba(74, 222, 128, 0.4), 0 0 80px rgba(74, 222, 128, 0.2)',
      text: '#14532D',
      bg: 'rgba(74, 222, 128, 0.1)',
    },
    red: {
      gradient: 'linear-gradient(135deg, #F87171 0%, #EF4444 100%)',
      glow: '0 0 40px rgba(248, 113, 113, 0.4), 0 0 80px rgba(248, 113, 113, 0.2)',
      text: '#7F1D1D',
      bg: 'rgba(248, 113, 113, 0.1)',
    },
  };

  const config = colorConfig[color] || colorConfig.blue;

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div
      className="relative"
      style={{
        width: '180px',
        height: '180px',
      }}
    >
      <div
        className="w-full h-full flex flex-col items-center justify-center p-5 cursor-pointer"
        style={{
          background: config.gradient,
          boxShadow: config.glow,
          borderRadius: '50% 40% 30% 70% / 60% 30% 70% 40%', // Blob shape
        }}
      >
        <div className="mb-2" style={{ color: 'white', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' }}>
          {React.cloneElement(icon, { className: 'w-8 h-8' })}
        </div>
        <p className="text-white text-xs font-medium mb-1 opacity-90 text-center" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.1)' }}>
          {title}
        </p>
        <p className="text-white text-lg font-bold text-center" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>
          {formatCurrency(value || 0)}
        </p>
      </div>
    </div>
  );
};

export default SummaryCard;
