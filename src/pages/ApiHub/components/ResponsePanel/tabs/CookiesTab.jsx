export default function CookiesTab({ store }) {
  const { response } = store;

  if (!response) return null;

  const headers = response.headers || {};
  
  // Find set-cookie header (case insensitive)
  const setCookieKey = Object.keys(headers).find(k => k.toLowerCase() === 'set-cookie');
  const setCookieValue = setCookieKey ? headers[setCookieKey] : '';

  const parseCookies = (headerVal) => {
    if (!headerVal) return [];

    // In browser fetch, multiple set-cookie headers might be combined by commas.
    // However, Expires fields contain commas (e.g., Expires=Wed, 09 Jun 2021...).
    // A simple split by comma might break Expires. Let's do a smarter check.
    const cookies = [];
    
    // For simplicity, let's split by standard cookie separators but protect commas in date strings
    const parts = headerVal.split(/,(?=[^;]*=)/);
    
    parts.forEach(part => {
      const cookieObj = {
        name: '',
        value: '',
        domain: '-',
        path: '-',
        expires: '-',
        secure: false,
        httpOnly: false,
      };

      const directives = part.split(';').map(d => d.trim());
      
      // First directive is always key=value
      if (directives[0]) {
        const eqIdx = directives[0].indexOf('=');
        if (eqIdx !== -1) {
          cookieObj.name = directives[0].slice(0, eqIdx);
          cookieObj.value = directives[0].slice(eqIdx + 1);
        } else {
          cookieObj.name = directives[0];
        }
      }

      // Rest are parameters
      for (let i = 1; i < directives.length; i++) {
        const d = directives[i];
        const eqIdx = d.indexOf('=');
        const key = eqIdx !== -1 ? d.slice(0, eqIdx).trim().toLowerCase() : d.trim().toLowerCase();
        const val = eqIdx !== -1 ? d.slice(eqIdx + 1).trim() : '';

        if (key === 'domain') cookieObj.domain = val;
        else if (key === 'path') cookieObj.path = val;
        else if (key === 'expires') cookieObj.expires = val;
        else if (key === 'secure') cookieObj.secure = true;
        else if (key === 'httponly') cookieObj.httpOnly = true;
      }

      if (cookieObj.name) {
        cookies.push(cookieObj);
      }
    });

    return cookies;
  };

  const parsedCookies = parseCookies(setCookieValue);

  return (
    <div className="space-y-3">
      {parsedCookies.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center text-xs" style={{ color: 'var(--color-text-muted)' }}>
          <p className="font-medium">No cookies returned in response headers.</p>
          <p className="text-[10px] mt-1">
            Note: Standard browsers restrict access to <code className="bg-neutral-100 dark:bg-neutral-800 px-1 py-0.5 rounded">Set-Cookie</code> headers over CORS requests.
          </p>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden" style={{ borderColor: 'var(--color-border)' }}>
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr style={{ background: 'var(--color-surface-alt)', borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-muted)' }}>
                <th className="p-2 font-semibold">Cookie Name</th>
                <th className="p-2 font-semibold">Value</th>
                <th className="p-2 font-semibold">Domain</th>
                <th className="p-2 font-semibold">Path</th>
                <th className="p-2 font-semibold">Expires</th>
                <th className="p-2 font-semibold text-center">Secure</th>
                <th className="p-2 font-semibold text-center">HttpOnly</th>
              </tr>
            </thead>
            <tbody>
              {parsedCookies.map((cookie, idx) => (
                <tr key={idx} className="hover:bg-neutral-50 dark:hover:bg-neutral-900 border-b last:border-0" style={{ borderColor: 'var(--color-border)' }}>
                  <td className="p-2 font-mono font-semibold" style={{ color: 'var(--color-text-secondary)' }}>{cookie.name}</td>
                  <td className="p-2 font-mono break-all" style={{ color: 'var(--color-text-primary)' }}>{cookie.value}</td>
                  <td className="p-2 font-mono" style={{ color: 'var(--color-text-secondary)' }}>{cookie.domain}</td>
                  <td className="p-2 font-mono" style={{ color: 'var(--color-text-secondary)' }}>{cookie.path}</td>
                  <td className="p-2 text-neutral-500">{cookie.expires}</td>
                  <td className="p-2 text-center font-mono">
                    {cookie.secure ? <span className="text-green-600 font-bold">✓</span> : <span className="text-neutral-300">-</span>}
                  </td>
                  <td className="p-2 text-center font-mono">
                    {cookie.httpOnly ? <span className="text-green-600 font-bold">✓</span> : <span className="text-neutral-300">-</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
