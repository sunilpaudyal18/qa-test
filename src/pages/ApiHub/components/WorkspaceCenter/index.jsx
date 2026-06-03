import { useState } from 'react';
import RequestBar from './RequestBar';
import ParamsTab from './tabs/ParamsTab';
import HeadersTab from './tabs/HeadersTab';
import AuthTab from './tabs/AuthTab';
import BodyTab from './tabs/BodyTab';
import TestsTab from './tabs/TestsTab';
import ScriptsTab from './tabs/ScriptsTab';
import DocsTab from './tabs/DocsTab';
import { 
  SlidersHorizontal, CheckSquare, FileText, Code2, 
  Settings, KeyRound, Database, FileSpreadsheet 
} from 'lucide-react';

const TABS = [
  { id: 'params', label: 'Params', icon: SlidersHorizontal },
  { id: 'headers', label: 'Headers', icon: Settings },
  { id: 'auth', label: 'Auth', icon: KeyRound },
  { id: 'body', label: 'Body', icon: Database },
  { id: 'tests', label: 'Tests', icon: CheckSquare },
  { id: 'scripts', label: 'Scripts', icon: Code2 },
  { id: 'docs', label: 'Docs', icon: FileText },
];

export default function WorkspaceCenter({ store, onSave, toast }) {
  const { activeRequestTab, setActiveRequestTab } = store;

  return (
    <div 
      className="flex flex-col h-full overflow-hidden"
      style={{ background: 'var(--color-surface)' }}
    >
      {/* Upper request bar section */}
      <div className="p-4 border-b flex-shrink-0" style={{ borderColor: 'var(--color-border)' }}>
        <RequestBar store={store} onSave={onSave} toast={toast} />
      </div>

      {/* Tabs navigation row */}
      <div 
        className="flex items-center px-4 border-b bg-neutral-50 dark:bg-neutral-900 flex-shrink-0"
        style={{ borderColor: 'var(--color-border)' }}
      >
        <div className="flex gap-1">
          {TABS.map(t => {
            const Icon = t.icon;
            const isActive = activeRequestTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActiveRequestTab(t.id)}
                className="flex items-center gap-1.5 px-3 py-2.5 text-xs font-semibold border-b-2 transition-all"
                style={{
                  borderColor: isActive ? 'var(--color-primary)' : 'transparent',
                  color: isActive ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                }}
              >
                <Icon size={12} />
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Tab Scrollable Content Container */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeRequestTab === 'params' && <ParamsTab store={store} />}
        {activeRequestTab === 'headers' && <HeadersTab store={store} />}
        {activeRequestTab === 'auth' && <AuthTab store={store} />}
        {activeRequestTab === 'body' && <BodyTab store={store} />}
        {activeRequestTab === 'tests' && <TestsTab store={store} />}
        {activeRequestTab === 'scripts' && <ScriptsTab store={store} />}
        {activeRequestTab === 'docs' && <DocsTab store={store} />}
      </div>
    </div>
  );
}
