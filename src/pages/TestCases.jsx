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
    Pass: { icon: CheckCircle2, bg: 'rgba(22,163,74,0.12)', text: 'var(--color-pass)', border: 'rgba(22,163,74,0.2)' },
    Fail: { icon: XCircle, bg: 'rgba(220,38,38,0.12)', text: 'var(--color-fail)', border: 'rgba(220,38,38,0.2)' },
    Blocked: { icon: AlertTriangle, bg: 'rgba(217,119,6,0.12)', text: 'var(--color-blocked)', border: 'rgba(217,119,6,0.2)' },
    Untested: { icon: HelpCircle, bg: 'rgba(107,114,128,0.06)', text: 'var(--color-untested)', border: 'rgba(107,114,128,0.12)' },
  };
  const c = config[status] || config.Untested;
  const Icon = c.icon;
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap"
      style={{ background: c.bg, color: c.text, border: `1px solid ${c.border}` }}>
      <Icon className="w-3 h-3" /> {status === 'Untested' ? 'Not Run' : status}
    </span>
  );
};

const PriorityBadge = ({ priority }) => {
  const colors = {
    Critical: { bg: 'rgba(220,38,38,0.12)', text: 'var(--color-critical)', border: 'rgba(220,38,38,0.2)' },
    High: { bg: 'rgba(234,88,12,0.12)', text: 'var(--color-major)', border: 'rgba(234,88,12,0.2)' },
    Medium: { bg: 'rgba(37,99,235,0.1)', text: 'var(--color-minor)', border: 'rgba(37,99,235,0.18)' },
    Low: { bg: 'rgba(107,114,128,0.06)', text: 'var(--color-untested)', border: 'rgba(107,114,128,0.12)' },
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
          <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>Test Cases</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>{filtered.length} test cases in <strong style={{ color: 'var(--color-text-primary)' }}>{activeProject}</strong></p>
        </div>
        <div className="flex items-center gap-2">
          <select value={activeProject} onChange={e => { if (e.target.value === '__add__') handleCreateProject(); else setActiveProject(e.target.value); }}
            className="px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2"
            style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border-strong)', color: 'var(--color-text-primary)' }}>
            {projects.map(p => <option key={p.name} value={p.name}>{p.name}</option>)}
            <option value="__add__" style={{ color: 'var(--color-primary)' }}>+ New Project</option>
          </select>
          <button onClick={() => exportToExcel(testCases)}
            className="p-2 rounded-lg transition-colors"
            style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text-muted)' }}
            title="Export Excel">
            <Download size={16} />
          </button>
          <button onClick={() => { setEditingCase(null); setFormOpen(true); }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors"
            style={{ background: 'var(--color-primary)' }}>
            <Plus size={16} /> New Case
          </button>
        </div>
      </div>

      <div className="rounded-xl overflow-hidden" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
        <div className="p-4 flex flex-col sm:flex-row gap-3" style={{ borderBottom: '1px solid var(--color-border)' }}>
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-text-muted)' }} />
            <input type="text" placeholder="Search by title, module, or ID..." value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2"
              style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border-strong)', color: 'var(--color-text-primary)' }} />
          </div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-lg text-sm"
            style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border-strong)', color: 'var(--color-text-primary)' }}>
            <option value="All">All Status</option>
            {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)}
            className="px-3 py-2 rounded-lg text-sm"
            style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border-strong)', color: 'var(--color-text-primary)' }}>
            <option value="All">All Priority</option>
            {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
          {selected.length > 0 && (
            <button onClick={handleBulkDelete}
              className="px-3 py-2 rounded-lg text-sm font-medium"
              style={{ background: 'rgba(220,38,38,0.1)', color: 'var(--color-fail)', border: '1px solid rgba(220,38,38,0.2)' }}>
              <Trash2 size={14} className="inline mr-1" /> Delete {selected.length}
            </button>
          )}
        </div>

        {loading ? (
          <div className="p-8 text-center" style={{ color: 'var(--color-text-muted)' }}>Loading...</div>
        ) : paged.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <TestTube2 size={48} style={{ color: 'var(--color-border)' }} className="mb-4" />
            <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>No test cases found</h3>
            <p className="text-sm mb-4" style={{ color: 'var(--color-text-muted)' }}>
              {testCases.length === 0 ? 'Create your first test case' : 'Try adjusting your filters'}
            </p>
            {testCases.length === 0 && (
              <button onClick={() => { setEditingCase(null); setFormOpen(true); }}
                className="px-4 py-2 rounded-lg text-sm font-medium text-white"
                style={{ background: 'var(--color-primary)' }}>
                Create Test Case
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs font-bold uppercase tracking-wider"
                  style={{ background: 'var(--color-surface-alt)', borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-secondary)' }}>
                  <th className="py-3.5 pl-4 pr-2 w-10">
                    <input type="checkbox" checked={paged.length > 0 && selected.length === paged.length}
                      onChange={e => handleSelectAll(e.target.checked)}
                      className="w-4 h-4 rounded" style={{ accentColor: 'var(--color-primary)' }} />
                  </th>
                  <th className="py-3.5 px-3 cursor-pointer hover:opacity-80" onClick={() => toggleSort('testId')}>
                    <span className="flex items-center">ID <SortIcon field="testId" /></span>
                  </th>
                  <th className="py-3.5 px-3 cursor-pointer hover:opacity-80" onClick={() => toggleSort('title')}>
                    <span className="flex items-center">Test Case <SortIcon field="title" /></span>
                  </th>
                  <th className="py-3.5 px-3 cursor-pointer hover:opacity-80" onClick={() => toggleSort('status')}>
                    <span className="flex items-center">Status <SortIcon field="status" /></span>
                  </th>
                  <th className="py-3.5 px-3 cursor-pointer hover:opacity-80" onClick={() => toggleSort('priority')}>
                    <span className="flex items-center">Priority <SortIcon field="priority" /></span>
                  </th>
                  <th className="py-3.5 px-3">Expected vs Actual</th>
                  <th className="py-3.5 px-3 text-center">Evidence</th>
                  <th className="py-3.5 pr-4 pl-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: 'var(--color-border)' }}>
                {paged.map((tc, idx) => {
                  const isSelected = selected.includes(tc.id);
                  return (
                    <tr key={tc.id} className="transition-colors cursor-pointer"
                      style={isSelected ? { background: 'var(--color-primary-subtle)' } : idx % 2 === 0 ? {} : { background: 'var(--color-surface-alt)' }}
                      onClick={() => setViewingCase(tc)}>
                      <td className="py-3 pl-4 pr-2" onClick={e => e.stopPropagation()}>
                        <input type="checkbox" checked={isSelected}
                          onChange={e => handleSelect(tc.id, e.target.checked)}
                          className="w-4 h-4 rounded" style={{ accentColor: 'var(--color-primary)' }} />
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-mono text-xs font-semibold" style={{ color: 'var(--color-primary)' }}>{tc.testId || tc.id?.toString().slice(0, 8).toUpperCase()}</span>
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex flex-col">
                          {tc.module && <span className="text-[10px] font-medium mb-0.5" style={{ color: 'var(--color-text-muted)' }}>{tc.module}</span>}
                          <span className="text-sm font-medium leading-snug" style={{ color: 'var(--color-text-primary)' }}>{tc.title}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3"><StatusBadge status={tc.status} /></td>
                      <td className="py-3 px-3"><PriorityBadge priority={tc.priority} /></td>
                      <td className="py-3 px-3 max-w-[220px]">
                        <div className="space-y-0.5 text-xs leading-relaxed">
                          <div className="flex gap-1.5">
                            <span className="font-semibold shrink-0" style={{ color: 'var(--color-pass)' }}>Exp:</span>
                            <span className="line-clamp-1" style={{ color: 'var(--color-text-secondary)' }}>{tc.expectedResult || '--'}</span>
                          </div>
                          {tc.actualResult && (
                            <div className="flex gap-1.5">
                              <span className="font-semibold shrink-0" style={{ color: tc.status === 'Fail' ? 'var(--color-fail)' : 'var(--color-pass)' }}>Act:</span>
                              <span className="line-clamp-1" style={{ color: 'var(--color-text-secondary)' }}>{tc.actualResult}</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-center" onClick={e => e.stopPropagation()}>
                        {tc.screenshot ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium"
                            style={{ border: '1px solid var(--color-border)', color: 'var(--color-text-muted)' }}>
                            <ImageIcon className="w-3 h-3" /> 1
                          </span>
                        ) : <span className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>--</span>}
                      </td>
                      <td className="py-3 pr-4 pl-3 text-right" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => { setViewingCase(tc); }}
                            className="px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all"
                            style={{ color: 'var(--color-primary)', background: 'var(--color-primary-subtle)' }}>
                            View
                          </button>
                          <div className="relative">
                            <button onClick={e => { e.stopPropagation(); setEditingCase(tc); setFormOpen(true); }}
                              className="p-1.5 rounded-lg transition-colors"
                              style={{ color: 'var(--color-text-muted)' }}>
                              <Edit2 size={14} />
                            </button>
                            <button onClick={() => { setDeleteTarget(tc.id); setConfirmOpen(true); }}
                              className="p-1.5 rounded-lg transition-colors"
                              style={{ color: 'var(--color-text-muted)' }}>
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
          <div className="flex items-center justify-between px-4 py-3"
            style={{ background: 'var(--color-surface-alt)', borderTop: '1px solid var(--color-border)' }}>
            <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Page {page} of {totalPages}</span>
            <div className="flex gap-1">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="p-1.5 rounded disabled:opacity-30"
                style={{ color: 'var(--color-text-muted)' }}><ChevronLeft size={16} /></button>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="p-1.5 rounded disabled:opacity-30"
                style={{ color: 'var(--color-text-muted)' }}><ChevronRight size={16} /></button>
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
