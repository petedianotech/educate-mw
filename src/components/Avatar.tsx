import React from 'react';

export const FEMININE_GRADIENTS = [
  'linear-gradient(135deg, #FF9A9E 0%, #FECFEF 100%)', // Rose Water
  'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)', // Plum Bath
  'linear-gradient(135deg, #fbc2eb 0%, #a6c1ee 100%)', // Purple Blue
  'linear-gradient(135deg, #fdcbf1 0%, #e6dee9 100%)', // Pygmy
  'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)', // Peconic
  'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)', // Peach
  'linear-gradient(135deg, #ff9a9e 0%, #fecfef 99%)',  // Warm Pink
  'linear-gradient(135deg, #ebbba7 0%, #cfc7f8 100%)', // Dusty Rose
  'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', // Sunny Morning
  'linear-gradient(135deg, #ff0844 0%, #ffb199 100%)', // Deep Red
  'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', // Lady Lips
  'linear-gradient(135deg, #6a11cb 0%, #2575fc 100%)'  // Vivid Blue
];

export const MASCULINE_GRADIENTS = [
  'linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%)', // Mint Blue
  'linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 100%)', // Winter Sky
  'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', // Strong Blue
  'linear-gradient(135deg, #0ba360 0%, #3cba92 100%)', // Deep Green
  'linear-gradient(135deg, #00c6fb 0%, #005bea 100%)', // Ocean Blue
  'linear-gradient(135deg, #5ee7df 0%, #b490ca 100%)', // Cyan Purple
  'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)', // Bright Teal
  'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', // Deep Purple
  'linear-gradient(135deg, #13547a 0%, #80d0c7 100%)', // Aqua Splash
  'linear-gradient(135deg, #ff9a03 0%, #ff5d00 100%)', // Burning Orange
  'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)', // Midnight Blue
  'linear-gradient(135deg, #000000 0%, #434343 100%)'  // Dark Knight
];

/**
 * Returns a deterministic gradient based on user gender and a unique string (like an ID)
 */
export function getAvatarGradient(gender: string = 'male', identifier: string = 'default'): string {
  const isFemale = gender.toLowerCase() === 'female';
  const gradients = isFemale ? FEMININE_GRADIENTS : MASCULINE_GRADIENTS;
  
  // Create a simple hash from the identifier to consistently pick the same gradient
  let hash = 0;
  for (let i = 0; i < identifier.length; i++) {
    hash = identifier.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  // Ensure we get a positive index within the gradients length
  const index = Math.abs(hash) % gradients.length;
  return gradients[index];
}

interface AvatarProps {
  user: {
    name?: string;
    gender?: string;
    id?: string;
    avatarGradient?: string; // If already stored
  };
  className?: string;
}

export function Avatar({ user, className = '' }: AvatarProps) {
  // Extract initials (max 2 characters)
  const nameParts = (user?.name || 'User').split(' ').filter(Boolean);
  let initials = nameParts[0]?.charAt(0).toUpperCase() || 'U';
  if (nameParts.length > 1) {
    initials += nameParts[1]?.charAt(0).toUpperCase() || '';
  }

  // Use stored gradient or generate deterministically based on ID/name
  const gradient = user?.avatarGradient || getAvatarGradient(user?.gender, user?.id || user?.name || 'default');

  return (
    <div 
      className={`relative flex items-center justify-center shrink-0 rounded-xl shadow-sm text-gray-900 font-black overflow-hidden hover:scale-105 active:scale-95 transition-transform select-none ${className}`}
      style={{ 
        background: gradient,
        textShadow: '0 1px 2px rgba(255,255,255,0.4)'
      }}
    >
      <span className="relative z-10 tracking-tight">{initials}</span>
    </div>
  );
}
