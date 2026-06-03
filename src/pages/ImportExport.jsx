import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Upload, FileSpreadsheet, Download, AlertCircle, CheckCircle2, FileText, Check, AlertTriangle } from 'lucide-react';
import { projectService } from '../services/projectService';
import { testCaseService } from '../services/testCaseService';
import { exportToExcel, importFromExcel } from '../utils/excel';
import { useToast } from '../contexts/ToastContext';
import Modal from '../components/ui/Modal';

export default function ImportExport() {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [selectedTCs, setSelectedTCs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [importResult, setImportResult] = useState(null);
  
  // Preview states
  const [previewData, setPreviewData] = useState([]);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);
  const [importFormat, setImportFormat] = useState('excel'); // excel or csv

  const importRef = useRef();
  const importCsvRef = useRef();
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
    toast.success('All test cases exported to Excel');
  };

  const handleExportProject = async () => {
    if (!selectedProject) { toast.warning('Please select a project'); return; }
    const project = await projectService.getByName(selectedProject);
    const tcs = await testCaseService.getAll(selectedProject);
    if (tcs.length === 0) { toast.warning('No test cases in this project'); return; }
    await exportToExcel(project, tcs);
    toast.success('Project test cases exported to Excel');
  };

  const handleExportFiltered = async () => {
    if (selectedTCs.length === 0) { toast.warning('No test cases to export'); return; }
    const project = selectedProject ? await projectService.getByName(selectedProject) : null;
    await exportToExcel(project, selectedTCs);
    toast.success('Exported to Excel successfully');
  };

  // CSV Exporter
  const handleExportCsv = async () => {
    const all = selectedProject ? await testCaseService.getAll(selectedProject) : await testCaseService.getAll();
    if (all.length === 0) { toast.warning('No test cases to export'); return; }

    const headers = ["Project Name", "Test ID", "Module", "Title", "Steps", "Test Data", "Expected Result", "Actual Result", "Status", "Priority", "Severity", "Bug Link"];
    const rows = all.map(tc => [
      tc.projectName || '',
      tc.testId || '',
      tc.module || '',
      tc.title || '',
      (tc.steps || []).join('\n'),
      (tc.testData || []).join('\n'),
      tc.expectedResult || '',
      tc.actualResult || '',
      tc.status || 'Untested',
      tc.priority || 'Medium',
      tc.severity || 'Minor',
      tc.bugLink || ''
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `test_cases_${selectedProject || 'all'}_${Date.now()}.csv`;
    a.click();
    toast.success('Test cases exported to CSV');
  };

  // Download Templates
  const handleDownloadCsvTemplate = () => {
    const csvContent = "Project Name,Test ID,Module,Title,Steps,Test Data,Expected Result,Actual Result,Status,Priority,Severity,Bug Link\nDemo Project,TC_001,Auth,Verify credentials login,\"1. Input username\n2. Input password\n3. Click Login\",valid-username,\"Login succeeds, redirected to Dashboard\",,Untested,Medium,Minor,";
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'qa_studio_template.csv';
    a.click();
  };

  const handleDownloadExcelTemplate = async () => {
    const dummyData = [
      {
        projectName: 'Demo Project',
        testId: 'TC_001',
        module: 'Auth',
        title: 'Verify login flow',
        steps: '1. Input email\n2. Input password\n3. Click submit',
        testData: 'admin@example.com',
        expectedResult: 'Access granted, dashboard displayed',
        actualResult: '',
        status: 'Untested',
        priority: 'High',
        severity: 'Major',
        bugLink: ''
      }
    ];
    await exportToExcel({ name: 'Template Project' }, dummyData);
  };

  // CSV Parser RFC 4180
  const parseCsv = (text) => {
    const lines = [];
    let row = [""];
    let inQuotes = false;
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      const next = text[i+1];
      if (c === '"') {
        if (inQuotes && next === '"') {
          row[row.length - 1] += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (c === ',' && !inQuotes) {
        row.push('');
      } else if ((c === '\r' || c === '\n') && !inQuotes) {
        if (c === '\r' && next === '\n') i++;
        lines.push(row);
        row = [''];
      } else {
        row[row.length - 1] += c;
      }
    }
    if (row.length > 1 || row[0] !== '') {
      lines.push(row);
    }
    return lines;
  };

  // Pre-import file parser & validator
  const handleFileImportTrigger = async (e, format) => {
    const file = e.target.files[0];
    if (!file) return;

    setLoading(true);
    setImportFormat(format);
    setPreviewFile(file);

    try {
      if (format === 'excel') {
        // Excel loading directly
        const result = await importFromExcel(file, true); // true indicates dry-run / preview
        if (result.success && result.data) {
          setPreviewData(result.data.map(tc => ({
            ...tc,
            isValid: !!tc.projectName && !!tc.title,
            errors: !tc.projectName ? 'Missing Project Name' : !tc.title ? 'Missing Title' : ''
          })));
          setPreviewOpen(true);
        } else {
          toast.error('Failed to parse Excel: ' + result.error);
        }
      } else {
        // CSV Parsing locally
        const reader = new FileReader();
        reader.onload = async (event) => {
          try {
            const csvRows = parseCsv(event.target.result);
            if (csvRows.length < 2) {
              toast.error('CSV file has no data rows');
              return;
            }

            // Headers row mapping
            const headers = csvRows[0].map(h => h.trim().toLowerCase());
            const projectIdx = headers.indexOf('project name');
            const testIdIdx = headers.indexOf('test id');
            const moduleIdx = headers.indexOf('module');
            const titleIdx = headers.indexOf('title');
            const stepsIdx = headers.indexOf('steps');
            const dataIdx = headers.indexOf('test data');
            const expectedIdx = headers.indexOf('expected result');
            const actualIdx = headers.indexOf('actual result');
            const statusIdx = headers.indexOf('status');
            const priorityIdx = headers.indexOf('priority');
            const severityIdx = headers.indexOf('severity');
            const bugIdx = headers.indexOf('bug link');

            if (projectIdx === -1 || titleIdx === -1) {
              toast.error('CSV header must contain "Project Name" and "Title" columns');
              return;
            }

            const data = csvRows.slice(1).filter(r => r.length > 1).map((r, idx) => {
              const tc = {
                projectName: r[projectIdx]?.trim(),
                testId: testIdIdx !== -1 ? r[testIdIdx]?.trim() : '',
                module: moduleIdx !== -1 ? r[moduleIdx]?.trim() : 'General',
                title: r[titleIdx]?.trim(),
                steps: stepsIdx !== -1 ? r[stepsIdx]?.split('\n').filter(Boolean) : [''],
                testData: dataIdx !== -1 ? r[dataIdx]?.split('\n').filter(Boolean) : [''],
                expectedResult: expectedIdx !== -1 ? r[expectedIdx]?.trim() : '',
                actualResult: actualIdx !== -1 ? r[actualIdx]?.trim() : '',
                status: statusIdx !== -1 ? r[statusIdx]?.trim() : 'Untested',
                priority: priorityIdx !== -1 ? r[priorityIdx]?.trim() : 'Medium',
                severity: severityIdx !== -1 ? r[severityIdx]?.trim() : 'Minor',
                bugLink: bugIdx !== -1 ? r[bugIdx]?.trim() : '',
              };
              return {
                ...tc,
                isValid: !!tc.projectName && !!tc.title,
                errors: !tc.projectName ? 'Missing Project Name' : !tc.title ? 'Missing Title' : ''
              };
            });

            setPreviewData(data);
            setPreviewOpen(true);
          } catch (err) {
            toast.error('CSV parse error: ' + err.message);
          }
        };
        reader.readAsText(file);
      }
    } catch (err) {
      toast.error('Import error: ' + err.message);
    } finally {
      setLoading(false);
      e.target.value = '';
    }
  };

  // Perform actual DB write after validation approval
  const handleConfirmImport = async () => {
    setLoading(true);
    setPreviewOpen(false);
    let count = 0;
    
    try {
      await db.transaction('rw', db.projects, db.testCases, async () => {
        for (const tc of previewData) {
          if (!tc.isValid) continue;

          // Ensure project exists
          await projectService.create(tc.projectName);
          
          // Add test case
          await testCaseService.create({
            projectName: tc.projectName,
            testId: tc.testId || `TC_${Date.now().toString().slice(-4)}_${count}`,
            module: tc.module || 'General',
            title: tc.title,
            steps: Array.isArray(tc.steps) ? tc.steps : String(tc.steps || '').split('\n').filter(Boolean),
            testData: Array.isArray(tc.testData) ? tc.testData : String(tc.testData || '').split('\n').filter(Boolean),
            expectedResult: tc.expectedResult || '',
            actualResult: tc.actualResult || '',
            status: tc.status || 'Untested',
            priority: tc.priority || 'Medium',
            severity: tc.severity || 'Minor',
            bugLink: tc.bugLink || ''
          });
          count++;
        }
      });

      setImportResult({ success: true, count });
      toast.success(`Successfully imported ${count} test cases!`);
      projectService.getAll().then(setProjects);
    } catch (err) {
      setImportResult({ success: false, error: err.message });
      toast.error('Failed to commit import: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>Import / Export</h1>
        <p className="text-sm mt-1 mb-6" style={{ color: 'var(--color-text-secondary)' }}>Export test cases or import them with full validation previews</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Export Card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-xl p-6 border"
          style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 text-indigo-500">
              <Download size={20} />
            </div>
            <div>
              <h2 className="text-base font-semibold" style={{ color: 'var(--color-text-primary)' }}>Export Packages</h2>
              <p className="text-xs text-neutral-400">Download test cases in CSV or Excel sheets formats</p>
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <button onClick={handleExportAll}
                className="flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg border hover:bg-neutral-50 dark:hover:bg-neutral-850"
                style={{ background: 'var(--color-surface-alt)', color: 'var(--color-text-primary)', borderColor: 'var(--color-border)' }}>
                <FileSpreadsheet size={13} className="text-green-500" /> Export Excel
              </button>
              <button onClick={handleExportCsv}
                className="flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg border hover:bg-neutral-50 dark:hover:bg-neutral-850"
                style={{ background: 'var(--color-surface-alt)', color: 'var(--color-text-primary)', borderColor: 'var(--color-border)' }}>
                <FileText size={13} className="text-indigo-500" /> Export CSV
              </button>
            </div>

            <div className="p-3 border rounded-xl space-y-2.5" style={{ borderColor: 'var(--color-border)' }}>
              <p className="text-[10px] font-bold uppercase text-neutral-400">Export filtered project cases</p>
              <div className="flex gap-2">
                <select value={selectedProject} onChange={e => loadProjectData(e.target.value)}
                  className="flex-1 px-3 py-1.5 rounded-lg text-xs focus:outline-none"
                  style={{ background: 'var(--color-surface-alt)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}>
                  <option value="">All Projects</option>
                  {projects.map(p => <option key={p.name} value={p.name}>{p.name}</option>)}
                </select>
                <button onClick={handleExportProject} disabled={!selectedProject}
                  className="px-4 py-1.5 rounded-lg text-xs font-semibold text-white transition-colors disabled:opacity-40"
                  style={{ background: 'var(--color-primary)' }}>
                  Export Excel
                </button>
              </div>
            </div>
            
            <div className="p-3 border rounded-xl flex items-center justify-between" style={{ borderColor: 'var(--color-border)' }}>
              <div className="text-[10px] font-bold uppercase text-neutral-400">Download Template Files</div>
              <div className="flex gap-1.5">
                <button onClick={handleDownloadExcelTemplate} className="text-[10px] font-bold text-green-600 px-2 py-1 rounded bg-green-50 dark:bg-green-950/20">Excel</button>
                <button onClick={handleDownloadCsvTemplate} className="text-[10px] font-bold text-indigo-600 px-2 py-1 rounded bg-indigo-50 dark:bg-indigo-950/20">CSV</button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Import Card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="rounded-xl p-6 border"
          style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-green-50 dark:bg-green-950/20 text-green-600">
              <Upload size={20} />
            </div>
            <div>
              <h2 className="text-base font-semibold" style={{ color: 'var(--color-text-primary)' }}>Bulk Uploader</h2>
              <p className="text-xs text-neutral-400">Upload Excel or CSV formatted suites</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div
              className="rounded-xl border-2 border-dashed p-5 text-center cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-900"
              style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface-alt)' }}
              onClick={() => importRef.current?.click()}>
              <input ref={importRef} type="file" accept=".xlsx,.xls" onChange={e => handleFileImportTrigger(e, 'excel')} hidden />
              <FileSpreadsheet size={28} className="mx-auto mb-2 text-green-500" />
              <p className="text-xs font-semibold" style={{ color: 'var(--color-text-primary)' }}>Upload Excel</p>
              <p className="text-[9px] text-neutral-400 mt-1">.xlsx or .xls files</p>
            </div>
            <div
              className="rounded-xl border-2 border-dashed p-5 text-center cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-900"
              style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface-alt)' }}
              onClick={() => importCsvRef.current?.click()}>
              <input ref={importCsvRef} type="file" accept=".csv" onChange={e => handleFileImportTrigger(e, 'csv')} hidden />
              <FileText size={28} className="mx-auto mb-2 text-indigo-500" />
              <p className="text-xs font-semibold" style={{ color: 'var(--color-text-primary)' }}>Upload CSV</p>
              <p className="text-[9px] text-neutral-400 mt-1">Standard .csv sheets</p>
            </div>
          </div>

          {importResult && (
            <div className={`mt-4 p-3 rounded-lg text-xs flex items-center gap-2 ${
              importResult.success ? 'text-pass font-semibold' : 'text-fail'
            }`} style={{
              background: importResult.success ? 'rgba(22,163,74,0.1)' : 'rgba(220,38,38,0.1)',
              color: importResult.success ? 'var(--color-pass)' : 'var(--color-fail)',
            }}>
              {importResult.success ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
              {importResult.success
                ? `Successfully imported ${importResult.count} test cases!`
                : `Import failed: ${importResult.error || 'Unknown error'}`}
            </div>
          )}
        </motion.div>
      </div>

      {/* Pre-import Preview Modal */}
      <Modal isOpen={previewOpen} onClose={() => setPreviewOpen(false)} title={`Validate Import: ${previewFile?.name}`} size="lg">
        <div className="space-y-4">
          <div className="flex items-center gap-2 p-3 rounded-lg border text-xs" style={{ background: 'var(--color-surface-alt)', borderColor: 'var(--color-border)' }}>
            <AlertTriangle size={15} className="text-yellow-500 shrink-0" />
            <p style={{ color: 'var(--color-text-secondary)' }}>
              Check row validations below. Invalid rows containing errors will be skipped during save.
            </p>
          </div>

          {/* Grid list */}
          <div className="max-h-64 overflow-y-auto border rounded-lg">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="bg-neutral-50 dark:bg-neutral-900 border-b font-bold" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}>
                  <th className="p-2">Status</th>
                  <th className="p-2">Project</th>
                  <th className="p-2">Test Case Title</th>
                  <th className="p-2">Validation Status</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: 'var(--color-border)' }}>
                {previewData.map((tc, idx) => (
                  <tr key={idx} className="hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors">
                    <td className="p-2 shrink-0">
                      {tc.isValid ? (
                        <span className="p-1 rounded-full text-green-600 bg-green-50 dark:bg-green-950/20 inline-block"><Check size={10} /></span>
                      ) : (
                        <span className="p-1 rounded-full text-red-600 bg-red-50 dark:bg-red-950/20 inline-block"><X size={10} /></span>
                      )}
                    </td>
                    <td className="p-2 font-mono text-[10px] truncate max-w-[100px]">{tc.projectName || '--'}</td>
                    <td className="p-2 font-semibold max-w-[200px] truncate" style={{ color: 'var(--color-text-primary)' }}>{tc.title || 'Untitled'}</td>
                    <td className="p-2 font-semibold" style={{ color: tc.isValid ? 'var(--color-pass)' : 'var(--color-fail)' }}>
                      {tc.isValid ? 'Ready' : tc.errors}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex gap-2 justify-end pt-3 border-t" style={{ borderColor: 'var(--color-border)' }}>
            <button onClick={() => setPreviewOpen(false)} className="px-4 py-2 text-xs font-semibold" style={{ color: 'var(--color-text-secondary)' }}>Cancel</button>
            <button onClick={handleConfirmImport} className="px-5 py-2 text-xs font-semibold text-white rounded-lg" style={{ background: 'var(--color-primary)' }}>
              Confirm Import
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
