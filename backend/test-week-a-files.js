// Week A Automated Verification Test: Multi-File Management & Real-Time Sync
// Scope:
// 1. Room document layout: Y.Map('files') with main file & legacy code mirroring
// 2. Multi-client file creation & real-time sync
// 3. File rename synchronization across peers
// 4. Multi-file execution: POST /api/run with fileId auto-resolves language from extension
// 5. File deletion synchronization
// 6. Name and size validation rules (file limits, max 20 files, 100 KB cap)
// 7. Viewer read-only security enforcement
// 8. Snapshot persistence & restoration upon rejoin

import { spawn } from 'child_process';
import { HocuspocusProvider } from '@hocuspocus/provider';
import * as Y from 'yjs';
import { validateFileName, validateRoomFileLimits } from './src/services/fileService.js';

const BASE_URL = 'http://localhost:5000';
const WS_URL = 'ws://localhost:5000';
let serverProcess = null;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function startServer() {
  console.log('Starting backend server for Week A tests...');
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

    // ──────────────────────────────────────────────
    console.log('\n--- Step 1: Filename & Room File Limit Validation Rules ---');
    // ──────────────────────────────────────────────
    const validResult = validateFileName('app_utils.py');
    assert(validResult.valid === true, 'Valid filename "app_utils.py" accepted');

    const invalidSlash = validateFileName('../secret.js');
    assert(invalidSlash.valid === false, 'Traversal filename "../secret.js" rejected');

    const invalidChar = validateFileName('bad name*.txt');
    assert(invalidChar.valid === false, 'Filename with illegal characters rejected');

    const longName = 'a'.repeat(70) + '.js';
    const invalidLength = validateFileName(longName);
    assert(invalidLength.valid === false, 'Filename exceeding 64 characters rejected');

    const mockFiles19 = {};
    for (let i = 1; i <= 19; i++) {
      mockFiles19[`file_${i}`] = { name: `file_${i}.js`, text: 'console.log(1);' };
    }
    const limitCheck19 = validateRoomFileLimits(mockFiles19, 100);
    assert(limitCheck19.valid === true, 'Adding file to room with 19 files is permitted');

    const mockFiles20 = { ...mockFiles19, file_20: { name: 'file_20.js', text: 'x' } };
    const limitCheck20 = validateRoomFileLimits(mockFiles20, 100);
    assert(limitCheck20.valid === false, 'Adding 21st file rejected by room file limit (max 20)');

    const largeFile = { f1: { name: 'big.txt', text: 'a'.repeat(101 * 1024) } };
    const limitCheckSize = validateRoomFileLimits(largeFile);
    assert(limitCheckSize.valid === false, 'File exceeding 100 KB rejected');

    // ──────────────────────────────────────────────
    console.log('\n--- Step 2: Create Collaborative Room for Multi-File Tests ---');
    // ──────────────────────────────────────────────
    const createRes = await fetch(`${BASE_URL}/api/rooms`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer demo-bearer-token',
      },
      body: JSON.stringify({
        name: 'Week A Multi-File Room',
        language_id: 63, // JavaScript
        linkAccess: 'editor',
      }),
    });
    const { room } = await createRes.json();
    assert(room && room.id, `Room created: ${room?.id}`);

    // Get ticket for Owner (Alice)
    const aliceTicketRes = await fetch(`${BASE_URL}/api/rooms/${room.id}/ticket`, {
      method: 'POST',
      headers: { Authorization: 'Bearer demo-bearer-token' },
    });
    const { ticket: aliceTicket } = await aliceTicketRes.json();

    // Connect Alice to Hocuspocus
    let aliceSynced = false;
    const aliceDoc = new Y.Doc();
    const aliceProvider = new HocuspocusProvider({
      url: WS_URL,
      name: room.id,
      token: aliceTicket,
      document: aliceDoc,
      onSynced: () => { aliceSynced = true; },
    });

    await sleep(1500);
    assert(aliceSynced, 'Alice connected and synced to room');

    // ──────────────────────────────────────────────
    console.log('\n--- Step 3: Verify Initial Files Map & Legacy Migration ---');
    // ──────────────────────────────────────────────
    const aliceFiles = aliceDoc.getMap('files');
    assert(aliceFiles.has('main'), 'Initial files Y.Map contains "main" file');

    const mainFile = aliceFiles.get('main');
    const mainName = mainFile ? mainFile.get('name') : null;
    assert(mainName === 'main.js', `Main file name matches language extension: ${mainName}`);

    const mainText = mainFile ? mainFile.get('text') : null;
    assert(mainText && mainText.length > 0, 'Main file text is initialized');

    const legacyText = aliceDoc.getText('code');
    assert(legacyText.length > 0, 'Legacy "code" Y.Text preserved for backwards compatibility');

    // ──────────────────────────────────────────────
    console.log('\n--- Step 4: Multi-Client Real-Time File Creation ---');
    // ──────────────────────────────────────────────
    // Get ticket for Charlie (Editor)
    const charlieTicketRes = await fetch(`${BASE_URL}/api/rooms/${room.id}/ticket`, {
      method: 'POST',
      headers: { Authorization: 'Bearer demo-charlie-token' },
    });
    const { ticket: charlieTicket } = await charlieTicketRes.json();

    let charlieSynced = false;
    const charlieDoc = new Y.Doc();
    const charlieProvider = new HocuspocusProvider({
      url: WS_URL,
      name: room.id,
      token: charlieTicket,
      document: charlieDoc,
      onSynced: () => { charlieSynced = true; },
    });

    await sleep(1500);
    assert(charlieSynced, 'Charlie (Editor) connected and synced to room');

    // Alice creates a new file "calculator.py"
    const pyFile = new Y.Map();
    pyFile.set('id', 'calc_py');
    pyFile.set('name', 'calculator.py');
    const pyText = new Y.Text();
    pyText.insert(0, 'print(200 + 45)\n');
    pyFile.set('text', pyText);
    pyFile.set('createdAt', Date.now());
    pyFile.set('updatedAt', Date.now());
    aliceFiles.set('calc_py', pyFile);

    await sleep(600);

    const charlieFiles = charlieDoc.getMap('files');
    assert(charlieFiles.has('calc_py'), 'Charlie received newly created "calculator.py" in real time');
    const charliePyFile = charlieFiles.get('calc_py');
    assert(charliePyFile.get('name') === 'calculator.py', 'Charlie sees correct file name');
    assert(charliePyFile.get('text').toString().includes('200 + 45'), 'Charlie sees file contents synchronized');

    // ──────────────────────────────────────────────
    console.log('\n--- Step 5: Multi-Client Real-Time File Renaming ---');
    // ──────────────────────────────────────────────
    // Charlie renames "calculator.py" to "solver.py"
    charliePyFile.set('name', 'solver.py');
    charliePyFile.set('updatedAt', Date.now());

    await sleep(600);

    const alicePyFile = aliceFiles.get('calc_py');
    assert(alicePyFile.get('name') === 'solver.py', 'Alice observed file rename to "solver.py" in real time');

    // ──────────────────────────────────────────────
    console.log('\n--- Step 6: Multi-File Execution via POST /api/run with fileId ---');
    // ──────────────────────────────────────────────
    const runRes = await fetch(`${BASE_URL}/api/run`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer demo-bearer-token',
      },
      body: JSON.stringify({
        roomId: room.id,
        fileId: 'calc_py', // solver.py containing print(200 + 45)
      }),
    });
    const runData = await runRes.json();
    assert(runData.success === true, 'Execution with fileId returned HTTP 200 Success');
    assert(runData.submission && runData.submission.stdout?.trim() === '245', `Execution output matches calculation: ${runData.submission?.stdout?.trim()}`);
    assert(runData.file && runData.file.name === 'solver.py', `Run response contains executed file metadata: ${runData.file?.name}`);
    assert(runData.file && runData.file.language?.includes('Python'), `Language auto-detected from file extension: ${runData.file?.language}`);

    // ──────────────────────────────────────────────
    console.log('\n--- Step 7: File Deletion Synchronization ---');
    // ──────────────────────────────────────────────
    aliceFiles.delete('calc_py');
    await sleep(600);

    assert(!charlieFiles.has('calc_py'), 'File deletion synchronized in real time to Charlie');

    // ──────────────────────────────────────────────
    console.log('\n--- Step 8: Viewer Read-Only Enforcement ---');
    // ──────────────────────────────────────────────
    // Create dedicated viewer room
    const viewerRoomRes = await fetch(`${BASE_URL}/api/rooms`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer demo-bearer-token',
      },
      body: JSON.stringify({
        name: 'Week A Viewer Room',
        language_id: 63,
        linkAccess: 'viewer',
      }),
    });
    const { room: viewerRoom } = await viewerRoomRes.json();

    const bobTicketRes = await fetch(`${BASE_URL}/api/rooms/${viewerRoom.id}/ticket`, {
      method: 'POST',
      headers: { Authorization: 'Bearer demo-viewer-token' },
    });
    const { ticket: bobTicket } = await bobTicketRes.json();

    let bobSynced = false;
    const bobDoc = new Y.Doc();
    const bobProvider = new HocuspocusProvider({
      url: WS_URL,
      name: viewerRoom.id,
      token: bobTicket,
      document: bobDoc,
      onSynced: () => { bobSynced = true; },
    });

    await sleep(1500);
    assert(bobSynced, 'Bob (Viewer) connected to room');

    // Bob attempts to create an unauthorized file
    const viewerUnauthorizedFile = new Y.Map();
    viewerUnauthorizedFile.set('id', 'hacked_file');
    viewerUnauthorizedFile.set('name', 'hacked.js');
    const hackedText = new Y.Text();
    hackedText.insert(0, 'alert(1)');
    viewerUnauthorizedFile.set('text', hackedText);

    bobDoc.getMap('files').set('hacked_file', viewerUnauthorizedFile);
    await sleep(600);

    // Verify owner does not see hacked_file
    const ownerTicketRes = await fetch(`${BASE_URL}/api/rooms/${viewerRoom.id}/ticket`, {
      method: 'POST',
      headers: { Authorization: 'Bearer demo-bearer-token' },
    });
    const { ticket: ownerTicket } = await ownerTicketRes.json();
    let ownerSynced = false;
    const ownerDoc = new Y.Doc();
    const ownerProvider = new HocuspocusProvider({
      url: WS_URL,
      name: viewerRoom.id,
      token: ownerTicket,
      document: ownerDoc,
      onSynced: () => { ownerSynced = true; },
    });
    await sleep(1500);

    assert(!ownerDoc.getMap('files').has('hacked_file'), 'Server discarded read-only viewer file creation attempt');
    bobProvider.destroy();
    bobDoc.destroy();
    ownerProvider.destroy();
    ownerDoc.destroy();

    // ──────────────────────────────────────────────
    console.log('\n--- Step 9: Room Snapshot Persistence & Restoration ---');
    // ──────────────────────────────────────────────
    // Alice adds a final persistent file "shared_module.js"
    const modFile = new Y.Map();
    modFile.set('id', 'module_js');
    modFile.set('name', 'shared_module.js');
    const modText = new Y.Text();
    modText.insert(0, 'export const GREETING = "Hello from Week A!";\n');
    modFile.set('text', modText);
    modFile.set('createdAt', Date.now());
    modFile.set('updatedAt', Date.now());
    aliceFiles.set('module_js', modFile);

    console.log('  Waiting 3s for Hocuspocus store document debounce...');
    await sleep(3000);

    // Disconnect all clients
    aliceProvider.destroy();
    aliceDoc.destroy();
    charlieProvider.destroy();
    charlieDoc.destroy();
    bobProvider.destroy();
    bobDoc.destroy();

    // Rejoin as Dave with a new ticket
    const daveTicketRes = await fetch(`${BASE_URL}/api/rooms/${room.id}/ticket`, {
      method: 'POST',
      headers: { Authorization: 'Bearer demo-bearer-token' },
    });
    const { ticket: daveTicket } = await daveTicketRes.json();

    let daveSynced = false;
    const daveDoc = new Y.Doc();
    const daveProvider = new HocuspocusProvider({
      url: WS_URL,
      name: room.id,
      token: daveTicket,
      document: daveDoc,
      onSynced: () => { daveSynced = true; },
    });

    await sleep(1500);
    assert(daveSynced, 'Dave reconnected to room');
    const daveFiles = daveDoc.getMap('files');
    assert(daveFiles.has('main'), 'Persisted snapshot restored main file');
    assert(daveFiles.has('module_js'), 'Persisted snapshot restored shared_module.js');
    assert(daveFiles.get('module_js')?.get('text')?.toString().includes('Hello from Week A!'), 'Restored file contents match original');

    daveProvider.destroy();
    daveDoc.destroy();

    console.log('\n================================');
    console.log(`WEEK A TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log('================================\n');

    if (failed > 0) {
      process.exitCode = 1;
    }
  } catch (err) {
    console.error('Fatal test error:', err);
    process.exitCode = 1;
  } finally {
    stopServer();
  }
}

runTests();
