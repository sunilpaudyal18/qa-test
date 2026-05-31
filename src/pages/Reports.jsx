import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, PieChart, TrendingUp } from 'lucide-react';
import db from '../db/db';

const COLORS = {
  Pass: 'var(--color-pass)',
  Fail: 'var(--color-fail)',
  Blocked: 'var(--color-blocked)',
  'Not Executed': 'var(--color-untested)',
};

const PRIORITY_COLORS = {
  Critical: 'var(--color-critical)',
  High: 'var(--color-major)',
  Medium: 'var(--color-minor)',
  Low: 'var(--color-untested)',
};

const SEVERITY_COLORS = {
  Critical: 'var(--color-critical)',
  Major: 'var(--color-major)',
  Minor: 'var(--color-minor)',
  Low: 'var(--color-untested)',
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
            stroke="var(--color-bg)"
            strokeWidth="2"
          >
            <title>{slice.label}: {slice.value}</title>
          </path>
        );
      })}
      <circle cx={size / 2} cy={size / 2} r={size / 4} style={{ fill: 'var(--color-bg)' }} />
    </svg>
  );
}

function BarChartComponent({ data, colors, height = 200 }) {
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
            style={{ background: colors?.[d.label] || 'var(--color-primary)', opacity: 0.7 + (i / data.length) * 0.3 }}
          />
          <span className="text-[10px] text-center truncate w-full" style={{ color: 'var(--color-text-muted)' }}>{d.label}</span>
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
    const counts = { Critical: 0, Major: 0, Minor: 0, Low: 0 };
    testCases.forEach(tc => { if (counts[tc.severity] !== undefined) counts[tc.severity]++; });
    return Object.entries(counts).map(([label, value]) => ({ label, value }));
  }, [testCases]);

  const passRate = stats.total > 0 ? Math.round((stats.pass / stats.total) * 100) : 0;

  return (
    <div>
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--color-text-primary)' }}>Reports & Analytics</h1>
        <p className="text-sm mb-6" style={{ color: 'var(--color-text-secondary)' }}>Visual insights into your testing progress</p>
      </motion.div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-xl p-4"
          style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
          <p className="text-xs uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>Pass Rate</p>
          <p className="text-3xl font-bold mt-1" style={{ color: 'var(--color-pass)' }}>{passRate}%</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className="rounded-xl p-4"
          style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
          <p className="text-xs uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>Total Test Cases</p>
          <p className="text-3xl font-bold mt-1" style={{ color: 'var(--color-text-primary)' }}>{stats.total}</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="rounded-xl p-4"
          style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
          <p className="text-xs uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>Fail Count</p>
          <p className="text-3xl font-bold mt-1" style={{ color: 'var(--color-fail)' }}>{stats.fail}</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="rounded-xl p-4"
          style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
          <p className="text-xs uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>Blocked</p>
          <p className="text-3xl font-bold mt-1" style={{ color: 'var(--color-blocked)' }}>{stats.blocked}</p>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="rounded-xl p-5"
          style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
          <div className="flex items-center gap-2 mb-4">
            <PieChart size={18} style={{ color: 'var(--color-primary)' }} />
            <h2 className="text-base font-semibold" style={{ color: 'var(--color-text-primary)' }}>Status Distribution</h2>
          </div>
          <div className="flex flex-col items-center">
            <PieChartComponent data={statusData} colors={COLORS} />
            <div className="flex flex-wrap gap-4 mt-4">
              {statusData.map(d => (
                <div key={d.label} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ background: COLORS[d.label] }} />
                  <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>{d.label}: {d.value}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
          className="rounded-xl p-5"
          style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 size={18} style={{ color: 'var(--color-primary)' }} />
            <h2 className="text-base font-semibold" style={{ color: 'var(--color-text-primary)' }}>Priority Distribution</h2>
          </div>
          <BarChartComponent data={priorityData} colors={PRIORITY_COLORS} height={200} />
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="rounded-xl p-5"
          style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 size={18} style={{ color: 'var(--color-major)' }} />
            <h2 className="text-base font-semibold" style={{ color: 'var(--color-text-primary)' }}>Severity Distribution</h2>
          </div>
          <BarChartComponent data={severityData} colors={SEVERITY_COLORS} height={200} />
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
          className="rounded-xl p-5"
          style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={18} style={{ color: 'var(--color-pass)' }} />
            <h2 className="text-base font-semibold" style={{ color: 'var(--color-text-primary)' }}>Execution Summary</h2>
          </div>
          <div className="space-y-3">
            {statusData.map(d => {
              const pct = stats.total > 0 ? Math.round((d.value / stats.total) * 100) : 0;
              return (
                <div key={d.label}>
                  <div className="flex justify-between text-sm mb-1">
                    <span style={{ color: 'var(--color-text-secondary)' }}>{d.label}</span>
                    <span className="font-medium" style={{ color: 'var(--color-text-primary)' }}>{d.value} ({pct}%)</span>
                  </div>
                  <div className="h-2.5 rounded-full overflow-hidden" style={{ background: 'var(--color-border)' }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.8 }}
                      className="h-full rounded-full"
                      style={{ background: COLORS[d.label] }}
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
