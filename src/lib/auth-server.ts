import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function getSession() {
  return getServerSession(authOptions);
}

/** API route'larda: session yoksa 401 döndür */
export async function requireSession() {
  const session = await getSession();
  if (!session?.user?.gtawId) {
    return { session: null, gtawId: null, error: true as const };
  }
  return { session, gtawId: session.user.gtawId, error: false as const };
}
