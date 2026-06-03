import { useState } from 'react';
import { 
  X, Plus, Trash2, Power, PowerOff, ShieldCheck, 
  HelpCircle, Settings, Edit3 
} from 'lucide-react';

const METHODS = ['GET', 'POST', 'PUT', 'DELETE'];

export default function MockServerPanel({ isOpen, onClose, store, toast }) {
  const { mocks, setMocks } = store;
  const [editingId, setEditingId] = useState(null);
  
  if (!isOpen) return null;

  const handleAddMock = () => {
    const id = `mock_${Date.now()}`;
    const newMock = {
      id,
      method: 'GET',
      path: '/api/v1/users',
      status: 200,
      body: '{\n  "success": true,\n  "data": []\n}',
      enabled: true,
    };
    setMocks([...mocks, newMock]);
    setEditingId(id);
  };

  const handleUpdateField = (id, field, val) => {
    setMocks(prev => prev.map(m => m.id === id ? { ...m, [field]: val } : m));
  };

  const handleDeleteMock = (id) => {
    setMocks(prev => prev.filter(m => m.id !== id));
    if (editingId === id) setEditingId(null);
  };

  const toggleMock = (id) => {
    setMocks(prev => prev.map(m => m.id === id ? { ...m, enabled: !m.enabled } : m));
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
          <div className="flex items-center gap-2">
            <Settings className="text-orange-500" size={16} />
            <h2 className="text-sm font-bold text-neutral-800 dark:text-neutral-100">Local Mock Server Endpoints</h2>
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
            <X size={16} style={{ color: 'var(--color-text-muted)' }} />
          </button>
        </div>

        {/* Info Box */}
        <div className="mx-4 mt-4 p-2.5 rounded-lg border text-[11px] leading-relaxed flex flex-col gap-0.5"
             style={{ background: 'var(--color-surface-alt)', borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' }}>
          <div className="font-semibold text-neutral-600 dark:text-neutral-350 flex items-center gap-1">
            <ShieldCheck size={12} className="text-green-600" />
            Mock Interceptor Active
          </div>
          <p>
            When active, requests matching the mock method and endpoint path suffix will automatically resolve using the mock values defined below, bypassing real network servers.
          </p>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 flex gap-4 min-h-[300px]">
          {/* Left panel: list of mocks */}
          <div className="w-1/2 border-r pr-4 space-y-2 flex flex-col justify-between" style={{ borderColor: 'var(--color-border)' }}>
            <div className="space-y-1.5 overflow-y-auto max-h-[40vh]">
              {mocks.length === 0 ? (
                <div className="text-center py-8 text-xs text-neutral-400">
                  No mock endpoints defined.
                </div>
              ) : (
                mocks.map(m => (
                  <div 
                    key={m.id}
                    onClick={() => setEditingId(m.id)}
                    className="flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-all border"
                    style={{
                      background: editingId === m.id ? 'var(--color-surface-alt)' : 'transparent',
                      borderColor: editingId === m.id ? 'var(--color-primary)' : 'var(--color-border)',
                      opacity: m.enabled ? 1 : 0.6
                    }}
                  >
                    {/* Method badge */}
                    <span 
                      className="text-[9px] font-bold px-1.5 py-0.5 rounded text-white shrink-0 font-mono"
                      style={{ background: m.method === 'GET' ? '#16a34a' : m.method === 'POST' ? '#2563eb' : '#ea580c' }}
                    >
                      {m.method}
                    </span>
                    {/* Path */}
                    <span className="text-xs truncate flex-1 font-mono font-medium" style={{ color: 'var(--color-text-primary)' }}>
                      {m.path}
                    </span>
                    {/* Status Badge */}
                    <span className="text-[10px] font-semibold text-neutral-500 font-mono shrink-0">
                      {m.status}
                    </span>
                    {/* Enable toggle */}
                    <button 
                      onClick={(e) => { e.stopPropagation(); toggleMock(m.id); }}
                      className="p-1 rounded transition-colors hover:bg-neutral-200 dark:hover:bg-neutral-800"
                      title={m.enabled ? 'Disable Mock' : 'Enable Mock'}
                    >
                      {m.enabled ? (
                        <Power size={11} className="text-green-600" />
                      ) : (
                        <PowerOff size={11} className="text-neutral-400" />
                      )}
                    </button>
                    {/* Delete */}
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleDeleteMock(m.id); }}
                      className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-950/20 text-red-600"
                    >
                      <Trash2 size={11} />
                    </button>
                  </div>
                ))
              )}
            </div>
            
            <button 
              onClick={handleAddMock}
              className="w-full mt-3 py-1.5 flex items-center justify-center gap-1 text-xs font-semibold rounded-lg border hover:bg-neutral-100 dark:hover:bg-neutral-850 transition-colors"
              style={{ color: 'var(--color-primary)', borderColor: 'var(--color-primary)40' }}
            >
              <Plus size={13} />
              Add Mock Endpoint
            </button>
          </div>

          {/* Right panel: editing view */}
          <div className="flex-1 space-y-3 min-w-0">
            {editingId && mocks.find(m => m.id === editingId) ? (
              (() => {
                const mock = mocks.find(m => m.id === editingId);
                return (
                  <div className="space-y-3">
                    <div className="text-xs font-bold" style={{ color: 'var(--color-text-primary)' }}>Edit Mock Config</div>
                    
                    {/* Method + Path */}
                    <div className="grid grid-cols-3 gap-2">
                      <div className="space-y-1">
                        <label className="text-[10px] font-semibold" style={{ color: 'var(--color-text-muted)' }}>Verb</label>
                        <select
                          value={mock.method}
                          onChange={e => handleUpdateField(mock.id, 'method', e.target.value)}
                          className="w-full px-2 py-1.5 text-xs rounded border focus:outline-none focus:ring-1"
                          style={{ background: 'var(--color-surface-alt)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
                        >
                          {METHODS.map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                      </div>
                      <div className="col-span-2 space-y-1">
                        <label className="text-[10px] font-semibold" style={{ color: 'var(--color-text-muted)' }}>Path Suffix</label>
                        <input
                          type="text"
                          value={mock.path}
                          onChange={e => handleUpdateField(mock.id, 'path', e.target.value)}
                          placeholder="/api/users"
                          className="w-full px-2.5 py-1.5 text-xs font-mono rounded border focus:outline-none focus:ring-1"
                          style={{ background: 'var(--color-surface-alt)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
                        />
                      </div>
                    </div>

                    {/* Status Code */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold" style={{ color: 'var(--color-text-muted)' }}>HTTP Response Status</label>
                      <input
                        type="number"
                        value={mock.status}
                        onChange={e => handleUpdateField(mock.id, 'status', parseInt(e.target.value) || 200)}
                        placeholder="200"
                        className="w-full px-2.5 py-1.5 text-xs font-mono rounded border focus:outline-none focus:ring-1"
                        style={{ background: 'var(--color-surface-alt)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
                      />
                    </div>

                    {/* Mock Body */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold" style={{ color: 'var(--color-text-muted)' }}>Mock Response Body (JSON/Text)</label>
                      <textarea
                        value={mock.body}
                        onChange={e => handleUpdateField(mock.id, 'body', e.target.value)}
                        placeholder='{\n  "status": "success"\n}'
                        rows={6}
                        className="w-full px-3 py-2 text-xs font-mono rounded border focus:outline-none focus:ring-1 resize-y"
                        style={{ background: 'var(--color-surface-alt)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
                      />
                    </div>
                  </div>
                );
              })()
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center text-xs text-neutral-400">
                Select a mock endpoint from the list to edit its details.
              </div>
            )}
          </div>
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
