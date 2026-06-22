/**
 * enemy-suicide-bomber.js – Suicide Bomber enemy type for Occupant Killer
 *
 * Fast enemy that sprints at the player and detonates on contact.
 * Spawns from wave 7+, 1–2 per wave, mixed with normal enemies.
 *
 * Depends on: THREE (global), AudioSystem, CameraSystem, Tracers, HUD
 * Communicates damage via window._takeDamageFromWaveEvent
 * Registers itself as window.EnemySuicideBomber
 * Maintains active bomber list at window._suicideBombers
 */
window.EnemySuicideBomber = (function () {
  'use strict';

  // ── Constants ─────────────────────────────────────────────────────────────
  var HP              = 60;
  var DETECT_RANGE    = 20;    // units — switches IDLE → SPRINT
  var WARN_RANGE      = 10;    // units — shows HUD warning
  var SPRINT_SPEED    = 7;     // units/s
  var WANDER_SPEED    = 1.5;   // units/s in IDLE
  var PRIME_RANGE     = 3;     // units — switches SPRINT → PRIMED
  var DETONATE_RANGE  = 2;     // units — immediate detonation
  var FALL_THRESHOLD  = -2;    // Y below which emergency detonate

  // Explosion damage tiers  [damage, radius]
  var EXPL_TIERS = [
    [150, 4],
    [80,  8],
    [30,  14]
  ];
  // Death explosion (smaller)
  var EXPL_TIERS_DEATH = [
    [80,  3],
    [40,  6],
    [20,  10]
  ];

  var BEEP_FREQ       = 800;   // Hz
  var BEEP_INTERVAL_FAR  = 1.0;  // seconds at max range
  var BEEP_INTERVAL_NEAR = 0.15; // seconds when primed

  var SCORE_KILL_BEFORE  = 400;  // shot before reaching player
  var SCORE_KILL_DURING  = 200;  // killed while already exploding

  // Visual colours
  var COLOR_VEST      = 0x556B2F; // olive green
  var COLOR_LED       = 0xFF0000; // red LED strips
  var COLOR_DETONATOR = 0x333333; // dark grey
  var COLOR_SKIN      = 0xC68642;
  var COLOR_UNIFORM   = 0x4A5240;
  var COLOR_EYES      = 0x222222;

  // FSM states
  var STATE_IDLE     = 'IDLE';
  var STATE_SPRINT   = 'SPRINT';
  var STATE_PRIMED   = 'PRIMED';
  var STATE_DETONATE = 'DETONATE';
  var STATE_DEAD     = 'DEAD';

  // ── Module-level state ────────────────────────────────────────────────────
  var _scene         = null;
  var _inited        = false;
  var _warningShown  = false;
  var _warningEl     = null;  // DOM element for the ⚠ flash

  // Public bomber list
  window._suicideBombers = window._suicideBombers || [];

  // ── Geometry / material caches ────────────────────────────────────────────
  var _geoBody     = null;
  var _geoHead     = null;
  var _geoVest     = null;
  var _geoLED      = null;
  var _geoArm      = null;
  var _geoDet      = null;
  var _geoDebris   = null;
  var _geoSmoke    = null;

  var _matVest     = null;
  var _matLED      = null;
  var _matSkin     = null;
  var _matUniform  = null;
  var _matDet      = null;
  var _matDebris   = null;
  var _matSmoke    = null;

  // Active debris / smoke particles (for cleanup)
  var _particles   = [];

  // ── Internal helpers ──────────────────────────────────────────────────────

  function _ensureGeos() {
    if (_geoBody)   return;
    _geoBody    = new THREE.BoxGeometry(0.6, 1.1, 0.35);
    _geoHead    = new THREE.BoxGeometry(0.4, 0.4, 0.4);
    _geoVest    = new THREE.BoxGeometry(0.5, 0.6, 0.3);
    _geoLED     = new THREE.BoxGeometry(0.04, 0.04, 0.32);
    _geoArm     = new THREE.BoxGeometry(0.18, 0.6, 0.18);
    _geoDet     = new THREE.BoxGeometry(0.12, 0.22, 0.08);
    _geoDebris  = new THREE.BoxGeometry(0.15, 0.15, 0.15);
    _geoSmoke   = new THREE.SphereGeometry(1.5, 6, 6);

    _matVest    = new THREE.MeshLambertMaterial({ color: COLOR_VEST });
    _matLED     = new THREE.MeshBasicMaterial({ color: COLOR_LED });
    _matSkin    = new THREE.MeshLambertMaterial({ color: COLOR_SKIN });
    _matUniform = new THREE.MeshLambertMaterial({ color: COLOR_UNIFORM });
    _matDet     = new THREE.MeshLambertMaterial({ color: COLOR_DETONATOR });
    _matDebris  = new THREE.MeshLambertMaterial({ color: 0x888866 });
    _matSmoke   = new THREE.MeshBasicMaterial({
      color: 0x666666, transparent: true, opacity: 0.6,
      depthWrite: false
    });
  }

  function _buildMesh() {
    _ensureGeos();

    var root = new THREE.Group();

    // Body
    var body = new THREE.Mesh(_geoBody, _matUniform);
    body.position.y = 0;
    root.add(body);

    // Head
    var head = new THREE.Mesh(_geoHead, _matSkin);
    head.position.y = 0.75;
    root.add(head);

    // Vest (olive, sits over chest)
    var vest = new THREE.Mesh(_geoVest, _matVest);
    vest.position.set(0, 0.05, 0.02);
    root.add(vest);

    // LED strip across vest front
    var led = new THREE.Mesh(_geoLED, _matLED);
    led.position.set(0, 0.12, 0.185);
    root.add(led);

    // Second LED strip (lower)
    var led2 = new THREE.Mesh(_geoLED, _matLED);
    led2.position.set(0, -0.05, 0.185);
    root.add(led2);

    // Left arm (raised slightly)
    var armL = new THREE.Mesh(_geoArm, _matUniform);
    armL.position.set(-0.4, 0.1, 0);
    armL.rotation.z = -0.4;   // raised
    root.add(armL);

    // Right arm (raised, holds detonator)
    var armR = new THREE.Mesh(_geoArm, _matUniform);
    armR.position.set(0.4, 0.1, 0);
    armR.rotation.z = 0.4;    // raised
    root.add(armR);

    // Detonator in right hand
    var det = new THREE.Mesh(_geoDet, _matDet);
    det.position.set(0.42, -0.12, 0.08);
    root.add(det);

    // Red glow light (starts dim, intensifies in PRIMED)
    var glow = new THREE.PointLight(COLOR_LED, 0.3, 3);
    glow.position.set(0, 0.1, 0.25);
    root.add(glow);
    root._glow = glow;

    // HP bar (simple canvas texture plane — minimal version)
    root._hpBar  = null; // will be created on demand

    return root;
  }

  // ── Beep audio ────────────────────────────────────────────────────────────

  function _playBeep(bomber) {
    var now = performance.now() / 1000;
    if (now < (bomber._nextBeep || 0)) return;

    // Compute interval based on distance to player
    var dist = bomber._distToPlayer || DETECT_RANGE;
    var t    = 1 - Math.min(1, Math.max(0, (dist - PRIME_RANGE) / (DETECT_RANGE - PRIME_RANGE)));
    var interval = BEEP_INTERVAL_FAR + (BEEP_INTERVAL_NEAR - BEEP_INTERVAL_FAR) * t;

    bomber._nextBeep = now + interval;

    // Use AudioSystem's internal Web Audio context if available
    try {
      var AS = window.AudioSystem;
      if (!AS || !AS._ctx) {
        // Minimal fallback using raw Web Audio
        var ctx = (window._bomberAudioCtx = window._bomberAudioCtx ||
          new (window.AudioContext || window.webkitAudioContext)());
        if (ctx.state === 'suspended') ctx.resume();
        var osc  = ctx.createOscillator();
        var gain = ctx.createGain();
        osc.frequency.value = BEEP_FREQ;
        osc.type = 'sine';
        gain.gain.setValueAtTime(0.18, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.09);
        return;
      }
      // AudioSystem exposes _ctx on some builds; try direct access
      if (typeof AS._ctx !== 'undefined') {
        var ctx2  = AS._ctx;
        if (ctx2.state === 'suspended') ctx2.resume();
        var osc2  = ctx2.createOscillator();
        var gain2 = ctx2.createGain();
        osc2.frequency.value = BEEP_FREQ;
        osc2.type = 'sine';
        gain2.gain.setValueAtTime(0.15, ctx2.currentTime);
        gain2.gain.exponentialRampToValueAtTime(0.001, ctx2.currentTime + 0.08);
        osc2.connect(gain2);
        gain2.connect(ctx2.destination);
        osc2.start(ctx2.currentTime);
        osc2.stop(ctx2.currentTime + 0.09);
      }
    } catch (e) { /* audio unavailable */ }
  }

  // ── Warning HUD ───────────────────────────────────────────────────────────

  function _createWarningEl() {
    if (_warningEl) return;
    _warningEl = document.createElement('div');
    _warningEl.id = 'sb-warning';
    _warningEl.style.cssText = [
      'position:fixed',
      'top:18%',
      'left:50%',
      'transform:translateX(-50%)',
      'color:#ff1111',
      'font-family:"Segoe UI",monospace,sans-serif',
      'font-size:15px',
      'font-weight:900',
      'letter-spacing:2px',
      'text-shadow:0 0 8px #ff0000,0 0 2px #000',
      'z-index:500',
      'pointer-events:none',
      'display:none',
      'text-align:center',
      'white-space:nowrap'
    ].join(';');
    _warningEl.textContent = '⚠️ SUICIDE BOMBER';
    document.body.appendChild(_warningEl);
  }

  function _showWarning(show) {
    if (!_warningEl) _createWarningEl();
    if (show === _warningShown) return;
    _warningShown = show;
    if (show) {
      _warningEl.style.display = 'block';
      // Flashing via CSS animation injected once
      if (!_warningEl._animated) {
        _warningEl._animated = true;
        var styleEl = document.createElement('style');
        styleEl.textContent = '@keyframes sb-flash{0%,100%{opacity:1}50%{opacity:0.1}}' +
          '#sb-warning{animation:sb-flash 0.45s infinite}';
        document.head.appendChild(styleEl);
      }
    } else {
      _warningEl.style.display = 'none';
    }
  }

  // ── Explosion VFX + damage ────────────────────────────────────────────────

  function _doExplosion(bomber, tiers) {
    if (!_scene) return;
    _ensureGeos();

    var pos = bomber.mesh.position;

    // Use Tracers.spawnExplosion for the main VFX
    if (typeof Tracers !== 'undefined' && Tracers.spawnExplosion) {
      Tracers.spawnExplosion(pos, tiers[0][1]);
    } else {
      // Fallback: manual flash light + camera shake
      var flash = new THREE.PointLight(0xFF4400, 20, 16);
      flash.position.copy(pos);
      _scene.add(flash);
      setTimeout(function () { _scene.remove(flash); flash.dispose ? flash.dispose() : null; }, 200);

      if (typeof CameraSystem !== 'undefined' && CameraSystem.shake) {
        CameraSystem.shake(0.8, 0.5);
      }

      // 12 debris chunks
      for (var di = 0; di < 12; di++) {
        var dbMesh = new THREE.Mesh(_geoDebris, _matDebris);
        dbMesh.position.copy(pos);
        _scene.add(dbMesh);
        var dbVel = new THREE.Vector3(
          (Math.random() - 0.5) * 12,
          Math.random() * 8 + 2,
          (Math.random() - 0.5) * 12
        );
        _particles.push({ mesh: dbMesh, vel: dbVel, life: 0.8, maxLife: 0.8, type: 'debris' });
      }

      // Smoke cloud
      var smokeMesh = new THREE.Mesh(_geoSmoke, _matSmoke.clone());
      smokeMesh.position.copy(pos);
      smokeMesh.position.y += 1;
      _scene.add(smokeMesh);
      _particles.push({ mesh: smokeMesh, vel: new THREE.Vector3(0, 0.5, 0), life: 2.0, maxLife: 2.0, type: 'smoke' });
    }

    // Apply damage to player through wave-event bridge
    var playerPos = null;
    try {
      if (typeof GameManager !== 'undefined' && GameManager.getPlayer) {
        var pl = GameManager.getPlayer();
        if (pl && pl.position) playerPos = pl.position;
      }
    } catch (e2) {}

    if (playerPos && window._takeDamageFromWaveEvent) {
      var px = playerPos.x - pos.x;
      var py = playerPos.y - pos.y;
      var pz = playerPos.z - pos.z;
      var dist = Math.sqrt(px * px + py * py + pz * pz);

      for (var ti = 0; ti < tiers.length; ti++) {
        var dmg    = tiers[ti][0];
        var radius = tiers[ti][1];
        if (dist <= radius) {
          // Linear falloff within tier
          var falloff = Math.max(0, 1 - dist / radius);
          window._takeDamageFromWaveEvent(Math.round(dmg * falloff));
          break;
        }
      }
    }

    // Loud explosion audio
    try {
      if (window.AudioSystem && window.AudioSystem.playExplosion) {
        window.AudioSystem.playExplosion();
      }
    } catch (e3) {}
  }

  // ── Create / remove HP bar ────────────────────────────────────────────────

  function _updateHpBar(bomber) {
    // Minimal float label — reuse same approach as enemies.js (canvas texture plane)
    if (!bomber._hpBarMesh) {
      var canvas  = document.createElement('canvas');
      canvas.width = 64; canvas.height = 8;
      var tex = new THREE.CanvasTexture(canvas);
      var mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthTest: false });
      var mesh = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.12), mat);
      mesh.position.y = 1.4;
      bomber.mesh.add(mesh);
      bomber._hpBarMesh   = mesh;
      bomber._hpBarCanvas = canvas;
      bomber._hpBarTex    = tex;
    }
    var ctx2  = bomber._hpBarCanvas.getContext('2d');
    var frac  = Math.max(0, bomber.hp / HP);
    ctx2.clearRect(0, 0, 64, 8);
    ctx2.fillStyle = '#000';
    ctx2.fillRect(0, 0, 64, 8);
    ctx2.fillStyle = frac > 0.5 ? '#22ff22' : frac > 0.25 ? '#ffaa00' : '#ff2222';
    ctx2.fillRect(1, 1, Math.round(frac * 62), 6);
    bomber._hpBarTex.needsUpdate = true;
  }

  // ── Per-bomber update (FSM) ───────────────────────────────────────────────

  function _updateBomber(bomber, playerPos, delta) {
    if (bomber.state === STATE_DEAD) return;

    var pos  = bomber.mesh.position;
    var dx   = playerPos.x - pos.x;
    var dz   = playerPos.z - pos.z;
    var dist = Math.sqrt(dx * dx + dz * dz);

    bomber._distToPlayer = dist;

    // ── Emergency fall detonate ────────────────────────────────────────────
    if (pos.y < FALL_THRESHOLD && bomber.state !== STATE_DETONATE && bomber.state !== STATE_DEAD) {
      bomber.state = STATE_DETONATE;
      _triggerDetonate(bomber, EXPL_TIERS_DEATH);
      return;
    }

    // ── FSM transitions ───────────────────────────────────────────────────
    if (bomber.state === STATE_IDLE) {
      if (dist <= DETECT_RANGE) {
        bomber.state = STATE_SPRINT;
      } else {
        _wander(bomber, delta);
      }
    }

    if (bomber.state === STATE_SPRINT) {
      _playBeep(bomber);
      _facePlayer(bomber, dx, dz);
      _moveToward(bomber, dx, dz, dist, SPRINT_SPEED, delta);

      if (dist <= PRIME_RANGE) {
        bomber.state = STATE_PRIMED;
        bomber._primeTimer = 1.0; // 1s countdown
        _setPrimed(bomber);
      } else if (dist <= DETONATE_RANGE) {
        // reached player — detonate immediately
        bomber.state = STATE_DETONATE;
        _triggerDetonate(bomber, EXPL_TIERS);
        return;
      }
    }

    if (bomber.state === STATE_PRIMED) {
      _playBeep(bomber);
      bomber._primeTimer -= delta;

      // Arms fully raised animation
      _animPrimed(bomber, bomber._primeTimer);

      if (dist <= DETONATE_RANGE || bomber._primeTimer <= 0) {
        bomber.state = STATE_DETONATE;
        _triggerDetonate(bomber, EXPL_TIERS);
        return;
      }
    }

    // HUD warning when in range
    _checkWarning(dist);

    // Billboard HP bar toward camera
    if (bomber._hpBarMesh) {
      var cam = null;
      try {
        if (typeof GameManager !== 'undefined' && GameManager.getCamera) {
          cam = GameManager.getCamera();
        }
      } catch (e4) {}
      if (cam) bomber._hpBarMesh.lookAt(cam.position);
    }
  }

  function _wander(bomber, delta) {
    if (!bomber._wanderTimer || bomber._wanderTimer <= 0) {
      bomber._wanderDir = new THREE.Vector3(
        (Math.random() - 0.5) * 2, 0, (Math.random() - 0.5) * 2
      ).normalize();
      bomber._wanderTimer = 1.5 + Math.random() * 2;
    }
    bomber._wanderTimer -= delta;
    var d = bomber._wanderDir;
    bomber.mesh.position.x += d.x * WANDER_SPEED * delta;
    bomber.mesh.position.z += d.z * WANDER_SPEED * delta;
    bomber.mesh.rotation.y = Math.atan2(d.x, d.z);
  }

  function _facePlayer(bomber, dx, dz) {
    bomber.mesh.rotation.y = Math.atan2(dx, dz);
  }

  function _moveToward(bomber, dx, dz, dist, speed, delta) {
    if (dist < 0.1) return;
    var nx = dx / dist;
    var nz = dz / dist;
    bomber.mesh.position.x += nx * speed * delta;
    bomber.mesh.position.z += nz * speed * delta;
    // Bob up/down slightly while running
    bomber.mesh.position.y += Math.sin(performance.now() / 120) * delta * 0.6;
  }

  function _setPrimed(bomber) {
    // Intensify glow
    if (bomber.mesh._glow) {
      bomber.mesh._glow.intensity = 2.0;
      bomber.mesh._glow.distance  = 6;
    }
  }

  function _animPrimed(bomber, timerLeft) {
    // Arms raised higher over countdown
    var t = 1 - Math.max(0, timerLeft);
    // Pulse glow rapidly
    if (bomber.mesh._glow) {
      bomber.mesh._glow.intensity = 2.0 + Math.sin(performance.now() / 60) * 1.5;
    }
  }

  function _checkWarning(nearestDist) {
    // Show warning if any bomber is within WARN_RANGE
    _showWarning(nearestDist <= WARN_RANGE);
  }

  function _triggerDetonate(bomber, tiers) {
    bomber.state = STATE_DEAD;
    _doExplosion(bomber, tiers);
    _removeBomber(bomber);

    // Scoring
    if (window.Economy && window.Economy.addScore) {
      var score = (tiers === EXPL_TIERS_DEATH) ? SCORE_KILL_BEFORE : SCORE_KILL_DURING;
      try { window.Economy.addScore(score); } catch (e5) {}
    }
    if (typeof HUD !== 'undefined' && HUD.addKill) {
      HUD.addKill('C4 VEST', 'SUICIDE BOMBER', false);
    }
  }

  function _removeBomber(bomber) {
    if (bomber._removed) return;
    bomber._removed = true;
    if (_scene && bomber.mesh) {
      _scene.remove(bomber.mesh);
      _disposeMesh(bomber.mesh);
    }
    // Remove from global list
    var idx = window._suicideBombers.indexOf(bomber);
    if (idx !== -1) window._suicideBombers.splice(idx, 1);
  }

  function _disposeMesh(obj) {
    if (!obj) return;
    if (obj.children && obj.children.length) {
      var children = obj.children.slice();
      for (var ci = 0; ci < children.length; ci++) {
        _disposeMesh(children[ci]);
      }
    }
    if (obj.geometry) obj.geometry.dispose();
    if (obj.material) {
      if (obj.material.map) obj.material.map.dispose();
      obj.material.dispose();
    }
  }

  // ── Particle update (debris + smoke fallback VFX) ─────────────────────────

  function _updateParticles(delta) {
    for (var pi = _particles.length - 1; pi >= 0; pi--) {
      var p = _particles[pi];
      p.life -= delta;
      if (p.life <= 0) {
        if (_scene) _scene.remove(p.mesh);
        _disposeMesh(p.mesh);
        _particles.splice(pi, 1);
        continue;
      }
      var t2 = p.life / p.maxLife;
      p.mesh.position.x += p.vel.x * delta;
      p.mesh.position.y += p.vel.y * delta;
      p.mesh.position.z += p.vel.z * delta;
      if (p.type === 'debris') {
        p.vel.y -= 9.8 * delta;
        p.mesh.material.opacity = t2;
      } else if (p.type === 'smoke') {
        var s2 = 1 + (1 - t2) * 1.5;
        p.mesh.scale.setScalar(s2);
        p.mesh.material.opacity = t2 * 0.5;
      }
    }
  }

  // ── Public API ─────────────────────────────────────────────────────────────

  function init(scene) {
    _scene   = scene;
    _inited  = true;
    _createWarningEl();
    window._suicideBombers = window._suicideBombers || [];
  }

  /**
   * update(delta, playerPos)
   * Called each frame (e.g. from game-manager's render loop or
   * alongside Enemies.update).
   */
  function update(delta, playerPos) {
    if (!_inited || !_scene || !playerPos) return;

    _updateParticles(delta);

    var anyNear = false;
    var bombers = window._suicideBombers;
    for (var bi = bombers.length - 1; bi >= 0; bi--) {
      var bomber = bombers[bi];
      if (!bomber || bomber.state === STATE_DEAD || bomber._removed) {
        bombers.splice(bi, 1);
        continue;
      }
      _updateBomber(bomber, playerPos, delta);
      if (bomber._distToPlayer <= WARN_RANGE) anyNear = true;
    }
    // If no bombers in warning range, hide warning
    if (!anyNear) _showWarning(false);
  }

  /**
   * spawn(options)
   * options: { x, y, z }  – world position to spawn at
   * Returns the bomber object.
   */
  function spawn(options) {
    if (!_inited || !_scene) {
      console.warn('[EnemySuicideBomber] spawn() called before init()');
      return null;
    }
    options = options || {};

    var mesh = _buildMesh();
    mesh.position.set(
      options.x || 0,
      options.y != null ? options.y : 0,
      options.z || 0
    );
    // Resolve terrain height if VoxelWorld is available
    if (typeof window.VoxelWorld !== 'undefined' && window.VoxelWorld.getTerrainHeight) {
      try {
        var th = window.VoxelWorld.getTerrainHeight(mesh.position.x, mesh.position.z);
        if (typeof th === 'number' && isFinite(th)) {
          mesh.position.y = th;
        }
      } catch (et) {}
    }

    _scene.add(mesh);

    var bomber = {
      mesh:          mesh,
      hp:            HP,
      state:         STATE_IDLE,
      _distToPlayer: 999,
      _nextBeep:     0,
      _primeTimer:   0,
      _wanderTimer:  0,
      _wanderDir:    new THREE.Vector3(1, 0, 0),
      _removed:      false,
      _hpBarMesh:    null,
      _hpBarCanvas:  null,
      _hpBarTex:     null
    };

    _updateHpBar(bomber);
    window._suicideBombers.push(bomber);
    return bomber;
  }

  /**
   * hit(bomber, damage)
   * Call this when a projectile hits a suicide bomber.
   * Returns true if the bomber died.
   */
  function hit(bomber, damage) {
    if (!bomber || bomber.state === STATE_DEAD || bomber._removed) return false;

    bomber.hp -= (damage || 0);
    _updateHpBar(bomber);

    if (bomber.hp <= 0) {
      bomber.state = STATE_DETONATE;
      _triggerDetonate(bomber, EXPL_TIERS_DEATH);
      // Give score for shooting it
      if (window.Economy && window.Economy.addScore) {
        try { window.Economy.addScore(SCORE_KILL_BEFORE); } catch (e6) {}
      }
      return true;
    }
    return false;
  }

  /**
   * spawnForWave(waveNumber, playerPos)
   * Spawns 1–2 bombers on wave 7+. Called from game-manager or wave system.
   */
  function spawnForWave(waveNumber, playerPos) {
    if (waveNumber < 7) return;
    if (!_inited || !_scene) return;

    var count = (Math.random() < 0.5) ? 1 : 2;
    var baseX  = (playerPos && playerPos.x) || 0;
    var baseZ  = (playerPos && playerPos.z) || 0;

    for (var si = 0; si < count; si++) {
      var angle  = Math.random() * Math.PI * 2;
      var radius = 25 + Math.random() * 10;
      spawn({
        x: baseX + Math.cos(angle) * radius,
        z: baseZ + Math.sin(angle) * radius
      });
    }
  }

  /**
   * reset()
   * Remove all active bombers and clear state. Call on game reset / stage change.
   */
  function reset() {
    var bombers = window._suicideBombers;
    for (var ri = bombers.length - 1; ri >= 0; ri--) {
      _removeBomber(bombers[ri]);
    }
    bombers.length = 0;
    _particles.length = 0;
    _warningShown = false;
    _showWarning(false);
  }

  // ── Public surface ─────────────────────────────────────────────────────────
  return {
    init:         init,
    update:       update,
    spawn:        spawn,
    spawnForWave: spawnForWave,
    hit:          hit,
    reset:        reset
  };

})();
