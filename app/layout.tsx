import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import './globals.css';
import { bootstrapAdmin } from '@/lib/bootstrap';

if (typeof window === 'undefined') {
  void bootstrapAdmin();
}

export const metadata: Metadata = {
  title: 'Org Contact Lookup',
  description: 'Search Okta directory to quickly connect with colleagues',
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
