import { redirect } from 'next/navigation';

import { getServerSession } from '../lib/server-auth';

export const dynamic = 'force-dynamic';

export default async function RootPage() {
  const session = await getServerSession();

  if (session) {
    redirect('/dashboard');
  }

  redirect('/login');
}
