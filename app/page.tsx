import LoginForm from '@/components/LoginForm';
import {Card} from '@tremor/react';

import {getSession} from './actions';

export default async function LoginPage() {
  const user = await getSession();
  return (
    <Card className="p-4 h-full flex flex-col min-h-screen gap-2">
      <LoginForm loggedIn={user.isLoggedIn} />
    </Card>
  );
}
