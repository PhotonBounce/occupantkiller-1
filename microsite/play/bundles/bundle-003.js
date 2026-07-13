/* === grenade-selector.js === */
try {
;
// grenade-selector.js — Tactical Grenade Selector
// Hold G (>0.3s) to open radial wheel, mouse to select, release to confirm.
// Tap G = throw currently selected type (existing behavior preserved).

window.GrenadeSelector = (function() {

  // ── Grenade type definitions ────────────────────────────────────────────────
  var GRENADE_TYPES = [
    { key: 'FRAG',     icon: '💥', label: 'FRAG',     angle: 270, defaultCount: 3 },
    { key: 'SMOKE',    icon: '💨', label: 'SMOKE',    angle: 330, defaultCount: 2 },
    { key: 'FLASH',    icon: '⚡', label: 'FLASH',    angle:  30, defaultCount: 2 },
    { key: 'THERMITE', icon: '🔥', label: 'THERMITE', angle:  90, defaultCount: 1 },
    { key: 'STUN',     icon: '🌀', label: 'STUN',     angle: 150, defaultCount: 2 },
    { key: 'SPIKE',    icon: '📌', label: 'SPIKE',    angle: 210, defaultCount: 2 }
  ];

  // ── State ───────────────────────────────────────────────────────────────────
  var _counts = { FRAG: 3, SMOKE: 2, FLASH: 2, THERMITE: 1, STUN: 2, SPIKE: 2 };
  var _selectedType = 'FRAG';
  var _wheelOpen = false;

  // G-key hold tracking (managed externally via keydown/keyup hooks)
  var _gHeld = false;
  var _gHoldStart = 0;
  var _gHoldThreshold = 0.3; // seconds

  // Three.js references
  var _scene = null;
  var _camera = null;
  var _enemies = null; // array or iterator

  // DOM elements
  var _wheelEl = null;
  var _hudEl = null;
  var _segmentEls = []; // div per grenade type
  var _centerLabel = null;

  // Mouse position for wheel selection
  var _mouseX = 0;
  var _mouseY = 0;
  var _hoveredIdx = -1;

  // Active effects (for cleanup)
  var _activeEffects = [];

  // ── Init ────────────────────────────────────────────────────────────────────
  function init(scene, camera, enemyIteratorOrArray) {
    _scene = scene;
    _camera = camera;
    _enemies = enemyIteratorOrArray || null;

    window._selectedGrenadeType = _selectedType;
    window._grenadeWheelOpen = false;

    _createHUD();
    _updateHUD();
    _bindEvents();
  }

  // ── HUD (always-visible grenade indicator) ──────────────────────────────────
  function _createHUD() {
    if (_hudEl) {
      if (_hudEl.parentNode) _hudEl.parentNode.removeChild(_hudEl);
      _hudEl = null;
    }
    _hudEl = document.createElement('div');
    _hudEl.id = 'grenade-selector-hud';
    _hudEl.style.cssText = [
      'position:fixed',
      'bottom:52px',
      'left:50%',
      'transform:translateX(-50%)',
      'display:flex',
      'gap:6px',
      'align-items:center',
      'z-index:300',
      'pointer-events:none',
      'font-family:monospace',
      'font-size:12px',
      'padding:4px 8px',
      'background:rgba(0,0,0,0.45)',
      'border-radius:6px',
      'border:1px solid rgba(255,255,255,0.08)'
    ].join(';');
    document.body.appendChild(_hudEl);
  }

  function _updateHUD() {
    if (!_hudEl) return;
    var html = '';
    for (var i = 0; i < GRENADE_TYPES.length; i++) {
      var gt = GRENADE_TYPES[i];
      var isSelected = (gt.key === _selectedType);
      var cnt = _counts[gt.key] || 0;
      var col = isSelected ? '#ffcc00' : (cnt > 0 ? '#aaa' : '#444');
      var weight = isSelected ? 'bold' : 'normal';
      var border = isSelected ? 'border-bottom:2px solid #ffcc00;' : '';
      html += '<span style="color:' + col + ';font-weight:' + weight + ';' + border + 'padding:0 2px" title="' + gt.label + '">' +
              gt.icon + '×' + cnt + '</span>';
    }
    html += '<span style="color:#888;margin-left:4px;font-size:10px">[hold G]</span>';
    _hudEl.innerHTML = html;
  }

  // ── Radial wheel DOM ────────────────────────────────────────────────────────
  var _WHEEL_R  = 80;  // radius from center to segment midpoint (px)
  var _WHEEL_DIAM = 220;

  function _openWheel() {
    if (_wheelEl) _closeWheel();
    _wheelOpen = true;
    window._grenadeWheelOpen = true;

    _wheelEl = document.createElement('div');
    _wheelEl.id = 'grenadeWheel';
    _wheelEl.style.cssText = [
      'position:fixed',
      'left:50%',
      'top:50%',
      'transform:translate(-50%,-50%)',
      'width:' + _WHEEL_DIAM + 'px',
      'height:' + _WHEEL_DIAM + 'px',
      'border-radius:50%',
      'background:rgba(10,10,10,0.82)',
      'border:2px solid rgba(255,255,255,0.12)',
      'z-index:2000',
      'pointer-events:none',
      'box-shadow:0 0 32px rgba(0,0,0,0.7)',
      'transition:opacity 0.12s'
    ].join(';');

    _segmentEls = [];
    for (var i = 0; i < GRENADE_TYPES.length; i++) {
      var gt = GRENADE_TYPES[i];
      var rad = (gt.angle - 90) * Math.PI / 180; // css: 0deg = up
      var cx = _WHEEL_DIAM / 2 + Math.cos(rad) * _WHEEL_R;
      var cy = _WHEEL_DIAM / 2 + Math.sin(rad) * _WHEEL_R;
      var SEG_W = 60, SEG_H = 52;
      var seg = document.createElement('div');
      seg.className = 'grenade-segment';
      seg.setAttribute('data-key', gt.key);
      seg.style.cssText = [
        'position:absolute',
        'width:' + SEG_W + 'px',
        'height:' + SEG_H + 'px',
        'left:' + (cx - SEG_W / 2) + 'px',
        'top:'  + (cy - SEG_H / 2) + 'px',
        'border-radius:8px',
        'border:2px solid rgba(255,255,255,0.12)',
        'background:rgba(30,30,30,0.7)',
        'display:flex',
        'flex-direction:column',
        'align-items:center',
        'justify-content:center',
        'font-family:monospace',
        'transition:background 0.08s,border-color 0.08s'
      ].join(';');
      var cnt = _counts[gt.key] || 0;
      seg.innerHTML = '<div style="font-size:20px;line-height:1">' + gt.icon + '</div>' +
                      '<div style="font-size:9px;color:#ccc;margin-top:2px">' + gt.label + '</div>' +
                      '<div style="font-size:9px;color:#888">×' + cnt + '</div>';
      _wheelEl.appendChild(seg);
      _segmentEls.push(seg);
    }

    // Center label
    _centerLabel = document.createElement('div');
    _centerLabel.style.cssText = [
      'position:absolute',
      'left:50%',
      'top:50%',
      'transform:translate(-50%,-50%)',
      'text-align:center',
      'font-family:monospace',
      'pointer-events:none'
    ].join(';');
    _wheelEl.appendChild(_centerLabel);
    _updateCenterLabel(_selectedType);

    document.body.appendChild(_wheelEl);
    _updateWheelSelection();
  }

  function _closeWheel() {
    if (_wheelEl && _wheelEl.parentNode) {
      _wheelEl.parentNode.removeChild(_wheelEl);
    }
    _wheelEl = null;
    _centerLabel = null;
    _segmentEls = [];
    _wheelOpen = false;
    window._grenadeWheelOpen = false;
  }

  function _updateCenterLabel(typeKey) {
    if (!_centerLabel) return;
    var gt = _getTypeDef(typeKey);
    var cnt = gt ? (_counts[typeKey] || 0) : 0;
    var label = gt ? gt.label : typeKey;
    var icon  = gt ? gt.icon  : '';
    _centerLabel.innerHTML =
      '<div style="font-size:22px">' + icon + '</div>' +
      '<div style="font-size:11px;color:#ffcc00;font-weight:bold;margin-top:2px">' + label + '</div>' +
      '<div style="font-size:10px;color:#aaa">×' + cnt + '</div>';
  }

  function _getTypeDef(key) {
    for (var i = 0; i < GRENADE_TYPES.length; i++) {
      if (GRENADE_TYPES[i].key === key) return GRENADE_TYPES[i];
    }
    return null;
  }

  // Update which segment is highlighted based on mouse position
  function _updateWheelSelection() {
    if (!_wheelEl) return;

    var rect = _wheelEl.getBoundingClientRect();
    var cx = rect.left + rect.width  / 2;
    var cy = rect.top  + rect.height / 2;
    var dx = _mouseX - cx;
    var dy = _mouseY - cy;
    var dist = Math.sqrt(dx * dx + dy * dy);

    var newIdx = -1;
    if (dist > 18) { // dead-zone at center
      // angle in degrees, 0 = right, going clockwise
      var angleDeg = Math.atan2(dy, dx) * 180 / Math.PI;
      if (angleDeg < 0) angleDeg += 360;

      // Find closest segment by angular distance
      var best = 9999;
      for (var i = 0; i < GRENADE_TYPES.length; i++) {
        // Map gt.angle: 270 = up, which is atan2 = -90 (= 270 after +360)
        // gt.angle is bearing where 0=right, 90=down, 180=left, 270=up
        // We need same convention as atan2
        var segAngle = GRENADE_TYPES[i].angle;
        var diff = Math.abs(angleDeg - segAngle);
        if (diff > 180) diff = 360 - diff;
        if (diff < best) { best = diff; newIdx = i; }
      }
    }

    _hoveredIdx = newIdx;

    // Style segments
    for (var si = 0; si < _segmentEls.length; si++) {
      var el = _segmentEls[si];
      if (si === newIdx) {
        el.style.background = 'rgba(255,200,0,0.3)';
        el.style.borderColor = '#ffcc00';
        el.style.color = '#ffcc00';
      } else {
        el.style.background = 'rgba(30,30,30,0.7)';
        el.style.borderColor = 'rgba(255,255,255,0.12)';
        el.style.color = '';
      }
    }

    if (newIdx >= 0) {
      _updateCenterLabel(GRENADE_TYPES[newIdx].key);
    } else {
      _updateCenterLabel(_selectedType);
    }
  }

  // ── Key / mouse event binding ───────────────────────────────────────────────
  function _bindEvents() {
    document.addEventListener('mousemove', function(e) {
      _mouseX = e.clientX;
      _mouseY = e.clientY;
      if (_wheelOpen) _updateWheelSelection();
    });

    document.addEventListener('keydown', function(e) {
      if (e.code !== 'KeyG') return;
      if (e.repeat) return;
      if (e.shiftKey || e.ctrlKey || e.altKey) return; // let other combos through
      _gHeld = true;
      _gHoldStart = performance.now();
    });

    document.addEventListener('keyup', function(e) {
      if (e.code !== 'KeyG') return;
      if (!_gHeld) return;
      _gHeld = false;
      var held = (performance.now() - _gHoldStart) / 1000;
      if (_wheelOpen) {
        // Confirm selection from wheel
        if (_hoveredIdx >= 0) {
          _selectedType = GRENADE_TYPES[_hoveredIdx].key;
          window._selectedGrenadeType = _selectedType;
          _updateHUD();
        }
        _closeWheel();
      } else if (held < _gHoldThreshold) {
        // Tap: throw current type
        _throwGrenade();
      }
      // If held >= threshold but wheel never opened (rare timing edge), still close
    });
  }

  // ── Update (call each frame) ─────────────────────────────────────────────────
  function update(delta) {
    if (!delta) delta = 0.016;

    // Open wheel if G is held long enough
    if (_gHeld && !_wheelOpen) {
      var held = (performance.now() - _gHoldStart) / 1000;
      if (held >= _gHoldThreshold) {
        _openWheel();
      }
    }

    // Update active effects
    var now = performance.now();
    for (var i = _activeEffects.length - 1; i >= 0; i--) {
      var fx = _activeEffects[i];
      if (fx.done) { _activeEffects.splice(i, 1); continue; }
      if (fx.update) fx.update(delta, now);
    }
  }

  // ── Grenade throw logic ─────────────────────────────────────────────────────
  function _throwGrenade() {
    var type = _selectedType;
    var cnt = _counts[type] || 0;
    if (cnt <= 0) {
      if (window.HUD && HUD.showToast) HUD.showToast('No ' + type + ' grenades!');
      if (window.HUD && HUD.notifyPickup) HUD.notifyPickup('🚫 NO ' + type + ' GRENADES', '#ff6600');
      return;
    }
    _counts[type] = Math.max(0, cnt - 1);
    window._selectedGrenadeType = type;
    _updateHUD();

    var origin = null;
    var fwd = null;
    if (_camera && window.THREE) {
      origin = (_camera.position) ? _camera.position.clone() : new THREE.Vector3();
      fwd = new THREE.Vector3(0, 0, -1);
      fwd.applyQuaternion(_camera.quaternion);
    }
    var landPos = origin ? new THREE.Vector3(
      origin.x + fwd.x * 12,
      0.1,
      origin.z + fwd.z * 12
    ) : new THREE.Vector3(0, 0.1, 0);

    if      (type === 'FRAG')     _effectFrag(landPos);
    else if (type === 'SMOKE')    _effectSmoke(landPos);
    else if (type === 'FLASH')    _effectFlash();
    else if (type === 'THERMITE') _effectThermite(landPos);
    else if (type === 'STUN')     _effectStun(landPos);
    else if (type === 'SPIKE')    _effectSpike(origin, fwd);

    if (window.HUD && HUD.notifyPickup) {
      var gt = _getTypeDef(type);
      HUD.notifyPickup((gt ? gt.icon : '') + ' ' + type + ' OUT (×' + _counts[type] + ' left)', '#ffaa00');
    }
  }

  // ── Effect: FRAG ────────────────────────────────────────────────────────────
  function _effectFrag(pos) {
    if (!_scene || !window.THREE) return;
    // Orange explosion sphere, shrinks and fades
    var geo = new THREE.SphereGeometry(0.8, 8, 6);
    var mat = new THREE.MeshBasicMaterial({ color: 0xff6600, transparent: true, opacity: 0.9 });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(pos);
    _scene.add(mesh);

    // Inner bright core
    var cGeo = new THREE.SphereGeometry(0.4, 6, 4);
    var cMat = new THREE.MeshBasicMaterial({ color: 0xffff00, transparent: true, opacity: 1.0 });
    var core = new THREE.Mesh(cGeo, cMat);
    mesh.add(core);

    // Damage enemies in radius
    _damageEnemiesInRadius(pos, 6.5, 110);

    if (window.AudioSystem && AudioSystem.playExplosion) {
      try { AudioSystem.playExplosion(); } catch(e) {}
    }
    if (window.CameraSystem && CameraSystem.shake) {
      try { CameraSystem.shake(0.35, 0.4); } catch(e) {}
    }
    if (window.Tracers && Tracers.spawnExplosion) {
      try { Tracers.spawnExplosion(pos, 2.2); } catch(e) {}
    }

    var startTime = performance.now();
    var dur = 800;
    _activeEffects.push({
      done: false,
      update: function(delta, now) {
        var t = Math.min((now - startTime) / dur, 1);
        var scale = 1 + t * 3;
        mesh.scale.setScalar(scale);
        mat.opacity = 0.9 * (1 - t);
        cMat.opacity = 1 - t;
        if (t >= 1) {
          _scene.remove(mesh);
          geo.dispose(); mat.dispose(); cGeo.dispose(); cMat.dispose();
          this.done = true;
        }
      }
    });
  }

  // ── Effect: SMOKE ────────────────────────────────────────────────────────────
  function _effectSmoke(pos) {
    if (!_scene || !window.THREE) return;
    var group = new THREE.Group();
    group.position.copy(pos);
    _scene.add(group);

    var spheres = [];
    var colors = [0xaaaaaa, 0x888888, 0x999999, 0xbbbbbb, 0x777777];
    for (var i = 0; i < 10; i++) {
      var geo = new THREE.SphereGeometry(0.3, 6, 5);
      var mat = new THREE.MeshBasicMaterial({ color: colors[i % colors.length], transparent: true, opacity: 0.55, depthWrite: false });
      var mesh = new THREE.Mesh(geo, mat);
      mesh.position.set((Math.random()-0.5)*2.5, Math.random()*1.5, (Math.random()-0.5)*2.5);
      mesh._drift = new THREE.Vector3((Math.random()-0.5)*0.15, (Math.random()-0.5)*0.05, (Math.random()-0.5)*0.15);
      group.add(mesh);
      spheres.push(mesh);
    }

    var startTime = performance.now();
    var GROW_DUR = 1000;
    var ACTIVE_DUR = 20000;
    var FADE_DUR = 3000;

    _activeEffects.push({
      done: false,
      update: function(delta, now) {
        var elapsed = now - startTime;
        if (elapsed < GROW_DUR) {
          var t = elapsed / GROW_DUR;
          group.scale.setScalar(t * 0.9 + 0.1);
        } else if (elapsed < GROW_DUR + ACTIVE_DUR) {
          group.scale.setScalar(1.0);
          // drift
          for (var si = 0; si < spheres.length; si++) {
            spheres[si].position.addScaledVector(spheres[si]._drift, delta);
          }
          // Check player inside smoke
          if (window.player && group) {
            var pdx = window.player.position.x - group.position.x;
            var pdz = window.player.position.z - group.position.z;
            if (Math.sqrt(pdx*pdx+pdz*pdz) < 5) window._smokeObstructed = true;
          }
        } else {
          var ft = Math.min((elapsed - GROW_DUR - ACTIVE_DUR) / FADE_DUR, 1);
          var op = 0.55 * (1 - ft);
          for (var fi = 0; fi < spheres.length; fi++) spheres[fi].material.opacity = op;
          if (ft >= 1) {
            _scene.remove(group);
            this.done = true;
          }
        }
      }
    });
  }

  // ── Effect: FLASH ────────────────────────────────────────────────────────────
  function _effectFlash() {
    window._flashbanged = true;
    setTimeout(function() { window._flashbanged = false; }, 3000);

    var overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:#fff;opacity:0.95;pointer-events:none;z-index:9990;transition:opacity 2.5s ease-out';
    document.body.appendChild(overlay);

    // Brief hold then fade
    setTimeout(function() {
      overlay.style.opacity = '0';
      setTimeout(function() { if (overlay.parentNode) overlay.parentNode.removeChild(overlay); }, 2600);
    }, 500);

    // Stun nearby enemies
    _stunEnemiesFlash(8, 3000);

    if (window.AudioSystem && AudioSystem.playFlashbang) {
      try { AudioSystem.playFlashbang(); } catch(e) {}
    }
  }

  // ── Effect: THERMITE ─────────────────────────────────────────────────────────
  function _effectThermite(pos) {
    if (!_scene || !window.THREE) return;
    var group = new THREE.Group();
    group.position.copy(pos);
    _scene.add(group);

    // Core flame mesh
    var coreGeo = new THREE.SphereGeometry(0.35, 8, 6);
    var coreMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    var core = new THREE.Mesh(coreGeo, coreMat);
    group.add(core);

    // Outer orange halo
    var hGeo = new THREE.SphereGeometry(0.8, 8, 6);
    var hMat = new THREE.MeshBasicMaterial({ color: 0xff6600, transparent: true, opacity: 0.75, depthWrite: false });
    var halo = new THREE.Mesh(hGeo, hMat);
    group.add(halo);

    var startTime = performance.now();
    var BURN_DUR = 5000;
    var lastDmgTick = startTime;

    _activeEffects.push({
      done: false,
      update: function(delta, now) {
        var elapsed = now - startTime;
        var flicker = 0.8 + Math.sin(now * 0.02) * 0.2;
        halo.scale.setScalar(flicker);
        core.scale.setScalar(flicker * 0.7);
        hMat.opacity = 0.6 + Math.sin(now * 0.03) * 0.15;

        // Damage tick every second
        if (now - lastDmgTick >= 1000) {
          lastDmgTick = now;
          _damageEnemiesInRadius(group.position, 2, 30);
        }

        if (elapsed >= BURN_DUR) {
          _scene.remove(group);
          coreGeo.dispose(); coreMat.dispose(); hGeo.dispose(); hMat.dispose();
          this.done = true;
        }
      }
    });
  }

  // ── Effect: STUN ─────────────────────────────────────────────────────────────
  function _effectStun(pos) {
    window._enemySuppressed = true;
    setTimeout(function() { window._enemySuppressed = false; }, 4000);

    // Suppress enemies speed in radius
    _stunEnemiesSpeed(6, 4000, 0.5);

    if (!_scene || !window.THREE) return;
    // Expanding shockwave ring
    var ringGeo = new THREE.RingGeometry(0.1, 0.5, 24);
    var ringMat = new THREE.MeshBasicMaterial({ color: 0x8888ff, transparent: true, opacity: 0.8, side: THREE.DoubleSide });
    var ring = new THREE.Mesh(ringGeo, ringMat);
    ring.position.copy(pos);
    ring.position.y += 0.05;
    ring.rotation.x = -Math.PI / 2;
    _scene.add(ring);

    var startTime = performance.now();
    var DUR = 800;
    _activeEffects.push({
      done: false,
      update: function(delta, now) {
        var t = Math.min((now - startTime) / DUR, 1);
        ring.scale.setScalar(1 + t * 8);
        ringMat.opacity = 0.8 * (1 - t);
        if (t >= 1) {
          _scene.remove(ring);
          ringGeo.dispose(); ringMat.dispose();
          this.done = true;
        }
      }
    });
  }

  // ── Effect: SPIKE ─────────────────────────────────────────────────────────────
  function _effectSpike(origin, fwd) {
    if (!_scene || !window.THREE) return;
    if (!origin) origin = new THREE.Vector3();
    if (!fwd)    fwd    = new THREE.Vector3(0, 0, -1);

    // Small spike mesh (cyan cone-ish)
    var geo = new THREE.ConeGeometry(0.12, 0.4, 6);
    var mat = new THREE.MeshLambertMaterial({ color: 0x00ccff });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(origin);

    var vel = new THREE.Vector3(fwd.x * 22, 5 + fwd.y * 10, fwd.z * 22);
    _scene.add(mesh);

    var GRAVITY = 18;
    var attached = false;
    var attachedEnemy = null;
    var fuse = 4.0; // explodes if not attached in 4s

    _activeEffects.push({
      done: false,
      update: function(delta, now) {
        if (attached) {
          // Move with enemy
          if (attachedEnemy) {
            var epos = attachedEnemy.mesh ? attachedEnemy.mesh.position : attachedEnemy.position;
            if (epos) mesh.position.copy(epos);
          }
          fuse -= delta;
          if (fuse <= 0) {
            _effectFrag(mesh.position.clone());
            _scene.remove(mesh); geo.dispose(); mat.dispose();
            this.done = true;
          }
          return;
        }

        // Physics
        vel.y -= GRAVITY * delta;
        mesh.position.addScaledVector(vel, delta);
        if (mesh.position.y <= 0.1) { mesh.position.y = 0.1; vel.set(0,0,0); }
        mesh.rotation.z += 8 * delta;

        fuse -= delta;

        // Check enemy collision
        var hit = _checkEnemyHit(mesh.position, 1.2);
        if (hit) {
          attached = true;
          attachedEnemy = hit;
          fuse = 2.5; // short fuse once attached
          return;
        }

        if (fuse <= 0) {
          _effectFrag(mesh.position.clone());
          _scene.remove(mesh); geo.dispose(); mat.dispose();
          this.done = true;
        }
      }
    });
  }

  // ── Helpers ──────────────────────────────────────────────────────────────────
  function _getEnemyList() {
    if (!_enemies) {
      // Try globals
      if (window.Enemies && Enemies.getAll) return Enemies.getAll();
      return [];
    }
    if (typeof _enemies === 'function') {
      // Iterator pattern: collect into array
      var list = [];
      _enemies(function(e) { if (e) list.push(e); });
      return list;
    }
    return _enemies;
  }

  function _damageEnemiesInRadius(pos, radius, damage) {
    if (window.Enemies && Enemies.damageInRadius) {
      try { Enemies.damageInRadius(pos, radius, damage); } catch(e) {}
      return;
    }
    var list = _getEnemyList();
    for (var i = 0; i < list.length; i++) {
      var en = list[i];
      if (!en || en.dead) continue;
      var epos = (en.mesh && en.mesh.position) ? en.mesh.position : en.position;
      if (!epos) continue;
      var dx = epos.x - pos.x, dz = epos.z - pos.z;
      var dist = Math.sqrt(dx*dx + dz*dz);
      if (dist <= radius) {
        if (en.health !== undefined) en.health -= damage;
        if (en.hp    !== undefined) en.hp    -= damage;
      }
    }
  }

  function _stunEnemiesFlash(radius, duration) {
    var now = performance.now();
    var list = _getEnemyList();
    for (var i = 0; i < list.length; i++) {
      var en = list[i];
      if (!en || en.dead) continue;
      var epos = (en.mesh && en.mesh.position) ? en.mesh.position : en.position;
      if (!epos) continue;
      var dx = epos.x, dz = epos.z;
      // Approximate: stun all enemies within radius around camera
      if (window._camera) { dx -= window._camera.position.x; dz -= window._camera.position.z; }
      if (Math.sqrt(dx*dx+dz*dz) <= radius) {
        en._flashStunned = true;
        en._flashStunnedUntil = now + duration;
      }
    }
  }

  function _stunEnemiesSpeed(radius, duration, factor) {
    var now = performance.now();
    var list = _getEnemyList();
    var camPos = (_camera && _camera.position) ? _camera.position : { x: 0, z: 0 };
    for (var i = 0; i < list.length; i++) {
      var en = list[i];
      if (!en || en.dead) continue;
      var epos = (en.mesh && en.mesh.position) ? en.mesh.position : en.position;
      if (!epos) continue;
      var dx = epos.x - camPos.x, dz = epos.z - camPos.z;
      if (Math.sqrt(dx*dx+dz*dz) <= radius) {
        en._stunned = true;
        en._stunnedUntil = now + duration;
        en._speedFactor = factor;
        // Auto-clear
        (function(enemy) {
          setTimeout(function() {
            enemy._stunned = false;
            enemy._speedFactor = 1;
          }, duration);
        }(en));
      }
    }
  }

  function _checkEnemyHit(pos, radius) {
    var list = _getEnemyList();
    for (var i = 0; i < list.length; i++) {
      var en = list[i];
      if (!en || en.dead) continue;
      var epos = (en.mesh && en.mesh.position) ? en.mesh.position : en.position;
      if (!epos) continue;
      var dx = epos.x - pos.x, dy = (epos.y || 0) - pos.y, dz = epos.z - pos.z;
      if (Math.sqrt(dx*dx+dy*dy+dz*dz) <= radius) return en;
    }
    return null;
  }

  // ── Public API ───────────────────────────────────────────────────────────────
  function getSelectedType() {
    return _selectedType;
  }

  function getCount(type) {
    return _counts[type || _selectedType] || 0;
  }

  function useGrenade(type) {
    var t = type || _selectedType;
    if (_counts[t] > 0) { _counts[t]--; _updateHUD(); }
  }

  function reset() {
    _counts = { FRAG: 3, SMOKE: 2, FLASH: 2, THERMITE: 1, STUN: 2, SPIKE: 2 };
    _selectedType = 'FRAG';
    window._selectedGrenadeType = 'FRAG';
    _updateHUD();
    if (_wheelOpen) _closeWheel();
  }

  return {
    init:            init,
    update:          update,
    getSelectedType: getSelectedType,
    getCount:        getCount,
    useGrenade:      useGrenade,
    reset:           reset
  };

})();

;
} catch(_e){ if(window.console&&console.warn)console.warn("mod fail grenade-selector.js",_e&&_e.message); }
/* === combo-system.js === */
try {
;
// combo-system.js — Combo Kill Multiplier for rapid-kill score bonuses
// Ukraine conflict FPS — Three.js browser game
// IIFE pattern, all var (no let/const)

window.ComboSystem = (function () {

  // ─── Private state ────────────────────────────────────────────────────────
  var _comboCount     = 0;     // kills in current combo (supports +1.5 for headshots)
  var _multiplier     = 1.0;
  var _timer          = 0;     // seconds since last kill
  var _timerMax       = 4.0;   // combo window in seconds
  var _lastTier       = 0;     // tier index active last frame
  var _active         = false; // is combo currently live?
  var _labelFlashEl   = null;  // DOM element for tier label
  var _labelFlashTime = 0;
  var _hudEl          = null;  // outer HUD container
  var _multEl         = null;  // multiplier text
  var _barFillEl      = null;  // progress bar fill
  var _timerTextEl    = null;  // timer seconds text
  var _timerBarEl     = null;  // bar container
  var _lostEl         = null;  // "COMBO LOST" overlay text
  var _lostTimer      = 0;

  // Rapid-event tracking
  var _killTimestamps = [];    // absolute timestamps of kills (ms)

  // Session best
  var _bestCombo      = 0;
  var _bestComboEver  = 0;
  var _LS_KEY         = 'okk_best_combo_v1';

  // Special event flags
  var _blitzShown     = false;  // "BLITZ!" shown for this combo burst
  var _slaughterShown = false;  // "SLAUGHTER!" shown for this combo burst
  var _backInAction   = false;  // show "BACK IN ACTION" on next kill after break

  // AudioContext for ascending tones
  var _audioCtx       = null;

  // ─── Combo tiers ─────────────────────────────────────────────────────────
  // Each tier: { minCount, multiplier, label }
  var TIERS = [
    { minCount: 20, multiplier: 10,  label: 'GODLIKE'     },
    { minCount: 15, multiplier: 7,   label: 'UNSTOPPABLE' },
    { minCount: 10, multiplier: 5,   label: 'MASSACRE'    },
    { minCount: 7,  multiplier: 4,   label: 'RAMPAGE'     },
    { minCount: 5,  multiplier: 3,   label: 'PENTA'       },
    { minCount: 4,  multiplier: 2.5, label: 'QUAD'        },
    { minCount: 3,  multiplier: 2,   label: 'TRIPLE'      },
    { minCount: 2,  multiplier: 1.5, label: 'DOUBLE'      },
    { minCount: 1,  multiplier: 1,   label: ''            }
  ];

  // ─── Helpers ──────────────────────────────────────────────────────────────
  function _getTier(count) {
    for (var i = 0; i < TIERS.length; i++) {
      if (count >= TIERS[i].minCount) return i;
    }
    return TIERS.length - 1;
  }

  function _loadBestEver() {
    try {
      var stored = localStorage.getItem(_LS_KEY);
      if (stored !== null) {
        var val = parseFloat(stored);
        if (!isNaN(val)) _bestComboEver = val;
      }
    } catch (e) { /* localStorage unavailable */ }
  }

  function _saveBestEver(val) {
    try {
      localStorage.setItem(_LS_KEY, String(val));
    } catch (e) { /* ignore */ }
  }

  // ─── HUD creation ─────────────────────────────────────────────────────────
  function _buildHUD() {
    if (_hudEl) return; // already built

    _hudEl = document.createElement('div');
    _hudEl.id = 'comboHUD';
    _hudEl.style.cssText = [
      'position:fixed',
      'right:32px',
      'top:50%',
      'transform:translateY(-50%)',
      'width:160px',
      'text-align:center',
      'pointer-events:none',
      'font-family:monospace',
      'display:none',
      'z-index:9100'
    ].join(';');

    // Multiplier text
    _multEl = document.createElement('div');
    _multEl.id = 'comboMult';
    _multEl.style.cssText = [
      'font-size:36px',
      'font-weight:bold',
      'color:#ffaa00',
      'text-shadow:0 0 12px #ff6600, 0 2px 4px #000',
      'letter-spacing:2px',
      'line-height:1.1'
    ].join(';');

    // Timer bar container
    _timerBarEl = document.createElement('div');
    _timerBarEl.style.cssText = [
      'width:100%',
      'height:8px',
      'background:#333',
      'border-radius:4px',
      'margin:6px 0 4px',
      'overflow:hidden'
    ].join(';');

    _barFillEl = document.createElement('div');
    _barFillEl.style.cssText = [
      'height:100%',
      'width:100%',
      'background:#44cc44',
      'border-radius:4px',
      'transition:background 0.1s'
    ].join(';');
    _timerBarEl.appendChild(_barFillEl);

    // Timer seconds text
    _timerTextEl = document.createElement('div');
    _timerTextEl.style.cssText = [
      'font-size:11px',
      'color:#aaa',
      'margin-bottom:4px'
    ].join(';');

    // Kill label flash
    _labelFlashEl = document.createElement('div');
    _labelFlashEl.id = 'comboLabel';
    _labelFlashEl.style.cssText = [
      'font-size:15px',
      'font-weight:bold',
      'color:#fff',
      'letter-spacing:3px',
      'min-height:20px',
      'text-shadow:0 0 8px #ffaa00',
      'transition:opacity 0.3s'
    ].join(';');

    // "COMBO" header label
    var headerEl = document.createElement('div');
    headerEl.style.cssText = [
      'font-size:11px',
      'color:#888',
      'letter-spacing:4px',
      'margin-bottom:2px'
    ].join(';');
    headerEl.textContent = 'COMBO';

    _hudEl.appendChild(headerEl);
    _hudEl.appendChild(_multEl);
    _hudEl.appendChild(_timerBarEl);
    _hudEl.appendChild(_timerTextEl);
    _hudEl.appendChild(_labelFlashEl);

    // "COMBO LOST" element (lives outside HUD, shown at same position)
    _lostEl = document.createElement('div');
    _lostEl.style.cssText = [
      'position:fixed',
      'right:32px',
      'top:50%',
      'transform:translateY(-50%)',
      'width:160px',
      'text-align:center',
      'pointer-events:none',
      'font-family:monospace',
      'font-size:18px',
      'font-weight:bold',
      'color:#888',
      'letter-spacing:2px',
      'display:none',
      'z-index:9099'
    ].join(';');
    _lostEl.textContent = 'COMBO LOST';

    document.body.appendChild(_hudEl);
    document.body.appendChild(_lostEl);
  }

  // ─── HUD update ───────────────────────────────────────────────────────────
  function _updateHUD() {
    if (!_hudEl) return;

    if (!_active) {
      _hudEl.style.display = 'none';
      return;
    }

    _hudEl.style.display = 'block';

    // Multiplier display
    _multEl.textContent = '\xd7' + _multiplier.toFixed(1);

    // Bar fill (fraction of time remaining)
    var frac = Math.max(0, Math.min(1, 1 - (_timer / _timerMax)));
    _barFillEl.style.width = Math.round(frac * 100) + '%';

    // Bar color: green -> red when < 1s
    var remaining = _timerMax - _timer;
    _barFillEl.style.background = remaining < 1 ? '#cc3333' : '#44cc44';

    // Timer text
    _timerTextEl.textContent = remaining.toFixed(1) + 's';

    // Label flash fade
    if (_labelFlashTime > 0) {
      _labelFlashEl.style.opacity = String(Math.min(1, _labelFlashTime / 0.3));
    } else {
      _labelFlashEl.style.opacity = '0';
    }
  }

  function _flashLabel(text, color) {
    if (!_labelFlashEl) return;
    _labelFlashEl.textContent = text;
    _labelFlashEl.style.color = color || '#ffffff';
    _labelFlashEl.style.textShadow = '0 0 10px ' + (color || '#ffaa00');
    _labelFlashEl.style.opacity = '1';
    _labelFlashTime = 1.2; // seconds to show
  }

  // ─── Special event banner ─────────────────────────────────────────────────
  function _showBanner(text, color) {
    var el = document.createElement('div');
    el.style.cssText = [
      'position:fixed',
      'left:50%',
      'top:30%',
      'transform:translate(-50%,-50%)',
      'font-family:monospace',
      'font-size:28px',
      'font-weight:bold',
      'color:' + (color || '#ffffff'),
      'text-shadow:0 0 16px ' + (color || '#ffffff') + ', 0 2px 6px #000',
      'letter-spacing:4px',
      'pointer-events:none',
      'z-index:9200',
      'opacity:1',
      'transition:opacity 1s'
    ].join(';');
    el.textContent = text;
    document.body.appendChild(el);
    // Fade out
    setTimeout(function () { el.style.opacity = '0'; }, 1200);
    setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 2300);
  }

  // ─── Bonus score floating text ────────────────────────────────────────────
  function _showBonusText(bonus) {
    var el = document.createElement('div');
    var cx = Math.round(window.innerWidth  * 0.5);
    var cy = Math.round(window.innerHeight * 0.45);
    el.style.cssText = [
      'position:fixed',
      'left:' + cx + 'px',
      'top:'  + cy + 'px',
      'transform:translate(-50%,-50%)',
      'font-family:monospace',
      'font-size:22px',
      'font-weight:bold',
      'color:#ffd700',
      'text-shadow:0 0 8px #ff8800, 0 1px 3px #000',
      'pointer-events:none',
      'z-index:9150',
      'opacity:1',
      'transition:opacity 0.8s, top 0.8s'
    ].join(';');
    el.textContent = '+' + bonus;
    document.body.appendChild(el);
    setTimeout(function () {
      el.style.opacity = '0';
      el.style.top = (cy - 40) + 'px';
    }, 50);
    setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 900);
  }

  // ─── Screen effects ───────────────────────────────────────────────────────
  function _edgeFlicker(color) {
    var el = document.createElement('div');
    el.style.cssText = [
      'position:fixed',
      'inset:0',
      'pointer-events:none',
      'z-index:9050',
      'box-shadow:inset 0 0 80px 30px ' + color,
      'opacity:0.7',
      'transition:opacity 0.2s'
    ].join(';');
    document.body.appendChild(el);
    setTimeout(function () { el.style.opacity = '0'; }, 80);
    setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 320);
  }

  function _screenShake() {
    var canvas = document.querySelector('canvas');
    if (!canvas) return;
    var mag = 6;
    var count = 0;
    var interval = setInterval(function () {
      if (count >= 6) {
        clearInterval(interval);
        canvas.style.transform = '';
        return;
      }
      var dx = (Math.random() - 0.5) * mag;
      var dy = (Math.random() - 0.5) * mag;
      canvas.style.transform = 'translate(' + dx + 'px,' + dy + 'px)';
      count++;
      mag *= 0.75;
    }, 25);
  }

  function _goldFlash() {
    var el = document.createElement('div');
    el.style.cssText = [
      'position:fixed',
      'inset:0',
      'pointer-events:none',
      'z-index:9060',
      'background:radial-gradient(ellipse at center, rgba(255,215,0,0.35) 0%, rgba(255,140,0,0.1) 60%, transparent 100%)',
      'opacity:1',
      'transition:opacity 0.5s'
    ].join(';');
    document.body.appendChild(el);
    setTimeout(function () { el.style.opacity = '0'; }, 120);
    setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 650);
  }

  // ─── Audio ────────────────────────────────────────────────────────────────
  function _playComboTone(multiplier) {
    try {
      if (!_audioCtx) {
        var AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        _audioCtx = new AC();
      }
      var osc  = _audioCtx.createOscillator();
      var gain = _audioCtx.createGain();
      osc.connect(gain);
      gain.connect(_audioCtx.destination);
      // Base freq 440 Hz; each tier raises by ~60 Hz, capped
      var freq = Math.min(1760, 440 + (_comboCount * 40));
      osc.frequency.setValueAtTime(freq, _audioCtx.currentTime);
      osc.type = 'sine';
      gain.gain.setValueAtTime(0.12, _audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, _audioCtx.currentTime + 0.18);
      osc.start(_audioCtx.currentTime);
      osc.stop(_audioCtx.currentTime + 0.18);
    } catch (e) { /* audio not available */ }
  }

  // ─── "COMBO LOST" display ─────────────────────────────────────────────────
  function _showComboLost() {
    if (!_lostEl) return;
    _lostEl.style.display  = 'block';
    _lostEl.style.opacity  = '1';
    _lostTimer = 1.5;
  }

  // ─── Public API ───────────────────────────────────────────────────────────

  function init() {
    _loadBestEver();
    _buildHUD();

    // Expose globals
    window._comboMultiplier = 1.0;
    window._comboCount      = 0;
    window._onKillForCombo  = function (opts) {
      onKill(opts);
    };

    _comboCount     = 0;
    _multiplier     = 1.0;
    _timer          = 0;
    _active         = false;
    _lastTier       = TIERS.length - 1;
    _killTimestamps = [];
    _blitzShown     = false;
    _slaughterShown = false;
    _backInAction   = false;
    _lostTimer      = 0;

    _updateHUD();
  }

  // opts: { baseKillScore, isHeadshot }
  function onKill(opts) {
    opts = opts || {};
    var baseKillScore = opts.baseKillScore || 0;
    var isHeadshot    = !!opts.isHeadshot;
    var now           = Date.now();

    // "Back in action" on first kill after break
    if (_backInAction) {
      _showBanner('BACK IN ACTION', '#4488ff');
      _backInAction = false;
    }

    // Increment combo count (headshots count as 1.5)
    _comboCount += isHeadshot ? 1.5 : 1;
    _timer       = 0;
    _active      = true;

    // Record timestamp for rapid-event detection
    _killTimestamps.push(now);
    // Prune old timestamps beyond 10s window
    var pruneTime = now - 10000;
    var newTs = [];
    for (var ti = 0; ti < _killTimestamps.length; ti++) {
      if (_killTimestamps[ti] > pruneTime) newTs.push(_killTimestamps[ti]);
    }
    _killTimestamps = newTs;

    // Determine tier
    var tierIdx    = _getTier(_comboCount);
    var tier       = TIERS[tierIdx];
    _multiplier    = tier.multiplier;

    // Update globals
    window._comboMultiplier = _multiplier;
    window._comboCount      = _comboCount;

    // Flash tier label on new tier
    if (tierIdx !== _lastTier && tier.label) {
      _flashLabel(tier.label + ' KILL', '#ffcc00');
    }
    _lastTier = tierIdx;

    // Bonus score
    if (_multiplier > 1 && baseKillScore > 0) {
      var bonus = Math.round(baseKillScore * (_multiplier - 1.0));
      if (bonus > 0) _showBonusText(bonus);
    }

    // Ascending tone
    if (_multiplier >= 1.5) _playComboTone(_multiplier);

    // Combo effects
    if (_multiplier >= 10) {
      _goldFlash();
    } else if (_multiplier >= 7) {
      _screenShake();
      _edgeFlicker('rgba(255,150,0,0.5)');
    } else if (_multiplier >= 5) {
      _edgeFlicker('rgba(255,100,0,0.4)');
    } else if (_multiplier >= 3) {
      _edgeFlicker('rgba(255,80,0,0.25)');
    }

    // Special rapid-kill events
    // 5 kills in 3s → BLITZ!
    if (!_blitzShown) {
      var blitzCutoff = now - 3000;
      var blitzCount  = 0;
      for (var bi = 0; bi < _killTimestamps.length; bi++) {
        if (_killTimestamps[bi] > blitzCutoff) blitzCount++;
      }
      if (blitzCount >= 5) {
        _showBanner('BLITZ!', '#00ffff');
        _blitzShown = true;
      }
    }

    // 10 kills in 10s → SLAUGHTER!
    if (!_slaughterShown) {
      var slayCutoff = now - 10000;
      var slayCount  = 0;
      for (var si = 0; si < _killTimestamps.length; si++) {
        if (_killTimestamps[si] > slayCutoff) slayCount++;
      }
      if (slayCount >= 10) {
        _showBanner('SLAUGHTER!', '#ff2222');
        _slaughterShown = true;
      }
    }

    // Session best
    if (_comboCount > _bestCombo) {
      _bestCombo = _comboCount;
    }
    if (_comboCount > _bestComboEver) {
      _bestComboEver = _comboCount;
      _saveBestEver(_bestComboEver);
    }

    _updateHUD();
  }

  // dt: seconds since last frame
  function update(dt) {
    // "COMBO LOST" fade
    if (_lostTimer > 0) {
      _lostTimer -= dt;
      if (_lostEl) {
        _lostEl.style.opacity = String(Math.max(0, _lostTimer / 1.5));
        if (_lostTimer <= 0) {
          _lostEl.style.display = 'none';
          _lostEl.style.opacity = '1';
        }
      }
    }

    // Label flash timer
    if (_labelFlashTime > 0) {
      _labelFlashTime -= dt;
    }

    if (!_active) return;

    _timer += dt;
    if (_timer >= _timerMax) {
      // Combo broke
      _active         = false;
      _multiplier     = 1.0;
      _comboCount     = 0;
      _lastTier       = TIERS.length - 1;
      _blitzShown     = false;
      _slaughterShown = false;
      _backInAction   = true;
      window._comboMultiplier = 1.0;
      window._comboCount      = 0;
      _showComboLost();
      _hudEl && (_hudEl.style.display = 'none');
    } else {
      _updateHUD();
    }
  }

  function getMultiplier() {
    return _multiplier;
  }

  function reset() {
    _active         = false;
    _multiplier     = 1.0;
    _comboCount     = 0;
    _timer          = 0;
    _lastTier       = TIERS.length - 1;
    _killTimestamps = [];
    _blitzShown     = false;
    _slaughterShown = false;
    _backInAction   = false;
    _lostTimer      = 0;
    window._comboMultiplier = 1.0;
    window._comboCount      = 0;
    if (_hudEl) _hudEl.style.display = 'none';
    if (_lostEl) { _lostEl.style.display = 'none'; _lostEl.style.opacity = '1'; }
  }

  // Public stats for end-screen
  function getBestCombo()      { return _bestCombo; }
  function getBestComboEver()  { return _bestComboEver; }

  return {
    init:            init,
    onKill:          onKill,
    update:          update,
    getMultiplier:   getMultiplier,
    reset:           reset,
    getBestCombo:    getBestCombo,
    getBestComboEver: getBestComboEver
  };

})();

;
} catch(_e){ if(window.console&&console.warn)console.warn("mod fail combo-system.js",_e&&_e.message); }
/* === enemy-squads.js === */
try {
;
/* ════════════════════════════════════════════════════════════════════
 *  ENEMY SQUADS — coordinated squad tactics for enemy groups
 *  ─────────────────────────────────────────────────────────────────
 *  Organizes wave enemies into squads of 3-4 with:
 *    - Bounding overwatch (alternating advance/cover halves)
 *    - Flanking maneuvers (perpendicular movement to player)
 *    - Squad communication (leader spots = all squad alerted)
 *    - Leader death transitions (panic → new leader promotion)
 *    - Squad spacing enforcement (prevent clumping)
 *    - Visual indicators (squad color outlines, leader diamond, flanker arrow)
 *    - HUD indicator when squads active
 *
 *  Public API:
 *    EnemySquads.init(scene, camera)   — call once after scene exists
 *    EnemySquads.update(delta)         — per-frame (called from game loop)
 *    EnemySquads.formSquads(wave)      — call after wave enemies are spawned
 *    EnemySquads.dissolveSquad(id)     — remove a squad by id
 *    EnemySquads.getSquads()           — return current squads array
 *    EnemySquads.reset()               — clear all state
 *
 *  Wave scaling:
 *    Wave 1-2: no squads (individual enemies)
 *    Wave 3-5: squads of 3
 *    Wave 6+:  squads of 4, flanking tactics enabled
 *    Boss wave: boss + 2 elite bodyguard squad
 * ════════════════════════════════════════════════════════════════════ */

window.EnemySquads = (function () {
  'use strict';

  /* ── internal state ─────────────────────────────────────────────── */
  var _scene  = null;
  var _camera = null;
  var _squads = [];          // array of squad objects
  var _hudEl  = null;        // bottom HUD indicator element
  var _initialized = false;
  var _currentWave = 0;

  /* ── constants ──────────────────────────────────────────────────── */
  var OVERWATCH_INTERVAL    = 2.0;   // seconds between overwatch phase switches
  var FLANK_TRIGGER_TIME    = 5.0;   // seconds engaging without kill before flanking
  var PANIC_DURATION        = 2.0;   // seconds of panic after leader dies
  var AGGRO_BONUS_MIN_LIFE  = 20.0;  // seconds leader alive for bonus aggro on death
  var AGGRO_BONUS_MULT      = 0.10;  // +10% aggro multiplier
  var SPACING_MIN           = 1.5;   // units — push apart if closer than this
  var SPACING_TARGET_MIN    = 2.0;   // desired minimum spacing
  var SPACING_TARGET_MAX    = 3.0;   // desired maximum spacing
  var LEADER_LABEL          = '◆';  // ◆ diamond
  var FLANKER_LABEL         = '→';  // → arrow

  /* ── squad color cycle (4 colors) ──────────────────────────────── */
  var SQUAD_COLORS = ['#ff3333', '#3399ff', '#33cc33', '#ff8800'];
  var SQUAD_COLOR_NAMES = ['red', 'blue', 'green', 'orange'];

  /* ── DOM marker pool ────────────────────────────────────────────── */
  var _markers = [];   // { el, enemy, type: 'leader'|'flanker' }

  /* ════════════════════════════════════════════════════════════════
     INIT
  ════════════════════════════════════════════════════════════════ */
  function init(scene, camera) {
    _scene  = scene;
    _camera = camera;
    _squads = [];
    _markers = [];
    _initialized = true;
    _ensureHUD();
    _clearMarkers();
  }

  /* ════════════════════════════════════════════════════════════════
     HUD
  ════════════════════════════════════════════════════════════════ */
  function _ensureHUD() {
    if (_hudEl) return;
    _hudEl = document.createElement('div');
    _hudEl.id = 'hud-squad-indicator';
    _hudEl.style.cssText = [
      'position:fixed',
      'bottom:72px',
      'left:50%',
      'transform:translateX(-50%)',
      'z-index:8400',
      'font-family:monospace',
      'font-size:11px',
      'color:#ffcc00',
      'background:rgba(0,0,0,0.55)',
      'padding:3px 10px',
      'border-radius:4px',
      'border:1px solid rgba(255,204,0,0.35)',
      'letter-spacing:1px',
      'pointer-events:none',
      'display:none',
    ].join(';');
    document.body.appendChild(_hudEl);
  }

  function _updateHUD() {
    if (!_hudEl) _ensureHUD();
    var active = _squads.filter(function (s) { return s && s.members && s.members.length > 0; });
    if (active.length === 0) {
      _hudEl.style.display = 'none';
      return;
    }
    _hudEl.textContent = '[SQUAD TACTICS ACTIVE — ' + active.length + ' SQUAD' + (active.length !== 1 ? 'S' : '') + ']';
    _hudEl.style.display = 'block';
  }

  /* ════════════════════════════════════════════════════════════════
     DOM MARKERS (leader diamond ◆ and flanker arrow →)
  ════════════════════════════════════════════════════════════════ */
  function _clearMarkers() {
    for (var i = 0; i < _markers.length; i++) {
      if (_markers[i] && _markers[i].el && _markers[i].el.parentNode) {
        _markers[i].el.parentNode.removeChild(_markers[i].el);
      }
    }
    _markers = [];
  }

  function _getOrCreateMarker(enemy, type) {
    /* find existing */
    for (var i = 0; i < _markers.length; i++) {
      if (_markers[i] && _markers[i].enemy === enemy && _markers[i].type === type) {
        return _markers[i];
      }
    }
    /* create new */
    var el = document.createElement('div');
    el.style.cssText = [
      'position:fixed',
      'z-index:8300',
      'pointer-events:none',
      'font-size:13px',
      'font-weight:bold',
      'text-shadow:0 0 4px rgba(0,0,0,0.9)',
      'transform:translate(-50%,-100%)',
      'display:none',
    ].join(';');
    if (type === 'leader') {
      el.textContent = LEADER_LABEL;
      el.style.color = '#ffcc00';
    } else {
      el.textContent = FLANKER_LABEL;
      el.style.color = '#ffffff';
    }
    document.body.appendChild(el);
    var m = { el: el, enemy: enemy, type: type };
    _markers.push(m);
    return m;
  }

  function _removeMarkersForEnemy(enemy) {
    for (var i = _markers.length - 1; i >= 0; i--) {
      if (_markers[i] && _markers[i].enemy === enemy) {
        if (_markers[i].el && _markers[i].el.parentNode) {
          _markers[i].el.parentNode.removeChild(_markers[i].el);
        }
        _markers.splice(i, 1);
      }
    }
  }

  /* project 3D world position to 2D screen coords — returns null if behind camera */
  function _worldToScreen(pos) {
    if (!_camera) return null;
    var v = pos.clone();
    v.project(_camera);
    if (v.z > 1) return null;   /* behind camera */
    var w = window.innerWidth;
    var h = window.innerHeight;
    return {
      x: ( v.x * 0.5 + 0.5) * w,
      y: (-v.y * 0.5 + 0.5) * h,
    };
  }

  function _updateMarkers() {
    for (var i = 0; i < _markers.length; i++) {
      var m = _markers[i];
      if (!m || !m.enemy || !m.enemy.mesh || !m.enemy.alive) {
        if (m && m.el) m.el.style.display = 'none';
        continue;
      }
      /* position above head */
      var pos3 = m.enemy.mesh.position.clone();
      pos3.y += 2.6;
      var sc = _worldToScreen(pos3);
      if (!sc || sc.x < 0 || sc.x > window.innerWidth || sc.y < 0 || sc.y > window.innerHeight) {
        m.el.style.display = 'none';
        continue;
      }
      m.el.style.display = 'block';
      m.el.style.left = sc.x + 'px';
      m.el.style.top  = sc.y + 'px';
    }
  }

  /* ════════════════════════════════════════════════════════════════
     FORM SQUADS — called after a wave's enemies are all spawned
  ════════════════════════════════════════════════════════════════ */
  function formSquads(wave) {
    _currentWave = wave || 0;
    /* clear old state */
    _clearMarkers();
    _squads = [];

    /* waves 1-2: no squads */
    if (_currentWave < 3) {
      _updateHUD();
      return;
    }

    var all = (typeof window.Enemies !== 'undefined' && window.Enemies.getAll)
      ? window.Enemies.getAll() : [];
    if (!all || all.length === 0) {
      _updateHUD();
      return;
    }

    var squadSize = (_currentWave >= 6) ? 4 : 3;

    /* group into squads */
    var squadIndex = 0;
    var i = 0;
    while (i < all.length) {
      var members = [];
      for (var j = 0; j < squadSize && i < all.length; j++, i++) {
        members.push(all[i]);
      }
      if (members.length < 2) {
        /* solo enemy — no squad */
        break;
      }
      squadIndex++;
      var squadId    = 'SQUAD_' + squadIndex;
      var colorIdx   = (squadIndex - 1) % SQUAD_COLORS.length;
      var squadColor = SQUAD_COLORS[colorIdx];

      /* assign roles */
      for (var k = 0; k < members.length; k++) {
        var e = members[k];
        e._squadId   = squadId;
        if (k === 0) {
          e._squadRole = 'LEADER';
        } else if (k === members.length - 1 && _currentWave >= 6) {
          e._squadRole = 'FLANKER';
        } else {
          e._squadRole = 'RIFLEMAN';
        }
        e._hasTarget       = false;
        e._squadColor      = squadColor;
        e._panicTimer      = 0;
        e._flankTimer      = 0;
        e._isFlanking      = false;
        e._flankAngle      = 0;
        e._leaderAliveTime = 0;
        e._aggroBonusActive = false;
      }

      var squad = {
        id:             squadId,
        members:        members,
        colorIdx:       colorIdx,
        color:          squadColor,
        leader:         members[0],
        overwatchTimer: 0,
        overwatchPhase: 0,       /* 0 = first half advances, 1 = second half advances */
        engageTimer:    0,
        killsSinceForm: 0,
        formedAt:       performance.now(),
        isBossSquad:    false,
      };
      _squads.push(squad);

      /* create leader marker */
      _getOrCreateMarker(members[0], 'leader');
    }

    _updateHUD();
  }

  /* ════════════════════════════════════════════════════════════════
     DISSOLVE SQUAD
  ════════════════════════════════════════════════════════════════ */
  function dissolveSquad(squadId) {
    for (var i = _squads.length - 1; i >= 0; i--) {
      if (_squads[i] && _squads[i].id === squadId) {
        var members = _squads[i].members;
        for (var j = 0; j < members.length; j++) {
          _removeMarkersForEnemy(members[j]);
          members[j]._squadId   = null;
          members[j]._squadRole = null;
        }
        _squads.splice(i, 1);
        break;
      }
    }
    _updateHUD();
  }

  /* ════════════════════════════════════════════════════════════════
     GET SQUADS
  ════════════════════════════════════════════════════════════════ */
  function getSquads() {
    return _squads;
  }

  /* ════════════════════════════════════════════════════════════════
     RESET
  ════════════════════════════════════════════════════════════════ */
  function reset() {
    _clearMarkers();
    _squads = [];
    _currentWave = 0;
    if (_hudEl) _hudEl.style.display = 'none';
  }

  /* ════════════════════════════════════════════════════════════════
     UPDATE — called each frame
  ════════════════════════════════════════════════════════════════ */
  function update(delta) {
    if (!_initialized) return;
    if (_squads.length === 0) return;

    var playerPos = _getPlayerPos();

    for (var si = _squads.length - 1; si >= 0; si--) {
      var squad = _squads[si];
      if (!squad) { _squads.splice(si, 1); continue; }

      /* prune dead members */
      squad.members = squad.members.filter(function (e) { return e && e.alive; });
      if (squad.members.length === 0) {
        _squads.splice(si, 1);
        continue;
      }

      /* advance engage timer for flanking trigger */
      squad.engageTimer += delta;

      /* ── 1. leader death check ──────────────────────────────── */
      _handleLeaderDeath(squad, delta);

      /* ── 2. squad communication — leader spots player ───────── */
      _handleSquadComms(squad, playerPos);

      /* ── 3. bounding overwatch ──────────────────────────────── */
      _handleBoundingOverwatch(squad, delta, playerPos);

      /* ── 4. flanking ────────────────────────────────────────── */
      _handleFlanking(squad, delta, playerPos);

      /* ── 5. spacing enforcement ─────────────────────────────── */
      _handleSpacing(squad);

      /* ── 6. panic update ────────────────────────────────────── */
      _handlePanic(squad, delta, playerPos);
    }

    /* update 3D→2D markers */
    _updateMarkers();

    /* update HUD */
    _updateHUD();
  }

  /* ── leader death handling ──────────────────────────────────────── */
  function _handleLeaderDeath(squad, delta) {
    if (!squad.leader) return;

    /* track how long leader has been alive */
    if (squad.leader.alive) {
      squad.leader._leaderAliveTime = (squad.leader._leaderAliveTime || 0) + delta;
      return;   /* still alive — nothing to do */
    }

    /* leader just died */
    var leaderAliveTime = squad.leader._leaderAliveTime || 0;
    var aggroBonus      = leaderAliveTime > AGGRO_BONUS_MIN_LIFE;

    /* trigger panic on all survivors */
    for (var i = 0; i < squad.members.length; i++) {
      var e = squad.members[i];
      if (!e.alive) continue;
      e._panicTimer = PANIC_DURATION;
      if (aggroBonus) {
        e._aggroBonusActive = true;
        e._aggroMult = (e._aggroMult || 1.0) * (1.0 + AGGRO_BONUS_MULT);
      }
    }

    /* remove leader marker */
    _removeMarkersForEnemy(squad.leader);

    /* promote nearest alive member to leader */
    var newLeader = _findNearestAlive(squad.members, squad.leader.mesh
      ? squad.leader.mesh.position : null);
    if (newLeader) {
      newLeader._squadRole = 'LEADER';
      newLeader._leaderAliveTime = 0;
      squad.leader = newLeader;
      /* add leader marker to new leader */
      _getOrCreateMarker(newLeader, 'leader');
    } else {
      squad.leader = null;
    }
  }

  /* ── squad comms — when leader has target, share with all ──────── */
  function _handleSquadComms(squad, playerPos) {
    if (!squad.leader || !squad.leader.alive) return;
    var leader = squad.leader;
    /* check if leader has spotted player (has target) */
    if (!leader._hasTarget) return;
    /* share to all members */
    for (var i = 0; i < squad.members.length; i++) {
      var e = squad.members[i];
      if (e && e.alive && !e._hasTarget) {
        e._hasTarget = true;   /* bypass individual detection delay */
      }
    }
  }

  /* ── bounding overwatch ─────────────────────────────────────────── */
  function _handleBoundingOverwatch(squad, delta, playerPos) {
    squad.overwatchTimer += delta;
    if (squad.overwatchTimer < OVERWATCH_INTERVAL) {
      /* apply current phase crouch/stand */
      _applyOverwatchPhase(squad);
      return;
    }
    /* switch phase */
    squad.overwatchTimer = 0;
    squad.overwatchPhase = squad.overwatchPhase === 0 ? 1 : 0;
    _applyOverwatchPhase(squad);
  }

  function _applyOverwatchPhase(squad) {
    var half = Math.ceil(squad.members.length / 2);
    for (var i = 0; i < squad.members.length; i++) {
      var e = squad.members[i];
      if (!e || !e.alive || !e.mesh) continue;
      /* first half advances (phase 0) or covers (phase 1) */
      if (squad.overwatchPhase === 0) {
        /* first half: advancing — normal scale */
        if (i < half) {
          e.mesh.scale.y = 1.0;
          e._overwatchCovering = false;
        } else {
          /* second half: crouching/covering */
          e.mesh.scale.y = 0.7;
          e._overwatchCovering = true;
        }
      } else {
        /* second half: advancing */
        if (i >= half) {
          e.mesh.scale.y = 1.0;
          e._overwatchCovering = false;
        } else {
          /* first half: covering */
          e.mesh.scale.y = 0.7;
          e._overwatchCovering = true;
        }
      }
    }
  }

  /* ── flanking ───────────────────────────────────────────────────── */
  function _handleFlanking(squad, delta, playerPos) {
    /* only on wave 6+ */
    if (_currentWave < 6) return;
    if (!playerPos) return;

    /* check if flanking should be triggered */
    if (!squad._flankActive && squad.engageTimer > FLANK_TRIGGER_TIME && squad.killsSinceForm === 0) {
      squad._flankActive = true;
    }

    if (!squad._flankActive) return;

    /* find the flanker */
    var flanker = null;
    for (var i = 0; i < squad.members.length; i++) {
      if (squad.members[i] && squad.members[i].alive && squad.members[i]._squadRole === 'FLANKER') {
        flanker = squad.members[i];
        break;
      }
    }
    if (!flanker || !flanker.mesh) return;

    /* compute perpendicular direction to player */
    var dx = flanker.mesh.position.x - playerPos.x;
    var dz = flanker.mesh.position.z - playerPos.z;
    var dist = Math.sqrt(dx * dx + dz * dz);
    if (dist < 0.01) return;

    /* perpendicular direction (90 degrees to player-enemy line) */
    var perpX = -dz / dist;
    var perpZ =  dx / dist;

    /* advance flanker along curved path */
    if (!flanker._isFlanking) {
      flanker._isFlanking = true;
      flanker._flankTimer = 0;
      flanker._flankSide  = (Math.random() < 0.5) ? 1 : -1;
      /* add flanker arrow marker */
      _getOrCreateMarker(flanker, 'flanker');
    }

    flanker._flankTimer = (flanker._flankTimer || 0) + delta;

    /* move flanker perpendicular */
    var flankSpeed = 3.0;
    var side       = flanker._flankSide || 1;
    flanker.mesh.position.x += perpX * side * flankSpeed * delta;
    flanker.mesh.position.z += perpZ * side * flankSpeed * delta;

    /* also inch forward toward player */
    var fwdSpeed = 1.0;
    flanker.mesh.position.x -= (dx / dist) * fwdSpeed * delta;
    flanker.mesh.position.z -= (dz / dist) * fwdSpeed * delta;

    /* if flanker has reached ~90° angle from leader to player, stop */
    if (flanker._flankTimer > 4.0) {
      flanker._isFlanking  = false;
      flanker._flankTimer  = 0;
      /* remove flanker arrow */
      _removeFlankMarker(flanker);
    }
  }

  function _removeFlankMarker(enemy) {
    for (var i = _markers.length - 1; i >= 0; i--) {
      if (_markers[i] && _markers[i].enemy === enemy && _markers[i].type === 'flanker') {
        if (_markers[i].el && _markers[i].el.parentNode) {
          _markers[i].el.parentNode.removeChild(_markers[i].el);
        }
        _markers.splice(i, 1);
        return;
      }
    }
  }

  /* ── squad spacing enforcement ──────────────────────────────────── */
  function _handleSpacing(squad) {
    var members = squad.members;
    for (var a = 0; a < members.length; a++) {
      var ea = members[a];
      if (!ea || !ea.alive || !ea.mesh) continue;
      for (var b = a + 1; b < members.length; b++) {
        var eb = members[b];
        if (!eb || !eb.alive || !eb.mesh) continue;
        var dx = ea.mesh.position.x - eb.mesh.position.x;
        var dz = ea.mesh.position.z - eb.mesh.position.z;
        var dist2 = dx * dx + dz * dz;
        if (dist2 < SPACING_MIN * SPACING_MIN && dist2 > 0.0001) {
          var dist = Math.sqrt(dist2);
          var push = (SPACING_MIN - dist) * 0.5;
          var nx   = dx / dist;
          var nz   = dz / dist;
          ea.mesh.position.x += nx * push;
          ea.mesh.position.z += nz * push;
          eb.mesh.position.x -= nx * push;
          eb.mesh.position.z -= nz * push;
        }
      }
    }
  }

  /* ── panic movement ─────────────────────────────────────────────── */
  function _handlePanic(squad, delta, playerPos) {
    for (var i = 0; i < squad.members.length; i++) {
      var e = squad.members[i];
      if (!e || !e.alive || !e.mesh) continue;
      if (e._panicTimer <= 0) continue;
      e._panicTimer -= delta;
      /* erratic movement while panicking */
      var erraticX = (Math.random() - 0.5) * 8.0 * delta;
      var erraticZ = (Math.random() - 0.5) * 8.0 * delta;
      e.mesh.position.x += erraticX;
      e.mesh.position.z += erraticZ;
    }
  }

  /* ── helpers ────────────────────────────────────────────────────── */
  function _getPlayerPos() {
    if (typeof window.player !== 'undefined' && window.player && window.player.position) {
      return window.player.position;
    }
    /* fallback: try GameManager-style */
    if (typeof GameManager !== 'undefined' && GameManager.getPlayerPosition) {
      return GameManager.getPlayerPosition();
    }
    return null;
  }

  function _findNearestAlive(members, fromPos) {
    if (!fromPos) {
      for (var i = 0; i < members.length; i++) {
        if (members[i] && members[i].alive) return members[i];
      }
      return null;
    }
    var best     = null;
    var bestDist = Infinity;
    for (var j = 0; j < members.length; j++) {
      var e = members[j];
      if (!e || !e.alive || !e.mesh) continue;
      var dx = e.mesh.position.x - fromPos.x;
      var dz = e.mesh.position.z - fromPos.z;
      var d2 = dx * dx + dz * dz;
      if (d2 < bestDist) {
        bestDist = d2;
        best     = e;
      }
    }
    return best;
  }

  /* ════════════════════════════════════════════════════════════════
     PUBLIC API
  ════════════════════════════════════════════════════════════════ */
  return {
    init:          init,
    update:        update,
    formSquads:    formSquads,
    dissolveSquad: dissolveSquad,
    getSquads:     getSquads,
    reset:         reset,
  };

})();

;
} catch(_e){ if(window.console&&console.warn)console.warn("mod fail enemy-squads.js",_e&&_e.message); }
/* === recoil-system.js === */
try {
;
/* ───────────────────────────────────────────────────────────────────────
   RECOIL SYSTEM — realistic per-weapon recoil patterns with recovery
   Handles recoil impulse, recovery, burst-fire stacking, weapon sway,
   and crosshair spread. Camera reads window._recoilPitchDelta and
   window._recoilYawDelta each frame to apply the offsets.
   ─────────────────────────────────────────────────────────────────────── */
window.RecoilSystem = (function () {
  'use strict';

  // ── Recoil profiles per weapon ─────────────────────────────────────
  var RECOIL_PROFILES = {
    'AK74':     { vertical: 1.2, horizontal: 0.6, recovery: 3.0, pattern: 'V_CURVE' },
    'M4A1':     { vertical: 0.9, horizontal: 0.4, recovery: 4.0, pattern: 'STRAIGHT' },
    'AXMC':     { vertical: 3.0, horizontal: 0.2, recovery: 2.0, pattern: 'STRAIGHT' },
    'SVD':      { vertical: 2.5, horizontal: 0.3, recovery: 2.5, pattern: 'STRAIGHT' },
    'MG3':      { vertical: 1.5, horizontal: 1.0, recovery: 1.5, pattern: 'RANDOM' },
    'GLOCK17':  { vertical: 0.8, horizontal: 0.3, recovery: 5.0, pattern: 'STRAIGHT' },
    'MOSSBERG': { vertical: 4.0, horizontal: 1.5, recovery: 1.0, pattern: 'RANDOM' },
    'RPG7':     { vertical: 5.0, horizontal: 0.5, recovery: 0.5, pattern: 'STRAIGHT' },
    'DEFAULT':  { vertical: 1.0, horizontal: 0.5, recovery: 3.0, pattern: 'STRAIGHT' }
  };

  // ── Accumulated recoil state ────────────────────────────────────────
  var _recoilPitch  = 0;   // vertical recoil accumulation (degrees)
  var _recoilYaw    = 0;   // horizontal recoil accumulation (degrees)

  // ── Burst-fire tracking ─────────────────────────────────────────────
  var _burstCount   = 0;   // shots fired in current burst
  var _lastShotTime = 0;   // timestamp (ms) of last shot

  // ── Pattern state for V_CURVE ───────────────────────────────────────
  var _vcurvePhase  = 0;   // tracks AK-74 curve phase (shot index)

  // ── Max recoil clamp ────────────────────────────────────────────────
  var MAX_RECOIL    = 15;  // degrees

  // ── Burst-fire time threshold ───────────────────────────────────────
  var BURST_THRESHOLD = 0.15; // seconds between shots to count as burst

  // ── Sensitivity base scale ─────────────────────────────────────────
  var BASE_SENSITIVITY = 0.05; // scales degree values to camera-friendly range

  // ── Private helpers ─────────────────────────────────────────────────
  function _lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function _clamp(v, lo, hi) {
    return v < lo ? lo : (v > hi ? hi : v);
  }

  // Compute stance sensitivity multiplier
  function _stanceMultiplier() {
    var mult = 1.0;

    if (window._prone) {
      mult *= 0.4;
      if (window._proneAccuracyBonus) {
        mult *= (1.0 - window._proneAccuracyBonus);
      }
    } else if (window._crouching) {
      mult *= 0.7;
      if (window._crouchAccuracyBonus) {
        mult *= (1.0 - window._crouchAccuracyBonus);
      }
    }

    if (window._adsActive) {
      mult *= 0.5;
    }

    if (window._sprinting) {
      mult *= 1.5;
    }

    return mult;
  }

  // Compute burst multiplier based on shot count in current burst
  function _burstMultiplier() {
    if (_burstCount <= 1) return 1.0;
    if (_burstCount === 2) return 1.2;
    return 1.4;
  }

  // Compute horizontal pattern modifier
  // STRAIGHT: no horizontal drift beyond profile.horizontal
  // V_CURVE:  first shots go up, then drift right, then left
  // RANDOM:   each shot random direction
  function _patternHorizModifier(pattern) {
    if (pattern === 'STRAIGHT') {
      return 0.0; // no horizontal drift beyond small base
    }
    if (pattern === 'V_CURVE') {
      // Phase 0-2: straight up (modifier near 0)
      // Phase 3-6: drift right (+1)
      // Phase 7+: drift left (-1)
      _vcurvePhase++;
      if (_vcurvePhase <= 2) return 0.0;
      if (_vcurvePhase <= 6) return 1.0;
      return -1.0;
    }
    if (pattern === 'RANDOM') {
      return (Math.random() * 2.0 - 1.0); // -1 to +1
    }
    return 0.0;
  }

  // ── Public: init ────────────────────────────────────────────────────
  function init() {
    // Initialise all window globals to safe defaults
    window._recoilPitchDelta = 0;
    window._recoilYawDelta   = 0;
    window._swayDeltaX       = 0;
    window._swayDeltaY       = 0;
    window._crosshairSpread  = 0;

    // Hook for game-manager to call on each shot fired
    window._onShotForRecoil = function (weaponType) {
      onShot(weaponType);
    };

    // Internal state reset
    _recoilPitch  = 0;
    _recoilYaw    = 0;
    _burstCount   = 0;
    _lastShotTime = 0;
    _vcurvePhase  = 0;
  }

  // ── Public: onShot ─────────────────────────────────────────────────
  function onShot(weaponType) {
    var profile = RECOIL_PROFILES[weaponType] || RECOIL_PROFILES['DEFAULT'];
    var now     = Date.now();

    // Determine burst vs fresh shot
    var timeSinceLast = (now - _lastShotTime) / 1000; // convert to seconds
    if (_lastShotTime === 0 || timeSinceLast > BURST_THRESHOLD) {
      // New burst — reset counter and V_CURVE phase
      _burstCount  = 1;
      _vcurvePhase = 0;
    } else {
      _burstCount++;
    }
    _lastShotTime = now;

    // Get modifiers
    var stanceMult  = _stanceMultiplier();
    var burstMult   = _burstMultiplier();
    var sensitivity = BASE_SENSITIVITY * stanceMult * burstMult;

    // Vertical recoil impulse
    var pitchAdd = profile.vertical * sensitivity;
    _recoilPitch += pitchAdd;

    // Horizontal drift based on pattern
    var horizMod = _patternHorizModifier(profile.pattern);
    var yawAdd   = profile.horizontal * horizMod * sensitivity;
    _recoilYaw   += yawAdd;

    // Clamp accumulated recoil
    _recoilPitch = _clamp(_recoilPitch, -MAX_RECOIL, MAX_RECOIL);
    _recoilYaw   = _clamp(_recoilYaw,   -MAX_RECOIL, MAX_RECOIL);

    // Push to window so camera reads them this frame
    window._recoilPitchDelta = _recoilPitch;
    window._recoilYawDelta   = _recoilYaw;

    // Update crosshair spread proportional to total recoil magnitude
    window._crosshairSpread = Math.abs(_recoilPitch) + Math.abs(_recoilYaw);
  }

  // ── Public: update (called every frame) ────────────────────────────
  function update(delta) {
    if (!delta || delta <= 0) return;

    // Determine current weapon profile for recovery rate
    var currentWeapon = window._currentWeapon || window._equippedWeapon || 'DEFAULT';
    var profile = RECOIL_PROFILES[currentWeapon] || RECOIL_PROFILES['DEFAULT'];
    var recoveryRate = profile.recovery; // degrees per second

    // Recover recoil toward 0
    var recoverAmount = recoveryRate * delta;

    if (_recoilPitch > 0) {
      _recoilPitch = Math.max(0, _recoilPitch - recoverAmount);
    } else if (_recoilPitch < 0) {
      _recoilPitch = Math.min(0, _recoilPitch + recoverAmount);
    }

    if (_recoilYaw > 0) {
      _recoilYaw = Math.max(0, _recoilYaw - recoverAmount);
    } else if (_recoilYaw < 0) {
      _recoilYaw = Math.min(0, _recoilYaw + recoverAmount);
    }

    // Push recovered values to window
    window._recoilPitchDelta = _recoilPitch;
    window._recoilYawDelta   = _recoilYaw;

    // Update crosshair spread to reflect recovery
    window._crosshairSpread = Math.abs(_recoilPitch) + Math.abs(_recoilYaw);

    // ── Weapon sway (separate from recoil) ─────────────────────────
    var movingFactor = 0;
    if (window._playerMoving) {
      movingFactor = 1.0;
    }

    // Reduce sway when ADS or prone
    if (window._adsActive)  movingFactor *= 0.3;
    if (window._prone)      movingFactor *= 0.2;
    if (window._crouching)  movingFactor *= 0.5;

    var t = Date.now();
    var swayX = Math.sin(t * 0.003) * 0.1 * movingFactor;
    var swayY = Math.cos(t * 0.004) * 0.05 * movingFactor;

    window._swayDeltaX = swayX;
    window._swayDeltaY = swayY;
  }

  // ── Public: reset (called between waves/rounds) ─────────────────────
  function reset() {
    _recoilPitch  = 0;
    _recoilYaw    = 0;
    _burstCount   = 0;
    _lastShotTime = 0;
    _vcurvePhase  = 0;

    window._recoilPitchDelta = 0;
    window._recoilYawDelta   = 0;
    window._swayDeltaX       = 0;
    window._swayDeltaY       = 0;
    window._crosshairSpread  = 0;
  }

  // ── Public API ──────────────────────────────────────────────────────
  return {
    init:   init,
    onShot: onShot,
    update: update,
    reset:  reset
  };
})();

;
} catch(_e){ if(window.console&&console.warn)console.warn("mod fail recoil-system.js",_e&&_e.message); }
/* === blood-trail.js === */
try {
;
// ============================================================
//  blood-trail.js — Blood Trail Tracker
//  Wounded enemies leave a blood trail the player can follow.
//
//  Public API: { init, update, reset }
//  Config toggle: window._bleedEnabled (default true)
// ============================================================
window.BloodTrail = (function () {
  'use strict';

  // ── Constants ──────────────────────────────────────────────
  var HP_THRESHOLD     = 0.40;   // track enemies below 40% HP
  var DROP_INTERVAL    = 1.5;    // seconds between trail drops
  var DROP_LIFETIME    = 25.0;   // seconds before fade begins
  var DEATH_FADE_TIME  = 2.0;    // seconds for death cleanup fade
  var MAX_DROPS        = 80;     // pool ceiling (FIFO when exceeded)
  var TRACKER_RANGE    = 15.0;   // units — max distance for direction arrow
  var PING_INTERVAL    = 3.0;    // seconds between compass audio pings
  var TRACK_THRESHOLD  = 3;      // drops followed before "tracked kill" bonus
  var BONUS_SCORE      = 75;

  // ── Scene / Three.js state ─────────────────────────────────
  var _scene           = null;
  var _camera          = null;   // needed for screen-space arrow
  var _initialized     = false;

  // ── Drop pool ──────────────────────────────────────────────
  // Each slot: { mesh, light, active, timer, enemyId, fadeDur, opacity }
  var _drops           = [];

  // ── Enemy tracking state ───────────────────────────────────
  // Keyed by a unique _btId assigned to each enemy object.
  // { timer, dropCount }
  var _enemyState      = {};
  var _btIdCounter     = 0;

  // ── Tracker mode ──────────────────────────────────────────
  var _trackerActive   = false;
  var _trackerHUD      = null;   // DOM element for HUD label
  var _arrowEl         = null;   // DOM element for direction arrow
  var _pingTimer       = 0;
  var _pulseLight      = null;   // PointLight on most-recent drop
  var _pulsePhase      = 0;

  // ── Kill-tracking: how many drops player has "followed" ──
  // Maps enemyId -> count of drops the player has passed near
  var _followedDrops   = {};

  // ── Audio context (optional ping) ─────────────────────────
  var _audioCtx        = null;

  // ── Helpers ───────────────────────────────────────────────
  function _rnd(min, max) {
    return min + Math.random() * (max - min);
  }

  function _getBleedEnabled() {
    return (window._bleedEnabled === undefined) ? true : !!window._bleedEnabled;
  }

  function _assignId(enemy) {
    if (!enemy._btId) {
      enemy._btId = ++_btIdCounter;
    }
    return enemy._btId;
  }

  // ── Pool management ───────────────────────────────────────
  function _acquireSlot() {
    // Find inactive slot first
    for (var i = 0; i < _drops.length; i++) {
      if (!_drops[i].active) return i;
    }
    // Pool below ceiling — grow it
    if (_drops.length < MAX_DROPS) {
      return _drops.length; // caller will push a new entry
    }
    // FIFO eviction: remove oldest (first active slot)
    for (var j = 0; j < _drops.length; j++) {
      if (_drops[j].active) {
        _evictDrop(j);
        return j;
      }
    }
    return 0;
  }

  function _evictDrop(idx) {
    var d = _drops[idx];
    if (!d) return;
    if (d.mesh) {
      if (_scene) _scene.remove(d.mesh);
      if (d.mesh.geometry) d.mesh.geometry.dispose();
      if (d.mesh.material) d.mesh.material.dispose();
      d.mesh = null;
    }
    if (d.light) {
      if (_scene) _scene.remove(d.light);
      d.light = null;
    }
    d.active  = false;
    d.enemyId = null;
  }

  // ── Place a blood drop ───────────────────────────────────
  function _placeDrop(x, z, enemyId) {
    var radius  = _rnd(0.08, 0.18);
    var opacity = _rnd(0.6, 1.0);
    var geo     = new THREE.CircleGeometry(radius, 8);
    var mat     = new THREE.MeshBasicMaterial({
      color:       0x8B0000,
      transparent: true,
      opacity:     opacity,
      depthWrite:  false
    });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(x, 0.01, z);
    if (_scene) _scene.add(mesh);

    var idx  = _acquireSlot();
    var slot = {
      mesh:       mesh,
      light:      null,
      active:     true,
      timer:      0,
      enemyId:    enemyId,
      fadeDur:    DROP_LIFETIME,
      baseOpacity: opacity
    };

    if (idx < _drops.length) {
      _drops[idx] = slot;
    } else {
      _drops.push(slot);
    }
    return idx;
  }

  // ── Tracker-mode pulse light on newest drop ───────────────
  function _attachPulseLight(idx) {
    // Remove old pulse light from previous drop
    if (_pulseLight && _scene) {
      _scene.remove(_pulseLight);
      _pulseLight = null;
    }
    var d = _drops[idx];
    if (!d || !d.mesh) return;
    var light = new THREE.PointLight(0xFF0000, 3, 4);
    light.position.copy(d.mesh.position);
    light.position.y += 0.3;
    if (_scene) _scene.add(light);
    d.light    = light;
    _pulseLight = light;
  }

  // ── HUD / DOM helpers ─────────────────────────────────────
  function _createHUD() {
    if (_trackerHUD) return;
    var el      = document.createElement('div');
    el.id       = 'blood-trail-hud';
    el.style.position   = 'fixed';
    el.style.top        = '12px';
    el.style.left       = '12px';
    el.style.color      = '#cc0000';
    el.style.fontFamily = 'monospace, sans-serif';
    el.style.fontSize   = '16px';
    el.style.fontWeight = 'bold';
    el.style.textShadow = '0 0 6px #ff0000, 0 0 12px #ff0000';
    el.style.zIndex     = '9999';
    el.style.display    = 'none';
    el.style.pointerEvents = 'none';
    el.innerText        = '🩸 TRAIL ACTIVE';
    document.body.appendChild(el);
    _trackerHUD = el;
  }

  function _createArrow() {
    if (_arrowEl) return;
    var el      = document.createElement('div');
    el.id       = 'blood-trail-arrow';
    el.style.position   = 'fixed';
    el.style.top        = '50%';
    el.style.left       = '50%';
    el.style.transform  = 'translate(-50%, -50%)';
    el.style.color      = '#ff0000';
    el.style.fontSize   = '28px';
    el.style.fontWeight = 'bold';
    el.style.zIndex     = '9999';
    el.style.display    = 'none';
    el.style.pointerEvents = 'none';
    el.style.textShadow = '0 0 8px #ff0000';
    el.innerText        = '↑'; // up arrow, rotated by JS
    document.body.appendChild(el);
    _arrowEl = el;
  }

  function _showHUD(show) {
    if (_trackerHUD) _trackerHUD.style.display = show ? 'block' : 'none';
    if (_arrowEl)    _arrowEl.style.display    = show ? 'block' : 'none';
  }

  // ── Find nearest active drop within range ─────────────────
  function _nearestDrop(px, pz, maxDist) {
    var bestIdx  = -1;
    var bestDist = maxDist * maxDist;
    for (var i = 0; i < _drops.length; i++) {
      var d = _drops[i];
      if (!d || !d.active || !d.mesh) continue;
      var dx   = d.mesh.position.x - px;
      var dz   = d.mesh.position.z - pz;
      var dist2 = dx * dx + dz * dz;
      if (dist2 < bestDist) {
        bestDist = dist2;
        bestIdx  = i;
      }
    }
    return bestIdx;
  }

  // ── Update direction arrow on screen ─────────────────────
  function _updateArrow(px, pz) {
    if (!_arrowEl || !_trackerActive) return;

    var nearIdx = _nearestDrop(px, pz, TRACKER_RANGE);
    if (nearIdx < 0) {
      _arrowEl.style.display = 'none';
      return;
    }

    var drop = _drops[nearIdx];
    var dx   = drop.mesh.position.x - px;
    var dz   = drop.mesh.position.z - pz;
    // Angle in screen-space: atan2(dx, -dz) gives forward-is-up orientation
    var angle = Math.atan2(dx, -dz) * (180 / Math.PI);

    _arrowEl.style.display   = 'block';
    _arrowEl.style.transform =
      'translate(-50%, -50%) rotate(' + angle + 'deg)';
  }

  // ── Audio ping ────────────────────────────────────────────
  function _emitPing() {
    try {
      if (!_audioCtx) {
        if (typeof AudioContext !== 'undefined') {
          _audioCtx = new AudioContext();
        } else if (typeof webkitAudioContext !== 'undefined') {
          _audioCtx = new webkitAudioContext();
        }
      }
      if (!_audioCtx) return;
      var osc  = _audioCtx.createOscillator();
      var gain = _audioCtx.createGain();
      osc.connect(gain);
      gain.connect(_audioCtx.destination);
      osc.type      = 'sine';
      osc.frequency.setValueAtTime(880, _audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(440, _audioCtx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.15, _audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, _audioCtx.currentTime + 0.3);
      osc.start(_audioCtx.currentTime);
      osc.stop(_audioCtx.currentTime + 0.3);
    } catch (e) {
      // Audio not available — silently skip
    }
  }

  // ── Show score bonus ──────────────────────────────────────
  function _showBonus() {
    // Use game HUD if available
    if (window.HUD && typeof window.HUD.showKillFeedMessage === 'function') {
      window.HUD.showKillFeedMessage('TRACKED KILL +' + BONUS_SCORE);
      return;
    }
    // Fallback: show a brief DOM notification
    var el       = document.createElement('div');
    el.innerText = 'TRACKED KILL +' + BONUS_SCORE;
    el.style.position   = 'fixed';
    el.style.top        = '40%';
    el.style.left       = '50%';
    el.style.transform  = 'translate(-50%, -50%)';
    el.style.color      = '#ff4444';
    el.style.fontFamily = 'monospace, sans-serif';
    el.style.fontSize   = '26px';
    el.style.fontWeight = 'bold';
    el.style.textShadow = '0 0 10px #ff0000';
    el.style.zIndex     = '99999';
    el.style.pointerEvents = 'none';
    document.body.appendChild(el);
    setTimeout(function () {
      if (el.parentNode) el.parentNode.removeChild(el);
    }, 2000);
  }

  // ── Per-frame update of enemy bleeding ───────────────────
  function _tickEnemies(dt) {
    if (!window.Enemies || typeof window.Enemies.getAll !== 'function') return;

    var all = window.Enemies.getAll();
    for (var i = 0; i < all.length; i++) {
      var e = all[i];
      if (!e || !e.alive) continue;
      if (e.hp === undefined || e.maxHp === undefined) continue;

      var hpFrac = e.hp / e.maxHp;
      if (hpFrac >= HP_THRESHOLD) continue;

      var id = _assignId(e);
      if (!_enemyState[id]) {
        _enemyState[id] = { timer: 0, dropCount: 0 };
      }

      var state = _enemyState[id];
      state.timer += dt;

      if (state.timer >= DROP_INTERVAL) {
        state.timer -= DROP_INTERVAL;

        var pos = e.mesh ? e.mesh.position : (e.position || null);
        if (!pos) continue;

        var dropIdx = _placeDrop(
          pos.x + _rnd(-0.05, 0.05),
          pos.z + _rnd(-0.05, 0.05),
          id
        );
        state.dropCount++;

        // Attach pulse light if tracker mode is on (newest drop only)
        if (_trackerActive) {
          _attachPulseLight(dropIdx);
        }
      }
    }
  }

  // ── Check if player is near a drop (for "followed" tally) ─
  function _checkFollowing(px, pz) {
    var NEAR2 = 1.5 * 1.5; // 1.5 units counts as "followed"
    for (var i = 0; i < _drops.length; i++) {
      var d = _drops[i];
      if (!d || !d.active || !d.mesh || !d.enemyId) continue;
      var dx   = d.mesh.position.x - px;
      var dz   = d.mesh.position.z - pz;
      if (dx * dx + dz * dz < NEAR2) {
        _followedDrops[d.enemyId] = (_followedDrops[d.enemyId] || 0) + 1;
        // Deactivate so we don't count same drop twice
        d.active = false;
        d.mesh.visible = false;
        if (d.light && _scene) {
          _scene.remove(d.light);
          d.light = null;
        }
      }
    }
  }

  // ── Death cleanup: accelerate fade on drops for that enemy ─
  function _onEnemyDeath(enemy) {
    if (!enemy || !enemy._btId) return;
    var id = enemy._btId;

    // Award tracked kill bonus if applicable
    var followed = _followedDrops[id] || 0;
    if (followed >= TRACK_THRESHOLD) {
      _showBonus();
      if (window.GameManager && typeof window.GameManager.addScore === 'function') {
        window.GameManager.addScore(BONUS_SCORE);
      }
    }

    // Accelerate fade for all drops belonging to this enemy
    for (var i = 0; i < _drops.length; i++) {
      var d = _drops[i];
      if (!d || !d.active || d.enemyId !== id) continue;
      // Reduce remaining lifetime to force 2s fade
      // We do this by setting fadeDur to DEATH_FADE_TIME and resetting timer
      // to DROP_LIFETIME so fade kicks in immediately.
      d.timer   = d.fadeDur;
      d.fadeDur = DEATH_FADE_TIME;
    }

    delete _followedDrops[id];
    delete _enemyState[id];
  }

  // ── Per-frame fade logic ──────────────────────────────────
  function _tickFades(dt) {
    for (var i = 0; i < _drops.length; i++) {
      var d = _drops[i];
      if (!d || !d.active) continue;

      d.timer += dt;

      if (d.timer >= d.fadeDur) {
        // In fade window
        var elapsed = d.timer - d.fadeDur;
        var fadeLen = (d.fadeDur === DEATH_FADE_TIME)
          ? DEATH_FADE_TIME
          : 3.0; // 3s normal fade window
        var t = elapsed / fadeLen;

        if (t >= 1.0) {
          // Fully faded
          if (d.mesh) {
            if (_scene) _scene.remove(d.mesh);
            if (d.mesh.geometry) d.mesh.geometry.dispose();
            if (d.mesh.material) d.mesh.material.dispose();
            d.mesh = null;
          }
          if (d.light) {
            if (_scene) _scene.remove(d.light);
            d.light = null;
          }
          d.active  = false;
          d.enemyId = null;
          continue;
        }

        // Lerp opacity
        if (d.mesh && d.mesh.material) {
          d.mesh.material.opacity = d.baseOpacity * (1.0 - t);
        }
      }
    }
  }

  // ── Pulse animation for highlight light ──────────────────
  function _tickPulse(dt) {
    if (!_pulseLight || !_trackerActive) return;
    _pulsePhase += dt * 4.0; // 4 Hz pulse
    _pulseLight.intensity = 2.0 + Math.sin(_pulsePhase) * 1.5;
  }

  // ── Get player position from game globals ─────────────────
  function _getPlayerPos() {
    if (window.GameManager && window.GameManager.player) {
      var p = window.GameManager.player;
      var pos = p.position || (p.mesh && p.mesh.position) || null;
      if (pos) return { x: pos.x, z: pos.z };
    }
    if (window.player) {
      var pp = window.player.position || (window.player.mesh && window.player.mesh.position) || null;
      if (pp) return { x: pp.x, z: pp.z };
    }
    return null;
  }

  // ── Check dead enemies each frame ─────────────────────────
  function _tickDeaths() {
    if (!window.Enemies || typeof window.Enemies.getAll !== 'function') return;
    // We track which IDs are alive in enemyState; when the enemy disappears
    // from the alive list (alive===false or not in list), trigger death cleanup.
    // To avoid O(n^2) we check all states and confirm enemy still alive.
    for (var id in _enemyState) {
      if (!_enemyState.hasOwnProperty(id)) continue;
      // We don't hold a reference to the enemy object, only the ID.
      // The game's Enemies.getAll() only returns alive enemies, so if the id
      // is no longer found we treat it as dead.
      var found = false;
      var all   = window.Enemies.getAll();
      for (var i = 0; i < all.length; i++) {
        if (all[i]._btId == id) { found = true; break; }
      }
      if (!found) {
        _onEnemyDeath({ _btId: parseInt(id, 10) });
      }
    }
  }

  // ── Key listener ──────────────────────────────────────────
  function _onKeyDown(e) {
    // Alt+T
    if (e.altKey && (e.key === 't' || e.key === 'T')) {
      _trackerActive = !_trackerActive;
      _showHUD(_trackerActive);
      if (!_trackerActive && _pulseLight) {
        if (_scene) _scene.remove(_pulseLight);
        _pulseLight = null;
      }
    }
  }

  // ── Public: init ──────────────────────────────────────────
  function init(scene, camera) {
    _scene        = scene;
    _camera       = camera || null;
    _initialized  = true;
    _drops        = [];
    _enemyState   = {};
    _followedDrops = {};
    _btIdCounter  = 0;
    _trackerActive = false;
    _pingTimer    = 0;
    _pulsePhase   = 0;
    _pulseLight   = null;

    _createHUD();
    _createArrow();
    _showHUD(false);

    document.addEventListener('keydown', _onKeyDown);

    console.log('[BloodTrail] initialized — tracker ready (Alt+T to toggle)');
  }

  // ── Public: update ────────────────────────────────────────
  function update(dt) {
    if (!_initialized) return;
    if (!_getBleedEnabled()) return;
    if (!dt || dt <= 0) dt = 0.016;

    _tickDeaths();
    _tickEnemies(dt);
    _tickFades(dt);
    _tickPulse(dt);

    var playerPos = _getPlayerPos();
    if (playerPos) {
      _checkFollowing(playerPos.x, playerPos.z);
      if (_trackerActive) {
        _updateArrow(playerPos.x, playerPos.z);

        // Compass ping toward nearest wounded enemy
        _pingTimer += dt;
        if (_pingTimer >= PING_INTERVAL) {
          _pingTimer = 0;
          // Only ping if there are active drops
          var hasDrops = false;
          for (var i = 0; i < _drops.length; i++) {
            if (_drops[i] && _drops[i].active) { hasDrops = true; break; }
          }
          if (hasDrops) _emitPing();
        }
      }
    }
  }

  // ── Public: reset ─────────────────────────────────────────
  function reset() {
    // Remove all drops from scene
    for (var i = 0; i < _drops.length; i++) {
      var d = _drops[i];
      if (!d) continue;
      if (d.mesh) {
        if (_scene) _scene.remove(d.mesh);
        if (d.mesh.geometry) d.mesh.geometry.dispose();
        if (d.mesh.material) d.mesh.material.dispose();
        d.mesh = null;
      }
      if (d.light) {
        if (_scene) _scene.remove(d.light);
        d.light = null;
      }
    }
    _drops        = [];
    _enemyState   = {};
    _followedDrops = {};
    _btIdCounter  = 0;
    _pingTimer    = 0;
    _pulsePhase   = 0;

    if (_pulseLight) {
      if (_scene) _scene.remove(_pulseLight);
      _pulseLight = null;
    }

    _trackerActive = false;
    _showHUD(false);
  }

  return {
    init:   init,
    update: update,
    reset:  reset
  };

})();

;
} catch(_e){ if(window.console&&console.warn)console.warn("mod fail blood-trail.js",_e&&_e.message); }
/* === enemy-reinforcements.js === */
try {
;
/* ════════════════════════════════════════════════════════════════════
 *  ENEMY REINFORCEMENTS — enemies call for backup mid-wave
 *  ─────────────────────────────────────────────────────────────────
 *  Trigger conditions:
 *    1. >50% of wave enemies killed → 40% chance
 *    2. Player killstreak reaches 8  → always
 *    3. Every 90s during long waves  → chance
 *  Only one reinforcement group per wave.
 *
 *  Public API:
 *    EnemyReinforcements.init(scene)
 *    EnemyReinforcements.update(delta, waveNum, enemiesKilled, waveTotal)
 *    EnemyReinforcements.checkReinforcementTrigger(reason, waveNum)
 *    EnemyReinforcements.trySpawn(scene, waveNum)
 *    EnemyReinforcements.reset()
 *
 *  Window hooks:
 *    window._checkReinforcements(reason, waveNum) — called after each kill
 *    window._onReinforcementsSpawned              — callback after spawn
 * ════════════════════════════════════════════════════════════════════ */
window.EnemyReinforcements = (function () {
  'use strict';

  /* ── internal state ──────────────────────────────────────────────── */
  var _scene              = null;
  var _triggeredThisWave  = false;   // only one group per wave
  var _countdownActive    = false;
  var _countdownTimer     = 0;
  var _countdownStep      = 5;       // seconds until arrival
  var _pendingWaveNum     = 1;
  var _longWaveTimer      = 0;       // accumulates seconds for trigger 3
  var _hudEl              = null;    // warning banner element
  var _countdownEl        = null;    // countdown element
  var _directionEl        = null;    // direction arrow element
  var _beamLights         = [];      // VFX beam PointLights with lifetime
  var _newArrivalLabels   = [];      // { sprite, timer } for "NEW ARRIVAL" labels

  /* ── constants ───────────────────────────────────────────────────── */
  var SPAWN_RADIUS        = 50;
  var COUNTDOWN_DURATION  = 5.0;
  var LONG_WAVE_INTERVAL  = 90;      // seconds between periodic checks
  var KILLSTREAK_TRIGGER  = 8;
  var MAJORITY_CHANCE     = 0.40;
  var LONG_WAVE_CHANCE    = 0.30;
  var BEAM_LIFETIME       = 2.0;     // seconds beam stays visible
  var LABEL_LIFETIME      = 2.0;     // seconds "NEW ARRIVAL" label shows

  /* ════════════════════════════════════════════════════════════════
     COMPASS DIRECTION HELPER
  ════════════════════════════════════════════════════════════════ */
  function _angleToCompass(angle) {
    // angle in radians (Math.atan2 style, Z is "north" at 0)
    var deg = (angle * 180 / Math.PI + 360) % 360;
    if (deg >= 337.5 || deg < 22.5)   return 'NORTH';
    if (deg < 67.5)                    return 'NORTH-EAST';
    if (deg < 112.5)                   return 'EAST';
    if (deg < 157.5)                   return 'SOUTH-EAST';
    if (deg < 202.5)                   return 'SOUTH';
    if (deg < 247.5)                   return 'SOUTH-WEST';
    if (deg < 292.5)                   return 'WEST';
    return 'NORTH-WEST';
  }

  function _angleToArrow(angle) {
    var deg = (angle * 180 / Math.PI + 360) % 360;
    if (deg >= 337.5 || deg < 22.5)   return '↑';
    if (deg < 67.5)                    return '↗';
    if (deg < 112.5)                   return '→';
    if (deg < 157.5)                   return '↘';
    if (deg < 202.5)                   return '↓';
    if (deg < 247.5)                   return '↙';
    if (deg < 292.5)                   return '←';
    return '↖';
  }

  /* ════════════════════════════════════════════════════════════════
     HUD ELEMENTS
  ════════════════════════════════════════════════════════════════ */
  function _ensureStyles() {
    if (document.getElementById('reinf-styles')) return;
    var style = document.createElement('style');
    style.id = 'reinf-styles';
    style.textContent = [
      '@keyframes reinfPulse {',
      '  0%,100% { opacity:1; text-shadow:0 0 12px rgba(255,40,40,0.9); }',
      '  50%     { opacity:0.5; text-shadow:0 0 4px rgba(255,40,40,0.3); }',
      '}',
      '#reinf-warning {',
      '  position:fixed;top:18%;left:50%;transform:translateX(-50%);',
      '  font-family:monospace;font-size:20px;font-weight:bold;',
      '  color:#ff2222;pointer-events:none;z-index:8500;',
      '  animation:reinfPulse 0.6s ease-in-out infinite;',
      '  text-align:center;',
      '}',
      '#reinf-countdown {',
      '  position:fixed;top:24%;left:50%;transform:translateX(-50%);',
      '  font-family:monospace;font-size:16px;font-weight:bold;',
      '  color:#ffaa00;pointer-events:none;z-index:8500;',
      '  text-align:center;',
      '}',
      '#reinf-direction {',
      '  position:fixed;top:29%;left:50%;transform:translateX(-50%);',
      '  font-family:monospace;font-size:13px;',
      '  color:#ff8888;pointer-events:none;z-index:8500;',
      '  text-align:center;',
      '}',
    ].join('');
    document.head.appendChild(style);
  }

  function _showWarningHUD(compassDir, arrowChar) {
    _ensureStyles();

    // Warning banner
    if (!_hudEl) {
      _hudEl = document.createElement('div');
      _hudEl.id = 'reinf-warning';
      document.body.appendChild(_hudEl);
    }
    _hudEl.textContent = '⚠ ENEMY REINFORCEMENTS INBOUND';
    _hudEl.style.display = 'block';

    // Countdown
    if (!_countdownEl) {
      _countdownEl = document.createElement('div');
      _countdownEl.id = 'reinf-countdown';
      document.body.appendChild(_countdownEl);
    }
    _countdownEl.textContent = 'REINFORCEMENTS IN 5...';
    _countdownEl.style.display = 'block';

    // Direction
    if (!_directionEl) {
      _directionEl = document.createElement('div');
      _directionEl.id = 'reinf-direction';
      document.body.appendChild(_directionEl);
    }
    _directionEl.textContent = 'REINFORCEMENTS FROM: ' + compassDir + '  ' + arrowChar;
    _directionEl.style.display = 'block';
  }

  function _updateCountdownHUD(secondsLeft) {
    if (!_countdownEl) return;
    var s = Math.ceil(secondsLeft);
    if (s <= 0) {
      _countdownEl.textContent = 'REINFORCEMENTS ARRIVING!';
    } else {
      var dots = '';
      for (var i = secondsLeft; i <= 5; i++) dots += '...';
      _countdownEl.textContent = 'REINFORCEMENTS IN ' + s + dots;
    }
  }

  function _hideWarningHUD() {
    if (_hudEl)       { _hudEl.style.display = 'none'; }
    if (_countdownEl) { _countdownEl.style.display = 'none'; }
    // Keep direction visible for a moment then fade
    if (_directionEl) {
      setTimeout(function () {
        if (_directionEl) _directionEl.style.display = 'none';
      }, 3000);
    }
  }

  function _showStrategyTip() {
    var msg = (window.RadioSupport || window.FO_system)
      ? 'TIP: Eliminate the radio operator to stop reinforcements'
      : 'Hold position — they\'re coming in force';

    var el = document.createElement('div');
    el.style.cssText = [
      'position:fixed;bottom:160px;left:50%;transform:translateX(-50%);',
      'font-family:monospace;font-size:12px;color:#ffcc55;',
      'background:rgba(0,0,0,0.65);padding:4px 12px;border-radius:4px;',
      'pointer-events:none;z-index:8400;',
      'opacity:1;transition:opacity 0.6s;',
    ].join('');
    el.textContent = msg;
    document.body.appendChild(el);
    setTimeout(function () {
      el.style.opacity = '0';
      setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 700);
    }, 4000);
  }

  /* ════════════════════════════════════════════════════════════════
     VFX — INSERTION BEAM
  ════════════════════════════════════════════════════════════════ */
  function _spawnInsertionBeam(x, z) {
    if (!_scene || typeof THREE === 'undefined') return;

    var light = new THREE.PointLight(0xaaddff, 3.0, 18);
    light.position.set(x, 5, z);
    _scene.add(light);

    // Visual column geometry (thin cylinder)
    var beamGeo = new THREE.CylinderGeometry(0.15, 0.15, 14, 8);
    var beamMat = new THREE.MeshBasicMaterial({
      color: 0xaaddff,
      transparent: true,
      opacity: 0.55,
    });
    var beamMesh = new THREE.Mesh(beamGeo, beamMat);
    beamMesh.position.set(x, 7, z);
    _scene.add(beamMesh);

    _beamLights.push({
      light:    light,
      mesh:     beamMesh,
      mat:      beamMat,
      timer:    BEAM_LIFETIME,
    });
  }

  /* ════════════════════════════════════════════════════════════════
     VFX — NEW ARRIVAL LABEL
  ════════════════════════════════════════════════════════════════ */
  function _spawnNewArrivalLabel(enemy) {
    if (!_scene || typeof THREE === 'undefined') return;
    if (!enemy || !enemy.mesh) return;

    var canvas = document.createElement('canvas');
    canvas.width  = 128;
    canvas.height = 32;
    var ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, 128, 32);
    ctx.fillStyle  = 'rgba(0,0,0,0.55)';
    ctx.fillRect(0, 0, 128, 32);
    ctx.fillStyle  = '#00ffff';
    ctx.font       = 'bold 12px monospace';
    ctx.textAlign  = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('NEW ARRIVAL', 64, 16);

    var tex = new THREE.CanvasTexture(canvas);
    var mat = new THREE.SpriteMaterial({ map: tex, depthTest: false, transparent: true });
    var sprite = new THREE.Sprite(mat);
    sprite.scale.set(2.0, 0.5, 1);

    // Position above enemy head
    var offset = new THREE.Object3D();
    offset.position.set(0, 2.8, 0);
    enemy.mesh.add(offset);
    offset.add(sprite);

    _newArrivalLabels.push({
      sprite:   sprite,
      mat:      mat,
      tex:      tex,
      parent:   offset,
      enemyMesh: enemy.mesh,
      timer:    LABEL_LIFETIME,
    });
  }

  /* ════════════════════════════════════════════════════════════════
     REINFORCEMENT COMPOSITION
  ════════════════════════════════════════════════════════════════ */
  function _getComposition(waveNum) {
    // Boss waves: multiples of 5 (wave 5, 10, 15…)
    if (waveNum > 0 && waveNum % 5 === 0) {
      return [
        { type: 'ELITE', count: 3 },
      ];
    }
    if (waveNum >= 7) {
      return [
        { type: 'CONSCRIPT', count: 2 },
        { type: 'ARMORED',   count: 1 },
        { type: 'SNIPER',    count: 1 },
      ];
    }
    if (waveNum >= 4) {
      return [
        { type: 'CONSCRIPT', count: 3 },
        { type: 'ARMORED',   count: 1 },
      ];
    }
    // Waves 1-3
    return [
      { type: 'CONSCRIPT', count: 2 },
    ];
  }

  /* ════════════════════════════════════════════════════════════════
     FALLBACK MESH — basic soldier group if Enemies.spawnSingle unavailable
  ════════════════════════════════════════════════════════════════ */
  function _buildFallbackSoldier(pos) {
    if (typeof THREE === 'undefined') return null;
    var group = new THREE.Group();

    var bodyGeo = new THREE.BoxGeometry(0.6, 0.9, 0.35);
    var bodyMat = new THREE.MeshLambertMaterial({ color: 0x4a5640 });
    var body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 0.45;
    group.add(body);

    var headGeo = new THREE.BoxGeometry(0.35, 0.35, 0.35);
    var headMat = new THREE.MeshLambertMaterial({ color: 0x6b5b45 });
    var head = new THREE.Mesh(headGeo, headMat);
    head.position.y = 1.07;
    group.add(head);

    group.position.set(pos.x, 0, pos.z);
    return group;
  }

  /* ════════════════════════════════════════════════════════════════
     SPAWN
  ════════════════════════════════════════════════════════════════ */
  function trySpawn(scene, waveNum) {
    if (!scene) scene = _scene;
    if (!scene) return;
    waveNum = waveNum || 1;

    var angle  = Math.random() * Math.PI * 2;
    var spawnX = Math.cos(angle) * SPAWN_RADIUS;
    var spawnZ = Math.sin(angle) * SPAWN_RADIUS;

    var compass = _angleToCompass(angle);
    var arrow   = _angleToArrow(angle);

    // VFX beam at spawn point
    _spawnInsertionBeam(spawnX, spawnZ);

    var composition = _getComposition(waveNum);
    var spawnedEnemies = [];

    for (var c = 0; c < composition.length; c++) {
      var group = composition[c];
      for (var n = 0; n < group.count; n++) {
        var jitterX = (Math.random() - 0.5) * 6;
        var jitterZ = (Math.random() - 0.5) * 6;
        var pos = { x: spawnX + jitterX, z: spawnZ + jitterZ };

        var enemy = null;

        // Use Enemies.spawnSingle if available
        if (window.Enemies && typeof window.Enemies.spawnSingle === 'function') {
          try {
            enemy = window.Enemies.spawnSingle(group.type, pos);
          } catch (e) {
            enemy = null;
          }
        }

        // Fallback: build a minimal mesh and add to scene
        if (!enemy) {
          var mesh = _buildFallbackSoldier(pos);
          if (mesh) {
            scene.add(mesh);
            enemy = { mesh: mesh, _isFallback: true };
          }
        }

        if (enemy) {
          enemy._isReinforcement = true;   // score bonus flag for game-manager
          spawnedEnemies.push(enemy);
          // Attach "NEW ARRIVAL" label
          _spawnNewArrivalLabel(enemy);
        }
      }
    }

    // Strategy tip
    _showStrategyTip();

    // Callback hook
    if (typeof window._onReinforcementsSpawned === 'function') {
      window._onReinforcementsSpawned(spawnedEnemies);
    }

    return spawnedEnemies;
  }

  /* ════════════════════════════════════════════════════════════════
     TRIGGER CHECK
  ════════════════════════════════════════════════════════════════ */
  function checkReinforcementTrigger(reason, waveNum) {
    if (_triggeredThisWave)  return false;
    if (_countdownActive)    return false;

    var shouldTrigger = false;

    if (reason === 'majority' && Math.random() < MAJORITY_CHANCE) {
      shouldTrigger = true;
    } else if (reason === 'killstreak') {
      shouldTrigger = true;   // always
    } else if (reason === 'periodic' && Math.random() < LONG_WAVE_CHANCE) {
      shouldTrigger = true;
    }

    if (!shouldTrigger) return false;

    _triggeredThisWave = true;
    _pendingWaveNum    = waveNum || 1;
    _countdownActive   = true;
    _countdownTimer    = COUNTDOWN_DURATION;

    // Audio cue
    if (window.AudioSystem && typeof window.AudioSystem.playRadioChatter === 'function') {
      window.AudioSystem.playRadioChatter();
    }

    // Compute direction for HUD (random since we choose angle inside trySpawn,
    // but we pre-compute here for the warning display)
    var previewAngle   = Math.random() * Math.PI * 2;
    var previewCompass = _angleToCompass(previewAngle);
    var previewArrow   = _angleToArrow(previewAngle);
    // Store so spawn uses same direction — override trySpawn's internal angle:
    _pendingAngle      = previewAngle;

    _showWarningHUD(previewCompass, previewArrow);

    return true;
  }

  // Stored angle so countdown and spawn use the same direction
  var _pendingAngle = 0;

  /* ════════════════════════════════════════════════════════════════
     INIT
  ════════════════════════════════════════════════════════════════ */
  function init(scene) {
    _scene = scene;
    reset();

    // Expose global hook for game-manager to call after each kill
    window._checkReinforcements = function (reason, waveNum) {
      return checkReinforcementTrigger(reason, waveNum);
    };

    // Default spawned callback — can be overridden externally
    if (!window._onReinforcementsSpawned) {
      window._onReinforcementsSpawned = null;
    }
  }

  /* ════════════════════════════════════════════════════════════════
     UPDATE (call every frame with delta seconds)
  ════════════════════════════════════════════════════════════════ */
  function update(delta, waveNum, enemiesKilled, waveTotal) {
    delta = delta || 0;

    // ── Long-wave periodic trigger ──────────────────────────────
    if (!_triggeredThisWave && !_countdownActive) {
      _longWaveTimer += delta;
      if (_longWaveTimer >= LONG_WAVE_INTERVAL) {
        _longWaveTimer = 0;
        checkReinforcementTrigger('periodic', waveNum);
      }
    }

    // ── Killstreak check ─────────────────────────────────────────
    if (!_triggeredThisWave && !_countdownActive) {
      var streak = (window.KillStreak && typeof window.KillStreak.getStreak === 'function')
        ? window.KillStreak.getStreak()
        : (window._currentKillStreak || 0);
      if (streak >= KILLSTREAK_TRIGGER) {
        checkReinforcementTrigger('killstreak', waveNum);
      }
    }

    // ── Majority-killed check ────────────────────────────────────
    if (!_triggeredThisWave && !_countdownActive) {
      if (waveTotal > 0 && enemiesKilled > 0 && enemiesKilled > waveTotal * 0.5) {
        checkReinforcementTrigger('majority', waveNum);
      }
    }

    // ── Countdown tick ───────────────────────────────────────────
    if (_countdownActive) {
      _countdownTimer -= delta;
      _updateCountdownHUD(_countdownTimer);

      if (_countdownTimer <= 0) {
        _countdownActive = false;
        _hideWarningHUD();
        // Spawn using pre-computed angle
        _spawnWithAngle(_scene, _pendingWaveNum, _pendingAngle);
      }
    }

    // ── Beam VFX lifetime ────────────────────────────────────────
    for (var b = _beamLights.length - 1; b >= 0; b--) {
      var beam = _beamLights[b];
      beam.timer -= delta;
      if (beam.timer <= 0) {
        if (_scene) {
          _scene.remove(beam.light);
          _scene.remove(beam.mesh);
        }
        beam.mat.dispose();
        _beamLights.splice(b, 1);
      } else {
        // Pulse opacity
        var fade = beam.timer / BEAM_LIFETIME;
        beam.mat.opacity = 0.55 * fade;
        beam.light.intensity = 3.0 * fade;
      }
    }

    // ── New-arrival label lifetime ───────────────────────────────
    for (var l = _newArrivalLabels.length - 1; l >= 0; l--) {
      var lbl = _newArrivalLabels[l];
      lbl.timer -= delta;
      if (lbl.timer <= 0) {
        if (lbl.enemyMesh && lbl.parent && lbl.parent.parent) {
          lbl.enemyMesh.remove(lbl.parent);
        }
        lbl.mat.dispose();
        lbl.tex.dispose();
        _newArrivalLabels.splice(l, 1);
      } else {
        // Fade out in last 0.5s
        var alpha = Math.min(1, lbl.timer / 0.5);
        lbl.mat.opacity = alpha;
      }
    }
  }

  /* Internal version of trySpawn that uses a pre-computed angle */
  function _spawnWithAngle(scene, waveNum, angle) {
    if (!scene) scene = _scene;
    if (!scene) return;
    waveNum = waveNum || 1;

    var spawnX = Math.cos(angle) * SPAWN_RADIUS;
    var spawnZ = Math.sin(angle) * SPAWN_RADIUS;

    var compass = _angleToCompass(angle);
    var arrow   = _angleToArrow(angle);

    _spawnInsertionBeam(spawnX, spawnZ);

    var composition = _getComposition(waveNum);
    var spawnedEnemies = [];

    for (var c = 0; c < composition.length; c++) {
      var group = composition[c];
      for (var n = 0; n < group.count; n++) {
        var jitterX = (Math.random() - 0.5) * 6;
        var jitterZ = (Math.random() - 0.5) * 6;
        var pos = { x: spawnX + jitterX, z: spawnZ + jitterZ };

        var enemy = null;

        if (window.Enemies && typeof window.Enemies.spawnSingle === 'function') {
          try {
            enemy = window.Enemies.spawnSingle(group.type, pos);
          } catch (e) {
            enemy = null;
          }
        }

        if (!enemy) {
          var mesh = _buildFallbackSoldier(pos);
          if (mesh) {
            scene.add(mesh);
            enemy = { mesh: mesh, _isFallback: true };
          }
        }

        if (enemy) {
          enemy._isReinforcement = true;
          spawnedEnemies.push(enemy);
          _spawnNewArrivalLabel(enemy);
        }
      }
    }

    _showStrategyTip();

    if (typeof window._onReinforcementsSpawned === 'function') {
      window._onReinforcementsSpawned(spawnedEnemies);
    }

    return spawnedEnemies;
  }

  /* ════════════════════════════════════════════════════════════════
     RESET  (call between waves)
  ════════════════════════════════════════════════════════════════ */
  function reset() {
    _triggeredThisWave = false;
    _countdownActive   = false;
    _countdownTimer    = 0;
    _longWaveTimer     = 0;
    _pendingWaveNum    = 1;
    _pendingAngle      = 0;

    // Clean up beam lights
    for (var b = 0; b < _beamLights.length; b++) {
      var beam = _beamLights[b];
      if (_scene) {
        _scene.remove(beam.light);
        _scene.remove(beam.mesh);
      }
      beam.mat.dispose();
    }
    _beamLights.length = 0;

    // Clean up labels
    for (var l = 0; l < _newArrivalLabels.length; l++) {
      var lbl = _newArrivalLabels[l];
      if (lbl.enemyMesh && lbl.parent && lbl.parent.parent) {
        lbl.enemyMesh.remove(lbl.parent);
      }
      lbl.mat.dispose();
      lbl.tex.dispose();
    }
    _newArrivalLabels.length = 0;

    _hideWarningHUD();
  }

  /* ════════════════════════════════════════════════════════════════
     PUBLIC API
  ════════════════════════════════════════════════════════════════ */
  return {
    init:                       init,
    update:                     update,
    checkReinforcementTrigger:  checkReinforcementTrigger,
    trySpawn:                   trySpawn,
    reset:                      reset,
  };

})();

if (typeof window !== 'undefined') window.EnemyReinforcements = window.EnemyReinforcements;

;
} catch(_e){ if(window.console&&console.warn)console.warn("mod fail enemy-reinforcements.js",_e&&_e.message); }
/* === capture-points.js === */
try {
;
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

;
} catch(_e){ if(window.console&&console.warn)console.warn("mod fail capture-points.js",_e&&_e.message); }
/* === magazine-system.js === */
try {
;
/**
 * magazine-system.js — Realistic Magazine Management for OccupantKiller
 *
 * Tracks individual magazines per weapon. Partial reloads return the
 * partially-spent mag to the stash rather than discarding remaining rounds.
 *
 * Integrates via global hooks:
 *   window._onReloadForMags(weaponType, currentAmmo)  → new loaded round count
 *   window._onAmmoPickupForMags(weaponType, amount)
 *   window._onWeaponSwitchForMags(weaponType)
 */
window.MagazineSystem = (function () {
  'use strict';

  // ── Per-weapon magazine capacity config ──────────────────────────────────
  var MAG_SIZE = {
    // Assault / NATO
    AK74:          30,
    AK12:          30,
    M4A1:          30,
    SCARH:         20,
    VSS:           20,
    // SMG
    MP5:           30,
    P90:           50,
    // LMG / HMG / Minigun
    RPK74:         45,
    PKM:          100,
    MG3:          120,
    DSHK:          50,
    MINIGUN:      500,
    GATLING:      200,
    // Sniper / DMR
    SVD:           10,
    BARRETTM82:    10,
    AXMC:           5,
    // Pistols
    MAKAROV:        8,
    GLOCK:         17,
    // AT / Rockets
    RPG7:           1,
    NLAW:           1,
    STUGNA:         1,
    JAVELIN:        1,
    IGLA:           1,
    AT4:            1,
    STINGER:        1,
    FLAMETHROWER:   1,
    // Grenade / Special
    GP25:           1,
    AGS17:          6,
    CLAYMORE:       1,
    SMOKE:          1,
    FLASHBANG:      1,
    CROSSBOW:       1,
    MOLOTOV:        1,
    // Shotguns
    DOUBLEBARREL:   2,
    KS23:           3,
  };

  // ── Initial reserve magazine counts on first equip ───────────────────────
  var INITIAL_MAGS = {
    AK74:          4,
    AK12:          4,
    M4A1:          4,
    SCARH:         4,
    VSS:           4,
    MP5:           4,
    P90:           4,
    RPK74:         3,
    PKM:           3,
    MG3:           2,
    DSHK:          2,
    MINIGUN:       2,
    GATLING:       2,
    SVD:           3,
    BARRETTM82:    3,
    AXMC:          3,
    MAKAROV:       4,
    GLOCK:         4,
    RPG7:          2,
    NLAW:          2,
    STUGNA:        2,
    JAVELIN:       2,
    IGLA:          2,
    AT4:           2,
    STINGER:       2,
    FLAMETHROWER:  2,
    GP25:          4,
    AGS17:         3,
    CLAYMORE:      3,
    SMOKE:         3,
    FLASHBANG:     3,
    CROSSBOW:      4,
    MOLOTOV:       4,
    DOUBLEBARREL:  4,
    KS23:          3,
  };

  // ── State ─────────────────────────────────────────────────────────────────
  // _mags[weaponId] = array of round counts, e.g. [30, 30, 17, 22]
  var _mags = {};

  // Track which weapons have been initialised
  var _inited = {};

  // Current weapon being tracked
  var _currentWeapon = null;

  // HUD element for magazine count display (injected once)
  var _magHudEl = null;
  var _magHudStylesInjected = false;

  // Toast de-duplicate timer
  var _lastToastKey = '';
  var _toastDebounce = null;

  // ── Helpers ───────────────────────────────────────────────────────────────
  function _magSize(weaponType) {
    return MAG_SIZE[weaponType] || 30;
  }

  function _initialMagCount(weaponType) {
    return INITIAL_MAGS[weaponType] || 4;
  }

  /** Ensure the weapon has an entry in _mags.  Called on first equip. */
  function _ensureInit(weaponType) {
    if (_inited[weaponType]) return;
    _inited[weaponType] = true;
    var size = _magSize(weaponType);
    var count = _initialMagCount(weaponType);
    _mags[weaponType] = [];
    for (var i = 0; i < count; i++) {
      _mags[weaponType].push(size);
    }
  }

  /** Total rounds across all stash mags for a weapon */
  function _totalReserve(weaponType) {
    var stash = _mags[weaponType];
    if (!stash) return 0;
    var total = 0;
    for (var i = 0; i < stash.length; i++) {
      total += stash[i];
    }
    return total;
  }

  /** Show a toast via HUD if available, with deduplication */
  function _toast(msg, durationMs, color) {
    var key = msg;
    if (key === _lastToastKey) return;
    _lastToastKey = key;
    if (_toastDebounce) clearTimeout(_toastDebounce);
    _toastDebounce = setTimeout(function () { _lastToastKey = ''; }, durationMs || 2000);
    if (typeof window !== 'undefined' && window.HUD && window.HUD.showToast) {
      window.HUD.showToast(msg, durationMs || 2000, color || '#ffffff');
    }
  }

  // ── HUD injection ─────────────────────────────────────────────────────────
  function _injectMagHudStyles() {
    if (_magHudStylesInjected) return;
    _magHudStylesInjected = true;
    var st = document.createElement('style');
    st.id = 'mag-system-styles';
    st.textContent = [
      '#mag-count-hud { font-family:monospace; font-size:11px; letter-spacing:1px;',
      '  color:#44ff44; margin-top:3px; min-height:14px; pointer-events:none; }',
      '#mag-count-hud.mag-yellow { color:#ffcc44; }',
      '#mag-count-hud.mag-red    { color:#ff4444; }',
      '#mag-count-hud.mag-zero   { color:#ff2200; animation: magBlink 0.45s infinite; }',
      '@keyframes magBlink { 0%,100%{opacity:1} 50%{opacity:0.15} }',
    ].join('');
    document.head.appendChild(st);
  }

  function _ensureMagHud() {
    if (_magHudEl) return;
    if (typeof document === 'undefined') return;
    _injectMagHudStyles();
    // Attach below the ammo-reserve element if it exists
    var ammoSection = document.getElementById('ammo-section');
    if (!ammoSection) return;
    _magHudEl = document.createElement('div');
    _magHudEl.id = 'mag-count-hud';
    ammoSection.appendChild(_magHudEl);
  }

  /** Render magazine icons + count */
  function _updateMagHud(weaponType, currentAmmo) {
    _ensureMagHud();
    if (!_magHudEl) return;

    var stash = _mags[weaponType] || [];
    var size  = _magSize(weaponType);
    var count = stash.length;

    // Build pip string: ■ = full (>= magSize), □ = partial, up to 4 shown
    var pips = '';
    var shown = Math.min(count, 4);
    for (var i = 0; i < shown; i++) {
      pips += (stash[i] >= size) ? '■' : '□';
    }
    if (count > 4) pips += '+';

    var label = count + ' MAG' + (count !== 1 ? 'S' : '');
    _magHudEl.textContent = '[' + pips + '] ' + label;

    // Low-ammo indicator for current loaded rounds
    if (typeof currentAmmo === 'number' && currentAmmo < 5 && currentAmmo > 0) {
      _magHudEl.textContent += '  LOW AMMO';
    }

    // Colour coding
    _magHudEl.className = '';
    if (count === 0) {
      _magHudEl.classList.add('mag-zero');
    } else if (count === 1) {
      _magHudEl.classList.add('mag-red');
    } else if (count === 2) {
      _magHudEl.classList.add('mag-yellow');
    }
    // else default green via CSS
  }

  // ── Ammo scarcity warnings ────────────────────────────────────────────────
  function _checkScarcity(weaponType, currentAmmo) {
    var stash = _mags[weaponType] || [];
    var total = _totalReserve(weaponType) + (currentAmmo || 0);

    if (stash.length === 0) {
      _toast('WINCHESTER', 3000, '#ff2200');
    } else if (stash.length === 1) {
      _toast('LAST MAGAZINE', 2500, '#ff6600');
    } else if (total < 10) {
      _toast('AMMO CRITICAL', 2500, '#ff2200');
    }
  }

  // ── Public API ────────────────────────────────────────────────────────────

  /**
   * init() — call once at game start; sets up global hooks.
   */
  function init() {
    // Global reload hook
    window._onReloadForMags = function (weaponType, currentAmmo) {
      return MagazineSystem.onReload(weaponType, currentAmmo);
    };
    // Global ammo pickup hook
    window._onAmmoPickupForMags = function (weaponType, amount) {
      MagazineSystem.addAmmo(weaponType, amount);
    };
    // Global weapon switch hook
    window._onWeaponSwitchForMags = function (weaponType) {
      MagazineSystem.onWeaponSwitch(weaponType);
    };
  }

  /**
   * onWeaponSwitch(weaponType) — call when player equips a weapon.
   * Initialises the magazine stash if first time.
   */
  function onWeaponSwitch(weaponType) {
    if (!weaponType) return;
    _currentWeapon = weaponType;
    _ensureInit(weaponType);
    _updateMagHud(weaponType, null);
    _checkScarcity(weaponType, null);
  }

  /**
   * onReload(weaponType, currentAmmo) — called when player presses R.
   * Returns the new loaded round count (or -1 if no mags available).
   *
   * Side effects:
   *   • If currentAmmo > 0, pushes it back into the stash.
   *   • Picks the fullest mag from the stash.
   *   • Shows TACTICAL vs EMERGENCY RELOAD toast.
   *   • Adjusts reload time (returned via side-channel window._lastReloadTime).
   */
  function onReload(weaponType, currentAmmo) {
    if (!weaponType) return -1;
    _ensureInit(weaponType);

    var stash = _mags[weaponType];
    var isTactical = (typeof currentAmmo === 'number' && currentAmmo > 0);

    // Check any mags with rounds
    var hasMag = false;
    for (var i = 0; i < stash.length; i++) {
      if (stash[i] > 0) { hasMag = true; break; }
    }
    if (!hasMag) {
      _toast('WINCHESTER — no ammo remaining', 3000, '#ff2200');
      window._lastReloadTime = 0;
      return -1;
    }

    // Already at full mag — nothing to reload
    var size = _magSize(weaponType);
    if (isTactical && currentAmmo >= size) {
      // Magazine already full
      window._lastReloadTime = 0;
      return currentAmmo;
    }

    // Put current partial mag back in stash
    if (isTactical) {
      stash.push(currentAmmo);
    }

    // Sort stash descending by rounds, take the fullest
    stash.sort(function (a, b) { return b - a; });
    var newAmmo = stash.shift();

    // Toast + reload time
    if (isTactical) {
      _toast('TACTICAL RELOAD', 1400, '#44ffaa');
      window._lastReloadTime = 1.8;
    } else {
      _toast('EMERGENCY RELOAD', 1800, '#ffcc44');
      window._lastReloadTime = 2.5;
    }

    _updateMagHud(weaponType, newAmmo);
    _checkScarcity(weaponType, newAmmo);

    return newAmmo;
  }

  /**
   * getMagazines(weaponType) — returns a copy of the stash array.
   */
  function getMagazines(weaponType) {
    _ensureInit(weaponType);
    return (_mags[weaponType] || []).slice();
  }

  /**
   * getCurrentMag(weaponType) — returns round count of the fullest stash mag
   * without removing it (peek).
   */
  function getCurrentMag(weaponType) {
    _ensureInit(weaponType);
    var stash = (_mags[weaponType] || []).slice().sort(function (a, b) { return b - a; });
    return stash.length ? stash[0] : 0;
  }

  /**
   * addAmmo(weaponType, amount) — add rounds from a pickup.
   * Fills partial mags first, then creates new full mags.
   * Shows a toast describing how many rounds were added.
   */
  function addAmmo(weaponType, amount) {
    if (!weaponType || !amount || amount <= 0) return;
    _ensureInit(weaponType);

    var stash  = _mags[weaponType];
    var size   = _magSize(weaponType);
    var remaining = amount;
    var roundsAdded = 0;

    // Fill partial mags first (ascending order so smallest gets topped first)
    stash.sort(function (a, b) { return a - b; });
    for (var i = 0; i < stash.length && remaining > 0; i++) {
      if (stash[i] < size) {
        var space = size - stash[i];
        var fill  = Math.min(space, remaining);
        stash[i] += fill;
        remaining -= fill;
        roundsAdded += fill;
      }
    }

    // Create new full mags from leftover
    while (remaining >= size) {
      stash.push(size);
      remaining -= size;
      roundsAdded += size;
    }
    // Partial mag from leftover
    if (remaining > 0) {
      stash.push(remaining);
      roundsAdded += remaining;
      remaining = 0;
    }

    // Toast
    var fullMagsAdded = Math.floor(roundsAdded / size);
    var toastMsg = '+' + roundsAdded + ' rounds';
    if (fullMagsAdded > 0) {
      toastMsg += ' (' + fullMagsAdded + ' full mag' + (fullMagsAdded !== 1 ? 's' : '') + ')';
    }
    _toast(toastMsg, 1800, '#88ffcc');

    _updateMagHud(weaponType, null);
  }

  /**
   * reset() — clears all magazine state (call on game restart / new match).
   */
  function reset() {
    _mags    = {};
    _inited  = {};
    _currentWeapon = null;
    _lastToastKey  = '';
    if (_toastDebounce) { clearTimeout(_toastDebounce); _toastDebounce = null; }
    if (_magHudEl) { _magHudEl.textContent = ''; }
  }

  // ── Expose public API ─────────────────────────────────────────────────────
  return {
    init:           init,
    onReload:       onReload,
    onWeaponSwitch: onWeaponSwitch,
    getMagazines:   getMagazines,
    getCurrentMag:  getCurrentMag,
    addAmmo:        addAmmo,
    reset:          reset,
  };
})();

;
} catch(_e){ if(window.console&&console.warn)console.warn("mod fail magazine-system.js",_e&&_e.message); }
/* === tactical-reload.js === */
try {
;
/**
 * tactical-reload.js
 * Full tactical animated weapon reload system for Three.js FPS game.
 * 3-phase reload animation, falling magazine mesh, HUD progress bar,
 * tactical/emergency reload distinction, multi-weapon reload times,
 * reload cancel penalty, and STANAG-compatible weapon integration.
 */
window.TacticalReload = (function() {
    'use strict';

    // ── State ─────────────────────────────────────────────────────────────────
    var _camera = null;
    var _scene  = null;
    var _active = false;

    // Current reload session
    var _phase        = 0;       // 1, 2, or 3
    var _phaseTimer   = 0;
    var _totalTimer   = 0;
    var _totalDur     = 0;
    var _isTactical   = false;
    var _weaponType   = 'AR';
    var _cancelled    = false;
    var _penaltyTimer = 0;

    // Per-phase durations (base values; scaled by weapon type)
    var PHASE1_DUR = 0.3;
    var PHASE2_DUR = 0.4;
    var PHASE3_DUR = 0.2;
    var BASE_DUR   = PHASE1_DUR + PHASE2_DUR + PHASE3_DUR;  // 0.9s for base

    // Weapon reload totals (seconds)
    var WEAPON_TIMES = {
        PISTOL:  1.2,
        SMG:     1.6,
        AR:      2.0,
        RIFLE:   2.0,
        SNIPER:  3.0,
        SHOTGUN: 0.6   // per shell (pump-action)
    };

    // Gun mesh baseline (saved on init)
    var _gunBasePos = null;   // THREE.Vector3
    var _gunBaseRot = null;   // THREE.Euler
    var _gunMesh    = null;

    // Magazine drop mesh
    var _magMesh      = null;
    var _magVelY      = 0;
    var _magActive    = false;
    var _magFadeTimer = 0;

    // HUD elements
    var _hudBar        = null;
    var _hudBarFill    = null;
    var _hudText       = null;
    var _hudTactical   = null;

    // Shotgun shell count
    var _shellsLeft    = 0;
    var _shellTotal    = 0;

    // ── Weapon type scale helpers ──────────────────────────────────────────────
    function _getReloadTime(wtype) {
        var t = WEAPON_TIMES[wtype];
        return (t !== undefined) ? t : WEAPON_TIMES['AR'];
    }

    function _getScaleFactor(wtype) {
        return _getReloadTime(wtype) / BASE_DUR;
    }

    // ── HUD creation ──────────────────────────────────────────────────────────
    function _createHUD() {
        if (_hudBar) return;

        // Wrapper
        var wrapper = document.createElement('div');
        wrapper.id = 'tr-hud';
        wrapper.style.cssText = [
            'position:fixed',
            'bottom:calc(50% - 40px)',
            'left:50%',
            'transform:translateX(-50%)',
            'display:none',
            'flex-direction:column',
            'align-items:center',
            'gap:4px',
            'pointer-events:none',
            'z-index:9990'
        ].join(';');

        // "RELOADING..." label
        var text = document.createElement('div');
        text.id = 'tr-text';
        text.textContent = 'RELOADING...';
        text.style.cssText = [
            'color:#ffffff',
            'font-family:monospace',
            'font-size:11px',
            'letter-spacing:3px',
            'text-shadow:0 0 6px rgba(255,255,255,0.6)',
            'opacity:0.9'
        ].join(';');
        wrapper.appendChild(text);

        // "TACTICAL RELOAD" bonus label
        var tactical = document.createElement('div');
        tactical.id = 'tr-tactical';
        tactical.textContent = 'TACTICAL RELOAD';
        tactical.style.cssText = [
            'color:#44ff88',
            'font-family:monospace',
            'font-size:10px',
            'letter-spacing:2px',
            'text-shadow:0 0 8px rgba(68,255,136,0.8)',
            'display:none'
        ].join(';');
        wrapper.appendChild(tactical);

        // Progress bar track
        var barTrack = document.createElement('div');
        barTrack.style.cssText = [
            'width:160px',
            'height:3px',
            'background:rgba(255,255,255,0.2)',
            'border-radius:2px',
            'overflow:hidden'
        ].join(';');

        // Progress bar fill
        var barFill = document.createElement('div');
        barFill.id = 'tr-bar-fill';
        barFill.style.cssText = [
            'width:0%',
            'height:100%',
            'background:#ffffff',
            'border-radius:2px',
            'transition:none'
        ].join(';');
        barTrack.appendChild(barFill);
        wrapper.appendChild(barTrack);

        document.body.appendChild(wrapper);

        _hudBar      = wrapper;
        _hudBarFill  = barFill;
        _hudText     = text;
        _hudTactical = tactical;
    }

    function _showHUD(tactical) {
        if (!_hudBar) _createHUD();
        _hudBar.style.display = 'flex';
        _hudBarFill.style.width = '0%';
        if (tactical) {
            _hudTactical.style.display = 'block';
        } else {
            _hudTactical.style.display = 'none';
        }
    }

    function _hideHUD() {
        if (_hudBar) {
            _hudBar.style.display = 'none';
        }
    }

    function _updateHUDProgress(ratio) {
        if (_hudBarFill) {
            _hudBarFill.style.width = (ratio * 100).toFixed(1) + '%';
        }
    }

    // ── Gun mesh helpers ───────────────────────────────────────────────────────
    function _findGunMesh() {
        if (!_camera) return null;
        for (var i = 0; i < _camera.children.length; i++) {
            var ch = _camera.children[i];
            if (ch.isMesh || ch.isGroup) return ch;
        }
        return null;
    }

    function _saveGunBase() {
        if (!_gunMesh) return;
        if (!_gunBasePos) {
            _gunBasePos = _gunMesh.position.clone();
        } else {
            _gunBasePos.copy(_gunMesh.position);
        }
        if (!_gunBaseRot) {
            _gunBaseRot = _gunMesh.rotation.clone();
        } else {
            _gunBaseRot.copy(_gunMesh.rotation);
        }
    }

    function _restoreGunBase() {
        if (!_gunMesh || !_gunBasePos || !_gunBaseRot) return;
        _gunMesh.position.copy(_gunBasePos);
        _gunMesh.rotation.copy(_gunBaseRot);
    }

    // ── Magazine drop mesh ─────────────────────────────────────────────────────
    function _spawnMagMesh() {
        if (!_scene) return;
        _removeMagMesh();

        var geo = new THREE.BoxGeometry(0.025, 0.08, 0.04);
        var mat = new THREE.MeshBasicMaterial({ color: 0x444444, transparent: true, opacity: 1.0 });
        _magMesh = new THREE.Mesh(geo, mat);

        // Spawn at camera position slightly below gun
        _magMesh.position.copy(_camera.position);
        _magMesh.position.y -= 0.3;

        // Copy camera yaw direction for a slight offset forward
        var dir = new THREE.Vector3(0, 0, -0.2);
        dir.applyQuaternion(_camera.quaternion);
        _magMesh.position.add(dir);

        _magVelY      = -0.5;  // initial downward velocity (units/s)
        _magActive    = true;
        _magFadeTimer = 0;

        _scene.add(_magMesh);
    }

    function _removeMagMesh() {
        if (_magMesh) {
            if (_magMesh.parent) _magMesh.parent.remove(_magMesh);
            if (_magMesh.geometry) _magMesh.geometry.dispose();
            if (_magMesh.material) _magMesh.material.dispose();
            _magMesh = null;
        }
        _magActive = false;
    }

    function _updateMagMesh(dt) {
        if (!_magMesh || !_magActive) return;

        if (_magMesh.position.y > 0) {
            _magVelY -= 9.8 * dt;   // gravity
            _magMesh.position.y += _magVelY * dt;
            _magMesh.rotation.x += 3.0 * dt;  // tumble
            if (_magMesh.position.y <= 0) {
                _magMesh.position.y = 0;
                _magVelY = 0;
                _magFadeTimer = 2.0;  // start 2s fade
            }
        } else {
            // Landed — count down fade
            _magFadeTimer -= dt;
            if (_magFadeTimer <= 0) {
                _removeMagMesh();
                return;
            }
            var alpha = Math.min(1.0, _magFadeTimer / 0.5);
            _magMesh.material.opacity = alpha;
        }
    }

    // ── Phase animation ────────────────────────────────────────────────────────
    //  t = normalized [0,1] within phase
    function _applyPhase1(t) {
        if (!_gunMesh || !_gunBasePos) return;
        // Magazine drop: tilt gun and lower slightly
        _gunMesh.position.y = _gunBasePos.y + (-0.15 * t);
        _gunMesh.rotation.z = _gunBaseRot.z + (0.3 * t);
    }

    function _applyPhase2(t) {
        if (!_gunMesh || !_gunBasePos) return;
        // Return to center with a brief Y oscillation (simulating mag insertion)
        var oscil = Math.sin(t * Math.PI * 4) * 0.03;
        _gunMesh.position.y = _gunBasePos.y + (-0.15 * (1.0 - t)) + oscil;
        _gunMesh.rotation.z = _gunBaseRot.z + (0.3 * (1.0 - t));
    }

    function _applyPhase3(t) {
        if (!_gunMesh || !_gunBasePos) return;
        // Bolt charge: gun moves back then forward
        var pullback = Math.sin(t * Math.PI) * 0.08;
        _gunMesh.position.z = _gunBasePos.z + pullback;
        _gunMesh.position.y = _gunBasePos.y;
        _gunMesh.rotation.z = _gunBaseRot.z;
    }

    // ── Core reload logic ──────────────────────────────────────────────────────
    function startReload(opts) {
        if (_active) return;  // already reloading

        opts = opts || {};
        _weaponType = (opts.weaponType || 'AR').toUpperCase();
        var currentAmmo = (typeof opts.currentAmmo === 'number') ? opts.currentAmmo : 0;

        _isTactical = (currentAmmo > 0);
        _cancelled  = false;

        // Resolve reload duration
        var scaleFactor = _getScaleFactor(_weaponType);
        var totalDur    = _getReloadTime(_weaponType);
        _totalDur       = totalDur;

        // Shotgun is per-shell; treat slightly differently in update
        _shellsLeft  = (opts.shellsLeft  !== undefined) ? opts.shellsLeft  : 1;
        _shellTotal  = (opts.shellTotal  !== undefined) ? opts.shellTotal  : 1;

        _phase       = 1;
        _phaseTimer  = 0;
        _totalTimer  = 0;
        _penaltyTimer = 0;
        _active      = true;

        // Refresh gun ref each reload (in case scene rebuilt)
        _gunMesh = _findGunMesh();
        _saveGunBase();

        _showHUD(_isTactical);

        // Hook into mouse click for cancel detection
        document.addEventListener('mousedown', _onMouseDown);

        if (window.AudioSystem && typeof window.AudioSystem.playReload === 'function') {
            window.AudioSystem.playReload();
        }
    }

    function cancelReload() {
        if (!_active) return;
        _finishReload(true);
    }

    function _onMouseDown(e) {
        if (!_active) return;
        if (e.button !== 0) return;   // left click = fire attempt
        // Cancel only allowed once past Phase 1
        if (_phase > 1) {
            _cancelWithPenalty();
        }
    }

    function _cancelWithPenalty() {
        if (!_active) return;
        _cancelled = true;
        _penaltyTimer = 0.5;  // 0.5s penalty lock
        _finishReload(true);
    }

    function _finishReload(cancelled) {
        _active   = false;
        _phase    = 0;

        document.removeEventListener('mousedown', _onMouseDown);
        _restoreGunBase();
        _hideHUD();

        if (!cancelled) {
            // Successful reload
            window._reloadComplete = true;

            if (_isTactical) {
                // Grant +1 bullet bonus by convention (caller can inspect window._reloadTacticalBonus)
                window._reloadTacticalBonus = true;
            }

            // STANAG — call window.Weapons.reload() if available
            if (window.Weapons && typeof window.Weapons.reload === 'function') {
                window.Weapons.reload();
            }
        } else {
            window._reloadTacticalBonus = false;
            // No mag swap; penalty timer handled in update()
        }
    }

    // ── Public API ─────────────────────────────────────────────────────────────
    function init(opts) {
        opts = opts || {};
        _camera = opts.camera || (window.GameManager && window.GameManager.camera) || null;
        _scene  = opts.scene  || (window.GameManager && window.GameManager.scene)  || null;

        _createHUD();

        // Hook the global reload trigger
        window._onWeaponReload = function(reloadOpts) {
            startReload(reloadOpts || {});
        };

        window._reloadComplete      = false;
        window._reloadTacticalBonus = false;
    }

    function update(dt) {
        // Penalty timer after cancelled reload
        if (_penaltyTimer > 0) {
            _penaltyTimer -= dt;
            return;
        }

        // Update falling magazine regardless of reload state
        if (_magActive) {
            _updateMagMesh(dt);
        }

        if (!_active) return;

        _totalTimer += dt;
        _phaseTimer += dt;

        // Update HUD progress bar
        var progress = Math.min(1.0, _totalTimer / _totalDur);
        _updateHUDProgress(progress);

        // Scaled phase durations
        var scale = _getScaleFactor(_weaponType);
        var dur1  = PHASE1_DUR * scale;
        var dur2  = PHASE2_DUR * scale;
        var dur3  = PHASE3_DUR * scale;

        if (_phase === 1) {
            var t = Math.min(1.0, _phaseTimer / dur1);
            _applyPhase1(t);

            if (_phaseTimer >= dur1) {
                // Spawn falling mag at end of phase 1
                _spawnMagMesh();
                _phase      = 2;
                _phaseTimer = 0;
            }

        } else if (_phase === 2) {
            var t2 = Math.min(1.0, _phaseTimer / dur2);
            _applyPhase2(t2);

            if (_phaseTimer >= dur2) {
                _phase      = 3;
                _phaseTimer = 0;
            }

        } else if (_phase === 3) {
            var t3 = Math.min(1.0, _phaseTimer / dur3);
            _applyPhase3(t3);

            if (_phaseTimer >= dur3) {
                // Shotgun pump-action: one shell at a time
                if (_weaponType === 'SHOTGUN' && _shellsLeft > 1) {
                    _shellsLeft--;
                    _phase      = 2;  // loop phases 2→3 for each shell
                    _phaseTimer = 0;
                    _totalDur  += _getReloadTime('SHOTGUN');
                    return;
                }
                _finishReload(false);
            }
        }
    }

    function reset() {
        if (_active) {
            document.removeEventListener('mousedown', _onMouseDown);
            _restoreGunBase();
        }
        _active       = false;
        _phase        = 0;
        _phaseTimer   = 0;
        _totalTimer   = 0;
        _penaltyTimer = 0;
        _cancelled    = false;

        _removeMagMesh();
        _hideHUD();

        window._reloadComplete      = false;
        window._reloadTacticalBonus = false;
    }

    // ── Module export ──────────────────────────────────────────────────────────
    return {
        init:         init,
        update:       update,
        startReload:  startReload,
        cancelReload: cancelReload,
        reset:        reset
    };

})();
} catch(_e){ if(window.console&&console.warn)console.warn("mod fail tactical-reload.js",_e&&_e.message); }
