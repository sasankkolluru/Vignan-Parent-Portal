import React, { useState, useEffect } from 'react';
import { Loader2, School, UserCheck, LogOut } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function AdminDashboard({ onAdminLogout }) {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  const getToken = () => localStorage.getItem('admin_token');

  useEffect(() => { 
    fetchStudents(); 
  }, []);

  const fetchStudents = async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/students`, {
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      if (res.status === 401 || res.status === 403) { 
        onAdminLogout(); 
        return; 
      }
      const data = await res.json();
      if (data.success) setStudents(data.data);
    } catch (err) { 
      console.error(err); 
    } finally { 
      setLoading(false); 
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 bg-indigo-600 rounded-lg flex items-center justify-center">
            <School size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-600">Vignan's Institute of Information Technology</p>
          </div>
        </div>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
            <UserCheck size={18} className="text-gray-700" />
          </div>
          <span className="font-semibold text-gray-900">Administrator</span>
          <button 
            onClick={onAdminLogout}
            className="ml-auto px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            <LogOut size={16} className="inline mr-2" />
            Logout
          </button>
        </div>

        <div className="border-t pt-6">
          <h2 className="text-lg font-semibold mb-4">Students ({students.length})</h2>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
              <span className="ml-2 text-gray-600">Loading students...</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="text-left p-3 border-b">Reg No</th>
                    <th className="text-left p-3 border-b">Name</th>
                    <th className="text-left p-3 border-b">Branch</th>
                    <th className="text-left p-3 border-b">CGPA</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((student) => (
                    <tr key={student.id} className="hover:bg-gray-50">
                      <td className="p-3 border-b font-medium">{student.regd_no}</td>
                      <td className="p-3 border-b">{student.name}</td>
                      <td className="p-3 border-b">{student.branch}</td>
                      <td className="p-3 border-b">{student.cgpa || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {students.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No students found
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
