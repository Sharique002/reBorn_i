import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { hiringPipelineAPI } from '../api/client';
import type { HiringPipelineResponse, HiringPipelineRequest } from '../types';
import ScoreGauge from '../components/ScoreGauge';
import { HiringIllustration } from '../components/Illustrations';
import SubscriptionGuard from '../components/SubscriptionGuard';
import {
  Filter, Loader2, AlertCircle, TrendingDown, Target, BarChart3,
  CheckCircle2, Activity, ChevronRight, Info, Lightbulb, ShieldAlert,
  Flower2,
} from 'lucide-react';
import AnimatedButton from '../components/AnimatedButton';

const cItem = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.4 } } };

export default function HiringPipeline() {
  const [formData, setFormData] = useState<HiringPipelineRequest>({
    ATS_risk: 0.3, Recruiter_risk: 0.4, Market_risk: 0.35,
    Grammar_risk: 0.1, Formatting_risk: 0.05, domain: 'TECH',
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<HiringPipelineResponse | null>(null);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setError(''); setResult(null);
    try {
      const { data } = await hiringPipelineAPI.simulate(formData);
      setResult(data);
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Simulation failed. Please try again.');
    } finally { setLoading(false); }
  };

  const handleSliderChange = (key: keyof HiringPipelineRequest, val: number) => {
    setFormData((prev) => ({ ...prev, [key]: val / 100 }));
  };

  const riskColor = (val: number) => {
    if (val >= 0.7) return 'text-rose-500';
    if (val >= 0.4) return 'text-amber-500';
    return 'text-green-500';
  };

  const sliderFields = [
    { id: 'ATS_risk', label: 'ATS Filter Risk', icon: Target, accent: 'warm' },
    { id: 'Recruiter_risk', label: 'Recruiter Scan Risk', icon: ShieldAlert, accent: 'rose' },
    { id: 'Market_risk', label: 'Market Competition Risk', icon: BarChart3, accent: 'sky' },
    { id: 'Grammar_risk', label: 'Grammar Risk', icon: Info, accent: 'violet' },
    { id: 'Formatting_risk', label: 'Formatting Risk', icon: Filter, accent: 'green' },
  ];

  return (
    <motion.div initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.08 } } }} className="space-y-6">
      <motion.div variants={cItem} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-bark flex items-center gap-2">
            <Filter className="w-6 h-6 text-warm-500" />
            Hiring Pipeline Survival
          </h1>
          <p className="text-dusk mt-1">Simulate your survival probability through each stage of the recruitment funnel</p>
        </div>
        <div className="hidden sm:block">
          <HiringIllustration size={140} />
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Form */}
        <motion.form variants={cItem} onSubmit={handleSubmit} className="lg:col-span-4 card space-y-6 h-fit lg:sticky lg:top-6">
          <div className="space-y-4">
            <h3 className="text-sm font-display font-bold text-dusk uppercase tracking-wider flex items-center gap-2">
              <Activity className="w-4 h-4 text-warm-500" /> Risk Parameters
            </h3>
            {sliderFields.map((field) => (
              <div key={field.id} className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <label className="text-bark flex items-center gap-1.5 font-medium">
                    <field.icon className="w-3.5 h-3.5 text-warm-500" />{field.label}
                  </label>
                  <span className={`font-mono font-bold ${riskColor(formData[field.id as keyof HiringPipelineRequest] as number)}`}>
                    {Math.round((formData[field.id as keyof HiringPipelineRequest] as number) * 100)}%
                  </span>
                </div>
                <input type="range" min="0" max="100" step="1"
                  value={(formData[field.id as keyof HiringPipelineRequest] as number) * 100}
                  onChange={(e) => handleSliderChange(field.id as keyof HiringPipelineRequest, parseInt(e.target.value))}
                  className="w-full h-1.5 rounded-lg appearance-none cursor-pointer" />
              </div>
            ))}

            <div className="space-y-2 pt-2">
              <label className="label">Target Domain</label>
              <div className="flex gap-2">
                {['TECH', 'NON_TECH'].map((d) => (
                  <motion.button key={d} type="button" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    onClick={() => setFormData((p) => ({ ...p, domain: d as any }))}
                    className={`flex-1 py-2.5 px-3 rounded-2xl text-xs font-bold border transition-all ${
                      formData.domain === d
                        ? 'bg-warm-100 border-warm-300 text-warm-700'
                        : 'bg-white border-warm-200 text-dusk hover:border-warm-300'
                    }`}>{d.replace('_', ' ')}</motion.button>
                ))}
              </div>
            </div>
          </div>

          <AnimatedButton
            type="submit"
            loading={loading}
            loadingText="Simulating..."
            icon={<Activity className="w-4 h-4" />}
            className="w-full"
          >
            Run Simulation
          </AnimatedButton>
        </motion.form>

        {/* Right: Results */}
        <div className="lg:col-span-8 space-y-6">
          {error && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="flex items-center gap-3 rounded-2xl px-4 py-4 bg-rose-50 border border-rose-200 text-rose-600">
              <AlertCircle className="w-5 h-5 flex-shrink-0" /><span className="text-sm font-medium">{error}</span>
            </motion.div>
          )}

          {!result && !loading && !error && (
            <div className="card flex flex-col items-center justify-center py-20 text-center space-y-4 border-2 border-dashed border-warm-200 bg-transparent">
              <motion.div animate={{ rotate: [0, 10, -10, 0] }} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}>
                <div className="w-16 h-16 rounded-2xl bg-warm-50 flex items-center justify-center">
                  <Target className="w-8 h-8 text-warm-300" />
                </div>
              </motion.div>
              <div>
                <h3 className="text-lg font-display font-bold text-dusk">Ready to Simulate</h3>
                <p className="text-sm text-dusk max-w-xs mx-auto">Adjust the risk parameters and click run to see your hiring survival probability.</p>
              </div>
            </div>
          )}

          {loading && (
            <div className="space-y-6 animate-pulse-slow">
              <div className="card flex flex-col md:flex-row items-center gap-8">
                <div className="skeleton-shimmer w-40 h-40 rounded-full" />
                <div className="flex-1 space-y-3 w-full">
                  <div className="skeleton-shimmer w-32 h-5 rounded-lg" />
                  <div className="skeleton-shimmer w-64 h-7 rounded-xl" />
                  <div className="skeleton-shimmer w-full h-16 rounded-2xl" />
                </div>
              </div>
              <div className="card space-y-4">
                <div className="skeleton-shimmer w-48 h-5 rounded-lg" />
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="space-y-1.5">
                    <div className="flex justify-between">
                      <div className="skeleton-shimmer w-24 h-3 rounded" />
                      <div className="skeleton-shimmer w-12 h-3 rounded" />
                    </div>
                    <div className="skeleton-shimmer w-full h-3 rounded-full" />
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="card space-y-3">
                  <div className="skeleton-shimmer w-9 h-9 rounded-xl" />
                  <div className="skeleton-shimmer w-40 h-4 rounded-lg" />
                  <div className="skeleton-shimmer w-full h-3 rounded" />
                </div>
                <div className="card space-y-3">
                  <div className="skeleton-shimmer w-9 h-9 rounded-xl" />
                  <div className="skeleton-shimmer w-40 h-4 rounded-lg" />
                  <div className="skeleton-shimmer w-full h-3 rounded" />
                </div>
              </div>
            </div>
          )}

          <AnimatePresence>
            {result && (
              <motion.div initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.08 } } }} className="space-y-6">
                {/* Top Banner */}
                <motion.div variants={cItem} className="card flex flex-col md:flex-row items-center gap-8"
                  style={{ background: 'linear-gradient(135deg, rgba(245,166,35,0.05), rgba(139,92,246,0.05))' }}>
                  <div className="relative">
                    <ScoreGauge score={result.pipeline_survival.Final_Interview_Probability}
                      label="Final Probability" colorMode="success" size={160} />
                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap px-2 py-0.5 rounded-full bg-warm-50 border border-warm-200 text-[10px] text-dusk font-mono">
                      CI: {result.confidence_interval_percent.lower.toFixed(1)}% - {result.confidence_interval_percent.upper.toFixed(1)}%
                    </div>
                  </div>
                  <div className="flex-1 space-y-4 text-center md:text-left">
                    <div className="space-y-1">
                      <div className="flex items-center justify-center md:justify-start gap-2">
                        <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                          result.domain_detected === 'TECH' ? 'bg-sky-100 text-sky-700 border-sky-200' : 'bg-violet-100 text-violet-700 border-violet-200'
                        }`}>{result.domain_detected} Domain</span>
                        <span className="text-xs text-dusk font-mono">Deterministic Model v1.0</span>
                      </div>
                      <h2 className="text-2xl font-display font-bold text-bark">Survival Summary</h2>
                    </div>
                    <div className="bg-warm-50 rounded-2xl p-4 border border-warm-100 flex items-start gap-3">
                      <Lightbulb className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-bark leading-relaxed italic">"{result.behavior_guidance_message}"</p>
                    </div>
                  </div>
                </motion.div>

                {/* Funnel */}
                <motion.div variants={cItem} className="card space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="font-display font-bold text-bark flex items-center gap-2">
                      <TrendingDown className="w-4 h-4 text-warm-500" /> Stage-by-Stage Funnel
                    </h3>
                    <span className="text-xs text-dusk">Compounded Probabilities</span>
                  </div>
                  <div className="space-y-4">
                    {[
                      { label: 'Initial Application', value: 1.0, color: 'bg-warm-400' },
                      { label: 'ATS Screening', value: result.pipeline_survival.ATS_stage_compounded, color: 'bg-warm-500' },
                      { label: 'Recruiter Polish', value: result.pipeline_survival.Recruiter_stage_compounded, color: 'bg-violet-400' },
                      { label: 'Market Resilience', value: result.pipeline_survival.Market_stage_compounded, color: 'bg-amber-400' },
                    ].map((stage, i) => (
                      <div key={i} className="space-y-1.5">
                        <div className="flex justify-between text-xs font-medium">
                          <span className="text-dusk">{stage.label}</span>
                          <span className="text-bark font-mono font-bold">{(stage.value * 100).toFixed(1)}%</span>
                        </div>
                        <div className="h-3 w-full bg-warm-100 rounded-full overflow-hidden">
                          <motion.div initial={{ width: 0 }} animate={{ width: `${stage.value * 100}%` }}
                            transition={{ duration: 0.8, delay: i * 0.15, ease: 'easeOut' }}
                            className={`h-full rounded-full ${stage.color}`} />
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>

                {/* Bottlenecks */}
                <motion.div variants={cItem} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <motion.div whileHover={{ y: -2 }} className="card border-l-4 border-l-rose-400 transition-all">
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-9 h-9 rounded-xl bg-rose-50 flex items-center justify-center">
                        <AlertCircle className="w-5 h-5 text-rose-400" />
                      </div>
                      <span className="text-[10px] uppercase tracking-tighter text-rose-500 font-black">Primary</span>
                    </div>
                    <h4 className="text-sm font-display font-bold text-bark mb-1">{result.primary_bottleneck_stage} Bottleneck</h4>
                    <p className="text-xs text-dusk">Lowest raw survival rate detected in this stage.</p>
                  </motion.div>
                  <motion.div whileHover={{ y: -2 }} className="card border-l-4 border-l-amber-400 transition-all">
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center">
                        <ShieldAlert className="w-5 h-5 text-amber-400" />
                      </div>
                      <span className="text-[10px] uppercase tracking-tighter text-amber-500 font-black">Secondary</span>
                    </div>
                    <h4 className="text-sm font-display font-bold text-bark mb-1">{result.secondary_bottleneck_stage} Barrier</h4>
                    <p className="text-xs text-dusk">Second most significant factor.</p>
                  </motion.div>
                </motion.div>

                {/* Diagnosis - LOCKED FOR FREE USERS */}
                <SubscriptionGuard requiresPro={true}>
                  <motion.div variants={cItem} className="card">
                    <h3 className="font-display font-bold text-sm text-bark flex items-center gap-2 mb-3">
                      <Info className="w-4 h-4 text-warm-500" /> Critical Diagnosis
                    </h3>
                    <p className="text-sm text-bark leading-relaxed border-l-2 border-warm-300 pl-3">{result.why_this_stage_is_weak}</p>
                  </motion.div>
                </SubscriptionGuard>

                {/* Improvements - LOCKED FOR FREE USERS */}
                <SubscriptionGuard requiresPro={true}>
                  <motion.div variants={cItem} className="card">
                    <h3 className="font-display font-bold text-sm text-bark flex items-center gap-2 mb-4">
                      <CheckCircle2 className="w-4 h-4 text-green-500" /> Strategic Roadmaps
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {result.improvement_actions.length > 0 ? (
                        result.improvement_actions.map((action, i) => (
                          <motion.div key={i} whileHover={{ scale: 1.01 }}
                            className="flex items-start gap-2 bg-warm-50 p-3 rounded-2xl border border-warm-100 transition-colors hover:border-warm-200">
                            <ChevronRight className="w-3.5 h-3.5 text-green-500 mt-0.5 flex-shrink-0" />
                            <span className="text-[13px] text-bark">{action}</span>
                          </motion.div>
                        ))
                      ) : (
                        <p className="text-sm text-dusk col-span-2">No critical improvements needed.</p>
                      )}
                    </div>
                  </motion.div>
                </SubscriptionGuard>

                {/* Chart - LOCKED FOR FREE USERS */}
                {result.chart_base64 && (
                  <SubscriptionGuard requiresPro={true}>
                    <motion.div variants={cItem} className="card overflow-hidden">
                      <h3 className="font-display font-bold text-sm text-bark flex items-center gap-2 mb-4">
                        <BarChart3 className="w-4 h-4 text-warm-500" /> Statistical Visualization
                      </h3>
                      <div className="bg-warm-50 rounded-2xl p-4 flex justify-center border border-warm-100">
                        <img src={`data:image/png;base64,${result.chart_base64}`} alt="Survival Chart" className="max-w-full h-auto rounded-xl" />
                      </div>
                    </motion.div>
                  </SubscriptionGuard>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}
