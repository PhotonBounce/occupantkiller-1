/* ───────────────────────────────────────────────────────────────────────
   SUPPLY RUN — Side mission that fires on every 2nd wave.
   3 supply crates appear at random positions; player must carry all 3
   to an extraction zone within 90 seconds.

   Globals exposed:
     window._supplyRunActive  — true while a supply-run mission is live
     window._cratesCarried    — number of crates currently held (0–3)
     window._supplyRunTimer   — seconds remaining on the mission clock

   Depends on: THREE, HUD (showToast, setScore optional), GameManager
               (player.score, player.position), Weapons (addAmmo/refillAmmo)
               Enemies (spawnSingle — for reinforcements), AudioSystem
   ─────────────────────────────────────────────────────────────────────── */
window.SupplyRun = (function () {
  'use strict';

  /* ── Constants ─────────────────────────────────────────────────────── */
  var CRATE_COUNT          = 3;
  var PICKUP_RADIUS        = 1.5;      // auto-collect within this distance
  var EXTRACT_RADIUS       = 4.0;      // half-diameter of the 8-unit green circle
  var MISSION_TIME         = 90;       // seconds
  var SCORE_PER_CRATE      = 800;
  var SCORE_COMPLETION     = 2400;
  var WAVE_BONUS_MULT      = 0.25;     // +25 % on next wave bonus
  var SLOW_FACTOR          = 0.20;     // 20 % slower while carrying a crate
  var SPAWN_RADIUS_MIN     = 18;
  var SPAWN_RADIUS_MAX     = 38;
  var REINF_COUNT          = 4;        // enemies that contest the route

  /* ── Olive-green colour (0x6B7C3C ≈ #6b7c3c) ──────────────────────── */
  var CRATE_COLOR          = 0x6B7C3C;
  var CROSS_COLOR          = 0xFFFFFF;
  var EXTRACT_COLOR        = 0x00FF44;

  /* ── Module state ───────────────────────────────────────────────────── */
  var _scene               = null;
  var _active              = false;
  var _timer               = 0;
  var _cratesCarried       = 0;
  var _cratesDelivered     = 0;
  var _crates              = [];       // { group, collected, bobOffset }
  var _extractZone         = null;     // THREE.Mesh (ring on ground)
  var _extractPos          = null;     // THREE.Vector3
  var _hudEl               = null;     // injected DOM element
  var _speedPenaltyApplied = false;
  var _waveBonusQueued     = false;

  /* ── Public globals ─────────────────────────────────────────────────── */
  window._supplyRunActive  = false;
  window._cratesCarried    = 0;
  window._supplyRunTimer   = 0;

  /* ─────────────────────────────────────────────────────────────────────
     Helpers
  ───────────────────────────────────────────────────────────────────── */
  function _getScene() {
    if (_scene) return _scene;
    if (window.GameManager && GameManager.getScene) return GameManager.getScene();
    if (window._scene) return window._scene;
    return null;
  }

  function _getPlayerPos() {
    try {
      if (window.GameManager && GameManager.getPlayer) {
        var p = GameManager.getPlayer();
        if (p && p.position) return p.position;
      }
    } catch (e) {}
    if (window.player && window.player.position) return window.player.position;
    return null;
  }

  function _addScore(pts) {
    try {
      if (window.player) { window.player.score = (window.player.score || 0) + pts; }
      if (window.HUD && HUD.setScore && window.player) HUD.setScore(window.player.score);
    } catch (e) {}
  }

  function _toast(msg, dur, color) {
    try {
      if (window.HUD && HUD.showToast) {
        HUD.showToast(msg, dur || 3000, color || '#44ff88');
      }
    } catch (e) {}
  }

  function _terrainY(x, z) {
    try {
      if (window.VoxelWorld && VoxelWorld.getTerrainHeight) {
        return VoxelWorld.getTerrainHeight(Math.round(x), Math.round(z)) || 0;
      }
    } catch (e) {}
    return 0;
  }

  function _randomPos(playerPos) {
    var angle = Math.random() * Math.PI * 2;
    var dist  = SPAWN_RADIUS_MIN + Math.random() * (SPAWN_RADIUS_MAX - SPAWN_RADIUS_MIN);
    var x = (playerPos ? playerPos.x : 0) + Math.cos(angle) * dist;
    var z = (playerPos ? playerPos.z : 0) + Math.sin(angle) * dist;
    return { x: x, y: _terrainY(x, z), z: z };
  }

  /* ─────────────────────────────────────────────────────────────────────
     Build a supply crate mesh
     BoxGeometry(0.5, 0.5, 0.5), olive-green, white-cross markings
  ───────────────────────────────────────────────────────────────────── */
  function _buildCrate(pos) {
    var group = new THREE.Group();

    /* Body */
    var bodyGeo = new THREE.BoxGeometry(0.5, 0.5, 0.5);
    var bodyMat = new THREE.MeshLambertMaterial({ color: CRATE_COLOR });
    var body    = new THREE.Mesh(bodyGeo, bodyMat);
    group.add(body);

    /* White cross — horizontal bar */
    var crossH = new THREE.Mesh(
      new THREE.BoxGeometry(0.32, 0.06, 0.06),
      new THREE.MeshBasicMaterial({ color: CROSS_COLOR })
    );
    crossH.position.set(0, 0.28, 0);
    group.add(crossH);

    /* White cross — vertical bar */
    var crossV = new THREE.Mesh(
      new THREE.BoxGeometry(0.06, 0.32, 0.06),
      new THREE.MeshBasicMaterial({ color: CROSS_COLOR })
    );
    crossV.position.set(0, 0.28, 0);
    group.add(crossV);

    /* Faint glow ring at base so it's easy to spot */
    var ringGeo = new THREE.RingGeometry(0.4, 0.55, 20);
    var ringMat = new THREE.MeshBasicMaterial({
      color: 0xffff00, side: THREE.DoubleSide, transparent: true, opacity: 0.55
    });
    var ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI * 0.5;
    ring.position.y = -0.24;
    group.add(ring);

    group.position.set(pos.x, pos.y + 0.25, pos.z);
    return group;
  }

  /* ─────────────────────────────────────────────────────────────────────
     Build the extraction zone — green circle (ring) on ground
  ───────────────────────────────────────────────────────────────────── */
  function _buildExtractZone(pos) {
    var geo  = new THREE.RingGeometry(3.0, 4.0, 40);
    var mat  = new THREE.MeshBasicMaterial({
      color: EXTRACT_COLOR, side: THREE.DoubleSide, transparent: true, opacity: 0.60
    });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.rotation.x = -Math.PI * 0.5;
    mesh.position.set(pos.x, pos.y + 0.05, pos.z);

    /* Solid fill circle at lower opacity */
    var fillGeo = new THREE.CircleGeometry(3.0, 40);
    var fillMat = new THREE.MeshBasicMaterial({
      color: EXTRACT_COLOR, side: THREE.DoubleSide, transparent: true, opacity: 0.18
    });
    var fill = new THREE.Mesh(fillGeo, fillMat);
    fill.rotation.x = -Math.PI * 0.5;
    fill.position.set(pos.x, pos.y + 0.04, pos.z);

    return { ring: mesh, fill: fill };
  }

  /* ─────────────────────────────────────────────────────────────────────
     HUD element — crate carry indicator
  ───────────────────────────────────────────────────────────────────── */
  function _createHUDEl() {
    if (_hudEl) return;
    _hudEl = document.createElement('div');
    _hudEl.id = 'supply-run-hud';
    _hudEl.style.cssText = [
      'display:none',
      'position:fixed',
      'bottom:200px',
      'left:50%',
      'transform:translateX(-50%)',
      'background:rgba(0,0,0,0.65)',
      'border:1px solid #44ff88',
      'color:#44ff88',
      'padding:5px 16px',
      'border-radius:5px',
      'font-size:12px',
      'font-family:monospace',
      'z-index:201',
      'pointer-events:none',
      'text-align:center'
    ].join(';');
    document.body.appendChild(_hudEl);
  }

  function _updateHUD() {
    if (!_hudEl) return;
    if (!_active) {
      _hudEl.style.display = 'none';
      return;
    }
    _hudEl.style.display = 'block';
    var timeLeft = Math.ceil(_timer);
    var carrying = _cratesCarried;
    var delivered = _cratesDelivered;
    var carryStr = carrying > 0 ? ' | 📦×' + carrying : '';
    _hudEl.textContent =
      '⚡ SUPPLY RUN  ' + delivered + '/3 delivered' + carryStr +
      '  |  ⏱ ' + timeLeft + 's';
    if (timeLeft <= 20) {
      _hudEl.style.color = '#ff4444';
      _hudEl.style.borderColor = '#ff4444';
    } else {
      _hudEl.style.color = '#44ff88';
      _hudEl.style.borderColor = '#44ff88';
    }
  }

  /* ─────────────────────────────────────────────────────────────────────
     Spawn enemy reinforcements to contest the route
  ───────────────────────────────────────────────────────────────────── */
  function _spawnReinforcements() {
    try {
      if (!window.Enemies || !Enemies.spawnSingle) return;
      var playerPos = _getPlayerPos();
      for (var i = 0; i < REINF_COUNT; i++) {
        var angle = (i / REINF_COUNT) * Math.PI * 2 + Math.random() * 0.6;
        var dist  = 22 + Math.random() * 14;
        var rx    = (playerPos ? playerPos.x : 0) + Math.cos(angle) * dist;
        var rz    = (playerPos ? playerPos.z : 0) + Math.sin(angle) * dist;
        var ry    = _terrainY(rx, rz);
        var types = ['SOLDIER', 'SOLDIER', 'STORMER', 'ARMORED'];
        var etype = types[i % types.length];
        try {
          Enemies.spawnSingle(etype, new THREE.Vector3(rx, ry, rz));
        } catch (e) {}
      }
    } catch (e) {}
  }

  /* ─────────────────────────────────────────────────────────────────────
     Apply / remove player speed penalty
  ───────────────────────────────────────────────────────────────────── */
  function _applySpeedPenalty(apply) {
    try {
      if (window.GameManager && GameManager.setSpeedMult) {
        GameManager.setSpeedMult(apply ? (1 - SLOW_FACTOR) : 1.0);
        _speedPenaltyApplied = apply;
        return;
      }
    } catch (e) {}
    /* Fallback: tweak player.speed directly */
    try {
      if (window.player) {
        if (apply && !_speedPenaltyApplied) {
          window.player._srOrigSpeed = window.player.speed;
          window.player.speed = (window.player.speed || 5) * (1 - SLOW_FACTOR);
          _speedPenaltyApplied = true;
        } else if (!apply && _speedPenaltyApplied) {
          if (window.player._srOrigSpeed !== undefined) {
            window.player.speed = window.player._srOrigSpeed;
          }
          _speedPenaltyApplied = false;
        }
      }
    } catch (e) {}
  }

  /* ─────────────────────────────────────────────────────────────────────
     Collect a crate (called when player walks into it)
  ───────────────────────────────────────────────────────────────────── */
  function _collectCrate(crateObj) {
    if (crateObj.collected) return;
    crateObj.collected = true;

    var sc = _getScene();
    if (sc) sc.remove(crateObj.group);

    _cratesCarried++;
    window._cratesCarried = _cratesCarried;

    _addScore(SCORE_PER_CRATE);

    _toast('📦 CRATE SECURED! +' + SCORE_PER_CRATE + '  Deliver to extraction!', 3000, '#ffdd44');

    try { if (window.AudioSystem && AudioSystem.playPickup) AudioSystem.playPickup(); } catch (e) {}

    /* Apply slowdown once first crate picked */
    if (_cratesCarried >= 1) _applySpeedPenalty(true);
  }

  /* ─────────────────────────────────────────────────────────────────────
     Deliver crates at extraction zone
  ───────────────────────────────────────────────────────────────────── */
  function _deliverCrates() {
    if (_cratesCarried <= 0) return;

    var delivered = _cratesCarried;
    _cratesDelivered += delivered;
    _cratesCarried = 0;
    window._cratesCarried = 0;

    /* Full ammo resupply */
    try {
      if (window.Weapons && Weapons.refillAmmo) {
        Weapons.refillAmmo(1.0);
      } else if (window.Weapons && Weapons.addAmmo) {
        Weapons.addAmmo(250);
      }
    } catch (e) {}

    _toast('📦 ' + delivered + ' crate(s) delivered! Full ammo resupply!', 4000, '#44ff88');

    try { if (window.AudioSystem && AudioSystem.playReadyChime) AudioSystem.playReadyChime(); } catch (e) {}

    /* Restore speed when not carrying */
    _applySpeedPenalty(false);

    /* Check if all crates delivered */
    if (_cratesDelivered >= CRATE_COUNT) {
      _completeMission(true);
    }
  }

  /* ─────────────────────────────────────────────────────────────────────
     Complete / fail the mission
  ───────────────────────────────────────────────────────────────────── */
  function _completeMission(success) {
    if (!_active) return;
    _active = false;
    window._supplyRunActive = false;

    /* Restore speed */
    _applySpeedPenalty(false);

    var sc = _getScene();

    /* Remove any uncollected crates */
    for (var i = 0; i < _crates.length; i++) {
      if (!_crates[i].collected && sc) sc.remove(_crates[i].group);
    }

    /* Remove extraction zone */
    if (_extractZone && sc) {
      sc.remove(_extractZone.ring);
      sc.remove(_extractZone.fill);
    }

    _crates      = [];
    _extractZone = null;
    _extractPos  = null;

    if (success) {
      _addScore(SCORE_COMPLETION);
      _waveBonusQueued = true;
      /* Store wave bonus flag for GameManager to pick up */
      window._supplyRunWaveBonus = WAVE_BONUS_MULT;

      try {
        if (window.HUD && HUD.showToast) {
          HUD.showToast(
            'SUPPLY RUN COMPLETE! +' + SCORE_COMPLETION + '  Wave bonus +25%',
            6000, '#00ff88'
          );
        }
      } catch (e) {}

      try { if (window.AudioSystem && AudioSystem.playLevelComplete) AudioSystem.playLevelComplete(); } catch (e) {}
    } else {
      /* Mission failed / timed out */
      _toast('❌ SUPPLY RUN FAILED — time expired!', 4000, '#ff4444');
      try { if (window.AudioSystem && AudioSystem.playDeath) AudioSystem.playDeath(0.5); } catch (e) {}
    }

    _updateHUD();
  }

  /* ─────────────────────────────────────────────────────────────────────
     PUBLIC: init — store scene reference, create HUD element
  ───────────────────────────────────────────────────────────────────── */
  function init(scene) {
    _scene = scene || null;
    _createHUDEl();
  }

  /* ─────────────────────────────────────────────────────────────────────
     PUBLIC: startMission — called by game logic on every 2nd wave
  ───────────────────────────────────────────────────────────────────── */
  function startMission(waveNum) {
    if (_active) return; /* already running */

    var sc = _getScene() || _scene;
    if (!sc) return;

    _active          = true;
    _timer           = MISSION_TIME;
    _cratesCarried   = 0;
    _cratesDelivered = 0;
    _crates          = [];
    _waveBonusQueued = false;
    _speedPenaltyApplied = false;

    window._supplyRunActive  = true;
    window._cratesCarried    = 0;
    window._supplyRunTimer   = _timer;
    window._supplyRunWaveBonus = 0;

    var playerPos = _getPlayerPos();

    /* Spawn 3 supply crates at scattered positions */
    for (var i = 0; i < CRATE_COUNT; i++) {
      var pos = _randomPos(playerPos);
      var group = _buildCrate(pos);
      sc.add(group);
      _crates.push({
        group: group,
        collected: false,
        bobOffset: i * 1.2  /* stagger bobbing phase */
      });
    }

    /* Extraction zone — offset from player in a random direction */
    var exAngle = Math.random() * Math.PI * 2;
    var exDist  = 25 + Math.random() * 15;
    var exX = (playerPos ? playerPos.x : 0) + Math.cos(exAngle) * exDist;
    var exZ = (playerPos ? playerPos.z : 0) + Math.sin(exAngle) * exDist;
    var exY = _terrainY(exX, exZ);
    _extractPos = new THREE.Vector3(exX, exY, exZ);

    var ez = _buildExtractZone({ x: exX, y: exY, z: exZ });
    _extractZone = ez;
    sc.add(ez.ring);
    sc.add(ez.fill);

    /* Announce */
    _toast(
      '⚡ SUPPLY RUN MISSION — Secure 3 crates & deliver to extraction! 90 sec',
      6000, '#ffdd44'
    );

    try { if (window.AudioSystem && AudioSystem.playWaveStart) AudioSystem.playWaveStart(); } catch (e) {}

    /* Spawn enemy reinforcements to contest the route */
    _spawnReinforcements();

    _updateHUD();
  }

  /* ─────────────────────────────────────────────────────────────────────
     PUBLIC: update — called every frame from GameManager (or the main loop)
     dt = delta time in seconds
  ───────────────────────────────────────────────────────────────────── */
  function update(dt, playerPos) {
    if (!_active) return;

    dt = dt || 0.016;

    /* Use provided playerPos or fall back to global */
    var pPos = playerPos || _getPlayerPos();

    /* Countdown timer */
    _timer -= dt;
    window._supplyRunTimer = Math.max(0, _timer);

    if (_timer <= 0) {
      _completeMission(false);
      return;
    }

    /* Bob all uncollected crates */
    var now = Date.now() * 0.001;
    for (var i = 0; i < _crates.length; i++) {
      var c = _crates[i];
      if (c.collected) continue;

      /* Bobbing animation */
      c.group.position.y = c.group.position.y +
        Math.sin(now * 2 + c.bobOffset) * 0.008;
      c.group.rotation.y += dt * 0.6;

      /* Proximity pickup check */
      if (pPos) {
        var dx = pPos.x - c.group.position.x;
        var dz = pPos.z - c.group.position.z;
        if (dx * dx + dz * dz <= PICKUP_RADIUS * PICKUP_RADIUS) {
          _collectCrate(c);
        }
      }
    }

    /* Pulse the extraction zone */
    if (_extractZone) {
      var pulse = 0.50 + 0.15 * Math.abs(Math.sin(now * 1.6));
      _extractZone.ring.material.opacity = pulse;
      _extractZone.fill.material.opacity = pulse * 0.4;
    }

    /* Check if player (carrying crates) is in extraction zone */
    if (_cratesCarried > 0 && pPos && _extractPos) {
      var edx = pPos.x - _extractPos.x;
      var edz = pPos.z - _extractPos.z;
      if (edx * edx + edz * edz <= EXTRACT_RADIUS * EXTRACT_RADIUS) {
        _deliverCrates();
      }
    }

    _updateHUD();
  }

  /* ─────────────────────────────────────────────────────────────────────
     PUBLIC: reset — clears all state (new game / stage change)
  ───────────────────────────────────────────────────────────────────── */
  function reset() {
    if (_active) _completeMission(false);

    _scene               = null;
    _active              = false;
    _timer               = 0;
    _cratesCarried       = 0;
    _cratesDelivered     = 0;
    _crates              = [];
    _extractZone         = null;
    _extractPos          = null;
    _speedPenaltyApplied = false;
    _waveBonusQueued     = false;

    window._supplyRunActive    = false;
    window._cratesCarried      = 0;
    window._supplyRunTimer     = 0;
    window._supplyRunWaveBonus = 0;

    if (_hudEl) _hudEl.style.display = 'none';
  }

  /* ─────────────────────────────────────────────────────────────────────
     Convenience helper consumed by GameManager:
       SupplyRun.onWaveStart(waveNum) — triggers mission on even waves
  ───────────────────────────────────────────────────────────────────── */
  function onWaveStart(waveNum) {
    if (!waveNum || waveNum < 2) return;
    if (waveNum % 2 === 0) {
      startMission(waveNum);
    }
  }

  /* ─────────────────────────────────────────────────────────────────────
     Expose public API
  ───────────────────────────────────────────────────────────────────── */
  return {
    init:         init,
    update:       update,
    reset:        reset,
    startMission: startMission,
    onWaveStart:  onWaveStart
  };

}());
