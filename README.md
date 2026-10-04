# 🐝 CodeHive - Collaborative Cloud Workspace & IDE

CodeHive is a high-performance, real-time collaborative workspace IDE built with **React**, **Vite**, **Monaco Editor**, **Yjs CRDTs**, **Hocuspocus WebSocket Engine**, and **Judge0 Sandbox Execution**. It enables multiple developers to write, edit, and execute code concurrently with deterministic synchronization, live presence, role-based access control, and plain-text secure console output.

---

## 🚀 Key Highlights & Architecture

- **Real-Time CRDT Collaboration**: Single source-of-truth document synchronized across browsers using Yjs and Hocuspocus with sub-50ms latency.
- **Role-Based Collaboration Security**: Owner, Editor, and Viewer access tiers. Viewers are connected read-only at the WebSocket layer and blocked from executing code.
- **Chain-of-Trust WebSocket Tickets**: Single-use, 60-second room tickets issued via Firebase Auth-verified REST endpoints (`POST /api/rooms/:id/ticket`), keeping long-lived credentials away from WebSocket channels.
- **Judge0 Execution Engine**: Sandboxed multi-language compilation with exponential backoff polling, 64 KB output capping, and resilient local fallback.
- **Shared Room Execution**: In collaborative rooms, the server executes its own verified copy of the shared document (`Y.Text('code')`) and broadcasts formatted run results to all peers via `Y.Map('meta')`.
- **Submission History**: Persistent tracking of execution runs, memory usage, runtime metrics, and error codes (`GET /api/run/history`).
- **Cloud Firestore Security & Snapshot Persistence**: Debounced room snapshot persistence with 1 MiB document warning buffers and hardened Firestore rules (`firestore.rules`).

---

## 🛠️ Supported Programming Languages

| Language | Judge0 ID | Monaco ID | Default Template | Stdin Support |
| :--- | :--- | :--- | :--- | :--- |
| **JavaScript** | `63` | `javascript` | Node.js runtime | `readline` |
| **Python** | `71` | `python` | Python 3.8+ | `sys.stdin` / `input` |
| **C++** | `54` | `cpp` | GCC C++17 | `std::cin` |
| **Java** | `62` | `java` | OpenJDK 13 | `java.util.Scanner` |
| **TypeScript** | `74` | `typescript` | TS 3.7.4 | Available |
| **Go** | `60` | `go` | Go 1.13 | `fmt.Scan` |
| **Rust** | `73` | `rust` | Rust 1.40 | `io::stdin()` |

---

## 📁 Repository Structure

```
Code-Hive/
├── firestore.rules                     # Cloud Firestore security rules
├── firebase.json                       # Firebase Hosting & Firestore deploy config
├── Collaborative Workspace IDE_ System Architecture (1).md
├── Collaborative Workspace IDE_ Implementation Plan (1).md
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── firebaseAdmin.js       # Admin SDK credentials & mock fallback
│   │   │   └── languages.js           # 7 supported languages & starter templates
│   │   ├── controllers/
│   │   │   ├── authController.js      # Auth verification & profile endpoints
│   │   │   ├── roomController.js      # Room CRUD, role resolution, ticket issuance
│   │   │   └── runController.js       # Judge0 code execution, broadcast & history
│   │   ├── middleware/
│   │   │   ├── authMiddleware.js      # Bearer token verification & demo parser
│   │   │   └── rateLimiter.js         # Run (20/min), Room (30/min), Ticket (60/min) limiters
│   │   ├── routes/
│   │   │   ├── authRoutes.js          # /api/auth
│   │   │   ├── roomRoutes.js          # /api/rooms
│   │   │   └── runRoutes.js           # /api/run
│   │   ├── services/
│   │   │   ├── collabService.js       # Hocuspocus WebSocket server + origin guard
│   │   │   ├── judge0Service.js       # Sandboxed code execution with backoff polling
│   │   │   ├── roomService.js         # Room store, roles, and snapshot persistence
│   │   │   ├── submissionService.js   # Execution history store
│   │   │   └── ticketService.js       # 60s single-use ticket generator & consumer
│   │   └── server.js                  # Combined HTTP & WebSocket Express server
│   ├── test-run-endpoint.js           # Week 11 verification suite (12/12 passing)
│   ├── test-collab-sync.js            # Week 12 verification suite (14/14 passing)
│   ├── test-week13.js                 # Week 13 verification suite (18/18 passing)
│   └── test-week14.js                 # Week 14 verification suite (12/12 passing)
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── Auth/                  # Login, Register, AuthModal
    │   │   └── Dashboard/
    │   │       ├── CodeEditor.jsx     # Monaco Editor + y-monaco bindings
    │   │       ├── TerminalPanel.jsx  # Plain-text secure output console
    │   │       ├── StdinPanel.jsx     # Collapsible Stdin drawer
    │   │       ├── RoomModal.jsx      # Create/Join room modal with linkAccess
    │   │       └── WorkspacePreview.jsx # Master IDE layout, drawer & collab sync
    │   ├── config/languages.js        # Frontend language definitions & badges
    │   ├── context/AuthContext.jsx    # Firebase Auth & demo guest session
    │   ├── services/
    │   │   ├── collabService.js       # HocuspocusProvider & awareness setup
    │   │   └── runService.js          # Execution & submission history API client
    │   └── styles/index.css           # Glassmorphism design system & remote cursors
    └── vite.config.js                 # Monaco aliases & production build config
```

---

## 🏃 Getting Started

### 1. Prerequisites
- Node.js >= 18.0.0
- npm >= 9.0.0

### 2. Backend Setup
```bash
cd backend
npm install
npm start
```
*The server will listen on `http://localhost:5000` and `ws://localhost:5000`.*

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
*The Vite application will start on `http://localhost:5173`.*

---

## 🧪 Automated Test Suites

The backend includes 4 comprehensive automated test suites covering all architectural requirements:

```bash
cd backend

# Week 11: Editor & Judge0 Execution Engine (12 tests)
node test-run-endpoint.js

# Week 12: Rooms, Tickets & Live Sync (14 tests)
node test-collab-sync.js

# Week 13: Presence, Shared Run, Roles & History (18 tests)
node test-week13.js

# Week 14: Hardening, Rate Limiting, Size Caps & Security (12 tests)
node test-week14.js
```

**Total Automated Tests:** 56 / 56 Passing.

---

## 🔒 Security Design (Architecture Section 8)

1. **Viewer Read-Only Enforcement**:
   - WebSocket connection configured with `connectionConfig.readOnly = true`.
   - Monaco editor is locked (`readOnly: true`).
   - `POST /api/run` returns `403 Forbidden` if invoked by a viewer.
2. **Single-Use WebSocket Tickets**:
   - Tickets are cryptographically generated, expire after 60 seconds, and are deleted immediately on consumption.
3. **Cross-Site WebSocket Hijacking Mitigation**:
   - Origin header validated against `ALLOWED_ORIGINS` during HTTP upgrade.
4. **Code & Stdin Size Caps**:
   - Source code capped at 100 KB.
   - Stdin capped at 10 KB.
   - Judge0 output capped at 64 KB.
5. **XSS Protection**:
   - Compiler output rendered strictly as plain text (no HTML injection or unsafe DOM operations).
6. **Rate Limiting**:
   - Execution: 20 runs/min per user.
   - Room Creation: 30 rooms/min per user.
   - Tickets: 60 tickets/min per user.

---

## 📦 Deployment

### Frontend (Firebase Hosting / Vercel)
```bash
cd frontend
npm run build
firebase deploy --only hosting
```

### Firestore Security Rules
```bash
firebase deploy --only firestore:rules
```

### Backend (Render / Railway / Fly.io)
Deploy `backend` with the following environment variables:
- `PORT=5000`
- `RAPIDAPI_KEY=<your-judge0-key>`
- `ALLOWED_ORIGINS=https://your-frontend-domain.web.app`
- `FIREBASE_PROJECT_ID=<your-project-id>`
- `FIREBASE_CLIENT_EMAIL=<service-account-email>`
- `FIREBASE_PRIVATE_KEY="<service-account-private-key>"`
