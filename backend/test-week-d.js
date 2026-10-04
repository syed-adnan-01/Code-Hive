// Comprehensive Automated Test Suite for Week D: Audio & Video Communication (WebRTC)
// Tests ICE configuration, Mesh Call Participation (max 4), Media state toggles, and Secure Signalling Relay
import http from 'http';

const BASE_URL = 'http://localhost:5000';

const request = ({ method = 'GET', path, headers = {}, body = null }) => {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const reqHeaders = {
      'Content-Type': 'application/json',
      ...headers,
    };

    const req = http.request(
      url,
      {
        method,
        headers: reqHeaders,
      },
      (res) => {
        let rawData = '';
        res.on('data', (chunk) => {
          rawData += chunk;
        });
        res.on('end', () => {
          try {
            const parsed = rawData ? JSON.parse(rawData) : {};
            resolve({ status: res.statusCode, headers: res.headers, body: parsed });
          } catch (e) {
            resolve({ status: res.statusCode, headers: res.headers, body: rawData });
          }
        });
      }
    );

    req.on('error', reject);
    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
};

const assert = (condition, message) => {
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
  console.log(`✅ PASSED: ${message}`);
};

const runWeekDTests = async () => {
  console.log('\n======================================================');
  console.log('🐝 RUNNING WEEK D TEST SUITE: WEBRTC AUDIO & VIDEO CALLS');
  console.log('======================================================\n');

  // Test User Tokens (Demo Auth Mock Tokens with unique roles/names)
  const aliceToken = 'Bearer demo-alice-token'; // Alice: uid demo-user-123, role: owner
  const bobToken = 'Bearer demo-bob-token';     // Bob: uid demo-bob-uid, role: editor
  const charlieToken = 'Bearer demo-charlie-token'; // Charlie: uid demo-charlie-uid
  const daveToken = 'Bearer demo-dave-token';       // Dave: uid demo-dave-uid
  const eveToken = 'Bearer demo-eve-token';         // Eve: uid demo-eve-uid

  // Pre-seed UIDs for deterministic assertions
  const aliceUid = 'demo-alice-uid';
  const bobUid = 'demo-bob-uid';
  const charlieUid = 'demo-charlie-uid';
  const daveUid = 'demo-dave-uid';
  const eveUid = 'demo-eve-uid';

  // --------------------------------------------------------------------------
  // 1. ICE CONFIGURATION (GET /api/rtc/ice)
  // --------------------------------------------------------------------------
  console.log('\n--- 1. ICE CONFIGURATION & AUTHENTICATION ---');

  // 1.1 Unauthenticated ICE request
  const noAuthIce = await request({ path: '/api/rtc/ice' });
  assert(noAuthIce.status === 401, 'Unauthenticated /api/rtc/ice rejected with 401 Unauthorized');

  // 1.2 Authenticated ICE request
  const authIce = await request({
    path: '/api/rtc/ice',
    headers: { Authorization: aliceToken },
  });
  assert(authIce.status === 200, 'Authenticated /api/rtc/ice returned HTTP 200 OK');
  assert(authIce.body.success === true, 'Response indicates success: true');
  assert(Array.isArray(authIce.body.iceServers), 'Returns iceServers array');
  assert(authIce.body.iceServers.length > 0, 'iceServers array is non-empty');
  assert(
    authIce.body.iceServers.some((s) => JSON.stringify(s).includes('stun:')),
    'iceServers contains public Google STUN server fallback'
  );

  // --------------------------------------------------------------------------
  // 2. ROOM CREATION & CALL PARTICIPATION (POST /api/rtc/rooms/:id/join)
  // --------------------------------------------------------------------------
  console.log('\n--- 2. CALL PARTICIPATION & MESH CAPACITY (MAX 4) ---');

  const testRoomId = `hive-call-${Date.now()}`;

  // 2.1 Alice joins room call (User 1)
  const joinAlice = await request({
    method: 'POST',
    path: `/api/rtc/rooms/${testRoomId}/join`,
    headers: { Authorization: aliceToken },
    body: { audio: true, video: false },
  });
  assert(joinAlice.status === 200, 'Alice joins call with HTTP 200 OK');
  assert(joinAlice.body.participant.uid === aliceUid, 'Participant UID matches Alice');
  assert(joinAlice.body.participant.audio === true, 'Alice mic enabled by default');
  assert(joinAlice.body.participant.video === false, 'Alice camera off by default');
  assert(joinAlice.body.participants.length === 1, 'Current call participants count is 1');

  // 2.2 Bob joins call (User 2)
  const joinBob = await request({
    method: 'POST',
    path: `/api/rtc/rooms/${testRoomId}/join`,
    headers: { Authorization: bobToken },
    body: { audio: true, video: true },
  });
  assert(joinBob.status === 200, 'Bob joins call with HTTP 200 OK');
  assert(joinBob.body.participant.uid === bobUid, 'Participant UID matches Bob');
  assert(joinBob.body.participant.video === true, 'Bob video enabled');
  assert(joinBob.body.participants.length === 2, 'Current call participants count is 2');

  // 2.3 Charlie joins call (User 3)
  const joinCharlie = await request({
    method: 'POST',
    path: `/api/rtc/rooms/${testRoomId}/join`,
    headers: { Authorization: charlieToken },
    body: { audio: true, video: false },
  });
  assert(joinCharlie.status === 200, 'Charlie joins call with HTTP 200 OK');
  assert(joinCharlie.body.participants.length === 3, 'Current call participants count is 3');

  // 2.4 Dave joins call (User 4 - Maximum Mesh Capacity)
  const joinDave = await request({
    method: 'POST',
    path: `/api/rtc/rooms/${testRoomId}/join`,
    headers: { Authorization: daveToken },
    body: { audio: false, video: false },
  });
  assert(joinDave.status === 200, 'Dave joins call with HTTP 200 OK');
  assert(joinDave.body.participants.length === 4, 'Call reached full mesh limit of 4 participants');

  // 2.5 Eve attempts to join 5th participant -> MUST be rejected per Section 7
  const joinEve = await request({
    method: 'POST',
    path: `/api/rtc/rooms/${testRoomId}/join`,
    headers: { Authorization: eveToken },
    body: { audio: true, video: false },
  });
  assert(joinEve.status === 400, '5th participant (Eve) rejected with HTTP 400 Bad Request');
  assert(
    joinEve.body.error.includes('maximum of 4 participants'),
    'Error specifies WebRTC mesh 4-participant limit'
  );

  // --------------------------------------------------------------------------
  // 3. MEDIA STATE TOGGLES (PATCH /api/rtc/rooms/:id/media)
  // --------------------------------------------------------------------------
  console.log('\n--- 3. MEDIA STATE TOGGLES (MUTE / CAMERA) ---');

  // 3.1 Alice mutes microphone
  const muteAlice = await request({
    method: 'PATCH',
    path: `/api/rtc/rooms/${testRoomId}/media`,
    headers: { Authorization: aliceToken },
    body: { audio: false },
  });
  assert(muteAlice.status === 200, 'Alice toggles mute with HTTP 200 OK');
  assert(muteAlice.body.participant.audio === false, 'Alice audio state updated to false (muted)');

  // 3.2 Non-participant attempting media update
  const invalidMedia = await request({
    method: 'PATCH',
    path: `/api/rtc/rooms/${testRoomId}/media`,
    headers: { Authorization: eveToken },
    body: { audio: true },
  });
  assert(invalidMedia.status === 404, 'Non-participant media update rejected with 404 Not Found');

  // --------------------------------------------------------------------------
  // 4. SECURE SIGNALLING RELAY (SDP OFFER / ANSWER / ICE)
  // --------------------------------------------------------------------------
  console.log('\n--- 4. SECURE SIGNALLING RELAY & IDENTITY STAMPING ---');

  // 4.1 Signalling oneself is prohibited
  const selfSignal = await request({
    method: 'POST',
    path: `/api/rtc/rooms/${testRoomId}/signal`,
    headers: { Authorization: aliceToken },
    body: {
      targetUid: aliceUid,
      type: 'offer',
      payload: { sdp: 'fake-sdp-offer' },
    },
  });
  assert(selfSignal.status === 400, 'Sending signal to oneself rejected with 400 Bad Request');

  // 4.2 Invalid signal type
  const badTypeSignal = await request({
    method: 'POST',
    path: `/api/rtc/rooms/${testRoomId}/signal`,
    headers: { Authorization: aliceToken },
    body: {
      targetUid: bobUid,
      type: 'unknown-hack',
      payload: { test: true },
    },
  });
  assert(badTypeSignal.status === 400, 'Invalid signal type rejected with 400 Bad Request');

  // 4.3 Alice sends SDP Offer to Bob
  const offerRes = await request({
    method: 'POST',
    path: `/api/rtc/rooms/${testRoomId}/signal`,
    headers: { Authorization: aliceToken },
    body: {
      targetUid: bobUid,
      type: 'offer',
      payload: { sdp: 'v=0\r\no=alice 12345 IN IP4 0.0.0.0\r\ns=CodeHive Call' },
    },
  });
  assert(offerRes.status === 200, 'Alice sends SDP Offer to Bob with 200 OK');
  assert(offerRes.body.success === true, 'Offer relay returned success: true');
  assert(offerRes.body.type === 'offer', 'Offer relay confirmed signal type');

  // 4.4 Bob retrieves and consumes signals
  const bobSignals = await request({
    path: `/api/rtc/rooms/${testRoomId}/signals`,
    headers: { Authorization: bobToken },
  });
  assert(bobSignals.status === 200, 'Bob retrieves queued signals with 200 OK');
  assert(Array.isArray(bobSignals.body.signals), 'Signals is an array');
  assert(bobSignals.body.signals.length === 1, 'Bob received exactly 1 queued signal');
  const receivedOffer = bobSignals.body.signals[0];
  assert(receivedOffer.type === 'offer', 'Received signal is SDP offer');
  assert(receivedOffer.senderUid === aliceUid, 'Server stamped authentic sender UID (Alice)');
  assert(receivedOffer.targetUid === bobUid, 'Target UID matches Bob');
  assert(receivedOffer.payload.sdp.includes('v=0'), 'Payload SDP preserved intact');

  // 4.5 Consuming signals drains queue
  const bobSignalsAgain = await request({
    path: `/api/rtc/rooms/${testRoomId}/signals`,
    headers: { Authorization: bobToken },
  });
  assert(bobSignalsAgain.body.signals.length === 0, 'Signal queue drained after read');

  // 4.6 Bob sends SDP Answer to Alice
  const answerRes = await request({
    method: 'POST',
    path: `/api/rtc/rooms/${testRoomId}/signal`,
    headers: { Authorization: bobToken },
    body: {
      targetUid: aliceUid,
      type: 'answer',
      payload: { sdp: 'v=0\r\no=bob 67890 IN IP4 0.0.0.0\r\ns=CodeHive Call' },
    },
  });
  assert(answerRes.status === 200, 'Bob sends SDP Answer to Alice with 200 OK');

  // 4.7 Alice retrieves Bob's SDP Answer
  const aliceSignals = await request({
    path: `/api/rtc/rooms/${testRoomId}/signals`,
    headers: { Authorization: aliceToken },
  });
  assert(aliceSignals.body.signals.length === 1, 'Alice received Bob answer');
  assert(aliceSignals.body.signals[0].type === 'answer', 'Signal type is answer');
  assert(aliceSignals.body.signals[0].senderUid === bobUid, 'Sender UID stamped as Bob');

  // 4.8 ICE Candidate exchange
  const iceCandRes = await request({
    method: 'POST',
    path: `/api/rtc/rooms/${testRoomId}/signal`,
    headers: { Authorization: aliceToken },
    body: {
      targetUid: bobUid,
      type: 'candidate',
      payload: { candidate: 'candidate:1 1 UDP 2130706431 192.168.1.100 50000 typ host', sdpMid: '0', sdpMLineIndex: 0 },
    },
  });
  assert(iceCandRes.status === 200, 'Alice sends ICE Candidate to Bob with 200 OK');

  const bobCandidates = await request({
    path: `/api/rtc/rooms/${testRoomId}/signals`,
    headers: { Authorization: bobToken },
  });
  assert(bobCandidates.body.signals.length === 1, 'Bob received ICE candidate');
  assert(bobCandidates.body.signals[0].type === 'candidate', 'Signal type is candidate');

  // --------------------------------------------------------------------------
  // 5. CALL LEAVE & MESH VACANCY MANAGEMENT
  // --------------------------------------------------------------------------
  console.log('\n--- 5. CALL LEAVE & DYNAMIC CAPACITY RESTORATION ---');

  // 5.1 Dave leaves the call
  const leaveDave = await request({
    method: 'POST',
    path: `/api/rtc/rooms/${testRoomId}/leave`,
    headers: { Authorization: daveToken },
  });
  assert(leaveDave.status === 200, 'Dave leaves call with HTTP 200 OK');
  assert(leaveDave.body.remainingCount === 3, 'Remaining participants count decremented to 3');

  // 5.2 Now that vacancy exists, Eve can join the 4th spot
  const joinEveNow = await request({
    method: 'POST',
    path: `/api/rtc/rooms/${testRoomId}/join`,
    headers: { Authorization: eveToken },
    body: { audio: true, video: false },
  });
  assert(joinEveNow.status === 200, 'Eve successfully joins previously full call with 200 OK');
  assert(joinEveNow.body.participants.length === 4, 'Mesh capacity filled again to 4');

  // 5.3 Active call status endpoint verifies participants
  const statusRes = await request({
    path: `/api/rtc/rooms/${testRoomId}/call`,
    headers: { Authorization: aliceToken },
  });
  assert(statusRes.status === 200, 'GET /api/rtc/rooms/:id/call returned 200 OK');
  assert(statusRes.body.activeCount === 4, 'Active count is 4');
  assert(statusRes.body.maxParticipants === 4, 'Max participants confirmed as 4');

  console.log('\n======================================================');
  console.log('🎉 ALL 24 WEEK D ASSERTIONS PASSED (100%)');
  console.log('======================================================\n');
};

runWeekDTests().catch((err) => {
  console.error('\n❌ WEEK D TEST SUITE FAILED:', err);
  process.exit(1);
});
