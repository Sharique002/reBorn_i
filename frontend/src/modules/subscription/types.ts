export type SubscriptionPlan = 'free' | 'pro';

export type PaymentStatus = 'idle' | 'processing' | 'success' | 'failed';

export type SubscriptionFeature =
  | 'pipeline_basic'
  | 'pipeline_breakdown'
  | 'diagnosis'
  | 'skill_gaps'
  | 'simulation'
  | 'action_plan'
  | 'career_pivot'
  | 'resume_tracking'
  | 'resume_upload';

export interface FeatureGate {
  isLocked: boolean;
  upgradeMessage: string;
  featureName: string;
}

export interface SubscriptionStatusResponse {
  plan: SubscriptionPlan;
  usageCount: number;
  hasAccess: boolean;
  featureAccess: Partial<Record<SubscriptionFeature, FeatureGate>>;
}

export interface SubscriptionUpgradeResponse {
  success: boolean;
  message: string;
  subscription_plan: SubscriptionPlan;
}
