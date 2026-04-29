// ═══════════════════════════════════════════════════════════
// reBorn_i — Login Page (Warm Storybook Theme)
// ═══════════════════════════════════════════════════════════

import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import GoogleSignInButton from '../components/GoogleSignInButton';
import { LogIn, Flower2, AlertCircle, BookOpen, Briefcase, TrendingUp } from 'lucide-react';
import AnimatedButton from '../components/AnimatedButton';

const journeySteps = [
  { icon: BookOpen, label: 'Study', desc: 'Analyze your skills & gaps', color: '#F5A623' },
  { icon: Briefcase, label: 'Hire', desc: 'Navigate the hiring pipeline', color: '#0EA5E9' },
  { icon: TrendingUp, label: 'Improve', desc: 'Grow with actionable plans', color: '#5A9E5A' },
];

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--bg)' }}>
      {/* Left panel — Warm illustration side */}
      <div className="hidden lg:flex lg:w-1/2 items-center justify-center p-12 relative overflow-hidden">
        {/* Background decoration */}
        <motion.div
          className="absolute -top-20 -left-20 w-96 h-96 rounded-full"
          style={{ background: 'rgba(245, 166, 35, 0.08)', filter: 'blur(80px)' }}
          animate={{ scale: [1, 1.1, 1], rotate: [0, 5, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute bottom-0 right-0 w-80 h-80 rounded-full"
          style={{ background: 'rgba(232, 69, 101, 0.06)', filter: 'blur(60px)' }}
          animate={{ scale: [1, 0.95, 1] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
        />
        <motion.div
          className="absolute top-1/4 right-1/4 w-48 h-48 rounded-full"
          style={{ background: 'rgba(14, 165, 233, 0.05)', filter: 'blur(50px)' }}
          animate={{ y: [0, -20, 0] }}
          transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
        />

        <div className="max-w-md relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex items-center gap-3 mb-10"
          >
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              className="w-14 h-14 rounded-2xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, rgba(245,166,35,0.15), rgba(232,69,101,0.1))' }}
            >
              <Flower2 className="w-7 h-7 text-warm-500" />
            </motion.div>
            <h1 className="text-4xl font-display font-bold gradient-text-warm">
              reBorn_i
            </h1>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-2xl font-light text-dusk mb-2"
          >
            Not a Resume Helper.
          </motion.p>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-3xl font-bold text-bark mb-10"
          >
            From Rejection to Reinvention.
          </motion.p>

          {/* Journey Steps */}
          <div className="space-y-4">
            {journeySteps.map(({ icon: Icon, label, desc, color }, i) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.3 + i * 0.12 }}
                className="flex items-center gap-4 p-3 rounded-2xl transition-all"
                style={{ background: `${color}08` }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: `${color}15` }}
                >
                  <Icon className="w-5 h-5" style={{ color }} />
                </div>
                <div>
                  <p className="font-bold text-bark">{label}</p>
                  <p className="text-sm text-dusk">{desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 4, repeat: Infinity }}
            >
              <Flower2 className="w-8 h-8 text-warm-500" />
            </motion.div>
            <h1 className="text-3xl font-display font-bold gradient-text-warm">
              reBorn_i
            </h1>
          </div>

          <h2 className="text-2xl font-display font-bold text-bark mb-2">Welcome back</h2>
          <p className="text-dusk mb-8">Sign in to continue your journey</p>

          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-2 rounded-2xl px-4 py-3 mb-6 bg-rose-50 border border-rose-200 text-rose-600"
            >
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span className="text-sm font-medium">{error}</span>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="label">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field"
                placeholder="you@example.com"
                required
              />
            </div>
            <div>
              <label className="label">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field"
                placeholder="Enter your password"
                required
              />
            </div>
            <AnimatedButton
              type="submit"
              loading={loading}
              loadingText="Signing in..."
              icon={<LogIn className="w-4 h-4" />}
              className="w-full"
            >
              Sign In
            </AnimatedButton>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-warm-200" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 text-dusk bg-cream">or continue with</span>
            </div>
          </div>

          <GoogleSignInButton onError={(msg) => setError(msg)} className="w-full" />

          <p className="mt-6 text-center text-sm text-dusk">
            Don't have an account?{' '}
            <Link to="/register" className="text-warm-600 hover:text-warm-500 font-bold">
              Create one
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
