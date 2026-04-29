import { useState, type FormEvent } from 'react';
import { motion } from 'framer-motion';
import { blueprintAPI } from '../api/client';
import type { BlueprintResponse } from '../types';
import { BlueprintIllustration } from '../components/Illustrations';
import {
  Map, Loader2, AlertCircle, CheckCircle2, Clock, Target,
  TrendingDown, Calendar, BookOpen, Wrench, Users, Send, Flower2,
} from 'lucide-react';
import AnimatedButton from '../components/AnimatedButton';

const catIcon = (c: string) => {
  switch (c) {
    case 'learning': return <BookOpen className="w-3.5 h-3.5 text-sky-500" />;
    case 'building': return <Wrench className="w-3.5 h-3.5 text-amber-500" />;
    case 'networking': return <Users className="w-3.5 h-3.5 text-green-500" />;
    case 'applying': return <Send className="w-3.5 h-3.5 text-violet-500" />;
    default: return <Target className="w-3.5 h-3.5 text-dusk" />;
  }
};

const catColor = (c: string) => {
  switch (c) {
    case 'learning': return 'border-sky-200 bg-sky-50';
    case 'building': return 'border-amber-200 bg-amber-50';
    case 'networking': return 'border-green-200 bg-green-50';
    case 'applying': return 'border-violet-200 bg-violet-50';
    default: return 'border-warm-200 bg-warm-50';
  }
};

const cItem = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.4 } } };

export default function Blueprint() {
  const [resumeId, setResumeId] = useState('');
  const [jobDesc, setJobDesc] = useState('');
  const [targetRole, setTargetRole] = useState('');
  const [planType, setPlanType] = useState<'30_day' | '90_day'>('30_day');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<BlueprintResponse | null>(null);
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault(); setLoading(true); setError(''); setResult(null);
    try {
      const { data } = await blueprintAPI.generate({
        resume_id: resumeId, job_description: jobDesc,
        target_role: targetRole, plan_type: planType,
      });
      setResult(data);
    } catch (err: any) {
      setError(err.response?.data?.message || err.response?.data?.detail || 'Blueprint generation failed');
    } finally { setLoading(false); }
  };

  return (
    <motion.div initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.08 } } }} className="space-y-6">
      <motion.div variants={cItem} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-bark flex items-center gap-2">
            <Map className="w-6 h-6 text-violet-500" />
            Reinvention Blueprint
          </h1>
          <p className="text-dusk mt-1">Generate a personalized action plan to close skill gaps and land your target role</p>
        </div>
        <div className="hidden sm:block">
          <BlueprintIllustration size={140} />
        </div>
      </motion.div>

      {/* Form */}
      <motion.form variants={cItem} onSubmit={handleSubmit} className="card space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label">Resume ID</label>
            <input value={resumeId} onChange={(e) => setResumeId(e.target.value)}
              className="input-field font-mono text-sm" placeholder="Paste your resume UUID" required />
          </div>
          <div>
            <label className="label">Target Role</label>
            <input value={targetRole} onChange={(e) => setTargetRole(e.target.value)}
              className="input-field" placeholder="e.g. Senior DevOps Engineer" required />
          </div>
        </div>
        <div>
          <label className="label">Job Description</label>
          <textarea value={jobDesc} onChange={(e) => setJobDesc(e.target.value)}
            className="input-field min-h-[120px] resize-y" placeholder="Paste the target job description..." required />
        </div>

        {/* Plan toggle */}
        <div>
          <label className="label">Plan Duration</label>
          <div className="flex gap-3">
            {[
              { val: '30_day' as const, label: '30-Day Sprint' },
              { val: '90_day' as const, label: '90-Day Transformation' },
            ].map((opt) => (
              <motion.button key={opt.val} type="button" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                onClick={() => setPlanType(opt.val)}
                className={`flex-1 py-3 rounded-2xl text-sm font-bold border transition-all ${
                  planType === opt.val
                    ? 'bg-warm-100 border-warm-300 text-warm-700'
                    : 'bg-white border-warm-200 text-dusk hover:border-warm-300'
                }`}>
                <Calendar className="w-4 h-4 inline mr-2" />{opt.label}
              </motion.button>
            ))}
          </div>
        </div>

        <AnimatedButton
          type="submit"
          loading={loading}
          loadingText="Generating Blueprint..."
          loaderStyle="dots"
          icon={<Map className="w-4 h-4" />}
        >
          Generate Blueprint
        </AnimatedButton>
      </motion.form>

      {/* Error */}
      {error && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="flex items-center gap-2 rounded-2xl px-4 py-3 bg-rose-50 border border-rose-200 text-rose-600">
          <AlertCircle className="w-4 h-4" /><span className="text-sm font-medium">{error}</span>
        </motion.div>
      )}

      {/* 30-day */}
      {result && result.plan_type === '30_day' && result.plan_data && (
        <motion.div initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.08 } } }} className="space-y-4">
          <motion.div variants={cItem} className="card"
            style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.06), rgba(245,166,35,0.06))' }}>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-display font-bold text-bark">30-Day Blueprint</h2>
                <p className="text-sm text-dusk">Target: {result.target_role}</p>
              </div>
              {result.risk_score_at_creation != null && (
                <div className="text-right">
                  <div className="flex items-center gap-1 text-amber-600">
                    <TrendingDown className="w-4 h-4" /><span className="font-display font-black">{(result.risk_score_at_creation * 100).toFixed(0)}%</span>
                  </div>
                  <p className="text-xs text-dusk">Risk at Creation</p>
                </div>
              )}
            </div>
          </motion.div>

          {result.plan_data.key_focus_areas?.length > 0 && (
            <motion.div variants={cItem} className="flex flex-wrap gap-2">
              {result.plan_data.key_focus_areas.map((area: string) => (
                <span key={area} className="bg-violet-100 text-violet-700 border border-violet-200 text-xs font-bold px-2.5 py-1 rounded-full">{area}</span>
              ))}
            </motion.div>
          )}

          {result.plan_data.weeks && (
            <div className="space-y-4">
              {result.plan_data.weeks.map((week: any, wi: number) => (
                <motion.div key={week.week_number} variants={cItem} className="card">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-9 h-9 rounded-full bg-warm-100 border border-warm-200 flex items-center justify-center text-sm font-display font-black text-warm-600">
                      {week.week_number}
                    </div>
                    <div>
                      <h3 className="font-display font-bold text-bark">Week {week.week_number}: {week.theme}</h3>
                      <p className="text-xs text-dusk">{week.measurable_outcome}</p>
                    </div>
                  </div>
                  <div className="space-y-2 mb-4">
                    {(week.tasks || []).map((task: any, i: number) => (
                      <div key={i} className={`flex items-start gap-3 p-3 rounded-2xl border ${catColor(task.category)}`}>
                        {catIcon(task.category)}
                        <div className="flex-1">
                          <p className="text-sm text-bark">{task.task}</p>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-[10px] text-dusk uppercase tracking-wider font-bold">{task.category}</span>
                            <span className="text-[10px] text-dusk flex items-center gap-1"><Clock className="w-2.5 h-2.5" />{task.estimated_hours}h</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  {week.milestone && (
                    <div className="flex items-center gap-2 text-sm text-dusk pt-3 border-t border-warm-100">
                      <CheckCircle2 className="w-4 h-4 text-green-400" />
                      <span className="font-bold">Milestone:</span> {week.milestone}
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {/* 90-day */}
      {result && result.plan_type === '90_day' && result.plan_data && (
        <motion.div initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.08 } } }} className="space-y-4">
          <motion.div variants={cItem} className="card"
            style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.06), rgba(245,166,35,0.06))' }}>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-display font-bold text-bark">90-Day Transformation</h2>
                <p className="text-sm text-dusk">Target: {result.target_role}</p>
              </div>
              {result.risk_score_at_creation != null && (
                <div className="text-right">
                  <div className="flex items-center gap-1 text-amber-600">
                    <TrendingDown className="w-4 h-4" /><span className="font-display font-black">{(result.risk_score_at_creation * 100).toFixed(0)}%</span>
                  </div>
                  <p className="text-xs text-dusk">Risk at Creation</p>
                </div>
              )}
            </div>
            {result.plan_data.career_trajectory && (
              <p className="text-sm text-dusk mt-3 italic">{result.plan_data.career_trajectory}</p>
            )}
          </motion.div>

          {result.plan_data.months && (
            <div className="space-y-6">
              {result.plan_data.months.map((month: any) => (
                <motion.div key={month.month_number} variants={cItem} className="card">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-11 h-11 rounded-xl bg-violet-100 border border-violet-200 flex items-center justify-center text-lg font-display font-black text-violet-600">
                      {month.month_number}
                    </div>
                    <div>
                      <h3 className="font-display font-bold text-lg text-bark">Month {month.month_number}: {month.phase_name}</h3>
                      <p className="text-xs text-dusk">{month.milestone}</p>
                    </div>
                  </div>
                  <div className="space-y-4 mb-4">
                    {(month.weekly_focuses || []).map((wf: any, wi: number) => (
                      <div key={wi}>
                        <div className="flex items-center gap-2 mb-2">
                          <Calendar className="w-3.5 h-3.5 text-dusk" />
                          <span className="text-xs font-bold text-dusk">{wf.week_range}</span>
                          <span className="text-xs text-dusk">— {wf.focus}</span>
                        </div>
                        <div className="space-y-2 ml-5">
                          {(wf.tasks || []).map((task: any, ti: number) => (
                            <div key={ti} className={`flex items-start gap-3 p-3 rounded-2xl border ${catColor(task.category)}`}>
                              {catIcon(task.category)}
                              <div className="flex-1">
                                <p className="text-sm text-bark">{task.task}</p>
                                <div className="flex items-center gap-3 mt-1">
                                  <span className="text-[10px] text-dusk uppercase tracking-wider font-bold">{task.category}</span>
                                  {task.priority && (
                                    <span className={`text-[10px] uppercase tracking-wider font-bold ${task.priority === 'high' ? 'text-rose-500' : 'text-dusk'}`}>{task.priority}</span>
                                  )}
                                  <span className="text-[10px] text-dusk flex items-center gap-1"><Clock className="w-2.5 h-2.5" />{task.estimated_hours}h</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                  {month.kpis?.length > 0 && (
                    <div className="pt-3 border-t border-warm-100">
                      <p className="text-xs font-bold text-dusk mb-2">KPIs</p>
                      <div className="flex flex-wrap gap-2">
                        {month.kpis.map((kpi: string, i: number) => (
                          <span key={i} className="inline-flex items-center bg-green-50 text-green-700 border border-green-200 text-xs font-bold px-2.5 py-1 rounded-full">
                            <CheckCircle2 className="w-3 h-3 mr-1" />{kpi}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      )}
    </motion.div>
  );
}
