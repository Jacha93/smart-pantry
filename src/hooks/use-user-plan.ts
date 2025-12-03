'use client';

import { useState, useEffect } from 'react';
import { profileAPI } from '@/lib/api';
import { auth } from '@/lib/auth';

export type UserPlan = 'free' | 'basic' | 'pro';

/**
 * Hook to get the current user's plan
 * Returns 'free' if user is not authenticated or if there's an error
 */
export function useUserPlan(): { plan: UserPlan; isLoading: boolean } {
  const [plan, setPlan] = useState<UserPlan>('free');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPlan = async () => {
      if (!auth.isAuthenticated()) {
        setPlan('free');
        setIsLoading(false);
        return;
      }

      try {
        const response = await profileAPI.get();
        const profile = response.data;
        
        if (profile && profile.quotas) {
          const { quotas } = profile;
          if (quotas.hasPrioritySupport) {
            setPlan('pro');
          } else if (quotas.maxCacheRecipeSuggestions === 30 && quotas.maxChatMessages === 16) {
            setPlan('basic');
          } else {
            setPlan('free');
          }
        } else {
          setPlan('free');
        }
      } catch (error) {
        console.error('Error fetching user plan:', error);
        setPlan('free');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPlan();
  }, []);

  return { plan, isLoading };
}

