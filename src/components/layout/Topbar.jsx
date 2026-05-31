import { useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { useToast } from '../../contexts/ToastContext';
import { createBackup } from '../../utils/backup';
import { Sun, Moon, Search, Download, Upload, Menu } from 'lucide-react';

export default function Topbar({ onMenuClick }) {
  const { theme, toggleTheme } = useTheme();
  const toast = useToast();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

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

  return (
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
  );
}
