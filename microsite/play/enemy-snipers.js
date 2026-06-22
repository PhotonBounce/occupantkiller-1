/**
 * enemy-snipers.js — Enemy Sniper Nest System
 * Ukraine-conflict FPS (Three.js browser game)
 *
 * Spawns elevated sniper nests with ghillie-clad snipers, red laser dots,
 * bolt-action audio, long-range high-damage AI, and screen-edge dot warning.
 *
 * API:   window.EnemySnipers.init()
 *        window.EnemySnipers.spawnSniperNest(x, y, z)
 *        window.EnemySnipers.getActiveSnipers()
 *        window.EnemySnipers.update(dt, playerPos, camera)
 *        window.EnemySnipers.reset()
 *
 * Globals written: window._activeSniperCount
 *
 * Hooks: window._onEnemyDeathForBlood(sniper) called on sniper death.
 *
 * All var, IIFE pattern, no let/const.
 */
window.EnemySnipers = (function () {
  'use strict';

  // ── Constants ─────────────────────────────────────────────────────────
  var MAX_SNIPERS        = 3;
  var SNIPER_HP          = 80;
  var SNIPER_RANGE_MIN   = 30;
  var SNIPER_RANGE_MAX   = 60;
  var AIM_DURATION       = 2.5;    // seconds before shot
  var FIRE_COOLDOWN      = 3.0;    // seconds between shots
  var SNIPER_DAMAGE      = 75;
  var LASER_TOGGLE_RATE  = 0.3;    // seconds per on/off cycle
  var LASER_RANGE        = 55;     // length of laser beam mesh
  var SPREAD             = 0.002;  // near-zero bullet spread

  // Weapon drops on death
  var DEATH_DROPS = ['SR-25', 'AXMC'];

  // ── Module state ──────────────────────────────────────────────────────
  var _scene         = null;
  var _initialized   = false;
  var _snipers       = [];         // array of active sniper objects
  var _audioCtx      = null;

  // DOM element: screen-edge red dot + SNIPER! warning
  var _dotEl         = null;
  var _warningEl     = null;
  var _warningTimer  = 0;

  // ── Helpers ───────────────────────────────────────────────────────────

  function _rand(min, max) {
    return min + Math.random() * (max - min);
  }

  function _getScene() {
    return _scene || window._gameScene || null;
  }

  // ── Audio: bolt-action click + metal slide ────────────────────────────

  function _ensureAudio() {
    if (_audioCtx) return true;
    try {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return false;
      _audioCtx = new AC();
      return true;
    } catch (e) {
      return false;
    }
  }

  function _playBoltAction() {
    if (!_ensureAudio()) return;
    var t = _audioCtx.currentTime;

    // Sharp transient click (noise burst)
    var bufSize = _audioCtx.sampleRate * 0.04;
    var buf = _audioCtx.createBuffer(1, bufSize, _audioCtx.sampleRate);
    var data = buf.getChannelData(0);
    for (var i = 0; i < bufSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufSize, 4);
    }
    var clickSrc = _audioCtx.createBufferSource();
    clickSrc.buffer = buf;
    var clickFilter = _audioCtx.createBiquadFilter();
    clickFilter.type = 'highpass';
    clickFilter.frequency.value = 1800;
    var clickGain = _audioCtx.createGain();
    clickGain.gain.setValueAtTime(0.6, t);
    clickGain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
    clickSrc.connect(clickFilter);
    clickFilter.connect(clickGain);
    clickGain.connect(_audioCtx.destination);
    clickSrc.start(t);

    // Metal slide: descending tone
    var slideOsc = _audioCtx.createOscillator();
    slideOsc.type = 'sawtooth';
    slideOsc.frequency.setValueAtTime(320, t + 0.04);
    slideOsc.frequency.exponentialRampToValueAtTime(80, t + 0.22);
    var slideGain = _audioCtx.createGain();
    slideGain.gain.setValueAtTime(0.0, t + 0.04);
    slideGain.gain.linearRampToValueAtTime(0.25, t + 0.06);
    slideGain.gain.exponentialRampToValueAtTime(0.001, t + 0.24);
    var slideFilter = _audioCtx.createBiquadFilter();
    slideFilter.type = 'bandpass';
    slideFilter.frequency.value = 200;
    slideFilter.Q.value = 2;
    slideOsc.connect(slideFilter);
    slideFilter.connect(slideGain);
    slideGain.connect(_audioCtx.destination);
    slideOsc.start(t + 0.04);
    slideOsc.stop(t + 0.25);
  }

  // ── DOM: screen-edge dot and SNIPER! warning ─────────────────────────

  function _ensureDOM() {
    if (!_dotEl) {
      _dotEl = document.createElement('div');
      _dotEl.id = 'sniper-screen-dot';
      _dotEl.style.cssText =
        'position:fixed;width:12px;height:12px;border-radius:50%;' +
        'background:rgba(255,0,0,0.9);box-shadow:0 0 8px 3px rgba(255,0,0,0.7);' +
        'pointer-events:none;z-index:8500;display:none;transform:translate(-50%,-50%);' +
        'border:1px solid #ff6666;';
      document.body.appendChild(_dotEl);
    }
    if (!_warningEl) {
      _warningEl = document.createElement('div');
      _warningEl.id = 'sniper-warning';
      _warningEl.style.cssText =
        'position:fixed;top:18%;left:50%;transform:translateX(-50%);' +
        'color:#ff2222;font-family:monospace;font-size:22px;font-weight:bold;' +
        'letter-spacing:4px;text-shadow:0 0 12px #ff0000;pointer-events:none;' +
        'z-index:8600;display:none;text-align:center;';
      _warningEl.textContent = '⚠ SNIPER!';
      document.body.appendChild(_warningEl);
    }
  }

  function _showSniperWarning(screenX, screenY) {
    _ensureDOM();
    var W = window.innerWidth  || 800;
    var H = window.innerHeight || 600;
    var margin = 24;
    var ex = Math.max(margin, Math.min(W - margin, screenX));
    var ey = Math.max(margin, Math.min(H - margin, screenY));
    _dotEl.style.left = ex + 'px';
    _dotEl.style.top  = ey + 'px';
    _dotEl.style.display = 'block';
    _warningEl.style.display = 'block';
    _warningTimer = 1.5;
  }

  function _hideSniperHUD() {
    if (_dotEl)     _dotEl.style.display    = 'none';
    if (_warningEl) _warningEl.style.display = 'none';
  }

  // ── Three.js mesh builders ────────────────────────────────────────────

  function _buildSandbags(scene, baseX, baseY, baseZ) {
    var mat = new THREE.MeshLambertMaterial({ color: 0x8B7355 }); // sandy tan
    var group = new THREE.Group();
    // Three stacked sandbag rows
    var positions = [
      { x: 0,    y: 0.15, z:  0.6  },
      { x: 0.5,  y: 0.15, z:  0.6  },
      { x: -0.5, y: 0.15, z:  0.6  },
      { x: 0,    y: 0.42, z:  0.6  },
      { x: 0.5,  y: 0.42, z:  0.6  },
      { x: -0.5, y: 0.42, z:  0.6  },
      { x: 0,    y: 0.15, z: -0.6  },
      { x: 0.5,  y: 0.15, z: -0.6  },
      { x: -0.5, y: 0.15, z: -0.6  }
    ];
    var bagGeo = new THREE.BoxGeometry(0.55, 0.28, 0.28);
    for (var i = 0; i < positions.length; i++) {
      var bag = new THREE.Mesh(bagGeo, mat);
      bag.position.set(positions[i].x, positions[i].y, positions[i].z);
      group.add(bag);
    }
    group.position.set(baseX, baseY, baseZ);
    scene.add(group);
    return group;
  }

  function _buildPlatform(scene, baseX, baseY, baseZ) {
    var woodMat = new THREE.MeshLambertMaterial({ color: 0x5C3D1E }); // dark wood
    var platGeo = new THREE.BoxGeometry(2.5, 0.15, 2.5);
    var platform = new THREE.Mesh(platGeo, woodMat);
    platform.position.set(baseX, baseY + 0.075, baseZ);
    scene.add(platform);

    // Support legs
    var legGeo = new THREE.BoxGeometry(0.12, 0.8, 0.12);
    var offsets = [
      { x:  1.1, z:  1.1 },
      { x: -1.1, z:  1.1 },
      { x:  1.1, z: -1.1 },
      { x: -1.1, z: -1.1 }
    ];
    for (var i = 0; i < offsets.length; i++) {
      var leg = new THREE.Mesh(legGeo, woodMat);
      leg.position.set(baseX + offsets[i].x, baseY - 0.32, baseZ + offsets[i].z);
      scene.add(leg);
    }
    return platform;
  }

  function _buildSniperMesh(scene, baseX, baseY, baseZ) {
    // Ghillie-style dark brown body — prone (box 0.4 × 1.6 × 0.4)
    var mat = new THREE.MeshLambertMaterial({ color: 0x3B2507 }); // dark ghillie brown
    var geo = new THREE.BoxGeometry(0.4, 1.6, 0.4);
    var mesh = new THREE.Mesh(geo, mat);
    // Prone: rotate around X so the long axis lies along Z
    mesh.rotation.x = -0.3;  // slight forward tilt, prone stance
    // Position body at platform level, body centered
    mesh.position.set(baseX, baseY + 0.3, baseZ);
    scene.add(mesh);
    return mesh;
  }

  function _buildLaserMesh(scene, baseX, baseY, baseZ) {
    var laserGeo = new THREE.CylinderGeometry(0.005, 0.005, LASER_RANGE, 4);
    var laserMat = new THREE.MeshBasicMaterial({
      color: 0xFF0000,
      transparent: true,
      opacity: 0.85
    });
    var laserMesh = new THREE.Mesh(laserGeo, laserMat);
    // Start hidden; we'll position each frame
    laserMesh.visible = false;
    // Cylinder default is vertical; we rotate to point along Z
    laserMesh.rotation.x = Math.PI / 2;
    laserMesh.position.set(baseX, baseY + 0.35, baseZ);
    scene.add(laserMesh);
    return laserMesh;
  }

  // ── Weapon drop on death ──────────────────────────────────────────────

  function _dropWeapon(sniper) {
    var drop = DEATH_DROPS[Math.floor(Math.random() * DEATH_DROPS.length)];
    try {
      if (typeof window._onEnemyDeathForBlood === 'function') {
        // Pass sniper object so blood-trail hook can fire
        window._onEnemyDeathForBlood(sniper);
      }
    } catch (e) {}
    // Attempt to spawn pickup via Pickups module if available
    try {
      if (typeof window.Pickups !== 'undefined' && window.Pickups.spawnWeapon) {
        var pos = sniper.mesh ? sniper.mesh.position : { x: 0, y: 0, z: 0 };
        window.Pickups.spawnWeapon(drop, pos.x, pos.y, pos.z);
      }
    } catch (e) {}
    // Also attempt loot-drops
    try {
      if (typeof window.LootDrops !== 'undefined' && window.LootDrops.drop) {
        var pos2 = sniper.mesh ? sniper.mesh.position : { x: 0, y: 0, z: 0 };
        window.LootDrops.drop(drop, pos2.x, pos2.y, pos2.z);
      }
    } catch (e) {}
  }

  // ── Damage player ─────────────────────────────────────────────────────

  function _damagePlayer() {
    try {
      if (typeof window.GameManager !== 'undefined' && window.GameManager.damagePlayer) {
        window.GameManager.damagePlayer(SNIPER_DAMAGE, 'sniper');
        return;
      }
      if (typeof window._playerHealth !== 'undefined') {
        window._playerHealth = Math.max(0, (window._playerHealth || 100) - SNIPER_DAMAGE);
      }
    } catch (e) {}
  }

  // ── Remove one sniper from the scene ─────────────────────────────────

  function _removeSniper(sniper) {
    var scene = _getScene();
    if (!scene) return;
    try { if (sniper.mesh)      { scene.remove(sniper.mesh);      } } catch (e) {}
    try { if (sniper.laser)     { scene.remove(sniper.laser);     } } catch (e) {}
    try { if (sniper.sandbags)  { scene.remove(sniper.sandbags);  } } catch (e) {}
    try { if (sniper.platform)  { scene.remove(sniper.platform);  } } catch (e) {}
    sniper.active = false;
    sniper.dead   = true;
  }

  // ── Project 3-D point to screen coords ───────────────────────────────

  function _toScreen(worldPos, camera) {
    if (!camera) return null;
    var vec = worldPos.clone();
    vec.project(camera);
    if (vec.z > 1) return null; // behind camera
    var W = window.innerWidth  || 800;
    var H = window.innerHeight || 600;
    return {
      x: (vec.x  * 0.5 + 0.5) * W,
      y: (-vec.y * 0.5 + 0.5) * H,
      inView: (vec.x >= -1 && vec.x <= 1 && vec.y >= -1 && vec.y <= 1 && vec.z <= 1)
    };
  }

  // ── spawnSniperNest ───────────────────────────────────────────────────

  function spawnSniperNest(x, y, z) {
    if (_snipers.filter(function (s) { return s.active; }).length >= MAX_SNIPERS) {
      return null;
    }

    var scene = _getScene();
    if (!scene) {
      console.warn('[EnemySnipers] No scene available — call init() first or set window._gameScene');
      return null;
    }

    var platformY = y || 0;

    var sandbags = _buildSandbags(scene, x, platformY, z);
    var platform = _buildPlatform(scene, x, platformY, z);
    var mesh     = _buildSniperMesh(scene, x, platformY + 0.15, z);
    var laser    = _buildLaserMesh(scene, x, platformY + 0.35, z - 0.2);

    var sniper = {
      active:       true,
      dead:         false,
      hp:           SNIPER_HP,
      maxHp:        SNIPER_HP,

      mesh:         mesh,
      laser:        laser,
      sandbags:     sandbags,
      platform:     platform,

      // Aiming state
      aimTimer:     0,          // counts up toward AIM_DURATION
      isAiming:     false,
      fireTimer:    0,          // cooldown after a shot

      // Laser blink state
      laserTimer:   0,
      laserOn:      false,

      // Range randomised per sniper
      range:        _rand(SNIPER_RANGE_MIN, SNIPER_RANGE_MAX),

      // Base position (for laser pivot)
      basePos: new THREE.Vector3(x, platformY + 0.35, z - 0.2)
    };

    _snipers.push(sniper);
    window._activeSniperCount = _snipers.filter(function (s) { return s.active; }).length;
    return sniper;
  }

  // ── getActiveSnipers ─────────────────────────────────────────────────

  function getActiveSnipers() {
    return _snipers.filter(function (s) { return s.active; });
  }

  // ── update ────────────────────────────────────────────────────────────

  function update(dt, playerPos, camera) {
    if (!_initialized) return;

    var pPos = playerPos ||
               window._playerPos ||
               (typeof THREE !== 'undefined' ? new THREE.Vector3(0, 0, 0) : { x: 0, y: 0, z: 0 });

    var anySniperAiming = false;
    var closestScreenPos = null;

    for (var i = 0; i < _snipers.length; i++) {
      var s = _snipers[i];
      if (!s.active || s.dead) continue;

      var mesh = s.mesh;
      if (!mesh) continue;

      // Distance to player
      var dx = pPos.x - mesh.position.x;
      var dy = (pPos.y !== undefined ? pPos.y : 0) - mesh.position.y;
      var dz = pPos.z - mesh.position.z;
      var dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
      var inRange = dist <= s.range;

      // Fire cooldown ticks down always
      if (s.fireTimer > 0) {
        s.fireTimer -= dt;
        if (s.fireTimer < 0) s.fireTimer = 0;
      }

      // ── Aiming logic ─────────────────────────────────────────────────
      if (inRange && s.fireTimer <= 0) {
        if (!s.isAiming) {
          s.isAiming  = true;
          s.aimTimer  = 0;
        }
        s.aimTimer += dt;

        // Turn sniper mesh to face player
        var angle = Math.atan2(dx, dz);
        mesh.rotation.y = angle;

        // Laser blink
        s.laserTimer += dt;
        if (s.laserTimer >= LASER_TOGGLE_RATE) {
          s.laserTimer = 0;
          s.laserOn = !s.laserOn;
        }

        if (s.laserOn) {
          // Point laser from barrel toward player
          var laserHalfLen = LASER_RANGE * 0.5;
          var dirX = dx / dist;
          var dirY = dy / dist;
          var dirZ = dz / dist;

          s.laser.position.set(
            mesh.position.x + dirX * laserHalfLen,
            mesh.position.y + 0.1 + dirY * laserHalfLen,
            mesh.position.z + dirZ * laserHalfLen
          );
          s.laser.lookAt(
            pPos.x !== undefined ? pPos.x : 0,
            pPos.y !== undefined ? pPos.y : 1.7,
            pPos.z !== undefined ? pPos.z : 0
          );
          // lookAt makes the +Z axis point toward target; cylinder is along Y,
          // so we apply a 90-degree X rotation on top of lookAt.
          s.laser.rotateX(Math.PI / 2);
          s.laser.visible = true;
          anySniperAiming = true;

          // Screen-edge dot calculation
          if (camera) {
            var laserWorldPos = s.laser.position;
            var sc = _toScreen(laserWorldPos, camera);
            if (sc) {
              if (!sc.inView) {
                // Laser tip off-screen — show edge dot
                if (!closestScreenPos) closestScreenPos = sc;
              }
            }
          }
        } else {
          s.laser.visible = false;
        }

        // ── Fire when aim timer expires ───────────────────────────────
        if (s.aimTimer >= AIM_DURATION) {
          s.isAiming  = false;
          s.aimTimer  = 0;
          s.fireTimer = FIRE_COOLDOWN;
          s.laser.visible = false;
          s.laserOn = false;

          // Accuracy spread (near-zero)
          var spreadX = (Math.random() - 0.5) * SPREAD;
          var spreadY = (Math.random() - 0.5) * SPREAD;
          var hitChance = 1 - spreadX - spreadY; // effectively always hits

          if (hitChance > 0.5) {
            _damagePlayer();
          }

          _playBoltAction();

          // Muzzle flash: briefly make mesh lighter
          try {
            var origColor = mesh.material.color.getHex();
            mesh.material.color.setHex(0xBB8855);
            var meshRef = mesh;
            setTimeout(function () {
              try { meshRef.material.color.setHex(origColor); } catch (e2) {}
            }, 80);
          } catch (e) {}
        }

      } else {
        // Not in range or on cooldown
        s.isAiming  = false;
        s.aimTimer  = 0;
        s.laser.visible = false;
        s.laserOn  = false;
        s.laserTimer = 0;
      }
    }

    // ── Screen-edge sniper dot HUD ────────────────────────────────────
    if (anySniperAiming && closestScreenPos) {
      _showSniperWarning(closestScreenPos.x, closestScreenPos.y);
    } else if (_warningTimer > 0) {
      _warningTimer -= dt;
      if (_warningTimer <= 0) {
        _hideSniperHUD();
        _warningTimer = 0;
      }
    }

    // Update global counter
    window._activeSniperCount = _snipers.filter(function (s) { return s.active; }).length;
  }

  // ── hit / damage API (called externally when sniper is shot) ─────────

  function hitSniper(sniper, damage) {
    if (!sniper || sniper.dead) return;
    sniper.hp -= (damage || 0);
    if (sniper.hp <= 0) {
      sniper.hp = 0;
      _dropWeapon(sniper);
      _removeSniper(sniper);
      window._activeSniperCount = _snipers.filter(function (s) { return s.active; }).length;
    }
  }

  // ── init ──────────────────────────────────────────────────────────────

  function init() {
    _scene = window._gameScene || null;
    _snipers = [];
    window._activeSniperCount = 0;
    _warningTimer = 0;
    _ensureDOM();
    _initialized = true;
    console.log('[EnemySnipers] initialized — max ' + MAX_SNIPERS + ' concurrent snipers');
  }

  // ── reset ─────────────────────────────────────────────────────────────

  function reset() {
    var scene = _getScene();
    for (var i = 0; i < _snipers.length; i++) {
      _removeSniper(_snipers[i]);
    }
    _snipers = [];
    window._activeSniperCount = 0;
    _warningTimer = 0;
    _hideSniperHUD();
    console.log('[EnemySnipers] reset');
  }

  // ── Public API ────────────────────────────────────────────────────────

  return {
    init:              init,
    spawnSniperNest:   spawnSniperNest,
    getActiveSnipers:  getActiveSnipers,
    update:            update,
    hitSniper:         hitSniper,
    reset:             reset
  };

})();
