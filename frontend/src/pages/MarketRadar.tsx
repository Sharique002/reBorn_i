import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { marketAPI } from '../api/client';
import type { MarketRadarResponse } from '../types';
import { MarketIllustration } from '../components/Illustrations';
import { AnimatedCounter } from '../components/Animations';
import AnimatedButton from '../components/AnimatedButton';
import {
  Radar, Loader2, AlertCircle, RefreshCw, TrendingUp, Shield, BarChart3, Flower2,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';

const CHART_COLORS = [
  '#F5A623', '#FF8C42', '#E84565', '#d6336c', '#0EA5E9',
  '#0284C7', '#5A9E5A', '#3B8B3B', '#8B5CF6', '#7C3AED',
  '#F5A623', '#FF8C42', '#E84565', '#0EA5E9', '#5A9E5A',
];

const cItem = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.4 } } };

export default function MarketRadar() {
  const [data, setData] = useState<MarketRadarResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const fetchData = async () => {
    try {
      const { data: res } = await marketAPI.radar();
      setData(res);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load market data');
    } finally { setLoading(false); }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const { data: res } = await marketAPI.refresh();
      setData(res);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Refresh failed');
    } finally { setRefreshing(false); }
  };

  useEffect(() => { fetchData(); }, []);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse-slow">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="skeleton-shimmer w-48 h-7 rounded-xl" />
            <div className="skeleton-shimmer w-72 h-4 rounded-lg" />
          </div>
          <div className="hidden sm:block skeleton-shimmer w-28 h-28 rounded-2xl" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card flex items-center gap-4">
              <div className="skeleton-shimmer w-11 h-11 rounded-xl" />
              <div className="space-y-2 flex-1">
                <div className="skeleton-shimmer w-16 h-6 rounded-lg" />
                <div className="skeleton-shimmer w-24 h-3 rounded" />
              </div>
            </div>
          ))}
        </div>
        <div className="card">
          <div className="skeleton-shimmer w-40 h-5 rounded-lg mb-4" />
          <div className="skeleton-shimmer w-full h-72 rounded-xl" />
        </div>
      </div>
    );
  }

  const chartData = data?.top_skills.slice(0, 15).map((s) => ({
    name: s.skill,
    demand: +(s.demand_index * 100).toFixed(0),
    frequency: s.frequency,
    rank: s.rank,
  })) || [];

  return (
    <motion.div initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.08 } } }} className="space-y-6">
      <motion.div variants={cItem} className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="hidden sm:block">
            <MarketIllustration size={120} />
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold text-bark flex items-center gap-2">
              <Radar className="w-6 h-6 text-green-500" />
              Market Radar
            </h1>
            <p className="text-dusk mt-1">Current skill demand, growth trends, and future-proof scores</p>
          </div>
        </div>
        <AnimatedButton
          onClick={handleRefresh}
          loading={refreshing}
          loadingText="Refreshing..."
          variant="secondary"
          icon={<RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />}
        >
          Refresh
        </AnimatedButton>
      </motion.div>

      {error && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="flex items-center gap-2 rounded-2xl px-4 py-3 bg-rose-50 border border-rose-200 text-rose-600">
          <AlertCircle className="w-4 h-4" /><span className="text-sm font-medium">{error}</span>
        </motion.div>
      )}

      {data && (
        <>
          {/* Stats */}
          <motion.div variants={cItem} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { icon: BarChart3, color: 'sky', value: data.total_jobs_analyzed, label: 'Jobs Analyzed' },
              { icon: TrendingUp, color: 'green', value: data.top_skills.length, label: 'Skills Tracked' },
              { icon: Shield, color: 'violet', value: data.top_skills.filter((s) => s.demand_index >= 0.7).length, label: 'High-Demand Skills' },
            ].map((s, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.06 }}
                className="card flex items-center gap-4 hover:shadow-card-hover hover:-translate-y-0.5 transition-all">
                <div className={`w-11 h-11 rounded-xl bg-${s.color}-100 flex items-center justify-center`}>
                  <s.icon className={`w-5 h-5 text-${s.color}-500`} />
                </div>
                <div>
                  <p className="text-2xl font-display font-black text-bark">
                    <AnimatedCounter value={s.value} duration={1} />
                  </p>
                  <p className="text-xs text-dusk">{s.label}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Chart */}
          <motion.div variants={cItem} className="card">
            <h3 className="font-display font-bold text-bark mb-4">Skill Demand Index</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} layout="vertical" margin={{ left: 80 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F0E6D8" />
                  <XAxis type="number" domain={[0, 100]} stroke="#6B6574" fontSize={12} />
                  <YAxis type="category" dataKey="name" stroke="#6B6574" fontSize={12} width={75} />
                  <Tooltip
                    contentStyle={{
                      background: '#FFFFFF',
                      border: '1px solid #F0E6D8',
                      borderRadius: '16px',
                      fontSize: '13px',
                      color: '#2D2A32',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
                    }}
                  />
                  <Bar dataKey="demand" name="Demand %" radius={[0, 8, 8, 0]}>
                    {chartData.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Skills table */}
          <motion.div variants={cItem} className="card overflow-hidden">
            <h3 className="font-display font-bold text-bark mb-4">Detailed Skill Analysis</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-warm-200">
                    <th className="text-left py-3 px-4 text-dusk font-bold">Rank</th>
                    <th className="text-left py-3 px-4 text-dusk font-bold">Skill</th>
                    <th className="text-right py-3 px-4 text-dusk font-bold">Frequency</th>
                    <th className="text-right py-3 px-4 text-dusk font-bold">Demand Index</th>
                  </tr>
                </thead>
                <tbody>
                  {data.top_skills.map((skill) => (
                    <tr key={skill.skill} className="border-b border-warm-100 hover:bg-warm-50/50 transition-colors">
                      <td className="py-3 px-4 text-dusk font-mono text-sm">#{skill.rank}</td>
                      <td className="py-3 px-4 font-display font-bold text-bark">{skill.skill}</td>
                      <td className="py-3 px-4 text-right text-dusk">{skill.frequency}</td>
                      <td className="py-3 px-4 text-right">
                        <span className={`font-bold ${
                          skill.demand_index >= 0.7 ? 'text-green-600' :
                          skill.demand_index >= 0.4 ? 'text-amber-600' : 'text-dusk'
                        }`}>{(skill.demand_index * 100).toFixed(0)}%</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        </>
      )}
    </motion.div>
  );
}
