import * as XLSX from 'xlsx-js-style';
import { saveAs } from 'file-saver';
import { format } from 'date-fns';

const formatSteps = (value) => {
  if (Array.isArray(value)) {
    return value
      .filter(item => item && item.trim() !== '')
      .map((item, i) => `Step ${i + 1}: ${item}`)
      .join('\n');
  }
  return value || '';
};

const formatTestData = (value) => {
  if (Array.isArray(value)) {
    return value
      .filter(item => item && item.trim() !== '')
      .map((item, i) => `Data ${i + 1}: ${item}`)
      .join('\n');
  }
  return value || '';
};

const THIN_BORDER = {
  top: { style: 'thin', color: { rgb: '000000' } },
  bottom: { style: 'thin', color: { rgb: '000000' } },
  left: { style: 'thin', color: { rgb: '000000' } },
  right: { style: 'thin', color: { rgb: '000000' } },
};

const TITLE_STYLE = {
  font: { bold: true, sz: 26, color: { rgb: 'FFFFFF' } },
  fill: { fgColor: { rgb: '4F46E5' } },
  alignment: { horizontal: 'center', vertical: 'center' },
};

const HEADER_STYLE = {
  font: { bold: true, sz: 16, color: { rgb: '1E1B4B' } },
  fill: { fgColor: { rgb: 'C7D2FE' } },
  alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
  border: THIN_BORDER,
};

const DATA_STYLE = {
  font: { sz: 14, color: { rgb: '1E293B' } },
  alignment: { wrapText: true, vertical: 'top' },
  border: THIN_BORDER,
};

const buildWorksheet = (testCases) => {
  const projectName =
    testCases.length > 0
      ? testCases[0].projectName || 'Project'
      : 'Project';

  const headers = [
    'Test ID', 'Module', 'Title', 'Steps', 'Test Data',
    'Expected Result', 'Actual Result', 'Status', 'Priority',
    'Severity', 'Bug Link', 'Date Executed', 'Has Screenshot',
  ];

  const rows = [...testCases].map((tc, index) => [
    tc.testId || `TC-${index + 1}`,
    tc.module || '',
    tc.title || '',
    formatSteps(tc.steps),
    formatTestData(tc.testData),
    tc.expectedResult || '',
    tc.actualResult || '',
    tc.status || 'Untested',
    tc.priority || 'Medium',
    tc.severity || 'Minor',
    tc.bugLink || '',
    tc.date ? format(new Date(tc.date), 'yyyy-MM-dd') : '',
    tc.screenshot ? 'Yes' : 'No',
  ]);

  const data = [
    [`Project: ${projectName}`],
    headers,
    ...rows,
  ];

  const ws = XLSX.utils.aoa_to_sheet(data);

  ws['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: headers.length - 1 } },
  ];

  const HEADER_ROW = 1;
  const DATA_START = 2;

  const titleCell = XLSX.utils.encode_cell({ r: 0, c: 0 });
  if (ws[titleCell]) ws[titleCell].s = TITLE_STYLE;

  headers.forEach((_, colIndex) => {
    const cell = XLSX.utils.encode_cell({ r: HEADER_ROW, c: colIndex });
    if (ws[cell]) ws[cell].s = HEADER_STYLE;
  });

  rows.forEach((row, rowIndex) => {
    row.forEach((cellValue, colIndex) => {
      const addr = XLSX.utils.encode_cell({
        r: rowIndex + DATA_START,
        c: colIndex,
      });
      if (!ws[addr]) return;
      if (colIndex === 7) {
        const value = (cellValue || '').toLowerCase();
        if (value === 'pass') {
          ws[addr].s = {
            ...DATA_STYLE,
            fill: { fgColor: { rgb: 'C6EFCE' } },
            font: { bold: true, color: { rgb: '006100' } },
            alignment: { horizontal: 'center', vertical: 'center' },
            border: THIN_BORDER,
          };
        } else if (value === 'fail') {
          ws[addr].s = {
            ...DATA_STYLE,
            fill: { fgColor: { rgb: 'FFC7CE' } },
            font: { bold: true, color: { rgb: '9C0006' } },
            alignment: { horizontal: 'center', vertical: 'center' },
            border: THIN_BORDER,
          };
        } else {
          ws[addr].s = DATA_STYLE;
        }
      } else {
        ws[addr].s = DATA_STYLE;
      }
    });
  });

  const totalRows = rows.length + 2;
  const totalCols = headers.length;

  for (let r = 1; r < totalRows; r++) {
    for (let c = 0; c < totalCols; c++) {
      const addr = XLSX.utils.encode_cell({ r, c });
      if (!ws[addr]) continue;
      let border = { ...THIN_BORDER };
      if (r === 1) border.top = { style: 'medium', color: { rgb: '000000' } };
      if (r === totalRows - 1) border.bottom = { style: 'medium', color: { rgb: '000000' } };
      if (c === 0) border.left = { style: 'medium', color: { rgb: '000000' } };
      if (c === totalCols - 1) border.right = { style: 'medium', color: { rgb: '000000' } };
      ws[addr].s = { ...ws[addr].s, border };
    }
  }

  ws['!cols'] = [
    { wch: 12 }, { wch: 16 }, { wch: 30 }, { wch: 50 },
    { wch: 30 }, { wch: 35 }, { wch: 35 }, { wch: 12 },
    { wch: 12 }, { wch: 12 }, { wch: 20 }, { wch: 16 }, { wch: 16 },
  ];

  ws['!rows'] = [
    { hpt: 45 },
    { hpt: 40 },
  ];

  ws['!freeze'] = { xSplit: 0, ySplit: DATA_START };

  return ws;
};

export const exportToExcel = (projectOrCases, cases) => {
  const testCases = cases || projectOrCases;
  if (!testCases || testCases.length === 0) return;
  const ws = buildWorksheet(testCases);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Test Cases');
  const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array', cellStyles: true });
  saveAs(new Blob([buffer]), `QA_Test_Cases_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.xlsx`);
};

export const importFromExcel = async (file, dryRun) => {
  const data = await file.arrayBuffer();
  const wb = XLSX.read(data, { type: 'array', cellStyles: true });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(ws, { defval: '' });
  const parsed = [];
  const errors = [];
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    try {
      if (!row['Title'] && !row['Test ID']) continue;
      const tc = {
        projectName: (row['Project Name'] || row['Project'] || '').toString(),
        testId: (row['Test ID'] || row['TC ID'] || '').toString(),
        module: (row['Module'] || '').toString(),
        title: (row['Title'] || '').toString(),
        steps: (row['Steps'] || '').toString().split('\n').filter(Boolean),
        testData: (row['Test Data'] || '').toString().split('\n').filter(Boolean),
        expectedResult: (row['Expected Result'] || '').toString(),
        actualResult: (row['Actual Result'] || '').toString(),
        status: (row['Status'] || 'Untested').toString(),
        priority: (row['Priority'] || 'Medium').toString(),
        severity: (row['Severity'] || 'Minor').toString(),
        bugLink: (row['Bug Link'] || '').toString(),
        date: row['Date Executed'] ? format(new Date(row['Date Executed']), 'yyyy-MM-dd') : '',
        screenshot: null,
      };
      parsed.push(tc);
    } catch (err) {
      errors.push({ row: i + 2, message: err.message });
    }
  }
  return { success: true, data: parsed, errors };
};

export const exportSingleToExcel = (testCase) => {
  if (!testCase) return;
  const ws = buildWorksheet([testCase]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Test Case');
  const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array', cellStyles: true });
  const safeName = `${testCase.module || 'TC'}_${testCase.title || 'export'}`
    .replace(/[^a-z0-9_]/gi, '_')
    .substring(0, 50);
  saveAs(new Blob([buffer]), `QA_${safeName}_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
};
