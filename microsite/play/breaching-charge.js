// breaching-charge.js — Tactical Breaching Charge
// Alt+B to plant on wall surface, Shift+Alt+B to detonate manually
// No let/const — only var throughout, IIFE pattern
window.BreachingCharge = (function () {
  'use strict';

  // ── State ──────────────────────────────────────────────────────────────────
  var _scene    = null;
  var _camera   = null;
  var _onHit    = null;   // callback(pos, isPlayer) for player damage

  var _charges      = [];   // list of planted charge objects
  var _chargeCount  = 2;    // remaining charges
  var _MAX_CHARGES  = 2;    // total inventory
  var _cooldown     = 0;    // cooldown timer (seconds remaining)
  var _COOLDOWN_MAX = 30;   // 30-second cooldown between sets
  var _time         = 0;

  var PLANT_RANGE   = 2.5;   // max placement distance from player
  var BLAST_CONE_RANGE  = 4; // cone depth (units)
  var BLAST_CONE_RADIUS = 2; // cone half-width at tip
  var BLAST_CONE_DMG    = 150;
  var BLAST_RADIUS_DMG  = 60;
  var BLAST_RADIUS      = 3; // splash radius outside cone
  var AUTO_DETONATE_SEC = 30; // auto-detonate after this many seconds

  var _keysRegistered = false;
  var _proximityHintShown = false;

  // ── HUD element ────────────────────────────────────────────────────────────
  function _ensureHUD() {
    if (document.getElementById('breachChargeHUD')) return;
    var el = document.createElement('div');
    el.id = 'breachChargeHUD';
    el.style.cssText = [
      'position:fixed',
      'bottom:130px',
      'right:14px',
      'font-family:monospace',
      'font-size:13px',
      'color:#e05050',
      'background:rgba(0,0,0,0.55)',
      'padding:4px 10px',
      'border-radius:4px',
      'z-index:1002',
      'pointer-events:none',
      'user-select:none',
      'border:1px solid rgba(160,40,40,0.5)',
    ].join(';');
    document.body.appendChild(el);
    _updateHUD();
  }

  function _updateHUD() {
    var el = document.getElementById('breachChargeHUD');
    if (!el) return;
    var dots = '';
    for (var i = 0; i < _MAX_CHARGES; i++) {
      dots += (i < _chargeCount) ? '●' : '○';
    }
    var armedCount = _charges.length;
    var cdText = '';
    if (_cooldown > 0) {
      cdText = ' [CD ' + Math.ceil(_cooldown) + 's]';
    }
    if (armedCount > 0) {
      el.innerHTML = '🧱 BREACH \xd7' + _chargeCount + ' ' + dots
        + ' <span style="color:#ff6644">ARMED(' + armedCount + ')</span>'
        + cdText;
      el.style.color = '#ff8844';
    } else {
      el.innerHTML = '🧱 BREACH \xd7' + _chargeCount + ' ' + dots + cdText;
      el.style.color = '#e05050';
    }
    window._breachChargeCount = _chargeCount;
  }

  // ── Proximity hint ─────────────────────────────────────────────────────────
  function _showProximityHint(show) {
    if (show === _proximityHintShown) return;
    _proximityHintShown = show;
    var id = 'breachChargeHint';
    if (show) {
      if (document.getElementById(id)) return;
      var el = document.createElement('div');
      el.id = id;
      el.style.cssText = [
        'position:fixed',
        'bottom:50%',
        'left:50%',
        'transform:translateX(-50%) translateY(60px)',
        'font-family:monospace',
        'font-size:12px',
        'color:#ffcc44',
        'background:rgba(0,0,0,0.6)',
        'padding:4px 12px',
        'border-radius:4px',
        'z-index:1003',
        'pointer-events:none',
        'user-select:none',
        'letter-spacing:1px',
      ].join(';');
      el.textContent = 'ARM AND DETONATE BREACH [Alt+B]';
      document.body.appendChild(el);
    } else {
      var old = document.getElementById(id);
      if (old) old.parentNode.removeChild(old);
    }
  }

  // ── Toast helper ───────────────────────────────────────────────────────────
  function _toast(msg, color) {
    if (typeof HUD !== 'undefined' && HUD.showToast) {
      HUD.showToast(msg, 2200, color || '#e05050');
    }
  }

  // ── Mesh construction ──────────────────────────────────────────────────────
  function _buildMesh() {
    var group = new THREE.Group();

    // Main body — flat cross-hatched panel
    var bodyGeo = new THREE.PlaneGeometry(0.4, 0.5);
    var bodyMat = new THREE.MeshBasicMaterial({ color: 0x222222, side: THREE.DoubleSide });
    var body = new THREE.Mesh(bodyGeo, bodyMat);
    group.add(body);

    // Cross-hatch lines on the panel face (4 lines forming X pattern)
    var lineMat = new THREE.MeshBasicMaterial({ color: 0x555555 });
    var hLine1 = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.015, 0.005), lineMat);
    hLine1.position.set(0, 0.1, 0.003);
    group.add(hLine1);
    var hLine2 = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.015, 0.005), lineMat);
    hLine2.position.set(0, -0.1, 0.003);
    group.add(hLine2);
    var vLine1 = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.48, 0.005), lineMat);
    vLine1.position.set(0.1, 0, 0.003);
    group.add(vLine1);
    var vLine2 = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.48, 0.005), lineMat);
    vLine2.position.set(-0.1, 0, 0.003);
    group.add(vLine2);

    // Diagonal cross-hatch lines
    var diagLine1 = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.62, 0.004), lineMat);
    diagLine1.rotation.z = Math.PI * 0.25;
    diagLine1.position.set(0, 0, 0.004);
    group.add(diagLine1);
    var diagLine2 = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.62, 0.004), lineMat);
    diagLine2.rotation.z = -Math.PI * 0.25;
    diagLine2.position.set(0, 0, 0.004);
    group.add(diagLine2);

    // 4 red wires at corners
    var wireMat = new THREE.MeshBasicMaterial({ color: 0xcc1111 });
    var wireGeo = new THREE.BoxGeometry(0.02, 0.15, 0.02);
    var wirePositions = [
      [-0.18, 0.22, 0.01],
      [ 0.18, 0.22, 0.01],
      [-0.18,-0.22, 0.01],
      [ 0.18,-0.22, 0.01],
    ];
    for (var wi = 0; wi < wirePositions.length; wi++) {
      var wire = new THREE.Mesh(wireGeo, wireMat);
      wire.position.set(wirePositions[wi][0], wirePositions[wi][1], wirePositions[wi][2]);
      group.add(wire);
    }

    // LED indicator cube — red blinker
    var ledGeo = new THREE.BoxGeometry(0.06, 0.06, 0.06);
    var ledMat = new THREE.MeshBasicMaterial({ color: 0xff2200 });
    var ledMesh = new THREE.Mesh(ledGeo, ledMat);
    ledMesh.position.set(0, 0, 0.05);
    group.add(ledMesh);

    // LED glow point light
    var ledLight = new THREE.PointLight(0xff2200, 0.8, 1.5);
    ledLight.position.copy(ledMesh.position);
    group.add(ledLight);

    return { group: group, ledMesh: ledMesh, ledLight: ledLight, ledMat: ledMat };
  }

  // ── Raycasting to find a solid surface within range ────────────────────────
  function _findWallSurface() {
    if (!_camera) return null;

    var raycaster = new THREE.Raycaster();
    var center = new THREE.Vector2(0, 0);
    raycaster.setFromCamera(center, _camera);

    // Try VoxelWorld raycast first
    var origin = _camera.position.clone();
    var dir = new THREE.Vector3();
    _camera.getWorldDirection(dir);

    // Step along ray in small increments looking for solid voxel
    var STEP = 0.25;
    var steps = Math.ceil(PLANT_RANGE / STEP);
    for (var s = 1; s <= steps; s++) {
      var dist = s * STEP;
      var testX = origin.x + dir.x * dist;
      var testY = origin.y + dir.y * dist;
      var testZ = origin.z + dir.z * dist;
      var vx = Math.floor(testX);
      var vy = Math.floor(testY);
      var vz = Math.floor(testZ);
      var solid = false;
      if (window.VoxelWorld && window.VoxelWorld.isSolid) {
        solid = window.VoxelWorld.isSolid(vx, vy, vz);
      } else if (window.isSolid) {
        solid = window.isSolid(vx, vy, vz);
      }
      if (solid) {
        // Step back to contact point
        var contactDist = dist - STEP * 0.5;
        var contactPos = new THREE.Vector3(
          origin.x + dir.x * contactDist,
          origin.y + dir.y * contactDist,
          origin.z + dir.z * contactDist
        );
        // Surface normal: invert the incoming direction (rough approximation)
        var normal = dir.clone().negate().normalize();
        return { pos: contactPos, normal: normal, dir: dir.clone().normalize() };
      }
    }
    return null;
  }

  // ── Detonate a single charge ───────────────────────────────────────────────
  function _detonate(charge) {
    if (charge.detonated) return;
    charge.detonated = true;

    if (_scene && charge.group) {
      _scene.remove(charge.group);
    }

    var pos  = charge.pos;
    var fdir = charge.faceDir;

    // Set global breach hooks
    window._lastBreachPos = pos.clone();
    window._lastBreachDir = fdir.clone();
    if (typeof window._onBreachDetonation === 'function') {
      window._onBreachDetonation(pos.clone(), fdir.clone());
    }

    _vfxExplode(pos, fdir);
    _playSFX();
    _applyDamage(pos, fdir);
    _spawnSmoke(pos);

    _toast('💥 BREACH!', '#ff6644');
  }

  // ── VFX — flash, debris, smoke ─────────────────────────────────────────────
  function _vfxExplode(pos, fdir) {
    if (!_scene) return;

    // Bright white-orange flash light
    var flash = new THREE.PointLight(0xffaa44, 12, 15);
    flash.position.copy(pos);
    _scene.add(flash);
    var flashCore = new THREE.PointLight(0xffffff, 7, 6);
    flashCore.position.copy(pos);
    _scene.add(flashCore);

    var flashStart = null;
    function fadeFlash(ts) {
      if (!flashStart) flashStart = ts;
      var t = (ts - flashStart) / 400;
      if (t < 1) {
        flash.intensity = 12 * (1 - t);
        flashCore.intensity = 7 * (1 - t);
        requestAnimationFrame(fadeFlash);
      } else {
        if (_scene) { _scene.remove(flash); _scene.remove(flashCore); }
      }
    }
    requestAnimationFrame(fadeFlash);

    // Debris x6 — BoxGeometry(0.3,0.3,0.3) scattered in blast direction
    var debrisMat = new THREE.MeshBasicMaterial({ color: 0x886644 });
    var debrisGeo = new THREE.BoxGeometry(0.3, 0.3, 0.3);
    var debrisList = [];
    var blastAngle = Math.atan2(fdir.x, fdir.z);
    for (var di = 0; di < 6; di++) {
      var d = new THREE.Mesh(debrisGeo, debrisMat);
      var spread = (Math.random() - 0.5) * Math.PI * 0.5; // ±45° spread in blast direction
      var angle  = blastAngle + spread;
      var speed  = 4 + Math.random() * 6;
      d.position.copy(pos);
      d.position.y += 0.1;
      var dvel = {
        x: Math.sin(angle) * speed,
        y: 1.5 + Math.random() * 3,
        z: Math.cos(angle) * speed,
      };
      _scene.add(d);
      debrisList.push({ mesh: d, vel: dvel, life: 1.0 + Math.random() * 0.8 });
    }
    var lastDTs = null;
    function animateDebris(ts) {
      if (!lastDTs) lastDTs = ts;
      var dt = Math.min((ts - lastDTs) / 1000, 0.05);
      lastDTs = ts;
      var any = false;
      for (var i = 0; i < debrisList.length; i++) {
        var p = debrisList[i];
        if (!p || p.life <= 0) continue;
        p.life -= dt;
        p.vel.y -= 9.8 * dt;
        p.mesh.position.x += p.vel.x * dt;
        p.mesh.position.y += p.vel.y * dt;
        p.mesh.position.z += p.vel.z * dt;
        if (p.mesh.position.y < 0.05) { p.mesh.position.y = 0.05; p.vel.y *= -0.2; }
        if (p.life <= 0) {
          if (_scene) _scene.remove(p.mesh);
          debrisList[i] = null;
        } else {
          any = true;
        }
      }
      if (any) {
        requestAnimationFrame(animateDebris);
      } else {
        debrisGeo.dispose();
        debrisMat.dispose();
      }
    }
    requestAnimationFrame(animateDebris);

    // Scorch mark
    var scorchGeo = new THREE.CircleGeometry(1.5, 12);
    var scorchMat = new THREE.MeshBasicMaterial({ color: 0x111111, transparent: true, opacity: 0.65, side: THREE.DoubleSide });
    var scorch = new THREE.Mesh(scorchGeo, scorchMat);
    scorch.rotation.x = -Math.PI / 2;
    scorch.position.copy(pos);
    scorch.position.y = 0.01;
    _scene.add(scorch);
    var scorchStart = null;
    function fadeScorch(ts) {
      if (!scorchStart) scorchStart = ts;
      var t = (ts - scorchStart) / 9000;
      if (t < 1) {
        scorchMat.opacity = 0.65 * (1 - t);
        requestAnimationFrame(fadeScorch);
      } else {
        if (_scene) _scene.remove(scorch);
        scorchGeo.dispose();
        scorchMat.dispose();
      }
    }
    requestAnimationFrame(fadeScorch);
  }

  // ── Smoke fill after explosion ─────────────────────────────────────────────
  function _spawnSmoke(pos) {
    if (!_scene) return;
    var smokeGeo = new THREE.SphereGeometry(1.5, 8, 8);
    var smokeMat = new THREE.MeshBasicMaterial({
      color: 0x888888,
      transparent: true,
      opacity: 0.7,
    });
    var smoke = new THREE.Mesh(smokeGeo, smokeMat);
    smoke.position.copy(pos);
    _scene.add(smoke);

    // Fade out after 4 seconds
    var smokeStart = null;
    function fadeSmoke(ts) {
      if (!smokeStart) smokeStart = ts;
      var t = (ts - smokeStart) / 4000;
      if (t < 1) {
        smokeMat.opacity = 0.7 * (1 - t);
        requestAnimationFrame(fadeSmoke);
      } else {
        if (_scene) _scene.remove(smoke);
        smokeGeo.dispose();
        smokeMat.dispose();
      }
    }
    requestAnimationFrame(fadeSmoke);
  }

  // ── Blast damage ───────────────────────────────────────────────────────────
  function _applyDamage(pos, fdir) {
    var playerPos = null;
    if (typeof player !== 'undefined' && player && player.position) {
      playerPos = player.position;
    }

    // Damage enemies
    var enemies = [];
    if (typeof Enemies !== 'undefined' && Enemies.getAll) {
      enemies = Enemies.getAll();
    } else if (window._enemies && Array.isArray(window._enemies)) {
      enemies = window._enemies;
    }

    for (var ei = 0; ei < enemies.length; ei++) {
      var e = enemies[ei];
      if (!e || e.hp <= 0) continue;
      var ePos = (e.mesh && e.mesh.position) ? e.mesh.position : (e.position || null);
      if (!ePos) continue;
      var dx = ePos.x - pos.x;
      var dy = ePos.y - pos.y;
      var dz = ePos.z - pos.z;
      var dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

      if (_inBlastCone(pos, fdir, ePos, BLAST_CONE_RANGE, BLAST_CONE_RADIUS)) {
        // Stun enemies in cone for 2s
        e._stunTimer = 2.0;
        e._stunned = true;
        if (typeof Enemies !== 'undefined' && Enemies.damage) {
          Enemies.damage(e, BLAST_CONE_DMG);
        } else if (e.hp !== undefined) {
          e.hp = Math.max(0, e.hp - BLAST_CONE_DMG);
        }
      } else if (dist <= BLAST_RADIUS) {
        if (typeof Enemies !== 'undefined' && Enemies.damage) {
          Enemies.damage(e, BLAST_RADIUS_DMG);
        } else if (e.hp !== undefined) {
          e.hp = Math.max(0, e.hp - BLAST_RADIUS_DMG);
        }
      }
    }

    // Stun via Enemies.stunInRadius if available
    if (typeof Enemies !== 'undefined' && Enemies.stunInRadius) {
      Enemies.stunInRadius(pos, BLAST_CONE_RANGE, 2.0);
    }

    // Damage player (0 dmg if behind charge — rear hemisphere)
    if (playerPos) {
      var pdx = playerPos.x - pos.x;
      var pdy = playerPos.y - pos.y;
      var pdz = playerPos.z - pos.z;
      var pdist = Math.sqrt(pdx * pdx + pdy * pdy + pdz * pdz);

      // Dot product of (player - pos) with faceDir: positive = in front, negative = behind
      var dot = pdx * fdir.x + pdy * fdir.y + pdz * fdir.z;
      var behindCharge = dot < 0; // rear hemisphere = protected

      if (!behindCharge) {
        if (_inBlastCone(pos, fdir, playerPos, BLAST_CONE_RANGE, BLAST_CONE_RADIUS)) {
          if (_onHit) _onHit(pos, true);
          else if (typeof player !== 'undefined' && player.hp !== undefined) {
            player.hp = Math.max(0, player.hp - BLAST_CONE_DMG);
            if (typeof HUD !== 'undefined' && HUD.setHealth) HUD.setHealth(player.hp, player.maxHp);
          }
        } else if (pdist <= BLAST_RADIUS) {
          if (_onHit) _onHit(pos, true);
          else if (typeof player !== 'undefined' && player.hp !== undefined) {
            player.hp = Math.max(0, player.hp - BLAST_RADIUS_DMG);
            if (typeof HUD !== 'undefined' && HUD.setHealth) HUD.setHealth(player.hp, player.maxHp);
          }
        }
      }
      // behindCharge == true → 0 damage (protected)
    }
  }

  // Returns true if testPos is within the directional blast cone
  function _inBlastCone(origin, fdir, testPos, depth, radius) {
    var dx = testPos.x - origin.x;
    var dy = testPos.y - origin.y;
    var dz = testPos.z - origin.z;
    // Project onto face direction
    var proj = dx * fdir.x + dy * fdir.y + dz * fdir.z;
    if (proj < 0 || proj > depth) return false;
    // Perpendicular distance from cone axis
    var perpX = dx - proj * fdir.x;
    var perpY = dy - proj * fdir.y;
    var perpZ = dz - proj * fdir.z;
    var perpDist = Math.sqrt(perpX * perpX + perpY * perpY + perpZ * perpZ);
    // Cone widens linearly: at proj=0 → radius=0, at proj=depth → radius=radius
    var coneRadius = (proj / depth) * radius;
    return perpDist <= coneRadius;
  }

  // ── Audio SFX ──────────────────────────────────────────────────────────────
  function _getAudioCtx() {
    var ctx = window._audioCtx;
    if (!ctx) {
      try {
        if (typeof AudioContext !== 'undefined') {
          ctx = new AudioContext();
          window._audioCtx = ctx;
        } else if (typeof webkitAudioContext !== 'undefined') {
          ctx = new webkitAudioContext();  // eslint-disable-line new-cap
          window._audioCtx = ctx;
        }
      } catch (e) {}
    }
    return ctx || null;
  }

  // Tactical "ready" click when arm completes
  function _playArmReady() {
    var ctx = _getAudioCtx();
    if (!ctx) return;
    try {
      var osc = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(1800, ctx.currentTime);
      osc.frequency.setValueAtTime(2400, ctx.currentTime + 0.04);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.1);
    } catch (e) {}
  }

  // High-pitched crack then concussive thud on detonation
  function _playSFX() {
    var ctx = _getAudioCtx();
    if (!ctx) return;
    try {
      // High-pitched crack
      var osc1 = ctx.createOscillator();
      var gain1 = ctx.createGain();
      osc1.type = 'sawtooth';
      osc1.frequency.setValueAtTime(3200, ctx.currentTime);
      osc1.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.08);
      gain1.gain.setValueAtTime(0.6, ctx.currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.09);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start();
      osc1.stop(ctx.currentTime + 0.09);

      // Concussive low thud
      var osc2 = ctx.createOscillator();
      var gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(90, ctx.currentTime + 0.07);
      osc2.frequency.exponentialRampToValueAtTime(14, ctx.currentTime + 0.55);
      gain2.gain.setValueAtTime(0, ctx.currentTime);
      gain2.gain.setValueAtTime(2.2, ctx.currentTime + 0.07);
      gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.55);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(ctx.currentTime);
      osc2.stop(ctx.currentTime + 0.6);

      // Mid-range body
      var osc3 = ctx.createOscillator();
      var gain3 = ctx.createGain();
      osc3.type = 'square';
      osc3.frequency.setValueAtTime(220, ctx.currentTime + 0.07);
      osc3.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.3);
      gain3.gain.setValueAtTime(0, ctx.currentTime);
      gain3.gain.setValueAtTime(0.8, ctx.currentTime + 0.07);
      gain3.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      osc3.connect(gain3);
      gain3.connect(ctx.destination);
      osc3.start(ctx.currentTime);
      osc3.stop(ctx.currentTime + 0.4);
    } catch (e) {}
  }

  // ── Plant a charge ─────────────────────────────────────────────────────────
  function plant() {
    if (!_scene) return;
    if (_chargeCount <= 0) {
      _toast('No breaching charges!', '#ff4444');
      return;
    }
    if (_cooldown > 0) {
      _toast('Breach charge cooling down: ' + Math.ceil(_cooldown) + 's', '#ff8844');
      return;
    }

    // Find wall surface via raycasting
    var hit = _findWallSurface();
    if (!hit) {
      _toast('No surface in range — aim at a wall', '#ff8844');
      return;
    }

    // Build visual mesh
    var built = _buildMesh();
    var group = built.group;

    // Orient the plane to face toward player (surface normal points back toward player)
    // faceDir points AWAY from the wall into the room (blast direction)
    var faceDir = hit.dir.clone().normalize();
    // Align group's +Z to faceDir
    var angle = Math.atan2(faceDir.x, faceDir.z);
    group.rotation.y = angle;
    group.position.copy(hit.pos);
    _scene.add(group);

    _chargeCount--;
    if (_chargeCount <= 0) {
      _cooldown = _COOLDOWN_MAX;
    }

    var charge = {
      group:     group,
      pos:       hit.pos.clone(),
      faceDir:   faceDir,
      ledMesh:   built.ledMesh,
      ledLight:  built.ledLight,
      ledMat:    built.ledMat,
      ledTimer:  0,
      ledOn:     false,
      armed:     false,
      armTimer:  2.0,    // 2s arming animation
      autoTimer: AUTO_DETONATE_SEC,
      detonated: false,
    };

    _charges.push(charge);
    _updateHUD();
    _toast('🧱 Charge planted — arming...', '#ffcc44');
  }

  // ── Manually detonate all armed charges ────────────────────────────────────
  function _detonateAll() {
    var detonatedAny = false;
    for (var i = _charges.length - 1; i >= 0; i--) {
      var ch = _charges[i];
      if (!ch || ch.detonated) continue;
      if (!ch.armed) {
        _toast('Charge still arming!', '#ffcc44');
        continue;
      }
      _detonate(ch);
      detonatedAny = true;
    }
    if (detonatedAny) {
      _cleanupDetonated();
    }
  }

  function _cleanupDetonated() {
    for (var i = _charges.length - 1; i >= 0; i--) {
      if (_charges[i] && _charges[i].detonated) {
        _charges.splice(i, 1);
      }
    }
    _updateHUD();
  }

  // ── Key registration ───────────────────────────────────────────────────────
  function _registerKeys() {
    if (_keysRegistered) return;
    _keysRegistered = true;

    document.addEventListener('keydown', function (e) {
      // Alt+B — plant charge
      if (e.code === 'KeyB' && e.altKey && !e.shiftKey) {
        e.preventDefault();
        plant();
        return;
      }
      // Shift+Alt+B — manual detonate
      if (e.code === 'KeyB' && e.altKey && e.shiftKey) {
        e.preventDefault();
        _detonateAll();
        return;
      }
    });
  }

  // ── Check nearby wall surface for proximity hint ───────────────────────────
  function _checkProximityHint() {
    if (!_camera) return;
    var hit = _findWallSurface();
    _showProximityHint(hit !== null);
  }

  // ── Public: init ───────────────────────────────────────────────────────────
  function init(scene, camera, onHitCb) {
    _scene    = scene   || window.scene  || null;
    _camera   = camera  || window.camera || null;
    _onHit    = onHitCb || null;
    _charges      = [];
    _chargeCount  = _MAX_CHARGES;
    _cooldown     = 0;
    _time         = 0;
    window._breachChargeCount = _chargeCount;
    _ensureHUD();
    _updateHUD();
    _registerKeys();
  }

  // ── Public: update (called each frame by game-manager) ────────────────────
  function update(delta) {
    _time += delta;

    // Tick cooldown
    if (_cooldown > 0) {
      _cooldown -= delta;
      if (_cooldown <= 0) {
        _cooldown = 0;
        _chargeCount = _MAX_CHARGES;
        window._breachChargeCount = _chargeCount;
        _updateHUD();
        _toast('🧱 Breach charges reloaded', '#e05050');
      } else {
        // Update HUD periodically (every ~0.5s) — just update directly
        _updateHUD();
      }
    }

    // Throttle proximity hint check — every ~0.25s
    var hintCheck = Math.floor(_time * 4);
    if (hintCheck !== update._lastHintCheck) {
      update._lastHintCheck = hintCheck;
      _checkProximityHint();
    }

    // Update each planted charge
    for (var i = _charges.length - 1; i >= 0; i--) {
      var ch = _charges[i];
      if (!ch || ch.detonated) {
        _charges.splice(i, 1);
        _updateHUD();
        continue;
      }

      // Arming countdown
      if (!ch.armed) {
        ch.armTimer -= delta;
        // Fast LED blink during arming (5 Hz)
        ch.ledTimer += delta;
        if (ch.ledTimer >= 0.1) {
          ch.ledTimer = 0;
          ch.ledOn = !ch.ledOn;
          if (ch.ledLight)   ch.ledLight.intensity = ch.ledOn ? 0.8 : 0;
          if (ch.ledMat)     ch.ledMat.color.setHex(ch.ledOn ? 0xff2200 : 0x440000);
        }
        if (ch.armTimer <= 0) {
          ch.armed = true;
          // Solid red
          if (ch.ledLight)  ch.ledLight.intensity = 0.8;
          if (ch.ledMat)    ch.ledMat.color.setHex(0xff2200);
          _playArmReady();
          _toast('🧱 Charge ARMED — [Shift+Alt+B] to detonate', '#ff4444');
        }
        continue;
      }

      // Slow LED pulse when armed (1 Hz)
      ch.ledTimer += delta;
      if (ch.ledTimer >= 0.5) {
        ch.ledTimer = 0;
        ch.ledOn = !ch.ledOn;
        if (ch.ledLight) ch.ledLight.intensity = ch.ledOn ? 0.8 : 0.05;
        if (ch.ledMat)   ch.ledMat.color.setHex(ch.ledOn ? 0xff2200 : 0x881100);
      }

      // Auto-detonate after 30 seconds
      ch.autoTimer -= delta;
      if (ch.autoTimer <= 0) {
        _toast('💥 BREACH AUTO-DETONATED!', '#ff2200');
        _detonate(ch);
        _charges.splice(i, 1);
        _updateHUD();
      }
    }
  }
  update._lastHintCheck = -1;

  // ── Public: reset ──────────────────────────────────────────────────────────
  function reset() {
    for (var i = 0; i < _charges.length; i++) {
      var ch = _charges[i];
      if (ch && ch.group && _scene) _scene.remove(ch.group);
    }
    _charges     = [];
    _chargeCount = _MAX_CHARGES;
    _cooldown    = 0;
    _time        = 0;
    window._breachChargeCount = _chargeCount;
    _showProximityHint(false);
    _updateHUD();
  }

  return {
    init:   init,
    update: update,
    plant:  plant,
    reset:  reset,
  };
})();
