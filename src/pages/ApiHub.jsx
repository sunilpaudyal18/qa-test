import { useState, useEffect } from 'react';
import { useApiHubStore } from './ApiHub/store/useApiHubStore';
import LeftSidebar from './ApiHub/components/LeftSidebar';
import WorkspaceCenter from './ApiHub/components/WorkspaceCenter';
import ResponsePanel from './ApiHub/components/ResponsePanel';
import AIAssistantPanel from './ApiHub/panels/AIAssistantPanel';
import EnvironmentManager from './ApiHub/panels/EnvironmentManager';
import LoadTestPanel from './ApiHub/panels/LoadTestPanel';
import MockServerPanel from './ApiHub/panels/MockServerPanel';
import ImportPanel from './ApiHub/panels/ImportPanel';
import { useToast } from '../contexts/ToastContext';
import { 
  Sidebar as SidebarIcon, Sparkles, Activity, Settings, 
  BookOpen, Plus, Save, Trash2, Key, HelpCircle, X 
} from 'lucide-react';

export default function ApiHub() {
  const toast = useToast();
  const store = useApiHubStore();

  const {
    url, method, response, loadRequests, loadHistory,
    learningMode, setLearningMode,
    leftSidebarCollapsed, setLeftSidebarCollapsed,
    environments, setEnvironments, activeEnv,
    handleSaveRequest, handleLoadRequest
  } = store;

  // Modals / Panels States
  const [showImport, setShowImport] = useState(false);
  const [showEnvManager, setShowEnvManager] = useState(false);
  const [showLoadTest, setShowLoadTest] = useState(false);
  const [showMockServer, setShowMockServer] = useState(false);
  const [showAiAssistant, setShowAiAssistant] = useState(false);
  
  // Custom Inline Modals
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [saveCollection, setSaveCollection] = useState('General');

  const [showExtractModal, setShowExtractModal] = useState(false);
  const [extractPath, setExtractPath] = useState('');
  const [extractVarName, setExtractVarName] = useState('');

  // Load request history on mount
  useEffect(() => {
    loadRequests();
    loadHistory();
  }, [loadRequests, loadHistory]);

  const handleOpenSaveModal = () => {
    setSaveName('');
    setShowSaveModal(true);
  };

  const handleSave = async () => {
    if (!saveName.trim()) {
      toast.warning('Enter a request name');
      return;
    }
    const success = await handleSaveRequest(saveName, saveCollection, toast);
    if (success) {
      setShowSaveModal(false);
    }
  };

  const handleExtractVariable = () => {
    if (!response || !response.parsedJson) {
      toast.warning('No JSON response available to extract variable from.');
      return;
    }
    if (!extractPath.trim()) {
      toast.warning('Please enter a JSON path.');
      return;
    }
    if (!extractVarName.trim()) {
      toast.warning('Please enter a variable name.');
      return;
    }

    try {
      // Evaluate value by path
      const parts = extractPath.split('.').filter(Boolean);
      let val = response.parsedJson;
      for (const p of parts) {
        if (val == null) { val = undefined; break; }
        // check array indexing
        const arrMatch = p.match(/^(\w+)\[(\d+)\]$/);
        if (arrMatch) {
          const key = arrMatch[1];
          const idx = parseInt(arrMatch[2]);
          val = val[key]?.[idx];
        } else {
          val = val[p];
        }
      }

      if (val === undefined) {
        toast.error(`Path "${extractPath}" returned undefined.`);
        return;
      }

      // Save to active environment
      setEnvironments(prev => ({
        ...prev,
        [activeEnv]: {
          ...prev[activeEnv],
          [extractVarName]: String(val)
        }
      }));

      toast.success(`Extracted "${extractVarName}" with value "${val}" to ${activeEnv} env!`);
      setShowExtractModal(false);
      setExtractPath('');
      setExtractVarName('');
    } catch (e) {
      toast.error('Extraction failed: ' + e.message);
    }
  };

  return (
    <div 
      className="-mx-4 lg:-mx-6 -mt-4 lg:-mt-6 border-b flex flex-col overflow-hidden bg-neutral-50 dark:bg-neutral-900 select-none"
      style={{ height: 'calc(100vh - 170px)', minHeight: '520px' }}
    >
      {/* Top Application Ribbon */}
      <div 
        className="flex items-center justify-between px-4 py-2 border-b bg-white dark:bg-neutral-950 flex-shrink-0"
        style={{ borderColor: 'var(--color-border)' }}
      >
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setLeftSidebarCollapsed(!leftSidebarCollapsed)}
            className="p-1.5 rounded-lg border hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}
            title="Toggle sidebar"
          >
            <SidebarIcon size={14} />
          </button>
          
          <div>
            <h1 className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5" style={{ color: 'var(--color-text-primary)' }}>
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
              API testing studio
            </h1>
            <p className="text-[9px]" style={{ color: 'var(--color-text-muted)' }}>Offline sandbox & client validation</p>
          </div>
        </div>

        {/* Feature Switches & Modals Buttons */}
        <div className="flex items-center gap-1.5">
          {/* Learning Mode Toggle */}
          <button
            onClick={() => setLearningMode(!learningMode)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-semibold border transition-all"
            style={{
              background: learningMode ? '#eff6ff' : 'transparent',
              borderColor: learningMode ? '#bfdbfe' : 'var(--color-border)',
              color: learningMode ? '#1d4ed8' : 'var(--color-text-secondary)',
            }}
          >
            <BookOpen size={12} />
            Learning Mode
          </button>

          {/* Load Test */}
          <button
            onClick={() => setShowLoadTest(true)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-semibold border hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all"
            style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}
          >
            <Activity size={12} className="text-red-500" />
            Load Test
          </button>

          {/* Mock Server */}
          <button
            onClick={() => setShowMockServer(true)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-semibold border hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all"
            style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}
          >
            <Settings size={12} className="text-orange-500" />
            Mock Server
          </button>

          {/* AI Assistant */}
          <button
            onClick={() => setShowAiAssistant(!showAiAssistant)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-semibold border hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all"
            style={{
              borderColor: showAiAssistant ? 'var(--color-primary)' : 'var(--color-border)',
              color: showAiAssistant ? 'var(--color-primary)' : 'var(--color-text-secondary)',
              background: showAiAssistant ? 'var(--color-surface-alt)' : 'transparent',
            }}
          >
            <Sparkles size={12} className="text-indigo-500 fill-indigo-200" />
            AI Helper
          </button>
        </div>
      </div>

      {/* Main 3-panel Work Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Panel 1: Left Sidebar */}
        {!leftSidebarCollapsed && (
          <div className="w-72 shrink-0 h-full flex flex-col border-r" style={{ borderColor: 'var(--color-border)' }}>
            <LeftSidebar 
              store={store} 
              onNewCollection={() => {}} 
              onImport={() => setShowImport(true)} 
              onOpenEnvManager={() => setShowEnvManager(true)} 
            />
          </div>
        )}

        {/* Panel 2: Center Workspace (HTTP requests builder) */}
        <div className="flex-1 h-full overflow-hidden border-r" style={{ borderColor: 'var(--color-border)' }}>
          <WorkspaceCenter 
            store={store} 
            onSave={handleOpenSaveModal} 
            toast={toast} 
          />
        </div>

        {/* Panel 3: Response Panel (renders fetch results) */}
        <div className="flex-1 h-full overflow-hidden">
          <ResponsePanel 
            store={store} 
            onExtractVarClick={() => setShowExtractModal(true)} 
            onCopyPath={(p) => {
              setExtractPath(p);
              setExtractVarName(p.split('.').pop() || 'var');
              setShowExtractModal(true);
            }}
            toast={toast} 
          />
        </div>
      </div>

      {/* Slide-out Panels & Overlay Modals */}
      <AIAssistantPanel 
        isOpen={showAiAssistant} 
        onClose={() => setShowAiAssistant(false)} 
        store={store} 
        toast={toast} 
      />

      <EnvironmentManager 
        isOpen={showEnvManager} 
        onClose={() => setShowEnvManager(false)} 
        store={store} 
        toast={toast} 
      />

      <LoadTestPanel 
        isOpen={showLoadTest} 
        onClose={() => setShowLoadTest(false)} 
        store={store} 
        toast={toast} 
      />

      <MockServerPanel 
        isOpen={showMockServer} 
        onClose={() => setShowMockServer(false)} 
        store={store} 
        toast={toast} 
      />

      <ImportPanel 
        isOpen={showImport} 
        onClose={() => setShowImport(false)} 
        store={store} 
        toast={toast} 
      />

      {/* Save Request Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-xs" onClick={() => setShowSaveModal(false)} />
          <div 
            className="relative w-full max-w-sm rounded-xl p-4 shadow-2xl space-y-4"
            style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
          >
            <div>
              <h3 className="text-xs font-bold" style={{ color: 'var(--color-text-primary)' }}>Save Current Request</h3>
              <p className="text-[10px] text-neutral-400">Add name and category to persist request in Collections.</p>
            </div>
            
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] font-semibold" style={{ color: 'var(--color-text-muted)' }}>Request Name</label>
                <input 
                  type="text"
                  value={saveName}
                  onChange={e => setSaveName(e.target.value)}
                  placeholder="e.g. Fetch Active Users"
                  className="w-full px-2.5 py-1.5 text-xs rounded border focus:outline-none"
                  style={{ background: 'var(--color-surface-alt)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-semibold" style={{ color: 'var(--color-text-muted)' }}>Collection Folder</label>
                <input 
                  type="text"
                  value={saveCollection}
                  onChange={e => setSaveCollection(e.target.value)}
                  placeholder="e.g. Users"
                  className="w-full px-2.5 py-1.5 text-xs rounded border focus:outline-none"
                  style={{ background: 'var(--color-surface-alt)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button 
                onClick={() => setShowSaveModal(false)}
                className="px-3.5 py-1.5 rounded-lg text-xs font-semibold border hover:bg-neutral-100 dark:hover:bg-neutral-850"
                style={{ color: 'var(--color-text-secondary)', borderColor: 'var(--color-border)' }}
              >
                Cancel
              </button>
              <button 
                onClick={handleSave}
                className="px-4 py-1.5 rounded-lg text-xs font-semibold text-white"
                style={{ background: 'var(--color-primary)' }}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Extract Variable Modal */}
      {showExtractModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-xs" onClick={() => setShowExtractModal(false)} />
          <div 
            className="relative w-full max-w-sm rounded-xl p-4 shadow-2xl space-y-4"
            style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
          >
            <div>
              <h3 className="text-xs font-bold" style={{ color: 'var(--color-text-primary)' }}>Extract JSON Variable</h3>
              <p className="text-[10px] text-neutral-400">Save response field values to current environment variables.</p>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] font-semibold" style={{ color: 'var(--color-text-muted)' }}>JSON Path</label>
                <input 
                  type="text"
                  value={extractPath}
                  onChange={e => setExtractPath(e.target.value)}
                  placeholder="e.g. data.users[0].id"
                  className="w-full px-2.5 py-1.5 text-xs font-mono rounded border focus:outline-none"
                  style={{ background: 'var(--color-surface-alt)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-semibold" style={{ color: 'var(--color-text-muted)' }}>Variable Name</label>
                <input 
                  type="text"
                  value={extractVarName}
                  onChange={e => setExtractVarName(e.target.value)}
                  placeholder="e.g. activeUserId"
                  className="w-full px-2.5 py-1.5 text-xs font-mono rounded border focus:outline-none"
                  style={{ background: 'var(--color-surface-alt)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button 
                onClick={() => setShowExtractModal(false)}
                className="px-3.5 py-1.5 rounded-lg text-xs font-semibold border hover:bg-neutral-100 dark:hover:bg-neutral-850"
                style={{ color: 'var(--color-text-secondary)', borderColor: 'var(--color-border)' }}
              >
                Cancel
              </button>
              <button 
                onClick={handleExtractVariable}
                className="px-4 py-1.5 rounded-lg text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500"
              >
                Extract & Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
