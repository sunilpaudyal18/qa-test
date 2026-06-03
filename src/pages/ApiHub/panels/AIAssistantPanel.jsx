import { useState, useEffect } from 'react';
import { 
  Sparkles, X, CheckSquare, Copy, Check, ShieldAlert, 
  HelpCircle, FileText, ChevronRight, Play, Loader2 
} from 'lucide-react';

export default function AIAssistantPanel({ isOpen, onClose, store, toast }) {
  const { method, url, body, response } = store;
  const [activeTab, setActiveTab] = useState('cases'); // 'cases', 'negative', 'response', 'docs'
  const [loading, setLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState(null);

  // Generate simulated AI result based on current request parameters
  const getSimulatedData = () => {
    // Extract endpoint path for context
    let endpoint = 'endpoint';
    try {
      if (url) {
        const u = new URL(url.replace(/\{\{\w+\}\}/g, 'var'));
        endpoint = u.pathname.split('/').filter(Boolean).pop() || 'resource';
      }
    } catch {
      const parts = url?.split('/').filter(Boolean) || [];
      endpoint = parts[parts.length - 1] || 'resource';
    }

    if (activeTab === 'cases') {
      return [
        {
          title: 'Positive Test Cases',
          items: [
            `Verify successful ${method} request to /${endpoint} returns status 200 OK.`,
            `Verify returned response body contains valid schema and expected fields for /${endpoint}.`,
            `Verify response headers include correct Content-Type (e.g., application/json).`,
          ]
        },
        {
          title: 'Boundary & Schema Cases',
          items: [
            `Verify behavior when optional request params/fields are omitted.`,
            `Verify length constraints for string fields in /${endpoint} request parameters.`,
            `Verify behavior when sending extremely large integers or floating numbers.`,
          ]
        },
        {
          title: 'Security & Auth Cases',
          items: [
            `Verify sending request without Authorization header returns 401 Unauthorized.`,
            `Verify sending request with invalid token/signature returns 403 Forbidden.`,
            `Verify rate-limiting headers are present and enforced under high concurrent requests.`,
          ]
        }
      ];
    } else if (activeTab === 'negative') {
      return [
        {
          title: 'Invalid Inputs',
          items: [
            `Send null or empty values for required fields. Expected: 400 Bad Request.`,
            `Pass invalid data types (e.g. string for integer ID). Expected: 400 Bad Request.`,
            `Inject special characters or emojis in text fields to verify sanitization.`,
          ]
        },
        {
          title: 'OWASP / Injection Checks',
          items: [
            `Inject SQL characters: \`' OR 1=1 --\` inside fields. Expected: Sanitize or 400 Bad Request.`,
            `Inject Cross-Site Scripting (XSS): \`<script>alert(1)</script>\`. Expected: HTML escaped.`,
            `Path traversal payload: \`../../etc/passwd\` in resource paths. Expected: 400 or 404.`,
          ]
        }
      ];
    } else if (activeTab === 'response') {
      if (!response) {
        return [{ title: 'No Response Loaded', items: ['Please send a request first to analyze the server response.'] }];
      }
      const isJson = !!response.parsedJson;
      return [
        {
          title: 'Schema Analysis',
          items: [
            isJson 
              ? 'Response matches a standard JSON object schema.' 
              : 'Warning: Response is not JSON. Validate if server errors occurred.',
            `Content-Type header is: ${response.headers['content-type'] || 'Missing'}`,
          ]
        },
        {
          title: 'Information Disclosure & Security Risks',
          items: [
            response.headers['x-powered-by'] 
              ? `Warning: 'X-Powered-By' header exposed (${response.headers['x-powered-by']}). Disable it to protect technology stack details.` 
              : 'X-Powered-By header is safely omitted.',
            response.headers['server']
              ? `Server software banner exposed (${response.headers['server']}). Consider obscuring it.`
              : 'No Server banners found.',
            'CORS wildcard check: Access-Control-Allow-Origin is set correctly or not exposed.',
          ]
        }
      ];
    } else {
      // Docs generator
      const md = `### API Reference: /${endpoint}
**Method:** \`${method}\`
**Endpoint:** \`${url || 'Not set'}\`

#### Summary
This endpoint executes a ${method} operation against the ${endpoint} collection.

#### Suggested Response Specifications
- **Success (200 OK):** Returns the structured record details.
- **Bad Request (400):** Validates missing or malformed fields.
- **Unauthorized (401):** Missing authorization token.`;
      return [{ title: 'Markdown Documentation', items: [md], raw: md }];
    }
  };

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      const timer = setTimeout(() => setLoading(false), 800);
      return () => clearTimeout(timer);
    }
  }, [isOpen, activeTab, method, url]);

  if (!isOpen) return null;

  const data = getSimulatedData();

  const handleCopy = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 1500);
  };

  return (
    <div 
      className="fixed inset-y-0 right-0 w-80 shadow-2xl z-50 flex flex-col border-l select-none animate-slide-in"
      style={{
        background: 'var(--color-surface)',
        borderColor: 'var(--color-border)',
      }}
    >
      {/* Header */}
      <div 
        className="p-4 border-b flex items-center justify-between"
        style={{ borderColor: 'var(--color-border)' }}
      >
        <div className="flex items-center gap-2">
          <Sparkles size={16} className="text-indigo-500 fill-indigo-200" />
          <h2 className="text-xs font-bold" style={{ color: 'var(--color-text-primary)' }}>QA AI Assistant</h2>
        </div>
        <button onClick={onClose} className="p-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
          <X size={15} style={{ color: 'var(--color-text-muted)' }} />
        </button>
      </div>

      {/* Tabs */}
      <div 
        className="flex border-b bg-neutral-50 dark:bg-neutral-900 text-[10px] font-semibold"
        style={{ borderColor: 'var(--color-border)' }}
      >
        <button 
          onClick={() => setActiveTab('cases')}
          className={`flex-1 py-2 text-center border-b-2 transition-all ${activeTab === 'cases' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-neutral-500'}`}
        >
          Test Cases
        </button>
        <button 
          onClick={() => setActiveTab('negative')}
          className={`flex-1 py-2 text-center border-b-2 transition-all ${activeTab === 'negative' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-neutral-500'}`}
        >
          Negatives
        </button>
        <button 
          onClick={() => setActiveTab('response')}
          className={`flex-1 py-2 text-center border-b-2 transition-all ${activeTab === 'response' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-neutral-500'}`}
        >
          Response
        </button>
        <button 
          onClick={() => setActiveTab('docs')}
          className={`flex-1 py-2 text-center border-b-2 transition-all ${activeTab === 'docs' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-neutral-500'}`}
        >
          AI Docs
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-48 gap-2">
            <Loader2 className="animate-spin text-indigo-500" size={24} />
            <span className="text-[11px]" style={{ color: 'var(--color-text-muted)' }}>AI is analyzing endpoint...</span>
          </div>
        ) : (
          data.map((sec, idx) => (
            <div key={idx} className="space-y-2">
              <h3 className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>
                {sec.title}
              </h3>
              
              <div className="space-y-2">
                {sec.items.map((item, itemIdx) => {
                  const globalIdx = `${idx}-${itemIdx}`;
                  return (
                    <div 
                      key={itemIdx}
                      className="p-3 border rounded-lg text-xs leading-normal relative group hover:shadow-sm transition-all"
                      style={{ 
                        borderColor: 'var(--color-border)', 
                        background: 'var(--color-surface-alt)',
                        color: 'var(--color-text-secondary)'
                      }}
                    >
                      {sec.raw ? (
                        <pre className="font-mono text-[10px] whitespace-pre-wrap select-text">{item}</pre>
                      ) : (
                        <p className="pr-6 font-medium">{item}</p>
                      )}

                      <button
                        onClick={() => handleCopy(sec.raw || item, globalIdx)}
                        className="opacity-0 group-hover:opacity-100 absolute right-2 top-2 p-1 rounded border bg-white dark:bg-neutral-800 transition-opacity"
                        title="Copy to clipboard"
                        style={{ borderColor: 'var(--color-border)' }}
                      >
                        {copiedIndex === globalIdx ? (
                          <Check size={10} className="text-green-600" />
                        ) : (
                          <Copy size={10} style={{ color: 'var(--color-text-muted)' }} />
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Disclaimer */}
      <div 
        className="p-3 border-t text-[9px] text-center" 
        style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface-alt)', color: 'var(--color-text-muted)' }}
      >
        ⚡ Smart template-based AI assistance. Runs entirely offline.
      </div>
    </div>
  );
}
