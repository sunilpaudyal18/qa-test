import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  FolderKanban, TestTube2, CheckCircle2, XCircle, Ban, Clock,
  Globe, TrendingUp, AlertTriangle, Activity,
} from 'lucide-react';
import db from '../db/db';

function StatCard({ icon: Icon, label, value, subtitle, color }) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      className="rounded-xl p-5 transition-all duration-200 hover:-translate-y-0.5"
      style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-text-secondary)' }}>{label}</p>
          <p className="text-3xl font-bold tabular-nums mt-1" style={{ color: 'var(--color-text-primary)' }}>{value}</p>
          {subtitle && <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>{subtitle}</p>}
        </div>
        <div className="p-3 rounded-xl" style={{ background: color.bg }}>
          <Icon size={22} style={{ color: color.icon }} />
        </div>
      </div>
    </motion.div>
  );
}

function PieChartComponent({ data, colors, size = 160 }) {
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
          <path key={i}
            d={`M ${size / 2} ${size / 2} L ${x1} ${y1} A ${size / 2 - 10} ${size / 2 - 10} 0 ${largeArc} 1 ${x2} ${y2} Z`}
            fill={colors[slice.label] || '#ccc'} stroke="var(--color-bg)" strokeWidth="2">
            <title>{slice.label}: {slice.value}</title>
          </path>
        );
      })}
      <circle cx={size / 2} cy={size / 2} r={size / 4} style={{ fill: 'var(--color-bg)' }} />
      <text x={size / 2} y={size / 2 - 4} textAnchor="middle" className="fill-current font-bold" fontSize="22"
        style={{ color: 'var(--color-text-primary)' }}>{total}</text>
      <text x={size / 2} y={size / 2 + 12} textAnchor="middle" fontSize="10"
        style={{ fill: 'var(--color-text-muted)' }}>Total</text>
    </svg>
  );
}

export default function Dashboard() {
  const [stats, setStats] = useState({
    projects: 0, total: 0, pass: 0, fail: 0, blocked: 0, untested: 0,
    apiRequests: 0, highPriority: 0, criticalSeverity: 0,
  });
  const [recentCases, setRecentCases] = useState([]);
  const [moduleStats, setModuleStats] = useState([]);

  useEffect(() => {
    async function load() {
      const projects = await db.projects.count();
      const tc = await db.testCases.toArray();
      const pass = tc.filter(t => t.status === 'Pass').length;
      const fail = tc.filter(t => t.status === 'Fail').length;
      const blocked = tc.filter(t => t.status === 'Blocked').length;
      const untested = tc.filter(t => !t.status || t.status === 'Untested').length;
      const highPriority = tc.filter(t => t.priority === 'Critical' || t.priority === 'High').length;
      const criticalSeverity = tc.filter(t => t.severity === 'Critical').length;

      let apiRequests = 0;
      try { apiRequests = await db.apiRequests.count(); } catch {}

      setStats({ projects, total: tc.length, pass, fail, blocked, untested, apiRequests, highPriority, criticalSeverity });
      setRecentCases(tc.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5));

      const mods = {};
      tc.forEach(t => {
        const m = t.module || 'Uncategorized';
        if (!mods[m]) mods[m] = { total: 0, pass: 0, fail: 0 };
        mods[m].total++;
        if (t.status === 'Pass') mods[m].pass++;
        if (t.status === 'Fail') mods[m].fail++;
      });
      setModuleStats(Object.entries(mods).sort((a, b) => b[1].total - a[1].total).slice(0, 6));
    }
    load();
  }, []);

  const iconColors = {
    Projects: { bg: 'var(--color-primary-subtle)', icon: 'var(--color-primary)' },
    'Total Cases': { bg: 'var(--color-primary-subtle)', icon: 'var(--color-primary)' },
    Pass: { bg: 'rgba(22,163,74,0.1)', icon: 'var(--color-pass)' },
    Fail: { bg: 'rgba(220,38,38,0.1)', icon: 'var(--color-fail)' },
    Blocked: { bg: 'rgba(217,119,6,0.1)', icon: 'var(--color-blocked)' },
    Untested: { bg: 'rgba(107,114,128,0.1)', icon: 'var(--color-untested)' },
    'API Requests': { bg: 'var(--color-primary-subtle)', icon: 'var(--color-primary)' },
  };

  const statusColors = {
    Pass: 'var(--color-pass)',
    Fail: 'var(--color-fail)',
    Blocked: 'var(--color-blocked)',
    Untested: 'var(--color-untested)',
  };
  const passRate = stats.total > 0 ? Math.round((stats.pass / stats.total) * 100) : 0;

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>Dashboard</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>Overview of your QA testing activities</p>
      </motion.div>

      <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-3">
        <StatCard icon={FolderKanban} label="Projects" value={stats.projects} color={iconColors.Projects} />
        <StatCard icon={TestTube2} label="Total Cases" value={stats.total} color={iconColors['Total Cases']} subtitle={`${stats.highPriority} high priority`} />
        <StatCard icon={CheckCircle2} label="Pass" value={stats.pass} color={iconColors.Pass} subtitle={`${passRate}% pass rate`} />
        <StatCard icon={XCircle} label="Fail" value={stats.fail} color={iconColors.Fail} />
        <StatCard icon={Ban} label="Blocked" value={stats.blocked} color={iconColors.Blocked} />
        <StatCard icon={Clock} label="Untested" value={stats.untested} color={iconColors.Untested} />
        <StatCard icon={Globe} label="API Requests" value={stats.apiRequests} color={iconColors['API Requests']} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="lg:col-span-2 rounded-xl p-5"
          style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold" style={{ color: 'var(--color-text-primary)' }}>Status Distribution</h2>
            <TrendingUp size={18} style={{ color: 'var(--color-text-muted)' }} />
          </div>
          <div className="space-y-3">
            {[
              { label: 'Pass', value: stats.pass, color: 'var(--color-pass)', total: stats.total || 1 },
              { label: 'Fail', value: stats.fail, color: 'var(--color-fail)', total: stats.total || 1 },
              { label: 'Blocked', value: stats.blocked, color: 'var(--color-blocked)', total: stats.total || 1 },
              { label: 'Untested', value: stats.untested, color: 'var(--color-untested)', total: stats.total || 1 },
            ].map(item => (
              <div key={item.label}>
                <div className="flex justify-between text-sm mb-1">
                  <span style={{ color: 'var(--color-text-secondary)' }}>{item.label}</span>
                  <span className="font-medium" style={{ color: 'var(--color-text-primary)' }}>{item.value} <span className="font-normal" style={{ color: 'var(--color-text-muted)' }}>({Math.round((item.value / item.total) * 100)}%)</span></span>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--color-border)' }}>
                  <motion.div initial={{ width: 0 }} animate={{ width: `${(item.value / item.total) * 100}%` }}
                    transition={{ duration: 0.8, delay: 0.2 }} className="h-full rounded-full"
                    style={{ background: item.color }} />
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="rounded-xl p-5 flex flex-col items-center"
          style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
          <h2 className="text-base font-semibold mb-3 self-start" style={{ color: 'var(--color-text-primary)' }}>Test Results</h2>
          <PieChartComponent data={[
            { label: 'Pass', value: stats.pass },
            { label: 'Fail', value: stats.fail },
            { label: 'Blocked', value: stats.blocked },
            { label: 'Untested', value: stats.untested },
          ]} colors={statusColors} />
          <div className="flex flex-wrap gap-3 mt-4 justify-center">
            {Object.entries(statusColors).map(([label, color]) => (
              <div key={label} className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
                <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>{label}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
          className="rounded-xl p-5"
          style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
          <div className="flex items-center gap-2 mb-4">
            <Activity size={16} style={{ color: 'var(--color-primary)' }} />
            <h2 className="text-base font-semibold" style={{ color: 'var(--color-text-primary)' }}>Module Breakdown</h2>
          </div>
          {moduleStats.length === 0 ? (
            <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>No test cases yet</p>
          ) : (
            <div className="space-y-3">
              {moduleStats.map(([mod, data]) => {
                const passPct = data.total > 0 ? Math.round((data.pass / data.total) * 100) : 0;
                return (
                  <div key={mod}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-medium truncate" style={{ color: 'var(--color-text-primary)' }}>{mod}</span>
                      <span style={{ color: 'var(--color-text-muted)' }}>{data.pass}/{data.total} pass</span>
                    </div>
                    <div className="h-2 rounded-full overflow-hidden flex" style={{ background: 'var(--color-border)' }}>
                      {data.pass > 0 && (
                        <motion.div initial={{ width: 0 }} animate={{ width: `${passPct}%` }}
                          transition={{ duration: 0.6 }} className="h-full rounded-l-full"
                          style={{ background: 'var(--color-pass)' }} />
                      )}
                      {data.fail > 0 && (
                        <motion.div initial={{ width: 0 }} animate={{ width: `${Math.round((data.fail / data.total) * 100)}%` }}
                          transition={{ duration: 0.6 }} className="h-full"
                          style={{ background: 'var(--color-fail)' }} />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="rounded-xl p-5"
          style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle size={16} style={{ color: 'var(--color-major)' }} />
            <h2 className="text-base font-semibold" style={{ color: 'var(--color-text-primary)' }}>Priority & Severity</h2>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-lg p-4" style={{ background: 'var(--color-surface-alt)' }}>
              <p className="text-xs uppercase font-semibold mb-3" style={{ color: 'var(--color-text-muted)' }}>Priority</p>
              {[
                { label: 'Critical', value: stats.total > 0 ? Math.round((stats.highPriority / stats.total) * 100) : 0 },
                { label: 'High', value: 0 },
              ].map(item => (
                <div key={item.label} className="mb-2 last:mb-0">
                  <div className="flex justify-between text-xs mb-0.5">
                    <span style={{ color: 'var(--color-text-secondary)' }}>{item.label}</span>
                    <span className="font-medium" style={{ color: 'var(--color-text-primary)' }}>{item.value}%</span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--color-border)' }}>
                    <div className="h-full rounded-full" style={{ width: `${item.value}%`, background: 'var(--color-critical)' }} />
                  </div>
                </div>
              ))}
              <p className="text-xs mt-2" style={{ color: 'var(--color-text-muted)' }}>{stats.highPriority} cases are Critical/High priority</p>
            </div>
            <div className="rounded-lg p-4" style={{ background: 'var(--color-surface-alt)' }}>
              <p className="text-xs uppercase font-semibold mb-3" style={{ color: 'var(--color-text-muted)' }}>Severity</p>
              {[
                { label: 'Critical', value: stats.criticalSeverity, color: 'var(--color-critical)' },
                { label: 'Major', value: stats.total - stats.criticalSeverity, color: 'var(--color-major)' },
              ].map(item => (
                <div key={item.label} className="mb-2 last:mb-0">
                  <div className="flex justify-between text-xs mb-0.5">
                    <span style={{ color: 'var(--color-text-secondary)' }}>{item.label}</span>
                    <span className="font-medium" style={{ color: 'var(--color-text-primary)' }}>{item.value}</span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--color-border)' }}>
                    <div className="h-full rounded-full" style={{ width: `${stats.total > 0 ? (item.value / stats.total) * 100 : 0}%`, background: item.color }} />
                  </div>
                </div>
              ))}
              <p className="text-xs mt-2" style={{ color: 'var(--color-text-muted)' }}>{stats.criticalSeverity} critically severe</p>
            </div>
          </div>
        </motion.div>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
        className="rounded-xl p-5"
        style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
        <h2 className="text-base font-semibold mb-4" style={{ color: 'var(--color-text-primary)' }}>Recent Test Cases</h2>
        {recentCases.length === 0 ? (
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>No test cases created yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs font-semibold uppercase tracking-wider"
                  style={{ borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-secondary)' }}>
                  <th className="text-left py-2 pr-3">ID</th>
                  <th className="text-left py-2 pr-3">Title</th>
                  <th className="text-left py-2 pr-3">Module</th>
                  <th className="text-left py-2">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: 'var(--color-border)' }}>
                {recentCases.map(tc => (
                  <tr key={tc.id} className="transition-colors"
                    style={{ borderBottom: '1px solid var(--color-border)' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--color-surface-alt)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <td className="py-2.5 pr-3 text-xs font-mono font-semibold" style={{ color: 'var(--color-primary)' }}>{tc.testId || '-'}</td>
                    <td className="py-2.5 pr-3" style={{ color: 'var(--color-text-primary)' }}>{tc.title || 'Untitled'}</td>
                    <td className="py-2.5 pr-3 text-xs" style={{ color: 'var(--color-text-muted)' }}>{tc.module || '-'}</td>
                    <td className="py-2.5">
                      <span className="px-2 py-0.5 rounded text-xs font-medium" style={{
                        background: tc.status === 'Pass' ? 'rgba(22,163,74,0.1)' :
                          tc.status === 'Fail' ? 'rgba(220,38,38,0.1)' :
                          tc.status === 'Blocked' ? 'rgba(217,119,6,0.1)' :
                          'var(--color-surface-alt)',
                        color: tc.status === 'Pass' ? 'var(--color-pass)' :
                          tc.status === 'Fail' ? 'var(--color-fail)' :
                          tc.status === 'Blocked' ? 'var(--color-blocked)' :
                          'var(--color-untested)',
                      }}>{tc.status || 'Untested'}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </div>
  );
}
