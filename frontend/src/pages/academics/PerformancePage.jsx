import React, { useState, useEffect } from 'react';
import { Award, ChevronDown, Loader2, Wifi, WifiOff } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend
} from 'recharts';
import { getSocket, joinStudentRoom } from '../../services/socketService';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function PerformancePage() {
  const [studentData, setStudentData] = useState(null);
  const [loading, setLoading]         = useState(true);
  const [socketConnected, setSocketConnected] = useState(false);

  const getRegdNo = () => {
    try {
      const s = JSON.parse(localStorage.getItem('parent_session') || '{}');
      return (s.regdNo || s.studentRegdNo || '').toString().toUpperCase();
    } catch { return ''; }
  };

  const fetchStudent = async (regdNo) => {
    if (!regdNo) { setLoading(false); return; }
    try {
      const res  = await fetch(`${API_URL}/api/student/${regdNo}`);
      const data = await res.json();
      if (data.success && data.data) setStudentData(data.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    const regdNo = getRegdNo();
    fetchStudent(regdNo);

    // Socket for live updates
    const socket = getSocket();
    const onConnect    = () => { setSocketConnected(true); if (regdNo) joinStudentRoom(regdNo); };
    const onDisconnect = () => setSocketConnected(false);
    const onMarks      = (updated) => setStudentData(prev => prev ? { ...prev, subjectResults: updated.subjectResults ?? prev.subjectResults, cgpa: updated.cgpa ?? prev.cgpa, sgpa: updated.sgpa ?? prev.sgpa } : updated);
    const onProfile    = (updated) => setStudentData(prev => prev ? { ...prev, ...updated } : updated);

    socket.on('connect',         onConnect);
    socket.on('disconnect',      onDisconnect);
    socket.on('marks_updated',   onMarks);
    socket.on('profile_updated', onProfile);
    if (socket.connected) { setSocketConnected(true); if (regdNo) joinStudentRoom(regdNo); }

    return () => {
      socket.off('connect',         onConnect);
      socket.off('disconnect',      onDisconnect);
      socket.off('marks_updated',   onMarks);
      socket.off('profile_updated', onProfile);
    };
  }, []);

  const sd       = studentData;
  const subjects = sd?.subjectResults || [];

  // Build chart data from DB marks
  const chartData = subjects.map(s => ({
    subject:       s.subject?.length > 10 ? s.subject.slice(0, 10) + '…' : (s.subject || ''),
    'M1 /20':      s.m1      ?? 0,
    'Pre-T1 /10':  s.pre_t1  ?? 0,
    'T2 /5':       s.t2      ?? 0,
    'T3 /5':       s.t3      ?? 0,
    'T4 /20':      s.t4      ?? 0,
    'T5 Avg /20':  s.t5_avg  ?? 0,
  }));

  const gcol = (v, grade) => {
    if (!v && !grade) return 'text-slate-400';
    if (grade === 'S' || grade === 'A') return 'text-emerald-600 dark:text-emerald-400 font-black';
    if (grade === 'F' || grade === 'R' || grade === 'I') return 'text-red-500 font-black';
    return 'text-slate-700 dark:text-slate-200 font-semibold';
  };

  const cell = (v) => {
    if (v === null || v === undefined) return <span className="text-slate-300 dark:text-slate-600">—</span>;
    const n = parseFloat(v);
    return <span className={n < 7 ? 'text-amber-600 font-semibold' : 'text-slate-800 dark:text-slate-200 font-semibold'}>{v}</span>;
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold flex items-center gap-2 mb-1">
            <Award className="text-primary" /> Academic Performance
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Subject-wise marks tracked live from the database.</p>
        </div>
        <div className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full ${socketConnected ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
          {socketConnected ? <><Wifi size={12} /><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"/>Live</> : <><WifiOff size={12}/> Syncing...</>}
        </div>
      </div>

      {loading ? (
        <div className="glass-panel p-16 flex flex-col items-center justify-center rounded-3xl min-h-[400px] border border-slate-200 dark:border-slate-800">
          <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
          <p className="text-slate-500 font-medium">Loading marks from database…</p>
        </div>
      ) : (
        <>
          {/* CGPA + SGPA Summary */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'CGPA', value: sd?.cgpa || '—', color: 'from-indigo-600 to-purple-600' },
              { label: 'SGPA', value: sd?.sgpa || '—', color: 'from-purple-500 to-pink-500' },
              { label: 'Branch', value: sd?.branch || '—', color: 'from-slate-600 to-slate-700' },
              { label: 'Semester', value: sd?.semester ?? '—', color: 'from-emerald-500 to-teal-500' },
            ].map((item, i) => (
              <div key={i} className={`bg-gradient-to-br ${item.color} text-white rounded-2xl p-5 shadow-lg`}>
                <p className="text-xs font-semibold opacity-75 uppercase tracking-wider mb-1">{item.label}</p>
                <p className="text-4xl font-black">{item.value}</p>
              </div>
            ))}
          </div>

          {/* Bar chart */}
          {chartData.length > 0 && chartData.some(d => d['M1 /20'] > 0 || d['T4 /20'] > 0) && (
            <div className="glass-panel p-6 rounded-3xl bg-white/60 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 shadow-lg">
              <h2 className="text-lg font-bold mb-5 flex items-center gap-2">
                Subject-wise Marks Chart
                <span className="px-2 py-0.5 bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400 text-[10px] rounded-full uppercase tracking-wider font-bold">LIVE</span>
              </h2>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={chartData} margin={{ top: 5, right: 10, left: -15, bottom: 50 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="subject" tick={{ fontSize: 11, fill: '#94a3b8' }} angle={-30} textAnchor="end" interval={0} />
                  <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} />
                  <Tooltip contentStyle={{ borderRadius: '12px', fontSize: '12px' }} />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                  <Bar dataKey="M1 /20"     fill="#6366f1" radius={[4,4,0,0]} />
                  <Bar dataKey="Pre-T1 /10" fill="#a78bfa" radius={[4,4,0,0]} />
                  <Bar dataKey="T4 /20"     fill="#34d399" radius={[4,4,0,0]} />
                  <Bar dataKey="T5 Avg /20" fill="#fb923c" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Detailed Table — same structure the admin enters */}
          <div className="glass-panel rounded-3xl overflow-hidden bg-white/60 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 shadow-lg">
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold flex items-center gap-2">
                  Granular Assessment Tracking
                  <span className="px-2 py-0.5 bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400 text-[10px] rounded-full uppercase tracking-wider font-bold">LIVE API</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">Student: <span className="font-semibold text-slate-700 dark:text-slate-300">{sd?.name || '—'}</span> • {sd?.registrationNumber}</p>
              </div>
            </div>

            {subjects.length === 0 ? (
              <div className="p-16 text-center text-slate-400">
                <p className="text-lg font-semibold mb-1">No marks entered yet</p>
                <p className="text-sm">The admin will update marks — they'll appear here instantly.</p>
              </div>
            ) : (
              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-left border-collapse min-w-[900px]">
                  <thead>
                    <tr className="bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 text-xs border-b border-slate-300 dark:border-slate-700">
                      <th className="p-3 font-bold border-r border-slate-300 dark:border-slate-700 bg-slate-200/50 dark:bg-slate-900/50 sticky left-0 z-10" rowSpan={2}>Subject</th>
                      <th className="p-2 font-bold text-center border-r border-slate-300 dark:border-slate-700" rowSpan={2}>Grade</th>
                      <th className="p-2 font-bold text-center border-r border-slate-300 dark:border-slate-700" rowSpan={2}>M1<br/><span className="font-normal text-[10px] opacity-60">/20</span></th>
                      <th className="p-2 font-bold text-center border-r border-slate-300 dark:border-slate-700" rowSpan={2}>Pre-T1<br/><span className="font-normal text-[10px] opacity-60">/10</span></th>
                      <th className="p-2 font-bold text-center border-r border-slate-300 dark:border-slate-700" rowSpan={2}>T2<br/><span className="font-normal text-[10px] opacity-60">/5</span></th>
                      <th className="p-2 font-bold text-center border-r border-slate-300 dark:border-slate-700" rowSpan={2}>T3<br/><span className="font-normal text-[10px] opacity-60">/5</span></th>
                      <th className="p-2 font-bold text-center border-r border-slate-300 dark:border-slate-700" rowSpan={2}>T4<br/><span className="font-normal text-[10px] opacity-60">/20</span></th>
                      <th className="p-2 font-bold text-center border-r border-slate-300 dark:border-slate-700" colSpan={4}>T5 Internals (/20 each)</th>
                      <th className="p-2 font-bold text-center border-r border-slate-300 dark:border-slate-700" rowSpan={2}>T5 Avg<br/><span className="font-normal text-[10px] opacity-60">/20</span></th>
                    </tr>
                    <tr className="bg-slate-50 dark:bg-slate-800/40 text-slate-500 text-[11px] border-b border-slate-300 dark:border-slate-700">
                      <th className="p-2 text-center border-r border-slate-200 dark:border-slate-700/50">I-1</th>
                      <th className="p-2 text-center border-r border-slate-200 dark:border-slate-700/50">I-2</th>
                      <th className="p-2 text-center border-r border-slate-200 dark:border-slate-700/50">I-3</th>
                      <th className="p-2 text-center border-r border-slate-300 dark:border-slate-700">I-4</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-sm">
                    {subjects.map((s, idx) => (
                      <tr key={idx} className="hover:bg-primary/5 dark:hover:bg-primary/10 transition-colors">
                        <td className="p-3 font-bold text-slate-800 dark:text-slate-200 border-r border-slate-300 dark:border-slate-700 bg-white/90 dark:bg-slate-900/90 sticky left-0 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.08)] z-10">
                          {s.subject}
                        </td>
                        <td className="p-3 text-center border-r border-slate-200 dark:border-slate-700">
                          <span className={`px-2 py-0.5 rounded-lg text-xs ${gcol(s.grade, s.grade)}`}>{s.grade || '—'}</span>
                        </td>
                        {[s.m1, s.pre_t1, s.t2, s.t3, s.t4].map((v, j) => (
                          <td key={j} className="p-3 text-center border-r border-slate-200 dark:border-slate-700">{cell(v)}</td>
                        ))}
                        {[s.t5_1, s.t5_2, s.t5_3, s.t5_4].map((v, j) => (
                          <td key={j} className="p-3 text-center border-r border-slate-200 dark:border-slate-700">{cell(v)}</td>
                        ))}
                        <td className="p-3 text-center border-r border-slate-200 dark:border-slate-700">
                          <span className="font-black text-indigo-600 dark:text-indigo-400">{s.t5_avg ?? '—'}</span>
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
