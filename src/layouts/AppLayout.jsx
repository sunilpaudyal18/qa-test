import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import Topbar from '../components/layout/Topbar';
import CommandPalette from '../components/layout/CommandPalette';
import { FaFacebook, FaInstagram, FaGithub, FaTiktok, FaLinkedin, FaGlobe } from 'react-icons/fa';

const socialLinks = [
  { url: 'https://www.facebook.com/18.sunilpaudyal', label: 'Facebook', icon: FaFacebook },
  { url: 'https://www.instagram.com/18.sunilpaudyal', label: 'Instagram', icon: FaInstagram },
  { url: 'https://github.com/sunilpaudyal18/', label: 'GitHub', icon: FaGithub },
  { url: 'https://www.tiktok.com/@18.sunilpaudyal', label: 'TikTok', icon: FaTiktok },
  { url: 'https://www.linkedin.com/in/18sunilpaudyal/', label: 'LinkedIn', icon: FaLinkedin },
  { url: 'https://sunil.sajilodigital.com.np/', label: 'Website', icon: FaGlobe },
];

export default function AppLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

  useEffect(() => {
    const handleGlobalShortcuts = (e) => {
      // Ctrl+K -> Command Palette
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(prev => !prev);
      }

      // Ctrl+N -> New contextual creation
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        const buttons = Array.from(document.querySelectorAll('button'));
        const hash = window.location.hash || '';
        if (hash.includes('projects')) {
          const btn = buttons.find(b => b.textContent.toLowerCase().includes('project'));
          if (btn) btn.click();
        } else if (hash.includes('testcases')) {
          const btn = buttons.find(b => b.textContent.toLowerCase().includes('case'));
          if (btn) btn.click();
        } else if (hash.includes('requirements')) {
          const btn = buttons.find(b => b.textContent.toLowerCase().includes('requirement'));
          if (btn) btn.click();
        } else if (hash.includes('testruns')) {
          const btn = buttons.find(b => b.textContent.toLowerCase().includes('run'));
          if (btn) btn.click();
        } else {
          setCommandPaletteOpen(true);
        }
      }

      // Ctrl+S -> Backup data
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        const backupBtn = document.querySelector('[title="Backup data"]');
        if (backupBtn) backupBtn.click();
      }
    };

    window.addEventListener('keydown', handleGlobalShortcuts);
    return () => window.removeEventListener('keydown', handleGlobalShortcuts);
  }, []);

  return (
    <div className="flex flex-col min-h-screen" style={{ background: 'var(--color-bg)' }}>
      <div className="flex flex-1">
        <Sidebar collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed} />
        <div className={`flex-1 flex flex-col transition-all duration-300 ${sidebarCollapsed ? 'ml-16' : 'ml-60'}`}>
          <Topbar onMenuClick={() => setMobileSidebarOpen(!mobileSidebarOpen)} />
          <CommandPalette isOpen={commandPaletteOpen} onClose={() => setCommandPaletteOpen(false)} />
          <main className="flex-1 p-4 lg:p-6">
            <Outlet />
          </main>
          <footer className="px-4 lg:px-6 py-3 border-t"
            style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
            <div className="flex flex-col items-center gap-1">
              <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                Developed by <span className="font-semibold" style={{ color: 'var(--color-primary)' }}>Sunil Paudyal</span>
              </span>
              <div className="flex items-center justify-center gap-4 my-1">
                {socialLinks.map(link => {
                  const Icon = link.icon;
                  return (
                    <a key={link.url} href={link.url} target="_blank" rel="noopener noreferrer"
                      className="transition-colors hover:opacity-80"
                      style={{ color: 'var(--color-text-muted)' }}
                      title={link.label}>
                      <Icon size={17} />
                    </a>
                  );
                })}
              </div>
              <span className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>
                &copy; {new Date().getFullYear()} All rights reserved
              </span>
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
