window.TacticalMinimap = (function() {
  'use strict';

  // ── State ──────────────────────────────────────────────────────────────────
  var canvas = null;
  var ctx = null;
  var container = null;
  var visible = true;
  var zoom = 1.0;
  var frameCount = 0;
  var solidCache = null;   // cached grid of solid voxels
  var CACHE_RANGE = 80;    // world units sampled
  var CACHE_STEP  = 4;     // sample every N units
  var MAP_SIZE    = 160;   // canvas px
  var BASE_SCALE  = 2;     // 1 world unit → 2 px at zoom 1

  // ── Key bindings ───────────────────────────────────────────────────────────
  function onKeyDown(e) {
    var key = e.key || '';
    if (key === 'm' || key === 'M') {
      visible = !visible;
      container.style.display = visible ? 'block' : 'none';
    } else if (key === '+' || key === '=') {
      zoom = Math.min(2.0, zoom + 0.25);
    } else if (key === '-' || key === '_') {
      zoom = Math.max(0.5, zoom - 0.25);
    }
  }

  // ── Build voxel cache ─────────────────────────────────────────────────────
  // Sampled once at init relative to world-origin; re-centered on player each frame.
  function buildSolidCache(cx, cz) {
    solidCache = [];
    var half = CACHE_RANGE / 2;
    for (var wx = cx - half; wx <= cx + half; wx += CACHE_STEP) {
      for (var wz = cz - half; wz <= cz + half; wz += CACHE_STEP) {
        var solid = false;
        try {
          if (window.VoxelWorld && typeof VoxelWorld.isSolid === 'function') {
            solid = VoxelWorld.isSolid(Math.round(wx), 0, Math.round(wz));
          }
        } catch (err) { /* ignore */ }
        if (solid) {
          solidCache.push({ wx: wx, wz: wz });
        }
      }
    }
  }

  // ── DOM setup ─────────────────────────────────────────────────────────────
  function createDOM() {
    container = document.createElement('div');
    container.id = 'tactical-minimap-container';
    container.style.cssText = [
      'position:fixed',
      'top:12px',
      'right:12px',
      'z-index:9999',
      'pointer-events:none',
      'font-family:monospace',
      'user-select:none'
    ].join(';');

    // HUD label
    var label = document.createElement('div');
    label.textContent = 'TACTICAL MAP';
    label.style.cssText = [
      'color:#3A6A3A',
      'font-size:9px',
      'letter-spacing:2px',
      'text-align:center',
      'margin-bottom:3px',
      'font-weight:bold'
    ].join(';');

    canvas = document.createElement('canvas');
    canvas.width  = MAP_SIZE;
    canvas.height = MAP_SIZE;
    canvas.style.cssText = [
      'display:block',
      'border:2px solid #2A4A2A',
      'border-radius:6px',
      'opacity:0.85',
      'background:#0A1A0A'
    ].join(';');

    container.appendChild(label);
    container.appendChild(canvas);
    document.body.appendChild(container);
    ctx = canvas.getContext('2d');
  }

  // ── World → canvas coordinate helper ──────────────────────────────────────
  function worldToMap(wx, wz, playerX, playerZ) {
    var scale = BASE_SCALE * zoom;
    var half  = MAP_SIZE / 2;
    var mx = half + (wx - playerX) * scale;
    var mz = half + (wz - playerZ) * scale;
    return { x: mx, y: mz };
  }

  // ── Draw functions ────────────────────────────────────────────────────────
  function drawBackground() {
    ctx.fillStyle = '#0A1A0A';
    ctx.fillRect(0, 0, MAP_SIZE, MAP_SIZE);
  }

  function drawWalls(playerX, playerZ) {
    if (!solidCache) { return; }
    var scale = BASE_SCALE * zoom;
    var cellPx = Math.max(2, CACHE_STEP * scale);
    ctx.fillStyle = '#333333';
    for (var i = 0; i < solidCache.length; i++) {
      var c = solidCache[i];
      var p = worldToMap(c.wx, c.wz, playerX, playerZ);
      if (p.x < -cellPx || p.x > MAP_SIZE + cellPx ||
          p.y < -cellPx || p.y > MAP_SIZE + cellPx) { continue; }
      ctx.fillRect(p.x - cellPx / 2, p.y - cellPx / 2, cellPx, cellPx);
    }
  }

  function drawObjective(playerX, playerZ) {
    if (!window._objectivePos) { return; }
    var op = window._objectivePos;
    var p  = worldToMap(op.x || 0, op.z || 0, playerX, playerZ);
    var s  = 6; // half-size of diamond
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.moveTo(p.x, p.y - s);
    ctx.lineTo(p.x + s, p.y);
    ctx.lineTo(p.x, p.y + s);
    ctx.lineTo(p.x - s, p.y);
    ctx.closePath();
    ctx.fill();
  }

  function drawTripwires(playerX, playerZ) {
    if (!window._activeTripwires || !window._activeTripwires.length) { return; }
    ctx.fillStyle = '#FF8800';
    for (var i = 0; i < window._activeTripwires.length; i++) {
      var tw = window._activeTripwires[i];
      if (!tw) { continue; }
      var wx = tw.x !== undefined ? tw.x : (tw.position ? tw.position.x : null);
      var wz = tw.z !== undefined ? tw.z : (tw.position ? tw.position.z : null);
      if (wx === null || wz === null) { continue; }
      var p = worldToMap(wx, wz, playerX, playerZ);
      var s = 4;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y - s);
      ctx.lineTo(p.x + s, p.y + s);
      ctx.lineTo(p.x - s, p.y + s);
      ctx.closePath();
      ctx.fill();
    }
  }

  function drawEnemies(playerX, playerZ) {
    var enemies = [];
    try {
      if (window.Enemies && typeof Enemies.getAll === 'function') {
        enemies = Enemies.getAll() || [];
      }
    } catch (err) { /* ignore */ }

    for (var i = 0; i < enemies.length; i++) {
      var en = enemies[i];
      if (!en) { continue; }
      var ex = en.x !== undefined ? en.x : (en.position ? en.position.x : null);
      var ez = en.z !== undefined ? en.z : (en.position ? en.position.z : null);
      if (ex === null || ez === null) { continue; }

      var revealed = en._radarRevealed;
      var radius   = revealed ? 4 : 3;
      var color    = revealed ? '#FF4444' : '#CC2222';
      var p = worldToMap(ex, ez, playerX, playerZ);

      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawPlayer(yaw) {
    var cx = MAP_SIZE / 2;
    var cy = MAP_SIZE / 2;

    // White filled circle
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(cx, cy, 4, 0, Math.PI * 2);
    ctx.fill();

    // Directional triangle pointing toward camera-facing direction
    var angle = (yaw !== undefined && yaw !== null) ? yaw : 0;
    var tipLen = 8;
    var baseHalf = 4;

    var tx = cx + Math.sin(angle) * tipLen;
    var ty = cy - Math.cos(angle) * tipLen;
    var lx = cx + Math.sin(angle + Math.PI * 0.7) * baseHalf;
    var ly = cy - Math.cos(angle + Math.PI * 0.7) * baseHalf;
    var rx = cx + Math.sin(angle - Math.PI * 0.7) * baseHalf;
    var ry = cy - Math.cos(angle - Math.PI * 0.7) * baseHalf;

    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.moveTo(tx, ty);
    ctx.lineTo(lx, ly);
    ctx.lineTo(rx, ry);
    ctx.closePath();
    ctx.fill();
  }

  function drawLegend() {
    var x = 6;
    var y = MAP_SIZE - 28;
    ctx.font = '8px monospace';

    // Enemy dot
    ctx.fillStyle = '#CC2222';
    ctx.beginPath();
    ctx.arc(x + 4, y + 4, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#AAAAAA';
    ctx.fillText('enemy', x + 10, y + 8);

    // Objective diamond
    y += 14;
    var s = 4;
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.moveTo(x + 4, y);
    ctx.lineTo(x + 4 + s, y + s);
    ctx.lineTo(x + 4, y + s * 2);
    ctx.lineTo(x + 4 - s, y + s);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#AAAAAA';
    ctx.fillText('objective', x + 10, y + 9);
  }

  // ── Resolve player position / yaw from scene ───────────────────────────────
  function getPlayerState() {
    var px = 0, pz = 0, yaw = 0;

    // Try window.player (common pattern)
    if (window.player) {
      var pos = window.player.position || window.player;
      if (pos.x !== undefined) { px = pos.x; pz = pos.z; }
      if (window.player.rotation) { yaw = window.player.rotation.y || 0; }
    }

    // Try window.camera (Three.js camera)
    if (window.camera && window.camera.position) {
      if (px === 0 && pz === 0) {
        px = window.camera.position.x;
        pz = window.camera.position.z;
      }
      if (window.camera.rotation) {
        yaw = window.camera.rotation.y || 0;
      }
    }

    // Try window._playerPos
    if (window._playerPos) {
      px = window._playerPos.x || px;
      pz = window._playerPos.z || pz;
    }

    return { x: px, z: pz, yaw: yaw };
  }

  // ── Public API ─────────────────────────────────────────────────────────────
  function init() {
    createDOM();
    document.addEventListener('keydown', onKeyDown);

    // Build solid cache from origin to start; will refresh on first update
    buildSolidCache(0, 0);
  }

  var _lastCacheX = null;
  var _lastCacheZ = null;
  var CACHE_REFRESH_DIST = 20; // rebuild cache when player moves this far

  function update() {
    if (!ctx || !visible) { return; }

    // Throttle to ~10fps (assuming 60fps game loop → skip 5 of every 6 frames)
    frameCount++;
    if (frameCount % 6 !== 0) { return; }

    var state  = getPlayerState();
    var px     = state.x;
    var pz     = state.z;
    var yaw    = state.yaw;

    // Rebuild solid cache when player moves significantly
    if (_lastCacheX === null ||
        Math.abs(px - _lastCacheX) > CACHE_REFRESH_DIST ||
        Math.abs(pz - _lastCacheZ) > CACHE_REFRESH_DIST) {
      buildSolidCache(px, pz);
      _lastCacheX = px;
      _lastCacheZ = pz;
    }

    drawBackground();
    drawWalls(px, pz);
    drawObjective(px, pz);
    drawTripwires(px, pz);
    drawEnemies(px, pz);
    drawPlayer(yaw);
    drawLegend();
  }

  function reset() {
    solidCache   = null;
    _lastCacheX  = null;
    _lastCacheZ  = null;
    frameCount   = 0;
    zoom         = 1.0;
    visible      = true;
    if (container) {
      container.style.display = 'block';
    }
  }

  return { init: init, update: update, reset: reset };
})();
