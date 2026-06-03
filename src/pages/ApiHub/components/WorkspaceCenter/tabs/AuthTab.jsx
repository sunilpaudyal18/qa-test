import { Eye, EyeOff, Info } from 'lucide-react';
import { useState } from 'react';

const AUTH_TYPES = [
  { id: 'none', label: 'No Auth' },
  { id: 'bearer', label: 'Bearer Token' },
  { id: 'basic', label: 'Basic Auth' },
  { id: 'apikey', label: 'API Key' },
  { id: 'jwt', label: 'JWT Bearer' },
];

export default function AuthTab({ store }) {
  const { auth, setAuth, learningMode } = store;
  const [showPassword, setShowPassword] = useState(false);

  const setAuthType = (type) => {
    setAuth({ ...auth, type });
  };

  const updateField = (field, val) => {
    setAuth({ ...auth, [field]: val });
  };

  const decodeJWT = (token) => {
    if (!token) return null;
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return { error: 'Invalid JWT structure (must be 3 parts).' };
      const payloadBase64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      const decodedPayload = decodeURIComponent(
        atob(payloadBase64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(decodedPayload);
    } catch (e) {
      return { error: 'Failed to decode: ' + e.message };
    }
  };

  return (
    <div className="space-y-4">
      {learningMode && (
        <div className="px-3 py-2 rounded-lg text-[11px]" style={{ background: '#eff6ff', border: '1px solid #bfdbfe', color: '#1d4ed8' }}>
          <strong>💡 Authentication</strong> proves your identity to the server. Choose the appropriate protocol required by your API resource.
        </div>
      )}

      <div className="flex gap-4">
        {/* Left Side: Type Selector */}
        <div className="w-1/3 flex flex-col gap-1 border-r pr-4" style={{ borderColor: 'var(--color-border)' }}>
          <span className="text-[10px] uppercase font-semibold tracking-wider mb-1" style={{ color: 'var(--color-text-muted)' }}>Type</span>
          {AUTH_TYPES.map((t) => (
            <button
              key={t.id}
              onClick={() => setAuthType(t.id)}
              className="text-left px-3 py-2 rounded-lg text-xs font-medium transition-all"
              style={{
                background: auth.type === t.id ? 'var(--color-surface-alt)' : 'transparent',
                color: auth.type === t.id ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                borderLeft: auth.type === t.id ? '3px solid var(--color-primary)' : '3px solid transparent',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Right Side: Form Inputs */}
        <div className="flex-1 min-w-0 space-y-3">
          {auth.type === 'none' && (
            <div className="flex flex-col items-center justify-center h-full text-center py-6" style={{ color: 'var(--color-text-muted)' }}>
              <Info size={24} className="mb-2" />
              <p className="text-xs">No Authentication is configured for this request.</p>
              <p className="text-[10px]">The Authorization header will not be included.</p>
            </div>
          )}

          {auth.type === 'bearer' && (
            <div className="space-y-2">
              <label className="text-[11px] font-semibold" style={{ color: 'var(--color-text-secondary)' }}>Token</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={auth.bearerToken || ''}
                  onChange={(e) => updateField('bearerToken', e.target.value)}
                  placeholder="Enter Bearer Token..."
                  className="w-full pl-3 pr-10 py-1.5 text-xs font-mono rounded-lg focus:outline-none focus:ring-1"
                  style={{ background: 'var(--color-surface-alt)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}
                />
                <button
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  style={{ color: 'var(--color-text-muted)' }}
                >
                  {showPassword ? <EyeOff size={13} /> : <Eye size={13} />}
                </button>
              </div>
              <p className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>
                Prefixes token automatically with <code className="bg-neutral-100 dark:bg-neutral-800 px-1 py-0.5 rounded">Bearer</code> in headers.
              </p>
            </div>
          )}

          {auth.type === 'basic' && (
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold" style={{ color: 'var(--color-text-secondary)' }}>Username</label>
                <input
                  type="text"
                  value={auth.basicUsername || ''}
                  onChange={(e) => updateField('basicUsername', e.target.value)}
                  placeholder="Username"
                  className="w-full px-3 py-1.5 text-xs rounded-lg focus:outline-none focus:ring-1"
                  style={{ background: 'var(--color-surface-alt)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-semibold" style={{ color: 'var(--color-text-secondary)' }}>Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={auth.basicPassword || ''}
                    onChange={(e) => updateField('basicPassword', e.target.value)}
                    placeholder="Password"
                    className="w-full pl-3 pr-10 py-1.5 text-xs rounded-lg focus:outline-none focus:ring-1"
                    style={{ background: 'var(--color-surface-alt)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}
                  />
                  <button
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                    style={{ color: 'var(--color-text-muted)' }}
                  >
                    {showPassword ? <EyeOff size={13} /> : <Eye size={13} />}
                  </button>
                </div>
              </div>
              <p className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>
                Combines username/password and base64 encodes them as <code className="bg-neutral-100 dark:bg-neutral-800 px-1 py-0.5 rounded">Basic credentials</code>.
              </p>
            </div>
          )}

          {auth.type === 'apikey' && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold" style={{ color: 'var(--color-text-secondary)' }}>Key Name</label>
                  <input
                    type="text"
                    value={auth.apiKeyName || ''}
                    onChange={(e) => updateField('apiKeyName', e.target.value)}
                    placeholder="e.g. X-API-Key"
                    className="w-full px-3 py-1.5 text-xs font-mono rounded-lg focus:outline-none focus:ring-1"
                    style={{ background: 'var(--color-surface-alt)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold" style={{ color: 'var(--color-text-secondary)' }}>Add to</label>
                  <select
                    value={auth.apiKeyIn || 'header'}
                    onChange={(e) => updateField('apiKeyIn', e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-lg focus:outline-none focus:ring-1"
                    style={{ background: 'var(--color-surface-alt)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}
                  >
                    <option value="header">Header</option>
                    <option value="query">Query Params</option>
                  </select>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-semibold" style={{ color: 'var(--color-text-secondary)' }}>Key Value</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={auth.apiKeyValue || ''}
                    onChange={(e) => updateField('apiKeyValue', e.target.value)}
                    placeholder="Enter Key Value..."
                    className="w-full pl-3 pr-10 py-1.5 text-xs font-mono rounded-lg focus:outline-none focus:ring-1"
                    style={{ background: 'var(--color-surface-alt)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}
                  />
                  <button
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                    style={{ color: 'var(--color-text-muted)' }}
                  >
                    {showPassword ? <EyeOff size={13} /> : <Eye size={13} />}
                  </button>
                </div>
              </div>
            </div>
          )}

          {auth.type === 'jwt' && (
            <div className="space-y-2">
              <label className="text-[11px] font-semibold" style={{ color: 'var(--color-text-secondary)' }}>JWT Token</label>
              <textarea
                value={auth.jwtToken || ''}
                onChange={(e) => updateField('jwtToken', e.target.value)}
                placeholder="Paste your JSON Web Token..."
                rows={3}
                className="w-full px-3 py-1.5 text-xs font-mono rounded-lg focus:outline-none focus:ring-1 resize-y"
                style={{ background: 'var(--color-surface-alt)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}
              />

              {auth.jwtToken && (
                <div className="rounded-lg p-2.5 text-[11px] border leading-normal" style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
                  <div className="font-semibold mb-1" style={{ color: 'var(--color-primary)' }}>Decoded Payload</div>
                  {decodeJWT(auth.jwtToken)?.error ? (
                    <span className="text-red-500 font-mono">{decodeJWT(auth.jwtToken).error}</span>
                  ) : (
                    <pre className="font-mono overflow-auto max-h-24" style={{ color: 'var(--color-text-primary)' }}>
                      {JSON.stringify(decodeJWT(auth.jwtToken), null, 2)}
                    </pre>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
