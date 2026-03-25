import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  MessageSquare, UserCheck, Activity, Award, 
  CreditCard, CalendarDays, LineChart, 
  Contact, Settings 
} from 'lucide-react';

const defaultNavItems = [
  { name: 'Dashboard & Chat', path: '/dashboard', icon: <MessageSquare size={20} /> },
  { name: 'Attendance', path: '/attendance', icon: <UserCheck size={20} /> },
  { name: 'Academic Status', path: '/academics/status', icon: <Activity size={20} /> },
  { name: 'Performance', path: '/academics/performance', icon: <Award size={20} /> },
  { name: 'Finances & Fees', path: '/finance/fees', icon: <CreditCard size={20} /> },
  { name: 'Notifications', path: '/notifications', icon: <CalendarDays size={20} /> },
  { name: 'Performance Insights', path: '/insights', icon: <LineChart size={20} /> },
  { name: 'Contacts & Comms', path: '/support/contacts', icon: <Contact size={20} /> },
  { name: 'Account Settings', path: '/settings', icon: <Settings size={20} /> },
];

export default function Sidebar({ isOpen, setIsOpen, navItems }) {
  const items = navItems ?? defaultNavItems;

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div 
          className="lg:hidden fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <aside className={`
        fixed lg:static top-0 left-0 h-screen w-72 z-50
        bg-surface dark:bg-slate-900 border-r border-border dark:border-slate-800
        transform transition-transform duration-300 ease-in-out flex flex-col
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="flex items-center justify-between h-16 px-6 border-b border-border dark:border-slate-800">
          <div className="flex items-center gap-3">
            <img src="/logo_vig.jpg" alt="Vignan Logo" className="w-8 h-8 rounded-md object-contain bg-white ring-2 ring-primary/20 shadow-sm" />
            <span className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary leading-tight">
              Vignan's<br/>University
            </span>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {items.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setIsOpen(false)}
              className={({ isActive }) => `
                flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200
                ${isActive 
                  ? 'bg-primary/10 text-primary font-medium' 
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200'}
              `}
            >
              <div className="opacity-90">{item.icon}</div>
              <span>{item.name}</span>
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-border dark:border-slate-800">
          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-slate-800 dark:to-slate-800/50 rounded-xl p-4 border border-indigo-100 dark:border-slate-700">
            <p className="text-sm text-indigo-800 dark:text-indigo-300 font-medium mb-1">
              Need Help?
            </p>
            <p className="text-xs text-indigo-600/80 dark:text-indigo-400/80 mb-3">
              Check out our detailed FAQ guide.
            </p>
            <NavLink 
              to="/faq" 
              className="text-xs font-semibold text-primary bg-white dark:bg-slate-900 px-3 py-1.5 rounded-lg shadow-sm w-full block text-center hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              View FAQ
            </NavLink>
          </div>
        </div>
      </aside>
    </>
  );
}
