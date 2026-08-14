import { AuthGate } from '@/components/AuthGate';
import { CardVisionApp } from '@/components/CardVisionApp';
import { AppShellSafetyBoundaryV3930 } from '@/components/AppShellSafetyBoundaryV3930';

export default function HomePage() {
  return (
    <AppShellSafetyBoundaryV3930>
      <AuthGate>
        <CardVisionApp />
      </AuthGate>
    </AppShellSafetyBoundaryV3930>
  );
}
