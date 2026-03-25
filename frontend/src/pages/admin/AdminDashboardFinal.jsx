import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  LogOut, Users, GraduationCap, TrendingUp, Filter, 
  Search, Download, Trash2, Eye, Award, Smartphone,
  CheckCircle, XCircle, AlertCircle, BarChart3, BookOpen
} from 'lucide-react';

export default function AdminDashboard({ onAdminLogout }) {
  const [students, setStudents] = useState([]);
  const [stats, setStats] = useState(null);
  const [twilioStatus, setTwilioStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
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

  const [activeTab, setActiveTab] = useState('all'); // all, toppers, filters
  const navigate = useNavigate();

  const adminToken = localStorage.getItem('adminToken');

  useEffect(() => {
    if (!adminToken) {
      navigate('/admin/login');
      return;
    }
    fetchDashboardData();
    fetchTwilioStatus();
  }, []);

  useEffect(() => {
    fetchStudents();
  }, [filters, pagination.page, pagination.limit]);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/admin/stats', {
        headers: { 
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  const fetchTwilioStatus = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/admin/twilio-status', {
        headers: { 
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        }
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
        headers: { 
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        }
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
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTopPerformers = async (category) => {
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:5000/api/admin/students/top-performers?category=${category}&limit=20`, {
        headers: { 
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        setStudents(data.data);
      }
    } catch (err) {
      console.error('Error fetching top performers:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminData');
    onAdminLogout();
    navigate('/admin/login');
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

  const deleteStudent = async (regdNo) => {
    if (!confirm(`Are you sure you want to delete student ${regdNo}?`)) return;
    
    try {
      const response = await fetch(`http://localhost:5000/api/admin/student/${regdNo}`, {
        method: 'DELETE',
        headers: { 
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        }
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

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Header */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Admin Dashboard</h1>
                <p className="text-xs text-slate-500">Student Results Management</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Twilio Status */}
              {twilioStatus && (
                <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
                  twilioStatus.connected 
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                    : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                }`}>
                  <Smartphone className="w-4 h-4" />
                  {twilioStatus.connected ? 'Twilio Connected' : 'Twilio Not Connected'}
                </div>
              )}
              
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 
                         dark:hover:bg-red-900/20 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white dark:bg-slate-900 rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Total Students</p>
                  <p className="text-3xl font-bold text-slate-900 dark:text-slate-100">{stats.totalStudents}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Branches</p>
                  <p className="text-3xl font-bold text-slate-900 dark:text-slate-100">{stats.byBranch.length}</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Fee Collected</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                    ₹{(parseFloat(stats.feeSummary.total_collected) / 100000).toFixed(2)}L
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Fee Due</p>
                  <p className="text-2xl font-bold text-red-600">
                    ₹{(parseFloat(stats.feeSummary.total_due) / 100000).toFixed(2)}L
                  </p>
                </div>
                <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-red-600" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => { setActiveTab('all'); fetchStudents(); }}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'all' 
                ? 'bg-indigo-600 text-white' 
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
            }`}
          >
            All Students
          </button>
          <button
            onClick={() => { setActiveTab('toppers'); fetchTopPerformers('cgpa'); }}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'toppers' 
                ? 'bg-indigo-600 text-white' 
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
            }`}
          >
            <Award className="w-4 h-4 inline mr-1" />
            Top Performers
          </button>
          <button
            onClick={() => setActiveTab('filters')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'filters' 
                ? 'bg-indigo-600 text-white' 
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
            }`}
          >
            <Filter className="w-4 h-4 inline mr-1" />
            Advanced Filters
          </button>
        </div>

        {/* Filters Panel */}
        {activeTab === 'filters' && (
          <div className="bg-white dark:bg-slate-900 rounded-xl p-6 shadow-sm mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Search (Regd/Name/Mobile)
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={filters.search}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                    placeholder="Search students..."
                    className="w-full pl-10 pr-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg 
                             bg-slate-50 dark:bg-slate-800 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  CGPA Range
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="10"
                    value={filters.cgpa_min}
                    onChange={(e) => handleFilterChange('cgpa_min', e.target.value)}
                    placeholder="Min"
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg 
                             bg-slate-50 dark:bg-slate-800 text-sm"
                  />
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="10"
                    value={filters.cgpa_max}
                    onChange={(e) => handleFilterChange('cgpa_max', e.target.value)}
                    placeholder="Max"
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg 
                             bg-slate-50 dark:bg-slate-800 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Branch
                </label>
                <select
                  value={filters.branch}
                  onChange={(e) => handleFilterChange('branch', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg 
                           bg-slate-50 dark:bg-slate-800 text-sm"
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
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Semester
                </label>
                <select
                  value={filters.semester}
                  onChange={(e) => handleFilterChange('semester', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg 
                           bg-slate-50 dark:bg-slate-800 text-sm"
                >
                  <option value="">All Semesters</option>
                  {[1,2,3,4,5,6,7,8].map(s => (
                    <option key={s} value={s}>Semester {s}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Section
                </label>
                <input
                  type="text"
                  value={filters.section}
                  onChange={(e) => handleFilterChange('section', e.target.value)}
                  placeholder="e.g., A, B, C"
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg 
                           bg-slate-50 dark:bg-slate-800 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Min Attendance %
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={filters.attendance_min}
                  onChange={(e) => handleFilterChange('attendance_min', e.target.value)}
                  placeholder="e.g., 75"
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg 
                           bg-slate-50 dark:bg-slate-800 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Sort By
                </label>
                <select
                  value={filters.sort_by}
                  onChange={(e) => handleFilterChange('sort_by', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg 
                           bg-slate-50 dark:bg-slate-800 text-sm"
                >
                  <option value="regd_no">Registration No</option>
                  <option value="name">Name</option>
                  <option value="cgpa">CGPA</option>
                  <option value="sgpa">SGPA</option>
                  <option value="semester">Semester</option>
                  <option value="attendance">Attendance</option>
                </select>
              </div>

              <div className="flex items-end">
                <button
                  onClick={clearFilters}
                  className="w-full px-4 py-2 text-slate-600 hover:bg-slate-100 
                           dark:text-slate-400 dark:hover:bg-slate-800 rounded-lg transition-colors"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Top Performers Quick Select */}
        {activeTab === 'toppers' && (
          <div className="flex flex-wrap gap-2 mb-4">
            {['cgpa', 'sgpa', 'attendance', 'coding', 'competitions'].map(cat => (
              <button
                key={cat}
                onClick={() => fetchTopPerformers(cat)}
                className="px-3 py-1 text-sm bg-white dark:bg-slate-800 border border-slate-200 
                         dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700
                         capitalize"
              >
                Top by {cat}
              </button>
            ))}
          </div>
        )}

        {/* Actions Bar */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-slate-500 text-sm">
            Showing {students.length} of {pagination.total} students
          </p>
          <button
            onClick={exportData}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 
                     text-white rounded-lg transition-colors text-sm"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>

        {/* Students Table */}
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Regd No</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Mobile</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">CGPA</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Branch</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Sem</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Section</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Attendance</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Counsellor</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {loading ? (
                  <tr>
                    <td colSpan="10" className="px-4 py-8 text-center">
                      <div className="flex items-center justify-center gap-2 text-slate-500">
                        <div className="w-5 h-5 border-2 border-slate-300 border-t-indigo-600 rounded-full animate-spin" />
                        Loading students...
                      </div>
                    </td>
                  </tr>
                ) : students.length === 0 ? (
                  <tr>
                    <td colColspan="10" className="px-4 py-8 text-center text-slate-500">
                      No students found matching your criteria
                    </td>
                  </tr>
                ) : (
                  students.map((student) => (
                    <tr key={student.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">
                        {student.regd_no}
                      </td>
                      <td className="px-4 py-3 text-slate-700 dark:text-slate-300">
                        {student.name}
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                        {student.mobile}
                      </td>
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
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                        {student.branch}
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                        {student.semester}
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                        {student.section || '-'}
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
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                        {student.counsellor}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => navigate(`/admin/student/${student.regd_no}`)}
                            className="flex items-center gap-1 px-3 py-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-lg font-bold text-xs transition-colors"
                            title="Edit Details"
                          >
                            <Edit size={14} /> Edit Profile
                          </button>
                          <button
                            onClick={() => deleteStudent(student.regd_no)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded"
                            title="Delete"
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
            <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                disabled={pagination.page === 1}
                className="px-3 py-1 text-sm bg-white dark:bg-slate-800 border border-slate-200 
                         dark:border-slate-700 rounded-lg disabled:opacity-50"
              >
                Previous
              </button>
              <span className="text-sm text-slate-600 dark:text-slate-400">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                disabled={pagination.page === pagination.totalPages}
                className="px-3 py-1 text-sm bg-white dark:bg-slate-800 border border-slate-200 
                         dark:border-slate-700 rounded-lg disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </div>

        {/* CGPA Distribution Chart (Simple Visual) */}
        {stats && stats.cgpaDistribution && (
          <div className="mt-8 bg-white dark:bg-slate-900 rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
              CGPA Distribution
            </h3>
            <div className="space-y-3">
              {stats.cgpaDistribution.map((item) => (
                <div key={item.range} className="flex items-center gap-4">
                  <span className="w-20 text-sm text-slate-600 dark:text-slate-400">{item.range}</span>
                  <div className="flex-1 h-6 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                      style={{ 
                        width: `${(item.count / stats.totalStudents) * 100}%`,
                        minWidth: item.count > 0 ? '4px' : '0'
                      }}
                    />
                  </div>
                  <span className="w-12 text-sm text-slate-600 dark:text-slate-400 text-right">
                    {item.count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
