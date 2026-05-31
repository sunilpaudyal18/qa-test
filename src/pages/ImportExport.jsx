import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Upload, FileSpreadsheet, Download, AlertCircle, CheckCircle2 } from 'lucide-react';
import { projectService } from '../services/projectService';
import { testCaseService } from '../services/testCaseService';
import { exportToExcel, importFromExcel } from '../utils/excel';
import { useToast } from '../contexts/ToastContext';

export default function ImportExport() {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [selectedTCs, setSelectedTCs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const importRef = useRef();
  const toast = useToast();

  const loadProjectData = async (projectName) => {
    setSelectedProject(projectName);
    if (projectName) {
      const tc = await testCaseService.getAll(projectName);
      setSelectedTCs(tc);
    } else {
      const all = await testCaseService.getAll();
      setSelectedTCs(all);
    }
  };

  useEffect(() => {
    projectService.getAll().then(setProjects);
  }, []);

  const handleExportAll = async () => {
    const all = await testCaseService.getAll();
    if (all.length === 0) { toast.warning('No test cases to export'); return; }
    await exportToExcel(null, all);
    toast.success('All test cases exported');
  };

  const handleExportProject = async () => {
    if (!selectedProject) { toast.warning('Please select a project'); return; }
    const project = await projectService.getByName(selectedProject);
    const tcs = await testCaseService.getAll(selectedProject);
    if (tcs.length === 0) { toast.warning('No test cases in this project'); return; }
    await exportToExcel(project, tcs);
    toast.success('Project test cases exported');
  };

  const handleExportFiltered = async () => {
    if (selectedTCs.length === 0) { toast.warning('No test cases to export'); return; }
    const project = selectedProject ? await projectService.getByName(selectedProject) : null;
    await exportToExcel(project, selectedTCs);
    toast.success('Exported successfully');
  };

  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setLoading(true);
    setImportResult(null);
    try {
      const result = await importFromExcel(file);
      setImportResult(result);
      if (result.success) {
        toast.success(`Imported ${result.count} test cases`);
        projectService.getAll().then(setProjects);
      } else {
        toast.error('Import failed: ' + (result.error || 'Unknown error'));
      }
    } catch (err) {
      toast.error('Import error: ' + err.message);
      setImportResult({ success: false, error: err.message });
    }
    setLoading(false);
    e.target.value = '';
  };

  return (
    <div>
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>Import / Export</h1>
        <p className="text-sm mt-1 mb-6" style={{ color: 'var(--color-text-secondary)' }}>Export test cases to Excel or import from Excel files</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-xl p-6"
          style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg" style={{ background: 'var(--color-primary-subtle)' }}>
              <Download size={20} style={{ color: 'var(--color-primary)' }} />
            </div>
            <div>
              <h2 className="text-base font-semibold" style={{ color: 'var(--color-text-primary)' }}>Export to Excel</h2>
              <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Download test cases as a formatted spreadsheet</p>
            </div>
          </div>
          <div className="space-y-3">
            <button onClick={handleExportAll}
              className="w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium transition-colors"
              style={{ background: 'var(--color-surface-alt)', color: 'var(--color-text-primary)' }}>
              <span>Export All Test Cases</span>
              <Download size={14} style={{ color: 'var(--color-text-muted)' }} />
            </button>
            <div className="flex gap-2">
              <select value={selectedProject} onChange={e => loadProjectData(e.target.value)}
                className="flex-1 px-3 py-2 rounded-lg text-sm focus:outline-none"
                style={{ background: 'var(--color-surface-alt)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}>
                <option value="">All Projects</option>
                {projects.map(p => <option key={p.name} value={p.name}>{p.name}</option>)}
              </select>
              <button onClick={handleExportProject} disabled={!selectedProject}
                className="px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors disabled:opacity-40"
                style={{ background: 'var(--color-primary)' }}>
                Export
              </button>
            </div>
            {selectedTCs.length > 0 && selectedProject && (
              <button onClick={handleExportFiltered}
                className="w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium transition-colors"
                style={{ background: 'var(--color-surface-alt)', color: 'var(--color-text-primary)' }}>
                <span>Export Filtered ({selectedTCs.length} cases)</span>
                <Download size={14} style={{ color: 'var(--color-text-muted)' }} />
              </button>
            )}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="rounded-xl p-6"
          style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg" style={{ background: 'rgba(22,163,74,0.1)' }}>
              <Upload size={20} style={{ color: 'var(--color-pass)' }} />
            </div>
            <div>
              <h2 className="text-base font-semibold" style={{ color: 'var(--color-text-primary)' }}>Import from Excel</h2>
              <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Upload an Excel file to import test cases</p>
            </div>
          </div>
          <div
            className="rounded-xl border-2 border-dashed p-8 text-center cursor-pointer transition-colors"
            style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface-alt)' }}
            onClick={() => importRef.current?.click()}>
            <input ref={importRef} type="file" accept=".xlsx,.xls" onChange={handleImport} hidden />
            <FileSpreadsheet size={36} className="mx-auto mb-3" style={{ color: 'var(--color-text-muted)' }} />
            <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
              {loading ? 'Importing...' : 'Click to upload or drag and drop'}
            </p>
            <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>.xlsx or .xls files</p>
          </div>
          {importResult && (
            <div className={`mt-4 p-3 rounded-lg text-sm flex items-center gap-2 ${
              importResult.success ? 'text-pass' : 'text-fail'
            }`} style={{
              background: importResult.success ? 'rgba(22,163,74,0.1)' : 'rgba(220,38,38,0.1)',
              color: importResult.success ? 'var(--color-pass)' : 'var(--color-fail)',
            }}>
              {importResult.success ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
              {importResult.success
                ? `Successfully imported ${importResult.count} test cases`
                : `Import failed: ${importResult.error || 'Unknown error'}`}
            </div>
          )}
          {!importResult && (
            <div className="mt-4 p-3 rounded-lg text-xs" style={{ background: 'var(--color-surface-alt)', color: 'var(--color-text-muted)' }}>
              <p className="font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>Excel Format:</p>
              <p>Columns: Project Name, Test ID, Module, Title, Steps, Test Data, Expected Result, Actual Result, Status, Priority, Severity, Bug Link</p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
