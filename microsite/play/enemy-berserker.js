/* ════════════════════════════════════════════════════════════════════
 *  ENEMY BERSERKER — massive mini-boss that charges and smashes player
 *  ─────────────────────────────────────────────────────────────────
 *  Starting wave 6, one berserker spawns per wave.
 *  450 HP, two rage phases, charge attack, ground smash shockwave,
 *  stomp tremors, smoke effects, glowing red eyes.
 *
 *  Public API:
 *    EnemyBerserker.init(scene, camera)  — call once after scene exists
 *    EnemyBerserker.update(delta)        — per-frame (called from game loop)
 *    EnemyBerserker.spawn(x, y, z)      — manually spawn a berserker
 *    EnemyBerserker.reset()             — clear state between stages/waves
 *    EnemyBerserker.takeDamage(amount)  — deal damage to active berserker
 * ════════════════════════════════════════════════════════════════════ */
window.EnemyBerserker = (function () {
  'use strict';

  /* ── internal state ─────────────────────────────────────────────── */
  var _scene  = null;
  var _camera = null;

  var _berserker      = null;   // active berserker object or null
  var _shockwaves     = [];     // active ground-smash shockwave rings
  var _smokeParticles = [];     // shoulder smoke particles
  var _initialized    = false;

  /* ── constants ──────────────────────────────────────────────────── */
  var MAX_HP             = 450;
  var PHASE2_HP          = 225;   // rage threshold
  var SCORE_REWARD       = 1000;

  var WALK_SPEED         = 4;     // phase 1 approach (units/s)
  var RAGE_SPEED         = 7;     // phase 2 movement speed
  var CHARGE_SPEED       = 12;    // charge attack speed
  var CHARGE_RANGE       = 20;    // distance to trigger charge
  var CHARGE_DAMAGE      = 60;
  var CHARGE_DURATION    = 2.0;   // seconds per charge
  var CHARGE_COOLDOWN    = 6.0;

  var PUNCH_RANGE        = 2.5;
  var PUNCH_DAMAGE       = 30;
  var PUNCH_INTERVAL     = 2.0;

  var SMASH_INTERVAL     = 8.0;
  var SMASH_INNER_RADIUS = 5;
  var SMASH_OUTER_RADIUS = 8;
  var SMASH_INNER_DMG    = 45;
  var SMASH_OUTER_DMG    = 25;
  var SMASH_WAVE_SPEED   = 10;    // units/s

  var STOMP_RANGE        = 10;    // camera shake when within this distance
  var STOMP_INTERVAL     = 0.5;   // seconds between stomp shakes

  var SMOKE_MAX          = 12;    // simultaneous shoulder smoke particles

  /* ════════════════════════════════════════════════════════════════
     INIT
  ════════════════════════════════════════════════════════════════ */
  function init(scene, camera) {
    _scene  = scene  || window._gameScene;
    _camera = camera || window._camera;
    _berserker      = null;
    _shockwaves     = [];
    _smokeParticles = [];
    _initialized    = true;
  }

  /* ════════════════════════════════════════════════════════════════
     MESH BUILDER — construct the berserker group
  ════════════════════════════════════════════════════════════════ */
  function _buildMesh() {
    var group = new THREE.Group();

    /* torso — dark red */
    var torsoGeo = new THREE.BoxGeometry(0.8, 1.1, 0.44);
    var torsoMat = new THREE.MeshLambertMaterial({ color: 0x8B0000 });
    var torso    = new THREE.Mesh(torsoGeo, torsoMat);
    torso.position.y = 0.55;
    group.add(torso);

    /* shoulder pads — black, slightly oversized */
    var padGeo = new THREE.BoxGeometry(0.42, 0.28, 0.48);
    var padMat = new THREE.MeshLambertMaterial({ color: 0x111111 });

    var leftPad = new THREE.Mesh(padGeo, padMat);
    leftPad.position.set(-0.58, 0.96, 0);
    group.add(leftPad);

    var rightPad = new THREE.Mesh(padGeo, padMat);
    rightPad.position.set(0.58, 0.96, 0);
    group.add(rightPad);

    /* arms — very thick */
    var armGeo = new THREE.BoxGeometry(0.35, 0.88, 0.36);
    var armMat = new THREE.MeshLambertMaterial({ color: 0x6B0000 });

    var leftArm = new THREE.Mesh(armGeo, armMat);
    leftArm.position.set(-0.68, 0.56, 0);
    group.add(leftArm);

    var rightArm = new THREE.Mesh(armGeo, armMat);
    rightArm.position.set(0.68, 0.56, 0);
    group.add(rightArm);

    /* legs */
    var legGeo = new THREE.BoxGeometry(0.32, 0.72, 0.35);
    var legMat = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });

    var leftLeg = new THREE.Mesh(legGeo, legMat);
    leftLeg.position.set(-0.22, -0.36, 0);
    group.add(leftLeg);

    var rightLeg = new THREE.Mesh(legGeo, legMat);
    rightLeg.position.set(0.22, -0.36, 0);
    group.add(rightLeg);

    /* head — black with red visor slit label */
    var headGeo = new THREE.BoxGeometry(0.5, 0.5, 0.5);
    var headMat = new THREE.MeshLambertMaterial({ color: 0x0a0a0a });
    var head    = new THREE.Mesh(headGeo, headMat);
    head.position.y = 1.35;
    group.add(head);

    /* visor slit — thin red bar across front of head */
    var visorGeo = new THREE.BoxGeometry(0.38, 0.06, 0.02);
    var visorMat = new THREE.MeshBasicMaterial({ color: 0xFF0000 });
    var visor    = new THREE.Mesh(visorGeo, visorMat);
    visor.position.set(0, 1.33, 0.26);
    group.add(visor);

    /* "BRSRKR" canvas label on visor */
    try {
      var canvas = document.createElement('canvas');
      canvas.width  = 128;
      canvas.height = 32;
      var ctx = canvas.getContext('2d');
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, 128, 32);
      ctx.fillStyle = '#FF2222';
      ctx.font = 'bold 18px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('BRSRKR', 64, 16);
      var labelTex = new THREE.CanvasTexture(canvas);
      var labelGeo = new THREE.PlaneGeometry(0.36, 0.09);
      var labelMat = new THREE.MeshBasicMaterial({ map: labelTex, transparent: true, depthWrite: false });
      var label    = new THREE.Mesh(labelGeo, labelMat);
      label.position.set(0, 1.33, 0.275);
      group.add(label);
    } catch (e) { /* canvas not available — skip */ }

    /* glowing red eyes — PointLight */
    var eyeLight = new THREE.PointLight(0xFF0000, 4, 2);
    eyeLight.position.set(0, 1.35, 0.3);
    group.add(eyeLight);

    /* store references for rage-phase changes */
    group.userData.eyeLight  = eyeLight;
    group.userData.leftArm   = leftArm;
    group.userData.rightArm  = rightArm;
    group.userData.leftPad   = leftPad;
    group.userData.rightPad  = rightPad;

    /* scale to 2× regular soldier */
    group.scale.setScalar(2.0);

    return group;
  }

  /* ════════════════════════════════════════════════════════════════
     SPAWN
  ════════════════════════════════════════════════════════════════ */
  function spawn(x, y, z) {
    if (!_scene) {
      _scene  = window._gameScene;
      _camera = window._camera;
    }
    if (!_scene) return;

    /* remove previous berserker if any */
    if (_berserker && _berserker.mesh) {
      _scene.remove(_berserker.mesh);
    }
    _shockwaves.forEach(function (sw) { if (sw.mesh) _scene.remove(sw.mesh); });
    _shockwaves     = [];
    _smokeParticles = [];

    var mesh = _buildMesh();

    /* pick a spawn position near player if not specified */
    if (typeof x !== 'number') {
      var cam = _camera || window._camera;
      if (cam && cam.position) {
        var ang = Math.random() * Math.PI * 2;
        var rad = 18 + Math.random() * 8;
        x = cam.position.x + Math.cos(ang) * rad;
        z = cam.position.z + Math.sin(ang) * rad;
      } else {
        x = (Math.random() - 0.5) * 30;
        z = (Math.random() - 0.5) * 30;
      }
      y = 0;
    }

    mesh.position.set(x, y || 0, z);
    _scene.add(mesh);

    _berserker = {
      mesh:          mesh,
      hp:            MAX_HP,
      alive:         true,
      phase:         1,
      /* movement */
      chargeCooldown: 0,
      charging:       false,
      chargeTimeLeft: 0,
      chargeDir:      new THREE.Vector3(),
      /* attacks */
      punchTimer:    PUNCH_INTERVAL,
      smashTimer:    SMASH_INTERVAL,
      stompTimer:    STOMP_INTERVAL,
      /* animation */
      walkCycle:     0,
      armRaised:     false,
      armRaiseTimer: 0,
    };

    _playRoar();
    _showHUD();

    if (window.HUD && window.HUD.showToast) {
      window.HUD.showToast('BERSERKER INBOUND!');
    }
  }

  /* ════════════════════════════════════════════════════════════════
     UPDATE — called every frame
  ════════════════════════════════════════════════════════════════ */
  function update(delta) {
    if (!_initialized || !_berserker || !_berserker.alive) {
      _updateShockwaves(delta);
      _updateSmoke(delta);
      return;
    }

    /* ensure scene/camera references */
    if (!_scene)  _scene  = window._gameScene;
    if (!_camera) _camera = window._camera;
    if (!_scene || !_camera) return;

    var b   = _berserker;
    var cam = _camera;
    var pos = b.mesh.position;
    var playerPos = cam.position;

    var dx = playerPos.x - pos.x;
    var dz = playerPos.z - pos.z;
    var dist = Math.sqrt(dx * dx + dz * dz);

    /* ── Phase transition ── */
    if (b.phase === 1 && b.hp <= PHASE2_HP) {
      b.phase = 2;
      _enterRage(b);
    }

    /* ── Timers ── */
    b.punchTimer     -= delta;
    b.smashTimer     -= delta;
    b.stompTimer     -= delta;
    if (b.chargeCooldown > 0) b.chargeCooldown -= delta;

    /* ── Ground smash ── */
    if (b.smashTimer <= 0) {
      _groundSmash(b);
      b.smashTimer = SMASH_INTERVAL;
    }

    /* ── Charge attack ── */
    if (b.charging) {
      b.chargeTimeLeft -= delta;
      if (b.chargeTimeLeft <= 0 || dist < 1.2) {
        b.charging = false;
        b.chargeCooldown = CHARGE_COOLDOWN;
        if (dist < 1.5) {
          _damagePlayer(CHARGE_DAMAGE);
          _cameraShake(0.3);
          _playImpact();
        }
      } else {
        pos.x += b.chargeDir.x * CHARGE_SPEED * delta;
        pos.z += b.chargeDir.z * CHARGE_SPEED * delta;
      }
    } else {
      /* ── Decide whether to charge ── */
      if (dist < CHARGE_RANGE && b.chargeCooldown <= 0 && !b.armRaised) {
        b.charging      = true;
        b.chargeTimeLeft = CHARGE_DURATION;
        var len = Math.max(0.001, Math.sqrt(dx * dx + dz * dz));
        b.chargeDir.set(dx / len, 0, dz / len);
        _playImpact();
      } else {
        /* Normal approach */
        var speed = (b.phase === 2) ? RAGE_SPEED : WALK_SPEED;
        if (dist > 1.5) {
          var len2 = Math.max(0.001, dist);
          pos.x += (dx / len2) * speed * delta;
          pos.z += (dz / len2) * speed * delta;
        }

        /* ── Stomp tremor ── */
        if (b.stompTimer <= 0) {
          b.stompTimer = STOMP_INTERVAL;
          if (dist < STOMP_RANGE) {
            _cameraShake(0.06);
            _playFootstep();
          }
        }

        /* ── Punch ── */
        if (b.punchTimer <= 0 && dist < PUNCH_RANGE && !b.armRaised) {
          _damagePlayer(PUNCH_DAMAGE);
          _cameraShake(0.15);
          b.punchTimer = PUNCH_INTERVAL;
        }
      }
    }

    /* ── Face player ── */
    b.mesh.rotation.y = Math.atan2(dx, dz);

    /* ── Walk cycle animation ── */
    b.walkCycle += delta * (b.charging ? 8 : (b.phase === 2 ? 5 : 3));
    var legSwing = Math.sin(b.walkCycle) * 0.4;
    if (b.mesh.userData.leftArm)  b.mesh.userData.leftArm.rotation.x  =  legSwing;
    if (b.mesh.userData.rightArm) b.mesh.userData.rightArm.rotation.x = -legSwing;

    /* ── Arm-raise animation for smash telegraph ── */
    if (b.armRaised) {
      b.armRaiseTimer -= delta;
      if (b.armRaiseTimer <= 0) {
        b.armRaised = false;
        if (b.mesh.userData.leftArm)  b.mesh.userData.leftArm.rotation.x  = 0;
        if (b.mesh.userData.rightArm) b.mesh.userData.rightArm.rotation.x = 0;
      }
    }

    /* ── Emit shoulder smoke ── */
    _emitSmoke(b, delta);

    _updateShockwaves(delta);
    _updateSmoke(delta);
  }

  /* ════════════════════════════════════════════════════════════════
     RAGE PHASE 2
  ════════════════════════════════════════════════════════════════ */
  function _enterRage(b) {
    /* boost eye brightness */
    if (b.mesh.userData.eyeLight) {
      b.mesh.userData.eyeLight.intensity = 8;
      b.mesh.userData.eyeLight.color.setHex(0xFF2200);
    }
    _playRoar();
    if (window.HUD && window.HUD.showToast) {
      window.HUD.showToast('BERSERKER IS ENRAGED!');
    }
  }

  /* ════════════════════════════════════════════════════════════════
     GROUND SMASH
  ════════════════════════════════════════════════════════════════ */
  function _groundSmash(b) {
    if (!_scene) return;

    /* telegraph: raise arms */
    b.armRaised     = true;
    b.armRaiseTimer = 0.6;
    if (b.mesh.userData.leftArm) {
      b.mesh.userData.leftArm.rotation.x  = -Math.PI * 0.8;
    }
    if (b.mesh.userData.rightArm) {
      b.mesh.userData.rightArm.rotation.x = -Math.PI * 0.8;
    }

    /* shockwave ring — expands outward */
    var ringGeo = new THREE.RingGeometry(0.2, 0.5, 32);
    var ringMat = new THREE.MeshBasicMaterial({
      color: 0xFF4400, transparent: true, opacity: 0.85,
      side: THREE.DoubleSide, depthWrite: false
    });
    var ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(b.mesh.position.x, 0.12, b.mesh.position.z);
    _scene.add(ring);

    _shockwaves.push({
      mesh:       ring,
      mat:        ringMat,
      radius:     0.2,
      originX:    b.mesh.position.x,
      originZ:    b.mesh.position.z,
      life:       0,
      maxLife:    (SMASH_OUTER_RADIUS / SMASH_WAVE_SPEED) * 1.3,
      damaged:    false,
    });

    _playImpact();
    _cameraShake(0.25);

    /* check player damage immediately at smash origin (point-blank) */
    _applySmashDamage(b.mesh.position.x, b.mesh.position.z);
  }

  function _applySmashDamage(ox, oz) {
    var cam = _camera || window._camera;
    if (!cam) return;
    var px = cam.position.x;
    var pz = cam.position.z;
    var d  = Math.sqrt((px - ox) * (px - ox) + (pz - oz) * (pz - oz));
    if (d < SMASH_INNER_RADIUS) {
      _damagePlayer(SMASH_INNER_DMG);
      _cameraShake(0.2);
    } else if (d < SMASH_OUTER_RADIUS) {
      _damagePlayer(SMASH_OUTER_DMG);
      _cameraShake(0.1);
    }
  }

  function _updateShockwaves(delta) {
    if (!_scene) return;
    for (var i = _shockwaves.length - 1; i >= 0; i--) {
      var sw = _shockwaves[i];
      sw.life += delta;
      sw.radius += SMASH_WAVE_SPEED * delta;

      /* scale ring outward */
      var s = sw.radius / 0.35;
      sw.mesh.scale.setScalar(s);
      sw.mat.opacity = Math.max(0, 0.85 * (1 - sw.life / sw.maxLife));

      /* damage player as wave passes */
      if (!sw.damaged) {
        var cam = _camera || window._camera;
        if (cam) {
          var px = cam.position.x;
          var pz = cam.position.z;
          var d  = Math.sqrt((px - sw.originX) * (px - sw.originX) + (pz - sw.originZ) * (pz - sw.originZ));
          if (sw.radius >= d - 0.8 && sw.radius <= d + 0.8) {
            sw.damaged = true;
            if (d < SMASH_INNER_RADIUS) {
              _damagePlayer(SMASH_INNER_DMG);
              _cameraShake(0.2);
            } else if (d < SMASH_OUTER_RADIUS) {
              _damagePlayer(SMASH_OUTER_DMG);
              _cameraShake(0.1);
            }
          }
        }
      }

      if (sw.life >= sw.maxLife) {
        _scene.remove(sw.mesh);
        _shockwaves.splice(i, 1);
      }
    }
  }

  /* ════════════════════════════════════════════════════════════════
     SHOULDER SMOKE
  ════════════════════════════════════════════════════════════════ */
  function _emitSmoke(b, delta) {
    if (!_scene) return;
    if (_smokeParticles.length >= SMOKE_MAX) return;

    /* emit one particle per call from each shoulder */
    var offsets = [
      { x: -0.7, y: 1.05, z: 0 },
      { x:  0.7, y: 1.05, z: 0 },
    ];

    for (var s = 0; s < offsets.length; s++) {
      var off = offsets[s];
      /* world position: berserker position + rotated offset */
      var ry   = b.mesh.rotation.y;
      var wx   = b.mesh.position.x + off.x * Math.cos(ry) - off.z * Math.sin(ry);
      var wy   = b.mesh.position.y + off.y * 2.0;   /* scale 2× */
      var wz   = b.mesh.position.z + off.x * Math.sin(ry) + off.z * Math.cos(ry);

      var geo = new THREE.BoxGeometry(0.1, 0.1, 0.1);
      var mat = new THREE.MeshBasicMaterial({
        color: 0x888888, transparent: true, opacity: 0.6, depthWrite: false
      });
      var pMesh = new THREE.Mesh(geo, mat);
      pMesh.position.set(wx, wy, wz);
      _scene.add(pMesh);

      _smokeParticles.push({
        mesh: pMesh,
        mat:  mat,
        vx:   (Math.random() - 0.5) * 0.8,
        vy:   0.8 + Math.random() * 0.6,
        vz:   (Math.random() - 0.5) * 0.8,
        life: 0,
        maxLife: 1.2 + Math.random() * 0.8,
      });
    }
  }

  function _updateSmoke(delta) {
    if (!_scene) return;
    for (var i = _smokeParticles.length - 1; i >= 0; i--) {
      var p = _smokeParticles[i];
      p.life += delta;
      p.mesh.position.x += p.vx * delta;
      p.mesh.position.y += p.vy * delta;
      p.mesh.position.z += p.vz * delta;
      p.mat.opacity = Math.max(0, 0.6 * (1 - p.life / p.maxLife));
      p.mesh.scale.setScalar(1 + p.life * 1.5);

      if (p.life >= p.maxLife) {
        _scene.remove(p.mesh);
        _smokeParticles.splice(i, 1);
      }
    }
  }

  /* ════════════════════════════════════════════════════════════════
     TAKE DAMAGE (public)
  ════════════════════════════════════════════════════════════════ */
  function takeDamage(amount) {
    if (!_berserker || !_berserker.alive) return;
    _berserker.hp -= amount;
    if (_berserker.hp <= 0) {
      _berserker.hp = 0;
      _die();
    }
  }

  /* ════════════════════════════════════════════════════════════════
     DEATH
  ════════════════════════════════════════════════════════════════ */
  function _die() {
    if (!_berserker) return;
    var b = _berserker;
    b.alive = false;

    var pos = b.mesh.position.clone();

    /* big explosion effect */
    _bigExplosion(pos);

    /* remove mesh */
    if (_scene && b.mesh) _scene.remove(b.mesh);

    /* score */
    if (window.player && window.player.score !== undefined) {
      window.player.score += SCORE_REWARD;
    }

    /* toast */
    if (window.HUD && window.HUD.showToast) {
      window.HUD.showToast('BERSERKER ELIMINATED!');
    }

    /* drop armor pickup */
    _dropArmor(pos);

    /* camera shake */
    _cameraShake(0.5);

    _berserker = null;
    _hideHUD();
  }

  function _bigExplosion(pos) {
    if (!_scene) return;

    var flashGeo = new THREE.SphereGeometry(2.5, 12, 8);
    var flashMat = new THREE.MeshBasicMaterial({
      color: 0xFF6600, transparent: true, opacity: 0.95, depthWrite: false
    });
    var flash = new THREE.Mesh(flashGeo, flashMat);
    flash.position.copy(pos);
    flash.position.y += 1.5;
    _scene.add(flash);

    var smokeGeo = new THREE.CylinderGeometry(1.2, 0.6, 8, 8);
    var smokeMat = new THREE.MeshBasicMaterial({
      color: 0x222222, transparent: true, opacity: 0.75, depthWrite: false
    });
    var smoke = new THREE.Mesh(smokeGeo, smokeMat);
    smoke.position.copy(pos);
    smoke.position.y += 4;
    _scene.add(smoke);

    /* auto-fade both */
    var life     = 0;
    var maxLife  = 2.5;
    var startFl  = 0.95;
    var startSm  = 0.75;

    function _fade() {
      life += 0.016;
      var k = life / maxLife;
      flash.scale.setScalar(1 + k * 2.5);
      flashMat.opacity = Math.max(0, startFl * (1 - k * 1.2));
      smoke.position.y += 0.08;
      smokeMat.opacity  = Math.max(0, startSm * (1 - k));
      if (life < maxLife) {
        requestAnimationFrame(_fade);
      } else {
        if (_scene) {
          _scene.remove(flash);
          _scene.remove(smoke);
        }
      }
    }
    requestAnimationFrame(_fade);

    _playImpact();
  }

  function _dropArmor(pos) {
    if (typeof window.Pickups !== 'undefined' && window.Pickups.spawnPickup) {
      try {
        window.Pickups.spawnPickup('armor', pos.x, pos.y, pos.z);
      } catch (e) {}
      return;
    }
    /* fallback: spawn a visible blue cube as armor drop */
    if (!_scene) return;
    var geo = new THREE.BoxGeometry(0.5, 0.5, 0.5);
    var mat = new THREE.MeshLambertMaterial({ color: 0x4488FF });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(pos.x, pos.y + 0.3, pos.z);
    _scene.add(mesh);
  }

  /* ════════════════════════════════════════════════════════════════
     PLAYER HELPERS
  ════════════════════════════════════════════════════════════════ */
  function _damagePlayer(dmg) {
    if (window.player && window.player.health !== undefined) {
      window.player.health -= dmg;
    }
    if (window.HUD && window.HUD.showDamageFlash) {
      window.HUD.showDamageFlash(0xff0000, 0.4);
    }
  }

  function _cameraShake(amount) {
    var cam = _camera || window._camera;
    if (!cam) return;
    cam.position.x += (Math.random() - 0.5) * amount * 0.3;
    cam.position.y += (Math.random() - 0.5) * amount * 0.15;
  }

  /* ════════════════════════════════════════════════════════════════
     AUDIO
  ════════════════════════════════════════════════════════════════ */
  function _getAudioCtx() {
    return window._audioCtx || (function () {
      try {
        var Ctx = window.AudioContext || window.webkitAudioContext;
        if (!Ctx) return null;
        var ctx = new Ctx();
        window._audioCtx = ctx;
        return ctx;
      } catch (e) { return null; }
    })();
  }

  function _playRoar() {
    var ctx = _getAudioCtx();
    if (!ctx) return;
    try {
      var osc  = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type            = 'sawtooth';
      osc.frequency.value = 60;
      gain.gain.setValueAtTime(0.4, ctx.currentTime);
      osc.frequency.setValueAtTime(60, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(25, ctx.currentTime + 0.8);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.9);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.9);
    } catch (e) {}
  }

  function _playFootstep() {
    var ctx = _getAudioCtx();
    if (!ctx) return;
    try {
      var buf    = ctx.createBuffer(1, ctx.sampleRate * 0.15, ctx.sampleRate);
      var data   = buf.getChannelData(0);
      for (var i = 0; i < data.length; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.04));
      }
      var src    = ctx.createBufferSource();
      var gain   = ctx.createGain();
      src.buffer = buf;
      var filt   = ctx.createBiquadFilter();
      filt.type  = 'lowpass';
      filt.frequency.value = 200;
      src.connect(filt);
      filt.connect(gain);
      gain.connect(ctx.destination);
      gain.gain.value = 0.35;
      src.start(ctx.currentTime);
    } catch (e) {}
  }

  function _playImpact() {
    var ctx = _getAudioCtx();
    if (!ctx) return;
    try {
      var buf  = ctx.createBuffer(1, ctx.sampleRate * 0.25, ctx.sampleRate);
      var data = buf.getChannelData(0);
      for (var i = 0; i < data.length; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.06));
      }
      var src    = ctx.createBufferSource();
      var gain   = ctx.createGain();
      src.buffer = buf;
      var filt   = ctx.createBiquadFilter();
      filt.type  = 'lowpass';
      filt.frequency.value = 120;
      src.connect(filt);
      filt.connect(gain);
      gain.connect(ctx.destination);
      gain.gain.value = 0.55;
      src.start(ctx.currentTime);
    } catch (e) {}
  }

  /* ════════════════════════════════════════════════════════════════
     HUD — HP bar overlay
  ════════════════════════════════════════════════════════════════ */
  var _hudEl = null;

  function _showHUD() {
    if (typeof document === 'undefined') return;
    if (!_hudEl) {
      _hudEl = document.createElement('div');
      _hudEl.id = 'hud-berserker-bar';
      _hudEl.style.cssText = [
        'position:fixed',
        'bottom:30px',
        'left:50%',
        'transform:translateX(-50%)',
        'z-index:8500',
        'font-family:monospace',
        'font-size:12px',
        'color:#ff4444',
        'text-align:center',
        'pointer-events:none',
        'text-shadow:0 0 6px #ff0000',
      ].join(';');
      document.body.appendChild(_hudEl);
    }
    _hudEl.style.display = 'block';
    _updateHUD();
  }

  function _updateHUD() {
    if (!_hudEl || !_berserker) return;
    var pct = Math.max(0, (_berserker.hp / MAX_HP) * 100);
    var bar = '';
    var filled = Math.round(pct / 5);
    for (var i = 0; i < 20; i++) bar += (i < filled ? '█' : '░');
    _hudEl.innerHTML = 'BERSERKER  [' + bar + ']  ' + _berserker.hp + ' / ' + MAX_HP + ' HP';
  }

  function _hideHUD() {
    if (_hudEl) _hudEl.style.display = 'none';
  }

  /* ════════════════════════════════════════════════════════════════
     RESET
  ════════════════════════════════════════════════════════════════ */
  function reset() {
    if (_berserker && _berserker.mesh && _scene) {
      _scene.remove(_berserker.mesh);
    }
    _berserker = null;

    _shockwaves.forEach(function (sw) { if (_scene && sw.mesh) _scene.remove(sw.mesh); });
    _shockwaves = [];

    _smokeParticles.forEach(function (p) { if (_scene && p.mesh) _scene.remove(p.mesh); });
    _smokeParticles = [];

    _hideHUD();
  }

  /* ════════════════════════════════════════════════════════════════
     WAVE INTEGRATION — hook into GameManager wave events if available
  ════════════════════════════════════════════════════════════════ */
  (function _hookWaveEvents() {
    var _prevWave = 0;

    function _checkWave() {
      var gm = window.GameManager;
      if (!gm) return;
      var wave = (gm.getWave && gm.getWave()) ||
                 (gm.wave)                     ||
                 0;
      if (wave >= 6 && wave !== _prevWave) {
        _prevWave = wave;
        /* small delay so the scene is fully ready */
        setTimeout(function () {
          if (!_berserker || !_berserker.alive) {
            spawn();
          }
        }, 2000);
      }
    }

    /* poll every 5 seconds (lightweight) */
    setInterval(_checkWave, 5000);
  })();

  /* ════════════════════════════════════════════════════════════════
     PUBLIC API
  ════════════════════════════════════════════════════════════════ */
  return {
    init:       init,
    update:     update,
    spawn:      spawn,
    reset:      reset,
    takeDamage: takeDamage,
  };

})();
