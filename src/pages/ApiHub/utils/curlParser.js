/**
 * Parses a cURL command string into a request configuration object.
 */
export function parseCurl(curlStr) {
  const result = {
    method: 'GET',
    url: '',
    headers: [],
    body: '',
    bodyType: 'none',
    params: [],
    auth: { type: 'none' },
  };

  if (!curlStr?.trim()) return result;

  // Normalize multiline
  const str = curlStr.replace(/\\\n/g, ' ').replace(/\s+/g, ' ').trim();

  // URL
  const urlMatch = str.match(/curl\s+(?:'([^']+)'|"([^"]+)"|(\S+))/);
  if (urlMatch) {
    result.url = urlMatch[1] || urlMatch[2] || urlMatch[3];
  }

  // Method -X / --request
  const methodMatch = str.match(/(?:-X|--request)\s+['"]?(\w+)['"]?/);
  if (methodMatch) result.method = methodMatch[1].toUpperCase();

  // Headers -H / --header
  const headerRegex = /(?:-H|--header)\s+['"]([^'"]+)['"]/g;
  let hm;
  while ((hm = headerRegex.exec(str)) !== null) {
    const parts = hm[1].split(/:\s*/);
    if (parts.length >= 2) {
      const key = parts[0].trim();
      const value = parts.slice(1).join(': ').trim();
      result.headers.push({ enabled: true, key, value });

      // Auto-detect auth
      if (key.toLowerCase() === 'authorization') {
        if (value.startsWith('Bearer ')) {
          result.auth = { type: 'bearer', bearerToken: value.slice(7) };
        } else if (value.startsWith('Basic ')) {
          try {
            const decoded = atob(value.slice(6));
            const [user, pass] = decoded.split(':');
            result.auth = { type: 'basic', basicUsername: user, basicPassword: pass || '' };
          } catch {}
        }
      }
    }
  }

  // Body --data / -d / --data-raw / --data-binary
  const bodyMatch = str.match(/(?:--data(?:-raw|-binary|-urlencode)?|-d)\s+['"]?([\s\S]+?)['"]?\s*(?:-[A-Z]|--|\s*$)/);
  if (bodyMatch) {
    result.body = bodyMatch[1].trim().replace(/^['"]|['"]$/g, '');
    if (result.method === 'GET') result.method = 'POST';

    // Detect body type
    const ct = result.headers.find(h => h.key.toLowerCase() === 'content-type');
    if (ct?.value?.includes('json')) result.bodyType = 'json';
    else if (ct?.value?.includes('xml')) result.bodyType = 'xml';
    else if (ct?.value?.includes('x-www-form-urlencoded')) result.bodyType = 'form-urlencoded';
    else {
      // Try JSON parse
      try { JSON.parse(result.body); result.bodyType = 'json'; } catch { result.bodyType = 'raw'; }
    }
  }

  // Parse URL params
  try {
    const urlObj = new URL(result.url);
    urlObj.searchParams.forEach((value, key) => {
      result.params.push({ enabled: true, key, value, description: '' });
    });
    // Strip params from URL so they show in params tab
    if (result.params.length > 0) {
      result.url = `${urlObj.origin}${urlObj.pathname}`;
    }
  } catch {}

  if (!result.headers.length) result.headers = [{ enabled: true, key: '', value: '' }];
  if (!result.params.length) result.params = [{ enabled: true, key: '', value: '', description: '' }];

  return result;
}
