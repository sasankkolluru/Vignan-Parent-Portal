import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserCircle, Phone, ArrowRight, AlertCircle, Mic, Grid3x3 } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function LoginPage({ setIsAuthenticated }) {
  const [regNo, setRegNo] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    if (!regNo.trim() || !phone.trim()) {
      setError('Please fill in all required fields.');
      return;
    }

    if (phone.length < 10) {
      setError('Please enter a valid phone number.');
      return;
    }

    // Redirect to pattern authentication with registration number
    navigate('/pattern-auth', { 
      state: { 
        regNo: regNo.trim(),
        userType: 'student'
      } 
    });
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-center mb-6 text-slate-800 dark:text-slate-100">
        Parent Login
      </h2>

      {error && (
        <div className="flex items-center gap-2 p-3 mb-6 text-sm text-red-600 bg-red-50 dark:bg-red-500/10 dark:text-red-400 rounded-lg border border-red-200 dark:border-red-500/20">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      <form onSubmit={handleLogin} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 flex justify-between">
            <span>Student Registration No.</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <UserCircle size={18} />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-primary transition-colors outline-none"
              placeholder="e.g. 2023BCS001"
              value={regNo}
              onChange={(e) => setRegNo(e.target.value.toUpperCase())}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 flex justify-between">
            <span>Registered Parent Phone</span>
            <a href="#contact-admin" className="text-primary hover:underline text-xs">Forgot Registered Phone?</a>
          </label>
          <div className="flex relative">
            <span className="inline-flex items-center px-3 border border-r-0 border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-500 rounded-l-xl text-sm font-medium">
              +91
            </span>
            <input
              type="tel"
              className="block flex-1 w-full pl-3 pr-3 py-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-r-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-primary transition-colors outline-none"
              placeholder="9876543210"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full mt-6 flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover text-white py-3.5 px-4 rounded-xl font-bold shadow-lg shadow-primary/30 transition-all hover:shadow-primary/50 disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {loading ? 'Verifying...' : 'Use Pattern Login'}
          {!loading && <Grid3x3 size={18} />}
        </button>

        <p className="text-center text-xs text-slate-500 dark:text-slate-400 mt-6 flex items-center justify-center gap-1.5">
          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd"></path></svg>
          Your data is secured with end-to-end encryption
        </p>

        {/* Advanced Authentication Options */}
        <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
          <p className="text-center text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
            Or try advanced authentication methods
          </p>
          <button
            onClick={() => navigate('/advanced-auth')}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white py-3 px-4 rounded-xl font-medium transition-all shadow-lg hover:shadow-xl"
          >
            <Mic className="w-4 h-4" />
            <span>Voice & Pattern Authentication</span>
            <Grid3x3 className="w-4 h-4" />
          </button>
          <p className="text-center text-xs text-slate-500 dark:text-slate-400 mt-2">
            No phone number required • Biometric authentication
          </p>
        </div>
      </form>
    </div>
  );
}
