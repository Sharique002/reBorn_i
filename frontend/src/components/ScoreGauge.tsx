// ═══════════════════════════════════════════════════════════
// reBorn_i — Score Gauge (Warm Storybook Theme)
// ═══════════════════════════════════════════════════════════

interface Props {
  score: number;        // 0.0 - 1.0
  size?: number;        // px
  label?: string;
  colorMode?: 'risk' | 'success';
}

export default function ScoreGauge({ score, size = 160, label, colorMode = 'risk' }: Props) {
  const pct = Math.round(score * 100);
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - score * circumference;

  const getStroke = (): string => {
    if (colorMode === 'success') {
      if (pct >= 70) return '#5A9E5A';
      if (pct >= 40) return '#F5A623';
      return '#E84565';
    }
    // risk mode
    if (pct >= 70) return '#E84565';
    if (pct >= 40) return '#F5A623';
    return '#5A9E5A';
  };

  const getTrackStroke = (): string => {
    if (colorMode === 'success') {
      if (pct >= 70) return 'rgba(90, 158, 90, 0.12)';
      if (pct >= 40) return 'rgba(245, 166, 35, 0.12)';
      return 'rgba(232, 69, 101, 0.12)';
    }
    if (pct >= 70) return 'rgba(232, 69, 101, 0.12)';
    if (pct >= 40) return 'rgba(245, 166, 35, 0.12)';
    return 'rgba(90, 158, 90, 0.12)';
  };

  const arcColor = getStroke();

  return (
    <div className="flex flex-col items-center gap-2">
      <svg width={size} height={size} viewBox="0 0 100 100" className="-rotate-90">
        <defs>
          <filter id="gauge-shadow">
            <feDropShadow dx="0" dy="0" stdDeviation="2" floodColor={arcColor} floodOpacity="0.3" />
          </filter>
        </defs>
        {/* Background track */}
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          strokeWidth="8"
          stroke={getTrackStroke()}
        />
        {/* Score arc */}
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          strokeWidth="8"
          strokeLinecap="round"
          className="gauge-animate"
          filter="url(#gauge-shadow)"
          style={{
            stroke: arcColor,
            strokeDasharray: circumference,
            strokeDashoffset: offset,
          }}
        />
        {/* Center text */}
        <text
          x="50"
          y="50"
          textAnchor="middle"
          dominantBaseline="central"
          className="font-bold"
          style={{
            transform: 'rotate(90deg)',
            transformOrigin: 'center',
            fill: '#2D2A32',
            fontSize: '1.5rem',
            fontFamily: 'Quicksand, sans-serif',
          }}
        >
          {pct}%
        </text>
      </svg>
      {label && (
        <span className="text-sm font-semibold text-dusk">
          {label}
        </span>
      )}
    </div>
  );
}
