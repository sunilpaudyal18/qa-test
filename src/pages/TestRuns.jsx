import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, PlayCircle, Trash2, CheckCircle2, XCircle, AlertTriangle,
  HelpCircle, Play, Clock, ArrowLeft, User, Copy, Eye,
  ClipboardList, RotateCcw, Link2, Image as ImageIcon, ExternalLink
} from 'lucide-react';
import { testRunService } from '../services/testRunService';
import { testCaseService } from '../services/testCaseService';
import { projectService } from '../services/projectService';
import { useToast } from '../contexts/ToastContext';
import Modal from '../components/ui/Modal';
import ConfirmDialog from '../components/ui/ConfirmDialog';

const STATUS_CONFIG = {
  Pass:     { color: 'var(--color-pass)',    bg: 'rgba(22,163,74,0.12)',   border: 'rgba(22,163,74,0.25)',   Icon: CheckCircle2 },
  Fail:     { color: 'var(--color-fail)',    bg: 'rgba(220,38,38,0.12)',   border: 'rgba(220,38,38,0.25)',   Icon: XCircle },
  Blocked:  { color: 'var(--color-blocked)', bg: 'rgba(217,119,6,0.12)',   border: 'rgba(217,119,6,0.25)',   Icon: AlertTriangle },
  Untested: { color: 'var(--color-untested)',bg: 'rgba(107,114,128,0.08)', border: 'rgba(107,114,128,0.15)', Icon: HelpCircle },
};

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.Untested;
  const { Icon } = cfg;
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold"
      style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}>
      <Icon size={10} />{status === 'Untested' ? 'Not Run' : status}
    </span>
  );
}

function MiniProgressBar({ stats }) {
  if (!stats || stats.total === 0) return <div className="h-1.5 rounded-full bg-neutral-200 dark:bg-neutral-700 w-full" />;
  return (
    <div className="h-1.5 rounded-full overflow-hidden flex w-full" style={{ background: 'var(--color-border)' }}>
      <div style={{ width: `${(stats.pass / stats.total) * 100}%`, background: 'var(--color-pass)' }} />
      <div style={{ width: `${(stats.fail / stats.total) * 100}%`, background: 'var(--color-fail)' }} />
      <div style={{ width: `${(stats.blocked / stats.total) * 100}%`, background: 'var(--color-blocked)' }} />
    </div>
  );
}

export default function TestRuns() {
  const [runs, setRuns] = useState([]);
  const [testCases, setTestCases] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeProject, setActiveProject] = useState(
    () => localStorage.getItem('qa_active_project') || ''
  );
  const toast = useToast();

  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', testCaseIds: [] });
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [runStats, setRunStats] = useState({});

  // View modal
  const [viewRun, setViewRun] = useState(null);
  const [viewResults, setViewResults] = useState([]);

  // Execution state
  const [activeRun, setActiveRun] = useState(null);
  const [activeRunResults, setActiveRunResults] = useState([]);
  const [selectedTcId, setSelectedTcId] = useState(null);
  const [executionForm, setExecutionForm] = useState({
    notes: '', executedBy: 'QA Engineer', evidence: null, bugLink: ''
  });

  useEffect(() => {
    if (activeProject) localStorage.setItem('qa_active_project', activeProject);
  }, [activeProject]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [projData] = await Promise.all([projectService.getAll()]);
      setProjects(projData);

      const proj = activeProject || projData[0]?.name || '';
      if (!activeProject && proj) setActiveProject(proj);

      const [runsData, tcData] = await Promise.all([
        testRunService.getAll(proj),
        testCaseService.getAll(proj)
      ]);
      setRuns(runsData);
      setTestCases(tcData);

      const statsMap = {};
      await Promise.all(runsData.map(async run => {
        statsMap[run.id] = await testRunService.getStats(run.id, run.testCaseIds || []);
      }));
      setRunStats(statsMap);
    } catch {
      toast.error('Failed to load test runs');
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

  const handleSaveRun = async () => {
    if (!form.name.trim()) { toast.warning('Run name is required'); return; }
    if (form.testCaseIds.length === 0) { toast.warning('Select at least one test case'); return; }
    await testRunService.create({
      name: form.name, description: form.description,
      projectName: activeProject, testCaseIds: form.testCaseIds
    });
    toast.success('Test run created');
    setModalOpen(false);
    setForm({ name: '', description: '', testCaseIds: [] });
    loadData();
  };

  const handleDelete = async () => {
    if (deleteTarget) {
      await testRunService.delete(deleteTarget);
      toast.success('Test run deleted');
      setConfirmOpen(false);
      loadData();
    }
  };

  const handleDuplicate = async (run) => {
    await testRunService.duplicate(run.id);
    toast.success(`"${run.name}" duplicated`);
    loadData();
  };

  const handleView = async (run) => {
    const results = await testRunService.getResults(run.id);
    setViewResults(results);
    setViewRun(run);
  };

  const startExecution = async (run) => {
    const results = await testRunService.getResults(run.id);
    setActiveRun(run);
    setActiveRunResults(results);
    const firstId = run.testCaseIds[0] || null;
    setSelectedTcId(firstId);
    const res = results.find(r => r.testCaseId === firstId);
    setExecutionForm({
      notes: res?.notes || '', executedBy: res?.executedBy || 'QA Engineer',
      evidence: res?.evidence || null, bugLink: res?.bugLink || ''
    });
  };

  const handleSelectCase = (tcId) => {
    setSelectedTcId(tcId);
    const res = activeRunResults.find(r => r.testCaseId === tcId);
    setExecutionForm({
      notes: res?.notes || '', executedBy: res?.executedBy || 'QA Engineer',
      evidence: res?.evidence || null, bugLink: res?.bugLink || ''
    });
  };

  const handleExecuteCase = async (status) => {
    if (!activeRun || !selectedTcId) return;
    await testRunService.updateResult(activeRun.id, selectedTcId, status, executionForm);
    toast.success(status === 'Untested' ? 'Reset to Not Executed' : `Marked as ${status}`);

    const nextResults = await testRunService.getResults(activeRun.id);
    setActiveRunResults(nextResults);

    // Auto-complete run check
    if (status !== 'Untested') {
      const allDone = nextResults.every(r => r.status !== 'Untested');
      if (allDone && activeRun.status !== 'Completed') {
        const updated = await testRunService.update(activeRun.id, {
          status: 'Completed', completedAt: new Date().toISOString()
        });
        setActiveRun(updated);
        toast.success('🎉 All cases executed! Run marked Completed.');
      }
    }

    // Auto-advance to next case
    if (status !== 'Untested') {
      const idx = activeRun.testCaseIds.indexOf(selectedTcId);
      if (idx < activeRun.testCaseIds.length - 1) {
        handleSelectCase(activeRun.testCaseIds[idx + 1]);
      }
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (ev) => setExecutionForm(p => ({ ...p, evidence: ev.target.result }));
    reader.readAsDataURL(file);
  };

  const handleToggleCaseSelection = (tcId) => {
    setForm(p => ({
      ...p,
      testCaseIds: p.testCaseIds.includes(tcId)
        ? p.testCaseIds.filter(id => id !== tcId)
        : [...p.testCaseIds, tcId]
    }));
  };

  const selectedTestCase = useMemo(() =>
    testCases.find(tc => tc.id === selectedTcId), [testCases, selectedTcId]);

  const activeStats = useMemo(() => {
    if (!activeRun) return null;
    const s = { pass: 0, fail: 0, blocked: 0, untested: 0, total: activeRun.testCaseIds.length };
    activeRunResults.forEach(r => {
      if (r.status === 'Pass') s.pass++;
      else if (r.status === 'Fail') s.fail++;
      else if (r.status === 'Blocked') s.blocked++;
      else s.untested++;
    });
    const executed = s.pass + s.fail + s.blocked;
    s.passRate = executed > 0 ? Math.round((s.pass / executed) * 100) : 0;
    s.completionPct = s.total > 0 ? Math.round((executed / s.total) * 100) : 0;
    return s;
  }, [activeRun, activeRunResults]);

  /* ─── EXECUTION SCREEN ───────────────────────────────────── */
  if (activeRun) {
    return (
      <div className="space-y-4">
        {/* Topbar */}
        <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: 'var(--color-border)' }}>
          <div>
            <button onClick={() => { setActiveRun(null); loadData(); }}
              className="flex items-center gap-1.5 text-xs font-semibold mb-1"
              style={{ color: 'var(--color-primary)' }}>
              <ArrowLeft size={13} /> Back to Runs
            </button>
            <h1 className="text-lg font-bold" style={{ color: 'var(--color-text-primary)' }}>{activeRun.name}</h1>
            <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{activeRun.description || 'No description'}</p>
          </div>
          <div className="flex items-center gap-3">
            {activeStats && (
              <span className="text-xs font-bold" style={{ color: activeStats.passRate >= 80 ? 'var(--color-pass)' : 'var(--color-text-primary)' }}>
                {activeStats.passRate}% Pass Rate
              </span>
            )}
            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase"
              style={{
                background: activeRun.status === 'Completed' ? 'rgba(22,163,74,0.12)' : 'rgba(99,102,241,0.12)',
                color: activeRun.status === 'Completed' ? 'var(--color-pass)' : 'var(--color-primary)'
              }}>
              {activeRun.status}
            </span>
          </div>
        </div>

        {/* Progress bar */}
        {activeStats && (
          <div className="p-3 rounded-xl border" style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
            <div className="flex items-center justify-between text-xs mb-2">
              <div className="flex items-center gap-4 font-semibold">
                {[['Pass', 'var(--color-pass)'], ['Fail', 'var(--color-fail)'], ['Blocked', 'var(--color-blocked)']].map(([k, c]) => (
                  <span key={k} className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full" style={{ background: c }} />
                    {k}: {activeStats[k.toLowerCase()]}
                  </span>
                ))}
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: 'var(--color-untested)' }} />
                  Not Run: {activeStats.untested}
                </span>
              </div>
              <span className="text-neutral-400">{activeStats.completionPct}% complete</span>
            </div>
            <div className="h-2 rounded-full overflow-hidden flex" style={{ background: 'var(--color-border)' }}>
              {activeStats.total > 0 && (
                <>
                  <motion.div initial={{ width: 0 }} animate={{ width: `${(activeStats.pass / activeStats.total) * 100}%` }} transition={{ duration: 0.4 }} style={{ background: 'var(--color-pass)' }} />
                  <motion.div initial={{ width: 0 }} animate={{ width: `${(activeStats.fail / activeStats.total) * 100}%` }} transition={{ duration: 0.4 }} style={{ background: 'var(--color-fail)' }} />
                  <motion.div initial={{ width: 0 }} animate={{ width: `${(activeStats.blocked / activeStats.total) * 100}%` }} transition={{ duration: 0.4 }} style={{ background: 'var(--color-blocked)' }} />
                </>
              )}
            </div>
          </div>
        )}

        {/* 2-col workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4" style={{ minHeight: 480 }}>
          {/* Left: case list */}
          <div className="lg:col-span-1 border rounded-xl overflow-hidden flex flex-col"
            style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
            <div className="px-3 py-2.5 border-b text-[10px] font-bold uppercase tracking-wider"
              style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface-alt)', color: 'var(--color-text-secondary)' }}>
              Test Cases ({activeRun.testCaseIds.length})
            </div>
            <div className="flex-1 overflow-y-auto divide-y" style={{ divideColor: 'var(--color-border)' }}>
              {activeRun.testCaseIds.map(tcId => {
                const tc = testCases.find(t => t.id === tcId);
                const res = activeRunResults.find(r => r.testCaseId === tcId);
                const status = res?.status || 'Untested';
                const isSelected = selectedTcId === tcId;
                return (
                  <div key={tcId} onClick={() => handleSelectCase(tcId)}
                    className="p-2.5 cursor-pointer transition-colors flex items-center justify-between gap-2"
                    style={{ background: isSelected ? 'var(--color-primary-subtle)' : 'transparent', borderBottom: '1px solid var(--color-border)' }}>
                    <div className="min-w-0">
                      <p className="font-mono text-[9px] font-bold text-neutral-400">{tc?.testId || 'TC'}</p>
                      <p className="text-xs font-semibold truncate" style={{ color: isSelected ? 'var(--color-primary)' : 'var(--color-text-primary)' }}>
                        {tc?.title || 'Untitled'}
                      </p>
                    </div>
                    <StatusBadge status={status} />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right: execution workbench */}
          <div className="lg:col-span-3 border rounded-xl p-5 space-y-4"
            style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
            {selectedTestCase ? (
              <div className="space-y-4">
                {/* TC header */}
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded"
                      style={{ background: 'var(--color-primary-subtle)', color: 'var(--color-primary)' }}>
                      {selectedTestCase.testId}
                    </span>
                    <span className="text-[10px] font-semibold" style={{ color: 'var(--color-text-muted)' }}>
                      {selectedTestCase.module || 'Uncategorized'}
                    </span>
                    {selectedTestCase.priority && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded"
                        style={{
                          background: selectedTestCase.priority === 'Critical' ? 'rgba(220,38,38,0.1)' : 'var(--color-surface-alt)',
                          color: selectedTestCase.priority === 'Critical' ? 'var(--color-fail)' : 'var(--color-text-muted)'
                        }}>
                        {selectedTestCase.priority}
                      </span>
                    )}
                  </div>
                  <h2 className="text-sm font-bold mt-2" style={{ color: 'var(--color-text-primary)' }}>
                    {selectedTestCase.title}
                  </h2>
                </div>

                {/* Steps & Expected */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg border" style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface-alt)' }}>
                    <p className="text-xs font-bold mb-2" style={{ color: 'var(--color-text-primary)' }}>Steps</p>
                    {(selectedTestCase.steps || []).length === 0
                      ? <p className="text-[11px] text-neutral-400 italic">No steps defined</p>
                      : <ol className="list-decimal pl-4 space-y-1" style={{ color: 'var(--color-text-secondary)' }}>
                          {(selectedTestCase.steps || []).map((s, i) => (
                            <li key={i} className="text-xs leading-relaxed">{s}</li>
                          ))}
                        </ol>
                    }
                  </div>
                  <div className="p-3 rounded-lg border" style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface-alt)' }}>
                    <p className="text-xs font-bold mb-2" style={{ color: 'var(--color-text-primary)' }}>Expected Result</p>
                    <p className="text-xs leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                      {selectedTestCase.expectedResult || 'No expected result specified.'}
                    </p>
                  </div>
                </div>

                {/* Execution form */}
                <div className="space-y-3 pt-3 border-t" style={{ borderColor: 'var(--color-border)' }}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--color-text-secondary)' }}>
                        Executed By
                      </label>
                      <div className="relative">
                        <User size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                        <input type="text" value={executionForm.executedBy}
                          onChange={e => setExecutionForm(p => ({ ...p, executedBy: e.target.value }))}
                          className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg focus:outline-none focus:ring-2"
                          style={{ background: 'var(--color-surface-alt)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }} />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--color-text-secondary)' }}>
                        Bug / Ticket Link
                      </label>
                      <div className="relative">
                        <Link2 size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                        <input type="text" value={executionForm.bugLink}
                          onChange={e => setExecutionForm(p => ({ ...p, bugLink: e.target.value }))}
                          placeholder="e.g. BUG-401 or https://jira..."
                          className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg focus:outline-none focus:ring-2"
                          style={{ background: 'var(--color-surface-alt)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }} />
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--color-text-secondary)' }}>
                      Execution Notes / Actual Result
                    </label>
                    <textarea value={executionForm.notes}
                      onChange={e => setExecutionForm(p => ({ ...p, notes: e.target.value }))}
                      rows={2} placeholder="Describe what happened or paste error message..."
                      className="w-full px-3 py-2 text-xs rounded-lg focus:outline-none focus:ring-2 resize-none"
                      style={{ background: 'var(--color-surface-alt)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }} />
                  </div>
                  <div>
                    <label className="text-xs font-semibold mb-1.5 block" style={{ color: 'var(--color-text-secondary)' }}>
                      <span className="flex items-center gap-1.5"><ImageIcon size={11} /> Screenshot Evidence</span>
                    </label>
                    <input type="file" accept="image/*" onChange={handleImageUpload}
                      className="text-xs file:mr-2 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-[10px] file:font-semibold file:bg-indigo-50 dark:file:bg-indigo-900/20 file:text-indigo-600 dark:file:text-indigo-400 cursor-pointer"
                      style={{ color: 'var(--color-text-muted)' }} />
                    {executionForm.evidence && (
                      <div className="relative inline-block mt-2">
                        <img src={executionForm.evidence} alt="Evidence" className="h-16 rounded border" style={{ borderColor: 'var(--color-border)' }} />
                        <button onClick={() => setExecutionForm(p => ({ ...p, evidence: null }))}
                          className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-red-600 text-white flex items-center justify-center text-[9px] font-bold">✕</button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-2 justify-between pt-3 border-t" style={{ borderColor: 'var(--color-border)' }}>
                  <button onClick={() => handleExecuteCase('Untested')}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-800"
                    style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' }}>
                    <RotateCcw size={12} /> Reset
                  </button>
                  <div className="flex items-center gap-2">
                    <button onClick={() => handleExecuteCase('Blocked')}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold border transition-colors"
                      style={{ borderColor: 'rgba(217,119,6,0.35)', color: 'var(--color-blocked)' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(217,119,6,0.07)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <AlertTriangle size={12} /> Blocked
                    </button>
                    <button onClick={() => handleExecuteCase('Fail')}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold border transition-colors"
                      style={{ borderColor: 'rgba(220,38,38,0.35)', color: 'var(--color-fail)' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(220,38,38,0.07)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <XCircle size={12} /> Fail
                    </button>
                    <button onClick={() => handleExecuteCase('Pass')}
                      className="flex items-center gap-1.5 px-5 py-2 rounded-lg text-xs font-bold text-white transition-colors bg-green-600 hover:bg-green-500">
                      <CheckCircle2 size={12} /> Pass
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-20 flex flex-col items-center justify-center text-center gap-2">
                <PlayCircle size={40} style={{ color: 'var(--color-border)' }} />
                <p className="text-sm font-semibold" style={{ color: 'var(--color-text-secondary)' }}>
                  Select a test case to begin
                </p>
                <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                  Click any case in the left panel
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  /* ─── LIST VIEW ──────────────────────────────────────────── */
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: 'var(--color-text-primary)' }}>
            <ClipboardList className="text-indigo-500" /> Test Run Cycles
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
            Execute, track, and analyze regression cycles and release checklists
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
          <button onClick={() => { setForm({ name: '', description: '', testCaseIds: [] }); setModalOpen(true); }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-colors"
            style={{ background: 'var(--color-primary)' }}>
            <Plus size={16} /> New Run
          </button>
        </div>
      </div>

      {/* Stats overview */}
      {runs.length > 0 && (() => {
        const allStats = Object.values(runStats);
        const totalCases = allStats.reduce((s, st) => s + (st.total || 0), 0);
        const totalPass = allStats.reduce((s, st) => s + (st.pass || 0), 0);
        const totalFail = allStats.reduce((s, st) => s + (st.fail || 0), 0);
        const completed = runs.filter(r => r.status === 'Completed').length;
        return (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Total Runs', value: runs.length, color: 'var(--color-primary)' },
              { label: 'Completed', value: completed, color: 'var(--color-pass)' },
              { label: 'Total Cases', value: totalCases, color: 'var(--color-text-primary)' },
              { label: 'Failures', value: totalFail, color: totalFail > 0 ? 'var(--color-fail)' : 'var(--color-pass)' },
            ].map(({ label, value, color }) => (
              <div key={label} className="rounded-xl p-4 border" style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
                <p className="text-[10px] uppercase font-semibold text-neutral-400 mb-1">{label}</p>
                <p className="text-2xl font-bold tabular-nums" style={{ color }}>{value}</p>
              </div>
            ))}
          </div>
        );
      })()}

      {/* Table */}
      {loading ? (
        <div className="py-16 text-center" style={{ color: 'var(--color-text-muted)' }}>Loading runs...</div>
      ) : runs.length === 0 ? (
        <div className="py-20 border rounded-xl flex flex-col items-center justify-center text-center gap-3"
          style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
          <PlayCircle size={44} style={{ color: 'var(--color-border)' }} />
          <p className="text-base font-semibold" style={{ color: 'var(--color-text-primary)' }}>No test runs yet</p>
          <p className="text-xs max-w-xs" style={{ color: 'var(--color-text-muted)' }}>
            Create a test run cycle to link test cases and record live pass/fail execution results.
          </p>
          <button onClick={() => { setForm({ name: '', description: '', testCaseIds: [] }); setModalOpen(true); }}
            className="mt-1 px-4 py-2 rounded-lg text-xs font-semibold text-white"
            style={{ background: 'var(--color-primary)' }}>
            <Plus size={13} className="inline mr-1" />Create First Run
          </button>
        </div>
      ) : (
        <div className="rounded-xl border overflow-hidden"
          style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[10px] font-bold uppercase tracking-wider text-left"
                  style={{ background: 'var(--color-surface-alt)', borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-secondary)' }}>
                  <th className="py-3 px-4">Run Name</th>
                  <th className="py-3 px-3">Project</th>
                  <th className="py-3 px-3 text-center">Total</th>
                  <th className="py-3 px-3 text-center">Pass</th>
                  <th className="py-3 px-3 text-center">Fail</th>
                  <th className="py-3 px-3 text-center">Blocked</th>
                  <th className="py-3 px-3 text-center">Not Run</th>
                  <th className="py-3 px-3 text-center">Pass %</th>
                  <th className="py-3 px-3">Progress</th>
                  <th className="py-3 px-4">Created</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ divideColor: 'var(--color-border)' }}>
                {runs.map((run, idx) => {
                  const stats = runStats[run.id] || { pass: 0, fail: 0, blocked: 0, untested: 0, total: 0, passRate: 0 };
                  return (
                    <motion.tr key={run.id}
                      initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.03 }}
                      className="transition-colors"
                      style={{ borderBottom: '1px solid var(--color-border)' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--color-surface-alt)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <td className="py-3 px-4">
                        <p className="font-semibold text-xs" style={{ color: 'var(--color-text-primary)' }}>{run.name}</p>
                        {run.description && (
                          <p className="text-[10px] text-neutral-400 mt-0.5 truncate max-w-[200px]">{run.description}</p>
                        )}
                        <span className="inline-block mt-1 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase"
                          style={{
                            background: run.status === 'Completed' ? 'rgba(22,163,74,0.1)' : 'rgba(99,102,241,0.1)',
                            color: run.status === 'Completed' ? 'var(--color-pass)' : 'var(--color-primary)'
                          }}>
                          {run.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-xs text-neutral-400">{run.projectName}</td>
                      <td className="py-3 px-3 text-center text-xs font-mono font-bold" style={{ color: 'var(--color-text-primary)' }}>{stats.total}</td>
                      <td className="py-3 px-3 text-center text-xs font-mono font-bold" style={{ color: 'var(--color-pass)' }}>{stats.pass}</td>
                      <td className="py-3 px-3 text-center text-xs font-mono font-bold" style={{ color: 'var(--color-fail)' }}>{stats.fail}</td>
                      <td className="py-3 px-3 text-center text-xs font-mono font-bold" style={{ color: 'var(--color-blocked)' }}>{stats.blocked}</td>
                      <td className="py-3 px-3 text-center text-xs font-mono text-neutral-400">{stats.untested}</td>
                      <td className="py-3 px-3 text-center">
                        <span className="text-xs font-bold" style={{ color: stats.passRate >= 80 ? 'var(--color-pass)' : stats.passRate >= 50 ? 'var(--color-blocked)' : 'var(--color-fail)' }}>
                          {stats.passRate}%
                        </span>
                      </td>
                      <td className="py-3 px-3 min-w-[100px]">
                        <MiniProgressBar stats={stats} />
                      </td>
                      <td className="py-3 px-4">
                        <span className="flex items-center gap-1 text-[10px] text-neutral-400 font-mono">
                          <Clock size={9} />{new Date(run.createdAt).toLocaleDateString()}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => handleView(run)}
                            title="View Details"
                            className="p-1.5 rounded-lg transition-colors"
                            style={{ color: 'var(--color-text-muted)' }}
                            onMouseEnter={e => e.currentTarget.style.background = 'var(--color-surface-alt)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                            <Eye size={14} />
                          </button>
                          <button onClick={() => startExecution(run)}
                            title="Execute Run"
                            className="p-1.5 rounded-lg transition-colors"
                            style={{ color: 'var(--color-primary)' }}
                            onMouseEnter={e => e.currentTarget.style.background = 'var(--color-primary-subtle)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                            <Play size={14} />
                          </button>
                          <button onClick={() => handleDuplicate(run)}
                            title="Duplicate Run"
                            className="p-1.5 rounded-lg transition-colors"
                            style={{ color: 'var(--color-text-muted)' }}
                            onMouseEnter={e => e.currentTarget.style.background = 'var(--color-surface-alt)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                            <Copy size={14} />
                          </button>
                          <button onClick={() => { setDeleteTarget(run.id); setConfirmOpen(true); }}
                            title="Delete Run"
                            className="p-1.5 rounded-lg transition-colors"
                            style={{ color: 'var(--color-text-muted)' }}
                            onMouseEnter={e => { e.currentTarget.style.color = 'var(--color-fail)'; e.currentTarget.style.background = 'rgba(220,38,38,0.07)'; }}
                            onMouseLeave={e => { e.currentTarget.style.color = 'var(--color-text-muted)'; e.currentTarget.style.background = 'transparent'; }}>
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Run Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Create Test Run Cycle" size="md">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--color-text-secondary)' }}>
              Run Name *
            </label>
            <input type="text" value={form.name}
              onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
              placeholder="e.g. Sprint 14 Regression Cycle"
              className="w-full px-3 py-2 text-xs rounded-lg focus:outline-none focus:ring-2"
              style={{ background: 'var(--color-surface-alt)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }} />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--color-text-secondary)' }}>
              Description
            </label>
            <textarea value={form.description}
              onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              rows={2} placeholder="e.g. Regression suite for Q2 release"
              className="w-full px-3 py-2 text-xs rounded-lg focus:outline-none focus:ring-2 resize-none"
              style={{ background: 'var(--color-surface-alt)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }} />
          </div>
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs font-bold" style={{ color: 'var(--color-text-primary)' }}>
                Select Test Cases *
              </label>
              <div className="flex items-center gap-1.5 text-[10px]">
                <input type="checkbox"
                  checked={testCases.length > 0 && form.testCaseIds.length === testCases.length}
                  onChange={e => setForm(p => ({ ...p, testCaseIds: e.target.checked ? testCases.map(tc => tc.id) : [] }))}
                  className="w-3.5 h-3.5 rounded"
                  style={{ accentColor: 'var(--color-primary)' }} />
                <span style={{ color: 'var(--color-text-secondary)' }}>Select All ({testCases.length})</span>
              </div>
            </div>
            <div className="max-h-52 overflow-y-auto space-y-1 border rounded-lg p-2"
              style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface-alt)' }}>
              {testCases.length === 0
                ? <p className="text-xs text-neutral-400 py-4 text-center">No test cases in this project</p>
                : testCases.map(tc => (
                  <div key={tc.id} onClick={() => handleToggleCaseSelection(tc.id)}
                    className="flex items-center gap-2 p-1.5 rounded cursor-pointer transition-colors"
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--color-border)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <input type="checkbox" checked={form.testCaseIds.includes(tc.id)} readOnly
                      className="w-3.5 h-3.5 rounded shrink-0"
                      style={{ accentColor: 'var(--color-primary)' }} />
                    <span className="font-mono text-[9px] font-bold text-neutral-400">{tc.testId}</span>
                    <span className="text-xs truncate" style={{ color: 'var(--color-text-primary)' }}>{tc.title}</span>
                    <StatusBadge status={tc.status || 'Untested'} />
                  </div>
                ))
              }
            </div>
            {form.testCaseIds.length > 0 && (
              <p className="text-[10px] mt-1 font-semibold" style={{ color: 'var(--color-primary)' }}>
                {form.testCaseIds.length} case(s) selected
              </p>
            )}
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <button onClick={() => setModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold"
              style={{ color: 'var(--color-text-secondary)' }}>Cancel</button>
            <button onClick={handleSaveRun}
              className="px-5 py-2 text-xs font-semibold text-white rounded-lg"
              style={{ background: 'var(--color-primary)' }}>
              Create Run
            </button>
          </div>
        </div>
      </Modal>

      {/* View Details Modal */}
      <Modal isOpen={!!viewRun} onClose={() => setViewRun(null)}
        title={viewRun ? `Run Details — ${viewRun.name}` : ''} size="lg">
        {viewRun && (() => {
          const stats = runStats[viewRun.id] || { pass: 0, fail: 0, blocked: 0, untested: 0, total: 0, passRate: 0 };
          return (
            <div className="space-y-4">
              {/* Run meta */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Project', value: viewRun.projectName },
                  { label: 'Status', value: viewRun.status },
                  { label: 'Created', value: new Date(viewRun.createdAt).toLocaleDateString() },
                ].map(({ label, value }) => (
                  <div key={label} className="p-3 rounded-lg border" style={{ background: 'var(--color-surface-alt)', borderColor: 'var(--color-border)' }}>
                    <p className="text-[9px] uppercase font-bold text-neutral-400 mb-1">{label}</p>
                    <p className="text-xs font-semibold" style={{ color: 'var(--color-text-primary)' }}>{value}</p>
                  </div>
                ))}
              </div>

              {/* Stats grid */}
              <div className="grid grid-cols-5 gap-2 text-center">
                {[
                  { label: 'Total', value: stats.total, color: 'var(--color-text-primary)' },
                  { label: 'Pass', value: stats.pass, color: 'var(--color-pass)' },
                  { label: 'Fail', value: stats.fail, color: 'var(--color-fail)' },
                  { label: 'Blocked', value: stats.blocked, color: 'var(--color-blocked)' },
                  { label: 'Pass Rate', value: `${stats.passRate}%`, color: stats.passRate >= 80 ? 'var(--color-pass)' : 'var(--color-text-primary)' },
                ].map(({ label, value, color }) => (
                  <div key={label} className="p-3 rounded-xl border" style={{ background: 'var(--color-surface-alt)', borderColor: 'var(--color-border)' }}>
                    <p className="text-[9px] uppercase font-semibold text-neutral-400">{label}</p>
                    <p className="text-lg font-bold mt-0.5" style={{ color }}>{value}</p>
                  </div>
                ))}
              </div>

              {/* Progress bar */}
              <MiniProgressBar stats={stats} />

              {/* Test case results table */}
              <div>
                <p className="text-xs font-bold mb-2" style={{ color: 'var(--color-text-primary)' }}>
                  Execution Log
                </p>
                <div className="max-h-64 overflow-y-auto border rounded-lg" style={{ borderColor: 'var(--color-border)' }}>
                  <table className="w-full text-xs">
                    <thead>
                      <tr style={{ background: 'var(--color-surface-alt)', borderBottom: '1px solid var(--color-border)' }}>
                        {['Test Case', 'Status', 'Executed By', 'Notes', 'Bug Link'].map(h => (
                          <th key={h} className="py-2 px-3 text-left text-[9px] uppercase font-bold text-neutral-400">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {(viewRun.testCaseIds || []).map(tcId => {
                        const tc = testCases.find(t => t.id === tcId);
                        const res = viewResults.find(r => r.testCaseId === tcId);
                        return (
                          <tr key={tcId} style={{ borderBottom: '1px solid var(--color-border)' }}>
                            <td className="py-2 px-3">
                              <p className="font-mono text-[9px] text-neutral-400">{tc?.testId}</p>
                              <p className="font-semibold truncate max-w-[160px]" style={{ color: 'var(--color-text-primary)' }}>{tc?.title || 'Unknown'}</p>
                            </td>
                            <td className="py-2 px-3"><StatusBadge status={res?.status || 'Untested'} /></td>
                            <td className="py-2 px-3 text-neutral-400">{res?.executedBy || '—'}</td>
                            <td className="py-2 px-3 max-w-[160px]">
                              <p className="truncate text-neutral-400">{res?.notes || '—'}</p>
                            </td>
                            <td className="py-2 px-3">
                              {res?.bugLink
                                ? <a href={res.bugLink.startsWith('http') ? res.bugLink : '#'}
                                    target="_blank" rel="noopener noreferrer"
                                    className="flex items-center gap-1 text-indigo-500 hover:underline">
                                    <ExternalLink size={10} />{res.bugLink.substring(0, 20)}{res.bugLink.length > 20 ? '…' : ''}
                                  </a>
                                : <span className="text-neutral-400">—</span>
                              }
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button onClick={() => { setViewRun(null); startExecution(viewRun); }}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white rounded-lg"
                  style={{ background: 'var(--color-primary)' }}>
                  <Play size={12} /> Execute Run
                </button>
                <button onClick={() => setViewRun(null)}
                  className="px-4 py-2 text-xs font-semibold"
                  style={{ color: 'var(--color-text-secondary)' }}>Close</button>
              </div>
            </div>
          );
        })()}
      </Modal>

      <ConfirmDialog isOpen={confirmOpen} onClose={() => setConfirmOpen(false)} onConfirm={handleDelete}
        title="Delete Test Run" message="This will permanently delete this run cycle and all its execution logs." />
    </div>
  );
}
