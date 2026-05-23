import type { UserPlan } from './types';

export const PLAN_LIMITS: Record<UserPlan, { tokens: number; fileUploads: number }> = {
  Free:      { tokens: 5000,   fileUploads: 5  },
  Pro:       { tokens: 100000, fileUploads: 50 },
  Unlimited: { tokens: -1,     fileUploads: -1 },
};
