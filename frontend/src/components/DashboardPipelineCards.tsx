// ═══════════════════════════════════════════════════════════
// reBorn_i — Dashboard Pipeline Survival Cards
// Inline deterministic pipeline simulator for the dashboard
// ═══════════════════════════════════════════════════════════

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { RadialBarChart, RadialBar, ResponsiveContainer } from 'recharts';
import { Shield, UserCheck, BarChart3, Target } from 'lucide-react';
import { AnimatedCounter } from './Animations';

interface PipelineCardData {
  label: string;
  value: number;
  icon: React.FC<{ className?: string }>;
  color: string;
  bgColor: string;
  iconBg: string;
}

/**
 * Deterministic pipeline calculation.
 * ATS_survival = 1 - ATS_risk
 * Recruiter_stage = ATS_survival * (1 - Recruiter_risk)
 * Market_stage = Recruiter_stage * (1 - Market_risk)
 * Interview_probability = Market_stage
 */
function computePipeline(atsRisk = 0.30, recruiterRisk = 0.40, marketRisk = 0.35) {
  const atsSurvival = 1 - atsRisk;
  const recruiterStage = atsSurvival * (1 - recruiterRisk);
  const marketStage = recruiterStage * (1 - marketRisk);
  return {
    atsSurvival,
    recruiterStage,
    marketStage,
    interviewProbability: marketStage,
  };
}

function severityColor(value: number): { color: string; bgColor: string; iconBg: string } {
  if (value >= 0.6) return { color: '#5A9E5A', bgColor: 'rgba(90,158,90,0.08)', iconBg: 'bg-green-50' };
  if (value >= 0.3) return { color: '#F5A623', bgColor: 'rgba(245,166,35,0.08)', iconBg: 'bg-amber-50' };
  return { color: '#E84565', bgColor: 'rgba(232,69,101,0.08)', iconBg: 'bg-rose-50' };
}

function MiniGauge({ value, color }: { value: number; color: string }) {
  const data = [{ value: value * 100, fill: color }];
  return (
    <ResponsiveContainer width={64} height={64}>
      <RadialBarChart
        cx="50%" cy="50%" innerRadius="70%" outerRadius="100%"
        startAngle={90} endAngle={-270} data={data}
        barSize={6}
      >
        <RadialBar
          dataKey="value"
          background={{ fill: 'rgba(240,230,216,0.5)' }}
          cornerRadius={12}
        />
      </RadialBarChart>
    </ResponsiveContainer>
  );
}

export default function DashboardPipelineCards() {
  const pipeline = useMemo(() => computePipeline(), []);

  const cards: PipelineCardData[] = useMemo(() => [
    {
      label: 'ATS Survival',
      value: pipeline.atsSurvival,
      icon: Shield,
      ...severityColor(pipeline.atsSurvival),
    },
    {
      label: 'Recruiter Survival',
      value: pipeline.recruiterStage,
      icon: UserCheck,
      ...severityColor(pipeline.recruiterStage),
    },
    {
      label: 'Market Survival',
      value: pipeline.marketStage,
      icon: BarChart3,
      ...severityColor(pipeline.marketStage),
    },
    {
      label: 'Interview Probability',
      value: pipeline.interviewProbability,
      icon: Target,
      ...severityColor(pipeline.interviewProbability),
    },
  ], [pipeline]);

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + idx * 0.08, duration: 0.45, ease: 'easeOut' }}
            whileHover={{ y: -4, boxShadow: '0 12px 32px rgba(45,42,50,0.10)' }}
            className="relative overflow-hidden rounded-2xl border border-warm-100 bg-white p-5 shadow-sm transition-all cursor-default"
          >
            {/* Subtle background glow */}
            <div
              className="absolute -top-6 -right-6 h-20 w-20 rounded-full blur-2xl"
              style={{ background: card.color, opacity: 0.08 }}
            />

            <div className="relative z-10 flex items-start justify-between">
              <div className="flex-1">
                <div className={`mb-3 flex h-9 w-9 items-center justify-center rounded-xl ${card.iconBg}`}>
                  <div style={{ color: card.color }}>
                    <Icon className="h-4.5 w-4.5" />
                  </div>
                </div>
                <p className="mb-1 text-xs font-semibold text-dusk">{card.label}</p>
                <p className="font-display text-2xl font-black" style={{ color: card.color }}>
                  <AnimatedCounter value={card.value * 100} decimals={0} suffix="%" />
                </p>
              </div>
              <div className="flex-shrink-0">
                <MiniGauge value={card.value} color={card.color} />
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
