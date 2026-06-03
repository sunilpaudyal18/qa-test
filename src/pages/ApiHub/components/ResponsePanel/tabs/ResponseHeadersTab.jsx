import { useState } from 'react';
import { Search, Copy, Check } from 'lucide-react';

export default function ResponseHeadersTab({ store }) {
  const { response } = store;
  const [search, setSearch] = useState('');
  const [copiedKey, setCopiedKey] = useState(null);

  if (!response) return null;

  const headers = response.headers || {};
  const headerKeys = Object.keys(headers).filter(k => 
    k.toLowerCase().includes(search.toLowerCase()) || 
    headers[k].toLowerCase().includes(search.toLowerCase())
  );

  const handleCopy = (key, val) => {
    navigator.clipboard.writeText(val);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1500);
  };

  return (
    <div className="space-y-3">
      {/* Search Bar */}
      <div className="relative w-64">
        <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-text-muted)' }} />
        <input
          type="text"
          placeholder="Filter headers..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-8 pr-3 py-1 text-xs rounded-lg focus:outline-none"
          style={{ background: 'var(--color-surface-alt)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}
        />
      </div>

      {headerKeys.length === 0 ? (
        <div className="text-center py-6 text-xs" style={{ color: 'var(--color-text-muted)' }}>
          No headers match your search.
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden" style={{ borderColor: 'var(--color-border)' }}>
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr style={{ background: 'var(--color-surface-alt)', borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-muted)' }}>
                <th className="p-2 font-semibold">Header Key</th>
                <th className="p-2 font-semibold">Value</th>
                <th className="w-12" />
              </tr>
            </thead>
            <tbody>
              {headerKeys.map(k => (
                <tr key={k} className="hover:bg-neutral-50 dark:hover:bg-neutral-900 border-b last:border-0" style={{ borderColor: 'var(--color-border)' }}>
                  <td className="p-2 font-mono font-semibold" style={{ color: 'var(--color-text-secondary)' }}>{k}</td>
                  <td className="p-2 font-mono break-all" style={{ color: 'var(--color-text-primary)' }}>{headers[k]}</td>
                  <td className="p-2 text-right">
                    <button
                      onClick={() => handleCopy(k, headers[k])}
                      className="p-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                      title="Copy header value"
                    >
                      {copiedKey === k ? (
                        <Check size={11} className="text-green-600" />
                      ) : (
                        <Copy size={11} style={{ color: 'var(--color-text-muted)' }} />
                      )}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
