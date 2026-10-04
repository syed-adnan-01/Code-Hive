/**
 * Test simulating two different Google accounts that share the same display name
 * ("Syed Adnan Ahmad") but have different Gmail addresses and distinct Firebase UIDs.
 */

function makeSimulatedFirebaseJwt(payload) {
  const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = 'simulated_sig';
  return `${header}.${body}.${signature}`;
}

async function runTwoGoogleAccountsTest() {
  console.log('🧪 Starting Two Google Accounts (Same Name, Different UIDs) Test...\n');

  const backendUrl = 'http://localhost:5000';

  // Account 1: First Gmail
  const user1Payload = {
    sub: 'google_oauth_uid_adnan_account_1',
    user_id: 'google_oauth_uid_adnan_account_1',
    email: 'adnan.personal@gmail.com',
    email_verified: true,
    name: 'Syed Adnan Ahmad',
  };
  const tokenUser1 = makeSimulatedFirebaseJwt(user1Payload);

  // Account 2: Second Gmail (Same name: Syed Adnan Ahmad)
  const user2Payload = {
    sub: 'google_oauth_uid_adnan_account_2',
    user_id: 'google_oauth_uid_adnan_account_2',
    email: 'adnan.work@gmail.com',
    email_verified: true,
    name: 'Syed Adnan Ahmad',
  };
  const tokenUser2 = makeSimulatedFirebaseJwt(user2Payload);

  // Step 1: User 1 creates room
  console.log('1️⃣ User 1 (adnan.personal@gmail.com) creates a room...');
  const createRes = await fetch(`${backendUrl}/api/rooms`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${tokenUser1}`,
    },
    body: JSON.stringify({
      name: 'CodeHive Pair Session',
      language_id: 63,
      linkAccess: 'editor',
    }),
  });

  const createData = await createRes.json();
  if (!createRes.ok || !createData.success) {
    throw new Error(`Failed to create room: ${JSON.stringify(createData)}`);
  }
  const roomId = createData.room.id;
  console.log(`   ✅ Room created: ${roomId}`);
  console.log(`   Room Owner UID: ${createData.room.ownerUid}`);
  if (createData.room.ownerUid !== user1Payload.sub) {
    throw new Error(`Expected ownerUid to be '${user1Payload.sub}', got '${createData.room.ownerUid}'`);
  }

  // Step 2: User 1 retrieves room
  console.log('\n2️⃣ User 1 checks room role...');
  const res1 = await fetch(`${backendUrl}/api/rooms/${roomId}`, {
    headers: { 'Authorization': `Bearer ${tokenUser1}` },
  });
  const data1 = await res1.json();
  console.log(`   User 1 role: "${data1.room.userRole}"`);
  if (data1.room.userRole !== 'owner') {
    throw new Error(`Expected User 1 role to be 'owner', got '${data1.room.userRole}'`);
  }
  console.log('   ✅ User 1 correctly verified as OWNER');

  // Step 3: User 2 retrieves room
  console.log('\n3️⃣ User 2 (adnan.work@gmail.com, same name "Syed Adnan Ahmad") opens room...');
  const res2 = await fetch(`${backendUrl}/api/rooms/${roomId}`, {
    headers: { 'Authorization': `Bearer ${tokenUser2}` },
  });
  const data2 = await res2.json();
  console.log(`   User 2 role: "${data2.room.userRole}"`);
  if (data2.room.userRole !== 'editor') {
    throw new Error(`Expected User 2 role to be 'editor', got '${data2.room.userRole}'`);
  }
  console.log('   ✅ User 2 correctly verified as EDITOR (NOT Owner!)');

  // Step 4: Verify WebSocket single-use tickets
  console.log('\n4️⃣ Verifying WebSocket tickets for both Google accounts...');
  const tkt1Res = await fetch(`${backendUrl}/api/rooms/${roomId}/ticket`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${tokenUser1}` },
  });
  const tkt1 = await tkt1Res.json();
  console.log(`   User 1 Ticket role: "${tkt1.role}"`);
  if (tkt1.role !== 'owner') {
    throw new Error(`Expected User 1 ticket role 'owner', got '${tkt1.role}'`);
  }

  const tkt2Res = await fetch(`${backendUrl}/api/rooms/${roomId}/ticket`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${tokenUser2}` },
  });
  const tkt2 = await tkt2Res.json();
  console.log(`   User 2 Ticket role: "${tkt2.role}"`);
  if (tkt2.role !== 'editor') {
    throw new Error(`Expected User 2 ticket role 'editor', got '${tkt2.role}'`);
  }
  console.log('   ✅ User 2 ticket correctly reflects EDITOR role');

  console.log('\n🎉 ALL TWO GOOGLE ACCOUNTS TESTS PASSED 100%! 🚀');
}

runTwoGoogleAccountsTest().catch((err) => {
  console.error('\n❌ Test failed:', err);
  process.exit(1);
});
