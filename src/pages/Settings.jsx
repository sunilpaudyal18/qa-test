import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Settings as SettingsIcon, Palette, Database, Download, Upload, Info } from 'lucide-react';
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
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">Settings</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">Manage application settings</p>
      </motion.div>

      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600">
              <Palette size={20} />
            </div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Appearance</h2>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Theme</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Switch between light and dark mode</p>
            </div>
            <button
              onClick={toggleTheme}
              className={`relative w-14 h-7 rounded-full transition-colors ${
                theme === 'dark' ? 'bg-indigo-600' : 'bg-gray-200'
              }`}
            >
              <div
                className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow transition-transform ${
                  theme === 'dark' ? 'translate-x-7.5' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600">
              <Database size={20} />
            </div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Data Management</h2>
          </div>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{dbStats.projects}</p>
              <p className="text-xs text-gray-500">Projects</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{dbStats.testCases}</p>
              <p className="text-xs text-gray-500">Test Cases</p>
            </div>

          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={handleBackup} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 transition-colors">
              <Download size={16} />
              Create Backup
            </button>
            <button onClick={handleRestore} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-amber-600 text-white hover:bg-amber-700 transition-colors">
              <Upload size={16} />
              Restore from Backup
            </button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600">
              <Info size={20} />
            </div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">About</h2>
          </div>
          <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
            <p><strong className="text-gray-900 dark:text-gray-100">QA Test Case Studio</strong> v1.0.0</p>
            <p>A modern frontend-only QA Test Case Management application.</p>
            <p className="flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
              All data stored locally in your browser using IndexedDB.
            </p>
            <p className="flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
              Works offline and can be installed as a PWA.
            </p>
            <p className="flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
              No backend, no cloud, no authentication required.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
