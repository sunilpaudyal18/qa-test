import { Plus, Trash2, Code } from 'lucide-react';

export default function ParamsTab({ store }) {
  const { params, setParams, url, setUrl, learningMode } = store;

  const updateParam = (i, field, value) => {
    const next = [...params];
    next[i] = { ...next[i], [field]: value };
    setParams(next);
    if (field === 'key' || field === 'value' || field === 'enabled') {
      syncParamsToUrl(next, url, setUrl);
    }
  };

  const addRow = () => setParams([...params, { enabled: true, key: '', value: '', description: '' }]);
  const removeRow = (i) => {
    const next = params.filter((_, j) => j !== i);
    setParams(next.length ? next : [{ enabled: true, key: '', value: '', description: '' }]);
    syncParamsToUrl(next, url, setUrl);
  };
  const toggleAll = (enabled) => setParams(params.map(p => ({ ...p, enabled })));

  return (
    <div className="space-y-3">
      {learningMode && (
        <div className="px-3 py-2 rounded-lg text-[11px]" style={{ background: '#eff6ff', border: '1px solid #bfdbfe', color: '#1d4ed8' }}>
          <strong>💡 Query Parameters</strong> are appended to the URL as <code className="bg-blue-100 px-1 rounded">?key=value&amp;key2=value2</code>. They filter or configure the request.
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
        {params.map((p, i) => (
          <div
            key={i}
            className="grid items-center px-3 py-1.5 gap-2 group"
            style={{
              gridTemplateColumns: '28px 1fr 1fr 1fr 32px',
              borderBottom: i < params.length - 1 ? '1px solid var(--color-border)' : 'none',
              background: p.enabled ? 'transparent' : 'var(--color-surface-alt)',
              opacity: p.enabled ? 1 : 0.5,
            }}
          >
            <input
              type="checkbox"
              checked={p.enabled}
              onChange={e => updateParam(i, 'enabled', e.target.checked)}
              className="rounded"
              style={{ accentColor: 'var(--color-primary)' }}
            />
            <input
              type="text"
              value={p.key}
              onChange={e => updateParam(i, 'key', e.target.value)}
              placeholder="key"
              className="w-full px-2 py-1 text-xs font-mono rounded focus:outline-none focus:ring-1"
              style={{ background: 'var(--color-surface-alt)', border: '1px solid transparent', color: 'var(--color-text-primary)' }}
            />
            <input
              type="text"
              value={p.value}
              onChange={e => updateParam(i, 'value', e.target.value)}
              placeholder="value"
              className="w-full px-2 py-1 text-xs font-mono rounded focus:outline-none focus:ring-1"
              style={{ background: 'var(--color-surface-alt)', border: '1px solid transparent', color: 'var(--color-text-primary)' }}
            />
            <input
              type="text"
              value={p.description}
              onChange={e => updateParam(i, 'description', e.target.value)}
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
          <Plus size={13} /> Add Parameter
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

function syncParamsToUrl(params, url, setUrl) {
  try {
    const baseUrl = url.split('?')[0];
    const enabled = params.filter(p => p.enabled && p.key.trim());
    if (!enabled.length) { setUrl(baseUrl); return; }
    const qs = enabled.map(p => `${encodeURIComponent(p.key)}=${encodeURIComponent(p.value)}`).join('&');
    setUrl(`${baseUrl}?${qs}`);
  } catch {}
}
