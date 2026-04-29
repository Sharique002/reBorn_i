// ═══════════════════════════════════════════════════════════
// reBorn_i — Interview Readiness Analyzer (Module 6)
// ═══════════════════════════════════════════════════════════

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
    RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
    ResponsiveContainer, Tooltip,
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Cell,
} from 'recharts';
import {
    Brain, MessageSquare, Users, Star, BookOpen, CheckCircle2,
    ChevronRight, Clock, Lightbulb, AlertTriangle, TrendingUp, Play,
} from 'lucide-react';

const cItem = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.4 } } };

interface ReadinessDimension {
    subject: string;
    score: number;
    fullMark: number;
}

const radarData: ReadinessDimension[] = [
    { subject: 'Technical', score: 72, fullMark: 100 },
    { subject: 'Behavioral', score: 58, fullMark: 100 },
    { subject: 'Communication', score: 65, fullMark: 100 },
    { subject: 'Problem Solving', score: 80, fullMark: 100 },
    { subject: 'Domain', score: 61, fullMark: 100 },
    { subject: 'Culture Fit', score: 54, fullMark: 100 },
];

const barData = [
    { category: 'Technical', score: 72, color: '#0EA5E9' },
    { category: 'Behavioral', score: 58, color: '#8B5CF6' },
    { category: 'Communication', score: 65, color: '#F5A623' },
    { category: 'Problem Solving', score: 80, color: '#5A9E5A' },
    { category: 'Domain', score: 61, color: '#E84565' },
    { category: 'Culture Fit', score: 54, color: '#FF8C42' },
];

const practiceSuggestions = [
    {
        icon: Brain,
        color: '#0EA5E9',
        bg: 'bg-sky-50',
        border: 'border-sky-200',
        category: 'Technical',
        score: 72,
        suggestions: [
            'Practice 2 LeetCode mediums daily (focus: trees, arrays)',
            'Review system design: design a URL shortener, chat system',
            'Mock-code a REST API from memory in 30 minutes',
        ],
        timeEst: '2–3 hrs/day',
    },
    {
        icon: MessageSquare,
        color: '#8B5CF6',
        bg: 'bg-violet-50',
        border: 'border-violet-200',
        category: 'Behavioral',
        score: 58,
        suggestions: [
            'Write 5 STAR story templates (Situation-Task-Action-Result)',
            'Record yourself answering "Tell me about a time you failed"',
            'Prepare answers for conflict resolution, leadership scenarios',
        ],
        timeEst: '1 hr/day',
    },
    {
        icon: Users,
        color: '#F5A623',
        bg: 'bg-amber-50',
        border: 'border-amber-200',
        category: 'Communication',
        score: 65,
        suggestions: [
            'Record mock technical explanations and review for clarity',
            'Practice the "Pyramid Principle" for structuring answers',
            'Join a Toastmasters session or do 10-minute timed monologues',
        ],
        timeEst: '45 min/day',
    },
    {
        icon: Star,
        color: '#5A9E5A',
        bg: 'bg-green-50',
        border: 'border-green-200',
        category: 'Culture Fit',
        score: 54,
        suggestions: [
            'Research company values, mission, recent news',
            'Prepare 3 questions about team culture and engineering practices',
            'Align your personal narrative with company direction',
        ],
        timeEst: '30 min per company',
    },
];

const overallScore = Math.round(radarData.reduce((a, b) => a + b.score, 0) / radarData.length);

const getReadinessLabel = (score: number) => {
    if (score >= 75) return { label: 'Interview Ready', color: 'text-green-600', bg: 'bg-green-100 border-green-200' };
    if (score >= 60) return { label: 'Nearly Ready', color: 'text-amber-600', bg: 'bg-amber-100 border-amber-200' };
    return { label: 'Needs Practice', color: 'text-rose-600', bg: 'bg-rose-100 border-rose-200' };
};

const readiness = getReadinessLabel(overallScore);

export default function InterviewReadiness() {
    const [activeCategory, setActiveCategory] = useState<string | null>(null);

    return (
        <motion.div initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.08 } } }} className="space-y-6">
            {/* Header */}
            <motion.div variants={cItem} className="flex items-start justify-between">
                <div>
                    <h1 className="text-2xl font-display font-bold text-bark flex items-center gap-2">
                        <Brain className="w-6 h-6 text-sky-500" />
                        Interview Readiness Analyzer
                    </h1>
                    <p className="text-dusk mt-1">Assess your interview preparedness across 6 critical dimensions</p>
                </div>
                <div className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-bold ${readiness.bg} ${readiness.color}`}>
                    {overallScore}% — {readiness.label}
                </div>
            </motion.div>

            {/* Score summary cards */}
            <motion.div variants={cItem} className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                {barData.map((dim, i) => (
                    <motion.div
                        key={dim.category}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 + i * 0.06 }}
                        whileHover={{ y: -3, scale: 1.03 }}
                        onClick={() => setActiveCategory(activeCategory === dim.category ? null : dim.category)}
                        className="cursor-pointer card p-4 text-center transition-all duration-300"
                        style={activeCategory === dim.category
                            ? { borderColor: dim.color, boxShadow: `0 4px 20px ${dim.color}25` }
                            : {}}
                    >
                        <div className="text-2xl font-display font-black mb-1" style={{ color: dim.color }}>
                            {dim.score}%
                        </div>
                        <div className="w-full h-1.5 bg-warm-100 rounded-full overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${dim.score}%` }}
                                transition={{ duration: 0.9, delay: 0.2 + i * 0.08 }}
                                className="h-full rounded-full"
                                style={{ background: dim.color }}
                            />
                        </div>
                        <p className="text-xs text-dusk mt-1.5 font-semibold truncate">{dim.category}</p>
                    </motion.div>
                ))}
            </motion.div>

            {/* Radar + Bar split */}
            <motion.div variants={cItem} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Radar chart */}
                <div className="card">
                    <h3 className="font-display font-bold text-bark mb-4 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-warm-500" /> Readiness Radar
                    </h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <RadarChart data={radarData}>
                                <PolarGrid stroke="rgba(240,230,216,0.8)" />
                                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: '#6B6574', fontWeight: 600 }} />
                                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 9, fill: '#9B93A5' }} />
                                <Radar name="Readiness" dataKey="score" stroke="#F5A623" fill="#F5A623" fillOpacity={0.3} strokeWidth={2.5} />
                                <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #F0E6D8', fontSize: 12 }} formatter={(v: number) => [`${v}%`]} />
                            </RadarChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Overall score */}
                    <div className="mt-3 flex items-center justify-center gap-4 p-3 rounded-2xl"
                        style={{ background: 'linear-gradient(135deg, rgba(245,166,35,0.06), rgba(139,92,246,0.04))' }}>
                        <div className="text-center">
                            <div className="text-3xl font-display font-black text-bark">{overallScore}%</div>
                            <div className="text-xs text-dusk">Overall Readiness</div>
                        </div>
                        <div className={`px-3 py-1 rounded-full border text-sm font-bold ${readiness.bg} ${readiness.color}`}>
                            {readiness.label}
                        </div>
                    </div>
                </div>

                {/* Bar chart */}
                <div className="card">
                    <h3 className="font-display font-bold text-bark mb-4 flex items-center gap-2">
                        <Star className="w-4 h-4 text-warm-500" /> Score Breakdown
                    </h3>
                    <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={barData} layout="vertical" barCategoryGap="20%">
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(240,230,216,0.8)" horizontal={false} />
                                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10, fill: '#9B93A5' }} axisLine={false} tickLine={false} unit="%" />
                                <YAxis type="category" dataKey="category" tick={{ fontSize: 11, fill: '#6B6574', fontWeight: 600 }} axisLine={false} tickLine={false} width={90} />
                                <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #F0E6D8', fontSize: 12 }} formatter={(v: number) => [`${v}%`]} />
                                <Bar dataKey="score" radius={[0, 6, 6, 0]}>
                                    {barData.map((entry, i) => (
                                        <Cell key={i} fill={entry.color} fillOpacity={activeCategory === null || activeCategory === entry.category ? 0.85 : 0.3} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </motion.div>

            {/* Weak areas alert */}
            {barData.filter(d => d.score < 65).length > 0 && (
                <motion.div variants={cItem} className="card p-4 flex items-start gap-3 border-l-4 border-l-amber-400"
                    style={{ background: 'rgba(245,166,35,0.03)' }}>
                    <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                    <div>
                        <h4 className="text-sm font-bold text-bark mb-1">Focus Areas</h4>
                        <p className="text-sm text-dusk">
                            Your weakest dimensions are{' '}
                            {barData.filter(d => d.score < 65).map(d => <strong key={d.category} className="text-bark"> {d.category}</strong>)}.{' '}
                            Prioritize these before scheduling interviews.
                        </p>
                    </div>
                </motion.div>
            )}

            {/* Practice suggestions */}
            <motion.div variants={cItem}>
                <div className="flex items-center gap-2 mb-4">
                    <BookOpen className="w-5 h-5 text-warm-500" />
                    <h2 className="text-xl font-display font-bold text-bark">Practice Suggestions</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {practiceSuggestions.map((cat) => {
                        const Icon = cat.icon;
                        return (
                            <motion.div key={cat.category} whileHover={{ y: -2 }}
                                className={`card border-l-4 space-y-3 transition-all`}
                                style={{ borderLeftColor: cat.color }}>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-8 h-8 rounded-xl ${cat.bg} border ${cat.border} flex items-center justify-center`}>
                                            <Icon className="w-4 h-4" style={{ color: cat.color }} />
                                        </div>
                                        <div>
                                            <h4 className="font-display font-bold text-bark text-sm">{cat.category}</h4>
                                            <div className="flex items-center gap-1">
                                                <div className="w-12 h-1 bg-warm-100 rounded-full overflow-hidden">
                                                    <div className="h-full rounded-full" style={{ width: `${cat.score}%`, background: cat.color }} />
                                                </div>
                                                <span className="text-[10px] text-dusk">{cat.score}%</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1 text-xs text-dusk">
                                        <Clock className="w-3 h-3" />
                                        <span>{cat.timeEst}</span>
                                    </div>
                                </div>
                                <ul className="space-y-2">
                                    {cat.suggestions.map((s, i) => (
                                        <li key={i} className="flex items-start gap-2 text-sm text-bark">
                                            <ChevronRight className="w-3.5 h-3.5 text-warm-400 mt-0.5 flex-shrink-0" />
                                            {s}
                                        </li>
                                    ))}
                                </ul>
                            </motion.div>
                        );
                    })}
                </div>
            </motion.div>

            {/* Mock interview CTA */}
            <motion.div variants={cItem}
                className="card p-6 flex flex-col sm:flex-row items-center justify-between gap-4"
                style={{ background: 'linear-gradient(135deg, rgba(14,165,233,0.06), rgba(139,92,246,0.05))' }}>
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-sky-100 flex items-center justify-center">
                        <Play className="w-6 h-6 text-sky-600" />
                    </div>
                    <div>
                        <h3 className="font-display font-bold text-bark">Start Mock Interview Session</h3>
                        <p className="text-sm text-dusk">Practice with AI-generated questions based on your weak areas</p>
                    </div>
                </div>
                <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-bold text-white cursor-pointer"
                    style={{ background: 'linear-gradient(135deg, #0EA5E9, #8B5CF6)' }}>
                    <Lightbulb className="w-4 h-4" /> Begin Session
                </motion.div>
            </motion.div>
        </motion.div>
    );
}
