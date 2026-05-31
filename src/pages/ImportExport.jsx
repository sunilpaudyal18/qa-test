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
      toast.success(`Imported ${result.success} test cases`);
    } catch (err) {
      toast.error('Import failed: ' + err.message);
    }
    setLoading(false);
    e.target.value = '';
  };

  return (
    <div>
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">Import / Export</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">Import and export test cases via Excel</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600">
              <Download size={20} />
            </div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Export Test Cases</h2>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Export test cases to Excel (.xlsx) format</p>

          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Filter by Project (optional)</label>
              <select
                value={selectedProject}
                onChange={e => loadProjectData(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-gray-200"
              >
                <option value="">All Projects</option>
                {projects.map(p => <option key={p.name} value={p.name}>{p.name}</option>)}
              </select>
            </div>
            <div className="flex flex-wrap gap-2">
              <button onClick={handleExportAll} className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                Export All
              </button>
              <button onClick={handleExportProject} disabled={!selectedProject} className="px-4 py-2 rounded-lg text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 transition-colors disabled:opacity-50">
                Export Project
              </button>
              <button onClick={handleExportFiltered} className="px-4 py-2 rounded-lg text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-700 transition-colors">
                Export Filtered ({selectedTCs.length})
              </button>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600">
              <Upload size={20} />
            </div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Import Test Cases</h2>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Import test cases from an Excel (.xlsx) file</p>

          <div
            onClick={() => importRef.current?.click()}
            className="border-2 border-dashed border-gray-200 dark:border-gray-600 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-400 dark:hover:border-indigo-500 transition-colors"
          >
            <input ref={importRef} type="file" accept=".xlsx,.xls" onChange={handleImport} className="hidden" />
            <FileSpreadsheet size={40} className="mx-auto text-gray-300 dark:text-gray-600 mb-3" />
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Click to upload Excel file</p>
            <p className="text-xs text-gray-500 mt-1">Supports .xlsx files with TC ID, Title, Status, and more</p>
          </div>

          {loading && (
            <div className="flex items-center gap-2 mt-4 text-sm text-indigo-600">
              <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              Importing...
            </div>
          )}

          {importResult && (
            <div className="mt-4 space-y-2">
              <div className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 size={16} />
                Successfully imported {importResult.success} test cases
              </div>
              {importResult.errors.length > 0 && (
                <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400 mb-2">
                    <AlertCircle size={16} />
                    {importResult.errors.length} errors
                  </div>
                  <ul className="text-xs text-red-500 space-y-1">
                    {importResult.errors.slice(0, 5).map((e, i) => (
                      <li key={i}>Row {e.row}: {e.message}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mt-6 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6"
      >
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">Excel Format Guide</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                {['TC ID', 'Title', 'Module', 'Priority', 'Severity', 'Steps', 'Test Data', 'Expected Result', 'Actual Result', 'Status', 'Bug Link'].map(col => (
                  <th key={col} className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr className="text-gray-600 dark:text-gray-400">
                <td className="px-3 py-2 font-mono text-xs">TC-0001</td>
                <td className="px-3 py-2">Login Test</td>
                <td className="px-3 py-2">Auth</td>
                <td className="px-3 py-2">High</td>
                <td className="px-3 py-2">Critical</td>
                <td className="px-3 py-2 text-xs">1: Enter credentials</td>
                <td className="px-3 py-2">user:admin, pass:123</td>
                <td className="px-3 py-2">Dashboard shown</td>
                <td className="px-3 py-2">Dashboard shown</td>
                <td className="px-3 py-2">Pass</td>
                <td className="px-3 py-2">PROJ-102</td>
              </tr>
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
