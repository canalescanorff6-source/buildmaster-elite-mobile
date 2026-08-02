import { AuthGate } from '@/components/AuthGate';
import { CardVisionApp } from '@/components/CardVisionApp';

export default function BuildMasterHomePage() {
  return (
    <AuthGate>
      <CardVisionApp />
    </AuthGate>
  );
}
