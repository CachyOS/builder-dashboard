import AdminShell from '@/components/AdminShell';
import {redirect} from 'next/navigation';

import {getSession} from '../actions';

export default async function Dashboard() {
  const user = await getSession();
  if (!user.isLoggedIn) {
    return redirect('/');
  }
  return <AdminShell />;
}
