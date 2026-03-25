import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Save, Loader2, GraduationCap, CreditCard, Bell,
  UserCheck, Activity, CheckCircle, AlertTriangle, Bot, Edit2, RefreshCw,
  Users, BookOpen, Wifi, WifiOff, School
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts';
import { getSocket, joinStudentRoom } from '../../services/socketService';

const API_URL  = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const SUBJECTS = ['SE', 'PADCOM', 'CNS', 'CLSA', 'QALR', 'MAD', 'MIH&IC', 'IDP-II', 'TRg'];
const GRADES   = ['S', 'A', 'B', 'C', 'D', 'E', 'F', 'I', 'R'];
const TEST_FIELDS = [
  { key: 'm1',     label: 'M1',     max: 20 },
  { key: 'pre_t1', label: 'Pre-T1', max: 10 },
  { key: 't2',     label: 'T2',     max: 5  },
  { key: 't3',     label: 'T3',     max: 5  },
  { key: 't4',     label: 'T4',     max: 20 },
  { key: 't5_1',   label: 'T5-I1',  max: 20 },
  { key: 't5_2',   label: 'T5-I2',  max: 20 },
  { key: 't5_3',   label: 'T5-I3',  max: 20 },
  { key: 't5_4',   label: 'T5-I4',  max: 20 },
];

function Toast({ msg, type, onClose }) {
  if (!msg) return null;
  return (
    <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-2xl shadow-2xl text-white font-bold text-sm ${type === 'success' ? 'bg-emerald-600' : 'bg-red-600'} animate-slide-in`}>
      {type === 'success' ? <CheckCircle size={18}/> : <AlertTriangle size={18}/>}
      {msg}
      <button onClick={onClose} className="ml-2 opacity-70 hover:opacity-100">✕</button>
    </div>
  );
}

// Small inline editable field that shows value or input on click
function InlineField({ label, value, onChange, type = 'text', step, options, suffix = '' }) {
  const [editing, setEditing] = useState(false);
  return (
    <div className="flex items-center gap-2 group">
      <span className="text-xs text-slate-400 w-24 flex-shrink-0">{label}</span>
      {editing ? (
        options ? (
          <select autoFocus value={value} onChange={e => onChange(e.target.value)} onBlur={() => setEditing(false)}
            className="flex-1 px-2 py-1 text-sm rounded-lg border border-indigo-400 bg-white dark:bg-slate-800 outline-none dark:text-white">
            {options.map(o => <option key={o}>{o}</option>)}
          </select>
        ) : (
          <input autoFocus type={type} step={step} value={value}
            onChange={e => onChange(e.target.value)}
            onBlur={() => setEditing(false)}
            className="flex-1 px-2 py-1 text-sm rounded-lg border border-indigo-400 bg-white dark:bg-slate-800 outline-none dark:text-white"/>
        )
      ) : (
        <button type="button" onClick={() => setEditing(true)}
          className="flex-1 text-left px-2 py-1 text-sm font-semibold text-slate-800 dark:text-slate-100 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/20 border border-transparent hover:border-indigo-300 transition-all group-hover:border-dashed">
          {value || <span className="text-slate-300 text-xs">click to edit</span>}
          {suffix && value ? ` ${suffix}` : ''}
          <Edit2 size={10} className="inline ml-1.5 opacity-0 group-hover:opacity-60 text-indigo-500"/>
        </button>
      )}
    </div>
  );
}

export default function StudentEditMode() {
  const { regdNo } = useParams();
  const navigate   = useNavigate();

  const [student,   setStudent]   = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [saving,    setSaving]    = useState({});
  const [toast,     setToast]     = useState({ msg: '', type: 'success' });
  const [socketOk,  setSocketOk]  = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [aiSummary, setAiSummary] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError]     = useState('');
  const [aiPrompt, setAiPrompt]   = useState('');
  const [aiGeneratedBy, setAiGeneratedBy] = useState('');
  const [aiDetails, setAiDetails] = useState({ strengths: [], weaknesses: [], attendanceAlerts: [] });

  // Editable profile state (mirrors student fields)
  const [profile, setProfile] = useState({
    cgpa:'', sgpa:'', semester:'', branch:'', counsellor:'',
    total_tuition_fee:'', scholarship_applied:'', net_payable_amount:'', amount_paid:''
  });

  // Per-subject marks editing
  const [marksEdits, setMarksEdits] = useState({}); // { SE: { m1:'', grade:'', faculty_name:'' , ...} }
  const [marksSaving, setMarksSaving] = useState({});  // { SE: bool }

  // Attendance editing
  const [attEdits,   setAttEdits]   = useState({}); // { SE: { total:'', attended:'' } }
  const [attSaving,  setAttSaving]  = useState({});

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: '' }), 3500);
  };

  const getToken = () => localStorage.getItem('admin_token') || localStorage.getItem('faculty_token');

  // ── Fetch student ─────────────────────────────────────────────────────────
  const fetchStudent = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch(`${API_URL}/api/student/${regdNo}`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      const data = await res.json();
      if (data.success && data.data) {
        const s = data.data;
        setStudent(s);
        setProfile({
          cgpa:               s.cgpa               ?? '',
          sgpa:               s.sgpa               ?? '',
          semester:           s.semester           ?? '',
          branch:             s.branch             ?? '',
          counsellor:         s.counsellor         ?? '',
          total_tuition_fee:  s.feeDetails?.totalTuitionFee   ?? '',
          scholarship_applied:s.feeDetails?.scholarshipApplied ?? '',
          net_payable_amount: s.feeDetails?.netPayableAmount   ?? '',
          amount_paid:        s.feeDetails?.amountPaid         ?? '',
        });
        // Seed marks edits from existing data
        const me = {};
        (s.subjectResults || []).forEach(sub => {
          me[sub.subject] = {
            grade:        sub.grade   || '',
            m1:           sub.m1      ?? '',
            pre_t1:       sub.pre_t1  ?? '',
            t2:           sub.t2      ?? '',
            t3:           sub.t3      ?? '',
            t4:           sub.t4      ?? '',
            t5_1:         sub.t5_1    ?? '',
            t5_2:         sub.t5_2    ?? '',
            t5_3:         sub.t5_3    ?? '',
            t5_4:         sub.t5_4    ?? '',
            faculty_name: sub.faculty_name || '',
            section:      sub.section      || '',
          };
        });
        // Add empty entries for subjects not yet in DB
        SUBJECTS.forEach(sub => {
          if (!me[sub]) me[sub] = { grade:'', m1:'', pre_t1:'', t2:'', t3:'', t4:'', t5_1:'', t5_2:'', t5_3:'', t5_4:'', faculty_name:'', section:'' };
        });
        setMarksEdits(me);
        // Seed attendance
        const ae = {};
        (s.attendance || []).forEach(a => {
          ae[a.subject_name] = { total: a.total_classes ?? 60, attended: a.attended_classes ?? '' };
        });
        SUBJECTS.forEach(sub => { if (!ae[sub]) ae[sub] = { total: 60, attended: '' }; });
        setAttEdits(ae);
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [regdNo]);

  useEffect(() => { fetchStudent(); }, [fetchStudent]);

  const fetchAiSummary = useCallback(async (customPrompt = '') => {
    setAiError('');
    setAiLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/ai/summary`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ regdNo: regdNo.toString().toUpperCase(), prompt: customPrompt || undefined })
      });
      const data = await res.json();
      if (data.success) {
        const payload = data.data || {};
        setAiSummary(payload.summary || '');
        setAiGeneratedBy(payload.generatedBy || 'heuristic');
        setAiDetails({
          strengths: payload.strengths || [],
          weaknesses: payload.weaknesses || [],
          attendanceAlerts: payload.attendanceAlerts || []
        });
      } else {
        setAiError(data.message || 'AI summary failed');
      }
    } catch (err) {
      console.error('AI summary error', err);
      setAiError('Unable to reach AI service');
    } finally {
      setAiLoading(false);
    }
  }, [regdNo]);

  // Socket live changes reflect here too
  useEffect(() => {
    const socket = getSocket();
    const onConn    = () => { setSocketOk(true); joinStudentRoom(regdNo); };
    const onDisconn = () => setSocketOk(false);
    const onMarks   = (u) => setStudent(p => p ? { ...p, subjectResults: u.subjectResults ?? p.subjectResults } : p);
    const onAtt     = (u) => setStudent(p => p ? { ...p, attendance: u.attendance ?? p.attendance } : p);
    const onProf    = (u) => setStudent(p => p ? { ...p, ...u } : p);
    const onFees    = (u) => setStudent(p => p ? { ...p, feeDetails: u.feeDetails ?? p.feeDetails } : p);
    socket.on('connect',            onConn);
    socket.on('disconnect',         onDisconn);
    socket.on('marks_updated',      onMarks);
    socket.on('attendance_updated', onAtt);
    socket.on('profile_updated',    onProf);
    socket.on('fees_updated',       onFees);
    if (socket.connected) { setSocketOk(true); joinStudentRoom(regdNo); }
    return () => { socket.off('connect',onConn); socket.off('disconnect',onDisconn); socket.off('marks_updated',onMarks); socket.off('attendance_updated',onAtt); socket.off('profile_updated',onProf); socket.off('fees_updated',onFees); };
  }, [regdNo]);

  useEffect(() => { if (student) fetchAiSummary(); }, [student, fetchAiSummary]);

  // ── Save profile (CGPA, Fees, etc.) ──────────────────────────────────────
  const handleAiPromptSubmit = (event) => {
    event.preventDefault();
    const prompt = aiPrompt.trim();
    if (!prompt) return;
    fetchAiSummary(prompt);
  };

  const saveProfile = async () => {
    setSaving(p => ({ ...p, profile: true }));
    try {
      const payload = {
        cgpa: profile.cgpa, sgpa: profile.sgpa,
        semester: profile.semester, branch: profile.branch, counsellor: profile.counsellor,
        total_tuition_fee:   parseFloat(profile.total_tuition_fee)   || undefined,
        scholarship_applied: parseFloat(profile.scholarship_applied) || undefined,
        net_payable_amount:  parseFloat(profile.net_payable_amount)  || undefined,
        amount_paid:         parseFloat(profile.amount_paid)         || undefined,
      };
      Object.keys(payload).forEach(k => payload[k] === undefined && delete payload[k]);
      const res  = await fetch(`${API_URL}/api/admin/students/${regdNo}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) { showToast('✅ Profile saved & pushed live!'); fetchStudent(); }
      else showToast(data.message || 'Save failed', 'error');
    } catch { showToast('Server error', 'error'); }
    finally { setSaving(p => ({ ...p, profile: false })); }
  };

  // ── Save marks for one subject ────────────────────────────────────────────
  const saveMarks = async (subjectName) => {
    const m = marksEdits[subjectName];
    if (!m) return;
    setMarksSaving(p => ({ ...p, [subjectName]: true }));
    try {
      const payload = {
        subject_name: subjectName,
        grade:        m.grade   || undefined,
        m1:           m.m1     !== '' ? parseFloat(m.m1)     : undefined,
        pre_t1:       m.pre_t1 !== '' ? parseFloat(m.pre_t1) : undefined,
        t2:           m.t2     !== '' ? parseFloat(m.t2)     : undefined,
        t3:           m.t3     !== '' ? parseFloat(m.t3)     : undefined,
        t4:           m.t4     !== '' ? parseFloat(m.t4)     : undefined,
        t5_1:         m.t5_1   !== '' ? parseFloat(m.t5_1)   : undefined,
        t5_2:         m.t5_2   !== '' ? parseFloat(m.t5_2)   : undefined,
        t5_3:         m.t5_3   !== '' ? parseFloat(m.t5_3)   : undefined,
        t5_4:         m.t5_4   !== '' ? parseFloat(m.t5_4)   : undefined,
        faculty_name: m.faculty_name || undefined,
        section:      m.section      || undefined,
      };
      Object.keys(payload).forEach(k => payload[k] === undefined && delete payload[k]);
      const res  = await fetch(`${API_URL}/api/admin/students/${regdNo}/marks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) { showToast(`✅ ${subjectName} marks saved!`); fetchStudent(); }
      else showToast(data.message || 'Failed', 'error');
    } catch { showToast('Server error', 'error'); }
    finally { setMarksSaving(p => ({ ...p, [subjectName]: false })); }
  };

  // ── Save attendance ───────────────────────────────────────────────────────
  const saveAtt = async (subjectName) => {
    const a = attEdits[subjectName];
    if (!a || !a.attended) return;
    setAttSaving(p => ({ ...p, [subjectName]: true }));
    try {
      const res  = await fetch(`${API_URL}/api/admin/students/${regdNo}/attendance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ semester: parseInt(profile.semester) || 4, subjectName, totalClasses: parseInt(a.total), attendedClasses: parseInt(a.attended) })
      });
      const data = await res.json();
      if (data.success) { showToast(`✅ ${subjectName} attendance saved!`); fetchStudent(); }
      else showToast(data.message || 'Failed', 'error');
    } catch { showToast('Server error', 'error'); }
    finally { setAttSaving(p => ({ ...p, [subjectName]: false })); }
  };

  const sd       = student;
  const subjects = sd?.subjectResults || [];
  const attendance = sd?.attendance  || [];
  const notifications = sd?.notifications || [];
  const fees     = sd?.feeDetails   || {};

  const avgAtt  = attendance.length
    ? (attendance.reduce((a,r) => a + (r.attendance_percentage||0), 0) / attendance.length).toFixed(1)
    : null;

  const chartData = subjects.map(s => ({
    subject: s.subject?.length > 9 ? s.subject.slice(0, 9)+'…' : s.subject,
    M1: s.m1 ?? 0, T4: s.t4 ?? 0, T5: s.t5_avg ?? 0
  }));

  const TABS = ['overview','marks','attendance','notices','finance'];

  const tabBtn = (t) => (
    <button key={t} onClick={() => setActiveTab(t)}
      className={`px-5 py-2 rounded-xl font-bold text-sm capitalize whitespace-nowrap transition-all ${activeTab === t ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 dark:shadow-indigo-900' : 'bg-white dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700 hover:border-indigo-400'}`}>
      {t}
    </button>
  );

  const ic = "w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition dark:text-white";
  const label = (txt) => <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">{txt}</label>;

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
      <Loader2 className="w-10 h-10 text-indigo-500 animate-spin"/>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-12">
      <Toast msg={toast.msg} type={toast.type} onClose={() => setToast({ msg:'' })}/>

      {/* Top bar */}
      <div className="sticky top-0 z-30 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex items-center gap-4">
        <button onClick={() => navigate('/admin/students')} className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
          <ArrowLeft size={18}/>
        </button>
        <div className="flex-1 min-w-0">
          <p className="font-black text-lg text-slate-900 dark:text-white truncate">{sd?.name || regdNo}</p>
          <p className="text-xs text-slate-500 font-mono">{regdNo} • {sd?.branch} • Sem {sd?.semester} • CGPA {sd?.cgpa}</p>
        </div>
        <div className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full ${socketOk ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700' : 'bg-slate-100 text-slate-400'}`}>
          {socketOk ? <><Wifi size={11}/><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"/>Live</> : <WifiOff size={11}/>}
        </div>
        <button onClick={fetchStudent} className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 transition-colors" title="Refresh">
          <RefreshCw size={16}/>
        </button>
      </div>

      <div className="max-w-6xl mx-auto px-4 lg:px-8 mt-6 space-y-6">

        {/* Section tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {TABS.map(tabBtn)}
        </div>

        {/* ── OVERVIEW (mirrors parent dashboard overview) ── */}
        {activeTab === 'overview' && (
          <>
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wider text-slate-400">AI Summary</p>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Bot className="text-indigo-500" size={20}/> Groq Insights
                  </h3>
                </div>
                <span className="text-[11px] text-slate-500">Source: {aiGeneratedBy || 'heuristic'}</span>
              </div>
              {aiLoading ? (
                <div className="flex items-center gap-2 text-sm text-indigo-600">
                  <Loader2 className="animate-spin" size={16}/>
                  Fetching summary…
                </div>
              ) : aiError ? (
                <p className="text-sm text-rose-500">{aiError}</p>
              ) : (
                <p className="text-sm text-slate-700 dark:text-slate-200">
                  {aiSummary || 'AI is ready — ask a question to generate a custom summary.'}
                </p>
              )}
              <form onSubmit={handleAiPromptSubmit} className="space-y-2">
                <textarea
                  rows="2"
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="Ask: highlight areas to grade up, attendance concerns, or placement readiness."
                  className="w-full text-sm px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-2xl bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none"
                />
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={aiLoading}
                    onClick={() => fetchAiSummary()}
                    className="px-4 py-2 text-sm border border-slate-200 rounded-2xl text-slate-600 hover:border-indigo-500 hover:text-indigo-600"
                  >
                    Refresh summary
                  </button>
                  <button
                    type="submit"
                    disabled={aiLoading || !aiPrompt.trim()}
                    className="px-4 py-2 text-sm rounded-2xl bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-60"
                  >
                    Ask AI
                  </button>
                </div>
              </form>
              <div className="grid md:grid-cols-3 gap-3 text-[11px] text-slate-500">
                {aiDetails.strengths.length > 0 && (
                  <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-3 text-emerald-700">
                    <p className="text-xs font-semibold">Strengths</p>
                    {aiDetails.strengths.map(item => (
                      <p key={item.subject}>{item.subject} — {item.avgScore ?? 'N/A'}%</p>
                    ))}
                  </div>
                )}
                {aiDetails.weaknesses.length > 0 && (
                  <div className="rounded-2xl border border-rose-100 bg-rose-50 p-3 text-rose-700">
                    <p className="text-xs font-semibold">Weaknesses</p>
                    {aiDetails.weaknesses.map(item => (
                      <p key={item.subject}>{item.subject} — {item.avgScore ?? 'N/A'}%</p>
                    ))}
                  </div>
                )}
                {aiDetails.attendanceAlerts.length > 0 && (
                  <div className="rounded-2xl border border-amber-100 bg-amber-50 p-3 text-amber-700">
                    <p className="text-xs font-semibold">Attendance Alerts</p>
                    <ul className="list-disc list-inside">
                      {aiDetails.attendanceAlerts.map(alert => (
                        <li key={`${alert.subject}-${alert.percent}`}>
                          {alert.subject}: {alert.attended}/{alert.total} ({alert.percent}%)
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
            {/* Left: editable profile card */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-lg border border-slate-200 dark:border-slate-800 p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <Activity className="text-indigo-500" size={20}/> Student Snapshot
                </h3>
                <span className="px-2 py-0.5 bg-indigo-100 text-indigo-600 text-[9px] rounded-full font-black uppercase tracking-wider">✏️ Editable</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label:'CGPA',         key:'cgpa',      type:'number', step:'0.01', suffix:'/10' },
                  { label:'SGPA',         key:'sgpa',      type:'number', step:'0.01', suffix:'/10' },
                  { label:'Semester',     key:'semester',  type:'number', step:'1'                  },
                  { label:'Branch',       key:'branch',    type:'text'                              },
                  { label:'Counsellor',   key:'counsellor',type:'text'                              },
                ].map(({ label:lbl, key, type, step, suffix }) => (
                  <div key={key} className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800">
                    {label(lbl)}
                    <InlineField label="" value={profile[key]} onChange={v => setProfile(p=>({...p,[key]:v}))} type={type} step={step} suffix={suffix}/>
                  </div>
                ))}
              </div>
              <button onClick={saveProfile} disabled={saving.profile}
                className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold hover:opacity-90 disabled:opacity-60 shadow-lg">
                {saving.profile ? <Loader2 size={16} className="animate-spin"/> : <Save size={16}/>} Save Profile → Push Live
              </button>
            </div>

            {/* Right: stats + mini chart */}
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label:'Attendance',  val: avgAtt ? `${avgAtt}%` : 'N/A', color: avgAtt && parseFloat(avgAtt)<75 ? 'text-red-500':'text-emerald-600' },
                  { label:'Subjects',    val: subjects.length,            color:'text-indigo-600' },
                  { label:'Notices',     val: notifications.length,       color:'text-amber-600'  },
                ].map((s,i) => (
                  <div key={i} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 text-center shadow-sm">
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">{s.label}</p>
                    <p className={`text-2xl font-black ${s.color}`}>{s.val}</p>
                  </div>
                ))}
              </div>
              {chartData.length > 0 && (
                <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
                  <p className="font-bold text-sm mb-3 text-slate-700 dark:text-slate-200">Marks Overview</p>
                  <ResponsiveContainer width="100%" height={170}>
                    <BarChart data={chartData} margin={{ top:0, right:5, left:-25, bottom:30 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0"/>
                      <XAxis dataKey="subject" tick={{ fontSize:9, fill:'#94a3b8' }} angle={-30} textAnchor="end" interval={0}/>
                      <YAxis tick={{ fontSize:9, fill:'#94a3b8' }}/>
                      <Tooltip contentStyle={{ borderRadius:'10px', fontSize:'11px' }}/>
                      <Bar dataKey="M1"  fill="#6366f1" radius={[3,3,0,0]}/>
                      <Bar dataKey="T4"  fill="#34d399" radius={[3,3,0,0]}/>
                      <Bar dataKey="T5"  fill="#fb923c" radius={[3,3,0,0]}/>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>
        </>)}

        {/* ── MARKS (editable rows per subject) ── */}
        {activeTab === 'marks' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <GraduationCap className="text-indigo-500" size={20}/>
              <h3 className="font-bold text-lg">Subject-wise Marks</h3>
              <span className="px-2 py-0.5 bg-indigo-100 text-indigo-600 text-[9px] rounded-full font-black uppercase">✏️ Click any cell to edit</span>
            </div>
            {SUBJECTS.map(sub => {
              const m   = marksEdits[sub] || {};
              const cur = subjects.find(s => s.subject === sub);
              const setM = (key, val) => setMarksEdits(p => ({ ...p, [sub]: { ...p[sub], [key]: val } }));
              return (
                <div key={sub} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-black text-slate-800 dark:text-white text-base flex items-center gap-2">
                      <BookOpen size={16} className="text-indigo-500"/> {sub}
                      {cur?.grade && <span className={`text-xs px-2 py-0.5 rounded-lg font-bold ${cur.grade==='S'||cur.grade==='A'?'bg-emerald-100 text-emerald-700':'bg-slate-100 text-slate-600'}`}>{cur.grade}</span>}
                    </h4>
                    <button onClick={() => saveMarks(sub)} disabled={marksSaving[sub]}
                      className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold text-xs hover:bg-indigo-700 disabled:opacity-60 transition-all shadow-sm">
                      {marksSaving[sub] ? <Loader2 size={13} className="animate-spin"/> : <Save size={13}/>} Save & Push
                    </button>
                  </div>

                  {/* Faculty name + Section + Grade on one row */}
                  <div className="grid grid-cols-3 gap-3 mb-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                    <div>
                      {label('Faculty Name')}
                      <input type="text" value={m.faculty_name || ''} onChange={e => setM('faculty_name', e.target.value)}
                        placeholder="e.g. Dr. K. Rao" className={ic}/>
                    </div>
                    <div>
                      {label('Section')}
                      <input type="text" value={m.section || ''} onChange={e => setM('section', e.target.value)}
                        placeholder="e.g. A1, B2" className={ic}/>
                    </div>
                    <div>
                      {label('Grade')}
                      <select value={m.grade || ''} onChange={e => setM('grade', e.target.value)} className={ic}>
                        <option value="">— Grade —</option>
                        {GRADES.map(g => <option key={g}>{g}</option>)}
                      </select>
                    </div>
                  </div>

                  {/* Marks grid */}
                  <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-2">
                    {TEST_FIELDS.map(({ key, label:lbl, max }) => (
                      <div key={key} className="text-center">
                        <p className="text-[10px] font-bold text-slate-400 mb-1">{lbl}<br/><span className="text-[9px] font-normal">/{max}</span></p>
                        <input type="number" min="0" max={max} step="0.5"
                          value={m[key] !== undefined ? m[key] : ''}
                          onChange={e => setM(key, e.target.value)}
                          placeholder="—"
                          className="w-full text-center px-1 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white"/>
                      </div>
                    ))}
                  </div>
                  {/* current DB values */}
                  {cur && (
                    <p className="text-[10px] text-slate-400 mt-2">
                      DB: M1={cur.m1??'—'} PreT1={cur.pre_t1??'—'} T2={cur.t2??'—'} T3={cur.t3??'—'} T4={cur.t4??'—'} T5avg={cur.t5_avg??'—'}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ── ATTENDANCE ── */}
        {activeTab === 'attendance' && (
          <div className="space-y-4">
            <h3 className="font-bold text-lg flex items-center gap-2">
              <UserCheck className="text-emerald-500" size={20}/> Subject-wise Attendance
              {avgAtt && <span className={`ml-2 px-3 py-1 rounded-full text-sm font-black ${parseFloat(avgAtt)<75?'bg-red-100 text-red-600':'bg-emerald-100 text-emerald-700'}`}>Avg {avgAtt}%</span>}
            </h3>
            {SUBJECTS.map(sub => {
              const ae    = attEdits[sub]  || { total:60, attended:'' };
              const exist = attendance.find(a => a.subject_name === sub);
              const pct   = ae.total && ae.attended ? ((parseInt(ae.attended)/parseInt(ae.total))*100).toFixed(1) : null;
              const setA  = (key, val) => setAttEdits(p => ({ ...p, [sub]: { ...p[sub], [key]: val } }));
              return (
                <div key={sub} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-4 flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="min-w-[80px] font-black text-slate-800 dark:text-white">{sub}</div>
                  {exist && (
                    <div className="flex-1">
                      <div className="flex justify-between text-xs mb-1 text-slate-500">
                        <span>Current: {exist.attendance_percentage?.toFixed(1)}%</span>
                        <span>{exist.attended_classes}/{exist.total_classes}</span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5">
                        <div className={`h-1.5 rounded-full ${(exist.attendance_percentage||0)<75?'bg-red-400':'bg-emerald-400'}`} style={{ width:`${Math.min(exist.attendance_percentage||0,100)}%`}}/>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <input type="number" min="1" value={ae.total} onChange={e=>setA('total',e.target.value)}
                      className="w-20 text-center px-2 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white" placeholder="Total"/>
                    <span className="text-slate-400">/</span>
                    <input type="number" min="0" value={ae.attended} onChange={e=>setA('attended',e.target.value)}
                      className="w-20 text-center px-2 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white" placeholder="Attended"/>
                    {pct && <span className={`text-sm font-black ${parseFloat(pct)<75?'text-red-500':'text-emerald-500'}`}>{pct}%</span>}
                    <button onClick={() => saveAtt(sub)} disabled={attSaving[sub]||!ae.attended}
                      className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 text-white rounded-xl font-bold text-xs hover:bg-emerald-700 disabled:opacity-40 transition-all">
                      {attSaving[sub] ? <Loader2 size={12} className="animate-spin"/> : <Save size={12}/>} Save
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── NOTICES ── */}
        {activeTab === 'notices' && (
          <div className="space-y-3">
            <h3 className="font-bold text-lg flex items-center gap-2"><Bell className="text-amber-500" size={20}/> Notices for {sd?.name}</h3>
            {notifications.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 text-center text-slate-400 border border-slate-200 dark:border-slate-800">No notices yet.</div>
            ) : notifications.map(n => (
              <div key={n.id} className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex items-start gap-3">
                <span className={`mt-1 w-2.5 h-2.5 rounded-full flex-shrink-0 ${n.type==='Exam'?'bg-red-500':n.type==='Alert'?'bg-orange-500':'bg-amber-400'}`}/>
                <div>
                  <p className="font-bold">{n.title} <span className="text-xs bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full ml-1">{n.type}</span></p>
                  <p className="text-sm text-slate-500 mt-1">{n.message}</p>
                  <p className="text-xs text-slate-400 mt-1.5">By {n.posted_by} • {new Date(n.created_at).toLocaleDateString('en-IN')}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── FINANCE ── */}
        {activeTab === 'finance' && (
          <div className="max-w-lg space-y-5">
            <h3 className="font-bold text-lg flex items-center gap-2"><CreditCard className="text-rose-500" size={20}/> Fee Management</h3>
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 shadow-sm">
              {[
                ['total_tuition_fee',   'Total Tuition Fee (₹)'],
                ['scholarship_applied', 'Scholarship Applied (₹)'],
                ['net_payable_amount',  'Net Payable (₹)'],
                ['amount_paid',         'Amount Paid (₹)'],
              ].map(([key, lbl]) => (
                <div key={key}>
                  {label(lbl)}
                  <input type="number" min="0" step="0.01" value={profile[key]}
                    onChange={e => setProfile(p => ({...p,[key]:e.target.value}))}
                    placeholder="₹ 0" className={ic}/>
                </div>
              ))}

              {/* Visual summary */}
              {(parseFloat(profile.total_tuition_fee)||0) > 0 && (
                <div className="space-y-2 pt-3 border-t border-slate-100 dark:border-slate-800 text-sm">
                  {[
                    ['Net Payable',      `₹ ${(parseFloat(profile.net_payable_amount)||0).toLocaleString('en-IN')}`, 'text-slate-700 dark:text-slate-200'],
                    ['Paid',             `₹ ${(parseFloat(profile.amount_paid)||0).toLocaleString('en-IN')}`,        'text-emerald-600'],
                    ['Outstanding',      `₹ ${Math.max(0,(parseFloat(profile.net_payable_amount)||0)-(parseFloat(profile.amount_paid)||0)).toLocaleString('en-IN')}`, 'text-rose-600 font-black text-lg'],
                    ['Scholarship',      `₹ ${(parseFloat(profile.scholarship_applied)||0).toLocaleString('en-IN')}`, 'text-teal-600'],
                  ].map(([l,v,c]) => (
                    <div key={l} className="flex justify-between">
                      <span className="text-slate-500">{l}</span>
                      <span className={c}>{v}</span>
                    </div>
                  ))}
                </div>
              )}

              <button onClick={saveProfile} disabled={saving.profile}
                className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-rose-500 to-orange-500 text-white rounded-xl font-bold hover:opacity-90 disabled:opacity-60 shadow-lg">
                {saving.profile ? <Loader2 size={16} className="animate-spin"/> : <Save size={16}/>} Save Fees → Push Live
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
