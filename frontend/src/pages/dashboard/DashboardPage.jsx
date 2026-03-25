import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Bot, Send, UserCheck, Activity, GraduationCap,
  CreditCard, Bell, LineChart, Loader2,
  Phone, AlertTriangle, CheckCircle, BookOpen, Wifi, WifiOff, FileText
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts';
import { getSocket, joinStudentRoom } from '../../services/socketService';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function DashboardPage() {
  const [messages, setMessages] = useState([
    { sender: "bot", text: "Hello! Welcome to the Vignan University Parent Portal. How can I assist you today?" }
  ]);
  const [inputValue, setInputValue]   = useState('');
  const [studentData, setStudentData] = useState(null);
  const [loading, setLoading]         = useState(true);
  const [activeSection, setActiveSection] = useState('overview');
  const [socketConnected, setSocketConnected] = useState(false);
  const [newNoticeIds, setNewNoticeIds] = useState(new Set()); // track just-arrived notice IDs
  const [reportSearchQuery, setReportSearchQuery] = useState('');
  const [reportSearchResult, setReportSearchResult] = useState(null);
  const chatEndRef = useRef(null);
  const regdNoRef  = useRef(null);

  // ── Initial data load ─────────────────────────────────────────────────────
  const fetchStudent = useCallback(async (regdNo) => {
    try {
      const res  = await fetch(`${API_URL}/api/student/${regdNo}`);
      const data = await res.json();
      if (data.success) {
        setStudentData(data.data);
      }
    } catch (e) { 
      console.error('Fetch student error:', e); 
    }
    finally { 
      setLoading(false); 
    }
  }, []);

  useEffect(() => {
    // Clear any old data and start fresh
    setLoading(true);
    setStudentData(null); // Clear any existing data
    
    // Check for pattern authentication student data first
    const studentDataStr = localStorage.getItem('studentData');
    
    if (studentDataStr) {
      try {
        const student = JSON.parse(studentDataStr);
        
        // Force set the correct student data
        setStudentData(student);
        regdNoRef.current = student.registrationNumber;
        
        // Also fetch fresh data to ensure we have the latest
        fetchStudent(student.registrationNumber);
        
        setLoading(false);
        return;
      } catch (e) {
        console.error('Error parsing student data:', e);
        // Clear corrupted data
        localStorage.removeItem('studentData');
      }
    }

    // Fallback to parent_session for OTP authentication
    const session = localStorage.getItem('parent_session');
    
    if (!session) { 
      setLoading(false); 
      return; 
    }
    
    let sessionData;
    try { 
      sessionData = JSON.parse(session); 
    } catch { 
      setLoading(false); 
      return; 
    }
    
    const regdNo = sessionData?.regdNo || sessionData?.studentRegdNo;
    
    if (!regdNo) { 
      setLoading(false); 
      return; 
    }
    
    regdNoRef.current = regdNo.toString().toUpperCase();
    fetchStudent(regdNoRef.current);
  }, [fetchStudent]);

  // ── Socket.IO real-time subscription ─────────────────────────────────────
  useEffect(() => {
    const socket = getSocket();

    const onConnect = () => {
      setSocketConnected(true);
      if (regdNoRef.current) joinStudentRoom(regdNoRef.current);
    };
    const onDisconnect = () => setSocketConnected(false);

    // Marks updated — replace marks section in state
    const onMarksUpdated = (updatedStudent) => {
      setStudentData(prev => {
        if (!prev) return prev;
        // Only update specific fields, preserve core student info
        return {
          ...prev,
          subjectResults: updatedStudent.subjectResults ?? prev.subjectResults,
          cgpa: updatedStudent.cgpa ?? prev.cgpa,
          sgpa: updatedStudent.sgpa ?? prev.sgpa,
          feeDetails: updatedStudent.feeDetails ?? prev.feeDetails,
        };
      });
    };

    // Attendance updated
    const onAttendanceUpdated = (updatedStudent) => {
      setStudentData(prev => {
        if (!prev) return prev;
        // Only update attendance, preserve core student info
        return {
          ...prev,
          attendance: updatedStudent.attendance ?? prev.attendance,
        };
      });
    };

    // New notice — prepend + highlight
    const onNoticePosted = (notice) => {
      setStudentData(prev => {
        if (!prev) return prev;
        const already = (prev.notifications || []).some(n => n.id === notice.id);
        if (already) return prev;
        return { ...prev, notifications: [notice, ...(prev.notifications || [])] };
      });
      // Mark this notice as "new" so it glows
      setNewNoticeIds(prev => new Set([...prev, notice.id]));
      // Auto-switch to notices tab and dismiss glow after 8s
      setActiveSection('notices');
      setTimeout(() => setNewNoticeIds(prev => { const s = new Set(prev); s.delete(notice.id); return s; }), 8000);
    };

    socket.on('connect',            onConnect);
    socket.on('disconnect',         onDisconnect);
    socket.on('marks_updated',      onMarksUpdated);
    socket.on('attendance_updated', onAttendanceUpdated);
    socket.on('notice_posted',      onNoticePosted);

    // If already connected (reconnect scenario), re-join
    if (socket.connected) {
      setSocketConnected(true);
      if (regdNoRef.current) joinStudentRoom(regdNoRef.current);
    }

    return () => {
      socket.off('connect',            onConnect);
      socket.off('disconnect',         onDisconnect);
      socket.off('marks_updated',      onMarksUpdated);
      socket.off('attendance_updated', onAttendanceUpdated);
      socket.off('notice_posted',      onNoticePosted);
    };
  }, []);

  // Join room once we know regdNo (handles race where socket connects before fetchStudent sets regdNoRef)
  useEffect(() => {
    if (regdNoRef.current && socketConnected) {
      joinStudentRoom(regdNoRef.current);
    }
  }, [socketConnected]);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const sd           = studentData;
  const subjects     = sd?.subjectResults    || [];
  const attendance   = sd?.attendance        || [];
  const notifications = sd?.notifications   || [];
  const contacts     = sd?.contacts          || [];
  const status       = sd?.status            || {};
  const fees         = sd?.feeDetails        || {};

  const marksChartData = subjects.map(s => ({
    subject:        s.subject?.length > 12 ? s.subject.slice(0, 12) + '…' : s.subject,
    'M1 /20':       s.m1     ?? 0,
    'Pre-T1 /10':   s.pre_t1 ?? 0,
    'T4 /20':       s.t4     ?? 0,
    'T5 Avg /20':   s.t5_avg ?? 0,
  }));

  const avgAttendance  = attendance.length
    ? (attendance.reduce((a, r) => a + (r.attendance_percentage || 0), 0) / attendance.length).toFixed(1)
    : null;
  const isLowAttendance = avgAttendance && parseFloat(avgAttendance) < 75;

  const quickActions = [
    { label: "Attendance", query: "What is the overall attendance?" },
    { label: "Fees",       query: "Are there any pending fees?" },
    { label: "CGPA",       query: "What is the current CGPA?" },
    { label: "Backlogs",   query: "How many backlogs?" },
  ];

  const handleSendMessage = (text) => {
    const userText = text || inputValue;
    if (!userText.trim()) return;
    setMessages(prev => [...prev, { sender: 'user', text: userText }]);
    setInputValue('');
    setTimeout(() => {
      const q = userText.toLowerCase();
      let botResponse = "I'll check the latest data for you.";
      if (q.includes("attendance"))          botResponse = avgAttendance ? `${sd?.name}'s attendance: ${avgAttendance}%. ${isLowAttendance ? '⚠️ Below 75%!' : '✅ OK'}` : "Attendance not yet recorded.";
      else if (q.includes("fee") || q.includes("pending")) botResponse = fees.netPayableAmount ? `Net payable: ₹${fees.netPayableAmount}. Paid: ₹${fees.amountPaid || 0}.` : "Fee info not available.";
      else if (q.includes("cgpa"))           botResponse = sd?.cgpa ? `CGPA: ${sd.cgpa}, SGPA: ${sd.sgpa}` : "CGPA not available.";
      else if (q.includes("backlog"))        botResponse = `Active backlogs: ${status.active_backlogs ?? 0}.`;
      setMessages(prev => [...prev, { sender: 'bot', text: botResponse }]);
    }, 700);
  };

  const handleReportSearch = () => {
    const query = reportSearchQuery.trim();
    if (!query) {
      setReportSearchResult(null);
      return;
    }

    const numericQuery = Number(query);
    const numeric = !Number.isNaN(numericQuery);
    const allItems = subjects.map(s => ({
      subject: s.subject,
      values: [
        { label: 'M1', value: Number(s.m1) },
        { label: 'Pre-T1', value: Number(s.pre_t1) },
        { label: 'T2', value: Number(s.t2) },
        { label: 'T3', value: Number(s.t3) },
        { label: 'T4', value: Number(s.t4) },
        { label: 'T5', value: Number(s.t5_avg) },
      ].filter(v => !Number.isNaN(v.value)),
    }));

    if (numeric) {
      const exactMatches = [];
      let closest = null;

      allItems.forEach(item => {
        item.values.forEach(v => {
          const diff = Math.abs(v.value - numericQuery);
          if (v.value === numericQuery) {
            exactMatches.push({ subject: item.subject, label: v.label, value: v.value });
          }
          if (!closest || diff < closest.diff) {
            closest = { subject: item.subject, label: v.label, value: v.value, diff };
          }
        });
      });

      setReportSearchResult({ type: 'numeric', query: numericQuery, exactMatches, closest });
      return;
    }

    const textLower = query.toLowerCase();
    const subjectMatches = subjects.filter(s => s.subject?.toLowerCase().includes(textLower));
    setReportSearchResult({ type: 'text', query, subjectMatches });
  };

  const SECTIONS = ['overview', 'marks', 'attendance', 'notices', 'contacts'];

  return (
    <div className="flex flex-col gap-5 pb-8">

      {/* Student Header */}
      {!loading && studentData && (
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-2xl shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold mb-1">{studentData.name} ({studentData.registrationNumber})</h1>
              <p className="text-lg opacity-90">Vignan's University Portal</p>
              <p className="text-sm opacity-75">{studentData.branch} • {studentData.semester ? `Semester ${studentData.semester}` : ''}</p>
            </div>
            <div className="text-right">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                <UserCheck size={32} className="text-white" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Socket Status Badge */}
      <div className="flex items-center justify-between">
        <div className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full ${socketConnected ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
          {socketConnected ? <><Wifi size={12} /><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />Live</> : <><WifiOff size={12} /> Connecting…</>}
        </div>
        {notifications.some(n => newNoticeIds.has(n.id)) && (
          <div className="flex items-center gap-2 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs font-bold px-3 py-1 rounded-full animate-bounce">
            <Bell size={12} /> New notice!
          </div>
        )}
      </div>

      {/* Low Attendance Alert Banner */}
      {!loading && isLowAttendance && (
        <div className="flex items-center gap-3 px-5 py-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-2xl text-red-700 dark:text-red-400 text-sm font-semibold">
          <AlertTriangle size={18} /> Low attendance: {avgAttendance}% — below required 75%.
        </div>
      )}

      {/* New notices banner (highlights even in other section) */}
      {notifications.filter(n => newNoticeIds.has(n.id)).map(n => (
        <div key={n.id} className="flex items-start gap-3 px-5 py-3 bg-amber-400/10 border-2 border-amber-400 rounded-2xl text-amber-800 dark:text-amber-300 text-sm font-semibold animate-pulse">
          <Bell size={18} className="flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">{n.title}</p>
            <p className="font-normal text-xs mt-0.5 opacity-80">{n.message}</p>
          </div>
        </div>
      ))}

      <div className="flex flex-col lg:flex-row gap-6">

        {/* Chatbot */}
        <div className="w-full lg:w-1/2 flex flex-col h-[calc(100vh-14rem)]">
          <div className="glass-panel flex-1 rounded-3xl flex flex-col overflow-hidden bg-white/60 dark:bg-slate-900/60 shadow-xl border border-slate-200 dark:border-slate-800">
            <div className="bg-primary/5 dark:bg-primary/10 border-b border-primary/10 p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-white shadow-lg">
                <Bot size={22} />
              </div>
              <div>
                <h2 className="font-bold text-slate-800 dark:text-slate-100">AI Assistant</h2>
                <p className="text-xs text-primary font-medium flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Online
                </p>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar">
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex items-start gap-3 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}>
                  {msg.sender === 'bot' && (
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex-shrink-0 flex items-center justify-center text-primary mt-1">
                      <Bot size={16} />
                    </div>
                  )}
                  <div className={`max-w-[82%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-line ${msg.sender === 'user'
                    ? 'bg-primary text-white shadow-md rounded-tr-none'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-100 dark:border-slate-700 shadow-sm rounded-tl-none'}`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>
            <div className="px-4 py-2 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-800">
              <div className="overflow-x-auto pb-1 flex gap-2">
                {quickActions.map((a, i) => (
                  <button key={i} onClick={() => handleSendMessage(a.query)}
                    className="whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-primary hover:border-primary/30 transition-colors">
                    {a.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
              <form onSubmit={e => { e.preventDefault(); handleSendMessage(); }} className="relative flex items-center">
                <input type="text" value={inputValue} onChange={e => setInputValue(e.target.value)}
                  placeholder="Ask anything about grades, fees, schedule…"
                  className="w-full pl-4 pr-12 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-full text-sm outline-none focus:ring-2 focus:ring-primary transition-all dark:text-white" />
                <button type="submit" disabled={!inputValue.trim()}
                  className="absolute right-2 p-2.5 rounded-full bg-primary text-white disabled:opacity-40 hover:bg-primary-hover transition-colors">
                  <Send size={14} className="translate-x-[1px]" />
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Right: ERP Sections */}
        <div className="w-full lg:w-1/2 flex flex-col gap-5">

          {/* Section Nav */}
          <div className="flex gap-2 overflow-x-auto pb-1">
            {SECTIONS.map(s => (
              <button key={s} onClick={() => setActiveSection(s)}
                className={`relative px-4 py-1.5 rounded-xl text-sm font-bold whitespace-nowrap capitalize transition-all ${activeSection === s ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-white dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700 hover:bg-slate-50'}`}>
                {s}
                {/* Unread dot for notices tab */}
                {s === 'notices' && newNoticeIds.size > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 text-white text-[9px] font-black rounded-full flex items-center justify-center">
                    {newNoticeIds.size}
                  </span>
                )}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="glass-panel p-16 flex flex-col items-center justify-center rounded-3xl border border-slate-200 dark:border-slate-800">
              <Loader2 className="w-8 h-8 text-primary animate-spin mb-4" />
              <p className="text-slate-500 text-sm font-medium">Loading student data…</p>
            </div>
          ) : (
            <>
              {/* ── Overview ── */}
              {activeSection === 'overview' && (
                <div className="space-y-4">
                  <div className="glass-panel p-5 rounded-3xl bg-white/60 dark:bg-slate-900/60 shadow-lg border border-slate-200 dark:border-slate-800">
                    <h3 className="font-bold text-lg mb-1 flex items-center gap-2">
                      <Activity className="text-primary" size={20} /> Snapshot
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400 text-[9px] rounded-full uppercase tracking-wider ml-auto">LIVE</span>
                    </h3>
                    <p className="text-xs text-slate-500 mb-3">{sd?.name} ({sd?.registrationNumber}) • {sd?.branch}</p>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { label:'CGPA',      val: sd?.cgpa || '—',       color:'text-indigo-600'  },
                        { label:'SGPA',      val: sd?.sgpa || '—',       color:'text-purple-600'  },
                        { label:'Semester',  val: sd?.semester || '—',   color:'text-slate-700'   },
                        { label:'Att %',     val: avgAttendance ? `${avgAttendance}%` : 'N/A', color: isLowAttendance ? 'text-red-500' : 'text-emerald-600' },
                        { label:'Backlogs',  val: status.active_backlogs ?? '0', color: (status.active_backlogs||0) > 0 ? 'text-red-500':'text-emerald-600' },
                        { label:'Subjects',  val: subjects.length,       color:'text-slate-700'   },
                      ].map((s, i) => (
                        <div key={i} className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 text-center">
                          <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">{s.label}</p>
                          <p className={`text-xl font-black ${s.color} dark:opacity-90`}>{s.val}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Fee status */}
                  <div className="glass-panel p-5 rounded-3xl bg-gradient-to-br from-rose-50 to-orange-50 dark:from-rose-950/30 dark:to-orange-950/30 shadow-lg border border-orange-100 dark:border-orange-900/30">
                    <h3 className="font-bold mb-3 flex items-center gap-2 text-rose-800 dark:text-rose-300">
                      <CreditCard size={18} /> Financial Status
                    </h3>
                    <div className="space-y-2 text-sm">
                      {[['Total Fee',`₹ ${fees.totalTuitionFee||0}`],['Scholarship',`₹ ${fees.scholarshipApplied||0}`],['Paid',`₹ ${fees.amountPaid||0}`]].map(([l,v])=>(
                        <div key={l} className="flex justify-between">
                          <span className="text-rose-600/80 dark:text-rose-400/80">{l}:</span>
                          <span className="font-semibold">{v}</span>
                        </div>
                      ))}
                      <div className="border-t border-rose-200 dark:border-rose-800/50 pt-2 flex justify-between">
                        <span className="font-semibold text-rose-700 dark:text-rose-400">Net Payable:</span>
                        <span className="text-xl font-black text-rose-700 dark:text-rose-400">₹ {fees.netPayableAmount||0}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ── Marks ── */}
              {activeSection === 'marks' && (
                <div className="space-y-4">
                  <div className="glass-panel p-4 rounded-2xl bg-blue-50/60 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <div>
                        <p className="text-xs uppercase tracking-[0.18em] font-bold text-slate-500">Overall report search</p>
                        <p className="text-sm text-slate-600 dark:text-slate-300">Type any number (m1/t4 etc.) or subject text. Exact number matches and closest marks are recommended.</p>
                      </div>
                      <div className="flex gap-2 w-full sm:w-auto">
                        <input
                          type="text"
                          value={reportSearchQuery}
                          onChange={(e) => setReportSearchQuery(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleReportSearch())}
                          placeholder="Search number or subject..."
                          className="w-full sm:w-72 px-3 py-2 border rounded-xl bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-sm outline-none focus:ring-2 focus:ring-blue-400"
                        />
                        <button
                          onClick={handleReportSearch}
                          className="rounded-xl px-3 py-2 bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 transition"
                        >
                          Search
                        </button>
                      </div>
                    </div>
                    {reportSearchResult && (
                      <div className="mt-3 text-sm text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3">
                        {reportSearchResult.type === 'numeric' ? (
                          <>
                            <p className="font-semibold mb-1">Results for <span className="text-blue-700 dark:text-blue-300">{reportSearchResult.query}</span>:</p>
                            {reportSearchResult.exactMatches.length > 0 ? (
                              <div>
                                <p className="font-semibold text-emerald-700 dark:text-emerald-300">Exact matches:</p>
                                <ul className="list-disc list-inside ml-4">
                                  {reportSearchResult.exactMatches.map((m, idx) => (
                                    <li key={idx}>{m.subject} • {m.label} = {m.value}</li>
                                  ))}
                                </ul>
                              </div>
                            ) : (
                              <p className="text-amber-700 dark:text-amber-300">No exact numeric match found.</p>
                            )}
                            {reportSearchResult.closest ? (
                              <p className="mt-1 font-semibold">Closest: {reportSearchResult.closest.subject} ({reportSearchResult.closest.label}) = {reportSearchResult.closest.value} (Δ {reportSearchResult.closest.diff})</p>
                            ) : null}
                          </>
                        ) : (
                          <>
                            <p className="font-semibold mb-1">Text search for <span className="text-blue-700 dark:text-blue-300">{reportSearchResult.query}</span>:</p>
                            {reportSearchResult.subjectMatches.length > 0 ? (
                              <ul className="list-disc list-inside ml-4">
                                {reportSearchResult.subjectMatches.map((m, idx) => (
                                  <li key={idx}>{m.subject}</li>
                                ))}
                              </ul>
                            ) : (
                              <p className="text-amber-700 dark:text-amber-300">No subjects found.</p>
                            )}
                          </>
                        )}
                      </div>
                    )}
                  </div>
                  {subjects.length === 0 ? (
                    <div className="glass-panel p-10 rounded-3xl text-center border border-slate-200 dark:border-slate-800 text-slate-400">Marks not yet entered by admin.</div>
                  ) : (
                    <>
                      {marksChartData.some(d => d['M1 /20'] > 0 || d['T4 /20'] > 0) && (
                        <div className="glass-panel p-5 rounded-3xl bg-white/60 dark:bg-slate-900/60 shadow-lg border border-slate-200 dark:border-slate-800">
                          <h3 className="font-bold mb-4 flex items-center gap-2"><LineChart className="text-primary" size={18}/> Performance Chart</h3>
                          <ResponsiveContainer width="100%" height={230}>
                            <BarChart data={marksChartData} margin={{ top:5, right:5, left:-25, bottom:40 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0"/>
                              <XAxis dataKey="subject" tick={{ fontSize:10, fill:'#94a3b8' }} angle={-25} textAnchor="end" interval={0}/>
                              <YAxis tick={{ fontSize:10, fill:'#94a3b8' }}/>
                              <Tooltip contentStyle={{ borderRadius:'12px', fontSize:'12px' }}/>
                              <Bar dataKey="M1 /20"     fill="#6366f1" radius={[4,4,0,0]}/>
                              <Bar dataKey="Pre-T1 /10" fill="#a78bfa" radius={[4,4,0,0]}/>
                              <Bar dataKey="T4 /20"     fill="#34d399" radius={[4,4,0,0]}/>
                              <Bar dataKey="T5 Avg /20" fill="#fb923c" radius={[4,4,0,0]}/>
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      )}
                      <div className="glass-panel rounded-3xl bg-white/60 dark:bg-slate-900/60 shadow-lg border border-slate-200 dark:border-slate-800 overflow-hidden">
                        <div className="p-4 border-b border-slate-100 dark:border-slate-800">
                          <h3 className="font-bold flex items-center gap-2"><GraduationCap className="text-primary" size={18}/> Subject-wise Marks</h3>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full text-xs">
                            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase tracking-wider font-bold">
                              <tr>{['Subject','Grade','M1/20','PreT1/10','T2/5','T3/5','T4/20','T5Avg/20'].map(h=>(
                                <th key={h} className="px-3 py-3 border-b border-slate-200 dark:border-slate-700 whitespace-nowrap">{h}</th>
                              ))}</tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                              {subjects.map((s,i) => (
                                <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                  <td className="px-3 py-3 font-semibold whitespace-nowrap">{s.subject}</td>
                                  <td className="px-3 py-3">
                                    <span className={`px-2 py-0.5 rounded-lg font-bold ${s.grade==='S'||s.grade==='A'?'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400':s.grade==='F'||s.grade==='R'||s.grade==='I'?'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400':'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'}`}>
                                      {s.grade||'—'}
                                    </span>
                                  </td>
                                  {[s.m1,s.pre_t1,s.t2,s.t3,s.t4,s.t5_avg].map((v,j) => (
                                    <td key={j} className="px-3 py-3 text-center font-semibold text-slate-600 dark:text-slate-300">{v??'—'}</td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* ── Attendance ── */}
              {activeSection === 'attendance' && (
                <div className="space-y-4">
                  {avgAttendance && (
                    <div className={`p-4 rounded-2xl border text-center ${isLowAttendance?'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800':'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800'}`}>
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Overall Attendance</p>
                      <p className={`text-5xl font-black ${isLowAttendance?'text-red-500':'text-emerald-500'}`}>{avgAttendance}%</p>
                      {isLowAttendance && <p className="text-xs text-red-500 mt-1 font-semibold">⚠️ Below required 75%</p>}
                    </div>
                  )}
                  {attendance.length === 0 ? (
                    <div className="glass-panel p-10 rounded-3xl text-center border border-slate-200 dark:border-slate-800 text-slate-400">Attendance not yet entered by faculty.</div>
                  ) : (
                    <div className="glass-panel rounded-3xl bg-white/60 dark:bg-slate-900/60 shadow-lg border border-slate-200 dark:border-slate-800 overflow-hidden">
                      <div className="p-4 border-b border-slate-100 dark:border-slate-800">
                        <h3 className="font-bold flex items-center gap-2"><UserCheck className="text-emerald-500" size={18}/> Subject-wise Attendance</h3>
                      </div>
                      <div className="p-4 space-y-4">
                        {attendance.map((a, i) => {
                          const pct = a.attendance_percentage || 0;
                          const low = pct < 75;
                          return (
                            <div key={i} className="space-y-1">
                              <div className="flex justify-between text-sm">
                                <span className="font-semibold text-slate-700 dark:text-slate-200">{a.subject_name}</span>
                                <span className={`font-black ${low?'text-red-500':'text-emerald-500'}`}>{pct.toFixed(1)}%{low&&' ⚠️'}</span>
                              </div>
                              <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2">
                                <div className={`h-2 rounded-full transition-all duration-700 ${low?'bg-red-400':'bg-emerald-400'}`} style={{ width:`${Math.min(pct,100)}%` }}/>
                              </div>
                              <p className="text-xs text-slate-400">{a.attended_classes}/{a.total_classes} classes • Sem {a.semester}</p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ── Notices ── */}
              {activeSection === 'notices' && (
                <div className="space-y-3">
                  {notifications.length === 0 ? (
                    <div className="glass-panel p-10 rounded-3xl text-center border border-slate-200 dark:border-slate-800 text-slate-400">No notices at this time.</div>
                  ) : notifications.map(n => (
                    <div key={n.id}
                      className={`glass-panel p-5 rounded-2xl bg-white dark:bg-slate-900 border shadow-sm transition-all duration-500
                        ${newNoticeIds.has(n.id) ? 'border-amber-400 shadow-amber-200 dark:shadow-amber-900/30 shadow-lg ring-2 ring-amber-300/50' : 'border-slate-200 dark:border-slate-800'}`}>
                      {newNoticeIds.has(n.id) && (
                        <span className="text-[10px] font-black uppercase tracking-wider bg-amber-400 text-white px-2 py-0.5 rounded-full mb-2 inline-block">🔔 New</span>
                      )}
                      <div className="flex items-start gap-3">
                        <span className={`mt-1 w-2.5 h-2.5 rounded-full flex-shrink-0 ${n.type==='Exam'?'bg-red-500':n.type==='Alert'?'bg-orange-500':n.type==='Event'?'bg-blue-500':'bg-amber-400'}`}/>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <p className="font-bold text-slate-800 dark:text-slate-200">{n.title}</p>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500">{n.type}</span>
                          </div>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{n.message}</p>
                      {n.attachment_url && (
                        <a
                          href={n.attachment_url}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-2 inline-flex items-center gap-1 text-xs text-indigo-600 hover:underline"
                        >
                          <FileText size={14} /> {n.attachment_name || 'View attachment'}
                        </a>
                      )}
                      <p className="text-xs text-slate-400 mt-2">By {n.posted_by} • {new Date(n.created_at).toLocaleDateString('en-IN', {day:'2-digit',month:'short',year:'numeric'})}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* ── Contacts ── */}
              {activeSection === 'contacts' && (
                <div className="space-y-3">
                  {contacts.length === 0 ? (
                    <div className="glass-panel p-10 rounded-3xl text-center border border-slate-200 dark:border-slate-800 text-slate-400">No contact info available.</div>
                  ) : contacts.map(c => (
                    <div key={c.id} className="glass-panel p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
                      <p className="font-bold text-slate-800 dark:text-slate-200">{c.name}</p>
                      <p className="text-xs font-semibold text-primary mt-0.5">{c.role}</p>
                      {c.department     && <p className="text-xs text-slate-500 mt-1">Dept: {c.department}</p>}
                      {c.office_location && <p className="text-xs text-slate-500">Location: {c.office_location}</p>}
                      <div className="flex gap-4 mt-3">
                        {c.email  && <a href={`mailto:${c.email}`}  className="text-xs text-indigo-600 hover:underline font-semibold">{c.email}</a>}
                        {c.mobile && <a href={`tel:${c.mobile}`}    className="text-xs text-emerald-600 hover:underline font-semibold flex items-center gap-1"><Phone size={11}/>{c.mobile}</a>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
