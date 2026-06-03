import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Edit2, Trash2, Search, Link2, CheckCircle2, AlertTriangle,
  HelpCircle, FileCheck, Sparkles, X, ChevronDown, Table2, Filter
} from 'lucide-react';
import { requirementService } from '../services/requirementService';
import { testCaseService } from '../services/testCaseService';
import { projectService } from '../services/projectService';
import { useToast } from '../contexts/ToastContext';
import Modal from '../components/ui/Modal';
import ConfirmDialog from '../components/ui/ConfirmDialog';

const PRIORITIES = ['Critical', 'High', 'Medium', 'Low'];
const STATUSES   = ['Draft', 'Active', 'Deprecated'];
const COVERAGE_FILTER = ['All', 'Covered', 'Partially Covered', 'Not Covered'];

const PRIORITY_CFG = {
  Critical: { bg: 'rgba(220,38,38,0.1)',   color: 'var(--color-fail)',    dot: '#dc2626' },
  High:     { bg: 'rgba(217,119,6,0.1)',   color: 'var(--color-blocked)', dot: '#d97706' },
  Medium:   { bg: 'rgba(99,102,241,0.1)',  color: 'var(--color-primary)', dot: '#6366f1' },
  Low:      { bg: 'rgba(107,114,128,0.1)', color: 'var(--color-text-muted)', dot: '#6b7280' },
};
const STATUS_CFG = {
  Draft:      { bg: 'rgba(107,114,128,0.1)', color: 'var(--color-text-muted)' },
  Active:     { bg: 'rgba(22,163,74,0.1)',   color: 'var(--color-pass)' },
  Deprecated: { bg: 'rgba(220,38,38,0.08)',  color: 'var(--color-fail)' },
};

function PriorityBadge({ p }) {
  const c = PRIORITY_CFG[p] || PRIORITY_CFG.Medium;
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold"
      style={{ background: c.bg, color: c.color }}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: c.dot }} />{p}
    </span>
  );
}

function StatusBadge({ s }) {
  const c = STATUS_CFG[s] || STATUS_CFG.Draft;
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold"
      style={{ background: c.bg, color: c.color }}>{s}</span>
  );
}

function CoverageBadge({ status }) {
  if (status === 'Covered')
    return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold" style={{ background: 'rgba(22,163,74,0.1)', color: 'var(--color-pass)' }}><CheckCircle2 size={10} />Covered</span>;
  if (status === 'Partially Covered')
    return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold" style={{ background: 'rgba(217,119,6,0.1)', color: 'var(--color-blocked)' }}><AlertTriangle size={10} />Partial</span>;
  return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold" style={{ background: 'rgba(220,38,38,0.08)', color: 'var(--color-fail)' }}><HelpCircle size={10} />Not Covered</span>;
}

export default function Requirements() {
  const [requirements, setRequirements] = useState([]);
  const [testCases, setTestCases] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeProject, setActiveProject] = useState(
    () => localStorage.getItem('qa_active_project') || ''
  );
  const toast = useToast();

  const [search, setSearch] = useState('');
  const [coverageFilter, setCoverageFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingReq, setEditingReq] = useState(null);
  const [form, setForm] = useState({
    reqId: '', title: '', description: '',
    priority: 'Medium', status: 'Draft', linkedTestCaseIds: []
  });
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [linkingReq, setLinkingReq] = useState(null);
  const [tcSearch, setTcSearch] = useState('');

  // AI
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [aiTargetReq, setAiTargetReq] = useState(null);

  // Matrix view
  const [showMatrix, setShowMatrix] = useState(false);

  useEffect(() => {
    if (activeProject) localStorage.setItem('qa_active_project', activeProject);
  }, [activeProject]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const projData = await projectService.getAll();
      setProjects(projData);
      const proj = activeProject || projData[0]?.name || '';
      if (!activeProject && proj) setActiveProject(proj);

      const [reqData, tcData] = await Promise.all([
        requirementService.getAll(proj),
        testCaseService.getAll(proj)
      ]);
      setRequirements(reqData);
      setTestCases(tcData);
    } catch {
      toast.error('Failed to load requirements data');
    } finally {
      setLoading(false);
    }
  }, [activeProject, toast]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleCreateProject = async () => {
    const name = window.prompt('Enter project name:');
    if (name?.trim()) {
      await projectService.create(name.trim());
      setActiveProject(name.trim());
      toast.success(`Project "${name.trim()}" created`);
    }
  };

  const openNew = () => {
    setEditingReq(null);
    setForm({ reqId: '', title: '', description: '', priority: 'Medium', status: 'Draft', linkedTestCaseIds: [] });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.title.trim()) { toast.warning('Title is required'); return; }
    const reqId = form.reqId.trim() || `REQ-${Date.now().toString().slice(-4)}`;
    if (editingReq) {
      await requirementService.update(editingReq.id, {
        reqId, title: form.title, description: form.description,
        priority: form.priority, status: form.status,
        linkedTestCaseIds: form.linkedTestCaseIds
      });
      toast.success('Requirement updated');
    } else {
      await requirementService.create({
        reqId, title: form.title, description: form.description,
        priority: form.priority, status: form.status,
        projectName: activeProject, linkedTestCaseIds: form.linkedTestCaseIds
      });
      toast.success('Requirement created');
    }
    setModalOpen(false);
    setEditingReq(null);
    loadData();
  };

  const handleEdit = (req) => {
    setEditingReq(req);
    setForm({
      reqId: req.reqId, title: req.title, description: req.description || '',
      priority: req.priority || 'Medium', status: req.status || 'Draft',
      linkedTestCaseIds: req.linkedTestCaseIds || []
    });
    setModalOpen(true);
  };

  const handleDelete = async () => {
    if (deleteTarget) {
      await requirementService.delete(deleteTarget);
      toast.success('Requirement deleted');
      setConfirmOpen(false);
      loadData();
    }
  };

  const handleToggleLink = async (tcId) => {
    if (!linkingReq) return;
    const currentLinks = linkingReq.linkedTestCaseIds || [];
    const nextLinks = currentLinks.includes(tcId)
      ? currentLinks.filter(id => id !== tcId)
      : [...currentLinks, tcId];
    const updated = await requirementService.update(linkingReq.id, { linkedTestCaseIds: nextLinks });
    setLinkingReq(updated);
    setRequirements(prev => prev.map(r => r.id === linkingReq.id ? updated : r));
  };

  const triggerAi = (req) => {
    setAiTargetReq(req);
    setAiModalOpen(true);
    setAiGenerating(true);
    setAiSuggestions([]);
    setTimeout(() => {
      setAiGenerating(false);
      setAiSuggestions([
        { id: 's1', title: `Verify ${req.title} — negative scenario`, steps: ['Navigate to feature', 'Input invalid/empty data', 'Assert validation error'], expected: 'Validation blocks submission with clear error message' },
        { id: 's2', title: `Verify ${req.title} — load & performance`, steps: ['Send 100 concurrent requests', 'Verify p95 latency < 400ms'], expected: 'Response stays under threshold' },
        { id: 's3', title: `Verify ${req.title} — responsive layout`, steps: ['Resize to 375px viewport', 'Interact with all elements'], expected: 'Layout adapts, all buttons reachable' },
      ]);
    }, 1500);
  };

  const handleImportSuggestion = async (s) => {
    const count = testCases.length + 1;
    await testCaseService.create({
      projectName: activeProject,
      testId: `TC-${count.toString().padStart(3, '0')}`,
      module: 'Traceability',
      title: s.title,
      steps: s.steps,
      expectedResult: s.expected,
      status: 'Untested',
      priority: 'High',
      severity: 'Major'
    });
    toast.success('AI test case added to backlog!');
    loadData();
  };

  // Filters & analytics
  const filtered = useMemo(() => {
    let list = requirements;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(r =>
        r.title.toLowerCase().includes(q) ||
        r.reqId.toLowerCase().includes(q) ||
        (r.description || '').toLowerCase().includes(q)
      );
    }
    if (priorityFilter !== 'All') list = list.filter(r => r.priority === priorityFilter);
    if (coverageFilter !== 'All') {
      list = list.filter(r => requirementService.getCoverageStatus(r, testCases) === coverageFilter);
    }
    return list;
  }, [requirements, testCases, search, priorityFilter, coverageFilter]);

  const coverageStats = useMemo(() => requirementService.getCoverageStats(requirements, testCases),
    [requirements, testCases]);

  const filteredTcs = useMemo(() => {
    if (!tcSearch) return testCases;
    const q = tcSearch.toLowerCase();
    return testCases.filter(t => t.title.toLowerCase().includes(q) || (t.testId || '').toLowerCase().includes(q));
  }, [testCases, tcSearch]);

  /* ─── MATRIX VIEW ─────────────────────────────────────────────── */
  const MatrixView = () => (
    <div className="overflow-x-auto rounded-xl border" style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}>
      <table className="text-xs w-full" style={{ borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th className="sticky left-0 z-10 py-2 px-3 text-left font-bold text-[10px] uppercase tracking-wider"
              style={{ background: 'var(--color-surface-alt)', color: 'var(--color-text-secondary)', borderBottom: '1px solid var(--color-border)', minWidth: 160, borderRight: '1px solid var(--color-border)' }}>
              Requirement ↓ / Test Case →
            </th>
            {testCases.map(tc => (
              <th key={tc.id} className="py-2 px-2 font-bold text-center"
                style={{ background: 'var(--color-surface-alt)', color: 'var(--color-text-secondary)', borderBottom: '1px solid var(--color-border)', borderLeft: '1px solid var(--color-border)', minWidth: 56 }}>
                <div className="flex flex-col items-center gap-0.5">
                  <span className="font-mono text-[8px] text-neutral-400">{tc.testId}</span>
                  <span className="truncate max-w-[50px]" title={tc.title}>{tc.title.substring(0, 6)}…</span>
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {requirements.map((req, ri) => (
            <tr key={req.id} style={{ background: ri % 2 === 0 ? 'transparent' : 'var(--color-surface-alt)' }}>
              <td className="sticky left-0 py-2 px-3 font-semibold"
                style={{ background: ri % 2 === 0 ? 'var(--color-surface)' : 'var(--color-surface-alt)', borderRight: '1px solid var(--color-border)', borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-primary)', maxWidth: 180 }}>
                <p className="font-mono text-[9px] text-neutral-400">{req.reqId}</p>
                <p className="truncate text-[11px]" title={req.title}>{req.title}</p>
              </td>
              {testCases.map(tc => {
                const linked = (req.linkedTestCaseIds || []).includes(tc.id);
                return (
                  <td key={tc.id} className="text-center py-2"
                    style={{ borderLeft: '1px solid var(--color-border)', borderBottom: '1px solid var(--color-border)' }}>
                    {linked
                      ? <span className="inline-flex items-center justify-center w-4 h-4 rounded-sm"
                          style={{ background: tc.status === 'Pass' ? 'var(--color-pass)' : tc.status === 'Fail' ? 'var(--color-fail)' : 'var(--color-primary)' }}>
                          <span className="text-white font-bold" style={{ fontSize: 8 }}>✓</span>
                        </span>
                      : <span className="text-neutral-200 dark:text-neutral-700 text-sm">·</span>
                    }
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: 'var(--color-text-primary)' }}>
            <FileCheck className="text-indigo-600" /> Traceability Matrix
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
            Map user stories to test cases · track requirements coverage
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select value={activeProject}
            onChange={e => e.target.value === '__add__' ? handleCreateProject() : setActiveProject(e.target.value)}
            className="px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2"
            style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border-strong)', color: 'var(--color-text-primary)' }}>
            {projects.map(p => <option key={p.name} value={p.name}>{p.name}</option>)}
            <option value="__add__" style={{ color: 'var(--color-primary)' }}>+ New Project</option>
          </select>
          <button onClick={() => setShowMatrix(v => !v)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold border transition-colors"
            style={{
              background: showMatrix ? 'var(--color-primary-subtle)' : 'var(--color-surface)',
              borderColor: showMatrix ? 'var(--color-primary)' : 'var(--color-border-strong)',
              color: showMatrix ? 'var(--color-primary)' : 'var(--color-text-secondary)'
            }}>
            <Table2 size={14} />{showMatrix ? 'Hide Matrix' : 'View Matrix'}
          </button>
          <button onClick={openNew}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-colors"
            style={{ background: 'var(--color-primary)' }}>
            <Plus size={16} /> New Requirement
          </button>
        </div>
      </div>

      {/* Coverage summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Requirements', value: coverageStats.total, color: 'var(--color-text-primary)' },
          { label: 'Fully Covered', value: coverageStats.covered, color: 'var(--color-pass)' },
          { label: 'Partially Covered', value: coverageStats.partial, color: 'var(--color-blocked)' },
          { label: 'Not Covered', value: coverageStats.notCovered, color: 'var(--color-fail)' },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-xl p-4 border" style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
            <p className="text-[10px] uppercase font-semibold text-neutral-400">{label}</p>
            <p className="text-2xl font-bold mt-1" style={{ color }}>{value}</p>
            {label === 'Fully Covered' && coverageStats.total > 0 && (
              <p className="text-[10px] text-neutral-400 mt-1">{coverageStats.coveragePct}% coverage</p>
            )}
          </div>
        ))}
      </div>

      {/* Coverage bar */}
      {coverageStats.total > 0 && (
        <div className="rounded-xl p-4 border" style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
          <div className="flex justify-between text-[10px] font-semibold mb-2" style={{ color: 'var(--color-text-muted)' }}>
            <span>Coverage Progress</span>
            <span style={{ color: 'var(--color-text-primary)' }}>{coverageStats.coveragePct}%</span>
          </div>
          <div className="h-2.5 rounded-full overflow-hidden flex" style={{ background: 'var(--color-border)' }}>
            <motion.div initial={{ width: 0 }} animate={{ width: `${(coverageStats.covered / coverageStats.total) * 100}%` }}
              transition={{ duration: 0.6 }} className="h-full" style={{ background: 'var(--color-pass)' }} />
            <motion.div initial={{ width: 0 }} animate={{ width: `${(coverageStats.partial / coverageStats.total) * 100}%` }}
              transition={{ duration: 0.6 }} className="h-full" style={{ background: 'var(--color-blocked)' }} />
          </div>
          <div className="flex items-center gap-4 mt-2 text-[10px]" style={{ color: 'var(--color-text-muted)' }}>
            {[['Covered', 'var(--color-pass)'], ['Partial', 'var(--color-blocked)'], ['Not Covered', 'var(--color-fail)']].map(([l, c]) => (
              <span key={l} className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full" style={{ background: c }} />{l}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Matrix */}
      <AnimatePresence>
        {showMatrix && requirements.length > 0 && testCases.length > 0 && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
            <p className="text-xs font-bold mb-2" style={{ color: 'var(--color-text-primary)' }}>
              Traceability Matrix ({requirements.length} reqs × {testCases.length} cases)
            </p>
            <MatrixView />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Table */}
      <div className="rounded-xl border" style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
        {/* Toolbar */}
        <div className="p-4 border-b flex flex-wrap items-center gap-3" style={{ borderColor: 'var(--color-border)' }}>
          <div className="relative flex-1 min-w-[200px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input type="text" placeholder="Search requirements…" value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-lg focus:outline-none focus:ring-2"
              style={{ background: 'var(--color-surface-alt)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }} />
          </div>
          <select value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-lg focus:outline-none"
            style={{ background: 'var(--color-surface-alt)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}>
            {['All', ...PRIORITIES].map(p => <option key={p}>{p === 'All' ? 'All Priorities' : p}</option>)}
          </select>
          <select value={coverageFilter} onChange={e => setCoverageFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-lg focus:outline-none"
            style={{ background: 'var(--color-surface-alt)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}>
            {COVERAGE_FILTER.map(c => <option key={c}>{c === 'All' ? 'All Coverage' : c}</option>)}
          </select>
          {(search || priorityFilter !== 'All' || coverageFilter !== 'All') && (
            <button onClick={() => { setSearch(''); setPriorityFilter('All'); setCoverageFilter('All'); }}
              className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg"
              style={{ background: 'rgba(220,38,38,0.08)', color: 'var(--color-fail)' }}>
              <X size={11} /> Clear
            </button>
          )}
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs" style={{ color: 'var(--color-text-muted)' }}>Loading requirements…</div>
        ) : filtered.length === 0 ? (
          <div className="py-16 flex flex-col items-center gap-3">
            <FileCheck size={40} className="text-neutral-300 dark:text-neutral-700" />
            <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>No requirements found</p>
            <p className="text-xs text-neutral-400">Create requirements to track your test coverage</p>
            <button onClick={openNew} className="mt-1 px-4 py-2 text-xs font-semibold text-white rounded-lg"
              style={{ background: 'var(--color-primary)' }}>
              <Plus size={12} className="inline mr-1" />New Requirement
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[10px] font-bold uppercase tracking-wider text-left"
                  style={{ background: 'var(--color-surface-alt)', borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-secondary)' }}>
                  <th className="py-3 px-4">Req ID</th>
                  <th className="py-3 px-4">Title / Description</th>
                  <th className="py-3 px-3">Priority</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3">Coverage</th>
                  <th className="py-3 px-3 text-center">Test Cases</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((req, idx) => {
                  const coverage = requirementService.getCoverageStatus(req, testCases);
                  const linksCount = req.linkedTestCaseIds?.length || 0;
                  return (
                    <motion.tr key={req.id}
                      initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.02 }}
                      className="transition-colors"
                      style={{ borderBottom: '1px solid var(--color-border)' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--color-surface-alt)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <td className="py-3 px-4 font-mono font-bold text-xs" style={{ color: 'var(--color-primary)' }}>
                        {req.reqId}
                      </td>
                      <td className="py-3 px-4 max-w-xs">
                        <p className="font-semibold text-xs" style={{ color: 'var(--color-text-primary)' }}>{req.title}</p>
                        {req.description && (
                          <p className="text-[10px] text-neutral-400 mt-0.5 truncate">{req.description}</p>
                        )}
                      </td>
                      <td className="py-3 px-3"><PriorityBadge p={req.priority || 'Medium'} /></td>
                      <td className="py-3 px-3"><StatusBadge s={req.status || 'Draft'} /></td>
                      <td className="py-3 px-3"><CoverageBadge status={coverage} /></td>
                      <td className="py-3 px-3 text-center">
                        <button onClick={() => setLinkingReq(req)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold border transition-colors"
                          style={{
                            borderColor: linksCount > 0 ? 'var(--color-primary)' : 'var(--color-border)',
                            color: linksCount > 0 ? 'var(--color-primary)' : 'var(--color-text-muted)',
                            background: linksCount > 0 ? 'var(--color-primary-subtle)' : 'transparent'
                          }}>
                          <Link2 size={10} />{linksCount}
                        </button>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => triggerAi(req)}
                            title="AI Suggestions"
                            className="p-1.5 rounded-lg text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors">
                            <Sparkles size={13} />
                          </button>
                          <button onClick={() => handleEdit(req)}
                            className="p-1.5 rounded-lg transition-colors"
                            style={{ color: 'var(--color-text-muted)' }}
                            onMouseEnter={e => e.currentTarget.style.background = 'var(--color-surface-alt)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                            <Edit2 size={13} />
                          </button>
                          <button onClick={() => { setDeleteTarget(req.id); setConfirmOpen(true); }}
                            className="p-1.5 rounded-lg transition-colors"
                            style={{ color: 'var(--color-text-muted)' }}
                            onMouseEnter={e => { e.currentTarget.style.color = 'var(--color-fail)'; e.currentTarget.style.background = 'rgba(220,38,38,0.07)'; }}
                            onMouseLeave={e => { e.currentTarget.style.color = 'var(--color-text-muted)'; e.currentTarget.style.background = 'transparent'; }}>
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)}
        title={editingReq ? 'Edit Requirement' : 'New Requirement'} size="md">
        <div className="space-y-4">
          <div className="grid grid-cols-4 gap-3">
            <div className="col-span-1">
              <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--color-text-secondary)' }}>Req ID</label>
              <input type="text" value={form.reqId}
                onChange={e => setForm(p => ({ ...p, reqId: e.target.value }))}
                placeholder="REQ-001"
                className="w-full px-3 py-2 text-xs rounded-lg font-mono focus:outline-none focus:ring-2"
                style={{ background: 'var(--color-surface-alt)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }} />
            </div>
            <div className="col-span-3">
              <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--color-text-secondary)' }}>Title *</label>
              <input type="text" value={form.title}
                onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                placeholder="As a user, I should be able to login…"
                className="w-full px-3 py-2 text-xs rounded-lg focus:outline-none focus:ring-2"
                style={{ background: 'var(--color-surface-alt)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--color-text-secondary)' }}>
              Description / Acceptance Criteria
            </label>
            <textarea value={form.description}
              onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              rows={3} placeholder="Given / When / Then acceptance criteria…"
              className="w-full px-3 py-2 text-xs rounded-lg focus:outline-none focus:ring-2 resize-none"
              style={{ background: 'var(--color-surface-alt)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--color-text-secondary)' }}>Priority</label>
              <select value={form.priority} onChange={e => setForm(p => ({ ...p, priority: e.target.value }))}
                className="w-full px-3 py-2 text-xs rounded-lg focus:outline-none focus:ring-2"
                style={{ background: 'var(--color-surface-alt)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}>
                {PRIORITIES.map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--color-text-secondary)' }}>Status</label>
              <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}
                className="w-full px-3 py-2 text-xs rounded-lg focus:outline-none focus:ring-2"
                style={{ background: 'var(--color-surface-alt)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}>
                {STATUSES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <button onClick={() => setModalOpen(false)} className="px-4 py-2 text-xs font-semibold"
              style={{ color: 'var(--color-text-secondary)' }}>Cancel</button>
            <button onClick={handleSave} className="px-5 py-2 text-xs font-bold text-white rounded-lg"
              style={{ background: 'var(--color-primary)' }}>
              {editingReq ? 'Update' : 'Create'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Link Test Cases Modal */}
      <Modal isOpen={!!linkingReq} onClose={() => { setLinkingReq(null); setTcSearch(''); }}
        title={`Link Test Cases — ${linkingReq?.reqId}`} size="md">
        {linkingReq && (
          <div className="space-y-3">
            <div className="p-3 rounded-lg border" style={{ background: 'var(--color-surface-alt)', borderColor: 'var(--color-border)' }}>
              <p className="text-xs font-bold" style={{ color: 'var(--color-text-primary)' }}>{linkingReq.title}</p>
              <p className="text-[10px] text-neutral-400 mt-1">{linkingReq.description || 'No description'}</p>
              <div className="flex items-center gap-2 mt-2">
                <PriorityBadge p={linkingReq.priority || 'Medium'} />
                <StatusBadge s={linkingReq.status || 'Draft'} />
              </div>
            </div>
            <div className="relative">
              <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input type="text" value={tcSearch} onChange={e => setTcSearch(e.target.value)}
                placeholder="Search test cases…"
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg focus:outline-none focus:ring-2"
                style={{ background: 'var(--color-surface-alt)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }} />
            </div>
            <div className="max-h-64 overflow-y-auto space-y-1 border rounded-lg p-2"
              style={{ borderColor: 'var(--color-border)' }}>
              {filteredTcs.length === 0
                ? <p className="text-xs text-neutral-400 py-4 text-center">No test cases found</p>
                : filteredTcs.map(tc => {
                  const isLinked = (linkingReq.linkedTestCaseIds || []).includes(tc.id);
                  return (
                    <div key={tc.id} onClick={() => handleToggleLink(tc.id)}
                      className="flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors"
                      style={{ background: isLinked ? 'var(--color-primary-subtle)' : 'transparent' }}
                      onMouseEnter={e => { if (!isLinked) e.currentTarget.style.background = 'var(--color-border)'; }}
                      onMouseLeave={e => { if (!isLinked) e.currentTarget.style.background = 'transparent'; }}>
                      <div className="flex items-center gap-2 min-w-0">
                        <input type="checkbox" checked={isLinked} readOnly
                          className="w-3.5 h-3.5 rounded shrink-0"
                          style={{ accentColor: 'var(--color-primary)' }} />
                        <span className="font-mono text-[9px] font-bold text-neutral-400 shrink-0">{tc.testId}</span>
                        <span className="text-xs truncate" style={{ color: 'var(--color-text-primary)' }}>{tc.title}</span>
                      </div>
                      <span className="text-[9px] px-1.5 py-0.5 rounded font-bold shrink-0"
                        style={{ background: tc.status === 'Pass' ? 'rgba(22,163,74,0.1)' : tc.status === 'Fail' ? 'rgba(220,38,38,0.1)' : 'var(--color-surface-alt)', color: tc.status === 'Pass' ? 'var(--color-pass)' : tc.status === 'Fail' ? 'var(--color-fail)' : 'var(--color-text-muted)' }}>
                        {tc.status || 'Untested'}
                      </span>
                    </div>
                  );
                })
              }
            </div>
            <p className="text-[10px] font-semibold" style={{ color: 'var(--color-primary)' }}>
              {(linkingReq.linkedTestCaseIds || []).length} case(s) linked
            </p>
            <div className="flex justify-end pt-1">
              <button onClick={() => { setLinkingReq(null); setTcSearch(''); }}
                className="px-5 py-2 text-xs font-bold text-white rounded-lg"
                style={{ background: 'var(--color-primary)' }}>Done</button>
            </div>
          </div>
        )}
      </Modal>

      {/* AI Modal */}
      <Modal isOpen={aiModalOpen} onClose={() => setAiModalOpen(false)} title="AI Coverage Suggestions" size="md">
        <div className="space-y-4">
          <div className="flex items-center gap-2 p-3 rounded-lg border border-purple-200 dark:border-purple-800"
            style={{ background: 'rgba(147,51,234,0.06)' }}>
            <Sparkles size={14} className="text-purple-500 shrink-0" />
            <p className="text-[11px] text-purple-700 dark:text-purple-300 leading-relaxed">
              Analysing requirement gaps and generating suggested test scenarios…
            </p>
          </div>
          {aiGenerating ? (
            <div className="py-10 flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-purple-300 border-t-purple-600 rounded-full animate-spin" />
              <p className="text-xs text-neutral-400">Generating suggestions…</p>
            </div>
          ) : (
            <div className="space-y-2">
              {aiSuggestions.map(s => (
                <div key={s.id} className="p-3 border rounded-xl"
                  style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface-alt)' }}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold" style={{ color: 'var(--color-text-primary)' }}>{s.title}</h4>
                      <ol className="mt-1.5 space-y-0.5 list-decimal pl-4">
                        {s.steps.map((st, i) => (
                          <li key={i} className="text-[10px] text-neutral-400 font-mono">{st}</li>
                        ))}
                      </ol>
                    </div>
                    <button onClick={() => handleImportSuggestion(s)}
                      className="shrink-0 flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-lg transition">
                      <Plus size={10} /> Add
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="flex justify-end pt-1 border-t" style={{ borderColor: 'var(--color-border)' }}>
            <button onClick={() => setAiModalOpen(false)} className="px-4 py-2 text-xs font-semibold"
              style={{ color: 'var(--color-text-secondary)' }}>Close</button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog isOpen={confirmOpen} onClose={() => setConfirmOpen(false)} onConfirm={handleDelete}
        title="Delete Requirement" message="This will permanently delete this requirement." />
    </div>
  );
}
