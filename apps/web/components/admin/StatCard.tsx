// components/admin/StatCard.tsx
'use client';

import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: number;
  icon: LucideIcon;
  iconColor: string;
  gradientFrom: string;
  gradientTo: string;
  loading?: boolean;
}

export function StatCard({
  title,
  value,
  subtitle,
  trend,
  icon: Icon,
  iconColor,
  gradientFrom,
  gradientTo,
  loading = false
}: StatCardProps) {
  return (
    <div className="group relative overflow-hidden rounded-2xl bg-white p-6 shadow-lg transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
      {/* Gradient background */}
      <div className={`absolute inset-0 bg-gradient-to-br ${gradientFrom} ${gradientTo} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />
      
      {/* Content */}
      <div className="relative">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
            {loading ? (
              <div className="h-8 w-24 bg-gray-200 animate-pulse rounded" />
            ) : (
              <h3 className="text-3xl font-bold text-gray-900">{value}</h3>
            )}
            {subtitle && (
              <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
            )}
          </div>
          
          {/* Icon */}
          <div className={`p-3 rounded-xl bg-gradient-to-br ${gradientFrom} ${gradientTo} bg-opacity-10 group-hover:scale-110 transition-transform duration-300`}>
            <Icon className={`w-6 h-6 ${iconColor}`} />
          </div>
        </div>

        {/* Trend indicator */}
        {trend !== undefined && !loading && (
          <div className="mt-4 flex items-center text-sm">
            {trend > 0 ? (
              <>
                <svg className="w-4 h-4 text-green-500 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
                <span className="text-green-600 font-medium">{Math.abs(trend)}%</span>
                <span className="text-gray-500 ml-1">vs last week</span>
              </>
            ) : trend < 0 ? (
              <>
                <svg className="w-4 h-4 text-red-500 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span className="text-red-600 font-medium">{Math.abs(trend)}%</span>
                <span className="text-gray-500 ml-1">vs last week</span>
              </>
            ) : (
              <>
                <span className="text-gray-600 font-medium">No change</span>
                <span className="text-gray-500 ml-1">vs last week</span>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
