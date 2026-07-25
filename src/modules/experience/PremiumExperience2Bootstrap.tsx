'use client';

import { useEffect } from 'react';
import { applyPremiumExperience2Preferences, PREMIUM_EXPERIENCE_2_EVENT } from './premiumExperience2';

export function PremiumExperience2Bootstrap() {
  useEffect(() => {
    applyPremiumExperience2Preferences();
    const refresh = () => applyPremiumExperience2Preferences();
    window.addEventListener(PREMIUM_EXPERIENCE_2_EVENT, refresh);
    return () => window.removeEventListener(PREMIUM_EXPERIENCE_2_EVENT, refresh);
  }, []);
  return null;
}
