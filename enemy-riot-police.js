/* ════════════════════════════════════════════════════════════════════
 *  ENEMY RIOT POLICE — armored officer with riot shield who advances on player
 *  ─────────────────────────────────────────────────────────────────
 *  Starting wave 5, riot police spawn in groups of 2-3.
 *  150 HP, 200 shield HP, medium speed 2.5 u/s.
 *  Shield blocks 90% dmg from front, 40% from sides, 0% from behind.
 *  Gas/explosives bypass shield completely.
 *  Shield bash at 4 units (20 dmg, 2s cooldown).
 *  Baton strike at 2 units (30 dmg, 1s cooldown).
 *  Formation: spread 3 units apart, advance in a line.
 *  Score: +200 on kill, +100 bonus for killing while shield still up.
 *
 *  Public API:
 *    EnemyRiotPolice.init(scene, camera)  — call once after scene exists
 *    EnemyRiotPolice.update(delta)        — per-frame (called from game loop)
 *    EnemyRiotPolice.spawn(x, y, z)      — spawn one officer
 *    EnemyRiotPolice.reset()             — clear state between stages/waves
 * ════════════════════════════════════════════════════════════════════ */
window.EnemyRiotPolice = (function () {
  'use strict';

  /* ── internal state ─────────────────────────────────────────────── */
  var _scene    = null;
  var _camera   = null;
  var _audioCtx = null;

  window._riotPoliceEnemies = [];

  /* ── constants ──────────────────────────────────────────────────── */
  var MAX_HP           = 150;
  var SHIELD_HP        = 200;
  var WALK_SPEED       = 2.5;
  var RAGE_SPEED       = 4.5;    /* speed after shield breaks */
  var SCORE_KILL       = 200;
  var SCORE_HEADSHOT   = 100;    /* bonus for killing while shield still up */

  var BASH_RANGE       = 4;
  var BASH_DAMAGE      = 20;
  var BASH_COOLDOWN    = 2.0;
  var BASH_PUSH        = 3.0;

  var BATON_RANGE      = 2;
  var BATON_DAMAGE     = 30;
  var BATON_COOLDOWN   = 1.0;

  var FORM_SPREAD      = 3.0;    /* formation spread distance */
  var TOAST_RANGE      = 30;     /* show toast when spawned within this distance */

  /* ════════════════════════════════════════════════════════════════
     AUDIO
  ════════════════════════════════════════════════════════════════ */
  function _getAudioCtx() {
    if (!_audioCtx) {
      try {
        _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      } catch (e) {}
    }
    return _audioCtx;
  }

  function _playClank() {
    var ctx = _getAudioCtx();
    if (!ctx) return;
    try {
      var osc  = ctx.createOscillator();
      var osc2 = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.type  = 'square';
      osc.frequency.setValueAtTime(180, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(60, ctx.currentTime + 0.12);
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(340, ctx.currentTime);
      gain.gain.setValueAtTime(0.35, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
      osc.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime);
      osc2.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.18);
      osc2.stop(ctx.currentTime + 0.18);
    } catch (e) {}
  }

  function _playBatonSwing() {
    var ctx = _getAudioCtx();
    if (!ctx) return;
    try {
      var buf  = ctx.createBuffer(1, ctx.sampleRate * 0.1, ctx.sampleRate);
      var data = buf.getChannelData(0);
      var i;
      for (i = 0; i < data.length; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.03));
      }
      var src  = ctx.createBufferSource();
      var gain = ctx.createGain();
      var filt = ctx.createBiquadFilter();
      src.buffer = buf;
      filt.type  = 'bandpass';
      filt.frequency.value = 800;
      filt.Q.value = 2;
      src.connect(filt);
      filt.connect(gain);
      gain.connect(ctx.destination);
      gain.gain.value = 0.4;
      src.start(ctx.currentTime);
    } catch (e) {}
  }

  function _playShieldShatter() {
    var ctx = _getAudioCtx();
    if (!ctx) return;
    try {
      var buf  = ctx.createBuffer(1, ctx.sampleRate * 0.5, ctx.sampleRate);
      var data = buf.getChannelData(0);
      var i;
      for (i = 0; i < data.length; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.12));
      }
      var src  = ctx.createBufferSource();
      var gain = ctx.createGain();
      var filt = ctx.createBiquadFilter();
      src.buffer = buf;
      filt.type  = 'highpass';
      filt.frequency.value = 1200;
      src.connect(filt);
      filt.connect(gain);
      gain.connect(ctx.destination);
      gain.gain.value = 0.6;
      src.start(ctx.currentTime);
    } catch (e) {}
  }

  /* ════════════════════════════════════════════════════════════════
     MESH BUILDER
  ════════════════════════════════════════════════════════════════ */
  function _buildMesh() {
    var group = new THREE.Group();

    /* torso — dark blue */
    var torsoGeo = new THREE.BoxGeometry(0.5, 0.7, 0.28);
    var torsoMat = new THREE.MeshLambertMaterial({ color: 0x1A1A4A });
    var torso    = new THREE.Mesh(torsoGeo, torsoMat);
    torso.position.y = 0.35;
    group.add(torso);

    /* chest armor plate — slightly lighter blue */
    var plateGeo = new THREE.BoxGeometry(0.44, 0.5, 0.06);
    var plateMat = new THREE.MeshLambertMaterial({ color: 0x22227A });
    var plate    = new THREE.Mesh(plateGeo, plateMat);
    plate.position.set(0, 0.38, 0.17);
    group.add(plate);

    /* legs */
    var legGeo = new THREE.BoxGeometry(0.18, 0.55, 0.2);
    var legMat = new THREE.MeshLambertMaterial({ color: 0x111133 });

    var leftLeg = new THREE.Mesh(legGeo, legMat);
    leftLeg.position.set(-0.14, -0.27, 0);
    group.add(leftLeg);

    var rightLeg = new THREE.Mesh(legGeo, legMat);
    rightLeg.position.set(0.14, -0.27, 0);
    group.add(rightLeg);

    /* boots */
    var bootGeo = new THREE.BoxGeometry(0.2, 0.14, 0.24);
    var bootMat = new THREE.MeshLambertMaterial({ color: 0x0A0A0A });

    var leftBoot = new THREE.Mesh(bootGeo, bootMat);
    leftBoot.position.set(-0.14, -0.58, 0.02);
    group.add(leftBoot);

    var rightBoot = new THREE.Mesh(bootGeo, bootMat);
    rightBoot.position.set(0.14, -0.58, 0.02);
    group.add(rightBoot);

    /* arms */
    var armGeo = new THREE.BoxGeometry(0.16, 0.5, 0.18);
    var armMat = new THREE.MeshLambertMaterial({ color: 0x1A1A4A });

    /* right arm holds baton — starts at side */
    var rightArm = new THREE.Mesh(armGeo, armMat);
    rightArm.position.set(0.35, 0.2, 0);
    group.add(rightArm);

    /* baton */
    var batonGeo = new THREE.BoxGeometry(0.05, 0.45, 0.05);
    var batonMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
    var baton    = new THREE.Mesh(batonGeo, batonMat);
    baton.position.set(0.35, -0.12, 0);
    group.add(baton);

    /* left arm — holds shield in front */
    var leftArm = new THREE.Mesh(armGeo, armMat);
    leftArm.position.set(-0.25, 0.2, 0.18);
    leftArm.rotation.x = -0.3;
    group.add(leftArm);

    /* helmet — black with visor */
    var helmGeo = new THREE.BoxGeometry(0.3, 0.35, 0.32);
    var helmMat = new THREE.MeshLambertMaterial({ color: 0x0A0A0A });
    var helm    = new THREE.Mesh(helmGeo, helmMat);
    helm.position.y = 0.93;
    group.add(helm);

    /* visor — dark tinted semi-transparent */
    var visorGeo = new THREE.BoxGeometry(0.24, 0.12, 0.04);
    var visorMat = new THREE.MeshPhongMaterial({
      color:       0x001133,
      transparent: true,
      opacity:     0.75,
      shininess:   120,
      specular:    0x4488FF
    });
    var visor = new THREE.Mesh(visorGeo, visorMat);
    visor.position.set(0, 0.9, 0.18);
    group.add(visor);

    /* riot shield — held slightly in front and to the left */
    var shieldGeo = new THREE.BoxGeometry(0.5, 1.0, 0.05);
    var shieldMat = new THREE.MeshPhongMaterial({
      color:       0x4488FF,
      transparent: true,
      opacity:     0.65,
      shininess:   80,
      specular:    0xAADDFF,
      side:        THREE.DoubleSide
    });
    var shieldMesh = new THREE.Mesh(shieldGeo, shieldMat);
    shieldMesh.position.set(-0.1, 0.3, 0.38);
    group.add(shieldMesh);

    /* shield blue rim light */
    var shieldLight = new THREE.PointLight(0x4488FF, 1.2, 2);
    shieldLight.position.set(-0.1, 0.3, 0.5);
    group.add(shieldLight);

    /* store refs */
    group.userData.shieldMesh  = shieldMesh;
    group.userData.shieldMat   = shieldMat;
    group.userData.shieldLight = shieldLight;
    group.userData.rightArm    = rightArm;
    group.userData.baton       = baton;
    group.userData.visor       = visor;
    group.userData.leftArm     = leftArm;

    return group;
  }

  /* ════════════════════════════════════════════════════════════════
     SHIELD SHATTER PARTICLES
  ════════════════════════════════════════════════════════════════ */
  function _shatterShield(enemy) {
    if (!_scene || !enemy.shieldMesh) return;

    /* remove shield from group */
    enemy.group.remove(enemy.shieldMesh);
    var worldPos = new THREE.Vector3();
    enemy.shieldMesh.getWorldPosition(worldPos);

    /* remove shield light */
    if (enemy.shieldLight) {
      enemy.group.remove(enemy.shieldLight);
      enemy.shieldLight = null;
    }

    enemy.shieldMesh = null;
    enemy.shieldBroken = true;
    enemy.shieldHP = 0;
    enemy.speed = RAGE_SPEED;  /* rage speed after shield breaks */

    _playShieldShatter();

    /* spawn blue glass shatter particles */
    var fragments = [];
    var i;
    for (i = 0; i < 10; i++) {
      var geo = new THREE.PlaneGeometry(0.08 + Math.random() * 0.14, 0.08 + Math.random() * 0.14);
      var mat = new THREE.MeshBasicMaterial({
        color:       0x4488FF,
        transparent: true,
        opacity:     0.85,
        side:        THREE.DoubleSide,
        depthWrite:  false
      });
      var frag = new THREE.Mesh(geo, mat);
      frag.position.copy(worldPos);
      frag.position.x += (Math.random() - 0.5) * 0.5;
      frag.position.y += Math.random() * 1.0;
      frag.position.z += (Math.random() - 0.5) * 0.3;
      frag._vel = new THREE.Vector3(
        (Math.random() - 0.5) * 4,
        Math.random() * 3 + 1,
        (Math.random() - 0.5) * 3
      );
      frag._rot = new THREE.Vector3(
        (Math.random() - 0.5) * 8,
        (Math.random() - 0.5) * 8,
        (Math.random() - 0.5) * 8
      );
      frag._age = 0;
      _scene.add(frag);
      fragments.push(frag);
    }
    enemy.shieldFragments = fragments;

    /* brief blue flash */
    var light = new THREE.PointLight(0x4488FF, 5, 5);
    light.position.copy(worldPos);
    _scene.add(light);
    setTimeout(function () { if (_scene) _scene.remove(light); }, 120);

    /* toast */
    if (window.HUD && window.HUD.showToast) {
      window.HUD.showToast('SHIELD BROKEN — ENEMY ENRAGED!');
    }
  }

  function _updateShieldFragments(enemy, dt) {
    if (!enemy.shieldFragments || enemy.shieldFragments.length === 0) return;
    var i;
    for (i = enemy.shieldFragments.length - 1; i >= 0; i--) {
      var frag = enemy.shieldFragments[i];
      frag._age += dt;
      frag.position.x += frag._vel.x * dt;
      frag.position.y += frag._vel.y * dt;
      frag.position.z += frag._vel.z * dt;
      frag._vel.y -= 6 * dt;
      frag.rotation.x += frag._rot.x * dt;
      frag.rotation.y += frag._rot.y * dt;
      frag.rotation.z += frag._rot.z * dt;
      frag.material.opacity = Math.max(0, 0.85 - frag._age / 1.2);
      if (frag._age > 1.2) {
        if (_scene) _scene.remove(frag);
        enemy.shieldFragments.splice(i, 1);
      }
    }
  }

  /* ════════════════════════════════════════════════════════════════
     DAMAGE DIRECTION CHECK
  ════════════════════════════════════════════════════════════════ */
  /* Returns: 'front', 'side', or 'back' relative to enemy facing */
  function _getDamageDirection(enemy, playerPos) {
    var ex = enemy.group.position.x;
    var ez = enemy.group.position.z;
    var dx = playerPos.x - ex;
    var dz = playerPos.z - ez;
    var len = Math.sqrt(dx * dx + dz * dz) || 1;
    var toPlayerX = dx / len;
    var toPlayerZ = dz / len;
    /* enemy forward direction (facing toward player by default) */
    var fwdX = Math.sin(enemy.group.rotation.y);
    var fwdZ = Math.cos(enemy.group.rotation.y);
    /* dot product: 1=front, -1=back */
    var dot = fwdX * toPlayerX + fwdZ * toPlayerZ;
    if (dot > 0.0) return 'front';   /* front hemisphere (>90 deg) */
    var cross = fwdX * toPlayerZ - fwdZ * toPlayerX;
    if (Math.abs(cross) > 0.5) return 'side';
    return 'back';
  }

  /* ════════════════════════════════════════════════════════════════
     TAKE DAMAGE (public, accepts enemy obj + optional flags)
  ════════════════════════════════════════════════════════════════ */
  function _applyDamageToEnemy(enemy, amount, playerPos, opts) {
    if (enemy.dead) return;

    opts = opts || {};
    var bypassShield = opts.gas || opts.explosive;
    var finalAmount  = amount;

    if (!bypassShield && !enemy.shieldBroken && playerPos) {
      var dir = _getDamageDirection(enemy, playerPos);
      if (dir === 'front') {
        finalAmount = amount * 0.10;   /* 90% reduction */
        /* still damage shield */
        enemy.shieldHP -= amount;
        if (enemy.shieldMesh) {
          /* flash shield on hit */
          enemy.shieldMesh.material.opacity = 0.95;
          setTimeout(function () {
            if (enemy.shieldMesh) enemy.shieldMesh.material.opacity = 0.65;
          }, 80);
          _playClank();
        }
        if (enemy.shieldHP <= 0) {
          _shatterShield(enemy);
        }
      } else if (dir === 'side') {
        finalAmount = amount * 0.60;   /* 40% reduction */
      }
      /* back: no reduction, falls through */
    }

    enemy.hp -= finalAmount;
    if (enemy.hp <= 0) {
      _killEnemy(enemy);
    }
  }

  /* ════════════════════════════════════════════════════════════════
     KILL
  ════════════════════════════════════════════════════════════════ */
  function _killEnemy(enemy) {
    if (enemy.dead) return;
    enemy.dead      = true;
    enemy.deathTimer = 0;

    /* score */
    var score = SCORE_KILL;
    if (!enemy.shieldBroken) {
      score += SCORE_HEADSHOT;  /* killed while shield still up = headshot bonus */
    }
    if (window.GameManager && window.GameManager.addScore) {
      window.GameManager.addScore(score);
    } else if (window.player) {
      window.player.score = (window.player.score || 0) + score;
    }
  }

  /* ════════════════════════════════════════════════════════════════
     DEATH COLLAPSE ANIMATION
  ════════════════════════════════════════════════════════════════ */
  function _doDeathCollapse(enemy, dt) {
    enemy.deathTimer += dt;
    var t = Math.min(enemy.deathTimer / 0.8, 1);
    enemy.group.rotation.x = t * (Math.PI / 2);
    enemy.group.position.y = -t * 0.4;

    if (enemy.deathTimer > 1.4) {
      _removeEnemy(enemy);
    }
  }

  function _removeEnemy(enemy) {
    if (_scene) _scene.remove(enemy.group);
    var idx = window._riotPoliceEnemies.indexOf(enemy);
    if (idx !== -1) window._riotPoliceEnemies.splice(idx, 1);
  }

  /* ════════════════════════════════════════════════════════════════
     PLAYER HELPERS
  ════════════════════════════════════════════════════════════════ */
  function _damagePlayer(dmg) {
    if (window.GameManager && window.GameManager.takeDamage) {
      window.GameManager.takeDamage(dmg);
    } else if (window.player && window.player.health !== undefined) {
      window.player.health -= dmg;
    }
    if (window.HUD && window.HUD.showDamageFlash) {
      window.HUD.showDamageFlash(0xff0000, 0.5);
    }
  }

  function _pushPlayer(enemy, playerPos, pushDist) {
    var dx = playerPos.x - enemy.group.position.x;
    var dz = playerPos.z - enemy.group.position.z;
    var dist = Math.sqrt(dx * dx + dz * dz) || 1;
    var cam = _camera || window._camera;
    if (cam && cam.position) {
      cam.position.x += (dx / dist) * pushDist;
      cam.position.z += (dz / dist) * pushDist;
    }
  }

  function _cameraShake(amount) {
    if (window.CameraShake && window.CameraShake.shake) {
      window.CameraShake.shake({ intensity: amount, duration: 0.3 });
    } else {
      var cam = _camera || window._camera;
      if (cam) {
        cam.position.x += (Math.random() - 0.5) * amount * 0.3;
        cam.position.y += (Math.random() - 0.5) * amount * 0.15;
      }
    }
  }

  /* ════════════════════════════════════════════════════════════════
     ATTACK: SHIELD BASH
  ════════════════════════════════════════════════════════════════ */
  function _doShieldBash(enemy, playerPos) {
    if (enemy.shieldBroken) return;   /* can't bash without shield */
    _playClank();
    _damagePlayer(BASH_DAMAGE);
    _pushPlayer(enemy, playerPos, BASH_PUSH);
    _cameraShake(0.5);
    enemy.bashCooldown = BASH_COOLDOWN;
  }

  /* ════════════════════════════════════════════════════════════════
     ATTACK: BATON STRIKE
  ════════════════════════════════════════════════════════════════ */
  function _doBatonStrike(enemy) {
    _playBatonSwing();
    _damagePlayer(BATON_DAMAGE);

    /* arm animation */
    var rightArm = enemy.group.userData.rightArm;
    var baton    = enemy.group.userData.baton;
    if (rightArm) rightArm.rotation.x = -1.2;
    if (baton)    baton.rotation.x    = -1.2;

    setTimeout(function () {
      if (rightArm) rightArm.rotation.x = 0;
      if (baton)    baton.rotation.x    = 0;
    }, 300);

    enemy.batonCooldown = BATON_COOLDOWN;
  }

  /* ════════════════════════════════════════════════════════════════
     FORMATION HELPER — steer away from sibling officers
  ════════════════════════════════════════════════════════════════ */
  function _formationSteer(enemy) {
    var steerX = 0;
    var steerZ = 0;
    var i;
    for (i = 0; i < window._riotPoliceEnemies.length; i++) {
      var other = window._riotPoliceEnemies[i];
      if (other === enemy || other.dead) continue;
      var dx = enemy.group.position.x - other.group.position.x;
      var dz = enemy.group.position.z - other.group.position.z;
      var d  = Math.sqrt(dx * dx + dz * dz);
      if (d < FORM_SPREAD && d > 0.01) {
        steerX += (dx / d) * (FORM_SPREAD - d) * 0.5;
        steerZ += (dz / d) * (FORM_SPREAD - d) * 0.5;
      }
    }
    return { x: steerX, z: steerZ };
  }

  /* ════════════════════════════════════════════════════════════════
     WALK CYCLE ANIMATION
  ════════════════════════════════════════════════════════════════ */
  function _animateWalk(enemy, dt) {
    enemy.walkCycle = (enemy.walkCycle || 0) + dt * enemy.speed * 3;
    var swing = Math.sin(enemy.walkCycle) * 0.25;
    var leftLeg  = enemy.group.children[3];
    var rightLeg = enemy.group.children[4];
    if (leftLeg  && leftLeg.isMesh)  leftLeg.rotation.x  =  swing;
    if (rightLeg && rightLeg.isMesh) rightLeg.rotation.x = -swing;
  }

  /* ════════════════════════════════════════════════════════════════
     UPDATE LOOP
  ════════════════════════════════════════════════════════════════ */
  function update(delta) {
    var cam = _camera || window._camera;
    if (!cam) return;
    var playerPos = cam.position;

    var i;
    for (i = window._riotPoliceEnemies.length - 1; i >= 0; i--) {
      var enemy = window._riotPoliceEnemies[i];

      /* update shield fragments regardless */
      _updateShieldFragments(enemy, delta);

      if (enemy.dead) {
        _doDeathCollapse(enemy, delta);
        continue;
      }

      /* timers */
      if (enemy.bashCooldown  > 0) enemy.bashCooldown  -= delta;
      if (enemy.batonCooldown > 0) enemy.batonCooldown -= delta;

      /* direction to player */
      var dx   = playerPos.x - enemy.group.position.x;
      var dz   = playerPos.z - enemy.group.position.z;
      var dist = Math.sqrt(dx * dx + dz * dz);

      /* face player */
      if (dist > 0.1) {
        enemy.group.rotation.y = Math.atan2(dx, dz);
      }

      /* formation separation */
      var steer = _formationSteer(enemy);

      /* advance toward player if not in melee range */
      if (dist > BATON_RANGE) {
        var moveX = (dx / dist) * enemy.speed * delta;
        var moveZ = (dz / dist) * enemy.speed * delta;
        enemy.group.position.x += moveX + steer.x * delta;
        enemy.group.position.z += moveZ + steer.z * delta;
        _animateWalk(enemy, delta);
      }

      /* shield bash — 4 units, has shield */
      if (dist <= BASH_RANGE && !enemy.shieldBroken && enemy.bashCooldown <= 0) {
        _doShieldBash(enemy, playerPos);
      }

      /* baton strike — 2 units */
      if (dist <= BATON_RANGE && enemy.batonCooldown <= 0) {
        _doBatonStrike(enemy);
      }

      /* shield shimmer animation */
      if (enemy.shieldMesh && !enemy.shieldBroken) {
        enemy.shieldMesh.material.opacity = 0.55 + Math.sin(Date.now() * 0.003 + i) * 0.1;
      }
    }
  }

  /* ════════════════════════════════════════════════════════════════
     SPAWN
  ════════════════════════════════════════════════════════════════ */
  function spawn(x, y, z) {
    if (!_scene) {
      _scene  = window._gameScene;
      _camera = window._camera;
    }
    if (!_scene) return null;

    var group = _buildMesh();

    var cam = _camera || window._camera;

    /* pick position if not provided */
    if (typeof x !== 'number') {
      if (cam && cam.position) {
        var ang = Math.random() * Math.PI * 2;
        var rad = 14 + Math.random() * 8;
        x = cam.position.x + Math.cos(ang) * rad;
        z = cam.position.z + Math.sin(ang) * rad;
      } else {
        x = (Math.random() - 0.5) * 30;
        z = (Math.random() - 0.5) * 30;
      }
      y = 0;
    }

    group.position.set(x, y || 0, z);
    _scene.add(group);

    var enemy = {
      group:          group,
      shieldMesh:     group.userData.shieldMesh,
      shieldLight:    group.userData.shieldLight,
      hp:             MAX_HP,
      shieldHP:       SHIELD_HP,
      shieldBroken:   false,
      shieldFragments: [],
      dead:           false,
      deathTimer:     0,
      speed:          WALK_SPEED,
      bashCooldown:   0,
      batonCooldown:  0,
      walkCycle:      Math.random() * Math.PI * 2   /* stagger walk phase */
    };

    window._riotPoliceEnemies.push(enemy);

    /* toast if spawned near player */
    if (cam && cam.position) {
      var tdx = x - cam.position.x;
      var tdz = (z || 0) - cam.position.z;
      var tdist = Math.sqrt(tdx * tdx + tdz * tdz);
      if (tdist <= TOAST_RANGE) {
        if (window.HUD && window.HUD.showToast) {
          window.HUD.showToast('RIOT POLICE INCOMING');
        }
        /* red flash */
        if (window.HUD && window.HUD.showDamageFlash) {
          window.HUD.showDamageFlash(0xFF0000, 0.3);
        }
      }
    }

    return enemy;
  }

  /* Spawn a group of 2-3 officers in formation */
  function _spawnGroup(count) {
    var cam = _camera || window._camera;
    var ang = Math.random() * Math.PI * 2;
    var rad = 16 + Math.random() * 6;
    var baseX, baseZ;
    if (cam && cam.position) {
      baseX = cam.position.x + Math.cos(ang) * rad;
      baseZ = cam.position.z + Math.sin(ang) * rad;
    } else {
      baseX = (Math.random() - 0.5) * 30;
      baseZ = (Math.random() - 0.5) * 30;
    }

    /* perpendicular spread for formation line */
    var perpX = -Math.sin(ang);
    var perpZ =  Math.cos(ang);

    var i;
    for (i = 0; i < count; i++) {
      var offset = (i - (count - 1) / 2) * FORM_SPREAD;
      spawn(
        baseX + perpX * offset,
        0,
        baseZ + perpZ * offset
      );
    }

    /* single toast for the group */
    if (window.HUD && window.HUD.showToast) {
      window.HUD.showToast('RIOT POLICE INCOMING');
    }
    if (window.HUD && window.HUD.showDamageFlash) {
      window.HUD.showDamageFlash(0xFF0000, 0.35);
    }
  }

  /* ════════════════════════════════════════════════════════════════
     INIT
  ════════════════════════════════════════════════════════════════ */
  function init(scene, camera) {
    _scene  = scene  || window._gameScene;
    _camera = camera || window._camera;
    window._riotPoliceEnemies = [];
  }

  /* ════════════════════════════════════════════════════════════════
     RESET
  ════════════════════════════════════════════════════════════════ */
  function reset() {
    var i;
    for (i = 0; i < window._riotPoliceEnemies.length; i++) {
      var e = window._riotPoliceEnemies[i];
      if (_scene) _scene.remove(e.group);
      if (e.shieldFragments) {
        var j;
        for (j = 0; j < e.shieldFragments.length; j++) {
          if (_scene) _scene.remove(e.shieldFragments[j]);
        }
      }
    }
    window._riotPoliceEnemies = [];
  }

  /* ════════════════════════════════════════════════════════════════
     WAVE HOOK — spawn groups from wave 5
  ════════════════════════════════════════════════════════════════ */
  (function _hookWaveEvents() {
    var _prevWave = 0;

    function _checkWave() {
      var gm = window.GameManager;
      if (!gm) return;
      var wave = (gm.getCurrentWave && gm.getCurrentWave()) ||
                 (gm.getWave && gm.getWave())               ||
                 (gm.wave)                                   ||
                 0;
      if (wave >= 5 && wave !== _prevWave) {
        _prevWave = wave;
        setTimeout(function () {
          /* 2-3 officers per group */
          var count = 2 + Math.floor(Math.random() * 2);
          _spawnGroup(count);
        }, 2000);
      }
    }

    setInterval(_checkWave, 5000);
  })();

  /* ════════════════════════════════════════════════════════════════
     PUBLIC API
  ════════════════════════════════════════════════════════════════ */
  return {
    init:   init,
    update: update,
    spawn:  spawn,
    reset:  reset
  };

})();
