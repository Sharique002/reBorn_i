import { useState, type FormEvent } from 'react';
import { motion } from 'framer-motion';
import { simulationAPI } from '../api/client';
import type { CareerSimulationResponse } from '../types';
import ScoreGauge from '../components/ScoreGauge';
import { SimulationIllustration } from '../components/Illustrations';
import {
  GitCompareArrows, Loader2, AlertCircle, ArrowRight, TrendingDown,
  Plus, Minus, Zap, Flower2,
} from 'lucide-react';
import AnimatedButton from '../components/AnimatedButton';
import { AnimatedCounter } from '../components/Animations';

const cItem = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.4 } } };

export default function CareerSimulation() {
  const [resumeId, setResumeId] = useState('');
  const [jobDesc, setJobDesc] = useState('');
  const [skillsToAdd, setSkillsToAdd] = useState('');
  const [skillsToRemove, setSkillsToRemove] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CareerSimulationResponse | null>(null);
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault(); setLoading(true); setError(''); setResult(null);
    try {
      const add = skillsToAdd.split(',').map((s) => s.trim()).filter(Boolean);
      const remove = skillsToRemove.split(',').map((s) => s.trim()).filter(Boolean);
      if (add.length === 0) { setError('Please enter at least one skill to add'); setLoading(false); return; }
      const { data } = await simulationAPI.simulate({
        resume_id: resumeId, job_description: jobDesc,
        skills_to_add: add, skills_to_remove: remove.length > 0 ? remove : undefined,
      });
      setResult(data);
    } catch (err: any) {
      setError(err.response?.data?.message || err.response?.data?.detail || 'Simulation failed');
    } finally { setLoading(false); }
  };

  return (
    <motion.div initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.08 } } }} className="space-y-6">
      <motion.div variants={cItem} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-bark flex items-center gap-2">
            <GitCompareArrows className="w-6 h-6 text-amber-500" />
            Career Simulation
          </h1>
          <p className="text-dusk mt-1">Simulate adding skills and see how your rejection risk changes</p>
        </div>
        <div className="hidden sm:block">
          <SimulationIllustration size={140} />
        </div>
      </motion.div>

      {/* Form */}
      <motion.form variants={cItem} onSubmit={handleSubmit} className="card space-y-5">
        <div>
          <label className="label">Resume ID</label>
          <input value={resumeId} onChange={(e) => setResumeId(e.target.value)}
            className="input-field font-mono text-sm" placeholder="Paste your resume UUID" required />
        </div>
        <div>
          <label className="label">Target Job Description</label>
          <textarea value={jobDesc} onChange={(e) => setJobDesc(e.target.value)}
            className="input-field min-h-[120px] resize-y" placeholder="Paste the job description you're targeting..." required />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5 text-green-500" /> Skills to Add
            </label>
            <input value={skillsToAdd} onChange={(e) => setSkillsToAdd(e.target.value)}
              className="input-field" placeholder="AWS, Kubernetes, Terraform" required />
          </div>
          <div>
            <label className="label flex items-center gap-1.5">
              <Minus className="w-3.5 h-3.5 text-rose-400" /> Skills to Remove (optional)
            </label>
            <input value={skillsToRemove} onChange={(e) => setSkillsToRemove(e.target.value)}
              className="input-field" placeholder="jQuery, PHP" />
          </div>
        </div>
        <AnimatedButton
          type="submit"
          loading={loading}
          loadingText="Simulating..."
          loaderStyle="dots"
          icon={<Zap className="w-4 h-4" />}
        >
          Run Simulation
        </AnimatedButton>
      </motion.form>

      {/* Error */}
      {error && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="flex items-center gap-2 rounded-2xl px-4 py-3 bg-rose-50 border border-rose-200 text-rose-600">
          <AlertCircle className="w-4 h-4" /><span className="text-sm font-medium">{error}</span>
        </motion.div>
      )}

      {/* Results */}
      {result && (
        <motion.div initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.08 } } }} className="space-y-4">
          {/* Before / After */}
          <motion.div variants={cItem} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="card flex flex-col items-center py-8">
              <p className="text-sm font-display font-bold text-dusk mb-4 uppercase tracking-wider">Before</p>
              <ScoreGauge score={result.before_metrics.risk_score} label="Current Risk" colorMode="risk" size={140} />
            </div>

            <div className="card flex flex-col items-center justify-center py-8"
              style={{ background: 'linear-gradient(135deg, rgba(245,166,35,0.05), rgba(90,158,90,0.05))' }}>
              <motion.div animate={{ x: [0, 8, 0] }} transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}>
                <ArrowRight className="w-8 h-8 text-warm-300 mb-3" />
              </motion.div>
              <p className={`text-4xl font-display font-black ${
                result.risk_delta > 0 ? 'text-green-500' : result.risk_delta < 0 ? 'text-rose-500' : 'text-dusk'
              }`}>
                {result.risk_delta > 0 ? '−' : result.risk_delta < 0 ? '+' : ''}<AnimatedCounter value={Math.abs(result.risk_delta * 100)} decimals={1} suffix="%" />
              </p>
              <p className="text-sm text-dusk mt-1">
                {result.risk_delta > 0 ? 'Risk Reduction' : result.risk_delta < 0 ? 'Risk Increase' : 'No Change'}
              </p>
              {result.risk_delta > 0 && (
                <span className="mt-3 inline-flex items-center bg-green-100 text-green-700 text-xs font-bold px-2.5 py-1 rounded-full border border-green-200">
                  <TrendingDown className="w-3 h-3 mr-1" /> Improved
                </span>
              )}
            </div>

            <div className="card flex flex-col items-center py-8">
              <p className="text-sm font-display font-bold text-dusk mb-4 uppercase tracking-wider">After</p>
              <ScoreGauge score={result.after_metrics.risk_score} label="Simulated Risk" colorMode="risk" size={140} />
            </div>
          </motion.div>

          {/* Detail grids */}
          <motion.div variants={cItem} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="card">
              <h3 className="font-display font-bold text-bark mb-3">Skill Gaps Comparison</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-dusk font-bold mb-2">Before ({result.before_metrics.skill_gaps.length} gaps)</p>
                  <div className="flex flex-wrap gap-1.5">
                    {result.before_metrics.skill_gaps.map((s) => (
                      <span key={s} className="bg-rose-50 text-rose-600 border border-rose-200 text-xs px-2 py-0.5 rounded-full font-medium">{s}</span>
                    ))}
                    {result.before_metrics.skill_gaps.length === 0 && <span className="text-sm text-dusk">No gaps</span>}
                  </div>
                </div>
                <div>
                  <p className="text-xs text-dusk font-bold mb-2">After ({result.after_metrics.skill_gaps.length} gaps)</p>
                  <div className="flex flex-wrap gap-1.5">
                    {result.after_metrics.skill_gaps.map((s) => (
                      <span key={s} className="bg-amber-50 text-amber-700 border border-amber-200 text-xs px-2 py-0.5 rounded-full font-medium">{s}</span>
                    ))}
                    {result.after_metrics.skill_gaps.length === 0 && <span className="text-sm text-dusk">No gaps</span>}
                  </div>
                </div>
              </div>
            </div>

            <div className="card">
              <h3 className="font-display font-bold text-bark mb-3">Skills Modified</h3>
              {result.skills_added.length > 0 && (
                <div className="mb-3">
                  <p className="text-xs text-dusk font-bold mb-2">Added</p>
                  <div className="flex flex-wrap gap-1.5">
                    {result.skills_added.map((s) => (
                      <span key={s} className="bg-green-50 text-green-700 border border-green-200 text-xs px-2 py-0.5 rounded-full font-medium">{s}</span>
                    ))}
                  </div>
                </div>
              )}
              {result.skills_removed.length > 0 && (
                <div>
                  <p className="text-xs text-dusk font-bold mb-2">Removed</p>
                  <div className="flex flex-wrap gap-1.5">
                    {result.skills_removed.map((s) => (
                      <span key={s} className="bg-rose-50 text-rose-600 border border-rose-200 text-xs px-2 py-0.5 rounded-full font-medium">{s}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>

          {/* Explanation */}
          {result.explanation && (
            <motion.div variants={cItem} className="card">
              <h3 className="font-display font-bold text-bark mb-3">AI Summary</h3>
              <p className="text-sm text-bark leading-relaxed whitespace-pre-wrap">
                {typeof result.explanation === 'string'
                  ? result.explanation
                  : (result.explanation as any).summary || (result.explanation as any).text || JSON.stringify(result.explanation, null, 2)}
              </p>
            </motion.div>
          )}
        </motion.div>
      )}
    </motion.div>
  );
}
