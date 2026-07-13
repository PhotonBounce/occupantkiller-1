window.PsyOps = (function () {
  'use strict';

  // ── Constants ───────────────────────────────────────────────────────────────
  var ABILITY = {
    DISINFORMATION:  'DISINFORMATION',
    SURRENDER:       'SURRENDER',
    IMPERSONATION:   'IMPERSONATION',
    PANIC_BURST:     'PANIC_BURST'
  };

  var ABILITY_COOLDOWNS = {
    DISINFORMATION: 60,
    SURRENDER:      75,
    IMPERSONATION:  45,
    PANIC_BURST:    90
  };

  var ABILITY_LABELS = {
    DISINFORMATION: '1 DISINFORMATION',
    SURRENDER:      '2 SURRENDER BROADCAST',
    IMPERSONATION:  '3 IMPERSONATION',
    PANIC_BURST:    '4 PANIC BURST'
  };

  var DISINFORMATION_RANGE   = 20;
  var SURRENDER_RANGE        = 30;
  var IMPERSONATION_RANGE    = 18;
  var PANIC_BURST_RANGE      = 15;

  var DISINFORMATION_DURATION  = 12;
  var IMPERSONATION_DURATION   = 15;
  var PANIC_DURATION           = 8;

  var CASCADE_WINDOW    = 30;   // seconds
  var CASCADE_THRESHOLD = 5;    // enemies affected in window triggers cascade

  var INFLUENCE_GRID_SIZE  = 64;
  var INFLUENCE_CELL_SIZE  = 4;   // world units per cell

  // ── State ────────────────────────────────────────────────────────────────────
  var _scene  = null;
  var _camera = null;

  var _cooldowns = {};          // ability → seconds remaining
  var _wheelOpen = false;
  var _wheelEl   = null;

  var _psyScore = 0;
  var _psyHudEl = null;

  var _impersonationActive  = false;
  var _impersonationTimer   = 0;
  var _impersonationAura    = null;  // THREE.Mesh silhouette
  var _impersonationTag     = null;  // DOM element

  var _activeVfx = [];    // { mesh, life, maxLife, type, data }
  var _deployedDecoys = [];  // { mesh, timer, signalRings, pos }

  // Cascade tracking
  var _cascadeEvents = [];   // timestamps of psyops hits
  var _cascadeTriggeredAt = -999;

  // Influence map
  var _influenceOverlay  = null;  // THREE.Mesh plane
  var _influenceVisible  = false;
  var _influenceCanvas   = null;
  var _influenceCtx      = null;
  var _influenceTex      = null;

  // ── Helpers ──────────────────────────────────────────────────────────────────
  function _getEnemies() {
    if (window.Enemies && Enemies.getAll) return Enemies.getAll();
    if (window._enemies) return window._enemies;
    return [];
  }

  function _getPlayerPos() {
    return _camera ? _camera.position : new THREE.Vector3();
  }

  function _getMorale(enemy) {
    return enemy._morale || 'HIGH';
  }

  // Apply morale change via PropagandaSystem helper if available; else directly
  function _setMorale(enemy, state) {
    if (!enemy) return;
    if (window.PropagandaSystem && PropagandaSystem._setMorale) {
      PropagandaSystem._setMorale(enemy, state);
    } else {
      enemy._morale = state;
      if (state === 'BROKEN') {
        enemy._moraleSpeedMult = 0.0;
        enemy._surrendering = true;
        enemy._surrenderTimer = 8;
        if (enemy.mesh) enemy.mesh.rotation.x = 0.3;
      } else if (state === 'LOW') {
        enemy._moraleSpeedMult = 0.75;
      } else if (state === 'MEDIUM') {
        enemy._moraleSpeedMult = 0.9;
      } else {
        enemy._moraleSpeedMult = 1.0;
      }
    }
  }

  function _moraleIndex(morale) {
    var states = ['HIGH', 'MEDIUM', 'LOW', 'BROKEN'];
    var idx = states.indexOf(morale);
    return idx >= 0 ? idx : 0;
  }

  // High-morale enemies resist PsyOps — durations halved
  function _effectiveDuration(enemy, base) {
    if (_getMorale(enemy) === 'HIGH') return base * 0.5;
    return base;
  }

  function _distXZ(a, b) {
    var dx = a.x - b.x;
    var dz = a.z - b.z;
    return Math.sqrt(dx * dx + dz * dz);
  }

  function _showToast(text, color) {
    var el = document.createElement('div');
    el.textContent = text;
    el.style.cssText = 'position:fixed;top:30%;left:50%;transform:translate(-50%,-50%);' +
      'color:' + (color || '#fff') + ';font-family:monospace;font-size:17px;font-weight:bold;' +
      'text-shadow:0 0 10px currentColor;pointer-events:none;z-index:9000;' +
      'transition:opacity 2s,transform 2s;opacity:1;';
    document.body.appendChild(el);
    setTimeout(function () { el.style.opacity = '0'; el.style.transform = 'translate(-50%,-200%)'; }, 200);
    setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 2300);
  }

  function _recordCascadeHit(count) {
    var now = Date.now() * 0.001;
    for (var i = 0; i < count; i++) _cascadeEvents.push(now);
    // prune old events
    for (var j = _cascadeEvents.length - 1; j >= 0; j--) {
      if (now - _cascadeEvents[j] > CASCADE_WINDOW) _cascadeEvents.splice(j, 1);
    }
    if (_cascadeEvents.length >= CASCADE_THRESHOLD && now - _cascadeTriggeredAt > CASCADE_WINDOW) {
      _triggerMoraleCascade();
    }
  }

  function _triggerMoraleCascade() {
    _cascadeTriggeredAt = Date.now() * 0.001;
    var enemies = _getEnemies();
    for (var i = 0; i < enemies.length; i++) {
      var e = enemies[i];
      if (!e || !e.alive) continue;
      var cur = _getMorale(e);
      var idx = _moraleIndex(cur);
      var states = ['HIGH', 'MEDIUM', 'LOW', 'BROKEN'];
      if (idx < 3) _setMorale(e, states[idx + 1]);
    }
    _showToast('MORALE CASCADE — ENEMY FORCE SHAKEN!', '#FF6600');
    _cascadeEvents = [];
  }

  // ── PsyScore HUD ─────────────────────────────────────────────────────────────
  function _createPsyHUD() {
    if (_psyHudEl) return;
    _psyHudEl = document.createElement('div');
    _psyHudEl.id = 'psyops-score-hud';
    _psyHudEl.style.cssText = 'position:fixed;bottom:80px;right:12px;' +
      'background:rgba(0,0,0,0.75);border:1px solid #00ccff;border-radius:4px;' +
      'padding:5px 10px;color:#00ccff;font-family:monospace;font-size:12px;' +
      'pointer-events:none;z-index:5000;min-width:110px;';
    _psyHudEl.innerHTML = 'PSY SCORE<br><span id="psyops-score-val" style="font-size:18px;font-weight:bold;">0</span>';
    document.body.appendChild(_psyHudEl);
  }

  function _updatePsyHUD() {
    if (!_psyHudEl) return;
    var val = _psyHudEl.querySelector('#psyops-score-val');
    if (val) val.textContent = _psyScore;
  }

  // ── PsyOps Wheel ─────────────────────────────────────────────────────────────
  function _createWheel() {
    if (_wheelEl) return;
    _wheelEl = document.createElement('div');
    _wheelEl.id = 'psyops-wheel';
    _wheelEl.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);' +
      'background:rgba(0,0,0,0.88);border:2px solid #00ccff;border-radius:8px;' +
      'padding:18px 24px;color:#fff;font-family:monospace;font-size:13px;' +
      'z-index:10000;min-width:260px;display:none;pointer-events:none;';
    _wheelEl.innerHTML = '<div style="text-align:center;font-size:15px;font-weight:bold;' +
      'color:#00ccff;margin-bottom:12px;letter-spacing:2px;">PSYOPS TOOLKIT</div>' +
      '<div id="psyops-w1" class="psyw"></div>' +
      '<div id="psyops-w2" class="psyw"></div>' +
      '<div id="psyops-w3" class="psyw"></div>' +
      '<div id="psyops-w4" class="psyw"></div>' +
      '<div style="margin-top:10px;color:#888;font-size:11px;text-align:center;">' +
      '[Y] close  |  [1-4] activate</div>';
    document.body.appendChild(_wheelEl);
  }

  function _updateWheel() {
    if (!_wheelEl) return;
    var keys = [ABILITY.DISINFORMATION, ABILITY.SURRENDER, ABILITY.IMPERSONATION, ABILITY.PANIC_BURST];
    var colors = { DISINFORMATION: '#4488ff', SURRENDER: '#ffcc00', IMPERSONATION: '#44ff88', PANIC_BURST: '#ff4444' };
    for (var i = 0; i < keys.length; i++) {
      var ab = keys[i];
      var cd = _cooldowns[ab] || 0;
      var ready = cd <= 0;
      var el = document.getElementById('psyops-w' + (i + 1));
      if (!el) continue;
      el.style.cssText = 'padding:6px 0;border-bottom:1px solid #222;' +
        'color:' + (ready ? colors[ab] : '#555') + ';';
      el.textContent = (i + 1) + '  ' + ABILITY_LABELS[ab] +
        (ready ? '  [READY]' : '  [' + Math.ceil(cd) + 's]');
    }
  }

  function _openWheel() {
    _wheelOpen = true;
    if (!_wheelEl) _createWheel();
    _updateWheel();
    _wheelEl.style.display = 'block';
  }

  function _closeWheel() {
    _wheelOpen = false;
    if (_wheelEl) _wheelEl.style.display = 'none';
  }

  // ── VFX helpers ──────────────────────────────────────────────────────────────
  function _makeSignalRing(pos, color, maxRadius) {
    var geo = new THREE.RingGeometry(0.1, 0.4, 24);
    var mat = new THREE.MeshBasicMaterial({ color: color || 0x4488ff, transparent: true, opacity: 0.7, side: THREE.DoubleSide });
    var ring = new THREE.Mesh(geo, mat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.copy(pos);
    ring.position.y += 0.1;
    ring._maxRadius = maxRadius || 8;
    ring._radius    = 0.5;
    _scene.add(ring);
    return ring;
  }

  function _makeShockwaveRing(pos, color, maxRadius) {
    var geo = new THREE.RingGeometry(0.5, 1.0, 32);
    var mat = new THREE.MeshBasicMaterial({ color: color || 0xff4444, transparent: true, opacity: 0.9, side: THREE.DoubleSide });
    var ring = new THREE.Mesh(geo, mat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.copy(pos);
    ring.position.y += 0.1;
    ring._maxRadius = maxRadius || PANIC_BURST_RANGE;
    ring._radius    = 1.0;
    _scene.add(ring);
    return ring;
  }

  // ── Ability: DISINFORMATION ───────────────────────────────────────────────────
  function _activateDisinformation() {
    var playerPos = _getPlayerPos();

    // Build fake radio tower mesh
    var group = new THREE.Group();

    // Telescoping pole — two segments
    var pole1 = new THREE.Mesh(
      new THREE.CylinderGeometry(0.05, 0.07, 2.0, 6),
      new THREE.MeshLambertMaterial({ color: 0x777777 })
    );
    pole1.position.y = 1.0;
    group.add(pole1);

    var pole2 = new THREE.Mesh(
      new THREE.CylinderGeometry(0.03, 0.05, 1.5, 6),
      new THREE.MeshLambertMaterial({ color: 0x999999 })
    );
    pole2.position.y = 2.75;
    group.add(pole2);

    var pole3 = new THREE.Mesh(
      new THREE.CylinderGeometry(0.015, 0.03, 1.0, 6),
      new THREE.MeshLambertMaterial({ color: 0xbbbbbb })
    );
    pole3.position.y = 3.75 + 0.5;
    group.add(pole3);

    // Small dishes / cross arms
    var arm = new THREE.Mesh(
      new THREE.CylinderGeometry(0.02, 0.02, 1.0, 4),
      new THREE.MeshLambertMaterial({ color: 0x888888 })
    );
    arm.rotation.z = Math.PI / 2;
    arm.position.y = 4.2;
    group.add(arm);

    // Blue signal light at top
    var sigLight = new THREE.PointLight(0x4488ff, 1.0, DISINFORMATION_RANGE);
    sigLight.position.y = 4.5;
    group.add(sigLight);

    group.position.set(
      playerPos.x + (Math.random() - 0.5) * 6,
      playerPos.y,
      playerPos.z + (Math.random() - 0.5) * 6
    );
    _scene.add(group);

    // Signal rings (spawn 3, staggered)
    var rings = [];
    for (var r = 0; r < 3; r++) {
      var ring = _makeSignalRing(group.position, 0x4488ff, DISINFORMATION_RANGE);
      ring._phase = r * 1.2;
      rings.push(ring);
    }

    var decoy = { mesh: group, timer: DISINFORMATION_DURATION, signalRings: rings, pos: group.position.clone() };
    _deployedDecoys.push(decoy);

    // Affect enemies
    var enemies = _getEnemies();
    var hit = 0;
    for (var i = 0; i < enemies.length; i++) {
      var e = enemies[i];
      if (!e || !e.alive || !e.mesh) continue;
      if (_distXZ(e.mesh.position, group.position) <= DISINFORMATION_RANGE) {
        var dur = _effectiveDuration(e, DISINFORMATION_DURATION);
        e._psyDisinfo     = true;
        e._psyDisinfoDest = group.position.clone();
        e._psyDurTimer    = dur;
        e._psyMilling     = false;
        e._savedBehavior  = e._behavior;
        e._behavior       = 'disinfo_lure';
        hit++;
      }
    }
    _recordCascadeHit(hit);
    _showToast('DISINFORMATION DEPLOYED — ' + hit + ' ENEMIES DECEIVED', '#4488ff');
  }

  // ── Ability: SURRENDER BROADCAST ─────────────────────────────────────────────
  function _activateSurrenderBroadcast() {
    var playerPos = _getPlayerPos();

    // Megaphone icon above player (billboard DOM)
    var tag = document.createElement('div');
    tag.style.cssText = 'position:fixed;top:38%;left:50%;transform:translate(-50%,-50%);' +
      'font-size:36px;pointer-events:none;z-index:9100;' +
      'transition:opacity 1.5s;opacity:1;text-shadow:0 0 12px #ffcc00;';
    tag.textContent = '📢';
    document.body.appendChild(tag);

    // Expanding sound-wave rings
    for (var w = 0; w < 4; w++) {
      var ring = _makeSignalRing(playerPos.clone(), 0xffcc00, SURRENDER_RANGE);
      ring._phase   = w * 0.8;
      ring._isSound = true;
      _activeVfx.push({ mesh: ring, life: 3.0, maxLife: 3.0, type: 'ring', data: {} });
    }

    setTimeout(function () { tag.style.opacity = '0'; }, 1500);
    setTimeout(function () { if (tag.parentNode) tag.parentNode.removeChild(tag); }, 3000);

    // Affect enemies
    var enemies = _getEnemies();
    var hit = 0;
    for (var i = 0; i < enemies.length; i++) {
      var e = enemies[i];
      if (!e || !e.alive || !e.mesh) continue;
      if (_distXZ(e.mesh.position, playerPos) > SURRENDER_RANGE) continue;
      var morale = _getMorale(e);
      var surrendered = false;
      if (morale === 'BROKEN') {
        // Immediate surrender
        _setMorale(e, 'BROKEN');
        e._surrendering = true;
        surrendered = true;
      } else if (morale === 'LOW') {
        if (Math.random() < 0.5) {
          _setMorale(e, 'BROKEN');
          e._surrendering = true;
          surrendered = true;
        }
      }
      if (surrendered) {
        hit++;
        _psyScore += 200;
        // Notify PropagandaSystem if present
        if (window.PropagandaSystem && PropagandaSystem.onPsyOpsSurrender) {
          PropagandaSystem.onPsyOpsSurrender(e);
        }
      }
    }
    _recordCascadeHit(hit);
    _updatePsyHUD();
    _showToast('SURRENDER BROADCAST — ' + hit + ' SURRENDERED', '#ffcc00');
  }

  // ── Ability: IMPERSONATION ────────────────────────────────────────────────────
  function _activateImpersonation() {
    _impersonationActive = true;
    _impersonationTimer  = IMPERSONATION_DURATION;

    // Green silhouette aura — glowing shell around camera (first-person: show as screen tint + 3-D aura at feet)
    if (_impersonationAura) { _scene.remove(_impersonationAura); _impersonationAura = null; }
    var auraGeo = new THREE.CylinderGeometry(0.6, 0.6, 2.0, 12, 1, true);
    var auraMat = new THREE.MeshBasicMaterial({
      color: 0x44ff88, transparent: true, opacity: 0.35, side: THREE.DoubleSide, depthWrite: false
    });
    _impersonationAura = new THREE.Mesh(auraGeo, auraMat);
    _scene.add(_impersonationAura);

    // DOM "ALLY" tag
    if (_impersonationTag && _impersonationTag.parentNode) _impersonationTag.parentNode.removeChild(_impersonationTag);
    _impersonationTag = document.createElement('div');
    _impersonationTag.style.cssText = 'position:fixed;top:24%;left:50%;transform:translate(-50%,-50%);' +
      'color:#44ff88;font-family:monospace;font-size:14px;font-weight:bold;' +
      'text-shadow:0 0 8px #44ff88;background:rgba(0,0,0,0.6);padding:2px 10px;border:1px solid #44ff88;' +
      'border-radius:3px;pointer-events:none;z-index:9100;letter-spacing:2px;';
    _impersonationTag.textContent = '◆ ALLY ◆';
    document.body.appendChild(_impersonationTag);

    // Enemies near player stop attacking
    var playerPos = _getPlayerPos();
    var enemies = _getEnemies();
    var hit = 0;
    for (var i = 0; i < enemies.length; i++) {
      var e = enemies[i];
      if (!e || !e.alive || !e.mesh) continue;
      if (_distXZ(e.mesh.position, playerPos) <= IMPERSONATION_RANGE) {
        e._psyNeutralised = true;
        e._psyNeutralTimer = _effectiveDuration(e, IMPERSONATION_DURATION);
        e._savedBehavior = e._behavior;
        e._behavior = 'neutral';
        hit++;
      }
    }
    _recordCascadeHit(hit);
    _showToast('IMPERSONATION ACTIVE — ' + hit + ' PATROLS DECEIVED', '#44ff88');
  }

  // ── Ability: PANIC BURST ──────────────────────────────────────────────────────
  function _activatePanicBurst() {
    var playerPos = _getPlayerPos();

    // Shockwave ring VFX
    var shockwave = _makeShockwaveRing(playerPos.clone(), 0xff4444, PANIC_BURST_RANGE);
    _activeVfx.push({ mesh: shockwave, life: 1.2, maxLife: 1.2, type: 'shockwave', data: {} });

    // Secondary inner ring
    var shockwave2 = _makeShockwaveRing(playerPos.clone(), 0xff8800, PANIC_BURST_RANGE * 0.7);
    _activeVfx.push({ mesh: shockwave2, life: 0.9, maxLife: 0.9, type: 'shockwave', data: {} });

    // Affect enemies
    var enemies = _getEnemies();
    var hit = 0;
    for (var i = 0; i < enemies.length; i++) {
      var e = enemies[i];
      if (!e || !e.alive || !e.mesh) continue;
      if (_distXZ(e.mesh.position, playerPos) > PANIC_BURST_RANGE) continue;
      var dur = _effectiveDuration(e, PANIC_DURATION);
      e._psyPanic        = true;
      e._psyPanicTimer   = dur;
      e._psyFleeDir      = new THREE.Vector3(Math.random() - 0.5, 0, Math.random() - 0.5).normalize();
      e._psyDropWeapon   = true;
      e._canShoot        = false;
      e._savedBehavior   = e._savedBehavior || e._behavior;
      e._behavior        = 'flee';
      // Head-clutch animation — oscillating rotation
      if (e.mesh) {
        e.mesh._psyPanicRotBase = e.mesh.rotation.z;
        e.mesh._psyPanicAnim   = true;
      }
      hit++;
    }
    _recordCascadeHit(hit);
    _showToast('PANIC BURST — ' + hit + ' ENEMIES ROUTING!', '#ff4444');

    // Audio: deep thud-like synthetic boom
    try {
      var ctx = new (window.AudioContext || window.webkitAudioContext)();
      var osc = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(80, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(20, ctx.currentTime + 0.5);
      gain.gain.setValueAtTime(0.5, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.6);
    } catch (e2) {}
  }

  // ── Activate (public + key-triggered) ────────────────────────────────────────
  function activateAbility(type) {
    if (!_scene || !_camera) return;
    if (!_cooldowns[type]) _cooldowns[type] = 0;
    if (_cooldowns[type] > 0) {
      _showToast(type + ' — COOLING DOWN (' + Math.ceil(_cooldowns[type]) + 's)', '#888888');
      return;
    }
    _cooldowns[type] = ABILITY_COOLDOWNS[type];

    switch (type) {
      case ABILITY.DISINFORMATION: _activateDisinformation(); break;
      case ABILITY.SURRENDER:      _activateSurrenderBroadcast(); break;
      case ABILITY.IMPERSONATION:  _activateImpersonation(); break;
      case ABILITY.PANIC_BURST:    _activatePanicBurst(); break;
    }
    if (_wheelOpen) _updateWheel();
  }

  // ── Influence map ─────────────────────────────────────────────────────────────
  function _buildInfluenceOverlay() {
    if (_influenceOverlay) return;
    var size = INFLUENCE_GRID_SIZE * INFLUENCE_CELL_SIZE;
    var geo  = new THREE.PlaneGeometry(size, size, 1, 1);
    geo.rotateX(-Math.PI / 2);

    _influenceCanvas = document.createElement('canvas');
    _influenceCanvas.width  = INFLUENCE_GRID_SIZE;
    _influenceCanvas.height = INFLUENCE_GRID_SIZE;
    _influenceCtx = _influenceCanvas.getContext('2d');
    _influenceTex = new THREE.CanvasTexture(_influenceCanvas);

    var mat = new THREE.MeshBasicMaterial({
      map: _influenceTex, transparent: true, opacity: 0.45,
      depthWrite: false, side: THREE.DoubleSide
    });
    _influenceOverlay = new THREE.Mesh(geo, mat);
    _influenceOverlay.position.y = 0.15;
    _influenceOverlay.renderOrder = 1;
    _scene.add(_influenceOverlay);
  }

  function _updateInfluenceTexture() {
    if (!_influenceCtx || !_influenceTex) return;
    var W   = INFLUENCE_GRID_SIZE;
    var H   = INFLUENCE_GRID_SIZE;
    var CS  = INFLUENCE_CELL_SIZE;
    var half = (W * CS) / 2;
    var playerPos = _getPlayerPos();
    var enemies   = _getEnemies();

    _influenceCtx.clearRect(0, 0, W, H);

    for (var cy = 0; cy < H; cy++) {
      for (var cx = 0; cx < W; cx++) {
        var wx = (cx - W / 2) * CS + playerPos.x;
        var wz = (cy - H / 2) * CS + playerPos.z;
        var cellPos = { x: wx, z: wz };

        // Player influence: proximity + active PsyOps effects
        var playerInfluence = 0;
        var pd = _distXZ({ x: wx, z: wz }, playerPos);
        if (pd < 30) playerInfluence += Math.max(0, 1 - pd / 30);
        if (_impersonationActive) playerInfluence += Math.max(0, 1 - pd / IMPERSONATION_RANGE);

        // Active decoys extend player influence
        for (var di = 0; di < _deployedDecoys.length; di++) {
          var decoy = _deployedDecoys[di];
          if (!decoy.pos) continue;
          var dd = _distXZ({ x: wx, z: wz }, decoy.pos);
          if (dd < DISINFORMATION_RANGE) playerInfluence += Math.max(0, 1 - dd / DISINFORMATION_RANGE) * 0.6;
        }

        // Enemy influence: living enemies nearby
        var enemyInfluence = 0;
        for (var ei = 0; ei < enemies.length; ei++) {
          var e = enemies[ei];
          if (!e || !e.alive || !e.mesh) continue;
          var ed = _distXZ({ x: wx, z: wz }, e.mesh.position);
          if (ed < 20) {
            var weight = Math.max(0, 1 - ed / 20);
            // Morale adjusts enemy influence
            var m = _getMorale(e);
            if (m === 'HIGH')   weight *= 1.0;
            else if (m === 'MEDIUM') weight *= 0.7;
            else if (m === 'LOW')    weight *= 0.4;
            else                     weight *= 0.1;
            enemyInfluence += weight;
          }
        }

        playerInfluence = Math.min(1, playerInfluence);
        enemyInfluence  = Math.min(1, enemyInfluence);

        var r, g, b, a;
        if (playerInfluence > 0.05 || enemyInfluence > 0.05) {
          if (playerInfluence > enemyInfluence * 1.3) {
            // Green — player control
            r = 0; g = 220; b = 80;
            a = Math.round(playerInfluence * 160);
          } else if (enemyInfluence > playerInfluence * 1.3) {
            // Red — enemy control
            r = 220; g = 40; b = 40;
            a = Math.round(enemyInfluence * 160);
          } else {
            // Yellow — contested
            r = 240; g = 200; b = 20;
            a = Math.round(Math.max(playerInfluence, enemyInfluence) * 160);
          }
          _influenceCtx.fillStyle = 'rgba(' + r + ',' + g + ',' + b + ',' + (a / 255).toFixed(2) + ')';
          _influenceCtx.fillRect(cx, cy, 1, 1);
        }
      }
    }
    _influenceTex.needsUpdate = true;
  }

  function _toggleInfluenceMap() {
    if (!_scene) return;
    if (!_influenceOverlay) _buildInfluenceOverlay();
    _influenceVisible = !_influenceVisible;
    _influenceOverlay.visible = _influenceVisible;
    if (_influenceVisible) {
      _updateInfluenceTexture();
      // Center on player
      var pp = _getPlayerPos();
      _influenceOverlay.position.x = pp.x;
      _influenceOverlay.position.z = pp.z;
    }
    _showToast(_influenceVisible ? 'INFLUENCE MAP ON' : 'INFLUENCE MAP OFF', '#00ccff');
  }

  // ── Keyboard handling ─────────────────────────────────────────────────────────
  function _onKeyDown(e) {
    // Y — open/close wheel
    if (e.code === 'KeyY' && !e.shiftKey && !e.ctrlKey && !e.altKey) {
      if (_wheelOpen) { _closeWheel(); } else { _openWheel(); }
      return;
    }
    // Shift+Y — toggle influence map
    if (e.code === 'KeyY' && e.shiftKey) {
      _toggleInfluenceMap();
      return;
    }
    // 1/2/3/4 while wheel open OR direct activation
    if (e.code === 'Digit1') { activateAbility(ABILITY.DISINFORMATION); _closeWheel(); }
    if (e.code === 'Digit2') { activateAbility(ABILITY.SURRENDER);      _closeWheel(); }
    if (e.code === 'Digit3') { activateAbility(ABILITY.IMPERSONATION);  _closeWheel(); }
    if (e.code === 'Digit4') { activateAbility(ABILITY.PANIC_BURST);    _closeWheel(); }
  }

  // ── Public: getInfluenceAt ────────────────────────────────────────────────────
  function getInfluenceAt(x, z) {
    var pos = { x: x, z: z };
    var playerPos = _getPlayerPos();
    var playerInf = Math.max(0, 1 - _distXZ(pos, playerPos) / 30);

    if (_impersonationActive) playerInf += Math.max(0, 1 - _distXZ(pos, playerPos) / IMPERSONATION_RANGE);

    var enemies = _getEnemies();
    var enemyInf = 0;
    for (var i = 0; i < enemies.length; i++) {
      var e = enemies[i];
      if (!e || !e.alive || !e.mesh) continue;
      var d = _distXZ(pos, e.mesh.position);
      if (d < 20) {
        var w = Math.max(0, 1 - d / 20);
        var m = _getMorale(e);
        if (m === 'HIGH') w *= 1.0;
        else if (m === 'MEDIUM') w *= 0.7;
        else if (m === 'LOW')    w *= 0.4;
        else                     w *= 0.1;
        enemyInf += w;
      }
    }
    playerInf = Math.min(1, playerInf);
    enemyInf  = Math.min(1, enemyInf);

    if (playerInf > enemyInf * 1.3) return 'GREEN';
    if (enemyInf > playerInf * 1.3) return 'RED';
    return 'YELLOW';
  }

  // ── Update ────────────────────────────────────────────────────────────────────
  function update(delta) {
    if (!_scene) return;
    var time = Date.now() * 0.001;

    // Cool down abilities
    var abilityKeys = [ABILITY.DISINFORMATION, ABILITY.SURRENDER, ABILITY.IMPERSONATION, ABILITY.PANIC_BURST];
    for (var ai = 0; ai < abilityKeys.length; ai++) {
      var ab = abilityKeys[ai];
      if (_cooldowns[ab] > 0) _cooldowns[ab] = Math.max(0, _cooldowns[ab] - delta);
    }
    if (_wheelOpen) _updateWheel();

    // ── Update deployed decoys (DISINFORMATION) ─────────────────────────────
    for (var di = _deployedDecoys.length - 1; di >= 0; di--) {
      var decoy = _deployedDecoys[di];
      decoy.timer -= delta;

      // Animate signal rings
      for (var ri = 0; ri < decoy.signalRings.length; ri++) {
        var ring = decoy.signalRings[ri];
        var t = time + ring._phase;
        var progress = (t % 2.0) / 2.0;
        var radius = progress * ring._maxRadius;
        ring.scale.set(radius, radius, 1);
        ring.material.opacity = (1 - progress) * 0.7;
      }

      // Pulse the pole light
      if (decoy.mesh) {
        var lights = [];
        decoy.mesh.traverse(function (child) {
          if (child.isLight) lights.push(child);
        });
        for (var li2 = 0; li2 < lights.length; li2++) {
          lights[li2].intensity = 0.7 + Math.sin(time * 4) * 0.3;
        }
      }

      // Update affected enemies behaviour
      var enemies = _getEnemies();
      for (var ei = 0; ei < enemies.length; ei++) {
        var e = enemies[ei];
        if (!e || !e.alive || !e._psyDisinfo) continue;
        e._psyDurTimer -= delta;
        if (e._psyDurTimer <= 0) {
          // Effect expired — restore
          e._psyDisinfo  = false;
          e._behavior    = e._savedBehavior || 'patrol';
          e._psyMilling  = false;
          continue;
        }
        if (!e._psyMilling && e.mesh && e._psyDisinfoDest) {
          var distToDest = e.mesh.position.distanceTo(e._psyDisinfoDest);
          if (distToDest < 2.0) {
            // Reached fake signal — mill around
            e._psyMilling = true;
          } else {
            // Move toward fake tower
            var dir = e._psyDisinfoDest.clone().sub(e.mesh.position).normalize();
            var spd = (e._speed || 3) * (e._moraleSpeedMult || 1);
            e.mesh.position.addScaledVector(dir, spd * delta * 0.5);
          }
        } else if (e._psyMilling && e.mesh) {
          // Random wander
          e.mesh.position.x += (Math.random() - 0.5) * 0.8 * delta;
          e.mesh.position.z += (Math.random() - 0.5) * 0.8 * delta;
        }
      }

      // Expire decoy
      if (decoy.timer <= 0) {
        if (decoy.mesh && _scene) _scene.remove(decoy.mesh);
        for (var rj = 0; rj < decoy.signalRings.length; rj++) {
          if (_scene) _scene.remove(decoy.signalRings[rj]);
        }
        _deployedDecoys.splice(di, 1);
      }
    }

    // ── Update impersonation ─────────────────────────────────────────────────
    if (_impersonationActive) {
      _impersonationTimer -= delta;

      // Move aura with player
      if (_impersonationAura && _camera) {
        _impersonationAura.position.copy(_camera.position);
        _impersonationAura.position.y -= 0.9;
        _impersonationAura.material.opacity = 0.2 + Math.sin(time * 3) * 0.1;
        _impersonationAura.rotation.y = time * 1.5;
      }

      // Tick neutralised enemies
      var enemies2 = _getEnemies();
      for (var ni = 0; ni < enemies2.length; ni++) {
        var ne = enemies2[ni];
        if (!ne || !ne.alive || !ne._psyNeutralised) continue;
        ne._psyNeutralTimer -= delta;
        if (ne._psyNeutralTimer <= 0) {
          ne._psyNeutralised = false;
          ne._behavior = ne._savedBehavior || 'patrol';
          ne._canShoot = true;
        }
      }

      if (_impersonationTimer <= 0) {
        _impersonationActive = false;
        if (_impersonationAura) { _scene.remove(_impersonationAura); _impersonationAura = null; }
        if (_impersonationTag && _impersonationTag.parentNode) {
          _impersonationTag.parentNode.removeChild(_impersonationTag);
          _impersonationTag = null;
        }
        // Restore all neutralised enemies
        for (var nj = 0; nj < enemies2.length; nj++) {
          var ne2 = enemies2[nj];
          if (!ne2 || !ne2._psyNeutralised) continue;
          ne2._psyNeutralised = false;
          ne2._behavior = ne2._savedBehavior || 'patrol';
          ne2._canShoot = true;
        }
        _showToast('IMPERSONATION EXPIRED — ENEMIES AWARE', '#ff8844');
      }
    }

    // ── Update panicking enemies ─────────────────────────────────────────────
    var allEnemies = _getEnemies();
    for (var pi = 0; pi < allEnemies.length; pi++) {
      var pe = allEnemies[pi];
      if (!pe || !pe.alive || !pe._psyPanic) continue;
      pe._psyPanicTimer -= delta;
      if (pe._psyPanicTimer <= 0) {
        pe._psyPanic   = false;
        pe._canShoot   = true;
        pe._behavior   = pe._savedBehavior || 'patrol';
        if (pe.mesh) {
          pe.mesh._psyPanicAnim = false;
          pe.mesh.rotation.z    = 0;
        }
        continue;
      }
      // Flee movement
      if (pe.mesh && pe._psyFleeDir) {
        var fleeSpd = (pe._speed || 3) * 1.4;
        pe.mesh.position.addScaledVector(pe._psyFleeDir, fleeSpd * delta);
        // Occasional direction change
        if (Math.random() < 0.02) {
          pe._psyFleeDir = new THREE.Vector3(Math.random() - 0.5, 0, Math.random() - 0.5).normalize();
        }
        // Head-clutch animation
        if (pe.mesh._psyPanicAnim) {
          pe.mesh.rotation.z = Math.sin(time * 8) * 0.3;
          pe.mesh.rotation.x = Math.cos(time * 6) * 0.2;
        }
      }
    }

    // ── Update VFX (rings, shockwaves) ───────────────────────────────────────
    for (var vi = _activeVfx.length - 1; vi >= 0; vi--) {
      var vfx = _activeVfx[vi];
      vfx.life -= delta;
      if (vfx.life <= 0) {
        if (_scene) _scene.remove(vfx.mesh);
        _activeVfx.splice(vi, 1);
        continue;
      }
      var progress2 = 1 - (vfx.life / vfx.maxLife);
      if (vfx.type === 'shockwave') {
        var sr = 1 + progress2 * vfx.mesh._maxRadius;
        vfx.mesh.scale.set(sr, sr, 1);
        vfx.mesh.material.opacity = (1 - progress2) * 0.9;
      } else if (vfx.type === 'ring') {
        // Sound-wave rings expand slowly
        var t2 = time + (vfx.mesh._phase || 0);
        var rp = (t2 % 3.0) / 3.0;
        var rr = rp * vfx.mesh._maxRadius;
        vfx.mesh.scale.set(rr, rr, 1);
        vfx.mesh.material.opacity = (1 - rp) * 0.65 * (vfx.life / vfx.maxLife);
      }
    }

    // ── Update influence map if visible ─────────────────────────────────────
    if (_influenceVisible && _influenceOverlay) {
      // Throttle texture refresh to every 0.5s
      if (!_influenceOverlay._lastUpdate || time - _influenceOverlay._lastUpdate > 0.5) {
        _influenceOverlay._lastUpdate = time;
        var pp2 = _getPlayerPos();
        _influenceOverlay.position.x = pp2.x;
        _influenceOverlay.position.z = pp2.z;
        _updateInfluenceTexture();
      }
    }

    // ── Cascade window cleanup ───────────────────────────────────────────────
    var now2 = Date.now() * 0.001;
    for (var ci = _cascadeEvents.length - 1; ci >= 0; ci--) {
      if (now2 - _cascadeEvents[ci] > CASCADE_WINDOW) _cascadeEvents.splice(ci, 1);
    }

    _updatePsyHUD();
  }

  // ── Init ──────────────────────────────────────────────────────────────────────
  function init(scene, camera) {
    _scene  = scene  || window._gameScene;
    _camera = camera || window._camera;

    _cooldowns = {};
    _psyScore  = 0;
    _deployedDecoys = [];
    _activeVfx      = [];
    _cascadeEvents   = [];
    _cascadeTriggeredAt = -999;
    _impersonationActive = false;
    _impersonationTimer  = 0;
    _wheelOpen = false;
    _influenceVisible = false;

    _createWheel();
    _createPsyHUD();

    document.addEventListener('keydown', _onKeyDown);
  }

  // ── Reset ─────────────────────────────────────────────────────────────────────
  function reset() {
    document.removeEventListener('keydown', _onKeyDown);

    // Remove decoys
    for (var di = 0; di < _deployedDecoys.length; di++) {
      var decoy = _deployedDecoys[di];
      if (decoy.mesh && _scene) _scene.remove(decoy.mesh);
      for (var ri = 0; ri < decoy.signalRings.length; ri++) {
        if (_scene) _scene.remove(decoy.signalRings[ri]);
      }
    }
    _deployedDecoys = [];

    // Remove VFX
    for (var vi = 0; vi < _activeVfx.length; vi++) {
      if (_scene) _scene.remove(_activeVfx[vi].mesh);
    }
    _activeVfx = [];

    // Remove aura
    if (_impersonationAura && _scene) { _scene.remove(_impersonationAura); _impersonationAura = null; }
    if (_impersonationTag && _impersonationTag.parentNode) {
      _impersonationTag.parentNode.removeChild(_impersonationTag);
      _impersonationTag = null;
    }

    // Remove influence overlay
    if (_influenceOverlay && _scene) { _scene.remove(_influenceOverlay); _influenceOverlay = null; }
    _influenceCanvas = null;
    _influenceCtx    = null;
    _influenceTex    = null;

    // Remove HUD
    if (_psyHudEl && _psyHudEl.parentNode) { _psyHudEl.parentNode.removeChild(_psyHudEl); _psyHudEl = null; }
    if (_wheelEl && _wheelEl.parentNode)   { _wheelEl.parentNode.removeChild(_wheelEl);   _wheelEl  = null; }

    _cooldowns = {};
    _psyScore  = 0;
    _impersonationActive = false;
    _impersonationTimer  = 0;
    _wheelOpen = false;
    _cascadeEvents = [];
  }

  // ── Public API ────────────────────────────────────────────────────────────────
  return {
    init:            init,
    update:          update,
    activateAbility: activateAbility,
    getInfluenceAt:  getInfluenceAt,
    reset:           reset
  };

})();
