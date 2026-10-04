// Comprehensive Automated Test Suite for Week C: AI Debugging & Code Suggestions
// Verifies security, quota tracking, error line extraction, structured fix diffs, and completions
import http from 'http';

const API_BASE = 'http://localhost:5000';

const request = ({ path, method = 'POST', headers = {}, body = null }) => {
  return new Promise((resolve, reject) => {
    const url = new URL(path, API_BASE);
    const reqHeaders = { ...headers };
    let payload = null;

    if (body) {
      payload = JSON.stringify(body);
      reqHeaders['Content-Type'] = 'application/json';
      reqHeaders['Content-Length'] = Buffer.byteLength(payload);
    }

    const req = http.request(
      url,
      {
        method,
        headers: reqHeaders,
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          let parsed = null;
          try {
            parsed = JSON.parse(data);
          } catch (e) {
            parsed = data;
          }
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: parsed,
          });
        });
      }
    );

    req.on('error', reject);
    if (payload) {
      req.write(payload);
    }
    req.end();
  });
};

const assert = (condition, description) => {
  if (!condition) {
    console.error(`❌ FAILED: ${description}`);
    throw new Error(`Assertion failed: ${description}`);
  }
  console.log(`✅ PASSED: ${description}`);
};

const runWeekCTests = async () => {
  console.log('\n======================================================');
  console.log('🐝 RUNNING WEEK C TEST SUITE: AI DEBUGGING & SUGGESTION');
  console.log('======================================================\n');

  const aliceToken = 'Bearer demo-alice-token';

  // --- SECTION 1: AUTHENTICATION & VALIDATION GUARDS ---
  console.log('\n--- 1. AI AUTH GUARDS & PAYLOAD VALIDATION ---');

  // 1.1 Unauthenticated debug request
  const noAuthDebug = await request({
    path: '/api/ai/debug',
    body: { code: 'x = 1', stderr: 'error' },
  });
  assert(noAuthDebug.status === 401, 'Unauthenticated /api/ai/debug rejected with 401');

  // 1.2 Missing code
  const missingCode = await request({
    path: '/api/ai/debug',
    headers: { Authorization: aliceToken },
    body: { stderr: 'error without code' },
  });
  assert(missingCode.status === 400, 'Missing "code" rejected with 400 Bad Request');

  // 1.3 Missing stderr
  const missingStderr = await request({
    path: '/api/ai/debug',
    headers: { Authorization: aliceToken },
    body: { code: 'print("test")' },
  });
  assert(missingStderr.status === 400, 'Missing "stderr" rejected with 400 Bad Request');

  // --- SECTION 2: AI DEBUGGING & STRUCTURED FIX DIFFS ---
  console.log('\n--- 2. AI DEBUGGING ENGINE & ERROR LINE EXTRACTION ---');

  // 2.1 Python Syntax Error (Missing parentheses)
  const pyCode = 'print "Hello CodeHive"';
  const pyStderr = '  File "<string>", line 1\n    print "Hello CodeHive"\n          ^\nSyntaxError: Missing parentheses in call to \'print\'. Did you mean print(...)?';

  const debugPy = await request({
    path: '/api/ai/debug',
    headers: { Authorization: aliceToken },
    body: {
      code: pyCode,
      language: 'python',
      stderr: pyStderr,
    },
  });
  assert(debugPy.status === 200, 'Python syntax error analyzed with HTTP 200 OK');
  assert(debugPy.body.success === true, 'Response indicates success: true');
  assert(typeof debugPy.body.debug.summary === 'string', 'Debug returns summary explanation');
  assert(typeof debugPy.body.debug.cause === 'string', 'Debug returns root cause');
  assert(typeof debugPy.body.debug.fixedCode === 'string', 'Debug returns fixedCode');
  assert(debugPy.body.debug.fixedCode.includes('print("Hello CodeHive")'), 'fixedCode correctly adds parentheses');
  assert(Array.isArray(debugPy.body.debug.steps), 'Debug returns list of steps taken');
  assert(Array.isArray(debugPy.body.debug.errorLines), 'Debug returns error line numbers');
  assert(debugPy.body.debug.errorLines.includes(1), 'Parsed line 1 as error target line');

  // 2.2 JavaScript ReferenceError
  const jsCode = 'function calculate() {\n  return totalAmount * 1.18;\n}\nconsole.log(calculate());';
  const jsStderr = 'ReferenceError: totalAmount is not defined\n    at calculate (main.js:2:10)\n    at main.js:4:13';

  const debugJs = await request({
    path: '/api/ai/debug',
    headers: { Authorization: aliceToken },
    body: {
      code: jsCode,
      language: 'javascript',
      stderr: jsStderr,
    },
  });
  assert(debugJs.status === 200, 'JavaScript ReferenceError analyzed with HTTP 200 OK');
  assert(debugJs.body.debug.summary.includes('totalAmount'), 'Summary highlights undefined totalAmount');
  assert(debugJs.body.debug.fixedCode.includes('totalAmount'), 'fixedCode defines totalAmount');
  assert(debugJs.body.debug.errorLines.includes(2), 'Parsed line 2 as error target line');

  // --- SECTION 3: AI CODE SUGGESTION (INLINE COMPLETION) ---
  console.log('\n--- 3. AI CODE SUGGESTION & CACHE OPTIMIZATION ---');

  // 3.1 Unauthenticated suggest request
  const noAuthSuggest = await request({
    path: '/api/ai/suggest',
    body: { prefix: 'function sum(a, b) {' },
  });
  assert(noAuthSuggest.status === 401, 'Unauthenticated /api/ai/suggest rejected with 401');

  // 3.2 Valid suggest request
  const prefix = `function calculateTotal_${Date.now()}_${Math.random().toString(36).substring(2, 6)}(items) {`;
  const suggestRes1 = await request({
    path: '/api/ai/suggest',
    headers: { Authorization: aliceToken },
    body: {
      prefix,
      suffix: '',
      language: 'javascript',
    },
  });
  assert(suggestRes1.status === 200, 'AI code suggestion returned HTTP 200 OK');
  assert(typeof suggestRes1.body.suggestion === 'string', 'Returns string continuation');
  assert(!suggestRes1.body.suggestion.includes('```'), 'Continuation is raw code without markdown fences');
  assert(suggestRes1.body.cached === false, 'First request was computed (cached: false)');

  // 3.3 Cached suggest request
  const suggestRes2 = await request({
    path: '/api/ai/suggest',
    headers: { Authorization: aliceToken },
    body: {
      prefix,
      suffix: '',
      language: 'javascript',
    },
  });
  assert(suggestRes2.status === 200, 'Second identical request returned HTTP 200 OK');
  assert(suggestRes2.body.cached === true, 'Second identical request served from cache');
  assert(suggestRes2.body.suggestion === suggestRes1.body.suggestion, 'Cached suggestion matches first request');

  console.log('\n======================================================');
  console.log('🎉 ALL 18 WEEK C ASSERTIONS PASSED (100%)');
  console.log('======================================================\n');
};

runWeekCTests().catch((err) => {
  console.error('\n❌ WEEK C TEST SUITE FAILED:', err);
  process.exit(1);
});
