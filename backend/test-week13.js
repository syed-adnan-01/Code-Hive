// Week 13 Automated Verification Test: Presence, Shared Run, Roles & History
// Scope:
// 1. Viewer role enforcement: Server blocks execution (HTTP 403) and sets read-only connection
// 2. Viewer edit rejection: Edits by read-only client are ignored by server
// 3. Shared run output broadcast: Output is received by all room participants via Y.Map('meta')
// 4. Run history recording & retrieval: GET /api/run/history
// 5. Room snapshot persistence & restoration on rejoin

import { spawn } from 'child_process';
import { HocuspocusProvider } from '@hocuspocus/provider';
import * as Y from 'yjs';

const BASE_URL = 'http://localhost:5000';
const WS_URL = 'ws://localhost:5000';
let serverProcess = null;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function startServer() {
  console.log('Starting backend server for Week 13 tests...');
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

    console.log('\n--- Step 1: Create Room with Viewer Link Access ---');
    const roomRes = await fetch(`${BASE_URL}/api/rooms`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer demo-alice-token',
      },
      body: JSON.stringify({
        name: 'Week 13 Demo Room',
        language_id: 63,
        linkAccess: 'viewer',
      }),
    }).then((r) => r.json());

    assert(roomRes.success && roomRes.room?.id, `Room created: ${roomRes.room?.id}`);
    const roomId = roomRes.room.id;

    console.log('\n--- Step 2: Role Lookup Verification ---');
    // Alice is owner
    const aliceTicketRes = await fetch(`${BASE_URL}/api/rooms/${roomId}/ticket`, {
      method: 'POST',
      headers: { Authorization: 'Bearer demo-alice-token' },
    }).then((r) => r.json());
    assert(aliceTicketRes.success && aliceTicketRes.role === 'owner', 'Alice resolved as owner');

    // Charlie is a guest joining via link -> viewer
    const charlieTicketRes = await fetch(`${BASE_URL}/api/rooms/${roomId}/ticket`, {
      method: 'POST',
      headers: { Authorization: 'Bearer demo-charlie-token' },
    }).then((r) => r.json());
    assert(charlieTicketRes.success && charlieTicketRes.role === 'viewer', 'Charlie resolved as viewer');

    console.log('\n--- Step 3: Viewer Cannot Execute Code (HTTP 403 Forbidden) ---');
    const viewerRunRes = await fetch(`${BASE_URL}/api/run`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer demo-charlie-token',
      },
      body: JSON.stringify({
        roomId,
        language_id: 63,
      }),
    });

    assert(viewerRunRes.status === 403, 'POST /api/run returned 403 Forbidden for viewer');
    const viewerRunData = await viewerRunRes.json();
    assert(viewerRunData.error && viewerRunData.error.includes('Viewer'), 'Error clearly explains read-only viewer restriction');

    console.log('\n--- Step 4: Connect Owner and Viewer to Hocuspocus ---');
    const docAlice = new Y.Doc();
    const docCharlie = new Y.Doc();
    let aliceSynced = false;
    let charlieSynced = false;

    const providerAlice = new HocuspocusProvider({
      url: WS_URL,
      name: roomId,
      token: aliceTicketRes.ticket,
      document: docAlice,
      onSynced: () => { aliceSynced = true; },
    });

    const providerCharlie = new HocuspocusProvider({
      url: WS_URL,
      name: roomId,
      token: charlieTicketRes.ticket,
      document: docCharlie,
      onSynced: () => { charlieSynced = true; },
    });

    await sleep(1200);
    assert(aliceSynced && charlieSynced, 'Both Alice (Owner) and Charlie (Viewer) synced to room');

    console.log('\n--- Step 5: Viewer Edits are Rejected / Discarded by Server ---');
    const ytextAlice = docAlice.getText('code');
    const ytextCharlie = docCharlie.getText('code');

    // Alice types valid code
    ytextAlice.delete(0, ytextAlice.length);
    ytextAlice.insert(0, 'console.log("Shared Code Output: " + (50 * 2));\n');
    await sleep(600);

    assert(ytextCharlie.toString().includes('Shared Code Output'), 'Alice\'s edit synced to Charlie');

    // Charlie attempts to vandalize/edit the document
    const originalText = ytextAlice.toString();
    ytextCharlie.insert(0, '// HACKED BY VIEWER\n');
    await sleep(600);

    // Because Charlie was marked readOnly on Hocuspocus connectionConfig, Charlie's update is NOT stored or forwarded to Alice
    assert(!ytextAlice.toString().includes('HACKED BY VIEWER'), 'Server rejected/discarded viewer\'s unauthorized edits');
    assert(ytextAlice.toString() === originalText, 'Alice\'s document remained untampered');

    console.log('\n--- Step 6: Shared Run Broadcasts Output to Everyone ---');
    let charlieReceivedRun = null;
    docCharlie.getMap('meta').observe((event) => {
      const run = docCharlie.getMap('meta').get('lastRunResult');
      if (run) {
        charlieReceivedRun = run;
      }
    });

    // Alice triggers execution
    const runRes = await fetch(`${BASE_URL}/api/run`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer demo-alice-token',
      },
      body: JSON.stringify({
        roomId,
        language_id: 63,
      }),
    }).then((r) => r.json());

    assert(runRes.success && runRes.submission.stdout.includes('100'), 'Run executed successfully on Judge0 (output: 100)');

    await sleep(800);
    assert(charlieReceivedRun !== null, 'Charlie received the broadcasted run result in real time');
    assert(charlieReceivedRun?.stdout?.includes('100'), 'Broadcasted output matches executed result: 100');

    console.log('\n--- Step 7: Submission History Recorded & Retrieved ---');
    const historyRes = await fetch(`${BASE_URL}/api/run/history`, {
      headers: { Authorization: 'Bearer demo-alice-token' },
    }).then((r) => r.json());

    assert(historyRes.success && Array.isArray(historyRes.history), 'GET /api/run/history returned success');
    assert(historyRes.history.length > 0, 'History contains execution entries');
    const latest = historyRes.history[0];
    assert(latest.language === 'JavaScript' || latest.language_id === 63, 'History contains valid language details');
    assert(latest.status?.id === 3, 'History contains valid execution status');

    console.log('\n--- Step 8: Room Snapshot Persistence & Rejoin Restoration ---');
    // Disconnect everyone
    providerAlice.destroy();
    providerCharlie.destroy();
    docAlice.destroy();
    docCharlie.destroy();

    console.log('  Waiting 3s for Hocuspocus store document debounce...');
    await sleep(3000);

    // Rejoin as new participant Dave
    const daveTicketRes = await fetch(`${BASE_URL}/api/rooms/${roomId}/ticket`, {
      method: 'POST',
      headers: { Authorization: 'Bearer demo-dave-token' },
    }).then((r) => r.json());

    const docDave = new Y.Doc();
    let daveSynced = false;
    const providerDave = new HocuspocusProvider({
      url: WS_URL,
      name: roomId,
      token: daveTicketRes.ticket,
      document: docDave,
      onSynced: () => { daveSynced = true; },
    });

    await sleep(1500);
    assert(daveSynced, 'Dave successfully reconnected to persisted room');
    const daveCode = docDave.getText('code').toString();
    assert(daveCode.includes('Shared Code Output: " + (50 * 2)'), 'Room code accurately restored from saved snapshot upon re-opening');

    providerDave.destroy();
    docDave.destroy();

    console.log(`\n================================`);
    console.log(`WEEK 13 TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
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
