import * as XLSX from 'xlsx';
import db from '../db/db';

export async function exportToExcel(project, testCases) {
  const data = testCases.map(tc => ({
    'TC ID': tc.tcId || '',
    'Project': project?.name || '',
    'Suite': '',
    'Title': tc.title || '',
    'Module': tc.module || '',
    'Priority': tc.priority || '',
    'Severity': tc.severity || '',
    'Preconditions': tc.preconditions || '',
    'Steps': (tc.steps || []).map(s => `${s.step || ''}: ${s.action || ''}`).join('; '),
    'Expected Result': tc.expectedResult || '',
    'Actual Result': tc.actualResult || '',
    'Status': tc.status || 'Not Executed',
    'Tags': (tc.tags || []).join(', '),
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'TestCases');

  ws['!cols'] = [
    { wch: 12 }, { wch: 20 }, { wch: 20 }, { wch: 40 }, { wch: 15 },
    { wch: 10 }, { wch: 10 }, { wch: 30 }, { wch: 50 }, { wch: 30 },
    { wch: 30 }, { wch: 15 }, { wch: 20 },
  ];

  XLSX.writeFile(wb, 'TestCases.xlsx');
}

export async function importFromExcel(file) {
  const data = await file.arrayBuffer();
  const wb = XLSX.read(data, { type: 'array' });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(ws);

  const results = { success: 0, errors: [] };

  for (let i = 0; i < rows.length; i++) {
    try {
      const row = rows[i];
      const tc = {
        tcId: row['TC ID'] || `TC-${Date.now()}-${i}`,
        projectId: null,
        suiteId: null,
        title: row['Title'] || 'Untitled',
        module: row['Module'] || '',
        priority: row['Priority'] || 'Medium',
        severity: row['Severity'] || 'Medium',
        preconditions: row['Preconditions'] || '',
        steps: row['Steps'] ? row['Steps'].split(';').map((s, idx) => ({
          step: idx + 1,
          action: s.trim(),
        })) : [],
        expectedResult: row['Expected Result'] || '',
        actualResult: row['Actual Result'] || '',
        status: row['Status'] || 'Not Executed',
        tags: row['Tags'] ? row['Tags'].split(',').map(t => t.trim()) : [],
      };

      const validStatuses = ['Not Executed', 'Pass', 'Fail', 'Blocked'];
      if (!validStatuses.includes(tc.status)) tc.status = 'Not Executed';

      const validPriorities = ['Low', 'Medium', 'High', 'Critical'];
      if (!validPriorities.includes(tc.priority)) tc.priority = 'Medium';

      const validSeverities = ['Low', 'Medium', 'High', 'Critical'];
      if (!validSeverities.includes(tc.severity)) tc.severity = 'Medium';

      await db.testCases.add({
        ...tc,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      results.success++;
    } catch (err) {
      results.errors.push({ row: i + 2, message: err.message });
    }
  }

  return results;
}
