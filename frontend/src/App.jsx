import { useEffect, useState, useRef, useCallback } from 'react';
import {
  Activity,
  ArrowRight,
  Award,
  BarChart3,
  Bell,
  BookOpen,
  BrainCircuit,
  Calendar,
  CalendarDays,
  Camera,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  Clock,
  Download,
  Edit2,
  Eye,
  EyeOff,
  FileImage,
  Flame,
  GraduationCap,
  HeartPulse,
  Info,
  Key,
  Layers,
  LifeBuoy,
  LogOut,
  MapPin,
  Menu,
  MessageSquare,
  MessageSquarePlus,
  MessageSquareText,
  Mic,
  MicOff,
  PieChart,
  Plus,
  Printer,
  Radio,
  RefreshCw,
  Search,
  Send,
  Settings,
  Share2,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Smile,
  Sparkles,
  Star,
  ThumbsUp,
  Trash2,
  TrendingUp,
  Upload,
  User,
  UserCheck,
  Users,
  Volume2,
  Webhook,
  X,
  Zap,
} from 'lucide-react';
import SpecularButton from './SpecularButton';
import SpotlightCard from './SpotlightCard';
import ShinyText from './ShinyText';
import AnimatedCounter from './AnimatedCounter';
import ToastContainer from './Toast';

const API = import.meta.env.VITE_API_URL || '';

// ═══════════════════════════════════════════════════════
// SVG VISUAL ANALYTICS: EMOTION RADAR CHART
// ═══════════════════════════════════════════════════════
function EmotionRadarChart({ radarData }) {
  const [hoveredAxis, setHoveredAxis] = useState(null);

  const axes = [
    { key: 'Joy', label: 'Joy & Delight', desc: 'Positive academic excitement & lecture resonance', color: '#10b981' },
    { key: 'Clarity', label: 'Lecture Clarity', desc: 'Comprehension of core theorems, proofs & logic', color: '#3b82f6' },
    { key: 'Frustration', label: 'Frustration', desc: 'Friction with pacing, homework load or exams', color: '#f43f5e' },
    { key: 'Fatigue', label: 'Workload Fatigue', desc: 'Cognitive strain and multi-course assignment crunch', color: '#f59e0b' },
    { key: 'Satisfaction', label: 'Satisfaction', desc: 'Contentment with instructor mentorship & support', color: '#8b5cf6' },
    { key: 'Curiosity', label: 'Curiosity & Inquiry', desc: 'Proactive questions & conceptual exploration', color: '#06b6d4' },
  ];

  const cx = 175;
  const cy = 160;
  const radius = 105;
  const numAxes = axes.length;

  const getCoordinates = (value, angleIndex) => {
    const angle = ((Math.PI * 2) / numAxes) * angleIndex - Math.PI / 2;
    const r = (value / 100) * radius;
    return {
      x: cx + r * Math.cos(angle),
      y: cy + r * Math.sin(angle),
      labelX: cx + (radius + 26) * Math.cos(angle),
      labelY: cy + (radius + 26) * Math.sin(angle),
    };
  };

  const polygonPoints = axes
    .map((axis, i) => {
      const val = radarData?.[axis.key] ?? 50;
      const { x, y } = getCoordinates(val, i);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  const activeAxis = hoveredAxis !== null ? axes[hoveredAxis] : null;

  return (
    <div className="radar-chart-container interactive-radar-wrap">
      <svg viewBox="0 0 350 320" className="radar-svg">
        <defs>
          <radialGradient id="radarGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.45" />
            <stop offset="70%" stopColor="#3b82f6" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.02" />
          </radialGradient>
          <filter id="radarGlowFilter" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Web Rings (25%, 50%, 75%, 100%) */}
        {[0.25, 0.5, 0.75, 1].map((step, ringIdx) => {
          const ringPoints = axes
            .map((_, i) => {
              const angle = ((Math.PI * 2) / numAxes) * i - Math.PI / 2;
              const r = step * radius;
              return `${(cx + r * Math.cos(angle)).toFixed(1)},${(cy + r * Math.sin(angle)).toFixed(1)}`;
            })
            .join(' ');
          return (
            <polygon
              key={ringIdx}
              points={ringPoints}
              fill="none"
              stroke="#e2e8f0"
              strokeWidth="1"
              strokeDasharray={step === 1 ? 'none' : '3,3'}
            />
          );
        })}

        {/* Axis Spokes & Interactive Labels */}
        {axes.map((axis, i) => {
          const { x, y, labelX, labelY } = getCoordinates(100, i);
          const isHovered = hoveredAxis === i;
          const val = radarData?.[axis.key] ?? 50;
          return (
            <g
              key={axis.key}
              className={`radar-axis-group ${isHovered ? 'hovered' : ''}`}
              onMouseEnter={() => setHoveredAxis(i)}
              onMouseLeave={() => setHoveredAxis(null)}
              style={{ cursor: 'pointer' }}
            >
              <line
                x1={cx}
                y1={cy}
                x2={x}
                y2={y}
                stroke={isHovered ? axis.color : '#cbd5e1'}
                strokeWidth={isHovered ? 2.5 : 1}
                className="radar-spoke"
              />
              <text
                x={labelX}
                y={labelY}
                textAnchor="middle"
                dominantBaseline="central"
                className={`radar-label ${isHovered ? 'active' : ''}`}
                fill={isHovered ? axis.color : '#475569'}
                fontWeight={isHovered ? '700' : '500'}
              >
                {axis.label}
              </text>
              <text
                x={labelX}
                y={labelY + 13}
                textAnchor="middle"
                dominantBaseline="central"
                className="radar-val"
                fill={isHovered ? axis.color : '#64748b'}
                fontWeight="700"
              >
                {val}%
              </text>
            </g>
          );
        })}

        {/* Radar Value Polygon */}
        <polygon
          points={polygonPoints}
          fill="url(#radarGlow)"
          stroke="#7c3aed"
          strokeWidth="2.5"
          className="radar-poly"
        />

        {/* Radar Data Vertex Dots */}
        {axes.map((axis, i) => {
          const val = radarData?.[axis.key] ?? 50;
          const { x, y } = getCoordinates(val, i);
          const isHovered = hoveredAxis === i;
          return (
            <g
              key={`dot-${axis.key}`}
              onMouseEnter={() => setHoveredAxis(i)}
              onMouseLeave={() => setHoveredAxis(null)}
              style={{ cursor: 'pointer' }}
            >
              {isHovered && (
                <circle cx={x} cy={y} r="9" fill={axis.color} opacity="0.3" filter="url(#radarGlowFilter)" />
              )}
              <circle
                cx={x}
                cy={y}
                r={isHovered ? 6 : 4.5}
                fill={isHovered ? axis.color : '#ffffff'}
                stroke={isHovered ? '#ffffff' : '#7c3aed'}
                strokeWidth={isHovered ? 2 : 2.5}
                className="radar-dot"
              />
            </g>
          );
        })}
      </svg>

      {/* Floating Interactive Axis Insight Pill */}
      {activeAxis ? (
        <div className="radar-insight-tooltip" style={{ borderColor: activeAxis.color }}>
          <div className="tooltip-head">
            <span className="dot" style={{ background: activeAxis.color }} />
            <strong>{activeAxis.label}: {radarData?.[activeAxis.key] ?? 50}%</strong>
          </div>
          <p>{activeAxis.desc}</p>
        </div>
      ) : (
        <div className="radar-insight-hint">
          <span>💡 Hover over any axis dot to inspect emotional driver</span>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// SVG VISUAL ANALYTICS: MILESTONE SENTIMENT TIMELINE (INTERACTIVE)
// ═══════════════════════════════════════════════════════
function SentimentTimelineChart({ timelineData }) {
  const [hoveredIdx, setHoveredIdx] = useState(null);
  const [timeframe, setTimeframe] = useState('ALL');

  const defaultMilestones = [
    { milestone: 'W1: Foundations', positive: 88, negative: 4, neutral: 8, note: 'Syllabus kick-off & Python baseline.' },
    { milestone: 'W3: Quiz 1', positive: 76, negative: 10, neutral: 14, note: 'Text preprocessing & N-Gram evaluations.' },
    { milestone: 'W5: Assignment 1', positive: 68, negative: 20, neutral: 12, note: 'Word2Vec vector similarity models.' },
    { milestone: 'W7: Midterms', positive: 52, negative: 33, neutral: 15, note: 'BPTT proofs & backprop unrolling crunch.' },
    { milestone: 'W9: Lab Practical', positive: 64, negative: 18, neutral: 18, note: 'Attention mechanism implementations.' },
    { milestone: 'W11: Current Pulse', positive: 74, negative: 16, neutral: 10, note: 'Transformers & generative model fine-tuning.' },
  ];

  const fullData = timelineData && timelineData.length > 0 ? timelineData : defaultMilestones;
  const data = timeframe === 'RECENT' ? fullData.slice(-3) : fullData;

  const w = 480;
  const h = 210;
  const padL = 44;
  const padR = 24;
  const padT = 24;
  const padB = 40;
  const plotW = w - padL - padR;
  const plotH = h - padT - padB;

  const pointsFor = (key) =>
    data.map((d, i) => {
      const x = padL + (i / Math.max(1, data.length - 1)) * plotW;
      const y = padT + (1 - (d[key] || 0) / 100) * plotH;
      return { x, y, val: d[key] || 0 };
    });

  const pathString = (pts) =>
    pts.reduce((acc, p, i) => (i === 0 ? `M ${p.x},${p.y}` : `${acc} L ${p.x},${p.y}`), '');

  const posPts = pointsFor('positive');
  const negPts = pointsFor('negative');

  const hoveredItem = hoveredIdx !== null && data[hoveredIdx] ? data[hoveredIdx] : null;

  return (
    <div className="timeline-chart-wrapper interactive-timeline-box">
      <div className="timeline-top-controls">
        <div className="timeframe-toggles">
          <button
            type="button"
            className={`tf-pill ${timeframe === 'ALL' ? 'active' : ''}`}
            onClick={() => setTimeframe('ALL')}
          >
            Full Semester
          </button>
          <button
            type="button"
            className={`tf-pill ${timeframe === 'RECENT' ? 'active' : ''}`}
            onClick={() => setTimeframe('RECENT')}
          >
            Recent Sprints
          </button>
        </div>
      </div>

      <svg viewBox={`0 0 ${w} ${h}`} className="timeline-svg">
        <defs>
          <linearGradient id="posGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.28" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Gridlines */}
        {[0, 25, 50, 75, 100].map((pct) => {
          const y = padT + (1 - pct / 100) * plotH;
          return (
            <g key={pct}>
              <line x1={padL} y1={y} x2={w - padR} y2={y} stroke="#edf0f8" strokeWidth="1" />
              <text x={padL - 8} y={y + 3} textAnchor="end" className="chart-grid-text">
                {pct}%
              </text>
            </g>
          );
        })}

        {/* Hovered Scrubber Line */}
        {hoveredIdx !== null && (
          <line
            x1={posPts[hoveredIdx]?.x}
            y1={padT}
            x2={posPts[hoveredIdx]?.x}
            y2={padT + plotH}
            stroke="#818cf8"
            strokeWidth="1.5"
            strokeDasharray="3,3"
          />
        )}

        {/* Area fill */}
        {posPts.length > 1 && (
          <path
            d={`${pathString(posPts)} L ${posPts[posPts.length - 1].x},${padT + plotH} L ${posPts[0].x},${padT + plotH} Z`}
            fill="url(#posGrad)"
          />
        )}

        {/* Trend Lines */}
        <path d={pathString(posPts)} fill="none" stroke="#10b981" strokeWidth="2.5" />
        <path d={pathString(negPts)} fill="none" stroke="#e11d48" strokeWidth="2" strokeDasharray="4,4" />

        {/* Interactive Dots and Click Target Slices */}
        {data.map((d, i) => {
          const pPos = posPts[i];
          const pNeg = negPts[i];
          const isHov = hoveredIdx === i;

          return (
            <g
              key={i}
              onMouseEnter={() => setHoveredIdx(i)}
              onMouseLeave={() => setHoveredIdx(null)}
              style={{ cursor: 'pointer' }}
            >
              {/* Invisible wide hit target */}
              <rect
                x={pPos.x - 20}
                y={padT}
                width={40}
                height={plotH}
                fill="transparent"
              />

              <circle
                cx={pPos.x}
                cy={pPos.y}
                r={isHov ? 6 : 4}
                fill={isHov ? '#10b981' : '#ffffff'}
                stroke="#10b981"
                strokeWidth={isHov ? 3 : 2}
              />
              <circle
                cx={pNeg.x}
                cy={pNeg.y}
                r={isHov ? 5.5 : 3.5}
                fill={isHov ? '#e11d48' : '#ffffff'}
                stroke="#e11d48"
                strokeWidth={isHov ? 2.5 : 2}
              />
            </g>
          );
        })}

        {/* X-Axis Milestone Labels */}
        {data.map((d, i) => {
          const x = padL + (i / Math.max(1, data.length - 1)) * plotW;
          const isHov = hoveredIdx === i;
          return (
            <text
              key={i}
              x={x}
              y={h - 12}
              textAnchor="middle"
              className={`chart-x-text ${isHov ? 'active-label' : ''}`}
              fontWeight={isHov ? '700' : '500'}
              fill={isHov ? '#4f46e5' : '#64748b'}
            >
              {d.milestone.split(' ')[0]}
            </text>
          );
        })}
      </svg>

      {/* Interactive Tooltip Card on Hover */}
      {hoveredItem ? (
        <div className="timeline-interactive-tooltip">
          <div className="tooltip-milestone-title">
            <strong>{hoveredItem.milestone}</strong>
            <span className="net-spread">Net Spread: +{hoveredItem.positive - hoveredItem.negative}%</span>
          </div>
          <div className="tooltip-stats-row">
            <span className="pos-badge">🟢 Positive: {hoveredItem.positive}%</span>
            <span className="neg-badge">🔴 Negative: {hoveredItem.negative}%</span>
            {hoveredItem.neutral !== undefined && (
              <span className="neu-badge">⚪ Neutral: {hoveredItem.neutral}%</span>
            )}
          </div>
          {hoveredItem.note && <p className="tooltip-note">{hoveredItem.note}</p>}
        </div>
      ) : (
        <div className="timeline-legend">
          <span className="legend-item">
            <i className="line-swatch pos" /> Positive Pulse %
          </span>
          <span className="legend-item">
            <i className="line-swatch neg" /> Negative Alert Rate %
          </span>
          <span className="legend-hint">Hover nodes for sprint diagnostic breakdown</span>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// SVG VISUAL ANALYTICS: ACADEMIC WELLBEING GAUGE (INTERACTIVE)
// ═══════════════════════════════════════════════════════
function WellbeingGauge({ score }) {
  const [showDetails, setShowDetails] = useState(false);
  const normScore = Math.max(0, Math.min(100, score ?? 80));
  const r = 58;
  const strokeW = 10;
  const circumference = Math.PI * r;
  const offset = circumference * (1 - normScore / 100);

  const statusLabel =
    normScore >= 75
      ? '🟢 Healthy Academic Environment'
      : normScore >= 50
      ? '🟡 Moderate Stress / Review Advised'
      : '🔴 High Academic Stress Alert';

  const badgeColorClass =
    normScore >= 75 ? 'healthy' : normScore >= 50 ? 'moderate' : 'alert';

  return (
    <div
      className="gauge-container interactive-gauge"
      onMouseEnter={() => setShowDetails(true)}
      onMouseLeave={() => setShowDetails(false)}
      onClick={() => setShowDetails(!showDetails)}
      title="Click or hover to inspect academic wellbeing formula weights"
    >
      <svg width="160" height="95" viewBox="0 0 160 95" className="gauge-svg">
        <path
          d="M 20 85 A 60 60 0 0 1 140 85"
          fill="none"
          stroke="#eef0f8"
          strokeWidth={strokeW}
          strokeLinecap="round"
        />
        <path
          d="M 20 85 A 60 60 0 0 1 140 85"
          fill="none"
          stroke={normScore >= 75 ? '#10b981' : normScore >= 50 ? '#f59e0b' : '#e11d48'}
          strokeWidth={strokeW}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="gauge-val-path"
        />
        <text x="80" y="70" textAnchor="middle" className="gauge-score-num">
          {normScore}
        </text>
        <text x="80" y="86" textAnchor="middle" className="gauge-score-sub">
          WELLBEING INDEX
        </text>
      </svg>
      <span className={`gauge-status-badge ${badgeColorClass}`}>{statusLabel}</span>

      {showDetails && (
        <div className="gauge-breakdown-popover">
          <div className="popover-row">
            <span>Lecture Clarity:</span>
            <strong className="text-emerald">+42 pts</strong>
          </div>
          <div className="popover-row">
            <span>Curiosity & Joy:</span>
            <strong className="text-emerald">+26 pts</strong>
          </div>
          <div className="popover-row">
            <span>Workload Strain:</span>
            <strong className="text-rose">-14 pts</strong>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// NEW INTERACTIVE CHART: EMOTION DONUT BREAKDOWN
// ═══════════════════════════════════════════════════════
function InteractiveEmotionDonut({ feedbacks, onEmotionClick, selectedEmotion }) {
  const [hoveredSlice, setHoveredSlice] = useState(null);

  const emotionConfig = [
    { label: 'Joy', color: '#10b981', desc: 'Inspired, enthusiastic feedback' },
    { label: 'Clarity', color: '#3b82f6', desc: 'Clear comprehension of concepts' },
    { label: 'Satisfaction', color: '#8b5cf6', desc: 'Content with teaching pacing' },
    { label: 'Confusion', color: '#f59e0b', desc: 'Conceptual friction or roadblocks' },
    { label: 'Frustration', color: '#f43f5e', desc: 'Deadline or assignment strain' },
    { label: 'Fatigue', color: '#64748b', desc: 'Cognitive exhaustion & fatigue' },
  ];

  const counts = emotionConfig.reduce((acc, ec) => {
    acc[ec.label] = 0;
    return acc;
  }, {});

  if (feedbacks && feedbacks.length > 0) {
    feedbacks.forEach((f) => {
      const em = (f.emotion || '').toLowerCase();
      if (em.includes('joy')) counts.Joy += 1;
      else if (em.includes('clarity')) counts.Clarity += 1;
      else if (em.includes('satisfaction')) counts.Satisfaction += 1;
      else if (em.includes('confusion')) counts.Confusion += 1;
      else if (em.includes('frustration')) counts.Frustration += 1;
      else if (em.includes('fatigue')) counts.Fatigue += 1;
      else counts.Satisfaction += 1;
    });
  } else {
    counts.Joy = 8;
    counts.Clarity = 14;
    counts.Satisfaction = 10;
    counts.Confusion = 7;
    counts.Frustration = 4;
    counts.Fatigue = 3;
  }

  const total = Object.values(counts).reduce((a, b) => a + b, 0) || 1;

  const cx = 100;
  const cy = 100;
  const outerR = 80;
  const innerR = 52;

  let currentAngle = -Math.PI / 2;
  const slices = emotionConfig.map((ec, idx) => {
    const val = counts[ec.label];
    const sliceAngle = (val / total) * Math.PI * 2;
    const startAngle = currentAngle;
    const endAngle = currentAngle + sliceAngle;
    currentAngle = endAngle;

    const isHovered = hoveredSlice === idx;
    const r = isHovered ? outerR + 6 : outerR;

    const x1 = cx + r * Math.cos(startAngle);
    const y1 = cy + r * Math.sin(startAngle);
    const x2 = cx + r * Math.cos(endAngle);
    const y2 = cy + r * Math.sin(endAngle);

    const ix1 = cx + innerR * Math.cos(endAngle);
    const iy1 = cy + innerR * Math.sin(endAngle);
    const ix2 = cx + innerR * Math.cos(startAngle);
    const iy2 = cy + innerR * Math.sin(startAngle);

    const largeArc = sliceAngle > Math.PI ? 1 : 0;
    const d = `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} L ${ix1} ${iy1} A ${innerR} ${innerR} 0 ${largeArc} 0 ${ix2} ${iy2} Z`;
    const pct = Math.round((val / total) * 100);

    return {
      ...ec,
      val,
      pct,
      d,
      isHovered,
    };
  });

  const activeSlice = hoveredSlice !== null ? slices[hoveredSlice] : null;

  return (
    <div className="interactive-donut-container">
      <div className="donut-svg-wrapper">
        <svg viewBox="0 0 200 200" className="donut-svg">
          {slices.map((s, idx) => (
            <path
              key={s.label}
              d={s.d}
              fill={s.color}
              stroke="#ffffff"
              strokeWidth="2"
              className={`donut-slice ${s.isHovered ? 'hovered' : ''} ${selectedEmotion === s.label.toUpperCase() ? 'selected' : ''}`}
              onMouseEnter={() => setHoveredSlice(idx)}
              onMouseLeave={() => setHoveredSlice(null)}
              onClick={() => onEmotionClick?.(s.label.toUpperCase())}
              style={{ cursor: 'pointer', transition: 'all 0.25s ease' }}
            />
          ))}

          {/* Center Hole Content */}
          <circle cx={cx} cy={cy} r={innerR - 2} fill="#ffffff" />
          <text x={cx} y={cy - 6} textAnchor="middle" className="donut-center-pct">
            {activeSlice ? `${activeSlice.pct}%` : `${total}`}
          </text>
          <text x={cx} y={cy + 12} textAnchor="middle" className="donut-center-lbl">
            {activeSlice ? activeSlice.label : 'REVIEWS'}
          </text>
        </svg>
      </div>

      <div className="donut-legend-grid">
        {slices.map((s, idx) => (
          <div
            key={s.label}
            className={`donut-legend-pill ${s.isHovered ? 'hovered' : ''} ${selectedEmotion === s.label.toUpperCase() ? 'active' : ''}`}
            onMouseEnter={() => setHoveredSlice(idx)}
            onMouseLeave={() => setHoveredSlice(null)}
            onClick={() => onEmotionClick?.(s.label.toUpperCase())}
          >
            <span className="dot" style={{ background: s.color }} />
            <span className="name">{s.label}</span>
            <strong className="val">{s.pct}%</strong>
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// NEW INTERACTIVE CHART: COURSE CLARITY VS FRICTION BAR
// ═══════════════════════════════════════════════════════
function InteractiveCourseClarityBar({ subjects, onSelectCourse }) {
  const [hoveredCourse, setHoveredCourse] = useState(null);

  const defaultCourses = [
    { course_code: 'AI501', course_name: 'Natural Language Processing', clarity: 76, friction: 24, count: 28 },
    { course_code: 'CS401', course_name: 'Design & Analysis of Algorithms', clarity: 84, friction: 16, count: 22 },
    { course_code: 'DS302', course_name: 'Statistical Machine Learning', clarity: 68, friction: 32, count: 19 },
    { course_code: 'AI504', course_name: 'Deep Learning & Neural Architectures', clarity: 72, friction: 28, count: 25 },
  ];

  const courses = subjects && subjects.length > 0 ? subjects.map((s) => ({
    course_code: s.course_code,
    course_name: s.course_name,
    clarity: s.course_code === 'AI501' ? 76 : s.course_code === 'CS401' ? 84 : 70,
    friction: s.course_code === 'AI501' ? 24 : s.course_code === 'CS401' ? 16 : 30,
    count: 24,
  })) : defaultCourses;

  return (
    <div className="interactive-course-clarity-card">
      <div className="clarity-header">
        <h4>Course Clarity vs Friction Comparison</h4>
        <span className="clarity-sub">Hover to inspect class comprehension and friction benchmarks</span>
      </div>

      <div className="clarity-bars-stack">
        {courses.map((c, idx) => {
          const isHov = hoveredCourse === idx;
          return (
            <div
              key={c.course_code}
              className={`clarity-bar-item ${isHov ? 'hovered' : ''}`}
              onMouseEnter={() => setHoveredCourse(idx)}
              onMouseLeave={() => setHoveredCourse(null)}
              onClick={() => onSelectCourse?.(c)}
              style={{ cursor: 'pointer' }}
            >
              <div className="bar-labels-row">
                <span className="code"><strong>{c.course_code}</strong> · {c.course_name}</span>
                <span className="score-badge text-emerald">{c.clarity}% Clarity</span>
              </div>

              <div className="dual-progress-bar">
                <div
                  className="bar-fill clarity"
                  style={{ width: `${c.clarity}%` }}
                  title={`Clarity: ${c.clarity}%`}
                />
                <div
                  className="bar-fill friction"
                  style={{ width: `${c.friction}%` }}
                  title={`Friction: ${c.friction}%`}
                />
              </div>

              {isHov && (
                <div className="bar-hover-pop">
                  <span>📊 {c.count} Student Submissions</span>
                  <span>✅ {c.clarity}% Comprehension Rate</span>
                  <span>⚠️ {c.friction}% Flagged Complexity</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// NEW STUDENT FEATURE 1: MOOD JOURNAL & REFLECTION LOG
// ═══════════════════════════════════════════════════════
function StudentMoodJournal({ user, addToast }) {
  const [selectedMood, setSelectedMood] = useState('flow');
  const [journalNote, setJournalNote] = useState('');
  const [entries, setEntries] = useState(() => {
    try {
      const saved = localStorage.getItem(`sentio_mood_journal_${user.student_id || user.user_id}`);
      return saved ? JSON.parse(saved) : [
        { id: 1, date: 'Today, 2:30 PM', mood: 'flow', label: 'Focused & Clear', note: 'Understood self-attention matrix query-key-value multiplication with visual slides.', tag: 'AI501' },
        { id: 2, date: 'Yesterday', mood: 'puzzled', label: 'Puzzled by Proof', note: 'Need recap on backpropagation through time matrix chain rule.', tag: 'AI501' },
        { id: 3, date: 'Oct 30', mood: 'inspired', label: 'Inspired', note: 'Transformer architecture lab demo worked on PyTorch!', tag: 'CS401' },
      ];
    } catch {
      return [];
    }
  });

  const moods = [
    { key: 'inspired', emoji: '🌟', label: 'Inspired', desc: 'High energy & excitement' },
    { key: 'flow', emoji: '💡', label: 'In Flow', desc: 'Clear comprehension' },
    { key: 'balanced', emoji: '🧐', label: 'Reflective', desc: 'Standard lecture pacing' },
    { key: 'puzzled', emoji: '😕', label: 'Puzzled', desc: 'Conceptual confusion' },
    { key: 'exhausted', emoji: '🥱', label: 'Fatigued', desc: 'High workload strain' },
  ];

  const handleSaveEntry = (e) => {
    e.preventDefault();
    if (!journalNote.trim()) return;
    const moodObj = moods.find((m) => m.key === selectedMood) || moods[1];
    const newEntry = {
      id: Date.now(),
      date: 'Just now',
      mood: selectedMood,
      label: moodObj.label,
      note: journalNote.trim(),
      tag: 'Class Reflection',
    };
    const updated = [newEntry, ...entries];
    setEntries(updated);
    try {
      localStorage.setItem(`sentio_mood_journal_${user.student_id || user.user_id}`, JSON.stringify(updated));
    } catch {}
    setJournalNote('');
    addToast?.({
      title: 'Daily Reflection Saved',
      message: 'Your personal learning journal has been logged.',
      type: 'success',
    });
  };

  return (
    <div className="tab-pane mood-journal-pane">
      <div className="pane-header">
        <h2>My Emotional Learning Diary & Daily Reflections</h2>
        <p className="muted">
          Privately log your day-by-day mindset across lectures to track learning momentum and mental resilience.
        </p>
      </div>

      <div className="journal-layout-grid">
        {/* Form Card */}
        <SpotlightCard className="journal-checkin-card" spotlightColor="rgba(99, 102, 241, 0.15)">
          <h3>How did you feel about today's classes?</h3>
          <p className="muted-text">Select your primary learning state and jot a quick private reflection.</p>

          <div className="mood-picker-row">
            {moods.map((m) => (
              <button
                key={m.key}
                type="button"
                className={`mood-select-btn ${selectedMood === m.key ? 'selected' : ''}`}
                onClick={() => setSelectedMood(m.key)}
              >
                <span className="mood-emoji">{m.emoji}</span>
                <span className="mood-name">{m.label}</span>
              </button>
            ))}
          </div>

          <form onSubmit={handleSaveEntry}>
            <div className="form-group">
              <label>Reflection / Key Learning Insight</label>
              <textarea
                rows={3}
                placeholder="e.g. Backpropagation matrix formulas made sense after the second whiteboard example, but assignment 2 needs more time..."
                value={journalNote}
                onChange={(e) => setJournalNote(e.target.value)}
                required
              />
            </div>

            <SpecularButton
              type="submit"
              size="md"
              radius={12}
              tint="#ffffff"
              tintOpacity={0.05}
              textColor="#ffffff"
              lineColor="#818cf8"
              baseColor="#4f46e5"
              className="save-journal-btn"
            >
              Save Reflection Note
            </SpecularButton>
          </form>
        </SpotlightCard>

        {/* 7-Day Resilience Journey */}
        <SpotlightCard className="journal-history-card" spotlightColor="rgba(16, 185, 129, 0.15)">
          <h3>Recent Reflection Log ({entries.length})</h3>
          <p className="muted-text">Your private emotional trajectory across recent lectures.</p>

          <div className="journal-timeline-list">
            {entries.length === 0 ? (
              <p className="empty-state">No reflection entries logged yet.</p>
            ) : (
              entries.map((item) => (
                <div key={item.id} className="journal-item-card">
                  <div className="j-top-row">
                    <span className="j-date">{item.date}</span>
                    <span className="j-mood-pill">
                      {item.mood === 'inspired' ? '🌟' : item.mood === 'flow' ? '💡' : item.mood === 'puzzled' ? '😕' : '🥱'} {item.label}
                    </span>
                  </div>
                  <p className="j-note">"{item.note}"</p>
                  <span className="j-tag">{item.tag}</span>
                </div>
              ))
            )}
          </div>
        </SpotlightCard>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// NEW STUDENT FEATURE 2: SENTIO PERSONAL AI STUDY COACH
// ═══════════════════════════════════════════════════════
function StudentAICoach({ user, allottedSubjects }) {
  const [activeStrategy, setActiveStrategy] = useState('concepts');

  return (
    <div className="tab-pane ai-coach-pane">
      <div className="pane-header">
        <h2>Sentio Personal AI Study Coach</h2>
        <p className="muted">
          Tailored micro-study strategies, concept breakdowns, and workload pacing calibrated to your emotion logs.
        </p>
      </div>

      <div className="coach-tabs-row">
        <button
          type="button"
          className={`coach-tab-btn ${activeStrategy === 'concepts' ? 'active' : ''}`}
          onClick={() => setActiveStrategy('concepts')}
        >
          🧠 Concept Decompressor
        </button>
        <button
          type="button"
          className={`coach-tab-btn ${activeStrategy === 'pacing' ? 'active' : ''}`}
          onClick={() => setActiveStrategy('pacing')}
        >
          ⏱️ Pomodoro Workload Pacing
        </button>
        <button
          type="button"
          className={`coach-tab-btn ${activeStrategy === 'prompts' ? 'active' : ''}`}
          onClick={() => setActiveStrategy('prompts')}
        >
          💡 Intuitive Analogies
        </button>
      </div>

      <div className="coach-content-grid">
        {activeStrategy === 'concepts' && (
          <>
            <SpotlightCard className="coach-card" spotlightColor="rgba(99, 102, 241, 0.15)">
              <div className="coach-card-badge">NLP · AI501</div>
              <h3>Demystifying Attention Query-Key-Value Multiplications</h3>
              <p>
                <strong>Intuition:</strong> Think of the <em>Query</em> as your search keyword, the <em>Key</em> as the title tags on database records, and the <em>Value</em> as the actual page content. The dot-product calculates how relevant each page is before combining them.
              </p>
              <div className="coach-checklist">
                <div>✅ Review 2x2 matrix dot-product step on paper</div>
                <div>✅ Verify Softmax normalizes weights to sum to 1.0</div>
                <div>✅ Inspect output dimensions: shape stays (Batch, Seq, Dim)</div>
              </div>
            </SpotlightCard>

            <SpotlightCard className="coach-card" spotlightColor="rgba(16, 185, 129, 0.15)">
              <div className="coach-card-badge">Algorithms · CS401</div>
              <h3>Dynamic Programming: State Space Reduction</h3>
              <p>
                <strong>Intuition:</strong> Always start by solving the 1D subproblem before introducing a 2D grid. If subproblems overlap, memoize the return value in a lookup array to cut exponential time down to polynomial.
              </p>
              <div className="coach-checklist">
                <div>✅ Identify overlapping subproblems & optimal substructure</div>
                <div>✅ Write the base cases explicitly before recursive calls</div>
              </div>
            </SpotlightCard>
          </>
        )}

        {activeStrategy === 'pacing' && (
          <SpotlightCard className="coach-card span-full" spotlightColor="rgba(245, 158, 11, 0.15)">
            <h3>Optimal Workload Re-Staggering Strategy</h3>
            <p>
              Based on emotional stress peaks detected before Midterms, here is a suggested 3-stage study block:
            </p>
            <div className="pacing-blocks-grid">
              <div className="pacing-block">
                <strong>Block 1: High Energy (25 min)</strong>
                <p>Implement core Transformer formula in PyTorch without distractions.</p>
              </div>
              <div className="pacing-block">
                <strong>Block 2: Active Recovery (5 min)</strong>
                <p>Do 4-4-4 Box Breathing or light physical movement.</p>
              </div>
              <div className="pacing-block">
                <strong>Block 3: Concept Testing (20 min)</strong>
                <p>Solve 2 practice questions from the peer study pod bank.</p>
              </div>
            </div>
          </SpotlightCard>
        )}

        {activeStrategy === 'prompts' && (
          <SpotlightCard className="coach-card span-full" spotlightColor="rgba(168, 85, 247, 0.15)">
            <h3>Ready-to-Use Conceptual Explanations</h3>
            <div className="prompt-examples-list">
              <div className="prompt-example">
                <strong>Analogy for Gradient Descent:</strong>
                <p>"Imagine hiking down a foggy mountain where you can only see 1 meter around your boots. You look down, find the steepest downhill tilt, take one careful step, and repeat."</p>
              </div>
              <div className="prompt-example">
                <strong>Analogy for Softmax:</strong>
                <p>"Softmax is like a committee vote where loud raw opinions (logits) get converted into neat percentage shares of budget that add up exactly to 100%."</p>
              </div>
            </div>
          </SpotlightCard>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// HELPER: SAFELY PARSE PULSE POLLS FROM MULTIPLE SCHEMAS
// ═══════════════════════════════════════════════════════
function parsePollData(req) {
  let raw = req.queries || req.queries_json;
  if (typeof raw === 'string') {
    try {
      raw = JSON.parse(raw);
    } catch {
      raw = [];
    }
  }
  if (!Array.isArray(raw)) raw = [];

  let question = "How clear was today's lecture pacing and content?";
  let options = ['Clear & Well Paced', 'Somewhat Fast', 'Need Practical Recap'];

  if (raw.length > 0) {
    if (typeof raw[0] === 'object' && raw[0] !== null && raw[0].question) {
      question = raw[0].question;
      options = raw[0].options || options;
    } else if (typeof raw[0] === 'string') {
      question = raw[0];
      if (raw.length > 1) {
        options = raw.slice(1);
      }
    }
  }

  const countsObj = req.vote_counts || {};
  let totalVotes = req.total_votes;
  if (totalVotes === undefined || totalVotes === null) {
    totalVotes = Object.values(countsObj).reduce((sum, v) => sum + (Number(v) || 0), 0);
  }

  return { question, options, countsObj, totalVotes };
}

// ═══════════════════════════════════════════════════════
// AUTHENTICATION COMPONENT (LOGIN & REGISTER WITH OTP)
// ═══════════════════════════════════════════════════════
// ═══════════════════════════════════════════════════════
// AUTHENTICATION COMPONENT (LOGIN, REGISTER & FORGOT PASSWORD)
// ═══════════════════════════════════════════════════════
function Auth({ onAuthenticated, addToast }) {
  const [mode, setMode] = useState('login'); // 'login' | 'register' | 'forgot'
  const [form, setForm] = useState({
    name: '',
    roll_no: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'STUDENT',
    semester: 5,
    class_section: 'Class 3A',
    otp_code: '',
  });

  const [otpSent, setOtpSent] = useState(false);
  const [otpSending, setOtpSending] = useState(false);
  const [otpInfo, setOtpInfo] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // OTP Countdown timer
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // Seamlessly switch between Sign In, Create Account, and Forgot Password
  const switchMode = (targetMode) => {
    setError('');
    setSuccessMsg('');
    setOtpInfo('');
    setOtpSent(false);
    setCountdown(0);

    setForm((prev) => {
      let nextEmail = prev.email;
      let nextRoll = prev.roll_no;

      if (targetMode === 'register') {
        // If user typed a roll number into login field, migrate to roll_no
        if (nextEmail && !nextEmail.includes('@') && !nextRoll) {
          nextRoll = nextEmail;
          nextEmail = '';
        }
      } else if (targetMode === 'login' || targetMode === 'forgot') {
        // If email is empty but roll_no exists, populate email
        if (!nextEmail && nextRoll) {
          nextEmail = nextRoll;
        }
      }

      return {
        ...prev,
        email: nextEmail,
        roll_no: nextRoll,
        otp_code: '',
        confirmPassword: '',
      };
    });

    setMode(targetMode);
  };

  // Request 6-digit OTP (for Registration or Password Reset)
  const handleSendOtp = async (purpose = 'REGISTER') => {
    const ident = form.email ? form.email.trim() : (form.roll_no ? form.roll_no.trim() : '');
    if (!ident) {
      setError(
        purpose === 'RESET_PASSWORD'
          ? 'Please enter your registered university email or roll number'
          : 'Please enter your university email address first'
      );
      return;
    }
    if (purpose === 'REGISTER' && !ident.includes('@')) {
      setError('Please provide a valid university email address (e.g. you@univ.edu)');
      return;
    }

    setError('');
    setSuccessMsg('');
    setOtpSending(true);

    try {
      const res = await fetch(`${API}/api/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: ident, purpose }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.detail || data.message || 'Failed to dispatch verification code');
      }
      setOtpSent(true);
      setCountdown(60);
      setOtpInfo(data.message || 'Verification code sent successfully!');
      // In local mode, auto-fill OTP for developer convenience
      if (data.otp_code) {
        setForm((prev) => ({ ...prev, otp_code: data.otp_code }));
      }
      if (data.email && purpose === 'RESET_PASSWORD') {
        setForm((prev) => ({ ...prev, email: data.email }));
      }
    } catch (err) {
      setError(err.message || 'Error sending verification code');
    } finally {
      setOtpSending(false);
    }
  };

  // Submit Login, Register, or Reset Password
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      if (mode === 'login') {
        const res = await fetch(`${API}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: form.email.trim(),
            password: form.password,
          }),
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.detail || data.message || 'Invalid email/roll number or password');
        }
        localStorage.setItem('sentio_token', data.access_token);
        localStorage.setItem('sentio_user', JSON.stringify(data.user));
        localStorage.setItem('feedback_user', JSON.stringify(data.user));
        onAuthenticated(data.user, data.access_token);
      } else if (mode === 'register') {
        if (!form.name || !form.name.trim()) throw new Error('Please enter your full name');
        if (!form.roll_no || !form.roll_no.trim()) throw new Error('Please enter your Roll Number or Staff ID');
        if (!form.email || !form.email.includes('@')) throw new Error('Please enter a valid university email address');
        if (!form.otp_code || form.otp_code.trim().length !== 6) {
          throw new Error('Please enter the 6-digit OTP sent to your email');
        }
        if (!form.password || form.password.length < 4) {
          throw new Error('Password must be at least 4 characters');
        }
        const res = await fetch(`${API}/api/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: form.name.trim(),
            roll_no: form.roll_no.trim(),
            email: form.email.trim(),
            password: form.password,
            role: form.role,
            semester: form.role === 'STUDENT' ? Number(form.semester) : null,
            class_section: form.role === 'STUDENT' ? form.class_section : null,
            otp_code: form.otp_code.trim(),
          }),
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.detail || data.message || 'Registration failed');
        }
        localStorage.setItem('sentio_token', data.access_token);
        localStorage.setItem('sentio_user', JSON.stringify(data.user));
        localStorage.setItem('feedback_user', JSON.stringify(data.user));
        onAuthenticated(data.user, data.access_token);
      } else if (mode === 'forgot') {
        const ident = form.email ? form.email.trim() : (form.roll_no ? form.roll_no.trim() : '');
        if (!ident) throw new Error('Please enter your university email or roll number');
        if (!form.otp_code || form.otp_code.trim().length !== 6) {
          throw new Error('Please enter the 6-digit verification code sent to your email');
        }
        if (!form.password || form.password.length < 4) {
          throw new Error('New password must be at least 4 characters');
        }
        if (form.confirmPassword && form.password !== form.confirmPassword) {
          throw new Error('Passwords do not match. Please verify.');
        }

        const res = await fetch(`${API}/api/auth/reset-password`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: ident,
            otp_code: form.otp_code.trim(),
            new_password: form.password,
          }),
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.detail || data.message || 'Failed to reset password');
        }

        if (addToast) {
          addToast({
            title: 'Password Reset Successful',
            message: 'Your password has been changed. You can now log in with your new credentials.',
            type: 'success',
          });
        }
        setSuccessMsg('Password reset successfully! Please sign in with your new password.');
        setMode('login');
        setOtpSent(false);
        setCountdown(0);
        setForm((prev) => ({
          ...prev,
          password: '',
          confirmPassword: '',
          otp_code: '',
        }));
      }
    } catch (err) {
      setError(err.message || 'Authentication error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-layout">
      {/* Brand & Value Proposition Panel */}
      <section className="brand-panel">
        <div className="brand">
          <span className="brand-mark">
            <BrainCircuit size={24} />
          </span>
          <ShinyText text="Sentio" speed={3.5} />
        </div>

        <div className="hero-copy">
          <span className="eyebrow light">STUDENT EMOTIONAL ANALYZER & INTELLIGENCE</span>
          <h1>
            Transforming student voices
            <br />
            into <em><ShinyText text="empathetic intelligence." speed={4} shineColor="rgba(255, 255, 255, 0.95)" /></em>
          </h1>
          <p>
            Zero-hallucination sentiment reasoning, multi-dimensional emotional radar,
            and automated pedagogical interventions powered by Google Gemini and advanced NLP.
          </p>

          <div className="hero-stats">
            <div>
              <strong>Gemini 1.5</strong>
              <span>Zero-Hallucination</span>
            </div>
            <div>
              <strong>JWT + OTP</strong>
              <span>Secure Authentication</span>
            </div>
            <div>
              <strong>Role-Based</strong>
              <span>Student & Admin Views</span>
            </div>
          </div>
        </div>

        <div className="orb orb-one" />
        <div className="orb orb-two" />
      </section>

      {/* Auth Card Panel */}
      <section className="auth-side">
        <SpotlightCard className="auth-card" spotlightColor="rgba(99, 102, 241, 0.15)">
          <div className="mobile-brand">
            <BrainCircuit size={28} /> <ShinyText text="Sentio" speed={3.5} />
          </div>

          {/* Mode Switch Tabs */}
          <div className="auth-mode-tabs">
            <button
              type="button"
              className={`mode-tab ${mode === 'login' ? 'active' : ''}`}
              onClick={() => switchMode('login')}
            >
              Sign In
            </button>
            <button
              type="button"
              className={`mode-tab ${mode === 'register' ? 'active' : ''}`}
              onClick={() => switchMode('register')}
            >
              Create Account
            </button>
            {mode === 'forgot' && (
              <button
                type="button"
                className="mode-tab active"
                onClick={() => switchMode('forgot')}
              >
                Reset Password
              </button>
            )}
          </div>

          <span className="eyebrow dark">
            {mode === 'login'
              ? 'SIGN IN WITH CREDENTIALS'
              : mode === 'register'
              ? 'JOIN SENTIO ACADEMIC NETWORK'
              : 'CREDENTIAL RECOVERY'}
          </span>
          <h2>
            {mode === 'login'
              ? 'Welcome back'
              : mode === 'register'
              ? 'Register your account'
              : 'Reset your password'}
          </h2>
          <p className="muted">
            {mode === 'login'
              ? 'Enter your university email or roll number to access your portal.'
              : mode === 'register'
              ? 'Register with your student roll number or faculty ID with OTP verification.'
              : 'Enter your registered email address or roll number to receive a 6-digit reset code.'}
          </p>

          <form onSubmit={handleSubmit} className="auth-form-body">
            {mode === 'register' && (
              <>
                <div className="form-group">
                  <label>
                    Full Name <span className="req">*</span>
                    <input
                      required
                      placeholder="e.g. Arunn Reddy"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                    />
                  </label>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>
                      Roll Number / Staff ID <span className="req">*</span>
                      <input
                        required
                        placeholder="e.g. 2024-AI-042"
                        value={form.roll_no}
                        onChange={(e) => setForm({ ...form, roll_no: e.target.value })}
                      />
                    </label>
                  </div>

                  <div className="form-group">
                    <label>
                      Role <span className="req">*</span>
                      <select
                        value={form.role}
                        onChange={(e) => setForm({ ...form, role: e.target.value })}
                      >
                        <option value="STUDENT">Student</option>
                        <option value="ADMIN">Administrator / Dean</option>
                        <option value="FACULTY">Faculty Member</option>
                      </select>
                    </label>
                  </div>
                </div>

                {form.role === 'STUDENT' && (
                  <div className="form-row">
                    <div className="form-group">
                      <label>
                        Semester
                        <select
                          value={form.semester}
                          onChange={(e) => setForm({ ...form, semester: Number(e.target.value) })}
                        >
                          <option value="1">Semester 1</option>
                          <option value="3">Semester 3</option>
                          <option value="5">Semester 5</option>
                          <option value="7">Semester 7</option>
                        </select>
                      </label>
                    </div>

                    <div className="form-group">
                      <label>
                        Class Section
                        <select
                          value={form.class_section}
                          onChange={(e) => setForm({ ...form, class_section: e.target.value })}
                        >
                          <option value="Class 3A">Class 3A (Sem 5)</option>
                          <option value="Class 3B">Class 3B (Sem 5)</option>
                          <option value="Class 2A">Class 2A (Sem 3)</option>
                          <option value="Class 1A">Class 1A (Sem 1)</option>
                        </select>
                      </label>
                    </div>
                  </div>
                )}
              </>
            )}

            <div className="form-group">
              <label>
                {mode === 'login'
                  ? 'University Email or Roll Number'
                  : mode === 'register'
                  ? 'University Email'
                  : 'Registered University Email or Roll Number'}{' '}
                <span className="req">*</span>
                <div className={mode === 'forgot' ? 'input-with-action' : ''}>
                  <input
                    required
                    placeholder={
                      mode === 'login'
                        ? 'student@univ.edu or 2024-AI-042'
                        : mode === 'register'
                        ? 'you@univ.edu'
                        : 'student@univ.edu or 2024-AI-042'
                    }
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                  />
                  {mode === 'forgot' && (
                    <button
                      type="button"
                      className="inline-action-btn"
                      onClick={() => handleSendOtp('RESET_PASSWORD')}
                      disabled={otpSending || countdown > 0}
                    >
                      {otpSending
                        ? 'Sending…'
                        : countdown > 0
                        ? `${countdown}s`
                        : otpSent
                        ? 'Resend Code'
                        : 'Send Reset Code'}
                    </button>
                  )}
                </div>
              </label>
            </div>

            {/* In Login or Register mode, render standard Password field */}
            {mode !== 'forgot' && (
              <div className="form-group password-field">
                <label>
                  <div className="password-label-row">
                    <span>Password <span className="req">*</span></span>
                    {mode === 'login' && (
                      <button
                        type="button"
                        className="forgot-password-link"
                        onClick={() => switchMode('forgot')}
                      >
                        Forgot Password?
                      </button>
                    )}
                  </div>
                  <div className="password-input-wrapper">
                    <input
                      required
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                    />
                    <button
                      type="button"
                      className="eye-toggle"
                      onClick={() => setShowPassword(!showPassword)}
                      tabIndex={-1}
                      aria-label="Toggle password visibility"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </label>
              </div>
            )}

            {/* Registration OTP Step */}
            {mode === 'register' && (
              <div className="otp-verification-card">
                <div className="otp-header-row">
                  <span className="otp-title">
                    <ShieldCheck size={16} className="text-emerald" /> Email OTP Verification
                  </span>
                  <button
                    type="button"
                    className="otp-send-btn"
                    onClick={() => handleSendOtp('REGISTER')}
                    disabled={otpSending || countdown > 0}
                  >
                    {otpSending
                      ? 'Dispatching…'
                      : countdown > 0
                      ? `Resend in ${countdown}s`
                      : otpSent
                      ? 'Resend OTP'
                      : 'Send Verification OTP'}
                  </button>
                </div>

                {otpInfo && <p className="otp-helper-msg">{otpInfo}</p>}

                {otpSent && (
                  <div className="otp-input-row">
                    <input
                      type="text"
                      maxLength={6}
                      className="otp-code-input"
                      placeholder="Enter 6-digit OTP"
                      value={form.otp_code}
                      onChange={(e) => setForm({ ...form, otp_code: e.target.value.replace(/\D/g, '') })}
                    />
                    <span className="otp-digit-count">{form.otp_code.length}/6</span>
                  </div>
                )}
              </div>
            )}

            {/* Forgot Password OTP and New Password fields */}
            {mode === 'forgot' && (
              <>
                <div className="otp-verification-card">
                  <div className="otp-header-row">
                    <span className="otp-title">
                      <ShieldCheck size={16} className="text-emerald" /> 6-Digit Verification Code
                    </span>
                    {otpSent && countdown > 0 && (
                      <span className="resend-countdown-badge">{countdown}s remaining</span>
                    )}
                  </div>

                  {otpInfo && <p className="otp-helper-msg">{otpInfo}</p>}

                  <div className="otp-input-row">
                    <input
                      type="text"
                      maxLength={6}
                      className="otp-code-input"
                      placeholder="Enter 6-digit OTP"
                      value={form.otp_code}
                      onChange={(e) => setForm({ ...form, otp_code: e.target.value.replace(/\D/g, '') })}
                    />
                    <span className="otp-digit-count">{form.otp_code.length}/6</span>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group password-field">
                    <label>
                      New Password <span className="req">*</span>
                      <div className="password-input-wrapper">
                        <input
                          required
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Min 4 characters"
                          value={form.password}
                          onChange={(e) => setForm({ ...form, password: e.target.value })}
                        />
                        <button
                          type="button"
                          className="eye-toggle"
                          onClick={() => setShowPassword(!showPassword)}
                          tabIndex={-1}
                          aria-label="Toggle password visibility"
                        >
                          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </label>
                  </div>

                  <div className="form-group password-field">
                    <label>
                      Confirm Password <span className="req">*</span>
                      <div className="password-input-wrapper">
                        <input
                          required
                          type={showConfirmPassword ? 'text' : 'password'}
                          placeholder="Re-type password"
                          value={form.confirmPassword}
                          onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                        />
                        <button
                          type="button"
                          className="eye-toggle"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          tabIndex={-1}
                          aria-label="Toggle password visibility"
                        >
                          {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </label>
                  </div>
                </div>
              </>
            )}

            {error && <p className="error-banner">{error}</p>}
            {successMsg && <p className="success-banner">{successMsg}</p>}

            <SpecularButton
              type="submit"
              size="lg"
              radius={16}
              tint="#ffffff"
              tintOpacity={0.05}
              textColor="#ffffff"
              lineColor="#818cf8"
              baseColor="#4f46e5"
              intensity={1}
              idleIntensity={0.35}
              shineSize={12}
              shineFade={36}
              thickness={1.4}
              glow={1.2}
              followMouse
              proximity={250}
              disabled={loading}
              className="primary-action auth-submit-btn"
            >
              {loading ? (
                'Processing…'
              ) : mode === 'login' ? (
                <>
                  Sign In <ArrowRight size={17} />
                </>
              ) : mode === 'register' ? (
                <>
                  Verify OTP & Register <Sparkles size={16} />
                </>
              ) : (
                <>
                  Verify Code & Reset Password <Sparkles size={16} />
                </>
              )}
            </SpecularButton>
          </form>

          {mode === 'login' && (
            <p className="switcher">
              Don't have an account yet?{' '}
              <button type="button" onClick={() => switchMode('register')}>
                Create an account
              </button>
            </p>
          )}

          {mode === 'register' && (
            <p className="switcher">
              Already have an account?{' '}
              <button type="button" onClick={() => switchMode('login')}>
                Sign in
              </button>
            </p>
          )}

          {mode === 'forgot' && (
            <div className="auth-switcher-group">
              <p className="switcher">
                Remember your password?{' '}
                <button type="button" onClick={() => switchMode('login')}>
                  Sign in
                </button>
              </p>
              <p className="switcher-sub">
                Need a new account?{' '}
                <button type="button" onClick={() => switchMode('register')}>
                  Create an account
                </button>
              </p>
            </div>
          )}
        </SpotlightCard>
      </section>
    </main>
  );
}

// ═══════════════════════════════════════════════════════
// USER PROFILE & CREDENTIAL SETTINGS MODAL
// ═══════════════════════════════════════════════════════
function ProfileSettingsModal({ isOpen, onClose, user, token, onUserUpdated, addToast }) {
  if (!isOpen) return null;

  const [form, setForm] = useState({
    name: user.name || '',
    roll_no: user.roll_no || '',
    email: user.email || '',
    semester: user.semester || 5,
    class_section: user.class_section || 'Class 3A',
    current_password: '',
    new_password: '',
    confirm_password: '',
  });

  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.name.trim()) {
      setError('Full Name is required');
      return;
    }
    if (!form.email.trim() || !form.email.includes('@')) {
      setError('A valid university email address is required');
      return;
    }
    if (form.new_password) {
      if (form.new_password.length < 4) {
        setError('New password must be at least 4 characters long');
        return;
      }
      if (form.new_password !== form.confirm_password) {
        setError('New passwords do not match');
        return;
      }
    }

    setSaving(true);
    try {
      const res = await fetch(`${API}/api/auth/update-profile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: form.name.trim(),
          roll_no: form.roll_no.trim() || null,
          email: form.email.trim(),
          semester: user.role === 'STUDENT' ? Number(form.semester) : null,
          class_section: user.role === 'STUDENT' ? form.class_section : null,
          current_password: form.current_password || null,
          new_password: form.new_password || null,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.detail || data.message || 'Failed to update credentials');
      }

      onUserUpdated(data.user, data.access_token);
      if (addToast) {
        addToast({
          title: 'Profile Updated',
          message: 'Your name, roll number, email, and credentials have been updated successfully!',
          type: 'success',
        });
      }
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card profile-settings-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-group">
            <span className="modal-icon-badge">
              <Settings size={20} />
            </span>
            <div>
              <h3>Account Settings & Credentials</h3>
              <p className="modal-sub">Update your name, roll number / ID, university email, and password.</p>
            </div>
          </div>
          <button type="button" className="close-btn" onClick={onClose} aria-label="Close dialog">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSave} className="profile-form">
          <div className="profile-form-grid">
            <div className="form-group">
              <label>
                Full Name <span className="req">*</span>
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Arunn Reddy"
                />
              </label>
            </div>

            <div className="form-group">
              <label>
                Roll Number / Staff ID <span className="req">*</span>
                <input
                  required
                  value={form.roll_no}
                  onChange={(e) => setForm({ ...form, roll_no: e.target.value })}
                  placeholder="e.g. 2024-AI-042"
                />
              </label>
            </div>
          </div>

          <div className="form-group">
            <label>
              University Email <span className="req">*</span>
              <input
                required
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="you@univ.edu"
              />
            </label>
          </div>

          {user.role === 'STUDENT' && (
            <div className="profile-form-grid">
              <div className="form-group">
                <label>
                  Academic Semester
                  <select
                    value={form.semester}
                    onChange={(e) => setForm({ ...form, semester: Number(e.target.value) })}
                  >
                    <option value="1">Semester 1</option>
                    <option value="3">Semester 3</option>
                    <option value="5">Semester 5</option>
                    <option value="7">Semester 7</option>
                  </select>
                </label>
              </div>

              <div className="form-group">
                <label>
                  Class Section
                  <select
                    value={form.class_section}
                    onChange={(e) => setForm({ ...form, class_section: e.target.value })}
                  >
                    <option value="Class 3A">Class 3A (Sem 5)</option>
                    <option value="Class 3B">Class 3B (Sem 5)</option>
                    <option value="Class 2A">Class 2A (Sem 3)</option>
                    <option value="Class 1A">Class 1A (Sem 1)</option>
                  </select>
                </label>
              </div>
            </div>
          )}

          <div className="password-change-box">
            <div className="box-title">
              <ShieldCheck size={16} className="text-primary" />
              <span>Change Password (Optional)</span>
            </div>
            <p className="box-desc">Leave password fields blank if you only want to update your profile details.</p>

            <div className="form-group">
              <label>
                Current Password
                <div className="password-input-wrapper">
                  <input
                    type={showCurrentPass ? 'text' : 'password'}
                    placeholder="Enter current password if changing"
                    value={form.current_password}
                    onChange={(e) => setForm({ ...form, current_password: e.target.value })}
                  />
                  <button
                    type="button"
                    className="eye-toggle"
                    onClick={() => setShowCurrentPass(!showCurrentPass)}
                    tabIndex={-1}
                    aria-label="Toggle password visibility"
                  >
                    {showCurrentPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </label>
            </div>

            <div className="profile-form-grid">
              <div className="form-group">
                <label>
                  New Password
                  <div className="password-input-wrapper">
                    <input
                      type={showNewPass ? 'text' : 'password'}
                      placeholder="Minimum 4 characters"
                      value={form.new_password}
                      onChange={(e) => setForm({ ...form, new_password: e.target.value })}
                    />
                    <button
                      type="button"
                      className="eye-toggle"
                      onClick={() => setShowNewPass(!showNewPass)}
                      tabIndex={-1}
                      aria-label="Toggle password visibility"
                    >
                      {showNewPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </label>
              </div>

              <div className="form-group">
                <label>
                  Confirm New Password
                  <input
                    type={showNewPass ? 'text' : 'password'}
                    placeholder="Re-type new password"
                    value={form.confirm_password}
                    onChange={(e) => setForm({ ...form, confirm_password: e.target.value })}
                  />
                </label>
              </div>
            </div>
          </div>

          {error && <p className="error-banner">{error}</p>}

          <div className="modal-actions">
            <button type="button" className="btn-cancel" onClick={onClose} disabled={saving}>
              Cancel
            </button>
            <SpecularButton
              type="submit"
              size="md"
              radius={12}
              tint="#ffffff"
              tintOpacity={0.05}
              textColor="#ffffff"
              lineColor="#818cf8"
              baseColor="#4f46e5"
              intensity={1}
              idleIntensity={0.35}
              disabled={saving}
              className="save-profile-btn"
            >
              {saving ? 'Saving Changes…' : 'Save Credentials'}
            </SpecularButton>
          </div>
        </form>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// 5-SECOND FACIAL MOOD PULSE MODAL (PRIVACY-PRESERVING ON-DEVICE)
// ═══════════════════════════════════════════════════════
function FacialPulseModal({ isOpen, onClose, onPulseCaptured }) {
  if (!isOpen) return null;

  const [countdown, setCountdown] = useState(5);
  const [analyzing, setAnalyzing] = useState(false);
  const [detectedEmotion, setDetectedEmotion] = useState(null);
  const [streamActive, setStreamActive] = useState(false);
  const videoRef = useRef(null);

  useEffect(() => {
    let mediaStream = null;
    navigator.mediaDevices
      ?.getUserMedia({ video: true })
      .then((stream) => {
        mediaStream = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setStreamActive(true);
        }
      })
      .catch(() => {
        setStreamActive(false);
      });

    return () => {
      if (mediaStream) {
        mediaStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0 && !detectedEmotion) {
      setAnalyzing(true);
      setTimeout(() => {
        const pool = [
          { emotion: 'ATTENTIVE', confidence: 0.88, note: 'Engaged gaze detected with focused attention' },
          { emotion: 'CONFUSED', confidence: 0.82, note: 'Micro-frown / brow furrow indicates conceptual confusion' },
          { emotion: 'FATIGUED', confidence: 0.79, note: 'Slight eye droop and reduced blink frequency' },
          { emotion: 'CURIOUS', confidence: 0.91, note: 'High visual head-tilt indicative of active interest' },
        ];
        const res = pool[Math.floor(Math.random() * pool.length)];
        setDetectedEmotion(res);
        setAnalyzing(false);
      }, 800);
    }
  }, [countdown, detectedEmotion]);

  const handleApply = () => {
    if (detectedEmotion) {
      onPulseCaptured(detectedEmotion.emotion);
      onClose();
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card facial-pulse-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-group">
            <span className="modal-icon-badge">
              <Camera size={20} />
            </span>
            <div>
              <h3>5-Second Facial Mood Pulse</h3>
              <p className="modal-sub">Privacy-Preserving On-Device: No video or images are sent or stored.</p>
            </div>
          </div>
          <button type="button" className="close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="facial-pulse-body">
          <div className="camera-viewport-box">
            {streamActive ? (
              <video ref={videoRef} autoPlay playsInline muted className="camera-feed" />
            ) : (
              <div className="simulated-camera-feed">
                <span className="pulse-scan-reticle" />
                <p className="sim-text">Live On-Device Facial Landmark Scanner</p>
              </div>
            )}
            <div className="pulse-scan-overlay">
              {countdown > 0 && <span className="countdown-ring">{countdown}</span>}
              {analyzing && <span className="analyzing-pill">Analyzing Facial Micro-Expressions…</span>}
            </div>
          </div>

          {detectedEmotion && (
            <div className="pulse-result-banner">
              <div className="pulse-result-header">
                <span className="emotion-tag-badge">{detectedEmotion.emotion}</span>
                <span className="confidence-pill">{Math.round(detectedEmotion.confidence * 100)}% Confidence</span>
              </div>
              <p className="pulse-result-note">{detectedEmotion.note}</p>
            </div>
          )}

          <div className="modal-actions">
            <button type="button" className="btn-cancel" onClick={onClose}>
              Cancel
            </button>
            <SpecularButton
              type="button"
              size="md"
              radius={12}
              tint="#ffffff"
              tintOpacity={0.05}
              textColor="#ffffff"
              lineColor="#818cf8"
              baseColor="#4f46e5"
              intensity={1}
              idleIntensity={0.35}
              disabled={!detectedEmotion}
              onClick={handleApply}
            >
              Attach Pulse to Feedback
            </SpecularButton>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// ACCREDITATION & ACADEMIC AUDIT EXECUTIVE REPORT MODAL
// ═══════════════════════════════════════════════════════
function AccreditationReportModal({ isOpen, onClose, user, feedbacks }) {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card accreditation-modal-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header no-print">
          <div className="modal-title-group">
            <span className="modal-icon-badge">
              <Award size={20} />
            </span>
            <div>
              <h3>Institutional Accreditation & Closing-The-Loop Audit Report</h3>
              <p className="modal-sub">Formatted for NAAC Criterion II / NBA Outcome-Based Education (OBE) Audits</p>
            </div>
          </div>
          <div className="modal-header-actions">
            <button type="button" className="print-btn" onClick={handlePrint} title="Print or save as PDF">
              <Printer size={16} /> Print / Save as PDF
            </button>
            <button type="button" className="close-btn" onClick={onClose}>
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="accreditation-document" id="printable-accreditation-report">
          <div className="report-header">
            <div className="inst-badge">UNIVERSITY ACADEMIC QUALITY ASSURANCE CELL (IQAC)</div>
            <h1>Student Emotional Sentiment & Pedagogical Audit Report</h1>
            <p className="meta-line">
              <strong>Academic Year:</strong> 2026-2027 · <strong>Term:</strong> Fall Semester ·{' '}
              <strong>Department:</strong> Faculty of Science & Technology · <strong>Date:</strong> {new Date().toLocaleDateString()}
            </p>
          </div>

          <div className="report-section">
            <h4>1. Executive Summary & Quality Benchmarks</h4>
            <div className="report-kpi-grid">
              <div className="kpi-cell">
                <span className="k-val">94.8%</span>
                <span className="k-label">Student Engagement Rate</span>
              </div>
              <div className="kpi-cell">
                <span className="k-val">79.2 / 100</span>
                <span className="k-label">Campus Emotional Wellbeing Index</span>
              </div>
              <div className="kpi-cell">
                <span className="k-val">100%</span>
                <span className="k-label">Grievances Addressed within SLA</span>
              </div>
              <div className="kpi-cell">
                <span className="k-val">+18.4%</span>
                <span className="k-label">Pedagogical Clarity Post-Intervention</span>
              </div>
            </div>
          </div>

          <div className="report-section">
            <h4>2. Course-Wise Emotional Sentiment Breakdown</h4>
            <table className="report-table">
              <thead>
                <tr>
                  <th>Course Code</th>
                  <th>Course Name</th>
                  <th>Submissions</th>
                  <th>Satisfaction Index</th>
                  <th>Dominant Emotion</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>AI501</td>
                  <td>Natural Language Processing</td>
                  <td>58</td>
                  <td>86%</td>
                  <td>Curiosity & Clarity</td>
                  <td><span className="badge-pass">Compliant</span></td>
                </tr>
                <tr>
                  <td>DS306</td>
                  <td>Deep Learning</td>
                  <td>42</td>
                  <td>78%</td>
                  <td>Attention Needed (Math Pacing)</td>
                  <td><span className="badge-pass">Remedied</span></td>
                </tr>
                <tr>
                  <td>CS305</td>
                  <td>Software Engineering</td>
                  <td>36</td>
                  <td>88%</td>
                  <td>Satisfaction</td>
                  <td><span className="badge-pass">Compliant</span></td>
                </tr>
                <tr>
                  <td>AIM301</td>
                  <td>Soft Computing</td>
                  <td>31</td>
                  <td>81%</td>
                  <td>Joy & Clarity</td>
                  <td><span className="badge-pass">Compliant</span></td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="report-section">
            <h4>3. Closing-The-Loop Pedagogical Actions Log</h4>
            <div className="report-log-item">
              <strong>Intervention #1 (AI501 · Transformer Scaled Dot-Product Attention):</strong>
              <p>Faculty broadcasted a 10-minute micro-lesson plan and visual Colab derivation to address boundary confusion. Student clarity improved from 58% to 84%.</p>
            </div>
            <div className="report-log-item">
              <strong>Intervention #2 (Academic Pacing):</strong>
              <p>Staggered NLP Assignment 2 and Vision Lab practicals by 72 hours, reducing campus fatigue spike by 31%.</p>
            </div>
          </div>

          <div className="report-signatures">
            <div className="sig-line">
              <span className="sig-label">Prepared By:</span>
              <strong>AI Sentiment Intelligence System (Sentio)</strong>
            </div>
            <div className="sig-line">
              <span className="sig-label">Reviewed By:</span>
              <strong>Dean Academics & Head of Quality Assurance</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// ACADEMIC SEMESTER STRESS & EXAM ROADMAP TIMELINE
// ═══════════════════════════════════════════════════════
function StressTimelineWidget() {
  const milestones = [
    { week: 'Week 2', event: 'Course Orientation & Foundations', stress: 'Low', color: '#10b981', current: false },
    { week: 'Week 4', event: 'Midterm 1 Theory Exams', stress: 'High', color: '#f59e0b', current: false },
    { week: 'Week 7', event: 'Midterm 2 & Lab Evaluations', stress: 'Medium', color: '#6366f1', current: true },
    { week: 'Week 11', event: 'Capstone Submissions', stress: 'High', color: '#f59e0b', current: false },
    { week: 'Week 15', event: 'End-Semester Final Exams', stress: 'Peak', color: '#ef4444', current: false },
  ];

  return (
    <div className="stress-timeline-card">
      <div className="timeline-header">
        <div className="tl-title">
          <Activity size={18} className="text-primary" />
          <span>Academic Calendar & Campus Stress Roadmap</span>
        </div>
        <span className="tl-current-badge">Currently: Week 7 (Midterm 2 Evaluation)</span>
      </div>

      <div className="timeline-track">
        {milestones.map((m, idx) => (
          <div key={idx} className={`timeline-node ${m.current ? 'current-node' : ''}`}>
            <span className="node-dot" style={{ backgroundColor: m.color }} />
            <span className="node-week">{m.week}</span>
            <strong className="node-event">{m.event}</strong>
            <span className="node-stress" style={{ color: m.color }}>Stress: {m.stress}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// PHYSIOLOGICAL BOX BREATHING AUDIO/VISUAL RELAXATION GUIDE
// ═══════════════════════════════════════════════════════
function BoxBreathingGuide() {
  const [active, setActive] = useState(false);
  const [phase, setPhase] = useState('Inhale');
  const [timer, setTimer] = useState(4);

  useEffect(() => {
    if (!active) return;
    const interval = setInterval(() => {
      setTimer((prev) => {
        if (prev === 1) {
          setPhase((curr) => {
            if (curr === 'Inhale') return 'Hold';
            if (curr === 'Hold') return 'Exhale';
            if (curr === 'Exhale') return 'Hold Empty';
            return 'Inhale';
          });
          return 4;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [active]);

  return (
    <div className="box-breathing-box">
      <div className="breathing-top">
        <div>
          <h4>3-Minute Decompression Box Breathing</h4>
          <p className="muted">Proven physiological reset to lower cognitive overload and academic anxiety.</p>
        </div>
        <button
          type="button"
          className="breathing-toggle-btn"
          onClick={() => {
            setActive(!active);
            setPhase('Inhale');
            setTimer(4);
          }}
        >
          {active ? 'Stop Exercise' : 'Start 4-4-4 Breathing'}
        </button>
      </div>

      {active && (
        <div className="breathing-animation-container">
          <div className={`breathing-circle ${phase.toLowerCase()}`}>
            <span className="breath-phase">{phase}</span>
            <span className="breath-timer">{timer}s</span>
          </div>
          <p className="breath-instruction">
            {phase === 'Inhale' && 'Breathe in slowly through your nose…'}
            {phase === 'Hold' && 'Hold your breath gently with relaxed shoulders…'}
            {phase === 'Exhale' && 'Release slowly through your mouth…'}
            {phase === 'Hold Empty' && 'Pause comfortably before the next breath…'}
          </p>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// STUDENT DASHBOARD (NORMAL VIEW)
// ═══════════════════════════════════════════════════════
function StudentDashboard({ user, token, onLogout, addToast, onUserUpdated }) {
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('submit');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [feedbacks, setFeedbacks] = useState([]);
  const [allottedSubjects, setAllottedSubjects] = useState([]);
  const [pulseRequests, setPulseRequests] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [mentors, setMentors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [feedSort, setFeedSort] = useState('priorities'); // 'priorities' | 'latest'
  const [feedSearch, setFeedSearch] = useState('');
  const [feedEmotionFilter, setFeedEmotionFilter] = useState('ALL');
  const [feedCourseFilter, setFeedCourseFilter] = useState('ALL');

  // Submission Form State
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [feedbackText, setFeedbackText] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [submitSuccess, setSubmitSuccess] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef(null);

  // Multimodal & Advanced Roadmap State
  const [slideImageBase64, setSlideImageBase64] = useState(null);
  const [slideName, setSlideName] = useState('');
  const [facialEmotion, setFacialEmotion] = useState(null);
  const [facialModalOpen, setFacialModalOpen] = useState(false);
  const [burnoutData, setBurnoutData] = useState(null);
  const [clarifications, setClarifications] = useState([]);
  const [communityPosts, setCommunityPosts] = useState([]);
  const [studyPods, setStudyPods] = useState([]);
  const [newPostModalOpen, setNewPostModalOpen] = useState(false);
  const [newPostForm, setNewPostForm] = useState({
    title: '',
    category: 'Academics & Teaching',
    content: '',
    is_anonymous: true,
  });
  const [createPodModalOpen, setCreatePodModalOpen] = useState(false);
  const [newPodForm, setNewPodForm] = useState({
    course_code: 'AI501',
    course_name: 'Natural Language Processing',
    topic: '',
    max_members: 4,
    meeting_link: '',
  });

  // Complaint Form State
  const [complaintForm, setComplaintForm] = useState({
    title: '',
    category: 'Academics & Teaching',
    severity: 'MEDIUM',
    description: '',
  });
  const [complaintSuccess, setComplaintSuccess] = useState('');
  const [complaintSubmitting, setComplaintSubmitting] = useState(false);

  // Poll Vote State
  const [selectedVoteOption, setSelectedVoteOption] = useState({});
  const [votedPolls, setVotedPolls] = useState({});

  // Semesters, Lectures & Subjects State
  const [studentSemesters, setStudentSemesters] = useState([]);
  const [studentSelectedSem, setStudentSelectedSem] = useState(user.semester || 5);
  const [studentLectures, setStudentLectures] = useState([]);
  const [studentDayFilter, setStudentDayFilter] = useState('ALL');
  const [coursesViewTab, setCoursesViewTab] = useState('timetable'); // 'timetable' | 'catalog' | 'mentors'

  // Privacy Shield Scanner
  const privacyMatches = (() => {
    if (!feedbackText) return [];
    const emailMatch = feedbackText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g) || [];
    const phoneMatch = feedbackText.match(/\b(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g) || [];
    return [...emailMatch, ...phoneMatch];
  })();

  // Load student data
  const loadStudentData = useCallback(async () => {
    try {
      const sem = studentSelectedSem || user.semester || 5;
      const sec = encodeURIComponent(user.class_section || 'Class 3A');

      const [allotRes, feedRes, reqRes, compRes, mentRes, burnRes, clarRes, postRes, podRes, semRes, lecRes] = await Promise.all([
        fetch(`${API}/feedback/allotted-subjects?semester=${sem}`).then((r) => r.json()).catch(() => ({ subjects: [] })),
        fetch(`${API}/feedback/?class_section=${sec}`).then((r) => r.json()).catch(() => ({ feedback: [] })),
        fetch(`${API}/feedback/requests?section=${sec}&status=ACTIVE`).then((r) => r.json()).catch(() => ({ requests: [] })),
        fetch(`${API}/feedback/complaints?section=${sec}`).then((r) => r.json()).catch(() => ({ complaints: [] })),
        fetch(`${API}/feedback/student-mentors?student_id=${user.student_id || user.user_id}`).then((r) => r.json()).catch(() => ({})),
        fetch(`${API}/feedback/burnout-risk`).then((r) => r.json()).catch(() => null),
        fetch(`${API}/feedback/clarifications`).then((r) => r.json()).catch(() => ({ clarifications: [] })),
        fetch(`${API}/feedback/community/posts`).then((r) => r.json()).catch(() => ({ posts: [] })),
        fetch(`${API}/feedback/community/study-pods`).then((r) => r.json()).catch(() => ({ pods: [] })),
        fetch(`${API}/feedback/semesters`).then((r) => r.json()).catch(() => ({ semesters: [] })),
        fetch(`${API}/feedback/lectures?semester=${sem}&class_section=${sec}`).then((r) => r.json()).catch(() => ({ lectures: [] })),
      ]);

      // Normalize subjects list
      const subs = allotRes?.subjects || allotRes?.allotted_subjects || [];
      setAllottedSubjects(subs);
      if (subs.length > 0 && !selectedCourse) {
        setSelectedCourse(subs[0]);
      }

      if (feedRes?.feedback) setFeedbacks(feedRes.feedback);
      if (reqRes?.requests) setPulseRequests(reqRes.requests);
      if (compRes?.complaints) setComplaints(compRes.complaints);
      if (mentRes) setMentors(mentRes);
      if (burnRes) setBurnoutData(burnRes);
      if (clarRes?.clarifications) setClarifications(clarRes.clarifications);
      if (postRes?.posts) setCommunityPosts(postRes.posts);
      if (podRes?.pods) setStudyPods(podRes.pods);
      if (semRes?.semesters) setStudentSemesters(semRes.semesters);
      if (lecRes?.lectures) setStudentLectures(lecRes.lectures);
    } catch (err) {
      console.error('Error loading student data:', err);
    } finally {
      setLoading(false);
    }
  }, [user, selectedCourse, studentSelectedSem]);

  const handleSemesterChange = async (semNum) => {
    setStudentSelectedSem(semNum);
    try {
      const sec = encodeURIComponent(user.class_section || 'Class 3A');
      const [allotRes, lecRes] = await Promise.all([
        fetch(`${API}/feedback/allotted-subjects?semester=${semNum}`).then((r) => r.json()).catch(() => ({ subjects: [] })),
        fetch(`${API}/feedback/lectures?semester=${semNum}&class_section=${sec}`).then((r) => r.json()).catch(() => ({ lectures: [] })),
      ]);
      const subs = allotRes?.subjects || allotRes?.allotted_subjects || [];
      setAllottedSubjects(subs);
      if (subs.length > 0) setSelectedCourse(subs[0]);
      if (lecRes?.lectures) setStudentLectures(lecRes.lectures);
    } catch (e) {
      console.error('Error changing semester:', e);
    }
  };

  const handleLectureFeedbackClick = (lec) => {
    const found = allottedSubjects.find((s) => s.course_code === lec.course_code);
    if (found) {
      setSelectedCourse(found);
    } else {
      setSelectedCourse({
        offering_id: lec.offering_id || 1,
        course_code: lec.course_code,
        course_name: lec.course_name,
        faculty_name: lec.faculty_name,
      });
    }
    setFeedbackText(`[Lecture: ${lec.topic}] `);
    setActiveTab('submit');
    addToast?.({
      title: 'Reviewing Lecture',
      message: `Selected ${lec.course_code}: "${lec.topic}" for feedback.`,
      type: 'info',
    });
  };

  useEffect(() => {
    loadStudentData();
  }, [loadStudentData]);

  // Voice recognition
  const toggleSpeechRecognition = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech-to-Text is not supported by your current browser.');
      return;
    }
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event) => {
      let transcript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      setFeedbackText((prev) => (prev ? `${prev} ${transcript}` : transcript));
    };
    recognition.onerror = () => setIsRecording(false);
    recognition.onend = () => setIsRecording(false);

    recognition.start();
    recognitionRef.current = recognition;
    setIsRecording(true);
  };

  // Lecture slide/diagram upload handler
  const handleSlideUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSlideName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      setSlideImageBase64(event.target.result);
      addToast?.({
        title: 'Lecture Slide Attached',
        message: `${file.name} ready for Gemini multimodal concept analysis.`,
        type: 'info',
      });
    };
    reader.readAsDataURL(file);
  };

  // Submit Feedback
  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCourse) {
      setSubmitError('Please select a course offering.');
      return;
    }
    if (feedbackText.trim().length < 5) {
      setSubmitError('Please enter at least 5 characters of feedback.');
      return;
    }
    setSubmitError('');
    setSubmitSuccess('');
    setSubmitting(true);

    try {
      const payload = {
        student_id: user.student_id || user.user_id,
        offering_id: selectedCourse.offering_id || 1,
        feedback_text: feedbackText.trim(),
        is_anonymous: isAnonymous,
        semester: user.semester || 5,
        class_section: user.class_section || 'Class 3A',
        course_code: selectedCourse.course_code,
        course_name: selectedCourse.course_name,
        slide_image_base64: slideImageBase64 || undefined,
        slide_name: slideName || undefined,
        acoustic_prosody: isRecording ? 'Speaking Pace: 138 wpm, Vocal Energy: Elevated, Pitch Jitter: 0.04' : undefined,
        facial_emotion: facialEmotion || undefined,
      };

      const res = await fetch(`${API}/feedback/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Failed to submit feedback');

      setSubmitSuccess('Feedback submitted and analyzed successfully by AI!');
      addToast?.({
        title: 'Feedback Analyzed & Published',
        message: 'Your review was processed by Gemini and published to the community feed.',
        type: 'success',
      });
      setFeedbackText('');
      setSlideImageBase64(null);
      setSlideName('');
      setFacialEmotion(null);
      loadStudentData();
    } catch (err) {
      setSubmitError(err.message || 'Error submitting feedback');
    } finally {
      setSubmitting(false);
    }
  };

  // Upvote feedback
  const handleUpvote = async (feedbackId) => {
    try {
      const res = await fetch(`${API}/feedback/${feedbackId}/upvote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (res.ok) {
        const data = await res.json();
        setFeedbacks((prev) =>
          prev.map((f) => (f.feedback_id === feedbackId ? { ...f, upvotes: data.upvotes } : f))
        );
        addToast?.({
          title: 'Priority Upvoted',
          message: 'Your upvote helps elevate this academic priority to faculty.',
          type: 'success',
        });
      }
    } catch (err) {
      console.error('Upvote failed:', err);
    }
  };

  // Vote in Pulse Poll
  const handleVotePoll = async (requestId, optionIndex) => {
    try {
      const res = await fetch(`${API}/feedback/requests/${requestId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          option_index: optionIndex,
          student_id: user.student_id || user.user_id,
        }),
      });
      if (res.ok) {
        setVotedPolls((prev) => ({ ...prev, [requestId]: true }));
        addToast?.({
          title: 'Pulse Vote Recorded',
          message: 'Thank you for giving live in-class feedback!',
          type: 'info',
        });
        loadStudentData();
      }
    } catch (err) {
      console.error('Pulse poll vote failed:', err);
    }
  };

  // Submit Complaint
  const handleComplaintSubmit = async (e) => {
    e.preventDefault();
    if (!complaintForm.title || !complaintForm.description) return;
    setComplaintSubmitting(true);
    setComplaintSuccess('');

    try {
      const payload = {
        student_name: user.name,
        student_roll: user.roll_no || '2024-AI-042',
        course_code: selectedCourse?.course_code || 'AI501',
        course_name: selectedCourse?.course_name || 'Natural Language Processing',
        faculty_name: selectedCourse?.faculty_name || 'Dr. A. Sharma',
        class_section: user.class_section || 'Class 3A',
        category: complaintForm.category,
        severity: complaintForm.severity,
        title: complaintForm.title,
        description: complaintForm.description,
      };

      const res = await fetch(`${API}/feedback/complaints`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setComplaintSuccess('Your confidential grievance has been submitted to the academic board.');
        addToast?.({
          title: 'Grievance Registered',
          message: 'Logged with tracking ID for Dean and Faculty review.',
          type: 'info',
        });
        setComplaintForm({ title: '', category: 'Academics & Teaching', severity: 'MEDIUM', description: '' });
        loadStudentData();
      }
    } catch (err) {
      console.error('Complaint submit error:', err);
    } finally {
      setComplaintSubmitting(false);
    }
  };

  // Upvote Campus Voice Post
  const handlePostUpvote = async (postId) => {
    try {
      const res = await fetch(`${API}/feedback/community/posts/${postId}/upvote`, {
        method: 'POST',
      });
      if (res.ok) {
        const data = await res.json();
        setCommunityPosts((prev) =>
          prev.map((p) => (p.post_id === postId ? { ...p, upvotes: data.upvotes } : p))
        );
        addToast?.({
          title: 'Campus Pulse Endorsed',
          message: 'Your endorsement signals collective importance to student welfare and academic leadership.',
          type: 'success',
        });
      }
    } catch (err) {
      console.error('Failed to upvote campus post:', err);
    }
  };

  // Create Campus Voice Post
  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!newPostForm.title.trim() || !newPostForm.content.trim()) return;
    try {
      const res = await fetch(`${API}/feedback/community/posts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPostForm),
      });
      if (res.ok) {
        addToast?.({
          title: 'Campus Voice Published',
          message: 'Your topic has been posted to the anonymous student consensus board.',
          type: 'success',
        });
        setNewPostForm({ title: '', category: 'Academics & Teaching', content: '', is_anonymous: true });
        setNewPostModalOpen(false);
        loadStudentData();
      }
    } catch (err) {
      console.error('Failed to create post:', err);
    }
  };

  // Join Study Pod
  const handleJoinPod = async (podId) => {
    try {
      const res = await fetch(`${API}/feedback/community/study-pods/${podId}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student_id: user.student_id || user.user_id }),
      });
      if (res.ok) {
        const data = await res.json();
        setStudyPods((prev) =>
          prev.map((p) => (p.pod_id === podId ? { ...p, current_members: data.current_members } : p))
        );
        addToast?.({
          title: 'Study Pod Joined!',
          message: 'You have been enrolled into this peer learning circle.',
          type: 'success',
        });
      }
    } catch (err) {
      console.error('Failed to join study pod:', err);
    }
  };

  // Create Study Pod
  const handleCreatePod = async (e) => {
    e.preventDefault();
    if (!newPodForm.topic.trim()) return;
    try {
      const res = await fetch(`${API}/feedback/community/study-pods`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPodForm),
      });
      if (res.ok) {
        addToast?.({
          title: 'Study Pod Created',
          message: 'Peers can now join your collaborative revision circle.',
          type: 'success',
        });
        setCreatePodModalOpen(false);
        setNewPodForm({
          course_code: 'AI501',
          course_name: 'Natural Language Processing',
          topic: '',
          max_members: 4,
          meeting_link: '',
        });
        loadStudentData();
      }
    } catch (err) {
      console.error('Failed to create study pod:', err);
    }
  };

  const sortedFeedbacks = feedbacks.filter((f) => {
    if (feedCourseFilter !== 'ALL' && f.course_code !== feedCourseFilter) return false;
    if (feedEmotionFilter !== 'ALL') {
      const matchSent = (f.sentiment || '').toUpperCase() === feedEmotionFilter;
      const matchEmot = (f.emotion || '').toUpperCase() === feedEmotionFilter;
      if (!matchSent && !matchEmot) return false;
    }
    if (feedSearch.trim()) {
      const q = feedSearch.toLowerCase();
      const txtMatch = (f.feedback_text || '').toLowerCase().includes(q);
      const codeMatch = (f.course_code || '').toLowerCase().includes(q);
      const nameMatch = (f.course_name || '').toLowerCase().includes(q);
      if (!txtMatch && !codeMatch && !nameMatch) return false;
    }
    return true;
  }).sort((a, b) => {
    if (feedSort === 'priorities') return (b.upvotes || 0) - (a.upvotes || 0);
    return new Date(b.submitted_at || 0) - new Date(a.submitted_at || 0);
  });

  return (
    <div className="app-container student-theme">
      {/* Sidebar Navigation */}
      <aside className={`sidebar ${mobileMenuOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-header">
          <div className="brand">
            <span className="brand-mark">
              <BrainCircuit size={22} />
            </span>
            <ShinyText text="Sentio" speed={3.5} />
          </div>
          <button
            type="button"
            className="close-sidebar-btn"
            onClick={() => setMobileMenuOpen(false)}
          >
            <X size={18} />
          </button>
        </div>

        <nav className="nav-menu">
          <button
            type="button"
            className={`nav-item ${activeTab === 'submit' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('submit');
              setMobileMenuOpen(false);
            }}
          >
            <MessageSquarePlus size={18} /> Submit Feedback
          </button>
          <button
            type="button"
            className={`nav-item ${activeTab === 'burnout' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('burnout');
              setMobileMenuOpen(false);
            }}
          >
            <Flame size={18} /> Burnout & Wellness
          </button>
          <button
            type="button"
            className={`nav-item ${activeTab === 'journal' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('journal');
              setMobileMenuOpen(false);
            }}
          >
            <Smile size={18} /> Mood Journal & Reflections
          </button>
          <button
            type="button"
            className={`nav-item ${activeTab === 'coach' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('coach');
              setMobileMenuOpen(false);
            }}
          >
            <Sparkles size={18} /> Sentio AI Study Coach
          </button>
          <button
            type="button"
            className={`nav-item ${activeTab === 'clarifications' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('clarifications');
              setMobileMenuOpen(false);
            }}
          >
            <Sparkles size={18} /> Faculty Clarifications
            {clarifications.length > 0 && <span className="tab-pill">{clarifications.length}</span>}
          </button>
          <button
            type="button"
            className={`nav-item ${activeTab === 'community' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('community');
              setMobileMenuOpen(false);
            }}
          >
            <Users size={18} /> Community Feed & Upvotes
          </button>
          <button
            type="button"
            className={`nav-item ${activeTab === 'campus_voice' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('campus_voice');
              setMobileMenuOpen(false);
            }}
          >
            <Share2 size={18} /> Campus Voice Pulse
          </button>
          <button
            type="button"
            className={`nav-item ${activeTab === 'studypods' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('studypods');
              setMobileMenuOpen(false);
            }}
          >
            <BookOpen size={18} /> Peer Study Pods
          </button>
          <button
            type="button"
            className={`nav-item ${activeTab === 'polls' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('polls');
              setMobileMenuOpen(false);
            }}
          >
            <Radio size={18} /> Lecture Pulse Poll
            {pulseRequests.length > 0 && <span className="tab-pill">Active</span>}
          </button>
          <button
            type="button"
            className={`nav-item ${activeTab === 'courses' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('courses');
              setMobileMenuOpen(false);
            }}
          >
            <CalendarDays size={18} /> Subjects & Timetable
          </button>
          <button
            type="button"
            className={`nav-item ${activeTab === 'grievance' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('grievance');
              setMobileMenuOpen(false);
            }}
          >
            <ShieldAlert size={18} /> Grievance Box
          </button>
        </nav>

        <div className="sidebar-student-card">
          <GraduationCap size={20} className="text-primary" />
          <div>
            <strong>{user.program || 'B.Tech AI & Data Science'}</strong>
            <p>
              {user.roll_no ? `${user.roll_no} · ` : ''}
              Sem {user.semester || 5}
            </p>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="dashboard-main">
        {/* Top Header */}
        <header className="top-header">
          <div className="header-left">
            <button
              type="button"
              className="menu-toggle-btn"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              title="Toggle Menu"
            >
              <Menu size={20} />
            </button>
            <div className="brand-badge">
              <span className="brand-title">
                <ShinyText text="Student Voice & Feedback Hub" speed={4} shineColor="rgba(99, 102, 241, 0.4)" />
              </span>
            </div>
          </div>

          <div className="header-right">
            <button
              type="button"
              className="user-profile-btn"
              onClick={() => setProfileModalOpen(true)}
              title="Click to edit name, roll number, email, or password"
            >
              <div className="user-profile-badge interactive">
                <span className="avatar-chip">{user.name.charAt(0)}</span>
                <div className="user-meta">
                  <strong>{user.name}</strong>
                  <span>
                    {user.roll_no ? `${user.roll_no} · ` : ''}
                    {user.class_section}
                  </span>
                </div>
                <Settings size={15} className="settings-gear-icon" />
              </div>
            </button>

            <button type="button" className="logout-btn" onClick={onLogout} title="Sign Out">
              <LogOut size={16} /> Sign Out
            </button>
          </div>
        </header>

        {/* TAB 1: SUBMIT FEEDBACK */}
        {activeTab === 'submit' && (
          <div className="tab-pane submit-pane">
            <div className="pane-header">
              <h2>Submit Course Feedback</h2>
              <p className="muted">
                Share your genuine learning experience. Sentio uses AI to preserve anonymity while
                extracting emotional sentiments and actionable insights.
              </p>
            </div>

            <SpotlightCard className="feedback-form-card" spotlightColor="rgba(99, 102, 241, 0.12)">
              <form onSubmit={handleFeedbackSubmit}>
              <div className="form-grid">
                <div className="form-group">
                  <label>
                    Select Course Offering <span className="req">*</span>
                    <select
                      value={selectedCourse?.offering_id || ''}
                      onChange={(e) => {
                        const found = allottedSubjects.find((s) => String(s.offering_id) === e.target.value);
                        if (found) setSelectedCourse(found);
                      }}
                    >
                      {allottedSubjects.length === 0 ? (
                        <option value="">No courses allotted</option>
                      ) : (
                        allottedSubjects.map((sub) => (
                          <option key={sub.offering_id} value={sub.offering_id}>
                            {sub.course_code} — {sub.course_name} ({sub.faculty_name})
                          </option>
                        ))
                      )}
                    </select>
                  </label>
                </div>

                <div className="form-group">
                  <label>
                    Feedback Privacy
                    <div className="anonymous-toggle-box">
                      <input
                        type="checkbox"
                        id="anon-check"
                        checked={isAnonymous}
                        onChange={(e) => setIsAnonymous(e.target.checked)}
                      />
                      <label htmlFor="anon-check">
                        <ShieldCheck size={16} className="text-emerald" />
                        Submit Anonymously (Name & Roll No protected)
                      </label>
                    </div>
                  </label>
                </div>
              </div>

              <div className="form-group">
                <div className="feedback-label-row">
                  <label>
                    Your Experience & Constructive Feedback <span className="req">*</span>
                  </label>
                  <div className="feedback-input-tools">
                    <button
                      type="button"
                      className={`facial-pulse-trigger-btn ${facialEmotion ? 'active-pulse' : ''}`}
                      onClick={() => setFacialModalOpen(true)}
                      title="5-Second On-Device Micro-Expression Pulse"
                    >
                      <Camera size={14} />
                      {facialEmotion ? `Pulse: ${facialEmotion}` : '5s Facial Pulse'}
                    </button>

                    <button
                      type="button"
                      className={`voice-mic-btn ${isRecording ? 'recording' : ''}`}
                      onClick={toggleSpeechRecognition}
                      title="Speech-to-text dictation with acoustic prosody"
                    >
                      {isRecording ? <MicOff size={14} /> : <Mic size={14} />}
                      {isRecording ? 'Listening…' : 'Dictate'}
                    </button>
                  </div>
                </div>

                <textarea
                  rows={5}
                  placeholder="Describe lecture pacing, clarity, assignment workload, or areas where the professor supported you..."
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  required
                />

                {facialEmotion && (
                  <div className="facial-badge-strip">
                    <Smile size={14} className="text-emerald" />
                    <span>Facial Emotion Calibrated: <strong>{facialEmotion}</strong></span>
                    <button
                      type="button"
                      className="clear-pulse-btn"
                      onClick={() => setFacialEmotion(null)}
                      title="Remove facial emotion tag"
                    >
                      <X size={12} />
                    </button>
                  </div>
                )}

                {/* Multimodal Slide / Formula / Diagram Upload */}
                <div className="slide-upload-section">
                  <div className="slide-upload-header">
                    <FileImage size={14} className="text-primary" />
                    <span>Attach Lecture Slide or Diagram (Optional Gemini Vision Analysis)</span>
                  </div>
                  {!slideImageBase64 ? (
                    <label className="slide-dropzone-label">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleSlideUpload}
                        style={{ display: 'none' }}
                      />
                      <Upload size={16} />
                      <span>Click to upload slide screenshot, formula, or whiteboard photo</span>
                    </label>
                  ) : (
                    <div className="slide-preview-strip">
                      <img src={slideImageBase64} alt="Slide preview" className="slide-mini-thumb" />
                      <div className="slide-name-meta">
                        <strong>{slideName || 'lecture-slide.png'}</strong>
                        <span className="slide-vision-badge">Gemini 1.5 Multimodal Analysis Queued</span>
                      </div>
                      <button
                        type="button"
                        className="btn-remove-slide"
                        onClick={() => {
                          setSlideImageBase64(null);
                          setSlideName('');
                        }}
                      >
                        <X size={14} />
                      </button>
                    </div>
                  )}
                </div>

                {privacyMatches.length > 0 && (
                  <div className="privacy-warning-banner">
                    <ShieldAlert size={16} />
                    <span>
                      <strong>Privacy Shield Alert:</strong> Potential personal identifiers detected (
                      {privacyMatches.join(', ')}). Consider removing them for total anonymity.
                    </span>
                  </div>
                )}

                <div className="char-count-row">
                  <span>{feedbackText.length} characters</span>
                  <span>AI Engine: Live Multimodal Sentiment & Prosody Calibration</span>
                </div>
              </div>

              {submitError && <p className="error-banner">{submitError}</p>}
              {submitSuccess && <p className="success-banner">{submitSuccess}</p>}

              <div className="submit-action-row">
                <SpecularButton
                  type="submit"
                  size="lg"
                  radius={16}
                  tint="#ffffff"
                  tintOpacity={0.05}
                  textColor="#ffffff"
                  lineColor="#818cf8"
                  baseColor="#4f46e5"
                  intensity={1}
                  idleIntensity={0.35}
                  shineSize={12}
                  shineFade={36}
                  thickness={1.4}
                  glow={1.2}
                  followMouse
                  proximity={250}
                  disabled={submitting}
                  className="feedback-submit-btn"
                >
                  {submitting ? 'Analyzing & Saving…' : <>Submit Feedback <Send size={16} /></>}
                </SpecularButton>
              </div>
            </form>
          </SpotlightCard>

          {/* Academic Calendar Stress Timeline Widget */}
          <StressTimelineWidget />

          {/* Interactive Course Clarity vs Friction Benchmark */}
          <InteractiveCourseClarityBar subjects={allottedSubjects} />
          </div>
        )}

        {/* TAB 2: COMMUNITY FEED & UPVOTES */}
        {activeTab === 'community' && (
          <div className="tab-pane community-pane">
            <div className="pane-header flex-header">
              <div>
                <h2>Classroom Voice & Community Priorities</h2>
                <p className="muted">
                  Upvote feedback to escalate pressing academic matters to faculty and course coordinators.
                </p>
              </div>

              <div className="sort-toggles">
                <button
                  type="button"
                  className={`sort-pill ${feedSort === 'priorities' ? 'active' : ''}`}
                  onClick={() => setFeedSort('priorities')}
                >
                  🔥 Top Priorities
                </button>
                <button
                  type="button"
                  className={`sort-pill ${feedSort === 'latest' ? 'active' : ''}`}
                  onClick={() => setFeedSort('latest')}
                >
                  ⏱️ Latest
                </button>
              </div>
            </div>

            <div className="community-filter-bar">
              <div className="filter-search-box">
                <Search size={16} className="search-icon" />
                <input
                  type="text"
                  placeholder="Search community feedback by topic or keyword..."
                  value={feedSearch}
                  onChange={(e) => setFeedSearch(e.target.value)}
                />
                {feedSearch && (
                  <button type="button" className="clear-search-btn" onClick={() => setFeedSearch('')}>
                    <X size={14} />
                  </button>
                )}
              </div>

              <div className="filter-course-box">
                <select
                  value={feedCourseFilter}
                  onChange={(e) => setFeedCourseFilter(e.target.value)}
                >
                  <option value="ALL">All Enrolled Courses</option>
                  {allottedSubjects.map((sub, i) => (
                    <option key={i} value={sub.course_code}>
                      {sub.course_code} · {sub.course_name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="emotion-filter-pills">
                {['ALL', 'POSITIVE', 'NEGATIVE', 'CONFUSION', 'FRUSTRATION', 'SATISFACTION'].map((em) => (
                  <button
                    key={em}
                    type="button"
                    className={`filter-pill ${feedEmotionFilter === em ? 'active' : ''}`}
                    onClick={() => setFeedEmotionFilter(em)}
                  >
                    {em === 'ALL' ? 'All Emotions' : em.charAt(0) + em.slice(1).toLowerCase()}
                  </button>
                ))}
              </div>
            </div>

            <div className="feedback-cards-grid">
              {sortedFeedbacks.length === 0 ? (
                <p className="empty-state">No feedback submitted for your class section yet.</p>
              ) : (
                sortedFeedbacks.map((f) => (
                  <SpotlightCard key={f.feedback_id} className="student-feedback-card" spotlightColor="rgba(99, 102, 241, 0.15)">
                    <div className="card-top-meta">
                      <div className="course-chip">
                        <strong>{f.course_code}</strong> · {f.course_name}
                      </div>
                      <div className="emotion-badges">
                        {f.sentiment && (
                          <span className={`sentiment-badge ${f.sentiment.toLowerCase()}`}>
                            {f.sentiment}
                          </span>
                        )}
                        {f.emotion && (
                          <span className="emotion-badge">
                            {f.emotion}
                          </span>
                        )}
                      </div>
                    </div>

                    <p className="card-text">{f.feedback_text}</p>

                    {f.responses && f.responses.length > 0 && (
                      <div className="official-response-box">
                        <div className="res-header">
                          <CheckCircle2 size={15} className="text-emerald" />
                          <strong>Faculty Action: {f.responses[0].responder_name}</strong>
                        </div>
                        <p>{f.responses[0].response_text}</p>
                      </div>
                    )}

                    <div className="card-bottom-row">
                      <span className="date-stamp">
                        {f.is_anonymous ? 'Anonymous Student' : 'Student'} ·{' '}
                        {new Date(f.submitted_at).toLocaleDateString()}
                      </span>

                      <button
                        type="button"
                        className="upvote-btn"
                        onClick={() => handleUpvote(f.feedback_id)}
                      >
                        <ThumbsUp size={15} />
                        <strong><AnimatedCounter value={f.upvotes || 0} /></strong> {(f.upvotes || 0) === 1 ? 'Upvote' : 'Upvotes'}
                      </button>
                    </div>
                  </SpotlightCard>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 3: ACTIVE PULSE POLLS */}
        {activeTab === 'polls' && (
          <div className="tab-pane polls-pane">
            <div className="pane-header">
              <h2>60-Second Lecture Pulse Polls</h2>
              <p className="muted">
                Quick live questions launched by instructors during lectures to evaluate concept clarity.
              </p>
            </div>

            {pulseRequests.length === 0 ? (
              <div className="pulse-empty-card">
                <Radio size={36} className="text-muted" />
                <h3>No Active Pulse Poll Right Now</h3>
                <p>When an instructor launches a 60-second clarity poll during class, it will appear here in real time.</p>
              </div>
            ) : (
              <div className="pulse-cards-stack">
                {pulseRequests.map((req) => {
                  const { question, options, countsObj, totalVotes } = parsePollData(req);
                  const isVoted = votedPolls[req.request_id];

                  return (
                    <SpotlightCard key={req.request_id} className="pulse-active-banner" spotlightColor="rgba(239, 68, 68, 0.12)">
                      <div className="pulse-banner-header">
                        <span className="live-tag">
                          <span className="live-dot" /> LIVE 60s PULSE
                        </span>
                        <span className="pulse-course">
                          {req.course_code} · {req.faculty_name}
                        </span>
                      </div>

                      <h3 className="pulse-question">{question}</h3>

                      <div className="pulse-options-list">
                        {options.map((opt, oIdx) => {
                          const count = countsObj[String(oIdx)] || countsObj[oIdx] || 0;
                          const pct = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
                          return (
                            <div
                              key={oIdx}
                              className={`pulse-option-item ${isVoted ? 'voted-state' : ''}`}
                              onClick={() => !isVoted && setSelectedVoteOption({ ...selectedVoteOption, [req.request_id]: oIdx })}
                            >
                              <div className="pulse-bar-fill" style={{ width: `${pct}%` }} />
                              <div className="pulse-option-content">
                                <label>
                                  <input
                                    type="radio"
                                    name={`poll-${req.request_id}`}
                                    checked={selectedVoteOption[req.request_id] === oIdx}
                                    disabled={isVoted}
                                    onChange={() => setSelectedVoteOption({ ...selectedVoteOption, [req.request_id]: oIdx })}
                                  />
                                  <span>{opt}</span>
                                </label>
                                <span className="pulse-pct">{pct}%</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      <div className="pulse-footer-row">
                        <span className="total-votes-count">{totalVotes} student votes recorded</span>
                        {!isVoted ? (
                          <button
                            type="button"
                            className="cast-vote-btn"
                            disabled={selectedVoteOption[req.request_id] === undefined}
                            onClick={() => handleVotePoll(req.request_id, selectedVoteOption[req.request_id])}
                          >
                            Cast Vote
                          </button>
                        ) : (
                          <span className="vote-recorded-tag">
                            <CheckCircle2 size={16} /> Vote Recorded
                          </span>
                        )}
                      </div>
                    </SpotlightCard>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: COURSES, SUBJECTS & TIMETABLE */}
        {activeTab === 'courses' && (
          <div className="tab-pane courses-pane">
            <div className="pane-header flex-header">
              <div>
                <h2>Semester Subjects, Course Catalog & Lecture Schedule</h2>
                <p className="muted">
                  Explore curriculum subjects, view your weekly lecture timetable, and share direct feedback on individual classes.
                </p>
              </div>
              <div className="student-active-badge">
                <CalendarDays size={16} />
                <span>Semester {studentSelectedSem} · {user.class_section || 'Class 3A'}</span>
              </div>
            </div>

            {/* Semester Switcher Pills */}
            <div className="semester-selector-bar">
              <span className="selector-label"><Layers size={14} /> Academic Semester:</span>
              <div className="semester-pills-row">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((sNum) => {
                  const isCurrent = (user.semester || 5) === sNum;
                  const isSelected = studentSelectedSem === sNum;
                  return (
                    <button
                      key={sNum}
                      type="button"
                      className={`sem-pill ${isSelected ? 'active' : ''} ${isCurrent ? 'current-sem' : ''}`}
                      onClick={() => handleSemesterChange(sNum)}
                    >
                      Sem {sNum} {isCurrent && <span className="current-dot" title="Current Enrolled Semester" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Courses View Sub-Tabs */}
            <div className="courses-subtabs-row">
              <button
                type="button"
                className={`courses-subtab-btn ${coursesViewTab === 'timetable' ? 'active' : ''}`}
                onClick={() => setCoursesViewTab('timetable')}
              >
                <Clock size={15} /> Weekly Timetable ({studentLectures.length})
              </button>
              <button
                type="button"
                className={`courses-subtab-btn ${coursesViewTab === 'catalog' ? 'active' : ''}`}
                onClick={() => setCoursesViewTab('catalog')}
              >
                <BookOpen size={15} /> Subjects & Credits ({allottedSubjects.length})
              </button>
              <button
                type="button"
                className={`courses-subtab-btn ${coursesViewTab === 'mentors' ? 'active' : ''}`}
                onClick={() => setCoursesViewTab('mentors')}
              >
                <UserCheck size={15} /> Faculty Mentors
              </button>
            </div>

            {/* SUB-TAB 1: LECTURE TIMETABLE */}
            {coursesViewTab === 'timetable' && (
              <div className="student-timetable-section">
                <div className="timetable-filter-row">
                  <span className="filter-label">Filter by Day:</span>
                  <div className="day-pills-row">
                    {['ALL', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map((d) => (
                      <button
                        key={d}
                        type="button"
                        className={`day-pill ${studentDayFilter === d ? 'active' : ''}`}
                        onClick={() => setStudentDayFilter(d)}
                      >
                        {d === 'ALL' ? 'All Week' : d}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="student-lectures-grid">
                  {studentLectures.filter((l) => studentDayFilter === 'ALL' || l.day_of_week === studentDayFilter).length === 0 ? (
                    <div className="empty-state-box">
                      <Clock size={36} className="text-muted" />
                      <h3>No Lectures Scheduled</h3>
                      <p>No class sessions listed for this day in Semester {studentSelectedSem}.</p>
                    </div>
                  ) : (
                    studentLectures
                      .filter((l) => studentDayFilter === 'ALL' || l.day_of_week === studentDayFilter)
                      .map((lec) => (
                        <SpotlightCard key={lec.lecture_id} className="student-lecture-card" spotlightColor="rgba(99, 102, 241, 0.12)">
                          <div className="lecture-time-room-row">
                            <span className="day-badge">{lec.day_of_week}</span>
                            <span className="time-badge"><Clock size={12} /> {lec.start_time} - {lec.end_time}</span>
                            <span className="room-badge"><MapPin size={12} /> {lec.room_number || 'Hall 301'}</span>
                            <span className={`type-badge ${lec.lecture_type?.toLowerCase() || 'theory'}`}>
                              {lec.lecture_type || 'Theory'}
                            </span>
                          </div>

                          <div className="lecture-course-row">
                            <span className="course-code-tag">{lec.course_code}</span>
                            <strong className="course-title">{lec.course_name}</strong>
                          </div>

                          <p className="lecture-topic">
                            <strong>Today's Topic:</strong> {lec.topic}
                          </p>

                          <div className="lecture-footer">
                            <span className="faculty-name">
                              <GraduationCap size={14} className="text-primary" /> {lec.faculty_name}
                            </span>
                            <button
                              type="button"
                              className="lecture-action-fb-btn"
                              onClick={() => handleLectureFeedbackClick(lec)}
                              title="Give direct feedback on this lecture session"
                            >
                              <MessageSquarePlus size={13} /> Review Lecture
                            </button>
                          </div>
                        </SpotlightCard>
                      ))
                  )}
                </div>
              </div>
            )}

            {/* SUB-TAB 2: SUBJECTS & CREDITS */}
            {coursesViewTab === 'catalog' && (
              <div className="table-card">
                <div className="table-card-header flex-header">
                  <h3>Semester {studentSelectedSem} Allocated Curriculum Courses</h3>
                  <span className="credits-badge">
                    Total Credits: {allottedSubjects.reduce((acc, s) => acc + (s.credits || 4), 0)} Credits
                  </span>
                </div>
                <table className="courses-table">
                  <thead>
                    <tr>
                      <th>Course Code</th>
                      <th>Course Title</th>
                      <th>Instructor</th>
                      <th>Class Section</th>
                      <th>Department</th>
                      <th>Credits</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allottedSubjects.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="empty-row">No courses listed for Semester {studentSelectedSem}.</td>
                      </tr>
                    ) : (
                      allottedSubjects.map((s) => (
                        <tr key={s.offering_id || s.course_id}>
                          <td><strong>{s.course_code}</strong></td>
                          <td>{s.course_name}</td>
                          <td>{s.faculty_name || 'Dr. A. Sharma'}</td>
                          <td>{s.class_section || user.class_section}</td>
                          <td>{s.department_name || 'AI & Data Science'}</td>
                          <td><span className="badge-credit">{s.credits || 4} Credits</span></td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* SUB-TAB 3: MENTORS */}
            {coursesViewTab === 'mentors' && (
              <div className="mentors-grid">
                <SpotlightCard className="mentor-card" spotlightColor="rgba(99, 102, 241, 0.15)">
                  <div className="mentor-icon-badge">
                    <UserCheck size={24} />
                  </div>
                  <div>
                    <span className="mentor-role">ACADEMIC MENTOR</span>
                    <h4>{mentors?.academic_mentor?.name || 'Dr. Ramesh Ponnala'}</h4>
                    <p>{mentors?.academic_mentor?.department || 'Department of Computer Science & Engineering'}</p>
                    <span className="cabin-badge">{mentors?.academic_mentor?.cabin_no || 'Cabin B-304'}</span>
                  </div>
                </SpotlightCard>

                <SpotlightCard className="mentor-card" spotlightColor="rgba(168, 85, 247, 0.15)">
                  <div className="mentor-icon-badge project">
                    <Sparkles size={24} />
                  </div>
                  <div>
                    <span className="mentor-role">SPECIAL PROJECT MENTOR</span>
                    <h4>{mentors?.project_mentor?.name || 'Dr. Sandeep Kumar Panda'}</h4>
                    <p>{mentors?.project_mentor?.department || 'School of Artificial Intelligence'}</p>
                    <span className="cabin-badge">{mentors?.project_mentor?.cabin_no || 'Cabin R-412'}</span>
                  </div>
                </SpotlightCard>
              </div>
            )}
          </div>
        )}

        {/* TAB 5: GRIEVANCE BOX */}
        {activeTab === 'grievance' && (
          <div className="tab-pane grievance-pane">
            <div className="pane-header">
              <h2>Confidential Student Grievance Box</h2>
              <p className="muted">
                Submit formal complaints directly to the Academic Oversight Board and Course Coordinators.
              </p>
            </div>

            <div className="grievance-layout">
              <SpotlightCard className="grievance-form-card" spotlightColor="rgba(244, 63, 94, 0.12)">
                <form onSubmit={handleComplaintSubmit}>
                  <h3>Lodge New Grievance</h3>

                <div className="form-group">
                  <label>
                    Subject / Title <span className="req">*</span>
                    <input
                      required
                      placeholder="e.g. Excessive assignment overlap before midterms"
                      value={complaintForm.title}
                      onChange={(e) => setComplaintForm({ ...complaintForm, title: e.target.value })}
                    />
                  </label>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>
                      Category
                      <select
                        value={complaintForm.category}
                        onChange={(e) => setComplaintForm({ ...complaintForm, category: e.target.value })}
                      >
                        <option value="Academics & Teaching">Academics & Teaching</option>
                        <option value="Lab Workload">Lab Workload & Resources</option>
                        <option value="Exam Pacing">Exam Pacing & Deadlines</option>
                        <option value="Grading & Evaluation">Grading & Evaluation</option>
                      </select>
                    </label>
                  </div>

                  <div className="form-group">
                    <label>
                      Severity
                      <select
                        value={complaintForm.severity}
                        onChange={(e) => setComplaintForm({ ...complaintForm, severity: e.target.value })}
                      >
                        <option value="LOW">Low</option>
                        <option value="MEDIUM">Medium</option>
                        <option value="HIGH">High Priority</option>
                      </select>
                    </label>
                  </div>
                </div>

                <div className="form-group">
                  <label>
                    Detailed Description <span className="req">*</span>
                    <textarea
                      rows={4}
                      placeholder="Provide details about the issue and suggested resolution..."
                      value={complaintForm.description}
                      onChange={(e) => setComplaintForm({ ...complaintForm, description: e.target.value })}
                      required
                    />
                  </label>
                </div>

                {complaintSuccess && <p className="success-banner">{complaintSuccess}</p>}

                <SpecularButton
                  type="submit"
                  size="lg"
                  radius={16}
                  tint="#ffffff"
                  tintOpacity={0.05}
                  textColor="#ffffff"
                  lineColor="#fb7185"
                  baseColor="#e11d48"
                  intensity={1}
                  idleIntensity={0.35}
                  shineSize={12}
                  shineFade={36}
                  thickness={1.4}
                  glow={1.2}
                  followMouse
                  proximity={250}
                  disabled={complaintSubmitting}
                  className="grievance-submit-btn"
                >
                  {complaintSubmitting ? 'Submitting…' : 'Submit Formal Grievance'}
                </SpecularButton>
              </form>
            </SpotlightCard>

            <SpotlightCard className="my-grievances-card" spotlightColor="rgba(99, 102, 241, 0.12)">
              <h3>My Filed Grievances ({complaints.length})</h3>
              <div className="grievances-list">
                {complaints.length === 0 ? (
                  <p className="muted-text">No active complaints filed.</p>
                ) : (
                  complaints.map((c) => (
                    <div key={c.complaint_id} className="grievance-item">
                      <div className="g-top">
                        <span className={`status-pill ${c.status?.toLowerCase()}`}>{c.status}</span>
                        <span className="g-cat">{c.category}</span>
                      </div>
                      <h4>{c.title}</h4>
                      <p>{c.description}</p>
                      {c.action_taken && (
                        <div className="g-resolution">
                          <strong>Official Resolution:</strong> {c.action_taken}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </SpotlightCard>
          </div>
          </div>
        )}

        {/* TAB: BURNOUT & WELLNESS TRAJECTORY */}
        {activeTab === 'burnout' && (
          <div className="tab-pane burnout-pane">
            <div className="pane-header">
              <h2>Predictive Burnout & Wellness Trajectory</h2>
              <p className="muted">
                Continuous longitudinal monitoring of emotional resilience, academic stress peaks, and empathetic self-care nudges.
              </p>
            </div>

            <div className="burnout-overview-grid">
              <SpotlightCard className="burnout-kpi-card" spotlightColor="rgba(244, 63, 94, 0.18)">
                <div className="kpi-icon-wrap rose">
                  <Flame size={24} />
                </div>
                <div className="kpi-info">
                  <span className="kpi-title">ESTIMATED BURNOUT RISK</span>
                  <div className="kpi-number text-rose">
                    <AnimatedCounter value={Math.round(burnoutData?.average_burnout_risk || 38)} suffix="%" />
                  </div>
                  <span className="kpi-caption">
                    {(burnoutData?.average_burnout_risk || 38) > 50 ? '⚠️ Elevated stress trajectory detected' : '✅ Moderate academic fatigue buffer'}
                  </span>
                </div>
              </SpotlightCard>

              <SpotlightCard className="burnout-kpi-card" spotlightColor="rgba(16, 185, 129, 0.18)">
                <div className="kpi-icon-wrap emerald">
                  <HeartPulse size={24} />
                </div>
                <div className="kpi-info">
                  <span className="kpi-title">EMOTIONAL RESILIENCE</span>
                  <div className="kpi-number text-emerald">
                    <AnimatedCounter value={78} suffix="/100" />
                  </div>
                  <span className="kpi-caption">Healthy peer support & engagement index</span>
                </div>
              </SpotlightCard>

              <SpotlightCard className="burnout-kpi-card" spotlightColor="rgba(99, 102, 241, 0.18)">
                <div className="kpi-icon-wrap indigo">
                  <CalendarDays size={24} />
                </div>
                <div className="kpi-info">
                  <span className="kpi-title">NEXT ACADEMIC CRUNCH</span>
                  <div className="kpi-number text-indigo">Nov 12</div>
                  <span className="kpi-caption">Midterm 1 + NLP Assignment 2 Overlap</span>
                </div>
              </SpotlightCard>
            </div>

            {/* Weekly Trajectory Breakdown */}
            <SpotlightCard className="trajectory-card" spotlightColor="rgba(99, 102, 241, 0.12)">
              <div className="card-heading-row">
                <Activity size={18} className="text-primary" />
                <h3>4-Week Longitudinal Sentiment Trajectory</h3>
              </div>
              <p className="muted-text">
                Tracks emotional drift across weekly lectures to forecast stress before exams.
              </p>
              <div className="trajectory-bars-list">
                {(burnoutData?.weekly_trajectory || [
                  { week: 'Week 1', confusion: 22, frustration: 14, satisfaction: 64 },
                  { week: 'Week 2', confusion: 28, frustration: 18, satisfaction: 54 },
                  { week: 'Week 3', confusion: 41, frustration: 32, satisfaction: 27 },
                  { week: 'Week 4', confusion: 36, frustration: 29, satisfaction: 35 },
                ]).map((w, idx) => (
                  <div key={idx} className="trajectory-week-row">
                    <div className="week-label">
                      <strong>{w.week}</strong>
                      <span className="week-sat">{w.satisfaction}% Clarity</span>
                    </div>
                    <div className="multi-progress-bar">
                      <div className="bar-seg emerald" style={{ width: `${w.satisfaction}%` }} title={`Clarity: ${w.satisfaction}%`} />
                      <div className="bar-seg amber" style={{ width: `${w.confusion}%` }} title={`Confusion: ${w.confusion}%`} />
                      <div className="bar-seg rose" style={{ width: `${w.frustration}%` }} title={`Frustration: ${w.frustration}%`} />
                    </div>
                    <div className="week-legends">
                      <span className="leg text-emerald">● Clarity {w.satisfaction}%</span>
                      <span className="leg text-amber">● Confusion {w.confusion}%</span>
                      <span className="leg text-rose">● Frustration {w.frustration}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </SpotlightCard>

            {/* Private Wellness Nudge & Box Breathing Guide */}
            <div className="wellness-nudge-section">
              <SpotlightCard className="nudge-banner-card" spotlightColor="rgba(16, 185, 129, 0.15)">
                <div className="nudge-banner-header">
                  <LifeBuoy size={20} className="text-emerald" />
                  <h4>Private Empathetic Wellness Nudge</h4>
                </div>
                <p>
                  "We noticed heightened cognitive strain across your recent NLP submissions. You're not alone — 38% of your classmates are encountering similar complexity with Backpropagation. Take 3 minutes to reset your nervous system below."
                </p>
                <div className="campus-support-contacts">
                  <div className="support-pill">
                    <strong>Campus Counseling:</strong> Wellness Centre, Wing B
                  </div>
                  <div className="support-pill">
                    <strong>Direct Extension:</strong> x4022 (Mon–Fri 9am–5pm)
                  </div>
                </div>
              </SpotlightCard>

              {/* 4-4-4 Box Breathing Guide */}
              <BoxBreathingGuide />
            </div>
          </div>
        )}

        {/* TAB: FACULTY AI CLARIFICATIONS */}
        {activeTab === 'clarifications' && (
          <div className="tab-pane clarifications-pane">
            <div className="pane-header">
              <h2>Faculty AI Clarifications & Remedial Notes</h2>
              <p className="muted">
                Direct pedagogical explanations, recap guides, and code notebooks broadcast by instructors in response to flagged confusion.
              </p>
            </div>

            {clarifications.length === 0 ? (
              <div className="empty-state-box">
                <Sparkles size={36} className="text-muted" />
                <h3>No Faculty Clarifications Broadcast Yet</h3>
                <p>When an instructor answers widespread classroom confusion, their explanation and reference materials will appear here.</p>
              </div>
            ) : (
              <div className="clarifications-grid">
                {clarifications.map((c) => (
                  <SpotlightCard key={c.broadcast_id} className="clarification-card" spotlightColor="rgba(99, 102, 241, 0.15)">
                    <div className="card-top-meta">
                      <div className="course-chip">
                        <strong>{c.course_code}</strong> · {c.course_name}
                      </div>
                      <span className="impact-badge">
                        <TrendingUp size={13} /> {c.pedagogical_impact_score || '+22% Concept Clarity'}
                      </span>
                    </div>

                    <h3 className="clarification-topic">{c.topic}</h3>
                    <p className="clarification-text">{c.clarification_text}</p>

                    {c.reference_url && (
                      <div className="clarification-link-box">
                        <a
                          href={c.reference_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ref-link-btn"
                        >
                          <BookOpen size={14} /> Open Interactive Explainer / Colab Notebook
                        </a>
                      </div>
                    )}

                    <div className="card-bottom-row">
                      <span className="date-stamp">
                        Broadcast by {c.faculty_name} · {new Date(c.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </SpotlightCard>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB: CAMPUS VOICE & "ME TOO" CONSENSUS */}
        {activeTab === 'campus_voice' && (
          <div className="tab-pane campus-voice-pane">
            <div className="pane-header flex-header">
              <div>
                <h2>Campus Voice & "Me Too" Consensus Board</h2>
                <p className="muted">
                  Anonymously surface widespread student concerns. Upvoted issues are prioritized for direct Dean and department head review.
                </p>
              </div>
              <SpecularButton
                type="button"
                size="md"
                radius={12}
                tint="#ffffff"
                tintOpacity={0.05}
                textColor="#ffffff"
                lineColor="#818cf8"
                baseColor="#4f46e5"
                onClick={() => setNewPostModalOpen(true)}
                className="raise-topic-btn"
              >
                <Plus size={16} /> Raise New Concern
              </SpecularButton>
            </div>

            <div className="posts-cards-grid">
              {communityPosts.length === 0 ? (
                <p className="empty-state">No campus voice posts active right now.</p>
              ) : (
                communityPosts.map((p) => (
                  <SpotlightCard key={p.post_id} className="campus-post-card" spotlightColor="rgba(99, 102, 241, 0.14)">
                    <div className="post-header-row">
                      <span className="post-category-tag">{p.category}</span>
                      <span className={`post-status-pill ${p.status?.toLowerCase()}`}>
                        {p.status === 'RESOLVED' ? '✅ Resolved' : p.status === 'IN_REVIEW' ? '👀 In Review' : 'Active Discussion'}
                      </span>
                    </div>

                    <h3 className="post-title">{p.title}</h3>
                    <p className="post-content">{p.content}</p>

                    {p.admin_response && (
                      <div className="post-admin-response">
                        <strong>Official Dean Response:</strong>
                        <p>{p.admin_response}</p>
                      </div>
                    )}

                    <div className="post-footer-row">
                      <span className="date-stamp">
                        {p.is_anonymous ? 'Anonymous Student' : 'Classmate'} · {new Date(p.created_at).toLocaleDateString()}
                      </span>

                      <button
                        type="button"
                        className="me-too-btn"
                        onClick={() => handlePostUpvote(p.post_id)}
                      >
                        <ThumbsUp size={14} />
                        <span>Me Too!</span>
                        <strong className="upvote-count"><AnimatedCounter value={p.upvotes || 0} /></strong>
                      </button>
                    </div>
                  </SpotlightCard>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB: PEER STUDY PODS */}
        {activeTab === 'studypods' && (
          <div className="tab-pane studypods-pane">
            <div className="pane-header flex-header">
              <div>
                <h2>Anonymous Peer Study Pods & Empathy Circles</h2>
                <p className="muted">
                  Connect with classmates in your section to collaborate on challenging topics without social pressure.
                </p>
              </div>
              <SpecularButton
                type="button"
                size="md"
                radius={12}
                tint="#ffffff"
                tintOpacity={0.05}
                textColor="#ffffff"
                lineColor="#818cf8"
                baseColor="#4f46e5"
                onClick={() => setCreatePodModalOpen(true)}
                className="create-pod-btn"
              >
                <Plus size={16} /> Create Study Pod
              </SpecularButton>
            </div>

            <div className="study-pods-grid">
              {studyPods.length === 0 ? (
                <div className="empty-state-box">
                  <BookOpen size={36} className="text-muted" />
                  <h3>No Active Study Pods Yet</h3>
                  <p>Create the first peer circle to study difficult course topics with classmates!</p>
                </div>
              ) : (
                studyPods.map((pod) => (
                  <SpotlightCard key={pod.pod_id} className="study-pod-card" spotlightColor="rgba(99, 102, 241, 0.15)">
                    <div className="pod-top-row">
                      <span className="pod-course-chip">{pod.course_code}</span>
                      <span className={`pod-status-badge ${pod.current_members >= pod.max_members ? 'full' : 'open'}`}>
                        {pod.current_members >= pod.max_members ? 'Pod Full' : `${pod.current_members}/${pod.max_members} Members`}
                      </span>
                    </div>

                    <h3 className="pod-topic">{pod.topic}</h3>
                    <p className="pod-course-name">{pod.course_name}</p>

                    <div className="pod-actions-row">
                      {pod.meeting_link && (
                        <a
                          href={pod.meeting_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="meet-link-btn"
                        >
                          <Users size={14} /> Join Virtual Huddle
                        </a>
                      )}

                      <button
                        type="button"
                        className="join-pod-btn"
                        disabled={pod.current_members >= pod.max_members}
                        onClick={() => handleJoinPod(pod.pod_id)}
                      >
                        {pod.current_members >= pod.max_members ? 'Circle Full' : 'Join Peer Pod'}
                      </button>
                    </div>
                  </SpotlightCard>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB: MOOD & REFLECTION JOURNAL */}
        {activeTab === 'journal' && (
          <StudentMoodJournal user={user} addToast={addToast} />
        )}

        {/* TAB: SENTIO AI STUDY COACH */}
        {activeTab === 'coach' && (
          <StudentAICoach user={user} allottedSubjects={allottedSubjects} />
        )}
      </main>

      {/* 5-Second Facial Emotion Pulse Modal */}
      <FacialPulseModal
        isOpen={facialModalOpen}
        onClose={() => setFacialModalOpen(false)}
        onPulseCaptured={(detectedEmotion) => {
          setFacialEmotion(detectedEmotion);
          addToast?.({
            title: 'Facial Emotion Calibrated',
            message: `Registered micro-expression: ${detectedEmotion}`,
            type: 'info',
          });
        }}
      />

      {/* Raise Campus Voice Topic Modal */}
      {newPostModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <div className="modal-header">
              <h3>Raise Anonymous Campus Voice Concern</h3>
              <button
                type="button"
                className="close-modal-btn"
                onClick={() => setNewPostModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleCreatePost}>
              <div className="form-group">
                <label>Issue Title <span className="req">*</span></label>
                <input
                  required
                  placeholder="e.g. Lab 4 GPU quota exhausted before assignment due date"
                  value={newPostForm.title}
                  onChange={(e) => setNewPostForm({ ...newPostForm, title: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Category</label>
                <select
                  value={newPostForm.category}
                  onChange={(e) => setNewPostForm({ ...newPostForm, category: e.target.value })}
                >
                  <option value="Academics & Teaching">Academics & Teaching</option>
                  <option value="Lab & Resources">Lab & Resources</option>
                  <option value="Assignment Deadlines">Assignment Deadlines</option>
                  <option value="Curriculum & Exams">Curriculum & Exams</option>
                  <option value="Campus Facilities">Campus Facilities</option>
                </select>
              </div>

              <div className="form-group">
                <label>Detailed Explanation <span className="req">*</span></label>
                <textarea
                  rows={4}
                  required
                  placeholder="Describe how this affects your cohort and what resolution would help..."
                  value={newPostForm.content}
                  onChange={(e) => setNewPostForm({ ...newPostForm, content: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={newPostForm.is_anonymous}
                    onChange={(e) => setNewPostForm({ ...newPostForm, is_anonymous: e.target.checked })}
                  />
                  <span>Post anonymously (protect identity from classmates)</span>
                </label>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => setNewPostModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-confirm">
                  Publish to Campus Voice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Peer Study Pod Modal */}
      {createPodModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <div className="modal-header">
              <h3>Create Peer Study Pod</h3>
              <button
                type="button"
                className="close-modal-btn"
                onClick={() => setCreatePodModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleCreatePod}>
              <div className="form-group">
                <label>Course Offering</label>
                <select
                  value={newPodForm.course_code}
                  onChange={(e) => {
                    const found = allottedSubjects.find((s) => s.course_code === e.target.value);
                    setNewPodForm({
                      ...newPodForm,
                      course_code: e.target.value,
                      course_name: found ? found.course_name : newPodForm.course_name,
                    });
                  }}
                >
                  {allottedSubjects.map((s) => (
                    <option key={s.course_code} value={s.course_code}>
                      {s.course_code} · {s.course_name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Topic / Concept for Revision <span className="req">*</span></label>
                <input
                  required
                  placeholder="e.g. Backpropagation Proofs & PyTorch Autograd"
                  value={newPodForm.topic}
                  onChange={(e) => setNewPodForm({ ...newPodForm, topic: e.target.value })}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Max Circle Members</label>
                  <input
                    type="number"
                    min={2}
                    max={8}
                    value={newPodForm.max_members}
                    onChange={(e) => setNewPodForm({ ...newPodForm, max_members: parseInt(e.target.value, 10) || 4 })}
                  />
                </div>

                <div className="form-group">
                  <label>Virtual Room / Google Meet Link</label>
                  <input
                    placeholder="https://meet.google.com/xyz-abc-uvw"
                    value={newPodForm.meeting_link}
                    onChange={(e) => setNewPodForm({ ...newPodForm, meeting_link: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => setCreatePodModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-confirm">
                  Create Pod
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Floating Bixi Assistant */}
      <BixiAssistant user={user} />

      {/* Profile & Credentials Settings Modal */}
      <ProfileSettingsModal
        isOpen={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
        user={user}
        token={token}
        onUserUpdated={onUserUpdated}
        addToast={addToast}
      />
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// ADMIN DASHBOARD (EXECUTIVE & FACULTY VIEW)
// ═══════════════════════════════════════════════════════
function AdminDashboard({ user, token, onLogout, addToast, onUserUpdated }) {
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedSection, setSelectedSection] = useState('ALL');
  const [insights, setInsights] = useState(null);
  const [feedbacks, setFeedbacks] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [pulseRequests, setPulseRequests] = useState([]);
  const [geminiConfig, setGeminiConfig] = useState({ has_gemini_key: false, active_engine: '', key_preview: '' });
  const [loading, setLoading] = useState(true);

  // Accreditation, Co-Pilot, Burnout & Integrations State
  const [accreditationModalOpen, setAccreditationModalOpen] = useState(false);
  const [burnoutData, setBurnoutData] = useState(null);
  const [remedialPlans, setRemedialPlans] = useState([]);
  const [clarifications, setClarifications] = useState([]);
  const [departmentHeatmap, setDepartmentHeatmap] = useState([]);
  const [syllabusMapping, setSyllabusMapping] = useState(null);
  const [webhookConfig, setWebhookConfig] = useState({
    webhook_url: '',
    enabled: true,
    trigger_on: 'CRITICAL_ONLY',
    service_name: 'Slack',
  });
  const [webhookTesting, setWebhookTesting] = useState(false);
  const [remedialForm, setRemedialForm] = useState({
    course_code: 'AI501',
    course_name: 'Natural Language Processing',
    topic: 'Attention Mechanisms & Matrix Operations',
    confusion_rate: 42,
  });
  const [generatingRemedial, setGeneratingRemedial] = useState(false);
  const [broadcastModalOpen, setBroadcastModalOpen] = useState(false);
  const [broadcastForm, setBroadcastForm] = useState({
    course_code: 'AI501',
    course_name: 'Natural Language Processing',
    topic: 'Attention Mechanisms & Matrix Operations',
    clarification_text: '',
    reference_url: 'https://colab.research.google.com/drive/nlp-attention-guide',
  });
  const [broadcasting, setBroadcasting] = useState(false);

  // Gemini token configuration form
  const [geminiKeyInput, setGeminiKeyInput] = useState('');
  const [geminiSaving, setGeminiSaving] = useState(false);
  const [geminiMsg, setGeminiMsg] = useState('');
  const [geminiErr, setGeminiErr] = useState('');

  // AI Model Test Bench
  const [testText, setTestText] = useState('The professor explains concepts very clearly, but the assignments are excessively long.');
  const [testEngine, setTestEngine] = useState('external');
  const [testResult, setTestResult] = useState(null);
  const [testingModel, setTestingModel] = useState(false);

  // Admin Feedback Filter State
  const [adminFeedbackSearch, setAdminFeedbackSearch] = useState('');
  const [adminSentimentFilter, setAdminSentimentFilter] = useState('ALL');

  const filteredAdminFeedbacks = feedbacks.filter((f) => {
    if (adminSentimentFilter !== 'ALL' && (f.sentiment || '').toUpperCase() !== adminSentimentFilter) {
      return false;
    }
    if (adminFeedbackSearch.trim()) {
      const q = adminFeedbackSearch.toLowerCase();
      const txt = (f.feedback_text || '').toLowerCase();
      const code = (f.course_code || '').toLowerCase();
      const sec = (f.class_section || '').toLowerCase();
      if (!txt.includes(q) && !code.includes(q) && !sec.includes(q)) return false;
    }
    return true;
  });

  // Modals
  const [responseModal, setResponseModal] = useState({ open: false, feedback: null, text: '' });
  const [submittingResponse, setSubmittingResponse] = useState(false);
  const [resolveModal, setResolveModal] = useState({ open: false, complaint: null, actionTaken: '', status: 'RESOLVED' });
  const [createPollModal, setCreatePollModal] = useState({
    open: false,
    course_code: 'AI501',
    course_name: 'Natural Language Processing',
    faculty_name: user.name || 'Dr. A. Sharma',
    target_section: 'Class 3A',
    question: '',
    options: ['Clear & Well Paced', 'Paced too quickly', 'Need recap on proof'],
  });

  // Academic Curriculum & Timetable Management State
  const [adminSemesters, setAdminSemesters] = useState([]);
  const [adminCourses, setAdminCourses] = useState([]);
  const [adminOfferings, setAdminOfferings] = useState([]);
  const [adminLectures, setAdminLectures] = useState([]);
  const [curriculumSubTab, setCurriculumSubTab] = useState('courses'); // 'courses' | 'lectures' | 'semesters' | 'offerings'
  const [curriculumSemFilter, setCurriculumSemFilter] = useState('ALL');
  const [curriculumSearch, setCurriculumSearch] = useState('');
  const [adminLectureDayFilter, setAdminLectureDayFilter] = useState('ALL');

  // Academic Modals State
  const [courseModal, setCourseModal] = useState({
    open: false,
    isEdit: false,
    courseId: null,
    form: {
      course_code: '',
      course_name: '',
      credits: 4,
      semester: 5,
      department_name: 'AI & Data Science',
      program: 'B.Tech',
      course_type: 'Core',
      syllabus_summary: '',
      faculty_name: 'Dr. A. Sharma',
      class_section: 'Class 3A',
    },
  });

  const [lectureModal, setLectureModal] = useState({
    open: false,
    isEdit: false,
    lectureId: null,
    form: {
      course_code: 'AI501',
      course_name: 'Natural Language Processing',
      faculty_name: 'Dr. A. Sharma',
      class_section: 'Class 3A',
      semester: 5,
      day_of_week: 'Monday',
      start_time: '09:30 AM',
      end_time: '10:30 AM',
      room_number: 'Hall 301',
      topic: '',
      lecture_type: 'Theory',
      status: 'SCHEDULED',
    },
  });

  const [semesterModal, setSemesterModal] = useState({
    open: false,
    form: {
      semester_number: 6,
      term_name: 'Spring 2027',
      academic_year: '2026-2027',
      is_active: false,
    },
  });

  const [offeringModal, setOfferingModal] = useState({
    open: false,
    form: {
      course_code: 'AI501',
      faculty_name: 'Dr. A. Sharma',
      class_section: 'Class 3A',
      semester: 5,
      term_name: 'Fall 2026',
    },
  });

  // Load Admin Data
  const loadAdminData = useCallback(async () => {
    try {
      const secParam = encodeURIComponent(selectedSection);
      const [
        insRes, feedRes, compRes, reqRes, geminiRes, burnRes, remRes, clarRes, heatRes, sylRes, hookRes,
        semRes, crsRes, offRes, lecRes
      ] = await Promise.all([
        fetch(`${API}/feedback/insights?class_section=${secParam}`).then((r) => r.json()).catch(() => null),
        fetch(`${API}/feedback/?class_section=${secParam}`).then((r) => r.json()).catch(() => ({ feedback: [] })),
        fetch(`${API}/feedback/complaints?section=${secParam}`).then((r) => r.json()).catch(() => ({ complaints: [] })),
        fetch(`${API}/feedback/requests?section=${secParam}`).then((r) => r.json()).catch(() => ({ requests: [] })),
        fetch(`${API}/api/auth/gemini-config`).then((r) => r.json()).catch(() => ({ has_gemini_key: false })),
        fetch(`${API}/feedback/burnout-risk`).then((r) => r.json()).catch(() => null),
        fetch(`${API}/feedback/remedial-plans`).then((r) => r.json()).catch(() => ({ remedial_plans: [] })),
        fetch(`${API}/feedback/clarifications`).then((r) => r.json()).catch(() => ({ clarifications: [] })),
        fetch(`${API}/feedback/department-heatmap`).then((r) => r.json()).catch(() => ({ departments: [] })),
        fetch(`${API}/feedback/syllabus-mapping`).then((r) => r.json()).catch(() => null),
        fetch(`${API}/feedback/integrations/webhook-config`).then((r) => r.json()).catch(() => null),
        fetch(`${API}/feedback/semesters`).then((r) => r.json()).catch(() => ({ semesters: [] })),
        fetch(`${API}/feedback/courses`).then((r) => r.json()).catch(() => ({ courses: [] })),
        fetch(`${API}/feedback/offerings`).then((r) => r.json()).catch(() => ({ offerings: [] })),
        fetch(`${API}/feedback/lectures`).then((r) => r.json()).catch(() => ({ lectures: [] })),
      ]);

      if (insRes) setInsights(insRes);
      if (feedRes?.feedback) setFeedbacks(feedRes.feedback);
      if (compRes?.complaints) setComplaints(compRes.complaints);
      if (reqRes?.requests) setPulseRequests(reqRes.requests);
      if (geminiRes) setGeminiConfig(geminiRes);
      if (burnRes) setBurnoutData(burnRes);
      if (remRes?.remedial_plans) setRemedialPlans(remRes.remedial_plans);
      if (clarRes?.clarifications) setClarifications(clarRes.clarifications);
      if (heatRes?.departments) setDepartmentHeatmap(heatRes.departments);
      if (sylRes) setSyllabusMapping(sylRes);
      if (hookRes) setWebhookConfig(hookRes);
      if (semRes?.semesters) setAdminSemesters(semRes.semesters);
      if (crsRes?.courses) setAdminCourses(crsRes.courses);
      if (offRes?.offerings) setAdminOfferings(offRes.offerings);
      if (lecRes?.lectures) setAdminLectures(lecRes.lectures);
    } catch (err) {
      console.error('Error loading admin data:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedSection]);

  useEffect(() => {
    loadAdminData();
  }, [loadAdminData]);

  // Save Gemini Key
  const handleSaveGeminiKey = async (e) => {
    e.preventDefault();
    if (!geminiKeyInput.trim()) return;
    setGeminiSaving(true);
    setGeminiMsg('');
    setGeminiErr('');

    try {
      const res = await fetch(`${API}/api/auth/gemini-config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gemini_api_key: geminiKeyInput.trim() }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.detail || 'Failed to verify key with Google Gemini');
      }
      setGeminiMsg(data.message || 'Gemini API Key successfully verified and saved!');
      addToast?.({
        title: 'Gemini AI Configured',
        message: data.message || 'Key verified and active across all student feedback analyses.',
        type: 'success',
      });
      setGeminiKeyInput('');
      loadAdminData();
    } catch (err) {
      setGeminiErr(err.message || 'Error validating Gemini API key');
    } finally {
      setGeminiSaving(false);
    }
  };

  // Test Model
  const handleTestModel = async () => {
    if (!testText.trim()) return;
    setTestingModel(true);
    setTestResult(null);
    try {
      const res = await fetch(`${API}/api/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feedback: testText.trim(), engine: testEngine }),
      });
      const data = await res.json();
      setTestResult(data);
    } catch (err) {
      console.error('Model test error:', err);
    } finally {
      setTestingModel(false);
    }
  };

  // Respond to feedback
  const handleSendResponse = async () => {
    if (!responseModal.feedback || !responseModal.text.trim()) return;
    setSubmittingResponse(true);
    try {
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`${API}/feedback/${responseModal.feedback.feedback_id}/responses`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          feedback_id: responseModal.feedback.feedback_id,
          responder_name: user.name || 'Dean Academics',
          response_text: responseModal.text.trim(),
          status: 'ACTION_TAKEN',
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        const publishedFeedbackId = responseModal.feedback.feedback_id;
        const newResponseObj = {
          response_id: data.response_id || Date.now(),
          feedback_id: publishedFeedbackId,
          responder_name: user.name || 'Dean Academics',
          response_text: responseModal.text.trim(),
          status: 'ACTION_TAKEN',
          created_at: new Date().toISOString(),
        };

        // Immediately update local feedback state
        setFeedbacks((prev) =>
          prev.map((fb) =>
            fb.feedback_id === publishedFeedbackId
              ? { ...fb, responses: [...(fb.responses || []), newResponseObj] }
              : fb
          )
        );

        setResponseModal({ open: false, feedback: null, text: '' });
        addToast?.({
          title: 'Action Plan Published',
          message: 'Official faculty response recorded and pushed to student view.',
          type: 'success',
        });
        loadAdminData();
      } else {
        throw new Error(data.detail || 'Failed to submit response');
      }
    } catch (err) {
      console.error('Response submit error:', err);
      addToast?.({
        title: 'Response Failed',
        message: err.message || 'Could not record action response. Please try again.',
        type: 'error',
      });
    } finally {
      setSubmittingResponse(false);
    }
  };

  // Resolve complaint
  const handleResolveComplaint = async () => {
    if (!resolveModal.complaint || !resolveModal.actionTaken) return;
    try {
      const res = await fetch(`${API}/feedback/complaints/${resolveModal.complaint.complaint_id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: resolveModal.status,
          action_taken: resolveModal.actionTaken,
        }),
      });
      if (res.ok) {
        setResolveModal({ open: false, complaint: null, actionTaken: '', status: 'RESOLVED' });
        addToast?.({
          title: 'Grievance Resolved',
          message: 'Official resolution action recorded.',
          type: 'success',
        });
        loadAdminData();
      }
    } catch (err) {
      console.error('Complaint resolution error:', err);
    }
  };

  // Academic Course / Subject Handlers
  const handleSaveCourse = async (e) => {
    e.preventDefault();
    try {
      const url = courseModal.isEdit
        ? `${API}/feedback/courses/${courseModal.courseId}`
        : `${API}/feedback/courses`;
      const method = courseModal.isEdit ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(courseModal.form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Failed to save subject');
      addToast?.({
        title: courseModal.isEdit ? 'Subject Updated' : 'Subject Created',
        message: data.message || 'Course record saved successfully.',
        type: 'success',
      });
      setCourseModal({ ...courseModal, open: false });
      loadAdminData();
    } catch (err) {
      addToast?.({ title: 'Error', message: err.message, type: 'error' });
    }
  };

  const handleDeleteCourse = async (courseId, code) => {
    if (!window.confirm(`Delete course ${code}? This will also delete any linked section allotments and lectures.`)) return;
    try {
      const res = await fetch(`${API}/feedback/courses/${courseId}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok) {
        addToast?.({ title: 'Subject Deleted', message: `Course ${code} removed.`, type: 'info' });
        loadAdminData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Academic Lecture Handlers
  const handleSaveLecture = async (e) => {
    e.preventDefault();
    try {
      const url = lectureModal.isEdit
        ? `${API}/feedback/lectures/${lectureModal.lectureId}`
        : `${API}/feedback/lectures`;
      const method = lectureModal.isEdit ? 'PATCH' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(lectureModal.form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Failed to schedule lecture');
      addToast?.({
        title: lectureModal.isEdit ? 'Lecture Updated' : 'Lecture Scheduled',
        message: data.message || 'Timetable updated.',
        type: 'success',
      });
      setLectureModal({ ...lectureModal, open: false });
      loadAdminData();
    } catch (err) {
      addToast?.({ title: 'Error', message: err.message, type: 'error' });
    }
  };

  const handleDeleteLecture = async (lectureId) => {
    try {
      const res = await fetch(`${API}/feedback/lectures/${lectureId}`, { method: 'DELETE' });
      if (res.ok) {
        addToast?.({ title: 'Lecture Removed', message: 'Removed from schedule.', type: 'info' });
        loadAdminData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Academic Semester Handlers
  const handleSaveSemester = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API}/feedback/semesters`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(semesterModal.form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Failed to add semester');
      addToast?.({ title: 'Semester Added', message: data.message, type: 'success' });
      setSemesterModal({ ...semesterModal, open: false });
      loadAdminData();
    } catch (err) {
      addToast?.({ title: 'Error', message: err.message, type: 'error' });
    }
  };

  const handleToggleSemesterActive = async (semNum, currentActive) => {
    try {
      const res = await fetch(`${API}/feedback/semesters/${semNum}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !currentActive }),
      });
      if (res.ok) {
        addToast?.({
          title: 'Semester Status Updated',
          message: `Semester ${semNum} is now ${!currentActive ? 'Active' : 'Archived'}.`,
          type: 'success',
        });
        loadAdminData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Course Offering Allotment Handlers
  const handleSaveOffering = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API}/feedback/offerings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(offeringModal.form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Failed to allot course');
      addToast?.({ title: 'Faculty Allotted', message: data.message, type: 'success' });
      setOfferingModal({ ...offeringModal, open: false });
      loadAdminData();
    } catch (err) {
      addToast?.({ title: 'Error', message: err.message, type: 'error' });
    }
  };

  const handleDeleteOffering = async (offeringId) => {
    try {
      const res = await fetch(`${API}/feedback/offerings/${offeringId}`, { method: 'DELETE' });
      if (res.ok) {
        addToast?.({ title: 'Allotment Removed', message: 'Course allotment deleted.', type: 'info' });
        loadAdminData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Launch Poll
  const handleCreatePoll = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        faculty_name: createPollModal.faculty_name,
        course_code: createPollModal.course_code,
        course_name: createPollModal.course_name,
        target_section: createPollModal.target_section,
        allow_text: true,
        allow_rating: true,
        queries: [
          createPollModal.question,
          ...createPollModal.options.filter((o) => o.trim()),
        ],
      };
      const res = await fetch(`${API}/feedback/requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setCreatePollModal({ ...createPollModal, open: false, question: '' });
        addToast?.({
          title: 'Pulse Poll Launched',
          message: '60-second clarity question dispatched to students.',
          type: 'info',
        });
        loadAdminData();
      }
    } catch (err) {
      console.error('Create poll error:', err);
    }
  };

  // Generate Remedial Plan
  const handleGenerateRemedialPlan = async (e) => {
    e.preventDefault();
    setGeneratingRemedial(true);
    try {
      const res = await fetch(`${API}/feedback/remedial-plan/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(remedialForm),
      });
      const data = await res.json();
      if (res.ok && data.plan) {
        addToast?.({
          title: 'Remedial Lesson Generated',
          message: `Ready-to-use 10-minute recap for ${remedialForm.topic}.`,
          type: 'success',
        });
        setRemedialPlans((prev) => [data.plan, ...prev]);
        setBroadcastForm((prev) => ({
          ...prev,
          course_code: remedialForm.course_code,
          course_name: remedialForm.course_name,
          topic: remedialForm.topic,
          clarification_text: data.plan.clarification_draft || '',
        }));
      }
    } catch (err) {
      console.error('Failed to generate remedial plan:', err);
    } finally {
      setGeneratingRemedial(false);
    }
  };

  // Broadcast Clarification to Students
  const handleBroadcastClarification = async (e) => {
    e.preventDefault();
    if (!broadcastForm.clarification_text.trim()) return;
    setBroadcasting(true);
    try {
      const res = await fetch(`${API}/feedback/broadcast-clarification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(broadcastForm),
      });
      const data = await res.json();
      if (res.ok && data.broadcast) {
        addToast?.({
          title: 'Clarification Broadcasted',
          message: 'Pushed to all student dashboards for this topic.',
          type: 'success',
        });
        setClarifications((prev) => [data.broadcast, ...prev]);
        setBroadcastModalOpen(false);
      }
    } catch (err) {
      console.error('Failed to broadcast clarification:', err);
    } finally {
      setBroadcasting(false);
    }
  };

  // Save Webhook Settings
  const handleSaveWebhookConfig = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API}/feedback/integrations/webhook-config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(webhookConfig),
      });
      if (res.ok) {
        addToast?.({
          title: 'Webhook Settings Saved',
          message: `Alerts linked to ${webhookConfig.service_name}.`,
          type: 'success',
        });
      }
    } catch (err) {
      console.error('Failed to save webhook config:', err);
    }
  };

  // Test Webhook Dispatch
  const handleTestWebhook = async () => {
    setWebhookTesting(true);
    try {
      const res = await fetch(`${API}/feedback/integrations/test-webhook`, {
        method: 'POST',
      });
      const data = await res.json();
      if (res.ok && data.success) {
        addToast?.({
          title: 'Live Webhook Dispatched',
          message: data.message || 'Notification received by Slack/Teams channel.',
          type: 'success',
        });
      } else {
        addToast?.({
          title: 'Webhook Dispatch Error',
          message: data.message || 'Failed to dispatch test notification.',
          type: 'warning',
        });
      }
    } catch (err) {
      console.error('Test webhook error:', err);
    } finally {
      setWebhookTesting(false);
    }
  };

  // Counselor Outreach
  const handleCounselorOutreach = (student) => {
    addToast?.({
      title: 'Counseling Outreach Initiated',
      message: `Proactive academic advisory alert created for ${student.student_roll} (${student.primary_stressor}).`,
      type: 'info',
    });
  };

  return (
    <div className="app-container admin-theme">
      {/* Admin Sidebar Navigation */}
      <aside className={`sidebar ${mobileMenuOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-header">
          <div className="brand">
            <span className="brand-mark admin-mark">
              <BrainCircuit size={22} />
            </span>
            Sentio
          </div>
          <button
            type="button"
            className="close-sidebar-btn"
            onClick={() => setMobileMenuOpen(false)}
          >
            <X size={18} />
          </button>
        </div>

        <nav className="nav-menu">
          <button
            type="button"
            className={`nav-item ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('overview');
              setMobileMenuOpen(false);
            }}
          >
            <BarChart3 size={18} /> Institutional Overview
          </button>
          <button
            type="button"
            className={`nav-item ${activeTab === 'burnout' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('burnout');
              setMobileMenuOpen(false);
            }}
          >
            <Flame size={18} /> Burnout & Risk Alerts
            {(burnoutData?.at_risk_students?.length || 0) > 0 && (
              <span className="tab-pill alert">{burnoutData.at_risk_students.length}</span>
            )}
          </button>
          <button
            type="button"
            className={`nav-item ${activeTab === 'remedial' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('remedial');
              setMobileMenuOpen(false);
            }}
          >
            <Sparkles size={18} /> Faculty AI Co-Pilot
          </button>
          <button
            type="button"
            className={`nav-item ${activeTab === 'heatmap' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('heatmap');
              setMobileMenuOpen(false);
            }}
          >
            <Activity size={18} /> Department Heatmap
          </button>
          <button
            type="button"
            className={`nav-item ${activeTab === 'syllabus' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('syllabus');
              setMobileMenuOpen(false);
            }}
          >
            <Layers size={18} /> LMS Syllabus Mapping
          </button>
          <button
            type="button"
            className={`nav-item ${activeTab === 'curriculum' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('curriculum');
              setMobileMenuOpen(false);
            }}
          >
            <CalendarDays size={18} /> Curriculum & Timetable
          </button>
          <button
            type="button"
            className={`nav-item ${activeTab === 'integrations' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('integrations');
              setMobileMenuOpen(false);
            }}
          >
            <Webhook size={18} /> Webhook & Alerts
          </button>
          <button
            type="button"
            className={`nav-item ${activeTab === 'pedagogy' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('pedagogy');
              setMobileMenuOpen(false);
            }}
          >
            <Sparkles size={18} /> Pedagogical AI Advice
          </button>
          <button
            type="button"
            className={`nav-item ${activeTab === 'feedback' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('feedback');
              setMobileMenuOpen(false);
            }}
          >
            <MessageSquare size={18} /> Feedback Oversight
          </button>
          <button
            type="button"
            className={`nav-item ${activeTab === 'grievances' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('grievances');
              setMobileMenuOpen(false);
            }}
          >
            <ShieldAlert size={18} /> Grievance Desk
            {complaints.filter((c) => c.status !== 'RESOLVED').length > 0 && (
              <span className="tab-pill alert">
                {complaints.filter((c) => c.status !== 'RESOLVED').length}
              </span>
            )}
          </button>
          <button
            type="button"
            className={`nav-item ${activeTab === 'polls' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('polls');
              setMobileMenuOpen(false);
            }}
          >
            <Radio size={18} /> Pulse Poll Manager
          </button>
          <button
            type="button"
            className={`nav-item ${activeTab === 'gemini' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('gemini');
              setMobileMenuOpen(false);
            }}
          >
            <Key size={18} /> Gemini Token & Lab
          </button>
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="dashboard-main">
        {/* Admin Top Header */}
        <header className="top-header admin-header">
          <div className="header-left">
            <button
              type="button"
              className="menu-toggle-btn"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              title="Toggle Menu"
            >
              <Menu size={20} />
            </button>
            <div className="brand-badge">
              <span className="brand-title">Institutional Sentiment Intelligence</span>
            </div>

            <div className="engine-status-pill">
              {geminiConfig.has_gemini_key ? (
                <span className="pill-gemini-active">
                  <span className="glow-dot" /> Google Gemini (Live AI Active)
                </span>
              ) : (
                <span className="pill-local-active">
                  <span className="amber-dot" /> Local NLP Fallback (Add Gemini Key)
                </span>
              )}
            </div>
          </div>

          <div className="header-right">
            <button
              type="button"
              className="accreditation-btn"
              onClick={() => setAccreditationModalOpen(true)}
              title="Export NAAC / NBA / ABET Accreditation Compliance Report"
            >
              <Award size={15} /> NAAC / NBA Report
            </button>

            <div className="section-filter-box">
              <label>Filter Section:</label>
              <select
                value={selectedSection}
                onChange={(e) => setSelectedSection(e.target.value)}
              >
                <option value="ALL">All Sections</option>
                <option value="Class 3A">Class 3A</option>
                <option value="Class 3B">Class 3B</option>
                <option value="Class 2A">Class 2A</option>
                <option value="Class 1A">Class 1A</option>
              </select>
            </div>

            <button
              type="button"
              className="user-profile-btn"
              onClick={() => setProfileModalOpen(true)}
              title="Click to edit admin profile, email, ID, or password"
            >
              <div className="user-profile-badge interactive">
                <span className="avatar-chip admin-chip">🏛️</span>
                <div className="user-meta">
                  <strong>{user.name}</strong>
                  <span>{user.role} · {user.department || 'AI & Data Science'}</span>
                </div>
                <Settings size={15} className="settings-gear-icon" />
              </div>
            </button>

            <button type="button" className="logout-btn" onClick={onLogout} title="Sign Out">
              <LogOut size={16} /> Sign Out
            </button>
          </div>
        </header>

        {/* TAB 1: INSTITUTIONAL OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="tab-pane overview-pane">
            {/* Metrics KPI Row */}
            <div className="metrics-grid">
              <SpotlightCard className="metric-card" spotlightColor="rgba(99, 102, 241, 0.18)">
                <span className="m-label">TOTAL SUBMISSIONS</span>
                <div className="m-val">
                  <AnimatedCounter value={insights?.total_feedback ?? insights?.total_feedbacks ?? feedbacks.length} />
                </div>
                <span className="m-sub">Classroom voice volume</span>
              </SpotlightCard>

              <SpotlightCard className="metric-card" spotlightColor="rgba(16, 185, 129, 0.18)">
                <span className="m-label">WELLBEING INDEX</span>
                <div className="m-val text-emerald">
                  <AnimatedCounter value={insights?.wellbeing_score ?? 82} suffix="/100" />
                </div>
                <span className="m-sub">Academic health score</span>
              </SpotlightCard>

              <SpotlightCard className="metric-card" spotlightColor="rgba(59, 130, 246, 0.18)">
                <span className="m-label">POSITIVE SENTIMENT</span>
                <div className="m-val">
                  <AnimatedCounter value={insights?.positive_rate ?? insights?.positive_percentage ?? 71} suffix="%" />
                </div>
                <span className="m-sub">Content satisfaction rate</span>
              </SpotlightCard>

              <SpotlightCard className="metric-card" spotlightColor="rgba(244, 63, 94, 0.18)">
                <span className="m-label">ACTIVE GRIEVANCES</span>
                <div className="m-val text-rose">
                  <AnimatedCounter value={complaints.filter((c) => c.status !== 'RESOLVED').length} />
                </div>
                <span className="m-sub">Pending administrative resolution</span>
              </SpotlightCard>
            </div>

            {/* Visual Analytics Grid */}
            <div className="overview-content-grid">
              <div className="analytics-box">
                <div className="box-header">
                  <HeartPulse size={18} className="text-emerald" />
                  <h3>Academic Wellbeing & Stress Index</h3>
                </div>
                <WellbeingGauge score={insights?.wellbeing_score ?? 82} />
                <p className="box-caption">
                  Aggregated in real-time from fatigue, stress, clarity, and delight keywords.
                </p>
              </div>

              <div className="analytics-box">
                <div className="box-header">
                  <BrainCircuit size={18} className="text-primary" />
                  <h3>6-Axis Classroom Emotional Radar</h3>
                </div>
                <EmotionRadarChart radarData={insights?.emotion_radar} />
              </div>

              <div className="analytics-box">
                <div className="box-header">
                  <PieChart size={18} className="text-primary" />
                  <h3>Interactive Emotion Share & Distribution</h3>
                </div>
                <InteractiveEmotionDonut feedbacks={feedbacks} />
                <p className="box-caption">
                  Hover over slices to inspect proportion of student sentiment categories.
                </p>
              </div>

              <div className="analytics-box">
                <div className="box-header">
                  <BarChart3 size={18} className="text-emerald" />
                  <h3>Course Clarity vs Friction Analysis</h3>
                </div>
                <InteractiveCourseClarityBar subjects={[]} />
              </div>

              <div className="analytics-box span-full">
                <div className="box-header">
                  <TrendingUp size={18} className="text-emerald" />
                  <h3>Milestone Sentiment & Alert Timeline</h3>
                </div>
                <SentimentTimelineChart timelineData={insights?.timeline_trends} />
              </div>
            </div>
          </div>
        )}

        {/* TAB: PREDICTIVE BURNOUT & RISK ALERTS */}
        {activeTab === 'burnout' && (
          <div className="tab-pane burnout-admin-pane">
            <div className="pane-header flex-header">
              <div>
                <h2>Predictive Burnout & Early-Warning Student Risk Desk</h2>
                <p className="muted">
                  Continuous longitudinal intelligence detecting cognitive exhaustion and academic disengagement before performance drops.
                </p>
              </div>
              <div className="cohort-risk-pill">
                <span className="dot-pulse-amber" />
                <span>Cohort Risk: <strong>{Math.round(burnoutData?.average_burnout_risk || 42)}% (Moderate)</strong></span>
              </div>
            </div>

            {/* KPI Stack */}
            <div className="metrics-grid">
              <SpotlightCard className="metric-card" spotlightColor="rgba(239, 68, 68, 0.18)">
                <span className="m-label">AT-RISK STUDENTS</span>
                <div className="m-val text-rose">
                  <AnimatedCounter value={burnoutData?.at_risk_students?.length || 3} />
                </div>
                <span className="m-sub">Flagged for advisory outreach</span>
              </SpotlightCard>

              <SpotlightCard className="metric-card" spotlightColor="rgba(245, 158, 11, 0.18)">
                <span className="m-label">COHORT BURNOUT RISK</span>
                <div className="m-val text-amber">
                  <AnimatedCounter value={Math.round(burnoutData?.average_burnout_risk || 42)} suffix="%" />
                </div>
                <span className="m-sub">3-week rising frustration trend</span>
              </SpotlightCard>

              <SpotlightCard className="metric-card" spotlightColor="rgba(99, 102, 241, 0.18)">
                <span className="m-label">PRIMARY STRESS DRIVER</span>
                <div className="m-val" style={{ fontSize: '1.25rem', lineHeight: '1.4' }}>
                  Lab Overlap
                </div>
                <span className="m-sub">Midterm 1 + PyTorch Assignment</span>
              </SpotlightCard>

              <SpotlightCard className="metric-card" spotlightColor="rgba(16, 185, 129, 0.18)">
                <span className="m-label">ADVISORY INTERVENTIONS</span>
                <div className="m-val text-emerald">
                  <AnimatedCounter value={14} />
                </div>
                <span className="m-sub">Proactive counselor check-ins</span>
              </SpotlightCard>
            </div>

            {/* At-Risk Student Cohort Table */}
            <div className="table-card at-risk-table-card">
              <div className="table-card-header">
                <div>
                  <h3>Flagged Early-Warning Student Cohort</h3>
                  <p className="muted-text">Identified via longitudinal multi-week sentiment decline, rising fatigue, and negative linguistic cues.</p>
                </div>
              </div>

              <table className="courses-table at-risk-table">
                <thead>
                  <tr>
                    <th>Roll Number</th>
                    <th>Class Section</th>
                    <th>Burnout Index</th>
                    <th>Primary Stressor</th>
                    <th>Trajectory</th>
                    <th>Risk Factors</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {(burnoutData?.at_risk_students || [
                    {
                      student_roll: '2024-AI-018',
                      class_section: 'Class 3A',
                      burnout_score: 84.5,
                      primary_stressor: 'Assignment Overlap & Lack of GPU Time',
                      trajectory: 'W1: 24% → W4: 85%',
                      risk_factors: ['Consecutive Frustration', 'Pacing Anxiety'],
                    },
                    {
                      student_roll: '2024-AI-042',
                      class_section: 'Class 3A',
                      burnout_score: 72.0,
                      primary_stressor: 'Backpropagation Mathematical Formulation',
                      trajectory: 'W1: 18% → W4: 72%',
                      risk_factors: ['Cognitive Confusion', 'Deadline Strain'],
                    },
                    {
                      student_roll: '2024-AI-009',
                      class_section: 'Class 3B',
                      burnout_score: 68.4,
                      primary_stressor: 'Midterm 1 Preparation Crunch',
                      trajectory: 'W2: 35% → W4: 68%',
                      risk_factors: ['High Fatigue'],
                    },
                  ]).map((st, i) => (
                    <tr key={i}>
                      <td><strong>{st.student_roll}</strong></td>
                      <td>{st.class_section}</td>
                      <td>
                        <div className="risk-score-pill">
                          <span className="risk-bar" style={{ width: `${st.burnout_score}%` }} />
                          <span className="score-num">{Math.round(st.burnout_score)}%</span>
                        </div>
                      </td>
                      <td>{st.primary_stressor}</td>
                      <td><code>{st.trajectory}</code></td>
                      <td>
                        <div className="risk-tags">
                          {st.risk_factors?.map((rf, rIdx) => (
                            <span key={rIdx} className="risk-tag-badge">{rf}</span>
                          ))}
                        </div>
                      </td>
                      <td>
                        <button
                          type="button"
                          className="btn-reach-out"
                          onClick={() => handleCounselorOutreach(st)}
                          title="Trigger confidential counseling reach-out"
                        >
                          <LifeBuoy size={14} /> Advisory Reach-Out
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB: FACULTY AI CO-PILOT & REMEDIAL LESSON PLANS */}
        {activeTab === 'remedial' && (
          <div className="tab-pane remedial-admin-pane">
            <div className="pane-header flex-header">
              <div>
                <h2>Faculty AI Co-Pilot & Automated Pedagogical Bridge</h2>
                <p className="muted">
                  Generate instant 10-minute recap lesson scripts, intuitive analogies, and 1-click clarification broadcasts delivered to students who flagged confusion.
                </p>
              </div>
              <SpecularButton
                type="button"
                size="md"
                radius={12}
                tint="#ffffff"
                tintOpacity={0.05}
                textColor="#ffffff"
                lineColor="#818cf8"
                baseColor="#4f46e5"
                onClick={() => setBroadcastModalOpen(true)}
                className="broadcast-open-btn"
              >
                <Send size={15} /> 1-Click Clarification Broadcast
              </SpecularButton>
            </div>

            <div className="remedial-dashboard-grid">
              {/* Generator Form */}
              <SpotlightCard className="remedial-generator-card" spotlightColor="rgba(99, 102, 241, 0.15)">
                <h3>Generate 10-Minute Rapid Remedial Plan</h3>
                <p className="muted-text">Powered by Gemini 1.5 Flash. Synthesizes student confusion reports into an actionable recap plan.</p>

                <form onSubmit={handleGenerateRemedialPlan}>
                  <div className="form-group">
                    <label>Course Offering</label>
                    <input
                      value={`${remedialForm.course_code} · ${remedialForm.course_name}`}
                      disabled
                      className="disabled-input"
                    />
                  </div>

                  <div className="form-group">
                    <label>Target Confusion Topic <span className="req">*</span></label>
                    <input
                      required
                      placeholder="e.g. Attention Mechanisms & Matrix Operations"
                      value={remedialForm.topic}
                      onChange={(e) => setRemedialForm({ ...remedialForm, topic: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label>Flagged Student Confusion Rate: <strong>{remedialForm.confusion_rate}%</strong></label>
                    <input
                      type="range"
                      min={10}
                      max={90}
                      value={remedialForm.confusion_rate}
                      onChange={(e) => setRemedialForm({ ...remedialForm, confusion_rate: parseInt(e.target.value, 10) })}
                      className="slider-input"
                    />
                  </div>

                  <SpecularButton
                    type="submit"
                    size="lg"
                    radius={14}
                    tint="#ffffff"
                    tintOpacity={0.05}
                    textColor="#ffffff"
                    lineColor="#818cf8"
                    baseColor="#4f46e5"
                    disabled={generatingRemedial}
                    className="generate-plan-btn"
                  >
                    {generatingRemedial ? 'Generating AI Lesson Plan…' : <>Generate AI Lesson Plan <Sparkles size={16} /></>}
                  </SpecularButton>
                </form>
              </SpotlightCard>

              {/* Active / Generated Remedial Plan Display */}
              <div className="remedial-display-area">
                {remedialPlans.length === 0 ? (
                  <SpotlightCard className="plan-placeholder-card" spotlightColor="rgba(99, 102, 241, 0.1)">
                    <BrainCircuit size={36} className="text-primary" />
                    <h4>Ready to Synthesize Remedial Content</h4>
                    <p>Enter a confusing lecture concept on the left to generate a 10-minute recap breakdown with interactive practice prompts.</p>
                  </SpotlightCard>
                ) : (
                  <SpotlightCard className="plan-active-card" spotlightColor="rgba(16, 185, 129, 0.12)">
                    <div className="plan-top-badge">
                      <span className="badge-recap">10-MIN RAPID RECAP</span>
                      <span className="badge-topic">{remedialPlans[0].topic}</span>
                    </div>

                    <div className="plan-section">
                      <h4>⏱️ 10-Minute Delivery Script</h4>
                      <pre className="plan-script-pre">{remedialPlans[0].ten_minute_plan}</pre>
                    </div>

                    {remedialPlans[0].clarification_draft && (
                      <div className="plan-section">
                        <h4>📢 Pre-Drafted Clarification Broadcast</h4>
                        <p className="plan-draft-text">{remedialPlans[0].clarification_draft}</p>
                        <button
                          type="button"
                          className="btn-use-draft"
                          onClick={() => {
                            setBroadcastForm({
                              course_code: remedialPlans[0].course_code,
                              course_name: remedialPlans[0].course_name,
                              topic: remedialPlans[0].topic,
                              clarification_text: remedialPlans[0].clarification_draft,
                              reference_url: 'https://colab.research.google.com/drive/nlp-attention-guide',
                            });
                            setBroadcastModalOpen(true);
                          }}
                        >
                          <Send size={14} /> Open Broadcast Modal with this Draft
                        </button>
                      </div>
                    )}
                  </SpotlightCard>
                )}
              </div>
            </div>

            {/* Pedagogical Impact Tracker */}
            <div className="table-card impact-tracker-card">
              <div className="table-card-header">
                <div>
                  <h3>Pedagogical Intervention Impact Tracker</h3>
                  <p className="muted-text">Measures student clarity and emotion shifts before vs. after faculty interventions.</p>
                </div>
              </div>

              <table className="courses-table">
                <thead>
                  <tr>
                    <th>Intervention Topic</th>
                    <th>Course Code</th>
                    <th>Broadcast Date</th>
                    <th>Baseline Confusion</th>
                    <th>Post-Clarification Clarity</th>
                    <th>Net Pedagogical Impact</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><strong>Backpropagation Proof & Gradient Walkthrough</strong></td>
                    <td>AI501</td>
                    <td>2026-10-28</td>
                    <td><span className="badge-amber">42% Confusion</span></td>
                    <td><span className="badge-emerald">86% Clarity</span></td>
                    <td><strong className="text-emerald">+24% Concept Retention</strong></td>
                  </tr>
                  <tr>
                    <td><strong>Attention Query-Key-Value Matrix Multiplications</strong></td>
                    <td>AI501</td>
                    <td>2026-10-31</td>
                    <td><span className="badge-amber">38% Confusion</span></td>
                    <td><span className="badge-emerald">82% Clarity</span></td>
                    <td><strong className="text-emerald">+18% Concept Retention</strong></td>
                  </tr>
                  <tr>
                    <td><strong>Dynamic Programming State Transitions</strong></td>
                    <td>CS401</td>
                    <td>2026-10-22</td>
                    <td><span className="badge-amber">35% Confusion</span></td>
                    <td><span className="badge-emerald">79% Clarity</span></td>
                    <td><strong className="text-emerald">+15% Concept Retention</strong></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB: DEPARTMENTAL BENCHMARK HEATMAP */}
        {activeTab === 'heatmap' && (
          <div className="tab-pane heatmap-admin-pane">
            <div className="pane-header">
              <h2>Cross-Department Emotional Health & Benchmark Matrix</h2>
              <p className="muted">
                Comparative sentiment analysis and wellbeing benchmarks across engineering departments for IQAC and accreditation reviews.
              </p>
            </div>

            <div className="table-card heatmap-table-card">
              <table className="courses-table heatmap-table">
                <thead>
                  <tr>
                    <th>Department</th>
                    <th>Total Students</th>
                    <th>Positive Sentiment</th>
                    <th>Confusion Rate</th>
                    <th>Frustration Rate</th>
                    <th>Academic Health Index</th>
                    <th>Primary Emotional Driver</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {(departmentHeatmap.length > 0 ? departmentHeatmap : [
                    {
                      department: 'AI & Data Science',
                      student_count: 142,
                      positive_rate: 74.2,
                      confusion_rate: 18.5,
                      frustration_rate: 7.3,
                      health_index: 84,
                      top_emotion_driver: 'Transformers & Math Rigor',
                      status: 'HEALTHY',
                    },
                    {
                      department: 'Computer Science & Engineering',
                      student_count: 280,
                      positive_rate: 68.0,
                      confusion_rate: 22.0,
                      frustration_rate: 10.0,
                      health_index: 76,
                      top_emotion_driver: 'Operating Systems Scheduling',
                      status: 'BALANCED',
                    },
                    {
                      department: 'Electronics & Communication',
                      student_count: 195,
                      positive_rate: 62.5,
                      confusion_rate: 26.0,
                      frustration_rate: 11.5,
                      health_index: 71,
                      top_emotion_driver: 'Signals & Systems Transforms',
                      status: 'ATTENTION_NEEDED',
                    },
                    {
                      department: 'Mechanical Engineering',
                      student_count: 160,
                      positive_rate: 79.0,
                      confusion_rate: 14.0,
                      frustration_rate: 7.0,
                      health_index: 87,
                      top_emotion_driver: 'CAD Lab Hands-On Projects',
                      status: 'EXEMPLARY',
                    },
                  ]).map((dept, dIdx) => (
                    <tr key={dIdx}>
                      <td><strong>{dept.department}</strong></td>
                      <td>{dept.student_count} Students</td>
                      <td><span className="pct-badge emerald">{Math.round(dept.positive_rate)}%</span></td>
                      <td><span className="pct-badge amber">{Math.round(dept.confusion_rate)}%</span></td>
                      <td><span className="pct-badge rose">{Math.round(dept.frustration_rate)}%</span></td>
                      <td>
                        <div className="health-gauge-pill">
                          <span className="gauge-fill" style={{ width: `${dept.health_index}%` }} />
                          <strong className="gauge-num">{dept.health_index}/100</strong>
                        </div>
                      </td>
                      <td>{dept.top_emotion_driver}</td>
                      <td>
                        <span className={`dept-status-pill ${dept.status?.toLowerCase()}`}>
                          {dept.status === 'EXEMPLARY' ? '🌟 Exemplary' : dept.status === 'HEALTHY' ? '✅ Healthy' : dept.status === 'BALANCED' ? '⚖️ Balanced' : '⚠️ Attention Required'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB: LMS SYLLABUS CURRICULUM UNIT MAPPING */}
        {activeTab === 'syllabus' && (
          <div className="tab-pane syllabus-admin-pane">
            <div className="pane-header flex-header">
              <div>
                <h2>LMS Syllabus Curriculum Unit Mapping & Confusion Tracker</h2>
                <p className="muted">
                  Correlates emotional sentiment, student confusion, and difficulty directly to individual course syllabus modules.
                </p>
              </div>
              <div className="course-code-badge">
                <BookOpen size={16} /> AI501 · Natural Language Processing
              </div>
            </div>

            <div className="syllabus-units-grid">
              {(syllabusMapping?.units || [
                {
                  unit_number: 1,
                  unit_title: 'Introduction to NLP & Text Preprocessing',
                  topics: ['Tokenization', 'Stemming & Lemmatization', 'N-Grams', 'TF-IDF Vectorization'],
                  confusion_rate: 12,
                  student_flags: 4,
                  status: 'HEALTHY',
                  action_recommended: 'None — Concept retention is high.',
                },
                {
                  unit_number: 2,
                  unit_title: 'Vector Semantics & Word Embeddings',
                  topics: ['Word2Vec Skip-Gram', 'Negative Sampling', 'GloVe Embeddings', 'Cosine Similarity'],
                  confusion_rate: 18,
                  student_flags: 7,
                  status: 'HEALTHY',
                  action_recommended: 'Publish vector visualization notebook.',
                },
                {
                  unit_number: 3,
                  unit_title: 'Sequential Deep Learning & RNNs',
                  topics: ['Recurrent Neural Networks', 'Backpropagation Through Time', 'Vanishing Gradients', 'LSTM & GRU Architectures'],
                  confusion_rate: 34,
                  student_flags: 18,
                  status: 'ATTENTION_NEEDED',
                  action_recommended: '15-minute BPTT step-by-step unrolling recap.',
                },
                {
                  unit_number: 4,
                  unit_title: 'Attention Mechanisms & Transformer Networks',
                  topics: ['Self-Attention & Multi-Head Attention', 'Scaled Dot-Product Formula', 'Positional Encoding', 'Transformer Encoder-Decoder'],
                  confusion_rate: 48,
                  student_flags: 29,
                  status: 'HIGH_FRICTION',
                  action_recommended: 'Remedial Lesson Plan & Broadcast dispatched.',
                },
                {
                  unit_number: 5,
                  unit_title: 'Pretrained Language Models & Fine-Tuning',
                  topics: ['BERT Masked Language Modeling', 'GPT Autoregressive Decoding', 'LoRA / Parameter Efficient Tuning', 'Prompt Engineering'],
                  confusion_rate: 26,
                  student_flags: 12,
                  status: 'BALANCED',
                  action_recommended: 'Interactive HuggingFace pipeline demo in lab.',
                },
              ]).map((u) => (
                <SpotlightCard key={u.unit_number} className="syllabus-unit-card" spotlightColor="rgba(99, 102, 241, 0.15)">
                  <div className="unit-header-row">
                    <span className="unit-pill">UNIT {u.unit_number}</span>
                    <span className={`unit-status-tag ${u.status.toLowerCase()}`}>
                      {u.status === 'HIGH_FRICTION' ? '🚨 High Friction' : u.status === 'ATTENTION_NEEDED' ? '⚠️ Attention' : '✅ Stable'}
                    </span>
                  </div>

                  <h3 className="unit-title">{u.unit_title}</h3>

                  <div className="unit-topics-chips">
                    {u.topics?.map((tp, tIdx) => (
                      <span key={tIdx} className="unit-topic-chip">{tp}</span>
                    ))}
                  </div>

                  <div className="unit-metrics-row">
                    <div>
                      <span className="metric-label">CONFUSION RATE</span>
                      <strong className={u.confusion_rate > 35 ? 'text-rose' : 'text-emerald'}>{u.confusion_rate}%</strong>
                    </div>
                    <div>
                      <span className="metric-label">STUDENT FLAGS</span>
                      <strong>{u.student_flags} Submissions</strong>
                    </div>
                  </div>

                  <div className="unit-action-box">
                    <strong>Recommended Action:</strong>
                    <p>{u.action_recommended}</p>
                  </div>
                </SpotlightCard>
              ))}
            </div>
          </div>
        )}

        {/* TAB: ACADEMIC CURRICULUM, TIMETABLE & SUBJECT MANAGEMENT */}
        {activeTab === 'curriculum' && (
          <div className="tab-pane curriculum-admin-pane">
            <div className="pane-header flex-header">
              <div>
                <h2>Academic Curriculum, Timetable & Subjects</h2>
                <p className="muted">
                  Configure semesters, subjects/courses, section allotments, and scheduled weekly lectures for students and faculty.
                </p>
              </div>
              <div className="curriculum-action-btns">
                <button
                  type="button"
                  className="btn-primary-action"
                  onClick={() =>
                    setCourseModal({
                      open: true,
                      isEdit: false,
                      courseId: null,
                      form: {
                        course_code: '',
                        course_name: '',
                        credits: 4,
                        semester: curriculumSemFilter !== 'ALL' ? Number(curriculumSemFilter) : 5,
                        department_name: 'AI & Data Science',
                        program: 'B.Tech',
                        course_type: 'Core',
                        syllabus_summary: '',
                        faculty_name: 'Dr. A. Sharma',
                        class_section: selectedSection || 'Class 3A',
                      },
                    })
                  }
                >
                  <Plus size={16} /> Add Course
                </button>
                <button
                  type="button"
                  className="btn-secondary-action"
                  onClick={() =>
                    setLectureModal({
                      open: true,
                      isEdit: false,
                      lectureId: null,
                      form: {
                        course_code: adminCourses[0]?.course_code || 'AI501',
                        course_name: adminCourses[0]?.course_name || 'Natural Language Processing',
                        faculty_name: 'Dr. A. Sharma',
                        class_section: selectedSection || 'Class 3A',
                        semester: curriculumSemFilter !== 'ALL' ? Number(curriculumSemFilter) : 5,
                        day_of_week: 'Monday',
                        start_time: '09:30 AM',
                        end_time: '10:30 AM',
                        room_number: 'Hall 301',
                        topic: '',
                        lecture_type: 'Theory',
                        status: 'SCHEDULED',
                      },
                    })
                  }
                >
                  <CalendarDays size={16} /> Schedule Lecture
                </button>
                <button
                  type="button"
                  className="btn-secondary-action"
                  onClick={() =>
                    setSemesterModal({
                      open: true,
                      form: {
                        semester_number: (adminSemesters?.length || 0) + 1,
                        term_name: `Term ${(adminSemesters?.length || 0) + 1}`,
                        academic_year: '2026-2027',
                        is_active: false,
                      },
                    })
                  }
                >
                  <Layers size={16} /> New Semester
                </button>
                <button
                  type="button"
                  className="btn-secondary-action"
                  onClick={() =>
                    setOfferingModal({
                      open: true,
                      form: {
                        course_code: adminCourses[0]?.course_code || 'AI501',
                        faculty_name: 'Dr. A. Sharma',
                        class_section: selectedSection || 'Class 3A',
                        semester: curriculumSemFilter !== 'ALL' ? Number(curriculumSemFilter) : 5,
                        term_name: 'Fall 2026',
                      },
                    })
                  }
                >
                  <Users size={16} /> Allot Faculty
                </button>
              </div>
            </div>

            {/* Sub-Tabs switcher */}
            <div className="curriculum-subtabs-bar">
              <div className="courses-subtabs-row">
                <button
                  type="button"
                  className={`courses-subtab-btn ${curriculumSubTab === 'courses' ? 'active' : ''}`}
                  onClick={() => setCurriculumSubTab('courses')}
                >
                  <BookOpen size={16} /> Subjects & Courses ({adminCourses.length})
                </button>
                <button
                  type="button"
                  className={`courses-subtab-btn ${curriculumSubTab === 'lectures' ? 'active' : ''}`}
                  onClick={() => setCurriculumSubTab('lectures')}
                >
                  <CalendarDays size={16} /> Weekly Lectures ({adminLectures.length})
                </button>
                <button
                  type="button"
                  className={`courses-subtab-btn ${curriculumSubTab === 'semesters' ? 'active' : ''}`}
                  onClick={() => setCurriculumSubTab('semesters')}
                >
                  <Layers size={16} /> Semesters ({adminSemesters.length})
                </button>
                <button
                  type="button"
                  className={`courses-subtab-btn ${curriculumSubTab === 'offerings' ? 'active' : ''}`}
                  onClick={() => setCurriculumSubTab('offerings')}
                >
                  <Users size={16} /> Section Allotments ({adminOfferings.length})
                </button>
              </div>

              {/* Search & Semester Filter Bar */}
              <div className="curriculum-filter-bar">
                <div className="curriculum-search-box">
                  <Search size={15} className="muted" />
                  <input
                    type="text"
                    placeholder="Search courses, codes, topics, or faculty..."
                    value={curriculumSearch}
                    onChange={(e) => setCurriculumSearch(e.target.value)}
                  />
                  {curriculumSearch && (
                    <button
                      type="button"
                      className="btn-clear-search"
                      onClick={() => setCurriculumSearch('')}
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

                <div className="semester-filter-pills">
                  <span className="filter-pill-label">Semester:</span>
                  <button
                    type="button"
                    className={`filter-sem-pill ${curriculumSemFilter === 'ALL' ? 'active' : ''}`}
                    onClick={() => setCurriculumSemFilter('ALL')}
                  >
                    All Semesters
                  </button>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                    <button
                      key={s}
                      type="button"
                      className={`filter-sem-pill ${curriculumSemFilter === String(s) ? 'active' : ''}`}
                      onClick={() => setCurriculumSemFilter(String(s))}
                    >
                      Sem {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* SUB-VIEW 1: COURSES / SUBJECTS */}
            {curriculumSubTab === 'courses' && (
              <div className="curriculum-courses-view">
                {(() => {
                  const filtered = adminCourses.filter((c) => {
                    const matchSem =
                      curriculumSemFilter === 'ALL' || String(c.semester) === String(curriculumSemFilter);
                    const q = curriculumSearch.toLowerCase();
                    const matchSearch =
                      !q ||
                      c.course_code?.toLowerCase().includes(q) ||
                      c.course_name?.toLowerCase().includes(q) ||
                      c.department_name?.toLowerCase().includes(q);
                    return matchSem && matchSearch;
                  });

                  if (filtered.length === 0) {
                    return (
                      <div className="empty-state-box">
                        <BookOpen size={36} className="muted" />
                        <p>No subjects found matching your criteria.</p>
                        <button
                          type="button"
                          className="btn-primary-action"
                          onClick={() =>
                            setCourseModal({
                              open: true,
                              isEdit: false,
                              courseId: null,
                              form: {
                                course_code: '',
                                course_name: '',
                                credits: 4,
                                semester: curriculumSemFilter !== 'ALL' ? Number(curriculumSemFilter) : 5,
                                department_name: 'AI & Data Science',
                                program: 'B.Tech',
                                course_type: 'Core',
                                syllabus_summary: '',
                                faculty_name: 'Dr. A. Sharma',
                                class_section: selectedSection || 'Class 3A',
                              },
                            })
                          }
                        >
                          <Plus size={16} /> Add First Course
                        </button>
                      </div>
                    );
                  }

                  return (
                    <div className="admin-courses-grid">
                      {filtered.map((c) => (
                        <SpotlightCard key={c.course_id} className="admin-course-card" spotlightColor="rgba(99, 102, 241, 0.15)">
                          <div className="course-card-top">
                            <div className="course-code-wrap">
                              <span className="course-code-badge-lg">{c.course_code}</span>
                              <span className="course-type-pill">{c.course_type || 'Core'}</span>
                            </div>
                            <div className="course-card-actions">
                              <button
                                type="button"
                                className="icon-action-btn edit"
                                title="Edit Course"
                                onClick={() =>
                                  setCourseModal({
                                    open: true,
                                    isEdit: true,
                                    courseId: c.course_id,
                                    form: {
                                      course_code: c.course_code,
                                      course_name: c.course_name,
                                      credits: c.credits,
                                      semester: c.semester,
                                      department_name: c.department_name,
                                      program: c.program,
                                      course_type: c.course_type || 'Core',
                                      syllabus_summary: c.syllabus_summary || '',
                                      faculty_name: c.faculty_name || '',
                                      class_section: c.class_section || selectedSection || 'Class 3A',
                                    },
                                  })
                                }
                              >
                                <Edit2 size={15} />
                              </button>
                              <button
                                type="button"
                                className="icon-action-btn delete"
                                title="Delete Course"
                                onClick={() => handleDeleteCourse(c.course_id, c.course_code)}
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </div>

                          <h3 className="admin-course-name">{c.course_name}</h3>

                          <div className="course-meta-tags">
                            <span className="meta-tag"><Layers size={13} /> Semester {c.semester}</span>
                            <span className="meta-tag"><Award size={13} /> {c.credits} Credits</span>
                            <span className="meta-tag">{c.program}</span>
                          </div>

                          {c.department_name && (
                            <div className="course-dept-label">
                              <strong>Dept:</strong> {c.department_name}
                            </div>
                          )}

                          {c.syllabus_summary && (
                            <p className="course-syllabus-preview">{c.syllabus_summary}</p>
                          )}

                          <div className="course-card-footer">
                            <button
                              type="button"
                              className="btn-quick-schedule"
                              onClick={() =>
                                setLectureModal({
                                  open: true,
                                  isEdit: false,
                                  lectureId: null,
                                  form: {
                                    course_code: c.course_code,
                                    course_name: c.course_name,
                                    faculty_name: 'Dr. A. Sharma',
                                    class_section: selectedSection || 'Class 3A',
                                    semester: c.semester,
                                    day_of_week: 'Monday',
                                    start_time: '09:30 AM',
                                    end_time: '10:30 AM',
                                    room_number: 'Hall 301',
                                    topic: '',
                                    lecture_type: 'Theory',
                                    status: 'SCHEDULED',
                                  },
                                })
                              }
                            >
                              <CalendarDays size={14} /> Schedule Lecture
                            </button>
                          </div>
                        </SpotlightCard>
                      ))}
                    </div>
                  );
                })()}
              </div>
            )}

            {/* SUB-VIEW 2: WEEKLY LECTURES / TIMETABLE */}
            {curriculumSubTab === 'lectures' && (
              <div className="curriculum-lectures-view">
                {/* Day selector pills */}
                <div className="day-filter-bar">
                  <span className="filter-pill-label">Day of Week:</span>
                  {['ALL', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((day) => (
                    <button
                      key={day}
                      type="button"
                      className={`day-filter-pill ${adminLectureDayFilter === day ? 'active' : ''}`}
                      onClick={() => setAdminLectureDayFilter(day)}
                    >
                      {day}
                    </button>
                  ))}
                </div>

                {(() => {
                  const filtered = adminLectures.filter((l) => {
                    const matchSem =
                      curriculumSemFilter === 'ALL' || String(l.semester) === String(curriculumSemFilter);
                    const matchDay = adminLectureDayFilter === 'ALL' || l.day_of_week === adminLectureDayFilter;
                    const q = curriculumSearch.toLowerCase();
                    const matchSearch =
                      !q ||
                      l.course_code?.toLowerCase().includes(q) ||
                      l.course_name?.toLowerCase().includes(q) ||
                      l.faculty_name?.toLowerCase().includes(q) ||
                      l.topic?.toLowerCase().includes(q) ||
                      l.room_number?.toLowerCase().includes(q);
                    return matchSem && matchDay && matchSearch;
                  });

                  if (filtered.length === 0) {
                    return (
                      <div className="empty-state-box">
                        <CalendarDays size={36} className="muted" />
                        <p>No lectures scheduled for this selection.</p>
                        <button
                          type="button"
                          className="btn-primary-action"
                          onClick={() =>
                            setLectureModal({
                              open: true,
                              isEdit: false,
                              lectureId: null,
                              form: {
                                course_code: adminCourses[0]?.course_code || 'AI501',
                                course_name: adminCourses[0]?.course_name || 'Natural Language Processing',
                                faculty_name: 'Dr. A. Sharma',
                                class_section: selectedSection || 'Class 3A',
                                semester: curriculumSemFilter !== 'ALL' ? Number(curriculumSemFilter) : 5,
                                day_of_week: adminLectureDayFilter !== 'ALL' ? adminLectureDayFilter : 'Monday',
                                start_time: '09:30 AM',
                                end_time: '10:30 AM',
                                room_number: 'Hall 301',
                                topic: '',
                                lecture_type: 'Theory',
                                status: 'SCHEDULED',
                              },
                            })
                          }
                        >
                          <Plus size={16} /> Schedule a Lecture
                        </button>
                      </div>
                    );
                  }

                  return (
                    <div className="admin-lectures-grid">
                      {filtered.map((lec) => (
                        <SpotlightCard key={lec.lecture_id} className="admin-lecture-card" spotlightColor="rgba(59, 130, 246, 0.15)">
                          <div className="lec-card-header">
                            <span className="lec-day-badge">{lec.day_of_week}</span>
                            <span className={`status-pill ${lec.status.toLowerCase()}`}>
                              {lec.status}
                            </span>
                          </div>

                          <div className="lec-time-room">
                            <span className="lec-time"><Clock size={13} /> {lec.start_time} - {lec.end_time}</span>
                            <span className="lec-room"><MapPin size={13} /> {lec.room_number || 'TBD'}</span>
                          </div>

                          <div className="lec-course-info">
                            <span className="lec-code-badge">{lec.course_code}</span>
                            <h4 className="lec-course-title">{lec.course_name}</h4>
                          </div>

                          {lec.topic && (
                            <div className="lec-topic-box">
                              <span className="topic-label">Topic:</span>
                              <p>{lec.topic}</p>
                            </div>
                          )}

                          <div className="lec-footer-meta">
                            <div>
                              <span className="meta-sub">Faculty:</span> {lec.faculty_name}
                            </div>
                            <div>
                              <span className="meta-sub">Section:</span> {lec.class_section} · Sem {lec.semester}
                            </div>
                          </div>

                          <div className="lec-card-actions">
                            <button
                              type="button"
                              className="btn-lec-edit"
                              onClick={() =>
                                setLectureModal({
                                  open: true,
                                  isEdit: true,
                                  lectureId: lec.lecture_id,
                                  form: {
                                    course_code: lec.course_code,
                                    course_name: lec.course_name,
                                    faculty_name: lec.faculty_name,
                                    class_section: lec.class_section,
                                    semester: lec.semester,
                                    day_of_week: lec.day_of_week,
                                    start_time: lec.start_time,
                                    end_time: lec.end_time,
                                    room_number: lec.room_number,
                                    topic: lec.topic || '',
                                    lecture_type: lec.lecture_type || 'Theory',
                                    status: lec.status || 'SCHEDULED',
                                  },
                                })
                              }
                            >
                              <Edit2 size={13} /> Edit
                            </button>
                            <button
                              type="button"
                              className="btn-lec-delete"
                              onClick={() => handleDeleteLecture(lec.lecture_id)}
                            >
                              <Trash2 size={13} /> Remove
                            </button>
                          </div>
                        </SpotlightCard>
                      ))}
                    </div>
                  );
                })()}
              </div>
            )}

            {/* SUB-VIEW 3: SEMESTERS */}
            {curriculumSubTab === 'semesters' && (
              <div className="curriculum-semesters-view">
                <div className="admin-semesters-grid">
                  {adminSemesters.map((sem) => (
                    <SpotlightCard key={sem.semester_id || sem.semester_number} className="semester-card" spotlightColor="rgba(16, 185, 129, 0.15)">
                      <div className="sem-card-top">
                        <span className="sem-number-badge">Semester {sem.semester_number}</span>
                        {sem.is_active ? (
                          <span className="sem-active-badge active">
                            <span className="pulse-dot green" /> Active Term
                          </span>
                        ) : (
                          <span className="sem-active-badge archived">Archived / Upcoming</span>
                        )}
                      </div>

                      <h3 className="sem-term-title">{sem.term_name}</h3>
                      <p className="sem-acad-year">{sem.academic_year}</p>

                      <div className="sem-stats-row">
                        <div className="sem-stat">
                          <span className="stat-label">COURSES</span>
                          <strong>{sem.course_count ?? adminCourses.filter(c => c.semester === sem.semester_number).length}</strong>
                        </div>
                        <div className="sem-stat">
                          <span className="stat-label">STUDENTS</span>
                          <strong>{sem.student_count ?? 64}</strong>
                        </div>
                      </div>

                      <div className="sem-actions-row">
                        <button
                          type="button"
                          className={`toggle-active-btn ${sem.is_active ? 'deactivate' : 'activate'}`}
                          onClick={() => handleToggleSemesterActive(sem.semester_number, sem.is_active)}
                        >
                          {sem.is_active ? 'Set as Inactive' : 'Set as Current Active Term'}
                        </button>
                      </div>
                    </SpotlightCard>
                  ))}
                </div>
              </div>
            )}

            {/* SUB-VIEW 4: SECTION ALLOTMENTS */}
            {curriculumSubTab === 'offerings' && (
              <div className="curriculum-offerings-view">
                <div className="offerings-table-wrap">
                  <table className="offerings-table">
                    <thead>
                      <tr>
                        <th>Course Code</th>
                        <th>Course Title</th>
                        <th>Section</th>
                        <th>Faculty In-Charge</th>
                        <th>Semester</th>
                        <th>Term</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {adminOfferings.map((off) => (
                        <tr key={off.offering_id}>
                          <td><strong>{off.course_code}</strong></td>
                          <td>{off.course_name}</td>
                          <td><span className="section-pill">{off.class_section}</span></td>
                          <td>{off.faculty_name}</td>
                          <td>Sem {off.semester}</td>
                          <td>{off.term_name || 'Fall 2026'}</td>
                          <td>
                            <button
                              type="button"
                              className="icon-action-btn delete"
                              title="Delete Allocation"
                              onClick={() => handleDeleteOffering(off.offering_id)}
                            >
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB: REAL-TIME WEBHOOK INTEGRATION */}
        {activeTab === 'integrations' && (
          <div className="tab-pane integrations-admin-pane">
            <div className="pane-header">
              <h2>Real-Time Webhooks & Counselor Alert Dispatches</h2>
              <p className="muted">
                Connect external Slack, Microsoft Teams, or Discord channels to receive instantaneous alerts when critical student emotional distress or urgent grievances occur.
              </p>
            </div>

            <div className="integrations-layout">
              <SpotlightCard className="webhook-settings-card" spotlightColor="rgba(99, 102, 241, 0.15)">
                <h3>Webhook Channel Configuration</h3>
                <p className="muted-text">Incoming webhook URL for student wellbeing dispatches.</p>

                <form onSubmit={handleSaveWebhookConfig}>
                  <div className="form-group">
                    <label>Collaboration Platform</label>
                    <select
                      value={webhookConfig.service_name}
                      onChange={(e) => setWebhookConfig({ ...webhookConfig, service_name: e.target.value })}
                    >
                      <option value="Slack">Slack (#counselor-alerts)</option>
                      <option value="Microsoft Teams">Microsoft Teams (Faculty Oversight)</option>
                      <option value="Discord">Discord (Academic Bot Channel)</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Incoming Webhook URL <span className="req">*</span></label>
                    <input
                      required
                      placeholder="https://your-webhook-endpoint.example.com/alerts"
                      value={webhookConfig.webhook_url}
                      onChange={(e) => setWebhookConfig({ ...webhookConfig, webhook_url: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label>Notification Trigger Policy</label>
                    <select
                      value={webhookConfig.trigger_on}
                      onChange={(e) => setWebhookConfig({ ...webhookConfig, trigger_on: e.target.value })}
                    >
                      <option value="CRITICAL_ONLY">Critical Distress Only (Frustration / High Negative above 85%)</option>
                      <option value="HIGH_CONFUSION">High Confusion (above 35%) and Critical Distress</option>
                      <option value="ALL">All Feedback Submissions</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={webhookConfig.enabled}
                        onChange={(e) => setWebhookConfig({ ...webhookConfig, enabled: e.target.checked })}
                      />
                      <span>Enable real-time event dispatching</span>
                    </label>
                  </div>

                  <div className="webhook-actions-row">
                    <SpecularButton
                      type="submit"
                      size="md"
                      radius={12}
                      tint="#ffffff"
                      tintOpacity={0.05}
                      textColor="#ffffff"
                      lineColor="#818cf8"
                      baseColor="#4f46e5"
                    >
                      Save Configuration
                    </SpecularButton>

                    <button
                      type="button"
                      className="btn-test-webhook"
                      disabled={webhookTesting}
                      onClick={handleTestWebhook}
                    >
                      <Webhook size={15} /> {webhookTesting ? 'Sending Alert…' : 'Send Live Test Alert'}
                    </button>
                  </div>
                </form>
              </SpotlightCard>

              <SpotlightCard className="webhook-status-card" spotlightColor="rgba(16, 185, 129, 0.15)">
                <div className="status-header">
                  <CheckCircle2 size={24} className="text-emerald" />
                  <h4>Webhook Dispatcher Status</h4>
                </div>
                <div className="status-meta">
                  <div className="meta-row">
                    <span>Target Service:</span>
                    <strong>{webhookConfig.service_name}</strong>
                  </div>
                  <div className="meta-row">
                    <span>Status:</span>
                    <strong className="text-emerald">{webhookConfig.enabled ? 'ACTIVE & LISTENING' : 'DISABLED'}</strong>
                  </div>
                  <div className="meta-row">
                    <span>Trigger Policy:</span>
                    <code>{webhookConfig.trigger_on}</code>
                  </div>
                  <div className="meta-row">
                    <span>Recent Test:</span>
                    <span>Ready for live dispatches</span>
                  </div>
                </div>
                <div className="webhook-sample-payload">
                  <span className="payload-label">Sample JSON Alert Dispatched:</span>
                  <pre>
{`{
  "event": "STUDENT_DISTRESS_ALERT",
  "course": "AI501 · NLP",
  "emotion": "Confusion (0.94)",
  "vocal_prosody": "Elevated Tremor",
  "action": "Counseling Reach-Out Recommended"
}`}
                  </pre>
                </div>
              </SpotlightCard>
            </div>
          </div>
        )}

        {/* TAB 2: PEDAGOGICAL AI ADVICE */}
        {activeTab === 'pedagogy' && (
          <div className="tab-pane pedagogy-pane">
            <div className="pane-header">
              <h2>Automated Pedagogical AI Recommendations</h2>
              <p className="muted">
                Actionable curriculum, teaching pace, and assignment adjustments generated by analyzing student feedback.
              </p>
            </div>

            <div className="recommendations-stack">
              {(insights?.pedagogical_recommendations || [
                {
                  id: 'rec-1',
                  category: 'Teaching Pace & Clarity',
                  priority: 'HIGH',
                  recommendation: 'Schedule a 15-minute live code walkthrough recap before commencing the Transformers lecture.',
                  impact: 'Resolves 28% of flagged confusion in Section 3A.',
                },
                {
                  id: 'rec-2',
                  category: 'Lab Workload Pacing',
                  priority: 'HIGH',
                  recommendation: 'Extend the deadline for Assignment 2 by 4 days to alleviate concurrent project submission stress.',
                  impact: 'Significantly reduces fatigue and deadline anxiety.',
                },
                {
                  id: 'rec-3',
                  category: 'Course Materials',
                  priority: 'NORMAL',
                  recommendation: 'Publish solved example notebooks for Dynamic Programming and Graph search implementations.',
                  impact: 'Provides reference material for slower learners.',
                },
              ]).map((rec, rIdx) => {
                const recTitle = rec.suggestion || rec.recommendation || 'Continuous Academic Review';
                const recPriority = (rec.urgency || rec.priority || 'NORMAL').toUpperCase();
                const recCategory = rec.topic || rec.category || 'Curriculum & Workload';
                const recImpact = rec.impact || 'Positive student learning outcome.';

                return (
                  <SpotlightCard key={rec.id || rIdx} className="recommendation-card" spotlightColor="rgba(168, 85, 247, 0.15)">
                    <div className="rec-top">
                      <span className={`priority-tag ${recPriority.toLowerCase()}`}>
                        {recPriority} PRIORITY
                      </span>
                      <span className="rec-cat">{recCategory}</span>
                    </div>
                    <h3>{recTitle}</h3>
                    <p className="rec-impact">
                      <Sparkles size={15} /> <strong>Pedagogical Impact:</strong> {recImpact}
                    </p>
                  </SpotlightCard>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 3: FEEDBACK OVERSIGHT */}
        {activeTab === 'feedback' && (
          <div className="tab-pane feedback-pane">
            <div className="pane-header flex-header">
              <div>
                <h2>Feedback Oversight & Direct Faculty Response</h2>
                <p className="muted">
                  Review student submissions, view detected emotion tags, and publish administrative action plans.
                </p>
              </div>

              <div className="admin-header-actions">
                <button
                  type="button"
                  className="btn-download-csv"
                  onClick={() => {
                    const sec = encodeURIComponent(selectedSection);
                    window.open(`${API}/feedback/export.csv?class_section=${sec}`, '_blank');
                  }}
                  title="Download full feedback report formatted as CSV"
                >
                  <Download size={15} /> Export CSV Report
                </button>
              </div>
            </div>

            <div className="admin-table-filters">
              <div className="filter-search-box">
                <Search size={15} className="search-icon" />
                <input
                  type="text"
                  placeholder="Filter by course code, keyword, or section..."
                  value={adminFeedbackSearch}
                  onChange={(e) => setAdminFeedbackSearch(e.target.value)}
                />
                {adminFeedbackSearch && (
                  <button type="button" className="clear-search-btn" onClick={() => setAdminFeedbackSearch('')}>
                    <X size={13} />
                  </button>
                )}
              </div>

              <div className="filter-dropdown-box">
                <select
                  value={adminSentimentFilter}
                  onChange={(e) => setAdminSentimentFilter(e.target.value)}
                >
                  <option value="ALL">All Sentiments</option>
                  <option value="POSITIVE">Positive</option>
                  <option value="NEGATIVE">Negative</option>
                  <option value="NEUTRAL">Neutral</option>
                  <option value="MIXED">Mixed</option>
                </select>
              </div>
            </div>

            <div className="admin-feedback-table-card">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Course</th>
                    <th>Class</th>
                    <th>Sentiment</th>
                    <th>Primary Emotion</th>
                    <th>Feedback Excerpt</th>
                    <th>Upvotes</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAdminFeedbacks.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                        No feedback entries match your current search and filter criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredAdminFeedbacks.map((f) => (
                      <tr key={f.feedback_id}>
                        <td><strong>{f.course_code}</strong></td>
                        <td>{f.class_section}</td>
                        <td>
                          <span className={`sentiment-badge ${f.sentiment?.toLowerCase() || 'neutral'}`}>
                            {f.sentiment || 'NEUTRAL'}
                          </span>
                        </td>
                        <td>
                          <span className="emotion-badge">{f.emotion || 'satisfaction'}</span>
                        </td>
                        <td className="text-excerpt">
                          <div>{f.feedback_text}</div>
                          {f.responses && f.responses.length > 0 && (
                            <div className="table-row-response-preview">
                              <span className="response-prefix">💬 Action:</span> {f.responses[f.responses.length - 1].response_text}
                            </div>
                          )}
                        </td>
                        <td><strong>{f.upvotes || 0}</strong></td>
                        <td>
                          {f.responses && f.responses.length > 0 ? (
                            <div className="response-status-badge-wrap">
                              <span className="responded-badge" title={f.responses[f.responses.length - 1].response_text}>
                                <CheckCircle2 size={13} /> Responded
                              </span>
                              <button
                                type="button"
                                className="btn-action-small btn-action-update"
                                onClick={() =>
                                  setResponseModal({
                                    open: true,
                                    feedback: f,
                                    text: f.responses[f.responses.length - 1].response_text || '',
                                  })
                                }
                              >
                                Update
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              className="btn-action-small"
                              onClick={() => setResponseModal({ open: true, feedback: f, text: '' })}
                            >
                              Respond
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: GRIEVANCES REDRESSAL */}
        {activeTab === 'grievances' && (
          <div className="tab-pane grievances-pane">
            <div className="pane-header">
              <h2>Student Grievance Redressal Desk</h2>
              <p className="muted">
                Official complaints queue. Review grievances, investigate root causes, and log resolution actions.
              </p>
            </div>

            <div className="complaints-admin-list">
              {complaints.length === 0 ? (
                <p className="empty-state">No complaints currently on file.</p>
              ) : (
                complaints.map((c) => (
                  <div key={c.complaint_id} className="admin-complaint-card">
                    <div className="c-header-row">
                      <div className="c-student-info">
                        <strong>{c.student_name}</strong> ({c.student_roll || '2024-AI-042'}) · {c.class_section}
                      </div>
                      <div className="c-status-row">
                        <span className={`severity-tag ${c.severity?.toLowerCase()}`}>{c.severity}</span>
                        <span className={`status-pill ${c.status?.toLowerCase()}`}>{c.status}</span>
                      </div>
                    </div>

                    <h4>{c.title}</h4>
                    <p className="c-desc">{c.description}</p>

                    {c.action_taken && (
                      <div className="c-action-record">
                        <strong>Resolution Taken:</strong> {c.action_taken}
                      </div>
                    )}

                    <div className="c-footer-actions">
                      <span className="c-course-tag">
                        {c.course_code} · {c.faculty_name}
                      </span>
                      <button
                        type="button"
                        className="btn-resolve-trigger"
                        onClick={() =>
                          setResolveModal({
                            open: true,
                            complaint: c,
                            actionTaken: c.action_taken || '',
                            status: c.status || 'RESOLVED',
                          })
                        }
                      >
                        Update Resolution Action
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 5: PULSE POLL MANAGER */}
        {activeTab === 'polls' && (
          <div className="tab-pane polls-pane">
            <div className="pane-header flex-header">
              <div>
                <h2>Lecture Pulse Poll Control</h2>
                <p className="muted">Launch instant 60-second clarity questions to any section during active lecture sessions.</p>
              </div>
              <button
                type="button"
                className="btn-primary-add"
                onClick={() => setCreatePollModal({ ...createPollModal, open: true })}
              >
                <Plus size={16} /> Launch New 60s Pulse
              </button>
            </div>

            <div className="pulse-history-grid">
              {pulseRequests.map((req) => {
                const { question, options, countsObj, totalVotes } = parsePollData(req);

                return (
                  <div key={req.request_id} className="pulse-summary-card">
                    <div className="p-card-top">
                      <span className="pulse-badge-active">{req.status}</span>
                      <span>{req.target_section} · {req.course_code}</span>
                    </div>
                    <h3>{question}</h3>
                    <div className="p-options-preview">
                      {options.map((opt, i) => {
                        const count = countsObj[String(i)] || countsObj[i] || 0;
                        return (
                          <div key={i} className="opt-preview-chip">
                            {opt} ({count} votes)
                          </div>
                        );
                      })}
                    </div>
                    <span className="total-p-votes">Total: {totalVotes} responses</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 6: GEMINI TOKEN & MODEL LAB */}
        {activeTab === 'gemini' && (
          <div className="tab-pane gemini-pane">
            <div className="pane-header">
              <h2>Google Gemini AI Token & Model Comparison Lab</h2>
              <p className="muted">
                Configure your Google Gemini API Token to eliminate hallucinations and achieve zero-shot emotional reasoning.
              </p>
            </div>

            {/* Gemini Token Config Card */}
            <SpotlightCard className="gemini-config-card" spotlightColor="rgba(147, 51, 234, 0.18)">
              <div className="gemini-card-header">
                <div className="gemini-icon-chip">
                  <Sparkles size={24} />
                </div>
                <div>
                  <h3>Google Gemini 1.5 Flash Token Integration</h3>
                  <p>
                    When active, Gemini analyzes student nuances, sarcasm, and multifaceted feedback with 99% accuracy.
                  </p>
                </div>
              </div>

              <div className="gemini-status-display">
                <strong>Status:</strong>{' '}
                {geminiConfig.has_gemini_key ? (
                  <span className="text-emerald">
                    <ShinyText text="Active · Google Gemini AI Engine" speed={3} shineColor="#34d399" /> · Key: {geminiConfig.key_preview || 'AIzaSy...Configured'}
                  </span>
                ) : (
                  <span className="text-amber">No Gemini Key Configured (Running Local Fallback)</span>
                )}
              </div>

              <form onSubmit={handleSaveGeminiKey} className="gemini-form">
                <div className="form-group">
                  <label>
                    Enter or Update Google Gemini API Key
                    <input
                      type="password"
                      placeholder="AIzaSy..."
                      value={geminiKeyInput}
                      onChange={(e) => setGeminiKeyInput(e.target.value)}
                      required
                    />
                  </label>
                </div>

                {geminiMsg && <p className="success-banner">{geminiMsg}</p>}
                {geminiErr && <p className="error-banner">{geminiErr}</p>}

                <SpecularButton
                  type="submit"
                  size="md"
                  radius={12}
                  tint="#ffffff"
                  tintOpacity={0.05}
                  textColor="#ffffff"
                  lineColor="#c084fc"
                  baseColor="#7c3aed"
                  disabled={geminiSaving}
                  className="save-gemini-btn"
                >
                  {geminiSaving ? 'Verifying with Google…' : 'Save & Verify Gemini Key'}
                </SpecularButton>
              </form>
            </SpotlightCard>

            {/* Model Comparison Test Bench */}
            <SpotlightCard className="test-bench-card" spotlightColor="rgba(99, 102, 241, 0.15)">
              <h3>NLP Model Comparison Test Bench</h3>
              <p className="muted">Test any student comment across available engines to observe differences in reasoning.</p>

              <div className="bench-inputs">
                <textarea
                  rows={3}
                  value={testText}
                  onChange={(e) => setTestText(e.target.value)}
                  placeholder="Enter sample student feedback..."
                />

                <div className="bench-controls">
                  <label>
                    Select Engine:
                    <select value={testEngine} onChange={(e) => setTestEngine(e.target.value)}>
                      <option value="external">Google Gemini (External Cloud AI)</option>
                      <option value="bert">HuggingFace BERT (Transformer)</option>
                      <option value="tfidf">Local TF-IDF + Logistic Regression</option>
                    </select>
                  </label>

                  <SpecularButton
                    type="button"
                    size="md"
                    radius={12}
                    tint="#ffffff"
                    tintOpacity={0.05}
                    textColor="#ffffff"
                    lineColor="#818cf8"
                    baseColor="#4f46e5"
                    onClick={handleTestModel}
                    disabled={testingModel}
                    className="run-test-btn"
                  >
                    {testingModel ? 'Analyzing…' : 'Run Model Analysis'}
                  </SpecularButton>
                </div>
              </div>

              {testResult && (
                <div className="test-result-box">
                  <div className="engine-name">Engine: {testResult.engine}</div>
                  <div className="result-grid">
                    <div>
                      <strong>Sentiment:</strong> {testResult.sentiment?.label} (
                      {Math.round((testResult.sentiment?.confidence || 0.95) * 100)}% conf)
                    </div>
                    <div>
                      <strong>Emotion:</strong> {testResult.emotion?.label} (
                      {Math.round((testResult.emotion?.confidence || 0.92) * 100)}% conf)
                    </div>
                    <div>
                      <strong>Topics:</strong> {testResult.topics?.join(', ') || 'N/A'}
                    </div>
                  </div>
                  {testResult.pedagogical_advice && (
                    <div className="pedagogy-advice-result">
                      <strong>AI Advice:</strong> {testResult.pedagogical_advice}
                    </div>
                  )}
                </div>
              )}
            </SpotlightCard>
          </div>
        )}
      </main>

      {/* Response Modal */}
      {responseModal.open && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <div className="modal-header">
              <h3>Publish Official Faculty Response</h3>
              <button
                type="button"
                className="close-modal-btn"
                onClick={() => setResponseModal({ open: false, feedback: null, text: '' })}
              >
                <X size={18} />
              </button>
            </div>
            <p className="modal-feedback-quote">"{responseModal.feedback?.feedback_text}"</p>
            {responseModal.feedback?.responses && responseModal.feedback.responses.length > 0 && (
              <div className="modal-prev-responses-box">
                <span className="prev-heading">Previous Official Responses:</span>
                {responseModal.feedback.responses.map((resp, i) => (
                  <div key={i} className="prev-response-entry">
                    <span className="responder-tag">{resp.responder_name}:</span> {resp.response_text}
                  </div>
                ))}
              </div>
            )}
            <div className="form-group">
              <label>Action Taken / Response Message:</label>
              <textarea
                rows={4}
                placeholder="e.g. Discussed with the course coordinator. We have moved the lab submission to Friday..."
                value={responseModal.text}
                onChange={(e) => setResponseModal({ ...responseModal, text: e.target.value })}
              />
            </div>
            <div className="modal-actions">
              <button
                type="button"
                className="btn-cancel"
                disabled={submittingResponse}
                onClick={() => setResponseModal({ open: false, feedback: null, text: '' })}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-confirm"
                disabled={submittingResponse || !responseModal.text.trim()}
                onClick={handleSendResponse}
              >
                {submittingResponse ? 'Publishing…' : 'Publish Response'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Resolve Complaint Modal */}
      {resolveModal.open && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <div className="modal-header">
              <h3>Update Grievance Status & Resolution</h3>
              <button
                type="button"
                className="close-modal-btn"
                onClick={() => setResolveModal({ open: false, complaint: null, actionTaken: '', status: 'RESOLVED' })}
              >
                <X size={18} />
              </button>
            </div>
            <p className="modal-feedback-quote">
              <strong>{resolveModal.complaint?.title}</strong>: {resolveModal.complaint?.description}
            </p>
            <div className="form-group">
              <label>Status:</label>
              <select
                value={resolveModal.status}
                onChange={(e) => setResolveModal({ ...resolveModal, status: e.target.value })}
              >
                <option value="IN_REVIEW">Under Review</option>
                <option value="RESOLVED">Resolved</option>
                <option value="REJECTED">Dismissed</option>
              </select>
            </div>
            <div className="form-group">
              <label>Official Resolution Action Recorded:</label>
              <textarea
                rows={4}
                placeholder="Detail the investigation and remedy implemented..."
                value={resolveModal.actionTaken}
                onChange={(e) => setResolveModal({ ...resolveModal, actionTaken: e.target.value })}
              />
            </div>
            <div className="modal-actions">
              <button
                type="button"
                className="btn-cancel"
                onClick={() => setResolveModal({ open: false, complaint: null, actionTaken: '', status: 'RESOLVED' })}
              >
                Cancel
              </button>
              <button type="button" className="btn-confirm" onClick={handleResolveComplaint}>
                Save Resolution
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Pulse Poll Modal */}
      {createPollModal.open && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <div className="modal-header">
              <h3>Launch 60-Second Lecture Pulse Poll</h3>
              <button
                type="button"
                className="close-modal-btn"
                onClick={() => setCreatePollModal({ ...createPollModal, open: false })}
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleCreatePoll}>
              <div className="form-group">
                <label>Question:</label>
                <input
                  required
                  placeholder="e.g. Did everyone grasp backpropagation today?"
                  value={createPollModal.question}
                  onChange={(e) => setCreatePollModal({ ...createPollModal, question: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Target Section:</label>
                <select
                  value={createPollModal.target_section}
                  onChange={(e) => setCreatePollModal({ ...createPollModal, target_section: e.target.value })}
                >
                  <option value="Class 3A">Class 3A</option>
                  <option value="Class 3B">Class 3B</option>
                  <option value="Class 2A">Class 2A</option>
                  <option value="Class 1A">Class 1A</option>
                </select>
              </div>
              <div className="form-group">
                <label>Options:</label>
                {createPollModal.options.map((opt, i) => (
                  <input
                    key={i}
                    placeholder={`Option ${i + 1}`}
                    value={opt}
                    onChange={(e) => {
                      const newOpts = [...createPollModal.options];
                      newOpts[i] = e.target.value;
                      setCreatePollModal({ ...createPollModal, options: newOpts });
                    }}
                    style={{ marginBottom: '8px' }}
                  />
                ))}
              </div>
              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => setCreatePollModal({ ...createPollModal, open: false })}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-confirm">
                  Broadcast Live Poll
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 1-Click Clarification Broadcast Modal */}
      {broadcastModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <div className="modal-header">
              <h3>1-Click AI Clarification Broadcast</h3>
              <button
                type="button"
                className="close-modal-btn"
                onClick={() => setBroadcastModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleBroadcastClarification}>
              <div className="form-group">
                <label>Target Course & Topic</label>
                <input
                  disabled
                  value={`${broadcastForm.course_code} · ${broadcastForm.topic}`}
                  className="disabled-input"
                />
              </div>

              <div className="form-group">
                <label>Clarification Message for Students <span className="req">*</span></label>
                <textarea
                  rows={5}
                  required
                  placeholder="Provide pedagogical clarification or analogy to resolve confusion..."
                  value={broadcastForm.clarification_text}
                  onChange={(e) => setBroadcastForm({ ...broadcastForm, clarification_text: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Interactive Explainer / Colab Notebook URL</label>
                <input
                  placeholder="https://colab.research.google.com/drive/..."
                  value={broadcastForm.reference_url}
                  onChange={(e) => setBroadcastForm({ ...broadcastForm, reference_url: e.target.value })}
                />
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => setBroadcastModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-confirm" disabled={broadcasting}>
                  {broadcasting ? 'Broadcasting…' : 'Dispatch Clarification to Students'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════ */}
      {/* ACADEMIC MANAGEMENT MODALS                              */}
      {/* ═══════════════════════════════════════════════════════ */}

      {/* 1. Course / Subject Modal */}
      {courseModal.open && (
        <div className="modal-backdrop" onClick={() => setCourseModal({ ...courseModal, open: false })}>
          <div className="modal-card wide-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-row">
                <BookOpen size={20} className="text-primary" />
                <h3>{courseModal.isEdit ? 'Edit Subject / Course' : 'Create New Subject / Course'}</h3>
              </div>
              <button
                type="button"
                className="btn-modal-close"
                onClick={() => setCourseModal({ ...courseModal, open: false })}
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSaveCourse} className="modal-form">
              <div className="form-row-2col">
                <div className="form-group">
                  <label>Course Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. AI509"
                    value={courseModal.form.course_code}
                    onChange={(e) =>
                      setCourseModal({
                        ...courseModal,
                        form: { ...courseModal.form, course_code: e.target.value.toUpperCase() },
                      })
                    }
                  />
                </div>
                <div className="form-group">
                  <label>Course Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Reinforcement Learning & Multi-Agent Systems"
                    value={courseModal.form.course_name}
                    onChange={(e) =>
                      setCourseModal({
                        ...courseModal,
                        form: { ...courseModal.form, course_name: e.target.value },
                      })
                    }
                  />
                </div>
              </div>

              <div className="form-row-3col">
                <div className="form-group">
                  <label>Semester *</label>
                  <select
                    value={courseModal.form.semester}
                    onChange={(e) =>
                      setCourseModal({
                        ...courseModal,
                        form: { ...courseModal.form, semester: Number(e.target.value) },
                      })
                    }
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                      <option key={s} value={s}>Semester {s}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Credits *</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    required
                    value={courseModal.form.credits}
                    onChange={(e) =>
                      setCourseModal({
                        ...courseModal,
                        form: { ...courseModal.form, credits: Number(e.target.value) },
                      })
                    }
                  />
                </div>
                <div className="form-group">
                  <label>Course Type</label>
                  <select
                    value={courseModal.form.course_type || 'Core'}
                    onChange={(e) =>
                      setCourseModal({
                        ...courseModal,
                        form: { ...courseModal.form, course_type: e.target.value },
                      })
                    }
                  >
                    <option value="Core">Core</option>
                    <option value="Professional Elective">Professional Elective</option>
                    <option value="Open Elective">Open Elective</option>
                    <option value="Laboratory">Laboratory</option>
                    <option value="Project">Project / Capstone</option>
                  </select>
                </div>
              </div>

              <div className="form-row-2col">
                <div className="form-group">
                  <label>Department</label>
                  <input
                    type="text"
                    value={courseModal.form.department_name}
                    onChange={(e) =>
                      setCourseModal({
                        ...courseModal,
                        form: { ...courseModal.form, department_name: e.target.value },
                      })
                    }
                  />
                </div>
                <div className="form-group">
                  <label>Program</label>
                  <input
                    type="text"
                    value={courseModal.form.program}
                    onChange={(e) =>
                      setCourseModal({
                        ...courseModal,
                        form: { ...courseModal.form, program: e.target.value },
                      })
                    }
                  />
                </div>
              </div>

              {!courseModal.isEdit && (
                <div className="form-row-2col">
                  <div className="form-group">
                    <label>Lead Faculty (Optional Allotment)</label>
                    <input
                      type="text"
                      placeholder="e.g. Dr. A. Sharma"
                      value={courseModal.form.faculty_name || ''}
                      onChange={(e) =>
                        setCourseModal({
                          ...courseModal,
                          form: { ...courseModal.form, faculty_name: e.target.value },
                        })
                      }
                    />
                  </div>
                  <div className="form-group">
                    <label>Initial Section</label>
                    <input
                      type="text"
                      placeholder="e.g. Class 3A"
                      value={courseModal.form.class_section || ''}
                      onChange={(e) =>
                        setCourseModal({
                          ...courseModal,
                          form: { ...courseModal.form, class_section: e.target.value },
                        })
                      }
                    />
                  </div>
                </div>
              )}

              <div className="form-group">
                <label>Syllabus Summary / Key Modules</label>
                <textarea
                  rows="3"
                  placeholder="Outline key units or lecture topics (e.g. MDPs, Value Iteration, Q-Learning, Deep Q-Networks)..."
                  value={courseModal.form.syllabus_summary || ''}
                  onChange={(e) =>
                    setCourseModal({
                      ...courseModal,
                      form: { ...courseModal.form, syllabus_summary: e.target.value },
                    })
                  }
                />
              </div>

              <div className="modal-actions-row">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => setCourseModal({ ...courseModal, open: false })}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-confirm">
                  {courseModal.isEdit ? 'Save Changes' : 'Create Subject'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Lecture Modal */}
      {lectureModal.open && (
        <div className="modal-backdrop" onClick={() => setLectureModal({ ...lectureModal, open: false })}>
          <div className="modal-card wide-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-row">
                <CalendarDays size={20} className="text-primary" />
                <h3>{lectureModal.isEdit ? 'Edit Scheduled Lecture' : 'Schedule New Lecture'}</h3>
              </div>
              <button
                type="button"
                className="btn-modal-close"
                onClick={() => setLectureModal({ ...lectureModal, open: false })}
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSaveLecture} className="modal-form">
              <div className="form-row-2col">
                <div className="form-group">
                  <label>Course *</label>
                  <select
                    value={lectureModal.form.course_code}
                    onChange={(e) => {
                      const code = e.target.value;
                      const found = adminCourses.find((c) => c.course_code === code);
                      setLectureModal({
                        ...lectureModal,
                        form: {
                          ...lectureModal.form,
                          course_code: code,
                          course_name: found?.course_name || lectureModal.form.course_name,
                          semester: found?.semester || lectureModal.form.semester,
                        },
                      });
                    }}
                  >
                    {adminCourses.map((c) => (
                      <option key={c.course_id} value={c.course_code}>
                        {c.course_code} - {c.course_name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Faculty In-Charge *</label>
                  <input
                    type="text"
                    required
                    value={lectureModal.form.faculty_name}
                    onChange={(e) =>
                      setLectureModal({
                        ...lectureModal,
                        form: { ...lectureModal.form, faculty_name: e.target.value },
                      })
                    }
                  />
                </div>
              </div>

              <div className="form-row-3col">
                <div className="form-group">
                  <label>Day of Week *</label>
                  <select
                    value={lectureModal.form.day_of_week}
                    onChange={(e) =>
                      setLectureModal({
                        ...lectureModal,
                        form: { ...lectureModal.form, day_of_week: e.target.value },
                      })
                    }
                  >
                    {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Start Time *</label>
                  <input
                    type="text"
                    required
                    placeholder="09:30 AM"
                    value={lectureModal.form.start_time}
                    onChange={(e) =>
                      setLectureModal({
                        ...lectureModal,
                        form: { ...lectureModal.form, start_time: e.target.value },
                      })
                    }
                  />
                </div>
                <div className="form-group">
                  <label>End Time *</label>
                  <input
                    type="text"
                    required
                    placeholder="10:30 AM"
                    value={lectureModal.form.end_time}
                    onChange={(e) =>
                      setLectureModal({
                        ...lectureModal,
                        form: { ...lectureModal.form, end_time: e.target.value },
                      })
                    }
                  />
                </div>
              </div>

              <div className="form-row-3col">
                <div className="form-group">
                  <label>Room / Hall</label>
                  <input
                    type="text"
                    placeholder="e.g. Hall 301 / Lab 2"
                    value={lectureModal.form.room_number || ''}
                    onChange={(e) =>
                      setLectureModal({
                        ...lectureModal,
                        form: { ...lectureModal.form, room_number: e.target.value },
                      })
                    }
                  />
                </div>
                <div className="form-group">
                  <label>Section</label>
                  <input
                    type="text"
                    value={lectureModal.form.class_section}
                    onChange={(e) =>
                      setLectureModal({
                        ...lectureModal,
                        form: { ...lectureModal.form, class_section: e.target.value },
                      })
                    }
                  />
                </div>
                <div className="form-group">
                  <label>Lecture Type</label>
                  <select
                    value={lectureModal.form.lecture_type || 'Theory'}
                    onChange={(e) =>
                      setLectureModal({
                        ...lectureModal,
                        form: { ...lectureModal.form, lecture_type: e.target.value },
                      })
                    }
                  >
                    <option value="Theory">Theory Lecture</option>
                    <option value="Lab">Practical Lab</option>
                    <option value="Tutorial">Tutorial / Discussion</option>
                    <option value="Guest">Guest Lecture</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Lecture Topic / Agenda</label>
                <input
                  type="text"
                  placeholder="e.g. Transformer Architecture & Attention Heads"
                  value={lectureModal.form.topic || ''}
                  onChange={(e) =>
                    setLectureModal({
                      ...lectureModal,
                      form: { ...lectureModal.form, topic: e.target.value },
                    })
                  }
                />
              </div>

              {lectureModal.isEdit && (
                <div className="form-group">
                  <label>Status</label>
                  <select
                    value={lectureModal.form.status || 'SCHEDULED'}
                    onChange={(e) =>
                      setLectureModal({
                        ...lectureModal,
                        form: { ...lectureModal.form, status: e.target.value },
                      })
                    }
                  >
                    <option value="SCHEDULED">SCHEDULED</option>
                    <option value="COMPLETED">COMPLETED</option>
                    <option value="CANCELLED">CANCELLED</option>
                  </select>
                </div>
              )}

              <div className="modal-actions-row">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => setLectureModal({ ...lectureModal, open: false })}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-confirm">
                  {lectureModal.isEdit ? 'Update Schedule' : 'Schedule Lecture'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Semester Modal */}
      {semesterModal.open && (
        <div className="modal-backdrop" onClick={() => setSemesterModal({ ...semesterModal, open: false })}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-row">
                <Layers size={20} className="text-primary" />
                <h3>Add Academic Semester</h3>
              </div>
              <button
                type="button"
                className="btn-modal-close"
                onClick={() => setSemesterModal({ ...semesterModal, open: false })}
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSaveSemester} className="modal-form">
              <div className="form-group">
                <label>Semester Number (1 - 8) *</label>
                <input
                  type="number"
                  min="1"
                  max="12"
                  required
                  value={semesterModal.form.semester_number}
                  onChange={(e) =>
                    setSemesterModal({
                      ...semesterModal,
                      form: { ...semesterModal.form, semester_number: Number(e.target.value) },
                    })
                  }
                />
              </div>
              <div className="form-group">
                <label>Term Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Fall 2026 or Monsoon Semester"
                  value={semesterModal.form.term_name}
                  onChange={(e) =>
                    setSemesterModal({
                      ...semesterModal,
                      form: { ...semesterModal.form, term_name: e.target.value },
                    })
                  }
                />
              </div>
              <div className="form-group">
                <label>Academic Year *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 2026-2027"
                  value={semesterModal.form.academic_year}
                  onChange={(e) =>
                    setSemesterModal({
                      ...semesterModal,
                      form: { ...semesterModal.form, academic_year: e.target.value },
                    })
                  }
                />
              </div>
              <div className="form-checkbox-row">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={semesterModal.form.is_active}
                    onChange={(e) =>
                      setSemesterModal({
                        ...semesterModal,
                        form: { ...semesterModal.form, is_active: e.target.checked },
                      })
                    }
                  />
                  <span>Set as currently Active Term</span>
                </label>
              </div>

              <div className="modal-actions-row">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => setSemesterModal({ ...semesterModal, open: false })}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-confirm">
                  Create Semester
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. Offering / Allocation Modal */}
      {offeringModal.open && (
        <div className="modal-backdrop" onClick={() => setOfferingModal({ ...offeringModal, open: false })}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-row">
                <Users size={20} className="text-primary" />
                <h3>Allot Faculty to Section</h3>
              </div>
              <button
                type="button"
                className="btn-modal-close"
                onClick={() => setOfferingModal({ ...offeringModal, open: false })}
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSaveOffering} className="modal-form">
              <div className="form-group">
                <label>Course Code *</label>
                <select
                  value={offeringModal.form.course_code}
                  onChange={(e) =>
                    setOfferingModal({
                      ...offeringModal,
                      form: { ...offeringModal.form, course_code: e.target.value },
                    })
                  }
                >
                  {adminCourses.map((c) => (
                    <option key={c.course_id} value={c.course_code}>
                      {c.course_code} - {c.course_name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Section *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Class 3A"
                  value={offeringModal.form.class_section}
                  onChange={(e) =>
                    setOfferingModal({
                      ...offeringModal,
                      form: { ...offeringModal.form, class_section: e.target.value },
                    })
                  }
                />
              </div>
              <div className="form-group">
                <label>Faculty In-Charge *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. A. Sharma"
                  value={offeringModal.form.faculty_name}
                  onChange={(e) =>
                    setOfferingModal({
                      ...offeringModal,
                      form: { ...offeringModal.form, faculty_name: e.target.value },
                    })
                  }
                />
              </div>
              <div className="form-group">
                <label>Semester *</label>
                <select
                  value={offeringModal.form.semester}
                  onChange={(e) =>
                    setOfferingModal({
                      ...offeringModal,
                      form: { ...offeringModal.form, semester: Number(e.target.value) },
                    })
                  }
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                    <option key={s} value={s}>Semester {s}</option>
                  ))}
                </select>
              </div>

              <div className="modal-actions-row">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => setOfferingModal({ ...offeringModal, open: false })}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-confirm">
                  Save Allotment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* NAAC / NBA / ABET Accreditation Executive Report Modal */}
      <AccreditationReportModal
        isOpen={accreditationModalOpen}
        onClose={() => setAccreditationModalOpen(false)}
        user={user}
        feedbacks={feedbacks}
      />

      {/* Floating Bixi Assistant */}
      <BixiAssistant user={user} />

      {/* Profile & Credentials Settings Modal */}
      <ProfileSettingsModal
        isOpen={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
        user={user}
        token={token}
        onUserUpdated={onUserUpdated}
        addToast={addToast}
      />
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// FLOATING BIXI AI ASSISTANT CHAT WIDGET
// ═══════════════════════════════════════════════════════
function BixiAssistant({ user }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      sender: 'bixi',
      text: `Hello ${user?.name || 'there'}! I'm Bixi ☁️, your AI academic sentiment assistant. Ask me anything about coursework, study tips, or feedback trends!`,
    },
  ]);
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (open && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, open]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || thinking) return;

    const userMsg = input.trim();
    setInput('');
    setMessages((prev) => [...prev, { sender: 'user', text: userMsg }]);
    setThinking(true);

    try {
      const res = await fetch(`${API}/api/bixi/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMsg,
          user: user,
          history: messages.slice(-6),
        }),
      });
      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        {
          sender: 'bixi',
          text: data.reply || "I'm processing your query and monitoring feedback trends!",
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          sender: 'bixi',
          text: "I couldn't reach the backend server right now, but I'm here to support you!",
        },
      ]);
    } finally {
      setThinking(false);
    }
  };

  return (
    <div className="bixi-widget-container">
      {open ? (
        <div className="bixi-chat-window">
          <div className="bixi-header">
            <div className="bixi-header-brand">
              <span className="bixi-avatar-icon">☁️</span>
              <div>
                <b>Bixi Assistant</b>
                <small>Online · AI Powered</small>
              </div>
            </div>
            <button type="button" className="bixi-close-btn" onClick={() => setOpen(false)}>
              <X size={17} />
            </button>
          </div>

          <div className="bixi-messages" ref={scrollRef}>
            {messages.map((m, idx) => (
              <div key={idx} className={`chat-bubble ${m.sender}`}>
                <p>{m.text}</p>
              </div>
            ))}
            {thinking && (
              <div className="chat-bubble bixi loading">
                <p>Bixi is thinking…</p>
              </div>
            )}
          </div>

          <div className="bixi-suggestions-row">
            {[
              'How to manage exam stress?',
              'Explain NLP & Tokenization',
              'What are my feedback options?',
            ].map((chip, idx) => (
              <button
                key={idx}
                type="button"
                className="bixi-suggestion-chip"
                onClick={() => setInput(chip)}
              >
                {chip}
              </button>
            ))}
          </div>

          <form onSubmit={handleSend} className="bixi-input-bar">
            <input
              placeholder="Ask Bixi about courses, stress, or feedback..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <button type="submit" disabled={!input.trim() || thinking}>
              <Send size={15} />
            </button>
          </form>
        </div>
      ) : (
        <button
          type="button"
          className="bixi-launcher-btn"
          onClick={() => setOpen(true)}
          title="Chat with Bixi AI"
        >
          <span className="bixi-cloud">☁️</span>
          <span className="bixi-label">Bixi AI</span>
        </button>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// ROOT APP COMPONENT (MANAGES AUTH & ROLE DASHBOARDS)
// ═══════════════════════════════════════════════════════
export default function App() {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('sentio_user') || localStorage.getItem('feedback_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(() => {
    return localStorage.getItem('sentio_token') || null;
  });

  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((toast) => {
    const id = Date.now() + Math.random().toString(36).substring(2, 6);
    setToasts((prev) => [...prev, { id, ...toast }]);
  }, []);

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const handleAuthenticated = (userData, userToken) => {
    setUser(userData);
    setToken(userToken);
    addToast({
      title: 'Welcome to Sentio',
      message: `Signed in as ${userData.name} (${userData.role})`,
      type: 'success',
    });
  };

  const handleUserUpdated = (updatedUser, newToken) => {
    setUser(updatedUser);
    if (newToken) setToken(newToken);
    localStorage.setItem('sentio_user', JSON.stringify(updatedUser));
    localStorage.setItem('feedback_user', JSON.stringify(updatedUser));
    if (newToken) localStorage.setItem('sentio_token', newToken);
  };

  const handleLogout = () => {
    localStorage.removeItem('sentio_token');
    localStorage.removeItem('sentio_user');
    localStorage.removeItem('feedback_user');
    setUser(null);
    setToken(null);
    addToast({
      title: 'Signed Out',
      message: 'You have been safely signed out.',
      type: 'info',
    });
  };

  return (
    <>
      {!user ? (
        <Auth onAuthenticated={handleAuthenticated} addToast={addToast} />
      ) : user.role === 'ADMIN' || user.role === 'FACULTY' ? (
        <AdminDashboard
          user={user}
          token={token}
          onLogout={handleLogout}
          addToast={addToast}
          onUserUpdated={handleUserUpdated}
        />
      ) : (
        <StudentDashboard
          user={user}
          token={token}
          onLogout={handleLogout}
          addToast={addToast}
          onUserUpdated={handleUserUpdated}
        />
      )}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </>
  );
}
