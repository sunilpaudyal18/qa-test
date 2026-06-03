import { useState } from 'react';
import { 
  X, Plus, Trash2, Download, Upload, Check, AlertTriangle 
} from 'lucide-react';

const ENVS = ['DEV', 'QA', 'UAT', 'PROD'];

export default function EnvironmentManager({ isOpen, onClose, store, toast }) {
  const { environments, setEnvironments, updateEnvVar, deleteEnvVar } = store;
  const [selectedEnv, setSelectedEnv] = useState('DEV');
  const [importText, setImportText] = useState('');
  const [showImport, setShowImport] = useState(false);

  if (!isOpen) return null;

  const currentEnvVars = environments[selectedEnv] || {};
  const varKeys = Object.keys(currentEnvVars);

  const handleUpdateKey = (oldKey, newKey) => {
    if (oldKey === newKey) return;
    if (!newKey.trim()) return;
    if (currentEnvVars[newKey] !== undefined) {
      toast?.warning(`Variable name "${newKey}" already exists.`);
      return;
    }
    const val = currentEnvVars[oldKey];
    const updatedEnv = { ...currentEnvVars };
    delete updatedEnv[oldKey];
    updatedEnv[newKey] = val;

    setEnvironments(prev => ({
      ...prev,
      [selectedEnv]: updatedEnv
    }));
  };

  const handleUpdateVal = (key, val) => {
    updateEnvVar(selectedEnv, key, val);
  };

  const handleAddVar = () => {
    let name = 'variable_name';
    let suffix = 1;
    while (currentEnvVars[`${name}_${suffix}`] !== undefined) {
      suffix++;
    }
    updateEnvVar(selectedEnv, `${name}_${suffix}`, '');
  };

  const handleExport = () => {
    try {
      const dataStr = JSON.stringify(currentEnvVars, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `env_${selectedEnv.toLowerCase()}_variables.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast?.success('Variables exported.');
    } catch {
      toast?.error('Failed to export variables.');
    }
  };

  const handleImport = () => {
    if (!importText.trim()) return;
    try {
      const parsed = JSON.parse(importText);
      if (typeof parsed !== 'object' || Array.isArray(parsed)) {
        toast?.error('Invalid format. Must be a key-value JSON object.');
        return;
      }
      
      // Merge imported
      setEnvironments(prev => ({
        ...prev,
        [selectedEnv]: {
          ...prev[selectedEnv],
          ...parsed
        }
      }));
      
      setImportText('');
      setShowImport(false);
      toast?.success('Variables imported successfully.');
    } catch (e) {
      toast?.error('Failed to parse JSON: ' + e.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center select-none">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-xs" onClick={onClose} />
      
      {/* Modal Box */}
      <div 
        className="relative w-full max-w-2xl rounded-xl shadow-2xl flex flex-col max-h-[85vh]"
        style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
      >
        {/* Header */}
        <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--color-border)' }}>
          <div>
            <h2 className="text-sm font-bold text-neutral-800 dark:text-neutral-100">Environment Variables Manager</h2>
            <p className="text-[10px] text-neutral-400">Manage environment-specific keys resolved inside double curly brackets.</p>
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
            <X size={16} style={{ color: 'var(--color-text-muted)' }} />
          </button>
        </div>

        {/* Top bar: Env selector + Action Buttons */}
        <div 
          className="flex items-center justify-between px-4 py-2 border-b bg-neutral-50 dark:bg-neutral-900" 
          style={{ borderColor: 'var(--color-border)' }}
        >
          {/* Environments Switcher */}
          <div className="flex gap-1">
            {ENVS.map(env => (
              <button
                key={env}
                onClick={() => { setSelectedEnv(env); setShowImport(false); }}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                style={{
                  background: selectedEnv === env ? 'var(--color-primary)' : 'transparent',
                  color: selectedEnv === env ? '#fff' : 'var(--color-text-secondary)',
                }}
              >
                {env}
              </button>
            ))}
          </div>

          {/* Import/Export buttons */}
          <div className="flex gap-1.5">
            <button
              onClick={() => setShowImport(!showImport)}
              className="flex items-center gap-1 px-2.5 py-1 text-xs border rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              style={{ color: 'var(--color-text-secondary)', borderColor: 'var(--color-border)' }}
            >
              <Upload size={12} />
              Import JSON
            </button>
            <button
              onClick={handleExport}
              className="flex items-center gap-1 px-2.5 py-1 text-xs border rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              style={{ color: 'var(--color-text-secondary)', borderColor: 'var(--color-border)' }}
            >
              <Download size={12} />
              Export
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {showImport ? (
            /* Import Text Box */
            <div className="space-y-3 p-3 border rounded-lg" style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface-alt)' }}>
              <div className="text-xs font-semibold" style={{ color: 'var(--color-text-primary)' }}>Import variables into {selectedEnv}</div>
              <textarea
                value={importText}
                onChange={e => setImportText(e.target.value)}
                placeholder='{\n  "baseUrl": "https://api.example.com",\n  "apiKey": "xyz123"\n}'
                rows={5}
                className="w-full p-2.5 text-xs font-mono rounded border focus:outline-none focus:ring-1"
                style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
              />
              <div className="flex justify-end gap-2">
                <button 
                  onClick={() => setShowImport(false)}
                  className="px-3 py-1.5 rounded text-xs border"
                  style={{ color: 'var(--color-text-muted)', borderColor: 'var(--color-border)' }}
                >
                  Cancel
                </button>
                <button 
                  onClick={handleImport}
                  className="px-3 py-1.5 rounded text-xs text-white"
                  style={{ background: 'var(--color-primary)' }}
                >
                  Import Key-Values
                </button>
              </div>
            </div>
          ) : (
            /* Variable Editing List */
            <div className="space-y-2">
              <div className="rounded-lg overflow-hidden border" style={{ borderColor: 'var(--color-border)' }}>
                <div 
                  className="grid px-3 py-2 text-[10px] uppercase font-bold tracking-wider"
                  style={{ gridTemplateColumns: '1fr 1fr 32px', background: 'var(--color-surface-alt)', color: 'var(--color-text-muted)' }}
                >
                  <span>Variable Key</span>
                  <span>Value</span>
                  <span />
                </div>

                {varKeys.length === 0 ? (
                  <div className="text-center py-8 text-xs" style={{ color: 'var(--color-text-muted)' }}>
                    No variables defined for {selectedEnv} environment.
                  </div>
                ) : (
                  varKeys.map(k => (
                    <div 
                      key={k}
                      className="grid items-center px-3 py-1.5 gap-2 border-b last:border-none group"
                      style={{ gridTemplateColumns: '1fr 1fr 32px', borderColor: 'var(--color-border)' }}
                    >
                      <input
                        type="text"
                        defaultValue={k}
                        onBlur={e => handleUpdateKey(k, e.target.value)}
                        placeholder="Key"
                        className="w-full px-2 py-1 text-xs font-mono rounded border focus:outline-none focus:ring-1 focus:ring-indigo-400"
                        style={{ background: 'var(--color-surface-alt)', border: '1px solid transparent', color: 'var(--color-text-primary)' }}
                      />
                      <input
                        type="text"
                        value={currentEnvVars[k]}
                        onChange={e => handleUpdateVal(k, e.target.value)}
                        placeholder="Value"
                        className="w-full px-2 py-1 text-xs font-mono rounded border focus:outline-none focus:ring-1 focus:ring-indigo-400"
                        style={{ background: 'var(--color-surface-alt)', border: '1px solid transparent', color: 'var(--color-text-primary)' }}
                      />
                      <button
                        onClick={() => deleteEnvVar(selectedEnv, k)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-red-50 dark:hover:bg-red-950/20"
                        style={{ color: '#DC2626' }}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))
                )}
              </div>

              <button
                onClick={handleAddVar}
                className="flex items-center gap-1 text-xs font-semibold py-1.5 transition-colors"
                style={{ color: 'var(--color-primary)' }}
              >
                <Plus size={13} />
                Add Variable
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div 
          className="p-4 border-t flex justify-end bg-neutral-50 dark:bg-neutral-900 rounded-b-xl"
          style={{ borderColor: 'var(--color-border)' }}
        >
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg text-xs font-semibold text-white"
            style={{ background: 'var(--color-primary)' }}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
