import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';
import AIChatbot from '../components/chatbot/AIChatbot';

export default function MainLayout({ onLogout }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex bg-slate-50 dark:bg-slate-950 min-h-screen overscroll-none text-slate-900 dark:text-slate-100">
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
      
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden relative">
        <Topbar 
          onMenuClick={() => setSidebarOpen(true)} 
          onLogout={onLogout} 
        />
        
        <div className="flex-1 overflow-y-auto p-4 lg:p-8 custom-scrollbar">
          <Outlet />
        </div>
      </main>

      {/* AI Chatbot - Available on all protected pages */}
      <AIChatbot />
    </div>
  );
}
