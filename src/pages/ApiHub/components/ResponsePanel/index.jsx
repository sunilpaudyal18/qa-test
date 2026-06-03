import { useState } from 'react';
import ResponseStatusBar from './ResponseStatusBar';
import PrettyTab from './tabs/PrettyTab';
import RawTab from './tabs/RawTab';
import PreviewTab from './tabs/PreviewTab';
import ResponseHeadersTab from './tabs/ResponseHeadersTab';
import CookiesTab from './tabs/CookiesTab';
import TimelineTab from './tabs/TimelineTab';
import { 
  Code, Eye, Globe, Clock, ShieldCheck, Terminal, Loader2,
  CheckCircle2, XCircle, AlertCircle 
} from 'lucide-react';

const TABS = [
  { id: 'pretty', label: 'Pretty', icon: Code },
  { id: 'raw', label: 'Raw', icon: Terminal },
  { id: 'preview', label: 'Preview', icon: Eye },
  { id: 'headers', label: 'Headers', icon: Globe },
  { id: 'cookies', label: 'Cookies', icon: ShieldCheck },
  { id: 'timeline', label: 'Timeline', icon: Clock },
];

export default function ResponsePanel({ store, onExtractVarClick, onCopyPath, toast }) {
  const { 
    response, sending, testResults, 
    activeResponseTab, setActiveResponseTab 
  } = store;

  // Render loader
  if (sending) {
    return (
      <div 
        className="flex flex-col items-center justify-center h-full gap-3 select-none"
        style={{ background: 'var(--color-surface)' }}
      >
        <Loader2 className="animate-spin text-indigo-500" size={32} />
        <p className="text-xs font-semibold" style={{ color: 'var(--color-text-secondary)' }}>
          Sending Request...
        </p>
        <p className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>
          Waiting for response from server.
        </p>
      </div>
    );
  }

  // Render empty state
  if (!response) {
    return (
      <div 
        className="flex flex-col items-center justify-center h-full text-center p-6 select-none"
        style={{ background: 'var(--color-surface)' }}
      >
        <div 
          className="w-12 h-12 rounded-full flex items-center justify-center mb-3"
          style={{ background: 'var(--color-surface-alt)', border: '1px dashed var(--color-border)' }}
        >
          <Code size={20} style={{ color: 'var(--color-text-muted)' }} />
        </div>
        <h3 className="text-xs font-bold" style={{ color: 'var(--color-text-primary)' }}>No Response Yet</h3>
        <p className="text-[10px] mt-1 max-w-[200px]" style={{ color: 'var(--color-text-muted)' }}>
          Configure your request method and URL, then click Send to trigger a fetch.
        </p>
      </div>
    );
  }

  // Calculate test passes
  const totalTests = testResults.length;
  const passedTests = testResults.filter(t => t.passed).length;
  const testsLabel = totalTests > 0 ? `Tests (${passedTests}/${totalTests})` : 'Tests';

  return (
    <div 
      className="flex flex-col h-full overflow-hidden"
      style={{ background: 'var(--color-surface)' }}
    >
      {/* Response Status / Metrics Header */}
      <ResponseStatusBar store={store} onExtractVarClick={onExtractVarClick} />

      {/* Tabs navigation row */}
      <div 
        className="flex items-center px-3 border-b bg-neutral-50 dark:bg-neutral-900 flex-shrink-0"
        style={{ borderColor: 'var(--color-border)' }}
      >
        <div className="flex gap-1 overflow-x-auto no-scrollbar">
          {TABS.map(t => {
            const Icon = t.icon;
            const isActive = activeResponseTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActiveResponseTab(t.id)}
                className="flex items-center gap-1.5 px-2.5 py-2 text-xs font-semibold border-b-2 transition-all whitespace-nowrap"
                style={{
                  borderColor: isActive ? 'var(--color-primary)' : 'transparent',
                  color: isActive ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                }}
              >
                <Icon size={11} />
                {t.label}
              </button>
            );
          })}
          <button
            onClick={() => setActiveResponseTab('tests')}
            className="flex items-center gap-1.5 px-2.5 py-2 text-xs font-semibold border-b-2 transition-all whitespace-nowrap"
            style={{
              borderColor: activeResponseTab === 'tests' ? 'var(--color-primary)' : 'transparent',
              color: activeResponseTab === 'tests' 
                ? 'var(--color-primary)' 
                : totalTests > 0 
                  ? (passedTests === totalTests ? '#16a34a' : '#dc2626') 
                  : 'var(--color-text-secondary)',
            }}
          >
            <ShieldCheck size={11} />
            {testsLabel}
          </button>
        </div>
      </div>

      {/* Scrollable Tab Panel Body */}
      <div className="flex-1 overflow-y-auto p-3">
        {activeResponseTab === 'pretty' && (
          <PrettyTab store={store} onCopyPath={onCopyPath} />
        )}
        {activeResponseTab === 'raw' && (
          <RawTab store={store} />
        )}
        {activeResponseTab === 'preview' && (
          <PreviewTab store={store} />
        )}
        {activeResponseTab === 'headers' && (
          <ResponseHeadersTab store={store} />
        )}
        {activeResponseTab === 'cookies' && (
          <CookiesTab store={store} />
        )}
        {activeResponseTab === 'timeline' && (
          <TimelineTab store={store} />
        )}
        {activeResponseTab === 'tests' && (
          <TestResultsView results={testResults} />
        )}
      </div>
    </div>
  );
}

function TestResultsView({ results }) {
  if (!results || results.length === 0) {
    return (
      <div className="text-center py-8 text-xs select-none" style={{ color: 'var(--color-text-muted)' }}>
        <p className="font-semibold">No visual test assertions defined.</p>
        <p className="text-[10px] mt-1">
          Add rules in the "Tests" tab of the request workspace before sending.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {results.map((res, idx) => (
        <div 
          key={idx}
          className="flex items-start gap-2.5 p-2.5 border rounded-lg text-xs"
          style={{ 
            borderColor: res.passed ? '#bbf7d0' : '#fecaca', 
            background: res.passed ? '#f0fdf4' : '#fef2f2' 
          }}
        >
          {res.passed ? (
            <CheckCircle2 size={14} className="text-green-600 mt-0.5 shrink-0" />
          ) : (
            <XCircle size={14} className="text-red-600 mt-0.5 shrink-0" />
          )}

          <div className="flex-1 min-w-0">
            <div className="font-semibold flex items-center gap-1.5 flex-wrap">
              <span style={{ color: res.passed ? '#15803d' : '#b91c1c' }}>
                {res.passed ? 'PASS' : 'FAIL'}
              </span>
              <span className="uppercase text-[9px] px-1.5 py-0.5 rounded font-bold text-white bg-neutral-500 dark:bg-neutral-600 shrink-0">
                {res.type.replace(/_/g, ' ')}
              </span>
            </div>

            <p className="mt-1 font-mono text-[11px]" style={{ color: 'var(--color-text-primary)' }}>
              Assertion: {res.type === 'json_path_equals' && `Path: ${res.path} == ${res.value}`}
              {res.type === 'status_code' && `Status Code == ${res.value}`}
              {res.type === 'response_time' && `Response time < ${res.value} ms`}
              {res.type === 'body_contains' && `Body contains string: "${res.value}"`}
              {res.type === 'json_path_exists' && `Path exists: "${res.value}"`}
              {res.type === 'header_exists' && `Header exists: "${res.value}"`}
              {res.type === 'header_equals' && `Header: "${res.key}" == "${res.value}"`}
              {res.type === 'array_length' && `Array Length: "${res.path}" ${res.operator || '>'} ${res.value}`}
              {res.type === 'status_in_range' && `Status is between ${res.min} and ${res.max}`}
            </p>

            {res.error && (
              <p className="mt-1 font-mono text-[10px] text-red-500 flex items-center gap-1">
                <AlertCircle size={10} />
                Error: {res.error}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
