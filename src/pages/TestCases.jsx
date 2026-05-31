import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Plus, Edit2, Trash2, Search, ChevronDown, ChevronUp, ChevronLeft, ChevronRight,
  Filter, X, Download, TestTube2, FileText, CheckCircle2, XCircle, AlertTriangle, HelpCircle,
  MoreHorizontal, Image as ImageIcon, ArrowUpDown, ArrowUp, ArrowDown,
} from 'lucide-react';
import { testCaseService } from '../services/testCaseService';
import { projectService } from '../services/projectService';
import { exportToExcel, exportSingleToExcel } from '../utils/excel';
import { useToast } from '../contexts/ToastContext';
import Modal from '../components/ui/Modal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import TestCaseForm from '../components/forms/TestCaseForm';
import TestCaseViewModal from '../components/layout/TestCaseViewModal';

const STATUSES = ['Untested', 'Pass', 'Fail', 'Blocked'];
const PRIORITIES = ['Low', 'Medium', 'High', 'Critical'];
const SEVERITIES = ['Low', 'Minor', 'Major', 'Critical'];

const StatusBadge = ({ status }) => {
  const config = {
    Pass: { icon: CheckCircle2, bg: 'rgba(34,197,94,0.12)', text: '#22C55E', border: 'rgba(34,197,94,0.2)', label: 'Passed' },
    Fail: { icon: XCircle, bg: 'rgba(239,68,68,0.12)', text: '#EF4444', border: 'rgba(239,68,68,0.2)', label: 'Failed' },
    Blocked: { icon: AlertTriangle, bg: 'rgba(245,158,11,0.12)', text: '#F59E0B', border: 'rgba(245,158,11,0.2)', label: 'Blocked' },
    Untested: { icon: HelpCircle, bg: 'rgba(148,163,184,0.06)', text: '#94A3B8', border: 'rgba(148,163,184,0.12)', label: 'Not Run' },
  };
  const c = config[status] || config.Untested;
  const Icon = c.icon;
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap"
      style={{ background: c.bg, color: c.text, border: `1px solid ${c.border}` }}>
      <Icon className="w-3 h-3" /> {c.label}
    </span>
  );
};

const PriorityBadge = ({ priority }) => {
  const colors = {
    Critical: { bg: 'rgba(239,68,68,0.12)', text: '#EF4444', border: 'rgba(239,68,68,0.2)' },
    High: { bg: 'rgba(245,158,11,0.12)', text: '#F59E0B', border: 'rgba(245,158,11,0.2)' },
    Medium: { bg: 'rgba(59,130,246,0.1)', text: '#3B82F6', border: 'rgba(59,130,246,0.18)' },
    Low: { bg: 'rgba(148,163,184,0.06)', text: '#94A3B8', border: 'rgba(148,163,184,0.12)' },
  };
  const c = colors[priority] || colors.Medium;
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold whitespace-nowrap"
      style={{ background: c.bg, color: c.text, border: `1px solid ${c.border}` }}>{priority}</span>
  );
};

export default function TestCases() {
  const [testCases, setTestCases] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeProject, setActiveProject] = useState(() => localStorage.getItem('qa_active_project') || 'Default Project');
  const [formOpen, setFormOpen] = useState(false);
  const [editingCase, setEditingCase] = useState(null);
  const [viewingCase, setViewingCase] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const toast = useToast();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [selected, setSelected] = useState([]);
  const [sortField, setSortField] = useState(null);
  const [sortDir, setSortDir] = useState('asc');
  const [page, setPage] = useState(1);
  const pageSize = 25;

  useEffect(() => {
    localStorage.setItem('qa_active_project', activeProject);
  }, [activeProject]);

  const loadData = useCallback(async () => {
    setLoading(true);
    const tcData = await testCaseService.getAll(activeProject);
    const projData = await projectService.getAll();
    setTestCases(tcData);
    setProjects(projData);
    setLoading(false);
  }, [activeProject]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleCreateProject = async () => {
    const name = window.prompt('Enter project name:');
    if (name && name.trim()) {
      await projectService.create(name.trim());
      setActiveProject(name.trim());
      toast.success(`Project "${name.trim()}" created`);
    }
  };

  const filtered = useMemo(() => {
    let result = [...testCases];
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(tc =>
        (tc.testId || '').toLowerCase().includes(q) ||
        (tc.title || '').toLowerCase().includes(q) ||
        (tc.module || '').toLowerCase().includes(q)
      );
    }
    if (statusFilter !== 'All') result = result.filter(tc => tc.status === statusFilter);
    if (priorityFilter !== 'All') result = result.filter(tc => tc.priority === priorityFilter);
    return result;
  }, [testCases, search, statusFilter, priorityFilter]);

  const sorted = useMemo(() => {
    if (!sortField) return filtered;
    return [...filtered].sort((a, b) => {
      let va = a[sortField] || '', vb = b[sortField] || '';
      if (sortField === 'status') {
        const order = { Pass: 0, Fail: 1, Blocked: 2, Untested: 3 };
        va = order[va] ?? 99; vb = order[vb] ?? 99;
      }
      if (sortField === 'priority') {
        const order = { Critical: 0, High: 1, Medium: 2, Low: 3 };
        va = order[va] ?? 99; vb = order[vb] ?? 99;
      }
      const cmp = typeof va === 'string' ? va.localeCompare(vb) : va - vb;
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [filtered, sortField, sortDir]);

  const totalPages = Math.ceil(sorted.length / pageSize);
  const paged = sorted.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => { setPage(1); }, [search, statusFilter, priorityFilter]);

  const toggleSort = (field) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('asc'); }
  };

  const SortIcon = ({ field }) => {
    if (sortField !== field) return <ArrowUpDown className="w-3 h-3 ml-1 opacity-30" />;
    return sortDir === 'asc' ? <ArrowUp className="w-3 h-3 ml-1" /> : <ArrowDown className="w-3 h-3 ml-1" />;
  };

  const handleSelect = (id, isSelected) => {
    setSelected(prev => isSelected ? [...prev, id] : prev.filter(x => x !== id));
  };

  const handleSelectAll = (checked) => {
    setSelected(checked ? paged.map(tc => tc.id) : []);
  };

  const handleBulkDelete = async () => {
    if (selected.length === 0) return;
    if (!window.confirm(`Delete ${selected.length} test cases?`)) return;
    await testCaseService.bulkDelete(selected);
    toast.success(`${selected.length} deleted`);
    setSelected([]);
    loadData();
  };

  const handleSave = async (data, id) => {
    const success = id
      ? await testCaseService.update(id, { ...data, projectName: activeProject })
      : await testCaseService.create({ ...data, projectName: activeProject });
    if (success) {
      toast.success(id ? 'Updated' : 'Created');
      setFormOpen(false);
      setEditingCase(null);
      loadData();
    }
    return success;
  };

  const handleDelete = async () => {
    if (deleteTarget) {
      await testCaseService.delete(deleteTarget);
      toast.success('Deleted');
      loadData();
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Test Cases</h1>
          <p className="text-sm text-gray-400 mt-1">{filtered.length} test cases in <strong>{activeProject}</strong></p>
        </div>
        <div className="flex items-center gap-2">
          <select value={activeProject} onChange={e => { if (e.target.value === '__add__') handleCreateProject(); else setActiveProject(e.target.value); }}
            className="px-3 py-2 rounded-lg border border-gray-700 bg-gray-800 text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500">
            {projects.map(p => <option key={p.name} value={p.name}>{p.name}</option>)}
            <option value="__add__" className="text-indigo-400">+ New Project</option>
          </select>
          <button onClick={() => exportToExcel(testCases)} className="p-2 rounded-lg bg-gray-800 border border-gray-700 text-gray-400 hover:text-white transition-colors" title="Export Excel">
            <Download size={16} />
          </button>
          <button onClick={() => { setEditingCase(null); setFormOpen(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium">
            <Plus size={16} /> New Case
          </button>
        </div>
      </div>

      <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
        <div className="p-4 border-b border-gray-800 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input type="text" placeholder="Search by title, module, or ID..." value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-700 bg-gray-800 text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-lg border border-gray-700 bg-gray-800 text-sm text-gray-200">
            <option value="All">All Status</option>
            {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)}
            className="px-3 py-2 rounded-lg border border-gray-700 bg-gray-800 text-sm text-gray-200">
            <option value="All">All Priority</option>
            {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
          {selected.length > 0 && (
            <button onClick={handleBulkDelete} className="px-3 py-2 rounded-lg text-sm font-medium bg-red-600/20 text-red-400 border border-red-800 hover:bg-red-600/30">
              <Trash2 size={14} className="inline mr-1" /> Delete {selected.length}
            </button>
          )}
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading...</div>
        ) : paged.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <TestTube2 size={48} className="text-gray-700 mb-4" />
            <h3 className="text-lg font-semibold text-gray-300 mb-2">No test cases found</h3>
            <p className="text-gray-500 text-sm mb-4">
              {testCases.length === 0 ? 'Create your first test case' : 'Try adjusting your filters'}
            </p>
            {testCases.length === 0 && (
              <button onClick={() => { setEditingCase(null); setFormOpen(true); }}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium">
                Create Test Case
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800 text-xs font-bold uppercase tracking-wider text-gray-500 bg-gray-800/50">
                  <th className="py-3.5 pl-4 pr-2 w-10">
                    <input type="checkbox" checked={paged.length > 0 && selected.length === paged.length}
                      onChange={e => handleSelectAll(e.target.checked)}
                      className="w-4 h-4 rounded accent-indigo-500" />
                  </th>
                  <th className="py-3.5 px-3 cursor-pointer hover:text-gray-300" onClick={() => toggleSort('testId')}>
                    <span className="flex items-center">ID <SortIcon field="testId" /></span>
                  </th>
                  <th className="py-3.5 px-3 cursor-pointer hover:text-gray-300" onClick={() => toggleSort('title')}>
                    <span className="flex items-center">Test Case <SortIcon field="title" /></span>
                  </th>
                  <th className="py-3.5 px-3 cursor-pointer hover:text-gray-300" onClick={() => toggleSort('status')}>
                    <span className="flex items-center">Status <SortIcon field="status" /></span>
                  </th>
                  <th className="py-3.5 px-3 cursor-pointer hover:text-gray-300" onClick={() => toggleSort('priority')}>
                    <span className="flex items-center">Priority <SortIcon field="priority" /></span>
                  </th>
                  <th className="py-3.5 px-3">Expected vs Actual</th>
                  <th className="py-3.5 px-3 text-center">Evidence</th>
                  <th className="py-3.5 pr-4 pl-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/50">
                {paged.map((tc, idx) => {
                  const isSelected = selected.includes(tc.id);
                  return (
                    <tr key={tc.id} className={`transition-colors cursor-pointer ${isSelected ? 'bg-indigo-900/10' : idx % 2 === 0 ? 'bg-transparent' : 'bg-white/[.02]'}`}
                      onClick={() => setViewingCase(tc)}>
                      <td className="py-3 pl-4 pr-2" onClick={e => e.stopPropagation()}>
                        <input type="checkbox" checked={isSelected}
                          onChange={e => handleSelect(tc.id, e.target.checked)}
                          className="w-4 h-4 rounded accent-indigo-500" />
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-mono text-xs font-semibold text-indigo-400">{tc.testId || tc.id?.toString().slice(0, 8).toUpperCase()}</span>
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex flex-col">
                          {tc.module && <span className="text-[10px] font-medium text-gray-500 mb-0.5">{tc.module}</span>}
                          <span className="text-sm font-medium leading-snug text-gray-200">{tc.title}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3"><StatusBadge status={tc.status} /></td>
                      <td className="py-3 px-3"><PriorityBadge priority={tc.priority} /></td>
                      <td className="py-3 px-3 max-w-[220px]">
                        <div className="space-y-0.5 text-xs leading-relaxed">
                          <div className="flex gap-1.5">
                            <span className="font-semibold shrink-0 text-emerald-500">Exp:</span>
                            <span className="line-clamp-1 text-gray-400">{tc.expectedResult || '--'}</span>
                          </div>
                          {tc.actualResult && (
                            <div className="flex gap-1.5">
                              <span className="font-semibold shrink-0" style={{ color: tc.status === 'Fail' ? '#EF4444' : '#22C55E' }}>Act:</span>
                              <span className="line-clamp-1 text-gray-400">{tc.actualResult}</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-center" onClick={e => e.stopPropagation()}>
                        {tc.screenshot ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium border border-gray-700 text-gray-400">
                            <ImageIcon className="w-3 h-3" /> 1
                          </span>
                        ) : <span className="text-[10px] text-gray-600">--</span>}
                      </td>
                      <td className="py-3 pr-4 pl-3 text-right" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => { setViewingCase(tc); }}
                            className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-indigo-400 bg-indigo-900/20 hover:bg-indigo-900/30 transition-all">
                            View
                          </button>
                          <div className="relative">
                            <button onClick={e => { e.stopPropagation(); setEditingCase(tc); setFormOpen(true); }}
                              className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-gray-800 transition-colors">
                              <Edit2 size={14} />
                            </button>
                            <button onClick={() => { setDeleteTarget(tc.id); setConfirmOpen(true); }}
                              className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-gray-800 transition-colors">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-800 bg-gray-800/50">
            <span className="text-sm text-gray-500">Page {page} of {totalPages}</span>
            <div className="flex gap-1">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="p-1.5 rounded hover:bg-gray-700 text-gray-500 disabled:opacity-30"><ChevronLeft size={16} /></button>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="p-1.5 rounded hover:bg-gray-700 text-gray-500 disabled:opacity-30"><ChevronRight size={16} /></button>
            </div>
          </div>
        )}
      </div>

      <Modal isOpen={formOpen} onClose={() => { setFormOpen(false); setEditingCase(null); }} title={editingCase ? 'Edit Test Case' : 'Create Test Case'} size="xl">
        <TestCaseForm onSubmit={(data) => handleSave(data, editingCase?.id)} onCancel={() => { setFormOpen(false); setEditingCase(null); }}
          initialData={editingCase} testCases={testCases} />
      </Modal>

      <TestCaseViewModal isOpen={!!viewingCase} testCase={viewingCase} onClose={() => setViewingCase(null)}
        onEdit={(tc) => { setEditingCase(tc); setFormOpen(true); }} />

      <ConfirmDialog isOpen={confirmOpen} onClose={() => setConfirmOpen(false)} onConfirm={handleDelete}
        title="Delete Test Case" message="This will permanently delete this test case." />
    </div>
  );
}
