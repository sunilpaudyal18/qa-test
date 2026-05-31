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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Projects</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Manage your testing projects</p>
        </div>
        <button
          onClick={() => { setEditing(null); setForm({ name: '', description: '' }); setModalOpen(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
        >
          <Plus size={16} />
          New Project
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5 animate-pulse">
              <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-3" />
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-4" />
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
            </div>
          ))}
        </div>
      ) : projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <FolderKanban size={48} className="text-gray-300 dark:text-gray-600 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">No projects yet</h3>
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">Create your first project to get started</p>
          <button
            onClick={() => { setEditing(null); setForm({ name: '', description: '' }); setModalOpen(true); }}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
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
              className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">{project.name}</h3>
                <div className="flex gap-1">
                  <button onClick={() => handleEdit(project)} className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-indigo-500">
                    <Edit2 size={14} />
                  </button>
                  <button onClick={() => handleDuplicate(project.id)} className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-blue-500">
                    <Copy size={14} />
                  </button>
                  <button onClick={() => { setDeleteTarget(project.id); setConfirmOpen(true); }} className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-red-500">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 line-clamp-2">{project.description || 'No description'}</p>
              <div className="flex items-center justify-between text-xs text-gray-400 dark:text-gray-500">
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
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name *</label>
            <input
              type="text"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-gray-200"
              placeholder="Project name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
            <textarea
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-gray-200 resize-none"
              placeholder="Project description"
            />
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <button onClick={() => setModalOpen(false)} className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800">Cancel</button>
            <button onClick={handleSave} className="px-4 py-2 rounded-lg text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700">{editing ? 'Update' : 'Create'}</button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleDelete}
        title="Delete Project"
        message="This will permanently delete this project and all its test cases and suites. This action cannot be undone."
      />
    </div>
  );
}
