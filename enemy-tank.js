/* ════════════════════════════════════════════════════════════════════
 *  ENEMY TANK — armored vehicle that rolls and shoots
 *  ─────────────────────────────────────────────────────────────────
 *  Starting wave 8, one tank spawns per 3 waves.
 *  800 HP, 60 armor (30 rear), cannon + machine gun, 3-stage death.
 *
 *  Public API:
 *    EnemyTank.init(scene, camera)  — call once after scene exists
 *    EnemyTank.update(delta)        — per-frame (called from game loop)
 *    EnemyTank.spawn(x, y, z)      — manually spawn a tank
 *    EnemyTank.reset()             — clear state between stages/waves
 * ════════════════════════════════════════════════════════════════════ */
window.EnemyTank = (function () {
  'use strict';

  /* ── global registry ─────────────────────────────────────────── */
  window._tankEnemies = window._tankEnemies || [];
  window._tankCount   = window._tankCount   || 0;

  /* ── internal state ─────────────────────────────────────────────── */
  var _scene       = null;
  var _camera      = null;
  var _initialized = false;

  var _tanks         = [];   /* active tank objects                  */
  var _shells        = [];   /* active cannon shells                 */
  var _tracers       = [];   /* machine-gun tracer lines             */
  var _smokeParticles = [];  /* engine smoke particles               */
  var _fireParticles  = [];  /* burn fire particles                  */
  var _debris         = [];  /* explosion debris pieces              */

  /* ── constants ──────────────────────────────────────────────────── */
  var MAX_HP            = 800;
  var ARMOR_FRONT       = 60;
  var ARMOR_REAR        = 30;
  var SCORE_REWARD      = 800;

  var MOVE_SPEED        = 2;      /* units/s                         */

  var CANNON_INTERVAL   = 6.0;    /* seconds between cannon shots    */
  var CANNON_SPEED      = 25;     /* shell travel speed              */
  var CANNON_DAMAGE     = 80;
  var CANNON_RADIUS     = 5;      /* blast radius                    */

  var MG_RANGE          = 15;     /* machine-gun engage range        */
  var MG_DAMAGE         = 8;
  var MG_RATE           = 0.15;   /* seconds between MG shots        */

  var SMOKE_THRESHOLD   = 0.5;    /* 50% HP → engine smokes          */
  var BURN_THRESHOLD    = 0.25;   /* 25% HP → fire                   */
  var SMOKE_MAX         = 20;
  var FIRE_MAX          = 12;

  var TOAST_RANGE       = 50;     /* show "TANK INCOMING!" within N units */

  var HULL_COLOR        = 0x4A5230;   /* dark olive                  */
  var TURRET_COLOR      = 0x3D4527;   /* slightly darker olive       */
  var BARREL_COLOR      = 0x2A2F1A;
  var TRACK_COLOR       = 0x1A1A1A;   /* near-black rubber           */

  /* ── HUD element ─────────────────────────────────────────────────── */
  var _hudEl      = null;
  var _toastTimer = 0;

  /* ════════════════════════════════════════════════════════════════
     INIT
  ════════════════════════════════════════════════════════════════ */
  function init(scene, camera) {
    _scene       = scene  || window._gameScene;
    _camera      = camera || window._camera;
    _tanks         = [];
    _shells        = [];
    _tracers       = [];
    _smokeParticles = [];
    _fireParticles  = [];
    _debris         = [];
    window._tankEnemies = [];
    window._tankCount   = 0;
    _initialized = true;
  }

  /* ════════════════════════════════════════════════════════════════
     MESH BUILDER — box-based tank group
  ════════════════════════════════════════════════════════════════ */
  function _buildMesh() {
    var group = new THREE.Group();

    /* ── hull ─────────────────────────────────────────────────── */
    var hullGeo = new THREE.BoxGeometry(3, 1.2, 4);
    var hullMat = new THREE.MeshLambertMaterial({ color: HULL_COLOR });
    var hull    = new THREE.Mesh(hullGeo, hullMat);
    hull.position.y = 0.6;
    group.add(hull);

    /* ── turret ───────────────────────────────────────────────── */
    var turretGeo = new THREE.BoxGeometry(1.8, 0.8, 2.2);
    var turretMat = new THREE.MeshLambertMaterial({ color: TURRET_COLOR });
    var turret    = new THREE.Mesh(turretGeo, turretMat);
    turret.position.set(0, 1.6, -0.2);
    group.add(turret);
    group.userData.turret = turret;

    /* ── barrel ───────────────────────────────────────────────── */
    var barrelGeo = new THREE.CylinderGeometry(0.15, 0.15, 2, 8);
    var barrelMat = new THREE.MeshLambertMaterial({ color: BARREL_COLOR });
    var barrel    = new THREE.Mesh(barrelGeo, barrelMat);
    barrel.rotation.x = Math.PI / 2;
    barrel.position.set(0, 1.6, -1.9);
    group.add(barrel);
    group.userData.barrel = barrel;

    /* ── left track ───────────────────────────────────────────── */
    var trackGeo = new THREE.CylinderGeometry(0.3, 0.3, 3.2, 8);
    var trackMat = new THREE.MeshLambertMaterial({ color: TRACK_COLOR });
    var trackL   = new THREE.Mesh(trackGeo, trackMat);
    trackL.rotation.x = Math.PI / 2;
    trackL.position.set(-1.6, 0.3, 0);
    group.add(trackL);
    group.userData.trackL = trackL;

    /* ── right track ──────────────────────────────────────────── */
    var trackR = new THREE.Mesh(trackGeo, trackMat);
    trackR.rotation.x = Math.PI / 2;
    trackR.position.set(1.6, 0.3, 0);
    group.add(trackR);
    group.userData.trackR = trackR;

    /* ── optional fire point light (added at burn phase) ──────── */
    group.userData.fireLight = null;

    return group;
  }

  /* ════════════════════════════════════════════════════════════════
     SPAWN
  ════════════════════════════════════════════════════════════════ */
  function spawn(x, y, z) {
    if (!_initialized) init();
    if (!_scene) {
      _scene  = window._gameScene;
      _camera = window._camera;
    }
    if (!_scene) return;

    /* default: spawn at map edge in direction away from player */
    if (x === undefined || x === null) {
      var cam = _camera || window._camera;
      var px = cam ? cam.position.x : 0;
      var pz = cam ? cam.position.z : 0;

      /* pick a random cardinal/diagonal direction */
      var angle  = Math.random() * Math.PI * 2;
      var radius = 80 + Math.random() * 20;
      x = px + Math.cos(angle) * radius;
      z = pz + Math.sin(angle) * radius;
      y = 0;
    }

    var mesh = _buildMesh();
    mesh.position.set(x, y || 0, z);
    _scene.add(mesh);

    var tank = {
      mesh:          mesh,
      hp:            MAX_HP,
      alive:         true,
      /* timers */
      cannonTimer:   CANNON_INTERVAL,
      mgTimer:       0,
      /* phases */
      smoking:       false,
      burning:       false,
      /* explosion staging */
      dying:         false,
      deathTimer:    0,
      deathStage:    0,
    };

    _tanks.push(tank);
    window._tankEnemies.push(tank);
    window._tankCount = _tanks.filter(function (t) { return t.alive; }).length;

    /* HUD toast + red border if player nearby */
    _tryTankIncomingToast(x, z);

    return tank;
  }

  /* ════════════════════════════════════════════════════════════════
     TOAST helper
  ════════════════════════════════════════════════════════════════ */
  function _tryTankIncomingToast(sx, sz) {
    var cam = _camera || window._camera;
    if (!cam) return;
    var dx = cam.position.x - sx;
    var dz = cam.position.z - sz;
    var dist = Math.sqrt(dx * dx + dz * dz);
    if (dist <= TOAST_RANGE) {
      if (window.HUD && window.HUD.showToast) {
        window.HUD.showToast('TANK INCOMING!', 3000, '#ff2200');
      }
      _showRedBorder();
    }
  }

  function _showRedBorder() {
    if (typeof document === 'undefined') return;
    var el = document.getElementById('tank-alert-border');
    if (!el) {
      el = document.createElement('div');
      el.id = 'tank-alert-border';
      el.style.cssText = [
        'position:fixed',
        'top:0', 'left:0', 'right:0', 'bottom:0',
        'pointer-events:none',
        'z-index:9000',
        'border:6px solid #ff2200',
        'box-shadow:inset 0 0 40px rgba(255,34,0,0.45)',
        'display:none',
      ].join(';');
      document.body.appendChild(el);
    }
    el.style.display = 'block';
    el.style.opacity = '1';

    var fadeSteps = 0;
    var fadeInterval = setInterval(function () {
      fadeSteps++;
      el.style.opacity = String(1 - fadeSteps / 20);
      if (fadeSteps >= 20) {
        clearInterval(fadeInterval);
        el.style.display = 'none';
        el.style.opacity = '1';
      }
    }, 100);
  }

  /* ════════════════════════════════════════════════════════════════
     CANNON SHELL
  ════════════════════════════════════════════════════════════════ */
  function _fireShell(tank) {
    if (!_scene) return;

    var barrelPos = new THREE.Vector3();
    tank.mesh.userData.barrel.getWorldPosition(barrelPos);

    var cam = _camera || window._camera;
    if (!cam) return;

    var dir = new THREE.Vector3(
      cam.position.x - barrelPos.x,
      0,
      cam.position.z - barrelPos.z
    ).normalize();

    var shellGeo = new THREE.SphereGeometry(0.25, 6, 6);
    var shellMat = new THREE.MeshLambertMaterial({ color: 0xff6600, emissive: 0xff3300 });
    var shellMesh = new THREE.Mesh(shellGeo, shellMat);
    shellMesh.position.copy(barrelPos);
    _scene.add(shellMesh);

    _shells.push({
      mesh:      shellMesh,
      dir:       dir,
      speed:     CANNON_SPEED,
      life:      4.0,    /* max 4 seconds travel */
    });
  }

  function _updateShells(dt) {
    for (var i = _shells.length - 1; i >= 0; i--) {
      var s = _shells[i];
      s.life -= dt;

      s.mesh.position.x += s.dir.x * s.speed * dt;
      s.mesh.position.z += s.dir.z * s.speed * dt;

      var cam = _camera || window._camera;
      var hit = false;

      /* player hit check */
      if (cam) {
        var dx = s.mesh.position.x - cam.position.x;
        var dz = s.mesh.position.z - cam.position.z;
        if (Math.sqrt(dx * dx + dz * dz) < 1.2) {
          _onShellImpact(s.mesh.position.clone(), true);
          hit = true;
        }
      }

      if (s.life <= 0 && !hit) {
        _onShellImpact(s.mesh.position.clone(), false);
        hit = true;
      }

      if (hit) {
        if (_scene) _scene.remove(s.mesh);
        _shells.splice(i, 1);
      }
    }
  }

  function _onShellImpact(pos, playerHit) {
    /* area damage */
    var cam = _camera || window._camera;
    if (cam) {
      var dx = pos.x - cam.position.x;
      var dz = pos.z - cam.position.z;
      var dist = Math.sqrt(dx * dx + dz * dz);
      if (dist <= CANNON_RADIUS) {
        var falloff = 1 - dist / CANNON_RADIUS;
        var dmg = Math.round(CANNON_DAMAGE * falloff);
        if (dmg > 0 && window.player && window.player.health !== undefined) {
          window.player.health -= dmg;
        }
        /* screen shake */
        if (window.CameraSystem && window.CameraSystem.shake) {
          window.CameraSystem.shake(0.35, 0.5);
        } else if (window.Feedback && window.Feedback.screenShake) {
          window.Feedback.screenShake(1.0);
        }
      }
    }

    /* debris burst */
    _spawnDebris(pos, 8);

    /* scorch mark */
    _spawnScorch(pos);
  }

  /* ════════════════════════════════════════════════════════════════
     MACHINE GUN TRACERS
  ════════════════════════════════════════════════════════════════ */
  function _fireMG(tank) {
    if (!_scene) return;
    var cam = _camera || window._camera;
    if (!cam) return;

    var origin = new THREE.Vector3();
    tank.mesh.userData.turret.getWorldPosition(origin);
    origin.y += 0.4;

    /* small scatter */
    var scatter = 0.08;
    var target = new THREE.Vector3(
      cam.position.x + (Math.random() - 0.5) * scatter * 4,
      cam.position.y + (Math.random() - 0.5) * scatter * 2,
      cam.position.z + (Math.random() - 0.5) * scatter * 4
    );

    /* tracer line */
    var points = [origin.clone(), target.clone()];
    var lineGeo = new THREE.BufferGeometry().setFromPoints(points);
    var lineMat = new THREE.LineBasicMaterial({ color: 0xff2200, transparent: true, opacity: 0.85 });
    var line    = new THREE.Line(lineGeo, lineMat);
    _scene.add(line);
    _tracers.push({ line: line, life: 0.08 });

    /* check player hit (tracer = instant) */
    var dx = cam.position.x - origin.x;
    var dz = cam.position.z - origin.z;
    var dist = Math.sqrt(dx * dx + dz * dz);
    if (dist < MG_RANGE + 1.5) {
      /* random spread: ~60% chance to hit */
      if (Math.random() < 0.6) {
        if (window.player && window.player.health !== undefined) {
          window.player.health -= MG_DAMAGE;
        }
        if (window.HUD && window.HUD.showDamageFlash) {
          window.HUD.showDamageFlash(0xff0000, 0.25);
        }
      }
    }
  }

  function _updateTracers(dt) {
    for (var i = _tracers.length - 1; i >= 0; i--) {
      _tracers[i].life -= dt;
      if (_tracers[i].life <= 0) {
        if (_scene) _scene.remove(_tracers[i].line);
        _tracers.splice(i, 1);
      }
    }
  }

  /* ════════════════════════════════════════════════════════════════
     DAMAGE — called externally or internally; handles armor
  ════════════════════════════════════════════════════════════════ */
  function _takeDamage(tank, amount, fromRear) {
    if (!tank || !tank.alive) return;

    var armor = fromRear ? ARMOR_REAR : ARMOR_FRONT;
    var absorbed = Math.min(amount, armor);
    var effective = amount - absorbed;
    if (effective <= 0) effective = 0;

    tank.hp -= effective;
    if (tank.hp < 0) tank.hp = 0;

    /* check health phases */
    var pct = tank.hp / MAX_HP;
    if (!tank.smoking && pct <= SMOKE_THRESHOLD) {
      tank.smoking = true;
    }
    if (!tank.burning && pct <= BURN_THRESHOLD) {
      tank.burning = true;
      _addFireLight(tank);
    }

    if (tank.hp <= 0 && !tank.dying) {
      _startDeath(tank);
    }
  }

  /* expose for external hit detection */
  function takeDamage(tank, amount, fromRear) {
    _takeDamage(tank, amount, fromRear || false);
  }

  /* ════════════════════════════════════════════════════════════════
     FIRE LIGHT (burn phase)
  ════════════════════════════════════════════════════════════════ */
  function _addFireLight(tank) {
    if (!_scene) return;
    var light = new THREE.PointLight(0xff6600, 2, 8);
    light.position.set(0, 2, 0);
    tank.mesh.add(light);
    tank.mesh.userData.fireLight = light;
  }

  /* ════════════════════════════════════════════════════════════════
     DEATH SEQUENCE — 3 staged explosions
  ════════════════════════════════════════════════════════════════ */
  function _startDeath(tank) {
    tank.dying     = true;
    tank.deathTimer = 0;
    tank.deathStage = 0;
    window._tankCount = _tanks.filter(function (t) { return t.alive && !t.dying; }).length;
  }

  function _updateDeath(tank, dt) {
    tank.deathTimer += dt;

    /* stage 0: small explosion at 0s */
    if (tank.deathStage === 0 && tank.deathTimer >= 0) {
      tank.deathStage = 1;
      _explode(tank.mesh.position.clone(), 'small');
    }

    /* stage 1: medium explosion at 0.6s */
    if (tank.deathStage === 1 && tank.deathTimer >= 0.6) {
      tank.deathStage = 2;
      var offset = new THREE.Vector3(
        (Math.random() - 0.5) * 2,
        0.5,
        (Math.random() - 0.5) * 2
      );
      _explode(tank.mesh.position.clone().add(offset), 'medium');
    }

    /* stage 2: large explosion at 1.4s */
    if (tank.deathStage === 2 && tank.deathTimer >= 1.4) {
      tank.deathStage = 3;
      _explode(tank.mesh.position.clone(), 'large');

      /* orange fire sphere */
      _spawnFireSphere(tank.mesh.position.clone());

      /* scorch crater */
      _spawnScorch(tank.mesh.position.clone(), 4);

      /* score */
      if (window.player && window.player.score !== undefined) {
        window.player.score += SCORE_REWARD;
      }
      if (window.HUD && window.HUD.setScore && window.player) {
        window.HUD.setScore(window.player.score);
      }
      if (window.HUD && window.HUD.showToast) {
        window.HUD.showToast('TANK DESTROYED! +' + SCORE_REWARD, 3000, '#ffcc00');
      }
    }

    /* remove at 2.5s */
    if (tank.deathStage === 3 && tank.deathTimer >= 2.5) {
      tank.alive = false;
      if (_scene) _scene.remove(tank.mesh);
      window._tankCount = _tanks.filter(function (t) { return t.alive && !t.dying; }).length;
    }
  }

  /* ════════════════════════════════════════════════════════════════
     EXPLOSION VFX
  ════════════════════════════════════════════════════════════════ */
  function _explode(pos, size) {
    if (!_scene) return;

    var sizes = { small: [1.5, 8], medium: [3, 12], large: [6, 20] };
    var cfg = sizes[size] || sizes.medium;
    var radius = cfg[0];
    var count  = cfg[1];

    /* screen shake */
    var shakeAmt = size === 'large' ? 0.5 : (size === 'medium' ? 0.3 : 0.15);
    if (window.CameraSystem && window.CameraSystem.shake) {
      window.CameraSystem.shake(shakeAmt, 0.5);
    } else if (window.Feedback && window.Feedback.screenShake) {
      window.Feedback.screenShake(shakeAmt * 3);
    }

    _spawnDebris(pos, count);

    /* flash sphere */
    var flashGeo = new THREE.SphereGeometry(radius, 8, 8);
    var flashMat = new THREE.MeshLambertMaterial({
      color: 0xff8800,
      transparent: true,
      opacity: 0.8,
    });
    var flash = new THREE.Mesh(flashGeo, flashMat);
    flash.position.copy(pos);
    flash.position.y += 1;
    _scene.add(flash);

    var flashLife = 0.3;
    _debris.push({ mesh: flash, life: flashLife, maxLife: flashLife, scale: true });
  }

  function _spawnFireSphere(pos) {
    if (!_scene) return;
    var geo = new THREE.SphereGeometry(3.5, 10, 10);
    var mat = new THREE.MeshLambertMaterial({
      color: 0xff5500,
      emissive: 0xff2200,
      transparent: true,
      opacity: 0.9,
    });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(pos);
    mesh.position.y += 2;
    _scene.add(mesh);
    _debris.push({ mesh: mesh, life: 1.2, maxLife: 1.2, scale: false });
  }

  function _spawnScorch(pos, radius) {
    if (!_scene) return;
    var r = radius || 2.5;
    var geo = new THREE.CircleGeometry(r, 12);
    var mat = new THREE.MeshLambertMaterial({
      color: 0x111100,
      transparent: true,
      opacity: 0.8,
    });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.copy(pos);
    mesh.position.y = 0.01;
    _scene.add(mesh);
    /* scorches persist a while then fade */
    _debris.push({ mesh: mesh, life: 30, maxLife: 30, scale: false, scorch: true });
  }

  function _spawnDebris(pos, count) {
    if (!_scene) return;
    var geo = new THREE.BoxGeometry(0.2, 0.2, 0.2);
    var mat = new THREE.MeshLambertMaterial({ color: 0x333322 });
    for (var i = 0; i < count; i++) {
      var d = new THREE.Mesh(geo, mat);
      d.position.copy(pos);
      d.position.x += (Math.random() - 0.5) * 3;
      d.position.y += Math.random() * 2;
      d.position.z += (Math.random() - 0.5) * 3;
      _scene.add(d);
      _debris.push({
        mesh:    d,
        life:    0.8 + Math.random() * 0.6,
        maxLife: 1.4,
        vel:     new THREE.Vector3(
          (Math.random() - 0.5) * 8,
          4 + Math.random() * 6,
          (Math.random() - 0.5) * 8
        ),
        scale:   false,
        gravity: true,
      });
    }
  }

  /* ════════════════════════════════════════════════════════════════
     SMOKE / FIRE PARTICLES
  ════════════════════════════════════════════════════════════════ */
  function _emitSmoke(tank, dt) {
    if (!_scene) return;
    if (_smokeParticles.length >= SMOKE_MAX) return;
    if (Math.random() > dt * 8) return;

    var geo = new THREE.SphereGeometry(0.3 + Math.random() * 0.2, 4, 4);
    var mat = new THREE.MeshLambertMaterial({
      color: 0x888888,
      transparent: true,
      opacity: 0.55,
    });
    var mesh = new THREE.Mesh(geo, mat);
    var wp = new THREE.Vector3();
    tank.mesh.getWorldPosition(wp);
    mesh.position.set(
      wp.x + (Math.random() - 0.5) * 1.5,
      wp.y + 1.8,
      wp.z + (Math.random() - 0.5) * 1.5
    );
    _scene.add(mesh);
    _smokeParticles.push({
      mesh:  mesh,
      life:  1.0 + Math.random() * 0.8,
      velY:  1.2 + Math.random() * 0.8,
    });
  }

  function _emitFire(tank, dt) {
    if (!_scene) return;
    if (_fireParticles.length >= FIRE_MAX) return;
    if (Math.random() > dt * 15) return;

    var geo = new THREE.SphereGeometry(0.2 + Math.random() * 0.15, 4, 4);
    var mat = new THREE.MeshLambertMaterial({
      color: Math.random() < 0.5 ? 0xff6600 : 0xff2200,
      transparent: true,
      opacity: 0.75,
    });
    var mesh = new THREE.Mesh(geo, mat);
    var wp = new THREE.Vector3();
    tank.mesh.getWorldPosition(wp);
    mesh.position.set(
      wp.x + (Math.random() - 0.5),
      wp.y + 1.5,
      wp.z + (Math.random() - 0.5)
    );
    _scene.add(mesh);
    _fireParticles.push({
      mesh:  mesh,
      life:  0.3 + Math.random() * 0.3,
      velY:  2.0 + Math.random() * 1.5,
      velX:  (Math.random() - 0.5) * 0.5,
      velZ:  (Math.random() - 0.5) * 0.5,
    });

    /* flicker fire light */
    var light = tank.mesh.userData.fireLight;
    if (light) {
      light.intensity = 1.5 + Math.random() * 1.5;
    }
  }

  function _updateSmokeParticles(dt) {
    for (var i = _smokeParticles.length - 1; i >= 0; i--) {
      var p = _smokeParticles[i];
      p.life -= dt;
      p.mesh.position.y += p.velY * dt;
      p.mesh.material.opacity = Math.max(0, p.life * 0.4);
      if (p.life <= 0) {
        if (_scene) _scene.remove(p.mesh);
        _smokeParticles.splice(i, 1);
      }
    }
  }

  function _updateFireParticles(dt) {
    for (var i = _fireParticles.length - 1; i >= 0; i--) {
      var p = _fireParticles[i];
      p.life -= dt;
      p.mesh.position.y += p.velY * dt;
      p.mesh.position.x += p.velX * dt;
      p.mesh.position.z += p.velZ * dt;
      p.mesh.material.opacity = Math.max(0, p.life * 2);
      if (p.life <= 0) {
        if (_scene) _scene.remove(p.mesh);
        _fireParticles.splice(i, 1);
      }
    }
  }

  function _updateDebris(dt) {
    for (var i = _debris.length - 1; i >= 0; i--) {
      var d = _debris[i];
      d.life -= dt;

      if (d.gravity && d.vel) {
        d.vel.y -= 9.8 * dt;
        d.mesh.position.x += d.vel.x * dt;
        d.mesh.position.y += d.vel.y * dt;
        d.mesh.position.z += d.vel.z * dt;
        if (d.mesh.position.y < 0) {
          d.mesh.position.y = 0;
          d.vel.y = 0;
          d.vel.x *= 0.3;
          d.vel.z *= 0.3;
        }
      }

      if (d.scale) {
        var s = Math.max(0, d.life / d.maxLife);
        d.mesh.scale.setScalar(s);
      }

      if (d.scorch) {
        d.mesh.material.opacity = Math.max(0, (d.life / d.maxLife) * 0.8);
      } else if (!d.gravity) {
        d.mesh.material.opacity = Math.max(0, d.life / d.maxLife);
      }

      if (d.life <= 0) {
        if (_scene) _scene.remove(d.mesh);
        _debris.splice(i, 1);
      }
    }
  }

  /* ════════════════════════════════════════════════════════════════
     PER-TANK MOVEMENT & COMBAT
  ════════════════════════════════════════════════════════════════ */
  function _updateTank(tank, dt) {
    if (!tank.alive) return;
    if (tank.dying) {
      _updateDeath(tank, dt);
      return;
    }

    var cam = _camera || window._camera;
    if (!cam) return;

    var px = cam.position.x;
    var pz = cam.position.z;
    var tx = tank.mesh.position.x;
    var tz = tank.mesh.position.z;

    var dx = px - tx;
    var dz = pz - tz;
    var dist = Math.sqrt(dx * dx + dz * dz);

    /* hull rotation to face player */
    var targetAngle = Math.atan2(dx, dz);
    var currentAngle = tank.mesh.rotation.y;
    var angleDiff = targetAngle - currentAngle;
    /* normalise to -PI..PI */
    while (angleDiff > Math.PI)  angleDiff -= Math.PI * 2;
    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
    tank.mesh.rotation.y += angleDiff * Math.min(1, dt * 1.5);

    /* turret independently tracks player */
    var turret = tank.mesh.userData.turret;
    var barrel  = tank.mesh.userData.barrel;
    if (turret && barrel) {
      /* turret local Y rotation relative to hull */
      var worldAngle = Math.atan2(dx, dz);
      var localAngle = worldAngle - tank.mesh.rotation.y;
      while (localAngle > Math.PI)  localAngle -= Math.PI * 2;
      while (localAngle < -Math.PI) localAngle += Math.PI * 2;
      turret.rotation.y += (localAngle - turret.rotation.y) * Math.min(1, dt * 2.5);
      barrel.rotation.y = turret.rotation.y;
    }

    /* forward movement */
    var stopRange = 12;
    if (dist > stopRange) {
      var nx = dx / dist;
      var nz = dz / dist;
      tank.mesh.position.x += nx * MOVE_SPEED * dt;
      tank.mesh.position.z += nz * MOVE_SPEED * dt;
    }

    /* track animation */
    var trackL = tank.mesh.userData.trackL;
    var trackR = tank.mesh.userData.trackR;
    var speed  = dist > stopRange ? MOVE_SPEED : 0;
    if (trackL) trackL.rotation.x += speed * dt;
    if (trackR) trackR.rotation.x += speed * dt;

    /* ── cannon ───────────────────────────────────────────────── */
    tank.cannonTimer -= dt;
    if (tank.cannonTimer <= 0) {
      tank.cannonTimer = CANNON_INTERVAL;
      _fireShell(tank);
    }

    /* ── machine gun (close range) ────────────────────────────── */
    if (dist <= MG_RANGE) {
      tank.mgTimer -= dt;
      if (tank.mgTimer <= 0) {
        tank.mgTimer = MG_RATE;
        _fireMG(tank);
      }
    }

    /* ── health phase effects ─────────────────────────────────── */
    if (tank.smoking) _emitSmoke(tank, dt);
    if (tank.burning) _emitFire(tank, dt);

    /* ── rear-arc detection for external damage calls ─────────── */
    /* Store player azimuth vs hull facing for damage callers     */
    tank._rearFacing = false;
    var hullFwd = new THREE.Vector3(
      Math.sin(tank.mesh.rotation.y),
      0,
      Math.cos(tank.mesh.rotation.y)
    );
    var toPlayer = new THREE.Vector3(dx, 0, dz).normalize();
    var dot = hullFwd.dot(toPlayer);
    /* rear arc: player is behind the tank (dot < -0.5) */
    if (dot < -0.5) tank._rearFacing = true;
  }

  /* ════════════════════════════════════════════════════════════════
     UPDATE — per frame
  ════════════════════════════════════════════════════════════════ */
  function update(delta) {
    if (!_initialized) return;
    if (!_scene) {
      _scene  = window._gameScene;
      _camera = window._camera;
    }
    if (!_scene) return;

    var dt = delta || 0.016;

    /* tanks */
    for (var i = _tanks.length - 1; i >= 0; i--) {
      var t = _tanks[i];
      if (!t.alive && t.deathStage >= 3) {
        _tanks.splice(i, 1);
        var idx = window._tankEnemies.indexOf(t);
        if (idx !== -1) window._tankEnemies.splice(idx, 1);
      } else {
        _updateTank(t, dt);
      }
    }

    /* projectiles & particles */
    _updateShells(dt);
    _updateTracers(dt);
    _updateSmokeParticles(dt);
    _updateFireParticles(dt);
    _updateDebris(dt);

    window._tankCount = _tanks.filter(function (t) { return t.alive && !t.dying; }).length;
  }

  /* ════════════════════════════════════════════════════════════════
     RESET
  ════════════════════════════════════════════════════════════════ */
  function reset() {
    var i;

    for (i = 0; i < _tanks.length; i++) {
      if (_tanks[i].mesh && _scene) _scene.remove(_tanks[i].mesh);
    }
    _tanks = [];

    for (i = 0; i < _shells.length; i++) {
      if (_shells[i].mesh && _scene) _scene.remove(_shells[i].mesh);
    }
    _shells = [];

    for (i = 0; i < _tracers.length; i++) {
      if (_tracers[i].line && _scene) _scene.remove(_tracers[i].line);
    }
    _tracers = [];

    for (i = 0; i < _smokeParticles.length; i++) {
      if (_smokeParticles[i].mesh && _scene) _scene.remove(_smokeParticles[i].mesh);
    }
    _smokeParticles = [];

    for (i = 0; i < _fireParticles.length; i++) {
      if (_fireParticles[i].mesh && _scene) _scene.remove(_fireParticles[i].mesh);
    }
    _fireParticles = [];

    for (i = 0; i < _debris.length; i++) {
      if (_debris[i].mesh && _scene) _scene.remove(_debris[i].mesh);
    }
    _debris = [];

    window._tankEnemies = [];
    window._tankCount   = 0;
  }

  /* ════════════════════════════════════════════════════════════════
     WAVE INTEGRATION — spawn 1 tank per 3 waves from wave 8
  ════════════════════════════════════════════════════════════════ */
  (function _hookWaveEvents() {
    var _prevWave = 0;

    function _checkWave() {
      var gm = window.GameManager;
      if (!gm) return;
      var wave = (gm.getWave && gm.getWave()) ||
                 (gm.wave)                     ||
                 0;
      if (wave < 8) return;
      if (wave === _prevWave) return;

      /* spawn one tank every 3 waves starting at wave 8 */
      if ((wave - 8) % 3 === 0) {
        _prevWave = wave;
        setTimeout(function () {
          if (!_initialized) init();
          spawn();
        }, 3000);
      } else {
        _prevWave = wave;
      }
    }

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
