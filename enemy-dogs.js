/*  enemy-dogs.js
 *  K9 patrol dog enemy unit — low-poly dog mesh, chase/patrol AI,
 *  barking audio, scared retreat behavior, and death yelp.
 *  Exposed as window.EnemyDogs
 *  Depends on: Three.js global (THREE), window._audioCtx (optional)
 */
window.EnemyDogs = (function () {
  'use strict';

  /* ── Constants ──────────────────────────────────────────────────────── */
  var MAX_DOGS         = 2;
  var DOG_HP           = 35;
  var DOG_SPEED        = 7;       // units/sec — faster than player sprint
  var PATROL_SPEED     = 3;
  var ALERT_RADIUS     = 18;      // larger than human enemies
  var ATTACK_RANGE     = 1.5;     // units
  var ATTACK_DAMAGE    = 20;
  var ATTACK_COOLDOWN  = 1.2;     // seconds
  var BARK_INTERVAL    = 1.5;     // seconds when alerted
  var PATROL_RADIUS    = 3;       // circle patrol radius
  var SCARED_DIST      = 10;      // units to flee when hit
  var SCARED_DURATION  = 3.0;     // seconds before re-approaching
  var DOG_SCORE        = 150;

  // Export alert radius so other systems can reference it
  window._dogAlertRadius = ALERT_RADIUS;

  /* ── Module state ───────────────────────────────────────────────────── */
  var _scene  = null;
  var _dogs   = [];
  var _time   = 0;

  /* ── Shared materials (lazy-init) ───────────────────────────────────── */
  var _tanMat   = null;
  var _darkMat  = null;
  var _noiseMat = null;

  function _getMats() {
    if (!_tanMat) {
      _tanMat   = new THREE.MeshLambertMaterial({ color: 0xC8A96E });
      _darkMat  = new THREE.MeshLambertMaterial({ color: 0x8B6914 });
      _noiseMat = new THREE.MeshLambertMaterial({ color: 0x222222 });
    }
  }

  /* ── Dog mesh builder ───────────────────────────────────────────────── */
  function _buildDogMesh() {
    _getMats();
    var group = new THREE.Group();

    // Body
    var bodyGeo = new THREE.BoxGeometry(0.6, 0.3, 0.9);
    var body    = new THREE.Mesh(bodyGeo, _tanMat);
    body.position.set(0, 0.35, 0);
    body.castShadow = true;
    group.add(body);

    // Head
    var headGeo = new THREE.BoxGeometry(0.3, 0.25, 0.25);
    var head    = new THREE.Mesh(headGeo, _tanMat);
    head.position.set(0, 0.52, 0.52);
    head.castShadow = true;
    group.add(head);
    group._dogHead = head;

    // Snout (darker)
    var snoutGeo = new THREE.BoxGeometry(0.14, 0.10, 0.12);
    var snout    = new THREE.Mesh(snoutGeo, _darkMat);
    snout.position.set(0, 0.46, 0.66);
    group.add(snout);

    // Eyes (tiny dark cubes)
    var eyeGeo = new THREE.BoxGeometry(0.04, 0.04, 0.04);
    var eyeL   = new THREE.Mesh(eyeGeo, _noiseMat);
    var eyeR   = new THREE.Mesh(eyeGeo, _noiseMat);
    eyeL.position.set(-0.09, 0.56, 0.64);
    eyeR.position.set( 0.09, 0.56, 0.64);
    group.add(eyeL);
    group.add(eyeR);

    // Ears
    var earGeo = new THREE.BoxGeometry(0.07, 0.10, 0.06);
    var earL   = new THREE.Mesh(earGeo, _darkMat);
    var earR   = new THREE.Mesh(earGeo, _darkMat);
    earL.position.set(-0.12, 0.65, 0.50);
    earR.position.set( 0.12, 0.65, 0.50);
    group.add(earL);
    group.add(earR);

    // 4 Legs — BoxGeometry(0.1, 0.3, 0.1) each
    var legGeo = new THREE.BoxGeometry(0.1, 0.3, 0.1);
    var legFL  = new THREE.Mesh(legGeo, _tanMat);
    var legFR  = new THREE.Mesh(legGeo, _tanMat);
    var legBL  = new THREE.Mesh(legGeo, _tanMat);
    var legBR  = new THREE.Mesh(legGeo, _tanMat);
    legFL.position.set(-0.22, 0.15, 0.30);
    legFR.position.set( 0.22, 0.15, 0.30);
    legBL.position.set(-0.22, 0.15, -0.30);
    legBR.position.set( 0.22, 0.15, -0.30);
    group.add(legFL);
    group.add(legFR);
    group.add(legBL);
    group.add(legBR);
    group._legFL = legFL;
    group._legFR = legFR;
    group._legBL = legBL;
    group._legBR = legBR;

    // Tail — CylinderGeometry(0.04, 0.02, 0.25)
    var tailGeo = new THREE.CylinderGeometry(0.04, 0.02, 0.25, 6);
    var tail    = new THREE.Mesh(tailGeo, _tanMat);
    tail.position.set(0, 0.45, -0.52);
    tail.rotation.x = -0.5; // angled upward-back
    group.add(tail);
    group._dogTail = tail;

    return group;
  }

  /* ── HP bar sprite ──────────────────────────────────────────────────── */
  function _makeHpSprite() {
    var canvas    = document.createElement('canvas');
    canvas.width  = 64;
    canvas.height = 8;
    var tex    = new THREE.CanvasTexture(canvas);
    tex._canvas = canvas;
    tex._ctx    = canvas.getContext('2d');

    var mat    = new THREE.SpriteMaterial({ map: tex, depthTest: false });
    var sprite = new THREE.Sprite(mat);
    sprite.scale.set(1.0, 0.13, 1);
    sprite.position.set(0, 1.2, 0);
    sprite._tex = tex;
    return sprite;
  }

  function _updateHpSprite(sprite, hp, maxHp) {
    var ctx = sprite._tex._ctx;
    var w   = sprite._tex._canvas.width;
    var h   = sprite._tex._canvas.height;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, 0, w, h);
    var pct = Math.max(0, hp / maxHp);
    var r   = Math.floor((1 - pct) * 220);
    var g   = Math.floor(pct * 200);
    ctx.fillStyle = 'rgb(' + r + ',' + g + ',0)';
    ctx.fillRect(1, 1, Math.floor((w - 2) * pct), h - 2);
    sprite._tex.needsUpdate = true;
  }

  /* ── Web Audio helpers ──────────────────────────────────────────────── */
  function _barkSound() {
    if (!window._audioCtx) return;
    try {
      var ctx  = window._audioCtx;
      var osc  = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.type            = 'sawtooth';
      osc.frequency.value = 800;
      gain.gain.setValueAtTime(0.18, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.12);
    } catch (e) { /* audio not available */ }
  }

  function _yelp() {
    if (!window._audioCtx) return;
    try {
      var ctx  = window._audioCtx;
      var osc  = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(600, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.3);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.3);
    } catch (e) { /* audio not available */ }
  }

  /* ── Apply damage to a dog (called externally on bullet hit) ────────── */
  function damageDog(dog, amount) {
    if (!dog || !dog.alive) return;
    dog.hp -= amount;
    _updateHpSprite(dog.hpSprite, dog.hp, dog.maxHp);

    if (dog.hp <= 0) {
      _killDog(dog);
      return;
    }

    // Scared behavior — retreats on first hit, re-approaches after 3s
    if (!dog.scared) {
      dog.scared      = true;
      dog.scaredTimer = SCARED_DURATION;
      // Flee away from patrol origin
      var ox  = dog.patrolOrigin.x;
      var oz  = dog.patrolOrigin.z;
      var fdx = dog.mesh.position.x - ox;
      var fdz = dog.mesh.position.z - oz;
      var fl  = Math.sqrt(fdx * fdx + fdz * fdz) || 1;
      dog.scaredTarget.set(
        dog.mesh.position.x + (fdx / fl) * SCARED_DIST,
        0,
        dog.mesh.position.z + (fdz / fl) * SCARED_DIST
      );
    }
  }

  /* ── Kill dog ───────────────────────────────────────────────────────── */
  function _killDog(dog) {
    if (!dog.alive) return;
    dog.alive      = false;
    dog.deathTimer = 0.6; // collapse animation duration
    _yelp();

    // Award score via kill score global
    window._dogKilledScore = (window._dogKilledScore || 0) + DOG_SCORE;
    window._lastDogKillScore = DOG_SCORE;
  }

  /* ── Running / idle animation ───────────────────────────────────────── */
  function _animateDog(dog, running) {
    var mesh = dog.mesh;
    if (!mesh) return;
    var t    = _time;
    var freq = running ? 8 : 4;

    // Legs alternate: FL+BR together, FR+BL together
    if (mesh._legFL) mesh._legFL.rotation.x =  Math.sin(t * freq) * 0.5;
    if (mesh._legBR) mesh._legBR.rotation.x =  Math.sin(t * freq) * 0.5;
    if (mesh._legFR) mesh._legFR.rotation.x = -Math.sin(t * freq) * 0.5;
    if (mesh._legBL) mesh._legBL.rotation.x = -Math.sin(t * freq) * 0.5;

    // Body bob
    mesh.position.y = Math.abs(Math.sin(t * freq * 2)) * 0.06;

    // Tail wag
    if (mesh._dogTail) {
      mesh._dogTail.rotation.y = Math.sin(t * 6) * 0.4;
    }
  }

  /* ── Death collapse animation ───────────────────────────────────────── */
  function _animateDeathCollapse(dog, dt) {
    var mesh = dog.mesh;
    if (!mesh) return;
    dog.deathTimer -= dt;
    mesh.rotation.z += dt * 2.5;
    mesh.position.y  = Math.max(-0.1, mesh.position.y - dt * 0.5);
    if (dog.deathTimer <= 0 && _scene) {
      _scene.remove(mesh);
      dog.mesh = null;
    }
  }

  /* ── Spawn a single dog ─────────────────────────────────────────────── */
  function spawnDog(scene, x, z) {
    if (!scene) return null;
    if (_dogs.length >= MAX_DOGS) return null;

    _scene = scene;
    var mesh = _buildDogMesh();

    var ox = (x !== undefined && x !== null) ? x : (Math.random() - 0.5) * 40;
    var oz = (z !== undefined && z !== null) ? z : (Math.random() - 0.5) * 40;

    mesh.position.set(ox, 0, oz);

    var hpSprite = _makeHpSprite();
    mesh.add(hpSprite);
    _updateHpSprite(hpSprite, DOG_HP, DOG_HP);

    var dog = {
      mesh:          mesh,
      hpSprite:      hpSprite,
      hp:            DOG_HP,
      maxHp:         DOG_HP,
      alive:         true,
      alerted:       false,
      scared:        false,
      scaredTimer:   0,
      scaredTarget:  new THREE.Vector3(),
      patrolAngle:   Math.random() * Math.PI * 2,
      patrolOrigin:  new THREE.Vector3(ox, 0, oz),
      attackCooldown: 0,
      barkTimer:     Math.random() * BARK_INTERVAL,
      deathTimer:    -1,
    };

    scene.add(mesh);
    _dogs.push(dog);
    return dog;
  }

  /* ── Update loop ────────────────────────────────────────────────────── */
  function update(dt, playerPos) {
    if (!playerPos) return;
    _time += dt;

    var px = playerPos.x;
    var pz = playerPos.z;

    for (var i = _dogs.length - 1; i >= 0; i--) {
      var dog = _dogs[i];

      // Remove fully dead dogs (mesh already removed)
      if (!dog.alive && dog.mesh === null) {
        _dogs.splice(i, 1);
        continue;
      }

      // Death collapse animation
      if (!dog.alive) {
        _animateDeathCollapse(dog, dt);
        continue;
      }

      var mesh = dog.mesh;
      var dx   = px - mesh.position.x;
      var dz   = pz - mesh.position.z;
      var dist = Math.sqrt(dx * dx + dz * dz);

      // Alert check — dog detects player within ALERT_RADIUS
      if (!dog.alerted && dist < ALERT_RADIUS) {
        dog.alerted   = true;
        dog.barkTimer = 0; // bark immediately on alert
      }

      // Attack cooldown tick
      dog.attackCooldown = Math.max(0, dog.attackCooldown - dt);

      /* ── Scared flee ── */
      if (dog.scared) {
        dog.scaredTimer -= dt;
        if (dog.scaredTimer <= 0) {
          dog.scared = false;
        } else {
          var sdx   = dog.scaredTarget.x - mesh.position.x;
          var sdz   = dog.scaredTarget.z - mesh.position.z;
          var sdist = Math.sqrt(sdx * sdx + sdz * sdz);
          if (sdist > 0.3) {
            var sv = DOG_SPEED * dt / sdist;
            mesh.position.x += sdx * sv;
            mesh.position.z += sdz * sv;
            mesh.rotation.y  = Math.atan2(-sdx, -sdz);
          }
          _animateDog(dog, true);
          continue;
        }
      }

      /* ── Alerted: chase and attack ── */
      if (dog.alerted) {
        // Periodic bark
        dog.barkTimer -= dt;
        if (dog.barkTimer <= 0) {
          _barkSound();
          dog.barkTimer = BARK_INTERVAL;
        }

        if (dist > ATTACK_RANGE) {
          // Chase player at speed 7
          var chaseNorm = dist > 0 ? 1 / dist : 0;
          mesh.position.x += dx * chaseNorm * DOG_SPEED * dt;
          mesh.position.z += dz * chaseNorm * DOG_SPEED * dt;
          mesh.rotation.y  = Math.atan2(dx, dz);
          _animateDog(dog, true);
        } else {
          // Attack — bite for 20 damage with 1.2s cooldown
          if (dog.attackCooldown <= 0) {
            dog.attackCooldown = ATTACK_COOLDOWN;
            if (typeof window._takeVehicleRamDamage === 'function') {
              window._takeVehicleRamDamage(ATTACK_DAMAGE);
            } else if (typeof window._takeDamageFromWaveEvent === 'function') {
              window._takeDamageFromWaveEvent(ATTACK_DAMAGE);
            } else if (typeof window._takeBTRDamage === 'function') {
              window._takeBTRDamage(ATTACK_DAMAGE);
            }
          }
          mesh.rotation.y = Math.atan2(dx, dz);
          _animateDog(dog, false);
        }

      } else {
        /* ── Patrol in circles at 3-unit radius ── */
        dog.patrolAngle += dt * (PATROL_SPEED / PATROL_RADIUS);
        var tx    = dog.patrolOrigin.x + Math.cos(dog.patrolAngle) * PATROL_RADIUS;
        var tz    = dog.patrolOrigin.z + Math.sin(dog.patrolAngle) * PATROL_RADIUS;
        var pdx   = tx - mesh.position.x;
        var pdz   = tz - mesh.position.z;
        var pdist = Math.sqrt(pdx * pdx + pdz * pdz);
        if (pdist > 0.1) {
          var pv = PATROL_SPEED * dt / pdist;
          mesh.position.x += pdx * pv;
          mesh.position.z += pdz * pv;
          mesh.rotation.y  = Math.atan2(pdx, pdz);
        }
        _animateDog(dog, true);
      }
    }
  }

  /* ── Init ───────────────────────────────────────────────────────────── */
  function init(scene) {
    _scene = scene;
    _dogs  = [];
    _time  = 0;
  }

  /* ── Reset — removes all dog meshes from scene ──────────────────────── */
  function reset() {
    for (var i = 0; i < _dogs.length; i++) {
      var dog = _dogs[i];
      if (dog.mesh && _scene) {
        _scene.remove(dog.mesh);
        dog.mesh = null;
      }
    }
    _dogs = [];
    _time = 0;
  }

  /* ── getAll — returns array of dog objects (for hit detection) ──────── */
  function getAll() {
    return _dogs;
  }

  /* ── Public API ─────────────────────────────────────────────────────── */
  return {
    init:      init,
    update:    update,
    spawnDog:  spawnDog,
    damageDog: damageDog,
    getAll:    getAll,
    reset:     reset
  };

}());
