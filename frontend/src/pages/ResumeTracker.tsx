// ═══════════════════════════════════════════════════════════
// reBorn_i — Resume Evolution Tracker (Module 7)
// ═══════════════════════════════════════════════════════════

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import {
    FileText, TrendingUp, Upload, CheckCircle2, ChevronRight,
    Award, Clock, AlertCircle, Plus, Eye, ArrowUp,
} from 'lucide-react';

const cItem = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.4 } } };

interface ResumeVersion {
    version: string;
    date: string;
    score: number;
    atsScore: number;
    keyChange: string;
    improvements: string[];
    filename: string;
    status: 'active' | 'archived';
}

const VERSIONS: ResumeVersion[] = [
    {
        version: 'v1.0',
        date: 'Jan 15, 2026',
        score: 28,
        atsScore: 32,
        keyChange: 'Initial upload',
        improvements: [],
        filename: 'resume_jan_v1.pdf',
        status: 'archived',
    },
    {
        version: 'v2.0',
        date: 'Feb 3, 2026',
        score: 42,
        atsScore: 51,
        keyChange: 'Added Docker & Kubernetes skills',
        improvements: ['Added Docker skill section', 'Rewrote summary with metrics', 'Removed irrelevant roles'],
        filename: 'resume_feb_v2.pdf',
        status: 'archived',
    },
    {
        version: 'v2.1',
        date: 'Feb 18, 2026',
        score: 48,
        atsScore: 58,
        keyChange: 'CI/CD experience added + grammar fixes',
        improvements: ['Added CI/CD pipeline project', 'Fixed 3 grammar issues', 'Added measurable impact metrics'],
        filename: 'resume_feb_v2_1.pdf',
        status: 'archived',
    },
    {
        version: 'v3.0',
        date: 'Mar 1, 2026',
        score: 51,
        atsScore: 67,
        keyChange: 'ATS optimization + Keywords aligned',
        improvements: ['Keyword-aligned to JD', 'Reformatted skills section', 'Added certifications section', 'Impact metrics in all roles'],
        filename: 'resume_mar_v3.pdf',
        status: 'active',
    },
];

const chartData = VERSIONS.map((v) => ({
    version: v.version,
    score: v.score,
    atsScore: v.atsScore,
}));

const totalGain = VERSIONS[VERSIONS.length - 1].score - VERSIONS[0].score;
const atsGain = VERSIONS[VERSIONS.length - 1].atsScore - VERSIONS[0].atsScore;

export default function ResumeTracker() {
    const [selectedVersion, setSelectedVersion] = useState<ResumeVersion>(VERSIONS[VERSIONS.length - 1]);
    const [showUpload, setShowUpload] = useState(false);
    const [dragging, setDragging] = useState(false);

    return (
        <motion.div initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.08 } } }} className="space-y-6">
            {/* Header */}
            <motion.div variants={cItem} className="flex items-start justify-between">
                <div>
                    <h1 className="text-2xl font-display font-bold text-bark flex items-center gap-2">
                        <TrendingUp className="w-6 h-6 text-warm-500" />
                        Resume Evolution Tracker
                    </h1>
                    <p className="text-dusk mt-1">Track how your resume score improves with each version</p>
                </div>
                <motion.button
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={() => setShowUpload(!showUpload)}
                    className="flex items-center gap-2 px-4 py-2 rounded-2xl text-sm font-bold text-white"
                    style={{ background: 'linear-gradient(135deg, #F5A623, #FF8C42)' }}
                >
                    <Plus className="w-4 h-4" /> New Version
                </motion.button>
            </motion.div>

            {/* Stats row */}
            <motion.div variants={cItem} className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: 'Versions', value: VERSIONS.length, icon: FileText, color: '#F5A623', suffix: '' },
                    { label: 'Score Gain', value: `+${totalGain}%`, icon: TrendingUp, color: '#5A9E5A', suffix: '' },
                    { label: 'ATS Gain', value: `+${atsGain}%`, icon: Award, color: '#0EA5E9', suffix: '' },
                    { label: 'Current Score', value: `${VERSIONS[VERSIONS.length - 1].score}%`, icon: CheckCircle2, color: '#8B5CF6', suffix: '' },
                ].map((stat, i) => {
                    const Icon = stat.icon;
                    return (
                        <motion.div key={stat.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.06 }}
                            className="card p-5 flex items-center gap-4">
                            <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: `${stat.color}15` }}>
                                <Icon className="w-5 h-5" style={{ color: stat.color }} />
                            </div>
                            <div>
                                <div className="text-xl font-display font-black" style={{ color: stat.color }}>{stat.value}</div>
                                <div className="text-xs text-dusk">{stat.label}</div>
                            </div>
                        </motion.div>
                    );
                })}
            </motion.div>

            {/* Upload new version */}
            <AnimatePresence>
                {showUpload && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden">
                        <div
                            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                            onDragLeave={() => setDragging(false)}
                            onDrop={(e) => { e.preventDefault(); setDragging(false); setShowUpload(false); }}
                            className={`card border-2 border-dashed flex flex-col items-center justify-center py-12 gap-3 transition-all ${dragging ? 'border-warm-400 bg-warm-50' : 'border-warm-200'
                                }`}>
                            <motion.div animate={dragging ? { scale: 1.15 } : { scale: 1 }}>
                                <Upload className="w-10 h-10 text-warm-400" />
                            </motion.div>
                            <p className="font-bold text-bark">Drop your updated resume here</p>
                            <p className="text-sm text-dusk">or <span className="text-warm-500 cursor-pointer font-semibold underline">browse files</span></p>
                            <p className="text-xs text-muted">PDF, DOCX supported · Max 5MB</p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Area chart */}
            <motion.div variants={cItem} className="card">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-display font-bold text-bark flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-warm-500" /> Score Progression
                    </h3>
                    <div className="flex items-center gap-4 text-xs text-dusk">
                        <div className="flex items-center gap-1.5"><div className="w-3 h-0.5 bg-warm-400 rounded" /><span>Resume Score</span></div>
                        <div className="flex items-center gap-1.5"><div className="w-3 h-0.5 bg-sky-400 rounded" /><span>ATS Score</span></div>
                    </div>
                </div>
                <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData}>
                            <defs>
                                <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#F5A623" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#F5A623" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="atsGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#0EA5E9" stopOpacity={0.25} />
                                    <stop offset="95%" stopColor="#0EA5E9" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(240,230,216,0.8)" vertical={false} />
                            <XAxis dataKey="version" tick={{ fontSize: 11, fill: '#6B6574', fontWeight: 600 }} axisLine={false} tickLine={false} />
                            <YAxis domain={[0, 80]} tick={{ fontSize: 10, fill: '#9B93A5' }} axisLine={false} tickLine={false} unit="%" />
                            <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #F0E6D8', fontSize: 12 }} formatter={(v: number) => [`${v}%`]} />
                            <Area type="monotone" dataKey="score" name="Resume Score" stroke="#F5A623" strokeWidth={2.5} fill="url(#scoreGrad)" dot={{ fill: '#F5A623', r: 5, strokeWidth: 0 }} activeDot={{ r: 7 }} />
                            <Area type="monotone" dataKey="atsScore" name="ATS Score" stroke="#0EA5E9" strokeWidth={2.5} fill="url(#atsGrad)" dot={{ fill: '#0EA5E9', r: 5, strokeWidth: 0 }} activeDot={{ r: 7 }} strokeDasharray="5 3" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </motion.div>

            {/* Version timeline + detail */}
            <motion.div variants={cItem} className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                {/* Timeline */}
                <div className="lg:col-span-2 space-y-3">
                    <h3 className="font-display font-bold text-bark flex items-center gap-2">
                        <Clock className="w-4 h-4 text-warm-500" /> Version History
                    </h3>
                    {[...VERSIONS].reverse().map((v, i) => (
                        <motion.button key={v.version} whileHover={{ x: 3 }}
                            onClick={() => setSelectedVersion(v)}
                            className={`w-full text-left p-4 rounded-2xl border-2 transition-all duration-300 ${selectedVersion.version === v.version
                                    ? 'border-warm-400 bg-warm-50 shadow-sm'
                                    : 'border-transparent bg-white hover:border-warm-200'
                                }`}
                            style={{ border: selectedVersion.version === v.version ? '2px solid #F5A623' : '1px solid var(--border)' }}>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <span className={`text-xs font-black px-2 py-0.5 rounded-full ${v.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-warm-100 text-warm-700'
                                        }`}>{v.version}</span>
                                    {v.status === 'active' && <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-bold">Active</span>}
                                </div>
                                <span className="text-2xl font-display font-black"
                                    style={{ color: v.score >= 50 ? '#5A9E5A' : v.score >= 40 ? '#F5A623' : '#E84565' }}>
                                    {v.score}%
                                </span>
                            </div>
                            <p className="text-xs text-dusk mt-1">{v.date}</p>
                            <p className="text-xs text-bark mt-1 font-medium truncate">{v.keyChange}</p>
                            {i > 0 && (
                                <div className="flex items-center gap-1 mt-1.5">
                                    <ArrowUp className="w-3 h-3 text-green-500" />
                                    <span className="text-[10px] text-green-600 font-bold">
                                        +{v.score - [...VERSIONS].reverse()[i - 1].score}% improvement
                                    </span>
                                </div>
                            )}
                        </motion.button>
                    ))}
                </div>

                {/* Detail */}
                <AnimatePresence mode="wait">
                    <motion.div key={selectedVersion.version}
                        initial={{ opacity: 0, x: 16 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -8 }}
                        className="lg:col-span-3 card space-y-5 h-fit">
                        <div className="flex items-start justify-between">
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-xs font-bold uppercase tracking-wider text-warm-600">Resume Version</span>
                                    <span className="text-xs bg-warm-100 text-warm-700 font-bold px-2 py-0.5 rounded-full">{selectedVersion.version}</span>
                                    {selectedVersion.status === 'active' && (
                                        <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-bold">● Active</span>
                                    )}
                                </div>
                                <h2 className="text-xl font-display font-bold text-bark">{selectedVersion.filename}</h2>
                                <p className="text-sm text-dusk mt-0.5">{selectedVersion.date}</p>
                            </div>
                            <div className="flex gap-2">
                                <button className="w-9 h-9 rounded-xl bg-warm-50 hover:bg-warm-100 flex items-center justify-center transition-colors border border-warm-200">
                                    <Eye className="w-4 h-4 text-warm-600" />
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="p-3 rounded-2xl" style={{ background: 'rgba(245,166,35,0.06)', border: '1px solid rgba(245,166,35,0.15)' }}>
                                <p className="text-xs text-dusk mb-0.5">Resume Score</p>
                                <p className="text-2xl font-display font-black text-warm-600">{selectedVersion.score}%</p>
                                <div className="w-full h-1.5 bg-warm-100 rounded-full overflow-hidden mt-1.5">
                                    <motion.div initial={{ width: 0 }} animate={{ width: `${selectedVersion.score}%` }}
                                        transition={{ duration: 0.8 }} className="h-full bg-warm-400 rounded-full" />
                                </div>
                            </div>
                            <div className="p-3 rounded-2xl" style={{ background: 'rgba(14,165,233,0.06)', border: '1px solid rgba(14,165,233,0.15)' }}>
                                <p className="text-xs text-dusk mb-0.5">ATS Score</p>
                                <p className="text-2xl font-display font-black text-sky-600">{selectedVersion.atsScore}%</p>
                                <div className="w-full h-1.5 bg-sky-100 rounded-full overflow-hidden mt-1.5">
                                    <motion.div initial={{ width: 0 }} animate={{ width: `${selectedVersion.atsScore}%` }}
                                        transition={{ duration: 0.8 }} className="h-full bg-sky-400 rounded-full" />
                                </div>
                            </div>
                        </div>

                        <div>
                            <h4 className="text-xs font-bold text-dusk uppercase tracking-wider mb-2">Key Change</h4>
                            <div className="p-3 rounded-2xl bg-warm-50 border border-warm-100 flex items-start gap-2">
                                <AlertCircle className="w-3.5 h-3.5 text-warm-500 mt-0.5 flex-shrink-0" />
                                <span className="text-sm text-bark">{selectedVersion.keyChange}</span>
                            </div>
                        </div>

                        {selectedVersion.improvements.length > 0 && (
                            <div>
                                <h4 className="text-xs font-bold text-dusk uppercase tracking-wider mb-2">Improvements Made</h4>
                                <ul className="space-y-2">
                                    {selectedVersion.improvements.map((imp, i) => (
                                        <motion.li key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.07 }}
                                            className="flex items-center gap-2 text-sm text-bark">
                                            <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                                            {imp}
                                        </motion.li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {selectedVersion.status !== 'active' && (
                            <div className="pt-3 border-t border-warm-100">
                                <button className="flex items-center gap-2 text-sm font-semibold text-warm-600 hover:text-warm-700">
                                    <ChevronRight className="w-4 h-4" /> Restore this version as active
                                </button>
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>
            </motion.div>
        </motion.div>
    );
}
