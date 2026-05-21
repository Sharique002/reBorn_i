// ═══════════════════════════════════════════════════════════
// reBorn_i — Dashboard Page (Premium SaaS Experience)
// ═══════════════════════════════════════════════════════════

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { healthAPI } from '../api/client';
import { useSubscription } from '../modules/subscription';
import { DashboardIllustration } from '../components/Illustrations';
import { PulsingDot } from '../components/Animations';
import DashboardPipelineCards from '../components/DashboardPipelineCards';
import PremiumConversionCard from '../components/PremiumConversionCard';
import PostPaymentCelebration from '../components/PostPaymentCelebration';
import {
  FileText, ShieldAlert, Globe2, Compass, Map, Filter,
  Brain, TrendingUp, Briefcase, ListChecks, GitCompareArrows,
  ArrowRight, Sparkles, CheckCircle2, AlertTriangle, XCircle, Flower2, LockKeyhole,
  Activity, Target, BarChart3, Lock,
} from 'lucide-react';
import type { SubscriptionFeature } from '../modules/subscription';

const modules = [
  { to: '/resume', icon: FileText, title: 'Resume Upload', desc: 'Parse & score resume', gradient: 'from-amber-50 to-orange-50', iconBg: 'bg-amber-100', iconColor: 'text-amber-600', badge: null, feature: null },
  { to: '/pipeline', icon: Filter, title: 'Hiring Pipeline', desc: 'Survival probability', gradient: 'from-sky-50 to-cyan-50', iconBg: 'bg-sky-100', iconColor: 'text-sky-600', badge: 'Core', feature: 'pipeline_basic' as SubscriptionFeature },
  { to: '/analysis', icon: ShieldAlert, title: 'Rejection Risk', desc: 'AI risk assessment', gradient: 'from-rose-50 to-pink-50', iconBg: 'bg-rose-100', iconColor: 'text-rose-600', badge: null, feature: 'diagnosis' as SubscriptionFeature },
  { to: '/simulation', icon: GitCompareArrows, title: 'Skill Simulator', desc: 'Simulate skill changes', gradient: 'from-violet-50 to-purple-50', iconBg: 'bg-violet-100', iconColor: 'text-violet-600', badge: null, feature: 'simulation' as SubscriptionFeature },
  { to: '/pivot', icon: Compass, title: 'Career Pivot', desc: 'Find alt career paths', gradient: 'from-violet-50 to-indigo-50', iconBg: 'bg-violet-100', iconColor: 'text-violet-600', badge: 'New', feature: 'career_pivot' as SubscriptionFeature },
  { to: '/interview', icon: Brain, title: 'Interview Readiness', desc: 'Prep score & radar', gradient: 'from-sky-50 to-blue-50', iconBg: 'bg-sky-100', iconColor: 'text-sky-600', badge: 'New' },
  { to: '/tracker', icon: TrendingUp, title: 'Resume Tracker', desc: 'Version score history', gradient: 'from-amber-50 to-yellow-50', iconBg: 'bg-amber-100', iconColor: 'text-amber-600', badge: 'New', feature: 'resume_tracking' as SubscriptionFeature },
  { to: '/market', icon: Globe2, title: 'Market Intelligence', desc: 'Skill demand trends', gradient: 'from-green-50 to-emerald-50', iconBg: 'bg-green-100', iconColor: 'text-green-600', badge: null },
  { to: '/applications', icon: Briefcase, title: 'Applications', desc: 'Track & analyze rejections', gradient: 'from-rose-50 to-red-50', iconBg: 'bg-rose-100', iconColor: 'text-rose-600', badge: 'New', feature: 'resume_tracking' as SubscriptionFeature },
  { to: '/action-plan', icon: ListChecks, title: 'Action Plan', desc: '30-day structured roadmap', gradient: 'from-violet-50 to-purple-50', iconBg: 'bg-violet-100', iconColor: 'text-violet-600', badge: 'New', feature: 'action_plan' as SubscriptionFeature },
  { to: '/blueprint', icon: Map, title: 'Blueprint', desc: '90-day career plan', gradient: 'from-violet-50 to-purple-50', iconBg: 'bg-violet-100', iconColor: 'text-violet-600', badge: null, feature: 'action_plan' as SubscriptionFeature },
];

const flow = [
  { num: 1, label: 'Upload', desc: 'Share your resume', icon: FileText, color: 'text-warm-500' },
  { num: 2, label: 'Analyse', desc: 'AI risk assessment', icon: ShieldAlert, color: 'text-rose-500' },
  { num: 3, label: 'Simulate', desc: 'Skill impact testing', icon: GitCompareArrows, color: 'text-violet-500' },
  { num: 4, label: 'Pivot', desc: 'Explore alternatives', icon: Compass, color: 'text-sky-500' },
  { num: 5, label: 'Action Plan', desc: '30-day execution', icon: ListChecks, color: 'text-green-500' },
];

const BLURRED_PREMIUM_SECTIONS = [
  { title: 'Full Diagnosis', desc: 'Complete rejection analysis with layer-by-layer breakdown', icon: ShieldAlert, color: 'text-rose-500', bg: 'bg-rose-50' },
  { title: 'Skill Gap Analysis', desc: 'Identify missing skills and priority gaps', icon: Target, color: 'text-amber-500', bg: 'bg-amber-50' },
  { title: 'Career Pivot Suggestions', desc: 'Find adjacent roles and transition paths', icon: Compass, color: 'text-violet-500', bg: 'bg-violet-50' },
  { title: 'Personalized Action Plan', desc: '30-day structured roadmap tailored to you', icon: ListChecks, color: 'text-green-500', bg: 'bg-green-50' },
  { title: 'Resume Improvement Strategy', desc: 'ATS optimization and recruiter targeting', icon: FileText, color: 'text-sky-500', bg: 'bg-sky-50' },
  { title: 'Market Intelligence', desc: 'Real-time skill demand and competition data', icon: BarChart3, color: 'text-warm-500', bg: 'bg-warm-50' },
];

type HealthStatus = 'loading' | 'healthy' | 'error';

const cItem = { hidden: { opacity: 0, y: 24 }, show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: 'easeOut' as const } } };

export default function Dashboard() {
  const { user } = useAuth();
  const { getFeatureGate, isPro, status, resetStatus } = useSubscription();
  const [health, setHealth] = useState<HealthStatus>('loading');
  const [showCelebration, setShowCelebration] = useState(false);

  useEffect(() => {
    healthAPI.check().then(() => setHealth('healthy')).catch(() => setHealth('error'));
  }, []);

  // Show celebration on successful payment
  useEffect(() => {
    if (status === 'success') {
      setShowCelebration(true);
    }
  }, [status]);

  const firstName = user?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'Explorer';

  return (
    <motion.div initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.07 } } }} className="space-y-10">
      {/* Post-Payment Celebration */}
      <PostPaymentCelebration 
        show={showCelebration} 
        onDismiss={() => {
          setShowCelebration(false);
          resetStatus();
        }} 
      />

      {/* Hero */}
      <motion.section variants={cItem} className="relative rounded-3xl overflow-hidden p-8 md:p-12"
        style={{ background: 'linear-gradient(135deg, rgba(245,166,35,0.08) 0%, rgba(232,69,101,0.06) 50%, rgba(139,92,246,0.06) 100%)' }}>
        <motion.div className="absolute -top-32 -right-32 w-96 h-96 rounded-full"
          style={{ background: 'rgba(245,166,35,0.06)', filter: 'blur(80px)' }}
          animate={{ scale: [1, 1.08, 1] }} transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }} />
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <motion.div animate={{ rotate: [0, 10, -10, 0] }} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}>
                <Flower2 className="w-7 h-7 text-warm-500" />
              </motion.div>
              <span className="text-sm font-medium text-warm-600 tracking-wide">Welcome back</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-display font-bold text-bark mb-3">
              Hello, {firstName}{' '}
              <motion.span animate={{ rotate: [0, 14, -8, 14, -4, 10, 0] }}
                transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 3 }}
                className="inline-block origin-[70%_70%]">👋</motion.span>
            </h1>
            <p className="text-dusk text-lg max-w-lg">
              Your all-in-one career reinvention platform — <strong className="text-bark">everything you need</strong> to go from rejection to offer.
            </p>
            <div className="mt-4 flex items-center gap-3 flex-wrap">
              <Link to="/resume" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-bold text-white"
                style={{ background: 'linear-gradient(135deg, #F5A623, #FF8C42)', boxShadow: '0 4px 16px rgba(245,166,35,0.3)' }}>
                <FileText className="w-4 h-4" /> Start with Resume
              </Link>
              <Link to="/pipeline" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-semibold text-dusk border border-warm-200 bg-white/60 hover:bg-white transition-all">
                Run Pipeline Sim <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
          <div className="hidden md:block"><DashboardIllustration size={180} /></div>
        </div>
      </motion.section>

      {/* ── Hiring Pipeline Survival Simulator ── */}
      <motion.section variants={cItem}>
        <div className="flex items-center gap-2 mb-5">
          <Activity className="w-5 h-5 text-warm-500" />
          <h2 className="text-xl font-display font-bold text-bark">Hiring Pipeline Survival</h2>
          <span className="text-xs bg-sky-50 text-sky-700 border border-sky-200 px-2 py-0.5 rounded-full font-bold">Simulator</span>
        </div>
        <DashboardPipelineCards />
      </motion.section>

      {/* ── Premium Conversion Section (Free users only) ── */}
      {!isPro && (
        <motion.section variants={cItem}>
          <PremiumConversionCard />
        </motion.section>
      )}

      {/* ── Blurred Premium Preview (Free users only) ── */}
      {!isPro && (
        <motion.section variants={cItem}>
          <div className="flex items-center gap-2 mb-5">
            <Lock className="w-5 h-5 text-warm-400" />
            <h2 className="text-xl font-display font-bold text-bark">Premium Insights Preview</h2>
            <span className="text-xs bg-warm-50 text-warm-700 border border-warm-200 px-2 py-0.5 rounded-full font-bold">Pro</span>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {BLURRED_PREMIUM_SECTIONS.map((section, i) => {
              const Icon = section.icon;
              return (
                <motion.div
                  key={section.title}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + i * 0.06 }}
                  className="relative overflow-hidden rounded-2xl border border-warm-100 bg-white p-5"
                >
                  {/* Blurred content */}
                  <div className="pointer-events-none select-none blur-[3px] opacity-60">
                    <div className={`mb-3 flex h-9 w-9 items-center justify-center rounded-xl ${section.bg}`}>
                      <Icon className={`h-4.5 w-4.5 ${section.color}`} />
                    </div>
                    <h4 className="text-sm font-display font-bold text-bark mb-1">{section.title}</h4>
                    <p className="text-xs text-dusk">{section.desc}</p>
                  </div>
                  {/* Lock overlay */}
                  <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-white/40 backdrop-blur-[1px]">
                    <div className="flex items-center gap-1.5 rounded-full border border-warm-200 bg-white px-3 py-1.5 text-xs font-bold text-dusk shadow-sm">
                      <LockKeyhole className="h-3 w-3 text-warm-400" />
                      Pro
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.section>
      )}

      {/* ── Pro Active Banner (Pro users) ── */}
      {isPro && (
        <motion.section variants={cItem}>
          <motion.div
            whileHover={{ y: -2 }}
            className="rounded-3xl border border-green-100 bg-green-50/50 p-6 shadow-sm"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-green-100">
                <Sparkles className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h3 className="text-sm font-black text-bark">Pro Intelligence Active</h3>
                <p className="text-sm text-dusk">Diagnosis, skill gaps, simulations, and action plans are unlocked.</p>
              </div>
            </div>
          </motion.div>
        </motion.section>
      )}

      {/* Module grid */}
      <motion.section variants={cItem}>
        <div className="flex items-center gap-2 mb-5">
          <Sparkles className="w-5 h-5 text-warm-500" />
          <h2 className="text-xl font-display font-bold text-bark">All Modules</h2>
          <span className="text-xs bg-warm-100 text-warm-700 border border-warm-200 px-2 py-0.5 rounded-full font-bold">10 tools</span>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {modules.map((m, i) => (
            <motion.div key={m.to} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.05 }}>
              <Link to={m.to} className={`group block rounded-2xl p-5 bg-gradient-to-br ${m.gradient} border border-white/60 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 relative overflow-hidden`}>
                {(() => {
                  const locked = !!m.feature && getFeatureGate(m.feature).isLocked;
                  return locked ? (
                    <span className="absolute top-3 right-3 inline-flex items-center gap-1 rounded-full border border-bark/10 bg-white/80 px-1.5 py-0.5 text-[10px] font-black text-bark">
                      <LockKeyhole className="w-3 h-3" /> Pro
                    </span>
                  ) : m.badge ? (
                  <span className={`absolute top-3 right-3 text-[10px] font-black px-1.5 py-0.5 rounded-full ${m.badge === 'New' ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-warm-100 text-warm-700 border border-warm-200'
                    }`}>{m.badge}</span>
                  ) : null;
                })()}
                <div className={`w-10 h-10 rounded-xl ${m.iconBg} flex items-center justify-center mb-4 transition-transform group-hover:scale-110`}>
                  <m.icon className={`w-5 h-5 ${m.iconColor}`} />
                </div>
                <h3 className="font-display font-bold text-bark mb-0.5 text-sm">{m.title}</h3>
                <p className="text-xs text-dusk">{m.desc}</p>
                <ArrowRight className="w-4 h-4 text-dusk mt-3 transition-transform group-hover:translate-x-1" />
              </Link>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* User Flow */}
      <motion.section variants={cItem}>
        <div className="flex items-center gap-2 mb-5">
          <ArrowRight className="w-5 h-5 text-warm-500" />
          <h2 className="text-xl font-display font-bold text-bark">Recommended Flow</h2>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 overflow-x-auto pb-2">
          {flow.map((step, i) => (
            <div key={step.num} className="flex items-center gap-3 flex-shrink-0">
              <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.4 + i * 0.1 }}
                className="relative card p-4 text-center group hover:shadow-md hover:-translate-y-1 transition-all w-36">
                <div className={`text-3xl font-display font-black ${step.color} opacity-15 absolute top-2 right-3`}>{step.num}</div>
                <step.icon className={`w-6 h-6 ${step.color} mx-auto mb-2`} />
                <h3 className="font-display font-bold text-bark text-xs">{step.label}</h3>
                <p className="text-[10px] text-dusk">{step.desc}</p>
              </motion.div>
              {i < flow.length - 1 && <ArrowRight className="w-4 h-4 text-warm-300 flex-shrink-0 hidden sm:block" />}
            </div>
          ))}
        </div>
      </motion.section>

      {/* System health */}
      <motion.section variants={cItem} className="flex items-center gap-4">
        <div className="card p-4 inline-flex items-center gap-3 h-fit">
          {health === 'loading' && <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}><Flower2 className="w-4 h-4 text-warm-400" /></motion.div>}
          {health === 'healthy' && <><PulsingDot color="#5A9E5A" size={10} className="mr-1" /><CheckCircle2 className="w-4 h-4 text-green-500" /></>}
          {health === 'error' && <XCircle className="w-4 h-4 text-rose-500" />}
          <span className="text-sm font-medium text-bark capitalize">
            {health === 'loading' ? 'Checking API...' : `API ${health}`}
          </span>
        </div>
        {health === 'error' && (
          <div className="flex items-center gap-2 text-sm text-amber-600">
            <AlertTriangle className="w-4 h-4" />
            Backend offline — UI works but live analysis unavailable
          </div>
        )}
      </motion.section>
    </motion.div>
  );
}
