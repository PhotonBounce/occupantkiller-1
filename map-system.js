// map-system.js — Tactical Map System with Waypoints, Military Grid, Enemy Intel & Mission Planning
// IIFE module exposing window.MapSystem = { init, update, reset }
window.MapSystem = (function () {
  'use strict';

  // ── constants ──────────────────────────────────────────────────────────────────
  var CANVAS_SIZE        = 800;
  var GRID_CELLS         = 16;          // 16×16 grid
  var CELL_SIZE          = CANVAS_SIZE / GRID_CELLS;  // 50px
  var BG_COLOR           = '#1A2E1A';
  var GRID_COLOR         = '#2A4A2A';
  var GRID_LABEL_COLOR   = '#4A8A4A';
  var MAX_WAYPOINTS      = 5;
  var INTEL_FADE_SEC     = 60;          // enemy intel degrades over 60s
  var WORLD_RANGE        = 80;          // world units shown across full map at zoom 1
  var COL_LABELS         = ['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P'];
  var ZOOM_MIN           = 1;
  var ZOOM_MAX           = 4;

  // ── module state ──────────────────────────────────────────────────────────────
  var _initialized       = false;
  var _open              = false;
  var _overlay           = null;   // fullscreen div
  var _canvas            = null;   // 800×800 canvas
  var _ctx               = null;   // 2d context
  var _hud               = null;   // hud text div
  var _toast             = null;   // grid ref toast div

  var _zoom              = 1;
  var _panX              = 0;      // pan offset in world units
  var _panZ              = 0;
  var _intelOn           = true;

  var _waypoints         = [];     // [{wx, wz}] world coords
  var _enemyIntel        = [];     // [{pos:{x,z}, timestamp}] snapshotted when map opens

  // pan state
  var _panning           = false;
  var _panStartMx        = 0;
  var _panStartMz        = 0;
  var _panStartPX        = 0;
  var _panStartPZ        = 0;

  // distance tool state
  var _distDragging      = false;
  var _distStart         = null;   // {mx,my} mouse
  var _distEnd           = null;

  var _toastTimer        = null;

  // ── helpers: world ↔ canvas ───────────────────────────────────────────────────
  function _worldToCanvas(wx, wz) {
    // Centre of canvas = player position + pan offset
    var cx = CANVAS_SIZE / 2 + (_panX + wx) * (CANVAS_SIZE / WORLD_RANGE) * _zoom;
    var cy = CANVAS_SIZE / 2 + (_panZ + wz) * (CANVAS_SIZE / WORLD_RANGE) * _zoom;
    return { x: cx, y: cy };
  }

  function _canvasToWorld(cx, cy) {
    var scale = (CANVAS_SIZE / WORLD_RANGE) * _zoom;
    var wx = (cx - CANVAS_SIZE / 2) / scale - _panX;
    var wz = (cy - CANVAS_SIZE / 2) / scale - _panZ;
    return { x: wx, z: wz };
  }

  // canvas-relative mouse pos
  function _canvasMouse(e) {
    var rect = _canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  }

  // world coord → grid ref string e.g. "F-7"
  function _worldToGridRef(wx, wz) {
    // map world coords [-WORLD_RANGE/2 .. +WORLD_RANGE/2] onto grid cols/rows 0..15
    var col = Math.floor((wx + WORLD_RANGE / 2) / WORLD_RANGE * GRID_CELLS);
    var row = Math.floor((wz + WORLD_RANGE / 2) / WORLD_RANGE * GRID_CELLS);
    col = Math.max(0, Math.min(GRID_CELLS - 1, col));
    row = Math.max(0, Math.min(GRID_CELLS - 1, row));
    return COL_LABELS[col] + '-' + (row + 1);
  }

  // ── drawing helpers ───────────────────────────────────────────────────────────
  function _drawDiamond(ctx, x, y, size, color) {
    ctx.save();
    ctx.fillStyle = color;
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x, y - size);
    ctx.lineTo(x + size, y);
    ctx.lineTo(x, y + size);
    ctx.lineTo(x - size, y);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  function _drawTriangle(ctx, x, y, size, color) {
    ctx.save();
    ctx.fillStyle = color;
    ctx.strokeStyle = '#FF8888';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, y - size);
    ctx.lineTo(x + size, y + size);
    ctx.lineTo(x - size, y + size);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  function _drawSquare(ctx, x, y, size, color) {
    ctx.save();
    ctx.fillStyle = color;
    ctx.strokeStyle = '#88FF88';
    ctx.lineWidth = 1;
    ctx.fillRect(x - size, y - size, size * 2, size * 2);
    ctx.strokeRect(x - size, y - size, size * 2, size * 2);
    ctx.restore();
  }

  function _drawLabel(ctx, text, x, y, color) {
    ctx.save();
    ctx.fillStyle = color || '#FFFFFF';
    ctx.font = 'bold 10px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(x - ctx.measureText(text).width / 2 - 2, y + 1, ctx.measureText(text).width + 4, 12);
    ctx.fillStyle = color || '#FFFFFF';
    ctx.fillText(text, x, y + 2);
    ctx.restore();
  }

  // ── render ────────────────────────────────────────────────────────────────────
  function _render() {
    if (!_ctx) { return; }
    var ctx = _ctx;
    var now = Date.now() / 1000;

    // background
    ctx.fillStyle = BG_COLOR;
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    // ── grid lines ──────────────────────────────────────────────────────────────
    ctx.save();
    ctx.strokeStyle = GRID_COLOR;
    ctx.lineWidth = 1;
    var i, j, gx, gy;
    for (i = 0; i <= GRID_CELLS; i++) {
      // vertical lines
      var worldX = -WORLD_RANGE / 2 + (i / GRID_CELLS) * WORLD_RANGE;
      var cpV    = _worldToCanvas(worldX, 0);
      ctx.beginPath();
      ctx.moveTo(cpV.x, 0);
      ctx.lineTo(cpV.x, CANVAS_SIZE);
      ctx.stroke();
      // horizontal lines
      var worldZ = -WORLD_RANGE / 2 + (i / GRID_CELLS) * WORLD_RANGE;
      var cpH    = _worldToCanvas(0, worldZ);
      ctx.beginPath();
      ctx.moveTo(0, cpH.y);
      ctx.lineTo(CANVAS_SIZE, cpH.y);
      ctx.stroke();
    }
    ctx.restore();

    // ── grid ref labels ────────────────────────────────────────────────────────
    ctx.save();
    ctx.fillStyle = GRID_LABEL_COLOR;
    ctx.font = '9px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (i = 0; i < GRID_CELLS; i++) {
      for (j = 0; j < GRID_CELLS; j++) {
        var wx0 = -WORLD_RANGE / 2 + (i / GRID_CELLS) * WORLD_RANGE;
        var wz0 = -WORLD_RANGE / 2 + (j / GRID_CELLS) * WORLD_RANGE;
        var cellCenterX = wx0 + WORLD_RANGE / GRID_CELLS / 2;
        var cellCenterZ = wz0 + WORLD_RANGE / GRID_CELLS / 2;
        var cp = _worldToCanvas(cellCenterX, cellCenterZ);
        if (cp.x >= 0 && cp.x <= CANVAS_SIZE && cp.y >= 0 && cp.y <= CANVAS_SIZE) {
          ctx.fillText(COL_LABELS[i] + '-' + (j + 1), cp.x, cp.y);
        }
      }
    }
    ctx.restore();

    // ── intel layer ────────────────────────────────────────────────────────────
    if (_intelOn) {
      // artillery threat zones (from window._artilleryThreats or enemy artillery)
      var artZones = (window._artilleryThreats || []);
      for (i = 0; i < artZones.length; i++) {
        var az = artZones[i];
        var azp = _worldToCanvas(az.x || 0, az.z || 0);
        var azr = ((az.radius || 15) / WORLD_RANGE) * CANVAS_SIZE * _zoom;
        ctx.save();
        ctx.beginPath();
        ctx.arc(azp.x, azp.y, azr, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,50,50,0.18)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,80,80,0.6)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([6, 4]);
        ctx.stroke();
        ctx.restore();
      }

      // minefields from MineField._minefieldMap
      var minefieldMap = (window.MineField && window.MineField.getMinefieldMap) ? window.MineField.getMinefieldMap() : {};
      var mfKeys = Object.keys(minefieldMap);
      for (i = 0; i < mfKeys.length; i++) {
        var mf = minefieldMap[mfKeys[i]];
        if (!mf) { continue; }
        var mfx = mf.position ? mf.position.x : (mf.x || 0);
        var mfz = mf.position ? mf.position.z : (mf.z || 0);
        var mfp = _worldToCanvas(mfx, mfz);
        if (mfp.x < -10 || mfp.x > CANVAS_SIZE + 10 || mfp.y < -10 || mfp.y > CANVAS_SIZE + 10) { continue; }
        var xs = 6;
        ctx.save();
        ctx.strokeStyle = '#FF8800';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(mfp.x - xs, mfp.y - xs);
        ctx.lineTo(mfp.x + xs, mfp.y + xs);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(mfp.x + xs, mfp.y - xs);
        ctx.lineTo(mfp.x - xs, mfp.y + xs);
        ctx.stroke();
        ctx.restore();
      }
    }

    // ── objective markers ──────────────────────────────────────────────────────
    var capPoints = window._capturePoints || [];
    for (i = 0; i < capPoints.length; i++) {
      var cp2 = capPoints[i];
      if (!cp2) { continue; }
      var cpx = cp2.x !== undefined ? cp2.x : (cp2.pos ? cp2.pos.x : 0);
      var cpz = cp2.z !== undefined ? cp2.z : (cp2.pos ? cp2.pos.z : 0);
      var cpm = _worldToCanvas(cpx, cpz);
      if (cpm.x < -10 || cpm.x > CANVAS_SIZE + 10 || cpm.y < -10 || cpm.y > CANVAS_SIZE + 10) { continue; }
      var objColor;
      var st = cp2.state || 'neutral';
      if (st === 'friendly' || st === 2) {
        objColor = '#4488FF';
      } else if (st === 'enemy' || st === 1) {
        objColor = '#FF3322';
      } else {
        objColor = '#AAAAAA';
      }
      ctx.save();
      ctx.beginPath();
      ctx.arc(cpm.x, cpm.y, 8, 0, Math.PI * 2);
      ctx.fillStyle = objColor + '66';
      ctx.fill();
      ctx.strokeStyle = objColor;
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = objColor;
      ctx.font = 'bold 8px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('OBJ', cpm.x, cpm.y);
      ctx.restore();
    }

    // ── friendly (buddy) positions ────────────────────────────────────────────
    var buddies = (window.ChainOfCommand && window.ChainOfCommand.getBuddies) ? window.ChainOfCommand.getBuddies() : [];
    if (!buddies) { buddies = []; }
    for (i = 0; i < buddies.length; i++) {
      var buddy = buddies[i];
      if (!buddy || !buddy.mesh) { continue; }
      var bpos = buddy.mesh.position;
      var bpm  = _worldToCanvas(bpos.x, bpos.z);
      if (bpm.x < -10 || bpm.x > CANVAS_SIZE + 10 || bpm.y < -10 || bpm.y > CANVAS_SIZE + 10) { continue; }
      _drawSquare(ctx, bpm.x, bpm.y, 5, '#22CC44');
      var bname = buddy.callsign || ('BUDDY' + i);
      _drawLabel(ctx, bname, bpm.x, bpm.y + 7, '#22FF44');
    }

    // ── enemy intel positions ──────────────────────────────────────────────────
    for (i = 0; i < _enemyIntel.length; i++) {
      var intel = _enemyIntel[i];
      var age   = now - intel.timestamp;
      if (age > INTEL_FADE_SEC) { continue; }
      var alpha = 1 - (age / INTEL_FADE_SEC);
      var epm   = _worldToCanvas(intel.pos.x, intel.pos.z);
      if (epm.x < -10 || epm.x > CANVAS_SIZE + 10 || epm.y < -10 || epm.y > CANVAS_SIZE + 10) { continue; }
      ctx.save();
      ctx.globalAlpha = alpha;
      _drawTriangle(ctx, epm.x, epm.y, 6, 'rgba(255,50,50,' + alpha + ')');
      ctx.restore();
    }

    // ── waypoints + lines ─────────────────────────────────────────────────────
    if (_waypoints.length > 1) {
      ctx.save();
      ctx.strokeStyle = '#4488FF';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([5, 3]);
      ctx.beginPath();
      var wp0m = _worldToCanvas(_waypoints[0].wx, _waypoints[0].wz);
      ctx.moveTo(wp0m.x, wp0m.y);
      for (i = 1; i < _waypoints.length; i++) {
        var wpm = _worldToCanvas(_waypoints[i].wx, _waypoints[i].wz);
        ctx.lineTo(wpm.x, wpm.y);
      }
      ctx.stroke();
      ctx.restore();
    }
    for (i = 0; i < _waypoints.length; i++) {
      var wpt  = _waypoints[i];
      var wptm = _worldToCanvas(wpt.wx, wpt.wz);
      ctx.save();
      ctx.fillStyle = '#4488FF';
      ctx.strokeStyle = '#AACCFF';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(wptm.x, wptm.y, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
      _drawLabel(ctx, 'WP' + (i + 1), wptm.x, wptm.y - 18, '#88AAFF');
    }

    // ── player position ───────────────────────────────────────────────────────
    var ppos = _getPlayerPos();
    var ppm  = _worldToCanvas(ppos.x - ppos.x, ppos.z - ppos.z); // always centre at zoom origin
    // re-derive: player is the reference; at pan=0, player is at canvas centre
    var playerCanvasX = CANVAS_SIZE / 2 + _panX * (CANVAS_SIZE / WORLD_RANGE) * _zoom;
    var playerCanvasY = CANVAS_SIZE / 2 + _panZ * (CANVAS_SIZE / WORLD_RANGE) * _zoom;
    _drawDiamond(ctx, playerCanvasX, playerCanvasY, 7, '#2266FF');
    _drawLabel(ctx, 'YOU', playerCanvasX, playerCanvasY + 10, '#88AAFF');

    // ── distance tool ─────────────────────────────────────────────────────────
    if (_distDragging && _distStart && _distEnd) {
      var dws = _canvasToWorld(_distStart.x, _distStart.y);
      var dwe = _canvasToWorld(_distEnd.x,   _distEnd.y);
      var distM = Math.sqrt(
        Math.pow((dwe.x - dws.x), 2) + Math.pow((dwe.z - dws.z), 2)
      );
      // scale: 1 world unit = ? metres (assume 1:1 for this system)
      ctx.save();
      ctx.strokeStyle = '#FFFF00';
      ctx.lineWidth   = 1.5;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(_distStart.x, _distStart.y);
      ctx.lineTo(_distEnd.x,   _distEnd.y);
      ctx.stroke();
      ctx.fillStyle = '#FFFF00';
      ctx.font      = 'bold 11px monospace';
      ctx.textAlign = 'center';
      var midX = (_distStart.x + _distEnd.x) / 2;
      var midY = (_distStart.y + _distEnd.y) / 2 - 10;
      ctx.fillText(Math.round(distM) + 'm', midX, midY);
      ctx.restore();
    }

    // ── border ────────────────────────────────────────────────────────────────
    ctx.save();
    ctx.strokeStyle = '#3A6A3A';
    ctx.lineWidth   = 2;
    ctx.strokeRect(1, 1, CANVAS_SIZE - 2, CANVAS_SIZE - 2);
    ctx.restore();

    _updateHUD();
  }

  // ── player pos helper ──────────────────────────────────────────────────────
  function _getPlayerPos() {
    if (window._playerPos) { return window._playerPos; }
    if (window.player && window.player.position) { return window.player.position; }
    return { x: 0, y: 0, z: 0 };
  }

  // ── snapshot enemy intel ───────────────────────────────────────────────────
  function _snapshotEnemies() {
    var enemies = window._activeEnemies || window._enemies || [];
    var now = Date.now() / 1000;
    var i;
    for (i = 0; i < enemies.length; i++) {
      var e = enemies[i];
      if (!e || !e.mesh) { continue; }
      _enemyIntel.push({
        pos:       { x: e.mesh.position.x, z: e.mesh.position.z },
        timestamp: now
      });
    }
  }

  // ── HUD ───────────────────────────────────────────────────────────────────
  function _updateHUD() {
    if (!_hud) { return; }
    _hud.textContent =
      'MAP [ZOOM:' + _zoom + 'x] [INTEL: ' + (_intelOn ? 'ON' : 'OFF') + ']' +
      '  —  M=close, click=waypoint, scroll=zoom, I=intel, Shift+drag=dist, RMB=pan';
  }

  // ── toast ─────────────────────────────────────────────────────────────────
  function _showToast(text) {
    if (!_toast) { return; }
    _toast.textContent = text;
    _toast.style.opacity = '1';
    if (_toastTimer) { clearTimeout(_toastTimer); }
    _toastTimer = setTimeout(function () {
      if (_toast) { _toast.style.opacity = '0'; }
    }, 2000);
  }

  // ── event handlers ────────────────────────────────────────────────────────
  function _onKeyDown(e) {
    if (e.key === 'm' || e.key === 'M') {
      if (_open) { _close(); } else { _open2(); }
    }
    if ((e.key === 'i' || e.key === 'I') && _open) {
      _intelOn = !_intelOn;
      _render();
    }
  }

  function _onWheel(e) {
    if (!_open) { return; }
    e.preventDefault();
    var delta = e.deltaY > 0 ? -0.25 : 0.25;
    _zoom = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, _zoom + delta));
    _render();
  }

  function _onMouseDown(e) {
    if (!_open) { return; }
    if (e.button === 2) {
      // right-click pan
      _panning    = true;
      _panStartMx = e.clientX;
      _panStartMz = e.clientY;
      _panStartPX = _panX;
      _panStartPZ = _panZ;
      e.preventDefault();
      return;
    }
    if (e.button === 0) {
      if (e.shiftKey) {
        // distance tool start
        var cm = _canvasMouse(e);
        _distDragging = true;
        _distStart    = { x: cm.x, y: cm.y };
        _distEnd      = { x: cm.x, y: cm.y };
      } else {
        // place waypoint
        var cm2 = _canvasMouse(e);
        var w   = _canvasToWorld(cm2.x, cm2.y);
        // show grid ref toast
        var ref = _worldToGridRef(w.x, w.z);
        _showToast('GRID: ' + ref);
        if (_waypoints.length < MAX_WAYPOINTS) {
          _waypoints.push({ wx: w.x, wz: w.z });
          _exportWaypoints();
        }
        _render();
      }
    }
  }

  function _onMouseMove(e) {
    if (!_open) { return; }
    if (_panning) {
      var dx     = e.clientX - _panStartMx;
      var dy     = e.clientY - _panStartMz;
      var scale  = (CANVAS_SIZE / WORLD_RANGE) * _zoom;
      _panX      = _panStartPX + dx / scale;
      _panZ      = _panStartPZ + dy / scale;
      _render();
      return;
    }
    if (_distDragging && _distStart) {
      var cm = _canvasMouse(e);
      _distEnd = { x: cm.x, y: cm.y };
      _render();
    }
  }

  function _onMouseUp(e) {
    if (!_open) { return; }
    if (e.button === 2) {
      _panning = false;
      return;
    }
    if (e.button === 0 && _distDragging) {
      _distDragging = false;
      _render();
    }
  }

  function _onContextMenu(e) {
    if (_open) { e.preventDefault(); }
  }

  // ── export waypoints ──────────────────────────────────────────────────────
  function _exportWaypoints() {
    window._plannedWaypoints = _waypoints.map(function (wp) {
      return { x: wp.wx, z: wp.wz };
    });
  }

  // ── open / close ──────────────────────────────────────────────────────────
  function _open2() {
    if (_open) { return; }
    _open = true;
    _snapshotEnemies();
    _overlay.style.display = 'flex';
    _render();
  }

  function _close() {
    if (!_open) { return; }
    _open = false;
    _overlay.style.display = 'none';
  }

  // ── DOM setup ─────────────────────────────────────────────────────────────
  function _buildUI() {
    // overlay
    _overlay               = document.createElement('div');
    _overlay.id            = 'map-system-overlay';
    _overlay.style.cssText = [
      'position:fixed',
      'top:0',
      'left:0',
      'width:100%',
      'height:100%',
      'background:rgba(0,0,0,0.85)',
      'display:none',
      'align-items:center',
      'justify-content:center',
      'flex-direction:column',
      'z-index:9800',
      'user-select:none'
    ].join(';');

    // canvas wrapper (for centering)
    var wrapper               = document.createElement('div');
    wrapper.style.cssText     = 'position:relative;';

    // canvas
    _canvas               = document.createElement('canvas');
    _canvas.width         = CANVAS_SIZE;
    _canvas.height        = CANVAS_SIZE;
    _canvas.style.cssText = 'display:block;border:2px solid #3A6A3A;cursor:crosshair;';
    _ctx                  = _canvas.getContext('2d');

    // waypoint clear button
    var clearBtn               = document.createElement('button');
    clearBtn.textContent       = 'CLEAR WP';
    clearBtn.style.cssText     = [
      'position:absolute',
      'top:4px',
      'right:4px',
      'background:#1A2E1A',
      'color:#4A8A4A',
      'border:1px solid #3A6A3A',
      'font:bold 10px monospace',
      'padding:3px 6px',
      'cursor:pointer',
      'z-index:1'
    ].join(';');
    clearBtn.addEventListener('click', function () {
      _waypoints = [];
      _exportWaypoints();
      _render();
    });

    // HUD strip
    _hud               = document.createElement('div');
    _hud.style.cssText = [
      'color:#4A8A4A',
      'font:bold 11px monospace',
      'margin-top:8px',
      'text-align:center',
      'text-shadow:0 1px 3px #000',
      'letter-spacing:0.05em'
    ].join(';');

    // toast
    _toast               = document.createElement('div');
    _toast.style.cssText = [
      'position:absolute',
      'bottom:8px',
      'left:50%',
      'transform:translateX(-50%)',
      'background:rgba(0,20,0,0.85)',
      'color:#88FF88',
      'font:bold 12px monospace',
      'padding:4px 12px',
      'border:1px solid #3A6A3A',
      'border-radius:3px',
      'opacity:0',
      'transition:opacity 0.3s',
      'pointer-events:none',
      'z-index:2'
    ].join(';');

    wrapper.appendChild(_canvas);
    wrapper.appendChild(clearBtn);
    wrapper.appendChild(_toast);
    _overlay.appendChild(wrapper);
    _overlay.appendChild(_hud);
    document.body.appendChild(_overlay);

    // events on canvas
    _canvas.addEventListener('mousedown',   _onMouseDown);
    _canvas.addEventListener('mousemove',   _onMouseMove);
    _canvas.addEventListener('mouseup',     _onMouseUp);
    _canvas.addEventListener('wheel',       _onWheel, { passive: false });
    _canvas.addEventListener('contextmenu', _onContextMenu);

    // M key
    window.addEventListener('keydown', _onKeyDown);
  }

  // ── public API ─────────────────────────────────────────────────────────────
  function init() {
    if (_initialized) { return; }
    _initialized = true;
    _buildUI();
    window._plannedWaypoints = [];
  }

  function update(dt) {
    if (!_open) { return; }
    // re-render every frame the map is open so player pos & enemy fade stays live
    _render();
  }

  function reset() {
    _waypoints    = [];
    _enemyIntel   = [];
    _zoom         = 1;
    _panX         = 0;
    _panZ         = 0;
    _intelOn      = true;
    _panning      = false;
    _distDragging = false;
    _distStart    = null;
    _distEnd      = null;
    window._plannedWaypoints = [];
    if (_open) { _close(); }
  }

  return {
    init:   init,
    update: update,
    reset:  reset
  };

}());
