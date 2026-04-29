// ═══════════════════════════════════════════════════════════
// reBorn_i — TypeScript Interfaces
// Aligned to backend Pydantic schemas (app/schemas/schemas.py)
// ═══════════════════════════════════════════════════════════

export interface User {
  id: string;
  email: string;
  full_name: string | null;
  is_active: boolean;
  auth_provider: string | null;
  avatar_url: string | null;
  subscription_plan: 'free' | 'pro';
  subscription_started_at: string | null;
  created_at: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

// ── Resume ──────────────────────────────────────────────

export interface ResumeSkill {
  name: string;
  category: string | null;
  proficiency: string | null;
}

export interface ResumeExperience {
  title: string;
  company: string | null;
  duration: string | null;
  description: string | null;
  skills_used: string[];
}

export interface ResumeEducation {
  degree: string | null;
  institution: string | null;
  year: string | null;
  field_of_study: string | null;
}

export interface ResumeSection {
  heading: string;
  normalized_key: string;
  content: string[];
  sub_sections: ResumeSection[];
  confidence: number;
}

export interface StructuredResume {
  full_name: string | null;
  email: string | null;
  phone: string | null;
  summary: string | null;
  skills: ResumeSkill[];
  experience: ResumeExperience[];
  education: ResumeEducation[];
  certifications: string[];
  total_experience_years: number | null;
  experience_level: string | null;
  sections: ResumeSection[];
  other_sections: ResumeSection[];
}

export interface ResumeUploadResponse {
  id: string;
  filename: string;
  status: string;
  structured_data: StructuredResume | null;
  skills_count: number;
  created_at: string;
}

// ── Rejection Analysis (5-Layer Model) ──────────────────

export interface ComponentScore {
  component: string;
  score: number;
  weight: number;
  weighted_score: number;
  details: string | null;
}

export interface RiskLayerScore {
  layer: string;
  label: string;
  risk: number;
  weight: number;
  weighted_risk: number;
  contribution_percent: number;
  details: Record<string, unknown> | null;
}

export interface ConfidenceInterval {
  lower: number;
  upper: number;
  margin: number;
}

export interface RejectionAnalysisResponse {
  id: string;
  final_risk_percent: number;
  risk_score: number;
  risk_level: string; // Low | Moderate | High | Critical
  risk_breakdown: Record<string, number>;
  highest_risk_area: string;
  secondary_risk_area: string;
  why_risk_is_high: string;
  recommended_actions: string[];
  behavior_guidance_message: string;
  confidence_interval: ConfidenceInterval;
  component_scores: RiskLayerScore[];
  top_rejection_reasons: string[];
  skill_gaps: string[];
  chart_base64: string | null;
  job_title: string | null;
  domain_detected: string; // "Tech" | "Non-Tech"
  model_used: string; // "TECH_MODEL" | "NON_TECH_MODEL"
  explanation: Record<string, unknown> | null;
  created_at: string;
}

// ── Market Radar ────────────────────────────────────────

export interface SkillDemandEntry {
  skill: string;
  frequency: number;
  demand_index: number;
  rank: number;
}

export interface MarketRadarResponse {
  top_skills: SkillDemandEntry[];
  total_jobs_analyzed: number;
  snapshot_date: string;
  user_future_proof_score: number | null;
  user_aligned_skills: string[];
  user_missing_high_demand: string[];
}

// ── Career Simulation ───────────────────────────────────

export interface SimulationMetrics {
  risk_score: number;
  skill_gaps: string[];
  matched_skills: string[];
  component_scores: ComponentScore[];
}

export interface CareerSimulationResponse {
  id: string;
  before_metrics: SimulationMetrics;
  after_metrics: SimulationMetrics;
  risk_delta: number;
  skills_added: string[];
  skills_removed: string[];
  explanation: Record<string, unknown> | null;
  created_at: string;
}

// ── Blueprint ───────────────────────────────────────────

export interface BlueprintResponse {
  id: string;
  plan_type: string;
  target_role: string;
  plan_data: Record<string, any>;
  risk_score_at_creation: number | null;
  prompt_template_version: string | null;
  created_at: string;
}

// ── Health ──────────────────────────────────────────────

export interface HealthResponse {
  status: string;
  version: string;
  environment: string;
  database: string;
  timestamp: string;
}
// ── Hiring Pipeline Simulation ──────────────────────────

export interface HiringPipelineSurvival {
  ATS_survival_raw: number;
  Recruiter_survival_raw: number;
  Market_survival_raw: number;
  ATS_stage_compounded: number;
  Recruiter_stage_compounded: number;
  Market_stage_compounded: number;
  Final_Interview_Probability: number;
}

export interface HiringPipelineConfidenceInterval {
  lower: number;
  upper: number;
}

export interface HiringPipelineResponse {
  domain_detected: string;
  pipeline_survival: HiringPipelineSurvival;
  pipeline_survival_percent: HiringPipelineSurvival;
  primary_bottleneck_stage: string;
  secondary_bottleneck_stage: string;
  why_this_stage_is_weak: string;
  improvement_actions: string[];
  behavior_guidance_message: string;
  confidence_interval: HiringPipelineConfidenceInterval;
  confidence_interval_percent: HiringPipelineConfidenceInterval;
  chart_base64: string | null;
}

export interface HiringPipelineRequest {
  ATS_risk: number;
  Recruiter_risk: number;
  Market_risk: number;
  Grammar_risk: number;
  Formatting_risk: number;
  domain: 'TECH' | 'NON_TECH';
}

// ── Profile / List Summaries ─────────────────────────────

export interface ResumeSummary {
  id: string;
  filename: string;
  skills_count: number;
  experience_level: string | null;
  created_at: string;
}

export interface AnalysisSummary {
  id: string;
  job_title: string | null;
  risk_score: number;
  risk_level: string;
  created_at: string;
}

// ── Payment ──────────────────────────────────────────

export interface PaymentCreateResponse {
  order_id: string;
  amount: number;
  currency: string;
  status: string;
  created_at: string;
}

export interface PaymentVerifyRequest {
  razorpay_payment_id: string;
  razorpay_signature: string;
}

export interface PaymentVerifyResponse {
  success: boolean;
  message: string;
  subscription_plan: string;
}
