'use client';

import { useEffect } from 'react';
import { applyExperiencePreferences } from '@/lib/appExperienceV2740';

export function ExperiencePreferenceBootstrap() {
  useEffect(() => { applyExperiencePreferences(); }, []);
  return null;
}
