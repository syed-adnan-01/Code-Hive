// Automated Verification Test for Week 11 (Code Execution Engine)
import { spawn } from 'child_process';

const BASE_URL = 'http://localhost:5000';
let serverProcess = null;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function startServer() {
  console.log('Starting backend server...');
  serverProcess = spawn('node', ['src/server.js'], {
    cwd: process.cwd(),
    stdio: 'pipe',
  });

  serverProcess.stdout.on('data', (d) => process.stdout.write(`[SERVER] ${d}`));
  serverProcess.stderr.on('data', (d) => process.stderr.write(`[SERVER ERR] ${d}`));

  await sleep(1500);
}

function stopServer() {
  if (serverProcess) {
    serverProcess.kill();
    console.log('Backend server stopped.');
  }
}

async function runTests() {
  let passed = 0;
  let failed = 0;

  const assert = (condition, message) => {
    if (condition) {
      console.log(`  PASS: ${message}`);
      passed++;
    } else {
      console.error(`  FAIL: ${message}`);
      failed++;
    }
  };

  try {
    await startServer();

    console.log('\n--- Test 1: Health & Languages Endpoints ---');
    const healthRes = await fetch(`${BASE_URL}/api/auth/health`).then((r) => r.json());
    assert(healthRes.status === 'ok', 'GET /api/auth/health responds with status ok');

    const langsRes = await fetch(`${BASE_URL}/api/run/languages`).then((r) => r.json());
    assert(langsRes.success && langsRes.languages.length >= 7, `GET /api/run/languages returns ${langsRes.languages?.length} languages`);

    console.log('\n--- Test 2: Auth Verification on /api/run ---');
    const noAuthRes = await fetch(`${BASE_URL}/api/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ language_id: 63, source_code: 'console.log(1)' }),
    });
    assert(noAuthRes.status === 401, 'POST /api/run without Bearer token returns 401 Unauthorized');

    console.log('\n--- Test 3: Input Validation ---');
    const emptyCodeRes = await fetch(`${BASE_URL}/api/run`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer demo-test-token',
      },
      body: JSON.stringify({ language_id: 63, source_code: '' }),
    });
    assert(emptyCodeRes.status === 400, 'POST /api/run with empty source_code returns 400 Bad Request');

    const invalidLangRes = await fetch(`${BASE_URL}/api/run`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer demo-test-token',
      },
      body: JSON.stringify({ language_id: 99999, source_code: 'code' }),
    });
    assert(invalidLangRes.status === 400, 'POST /api/run with invalid language_id returns 400 Bad Request');

    console.log('\n--- Test 4: JavaScript Hello World & Stdin ---');
    const jsHello = await fetch(`${BASE_URL}/api/run`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer demo-test-token',
      },
      body: JSON.stringify({
        language_id: 63,
        source_code: 'console.log("Hello from JavaScript test!");',
      }),
    }).then((r) => r.json());
    assert(jsHello.success && jsHello.submission.stdout.includes('Hello from JavaScript test!'), 'JavaScript Hello World executed successfully');

    const jsStdin = await fetch(`${BASE_URL}/api/run`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer demo-test-token',
      },
      body: JSON.stringify({
        language_id: 63,
        source_code: `
const fs = require('fs');
const inp = fs.readFileSync(0, 'utf-8');
console.log("STDIN:" + inp);
`,
        stdin: 'sample-stdin-payload',
      }),
    }).then((r) => r.json());
    assert(jsStdin.success && jsStdin.submission.stdout.includes('sample-stdin-payload'), 'JavaScript Stdin program processed input successfully');

    console.log('\n--- Test 5: Python Hello World & Stdin ---');
    const pyHello = await fetch(`${BASE_URL}/api/run`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer demo-test-token',
      },
      body: JSON.stringify({
        language_id: 71,
        source_code: 'print("Hello from Python test!")',
      }),
    }).then((r) => r.json());
    assert(pyHello.success && pyHello.submission.stdout.includes('Hello from Python test!'), 'Python Hello World executed successfully');

    const pyStdin = await fetch(`${BASE_URL}/api/run`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer demo-test-token',
      },
      body: JSON.stringify({
        language_id: 71,
        source_code: 'print("Testing Python Stdin")',
        stdin: '42\n84\n126',
      }),
    }).then((r) => r.json());
    assert(pyStdin.success && pyStdin.submission.stdout.includes('42'), 'Python Stdin program processed input successfully');

    console.log('\n--- Test 6: C++ Hello World & Stdin ---');
    const cppHello = await fetch(`${BASE_URL}/api/run`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer demo-test-token',
      },
      body: JSON.stringify({
        language_id: 54,
        source_code: '#include <iostream>\nint main() { std::cout << "C++ Output"; return 0; }',
      }),
    }).then((r) => r.json());
    assert(cppHello.success && cppHello.submission.status.id === 3, 'C++ execution completed with status Accepted');

    const cppStdin = await fetch(`${BASE_URL}/api/run`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer demo-test-token',
      },
      body: JSON.stringify({
        language_id: 54,
        source_code: '#include <iostream>\nint main() { return 0; }',
        stdin: '100 200',
      }),
    }).then((r) => r.json());
    assert(cppStdin.success && cppStdin.submission.stdout.includes('100 200'), 'C++ Stdin program received stdin successfully');

    console.log('\n--- Test 7: Java Program ---');
    const javaRes = await fetch(`${BASE_URL}/api/run`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer demo-test-token',
      },
      body: JSON.stringify({
        language_id: 62,
        source_code: 'public class Main { public static void main(String[] args) {} }',
      }),
    }).then((r) => r.json());
    assert(javaRes.success && javaRes.submission.status.id === 3, 'Java program executed with status Accepted');

    console.log(`\n================================`);
    console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log(`================================`);

    if (failed > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error('Test execution error:', err);
    process.exit(1);
  } finally {
    stopServer();
  }
}

runTests();
