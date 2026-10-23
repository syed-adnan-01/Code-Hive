// Interactive Pseudo-Terminal (PTY) Shell Service
// Powered by node-pty and WebSockets for real-time bidirectional terminal interaction
import pty from 'node-pty';
import { WebSocketServer } from 'ws';
import fs from 'fs';
import path from 'path';
import os from 'os';

// Active sessions per room: roomId -> { pty, clients: Set<WebSocket>, buffer: string, languageId: number }
const sessions = new Map();

// Initialize dedicated Terminal WebSocket Server (noServer: true for HTTP upgrade multiplexing)
export const terminalWss = new WebSocketServer({ noServer: true });

// Helper to determine shell command per platform
const getShellCommand = () => {
  if (os.platform() === 'win32') {
    return 'cmd.exe';
  }
  return process.env.SHELL || 'bash';
};

/**
 * Handle incoming Terminal WebSocket upgrades
 */
export const handleTerminalUpgrade = (request, socket, head) => {
  terminalWss.handleUpgrade(request, socket, head, (ws) => {
    terminalWss.emit('connection', ws, request);
  });
};

/**
 * Clean up a session completely
 */
export const killSession = (roomId) => {
  const session = sessions.get(roomId);
  if (!session) return;
  try {
    if (session.pty) {
      session.pty.kill();
    }
  } catch (err) {
    console.warn(`[Terminal] Error killing PTY for room ${roomId}:`, err.message);
  }
  session.pty = null;
  sessions.delete(roomId);
};

/**
 * Ensure a live PTY shell is running for the given room
 */
export const getOrCreateSession = (roomId, cols = 80, rows = 24) => {
  let session = sessions.get(roomId);
  if (!session) {
    session = {
      pty: null,
      clients: new Set(),
      buffer: '',
      languageId: 63,
      tempDir: path.join(os.tmpdir(), `codehive_term_${roomId}`),
    };
    sessions.set(roomId, session);
  }

  // Ensure sandbox directory exists
  if (!fs.existsSync(session.tempDir)) {
    fs.mkdirSync(session.tempDir, { recursive: true });
  }

  // If shell is already active, return session
  if (session.pty) {
    return session;
  }

  const shellCmd = getShellCommand();
  const shellArgs = [];

  try {
    const ptyProcess = pty.spawn(shellCmd, shellArgs, {
      name: 'xterm-256color',
      cols: Math.max(cols || 80, 20),
      rows: Math.max(rows || 24, 10),
      cwd: session.tempDir,
      env: {
        ...process.env,
        TERM: 'xterm-256color',
        COLORTERM: 'truecolor',
        PYTHONUNBUFFERED: '1',
      },
    });

    session.pty = ptyProcess;

    // Stream output from PTY to all room clients
    ptyProcess.onData((data) => {
      session.buffer = (session.buffer + data).slice(-32768);
      const payload = JSON.stringify({ type: 'output', data });
      for (const client of session.clients) {
        if (client.readyState === 1) {
          client.send(payload);
        }
      }
    });

    // Handle process termination (e.g. user typed 'exit' or error)
    ptyProcess.onExit(({ exitCode, signal }) => {
      session.pty = null;
      const notice = `\r\n\x1b[90m[Process exited${exitCode !== undefined ? ` with code ${exitCode}` : ''}. Press Enter to restart shell]\x1b[0m\r\n`;
      session.buffer = (session.buffer + notice).slice(-32768);
      for (const client of session.clients) {
        if (client.readyState === 1) {
          client.send(JSON.stringify({ type: 'output', data: notice }));
          client.send(JSON.stringify({ type: 'exit', code: exitCode ?? 0, signal }));
        }
      }

      // Automatically revive shell if clients are still connected in the room
      if (session.clients.size > 0) {
        setTimeout(() => {
          if (session.clients.size > 0 && !session.pty) {
            getOrCreateSession(roomId, cols, rows);
          }
        }, 500);
      }
    });
  } catch (err) {
    console.error(`[Terminal] Failed to spawn PTY for room ${roomId}:`, err);
    const errMessage = `\r\n\x1b[31;1m[CodeHive PTY Error]: Failed to start shell: ${err.message}\x1b[0m\r\n`;
    for (const client of session.clients) {
      if (client.readyState === 1) {
        client.send(JSON.stringify({ type: 'output', data: errMessage }));
      }
    }
  }

  return session;
};

/**
 * Execute code inside the room's interactive PTY session
 */
export const executeCodeInPty = ({
  roomId,
  languageId,
  sourceCode,
  cols = 80,
  rows = 24,
}) => {
  const session = getOrCreateSession(roomId, cols, rows);
  if (!session || !session.pty) return null;

  const isWin = os.platform() === 'win32';
  let runCommand = '';

  // Determine file name and command per language
  if (languageId === 71) {
    // Python 3
    const filePath = path.join(session.tempDir, 'main.py');
    fs.writeFileSync(filePath, sourceCode || '# CodeHive Interactive Python\n');
    runCommand = 'python -u main.py';
  } else if (languageId === 63) {
    // JavaScript (Node.js)
    const filePath = path.join(session.tempDir, 'main.js');
    fs.writeFileSync(filePath, sourceCode || '// CodeHive Interactive Node.js\n');
    runCommand = 'node main.js';
  } else if (languageId === 54) {
    // C++
    const filePath = path.join(session.tempDir, 'main.cpp');
    fs.writeFileSync(filePath, sourceCode || '// CodeHive Interactive C++\n');
    runCommand = isWin ? 'g++ -O2 main.cpp -o main.exe && main.exe' : 'g++ -O2 main.cpp -o main.out && ./main.out';
  } else if (languageId === 50) {
    // C
    const filePath = path.join(session.tempDir, 'main.c');
    fs.writeFileSync(filePath, sourceCode || '// CodeHive Interactive C\n');
    runCommand = isWin ? 'gcc -O2 main.c -o main.exe && main.exe' : 'gcc -O2 main.c -o main.out && ./main.out';
  } else if (languageId === 62) {
    // Java
    const filePath = path.join(session.tempDir, 'Main.java');
    fs.writeFileSync(filePath, sourceCode || '// CodeHive Interactive Java\n');
    runCommand = 'javac Main.java && java Main';
  } else if (languageId === 74) {
    // TypeScript
    const filePath = path.join(session.tempDir, 'main.ts');
    fs.writeFileSync(filePath, sourceCode || '// CodeHive Interactive TypeScript\n');
    runCommand = 'npx --yes tsx main.ts';
  } else if (languageId === 60) {
    // Go
    const filePath = path.join(session.tempDir, 'main.go');
    fs.writeFileSync(filePath, sourceCode || '// CodeHive Interactive Go\n');
    runCommand = 'go run main.go';
  } else if (languageId === 73) {
    // Rust
    const filePath = path.join(session.tempDir, 'main.rs');
    fs.writeFileSync(filePath, sourceCode || '// CodeHive Interactive Rust\n');
    runCommand = isWin ? 'rustc main.rs -o main.exe && main.exe' : 'rustc main.rs -o main.out && ./main.out';
  } else {
    runCommand = 'echo [Unknown language execution command]';
  }

  // Notify clients execution is starting
  const startMsg = `\r\n\x1b[38;5;39m▶ Running: ${runCommand}\x1b[0m\r\n`;
  for (const client of session.clients) {
    if (client.readyState === 1) {
      client.send(JSON.stringify({ type: 'output', data: startMsg }));
      client.send(JSON.stringify({ type: 'status', running: true }));
    }
  }

  // Send execution command to the live interactive shell
  session.pty.write(`${runCommand}\r\n`);
  return session.pty;
};

// Setup terminal websocket connection listener
terminalWss.on('connection', (ws, request) => {
  const url = new URL(request.url, `http://${request.headers.host || 'localhost'}`);
  const roomId = url.searchParams.get('roomId') || 'default';
  const role = url.searchParams.get('role') || 'editor';
  const isReadOnly = role === 'viewer';

  // Associate client with room and ensure shell is running
  const session = getOrCreateSession(roomId);
  session.clients.add(ws);

  // Send current terminal buffer snapshot so newly connected peer sees the active screen
  if (session.buffer) {
    ws.send(JSON.stringify({ type: 'output', data: session.buffer }));
  }

  // Handle incoming messages from the frontend terminal
  ws.on('message', (raw) => {
    try {
      const msg = JSON.parse(raw);

      if (msg.type === 'start') {
        // Execute code interactively
        if (isReadOnly) {
          ws.send(JSON.stringify({ type: 'output', data: '\r\n\x1b[33m[Viewers cannot execute code.]\x1b[0m\r\n' }));
          return;
        }
        executeCodeInPty({
          roomId,
          languageId: msg.languageId,
          sourceCode: msg.sourceCode,
          cols: msg.cols,
          rows: msg.rows,
        });
      } else if (msg.type === 'input') {
        // Keystroke data from xterm
        if (isReadOnly) return;
        const currentSession = sessions.get(roomId);
        if (currentSession && currentSession.pty) {
          currentSession.pty.write(msg.data);
        } else {
          // If shell was stopped, respawn on keystroke
          const revived = getOrCreateSession(roomId);
          if (revived && revived.pty) {
            revived.pty.write(msg.data);
          }
        }
      } else if (msg.type === 'resize') {
        // Terminal window resized
        const currentSession = sessions.get(roomId);
        if (currentSession && currentSession.pty && msg.cols && msg.rows) {
          try {
            currentSession.pty.resize(Math.max(msg.cols, 10), Math.max(msg.rows, 5));
          } catch (_) {}
        }
      } else if (msg.type === 'kill') {
        // Interrupt / kill signal (Ctrl+C)
        if (isReadOnly) return;
        const currentSession = sessions.get(roomId);
        if (currentSession && currentSession.pty) {
          currentSession.pty.write('\x03');
        }
      } else if (msg.type === 'clear') {
        // Clear terminal buffer
        const currentSession = sessions.get(roomId);
        if (currentSession) {
          currentSession.buffer = '';
          const isWin = os.platform() === 'win32';
          if (currentSession.pty) {
            currentSession.pty.write(isWin ? 'cls\r\n' : 'clear\r\n');
          }
        }
      }
    } catch (err) {
      console.warn('[Terminal] Error processing message:', err.message);
    }
  });

  ws.on('close', () => {
    const currentSession = sessions.get(roomId);
    if (currentSession) {
      currentSession.clients.delete(ws);
      // If room has no active connections for over 5 minutes, clean up
      if (currentSession.clients.size === 0) {
        setTimeout(() => {
          const check = sessions.get(roomId);
          if (check && check.clients.size === 0) {
            killSession(roomId);
          }
        }, 300000);
      }
    }
  });
});
