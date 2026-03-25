import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Users, Edit3 } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';
import AIChatbot from '../components/chatbot/AIChatbot';

const adminNavItems = [
  { name: 'All Students', path: '/admin/dashboard', icon: <Users size={20} /> },
  { name: 'Bulk Edit', path: '/admin/dashboard', icon: <Edit3 size={20} /> },
];

export default function AdminLayout({ onLogout }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex bg-slate-50 dark:bg-slate-950 min-h-screen overscroll-none text-slate-900 dark:text-slate-100">
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} navItems={adminNavItems} />
      
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden relative">
        <Topbar
          onMenuClick={() => setSidebarOpen(true)}
          onLogout={onLogout}
        />
        
        <div className="flex-1 overflow-y-auto p-4 lg:p-8 custom-scrollbar">
          <Outlet />
        </div>
      </main>

      {/* AI Chatbot keeps the same helper experience even on the admin side */}
      <AIChatbot />
    </div>
  );
}
