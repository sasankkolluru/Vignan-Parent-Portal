import React from 'react';
import { Outlet } from 'react-router-dom';

export default function AuthLayout() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 relative overflow-hidden">
      {/* Background Decorators */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-purple-500/20 blur-[120px] pointer-events-none" />
      
      <div className="w-full max-w-md p-6 relative z-10 animate-fade-in-up">
        {/* Brand */}
        <div className="text-center mb-8">
          <img src="/logo_vig.jpg" alt="Vignan Logo" className="w-24 h-24 mx-auto object-contain rounded-2xl bg-white shadow-xl shadow-primary/20 mb-6 ring-4 ring-white/80 dark:ring-white/10" />
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-2">
            Vignan's University
          </h1>
          <p className="text-slate-500 dark:text-slate-400">
            Parent Login Portal
          </p>
        </div>

        {/* Card Container */ }
        <div className="glass-panel rounded-3xl p-8 bg-white/80 dark:bg-slate-900/80 shadow-2xl border border-slate-200/50 dark:border-slate-700/50">
          <Outlet />
        </div>

        {/* Footer Links */}
        <div className="text-center mt-8 space-x-4 text-sm text-slate-500 dark:text-slate-400 font-medium">
          <a href="/" className="hover:text-primary transition-colors">Home</a>
          <span>&middot;</span>
          <a href="/faq" className="hover:text-primary transition-colors">Help / FAQ</a>
        </div>
      </div>
    </div>
  );
}
