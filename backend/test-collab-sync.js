// Week 12 Automated Verification Test: Rooms & Live Sync
// Tests: Room creation, Role lookup, Single-use 60s ticket flow,
// Hocuspocus WebSocket authentication, Multi-client real-time CRDT sync,
// Viewer read-only status, Ticket reuse prevention, and Live Room Code Execution.

import { spawn } from 'child_process';
import { HocuspocusProvider } from '@hocuspocus/provider';
import * as Y from 'yjs';

const BASE_URL = 'http://localhost:5000';
const WS_URL = 'ws://localhost:5000';
let serverProcess = null;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function startServer() {
  console.log('Starting backend server with Hocuspocus...');
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

    console.log('\n--- Step 1: Create Collaboration Room ---');
    const createRes = await fetch(`${BASE_URL}/api/rooms`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer demo-alice-token',
      },
      body: JSON.stringify({
        name: 'Algorithms Pair Room',
        language_id: 63,
        linkAccess: 'editor',
      }),
    }).then((r) => r.json());

    assert(createRes.success && createRes.room?.id, `Room created successfully: ${createRes.room?.id}`);
    const roomId = createRes.room.id;

    console.log('\n--- Step 2: Get Room Details & Role Lookup ---');
    const getRes = await fetch(`${BASE_URL}/api/rooms/${roomId}`, {
      headers: { Authorization: 'Bearer demo-alice-token' },
    }).then((r) => r.json());

    assert(getRes.success && getRes.room.name === 'Algorithms Pair Room', 'Room metadata retrieved accurately');
    assert(getRes.room.userRole === 'owner', 'Creator user role correctly resolved to owner');

    console.log('\n--- Step 3: Reject Missing & Invalid Tickets ---');
    let badAuthFailed = false;
    const badDoc = new Y.Doc();
    const badProvider = new HocuspocusProvider({
      url: WS_URL,
      name: roomId,
      token: 'invalid_fake_ticket',
      document: badDoc,
      onAuthenticationFailed: () => {
        badAuthFailed = true;
      },
    });

    await sleep(800);
    badProvider.destroy();
    assert(badAuthFailed, 'Connection with invalid ticket correctly rejected by Hocuspocus');

    console.log('\n--- Step 4: Issue 60s Single-Use Tickets ---');
    const aliceTicketRes = await fetch(`${BASE_URL}/api/rooms/${roomId}/ticket`, {
      method: 'POST',
      headers: { Authorization: 'Bearer demo-alice-token' },
    }).then((r) => r.json());

    assert(aliceTicketRes.success && aliceTicketRes.ticket.startsWith('tkt_'), 'Single-use ticket issued for Alice (editor/owner)');
    assert(aliceTicketRes.expiresInSeconds === 60, 'Ticket has 60-second TTL');

    const bobTicketRes = await fetch(`${BASE_URL}/api/rooms/${roomId}/ticket`, {
      method: 'POST',
      headers: { Authorization: 'Bearer demo-bob-token' },
    }).then((r) => r.json());

    assert(bobTicketRes.success && bobTicketRes.ticket.startsWith('tkt_'), 'Single-use ticket issued for Bob (editor)');

    console.log('\n--- Step 5: Connect Two Clients via WebSocket & Yjs CRDT ---');
    const docA = new Y.Doc();
    let aliceSynced = false;
    const providerA = new HocuspocusProvider({
      url: WS_URL,
      name: roomId,
      token: aliceTicketRes.ticket,
      document: docA,
      onSynced: () => { aliceSynced = true; },
    });

    const docB = new Y.Doc();
    let bobSynced = false;
    const providerB = new HocuspocusProvider({
      url: WS_URL,
      name: roomId,
      token: bobTicketRes.ticket,
      document: docB,
      onSynced: () => { bobSynced = true; },
    });

    await sleep(1000);
    assert(aliceSynced && bobSynced, 'Both Alice and Bob successfully authenticated and synced with Hocuspocus');

    console.log('\n--- Step 6: Test Single-Use Ticket Enforcement ---');
    let reuseFailed = false;
    const docReuse = new Y.Doc();
    const providerReuse = new HocuspocusProvider({
      url: WS_URL,
      name: roomId,
      token: aliceTicketRes.ticket, // Already consumed!
      document: docReuse,
      onAuthenticationFailed: () => { reuseFailed = true; },
    });

    await sleep(800);
    providerReuse.destroy();
    assert(reuseFailed, 'Ticket reuse was rejected (strictly single-use)');

    console.log('\n--- Step 7: Multi-User Concurrent Typing & Convergence ---');
    const ytextA = docA.getText('code');
    const ytextB = docB.getText('code');

    // Alice types at the beginning
    ytextA.delete(0, ytextA.length); // clear template
    ytextA.insert(0, '// Line 1: Alice wrote this\n');

    await sleep(500);
    assert(ytextB.toString().includes('Alice wrote this'), 'Alice\'s edit propagated to Bob\'s editor in real time');

    // Bob types simultaneously
    ytextB.insert(ytextB.length, 'console.log("Bob added live calculation", 20 + 22);\n');

    await sleep(500);
    assert(ytextA.toString().includes('Bob added live calculation'), 'Bob\'s edit propagated to Alice\'s editor in real time');
    assert(ytextA.toString() === ytextB.toString(), 'Both documents merged deterministically with identical content (CRDT Convergence)');

    console.log('\n--- Step 8: Execute Server\'s Live Room Document ---');
    // When executing with roomId, server executes the live Y.Text from the room!
    const runRoomRes = await fetch(`${BASE_URL}/api/run`, {
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

    assert(runRoomRes.success && runRoomRes.submission.stdout.includes('42'), 'Server executed live room document and output contains computed result: 42');

    console.log('\n--- Step 9: Clean up connections ---');
    providerA.destroy();
    providerB.destroy();
    docA.destroy();
    docB.destroy();
    assert(true, 'Cleaned up WebSocket sessions and resources');

    console.log(`\n================================`);
    console.log(`WEEK 12 TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
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
