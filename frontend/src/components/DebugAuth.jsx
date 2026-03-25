import React from 'react';

export default function DebugAuth({ isAdminAuthenticated, setIsAdminAuthenticated }) {
  React.useEffect(() => {
    console.log('DebugAuth - isAdminAuthenticated:', isAdminAuthenticated);
    console.log('DebugAuth - localStorage adminToken:', localStorage.getItem('adminToken'));
    console.log('DebugAuth - component re-rendered');
  }, [isAdminAuthenticated]);

  React.useEffect(() => {
    const interval = setInterval(() => {
      console.log('DebugAuth - Interval check - isAdminAuthenticated:', isAdminAuthenticated);
      console.log('DebugAuth - Interval check - adminToken:', localStorage.getItem('adminToken'));
    }, 2000);

    return () => clearInterval(interval);
  }, [isAdminAuthenticated]);

  return (
    <div className="fixed top-4 right-4 bg-yellow-100 border border-yellow-300 p-4 rounded-lg z-50">
      <h4 className="font-bold text-sm">Debug Info:</h4>
      <p className="text-xs">isAdminAuthenticated: {isAdminAuthenticated.toString()}</p>
      <p className="text-xs">adminToken: {localStorage.getItem('adminToken') ? 'exists' : 'none'}</p>
      <button 
        onClick={() => {
          console.log('Manual admin auth set');
          setIsAdminAuthenticated(true);
        }}
        className="mt-2 px-2 py-1 bg-blue-500 text-white text-xs rounded"
      >
        Force Admin Auth
      </button>
      <button 
        onClick={() => {
          console.log('Manual admin logout');
          setIsAdminAuthenticated(false);
          localStorage.removeItem('adminToken');
        }}
        className="mt-1 px-2 py-1 bg-red-500 text-white text-xs rounded"
      >
        Force Logout
      </button>
    </div>
  );
}
