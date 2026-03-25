import React, { useState, useEffect } from 'react';
import { Contact, User, Loader, AlertCircle } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function ContactsPage() {
  const [counsellor, setCounsellor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchCounsellor();
  }, []);

  const fetchCounsellor = async () => {
    try {
      const session = localStorage.getItem('parent_session');
      if (!session) {
        setError('No active session. Please login again.');
        setLoading(false);
        return;
      }

      const sessionData = JSON.parse(session);
      const regdNo = sessionData.regdNo || sessionData.studentRegdNo;

      if (!regdNo) {
        setError('Registration number not found.');
        setLoading(false);
        return;
      }

      const response = await fetch(`${API_URL}/api/student/${regdNo}/counsellor`);
      const data = await response.json();

      if (data.success) {
        setCounsellor(data.data.counsellor);
        setError(null);
      } else {
        setCounsellor('Not Assigned');
      }
    } catch (err) {
      console.error('Error fetching counsellor:', err);
      setError('Failed to load counsellor information');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-2">
        <div>
          <h1 className="text-2xl font-extrabold flex items-center gap-2 mb-2">
            <Contact className="text-primary" /> Contact & Communication
          </h1>
          <p className="text-slate-500 dark:text-slate-400">
            Your assigned counsellor for academic guidance and support.
          </p>
        </div>
      </div>

      <div className="animate-fade-in-up">
        {loading ? (
          <div className="glass-panel p-8 rounded-3xl bg-white/60 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex items-center justify-center gap-3">
            <Loader className="animate-spin text-primary" size={24} />
            <span className="text-slate-600 dark:text-slate-400">Loading counsellor information...</span>
          </div>
        ) : error ? (
          <div className="glass-panel p-8 rounded-3xl bg-white/60 dark:bg-slate-900/60 border border-red-200 dark:border-red-800/50 flex items-center gap-3 text-red-600 dark:text-red-400">
            <AlertCircle size={24} />
            <span>{error}</span>
          </div>
        ) : (
          <div className="glass-panel p-8 rounded-3xl bg-white/60 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 hover:shadow-xl transition-all">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg">
                <User size={40} className="text-white" />
              </div>
              <div className="text-center md:text-left flex-1">
                <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2">
                  {counsellor || 'Not Assigned'}
                </h2>
                <p className="text-primary font-semibold text-lg mb-1">
                  Student Counsellor
                </p>
                <p className="text-slate-500 dark:text-slate-400">
                  Your dedicated point of contact for academic guidance, course selection, and any concerns.
                </p>
              </div>
              <button 
                onClick={() => alert('Counsellor meeting request feature coming soon!')}
                className="px-6 py-3 bg-primary text-white font-semibold rounded-xl hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20 whitespace-nowrap"
              >
                Request Meeting
              </button>
            </div>
            <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
              <div className="grid md:grid-cols-3 gap-4 text-sm text-slate-600 dark:text-slate-400">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                  <span>Available: Mon-Fri, 9 AM - 5 PM</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                  <span>Response time: Within 24 hours</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                  <span>Emergency: Contact Admin Office</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="mt-8 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4">
          Frequently Asked Questions
        </h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="glass-panel p-4 rounded-2xl bg-white/60 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
            <h4 className="font-semibold text-slate-800 dark:text-slate-100 mb-2">
              How do I contact my counsellor?
            </h4>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Click Request Meeting to schedule an appointment. Your counsellor will reach out to confirm.
            </p>
          </div>
          <div className="glass-panel p-4 rounded-2xl bg-white/60 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
            <h4 className="font-semibold text-slate-800 dark:text-slate-100 mb-2">
              What can my counsellor help with?
            </h4>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Academic planning, course issues, career guidance, and personal concerns affecting studies.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
