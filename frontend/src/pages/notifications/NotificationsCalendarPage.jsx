import React, { useState, useEffect, useMemo } from 'react';
import { Bell, Calendar as CalIcon, BookOpen, GraduationCap, Clock, AlertTriangle, Loader2 } from 'lucide-react';
import { getParentSessionRegdNo, fetchStudentRecord } from '../../services/studentService';

const getNotificationIcon = (type) => {
  switch (type) {
    case 'Exam': return <AlertTriangle size={18} />;
    case 'Assignment': return <BookOpen size={18} />;
    case 'Event': return <GraduationCap size={18} />;
    default: return <CalIcon size={18} />;
  }
};

const getNotificationColor = (type) => {
  switch (type) {
    case 'Exam': return 'text-rose-500 bg-rose-100 dark:bg-rose-500/20';
    case 'Assignment': return 'text-amber-500 bg-amber-100 dark:bg-amber-500/20';
    case 'Event': return 'text-cyan-500 bg-cyan-100 dark:bg-cyan-500/20';
    default: return 'text-slate-500 bg-slate-100 dark:bg-slate-500/20';
  }
};

export default function NotificationsCalendarPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('All');

  useEffect(() => {
    const regdNo = getParentSessionRegdNo();
    if (!regdNo) {
      setError('Parent session not found. Please log in again.');
      setLoading(false);
      return;
    }

    fetchStudentRecord(regdNo)
      .then(data => {
        if (!data?.notifications?.length) {
          setNotifications([]);
          return;
        }
        setNotifications(data.notifications);
      })
      .catch(err => {
        console.error('[Notifications] fetch error', err);
        setError(err.message || 'Unable to load notifications.');
      })
      .finally(() => setLoading(false));
  }, []);

  const filters = useMemo(() => {
    const types = new Set(notifications.map(n => (n.type || 'General')));
    return ['All', ...Array.from(types)];
  }, [notifications]);

  const filteredNotifications = filter === 'All'
    ? notifications
    : notifications.filter(n => (n.type || 'General') === filter);

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      <div>
        <h1 className="text-2xl font-extrabold flex items-center gap-2 mb-2">
          <Bell className="text-primary" /> Notifications & Calendar
        </h1>
        <p className="text-slate-500 dark:text-slate-400">
          Important alerts, exam schedules and announcements come directly from the administration.
        </p>
      </div>

      <div className="flex bg-slate-100 dark:bg-slate-900 p-1.5 rounded-2xl w-full sm:w-fit shadow-inner overflow-x-auto">
        {filters.map((category) => (
          <button
            key={category}
            onClick={() => setFilter(category)}
            className={`flex-1 sm:px-6 py-2 rounded-xl text-sm font-bold transition-all ${
              filter === category
                ? 'bg-white dark:bg-slate-800 text-primary shadow-sm'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="glass-panel p-12 rounded-3xl bg-white/60 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-10 h-10 text-primary animate-spin" />
          <span className="text-slate-500 text-sm font-medium">Loading notifications…</span>
        </div>
      ) : error ? (
        <div className="glass-panel p-6 rounded-3xl bg-rose-50/60 dark:bg-rose-900/30 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-sm">
          <div className="flex items-center gap-2">
            <AlertTriangle size={16} />
            <span>{error}</span>
          </div>
        </div>
      ) : filteredNotifications.length === 0 ? (
        <div className="glass-panel p-12 rounded-3xl bg-white/60 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-center text-slate-500">
          No notifications to display for this period.
        </div>
      ) : (
        <div className="space-y-4">
          {filteredNotifications.map((item) => {
            const createdAt = item.created_at ? new Date(item.created_at) : null;
            return (
              <div
                key={item.id || `${item.title}-${item.type}`}
                className={`glass-panel p-5 sm:p-6 rounded-2xl flex flex-col sm:flex-row gap-4 sm:items-center transition-all hover:shadow-lg border ${
                  item.highlight
                    ? 'border-primary/30 bg-primary/5 dark:bg-primary/10'
                    : 'bg-white/60 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800'
                }`}
              >
                <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${getNotificationColor(item.type)}`}>
                  {getNotificationIcon(item.type)}
                </div>

                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold">
                    <span>{item.type || 'Notice'}</span>
                    <span className="opacity-60">&middot;</span>
                    <span>{item.subject || 'General'}</span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 leading-tight">
                    {item.title}
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {item.message || 'No additional message provided.'}
                  </p>
                  {createdAt && (
                    <p className="text-[11px] text-slate-400 mt-1">
                      {createdAt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      {item.time ? ` • ${item.time}` : ''}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
