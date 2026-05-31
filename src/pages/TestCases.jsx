import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Plus, Edit2, Trash2, Search, ChevronDown, ChevronUp, ChevronLeft, ChevronRight,
  Filter, X, Download, Upload, Columns3, CheckSquare, Square, TestTube2,
} from 'lucide-react';
import { testCaseService } from '../services/testCaseService';
import { projectService } from '../services/projectService';
import { exportToExcel } from '../utils/excel';
import { useToast } from '../contexts/ToastContext';
import Modal from '../components/ui/Modal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import TestCaseForm from '../components/forms/TestCaseForm';

const PRIORITIES = ['Low', 'Medium', 'High', 'Critical'];
const SEVERITIES = ['Low', 'Medium', 'High', 'Critical'];
const STATUSES = ['Not Executed', 'Pass', 'Fail', 'Blocked'];
const ALL_TAGS = ['Smoke', 'Sanity', 'Regression', 'API', 'UI', 'Security', 'Mobile'];

const COLUMNS = [
  { key: 'tcId', label: 'TC ID' },
  { key: 'title', label: 'Title' },
  { key: 'module', label: 'Module' },
  { key: 'priority', label: 'Priority' },
  { key: 'severity', label: 'Severity' },
  { key: 'status', label: 'Status' },
  { key: 'tags', label: 'Tags' },
  { key: 'updatedAt', label: 'Updated' },
  { key: 'actions', label: 'Actions' },
];

export default function TestCases() {
  const [testCases, setTestCases] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const toast = useToast();

  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({ projectId: '', priority: '', severity: '', status: '', tag: '', module: '' });
  const [sortKey, setSortKey] = useState('createdAt');
  const [sortDir, setSortDir] = useState('desc');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(15);
  const [selected, setSelected] = useState(new Set());
  const [visibleColumns, setVisibleColumns] = useState(new Set(COLUMNS.map(c => c.key)));
  const [showColumnPicker, setShowColumnPicker] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    const [tcData, projData] = await Promise.all([
      testCaseService.getAll(),
      projectService.getAll(),
    ]);
    setTestCases(tcData);
    setProjects(projData);
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const filtered = useMemo(() => {
    let result = [...testCases];
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(tc =>
        tc.tcId?.toLowerCase().includes(q) ||
        tc.title?.toLowerCase().includes(q) ||
        tc.module?.toLowerCase().includes(q) ||
        tc.tags?.some(t => t.toLowerCase().includes(q))
      );
    }
    if (filters.projectId) result = result.filter(tc => tc.projectId === filters.projectId);
    if (filters.priority) result = result.filter(tc => tc.priority === filters.priority);
    if (filters.severity) result = result.filter(tc => tc.severity === filters.severity);
    if (filters.status) result = result.filter(tc => tc.status === filters.status);
    if (filters.tag) result = result.filter(tc => tc.tags?.includes(filters.tag));
    if (filters.module) result = result.filter(tc => tc.module === filters.module);
    return result;
  }, [testCases, search, filters]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let aVal = a[sortKey] || '';
      let bVal = b[sortKey] || '';
      if (sortKey === 'tags') {
        aVal = (a.tags || []).join(',');
        bVal = (b.tags || []).join(',');
      }
      if (typeof aVal === 'string') aVal = aVal.toLowerCase();
      if (typeof bVal === 'string') bVal = bVal.toLowerCase();
      if (aVal < bVal) return sortDir === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filtered, sortKey, sortDir]);

  const totalPages = Math.ceil(sorted.length / pageSize);
  const paged = sorted.slice((page - 1) * pageSize, page * pageSize);

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const toggleSelect = (id) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selected.size === paged.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(paged.map(tc => tc.id)));
    }
  };

  const handleBulkDelete = async () => {
    const ids = Array.from(selected);
    if (ids.length === 0) return;
    await testCaseService.bulkDelete(ids);
    toast.success(`${ids.length} test cases deleted`);
    setSelected(new Set());
    loadData();
  };

  const handleBulkStatus = async (status) => {
    const ids = Array.from(selected);
    if (ids.length === 0) return;
    await testCaseService.bulkUpdateStatus(ids, status);
    toast.success(`Updated ${ids.length} test cases`);
    loadData();
  };

  const handleEdit = (tc) => {
    setEditing(tc);
    setModalOpen(true);
  };

  const handleDelete = async () => {
    if (deleteTarget) {
      await testCaseService.delete(deleteTarget);
      toast.success('Test case deleted');
      loadData();
    }
  };

  const handleExport = async () => {
    if (filtered.length === 0) {
      toast.warning('No test cases to export');
      return;
    }
    await exportToExcel(null, filtered);
    toast.success('Exported successfully');
  };

  const statusColors = {
    'Pass': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    'Fail': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    'Blocked': 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    'Not Executed': 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  };

  const priorityColors = {
    'Critical': 'text-red-600 dark:text-red-400',
    'High': 'text-orange-600 dark:text-orange-400',
    'Medium': 'text-blue-600 dark:text-blue-400',
    'Low': 'text-gray-600 dark:text-gray-400',
  };

  if (loading) {
    return (
      <div>
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-48 mb-6 animate-pulse" />
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-12 bg-gray-100 dark:bg-gray-800 rounded mb-2 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const modules = [...new Set(testCases.map(tc => tc.module).filter(Boolean))];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Test Cases</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{filtered.length} total test cases</p>
        </div>
        <button
          onClick={() => { setEditing(null); setModalOpen(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
        >
          <Plus size={16} />
          New Test Case
        </button>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search test cases..."
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
                className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-gray-200"
              />
            </div>
            <select value={filters.projectId} onChange={e => setFilters({ ...filters, projectId: e.target.value })} className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-gray-200">
              <option value="">All Projects</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <select value={filters.priority} onChange={e => setFilters({ ...filters, priority: e.target.value })} className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-gray-200">
              <option value="">All Priorities</option>
              {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
            <select value={filters.severity} onChange={e => setFilters({ ...filters, severity: e.target.value })} className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-gray-200">
              <option value="">All Severities</option>
              {SEVERITIES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <select value={filters.status} onChange={e => setFilters({ ...filters, status: e.target.value })} className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-gray-200">
              <option value="">All Statuses</option>
              {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <select value={filters.tag} onChange={e => setFilters({ ...filters, tag: e.target.value })} className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-gray-200">
              <option value="">All Tags</option>
              {ALL_TAGS.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            {modules.length > 0 && (
              <select value={filters.module} onChange={e => setFilters({ ...filters, module: e.target.value })} className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-gray-200">
                <option value="">All Modules</option>
                {modules.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            )}
            <div className="relative">
              <button onClick={() => setShowColumnPicker(!showColumnPicker)} className="p-2 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500">
                <Columns3 size={16} />
              </button>
              {showColumnPicker && (
                <div className="absolute right-0 top-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg p-2 z-50 min-w-[160px]">
                  {COLUMNS.map(col => (
                    <label key={col.key} className="flex items-center gap-2 px-2 py-1.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded cursor-pointer">
                      <input
                        type="checkbox"
                        checked={visibleColumns.has(col.key)}
                        onChange={() => {
                          setVisibleColumns(prev => {
                            const next = new Set(prev);
                            if (next.has(col.key)) next.delete(col.key);
                            else next.add(col.key);
                            return next;
                          });
                        }}
                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      {col.label}
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>

          {selected.size > 0 && (
            <div className="flex items-center gap-2 px-3 py-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
              <span className="text-sm text-indigo-700 dark:text-indigo-300 font-medium">{selected.size} selected</span>
              <div className="h-4 w-px bg-indigo-200 dark:bg-indigo-700" />
              <button onClick={handleBulkDelete} className="text-sm text-red-600 dark:text-red-400 hover:text-red-700 font-medium">Delete</button>
              {STATUSES.map(s => (
                <button key={s} onClick={() => handleBulkStatus(s)} className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 font-medium">
                  Mark {s}
                </button>
              ))}
              <button onClick={() => setSelected(new Set())} className="ml-auto text-sm text-gray-500 hover:text-gray-700">
                <X size={14} />
              </button>
            </div>
          )}
        </div>

        {paged.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <TestTube2 size={48} className="text-gray-300 dark:text-gray-600 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">No test cases found</h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">
              {testCases.length === 0 ? 'Create your first test case to get started' : 'Try adjusting your filters'}
            </p>
            {testCases.length === 0 && (
              <button onClick={() => { setEditing(null); setModalOpen(true); }} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium">
                Create Test Case
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                  <th className="px-4 py-3 text-left w-10">
                    <button onClick={toggleSelectAll} className="text-gray-400">
                      {selected.size === paged.length ? <CheckSquare size={16} /> : <Square size={16} />}
                    </button>
                  </th>
                  {COLUMNS.filter(c => visibleColumns.has(c.key)).map(col => (
                    <th
                      key={col.key}
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer select-none hover:text-gray-700 dark:hover:text-gray-200"
                      onClick={() => col.key !== 'actions' && handleSort(col.key)}
                    >
                      <div className="flex items-center gap-1">
                        {col.label}
                        {sortKey === col.key && (
                          sortDir === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paged.map((tc, idx) => (
                  <motion.tr
                    key={tc.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: idx * 0.02 }}
                    className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <button onClick={() => toggleSelect(tc.id)} className="text-gray-400">
                        {selected.has(tc.id) ? <CheckSquare size={16} className="text-indigo-600" /> : <Square size={16} />}
                      </button>
                    </td>
                    {visibleColumns.has('tcId') && <td className="px-4 py-3 font-mono text-xs text-gray-500">{tc.tcId || '-'}</td>}
                    {visibleColumns.has('title') && <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100 max-w-[250px] truncate">{tc.title || 'Untitled'}</td>}
                    {visibleColumns.has('module') && <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{tc.module || '-'}</td>}
                    {visibleColumns.has('priority') && <td className={`px-4 py-3 font-medium ${priorityColors[tc.priority] || ''}`}>{tc.priority || '-'}</td>}
                    {visibleColumns.has('severity') && <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{tc.severity || '-'}</td>}
                    {visibleColumns.has('status') && (
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusColors[tc.status] || 'bg-gray-100 text-gray-600'}`}>
                          {tc.status || 'Not Executed'}
                        </span>
                      </td>
                    )}
                    {visibleColumns.has('tags') && (
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {(tc.tags || []).map(t => (
                            <span key={t} className="px-1.5 py-0.5 rounded text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">{t}</span>
                          ))}
                        </div>
                      </td>
                    )}
                    {visibleColumns.has('updatedAt') && <td className="px-4 py-3 text-xs text-gray-500">{tc.updatedAt ? new Date(tc.updatedAt).toLocaleDateString() : '-'}</td>}
                    {visibleColumns.has('actions') && (
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          <button onClick={() => handleEdit(tc)} className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-indigo-500">
                            <Edit2 size={14} />
                          </button>
                          <button onClick={() => { setDeleteTarget(tc.id); setConfirmOpen(true); }} className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-red-500">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    )}
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-700">
            <span className="text-sm text-gray-500">
              Page {page} of {totalPages}
            </span>
            <div className="flex gap-1">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 disabled:opacity-30">
                <ChevronLeft size={16} />
              </button>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 disabled:opacity-30">
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Test Case' : 'Create Test Case'} size="xl">
        <TestCaseForm
          initial={editing}
          projects={projects}
          onSave={() => { setModalOpen(false); setEditing(null); loadData(); }}
          onCancel={() => { setModalOpen(false); setEditing(null); }}
        />
      </Modal>

      <ConfirmDialog
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleDelete}
        title="Delete Test Case"
        message="This will permanently delete this test case. This action cannot be undone."
      />
    </div>
  );
}
