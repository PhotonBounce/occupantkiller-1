/* tactical-map.js — Tactical minimap overlay (M key toggle)
 * 280x280 panel, bottom-right corner, dark background, green grid.
 * Intel overlay: patrol routes, dead bodies, capture points, hot zones,
 * airdrops, bombs, enemy blips with alert flash, boss pulse ring, zoom.
 * IIFE pattern, all var, no let/const.
 */
window.TacticalMap = (function () {
  'use strict';

  // ── Private state ────────────────────────────────────────────────
  var _panel    = null;   // outer div (bottom-right panel)
  var _canvas   = null;   // 280×280 canvas
  var _ctx      = null;
  var _visible  = false;
  var _rafId    = null;
  var _lastTime = 0;

  // Blink / pulse state
  var _blinkOn  = true;
  var _blinkT   = 0;     // ms accumulator — 2Hz = 250ms half-period

  // Pulse ring for boss (pulsing outward)
  var _pulseR   = 0;     // current pulse ring radius px

  // Zoom levels: px-per-world-unit
  // scale 1:2 = 0.5px/unit, 1:4 = 0.25px/unit, 1:8 = 0.125px/unit
  var ZOOM_LEVELS   = [0.5, 0.25, 0.125];
  var ZOOM_LABELS   = ['1:2', '1:4', '1:8'];
  var _zoomIdx      = 1;   // default 1:4

  // Map dimensions
  var MAP_W = 280;
  var MAP_H = 280;

  // Grid spacing (world units)
  var GRID_WU = 20;

  // Hover coord readout
  var _hoverCoord = null;  // {wx, wz} or null

  // ── Helpers ──────────────────────────────────────────────────────

  function _pxPerUnit() {
    return ZOOM_LEVELS[_zoomIdx];
  }

  // World coords → canvas UV (player at centre)
  function _toCanvas(wx, wz, px, pz) {
    var scale = _pxPerUnit();
    return {
      cx: MAP_W / 2 + (wx - px) * scale,
      cy: MAP_H / 2 + (wz - pz) * scale,
    };
  }

  // Canvas UV → world coords
  function _toWorld(cx, cy, px, pz) {
    var scale = _pxPerUnit();
    return {
      wx: px + (cx - MAP_W / 2) / scale,
      wz: pz + (cy - MAP_H / 2) / scale,
    };
  }

  // Is canvas point inside visible area (with optional margin)?
  function _inBounds(cx, cy, margin) {
    var m = margin || 0;
    return cx >= -m && cx <= MAP_W + m && cy >= -m && cy <= MAP_H + m;
  }

  // ── Game state accessors ─────────────────────────────────────────

  function _getPlayer() {
    if (window.GameManager && window.GameManager.getPlayer) return window.GameManager.getPlayer();
    return null;
  }

  function _getPlayerYaw() {
    if (window.CameraSystem && window.CameraSystem.getYaw) return window.CameraSystem.getYaw();
    var cam = window.GameManager && window.GameManager.getCamera ? window.GameManager.getCamera() : null;
    if (cam && cam.rotation) return cam.rotation.y;
    return 0;
  }

  function _getEnemies() {
    if (window.Enemies && window.Enemies.getAll) return window.Enemies.getAll();
    if (window._enemyList) return window._enemyList;
    return [];
  }

  // ── Draw helpers ─────────────────────────────────────────────────

  // Draw a filled triangle pointing up (▲)
  function _drawTriangleUp(ctx, cx, cy, size) {
    ctx.beginPath();
    ctx.moveTo(cx, cy - size);
    ctx.lineTo(cx + size * 0.8, cy + size * 0.6);
    ctx.lineTo(cx - size * 0.8, cy + size * 0.6);
    ctx.closePath();
    ctx.fill();
  }

  // Draw a triangle pointing down (▽)
  function _drawTriangleDown(ctx, cx, cy, size) {
    ctx.beginPath();
    ctx.moveTo(cx, cy + size);
    ctx.lineTo(cx + size * 0.8, cy - size * 0.6);
    ctx.lineTo(cx - size * 0.8, cy - size * 0.6);
    ctx.closePath();
    ctx.fill();
  }

  // Draw X mark
  function _drawX(ctx, cx, cy, size) {
    ctx.beginPath();
    ctx.moveTo(cx - size, cy - size);
    ctx.lineTo(cx + size, cy + size);
    ctx.moveTo(cx + size, cy - size);
    ctx.lineTo(cx - size, cy + size);
    ctx.stroke();
  }

  // Draw star-burst / asterisk for bomb markers
  function _drawAsterisk(ctx, cx, cy, size) {
    var arms = 6;
    for (var i = 0; i < arms; i++) {
      var angle = (i / arms) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(angle) * size, cy + Math.sin(angle) * size);
      ctx.stroke();
    }
  }

  // ── Section draw functions ────────────────────────────────────────

  function _drawBackground(ctx) {
    ctx.fillStyle = 'rgba(0,15,0,0.92)';
    ctx.fillRect(0, 0, MAP_W, MAP_H);
  }

  function _drawGrid(ctx, px, pz) {
    var scale = _pxPerUnit();
    var halfW  = MAP_W / (2 * scale);
    var halfH  = MAP_H / (2 * scale);
    var startX = Math.floor((px - halfW) / GRID_WU) * GRID_WU;
    var startZ = Math.floor((pz - halfH) / GRID_WU) * GRID_WU;
    var endX   = px + halfW;
    var endZ   = pz + halfH;

    ctx.strokeStyle = 'rgba(0,160,0,0.18)';
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    for (var wx = startX; wx <= endX; wx += GRID_WU) {
      var cx = MAP_W / 2 + (wx - px) * scale;
      ctx.moveTo(cx, 0);
      ctx.lineTo(cx, MAP_H);
    }
    for (var wz = startZ; wz <= endZ; wz += GRID_WU) {
      var cy = MAP_H / 2 + (wz - pz) * scale;
      ctx.moveTo(0, cy);
      ctx.lineTo(MAP_W, cy);
    }
    ctx.stroke();
  }

  function _drawPatrolRoutes(ctx, enemies, px, pz) {
    ctx.setLineDash([2, 4]);
    ctx.strokeStyle = 'rgba(255,80,80,0.45)';
    ctx.lineWidth = 1;

    for (var i = 0; i < enemies.length; i++) {
      var e = enemies[i];
      if (!e || !e._patrolPoints || e._patrolPoints.length < 2) continue;
      if (e.hp !== undefined && e.hp <= 0) continue;

      var pts = e._patrolPoints;
      ctx.beginPath();
      var started = false;
      for (var j = 0; j < pts.length; j++) {
        var pt = pts[j];
        if (!pt) continue;
        var wx = typeof pt.x === 'number' ? pt.x : (pt[0] || 0);
        var wz = typeof pt.z === 'number' ? pt.z : (pt[2] || 0);
        var c = _toCanvas(wx, wz, px, pz);
        if (!started) { ctx.moveTo(c.cx, c.cy); started = true; }
        else { ctx.lineTo(c.cx, c.cy); }
      }
      // Close patrol loop back to first point
      if (started && pts[0]) {
        var first = pts[0];
        var fx = typeof first.x === 'number' ? first.x : (first[0] || 0);
        var fz = typeof first.z === 'number' ? first.z : (first[2] || 0);
        var fc = _toCanvas(fx, fz, px, pz);
        ctx.lineTo(fc.cx, fc.cy);
      }
      ctx.stroke();
    }
    ctx.setLineDash([]);
  }

  function _drawDeadBodies(ctx, px, pz) {
    var bodies = window._deadBodyPositions;
    if (!bodies || !bodies.length) return;
    ctx.strokeStyle = 'rgba(160,160,160,0.7)';
    ctx.lineWidth = 1.5;
    for (var i = 0; i < bodies.length; i++) {
      var b = bodies[i];
      if (!b) continue;
      var wx = typeof b.x === 'number' ? b.x : 0;
      var wz = typeof b.z === 'number' ? b.z : 0;
      var c = _toCanvas(wx, wz, px, pz);
      if (!_inBounds(c.cx, c.cy)) continue;
      _drawX(ctx, c.cx, c.cy, 3);
    }
  }

  function _drawCapturePoints(ctx, px, pz, blinkOn) {
    var cps = window._capturePointPositions;
    if (!cps || !cps.length) return;
    for (var i = 0; i < cps.length; i++) {
      var cp = cps[i];
      if (!cp) continue;
      var wx = typeof cp.x === 'number' ? cp.x : 0;
      var wz = typeof cp.z === 'number' ? cp.z : 0;
      var c = _toCanvas(wx, wz, px, pz);
      if (!_inBounds(c.cx, c.cy)) continue;

      var col = '#ffffff'; // neutral
      if (cp.owner === 'player' || cp.owner === 'friendly') col = '#4488ff';
      else if (cp.owner === 'enemy') col = '#ff3333';

      ctx.beginPath();
      ctx.arc(c.cx, c.cy, 5, 0, Math.PI * 2);
      ctx.strokeStyle = col;
      ctx.lineWidth = 2;
      ctx.stroke();

      // Contested / neutral: blink fill on blinkOn
      if (cp.owner === 'contested' && blinkOn) {
        ctx.fillStyle = 'rgba(255,255,0,0.35)';
        ctx.fill();
      }
    }
  }

  function _drawHotZones(ctx, px, pz) {
    var zones = window._hotZonePositions;
    if (!zones || !zones.length) return;
    ctx.strokeStyle = 'rgba(255,140,0,0.55)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([3, 3]);
    for (var i = 0; i < zones.length; i++) {
      var z = zones[i];
      if (!z) continue;
      var wx = typeof z.x === 'number' ? z.x : 0;
      var wz = typeof z.z === 'number' ? z.z : 0;
      var radius = (typeof z.radius === 'number' ? z.radius : 10) * _pxPerUnit();
      var c = _toCanvas(wx, wz, px, pz);
      ctx.beginPath();
      ctx.arc(c.cx, c.cy, Math.max(4, radius), 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.setLineDash([]);
  }

  function _drawAirdrops(ctx, px, pz) {
    var drops = window._activeDropPositions;
    if (!drops || !drops.length) return;
    ctx.fillStyle = '#44ff88';
    for (var i = 0; i < drops.length; i++) {
      var d = drops[i];
      if (!d) continue;
      var wx = typeof d.x === 'number' ? d.x : 0;
      var wz = typeof d.z === 'number' ? d.z : 0;
      var c = _toCanvas(wx, wz, px, pz);
      if (!_inBounds(c.cx, c.cy)) continue;
      _drawTriangleDown(ctx, c.cx, c.cy, 5);
    }
  }

  function _drawBombs(ctx, px, pz, blinkOn) {
    var bombs = window._activeBombPositions;
    if (!bombs || !bombs.length) return;
    ctx.strokeStyle = blinkOn ? '#ff2222' : 'rgba(255,80,80,0.3)';
    ctx.lineWidth = 1.5;
    for (var i = 0; i < bombs.length; i++) {
      var b = bombs[i];
      if (!b) continue;
      var wx = typeof b.x === 'number' ? b.x : 0;
      var wz = typeof b.z === 'number' ? b.z : 0;
      var c = _toCanvas(wx, wz, px, pz);
      if (!_inBounds(c.cx, c.cy)) continue;
      _drawAsterisk(ctx, c.cx, c.cy, 5);
    }
  }

  function _drawEnemies(ctx, enemies, px, pz, blinkOn, pulseR) {
    for (var i = 0; i < enemies.length; i++) {
      var e = enemies[i];
      if (!e) continue;
      if (e.hp !== undefined && e.hp <= 0) continue;

      var epos = null;
      if (e.mesh && e.mesh.position) {
        epos = _toCanvas(e.mesh.position.x, e.mesh.position.z, px, pz);
      } else if (e.position) {
        epos = _toCanvas(e.position.x, e.position.z, px, pz);
      }
      if (!epos) continue;
      if (!_inBounds(epos.cx, epos.cy, 5)) continue;

      var isBoss    = !!(e.type && (e.type.indexOf('BOSS') !== -1 || e.type.indexOf('COMMANDER') !== -1));
      var isAlerted = !!(e.alerted || e.state === 'alert' || e.state === 'combat' || e.state === 'chase');

      // Alerted enemies blink at 2Hz — skip on dark phase
      if (isAlerted && !blinkOn) continue;

      // Dot size scales with HP ratio (3–7px)
      var hpRatio = 0.5;
      if (typeof e.hp === 'number' && typeof e.maxHp === 'number' && e.maxHp > 0) {
        hpRatio = e.hp / e.maxHp;
      }
      var dotR = isBoss ? 7 : Math.max(3, Math.round(3 + hpRatio * 4));

      ctx.save();
      ctx.translate(epos.cx, epos.cy);

      if (isBoss) {
        // Pulsing outer ring for boss
        var ringR = dotR + pulseR;
        ctx.beginPath();
        ctx.arc(0, 0, ringR, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255,0,255,0.5)';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(0, 0, dotR, 0, Math.PI * 2);
        ctx.fillStyle = '#ff00ff';
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.arc(0, 0, dotR, 0, Math.PI * 2);
        ctx.fillStyle = '#ff3333';
        ctx.fill();
      }

      ctx.restore();
    }
  }

  function _drawPlayer(ctx, yaw) {
    var cx = MAP_W / 2;
    var cy = MAP_H / 2;

    ctx.save();
    ctx.translate(cx, cy);
    // Rotate triangle by yaw (camera direction)
    ctx.rotate(yaw);

    // Blue filled triangle ▲ pointing up (toward negative-Z = north)
    ctx.fillStyle = '#4488ff';
    ctx.strokeStyle = '#aaccff';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, -7);        // tip
    ctx.lineTo(5, 5);
    ctx.lineTo(-5, 5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.restore();
  }

  function _drawCompassRose(ctx) {
    var m = 10; // px margin from each edge
    ctx.fillStyle = 'rgba(0,220,100,0.75)';
    ctx.font = 'bold 8px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('N', MAP_W / 2, m);
    ctx.fillText('S', MAP_W / 2, MAP_H - m);
    ctx.fillText('W', m, MAP_H / 2);
    ctx.fillText('E', MAP_W - m, MAP_H / 2);
  }

  function _drawZoomLabel(ctx) {
    ctx.fillStyle = 'rgba(0,220,100,0.65)';
    ctx.font = '8px monospace';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'top';
    ctx.fillText(ZOOM_LABELS[_zoomIdx], MAP_W - 4, 4);
  }

  function _drawHoverCoord(ctx) {
    if (!_hoverCoord) return;
    ctx.fillStyle = 'rgba(0,240,120,0.85)';
    ctx.font = '8px monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'bottom';
    var txt = 'X:' + Math.round(_hoverCoord.wx) + ' Z:' + Math.round(_hoverCoord.wz);
    ctx.fillText(txt, 4, MAP_H - 4);
  }

  // ── Main redraw ───────────────────────────────────────────────────

  function _redraw(ts) {
    if (!_visible || !_ctx) return;

    var dt = ts - _lastTime;
    _lastTime = ts;

    // Blink at 2Hz: flip every 250ms
    _blinkT += dt;
    if (_blinkT >= 250) { _blinkOn = !_blinkOn; _blinkT -= 250; }

    // Boss pulse ring oscillates 0–8px over 1s
    _pulseR = Math.abs(((ts % 1000) / 1000) * 2 - 1) * 8;

    var player   = _getPlayer();
    var px       = player && player.position ? player.position.x : 0;
    var pz       = player && player.position ? player.position.z : 0;
    var yaw      = _getPlayerYaw();
    var enemies  = _getEnemies();
    var ctx      = _ctx;

    ctx.clearRect(0, 0, MAP_W, MAP_H);

    _drawBackground(ctx);
    _drawGrid(ctx, px, pz);
    _drawPatrolRoutes(ctx, enemies, px, pz);
    _drawDeadBodies(ctx, px, pz);
    _drawHotZones(ctx, px, pz);
    _drawCapturePoints(ctx, px, pz, _blinkOn);
    _drawAirdrops(ctx, px, pz);
    _drawBombs(ctx, px, pz, _blinkOn);
    _drawEnemies(ctx, enemies, px, pz, _blinkOn, _pulseR);
    _drawPlayer(ctx, yaw);
    _drawCompassRose(ctx);
    _drawZoomLabel(ctx);
    _drawHoverCoord(ctx);
  }

  function _loop(ts) {
    if (!_visible) { _rafId = null; return; }
    _redraw(ts);
    _rafId = requestAnimationFrame(_loop);
  }

  // ── Public API ────────────────────────────────────────────────────

  function init() {
    if (_panel) return; // already initialised

    _panel = document.createElement('div');
    _panel.id = 'tactical-map-panel';
    _panel.style.cssText = [
      'position:fixed;',
      'bottom:12px;',
      'right:12px;',
      'width:' + MAP_W + 'px;',
      'height:' + MAP_H + 'px;',
      'background:rgba(0,15,0,0.92);',
      'border:1px solid rgba(0,200,80,0.4);',
      'border-radius:4px;',
      'box-shadow:0 0 12px rgba(0,180,60,0.2);',
      'z-index:4500;',
      'display:none;',
      'overflow:hidden;',
      'pointer-events:auto;',
    ].join('');

    _canvas = document.createElement('canvas');
    _canvas.width  = MAP_W;
    _canvas.height = MAP_H;
    _canvas.style.cssText = 'display:block;';
    _panel.appendChild(_canvas);
    _ctx = _canvas.getContext('2d');

    document.body.appendChild(_panel);

    // Mouse hover → world coordinate readout
    _canvas.addEventListener('mousemove', function (e) {
      var rect = _canvas.getBoundingClientRect();
      var mx = e.clientX - rect.left;
      var my = e.clientY - rect.top;
      var pl = _getPlayer();
      var ppx = pl && pl.position ? pl.position.x : 0;
      var ppz = pl && pl.position ? pl.position.z : 0;
      _hoverCoord = _toWorld(mx, my, ppx, ppz);
    });
    _canvas.addEventListener('mouseleave', function () {
      _hoverCoord = null;
    });

    // Key listeners: M toggles map; +/- zooms while open
    document.addEventListener('keydown', function (e) {
      // M key (no modifiers): toggle tactical map
      if (e.code === 'KeyM' && !e.shiftKey && !e.ctrlKey && !e.altKey) {
        toggle();
        return;
      }

      if (!_visible) return;

      // + / = / NumpadAdd: zoom in (higher detail)
      if (e.code === 'Equal' || e.code === 'NumpadAdd') {
        _zoomIdx = Math.max(0, _zoomIdx - 1);
        e.preventDefault();
        return;
      }
      // - / NumpadSubtract: zoom out
      if (e.code === 'Minus' || e.code === 'NumpadSubtract') {
        _zoomIdx = Math.min(ZOOM_LEVELS.length - 1, _zoomIdx + 1);
        e.preventDefault();
        return;
      }
    }, false);
  }

  function toggle() {
    if (_visible) {
      _visible = false;
      if (_panel) _panel.style.display = 'none';
      if (_rafId) { cancelAnimationFrame(_rafId); _rafId = null; }
    } else {
      if (!_panel) init();
      _visible  = true;
      _blinkOn  = true;
      _blinkT   = 0;
      _pulseR   = 0;
      _lastTime = performance.now();
      _panel.style.display = 'block';
      if (!_rafId) {
        _rafId = requestAnimationFrame(_loop);
      }
    }
  }

  function update(dt, enemies, playerPos, camera) {
    // External hook — internal RAF loop redraws each frame,
    // but callers may trigger a single forced redraw here.
    if (_visible && _ctx) {
      _redraw(performance.now());
    }
  }

  function reset() {
    _visible = false;
    if (_panel) _panel.style.display = 'none';
    if (_rafId) { cancelAnimationFrame(_rafId); _rafId = null; }
  }

  // Auto-init once DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    try { init(); } catch (ex) { /* ignore — may retry via DOMContentLoaded */ }
  }

  return {
    init:   init,
    update: update,
    toggle: toggle,
    reset:  reset,
  };

})();
