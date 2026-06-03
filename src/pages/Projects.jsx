import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit2, Trash2, Copy, Archive, ArchiveRestore, FolderKanban, CheckCircle, AlertCircle, AlertTriangle, ShieldAlert } from 'lucide-react';
import { projectService } from '../services/projectService';
import { useToast } from '../contexts/ToastContext';
import Modal from '../components/ui/Modal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import { formatDate } from '../utils/helpers';

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showArchived, setShowArchived] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', description: '' });
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [stats, setStats] = useState({});
  const toast = useToast();

  const loadProjects = useCallback(async () => {
    setLoading(true);
    try {
      const data = await projectService.getAll();
      setProjects(data);
      const s = {};
      for (const p of data) {
        s[p.id] = await projectService.getStats(p.id);
      }
      setStats(s);
    } catch (err) {
      toast.error('Failed to load projects data');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { loadProjects(); }, [loadProjects]);

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.warning('Project name is required');
      return;
    }
    if (editing) {
      await projectService.update(editing, { name: form.name, description: form.description });
      toast.success('Project updated');
    } else {
      await projectService.create(form.name, form.description);
      toast.success('Project created');
    }
    setModalOpen(false);
    setEditing(null);
    setForm({ name: '', description: '' });
    loadProjects();
  };

  const handleEdit = (p) => {
    setEditing(p.id);
    setForm({ name: p.name, description: p.description || '' });
    setModalOpen(true);
  };

  const handleDuplicate = async (id) => {
    await projectService.duplicate(id);
    toast.success('Project duplicated');
    loadProjects();
  };

  const handleToggleArchive = async (p) => {
    const isArchived = !p.archived;
    await projectService.archive(p.id, isArchived);
    toast.success(isArchived ? 'Project archived' : 'Project restored');
    loadProjects();
  };

  const handleDelete = async () => {
    if (deleteTarget) {
      await projectService.delete(deleteTarget);
      toast.success('Project deleted');
      setConfirmOpen(false);
      loadProjects();
    }
  };

  // Filter projects by archived status
  const visibleProjects = projects.filter(p => !!p.archived === showArchived);

  return (
    <div>
      {/* Upper header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
            {showArchived ? 'Archived Projects' : 'Projects'}
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
            {showArchived ? 'Archived sandboxes' : 'Manage your live workstation testing projects'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowArchived(!showArchived)}
            className="flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg border transition"
            style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)', background: 'var(--color-surface)' }}
          >
            {showArchived ? <ArchiveRestore size={14} /> : <Archive size={14} />}
            {showArchived ? 'Show Active' : 'Show Archived'}
          </button>
          <button
            onClick={() => { setEditing(null); setForm({ name: '', description: '' }); setModalOpen(true); }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors"
            style={{ background: 'var(--color-primary)' }}
          >
            <Plus size={16} />
            New Project
          </button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="rounded-xl p-5 animate-pulse"
              style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
              <div className="h-5 rounded w-3/4 mb-3" style={{ background: 'var(--color-border)' }} />
              <div className="h-4 rounded w-1/2 mb-4" style={{ background: 'var(--color-border)' }} />
              <div className="h-4 rounded w-1/3" style={{ background: 'var(--color-border)' }} />
            </div>
          ))}
        </div>
      ) : visibleProjects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <FolderKanban size={48} style={{ color: 'var(--color-border)' }} className="mb-4" />
          <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>No projects found</h3>
          <p className="text-sm mb-4" style={{ color: 'var(--color-text-muted)' }}>
            {showArchived ? 'No archived projects.' : 'Create your first project to get started.'}
          </p>
          {!showArchived && (
            <button
              onClick={() => { setEditing(null); setForm({ name: '', description: '' }); setModalOpen(true); }}
              className="px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors"
              style={{ background: 'var(--color-primary)' }}
            >
              Create Project
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {visibleProjects.map((project, idx) => {
            const pStats = stats[project.id] || { 
              total: 0, pass: 0, fail: 0, blocked: 0, untested: 0, 
              passRate: 0, healthScore: 100, warnings: [],
              priorityBreakdown: { Critical: 0, High: 0, Medium: 0, Low: 0 },
              severityBreakdown: { Critical: 0, Major: 0, Minor: 0, Low: 0 },
              modules: []
            };

            const healthColor = pStats.healthScore > 85 ? 'text-green-500' : pStats.healthScore > 60 ? 'text-yellow-500' : 'text-red-500';

            return (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="rounded-xl p-5 border flex flex-col justify-between hover:-translate-y-0.5 transition-all duration-200"
                style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
              >
                <div>
                  {/* Card Header Toolbar */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <h3 className="font-bold text-sm tracking-wide" style={{ color: 'var(--color-text-primary)' }}>{project.name}</h3>
                      <p className="text-[11px] mt-0.5" style={{ color: 'var(--color-text-muted)' }}>Created {formatDate(project.createdAt)}</p>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => handleEdit(project)} className="p-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800" style={{ color: 'var(--color-text-muted)' }}>
                        <Edit2 size={13} />
                      </button>
                      <button onClick={() => handleDuplicate(project.id)} className="p-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800" style={{ color: 'var(--color-text-muted)' }}>
                        <Copy size={13} />
                      </button>
                      <button onClick={() => handleToggleArchive(project)} className="p-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800" style={{ color: 'var(--color-text-muted)' }} title={project.archived ? 'Restore Project' : 'Archive Project'}>
                        {project.archived ? <ArchiveRestore size={13} /> : <Archive size={13} />}
                      </button>
                      <button onClick={() => { setDeleteTarget(project.name); setConfirmOpen(true); }} className="p-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800" style={{ color: 'var(--color-text-muted)' }}>
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  <p className="text-xs mb-4 line-clamp-2" style={{ color: 'var(--color-text-secondary)' }}>{project.description || 'No description'}</p>

                  {/* Health Score Gauge / Alert Area */}
                  <div className="p-3 mb-4 rounded-xl border flex items-center justify-between gap-3" style={{ background: 'var(--color-surface-alt)', borderColor: 'var(--color-border)' }}>
                    <div className="flex items-center gap-2">
                      <div className={`p-1.5 rounded-full bg-white dark:bg-neutral-800 ${healthColor}`}>
                        {pStats.healthScore > 85 ? <CheckCircle size={15} /> : <AlertTriangle size={15} />}
                      </div>
                      <div>
                        <p className="text-[10px] font-semibold text-neutral-400">Health Score</p>
                        <p className={`text-sm font-bold ${healthColor}`}>{pStats.healthScore}% Healthy</p>
                      </div>
                    </div>
                    {pStats.warnings?.length > 0 && (
                      <div className="relative group">
                        <AlertCircle size={15} className="text-red-500 cursor-help" />
                        <div className="absolute right-0 bottom-full mb-2 w-48 hidden group-hover:block z-20 p-2 text-[9px] rounded-lg shadow-xl text-white bg-neutral-900 leading-normal border border-neutral-700">
                          <p className="font-bold border-b border-neutral-700 pb-1 mb-1">Warnings:</p>
                          <ul className="list-disc pl-3.5 space-y-0.5">
                            {pStats.warnings.map((w, i) => <li key={i}>{w}</li>)}
                          </ul>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Statistics grids */}
                  <div className="grid grid-cols-3 gap-2 text-center mb-4">
                    <div className="p-2 rounded-lg" style={{ background: 'var(--color-surface-alt)' }}>
                      <p className="text-sm font-bold" style={{ color: 'var(--color-text-primary)' }}>{pStats.total}</p>
                      <p className="text-[9px] text-neutral-400 uppercase font-semibold">Total Cases</p>
                    </div>
                    <div className="p-2 rounded-lg" style={{ background: 'var(--color-surface-alt)' }}>
                      <p className="text-sm font-bold" style={{ color: 'var(--color-pass)' }}>{pStats.passRate}%</p>
                      <p className="text-[9px] text-neutral-400 uppercase font-semibold">Pass Rate</p>
                    </div>
                    <div className="p-2 rounded-lg" style={{ background: 'var(--color-surface-alt)' }}>
                      <p className="text-sm font-bold" style={{ color: 'var(--color-text-primary)' }}>{pStats.modules.length}</p>
                      <p className="text-[9px] text-neutral-400 uppercase font-semibold">Modules</p>
                    </div>
                  </div>

                  {/* Priority Breakdown pills */}
                  <div className="space-y-1.5">
                    <p className="text-[9px] font-bold uppercase text-neutral-400">Priority Levels</p>
                    <div className="flex flex-wrap gap-1.5">
                      <span className="text-[9px] px-1.5 py-0.5 rounded font-mono font-medium" style={{ background: 'rgba(220,38,38,0.1)', color: 'var(--color-critical)' }}>
                        Crit: {pStats.priorityBreakdown.Critical}
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded font-mono font-medium" style={{ background: 'rgba(234,88,12,0.1)', color: 'var(--color-major)' }}>
                        High: {pStats.priorityBreakdown.High}
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded font-mono font-medium" style={{ background: 'rgba(37,99,235,0.1)', color: 'var(--color-minor)' }}>
                        Med: {pStats.priorityBreakdown.Medium}
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded font-mono font-medium" style={{ background: 'var(--color-surface-alt)', color: 'var(--color-text-muted)' }}>
                        Low: {pStats.priorityBreakdown.Low}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Edit / Create Form Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Project' : 'New Project'} size="sm">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--color-text-secondary)' }}>Project Name *</label>
            <input
              type="text"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-lg focus:outline-none focus:ring-2"
              style={{ background: 'var(--color-surface-alt)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}
              placeholder="e.g. Android App"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--color-text-secondary)' }}>Description</label>
            <textarea
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 text-xs rounded-lg focus:outline-none focus:ring-2 resize-none"
              style={{ background: 'var(--color-surface-alt)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}
              placeholder="Write brief description..."
            />
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <button onClick={() => setModalOpen(false)} className="px-4 py-2 text-xs font-semibold animate-colors" style={{ color: 'var(--color-text-secondary)' }}>
              Cancel
            </button>
            <button onClick={handleSave} className="px-4 py-2 text-xs font-semibold text-white rounded-lg transition-colors" style={{ background: 'var(--color-primary)' }}>
              {editing ? 'Update' : 'Create'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleDelete}
        title="Delete Project"
        message="This will permanently delete this project and all associated test cases. This action cannot be undone."
      />
    </div>
  );
}
