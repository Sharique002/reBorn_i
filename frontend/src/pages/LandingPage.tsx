// ═══════════════════════════════════════════════════════════
// reBorn_i — Public Landing Page
// ═══════════════════════════════════════════════════════════

import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    FileText, ShieldAlert, GitCompareArrows, Compass, ListChecks,
    Map, Filter, Brain, TrendingUp, Briefcase,
    ArrowRight, Sparkles, Zap, Target, BarChart3,
    CheckCircle2, Users, Globe2, Flower2, Star,
} from 'lucide-react';

const fadeUp = {
    hidden: { opacity: 0, y: 32 },
    show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: 'easeOut' as const } },
};
const stagger = { show: { transition: { staggerChildren: 0.09 } } };

const FEATURES = [
    {
        icon: Filter, title: 'Hiring Pipeline', desc: 'Calculate your exact survival probability through every hiring stage — ATS, recruiter screen, market fit.',
        gradient: 'from-sky-50 to-cyan-50', iconBg: 'bg-sky-100', iconColor: 'text-sky-600',
    },
    {
        icon: ShieldAlert, title: 'Rejection Risk AI', desc: "5-layer deterministic model scores your resume against any job description and tells you why you'd be rejected.",
        gradient: 'from-rose-50 to-pink-50', iconBg: 'bg-rose-100', iconColor: 'text-rose-600',
    },
    {
        icon: GitCompareArrows, title: 'Skill Simulator', desc: 'Simulate adding or removing skills and see the exact impact on your rejection risk before editing your resume.',
        gradient: 'from-violet-50 to-purple-50', iconBg: 'bg-violet-100', iconColor: 'text-violet-600',
    },
    {
        icon: Compass, title: 'Career Pivot', desc: 'Discover alternative career paths that match your existing skills — with actionable transition plans.',
        gradient: 'from-indigo-50 to-violet-50', iconBg: 'bg-indigo-100', iconColor: 'text-indigo-600',
    },
    {
        icon: Map, title: '90-Day Blueprint', desc: 'AI-generated, fully personalized 90-day career reinvention plan tailored to your skill gaps and target role.',
        gradient: 'from-amber-50 to-orange-50', iconBg: 'bg-amber-100', iconColor: 'text-amber-600',
    },
    {
        icon: Globe2, title: 'Market Intelligence', desc: 'Real-time skill demand radar showing what employers are hiring for — aligned to your current profile.',
        gradient: 'from-green-50 to-emerald-50', iconBg: 'bg-green-100', iconColor: 'text-green-600',
    },
];

const STEPS = [
    { num: 1, icon: FileText, label: 'Upload Resume', desc: 'Drop your PDF — we parse, structure, and score it instantly.', color: '#F5A623' },
    {
        num: 2, icon: ShieldAlert, label: 'Get Risk Score', desc: "See exactly why you're being rejected with a 5-layer risk breakdown.", color: '#E84565'
    },
    { num: 3, icon: GitCompareArrows, label: 'Simulate Skills', desc: 'Test skill changes and measure their impact before applying.', color: '#8B5CF6' },
    { num: 4, icon: Compass, label: 'Find Your Path', desc: 'Discover alternate career pivots matched to your experience.', color: '#0EA5E9' },
    { num: 5, icon: ListChecks, label: 'Execute the Plan', desc: 'Follow your 30-day action plan to land the interview.', color: '#5A9E5A' },
];

const PAIN_POINTS = [
    { icon: '😩', title: 'ATS filters you out before a human even reads your resume', tag: 'ATS Screening' },
    { icon: '📉', title: 'You don\'t know which skills to add to actually improve your odds', tag: 'Skill Gaps' },
    { icon: '🔄', title: 'You apply to dozens of jobs with the same resume and hope for the best', tag: 'No Strategy' },
];

const STATS = [
    { value: '10', label: 'AI Modules', sub: 'end-to-end career tools' },
    { value: '5', label: 'Risk Layers', sub: 'deterministic scoring model' },
    { value: '90', label: 'Day Blueprint', sub: 'personalized action plan' },
    { value: '∞', label: 'Simulations', sub: 'test skills risk-free' },
];

export default function LandingPage() {
    return (
        <div className="min-h-screen" style={{ background: 'var(--bg)', fontFamily: "'Nunito', system-ui, sans-serif" }}>
            {/* ── Navbar ─────────────────────────────────────────── */}
            <header className="fixed top-0 inset-x-0 z-50 backdrop-blur-xl border-b" style={{ background: 'rgba(255,248,240,0.85)', borderColor: 'var(--border)' }}>
                <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                        <motion.div
                            animate={{ rotate: [0, 10, -10, 0] }}
                            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                            className="w-8 h-8 rounded-xl flex items-center justify-center"
                            style={{ background: 'linear-gradient(135deg, rgba(245,166,35,0.15), rgba(232,69,101,0.1))' }}
                        >
                            <Flower2 className="w-4 h-4" style={{ color: '#F5A623' }} />
                        </motion.div>
                        <span className="font-black text-xl" style={{ background: 'linear-gradient(135deg, #F5A623, #FF8C42, #E84565)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                            reBorn_i
                        </span>
                    </div>
                    <nav className="hidden md:flex items-center gap-6">
                        <a href="#features" className="text-sm font-semibold transition-colors" style={{ color: 'var(--text-secondary)' }}
                            onMouseEnter={e => (e.currentTarget.style.color = 'var(--accent)')}
                            onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-secondary)')}>Features</a>
                        <a href="#how-it-works" className="text-sm font-semibold transition-colors" style={{ color: 'var(--text-secondary)' }}
                            onMouseEnter={e => (e.currentTarget.style.color = 'var(--accent)')}
                            onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-secondary)')}>How it Works</a>
                        <a href="#stats" className="text-sm font-semibold transition-colors" style={{ color: 'var(--text-secondary)' }}
                            onMouseEnter={e => (e.currentTarget.style.color = 'var(--accent)')}
                            onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-secondary)')}>About</a>
                    </nav>
                    <div className="flex items-center gap-3">
                        <Link to="/login" className="text-sm font-bold px-4 py-2 rounded-xl transition-all"
                            style={{ color: 'var(--text)', border: '2px solid var(--border)' }}
                            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--accent)'; (e.currentTarget as HTMLElement).style.color = 'var(--accent)'; }}
                            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLElement).style.color = 'var(--text)'; }}>
                            Sign in
                        </Link>
                        <Link to="/register" className="text-sm font-bold px-4 py-2 rounded-xl text-white transition-all"
                            style={{ background: 'linear-gradient(135deg, #F5A623, #FF8C42)', boxShadow: '0 4px 16px rgba(245,166,35,0.3)' }}>
                            Get Started
                        </Link>
                    </div>
                </div>
            </header>

            {/* ── Hero ───────────────────────────────────────────── */}
            <section className="relative overflow-hidden pt-32 pb-24 px-6">
                {/* Background blobs */}
                <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full pointer-events-none"
                    style={{ background: 'radial-gradient(circle, rgba(245,166,35,0.08) 0%, transparent 70%)' }} />
                <div className="absolute -top-20 -right-20 w-[500px] h-[500px] rounded-full pointer-events-none"
                    style={{ background: 'radial-gradient(circle, rgba(232,69,101,0.06) 0%, transparent 70%)' }} />
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full pointer-events-none"
                    style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.05) 0%, transparent 70%)' }} />

                <motion.div initial="hidden" animate="show" variants={stagger} className="max-w-4xl mx-auto text-center relative z-10">
                    {/* Pill badge */}
                    <motion.div variants={fadeUp} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-8 text-sm font-bold"
                        style={{ background: 'rgba(245,166,35,0.1)', border: '1px solid rgba(245,166,35,0.2)', color: '#B87300' }}>
                        <Sparkles className="w-3.5 h-3.5" />
                        Zero Guesswork
                    </motion.div>

                    {/* Headline */}
                    <motion.h1 variants={fadeUp} className="text-5xl md:text-7xl font-black leading-tight mb-6" style={{ color: 'var(--text)' }}>
                        Turn Every{' '}
                        <span style={{ background: 'linear-gradient(135deg, #E84565, #8B5CF6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                            Rejection
                        </span>
                        <br />
                        Into a{' '}
                        <span style={{ background: 'linear-gradient(135deg, #F5A623, #FF8C42)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                            Comeback
                        </span>
                    </motion.h1>

                    <motion.p variants={fadeUp} className="text-xl md:text-2xl mb-10 max-w-2xl mx-auto leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                        The <strong style={{ color: 'var(--text)' }}>AI-powered career platform</strong> that tells you <em>exactly</em> why you're being rejected — then helps you fix it, step by step.
                    </motion.p>

                    {/* CTAs */}
                    <motion.div variants={fadeUp} className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
                        <Link to="/register"
                            className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl text-white font-bold text-lg transition-all"
                            style={{ background: 'linear-gradient(135deg, #F5A623, #FF8C42)', boxShadow: '0 8px 32px rgba(245,166,35,0.35)' }}
                            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 12px 40px rgba(245,166,35,0.45)'; }}
                            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 32px rgba(245,166,35,0.35)'; }}>
                            <Zap className="w-5 h-5" /> Start Free — No Credit Card
                        </Link>
                        <Link to="/login"
                            className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl font-bold text-lg transition-all"
                            style={{ background: 'rgba(255,255,255,0.8)', border: '2px solid var(--border)', color: 'var(--text)', backdropFilter: 'blur(8px)' }}
                            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--accent)'; }}
                            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; }}>
                            Sign In <ArrowRight className="w-5 h-5" />
                        </Link>
                    </motion.div>

                    {/* Floating stats */}
                    <motion.div variants={fadeUp} className="flex flex-wrap items-center justify-center gap-4">
                        {[
                            { icon: CheckCircle2, text: '5-Layer Rejection Model', color: '#5A9E5A' },
                            { icon: Target, text: 'Deterministic Scoring', color: '#0EA5E9' },
                            { icon: Users, text: 'AI-Powered Guidance', color: '#8B5CF6' },
                        ].map(({ icon: Icon, text, color }) => (
                            <div key={text} className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold"
                                style={{ background: `${color}12`, border: `1px solid ${color}25`, color }}>
                                <Icon className="w-4 h-4" /> {text}
                            </div>
                        ))}
                    </motion.div>
                </motion.div>
            </section>

            {/* ── Pain Points ────────────────────────────────────── */}
            <section className="py-20 px-6" style={{ background: 'var(--surface2)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
                <div className="max-w-5xl mx-auto">
                    <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={stagger}>
                        <motion.div variants={fadeUp} className="text-center mb-12">
                            <h2 className="text-3xl md:text-4xl font-black mb-3" style={{ color: 'var(--text)' }}>
                                Sound Familiar? 😮‍💨
                            </h2>
                            <p className="text-lg" style={{ color: 'var(--text-secondary)' }}>
                                80% of qualified candidates get rejected for reasons they never discover.
                            </p>
                        </motion.div>
                        <div className="grid md:grid-cols-3 gap-6">
                            {PAIN_POINTS.map((point, i) => (
                                <motion.div key={i} variants={fadeUp}
                                    className="rounded-2xl p-6 text-center"
                                    style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: '0 2px 16px rgba(45,42,50,0.04)' }}>
                                    <div className="text-4xl mb-4">{point.icon}</div>
                                    <span className="inline-block text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full mb-3"
                                        style={{ background: 'rgba(232,69,101,0.08)', color: '#C5324F', border: '1px solid rgba(232,69,101,0.2)' }}>
                                        {point.tag}
                                    </span>
                                    <p className="font-bold leading-snug" style={{ color: 'var(--text)' }}>{point.title}</p>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* ── How It Works ───────────────────────────────────── */}
            <section id="how-it-works" className="py-24 px-6">
                <div className="max-w-5xl mx-auto">
                    <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={stagger}>
                        <motion.div variants={fadeUp} className="text-center mb-16">
                            <span className="inline-flex items-center gap-1.5 text-sm font-bold px-3 py-1 rounded-full mb-4"
                                style={{ background: 'rgba(245,166,35,0.1)', color: '#B87300', border: '1px solid rgba(245,166,35,0.2)' }}>
                                <Sparkles className="w-3.5 h-3.5" /> The Process
                            </span>
                            <h2 className="text-3xl md:text-4xl font-black" style={{ color: 'var(--text)' }}>
                                5 Steps from Rejection to{' '}
                                <span style={{ background: 'linear-gradient(135deg, #F5A623, #FF8C42)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                                    Hired
                                </span>
                            </h2>
                        </motion.div>

                        <div className="flex flex-col md:flex-row gap-4 md:gap-2">
                            {STEPS.map((step, i) => (
                                <motion.div key={step.num} variants={fadeUp}
                                    className="flex-1 relative rounded-2xl p-5 text-center transition-all"
                                    style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: '0 2px 16px rgba(45,42,50,0.04)' }}
                                    whileHover={{ y: -4, boxShadow: '0 8px 32px rgba(45,42,50,0.08)' }}>
                                    {/* Step number */}
                                    <div className="text-4xl font-black absolute top-3 right-4 opacity-[0.07]" style={{ color: step.color }}>
                                        {step.num}
                                    </div>
                                    <div className="w-12 h-12 rounded-2xl mx-auto mb-4 flex items-center justify-center"
                                        style={{ background: `${step.color}15` }}>
                                        <step.icon className="w-6 h-6" style={{ color: step.color }} />
                                    </div>
                                    <h3 className="font-black text-sm mb-1" style={{ color: 'var(--text)' }}>{step.label}</h3>
                                    <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{step.desc}</p>
                                    {/* Connector arrow (hidden on last) */}
                                    {i < STEPS.length - 1 && (
                                        <div className="hidden md:flex absolute -right-3 top-1/2 -translate-y-1/2 z-10 w-6 h-6 rounded-full items-center justify-center"
                                            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                                            <ArrowRight className="w-3 h-3" style={{ color: 'var(--muted)' }} />
                                        </div>
                                    )}
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* ── Features Grid ──────────────────────────────────── */}
            <section id="features" className="py-24 px-6" style={{ background: 'var(--surface2)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
                <div className="max-w-6xl mx-auto">
                    <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={stagger}>
                        <motion.div variants={fadeUp} className="text-center mb-14">
                            <span className="inline-flex items-center gap-1.5 text-sm font-bold px-3 py-1 rounded-full mb-4"
                                style={{ background: 'rgba(139,92,246,0.1)', color: '#7C3AED', border: '1px solid rgba(139,92,246,0.2)' }}>
                                <BarChart3 className="w-3.5 h-3.5" /> All 10 Modules
                            </span>
                            <h2 className="text-3xl md:text-4xl font-black" style={{ color: 'var(--text)' }}>
                                Every Tool You Need to{' '}
                                <span style={{ background: 'linear-gradient(135deg, #8B5CF6, #E84565)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                                    Win the Hire
                                </span>
                            </h2>
                        </motion.div>

                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                            {FEATURES.map((f, i) => (
                                <motion.div key={f.title} variants={fadeUp}
                                    className={`rounded-2xl p-6 bg-gradient-to-br ${f.gradient} border border-white/60 transition-all cursor-default`}
                                    whileHover={{ y: -4, boxShadow: '0 12px 40px rgba(45,42,50,0.1)' }}>
                                    <div className={`w-12 h-12 rounded-2xl ${f.iconBg} flex items-center justify-center mb-4`}>
                                        <f.icon className={`w-6 h-6 ${f.iconColor}`} />
                                    </div>
                                    <h3 className="font-black text-base mb-2" style={{ color: 'var(--text)' }}>{f.title}</h3>
                                    <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{f.desc}</p>
                                </motion.div>
                            ))}
                        </div>

                        {/* Additional modules listed */}
                        <motion.div variants={fadeUp} className="mt-8 flex flex-wrap justify-center gap-3">
                            {[Brain, TrendingUp, Briefcase, ListChecks].map((Icon, i) => {
                                const labels = ['Interview Readiness', 'Resume Tracker', 'Application Tracker', 'Action Plan'];
                                return (
                                    <div key={i} className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold"
                                        style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
                                        <Icon className="w-4 h-4" style={{ color: 'var(--accent)' }} />
                                        {labels[i]}
                                    </div>
                                );
                            })}
                        </motion.div>
                    </motion.div>
                </div>
            </section>

            {/* ── Stats ──────────────────────────────────────────── */}
            <section id="stats" className="py-24 px-6">
                <div className="max-w-4xl mx-auto">
                    <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={stagger}>
                        <motion.div variants={fadeUp} className="text-center mb-14">
                            <h2 className="text-3xl md:text-4xl font-black" style={{ color: 'var(--text)' }}>
                                Built for{' '}
                                <span style={{ background: 'linear-gradient(135deg, #F5A623, #E84565)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                                    Serious Job Seekers
                                </span>
                            </h2>
                        </motion.div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                            {STATS.map((s, i) => (
                                <motion.div key={s.label} variants={fadeUp}
                                    className="text-center rounded-2xl p-6"
                                    style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: '0 2px 16px rgba(45,42,50,0.04)' }}>
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.5 }}
                                        whileInView={{ opacity: 1, scale: 1 }}
                                        viewport={{ once: true }}
                                        transition={{ delay: i * 0.1, duration: 0.5, ease: 'easeOut' }}
                                        className="text-4xl font-black mb-1"
                                        style={{ background: 'linear-gradient(135deg, #F5A623, #E84565)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                                        {s.value}+
                                    </motion.div>
                                    <p className="font-bold text-sm mb-0.5" style={{ color: 'var(--text)' }}>{s.label}</p>
                                    <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{s.sub}</p>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* ── Final CTA ──────────────────────────────────────── */}
            <section className="py-24 px-6" style={{ background: 'var(--surface2)', borderTop: '1px solid var(--border)' }}>
                <div className="max-w-3xl mx-auto text-center">
                    <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={stagger}>
                        <motion.div variants={fadeUp}
                            className="rounded-3xl p-10 md:p-14 relative overflow-hidden"
                            style={{ background: 'linear-gradient(135deg, rgba(245,166,35,0.08), rgba(232,69,101,0.06), rgba(139,92,246,0.06))', border: '1px solid var(--border)' }}>
                            <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full pointer-events-none"
                                style={{ background: 'radial-gradient(circle, rgba(245,166,35,0.1) 0%, transparent 70%)' }} />
                            <motion.div
                                animate={{ rotate: [0, 10, -10, 0] }}
                                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                                className="text-5xl mb-6">🌱</motion.div>
                            <h2 className="text-3xl md:text-4xl font-black mb-4" style={{ color: 'var(--text)' }}>
                                Ready to reBorn your career?
                            </h2>
                            <p className="text-lg mb-8" style={{ color: 'var(--text-secondary)' }}>
                                Stop guessing. Start knowing. Upload your resume and get your rejection risk score in under 60 seconds.
                            </p>
                            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                                <Link to="/register"
                                    className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl text-white font-bold text-lg transition-all"
                                    style={{ background: 'linear-gradient(135deg, #F5A623, #FF8C42)', boxShadow: '0 8px 32px rgba(245,166,35,0.35)' }}
                                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; }}
                                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; }}>
                                    <Star className="w-5 h-5" /> Get Started Free
                                </Link>
                                <Link to="/login"
                                    className="text-sm font-bold transition-all"
                                    style={{ color: 'var(--text-secondary)' }}
                                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'var(--accent)'; }}
                                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)'; }}>
                                    Already have an account? Sign in →
                                </Link>
                            </div>
                        </motion.div>
                    </motion.div>
                </div>
            </section>

            {/* ── Footer ─────────────────────────────────────────── */}
            <footer className="py-8 px-6 text-center border-t" style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}>
                <div className="flex items-center justify-center gap-2 mb-2">
                    <Flower2 className="w-4 h-4" style={{ color: '#F5A623' }} />
                    <span className="font-black" style={{ color: 'var(--text)' }}>reBorn_i</span>
                </div>
                <p className="text-sm">Career reinvention powered by AI ·· Zero BS</p>
            </footer>
        </div>
    );
}
