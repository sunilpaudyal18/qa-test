import { Copy, Download, Key, Check } from 'lucide-react';
import { useState } from 'react';

export default function ResponseStatusBar({ store, onExtractVarClick }) {
  const { response, responseTime, responseSize, formatSize, formatTime } = store;
  const [copied, setCopied] = useState(false);

  if (!response) return null;

  const { status, statusText, body } = response;

  const getStatusColor = (code) => {
    if (code >= 200 && code < 300) return { bg: '#dcfce7', text: '#16a34a', border: '#bbf7d0' };
    if (code >= 300 && code < 400) return { bg: '#fef9c3', text: '#ca8a04', border: '#fef08a' };
    return { bg: '#fee2e2', text: '#dc2626', border: '#fecaca' };
  };

  const statusColors = getStatusColor(status);

  const handleCopy = () => {
    navigator.clipboard.writeText(body || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    try {
      const blob = new Blob([body || ''], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `response_${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {}
  };

  return (
    <div
      className="flex items-center justify-between p-3 border-b text-xs flex-wrap gap-2 bg-neutral-50 dark:bg-neutral-900"
      style={{ borderColor: 'var(--color-border)' }}
    >
      {/* Badges Column */}
      <div className="flex items-center gap-3">
        {/* Status */}
        <div
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full font-semibold border text-[11px]"
          style={{
            background: statusColors.bg,
            color: statusColors.text,
            borderColor: statusColors.border,
          }}
        >
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: statusColors.text }} />
          {status} {statusText}
        </div>

        {/* Time */}
        <div className="flex flex-col">
          <span className="text-[9px] uppercase tracking-wider font-semibold" style={{ color: 'var(--color-text-muted)' }}>Time</span>
          <span className="font-mono font-medium" style={{ color: 'var(--color-text-primary)' }}>{formatTime(responseTime)}</span>
        </div>

        {/* Size */}
        <div className="flex flex-col">
          <span className="text-[9px] uppercase tracking-wider font-semibold" style={{ color: 'var(--color-text-muted)' }}>Size</span>
          <span className="font-mono font-medium" style={{ color: 'var(--color-text-primary)' }}>{formatSize(responseSize)}</span>
        </div>
      </div>

      {/* Action Buttons Column */}
      <div className="flex items-center gap-1.5">
        {status > 0 && response.parsedJson && (
          <button
            onClick={onExtractVarClick}
            className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold border rounded-lg transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-800"
            style={{
              color: 'var(--color-primary)',
              borderColor: 'var(--color-primary)30',
            }}
          >
            <Key size={11} />
            Extract Var
          </button>
        )}

        <button
          onClick={handleCopy}
          className="flex items-center gap-1 px-2 py-1 text-[11px] rounded transition-colors hover:bg-neutral-150"
          style={{ color: 'var(--color-text-secondary)' }}
          title="Copy body"
        >
          {copied ? <Check size={11} className="text-green-600" /> : <Copy size={11} />}
          {copied ? 'Copied' : 'Copy'}
        </button>

        <button
          onClick={handleDownload}
          className="flex items-center gap-1 px-2 py-1 text-[11px] rounded transition-colors hover:bg-neutral-150"
          style={{ color: 'var(--color-text-secondary)' }}
          title="Download body"
        >
          <Download size={11} />
          Save
        </button>
      </div>
    </div>
  );
}
