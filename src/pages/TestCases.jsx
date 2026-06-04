import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Plus, Edit2, Trash2, Copy, Search, ChevronDown, ChevronUp, ChevronLeft, ChevronRight,
  Filter, X, Download, TestTube2, CheckCircle2, XCircle, AlertTriangle, HelpCircle,
  MoreHorizontal, Image as ImageIcon, ArrowUpDown, ArrowUp, ArrowDown, Sparkles
} from 'lucide-react';
import { testCaseService } from '../services/testCaseService';
import { projectService } from '../services/projectService';
import { exportToExcel } from '../utils/excel';
import { useToast } from '../contexts/ToastContext';
import Modal from '../components/ui/Modal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import TestCaseForm from '../components/forms/TestCaseForm';
import TestCaseViewModal from '../components/layout/TestCaseViewModal';

const STATUSES = ['Untested', 'Pass', 'Fail', 'Blocked'];
const PRIORITIES = ['Low', 'Medium', 'High', 'Critical'];
const SEVERITIES = ['Low', 'Minor', 'Major', 'Critical'];
const TAGS = ['Smoke', 'Regression', 'Sanity', 'API', 'UI', 'Security', 'Performance'];

const TEMPLATES = [
  { name: 'Login Validation', module: 'Auth', title: 'Verify credentials login flow', steps: ['Navigate to Login page', 'Input valid username', 'Input valid password', 'Click Login button'], expectedResult: 'Login succeeds, user redirected to Dashboard, and JWT auth token stored.' },
  { name: 'Registration Validation', module: 'Auth', title: 'Verify user signup flows', steps: ['Navigate to registration page', 'Fill email, password, confirm password fields', 'Click Register button', 'Assert verification email is sent'], expectedResult: 'New user is created in database, status marked as Pending Verification.' },
  { name: 'CRUD Validation', module: 'API', title: 'Verify resource CRUD lifecycle', steps: ['Send POST request with resource body', 'Send GET request to read resource', 'Send PUT/PATCH request to update resource field', 'Send DELETE request to remove resource'], expectedResult: 'POST returns 201 Created; GET returns 200 OK; PUT returns 200 OK; DELETE returns 204 No Content.' },
  { name: 'UI Validation', module: 'UI', title: 'Verify layout responsiveness', steps: ['Open feature page', 'Change browser viewport width to 375px (mobile)', 'Verify menu sidebar collapses to hamburger toggle', 'Check for overlapping elements or horizontal scrolling'], expectedResult: 'Layout scales responsively without overlapping elements or broken alignment.' },
  { name: 'Smoke Test', module: 'Smoke', title: 'Verify critical page load health', steps: ['Navigate to Home landing URL', 'Check status is 200', 'Verify logo header is visible', 'Verify footer links render'], expectedResult: 'Landing page loads within 1.5 seconds without script errors.' },
  { name: 'Regression Test', module: 'Core', title: 'Verify complex feature workflows', steps: ['Authenticate user session', 'Create new workflow template', 'Publish template to sandbox', 'Assert template state transitions to published'], expectedResult: 'State transitions occur successfully without side effects.' }
];

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
      <Icon className="w-3.5 h-3.5" /> {status === 'Untested' ? 'Not Run' : status}
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
  const [showTemplatesDropdown, setShowTemplatesDropdown] = useState(false);
  const toast = useToast();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [tagFilter, setTagFilter] = useState('All');
  const [selected, setSelected] = useState([]);
  const [sortField, setSortField] = useState(null);
  const [sortDir, setSortDir] = useState('asc');
  const [page, setPage] = useState(1);
  const pageSize = 25;

  // AI Generator placeholders modal
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [aiContext, setAiContext] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiOutput, setAiOutput] = useState([]);

  useEffect(() => {
    localStorage.setItem('qa_active_project', activeProject);
  }, [activeProject]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const tcData = await testCaseService.getAll(activeProject);
      const projData = await projectService.getAll();
      setTestCases(tcData);
      setProjects(projData);
    } catch (err) {
      toast.error('Failed to load test cases');
    } finally {
      setLoading(false);
    }
  }, [activeProject, toast]);

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
    if (tagFilter !== 'All') result = result.filter(tc => (tc.tags || []).includes(tagFilter));
    return result;
  }, [testCases, search, statusFilter, priorityFilter, tagFilter]);

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

  useEffect(() => { setPage(1); }, [search, statusFilter, priorityFilter, tagFilter]);

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

  const handleDuplicate = async (id) => {
    await testCaseService.duplicate(id);
    toast.success('Test Case duplicated');
    loadData();
  };

  const handleDelete = async () => {
    if (deleteTarget) {
      await testCaseService.delete(deleteTarget);
      toast.success('Deleted');
      setConfirmOpen(false);
      loadData();
    }
  };

  const handleCreateFromTemplate = (t) => {
    setEditingCase({
      title: t.title,
      module: t.module,
      steps: t.steps,
      expectedResult: t.expectedResult,
      priority: 'High',
      severity: 'Major',
      status: 'Untested',
      testData: [''],
      tags: [t.name.split(' ')[0]]
    });
    setFormOpen(true);
    setShowTemplatesDropdown(false);
  };

  // Open simulated AI generators
  const triggerAiGenerator = (type) => {
    setAiModalOpen(true);
    setAiContext(type);
    setAiLoading(true);
    setAiOutput([]);
    
    setTimeout(() => {
      setAiLoading(false);
      if (type === 'testcase') {
        setAiOutput([
          { title: 'Verify SQL injection in Login username', steps: ["Input ' OR 1=1 -- in username field", 'Input random password', 'Click Submit'], expected: 'Access denied, validation message displayed.' },
          { title: 'Verify username boundary limits (255 characters)', steps: ['Input a 256 character random string', 'Fill other valid inputs', 'Verify submit button blocks registration'], expected: 'Input capped or errors out gracefully.' }
        ]);
      } else if (type === 'negative') {
        setAiOutput([
          { title: 'Verify cross-site scripting XSS script execution', steps: ["Input <script>alert('XSS')</script> in textbox", 'Save change', 'Reload page'], expected: 'Input sanitized, alert box does not execute.' },
          { title: 'Verify form submit with empty mandatory fields', steps: ['Clear all text fields', 'Click Save Case'], expected: 'Validation notifications block form submit.' }
        ]);
      }
    }, 1500);
  };

  const handleImportAiTestCase = async (item) => {
    const prefix = editingCase?.module?.substring(0, 3).toUpperCase() || 'TC';
    await testCaseService.create({
      projectName: activeProject,
      testId: `${prefix}_${(testCases.length + 1).toString().padStart(3, '0')}`,
      module: 'Security Testing',
      title: item.title,
      steps: item.steps,
      expectedResult: item.expected,
      status: 'Untested',
      priority: 'High',
      severity: 'Critical'
    });
    toast.success('AI Test case saved locally!');
    loadData();
  };

  return (
    <div>
      {/* Top Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>Test Cases</h1>
          <p className="text-xs sm:text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>{filtered.length} test cases in <strong style={{ color: 'var(--color-text-primary)' }}>{activeProject}</strong></p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <select value={activeProject} onChange={e => { if (e.target.value === '__add__') handleCreateProject(); else setActiveProject(e.target.value); }}
            className="px-3 py-2 rounded-lg text-xs sm:text-sm focus:outline-none focus:ring-2 max-w-[140px] sm:max-w-none"
            style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border-strong)', color: 'var(--color-text-primary)' }}>
            {projects.map(p => <option key={p.name} value={p.name}>{p.name}</option>)}
            <option value="__add__" style={{ color: 'var(--color-primary)' }}>+ New Project</option>
          </select>
          <button onClick={() => exportToExcel(testCases)}
            className="p-2 rounded-lg transition-colors border"
            style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' }}
            title="Export Excel">
            <Download size={16} />
          </button>
          
          {/* Templates Dropdown Button */}
          <div className="relative">
            <button
              onClick={() => setShowTemplatesDropdown(!showTemplatesDropdown)}
              className="flex items-center gap-1.5 px-3 py-2 border rounded-lg text-xs font-semibold hover:bg-neutral-100 dark:hover:bg-neutral-850"
              style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)', background: 'var(--color-surface)' }}
            >
              <Sparkles size={13} className="text-indigo-500" />
              <span className="hidden sm:inline">Templates</span>
              <span className="sm:hidden">Tmp</span>
            </button>
            {showTemplatesDropdown && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowTemplatesDropdown(false)} />
                <div className="absolute right-0 top-full mt-1.5 w-48 sm:w-56 rounded-xl border shadow-2xl z-20 p-1 space-y-0.5 overflow-hidden"
                  style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
                  {TEMPLATES.map(t => (
                    <button
                      key={t.name}
                      onClick={() => handleCreateFromTemplate(t)}
                      className="w-full text-left px-3 py-2 text-xs hover:bg-neutral-50 dark:hover:bg-neutral-900 rounded-lg"
                      style={{ color: 'var(--color-text-primary)' }}
                    >
                      {t.name}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          <button onClick={() => { setEditingCase(null); setFormOpen(true); }}
            className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium text-white transition-colors"
            style={{ background: 'var(--color-primary)' }}>
            <Plus size={16} /> <span className="hidden sm:inline">New Case</span><span className="sm:hidden">New</span>
          </button>
        </div>
      </div>

      {/* Main Table Area */}
      <div className="rounded-xl overflow-hidden" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
        <div className="p-3 sm:p-4 flex flex-col sm:flex-row gap-3" style={{ borderBottom: '1px solid var(--color-border)' }}>
          <div className="relative flex-1 min-w-0">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-text-muted)' }} />
            <input type="text" placeholder="Search..." value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2"
              style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border-strong)', color: 'var(--color-text-primary)' }} />
          </div>
          <div className="flex gap-2 flex-wrap">
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
              className="px-2 sm:px-3 py-2 rounded-lg text-xs font-semibold border"
              style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}>
              <option value="All">All Status</option>
              {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <select value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)}
              className="px-2 sm:px-3 py-2 rounded-lg text-xs font-semibold border"
              style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}>
              <option value="All">All Priority</option>
              {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
            <select value={tagFilter} onChange={e => setTagFilter(e.target.value)}
              className="px-2 sm:px-3 py-2 rounded-lg text-xs font-semibold border"
              style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}>
              <option value="All">All Tags</option>
              {TAGS.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            {selected.length > 0 && (
              <button onClick={handleBulkDelete}
                className="px-3 py-2 rounded-lg text-xs font-bold transition"
                style={{ background: 'rgba(220,38,38,0.1)', color: 'var(--color-fail)', border: '1px solid rgba(220,38,38,0.2)' }}>
                <Trash2 size={13} className="inline mr-1" /> Delete {selected.length}
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center" style={{ color: 'var(--color-text-muted)' }}>Loading test cases...</div>
        ) : paged.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <TestTube2 size={48} style={{ color: 'var(--color-border)' }} className="mb-4" />
            <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>No test cases found</h3>
            <p className="text-sm mb-4" style={{ color: 'var(--color-text-muted)' }}>
              {testCases.length === 0 ? 'Create your first test case or import from template' : 'Try adjusting your filters'}
            </p>
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
                  <th className="py-3.5 px-3">Expected Result</th>
                  <th className="py-3.5 px-3">Tags</th>
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
                          <span className="text-xs font-semibold leading-normal" style={{ color: 'var(--color-text-primary)' }}>{tc.title}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3"><StatusBadge status={tc.status} /></td>
                      <td className="py-3 px-3"><PriorityBadge priority={tc.priority} /></td>
                      <td className="py-3 px-3 max-w-[200px]">
                        <p className="text-xs text-neutral-400 line-clamp-1">{tc.expectedResult || '--'}</p>
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex flex-wrap gap-1">
                          {(tc.tags || []).map(t => (
                            <span key={t} className="text-[8px] font-bold px-1.5 py-0.5 rounded-full border bg-neutral-100 dark:bg-neutral-800 text-neutral-400">
                              {t}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 pr-4 pl-3 text-right" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => setViewingCase(tc)}
                            className="px-2.5 py-1 text-[10px] font-bold rounded-lg text-white"
                            style={{ background: 'var(--color-primary)' }}>
                            View
                          </button>
                          <button onClick={() => handleDuplicate(tc.id)} className="p-1 rounded-lg text-neutral-400 hover:text-indigo-500 transition-colors" title="Duplicate Case">
                            <Copy size={13} />
                          </button>
                          <button onClick={() => { setEditingCase(tc); setFormOpen(true); }}
                            className="p-1 rounded-lg text-neutral-400 hover:text-indigo-500 transition-colors">
                            <Edit2 size={13} />
                          </button>
                          <button onClick={() => { setDeleteTarget(tc.id); setConfirmOpen(true); }}
                            className="p-1 rounded-lg text-neutral-400 hover:text-red-500 transition-colors">
                            <Trash2 size={13} />
                          </button>
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
            <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Page {page} of {totalPages}</span>
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

      {/* AI Simulation Output modal */}
      <Modal isOpen={aiModalOpen} onClose={() => setAiModalOpen(false)} title={`AI Generation: ${aiContext === 'testcase' ? 'Test Cases' : 'Negative Scenarios'}`} size="md" zIndex={200}>
        <div className="space-y-4">
          <div className="flex items-center gap-2 p-3 bg-purple-50 dark:bg-purple-900/10 border border-purple-200 dark:border-purple-800 rounded-lg text-purple-700 dark:text-purple-300">
            <Sparkles size={16} className="shrink-0" />
            <p className="text-[11px] font-medium leading-relaxed">
              We recommend adding negative and boundary validation paths to verify stories properly.
            </p>
          </div>

          {aiLoading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3">
              <div className="w-8 h-8 border-3 border-purple-500/20 border-t-purple-600 rounded-full animate-spin" />
              <p className="text-xs text-neutral-400">Running validation audit patterns...</p>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-xs font-bold" style={{ color: 'var(--color-text-primary)' }}>Generated Gaps Suggestions:</p>
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {aiOutput.map((item, idx) => (
                  <div key={idx} className="p-3 border rounded-lg hover:border-purple-400 transition-colors" style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface-alt)' }}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h4 className="text-xs font-bold" style={{ color: 'var(--color-text-primary)' }}>{item.title}</h4>
                        <div className="mt-2 space-y-1">
                          {item.steps.map((st, i) => (
                            <p key={i} className="text-[10px] text-neutral-400 font-mono">{i+1}. {st}</p>
                          ))}
                        </div>
                      </div>
                      <button
                        onClick={() => handleImportAiTestCase(item)}
                        className="flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-md transition shrink-0"
                      >
                        <Plus size={10} /> Add
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end pt-2 border-t" style={{ borderColor: 'var(--color-border)' }}>
            <button onClick={() => setAiModalOpen(false)} className="px-4 py-2 text-xs font-semibold" style={{ color: 'var(--color-text-secondary)' }}>Close</button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={formOpen} onClose={() => { setFormOpen(false); setEditingCase(null); }} title={editingCase ? 'Edit Test Case' : 'Create Test Case'} size="xl">
        <div className="space-y-4">
          {/* AI ready actions bar inside Case Creator Form */}
          <div className="flex gap-2 justify-end mb-2">
            <button type="button" onClick={() => triggerAiGenerator('testcase')} className="flex items-center gap-1 px-2.5 py-1 text-[10px] rounded-lg border text-purple-600 border-purple-200 bg-purple-50 dark:bg-purple-900/10 dark:border-purple-800">
              <Sparkles size={11} /> Generate Tests
            </button>
            <button type="button" onClick={() => triggerAiGenerator('negative')} className="flex items-center gap-1 px-2.5 py-1 text-[10px] rounded-lg border text-purple-600 border-purple-200 bg-purple-50 dark:bg-purple-900/10 dark:border-purple-800">
              <Sparkles size={11} /> Generate Negative Scenarios
            </button>
          </div>
          <TestCaseForm onSubmit={(data) => handleSave(data, editingCase?.id)} onCancel={() => { setFormOpen(false); setEditingCase(null); }}
            initialData={editingCase} testCases={testCases} />
        </div>
      </Modal>

      <TestCaseViewModal isOpen={!!viewingCase} testCase={viewingCase} onClose={() => setViewingCase(null)}
        onEdit={(tc) => { setEditingCase(tc); setFormOpen(true); }} />

      <ConfirmDialog isOpen={confirmOpen} onClose={() => setConfirmOpen(false)} onConfirm={handleDelete}
        title="Delete Test Case" message="This will permanently delete this test case." />
    </div>
  );
}
