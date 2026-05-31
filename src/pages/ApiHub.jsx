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
  GET: 'bg-emerald-600', POST: 'bg-blue-600', PUT: 'bg-amber-600',
  PATCH: 'bg-orange-600', DELETE: 'bg-red-600', HEAD: 'bg-gray-500', OPTIONS: 'bg-purple-600',
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
  if (code >= 200 && code < 300) return 'text-emerald-400';
  if (code >= 300 && code < 400) return 'text-blue-400';
  if (code >= 400 && code < 500) return 'text-amber-400';
  if (code >= 500) return 'text-red-400';
  return 'text-gray-400';
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

  const [saved, setSaved] = useState([]);
  const [collections, setCollections] = useState([]);
  const [expandedColl, setExpandedColl] = useState(null);
  const [history, setHistory] = useState([]);
  const [copied, setCopied] = useState(false);

  const [saveModal, setSaveModal] = useState(false);
  const [saveForm, setSaveForm] = useState({ name: '', collection: '' });
  const [editingId, setEditingId] = useState(null);
  const [confirmDel, setConfirmDel] = useState(null);

  const [newCollModal, setNewCollModal] = useState(false);
  const [newCollName, setNewCollName] = useState('');

  const loadData = useCallback(async () => {
    const all = await apiRequestService.getAll();
    setSaved(all);
    const cols = await apiRequestService.getCollections();
    setCollections(cols);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const headersObj = headers
    .filter(h => h.key.trim())
    .reduce((acc, h) => ({ ...acc, [h.key.trim()]: h.value }), {});

  const handleSend = async () => {
    if (!url.trim()) { toast.warning('Enter a URL'); return; }
    setSending(true);
    setResponse(null);
    const start = performance.now();
    try {
      const opts = { method, headers: headersObj };
      if (bodyType !== 'none' && ['POST', 'PUT', 'PATCH'].includes(method)) {
        if (bodyType === 'json') {
          opts.headers['Content-Type'] = 'application/json';
          opts.body = body;
        } else if (bodyType === 'form') {
          opts.headers['Content-Type'] = 'application/x-www-form-urlencoded';
          opts.body = body;
        } else {
          opts.body = body;
        }
      }
      const res = await fetch(url, opts);
      const end = performance.now();
      const elapsed = Math.round(end - start);
      setResponseTime(elapsed);

      const contentType = res.headers.get('content-type') || '';
      let bodyText;
      if (contentType.includes('application/json')) {
        bodyText = await res.text();
        try { bodyText = JSON.stringify(JSON.parse(bodyText), null, 2); } catch { }
      } else {
        bodyText = await res.text();
      }
      setResponseSize(new Blob([bodyText]).size);

      const respHeaders = {};
      res.headers.forEach((v, k) => { respHeaders[k] = v; });

      setResponse({ status: res.status, statusText: res.statusText, headers: respHeaders, body: bodyText, contentType });
      setHistory(prev => [{ method, url, time: Date.now() }, ...prev].slice(0, 20));
    } catch (err) {
      const end = performance.now();
      setResponseTime(Math.round(end - start));
      setResponse({ status: 0, statusText: 'Error', headers: {}, body: `Request failed: ${err.message}\n\nThis may be due to CORS, network error, or invalid URL.`, contentType: 'text/plain' });
    }
    setSending(false);
  };

  const loadSavedRequest = (req) => {
    setMethod(req.method);
    setUrl(req.url);
    if (req.headers) {
      const parsed = typeof req.headers === 'string' ? JSON.parse(req.headers) : req.headers;
      if (Array.isArray(parsed)) setHeaders(parsed.length ? parsed : emptyHeaders);
      else setHeaders(emptyHeaders);
    } else setHeaders(emptyHeaders);
    setBodyType(req.bodyType || 'none');
    setBody(req.body || '');
    setResponse(null);
    setResponseTime(null);
    setResponseSize(null);
  };

  const openSave = (req) => {
    if (req) { setEditingId(req.id); setSaveForm({ name: req.name, collection: req.collection || '' }); }
    else { setEditingId(null); setSaveForm({ name: url.split('/').pop()?.split('?')[0] || 'Untitled', collection: '' }); }
    setSaveModal(true);
  };

  const handleSave = async () => {
    if (!saveForm.name.trim()) { toast.warning('Name is required'); return; }
    const data = {
      name: saveForm.name.trim(),
      collection: saveForm.collection.trim() || null,
      method, url,
      headers: JSON.stringify(headers),
      bodyType, body,
    };
    if (editingId) {
      await apiRequestService.update(editingId, data);
      toast.success('Request updated');
    } else {
      await apiRequestService.create(data);
      toast.success('Request saved');
    }
    setSaveModal(false);
    setEditingId(null);
    loadData();
  };

  const handleDelete = async () => {
    if (confirmDel) {
      await apiRequestService.delete(confirmDel);
      toast.success('Deleted');
      setConfirmDel(null);
      loadData();
    }
  };

  const handleNewCollection = async () => {
    if (!newCollName.trim()) return;
    setNewCollModal(false);
    setNewCollName('');
    setSaveForm(prev => ({ ...prev, collection: newCollName.trim() }));
  };

  const copyResponse = () => {
    if (!response?.body) return;
    navigator.clipboard.writeText(response.body);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Copied to clipboard');
  };

  const clearHistory = () => setHistory([]);

  const inputClass = "w-full px-3 py-2 rounded-lg border border-gray-700 bg-gray-800 text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-gray-500";
  const labelClass = "text-sm font-medium text-gray-300";

  return (
    <div className="h-[calc(100vh-6rem)] flex gap-4">
      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
        className="w-72 shrink-0 bg-gray-900 rounded-xl border border-gray-800 flex flex-col overflow-hidden">
        <div className="p-3 border-b border-gray-800 flex items-center justify-between">
          <span className="text-sm font-semibold text-gray-200">Saved Requests</span>
          <button onClick={() => openSave(null)} className="p-1.5 rounded hover:bg-gray-800 text-gray-400 hover:text-indigo-400">
            <Save size={14} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
          {collections.map(coll => (
            <div key={coll}>
              <button onClick={() => setExpandedColl(expandedColl === coll ? null : coll)}
                className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-xs font-semibold text-gray-400 hover:text-gray-200 hover:bg-gray-800">
                {expandedColl === coll ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                <FolderPlus size={14} /> {coll}
              </button>
              {expandedColl === coll && saved.filter(r => r.collection === coll).map(r => (
                <button key={r.id} onClick={() => loadSavedRequest(r)}
                  className="w-full flex items-center gap-2 pl-7 pr-2 py-1.5 rounded text-xs text-gray-400 hover:text-gray-200 hover:bg-gray-800 group">
                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${METHOD_COLORS[r.method]?.replace('bg-', 'bg-') || 'bg-gray-500'}`} />
                  <span className="truncate flex-1 text-left">{r.name}</span>
                  <button onClick={(e) => { e.stopPropagation(); openSave(r); }} className="p-0.5 opacity-0 group-hover:opacity-100 hover:text-indigo-400">
                    <Edit2 size={12} />
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); setConfirmDel(r.id); }} className="p-0.5 opacity-0 group-hover:opacity-100 hover:text-red-400">
                    <Trash2 size={12} />
                  </button>
                </button>
              ))}
            </div>
          ))}
          {saved.filter(r => !r.collection).map(r => (
            <button key={r.id} onClick={() => loadSavedRequest(r)}
              className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-xs text-gray-400 hover:text-gray-200 hover:bg-gray-800 group">
              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${METHOD_COLORS[r.method]?.replace('bg-', 'bg-') || 'bg-gray-500'}`} />
              <span className="truncate flex-1 text-left">{r.name}</span>
              <button onClick={(e) => { e.stopPropagation(); openSave(r); }} className="p-0.5 opacity-0 group-hover:opacity-100 hover:text-indigo-400">
                <Edit2 size={12} />
              </button>
              <button onClick={(e) => { e.stopPropagation(); setConfirmDel(r.id); }} className="p-0.5 opacity-0 group-hover:opacity-100 hover:text-red-400">
                <Trash2 size={12} />
              </button>
            </button>
          ))}
          {saved.length === 0 && <p className="text-xs text-gray-600 text-center py-8">No saved requests</p>}
        </div>
        {history.length > 0 && (
          <div className="border-t border-gray-800 p-2">
            <div className="flex items-center justify-between px-2 py-1">
              <span className="text-[10px] font-semibold text-gray-500 uppercase">History</span>
              <button onClick={clearHistory} className="text-[10px] text-gray-600 hover:text-gray-400">Clear</button>
            </div>
            <div className="space-y-0.5 max-h-32 overflow-y-auto">
              {history.map((h, i) => (
                <button key={i} onClick={() => { setMethod(h.method); setUrl(h.url); }}
                  className="w-full flex items-center gap-2 px-2 py-1 rounded text-[10px] text-gray-500 hover:text-gray-300 hover:bg-gray-800">
                  <span className={`px-1 py-0.5 rounded text-[8px] font-bold text-white ${METHOD_COLORS[h.method]}`}>{h.method}</span>
                  <span className="truncate">{h.url}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </motion.div>

      <div className="flex-1 flex flex-col gap-4 min-w-0">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="bg-gray-900 rounded-xl border border-gray-800 p-4">
          <div className="flex items-center gap-2">
            <select value={method} onChange={e => setMethod(e.target.value)}
              className={`px-3 py-2 rounded-lg text-sm font-bold text-white ${METHOD_COLORS[method]} border-0 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-white/30`}>
              {METHODS.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
            <input type="text" value={url} onChange={e => setUrl(e.target.value)}
              placeholder="https://api.example.com/endpoint" className={inputClass + ' flex-1 font-mono text-sm'}
              onKeyDown={e => e.key === 'Enter' && handleSend()} />
            <button onClick={handleSend} disabled={sending}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium flex items-center gap-2 transition disabled:opacity-50">
              {sending ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Send size={16} />}
              Send
            </button>
          </div>
        </motion.div>

        <div className="flex-1 flex flex-col bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
          <div className="flex border-b border-gray-800">
            {[
              { key: 'params', label: 'Headers', icon: List },
              { key: 'body', label: 'Body', icon: Code },
            ].map(tab => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.key ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-gray-500 hover:text-gray-300'}`}>
                <tab.icon size={15} /> {tab.label}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {activeTab === 'params' && (
              <div className="space-y-2">
                <div className="grid grid-cols-[1fr_1fr_36px] gap-2 text-xs text-gray-500 font-medium px-2">
                  <span>Key</span><span>Value</span><span />
                </div>
                {headers.map((h, idx) => (
                  <div key={idx} className="grid grid-cols-[1fr_1fr_36px] gap-2">
                    <input type="text" value={h.key} onChange={e => {
                      const arr = [...headers]; arr[idx] = { ...arr[idx], key: e.target.value }; setHeaders(arr);
                    }} placeholder="Header name" className={inputClass + ' text-xs font-mono'} />
                    <input type="text" value={h.value} onChange={e => {
                      const arr = [...headers]; arr[idx] = { ...arr[idx], value: e.target.value }; setHeaders(arr);
                    }} placeholder="Value" className={inputClass + ' text-xs font-mono'} />
                    <button onClick={() => setHeaders(headers.filter((_, i) => i !== idx))}
                      className="p-2 text-gray-500 hover:text-red-400">
                      <X size={14} />
                    </button>
                  </div>
                ))}
                <button onClick={() => setHeaders([...headers, { key: '', value: '' }])}
                  className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300">
                  <Plus size={14} /> Add Header
                </button>
              </div>
            )}

            {activeTab === 'body' && (
              <div className="space-y-3">
                <div className="flex gap-2">
                  {[
                    { key: 'none', label: 'None' },
                    { key: 'json', label: 'JSON' },
                    { key: 'form', label: 'Form' },
                    { key: 'text', label: 'Text' },
                  ].map(opt => (
                    <button key={opt.key} onClick={() => setBodyType(opt.key)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${bodyType === opt.key ? 'bg-indigo-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-gray-200'}`}>
                      {opt.label}
                    </button>
                  ))}
                </div>
                {bodyType !== 'none' && (
                  <textarea value={body} onChange={e => setBody(e.target.value)}
                    placeholder={bodyType === 'json' ? '{\n  "key": "value"\n}' : bodyType === 'form' ? 'key1=value1&key2=value2' : 'Raw text body...'}
                    className={inputClass + ' font-mono text-xs min-h-[200px] resize-y'} />
                )}
              </div>
            )}
          </div>
        </div>

        {response && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
              <div className="flex items-center gap-3">
                <span className={`text-lg font-bold ${getStatusColor(response.status)}`}>
                  {response.status || 'ERR'}
                </span>
                <span className="text-sm text-gray-400">{response.statusText}</span>
                {responseTime !== null && (
                  <span className="flex items-center gap-1 text-xs text-gray-500">
                    <Clock size={12} /> {formatResponseTime(responseTime)}
                  </span>
                )}
                {responseSize !== null && (
                  <span className="flex items-center gap-1 text-xs text-gray-500">
                    <Package size={12} /> {formatSize(responseSize)}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button onClick={copyResponse} className="p-1.5 rounded text-gray-500 hover:text-gray-200 hover:bg-gray-800">
                  {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                </button>
              </div>
            </div>
            <div className="max-h-80 overflow-y-auto">
              {response.headers && Object.keys(response.headers).length > 0 && (
                <details className="border-b border-gray-800">
                  <summary className="px-4 py-2 text-xs font-medium text-gray-400 cursor-pointer hover:text-gray-200 sticky top-0 bg-gray-900">
                    Response Headers ({Object.keys(response.headers).length})
                  </summary>
                  <div className="px-4 py-2 space-y-1">
                    {Object.entries(response.headers).map(([k, v]) => (
                      <div key={k} className="flex gap-2 text-[10px] font-mono">
                        <span className="text-indigo-400 shrink-0">{k}:</span>
                        <span className="text-gray-400 break-all">{v}</span>
                      </div>
                    ))}
                  </div>
                </details>
              )}
              <pre className="p-4 text-xs font-mono text-gray-300 whitespace-pre-wrap overflow-x-auto">{response.body || '(empty)'}</pre>
            </div>
          </motion.div>
        )}
      </div>

      <Modal isOpen={saveModal} onClose={() => setSaveModal(false)} title={editingId ? 'Update Request' : 'Save Request'} size="sm">
        <div className="space-y-4">
          <div>
            <label className={labelClass}>Name</label>
            <input type="text" value={saveForm.name} onChange={e => setSaveForm({ ...saveForm, name: e.target.value })} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Collection</label>
            <div className="flex gap-2">
              <select value={saveForm.collection} onChange={e => setSaveForm({ ...saveForm, collection: e.target.value })}
                className={inputClass + ' flex-1'}>
                <option value="">No Collection</option>
                {collections.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <button onClick={() => setNewCollModal(true)} className="p-2 bg-gray-800 rounded-lg text-gray-400 hover:text-indigo-400 border border-gray-700">
                <FolderPlus size={16} />
              </button>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold text-white ${METHOD_COLORS[method]}`}>{method}</span>
            <span className="truncate">{url}</span>
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <button onClick={() => setSaveModal(false)} className="px-4 py-2 rounded-lg text-sm text-gray-300 hover:text-white bg-gray-800 hover:bg-gray-700">Cancel</button>
            <button onClick={handleSave} className="px-4 py-2 rounded-lg text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700">{editingId ? 'Update' : 'Save'}</button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={newCollModal} onClose={() => setNewCollModal(false)} title="New Collection" size="sm">
        <div className="space-y-4">
          <div>
            <label className={labelClass}>Collection Name</label>
            <input type="text" value={newCollName} onChange={e => setNewCollName(e.target.value)}
              className={inputClass} placeholder="e.g. User API" autoFocus
              onKeyDown={e => e.key === 'Enter' && handleNewCollection()} />
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <button onClick={() => setNewCollModal(false)} className="px-4 py-2 rounded-lg text-sm text-gray-300 hover:text-white bg-gray-800 hover:bg-gray-700">Cancel</button>
            <button onClick={handleNewCollection} className="px-4 py-2 rounded-lg text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700">Create</button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog isOpen={!!confirmDel} onClose={() => setConfirmDel(null)} onConfirm={handleDelete}
        title="Delete Request" message="This will permanently delete this saved API request." />
    </div>
  );
}
