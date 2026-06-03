import { FileText, Copy, Check, Terminal } from 'lucide-react';
import { useState } from 'react';

export default function DocsTab({ store }) {
  const {
    method, url, params, headers, auth, bodyType, body, assertions, learningMode
  } = store;

  const [copied, setCopied] = useState(false);

  const generateCurl = () => {
    let curl = `curl --request ${method} \\\n  --url '${url || 'https://api.example.com/resource'}'`;
    
    // Add headers
    const enabledHeaders = headers.filter(h => h.enabled && h.key.trim());
    enabledHeaders.forEach(h => {
      curl += ` \\\n  --header '${h.key}: ${h.value}'`;
    });

    if (auth.type === 'bearer' && auth.bearerToken) {
      curl += ` \\\n  --header 'Authorization: Bearer ${auth.bearerToken}'`;
    } else if (auth.type === 'basic' && auth.basicUsername) {
      const b64 = btoa(`${auth.basicUsername}:${auth.basicPassword}`);
      curl += ` \\\n  --header 'Authorization: Basic ${b64}'`;
    }

    // Add body
    if (bodyType !== 'none' && body && !['GET', 'HEAD'].includes(method)) {
      if (bodyType === 'json') {
        curl += ` \\\n  --header 'Content-Type: application/json'`;
        curl += ` \\\n  --data '${body.replace(/'/g, "'\\''")}'`;
      } else if (bodyType === 'xml') {
        curl += ` \\\n  --header 'Content-Type: application/xml'`;
        curl += ` \\\n  --data '${body.replace(/'/g, "'\\''")}'`;
      } else if (bodyType === 'form-urlencoded') {
        curl += ` \\\n  --header 'Content-Type: application/x-www-form-urlencoded'`;
        try {
          const parsed = JSON.parse(body);
          const formStr = parsed.map(r => `${encodeURIComponent(r.key)}=${encodeURIComponent(r.value)}`).join('&');
          curl += ` \\\n  --data '${formStr}'`;
        } catch {
          curl += ` \\\n  --data '${body.replace(/'/g, "'\\''")}'`;
        }
      } else {
        curl += ` \\\n  --data '${body.replace(/'/g, "'\\''")}'`;
      }
    }

    return curl;
  };

  const generateMarkdown = () => {
    let md = `# ${method} API Endpoint\n\n`;
    md += `**URL:** \`${url || 'Not Specified'}\`  \n`;
    md += `**Method:** \`${method}\`  \n\n`;

    // Query Parameters
    const enabledParams = params.filter(p => p.enabled && p.key.trim());
    if (enabledParams.length > 0) {
      md += `## Query Parameters\n\n`;
      md += `| Parameter | Value | Description |\n`;
      md += `| :--- | :--- | :--- |\n`;
      enabledParams.forEach(p => {
        md += `| \`${p.key}\` | \`${p.value}\` | ${p.description || '-'} |\n`;
      });
      md += `\n`;
    }

    // Headers
    const enabledHeaders = headers.filter(h => h.enabled && h.key.trim());
    if (enabledHeaders.length > 0 || auth.type !== 'none') {
      md += `## Headers\n\n`;
      md += `| Header | Value | Description |\n`;
      md += `| :--- | :--- | :--- |\n`;
      if (auth.type === 'bearer') {
        md += `| \`Authorization\` | \`Bearer *****\` | Bearer Authentication Token |\n`;
      } else if (auth.type === 'basic') {
        md += `| \`Authorization\` | \`Basic *****\` | Basic Authentication credentials |\n`;
      }
      enabledHeaders.forEach(h => {
        md += `| \`${h.key}\` | \`${h.value}\` | ${h.description || '-'} |\n`;
      });
      md += `\n`;
    }

    // Body
    if (bodyType !== 'none' && body && !['GET', 'HEAD'].includes(method)) {
      md += `## Request Body (${bodyType.toUpperCase()})\n\n`;
      md += `\`\`\`${bodyType === 'json' ? 'json' : bodyType === 'xml' ? 'xml' : 'text'}\n`;
      md += `${body}\n`;
      md += `\`\`\`\n\n`;
    }

    // Assertions
    if (assertions && assertions.length > 0) {
      md += `## QA Tests & Assertions\n\n`;
      assertions.forEach((a, idx) => {
        md += `${idx + 1}. **${a.type.replace(/_/g, ' ').toUpperCase()}**: Matches value \`${a.value || ''}\`\n`;
      });
      md += `\n`;
    }

    // cURL Example
    md += `## cURL Command Example\n\n`;
    md += `\`\`\`bash\n`;
    md += `${generateCurl()}\n`;
    md += `\`\`\`\n`;

    return md;
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generateMarkdown());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const activeParams = params.filter(p => p.enabled && p.key.trim());
  const activeHeaders = headers.filter(h => h.enabled && h.key.trim());

  return (
    <div className="space-y-4">
      {learningMode && (
        <div className="px-3 py-2 rounded-lg text-[11px]" style={{ background: '#eff6ff', border: '1px solid #bfdbfe', color: '#1d4ed8' }}>
          <strong>💡 Documentation</strong> is auto-generated in Markdown format from the active parameters, headers, body, authentication and test assertions of this request.
        </div>
      )}

      {/* Docs Action Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <FileText size={14} style={{ color: 'var(--color-primary)' }} />
          <span className="text-xs font-semibold" style={{ color: 'var(--color-text-secondary)' }}>Auto-Generated Documentation</span>
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all"
          style={{
            background: copied ? '#dcfce7' : 'var(--color-surface)',
            color: copied ? '#15803d' : 'var(--color-text-secondary)',
            borderColor: copied ? '#bbf7d0' : 'var(--color-border)',
          }}
        >
          {copied ? <Check size={12} /> : <Copy size={12} />}
          {copied ? 'Copied MD!' : 'Copy Markdown'}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Left Column: Visual Preview */}
        <div className="border rounded-lg p-4 space-y-4 max-h-[450px] overflow-y-auto" style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded text-white" style={{ background: method === 'GET' ? '#16a34a' : method === 'POST' ? '#2563eb' : '#d97706' }}>{method}</span>
              <code className="text-xs font-semibold break-all" style={{ color: 'var(--color-text-primary)' }}>{url || 'https://api.example.com/...'}</code>
            </div>
            <div className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>Auto-generated request schema documentation.</div>
          </div>

          {activeParams.length > 0 && (
            <div className="space-y-1.5">
              <h4 className="text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>Query Parameters</h4>
              <div className="border rounded-md overflow-hidden text-xs" style={{ borderColor: 'var(--color-border)' }}>
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr style={{ background: 'var(--color-surface-alt)', borderBottom: '1px solid var(--color-border)' }}>
                      <th className="p-2 font-semibold">Param</th>
                      <th className="p-2 font-semibold">Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeParams.map((p, idx) => (
                      <tr key={idx} style={{ borderBottom: idx < activeParams.length - 1 ? '1px solid var(--color-border)' : 'none' }}>
                        <td className="p-2 font-mono">{p.key}</td>
                        <td className="p-2 font-mono text-neutral-600 dark:text-neutral-300">{p.value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeHeaders.length > 0 && (
            <div className="space-y-1.5">
              <h4 className="text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>Headers</h4>
              <div className="border rounded-md overflow-hidden text-xs" style={{ borderColor: 'var(--color-border)' }}>
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr style={{ background: 'var(--color-surface-alt)', borderBottom: '1px solid var(--color-border)' }}>
                      <th className="p-2 font-semibold">Header</th>
                      <th className="p-2 font-semibold">Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeHeaders.map((h, idx) => (
                      <tr key={idx} style={{ borderBottom: idx < activeHeaders.length - 1 ? '1px solid var(--color-border)' : 'none' }}>
                        <td className="p-2 font-mono">{h.key}</td>
                        <td className="p-2 font-mono text-neutral-600 dark:text-neutral-300">{h.value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {bodyType !== 'none' && body && (
            <div className="space-y-1.5">
              <h4 className="text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>Request Body ({bodyType.toUpperCase()})</h4>
              <pre className="text-xs p-3 rounded-lg overflow-x-auto border leading-relaxed font-mono max-h-48"
                   style={{ background: 'var(--color-surface-alt)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}>
                {body}
              </pre>
            </div>
          )}
        </div>

        {/* Right Column: Code Snippet cURL */}
        <div className="flex flex-col border rounded-lg max-h-[450px] overflow-hidden" style={{ borderColor: 'var(--color-border)' }}>
          <div className="flex items-center gap-1.5 px-3 py-2 border-b" style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface-alt)' }}>
            <Terminal size={12} style={{ color: 'var(--color-text-muted)' }} />
            <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>Equivalent cURL Command</span>
          </div>
          <pre className="flex-1 p-3 text-[11px] font-mono overflow-auto leading-relaxed select-all"
               style={{ background: '#0f172a', color: '#cbd5e1' }}>
            {generateCurl()}
          </pre>
        </div>
      </div>
    </div>
  );
}
