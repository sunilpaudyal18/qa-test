import { useState } from 'react';
import { Play, Code, BookOpen, FileCode } from 'lucide-react';

const PRE_REQUEST_SNIPPETS = [
  { label: 'Set env variable', code: 'pm.environment.set("variable_key", "variable_value");' },
  { label: 'Clear env variable', code: 'pm.environment.unset("variable_key");' },
  { label: 'Log current time', code: 'console.log("Current time: " + new Date().toISOString());' },
  { label: 'Send subrequest', code: 'fetch("https://api.example.com/auth").then(r => r.json()).then(d => pm.environment.set("token", d.token));' },
];

const POST_RESPONSE_SNIPPETS = [
  { label: 'Status code is 200', code: 'pm.test("Status is 200", () => pm.expect(pm.response.status).to.equal(200));' },
  { label: 'Response time < 200ms', code: 'pm.test("Response time is under 200ms", () => pm.expect(pm.response.time).to.be.below(200));' },
  { label: 'JSON content check', code: 'pm.test("Body has user ID", () => {\n  const json = pm.response.json();\n  pm.expect(json.id).to.exist;\n});' },
  { label: 'Parse response headers', code: 'pm.test("Content-Type header is JSON", () => {\n  pm.expect(pm.response.headers["content-type"]).to.include("application/json");\n});' },
  { label: 'Extract token to env', code: 'const data = pm.response.json();\npm.environment.set("token", data.accessToken);' },
];

export default function ScriptsTab({ store }) {
  const {
    preRequestScript, setPreRequestScript,
    postResponseScript, setPostResponseScript,
    learningMode
  } = store;

  const [activeSubTab, setActiveSubTab] = useState('pre'); // 'pre' or 'post'

  const activeScript = activeSubTab === 'pre' ? preRequestScript : postResponseScript;
  const setScript = activeSubTab === 'pre' ? setPreRequestScript : setPostResponseScript;
  const snippets = activeSubTab === 'pre' ? PRE_REQUEST_SNIPPETS : POST_RESPONSE_SNIPPETS;

  const insertSnippet = (code) => {
    setScript((prev) => {
      const trimmed = prev?.trim() || '';
      return trimmed ? `${trimmed}\n\n${code}` : code;
    });
  };

  return (
    <div className="space-y-3">
      {learningMode && (
        <div className="px-3 py-2 rounded-lg text-[11px]" style={{ background: '#eff6ff', border: '1px solid #bfdbfe', color: '#1d4ed8' }}>
          <strong>💡 Scripts</strong> allow adding custom JavaScript logic that runs either immediately before sending the request (Pre-request) or after getting the response (Post-response).
        </div>
      )}

      {/* Script Tab Switcher */}
      <div className="flex gap-2 border-b pb-1" style={{ borderColor: 'var(--color-border)' }}>
        <button
          onClick={() => setActiveSubTab('pre')}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border-b-2 transition-all"
          style={{
            borderColor: activeSubTab === 'pre' ? 'var(--color-primary)' : 'transparent',
            color: activeSubTab === 'pre' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
          }}
        >
          <FileCode size={13} />
          Pre-request Script
        </button>
        <button
          onClick={() => setActiveSubTab('post')}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border-b-2 transition-all"
          style={{
            borderColor: activeSubTab === 'post' ? 'var(--color-primary)' : 'transparent',
            color: activeSubTab === 'post' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
          }}
        >
          <Code size={13} />
          Post-response (Tests)
        </button>
      </div>

      <div className="flex gap-4">
        {/* Left Side: Editor Area */}
        <div className="flex-1 space-y-2">
          <div className="relative">
            <textarea
              value={activeScript || ''}
              onChange={(e) => setScript(e.target.value)}
              rows={12}
              spellCheck={false}
              placeholder={
                activeSubTab === 'pre'
                  ? '// Add javascript code here to run before request fires...'
                  : '// Add javascript code here to validate response and run tests...'
              }
              className="w-full px-4 py-3 text-xs font-mono rounded-lg focus:outline-none focus:ring-1 resize-y leading-relaxed"
              style={{
                background: 'var(--color-surface-alt)',
                border: '1px solid var(--color-border)',
                color: 'var(--color-text-primary)',
                fontFamily: 'ui-monospace, "Cascadia Code", Consolas, monospace',
                minHeight: 250,
                tabSize: 2,
              }}
            />
            <span
              className="absolute top-2 right-2 text-[9px] font-bold uppercase px-1.5 py-0.5 rounded"
              style={{ background: '#dbeafe', color: '#1d4ed8' }}
            >
              JS
            </span>
          </div>
        </div>

        {/* Right Side: Snippets Picker */}
        <div className="w-64 shrink-0 space-y-2">
          <div className="flex items-center gap-1.5 px-1 py-0.5">
            <BookOpen size={12} style={{ color: 'var(--color-text-muted)' }} />
            <span className="text-[10px] uppercase font-bold tracking-wider" style={{ color: 'var(--color-text-muted)' }}>
              Snippets Presets
            </span>
          </div>
          <div
            className="border rounded-lg p-2 max-h-60 overflow-y-auto space-y-1.5"
            style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}
          >
            {snippets.map((snip) => (
              <button
                key={snip.label}
                onClick={() => insertSnippet(snip.code)}
                className="w-full text-left px-2 py-1.5 text-[10px] font-medium rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                style={{ color: 'var(--color-text-secondary)', border: '1px solid transparent' }}
              >
                {snip.label}
              </button>
            ))}
          </div>
          <p className="text-[9px] px-1 text-center" style={{ color: 'var(--color-text-muted)' }}>
            Clicking a snippet appends it to the end of the script box.
          </p>
        </div>
      </div>
    </div>
  );
}
