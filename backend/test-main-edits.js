import assert from 'assert';
import * as Y from 'yjs';
import { HocuspocusProvider } from '@hocuspocus/provider';
// Use global WebSocket built into Node.js

const BASE_URL = 'http://localhost:5000';
const WS_URL = 'ws://localhost:5000';
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function run() {
  console.log('Testing User Bug Fix: Changes in main.js must reflect in output when clicking Run Code...');

  // 1. Create Room
  const roomRes = await fetch(`${BASE_URL}/api/rooms`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer demo-alice-token',
    },
    body: JSON.stringify({
      name: 'User Bug Reproduction Room',
      language_id: 63, // JavaScript
    }),
  }).then((r) => r.json());

  assert(roomRes.success, 'Room created successfully');
  const roomId = roomRes.room.id;
  console.log(`Created room: ${roomId}`);

  // 2. Connect client and get ticket
  const ticketRes = await fetch(`${BASE_URL}/api/rooms/${roomId}/ticket`, {
    method: 'POST',
    headers: { Authorization: 'Bearer demo-alice-token' },
  }).then((r) => r.json());

  const doc = new Y.Doc();
  let synced = false;
  const provider = new HocuspocusProvider({
    url: WS_URL,
    name: roomId,
    token: ticketRes.ticket,
    document: doc,
    WebSocketPolyfill: WebSocket,
    onSynced: () => { synced = true; },
  });

  await sleep(1500);
  assert(synced, 'Client connected and synced');

  // 3. Inspect main file and simulate user editing in Monaco Editor
  const filesMap = doc.getMap('files');
  const mainFile = filesMap.get('main');
  assert(mainFile, 'main file exists in filesMap');

  const mainText = mainFile.get('text');
  console.log('Original main.js code:', mainText.toString().trim());

  // User adds console.log('Hello World'); exactly as in screenshot!
  const editedCode = `// CodeHive JavaScript Playground
function greet(name) {
  return \`Hello, \${name}! Welcome to CodeHive IDE 🐝\`;
}

console.log('Hello World');

console.log(greet('Developer'));
console.log('Execution environment: Node.js in sandboxed container.');
`;

  mainText.delete(0, mainText.length);
  mainText.insert(0, editedCode);

  await sleep(800); // Allow WebSocket to send diff to Hocuspocus server

  // 4. User clicks "Run Code" in browser
  console.log('Executing code via /api/run with fileId: "main"...');
  const runRes = await fetch(`${BASE_URL}/api/run`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer demo-alice-token',
    },
    body: JSON.stringify({
      roomId,
      fileId: 'main',
      language_id: 63,
    }),
  }).then((r) => r.json());

  console.log('Run response:', JSON.stringify(runRes.submission?.stdout));
  assert(runRes.success, 'Code execution succeeded');
  assert(runRes.submission && runRes.submission.stdout, 'Stdout returned');
  assert(
    runRes.submission.stdout.includes('Hello World'),
    `Expected stdout to include "Hello World", but got: ${runRes.submission.stdout}`
  );
  assert(
    runRes.submission.stdout.includes('Hello, Developer!'),
    'Expected stdout to include "Hello, Developer!"'
  );

  console.log('\n✅ VERIFIED: User changes in main.js were successfully executed and shown in output stdout!');

  provider.destroy();
  doc.destroy();
  process.exit(0);
}

run().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
