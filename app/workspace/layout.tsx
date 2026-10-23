import { redirect } from 'next/navigation';
import { AuthBoundaryError, requireEmailVerifiedSession } from '@/lib/auth/server';

export default async function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  try {
    await requireEmailVerifiedSession();
  } catch (error) {
    if (error instanceof AuthBoundaryError) redirect('/login?redirect=%2Fworkspace');
    throw error;
  }
  return children;
}
