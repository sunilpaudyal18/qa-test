import { useState, useCallback, useRef } from 'react';
import { apiRequestService } from '../../../services/apiRequestService';

const DEFAULT_PARAMS = [{ enabled: true, key: '', value: '', description: '' }];
const DEFAULT_HEADERS = [{ enabled: true, key: '', value: '' }];
const DEFAULT_AUTH = {
  type: 'none',
  bearerToken: '',
  basicUsername: '',
  basicPassword: '',
  apiKeyName: 'X-API-Key',
  apiKeyValue: '',
  apiKeyIn: 'header',
  jwtToken: '',
  oauth2Token: '',
};
const DEFAULT_ENVS = {
  DEV: { baseUrl: 'https://api.dev.example.com', token: '', userId: '1001' },
  QA:  { baseUrl: 'https://api.qa.example.com',  token: '', userId: '2001' },
  UAT: { baseUrl: 'https://api.uat.example.com', token: '', userId: '3001' },
  PROD:{ baseUrl: 'https://api.example.com',     token: '', userId: '4001' },
};

function resolveEnvVars(str, vars) {
  if (!str) return str;
  return str.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? `{{${key}}}`);
}

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

function formatTime(ms) {
  if (ms < 1000) return `${ms} ms`;
  return `${(ms / 1000).toFixed(2)} s`;
}

export function useApiHubStore() {
  // ── Request state ─────────────────────────────────────────────
  const [method, setMethod] = useState('GET');
  const [url, setUrl] = useState('');
  const [params, setParams] = useState(DEFAULT_PARAMS);
  const [headers, setHeaders] = useState(DEFAULT_HEADERS);
  const [auth, setAuth] = useState(DEFAULT_AUTH);
  const [bodyType, setBodyType] = useState('none');
  const [body, setBody] = useState('');
  const [assertions, setAssertions] = useState([]);
  const [preRequestScript, setPreRequestScript] = useState('// Pre-request script\n// pm.environment.set("token", "your-token");');
  const [postResponseScript, setPostResponseScript] = useState('// Post-response script\n// const json = pm.response.json();\n// pm.test("Status is 200", () => pm.expect(pm.response.status).to.equal(200));');

  // ── Response state ────────────────────────────────────────────
  const [response, setResponse] = useState(null);
  const [responseTime, setResponseTime] = useState(null);
  const [responseSize, setResponseSize] = useState(null);
  const [sending, setSending] = useState(false);
  const [testResults, setTestResults] = useState([]);

  // ── Tab state ─────────────────────────────────────────────────
  const [activeRequestTab, setActiveRequestTab] = useState('params');
  const [activeResponseTab, setActiveResponseTab] = useState('pretty');

  // ── Collections & Requests ───────────────────────────────────
  const [collections, setCollections] = useState([
    { id: 'auth', name: 'Authentication', expanded: true },
    { id: 'users', name: 'Users', expanded: false },
    { id: 'orders', name: 'Orders', expanded: false },
  ]);
  const [savedRequests, setSavedRequests] = useState([]);
  const [history, setHistory] = useState([]);
  const [activeRequest, setActiveRequest] = useState(null);
  const [favorites, setFavorites] = useState([]);

  // ── Environment ───────────────────────────────────────────────
  const [environments, setEnvironments] = useState(DEFAULT_ENVS);
  const [activeEnv, setActiveEnv] = useState('DEV');

  // ── UI state ──────────────────────────────────────────────────
  const [learningMode, setLearningMode] = useState(false);
  const [aiPanelOpen, setAiPanelOpen] = useState(false);
  const [leftSidebarCollapsed, setLeftSidebarCollapsed] = useState(() => {
    try { return window.innerWidth < 1024; } catch { return false; }
  });
  const [rightPanelCollapsed, setRightPanelCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeLeftTab, setActiveLeftTab] = useState('collections');

  // ── Mocks ─────────────────────────────────────────────────────
  const [mocks, setMocks] = useState([]);

  // ── Load Test ─────────────────────────────────────────────────
  const [loadTestResults, setLoadTestResults] = useState(null);
  const [loadTestRunning, setLoadTestRunning] = useState(false);

  const abortRef = useRef(null);

  // ── Computed ──────────────────────────────────────────────────
  const activeEnvVars = environments[activeEnv] || {};

  const resolvedUrl = resolveEnvVars(url, activeEnvVars);

  // ── Data loaders ──────────────────────────────────────────────
  const loadRequests = useCallback(async () => {
    try {
      const reqs = await apiRequestService.getAll();
      setSavedRequests(reqs.filter(r => r.name !== '__history__'));
    } catch {}
  }, []);

  const loadHistory = useCallback(async () => {
    try {
      const db = (await import('../../../db/db')).default;
      const h = await db.apiRequests
        .where('name').equals('__history__')
        .toArray();
      setHistory(h.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 30));
    } catch {}
  }, []);

  // ── Request execution ─────────────────────────────────────────
  const handleSend = useCallback(async (toast) => {
    if (!url.trim()) { toast?.warning('Please enter a URL'); return; }
    setSending(true);
    setResponse(null);
    setTestResults([]);

    // Intercept with mock server if matching active mock is found
    const activeMock = mocks.find(m => m.enabled && m.path && resolvedUrl.endsWith(m.path) && method === m.method);
    if (activeMock) {
      setTimeout(() => {
        let parsedJson = null;
        try { parsedJson = JSON.parse(activeMock.body); } catch {}
        const responseObj = {
          status: activeMock.status || 200,
          statusText: 'Mock Response',
          headers: { 'content-type': 'application/json', 'x-mock-server': 'local-in-memory' },
          body: activeMock.body,
          rawBody: activeMock.body,
          parsedJson,
          timings: { dns: 0, tcp: 0, tls: 0, request: 0, server: 5, response: 2, total: 7 }
        };
        setResponse(responseObj);
        
        if (assertions.length > 0) {
          const results = runAssertions(assertions, responseObj, 7);
          setTestResults(results);
        }
        setSending(false);
      }, 250);
      return;
    }

    const start = performance.now();
    try {
      // Build headers
      const hdrs = {};
      headers.filter(h => h.enabled && h.key.trim()).forEach(h => {
        hdrs[h.key.trim()] = resolveEnvVars(h.value, activeEnvVars);
      });

      // Apply auth
      if (auth.type === 'bearer' && auth.bearerToken) {
        hdrs['Authorization'] = `Bearer ${resolveEnvVars(auth.bearerToken, activeEnvVars)}`;
      } else if (auth.type === 'basic' && auth.basicUsername) {
        const b64 = btoa(`${auth.basicUsername}:${auth.basicPassword}`);
        hdrs['Authorization'] = `Basic ${b64}`;
      } else if (auth.type === 'apikey' && auth.apiKeyName && auth.apiKeyIn === 'header') {
        hdrs[auth.apiKeyName] = resolveEnvVars(auth.apiKeyValue, activeEnvVars);
      } else if (auth.type === 'jwt' && auth.jwtToken) {
        hdrs['Authorization'] = `Bearer ${auth.jwtToken}`;
      }

      const opts = { method, headers: hdrs };

      if (!['GET', 'HEAD'].includes(method) && bodyType !== 'none' && body.trim()) {
        opts.body = body;
        if (bodyType === 'json' && !hdrs['Content-Type']) {
          opts.headers['Content-Type'] = 'application/json';
        } else if (bodyType === 'xml' && !hdrs['Content-Type']) {
          opts.headers['Content-Type'] = 'application/xml';
        } else if (bodyType === 'form-urlencoded' && !hdrs['Content-Type']) {
          opts.headers['Content-Type'] = 'application/x-www-form-urlencoded';
        }
      }

      // Build URL with params
      let finalUrl = resolvedUrl;
      const enabledParams = params.filter(p => p.enabled && p.key.trim());
      if (enabledParams.length) {
        const qs = enabledParams.map(p =>
          `${encodeURIComponent(p.key)}=${encodeURIComponent(resolveEnvVars(p.value, activeEnvVars))}`
        ).join('&');
        finalUrl += (finalUrl.includes('?') ? '&' : '?') + qs;
      }

      const controller = new AbortController();
      abortRef.current = controller;
      opts.signal = controller.signal;

      const timings = { start };
      const res = await fetch(finalUrl, opts);
      timings.responseStart = performance.now();

      const text = await res.text();
      const end = performance.now();

      const elapsed = Math.round(end - start);
      const size = new Blob([text]).size;
      setResponseTime(elapsed);
      setResponseSize(size);

      let formatted = text;
      let parsedJson = null;
      try {
        parsedJson = JSON.parse(text);
        formatted = JSON.stringify(parsedJson, null, 2);
      } catch {}

      const responseHeaders = {};
      res.headers.forEach((v, k) => { responseHeaders[k] = v; });

      const responseObj = {
        status: res.status,
        statusText: res.statusText,
        headers: responseHeaders,
        body: formatted,
        rawBody: text,
        parsedJson,
        timings: {
          dns: 0,
          tcp: 12,
          tls: res.url.startsWith('https') ? 28 : 0,
          request: 8,
          server: Math.round((timings.responseStart - start) * 0.7),
          response: Math.round(end - timings.responseStart),
          total: elapsed,
        },
      };
      setResponse(responseObj);

      // Run visual assertions
      if (assertions.length > 0) {
        const results = runAssertions(assertions, responseObj, elapsed);
        setTestResults(results);
      }

    } catch (err) {
      if (err.name === 'AbortError') return;
      const end = performance.now();
      setResponseTime(Math.round(end - start));
      setResponse({
        status: 0,
        statusText: 'Network Error',
        headers: {},
        body: err.message,
        rawBody: err.message,
        parsedJson: null,
        timings: { dns: 0, tcp: 0, tls: 0, request: 0, server: 0, response: 0, total: Math.round(end - start) },
      });
    } finally {
      setSending(false);
    }

    // Save to history
    try {
      const db = (await import('../../../db/db')).default;
      await db.apiRequests.add({
        name: '__history__',
        method, url, headers, body, bodyType, auth, params,
        collection: '__history__',
        createdAt: new Date().toISOString(),
      });
      loadHistory();
    } catch {}
  }, [url, method, headers, body, bodyType, auth, params, activeEnvVars, assertions, resolvedUrl, loadHistory, mocks]);

  const cancelRequest = useCallback(() => {
    abortRef.current?.abort();
    setSending(false);
  }, []);

  // ── Save / Load ───────────────────────────────────────────────
  const handleSaveRequest = useCallback(async (name, collection, toast) => {
    if (!name?.trim()) { toast?.warning('Enter a request name'); return false; }
    try {
      await apiRequestService.create({
        name: name.trim(),
        method, url, headers, body, bodyType, auth, params,
        assertions, preRequestScript, postResponseScript,
        collection: collection || '',
        isFavorite: false,
      });
      toast?.success('Request saved');
      loadRequests();
      return true;
    } catch {
      toast?.error('Failed to save request');
      return false;
    }
  }, [method, url, headers, body, bodyType, auth, params, assertions, preRequestScript, postResponseScript, loadRequests]);

  const handleLoadRequest = useCallback((req) => {
    setMethod(req.method || 'GET');
    setUrl(req.url || '');
    setHeaders(req.headers?.length ? req.headers : DEFAULT_HEADERS);
    setBodyType(req.bodyType || 'none');
    setBody(req.body || '');
    setAuth(req.auth || DEFAULT_AUTH);
    setParams(req.params?.length ? req.params : DEFAULT_PARAMS);
    setAssertions(req.assertions || []);
    setPreRequestScript(req.preRequestScript || '');
    setPostResponseScript(req.postResponseScript || '');
    setActiveRequest(req);
    setActiveRequestTab('params');
    setResponse(null);
  }, []);

  const toggleFavorite = useCallback((id) => {
    setFavorites(prev =>
      prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
    );
  }, []);

  // ── Collections ───────────────────────────────────────────────
  const addCollection = useCallback((name) => {
    const id = `col_${Date.now()}`;
    setCollections(prev => [...prev, { id, name, expanded: true }]);
  }, []);

  const toggleCollection = useCallback((id) => {
    setCollections(prev =>
      prev.map(c => c.id === id ? { ...c, expanded: !c.expanded } : c)
    );
  }, []);

  const deleteCollection = useCallback((id) => {
    setCollections(prev => prev.filter(c => c.id !== id));
  }, []);

  // ── Environment ───────────────────────────────────────────────
  const updateEnvVar = useCallback((env, key, value) => {
    setEnvironments(prev => ({
      ...prev,
      [env]: { ...prev[env], [key]: value },
    }));
  }, []);

  const deleteEnvVar = useCallback((env, key) => {
    setEnvironments(prev => {
      const copy = { ...prev[env] };
      delete copy[key];
      return { ...prev, [env]: copy };
    });
  }, []);

  // ── Load Testing ──────────────────────────────────────────────
  const runLoadTest = useCallback(async ({ virtualUsers, iterations, duration }) => {
    if (!url.trim()) return;
    setLoadTestRunning(true);
    setLoadTestResults(null);

    const results = [];
    const targetMs = duration * 1000;
    const startAll = performance.now();

    const runOne = async () => {
      const t0 = performance.now();
      try {
        const hdrs = {};
        headers.filter(h => h.enabled && h.key.trim()).forEach(h => { hdrs[h.key.trim()] = h.value; });
        await fetch(resolvedUrl, { method, headers: hdrs });
        return { time: Math.round(performance.now() - t0), success: true };
      } catch {
        return { time: Math.round(performance.now() - t0), success: false };
      }
    };

    const maxIterations = iterations || 999999;
    let count = 0;

    while (performance.now() - startAll < targetMs && count < maxIterations) {
      const batch = Array.from({ length: Math.min(virtualUsers, maxIterations - count) }, () => runOne());
      const batchResults = await Promise.all(batch);
      results.push(...batchResults);
      count += batchResults.length;
      if (!duration && count >= maxIterations) break;
    }

    const times = results.map(r => r.time);
    const failures = results.filter(r => !r.success).length;
    const totalTime = performance.now() - startAll;

    setLoadTestResults({
      total: results.length,
      passed: results.length - failures,
      failed: failures,
      avgTime: Math.round(times.reduce((a, b) => a + b, 0) / times.length),
      minTime: Math.min(...times),
      maxTime: Math.max(...times),
      failureRate: ((failures / results.length) * 100).toFixed(1),
      throughput: ((results.length / (totalTime / 1000))).toFixed(2),
      distribution: times,
    });
    setLoadTestRunning(false);
  }, [url, resolvedUrl, method, headers]);

  // ── Helpers exposed ───────────────────────────────────────────
  const clearResponse = useCallback(() => {
    setResponse(null);
    setResponseTime(null);
    setResponseSize(null);
    setTestResults([]);
  }, []);

  const newRequest = useCallback(() => {
    setMethod('GET');
    setUrl('');
    setParams(DEFAULT_PARAMS);
    setHeaders(DEFAULT_HEADERS);
    setAuth(DEFAULT_AUTH);
    setBodyType('none');
    setBody('');
    setAssertions([]);
    setPreRequestScript('');
    setPostResponseScript('');
    setActiveRequest(null);
    clearResponse();
  }, [clearResponse]);

  return {
    // Request
    method, setMethod,
    url, setUrl,
    params, setParams,
    headers, setHeaders,
    auth, setAuth,
    bodyType, setBodyType,
    body, setBody,
    assertions, setAssertions,
    preRequestScript, setPreRequestScript,
    postResponseScript, setPostResponseScript,

    // Response
    response, responseTime, responseSize, sending, testResults,
    handleSend, cancelRequest, clearResponse,

    // Tabs
    activeRequestTab, setActiveRequestTab,
    activeResponseTab, setActiveResponseTab,

    // Collections
    collections, savedRequests, history,
    activeRequest, favorites,
    loadRequests, loadHistory,
    handleSaveRequest, handleLoadRequest, toggleFavorite,
    addCollection, toggleCollection, deleteCollection,

    // Environment
    environments, setEnvironments,
    activeEnv, setActiveEnv,
    activeEnvVars, resolvedUrl,
    updateEnvVar, deleteEnvVar,

    // UI
    learningMode, setLearningMode,
    aiPanelOpen, setAiPanelOpen,
    leftSidebarCollapsed, setLeftSidebarCollapsed,
    rightPanelCollapsed, setRightPanelCollapsed,
    searchQuery, setSearchQuery,
    activeLeftTab, setActiveLeftTab,

    // Mocks
    mocks, setMocks,

    // Load Test
    loadTestResults, loadTestRunning, runLoadTest,

    // Helpers
    newRequest,
    formatSize, formatTime,
  };
}

// ── Assertion runner ──────────────────────────────────────────────
function runAssertions(assertions, response, responseTime) {
  return assertions.map(a => {
    try {
      let passed = false;
      const body = response.body || '';
      const json = response.parsedJson;

      switch (a.type) {
        case 'status_code':
          passed = response.status === parseInt(a.value);
          break;
        case 'response_time':
          passed = responseTime < parseInt(a.value);
          break;
        case 'body_contains':
          passed = body.includes(a.value);
          break;
        case 'json_path_exists': {
          const parts = a.value.split('.').filter(Boolean);
          let cur = json;
          for (const p of parts) {
            if (cur == null) break;
            cur = cur[p];
          }
          passed = cur !== undefined;
          break;
        }
        case 'json_path_equals': {
          const parts = a.path?.split('.').filter(Boolean) || [];
          let cur = json;
          for (const p of parts) {
            if (cur == null) break;
            cur = cur[p];
          }
          passed = String(cur) === String(a.value);
          break;
        }
        case 'header_exists':
          passed = a.value.toLowerCase() in (response.headers || {});
          break;
        case 'header_equals':
          passed = response.headers[a.key?.toLowerCase()] === a.value;
          break;
        case 'array_length': {
          const parts = a.path?.split('.').filter(Boolean) || [];
          let cur = json;
          for (const p of parts) { if (cur == null) break; cur = cur[p]; }
          if (Array.isArray(cur)) {
            const len = cur.length;
            const val = parseInt(a.value);
            const op = a.operator || '>';
            if (op === '>') passed = len > val;
            else if (op === '<') passed = len < val;
            else if (op === '>=') passed = len >= val;
            else if (op === '<=') passed = len <= val;
            else if (op === '==' || op === '===') passed = len === val;
            else if (op === '!=' || op === '!==') passed = len !== val;
          }
          break;
        }
        case 'status_in_range':
          passed = response.status >= parseInt(a.min) && response.status <= parseInt(a.max);
          break;
        default:
          passed = false;
      }

      return { ...a, passed, error: null };
    } catch (e) {
      return { ...a, passed: false, error: e.message };
    }
  });
}
