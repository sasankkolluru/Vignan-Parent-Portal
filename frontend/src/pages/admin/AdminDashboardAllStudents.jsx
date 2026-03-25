/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  LogOut, Users, GraduationCap, TrendingUp, Filter, 
  Search, Download, Trash2, Eye, Award, Smartphone,
  CheckCircle, XCircle, AlertCircle, BarChart3, BookOpen,
  Edit, Save, Plus, X, RefreshCw, ChevronLeft, ChevronRight,
  DollarSign, UserCheck, Calendar, FileText, Settings
} from 'lucide-react';

const NOTICE_TYPES = ['Notice', 'Alert', 'Exam', 'Holiday', 'Placement'];
const SUBJECTS = ['SE', 'PADCOM', 'CNS', 'CLSA', 'QALR', 'MAD', 'MIH&IC', 'IDP-II', 'TRg'];
const NOTICE_TARGET_OPTIONS = [
  { value: 'all', label: 'Broadcast to entire batch' },
  { value: 'student', label: 'Target a specific student' }
];

function Toast({ msg, type, onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const colors = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    info: 'bg-blue-500'
  };

  return (
    <div className={`fixed top-4 right-4 z-50 ${colors[type]} text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-3`}>
      {type === 'success' && <CheckCircle size={20} />}
      {type === 'error' && <XCircle size={20} />}
      {type === 'info' && <AlertCircle size={20} />}
      <span>{msg}</span>
      <button onClick={onClose} className="ml-2 hover:opacity-75">×</button>
    </div>
  );
}

export default function AdminDashboard({ onAdminLogout }) {
  const [students, setStudents] = useState([]);
  const [_stats, setStats] = useState(null);
  const [twilioStatus, setTwilioStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [_error, setError] = useState('');
  const [toast, setToast] = useState({ msg: '', type: 'success' });
  
  // View states
  const [viewMode, setViewMode] = useState('list'); // 'list', 'edit', 'view'
  const [activeAdminTab, setActiveAdminTab] = useState('students'); // 'students', 'permissions'
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [_editMode, setEditMode] = useState(false);
  const [notices, setNotices] = useState([]);
  const [noticeLoading, setNoticeLoading] = useState(false);
  const [adminPermissions, setAdminPermissions] = useState(() => {
    try {
      const storage = localStorage.getItem('adminPermissions');
      if (storage) return JSON.parse(storage);
    } catch (e) {
      console.warn('Failed to parse adminPermissions', e);
    }
    return {
      view_students: true,
      edit_students: true,
      edit_performance: true,
      manage_attendance: true,
      manage_fees: true,
      publish_notices: true,
      manage_notices: true,
      manage_users: false
    };
  });
  const [savingPermissions, setSavingPermissions] = useState(false);
  const [noticeForm, setNoticeForm] = useState({ title: '', message: '', type: 'Notice', targetRegdNo: '' });
  const [noticeTargetMode, setNoticeTargetMode] = useState('all');
  const [selectedAttachment, setSelectedAttachment] = useState(null);
  const [noticeSubmitting, setNoticeSubmitting] = useState(false);
  
  // Filters
  const [filters, setFilters] = useState({
    cgpa_min: '',
    cgpa_max: '',
    section: '',
    branch: '',
    semester: '',
    attendance_min: '',
    sort_by: 'regd_no',
    sort_order: 'asc'
  });
  const [searchQuery, setSearchQuery] = useState('');

  const [bulkMarksRows, setBulkMarksRows] = useState([{ regd_no: '', subject: 'SE', testField: 'm1', value: '' }]);
  const [bulkSaving, setBulkSaving] = useState(false);
  const [singleMarkRow, setSingleMarkRow] = useState({ regd_no: '', subject: 'SE', testField: 'm1', value: '' });
  const [singleSaving, setSingleSaving] = useState(false);

  // Pagination
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 2000, // Get all students for full landing report search
    total: 0,
    totalPages: 0
  });

  // Form data for editing
  const [formData, setFormData] = useState({
    regd_no: '',
    name: '',
    email: '',
    mobile: '',
    branch: '',
    semester: '',
    section: '',
    counsellor: '',
    cgpa: '',
    sgpa: '',
    attendance: '',
    total_tuition_fee: '',
    scholarship_applied: '',
    net_payable_amount: '',
    amount_paid: ''
  });

  const navigate = useNavigate();
  const adminToken = localStorage.getItem('adminToken');
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5001';

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: '' }), 3500);
  };

  const togglePermission = (key) => {
    setAdminPermissions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const savePermissions = () => {
    setSavingPermissions(true);
    setTimeout(() => {
      localStorage.setItem('adminPermissions', JSON.stringify(adminPermissions));
      setSavingPermissions(false);
      showToast('Admin permissions updated successfully', 'success');
    }, 200);
  };

  useEffect(() => {
    if (!adminToken) {
      navigate('/admin/login');
      return;
    }
    fetchDashboardData();
    fetchTwilioStatus();
    fetchAllStudents();
  }, []);

  useEffect(() => {
    fetchAllStudents();
  }, [filters, pagination.page, pagination.limit, searchQuery]);

  useEffect(() => {
    fetchNotices();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/admin/stats', {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });
      const data = await response.json();
      if (data.success) setStats(data.data);
  } catch {
      console.error('Error fetching stats');
    }
  };

  const fetchTwilioStatus = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/admin/twilio-status', {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });
      const data = await response.json();
      setTwilioStatus(data);
  } catch {
      console.error('Error fetching Twilio status');
    }
  };

  const fetchAllStudents = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) queryParams.append(key, value);
      });
      queryParams.append('page', pagination.page);
      queryParams.append('limit', pagination.limit);
      if (searchQuery.trim()) queryParams.append('search', searchQuery.trim());

      const response = await fetch(`http://localhost:5000/api/admin/students?${queryParams}`, {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });
      
      const data = await response.json();
      if (data.success) {
        setStudents(data.data.students);
        setPagination(prev => ({
          ...prev,
          total: data.data.pagination.total,
          totalPages: data.data.pagination.totalPages
        }));
      } else {
        setError(data.message);
      }
    } catch {
      setError('Failed to fetch students');
    } finally {
      setLoading(false);
    }
  };

// const handleViewStudent = (student) => {
//     setSelectedStudent(student);
//     setViewMode('view');
//   };

  const handleEditStudent = (student) => {
    setSelectedStudent(student);
    setFormData({
      regd_no: student.regd_no,
      name: student.name,
      email: student.email,
      mobile: student.mobile,
      branch: student.branch,
      semester: student.semester,
      section: student.section,
      counsellor: student.counsellor,
      cgpa: student.cgpa,
      sgpa: student.sgpa,
      attendance: student.attendance,
      total_tuition_fee: student.total_tuition_fee,
      scholarship_applied: student.scholarship_applied,
      net_payable_amount: student.net_payable_amount,
      amount_paid: student.amount_paid
    });
    setEditMode(true);
    setViewMode('edit');
  };

  const handleSaveStudent = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/admin/student/${formData.regd_no}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      if (data.success) {
        showToast('Student profile updated successfully!');
        setEditMode(false);
        setViewMode('list');
        fetchAllStudents();
        fetchDashboardData();
      } else {
        showToast(data.message || 'Failed to update student', 'error');
      }
    } catch {
      showToast('Server error', 'error');
    }
  };

  const handleDeleteStudent = async (regdNo) => {
    if (!confirm(`Are you sure you want to delete student ${regdNo}?`)) return;
    
    try {
      const response = await fetch(`http://localhost:5000/api/admin/student/${regdNo}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });
      
      const data = await response.json();
      if (data.success) {
        showToast('Student deleted successfully!');
        fetchAllStudents();
        fetchDashboardData();
      } else {
        showToast(data.message || 'Failed to delete student', 'error');
      }
    } catch {
      showToast('Server error', 'error');
    }
  };

  const fetchNotices = async () => {
    setNoticeLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/admin/notices?limit=25`, {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });
      const data = await response.json();
      if (data.success) {
        setNotices(data.data || []);
      }
    } catch {
      console.error('Unable to fetch notices');
    } finally {
      setNoticeLoading(false);
    }
  };

  const readFileAsBase64 = (file) => new Promise((resolve, reject) => {
    if (!file) return resolve('');
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const handleAttachmentChange = async (event) => {
    const file = event.target.files?.[0] || null;
    setSelectedAttachment(file);
    event.target.value = '';
  };

  const handleNoticeSubmit = async (event) => {
    event.preventDefault();
    const targetRegd = noticeTargetMode === 'student' ? noticeForm.targetRegdNo.trim().toUpperCase() : null;
    if (!noticeForm.title.trim() || !noticeForm.message.trim()) {
      showToast('Title and message cannot be empty', 'error');
      return;
    }
    if (noticeTargetMode === 'student' && !targetRegd) {
      showToast('Provide registration number to target a student', 'error');
      return;
    }

    setNoticeSubmitting(true);
    try {
      const payload = {
        title: noticeForm.title.trim(),
        message: noticeForm.message.trim(),
        type: noticeForm.type,
        targetRegdNo: targetRegd
      };

      if (selectedAttachment) {
        payload.attachment = {
          name: selectedAttachment.name,
          type: selectedAttachment.type || 'application/octet-stream',
          data: await readFileAsBase64(selectedAttachment)
        };
      }

      const response = await fetch(`${API_BASE}/api/admin/notice`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (data.success) {
        showToast('Notice published successfully');
        setNoticeForm({ title: '', message: '', type: 'Notice', targetRegdNo: '' });
        setSelectedAttachment(null);
        fetchNotices();
      } else {
        showToast(data.message || 'Failed to publish notice', 'error');
      }
    } catch {
      console.error('Notice submission failed');
      showToast('Unable to send notice', 'error');
    } finally {
      setNoticeSubmitting(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleSearchChange = (value) => {
    setSearchQuery(value);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const addBulkRow = () => {
    setBulkMarksRows(prev => [...prev, { regd_no: '', subject: 'SE', testField: 'm1', value: '' }]);
  };

  const updateBulkRow = (index, key, value) => {
    setBulkMarksRows(prev => prev.map((r, i) => i === index ? { ...r, [key]: value } : r));
  };

  const removeBulkRow = (index) => {
    setBulkMarksRows(prev => prev.filter((_, i) => i !== index));
  };

  const saveBulkMarks = async () => {
    const entries = bulkMarksRows
      .filter(r => r.regd_no.trim() && r.value.trim())
      .map(r => ({ regdNo: r.regd_no.trim().toUpperCase(), subjectName: r.subject, testField: r.testField, value: r.value }));
    if (entries.length === 0) { showToast('Add at least one valid mark entry', 'error'); return; }
    setBulkSaving(true);
    try {
      const res = await fetch(`${API_BASE}/api/admin/bulk-marks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` },
        body: JSON.stringify({ entries })
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Successfully updated ${data.saved || entries.length} entries`);
        setBulkMarksRows([{ regd_no: '', subject: 'SE', testField: 'm1', value: '' }]);
        fetchAllStudents();
      } else {
        showToast(data.message || 'Bulk update failed', 'error');
      }
    } catch {
      showToast('Server error during bulk entry', 'error');
    } finally {
      setBulkSaving(false);
    }
  };

  const saveSingleMark = async () => {
    const entry = singleMarkRow;
    if (!entry.regd_no.trim() || !entry.value.trim()) {
      showToast('Please provide registration number and mark value', 'error');
      return;
    }

    setSingleSaving(true);
    try {
      const response = await fetch(`${API_BASE}/api/admin/students/${entry.regd_no.trim().toUpperCase()}/marks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` },
        body: JSON.stringify({
          subject: entry.subject,
          testField: entry.testField,
          mark: parseFloat(entry.value)
        })
      });
      const data = await response.json();
      if (data.success) {
        showToast(`Updated ${entry.subject} ${entry.testField} for ${entry.regd_no.toUpperCase()}`);
        setSingleMarkRow({ regd_no: '', subject: 'SE', testField: 'm1', value: '' });
        fetchAllStudents();
      } else {
        showToast(data.message || 'Single mark update failed', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Server error while updating single mark', 'error');
    } finally {
      setSingleSaving(false);
    }
  };

  const clearFilters = () => {
    setFilters({
      cgpa_min: '',
      cgpa_max: '',
      section: '',
      branch: '',
      semester: '',
      attendance_min: '',
      sort_by: 'regd_no',
      sort_order: 'asc'
    });
    setSearchQuery('');
  };

  const cleanSearch = searchQuery.trim().toLowerCase();

  const filteredStudents = students.filter(s => {
    if (!cleanSearch) return true;
    return [
      s.regd_no, s.name, s.email, s.mobile, s.branch, `${s.semester || ''}`, s.section, s.counsellor,
      `${s.cgpa || ''}`, `${s.sgpa || ''}`, `${s.attendance || ''}`
    ].some(v => (v || '').toString().toLowerCase().includes(cleanSearch));
  });

  const extractDigits = (text) => {
    const digits = (text || '').match(/\d+/g);
    return digits ? digits.join('') : '';
  };

  const closestMatches = (() => {
    if (!cleanSearch) return [];
    const queryDigits = parseInt(extractDigits(cleanSearch), 10);
    if (!Number.isFinite(queryDigits)) return [];

    return students
      .map((s) => {
        const regdDigits = parseInt(extractDigits(s.regd_no), 10);
        const score = Number.isFinite(regdDigits) ? Math.abs(regdDigits - queryDigits) : Number.MAX_SAFE_INTEGER;
        return { student: s, score };
      })
      .filter(item => item.score < Number.MAX_SAFE_INTEGER)
      .sort((a, b) => a.score - b.score)
      .slice(0, 5)
      .map(item => item.student);
  })();

  const exportData = () => {
    const csvContent = [
      ['Regd No', 'Name', 'Email', 'Mobile', 'Branch', 'Semester', 'Section', 'Counsellor', 'CGPA', 'SGPA', 'Attendance', 'Total Fee', 'Scholarship', 'Net Payable', 'Amount Paid'].join(','),
      ...students.map(s => [
        s.regd_no, s.name, s.email, s.mobile, s.branch, s.semester, s.section, 
        s.counsellor, s.cgpa, s.sgpa, s.attendance, s.total_tuition_fee,
        s.scholarship_applied, s.net_payable_amount, s.amount_paid
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `all_1340_students_export_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminData');
    onAdminLogout();
    navigate('/admin/login');
  };

  // List View - All 1340 Students
  if (viewMode === 'list') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-slate-200 sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center">
                  <GraduationCap className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-slate-900">Vignan's Institute ERP</h1>
                  <p className="text-xs text-slate-500">Admin Dashboard - {pagination.total} Students</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                {twilioStatus && (
                  <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
                    twilioStatus.connected 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-amber-100 text-amber-700'
                  }`}>
                    <Smartphone className="w-4 h-4" />
                    {twilioStatus.connected ? 'SMS Connected' : 'SMS Not Connected'}
                  </div>
                )}
                
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Stats Cards */}
          <section className="bg-white rounded-xl shadow-sm border border-slate-100 mb-6 p-6 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                  <FileText className="text-indigo-600" size={18} />
                  Notice Board
                </h3>
                <p className="text-sm text-slate-500">Send announcements, exam alerts or uploads to everyone or an individual.</p>
              </div>
              <span className="text-xs uppercase tracking-wide text-slate-400">
                Showing {notices.length} notices
              </span>
            </div>

            <form onSubmit={handleNoticeSubmit} className="space-y-4">
              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <label className="text-xs font-semibold text-slate-500 mb-1 block">Title</label>
                  <input
                    value={noticeForm.title}
                    onChange={(e) => setNoticeForm(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g., Exam Reminder"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 mb-1 block">Type</label>
                  <select
                    value={noticeForm.type}
                    onChange={(e) => setNoticeForm(prev => ({ ...prev, type: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                    {NOTICE_TYPES.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 mb-1 block">Message</label>
                <textarea
                  rows="3"
                  value={noticeForm.message}
                  onChange={(e) => setNoticeForm(prev => ({ ...prev, message: e.target.value }))}
                  placeholder="Add context, dates, or instructions for this notice."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div className="flex flex-wrap gap-3 text-xs">
                {NOTICE_TARGET_OPTIONS.map(option => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setNoticeTargetMode(option.value)}
                    className={`px-4 py-2 rounded-full border text-slate-600 ${noticeTargetMode === option.value ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white border-slate-200'}`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>

              {noticeTargetMode === 'student' && (
                <div>
                  <label className="text-xs font-semibold text-slate-500 mb-1 block">Target Registration No.</label>
                  <input
                    value={noticeForm.targetRegdNo}
                    onChange={(e) => setNoticeForm(prev => ({ ...prev, targetRegdNo: e.target.value }))}
                    placeholder="e.g., 22CSM123"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              )}

              <div>
                <label className="text-xs font-semibold text-slate-500 mb-1 block">Attachment</label>
                <label className="inline-flex items-center gap-2 px-3 py-2 border border-slate-200 rounded-lg cursor-pointer text-sm text-slate-600 hover:border-indigo-500 hover:text-indigo-600">
                  <input type="file" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.xlsx,.xls" onChange={handleAttachmentChange} className="hidden" />
                  <span>{selectedAttachment ? `Attached: ${selectedAttachment.name}` : 'Upload pdf/jpg/png/excel/document'}</span>
                </label>
                {selectedAttachment && (
                  <button
                    type="button"
                    onClick={() => setSelectedAttachment(null)}
                    className="mt-1 text-xs text-red-500 underline"
                  >
                    Remove attachment
                  </button>
                )}
              </div>

              <button
                type="submit"
                disabled={noticeSubmitting}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold disabled:opacity-60"
              >
                {noticeSubmitting ? 'Sending notice…' : 'Send Notice'}
              </button>
            </form>

            <div className="border-t border-slate-200 pt-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-slate-700">Latest notices</h4>
                <span className="text-xs text-slate-400">{noticeLoading ? 'Refreshing…' : ''}</span>
              </div>
              {noticeLoading ? (
                <p className="text-sm text-slate-500 mt-3">Fetching notices…</p>
              ) : (
                <div className="mt-3 space-y-3">
                  {notices.length === 0 ? (
                    <p className="text-sm text-slate-500">No notices published yet.</p>
                  ) : notices.map(notice => (
                    <div key={notice.id} className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-bold text-slate-900">{notice.title}</p>
                          <p className="text-xs text-slate-500">Posted by {notice.posted_by || 'Admin'} • {new Date(notice.created_at).toLocaleString()}</p>
                        </div>
                        <span className="text-xs px-3 py-1 rounded-full bg-slate-100 text-slate-600">{notice.type}</span>
                      </div>
                      <p className="text-sm text-slate-700 mt-2">{notice.message}</p>
                      <p className="text-xs text-slate-400 mt-2">{notice.target_regd_no ? `Targeted: ${notice.target_regd_no}` : 'Broadcasted to everyone'}</p>
                      {notice.attachment_url && (
                        <a
                          href={notice.attachment_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-indigo-600 font-semibold mt-2 inline-flex items-center gap-1"
                        >
                          Download {notice.attachment_name || 'attachment'}
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          <div className="bg-white border border-slate-200 rounded-xl p-3 mb-6">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setActiveAdminTab('students')}
                className={`px-3 py-2 rounded-lg text-sm font-medium ${activeAdminTab === 'students' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700'}`}
              >
                Student Management
              </button>
              <button
                onClick={() => setActiveAdminTab('permissions')}
                className={`px-3 py-2 rounded-lg text-sm font-medium ${activeAdminTab === 'permissions' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700'}`}
              >
                Admin Permissions
              </button>
            </div>
          </div>

          {activeAdminTab === 'permissions' && (
            <section className="bg-white rounded-xl shadow-sm border border-slate-100 mb-6 p-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">Editable Admin Permissions</h3>
                  <p className="text-sm text-slate-500">Update permission flags in real time for this admin interface.</p>
                </div>
                <button
                  onClick={savePermissions}
                  disabled={savingPermissions}
                  className="px-3 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold disabled:opacity-60"
                >
                  {savingPermissions ? 'Saving...' : 'Save Permissions'}
                </button>
              </div>
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                {Object.entries(adminPermissions).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between border border-slate-200 rounded-lg px-3 py-2">
                    <div>
                      <p className="text-sm font-medium text-slate-700">{key.replaceAll('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</p>
                      <p className="text-xs text-slate-500">Control whether admin can perform this action.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => togglePermission(key)}
                      className={`px-2 py-1 rounded-full text-xs font-semibold ${value ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}
                    >
                      {value ? 'Enabled' : 'Disabled'}
                    </button>
                  </div>
                ))}
              </div>
            </section>
          )}

          {activeAdminTab === 'students' && (
            <>
              {/* Filters and Actions */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 mb-6">
            <div className="flex flex-wrap items-center gap-4 mb-4">
              <h3 className="text-lg font-semibold text-slate-900">All 1340 Students</h3>
              <button
                onClick={clearFilters}
                className="px-3 py-1 text-sm text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Clear Filters
              </button>
              <button
                onClick={exportData}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
              >
                <Download className="w-4 h-4" />
                Export All Students
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <input
                type="text"
                placeholder="Search by name, regd no, email, branch..."
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="px-3 py-2 border border-slate-200 rounded-lg text-sm"
              />
              {cleanSearch && filteredStudents.length === 0 && closestMatches.length > 0 && (
                <div className="col-span-1 md:col-span-3 lg:col-span-6 text-xs text-slate-500 mt-1">
                  No exact rows found. Closest registration numbers found: {' '}
                  {closestMatches.map((student, idx) => (
                    <span key={student.id} className="font-medium text-indigo-700">{student.regd_no}{idx < closestMatches.length - 1 ? ', ' : ''}</span>
                  ))}
                </div>
              )}
              
              <select
                value={filters.branch}
                onChange={(e) => handleFilterChange('branch', e.target.value)}
                className="px-3 py-2 border border-slate-200 rounded-lg text-sm"
              >
                <option value="">All Branches</option>
                <option value="CSE">CSE</option>
                <option value="ECE">ECE</option>
                <option value="EEE">EEE</option>
                <option value="MECH">MECH</option>
                <option value="CIVIL">CIVIL</option>
              </select>

              <select
                value={filters.semester}
                onChange={(e) => handleFilterChange('semester', e.target.value)}
                className="px-3 py-2 border border-slate-200 rounded-lg text-sm"
              >
                <option value="">All Semesters</option>
                {[1,2,3,4,5,6,7,8].map(s => (
                  <option key={s} value={s}>Semester {s}</option>
                ))}
              </select>

              <input
                type="number"
                step="0.1"
                min="0"
                max="10"
                placeholder="Min CGPA"
                value={filters.cgpa_min}
                onChange={(e) => handleFilterChange('cgpa_min', e.target.value)}
                className="px-3 py-2 border border-slate-200 rounded-lg text-sm"
              />

              <input
                type="number"
                step="0.1"
                min="0"
                max="10"
                placeholder="Max CGPA"
                value={filters.cgpa_max}
                onChange={(e) => handleFilterChange('cgpa_max', e.target.value)}
                className="px-3 py-2 border border-slate-200 rounded-lg text-sm"
              />

              <input
                type="text"
                placeholder="Section"
                value={filters.section}
                onChange={(e) => handleFilterChange('section', e.target.value)}
                className="px-3 py-2 border border-slate-200 rounded-lg text-sm"
              />
            </div>
          </div>

          <section className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 mb-6">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-base font-semibold text-slate-900">Bulk Formative Marks Entry</h3>
                <p className="text-xs text-slate-500">Enter multiple student marks at once by row.</p>
              </div>
              <button
                onClick={addBulkRow}
                className="text-xs px-2 py-1 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              >+ Add Row</button>
            </div>
            <div className="space-y-2">
              {bulkMarksRows.map((row, index) => (
                <div key={`${row.regd_no}-${index}`} className="grid grid-cols-1 md:grid-cols-5 gap-2 items-end">
                  <div>
                    <label className="text-xs text-slate-500">Regd No</label>
                    <input value={row.regd_no} onChange={(e) => updateBulkRow(index, 'regd_no', e.target.value)} className="w-full px-2 py-1 border rounded-md text-sm" />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500">Subject</label>
                    <select value={row.subject} onChange={(e) => updateBulkRow(index, 'subject', e.target.value)} className="w-full px-2 py-1 border rounded-md text-sm">
                      {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-slate-500">Test Field</label>
                    <select value={row.testField} onChange={(e) => updateBulkRow(index, 'testField', e.target.value)} className="w-full px-2 py-1 border rounded-md text-sm">
                      {['m1','pre_t1','t2','t3','t4','t5_1','t5_2','t5_3','t5_4'].map(f => <option key={f} value={f}>{f}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-slate-500">Mark</label>
                    <input value={row.value} onChange={(e) => updateBulkRow(index, 'value', e.target.value)} className="w-full px-2 py-1 border rounded-md text-sm" />
                  </div>
                  <button type="button" onClick={() => removeBulkRow(index)} className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-md">Remove</button>
                </div>
              ))}
            </div>
            <div className="mt-3 text-right">
              <button onClick={saveBulkMarks} disabled={bulkSaving} className="px-3 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-60">
                {bulkSaving ? 'Saving…' : 'Save Bulk Marks'}
              </button>
            </div>

            <div className="mt-6 border-t border-slate-200 pt-4">
              <h4 className="font-semibold text-slate-800">Single Formative Mark Entry</h4>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-2 items-end mt-2">
                <div>
                  <label className="text-xs text-slate-500">Regd No</label>
                  <input value={singleMarkRow.regd_no} onChange={(e) => setSingleMarkRow(prev => ({ ...prev, regd_no: e.target.value }))} className="w-full px-2 py-1 border rounded-md" />
                </div>
                <div>
                  <label className="text-xs text-slate-500">Subject</label>
                  <select value={singleMarkRow.subject} onChange={(e) => setSingleMarkRow(prev => ({ ...prev, subject: e.target.value }))} className="w-full px-2 py-1 border rounded-md">
                    {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-500">Test Field</label>
                  <select value={singleMarkRow.testField} onChange={(e) => setSingleMarkRow(prev => ({ ...prev, testField: e.target.value }))} className="w-full px-2 py-1 border rounded-md">
                    {['m1','pre_t1','t2','t3','t4','t5_1','t5_2','t5_3','t5_4'].map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-500">Mark</label>
                  <input type="number" value={singleMarkRow.value} onChange={(e) => setSingleMarkRow(prev => ({ ...prev, value: e.target.value }))} className="w-full px-2 py-1 border rounded-md" />
                </div>
                <div className="text-right">
                  <button onClick={saveSingleMark} disabled={singleSaving} className="px-3 py-2 bg-emerald-600 text-white rounded-md text-sm font-semibold hover:bg-emerald-700 disabled:opacity-60">
                    {singleSaving ? 'Saving…' : 'Save Single Mark'}
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* Students Table - All Details */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-indigo-50 to-blue-50">
              <h3 className="text-lg font-semibold text-slate-900">
                All Student Details ({filteredStudents.length} shown, {pagination.total} total)
              </h3>
              <p className="text-sm text-slate-600 mt-1">
                Complete student information with academic and fee details
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200 sticky top-0">
                  <tr>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Regd No</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Name</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Email</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Mobile</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Branch</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Sem</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Section</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Counsellor</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-slate-500 uppercase">CGPA</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-slate-500 uppercase">SGPA</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Attendance</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Total Fee</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Scholarship</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Net Payable</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Amount Paid</th>
                    <th className="px-3 py-3 text-center text-xs font-semibold text-slate-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {loading ? (
                    <tr>
                      <td colSpan="16" className="px-4 py-8 text-center">
                        <div className="flex items-center justify-center gap-2 text-slate-500">
                          <div className="w-5 h-5 border-2 border-slate-300 border-t-indigo-600 rounded-full animate-spin" />
                          Loading {pagination.total} students...
                        </div>
                      </td>
                    </tr>
                  ) : students.length === 0 ? (
                    <tr>
                      <td colSpan="16" className="px-4 py-8 text-center text-slate-500">
                        No students found matching your criteria
                      </td>
                    </tr>
                  ) : (
                    filteredStudents.map((student) => (
                      <tr key={student.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-3 py-3 font-medium text-slate-900 text-sm">{student.regd_no}</td>
                        <td className="px-3 py-3 text-slate-700 text-sm font-medium">{student.name}</td>
                        <td className="px-3 py-3 text-slate-600 text-xs">{student.email}</td>
                        <td className="px-3 py-3 text-slate-600 text-sm">{student.mobile}</td>
                        <td className="px-3 py-3 text-slate-600 text-sm">{student.branch}</td>
                        <td className="px-3 py-3 text-slate-600 text-sm">{student.semester}</td>
                        <td className="px-3 py-3 text-slate-600 text-sm">{student.section || '-'}</td>
                        <td className="px-3 py-3 text-slate-600 text-sm">{student.counsellor || '-'}</td>
                        <td className="px-3 py-3">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            (student.cgpa >= 9) ? 'bg-green-100 text-green-700' :
                            (student.cgpa >= 8) ? 'bg-blue-100 text-blue-700' :
                            (student.cgpa >= 7) ? 'bg-yellow-100 text-yellow-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {student.cgpa || 'N/A'}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-slate-600 text-sm">{student.sgpa || '-'}</td>
                        <td className="px-3 py-3">
                          <span className={`text-sm font-medium ${
                            (student.attendance >= 75) ? 'text-green-600' :
                            (student.attendance >= 60) ? 'text-yellow-600' :
                            'text-red-600'
                          }`}>
                            {student.attendance ? `${student.attendance}%` : '-'}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-slate-600 text-sm">₹{student.total_tuition_fee || '0'}</td>
                        <td className="px-3 py-3 text-green-600 text-sm">₹{student.scholarship_applied || '0'}</td>
                        <td className="px-3 py-3 text-slate-600 text-sm">₹{student.net_payable_amount || '0'}</td>
                        <td className="px-3 py-3 text-green-600 text-sm">₹{student.amount_paid || '0'}</td>
                        <td className="px-3 py-3">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => handleEditStudent(student)}
                              className="flex items-center gap-1 px-3 py-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-lg font-bold text-xs transition-colors"
                              title="Edit Student"
                            >
                              <Edit size={14} /> Edit Profile
                            </button>
                            <button
                              onClick={() => navigate(`/admin/students/${student.regd_no}`)}
                              className="flex items-center gap-1 px-3 py-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-lg font-bold text-xs transition-colors"
                              title="Edit Formative Marks"
                            >
                              <BookOpen size={14} /> Edit Marks
                            </button>
                            <button
                              onClick={() => handleDeleteStudent(student.regd_no)}
                              className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                              title="Delete Student"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between bg-slate-50">
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                  disabled={pagination.page === 1}
                  className="flex items-center gap-2 px-4 py-2 text-sm bg-white border border-slate-200 rounded-lg disabled:opacity-50"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </button>
                <span className="text-sm text-slate-600">
                  Page {pagination.page} of {pagination.totalPages} ({pagination.total} students)
                </span>
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                  disabled={pagination.page === pagination.totalPages}
                  className="flex items-center gap-2 px-4 py-2 text-sm bg-white border border-slate-200 rounded-lg disabled:opacity-50"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
            </>
          )}
        </main>

        {/* Toast */}
        {toast.msg && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast({ msg: '' })} />}
      </div>
    );
  }

  // View Student Details
  if (viewMode === 'view' && selectedStudent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    setViewMode('list');
                    setSelectedStudent(null);
                  }}
                  className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
                <div>
                  <h1 className="text-xl font-bold text-slate-900">Student Details</h1>
                  <p className="text-xs text-slate-500">Registration: {selectedStudent.regd_no}</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
            {/* Student Header */}
            <div className="bg-gradient-to-r from-indigo-500 to-blue-600 p-6 text-white">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                  <Users className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">{selectedStudent.name}</h2>
                  <p className="text-indigo-100">{selectedStudent.regd_no} • {selectedStudent.branch} • Semester {selectedStudent.semester}</p>
                </div>
              </div>
            </div>

            {/* Student Information */}
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Personal Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-slate-900 border-b border-slate-200 pb-2">Personal Information</h3>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-600">Registration Number</span>
                      <span className="font-medium text-slate-900">{selectedStudent.regd_no}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-600">Full Name</span>
                      <span className="font-medium text-slate-900">{selectedStudent.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-600">Email</span>
                      <span className="font-medium text-slate-900">{selectedStudent.email || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-600">Mobile Number</span>
                      <span className="font-medium text-slate-900">{selectedStudent.mobile}</span>
                    </div>
                  </div>
                </div>

                {/* Academic Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-slate-900 border-b border-slate-200 pb-2">Academic Information</h3>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-600">Branch</span>
                      <span className="font-medium text-slate-900">{selectedStudent.branch}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-600">Semester</span>
                      <span className="font-medium text-slate-900">{selectedStudent.semester}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-600">Section</span>
                      <span className="font-medium text-slate-900">{selectedStudent.section || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-600">Counsellor</span>
                      <span className="font-medium text-slate-900">{selectedStudent.counsellor || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                {/* Performance */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-slate-900 border-b border-slate-200 pb-2">Performance</h3>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-600">CGPA</span>
                      <span className={`font-medium ${
                        (selectedStudent.cgpa >= 8) ? 'text-green-600' :
                        (selectedStudent.cgpa >= 7) ? 'text-yellow-600' :
                        'text-red-600'
                      }`}>
                        {selectedStudent.cgpa || 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-600">SGPA</span>
                      <span className="font-medium text-slate-900">{selectedStudent.sgpa || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-600">Attendance</span>
                      <span className={`font-medium ${
                        (selectedStudent.attendance >= 75) ? 'text-green-600' :
                        (selectedStudent.attendance >= 60) ? 'text-yellow-600' :
                        'text-red-600'
                      }`}>
                        {selectedStudent.attendance ? `${selectedStudent.attendance}%` : 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Fee Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-slate-900 border-b border-slate-200 pb-2">Fee Information</h3>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-600">Total Tuition Fee</span>
                      <span className="font-medium text-slate-900">₹{selectedStudent.total_tuition_fee || '0'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-600">Scholarship Applied</span>
                      <span className="font-medium text-green-600">₹{selectedStudent.scholarship_applied || '0'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-600">Net Payable Amount</span>
                      <span className="font-medium text-slate-900">₹{selectedStudent.net_payable_amount || '0'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-600">Amount Paid</span>
                      <span className="font-medium text-green-600">₹{selectedStudent.amount_paid || '0'}</span>
                    </div>
                    <div className="pt-3 border-t border-slate-200">
                      <div className="flex justify-between">
                        <span className="text-sm font-medium text-slate-900">Balance Due</span>
                        <span className="font-bold text-red-600">
                          ₹{((selectedStudent.net_payable_amount || 0) - (selectedStudent.amount_paid || 0))}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-4 mt-8 pt-6 border-t border-slate-200">
                <button
                  onClick={() => {
                    setViewMode('list');
                    setSelectedStudent(null);
                  }}
                  className="px-6 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Close
                </button>
                <button
                  onClick={() => handleEditStudent(selectedStudent)}
                  className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  <Edit className="w-4 h-4" />
                  Edit Student
                </button>
              </div>
            </div>
          </div>
        </main>

        {/* Toast */}
        {toast.msg && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast({ msg: '' })} />}
      </div>
    );
  }

  // Edit Student View
  if (viewMode === 'edit' && selectedStudent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    setViewMode('list');
                    setEditMode(false);
                    setSelectedStudent(null);
                  }}
                  className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
                <div>
                  <h1 className="text-xl font-bold text-slate-900">Edit Student Profile</h1>
                  <p className="text-xs text-slate-500">Registration: {formData.regd_no}</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
            <form onSubmit={(e) => { e.preventDefault(); handleSaveStudent(); }}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Personal Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-slate-900 border-b border-slate-200 pb-2">Personal Information</h3>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Registration Number</label>
                    <input
                      type="text"
                      value={formData.regd_no}
                      disabled
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-50"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Full Name *</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      required
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Mobile Number *</label>
                    <input
                      type="tel"
                      value={formData.mobile}
                      onChange={(e) => setFormData(prev => ({ ...prev, mobile: e.target.value }))}
                      required
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                </div>

                {/* Academic Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-slate-900 border-b border-slate-200 pb-2">Academic Information</h3>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Branch *</label>
                    <select
                      value={formData.branch}
                      onChange={(e) => setFormData(prev => ({ ...prev, branch: e.target.value }))}
                      required
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="">Select Branch</option>
                      <option value="CSE">CSE</option>
                      <option value="ECE">ECE</option>
                      <option value="EEE">EEE</option>
                      <option value="MECH">MECH</option>
                      <option value="CIVIL">CIVIL</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Semester *</label>
                    <select
                      value={formData.semester}
                      onChange={(e) => setFormData(prev => ({ ...prev, semester: e.target.value }))}
                      required
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="">Select Semester</option>
                      {[1,2,3,4,5,6,7,8].map(s => (
                        <option key={s} value={s}>Semester {s}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Section</label>
                    <input
                      type="text"
                      value={formData.section}
                      onChange={(e) => setFormData(prev => ({ ...prev, section: e.target.value }))}
                      placeholder="e.g., A, B, C"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Counsellor</label>
                    <input
                      type="text"
                      value={formData.counsellor}
                      onChange={(e) => setFormData(prev => ({ ...prev, counsellor: e.target.value }))}
                      placeholder="Counsellor name"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                </div>

                {/* Performance Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-slate-900 border-b border-slate-200 pb-2">Performance</h3>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">CGPA</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="10"
                      value={formData.cgpa}
                      onChange={(e) => setFormData(prev => ({ ...prev, cgpa: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">SGPA</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="10"
                      value={formData.sgpa}
                      onChange={(e) => setFormData(prev => ({ ...prev, sgpa: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Attendance (%)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={formData.attendance}
                      onChange={(e) => setFormData(prev => ({ ...prev, attendance: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                </div>

                {/* Fee Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-slate-900 border-b border-slate-200 pb-2">Fee Information</h3>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Total Tuition Fee</label>
                    <input
                      type="number"
                      value={formData.total_tuition_fee}
                      onChange={(e) => setFormData(prev => ({ ...prev, total_tuition_fee: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Scholarship Applied</label>
                    <input
                      type="number"
                      value={formData.scholarship_applied}
                      onChange={(e) => setFormData(prev => ({ ...prev, scholarship_applied: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Net Payable Amount</label>
                    <input
                      type="number"
                      value={formData.net_payable_amount}
                      onChange={(e) => setFormData(prev => ({ ...prev, net_payable_amount: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Amount Paid</label>
                    <input
                      type="number"
                      value={formData.amount_paid}
                      onChange={(e) => setFormData(prev => ({ ...prev, amount_paid: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-4 mt-8 pt-6 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    setViewMode('list');
                    setEditMode(false);
                    setSelectedStudent(null);
                  }}
                  className="px-6 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  <Save className="w-4 h-4" />
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </main>

        {/* Toast */}
        {toast.msg && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast({ msg: '' })} />}
      </div>
    );
  }

  return null;
}
