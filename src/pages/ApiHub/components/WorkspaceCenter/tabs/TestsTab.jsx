import { useState } from 'react';
import { Plus, Trash2, CheckCircle2, XCircle, Circle, ChevronDown } from 'lucide-react';

const ASSERTION_TYPES = [
  { id: 'status_code', label: 'Status Code Equals', fields: ['value'], placeholder: ['200'] },
  { id: 'response_time', label: 'Response Time < (ms)', fields: ['value'], placeholder: ['1000'] },
  { id: 'body_contains', label: 'Response Body Contains', fields: ['value'], placeholder: ['success'] },
  { id: 'json_path_exists', label: 'JSON Path Exists', fields: ['value'], placeholder: ['data.id'] },
  { id: 'json_path_equals', label: 'JSON Path Equals Value', fields: ['path', 'value'], placeholder: ['data.status', 'active'] },
  { id: 'header_exists', label: 'Response Header Exists', fields: ['value'], placeholder: ['content-type'] },
  { id: 'header_equals', label: 'Response Header Equals', fields: ['key', 'value'], placeholder: ['content-type', 'application/json'] },
  { id: 'status_in_range', label: 'Status Code In Range', fields: ['min', 'max'], placeholder: ['200', '299'] },
];

const PRESETS = [
  { label: '✓ 200 OK', assertion: { type: 'status_code', value: '200' } },
  { label: '✓ < 1s', assertion: { type: 'response_time', value: '1000' } },
  { label: '✓ Has content-type', assertion: { type: 'header_exists', value: 'content-type' } },
  { label: '✓ 2xx Success', assertion: { type: 'status_in_range', min: '200', max: '299' } },
];

function AssertionRow({ assertion, index, onUpdate, onDelete, result }) {
  const typeDef = ASSERTION_TYPES.find(t => t.id === assertion.type) || ASSERTION_TYPES[0];

  const StatusIcon = result == null
    ? Circle
    : result.passed ? CheckCircle2 : XCircle;
  const statusColor = result == null
    ? 'var(--color-text-muted)'
    : result.passed ? '#16A34A' : '#DC2626';

  return (
    <div
      className="flex items-start gap-3 p-3 rounded-xl group transition-all"
      style={{
        background: result?.passed === false ? '#fef2f2' : result?.passed === true ? '#f0fdf4' : 'var(--color-surface-alt)',
        border: `1px solid ${result?.passed === false ? '#fecaca' : result?.passed === true ? '#bbf7d0' : 'var(--color-border)'}`,
      }}
    >
      <StatusIcon size={16} style={{ color: statusColor, marginTop: 2, flexShrink: 0 }} />
      <div className="flex-1 space-y-2">
        {/* Type selector */}
        <select
          value={assertion.type}
          onChange={e => onUpdate(index, { ...assertion, type: e.target.value, value: '', path: '', key: '', min: '', max: '' })}
          className="w-full px-2 py-1.5 text-xs rounded-lg focus:outline-none"
          style={{
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            color: 'var(--color-text-primary)',
          }}
        >
          {ASSERTION_TYPES.map(t => (
            <option key={t.id} value={t.id}>{t.label}</option>
          ))}
        </select>

        {/* Dynamic fields */}
        <div className="flex gap-2 flex-wrap">
          {typeDef.fields.map((field, fi) => (
            <input
              key={field}
              type="text"
              value={assertion[field] || ''}
              onChange={e => onUpdate(index, { ...assertion, [field]: e.target.value })}
              placeholder={typeDef.placeholder[fi]}
              className="flex-1 px-2 py-1.5 text-xs font-mono rounded-lg focus:outline-none min-w-0"
              style={{
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                color: 'var(--color-text-primary)',
                minWidth: 80,
              }}
            />
          ))}
        </div>

        {/* Error message */}
        {result?.error && (
          <p className="text-[10px]" style={{ color: '#DC2626' }}>Error: {result.error}</p>
        )}
      </div>

      <button
        onClick={() => onDelete(index)}
        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded flex-shrink-0"
        style={{ color: '#DC2626' }}
      >
        <Trash2 size={13} />
      </button>
    </div>
  );
}

export default function TestsTab({ store }) {
  const { assertions, setAssertions, testResults, learningMode } = store;

  const addAssertion = (preset) => {
    setAssertions(prev => [
      ...prev,
      preset || { type: 'status_code', value: '200' },
    ]);
  };

  const updateAssertion = (i, updated) => {
    setAssertions(prev => prev.map((a, idx) => idx === i ? updated : a));
  };

  const deleteAssertion = (i) => {
    setAssertions(prev => prev.filter((_, idx) => idx !== i));
  };

  const passed = testResults.filter(r => r.passed).length;
  const failed = testResults.filter(r => !r.passed).length;

  return (
    <div className="space-y-4">
      {learningMode && (
        <div className="px-3 py-2 rounded-lg text-[11px]" style={{ background: '#eff6ff', border: '1px solid #bfdbfe', color: '#1d4ed8' }}>
          <strong>💡 Tests</strong> are assertions that automatically validate your API response. They run every time you send a request. Add rules like "Status Code = 200" to verify the API behaves correctly.
        </div>
      )}

      {/* Test Summary (if results exist) */}
      {testResults.length > 0 && (
        <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'var(--color-surface-alt)', border: '1px solid var(--color-border)' }}>
          <span className="text-xs font-semibold" style={{ color: 'var(--color-text-secondary)' }}>Last Run:</span>
          <span className="flex items-center gap-1 text-xs font-semibold" style={{ color: '#16A34A' }}>
            <CheckCircle2 size={13} /> {passed} passed
          </span>
          {failed > 0 && (
            <span className="flex items-center gap-1 text-xs font-semibold" style={{ color: '#DC2626' }}>
              <XCircle size={13} /> {failed} failed
            </span>
          )}
        </div>
      )}

      {/* Quick Presets */}
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--color-text-muted)' }}>
          Quick Add
        </p>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((p, i) => (
            <button
              key={i}
              onClick={() => addAssertion(p.assertion)}
              className="text-[11px] font-medium px-2.5 py-1.5 rounded-lg transition-all"
              style={{
                background: 'var(--color-surface-alt)',
                border: '1px solid var(--color-border)',
                color: 'var(--color-text-secondary)',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--color-primary)'; e.currentTarget.style.color = 'var(--color-primary)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.color = 'var(--color-text-secondary)'; }}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Assertions List */}
      {assertions.length > 0 && (
        <div className="space-y-2">
          {assertions.map((a, i) => (
            <AssertionRow
              key={i}
              assertion={a}
              index={i}
              onUpdate={updateAssertion}
              onDelete={deleteAssertion}
              result={testResults[i] ?? null}
            />
          ))}
        </div>
      )}

      {assertions.length === 0 && (
        <div className="flex flex-col items-center py-8 gap-3" style={{ color: 'var(--color-text-muted)' }}>
          <CheckCircle2 size={32} />
          <p className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>No assertions yet</p>
          <p className="text-xs text-center max-w-xs">
            Add assertions to automatically validate your API responses without writing code.
          </p>
        </div>
      )}

      {/* Add Custom Button */}
      <button
        onClick={() => addAssertion()}
        className="flex items-center gap-1.5 text-xs font-medium transition-colors"
        style={{ color: 'var(--color-primary)' }}
      >
        <Plus size={13} /> Add Assertion
      </button>
    </div>
  );
}
