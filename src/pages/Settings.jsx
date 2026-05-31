import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Palette, Database, Download, Upload } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useToast } from '../contexts/ToastContext';
import { createBackup, restoreBackup } from '../utils/backup';

export default function Settings() {
  const { theme, toggleTheme } = useTheme();
  const toast = useToast();
  const [dbStats, setDbStats] = useState({ projects: 0, testCases: 0 });

  useEffect(() => {
    async function load() {
      const db = (await import('../db/db')).default;
      const [projects, testCases] = await Promise.all([
        db.projects.count(),
        db.testCases.count(),
      ]);
      setDbStats({ projects, testCases });
    }
    load();
  }, []);

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
      if (window.confirm('This will overwrite ALL existing data. Are you absolutely sure?')) {
        try {
          await restoreBackup(file);
          toast.success('Data restored successfully');
          window.location.reload();
        } catch (err) {
          toast.error('Restore failed: ' + err.message);
        }
      }
    };
    input.click();
  };

  return (
    <div>
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>Settings</h1>
        <p className="text-sm mb-6" style={{ color: 'var(--color-text-secondary)' }}>Manage application settings</p>
      </motion.div>

      <div className="space-y-4 max-w-2xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-xl p-5"
          style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg" style={{ background: 'var(--color-primary-subtle)' }}>
              <Palette size={20} style={{ color: 'var(--color-primary)' }} />
            </div>
            <div>
              <h2 className="text-base font-semibold" style={{ color: 'var(--color-text-primary)' }}>Appearance</h2>
              <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Toggle between light and dark mode</p>
            </div>
          </div>
          <div className="flex items-center justify-between px-4 py-3 rounded-lg" style={{ background: 'var(--color-surface-alt)' }}>
            <span className="text-sm" style={{ color: 'var(--color-text-primary)' }}>
              {theme === 'light' ? '🌞 Light Mode' : '🌙 Dark Mode'}
            </span>
            <button onClick={toggleTheme}
              className="relative w-12 h-6 rounded-full transition-colors"
              style={{ background: theme === 'light' ? 'var(--color-primary)' : 'var(--color-text-muted)' }}>
              <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                theme === 'light' ? 'left-0.5' : 'left-6.5'
              }`} />
            </button>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="rounded-xl p-5"
          style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg" style={{ background: 'var(--color-primary-subtle)' }}>
              <Database size={20} style={{ color: 'var(--color-primary)' }} />
            </div>
            <div>
              <h2 className="text-base font-semibold" style={{ color: 'var(--color-text-primary)' }}>Database</h2>
              <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>View storage stats and manage backups</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="p-3 rounded-lg text-center" style={{ background: 'var(--color-surface-alt)' }}>
              <p className="text-2xl font-bold tabular-nums" style={{ color: 'var(--color-primary)' }}>{dbStats.projects}</p>
              <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Projects</p>
            </div>
            <div className="p-3 rounded-lg text-center" style={{ background: 'var(--color-surface-alt)' }}>
              <p className="text-2xl font-bold tabular-nums" style={{ color: 'var(--color-primary)' }}>{dbStats.testCases}</p>
              <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Test Cases</p>
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={handleBackup}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-white transition-colors"
              style={{ background: 'var(--color-primary)' }}>
              <Download size={14} /> Backup
            </button>
            <button onClick={handleRestore}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
              style={{ background: 'var(--color-surface-alt)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)' }}>
              <Upload size={14} /> Restore
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
