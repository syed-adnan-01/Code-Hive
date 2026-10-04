// Comprehensive Automated Test Suite for Week B: Admin Panel + Live Chat
// Verifies security, authorization, language control, user management, audit logs, and room chat
import http from 'http';

const API_BASE = 'http://localhost:5000';

const request = ({ path, method = 'GET', headers = {}, body = null }) => {
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

const runWeekBTests = async () => {
  console.log('\n========================================');
  console.log('🐝 RUNNING WEEK B TEST SUITE: ADMIN & CHAT');
  console.log('========================================\n');

  const adminToken = 'Bearer demo-admin-token';
  const aliceToken = 'Bearer demo-alice-token';
  const viewerToken = 'Bearer demo-viewer-token';
  const runNonce = Math.floor(Math.random() * 10000);
  const badActorUsername = `badactor${runNonce}`;
  const badActorUid = `demo-${badActorUsername}-uid`;
  const badActorToken = `Bearer demo-${badActorUsername}-token`;

  // --- SECTION 1: ADMIN ROUTE ACCESS & RBAC ---
  console.log('\n--- 1. ADMIN AUTHORIZATION & ACCESS CONTROL ---');

  // 1.1 Unauthenticated access to admin routes
  const noAuth = await request({ path: '/api/admin/languages', method: 'GET' });
  assert(noAuth.status === 401, 'Unauthenticated request to /api/admin/languages rejected with 401');

  // 1.2 Non-admin user access to admin routes
  const nonAdmin = await request({
    path: '/api/admin/languages',
    method: 'GET',
    headers: { Authorization: aliceToken },
  });
  assert(nonAdmin.status === 403, 'Non-admin user (Alice) rejected with 403 on /api/admin/languages');
  assert(nonAdmin.body.error.includes('Administrator privileges required'), 'Error explains admin privileges required');

  // 1.3 Admin user access to admin routes
  const adminLangs = await request({
    path: '/api/admin/languages',
    method: 'GET',
    headers: { Authorization: adminToken },
  });
  assert(adminLangs.status === 200, 'Admin successfully accesses /api/admin/languages with 200 OK');
  assert(Array.isArray(adminLangs.body.languages), 'Returns array of languages for admin');
  assert(adminLangs.body.languages.length >= 7, 'Admin language list contains all default languages');

  // --- SECTION 2: LANGUAGE TOGGLING & RUN ENFORCEMENT ---
  console.log('\n--- 2. ADMIN LANGUAGE CONTROL & RUN ENFORCEMENT ---');

  // 2.1 Admin disables Python (id: 71)
  const disablePy = await request({
    path: '/api/admin/languages/71',
    method: 'PATCH',
    headers: { Authorization: adminToken },
    body: { enabled: false },
  });
  assert(disablePy.status === 200, 'Admin disables Python (ID 71) with 200 OK');
  assert(disablePy.body.language.enabled === false, 'Python enabled status is now false');

  // 2.2 Public languages dropdown should not contain disabled language
  const publicLangs = await request({
    path: '/api/run/languages',
    method: 'GET',
    headers: { Authorization: aliceToken },
  });
  assert(publicLangs.status === 200, 'Public GET /api/run/languages succeeds');
  const pyInDropdown = publicLangs.body.languages.find((l) => l.id === 71);
  assert(!pyInDropdown, 'Disabled language (Python 71) is hidden from regular users dropdown');

  // 2.3 Attempt to execute disabled language must fail with 400 Bad Request
  const runPy = await request({
    path: '/api/run',
    method: 'POST',
    headers: { Authorization: aliceToken },
    body: {
      source_code: 'print("Hello from Python")',
      language_id: 71,
    },
  });
  assert(runPy.status === 400, 'Execution of disabled language rejected with 400 Bad Request');
  assert(runPy.body.error.includes('currently disabled by administrator'), 'Error specifies language is disabled by admin');

  // 2.4 Admin re-enables Python
  const enablePy = await request({
    path: '/api/admin/languages/71',
    method: 'PATCH',
    headers: { Authorization: adminToken },
    body: { enabled: true },
  });
  assert(enablePy.status === 200, 'Admin re-enables Python with 200 OK');
  assert(enablePy.body.language.enabled === true, 'Python enabled status restored to true');

  // 2.5 Public dropdown includes Python again
  const publicLangsRestored = await request({
    path: '/api/run/languages',
    method: 'GET',
    headers: { Authorization: aliceToken },
  });
  const pyRestored = publicLangsRestored.body.languages.find((l) => l.id === 71);
  assert(!!pyRestored, 'Re-enabled language (Python 71) appears in public dropdown again');

  // --- SECTION 3: USER MANAGEMENT & ACCOUNT REVOCATION ---
  console.log('\n--- 3. USER MANAGEMENT & IMMEDIATE ACCOUNT REVOCATION ---');

  // 3.1 Admin lists users
  const userList = await request({
    path: '/api/admin/users',
    method: 'GET',
    headers: { Authorization: adminToken },
  });
  assert(userList.status === 200, 'Admin lists all users with 200 OK');
  assert(Array.isArray(userList.body.users), 'Returns array of users');

  // 3.2 Verify bad actor can initially make requests to protected endpoints
  const preCheck = await request({
    path: '/api/run/history',
    method: 'GET',
    headers: { Authorization: badActorToken },
  });
  assert(preCheck.status === 200, 'Bad actor initially has active access to protected endpoints');

  // 3.3 Admin disables bad actor
  const disableUser = await request({
    path: `/api/admin/users/${badActorUid}/disable`,
    method: 'POST',
    headers: { Authorization: adminToken },
  });
  assert(disableUser.status === 200, `Admin disables user ${badActorUid} with 200 OK`);
  assert(disableUser.body.user.disabled === true, 'Response confirms disabled: true');

  // 3.4 Disabled user immediately gets 403 Forbidden on subsequent requests
  const blockedCheck = await request({
    path: '/api/run/history',
    method: 'GET',
    headers: { Authorization: badActorToken },
  });
  assert(blockedCheck.status === 403, 'Disabled user is immediately blocked with 403 Forbidden');
  assert(blockedCheck.body.error.includes('Account disabled'), 'Error explains account disabled and access revoked');

  // 3.5 Disabled user cannot request room tickets
  const blockedTicket = await request({
    path: '/api/rooms/hive-any/ticket',
    method: 'POST',
    headers: { Authorization: badActorToken },
  });
  assert(blockedTicket.status === 403, 'Disabled user blocked from room tickets with 403');

  // 3.6 Admin re-enables user
  const enableUser = await request({
    path: `/api/admin/users/${badActorUid}/enable`,
    method: 'POST',
    headers: { Authorization: adminToken },
  });
  assert(enableUser.status === 200, `Admin re-enables user ${badActorUid}`);
  assert(enableUser.body.user.disabled === false, 'User disabled status is false');

  const unblockedCheck = await request({
    path: '/api/run/history',
    method: 'GET',
    headers: { Authorization: badActorToken },
  });
  assert(unblockedCheck.status === 200, 'Re-enabled user can access platform normally');

  // --- SECTION 4: SYSTEM STATS & AUDIT LOGS ---
  console.log('\n--- 4. SYSTEM STATS & AUDIT LOGGING ---');

  const stats = await request({
    path: '/api/admin/stats',
    method: 'GET',
    headers: { Authorization: adminToken },
  });
  assert(stats.status === 200, 'Admin retrieves system stats with 200 OK');
  assert(stats.body.stats.totalUsers > 0, 'Stats includes totalUsers metric');
  assert(stats.body.stats.runsToday !== undefined, 'Stats includes runsToday metric');
  assert(Array.isArray(stats.body.stats.topLanguages), 'Stats includes topLanguages breakdown');

  const logs = await request({
    path: '/api/admin/logs',
    method: 'GET',
    headers: { Authorization: adminToken },
  });
  assert(logs.status === 200, 'Admin retrieves audit logs with 200 OK');
  assert(Array.isArray(logs.body.logs), 'Audit logs is an array');
  assert(logs.body.logs.length >= 3, 'Audit logs contains entries for recent admin actions');
  const hasLangAction = logs.body.logs.some((l) => l.action.startsWith('LANGUAGE_'));
  const hasUserAction = logs.body.logs.some((l) => l.action.startsWith('USER_'));
  assert(hasLangAction, 'Audit logs recorded language toggle actions');
  assert(hasUserAction, 'Audit logs recorded user disable/enable actions');

  // --- SECTION 5: LIVE ROOM CHAT ---
  console.log('\n--- 5. LIVE ROOM CHAT (SEND, HISTORY, LIMITS & XSS SAFETY) ---');

  // 5.1 Create a test room
  const createRoomRes = await request({
    path: '/api/rooms',
    method: 'POST',
    headers: { Authorization: aliceToken },
    body: {
      name: 'Chat Test Room',
      language_id: 63,
      linkAccess: 'editor',
    },
  });
  assert(createRoomRes.status === 201, 'Test room created for chat');
  const roomId = createRoomRes.body.room.id;

  // 5.2 Alice posts a message
  const msg1 = await request({
    path: `/api/rooms/${roomId}/messages`,
    method: 'POST',
    headers: { Authorization: aliceToken },
    body: {
      text: 'Hello team! Let us review the new features.',
    },
  });
  assert(msg1.status === 201, 'Alice posts chat message with 201 Created');
  assert(msg1.body.message.text === 'Hello team! Let us review the new features.', 'Message text matches');
  assert(msg1.body.message.senderName === 'Alice', 'Server-assigned senderName is Alice');
  assert(msg1.body.message.id.startsWith('msg_'), 'Message has generated unique id');

  // 5.3 Viewer posts a message (Editors and Viewers can both chat per plan)
  const msg2 = await request({
    path: `/api/rooms/${roomId}/messages`,
    method: 'POST',
    headers: { Authorization: viewerToken },
    body: {
      text: 'Viewer checking in, audio is clear!',
    },
  });
  assert(msg2.status === 201, 'Viewer posts chat message with 201 Created');

  // 5.4 Reject message over 500 characters
  const longText = 'A'.repeat(501);
  const rejectLong = await request({
    path: `/api/rooms/${roomId}/messages`,
    method: 'POST',
    headers: { Authorization: aliceToken },
    body: { text: longText },
  });
  assert(rejectLong.status === 400, 'Message with 501 characters rejected with 400 Bad Request');
  assert(rejectLong.body.error.includes('maximum limit of 500 characters'), 'Error clarifies 500-char limit');

  // 5.5 Reject empty message
  const rejectEmpty = await request({
    path: `/api/rooms/${roomId}/messages`,
    method: 'POST',
    headers: { Authorization: aliceToken },
    body: { text: '   ' },
  });
  assert(rejectEmpty.status === 400, 'Empty whitespace message rejected with 400 Bad Request');

  // 5.6 XSS safety: HTML script tag is stored safely as plain string
  const xssPayload = '<script>alert("XSS Attack!")</script>';
  const msgXss = await request({
    path: `/api/rooms/${roomId}/messages`,
    method: 'POST',
    headers: { Authorization: aliceToken },
    body: { text: xssPayload },
  });
  assert(msgXss.status === 201, 'HTML text stored safely as plain string without rejection');
  assert(msgXss.body.message.text === xssPayload, 'Payload preserved exactly as text for client-side plain text rendering');

  // 5.7 Retrieve chat history
  const historyRes = await request({
    path: `/api/rooms/${roomId}/messages`,
    method: 'GET',
    headers: { Authorization: aliceToken },
  });
  assert(historyRes.status === 200, 'Chat history retrieved with 200 OK');
  assert(Array.isArray(historyRes.body.messages), 'History is an array of messages');
  assert(historyRes.body.messages.length === 3, 'History contains 3 valid messages in order');
  assert(historyRes.body.messages[0].text === 'Hello team! Let us review the new features.', 'First message is oldest');
  assert(historyRes.body.messages[2].text === xssPayload, 'Last message is newest (chronological order)');

  // 5.8 Chat on invalid room returns 404
  const notFoundChat = await request({
    path: '/api/rooms/hive-nonexistent/messages',
    method: 'POST',
    headers: { Authorization: aliceToken },
    body: { text: 'Ghost message' },
  });
  assert(notFoundChat.status === 404, 'Message to nonexistent room returns 404 Not Found');

  console.log('\n========================================');
  console.log('🎉 ALL 26 WEEK B ASSERTIONS PASSED (100%)');
  console.log('========================================\n');
};

runWeekBTests().catch((err) => {
  console.error('\n❌ WEEK B TEST SUITE FAILED:', err);
  process.exit(1);
});
