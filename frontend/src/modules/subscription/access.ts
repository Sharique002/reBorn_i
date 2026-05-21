import type { FeatureGate, SubscriptionFeature, SubscriptionPlan } from './types';

export const FREE_FEATURES = new Set<SubscriptionFeature>([
  'pipeline_basic',
]);

export const FEATURE_COPY: Record<SubscriptionFeature, Omit<FeatureGate, 'isLocked'>> = {
  pipeline_basic: {
    featureName: 'Hiring Pipeline Basic View',
    upgradeMessage: 'Free users can view high-level hiring probability and stage survival.',
  },
  pipeline_breakdown: {
    featureName: 'Full Pipeline Breakdown',
    upgradeMessage: 'Unlock the detailed breakdown behind each hiring-stage probability.',
  },
  diagnosis: {
    featureName: 'Full Rejection Diagnosis',
    upgradeMessage: "See exactly why you're getting rejected and how to improve.",
  },
  skill_gaps: {
    featureName: 'Skill Gap Analysis',
    upgradeMessage: 'Unlock missing skills, priority gaps, and practical next steps.',
  },
  simulation: {
    featureName: 'Skill ROI Simulator',
    upgradeMessage: 'Simulate which skills move your interview odds before you spend time learning them.',
  },
  action_plan: {
    featureName: 'Personalized Action Plan',
    upgradeMessage: 'Unlock a focused plan that turns your diagnosis into weekly execution.',
  },
  career_pivot: {
    featureName: 'Career Pivot Suggestions',
    upgradeMessage: 'Find adjacent roles, transition timelines, and skill bridges from your current profile.',
  },
  resume_tracking: {
    featureName: 'Resume Tracking',
    upgradeMessage: 'Track resume versions, score movement, and progress after every improvement.',
  },
  resume_upload: {
    featureName: 'Additional Resume Uploads',
    upgradeMessage: 'Upgrade to analyze unlimited resume versions and compare your progress.',
  },
};

export function getFeatureGate(
  plan: SubscriptionPlan,
  feature: SubscriptionFeature,
  override?: FeatureGate
): FeatureGate {
  if (override) return override;

  const copy = FEATURE_COPY[feature];
  return {
    isLocked: plan !== 'pro' && !FREE_FEATURES.has(feature),
    upgradeMessage: copy.upgradeMessage,
    featureName: copy.featureName,
  };
}
