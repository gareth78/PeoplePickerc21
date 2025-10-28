import DiagnosticsClient from './DiagnosticsClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const runtime = 'nodejs';

export default function DiagnosticsPage() {
  return <DiagnosticsClient />;
}
