import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Trash2, GripVertical } from 'lucide-react';
import { testCaseService } from '../../services/testCaseService';
import { testSuiteService } from '../../services/testSuiteService';
import { useToast } from '../../contexts/ToastContext';

const PRIORITIES = ['Low', 'Medium', 'High', 'Critical'];
const SEVERITIES = ['Low', 'Medium', 'High', 'Critical'];
const STATUSES = ['Not Executed', 'Pass', 'Fail', 'Blocked'];
const ALL_TAGS = ['Smoke', 'Sanity', 'Regression', 'API', 'UI', 'Security', 'Mobile'];

export default function TestCaseForm({ initial, projects, onSave, onCancel }) {
  const [form, setForm] = useState({
    tcId: '',
    projectId: '',
    suiteId: '',
    title: '',
    module: '',
    priority: 'Medium',
    severity: 'Medium',
    preconditions: '',
    steps: [{ step: 1, action: '' }],
    expectedResult: '',
    actualResult: '',
    status: 'Not Executed',
    tags: [],
  });
  const [suites, setSuites] = useState([]);
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  useEffect(() => {
    if (initial) {
      setForm({
        tcId: initial.tcId || '',
        projectId: initial.projectId || '',
        suiteId: initial.suiteId || '',
        title: initial.title || '',
        module: initial.module || '',
        priority: initial.priority || 'Medium',
        severity: initial.severity || 'Medium',
        preconditions: initial.preconditions || '',
        steps: initial.steps?.length ? initial.steps : [{ step: 1, action: '' }],
        expectedResult: initial.expectedResult || '',
        actualResult: initial.actualResult || '',
        status: initial.status || 'Not Executed',
        tags: initial.tags || [],
      });
    } else {
      testCaseService.getNextTcId().then(tcId => setForm(f => ({ ...f, tcId })));
    }
  }, [initial]);

  useEffect(() => {
    if (form.projectId) {
      testSuiteService.getByProject(form.projectId).then(setSuites);
    } else {
      setSuites([]);
    }
  }, [form.projectId]);

  const addStep = () => {
    setForm(f => ({
      ...f,
      steps: [...f.steps, { step: f.steps.length + 1, action: '' }],
    }));
  };

  const removeStep = (idx) => {
    setForm(f => ({
      ...f,
      steps: f.steps.filter((_, i) => i !== idx).map((s, i) => ({ ...s, step: i + 1 })),
    }));
  };

  const updateStep = (idx, value) => {
    setForm(f => ({
      ...f,
      steps: f.steps.map((s, i) => i === idx ? { ...s, action: value } : s),
    }));
  };

  const toggleTag = (tag) => {
    setForm(f => ({
      ...f,
      tags: f.tags.includes(tag) ? f.tags.filter(t => t !== tag) : [...f.tags, tag],
    }));
  };

  const handleSave = async () => {
    if (!form.title.trim()) {
      toast.warning('Title is required');
      return;
    }
    setSaving(true);
    try {
      if (initial?.id) {
        await testCaseService.update(initial.id, form);
        toast.success('Test case updated');
      } else {
        await testCaseService.create(form);
        toast.success('Test case created');
      }
      onSave();
    } catch (err) {
      toast.error('Failed to save test case');
    }
    setSaving(false);
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">TC ID</label>
          <input
            type="text"
            value={form.tcId}
            onChange={e => setForm({ ...form, tcId: e.target.value })}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-gray-200 font-mono"
            placeholder="TC-0001"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Project</label>
          <select
            value={form.projectId}
            onChange={e => setForm({ ...form, projectId: e.target.value, suiteId: '' })}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-gray-200"
          >
            <option value="">Select project</option>
            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Suite</label>
          <select
            value={form.suiteId}
            onChange={e => setForm({ ...form, suiteId: e.target.value })}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-gray-200"
          >
            <option value="">No suite</option>
            {suites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title *</label>
          <input
            type="text"
            value={form.title}
            onChange={e => setForm({ ...form, title: e.target.value })}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-gray-200"
            placeholder="Test case title"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Module</label>
          <input
            type="text"
            value={form.module}
            onChange={e => setForm({ ...form, module: e.target.value })}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-gray-200"
            placeholder="e.g. Login, Checkout, API"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Priority</label>
          <select
            value={form.priority}
            onChange={e => setForm({ ...form, priority: e.target.value })}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-gray-200"
          >
            {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Severity</label>
          <select
            value={form.severity}
            onChange={e => setForm({ ...form, severity: e.target.value })}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-gray-200"
          >
            {SEVERITIES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Preconditions</label>
        <textarea
          value={form.preconditions}
          onChange={e => setForm({ ...form, preconditions: e.target.value })}
          rows={2}
          className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-gray-200 resize-none"
          placeholder="Any preconditions..."
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Test Steps</label>
          <button onClick={addStep} className="flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-700">
            <Plus size={14} /> Add Step
          </button>
        </div>
        <div className="space-y-2">
          {form.steps.map((step, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-2"
            >
              <span className="text-xs font-mono text-gray-400 w-6 shrink-0">{step.step}.</span>
              <div className="relative flex-1">
                <GripVertical size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-300" />
                <input
                  type="text"
                  value={step.action}
                  onChange={e => updateStep(idx, e.target.value)}
                  className="w-full pl-7 pr-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-gray-200"
                  placeholder={`Step ${step.step}`}
                />
              </div>
              {form.steps.length > 1 && (
                <button onClick={() => removeStep(idx)} className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-500">
                  <Trash2 size={14} />
                </button>
              )}
            </motion.div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Expected Result</label>
          <textarea
            value={form.expectedResult}
            onChange={e => setForm({ ...form, expectedResult: e.target.value })}
            rows={3}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-gray-200 resize-none"
            placeholder="Expected result..."
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Actual Result</label>
          <textarea
            value={form.actualResult}
            onChange={e => setForm({ ...form, actualResult: e.target.value })}
            rows={3}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-gray-200 resize-none"
            placeholder="Actual result..."
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
          <select
            value={form.status}
            onChange={e => setForm({ ...form, status: e.target.value })}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-gray-200"
          >
            {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tags</label>
          <div className="flex flex-wrap gap-2">
            {ALL_TAGS.map(tag => (
              <button
                key={tag}
                type="button"
                onClick={() => toggleTag(tag)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  form.tags.includes(tag)
                    ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300 ring-1 ring-indigo-300'
                    : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex gap-3 justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
        <button onClick={onCancel} className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2 rounded-lg text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 transition-colors disabled:opacity-50"
        >
          {saving ? 'Saving...' : initial ? 'Update' : 'Create'}
        </button>
      </div>
    </div>
  );
}
