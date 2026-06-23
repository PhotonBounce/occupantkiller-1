/* ============================================================
 *  DECOY-SYSTEM.JS — Multi-type decoy deployment system
 *  Keys: D+C cycle type | Shift+D+C deploy/throw
 *  5 Decoy Types: INFLATABLE_SOLDIER, NOISE_LURE, VEHICLE_DECOY,
 *                 THERMAL_DUMMY, ELECTRONIC_GHOST
 * ============================================================ */
window.DecoySystem = (function () {
  'use strict';

  // ── Constants ────────────────────────────────────────────────────────────

  var MAX_ACTIVE       = 4;
  var FOOL_SCORE       = 100;
  var FOOL_MIN_SECS    = 5;
  var CLOSE_IDENTIFY   = 4;     // units — enemy identifies decoy as fake
  var THROW_SPEED      = 12;    // units/s horizontal
  var THROW_ARC        = 6;     // units/s initial vertical
  var GRAVITY          = 9.8;
  var COLLAPSE_SPEED   = 2.0;   // scale → 0 rate
  var TOAST_MS         = 2800;
  var WOBBLE_SPEED     = 0.015;
  var NOISE_INTERVAL   = 2.0;   // seconds between noise bursts

  var DECOY_TYPES = {
    INFLATABLE_SOLDIER: {
      key:      'INFLATABLE_SOLDIER',
      label:    'SOLDIER',
      ttl:      15,
      radius:   20,
      color:    0x8B7355,   // tan skin base
      count:    3
    },
    NOISE_LURE: {
      key:    'NOISE_LURE',
      label:  'NOISE',
      ttl:    20,
      radius: 25,
      color:  0x333333,
      count:  4
    },
    VEHICLE_DECOY: {
      key:    'VEHICLE_DECOY',
      label:  'VEHICLE',
      ttl:    30,
      radius: 35,
      color:  0x4a5240,
      count:  2
    },
    THERMAL_DUMMY: {
      key:    'THERMAL_DUMMY',
      label:  'THERMAL',
      ttl:    30,
      radius: 28,
      color:  0x555555,
      count:  3
    },
    ELECTRONIC_GHOST: {
      key:    'ELECTRONIC_GHOST',
      label:  'E-GHOST',
      ttl:    25,
      radius: 30,
      color:  0x1a1a2e,
      count:  4
    }
  };

  var TYPE_KEYS = [
    'INFLATABLE_SOLDIER',
    'NOISE_LURE',
    'VEHICLE_DECOY',
    'THERMAL_DUMMY',
    'ELECTRONIC_GHOST'
  ];

  // ── Module state ─────────────────────────────────────────────────────────

  var _scene      = null;
  var _camera     = null;
  var _playerRef  = null;
  var _typeIndex  = 0;        // currently selected decoy type
  var _keyBound   = false;
  var _dKeyDown   = false;
  var _cKeyDown   = false;

  var _hudEl      = null;
  var _toastEl    = null;
  var _toastTimer = null;

  // Inventory counts per type
  var _inventory  = {};

  // Active decoys array
  var _decoys     = [];

  // Score tracking
  window._decoyFooledCount = window._decoyFooledCount || 0;

  // ── Init inventory ────────────────────────────────────────────────────────

  function _initInventory() {
    var i;
    for (i = 0; i < TYPE_KEYS.length; i++) {
      _inventory[TYPE_KEYS[i]] = DECOY_TYPES[TYPE_KEYS[i]].count;
    }
  }

  // ── HUD ──────────────────────────────────────────────────────────────────

  function _ensureHUD() {
    if (_hudEl) return;
    _hudEl = document.createElement('div');
    _hudEl.id = 'decoy-system-hud';
    _hudEl.style.cssText = [
      'position:fixed',
      'bottom:480px',
      'left:50%',
      'transform:translateX(-50%)',
      'color:#ffdd88',
      'font-size:11px',
      'font-family:monospace',
      'z-index:210',
      'pointer-events:none',
      'background:rgba(0,0,0,0.5)',
      'padding:3px 10px',
      'border-radius:3px',
      'border:1px solid rgba(255,221,136,0.35)',
      'display:none',
      'letter-spacing:1px'
    ].join(';');
    document.body.appendChild(_hudEl);
  }

  function _ensureToast() {
    if (_toastEl) return;
    _toastEl = document.createElement('div');
    _toastEl.id = 'decoy-system-toast';
    _toastEl.style.cssText = [
      'position:fixed',
      'top:32%',
      'left:50%',
      'transform:translateX(-50%)',
      'color:#ffdd88',
      'font-size:15px',
      'font-weight:bold',
      'font-family:monospace',
      'z-index:420',
      'pointer-events:none',
      'background:rgba(30,20,0,0.88)',
      'padding:6px 22px',
      'border-radius:6px',
      'border:1px solid #cc9900',
      'letter-spacing:2px',
      'text-shadow:0 0 8px #cc9900',
      'display:none',
      'transition:opacity 0.3s'
    ].join(';');
    document.body.appendChild(_toastEl);
  }

  function _showToast(msg) {
    _ensureToast();
    if (_toastTimer) clearTimeout(_toastTimer);
    _toastEl.textContent = msg;
    _toastEl.style.display = 'block';
    _toastEl.style.opacity = '1';
    _toastTimer = setTimeout(function () {
      _toastEl.style.opacity = '0';
      setTimeout(function () { _toastEl.style.display = 'none'; }, 320);
    }, TOAST_MS);
  }

  function _updateHUD() {
    _ensureHUD();

    var activeCount = _decoys.length;
    var selType     = DECOY_TYPES[TYPE_KEYS[_typeIndex]];

    // Build inventory summary
    var parts = [];
    var i, k, cnt;
    for (i = 0; i < TYPE_KEYS.length; i++) {
      k   = TYPE_KEYS[i];
      cnt = _inventory[k];
      if (cnt > 0) {
        parts.push('[' + DECOY_TYPES[k].label + ' x' + cnt + ']');
      }
    }

    var invStr = parts.length ? 'DECOYS ' + parts.join(' ') : 'DECOYS [EMPTY]';
    var selStr = '>> ' + selType.label + ' <<';
    var actStr = activeCount + '/' + MAX_ACTIVE + ' ACTIVE';

    _hudEl.textContent = invStr + '  ' + selStr + '  |  ' + actStr;
    _hudEl.style.display = 'block';
  }

  // ── Audio helpers ─────────────────────────────────────────────────────────

  function _playNoiseBurst() {
    var ctx;
    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) { return; }

    var sr         = ctx.sampleRate;
    var bufSize    = Math.floor(sr * 0.25);
    var buf        = ctx.createBuffer(1, bufSize, sr);
    var data       = buf.getChannelData(0);
    var i;
    for (i = 0; i < bufSize; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufSize);
    }

    var src    = ctx.createBufferSource();
    src.buffer = buf;

    var bp        = ctx.createBiquadFilter();
    bp.type       = 'bandpass';
    bp.frequency.value = 900;
    bp.Q.value    = 1.2;

    var gain = ctx.createGain();
    gain.gain.setValueAtTime(0.6, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);

    src.connect(bp);
    bp.connect(gain);
    gain.connect(ctx.destination);
    src.start();
    src.onended = function () {
      try { ctx.close(); } catch (ex) { /* ignore */ }
    };
  }

  function _playDeploySound() {
    var ctx;
    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) { return; }

    var osc      = ctx.createOscillator();
    osc.type     = 'square';
    osc.frequency.setValueAtTime(380, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(180, ctx.currentTime + 0.18);

    var gain = ctx.createGain();
    gain.gain.setValueAtTime(0.25, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.2);
    osc.onended = function () {
      try { ctx.close(); } catch (ex) { /* ignore */ }
    };
  }

  // ── Mesh builders ─────────────────────────────────────────────────────────

  function _buildInflatableSoldier() {
    var group     = new THREE.Group();
    var skinColor = 0xC8A882;
    var olive     = 0x4a5240;
    var skinMat   = new THREE.MeshLambertMaterial({ color: skinColor });
    var oliveMat  = new THREE.MeshLambertMaterial({ color: olive });

    // Body (cylinder — looks rounded like inflatable)
    var bodyGeo = new THREE.CylinderGeometry(0.28, 0.32, 0.85, 8);
    var body    = new THREE.Mesh(bodyGeo, oliveMat);
    body.position.y = 0.95;
    group.add(body);

    // Head (sphere)
    var headGeo = new THREE.SphereGeometry(0.2, 8, 6);
    var head    = new THREE.Mesh(headGeo, skinMat);
    head.position.y = 1.6;
    group.add(head);

    // Helmet
    var helmGeo = new THREE.CylinderGeometry(0.22, 0.21, 0.12, 8);
    var helm    = new THREE.Mesh(helmGeo, oliveMat);
    helm.position.y = 1.75;
    group.add(helm);

    // Arms (box geometry)
    var armGeo  = new THREE.BoxGeometry(0.15, 0.55, 0.15);
    var lArm    = new THREE.Mesh(armGeo, oliveMat);
    lArm.position.set(-0.44, 0.95, 0);
    lArm.rotation.z = 0.2;
    group.add(lArm);

    var rArm = new THREE.Mesh(armGeo, oliveMat);
    rArm.position.set(0.44, 0.95, 0);
    rArm.rotation.z = -0.2;
    group.add(rArm);

    // Legs
    var legGeo = new THREE.BoxGeometry(0.2, 0.65, 0.2);
    var lLeg   = new THREE.Mesh(legGeo, oliveMat);
    lLeg.position.set(-0.15, 0.32, 0);
    group.add(lLeg);

    var rLeg = new THREE.Mesh(legGeo, oliveMat);
    rLeg.position.set(0.15, 0.32, 0);
    group.add(rLeg);

    return group;
  }

  function _buildNoiseLure() {
    var geo = new THREE.SphereGeometry(0.3, 8, 6);
    var mat = new THREE.MeshLambertMaterial({ color: 0x333333 });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.y = 0.3;
    var group = new THREE.Group();
    group.add(mesh);
    return group;
  }

  function _buildVehicleDecoy() {
    var group = new THREE.Group();
    var olive = new THREE.MeshLambertMaterial({ color: 0x4a5240 });

    // Main hull
    var hullGeo = new THREE.BoxGeometry(4, 1.5, 2);
    var hull    = new THREE.Mesh(hullGeo, olive);
    hull.position.y = 0.75;
    group.add(hull);

    // Turret stub
    var turrGeo = new THREE.BoxGeometry(1.2, 0.7, 1.2);
    var turr    = new THREE.Mesh(turrGeo, olive);
    turr.position.set(0.3, 1.85, 0);
    group.add(turr);

    // Gun barrel
    var barGeo = new THREE.BoxGeometry(1.6, 0.15, 0.15);
    var bar    = new THREE.Mesh(barGeo, olive);
    bar.position.set(1.4, 1.85, 0);
    group.add(bar);

    return group;
  }

  function _buildThermalDummy() {
    var group = new THREE.Group();
    var mat   = new THREE.MeshLambertMaterial({ color: 0x555555 });
    var geo   = new THREE.BoxGeometry(0.5, 1.5, 0.3);
    var mesh  = new THREE.Mesh(geo, mat);
    mesh.position.y = 0.75;
    group.add(mesh);

    // PointLight for heat signature
    var light      = new THREE.PointLight(0xFF6600, 2.0, 8);
    light.position.set(0, 1.2, 0);
    group.add(light);
    group.userData.thermalLight = light;

    return group;
  }

  function _buildElectronicGhost() {
    var group = new THREE.Group();
    var mat   = new THREE.MeshLambertMaterial({ color: 0x1a1a2e, emissive: 0x003366, emissiveIntensity: 0.6 });
    var geo   = new THREE.BoxGeometry(0.35, 0.25, 0.35);
    var mesh  = new THREE.Mesh(geo, mat);
    mesh.position.y = 0.12;
    group.add(mesh);

    // Tiny antenna
    var antGeo = new THREE.BoxGeometry(0.04, 0.3, 0.04);
    var antMat = new THREE.MeshLambertMaterial({ color: 0x888888 });
    var ant    = new THREE.Mesh(antGeo, antMat);
    ant.position.set(0.1, 0.42, 0);
    group.add(ant);

    return group;
  }

  function _buildMeshForType(typeKey) {
    if (typeKey === 'INFLATABLE_SOLDIER') return _buildInflatableSoldier();
    if (typeKey === 'NOISE_LURE')         return _buildNoiseLure();
    if (typeKey === 'VEHICLE_DECOY')      return _buildVehicleDecoy();
    if (typeKey === 'THERMAL_DUMMY')      return _buildThermalDummy();
    if (typeKey === 'ELECTRONIC_GHOST')   return _buildElectronicGhost();
    return _buildNoiseLure(); // fallback
  }

  // ── Enemy helpers ─────────────────────────────────────────────────────────

  function _getEnemies() {
    if (window.Enemies && typeof window.Enemies.getAll === 'function') {
      return window.Enemies.getAll();
    }
    if (Array.isArray(window._enemies)) return window._enemies;
    return [];
  }

  function _dist2D(ax, az, bx, bz) {
    var dx = ax - bx;
    var dz = az - bz;
    return Math.sqrt(dx * dx + dz * dz);
  }

  function _attractEnemiesToDecoy(decoy) {
    var enemies = _getEnemies();
    var dpos    = decoy.mesh.position;
    var radius  = DECOY_TYPES[decoy.typeKey].radius;
    var i, e, dist;
    for (i = 0; i < enemies.length; i++) {
      e = enemies[i];
      if (!e || !e.alive || !e.mesh) continue;
      dist = _dist2D(dpos.x, dpos.z, e.mesh.position.x, e.mesh.position.z);
      if (dist <= radius) {
        e._decoyTarget    = dpos;
        e._decoyLureTimer = DECOY_TYPES[decoy.typeKey].ttl;
        e._decoyRef       = decoy;
        if (e._patrolState !== undefined) e._patrolState = 'combat';
        if (e._detectedPlayer !== undefined) e._detectedPlayer = true;
        e.playerSpotted = true;
        if (!decoy.fooledEnemies) decoy.fooledEnemies = {};
        if (!decoy.fooledEnemies[i]) {
          decoy.fooledEnemies[i] = { enemy: e, timer: 0, scored: false };
        }
        // Show CONTACT toast if this is first attraction
        if (!decoy.contactShown) {
          decoy.contactShown = true;
          _showToast('CONTACT — ENEMY DIVERTED');
        }
      }
    }
  }

  function _checkEnemyIdentify(decoy) {
    if (!decoy.fooledEnemies) return;
    var enemies = _getEnemies();
    var dpos    = decoy.mesh.position;
    var i, fe, dist;
    for (i = 0; i < enemies.length; i++) {
      fe = decoy.fooledEnemies[i];
      if (!fe) continue;
      var e = fe.enemy;
      if (!e || !e.mesh) continue;
      dist = _dist2D(dpos.x, dpos.z, e.mesh.position.x, e.mesh.position.z);
      if (dist < CLOSE_IDENTIFY) {
        // Enemy too close — identifies as fake
        e._decoyTarget    = null;
        e._decoyLureTimer = 0;
        e._decoyRef       = null;
        delete decoy.fooledEnemies[i];
      }
    }
  }

  function _updateFoolTimers(decoy, dt) {
    if (!decoy.fooledEnemies) return;
    var keys = Object.keys(decoy.fooledEnemies);
    var j, fe;
    for (j = 0; j < keys.length; j++) {
      fe = decoy.fooledEnemies[keys[j]];
      if (!fe || fe.scored) continue;
      fe.timer += dt;
      if (fe.timer >= FOOL_MIN_SECS) {
        fe.scored = true;
        window._decoyFooledCount = (window._decoyFooledCount || 0) + 1;
        if (window.Score && typeof window.Score.add === 'function') {
          window.Score.add(FOOL_SCORE, 'ENEMY FOOLED');
        } else if (window._score !== undefined) {
          window._score += FOOL_SCORE;
        }
        _showToast('+' + FOOL_SCORE + ' ENEMY FOOLED');
      }
    }
  }

  // ── Spawn decoy ───────────────────────────────────────────────────────────

  function _spawnDecoy(typeKey, pos, thrown, velocity) {
    var type  = DECOY_TYPES[typeKey];
    var group = _buildMeshForType(typeKey);

    group.position.set(pos.x, pos.y, pos.z);
    group.rotation.y = Math.random() * Math.PI * 2;
    _scene.add(group);

    // Activate ELECTRONIC_GHOST global flag
    if (typeKey === 'ELECTRONIC_GHOST') {
      window._ghostRadioActive = true;
    }

    var decoy = {
      typeKey:       typeKey,
      mesh:          group,
      ttl:           type.ttl,
      alive:         true,
      collapsing:    false,
      fooledEnemies: {},
      contactShown:  false,
      noiseTimer:    0,
      // Throw physics
      inFlight:      thrown || false,
      velocity:      velocity || null,
      // For VEHICLE_DECOY tracking
      diverted:      false
    };

    // Enforce max active — remove oldest
    if (_decoys.length >= MAX_ACTIVE) {
      _removeDecoy(_decoys[0], 0);
    }

    _decoys.push(decoy);
    _playDeploySound();
    return decoy;
  }

  function _removeDecoy(decoy, idx) {
    if (!decoy) return;
    decoy.alive = false;

    // Turn off electronic ghost if no other ghost decoys remain
    if (decoy.typeKey === 'ELECTRONIC_GHOST') {
      var hasGhost = false;
      var k;
      for (k = 0; k < _decoys.length; k++) {
        if (_decoys[k] !== decoy && _decoys[k].alive && _decoys[k].typeKey === 'ELECTRONIC_GHOST') {
          hasGhost = true;
          break;
        }
      }
      if (!hasGhost) window._ghostRadioActive = false;
    }

    // Remove thermal light
    if (decoy.mesh && decoy.mesh.userData && decoy.mesh.userData.thermalLight) {
      decoy.mesh.remove(decoy.mesh.userData.thermalLight);
    }

    if (_scene && decoy.mesh) {
      decoy.mesh.traverse(function (child) {
        if (child.geometry) child.geometry.dispose();
        if (child.material) {
          if (Array.isArray(child.material)) {
            var mi;
            for (mi = 0; mi < child.material.length; mi++) child.material[mi].dispose();
          } else {
            child.material.dispose();
          }
        }
      });
      _scene.remove(decoy.mesh);
    }

    if (idx !== undefined) {
      _decoys.splice(idx, 1);
    }
  }

  function _collapseDecoy(decoy) {
    if (decoy.collapsing) return;
    decoy.collapsing = true;

    // Clear enemy targeting
    var enemies = _getEnemies();
    var i, e;
    for (i = 0; i < enemies.length; i++) {
      e = enemies[i];
      if (e && e._decoyRef === decoy) {
        e._decoyTarget    = null;
        e._decoyLureTimer = 0;
        e._decoyRef       = null;
        // Enemy becomes alerted after decoy expires
        if (e._alertLevel !== undefined) e._alertLevel = 3;
        e.playerSpotted = true;
      }
    }

    if (decoy.typeKey === 'VEHICLE_DECOY') {
      _showToast('VEHICLE DECOY EXPIRED');
    }
  }

  // ── Get player position ──────────────────────────────────────────────────

  function _getPlayerPos() {
    if (_playerRef && _playerRef.position) return _playerRef.position;
    if (window.player && window.player.position) return window.player.position;
    if (_camera) return _camera.position;
    return null;
  }

  function _getCameraForward() {
    if (!_camera) return { x: 0, y: 0, z: -1 };
    var dir = new THREE.Vector3();
    _camera.getWorldDirection(dir);
    return dir;
  }

  // ── Deploy / throw ────────────────────────────────────────────────────────

  function _deploy(throwIt) {
    var typeKey = TYPE_KEYS[_typeIndex];
    var inv     = _inventory[typeKey];

    if (inv <= 0) {
      _showToast('NO ' + DECOY_TYPES[typeKey].label + ' DECOYS LEFT');
      return;
    }

    var pos = _getPlayerPos();
    if (!pos) {
      _showToast('DECOY: NO POSITION');
      return;
    }

    _inventory[typeKey]--;

    if (throwIt) {
      var fwd = _getCameraForward();
      var spawnPos = { x: pos.x, y: pos.y + 1.0, z: pos.z };
      var vel = {
        x: fwd.x * THROW_SPEED,
        y: THROW_ARC,
        z: fwd.z * THROW_SPEED
      };
      _spawnDecoy(typeKey, spawnPos, true, vel);
      _showToast('DECOY THROWN — ' + DECOY_TYPES[typeKey].label);
    } else {
      _spawnDecoy(typeKey, pos, false, null);
      _showToast('DECOY DEPLOYED — ' + DECOY_TYPES[typeKey].label);
    }

    _updateHUD();
  }

  function _cycleType() {
    _typeIndex = (_typeIndex + 1) % TYPE_KEYS.length;
    var typeKey = TYPE_KEYS[_typeIndex];
    _showToast('DECOY: ' + DECOY_TYPES[typeKey].label);
    _updateHUD();
  }

  // ── Key binding ────────────────────────────────────────────────────────────

  function _bindKeys() {
    if (_keyBound) return;
    _keyBound = true;

    document.addEventListener('keydown', function (ev) {
      if (ev.code === 'KeyD' && !ev.ctrlKey && !ev.altKey) {
        _dKeyDown = true;
      }
      if (ev.code === 'KeyC' && !ev.ctrlKey && !ev.altKey && !ev.repeat) {
        if (_dKeyDown) {
          ev.preventDefault();
          ev.stopPropagation();
          if (ev.shiftKey) {
            _deploy(true);   // Shift+D+C = throw
          } else {
            _cycleType();    // D+C = cycle
          }
        }
      }
    }, true);

    document.addEventListener('keyup', function (ev) {
      if (ev.code === 'KeyD') _dKeyDown = false;
      if (ev.code === 'KeyC') _cKeyDown = false;
    }, true);
  }

  // ── Update loop ───────────────────────────────────────────────────────────

  function _updateThrowPhysics(decoy, dt) {
    if (!decoy.inFlight || !decoy.velocity) return;
    var vel = decoy.velocity;

    decoy.mesh.position.x += vel.x * dt;
    decoy.mesh.position.y += vel.y * dt;
    decoy.mesh.position.z += vel.z * dt;

    vel.y -= GRAVITY * dt;

    // Land on ground level (y <= 0)
    if (decoy.mesh.position.y <= 0) {
      decoy.mesh.position.y = 0;
      decoy.inFlight   = false;
      decoy.velocity   = null;
    }
  }

  function _updateDecoy(decoy, dt, idx) {
    if (!decoy.alive) return;

    // Throw physics
    if (decoy.inFlight) {
      _updateThrowPhysics(decoy, dt);
      // Rotate while in flight
      decoy.mesh.rotation.x += 3 * dt;
      return; // Don't lure until landed
    }

    // Collapse animation
    if (decoy.collapsing) {
      decoy.mesh.scale.y = Math.max(0, decoy.mesh.scale.y - COLLAPSE_SPEED * dt);
      if (decoy.mesh.scale.y <= 0.01) {
        _removeDecoy(decoy, idx);
      }
      return;
    }

    // TTL tick
    decoy.ttl -= dt;
    if (decoy.ttl <= 0) {
      _collapseDecoy(decoy);
      return;
    }

    // Wobble
    decoy.mesh.rotation.y += WOBBLE_SPEED * dt * 60;

    // Attract enemies
    _attractEnemiesToDecoy(decoy);
    _checkEnemyIdentify(decoy);
    _updateFoolTimers(decoy, dt);

    // NOISE_LURE: periodic noise burst
    if (decoy.typeKey === 'NOISE_LURE') {
      decoy.noiseTimer += dt;
      if (decoy.noiseTimer >= NOISE_INTERVAL) {
        decoy.noiseTimer = 0;
        _playNoiseBurst();
      }
    }

    // VEHICLE_DECOY: divert 2 enemies to investigate (one-time)
    if (decoy.typeKey === 'VEHICLE_DECOY' && !decoy.diverted) {
      decoy.diverted = true;
      var enemies    = _getEnemies();
      var dpos       = decoy.mesh.position;
      var diverted   = 0;
      var i, e, dist;
      for (i = 0; i < enemies.length && diverted < 2; i++) {
        e = enemies[i];
        if (!e || !e.alive || !e.mesh) continue;
        dist = _dist2D(dpos.x, dpos.z, e.mesh.position.x, e.mesh.position.z);
        if (dist <= DECOY_TYPES['VEHICLE_DECOY'].radius) {
          e._decoyTarget    = dpos;
          e._decoyLureTimer = DECOY_TYPES['VEHICLE_DECOY'].ttl;
          e._decoyRef       = decoy;
          e.playerSpotted   = true;
          diverted++;
        }
      }
      if (diverted > 0) {
        _showToast('VEHICLE SPOTTED — ' + diverted + ' ENEMIES DIVERTING');
      }
    }

    // THERMAL_DUMMY: pulse light intensity
    if (decoy.typeKey === 'THERMAL_DUMMY' && decoy.mesh.userData.thermalLight) {
      decoy.mesh.userData.thermalLight.intensity = 1.5 + Math.sin(performance.now() * 0.003) * 0.5;
    }

    // ELECTRONIC_GHOST: ensure flag is set
    if (decoy.typeKey === 'ELECTRONIC_GHOST') {
      window._ghostRadioActive = true;
    }
  }

  // ── Public API ─────────────────────────────────────────────────────────────

  function init(scene, camera, playerRef) {
    _scene     = scene;
    _camera    = camera;
    _playerRef = playerRef || null;
    _decoys    = [];
    _dKeyDown  = false;
    _cKeyDown  = false;
    _typeIndex = 0;

    window._decoyFooledCount  = 0;
    window._ghostRadioActive  = false;

    _initInventory();
    _ensureHUD();
    _ensureToast();
    _updateHUD();
    _bindKeys();
  }

  function update(dt) {
    // Iterate backwards to safely splice during remove
    var i;
    for (i = _decoys.length - 1; i >= 0; i--) {
      _updateDecoy(_decoys[i], dt, i);
    }
    _updateHUD();
  }

  function reset() {
    var i;
    for (i = _decoys.length - 1; i >= 0; i--) {
      _removeDecoy(_decoys[i], i);
    }
    _decoys   = [];
    _typeIndex = 0;
    window._decoyFooledCount = 0;
    window._ghostRadioActive = false;
    _initInventory();
    if (_hudEl) _hudEl.style.display = 'none';
  }

  return {
    init:   init,
    update: update,
    reset:  reset
  };

}());
