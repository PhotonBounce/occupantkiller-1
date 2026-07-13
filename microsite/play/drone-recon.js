/* ───────────────────────────────────────────────────────────────────────
   DRONE RECON — B key toggles overhead scout UAV view
   Standalone IIFE module, all var, Three.js game compatible
   ─────────────────────────────────────────────────────────────────────── */
window.DroneRecon = (function () {

  // ── State ──────────────────────────────────────────────────────────────
  var _active = false;
  var _battery = 100;           // 0–100 %
  var _droneCamera = null;
  var _overlayDiv = null;
  var _droneCanvas = null;
  var _droneCtx = null;
  var _scene = null;
  var _renderer = null;
  var _initialized = false;
  var _warningVisible = false;

  // Drone camera height above player
  var DRONE_HEIGHT = 60;
  // Detection radius for enemy blips
  var ENEMY_DETECT_RADIUS = 40;
  // Overlay dimensions
  var OVERLAY_W = 240;
  var OVERLAY_H = 180;
  // Battery drain / recharge rates per second
  var DRAIN_RATE = 2;
  var RECHARGE_RATE = 1;
  var MIN_BATTERY_TO_ACTIVATE = 20;

  // ── DOM / Overlay Creation ─────────────────────────────────────────────
  function _createOverlay() {
    _overlayDiv = document.createElement('div');
    _overlayDiv.id = 'droneView';
    _overlayDiv.style.cssText = [
      'position:fixed',
      'bottom:12px',
      'right:12px',
      'width:' + OVERLAY_W + 'px',
      'height:' + OVERLAY_H + 'px',
      'border:2px solid #00ff88',
      'background:#000',
      'display:none',
      'z-index:8000',
      'overflow:hidden',
      'font-family:monospace',
      'box-shadow:0 0 12px rgba(0,255,136,0.5)',
    ].join(';');

    // Scanline overlay (CSS effect — always present, opacity toggled)
    var scanlines = document.createElement('div');
    scanlines.id = 'droneScanlines';
    scanlines.style.cssText = [
      'position:absolute',
      'top:0',
      'left:0',
      'width:100%',
      'height:100%',
      'pointer-events:none',
      'z-index:2',
      'background:repeating-linear-gradient(',
      '  0deg,',
      '  transparent,',
      '  transparent 2px,',
      '  rgba(0,0,0,0.18) 2px,',
      '  rgba(0,0,0,0.18) 4px',
      ')',
      'opacity:0.7',
    ].join(';');
    _overlayDiv.appendChild(scanlines);

    // Label bar at top
    var label = document.createElement('div');
    label.id = 'droneLabelBar';
    label.style.cssText = [
      'position:absolute',
      'top:0',
      'left:0',
      'right:0',
      'padding:2px 6px',
      'background:rgba(0,0,0,0.55)',
      'color:#00ff88',
      'font-size:10px',
      'letter-spacing:1px',
      'display:flex',
      'justify-content:space-between',
      'align-items:center',
      'z-index:3',
    ].join(';');

    var labelTitle = document.createElement('span');
    labelTitle.textContent = '[RECON DRONE]';

    var batteryBar = document.createElement('span');
    batteryBar.id = 'droneBattery';
    batteryBar.style.cssText = 'color:#00ff88;letter-spacing:1px;';
    batteryBar.textContent = '▓▓▓▓▓';

    label.appendChild(labelTitle);
    label.appendChild(batteryBar);
    _overlayDiv.appendChild(label);

    // Coordinates / warning bar at bottom
    var coordBar = document.createElement('div');
    coordBar.id = 'droneCoords';
    coordBar.style.cssText = [
      'position:absolute',
      'bottom:0',
      'left:0',
      'right:0',
      'padding:2px 6px',
      'background:rgba(0,0,0,0.55)',
      'color:#00ff88',
      'font-size:9px',
      'letter-spacing:1px',
      'z-index:3',
      'display:flex',
      'justify-content:space-between',
    ].join(';');

    var coordText = document.createElement('span');
    coordText.id = 'droneCoordText';
    coordText.textContent = 'X:0 Z:0';

    var warnText = document.createElement('span');
    warnText.id = 'droneLowBatt';
    warnText.style.cssText = 'color:#ff8800;display:none;';
    warnText.textContent = '[LOW BATTERY]';

    coordBar.appendChild(coordText);
    coordBar.appendChild(warnText);
    _overlayDiv.appendChild(coordBar);

    // The canvas that renders the top-down mini-map view
    _droneCanvas = document.createElement('canvas');
    _droneCanvas.id = 'droneCanvas';
    _droneCanvas.width = OVERLAY_W;
    _droneCanvas.height = OVERLAY_H;
    _droneCanvas.style.cssText = [
      'position:absolute',
      'top:0',
      'left:0',
      'width:100%',
      'height:100%',
      'z-index:1',
    ].join(';');
    _overlayDiv.appendChild(_droneCanvas);

    document.body.appendChild(_overlayDiv);
    _droneCtx = _droneCanvas.getContext('2d');
  }

  // ── Secondary Camera ───────────────────────────────────────────────────
  function _createDroneCamera() {
    _droneCamera = new THREE.PerspectiveCamera(60, OVERLAY_W / OVERLAY_H, 0.5, 500);
    _droneCamera.up.set(0, 1, 0);
    _droneCamera.lookAt(new THREE.Vector3(0, 0, 0));
  }

  // ── Battery HUD text ───────────────────────────────────────────────────
  function _batteryBlocks(pct) {
    var filled = Math.round(pct / 20);  // 0–5 blocks (each block = 20%)
    var empty = 5 - filled;
    var result = '';
    var i;
    for (i = 0; i < filled; i++) result += '▓';
    for (i = 0; i < empty; i++) result += '░';
    return result;
  }

  // ── Activate / Deactivate ─────────────────────────────────────────────
  function activate() {
    if (_active) return;
    if (_battery < MIN_BATTERY_TO_ACTIVATE) {
      // Flash warning via HUD if available
      if (typeof window.HUD !== 'undefined' && window.HUD.notifyPickup) {
        window.HUD.notifyPickup('[DRONE] BATTERY TOO LOW', '#ff8800');
      }
      return;
    }
    _active = true;
    window._droneReconActive = true;
    if (_overlayDiv) _overlayDiv.style.display = 'block';
  }

  function deactivate() {
    if (!_active) return;
    _active = false;
    window._droneReconActive = false;
    if (_overlayDiv) _overlayDiv.style.display = 'none';
  }

  function isActive() {
    return _active;
  }

  // ── Key Handler ────────────────────────────────────────────────────────
  function _onKeyDown(e) {
    if (e.code === 'KeyB' || e.key === 'b' || e.key === 'B') {
      if (_active) {
        deactivate();
      } else {
        activate();
      }
    }
  }

  // ── Draw enemy blips and player dot on 2D canvas ───────────────────────
  function _drawRadar(player) {
    if (!_droneCtx) return;

    var ctx = _droneCtx;
    var W = OVERLAY_W;
    var H = OVERLAY_H;

    // Gray background
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, W, H);

    // Grid lines — subtle
    ctx.strokeStyle = 'rgba(0,255,136,0.12)';
    ctx.lineWidth = 0.5;
    var step = 30;
    var gx, gy;
    for (gx = 0; gx < W; gx += step) {
      ctx.beginPath();
      ctx.moveTo(gx, 0);
      ctx.lineTo(gx, H);
      ctx.stroke();
    }
    for (gy = 0; gy < H; gy += step) {
      ctx.beginPath();
      ctx.moveTo(0, gy);
      ctx.lineTo(W, gy);
      ctx.stroke();
    }

    var playerX = player ? player.x : 0;
    var playerZ = player ? player.z : 0;

    // The radar view covers ENEMY_DETECT_RADIUS units in each direction
    var scale = (W / 2) / ENEMY_DETECT_RADIUS;

    // Draw enemy blips
    if (typeof window.Enemies !== 'undefined' && window.Enemies.getAll) {
      var enemies = window.Enemies.getAll();
      var ei;
      for (ei = 0; ei < enemies.length; ei++) {
        var enemy = enemies[ei];
        if (!enemy || !enemy.alive || !enemy.mesh) continue;
        var ex = enemy.mesh.position.x;
        var ez = enemy.mesh.position.z;
        var dx = ex - playerX;
        var dz = ez - playerZ;
        var dist = Math.sqrt(dx * dx + dz * dz);
        if (dist > ENEMY_DETECT_RADIUS) continue;

        // Map to canvas coords: center of canvas = player position
        var cx = W / 2 + dx * scale;
        var cy = H / 2 + dz * scale;

        // Clamp to canvas bounds with margin
        cx = Math.max(4, Math.min(W - 4, cx));
        cy = Math.max(4, Math.min(H - 4, cy));

        ctx.beginPath();
        ctx.arc(cx, cy, 4, 0, Math.PI * 2);
        ctx.fillStyle = '#ff3333';
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,80,80,0.5)';
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }

    // Draw player dot (center)
    ctx.beginPath();
    ctx.arc(W / 2, H / 2, 6, 0, Math.PI * 2);
    ctx.fillStyle = '#00ff88';
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,255,136,0.5)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  // ── Update (called each frame from game loop) ──────────────────────────
  function update(player, scene, camera) {
    if (!_initialized) return;

    var dt = 1 / 60;  // approximate delta; good enough for battery

    // Get player world position
    var playerPos = null;
    if (player && player.position) {
      playerPos = player.position;
    } else if (camera) {
      playerPos = camera.position;
    }

    // Battery management
    if (_active) {
      _battery -= DRAIN_RATE * dt;
      if (_battery < 0) _battery = 0;
      if (_battery < MIN_BATTERY_TO_ACTIVATE && _active) {
        // Auto-deactivate when battery drains to 0
        if (_battery <= 0) {
          _battery = 0;
          deactivate();
          if (typeof window.HUD !== 'undefined' && window.HUD.notifyPickup) {
            window.HUD.notifyPickup('[DRONE] BATTERY DEPLETED', '#ff4400');
          }
          return;
        }
      }
    } else {
      _battery += RECHARGE_RATE * dt;
      if (_battery > 100) _battery = 100;
    }

    // Update HUD elements
    var battEl = document.getElementById('droneBattery');
    if (battEl) {
      battEl.textContent = _batteryBlocks(_battery);
      battEl.style.color = _battery < 30 ? '#ff8800' : '#00ff88';
    }

    var lowBattEl = document.getElementById('droneLowBatt');
    if (lowBattEl) {
      if (_battery < 20) {
        lowBattEl.style.display = 'inline';
        // Flash effect
        lowBattEl.style.opacity = (Math.floor(Date.now() / 400) % 2 === 0) ? '1' : '0.2';
      } else {
        lowBattEl.style.display = 'none';
      }
    }

    if (!_active) return;

    // Position drone camera above player with slight noise/shake
    if (_droneCamera && playerPos) {
      var shakeX = (Math.random() - 0.5) * 0.3 * 2;
      var shakeZ = (Math.random() - 0.5) * 0.3 * 2;
      _droneCamera.position.set(
        playerPos.x + shakeX,
        playerPos.y + DRONE_HEIGHT,
        playerPos.z + shakeZ
      );
      _droneCamera.lookAt(playerPos.x, playerPos.y, playerPos.z);
    }

    // Update coords display
    var coordEl = document.getElementById('droneCoordText');
    if (coordEl && playerPos) {
      coordEl.textContent = 'X:' + Math.round(playerPos.x) + ' Z:' + Math.round(playerPos.z);
    }

    // Draw radar canvas (top-down blip view)
    _drawRadar(playerPos);
  }

  // ── Public init ────────────────────────────────────────────────────────
  function init(scene, renderer) {
    if (_initialized) return;
    _scene = scene || null;
    _renderer = renderer || null;

    _createOverlay();
    _createDroneCamera();

    document.addEventListener('keydown', _onKeyDown);

    window._droneReconActive = false;
    _initialized = true;
  }

  // ── Auto-init on DOMContentLoaded ──────────────────────────────────────
  if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', function () {
      // init called with no args; game loop will pass scene/renderer later
      // or game-manager will call DroneRecon.init(scene, renderer)
      if (!_initialized) {
        init(null, null);
      }
    });
  }

  // ── Public API ────────────────────────────────────────────────────────
  return {
    init: init,
    activate: activate,
    deactivate: deactivate,
    update: update,
    isActive: isActive
  };

})();
