// ═══════════════════════════════════════════════════════════
// reBorn_i — Application Tracker + Rejection Loop (Module 9)
// ═══════════════════════════════════════════════════════════

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
    PieChart, Pie, Legend,
} from 'recharts';
import {
    Briefcase, CheckCircle2, XCircle, Clock, Plus, Filter,
    TrendingDown, AlertCircle, ChevronRight, Building, Calendar,
    Trash2, Edit3, BarChart3,
} from 'lucide-react';
import { create } from 'zustand';

const cItem = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.4 } } };

type AppStatus = 'applied' | 'screening' | 'interviewed' | 'rejected' | 'offer';

interface Application {
    id: string;
    company: string;
    role: string;
    status: AppStatus;
    appliedDate: string;
    notes: string;
    rejectionStage?: string;
}

interface AppStore {
    applications: Application[];
    addApp: (app: Omit<Application, 'id'>) => void;
    updateStatus: (id: string, status: AppStatus) => void;
    deleteApp: (id: string) => void;
}

const useAppStore = create<AppStore>((set) => ({
    applications: [
        { id: '1', company: 'Stripe', role: 'Backend Engineer', status: 'rejected', appliedDate: '2026-01-10', notes: 'Rejected after technical screen', rejectionStage: 'Technical Screen' },
        { id: '2', company: 'Vercel', role: 'Platform Engineer', status: 'interviewed', appliedDate: '2026-01-22', notes: 'Final round pending', },
        { id: '3', company: 'Notion', role: 'Software Engineer', status: 'rejected', appliedDate: '2026-02-01', notes: 'No response after take-home', rejectionStage: 'Take-Home' },
        { id: '4', company: 'Linear', role: 'Full-Stack Engineer', status: 'screening', appliedDate: '2026-02-14', notes: 'Recruiter reached out', },
        { id: '5', company: 'Figma', role: 'SWE II', status: 'applied', appliedDate: '2026-02-28', notes: 'Applied via referral', },
        { id: '6', company: 'GitHub', role: 'Senior Engineer', status: 'offer', appliedDate: '2026-01-05', notes: 'Offer received!', },
    ],
    addApp: (app) => set((s) => ({ applications: [...s.applications, { ...app, id: Date.now().toString() }] })),
    updateStatus: (id, status) => set((s) => ({ applications: s.applications.map((a) => a.id === id ? { ...a, status } : a) })),
    deleteApp: (id) => set((s) => ({ applications: s.applications.filter((a) => a.id !== id) })),
}));

const STATUS_CONFIG: Record<AppStatus, { label: string; color: string; bg: string; border: string; icon: React.ElementType }> = {
    applied: { label: 'Applied', color: '#6B6574', bg: 'bg-gray-100', border: 'border-gray-200', icon: Briefcase },
    screening: { label: 'Screening', color: '#0EA5E9', bg: 'bg-sky-100', border: 'border-sky-200', icon: Clock },
    interviewed: { label: 'Interviewed', color: '#8B5CF6', bg: 'bg-violet-100', border: 'border-violet-200', icon: CheckCircle2 },
    rejected: { label: 'Rejected', color: '#E84565', bg: 'bg-rose-100', border: 'border-rose-200', icon: XCircle },
    offer: { label: 'Offer', color: '#5A9E5A', bg: 'bg-green-100', border: 'border-green-200', icon: CheckCircle2 },
};

const REJECTION_STAGES = ['ATS Filter', 'Recruiter Screen', 'Technical Screen', 'Take-Home', 'Final Round', 'No Response'];

export default function ApplicationTracker() {
    const { applications, addApp, updateStatus, deleteApp } = useAppStore();
    const [filterStatus, setFilterStatus] = useState<AppStatus | 'all'>('all');
    const [showAddForm, setShowAddForm] = useState(false);
    const [activeView, setActiveView] = useState<'kanban' | 'list'>('kanban');
    const [newApp, setNewApp] = useState({ company: '', role: '', status: 'applied' as AppStatus, notes: '', appliedDate: new Date().toISOString().split('T')[0] });

    const filtered = filterStatus === 'all' ? applications : applications.filter((a) => a.status === filterStatus);

    const stats = (Object.keys(STATUS_CONFIG) as AppStatus[]).map((s) => ({
        status: s,
        count: applications.filter((a) => a.status === s).length,
        ...STATUS_CONFIG[s],
    }));

    const rejections = applications.filter((a) => a.status === 'rejected');
    const rejectionByStage = REJECTION_STAGES.map((stage) => ({
        stage: stage.split(' ').slice(-1)[0],
        count: rejections.filter((r) => r.rejectionStage === stage).length,
    })).filter((d) => d.count > 0);

    const pieData = stats.filter((s) => s.count > 0).map((s) => ({ name: s.label, value: s.count, fill: s.color }));

    const handleAdd = () => {
        if (!newApp.company || !newApp.role) return;
        addApp({ ...newApp, appliedDate: newApp.appliedDate });
        setNewApp({ company: '', role: '', status: 'applied', notes: '', appliedDate: new Date().toISOString().split('T')[0] });
        setShowAddForm(false);
    };

    const kanbanColumns = (Object.keys(STATUS_CONFIG) as AppStatus[]);

    return (
        <motion.div initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.08 } } }} className="space-y-6">
            {/* Header */}
            <motion.div variants={cItem} className="flex items-start justify-between">
                <div>
                    <h1 className="text-2xl font-display font-bold text-bark flex items-center gap-2">
                        <Briefcase className="w-6 h-6 text-warm-500" />
                        Application Tracker
                    </h1>
                    <p className="text-dusk mt-1">Track applications, analyze rejections, spot patterns</p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="flex bg-white border border-warm-200 rounded-xl p-0.5">
                        {(['kanban', 'list'] as const).map((v) => (
                            <button key={v} onClick={() => setActiveView(v)}
                                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all capitalize ${activeView === v ? 'bg-warm-100 text-warm-700' : 'text-dusk hover:text-bark'
                                    }`}>{v}</button>
                        ))}
                    </div>
                    <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                        onClick={() => setShowAddForm(!showAddForm)}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white"
                        style={{ background: 'linear-gradient(135deg, #F5A623, #FF8C42)' }}>
                        <Plus className="w-4 h-4" /> Add Application
                    </motion.button>
                </div>
            </motion.div>

            {/* Stats */}
            <motion.div variants={cItem} className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {stats.map((s) => {
                    const Icon = s.icon;
                    return (
                        <motion.button key={s.status} whileHover={{ y: -2 }} onClick={() => setFilterStatus(filterStatus === s.status ? 'all' : s.status)}
                            className={`p-4 rounded-2xl text-left border-2 transition-all ${s.bg} ${filterStatus === s.status ? s.border + ' shadow-sm' : 'border-transparent'}`}>
                            <div className="flex items-center justify-between mb-1">
                                <Icon className="w-4 h-4" style={{ color: s.color }} />
                                <span className="text-2xl font-display font-black" style={{ color: s.color }}>{s.count}</span>
                            </div>
                            <p className="text-xs font-bold" style={{ color: s.color }}>{s.label}</p>
                        </motion.button>
                    );
                })}
            </motion.div>

            {/* Add form */}
            <AnimatePresence>
                {showAddForm && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden">
                        <div className="card space-y-4">
                            <h3 className="font-display font-bold text-bark">Add New Application</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                <div>
                                    <label className="label">Company</label>
                                    <input value={newApp.company} onChange={(e) => setNewApp((p) => ({ ...p, company: e.target.value }))} className="input-field" placeholder="e.g. Stripe" />
                                </div>
                                <div>
                                    <label className="label">Role</label>
                                    <input value={newApp.role} onChange={(e) => setNewApp((p) => ({ ...p, role: e.target.value }))} className="input-field" placeholder="e.g. Backend Engineer" />
                                </div>
                                <div>
                                    <label className="label">Status</label>
                                    <select value={newApp.status} onChange={(e) => setNewApp((p) => ({ ...p, status: e.target.value as AppStatus }))} className="input-field">
                                        {(Object.keys(STATUS_CONFIG) as AppStatus[]).map((s) => (
                                            <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div>
                                    <label className="label">Applied Date</label>
                                    <input type="date" value={newApp.appliedDate} onChange={(e) => setNewApp((p) => ({ ...p, appliedDate: e.target.value }))} className="input-field" />
                                </div>
                                <div>
                                    <label className="label">Notes</label>
                                    <input value={newApp.notes} onChange={(e) => setNewApp((p) => ({ ...p, notes: e.target.value }))} className="input-field" placeholder="Optional notes..." />
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleAdd}
                                    className="px-5 py-2.5 rounded-xl text-sm font-bold text-white" style={{ background: 'linear-gradient(135deg, #F5A623, #FF8C42)' }}>
                                    Add Application
                                </motion.button>
                                <button onClick={() => setShowAddForm(false)} className="px-5 py-2.5 rounded-xl text-sm font-semibold text-dusk hover:text-bark border border-warm-200 hover:bg-warm-50 transition-all">
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Kanban / List view */}
            {activeView === 'kanban' ? (
                <motion.div variants={cItem} className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    {kanbanColumns.map((col) => {
                        const colApps = applications.filter((a) => a.status === col);
                        const cfg = STATUS_CONFIG[col];
                        const Icon = cfg.icon;
                        return (
                            <div key={col} className="space-y-2">
                                <div className={`flex items-center gap-2 px-3 py-2 rounded-xl ${cfg.bg} border ${cfg.border}`}>
                                    <Icon className="w-3.5 h-3.5" style={{ color: cfg.color }} />
                                    <span className="text-xs font-bold" style={{ color: cfg.color }}>{cfg.label}</span>
                                    <span className="ml-auto text-xs font-black" style={{ color: cfg.color }}>{colApps.length}</span>
                                </div>
                                {colApps.map((app) => (
                                    <motion.div key={app.id} layout whileHover={{ y: -2 }}
                                        className="p-3 bg-white rounded-2xl border border-warm-100 shadow-sm space-y-2 cursor-pointer hover:border-warm-300 transition-all">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <p className="text-sm font-bold text-bark leading-tight">{app.company}</p>
                                                <p className="text-xs text-dusk">{app.role}</p>
                                            </div>
                                            <button onClick={() => deleteApp(app.id)} className="text-muted hover:text-rose-400 transition-colors">
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                        {app.notes && <p className="text-[11px] text-dusk line-clamp-2">{app.notes}</p>}
                                        <div className="flex items-center gap-1 text-[10px] text-muted">
                                            <Calendar className="w-3 h-3" />
                                            {app.appliedDate}
                                        </div>
                                        {app.rejectionStage && (
                                            <div className="flex items-center gap-1">
                                                <AlertCircle className="w-3 h-3 text-rose-400" />
                                                <span className="text-[10px] text-rose-500 font-medium">{app.rejectionStage}</span>
                                            </div>
                                        )}
                                    </motion.div>
                                ))}
                                {colApps.length === 0 && (
                                    <div className="h-16 rounded-2xl border-2 border-dashed border-warm-100 flex items-center justify-center">
                                        <span className="text-xs text-muted">Empty</span>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </motion.div>
            ) : (
                <motion.div variants={cItem} className="card space-y-2">
                    <div className="flex items-center gap-2 mb-3">
                        <Filter className="w-4 h-4 text-warm-500" />
                        <h3 className="font-display font-bold text-bark">All Applications</h3>
                        <span className="text-xs text-dusk">({filtered.length})</span>
                    </div>
                    {filtered.map((app) => {
                        const cfg = STATUS_CONFIG[app.status];
                        const Icon = cfg.icon;
                        return (
                            <motion.div key={app.id} layout whileHover={{ x: 4 }}
                                className="flex items-center gap-3 p-3 rounded-xl hover:bg-warm-50 transition-all border border-transparent hover:border-warm-100">
                                <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${cfg.bg}`}>
                                    <Icon className="w-4 h-4" style={{ color: cfg.color }} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <p className="text-sm font-bold text-bark truncate">{app.company}</p>
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${cfg.bg} ${cfg.border}`} style={{ color: cfg.color }}>
                                            {cfg.label}
                                        </span>
                                    </div>
                                    <p className="text-xs text-dusk">{app.role} · {app.appliedDate}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <select value={app.status} onChange={(e) => updateStatus(app.id, e.target.value as AppStatus)}
                                        className="text-xs rounded-lg px-2 py-1 border border-warm-200 bg-white text-dusk">
                                        {(Object.keys(STATUS_CONFIG) as AppStatus[]).map((s) => (
                                            <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>
                                        ))}
                                    </select>
                                    <button onClick={() => deleteApp(app.id)} className="text-muted hover:text-rose-400 transition-colors">
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </motion.div>
                        );
                    })}
                </motion.div>
            )}

            {/* Rejection analysis */}
            {rejections.length > 0 && (
                <motion.div variants={cItem} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="card">
                        <h3 className="font-display font-bold text-bark flex items-center gap-2 mb-4">
                            <TrendingDown className="w-4 h-4 text-rose-400" /> Rejection Funnel
                        </h3>
                        {rejectionByStage.length > 0 ? (
                            <div className="h-44">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={rejectionByStage}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(240,230,216,0.8)" vertical={false} />
                                        <XAxis dataKey="stage" tick={{ fontSize: 10, fill: '#6B6574' }} axisLine={false} tickLine={false} />
                                        <YAxis tick={{ fontSize: 10, fill: '#9B93A5' }} axisLine={false} tickLine={false} allowDecimals={false} />
                                        <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #F0E6D8', fontSize: 12 }} />
                                        <Bar dataKey="count" name="Rejections" fill="#E84565" radius={[6, 6, 0, 0]} fillOpacity={0.75} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center py-8 text-center">
                                <CheckCircle2 className="w-8 h-8 text-green-400 mb-2" />
                                <p className="text-sm text-dusk">No rejection stage data yet. Mark rejections to see patterns.</p>
                            </div>
                        )}
                    </div>

                    <div className="card">
                        <h3 className="font-display font-bold text-bark flex items-center gap-2 mb-4">
                            <BarChart3 className="w-4 h-4 text-warm-500" /> Application Mix
                        </h3>
                        <div className="h-44">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} dataKey="value" paddingAngle={3}>
                                        {pieData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                                    </Pie>
                                    <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #F0E6D8', fontSize: 12 }} />
                                    <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </motion.div>
            )}

            {/* Pattern insight */}
            <motion.div variants={cItem} className="card p-4 border-l-4 border-l-rose-400" style={{ background: 'rgba(232,69,101,0.02)' }}>
                <div className="flex items-start gap-3">
                    <AlertCircle className="w-4 h-4 text-rose-400 mt-0.5 flex-shrink-0" />
                    <div>
                        <h4 className="text-sm font-bold text-bark mb-1">Rejection Pattern Detected</h4>
                        <p className="text-sm text-dusk">
                            {rejections.length > 0
                                ? `You have ${rejections.length} rejection(s). Most occur at the ${rejections[0]?.rejectionStage || 'Application'} stage. Consider improving your resume ATS score and technical preparation before applying to more roles.`
                                : 'No rejections yet. Keep tracking to spot patterns early.'}
                        </p>
                        {rejections.length > 0 && (
                            <a href="/analysis" className="inline-flex items-center gap-1 text-xs font-semibold text-rose-500 mt-2 hover:text-rose-600">
                                Run Rejection Analysis <ChevronRight className="w-3 h-3" />
                            </a>
                        )}
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
}
