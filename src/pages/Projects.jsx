import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit2, Trash2, Copy, FolderKanban } from 'lucide-react';
import { projectService } from '../services/projectService';
import { useToast } from '../contexts/ToastContext';
import Modal from '../components/ui/Modal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import { formatDate } from '../utils/helpers';

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', description: '' });
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [stats, setStats] = useState({});
  const toast = useToast();

  const loadProjects = useCallback(async () => {
    setLoading(true);
    const data = await projectService.getAll();
    setProjects(data);
    const s = {};
    for (const p of data) {
      s[p.id] = await projectService.getStats(p.id);
    }
    setStats(s);
    setLoading(false);
  }, []);

  useEffect(() => { loadProjects(); }, [loadProjects]);

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.warning('Project name is required');
      return;
    }
    if (editing) {
      await projectService.update(editing, { name: form.name });
      toast.success('Project updated');
    } else {
      await projectService.create(form.name);
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

  const handleDelete = async () => {
    if (deleteTarget) {
      await projectService.delete(deleteTarget);
      toast.success('Project deleted');
      loadProjects();
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>Projects</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>Manage your testing projects</p>
        </div>
        <button
          onClick={() => { setEditing(null); setForm({ name: '', description: '' }); setModalOpen(true); }}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors"
          style={{ background: 'var(--color-primary)' }}
        >
          <Plus size={16} />
          New Project
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="rounded-xl p-5 animate-pulse"
              style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
              <div className="h-5 rounded w-3/4 mb-3" style={{ background: 'var(--color-border)' }} />
              <div className="h-4 rounded w-1/2 mb-4" style={{ background: 'var(--color-border)' }} />
              <div className="h-4 rounded w-1/3" style={{ background: 'var(--color-border)' }} />
            </div>
          ))}
        </div>
      ) : projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <FolderKanban size={48} style={{ color: 'var(--color-border)' }} className="mb-4" />
          <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>No projects yet</h3>
          <p className="text-sm mb-4" style={{ color: 'var(--color-text-muted)' }}>Create your first project to get started</p>
          <button
            onClick={() => { setEditing(null); setForm({ name: '', description: '' }); setModalOpen(true); }}
            className="px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors"
            style={{ background: 'var(--color-primary)' }}
          >
            Create Project
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project, idx) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="rounded-xl p-5 transition-all duration-200 hover:-translate-y-0.5"
              style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
            >
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>{project.name}</h3>
                <div className="flex gap-1">
                  <button onClick={() => handleEdit(project)}
                    className="p-1.5 rounded transition-colors"
                    style={{ color: 'var(--color-text-muted)' }}>
                    <Edit2 size={14} />
                  </button>
                  <button onClick={() => handleDuplicate(project.id)}
                    className="p-1.5 rounded transition-colors"
                    style={{ color: 'var(--color-text-muted)' }}>
                    <Copy size={14} />
                  </button>
                  <button onClick={() => { setDeleteTarget(project.id); setConfirmOpen(true); }}
                    className="p-1.5 rounded transition-colors"
                    style={{ color: 'var(--color-text-muted)' }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              <p className="text-sm mb-4 line-clamp-2" style={{ color: 'var(--color-text-secondary)' }}>{project.description || 'No description'}</p>
              <div className="flex items-center justify-between text-xs" style={{ color: 'var(--color-text-muted)' }}>
                <span>{stats[project.id]?.total || 0} test cases</span>
                <span>{formatDate(project.createdAt)}</span>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Project' : 'New Project'} size="sm">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>Name *</label>
            <input
              type="text"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              className="w-full px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2"
              style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border-strong)', color: 'var(--color-text-primary)' }}
              placeholder="Project name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>Description</label>
            <textarea
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 resize-none"
              style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border-strong)', color: 'var(--color-text-primary)' }}
              placeholder="Project description"
            />
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <button onClick={() => setModalOpen(false)}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              style={{ color: 'var(--color-text-secondary)' }}>
              Cancel
            </button>
            <button onClick={handleSave}
              className="px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors"
              style={{ background: 'var(--color-primary)' }}>
              {editing ? 'Update' : 'Create'}
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleDelete}
        title="Delete Project"
        message="This will permanently delete this project and all its test cases. This action cannot be undone."
      />
    </div>
  );
}
