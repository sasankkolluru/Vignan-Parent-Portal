import React, { useState } from 'react';
import { Settings as SettingsIcon, User, Shield, BellRing, LogOut, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function AccountSettingsPage() {
  const navigate = useNavigate();
  const [lang, setLang] = useState('English');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const parentProfile = {
    name: "Mr. Robert Johnson",
    phone: "+1 (555) 123-4567",
    email: "robert.j@example.com",
    lastLogin: "Today, 10:15 AM from Chrome (Windows)"
  };

  const [studentProfile, setStudentProfile] = useState({
    name: "Alex Johnson",
    regNo: "2024CS105",
    dept: "Computer Science",
    semester: "Semester 4"
  });

  React.useEffect(() => {
    const sessionStr = localStorage.getItem('parent_session');
    if (sessionStr) {
      try {
        const session = JSON.parse(sessionStr);
        if (session.student) {
          setStudentProfile({
            name: session.student.name || "Student",
            regNo: session.student.registrationNumber || session.regdNo,
            dept: session.student.branch || "B.Tech",
            semester: session.student.semester ? `Semester ${session.student.semester}` : "Semester 4"
          });
        }
      } catch (e) {
        console.error("Invalid session", e);
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('parent_session');
    // In a real app we would call context/store to clear auth state
    // For demo purposes, we do a hard reload to login
    window.location.href = '/login';
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <div>
        <h1 className="text-2xl font-extrabold flex items-center gap-2 mb-2">
          <SettingsIcon className="text-primary" /> Account & Settings
        </h1>
        <p className="text-slate-500 dark:text-slate-400">Manage your profile, preferences, and linked student information.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 w-full">
        <div className="flex flex-col gap-6">
          {/* Linked Student */}
          <div className="glass-panel p-6 rounded-3xl bg-white/60 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 animate-fade-in-up">
            <h2 className="text-lg font-bold flex items-center gap-2 mb-4 text-slate-800 dark:text-slate-200">
               <User className="text-primary" size={20} /> Linked Student Profile
            </h2>
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700/50">
               <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xl">
                    {studentProfile.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100">{studentProfile.name}</h3>
                    <p className="text-sm text-slate-500">{studentProfile.regNo}</p>
                  </div>
               </div>
               <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-slate-500 font-medium mb-1">Department</p>
                    <p className="text-sm font-semibold">{studentProfile.dept}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-medium mb-1">Current Term</p>
                    <p className="text-sm font-semibold">{studentProfile.semester}</p>
                  </div>
               </div>
            </div>
          </div>

          {/* Parent Profile */}
           <div className="glass-panel p-6 rounded-3xl bg-white/60 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 animate-fade-in-up">
            <h2 className="text-lg font-bold flex items-center gap-2 mb-4 text-slate-800 dark:text-slate-200">
               <Shield className="text-primary" size={20} /> Parent Identity
            </h2>
            <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500">Name</span>
                  <span className="font-semibold">{parentProfile.name}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-800 flex-wrap gap-2">
                  <span className="text-slate-500">Registered Phone</span>
                  <span className="font-semibold flex items-center gap-2">
                    {parentProfile.phone} <CheckCircle2 size={14} className="text-emerald-500" />
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500">Email</span>
                  <span className="font-semibold">{parentProfile.email}</span>
                </div>
                 <div className="pt-2">
                  <p className="text-xs text-slate-400">To update registered contact details, please contact the administration office directly.</p>
                </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-6">
           {/* Preferences */}
          <div className="glass-panel p-6 rounded-3xl bg-white/60 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
            <h2 className="text-lg font-bold flex items-center gap-2 mb-4 text-slate-800 dark:text-slate-200">
               <SettingsIcon className="text-primary" size={20} /> Preferences
            </h2>
            
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Display Language</label>
                <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                    {['English', 'Hindi', 'Regional'].map(l => (
                      <button 
                        key={l}
                        onClick={() => setLang(l)}
                        className={`flex-1 py-1.5 text-sm font-semibold rounded-lg transition-colors ${
                          lang === l ? 'bg-white dark:bg-slate-700 shadow-sm text-primary' : 'text-slate-500'
                        }`}
                      >
                        {l}
                      </button>
                    ))}
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <div>
                   <label className="block flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                     <BellRing size={16} className="text-amber-500" /> SMS & Push Notifications
                   </label>
                   <p className="text-xs text-slate-500">Receive alerts for important updates.</p>
                </div>
                <button 
                  onClick={() => setNotificationsEnabled(!notificationsEnabled)}
                  className={`w-12 h-6 rounded-full transition-colors relative ${notificationsEnabled ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'}`}
                >
                   <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${notificationsEnabled ? 'translate-x-6' : 'translate-x-0'}`} />
                </button>
              </div>
            </div>
          </div>

          {/* Security & Logout */}
           <div className="glass-panel p-6 rounded-3xl bg-white/60 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
             <h2 className="text-lg font-bold mb-4 text-slate-800 dark:text-slate-200">Security</h2>
             <p className="text-xs text-slate-500 mb-6">Last Login: {parentProfile.lastLogin}</p>
             
             <button 
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 bg-rose-50 text-rose-600 hover:bg-rose-100 dark:bg-rose-500/10 dark:text-rose-400 dark:hover:bg-rose-500/20 py-3 rounded-xl font-bold transition-colors"
             >
               <LogOut size={18} /> End Secure Session
             </button>
           </div>
        </div>
      </div>

    </div>
  );
}
