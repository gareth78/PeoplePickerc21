'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface AdminCheckResponse {
  ok: boolean;
  data?: {
    isAdmin: boolean;
    email: string | null;
  };
  error?: string;
}

export default function Footer() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  // Get version info
  const version = process.env.NEXT_PUBLIC_GIT_SHA || 'dev';
  const buildTime = process.env.NEXT_PUBLIC_BUILD_TIME;
  const buildDate = buildTime
    ? new Date(buildTime).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '';

  useEffect(() => {
    // Check if user is admin
    fetch('/api/admin/check')
      .then((res) => res.json())
      .then((data: AdminCheckResponse) => {
        if (data.ok && data.data?.isAdmin) {
          setIsAdmin(true);
        }
      })
      .catch((error) => {
        console.error('Error checking admin status:', error);
      })
      .finally(() => {
        setIsChecking(false);
      });
  }, []);

  return (
    <footer className="text-center mt-8 pb-6">
      <div className="flex items-center justify-center gap-2 text-sm">
        <span className="text-gray-500">
          version {version}
          {buildDate && ` • ${buildDate}`}
        </span>
        {!isChecking && isAdmin && (
          <>
            <span className="text-gray-400">•</span>
            <Link
              href="/admin/dashboard"
              className="text-blue-600 hover:text-blue-700 font-medium transition-colors"
            >
              Admin
            </Link>
          </>
        )}
      </div>
    </footer>
  );
}
