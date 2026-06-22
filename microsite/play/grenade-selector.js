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
