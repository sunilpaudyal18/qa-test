import { useState, useEffect, useRef } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { useToast } from '../../contexts/ToastContext';
import { createBackup } from '../../utils/backup';
import { Sun, Moon, Search, Download, Upload, Menu, MonitorDown, X, Smartphone, Monitor, ExternalLink } from 'lucide-react';

export default function Topbar({ onMenuClick }) {
  const { theme, toggleTheme } = useTheme();
  const toast = useToast();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [installPrompt, setInstallPrompt] = useState(null);
  const [showInstallModal, setShowInstallModal] = useState(false);
  const deferredPrompt = useRef(null);
  const isStandalone = useRef(false);

  useEffect(() => {
    isStandalone.current = window.matchMedia('(display-mode: standalone)').matches;
    if (isStandalone.current) return;

    const handler = (e) => {
      e.preventDefault();
      deferredPrompt.current = e;
      setInstallPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);

    const installedHandler = () => {
      deferredPrompt.current = null;
      setInstallPrompt(null);
    };
    window.addEventListener('appinstalled', installedHandler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      window.removeEventListener('appinstalled', installedHandler);
    };
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt.current) {
      deferredPrompt.current.prompt();
      const result = await deferredPrompt.current.userChoice;
      if (result.outcome === 'accepted') {
        toast.success('App installed successfully!');
        setInstallPrompt(null);
      }
      deferredPrompt.current = null;
    } else {
      setShowInstallModal(true);
    }
  };

  const handleBackup = async () => {
    try {
      await createBackup();
      toast.success('Backup created successfully');
    } catch (err) {
      toast.error('Failed to create backup');
    }
  };

  const handleRestore = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      if (window.confirm('This will overwrite all existing data. Are you sure?')) {
        try {
          const { restoreBackup } = await import('../../utils/backup');
          await restoreBackup(file);
          toast.success('Data restored successfully');
          window.location.reload();
        } catch (err) {
          toast.error('Failed to restore backup: ' + err.message);
        }
      }
    };
    input.click();
  };

  if (isStandalone.current) return null;

  return (
    <>
      <header className="h-16 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-4 lg:px-6 sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400"
          >
            <Menu size={20} />
          </button>
          {searchOpen ? (
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search projects, test cases..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 w-64 lg:w-80 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-gray-200"
                autoFocus
                onBlur={() => { if (!searchQuery) setSearchOpen(false); }}
              />
            </div>
          ) : (
            <button
              onClick={() => setSearchOpen(true)}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400"
            >
              <Search size={20} />
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleInstall}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 relative group"
            title="Install App"
          >
            <MonitorDown size={20} />
            {!installPrompt && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-gold rounded-full animate-pulse shadow-[0_0_6px_rgba(212,175,55,0.6)]" />
            )}
          </button>
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400"
            title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          >
            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
          </button>
          <button
            onClick={handleBackup}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400"
            title="Backup data"
          >
            <Download size={20} />
          </button>
          <button
            onClick={handleRestore}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400"
            title="Restore data"
          >
            <Upload size={20} />
          </button>
        </div>
      </header>

      {showInstallModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)' }}
          onClick={() => setShowInstallModal(false)}>
          <div className="bg-gray-900 rounded-xl border border-gray-700 p-6 max-w-md w-full shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Smartphone size={20} className="text-indigo-400" /> Install App
              </h3>
              <button onClick={() => setShowInstallModal(false)} className="p-1 rounded text-gray-500 hover:text-white">
                <X size={18} />
              </button>
            </div>
            <p className="text-sm text-gray-400 mb-4">Install this app on your device for offline access and a native-like experience.</p>
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-800">
                <Monitor size={18} className="text-blue-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-gray-200">Chrome / Edge (Desktop)</p>
                  <p className="text-xs text-gray-500 mt-0.5">Click the install icon <ExternalLink size={12} className="inline" /> in the address bar, or select <strong>"Install QA Studio"</strong> from the browser menu.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-800">
                <Smartphone size={18} className="text-emerald-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-gray-200">Mobile (Android)</p>
                  <p className="text-xs text-gray-500 mt-0.5">Tap the browser menu <strong>(⋮)</strong> and select <strong>"Add to Home Screen"</strong> or <strong>"Install App"</strong>.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-800">
                <MonitorDown size={18} className="text-purple-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-gray-200">Safari (iOS)</p>
                  <p className="text-xs text-gray-500 mt-0.5">Tap the share icon <ExternalLink size={12} className="inline" /> and select <strong>"Add to Home Screen"</strong>.</p>
                </div>
              </div>
            </div>
            <button onClick={() => setShowInstallModal(false)}
              className="w-full mt-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition">
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
}
