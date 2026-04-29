// ═══════════════════════════════════════════════════════════
// reBorn_i — Career Pivot Intelligence (Module 5)
// ═══════════════════════════════════════════════════════════

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import {
    Compass, TrendingUp, Target, Zap, ChevronRight, ArrowUpRight,
    Info, CheckCircle2, AlertCircle, Sparkles, BookOpen, Clock,
} from 'lucide-react';

const cItem = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.4 } } };

interface PivotRole {
    role: string;
    probability: number;
    skillMatch: number;
    timeToTransition: string;
    salaryRange: string;
    demandTrend: 'rising' | 'stable' | 'declining';
    gapSkills: string[];
    transferableSkills: string[];
    color: string;
}

const MOCK_PIVOT_DATA: PivotRole[] = [
    {
        role: 'DevOps Engineer',
        probability: 41,
        skillMatch: 68,
        timeToTransition: '3–5 months',
        salaryRange: '$110k–$145k',
        demandTrend: 'rising',
        gapSkills: ['Kubernetes', 'Terraform', 'CI/CD'],
        transferableSkills: ['Linux', 'Scripting', 'Monitoring'],
        color: '#0EA5E9',
    },
    {
        role: 'Data Engineer',
        probability: 36,
        skillMatch: 54,
        timeToTransition: '5–7 months',
        salaryRange: '$105k–$140k',
        demandTrend: 'rising',
        gapSkills: ['Spark', 'Airflow', 'dbt', 'Snowflake'],
        transferableSkills: ['Python', 'SQL', 'Data Modeling'],
        color: '#8B5CF6',
    },
    {
        role: 'Product Manager',
        probability: 32,
        skillMatch: 47,
        timeToTransition: '6–9 months',
        salaryRange: '$100k–$135k',
        demandTrend: 'stable',
        gapSkills: ['Product Strategy', 'Roadmapping', 'Stakeholder Mgmt'],
        transferableSkills: ['Communication', 'Problem Solving', 'Technical Background'],
        color: '#F5A623',
    },
    {
        role: 'ML Engineer',
        probability: 28,
        skillMatch: 42,
        timeToTransition: '7–10 months',
        salaryRange: '$115k–$155k',
        demandTrend: 'rising',
        gapSkills: ['PyTorch', 'Model Serving', 'MLOps', 'Statistics'],
        transferableSkills: ['Python', 'Data Processing', 'Programming'],
        color: '#E84565',
    },
    {
        role: 'Cloud Architect',
        probability: 24,
        skillMatch: 38,
        timeToTransition: '9–12 months',
        salaryRange: '$130k–$175k',
        demandTrend: 'rising',
        gapSkills: ['AWS Solutions', 'Azure', 'Enterprise Architecture'],
        transferableSkills: ['Infrastructure', 'Networking', 'Security Basics'],
        color: '#5A9E5A',
    },
];

const RADAR_DIMS = ['Technical', 'Communication', 'Domain', 'Problem Solving', 'Leadership', 'Adaptability'];

const mockRadarData = RADAR_DIMS.map((dim) => ({
    subject: dim,
    current: Math.floor(Math.random() * 40 + 40),
    devops: Math.floor(Math.random() * 30 + 60),
}));

const trendColor = (trend: string) => {
    if (trend === 'rising') return 'text-green-600 bg-green-50 border-green-200';
    if (trend === 'declining') return 'text-rose-600 bg-rose-50 border-rose-200';
    return 'text-amber-600 bg-amber-50 border-amber-200';
};

const trendIcon = (trend: string) => {
    if (trend === 'rising') return '↑';
    if (trend === 'declining') return '↓';
    return '→';
};

export default function CareerPivot() {
    const [selected, setSelected] = useState<PivotRole>(MOCK_PIVOT_DATA[0]);
    const [activeTab, setActiveTab] = useState<'overview' | 'gaps' | 'radar'>('overview');

    const barData = MOCK_PIVOT_DATA.map((r) => ({
        name: r.role.split(' ')[0],
        probability: r.probability,
        skillMatch: r.skillMatch,
        fill: r.color,
    }));

    return (
        <motion.div initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.08 } } }} className="space-y-6">
            {/* Header */}
            <motion.div variants={cItem} className="flex items-start justify-between">
                <div>
                    <h1 className="text-2xl font-display font-bold text-bark flex items-center gap-2">
                        <Compass className="w-6 h-6 text-violet-500" />
                        Career Pivot Intelligence
                    </h1>
                    <p className="text-dusk mt-1">Discover alternative roles where your skills transfer best</p>
                </div>
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-50 border border-violet-200">
                    <Sparkles className="w-3.5 h-3.5 text-violet-500" />
                    <span className="text-xs font-bold text-violet-700">AI-Powered Analysis</span>
                </div>
            </motion.div>

            {/* Info banner */}
            <motion.div variants={cItem} className="card p-4 flex items-start gap-3"
                style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.05), rgba(14,165,233,0.04))' }}>
                <Info className="w-4 h-4 text-violet-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-dusk leading-relaxed">
                    Based on your current profile, we've identified <strong className="text-bark">5 pivot pathways</strong> with meaningful skill overlap.
                    Select a role to explore the gap analysis and transition roadmap.
                </p>
            </motion.div>

            {/* Bar chart overview */}
            <motion.div variants={cItem} className="card">
                <h3 className="font-display font-bold text-bark mb-1 flex items-center gap-2">
                    <Target className="w-4 h-4 text-warm-500" /> Pivot Probability Overview
                </h3>
                <p className="text-xs text-dusk mb-4">Higher % = better skill overlap for transition</p>
                <div className="h-52">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={barData} barGap={6} barCategoryGap="30%">
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(240,230,216,0.8)" vertical={false} />
                            <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#6B6574', fontWeight: 600 }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fontSize: 10, fill: '#9B93A5' }} axisLine={false} tickLine={false} unit="%" domain={[0, 60]} />
                            <Tooltip
                                contentStyle={{ borderRadius: 12, border: '1px solid #F0E6D8', background: '#fff', fontSize: 12 }}
                                formatter={(v: number) => [`${v}%`]}
                            />
                            <Bar dataKey="probability" radius={[6, 6, 0, 0]} name="Pivot Probability">
                                {barData.map((entry, i) => (
                                    <Cell
                                        key={i}
                                        fill={entry.fill}
                                        opacity={selected.role.startsWith(entry.name) ? 1 : 0.45}
                                        cursor="pointer"
                                        onClick={() => setSelected(MOCK_PIVOT_DATA[i])}
                                    />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </motion.div>

            {/* Role cards */}
            <motion.div variants={cItem} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
                {MOCK_PIVOT_DATA.map((role) => (
                    <motion.button
                        key={role.role}
                        whileHover={{ y: -3, scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setSelected(role)}
                        className={`text-left p-4 rounded-2xl border-2 transition-all duration-300 ${selected.role === role.role
                                ? 'border-current shadow-lg'
                                : 'border-transparent bg-white hover:border-warm-200'
                            }`}
                        style={selected.role === role.role
                            ? { borderColor: role.color, background: `${role.color}08`, boxShadow: `0 4px 20px ${role.color}20` }
                            : { background: 'white', border: '1px solid var(--border)' }
                        }
                    >
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-2xl font-display font-black" style={{ color: role.color }}>{role.probability}%</span>
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${trendColor(role.demandTrend)}`}>
                                {trendIcon(role.demandTrend)} {role.demandTrend}
                            </span>
                        </div>
                        <h4 className="font-display font-bold text-bark text-sm leading-tight">{role.role}</h4>
                        <p className="text-xs text-dusk mt-1">{role.timeToTransition}</p>
                        <div className="mt-2 w-full h-1.5 bg-warm-100 rounded-full overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${role.skillMatch}%` }}
                                transition={{ duration: 0.8, delay: 0.3 }}
                                className="h-full rounded-full"
                                style={{ background: role.color }}
                            />
                        </div>
                        <p className="text-[10px] text-dusk mt-0.5">{role.skillMatch}% skill match</p>
                    </motion.button>
                ))}
            </motion.div>

            {/* Detail panel */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={selected.role}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="card space-y-5"
                    style={{ borderLeft: `4px solid ${selected.color}` }}
                >
                    {/* Header */}
                    <div className="flex items-start justify-between">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-bold uppercase tracking-wider" style={{ color: selected.color }}>Selected Pivot</span>
                            </div>
                            <h2 className="text-xl font-display font-bold text-bark">{selected.role}</h2>
                            <div className="flex items-center gap-4 mt-2 flex-wrap">
                                <span className="text-sm text-dusk flex items-center gap-1.5">
                                    <Clock className="w-3.5 h-3.5" /> {selected.timeToTransition}
                                </span>
                                <span className="text-sm text-dusk flex items-center gap-1.5">
                                    <TrendingUp className="w-3.5 h-3.5 text-green-500" /> {selected.salaryRange}
                                </span>
                                <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${trendColor(selected.demandTrend)}`}>
                                    {trendIcon(selected.demandTrend)} {selected.demandTrend} demand
                                </span>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-3xl font-display font-black" style={{ color: selected.color }}>{selected.probability}%</div>
                            <div className="text-xs text-dusk">pivot probability</div>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex gap-2">
                        {(['overview', 'gaps', 'radar'] as const).map((tab) => (
                            <button key={tab} onClick={() => setActiveTab(tab)}
                                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all capitalize ${activeTab === tab ? 'text-white shadow-sm' : 'bg-warm-50 text-dusk hover:bg-warm-100'
                                    }`}
                                style={activeTab === tab ? { background: selected.color } : {}}
                            >{tab === 'gaps' ? 'Skill Gaps' : tab === 'radar' ? 'Skill Radar' : 'Overview'}
                            </button>
                        ))}
                    </div>

                    {activeTab === 'overview' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <h4 className="text-xs font-bold text-dusk uppercase tracking-wider mb-3 flex items-center gap-1.5">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-green-500" /> Transferable Skills
                                </h4>
                                <div className="flex flex-wrap gap-2">
                                    {selected.transferableSkills.map((s) => (
                                        <span key={s} className="px-3 py-1 rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-200">
                                            ✓ {s}
                                        </span>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <h4 className="text-xs font-bold text-dusk uppercase tracking-wider mb-3 flex items-center gap-1.5">
                                    <AlertCircle className="w-3.5 h-3.5 text-rose-400" /> Skills to Learn
                                </h4>
                                <div className="flex flex-wrap gap-2">
                                    {selected.gapSkills.map((s) => (
                                        <span key={s} className="px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-600 border border-rose-200">
                                            + {s}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'gaps' && (
                        <div className="space-y-3">
                            <p className="text-sm text-dusk">These skills separate you from the target role. Each represents a learning milestone:</p>
                            {selected.gapSkills.map((skill, i) => (
                                <motion.div key={skill} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}
                                    className="flex items-center justify-between p-3 rounded-2xl bg-warm-50 border border-warm-100">
                                    <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: selected.color }}>
                                            {i + 1}
                                        </div>
                                        <span className="text-sm font-semibold text-bark">{skill}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <BookOpen className="w-3.5 h-3.5 text-dusk" />
                                        <span className="text-xs text-dusk">{['2–3 weeks', '1 month', '3–4 weeks', '6 weeks', '2 months'][i % 5]} to learn</span>
                                        <ArrowUpRight className="w-3.5 h-3.5 text-warm-500" />
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}

                    {activeTab === 'radar' && (
                        <div className="h-72">
                            <ResponsiveContainer width="100%" height="100%">
                                <RadarChart data={mockRadarData}>
                                    <PolarGrid stroke="rgba(240,230,216,0.8)" />
                                    <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: '#6B6574', fontWeight: 600 }} />
                                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 9, fill: '#9B93A5' }} />
                                    <Radar name="Current" dataKey="current" stroke="#F5A623" fill="#F5A623" fillOpacity={0.25} strokeWidth={2} />
                                    <Radar name={selected.role} dataKey="devops" stroke={selected.color} fill={selected.color} fillOpacity={0.2} strokeWidth={2} strokeDasharray="5 3" />
                                    <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #F0E6D8', fontSize: 12 }} />
                                </RadarChart>
                            </ResponsiveContainer>
                            <div className="flex justify-center gap-6 mt-2">
                                <div className="flex items-center gap-1.5"><div className="w-3 h-0.5 bg-warm-400 rounded" /><span className="text-xs text-dusk">Your Profile</span></div>
                                <div className="flex items-center gap-1.5"><div className="w-3 h-0.5 rounded" style={{ background: selected.color }} /><span className="text-xs text-dusk">{selected.role} Required</span></div>
                            </div>
                        </div>
                    )}

                    <div className="flex items-center gap-2 pt-2 border-t border-warm-100">
                        <Zap className="w-3.5 h-3.5 text-warm-500" />
                        <p className="text-xs text-dusk">
                            Recommend: Start with <strong className="text-bark">{selected.gapSkills[0]}</strong> — it unlocks the most doors in this pivot path.
                        </p>
                    </div>
                </motion.div>
            </AnimatePresence>

            {/* CTA */}
            <motion.div variants={cItem} className="card flex items-center justify-between p-5"
                style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.06), rgba(14,165,233,0.04))' }}>
                <div>
                    <h3 className="font-display font-bold text-bark mb-1">Ready to make the pivot?</h3>
                    <p className="text-sm text-dusk">Generate a 90-day roadmap tailored for your chosen pivot role.</p>
                </div>
                <motion.a href="/blueprint" whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-bold text-white"
                    style={{ background: `linear-gradient(135deg, ${selected.color}, ${selected.color}cc)` }}>
                    Build Roadmap <ChevronRight className="w-4 h-4" />
                </motion.a>
            </motion.div>
        </motion.div>
    );
}
