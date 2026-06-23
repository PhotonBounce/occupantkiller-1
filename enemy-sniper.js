/* ════════════════════════════════════════════════════════════════════
 *  ENEMY SNIPER — long-range AI sniper enemy module
 *  ─────────────────────────────────────────────────────────────────
 *  Behavior state machine: REPOSITION → AIM → FIRE → RELOAD → REPOSITION
 *
 *  Public API:
 *    EnemySniper.init(scene, camera)         — call once after scene exists
 *    EnemySniper.update(delta)               — per-frame (seconds)
 *    EnemySniper.spawn(scene, x, y, z)       — spawn a sniper at position
 *    EnemySniper.getAll()                    — returns _snipers array
 *    EnemySniper.reset()                     — clear all snipers + scene objects
 * ═════════════════════════════════════════════════════════════════ */
window.EnemySniper = (function () {
  'use strict';

  /* ── module-level scene / camera references ── */
  var _scene  = null;
  var _camera = null;

  /* ── constants ── */
  var MAX_SNIPERS      = 5;
  var SNIPER_HP        = 180;
  var SNIPER_COLOR     = 0x3d5a2e;   /* dark olive camo */
  var MOVE_SPEED       = 4;          /* m/s during REPOSITION */
  var AIM_DURATION     = 2.5;        /* seconds to aim before firing */
  var RELOAD_DURATION  = 3.0;        /* seconds to reload */
  var REPOSITION_MIN   = 20;         /* min distance from player */
  var REPOSITION_MAX   = 40;         /* max distance from player */
  var SHOT_DAMAGE      = 45;
  var SHOT_SPREAD_RAD  = 0.05;       /* random angular spread */
  var LASER_MAX_DIST   = 60;
  var TRACER_SPEED     = 80;         /* m/s */
  var SCORE_VALUE      = 500;
  var HEADSHOT_Y       = 1.4;        /* Y threshold above mesh base */
  var HEADSHOT_MULT    = 3;
  var COUNTER_SNIPER_WINDOW = 0.5;   /* s: player fires within this of laser appear → 30% interrupt */
  var COUNTER_INTERRUPT_CHANCE = 0.3;

  /* ── active snipers list ── */
  var _snipers = [];

  /* ── active tracers list ── */
  var _tracers = [];

  /* ── track when player last fired (set by external code or injected hook) ── */
  var _playerLastFiredTime = -999;

  /* ══════════════════════════════════════════════════
   *  INIT
   * ══════════════════════════════════════════════════ */
  function init(scene, camera) {
    _scene  = scene  || window._gameScene  || null;
    _camera = camera || window._camera     || null;
    _snipers = [];
    _tracers = [];
    _playerLastFiredTime = -999;

    /* hook into global player fire events so counter-sniper logic works */
    if (typeof window._onPlayerFire === 'undefined') {
      window._onPlayerFire = function () {
        _playerLastFiredTime = _getTime();
      };
    } else {
      /* wrap existing handler */
      var _origFire = window._onPlayerFire;
      window._onPlayerFire = function () {
        _playerLastFiredTime = _getTime();
        _origFire();
      };
    }
  }

  /* ══════════════════════════════════════════════════
   *  BUILD SNIPER MESH (Three.js group)
   * ══════════════════════════════════════════════════ */
  function _buildMesh() {
    var group = new THREE.Group();
    var camoMat = new THREE.MeshLambertMaterial({ color: SNIPER_COLOR });

    /* body — CylinderGeometry(radiusTop, radiusBottom, height, segments) */
    var bodyGeo = new THREE.CylinderGeometry(0.3, 0.3, 1.7, 8);
    var body    = new THREE.Mesh(bodyGeo, camoMat);
    body.position.y = 0.85;   /* half height off ground */
    group.add(body);

    /* head — SphereGeometry */
    var headGeo = new THREE.SphereGeometry(0.2, 8, 6);
    var head    = new THREE.Mesh(headGeo, camoMat);
    head.position.y = 1.9;    /* body top (1.7) + radius (0.2) */
    group.add(head);

    /* left arm */
    var armGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.8, 6);
    var armMat = new THREE.MeshLambertMaterial({ color: SNIPER_COLOR });
    var leftArm = new THREE.Mesh(armGeo, armMat);
    leftArm.position.set(-0.38, 1.1, 0);
    leftArm.rotation.z = Math.PI / 4;
    group.add(leftArm);

    /* right arm — holds rifle */
    var rightArm = new THREE.Mesh(armGeo.clone(), armMat.clone());
    rightArm.position.set(0.38, 1.1, 0);
    rightArm.rotation.z = -Math.PI / 4;
    group.add(rightArm);

    /* left leg */
    var legGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.9, 6);
    var legMat = new THREE.MeshLambertMaterial({ color: SNIPER_COLOR });
    var leftLeg = new THREE.Mesh(legGeo, legMat);
    leftLeg.position.set(-0.18, 0.0, 0);
    group.add(leftLeg);

    /* right leg */
    var rightLeg = new THREE.Mesh(legGeo.clone(), legMat.clone());
    rightLeg.position.set(0.18, 0.0, 0);
    group.add(rightLeg);

    /* sniper rifle — long barrel (BoxGeometry) */
    var rifleGeo = new THREE.BoxGeometry(0.06, 0.06, 1.4);
    var rifleMat = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
    var rifle    = new THREE.Mesh(rifleGeo, rifleMat);
    rifle.position.set(0.2, 1.2, 0.8);  /* forward along +Z */
    group.add(rifle);

    /* store reference to right arm for reload animation */
    group.userData.rightArm = rightArm;
    group.userData.rifle    = rifle;

    return group;
  }

  /* ══════════════════════════════════════════════════
   *  BUILD LASER LINE MESH
   * ══════════════════════════════════════════════════ */
  function _buildLaserLine(fromPos, toPos) {
    var dir = new THREE.Vector3(
      toPos.x - fromPos.x,
      toPos.y - fromPos.y,
      toPos.z - fromPos.z
    );
    var len = Math.min(dir.length(), LASER_MAX_DIST);
    dir.normalize();

    /* use thin CylinderGeometry aligned along the shot direction */
    var geo = new THREE.CylinderGeometry(0.01, 0.01, len, 4);
    var mat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    var mesh = new THREE.Mesh(geo, mat);

    /* position at midpoint between sniper and player (capped at LASER_MAX_DIST) */
    var mid = new THREE.Vector3(
      fromPos.x + dir.x * len * 0.5,
      fromPos.y + dir.y * len * 0.5,
      fromPos.z + dir.z * len * 0.5
    );
    mesh.position.copy(mid);

    /* orient cylinder to face along dir (cylinder default is Y-axis) */
    var up = new THREE.Vector3(0, 1, 0);
    var quat = new THREE.Quaternion().setFromUnitVectors(up, dir);
    mesh.quaternion.copy(quat);

    return mesh;
  }

  /* ══════════════════════════════════════════════════
   *  SPAWN
   *  EnemySniper.spawn(scene, x, y, z)
   * ══════════════════════════════════════════════════ */
  function spawn(sceneArg, x, y, z) {
    /* allow scene override per-call or fall back to module scene */
    var sc = sceneArg || _scene || window._gameScene;
    if (!sc) return null;
    if (!_scene) _scene = sc;

    if (_snipers.length >= MAX_SNIPERS) return null;

    /* default spawn position if not provided */
    var spawnX = (typeof x === 'number') ? x : 0;
    var spawnY = (typeof y === 'number') ? y : 0;
    var spawnZ = (typeof z === 'number') ? z : 0;

    var mesh = _buildMesh();
    mesh.position.set(spawnX, spawnY, spawnZ);
    sc.add(mesh);

    /* pick an initial cover destination */
    var playerPos = _getPlayerPos();
    var targetPos = _pickRepositionTarget(playerPos);

    var sniper = {
      scene:            sc,
      mesh:             mesh,
      hp:               SNIPER_HP,
      alive:            true,
      state:            'REPOSITION',  /* REPOSITION | AIM | FIRE | RELOAD */
      /* REPOSITION */
      targetPos:        targetPos,
      /* AIM */
      aimTimer:         0,
      aimSwayTime:      0,
      laserMesh:        null,
      laserSpawnTime:   -999,
      /* RELOAD */
      reloadTimer:      0,
      reloadArmDir:     1,
    };

    _snipers.push(sniper);
    return sniper;
  }

  /* ══════════════════════════════════════════════════
   *  UPDATE — called every frame with delta (seconds)
   * ══════════════════════════════════════════════════ */
  function update(delta) {
    var sc = _scene || window._gameScene;
    if (!sc) return;

    /* update tracers */
    _updateTracers(delta, sc);

    /* update each sniper */
    for (var i = _snipers.length - 1; i >= 0; i--) {
      var s = _snipers[i];
      if (!s.alive) {
        _snipers.splice(i, 1);
        continue;
      }
      _updateSniper(s, delta);
    }
  }

  function _updateSniper(s, delta) {
    if (!s.alive) return;

    if (s.state === 'REPOSITION') {
      _stateReposition(s, delta);
    } else if (s.state === 'AIM') {
      _stateAim(s, delta);
    } else if (s.state === 'FIRE') {
      _stateFire(s);
    } else if (s.state === 'RELOAD') {
      _stateReload(s, delta);
    }
  }

  /* ── REPOSITION state: run to cover position ── */
  function _stateReposition(s, delta) {
    var pos = s.mesh.position;
    var tgt = s.targetPos;
    if (!tgt) {
      /* no target yet — pick one */
      s.targetPos = _pickRepositionTarget(_getPlayerPos());
      return;
    }

    var dx = tgt.x - pos.x;
    var dz = tgt.z - pos.z;
    var dist = Math.sqrt(dx * dx + dz * dz);

    if (dist < 0.5) {
      /* arrived — transition to AIM */
      s.state     = 'AIM';
      s.aimTimer  = 0;
      s.aimSwayTime = 0;
      _showLaser(s);
      return;
    }

    /* move toward target at MOVE_SPEED */
    var step = Math.min(MOVE_SPEED * delta, dist);
    var nx = pos.x + (dx / dist) * step;
    var nz = pos.z + (dz / dist) * step;
    s.mesh.position.set(nx, pos.y, nz);

    /* face movement direction */
    s.mesh.rotation.y = Math.atan2(dx, dz);
  }

  /* ── AIM state: face player for AIM_DURATION, sway, laser on ── */
  function _stateAim(s, delta) {
    var playerPos = _getPlayerPos();
    if (!playerPos) return;

    s.aimTimer    += delta;
    s.aimSwayTime += delta;

    /* face player with sway noise */
    var baseAngle = Math.atan2(
      playerPos.x - s.mesh.position.x,
      playerPos.z - s.mesh.position.z
    );
    var sway = Math.sin(s.aimSwayTime * 3.7) * 0.03 +
               Math.cos(s.aimSwayTime * 5.1) * 0.02;
    s.mesh.rotation.y = baseAngle + sway;

    /* update laser line position every frame */
    _updateLaser(s, playerPos);

    /* counter-sniper window: if player fired within COUNTER_SNIPER_WINDOW of laser appearing
       and we're still aiming, 30% chance to interrupt */
    var timeSinceLaser = _getTime() - s.laserSpawnTime;
    if (timeSinceLaser <= COUNTER_SNIPER_WINDOW) {
      var timeSincePlayerFired = _getTime() - _playerLastFiredTime;
      if (timeSincePlayerFired <= COUNTER_SNIPER_WINDOW) {
        if (Math.random() < COUNTER_INTERRUPT_CHANCE) {
          /* interrupt: reset aim timer, sniper ducks back */
          s.aimTimer = 0;
          _playerLastFiredTime = -999; /* consume the interrupt */
          return;
        }
      }
    }

    if (s.aimTimer >= AIM_DURATION) {
      s.state = 'FIRE';
    }
  }

  /* ── FIRE state: hitscan shot, tracer, then reload ── */
  function _stateFire(s) {
    var playerPos = _getPlayerPos();

    _hideLaser(s);

    if (playerPos) {
      /* direction from sniper to player */
      var dx = playerPos.x - s.mesh.position.x;
      var dy = (playerPos.y + 1.0) - (s.mesh.position.y + 1.7);
      var dz = playerPos.z - s.mesh.position.z;
      var dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

      /* add random spread */
      var spreadX = (Math.random() - 0.5) * 2.0 * SHOT_SPREAD_RAD;
      var spreadY = (Math.random() - 0.5) * 2.0 * SHOT_SPREAD_RAD;
      var spreadZ = (Math.random() - 0.5) * 2.0 * SHOT_SPREAD_RAD;

      var shotDir = new THREE.Vector3(
        dx / dist + spreadX,
        dy / dist + spreadY,
        dz / dist + spreadZ
      ).normalize();

      /* hitscan hit check: probability decreases with distance */
      var hitChance = 1.0 - (dist / 40.0);
      hitChance = Math.max(0, Math.min(1, hitChance));

      if (Math.random() < hitChance) {
        if (window._onPlayerDamage) {
          window._onPlayerDamage(SHOT_DAMAGE);
        } else if (window.player && window.player.health !== undefined) {
          window.player.health -= SHOT_DAMAGE;
        }
      }

      /* play crack sound */
      _playSniperCrack();

      /* spawn tracer round */
      _spawnTracer(s, shotDir);
    }

    /* transition to RELOAD */
    s.state       = 'RELOAD';
    s.reloadTimer = RELOAD_DURATION;
    s.reloadArmDir = 1;
  }

  /* ── RELOAD state: arm animation, then REPOSITION ── */
  function _stateReload(s, delta) {
    s.reloadTimer -= delta;

    /* animate right arm rotation back and forth */
    s.reloadArmDir = s.reloadArmDir || 1;
    var arm = s.mesh.userData.rightArm;
    if (arm) {
      arm.rotation.x += delta * 2.0 * s.reloadArmDir;
      if (arm.rotation.x > 1.0)  { s.reloadArmDir = -1; }
      if (arm.rotation.x < -0.5) { s.reloadArmDir =  1; }
    }

    if (s.reloadTimer <= 0) {
      /* reset arm */
      if (arm) { arm.rotation.x = 0; }

      /* pick new cover spot and reposition */
      s.targetPos = _pickRepositionTarget(_getPlayerPos());
      s.state     = 'REPOSITION';
    }
  }

  /* ══════════════════════════════════════════════════
   *  LASER POINTER
   * ══════════════════════════════════════════════════ */
  function _showLaser(s) {
    _hideLaser(s);
    var sc = s.scene || _scene;
    if (!sc) return;

    var playerPos = _getPlayerPos();
    var fromPos = new THREE.Vector3(
      s.mesh.position.x,
      s.mesh.position.y + 1.5,
      s.mesh.position.z
    );
    var toPos = playerPos
      ? new THREE.Vector3(playerPos.x, playerPos.y + 1.0, playerPos.z)
      : new THREE.Vector3(fromPos.x, fromPos.y, fromPos.z + 1);

    var laserMesh = _buildLaserLine(fromPos, toPos);
    sc.add(laserMesh);
    s.laserMesh      = laserMesh;
    s.laserSpawnTime = _getTime();
  }

  function _updateLaser(s, playerPos) {
    var sc = s.scene || _scene;
    if (!sc || !s.laserMesh) return;

    /* rebuild laser each frame to track player */
    sc.remove(s.laserMesh);
    if (s.laserMesh.geometry) s.laserMesh.geometry.dispose();
    if (s.laserMesh.material) s.laserMesh.material.dispose();
    s.laserMesh = null;

    if (!playerPos) return;

    var fromPos = new THREE.Vector3(
      s.mesh.position.x,
      s.mesh.position.y + 1.5,
      s.mesh.position.z
    );
    var toPos = new THREE.Vector3(playerPos.x, playerPos.y + 1.0, playerPos.z);
    var laserMesh = _buildLaserLine(fromPos, toPos);
    sc.add(laserMesh);
    s.laserMesh = laserMesh;
  }

  function _hideLaser(s) {
    var sc = s.scene || _scene;
    if (!sc || !s.laserMesh) return;
    sc.remove(s.laserMesh);
    if (s.laserMesh.geometry) s.laserMesh.geometry.dispose();
    if (s.laserMesh.material) s.laserMesh.material.dispose();
    s.laserMesh = null;
  }

  /* ══════════════════════════════════════════════════
   *  TRACER ROUND
   * ══════════════════════════════════════════════════ */
  function _spawnTracer(s, dir) {
    var sc = s.scene || _scene;
    if (!sc) return;

    var geo = new THREE.SphereGeometry(0.05, 4, 4);
    var mat = new THREE.MeshBasicMaterial({ color: 0xffff00 });
    var mesh = new THREE.Mesh(geo, mat);

    /* start at rifle barrel tip */
    var startPos = new THREE.Vector3(
      s.mesh.position.x,
      s.mesh.position.y + 1.5,
      s.mesh.position.z
    );
    mesh.position.copy(startPos);
    sc.add(mesh);

    _tracers.push({
      scene:    sc,
      mesh:     mesh,
      dir:      dir.clone(),
      speed:    TRACER_SPEED,
      life:     2.0   /* seconds before auto-remove */
    });
  }

  function _updateTracers(delta, sc) {
    for (var i = _tracers.length - 1; i >= 0; i--) {
      var t = _tracers[i];
      t.life -= delta;
      if (t.life <= 0) {
        t.scene.remove(t.mesh);
        t.mesh.geometry.dispose();
        t.mesh.material.dispose();
        _tracers.splice(i, 1);
        continue;
      }
      var step = t.speed * delta;
      t.mesh.position.x += t.dir.x * step;
      t.mesh.position.y += t.dir.y * step;
      t.mesh.position.z += t.dir.z * step;
    }
  }

  /* ══════════════════════════════════════════════════
   *  HEADSHOT DETECTION
   *  Called when a player bullet hits a sniper.
   *  hitY = world Y of bullet impact point.
   *  Returns damage dealt (accounting for headshot multiplier).
   * ══════════════════════════════════════════════════ */
  function takeDamage(sniper, dmg, hitY) {
    if (!sniper || !sniper.alive) return 0;

    var actualDmg = dmg;
    if (typeof hitY === 'number') {
      /* headshot zone: hitY > sniper base Y + HEADSHOT_Y */
      if (hitY > sniper.mesh.position.y + HEADSHOT_Y) {
        actualDmg = dmg * HEADSHOT_MULT;
        if (window.HUD && window.HUD.showToast) {
          window.HUD.showToast('HEADSHOT!');
        }
      }
    }

    sniper.hp -= actualDmg;
    if (sniper.hp <= 0) {
      _killSniper(sniper);
    }
    return actualDmg;
  }

  /* ══════════════════════════════════════════════════
   *  DEATH / KILL
   * ══════════════════════════════════════════════════ */
  function _killSniper(s) {
    s.alive = false;
    _hideLaser(s);

    var deathPos = s.mesh ? s.mesh.position.clone() : null;
    var sc = s.scene || _scene;

    /* remove mesh from scene */
    if (sc && s.mesh) {
      sc.remove(s.mesh);
      s.mesh.traverse(function (obj) {
        if (obj.isMesh) {
          if (obj.geometry) obj.geometry.dispose();
          if (obj.material) obj.material.dispose();
        }
      });
      s.mesh = null;
    }

    /* award score */
    if (window.player && window.player.score !== undefined) {
      window.player.score += SCORE_VALUE;
    }
    if (window._gameScore !== undefined) {
      window._gameScore += SCORE_VALUE;
    }

    /* HUD notification */
    if (window.HUD && window.HUD.showToast) {
      window.HUD.showToast('SNIPER DOWN  +' + SCORE_VALUE);
    }

    /* spawn rifle / ammo pickup */
    if (deathPos) {
      _spawnAmmoPickup(sc, deathPos);
    }
  }

  /* ══════════════════════════════════════════════════
   *  RIFLE AMMO PICKUP — BoxGeometry, +5 sniper ammo
   * ══════════════════════════════════════════════════ */
  function _spawnAmmoPickup(sc, pos) {
    if (!sc || !pos) return;
    try {
      /* try system-level pickup first */
      if (window.Pickups && window.Pickups.spawnAt) {
        window.Pickups.spawnAt('sniper_ammo', pos.x, pos.y, pos.z);
        return;
      }

      /* fallback: visible box pickup the player can walk over */
      var geo = new THREE.BoxGeometry(0.12, 0.5, 0.05);
      var mat = new THREE.MeshLambertMaterial({ color: 0x8B6914 });
      var mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(pos.x, pos.y + 0.25, pos.z);
      mesh.userData.isAmmoPickup   = true;
      mesh.userData.ammoType       = 'sniper';
      mesh.userData.ammoAmount     = 5;
      sc.add(mesh);

      /* auto-remove after 30 s if not collected */
      setTimeout(function () {
        if (sc) {
          sc.remove(mesh);
          geo.dispose();
          mat.dispose();
        }
      }, 30000);

      /* poll for player proximity to collect */
      var _collectInterval = setInterval(function () {
        if (!mesh.parent) { clearInterval(_collectInterval); return; }
        var pp = _getPlayerPos();
        if (!pp) return;
        var dx = pp.x - mesh.position.x;
        var dz = pp.z - mesh.position.z;
        if (Math.sqrt(dx * dx + dz * dz) < 1.2) {
          /* collect */
          if (window.player && window.player.sniperAmmo !== undefined) {
            window.player.sniperAmmo += 5;
          }
          if (window.HUD && window.HUD.showToast) {
            window.HUD.showToast('+5 SNIPER AMMO');
          }
          sc.remove(mesh);
          geo.dispose();
          mat.dispose();
          clearInterval(_collectInterval);
        }
      }, 200);

    } catch (e) {
      /* pickup is cosmetic — silent failure */
    }
  }

  /* ══════════════════════════════════════════════════
   *  SNIPER CRACK SOUND
   * ══════════════════════════════════════════════════ */
  function _playSniperCrack() {
    try {
      var ctx = window._audioCtx ||
                new (window.AudioContext || window.webkitAudioContext)();
      if (!window._audioCtx) window._audioCtx = ctx;
      var now = ctx.currentTime;

      /* sharp crack oscillator */
      var osc  = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(2200, now);
      osc.frequency.exponentialRampToValueAtTime(180, now + 0.05);
      gain.gain.setValueAtTime(0.9, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.07);

      /* noise burst */
      var bufLen = Math.ceil(ctx.sampleRate * 0.1);
      var buf    = ctx.createBuffer(1, bufLen, ctx.sampleRate);
      var data   = buf.getChannelData(0);
      for (var i = 0; i < bufLen; i++) {
        data[i] = (Math.random() * 2 - 1) * (1 - i / bufLen);
      }
      var noise     = ctx.createBufferSource();
      var noiseGain = ctx.createGain();
      noise.buffer  = buf;
      noiseGain.gain.setValueAtTime(0.6, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
      noise.connect(noiseGain);
      noiseGain.connect(ctx.destination);
      noise.start(now);

      /* distant echo */
      var delay    = ctx.createDelay(2.0);
      var echoGain = ctx.createGain();
      delay.delayTime.value = 0.3;
      echoGain.gain.setValueAtTime(0.25, now);
      echoGain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
      gain.connect(delay);
      delay.connect(echoGain);
      echoGain.connect(ctx.destination);

    } catch (e) {
      /* audio not available */
    }
  }

  /* ══════════════════════════════════════════════════
   *  HELPERS
   * ══════════════════════════════════════════════════ */
  function _getPlayerPos() {
    if (window.player && window.player.position) {
      return window.player.position;
    }
    var cam = _camera || window._camera;
    if (cam) return cam.position;
    return null;
  }

  function _pickRepositionTarget(playerPos) {
    var angle = Math.random() * Math.PI * 2;
    var dist  = REPOSITION_MIN + Math.random() * (REPOSITION_MAX - REPOSITION_MIN);
    var px = 0, pz = 0;
    if (playerPos) {
      px = playerPos.x;
      pz = playerPos.z;
    }
    return new THREE.Vector3(
      px + Math.cos(angle) * dist,
      0,
      pz + Math.sin(angle) * dist
    );
  }

  /* monotonic time in seconds (falls back to Date) */
  function _getTime() {
    if (typeof performance !== 'undefined' && performance.now) {
      return performance.now() / 1000;
    }
    return Date.now() / 1000;
  }

  /* ══════════════════════════════════════════════════
   *  RESET
   * ══════════════════════════════════════════════════ */
  function reset() {
    for (var i = 0; i < _snipers.length; i++) {
      var s = _snipers[i];
      _hideLaser(s);
      var sc = s.scene || _scene;
      if (sc && s.mesh) {
        sc.remove(s.mesh);
        s.mesh.traverse(function (obj) {
          if (obj.isMesh) {
            if (obj.geometry) obj.geometry.dispose();
            if (obj.material) obj.material.dispose();
          }
        });
        s.mesh = null;
      }
    }
    _snipers = [];

    /* clean up any live tracers */
    for (var j = 0; j < _tracers.length; j++) {
      var t = _tracers[j];
      t.scene.remove(t.mesh);
      t.mesh.geometry.dispose();
      t.mesh.material.dispose();
    }
    _tracers = [];
  }

  /* ══════════════════════════════════════════════════
   *  PUBLIC API
   * ══════════════════════════════════════════════════ */
  function getAll() {
    return _snipers;
  }

  return {
    init:       init,
    update:     update,
    spawn:      spawn,
    getAll:     getAll,
    reset:      reset,
    takeDamage: takeDamage
  };

})();
