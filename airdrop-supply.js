// airdrop-supply.js — Parachute airdrop resupply system with randomized rewards
// All var — no let/const. IIFE pattern.

window.AirdropSupply = (function () {
  'use strict';

  // ── Constants ─────────────────────────────────────────────────────────────
  var MAX_USES       = 2;
  var COOLDOWN_SEC   = 60;
  var SPAWN_HEIGHT   = 30;    // units above player when crate appears
  var DESCENT_SPEED  = 4;     // units/s
  var SWAY_AMP       = 0.2;   // ±X/Z sine sway
  var SWAY_FREQ      = 1.2;   // radians/s
  var WARN_DELAY     = 5;     // seconds toast → crate appears
  var COLLECT_DIST   = 1.5;
  var ENEMY_RUSH_COUNT = 3;

  // Content types
  var REWARD_TYPES = ['AMMO', 'HEALTH', 'ARMOR', 'WEAPON', 'AIRSTRIKE'];

  // ── State ─────────────────────────────────────────────────────────────────
  var _scene    = null;
  var _camera   = null;
  var _inited   = false;

  var _usesLeft      = MAX_USES;
  var _cooldownTimer = 0;      // seconds remaining on cooldown
  var _drops         = [];     // active drop objects
  var _ctrlHeld      = false;
  var _eKeyDown      = false;

  var _hudBadge      = null;
  var _hudTimer      = null;

  // ── Helpers ───────────────────────────────────────────────────────────────

  function _getScene() {
    return _scene || window._gameScene || null;
  }

  function _getCamera() {
    return _camera || window._camera || null;
  }

  function _toast(msg) {
    if (window.HUD && window.HUD.showToast) {
      window.HUD.showToast(msg);
    } else {
      console.log('[AirdropSupply] ' + msg);
    }
  }

  function _getAudioCtx() {
    if (window._audioCtx) return window._audioCtx;
    try {
      var Ctx = window.AudioContext || window.webkitAudioContext;
      if (Ctx) {
        window._audioCtx = new Ctx();
        return window._audioCtx;
      }
    } catch (e) {}
    return null;
  }

  // ── Audio synthesis ───────────────────────────────────────────────────────

  function _playJetRoar() {
    var ctx = _getAudioCtx();
    if (!ctx) return;
    try {
      var buf = ctx.createBuffer(1, ctx.sampleRate * 3, ctx.sampleRate);
      var data = buf.getChannelData(0);
      for (var i = 0; i < data.length; i++) {
        var t = i / ctx.sampleRate;
        data[i] = (Math.sin(2 * Math.PI * 180 * t) * 0.3 +
                   Math.sin(2 * Math.PI * 240 * t) * 0.2 +
                   (Math.random() * 2 - 1) * 0.15) *
                  Math.sin(Math.PI * t / 3);
      }
      var src = ctx.createBufferSource();
      src.buffer = buf;
      var gain = ctx.createGain();
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 1);
      gain.gain.linearRampToValueAtTime(0.1, ctx.currentTime + 3);
      src.connect(gain);
      gain.connect(ctx.destination);
      src.start();
    } catch (e) {}
  }

  function _playParachuteRustle() {
    var ctx = _getAudioCtx();
    if (!ctx) return;
    try {
      var buf = ctx.createBuffer(1, ctx.sampleRate * 1.5, ctx.sampleRate);
      var data = buf.getChannelData(0);
      for (var i = 0; i < data.length; i++) {
        var t = i / ctx.sampleRate;
        var env = Math.min(t * 4, 1) * Math.exp(-t * 1.5);
        data[i] = (Math.random() * 2 - 1) * env * 0.3;
      }
      var src = ctx.createBufferSource();
      src.buffer = buf;
      var filter = ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.value = 800;
      src.connect(filter);
      filter.connect(ctx.destination);
      src.start();
    } catch (e) {}
  }

  function _playWoodenThud() {
    var ctx = _getAudioCtx();
    if (!ctx) return;
    try {
      var dur = 0.4;
      var buf = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * dur), ctx.sampleRate);
      var data = buf.getChannelData(0);
      for (var i = 0; i < data.length; i++) {
        var t = i / ctx.sampleRate;
        data[i] = (Math.sin(2 * Math.PI * 80 * t) * 0.7 +
                   (Math.random() * 2 - 1) * 0.3) *
                  Math.exp(-t * 10);
      }
      var src = ctx.createBufferSource();
      src.buffer = buf;
      var gain = ctx.createGain();
      gain.gain.value = 0.8;
      src.connect(gain);
      gain.connect(ctx.destination);
      src.start();
    } catch (e) {}
  }

  function _playFanfare() {
    var ctx = _getAudioCtx();
    if (!ctx) return;
    try {
      var notes = [523, 659, 784, 1047]; // C5 E5 G5 C6
      var now = ctx.currentTime;
      notes.forEach(function (freq, idx) {
        var osc  = ctx.createOscillator();
        var gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0, now + idx * 0.12);
        gain.gain.linearRampToValueAtTime(0.3, now + idx * 0.12 + 0.05);
        gain.gain.linearRampToValueAtTime(0, now + idx * 0.12 + 0.25);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.12);
        osc.stop(now + idx * 0.12 + 0.3);
      });
    } catch (e) {}
  }

  // ── HUD badge ─────────────────────────────────────────────────────────────

  function _buildHUD() {
    if (document.getElementById('airdrop-supply-hud')) return;

    var wrap = document.createElement('div');
    wrap.id = 'airdrop-supply-hud';
    wrap.style.cssText = [
      'position:fixed',
      'top:12px',
      'right:12px',
      'display:flex',
      'flex-direction:column',
      'align-items:flex-end',
      'z-index:500',
      'pointer-events:none',
      'font-family:monospace'
    ].join(';');

    var badge = document.createElement('div');
    badge.id = 'airdrop-supply-badge';
    badge.style.cssText = [
      'background:rgba(0,0,0,0.6)',
      'border:1px solid #44cc88',
      'color:#44cc88',
      'padding:4px 10px',
      'border-radius:4px',
      'font-size:13px',
      'margin-bottom:4px'
    ].join(';');
    badge.textContent = '📦 DROP \xD7' + _usesLeft;

    var timer = document.createElement('div');
    timer.id = 'airdrop-supply-timer';
    timer.style.cssText = [
      'background:rgba(0,0,0,0.5)',
      'color:#ffcc44',
      'padding:2px 8px',
      'border-radius:4px',
      'font-size:11px',
      'display:none'
    ].join(';');

    wrap.appendChild(badge);
    wrap.appendChild(timer);
    document.body.appendChild(wrap);

    _hudBadge = badge;
    _hudTimer = timer;
  }

  function _refreshHUD() {
    if (!_hudBadge) _buildHUD();
    if (!_hudBadge) return;
    _hudBadge.textContent = '📦 DROP \xD7' + _usesLeft;
    if (_cooldownTimer > 0) {
      _hudBadge.style.color = '#888888';
      _hudBadge.style.borderColor = '#555555';
      if (_hudTimer) {
        _hudTimer.style.display = 'block';
        _hudTimer.textContent = 'COOLDOWN ' + Math.ceil(_cooldownTimer) + 's';
      }
    } else {
      _hudBadge.style.color = '#44cc88';
      _hudBadge.style.borderColor = '#44cc88';
      if (_hudTimer) _hudTimer.style.display = 'none';
    }
  }

  // ── Crate mesh ────────────────────────────────────────────────────────────

  function _buildCrateMesh(x, y, z) {
    var scene = _getScene();
    if (!scene || typeof THREE === 'undefined') return null;

    var group = new THREE.Group();
    group.position.set(x, y, z);

    // Main box — military green
    var boxGeo = new THREE.BoxGeometry(1, 1, 1);
    var boxMat = new THREE.MeshLambertMaterial({ color: 0x3a5a2a });
    var box    = new THREE.Mesh(boxGeo, boxMat);
    group.add(box);

    // Wood stripe markings (flat, slightly raised boxes)
    var stripeMat = new THREE.MeshLambertMaterial({ color: 0x8b6914 });
    var stripePositions = [
      [0, 0.4, 0],
      [0, -0.4, 0]
    ];
    stripePositions.forEach(function (pos) {
      var sGeo = new THREE.BoxGeometry(1.02, 0.08, 1.02);
      var stripe = new THREE.Mesh(sGeo, stripeMat);
      stripe.position.set(pos[0], pos[1], pos[2]);
      group.add(stripe);
    });

    // Star emblem (small flat box on front face)
    var starMat  = new THREE.MeshLambertMaterial({ color: 0xffffff });
    var starMeshA = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.35, 0.02), starMat);
    starMeshA.position.set(0, 0, 0.52);
    group.add(starMeshA);
    var starMeshB = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.05, 0.02), starMat);
    starMeshB.position.set(0, 0, 0.52);
    group.add(starMeshB);

    // Lid (slightly raised top panel, same green, will animate on open)
    var lidGeo = new THREE.BoxGeometry(1.02, 0.06, 1.02);
    var lidMat = new THREE.MeshLambertMaterial({ color: 0x3a5a2a });
    var lid    = new THREE.Mesh(lidGeo, lidMat);
    lid.position.set(0, 0.53, 0);
    group.add(lid);

    scene.add(group);
    return { group: group, lid: lid, box: box };
  }

  // ── Parachute ─────────────────────────────────────────────────────────────

  function _buildParachute(x, y, z) {
    var scene = _getScene();
    if (!scene || typeof THREE === 'undefined') return null;

    var group = new THREE.Group();

    // Inverted cone (tip pointing down, opening up)
    var coneGeo = new THREE.ConeGeometry(1.5, 2, 8);
    var coneMat = new THREE.MeshLambertMaterial({
      color: 0xffffff,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.9
    });
    var cone = new THREE.Mesh(coneGeo, coneMat);
    // Rotate 180° so the tip points downward (inverted)
    cone.rotation.x = Math.PI;
    cone.position.set(0, 0, 0);
    group.add(cone);

    // 4 cord lines from cone tip (below cone) to crate top
    var cordMat = new THREE.LineBasicMaterial({ color: 0xdddddd });
    var offsets = [
      [ 0.5, 0, 0.5],
      [-0.5, 0, 0.5],
      [ 0.5, 0, -0.5],
      [-0.5, 0, -0.5]
    ];
    offsets.forEach(function (off) {
      var points = [
        new THREE.Vector3(off[0] * 0.3, -1, off[2] * 0.3),  // near cone tip
        new THREE.Vector3(off[0], -3.2, off[2])              // at crate corners
      ];
      var cordGeo = new THREE.BufferGeometry().setFromPoints(points);
      var cord    = new THREE.Line(cordGeo, cordMat);
      group.add(cord);
    });

    // Position the whole parachute group above the crate
    group.position.set(x, y + 2.5, z);

    scene.add(group);
    return { group: group, cone: cone, coneMat: coneMat };
  }

  // ── Enemy rush ────────────────────────────────────────────────────────────

  function _spawnEnemyRush(x, z) {
    if (!window.Enemies || !window.Enemies.spawnAt) return;
    var spread = 6;
    for (var i = 0; i < ENEMY_RUSH_COUNT; i++) {
      var ex = x + (Math.random() - 0.5) * spread;
      var ez = z + (Math.random() - 0.5) * spread;
      window.Enemies.spawnAt(ex, 1, ez, 'SOLDIER');
    }
  }

  // ── Reward application ────────────────────────────────────────────────────

  function _pickReward() {
    return REWARD_TYPES[Math.floor(Math.random() * REWARD_TYPES.length)];
  }

  function _applyReward(rewardType, cx, cz) {
    var msg = '';
    switch (rewardType) {
      case 'AMMO':
        if (window._maxAmmo !== undefined) {
          window._ammo = window._maxAmmo;
          msg = 'AMMO REFILLED TO MAX!';
        } else {
          msg = 'AMMO CACHE SECURED!';
        }
        break;

      case 'HEALTH':
        if (window.player) {
          window.player.health = Math.min((window.player.health || 0) + 75, window.player.maxHealth || 200);
          msg = '+75 HP RESTORED!';
        } else {
          msg = 'MEDKIT ACQUIRED!';
        }
        break;

      case 'ARMOR':
        if (window._playerArmor !== undefined) {
          window._playerArmor = (window._playerArmor || 0) + 50;
          msg = '+50 ARMOR PLATES!';
        } else {
          msg = 'ARMOR ACQUIRED!';
        }
        break;

      case 'WEAPON':
        // Spawn a pickup near the crate
        if (window.Pickups && window.Pickups.spawnAt) {
          window.Pickups.spawnAt(cx, 0.5, cz);
        } else if (window.Weapons && window.Weapons.giveRandom) {
          window.Weapons.giveRandom();
        }
        msg = 'WEAPON CACHE FOUND!';
        break;

      case 'AIRSTRIKE':
        if (window._orbitalStrikeCharges !== undefined) {
          window._orbitalStrikeCharges = (window._orbitalStrikeCharges || 0) + 1;
        }
        msg = 'ORBITAL STRIKE CHARGE ACQUIRED!';
        break;

      default:
        msg = 'SUPPLIES SECURED!';
    }

    // Update score
    if (window.player && window.player.score !== undefined) {
      window.player.score += 100;
    }

    _toast('⭐ ' + msg);
    _playFanfare();
  }

  // ── Opening animation ─────────────────────────────────────────────────────

  function _openCrate(drop) {
    if (drop.opened) return;
    drop.opened = true;

    var scene = _getScene();

    // Lift lid
    drop._lidOpen = true;

    // Golden point light shining upward
    var light = new THREE.PointLight(0xffd700, 2, 6);
    light.position.copy(drop.crateGroup.position);
    light.position.y += 0.5;
    scene.add(light);
    drop._openLight = light;
    drop._openLightTimer = 3.0;

    // Floating reward orb
    var orbGeo = new THREE.SphereGeometry(0.2, 8, 8);
    var orbMat = new THREE.MeshLambertMaterial({ color: 0xffd700, emissive: 0xffaa00 });
    var orb    = new THREE.Mesh(orbGeo, orbMat);
    orb.position.copy(drop.crateGroup.position);
    orb.position.y += 0.5;
    scene.add(orb);
    drop._orb     = orb;
    drop._orbTime = 0;

    _applyReward(drop.reward, drop.crateGroup.position.x, drop.crateGroup.position.z);
  }

  // ── Drop launch ───────────────────────────────────────────────────────────

  function call() {
    if (_usesLeft <= 0) {
      _toast('NO AIRDROPS REMAINING');
      return;
    }
    if (_cooldownTimer > 0) {
      _toast('AIRDROP ON COOLDOWN — ' + Math.ceil(_cooldownTimer) + 's');
      return;
    }

    var cam = _getCamera();
    if (!cam) {
      _toast('CAMERA NOT AVAILABLE');
      return;
    }

    _usesLeft--;
    _cooldownTimer = COOLDOWN_SEC;
    _refreshHUD();

    // Step 1: jet roar + toast
    _playJetRoar();
    _toast('⚠ AIRDROP INBOUND — 5 SECONDS');

    var spawnX = cam.position.x;
    var spawnZ = cam.position.z;

    // Step 2: after WARN_DELAY seconds spawn crate + parachute
    var warnHandle = setTimeout(function () {
      var scene = _getScene();
      if (!scene) return;

      var startY   = (cam.position.y || 0) + SPAWN_HEIGHT;
      var targetY  = 0.5; // ground level

      var crate     = _buildCrateMesh(spawnX, startY, spawnZ);
      var parachute = _buildParachute(spawnX, startY, spawnZ);

      if (!crate || !parachute) return;

      _playParachuteRustle();

      var drop = {
        crateGroup:   crate.group,
        lid:          crate.lid,
        paraGroup:    parachute.group,
        paraCone:     parachute.cone,
        paraConeMat:  parachute.coneMat,
        targetY:      targetY,
        landed:       false,
        opened:       false,
        collected:    false,
        time:         0,
        reward:       _pickReward(),
        billowTimer:  0,
        _lidOpen:     false,
        _lidAngle:    0,
        _openLight:   null,
        _openLightTimer: 0,
        _orb:         null,
        _orbTime:     0
      };

      _drops.push(drop);

      // Spawn enemy rush toward crate
      _spawnEnemyRush(spawnX, spawnZ);

    }, WARN_DELAY * 1000);

    // Store handle (not strictly needed but good hygiene)
    _drops.__warnHandle = warnHandle;
  }

  // ── Key handlers ─────────────────────────────────────────────────────────

  function _onKeyDown(e) {
    if (e.code === 'ControlLeft' || e.code === 'ControlRight') {
      _ctrlHeld = true;
    }
    if (e.code === 'KeyA' && _ctrlHeld) {
      e.preventDefault();
      call();
    }
    if (e.code === 'KeyE') {
      _eKeyDown = true;
      _tryCollect();
    }
  }

  function _onKeyUp(e) {
    if (e.code === 'ControlLeft' || e.code === 'ControlRight') {
      _ctrlHeld = false;
    }
    if (e.code === 'KeyE') {
      _eKeyDown = false;
    }
  }

  function _tryCollect() {
    var cam = _getCamera();
    if (!cam) return;
    for (var i = 0; i < _drops.length; i++) {
      var drop = _drops[i];
      if (!drop.landed || drop.opened || drop.collected) continue;
      var dx = cam.position.x - drop.crateGroup.position.x;
      var dz = cam.position.z - drop.crateGroup.position.z;
      var dist = Math.sqrt(dx * dx + dz * dz);
      if (dist <= COLLECT_DIST) {
        _openCrate(drop);
        drop.collected = true;
        _toast('[E] CRATE OPENED!');
      }
    }
  }

  // ── Update (call each frame) ──────────────────────────────────────────────

  function update(dt) {
    if (!_inited) return;
    if (typeof dt !== 'number' || isNaN(dt)) dt = 0.016;

    // Cooldown tick
    if (_cooldownTimer > 0) {
      _cooldownTimer -= dt;
      if (_cooldownTimer < 0) _cooldownTimer = 0;
      _refreshHUD();
    }

    var scene = _getScene();
    var cam   = _getCamera();

    for (var i = _drops.length - 1; i >= 0; i--) {
      var drop = _drops[i];

      if (drop.landed) {
        // Billow animation for detached parachute
        if (drop.billowTimer < 2.0 && drop.paraGroup) {
          drop.billowTimer += dt;
          drop.paraGroup.rotation.z += dt * 0.8;
          drop.paraGroup.rotation.x += dt * 0.5;
          drop.paraGroup.position.y -= dt * 1.5;
          if (drop.billowTimer >= 2.0 && scene) {
            scene.remove(drop.paraGroup);
            drop.paraGroup = null;
          }
        }

        // Lid lift animation
        if (drop._lidOpen && drop.lid) {
          drop._lidAngle += dt * 2.5;
          if (drop._lidAngle > Math.PI * 0.55) drop._lidAngle = Math.PI * 0.55;
          drop.lid.rotation.x = drop._lidAngle;
          drop.lid.position.y = 0.53 + Math.sin(drop._lidAngle) * 0.5;
        }

        // Floating orb
        if (drop._orb) {
          drop._orbTime += dt;
          drop._orb.position.y = drop.crateGroup.position.y + 0.5 + Math.sin(drop._orbTime * 2.5) * 0.25;
          if (drop._orbTime > 4.0 && scene) {
            scene.remove(drop._orb);
            drop._orb = null;
          }
        }

        // Open light fade
        if (drop._openLight) {
          drop._openLightTimer -= dt;
          drop._openLight.intensity = Math.max(0, drop._openLightTimer / 3.0) * 2;
          if (drop._openLightTimer <= 0 && scene) {
            scene.remove(drop._openLight);
            drop._openLight = null;
          }
        }

        // Proximity prompt
        if (!drop.opened && cam) {
          var dx = cam.position.x - drop.crateGroup.position.x;
          var dz = cam.position.z - drop.crateGroup.position.z;
          if (Math.sqrt(dx * dx + dz * dz) <= COLLECT_DIST + 0.5) {
            _toast('[E] OPEN CRATE');
          }
        }

        continue;
      }

      // Descending phase
      drop.time += dt;

      var newY = drop.crateGroup.position.y - DESCENT_SPEED * dt;
      var swayX = Math.sin(drop.time * SWAY_FREQ) * SWAY_AMP;
      var swayZ = Math.cos(drop.time * SWAY_FREQ * 0.7) * SWAY_AMP;

      drop.crateGroup.position.y  = newY;
      drop.crateGroup.position.x += swayX * dt;
      drop.crateGroup.position.z += swayZ * dt;

      if (drop.paraGroup) {
        drop.paraGroup.position.y  = newY + 2.5;
        drop.paraGroup.position.x  = drop.crateGroup.position.x;
        drop.paraGroup.position.z  = drop.crateGroup.position.z;
      }

      // Landing check
      if (newY <= drop.targetY) {
        drop.crateGroup.position.y = drop.targetY;
        drop.landed = true;
        _playWoodenThud();
        _toast('⭐ SUPPLY CRATE LANDED — [E] TO OPEN');

        // Detach parachute (starts billowing)
        if (drop.paraGroup) {
          drop.billowTimer = 0;
        }
      }
    }
  }

  // ── Init / Reset ──────────────────────────────────────────────────────────

  function init(scene, camera) {
    _scene  = scene  || window._gameScene || null;
    _camera = camera || window._camera    || null;

    if (_inited) return;
    _inited = true;

    _usesLeft      = MAX_USES;
    _cooldownTimer = 0;
    _drops         = [];
    _ctrlHeld      = false;

    document.addEventListener('keydown', _onKeyDown);
    document.addEventListener('keyup',   _onKeyUp);

    _buildHUD();
    _refreshHUD();
  }

  function reset() {
    var scene = _getScene();

    // Clean up all active drops
    for (var i = 0; i < _drops.length; i++) {
      var drop = _drops[i];
      if (scene) {
        if (drop.crateGroup)  scene.remove(drop.crateGroup);
        if (drop.paraGroup)   scene.remove(drop.paraGroup);
        if (drop._openLight)  scene.remove(drop._openLight);
        if (drop._orb)        scene.remove(drop._orb);
      }
    }

    _drops         = [];
    _usesLeft      = MAX_USES;
    _cooldownTimer = 0;
    _ctrlHeld      = false;

    _refreshHUD();
  }

  // ── Public API ────────────────────────────────────────────────────────────
  return {
    init:   init,
    update: update,
    call:   call,
    reset:  reset
  };

}());
