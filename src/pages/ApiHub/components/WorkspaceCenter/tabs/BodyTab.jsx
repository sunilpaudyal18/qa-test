import { useState } from 'react';
import { Wand2, AlignJustify, Minimize2, CheckCircle2, AlertCircle } from 'lucide-react';

const BODY_TYPES = [
  { id: 'none', label: 'None' },
  { id: 'json', label: 'JSON' },
  { id: 'xml', label: 'XML' },
  { id: 'raw', label: 'Raw' },
  { id: 'form-urlencoded', label: 'x-www-form-urlencoded' },
  { id: 'form-data', label: 'Form Data' },
];

function validateJson(str) {
  try { JSON.parse(str); return { valid: true }; }
  catch (e) { return { valid: false, error: e.message }; }
}

export default function BodyTab({ store }) {
  const { bodyType, setBodyType, body, setBody, learningMode } = store;
  const [jsonStatus, setJsonStatus] = useState(null);

  const beautify = () => {
    try {
      setBody(JSON.stringify(JSON.parse(body), null, 2));
      setJsonStatus({ valid: true });
    } catch (e) {
      setJsonStatus({ valid: false, error: e.message });
    }
  };

  const minify = () => {
    try {
      setBody(JSON.stringify(JSON.parse(body)));
      setJsonStatus({ valid: true });
    } catch (e) {
      setJsonStatus({ valid: false, error: e.message });
    }
  };

  const validate = () => setJsonStatus(validateJson(body));

  const handleBodyChange = (val) => {
    setBody(val);
    if (bodyType === 'json' && jsonStatus) setJsonStatus(null);
  };

  return (
    <div className="space-y-3">
      {learningMode && (
        <div className="px-3 py-2 rounded-lg text-[11px]" style={{ background: '#eff6ff', border: '1px solid #bfdbfe', color: '#1d4ed8' }}>
          <strong>💡 Request Body</strong> sends data to the server (used with POST, PUT, PATCH). JSON is the most common format for REST APIs.
        </div>
      )}

      {/* Body Type Selector */}
      <div className="flex flex-wrap gap-1.5">
        {BODY_TYPES.map(t => (
          <button
            key={t.id}
            onClick={() => setBodyType(t.id)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
            style={{
              background: bodyType === t.id ? 'var(--color-primary)' : 'var(--color-surface-alt)',
              color: bodyType === t.id ? '#fff' : 'var(--color-text-secondary)',
              border: bodyType === t.id ? '1px solid var(--color-primary)' : '1px solid var(--color-border)',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {bodyType === 'none' && (
        <div className="flex flex-col items-center py-8 gap-2" style={{ color: 'var(--color-text-muted)' }}>
          <p className="text-sm">This request has no body.</p>
          <p className="text-xs">Select a body type above to add request body.</p>
        </div>
      )}

      {bodyType !== 'none' && bodyType !== 'form-data' && bodyType !== 'form-urlencoded' && (
        <div className="space-y-2">
          {/* JSON Toolbar */}
          {bodyType === 'json' && (
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-semibold tracking-wider" style={{ color: 'var(--color-text-muted)' }}>JSON Tools:</span>
              <button onClick={beautify} className="flex items-center gap-1 text-[10px] font-medium px-2 py-1 rounded transition-colors"
                style={{ background: 'var(--color-surface-alt)', color: 'var(--color-text-secondary)', border: '1px solid var(--color-border)' }}>
                <Wand2 size={10} /> Beautify
              </button>
              <button onClick={minify} className="flex items-center gap-1 text-[10px] font-medium px-2 py-1 rounded transition-colors"
                style={{ background: 'var(--color-surface-alt)', color: 'var(--color-text-secondary)', border: '1px solid var(--color-border)' }}>
                <Minimize2 size={10} /> Minify
              </button>
              <button onClick={validate} className="flex items-center gap-1 text-[10px] font-medium px-2 py-1 rounded transition-colors"
                style={{ background: 'var(--color-surface-alt)', color: 'var(--color-text-secondary)', border: '1px solid var(--color-border)' }}>
                <CheckCircle2 size={10} /> Validate
              </button>
              {jsonStatus && (
                <span className="flex items-center gap-1 text-[10px] font-medium" style={{ color: jsonStatus.valid ? '#16A34A' : '#DC2626' }}>
                  {jsonStatus.valid ? <CheckCircle2 size={10} /> : <AlertCircle size={10} />}
                  {jsonStatus.valid ? 'Valid JSON' : jsonStatus.error}
                </span>
              )}
            </div>
          )}

          {/* Editor */}
          <div className="relative">
            <textarea
              value={body}
              onChange={e => handleBodyChange(e.target.value)}
              rows={12}
              spellCheck={false}
              placeholder={bodyType === 'json' ? '{\n  "key": "value"\n}' : bodyType === 'xml' ? '<root>\n  <key>value</key>\n</root>' : 'Enter body content...'}
              className="w-full px-4 py-3 text-sm font-mono rounded-lg focus:outline-none focus:ring-2 resize-y leading-relaxed"
              style={{
                background: 'var(--color-surface-alt)',
                border: jsonStatus
                  ? `1px solid ${jsonStatus.valid ? '#16A34A' : '#DC2626'}`
                  : '1px solid var(--color-border)',
                color: 'var(--color-text-primary)',
                fontFamily: 'ui-monospace, "Cascadia Code", Consolas, monospace',
                minHeight: 200,
                tabSize: 2,
              }}
            />
            {bodyType === 'json' && (
              <span
                className="absolute top-2 right-2 text-[9px] font-bold uppercase px-1.5 py-0.5 rounded"
                style={{ background: '#dbeafe', color: '#1d4ed8' }}
              >
                JSON
              </span>
            )}
          </div>
        </div>
      )}

      {/* Form URL Encoded */}
      {bodyType === 'form-urlencoded' && (
        <FormDataEditor body={body} setBody={setBody} />
      )}
      {bodyType === 'form-data' && (
        <FormDataEditor body={body} setBody={setBody} multipart />
      )}
    </div>
  );
}

function FormDataEditor({ body, setBody, multipart }) {
  const parseRows = () => {
    try {
      return JSON.parse(body || '[]');
    } catch {
      return [{ key: '', value: '' }];
    }
  };
  const rows = parseRows();
  const save = (newRows) => setBody(JSON.stringify(newRows));

  const update = (i, field, val) => {
    const next = [...rows];
    next[i] = { ...next[i], [field]: val };
    save(next);
  };
  const addRow = () => save([...rows, { key: '', value: '' }]);
  const removeRow = (i) => save(rows.filter((_, j) => j !== i));

  return (
    <div className="space-y-2">
      <div className="rounded-lg overflow-hidden" style={{ border: '1px solid var(--color-border)' }}>
        <div
          className="grid px-3 py-2 text-[10px] font-semibold uppercase tracking-wider"
          style={{ gridTemplateColumns: '1fr 1fr 32px', background: 'var(--color-surface-alt)', color: 'var(--color-text-muted)', borderBottom: '1px solid var(--color-border)' }}
        >
          <span>Key</span>
          <span>Value</span>
          <span />
        </div>
        {rows.map((row, i) => (
          <div key={i} className="grid items-center px-3 py-1.5 gap-2 group"
            style={{ gridTemplateColumns: '1fr 1fr 32px', borderBottom: i < rows.length - 1 ? '1px solid var(--color-border)' : 'none' }}>
            <input type="text" value={row.key} onChange={e => update(i, 'key', e.target.value)} placeholder="key"
              className="w-full px-2 py-1 text-xs font-mono rounded focus:outline-none"
              style={{ background: 'var(--color-surface-alt)', border: '1px solid transparent', color: 'var(--color-text-primary)' }} />
            <input type="text" value={row.value} onChange={e => update(i, 'value', e.target.value)} placeholder="value"
              className="w-full px-2 py-1 text-xs font-mono rounded focus:outline-none"
              style={{ background: 'var(--color-surface-alt)', border: '1px solid transparent', color: 'var(--color-text-primary)' }} />
            <button onClick={() => removeRow(i)} className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded" style={{ color: '#DC2626' }}>
              <span className="text-xs">✕</span>
            </button>
          </div>
        ))}
      </div>
      <button onClick={addRow} className="text-xs font-medium" style={{ color: 'var(--color-primary)' }}>+ Add field</button>
    </div>
  );
}
