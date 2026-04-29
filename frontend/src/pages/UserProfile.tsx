// ═══════════════════════════════════════════════════════════
// reBorn_i — User Profile Module
// Profile info · Resume History · AI Insights
// ═══════════════════════════════════════════════════════════

import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { profileAPI, resumeAPI } from '../api/client';
import type { ResumeSummary, AnalysisSummary } from '../types';
import {
    User, FileText, Brain, Upload, CheckCircle2,
    ShieldAlert, Filter, Map, ListChecks, Globe2,
    Calendar, Clock, Cpu, LogOut, Edit3, X, Check,
    ArrowRight, Sparkles, AlertTriangle, TrendingUp, Trash2, Copy,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const cItem = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' as const } } };

type Tab = 'profile' | 'resumes' | 'insights';

function riskColor(risk: string) {
    if (risk === 'Low') return { text: '#468246', bg: 'rgba(90,158,90,0.1)', border: 'rgba(90,158,90,0.2)' };
    if (risk === 'Moderate') return { text: '#B87300', bg: 'rgba(245,166,35,0.1)', border: 'rgba(245,166,35,0.2)' };
    if (risk === 'High') return { text: '#C5324F', bg: 'rgba(232,69,101,0.1)', border: 'rgba(232,69,101,0.2)' };
    return { text: '#7C3AED', bg: 'rgba(139,92,246,0.1)', border: 'rgba(139,92,246,0.2)' };
}

export default function UserProfile() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<Tab>('profile');
    const [resumes, setResumes] = useState<ResumeSummary[]>([]);
    const [analyses, setAnalyses] = useState<AnalysisSummary[]>([]);
    const [loadingResumes, setLoadingResumes] = useState(false);
    const [loadingInsights, setLoadingInsights] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [uploadSuccess, setUploadSuccess] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const [editingName, setEditingName] = useState(false);
    const [nameInput, setNameInput] = useState(user?.full_name || '');
    const [dragOver, setDragOver] = useState(false);
    const fileRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (activeTab === 'resumes') fetchResumes();
        if (activeTab === 'insights') fetchInsights();
    }, [activeTab]);

    const fetchResumes = async () => {
        setLoadingResumes(true);
        try {
            const { data } = await profileAPI.getResumes();
            setResumes(data);
        } catch {
            setResumes([]);
        } finally {
            setLoadingResumes(false);
        }
    };

    const fetchInsights = async () => {
        setLoadingInsights(true);
        try {
            const [resumeRes, analysisRes] = await Promise.all([
                profileAPI.getResumes(),
                profileAPI.getAnalyses(),
            ]);
            setResumes(resumeRes.data);
            setAnalyses(analysisRes.data);
        } catch {
            setAnalyses([]);
        } finally {
            setLoadingInsights(false);
        }
    };

    const handleUpload = async (file: File) => {
        if (!file) return;
        setUploading(true);
        setUploadError(null);
        setUploadSuccess(false);
        try {
            await resumeAPI.upload(file);
            setUploadSuccess(true);
            await fetchResumes();
            setTimeout(() => setUploadSuccess(false), 3000);
        } catch (err: any) {
            setUploadError(err?.response?.data?.detail || 'Upload failed. Please try again.');
        } finally {
            setUploading(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);
        const file = e.dataTransfer.files[0];
        if (file) handleUpload(file);
    };

    const handleDeleteResume = async (id: string) => {
        if (!confirm('Are you sure you want to delete this resume?')) return;
        try {
            await resumeAPI.delete(id);
            setResumes(resumes.filter(r => r.id !== id));
        } catch (err: any) {
            console.error('Failed to delete resume', err);
            alert('Failed to delete resume.');
        }
    };

    const handleLogout = () => { logout(); navigate('/login'); };

    const initials = user?.full_name
        ? user.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
        : user?.email?.slice(0, 2).toUpperCase() || '?';

    const joinedDate = user?.created_at
        ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
        : 'Unknown';

    const TABS: { id: Tab; icon: typeof User; label: string }[] = [
        { id: 'profile', icon: User, label: 'Profile' },
        { id: 'resumes', icon: FileText, label: 'My Resumes' },
        { id: 'insights', icon: Brain, label: 'AI Insights' },
    ];

    return (
        <motion.div initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.07 } } }} className="space-y-6 max-w-4xl mx-auto">
            {/* Header */}
            <motion.div variants={cItem} className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-display font-bold text-bark flex items-center gap-2">
                        <User className="w-6 h-6 text-warm-500" />
                        My Profile
                    </h1>
                    <p className="text-dusk mt-0.5">Manage your account and view your AI-powered insights</p>
                </div>
                <button onClick={handleLogout}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all text-rose-500 hover:bg-rose-50 border border-rose-100">
                    <LogOut className="w-4 h-4" /> Sign out
                </button>
            </motion.div>

            {/* Profile Card */}
            <motion.div variants={cItem} className="card p-6 flex items-center gap-6">
                {/* Avatar */}
                <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-2xl font-black flex-shrink-0"
                    style={{ background: 'linear-gradient(135deg, rgba(245,166,35,0.15), rgba(139,92,246,0.12))', color: '#B87300', border: '2px solid rgba(245,166,35,0.2)' }}>
                    {initials}
                </div>
                <div className="flex-1 min-w-0">
                    {/* Name */}
                    {editingName ? (
                        <div className="flex items-center gap-2 mb-1">
                            <input
                                id="name-input"
                                value={nameInput}
                                onChange={e => setNameInput(e.target.value)}
                                className="input-field text-lg font-bold py-1.5"
                                placeholder="Your full name"
                                autoFocus
                            />
                            <button onClick={() => setEditingName(false)} className="p-2 rounded-xl hover:bg-warm-50 text-green-500 transition-all">
                                <Check className="w-4 h-4" />
                            </button>
                            <button onClick={() => { setEditingName(false); setNameInput(user?.full_name || ''); }} className="p-2 rounded-xl hover:bg-warm-50 text-rose-400 transition-all">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 mb-1">
                            <h2 className="text-xl font-bold text-bark truncate">
                                {user?.full_name || user?.email?.split('@')[0] || 'User'}
                            </h2>
                            <button onClick={() => setEditingName(true)} className="p-1.5 rounded-lg hover:bg-warm-100 text-muted hover:text-warm-600 transition-all">
                                <Edit3 className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    )}
                    <p className="text-dusk text-sm mb-2">{user?.email}</p>
                    <div className="flex flex-wrap items-center gap-3 text-xs">
                        <span className="flex items-center gap-1.5 text-muted">
                            <Calendar className="w-3.5 h-3.5" /> Joined {joinedDate}
                        </span>
                        <span className="flex items-center gap-1.5 text-muted">
                            <Cpu className="w-3.5 h-3.5" /> via {user?.auth_provider === 'google' ? 'Google' : 'Email'}
                        </span>
                        <span className="px-2 py-0.5 rounded-full font-bold"
                            style={{ background: 'rgba(90,158,90,0.08)', color: '#468246', border: '1px solid rgba(90,158,90,0.2)' }}>
                            ✓ Active
                        </span>
                    </div>
                </div>
            </motion.div>

            {/* Tabs */}
            <motion.div variants={cItem} className="flex gap-2 p-1 rounded-2xl" style={{ background: 'var(--surface2)', border: '1px solid var(--border)' }}>
                {TABS.map(({ id, icon: Icon, label }) => (
                    <button key={id} onClick={() => setActiveTab(id)}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all duration-200"
                        style={activeTab === id
                            ? { background: 'var(--surface)', color: 'var(--accent)', boxShadow: '0 2px 8px rgba(45,42,50,0.06)', border: '1px solid var(--border)' }
                            : { color: 'var(--text-secondary)' }}>
                        <Icon className="w-4 h-4" /> {label}
                    </button>
                ))}
            </motion.div>

            {/* Tab Content */}
            <AnimatePresence mode="wait">
                {/* ── Profile Tab ─────────────────────────────────── */}
                {activeTab === 'profile' && (
                    <motion.div key="profile" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-5">
                        {/* Account Info */}
                        <div className="card">
                            <h3 className="font-display font-bold text-bark flex items-center gap-2 mb-4">
                                <Sparkles className="w-4 h-4 text-warm-500" /> Account Details
                            </h3>
                            <div className="grid sm:grid-cols-2 gap-4">
                                {[
                                    { label: 'Full Name', value: user?.full_name || '—' },
                                    { label: 'Email Address', value: user?.email || '—' },
                                    { label: 'Auth Provider', value: user?.auth_provider === 'google' ? 'Google OAuth' : 'Email & Password' },
                                    { label: 'Account Status', value: user?.is_active ? 'Active' : 'Inactive' },
                                    { label: 'Member Since', value: joinedDate },
                                    { label: 'User ID', value: user?.id?.slice(0, 8) + '…' || '—' },
                                ].map(({ label, value }) => (
                                    <div key={label} className="flex flex-col gap-0.5">
                                        <span className="text-xs font-black uppercase tracking-widest text-muted">{label}</span>
                                        <span className="text-sm font-semibold text-bark">{value}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Quick Links */}
                        <div className="card">
                            <h3 className="font-display font-bold text-bark flex items-center gap-2 mb-4">
                                <ArrowRight className="w-4 h-4 text-warm-500" /> Quick Access
                            </h3>
                            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                {[
                                    { to: '/dashboard', icon: Sparkles, label: 'Dashboard', color: '#F5A623' },
                                    { to: '/analysis', icon: ShieldAlert, label: 'Rejection Risk', color: '#E84565' },
                                    { to: '/pipeline', icon: Filter, label: 'Hiring Pipeline', color: '#0EA5E9' },
                                    { to: '/blueprint', icon: Map, label: 'Blueprint', color: '#F5A623' },
                                    { to: '/action-plan', icon: ListChecks, label: 'Action Plan', color: '#8B5CF6' },
                                    { to: '/market', icon: Globe2, label: 'Market Radar', color: '#5A9E5A' },
                                ].map(({ to, icon: Icon, label, color }) => (
                                    <Link key={to} to={to}
                                        className="flex items-center gap-3 p-3 rounded-2xl border transition-all hover:-translate-y-0.5 hover:shadow-md"
                                        style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
                                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = color; }}
                                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; }}>
                                        <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                                            style={{ background: `${color}15` }}>
                                            <Icon className="w-4 h-4" style={{ color }} />
                                        </div>
                                        <span className="text-sm font-semibold text-bark">{label}</span>
                                        <ArrowRight className="w-3.5 h-3.5 text-muted ml-auto" />
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* ── Resumes Tab ─────────────────────────────────── */}
                {activeTab === 'resumes' && (
                    <motion.div key="resumes" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-5">
                        {/* Upload Drop Zone */}
                        <div
                            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                            onDragLeave={() => setDragOver(false)}
                            onDrop={handleDrop}
                            onClick={() => fileRef.current?.click()}
                            className="rounded-2xl p-8 text-center cursor-pointer transition-all"
                            style={{
                                border: `2px dashed ${dragOver ? 'var(--accent)' : 'var(--border)'}`,
                                background: dragOver ? 'rgba(245,166,35,0.04)' : 'var(--surface)',
                            }}>
                            <input ref={fileRef} type="file" accept=".pdf" className="hidden"
                                onChange={e => { if (e.target.files?.[0]) handleUpload(e.target.files[0]); e.target.value = ''; }} />
                            {uploading ? (
                                <div className="space-y-3">
                                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                                        className="w-12 h-12 rounded-full mx-auto flex items-center justify-center"
                                        style={{ border: '3px solid var(--border)', borderTop: '3px solid var(--accent)' }} />
                                    <p className="text-sm font-semibold text-dusk">Processing your resume…</p>
                                </div>
                            ) : uploadSuccess ? (
                                <div className="space-y-2">
                                    <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto" />
                                    <p className="text-sm font-bold text-green-600">Resume uploaded & parsed successfully!</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    <Upload className="w-12 h-12 mx-auto" style={{ color: 'var(--muted)' }} />
                                    <div>
                                        <p className="text-sm font-bold text-bark">Drop your PDF resume here</p>
                                        <p className="text-xs text-dusk mt-1">or click to browse · PDF only · max 10 MB</p>
                                    </div>
                                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold"
                                        style={{ background: 'linear-gradient(135deg, #F5A623, #FF8C42)', color: '#fff', boxShadow: '0 4px 16px rgba(245,166,35,0.25)' }}>
                                        <Upload className="w-4 h-4" /> Upload Resume
                                    </div>
                                </div>
                            )}
                            {uploadError && (
                                <div className="mt-4 flex items-center gap-2 text-sm text-rose-600 justify-center">
                                    <AlertTriangle className="w-4 h-4" /> {uploadError}
                                </div>
                            )}
                        </div>

                        {/* Resume List */}
                        {loadingResumes ? (
                            <div className="card space-y-3">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="h-16 rounded-xl skeleton-shimmer" />
                                ))}
                            </div>
                        ) : resumes.length === 0 ? (
                            <div className="card text-center py-10">
                                <FileText className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--muted)' }} />
                                <p className="font-bold text-bark mb-1">No resumes uploaded yet</p>
                                <p className="text-sm text-dusk">Upload your first resume above to get started</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <FileText className="w-4 h-4 text-warm-500" />
                                    <h3 className="font-display font-bold text-bark">Your Resumes ({resumes.length})</h3>
                                </div>
                                {resumes.map((resume, i) => (
                                    <motion.div key={resume.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}
                                        className="card p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:shadow-md transition-all">

                                        <div className="flex items-start sm:items-center gap-4 flex-1 min-w-0">
                                            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-1 sm:mt-0"
                                                style={{ background: 'rgba(245,166,35,0.1)' }}>
                                                <FileText className="w-5 h-5 text-warm-600" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-bold text-bark text-sm truncate">{resume.filename}</p>

                                                {/* UUID Display */}
                                                <div className="flex items-center gap-2 mt-1 mb-1">
                                                    <code className="text-[10px] text-muted bg-warm-50 px-1.5 py-0.5 rounded border border-warm-100 font-mono select-all">
                                                        {resume.id}
                                                    </code>
                                                    <button onClick={() => navigator.clipboard.writeText(resume.id)} className="p-1 hover:bg-warm-100 rounded text-muted hover:text-warm-600 transition-colors" title="Copy Resume ID">
                                                        <Copy className="w-3 h-3" />
                                                    </button>
                                                </div>

                                                <div className="flex flex-wrap items-center gap-2 mt-0.5">
                                                    <span className="text-xs text-dusk flex items-center gap-1">
                                                        <TrendingUp className="w-3 h-3" /> {resume.skills_count} skills
                                                    </span>
                                                    {resume.experience_level && (
                                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full capitalize"
                                                            style={{ background: 'rgba(14,165,233,0.08)', color: '#0284C7', border: '1px solid rgba(14,165,233,0.2)' }}>
                                                            {resume.experience_level}
                                                        </span>
                                                    )}
                                                    <span className="text-xs text-muted flex items-center gap-1">
                                                        <Clock className="w-3 h-3" />
                                                        {new Date(resume.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 flex-shrink-0 w-full sm:w-auto justify-end mt-2 sm:mt-0">
                                            <Link to="/analysis" className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
                                                style={{ background: 'rgba(232,69,101,0.08)', color: '#C5324F', border: '1px solid rgba(232,69,101,0.2)' }}>
                                                <ShieldAlert className="w-3.5 h-3.5" /> Analyse
                                            </Link>
                                            <button onClick={() => handleDeleteResume(resume.id)} className="p-2 rounded-xl text-xs font-bold transition-all text-rose-500 hover:bg-rose-50" title="Delete Resume">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </motion.div>
                )}

                {/* ── AI Insights Tab ─────────────────────────────── */}
                {activeTab === 'insights' && (
                    <motion.div key="insights" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-5">
                        <p className="text-sm text-dusk font-medium">Your most recent data from all AI modules — all in one place.</p>

                        {loadingInsights ? (
                            <div className="space-y-4">
                                {[1, 2, 3].map(i => <div key={i} className="h-28 rounded-2xl skeleton-shimmer" />)}
                            </div>
                        ) : (
                            <>
                                {/* Rejection Analyses */}
                                <div className="card">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="font-display font-bold text-bark flex items-center gap-2">
                                            <ShieldAlert className="w-4 h-4 text-rose-500" /> Rejection Risk History
                                        </h3>
                                        <Link to="/analysis" className="text-xs font-bold text-warm-600 hover:text-warm-700 flex items-center gap-1">
                                            Run New <ArrowRight className="w-3 h-3" />
                                        </Link>
                                    </div>
                                    {analyses.length === 0 ? (
                                        <div className="text-center py-6">
                                            <ShieldAlert className="w-10 h-10 mx-auto mb-2" style={{ color: 'var(--muted)' }} />
                                            <p className="text-sm font-semibold text-bark mb-1">No analyses yet</p>
                                            <p className="text-xs text-dusk mb-4">Upload a resume & run a rejection risk analysis</p>
                                            <Link to="/analysis" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold"
                                                style={{ background: 'rgba(232,69,101,0.08)', color: '#C5324F', border: '1px solid rgba(232,69,101,0.2)' }}>
                                                <ShieldAlert className="w-4 h-4" /> Go to Rejection Risk
                                            </Link>
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            {analyses.map((a, i) => {
                                                const c = riskColor(a.risk_level);
                                                return (
                                                    <motion.div key={a.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                                                        className="flex items-center gap-4 p-3 rounded-xl border"
                                                        style={{ borderColor: 'var(--border)', background: 'var(--surface2)' }}>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm font-bold text-bark truncate">{a.job_title || 'Unknown Role'}</p>
                                                            <p className="text-xs text-muted">
                                                                {new Date(a.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                            </p>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="text-lg font-black" style={{ color: c.text }}>{a.risk_score}%</p>
                                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                                                                style={{ background: c.bg, color: c.text, border: `1px solid ${c.border}` }}>
                                                                {a.risk_level}
                                                            </span>
                                                        </div>
                                                    </motion.div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>

                                {/* Resume Stats */}
                                <div className="card">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="font-display font-bold text-bark flex items-center gap-2">
                                            <FileText className="w-4 h-4 text-amber-500" /> Resume Summary
                                        </h3>
                                        <Link to="/resume" className="text-xs font-bold text-warm-600 hover:text-warm-700 flex items-center gap-1">
                                            Upload <ArrowRight className="w-3 h-3" />
                                        </Link>
                                    </div>
                                    {resumes.length === 0 ? (
                                        <div className="text-center py-6">
                                            <FileText className="w-10 h-10 mx-auto mb-2" style={{ color: 'var(--muted)' }} />
                                            <p className="text-sm font-semibold text-bark mb-1">No resumes yet</p>
                                            <Link to="/resume" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold"
                                                style={{ background: 'rgba(245,166,35,0.08)', color: '#B87300', border: '1px solid rgba(245,166,35,0.2)' }}>
                                                <Upload className="w-4 h-4" /> Upload Resume
                                            </Link>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                            {[
                                                { label: 'Resumes', value: resumes.length, color: '#F5A623' },
                                                { label: 'Total Skills', value: resumes.reduce((s, r) => s + r.skills_count, 0), color: '#0EA5E9' },
                                                { label: 'Analyses Run', value: analyses.length, color: '#E84565' },
                                                {
                                                    label: 'Avg Risk',
                                                    value: analyses.length ? Math.round(analyses.reduce((s, a) => s + a.risk_score, 0) / analyses.length) + '%' : '—',
                                                    color: '#8B5CF6',
                                                },
                                            ].map(s => (
                                                <div key={s.label} className="text-center p-3 rounded-xl"
                                                    style={{ background: `${s.color}08`, border: `1px solid ${s.color}20` }}>
                                                    <p className="text-2xl font-black" style={{ color: s.color }}>{s.value}</p>
                                                    <p className="text-xs font-semibold text-dusk mt-0.5">{s.label}</p>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Module Shortcuts */}
                                <div className="card">
                                    <h3 className="font-display font-bold text-bark flex items-center gap-2 mb-4">
                                        <Brain className="w-4 h-4 text-violet-500" /> Continue in a Module
                                    </h3>
                                    <div className="grid sm:grid-cols-2 gap-3">
                                        {[
                                            { to: '/pipeline', icon: Filter, label: 'Run Pipeline Simulation', color: '#0EA5E9', desc: 'Calculate hiring survival probability' },
                                            { to: '/blueprint', icon: Map, label: 'Generate 90-Day Blueprint', color: '#F5A623', desc: 'Get your personalized career plan' },
                                            { to: '/action-plan', icon: ListChecks, label: 'View Action Plan', color: '#8B5CF6', desc: '30-day structured roadmap' },
                                            { to: '/market', icon: Globe2, label: 'Market Intelligence', color: '#5A9E5A', desc: 'See what skills are in demand' },
                                        ].map(({ to, icon: Icon, label, color, desc }) => (
                                            <Link key={to} to={to}
                                                className="flex items-center gap-3 p-4 rounded-2xl border transition-all hover:-translate-y-0.5 hover:shadow-md"
                                                style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
                                                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = color; }}
                                                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; }}>
                                                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                                                    style={{ background: `${color}15` }}>
                                                    <Icon className="w-5 h-5" style={{ color }} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-bold text-bark">{label}</p>
                                                    <p className="text-xs text-dusk">{desc}</p>
                                                </div>
                                                <ArrowRight className="w-4 h-4 text-muted flex-shrink-0" />
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            </>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
