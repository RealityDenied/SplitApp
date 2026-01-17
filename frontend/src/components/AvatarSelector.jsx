import { useState, useEffect } from 'react';
import Avatar from './Avatar';

const AvatarSelector = ({ currentSeed, onSelect, label = 'Choose Avatar' }) => {
  const [selectedSeed, setSelectedSeed] = useState(currentSeed || '');
  const [customSeed, setCustomSeed] = useState('');

  // Generate random seeds for quick selection
  const quickSeeds = [
    'happy',
    'cool',
    'awesome',
    'smile',
    'star',
    'moon',
    'sun',
    'heart',
    'diamond',
    'circle',
    'square',
    'triangle',
  ];

  useEffect(() => {
    if (currentSeed) {
      setSelectedSeed(currentSeed);
      if (!customSeed) {
        setCustomSeed('');
      }
    }
  }, [currentSeed]);

  const handleQuickSelect = (seed) => {
    setSelectedSeed(seed);
    setCustomSeed('');
    if (onSelect) {
      onSelect(seed);
    }
  };

  const handleCustomSeed = (e) => {
    const seed = e.target.value.trim();
    setCustomSeed(seed);
    if (seed) {
      setSelectedSeed(seed);
      if (onSelect) {
        onSelect(seed);
      }
    }
  };

  const handleRandom = () => {
    const randomSeed = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    setSelectedSeed(randomSeed);
    setCustomSeed(randomSeed);
    if (onSelect) {
      onSelect(randomSeed);
    }
  };

  return (
    <div className="space-y-6">
      {label && <label className="block text-base font-medium text-gray-700">{label}</label>}
      
      {/* Selected Avatar Preview */}
      <div className="flex items-center space-x-4 p-6 bg-gray-50 rounded-lg">
        <Avatar seed={selectedSeed || 'default'} size="2xl" />
        <div className="flex-1 min-w-0">
          <p className="text-base font-medium text-gray-900">Preview</p>
          <p className="text-sm text-gray-500 truncate">Your avatar will look like this</p>
        </div>
      </div>

      {/* Quick Selection */}
      <div>
        <p className="text-sm font-medium text-gray-700 mb-3">Quick Select</p>
        <div className="grid grid-cols-6 gap-3">
          {quickSeeds.map((seed) => (
            <button
              key={seed}
              type="button"
              onClick={() => handleQuickSelect(seed)}
              className={`p-3 rounded-lg border-2 transition-all flex items-center justify-center ${
                selectedSeed === seed
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <Avatar seed={seed} size="lg" />
            </button>
          ))}
        </div>
      </div>

      {/* Custom Seed Input */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Custom Avatar
        </label>
        <div className="flex space-x-3">
          <input
            type="text"
            value={customSeed}
            onChange={handleCustomSeed}
            placeholder="Enter any text for unique avatar"
            className="flex-1 px-4 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
          />
          <button
            type="button"
            onClick={handleRandom}
            className="px-4 py-2.5 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 text-sm whitespace-nowrap font-medium"
          >
            Random
          </button>
        </div>
        <p className="mt-2 text-sm text-gray-500">
          Any text will generate a unique avatar
        </p>
      </div>
    </div>
  );
};

export default AvatarSelector;
