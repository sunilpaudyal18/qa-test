import { useState } from 'react';
import { 
  Play, Square, ShieldAlert, Award, Activity, 
  ChevronRight, BarChart2, Loader2, Info, X
} from 'lucide-react';

export default function LoadTestPanel({ isOpen, onClose, store, toast }) {
  const { url, loadTestResults, loadTestRunning, runLoadTest } = store;
  
  const [vus, setVus] = useState(5);
  const [duration, setDuration] = useState(5); // seconds
  const [iterations, setIterations] = useState(0); // 0 means unlimited (rely on duration)

  if (!isOpen) return null;

  const handleStart = () => {
    if (!url.trim()) {
      toast?.warning('Please enter a target request URL in the center workspace first.');
      return;
    }
    runLoadTest({
      virtualUsers: parseInt(vus) || 1,
      duration: parseInt(duration) || 5,
      iterations: parseInt(iterations) || 0,
    });
  };

  // Helper to generate distribution chart buckets
  const renderDistributionChart = () => {
    if (!loadTestResults || !loadTestResults.distribution?.length) return null;

    const times = loadTestResults.distribution;
    const min = loadTestResults.minTime;
    const max = loadTestResults.maxTime;
    const bucketCount = 10;
    const bucketWidth = (max - min) / bucketCount || 1;

    const buckets = Array(bucketCount).fill(0);
    times.forEach(t => {
      let bIdx = Math.floor((t - min) / bucketWidth);
      if (bIdx >= bucketCount) bIdx = bucketCount - 1;
      buckets[bIdx]++;
    });

    const maxBucketVal = Math.max(...buckets) || 1;

    return (
      <div className="space-y-2 pt-2">
        <h4 className="text-[10px] uppercase font-bold tracking-wider" style={{ color: 'var(--color-text-muted)' }}>Response Time Distribution</h4>
        
        {/* Bars Container */}
        <div className="flex items-end h-24 gap-1.5 border-b pb-1" style={{ borderColor: 'var(--color-border)' }}>
          {buckets.map((val, idx) => {
            const hPct = (val / maxBucketVal) * 100;
            const rangeMin = Math.round(min + idx * bucketWidth);
            const rangeMax = Math.round(min + (idx + 1) * bucketWidth);
            return (
              <div 
                key={idx} 
                className="flex-1 flex flex-col justify-end h-full group relative cursor-pointer"
              >
                {/* Tooltip */}
                <div 
                  className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block z-10 p-1.5 rounded text-[9px] whitespace-nowrap shadow border bg-slate-900 text-white font-mono"
                >
                  {rangeMin}-{rangeMax}ms: <strong>{val} reqs</strong>
                </div>
                {/* Visual Bar */}
                <div 
                  className="rounded-t transition-all bg-indigo-500 hover:bg-indigo-600 dark:bg-indigo-600 dark:hover:bg-indigo-500"
                  style={{ height: `${hPct}%` }}
                />
              </div>
            );
          })}
        </div>
        <div className="flex justify-between text-[9px]" style={{ color: 'var(--color-text-muted)' }}>
          <span>{min} ms</span>
          <span>Latency Spread</span>
          <span>{max} ms</span>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center select-none">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-xs" onClick={onClose} />
      
      {/* Modal Box */}
      <div 
        className="relative w-full max-w-xl rounded-xl shadow-2xl flex flex-col max-h-[85vh]"
        style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
      >
        {/* Header */}
        <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--color-border)' }}>
          <div className="flex items-center gap-2">
            <Activity className="text-red-500" size={16} />
            <h2 className="text-sm font-bold text-neutral-800 dark:text-neutral-100">Load & Stress Testing</h2>
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
            <X size={16} style={{ color: 'var(--color-text-muted)' }} />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Target URL Info Block */}
          <div 
            className="p-2.5 rounded-lg border flex flex-col gap-1 text-xs"
            style={{ background: 'var(--color-surface-alt)', borderColor: 'var(--color-border)' }}
          >
            <span className="font-semibold text-neutral-400">Target Request URL:</span>
            <code className="font-mono break-all text-indigo-600 dark:text-indigo-400 font-bold">
              {url || '(No request URL defined - enter one in request bar first)'}
            </code>
          </div>

          {/* Config Grid */}
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>
                Concurrency (VUs)
              </label>
              <input
                type="number"
                min="1"
                max="50"
                value={vus}
                disabled={loadTestRunning}
                onChange={e => setVus(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs rounded border focus:outline-none"
                style={{ background: 'var(--color-surface-alt)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>
                Duration (Secs)
              </label>
              <input
                type="number"
                min="1"
                max="60"
                value={duration}
                disabled={loadTestRunning}
                onChange={e => setDuration(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs rounded border focus:outline-none"
                style={{ background: 'var(--color-surface-alt)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>
                Max Requests
              </label>
              <input
                type="number"
                min="0"
                value={iterations}
                disabled={loadTestRunning}
                onChange={e => setIterations(e.target.value)}
                placeholder="0 = Unlimited"
                className="w-full px-2.5 py-1.5 text-xs rounded border focus:outline-none"
                style={{ background: 'var(--color-surface-alt)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
              />
            </div>
          </div>

          {/* Test Status Indicator */}
          {loadTestRunning ? (
            <div className="flex flex-col items-center justify-center p-6 border rounded-lg gap-2 text-center" style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface-alt)' }}>
              <Loader2 className="animate-spin text-indigo-500" size={24} />
              <span className="text-xs font-semibold" style={{ color: 'var(--color-text-secondary)' }}>Firing concurrent API calls...</span>
              <span className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>Generating stress load. Please do not close this window.</span>
            </div>
          ) : (
            /* Results Presentation */
            loadTestResults && (
              <div className="space-y-3 pt-2">
                <div className="grid grid-cols-3 gap-2">
                  <div className="p-2 border rounded-lg flex flex-col text-center" style={{ background: 'var(--color-surface-alt)', borderColor: 'var(--color-border)' }}>
                    <span className="text-[9px] uppercase font-bold" style={{ color: 'var(--color-text-muted)' }}>Throughput</span>
                    <span className="text-xs font-mono font-bold text-neutral-800 dark:text-neutral-200">{loadTestResults.throughput} req/s</span>
                  </div>
                  <div className="p-2 border rounded-lg flex flex-col text-center" style={{ background: 'var(--color-surface-alt)', borderColor: 'var(--color-border)' }}>
                    <span className="text-[9px] uppercase font-bold" style={{ color: 'var(--color-text-muted)' }}>Avg Latency</span>
                    <span className="text-xs font-mono font-bold text-neutral-800 dark:text-neutral-200">{loadTestResults.avgTime} ms</span>
                  </div>
                  <div className="p-2 border rounded-lg flex flex-col text-center" style={{ background: 'var(--color-surface-alt)', borderColor: 'var(--color-border)' }}>
                    <span className="text-[9px] uppercase font-bold" style={{ color: 'var(--color-text-muted)' }}>Failure Rate</span>
                    <span className={`text-xs font-mono font-bold ${loadTestResults.failed > 0 ? 'text-red-500' : 'text-green-500'}`}>{loadTestResults.failureRate}%</span>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-2 text-[10px] font-medium p-2 border rounded-lg" style={{ background: 'var(--color-surface-alt)', borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}>
                  <div>Total Requests: <strong className="font-mono">{loadTestResults.total}</strong></div>
                  <div>Passed: <strong className="font-mono text-green-600">{loadTestResults.passed}</strong></div>
                  <div>Failed: <strong className="font-mono text-red-600">{loadTestResults.failed}</strong></div>
                  <div>Min/Max: <strong className="font-mono">{loadTestResults.minTime}/{loadTestResults.maxTime}ms</strong></div>
                </div>

                {renderDistributionChart()}
              </div>
            )
          )}
        </div>

        {/* Footer actions */}
        <div 
          className="p-4 border-t flex justify-between bg-neutral-50 dark:bg-neutral-900 rounded-b-xl"
          style={{ borderColor: 'var(--color-border)' }}
        >
          <div className="flex items-center gap-1 text-[10px]" style={{ color: 'var(--color-text-muted)' }}>
            <Info size={11} />
            Runs client-side in browser memory fetch cycles.
          </div>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-lg text-xs font-semibold border hover:bg-neutral-100 dark:hover:bg-neutral-850"
              style={{ color: 'var(--color-text-secondary)', borderColor: 'var(--color-border)' }}
            >
              Close
            </button>
            <button
              onClick={handleStart}
              disabled={loadTestRunning}
              className="flex items-center gap-1 px-4 py-1.5 rounded-lg text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50"
            >
              <Play size={11} />
              Run Stress Test
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
