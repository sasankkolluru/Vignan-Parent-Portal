import React, { useState, useEffect } from 'react';
import { Activity, AlertTriangle, RefreshCcw, Clock, ShieldCheck, Loader2 } from 'lucide-react';
import { getParentSessionRegdNo, fetchStudentRecord } from '../../services/studentService';

const parseSubjectList = (text) => {
  if (!text) return [];
  return text
    .split(/[,;\n]/)
    .map(item => item.trim())
    .filter(Boolean);
};

export default function AcademicStatusPage() {
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const regdNo = getParentSessionRegdNo();
    if (!regdNo) {
      setError('Parent session not found. Please log in again.');
      setLoading(false);
      return;
    }

    fetchStudentRecord(regdNo)
      .then(data => {
        if (!data) {
          setError('Academic status is not tracked yet.');
          return;
        }
        setStudent(data);
      })
      .catch(err => {
        console.error('[AcademicStatus] fetch error', err);
        setError(err.message || 'Unable to load academic status.');
      })
      .finally(() => setLoading(false));
  }, []);

  const status = student?.status || {};
  const repeatedSubjects = parseSubjectList(status.repeated_subjects);
  const incompleteSubjects = parseSubjectList(status.incomplete_subjects);

  const summaryTiles = [
    { label: 'Active Backlogs', value: status.active_backlogs ?? 0, icon: <AlertTriangle size={24} className="text-rose-500" /> },
    { label: 'Repeated Subjects', value: repeatedSubjects.length, icon: <RefreshCcw size={24} className="text-amber-500" /> },
    { label: 'Incomplete Work', value: incompleteSubjects.length, icon: <Clock size={24} className="text-orange-500" /> },
    { label: 'Course Completion', value: status.course_completion_status || 'In Progress', icon: <ShieldCheck size={24} className="text-emerald-500" /> },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      <div>
        <h1 className="text-2xl font-extrabold flex items-center gap-2 mb-2">
          <Activity className="text-primary" /> Academic Status
        </h1>
        <p className="text-slate-500 dark:text-slate-400">
          Track active backlogs, repeats, and outstanding academic commitments in real time.
        </p>
      </div>

      {loading ? (
        <div className="glass-panel p-12 flex flex-col items-center justify-center rounded-3xl min-h-[320px] border border-slate-200 dark:border-slate-800">
          <Loader2 className="w-10 h-10 text-primary animate-spin mb-3" />
          <p className="text-slate-500 text-sm font-medium">Loading academic status…</p>
        </div>
      ) : (
        <>
          {error && (
            <div className="glass-panel p-6 rounded-3xl bg-rose-50/60 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-sm">
              <div className="flex items-center gap-2">
                <AlertTriangle size={16} />
                <span>{error}</span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {summaryTiles.map((tile) => (
              <div key={tile.label} className="glass-panel p-5 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 shadow-sm flex flex-col text-center gap-3">
                <div className="flex items-center justify-center">{tile.icon}</div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">{tile.label}</p>
                <p className="text-3xl font-black text-slate-800 dark:text-white">{tile.value}</p>
              </div>
            ))}
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="glass-panel rounded-3xl overflow-hidden bg-white/60 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 shadow-lg">
              <div className="p-5 border-b border-slate-200 dark:border-slate-800 bg-rose-50/50">
                <h2 className="text-lg font-bold flex items-center gap-2 text-rose-800 dark:text-rose-300">
                  <AlertTriangle size={18} /> Active Backlog Details
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Admin updates the backlog list as students clear courses.
                </p>
              </div>
              <div className="p-5 space-y-3">
                {repeatedSubjects.length === 0 && incompleteSubjects.length === 0 ? (
                  <p className="text-sm text-slate-500">No explicit backlog or repeat subjects recorded.</p>
                ) : (
                  <>
                    {repeatedSubjects.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Repeated</p>
                        <div className="space-y-2">
                          {repeatedSubjects.map((subject, idx) => (
                            <div key={`repeat-${idx}`} className="flex items-center justify-between text-sm px-3 py-2 rounded-2xl border border-amber-100 dark:border-amber-900/40 bg-amber-50/70 dark:bg-amber-900/10">
                              <span>{subject}</span>
                              <span className="text-xs font-semibold text-amber-700">Needs clearance</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {incompleteSubjects.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Incomplete Work</p>
                        <div className="space-y-2">
                          {incompleteSubjects.map((subject, idx) => (
                            <div key={`incomplete-${idx}`} className="flex items-center justify-between text-sm px-3 py-2 rounded-2xl border border-orange-100 dark:border-orange-900/40 bg-orange-50/70 dark:bg-orange-900/10">
                              <span>{subject}</span>
                              <span className="text-xs font-semibold text-orange-600">Pending review</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            <div className="glass-panel rounded-3xl overflow-hidden bg-white/60 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 shadow-lg">
              <div className="p-5 border-b border-slate-200 dark:border-slate-800 bg-emerald-50/60">
                <h2 className="text-lg font-bold flex items-center gap-2 text-emerald-700 dark:text-emerald-300">
                  <ShieldCheck size={18} /> Completion Tracker
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Tracking the student&apos;s journey toward graduation targets.
                </p>
              </div>
              <div className="p-5 space-y-4">
                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Course Completion Status</p>
                  <p className="text-lg font-semibold text-slate-900 dark:text-white">
                    {status.course_completion_status || 'In Progress'}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Cleared Backlogs</p>
                  <p className="text-sm text-slate-500">
                    {status.cleared_backlogs ?? 0} subjects cleared as recorded in the ERP.
                  </p>
                </div>
                <button
                  onClick={() => window.location.reload()}
                  className="w-full flex items-center justify-center gap-2 py-2 text-sm font-semibold bg-primary text-white rounded-xl hover:opacity-90 transition-all"
                >
                  <RefreshCcw size={16} /> Refresh Status
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
