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
    <div className="flex flex-col min-h-screen" style={{ background: 'var(--color-bg)' }}>
      <div className="flex flex-1">
        <Sidebar collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed} />
        <div className={`flex-1 flex flex-col transition-all duration-300 ${sidebarCollapsed ? 'ml-16' : 'ml-60'}`}>
          <Topbar onMenuClick={() => setMobileSidebarOpen(!mobileSidebarOpen)} />
          <main className="flex-1 p-4 lg:p-6">
            <Outlet />
          </main>
          <footer className="px-4 lg:px-6 py-3 border-t"
            style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
            <div className="flex flex-col items-center gap-2">
              <button onClick={() => setShowLinks(!showLinks)}
                className="text-xs transition-colors cursor-pointer"
                style={{ color: 'var(--color-text-muted)' }}>
                Developed by <span className="font-semibold" style={{ color: 'var(--color-primary)' }}>Sunil Paudyal</span>
                <span className="ml-1">{showLinks ? '▲' : '▼'}</span>
              </button>
              {showLinks && (
                <div className="flex flex-wrap items-center justify-center gap-3 animate-fadeIn">
                  {socialLinks.map(link => (
                    <a key={link.url} href={link.url} target="_blank" rel="noopener noreferrer"
                      className="text-xs transition-colors"
                      style={{ color: 'var(--color-text-muted)' }}>
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
