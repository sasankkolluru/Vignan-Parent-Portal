import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  LogOut, Users, GraduationCap, TrendingUp, Filter, 
  Search, Download, Trash2, Eye, Award, Smartphone,
  CheckCircle, XCircle, AlertCircle, BarChart3, BookOpen,
  Edit, Save, Plus, X, RefreshCw, ChevronLeft, ChevronRight
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
  
  // View states
  const [viewMode, setViewMode] = useState('list'); // 'list', 'edit', 'add'
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [editMode, setEditMode] = useState(false);
  
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
    limit: 50,
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
    fetchAllStudents();
  }, []);

  useEffect(() => {
    fetchAllStudents();
  }, [filters, pagination.page, pagination.limit]);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/admin/stats`, {
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
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/admin/twilio-status`, {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });
      const data = await response.json();
      setTwilioStatus(data);
    } catch (err) {
      console.error('Error fetching Twilio status:', err);
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

      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/admin/students?${queryParams}`, {
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
    } catch (err) {
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
    } catch (err) {
      showToast('Server error', 'error');
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const clearFilters = () => {
    setFilters({
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
  };

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
    a.download = `all_students_export_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminData');
    onAdminLogout();
    navigate('/admin/login');
  };

  // List View
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

          {/* Filters and Actions */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 mb-6">
            <div className="flex flex-wrap items-center gap-4 mb-4">
              <h3 className="text-lg font-semibold text-slate-900">Filters</h3>
              <button
                onClick={clearFilters}
                className="px-3 py-1 text-sm text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Clear All
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
                placeholder="Search students..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="px-3 py-2 border border-slate-200 rounded-lg text-sm"
              />
              
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

          {/* Students Table */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900">
                All Students ({pagination.total} total)
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Regd No</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Name</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Email</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Mobile</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Branch</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Semester</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">CGPA</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Attendance</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {loading ? (
                    <tr>
                      <td colSpan="9" className="px-4 py-8 text-center">
                        <div className="flex items-center justify-center gap-2 text-slate-500">
                          <div className="w-5 h-5 border-2 border-slate-300 border-t-indigo-600 rounded-full animate-spin" />
                          Loading students...
                        </div>
                      </td>
                    </tr>
                  ) : students.length === 0 ? (
                    <tr>
                      <td colSpan="9" className="px-4 py-8 text-center text-slate-500">
                        No students found matching your criteria
                      </td>
                    </tr>
                  ) : (
                    students.map((student) => (
                      <tr key={student.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 font-medium text-slate-900">{student.regd_no}</td>
                        <td className="px-4 py-3 text-slate-700">{student.name}</td>
                        <td className="px-4 py-3 text-slate-600 text-sm">{student.email}</td>
                        <td className="px-4 py-3 text-slate-600">{student.mobile}</td>
                        <td className="px-4 py-3 text-slate-600">{student.branch}</td>
                        <td className="px-4 py-3 text-slate-600">{student.semester}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            (student.cgpa >= 9) ? 'bg-green-100 text-green-700' :
                            (student.cgpa >= 8) ? 'bg-blue-100 text-blue-700' :
                            (student.cgpa >= 7) ? 'bg-yellow-100 text-yellow-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {student.cgpa || 'N/A'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-sm ${
                            (student.attendance >= 75) ? 'text-green-600' :
                            (student.attendance >= 60) ? 'text-yellow-600' :
                            'text-red-600'
                          }`}>
                            {student.attendance ? `${student.attendance}%` : '-'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleEditStudent(student)}
                              className="flex items-center gap-1 px-3 py-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-lg font-bold text-xs transition-colors"
                              title="Edit Profile"
                            >
                              <Edit size={14} /> Edit Profile
                            </button>
                            <button
                              onClick={() => handleDeleteStudent(student.regd_no)}
                              className="flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg font-bold text-xs transition-colors"
                              title="Delete"
                            >
                              <Trash2 size={14} />
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
              <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between">
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
        </main>

        {/* Toast */}
        {toast.msg && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast({ msg: '' })} />}
      </div>
    );
  }

  // Edit View
  if (viewMode === 'edit') {
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
