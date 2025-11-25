const { describe, it, before, after } = require('node:test');
const assert = require('node:assert');
const http = require('node:http');

const app = require('../server');

describe('Server API', () => {
  let server;
  const PORT = 3001;
  const BASE_URL = `http://localhost:${PORT}`;

  before(async () => {
    server = app.listen(PORT);
    // Wait for server to start
    await new Promise(resolve => setTimeout(resolve, 100));
  });

  after(async () => {
    server.close();
  });

  const makeRequest = (path, options = {}) => {
    return new Promise((resolve, reject) => {
      const url = new URL(path, BASE_URL);
      const requestOptions = {
        hostname: url.hostname,
        port: url.port,
        path: url.pathname,
        method: options.method || 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        }
      };

      const req = http.request(requestOptions, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            resolve({
              status: res.statusCode,
              data: JSON.parse(data)
            });
          } catch {
            resolve({
              status: res.statusCode,
              data: data
            });
          }
        });
      });

      req.on('error', reject);

      if (options.body) {
        req.write(JSON.stringify(options.body));
      }
      req.end();
    });
  };

  describe('GET /health', () => {
    it('should return health status', async () => {
      const response = await makeRequest('/health');
      assert.strictEqual(response.status, 200);
      assert.strictEqual(response.data.status, 'ok');
      assert.ok(response.data.timestamp);
    });
  });

  describe('POST /api/correct', () => {
    it('should correct grammar in text', async () => {
      const response = await makeRequest('/api/correct', {
        method: 'POST',
        body: {
          text: 'i have alot of work',
          naturalness: 'medium',
          formality: 'neutral'
        }
      });

      assert.strictEqual(response.status, 200);
      assert.ok(response.data.correctedText);
      assert.strictEqual(response.data.originalText, 'i have alot of work');
    });

    it('should return 400 for missing text', async () => {
      const response = await makeRequest('/api/correct', {
        method: 'POST',
        body: {}
      });

      assert.strictEqual(response.status, 400);
      assert.ok(response.data.error);
    });

    it('should return 400 for empty text', async () => {
      const response = await makeRequest('/api/correct', {
        method: 'POST',
        body: { text: '   ' }
      });

      assert.strictEqual(response.status, 400);
      assert.ok(response.data.error);
    });

    it('should return 400 for invalid naturalness', async () => {
      const response = await makeRequest('/api/correct', {
        method: 'POST',
        body: {
          text: 'Hello world',
          naturalness: 'invalid'
        }
      });

      assert.strictEqual(response.status, 400);
      assert.ok(response.data.message.includes('Naturalness'));
    });

    it('should return 400 for invalid formality', async () => {
      const response = await makeRequest('/api/correct', {
        method: 'POST',
        body: {
          text: 'Hello world',
          formality: 'invalid'
        }
      });

      assert.strictEqual(response.status, 400);
      assert.ok(response.data.message.includes('Formality'));
    });

    it('should use default options when not provided', async () => {
      const response = await makeRequest('/api/correct', {
        method: 'POST',
        body: { text: 'Hello world' }
      });

      assert.strictEqual(response.status, 200);
      assert.strictEqual(response.data.options.naturalness, 'medium');
      assert.strictEqual(response.data.options.formality, 'neutral');
    });
  });

  describe('POST /api/chunk', () => {
    it('should chunk text', async () => {
      const response = await makeRequest('/api/chunk', {
        method: 'POST',
        body: { text: 'This is a test sentence.' }
      });

      assert.strictEqual(response.status, 200);
      assert.ok(Array.isArray(response.data.chunks));
      assert.ok(response.data.chunkCount >= 1);
    });

    it('should return 400 for missing text', async () => {
      const response = await makeRequest('/api/chunk', {
        method: 'POST',
        body: {}
      });

      assert.strictEqual(response.status, 400);
    });
  });
});
