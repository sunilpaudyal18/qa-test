import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit2, Trash2, Beaker, ChevronDown, ChevronRight } from 'lucide-react';
import { testSuiteService } from '../services/testSuiteService';
import { projectService } from '../services/projectService';
import { testCaseService } from '../services/testCaseService';
import { useToast } from '../contexts/ToastContext';
import Modal from '../components/ui/Modal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import { formatDate } from '../utils/helpers';

export default function TestSuites() {
  const [suites, setSuites] = useState([]);
  const [projects, setProjects] = useState([]);
  const [testCases, setTestCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', description: '', projectId: '' });
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [expanded, setExpanded] = useState(null);
  const [assignOpen, setAssignOpen] = useState(false);
  const [assignSuite, setAssignSuite] = useState(null);
  const [selectedTCs, setSelectedTCs] = useState(new Set());
  const toast = useToast();

  const loadData = useCallback(async () => {
    setLoading(true);
    const [s, p, tc] = await Promise.all([
      testSuiteService.getAll(),
      projectService.getAll(),
      testCaseService.getAll(),
    ]);
    setSuites(s);
    setProjects(p);
    setTestCases(tc);
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const getCaseCount = (suiteId) => testCases.filter(tc => tc.suiteId === suiteId).length;

  const handleSave = async () => {
    if (!form.name.trim()) { toast.warning('Suite name is required'); return; }
    if (!form.projectId) { toast.warning('Please select a project'); return; }
    if (editing) {
      await testSuiteService.update(editing, form);
      toast.success('Suite updated');
    } else {
      await testSuiteService.create(form);
      toast.success('Suite created');
    }
    setModalOpen(false);
    setEditing(null);
    setForm({ name: '', description: '', projectId: '' });
    loadData();
  };

  const handleDelete = async () => {
    if (deleteTarget) {
      await testSuiteService.delete(deleteTarget);
      toast.success('Suite deleted');
      loadData();
    }
  };

  const openAssign = (suite) => {
    setAssignSuite(suite);
    const assigned = testCases.filter(tc => tc.suiteId === suite.id).map(tc => tc.id);
    setSelectedTCs(new Set(assigned));
    setAssignOpen(true);
  };

  const handleAssign = async () => {
    if (!assignSuite) return;
    for (const tc of testCases) {
      const shouldHave = selectedTCs.has(tc.id);
      const currentlyHas = tc.suiteId === assignSuite.id;
      if (shouldHave !== currentlyHas) {
        await testCaseService.update(tc.id, { suiteId: shouldHave ? assignSuite.id : null });
      }
    }
    toast.success('Test cases assigned');
    setAssignOpen(false);
    loadData();
  };

  if (loading) {
    return (
      <div>
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-48 mb-6 animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5 animate-pulse">
              <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-3" />
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Test Suites</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Organize test cases into suites</p>
        </div>
        <button
          onClick={() => { setEditing(null); setForm({ name: '', description: '', projectId: '' }); setModalOpen(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
        >
          <Plus size={16} />
          New Suite
        </button>
      </div>

      {suites.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Beaker size={48} className="text-gray-300 dark:text-gray-600 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">No test suites yet</h3>
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">Create test suites to organize your test cases</p>
          <button onClick={() => { setEditing(null); setForm({ name: '', description: '', projectId: '' }); setModalOpen(true); }} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium">
            Create Suite
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {suites.map((suite, idx) => {
            const project = projects.find(p => p.id === suite.projectId);
            return (
              <motion.div
                key={suite.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate">{suite.name}</h3>
                    <p className="text-xs text-gray-500 mt-0.5">{project?.name || 'No project'}</p>
                  </div>
                  <div className="flex gap-1 shrink-0 ml-2">
                    <button onClick={() => openAssign(suite)} className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-indigo-500" title="Assign test cases">
                      <Edit2 size={14} />
                    </button>
                    <button onClick={() => { setEditing(suite.id); setForm({ name: suite.name, description: suite.description || '', projectId: suite.projectId }); setModalOpen(true); }} className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-indigo-500">
                      <Edit2 size={14} />
                    </button>
                    <button onClick={() => { setDeleteTarget(suite.id); setConfirmOpen(true); }} className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-red-500">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-3 line-clamp-2">{suite.description || 'No description'}</p>
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span>{getCaseCount(suite.id)} test cases</span>
                  <span>{formatDate(suite.createdAt)}</span>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Suite' : 'New Suite'} size="sm">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name *</label>
            <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-gray-200" placeholder="Suite name" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Project *</label>
            <select value={form.projectId} onChange={e => setForm({ ...form, projectId: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-gray-200">
              <option value="">Select project</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
            <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3} className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-gray-200 resize-none" placeholder="Suite description" />
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <button onClick={() => setModalOpen(false)} className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800">Cancel</button>
            <button onClick={handleSave} className="px-4 py-2 rounded-lg text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700">{editing ? 'Update' : 'Create'}</button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={assignOpen} onClose={() => setAssignOpen(false)} title={`Assign Test Cases - ${assignSuite?.name || ''}`} size="lg">
        <div className="space-y-2 max-h-[400px] overflow-y-auto">
          {testCases.filter(tc => tc.projectId === assignSuite?.projectId).length === 0 ? (
            <p className="text-gray-500 text-sm">No test cases in this project</p>
          ) : (
            testCases.filter(tc => tc.projectId === assignSuite?.projectId).map(tc => (
              <label key={tc.id} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedTCs.has(tc.id)}
                  onChange={() => {
                    setSelectedTCs(prev => {
                      const next = new Set(prev);
                      if (next.has(tc.id)) next.delete(tc.id); else next.add(tc.id);
                      return next;
                    });
                  }}
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{tc.title || 'Untitled'}</p>
                  <p className="text-xs text-gray-500">{tc.tcId}</p>
                </div>
                <span className={`ml-auto px-2 py-0.5 rounded text-xs font-medium ${
                  tc.status === 'Pass' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                  tc.status === 'Fail' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                  tc.status === 'Blocked' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                  'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                }`}>{tc.status || 'Not Executed'}</span>
              </label>
            ))
          )}
        </div>
        <div className="flex gap-3 justify-end pt-4 mt-4 border-t border-gray-200 dark:border-gray-700">
          <button onClick={() => setAssignOpen(false)} className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800">Cancel</button>
          <button onClick={handleAssign} className="px-4 py-2 rounded-lg text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700">Save Assignments</button>
        </div>
      </Modal>

      <ConfirmDialog isOpen={confirmOpen} onClose={() => setConfirmOpen(false)} onConfirm={handleDelete} title="Delete Suite" message="This will remove the suite and unassign its test cases. Test cases will not be deleted." />
    </div>
  );
}
