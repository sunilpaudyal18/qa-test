import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import Topbar from '../components/layout/Topbar';

const socialLinks = [
  { url: 'https://www.facebook.com/18.sunilpaudyal', label: 'Facebook', icon: 'f' },
  { url: 'https://www.instagram.com/18.sunilpaudyal', label: 'Instagram', icon: 'ig' },
  { url: 'https://github.com/sunilpaudyal18/', label: 'GitHub', icon: 'gh' },
  { url: 'https://www.tiktok.com/@18.sunilpaudyal', label: 'TikTok', icon: 'tt' },
  { url: 'https://www.linkedin.com/in/18sunilpaudyal/', label: 'LinkedIn', icon: 'in' },
  { url: 'https://sunil.sajilodigital.com.np/', label: 'Website', icon: 'w' },
];

export default function AppLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [showLinks, setShowLinks] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
      <div className="flex flex-1">
        <Sidebar collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed} />
        <div className={`flex-1 flex flex-col transition-all duration-300 ${sidebarCollapsed ? 'ml-16' : 'ml-60'}`}>
          <Topbar onMenuClick={() => setMobileSidebarOpen(!mobileSidebarOpen)} />
          <main className="flex-1 p-4 lg:p-6">
            <Outlet />
          </main>
          <footer className="px-4 lg:px-6 py-3 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
            <div className="flex flex-col items-center gap-2">
              <button onClick={() => setShowLinks(!showLinks)}
                className="text-xs text-gray-400 hover:text-indigo-400 transition-colors cursor-pointer">
                Developed by <span className="font-semibold">Sunil Paudyal</span>
                <span className="ml-1">{showLinks ? '▲' : '▼'}</span>
              </button>
              {showLinks && (
                <div className="flex flex-wrap items-center justify-center gap-3 animate-fadeIn">
                  {socialLinks.map(link => (
                    <a key={link.url} href={link.url} target="_blank" rel="noopener noreferrer"
                      className="text-xs text-gray-400 hover:text-indigo-400 transition-colors">
                      {link.label}
                    </a>
                  ))}
                </div>
              )}
            </div>
          </footer>
        </div>
      </div>
      {mobileSidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setMobileSidebarOpen(false)} />
      )}
    </div>
  );
}
