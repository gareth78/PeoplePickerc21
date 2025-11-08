'use client';

import { ReactNode, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  Shield,
  Users,
  FileText,
  LogOut,
  Home,
  AlertTriangle,
  Settings,
} from 'lucide-react';

interface AdminLayoutProps {
  children: ReactNode;
}

interface AdminSession {
  email: string;
  isEmergency: boolean;
  exp?: number;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [session, setSession] = useState<AdminSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/admin/session', { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        if (data.authenticated) {
          setSession(
            data.session ?? {
              email: data.email,
              isEmergency: false,
            }
          );
          return;
        }

        const params = new URLSearchParams();
        params.set('error', data.reason ?? 'unauthorized');
        if (data.email) {
          params.set('email', data.email);
        }
        router.push(`/?${params.toString()}`);
      } else {
        router.push('/?error=unauthorized');
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      router.push('/?error=auth-failed');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/admin/logout', { method: 'POST' });
      router.push('/');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-12 h-12 text-blue-600 animate-pulse mx-auto mb-4" />
          <p className="text-gray-600">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  const navigation = [
    { name: 'Dashboard', href: '/admin/dashboard', icon: Home },
    { name: 'Users', href: '/admin/users', icon: Users },
    { name: 'Audit Logs', href: '/admin/audit', icon: FileText },
    { name: 'Configuration', href: '/admin/configuration', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation */}
      <nav className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo and Title */}
            <div className="flex items-center">
              <Shield className="w-8 h-8 text-blue-600 mr-3" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  Admin Panel
                </h1>
                <p className="text-xs text-gray-500">
                  People Picker Management
                </p>
              </div>
            </div>

            {/* User Info and Logout */}
            <div className="flex items-center space-x-4">
              {session?.isEmergency && (
                <div className="flex items-center bg-red-50 border border-red-200 rounded-lg px-3 py-1.5">
                  <AlertTriangle className="w-4 h-4 text-red-600 mr-2" />
                  <span className="text-sm font-medium text-red-700">
                    Emergency Access
                  </span>
                </div>
              )}
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">
                  {session?.email}
                </p>
                <p className="text-xs text-gray-500">Administrator</p>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center text-gray-700 hover:text-red-600 transition-colors"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Secondary Navigation */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8" aria-label="Secondary navigation">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <button
                  key={item.name}
                  onClick={() => router.push(item.href)}
                  className={`
                    flex items-center py-4 px-1 border-b-2 text-sm font-medium transition-colors
                    ${
                      isActive
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  <Icon className="w-5 h-5 mr-2" />
                  {item.name}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-center text-sm text-gray-500">
            {session?.isEmergency
              ? '⚠️ Emergency session - expires in 1 hour'
              : 'Session valid for 24 hours'}
          </p>
        </div>
      </footer>
    </div>
  );
}
