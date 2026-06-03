import { Plus, Trash2, Info } from 'lucide-react';
import { useState } from 'react';

const COMMON_HEADERS = [
  'Accept', 'Accept-Encoding', 'Accept-Language', 'Authorization',
  'Cache-Control', 'Connection', 'Content-Length', 'Content-Type',
  'Cookie', 'Host', 'Origin', 'Referer', 'User-Agent',
  'X-Requested-With', 'X-API-Key', 'X-Forwarded-For'
];

export default function HeadersTab({ store }) {
  const { headers, setHeaders, learningMode } = store;
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(null);

  const updateHeader = (i, field, value) => {
    const next = [...headers];
    next[i] = { ...next[i], [field]: value };
    setHeaders(next);
  };

  const addRow = () => setHeaders([...headers, { enabled: true, key: '', value: '', description: '' }]);
  
  const removeRow = (i) => {
    const next = headers.filter((_, j) => j !== i);
    setHeaders(next.length ? next : [{ enabled: true, key: '', value: '' }]);
  };

  const toggleAll = (enabled) => setHeaders(headers.map(h => ({ ...h, enabled })));

  return (
    <div className="space-y-3">
      {learningMode && (
        <div className="px-3 py-2 rounded-lg text-[11px]" style={{ background: '#eff6ff', border: '1px solid #bfdbfe', color: '#1d4ed8' }}>
          <strong>💡 Request Headers</strong> let the client pass metadata about the request to the server, such as <code className="bg-blue-100 px-1 rounded">Content-Type</code> or API Keys.
        </div>
      )}
      <div className="rounded-lg overflow-hidden" style={{ border: '1px solid var(--color-border)' }}>
        {/* Table Header */}
        <div
          className="grid text-[10px] font-semibold uppercase tracking-wider px-3 py-2"
          style={{ gridTemplateColumns: '28px 1fr 1fr 1fr 32px', background: 'var(--color-surface-alt)', color: 'var(--color-text-muted)', borderBottom: '1px solid var(--color-border)' }}
        >
          <span />
          <span>Key</span>
          <span>Value</span>
          <span>Description</span>
          <span />
        </div>
        {/* Rows */}
        {headers.map((h, i) => (
          <div
            key={i}
            className="grid items-center px-3 py-1.5 gap-2 group relative"
            style={{
              gridTemplateColumns: '28px 1fr 1fr 1fr 32px',
              borderBottom: i < headers.length - 1 ? '1px solid var(--color-border)' : 'none',
              background: h.enabled ? 'transparent' : 'var(--color-surface-alt)',
              opacity: h.enabled ? 1 : 0.5,
            }}
          >
            <input
              type="checkbox"
              checked={h.enabled}
              onChange={e => updateHeader(i, 'enabled', e.target.checked)}
              className="rounded"
              style={{ accentColor: 'var(--color-primary)' }}
            />
            
            {/* Key Input with suggestions */}
            <div className="relative">
              <input
                type="text"
                value={h.key}
                onChange={e => {
                  updateHeader(i, 'key', e.target.value);
                  setActiveSuggestionIndex(i);
                }}
                onFocus={() => setActiveSuggestionIndex(i)}
                onBlur={() => setTimeout(() => setActiveSuggestionIndex(null), 200)}
                placeholder="key"
                className="w-full px-2 py-1 text-xs font-mono rounded focus:outline-none focus:ring-1"
                style={{ background: 'var(--color-surface-alt)', border: '1px solid transparent', color: 'var(--color-text-primary)' }}
              />
              {activeSuggestionIndex === i && h.key && (
                <div
                  className="absolute z-10 w-full mt-1 max-h-40 overflow-y-auto rounded shadow-lg border text-xs"
                  style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
                >
                  {COMMON_HEADERS.filter(opt => opt.toLowerCase().includes(h.key.toLowerCase()))
                    .map(opt => (
                      <div
                        key={opt}
                        onMouseDown={() => updateHeader(i, 'key', opt)}
                        className="px-2 py-1 cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-800"
                        style={{ color: 'var(--color-text-primary)' }}
                      >
                        {opt}
                      </div>
                    ))}
                </div>
              )}
            </div>

            <input
              type="text"
              value={h.value}
              onChange={e => updateHeader(i, 'value', e.target.value)}
              placeholder="value"
              className="w-full px-2 py-1 text-xs font-mono rounded focus:outline-none focus:ring-1"
              style={{ background: 'var(--color-surface-alt)', border: '1px solid transparent', color: 'var(--color-text-primary)' }}
            />
            <input
              type="text"
              value={h.description || ''}
              onChange={e => updateHeader(i, 'description', e.target.value)}
              placeholder="description"
              className="w-full px-2 py-1 text-xs rounded focus:outline-none focus:ring-1"
              style={{ background: 'var(--color-surface-alt)', border: '1px solid transparent', color: 'var(--color-text-muted)' }}
            />
            <button
              onClick={() => removeRow(i)}
              className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded"
              style={{ color: '#DC2626' }}
            >
              <Trash2 size={12} />
            </button>
          </div>
        ))}
      </div>
      {/* Actions */}
      <div className="flex items-center gap-3">
        <button
          onClick={addRow}
          className="flex items-center gap-1.5 text-xs font-medium transition-colors"
          style={{ color: 'var(--color-primary)' }}
        >
          <Plus size={13} /> Add Header
        </button>
        <button
          onClick={() => toggleAll(true)}
          className="text-xs transition-colors"
          style={{ color: 'var(--color-text-muted)' }}
        >
          Enable All
        </button>
        <button
          onClick={() => toggleAll(false)}
          className="text-xs transition-colors"
          style={{ color: 'var(--color-text-muted)' }}
        >
          Disable All
        </button>
      </div>
    </div>
  );
}
