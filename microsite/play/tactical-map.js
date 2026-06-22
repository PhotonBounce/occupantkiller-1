/* tactical-map.js — Full-screen overhead tactical map (Tab key)
 * Self-initialising IIFE. No game-manager.js changes required.
 * All var, no let/const.
 */
window.TacticalMap = (function () {
  'use strict';

  // ── Private state ────────────────────────────────────────────────
  var _overlay  = null;   // full-screen div
  var _canvas   = null;   // 600×600 canvas
  var _ctx      = null;
  var _visible  = false;
  var _rafId    = null;
  var _blinkOn  = true;
  var _blinkT   = 0;      // ms accumulator for 1 Hz blink
  var _lastTime = 0;

  // Map geometry
  var MAP_W     = 600;    // canvas width/height in px
  var MAP_H     = 600;
  var WORLD_R   = 80;     // world units visible from centre to edge (±80)
  var PX_PER_U  = MAP_W / (WORLD_R * 2); // 3.75 px per world unit

  // Grid letter labels along axes
  var GRID_COLS = 'ABCDEFGHIJ';
  var GRID_ROWS = 10;

  // Level building cluster definitions  (levelId → array of {x,z,w,d} in world units)
  var LEVEL_BUILDINGS = {
    'hostomel':       [{ x: -40, z: -30, w: 25, d: 15 }, { x: 10, z: 20, w: 20, d: 12 }],
    'azovstal':       [{ x: -50, z: -40, w: 30, d: 20 }, { x: 20, z:  5, w: 25, d: 18 }],
    'mariupol':       [{ x: -30, z: -35, w: 20, d: 20 }, { x: 25, z: -10, w: 18, d: 14 }],
    'dnipro-bridge':  [{ x: -60, z:  5, w: 15, d: 50 }, { x: 45, z: 5, w: 15, d: 50 }],
    'azovstal-plant': [{ x: -45, z: -20, w: 30, d: 15 }, { x: 5, z: 15, w: 25, d: 20 }],
    'kerch-bridge':   [{ x: -70, z: -5, w: 20, d: 10 }, { x: 50, z: -5, w: 20, d: 10 }],
    'chornobyl':      [{ x: -20, z: -50, w: 25, d: 25 }, { x: 10, z: 20, w: 15, d: 15 }],
    'moscow-ring':    [{ x: -40, z: -40, w: 20, d: 20 }, { x: 20, z: 20, w: 20, d: 20 }, { x: -20, z: 25, w: 15, d: 12 }],
    'sevastopol':     [{ x: -35, z: -25, w: 20, d: 18 }, { x: 15, z: 10, w: 22, d: 14 }],
    'donbas-line':    [{ x: -55, z: -10, w: 25, d: 12 }, { x: 20, z: -10, w: 25, d: 12 }],
    'belgorod':       [{ x: -30, z: -30, w: 18, d: 18 }, { x: 15, z: 10, w: 22, d: 18 }],
    'kyiv-defense':   [{ x: -45, z: -35, w: 25, d: 20 }, { x: 10, z: 20, w: 20, d: 15 }, { x: -15, z: -50, w: 18, d: 18 }],
    'snake-island':   [{ x: -15, z: -10, w: 30, d: 20 }],
    'saki-airbase':   [{ x: -50, z: -20, w: 40, d: 15 }, { x: 15, z: 10, w: 25, d: 20 }],
    'vuhledar':       [{ x: -35, z: -30, w: 22, d: 18 }, { x: 12, z: 5, w: 20, d: 15 }],
    'kerch-strike':   [{ x: -60, z: -5, w: 18, d: 10 }, { x: 42, z: -5, w: 18, d: 10 }],
    'default':        [{ x: -35, z: -25, w: 20, d: 15 }, { x: 15, z: 10, w: 20, d: 15 }],
  };

  // ── Helpers ─────────────────────────────────────────────────────

  // World coords → canvas coords (centred on player)
  function worldToCanvas(wx, wz, playerX, playerZ) {
    var dx = wx - playerX;
    var dz = wz - playerZ;
    return {
      cx: MAP_W / 2 + dx * PX_PER_U,
      cy: MAP_H / 2 + dz * PX_PER_U,
    };
  }

  // Get game state safely
  function _getPlayer() {
    if (window.GameManager && window.GameManager.getPlayer) return window.GameManager.getPlayer();
    return null;
  }
  function _getWave() {
    if (window.GameManager && window.GameManager.getCurrentWave) return window.GameManager.getCurrentWave();
    return 0;
  }
  function _getScore() {
    var p = _getPlayer();
    return (p && typeof p.score === 'number') ? p.score : 0;
  }
  function _getStageInfo() {
    if (window.GameManager && window.GameManager.getStageInfo) return window.GameManager.getStageInfo();
    return null;
  }
  function _getEnemies() {
    if (window.Enemies && window.Enemies.getAll) return window.Enemies.getAll();
    if (window._enemyList) return window._enemyList;
    return [];
  }
  function _getAllies() {
    if (window.AllySoldiers && window.AllySoldiers.getAll) return window.AllySoldiers.getAll();
    return [];
  }
  function _getCrates() {
    if (window.SupplyCrate && window.SupplyCrate._crates) return window.SupplyCrate._crates;
    return [];
  }
  function _getPlayerYaw() {
    if (window.CameraSystem && window.CameraSystem.getYaw) return window.CameraSystem.getYaw();
    var cam = window.GameManager && window.GameManager.getCamera ? window.GameManager.getCamera() : null;
    if (cam) return cam.rotation ? cam.rotation.y : 0;
    return 0;
  }

  // ── Canvas draw ─────────────────────────────────────────────────

  function _drawGrid(ctx, playerX, playerZ) {
    ctx.strokeStyle = 'rgba(0,80,0,0.3)';
    ctx.lineWidth = 1;
    // Grid every 20 world units
    var gridUnit = 20;
    // find world-aligned start
    var startX = Math.floor((playerX - WORLD_R) / gridUnit) * gridUnit;
    var startZ = Math.floor((playerZ - WORLD_R) / gridUnit) * gridUnit;
    var endX = playerX + WORLD_R;
    var endZ = playerZ + WORLD_R;

    ctx.beginPath();
    for (var wx = startX; wx <= endX; wx += gridUnit) {
      var cx = MAP_W / 2 + (wx - playerX) * PX_PER_U;
      ctx.moveTo(cx, 0);
      ctx.lineTo(cx, MAP_H);
    }
    for (var wz = startZ; wz <= endZ; wz += gridUnit) {
      var cy = MAP_H / 2 + (wz - playerZ) * PX_PER_U;
      ctx.moveTo(0, cy);
      ctx.lineTo(MAP_W, cy);
    }
    ctx.stroke();
  }

  function _drawGridLabels(ctx, playerX, playerZ) {
    ctx.fillStyle = 'rgba(0,180,0,0.6)';
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';

    var gridUnit = 20;
    var startX = Math.floor((playerX - WORLD_R) / gridUnit) * gridUnit;
    var startZ = Math.floor((playerZ - WORLD_R) / gridUnit) * gridUnit;

    var colIdx = 0;
    var rowIdx = 0;
    for (var wz = startZ; wz <= playerZ + WORLD_R; wz += gridUnit) {
      var cy = MAP_H / 2 + (wz - playerZ) * PX_PER_U;
      colIdx = 0;
      for (var wx = startX; wx <= playerX + WORLD_R; wx += gridUnit) {
        var cx = MAP_W / 2 + (wx - playerX) * PX_PER_U;
        var label = (GRID_COLS[colIdx % GRID_COLS.length] || 'Z') + (rowIdx % 10 + 1);
        if (cx > 0 && cx < MAP_W && cy > 0 && cy < MAP_H) {
          ctx.fillText(label, cx + 2, cy + 2);
        }
        colIdx++;
      }
      rowIdx++;
    }
  }

  function _drawBuildings(ctx, playerX, playerZ, levelId) {
    var id = levelId || 'default';
    var clusters = LEVEL_BUILDINGS[id] || LEVEL_BUILDINGS['default'];

    for (var i = 0; i < clusters.length; i++) {
      var b = clusters[i];
      var topLeft = worldToCanvas(b.x, b.z, playerX, playerZ);
      var wp = b.w * PX_PER_U;
      var dp = b.d * PX_PER_U;

      ctx.fillStyle = 'rgba(40,70,40,0.55)';
      ctx.strokeStyle = 'rgba(0,120,0,0.6)';
      ctx.lineWidth = 1.5;
      ctx.fillRect(topLeft.cx, topLeft.cy, wp, dp);
      ctx.strokeRect(topLeft.cx, topLeft.cy, wp, dp);

      // Label
      ctx.fillStyle = 'rgba(0,180,0,0.5)';
      ctx.font = '9px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('BLD', topLeft.cx + wp / 2, topLeft.cy + dp / 2);
    }
  }

  function _drawCrates(ctx, playerX, playerZ) {
    var crates = _getCrates();
    for (var i = 0; i < crates.length; i++) {
      var c = crates[i];
      if (!c || !c.mesh || !c.mesh.position) continue;
      var pos = worldToCanvas(c.mesh.position.x, c.mesh.position.z, playerX, playerZ);
      if (pos.cx < 0 || pos.cx > MAP_W || pos.cy < 0 || pos.cy > MAP_H) continue;

      // Yellow diamond
      ctx.save();
      ctx.translate(pos.cx, pos.cy);
      ctx.rotate(Math.PI / 4);
      ctx.fillStyle = '#ffdd00';
      ctx.fillRect(-3, -3, 6, 6);
      ctx.restore();
    }
  }

  function _drawObjective(ctx, playerX, playerZ, blinkOn) {
    // Try to find objective position from game state
    var stage = _getStageInfo();
    if (!stage) return;

    // Draw a blinking white ring at a nominal objective point
    // Use a fixed offset to hint there's an objective without exact coords
    var objX = 0, objZ = 0; // centre of world
    var pos = worldToCanvas(objX, objZ, playerX, playerZ);
    if (pos.cx < -20 || pos.cx > MAP_W + 20 || pos.cy < -20 || pos.cy > MAP_H + 20) return;

    if (blinkOn) {
      ctx.beginPath();
      ctx.arc(pos.cx, pos.cy, 8, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255,255,255,0.9)';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(pos.cx, pos.cy, 3, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.arc(pos.cx, pos.cy, 8, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255,255,255,0.3)';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }

  function _drawEnemies(ctx, playerX, playerZ) {
    var enemies = _getEnemies();
    for (var i = 0; i < enemies.length; i++) {
      var e = enemies[i];
      if (!e || !e.mesh || !e.mesh.position || (e.hp !== undefined && e.hp <= 0)) continue;
      var pos = worldToCanvas(e.mesh.position.x, e.mesh.position.z, playerX, playerZ);
      if (pos.cx < -5 || pos.cx > MAP_W + 5 || pos.cy < -5 || pos.cy > MAP_H + 5) continue;

      var isVehicle = e.type && (e.type.indexOf('VEHICLE') !== -1 || e.type.indexOf('TANK') !== -1 || e.type.indexOf('BTR') !== -1 || e.type.indexOf('BRADLEY') !== -1);
      var isBoss   = e.type && e.type.indexOf('BOSS') !== -1;

      ctx.save();
      ctx.translate(pos.cx, pos.cy);

      if (isVehicle) {
        // Orange square for vehicle
        ctx.fillStyle = '#ff8800';
        ctx.fillRect(-5, -5, 10, 10);
        ctx.strokeStyle = '#ffcc00';
        ctx.lineWidth = 1;
        ctx.strokeRect(-5, -5, 10, 10);
      } else if (isBoss) {
        // Magenta star for boss
        ctx.fillStyle = '#ff00ff';
        _drawStar(ctx, 0, 0, 7, 5);
      } else {
        // Red star for regular enemy
        ctx.fillStyle = '#ff3333';
        _drawStar(ctx, 0, 0, 6, 4);
      }
      ctx.restore();
    }
  }

  function _drawAllies(ctx, playerX, playerZ) {
    var allies = _getAllies();
    for (var i = 0; i < allies.length; i++) {
      var a = allies[i];
      if (!a || !a.mesh || !a.mesh.position || (a.hp !== undefined && a.hp <= 0)) continue;
      var pos = worldToCanvas(a.mesh.position.x, a.mesh.position.z, playerX, playerZ);
      if (pos.cx < -5 || pos.cx > MAP_W + 5 || pos.cy < -5 || pos.cy > MAP_H + 5) continue;

      // Green square 5px
      ctx.fillStyle = '#33ff66';
      ctx.fillRect(pos.cx - 3, pos.cy - 3, 6, 6);
      ctx.strokeStyle = '#00dd44';
      ctx.lineWidth = 1;
      ctx.strokeRect(pos.cx - 3, pos.cy - 3, 6, 6);
    }
  }

  function _drawStar(ctx, cx, cy, outerR, innerR) {
    var points = 5;
    ctx.beginPath();
    for (var i = 0; i < points * 2; i++) {
      var angle = (i * Math.PI) / points - Math.PI / 2;
      var r = (i % 2 === 0) ? outerR : innerR;
      var x = cx + Math.cos(angle) * r;
      var y = cy + Math.sin(angle) * r;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
  }

  function _drawRangeRings(ctx, playerX, playerZ) {
    var rings = [20, 40]; // world units
    var cx = MAP_W / 2;
    var cy = MAP_H / 2;

    for (var i = 0; i < rings.length; i++) {
      var r = rings[i] * PX_PER_U;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(0,180,60,0.2)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 6]);
      ctx.stroke();
      ctx.setLineDash([]);

      // Range label
      ctx.fillStyle = 'rgba(0,180,60,0.4)';
      ctx.font = '9px monospace';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(rings[i] + 'u', cx + r + 2, cy);
    }
  }

  function _drawPlayer(ctx, playerYaw, blinkOn) {
    var cx = MAP_W / 2;
    var cy = MAP_H / 2;

    // Blinking pulse ring
    if (blinkOn) {
      ctx.beginPath();
      ctx.arc(cx, cy, 12, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(80,140,255,0.35)';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // Crosshair ⊕
    var cr = 8;
    ctx.strokeStyle = '#4488ff';
    ctx.lineWidth = 2;
    // Outer circle
    ctx.beginPath();
    ctx.arc(cx, cy, cr, 0, Math.PI * 2);
    ctx.stroke();
    // Cross lines
    ctx.beginPath();
    ctx.moveTo(cx - cr - 3, cy); ctx.lineTo(cx + cr + 3, cy);
    ctx.moveTo(cx, cy - cr - 3); ctx.lineTo(cx, cy + cr + 3);
    ctx.stroke();

    // Facing direction line (15px)
    var facingLen = 15;
    // yaw 0 = looking toward -Z in Three.js; map Z is down on canvas
    // player faces (-sin(yaw), 0, -cos(yaw)) in world → on canvas dx=0, dy=cos(yaw)*-PX
    // So canvas direction: angle = -yaw - π/2 mapped: heading angle on canvas = yaw (screen up = world -Z)
    var lineEndX = cx + Math.sin(playerYaw) * (-facingLen);
    var lineEndY = cy + Math.cos(playerYaw) * (-facingLen);
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(lineEndX, lineEndY);
    ctx.strokeStyle = '#88aaff';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Centre dot
    ctx.beginPath();
    ctx.arc(cx, cy, 3, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
  }

  function _drawNorthIndicator(ctx) {
    var nx = MAP_W - 40;
    var ny = 20;
    ctx.save();
    ctx.translate(nx, ny);

    // Arrow up
    ctx.beginPath();
    ctx.moveTo(0, -12);
    ctx.lineTo(-5, 2);
    ctx.lineTo(0, 0);
    ctx.lineTo(5, 2);
    ctx.closePath();
    ctx.fillStyle = '#ffffff';
    ctx.fill();

    ctx.fillStyle = '#aaffaa';
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('N', 0, 4);
    ctx.restore();
  }

  function _drawHUDBar(ctx, wave, score, stageName) {
    // Top header bar
    ctx.fillStyle = 'rgba(0,20,0,0.85)';
    ctx.fillRect(0, 0, MAP_W, 38);

    ctx.fillStyle = '#00ff88';
    ctx.font = 'bold 13px monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('TACTICAL MAP', 12, 19);

    var waveStr = 'WAVE ' + (wave || '--');
    var scoreStr = 'SCORE ' + (score || 0);
    var stageStr = stageName ? stageName.toUpperCase() : '';

    ctx.fillStyle = '#aaffcc';
    ctx.font = '12px monospace';
    ctx.textAlign = 'right';
    ctx.fillText(stageStr + '  ' + waveStr + '  |  ' + scoreStr, MAP_W - 12, 19);
  }

  function _drawLegend(ctx) {
    var y = MAP_H - 22;
    ctx.fillStyle = 'rgba(0,20,0,0.85)';
    ctx.fillRect(0, MAP_H - 34, MAP_W, 34);

    ctx.font = '11px monospace';
    ctx.textBaseline = 'middle';

    var items = [
      { color: '#4488ff', label: '⊕ You' },
      { color: '#33ff66', label: '■ Ally' },
      { color: '#ff3333', label: '★ Enemy' },
      { color: '#ff8800', label: '■ Vehicle' },
      { color: '#ffdd00', label: '◆ Crate' },
      { color: '#ffffff', label: '○ Objective' },
    ];
    var x = 10;
    for (var i = 0; i < items.length; i++) {
      ctx.fillStyle = items[i].color;
      ctx.fillText(items[i].label, x, y);
      x += ctx.measureText(items[i].label).width + 14;
    }

    ctx.fillStyle = 'rgba(0,200,100,0.4)';
    ctx.textAlign = 'right';
    ctx.fillText('[TAB] or [ESC] Close', MAP_W - 10, y);
    ctx.textAlign = 'left';
  }

  // ── Main redraw ─────────────────────────────────────────────────

  function _redraw(ts) {
    if (!_visible || !_ctx) return;

    var dt = ts - _lastTime;
    _lastTime = ts;
    _blinkT += dt;
    if (_blinkT >= 500) { _blinkOn = !_blinkOn; _blinkT -= 500; }

    var player = _getPlayer();
    var playerX = player && player.position ? player.position.x : 0;
    var playerZ = player && player.position ? player.position.z : 0;
    var playerYaw = _getPlayerYaw();
    var wave  = _getWave();
    var score = _getScore();
    var stage = _getStageInfo();
    var stageName = stage ? stage.name : '';
    var levelId   = stage ? stage.id : 'default';

    var ctx = _ctx;
    ctx.clearRect(0, 0, MAP_W, MAP_H);

    // 1. Background fill
    ctx.fillStyle = '#0a1a0a';
    ctx.fillRect(0, 0, MAP_W, MAP_H);

    // 2. Grid
    _drawGrid(ctx, playerX, playerZ);
    _drawGridLabels(ctx, playerX, playerZ);

    // 3. Buildings
    _drawBuildings(ctx, playerX, playerZ, levelId);

    // 4. Objective marker
    _drawObjective(ctx, playerX, playerZ, _blinkOn);

    // 5. Supply crates
    _drawCrates(ctx, playerX, playerZ);

    // 6. Enemy blips
    _drawEnemies(ctx, playerX, playerZ);

    // 7. Ally blips
    _drawAllies(ctx, playerX, playerZ);

    // 8. Player crosshair + facing
    _drawPlayer(ctx, playerYaw, _blinkOn);

    // 9. Range rings
    _drawRangeRings(ctx, playerX, playerZ);

    // 10. North indicator
    _drawNorthIndicator(ctx);

    // 11. HUD bar (top)
    _drawHUDBar(ctx, wave, score, stageName);

    // 12. Legend bar (bottom)
    _drawLegend(ctx);
  }

  function _loop(ts) {
    if (!_visible) { _rafId = null; return; }
    _redraw(ts);
    _rafId = requestAnimationFrame(_loop);
  }

  // ── Public API ──────────────────────────────────────────────────

  function init() {
    if (_overlay) return; // already initialised

    // Reuse the existing #tactical-map stub (Feature 45 in index.html) if present,
    // otherwise create the full-screen overlay from scratch.
    var existingStub = document.getElementById('tactical-map');

    if (existingStub) {
      // Take over the stub: clear its children, restyle as full-screen overlay
      _overlay = existingStub;
      // Remove any existing child nodes (the old 400×400 canvas stub etc.)
      while (_overlay.firstChild) { _overlay.removeChild(_overlay.firstChild); }
      _overlay.style.cssText = [
        'position:fixed;top:0;left:0;width:100%;height:100%;',
        'background:rgba(0,0,0,0.82);',
        'z-index:9000;',
        'display:none;',
        'align-items:center;',
        'justify-content:center;',
        'font-family:monospace;',
        'pointer-events:auto;',
      ].join('');
    } else {
      // No existing stub — create the overlay div fresh
      _overlay = document.createElement('div');
      _overlay.id = 'tactical-map';
      _overlay.style.cssText = [
        'position:fixed;top:0;left:0;width:100%;height:100%;',
        'background:rgba(0,0,0,0.82);',
        'z-index:9000;',
        'display:none;',
        'align-items:center;',
        'justify-content:center;',
        'font-family:monospace;',
        'pointer-events:auto;',
      ].join('');
      document.body.appendChild(_overlay);
    }

    // Inner panel that contains the 600×600 canvas
    var panel = document.createElement('div');
    panel.style.cssText = [
      'position:relative;',
      'width:' + MAP_W + 'px;',
      'height:' + MAP_H + 'px;',
      'border:2px solid rgba(0,200,80,0.6);',
      'box-shadow:0 0 30px rgba(0,200,80,0.3), 0 0 60px rgba(0,100,40,0.2);',
      'overflow:hidden;',
    ].join('');

    _canvas = document.createElement('canvas');
    _canvas.width  = MAP_W;
    _canvas.height = MAP_H;
    _canvas.style.cssText = 'display:block;';
    panel.appendChild(_canvas);
    _ctx = _canvas.getContext('2d');

    _overlay.appendChild(panel);

    // Keyboard handler: Tab or Escape closes the map
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Tab') {
        e.preventDefault();
        toggle();
        return;
      }
      if (e.key === 'Escape' && _visible) {
        e.preventDefault();
        hide();
        return;
      }
    }, true); // capture phase so Tab is intercepted before browser default
  }

  function show() {
    if (!_overlay) init();
    _visible = true;
    _overlay.style.display = 'flex';
    _overlay.style.alignItems = 'center';
    _overlay.style.justifyContent = 'center';

    // Release pointer lock
    if (document.exitPointerLock) {
      try { document.exitPointerLock(); } catch (ex) { /* ignore */ }
    }

    // Pause game input
    window._tacticalMapOpen = true;

    // Start RAF loop
    _blinkOn = true;
    _blinkT  = 0;
    _lastTime = performance.now();
    if (!_rafId) {
      _rafId = requestAnimationFrame(_loop);
    }
  }

  function hide() {
    _visible = false;
    if (_overlay) _overlay.style.display = 'none';

    // Resume game input
    window._tacticalMapOpen = false;

    // Stop RAF loop
    if (_rafId) {
      cancelAnimationFrame(_rafId);
      _rafId = null;
    }
  }

  function toggle() {
    if (_visible) hide(); else show();
  }

  function update() {
    // Called externally if needed — the internal RAF loop handles redraws,
    // but external callers can trigger a single frame.
    if (_visible && _ctx) {
      _redraw(performance.now());
    }
  }

  // ── Auto-init on DOMContentLoaded ───────────────────────────────
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    // DOM already ready (script loaded late)
    try { init(); } catch (ex) { /* will retry via DOMContentLoaded if this fails */ }
  }

  return {
    init:   init,
    toggle: toggle,
    show:   show,
    hide:   hide,
    update: update,
  };
})();
