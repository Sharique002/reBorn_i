// ═══════════════════════════════════════════════════════════
// reBorn_i — Register Page (Warm Storybook Theme)
// ═══════════════════════════════════════════════════════════

import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import GoogleSignInButton from '../components/GoogleSignInButton';
import { UserPlus, Flower2, AlertCircle } from 'lucide-react';
import AnimatedButton from '../components/AnimatedButton';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    setLoading(true);
    try {
      await register(email, password, fullName || undefined);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--bg)' }}>
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-1/2 items-center justify-center p-12 relative overflow-hidden">
        <motion.div
          className="absolute -top-20 -left-20 w-96 h-96 rounded-full"
          style={{ background: 'rgba(139, 92, 246, 0.06)', filter: 'blur(80px)' }}
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute bottom-10 right-10 w-72 h-72 rounded-full"
          style={{ background: 'rgba(245, 166, 35, 0.06)', filter: 'blur(60px)' }}
          animate={{ scale: [1, 0.95, 1] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
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
            className="text-2xl font-light text-dusk mb-4"
          >
            Your career reinvention starts here.
          </motion.p>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg text-dusk leading-relaxed"
          >
            Upload your resume. We'll analyze your rejection risk, map the market landscape,
            simulate your career trajectory, and build you a concrete action plan.
          </motion.p>
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
            <Flower2 className="w-8 h-8 text-warm-500" />
            <h1 className="text-3xl font-display font-bold gradient-text-warm">reBorn_i</h1>
          </div>

          <h2 className="text-2xl font-display font-bold text-bark mb-2">Create your account</h2>
          <p className="text-dusk mb-8">Begin your reinvention journey</p>

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
              <label className="label">Full Name</label>
              <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} className="input-field" placeholder="Jane Doe" />
            </div>
            <div>
              <label className="label">Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input-field" placeholder="you@example.com" required />
            </div>
            <div>
              <label className="label">Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="input-field" placeholder="Min 8 characters" required />
            </div>
            <div>
              <label className="label">Confirm Password</label>
              <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className="input-field" placeholder="Re-enter password" required />
            </div>
            <AnimatedButton
              type="submit"
              loading={loading}
              loadingText="Creating account..."
              icon={<UserPlus className="w-4 h-4" />}
              className="w-full"
            >
              Create Account
            </AnimatedButton>
          </form>

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
            Already have an account?{' '}
            <Link to="/login" className="text-warm-600 hover:text-warm-500 font-bold">Sign in</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
