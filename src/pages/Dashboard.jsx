import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { FolderKanban, TestTube2, CheckCircle2, XCircle, Ban, Clock } from 'lucide-react';
import db from '../db/db';

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">{value}</p>
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon size={24} className="text-white" />
        </div>
      </div>
    </motion.div>
  );
}

export default function Dashboard() {
  const [stats, setStats] = useState({ projects: 0, total: 0, pass: 0, fail: 0, blocked: 0, notExecuted: 0 });
  const [recentCases, setRecentCases] = useState([]);

  useEffect(() => {
    async function load() {
      const projects = await db.projects.count();
      const testCases = await db.testCases.toArray();
      const pass = testCases.filter(tc => tc.status === 'Pass').length;
      const fail = testCases.filter(tc => tc.status === 'Fail').length;
      const blocked = testCases.filter(tc => tc.status === 'Blocked').length;
      const notExecuted = testCases.filter(tc => tc.status === 'Not Executed' || !tc.status).length;

      setStats({ projects, total: testCases.length, pass, fail, blocked, notExecuted });

      const recent = testCases
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5);
      setRecentCases(recent);
    }
    load();
  }, []);

  const statusColors = {
    Pass: 'bg-emerald-500',
    Fail: 'bg-red-500',
    Blocked: 'bg-amber-500',
    'Not Executed': 'bg-gray-400',
  };

  return (
    <div>
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">Dashboard</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">Overview of your QA testing activities</p>
      </motion.div>

      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
        <StatCard icon={FolderKanban} label="Projects" value={stats.projects} color="bg-indigo-500" />
        <StatCard icon={TestTube2} label="Total Test Cases" value={stats.total} color="bg-blue-500" />
        <StatCard icon={CheckCircle2} label="Pass" value={stats.pass} color="bg-emerald-500" />
        <StatCard icon={XCircle} label="Fail" value={stats.fail} color="bg-red-500" />
        <StatCard icon={Ban} label="Blocked" value={stats.blocked} color="bg-amber-500" />
        <StatCard icon={Clock} label="Not Executed" value={stats.notExecuted} color="bg-gray-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5"
        >
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-4">Status Distribution</h2>
          <div className="space-y-3">
            {[
              { label: 'Pass', value: stats.pass, color: 'bg-emerald-500', total: stats.total || 1 },
              { label: 'Fail', value: stats.fail, color: 'bg-red-500', total: stats.total || 1 },
              { label: 'Blocked', value: stats.blocked, color: 'bg-amber-500', total: stats.total || 1 },
              { label: 'Not Executed', value: stats.notExecuted, color: 'bg-gray-400', total: stats.total || 1 },
            ].map(item => (
              <div key={item.label}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600 dark:text-gray-400">{item.label}</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">{item.value}</span>
                </div>
                <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(item.value / item.total) * 100}%` }}
                    transition={{ duration: 0.8, delay: 0.3 }}
                    className={`h-full rounded-full ${item.color}`}
                  />
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5"
        >
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-4">Recent Test Cases</h2>
          {recentCases.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-sm">No test cases created yet</p>
          ) : (
            <div className="space-y-2">
              {recentCases.map(tc => (
                <div key={tc.id} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{tc.title || 'Untitled'}</p>
                    <p className="text-xs text-gray-500">{tc.tcId || 'No ID'}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-xs font-medium text-white ${statusColors[tc.status] || 'bg-gray-400'}`}>
                    {tc.status || 'Not Executed'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
