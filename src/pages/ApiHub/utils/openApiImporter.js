/**
 * Parses an OpenAPI 3.x / Swagger 2.x JSON spec into API Hub collections.
 */
export function parseOpenApi(spec) {
  const collections = [];
  const requests = [];

  try {
    const parsed = typeof spec === 'string' ? JSON.parse(spec) : spec;
    const isSwagger2 = !!parsed.swagger;
    const isOAS3 = !!parsed.openapi;

    if (!isSwagger2 && !isOAS3) throw new Error('Not a valid OpenAPI/Swagger document');

    const title = parsed.info?.title || 'Imported API';
    const baseUrl = isOAS3
      ? (parsed.servers?.[0]?.url || '')
      : `${parsed.schemes?.[0] || 'https'}://${parsed.host || ''}${parsed.basePath || ''}`;

    const paths = parsed.paths || {};
    const tags = new Set();

    Object.entries(paths).forEach(([path, methods]) => {
      Object.entries(methods).forEach(([method, operation]) => {
        if (!['get','post','put','patch','delete','head','options'].includes(method)) return;

        const opTags = operation.tags || ['General'];
        opTags.forEach(t => tags.add(t));

        const reqHeaders = [{ enabled: true, key: 'Accept', value: 'application/json' }];
        const reqParams = [];

        // Parameters
        (operation.parameters || []).forEach(p => {
          if (p.in === 'header') {
            reqHeaders.push({ enabled: true, key: p.name, value: '' });
          } else if (p.in === 'query') {
            reqParams.push({ enabled: false, key: p.name, value: '', description: p.description || '' });
          }
        });

        // Body
        let body = '';
        let bodyType = 'none';
        const reqBody = operation.requestBody;
        if (reqBody) {
          const jsonContent = reqBody.content?.['application/json'];
          if (jsonContent?.example) {
            body = JSON.stringify(jsonContent.example, null, 2);
            bodyType = 'json';
          } else if (jsonContent?.schema) {
            body = generateExampleFromSchema(jsonContent.schema);
            bodyType = 'json';
          }
        }

        requests.push({
          id: `req_${Date.now()}_${Math.random()}`,
          name: operation.summary || `${method.toUpperCase()} ${path}`,
          method: method.toUpperCase(),
          url: `${baseUrl}${path}`,
          headers: reqHeaders,
          params: reqParams.length ? reqParams : [{ enabled: true, key: '', value: '', description: '' }],
          body,
          bodyType,
          auth: { type: 'none' },
          assertions: [],
          collection: opTags[0] || 'General',
          description: operation.description || '',
        });
      });
    });

    // Create collections from tags
    tags.forEach(tag => {
      collections.push({ id: `col_${tag}`, name: tag, expanded: true });
    });

    return { title, collections, requests };
  } catch (e) {
    throw new Error(`OpenAPI parse error: ${e.message}`);
  }
}

function generateExampleFromSchema(schema) {
  if (!schema) return '{}';
  const example = buildExample(schema);
  return JSON.stringify(example, null, 2);
}

function buildExample(schema, depth = 0) {
  if (depth > 4) return null;
  if (!schema) return null;
  if (schema.example !== undefined) return schema.example;
  if (schema.default !== undefined) return schema.default;

  switch (schema.type) {
    case 'object': {
      const obj = {};
      Object.entries(schema.properties || {}).forEach(([k, v]) => {
        obj[k] = buildExample(v, depth + 1);
      });
      return obj;
    }
    case 'array':
      return [buildExample(schema.items, depth + 1)];
    case 'string':
      return schema.enum?.[0] || schema.format === 'email' ? 'user@example.com' : 'string';
    case 'integer':
    case 'number':
      return schema.minimum || 0;
    case 'boolean':
      return true;
    default:
      return null;
  }
}
