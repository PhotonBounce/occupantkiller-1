/* ════════════════════════════════════════════════════════════════════
 *  ENEMY JUGGERNAUT — super heavy armored soldier
 *  ─────────────────────────────────────────────────────────────────
 *  Wave 12+, one per 6 waves.  600 HP, 50% bullet damage reduction,
 *  immune to knife damage.  Minigun arm, shoulder charge, ground slam.
 *  Rage mode at ≤150 HP (2× speed, 6 s charge cooldown).
 *  Slow collapse death, body stays 4 s as obstacle, 8 debris pieces.
 *
 *  Global:
 *    window._juggernautEnemies = []   (array of live juggernaut objects)
 *
 *  Public API:
 *    EnemyJuggernaut.init(scene, camera)  — call once after scene ready
 *    EnemyJuggernaut.update(delta)        — per-frame (seconds)
 *    EnemyJuggernaut.spawn()              — force-spawn one juggernaut
 *    EnemyJuggernaut.reset()             — clear all juggernauts
 * ═════════════════════════════════════════════════════════════════ */
window.EnemyJuggernaut = (function () {
  'use strict';

  /* ── internal scene refs ─────────────────────────────────────────── */
  var _scene  = null;
  var _camera = null;

  /* ── config ──────────────────────────────────────────────────────── */
  var MAX_HP              = 600;
  var RAGE_HP_THRESHOLD   = 150;
  var SMOKE_HP_THRESHOLD  = 300;
  var WALK_SPEED          = 1.5;   /* units / s */
  var RAGE_SPEED          = 3.0;   /* 2× walk */
  var BULLET_DMG_MULT     = 0.5;   /* 50% reduction */
  var SCORE_VALUE         = 1500;
  var SPAWN_MIN_WAVE      = 12;
  var SPAWN_WAVE_INTERVAL = 6;
  var SPAWN_MIN_DIST      = 40;    /* units from player */

  /* minigun */
  var MINIGUN_DAMAGE      = 35;
  var MINIGUN_FIRE_RATE   = 0.08; /* seconds between rounds */
  var MINIGUN_RANGE       = 20;
  var MINIGUN_SPIN_SPEED  = 8;    /* rad/s when firing */

  /* charge */
  var CHARGE_TRIGGER_DIST = 6;
  var CHARGE_COOLDOWN     = 12;   /* seconds */
  var RAGE_CHARGE_COOLDOWN= 6;
  var CHARGE_SPEED        = 8;    /* units/s */
  var CHARGE_DIST         = 3;    /* units travelled */
  var CHARGE_DAMAGE       = 80;

  /* slam */
  var SLAM_TRIGGER_DIST   = 3;
  var SLAM_DAMAGE         = 60;
  var SLAM_COOLDOWN       = 4;

  /* footstep */
  var FOOTSTEP_INTERVAL   = 0.8;

  /* death */
  var COLLAPSE_DURATION   = 1.5;
  var BODY_STAY_DURATION  = 4.0;
  var DEBRIS_COUNT        = 8;

  /* ── live juggernauts ────────────────────────────────────────────── */
  var _juggs = [];
  window._juggernautEnemies = _juggs;

  /* ── smoke particles (shared pool) ──────────────────────────────── */
  var _smokeParticles = [];

  /* ── wave tracking (for auto-spawn) ─────────────────────────────── */
  var _lastSpawnWave = 0;

  /* ════════════════════════════════════════════════════════════════
     INIT
  ════════════════════════════════════════════════════════════════ */
  function init(scene, camera) {
    _scene  = scene  || window._gameScene;
    _camera = camera || window._camera;
    _juggs  = [];
    window._juggernautEnemies = _juggs;
    _smokeParticles = [];
    _lastSpawnWave  = 0;
  }

  /* ════════════════════════════════════════════════════════════════
     MESH BUILDER
  ════════════════════════════════════════════════════════════════ */
  function _buildMesh() {
    var group = new THREE.Group();

    /* ── torso (huge, dark gray) ── */
    var torsoGeo = new THREE.BoxGeometry(0.8, 1.0, 0.5);
    var torsoMat = new THREE.MeshLambertMaterial({ color: 0x2A2A2A });
    var torso    = new THREE.Mesh(torsoGeo, torsoMat);
    torso.position.y = 0.5;
    group.add(torso);

    /* ── legs ── */
    var legGeo = new THREE.BoxGeometry(0.3, 0.72, 0.32);
    var legMat = new THREE.MeshLambertMaterial({ color: 0x1A1A1A });
    var leftLeg  = new THREE.Mesh(legGeo, legMat);
    leftLeg.position.set(-0.23, -0.36, 0);
    group.add(leftLeg);
    var rightLeg = new THREE.Mesh(legGeo, legMat.clone());
    rightLeg.position.set(0.23, -0.36, 0);
    group.add(rightLeg);

    /* ── heavy boots ── */
    var bootGeo = new THREE.BoxGeometry(0.32, 0.18, 0.38);
    var bootMat = new THREE.MeshLambertMaterial({ color: 0x111111 });
    var leftBoot  = new THREE.Mesh(bootGeo, bootMat);
    leftBoot.position.set(-0.23, -0.81, 0.03);
    group.add(leftBoot);
    var rightBoot = new THREE.Mesh(bootGeo, bootMat.clone());
    rightBoot.position.set(0.23, -0.81, 0.03);
    group.add(rightBoot);

    /* ── shoulder pads ── */
    var padGeo = new THREE.BoxGeometry(0.35, 0.25, 0.35);
    var padMat = new THREE.MeshLambertMaterial({ color: 0x1E1E1E });
    var leftPad = new THREE.Mesh(padGeo, padMat);
    leftPad.position.set(-0.6, 0.92, 0);
    group.add(leftPad);
    var rightPad = new THREE.Mesh(padGeo, padMat.clone());
    rightPad.position.set(0.6, 0.92, 0);
    group.add(rightPad);

    /* ── left arm (normal, thick) ── */
    var armGeo = new THREE.BoxGeometry(0.32, 0.8, 0.32);
    var armMat = new THREE.MeshLambertMaterial({ color: 0x242424 });
    var leftArm = new THREE.Mesh(armGeo, armMat);
    leftArm.position.set(-0.63, 0.5, 0);
    group.add(leftArm);

    /* ── right arm — minigun arm ── */
    var rightArmGeo = new THREE.BoxGeometry(0.32, 0.75, 0.32);
    var rightArmMat = new THREE.MeshLambertMaterial({ color: 0x1A1A1A });
    var rightArm = new THREE.Mesh(rightArmGeo, rightArmMat);
    rightArm.position.set(0.63, 0.5, 0);
    group.add(rightArm);

    /* ── minigun — main barrel housing ── */
    var minigunGroup = new THREE.Group();
    minigunGroup.position.set(0.63, 0.12, 0.0);

    var barrelHousingGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.9, 8);
    var barrelHousingMat = new THREE.MeshLambertMaterial({ color: 0x3A3A3A });
    var barrelHousing = new THREE.Mesh(barrelHousingGeo, barrelHousingMat);
    barrelHousing.rotation.x = Math.PI / 2;
    minigunGroup.add(barrelHousing);

    /* barrel cluster — 6 thin cylinders around the main barrel */
    var barrelCluster = new THREE.Group();
    for (var bi = 0; bi < 6; bi++) {
      var ba = (bi / 6) * Math.PI * 2;
      var bGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.92, 6);
      var bMat = new THREE.MeshLambertMaterial({ color: 0x555555 });
      var bMesh = new THREE.Mesh(bGeo, bMat);
      bMesh.rotation.x = Math.PI / 2;
      bMesh.position.set(Math.cos(ba) * 0.05, Math.sin(ba) * 0.05, 0);
      barrelCluster.add(bMesh);
    }
    minigunGroup.add(barrelCluster);

    /* muzzle flash point light — starts off */
    var muzzleLight = new THREE.PointLight(0xFF8800, 0, 4);
    muzzleLight.position.set(0, 0, 0.5);
    minigunGroup.add(muzzleLight);

    group.add(minigunGroup);

    /* ── black helmet with visor ── */
    var helmGeo = new THREE.BoxGeometry(0.55, 0.52, 0.52);
    var helmMat = new THREE.MeshLambertMaterial({ color: 0x0A0A0A });
    var helm = new THREE.Mesh(helmGeo, helmMat);
    helm.position.y = 1.32;
    group.add(helm);

    /* visor — dark amber strip */
    var visorGeo = new THREE.BoxGeometry(0.42, 0.1, 0.03);
    var visorMat = new THREE.MeshBasicMaterial({ color: 0x884400 });
    var visor = new THREE.Mesh(visorGeo, visorMat);
    visor.position.set(0, 1.31, 0.27);
    group.add(visor);

    /* store refs for animation */
    group.userData.leftLeg      = leftLeg;
    group.userData.rightLeg     = rightLeg;
    group.userData.leftArm      = leftArm;
    group.userData.rightArm     = rightArm;
    group.userData.leftPad      = leftPad;
    group.userData.rightPad     = rightPad;
    group.userData.minigunGroup = minigunGroup;
    group.userData.barrelCluster= barrelCluster;
    group.userData.muzzleLight  = muzzleLight;
    group.userData.helm         = helm;

    return group;
  }

  /* ════════════════════════════════════════════════════════════════
     SPAWN
  ════════════════════════════════════════════════════════════════ */
  function spawn() {
    if (!_scene) {
      _scene  = window._gameScene;
      _camera = window._camera;
    }
    if (!_scene) return;

    var playerPos = _getPlayerPos();
    var px, pz;
    if (playerPos) {
      var angle = Math.random() * Math.PI * 2;
      var dist  = SPAWN_MIN_DIST + Math.random() * 10;
      px = playerPos.x + Math.cos(angle) * dist;
      pz = playerPos.z + Math.sin(angle) * dist;
    } else {
      px = (Math.random() - 0.5) * 80;
      pz = (Math.random() - 0.5) * 80;
    }

    var mesh = _buildMesh();
    mesh.position.set(px, 0, pz);
    _scene.add(mesh);

    var j = {
      mesh:           mesh,
      hp:             MAX_HP,
      alive:          true,
      dying:          false,
      collapseTimer:  0,
      bodyTimer:      0,
      rageMode:       false,
      /* minigun */
      minigunTimer:   0,
      barrelAngle:    0,
      /* charge */
      chargeCooldown: 0,
      charging:       false,
      chargeDir:      new THREE.Vector3(),
      chargeLeft:     0,
      chargeTargetDist: 0,
      chargeStartPos: new THREE.Vector3(),
      /* slam */
      slamCooldown:   0,
      /* footstep */
      footstepTimer:  0,
      /* walk animation */
      walkCycle:      0,
      /* smoke (tracked per-jugg) */
      smokeTimer:     0,
      /* debris (post-death) */
      debrisList:     [],
    };

    _juggs.push(j);
    window._juggernautEnemies = _juggs;

    /* HUD toast */
    if (window.HUD && window.HUD.showToast) {
      window.HUD.showToast('JUGGERNAUT INBOUND', 3000, '#FF4400');
    }

    _playFootstepThump(true); /* announce with heavy thump */

    return j;
  }

  /* ════════════════════════════════════════════════════════════════
     UPDATE — called every frame
  ════════════════════════════════════════════════════════════════ */
  function update(delta) {
    if (!_scene) return;
    if (!_camera) _camera = window._camera;

    /* auto-spawn wave check */
    _checkWaveSpawn();

    /* update smoke particles */
    _updateSmoke(delta);

    for (var i = _juggs.length - 1; i >= 0; i--) {
      var j = _juggs[i];
      if (!j.alive && !j.dying) {
        /* fully dead, remove from list */
        _juggs.splice(i, 1);
        continue;
      }
      if (j.dying) {
        _updateDying(j, delta);
      } else {
        _updateJugg(j, delta);
      }
    }
    window._juggernautEnemies = _juggs;
  }

  /* ── per-juggernaut live update ── */
  function _updateJugg(j, delta) {
    var playerPos = _getPlayerPos();
    if (!playerPos) return;

    var pos = j.mesh.position;
    var dx  = playerPos.x - pos.x;
    var dz  = playerPos.z - pos.z;
    var dist = Math.sqrt(dx * dx + dz * dz);

    /* ── rage threshold check ── */
    if (!j.rageMode && j.hp <= RAGE_HP_THRESHOLD) {
      j.rageMode = true;
      _enterRage(j);
    }

    /* ── timers ── */
    if (j.chargeCooldown > 0) j.chargeCooldown -= delta;
    if (j.slamCooldown   > 0) j.slamCooldown   -= delta;
    j.footstepTimer -= delta;
    j.smokeTimer    -= delta;

    /* ── footstep thumps ── */
    if (j.footstepTimer <= 0) {
      j.footstepTimer = FOOTSTEP_INTERVAL;
      if (dist < 60) {
        _playFootstepThump(false);
        /* camera shake scales with proximity */
        var shakeAmt = Math.max(0, (1 - dist / 30)) * 0.12;
        if (shakeAmt > 0) _cameraShake(shakeAmt);
      }
    }

    /* ── smoke at ≤300 HP from helmet ── */
    if (j.hp <= SMOKE_HP_THRESHOLD && j.smokeTimer <= 0) {
      j.smokeTimer = 0.15;
      _emitSmoke(j);
    }

    /* ── CHARGING ── */
    if (j.charging) {
      j.chargeLeft -= delta;
      /* advance along charge dir */
      pos.x += j.chargeDir.x * CHARGE_SPEED * delta;
      pos.z += j.chargeDir.z * CHARGE_SPEED * delta;

      /* check contact or distance limit */
      var cdx = playerPos.x - pos.x;
      var cdz = playerPos.z - pos.z;
      var cdist = Math.sqrt(cdx * cdx + cdz * cdz);
      var travelDist = pos.distanceTo(j.chargeStartPos);

      if (cdist < 1.2 || travelDist >= CHARGE_DIST || j.chargeLeft <= 0) {
        j.charging = false;
        var cooldown = j.rageMode ? RAGE_CHARGE_COOLDOWN : CHARGE_COOLDOWN;
        j.chargeCooldown = cooldown;
        if (cdist < 1.5) {
          _damagePlayer(CHARGE_DAMAGE);
          _cameraShake(0.4);
          _playImpact();
        }
      }
    } else {
      /* ── SLAM at close range ── */
      if (dist <= SLAM_TRIGGER_DIST && j.slamCooldown <= 0) {
        j.slamCooldown = SLAM_COOLDOWN;
        _doSlam(j);
      }

      /* ── SHOULDER CHARGE ── */
      if (dist <= CHARGE_TRIGGER_DIST && j.chargeCooldown <= 0) {
        /* lower head (tilt mesh) and charge */
        j.mesh.rotation.z = 0.15; /* slight forward lean */
        j.charging  = true;
        j.chargeLeft = CHARGE_DIST / CHARGE_SPEED + 0.2;
        j.chargeStartPos.copy(pos);
        var len = Math.max(0.001, dist);
        j.chargeDir.set(dx / len, 0, dz / len);
        _playImpact();
      } else {
        /* ── normal movement ── */
        j.mesh.rotation.z = 0; /* restore */
        if (dist > 1.2) {
          var spd = j.rageMode ? RAGE_SPEED : WALK_SPEED;
          var len2 = Math.max(0.001, dist);
          pos.x += (dx / len2) * spd * delta;
          pos.z += (dz / len2) * spd * delta;
        }
      }

      /* ── MINIGUN fire ── */
      if (dist <= MINIGUN_RANGE) {
        j.minigunTimer -= delta;
        /* spin barrel */
        j.barrelAngle += MINIGUN_SPIN_SPEED * delta;
        if (j.mesh.userData.barrelCluster) {
          j.mesh.userData.barrelCluster.rotation.z = j.barrelAngle;
        }

        if (j.minigunTimer <= 0) {
          j.minigunTimer = MINIGUN_FIRE_RATE;
          _fireMinnigun(j, dist);
        }
      } else {
        /* slow barrel to stop when out of range */
        if (j.barrelAngle !== 0) {
          j.barrelAngle += MINIGUN_SPIN_SPEED * 0.2 * delta;
          if (j.mesh.userData.barrelCluster) {
            j.mesh.userData.barrelCluster.rotation.z = j.barrelAngle;
          }
        }
      }
    }

    /* ── face player ── */
    j.mesh.rotation.y = Math.atan2(dx, dz);

    /* ── walk animation ── */
    j.walkCycle += delta * (j.charging ? 6 : (j.rageMode ? 4 : 2));
    var legSwing = Math.sin(j.walkCycle) * 0.35;
    if (j.mesh.userData.leftLeg)  j.mesh.userData.leftLeg.rotation.x  =  legSwing;
    if (j.mesh.userData.rightLeg) j.mesh.userData.rightLeg.rotation.x = -legSwing;
    if (j.mesh.userData.leftArm)  j.mesh.userData.leftArm.rotation.x  = -legSwing * 0.6;
    if (j.mesh.userData.rightArm) j.mesh.userData.rightArm.rotation.x =  legSwing * 0.6;
  }

  /* ════════════════════════════════════════════════════════════════
     MINIGUN FIRE
  ════════════════════════════════════════════════════════════════ */
  function _fireMinnigun(j, distToPlayer) {
    /* muzzle flash */
    var ml = j.mesh.userData.muzzleLight;
    if (ml) {
      ml.intensity = 6;
      setTimeout(function () { if (ml) ml.intensity = 0; }, 60);
    }

    /* damage — spread (not every shot hits) */
    var hitChance = Math.max(0.3, 1 - distToPlayer / (MINIGUN_RANGE * 1.5));
    if (Math.random() < hitChance) {
      _damagePlayer(MINIGUN_DAMAGE);
    }

    /* minigun whine sound */
    _playMinigunWhine();
  }

  /* ════════════════════════════════════════════════════════════════
     GROUND SLAM
  ════════════════════════════════════════════════════════════════ */
  function _doSlam(j) {
    _damagePlayer(SLAM_DAMAGE);
    _cameraShake(0.5);
    _playImpact();

    /* shockwave ring */
    if (!_scene) return;
    var ringGeo = new THREE.RingGeometry(0.2, 0.5, 24);
    var ringMat = new THREE.MeshBasicMaterial({
      color: 0xFF6600, transparent: true, opacity: 0.8,
      side: THREE.DoubleSide, depthWrite: false
    });
    var ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(j.mesh.position.x, 0.1, j.mesh.position.z);
    _scene.add(ring);

    /* animate ring outward then remove */
    var slamLife = 0;
    var slamMax  = 0.6;
    function _animRing() {
      slamLife += 0.016;
      var k = slamLife / slamMax;
      ring.scale.setScalar(1 + k * 8);
      ringMat.opacity = Math.max(0, 0.8 * (1 - k));
      if (slamLife < slamMax) {
        requestAnimationFrame(_animRing);
      } else {
        if (_scene) _scene.remove(ring);
        ringGeo.dispose();
        ringMat.dispose();
      }
    }
    requestAnimationFrame(_animRing);
  }

  /* ════════════════════════════════════════════════════════════════
     TAKE DAMAGE — public
  ════════════════════════════════════════════════════════════════ */
  function takeDamage(j, dmg, type) {
    if (!j || !j.alive) return;

    /* immune to knife */
    if (type === 'knife' || type === 'melee') return;

    /* 50% bullet damage reduction */
    var reducedDmg = dmg * BULLET_DMG_MULT;
    j.hp -= reducedDmg;

    if (j.hp <= 0) {
      j.hp = 0;
      _startDying(j);
    }
  }

  /* ════════════════════════════════════════════════════════════════
     RAGE MODE
  ════════════════════════════════════════════════════════════════ */
  function _enterRage(j) {
    if (window.HUD && window.HUD.showToast) {
      window.HUD.showToast('JUGGERNAUT ENRAGED!', 2500, '#FF0000');
    }
    /* red tint visor */
    j.mesh.traverse(function (obj) {
      if (obj.isMesh && obj.material && obj.material.color) {
        /* tint torso slightly red */
        if (obj.material.color.getHex() === 0x2A2A2A) {
          obj.material.color.setHex(0x4A1A1A);
        }
      }
    });
    _playRoar();
  }

  /* ════════════════════════════════════════════════════════════════
     DEATH — slow collapse over 1.5 s, body stays 4 s
  ════════════════════════════════════════════════════════════════ */
  function _startDying(j) {
    j.alive  = false;
    j.dying  = true;
    j.collapseTimer = 0;
    j.bodyTimer     = 0;

    /* score */
    if (window.player && window.player.score !== undefined) {
      window.player.score += SCORE_VALUE;
    }

    /* toast */
    if (window.HUD && window.HUD.showToast) {
      window.HUD.showToast('JUGGERNAUT DOWN', 3000, '#00FF44');
    }

    /* spawn armor fragments */
    _spawnDebris(j);

    /* turn off minigun light */
    if (j.mesh.userData.muzzleLight) {
      j.mesh.userData.muzzleLight.intensity = 0;
    }

    _playImpact();
  }

  function _updateDying(j, delta) {
    j.collapseTimer += delta;
    var k = Math.min(1, j.collapseTimer / COLLAPSE_DURATION);

    /* tilt forward and sink into ground */
    j.mesh.rotation.x = k * (Math.PI / 2);
    j.mesh.position.y = -k * 0.5;

    if (j.collapseTimer >= COLLAPSE_DURATION) {
      /* fully collapsed — start body timer */
      j.bodyTimer += delta;
      if (j.bodyTimer >= BODY_STAY_DURATION) {
        /* remove body and debris */
        _removeJugg(j);
        j.dying = false;
        j.alive = false;
      }
    }

    /* update debris */
    for (var di = j.debrisList.length - 1; di >= 0; di--) {
      var d = j.debrisList[di];
      d.life += delta;
      d.mesh.position.x += d.vx * delta;
      d.mesh.position.y += d.vy * delta;
      d.mesh.position.z += d.vz * delta;
      d.vy -= 9.8 * delta; /* gravity */
      d.mesh.rotation.x  += d.rx * delta;
      d.mesh.rotation.z  += d.rz * delta;
      d.mat.opacity = Math.max(0, 1 - d.life / 3.0);
      if (d.life >= 3.0 && _scene) {
        _scene.remove(d.mesh);
        d.mesh.geometry.dispose();
        d.mat.dispose();
        j.debrisList.splice(di, 1);
      }
    }
  }

  function _spawnDebris(j) {
    if (!_scene) return;
    for (var i = 0; i < DEBRIS_COUNT; i++) {
      var geo = new THREE.BoxGeometry(
        0.08 + Math.random() * 0.14,
        0.06 + Math.random() * 0.1,
        0.06 + Math.random() * 0.1
      );
      var mat = new THREE.MeshLambertMaterial({
        color: (Math.random() > 0.5) ? 0x2A2A2A : 0x1A1A1A,
        transparent: true, opacity: 1.0
      });
      var dMesh = new THREE.Mesh(geo, mat);
      dMesh.position.copy(j.mesh.position);
      dMesh.position.y += 0.8 + Math.random() * 0.6;
      _scene.add(dMesh);

      j.debrisList.push({
        mesh: dMesh,
        mat:  mat,
        vx:   (Math.random() - 0.5) * 4,
        vy:   2 + Math.random() * 3,
        vz:   (Math.random() - 0.5) * 4,
        rx:   (Math.random() - 0.5) * 6,
        rz:   (Math.random() - 0.5) * 6,
        life: 0,
      });
    }
  }

  function _removeJugg(j) {
    if (_scene && j.mesh) {
      _scene.remove(j.mesh);
      j.mesh.traverse(function (obj) {
        if (obj.isMesh) {
          if (obj.geometry) obj.geometry.dispose();
          if (obj.material) obj.material.dispose();
        }
      });
    }
    /* remove any remaining debris */
    for (var di = 0; di < j.debrisList.length; di++) {
      var d = j.debrisList[di];
      if (_scene && d.mesh) _scene.remove(d.mesh);
      if (d.mesh && d.mesh.geometry) d.mesh.geometry.dispose();
      if (d.mat) d.mat.dispose();
    }
    j.debrisList = [];
  }

  /* ════════════════════════════════════════════════════════════════
     SMOKE PARTICLES (from helmet at ≤300 HP)
  ════════════════════════════════════════════════════════════════ */
  function _emitSmoke(j) {
    if (!_scene) return;
    var helmPos = j.mesh.position.clone();
    helmPos.y += 1.35;

    var geo = new THREE.BoxGeometry(0.08, 0.08, 0.08);
    var mat = new THREE.MeshBasicMaterial({
      color: 0x777777, transparent: true, opacity: 0.5, depthWrite: false
    });
    var pMesh = new THREE.Mesh(geo, mat);
    pMesh.position.copy(helmPos);
    _scene.add(pMesh);

    _smokeParticles.push({
      mesh:    pMesh,
      mat:     mat,
      vx:      (Math.random() - 0.5) * 0.5,
      vy:      0.6 + Math.random() * 0.4,
      vz:      (Math.random() - 0.5) * 0.5,
      life:    0,
      maxLife: 0.8 + Math.random() * 0.5,
    });
  }

  function _updateSmoke(delta) {
    if (!_scene) return;
    for (var i = _smokeParticles.length - 1; i >= 0; i--) {
      var p = _smokeParticles[i];
      p.life += delta;
      p.mesh.position.x += p.vx * delta;
      p.mesh.position.y += p.vy * delta;
      p.mesh.position.z += p.vz * delta;
      p.mat.opacity = Math.max(0, 0.5 * (1 - p.life / p.maxLife));
      p.mesh.scale.setScalar(1 + p.life * 2);
      if (p.life >= p.maxLife) {
        _scene.remove(p.mesh);
        p.mesh.geometry.dispose();
        p.mat.dispose();
        _smokeParticles.splice(i, 1);
      }
    }
  }

  /* ════════════════════════════════════════════════════════════════
     WAVE AUTO-SPAWN
  ════════════════════════════════════════════════════════════════ */
  function _checkWaveSpawn() {
    var gm   = window.GameManager;
    var wave = 0;
    if (gm) {
      wave = (gm.getWave && gm.getWave()) || gm.wave || 0;
    } else if (window.currentWave !== undefined) {
      wave = window.currentWave;
    }
    if (wave < SPAWN_MIN_WAVE) return;
    if (wave === _lastSpawnWave) return;
    if ((wave - SPAWN_MIN_WAVE) % SPAWN_WAVE_INTERVAL !== 0) return;

    _lastSpawnWave = wave;
    setTimeout(function () {
      spawn();
    }, 1500);
  }

  /* ════════════════════════════════════════════════════════════════
     HELPERS
  ════════════════════════════════════════════════════════════════ */
  function _getPlayerPos() {
    if (window.player && window.player.position) return window.player.position;
    if (_camera) return _camera.position;
    return null;
  }

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
    cam.position.x += (Math.random() - 0.5) * amount * 0.5;
    cam.position.y += (Math.random() - 0.5) * amount * 0.25;
  }

  /* ════════════════════════════════════════════════════════════════
     AUDIO
  ════════════════════════════════════════════════════════════════ */
  function _getAudioCtx() {
    if (window._audioCtx) return window._audioCtx;
    try {
      var Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return null;
      var ctx = new Ctx();
      window._audioCtx = ctx;
      return ctx;
    } catch (e) { return null; }
  }

  /* heavy low-frequency footstep thump */
  function _playFootstepThump(loud) {
    var ctx = _getAudioCtx();
    if (!ctx) return;
    try {
      var now = ctx.currentTime;

      /* sub-bass thud */
      var osc  = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(loud ? 55 : 45, now);
      osc.frequency.exponentialRampToValueAtTime(20, now + 0.25);
      gain.gain.setValueAtTime(loud ? 0.7 : 0.45, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.32);

      /* noise crunch */
      var bufLen = Math.floor(ctx.sampleRate * 0.08);
      var buf    = ctx.createBuffer(1, bufLen, ctx.sampleRate);
      var data   = buf.getChannelData(0);
      for (var i = 0; i < bufLen; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.015));
      }
      var nSrc  = ctx.createBufferSource();
      var nGain = ctx.createGain();
      var filt  = ctx.createBiquadFilter();
      nSrc.buffer = buf;
      filt.type = 'lowpass';
      filt.frequency.value = 180;
      nGain.gain.value = loud ? 0.5 : 0.3;
      nSrc.connect(filt);
      filt.connect(nGain);
      nGain.connect(ctx.destination);
      nSrc.start(now);
    } catch (e) {}
  }

  /* minigun spin-up whine */
  function _playMinigunWhine() {
    var ctx = _getAudioCtx();
    if (!ctx) return;
    try {
      var now = ctx.currentTime;
      var osc  = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.exponentialRampToValueAtTime(600, now + 0.05);
      osc.frequency.exponentialRampToValueAtTime(300, now + 0.08);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.11);

      /* short noise tick */
      var bLen = Math.floor(ctx.sampleRate * 0.03);
      var bbuf = ctx.createBuffer(1, bLen, ctx.sampleRate);
      var bd   = bbuf.getChannelData(0);
      for (var i = 0; i < bLen; i++) {
        bd[i] = (Math.random() * 2 - 1) * (1 - i / bLen);
      }
      var bSrc  = ctx.createBufferSource();
      var bGain = ctx.createGain();
      bSrc.buffer  = bbuf;
      bGain.gain.value = 0.12;
      bSrc.connect(bGain);
      bGain.connect(ctx.destination);
      bSrc.start(now);
    } catch (e) {}
  }

  /* impact thud for slam/charge */
  function _playImpact() {
    var ctx = _getAudioCtx();
    if (!ctx) return;
    try {
      var now = ctx.currentTime;
      var bufLen = Math.floor(ctx.sampleRate * 0.25);
      var buf    = ctx.createBuffer(1, bufLen, ctx.sampleRate);
      var data   = buf.getChannelData(0);
      for (var i = 0; i < bufLen; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.06));
      }
      var src   = ctx.createBufferSource();
      var gain  = ctx.createGain();
      var filt  = ctx.createBiquadFilter();
      src.buffer = buf;
      filt.type  = 'lowpass';
      filt.frequency.value = 120;
      gain.gain.value = 0.6;
      src.connect(filt);
      filt.connect(gain);
      gain.connect(ctx.destination);
      src.start(now);
    } catch (e) {}
  }

  /* low roar for rage mode activation */
  function _playRoar() {
    var ctx = _getAudioCtx();
    if (!ctx) return;
    try {
      var now = ctx.currentTime;
      var osc  = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(70, now);
      osc.frequency.exponentialRampToValueAtTime(28, now + 1.0);
      gain.gain.setValueAtTime(0.45, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.1);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 1.15);
    } catch (e) {}
  }

  /* ════════════════════════════════════════════════════════════════
     RESET
  ════════════════════════════════════════════════════════════════ */
  function reset() {
    for (var i = 0; i < _juggs.length; i++) {
      _removeJugg(_juggs[i]);
    }
    _juggs.length = 0;
    window._juggernautEnemies = _juggs;

    for (var si = 0; si < _smokeParticles.length; si++) {
      var p = _smokeParticles[si];
      if (_scene && p.mesh) _scene.remove(p.mesh);
      if (p.mesh && p.mesh.geometry) p.mesh.geometry.dispose();
      if (p.mat) p.mat.dispose();
    }
    _smokeParticles.length = 0;

    _lastSpawnWave = 0;
  }

  /* ── public API ── */
  return {
    init:       init,
    update:     update,
    spawn:      spawn,
    reset:      reset,
    takeDamage: takeDamage
  };

})();
