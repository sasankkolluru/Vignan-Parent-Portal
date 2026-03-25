import React, { useState, useEffect } from 'react';
import { Menu, LogOut, Bell, Clock, User } from 'lucide-react';

export default function Topbar({ onMenuClick, onLogout }) {
  const [studentInfo, setStudentInfo] = useState({
    name: "Alex Johnson",
    regNo: "2023BCS001",
    dept: "Computer Science",
    semester: "Semester 4"
  });

  useEffect(() => {
    // First try to load from the login session
    const sessionStr = localStorage.getItem('parent_session');
    if (sessionStr) {
      try {
        const session = JSON.parse(sessionStr);
        if (session.student) {
          setStudentInfo({
            name: session.student.name || "Student",
            regNo: session.student.registrationNumber || session.regdNo,
            dept: session.student.branch || "B.Tech",
            semester: session.student.semester ? `Semester ${session.student.semester}` : "Current Semester"
          });
          return; // Skip the fetch if we have it in session
        }
      } catch (e) {
        console.error("Failed to parse session", e);
      }
    }

    // Fallback to fetch if only studentId exists
    const regNo = localStorage.getItem('studentId');
    if (regNo) {
      fetch(`http://localhost:5000/api/students/${regNo}`)
        .then(res => res.json())
        .then(data => {
          if (data.success && data.data) {
            setStudentInfo({
              name: data.data['Name of The Student'] || "Student",
              regNo: data.data['Regd.No.'] || regNo,
              dept: data.data['Branch'] || "B.Tech",
              semester: "Semester 4"
            });
          }
        })
        .catch(err => console.error("Failed to fetch topbar user", err));
    }
  }, []);

  // Session Timer Logic
  const [timeLeft, setTimeLeft] = useState(28 * 60 + 45); // 28:45 initial

  useEffect(() => {
    if (timeLeft <= 0) {
      onLogout(); // Auto-logout when timer hits 0
      return;
    }
    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft, onLogout]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <header className="h-16 bg-surface dark:bg-slate-900 border-b border-border dark:border-slate-800 flex items-center justify-between px-4 lg:px-8 z-30 sticky top-0 shadow-sm">
      <div className="flex items-center gap-4">
        <button 
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          aria-label="Toggle menu"
        >
          <Menu size={24} />
        </button>
        
        <div className="hidden sm:flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden border-2 border-white dark:border-slate-800 shadow-sm flex items-center justify-center">
            {/* Fallback to user icon if no image available */}
            <User size={20} className="text-slate-400 dark:text-slate-500" />
          </div>
          <div className="flex flex-col">
             <span className="text-sm font-bold text-primary dark:text-secondary uppercase tracking-wider mb-0.5" style={{fontSize: '10px'}}>
              Vignan's University Portal
            </span>
            <span className="text-sm font-semibold text-slate-900 dark:text-slate-100 leading-tight">
              {studentInfo.name} ({studentInfo.regNo})
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        {/* Session Timer Component */}
        <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-amber-700 dark:text-amber-400 rounded-lg text-xs font-medium">
          <Clock size={14} className={timeLeft < 300 ? "animate-pulse text-red-500" : ""} />
          <span className={timeLeft < 300 ? "text-red-600 dark:text-red-400 font-bold" : ""}>
            Session: {formatTime(timeLeft)}
          </span>
        </div>

        <button className="p-2 relative rounded-full text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
          <Bell size={20} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-danger ring-2 ring-white dark:ring-slate-900"></span>
        </button>
        
        <div className="h-8 w-px bg-slate-200 dark:bg-slate-700 mx-1"></div>
        
        <button 
          onClick={onLogout}
          className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-danger dark:hover:text-danger hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
        >
          <span className="hidden sm:inline">Logout</span>
          <LogOut size={18} />
        </button>
      </div>
    </header>
  );
}
