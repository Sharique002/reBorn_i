// ═══════════════════════════════════════════════════════════
// reBorn_i — App Router (All 10 Modules)
// ═══════════════════════════════════════════════════════════

import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SubscriptionProvider } from './context/SubscriptionContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import SubscriptionGuard from './modules/subscription/components/SubscriptionGuard';

// Core pages (Eager load for fast initial paint)
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Register from './pages/Register';

// Modules (Lazy load to split bundle size)
const Dashboard = lazy(() => import('./pages/Dashboard'));
const UserProfile = lazy(() => import('./pages/UserProfile'));
const ResumeUpload = lazy(() => import('./pages/ResumeUpload'));
const RejectionAnalysis = lazy(() => import('./pages/RejectionAnalysis'));
const MarketRadar = lazy(() => import('./pages/MarketRadar'));
const CareerSimulation = lazy(() => import('./pages/CareerSimulation'));
const Blueprint = lazy(() => import('./pages/Blueprint'));
const HiringPipeline = lazy(() => import('./pages/HiringPipeline'));
const CareerPivot = lazy(() => import('./pages/CareerPivot'));
const InterviewReadiness = lazy(() => import('./pages/InterviewReadiness'));
const ResumeTracker = lazy(() => import('./pages/ResumeTracker'));
const ApplicationTracker = lazy(() => import('./pages/ApplicationTracker'));
const ActionPlan = lazy(() => import('./pages/ActionPlan'));
const PricingPage = lazy(() => import('./modules/subscription/pages/PricingPage'));

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <SubscriptionProvider>
          <Suspense fallback={
            <div className="flex min-h-screen items-center justify-center bg-[#FAFAFA]">
              <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-warm-200 border-t-warm-500" />
            </div>
          }>
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* Protected routes */}
              <Route
                element={
                  <ProtectedRoute>
                    <Layout />
                  </ProtectedRoute>
                }
              >
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/profile" element={<UserProfile />} />
                <Route path="/pricing" element={<PricingPage />} />
                <Route path="/resume" element={<ResumeUpload />} />
                <Route path="/analysis" element={<SubscriptionGuard feature="diagnosis"><RejectionAnalysis /></SubscriptionGuard>} />
                <Route path="/market" element={<MarketRadar />} />
                <Route path="/simulation" element={<SubscriptionGuard feature="simulation"><CareerSimulation /></SubscriptionGuard>} />
                <Route path="/blueprint" element={<SubscriptionGuard feature="action_plan"><Blueprint /></SubscriptionGuard>} />
                <Route path="/pipeline" element={<HiringPipeline />} />
                {/* Growth modules */}
                <Route path="/pivot" element={<SubscriptionGuard feature="career_pivot"><CareerPivot /></SubscriptionGuard>} />
                <Route path="/interview" element={<InterviewReadiness />} />
                <Route path="/tracker" element={<SubscriptionGuard feature="resume_tracking"><ResumeTracker /></SubscriptionGuard>} />
                {/* Planning modules */}
                <Route path="/applications" element={<SubscriptionGuard feature="resume_tracking"><ApplicationTracker /></SubscriptionGuard>} />
                <Route path="/action-plan" element={<SubscriptionGuard feature="action_plan"><ActionPlan /></SubscriptionGuard>} />
              </Route>
            </Routes>
          </Suspense>
        </SubscriptionProvider>
      </BrowserRouter>
    </AuthProvider>
  );
}
