import { redirect } from 'next/navigation';
import { AuthBoundaryError, requireEmailVerifiedSession } from '@/lib/auth/server';

export default async function ClientModeLayout({ children }: { children: React.ReactNode }) {
  try {
    await requireEmailVerifiedSession();
  } catch (error) {
    if (error instanceof AuthBoundaryError) redirect('/login?redirect=%2Fclient-mode');
    throw error;
  }
  return children;
}
