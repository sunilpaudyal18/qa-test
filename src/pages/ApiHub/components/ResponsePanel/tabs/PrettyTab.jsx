import { useState } from 'react';
import { ChevronDown, ChevronRight, Copy, Search, Check } from 'lucide-react';

function JSONNode({ name, value, path = '', search, onCopyPath }) {
  const [expanded, setExpanded] = useState(true);
  const [copied, setCopied] = useState(false);

  const isObject = value !== null && typeof value === 'object';
  const isArray = Array.isArray(value);
  
  const handleCopyPath = (e) => {
    e.stopPropagation();
    onCopyPath(path);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const getCleanPath = () => {
    return path.startsWith('.') ? path.slice(1) : path;
  };

  const highlightText = (text, term) => {
    if (!term) return text;
    const parts = String(text).split(new RegExp(`(${term})`, 'gi'));
    return (
      <span>
        {parts.map((p, i) => 
          p.toLowerCase() === term.toLowerCase() 
            ? <mark key={i} className="bg-yellow-250 text-black px-0.5 rounded">{p}</mark> 
            : p
        )}
      </span>
    );
  };

  const matchSearch = (keyStr, valStr) => {
    if (!search) return false;
    const s = search.toLowerCase();
    return keyStr.toLowerCase().includes(s) || String(valStr).toLowerCase().includes(s);
  };

  if (!isObject) {
    let type = typeof value;
    if (value === null) type = 'null';
    
    let color = '#0284c7'; // string
    if (type === 'number') color = '#ea580c';
    if (type === 'boolean') color = '#16a34a';
    if (type === 'null') color = '#9ca3af';

    const valDisplay = type === 'string' ? `"${value}"` : String(value);
    const keyMatched = name ? name.toLowerCase().includes(search.toLowerCase()) : false;
    const valMatched = search ? String(value).toLowerCase().includes(search.toLowerCase()) : false;

    return (
      <div 
        className="flex items-center gap-1 py-0.5 pl-4 hover:bg-neutral-50 dark:hover:bg-neutral-900 rounded group relative select-text"
        style={{ fontSize: '12px' }}
      >
        {name && (
          <span 
            className="font-mono font-semibold" 
            style={{ 
              color: 'var(--color-text-primary)',
              background: keyMatched && search ? '#fef08a' : 'transparent' 
            }}
          >
            {name}:
          </span>
        )}
        <span 
          className="font-mono break-all pr-12" 
          style={{ 
            color,
            background: valMatched && search ? '#fef08a' : 'transparent'
          }}
        >
          {highlightText(valDisplay, search)}
        </span>
        {path && (
          <button
            onClick={handleCopyPath}
            title={`Copy JSON path: ${getCleanPath()}`}
            className="opacity-0 group-hover:opacity-100 absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 text-[9px] px-1.5 py-0.5 border rounded bg-white dark:bg-neutral-850 hover:bg-neutral-100 transition-opacity"
            style={{ color: 'var(--color-text-secondary)', borderColor: 'var(--color-border)' }}
          >
            {copied ? <Check size={8} className="text-green-600" /> : <Copy size={8} />}
            {copied ? 'Copied path' : 'Copy path'}
          </button>
        )}
      </div>
    );
  }

  const keys = Object.keys(value);
  const size = keys.length;

  return (
    <div className="pl-2">
      {/* Object/Array Header */}
      <div 
        className="flex items-center gap-1 py-0.5 cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-900 rounded group relative"
        onClick={() => setExpanded(!expanded)}
        style={{ fontSize: '12px' }}
      >
        {expanded ? <ChevronDown size={12} className="text-neutral-400" /> : <ChevronRight size={12} className="text-neutral-400" />}
        {name && (
          <span className="font-mono font-semibold" style={{ color: 'var(--color-text-primary)' }}>{name}:</span>
        )}
        <span className="text-[10px] text-neutral-400 font-mono">
          {isArray ? `Array[${size}]` : `Object{${size}}`}
        </span>
        {path && (
          <button
            onClick={handleCopyPath}
            title={`Copy JSON path: ${getCleanPath()}`}
            className="opacity-0 group-hover:opacity-100 absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 text-[9px] px-1.5 py-0.5 border rounded bg-white dark:bg-neutral-850 hover:bg-neutral-100 transition-opacity"
            style={{ color: 'var(--color-text-secondary)', borderColor: 'var(--color-border)' }}
          >
            {copied ? <Check size={8} className="text-green-600" /> : <Copy size={8} />}
            {copied ? 'Copied path' : 'Copy path'}
          </button>
        )}
      </div>

      {/* Children */}
      {expanded && (
        <div className="border-l pl-2 ml-1.5 space-y-0.5" style={{ borderColor: 'var(--color-border)' }}>
          {keys.map(k => {
            const childPath = isArray ? `${path}[${k}]` : `${path}.${k}`;
            return (
              <JSONNode
                key={k}
                name={isArray ? null : k}
                value={value[k]}
                path={childPath}
                search={search}
                onCopyPath={onCopyPath}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function PrettyTab({ store, onCopyPath }) {
  const { response } = store;
  const [search, setSearch] = useState('');

  if (!response) return null;

  const { parsedJson, body } = response;

  const handleCopyPathDefault = (path) => {
    const clean = path.startsWith('.') ? path.slice(1) : path;
    navigator.clipboard.writeText(clean);
  };

  const handleCopyPathFn = onCopyPath || handleCopyPathDefault;

  if (!parsedJson) {
    return (
      <pre className="text-xs p-3 rounded-lg overflow-x-auto font-mono leading-relaxed" 
           style={{ background: 'var(--color-surface-alt)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}>
        {body}
      </pre>
    );
  }

  return (
    <div className="space-y-3">
      {/* Search Bar */}
      <div className="relative w-64">
        <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-text-muted)' }} />
        <input
          type="text"
          placeholder="Filter keys or values..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-8 pr-3 py-1 text-xs rounded-lg focus:outline-none"
          style={{ background: 'var(--color-surface-alt)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}
        />
      </div>

      {/* Nodes Container */}
      <div className="p-3 border rounded-lg max-h-[400px] overflow-y-auto" style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}>
        <JSONNode 
          name="response" 
          value={parsedJson} 
          path="" 
          search={search} 
          onCopyPath={handleCopyPathFn} 
        />
      </div>
    </div>
  );
}
