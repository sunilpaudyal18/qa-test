import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, PieChart, TrendingUp } from 'lucide-react';
import db from '../db/db';

const COLORS = {
  Pass: '#10b981',
  Fail: '#ef4444',
  Blocked: '#f59e0b',
  'Not Executed': '#9ca3af',
};

const PRIORITY_COLORS = {
  Critical: '#dc2626',
  High: '#f97316',
  Medium: '#3b82f6',
  Low: '#6b7280',
};

const SEVERITY_COLORS = {
  Critical: '#dc2626',
  High: '#f97316',
  Medium: '#3b82f6',
  Low: '#6b7280',
};

function PieChartComponent({ data, colors, size = 180 }) {
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  let cumulative = 0;
  const slices = data.map(d => {
    const start = cumulative;
    cumulative += (d.value / total) * 360;
    return { ...d, start, end: cumulative };
  });

  const toRad = (deg) => (deg - 90) * (Math.PI / 180);

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {slices.map((slice, i) => {
        const x1 = size / 2 + (size / 2 - 10) * Math.cos(toRad(slice.start));
        const y1 = size / 2 + (size / 2 - 10) * Math.sin(toRad(slice.start));
        const x2 = size / 2 + (size / 2 - 10) * Math.cos(toRad(slice.end));
        const y2 = size / 2 + (size / 2 - 10) * Math.sin(toRad(slice.end));
        const largeArc = slice.end - slice.start > 180 ? 1 : 0;
        return (
          <path
            key={i}
            d={`M ${size / 2} ${size / 2} L ${x1} ${y1} A ${size / 2 - 10} ${size / 2 - 10} 0 ${largeArc} 1 ${x2} ${y2} Z`}
            fill={colors[slice.label] || '#ccc'}
            stroke="white"
            strokeWidth="2"
          >
            <title>{slice.label}: {slice.value}</title>
          </path>
        );
      })}
      <circle cx={size / 2} cy={size / 2} r={size / 4} fill="white" className="dark:fill-gray-900" />
    </svg>
  );
}

function BarChartComponent({ data, color = '#6366f1', height = 200 }) {
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div className="flex items-end gap-2" style={{ height }}>
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1">
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: `${(d.value / max) * 100}%` }}
            transition={{ duration: 0.6, delay: i * 0.05 }}
            className="w-full rounded-t-md"
            style={{ backgroundColor: color, opacity: 0.7 + (i / data.length) * 0.3 }}
          />
          <span className="text-[10px] text-gray-500 dark:text-gray-400 text-center truncate w-full">{d.label}</span>
        </div>
      ))}
    </div>
  );
}

export default function Reports() {
  const [stats, setStats] = useState({ projects: 0, total: 0, pass: 0, fail: 0, blocked: 0, notExecuted: 0 });
  const [testCases, setTestCases] = useState([]);

  useEffect(() => {
    async function load() {
      const projects = await db.projects.count();
      const tc = await db.testCases.toArray();
      setTestCases(tc);
      const pass = tc.filter(t => t.status === 'Pass').length;
      const fail = tc.filter(t => t.status === 'Fail').length;
      const blocked = tc.filter(t => t.status === 'Blocked').length;
      const untested = tc.filter(t => !t.status || t.status === 'Untested').length;
      setStats({ projects, total: tc.length, pass, fail, blocked, notExecuted: untested });
    }
    load();
  }, []);

  const statusData = [
    { label: 'Pass', value: stats.pass },
    { label: 'Fail', value: stats.fail },
    { label: 'Blocked', value: stats.blocked },
    { label: 'Not Executed', value: stats.notExecuted },
  ];

  const priorityData = useMemo(() => {
    const counts = { Critical: 0, High: 0, Medium: 0, Low: 0 };
    testCases.forEach(tc => { if (counts[tc.priority] !== undefined) counts[tc.priority]++; });
    return Object.entries(counts).map(([label, value]) => ({ label, value }));
  }, [testCases]);

  const severityData = useMemo(() => {
    const counts = { Critical: 0, High: 0, Medium: 0, Low: 0 };
    testCases.forEach(tc => { if (counts[tc.severity] !== undefined) counts[tc.severity]++; });
    return Object.entries(counts).map(([label, value]) => ({ label, value }));
  }, [testCases]);

  const passRate = stats.total > 0 ? Math.round((stats.pass / stats.total) * 100) : 0;

  return (
    <div>
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">Reports & Analytics</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">Visual insights into your testing progress</p>
      </motion.div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Pass Rate</p>
          <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">{passRate}%</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total Test Cases</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-1">{stats.total}</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Fail Count</p>
          <p className="text-3xl font-bold text-red-600 dark:text-red-400 mt-1">{stats.fail}</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Blocked</p>
          <p className="text-3xl font-bold text-amber-600 dark:text-amber-400 mt-1">{stats.blocked}</p>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5"
        >
          <div className="flex items-center gap-2 mb-4">
            <PieChart size={18} className="text-indigo-500" />
            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">Status Distribution</h2>
          </div>
          <div className="flex flex-col items-center">
            <PieChartComponent data={statusData} colors={COLORS} />
            <div className="flex flex-wrap gap-4 mt-4">
              {statusData.map(d => (
                <div key={d.label} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[d.label] }} />
                  <span className="text-xs text-gray-600 dark:text-gray-400">{d.label}: {d.value}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5"
        >
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 size={18} className="text-indigo-500" />
            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">Priority Distribution</h2>
          </div>
          <BarChartComponent data={priorityData} color="#6366f1" height={200} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5"
        >
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 size={18} className="text-orange-500" />
            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">Severity Distribution</h2>
          </div>
          <BarChartComponent data={severityData} color="#f97316" height={200} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5"
        >
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={18} className="text-emerald-500" />
            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">Execution Summary</h2>
          </div>
          <div className="space-y-3">
            {statusData.map(d => {
              const pct = stats.total > 0 ? Math.round((d.value / stats.total) * 100) : 0;
              return (
                <div key={d.label}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600 dark:text-gray-400">{d.label}</span>
                    <span className="font-medium text-gray-900 dark:text-gray-100">{d.value} ({pct}%)</span>
                  </div>
                  <div className="h-2.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.8 }}
                      className="h-full rounded-full"
                      style={{ backgroundColor: COLORS[d.label] }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
