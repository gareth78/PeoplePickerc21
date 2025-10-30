'use client';

import { useEffect, useState } from 'react';
import PresenceBadge from './PresenceBadge';

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
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    // Create abort controller for cleanup
    const abortController = new AbortController();
    let mounted = true;

    const fetchPhoto = async () => {
      try {
        const response = await fetch(
          `/api/graph/photo/${encodeURIComponent(email.toLowerCase().trim())}`,
          { signal: abortController.signal }
        );

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();

        // Only update state if component is still mounted
        if (mounted && !abortController.signal.aborted) {
          setPhoto(data.photo || null);
          setLoading(false);
        }
      } catch (error) {
        // Ignore abort errors
        if (error instanceof Error && error.name === 'AbortError') {
          return;
        }

        // Only update state if component is still mounted
        if (mounted && !abortController.signal.aborted) {
          console.error('Failed to fetch photo:', error);
          setPhoto(null);
          setLoading(false);
        }
      }
    };

    void fetchPhoto();

    // Cleanup function
    return () => {
      mounted = false;
      abortController.abort();
    };
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

  if (photo && !loading && !imageError) {
    return (
      <div className={`relative ${className}`}>
        <img
          src={photo}
          alt={displayName}
          onError={() => setImageError(true)}
          className={`${sizeClasses[size]} rounded-full object-cover`}
        />
        <div className="absolute bottom-0 right-0">
          <PresenceBadge email={email} size={size === 'small' ? 'small' : 'medium'} />
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <div
        className={`${sizeClasses[size]} rounded-full bg-primary text-white flex items-center justify-center font-semibold`}
      >
        {loading ? '...' : getInitials()}
      </div>
      <div className="absolute bottom-0 right-0">
        <PresenceBadge email={email} size={size === 'small' ? 'small' : 'medium'} />
      </div>
    </div>
  );
}
