// ═══════════════════════════════════════════════════════════
// reBorn_i — App Router (All 10 Modules)
// ═══════════════════════════════════════════════════════════

import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SubscriptionProvider } from './context/SubscriptionContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import UserProfile from './pages/UserProfile';
import ResumeUpload from './pages/ResumeUpload';
import RejectionAnalysis from './pages/RejectionAnalysis';
import MarketRadar from './pages/MarketRadar';
import CareerSimulation from './pages/CareerSimulation';
import Blueprint from './pages/Blueprint';
import HiringPipeline from './pages/HiringPipeline';
import CareerPivot from './pages/CareerPivot';
import InterviewReadiness from './pages/InterviewReadiness';
import ResumeTracker from './pages/ResumeTracker';
import ApplicationTracker from './pages/ApplicationTracker';
import ActionPlan from './pages/ActionPlan';

export default function App() {
  useEffect(() => {
    // Load Razorpay SDK
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => {
      // SDK loaded successfully
    };
    script.onerror = () => {
      console.error('Failed to load Razorpay SDK');
    };
    document.body.appendChild(script);

    return () => {
      // Cleanup: remove script if needed
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, []);

  return (
    <AuthProvider>
      <SubscriptionProvider>
        <BrowserRouter>
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
              <Route path="/resume" element={<ResumeUpload />} />
              <Route path="/analysis" element={<RejectionAnalysis />} />
              <Route path="/market" element={<MarketRadar />} />
              <Route path="/simulation" element={<CareerSimulation />} />
              <Route path="/blueprint" element={<Blueprint />} />
              <Route path="/pipeline" element={<HiringPipeline />} />
              {/* Growth modules */}
              <Route path="/pivot" element={<CareerPivot />} />
              <Route path="/interview" element={<InterviewReadiness />} />
              <Route path="/tracker" element={<ResumeTracker />} />
              {/* Planning modules */}
              <Route path="/applications" element={<ApplicationTracker />} />
              <Route path="/action-plan" element={<ActionPlan />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </SubscriptionProvider>
    </AuthProvider>
  );
}
