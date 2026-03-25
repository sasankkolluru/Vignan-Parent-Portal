import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Search, Edit, Users, Loader2, LogOut, Bell, BarChart2,
  PlusCircle, BookOpen, Activity, AlertTriangle, X, CheckCircle,
  Zap, UserCheck, Save, TableProperties, GraduationCap, School, Wifi, WifiOff
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts';
import SearchableDropdown from '../../components/SearchableDropdown';
import { getSocket } from '../../services/socketService';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const SUBJECTS = ['SE', 'PADCOM', 'CNS', 'CLSA', 'QALR', 'MAD', 'MIH&IC', 'IDP-II', 'TRg'];
const TEST_FIELDS = [
  { key: 'm1',     label: 'M1 (out of 20)',     max: 20 },
  { key: 'pre_t1', label: 'Pre-T1 (out of 10)', max: 10 },
  { key: 't2',     label: 'T2 (out of 5)',       max: 5  },
  { key: 't3',     label: 'T3 (out of 5)',       max: 5  },
  { key: 't4',     label: 'T4 (out of 20)',      max: 20 },
  { key: 't5_1',   label: 'T5 Internal-1 (/20)', max: 20 },
  { key: 't5_2',   label: 'T5 Internal-2 (/20)', max: 20 },
  { key: 't5_3',   label: 'T5 Internal-3 (/20)', max: 20 },
  { key: 't5_4',   label: 'T5 Internal-4 (/20)', max: 20 },
  { key: 'grade',  label: 'Grade (S/A/B/C/D/E/F/I/R)', max: null },
];
const GRADES = ['S', 'A', 'B', 'C', 'D', 'E', 'F', 'I', 'R'];
const TABS = ['Students', 'Noticeboard', 'Enter Marks', 'Attendance', 'Auto-Generate', 'Student Profile'];

function Toast({ msg, type, onClose }) {
  if (!msg) return null;
  return (
    <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-2xl shadow-xl text-white font-semibold text-sm ${type === 'success' ? 'bg-emerald-600' : 'bg-red-600'}`}>
      {type === 'success' ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}
      {msg}
      <button onClick={onClose} className="ml-2 opacity-70 hover:opacity-100"><X size={14} /></button>
    </div>
  );
}

export default function AdminDashboard({ onAdminLogout }) {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('Students');
  const [toast, setToast] = useState({ msg: '', type: 'success' });
  const [socketConnected, setSocketConnected] = useState(false);
  const navigate = useNavigate();

  // Noticeboard
  const [notice, setNotice] = useState({ title: '', message: '', type: 'Notice', targetRegdNo: '' });
  const [noticeLoading, setNoticeLoading] = useState(false);

  // Section-wise Bulk Marks
  const [bulkSubject, setBulkSubject]   = useState(SUBJECTS[0]);
  const [bulkTestField, setBulkTestField] = useState(TEST_FIELDS[0].key);
  const [bulkValues, setBulkValues]     = useState({});   // { regdNo: value }
  const [bulkSearch, setBulkSearch]     = useState('');
  const [bulkSaving, setBulkSaving]     = useState(false);
  const [savedCount, setSavedCount]     = useState(null);
  const [bulkFaculty, setBulkFaculty]   = useState('');
  const [bulkSection, setBulkSection]   = useState('');

  // Attendance
  const [attRegdNo, setAttRegdNo]  = useState('');
  const [attForm, setAttForm]      = useState({ semester: '4', subjectName: SUBJECTS[0], totalClasses: '60', attendedClasses: '' });
  const [attLoading, setAttLoading] = useState(false);

  // Auto-generate
  const [genLoading, setGenLoading] = useState(false);

  // Student Profile update
  const [profRegdNo, setProfRegdNo] = useState('');
  const [profForm, setProfForm] = useState({ cgpa: '', sgpa: '', semester: '', branch: '', counsellor: '',
    total_tuition_fee: '', scholarship_applied: '', net_payable_amount: '', amount_paid: '' });
  const [profLoading, setProfLoading] = useState(false);
  const [profileStudent, setProfileStudent] = useState(null);
  
  const cgpaLocked = false; // UNLOCKED: Admin can now ALWAYS edit every field including CGPA

  const getToken = () => localStorage.getItem('admin_token');

  useEffect(() => { 
    fetchStudents(); 
    
    // Setup socket connection
    const socket = getSocket();
    
    const onConnect = () => {
      setSocketConnected(true);
      console.log('Admin dashboard: Socket connected');
    };
    
    const onDisconnect = () => {
      setSocketConnected(false);
      console.log('Admin dashboard: Socket disconnected');
    };
    
    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    
    // If already connected, set state
    if (socket.connected) {
      setSocketConnected(true);
    }
    
    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
    };
  }, []);
  // Reset values when subject or test changes
  useEffect(() => { setBulkValues({}); setSavedCount(null); }, [bulkSubject, bulkTestField]);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: '' }), 3500);
  };

  const fetchStudents = async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/students`, {
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      if (res.status === 401 || res.status === 403) { onAdminLogout(); navigate('/admin/login'); return; }
      const data = await res.json();
      if (data.success) setStudents(data.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  // Noticeboard
  const handlePostNotice = async (e) => {
    e.preventDefault();
    setNoticeLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/notice`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` },
        body: JSON.stringify(notice)
      });
      const data = await res.json();
      if (data.success) { showToast('Notice posted!'); setNotice({ title: '', message: '', type: 'Notice', targetRegdNo: '' }); }
      else showToast(data.message || 'Failed', 'error');
    } catch { showToast('Server error', 'error'); }
    finally { setNoticeLoading(false); }
  };

  // Bulk marks save
  const handleBulkSave = async () => {
    const entries = Object.entries(bulkValues)
      .filter(([, v]) => v !== '' && v !== null && v !== undefined)
      .map(([regdNo, value]) => ({ regdNo, value }));

    if (entries.length === 0) { showToast('No marks entered yet', 'error'); return; }
    setBulkSaving(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/bulk-marks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` },
        body: JSON.stringify({ subjectName: bulkSubject, testField: bulkTestField, entries })
      });
      const data = await res.json();
      if (data.success) {
        setSavedCount(data.saved);
        showToast(`Saved marks for ${data.saved} students!`);
      } else showToast(data.message || 'Failed', 'error');
    } catch { showToast('Server error', 'error'); }
    finally { setBulkSaving(false); }
  };

  // Attendance
  const handleSaveAttendance = async (e) => {
    e.preventDefault();
    if (!attRegdNo) { showToast('Select a student', 'error'); return; }
    setAttLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/students/${attRegdNo}/attendance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` },
        body: JSON.stringify({ semester: parseInt(attForm.semester), subjectName: attForm.subjectName, totalClasses: parseInt(attForm.totalClasses), attendedClasses: parseInt(attForm.attendedClasses) })
      });
      const data = await res.json();
      if (data.success) { showToast('Attendance updated!'); setAttForm(p => ({ ...p, attendedClasses: '' })); }
      else showToast(data.message || 'Failed', 'error');
    } catch { showToast('Server error', 'error'); }
    finally { setAttLoading(false); }
  };

  // Student Profile update
  const loadProfile = async (regdNo) => {
    if (!regdNo) return;
    try {
      const res = await fetch(`${API_URL}/api/admin/students/${regdNo}`, {
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      const data = await res.json();
      if (data.success && data.data) {
        const s = data.data;
        setProfileStudent(s);
        setProfForm({
          cgpa: s.cgpa ?? '', sgpa: s.sgpa ?? '',
          semester: s.semester ?? '', branch: s.branch ?? '', counsellor: s.counsellor ?? '',
          total_tuition_fee:   s.feeDetails?.totalTuitionFee   ?? '',
          scholarship_applied: s.feeDetails?.scholarshipApplied ?? '',
          net_payable_amount:  s.feeDetails?.netPayableAmount   ?? '',
          amount_paid:         s.feeDetails?.amountPaid         ?? '',
        });
      }
    } catch (e) { console.error(e); }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!profRegdNo) { showToast('Select a student', 'error'); return; }
    setProfLoading(true);
    try {
      const payload = {};
      if (!cgpaLocked && profForm.cgpa) payload.cgpa = profForm.cgpa;
      if (profForm.sgpa)                payload.sgpa                = profForm.sgpa;
      if (profForm.semester)            payload.semester            = profForm.semester;
      if (profForm.branch)              payload.branch              = profForm.branch;
      if (profForm.counsellor)          payload.counsellor          = profForm.counsellor;
      if (profForm.total_tuition_fee)   payload.total_tuition_fee   = parseFloat(profForm.total_tuition_fee);
      if (profForm.scholarship_applied) payload.scholarship_applied = parseFloat(profForm.scholarship_applied);
      if (profForm.net_payable_amount)  payload.net_payable_amount  = parseFloat(profForm.net_payable_amount);
      if (profForm.amount_paid)         payload.amount_paid         = parseFloat(profForm.amount_paid);

      const res = await fetch(API_URL + '/api/admin/students/' + profRegdNo, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + getToken() },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        showToast('✓ Profile & fees updated live!');
        await loadProfile(profRegdNo);
      } else {
        showToast(data.message || 'Save failed', 'error');
      }
    } catch {
      showToast('Server error', 'error');
    } finally {
      setProfLoading(false);
    }
  };
  // Auto-generate

  const handleAutoGenerate = async () => {
    setGenLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/auto-generate-attendance`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` }
      });
      const data = await res.json();
      if (data.success) showToast(`Auto-generated attendance for ${data.count} students!`);
      else showToast(data.message || 'Failed', 'error');
    } catch { showToast('Server error', 'error'); }
    finally { setGenLoading(false); }
  };

  const sortedStudents = [...students].sort((a, b) => (a.regd_no || '').localeCompare(b.regd_no || ''));
  const filtered       = students.filter(s =>
    s.name?.toLowerCase().includes(search.toLowerCase()) ||
    s.regd_no?.toLowerCase().includes(search.toLowerCase())
  );
  const bulkFiltered = sortedStudents.filter(s =>
    s.regd_no?.toLowerCase().includes(bulkSearch.toLowerCase()) ||
    s.name?.toLowerCase().includes(bulkSearch.toLowerCase())
  );

  const profileOptions = sortedStudents.map(s => ({
    value: s.regd_no,
    label: s.name,
    sub: `Sem ${s.semester || '?'} • ${s.branch || '—'}`
  }));

  const currentField = TEST_FIELDS.find(f => f.key === bulkTestField) || TEST_FIELDS[0];
  const chartData = students.filter(s => s.cgpa).map(s => ({ name: s.regd_no, CGPA: parseFloat(s.cgpa) })).slice(0, 15);
  const ic = "w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition dark:text-white";

return (
  <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 lg:p-8 text-slate-900 dark:text-slate-100">
    <Toast msg={toast.msg} type={toast.type} onClose={() => setToast({ msg: '' }) } />

    {/* Socket Status Badge */}
    <div className="flex items-center justify-end mb-4">
      <div className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full ${socketConnected ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
        {socketConnected ? <><Wifi size={12} /><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />Live</> : <><WifiOff size={12} /> Connecting…</>}
      </div>
    </div>

    {/* ── Vignan Header ── */}
    <header className="rounded-3xl overflow-hidden mb-6 shadow-xl border border-indigo-200/30 dark:border-indigo-900/30">
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-purple-900 px-6 lg:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {/* Vignan Logo placeholder */}
          <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white shadow-lg flex-shrink-0">
            <School size={28}/>
          </div>
          <div>
            <h1 className="text-xl font-black text-white tracking-tight">Vignan's Institute of Information Technology</h1>
            <p className="text-indigo-200 text-xs font-medium mt-0.5">ERP Administration Panel — Academic Year 2025–26</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex flex-col text-right">
            <p className="text-white font-bold text-sm">Administrator</p>
            <p className="text-lg font-black text-indigo-300">Admin Panel</p>
          </div>
          <div className="w-12 h-12 bg-white/10 backdrop-blur-md border border-white/20 rounded-full flex items-center justify-center">
            <UserCheck size={20} className="text-white" />
          </div>
          <button onClick={onAdminLogout} className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl font-bold transition-all text-sm backdrop-blur-sm">
            <LogOut size={15}/> Logout
          </button>
        </div>
      </div>
      {/* Stat strip */}
      <div className="bg-white/5 dark:bg-slate-900/50 backdrop-blur px-6 py-3 flex gap-6 overflow-x-auto">
        {[
          { label:'Avg CGPA',  val: students.length ? (students.reduce((a,s)=>a+(parseFloat(s.cgpa)||0),0)/students.length).toFixed(2):'–' },
          { label:'Branches',  val: [...new Set(students.map(s=>s.branch))].filter(Boolean).length },
          { label:'Sections',  val: [...new Set(students.map(s=>s.section))].filter(Boolean).length || '–' },
          { label:'ERP Live',  val: '🟢 Online' },
        ].map(({ label, val }) => (
            <div key={label} className="flex-shrink-0 flex items-center gap-2">
              <span className="text-indigo-300 text-xs font-semibold uppercase tracking-wider">{label}</span>
              <span className="text-white font-black">{val}</span>
            </div>
          ))}
        </div>
      </header>

      {/* Tabs */}
      <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
        {TABS.map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-5 py-2 rounded-xl font-bold text-sm whitespace-nowrap transition-all ${activeTab === tab ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 dark:shadow-indigo-900' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'}`}>
            {tab}
          </button>
        ))}
      </div>

      {/* ── Students ── */}
      {activeTab === 'Students' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-lg border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
              <div className="relative flex-1 max-w-md">
                <input type="text" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} className={ic + " pl-10"} />
                <Search size={18} className="absolute left-3 top-3 text-slate-400" />
              </div>
              <span className="text-sm font-semibold text-slate-500 hidden sm:block">{filtered.length} students</span>
            </div>
            <div className="overflow-x-auto">
              {loading ? (
                <div className="p-12 flex flex-col items-center"><Loader2 className="w-8 h-8 text-indigo-500 animate-spin mb-3" /><p className="text-slate-500 text-sm">Loading...</p></div>
              ) : (
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 font-bold uppercase tracking-wider text-xs">
                    <tr>{['Reg No','Name','Branch & Sem','CGPA','Actions'].map(h=><th key={h} className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">{h}</th>)}</tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filtered.map(s => (
                      <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="px-6 py-4 font-bold text-indigo-600 dark:text-indigo-400 uppercase">{s.regd_no}</td>
                        <td className="px-6 py-4 font-semibold text-slate-800 dark:text-slate-200">{s.name}</td>
                        <td className="px-6 py-4 text-slate-500">{s.branch} • Sem {s.semester}</td>
                        <td className="px-6 py-4 font-black">{s.cgpa||'—'}</td>
                        <td className="px-6 py-4">
                          <button 
                            onClick={() => {
                              setActiveTab('Student Profile');
                              setProfRegdNo(s.regd_no);
                              loadProfile(s.regd_no);
                            }}
                            className="inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 dark:bg-indigo-500/10 dark:text-indigo-400 rounded-lg font-bold transition-all text-xs">
                            <Edit size={13}/> Edit Profile
                          </button>
                        </td>
                      </tr>
                    ))}
                    {filtered.length === 0 && <tr><td colSpan="5" className="px-6 py-8 text-center text-slate-400">No students found.</td></tr>}
                  </tbody>
                </table>
              )}
            </div>
          </div>
          {chartData.length > 0 && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-lg border border-slate-200 dark:border-slate-800 p-6">
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><BarChart2 className="text-indigo-500" size={20}/> CGPA Overview (first 15)</h3>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={chartData} margin={{ top:5, right:10, left:-20, bottom:20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0"/>
                  <XAxis dataKey="name" tick={{ fontSize:10, fill:'#94a3b8' }} angle={-30} textAnchor="end"/>
                  <YAxis domain={[0,10]} tick={{ fontSize:11, fill:'#94a3b8' }}/>
                  <Tooltip contentStyle={{ borderRadius:'12px', fontSize:'13px' }}/>
                  <Bar dataKey="CGPA" fill="#6366f1" radius={[6,6,0,0]}/>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      {/* ── Noticeboard ── */}
      {activeTab === 'Noticeboard' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-lg border border-slate-200 dark:border-slate-800 p-6 max-w-2xl">
          <h3 className="font-bold text-lg mb-1 flex items-center gap-2"><Bell className="text-amber-500" size={20}/> Post a Notice</h3>
          <p className="text-slate-500 text-sm mb-6">Leave Target blank to send to ALL students.</p>
          <form onSubmit={handlePostNotice} className="space-y-4">
            <div><label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Title *</label>
              <input type="text" required value={notice.title} onChange={e=>setNotice(p=>({...p,title:e.target.value}))} className={ic}/></div>
            <div><label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Message *</label>
              <textarea required rows={4} value={notice.message} onChange={e=>setNotice(p=>({...p,message:e.target.value}))} className={ic+" resize-none"}/></div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Type</label>
                <select value={notice.type} onChange={e=>setNotice(p=>({...p,type:e.target.value}))} className={ic}>
                  {['Notice','Exam','Alert','Event','General'].map(t=><option key={t}>{t}</option>)}
                </select></div>
              <div><label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Target Student (optional)</label>
                <select value={notice.targetRegdNo} onChange={e=>setNotice(p=>({...p,targetRegdNo:e.target.value}))} className={ic}>
                  <option value="">All Students</option>
                  {sortedStudents.map(s=><option key={s.id} value={s.regd_no}>{s.regd_no} – {s.name}</option>)}
                </select></div>
            </div>
            <button type="submit" disabled={noticeLoading}
              className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-bold shadow-lg hover:opacity-90 disabled:opacity-60">
              {noticeLoading?<Loader2 size={18} className="animate-spin"/>:<PlusCircle size={18}/>} Post Notice
            </button>
          </form>
        </div>
      )}

      {/* ── Enter Marks (Section-wise Bulk Table) ── */}
      {activeTab === 'Enter Marks' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-lg border border-slate-200 dark:border-slate-800 overflow-hidden">
          {/* Controls */}
          <div className="p-5 border-b border-slate-100 dark:border-slate-800 space-y-4">
            <div className="flex items-center gap-3 flex-wrap">
              <TableProperties className="text-indigo-500 flex-shrink-0" size={22}/>
              <h3 className="font-bold text-lg">Section-wise Marks Entry</h3>
              {savedCount !== null && (
                <span className="ml-auto px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 text-xs font-bold">
                  ✓ Saved {savedCount} students
                </span>
              )}
            </div>
            <p className="text-slate-500 text-sm">Select a <strong>Subject</strong> and <strong>Test/Assessment</strong>, then enter marks for each student. Click <strong>Save All Marks</strong> when done.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Subject</label>
                <select value={bulkSubject} onChange={e=>setBulkSubject(e.target.value)} className={ic}>
                  {SUBJECTS.map(s=><option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Test / Assessment</label>
                <select value={bulkTestField} onChange={e=>setBulkTestField(e.target.value)} className={ic}>
                  {TEST_FIELDS.map(f=><option key={f.key} value={f.key}>{f.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Faculty Name</label>
                <input type="text" placeholder="e.g. Dr. K. Rao" value={bulkFaculty} onChange={e=>setBulkFaculty(e.target.value)} className={ic}/>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Section</label>
                <input type="text" placeholder="e.g. A1, B2" value={bulkSection} onChange={e=>setBulkSection(e.target.value)} className={ic}/>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative flex-1 max-w-xs">
                <input type="text" placeholder="Filter by Reg No or Name…" value={bulkSearch} onChange={e=>setBulkSearch(e.target.value)} className={ic + ' pl-10'}/>
                <Search size={15} className="absolute left-3 top-3 text-slate-400"/>
              </div>
              <p className="text-xs text-slate-500">
                Entering: <span className="font-bold text-indigo-600">{bulkSubject}</span> → <span className="font-bold text-purple-600">{currentField.label}</span>
                {currentField.max && <span className="text-slate-400"> (max {currentField.max})</span>}
              </p>
              <button onClick={handleBulkSave} disabled={bulkSaving}
                className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold text-sm shadow-lg hover:opacity-90 disabled:opacity-60">
                {bulkSaving?<Loader2 size={16} className="animate-spin"/>:<Save size={16}/>}
                Save All Marks ({Object.values(bulkValues).filter(v=>v!=='').length} entered)
              </button>
            </div>
          </div>

          {/* Marks Table */}
          <div className="overflow-x-auto max-h-[60vh] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-slate-50 dark:bg-slate-800/80 z-10 text-slate-500 font-bold uppercase tracking-wider text-xs border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="px-4 py-3 text-left">#</th>
                  <th className="px-4 py-3 text-left">Reg No</th>
                  <th className="px-4 py-3 text-left">Name</th>
                  <th className="px-4 py-3 text-left">CGPA</th>
                  <th className="px-4 py-3 text-left min-w-[160px]">
                    {currentField.label}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {bulkFiltered.map((s, idx) => (
                  <tr key={s.id} className={`hover:bg-indigo-50/30 dark:hover:bg-indigo-900/10 transition-colors ${bulkValues[s.regd_no] !== undefined && bulkValues[s.regd_no] !== '' ? 'bg-emerald-50/40 dark:bg-emerald-900/10' : ''}`}>
                    <td className="px-4 py-2.5 text-slate-400 font-mono text-xs">{idx + 1}</td>
                    <td className="px-4 py-2.5 font-bold text-indigo-600 dark:text-indigo-400 uppercase text-xs">{s.regd_no}</td>
                    <td className="px-4 py-2.5 font-semibold text-slate-700 dark:text-slate-300">{s.name}</td>
                    <td className="px-4 py-2.5 font-black text-slate-600 dark:text-slate-300">{s.cgpa || '—'}</td>
                    <td className="px-4 py-2">
                      {bulkTestField === 'grade' ? (
                        <select
                          value={bulkValues[s.regd_no] || ''}
                          onChange={e => setBulkValues(p => ({ ...p, [s.regd_no]: e.target.value }))}
                          className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white w-28">
                          <option value="">— Grade —</option>
                          {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
                        </select>
                      ) : (
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          max={currentField.max || undefined}
                          value={bulkValues[s.regd_no] !== undefined ? bulkValues[s.regd_no] : ''}
                          onChange={e => setBulkValues(p => ({ ...p, [s.regd_no]: e.target.value }))}
                          placeholder={`0–${currentField.max}`}
                          className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white w-28"
                        />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span>Showing {bulkFiltered.length} of {students.length} students</span>
            <button onClick={handleBulkSave} disabled={bulkSaving}
              className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold text-sm shadow-lg hover:opacity-90 disabled:opacity-60">
              {bulkSaving?<Loader2 size={16} className="animate-spin"/>:<Save size={16}/>} Save All
            </button>
          </div>
        </div>
      )}

      {/* ── Attendance ── */}
      {activeTab === 'Attendance' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-lg border border-slate-200 dark:border-slate-800 p-6 max-w-lg">
          <h3 className="font-bold text-lg mb-1 flex items-center gap-2"><UserCheck className="text-emerald-500" size={20}/> Update Attendance</h3>
          <p className="text-slate-500 text-sm mb-6">Select a student and enter attendance for a subject.</p>
          <form onSubmit={handleSaveAttendance} className="space-y-4">
            <div><label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Student *</label>
              <select required value={attRegdNo} onChange={e=>setAttRegdNo(e.target.value)} className={ic}>
                <option value="">-- Select Student --</option>
                {sortedStudents.map(s=><option key={s.id} value={s.regd_no}>{s.regd_no} — {s.name}</option>)}
              </select></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs font-bold text-slate-500 mb-1 block">Semester</label>
                <input type="number" min="1" max="8" required value={attForm.semester} onChange={e=>setAttForm(p=>({...p,semester:e.target.value}))} className={ic}/></div>
              <div><label className="text-xs font-bold text-slate-500 mb-1 block">Subject</label>
                <select value={attForm.subjectName} onChange={e=>setAttForm(p=>({...p,subjectName:e.target.value}))} className={ic}>
                  {SUBJECTS.map(s=><option key={s} value={s}>{s}</option>)}
                </select></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs font-bold text-slate-500 mb-1 block">Total Classes</label>
                <input type="number" required value={attForm.totalClasses} onChange={e=>setAttForm(p=>({...p,totalClasses:e.target.value}))} placeholder="60" className={ic}/></div>
              <div><label className="text-xs font-bold text-slate-500 mb-1 block">Attended</label>
                <input type="number" required value={attForm.attendedClasses} onChange={e=>setAttForm(p=>({...p,attendedClasses:e.target.value}))} placeholder="52" className={ic}/></div>
            </div>
            {attForm.totalClasses && attForm.attendedClasses && (
              <div className={`p-3 rounded-xl text-sm font-semibold border ${((parseInt(attForm.attendedClasses)/parseInt(attForm.totalClasses))*100)<75?'bg-red-50 dark:bg-red-950/30 border-red-200 text-red-600':'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 text-emerald-700'}`}>
                Attendance: {((parseInt(attForm.attendedClasses)/parseInt(attForm.totalClasses))*100).toFixed(1)}%
                {((parseInt(attForm.attendedClasses)/parseInt(attForm.totalClasses))*100)<75 && <span className="ml-2">⚠️ Below 75%</span>}
              </div>
            )}
            <button type="submit" disabled={attLoading||!attRegdNo}
              className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-bold shadow-lg hover:opacity-90 disabled:opacity-60">
              {attLoading?<Loader2 size={18} className="animate-spin"/>:<CheckCircle size={18}/>} Update Attendance
            </button>
          </form>
        </div>
      )}

      {/* ── Auto-Generate ── */}
      {activeTab === 'Auto-Generate' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-lg border border-slate-200 dark:border-slate-800 p-8 max-w-lg">
          <h3 className="font-bold text-xl mb-2 flex items-center gap-2"><Zap className="text-yellow-500" size={22}/> Auto-Generate Attendance</h3>
          <p className="text-slate-500 text-sm mb-6">Generates realistic attendance for all students based on CGPA bands:</p>
          <div className="space-y-2 mb-8 text-sm">
            {[
              ['CGPA ≥ 8.5',    '> 95%',    'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-800'],
              ['CGPA 8.0 – 8.49','80 – 95%', 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800'],
              ['CGPA 7.0 – 7.99','75 – 80%', 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-900/20 dark:text-indigo-300 dark:border-indigo-800'],
              ['CGPA 6.5 – 6.99','65 – 75%', 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800'],
              ['CGPA < 6.5',    '55 – 65%',  'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800'],
            ].map(([r,a,c])=>(
              <div key={r} className={`flex justify-between px-4 py-2.5 rounded-xl border font-medium ${c}`}>
                <span>{r}</span><span className="font-bold">{a}</span>
              </div>
            ))}
          </div>
          <button onClick={handleAutoGenerate} disabled={genLoading}
            className="w-full flex items-center justify-center gap-2 py-4 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-2xl font-bold text-base shadow-xl hover:opacity-90 disabled:opacity-60">
            {genLoading?<Loader2 size={20} className="animate-spin"/>:<Zap size={20}/>}
            {genLoading?'Generating...': `Generate for All ${students.length} Students`}
          </button>
        </div>
      )}

      {/* ── Student Profile ── */}
      {activeTab === 'Student Profile' && (
        <div className="max-w-2xl space-y-5">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-lg border border-slate-200 dark:border-slate-800 p-6">
            <h3 className="font-bold text-lg mb-1 flex items-center gap-2">
              <UserCheck className="text-indigo-500" size={20}/> Update Student Profile, CGPA &amp; Fees
            </h3>
            <p className="text-slate-500 text-sm mb-5">Changes persist in the database and push live to the parent portal via socket.</p>
            <div className="mb-5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Select Student *</label>
              <SearchableDropdown
                options={profileOptions}
                value={profRegdNo}
                onChange={value => { setProfRegdNo(value); loadProfile(value); }}
                placeholder="Search by Regd. No. or student name…"
              />
            </div>
            {profileStudent && (
              <form onSubmit={handleSaveProfile} className="space-y-6">
                <div>
                  <p className="text-xs font-black text-indigo-600 uppercase tracking-wider mb-3">📊 Academic Info</p>
                  <div className="grid grid-cols-2 gap-3">
                    {[['cgpa','CGPA (0–10)','number','0.01'],['sgpa','SGPA (0–10)','number','0.01'],['semester','Semester','number','1'],['branch','Branch','text',''],['counsellor','Counsellor','text','']].map(([key,label,type,step]) => (
                      <div key={key}>
                        <label className="text-xs font-bold text-slate-500 mb-1 block">{label}</label>
                      <input
                        type={type}
                        step={step||undefined}
                        value={profForm[key]}
                        onChange={e => setProfForm(p=>({...p,[key]:e.target.value}))}
                        className={`${ic} ${key === 'cgpa' && cgpaLocked ? 'cursor-not-allowed opacity-80' : ''}`.trim()}
                        disabled={key === 'cgpa' && cgpaLocked}
                      />
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-black text-rose-600 uppercase tracking-wider mb-3">💰 Fee Details (₹)</p>
                  <div className="grid grid-cols-2 gap-3">
                    {[['total_tuition_fee','Total Tuition Fee'],['scholarship_applied','Scholarship Applied'],['net_payable_amount','Net Payable Amount'],['amount_paid','Amount Paid']].map(([key,label]) => (
                      <div key={key}>
                        <label className="text-xs font-bold text-slate-500 mb-1 block">{label}</label>
                        <input type="number" min="0" step="0.01" value={profForm[key]} onChange={e => setProfForm(p=>({...p,[key]:e.target.value}))} placeholder="₹ 0" className={ic}/>
                      </div>
                    ))}
                  </div>
                </div>
                <button type="submit" disabled={profLoading||!profRegdNo}
                  className="w-full flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold shadow-lg hover:opacity-90 disabled:opacity-60">
                  {profLoading?<Loader2 size={18} className="animate-spin"/>:<Save size={18}/>} Save &amp; Push Live to Portal
                </button>
              </form>
            )}
          </div>
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-3xl p-5">
            <h4 className="font-bold text-amber-800 dark:text-amber-300 flex items-center gap-2 mb-2"><Bell size={16}/> Quick Exam / Seating Notice</h4>
            <p className="text-xs text-amber-600 dark:text-amber-400 mb-3">Post an exam or seating arrangement — appears highlighted in parent dashboard instantly.</p>
            <button onClick={() => { setActiveTab('Noticeboard'); setNotice({ title:'Exam Schedule / Seating Arrangement', message:'', type:'Exam', targetRegdNo:'' }); }}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold text-sm transition-all">
              📋 Post Exam Notice →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
