import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Loader2, User, BookOpen, DollarSign, Activity, Plus, Edit, MoreVertical } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

export default function AdminEditStudent() {
  const { regdNo } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [activeTab, setActiveTab] = useState('profile');
  const [showMenu, setShowMenu] = useState(false);

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

  const [subjects, setSubjects] = useState([]);

  const adminToken = localStorage.getItem('adminToken') || localStorage.getItem('admin_token');

  useEffect(() => {
    if (!adminToken) {
      navigate('/admin/login');
      return;
    }
    fetchStudent();
  }, [regdNo]);

  const fetchStudent = async () => {
    try {
      // Unified strictly to the secure Admin API endpoint
      const response = await fetch(`${API_URL}/api/admin/students/${regdNo}`, {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });

      if (!response.ok) throw new Error(`Backend Error ${response.status}: Are you running the correct backend?`);

      const data = await response.json();
      
      if (data.success && data.data) {
        const s = data.data;
        setFormData({
          regd_no: s.registrationNumber || s.regd_no || regdNo,
          name: s.name || '',
          email: s.email || '',
          mobile: s.mobile || '',
          branch: s.branch || '',
          semester: s.semester || '',
          section: s.section || '',
          counsellor: s.counsellor || '',
          cgpa: s.cgpa || '',
          sgpa: s.sgpa || '',
          attendance: s.attendance?.length > 0 ? s.attendance[0].attendance_percentage : (s.attendance || ''),
          total_tuition_fee: s.feeDetails?.totalTuitionFee || s.total_tuition_fee || '',
          scholarship_applied: s.feeDetails?.scholarshipApplied || s.scholarship_applied || '',
          net_payable_amount: s.feeDetails?.netPayableAmount || s.net_payable_amount || '',
          amount_paid: s.feeDetails?.amountPaid || s.amount_paid || ''
        });
        
        setSubjects(s.subjectResults || []);
      } else {
        setMessage({ text: 'Student not found', type: 'error' });
      }
    } catch (err) {
      setMessage({ text: 'Failed to fetch student data', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ text: '', type: '' });

    try {
      // Unified strictly to the secure Admin API update endpoint
      const response = await fetch(`${API_URL}/api/admin/students/${regdNo}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) throw new Error(`Backend Error ${response.status}: Are you running the correct backend?`);

      const data = await response.json();
      if (data.success) {
        setMessage({ text: 'Student updated successfully!', type: 'success' });
        setTimeout(() => navigate('/admin/dashboard'), 1500); // Auto go back after 1.5s
      } else {
        setMessage({ text: data.message || 'Failed to update student', type: 'error' });
      }
    } catch (err) {
      setMessage({ text: err.message || 'Server error. Could not save.', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAddSubject = () => {
    setSubjects([...subjects, { 
      subject: '', pre_t1: '', m1: '', t2: '', t3: '', t4: '', t5_1: '', t5_2: '', t5_3: '', t5_4: '', grade: '', isNew: true 
    }]);
  };

  const handleSubjectChange = (index, field, value) => {
    const newSubjects = [...subjects];
    newSubjects[index][field] = value;
    setSubjects(newSubjects);
  };

  const saveSubject = async (index) => {
    const sub = subjects[index];
    if (!sub.subject) {
      setMessage({ text: 'Subject name is required', type: 'error' });
      return;
    }
    
    try {
      const response = await fetch(`${API_URL}/api/admin/students/${regdNo}/marks`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${adminToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject_name: sub.subject,
          pre_t1: sub.pre_t1 !== '' ? parseFloat(sub.pre_t1) : null,
          m1: sub.m1 !== '' ? parseFloat(sub.m1) : null,
          t2: sub.t2 !== '' ? parseFloat(sub.t2) : null,
          t3: sub.t3 !== '' ? parseFloat(sub.t3) : null,
          t4: sub.t4 !== '' ? parseFloat(sub.t4) : null,
          t5_1: sub.t5_1 !== '' ? parseFloat(sub.t5_1) : null,
          t5_2: sub.t5_2 !== '' ? parseFloat(sub.t5_2) : null,
          t5_3: sub.t5_3 !== '' ? parseFloat(sub.t5_3) : null,
          t5_4: sub.t5_4 !== '' ? parseFloat(sub.t5_4) : null,
          grade: sub.grade
        })
      });

      if (!response.ok) throw new Error(`Backend Error ${response.status}`);

      const data = await response.json();
      if (data.success) {
        setMessage({ text: `Marks saved for ${sub.subject}!`, type: 'success' });
        fetchStudent(); // Refresh to get the generated Final Total and T5 Avg
      } else setMessage({ text: data.message || 'Failed to save marks', type: 'error' });
    } catch(err) { setMessage({ text: err.message || 'Error saving marks', type: 'error' }); }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button 
            onClick={() => navigate(-1)} 
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-100 font-medium"
          >
            <ArrowLeft size={18} /> Back to Dashboard
          </button>
          <h1 className="text-2xl font-bold text-slate-900">Dedicated Edit Mode</h1>
        </div>

        {/* Message Banner */}
        {message.text && (
          <div className={`p-4 mb-6 rounded-lg font-medium flex items-center justify-between ${message.type === 'success' ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-red-100 text-red-800 border border-red-200'}`}>
            {message.text}
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
          <div className="bg-indigo-600 p-6 text-white">
            <h2 className="text-xl font-bold">Editing Student: {formData.name} ({regdNo})</h2>
            <p className="text-indigo-200 text-sm mt-1">Changes made here are permanently saved to the database.</p>
          </div>

          <div className="flex border-b border-slate-200 bg-slate-50 px-6 pt-2 gap-6 relative">
            <button
              onClick={() => setActiveTab('profile')}
              className={`pb-3 font-semibold text-sm border-b-2 transition-colors ${activeTab === 'profile' ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            >
              Profile & Details
            </button>
            <button
              onClick={() => setActiveTab('marks')}
              className={`pb-3 font-semibold text-sm border-b-2 transition-colors ${activeTab === 'marks' ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            >
              Formative Marks
            </button>

            {/* Three Dots Menu for Adding Formative Marks */}
            <div className="ml-auto relative">
              <button 
                type="button"
                onClick={() => setShowMenu(!showMenu)}
                className="p-2 text-slate-500 hover:bg-slate-200 hover:text-slate-800 rounded-full transition-colors mb-2"
              >
                <MoreVertical size={20} />
              </button>
              {showMenu && (
                <div className="absolute right-0 top-full w-56 bg-white border border-slate-200 shadow-xl rounded-xl overflow-hidden z-50">
                  <button 
                    type="button"
                    onClick={() => { setActiveTab('marks'); setShowMenu(false); handleAddSubject(); }}
                    className="w-full text-left px-4 py-3 text-sm text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 font-medium flex items-center gap-2 transition-colors"
                  >
                    <Plus size={16} /> Add Formative Marks
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="p-8">
            {activeTab === 'profile' && (
              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              
                  {/* Personal Info */}
                  <div className="space-y-4">
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 border-b pb-2">
                  <User className="text-indigo-500" size={20} /> Personal Information
                </h3>
                <div>
                  <label className="block text-sm font-semibold text-slate-600 mb-1">Full Name</label>
                  <input required name="name" value={formData.name} onChange={handleChange} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-600 mb-1">Email Address</label>
                  <input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-600 mb-1">Mobile Number</label>
                  <input type="tel" name="mobile" value={formData.mobile} onChange={handleChange} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
              </div>

              {/* Academic Info */}
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 border-b pb-2">
                  <BookOpen className="text-indigo-500" size={20} /> Academic Information
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-600 mb-1">Branch</label>
                    <input name="branch" value={formData.branch} onChange={handleChange} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-600 mb-1">Semester</label>
                    <input type="number" name="semester" value={formData.semester} onChange={handleChange} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-600 mb-1">Section</label>
                    <input name="section" value={formData.section} onChange={handleChange} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-600 mb-1">Counsellor</label>
                    <input name="counsellor" value={formData.counsellor} onChange={handleChange} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
                  </div>
                </div>
              </div>

              {/* Performance */}
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 border-b pb-2">
                  <Activity className="text-indigo-500" size={20} /> Performance
                </h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-600 mb-1">CGPA</label>
                    <input type="number" step="0.01" max="10" name="cgpa" value={formData.cgpa} onChange={handleChange} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-600 mb-1">SGPA</label>
                    <input type="number" step="0.01" max="10" name="sgpa" value={formData.sgpa} onChange={handleChange} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-600 mb-1">Attendance %</label>
                    <input type="number" step="0.1" max="100" name="attendance" value={formData.attendance} onChange={handleChange} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
                  </div>
                </div>
              </div>

              {/* Finance */}
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 border-b pb-2">
                  <DollarSign className="text-indigo-500" size={20} /> Fees & Finance
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-600 mb-1">Total Tuition Fee (₹)</label>
                    <input type="number" name="total_tuition_fee" value={formData.total_tuition_fee} onChange={handleChange} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-600 mb-1">Scholarship (₹)</label>
                    <input type="number" name="scholarship_applied" value={formData.scholarship_applied} onChange={handleChange} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-600 mb-1">Net Payable (₹)</label>
                    <input type="number" name="net_payable_amount" value={formData.net_payable_amount} onChange={handleChange} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-600 mb-1">Amount Paid (₹)</label>
                    <input type="number" name="amount_paid" value={formData.amount_paid} onChange={handleChange} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
                  </div>
                </div>
              </div>

                {/* Submit Button */}
                <div className="mt-10 pt-6 border-t border-slate-200 flex justify-end">
                  <button 
                    type="submit" 
                    disabled={saving}
                    className="flex items-center gap-2 px-8 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-lg hover:shadow-xl transition-all disabled:opacity-70"
                  >
                    {saving ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
                    Save All Changes
                  </button>
                </div>
              </form>
            )}

            {activeTab === 'marks' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b pb-2">
                  <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <Edit className="text-indigo-500" size={20} /> Formative Marks & Subjects
                  </h3>
                  <button 
                    type="button" 
                    onClick={handleAddSubject}
                    className="flex items-center gap-1 px-3 py-1.5 bg-green-100 text-green-700 hover:bg-green-200 rounded-lg text-sm font-bold transition-colors"
                  >
                    <Plus size={16} /> Add Subject
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left border border-slate-200 rounded-lg overflow-hidden">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                    <tr>
                      <th className="px-3 py-2 font-semibold">Subject</th>
                      <th className="px-2 py-2 font-semibold">Pre-T1</th>
                      <th className="px-2 py-2 font-semibold">M1</th>
                      <th className="px-2 py-2 font-semibold">T2</th>
                      <th className="px-2 py-2 font-semibold">T3</th>
                      <th className="px-2 py-2 font-semibold">T4</th>
                      <th className="px-2 py-2 font-semibold" title="T5 Internals 1 to 4">T5 (1,2,3,4)</th>
                      <th className="px-2 py-2 font-semibold">Grade</th>
                      <th className="px-3 py-2 font-semibold text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {subjects.map((sub, index) => (
                      <tr key={index} className="hover:bg-slate-50">
                        <td className="px-3 py-2">
                          <input value={sub.subject || ''} onChange={(e) => handleSubjectChange(index, 'subject', e.target.value)} disabled={!sub.isNew} placeholder="Subject Name" className="w-28 px-2 py-1 border rounded outline-none focus:ring-1 focus:ring-indigo-500 disabled:bg-slate-100" />
                        </td>
                        <td className="px-2 py-2"><input value={sub.pre_t1 ?? ''} onChange={(e) => handleSubjectChange(index, 'pre_t1', e.target.value)} type="number" className="w-12 px-1 py-1 border rounded outline-none" /></td>
                        <td className="px-2 py-2"><input value={sub.m1 ?? ''} onChange={(e) => handleSubjectChange(index, 'm1', e.target.value)} type="number" className="w-12 px-1 py-1 border rounded outline-none" /></td>
                        <td className="px-2 py-2"><input value={sub.t2 ?? ''} onChange={(e) => handleSubjectChange(index, 't2', e.target.value)} type="number" className="w-12 px-1 py-1 border rounded outline-none" /></td>
                        <td className="px-2 py-2"><input value={sub.t3 ?? ''} onChange={(e) => handleSubjectChange(index, 't3', e.target.value)} type="number" className="w-12 px-1 py-1 border rounded outline-none" /></td>
                        <td className="px-2 py-2"><input value={sub.t4 ?? ''} onChange={(e) => handleSubjectChange(index, 't4', e.target.value)} type="number" className="w-12 px-1 py-1 border rounded outline-none" /></td>
                        <td className="px-2 py-2 flex gap-1">
                          <input value={sub.t5_1 ?? ''} onChange={(e) => handleSubjectChange(index, 't5_1', e.target.value)} type="number" placeholder="1" className="w-10 px-1 py-1 border rounded outline-none" />
                          <input value={sub.t5_2 ?? ''} onChange={(e) => handleSubjectChange(index, 't5_2', e.target.value)} type="number" placeholder="2" className="w-10 px-1 py-1 border rounded outline-none" />
                          <input value={sub.t5_3 ?? ''} onChange={(e) => handleSubjectChange(index, 't5_3', e.target.value)} type="number" placeholder="3" className="w-10 px-1 py-1 border rounded outline-none" />
                          <input value={sub.t5_4 ?? ''} onChange={(e) => handleSubjectChange(index, 't5_4', e.target.value)} type="number" placeholder="4" className="w-10 px-1 py-1 border rounded outline-none" />
                        </td>
                        <td className="px-2 py-2"><input value={sub.grade ?? ''} onChange={(e) => handleSubjectChange(index, 'grade', e.target.value)} type="text" className="w-12 px-1 py-1 border rounded outline-none" placeholder="S/A" /></td>
                        <td className="px-3 py-2 text-center">
                          <button type="button" onClick={() => saveSubject(index)} className="text-xs bg-indigo-100 text-indigo-700 px-3 py-1.5 rounded font-bold hover:bg-indigo-200 transition-colors">Save</button>
                        </td>
                      </tr>
                    ))}
                    {subjects.length === 0 && (
                      <tr><td colSpan="9" className="text-center py-6 text-slate-500">No subjects found. Click "+ Add Subject" to begin.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}