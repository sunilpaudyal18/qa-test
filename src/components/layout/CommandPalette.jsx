import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Folder, TestTube, Play, FileCheck, Terminal, Compass, ArrowRight } from 'lucide-react';
import db from '../../db/db';

export default function CommandPalette({ isOpen, onClose }) {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [results, setResults] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);

  // Static actions
  const ACTIONS = [
    { type: 'command', label: 'Create Project', shortcut: 'Ctrl + N', action: () => { navigate('/projects'); } },
    { type: 'command', label: 'Create Test Case', shortcut: 'Ctrl + N', action: () => { navigate('/testcases'); } },
    { type: 'command', label: 'Create Test Run', shortcut: 'Ctrl + R', action: () => { navigate('/testruns'); } },
    { type: 'command', label: 'Open API Hub', shortcut: 'Ctrl + H', action: () => { navigate('/apihub'); } },
    { type: 'command', label: 'Open Reports', shortcut: 'Ctrl + Shift + R', action: () => { navigate('/reports'); } },
    { type: 'command', label: 'Export Backup (JSON)', shortcut: 'Ctrl + S', action: () => { document.querySelector('[title="Backup data"]')?.click(); } },
  ];

  // Fetch search records on search text change
  useEffect(() => {
    if (!isOpen) return;
    setSelectedIndex(0);

    if (!search.trim()) {
      setResults(ACTIONS);
      return;
    }

    const q = search.toLowerCase();

    async function searchDb() {
      try {
        const [projects, testCases, reqs, runs, apiReqs] = await Promise.all([
          db.projects.toArray(),
          db.testCases.toArray(),
          db.requirements.toArray(),
          db.testRuns.toArray(),
          db.apiRequests.toArray()
        ]);

        const matchedProjects = projects
          .filter(p => p.name.toLowerCase().includes(q))
          .map(p => ({ type: 'project', label: p.name, desc: 'Project', icon: Folder, action: () => navigate('/projects') }));

        const matchedTestCases = testCases
          .filter(tc => (tc.title || '').toLowerCase().includes(q) || (tc.testId || '').toLowerCase().includes(q))
          .map(tc => ({ type: 'testcase', label: `${tc.testId || 'TC'}: ${tc.title}`, desc: `Test Case in ${tc.projectName}`, icon: TestTube, action: () => navigate('/testcases') }));

        const matchedReqs = reqs
          .filter(r => (r.title || '').toLowerCase().includes(q) || (r.reqId || '').toLowerCase().includes(q))
          .map(r => ({ type: 'requirement', label: `${r.reqId || 'REQ'}: ${r.title}`, desc: `Requirement in ${r.projectName}`, icon: FileCheck, action: () => navigate('/requirements') }));

        const matchedRuns = runs
          .filter(r => r.name.toLowerCase().includes(q))
          .map(r => ({ type: 'testrun', label: r.name, desc: `Test Run in ${r.projectName}`, icon: Play, action: () => navigate('/testruns') }));

        const matchedApi = apiReqs
          .filter(r => r.name?.toLowerCase().includes(q) || r.url?.toLowerCase().includes(q))
          .map(r => ({ type: 'api', label: `${r.method || 'GET'}: ${r.name || r.url}`, desc: 'Saved Request', icon: Terminal, action: () => navigate('/apihub') }));

        setResults([
          ...matchedProjects.slice(0, 3),
          ...matchedTestCases.slice(0, 5),
          ...matchedReqs.slice(0, 3),
          ...matchedRuns.slice(0, 3),
          ...matchedApi.slice(0, 3)
        ]);
      } catch (err) {
        console.error(err);
      }
    }

    const timer = setTimeout(searchDb, 150);
    return () => clearTimeout(timer);
  }, [search, isOpen]);

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setSearch('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Handle keyboard events
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % Math.max(results.length, 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + results.length) % Math.max(results.length, 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (results[selectedIndex]) {
          results[selectedIndex].action();
          onClose();
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, results, selectedIndex, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4 bg-black/60 backdrop-blur-xs" onClick={onClose}>
      <div 
        className="w-full max-w-xl rounded-xl shadow-2xl overflow-hidden"
        style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Search header bar */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b" style={{ borderColor: 'var(--color-border)' }}>
          <Search size={18} className="text-neutral-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a command or search record (Ctrl+K)..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full text-sm font-medium bg-transparent border-0 outline-hidden focus:outline-none"
            style={{ color: 'var(--color-text-primary)' }}
          />
          <kbd className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-400 select-none">ESC</kbd>
        </div>

        {/* Results Container */}
        <div className="max-h-[340px] overflow-y-auto p-2">
          {results.length === 0 ? (
            <div className="py-12 text-center text-xs text-neutral-400">
              No matching records or actions found.
            </div>
          ) : (
            <div className="space-y-1">
              {results.map((item, idx) => {
                const isSelected = idx === selectedIndex;
                const Icon = item.icon || Compass;
                return (
                  <div
                    key={idx}
                    className="flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-100"
                    style={{
                      background: isSelected ? 'var(--color-primary-subtle)' : 'transparent',
                    }}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    onClick={() => { item.action(); onClose(); }}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div 
                        className="p-1.5 rounded-md"
                        style={{ 
                          background: isSelected ? 'rgba(99,102,241,0.15)' : 'var(--color-surface-alt)',
                          color: isSelected ? 'var(--color-primary)' : 'var(--color-text-secondary)'
                        }}
                      >
                        <Icon size={14} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold truncate" style={{ color: isSelected ? 'var(--color-primary)' : 'var(--color-text-primary)' }}>
                          {item.label}
                        </p>
                        {item.desc && (
                          <p className="text-[10px] mt-0.5 truncate" style={{ color: 'var(--color-text-muted)' }}>
                            {item.desc}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {item.shortcut ? (
                        <kbd className="text-[9px] px-1.5 py-0.5 rounded font-mono font-semibold" style={{ background: 'var(--color-surface-alt)', color: 'var(--color-text-muted)' }}>
                          {item.shortcut}
                        </kbd>
                      ) : (
                        <ArrowRight size={10} className={`transition-transform ${isSelected ? 'translate-x-0.5 opacity-100' : 'opacity-0'}`} style={{ color: 'var(--color-primary)' }} />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="px-4 py-2 bg-neutral-50 dark:bg-neutral-900 border-t flex items-center justify-between text-[10px]" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' }}>
          <div className="flex items-center gap-3">
            <span>↑↓ Navigate</span>
            <span>↵ Select</span>
          </div>
          <span>Local Workstation Command Center</span>
        </div>
      </div>
    </div>
  );
}
