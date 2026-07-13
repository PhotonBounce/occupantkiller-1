// capture-points.js — Capture Point Objectives for OccupantKiller
// Stand on circular zones to capture territory.
// Depends on: THREE (global), Enemies, LootDrops, Progression, HUD
// API: CapturePoints.init(scene, camera), .update(delta, playerPos), .spawnPoints(stageOffset),
//      .getCaptured(), .getTotal(), .reset()

window.CapturePoints = (function () {
  'use strict';

  // ── Constants ──────────────────────────────────────────────────────────
  var ZONE_RADIUS        = 2;
  var CAPTURE_TIME       = 5;      // seconds to capture
  var FLASH_HZ           = 2;      // flag flash frequency when contested
  var POINT_NAMES        = ['ALPHA', 'BRAVO', 'CHARLIE'];
  var POINT_POSITIONS    = [
    { x: -15, y: 0, z: -15 },
    { x:  15, y: 0, z:   0 },
    { x:   0, y: 0, z:  15 }
  ];

  // States
  var STATE_ENEMY      = 'ENEMY';
  var STATE_NEUTRAL    = 'NEUTRAL';
  var STATE_CAPTURING  = 'CAPTURING';
  var STATE_CONTESTED  = 'CONTESTED';
  var STATE_CAPTURED   = 'CAPTURED';

  // Colors
  var COLOR_RED        = new THREE.Color(0xff2222);
  var COLOR_YELLOW     = new THREE.Color(0xffcc00);
  var COLOR_GREEN      = new THREE.Color(0x44ff66);
  var COLOR_BLUE       = new THREE.Color(0x2244ff);

  // ── Module state ───────────────────────────────────────────────────────
  var _scene           = null;
  var _camera          = null;
  var _points          = [];   // array of point objects
  var _hudPanel        = null;
  var _time            = 0;
  var _initialized     = false;
  var _stageOffset     = { x: 0, y: 0, z: 0 };

  // ── Internal helpers ───────────────────────────────────────────────────
  function _lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function _lerpColor(out, a, b, t) {
    out.r = _lerp(a.r, b.r, t);
    out.g = _lerp(a.g, b.g, t);
    out.b = _lerp(a.b, b.b, t);
  }

  function _dist2D(a, b) {
    var dx = a.x - b.x;
    var dz = (a.z !== undefined ? a.z : 0) - (b.z !== undefined ? b.z : 0);
    return Math.sqrt(dx * dx + dz * dz);
  }

  // Show a floating banner in the center of the screen
  function _showBanner(text, color, duration) {
    if (typeof document === 'undefined') return;
    var el = document.createElement('div');
    el.style.cssText = [
      'position:fixed',
      'top:22%',
      'left:50%',
      'transform:translateX(-50%)',
      'font-family:monospace',
      'font-size:22px',
      'font-weight:bold',
      'color:' + (color || '#ffd700'),
      'text-shadow:0 0 14px ' + (color || '#ffd700') + ',0 2px 4px #000',
      'pointer-events:none',
      'z-index:500',
      'letter-spacing:3px',
      'white-space:nowrap',
      'opacity:1',
      'transition:opacity 0.4s'
    ].join(';');
    el.textContent = text;
    document.body.appendChild(el);
    var life = (duration || 2500);
    var fadeStart = life - 400;
    var born = Date.now();
    var fade = setInterval(function () {
      var age = Date.now() - born;
      if (age >= fadeStart) {
        el.style.opacity = Math.max(0, 1 - (age - fadeStart) / 400);
      }
      if (age >= life) {
        clearInterval(fade);
        if (el.parentNode) el.parentNode.removeChild(el);
      }
    }, 30);
  }

  // ── HUD panel (top-center capture status) ─────────────────────────────
  function _ensureHUD() {
    if (typeof document === 'undefined') return;
    if (_hudPanel) return;
    _hudPanel = document.createElement('div');
    _hudPanel.id = 'capture-points-hud';
    _hudPanel.style.cssText = [
      'position:fixed',
      'top:54px',
      'left:50%',
      'transform:translateX(-50%)',
      'display:flex',
      'gap:10px',
      'align-items:center',
      'background:rgba(0,0,0,0.55)',
      'border:1px solid rgba(255,255,255,0.2)',
      'border-radius:6px',
      'padding:4px 14px',
      'font-family:monospace',
      'font-size:11px',
      'z-index:210',
      'pointer-events:none',
      'letter-spacing:1px'
    ].join(';');
    document.body.appendChild(_hudPanel);
    _renderHUD();
  }

  function _renderHUD() {
    if (!_hudPanel) return;
    var html = '';
    for (var i = 0; i < _points.length; i++) {
      var pt  = _points[i];
      var dot = (pt.state === STATE_CAPTURED) ? '&#9679;' : '&#9675;';
      var col = (pt.state === STATE_CAPTURED) ? '#4488ff'
              : (pt.state === STATE_ENEMY)    ? '#ff4444'
              : (pt.state === STATE_CONTESTED) ? '#ffcc00'
              : (pt.state === STATE_CAPTURING) ? '#44ff88'
              : '#888888';
      var sub = (pt.state === STATE_CAPTURED)  ? 'CAPTURED'
              : (pt.state === STATE_ENEMY)      ? 'ENEMY'
              : (pt.state === STATE_CONTESTED)  ? 'CONTESTED'
              : (pt.state === STATE_CAPTURING)  ? Math.floor(pt.progress * 100) + '%'
              : 'NEUTRAL';
      html += '<div style="text-align:center;padding:0 6px">'
            + '<span style="color:' + col + ';font-size:14px">' + dot + '</span>'
            + '<div style="color:' + col + '">' + pt.name + '</div>'
            + '<div style="color:#888;font-size:9px">' + sub + '</div>'
            + '</div>';
      if (i < _points.length - 1) html += '<span style="color:#444">|</span>';
    }
    _hudPanel.innerHTML = html;
  }

  // ── Progress bar DOM per point ─────────────────────────────────────────
  function _ensureProgressBar(pt) {
    if (typeof document === 'undefined') return;
    if (pt.progressBar) return;
    var wrapper = document.createElement('div');
    wrapper.style.cssText = [
      'position:fixed',
      'display:none',
      'flex-direction:column',
      'align-items:center',
      'pointer-events:none',
      'z-index:300',
      'font-family:monospace',
      'font-size:10px',
      'color:#fff',
      'text-shadow:0 1px 3px #000'
    ].join(';');
    var bar = document.createElement('div');
    bar.style.cssText = 'width:80px;height:8px;background:rgba(0,0,0,0.6);border:1px solid rgba(255,255,255,0.3);border-radius:4px;overflow:hidden;margin-top:2px';
    var fill = document.createElement('div');
    fill.style.cssText = 'height:100%;width:0%;background:#44ff88;border-radius:4px;transition:width 0.1s,background 0.3s';
    bar.appendChild(fill);
    var label = document.createElement('div');
    label.style.cssText = 'margin-bottom:2px;letter-spacing:1px';
    label.textContent = pt.name;
    wrapper.appendChild(label);
    wrapper.appendChild(bar);
    document.body.appendChild(wrapper);
    pt.progressBar  = wrapper;
    pt.progressFill = fill;
    pt.progressLabel = label;
  }

  function _updateProgressBar(pt, camera) {
    if (!pt.progressBar || !camera || !_scene) return;
    // Only show when player is nearby or capturing
    var visible = (pt.state === STATE_CAPTURING || pt.state === STATE_CONTESTED);
    if (!visible) { pt.progressBar.style.display = 'none'; return; }

    // Project 3D world position (top of flag pole, +2.5 above ground) to 2D screen
    var worldPos = pt.mesh.position.clone();
    worldPos.y += 3.2;
    var projected = worldPos.project(camera);
    var sw = window.innerWidth, sh = window.innerHeight;
    var sx = (projected.x * 0.5 + 0.5) * sw;
    var sy = (-projected.y * 0.5 + 0.5) * sh;

    // Cull if behind camera
    if (projected.z > 1) { pt.progressBar.style.display = 'none'; return; }

    pt.progressBar.style.display  = 'flex';
    pt.progressBar.style.left     = (sx - 40) + 'px';
    pt.progressBar.style.top      = (sy - 28) + 'px';

    // Fill
    var pct = Math.max(0, Math.min(1, pt.progress));
    pt.progressFill.style.width = (pct * 100) + '%';

    // Color: red→yellow→green
    if (pt.state === STATE_CONTESTED) {
      pt.progressFill.style.background = '#ffcc00';
      pt.progressLabel.textContent      = 'CONTESTED';
      pt.progressLabel.style.color      = '#ffcc00';
    } else {
      var barColor = (pct < 0.5)
        ? 'rgb(' + Math.round(_lerp(255, 255, pct * 2)) + ',' + Math.round(_lerp(34, 204, pct * 2)) + ',34)'
        : 'rgb(' + Math.round(_lerp(255, 68, (pct - 0.5) * 2)) + ',' + Math.round(_lerp(204, 255, (pct - 0.5) * 2)) + ',34)';
      pt.progressFill.style.background = barColor;
      pt.progressLabel.textContent     = pt.name;
      pt.progressLabel.style.color     = '#fff';
    }
  }

  // ── Build a single capture point mesh group ────────────────────────────
  function _buildPoint(name, wx, wy, wz) {
    var group = new THREE.Group();
    group.position.set(wx, wy, wz);

    // Ground ring (slowly rotating)
    var ringGeo = new THREE.RingGeometry(1.8, 2, 32);
    var ringMat = new THREE.MeshBasicMaterial({
      color: 0xff4444, side: THREE.DoubleSide, transparent: true, opacity: 0.7
    });
    var ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.02;
    group.add(ring);

    // Flag pole
    var poleGeo = new THREE.CylinderGeometry(0.05, 0.05, 2, 6);
    var poleMat = new THREE.MeshLambertMaterial({ color: 0x888888 });
    var pole = new THREE.Mesh(poleGeo, poleMat);
    pole.position.y = 1;
    group.add(pole);

    // Flag (plane at top of pole)
    var flagGeo  = new THREE.PlaneGeometry(0.6, 0.35);
    var flagMat  = new THREE.MeshLambertMaterial({
      color: 0xff2222, side: THREE.DoubleSide
    });
    var flag = new THREE.Mesh(flagGeo, flagMat);
    flag.position.set(0.32, 2.1, 0);
    group.add(flag);

    _scene.add(group);

    var pt = {
      name:         name,
      mesh:         group,
      ring:         ring,
      ringMat:      ringMat,
      flag:         flag,
      flagMat:      flagMat,
      state:        STATE_ENEMY,
      progress:     0,          // 0=enemy, 1=player captured
      progressBar:  null,
      progressFill: null,
      progressLabel:null,
      worldPos:     { x: wx, y: wy, z: wz },
      // enemy-capture progress (mirrors progress but for enemy re-cap)
      enemyProgress: 0
    };
    return pt;
  }

  // ── Spawn supply crate at position ────────────────────────────────────
  function _spawnSupply(worldPos) {
    if (window.LootDrops && typeof window.LootDrops.spawnLoot === 'function') {
      var pos = new THREE.Vector3(worldPos.x, worldPos.y + 0.5, worldPos.z);
      window.LootDrops.spawnLoot(pos, 'SPECIAL');
      return;
    }
    // Fallback: simple box mesh
    if (!_scene) return;
    var boxGeo = new THREE.BoxGeometry(0.5, 0.5, 0.5);
    var boxMat = new THREE.MeshLambertMaterial({ color: 0x8B6914 });
    var box = new THREE.Mesh(boxGeo, boxMat);
    box.position.set(worldPos.x + 1, worldPos.y + 0.25, worldPos.z + 1);
    _scene.add(box);
    // Auto-remove after 15s
    setTimeout(function () {
      if (_scene) _scene.remove(box);
    }, 15000);
  }

  // ── Reward for capturing a single point ──────────────────────────────
  function _onPointCaptured(pt) {
    // Score
    if (window.GameManager && window.GameManager._player) {
      window.GameManager._player.score += 1000;
      if (window.HUD && window.HUD.setScore) {
        window.HUD.setScore(window.GameManager._player.score);
      }
    }
    // XP
    if (window.Progression && window.Progression.addSeasonXP) {
      window.Progression.addSeasonXP(200);
    }
    _showBanner('POINT CAPTURED! +1000', '#ffd700', 3000);
    _spawnSupply(pt.worldPos);

    // Check if ALL captured
    var allCaptured = true;
    for (var i = 0; i < _points.length; i++) {
      if (_points[i].state !== STATE_CAPTURED) { allCaptured = false; break; }
    }
    if (allCaptured) {
      setTimeout(function () {
        if (window.GameManager && window.GameManager._player) {
          window.GameManager._player.score += 2000;
          if (window.HUD && window.HUD.setScore) {
            window.HUD.setScore(window.GameManager._player.score);
          }
        }
        if (window.Progression && window.Progression.addSeasonXP) {
          window.Progression.addSeasonXP(500);
        }
        _showBanner('FULL MAP CONTROL! +2000', '#ff8800', 4000);
      }, 1200);
    }
  }

  // ── Init ──────────────────────────────────────────────────────────────
  function init(scene, camera) {
    _scene    = scene;
    _camera   = camera || null;
    _points   = [];
    _time     = 0;
    _initialized = true;
    _ensureHUD();
  }

  // ── Spawn points for a level (call after init) ────────────────────────
  function spawnPoints(stageOffsetArg) {
    if (!_initialized || !_scene) return;
    // Remove old points
    reset();

    var off = stageOffsetArg || { x: 0, y: 0, z: 0 };
    _stageOffset = off;

    var count = POINT_NAMES.length; // 3
    for (var i = 0; i < count; i++) {
      var def = POINT_POSITIONS[i];
      var pt  = _buildPoint(
        POINT_NAMES[i],
        def.x + off.x,
        def.y + off.y,
        def.z + off.z
      );
      _ensureProgressBar(pt);
      _points.push(pt);
    }
    _renderHUD();
  }

  // ── Update (called every frame) ───────────────────────────────────────
  function update(delta, playerPos) {
    if (!_initialized || !_scene) return;
    _time += delta;

    var playerP = playerPos || { x: 0, y: 0, z: 0 };
    var enemies = (window.Enemies && typeof window.Enemies.getAll === 'function')
      ? window.Enemies.getAll() : [];

    var hudDirty = false;

    for (var i = 0; i < _points.length; i++) {
      var pt = _points[i];

      // ── Ring slow rotation ───────────────────────────────
      pt.ring.rotation.z += delta * 0.4;

      // ── Determine occupants ──────────────────────────────
      var playerIn = (_dist2D(playerP, pt.worldPos) < ZONE_RADIUS);
      var enemyIn  = false;
      for (var ei = 0; ei < enemies.length; ei++) {
        var en = enemies[ei];
        if (!en || en.dead || en.hp <= 0 || !en.alive || !en.mesh) continue;
        if (_dist2D(en.mesh.position, pt.worldPos) < ZONE_RADIUS) {
          enemyIn = true;
          break;
        }
      }

      // ── Enemy patrol interest (20% chance per enemy, once per ~5s) ──
      if (Math.random() < 0.0004 * enemies.length) { // spread over frames
        for (var ej = 0; ej < enemies.length; ej++) {
          var enj = enemies[ej];
          if (!enj || enj.dead || !enj.alive || !enj.mesh) continue;
          if (Math.random() < 0.20) {
            // Signal patrol target (enemies.js may pick this up if it supports _patrolTarget)
            if (enj._patrolTarget === undefined || Math.random() < 0.3) {
              enj._patrolTarget = new THREE.Vector3(pt.worldPos.x, pt.worldPos.y, pt.worldPos.z);
            }
          }
        }
      }

      // ── State machine ────────────────────────────────────
      var prevState = pt.state;

      if (playerIn && enemyIn) {
        pt.state = STATE_CONTESTED;
        // No progress change
      } else if (playerIn && !enemyIn) {
        if (pt.state !== STATE_CAPTURED) {
          pt.state    = STATE_CAPTURING;
          pt.progress = Math.min(1, pt.progress + delta / CAPTURE_TIME);
          if (pt.progress >= 1) {
            pt.progress = 1;
            pt.state    = STATE_CAPTURED;
          }
        }
        pt.enemyProgress = 0;
      } else if (!playerIn && enemyIn) {
        if (pt.state !== STATE_ENEMY) {
          pt.state = STATE_CAPTURING; // enemy recapturing — progress falls
          pt.progress = Math.max(0, pt.progress - delta / CAPTURE_TIME);
          if (pt.progress <= 0) {
            pt.progress = 0;
            pt.state    = STATE_ENEMY;
          }
        }
        pt.enemyProgress = 0;
      } else {
        // Nobody in zone
        if (pt.state === STATE_CONTESTED || pt.state === STATE_CAPTURING) {
          // Progress freezes; if previously capturing, stay at progress
          pt.state = (pt.progress >= 1) ? STATE_CAPTURED
                   : (pt.progress <= 0) ? STATE_ENEMY
                   : STATE_NEUTRAL;
        }
        pt.enemyProgress = 0;
      }

      // Fire capture event
      if (prevState !== STATE_CAPTURED && pt.state === STATE_CAPTURED) {
        _onPointCaptured(pt);
      }

      // ── Flag colour & animation ───────────────────────────
      var targetColor;
      if (pt.state === STATE_CAPTURED) {
        targetColor = COLOR_BLUE;
      } else if (pt.state === STATE_CAPTURING) {
        targetColor = COLOR_GREEN;
      } else if (pt.state === STATE_CONTESTED) {
        targetColor = COLOR_YELLOW;
      } else {
        targetColor = COLOR_RED;
      }

      // Lerp flag mat color toward target
      var lerpRate = delta * 2.0;
      var c = pt.flagMat.color;
      c.r = _lerp(c.r, targetColor.r, lerpRate);
      c.g = _lerp(c.g, targetColor.g, lerpRate);
      c.b = _lerp(c.b, targetColor.b, lerpRate);
      pt.flagMat.needsUpdate = true;

      // Contested: flash at 2 Hz (alternate red/yellow)
      if (pt.state === STATE_CONTESTED) {
        var flash = (Math.floor(_time * FLASH_HZ * 2) % 2 === 0);
        pt.flagMat.color.copy(flash ? COLOR_YELLOW : COLOR_RED);
      }

      // Captured: gentle wave (sin on Y rotation)
      if (pt.state === STATE_CAPTURED) {
        pt.flag.rotation.y = Math.sin(_time * 3.0) * 0.25;
      }

      // Ring color mirrors flag
      pt.ringMat.color.copy(pt.flagMat.color);
      pt.ringMat.needsUpdate = true;

      // Progress bar (3D→2D)
      _updateProgressBar(pt, _camera);

      if (prevState !== pt.state) hudDirty = true;
    }

    if (hudDirty) _renderHUD();
  }

  // ── Public accessors ──────────────────────────────────────────────────
  function getCaptured() {
    var n = 0;
    for (var i = 0; i < _points.length; i++) {
      if (_points[i].state === STATE_CAPTURED) n++;
    }
    return n;
  }

  function getTotal() {
    return _points.length;
  }

  // ── Reset ─────────────────────────────────────────────────────────────
  function reset() {
    for (var i = 0; i < _points.length; i++) {
      var pt = _points[i];
      if (_scene && pt.mesh) _scene.remove(pt.mesh);
      if (pt.progressBar && pt.progressBar.parentNode) {
        pt.progressBar.parentNode.removeChild(pt.progressBar);
      }
    }
    _points = [];
    if (_hudPanel) _hudPanel.innerHTML = '';
  }

  // ── Public API ────────────────────────────────────────────────────────
  return {
    init:        init,
    update:      update,
    spawnPoints: spawnPoints,
    getCaptured: getCaptured,
    getTotal:    getTotal,
    reset:       reset
  };

})();
