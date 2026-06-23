// minefield-mapper.js — FPS Minefield Mapping, Safe Lane Detection & Area Denial
// J             → open/close full-screen Minefield Map overlay
// E (map open)  → export current safe-lane waypoints to route array
// Shift+Click   → mark danger zone on map
// All var — no let/const. IIFE pattern.
window.MinefieldMapper = (function () {
  'use strict';

  // ── Constants ────────────────────────────────────────────────────────────
  var WORLD_SIZE        = 100;     // world units (map covers -50..+50 on X/Z)
  var SCAN_RADIUS       = 10;      // units — auto-scan radius around player
  var MINE_BUFFER       = 2;       // safe-lane path clears mines by this dist
  var EXIT_NORTH_OFFSET = 40;      // units north of player start = exit target
  var PATH_MARKER_STEP  = 3;       // units between 3D path marker dots
  var ROUTE_DEVIATION   = 3;       // units off-route triggers HUD flash
  var MAP_SIZE          = 100;     // canvas map resolution (cells)
  var MINI_SIZE         = 80;      // mini-minimap px
  var ARROW_DIST        = 4;       // units ahead of player for guidance arrow
  var DANGER_ZONE_RADIUS= 8;       // world-unit radius of manual danger zones

  // ── State ─────────────────────────────────────────────────────────────────
  var _scene          = null;
  var _camera         = null;
  var _inited         = false;
  var _mapOpen        = false;

  // Scan grid: flat array [MAP_SIZE * MAP_SIZE], value: 0=unscanned, 1=clear, 2=mine-nearby
  var _scanGrid       = [];
  var _confirmedMines = [];   // [{x, z}]
  var _dangerZones    = [];   // [{wx, wz, radius}]  — manual Shift+Click markers
  var _safeLanePath   = [];   // [{x, z}] world-space waypoints
  var _route          = [];   // exported route (same format)
  var _routeIndex     = 0;    // next waypoint index for guidance
  var _routeActive    = false;
  var _exitTarget     = null; // {x, z}

  // 3D world objects
  var _pathMarkers    = [];   // THREE.Mesh dots in world
  var _guidanceArrow  = null; // THREE.Mesh arrow
  var _markerGroup    = null; // THREE.Group holding path markers

  // Statistics
  var _statMinesFound   = 0;
  var _statMinesAvoided = 0;
  var _statSafeDistance = 0;
  var _lastPos          = null;
  var _lastSafePos      = null;

  // Accumulated scan time (reduce redundant scans)
  var _scanTimer      = 0;
  var _scanInterval   = 0.25; // seconds between scan updates

  // HUD / overlay elements
  var _overlayEl      = null;
  var _mapCanvas      = null;
  var _mapCtx         = null;
  var _statsEl        = null;
  var _miniCanvas     = null;
  var _miniCtx        = null;
  var _miniContainer  = null;
  var _offRouteEl     = null;
  var _offRouteTimer  = 0;

  // ── Helpers ───────────────────────────────────────────────────────────────

  function _getScene()  { return _scene  || window._gameScene || null; }
  function _getCamera() { return _camera || window._camera    || null; }

  function _getPlayerPos() {
    var cam = _getCamera();
    if (!cam) return { x: 0, y: 0, z: 0 };
    return { x: cam.position.x, y: cam.position.y, z: cam.position.z };
  }

  // Convert world X/Z to grid cell (0..MAP_SIZE-1)
  function _worldToCell(wx, wz) {
    var cx = Math.floor((wx + WORLD_SIZE * 0.5) / WORLD_SIZE * MAP_SIZE);
    var cz = Math.floor((wz + WORLD_SIZE * 0.5) / WORLD_SIZE * MAP_SIZE);
    cx = Math.max(0, Math.min(MAP_SIZE - 1, cx));
    cz = Math.max(0, Math.min(MAP_SIZE - 1, cz));
    return { cx: cx, cz: cz };
  }

  // Convert grid cell to world centre
  function _cellToWorld(cx, cz) {
    var wx = (cx + 0.5) / MAP_SIZE * WORLD_SIZE - WORLD_SIZE * 0.5;
    var wz = (cz + 0.5) / MAP_SIZE * WORLD_SIZE - WORLD_SIZE * 0.5;
    return { wx: wx, wz: wz };
  }

  // Convert world X/Z to canvas pixel on map canvas
  function _worldToPixel(wx, wz, canvasSize) {
    var px = (wx + WORLD_SIZE * 0.5) / WORLD_SIZE * canvasSize;
    var pz = (wz + WORLD_SIZE * 0.5) / WORLD_SIZE * canvasSize;
    return { px: px, pz: pz };
  }

  function _dist2D(ax, az, bx, bz) {
    var dx = ax - bx;
    var dz = az - bz;
    return Math.sqrt(dx * dx + dz * dz);
  }

  function _initScanGrid() {
    _scanGrid = [];
    for (var i = 0; i < MAP_SIZE * MAP_SIZE; i++) {
      _scanGrid[i] = 0;
    }
  }

  function _gridIdx(cx, cz) { return cz * MAP_SIZE + cx; }

  // ── Mine Registry Integration ─────────────────────────────────────────────

  function _fetchMineRegistry() {
    if (window.MineSweeper && typeof window.MineSweeper.getMineRegistry === 'function') {
      return window.MineSweeper.getMineRegistry();
    }
    // Fallback: check global mine arrays used by other systems
    if (window._gameMinefield && window._gameMinefield.mines) {
      return window._gameMinefield.mines;
    }
    return [];
  }

  // Sync confirmed mines from MineSweeper registry
  function _syncMines() {
    var registry = _fetchMineRegistry();
    var oldCount = _confirmedMines.length;
    _confirmedMines = [];
    for (var i = 0; i < registry.length; i++) {
      var m = registry[i];
      if (!m) continue;
      var pos = null;
      if (m.mesh && m.mesh.position) { pos = m.mesh.position; }
      else if (m.position) { pos = m.position; }
      else if (typeof m.x === 'number') { pos = m; }
      if (pos) {
        _confirmedMines.push({ x: pos.x, z: pos.z });
      }
    }
    var diff = _confirmedMines.length - oldCount;
    if (diff > 0) { _statMinesFound += diff; }
  }

  // ── Scanning ─────────────────────────────────────────────────────────────

  function _scanAroundPlayer() {
    var pos = _getPlayerPos();
    var cellRadius = Math.ceil(SCAN_RADIUS / WORLD_SIZE * MAP_SIZE);
    var centre = _worldToCell(pos.x, pos.z);

    for (var dz = -cellRadius; dz <= cellRadius; dz++) {
      for (var dx = -cellRadius; dx <= cellRadius; dx++) {
        var cx = centre.cx + dx;
        var cz = centre.cz + dz;
        if (cx < 0 || cx >= MAP_SIZE || cz < 0 || cz >= MAP_SIZE) continue;
        var wPos = _cellToWorld(cx, cz);
        var dist = _dist2D(pos.x, pos.z, wPos.wx, wPos.wz);
        if (dist <= SCAN_RADIUS) {
          if (_scanGrid[_gridIdx(cx, cz)] === 0) {
            _scanGrid[_gridIdx(cx, cz)] = 1; // mark scanned-clear
          }
        }
      }
    }
  }

  // ── Safe Lane Pathfinder (Zigzag BFS-style) ───────────────────────────────

  function _findSafeLane() {
    var pos = _getPlayerPos();
    var target = _exitTarget || { x: pos.x, z: pos.z - EXIT_NORTH_OFFSET };
    _safeLanePath = [];

    // Build mine obstacle set for quick lookup
    var obstacles = [];
    for (var mi = 0; mi < _confirmedMines.length; mi++) {
      obstacles.push(_confirmedMines[mi]);
    }
    // Also treat manual danger zones as obstacles
    for (var di = 0; di < _dangerZones.length; di++) {
      var dz2 = _dangerZones[di];
      obstacles.push({ x: dz2.wx, z: dz2.wz });
    }

    function _isClear(wx, wz) {
      for (var oi = 0; oi < obstacles.length; oi++) {
        if (_dist2D(wx, wz, obstacles[oi].x, obstacles[oi].z) < MINE_BUFFER) return false;
      }
      return true;
    }

    // Walk from start toward target with lateral dodging
    var step = PATH_MARKER_STEP;
    var maxSteps = 80;
    var cx2 = pos.x;
    var cz2 = pos.z;
    var dodgeOffsets = [0, -step, step, -step * 2, step * 2, -step * 3, step * 3];

    _safeLanePath.push({ x: cx2, z: cz2 });

    for (var s = 0; s < maxSteps; s++) {
      var dx = target.x - cx2;
      var dz3 = target.z - cz2;
      var distToTarget = Math.sqrt(dx * dx + dz3 * dz3);
      if (distToTarget < step) {
        _safeLanePath.push({ x: target.x, z: target.z });
        break;
      }
      // Normalise direction
      var nx = dx / distToTarget;
      var nz = dz3 / distToTarget;
      // Perpendicular (lateral dodge)
      var perpX = -nz;
      var perpZ = nx;

      var moved = false;
      for (var oi2 = 0; oi2 < dodgeOffsets.length; oi2++) {
        var off = dodgeOffsets[oi2];
        var nx2 = cx2 + nx * step + perpX * off;
        var nz2 = cz2 + nz * step + perpZ * off;
        if (_isClear(nx2, nz2)) {
          cx2 = nx2;
          cz2 = nz2;
          _safeLanePath.push({ x: cx2, z: cz2 });
          moved = true;
          break;
        }
      }
      if (!moved) break; // Dead end — no path found, stop here
    }
  }

  // ── 3D Path Markers ───────────────────────────────────────────────────────

  function _clearPathMarkers() {
    var sc = _getScene();
    if (_markerGroup && sc) {
      sc.remove(_markerGroup);
    }
    _pathMarkers = [];
    _markerGroup = null;
  }

  function _buildPathMarkers() {
    _clearPathMarkers();
    var sc = _getScene();
    if (!sc || _safeLanePath.length < 2) return;

    _markerGroup = new THREE.Group();
    _markerGroup.name = 'MinefieldPathMarkers';

    var geo = new THREE.SphereGeometry(0.15, 6, 6);
    var mat = new THREE.MeshBasicMaterial({ color: 0x00ff44 });

    for (var i = 0; i < _safeLanePath.length; i++) {
      var wp = _safeLanePath[i];
      var mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(wp.x, 0.3, wp.z);
      _markerGroup.add(mesh);
      _pathMarkers.push(mesh);
    }

    // Soft glow via point lights at every third marker
    for (var li = 0; li < _pathMarkers.length; li += 3) {
      var light = new THREE.PointLight(0x00ff44, 0.4, 3);
      light.position.copy(_pathMarkers[li].position);
      _markerGroup.add(light);
    }

    sc.add(_markerGroup);
  }

  // ── Guidance Arrow ────────────────────────────────────────────────────────

  function _buildGuidanceArrow() {
    var sc = _getScene();
    if (!sc) return;
    _removeGuidanceArrow();

    // Simple arrow: cone pointing forward + small cylinder stem
    var arrowGroup = new THREE.Group();
    arrowGroup.name = 'MinefieldGuidanceArrow';

    var coneGeo  = new THREE.ConeGeometry(0.2, 0.6, 8);
    var stemGeo  = new THREE.CylinderGeometry(0.06, 0.06, 0.4, 6);
    var mat2 = new THREE.MeshBasicMaterial({ color: 0x00ff88 });

    var cone = new THREE.Mesh(coneGeo, mat2);
    cone.position.set(0, 0, 0);
    var stem = new THREE.Mesh(stemGeo, mat2);
    stem.position.set(0, -0.5, 0);

    arrowGroup.add(cone);
    arrowGroup.add(stem);
    sc.add(arrowGroup);
    _guidanceArrow = arrowGroup;
  }

  function _removeGuidanceArrow() {
    var sc = _getScene();
    if (_guidanceArrow && sc) {
      sc.remove(_guidanceArrow);
      _guidanceArrow = null;
    }
  }

  function _updateGuidanceArrow() {
    if (!_routeActive || !_guidanceArrow || _route.length === 0) return;
    var cam = _getCamera();
    if (!cam) return;
    var pos = _getPlayerPos();

    // Find next waypoint
    while (_routeIndex < _route.length - 1) {
      var wp = _route[_routeIndex];
      if (_dist2D(pos.x, pos.z, wp.x, wp.z) < 2.5) {
        _routeIndex++;
        _statMinesAvoided++; // passed a waypoint safely
      } else {
        break;
      }
    }

    if (_routeIndex >= _route.length) return;

    var target = _route[_routeIndex];
    var dx = target.x - pos.x;
    var dz = target.z - pos.z;
    var angle = Math.atan2(dx, dz);

    // Position arrow ARROW_DIST units ahead of camera direction
    var camDir = new THREE.Vector3();
    cam.getWorldDirection(camDir);
    camDir.y = 0;
    camDir.normalize();

    _guidanceArrow.position.set(
      pos.x + camDir.x * ARROW_DIST,
      pos.y - 0.3,
      pos.z + camDir.z * ARROW_DIST
    );
    _guidanceArrow.rotation.set(0, angle, 0);
  }

  // ── Route Deviation Check ─────────────────────────────────────────────────

  function _checkRouteDeviation() {
    if (!_routeActive || _route.length === 0) return;
    var pos = _getPlayerPos();
    var minDist = 999;
    for (var i = 0; i < _route.length; i++) {
      var d = _dist2D(pos.x, pos.z, _route[i].x, _route[i].z);
      if (d < minDist) minDist = d;
    }
    if (minDist > ROUTE_DEVIATION) {
      _triggerOffRouteAlert();
    }
  }

  function _triggerOffRouteAlert() {
    if (_offRouteEl) {
      _offRouteEl.style.display = 'block';
      _offRouteTimer = 2.0;
    }
  }

  // ── Map Overlay ───────────────────────────────────────────────────────────

  function _buildOverlay() {
    if (_overlayEl) return;

    _overlayEl = document.createElement('div');
    _overlayEl.id = 'minefield-map-overlay';
    _overlayEl.style.cssText = [
      'position:fixed;top:0;left:0;width:100%;height:100%;',
      'background:rgba(0,0,0,0.88);z-index:9500;display:none;',
      'font-family:monospace;color:#00ff88;',
    ].join('');

    // Title
    var title = document.createElement('div');
    title.style.cssText = 'position:absolute;top:14px;left:50%;transform:translateX(-50%);font-size:18px;font-weight:bold;letter-spacing:3px;color:#00ff88;text-shadow:0 0 8px #00ff88;';
    title.textContent = '[ MINEFIELD MAP ]';
    _overlayEl.appendChild(title);

    // Subtitle keys
    var keys = document.createElement('div');
    keys.style.cssText = 'position:absolute;top:40px;left:50%;transform:translateX(-50%);font-size:11px;color:#009944;letter-spacing:1px;';
    keys.textContent = 'J=CLOSE  |  E=EXPORT ROUTE  |  SHIFT+CLICK=MARK DANGER';
    _overlayEl.appendChild(keys);

    // Map canvas
    var canvasSize = Math.min(window.innerWidth, window.innerHeight) * 0.72;
    canvasSize = Math.floor(Math.min(canvasSize, 680));

    _mapCanvas = document.createElement('canvas');
    _mapCanvas.width  = canvasSize;
    _mapCanvas.height = canvasSize;
    _mapCanvas.style.cssText = [
      'position:absolute;',
      'top:50%;left:50%;',
      'transform:translate(-50%,-50%);',
      'border:1px solid #004422;',
      'cursor:crosshair;',
    ].join('');
    _overlayEl.appendChild(_mapCanvas);
    _mapCtx = _mapCanvas.getContext('2d');

    // Stats panel
    _statsEl = document.createElement('div');
    _statsEl.style.cssText = [
      'position:absolute;bottom:20px;left:50%;transform:translateX(-50%);',
      'font-size:13px;color:#00cc66;text-align:center;letter-spacing:1px;',
    ].join('');
    _overlayEl.appendChild(_statsEl);

    _mapCanvas.addEventListener('click', _onMapClick, false);

    document.body.appendChild(_overlayEl);
  }

  function _onMapClick(evt) {
    if (!evt.shiftKey) return;
    var rect = _mapCanvas.getBoundingClientRect();
    var px = evt.clientX - rect.left;
    var pz = evt.clientY - rect.top;
    var canvasSize = _mapCanvas.width;
    // Convert pixel to world
    var wx = (px / canvasSize) * WORLD_SIZE - WORLD_SIZE * 0.5;
    var wz = (pz / canvasSize) * WORLD_SIZE - WORLD_SIZE * 0.5;
    _dangerZones.push({ wx: wx, wz: wz, radius: DANGER_ZONE_RADIUS });
    _drawMap();
  }

  function _drawMap() {
    if (!_mapCtx || !_mapCanvas) return;
    var cs = _mapCanvas.width;

    // Background
    _mapCtx.fillStyle = '#010a04';
    _mapCtx.fillRect(0, 0, cs, cs);

    // ── Heat-map / scan grid ─────────────────────────────────────────────
    var cellPx = cs / MAP_SIZE;
    for (var cz = 0; cz < MAP_SIZE; cz++) {
      for (var cx = 0; cx < MAP_SIZE; cx++) {
        var val = _scanGrid[_gridIdx(cx, cz)];
        var wPos = _cellToWorld(cx, cz);
        // Density: count mines within 8 units
        var density = 0;
        for (var mi = 0; mi < _confirmedMines.length; mi++) {
          if (_dist2D(wPos.wx, wPos.wz, _confirmedMines[mi].x, _confirmedMines[mi].z) < 8) {
            density++;
          }
        }
        var fillColor;
        if (val === 0) {
          fillColor = '#050e07'; // unscanned — very dark
        } else if (density === 0) {
          fillColor = '#003311'; // clear
        } else if (density === 1) {
          fillColor = '#445500'; // low — yellow-ish
        } else if (density === 2) {
          fillColor = '#664400'; // medium — orange
        } else {
          fillColor = '#550000'; // high — red
        }
        _mapCtx.fillStyle = fillColor;
        _mapCtx.fillRect(cx * cellPx, cz * cellPx, cellPx, cellPx);
      }
    }

    // ── Grid lines ────────────────────────────────────────────────────────
    _mapCtx.strokeStyle = 'rgba(0,80,30,0.3)';
    _mapCtx.lineWidth = 0.5;
    var gridLines = 10;
    var gridStep = cs / gridLines;
    for (var g = 0; g <= gridLines; g++) {
      _mapCtx.beginPath();
      _mapCtx.moveTo(g * gridStep, 0);
      _mapCtx.lineTo(g * gridStep, cs);
      _mapCtx.stroke();
      _mapCtx.beginPath();
      _mapCtx.moveTo(0, g * gridStep);
      _mapCtx.lineTo(cs, g * gridStep);
      _mapCtx.stroke();
    }

    // ── Danger zones ──────────────────────────────────────────────────────
    for (var di = 0; di < _dangerZones.length; di++) {
      var dz3 = _dangerZones[di];
      var dp = _worldToPixel(dz3.wx, dz3.wz, cs);
      var rPx = dz3.radius / WORLD_SIZE * cs;
      _mapCtx.strokeStyle = 'rgba(255,60,0,0.7)';
      _mapCtx.lineWidth = 2;
      _mapCtx.fillStyle = 'rgba(255,30,0,0.15)';
      _mapCtx.beginPath();
      _mapCtx.arc(dp.px, dp.pz, rPx, 0, Math.PI * 2);
      _mapCtx.fill();
      _mapCtx.stroke();
      // Hatch pattern
      _mapCtx.strokeStyle = 'rgba(255,60,0,0.35)';
      _mapCtx.lineWidth = 1;
      for (var hatch = -rPx * 2; hatch < rPx * 2; hatch += 6) {
        _mapCtx.beginPath();
        _mapCtx.moveTo(dp.px + hatch, dp.pz - rPx);
        _mapCtx.lineTo(dp.px + hatch + rPx, dp.pz + rPx);
        _mapCtx.stroke();
      }
    }

    // ── Safe lane path (dotted green line) ───────────────────────────────
    if (_safeLanePath.length > 1) {
      _mapCtx.setLineDash([4, 5]);
      _mapCtx.strokeStyle = '#00ff44';
      _mapCtx.lineWidth = 2;
      _mapCtx.beginPath();
      var sp0 = _worldToPixel(_safeLanePath[0].x, _safeLanePath[0].z, cs);
      _mapCtx.moveTo(sp0.px, sp0.pz);
      for (var pi = 1; pi < _safeLanePath.length; pi++) {
        var sp = _worldToPixel(_safeLanePath[pi].x, _safeLanePath[pi].z, cs);
        _mapCtx.lineTo(sp.px, sp.pz);
      }
      _mapCtx.stroke();
      _mapCtx.setLineDash([]);
    }

    // ── Confirmed mines (red X) ───────────────────────────────────────────
    for (var mi2 = 0; mi2 < _confirmedMines.length; mi2++) {
      var m = _confirmedMines[mi2];
      var mp = _worldToPixel(m.x, m.z, cs);
      var xSize = 5;
      _mapCtx.strokeStyle = '#ff2222';
      _mapCtx.lineWidth = 2;
      _mapCtx.beginPath();
      _mapCtx.moveTo(mp.px - xSize, mp.pz - xSize);
      _mapCtx.lineTo(mp.px + xSize, mp.pz + xSize);
      _mapCtx.stroke();
      _mapCtx.beginPath();
      _mapCtx.moveTo(mp.px + xSize, mp.pz - xSize);
      _mapCtx.lineTo(mp.px - xSize, mp.pz + xSize);
      _mapCtx.stroke();
    }

    // ── Export route waypoints ────────────────────────────────────────────
    if (_routeActive && _route.length > 1) {
      _mapCtx.strokeStyle = '#88ffaa';
      _mapCtx.lineWidth = 1.5;
      _mapCtx.setLineDash([2, 3]);
      _mapCtx.beginPath();
      var rp0 = _worldToPixel(_route[0].x, _route[0].z, cs);
      _mapCtx.moveTo(rp0.px, rp0.pz);
      for (var ri = 1; ri < _route.length; ri++) {
        var rp = _worldToPixel(_route[ri].x, _route[ri].z, cs);
        _mapCtx.lineTo(rp.px, rp.pz);
      }
      _mapCtx.stroke();
      _mapCtx.setLineDash([]);
    }

    // ── Exit target marker ────────────────────────────────────────────────
    if (_exitTarget) {
      var ep = _worldToPixel(_exitTarget.x, _exitTarget.z, cs);
      _mapCtx.strokeStyle = '#00ffff';
      _mapCtx.lineWidth = 2;
      _mapCtx.fillStyle = 'rgba(0,255,255,0.15)';
      _mapCtx.beginPath();
      _mapCtx.arc(ep.px, ep.pz, 8, 0, Math.PI * 2);
      _mapCtx.fill();
      _mapCtx.stroke();
      _mapCtx.fillStyle = '#00ffff';
      _mapCtx.font = '10px monospace';
      _mapCtx.fillText('EXIT', ep.px + 10, ep.pz + 4);
    }

    // ── Player position (white dot) ───────────────────────────────────────
    var pos = _getPlayerPos();
    var pp = _worldToPixel(pos.x, pos.z, cs);
    _mapCtx.fillStyle = '#ffffff';
    _mapCtx.beginPath();
    _mapCtx.arc(pp.px, pp.pz, 5, 0, Math.PI * 2);
    _mapCtx.fill();
    _mapCtx.strokeStyle = '#00ff88';
    _mapCtx.lineWidth = 1.5;
    _mapCtx.stroke();

    // ── Cardinal labels ───────────────────────────────────────────────────
    _mapCtx.fillStyle = 'rgba(0,200,80,0.5)';
    _mapCtx.font = '11px monospace';
    _mapCtx.fillText('N', cs / 2 - 4, 14);
    _mapCtx.fillText('S', cs / 2 - 4, cs - 4);
    _mapCtx.fillText('W', 4, cs / 2 + 4);
    _mapCtx.fillText('E', cs - 14, cs / 2 + 4);

    // ── Stats ─────────────────────────────────────────────────────────────
    if (_statsEl) {
      _statsEl.innerHTML =
        'MINES FOUND: <span style="color:#ff4444">' + _statMinesFound + '</span>' +
        '  &nbsp;|&nbsp;  MINES AVOIDED: <span style="color:#ffaa00">' + _statMinesAvoided + '</span>' +
        '  &nbsp;|&nbsp;  SAFE DIST: <span style="color:#00ff88">' + Math.floor(_statSafeDistance) + 'm</span>' +
        '  &nbsp;|&nbsp;  DANGER ZONES: <span style="color:#ff6600">' + _dangerZones.length + '</span>';
    }
  }

  // ── Mini-Minimap ──────────────────────────────────────────────────────────

  function _buildMiniMap() {
    if (_miniContainer) return;

    _miniContainer = document.createElement('div');
    _miniContainer.id = 'minefield-minimap';
    _miniContainer.style.cssText = [
      'position:fixed;bottom:20px;right:20px;',
      'width:' + MINI_SIZE + 'px;height:' + MINI_SIZE + 'px;',
      'border:1px solid rgba(0,200,80,0.4);',
      'background:rgba(0,5,2,0.85);',
      'z-index:4100;pointer-events:none;',
      'box-shadow:0 0 6px rgba(0,255,100,0.15);',
    ].join('');

    _miniCanvas = document.createElement('canvas');
    _miniCanvas.width  = MINI_SIZE;
    _miniCanvas.height = MINI_SIZE;
    _miniCanvas.style.cssText = 'position:absolute;top:0;left:0;';
    _miniContainer.appendChild(_miniCanvas);
    _miniCtx = _miniCanvas.getContext('2d');

    // Label
    var lbl = document.createElement('div');
    lbl.style.cssText = 'position:absolute;bottom:1px;left:2px;font-family:monospace;font-size:7px;color:rgba(0,255,80,0.4);pointer-events:none;';
    lbl.textContent = 'MINE MAP';
    _miniContainer.appendChild(lbl);

    document.body.appendChild(_miniContainer);
  }

  function _drawMiniMap() {
    if (!_miniCtx) return;
    var ms = MINI_SIZE;
    var vicinity = 30; // world units shown on mini-map

    _miniCtx.fillStyle = '#010a04';
    _miniCtx.fillRect(0, 0, ms, ms);

    var pos = _getPlayerPos();

    // Draw grid lines lightly
    _miniCtx.strokeStyle = 'rgba(0,60,20,0.35)';
    _miniCtx.lineWidth = 0.5;
    for (var g = 0; g <= 5; g++) {
      var gp = g * ms / 5;
      _miniCtx.beginPath(); _miniCtx.moveTo(gp, 0); _miniCtx.lineTo(gp, ms); _miniCtx.stroke();
      _miniCtx.beginPath(); _miniCtx.moveTo(0, gp); _miniCtx.lineTo(ms, gp); _miniCtx.stroke();
    }

    // Colour scanned area near player
    for (var mi3 = -vicinity; mi3 <= vicinity; mi3 += 2) {
      for (var mj3 = -vicinity; mj3 <= vicinity; mj3 += 2) {
        var wx = pos.x + mi3;
        var wz = pos.z + mj3;
        var cell = _worldToCell(wx, wz);
        var scanned = _scanGrid[_gridIdx(cell.cx, cell.cz)];
        if (scanned === 0) continue;
        var density2 = 0;
        for (var ci = 0; ci < _confirmedMines.length; ci++) {
          if (_dist2D(wx, wz, _confirmedMines[ci].x, _confirmedMines[ci].z) < 5) density2++;
        }
        var col;
        if (density2 === 0)      { col = 'rgba(0,80,30,0.5)'; }
        else if (density2 === 1) { col = 'rgba(100,100,0,0.5)'; }
        else if (density2 === 2) { col = 'rgba(160,70,0,0.5)'; }
        else                     { col = 'rgba(160,0,0,0.5)'; }
        var px3 = (mi3 + vicinity) / (vicinity * 2) * ms;
        var pz3 = (mj3 + vicinity) / (vicinity * 2) * ms;
        _miniCtx.fillStyle = col;
        _miniCtx.fillRect(px3, pz3, ms / vicinity + 1, ms / vicinity + 1);
      }
    }

    // Mines near player
    for (var mi4 = 0; mi4 < _confirmedMines.length; mi4++) {
      var mn = _confirmedMines[mi4];
      var relX = mn.x - pos.x;
      var relZ = mn.z - pos.z;
      if (Math.abs(relX) > vicinity || Math.abs(relZ) > vicinity) continue;
      var mpx = (relX + vicinity) / (vicinity * 2) * ms;
      var mpz = (relZ + vicinity) / (vicinity * 2) * ms;
      _miniCtx.strokeStyle = '#ff2222';
      _miniCtx.lineWidth = 1.5;
      _miniCtx.beginPath();
      _miniCtx.moveTo(mpx - 3, mpz - 3); _miniCtx.lineTo(mpx + 3, mpz + 3); _miniCtx.stroke();
      _miniCtx.beginPath();
      _miniCtx.moveTo(mpx + 3, mpz - 3); _miniCtx.lineTo(mpx - 3, mpz + 3); _miniCtx.stroke();
    }

    // Safe path on mini
    if (_safeLanePath.length > 1) {
      _miniCtx.setLineDash([2, 3]);
      _miniCtx.strokeStyle = '#00ff44';
      _miniCtx.lineWidth = 1;
      _miniCtx.beginPath();
      for (var spi = 0; spi < _safeLanePath.length; spi++) {
        var spRx = _safeLanePath[spi].x - pos.x;
        var spRz = _safeLanePath[spi].z - pos.z;
        if (Math.abs(spRx) > vicinity || Math.abs(spRz) > vicinity) continue;
        var spx = (spRx + vicinity) / (vicinity * 2) * ms;
        var spz = (spRz + vicinity) / (vicinity * 2) * ms;
        if (spi === 0) { _miniCtx.moveTo(spx, spz); }
        else           { _miniCtx.lineTo(spx, spz); }
      }
      _miniCtx.stroke();
      _miniCtx.setLineDash([]);
    }

    // Player dot centre
    _miniCtx.fillStyle = '#ffffff';
    _miniCtx.beginPath();
    _miniCtx.arc(ms / 2, ms / 2, 3, 0, Math.PI * 2);
    _miniCtx.fill();
  }

  // ── Off-Route HUD element ─────────────────────────────────────────────────

  function _buildOffRouteHUD() {
    if (_offRouteEl) return;
    _offRouteEl = document.createElement('div');
    _offRouteEl.id = 'minefield-off-route';
    _offRouteEl.style.cssText = [
      'position:fixed;top:38%;left:50%;transform:translate(-50%,-50%);',
      'font-family:monospace;font-size:28px;font-weight:bold;',
      'color:#ff4400;text-shadow:0 0 12px #ff4400;',
      'letter-spacing:6px;display:none;',
      'z-index:9600;pointer-events:none;',
    ].join('');
    _offRouteEl.textContent = 'OFF ROUTE';
    document.body.appendChild(_offRouteEl);
  }

  // ── Input ─────────────────────────────────────────────────────────────────

  function _onKeyDown(evt) {
    if (evt.key === 'j' || evt.key === 'J') {
      if (_mapOpen) { _closeMap(); } else { _openMap(); }
    }
    if ((evt.key === 'e' || evt.key === 'E') && _mapOpen) {
      _exportRoute();
    }
  }

  // ── Open / Close Map ──────────────────────────────────────────────────────

  function _openMap() {
    _syncMines();
    _findSafeLane();
    _buildPathMarkers();
    _mapOpen = true;
    if (_overlayEl) {
      _overlayEl.style.display = 'block';
      _drawMap();
    }
  }

  function _closeMap() {
    _mapOpen = false;
    if (_overlayEl) {
      _overlayEl.style.display = 'none';
    }
  }

  // ── Export Route ──────────────────────────────────────────────────────────

  function _exportRoute() {
    _route = [];
    for (var i = 0; i < _safeLanePath.length; i++) {
      _route.push({ x: _safeLanePath[i].x, z: _safeLanePath[i].z });
    }
    _routeIndex  = 0;
    _routeActive = _route.length > 0;
    if (_routeActive) {
      _buildGuidanceArrow();
    }
    // Brief flash confirming export
    var flash = document.createElement('div');
    flash.style.cssText = [
      'position:fixed;top:20%;left:50%;transform:translate(-50%,-50%);',
      'font-family:monospace;font-size:16px;color:#00ff88;',
      'text-shadow:0 0 8px #00ff88;z-index:9700;pointer-events:none;',
    ].join('');
    flash.textContent = 'ROUTE SAVED — ' + _route.length + ' WAYPOINTS';
    document.body.appendChild(flash);
    setTimeout(function () { if (flash.parentNode) flash.parentNode.removeChild(flash); }, 2000);
    _drawMap();
  }

  // ── Init ──────────────────────────────────────────────────────────────────

  function init(scene, camera) {
    if (_inited) return;
    _scene  = scene  || window._gameScene  || null;
    _camera = camera || window._camera     || null;
    _inited = true;

    _initScanGrid();
    _confirmedMines = [];
    _dangerZones    = [];
    _safeLanePath   = [];
    _route          = [];
    _routeActive    = false;
    _statMinesFound    = 0;
    _statMinesAvoided  = 0;
    _statSafeDistance  = 0;
    _lastPos           = null;
    _lastSafePos       = null;

    _buildOverlay();
    _buildMiniMap();
    _buildOffRouteHUD();

    document.addEventListener('keydown', _onKeyDown, false);

    console.log('[MinefieldMapper] init — J=map, Shift+Click=danger zone, E=export route');
  }

  // ── Update (call each frame with delta time in seconds) ───────────────────

  function update(delta) {
    if (!_inited) return;

    // Accumulate scan timer
    _scanTimer += delta;
    if (_scanTimer >= _scanInterval) {
      _scanTimer = 0;
      _syncMines();
      _scanAroundPlayer();
    }

    // Off-route HUD timer
    if (_offRouteTimer > 0) {
      _offRouteTimer -= delta;
      if (_offRouteTimer <= 0 && _offRouteEl) {
        _offRouteEl.style.display = 'none';
      } else if (_offRouteEl) {
        // Flicker effect
        _offRouteEl.style.opacity = (Math.sin(_offRouteTimer * 10) > 0) ? '1' : '0.3';
      }
    }

    // Safe distance traveled
    var pos = _getPlayerPos();
    if (_lastPos) {
      var moved = _dist2D(pos.x, pos.z, _lastPos.x, _lastPos.z);
      // Only count as safe if not next to a mine
      var nearMine = false;
      for (var mi = 0; mi < _confirmedMines.length; mi++) {
        if (_dist2D(pos.x, pos.z, _confirmedMines[mi].x, _confirmedMines[mi].z) < MINE_BUFFER + 1) {
          nearMine = true;
          break;
        }
      }
      if (!nearMine) {
        _statSafeDistance += moved;
      }
    }
    _lastPos = { x: pos.x, z: pos.z };

    // Route deviation check
    if (_routeActive) {
      _checkRouteDeviation();
      _updateGuidanceArrow();
    }

    // Refresh mini-map every frame (cheap canvas op)
    _drawMiniMap();

    // Refresh full map if open
    if (_mapOpen) {
      _drawMap();
    }
  }

  // ── Public: setSafeLaneTarget ─────────────────────────────────────────────

  function setSafeLaneTarget(x, z) {
    _exitTarget = { x: x, z: z };
    if (_mapOpen) {
      _findSafeLane();
      _buildPathMarkers();
      _drawMap();
    }
  }

  // ── Public: openMap ───────────────────────────────────────────────────────

  function openMap() { _openMap(); }

  // ── Public: getRoute ──────────────────────────────────────────────────────

  function getRoute() {
    return _route.slice();
  }

  // ── Reset ─────────────────────────────────────────────────────────────────

  function reset() {
    _initScanGrid();
    _confirmedMines    = [];
    _dangerZones       = [];
    _safeLanePath      = [];
    _route             = [];
    _routeActive       = false;
    _routeIndex        = 0;
    _exitTarget        = null;
    _statMinesFound    = 0;
    _statMinesAvoided  = 0;
    _statSafeDistance  = 0;
    _lastPos           = null;
    _lastSafePos       = null;
    _scanTimer         = 0;
    _offRouteTimer     = 0;
    _clearPathMarkers();
    _removeGuidanceArrow();
    if (_overlayEl) _overlayEl.style.display = 'none';
    if (_offRouteEl) _offRouteEl.style.display = 'none';
    _mapOpen = false;
  }

  // ── Public API ────────────────────────────────────────────────────────────

  return {
    init:              init,
    update:            update,
    openMap:           openMap,
    setSafeLaneTarget: setSafeLaneTarget,
    getRoute:          getRoute,
    reset:             reset
  };

})();
