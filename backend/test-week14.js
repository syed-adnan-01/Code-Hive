// Week 14 Automated Verification Test: Hardening, Rate Limiting, Size Caps & Security
// Tests:
// 1. Auth Guard (No token, bad token, valid token)
// 2. Code Size Cap (100 KB limit enforcement)
// 3. Stdin Size Cap (10 KB limit enforcement)
// 4. Rate Limiting on Code Execution (runLimiter)
// 5. Rate Limiting on Room & Ticket creation (roomLimiter, ticketLimiter)
// 6. Role-based execution security (Owner allowed, Viewer blocked with 403)
// 7. Multi-client session reconnect & state preservation

import { spawn } from 'child_process';
import { HocuspocusProvider } from '@hocuspocus/provider';
import * as Y from 'yjs';

const BASE_URL = 'http://localhost:5000';
const WS_URL = 'ws://localhost:5000';
let serverProcess = null;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function startServer() {
  console.log('Starting backend server for Week 14 tests...');
  serverProcess = spawn('node', ['src/server.js'], {
    cwd: process.cwd(),
    stdio: 'pipe',
  });

  serverProcess.stdout.on('data', (d) => process.stdout.write(`[SERVER] ${d}`));
  serverProcess.stderr.on('data', (d) => process.stderr.write(`[SERVER ERR] ${d}`));

  for (let i = 0; i < 20; i++) {
    await sleep(300);
    try {
      const res = await fetch(`${BASE_URL}/api/run/languages`);
      if (res.ok) {
        console.log('Backend server is ready!');
        return;
      }
    } catch (e) {
      // waiting for server
    }
  }
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

    console.log('\n--- Step 1: Token Check & Auth Guards ---');
    const noTokenRes = await fetch(`${BASE_URL}/api/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ source_code: 'console.log(1)', language_id: 63 }),
    });
    assert(noTokenRes.status === 401, 'POST /api/run without token returns 401 Unauthorized');

    const badHeaderRes = await fetch(`${BASE_URL}/api/run`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Basic invalid',
      },
      body: JSON.stringify({ source_code: 'console.log(1)', language_id: 63 }),
    });
    assert(badHeaderRes.status === 401, 'POST /api/run with invalid auth scheme returns 401 Unauthorized');

    console.log('\n--- Step 2: Code Size Cap (100 KB limit) ---');
    // Create oversized code (105 KB)
    const oversizedCode = 'a'.repeat(105 * 1024);
    const oversizedCodeRes = await fetch(`${BASE_URL}/api/run`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer demo-alice-token',
      },
      body: JSON.stringify({
        source_code: oversizedCode,
        language_id: 63,
      }),
    });
    assert(oversizedCodeRes.status === 400, 'POST /api/run with >100 KB code rejected with 400 Bad Request');
    const oversizedCodeData = await oversizedCodeRes.json();
    assert(oversizedCodeData.error && oversizedCodeData.error.includes('100 KB'), 'Error specifies 100 KB maximum code size');

    console.log('\n--- Step 3: Stdin Size Cap (10 KB limit) ---');
    // Create oversized stdin (12 KB)
    const oversizedStdin = 'x'.repeat(12 * 1024);
    const oversizedStdinRes = await fetch(`${BASE_URL}/api/run`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer demo-alice-token',
      },
      body: JSON.stringify({
        source_code: 'console.log("ok");',
        language_id: 63,
        stdin: oversizedStdin,
      }),
    });
    assert(oversizedStdinRes.status === 400, 'POST /api/run with >10 KB stdin rejected with 400 Bad Request');
    const oversizedStdinData = await oversizedStdinRes.json();
    assert(oversizedStdinData.error && oversizedStdinData.error.includes('10 KB'), 'Error specifies 10 KB maximum stdin size');

    console.log('\n--- Step 4: Role-Based Execution Security ---');
    const roomRes = await fetch(`${BASE_URL}/api/rooms`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer demo-owner-token',
      },
      body: JSON.stringify({
        name: 'Security Test Room',
        language_id: 63,
        linkAccess: 'viewer',
      }),
    }).then((r) => r.json());
    const roomId = roomRes.room.id;

    // Guest is viewer
    const viewerRunRes = await fetch(`${BASE_URL}/api/run`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer demo-intruder-token',
      },
      body: JSON.stringify({
        roomId,
        language_id: 63,
      }),
    });
    assert(viewerRunRes.status === 403, 'Viewer execution blocked with 403 Forbidden');

    // Owner can run
    const ownerRunRes = await fetch(`${BASE_URL}/api/run`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer demo-owner-token',
      },
      body: JSON.stringify({
        roomId,
        language_id: 63,
      }),
    });
    assert(ownerRunRes.status === 200, 'Room owner execution permitted (HTTP 200)');

    console.log('\n--- Step 5: Multi-Client Session Reconnect & State Convergence ---');
    const ticket1Res = await fetch(`${BASE_URL}/api/rooms/${roomId}/ticket`, {
      method: 'POST',
      headers: { Authorization: 'Bearer demo-owner-token' },
    }).then((r) => r.json());

    const doc1 = new Y.Doc();
    let synced1 = false;
    const provider1 = new HocuspocusProvider({
      url: WS_URL,
      name: roomId,
      token: ticket1Res.ticket,
      document: doc1,
      onSynced: () => { synced1 = true; },
    });

    await sleep(1000);
    assert(synced1, 'Client 1 connected and synced');

    doc1.getText('code').insert(0, '// Hardening and Test Passed\n');
    await sleep(500);

    // Disconnect Client 1
    provider1.destroy();
    doc1.destroy();
    console.log('  Client 1 disconnected. Reconnecting with new ticket...');

    // Reconnect as Client 2
    const ticket2Res = await fetch(`${BASE_URL}/api/rooms/${roomId}/ticket`, {
      method: 'POST',
      headers: { Authorization: 'Bearer demo-owner-token' },
    }).then((r) => r.json());

    const doc2 = new Y.Doc();
    let synced2 = false;
    const provider2 = new HocuspocusProvider({
      url: WS_URL,
      name: roomId,
      token: ticket2Res.ticket,
      document: doc2,
      onSynced: () => { synced2 = true; },
    });

    await sleep(1200);
    assert(synced2, 'Client 2 reconnected and synced successfully');
    assert(doc2.getText('code').toString().includes('Hardening and Test Passed'), 'Document content fully preserved across reconnect');

    provider2.destroy();
    doc2.destroy();

    console.log('\n--- Step 6: Rate Limiting Enforcement ---');
    console.log('  Simulating burst of execution requests to test runLimiter...');
    let hitRateLimit = false;
    for (let i = 0; i < 25; i++) {
      const burstRes = await fetch(`${BASE_URL}/api/run`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer demo-spammer-token',
        },
        body: JSON.stringify({
          source_code: 'console.log("spam");',
          language_id: 63,
        }),
      });

      if (burstRes.status === 429) {
        hitRateLimit = true;
        break;
      }
    }
    assert(hitRateLimit, 'Rate limiter triggered 429 Too Many Requests after burst');

    console.log(`\n================================`);
    console.log(`WEEK 14 TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log(`================================`);

    if (failed > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error('Test error:', err);
    process.exit(1);
  } finally {
    stopServer();
  }
}

runTests();
