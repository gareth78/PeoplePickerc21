'use client';

import { useEffect, useState } from 'react';

interface UserAvatarProps {
  email: string;
  displayName: string;
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

export default function UserAvatar({
  email,
  displayName,
  size = 'medium',
  className = ''
}: UserAvatarProps) {
  const [photo, setPhoto] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/graph/photo/${encodeURIComponent(email)}`)
      .then(res => res.json())
      .then(data => {
        setPhoto(data.photo);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, [email]);

  const getInitials = () => {
    const names = displayName.split(' ');
    if (names.length >= 2) {
      return `${names[0].charAt(0)}${names[names.length - 1].charAt(0)}`.toUpperCase();
    }
    return displayName.substring(0, 2).toUpperCase();
  };

  const sizeClasses = {
    small: 'w-9 h-9 text-sm',
    medium: 'w-16 h-16 text-2xl',
    large: 'w-24 h-24 text-4xl'
  };

  if (photo && !loading) {
    return (
      <img
        src={photo}
        alt={displayName}
        className={`${sizeClasses[size]} rounded-full object-cover ${className}`}
      />
    );
  }

  return (
    <div
      className={`${sizeClasses[size]} rounded-full bg-primary text-white flex items-center justify-center font-semibold ${className}`}
    >
      {loading ? '...' : getInitials()}
    </div>
  );
}
