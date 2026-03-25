import React, { useState, useEffect, useMemo } from 'react';
import {
  LineChart as LineChartIcon,
  TrendingUp,
  TrendingDown,
  Lightbulb,
  Bot,
  Loader2,
  AlertTriangle
} from 'lucide-react';
import { getParentSessionRegdNo, fetchStudentRecord } from '../../services/studentService';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const SUBJECT_SCORE_FIELDS = [
  { key: 'm1', max: 20 },
  { key: 'pre_t1', max: 10 },
  { key: 't2', max: 5 },
  { key: 't3', max: 5 },
  { key: 't4', max: 20 },
  { key: 't5_avg', max: 20 },
];
const LOW_GRADE_SET = new Set(['D', 'E', 'F', 'I', 'R']);

const computeSubjectScore = (subject) => {
  let total = 0;
  let count = 0;
  SUBJECT_SCORE_FIELDS.forEach(({ key, max }) => {
    const raw = subject[key];
    if (raw === null || raw === undefined || raw === '') return;
    const value = Number(raw);
    if (Number.isFinite(value)) {
      total += (value / max) * 100;
      count += 1;
    }
  });
  return count ? Number((total / count).toFixed(1)) : null;
};

const buildWeakReasons = (subject, avgScore) => {
  const reasons = [];
  const grade = (subject.grade || '').toString().toUpperCase();
  if (grade && LOW_GRADE_SET.has(grade)) {
    reasons.push(`Grade ${grade}`);
  }
  if (subject.t5_avg !== undefined && subject.t5_avg !== null && Number(subject.t5_avg) < 10) {
    reasons.push(`T5 avg ${subject.t5_avg}`);
  }
  if (avgScore !== null && avgScore < 55) {
    reasons.push(`Average ${avgScore}%`);
  }
  return reasons.join(' • ');
};

export default function PerformanceInsightsPage() {
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [aiSummary, setAiSummary] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');
  const [aiSource, setAiSource] = useState('heuristic');

  useEffect(() => {
    const regdNo = getParentSessionRegdNo();
    if (!regdNo) {
      setError('Parent session missing. Please sign in again.');
      setLoading(false);
      return;
    }

    fetchStudentRecord(regdNo)
      .then(data => {
        if (!data) {
          setError('No academic data has been recorded yet.');
          return;
        }
        setStudent(data);
      })
      .catch(err => {
        console.error('[Insights] fetch error', err);
        setError(err.message || 'Unable to load insights.');
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!student) {
      setAiSummary('');
      return;
    }
    setAiLoading(true);
    setAiError('');
    fetch(`${API_URL}/api/ai/summary`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ regdNo: student.registrationNumber })
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setAiSummary(data.data?.summary || '');
          setAiSource(data.data?.generatedBy || 'heuristic');
        } else {
          setAiError(data.message || 'AI summary unavailable');
        }
      })
      .catch(err => {
        console.error('[Insights] AI error', err);
        setAiError('AI service temporarily unavailable');
      })
      .finally(() => setAiLoading(false));
  }, [student]);

  const subjects = student?.subjectResults || [];
  const attendance = student?.attendance || [];
  const status = student?.status || {};

  const subjectInsights = useMemo(() => {
    return subjects.map(subject => {
      const avgScore = computeSubjectScore(subject);
      const reason = buildWeakReasons(subject, avgScore);
      return {
        ...subject,
        avgScore,
        reason,
        isWeak: Boolean(reason)
      };
    });
  }, [subjects]);

  const strengths = useMemo(() => {
    return subjectInsights
      .filter(s => !s.isWeak && s.avgScore !== null)
      .sort((a, b) => (b.avgScore ?? 0) - (a.avgScore ?? 0))
      .slice(0, 2);
  }, [subjectInsights]);

  const weaknesses = useMemo(() => {
    return subjectInsights
      .filter(s => s.isWeak)
      .sort((a, b) => (a.avgScore ?? 0) - (b.avgScore ?? 0))
      .slice(0, 3);
  }, [subjectInsights]);

  const lowAttendanceSubjects = attendance
    .map(record => {
      const total = record.total_classes ?? 0;
      const attended = record.attended_classes ?? 0;
      const percent =
        record.attendance_percentage ??
        (total ? Number(((attended / total) * 100).toFixed(1)) : null);
      return {
        subject: record.subject_name || 'Subject',
        percent
      };
    })
    .filter(rec => rec.percent !== null && rec.percent < 75);

  const suggestions = useMemo(() => {
    const list = [];
    if (status.active_backlogs > 0) {
      list.push(`There are ${status.active_backlogs} active backlog${status.active_backlogs === 1 ? '' : 's'} — prioritize clearing them with the faculty.`);
    }
    if (weaknesses.length > 0) {
      list.push(`Focus on ${weaknesses.map(w => w.subject).join(', ')} to boost SGPA before internal deadlines.`);
    }
    if (lowAttendanceSubjects.length > 0) {
      list.push(`Attendance below 75% in ${lowAttendanceSubjects.map(s => `${s.subject} (${s.percent}%)`).join(', ')} — maintain engagement.`);
    }
    if (list.length === 0) {
      list.push('Keep attending classes regularly and align your T5 internals with the syllabus to stay on track.');
    }
    return list;
  }, [status.active_backlogs, weaknesses, lowAttendanceSubjects]);

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-2">
        <div>
          <h1 className="text-2xl font-extrabold flex items-center gap-2 mb-2">
            <LineChartIcon className="text-primary" /> AI Performance Insights
          </h1>
          <p className="text-slate-500 dark:text-slate-400">Personalized analysis based on the latest marks, SGPA and attendance data.</p>
        </div>
        <div className="px-4 py-2 rounded-xl bg-gradient-to-r from-primary/10 to-purple-600/10 border border-primary/20 flex items-center gap-2 text-primary font-bold shadow-sm">
          <Bot size={18} /> Auto-Generated
        </div>
      </div>

      {loading ? (
        <div className="glass-panel p-12 rounded-3xl bg-white/60 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-10 h-10 text-primary animate-spin" />
          <span className="text-slate-500 text-sm font-medium">Analyzing performance…</span>
        </div>
      ) : error ? (
        <div className="glass-panel p-6 rounded-3xl bg-rose-50/60 dark:bg-rose-900/30 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-sm flex items-center gap-2">
          <AlertTriangle size={16} /> {error}
        </div>
      ) : (
        <>
          <div className="glass-panel p-5 rounded-3xl bg-white/80 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">AI Summary</p>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Bot className="text-primary" size={18} /> Groq Performance Snapshot
                </h2>
              </div>
              <span className="text-[11px] text-slate-400">Source: {aiSource}</span>
            </div>
            {aiLoading ? (
              <div className="flex items-center gap-2 mt-3 text-sm text-primary">
                <Loader2 className="animate-spin" size={16} />
                Generating a tailored summary…
              </div>
            ) : aiError ? (
              <p className="text-sm text-rose-500 mt-3">{aiError}</p>
            ) : (
              <p className="text-sm text-slate-700 dark:text-slate-200 mt-3">
                {aiSummary || 'AI summary is ready as soon as we receive marks, attendance, and fee data.'}
              </p>
            )}
          </div>
          <div className="grid md:grid-cols-2 gap-6">
          <div className="glass-panel p-6 rounded-3xl bg-emerald-50/60 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-800/50 shadow-lg">
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-emerald-400/10 rounded-full blur-[40px] pointer-events-none" />
            <h2 className="text-lg font-bold flex items-center gap-2 mb-6 text-emerald-800 dark:text-emerald-400">
              <TrendingUp size={20} /> Academic Strengths
            </h2>
            {strengths.length === 0 ? (
              <p className="text-sm text-slate-500">No strong focus areas yet. Encourage consistent internals to build a baseline.</p>
            ) : (
              <div className="space-y-4">
                {strengths.map((item) => (
                  <div key={item.subject} className="bg-white/90 dark:bg-slate-900/70 p-4 rounded-2xl border border-emerald-100 dark:border-emerald-800/40 flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-white">{item.subject}</h3>
                      <p className="text-xs text-slate-500">Grade {item.grade || 'N/A'}</p>
                    </div>
                    <span className="text-2xl font-black text-emerald-600 dark:text-emerald-300">
                      {item.avgScore !== null ? `${item.avgScore}%` : '—'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="glass-panel p-6 rounded-3xl bg-rose-50/60 dark:bg-rose-900/10 border border-rose-200 dark:border-rose-800/50 shadow-lg">
            <h2 className="text-lg font-bold flex items-center gap-2 mb-4 text-rose-800 dark:text-rose-400">
              <TrendingDown size={20} /> Areas for Improvement
            </h2>
            {weaknesses.length === 0 ? (
              <p className="text-sm text-slate-500">No low-grade alerts yet. Keep monitoring the SGPA and T5 internals.</p>
            ) : (
              <div className="space-y-3">
                {weaknesses.map((item) => (
                  <div key={item.subject} className="bg-white/90 dark:bg-slate-900/70 p-4 rounded-2xl border border-rose-100 dark:border-rose-800/30">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-bold text-slate-800 dark:text-white">{item.subject}</h3>
                      <span className="text-xs font-semibold text-rose-600 dark:text-rose-400">
                        {item.grade || 'Grade pending'}
                      </span>
                    </div>
                    <p className="text-sm text-slate-500">
                      {item.reason || 'Review internals to unlock better scores.'}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="md:col-span-2 glass-panel rounded-3xl bg-white/60 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 overflow-hidden mt-2 shadow-lg">
            <div className="p-6 border-b border-primary/10 bg-gradient-to-r from-primary/5 to-transparent">
              <h2 className="text-lg font-bold flex items-center gap-2 text-slate-800 dark:text-slate-200">
                <Lightbulb className="text-primary" size={20} /> Actionable Recommendations
              </h2>
            </div>
            <div className="p-6 md:p-8 space-y-4">
              {suggestions.map((suggestion, idx) => (
                <div key={`suggestion-${idx}`} className="flex gap-4 items-start">
                  <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center mt-1 shadow-inner">
                    <span className="font-bold text-sm">{idx + 1}</span>
                  </div>
                  <p className="text-lg leading-relaxed text-slate-700 dark:text-slate-300">{suggestion}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
        </>
      )}
    </div>
  );
}
