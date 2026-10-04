/**
 * Verification test for multi-tab role resolution:
 * Ensures room creator is resolved as 'owner',
 * while peers joining via shared link are resolved as 'editor' or 'viewer'.
 */

async function runRoleResolutionTest() {
  console.log('🧪 Starting Multi-Tab Role Resolution Verification Test...\n');

  const backendUrl = 'http://localhost:5000';

  // 1. Tab 1 (Room Creator) creates an editor-access room
  console.log('1️⃣ Tab 1 (Creator): Creating room with demo-owner_tab1-token...');
  const createRes = await fetch(`${backendUrl}/api/rooms`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer demo-owner_tab1-token',
    },
    body: JSON.stringify({
      name: 'Pair Programming Session',
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
  console.log(`   Owner UID: ${createData.room.ownerUid}`);

  // 2. Tab 1 (Creator) fetches room details
  console.log('\n2️⃣ Tab 1 (Creator): Fetching room details...');
  const creatorGetRes = await fetch(`${backendUrl}/api/rooms/${roomId}`, {
    headers: {
      'Authorization': 'Bearer demo-owner_tab1-token',
    },
  });
  const creatorGetData = await creatorGetRes.json();
  console.log(`   Tab 1 User Role: "${creatorGetData.room.userRole}"`);
  if (creatorGetData.room.userRole !== 'owner') {
    throw new Error(`Expected Tab 1 role to be 'owner', got '${creatorGetData.room.userRole}'`);
  }
  console.log('   ✅ Tab 1 correctly identified as OWNER');

  // 3. Tab 2 (Collaborator joining via link) fetches room details
  console.log('\n3️⃣ Tab 2 (Collaborator): Fetching room details with demo-collab_tab2-token...');
  const guestGetRes = await fetch(`${backendUrl}/api/rooms/${roomId}`, {
    headers: {
      'Authorization': 'Bearer demo-collab_tab2-token',
    },
  });
  const guestGetData = await guestGetRes.json();
  console.log(`   Tab 2 User Role: "${guestGetData.room.userRole}"`);
  if (guestGetData.room.userRole !== 'editor') {
    throw new Error(`Expected Tab 2 role to be 'editor', got '${guestGetData.room.userRole}'`);
  }
  console.log('   ✅ Tab 2 correctly identified as EDITOR (NOT Owner!)');

  // 4. Test tickets for both tabs
  console.log('\n4️⃣ Testing single-use tickets for both tabs...');
  const ticket1Res = await fetch(`${backendUrl}/api/rooms/${roomId}/ticket`, {
    method: 'POST',
    headers: { 'Authorization': 'Bearer demo-owner_tab1-token' },
  });
  const ticket1Data = await ticket1Res.json();
  console.log(`   Tab 1 Ticket role: "${ticket1Data.role}"`);
  if (ticket1Data.role !== 'owner') {
    throw new Error(`Expected Tab 1 ticket role to be 'owner', got '${ticket1Data.role}'`);
  }

  const ticket2Res = await fetch(`${backendUrl}/api/rooms/${roomId}/ticket`, {
    method: 'POST',
    headers: { 'Authorization': 'Bearer demo-collab_tab2-token' },
  });
  const ticket2Data = await ticket2Res.json();
  console.log(`   Tab 2 Ticket role: "${ticket2Data.role}"`);
  if (ticket2Data.role !== 'editor') {
    throw new Error(`Expected Tab 2 ticket role to be 'editor', got '${ticket2Data.role}'`);
  }
  console.log('   ✅ Both tickets correctly reflect respective roles');

  // 5. Test Viewer linkAccess room
  console.log('\n5️⃣ Tab 1: Creating read-only room (linkAccess: "viewer")...');
  const viewerRoomRes = await fetch(`${backendUrl}/api/rooms`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer demo-owner_tab1-token',
    },
    body: JSON.stringify({
      name: 'Read Only Session',
      language_id: 63,
      linkAccess: 'viewer',
    }),
  });
  const viewerRoomData = await viewerRoomRes.json();
  const viewerRoomId = viewerRoomData.room.id;

  const guestViewerRes = await fetch(`${backendUrl}/api/rooms/${viewerRoomId}`, {
    headers: { 'Authorization': 'Bearer demo-collab_tab3-token' },
  });
  const guestViewerData = await guestViewerRes.json();
  console.log(`   Guest in Viewer room: role="${guestViewerData.room.userRole}"`);
  if (guestViewerData.room.userRole !== 'viewer') {
    throw new Error(`Expected Tab 3 in viewer room to be 'viewer', got '${guestViewerData.room.userRole}'`);
  }
  console.log('   ✅ Guest in viewer room correctly identified as VIEWER');

  console.log('\n🎉 ALL MULTI-TAB ROLE RESOLUTION TESTS PASSED SUCCESSFULLY! 🚀');
}

runRoleResolutionTest().catch((err) => {
  console.error('\n❌ Role resolution test failed:', err);
  process.exit(1);
});
