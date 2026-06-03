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
      <header className="h-16 flex items-center justify-between px-4 lg:px-6 sticky top-0 z-40"
        style={{ background: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)' }}>
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-lg"
            style={{ color: 'var(--color-text-muted)' }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--color-surface-alt)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <Menu size={20} />
          </button>
          <button
            onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }))}
            className="p-2 rounded-lg flex items-center gap-2.5 px-3 border transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-850"
            style={{ color: 'var(--color-text-muted)', borderColor: 'var(--color-border)', background: 'var(--color-surface-alt)' }}
            title="Search Everything (Ctrl+K)"
          >
            <Search size={15} />
            <span className="text-[11px] font-medium hidden sm:inline">Search everything...</span>
            <kbd className="text-[9px] px-1 py-0.5 rounded bg-neutral-200 dark:bg-neutral-750 font-mono hidden sm:inline">Ctrl+K</kbd>
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleInstall}
            className="p-2 rounded-lg relative"
            style={{ color: 'var(--color-text-muted)' }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--color-surface-alt)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            title="Install App"
          >
            <MonitorDown size={20} />
          </button>
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg"
            style={{ color: 'var(--color-text-muted)' }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--color-surface-alt)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          >
            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
          </button>
          <button
            onClick={handleBackup}
            className="p-2 rounded-lg"
            style={{ color: 'var(--color-text-muted)' }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--color-surface-alt)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            title="Backup data"
          >
            <Download size={20} />
          </button>
          <button
            onClick={handleRestore}
            className="p-2 rounded-lg"
            style={{ color: 'var(--color-text-muted)' }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--color-surface-alt)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            title="Restore data"
          >
            <Upload size={20} />
          </button>
        </div>
      </header>

      {showInstallModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)' }}
          onClick={() => setShowInstallModal(false)}>
          <div className="rounded-xl p-6 max-w-md w-full shadow-2xl"
            style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold flex items-center gap-2" style={{ color: 'var(--color-text-primary)' }}>
                <Smartphone size={20} style={{ color: 'var(--color-primary)' }} /> Install App
              </h3>
              <button onClick={() => setShowInstallModal(false)} className="p-1 rounded"
                style={{ color: 'var(--color-text-muted)' }}>
                <X size={18} />
              </button>
            </div>
            <p className="text-sm mb-4" style={{ color: 'var(--color-text-secondary)' }}>Install this app on your device for offline access and a native-like experience.</p>
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 rounded-lg" style={{ background: 'var(--color-surface-alt)' }}>
                <Monitor size={18} className="mt-0.5 shrink-0" style={{ color: 'var(--color-primary)' }} />
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>Chrome / Edge (Desktop)</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>Click the install icon in the address bar, or select <strong>"Install QA Studio"</strong> from the browser menu.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg" style={{ background: 'var(--color-surface-alt)' }}>
                <Smartphone size={18} className="mt-0.5 shrink-0" style={{ color: 'var(--color-pass)' }} />
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>Mobile (Android)</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>Tap the browser menu <strong>(⋮)</strong> and select <strong>"Add to Home Screen"</strong> or <strong>"Install App"</strong>.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg" style={{ background: 'var(--color-surface-alt)' }}>
                <MonitorDown size={18} className="mt-0.5 shrink-0" style={{ color: 'var(--color-minor)' }} />
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>Safari (iOS)</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>Tap the share icon and select <strong>"Add to Home Screen"</strong>.</p>
                </div>
              </div>
            </div>
            <button onClick={() => setShowInstallModal(false)}
              className="w-full mt-4 py-2.5 rounded-lg font-medium transition text-white"
              style={{ background: 'var(--color-primary)' }}>
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
}
