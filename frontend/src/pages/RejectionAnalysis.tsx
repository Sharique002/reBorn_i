import { useState, useEffect, useRef, type FormEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { analysisAPI, resumeAPI } from '../api/client';
import type { RejectionAnalysisResponse, ResumeUploadResponse } from '../types';
import ScoreGauge from '../components/ScoreGauge';
import { AnalysisIllustration } from '../components/Illustrations';
import {
  ShieldAlert, Loader2, AlertCircle, AlertTriangle, TrendingDown,
  Target, BarChart3, FileText, CheckCircle2, Wrench, Briefcase,
  Info, Lightbulb, Activity, ChevronRight, Flower2,
} from 'lucide-react';
import AnimatedButton from '../components/AnimatedButton';
import { AnimatedCounter } from '../components/Animations';

const UUID_REGEX = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
const cItem = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.4 } } };

function extractErrorMessage(err: any, fallback = 'Something went wrong'): string {
  const data = err?.response?.data;
  if (!data) return err?.message || fallback;
  if (typeof data.message === 'string') return data.message;
  if (typeof data.detail === 'string') return data.detail;
  if (Array.isArray(data.detail)) return data.detail.map((d: any) => d.msg || JSON.stringify(d)).join('; ');
  return fallback;
}

export default function RejectionAnalysis() {
  const [resumeId, setResumeId] = useState('');
  const [jobDesc, setJobDesc] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [requiredSkills, setRequiredSkills] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<RejectionAnalysisResponse | null>(null);
  const [error, setError] = useState('');
  const [resumeData, setResumeData] = useState<ResumeUploadResponse | null>(null);
  const [resumeLoading, setResumeLoading] = useState(false);
  const [resumeError, setResumeError] = useState('');
  const [skillsAutoFilled, setSkillsAutoFilled] = useState(false);
  const fetchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (fetchTimerRef.current) clearTimeout(fetchTimerRef.current);
    const trimmed = resumeId.trim();
    if (!UUID_REGEX.test(trimmed)) { setResumeData(null); setResumeError(''); return; }
    setResumeLoading(true); setResumeError('');
    fetchTimerRef.current = setTimeout(async () => {
      try {
        const { data } = await resumeAPI.get(trimmed);
        setResumeData(data); setResumeError('');
        if (data.structured_data?.skills && data.structured_data.skills.length > 0) {
          if (!requiredSkills.trim() || skillsAutoFilled) {
            setRequiredSkills(data.structured_data.skills.map((s) => s.name).join(', '));
            setSkillsAutoFilled(true);
          }
        }
      } catch (err: any) {
        setResumeData(null);
        if (err.response?.status === 404) setResumeError('Resume not found.');
        else if (err.response?.status === 401) setResumeError('Session expired.');
        else setResumeError(extractErrorMessage(err, 'Failed to fetch resume.'));
      } finally { setResumeLoading(false); }
    }, 400);
    return () => { if (fetchTimerRef.current) clearTimeout(fetchTimerRef.current); };
  }, [resumeId]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault(); setLoading(true); setError(''); setResult(null);
    try {
      const skills = requiredSkills.split(',').map((s) => s.trim()).filter(Boolean);
      const { data } = await analysisAPI.rejectionRisk({
        resume_id: resumeId, job_description: jobDesc,
        job_title: jobTitle || undefined,
        required_skills: skills.length > 0 ? skills : undefined,
      });
      setResult(data);
    } catch (err: any) { setError(extractErrorMessage(err, 'Analysis failed')); }
    finally { setLoading(false); }
  };

  const riskLabel = (score: number) => {
    const pct = score * 100;
    if (pct >= 70) return { text: 'Critical', cls: 'bg-rose-100 text-rose-700 border border-rose-200 px-2.5 py-0.5 rounded-full text-xs font-bold' };
    if (pct >= 50) return { text: 'High', cls: 'bg-orange-100 text-orange-700 border border-orange-200 px-2.5 py-0.5 rounded-full text-xs font-bold' };
    if (pct >= 30) return { text: 'Moderate', cls: 'bg-amber-100 text-amber-700 border border-amber-200 px-2.5 py-0.5 rounded-full text-xs font-bold' };
    return { text: 'Low', cls: 'bg-green-100 text-green-700 border border-green-200 px-2.5 py-0.5 rounded-full text-xs font-bold' };
  };

  const riskBarColor = (risk: number) => {
    const pct = risk * 100;
    if (pct >= 70) return 'bg-rose-400';
    if (pct >= 50) return 'bg-orange-400';
    if (pct >= 30) return 'bg-amber-400';
    return 'bg-green-400';
  };

  const borderAccent = (level: string) => {
    if (level === 'Critical') return 'border-l-rose-400';
    if (level === 'High') return 'border-l-orange-400';
    if (level === 'Moderate') return 'border-l-amber-400';
    return 'border-l-green-400';
  };

  return (
    <motion.div initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.07 } } }} className="space-y-6">
      <motion.div variants={cItem} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-bark flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-rose-400" />
            Rejection Risk Analysis
          </h1>
          <p className="text-dusk mt-1">Compute your deterministic rejection risk score against a target job</p>
        </div>
        <div className="hidden sm:block">
          <AnalysisIllustration size={140} />
        </div>
      </motion.div>

      {/* Form */}
      <motion.form variants={cItem} onSubmit={handleSubmit} className="card space-y-5">
        <div>
          <label className="label">Resume ID</label>
          <input value={resumeId} onChange={(e) => { setResumeId(e.target.value); if (!e.target.value.trim()) setSkillsAutoFilled(false); }}
            className="input-field font-mono text-sm" placeholder="Paste your resume UUID from the upload step" required />
          {resumeLoading && (
            <div className="flex items-center gap-2 mt-2 text-dusk text-sm">
              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Fetching resume data...
            </div>
          )}
          {resumeError && (
            <div className="flex items-center gap-2 mt-2 text-rose-500 text-sm">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" /> {resumeError}
            </div>
          )}
        </div>

        {/* Resume card */}
        <AnimatePresence>
          {resumeData && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
              className="bg-green-50 border border-green-200 rounded-2xl p-4 space-y-3 overflow-hidden">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                <span className="text-sm font-bold text-green-700">Resume loaded</span>
              </div>
              <div className="flex flex-wrap gap-4 text-sm">
                <div className="flex items-center gap-1.5 text-bark"><FileText className="w-3.5 h-3.5 text-warm-500" />{resumeData.filename}</div>
                <div className="flex items-center gap-1.5 text-bark"><Wrench className="w-3.5 h-3.5 text-warm-500" />{resumeData.skills_count} skills</div>
                {resumeData.structured_data?.experience_level && (
                  <div className="flex items-center gap-1.5 text-bark">
                    <Briefcase className="w-3.5 h-3.5 text-sky-500" />
                    <span className="capitalize">{resumeData.structured_data.experience_level}</span>
                    {resumeData.structured_data.total_experience_years != null && ` · ${resumeData.structured_data.total_experience_years} yrs`}
                  </div>
                )}
              </div>
              {resumeData.structured_data?.skills && resumeData.structured_data.skills.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {resumeData.structured_data.skills.slice(0, 12).map((s) => (
                    <span key={s.name} className="skill-tag text-xs">{s.name}</span>
                  ))}
                  {resumeData.structured_data.skills.length > 12 && (
                    <span className="text-xs px-2 py-0.5 text-dusk">+{resumeData.structured_data.skills.length - 12} more</span>
                  )}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <div>
          <label className="label">Job Description</label>
          <textarea value={jobDesc} onChange={(e) => setJobDesc(e.target.value)} className="input-field min-h-[140px] resize-y"
            placeholder="Paste the full job description here (minimum 50 characters)..." required minLength={50} />
          <div className={`text-xs mt-1 ${jobDesc.trim().length < 50 ? 'text-rose-400' : 'text-green-500'}`}>
            {jobDesc.trim().length}/50 characters minimum
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label">Job Title (optional)</label>
            <input value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} className="input-field" placeholder="e.g. Senior Software Engineer" />
          </div>
          <div>
            <label className="label">
              Required Skills (optional)
              {skillsAutoFilled && <span className="ml-2 text-xs text-warm-500 font-normal">· auto-filled</span>}
            </label>
            <input value={requiredSkills} onChange={(e) => { setRequiredSkills(e.target.value); setSkillsAutoFilled(false); }}
              className="input-field" placeholder="Python, AWS, Docker, Kubernetes" />
          </div>
        </div>
        <AnimatedButton
          type="submit"
          loading={loading}
          loadingText="Analyzing..."
          icon={<Target className="w-4 h-4" />}
        >
          Analyze Rejection Risk
        </AnimatedButton>
      </motion.form>

      {/* Error */}
      {error && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="flex items-center gap-2 rounded-2xl px-4 py-3 bg-rose-50 border border-rose-200 text-rose-600">
          <AlertCircle className="w-4 h-4 flex-shrink-0" /><span className="text-sm font-medium">{error}</span>
        </motion.div>
      )}

      {/* Results */}
      {result && (
        <motion.div initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.08 } } }} className="space-y-4">
          {/* Score + Risk */}
          <motion.div variants={cItem} className="card flex flex-col md:flex-row items-center gap-8">
            <ScoreGauge score={result.risk_score} label="Rejection Risk" colorMode="risk" size={180} />
            <div className="flex-1 space-y-3">
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className="text-xl font-display font-bold text-bark">Risk Score: <AnimatedCounter value={result.final_risk_percent} decimals={1} suffix="%" /></h2>
                <span className={riskLabel(result.risk_score).cls}>{result.risk_level}</span>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                  result.domain_detected === 'Tech' ? 'bg-sky-100 text-sky-700 border-sky-200' : 'bg-violet-100 text-violet-700 border-violet-200'
                }`}>{result.domain_detected} · {result.model_used}</span>
              </div>
              {result.confidence_interval && (
                <p className="text-xs text-dusk">95% CI: {result.confidence_interval.lower.toFixed(1)}% – {result.confidence_interval.upper.toFixed(1)}% (±{result.confidence_interval.margin.toFixed(1)}%)</p>
              )}
              <div className="bg-warm-50 rounded-2xl p-3 text-sm text-bark leading-relaxed border border-warm-100">
                <div className="flex items-start gap-2">
                  <Info className="w-4 h-4 text-warm-500 mt-0.5 flex-shrink-0" />
                  <span>{result.why_risk_is_high}</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Guidance */}
          <motion.div variants={cItem} className={`card border-l-4 ${borderAccent(result.risk_level)}`}>
            <div className="flex items-center gap-2 mb-2">
              <Lightbulb className="w-4 h-4 text-amber-500" />
              <h3 className="font-display font-bold text-sm text-bark">Guidance</h3>
            </div>
            <p className="text-sm text-dusk leading-relaxed">{result.behavior_guidance_message}</p>
          </motion.div>

          {/* 5-Layer Breakdown */}
          <motion.div variants={cItem} className="card">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="w-4.5 h-4.5 text-warm-500" />
              <h3 className="font-display font-bold text-bark">5-Layer Risk Breakdown</h3>
            </div>
            <div className="space-y-4">
              {result.component_scores.map((layer) => (
                <div key={layer.layer}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-bark font-medium">{layer.label}</span>
                    <span className="text-dusk font-mono text-xs">
                      {(layer.risk * 100).toFixed(1)}% risk · w={layer.weight} · {layer.contribution_percent.toFixed(1)}% of total
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-warm-100 rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(layer.risk * 100, 100)}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                      className={`h-full rounded-full ${riskBarColor(layer.risk)}`} />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 flex flex-wrap gap-3 text-xs">
              <span className="bg-rose-50 text-rose-600 border border-rose-200 rounded-full px-3 py-1 font-medium">Highest: {result.highest_risk_area}</span>
              <span className="bg-orange-50 text-orange-600 border border-orange-200 rounded-full px-3 py-1 font-medium">2nd: {result.secondary_risk_area}</span>
            </div>
          </motion.div>

          {/* Chart */}
          {result.chart_base64 && (
            <motion.div variants={cItem} className="card">
              <div className="flex items-center gap-2 mb-4">
                <Activity className="w-4.5 h-4.5 text-warm-500" />
                <h3 className="font-display font-bold text-bark">Risk Chart</h3>
              </div>
              <div className="flex justify-center bg-warm-50 rounded-2xl p-4">
                <img src={`data:image/png;base64,${result.chart_base64}`} alt="Risk breakdown" className="max-w-full h-auto rounded-xl" />
              </div>
            </motion.div>
          )}

          {/* Recommended Actions */}
          {result.recommended_actions && result.recommended_actions.length > 0 && (
            <motion.div variants={cItem} className="card">
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle2 className="w-4.5 h-4.5 text-green-500" />
                <h3 className="font-display font-bold text-bark">Recommended Actions</h3>
              </div>
              <ul className="space-y-2">
                {result.recommended_actions.map((action, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-bark">
                    <ChevronRight className="w-3.5 h-3.5 text-warm-500 mt-0.5 flex-shrink-0" />{action}
                  </li>
                ))}
              </ul>
            </motion.div>
          )}

          {/* Skill Gaps */}
          {result.skill_gaps.length > 0 && (
            <motion.div variants={cItem} className="card">
              <div className="flex items-center gap-2 mb-4">
                <TrendingDown className="w-4.5 h-4.5 text-rose-400" />
                <h3 className="font-display font-bold text-bark">Skill Gaps</h3>
                <span className="bg-rose-100 text-rose-700 border border-rose-200 px-2.5 py-0.5 rounded-full text-xs font-bold">{result.skill_gaps.length} missing</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {result.skill_gaps.map((gap) => (
                  <span key={gap} className="bg-rose-50 text-rose-600 border border-rose-200 text-xs px-2.5 py-1 rounded-full font-medium">{gap}</span>
                ))}
              </div>
            </motion.div>
          )}

          {/* Top Rejection Reasons */}
          {result.top_rejection_reasons.length > 0 && (
            <motion.div variants={cItem} className="card">
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle className="w-4.5 h-4.5 text-amber-500" />
                <h3 className="font-display font-bold text-bark">Top Rejection Reasons</h3>
              </div>
              <ul className="space-y-2">
                {result.top_rejection_reasons.map((reason, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-bark">
                    <span className="text-amber-500 font-bold mt-0.5">{i + 1}.</span>{reason}
                  </li>
                ))}
              </ul>
            </motion.div>
          )}

          {/* LLM Explanation */}
          {result.explanation && (
            <motion.div variants={cItem} className="card">
              <h3 className="font-display font-bold text-bark mb-3">AI Explanation</h3>

              {(result.explanation as any).summary && (
                <p className="text-sm text-bark leading-relaxed mb-4">{(result.explanation as any).summary}</p>
              )}
              {(result.explanation as any).reason_explanations?.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-xs font-bold text-dusk uppercase tracking-wider mb-2">Detailed Reasons</h4>
                  <ul className="space-y-1.5">
                    {(result.explanation as any).reason_explanations.map((r: string, i: number) => (
                      <li key={i} className="text-sm text-dusk flex items-start gap-2"><span className="text-warm-500 mt-0.5">•</span>{r}</li>
                    ))}
                  </ul>
                </div>
              )}
              {(result.explanation as any).skill_gap_actions?.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-xs font-bold text-dusk uppercase tracking-wider mb-2">Skill Gap Actions</h4>
                  <ul className="space-y-1.5">
                    {(result.explanation as any).skill_gap_actions.map((a: string, i: number) => (
                      <li key={i} className="text-sm text-dusk flex items-start gap-2">
                        <ChevronRight className="w-3.5 h-3.5 text-green-500 mt-0.5 flex-shrink-0" />{a}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {(result.explanation as any).encouragement && (
                <p className="text-sm text-green-600 italic">{(result.explanation as any).encouragement}</p>
              )}
              {typeof result.explanation === 'string' && (
                <p className="text-sm text-bark leading-relaxed whitespace-pre-wrap">{result.explanation}</p>
              )}
            </motion.div>
          )}
        </motion.div>
      )}
    </motion.div>
  );
}
