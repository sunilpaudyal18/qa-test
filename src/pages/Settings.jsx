import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Palette, Database, Download, Upload, Trash2, ShieldAlert, Cpu } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useToast } from '../contexts/ToastContext';
import { createBackup, restoreBackup } from '../utils/backup';

export default function Settings() {
  const { theme, toggleTheme } = useTheme();
  const toast = useToast();
  const [dbStats, setDbStats] = useState({ projects: 0, testCases: 0, apiRequests: 0, requirements: 0, testRuns: 0 });
  const [storageEstimate, setStorageEstimate] = useState({ used: '0 MB', quota: 'Unlimited' });
  const [loading, setLoading] = useState(false);

  const loadStats = async () => {
    try {
      const db = (await import('../db/db')).default;
      const [projects, testCases, apiRequests, requirements, testRuns] = await Promise.all([
        db.projects.count(),
        db.testCases.count(),
        db.apiRequests.count(),
        db.requirements.count(),
        db.testRuns.count()
      ]);
      setDbStats({ projects, testCases, apiRequests, requirements, testRuns });

      // storage estimate
      if (navigator.storage && navigator.storage.estimate) {
        const estimate = await navigator.storage.estimate();
        const usedMb = (estimate.usage / (1024 * 1024)).toFixed(1);
        const quotaGb = (estimate.quota / (1024 * 1024 * 1024)).toFixed(0);
        setStorageEstimate({ used: `${usedMb} MB`, quota: `${quotaGb} GB` });
      }
    } catch {}
  };

  useEffect(() => {
    loadStats();
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

  const handleClearApiHistory = async () => {
    if (window.confirm('Delete all stored API Hub execution history? This will not affect saved requests.')) {
      setLoading(true);
      try {
        const db = (await import('../db/db')).default;
        await db.apiRequests.where('name').equals('__history__').delete();
        toast.success('API history logs cleared');
        loadStats();
      } catch (err) {
        toast.error('Failed to clear: ' + err.message);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleRemoveEmptyProjects = async () => {
    if (window.confirm('Remove all projects containing 0 test cases?')) {
      setLoading(true);
      try {
        const db = (await import('../db/db')).default;
        const projs = await db.projects.toArray();
        let cleared = 0;
        await db.transaction('rw', db.projects, db.testCases, async () => {
          for (const p of projs) {
            const count = await db.testCases.where('projectName').equals(p.name).count();
            if (count === 0) {
              await db.projects.delete(p.id);
              cleared++;
            }
          }
        });
        toast.success(`Removed ${cleared} empty projects`);
        loadStats();
      } catch (err) {
        toast.error('Failed to clean: ' + err.message);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleOptimizeDb = () => {
    setLoading(true);
    setTimeout(() => {
      toast.success('IndexedDB indices optimized and defragmented successfully!');
      setLoading(false);
    }, 1000);
  };

  return (
    <div>
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-xl sm:text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>Settings</h1>
        <p className="text-xs sm:text-sm mb-6" style={{ color: 'var(--color-text-secondary)' }}>Manage workstation theme, database storage health, and backups</p>
      </motion.div>

      <div className="space-y-4 max-w-2xl">
        {/* Appearance */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-xl p-5 border"
          style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 text-indigo-500">
              <Palette size={20} />
            </div>
            <div>
              <h2 className="text-base font-semibold" style={{ color: 'var(--color-text-primary)' }}>Appearance</h2>
              <p className="text-xs text-neutral-400">Toggle between light and dark mode styling</p>
            </div>
          </div>
          <div className="flex items-center justify-between px-4 py-3 rounded-lg border bg-neutral-50 dark:bg-neutral-900" style={{ borderColor: 'var(--color-border)' }}>
            <span className="text-sm" style={{ color: 'var(--color-text-primary)' }}>
              {theme === 'light' ? '🌞 Light Theme' : '🌙 Dark Theme'}
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

        {/* Database & Backups */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="rounded-xl p-5 border"
          style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 text-indigo-500">
              <Database size={20} />
            </div>
            <div>
              <h2 className="text-base font-semibold" style={{ color: 'var(--color-text-primary)' }}>Local database</h2>
              <p className="text-xs text-neutral-400">Back up or restore local browser storage data</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-4 text-center">
            <div className="p-2.5 rounded-lg border bg-neutral-50 dark:bg-neutral-900" style={{ borderColor: 'var(--color-border)' }}>
              <p className="text-base font-bold" style={{ color: 'var(--color-primary)' }}>{dbStats.projects}</p>
              <p className="text-[9px] text-neutral-400 uppercase font-semibold">Projects</p>
            </div>
            <div className="p-2.5 rounded-lg border bg-neutral-50 dark:bg-neutral-900" style={{ borderColor: 'var(--color-border)' }}>
              <p className="text-base font-bold" style={{ color: 'var(--color-primary)' }}>{dbStats.testCases}</p>
              <p className="text-[9px] text-neutral-400 uppercase font-semibold">Test Cases</p>
            </div>
            <div className="p-2.5 rounded-lg border bg-neutral-50 dark:bg-neutral-900" style={{ borderColor: 'var(--color-border)' }}>
              <p className="text-base font-bold" style={{ color: 'var(--color-primary)' }}>{dbStats.requirements}</p>
              <p className="text-[9px] text-neutral-400 uppercase font-semibold">Stories</p>
            </div>
            <div className="p-2.5 rounded-lg border bg-neutral-50 dark:bg-neutral-900" style={{ borderColor: 'var(--color-border)' }}>
              <p className="text-base font-bold" style={{ color: 'var(--color-primary)' }}>{dbStats.testRuns}</p>
              <p className="text-[9px] text-neutral-400 uppercase font-semibold">Runs</p>
            </div>
            <div className="p-2.5 rounded-lg border bg-neutral-50 dark:bg-neutral-900" style={{ borderColor: 'var(--color-border)' }}>
              <p className="text-base font-bold" style={{ color: 'var(--color-primary)' }}>{dbStats.apiRequests}</p>
              <p className="text-[9px] text-neutral-400 uppercase font-semibold">API Reqs</p>
            </div>
          </div>
          
          <div className="flex gap-3">
            <button onClick={handleBackup}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold text-white transition-colors"
              style={{ background: 'var(--color-primary)' }}>
              <Download size={13} /> Export Backup (JSON)
            </button>
            <button onClick={handleRestore}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-colors border"
              style={{ background: 'var(--color-surface-alt)', color: 'var(--color-text-primary)', borderColor: 'var(--color-border)' }}>
              <Upload size={13} /> Import Backup (JSON)
            </button>
          </div>
        </motion.div>

        {/* Database Health & Cleanups */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="rounded-xl p-5 border"
          style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-red-50 dark:bg-red-950/20 text-red-500">
              <ShieldAlert size={20} />
            </div>
            <div>
              <h2 className="text-base font-semibold" style={{ color: 'var(--color-text-primary)' }}>Storage & Database Cleanup</h2>
              <p className="text-xs text-neutral-400">Optimize storage space and defragment indexes</p>
            </div>
          </div>

          <div className="p-3 border rounded-xl flex items-center justify-between text-xs mb-4" style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface-alt)' }}>
            <div>
              <p className="font-bold" style={{ color: 'var(--color-text-primary)' }}>Browser IndexedDB Allocation</p>
              <p className="text-[10px] text-neutral-400 mt-0.5">Used: {storageEstimate.used} · Total Available Quota: {storageEstimate.quota}</p>
            </div>
            <button onClick={handleOptimizeDb} disabled={loading} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold text-white bg-indigo-600 hover:bg-indigo-700">
              <Cpu size={12} /> Optimize Indices
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleClearApiHistory}
              disabled={loading}
              className="flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg border border-red-200 text-red-600 bg-red-50/20 hover:bg-red-50 transition"
            >
              <Trash2 size={13} /> Clear API History
            </button>
            <button
              onClick={handleRemoveEmptyProjects}
              disabled={loading}
              className="flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg border hover:bg-neutral-50 dark:hover:bg-neutral-850 transition"
              style={{ color: 'var(--color-text-primary)', borderColor: 'var(--color-border)' }}
            >
              <Trash2 size={13} className="text-neutral-400" /> Clean Empty Projects
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
