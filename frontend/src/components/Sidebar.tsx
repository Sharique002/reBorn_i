// ═══════════════════════════════════════════════════════════
// reBorn_i — Sidebar Navigation (All 10 Modules)
// ═══════════════════════════════════════════════════════════

import { NavLink, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, FileUp, ShieldAlert, Radar, GitCompareArrows,
  Map, LogOut, UserCircle, Filter, Flower2, Compass, Brain,
  TrendingUp, Briefcase, ListChecks,
} from 'lucide-react';

const GROUPS = [
  {
    label: 'Core',
    links: [
      { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', color: '#F5A623' },
      { to: '/resume', icon: FileUp, label: 'Resume', color: '#0EA5E9' },
    ],
  },
  {
    label: 'Analytics',
    links: [
      { to: '/pipeline', icon: Filter, label: 'Hiring Pipeline', color: '#0EA5E9' },
      { to: '/analysis', icon: ShieldAlert, label: 'Rejection Risk', color: '#E84565' },
      { to: '/simulation', icon: GitCompareArrows, label: 'Skill Simulator', color: '#8B5CF6' },
    ],
  },
  {
    label: 'Growth',
    links: [
      { to: '/pivot', icon: Compass, label: 'Career Pivot', color: '#8B5CF6' },
      { to: '/interview', icon: Brain, label: 'Interview Prep', color: '#0EA5E9' },
      { to: '/tracker', icon: TrendingUp, label: 'Resume Tracker', color: '#F5A623' },
      { to: '/market', icon: Radar, label: 'Market Radar', color: '#5A9E5A' },
    ],
  },
  {
    label: 'Planning',
    links: [
      { to: '/applications', icon: Briefcase, label: 'Applications', color: '#E84565' },
      { to: '/action-plan', icon: ListChecks, label: 'Action Plan', color: '#8B5CF6' },
      { to: '/blueprint', icon: Map, label: 'Blueprint', color: '#F5A623' },
    ],
  },
];

const navItemVariants = {
  hidden: { x: -20, opacity: 0 },
  visible: (i: number) => ({
    x: 0, opacity: 1,
    transition: { delay: 0.05 + i * 0.04, duration: 0.35, ease: 'easeOut' as const },
  }),
};

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  let itemIndex = 0;

  return (
    <motion.aside
      initial={{ x: -240, opacity: 0 }}
      animate={{ x: 0, opacity: 1, transition: { duration: 0.45, ease: [0.4, 0, 0.2, 1] as const } }}
      className="fixed inset-y-0 left-0 flex flex-col z-30"
      style={{ width: 240, background: 'rgba(255,255,255,0.88)', backdropFilter: 'blur(20px)', borderRight: '1px solid var(--border)' }}
    >
      {/* Brand */}
      <div className="px-5 py-5" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-center gap-3">
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            className="w-9 h-9 rounded-2xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, rgba(245,166,35,0.15), rgba(232,69,101,0.1))' }}
          >
            <Flower2 className="w-4.5 h-4.5 text-warm-500" />
          </motion.div>
          <div>
            <span className="font-display text-lg font-bold gradient-text-warm">reBorn_i</span>
            <p className="text-[10px] tracking-widest uppercase text-dusk font-semibold -mt-0.5">Career Growth</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-3 overflow-y-auto space-y-4">
        {GROUPS.map((group) => (
          <div key={group.label}>
            <p className="text-[10px] font-black uppercase tracking-widest text-muted px-2 mb-1.5">{group.label}</p>
            <div className="space-y-0.5">
              {group.links.map(({ to, icon: Icon, label, color }) => {
                const idx = itemIndex++;
                return (
                  <motion.div key={to} custom={idx} variants={navItemVariants} initial="hidden" animate="visible">
                    <NavLink
                      to={to}
                      end={to === '/'}
                      className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-semibold transition-all duration-200"
                      style={({ isActive }: { isActive: boolean }) => ({
                        background: isActive ? `${color}12` : 'transparent',
                        color: isActive ? color : 'var(--text-secondary)',
                        boxShadow: isActive ? `0 2px 10px ${color}12` : 'none',
                      })}
                    >
                      {({ isActive }: { isActive: boolean }) => (
                        <>
                          <div className="w-7 h-7 rounded-lg flex items-center justify-center transition-all"
                            style={{ background: isActive ? `${color}18` : 'transparent' }}>
                            <Icon className="w-3.5 h-3.5" />
                          </div>
                          <span className="flex-1 text-sm">{label}</span>
                          {isActive && (
                            <motion.div layoutId="nav-indicator"
                              className="w-1.5 h-1.5 rounded-full"
                              style={{ background: color }}
                              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                            />
                          )}
                        </>
                      )}
                    </NavLink>
                  </motion.div>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* User footer */}
      <div className="px-3 py-3" style={{ borderTop: '1px solid var(--border)' }}>
        <NavLink to="/profile"
          className="flex items-center gap-3 px-3 mb-2 rounded-xl py-2 transition-all hover:bg-warm-50"
          style={({ isActive }: { isActive: boolean }) => ({
            background: isActive ? 'rgba(245,166,35,0.08)' : 'transparent',
          })}>
          <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, rgba(245,166,35,0.12), rgba(139,92,246,0.08))' }}>
            <UserCircle className="w-4 h-4 text-warm-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold truncate text-bark">{user?.full_name || user?.email}</p>
            <p className="text-[10px] truncate text-muted">{user?.email}</p>
          </div>
        </NavLink>
        <button onClick={handleLogout}
          className="flex items-center gap-2 px-3 py-2 w-full text-sm font-semibold rounded-xl transition-all text-dusk hover:text-rose-500 hover:bg-rose-50">
          <LogOut className="w-4 h-4" />Sign out
        </button>
      </div>
    </motion.aside>
  );
}
