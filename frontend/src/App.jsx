import { useEffect, useState, useRef, useCallback } from 'react';
import {
  Activity,
  Award,
  BookOpen,
  CalendarDays,
  Camera,
  Check,
  CheckCircle2,
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
  Layers,
  LogOut,
  MapPin,
  Menu,
  MessageSquare,
  MessageSquarePlus,
  Mic,
  MicOff,
  Plus,
  Radio,
  RotateCcw,
  Search,
  Send,
  Settings,
  Share2,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Smile,
  Sparkles,
  ThumbsUp,
  Trash2,
  User,
  UserCheck,
  Users,
  Webhook,
  X,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import SpotlightCard from './SpotlightCard';
import AnimatedCounter from './AnimatedCounter';
import ToastContainer from './Toast';

const API = import.meta.env.VITE_API_URL || '';

// ═══════════════════════════════════════════════════════
// MINIMALIST SATISFACTION BREAKDOWN BAR
// ═══════════════════════════════════════════════════════
function SimpleSatisfactionDonut({ feedbacks = [] }) {
  const total = feedbacks.length || 1;
  const positive = feedbacks.filter((f) => f.sentiment === 'POSITIVE' || f.emotion === 'joy' || f.emotion === 'clarity').length;
  const attention = feedbacks.filter((f) => f.sentiment === 'NEGATIVE' || ['sadness', 'fear', 'anger', 'confusion', 'frustration'].includes(f.emotion)).length;
  const neutral = total - positive - attention > 0 ? total - positive - attention : 0;

  const posPct = Math.round((positive / total) * 100);
  const attPct = Math.round((attention / total) * 100);
  const neuPct = 100 - posPct - attPct > 0 ? 100 - posPct - attPct : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
      <div style={{ display: 'flex', height: '10px', borderRadius: '9999px', overflow: 'hidden', background: '#f1f5f9' }}>
        <div style={{ width: `${posPct}%`, background: '#10b981', transition: 'width 0.3s' }} title={`Clear & Engaging: ${posPct}%`} />
        <div style={{ width: `${neuPct}%`, background: '#3b82f6', transition: 'width 0.3s' }} title={`General: ${neuPct}%`} />
        <div style={{ width: `${attPct}%`, background: '#f59e0b', transition: 'width 0.3s' }} title={`Needs Clarity: ${attPct}%`} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#64748b' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }} />
          Clear & Engaging: <strong style={{ color: '#0f172a' }}>{posPct}%</strong>
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#3b82f6' }} />
          General: <strong style={{ color: '#0f172a' }}>{neuPct}%</strong>
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f59e0b' }} />
          Questions / Recap: <strong style={{ color: '#0f172a' }}>{attPct}%</strong>
        </span>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// MINIMALIST COURSE CLARITY RATING
// ═══════════════════════════════════════════════════════
function SimpleCourseClarityBar({ courses = [], feedbacks = [] }) {
  if (!courses.length) {
    return <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0 }}>No course feedback data available yet.</p>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
      {courses.slice(0, 5).map((c) => {
        const cFeeds = feedbacks.filter((f) => f.course_code === c.course_code);
        const count = cFeeds.length;
        const posCount = cFeeds.filter((f) => f.sentiment === 'POSITIVE').length;
        const score = count > 0 ? Math.round((posCount / count) * 100) : 85;

        return (
          <div key={c.course_id || c.course_code}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.25rem' }}>
              <span style={{ fontWeight: 600, color: '#0f172a' }}>
                {c.course_code} · {c.course_name}
              </span>
              <span style={{ color: '#64748b' }}>
                {count > 0 ? `${score}% Positive (${count})` : 'Awaiting feedback'}
              </span>
            </div>
            <div style={{ width: '100%', height: '6px', background: '#f1f5f9', borderRadius: '9999px', overflow: 'hidden' }}>
              <div
                style={{
                  width: `${score}%`,
                  height: '100%',
                  background: score > 75 ? '#10b981' : score > 50 ? '#3b82f6' : '#f59e0b',
                  borderRadius: '9999px',
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}


// ═══════════════════════════════════════════════════════
// LIGHTWEIGHT SVG STUDENT TREND TIMELINE CURVE
// ═══════════════════════════════════════════════════════
function StudentTrendVectorCurve({ timeline = [], height = 150 }) {
  const [hoveredPoint, setHoveredPoint] = useState(null);

  const displayTimeline = timeline && timeline.length > 0 ? timeline : [
    { label: 'Week 1', date: 'Oct 12', clarity_pct: 86, volume: 2 },
    { label: 'Week 2', date: 'Oct 19', clarity_pct: 89, volume: 3 },
    { label: 'Week 3', date: 'Oct 26', clarity_pct: 92, volume: 4 },
    { label: 'Week 4 (Current)', date: 'Nov 02', clarity_pct: 96, volume: 3 },
  ];

  const width = 500;
  const paddingX = 45;
  const paddingY = 24;
  const chartW = width - paddingX * 2;
  const chartH = height - paddingY * 2;

  const minVal = 50;
  const maxVal = 100;

  const points = displayTimeline.map((pt, idx) => {
    const x = paddingX + (idx / Math.max(1, displayTimeline.length - 1)) * chartW;
    const y = paddingY + chartH - ((Math.min(100, Math.max(50, pt.clarity_pct)) - minVal) / (maxVal - minVal)) * chartH;
    return { ...pt, x, y };
  });

  let pathD = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const current = points[i];
    const next = points[i + 1];
    const cpX = (current.x + next.x) / 2;
    pathD += ` C ${cpX} ${current.y}, ${cpX} ${next.y}, ${next.x} ${next.y}`;
  }

  const areaD = `${pathD} L ${points[points.length - 1].x} ${height - paddingY} L ${points[0].x} ${height - paddingY} Z`;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      <div style={{ position: 'relative', width: '100%', overflow: 'hidden' }}>
        <svg
          viewBox={`0 0 ${width} ${height}`}
          style={{ width: '100%', height: 'auto', display: 'block' }}
        >
          <defs>
            <linearGradient id="trendEmeraldGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {[100, 80, 60].map((v) => {
            const y = paddingY + chartH - ((v - minVal) / (maxVal - minVal)) * chartH;
            return (
              <g key={v}>
                <line
                  x1={paddingX}
                  y1={y}
                  x2={width - paddingX}
                  y2={y}
                  stroke="#f1f5f9"
                  strokeWidth="1"
                  strokeDasharray="4 4"
                />
                <text
                  x={paddingX - 8}
                  y={y + 3}
                  textAnchor="end"
                  fontSize="9"
                  fill="#94a3b8"
                  fontFamily="inherit"
                >
                  {v}%
                </text>
              </g>
            );
          })}

          <path d={areaD} fill="url(#trendEmeraldGrad)" />

          <path
            d={pathD}
            fill="none"
            stroke="#10b981"
            strokeWidth="2.5"
            strokeLinecap="round"
          />

          {points.map((pt, idx) => (
            <g
              key={idx}
              onMouseEnter={() => setHoveredPoint(pt)}
              onMouseLeave={() => setHoveredPoint(null)}
              style={{ cursor: 'pointer' }}
            >
              <circle
                cx={pt.x}
                cy={pt.y}
                r="4.5"
                fill="#ffffff"
                stroke="#10b981"
                strokeWidth="2.5"
              />
              <circle
                cx={pt.x}
                cy={pt.y}
                r="12"
                fill="transparent"
              />
            </g>
          ))}
        </svg>

        {hoveredPoint && (
          <div
            style={{
              position: 'absolute',
              top: '8px',
              right: '8px',
              background: '#0f172a',
              color: '#ffffff',
              padding: '4px 8px',
              borderRadius: '6px',
              fontSize: '0.75rem',
              fontWeight: 500,
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            }}
          >
            {hoveredPoint.label}: {hoveredPoint.clarity_pct}% Clarity ({hoveredPoint.date})
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${displayTimeline.length}, 1fr)`, gap: '0.5rem' }}>
        {displayTimeline.map((pt, idx) => (
          <div
            key={idx}
            style={{
              padding: '0.5rem 0.6rem',
              borderRadius: '8px',
              background: idx === displayTimeline.length - 1 ? '#ecfdf5' : '#f8fafc',
              border: `1px solid ${idx === displayTimeline.length - 1 ? '#a7f3d0' : '#e2e8f0'}`,
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600 }}>{pt.label}</div>
            <div style={{ fontSize: '0.95rem', fontWeight: 700, color: idx === displayTimeline.length - 1 ? '#059669' : '#0f172a' }}>
              {pt.clarity_pct}%
            </div>
            <div style={{ fontSize: '0.65rem', color: '#94a3b8' }}>{pt.date}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// MINIMALIST ASPECT HEALTH METERS
// ═══════════════════════════════════════════════════════
function AspectRatingMeters({ aspects = [] }) {
  const displayAspects = aspects && aspects.length > 0 ? aspects : [
    { aspect: 'Concept Clarity', score: 96, status: 'Clear & Well-Explained', color: '#10b981' },
    { aspect: 'Pacing & Speed', score: 90, status: 'Optimal Pace', color: '#3b82f6' },
    { aspect: 'Learning Materials', score: 98, status: 'Comprehensive Slides', color: '#6366f1' },
    { aspect: 'Doubt Resolution', score: 94, status: 'Responsive', color: '#0ea5e9' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
      {displayAspects.map((asp, idx) => {
        const score = asp.score || 90;
        const color = asp.color || (score >= 90 ? '#10b981' : score >= 75 ? '#3b82f6' : '#f59e0b');
        return (
          <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.82rem' }}>
              <span style={{ fontWeight: 600, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: color }} />
                {asp.aspect}
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{asp.status}</span>
                <span style={{ fontWeight: 700, color: color }}>{score}%</span>
              </div>
            </div>
            <div style={{ width: '100%', height: '6px', background: '#f1f5f9', borderRadius: '9999px', overflow: 'hidden' }}>
              <div
                style={{
                  width: `${score}%`,
                  height: '100%',
                  background: color,
                  borderRadius: '9999px',
                  transition: 'width 0.4s ease',
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// FACULTY SUBJECTS PERFORMANCE CARDS
// ═══════════════════════════════════════════════════════
function FacultySubjectBreakdownCards({ subjects = [] }) {
  if (!subjects || subjects.length === 0) {
    return (
      <div style={{ padding: '1rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>
        No course subjects currently assigned.
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '0.85rem' }}>
      {subjects.map((sub) => {
        const score = sub.satisfaction_pct || 92;
        const color = score >= 85 ? '#059669' : score >= 70 ? '#2563eb' : '#d97706';
        const bgSoft = score >= 85 ? '#ecfdf5' : score >= 70 ? '#eff6ff' : '#fffbeb';
        const borderSoft = score >= 85 ? '#a7f3d0' : score >= 70 ? '#bfdbfe' : '#fde68a';

        return (
          <div
            key={sub.course_code}
            style={{
              padding: '0.9rem',
              borderRadius: '10px',
              border: `1px solid ${borderSoft}`,
              background: '#ffffff',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.6rem',
              boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span className="course-tag" style={{ marginBottom: '0.25rem', display: 'inline-block' }}>
                  {sub.course_code}
                </span>
                <div style={{ fontWeight: 600, fontSize: '0.88rem', color: '#0f172a', lineHeight: 1.3 }}>
                  {sub.course_name}
                </div>
              </div>
              <span
                style={{
                  padding: '2px 8px',
                  borderRadius: '9999px',
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  background: bgSoft,
                  color: color,
                  border: `1px solid ${borderSoft}`,
                }}
              >
                {score}% Clarity
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: '#64748b' }}>
              <span>
                {sub.sections && sub.sections.length > 0 ? sub.sections.join(', ') : 'All Sections'} · Sem {sub.semester || 5}
              </span>
              <span>
                {sub.feedback_count > 0 ? `${sub.feedback_count} feedback${sub.feedback_count > 1 ? 's' : ''}` : 'Awaiting feedback'}
              </span>
            </div>

            <div style={{ width: '100%', height: '5px', background: '#f1f5f9', borderRadius: '9999px', overflow: 'hidden' }}>
              <div
                style={{
                  width: `${score}%`,
                  height: '100%',
                  background: color,
                  borderRadius: '9999px',
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// ADMIN FACULTY PERFORMANCE & SUBJECT TEACHING ANALYTICS
// ═══════════════════════════════════════════════════════
function AdminFacultyWorkspace({
  facultyData = { faculty: [], total_faculty: 0, total_feedbacks: 0, avg_institution_rating: 92 },
  selectedFaculty,
  onSelectFaculty,
  onCloseDrilldown,
}) {
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('rating');

  const allFaculty = facultyData.faculty || [];

  const filteredFaculty = allFaculty.filter((f) => {
    const matchDept = deptFilter === 'ALL' || f.department === deptFilter;
    const q = search.toLowerCase().trim();
    const matchQuery =
      !q ||
      f.name?.toLowerCase().includes(q) ||
      f.email?.toLowerCase().includes(q) ||
      f.subjects?.some((s) => s.course_code?.toLowerCase().includes(q) || s.course_name?.toLowerCase().includes(q));
    return matchDept && matchQuery;
  }).sort((a, b) => {
    if (sortBy === 'rating') return (b.satisfaction_pct || 0) - (a.satisfaction_pct || 0);
    if (sortBy === 'feedbacks') return (b.feedback_count || 0) - (a.feedback_count || 0);
    return (a.name || '').localeCompare(b.name || '');
  });

  const departments = ['ALL', ...new Set(allFaculty.map((f) => f.department).filter(Boolean))];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div className="metrics-row">
        <div className="card metric-card">
          <span className="metric-label">Evaluated Faculty</span>
          <div className="metric-number">
            <AnimatedCounter value={allFaculty.length || 85} />
          </div>
          <span className="metric-caption">Instructors active in directory</span>
        </div>

        <div className="card metric-card">
          <span className="metric-label">Institutional Clarity Average</span>
          <div className="metric-number emerald">
            <AnimatedCounter value={Math.round(facultyData.avg_institution_rating || 92)} suffix="%" />
          </div>
          <span className="metric-caption">Overall student satisfaction rating</span>
        </div>

        <div className="card metric-card">
          <span className="metric-label">Total Student Reviews</span>
          <div className="metric-number">
            <AnimatedCounter value={facultyData.total_feedbacks || 6} />
          </div>
          <span className="metric-caption">Feedback submissions analyzed</span>
        </div>

        <div className="card metric-card">
          <span className="metric-label">Academic Departments</span>
          <div className="metric-number">
            <AnimatedCounter value={Math.max(4, departments.length - 1)} />
          </div>
          <span className="metric-caption">Disciplines currently monitored</span>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
        <div className="search-input-box" style={{ minWidth: '280px', flex: 1 }}>
          <Search size={15} style={{ color: '#94a3b8' }} />
          <input
            type="text"
            placeholder="Search faculty name, subject code, or keyword..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <select
            className="section-select-dropdown"
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
          >
            {departments.map((d) => (
              <option key={d} value={d}>
                {d === 'ALL' ? 'All Departments' : d}
              </option>
            ))}
          </select>

          <select
            className="section-select-dropdown"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="rating">Sort: Highest Clarity Rating</option>
            <option value="feedbacks">Sort: Most Student Reviews</option>
            <option value="name">Sort: Faculty Name (A-Z)</option>
          </select>
        </div>
      </div>

      {filteredFaculty.length === 0 ? (
        <div className="empty-state card">
          <p>No faculty members match your filter criteria.</p>
        </div>
      ) : (
        <div className="faculty-grid">
          {filteredFaculty.map((fac) => {
            const score = fac.satisfaction_pct || 91;
            const isTop = score >= 90;
            return (
              <div key={fac.faculty_id || fac.name} className="faculty-card">
                <div>
                  <div className="faculty-card-header">
                    <div className="faculty-avatar-box">
                      {fac.name?.charAt(0) || 'F'}
                    </div>
                    <div className="faculty-info-wrap">
                      <h4 className="faculty-name-title" title={fac.name}>
                        {fac.name}
                      </h4>
                      <div className="faculty-sub-meta">
                        <span>{fac.department || 'Faculty of Science & Technology'}</span>
                        <span style={{ color: '#94a3b8' }}>{fac.email}</span>
                      </div>
                    </div>
                    <div className={`faculty-score-chip ${isTop ? 'high' : 'mid'}`}>
                      <span>★</span>
                      <span>{score}%</span>
                    </div>
                  </div>

                  <div style={{ marginTop: '0.9rem' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', marginBottom: '0.35rem' }}>
                      Assigned Subjects ({fac.subjects?.length || fac.courses_assigned || 1})
                    </div>
                    <div className="faculty-subjects-wrap">
                      {fac.subjects && fac.subjects.length > 0 ? (
                        fac.subjects.slice(0, 3).map((sub) => (
                          <span key={sub.course_code} className="faculty-sub-pill" title={sub.course_name}>
                            <strong>{sub.course_code}</strong> ({sub.feedback_count || 0})
                          </span>
                        ))
                      ) : (
                        <span className="faculty-sub-pill">General Engineering</span>
                      )}
                      {fac.subjects && fac.subjects.length > 3 && (
                        <span className="faculty-sub-pill" style={{ color: '#94a3b8' }}>
                          +{fac.subjects.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="faculty-card-footer">
                  <span style={{ color: '#64748b', fontSize: '0.78rem' }}>
                    {fac.feedback_count > 0 ? (
                      <strong style={{ color: '#0f172a' }}>{fac.feedback_count} student review{fac.feedback_count > 1 ? 's' : ''}</strong>
                    ) : (
                      'Baseline review'
                    )}
                  </span>
                  <button
                    type="button"
                    className="btn-inspect-faculty"
                    onClick={() => onSelectFaculty(fac)}
                  >
                    Inspect Subjects & Trends →
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selectedFaculty && (
        <div className="faculty-modal-overlay" onClick={onCloseDrilldown}>
          <div className="faculty-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="faculty-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div className="faculty-avatar-box" style={{ width: '48px', height: '48px', fontSize: '1.25rem' }}>
                  {selectedFaculty.name?.charAt(0)}
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#0f172a' }}>
                    {selectedFaculty.name}
                  </h3>
                  <span style={{ fontSize: '0.82rem', color: '#64748b' }}>
                    {selectedFaculty.department} · {selectedFaculty.email}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={onCloseDrilldown}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b', padding: '0.5rem' }}
              >
                <X size={20} />
              </button>
            </div>

            <div className="faculty-modal-body">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
                <div style={{ padding: '0.85rem', background: '#ecfdf5', borderRadius: '10px', border: '1px solid #a7f3d0' }}>
                  <span style={{ fontSize: '0.75rem', color: '#065f46', fontWeight: 600 }}>Overall Satisfaction</span>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#059669', margin: '0.2rem 0' }}>
                    {selectedFaculty.satisfaction_pct || 91}%
                  </div>
                  <span style={{ fontSize: '0.72rem', color: '#047857' }}>★ {selectedFaculty.rating || 4.7} / 5.0 Rating</span>
                </div>

                <div style={{ padding: '0.85rem', background: '#eff6ff', borderRadius: '10px', border: '1px solid #bfdbfe' }}>
                  <span style={{ fontSize: '0.75rem', color: '#1e40af', fontWeight: 600 }}>Student Reviews</span>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#2563eb', margin: '0.2rem 0' }}>
                    {selectedFaculty.feedback_count || 0}
                  </div>
                  <span style={{ fontSize: '0.72rem', color: '#3b82f6' }}>Direct student responses</span>
                </div>

                <div style={{ padding: '0.85rem', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                  <span style={{ fontSize: '0.75rem', color: '#475569', fontWeight: 600 }}>Assigned Subjects</span>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a', margin: '0.2rem 0' }}>
                    {selectedFaculty.subjects?.length || selectedFaculty.courses_assigned || 1}
                  </div>
                  <span style={{ fontSize: '0.72rem', color: '#64748b' }}>Curriculum offerings</span>
                </div>
              </div>

              <div className="card" style={{ padding: '1rem', background: '#f8fafc' }}>
                <h4 style={{ margin: '0 0 0.85rem 0', fontSize: '0.9rem', color: '#0f172a' }}>
                  Teaching Quality & Aspect Breakdown
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.85rem' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem' }}>
                      <span style={{ color: '#475569' }}>Concept Clarity</span>
                      <strong style={{ color: '#059669' }}>{selectedFaculty.aspects?.concept_clarity || 94}%</strong>
                    </div>
                    <div style={{ height: '5px', background: '#e2e8f0', borderRadius: '9999px', overflow: 'hidden' }}>
                      <div style={{ width: `${selectedFaculty.aspects?.concept_clarity || 94}%`, height: '100%', background: '#10b981' }} />
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem' }}>
                      <span style={{ color: '#475569' }}>Pacing & Delivery</span>
                      <strong style={{ color: '#2563eb' }}>{selectedFaculty.aspects?.pacing_speed || 88}%</strong>
                    </div>
                    <div style={{ height: '5px', background: '#e2e8f0', borderRadius: '9999px', overflow: 'hidden' }}>
                      <div style={{ width: `${selectedFaculty.aspects?.pacing_speed || 88}%`, height: '100%', background: '#3b82f6' }} />
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem' }}>
                      <span style={{ color: '#475569' }}>Learning Materials</span>
                      <strong style={{ color: '#6366f1' }}>{selectedFaculty.aspects?.learning_materials || 96}%</strong>
                    </div>
                    <div style={{ height: '5px', background: '#e2e8f0', borderRadius: '9999px', overflow: 'hidden' }}>
                      <div style={{ width: `${selectedFaculty.aspects?.learning_materials || 96}%`, height: '100%', background: '#6366f1' }} />
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem' }}>
                      <span style={{ color: '#475569' }}>Doubt Resolution</span>
                      <strong style={{ color: '#0ea5e9' }}>{selectedFaculty.aspects?.doubt_resolution || 91}%</strong>
                    </div>
                    <div style={{ height: '5px', background: '#e2e8f0', borderRadius: '9999px', overflow: 'hidden' }}>
                      <div style={{ width: `${selectedFaculty.aspects?.doubt_resolution || 91}%`, height: '100%', background: '#0ea5e9' }} />
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.95rem', color: '#0f172a' }}>
                  Subject-by-Subject Student Feedback Performance
                </h4>
                <p style={{ margin: '0 0 0.85rem 0', fontSize: '0.82rem', color: '#64748b' }}>
                  Detailed clarity and student satisfaction metrics across courses taught by {selectedFaculty.name}.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {selectedFaculty.subjects && selectedFaculty.subjects.length > 0 ? (
                    selectedFaculty.subjects.map((sub) => {
                      const subScore = sub.satisfaction_pct || 92;
                      const isHigh = subScore >= 85;
                      return (
                        <div
                          key={sub.course_code}
                          style={{
                            padding: '0.9rem',
                            borderRadius: '8px',
                            border: '1px solid #e2e8f0',
                            background: '#ffffff',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.6rem',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span className="course-tag">{sub.course_code}</span>
                                <strong style={{ color: '#0f172a', fontSize: '0.9rem' }}>{sub.course_name}</strong>
                              </div>
                              <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '0.2rem' }}>
                                {sub.sections && sub.sections.length > 0 ? sub.sections.join(', ') : 'All Sections'} · Semester {sub.semester || 5}
                              </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                              <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                                {sub.feedback_count > 0 ? `${sub.feedback_count} review${sub.feedback_count > 1 ? 's' : ''}` : 'Awaiting feedback'}
                              </span>
                              <span
                                style={{
                                  padding: '2px 8px',
                                  borderRadius: '9999px',
                                  fontSize: '0.75rem',
                                  fontWeight: 700,
                                  background: isHigh ? '#ecfdf5' : '#eff6ff',
                                  color: isHigh ? '#059669' : '#2563eb',
                                  border: `1px solid ${isHigh ? '#a7f3d0' : '#bfdbfe'}`,
                                }}
                              >
                                {subScore}% Clarity
                              </span>
                            </div>
                          </div>

                          <div style={{ width: '100%', height: '5px', background: '#f1f5f9', borderRadius: '9999px', overflow: 'hidden' }}>
                            <div
                              style={{
                                width: `${subScore}%`,
                                height: '100%',
                                background: isHigh ? '#10b981' : '#3b82f6',
                                borderRadius: '9999px',
                              }}
                            />
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div style={{ padding: '0.75rem', color: '#94a3b8', fontSize: '0.82rem' }}>
                      No assigned course offerings found for this faculty member.
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.95rem', color: '#0f172a' }}>
                  Student Comments & Clarification Requests
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {selectedFaculty.recent_feedbacks && selectedFaculty.recent_feedbacks.length > 0 ? (
                    selectedFaculty.recent_feedbacks.map((fb) => (
                      <div
                        key={fb.feedback_id}
                        style={{
                          padding: '0.85rem',
                          borderRadius: '8px',
                          border: '1px solid #e2e8f0',
                          background: '#f8fafc',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                          <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#0f172a' }}>
                            {fb.course_code} · {fb.class_section}
                          </span>
                          <span className={`sentiment-badge ${fb.sentiment === 'POSITIVE' ? 'positive' : 'needs-clarity'}`}>
                            {fb.sentiment === 'POSITIVE' ? 'Clear & Engaging' : 'Needs Clarification'}
                          </span>
                        </div>
                        <p style={{ margin: '0 0 0.4rem 0', fontSize: '0.82rem', color: '#334155', lineHeight: 1.4 }}>
                          "{fb.feedback_text}"
                        </p>
                        {fb.action_taken && (
                          <div style={{ fontSize: '0.75rem', color: '#059669', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <Check size={12} /> Response: {fb.action_taken}
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div style={{ padding: '1rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>
                      No individual student feedback submissions recorded yet.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// MINDFUL 2-MINUTE BREATHING WIDGET
// ═══════════════════════════════════════════════════════
function MindfulBreathingWidget() {
  const [running, setRunning] = useState(false);
  const [phase, setPhase] = useState('Inhale');
  const [timer, setTimer] = useState(4);

  useEffect(() => {
    if (!running) return;
    const interval = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          setPhase((p) => (p === 'Inhale' ? 'Hold' : p === 'Hold' ? 'Exhale' : 'Inhale'));
          return 4;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [running]);

  return (
    <div style={{ textAlign: 'center', padding: '1rem' }}>
      <div
        style={{
          width: '100px',
          height: '100px',
          borderRadius: '50%',
          margin: '0 auto 1rem auto',
          background: running ? '#eff6ff' : '#f8fafc',
          border: '2px solid #3b82f6',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.5s ease',
          transform: running && phase === 'Inhale' ? 'scale(1.15)' : 'scale(1)',
        }}
      >
        <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1e40af' }}>{running ? phase : 'Breathe'}</span>
        {running && <span style={{ fontSize: '1.25rem', fontWeight: 700, color: '#2563eb' }}>{timer}s</span>}
      </div>
      <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '0 0 0.85rem 0' }}>
        {running ? 'Focus gently on your breath to relieve study stress.' : 'Take a calm 2-minute mindful pause between lectures.'}
      </p>
      <button
        type="button"
        className="btn-header-action primary"
        onClick={() => setRunning(!running)}
        style={{ margin: '0 auto' }}
      >
        {running ? 'Stop Exercise' : 'Start 2-Min Reset'}
      </button>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// AUTHENTICATION COMPONENT
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

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const switchMode = (targetMode) => {
    setError('');
    setSuccessMsg('');
    setOtpInfo('');
    setOtpSent(false);
    setCountdown(0);
    setMode(targetMode);
  };

  const handleSendOtp = async (purpose) => {
    const emailToUse = form.email.trim();
    if (!emailToUse || !emailToUse.includes('@')) {
      setError('Please provide a valid university email to receive your OTP.');
      return;
    }
    setError('');
    setOtpSending(true);

    try {
      const res = await fetch(`${API}/api/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailToUse, purpose }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Could not send verification code');

      setOtpSent(true);
      setCountdown(60);
      setOtpInfo(data.message || `Code sent to ${emailToUse}`);
      addToast?.({
        title: 'Verification Code Sent',
        message: data.message || `A 6-digit code has been delivered to ${emailToUse}.`,
        type: 'info',
      });
    } catch (err) {
      setError(err.message || 'Error sending verification code');
    } finally {
      setOtpSending(false);
    }
  };

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
          body: JSON.stringify({ email: form.email.trim(), password: form.password }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || 'Invalid login credentials');

        onAuthenticated(data.user, data.access_token);
        addToast?.({
          title: 'Welcome Back',
          message: `Signed in as ${data.user.name}`,
          type: 'success',
        });
      } else if (mode === 'register') {
        if (!otpSent) {
          throw new Error('Please send and enter the email verification code first.');
        }
        if (!form.otp_code || form.otp_code.trim().length !== 6) {
          throw new Error('Please enter the 6-digit verification code sent to your email.');
        }
        if (form.password.length < 6) {
          throw new Error('Password must be at least 6 characters long.');
        }
        if (form.password !== form.confirmPassword) {
          throw new Error('Passwords do not match.');
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
            class_section: form.role === 'STUDENT' ? form.class_section : 'Faculty',
            otp_code: form.otp_code.trim(),
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || 'Registration failed');

        onAuthenticated(data.user, data.access_token);
        addToast?.({
          title: 'Account Created',
          message: 'Welcome to Sentio! Your account has been registered.',
          type: 'success',
        });
      } else if (mode === 'forgot') {
        if (!otpSent) {
          throw new Error('Please send and enter the verification code first.');
        }
        if (!form.otp_code || form.otp_code.trim().length !== 6) {
          throw new Error('Please enter the 6-digit verification code.');
        }
        if (form.password.length < 6) {
          throw new Error('New password must be at least 6 characters.');
        }
        if (form.password !== form.confirmPassword) {
          throw new Error('Passwords do not match.');
        }

        const res = await fetch(`${API}/api/auth/reset-password`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: form.email.trim(),
            otp_code: form.otp_code.trim(),
            new_password: form.password,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || 'Password reset failed');

        setSuccessMsg('Your password has been reset. You may now sign in.');
        addToast?.({
          title: 'Password Reset',
          message: 'You can now sign in with your new password.',
          type: 'success',
        });
        setMode('login');
      }
    } catch (err) {
      setError(err.message || 'Authentication error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-layout">
      {/* Left Clean Hero Panel */}
      <section className="brand-panel">
        <div className="brand">
          <span className="brand-mark">
            <MessageSquare size={20} />
          </span>
          <span>Sentio</span>
          <span className="brand-tagline">Academic Feedback</span>
        </div>

        <div className="hero-copy">
          <span className="eyebrow">A Better Way to Listen</span>
          <h1>
            Clear, constructive feedback for every classroom.
          </h1>
          <p>
            A calm, confidential space for students to share how classes are going, and for instructors to understand where students need more clarity.
          </p>

          <div className="hero-feature-list">
            <div className="hero-feature-item">
              <div className="feature-icon-wrap">
                <Check size={14} />
              </div>
              <div className="feature-text">
                <strong>Confidential & Safe</strong>
                <span>Share candid feedback on pacing and lecture topics anonymously.</span>
              </div>
            </div>
            <div className="hero-feature-item">
              <div className="feature-icon-wrap">
                <CalendarDays size={14} />
              </div>
              <div className="feature-text">
                <strong>Schedule & Courses</strong>
                <span>Easily view weekly timetable sessions and review each class in 1 click.</span>
              </div>
            </div>
            <div className="hero-feature-item">
              <div className="feature-icon-wrap">
                <Users size={14} />
              </div>
              <div className="feature-text">
                <strong>Direct Academic Dialogue</strong>
                <span>Instructors can post direct answers, clarifications, and recap notes.</span>
              </div>
            </div>
          </div>
        </div>

        <div className="brand-panel-footer">
          <span>&copy; {new Date().getFullYear()} Sentio · Student Voice & Learning Insights</span>
        </div>
      </section>

      {/* Right Form Card */}
      <section className="auth-side">
        <div className="auth-card">
          <div className="mobile-brand">
            <span className="brand-mark"><MessageSquare size={18} /></span>
            <span>Sentio</span>
          </div>

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
              <button type="button" className="mode-tab active">
                Reset Password
              </button>
            )}
          </div>

          <div className="auth-card-header">
            <h2>
              {mode === 'login' ? 'Welcome back' : mode === 'register' ? 'Create your account' : 'Reset password'}
            </h2>
            <p>
              {mode === 'login'
                ? 'Sign in with your university email or student roll number.'
                : mode === 'register'
                ? 'Join with your student roll number or faculty credentials.'
                : 'Enter your email to receive a password reset verification code.'}
            </p>
          </div>

          {/* Quick Demo Access Bar */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.6rem 0.85rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', marginBottom: '1.25rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b' }}>Quick Demo:</span>
            <div style={{ display: 'flex', gap: '0.35rem' }}>
              <button
                type="button"
                className="btn-header-action"
                style={{ padding: '0.25rem 0.55rem', fontSize: '0.75rem' }}
                onClick={() => onAuthenticated({
                  user_id: 1,
                  student_id: 1,
                  name: 'Arunn Reddy',
                  roll_no: '2024-AI-042',
                  email: 'student@univ.edu',
                  role: 'STUDENT',
                  semester: 5,
                  class_section: 'Class 3A',
                }, 'dev-bypass-token')}
              >
                Student
              </button>
              <button
                type="button"
                className="btn-header-action"
                style={{ padding: '0.25rem 0.55rem', fontSize: '0.75rem' }}
                onClick={() => onAuthenticated({
                  user_id: 2,
                  name: 'Dr. A. Sharma',
                  roll_no: 'FACULTY-001',
                  email: 'faculty@univ.edu',
                  role: 'FACULTY',
                  department: 'AI & Data Science',
                  semester: 5,
                  class_section: 'Class 3A',
                }, 'dev-bypass-token')}
              >
                Faculty
              </button>
              <button
                type="button"
                className="btn-header-action"
                style={{ padding: '0.25rem 0.55rem', fontSize: '0.75rem' }}
                onClick={() => onAuthenticated({
                  user_id: 3,
                  name: 'Dean Academics',
                  roll_no: 'ADMIN-001',
                  email: 'admin@univ.edu',
                  role: 'ADMIN',
                  department: 'Engineering',
                  semester: 5,
                  class_section: 'Class 3A',
                }, 'dev-bypass-token')}
              >
                Admin
              </button>
            </div>
          </div>

          {error && <div className="form-alert error">{error}</div>}
          {successMsg && <div className="form-alert success">{successMsg}</div>}
          {otpInfo && <div className="form-alert info">{otpInfo}</div>}

          <form onSubmit={handleSubmit} className="auth-form-body">
            {mode === 'register' && (
              <>
                <div className="form-group">
                  <label>Full Name *</label>
                  <input
                    required
                    placeholder="e.g. Rahul Sharma"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Roll No / Staff ID *</label>
                    <input
                      required
                      placeholder="e.g. 2024-AI-042"
                      value={form.roll_no}
                      onChange={(e) => setForm({ ...form, roll_no: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Role *</label>
                    <select
                      value={form.role}
                      onChange={(e) => setForm({ ...form, role: e.target.value })}
                    >
                      <option value="STUDENT">Student</option>
                      <option value="FACULTY">Faculty Member</option>
                      <option value="ADMIN">Administrator</option>
                    </select>
                  </div>
                </div>

                {form.role === 'STUDENT' && (
                  <div className="form-row">
                    <div className="form-group">
                      <label>Semester</label>
                      <select
                        value={form.semester}
                        onChange={(e) => setForm({ ...form, semester: Number(e.target.value) })}
                      >
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                          <option key={s} value={s}>Semester {s}</option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Class Section</label>
                      <select
                        value={form.class_section}
                        onChange={(e) => setForm({ ...form, class_section: e.target.value })}
                      >
                        <option value="Class 3A">Class 3A</option>
                        <option value="Class 3B">Class 3B</option>
                        <option value="Class 2A">Class 2A</option>
                        <option value="Class 1A">Class 1A</option>
                      </select>
                    </div>
                  </div>
                )}
              </>
            )}

            <div className="form-group">
              <label>
                {mode === 'login' ? 'University Email or Roll Number *' : 'University Email *'}
              </label>
              <div className={mode !== 'login' ? 'input-with-action' : ''}>
                <input
                  required
                  placeholder={mode === 'login' ? 'student@univ.edu or 2024-AI-042' : 'you@univ.edu'}
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
                {mode !== 'login' && (
                  <button
                    type="button"
                    className="btn-otp-action"
                    disabled={otpSending || countdown > 0}
                    onClick={() => handleSendOtp(mode === 'register' ? 'REGISTER' : 'RESET_PASSWORD')}
                  >
                    {otpSending ? 'Sending…' : countdown > 0 ? `${countdown}s` : otpSent ? 'Resend' : 'Send Code'}
                  </button>
                )}
              </div>
            </div>

            {mode !== 'login' && otpSent && (
              <div className="form-group">
                <label>6-Digit Verification Code *</label>
                <input
                  required
                  placeholder="Enter 6-digit code"
                  maxLength={6}
                  value={form.otp_code}
                  onChange={(e) => setForm({ ...form, otp_code: e.target.value })}
                />
              </div>
            )}

            <div className="form-group">
              <label>{mode === 'forgot' ? 'New Password *' : 'Password *'}</label>
              <div className="input-password-wrap">
                <input
                  required
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                />
                <button
                  type="button"
                  className="btn-toggle-pw"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {mode !== 'login' && (
              <div className="form-group">
                <label>Confirm Password *</label>
                <input
                  required
                  type="password"
                  placeholder="••••••••"
                  value={form.confirmPassword}
                  onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                />
              </div>
            )}

            <button type="submit" className="btn-submit-primary" disabled={loading}>
              {loading
                ? 'Processing…'
                : mode === 'login'
                ? 'Sign In'
                : mode === 'register'
                ? 'Complete Registration'
                : 'Save New Password'}
            </button>
          </form>

          <div className="auth-card-footer">
            {mode === 'login' ? (
              <p>
                Forgot your password?{' '}
                <button type="button" className="btn-link" onClick={() => switchMode('forgot')}>
                  Reset it here
                </button>
              </p>
            ) : (
              <p>
                Already have an account?{' '}
                <button type="button" className="btn-link" onClick={() => switchMode('login')}>
                  Sign in
                </button>
              </p>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}

// ═══════════════════════════════════════════════════════
// PROFILE SETTINGS MODAL
// ═══════════════════════════════════════════════════════
function ProfileSettingsModal({ isOpen, onClose, user, token, onUserUpdated, addToast }) {
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [rollNo, setRollNo] = useState(user?.roll_no || '');
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMsg('');
    setErr('');

    try {
      const payload = { name: name.trim(), email: email.trim(), roll_no: rollNo.trim() };
      if (newPassword.trim()) {
        payload.old_password = oldPassword;
        payload.new_password = newPassword;
      }

      const res = await fetch(`${API}/api/auth/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Failed to update profile');

      onUserUpdated?.(data.user);
      setMsg(data.message || 'Profile updated successfully.');
      addToast?.({ title: 'Profile Updated', message: 'Your details have been saved.', type: 'success' });
      setOldPassword('');
      setNewPassword('');
    } catch (e) {
      setErr(e.message || 'Error updating profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Account Settings</h3>
          <button type="button" className="btn-close-modal" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {msg && <div className="form-alert success">{msg}</div>}
        {err && <div className="form-alert error">{err}</div>}

        <form onSubmit={handleSubmit} className="auth-form-body">
          <div className="form-group">
            <label>Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>University Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Roll Number / Staff ID</label>
            <input value={rollNo} onChange={(e) => setRollNo(e.target.value)} />
          </div>

          <div style={{ margin: '0.75rem 0 0.25rem 0', borderTop: '1px solid #e2e8f0', paddingTop: '0.75rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0f172a' }}>Change Password (Optional)</span>
          </div>
          <div className="form-group">
            <label>Current Password</label>
            <input
              type="password"
              placeholder="Enter current password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>New Password</label>
            <input
              type="password"
              placeholder="Enter new password (min 6 chars)"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-cancel" onClick={onClose}>
              Close
            </button>
            <button type="submit" className="btn-confirm" disabled={saving}>
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// ACCREDITATION & SEMESTER SUMMARY REPORT MODAL
// ═══════════════════════════════════════════════════════
function AccreditationReportModal({ isOpen, onClose, user, feedbacks = [] }) {
  if (!isOpen) return null;

  const total = feedbacks.length;
  const positive = feedbacks.filter((f) => f.sentiment === 'POSITIVE').length;
  const posRate = total > 0 ? Math.round((positive / total) * 100) : 84;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" style={{ maxWidth: '640px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Academic Semester Feedback Summary Report</h3>
          <button type="button" className="btn-close-modal" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.875rem' }}>
          <p style={{ color: '#64748b', margin: 0 }}>
            Generated for administrative and academic committee review. Covers student clarity ratings, course feedback volume, and resolution tracking.
          </p>

          <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>REPORTING PERIOD</span>
                <strong>Fall 2026 Semester</strong>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>DEPARTMENT</span>
                <strong>{user?.department || 'AI & Data Science'}</strong>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>TOTAL RESPONSES</span>
                <strong>{total} Submissions</strong>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>SATISFACTION RATE</span>
                <strong style={{ color: '#059669' }}>{posRate}% Positive</strong>
              </div>
            </div>
          </div>

          <div style={{ marginTop: '0.5rem' }}>
            <span style={{ fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>Key Takeaways</span>
            <ul style={{ paddingLeft: '1.25rem', margin: 0, color: '#475569', lineHeight: 1.6 }}>
              <li>Student engagement remained high across core lecture series.</li>
              <li>Practical demonstration labs received consistent positive feedback.</li>
              <li>Clarification recap notes effectively closed student queries.</li>
            </ul>
          </div>
        </div>

        <div className="modal-actions">
          <button type="button" className="btn-cancel" onClick={onClose}>
            Close
          </button>
          <button type="button" className="btn-confirm" onClick={handlePrint}>
            Print / Save PDF
          </button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// STUDENT DASHBOARD
// ═══════════════════════════════════════════════════════
function StudentDashboard({ user, token, onLogout, onSwitchRole, addToast, onUserUpdated }) {
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('submit'); // 'submit' | 'courses' | 'wellbeing' | 'community' | 'grievance'
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Data States
  const [feedbacks, setFeedbacks] = useState([]);
  const [allottedSubjects, setAllottedSubjects] = useState([]);
  const [studentLectures, setStudentLectures] = useState([]);
  const [studentSelectedSem, setStudentSelectedSem] = useState(user.semester || 5);
  const [studentDayFilter, setStudentDayFilter] = useState('ALL');
  const [coursesViewTab, setCoursesViewTab] = useState('timetable'); // 'timetable' | 'catalog' | 'mentors'
  const [mentors, setMentors] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [communityPosts, setCommunityPosts] = useState([]);
  const [studyPods, setStudyPods] = useState([]);
  const [pulseRequests, setPulseRequests] = useState([]);

  // Feedback Form State
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [feedbackText, setFeedbackText] = useState('');
  const [selectedTag, setSelectedTag] = useState('Clear & Engaging');
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef(null);

  // Reflection Journal State
  const [journalNote, setJournalNote] = useState('');
  const [savedJournal, setSavedJournal] = useState([]);

  // Grievance Form State
  const [complaintForm, setComplaintForm] = useState({
    title: '',
    category: 'Academics & Teaching',
    description: '',
  });
  const [complaintSubmitting, setComplaintSubmitting] = useState(false);

  // Load Data
  const loadStudentData = useCallback(async () => {
    try {
      const secParam = encodeURIComponent(user.class_section || 'Class 3A');
      const semParam = studentSelectedSem || user.semester || 5;

      const [feedRes, subRes, lecRes, menRes, compRes, postRes, podRes, reqRes] = await Promise.all([
        fetch(`${API}/feedback/?class_section=${secParam}`).then((r) => r.json()).catch(() => ({ feedback: [] })),
        fetch(`${API}/feedback/allotted-subjects?semester=${semParam}&class_section=${secParam}`).then((r) => r.json()).catch(() => ({ subjects: [] })),
        fetch(`${API}/feedback/lectures?semester=${semParam}&class_section=${secParam}`).then((r) => r.json()).catch(() => ({ lectures: [] })),
        fetch(`${API}/feedback/student/mentors`).then((r) => r.json()).catch(() => null),
        fetch(`${API}/feedback/complaints?section=${secParam}`).then((r) => r.json()).catch(() => ({ complaints: [] })),
        fetch(`${API}/feedback/community-posts`).then((r) => r.json()).catch(() => ({ posts: [] })),
        fetch(`${API}/feedback/study-pods`).then((r) => r.json()).catch(() => ({ study_pods: [] })),
        fetch(`${API}/feedback/requests?section=${secParam}`).then((r) => r.json()).catch(() => ({ requests: [] })),
      ]);

      if (feedRes?.feedback) setFeedbacks(feedRes.feedback);
      if (subRes?.subjects) {
        setAllottedSubjects(subRes.subjects);
        if (!selectedCourse && subRes.subjects.length > 0) {
          setSelectedCourse(subRes.subjects[0]);
        }
      }
      if (lecRes?.lectures) setStudentLectures(lecRes.lectures);
      if (menRes) setMentors(menRes);
      if (compRes?.complaints) setComplaints(compRes.complaints);
      if (postRes?.posts) setCommunityPosts(postRes.posts);
      if (podRes?.study_pods) setStudyPods(podRes.study_pods);
      if (reqRes?.requests) setPulseRequests(reqRes.requests);
    } catch (e) {
      console.error('Error loading student data:', e);
    }
  }, [user.class_section, user.semester, studentSelectedSem]);

  useEffect(() => {
    loadStudentData();
  }, [loadStudentData]);

  // Speech to text
  const toggleSpeechRecognition = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      addToast?.({ title: 'Voice Note', message: 'Speech recognition not supported in this browser.', type: 'info' });
      return;
    }
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
      return;
    }
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const rec = new SpeechRecognition();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = 'en-US';
    rec.onresult = (evt) => {
      let transcript = '';
      for (let i = evt.resultIndex; i < evt.results.length; ++i) {
        transcript += evt.results[i][0].transcript;
      }
      setFeedbackText((prev) => (prev ? `${prev} ${transcript}` : transcript));
    };
    rec.onerror = () => setIsRecording(false);
    rec.onend = () => setIsRecording(false);
    rec.start();
    recognitionRef.current = rec;
    setIsRecording(true);
  };

  // Submit Feedback
  const handleSubmitFeedback = async (e) => {
    e.preventDefault();
    if (!feedbackText.trim()) return;
    setSubmitting(true);

    try {
      const payload = {
        student_id: user.student_id || 1,
        student_name: isAnonymous ? 'Anonymous Student' : user.name,
        roll_no: isAnonymous ? 'ANON' : user.roll_no || 'STUDENT',
        course_id: selectedCourse?.course_id || 1,
        course_code: selectedCourse?.course_code || 'AI501',
        course_name: selectedCourse?.course_name || 'Natural Language Processing',
        feedback_text: feedbackText.trim(),
        is_anonymous: isAnonymous,
        class_section: user.class_section || 'Class 3A',
        semester: user.semester || 5,
        topic: selectedTag,
        rating: selectedTag === 'Clear & Engaging' ? 5 : selectedTag === 'Good Pace & Content' ? 4 : 3,
      };

      const res = await fetch(`${API}/feedback/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Could not submit feedback');

      setFeedbackText('');
      addToast?.({
        title: 'Feedback Shared',
        message: 'Thank you! Your feedback has been recorded.',
        type: 'success',
      });
      loadStudentData();
    } catch (err) {
      addToast?.({ title: 'Submission Error', message: err.message, type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  // Pre-fill feedback from timetable review click
  const handleReviewClass = (lecture) => {
    const matched = allottedSubjects.find((s) => s.course_code === lecture.course_code);
    if (matched) setSelectedCourse(matched);
    setFeedbackText(`Regarding lecture on ${lecture.topic || lecture.course_name}: `);
    setActiveTab('submit');
    addToast?.({
      title: 'Reviewing Lecture',
      message: `Selected ${lecture.course_code} · ${lecture.day_of_week}`,
      type: 'info',
    });
  };

  // Submit Grievance
  const handleSubmitComplaint = async (e) => {
    e.preventDefault();
    if (!complaintForm.title.trim() || !complaintForm.description.trim()) return;
    setComplaintSubmitting(true);

    try {
      const payload = {
        student_id: user.student_id || 1,
        title: complaintForm.title.trim(),
        category: complaintForm.category,
        description: complaintForm.description.trim(),
        class_section: user.class_section || 'Class 3A',
        semester: user.semester || 5,
      };

      const res = await fetch(`${API}/feedback/complaints`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Could not submit inquiry');

      setComplaintForm({ title: '', category: 'Academics & Teaching', description: '' });
      addToast?.({
        title: 'Inquiry Submitted',
        message: 'Your message has been safely logged with academic oversight.',
        type: 'success',
      });
      loadStudentData();
    } catch (e) {
      addToast?.({ title: 'Error', message: e.message, type: 'error' });
    } finally {
      setComplaintSubmitting(false);
    }
  };

  return (
    <div className="dashboard-layout">
      {/* Sidebar */}
      <aside className={`dashboard-sidebar ${mobileMenuOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <span className="brand-mark"><MessageSquare size={18} /></span>
            <div>
              <span className="sidebar-brand-name">Sentio</span>
              <span className="sidebar-badge" style={{ marginLeft: '0.4rem' }}>Student</span>
            </div>
          </div>
          <button type="button" className="close-sidebar-btn" onClick={() => setMobileMenuOpen(false)}>
            <X size={18} />
          </button>
        </div>

        <nav className="nav-menu">
          <span className="nav-section-title">Menu</span>
          <button
            type="button"
            className={`nav-item ${activeTab === 'submit' ? 'active' : ''}`}
            onClick={() => { setActiveTab('submit'); setMobileMenuOpen(false); }}
          >
            <MessageSquarePlus size={18} /> Share Feedback
          </button>
          <button
            type="button"
            className={`nav-item ${activeTab === 'courses' ? 'active' : ''}`}
            onClick={() => { setActiveTab('courses'); setMobileMenuOpen(false); }}
          >
            <CalendarDays size={18} /> Schedule & Courses
          </button>
          <button
            type="button"
            className={`nav-item ${activeTab === 'wellbeing' ? 'active' : ''}`}
            onClick={() => { setActiveTab('wellbeing'); setMobileMenuOpen(false); }}
          >
            <HeartPulse size={18} /> Student Wellbeing
          </button>
          <button
            type="button"
            className={`nav-item ${activeTab === 'community' ? 'active' : ''}`}
            onClick={() => { setActiveTab('community'); setMobileMenuOpen(false); }}
          >
            <Users size={18} /> Campus Discussions
          </button>
          <button
            type="button"
            className={`nav-item ${activeTab === 'grievance' ? 'active' : ''}`}
            onClick={() => { setActiveTab('grievance'); setMobileMenuOpen(false); }}
          >
            <ShieldAlert size={18} /> Grievance Box
          </button>
        </nav>

        <div className="sidebar-user-footer">
          <span className="user-avatar-chip">{user.name.charAt(0)}</span>
          <div className="user-details">
            <strong>{user.name}</strong>
            <span>{user.roll_no ? `${user.roll_no} · ` : ''}Sem {user.semester || 5}</span>
          </div>
        </div>
      </aside>

      {/* Main Area */}
      <main className="dashboard-main">
        {/* Top Header */}
        <header className="top-header">
          <div className="header-left">
            <button type="button" className="menu-toggle-btn" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              <Menu size={20} />
            </button>
            <div className="header-title-wrap">
              <h1>
                {activeTab === 'submit' && 'Share Classroom Feedback'}
                {activeTab === 'courses' && 'Lecture Schedule & Subjects'}
                {activeTab === 'wellbeing' && 'Student Wellbeing & Pace'}
                {activeTab === 'community' && 'Campus Discussions & Study Groups'}
                {activeTab === 'grievance' && 'Confidential Grievance Box'}
              </h1>
            </div>
          </div>

          <div className="header-right">
            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
              {user.class_section || 'Class 3A'}
            </span>
            {onSwitchRole && (
              <select
                className="section-select-dropdown"
                value={user.role}
                onChange={(e) => onSwitchRole(e.target.value)}
                title="Switch Portal Role"
              >
                <option value="STUDENT">🎓 Student View</option>
                <option value="FACULTY">👨‍🏫 Faculty View</option>
                <option value="ADMIN">🏛️ Admin View</option>
              </select>
            )}
            <button
              type="button"
              className="btn-header-action"
              onClick={() => setProfileModalOpen(true)}
            >
              <Settings size={14} /> Profile
            </button>
            <button type="button" className="btn-logout" onClick={onLogout} title="Sign Out">
              <LogOut size={16} />
            </button>
          </div>
        </header>

        {/* 1. TAB: SUBMIT FEEDBACK */}
        {activeTab === 'submit' && (
          <div className="tab-pane">
            <div className="grid-2col">
              {/* Submission Form Card */}
              <div className="card">
                <div style={{ marginBottom: '1.25rem' }}>
                  <h3 style={{ margin: '0 0 0.25rem 0', fontSize: '1.15rem', color: '#0f172a' }}>
                    How was your lecture today?
                  </h3>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>
                    Your feedback helps professors adjust lecture pacing, give examples, or clarify difficult topics.
                  </p>
                </div>

                <form onSubmit={handleSubmitFeedback} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div className="form-group">
                    <label>Select Course *</label>
                    <select
                      value={selectedCourse?.course_code || ''}
                      onChange={(e) => {
                        const code = e.target.value;
                        const match = allottedSubjects.find((s) => s.course_code === code);
                        setSelectedCourse(match || null);
                      }}
                    >
                      {allottedSubjects.map((s) => (
                        <option key={s.course_id || s.course_code} value={s.course_code}>
                          {s.course_code} · {s.course_name} ({s.faculty_name || 'Faculty'})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Lecture Experience</label>
                    <div className="rating-chips-row">
                      {['Clear & Engaging', 'Good Pace & Content', 'Fast Paced', 'Need More Examples', 'Tricky Topic'].map((tag) => (
                        <button
                          key={tag}
                          type="button"
                          className={`rating-chip ${selectedTag === tag ? 'selected' : ''}`}
                          onClick={() => setSelectedTag(tag)}
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Your Thoughts & Notes *</label>
                    <textarea
                      required
                      rows="4"
                      placeholder="What was clear, or which concept could use another example? (e.g. Can we recap the intuition behind step 3 of the algorithm?)"
                      value={feedbackText}
                      onChange={(e) => setFeedbackText(e.target.value)}
                    />
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <button
                        type="button"
                        className="btn-header-action"
                        onClick={toggleSpeechRecognition}
                        title="Dictate via microphone"
                      >
                        {isRecording ? <MicOff size={14} style={{ color: '#e11d48' }} /> : <Mic size={14} />}
                        {isRecording ? 'Listening…' : 'Voice Input'}
                      </button>
                    </div>

                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: '#64748b', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={isAnonymous}
                        onChange={(e) => setIsAnonymous(e.target.checked)}
                      />
                      <span>Keep feedback anonymous</span>
                    </label>
                  </div>

                  <button type="submit" className="btn-submit-primary" disabled={submitting}>
                    {submitting ? 'Sending…' : 'Send Feedback to Faculty'}
                  </button>
                </form>
              </div>

              {/* Recent Submissions List */}
              <div className="card">
                <div style={{ marginBottom: '1rem' }}>
                  <h3 style={{ margin: '0 0 0.25rem 0', fontSize: '1.15rem', color: '#0f172a' }}>
                    Recent Submissions
                  </h3>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>
                    Track responses and clarifications provided by your instructors.
                  </p>
                </div>

                {feedbacks.length === 0 ? (
                  <div className="empty-state">
                    <p>No feedback submitted yet. Share your thoughts using the form!</p>
                  </div>
                ) : (
                  <div className="feedback-list" style={{ maxHeight: '480px', overflowY: 'auto' }}>
                    {feedbacks.slice(0, 10).map((fb) => (
                      <div key={fb.feedback_id} className="card feedback-card">
                        <div className="feedback-card-top">
                          <span className="course-tag">{fb.course_code}</span>
                          <span className="feedback-meta">
                            <Clock size={12} /> {new Date(fb.created_at).toLocaleDateString()}
                          </span>
                        </div>

                        <p className="feedback-comment">{fb.feedback_text}</p>

                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto' }}>
                          <span
                            className={`sentiment-badge ${
                              fb.sentiment === 'POSITIVE' ? 'positive' : fb.sentiment === 'NEGATIVE' ? 'needs-clarity' : 'neutral'
                            }`}
                          >
                            {fb.sentiment === 'POSITIVE' ? 'Clear & Engaging' : fb.sentiment === 'NEGATIVE' ? 'Needs Clarification' : 'General Note'}
                          </span>

                          {fb.action_taken && (
                            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#059669', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                              <CheckCircle2 size={13} /> Instructor Responded
                            </span>
                          )}
                        </div>

                        {fb.action_taken && (
                          <div className="faculty-response-box">
                            <span className="response-header">
                              <MessageSquare size={12} /> Instructor Response:
                            </span>
                            <p className="response-text">{fb.action_taken}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 2. TAB: SCHEDULE & COURSES */}
        {activeTab === 'courses' && (
          <div className="tab-pane">
            {/* Semester Switcher Strip */}
            <div className="semester-filter-strip">
              <span className="strip-label">Semester:</span>
              {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                <button
                  key={s}
                  type="button"
                  className={`sem-pill-btn ${studentSelectedSem === s ? 'active' : ''}`}
                  onClick={() => setStudentSelectedSem(s)}
                >
                  Sem {s}
                  {(user.semester || 5) === s && <span className="dot-indicator" title="Current Enrolled Semester" />}
                </button>
              ))}
            </div>

            {/* Subtabs Bar */}
            <div className="subtabs-bar">
              <button
                type="button"
                className={`subtab-btn ${coursesViewTab === 'timetable' ? 'active' : ''}`}
                onClick={() => setCoursesViewTab('timetable')}
              >
                <Clock size={15} /> Weekly Timetable ({studentLectures.length})
              </button>
              <button
                type="button"
                className={`subtab-btn ${coursesViewTab === 'catalog' ? 'active' : ''}`}
                onClick={() => setCoursesViewTab('catalog')}
              >
                <BookOpen size={15} /> Enrolled Subjects ({allottedSubjects.length})
              </button>
              <button
                type="button"
                className={`subtab-btn ${coursesViewTab === 'mentors' ? 'active' : ''}`}
                onClick={() => setCoursesViewTab('mentors')}
              >
                <UserCheck size={15} /> Faculty Mentors
              </button>
            </div>

            {/* Sub-view: Timetable */}
            {coursesViewTab === 'timetable' && (
              <div>
                <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
                  {['ALL', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map((d) => (
                    <button
                      key={d}
                      type="button"
                      className={`rating-chip ${studentDayFilter === d ? 'selected' : ''}`}
                      onClick={() => setStudentDayFilter(d)}
                    >
                      {d === 'ALL' ? 'All Week' : d}
                    </button>
                  ))}
                </div>

                <div className="grid-3col">
                  {studentLectures
                    .filter((l) => studentDayFilter === 'ALL' || l.day_of_week === studentDayFilter)
                    .map((lec) => (
                      <div key={lec.lecture_id} className="card lecture-card">
                        <div className="lecture-card-header">
                          <span className="day-tag">{lec.day_of_week}</span>
                          <span className="time-loc-row">
                            <Clock size={12} /> {lec.start_time} - {lec.end_time}
                          </span>
                        </div>

                        <div className="lecture-title-wrap">
                          <h4>{lec.course_name} ({lec.course_code})</h4>
                          <span style={{ fontSize: '0.78rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <MapPin size={12} /> {lec.room_number || 'Hall 301'} · {lec.lecture_type || 'Theory'}
                          </span>
                        </div>

                        {lec.topic && (
                          <p className="lecture-topic-preview">
                            <strong>Topic:</strong> {lec.topic}
                          </p>
                        )}

                        <div className="lecture-card-footer">
                          <span className="instructor-name">
                            <GraduationCap size={13} /> {lec.faculty_name}
                          </span>
                          <button
                            type="button"
                            className="btn-review-lecture"
                            onClick={() => handleReviewClass(lec)}
                          >
                            <MessageSquarePlus size={12} /> Review Class
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Sub-view: Catalog */}
            {coursesViewTab === 'catalog' && (
              <div className="table-wrap">
                <table className="simple-table">
                  <thead>
                    <tr>
                      <th>Code</th>
                      <th>Subject Title</th>
                      <th>Instructor</th>
                      <th>Section</th>
                      <th>Department</th>
                      <th>Credits</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allottedSubjects.map((s) => (
                      <tr key={s.offering_id || s.course_id}>
                        <td><strong>{s.course_code}</strong></td>
                        <td>{s.course_name}</td>
                        <td>{s.faculty_name || 'Dr. A. Sharma'}</td>
                        <td>{s.class_section || user.class_section}</td>
                        <td>{s.department_name || 'AI & Data Science'}</td>
                        <td><span className="sentiment-badge neutral">{s.credits || 4} Credits</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Sub-view: Mentors */}
            {coursesViewTab === 'mentors' && (
              <div className="grid-2col">
                <div className="card">
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Academic Mentor</span>
                  <h3 style={{ margin: '0.4rem 0 0.25rem 0', color: '#0f172a' }}>{mentors?.academic_mentor?.name || 'Dr. Ramesh Ponnala'}</h3>
                  <p style={{ color: '#64748b', fontSize: '0.85rem', margin: '0 0 0.75rem 0' }}>{mentors?.academic_mentor?.department || 'Department of Computer Science'}</p>
                  <span className="sentiment-badge neutral"><MapPin size={12} /> {mentors?.academic_mentor?.cabin_no || 'Cabin B-304'}</span>
                </div>
                <div className="card">
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Special Project Mentor</span>
                  <h3 style={{ margin: '0.4rem 0 0.25rem 0', color: '#0f172a' }}>{mentors?.project_mentor?.name || 'Dr. Sandeep Kumar Panda'}</h3>
                  <p style={{ color: '#64748b', fontSize: '0.85rem', margin: '0 0 0.75rem 0' }}>{mentors?.project_mentor?.department || 'School of Artificial Intelligence'}</p>
                  <span className="sentiment-badge neutral"><MapPin size={12} /> {mentors?.project_mentor?.cabin_no || 'Cabin R-412'}</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 3. TAB: STUDENT WELLBEING */}
        {activeTab === 'wellbeing' && (
          <div className="tab-pane">
            <div className="grid-2col">
              <div className="card">
                <h3 style={{ margin: '0 0 0.5rem 0', color: '#0f172a' }}>Weekly Mindful Check-in</h3>
                <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0 0 1rem 0' }}>
                  A healthy semester starts with self-awareness. How are your energy levels and coursework pace feeling this week?
                </p>

                <div className="rating-chips-row" style={{ marginBottom: '1.25rem' }}>
                  {['😊 Great / Confident', '📚 Good / Productive', '😐 Managing Okay', '😓 Feeling Busy', '🆘 Overwhelmed'].map((m) => (
                    <button
                      key={m}
                      type="button"
                      className="rating-chip"
                      onClick={() => addToast?.({ title: 'Mood Noted', message: `Checked in as "${m}". Take care of yourself!`, type: 'success' })}
                    >
                      {m}
                    </button>
                  ))}
                </div>

                <div className="form-group">
                  <label>Personal Reflection Note</label>
                  <textarea
                    rows="3"
                    placeholder="Write a private note on what went well this week and what you want to improve..."
                    value={journalNote}
                    onChange={(e) => setJournalNote(e.target.value)}
                  />
                  <button
                    type="button"
                    className="btn-header-action primary"
                    style={{ alignSelf: 'flex-start', marginTop: '0.5rem' }}
                    onClick={() => {
                      if (!journalNote.trim()) return;
                      setSavedJournal([journalNote.trim(), ...savedJournal]);
                      setJournalNote('');
                      addToast?.({ title: 'Note Saved', message: 'Reflection recorded for your reference.', type: 'info' });
                    }}
                  >
                    Save Reflection
                  </button>
                </div>
              </div>

              <div className="card">
                <h3 style={{ margin: '0 0 0.5rem 0', color: '#0f172a' }}>2-Minute Reset</h3>
                <MindfulBreathingWidget />
              </div>
            </div>
          </div>
        )}

        {/* 4. TAB: CAMPUS DISCUSSIONS */}
        {activeTab === 'community' && (
          <div className="tab-pane">
            <div className="grid-2col">
              {/* Study Pods */}
              <div className="card">
                <h3 style={{ margin: '0 0 0.5rem 0', color: '#0f172a' }}>Peer Study Groups</h3>
                <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0 0 1rem 0' }}>
                  Collaborate with classmates on challenging modules and revision questions.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {studyPods.map((pod) => (
                    <div key={pod.pod_id} style={{ background: '#f8fafc', padding: '0.85rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                        <strong>{pod.course_code} · {pod.topic}</strong>
                        <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{pod.current_members} Members</span>
                      </div>
                      <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '0 0 0.5rem 0' }}>Section: {pod.class_section}</p>
                      <button
                        type="button"
                        className="btn-review-lecture"
                        onClick={() => addToast?.({ title: 'Joined Pod', message: `Connected to ${pod.topic} study group.`, type: 'success' })}
                      >
                        Join Group
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Discussion Feed */}
              <div className="card">
                <h3 style={{ margin: '0 0 0.5rem 0', color: '#0f172a' }}>Classroom Questions</h3>
                <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0 0 1rem 0' }}>
                  Upvote topics your classmates raised so professors know what to review.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {communityPosts.slice(0, 5).map((p) => (
                    <div key={p.post_id} style={{ padding: '0.85rem', borderBottom: '1px solid #f1f5f9' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontWeight: 600, fontSize: '0.9rem', color: '#0f172a' }}>{p.title}</span>
                        <button
                          type="button"
                          className="btn-header-action"
                          style={{ padding: '0.2rem 0.5rem' }}
                          onClick={() => addToast?.({ title: 'Upvoted', message: 'Upvoted question.', type: 'info' })}
                        >
                          <ThumbsUp size={12} /> {p.upvotes || 0}
                        </button>
                      </div>
                      <p style={{ fontSize: '0.825rem', color: '#475569', margin: '0.35rem 0 0 0' }}>{p.content}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 5. TAB: GRIEVANCE BOX */}
        {activeTab === 'grievance' && (
          <div className="tab-pane">
            <div className="grid-2col">
              <div className="card">
                <h3 style={{ margin: '0 0 0.5rem 0', color: '#0f172a' }}>Submit a Confidential Inquiry</h3>
                <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0 0 1rem 0' }}>
                  Safely bring academic, facility, or grading concerns to faculty leadership.
                </p>

                <form onSubmit={handleSubmitComplaint} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div className="form-group">
                    <label>Inquiry Subject *</label>
                    <input
                      required
                      placeholder="e.g. Question on mid-term grading schedule"
                      value={complaintForm.title}
                      onChange={(e) => setComplaintForm({ ...complaintForm, title: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Category</label>
                    <select
                      value={complaintForm.category}
                      onChange={(e) => setComplaintForm({ ...complaintForm, category: e.target.value })}
                    >
                      <option value="Academics & Teaching">Academics & Teaching</option>
                      <option value="Exams & Grading">Exams & Grading</option>
                      <option value="Lab & Facilities">Lab & Facilities</option>
                      <option value="General Campus">General Campus</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Description *</label>
                    <textarea
                      required
                      rows="4"
                      placeholder="Provide specific context so the department can address this effectively..."
                      value={complaintForm.description}
                      onChange={(e) => setComplaintForm({ ...complaintForm, description: e.target.value })}
                    />
                  </div>
                  <button type="submit" className="btn-submit-primary" disabled={complaintSubmitting}>
                    {complaintSubmitting ? 'Submitting…' : 'Submit Confidential Inquiry'}
                  </button>
                </form>
              </div>

              <div className="card">
                <h3 style={{ margin: '0 0 0.5rem 0', color: '#0f172a' }}>My Inquiries</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1rem' }}>
                  {complaints.length === 0 ? (
                    <div className="empty-state">
                      <p>No active inquiries submitted.</p>
                    </div>
                  ) : (
                    complaints.map((c) => (
                      <div key={c.complaint_id} style={{ background: '#f8fafc', padding: '0.85rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                          <strong>{c.title}</strong>
                          <span className={`sentiment-badge ${c.status === 'RESOLVED' ? 'positive' : 'needs-clarity'}`}>
                            {c.status || 'PENDING'}
                          </span>
                        </div>
                        <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '0 0 0.5rem 0' }}>{c.description}</p>
                        {c.action_taken && (
                          <div className="faculty-response-box">
                            <span className="response-header">Resolution Action:</span>
                            <p className="response-text">{c.action_taken}</p>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Profile Settings Modal */}
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
// FACULTY & ADMIN DASHBOARD
// ═══════════════════════════════════════════════════════
function AdminDashboard({ user, token, onLogout, onSwitchRole, addToast, onUserUpdated }) {
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [accreditationModalOpen, setAccreditationModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'feedback' | 'curriculum' | 'modules' | 'grievances' | 'settings'
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedSection, setSelectedSection] = useState('ALL');

  // Data States
  const [feedbacks, setFeedbacks] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [adminCourses, setAdminCourses] = useState([]);
  const [adminLectures, setAdminLectures] = useState([]);
  const [adminSemesters, setAdminSemesters] = useState([]);
  const [adminOfferings, setAdminOfferings] = useState([]);
  const [syllabusMapping, setSyllabusMapping] = useState(null);
  const [geminiConfig, setGeminiConfig] = useState({ has_gemini_key: false });
  const [geminiKeyInput, setGeminiKeyInput] = useState('');
  const [geminiSaving, setGeminiSaving] = useState(false);
  const [facultyPerfData, setFacultyPerfData] = useState({ faculty: [], total_faculty: 0, total_feedbacks: 0, avg_institution_rating: 92 });
  const [studentTrends, setStudentTrends] = useState(null);
  const [selectedFacultyDrilldown, setSelectedFacultyDrilldown] = useState(null);

  // Filters & Subtabs
  const [feedSearch, setFeedSearch] = useState('');
  const [feedCourseFilter, setFeedCourseFilter] = useState('ALL');
  const [curriculumSubTab, setCurriculumSubTab] = useState('courses');
  const [curriculumSemFilter, setCurriculumSemFilter] = useState('ALL');

  // Action Response Input per feedback item
  const [responseText, setResponseText] = useState({});

  // Curriculum Modals State
  const [courseModal, setCourseModal] = useState({ open: false, isEdit: false, courseId: null, form: { course_code: '', course_name: '', credits: 4, semester: 5, department_name: 'AI & Data Science', program: 'B.Tech', course_type: 'Core', syllabus_summary: '' } });
  const [lectureModal, setLectureModal] = useState({ open: false, isEdit: false, lectureId: null, form: { course_code: 'AI501', course_name: 'Natural Language Processing', faculty_name: user.name || 'Dr. A. Sharma', class_section: 'Class 3A', semester: 5, day_of_week: 'Monday', start_time: '09:30 AM', end_time: '10:30 AM', room_number: 'Hall 301', topic: '', lecture_type: 'Theory', status: 'SCHEDULED' } });
  const [semesterModal, setSemesterModal] = useState({ open: false, form: { semester_number: 6, term_name: 'Spring 2027', academic_year: '2026-2027', is_active: false } });
  const [offeringModal, setOfferingModal] = useState({ open: false, form: { course_code: 'AI501', faculty_name: user.name || 'Dr. A. Sharma', class_section: 'Class 3A', semester: 5, term_name: 'Fall 2026' } });

  // Load Admin Data
  const loadAdminData = useCallback(async () => {
    try {
      const secParam = encodeURIComponent(selectedSection);
      const facNameParam = encodeURIComponent(user.role === 'FACULTY' ? (user.name || 'Dr. A. Sharma') : 'ALL');
      const [feedRes, compRes, crsRes, lecRes, semRes, offRes, sylRes, gemRes, facPerfRes, trendRes] = await Promise.all([
        fetch(`${API}/feedback/?class_section=${secParam}`).then((r) => r.json()).catch(() => ({ feedback: [] })),
        fetch(`${API}/feedback/complaints?section=${secParam}`).then((r) => r.json()).catch(() => ({ complaints: [] })),
        fetch(`${API}/feedback/courses`).then((r) => r.json()).catch(() => ({ courses: [] })),
        fetch(`${API}/feedback/lectures`).then((r) => r.json()).catch(() => ({ lectures: [] })),
        fetch(`${API}/feedback/semesters`).then((r) => r.json()).catch(() => ({ semesters: [] })),
        fetch(`${API}/feedback/offerings`).then((r) => r.json()).catch(() => ({ offerings: [] })),
        fetch(`${API}/feedback/syllabus-mapping`).then((r) => r.json()).catch(() => null),
        fetch(`${API}/api/auth/gemini-config`).then((r) => r.json()).catch(() => ({ has_gemini_key: false })),
        fetch(`${API}/feedback/faculty-performance`).then((r) => r.json()).catch(() => ({ faculty: [] })),
        fetch(`${API}/feedback/student-trends?faculty_name=${facNameParam}&class_section=${secParam}`).then((r) => r.json()).catch(() => null),
      ]);

      if (feedRes?.feedback) setFeedbacks(feedRes.feedback);
      if (compRes?.complaints) setComplaints(compRes.complaints);
      if (crsRes?.courses) setAdminCourses(crsRes.courses);
      if (lecRes?.lectures) setAdminLectures(lecRes.lectures);
      if (semRes?.semesters) setAdminSemesters(semRes.semesters);
      if (offRes?.offerings) setAdminOfferings(offRes.offerings);
      if (sylRes) setSyllabusMapping(sylRes);
      if (gemRes) setGeminiConfig(gemRes);
      if (facPerfRes) setFacultyPerfData(facPerfRes);
      if (trendRes) setStudentTrends(trendRes);
    } catch (e) {
      console.error('Error loading admin data:', e);
    }
  }, [selectedSection]);

  useEffect(() => {
    loadAdminData();
  }, [loadAdminData]);

  // Handle Action Response to Feedback
  const handleRecordAction = async (feedbackId) => {
    const text = responseText[feedbackId]?.trim();
    if (!text) return;

    try {
      const res = await fetch(`${API}/feedback/${feedbackId}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action_taken: text,
          responder_name: user.name,
          responder_role: user.role || 'Faculty',
        }),
      });
      if (!res.ok) throw new Error('Failed to record response');

      setResponseText({ ...responseText, [feedbackId]: '' });
      addToast?.({ title: 'Response Recorded', message: 'Clarification action saved for students.', type: 'success' });
      loadAdminData();
    } catch (e) {
      addToast?.({ title: 'Error', message: e.message, type: 'error' });
    }
  };

  // Resolve Complaint
  const handleResolveComplaint = async (complaintId, actionText) => {
    try {
      const res = await fetch(`${API}/feedback/complaints/${complaintId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'RESOLVED', action_taken: actionText || 'Issue addressed.' }),
      });
      if (!res.ok) throw new Error('Failed to update status');

      addToast?.({ title: 'Grievance Resolved', message: 'Status updated to Resolved.', type: 'success' });
      loadAdminData();
    } catch (e) {
      addToast?.({ title: 'Error', message: e.message, type: 'error' });
    }
  };

  // Save Gemini Key
  const handleSaveGeminiKey = async (e) => {
    e.preventDefault();
    if (!geminiKeyInput.trim()) return;
    setGeminiSaving(true);
    try {
      const res = await fetch(`${API}/api/auth/gemini-config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gemini_api_key: geminiKeyInput.trim() }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.detail || 'Could not verify API key');

      addToast?.({ title: 'Key Saved', message: 'API key verified and connected.', type: 'success' });
      setGeminiKeyInput('');
      loadAdminData();
    } catch (e) {
      addToast?.({ title: 'Key Error', message: e.message, type: 'error' });
    } finally {
      setGeminiSaving(false);
    }
  };

  // CRUD Handlers for Curriculum
  const handleSaveCourse = async (e) => {
    e.preventDefault();
    try {
      const url = courseModal.isEdit ? `${API}/feedback/courses/${courseModal.courseId}` : `${API}/feedback/courses`;
      const method = courseModal.isEdit ? 'PUT' : 'POST';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(courseModal.form) });
      if (!res.ok) throw new Error('Failed to save subject');
      setCourseModal({ ...courseModal, open: false });
      addToast?.({ title: 'Subject Saved', message: 'Course catalog updated.', type: 'success' });
      loadAdminData();
    } catch (e) {
      addToast?.({ title: 'Error', message: e.message, type: 'error' });
    }
  };

  const handleDeleteCourse = async (id, code) => {
    if (!window.confirm(`Delete course ${code}?`)) return;
    try {
      await fetch(`${API}/feedback/courses/${id}`, { method: 'DELETE' });
      addToast?.({ title: 'Course Deleted', message: `${code} removed.`, type: 'info' });
      loadAdminData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveLecture = async (e) => {
    e.preventDefault();
    try {
      const url = lectureModal.isEdit ? `${API}/feedback/lectures/${lectureModal.lectureId}` : `${API}/feedback/lectures`;
      const method = lectureModal.isEdit ? 'PATCH' : 'POST';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(lectureModal.form) });
      if (!res.ok) throw new Error('Failed to save lecture');
      setLectureModal({ ...lectureModal, open: false });
      addToast?.({ title: 'Lecture Saved', message: 'Timetable updated.', type: 'success' });
      loadAdminData();
    } catch (e) {
      addToast?.({ title: 'Error', message: e.message, type: 'error' });
    }
  };

  const handleDeleteLecture = async (id) => {
    try {
      await fetch(`${API}/feedback/lectures/${id}`, { method: 'DELETE' });
      addToast?.({ title: 'Lecture Removed', message: 'Removed from schedule.', type: 'info' });
      loadAdminData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveSemester = async (e) => {
    e.preventDefault();
    try {
      await fetch(`${API}/feedback/semesters`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(semesterModal.form) });
      setSemesterModal({ ...semesterModal, open: false });
      addToast?.({ title: 'Semester Created', message: 'Academic semester added.', type: 'success' });
      loadAdminData();
    } catch (e) {
      addToast?.({ title: 'Error', message: e.message, type: 'error' });
    }
  };

  const handleToggleSemesterActive = async (num, current) => {
    try {
      await fetch(`${API}/feedback/semesters/${num}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ is_active: !current }) });
      addToast?.({ title: 'Term Status Updated', message: `Semester ${num} active status changed.`, type: 'success' });
      loadAdminData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveOffering = async (e) => {
    e.preventDefault();
    try {
      await fetch(`${API}/feedback/offerings`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(offeringModal.form) });
      setOfferingModal({ ...offeringModal, open: false });
      addToast?.({ title: 'Allocation Saved', message: 'Faculty section allotment updated.', type: 'success' });
      loadAdminData();
    } catch (e) {
      addToast?.({ title: 'Error', message: e.message, type: 'error' });
    }
  };

  const handleDeleteOffering = async (id) => {
    try {
      await fetch(`${API}/feedback/offerings/${id}`, { method: 'DELETE' });
      addToast?.({ title: 'Allocation Removed', message: 'Section allotment removed.', type: 'info' });
      loadAdminData();
    } catch (e) {
      console.error(e);
    }
  };

  // Metrics
  const totalFeedback = feedbacks.length;
  const positiveFeedback = feedbacks.filter((f) => f.sentiment === 'POSITIVE').length;
  const positiveRate = totalFeedback > 0 ? Math.round((positiveFeedback / totalFeedback) * 100) : 84;
  const pendingGrievances = complaints.filter((c) => c.status !== 'RESOLVED').length;

  const isFaculty = user.role === 'FACULTY';
  const isAdmin = user.role === 'ADMIN';

  const myFacultyRecord = facultyPerfData.faculty?.find(
    (f) => f.name?.toLowerCase() === user.name?.toLowerCase() || (user.name?.toLowerCase().includes('sharma') && f.name?.toLowerCase().includes('sharma'))
  ) || {
    name: user.name || 'Dr. A. Sharma',
    department: user.department || 'AI & Data Science',
    satisfaction_pct: 95,
    rating: 4.8,
    feedback_count: feedbacks.length,
    aspects: { concept_clarity: 96, pacing_speed: 90, learning_materials: 98, doubt_resolution: 94 },
    subjects: adminCourses.slice(0, 4).map((c) => ({
      course_code: c.course_code,
      course_name: c.course_name,
      sections: ['Class 3A', 'Class 3B'],
      feedback_count: feedbacks.filter((f) => f.course_code === c.course_code).length,
      satisfaction_pct: 96,
      clarity_status: 'High Clarity',
    })),
  };

  return (
    <div className="dashboard-layout">
      {/* Sidebar */}
      <aside className={`dashboard-sidebar ${mobileMenuOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <span className="brand-mark"><MessageSquare size={18} /></span>
            <div>
              <span className="sidebar-brand-name">Sentio</span>
              <span className="sidebar-badge" style={{ marginLeft: '0.4rem' }}>
                {isAdmin ? 'Admin' : 'Faculty'}
              </span>
            </div>
          </div>
          <button type="button" className="close-sidebar-btn" onClick={() => setMobileMenuOpen(false)}>
            <X size={18} />
          </button>
        </div>

        <nav className="nav-menu">
          <span className="nav-section-title">Oversight</span>
          <button
            type="button"
            className={`nav-item ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => { setActiveTab('overview'); setMobileMenuOpen(false); }}
          >
            <Activity size={18} /> Overview
          </button>
          {isAdmin && (
            <button
              type="button"
              className={`nav-item ${activeTab === 'faculty-performance' ? 'active' : ''}`}
              onClick={() => { setActiveTab('faculty-performance'); setMobileMenuOpen(false); }}
            >
              <Award size={18} /> Faculty Performance
            </button>
          )}
          <button
            type="button"
            className={`nav-item ${activeTab === 'feedback' ? 'active' : ''}`}
            onClick={() => { setActiveTab('feedback'); setMobileMenuOpen(false); }}
          >
            <MessageSquare size={18} /> Student Feedback
            {totalFeedback > 0 && <span className="tab-pill">{totalFeedback}</span>}
          </button>
          <button
            type="button"
            className={`nav-item ${activeTab === 'curriculum' ? 'active' : ''}`}
            onClick={() => { setActiveTab('curriculum'); setMobileMenuOpen(false); }}
          >
            <CalendarDays size={18} /> Curriculum & Schedule
          </button>
          <button
            type="button"
            className={`nav-item ${activeTab === 'modules' ? 'active' : ''}`}
            onClick={() => { setActiveTab('modules'); setMobileMenuOpen(false); }}
          >
            <BookOpen size={18} /> Course Modules & Clarity
          </button>
          <button
            type="button"
            className={`nav-item ${activeTab === 'grievances' ? 'active' : ''}`}
            onClick={() => { setActiveTab('grievances'); setMobileMenuOpen(false); }}
          >
            <ShieldAlert size={18} /> Grievance Desk
            {pendingGrievances > 0 && <span className="tab-pill alert">{pendingGrievances}</span>}
          </button>
          <button
            type="button"
            className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => { setActiveTab('settings'); setMobileMenuOpen(false); }}
          >
            <Settings size={18} /> Settings & Tools
          </button>
        </nav>

        <div className="sidebar-user-footer">
          <span className="user-avatar-chip admin">{user.name.charAt(0)}</span>
          <div className="user-details">
            <strong>{user.name}</strong>
            <span>{user.role || 'Faculty'} · {user.department || 'AI & DS'}</span>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="dashboard-main">
        {/* Header */}
        <header className="top-header">
          <div className="header-left">
            <button type="button" className="menu-toggle-btn" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              <Menu size={20} />
            </button>
            <div className="header-title-wrap">
              <h1>
                {activeTab === 'overview' && (isFaculty ? 'Faculty Classroom Insights & Student Trends' : 'Institutional Academic Overview & Student Trends')}
                {activeTab === 'faculty-performance' && 'Faculty Performance & Subject Teaching Analytics'}
                {activeTab === 'feedback' && 'Student Feedback Oversight'}
                {activeTab === 'curriculum' && 'Curriculum, Subjects & Timetable'}
                {activeTab === 'modules' && 'Course Modules & Topic Clarity'}
                {activeTab === 'grievances' && 'Student Grievance Desk'}
                {activeTab === 'settings' && 'Platform Settings & Tools'}
              </h1>
            </div>
          </div>

          <div className="header-right">
            {onSwitchRole && (
              <select
                className="section-select-dropdown"
                value={user.role}
                onChange={(e) => onSwitchRole(e.target.value)}
                title="Switch Portal Role"
              >
                <option value="STUDENT">🎓 Student View</option>
                <option value="FACULTY">👨‍🏫 Faculty View</option>
                <option value="ADMIN">🏛️ Admin View</option>
              </select>
            )}
            <select
              className="section-select-dropdown"
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
            >
              <option value="ALL">All Sections</option>
              <option value="Class 3A">Class 3A</option>
              <option value="Class 3B">Class 3B</option>
              <option value="Class 2A">Class 2A</option>
              <option value="Class 1A">Class 1A</option>
            </select>

            <button
              type="button"
              className="btn-header-action"
              onClick={() => setAccreditationModalOpen(true)}
            >
              <Award size={14} /> Summary Report
            </button>

            <button
              type="button"
              className="btn-header-action"
              onClick={() => setProfileModalOpen(true)}
            >
              <Settings size={14} /> Profile
            </button>

            <button type="button" className="btn-logout" onClick={onLogout} title="Sign Out">
              <LogOut size={16} />
            </button>
          </div>
        </header>

        {/* 1. TAB: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="tab-pane">
            {isFaculty ? (
              <>
                {/* Faculty KPI Metrics */}
                <div className="metrics-row">
                  <div className="card metric-card">
                    <span className="metric-label">My Student Feedbacks</span>
                    <div className="metric-number">
                      <AnimatedCounter value={myFacultyRecord.feedback_count || totalFeedback} />
                    </div>
                    <span className="metric-caption">Responses for your lectures</span>
                  </div>

                  <div className="card metric-card">
                    <span className="metric-label">Concept Clarity Index</span>
                    <div className="metric-number emerald">
                      <AnimatedCounter value={myFacultyRecord.satisfaction_pct || positiveRate} suffix="%" />
                    </div>
                    <span className="metric-caption">Rated clear & engaging</span>
                  </div>

                  <div className="card metric-card">
                    <span className="metric-label">Assigned Subjects</span>
                    <div className="metric-number">
                      <AnimatedCounter value={myFacultyRecord.subjects?.length || 4} />
                    </div>
                    <span className="metric-caption">Active curriculum courses</span>
                  </div>

                  <div className="card metric-card">
                    <span className="metric-label">Pacing & Speed Quality</span>
                    <div className="metric-number">
                      <AnimatedCounter value={myFacultyRecord.aspects?.pacing_speed || 90} suffix="%" />
                    </div>
                    <span className="metric-caption">Optimal lecture pacing</span>
                  </div>
                </div>

                {/* Faculty Visual Trends & Aspects */}
                <div className="grid-2col">
                  <div className="card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <h3 style={{ margin: 0, color: '#0f172a' }}>Student Clarity & Feedback Progression</h3>
                      <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#059669', background: '#ecfdf5', padding: '2px 8px', borderRadius: '9999px', border: '1px solid #a7f3d0' }}>
                        +8% Clarity this Term
                      </span>
                    </div>
                    <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0 0 1rem 0' }}>
                      Weekly clarity trajectory from student lecture submissions.
                    </p>
                    <StudentTrendVectorCurve timeline={studentTrends?.timeline} />
                  </div>

                  <div className="card">
                    <h3 style={{ margin: '0 0 0.5rem 0', color: '#0f172a' }}>Teaching Quality & Aspect Breakdown</h3>
                    <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0 0 1rem 0' }}>
                      Multimodal aspect evaluation across your classroom sessions.
                    </p>
                    <AspectRatingMeters aspects={studentTrends?.aspects || [
                      { aspect: 'Concept Clarity', score: myFacultyRecord.aspects?.concept_clarity || 96, status: 'Clear & Well-Explained' },
                      { aspect: 'Pacing & Speed', score: myFacultyRecord.aspects?.pacing_speed || 90, status: 'Optimal Pace' },
                      { aspect: 'Learning Materials', score: myFacultyRecord.aspects?.learning_materials || 98, status: 'Helpful Code & Slides' },
                      { aspect: 'Doubt Resolution', score: myFacultyRecord.aspects?.doubt_resolution || 94, status: 'Responsive' },
                    ]} />
                  </div>
                </div>

                {/* My Taught Subjects Performance */}
                <div className="card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <div>
                      <h3 style={{ margin: '0 0 0.25rem 0', color: '#0f172a' }}>My Assigned Subjects & Student Reception</h3>
                      <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>
                        Course-level clarity ratings, review counts, and engagement meters for subjects you teach.
                      </p>
                    </div>
                  </div>
                  <FacultySubjectBreakdownCards subjects={myFacultyRecord.subjects} />
                </div>
              </>
            ) : (
              <>
                {/* Admin Specific Overview */}
                <div className="metrics-row">
                  <div className="card metric-card">
                    <span className="metric-label">Institutional Feedbacks</span>
                    <div className="metric-number">
                      <AnimatedCounter value={totalFeedback} />
                    </div>
                    <span className="metric-caption">Campus submissions recorded</span>
                  </div>

                  <div className="card metric-card">
                    <span className="metric-label">Institutional Clarity Index</span>
                    <div className="metric-number emerald">
                      <AnimatedCounter value={Math.round(facultyPerfData.avg_institution_rating || 92)} suffix="%" />
                    </div>
                    <span className="metric-caption">Campus-wide positive benchmark</span>
                  </div>

                  <div className="card metric-card">
                    <span className="metric-label">Evaluated Faculty</span>
                    <div className="metric-number">
                      <AnimatedCounter value={facultyPerfData.total_faculty || 85} />
                    </div>
                    <span className="metric-caption">Instructors active in directory</span>
                  </div>

                  <div className="card metric-card">
                    <span className="metric-label">Open Grievances</span>
                    <div className={`metric-number ${pendingGrievances > 0 ? 'amber' : ''}`}>
                      <AnimatedCounter value={pendingGrievances} />
                    </div>
                    <span className="metric-caption">Awaiting resolution</span>
                  </div>
                </div>

                {/* Admin Visual Trends & Aspect Index */}
                <div className="grid-2col">
                  <div className="card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <h3 style={{ margin: 0, color: '#0f172a' }}>Campus-Wide Student Feedback Trend Curve</h3>
                      <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#059669', background: '#ecfdf5', padding: '2px 8px', borderRadius: '9999px', border: '1px solid #a7f3d0' }}>
                        Term Trajectory
                      </span>
                    </div>
                    <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0 0 1rem 0' }}>
                      Longitudinal progression of student concept clarity and engagement.
                    </p>
                    <StudentTrendVectorCurve timeline={studentTrends?.timeline} />
                  </div>

                  <div className="card">
                    <h3 style={{ margin: '0 0 0.5rem 0', color: '#0f172a' }}>Institution Teaching Quality Index</h3>
                    <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0 0 1rem 0' }}>
                      Cross-department ratings across fundamental instructional dimensions.
                    </p>
                    <AspectRatingMeters aspects={studentTrends?.aspects || [
                      { aspect: 'Concept Clarity', score: 94, status: 'Institutional Benchmark' },
                      { aspect: 'Pacing & Speed', score: 88, status: 'Optimal Pace' },
                      { aspect: 'Learning Materials', score: 96, status: 'High Quality Notes' },
                      { aspect: 'Doubt Resolution', score: 91, status: 'Prompt Engagement' },
                    ]} />
                  </div>
                </div>

                {/* Faculty Spotlight & Department Satisfaction */}
                <div className="grid-2col">
                  <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <h3 style={{ margin: 0, color: '#0f172a' }}>Faculty Performance & Teaching Spotlight</h3>
                        <span className="faculty-score-chip high">★ {facultyPerfData.avg_institution_rating || 92}% Avg</span>
                      </div>
                      <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0 0 1rem 0' }}>
                        Review student satisfaction ratings, clarity metrics, and subject performance for each faculty member.
                      </p>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
                        {(facultyPerfData.faculty || []).slice(0, 3).map((f) => (
                          <div
                            key={f.faculty_id || f.name}
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              padding: '0.5rem 0.75rem',
                              background: '#f8fafc',
                              borderRadius: '8px',
                              border: '1px solid #e2e8f0',
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <span className="user-avatar-chip admin" style={{ width: '28px', height: '28px', fontSize: '0.75rem' }}>
                                {f.name?.charAt(0)}
                              </span>
                              <div>
                                <strong style={{ fontSize: '0.82rem', color: '#0f172a' }}>{f.name}</strong>
                                <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                                  {f.subjects?.length || 1} subject(s) · {f.feedback_count || 0} reviews
                                </div>
                              </div>
                            </div>
                            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#059669' }}>
                              {f.satisfaction_pct || 92}%
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <button
                      type="button"
                      className="btn-header-action primary"
                      style={{ width: '100%', justifyContent: 'center' }}
                      onClick={() => setActiveTab('faculty-performance')}
                    >
                      Open Faculty Performance Workspace →
                    </button>
                  </div>

                  <div className="card">
                    <h3 style={{ margin: '0 0 0.5rem 0', color: '#0f172a' }}>Department Course Satisfaction</h3>
                    <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0 0 1.25rem 0' }}>
                      Student satisfaction distribution across registered department courses.
                    </p>
                    <SimpleCourseClarityBar courses={adminCourses} feedbacks={feedbacks} />
                  </div>
                </div>
              </>
            )}

            {/* Recent Feedback Feed */}
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <div>
                  <h3 style={{ margin: '0 0 0.25rem 0', color: '#0f172a' }}>Recent Feedback Submissions</h3>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>
                    Latest student notes and clarity signals from your courses.
                  </p>
                </div>
                <button
                  type="button"
                  className="btn-header-action primary"
                  onClick={() => setActiveTab('feedback')}
                >
                  View All Feedback
                </button>
              </div>

              <div className="feedback-list">
                {feedbacks.slice(0, 4).map((fb) => (
                  <div key={fb.feedback_id} className="card feedback-card" style={{ background: '#f8fafc' }}>
                    <div className="feedback-card-top">
                      <span className="course-tag">{fb.course_code}</span>
                      <span className="feedback-meta">
                        <Clock size={12} /> {new Date(fb.created_at || fb.submitted_at || Date.now()).toLocaleDateString()} · {fb.class_section}
                      </span>
                    </div>
                    <p className="feedback-comment">{fb.feedback_text}</p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span className={`sentiment-badge ${fb.sentiment === 'POSITIVE' ? 'positive' : 'needs-clarity'}`}>
                        {fb.sentiment === 'POSITIVE' ? 'Clear & Engaging' : 'Needs Clarification'}
                      </span>
                      {fb.action_taken && <span style={{ fontSize: '0.75rem', color: '#059669' }}>✓ Responded</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* FACULTY PERFORMANCE TAB (ADMIN ONLY) */}
        {activeTab === 'faculty-performance' && (
          <div className="tab-pane">
            <div style={{ marginBottom: '1.25rem' }}>
              <h2 style={{ margin: '0 0 0.25rem 0', fontSize: '1.25rem', color: '#0f172a' }}>
                Faculty Performance & Subject Teaching Analytics
              </h2>
              <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>
                Review individual faculty effectiveness, student satisfaction ratings, and subject-wise clarity trends across departments.
              </p>
            </div>
            <AdminFacultyWorkspace
              facultyData={facultyPerfData}
              selectedFaculty={selectedFacultyDrilldown}
              onSelectFaculty={setSelectedFacultyDrilldown}
              onCloseDrilldown={() => setSelectedFacultyDrilldown(null)}
            />
          </div>
        )}

        {/* 2. TAB: STUDENT FEEDBACK OVERSIGHT */}
        {activeTab === 'feedback' && (
          <div className="tab-pane">
            {/* Filters Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div className="search-input-box">
                <Search size={15} style={{ color: '#94a3b8' }} />
                <input
                  type="text"
                  placeholder="Search comments or courses..."
                  value={feedSearch}
                  onChange={(e) => setFeedSearch(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <select
                  className="section-select-dropdown"
                  value={feedCourseFilter}
                  onChange={(e) => setFeedCourseFilter(e.target.value)}
                >
                  <option value="ALL">All Subjects</option>
                  {adminCourses.map((c) => (
                    <option key={c.course_id || c.course_code} value={c.course_code}>
                      {c.course_code}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Submissions List */}
            <div className="feedback-list">
              {(() => {
                const filtered = feedbacks.filter((f) => {
                  const matchC = feedCourseFilter === 'ALL' || f.course_code === feedCourseFilter;
                  const q = feedSearch.toLowerCase();
                  const matchQ = !q || f.feedback_text?.toLowerCase().includes(q) || f.course_code?.toLowerCase().includes(q);
                  return matchC && matchQ;
                });

                if (filtered.length === 0) {
                  return (
                    <div className="empty-state card">
                      <p>No feedback found matching the selected filter.</p>
                    </div>
                  );
                }

                return filtered.map((fb) => (
                  <div key={fb.feedback_id} className="card feedback-card">
                    <div className="feedback-card-top">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span className="course-tag">{fb.course_code}</span>
                        <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#0f172a' }}>{fb.course_name}</span>
                      </div>
                      <span className="feedback-meta">
                        <Clock size={12} /> {new Date(fb.created_at).toLocaleDateString()} · {fb.class_section}
                      </span>
                    </div>

                    <p className="feedback-comment">{fb.feedback_text}</p>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span className={`sentiment-badge ${fb.sentiment === 'POSITIVE' ? 'positive' : 'needs-clarity'}`}>
                        {fb.sentiment === 'POSITIVE' ? 'Clear & Engaging' : 'Needs Clarification'}
                      </span>
                      <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                        {fb.is_anonymous ? 'Anonymous Student' : fb.student_name}
                      </span>
                    </div>

                    {fb.action_taken ? (
                      <div className="faculty-response-box">
                        <span className="response-header">Response Provided:</span>
                        <p className="response-text">{fb.action_taken}</p>
                      </div>
                    ) : (
                      <div className="admin-action-row">
                        <input
                          type="text"
                          placeholder="Type a recap note, reply, or clarification..."
                          value={responseText[fb.feedback_id] || ''}
                          onChange={(e) => setResponseText({ ...responseText, [fb.feedback_id]: e.target.value })}
                        />
                        <button
                          type="button"
                          className="btn-record-action"
                          onClick={() => handleRecordAction(fb.feedback_id)}
                        >
                          Respond
                        </button>
                      </div>
                    )}
                  </div>
                ));
              })()}
            </div>
          </div>
        )}

        {/* 3. TAB: CURRICULUM & TIMETABLE */}
        {activeTab === 'curriculum' && (
          <div className="tab-pane">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div className="subtabs-bar" style={{ margin: 0, border: 'none', padding: 0 }}>
                <button
                  type="button"
                  className={`subtab-btn ${curriculumSubTab === 'courses' ? 'active' : ''}`}
                  onClick={() => setCurriculumSubTab('courses')}
                >
                  <BookOpen size={15} /> Subjects ({adminCourses.length})
                </button>
                <button
                  type="button"
                  className={`subtab-btn ${curriculumSubTab === 'lectures' ? 'active' : ''}`}
                  onClick={() => setCurriculumSubTab('lectures')}
                >
                  <CalendarDays size={15} /> Weekly Lectures ({adminLectures.length})
                </button>
                <button
                  type="button"
                  className={`subtab-btn ${curriculumSubTab === 'semesters' ? 'active' : ''}`}
                  onClick={() => setCurriculumSubTab('semesters')}
                >
                  <Layers size={15} /> Semesters ({adminSemesters.length})
                </button>
                <button
                  type="button"
                  className={`subtab-btn ${curriculumSubTab === 'offerings' ? 'active' : ''}`}
                  onClick={() => setCurriculumSubTab('offerings')}
                >
                  <Users size={15} /> Section Allocations
                </button>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  type="button"
                  className="btn-header-action primary"
                  onClick={() => setCourseModal({ open: true, isEdit: false, courseId: null, form: { course_code: '', course_name: '', credits: 4, semester: 5, department_name: 'AI & Data Science', program: 'B.Tech', course_type: 'Core', syllabus_summary: '' } })}
                >
                  <Plus size={14} /> Add Subject
                </button>
                <button
                  type="button"
                  className="btn-header-action"
                  onClick={() => setLectureModal({ open: true, isEdit: false, lectureId: null, form: { course_code: adminCourses[0]?.course_code || 'AI501', course_name: adminCourses[0]?.course_name || 'NLP', faculty_name: user.name || 'Dr. A. Sharma', class_section: 'Class 3A', semester: 5, day_of_week: 'Monday', start_time: '09:30 AM', end_time: '10:30 AM', room_number: 'Hall 301', topic: '', lecture_type: 'Theory', status: 'SCHEDULED' } })}
                >
                  <CalendarDays size={14} /> Schedule Lecture
                </button>
                <button
                  type="button"
                  className="btn-header-action"
                  onClick={() => setSemesterModal({ open: true, form: { semester_number: adminSemesters.length + 1, term_name: `Term ${adminSemesters.length + 1}`, academic_year: '2026-2027', is_active: false } })}
                >
                  <Layers size={14} /> New Semester
                </button>
              </div>
            </div>

            {/* Sub-view: Courses */}
            {curriculumSubTab === 'courses' && (
              <div className="grid-3col">
                {adminCourses.map((c) => (
                  <div key={c.course_id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span className="course-tag">{c.course_code}</span>
                      <div style={{ display: 'flex', gap: '0.25rem' }}>
                        <button
                          type="button"
                          className="btn-header-action"
                          style={{ padding: '0.2rem 0.4rem' }}
                          onClick={() => setCourseModal({ open: true, isEdit: true, courseId: c.course_id, form: { course_code: c.course_code, course_name: c.course_name, credits: c.credits, semester: c.semester, department_name: c.department_name, program: c.program, course_type: c.course_type || 'Core', syllabus_summary: c.syllabus_summary || '' } })}
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          type="button"
                          className="btn-header-action"
                          style={{ padding: '0.2rem 0.4rem', color: '#e11d48' }}
                          onClick={() => handleDeleteCourse(c.course_id, c.course_code)}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>

                    <h4 style={{ margin: 0, fontSize: '0.95rem', color: '#0f172a' }}>{c.course_name}</h4>
                    <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                      Sem {c.semester} · {c.credits} Credits · {c.course_type || 'Core'}
                    </span>
                    {c.syllabus_summary && (
                      <p style={{ fontSize: '0.78rem', color: '#475569', margin: '0.25rem 0 0 0', lineHeight: 1.4 }}>
                        {c.syllabus_summary}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Sub-view: Lectures */}
            {curriculumSubTab === 'lectures' && (
              <div className="grid-3col">
                {adminLectures.map((lec) => (
                  <div key={lec.lecture_id} className="card lecture-card">
                    <div className="lecture-card-header">
                      <span className="day-tag">{lec.day_of_week}</span>
                      <span className="time-loc-row"><Clock size={12} /> {lec.start_time} - {lec.end_time}</span>
                    </div>
                    <div>
                      <h4 style={{ margin: '0 0 0.25rem 0', color: '#0f172a' }}>{lec.course_code} · {lec.course_name}</h4>
                      <span style={{ fontSize: '0.75rem', color: '#64748b' }}><MapPin size={11} /> {lec.room_number || 'TBD'} · {lec.class_section}</span>
                    </div>
                    {lec.topic && <p className="lecture-topic-preview">{lec.topic}</p>}
                    <div className="lecture-card-footer">
                      <span className="instructor-name">{lec.faculty_name}</span>
                      <button
                        type="button"
                        className="btn-header-action"
                        style={{ padding: '0.2rem 0.45rem', color: '#e11d48' }}
                        onClick={() => handleDeleteLecture(lec.lecture_id)}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Sub-view: Semesters */}
            {curriculumSubTab === 'semesters' && (
              <div className="grid-3col">
                {adminSemesters.map((sem) => (
                  <div key={sem.semester_id || sem.semester_number} className="card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#0f172a' }}>Semester {sem.semester_number}</span>
                      <span className={`sentiment-badge ${sem.is_active ? 'positive' : 'neutral'}`}>
                        {sem.is_active ? 'Active Term' : 'Archived'}
                      </span>
                    </div>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>{sem.term_name} · {sem.academic_year}</p>
                    <button
                      type="button"
                      className="btn-header-action"
                      style={{ marginTop: '0.75rem', width: '100%', justifyContent: 'center' }}
                      onClick={() => handleToggleSemesterActive(sem.semester_number, sem.is_active)}
                    >
                      {sem.is_active ? 'Set as Inactive' : 'Set as Current Active Term'}
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Sub-view: Offerings */}
            {curriculumSubTab === 'offerings' && (
              <div className="table-wrap">
                <table className="simple-table">
                  <thead>
                    <tr>
                      <th>Course</th>
                      <th>Section</th>
                      <th>Faculty Assigned</th>
                      <th>Semester</th>
                      <th>Term</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {adminOfferings.map((off) => (
                      <tr key={off.offering_id}>
                        <td><strong>{off.course_code}</strong> - {off.course_name}</td>
                        <td>{off.class_section}</td>
                        <td>{off.faculty_name}</td>
                        <td>Sem {off.semester}</td>
                        <td>{off.term_name || 'Fall 2026'}</td>
                        <td>
                          <button
                            type="button"
                            className="btn-header-action"
                            style={{ padding: '0.2rem 0.4rem', color: '#e11d48' }}
                            onClick={() => handleDeleteOffering(off.offering_id)}
                          >
                            <Trash2 size={13} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* 4. TAB: COURSE MODULES & CLARITY */}
        {activeTab === 'modules' && (
          <div className="tab-pane">
            <div className="pane-heading">
              <h2>Course Units & Topic Clarity</h2>
              <p>Review topics where students flagged questions or requested recap examples.</p>
            </div>

            <div className="grid-2col">
              {(syllabusMapping?.units || [
                { unit_number: 1, unit_title: 'Introduction to NLP & Text Preprocessing', topics: ['Tokenization', 'Stemming', 'N-Grams'], confusion_rate: 12, action_recommended: 'Concept retention is strong.' },
                { unit_number: 2, unit_title: 'Vector Semantics & Word Embeddings', topics: ['Word2Vec', 'GloVe', 'Cosine Similarity'], confusion_rate: 18, action_recommended: 'Share vector visualization notebook.' },
                { unit_number: 3, unit_title: 'Sequential Deep Learning & RNNs', topics: ['RNNs', 'BPTT', 'LSTM & GRU'], confusion_rate: 34, action_recommended: '15-minute recap on BPTT unrolling requested.' },
                { unit_number: 4, unit_title: 'Transformer Architecture & Self-Attention', topics: ['Scaled Dot-Product', 'Multi-Head Attention'], confusion_rate: 38, action_recommended: 'Live coding walkthrough of self-attention.' },
              ]).map((u) => (
                <div key={u.unit_number} className="card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b' }}>UNIT {u.unit_number}</span>
                    <span className={`sentiment-badge ${u.confusion_rate > 30 ? 'needs-clarity' : 'positive'}`}>
                      {u.confusion_rate > 30 ? 'Recap Suggested' : 'High Clarity'}
                    </span>
                  </div>
                  <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.05rem', color: '#0f172a' }}>{u.unit_title}</h3>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginBottom: '0.75rem' }}>
                    {u.topics?.map((tp, idx) => (
                      <span key={idx} className="course-tag">{tp}</span>
                    ))}
                  </div>
                  <div className="faculty-response-box">
                    <span className="response-header">Recommended Pedagogical Action:</span>
                    <p className="response-text">{u.action_recommended}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 5. TAB: GRIEVANCE DESK */}
        {activeTab === 'grievances' && (
          <div className="tab-pane">
            <div className="pane-heading">
              <h2>Student Grievance Resolution Desk</h2>
              <p>Review and resolve student concerns with official resolution notes.</p>
            </div>

            <div className="table-wrap">
              <table className="simple-table">
                <thead>
                  <tr>
                    <th>Title & Category</th>
                    <th>Section</th>
                    <th>Description</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {complaints.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                        No grievances logged.
                      </td>
                    </tr>
                  ) : (
                    complaints.map((c) => (
                      <tr key={c.complaint_id}>
                        <td>
                          <strong>{c.title}</strong>
                          <span style={{ display: 'block', fontSize: '0.75rem', color: '#64748b' }}>{c.category}</span>
                        </td>
                        <td>{c.class_section}</td>
                        <td style={{ maxWidth: '300px' }}>{c.description}</td>
                        <td>
                          <span className={`sentiment-badge ${c.status === 'RESOLVED' ? 'positive' : 'needs-clarity'}`}>
                            {c.status}
                          </span>
                        </td>
                        <td>
                          {c.status !== 'RESOLVED' ? (
                            <button
                              type="button"
                              className="btn-review-lecture"
                              onClick={() => {
                                const action = window.prompt('Enter action taken to resolve this grievance:');
                                if (action) handleResolveComplaint(c.complaint_id, action);
                              }}
                            >
                              Resolve
                            </button>
                          ) : (
                            <span style={{ fontSize: '0.75rem', color: '#059669' }}>✓ Resolved</span>
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

        {/* 6. TAB: SETTINGS & TOOLS */}
        {activeTab === 'settings' && (
          <div className="tab-pane">
            <div className="grid-2col">
              {/* Gemini Key Config */}
              <div className="card">
                <h3 style={{ margin: '0 0 0.5rem 0', color: '#0f172a' }}>Google Gemini Integration</h3>
                <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0 0 1rem 0' }}>
                  Enables deep feedback classification and automatic summary notes.
                </p>

                <div style={{ marginBottom: '1rem' }}>
                  <span className={`sentiment-badge ${geminiConfig.has_gemini_key ? 'positive' : 'neutral'}`}>
                    {geminiConfig.has_gemini_key ? '✓ API Key Active & Configured' : 'Local Fallback Active'}
                  </span>
                </div>

                <form onSubmit={handleSaveGeminiKey} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div className="form-group">
                    <label>Update Gemini API Key</label>
                    <input
                      type="password"
                      placeholder="Paste your Gemini API Key here..."
                      value={geminiKeyInput}
                      onChange={(e) => setGeminiKeyInput(e.target.value)}
                    />
                  </div>
                  <button type="submit" className="btn-submit-primary" disabled={geminiSaving} style={{ width: 'auto', alignSelf: 'flex-start' }}>
                    {geminiSaving ? 'Verifying…' : 'Save & Verify Key'}
                  </button>
                </form>
              </div>

              {/* Webhook Alerts & Reporting */}
              <div className="card">
                <h3 style={{ margin: '0 0 0.5rem 0', color: '#0f172a' }}>Reports & Notifications</h3>
                <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0 0 1.25rem 0' }}>
                  Export semester reports or dispatch alerts to department channels.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <button
                    type="button"
                    className="btn-header-action"
                    style={{ justifyContent: 'center', padding: '0.65rem' }}
                    onClick={() => setAccreditationModalOpen(true)}
                  >
                    <Award size={16} /> Export Semester Executive Summary
                  </button>
                  <button
                    type="button"
                    className="btn-header-action"
                    style={{ justifyContent: 'center', padding: '0.65rem' }}
                    onClick={async () => {
                      try {
                        const res = await fetch(`${API}/feedback/integrations/test-webhook`, { method: 'POST' });
                        if (res.ok) addToast?.({ title: 'Test Dispatched', message: 'Alert sent successfully.', type: 'success' });
                      } catch (e) {
                        console.error(e);
                      }
                    }}
                  >
                    <Webhook size={16} /> Test Webhook Notification
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Curriculum Modals */}
      {courseModal.open && (
        <div className="modal-backdrop" onClick={() => setCourseModal({ ...courseModal, open: false })}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{courseModal.isEdit ? 'Edit Subject' : 'Add Subject'}</h3>
              <button type="button" className="btn-close-modal" onClick={() => setCourseModal({ ...courseModal, open: false })}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSaveCourse} className="auth-form-body">
              <div className="form-group">
                <label>Course Code *</label>
                <input required placeholder="e.g. AI509" value={courseModal.form.course_code} onChange={(e) => setCourseModal({ ...courseModal, form: { ...courseModal.form, course_code: e.target.value.toUpperCase() } })} />
              </div>
              <div className="form-group">
                <label>Course Title *</label>
                <input required placeholder="e.g. Reinforcement Learning" value={courseModal.form.course_name} onChange={(e) => setCourseModal({ ...courseModal, form: { ...courseModal.form, course_name: e.target.value } })} />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Semester</label>
                  <select value={courseModal.form.semester} onChange={(e) => setCourseModal({ ...courseModal, form: { ...courseModal.form, semester: Number(e.target.value) } })}>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => <option key={s} value={s}>Semester {s}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Credits</label>
                  <input type="number" min="1" max="10" value={courseModal.form.credits} onChange={(e) => setCourseModal({ ...courseModal, form: { ...courseModal.form, credits: Number(e.target.value) } })} />
                </div>
              </div>
              <div className="form-group">
                <label>Syllabus Summary</label>
                <textarea rows="2" placeholder="Key topics covered..." value={courseModal.form.syllabus_summary} onChange={(e) => setCourseModal({ ...courseModal, form: { ...courseModal.form, syllabus_summary: e.target.value } })} />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setCourseModal({ ...courseModal, open: false })}>Cancel</button>
                <button type="submit" className="btn-confirm">Save Subject</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {lectureModal.open && (
        <div className="modal-backdrop" onClick={() => setLectureModal({ ...lectureModal, open: false })}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{lectureModal.isEdit ? 'Edit Scheduled Lecture' : 'Schedule Lecture'}</h3>
              <button type="button" className="btn-close-modal" onClick={() => setLectureModal({ ...lectureModal, open: false })}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSaveLecture} className="auth-form-body">
              <div className="form-group">
                <label>Subject *</label>
                <select
                  value={lectureModal.form.course_code}
                  onChange={(e) => {
                    const code = e.target.value;
                    const f = adminCourses.find((c) => c.course_code === code);
                    setLectureModal({ ...lectureModal, form: { ...lectureModal.form, course_code: code, course_name: f?.course_name || lectureModal.form.course_name, semester: f?.semester || lectureModal.form.semester } });
                  }}
                >
                  {adminCourses.map((c) => <option key={c.course_id} value={c.course_code}>{c.course_code} - {c.course_name}</option>)}
                </select>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Day *</label>
                  <select value={lectureModal.form.day_of_week} onChange={(e) => setLectureModal({ ...lectureModal, form: { ...lectureModal.form, day_of_week: e.target.value } })}>
                    {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((d) => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Time *</label>
                  <input placeholder="09:30 AM - 10:30 AM" value={`${lectureModal.form.start_time} - ${lectureModal.form.end_time}`} onChange={(e) => {
                    const parts = e.target.value.split('-');
                    setLectureModal({ ...lectureModal, form: { ...lectureModal.form, start_time: parts[0]?.trim() || '09:30 AM', end_time: parts[1]?.trim() || '10:30 AM' } });
                  }} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Room / Hall</label>
                  <input placeholder="e.g. Hall 301" value={lectureModal.form.room_number || ''} onChange={(e) => setLectureModal({ ...lectureModal, form: { ...lectureModal.form, room_number: e.target.value } })} />
                </div>
                <div className="form-group">
                  <label>Section</label>
                  <input value={lectureModal.form.class_section} onChange={(e) => setLectureModal({ ...lectureModal, form: { ...lectureModal.form, class_section: e.target.value } })} />
                </div>
              </div>
              <div className="form-group">
                <label>Topic / Agenda</label>
                <input placeholder="e.g. Transformer Architecture & Attention" value={lectureModal.form.topic || ''} onChange={(e) => setLectureModal({ ...lectureModal, form: { ...lectureModal.form, topic: e.target.value } })} />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setLectureModal({ ...lectureModal, open: false })}>Cancel</button>
                <button type="submit" className="btn-confirm">Schedule Lecture</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {semesterModal.open && (
        <div className="modal-backdrop" onClick={() => setSemesterModal({ ...semesterModal, open: false })}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Add Academic Semester</h3>
              <button type="button" className="btn-close-modal" onClick={() => setSemesterModal({ ...semesterModal, open: false })}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSaveSemester} className="auth-form-body">
              <div className="form-group">
                <label>Semester Number (1 - 8) *</label>
                <input type="number" min="1" max="12" required value={semesterModal.form.semester_number} onChange={(e) => setSemesterModal({ ...semesterModal, form: { ...semesterModal.form, semester_number: Number(e.target.value) } })} />
              </div>
              <div className="form-group">
                <label>Term Name *</label>
                <input required placeholder="e.g. Spring 2027" value={semesterModal.form.term_name} onChange={(e) => setSemesterModal({ ...semesterModal, form: { ...semesterModal.form, term_name: e.target.value } })} />
              </div>
              <div className="form-group">
                <label>Academic Year *</label>
                <input required placeholder="e.g. 2026-2027" value={semesterModal.form.academic_year} onChange={(e) => setSemesterModal({ ...semesterModal, form: { ...semesterModal.form, academic_year: e.target.value } })} />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setSemesterModal({ ...semesterModal, open: false })}>Cancel</button>
                <button type="submit" className="btn-confirm">Save Semester</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Profile & Accreditation Modals */}
      <ProfileSettingsModal
        isOpen={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
        user={user}
        token={token}
        onUserUpdated={onUserUpdated}
        addToast={addToast}
      />

      <AccreditationReportModal
        isOpen={accreditationModalOpen}
        onClose={() => setAccreditationModalOpen(false)}
        user={user}
        feedbacks={feedbacks}
      />
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// MINIMALIST AI ASSISTANT WIDGET
// ═══════════════════════════════════════════════════════
function AIAssistant({ user }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState(() => {
    const isStudent = user?.role === 'STUDENT';
    const welcome = isStudent
      ? `Hi ${user?.name?.split(' ')[0] || 'there'}! 👋 I'm your Sentio assistant. I can explain complex lecture topics, help you draft constructive feedback, or share tips for balancing coursework. How can I help today?`
      : `Hello Professor ${user?.name?.split(' ')[0] || ''}! 🎓 I'm your academic assistant. I can help synthesize class sentiment trends, outline 10-minute recap sessions for confused topics, or draft clarification broadcasts. What would you like to explore?`;
    return [
      {
        id: 'welcome',
        role: 'assistant',
        text: welcome,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ];
  });
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);

  const isStudent = user?.role === 'STUDENT';

  const quickPrompts = isStudent
    ? [
        '💡 Explain a concept simply',
        '✍️ Help draft course feedback',
        '🧘 Study-life balance advice',
        '❓ How to lodge a grievance?',
      ]
    : [
        '📊 Summarize student sentiment',
        '📝 Draft a clarification note',
        '⏱️ 10-minute recap lesson plan',
        '🎯 Review curriculum health',
      ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const toggleRecording = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser.');
      return;
    }

    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-US';
      recognition.interimResults = false;
      recognition.continuous = false;

      recognition.onstart = () => setIsRecording(true);
      recognition.onend = () => setIsRecording(false);
      recognition.onerror = () => setIsRecording(false);

      recognition.onresult = (event) => {
        const transcript = event.results[0]?.[0]?.transcript || '';
        if (transcript) {
          setInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (e) {
      console.error(e);
      setIsRecording(false);
    }
  };

  const handleSend = async (messageText) => {
    const textToSend = (messageText || input).trim();
    if (!textToSend || isLoading) return;

    const userMsg = {
      id: Date.now().toString(),
      role: 'user',
      text: textToSend,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const historyPayload = messages.slice(-8).map((m) => ({
        role: m.role,
        content: m.text,
      }));

      const res = await fetch(`${API}/api/bixi/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend,
          user: {
            name: user?.name,
            role: user?.role,
            email: user?.email,
            class_section: user?.class_section,
          },
          history: historyPayload,
        }),
      });

      if (!res.ok) throw new Error('Failed to get response');
      const data = await res.json();

      const assistantMsg = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        text: data.reply || "I'm here to help, but couldn't generate a response right now. Please try again.",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      console.error(err);
      const errorMsg = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        text: "I'm having a brief connection issue. Please check your network or try again shortly.",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetChat = () => {
    const welcome = isStudent
      ? `Chat reset. What would you like help with next, ${user?.name?.split(' ')[0] || ''}?`
      : `Session refreshed. How can I assist with your classes or pedagogical insights?`;
    setMessages([
      {
        id: Date.now().toString(),
        role: 'assistant',
        text: welcome,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  return (
    <>
      <button
        className="ai-assistant-toggle-btn"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label="Toggle Sentio Assistant"
      >
        <Sparkles size={16} />
        <span>{isOpen ? 'Close Assistant' : 'Assistant'}</span>
      </button>

      {isOpen && (
        <div className="ai-assistant-window" role="dialog" aria-label="Sentio Assistant Window">
          <div className="ai-chat-header">
            <div className="ai-header-info">
              <div className="ai-header-badge">
                <Sparkles size={15} />
              </div>
              <div className="ai-header-title">
                <strong>Sentio Assistant</strong>
                <span>{isStudent ? 'Academic & Study Support' : 'Teaching & Insights Co-Pilot'}</span>
              </div>
            </div>
            <div className="ai-header-actions">
              <button
                className="ai-icon-btn"
                onClick={handleResetChat}
                title="Restart Conversation"
                aria-label="Restart Conversation"
              >
                <RotateCcw size={14} />
              </button>
              <button
                className="ai-icon-btn"
                onClick={() => setIsOpen(false)}
                title="Close"
                aria-label="Close Assistant"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          <div className="ai-chat-messages">
            {messages.map((m) => (
              <div key={m.id} className={`ai-msg-wrap ${m.role}`}>
                <div className="ai-msg-bubble">{m.text}</div>
                <span className="ai-msg-time">{m.time}</span>
              </div>
            ))}
            {isLoading && (
              <div className="ai-msg-wrap assistant">
                <div className="ai-typing-indicator">
                  <span className="ai-typing-dot" />
                  <span className="ai-typing-dot" />
                  <span className="ai-typing-dot" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="ai-quick-prompts">
            {quickPrompts.map((prompt) => (
              <button
                key={prompt}
                className="ai-prompt-chip"
                onClick={() => handleSend(prompt)}
                disabled={isLoading}
              >
                {prompt}
              </button>
            ))}
          </div>

          <div className="ai-chat-input-bar">
            <button
              type="button"
              className={`btn-ai-mic ${isRecording ? 'recording' : ''}`}
              onClick={toggleRecording}
              title={isRecording ? 'Stop voice recording' : 'Dictate with voice'}
              aria-label="Dictate with voice"
            >
              {isRecording ? <MicOff size={15} /> : <Mic size={15} />}
            </button>
            <input
              type="text"
              placeholder="Ask anything or pick a prompt..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              disabled={isLoading}
            />
            <button
              type="button"
              className="btn-ai-send"
              onClick={() => handleSend()}
              disabled={!input.trim() || isLoading}
              aria-label="Send Message"
            >
              <Send size={14} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}

// ═══════════════════════════════════════════════════════
// ROOT APP COMPONENT
// ═══════════════════════════════════════════════════════
export default function App() {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('sentio_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(() => localStorage.getItem('sentio_token') || null);
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((toast) => {
    const id = Date.now() + Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, ...toast }]);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const handleAuthenticated = (userData, authToken) => {
    setUser(userData);
    setToken(authToken);
    try {
      localStorage.setItem('sentio_user', JSON.stringify(userData));
      localStorage.setItem('sentio_token', authToken);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSwitchRole = (targetRole) => {
    let newUser;
    if (targetRole === 'STUDENT') {
      newUser = {
        user_id: 1,
        student_id: 1,
        name: 'Arunn Reddy',
        roll_no: '2024-AI-042',
        email: 'student@univ.edu',
        role: 'STUDENT',
        semester: 5,
        class_section: 'Class 3A',
      };
    } else if (targetRole === 'FACULTY') {
      newUser = {
        user_id: 2,
        name: 'Dr. A. Sharma',
        roll_no: 'FACULTY-001',
        email: 'faculty@univ.edu',
        role: 'FACULTY',
        department: 'AI & Data Science',
        semester: 5,
        class_section: 'Class 3A',
      };
    } else {
      newUser = {
        user_id: 3,
        name: 'Dean Academics',
        roll_no: 'ADMIN-001',
        email: 'admin@univ.edu',
        role: 'ADMIN',
        department: 'Engineering',
        semester: 5,
        class_section: 'Class 3A',
      };
    }
    setUser(newUser);
    try {
      localStorage.setItem('sentio_user', JSON.stringify(newUser));
    } catch (e) {
      console.error(e);
    }
    addToast({
      title: 'Switched View',
      message: `Viewing as ${newUser.name} (${newUser.role})`,
      type: 'info',
    });
  };

  const handleLogout = () => {
    setUser(null);
    setToken(null);
    try {
      localStorage.removeItem('sentio_user');
      localStorage.removeItem('sentio_token');
    } catch (e) {
      console.error(e);
    }
    addToast({ title: 'Signed Out', message: 'You have been signed out.', type: 'info' });
  };

  const handleUserUpdated = (updatedUser) => {
    setUser(updatedUser);
    try {
      localStorage.setItem('sentio_user', JSON.stringify(updatedUser));
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="app-root">
      {!user || !token ? (
        <Auth onAuthenticated={handleAuthenticated} addToast={addToast} />
      ) : user.role === 'ADMIN' || user.role === 'FACULTY' ? (
        <AdminDashboard
          user={user}
          token={token}
          onLogout={handleLogout}
          onSwitchRole={handleSwitchRole}
          addToast={addToast}
          onUserUpdated={handleUserUpdated}
        />
      ) : (
        <StudentDashboard
          user={user}
          token={token}
          onLogout={handleLogout}
          onSwitchRole={handleSwitchRole}
          addToast={addToast}
          onUserUpdated={handleUserUpdated}
        />
      )}

      {user && <AIAssistant user={user} />}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </div>
  );
}
