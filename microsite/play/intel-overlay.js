/* intel-overlay.js — Secondary Intel Overlay Panel
 * Displays last-known enemy positions, patrol routes, intel doc locations,
 * sniper nest markers, and capture point status on a compact 200×200px panel.
 *
 * Toggle: Shift+M  (M key alone opens the main TacticalMap; I key is inventory)
 *
 * Data sources:
 *   window.EnemySnipers.getActiveSnipers()  — sniper positions
 *   window._hotZonePositions                — hot zone coords
 *   window.IntelPickups._pickups            — intel document pickups
 *   window.CapturePoints.getCaptured / getTotal — capture point counts
 *   window.Enemies.getAll()                 — last-known enemy ghost trails
 *   window._activeBombPositions             — bomb objective positions (if present)
 *
 * All var, IIFE pattern, no let/const.
 */
window.IntelOverlay = (function () {
  'use strict';

  var PANEL_W      = 200;
  var PANEL_H      = 200;
  var WORLD_RANGE  = 80;
  var PX_PER_U     = PANEL_W / (WORLD_RANGE * 2);

  var GHOST_MAX_AGE   = 4000;
  var GHOST_INTERVAL  = 800;

  var CAPTURE_POSITIONS = [
    { x: -15, z: -15, name: 'ALPHA'   },
    { x:  15, z:   0, name: 'BRAVO'   },
    { x:   0, z:  15, name: 'CHARLIE' }
  ];

  var _panel        = null;
  var _canvas       = null;
  var _ctx          = null;
  var _visible      = false;
  var _rafId        = null;
  var _lastTime     = 0;
  var _ghosts       = [];
  var _ghostTimer   = 0;

  function _worldToCanvas(wx, wz, playerX, playerZ) {
    return {
      cx: PANEL_W / 2 + (wx - playerX) * PX_PER_U,
      cy: PANEL_H / 2 + (wz - playerZ) * PX_PER_U
    };
  }

  function _inBounds(cx, cy, margin) {
    var m = margin || 8;
    return cx >= -m && cx <= PANEL_W + m && cy >= -m && cy <= PANEL_H + m;
  }

  function _getPlayer() {
    if (window.GameManager && window.GameManager.getPlayer) return window.GameManager.getPlayer();
    return null;
  }

  function _getPlayerPos() {
    var p = _getPlayer();
    if (p && p.position) return { x: p.position.x, z: p.position.z };
    if (p && p.mesh && p.mesh.position) return { x: p.mesh.position.x, z: p.mesh.position.z };
    return { x: 0, z: 0 };
  }

  function _getEnemies() {
    if (window.Enemies && window.Enemies.getAll) return window.Enemies.getAll();
    if (window._enemyList) return window._enemyList;
    return [];
  }

  function _getSnipers() {
    if (window.EnemySnipers && window.EnemySnipers.getActiveSnipers) {
      return window.EnemySnipers.getActiveSnipers();
    }
    return [];
  }

  function _getHotZones() {
    if (window._hotZonePositions && Array.isArray(window._hotZonePositions)) {
      return window._hotZonePositions;
    }
    return [];
  }

  function _getIntelPickups() {
    if (window.IntelPickups && Array.isArray(window.IntelPickups._pickups)) {
      return window.IntelPickups._pickups;
    }
    return [];
  }

  function _getBombPositions() {
    if (window._activeBombPositions && Array.isArray(window._activeBombPositions)) {
      return window._activeBombPositions;
    }
    return [];
  }

  function _getCaptureInfo() {
    var captured = 0;
    var total    = 0;
    if (window.CapturePoints) {
      if (typeof window.CapturePoints.getCaptured === 'function') captured = window.CapturePoints.getCaptured();
      if (typeof window.CapturePoints.getTotal    === 'function') total    = window.CapturePoints.getTotal();
    }
    return { captured: captured, total: total };
  }

  function _snapshotEnemies() {
    var enemies = _getEnemies();
    for (var i = 0; i < enemies.length; i++) {
      var e = enemies[i];
      if (!e) continue;
      var pos = null;
      if (e.mesh && e.mesh.position) { pos = e.mesh.position; }
      else if (e.position)            { pos = e.position; }
      if (!pos) continue;
      if (e.hp !== undefined && e.hp <= 0) continue;
      _ghosts.push({ x: pos.x, z: pos.z, age: 0 });
    }
  }

  function _ageGhosts(dt) {
    var alive = [];
    for (var i = 0; i < _ghosts.length; i++) {
      _ghosts[i].age += dt;
      if (_ghosts[i].age < GHOST_MAX_AGE) alive.push(_ghosts[i]);
    }
    _ghosts = alive;
  }

  function _drawCrosshair(ctx, cx, cy, size, color) {
    ctx.strokeStyle = color;
    ctx.lineWidth   = 1.5;
    ctx.beginPath();
    ctx.moveTo(cx - size, cy); ctx.lineTo(cx + size, cy);
    ctx.moveTo(cx, cy - size); ctx.lineTo(cx, cy + size);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx, cy, size * 0.6, 0, Math.PI * 2);
    ctx.stroke();
  }

  function _drawStar(ctx, cx, cy, outerR, innerR, color) {
    var pts = 5;
    ctx.fillStyle = color;
    ctx.beginPath();
    for (var i = 0; i < pts * 2; i++) {
      var angle = (i * Math.PI) / pts - Math.PI / 2;
      var r     = (i % 2 === 0) ? outerR : innerR;
      var x     = cx + Math.cos(angle) * r;
      var y     = cy + Math.sin(angle) * r;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
  }

  function _draw() {
    var ctx     = _ctx;
    var pPos    = _getPlayerPos();
    var playerX = pPos.x;
    var playerZ = pPos.z;

    ctx.clearRect(0, 0, PANEL_W, PANEL_H);
    ctx.fillStyle = 'rgba(0,10,0,0.88)';
    ctx.fillRect(0, 0, PANEL_W, PANEL_H);
    ctx.strokeStyle = '#00ff44';
    ctx.lineWidth   = 1.5;
    ctx.strokeRect(1, 1, PANEL_W - 2, PANEL_H - 2);

    ctx.fillStyle = 'rgba(0,60,0,0.7)';
    ctx.fillRect(2, 2, PANEL_W - 4, 16);
    ctx.fillStyle    = '#00ff44';
    ctx.font         = 'bold 9px monospace';
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('INTEL OVERLAY', PANEL_W / 2, 10);

    ctx.strokeStyle = 'rgba(0,255,68,0.4)';
    ctx.lineWidth   = 1;
    ctx.beginPath();
    ctx.moveTo(2, 19); ctx.lineTo(PANEL_W - 2, 19);
    ctx.stroke();

    var pcx = PANEL_W / 2;
    var pcy = PANEL_H / 2;
    ctx.strokeStyle = 'rgba(0,255,68,0.5)';
    ctx.lineWidth   = 1;
    ctx.beginPath();
    ctx.moveTo(pcx - 4, pcy); ctx.lineTo(pcx + 4, pcy);
    ctx.moveTo(pcx, pcy - 4); ctx.lineTo(pcx, pcy + 4);
    ctx.stroke();

    var gi, g, falpha, gpos;
    for (gi = 0; gi < _ghosts.length; gi++) {
      g      = _ghosts[gi];
      falpha = 1 - (g.age / GHOST_MAX_AGE);
      gpos   = _worldToCanvas(g.x, g.z, playerX, playerZ);
      if (!_inBounds(gpos.cx, gpos.cy, 4)) continue;
      ctx.beginPath();
      ctx.arc(gpos.cx, gpos.cy, 2.5, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,80,80,' + (falpha * 0.6).toFixed(2) + ')';
      ctx.fill();
    }

    var hotZones = _getHotZones();
    var hi, hz, hpos;
    for (hi = 0; hi < hotZones.length; hi++) {
      hz   = hotZones[hi];
      hpos = _worldToCanvas(hz.x, hz.z !== undefined ? hz.z : (hz.y || 0), playerX, playerZ);
      if (!_inBounds(hpos.cx, hpos.cy, 12)) continue;
      ctx.beginPath();
      ctx.arc(hpos.cx, hpos.cy, 10, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255,120,0,0.6)';
      ctx.lineWidth   = 1;
      ctx.setLineDash([2, 3]);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle    = 'rgba(255,120,0,0.8)';
      ctx.font         = '7px monospace';
      ctx.textAlign    = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('HZ', hpos.cx, hpos.cy);
    }

    var drops = [];
    if (window.ScavengeSystem && Array.isArray(window.ScavengeSystem._drops)) {
      drops = window.ScavengeSystem._drops;
    }
    if (drops.length >= 2) {
      ctx.strokeStyle = 'rgba(180,255,120,0.45)';
      ctx.lineWidth   = 1;
      ctx.setLineDash([3, 4]);
      ctx.beginPath();
      var firstDrop = true;
      var di, drop, dpos;
      for (di = 0; di < drops.length; di++) {
        drop = drops[di];
        if (!drop || !drop.mesh || !drop.mesh.position) continue;
        dpos = _worldToCanvas(drop.mesh.position.x, drop.mesh.position.z, playerX, playerZ);
        if (!_inBounds(dpos.cx, dpos.cy, 6)) { firstDrop = true; continue; }
        if (firstDrop) { ctx.moveTo(dpos.cx, dpos.cy); firstDrop = false; }
        else           { ctx.lineTo(dpos.cx, dpos.cy); }
      }
      ctx.stroke();
      ctx.setLineDash([]);
    }

    var pickups = _getIntelPickups();
    var ii, pk, pkPos, ipos;
    for (ii = 0; ii < pickups.length; ii++) {
      pk = pickups[ii];
      if (!pk) continue;
      pkPos = null;
      if (pk.mesh && pk.mesh.position) pkPos = pk.mesh.position;
      else if (pk.position)            pkPos = pk.position;
      if (!pkPos) continue;
      ipos = _worldToCanvas(pkPos.x, pkPos.z, playerX, playerZ);
      if (!_inBounds(ipos.cx, ipos.cy, 6)) continue;
      _drawStar(ctx, ipos.cx, ipos.cy, 5, 3, '#cc44ff');
      ctx.strokeStyle = 'rgba(200,100,255,0.6)';
      ctx.lineWidth   = 0.8;
      ctx.beginPath();
      ctx.arc(ipos.cx, ipos.cy, 6, 0, Math.PI * 2);
      ctx.stroke();
    }

    var snipers = _getSnipers();
    var si, sn, snPos, spos;
    for (si = 0; si < snipers.length; si++) {
      sn    = snipers[si];
      if (!sn) continue;
      snPos = null;
      if (sn.mesh && sn.mesh.position) snPos = sn.mesh.position;
      else if (sn.position)            snPos = sn.position;
      if (!snPos) continue;
      spos = _worldToCanvas(snPos.x, snPos.z, playerX, playerZ);
      if (!_inBounds(spos.cx, spos.cy, 6)) continue;
      _drawCrosshair(ctx, spos.cx, spos.cy, 5, '#ff2222');
      ctx.fillStyle    = 'rgba(255,60,60,0.85)';
      ctx.font         = '6px monospace';
      ctx.textAlign    = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillText('SNP', spos.cx, spos.cy - 6);
    }

    var bombs = _getBombPositions();
    var bi, bm, bpos;
    for (bi = 0; bi < bombs.length; bi++) {
      bm = bombs[bi];
      if (!bm) continue;
      bpos = _worldToCanvas(bm.x || 0, bm.z || 0, playerX, playerZ);
      if (!_inBounds(bpos.cx, bpos.cy, 6)) continue;
      ctx.save();
      ctx.translate(bpos.cx, bpos.cy);
      ctx.rotate(Math.PI / 4);
      ctx.fillStyle   = '#ffee00';
      ctx.strokeStyle = '#ff8800';
      ctx.lineWidth   = 1.2;
      ctx.fillRect(-4, -4, 8, 8);
      ctx.strokeRect(-4, -4, 8, 8);
      ctx.restore();
    }

    var capInfo = _getCaptureInfo();
    var ci, cp, cpos, isCaptured;
    for (ci = 0; ci < CAPTURE_POSITIONS.length; ci++) {
      cp   = CAPTURE_POSITIONS[ci];
      cpos = _worldToCanvas(cp.x, cp.z, playerX, playerZ);
      if (!_inBounds(cpos.cx, cpos.cy, 8)) continue;
      isCaptured = (ci < capInfo.captured);
      ctx.beginPath();
      ctx.arc(cpos.cx, cpos.cy, 5, 0, Math.PI * 2);
      ctx.fillStyle   = isCaptured ? 'rgba(0,255,80,0.7)' : 'rgba(255,60,60,0.55)';
      ctx.strokeStyle = isCaptured ? '#00ff44' : '#ff4444';
      ctx.lineWidth   = 1.2;
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle    = isCaptured ? '#00ff44' : '#ff8888';
      ctx.font         = '6px monospace';
      ctx.textAlign    = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillText(cp.name, cpos.cx, cpos.cy - 6);
    }

    ctx.fillStyle = 'rgba(0,40,0,0.7)';
    ctx.fillRect(2, PANEL_H - 16, PANEL_W - 4, 14);
    ctx.fillStyle    = '#00cc44';
    ctx.font         = '7px monospace';
    ctx.textAlign    = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('SNP:' + snipers.length, 5, PANEL_H - 9);
    ctx.textAlign = 'center';
    ctx.fillText('HZ:' + hotZones.length, PANEL_W / 2, PANEL_H - 9);
    ctx.textAlign = 'right';
    ctx.fillText('CP:' + capInfo.captured + '/' + capInfo.total, PANEL_W - 5, PANEL_H - 9);
  }

  function _tick(timestamp) {
    if (!_visible) return;
    var dt = 0;
    if (_lastTime) dt = timestamp - _lastTime;
    _lastTime = timestamp;
    _ageGhosts(dt);
    _ghostTimer += dt;
    if (_ghostTimer >= GHOST_INTERVAL) {
      _ghostTimer = 0;
      _snapshotEnemies();
    }
    _draw();
    _rafId = requestAnimationFrame(_tick);
  }

  function _buildPanel() {
    if (_panel) return;
    _panel = document.createElement('div');
    _panel.id = 'intelOverlayPanel';
    _panel.style.cssText = [
      'position:fixed',
      'top:12px',
      'left:12px',
      'width:' + PANEL_W + 'px',
      'height:' + PANEL_H + 'px',
      'z-index:7000',
      'pointer-events:none',
      'display:none',
      'box-shadow:0 0 12px rgba(0,255,68,0.35)',
      'border-radius:2px'
    ].join(';');
    _canvas = document.createElement('canvas');
    _canvas.width  = PANEL_W;
    _canvas.height = PANEL_H;
    _canvas.style.cssText = 'display:block;width:100%;height:100%;';
    _ctx = _canvas.getContext('2d');
    _panel.appendChild(_canvas);
    document.body.appendChild(_panel);
  }

  function init() {
    if (typeof document === 'undefined') return;
    _buildPanel();
    _bindKeys();
  }

  function open() {
    if (!_panel) _buildPanel();
    _visible    = true;
    _panel.style.display = 'block';
    _lastTime   = 0;
    _ghosts     = [];
    _ghostTimer = 0;
    _rafId      = requestAnimationFrame(_tick);
  }

  function close() {
    _visible = false;
    if (_panel) _panel.style.display = 'none';
    if (_rafId) { cancelAnimationFrame(_rafId); _rafId = null; }
  }

  function toggle() {
    if (_visible) close(); else open();
  }

  function isVisible() {
    return _visible;
  }

  function _bindKeys() {
    document.addEventListener('keydown', function (e) {
      if (e.shiftKey && (e.code === 'KeyM' || e.key === 'M')) {
        var tag = document.activeElement && document.activeElement.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA') return;
        e.preventDefault();
        toggle();
      }
    });
  }

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
    } else {
      init();
    }
  }

  return { init: init, open: open, close: close, toggle: toggle, isVisible: isVisible };

})();
