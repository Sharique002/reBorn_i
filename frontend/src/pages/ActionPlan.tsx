// ═══════════════════════════════════════════════════════════
// reBorn_i — Personalized Action Plan (Module 10)
// ═══════════════════════════════════════════════════════════

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Map, CheckCircle2, Circle, ChevronRight, Clock, Target,
    Zap, FileText, BookOpen, Users, TrendingUp, Star,
    AlertTriangle, ArrowRight, Calendar, Award,
} from 'lucide-react';

const cItem = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.4 } } };

interface ActionItem {
    id: string;
    text: string;
    priority: 'high' | 'medium' | 'low';
    done: boolean;
    category: string;
}

interface RoadmapSkill {
    skill: string;
    weeks: number;
    ROI: string;
    resources: string[];
}

const IMMEDIATE_FIXES: ActionItem[] = [
    { id: '1', text: 'Add quantified impact metrics to last 3 job roles (e.g., "reduced load time by 40%")', priority: 'high', done: false, category: 'resume' },
    { id: '2', text: 'Remove or condense roles older than 10 years', priority: 'high', done: false, category: 'resume' },
    { id: '3', text: 'Align resume summary with target job description keywords', priority: 'high', done: false, category: 'ats' },
    { id: '4', text: 'Fix inconsistent date formatting across experience section', priority: 'medium', done: true, category: 'formatting' },
    { id: '5', text: 'Add a dedicated Skills section with categorized skill groups', priority: 'high', done: false, category: 'ats' },
    { id: '6', text: 'Replace objective statement with a powerful professional summary', priority: 'medium', done: false, category: 'resume' },
];

const SKILL_ROADMAP: RoadmapSkill[] = [
    { skill: 'Docker', weeks: 2, ROI: '+12% interview probability', resources: ['Docker Docs', 'KodeKloud', 'Play with Docker'] },
    { skill: 'Kubernetes (K8s)', weeks: 4, ROI: '+8% interview probability', resources: ['CNCF Learning Path', 'Kelsey Hightower Boot.dev', 'kube.academy'] },
    { skill: 'CI/CD Pipelines', weeks: 3, ROI: '+7% interview probability', resources: ['GitHub Actions Docs', 'Jenkins Tutorial', 'GitLab CI Quickstart'] },
    { skill: 'System Design', weeks: 5, ROI: '+15% interview pass rate', resources: ['Grokking the System Design', 'Alex Xu Book', 'ByteByteGo'] },
];

const INTERVIEW_PREP: { text: string; done: boolean; tag: string }[] = [
    { text: 'Write 5 STAR behavioral stories', done: false, tag: 'Behavioral' },
    { text: 'Practice 30 LeetCode Medium problems', done: false, tag: 'Technical' },
    { text: 'Complete 2 system design mock sessions', done: false, tag: 'System Design' },
    { text: 'Research top 5 target companies deeply', done: true, tag: 'Research' },
    { text: 'Record yourself explaining a past project', done: false, tag: 'Communication' },
    { text: 'Prepare "Why this company?" answers for each target', done: false, tag: 'Culture' },
];

const RESUME_REWRITES = [
    { before: 'Worked on backend systems', after: 'Architected and maintained high-throughput backend APIs serving 2M+ daily requests', improvement: 'Added scale metric and action verb' },
    { before: 'Helped improve team productivity', after: 'Led adoption of CI/CD pipelines, reducing deployment time by 60% across a 12-person team', improvement: 'Quantified impact + team context' },
    { before: 'Responsible for code reviews', after: 'Conducted 100+ code reviews per quarter, reducing production bugs by 23% through systematic quality gates', improvement: 'Quantified frequency and outcome' },
];

const priorityColors: Record<string, string> = {
    high: 'text-rose-600 bg-rose-50 border-rose-200',
    medium: 'text-amber-600 bg-amber-50 border-amber-200',
    low: 'text-green-600 bg-green-50 border-green-200',
};

export default function ActionPlan() {
    const [fixes, setFixes] = useState<ActionItem[]>(IMMEDIATE_FIXES);
    const [prep, setPrep] = useState(INTERVIEW_PREP);
    const [activeSection, setActiveSection] = useState<'fixes' | 'roadmap' | 'resume' | 'interview'>('fixes');
    const [expandedSkill, setExpandedSkill] = useState<string | null>(null);

    const toggleFix = (id: string) => setFixes((f) => f.map((item) => item.id === id ? { ...item, done: !item.done } : item));
    const togglePrep = (i: number) => setPrep((p) => p.map((item, idx) => idx === i ? { ...item, done: !item.done } : item));

    const fixProgress = fixes.filter((f) => f.done).length;
    const prepProgress = prep.filter((p) => p.done).length;

    const sections = [
        { id: 'fixes', label: 'Immediate Fixes', icon: Zap, color: '#E84565', count: fixes.filter(f => !f.done).length + ' pending' },
        { id: 'roadmap', label: 'Skill Roadmap', icon: TrendingUp, color: '#8B5CF6', count: SKILL_ROADMAP.length + ' skills' },
        { id: 'resume', label: 'Resume Rewrites', icon: FileText, color: '#0EA5E9', count: RESUME_REWRITES.length + ' suggestions' },
        { id: 'interview', label: 'Interview Prep', icon: Users, color: '#5A9E5A', count: prep.filter(p => !p.done).length + ' pending' },
    ] as const;

    return (
        <motion.div initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.08 } } }} className="space-y-6">
            {/* Header */}
            <motion.div variants={cItem} className="flex items-start justify-between">
                <div>
                    <h1 className="text-2xl font-display font-bold text-bark flex items-center gap-2">
                        <Map className="w-6 h-6 text-violet-500" />
                        Personalized Action Plan
                    </h1>
                    <p className="text-dusk mt-1">Your structured path to interview success — execute step by step</p>
                </div>
                <div className="hidden sm:flex items-center gap-2 bg-violet-50 border border-violet-200 px-3 py-1.5 rounded-full">
                    <Calendar className="w-3.5 h-3.5 text-violet-500" />
                    <span className="text-xs font-bold text-violet-700">30-Day Sprint</span>
                </div>
            </motion.div>

            {/* Progress overview */}
            <motion.div variants={cItem} className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: 'Fixes Done', value: fixProgress, total: fixes.length, color: '#E84565' },
                    { label: 'Skills Queued', value: SKILL_ROADMAP.length, total: SKILL_ROADMAP.length, color: '#8B5CF6' },
                    { label: 'Interview Prep', value: prepProgress, total: prep.length, color: '#5A9E5A' },
                    { label: 'Resume Rewrites', value: RESUME_REWRITES.length, total: RESUME_REWRITES.length, color: '#0EA5E9' },
                ].map((s, i) => (
                    <motion.div key={s.label} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 + i * 0.06 }}
                        className="card p-4 text-center">
                        <div className="relative w-14 h-14 mx-auto mb-2">
                            <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                                <circle cx="18" cy="18" r="15.9" fill="none" stroke="rgba(240,230,216,0.8)" strokeWidth="3" />
                                <motion.circle cx="18" cy="18" r="15.9" fill="none" stroke={s.color} strokeWidth="3"
                                    strokeDasharray={`${(s.value / s.total) * 100} 100`} strokeLinecap="round"
                                    initial={{ strokeDasharray: '0 100' }}
                                    animate={{ strokeDasharray: `${(s.value / s.total) * 100} 100` }}
                                    transition={{ duration: 1, delay: 0.3 + i * 0.1, ease: 'easeOut' }}
                                />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-sm font-black" style={{ color: s.color }}>{s.value}</span>
                            </div>
                        </div>
                        <p className="text-xs text-dusk font-semibold">{s.label}</p>
                        <p className="text-[10px] text-muted">of {s.total}</p>
                    </motion.div>
                ))}
            </motion.div>

            {/* Section tabs */}
            <motion.div variants={cItem}>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                    {sections.map((s) => {
                        const Icon = s.icon;
                        return (
                            <motion.button key={s.id} whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }}
                                onClick={() => setActiveSection(s.id)}
                                className={`p-4 rounded-2xl text-left border-2 transition-all duration-300 ${activeSection === s.id ? 'shadow-md' : 'border-transparent bg-white hover:border-warm-200'
                                    }`}
                                style={activeSection === s.id
                                    ? { borderColor: s.color, background: `${s.color}08`, boxShadow: `0 4px 20px ${s.color}18` }
                                    : { border: '1px solid var(--border)', background: 'white' }
                                }>
                                <Icon className="w-5 h-5 mb-2" style={{ color: s.color }} />
                                <h4 className="font-display font-bold text-bark text-sm">{s.label}</h4>
                                <p className="text-xs text-dusk">{s.count}</p>
                            </motion.button>
                        );
                    })}
                </div>

                <AnimatePresence mode="wait">
                    {/* Immediate Fixes */}
                    {activeSection === 'fixes' && (
                        <motion.div key="fixes" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                            className="card space-y-3">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="font-display font-bold text-bark flex items-center gap-2">
                                    <Zap className="w-4 h-4 text-rose-500" /> Immediate Fixes
                                </h3>
                                <div className="flex items-center gap-2">
                                    <div className="w-24 h-2 bg-warm-100 rounded-full overflow-hidden">
                                        <motion.div initial={{ width: 0 }} animate={{ width: `${(fixProgress / fixes.length) * 100}%` }}
                                            transition={{ duration: 0.8 }} className="h-full bg-rose-400 rounded-full" />
                                    </div>
                                    <span className="text-xs text-dusk">{fixProgress}/{fixes.length}</span>
                                </div>
                            </div>
                            {fixes.map((fix, i) => (
                                <motion.div key={fix.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                                    onClick={() => toggleFix(fix.id)}
                                    className={`flex items-start gap-3 p-3 rounded-2xl border cursor-pointer transition-all hover:shadow-sm ${fix.done ? 'bg-green-50 border-green-200 opacity-70' : 'bg-white border-warm-100 hover:border-warm-300'
                                        }`}>
                                    {fix.done
                                        ? <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                                        : <Circle className="w-5 h-5 text-warm-300 mt-0.5 flex-shrink-0" />}
                                    <div className="flex-1">
                                        <p className={`text-sm ${fix.done ? 'line-through text-dusk' : 'text-bark'}`}>{fix.text}</p>
                                    </div>
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border capitalize ${priorityColors[fix.priority]}`}>
                                        {fix.priority}
                                    </span>
                                </motion.div>
                            ))}
                        </motion.div>
                    )}

                    {/* Skill Roadmap */}
                    {activeSection === 'roadmap' && (
                        <motion.div key="roadmap" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                            className="space-y-4">
                            {SKILL_ROADMAP.map((skill, i) => (
                                <motion.div key={skill.skill} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                                    className="card cursor-pointer" onClick={() => setExpandedSkill(expandedSkill === skill.skill ? null : skill.skill)}>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-xl bg-violet-100 flex items-center justify-center text-sm font-black text-violet-700">
                                                {i + 1}
                                            </div>
                                            <div>
                                                <h4 className="font-display font-bold text-bark">{skill.skill}</h4>
                                                <div className="flex items-center gap-3 text-xs text-dusk">
                                                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {skill.weeks} weeks</span>
                                                    <span className="text-green-600 font-semibold">{skill.ROI}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <motion.div animate={{ rotate: expandedSkill === skill.skill ? 90 : 0 }}>
                                            <ChevronRight className="w-4 h-4 text-dusk" />
                                        </motion.div>
                                    </div>
                                    <AnimatePresence>
                                        {expandedSkill === skill.skill && (
                                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                                                className="overflow-hidden mt-3 pt-3 border-t border-warm-100">
                                                <p className="text-xs font-bold text-dusk uppercase tracking-wider mb-2">Recommended Resources</p>
                                                <ul className="space-y-1.5">
                                                    {skill.resources.map((r) => (
                                                        <li key={r} className="flex items-center gap-2 text-sm text-bark">
                                                            <BookOpen className="w-3.5 h-3.5 text-violet-400 flex-shrink-0" />
                                                            {r}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </motion.div>
                            ))}
                        </motion.div>
                    )}

                    {/* Resume Rewrites */}
                    {activeSection === 'resume' && (
                        <motion.div key="resume" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                            className="space-y-4">
                            {RESUME_REWRITES.map((rw, i) => (
                                <motion.div key={i} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                                    className="card space-y-3">
                                    <div className="flex items-center gap-2">
                                        <AlertTriangle className="w-4 h-4 text-amber-500" />
                                        <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">Weak Version</span>
                                    </div>
                                    <div className="p-3 rounded-xl bg-rose-50 border border-rose-100 text-sm text-rose-800 italic">
                                        "{rw.before}"
                                    </div>
                                    <div className="flex items-center justify-center">
                                        <ArrowRight className="w-4 h-4 text-warm-400" />
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                                        <span className="text-xs font-bold text-green-600 uppercase tracking-wider">Improved Version</span>
                                    </div>
                                    <div className="p-3 rounded-xl bg-green-50 border border-green-100 text-sm text-green-800 italic">
                                        "{rw.after}"
                                    </div>
                                    <div className="flex items-center gap-2 p-2 rounded-xl bg-warm-50 border border-warm-100">
                                        <Star className="w-3.5 h-3.5 text-warm-500 flex-shrink-0" />
                                        <span className="text-xs text-dusk">{rw.improvement}</span>
                                    </div>
                                </motion.div>
                            ))}
                        </motion.div>
                    )}

                    {/* Interview Prep */}
                    {activeSection === 'interview' && (
                        <motion.div key="interview" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                            className="card space-y-3">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="font-display font-bold text-bark flex items-center gap-2">
                                    <Users className="w-4 h-4 text-green-500" /> Interview Checklist
                                </h3>
                                <div className="flex items-center gap-2">
                                    <div className="w-24 h-2 bg-warm-100 rounded-full overflow-hidden">
                                        <motion.div initial={{ width: 0 }} animate={{ width: `${(prepProgress / prep.length) * 100}%` }}
                                            transition={{ duration: 0.8 }} className="h-full bg-green-400 rounded-full" />
                                    </div>
                                    <span className="text-xs text-dusk">{prepProgress}/{prep.length}</span>
                                </div>
                            </div>
                            {prep.map((item, i) => (
                                <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                                    onClick={() => togglePrep(i)}
                                    className={`flex items-center gap-3 p-3 rounded-2xl border cursor-pointer transition-all ${item.done ? 'bg-green-50 border-green-200 opacity-70' : 'bg-white border-warm-100 hover:border-warm-300'
                                        }`}>
                                    {item.done
                                        ? <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                                        : <Circle className="w-5 h-5 text-warm-300 flex-shrink-0" />}
                                    <p className={`text-sm flex-1 ${item.done ? 'line-through text-dusk' : 'text-bark'}`}>{item.text}</p>
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-warm-100 text-warm-700 border border-warm-200">{item.tag}</span>
                                </motion.div>
                            ))}
                            {prepProgress === prep.length && (
                                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                                    className="flex items-center gap-3 p-4 rounded-2xl bg-green-50 border border-green-200">
                                    <Award className="w-6 h-6 text-green-500" />
                                    <div>
                                        <p className="font-bold text-green-700 text-sm">Interview Ready!</p>
                                        <p className="text-xs text-green-600">You've completed all prep tasks. Start applying confidently.</p>
                                    </div>
                                </motion.div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </motion.div>
    );
}
