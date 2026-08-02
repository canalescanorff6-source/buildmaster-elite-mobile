import { AuthGate } from '@/components/AuthGate';
import { CardVisionApp } from '@/components/CardVisionApp';

export default function LoginPage() {
  return (
    <AuthGate>
      <CardVisionApp />
    </AuthGate>
  );
}
