// ═══════════════════════════════════════════════════════════
// reBorn_i — API Client
// ═══════════════════════════════════════════════════════════

import axios from 'axios';
import type {
  TokenResponse,
  User,
  ResumeUploadResponse,
  RejectionAnalysisResponse,
  MarketRadarResponse,
  CareerSimulationResponse,
  BlueprintResponse,
  HealthResponse,
  HiringPipelineRequest,
  HiringPipelineResponse,
  ResumeSummary,
  AnalysisSummary,
  PaymentCreateResponse,
  PaymentVerifyRequest,
  PaymentVerifyResponse,
  SubscriptionStatusResponse,
} from '../types';

const getApiBase = () => {
  if (import.meta.env.VITE_API_URL) {
    return `${import.meta.env.VITE_API_URL}/api/v1`;
  }
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
      return 'https://reborni-backend.onrender.com/api/v1';
    }
  }
  return '/api/v1';
};

const apiBase = getApiBase();

const api = axios.create({
  baseURL: apiBase,
  headers: { 'Content-Type': 'application/json' },
});

// ── Interceptor: attach JWT token ───────────────────────
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Interceptor: handle 401 ─────────────────────────────
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const detail = err.response?.data?.detail;
    if (detail && typeof detail === 'object' && 'upgradeMessage' in detail) {
      err.response.data.detail = detail.upgradeMessage;
    }
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      const path = window.location.pathname;
      if (path !== '/login' && path !== '/register' && path !== '/') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);

// ── Auth ────────────────────────────────────────────────
export const authAPI = {
  register: (email: string, password: string, full_name?: string) =>
    api.post<User>('/auth/register', { email, password, full_name }),

  login: (email: string, password: string) =>
    api.post<TokenResponse>('/auth/login', { email, password }),

  googleLogin: (id_token: string) =>
    api.post<TokenResponse>('/auth/google', { id_token }),

  me: () => api.get<User>('/auth/me'),
};

// ── Resume ──────────────────────────────────────────────
export const resumeAPI = {
  upload: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post<ResumeUploadResponse>('/resume/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  delete: (id: string) =>
    api.delete(`/resume/${id}`),
  get: (resumeId: string) =>
    api.get<ResumeUploadResponse>(`/resume/${resumeId}`),
};

// ── Analysis ────────────────────────────────────────────
export const analysisAPI = {
  rejectionRisk: (data: {
    resume_id: string;
    job_description: string;
    job_title?: string;
    required_skills?: string[];
  }) => api.post<RejectionAnalysisResponse>('/analysis/rejection-risk', data),
};

// ── Market ──────────────────────────────────────────────
export const marketAPI = {
  radar: () => api.get<MarketRadarResponse>('/market/radar'),
  refresh: () => api.post<MarketRadarResponse>('/market/radar/refresh'),
};

// ── Simulation ──────────────────────────────────────────
export const simulationAPI = {
  simulate: (data: {
    resume_id: string;
    job_description: string;
    skills_to_add: string[];
    skills_to_remove?: string[];
  }) => api.post<CareerSimulationResponse>('/simulation/simulate', data),
};

// ── Blueprint ───────────────────────────────────────────
export const blueprintAPI = {
  generate: (data: {
    resume_id: string;
    job_description: string;
    target_role: string;
    plan_type: '30_day' | '90_day';
  }) => api.post<BlueprintResponse>('/blueprint/generate', data),

  get: (blueprintId: string) =>
    api.get<BlueprintResponse>(`/blueprint/${blueprintId}`),
};

// ── Health ──────────────────────────────────────────────
export const healthAPI = {
  check: () => api.get<HealthResponse>('/health'),
};

// ── Hiring Pipeline ─────────────────────────────────────
export const hiringPipelineAPI = {
  simulate: (data: HiringPipelineRequest) =>
    api.post<HiringPipelineResponse>('/hiring-pipeline/simulate', data),
};

// ── Profile (list endpoints) ────────────────────────────
export const profileAPI = {
  getResumes: () =>
    api.get<ResumeSummary[]>('/resume/list'),

  getAnalyses: () =>
    api.get<AnalysisSummary[]>('/analysis/list'),
};

// ── Payment ─────────────────────────────────────────────
export const paymentAPI = {
  createOrder: () =>
    api.post<PaymentCreateResponse>('/payment/create-order', {}),

  verifyPayment: (razorpay_order_id: string, razorpay_payment_id: string, razorpay_signature: string) =>
    api.post<PaymentVerifyResponse>('/payment/verify', {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    }),
};

export const subscriptionAPI = {
  status: () =>
    api.get<SubscriptionStatusResponse>('/subscription/status'),
};

export default api;
