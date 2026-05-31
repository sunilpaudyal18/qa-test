import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Send, Plus, Save, Trash2, Edit2, FolderPlus, ChevronRight,
  ChevronDown, Copy, Check, Clock, Globe, Code, List,
  Package, Terminal, X, Download, Play, FileJson,
} from 'lucide-react';
import { apiRequestService } from '../services/apiRequestService';
import { useToast } from '../contexts/ToastContext';
import Modal from '../components/ui/Modal';
import ConfirmDialog from '../components/ui/ConfirmDialog';

const METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'];
const METHOD_COLORS = {
  GET: '#16A34A', POST: '#2563EB', PUT: '#D97706',
  PATCH: '#EA580C', DELETE: '#DC2626', HEAD: '#6B7280', OPTIONS: '#7C3AED',
};

const emptyHeaders = [{ key: '', value: '' }];

function formatBody(body, type) {
  if (!body) return '';
  if (type === 'json') {
    try { return JSON.stringify(JSON.parse(body), null, 2); } catch { return body; }
  }
  return body;
}

function formatResponseTime(ms) {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / 1048576).toFixed(1)}MB`;
}

const getStatusColor = (code) => {
  if (code >= 200 && code < 300) return '#16A34A';
  if (code >= 300 && code < 400) return '#2563EB';
  if (code >= 400 && code < 500) return '#D97706';
  if (code >= 500) return '#DC2626';
  return 'var(--color-text-muted)';
};

export default function ApiHub() {
  const toast = useToast();
  const [method, setMethod] = useState('GET');
  const [url, setUrl] = useState('');
  const [headers, setHeaders] = useState(emptyHeaders);
  const [bodyType, setBodyType] = useState('none');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [response, setResponse] = useState(null);
  const [responseTime, setResponseTime] = useState(null);
  const [responseSize, setResponseSize] = useState(null);
  const [activeTab, setActiveTab] = useState('params');
  const [savedRequests, setSavedRequests] = useState([]);
  const [collections, setCollections] = useState([]);
  const [selectedCollection, setSelectedCollection] = useState('All');
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [saveForm, setSaveForm] = useState({ name: '', collection: '' });
  const [collectionModalOpen, setCollectionModalOpen] = useState(false);
  const [collectionForm, setCollectionForm] = useState('');
  const [history, setHistory] = useState([]);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [copied, setCopied] = useState(false);
  const [savedExpand, setSavedExpand] = useState(true);
  const [historyExpand, setHistoryExpand] = useState(true);
  const responseRef = useRef(null);

  const loadRequests = useCallback(async () => {
    const requests = await apiRequestService.getAll();
    setSavedRequests(requests);
    const cols = [...new Set(requests.filter(r => r.collection).map(r => r.collection))];
    setCollections(cols);
  }, []);

  const loadHistory = useCallback(async () => {
    try {
      const db = (await import('../db/db')).default;
      const h = await db.apiRequests.where('name').equals('__history__').toArray();
      setHistory(h.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 20));
    } catch {}
  }, []);

  useEffect(() => { loadRequests(); loadHistory(); }, [loadRequests, loadHistory]);

  const handleSend = async () => {
    if (!url.trim()) { toast.warning('Please enter a URL'); return; }
    setSending(true);
    setResponse(null);
    const start = performance.now();
    try {
      const hdrs = {};
      headers.forEach(h => { if (h.key.trim()) hdrs[h.key.trim()] = h.value; });
      const opts = { method, headers: hdrs };
      if (bodyType !== 'none' && body.trim()) {
        opts.body = bodyType === 'json' ? body : body;
        if (bodyType === 'json' && !hdrs['Content-Type']) opts.headers['Content-Type'] = 'application/json';
      }
      const res = await fetch(url, opts);
      const text = await res.text();
      const end = performance.now();
      setResponseTime(Math.round(end - start));
      setResponseSize(new Blob([text]).size);
      let formatted = text;
      try { formatted = JSON.stringify(JSON.parse(text), null, 2); } catch {}
      setResponse({ status: res.status, statusText: res.statusText, headers: Object.fromEntries(res.headers.entries()), body: formatted });
    } catch (err) {
      const end = performance.now();
      setResponseTime(Math.round(end - start));
      setResponse({ status: 0, statusText: 'Network Error', headers: {}, body: err.message });
    }
    setSending(false);
    try {
      const db = (await import('../db/db')).default;
      await db.apiRequests.add({
        name: '__history__', method, url, headers, body, bodyType,
        collection: '__history__', createdAt: new Date().toISOString(),
      });
      loadHistory();
    } catch {}
  };

  const handleSaveRequest = async () => {
    if (!saveForm.name.trim()) { toast.warning('Enter a request name'); return; }
    await apiRequestService.create({
      name: saveForm.name.trim(), method, url, headers, body, bodyType,
      collection: saveForm.collection || '',
    });
    toast.success('Request saved');
    setSaveModalOpen(false);
    setSaveForm({ name: '', collection: '' });
    loadRequests();
  };

  const handleCreateCollection = async () => {
    if (!collectionForm.trim()) { toast.warning('Enter a collection name'); return; }
    toast.success(`Collection "${collectionForm}" created`);
    setCollectionModalOpen(false);
    setCollectionForm('');
  };

  const handleLoadRequest = (req) => {
    setMethod(req.method || 'GET');
    setUrl(req.url || '');
    setHeaders(req.headers || emptyHeaders);
    setBodyType(req.bodyType || 'none');
    setBody(req.body || '');
    toast.success('Request loaded');
  };

  const handleDeleteRequest = async () => {
    if (deleteTarget) {
      await apiRequestService.delete(deleteTarget);
      toast.success('Request deleted');
      loadRequests();
    }
  };

  const handleCopyResponse = () => {
    if (!response?.body) return;
    navigator.clipboard.writeText(response.body);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Copied to clipboard');
  };

  const filteredRequests = selectedCollection === 'All'
    ? savedRequests.filter(r => r.name !== '__history__')
    : savedRequests.filter(r => r.collection === selectedCollection && r.name !== '__history__');

  return (
    <div>
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>API Hub</h1>
        <p className="text-sm mt-1 mb-6" style={{ color: 'var(--color-text-secondary)' }}>Execute and test API requests</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 space-y-4">
          <div className="rounded-xl" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
            <div className="p-4 flex flex-col sm:flex-row gap-3" style={{ borderBottom: '1px solid var(--color-border)' }}>
              <div className="flex gap-2">
                {METHODS.map(m => (
                  <button key={m} onClick={() => setMethod(m)}
                    className="px-3 py-1.5 rounded text-xs font-bold uppercase tracking-wider transition-all"
                    style={{
                      background: method === m ? METHOD_COLORS[m] : 'var(--color-surface-alt)',
                      color: method === m ? '#fff' : 'var(--color-text-secondary)',
                    }}>
                    {m}
                  </button>
                ))}
              </div>
            </div>
            <div className="p-4">
              <div className="flex gap-2">
                <input type="text" value={url} onChange={e => setUrl(e.target.value)}
                  placeholder="https://api.example.com/endpoint"
                  className="flex-1 px-3 py-2 rounded-lg text-sm font-mono focus:outline-none focus:ring-2"
                  style={{ background: 'var(--color-surface-alt)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }} />
                <button onClick={handleSend} disabled={sending}
                  className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium text-white transition-all disabled:opacity-50"
                  style={{ background: 'var(--color-primary)' }}>
                  <Send size={14} /> {sending ? 'Sending...' : 'Send'}
                </button>
              </div>
            </div>

            <div className="px-4 pb-4 space-y-4">
              <div className="flex gap-4 text-sm" style={{ borderBottom: '1px solid var(--color-border)' }}>
                {['params', 'headers', 'body'].map(tab => (
                  <button key={tab} onClick={() => setActiveTab(tab)}
                    className="pb-2 text-sm font-medium capitalize transition-colors"
                    style={{
                      color: activeTab === tab ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                      borderBottom: activeTab === tab ? '2px solid var(--color-primary)' : '2px solid transparent',
                    }}>
                    {tab === 'params' ? 'Query Params' : tab}
                  </button>
                ))}
              </div>

              {activeTab === 'headers' && (
                <div className="space-y-2">
                  {headers.map((h, i) => (
                    <div key={i} className="flex gap-2">
                      <input type="text" placeholder="Key" value={h.key} onChange={e => {
                        const hh = [...headers]; hh[i].key = e.target.value; setHeaders(hh);
                      }} className="flex-1 px-3 py-1.5 rounded text-sm font-mono focus:outline-none"
                      style={{ background: 'var(--color-surface-alt)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }} />
                      <input type="text" placeholder="Value" value={h.value} onChange={e => {
                        const hh = [...headers]; hh[i].value = e.target.value; setHeaders(hh);
                      }} className="flex-1 px-3 py-1.5 rounded text-sm font-mono focus:outline-none"
                      style={{ background: 'var(--color-surface-alt)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }} />
                      <button onClick={() => setHeaders(headers.filter((_, j) => j !== i))}
                        className="p-1.5 rounded transition-colors"
                        style={{ color: 'var(--color-text-muted)' }}>
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                  <button onClick={() => setHeaders([...headers, { key: '', value: '' }])}
                    className="text-xs font-medium transition-colors"
                    style={{ color: 'var(--color-primary)' }}>
                    + Add header
                  </button>
                </div>
              )}

              {activeTab === 'body' && (
                <div className="space-y-3">
                  <select value={bodyType} onChange={e => setBodyType(e.target.value)}
                    className="px-3 py-1.5 rounded text-sm focus:outline-none"
                    style={{ background: 'var(--color-surface-alt)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}>
                    <option value="none">No body</option>
                    <option value="json">JSON</option>
                    <option value="text">Text</option>
                    <option value="form">Form Data</option>
                  </select>
                  {bodyType !== 'none' && (
                    <textarea value={body} onChange={e => setBody(e.target.value)}
                      rows={8} placeholder='{"key": "value"}'
                      className="w-full px-3 py-2 rounded text-sm font-mono focus:outline-none resize-none"
                      style={{ background: 'var(--color-surface-alt)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }} />
                  )}
                </div>
              )}

              {activeTab === 'params' && (
                <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                  Append query parameters directly to the URL above (e.g. <code className="px-1 py-0.5 rounded text-xs font-mono" style={{ background: 'var(--color-surface-alt)' }}>?key=value&amp;page=1</code>)
                </p>
              )}
            </div>
          </div>

          {response && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="rounded-xl overflow-hidden"
              style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
              <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: '1px solid var(--color-border)' }}>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>Response</span>
                  <span className="text-xs font-bold px-2 py-0.5 rounded" style={{
                    background: response.status >= 200 && response.status < 300 ? 'rgba(22,163,74,0.1)' :
                      response.status >= 400 ? 'rgba(220,38,38,0.1)' : 'rgba(217,119,6,0.1)',
                    color: getStatusColor(response.status),
                  }}>
                    {response.status} {response.statusText}
                  </span>
                  {responseTime && <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                    <Clock size={12} className="inline mr-1" />{formatResponseTime(responseTime)}
                  </span>}
                  {responseSize && <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                    {formatSize(responseSize)}
                  </span>}
                </div>
                <div className="flex gap-2">
                  <button onClick={handleCopyResponse}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded text-xs font-medium transition-colors"
                    style={{ color: 'var(--color-text-muted)' }}>
                    {copied ? <Check size={12} /> : <Copy size={12} />} {copied ? 'Copied' : 'Copy'}
                  </button>
                </div>
              </div>
              <div className="overflow-auto max-h-96" ref={responseRef}>
                <pre className="p-4 text-xs font-mono leading-relaxed" style={{ color: 'var(--color-text-primary)' }}>{response.body}</pre>
              </div>
            </motion.div>
          )}
        </div>

        <div className="space-y-4">
          <div className="rounded-xl" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
            <button onClick={() => setSavedExpand(!savedExpand)}
              className="w-full flex items-center justify-between px-4 py-3"
              style={{ borderBottom: savedExpand && filteredRequests.length > 0 ? '1px solid var(--color-border)' : 'none' }}>
              <span className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>Saved Requests</span>
              <div className="flex items-center gap-2">
                <button onClick={e => { e.stopPropagation(); setCollectionModalOpen(true); }}
                  className="p-1 rounded transition-colors" style={{ color: 'var(--color-text-muted)' }}>
                  <FolderPlus size={14} />
                </button>
                <button onClick={e => { e.stopPropagation(); setSaveModalOpen(true); }}
                  className="p-1 rounded transition-colors" style={{ color: 'var(--color-text-muted)' }}>
                  <Save size={14} />
                </button>
                {savedExpand ? <ChevronDown size={14} style={{ color: 'var(--color-text-muted)' }} /> : <ChevronRight size={14} style={{ color: 'var(--color-text-muted)' }} />}
              </div>
            </button>
            {savedExpand && (
              <div className="p-2">
                <div className="flex flex-wrap gap-1 mb-2 px-2">
                  <button onClick={() => setSelectedCollection('All')}
                    className="px-2 py-0.5 rounded text-[10px] font-medium"
                    style={{
                      background: selectedCollection === 'All' ? 'var(--color-primary)' : 'var(--color-surface-alt)',
                      color: selectedCollection === 'All' ? '#fff' : 'var(--color-text-secondary)',
                    }}>
                    All
                  </button>
                  {collections.map(col => (
                    <button key={col} onClick={() => setSelectedCollection(col)}
                      className="px-2 py-0.5 rounded text-[10px] font-medium"
                      style={{
                        background: selectedCollection === col ? 'var(--color-primary)' : 'var(--color-surface-alt)',
                        color: selectedCollection === col ? '#fff' : 'var(--color-text-secondary)',
                      }}>
                      {col}
                    </button>
                  ))}
                </div>
                {filteredRequests.length === 0 ? (
                  <p className="text-xs px-2 py-3" style={{ color: 'var(--color-text-muted)' }}>No saved requests</p>
                ) : (
                  filteredRequests.map(req => (
                    <div key={req.id}
                      className="flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer transition-colors group"
                      style={{ color: 'var(--color-text-secondary)' }}
                      onClick={() => handleLoadRequest(req)}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--color-surface-alt)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <span className="text-[10px] font-bold uppercase shrink-0 px-1 py-0.5 rounded"
                        style={{ background: METHOD_COLORS[req.method] || METHOD_COLORS.GET, color: '#fff' }}>
                        {req.method}
                      </span>
                      <span className="text-xs truncate flex-1">{req.name}</span>
                      <button onClick={e => { e.stopPropagation(); setDeleteTarget(req.id); setConfirmOpen(true); }}
                        className="p-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                        style={{ color: 'var(--color-text-muted)' }}>
                        <Trash2 size={10} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          <div className="rounded-xl" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
            <button onClick={() => setHistoryExpand(!historyExpand)}
              className="w-full flex items-center justify-between px-4 py-3"
              style={{ borderBottom: historyExpand && history.length > 0 ? '1px solid var(--color-border)' : 'none' }}>
              <span className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>History</span>
              {historyExpand ? <ChevronDown size={14} style={{ color: 'var(--color-text-muted)' }} /> : <ChevronRight size={14} style={{ color: 'var(--color-text-muted)' }} />}
            </button>
            {historyExpand && (
              <div className="p-2">
                {history.length === 0 ? (
                  <p className="text-xs px-2 py-3" style={{ color: 'var(--color-text-muted)' }}>No request history</p>
                ) : (
                  history.map((h, i) => (
                    <div key={h.id || i}
                      className="flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer transition-colors"
                      style={{ color: 'var(--color-text-secondary)' }}
                      onClick={() => handleLoadRequest(h)}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--color-surface-alt)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <span className="text-[10px] font-bold uppercase shrink-0 px-1 py-0.5 rounded"
                        style={{ background: METHOD_COLORS[h.method] || METHOD_COLORS.GET, color: '#fff' }}>
                        {h.method}
                      </span>
                      <span className="text-xs truncate flex-1">{h.url}</span>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <Modal isOpen={saveModalOpen} onClose={() => setSaveModalOpen(false)} title="Save Request" size="sm">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>Name</label>
            <input type="text" value={saveForm.name} onChange={e => setSaveForm({ ...saveForm, name: e.target.value })}
              className="w-full px-3 py-2 rounded-lg text-sm focus:outline-none"
              style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border-strong)', color: 'var(--color-text-primary)' }}
              placeholder="My API Request" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>Collection</label>
            <input type="text" value={saveForm.collection} onChange={e => setSaveForm({ ...saveForm, collection: e.target.value })}
              className="w-full px-3 py-2 rounded-lg text-sm focus:outline-none"
              style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border-strong)', color: 'var(--color-text-primary)' }}
              placeholder="Collection name (optional)" list="collections" />
            <datalist id="collections">
              {collections.map(c => <option key={c} value={c} />)}
            </datalist>
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <button onClick={() => setSaveModalOpen(false)}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              style={{ color: 'var(--color-text-secondary)' }}>Cancel</button>
            <button onClick={handleSaveRequest}
              className="px-4 py-2 rounded-lg text-sm font-medium text-white"
              style={{ background: 'var(--color-primary)' }}>Save</button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={collectionModalOpen} onClose={() => setCollectionModalOpen(false)} title="New Collection" size="sm">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>Collection name</label>
            <input type="text" value={collectionForm} onChange={e => setCollectionForm(e.target.value)}
              className="w-full px-3 py-2 rounded-lg text-sm focus:outline-none"
              style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border-strong)', color: 'var(--color-text-primary)' }}
              placeholder="My Collection" />
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <button onClick={() => setCollectionModalOpen(false)}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              style={{ color: 'var(--color-text-secondary)' }}>Cancel</button>
            <button onClick={handleCreateCollection}
              className="px-4 py-2 rounded-lg text-sm font-medium text-white"
              style={{ background: 'var(--color-primary)' }}>Create</button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog isOpen={confirmOpen} onClose={() => setConfirmOpen(false)} onConfirm={handleDeleteRequest}
        title="Delete Request" message="This will permanently delete this saved request." />
    </div>
  );
}
