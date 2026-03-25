import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  LogOut, Users, GraduationCap, TrendingUp, Filter, 
  Search, Download, Trash2, Eye, Award, Smartphone,
  CheckCircle, XCircle, AlertCircle, BarChart3, BookOpen,
  Edit, Save, Plus, Bell, Mail, MessageSquare, Calendar,
  Target, UserCheck, FileText, Settings, RefreshCw
} from 'lucide-react';

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
  const [stats, setStats] = useState(null);
  const [twilioStatus, setTwilioStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState({ msg: '', type: 'success' });
  
  // Tab management
  const [activeTab, setActiveTab] = useState('Students');
  const TABS = ['Students', 'Noticeboard', 'Enter Marks', 'Attendance', 'Bulk Data Entry', 'Auto-Generate', 'Student Profile'];
  
  // Filters
  const [filters, setFilters] = useState({
    search: '',
    cgpa_min: '',
    cgpa_max: '',
    section: '',
    branch: '',
    semester: '',
    attendance_min: '',
    sort_by: 'regd_no',
    sort_order: 'asc'
  });
  
  // Pagination
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });

  // Noticeboard state
  const [notice, setNotice] = useState({ title: '', message: '', type: 'Notice', targetRegdNo: '' });
  
  // Marks entry state
  const [marksEntry, setMarksEntry] = useState({
    section: '',
    subject: '',
    testType: 'M1',
    marks: []
  });

  // Attendance state
  const [attForm, setAttForm] = useState({ regdNo: '', attendedClasses: '', totalClasses: '' });
  
  // Student profile state
  const [profRegdNo, setProfRegdNo] = useState('');
  const [profileData, setProfileData] = useState({
    name: '', email: '', mobile: '', branch: '', semester: '',
    section: '', counsellor: '', cgpa: '', sgpa: '',
    totalTuitionFee: '', scholarshipApplied: '', netPayableAmount: '', amountPaid: ''
  });

  // Bulk data entry state
  const [bulkData, setBulkData] = useState({
    students: [],
    csvText: '',
    importMode: 'manual' // 'manual' or 'csv'
  });

  const navigate = useNavigate();
  const adminToken = localStorage.getItem('adminToken');

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: '' }), 3500);
  };

  useEffect(() => {
    if (!adminToken) {
      navigate('/admin/login');
      return;
    }
    fetchDashboardData();
    fetchTwilioStatus();
  }, []);

  useEffect(() => {
    if (activeTab === 'Students') {
      fetchStudents();
    }
  }, [filters, pagination.page, pagination.limit, activeTab]);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/admin/stats', {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });
      const data = await response.json();
      if (data.success) setStats(data.data);
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  const fetchTwilioStatus = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/admin/twilio-status', {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });
      const data = await response.json();
      setTwilioStatus(data);
    } catch (err) {
      console.error('Error fetching Twilio status:', err);
    }
  };

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) queryParams.append(key, value);
      });
      queryParams.append('page', pagination.page);
      queryParams.append('limit', pagination.limit);

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
    } catch (err) {
      setError('Failed to fetch students');
    } finally {
      setLoading(false);
    }
  };

  const fetchTopPerformers = async (category) => {
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:5000/api/admin/students/top-performers?category=${category}&limit=20`, {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });
      
      const data = await response.json();
      if (data.success) {
        setStudents(data.data);
        setActiveTab('Students');
      }
    } catch (err) {
      console.error('Error fetching top performers:', err);
    } finally {
      setLoading(false);
    }
  };

  const postNotice = async () => {
    if (!notice.title || !notice.message) {
      showToast('Please fill in all notice fields', 'error');
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/admin/notice', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(notice)
      });

      const data = await response.json();
      if (data.success) {
        showToast('Notice posted successfully!');
        setNotice({ title: '', message: '', type: 'Notice', targetRegdNo: '' });
      } else {
        showToast(data.message || 'Failed to post notice', 'error');
      }
    } catch (err) {
      showToast('Server error', 'error');
    }
  };

  const bulkMarksEntry = async () => {
    if (!marksEntry.section || !marksEntry.subject || !marksEntry.testType) {
      showToast('Please fill in section, subject, and test type', 'error');
      return;
    }

    if (marksEntry.marks.length === 0) {
      showToast('Please add at least one student mark', 'error');
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/admin/bulk-marks', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(marksEntry)
      });

      const data = await response.json();
      if (data.success) {
        showToast(`Saved marks for ${data.saved} students!`);
        setMarksEntry({ section: '', subject: '', testType: 'M1', marks: [] });
      } else {
        showToast(data.message || 'Failed to save marks', 'error');
      }
    } catch (err) {
      showToast('Server error', 'error');
    }
  };

  const updateAttendance = async () => {
    if (!attForm.regdNo || !attForm.attendedClasses || !attForm.totalClasses) {
      showToast('Select a student and fill attendance details', 'error');
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/api/admin/student/${attForm.regdNo}/attendance`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(attForm)
      });

      const data = await response.json();
      if (data.success) {
        showToast('Attendance updated successfully!');
        setAttForm({ regdNo: '', attendedClasses: '', totalClasses: '' });
      } else {
        showToast(data.message || 'Failed to update attendance', 'error');
      }
    } catch (err) {
      showToast('Server error', 'error');
    }
  };

  const updateStudentProfile = async () => {
    if (!profRegdNo) {
      showToast('Select a student', 'error');
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/api/admin/student/${profRegdNo}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(profileData)
      });

      const data = await response.json();
      if (data.success) {
        showToast('✓ Profile & fees updated live!');
        fetchDashboardData();
      } else {
        showToast(data.message || 'Save failed', 'error');
      }
    } catch (err) {
      showToast('Server error', 'error');
    }
  };

  const autoGenerateAttendance = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/admin/auto-attendance', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(autoGenForm)
      });

      const data = await response.json();
      if (data.success) {
        showToast(`Auto-generated attendance for ${data.count} students!`);
        fetchDashboardData();
      } else {
        showToast(data.message || 'Failed to generate attendance', 'error');
      }
    } catch (err) {
      showToast('Server error', 'error');
    }
  };

  const addBulkStudents = async () => {
    if (bulkData.students.length === 0) {
      showToast('Please add at least one student', 'error');
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/admin/bulk-students', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ students: bulkData.students })
      });

      const data = await response.json();
      if (data.success) {
        showToast(`Added ${data.added} students successfully!`);
        setBulkData({ students: [], csvText: '', importMode: 'manual' });
        fetchDashboardData();
        fetchStudents();
      } else {
        showToast(data.message || 'Failed to add students', 'error');
      }
    } catch (err) {
      showToast('Server error', 'error');
    }
  };

  const parseCSV = () => {
    if (!bulkData.csvText.trim()) {
      showToast('Please enter CSV data', 'error');
      return;
    }

    try {
      const lines = bulkData.csvText.trim().split('\n');
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      
      const students = [];
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',');
        if (values.length >= headers.length) {
          const student = {};
          headers.forEach((header, index) => {
            const value = values[index]?.trim() || '';
            // Map common headers to database fields
            switch (header) {
              case 'regd_no':
              case 'registration number':
              case 'regd no':
                student.regd_no = value;
                break;
              case 'name':
              case 'student name':
                student.name = value;
                break;
              case 'mobile':
              case 'phone':
              case 'contact':
                student.mobile = value;
                break;
              case 'email':
                student.email = value;
                break;
              case 'cgpa':
                student.cgpa = value ? parseFloat(value) : null;
                break;
              case 'sgpa':
                student.sgpa = value ? parseFloat(value) : null;
                break;
              case 'semester':
              case 'sem':
                student.semester = value ? parseInt(value) : null;
                break;
              case 'branch':
              case 'department':
                student.branch = value;
                break;
              case 'counsellor':
              case 'counselor':
                student.counsellor = value;
                break;
              case 'total_tuition_fee':
              case 'tuition fee':
              case 'fee':
                student.total_tuition_fee = value ? parseFloat(value) : null;
                break;
              case 'scholarship_applied':
              case 'scholarship':
                student.scholarship_applied = value ? parseFloat(value) : null;
                break;
              case 'net_payable_amount':
              case 'net payable':
                student.net_payable_amount = value ? parseFloat(value) : null;
                break;
              case 'amount_paid':
              case 'paid':
                student.amount_paid = value ? parseFloat(value) : null;
                break;
            }
          });
          if (student.regd_no && student.name) {
            students.push(student);
          }
        }
      }

      setBulkData(prev => ({ ...prev, students }));
      showToast(`Parsed ${students.length} students from CSV`);
    } catch (err) {
      showToast('Error parsing CSV', 'error');
    }
  };

  const addManualStudent = () => {
    const newStudent = {
      regd_no: '',
      name: '',
      mobile: '',
      email: '',
      cgpa: '',
      sgpa: '',
      semester: '',
      branch: '',
      counsellor: '',
      total_tuition_fee: '',
      scholarship_applied: '',
      net_payable_amount: '',
      amount_paid: ''
    };
    setBulkData(prev => ({
      ...prev,
      students: [...prev.students, newStudent]
    }));
  };

  const updateManualStudent = (index, field, value) => {
    setBulkData(prev => ({
      ...prev,
      students: prev.students.map((student, i) => 
        i === index ? { ...student, [field]: value } : student
      )
    }));
  };

  const removeManualStudent = (index) => {
    setBulkData(prev => ({
      ...prev,
      students: prev.students.filter((_, i) => i !== index)
    }));
  };

  const deleteStudent = async (regdNo) => {
    if (!confirm(`Delete student ${regdNo}?`)) return;
    
    try {
      const response = await fetch(`http://localhost:5000/api/admin/student/${regdNo}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });
      
      const data = await response.json();
      if (data.success) {
        fetchStudents();
        fetchDashboardData();
      } else {
        alert(data.message);
      }
    } catch (err) {
      console.error('Error deleting student:', err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminData');
    onAdminLogout();
    navigate('/admin/login');
  };

  const exportData = () => {
    const csvContent = [
      ['Regd No', 'Name', 'Mobile', 'CGPA', 'SGPA', 'Branch', 'Semester', 'Section', 'Counsellor'].join(','),
      ...students.map(s => [
        s.regd_no, s.name, s.mobile, s.cgpa, s.sgpa, 
        s.branch, s.semester, s.section, s.counsellor
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `students_export_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  // Chart data for CGPA distribution
  const chartData = stats?.cgpaDistribution?.map(item => ({
    range: item.range,
    count: item.count
  })) || [];

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
                <p className="text-xs text-slate-500">Admin Dashboard - Student Management System</p>
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
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Total Students</p>
                  <p className="text-3xl font-bold text-slate-900">{stats.totalStudents}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Branches</p>
                  <p className="text-3xl font-bold text-slate-900">{stats.byBranch?.length || 0}</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Fee Collected</p>
                  <p className="text-2xl font-bold text-green-600">
                    ₹{((parseFloat(stats.feeSummary?.total_collected) || 0) / 100000).toFixed(2)}L
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Fee Due</p>
                  <p className="text-2xl font-bold text-red-600">
                    ₹{((parseFloat(stats.feeSummary?.total_due) || 0) / 100000).toFixed(2)}L
                  </p>
                </div>
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-red-600" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 mb-6">
          <div className="flex flex-wrap gap-1 p-2">
            {TABS.map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === tab 
                    ? 'bg-indigo-600 text-white' 
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
          {/* Students Tab */}
          {activeTab === 'Students' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-slate-900">Student Management</h2>
                <div className="flex gap-2">
                  <button
                    onClick={() => fetchTopPerformers('cgpa')}
                    className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600"
                  >
                    <Award className="w-4 h-4" />
                    Top Performers
                  </button>
                  <button
                    onClick={exportData}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    <Download className="w-4 h-4" />
                    Export CSV
                  </button>
                </div>
              </div>

              {/* Filters */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <input
                  type="text"
                  placeholder="Search students..."
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  className="px-4 py-2 border border-slate-200 rounded-lg"
                />
                <input
                  type="text"
                  placeholder="Section (A, B, C)"
                  value={filters.section}
                  onChange={(e) => setFilters(prev => ({ ...prev, section: e.target.value }))}
                  className="px-4 py-2 border border-slate-200 rounded-lg"
                />
                <select
                  value={filters.branch}
                  onChange={(e) => setFilters(prev => ({ ...prev, branch: e.target.value }))}
                  className="px-4 py-2 border border-slate-200 rounded-lg"
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
                  onChange={(e) => setFilters(prev => ({ ...prev, semester: e.target.value }))}
                  className="px-4 py-2 border border-slate-200 rounded-lg"
                >
                  <option value="">All Semesters</option>
                  {[1,2,3,4,5,6,7,8].map(s => (
                    <option key={s} value={s}>Semester {s}</option>
                  ))}
                </select>
              </div>

              {/* Students Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-3 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Regd No</th>
                      <th className="px-3 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Name</th>
                      <th className="px-3 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Mobile</th>
                      <th className="px-3 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Email</th>
                      <th className="px-3 py-3 text-left text-xs font-semibold text-slate-500 uppercase">CGPA</th>
                      <th className="px-3 py-3 text-left text-xs font-semibold text-slate-500 uppercase">SGPA</th>
                      <th className="px-3 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Branch</th>
                      <th className="px-3 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Sem</th>
                      <th className="px-3 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Section</th>
                      <th className="px-3 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Counsellor</th>
                      <th className="px-3 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Fee Status</th>
                      <th className="px-3 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {loading ? (
                      <tr>
                        <td colSpan="12" className="px-4 py-8 text-center">
                          <div className="flex items-center justify-center gap-2 text-slate-500">
                            <div className="w-5 h-5 border-2 border-slate-300 border-t-indigo-600 rounded-full animate-spin" />
                            Loading students...
                          </div>
                        </td>
                      </tr>
                    ) : students.length === 0 ? (
                      <tr>
                        <td colSpan="12" className="px-4 py-8 text-center text-slate-500">
                          No students found
                        </td>
                      </tr>
                    ) : (
                      students.map((student) => {
                        const feeDue = (parseFloat(student.net_payable_amount) || 0) - (parseFloat(student.amount_paid) || 0);
                        return (
                          <tr key={student.id} className="hover:bg-slate-50">
                            <td className="px-3 py-3 font-medium text-slate-900 text-sm">{student.regd_no}</td>
                            <td className="px-3 py-3 text-slate-700 text-sm">{student.name}</td>
                            <td className="px-3 py-3 text-slate-600 text-sm">{student.mobile}</td>
                            <td className="px-3 py-3 text-slate-600 text-sm">{student.email || 'N/A'}</td>
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
                            <td className="px-3 py-3 text-slate-600 text-sm">{student.sgpa || 'N/A'}</td>
                            <td className="px-3 py-3 text-slate-600 text-sm">{student.branch}</td>
                            <td className="px-3 py-3 text-slate-600 text-sm">{student.semester}</td>
                            <td className="px-3 py-3 text-slate-600 text-sm">{student.section || 'N/A'}</td>
                            <td className="px-3 py-3 text-slate-600 text-sm">{student.counsellor || 'N/A'}</td>
                            <td className="px-3 py-3">
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                feeDue <= 0 ? 'bg-green-100 text-green-700' :
                                feeDue < 10000 ? 'bg-yellow-100 text-yellow-700' :
                                'bg-red-100 text-red-700'
                              }`}>
                                {feeDue <= 0 ? 'Paid' : `₹${feeDue.toLocaleString()}`}
                              </span>
                            </td>
                            <td className="px-3 py-3">
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => {
                                    setProfRegdNo(student.regd_no);
                                    setProfileData({
                                      name: student.name,
                                      email: student.email,
                                      mobile: student.mobile,
                                      branch: student.branch,
                                      semester: student.semester,
                                      section: student.section,
                                      counsellor: student.counsellor,
                                      cgpa: student.cgpa,
                                      sgpa: student.sgpa,
                                      totalTuitionFee: student.total_tuition_fee,
                                      scholarshipApplied: student.scholarship_applied,
                                      netPayableAmount: student.net_payable_amount,
                                      amountPaid: student.amount_paid
                                    });
                                    setActiveTab('Student Profile');
                                  }}
                                  className="flex items-center gap-1 px-3 py-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-lg font-bold text-xs transition-colors"
                                  title="Edit Profile"
                                >
                                  <Edit size={14} /> Edit Profile
                                </button>
                                <button
                                  onClick={() => deleteStudent(student.regd_no)}
                                  className="p-1 text-red-600 hover:bg-red-50 rounded"
                                  title="Delete Student"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-200">
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                    disabled={pagination.page === 1}
                    className="px-4 py-2 text-sm bg-white border border-slate-200 rounded-lg disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <span className="text-sm text-slate-600">
                    Page {pagination.page} of {pagination.totalPages}
                  </span>
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                    disabled={pagination.page === pagination.totalPages}
                    className="px-4 py-2 text-sm bg-white border border-slate-200 rounded-lg disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Noticeboard Tab */}
          {activeTab === 'Noticeboard' && (
            <div>
              <h2 className="text-xl font-semibold text-slate-900 mb-6">Noticeboard Management</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Notice Title</label>
                  <input
                    type="text"
                    value={notice.title}
                    onChange={(e) => setNotice(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Enter notice title"
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Notice Type</label>
                  <select
                    value={notice.type}
                    onChange={(e) => setNotice(prev => ({ ...prev, type: e.target.value }))}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg"
                  >
                    <option value="Notice">Notice</option>
                    <option value="Exam">Exam</option>
                    <option value="Alert">Alert</option>
                    <option value="Event">Event</option>
                    <option value="General">General</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-2">Message</label>
                  <textarea
                    value={notice.message}
                    onChange={(e) => setNotice(prev => ({ ...prev, message: e.target.value }))}
                    placeholder="Enter notice message"
                    rows={4}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Target Student (Optional)</label>
                  <input
                    type="text"
                    value={notice.targetRegdNo}
                    onChange={(e) => setNotice(prev => ({ ...prev, targetRegdNo: e.target.value }))}
                    placeholder="Registration number"
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    onClick={postNotice}
                    className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                  >
                    <Bell className="w-4 h-4" />
                    Post Notice
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Enter Marks Tab */}
          {activeTab === 'Enter Marks' && (
            <div>
              <h2 className="text-xl font-semibold text-slate-900 mb-6">Bulk Marks Entry</h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Section</label>
                  <input
                    type="text"
                    value={marksEntry.section}
                    onChange={(e) => setMarksEntry(prev => ({ ...prev, section: e.target.value }))}
                    placeholder="e.g., A, B, C"
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Subject</label>
                  <input
                    type="text"
                    value={marksEntry.subject}
                    onChange={(e) => setMarksEntry(prev => ({ ...prev, subject: e.target.value }))}
                    placeholder="Subject name"
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Test Type</label>
                  <select
                    value={marksEntry.testType}
                    onChange={(e) => setMarksEntry(prev => ({ ...prev, testType: e.target.value }))}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg"
                  >
                    <option value="M1">M1</option>
                    <option value="Pre-T1">Pre-T1</option>
                    <option value="T2">T2</option>
                    <option value="T3">T3</option>
                    <option value="T4">T4</option>
                    <option value="T5">T5</option>
                    <option value="Internal-1">Internal-1</option>
                    <option value="Internal-2">Internal-2</option>
                    <option value="Internal-3">Internal-3</option>
                    <option value="Internal-4">Internal-4</option>
                    <option value="Grades">Grades</option>
                  </select>
                </div>
                <div className="flex items-end">
                  <button
                    onClick={bulkMarksEntry}
                    className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    <Save className="w-4 h-4" />
                    Save Marks
                  </button>
                </div>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <p className="text-sm text-amber-800">
                  <strong>Note:</strong> Add marks for students in the section above. Use the format: Regd No, Marks, Max Marks, Grade.
                </p>
              </div>
            </div>
          )}

          {/* Attendance Tab */}
          {activeTab === 'Attendance' && (
            <div>
              <h2 className="text-xl font-semibold text-slate-900 mb-6">Attendance Management</h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Student Regd No</label>
                  <input
                    type="text"
                    value={attForm.regdNo}
                    onChange={(e) => setAttForm(prev => ({ ...prev, regdNo: e.target.value }))}
                    placeholder="Registration number"
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Attended Classes</label>
                  <input
                    type="number"
                    value={attForm.attendedClasses}
                    onChange={(e) => setAttForm(prev => ({ ...prev, attendedClasses: e.target.value }))}
                    placeholder="Number attended"
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Total Classes</label>
                  <input
                    type="number"
                    value={attForm.totalClasses}
                    onChange={(e) => setAttForm(prev => ({ ...prev, totalClasses: e.target.value }))}
                    placeholder="Total classes"
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    onClick={updateAttendance}
                    className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    <UserCheck className="w-4 h-4" />
                    Update Attendance
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Auto-Generate Tab */}
          {activeTab === 'Auto-Generate' && (
            <div>
              <h2 className="text-xl font-semibold text-slate-900 mb-6">Auto-Generate Attendance</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Branch (Optional)</label>
                  <select
                    value={autoGenForm.branch}
                    onChange={(e) => setAutoGenForm(prev => ({ ...prev, branch: e.target.value }))}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg"
                  >
                    <option value="">All Branches</option>
                    <option value="CSE">CSE</option>
                    <option value="ECE">ECE</option>
                    <option value="EEE">EEE</option>
                    <option value="MECH">MECH</option>
                    <option value="CIVIL">CIVIL</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Semester (Optional)</label>
                  <select
                    value={autoGenForm.semester}
                    onChange={(e) => setAutoGenForm(prev => ({ ...prev, semester: e.target.value }))}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg"
                  >
                    <option value="">All Semesters</option>
                    {[1,2,3,4,5,6,7,8].map(s => (
                      <option key={s} value={s}>Semester {s}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-end">
                  <button
                    onClick={autoGenerateAttendance}
                    className="flex items-center gap-2 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Generate Attendance
                  </button>
                </div>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>Auto-Generation Logic:</strong> Attendance will be generated based on CGPA ranges:
                  <br />• 8.5+ CGPA: 95-100% attendance
                  <br />• 8.0-8.5 CGPA: 80-95% attendance
                  <br />• 7.0-8.0 CGPA: 75-80% attendance
                  <br />• 6.5-7.0 CGPA: 65-75% attendance
                  <br />• Below 6.5 CGPA: 55-65% attendance
                </p>
              </div>
            </div>
          )}

          {/* Bulk Data Entry Tab */}
          {activeTab === 'Bulk Data Entry' && (
            <div>
              <h2 className="text-xl font-semibold text-slate-900 mb-6">Bulk Student Data Entry</h2>
              
              {/* Import Mode Selector */}
              <div className="mb-6">
                <div className="flex gap-4 mb-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="importMode"
                      value="manual"
                      checked={bulkData.importMode === 'manual'}
                      onChange={(e) => setBulkData(prev => ({ ...prev, importMode: e.target.value }))}
                      className="mr-2"
                    />
                    Manual Entry
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="importMode"
                      value="csv"
                      checked={bulkData.importMode === 'csv'}
                      onChange={(e) => setBulkData(prev => ({ ...prev, importMode: e.target.value }))}
                      className="mr-2"
                    />
                    CSV Import
                  </label>
                </div>
              </div>

              {bulkData.importMode === 'csv' ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">CSV Data</label>
                    <textarea
                      value={bulkData.csvText}
                      onChange={(e) => setBulkData(prev => ({ ...prev, csvText: e.target.value }))}
                      placeholder="Paste CSV data here. First row should be headers: regd_no, name, mobile, email, cgpa, sgpa, semester, branch, counsellor, total_tuition_fee, scholarship_applied, net_payable_amount, amount_paid"
                      rows={10}
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg font-mono text-sm"
                    />
                  </div>
                  <div className="flex gap-4">
                    <button
                      onClick={parseCSV}
                      className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      <FileText className="w-4 h-4" />
                      Parse CSV
                    </button>
                    <button
                      onClick={addBulkStudents}
                      disabled={bulkData.students.length === 0}
                      className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                    >
                      <Plus className="w-4 h-4" />
                      Add {bulkData.students.length} Students
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium text-slate-900">Students to Add ({bulkData.students.length})</h3>
                    <button
                      onClick={addManualStudent}
                      className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                    >
                      <Plus className="w-4 h-4" />
                      Add Student
                    </button>
                  </div>

                  {bulkData.students.length > 0 && (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-slate-50 border-b border-slate-200">
                          <tr>
                            <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500 uppercase">Regd No</th>
                            <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500 uppercase">Name</th>
                            <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500 uppercase">Mobile</th>
                            <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500 uppercase">Branch</th>
                            <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500 uppercase">CGPA</th>
                            <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500 uppercase">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {bulkData.students.map((student, index) => (
                            <tr key={index} className="hover:bg-slate-50">
                              <td className="px-3 py-2">
                                <input
                                  type="text"
                                  value={student.regd_no}
                                  onChange={(e) => updateManualStudent(index, 'regd_no', e.target.value)}
                                  className="w-full px-2 py-1 border border-slate-200 rounded text-sm"
                                  placeholder="Regd No"
                                />
                              </td>
                              <td className="px-3 py-2">
                                <input
                                  type="text"
                                  value={student.name}
                                  onChange={(e) => updateManualStudent(index, 'name', e.target.value)}
                                  className="w-full px-2 py-1 border border-slate-200 rounded text-sm"
                                  placeholder="Name"
                                />
                              </td>
                              <td className="px-3 py-2">
                                <input
                                  type="text"
                                  value={student.mobile}
                                  onChange={(e) => updateManualStudent(index, 'mobile', e.target.value)}
                                  className="w-full px-2 py-1 border border-slate-200 rounded text-sm"
                                  placeholder="Mobile"
                                />
                              </td>
                              <td className="px-3 py-2">
                                <select
                                  value={student.branch}
                                  onChange={(e) => updateManualStudent(index, 'branch', e.target.value)}
                                  className="w-full px-2 py-1 border border-slate-200 rounded text-sm"
                                >
                                  <option value="">Branch</option>
                                  <option value="CSE">CSE</option>
                                  <option value="ECE">ECE</option>
                                  <option value="EEE">EEE</option>
                                  <option value="MECH">MECH</option>
                                  <option value="CIVIL">CIVIL</option>
                                </select>
                              </td>
                              <td className="px-3 py-2">
                                <input
                                  type="number"
                                  step="0.01"
                                  value={student.cgpa}
                                  onChange={(e) => updateManualStudent(index, 'cgpa', e.target.value)}
                                  className="w-full px-2 py-1 border border-slate-200 rounded text-sm"
                                  placeholder="CGPA"
                                />
                              </td>
                              <td className="px-3 py-2">
                                <button
                                  onClick={() => removeManualStudent(index)}
                                  className="p-1 text-red-600 hover:bg-red-50 rounded"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {bulkData.students.length > 0 && (
                    <div className="flex justify-end">
                      <button
                        onClick={addBulkStudents}
                        className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                      >
                        <Save className="w-4 h-4" />
                        Add All Students
                      </button>
                    </div>
                  )}
                </div>
              )}

              <div className="mt-6 bg-amber-50 border border-amber-200 rounded-lg p-4">
                <p className="text-sm text-amber-800">
                  <strong>CSV Format:</strong> First row should contain headers. Supported headers: regd_no, name, mobile, email, cgpa, sgpa, semester, branch, counsellor, total_tuition_fee, scholarship_applied, net_payable_amount, amount_paid
                </p>
              </div>
            </div>
          )}

          {/* Student Profile Tab */}
          {activeTab === 'Student Profile' && (
            <div>
              <h2 className="text-xl font-semibold text-slate-900 mb-6">Student Profile Management</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Student Regd No</label>
                  <input
                    type="text"
                    value={profRegdNo}
                    onChange={(e) => setProfRegdNo(e.target.value)}
                    placeholder="Registration number"
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Name</label>
                  <input
                    type="text"
                    value={profileData.name}
                    onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Student name"
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
                  <input
                    type="email"
                    value={profileData.email}
                    onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="Email address"
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Mobile</label>
                  <input
                    type="tel"
                    value={profileData.mobile}
                    onChange={(e) => setProfileData(prev => ({ ...prev, mobile: e.target.value }))}
                    placeholder="Mobile number"
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Branch</label>
                  <select
                    value={profileData.branch}
                    onChange={(e) => setProfileData(prev => ({ ...prev, branch: e.target.value }))}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg"
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
                  <label className="block text-sm font-medium text-slate-700 mb-2">Semester</label>
                  <select
                    value={profileData.semester}
                    onChange={(e) => setProfileData(prev => ({ ...prev, semester: e.target.value }))}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg"
                  >
                    <option value="">Select Semester</option>
                    {[1,2,3,4,5,6,7,8].map(s => (
                      <option key={s} value={s}>Semester {s}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Section</label>
                  <input
                    type="text"
                    value={profileData.section}
                    onChange={(e) => setProfileData(prev => ({ ...prev, section: e.target.value }))}
                    placeholder="Section (A, B, C)"
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Counsellor</label>
                  <input
                    type="text"
                    value={profileData.counsellor}
                    onChange={(e) => setProfileData(prev => ({ ...prev, counsellor: e.target.value }))}
                    placeholder="Counsellor name"
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">CGPA</label>
                  <input
                    type="number"
                    step="0.01"
                    value={profileData.cgpa}
                    onChange={(e) => setProfileData(prev => ({ ...prev, cgpa: e.target.value }))}
                    placeholder="CGPA"
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">SGPA</label>
                  <input
                    type="number"
                    step="0.01"
                    value={profileData.sgpa}
                    onChange={(e) => setProfileData(prev => ({ ...prev, sgpa: e.target.value }))}
                    placeholder="SGPA"
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Total Tuition Fee</label>
                  <input
                    type="number"
                    value={profileData.totalTuitionFee}
                    onChange={(e) => setProfileData(prev => ({ ...prev, totalTuitionFee: e.target.value }))}
                    placeholder="Total fee amount"
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Scholarship Applied</label>
                  <input
                    type="number"
                    value={profileData.scholarshipApplied}
                    onChange={(e) => setProfileData(prev => ({ ...prev, scholarshipApplied: e.target.value }))}
                    placeholder="Scholarship amount"
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Net Payable Amount</label>
                  <input
                    type="number"
                    value={profileData.netPayableAmount}
                    onChange={(e) => setProfileData(prev => ({ ...prev, netPayableAmount: e.target.value }))}
                    placeholder="Net payable amount"
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Amount Paid</label>
                  <input
                    type="number"
                    value={profileData.amountPaid}
                    onChange={(e) => setProfileData(prev => ({ ...prev, amountPaid: e.target.value }))}
                    placeholder="Amount paid"
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>
              <button
                onClick={updateStudentProfile}
                className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                <Save className="w-4 h-4" />
                Update Profile
              </button>
            </div>
          )}
        </div>

        {/* CGPA Distribution Chart */}
        {stats?.cgpaDistribution && (
          <div className="mt-6 bg-white rounded-xl shadow-sm border border-slate-100 p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">CGPA Distribution</h3>
            <div className="space-y-3">
              {stats.cgpaDistribution.map((item) => (
                <div key={item.range} className="flex items-center gap-4">
                  <span className="w-20 text-sm text-slate-600">{item.range}</span>
                  <div className="flex-1 h-6 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                      style={{ 
                        width: `${(item.count / stats.totalStudents) * 100}%`,
                        minWidth: item.count > 0 ? '4px' : '0'
                      }}
                    />
                  </div>
                  <span className="w-12 text-sm text-slate-600 text-right">{item.count}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Toast */}
      {toast.msg && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast({ msg: '' })} />}
    </div>
  );
}
