/* ============================================================
 *  SMART-COVER.JS — Auto-detect and suggest optimal cover positions
 *
 *  Exposed globals:
 *    window._coverQuality    — 'EXCELLENT COVER' | 'GOOD COVER' |
 *                              'PARTIAL COVER'   | 'EXPOSED'
 *    window._nearestCoverPos — THREE.Vector3 or null
 *
 *  Reads:
 *    window._suppressedLevel  — 0-100 suppression on player
 *    window._leanOffset       — -1 | 0 | 1 (lean system)
 *    window.Enemies.getAll()  — live enemy array
 *    window.VoxelWorld.isSolid(x,y,z)
 *
 *  Public API: init(), update(dt, playerPos, enemies, camera), reset()
 * ============================================================ */
window.SmartCover = (function () {
  'use strict';

  // ── Scan config ─────────────────────────────────────────────
  var SCAN_STEP    = 0.5;   // units per raycast step
  var SCAN_RANGE   = 6;     // max range to scan for cover
  var ENEMY_RADIUS = 25;    // enemy proximity radius to care about
  var TOAST_COOLDOWN = 4.0; // seconds between "TAKE COVER" toasts
  var SUPPRESSION_THRESHOLD = 50; // _suppressedLevel threshold

  // 8 compass directions (dx, dz)
  var DIRS = [
    [  1,  0 ],   // E
    [  1,  1 ],   // SE
    [  0,  1 ],   // S
    [ -1,  1 ],   // SW
    [ -1,  0 ],   // W
    [ -1, -1 ],   // NW
    [  0, -1 ],   // N
    [  1, -1 ]    // NE
  ];

  // ── State ────────────────────────────────────────────────────
  var _camera        = null;
  var _toastCooldown = 0;
  var _sprintTarget  = null;  // cover pos being auto-sprinted to
  var _keysDown      = {};    // track Shift + C

  // ── DOM refs ─────────────────────────────────────────────────
  var _hudEl       = null;  // cover quality HUD
  var _toastEl     = null;  // "TAKE COVER" toast
  var _peekEl      = null;  // "PEEK MODE" indicator
  var _coverLabels = [];    // floating "COVER" labels [ { el, pos } ]

  // ── DOM helpers ──────────────────────────────────────────────
  function _getOrCreate(id, styles) {
    var el = document.getElementById(id);
    if (!el) {
      el = document.createElement('div');
      el.id = id;
      Object.assign(el.style, styles);
      document.body.appendChild(el);
    }
    return el;
  }

  function _initDOM() {
    // Cover quality HUD — bottom-left corner
    _hudEl = _getOrCreate('smartCoverHud', {
      position:      'fixed',
      bottom:        '95px',
      left:          '14px',
      fontFamily:    'monospace',
      fontSize:      '11px',
      color:         '#44ff88',
      background:    'rgba(0,0,0,0.65)',
      padding:       '3px 8px',
      borderRadius:  '4px',
      border:        '1px solid rgba(68,255,136,0.4)',
      zIndex:        '4900',
      display:       'none',
      pointerEvents: 'none',
      letterSpacing: '1px'
    });

    // "TAKE COVER" toast — centre screen
    _toastEl = _getOrCreate('smartCoverToast', {
      position:      'fixed',
      top:           '38%',
      left:          '50%',
      transform:     'translateX(-50%)',
      fontFamily:    'monospace',
      fontSize:      '18px',
      fontWeight:    'bold',
      color:         '#ffe066',
      background:    'rgba(0,0,0,0.78)',
      border:        '2px solid #ffe066',
      borderRadius:  '6px',
      padding:       '8px 24px',
      zIndex:        '5000',
      display:       'none',
      pointerEvents: 'none',
      textAlign:     'center',
      letterSpacing: '2px',
      textShadow:    '0 0 10px rgba(255,220,80,0.7)'
    });

    // "PEEK MODE" indicator — left edge
    _peekEl = _getOrCreate('smartCoverPeek', {
      position:      'fixed',
      top:           '50%',
      left:          '12px',
      transform:     'translateY(-50%) translateY(32px)',
      fontFamily:    'monospace',
      fontSize:      '11px',
      color:         '#00ccff',
      background:    'rgba(0,0,0,0.6)',
      border:        '1px solid #00ccff',
      borderRadius:  '4px',
      padding:       '2px 8px',
      zIndex:        '4850',
      display:       'none',
      pointerEvents: 'none',
      letterSpacing: '1px'
    });
  }

  // ── VoxelWorld.isSolid wrapper ────────────────────────────────
  function _isSolid(x, y, z) {
    if (window.VoxelWorld && typeof window.VoxelWorld.isSolid === 'function') {
      return window.VoxelWorld.isSolid(x, y, z);
    }
    if (typeof window.isSolid === 'function') {
      return window.isSolid(x, y, z);
    }
    return false;
  }

  // ── Distance squared (XZ plane) ───────────────────────────────
  function _distSqXZ(ax, az, bx, bz) {
    var dx = ax - bx, dz = az - bz;
    return dx * dx + dz * dz;
  }

  // ── Line-of-sight check (solid block between two points) ─────
  // Returns true if LOS is BLOCKED (cover exists between them)
  function _losBlocked(ax, ay, az, bx, by, bz) {
    var dx = bx - ax, dy = by - ay, dz = bz - az;
    var len = Math.sqrt(dx * dx + dy * dy + dz * dz);
    if (len < 0.001) return false;
    var ux = dx / len, uy = dy / len, uz = dz / len;
    var steps = Math.ceil(len / 0.5);
    for (var s = 1; s < steps; s++) {
      var t = s * 0.5;
      if (_isSolid(ax + ux * t, ay + uy * t, az + uz * t)) return true;
    }
    return false;
  }

  // ── Project 3-D world pos to 2-D screen coords ───────────────
  // Returns { x, y } or null if behind camera
  var _tmpV3 = null;
  function _worldToScreen(wx, wy, wz) {
    if (!_camera) return null;
    if (!_tmpV3) _tmpV3 = new THREE.Vector3();
    _tmpV3.set(wx, wy, wz);
    _tmpV3.project(_camera);
    if (_tmpV3.z > 1) return null; // behind camera
    return {
      x: (_tmpV3.x *  0.5 + 0.5) * window.innerWidth,
      y: (_tmpV3.y * -0.5 + 0.5) * window.innerHeight
    };
  }

  // ── Pool management for "COVER" labels ───────────────────────
  function _acquireLabel() {
    // Reuse hidden label or create new one
    for (var i = 0; i < _coverLabels.length; i++) {
      if (_coverLabels[i].el.style.display === 'none') return _coverLabels[i];
    }
    var obj = { el: null, pos: null };
    var el = document.createElement('div');
    el.style.cssText = 'position:fixed;font-family:monospace;font-size:10px;font-weight:bold;' +
      'pointer-events:none;z-index:4800;transform:translateX(-50%);' +
      'background:rgba(0,0,0,0.55);padding:1px 5px;border-radius:3px;display:none;' +
      'letter-spacing:1px;';
    el.textContent = 'COVER';
    document.body.appendChild(el);
    obj.el = el;
    _coverLabels.push(obj);
    return obj;
  }

  function _hideAllLabels() {
    for (var i = 0; i < _coverLabels.length; i++) {
      _coverLabels[i].el.style.display = 'none';
      _coverLabels[i].pos = null;
    }
  }

  // ── Scan for cover positions in 8 directions ─────────────────
  // Returns array of { x, y, z, dir } of first solid hit per direction
  function _scanCover(px, py, pz) {
    var results = [];
    for (var d = 0; d < DIRS.length; d++) {
      var ddx = DIRS[d][0];
      var ddz = DIRS[d][1];
      // Normalise diagonal length
      var dlen = Math.sqrt(ddx * ddx + ddz * ddz);
      var nx = ddx / dlen;
      var nz = ddz / dlen;
      var t = SCAN_STEP;
      while (t <= SCAN_RANGE) {
        var cx = px + nx * t;
        var cz = pz + nz * t;
        if (_isSolid(cx, py, cz) || _isSolid(cx, py + 1, cz)) {
          // Step back half a unit to get position IN FRONT of block
          var sx = px + nx * (t - SCAN_STEP);
          var sz = pz + nz * (t - SCAN_STEP);
          results.push({ x: sx, y: py, z: sz, dir: d });
          break;
        }
        t += SCAN_STEP;
      }
    }
    return results;
  }

  // ── Rate a cover position against all nearby enemies ─────────
  // Returns { blockedCount, totalCount }
  function _rateCover(cx, cy, cz, enemies) {
    var blocked = 0, total = 0;
    for (var i = 0; i < enemies.length; i++) {
      var e = enemies[i];
      if (!e || !e.alive || !e.mesh) continue;
      var ep = e.mesh.position;
      var dsq = _distSqXZ(cx, cz, ep.x, ep.z);
      if (dsq > ENEMY_RADIUS * ENEMY_RADIUS) continue;
      total++;
      if (_losBlocked(cx, cy + 1, cz, ep.x, ep.y, ep.z)) {
        blocked++;
      }
    }
    return { blocked: blocked, total: total };
  }

  // ── Toast helpers ─────────────────────────────────────────────
  function _showToast(text) {
    if (!_toastEl) return;
    _toastEl.textContent = text;
    _toastEl.style.display = 'block';
    clearTimeout(_toastEl.__hideTimer);
    _toastEl.__hideTimer = setTimeout(function () {
      if (_toastEl) _toastEl.style.display = 'none';
    }, 2500);
  }

  function _hideToast() {
    if (_toastEl) _toastEl.style.display = 'none';
  }

  // ── Auto-sprint-to-cover (Shift+C) ───────────────────────────
  function _startAutoSprint(pos) {
    _sprintTarget = pos;
    window._nearestCoverPos = pos ? new THREE.Vector3(pos.x, pos.y, pos.z) : null;
    if (pos) {
      _showToast('🏃 SPRINTING TO COVER');
    }
  }

  function _keyDown(e) {
    _keysDown[e.key] = true;
    // Shift+C: auto-sprint to nearest excellent cover
    if ((e.key === 'c' || e.key === 'C') && (_keysDown['Shift'] || e.shiftKey)) {
      if (window._nearestCoverPos) {
        _startAutoSprint({
          x: window._nearestCoverPos.x,
          y: window._nearestCoverPos.y,
          z: window._nearestCoverPos.z
        });
      }
    }
  }

  function _keyUp(e) {
    _keysDown[e.key] = false;
  }

  // ── Init ─────────────────────────────────────────────────────
  function init(scene, camera) {
    _camera = camera || null;
    _toastCooldown = 0;
    _sprintTarget  = null;
    _keysDown      = {};
    window._coverQuality    = 'EXPOSED';
    window._nearestCoverPos = null;
    _initDOM();
    document.addEventListener('keydown', _keyDown);
    document.addEventListener('keyup',   _keyUp);
  }

  // ── Update (called every frame) ───────────────────────────────
  function update(dt, playerPos, enemies, camera) {
    if (!dt || dt <= 0) return;
    if (camera) _camera = camera;

    // Cooldown timers
    if (_toastCooldown > 0) _toastCooldown -= dt;

    // ── 1. Gather enemies ──────────────────────────────────────
    var allEnemies = enemies;
    if (!allEnemies) {
      allEnemies = (window.Enemies && window.Enemies.getAll) ? window.Enemies.getAll() : [];
    }

    // Player position
    var px = 0, py = 0, pz = 0;
    if (playerPos) {
      px = playerPos.x || 0;
      py = playerPos.y || 0;
      pz = playerPos.z || 0;
    }

    // ── 2. Filter nearby enemies ───────────────────────────────
    var nearEnemies = [];
    for (var ei = 0; ei < allEnemies.length; ei++) {
      var en = allEnemies[ei];
      if (!en || !en.alive || !en.mesh) continue;
      var ep = en.mesh.position;
      var dsq = _distSqXZ(px, pz, ep.x, ep.z);
      if (dsq <= ENEMY_RADIUS * ENEMY_RADIUS) {
        nearEnemies.push(en);
      }
    }

    // ── 3. Scan for cover blocks ───────────────────────────────
    _hideAllLabels();

    var coverPositions = [];
    var bestExcellent  = null;
    var bestExcellentScore = -1;

    if (nearEnemies.length > 0) {
      coverPositions = _scanCover(px, py, pz);

      // Rate each cover position
      for (var ci = 0; ci < coverPositions.length; ci++) {
        var cp = coverPositions[ci];
        var rating = _rateCover(cp.x, cp.y, cp.z, nearEnemies);
        cp.blocked = rating.blocked;
        cp.total   = rating.total;
        cp.score   = (rating.total > 0) ? (rating.blocked / rating.total) : 0;

        // Show floating "COVER" label projected to screen
        var screenPt = _worldToScreen(cp.x, cp.y + 1.8, cp.z);
        if (screenPt) {
          var lbl = _acquireLabel();
          lbl.pos = cp;
          if (cp.score >= 0.8) {
            lbl.el.style.color  = '#44ff88';
            lbl.el.style.border = '1px solid #44ff88';
          } else {
            lbl.el.style.color  = '#ffcc00';
            lbl.el.style.border = '1px solid #ffcc00';
          }
          lbl.el.style.left    = screenPt.x + 'px';
          lbl.el.style.top     = (screenPt.y - 18) + 'px';
          lbl.el.style.display = 'block';
        }

        // Track best excellent cover
        if (cp.score >= 0.95 && cp.score > bestExcellentScore) {
          bestExcellentScore = cp.score;
          bestExcellent = cp;
        }
      }
    }

    // ── 4. Determine global cover quality ─────────────────────
    var quality = 'EXPOSED';
    var bestOverall = null;
    var bestScore   = -1;

    for (var qi = 0; qi < coverPositions.length; qi++) {
      var qcp = coverPositions[qi];
      if (qcp.score > bestScore) {
        bestScore   = qcp.score;
        bestOverall = qcp;
      }
    }

    if (nearEnemies.length === 0) {
      quality = 'EXPOSED';
    } else if (bestScore >= 0.95) {
      quality = 'EXCELLENT COVER';
    } else if (bestScore >= 0.6) {
      quality = 'GOOD COVER';
    } else if (bestScore >= 0.2) {
      quality = 'PARTIAL COVER';
    } else {
      quality = 'EXPOSED';
    }

    window._coverQuality    = quality;
    window._nearestCoverPos = bestOverall
      ? new THREE.Vector3(bestOverall.x, bestOverall.y, bestOverall.z)
      : null;

    // Update bestExcellent from overall scan if not found above
    if (!bestExcellent && bestOverall && bestOverall.score >= 0.95) {
      bestExcellent = bestOverall;
    }

    // ── 5. Update cover quality HUD ──────────────────────────
    if (!_hudEl) _initDOM();
    if (nearEnemies.length > 0) {
      var colors = {
        'EXCELLENT COVER': '#44ff88',
        'GOOD COVER':      '#88ff44',
        'PARTIAL COVER':   '#ffcc00',
        'EXPOSED':         '#ff4444'
      };
      _hudEl.textContent     = '🛡 ' + quality;
      _hudEl.style.color     = colors[quality] || '#aaa';
      _hudEl.style.border    = '1px solid ' + (colors[quality] || '#aaa');
      _hudEl.style.display   = 'block';
    } else {
      _hudEl.style.display = 'none';
    }

    // ── 6. "TAKE COVER" vocal suggestion ─────────────────────
    var suppressedLevel = window._suppressedLevel || 0;
    if (suppressedLevel > SUPPRESSION_THRESHOLD && _toastCooldown <= 0) {
      _showToast('🛡 TAKE COVER');
      _toastCooldown = TOAST_COOLDOWN;
    }

    // ── 7. PEEK MODE indicator ────────────────────────────────
    var leanOffset = window._leanOffset || 0;
    if (!_peekEl) _initDOM();
    if (leanOffset !== 0 && quality !== 'EXPOSED') {
      _peekEl.textContent   = '👁 PEEK MODE';
      _peekEl.style.display = 'block';
    } else {
      _peekEl.style.display = 'none';
    }

    // ── 8. Auto-sprint-to-cover: move player toward target ───
    if (_sprintTarget && playerPos) {
      var tdx = _sprintTarget.x - px;
      var tdz = _sprintTarget.z - pz;
      var tdist = Math.sqrt(tdx * tdx + tdz * tdz);
      if (tdist < 0.5) {
        // Arrived
        _sprintTarget = null;
        _hideToast();
      } else {
        // Signal sprint direction; game-manager reads window._autoSprintDir
        window._autoSprintDir = { x: tdx / tdist, z: tdz / tdist };
        window._sprinting = true;
      }
    } else {
      if (window._autoSprintDir) {
        window._autoSprintDir = null;
      }
    }
  }

  // ── Reset ─────────────────────────────────────────────────────
  function reset() {
    _toastCooldown = 0;
    _sprintTarget  = null;
    window._coverQuality    = 'EXPOSED';
    window._nearestCoverPos = null;
    _hideAllLabels();
    if (_hudEl)   _hudEl.style.display   = 'none';
    if (_toastEl) _toastEl.style.display = 'none';
    if (_peekEl)  _peekEl.style.display  = 'none';
    window._autoSprintDir = null;
  }

  // ── Public API ────────────────────────────────────────────────
  return {
    init:   init,
    update: update,
    reset:  reset
  };
})();
