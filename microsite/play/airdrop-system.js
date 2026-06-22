// airdrop-system.js — Supply crate airdrop system with plane, parachute, smoke and enemy attraction
// All var — no let/const. IIFE pattern.

window.AirdropSystem = (function () {
  'use strict';

  // ── Constants ─────────────────────────────────────────────────────────
  var MAX_DROPS = 2;
  var PLANE_Y = 25;
  var DROP_TIME = 6;        // seconds before crate releases
  var TOTAL_DROP_SEQ = 10;  // total seconds for full drop sequence
  var FALL_SPEED = 6;       // units/sec for crate descent
  var COLLECT_DIST = 1.5;
  var ENEMY_ATTRACT_DIST = 20;
  var SMOKE_RATE = 5;       // particles per second
  var AUTO_WAVE_INTERVAL = 3; // trigger every 3 waves on wave 5+
  var MIN_WAVE = 5;

  // Crate types
  var CRATE_TYPES = [
    {
      id: 'AMMO_CRATE',
      label: 'AMMO CRATE',
      apply: function (player) {
        // Refill all weapon ammo to 75%
        if (player && typeof player.ammo !== 'undefined') {
          var maxAmmo = player.maxAmmo || 250;
          player.ammo = Math.round(maxAmmo * 0.75);
        }
        if (typeof Weapons !== 'undefined' && Weapons.refillAmmo) {
          Weapons.refillAmmo(0.75);
        }
        return 'AMMO REFILLED TO 75%';
      }
    },
    {
      id: 'ARMOR_CRATE',
      label: 'ARMOR CRATE',
      apply: function (player) {
        if (player) {
          player.armor = Math.round(Math.max(player.armor || 0, 80));
        }
        return 'ARMOR RESTORED TO 80%';
      }
    },
    {
      id: 'MEDIC_CRATE',
      label: 'MEDIC CRATE',
      apply: function (player) {
        if (player) {
          var maxHp = player.maxHp || 100;
          player.hp = Math.min(maxHp, (player.hp || 0) + 50);
        }
        return '+50 HP RESTORED';
      }
    },
    {
      id: 'FULL_KIT',
      label: 'FULL KIT',
      apply: function (player) {
        if (player) {
          var maxAmmo = player.maxAmmo || 250;
          player.ammo = Math.round(maxAmmo * 0.75);
          player.armor = Math.round(Math.max(player.armor || 0, 80));
          var maxHp = player.maxHp || 100;
          player.hp = Math.min(maxHp, (player.hp || 0) + 25);
        }
        if (typeof Weapons !== 'undefined' && Weapons.refillAmmo) {
          Weapons.refillAmmo(0.75);
        }
        return 'FULL KIT: AMMO + ARMOR + 25 HP';
      }
    }
  ];

  // ── State ─────────────────────────────────────────────────────────────
  var _scene = null;
  var _camera = null;
  var _drops = [];       // active drop objects
  var _planes = [];      // active plane meshes
  var _smokeParticles = []; // global smoke particle list
  var _mapMarkers = [];  // DOM elements for map markers
  var _lastWaveChecked = 0;
  var _globalTime = 0;

  // ── Audio helpers ──────────────────────────────────────────────────────
  function _playEngineRoar(duration) {
    try {
      var ctx = window._audioCtx;
      if (!ctx) return;
      var t = ctx.currentTime;

      // Low oscillator 80Hz
      var osc1 = ctx.createOscillator();
      var gain1 = ctx.createGain();
      osc1.type = 'sawtooth';
      osc1.frequency.setValueAtTime(80, t);
      gain1.gain.setValueAtTime(0, t);
      gain1.gain.linearRampToValueAtTime(0.25, t + 0.5);
      gain1.gain.linearRampToValueAtTime(0.2, t + duration - 0.5);
      gain1.gain.linearRampToValueAtTime(0, t + duration);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(t);
      osc1.stop(t + duration);

      // Harmonic 160Hz
      var osc2 = ctx.createOscillator();
      var gain2 = ctx.createGain();
      osc2.type = 'sawtooth';
      osc2.frequency.setValueAtTime(160, t);
      gain2.gain.setValueAtTime(0, t);
      gain2.gain.linearRampToValueAtTime(0.12, t + 0.5);
      gain2.gain.linearRampToValueAtTime(0.1, t + duration - 0.5);
      gain2.gain.linearRampToValueAtTime(0, t + duration);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(t);
      osc2.stop(t + duration);
    } catch (e) { /* no audio ctx */ }
  }

  function _playThud() {
    try {
      var ctx = window._audioCtx;
      if (!ctx) return;
      var t = ctx.currentTime;
      var osc = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(60, t);
      osc.frequency.linearRampToValueAtTime(20, t + 0.3);
      gain.gain.setValueAtTime(0.6, t);
      gain.gain.linearRampToValueAtTime(0, t + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.3);
    } catch (e) { /* no audio ctx */ }
  }

  // ── HUD notification ─────────────────────────────────────────────────
  function _notify(text, color) {
    if (typeof HUD !== 'undefined' && HUD.notifyPickup) {
      HUD.notifyPickup(text, color || '#44ff88');
      return;
    }
    var el = document.getElementById('pickup-notif');
    if (el) {
      el.textContent = text;
      el.style.color = color || '#44ff88';
      el.style.display = 'block';
      setTimeout(function () { el.style.display = 'none'; }, 3000);
    }
  }

  // ── Build plane mesh ──────────────────────────────────────────────────
  function _buildPlaneMesh(x, z) {
    if (!_scene) return null;

    var group = new THREE.Group();

    // Fuselage
    var bodyGeo = new THREE.BoxGeometry(2, 0.4, 0.8);
    var bodyMat = new THREE.MeshLambertMaterial({ color: 0x888888 });
    var body = new THREE.Mesh(bodyGeo, bodyMat);
    group.add(body);

    // Left wing
    var wingGeo = new THREE.BoxGeometry(0.3, 0.05, 1.2);
    var wingMat = new THREE.MeshLambertMaterial({ color: 0x777777 });
    var wingL = new THREE.Mesh(wingGeo, wingMat);
    wingL.position.set(0, -0.1, -0.9);
    group.add(wingL);

    // Right wing
    var wingR = new THREE.Mesh(
      new THREE.BoxGeometry(0.3, 0.05, 1.2),
      new THREE.MeshLambertMaterial({ color: 0x777777 })
    );
    wingR.position.set(0, -0.1, 0.9);
    group.add(wingR);

    group.position.set(x, PLANE_Y, z);
    _scene.add(group);
    return group;
  }

  // ── Build crate mesh ──────────────────────────────────────────────────
  function _buildCrateMesh(x, y, z) {
    if (!_scene) return null;
    var geo = new THREE.BoxGeometry(0.8, 0.8, 0.8);
    var mat = new THREE.MeshLambertMaterial({ color: 0x6B7C4F }); // olive drab
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, z);
    _scene.add(mesh);
    return mesh;
  }

  // ── Build parachute mesh ──────────────────────────────────────────────
  function _buildParachuteMesh(x, y, z) {
    if (!_scene) return null;
    var geo = new THREE.TorusGeometry(0.6, 0.05, 6, 10, Math.PI);
    var mat = new THREE.MeshLambertMaterial({ color: 0xffffff, side: THREE.DoubleSide });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.rotation.x = Math.PI / 2; // open upward
    mesh.position.set(x, y, z);
    _scene.add(mesh);
    return mesh;
  }

  // ── Build beacon light ────────────────────────────────────────────────
  function _buildBeaconLight(x, y, z) {
    if (!_scene) return null;
    var light = new THREE.PointLight(0x00FF00, 2, 4);
    light.position.set(x, y + 1.5, z);
    _scene.add(light);
    return light;
  }

  // ── Smoke particle ────────────────────────────────────────────────────
  function _spawnSmokeParticle(x, z, groundY) {
    if (!_scene) return null;
    var geo = new THREE.SphereGeometry(0.12, 4, 4);
    var mat = new THREE.MeshBasicMaterial({
      color: 0x00FF55,
      transparent: true,
      opacity: 0.75,
      depthWrite: false
    });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(
      x + (Math.random() - 0.5) * 0.3,
      groundY + 0.2,
      z + (Math.random() - 0.5) * 0.3
    );
    _scene.add(mesh);
    return { mesh: mesh, mat: mat, geo: geo, life: 0, maxLife: 2.0 + Math.random() * 1.0 };
  }

  // ── Map marker DOM element ────────────────────────────────────────────
  function _createMapMarker(dropId) {
    var el = document.createElement('div');
    el.id = 'airdrop-marker-' + dropId;
    el.style.cssText = [
      'position:fixed',
      'bottom:200px',
      'left:12px',
      'color:#00FF88',
      'font-family:monospace',
      'font-size:11px',
      'font-weight:bold',
      'pointer-events:none',
      'z-index:205',
      'background:rgba(0,0,0,0.5)',
      'border:1px solid #00FF88',
      'padding:2px 8px',
      'border-radius:4px',
      'text-shadow:0 0 6px #00FF88',
      'display:none'
    ].join(';');
    document.body.appendChild(el);
    return el;
  }

  function _removeMapMarker(el) {
    if (el && el.parentNode) {
      el.parentNode.removeChild(el);
    }
  }

  // ── Get player reference ─────────────────────────────────────────────
  function _getPlayer() {
    if (window._player) return window._player;
    if (window.player) return window.player;
    if (typeof GameManager !== 'undefined' && GameManager.getPlayer) return GameManager.getPlayer();
    return null;
  }

  function _getPlayerPos() {
    var p = _getPlayer();
    if (p && p.position) return p.position;
    if (window.GameManager && window.GameManager.getPlayerPosition) return window.GameManager.getPlayerPosition();
    return { x: 0, y: 0, z: 0 };
  }

  function _getGroundY(x, z) {
    if (typeof VoxelWorld !== 'undefined' && VoxelWorld.getTerrainHeight) {
      return VoxelWorld.getTerrainHeight(x, z);
    }
    return 0;
  }

  // ── Remove a drop (3D objects + DOM) ─────────────────────────────────
  function _removeDrop(drop) {
    if (!drop) return;

    // Remove crate
    if (drop.crateMesh && _scene) {
      _scene.remove(drop.crateMesh);
      if (drop.crateMesh.geometry) drop.crateMesh.geometry.dispose();
      if (drop.crateMesh.material) drop.crateMesh.material.dispose();
      drop.crateMesh = null;
    }

    // Remove parachute
    if (drop.parachuteMesh && _scene) {
      _scene.remove(drop.parachuteMesh);
      if (drop.parachuteMesh.geometry) drop.parachuteMesh.geometry.dispose();
      if (drop.parachuteMesh.material) drop.parachuteMesh.material.dispose();
      drop.parachuteMesh = null;
    }

    // Remove beacon
    if (drop.beaconLight && _scene) {
      _scene.remove(drop.beaconLight);
      drop.beaconLight = null;
    }

    // Remove DOM marker
    if (drop.markerEl) {
      _removeMapMarker(drop.markerEl);
      drop.markerEl = null;
    }

    drop.removed = true;
  }

  // ── Remove a plane ────────────────────────────────────────────────────
  function _removePlane(plane) {
    if (!plane || !_scene) return;
    _scene.remove(plane);
    plane.traverse(function (child) {
      if (child.geometry) child.geometry.dispose();
      if (child.material) child.material.dispose();
    });
  }

  // ── Attract enemies toward drop ───────────────────────────────────────
  function _attractEnemies(x, z) {
    if (typeof Enemies === 'undefined' || !Enemies.getAll) return;
    var all = Enemies.getAll();
    for (var i = 0; i < all.length; i++) {
      var e = all[i];
      if (!e || !e.alive || !e.mesh) continue;
      var dx = x - e.mesh.position.x;
      var dz = z - e.mesh.position.z;
      var dist = Math.sqrt(dx * dx + dz * dz);
      if (dist < ENEMY_ATTRACT_DIST) {
        // Set target position on enemy if supported
        if (e.targetPos) {
          e.targetPos.x = x;
          e.targetPos.z = z;
        } else if (typeof e.setTarget === 'function') {
          e.setTarget({ x: x, y: 0, z: z });
        }
      }
    }
  }

  // ── Apply crate contents to player ───────────────────────────────────
  function _applyCrateContents(drop) {
    var player = _getPlayer();
    var result = drop.crateType.apply(player);
    _notify('📦 ' + drop.crateType.label + ' — ' + result, '#44FF88');
    if (window.AudioSystem && window.AudioSystem.playPickup) {
      window.AudioSystem.playPickup();
    }
  }

  // ── Pick a random crate type ──────────────────────────────────────────
  function _randomCrateType() {
    return CRATE_TYPES[Math.floor(Math.random() * CRATE_TYPES.length)];
  }

  // ── Internal: spawn one full airdrop sequence ─────────────────────────
  function _spawnDrop(targetX, targetZ) {
    if (!_scene) return;
    if (_drops.length >= MAX_DROPS) return;

    var groundY = _getGroundY(targetX, targetZ);

    // Plane flies in from one side, drops crate over target
    var planeStartX = targetX - 60;
    var planeEndX = targetX + 60;
    var planeZ = targetZ;
    var planeMesh = _buildPlaneMesh(planeStartX, planeZ);

    // Play engine roar for 10 seconds
    _playEngineRoar(TOTAL_DROP_SEQ);

    var markerEl = _createMapMarker(_drops.length + '_' + Date.now());

    var drop = {
      targetX: targetX,
      targetZ: targetZ,
      groundY: groundY,
      crateType: _randomCrateType(),

      // Plane tracking
      planeMesh: planeMesh,
      planeStartX: planeStartX,
      planeEndX: planeEndX,
      planeZ: planeZ,
      planeDropped: false,

      // Crate and parachute (created at drop time)
      crateMesh: null,
      parachuteMesh: null,
      crateY: PLANE_Y - 0.5,

      // Timing
      elapsed: 0,
      phase: 1, // 1=plane flying, 2=crate released, 3=descending, 4=landed

      // Landing effects
      beaconLight: null,
      smokeAccum: 0,

      // Map marker
      markerEl: markerEl,

      // Misc
      removed: false,
      collected: false
    };

    _drops.push(drop);
    return drop;
  }

  // ── Public: callAirdrop(x, z) — external trigger (radio support etc.) ─
  function callAirdrop(x, z) {
    if (typeof x !== 'number') {
      var pp = _getPlayerPos();
      x = pp.x + (Math.random() - 0.5) * 20;
      z = pp.z + (Math.random() - 0.5) * 20;
    }
    _spawnDrop(x, z);
  }

  // ── Public: init ──────────────────────────────────────────────────────
  function init(scene, camera) {
    _scene = scene || _scene;
    _camera = camera || _camera;
    if (!_camera && window._camera) _camera = window._camera;
    _drops = [];
    _planes = [];
    _smokeParticles = [];
    _mapMarkers = [];
    _lastWaveChecked = 0;
    _globalTime = 0;
  }

  // ── Public: update(dt) ────────────────────────────────────────────────
  function update(dt) {
    if (!dt || dt <= 0) return;
    _globalTime += dt;

    // ── Auto-trigger on wave 5+ every 3 waves ────────────────────────
    var currentWave = 0;
    if (window.GameManager && typeof window.GameManager.getWave === 'function') {
      currentWave = window.GameManager.getWave();
    } else if (window._waveNumber) {
      currentWave = window._waveNumber;
    } else if (typeof waveNumber !== 'undefined') {
      currentWave = waveNumber;
    }

    if (currentWave >= MIN_WAVE && currentWave !== _lastWaveChecked) {
      var wavesSinceMin = currentWave - MIN_WAVE;
      if (wavesSinceMin % AUTO_WAVE_INTERVAL === 0) {
        var pp = _getPlayerPos();
        var ax = pp.x + (Math.random() - 0.5) * 30;
        var az = pp.z + (Math.random() - 0.5) * 30;
        callAirdrop(ax, az);
      }
      _lastWaveChecked = currentWave;
    }

    // ── Update smoke particles ────────────────────────────────────────
    for (var si = _smokeParticles.length - 1; si >= 0; si--) {
      var sp = _smokeParticles[si];
      sp.life += dt;
      var tLife = sp.life / sp.maxLife;
      sp.mesh.position.y += dt * 1.8;
      if (sp.mat) sp.mat.opacity = 0.75 * (1 - tLife);
      if (sp.life >= sp.maxLife) {
        if (_scene) _scene.remove(sp.mesh);
        if (sp.geo) sp.geo.dispose();
        if (sp.mat) sp.mat.dispose();
        _smokeParticles.splice(si, 1);
      }
    }

    // ── Update drops ──────────────────────────────────────────────────
    var playerPos = _getPlayerPos();
    var player = _getPlayer();

    for (var di = _drops.length - 1; di >= 0; di--) {
      var drop = _drops[di];
      if (!drop || drop.removed) {
        _drops.splice(di, 1);
        continue;
      }
      if (drop.collected) {
        // Remove after collection
        _removeDrop(drop);
        _drops.splice(di, 1);
        continue;
      }

      drop.elapsed += dt;

      // ── Phase 1: Plane flying (0–6s) ─────────────────────────────
      if (drop.phase === 1) {
        var planeT = Math.min(drop.elapsed / DROP_TIME, 1);
        var newPlaneX = drop.planeStartX + (drop.planeEndX - drop.planeStartX) * planeT;
        if (drop.planeMesh) {
          drop.planeMesh.position.x = newPlaneX;
          drop.planeMesh.position.y = PLANE_Y;
          drop.planeMesh.position.z = drop.planeZ;
        }

        if (drop.elapsed >= DROP_TIME) {
          drop.phase = 2;
          // Create crate and parachute at drop point
          drop.crateMesh = _buildCrateMesh(drop.targetX, PLANE_Y - 0.5, drop.targetZ);
          drop.parachuteMesh = _buildParachuteMesh(drop.targetX, PLANE_Y + 0.8, drop.targetZ);
          drop.crateY = PLANE_Y - 0.5;
        }
      }

      // ── Phase 2: Crate released (6–7s pause / transition) ────────
      else if (drop.phase === 2) {
        if (drop.elapsed >= DROP_TIME + 1) {
          drop.phase = 3;
        }
        // Brief stabilization moment — no movement yet
      }

      // ── Phase 3: Descending (7–10s) ──────────────────────────────
      else if (drop.phase === 3) {
        var groundY = drop.groundY;
        var sway = Math.sin(drop.elapsed * 3) * 0.1;

        if (drop.crateY > groundY + 0.4) {
          drop.crateY -= FALL_SPEED * dt;
          if (drop.crateY < groundY + 0.4) drop.crateY = groundY + 0.4;
        }

        if (drop.crateMesh) {
          drop.crateMesh.position.x = drop.targetX + sway;
          drop.crateMesh.position.y = drop.crateY;
          drop.crateMesh.position.z = drop.targetZ + sway * 0.5;
        }
        if (drop.parachuteMesh) {
          drop.parachuteMesh.position.x = drop.targetX + sway;
          drop.parachuteMesh.position.y = drop.crateY + 1.3;
          drop.parachuteMesh.position.z = drop.targetZ + sway * 0.5;
          // Parachute billowing — oscillate rotation
          drop.parachuteMesh.rotation.z = Math.sin(drop.elapsed * 4) * 0.1;
        }

        // Check if crate has landed
        if (drop.crateY <= groundY + 0.41) {
          drop.phase = 4;

          // Play thud sound
          _playThud();

          // Remove parachute
          if (drop.parachuteMesh && _scene) {
            _scene.remove(drop.parachuteMesh);
            if (drop.parachuteMesh.geometry) drop.parachuteMesh.geometry.dispose();
            if (drop.parachuteMesh.material) drop.parachuteMesh.material.dispose();
            drop.parachuteMesh = null;
          }

          // Remove plane mesh now that drop is done
          if (drop.planeMesh) {
            _removePlane(drop.planeMesh);
            drop.planeMesh = null;
          }

          // Fix crate on ground
          if (drop.crateMesh) {
            drop.crateMesh.position.set(drop.targetX, groundY + 0.4, drop.targetZ);
          }

          // Add beacon light
          drop.beaconLight = _buildBeaconLight(drop.targetX, groundY, drop.targetZ);

          // Show map marker
          if (drop.markerEl) drop.markerEl.style.display = 'block';

          // Attract enemies
          _attractEnemies(drop.targetX, drop.targetZ);

          // Notify
          _notify('📦 SUPPLY DROP LANDED!', '#00FF88');
        }
      }

      // ── Phase 4: On ground ────────────────────────────────────────
      else if (drop.phase === 4) {
        var groundYLanded = drop.groundY;

        // Beacon pulse
        if (drop.beaconLight) {
          drop.beaconLight.intensity = 1 + Math.sin(_globalTime * 3) * 1;
        }

        // Smoke signal: green particles rising
        drop.smokeAccum += dt;
        var smokeInterval = 1 / SMOKE_RATE;
        while (drop.smokeAccum >= smokeInterval) {
          drop.smokeAccum -= smokeInterval;
          var sp2 = _spawnSmokeParticle(drop.targetX, drop.targetZ, groundYLanded);
          if (sp2) _smokeParticles.push(sp2);
        }

        // Map marker: show distance
        if (drop.markerEl && playerPos) {
          var mdx = drop.targetX - playerPos.x;
          var mdz = drop.targetZ - playerPos.z;
          var mdist = Math.round(Math.sqrt(mdx * mdx + mdz * mdz));
          drop.markerEl.textContent = '📦 SUPPLY: ' + mdist + 'm';
        }

        // Continue attracting enemies periodically
        if (Math.floor(drop.elapsed) % 3 === 0 && drop.elapsed % 1 < dt) {
          _attractEnemies(drop.targetX, drop.targetZ);
        }

        // Check player collection
        if (playerPos && player && !drop.collected) {
          var cdx = playerPos.x - drop.targetX;
          var cdz = playerPos.z - drop.targetZ;
          var cdist = Math.sqrt(cdx * cdx + cdz * cdz);
          if (cdist <= COLLECT_DIST) {
            drop.collected = true;
            _applyCrateContents(drop);
            // Hide marker immediately
            if (drop.markerEl) drop.markerEl.style.display = 'none';
          }
        }
      }
    }

    // Lazily grab camera if not set
    if (!_camera && window._camera) _camera = window._camera;
  }

  // ── Public: reset ─────────────────────────────────────────────────────
  function reset() {
    // Remove all active drops
    for (var di = 0; di < _drops.length; di++) {
      _removeDrop(_drops[di]);
      if (_drops[di] && _drops[di].planeMesh) {
        _removePlane(_drops[di].planeMesh);
        _drops[di].planeMesh = null;
      }
    }
    _drops = [];

    // Remove all standalone planes
    for (var pi = 0; pi < _planes.length; pi++) {
      _removePlane(_planes[pi]);
    }
    _planes = [];

    // Remove smoke particles
    for (var si2 = 0; si2 < _smokeParticles.length; si2++) {
      var sp3 = _smokeParticles[si2];
      if (_scene && sp3.mesh) _scene.remove(sp3.mesh);
      if (sp3.geo) sp3.geo.dispose();
      if (sp3.mat) sp3.mat.dispose();
    }
    _smokeParticles = [];

    // Remove map markers
    for (var mi = 0; mi < _mapMarkers.length; mi++) {
      _removeMapMarker(_mapMarkers[mi]);
    }
    _mapMarkers = [];

    _lastWaveChecked = 0;
    _globalTime = 0;
  }

  // ── Public API ────────────────────────────────────────────────────────
  return {
    init: init,
    update: update,
    callAirdrop: callAirdrop,
    reset: reset
  };

})();
