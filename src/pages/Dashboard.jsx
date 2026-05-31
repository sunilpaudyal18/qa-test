import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  FolderKanban, TestTube2, CheckCircle2, XCircle, Ban, Clock,
  Globe, TrendingUp, AlertTriangle, Activity,
} from 'lucide-react';
import db from '../db/db';

function StatCard({ icon: Icon, label, value, color, subtitle }) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      className="bg-gray-900 rounded-xl border border-gray-800 p-5 hover:border-gray-700 transition-colors">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-400">{label}</p>
          <p className="text-2xl font-bold text-white mt-1">{value}</p>
          {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
        </div>
        <div className={`p-3 rounded-lg ${color}`}><Icon size={24} className="text-white" /></div>
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
            fill={colors[slice.label] || '#ccc'} stroke="#111827" strokeWidth="2">
            <title>{slice.label}: {slice.value}</title>
          </path>
        );
      })}
      <circle cx={size / 2} cy={size / 2} r={size / 4} fill="#111827" />
      <text x={size / 2} y={size / 2 - 4} textAnchor="middle" className="fill-white font-bold" fontSize="22">{total}</text>
      <text x={size / 2} y={size / 2 + 12} textAnchor="middle" className="fill-gray-400" fontSize="10">Total</text>
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

  const statusColors = { Pass: '#10b981', Fail: '#ef4444', Blocked: '#f59e0b', Untested: '#6B7280' };
  const passRate = stats.total > 0 ? Math.round((stats.pass / stats.total) * 100) : 0;

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-gray-400 text-sm mt-1">Overview of your QA testing activities</p>
      </motion.div>

      <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-3">
        <StatCard icon={FolderKanban} label="Projects" value={stats.projects} color="bg-indigo-500" />
        <StatCard icon={TestTube2} label="Total Cases" value={stats.total} color="bg-blue-500" subtitle={`${stats.highPriority} high priority`} />
        <StatCard icon={CheckCircle2} label="Pass" value={stats.pass} color="bg-emerald-500" subtitle={`${passRate}% pass rate`} />
        <StatCard icon={XCircle} label="Fail" value={stats.fail} color="bg-red-500" />
        <StatCard icon={Ban} label="Blocked" value={stats.blocked} color="bg-amber-500" />
        <StatCard icon={Clock} label="Untested" value={stats.untested} color="bg-gray-500" />
        <StatCard icon={Globe} label="API Requests" value={stats.apiRequests} color="bg-purple-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="lg:col-span-2 bg-gray-900 rounded-xl border border-gray-800 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-white">Status Distribution</h2>
            <TrendingUp size={18} className="text-gray-500" />
          </div>
          <div className="space-y-3">
            {[
              { label: 'Pass', value: stats.pass, color: 'bg-emerald-500', total: stats.total || 1 },
              { label: 'Fail', value: stats.fail, color: 'bg-red-500', total: stats.total || 1 },
              { label: 'Blocked', value: stats.blocked, color: 'bg-amber-500', total: stats.total || 1 },
              { label: 'Untested', value: stats.untested, color: 'bg-gray-400', total: stats.total || 1 },
            ].map(item => (
              <div key={item.label}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-400">{item.label}</span>
                  <span className="font-medium text-white">{item.value} <span className="text-gray-500 font-normal">({Math.round((item.value / item.total) * 100)}%)</span></span>
                </div>
                <div className="h-2.5 bg-gray-800 rounded-full overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${(item.value / item.total) * 100}%` }}
                    transition={{ duration: 0.8, delay: 0.2 }} className={`h-full rounded-full ${item.color}`} />
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="bg-gray-900 rounded-xl border border-gray-800 p-5 flex flex-col items-center">
          <h2 className="text-base font-semibold text-white mb-3 self-start">Test Results</h2>
          <PieChartComponent data={[
            { label: 'Pass', value: stats.pass },
            { label: 'Fail', value: stats.fail },
            { label: 'Blocked', value: stats.blocked },
            { label: 'Untested', value: stats.untested },
          ]} colors={statusColors} />
          <div className="flex flex-wrap gap-3 mt-4 justify-center">
            {Object.entries(statusColors).map(([label, color]) => (
              <div key={label} className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
                <span className="text-xs text-gray-400">{label}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
          className="bg-gray-900 rounded-xl border border-gray-800 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Activity size={16} className="text-indigo-400" />
            <h2 className="text-base font-semibold text-white">Module Breakdown</h2>
          </div>
          {moduleStats.length === 0 ? (
            <p className="text-gray-500 text-sm">No test cases yet</p>
          ) : (
            <div className="space-y-3">
              {moduleStats.map(([mod, data]) => {
                const passPct = data.total > 0 ? Math.round((data.pass / data.total) * 100) : 0;
                return (
                  <div key={mod}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-300 font-medium truncate">{mod}</span>
                      <span className="text-gray-500">{data.pass}/{data.total} pass</span>
                    </div>
                    <div className="h-2 bg-gray-800 rounded-full overflow-hidden flex">
                      {data.pass > 0 && (
                        <motion.div initial={{ width: 0 }} animate={{ width: `${passPct}%` }}
                          transition={{ duration: 0.6 }} className="h-full bg-emerald-500 rounded-l-full" />
                      )}
                      {data.fail > 0 && (
                        <motion.div initial={{ width: 0 }} animate={{ width: `${Math.round((data.fail / data.total) * 100)}%` }}
                          transition={{ duration: 0.6 }} className="h-full bg-red-500" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="bg-gray-900 rounded-xl border border-gray-800 p-5">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle size={16} className="text-amber-400" />
            <h2 className="text-base font-semibold text-white">Priority & Severity</h2>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-800/50 rounded-lg p-4">
              <p className="text-xs text-gray-500 uppercase font-semibold mb-3">Priority</p>
              {[
                { label: 'Critical', value: stats.total > 0 ? Math.round((stats.highPriority / stats.total) * 100) : 0 },
                { label: 'High', value: 0 },
              ].map(item => (
                <div key={item.label} className="mb-2 last:mb-0">
                  <div className="flex justify-between text-xs mb-0.5">
                    <span className="text-gray-400">{item.label}</span>
                    <span className="text-gray-300 font-medium">{item.value}%</span>
                  </div>
                  <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                    <div className="h-full bg-red-500 rounded-full" style={{ width: `${item.value}%` }} />
                  </div>
                </div>
              ))}
              <p className="text-xs text-gray-500 mt-2">{stats.highPriority} cases are Critical/High priority</p>
            </div>
            <div className="bg-gray-800/50 rounded-lg p-4">
              <p className="text-xs text-gray-500 uppercase font-semibold mb-3">Severity</p>
              {[
                { label: 'Critical', value: stats.criticalSeverity, color: 'bg-red-500' },
                { label: 'Major', value: stats.total - stats.criticalSeverity, color: 'bg-amber-500' },
              ].map(item => (
                <div key={item.label} className="mb-2 last:mb-0">
                  <div className="flex justify-between text-xs mb-0.5">
                    <span className="text-gray-400">{item.label}</span>
                    <span className="text-gray-300 font-medium">{item.value}</span>
                  </div>
                  <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                    <div className={`h-full ${item.color} rounded-full`}
                      style={{ width: `${stats.total > 0 ? (item.value / stats.total) * 100 : 0}%` }} />
                  </div>
                </div>
              ))}
              <p className="text-xs text-gray-500 mt-2">{stats.criticalSeverity} critically severe</p>
            </div>
          </div>
        </motion.div>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
        className="bg-gray-900 rounded-xl border border-gray-800 p-5">
        <h2 className="text-base font-semibold text-white mb-4">Recent Test Cases</h2>
        {recentCases.length === 0 ? (
          <p className="text-gray-500 text-sm">No test cases created yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800 text-xs text-gray-500 uppercase">
                  <th className="text-left py-2 pr-3">ID</th>
                  <th className="text-left py-2 pr-3">Title</th>
                  <th className="text-left py-2 pr-3">Module</th>
                  <th className="text-left py-2">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/50">
                {recentCases.map(tc => (
                  <tr key={tc.id} className="hover:bg-white/[.02] transition-colors">
                    <td className="py-2.5 pr-3 text-xs font-mono text-indigo-400">{tc.testId || '-'}</td>
                    <td className="py-2.5 pr-3 text-gray-200">{tc.title || 'Untitled'}</td>
                    <td className="py-2.5 pr-3 text-xs text-gray-500">{tc.module || '-'}</td>
                    <td className="py-2.5">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        tc.status === 'Pass' ? 'bg-emerald-900/40 text-emerald-400' :
                        tc.status === 'Fail' ? 'bg-red-900/40 text-red-400' :
                        tc.status === 'Blocked' ? 'bg-amber-900/40 text-amber-400' :
                        'bg-gray-800 text-gray-500'
                      }`}>{tc.status || 'Untested'}</span>
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
