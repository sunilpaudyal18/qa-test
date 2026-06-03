import { useState } from 'react';
import {
  Search, Plus, FolderPlus, ChevronRight, ChevronDown,
  Clock, Star, StarOff, Trash2, Globe2, MoreVertical, History,
  Layers, Download, Upload, BookOpen,
} from 'lucide-react';

const METHOD_COLORS = {
  GET: '#16A34A', POST: '#2563EB', PUT: '#D97706',
  PATCH: '#EA580C', DELETE: '#DC2626', HEAD: '#6B7280', OPTIONS: '#7C3AED',
};

const METHOD_BG = {
  GET: '#dcfce7', POST: '#dbeafe', PUT: '#fef9c3',
  PATCH: '#ffedd5', DELETE: '#fee2e2', HEAD: '#f3f4f6', OPTIONS: '#ede9fe',
};

function MethodBadge({ method }) {
  return (
    <span
      className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded shrink-0 tracking-wider"
      style={{ background: METHOD_COLORS[method] || '#6B7280', color: '#fff' }}
    >
      {method}
    </span>
  );
}

export default function LeftSidebar({
  store, onNewCollection, onImport, onOpenEnvManager,
}) {
  const {
    collections, savedRequests, history, favorites,
    activeRequest, searchQuery, setSearchQuery,
    activeLeftTab, setActiveLeftTab,
    activeEnv, setActiveEnv,
    learningMode,
    handleLoadRequest, toggleFavorite,
    toggleCollection, deleteCollection, addCollection,
  } = store;

  const [newColName, setNewColName] = useState('');
  const [showNewCol, setShowNewCol] = useState(false);
  const [hoveredReq, setHoveredReq] = useState(null);
  const [contextMenu, setContextMenu] = useState(null);

  const ENVS = ['DEV', 'QA', 'UAT', 'PROD'];
  const ENV_COLORS = { DEV: '#6366f1', QA: '#f59e0b', UAT: '#10b981', PROD: '#ef4444' };

  const filteredRequests = savedRequests.filter(r => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return r.name?.toLowerCase().includes(q) || r.url?.toLowerCase().includes(q) || r.method?.toLowerCase().includes(q);
  });

  const groupedByCollection = collections.map(col => ({
    ...col,
    requests: filteredRequests.filter(r => r.collection === col.name || r.collection === col.id),
  }));

  const ungrouped = filteredRequests.filter(r =>
    !collections.find(c => c.name === r.collection || c.id === r.collection)
  );

  const handleCreateCollection = () => {
    if (newColName.trim()) {
      addCollection(newColName.trim());
      setNewColName('');
      setShowNewCol(false);
    }
  };

  const TABS = [
    { id: 'collections', icon: Layers, label: 'Collections' },
    { id: 'history', icon: History, label: 'History' },
  ];

  return (
    <aside
      className="flex flex-col h-full border-r select-none"
      style={{
        background: 'var(--color-sidebar)',
        borderColor: 'var(--color-border)',
        minWidth: 0,
      }}
    >
      {/* Environment Switcher */}
      <div className="px-3 pt-3 pb-2">
        <div
          className="flex items-center gap-1 p-1 rounded-lg"
          style={{ background: 'var(--color-surface-alt)' }}
        >
          {ENVS.map(env => (
            <button
              key={env}
              onClick={() => setActiveEnv(env)}
              className="flex-1 text-[10px] font-semibold py-1 rounded-md transition-all"
              style={{
                background: activeEnv === env ? ENV_COLORS[env] : 'transparent',
                color: activeEnv === env ? '#fff' : 'var(--color-text-muted)',
              }}
            >
              {env}
            </button>
          ))}
        </div>
        {learningMode && (
          <p className="text-[10px] mt-1 px-1" style={{ color: 'var(--color-text-muted)' }}>
            💡 Environment variables like <code className="bg-blue-50 dark:bg-blue-950 text-blue-600 px-1 rounded">{'{{baseUrl}}'}</code> resolve to this env's values.
          </p>
        )}
      </div>

      {/* Search */}
      <div className="px-3 pb-2">
        <div className="relative">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-text-muted)' }} />
          <input
            type="text"
            placeholder="Search requests..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg focus:outline-none focus:ring-1"
            style={{
              background: 'var(--color-surface-alt)',
              border: '1px solid var(--color-border)',
              color: 'var(--color-text-primary)',
            }}
          />
        </div>
      </div>

      {/* Tab Switcher */}
      <div
        className="flex border-b px-3"
        style={{ borderColor: 'var(--color-border)' }}
      >
        {TABS.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveLeftTab(tab.id)}
              className="flex items-center gap-1.5 px-2 py-2 text-[11px] font-medium border-b-2 transition-colors"
              style={{
                borderColor: activeLeftTab === tab.id ? 'var(--color-primary)' : 'transparent',
                color: activeLeftTab === tab.id ? 'var(--color-primary)' : 'var(--color-text-muted)',
              }}
            >
              <Icon size={12} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Action Bar */}
      <div className="flex items-center gap-1 px-3 py-2">
        <button
          onClick={() => setShowNewCol(v => !v)}
          title="New Collection"
          className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium transition-colors"
          style={{
            background: 'var(--color-primary)',
            color: '#fff',
          }}
        >
          <FolderPlus size={11} />
          New
        </button>
        <button
          onClick={onImport}
          title="Import"
          className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium transition-colors"
          style={{
            background: 'var(--color-surface-alt)',
            color: 'var(--color-text-secondary)',
            border: '1px solid var(--color-border)',
          }}
        >
          <Upload size={11} />
          Import
        </button>
        <button
          onClick={onOpenEnvManager}
          title="Environment Manager"
          className="ml-auto p-1.5 rounded transition-colors"
          style={{ color: 'var(--color-text-muted)' }}
        >
          <Globe2 size={14} />
        </button>
      </div>

      {/* New Collection Input */}
      {showNewCol && (
        <div className="px-3 pb-2 flex gap-1">
          <input
            autoFocus
            type="text"
            placeholder="Collection name..."
            value={newColName}
            onChange={e => setNewColName(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleCreateCollection(); if (e.key === 'Escape') setShowNewCol(false); }}
            className="flex-1 px-2 py-1 text-xs rounded focus:outline-none"
            style={{
              background: 'var(--color-surface-alt)',
              border: '1px solid var(--color-primary)',
              color: 'var(--color-text-primary)',
            }}
          />
          <button
            onClick={handleCreateCollection}
            className="px-2 py-1 rounded text-xs text-white"
            style={{ background: 'var(--color-primary)' }}
          >
            Add
          </button>
        </div>
      )}

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto">

        {/* ── Collections Tab ── */}
        {activeLeftTab === 'collections' && (
          <div className="pb-4">
            {/* Grouped Collections */}
            {groupedByCollection.map(col => (
              <div key={col.id}>
                {/* Collection Header */}
                <div
                  className="flex items-center gap-1.5 px-3 py-1.5 cursor-pointer group"
                  style={{ color: 'var(--color-text-secondary)' }}
                  onClick={() => toggleCollection(col.id)}
                >
                  {col.expanded
                    ? <ChevronDown size={12} style={{ color: 'var(--color-text-muted)' }} />
                    : <ChevronRight size={12} style={{ color: 'var(--color-text-muted)' }} />
                  }
                  <BookOpen size={12} style={{ color: 'var(--color-primary)' }} />
                  <span className="text-xs font-semibold flex-1 truncate">{col.name}</span>
                  <span
                    className="text-[9px] px-1.5 py-0.5 rounded-full"
                    style={{ background: 'var(--color-surface-alt)', color: 'var(--color-text-muted)' }}
                  >
                    {col.requests.length}
                  </span>
                  <button
                    onClick={e => { e.stopPropagation(); deleteCollection(col.id); }}
                    className="opacity-0 group-hover:opacity-100 p-0.5 rounded transition-opacity"
                    style={{ color: 'var(--color-text-muted)' }}
                  >
                    <Trash2 size={10} />
                  </button>
                </div>

                {/* Collection Requests */}
                {col.expanded && col.requests.map(req => (
                  <RequestItem
                    key={req.id}
                    req={req}
                    active={activeRequest?.id === req.id}
                    isFavorite={favorites.includes(req.id)}
                    onLoad={handleLoadRequest}
                    onToggleFav={toggleFavorite}
                    hovered={hoveredReq === req.id}
                    setHovered={setHoveredReq}
                    indent={24}
                  />
                ))}
                {col.expanded && col.requests.length === 0 && (
                  <p className="text-[10px] pl-10 pr-3 py-1" style={{ color: 'var(--color-text-muted)' }}>
                    No requests
                  </p>
                )}
              </div>
            ))}

            {/* Ungrouped */}
            {ungrouped.length > 0 && (
              <div>
                <div className="px-3 py-1.5">
                  <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>
                    Uncategorized
                  </span>
                </div>
                {ungrouped.map(req => (
                  <RequestItem
                    key={req.id}
                    req={req}
                    active={activeRequest?.id === req.id}
                    isFavorite={favorites.includes(req.id)}
                    onLoad={handleLoadRequest}
                    onToggleFav={toggleFavorite}
                    hovered={hoveredReq === req.id}
                    setHovered={setHoveredReq}
                    indent={12}
                  />
                ))}
              </div>
            )}

            {filteredRequests.length === 0 && !searchQuery && (
              <div className="flex flex-col items-center gap-2 py-8 px-4 text-center">
                <Layers size={28} style={{ color: 'var(--color-text-muted)' }} />
                <p className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>No saved requests</p>
                <p className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>
                  Build a request and click Save to add it here.
                </p>
              </div>
            )}

            {filteredRequests.length === 0 && searchQuery && (
              <div className="flex flex-col items-center gap-2 py-8 px-4 text-center">
                <Search size={24} style={{ color: 'var(--color-text-muted)' }} />
                <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                  No results for "{searchQuery}"
                </p>
              </div>
            )}
          </div>
        )}

        {/* ── History Tab ── */}
        {activeLeftTab === 'history' && (
          <div className="pb-4">
            {history.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-8 px-4 text-center">
                <Clock size={28} style={{ color: 'var(--color-text-muted)' }} />
                <p className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>No history yet</p>
                <p className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>
                  Sent requests will appear here.
                </p>
              </div>
            ) : (
              history.map((h, i) => (
                <div
                  key={h.id || i}
                  className="flex items-center gap-2 px-3 py-2 cursor-pointer transition-colors"
                  style={{ color: 'var(--color-text-secondary)' }}
                  onClick={() => handleLoadRequest(h)}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--color-sidebar-item-hover)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <MethodBadge method={h.method || 'GET'} />
                  <span className="text-[11px] truncate flex-1" title={h.url}>{h.url}</span>
                  <Clock size={10} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Bottom: Env Manager shortcut */}
      <div
        className="px-3 py-2 border-t flex items-center gap-2"
        style={{ borderColor: 'var(--color-border)' }}
      >
        <div
          className="w-2 h-2 rounded-full flex-shrink-0"
          style={{ background: ENV_COLORS[activeEnv] }}
        />
        <span className="text-[11px] flex-1 truncate" style={{ color: 'var(--color-text-muted)' }}>
          {activeEnv} Environment
        </span>
        <button
          onClick={onOpenEnvManager}
          className="text-[10px] font-medium transition-colors"
          style={{ color: 'var(--color-primary)' }}
        >
          Manage
        </button>
      </div>
    </aside>
  );
}

function RequestItem({ req, active, isFavorite, onLoad, onToggleFav, hovered, setHovered, indent = 12 }) {
  return (
    <div
      className="flex items-center gap-2 py-1.5 pr-3 cursor-pointer group transition-all"
      style={{
        paddingLeft: `${indent}px`,
        background: active ? 'var(--color-sidebar-item-active)' : hovered ? 'var(--color-sidebar-item-hover)' : 'transparent',
        borderLeft: active ? '2px solid var(--color-primary)' : '2px solid transparent',
      }}
      onClick={() => onLoad(req)}
      onMouseEnter={() => setHovered(req.id)}
      onMouseLeave={() => setHovered(null)}
    >
      <MethodBadge method={req.method || 'GET'} />
      <span
        className="text-[11px] font-medium flex-1 truncate"
        style={{ color: active ? 'var(--color-primary)' : 'var(--color-text-secondary)' }}
      >
        {req.name}
      </span>
      <button
        onClick={e => { e.stopPropagation(); onToggleFav(req.id); }}
        className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5"
        style={{ color: isFavorite ? '#f59e0b' : 'var(--color-text-muted)' }}
      >
        {isFavorite ? <Star size={10} fill="currentColor" /> : <StarOff size={10} />}
      </button>
    </div>
  );
}
