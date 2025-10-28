import DiagnosticsClient from './DiagnosticsClient';
import { cache } from '@/lib/cache';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const runtime = 'nodejs';

export default async function DiagnosticsPage() {
  const stats = await cache.stats();

  return <DiagnosticsClient initialCacheStats={stats} />;
}
