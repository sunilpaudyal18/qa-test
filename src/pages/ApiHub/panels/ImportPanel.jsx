import { useState } from 'react';
import { X, Upload, Terminal, FileCode, CheckCircle, Info } from 'lucide-react';
import { parseCurl } from '../utils/curlParser';
import { parseOpenApi } from '../utils/openApiImporter';
import { apiRequestService } from '../../../services/apiRequestService';

export default function ImportPanel({ isOpen, onClose, store, toast }) {
  const { handleLoadRequest, addCollection, loadRequests, setCollections } = store;
  const [format, setFormat] = useState('curl'); // 'curl', 'openapi', 'postman'
  const [inputText, setInputText] = useState('');

  if (!isOpen) return null;

  const handleImport = async () => {
    if (!inputText.trim()) {
      toast?.warning('Please paste data to import.');
      return;
    }

    try {
      if (format === 'curl') {
        const config = parseCurl(inputText);
        handleLoadRequest(config);
        toast?.success('cURL request parsed and loaded into workspace!');
        onClose();
      } else if (format === 'openapi') {
        const { collections, requests } = parseOpenApi(inputText);
        
        // Add collections to store
        collections.forEach(col => {
          addCollection(col.name);
        });

        // Save all requests to DB
        for (const req of requests) {
          await apiRequestService.create({
            name: req.name,
            method: req.method,
            url: req.url,
            headers: req.headers,
            params: req.params,
            body: req.body,
            bodyType: req.bodyType,
            auth: req.auth,
            assertions: req.assertions,
            collection: req.collection,
          });
        }

        await loadRequests();
        toast?.success(`OpenAPI specs imported! Added ${requests.length} requests.`);
        onClose();
      } else if (format === 'postman') {
        const parsed = JSON.parse(inputText);
        const colName = parsed.info?.name || 'Imported Postman';
        addCollection(colName);

        const requests = [];
        const extractRequests = (items) => {
          items.forEach(item => {
            if (item.request) {
              const req = item.request;
              const hdrs = (req.header || []).map(h => ({
                enabled: !h.disabled,
                key: h.key,
                value: h.value,
                description: h.description || '',
              }));

              let body = '';
              let bodyType = 'none';
              if (req.body) {
                bodyType = req.body.mode === 'raw' ? 'json' : req.body.mode || 'none';
                body = req.body.raw || '';
              }

              const urlStr = typeof req.url === 'string' ? req.url : req.url?.raw || '';

              requests.push({
                name: item.name || 'Postman Request',
                method: req.method || 'GET',
                url: urlStr,
                headers: hdrs.length ? hdrs : [{ enabled: true, key: '', value: '' }],
                params: [{ enabled: true, key: '', value: '', description: '' }],
                body,
                bodyType,
                auth: { type: 'none' },
                assertions: [],
                collection: colName,
              });
            }
            if (item.item) {
              extractRequests(item.item);
            }
          });
        };

        if (parsed.item) {
          extractRequests(parsed.item);
        }

        // Save requests
        for (const r of requests) {
          await apiRequestService.create(r);
        }

        await loadRequests();
        toast?.success(`Postman collection "${colName}" imported! Added ${requests.length} requests.`);
        onClose();
      }
    } catch (e) {
      toast?.error('Failed to import: ' + e.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center select-none">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-xs" onClick={onClose} />

      {/* Modal Box */}
      <div
        className="relative w-full max-w-lg rounded-xl shadow-2xl flex flex-col max-h-[80vh]"
        style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
      >
        {/* Header */}
        <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--color-border)' }}>
          <div className="flex items-center gap-2">
            <Upload className="text-indigo-500" size={16} />
            <h2 className="text-sm font-bold text-neutral-800 dark:text-neutral-100">Import Requests</h2>
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
            <X size={16} style={{ color: 'var(--color-text-muted)' }} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Format Selector */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>
              Import Source Format
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => setFormat('curl')}
                className="py-2 px-3 rounded-lg text-xs font-semibold border flex items-center justify-center gap-1.5 transition-all"
                style={{
                  background: format === 'curl' ? 'var(--color-primary)' : 'transparent',
                  color: format === 'curl' ? '#fff' : 'var(--color-text-secondary)',
                  borderColor: format === 'curl' ? 'var(--color-primary)' : 'var(--color-border)',
                }}
              >
                <Terminal size={12} />
                cURL Command
              </button>
              <button
                onClick={() => setFormat('openapi')}
                className="py-2 px-3 rounded-lg text-xs font-semibold border flex items-center justify-center gap-1.5 transition-all"
                style={{
                  background: format === 'openapi' ? 'var(--color-primary)' : 'transparent',
                  color: format === 'openapi' ? '#fff' : 'var(--color-text-secondary)',
                  borderColor: format === 'openapi' ? 'var(--color-primary)' : 'var(--color-border)',
                }}
              >
                <FileCode size={12} />
                OpenAPI Spec JSON
              </button>
              <button
                onClick={() => setFormat('postman')}
                className="py-2 px-3 rounded-lg text-xs font-semibold border flex items-center justify-center gap-1.5 transition-all"
                style={{
                  background: format === 'postman' ? 'var(--color-primary)' : 'transparent',
                  color: format === 'postman' ? '#fff' : 'var(--color-text-secondary)',
                  borderColor: format === 'postman' ? 'var(--color-primary)' : 'var(--color-border)',
                }}
              >
                <Upload size={12} />
                Postman JSON
              </button>
            </div>
          </div>

          {/* Paste Area */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>
              Paste Source Raw Data
            </label>
            <textarea
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              placeholder={
                format === 'curl'
                  ? "curl -X POST https://api.example.com/users -d '{\"name\":\"Alice\"}'"
                  : format === 'openapi'
                  ? '{\n  "openapi": "3.0.0",\n  "info": { "title": "My API" },\n  "paths": { ... }\n}'
                  : '{\n  "info": { "name": "My Collection" },\n  "item": [ ... ]\n}'
              }
              rows={8}
              className="w-full px-3 py-2 text-xs font-mono rounded-lg border focus:outline-none focus:ring-1"
              style={{ background: 'var(--color-surface-alt)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
            />
          </div>

          <div
            className="rounded-lg p-2.5 text-[10px] leading-relaxed border flex items-start gap-1.5"
            style={{ background: 'var(--color-surface-alt)', borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' }}
          >
            <Info size={12} className="shrink-0 text-indigo-500 mt-0.5" />
            <span>
              {format === 'curl' 
                ? 'Parsing is done entirely locally. The request details will replace the current active request in your workspace immediately.'
                : 'Importing collections will append requests directly to your local database.'
              }
            </span>
          </div>
        </div>

        {/* Footer */}
        <div
          className="p-4 border-t flex justify-end gap-2 bg-neutral-50 dark:bg-neutral-900 rounded-b-xl"
          style={{ borderColor: 'var(--color-border)' }}
        >
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-lg text-xs font-semibold border hover:bg-neutral-100 dark:hover:bg-neutral-850"
            style={{ color: 'var(--color-text-secondary)', borderColor: 'var(--color-border)' }}
          >
            Cancel
          </button>
          <button
            onClick={handleImport}
            className="px-4 py-1.5 rounded-lg text-xs font-semibold text-white"
            style={{ background: 'var(--color-primary)' }}
          >
            Import
          </button>
        </div>
      </div>
    </div>
  );
}
