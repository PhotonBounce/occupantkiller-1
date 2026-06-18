/* ============================================================
 *  ELECTRON-MAIN.JS — desktop wrapper for OccupantKiller
 *
 *  Packages the browser game as a standalone Windows .exe without
 *  changing how the game runs: it boots the existing static server
 *  (server.js) on a free local port, waits for /healthz, then opens
 *  a Chromium window at http://127.0.0.1:<port>. This preserves
 *  localStorage (saves, Performance Mode toggle), relative asset
 *  paths, the /api/music manifest, and the graceful-backend fallback
 *  exactly as in the browser.
 *
 *  The server child runs via ELECTRON_RUN_AS_NODE so the packaged app
 *  needs NO separate Node install — Electron's own binary runs
 *  server.js as plain Node. server.js only uses Node built-ins
 *  (http/fs/path/zlib), so no node_modules ship in the bundle.
 *
 *  Build: see package.json "build" (electron-builder → NSIS installer,
 *  output to D:\occupantkiller\dist). Run `npm run electron:dev` to
 *  test unpackaged, `npm run electron:build` to produce the installer.
 *
 *  NOTE: This file is inert until Electron is installed (it is a
 *  devDependency, intentionally not bundled with the web game). The
 *  browser version is completely unaffected by this file.
 * ============================================================ */
'use strict';

const { app, BrowserWindow, Menu, shell } = require('electron');
const { fork } = require('child_process');
const http = require('http');
const net = require('net');
const path = require('path');

const APP_DIR = __dirname;
const SERVER = path.join(APP_DIR, 'server.js');
const HOST = '127.0.0.1';

let serverProc = null;
let mainWindow = null;

/* GPU-friendly flags — set BEFORE app is ready. The game is WebGL-heavy;
 * these let it use the discrete GPU and skip background throttling. */
app.commandLine.appendSwitch('ignore-gpu-blocklist');
app.commandLine.appendSwitch('enable-gpu-rasterization');
app.commandLine.appendSwitch('enable-zero-copy');
app.commandLine.appendSwitch('disable-background-timer-throttling');
app.commandLine.appendSwitch('disable-renderer-backgrounding');

/* Find an OS-assigned free TCP port so two launches never collide. */
function freePort() {
  return new Promise((resolve, reject) => {
    const srv = net.createServer();
    srv.unref();
    srv.on('error', reject);
    srv.listen(0, HOST, () => {
      const p = srv.address().port;
      srv.close(() => resolve(p));
    });
  });
}

/* Boot server.js as a Node child (Electron-as-node) on the given port. */
function startServer(port) {
  serverProc = fork(SERVER, [], {
    cwd: APP_DIR,
    env: Object.assign({}, process.env, {
      ELECTRON_RUN_AS_NODE: '1',
      PORT: String(port),
    }),
    stdio: ['ignore', 'pipe', 'pipe', 'ipc'],
  });
  if (serverProc.stdout) serverProc.stdout.on('data', () => {});  /* drain */
  if (serverProc.stderr) serverProc.stderr.on('data', (d) => console.error('[server]', String(d).trim()));
  serverProc.on('exit', (code) => {
    serverProc = null;
    /* If the server dies unexpectedly while the window is open, quit cleanly. */
    if (code !== 0 && !app.isQuitting) app.quit();
  });
}

/* Poll /healthz until the server answers (or time out). */
function waitForHealth(port, timeoutMs) {
  const deadline = Date.now() + (timeoutMs || 12000);
  return new Promise((resolve, reject) => {
    (function ping() {
      const req = http.get({ host: HOST, port: port, path: '/healthz', timeout: 1000 }, (res) => {
        res.resume();
        if (res.statusCode === 200) return resolve();
        retry();
      });
      req.on('error', retry);
      req.on('timeout', () => { req.destroy(); retry(); });
      function retry() {
        if (Date.now() > deadline) return reject(new Error('server health timeout'));
        setTimeout(ping, 150);
      }
    })();
  });
}

function createWindow(port) {
  mainWindow = new BrowserWindow({
    width: 1600,
    height: 900,
    backgroundColor: '#0a0a0f',
    show: false,
    autoHideMenuBar: true,
    icon: path.join(APP_DIR, 'favicon.ico'),
    title: 'OccupantKiller',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      backgroundThrottling: false,
    },
  });

  Menu.setApplicationMenu(null);             /* no menu bar — it's a game */
  mainWindow.loadURL(`http://${HOST}:${port}/`);

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    mainWindow.maximize();
  });

  /* Open any external links (e.g. portfolio) in the real browser, not the app. */
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:\/\//i.test(url)) { shell.openExternal(url); return { action: 'deny' }; }
    return { action: 'allow' };
  });

  mainWindow.on('closed', () => { mainWindow = null; });
}

async function boot() {
  try {
    const port = await freePort();
    startServer(port);
    await waitForHealth(port, 12000);
    createWindow(port);
  } catch (e) {
    console.error('[electron-main] boot failed:', e);
    app.quit();
  }
}

/* Single-instance lock — second launch focuses the existing window. */
if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) { if (mainWindow.isMinimized()) mainWindow.restore(); mainWindow.focus(); }
  });

  app.whenReady().then(boot);

  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) boot(); });

  app.on('window-all-closed', () => { app.quit(); });

  app.on('before-quit', () => {
    app.isQuitting = true;
    if (serverProc) { try { serverProc.kill(); } catch (e) {} serverProc = null; }
  });
}
