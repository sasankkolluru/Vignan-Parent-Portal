import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, CheckCircle2, UserCheck, Bot, Loader2 } from 'lucide-react';
import { getParentSessionRegdNo, fetchStudentRecord } from '../../services/studentService';

const formatPercentage = (value) => (value === null || value === undefined ? 'N/A' : `${value.toFixed(1)}%`);

export default function AttendanceOverviewPage() {
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const regdNo = getParentSessionRegdNo();
    if (!regdNo) {
      setError('Parent session not found. Please login again.');
      setLoading(false);
      return;
    }

    fetchStudentRecord(regdNo)
      .then(data => {
        if (!data) {
          setError('Attendance data is not yet available.');
          return;
        }
        setStudent(data);
      })
      .catch(err => {
        console.error('[Attendance] Fetch error', err);
        setError(err.message || 'Failed to load attendance information.');
      })
      .finally(() => setLoading(false));
  }, []);

  const attendanceRecords = student?.attendance || [];
  const totalClasses = attendanceRecords.reduce((sum, rec) => sum + (rec.total_classes ?? 0), 0);
  const attendedClasses = attendanceRecords.reduce((sum, rec) => sum + (rec.attended_classes ?? 0), 0);
  const overallAttendance = totalClasses
    ? Number(((attendedClasses / totalClasses) * 100).toFixed(1))
    : null;
  const isAlert = overallAttendance !== null && overallAttendance < 75;

  const subjectRows = attendanceRecords.map((record, index) => {
    const total = record.total_classes ?? 0;
    const attended = record.attended_classes ?? 0;
    const percent =
      record.attendance_percentage ??
      (total ? Number(((attended / total) * 100).toFixed(1)) : 0);
    return {
      id: `${record.subject_name || 'subject'}-${index}`,
      subject: record.subject_name || `Subject ${index + 1}`,
      semester: record.semester ?? 'N/A',
      total,
      attended,
      percent,
      status: percent >= 75 ? 'OK' : 'Low'
    };
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-2">
        <div>
          <h1 className="text-2xl font-extrabold flex items-center gap-2">
            <UserCheck className="text-primary" /> Attendance Overview
          </h1>
          <p className="text-slate-500 dark:text-slate-400">
            Live attendance data pulled directly from the ERP for {student?.name || 'your child'}.
          </p>
        </div>
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl text-sm font-semibold transition-colors"
        >
          <Bot size={16} className="text-primary" /> Ask Chatbot
        </Link>
      </div>

      {loading ? (
        <div className="glass-panel p-12 flex flex-col items-center justify-center rounded-3xl min-h-[400px]">
          <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
          <p className="text-slate-500 font-medium text-sm">Fetching attendance data…</p>
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

          <div className="grid md:grid-cols-3 gap-6 animate-fade-in-up">
            <div className="md:col-span-2 glass-panel p-6 rounded-3xl flex items-center justify-between bg-white/60 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 relative shadow-sm">
              <div className="absolute top-4 right-4">
                <span className="px-2 py-0.5 bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400 text-[10px] rounded-full uppercase tracking-wider font-bold">
                  API Sync
                </span>
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-700 dark:text-slate-300">Overall Attendance</h2>
                <p className="text-slate-500 text-sm mt-1">
                  Based on {attendanceRecords.length} tracked subject{attendanceRecords.length === 1 ? '' : 's'}.
                </p>
              </div>
              <div className="text-right">
                <span className={`text-5xl font-black ${isAlert ? 'text-rose-600' : 'text-primary'}`}>
                  {overallAttendance !== null ? `${overallAttendance}%` : 'N/A'}
                </span>
              </div>
            </div>

            <div className={`glass-panel p-6 rounded-3xl flex flex-col justify-center border ${isAlert ? 'bg-rose-50/50 border-rose-200 dark:bg-rose-900/20 dark:border-rose-800/50' : 'bg-emerald-50/50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800/50'}`}>
              <div className="flex items-center gap-3 mb-2">
                {isAlert ? (
                  <AlertTriangle className="text-rose-600 dark:text-rose-500" size={24} />
                ) : (
                  <CheckCircle2 className="text-emerald-600 dark:text-emerald-500" size={24} />
                )}
                <h3 className={`font-bold ${isAlert ? 'text-rose-700 dark:text-rose-400' : 'text-emerald-700 dark:text-emerald-400'}`}>
                  {isAlert ? 'Attention Required' : 'On Track'}
                </h3>
              </div>
              <p className={`text-sm ${isAlert ? 'text-rose-700 dark:text-rose-400/80' : 'text-emerald-700 dark:text-emerald-400/80'}`}>
                {overallAttendance !== null
                  ? isAlert
                    ? 'Overall attendance is below the required 75%.'
                    : 'Attendance is healthy for this semester.'
                  : 'Attendance information is still being collected.'}
              </p>
            </div>
          </div>

          <div className="glass-panel rounded-3xl overflow-hidden bg-white/60 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 animate-fade-in-up shadow-sm">
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
              <h2 className="text-lg font-bold">Subject-wise Breakdown</h2>
              <Link to="/attendance/history" className="text-sm font-semibold text-primary hover:underline">
                View Historical Data
              </Link>
            </div>
            {attendanceRecords.length === 0 ? (
              <div className="p-12 text-center text-slate-400">
                <p className="text-lg font-semibold mb-1">Attendance data pending</p>
                <p className="text-sm">The teaching staff will update attendance records shortly.</p>
              </div>
            ) : (
              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-left border-collapse min-w-[700px]">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/40 text-slate-500 dark:text-slate-400 text-sm border-b border-slate-200 dark:border-slate-700/50">
                      <th className="p-4 font-semibold">Subject</th>
                      <th className="p-4 font-semibold text-center">Semester</th>
                      <th className="p-4 font-semibold text-center">Classes Total</th>
                      <th className="p-4 font-semibold text-center">Attended</th>
                      <th className="p-4 font-semibold text-right">Percentage</th>
                      <th className="p-4 font-semibold text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                    {subjectRows.map((subject) => (
                      <tr key={subject.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors">
                        <td className="p-4 font-medium text-slate-700 dark:text-slate-300">{subject.subject}</td>
                        <td className="p-4 text-center text-slate-500">{subject.semester}</td>
                        <td className="p-4 text-center">{subject.total}</td>
                        <td className="p-4 text-center font-bold">{subject.attended}</td>
                        <td className="p-4 text-right font-bold text-slate-800 dark:text-slate-100">
                          {formatPercentage(subject.percent)}
                        </td>
                        <td className="p-4 text-center">
                          <span
                            className={`inline-flex px-2.5 py-1 rounded-md text-xs font-bold ${
                              subject.status === 'OK'
                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400'
                                : 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400'
                            }`}
                          >
                            {subject.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
