import React from 'react';

export default function AdminTest({ onAdminLogout }) {
  console.log('AdminTest component rendering');
  
  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Admin Test Dashboard</h1>
        <p className="text-gray-600 mb-4">This is a simple test to check if admin dashboard loads.</p>
        
        <div className="bg-green-100 border border-green-300 p-4 rounded-lg mb-4">
          <h3 className="font-bold text-green-800">✅ Admin Test Successful!</h3>
          <p className="text-green-700">The admin dashboard component is working.</p>
        </div>
        
        <button 
          onClick={onAdminLogout}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
          Logout
        </button>
      </div>
    </div>
  );
}
