import { useState, useRef } from 'react';
import {
  Send, Save, Plus, Loader2, X, Copy, Zap,
  ChevronDown, Sparkles,
} from 'lucide-react';

const METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'];
const METHOD_COLORS = {
  GET: '#16A34A', POST: '#2563EB', PUT: '#D97706',
  PATCH: '#EA580C', DELETE: '#DC2626', HEAD: '#6B7280', OPTIONS: '#7C3AED',
};

export default function RequestBar({ store, onSave, toast }) {
  const { method, setMethod, url, setUrl, sending, handleSend, cancelRequest,
    activeEnv, activeEnvVars, learningMode } = store;
  const [showMethodMenu, setShowMethodMenu] = useState(false);
  const urlRef = useRef(null);

  const resolvedUrl = url.replace(/\{\{(\w+)\}\}/g, (_, k) => activeEnvVars[k] ?? `{{${k}}}`);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSend(toast);
  };

  // Highlight {{variables}} in URL display
  const urlHasVars = /\{\{[^}]+\}\}/.test(url);

  return (
    <div className="flex flex-col gap-2">
      {/* Method + URL Row */}
      <div
        className="flex items-center gap-2 p-2 rounded-xl"
        style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
        }}
      >
        {/* Method Selector */}
        <div className="relative">
          <button
            onClick={() => setShowMethodMenu(v => !v)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all"
            style={{
              background: METHOD_COLORS[method] + '20',
              color: METHOD_COLORS[method],
              border: `1.5px solid ${METHOD_COLORS[method]}40`,
              minWidth: 80,
            }}
          >
            <span className="flex-1 text-center">{method}</span>
            <ChevronDown size={12} />
          </button>
          {showMethodMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowMethodMenu(false)} />
              <div
                className="absolute top-full left-0 mt-1 z-20 rounded-xl overflow-hidden shadow-xl"
                style={{
                  background: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                  minWidth: 130,
                }}
              >
                {METHODS.map(m => (
                  <button
                    key={m}
                    onClick={() => { setMethod(m); setShowMethodMenu(false); }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold uppercase transition-colors text-left"
                    style={{
                      background: method === m ? METHOD_COLORS[m] + '15' : 'transparent',
                      color: METHOD_COLORS[m],
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = METHOD_COLORS[m] + '10'}
                    onMouseLeave={e => e.currentTarget.style.background = method === m ? METHOD_COLORS[m] + '15' : 'transparent'}
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                      style={{ background: METHOD_COLORS[m] }}
                    />
                    {m}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* URL Input */}
        <div className="flex-1 relative">
          <input
            ref={urlRef}
            type="text"
            value={url}
            onChange={e => setUrl(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="https://api.example.com/endpoint  or  {{baseUrl}}/users"
            className="w-full px-3 py-2 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 transition-all"
            style={{
              background: 'var(--color-surface-alt)',
              border: '1px solid var(--color-border)',
              color: 'var(--color-text-primary)',
              fontFamily: 'ui-monospace, monospace',
              fontSize: '13px',
            }}
            aria-label="Request URL"
          />
          {urlHasVars && (
            <div
              className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded"
              style={{ background: '#ede9fe', color: '#7c3aed' }}
            >
              <Zap size={9} />
              vars
            </div>
          )}
        </div>

        {/* Send / Cancel Button */}
        {sending ? (
          <button
            onClick={cancelRequest}
            className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold text-white transition-all"
            style={{ background: '#DC2626', minWidth: 100 }}
          >
            <X size={14} />
            Cancel
          </button>
        ) : (
          <button
            onClick={() => handleSend(toast)}
            className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-95"
            style={{ background: 'var(--color-primary)', minWidth: 100 }}
          >
            <Send size={14} />
            Send
          </button>
        )}

        {/* Save Button */}
        <button
          onClick={onSave}
          title="Save Request"
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all"
          style={{
            background: 'var(--color-surface-alt)',
            border: '1px solid var(--color-border)',
            color: 'var(--color-text-secondary)',
          }}
        >
          <Save size={14} />
          Save
        </button>
      </div>

      {/* Resolved URL Preview (when vars present) */}
      {urlHasVars && resolvedUrl !== url && (
        <div
          className="px-3 py-1.5 rounded-lg flex items-center gap-2"
          style={{ background: '#f5f3ff', border: '1px solid #e9d5ff' }}
        >
          <Zap size={11} style={{ color: '#7c3aed', flexShrink: 0 }} />
          <span className="text-[11px] font-mono truncate" style={{ color: '#6d28d9' }}>
            {resolvedUrl}
          </span>
        </div>
      )}

      {learningMode && (
        <div
          className="px-3 py-2 rounded-lg text-[11px]"
          style={{ background: '#eff6ff', border: '1px solid #bfdbfe', color: '#1d4ed8' }}
        >
          <strong>💡 HTTP Methods:</strong> GET retrieves data · POST creates · PUT/PATCH updates · DELETE removes · HEAD checks headers only
        </div>
      )}
    </div>
  );
}
