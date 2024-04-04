import LoginForm from '@/components/LoginForm';
import {Card} from '@tremor/react';

export default async function LoginPage() {
  return (
    <Card className="p-4 h-full flex flex-col min-h-screen gap-2">
      <LoginForm />
    </Card>
  );
}
