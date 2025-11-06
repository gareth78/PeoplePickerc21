'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';

interface AdminCheckResponse {
  ok: boolean;
  data?: {
    isAdmin: boolean;
    email: string | null;
  };
  error?: string;
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isChecking, setIsChecking] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // Check admin status
    fetch('/api/admin/check')
      .then((res) => res.json())
      .then((data: AdminCheckResponse) => {
        if (data.ok && data.data?.isAdmin) {
          setIsAdmin(true);
        } else {
          // Not admin, redirect to home
          router.push('/?error=admin_required');
        }
      })
      .catch((error) => {
        console.error('Error checking admin status:', error);
        router.push('/?error=admin_check_failed');
      })
      .finally(() => {
        setIsChecking(false);
      });
  }, [router]);

  // Show loading state while checking
  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Verifying admin access...</div>
      </div>
    );
  }

  // Don't render if not admin (will redirect)
  if (!isAdmin) {
    return null;
  }

  // Navigation items
  const navItems = [
    {
      href: '/admin/dashboard',
      label: 'Dashboard',
      icon: '📊',
    },
    {
      href: '/admin/users',
      label: 'Users',
      icon: '👥',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-white border-r border-gray-200 min-h-screen">
          <div className="p-6">
            <Link href="/" className="block mb-8">
              <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
              <p className="text-sm text-gray-500 mt-1">People Finder</p>
            </Link>

            <nav className="space-y-1">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`
                      flex items-center gap-3 px-4 py-2.5 rounded-lg
                      transition-colors text-sm font-medium
                      ${
                        isActive
                          ? 'bg-blue-50 text-blue-700'
                          : 'text-gray-700 hover:bg-gray-50'
                      }
                    `}
                  >
                    <span className="text-lg">{item.icon}</span>
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Back to app link */}
          <div className="absolute bottom-0 left-0 right-0 w-64 p-6 border-t border-gray-200">
            <Link
              href="/"
              className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              <span>←</span>
              <span>Back to App</span>
            </Link>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 p-8">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}
