/* ════════════════════════════════════════════════════════════════════
 *  ENEMY SHIELD GENERATOR — tech enemy that deploys a protective
 *  energy bubble shielding nearby allies from incoming fire.
 *  ─────────────────────────────────────────────────────────────────
 *  Starting wave 4, max 1 active generator at a time.
 *  When any ally within 12 units takes damage the generator deploys
 *  a semi-transparent blue shield bubble (r=2.5).
 *  Bullets that enter the bubble deal only 30% damage to shielded allies.
 *  The bubble has 300 HP of its own — shoot the generator to whittle it.
 *  On collapse the bubble shatters into 12 blue shards.
 *  On generator death: +350 score, "SHIELD GENERATOR DESTROYED" toast.
 *
 *  Public API:
 *    EnemyShieldGen.init(scene, camera)  — call once after scene exists
 *    EnemyShieldGen.update(dt)           — per-frame
 *    EnemyShieldGen.spawn(x, y, z)       — manually spawn a generator
 *    EnemyShieldGen.reset()              — clear between waves
 *  Global:
 *    window._shieldBubbleActive (bool)
 * ════════════════════════════════════════════════════════════════════ */
window.EnemyShieldGen = (function () {
  'use strict';

  /* ── internal state ─────────────────────────────────────────────── */
  var _scene    = null;
  var _camera   = null;
  var _audioCtx = null;

  /* The single active generator object (or null). */
  var _gen = null;

  /* Ripple ring objects that expand and fade. */
  var _ripples = [];

  /* Shard objects from a collapsed bubble. */
  var _shards = [];

  /* ── constants ──────────────────────────────────────────────────── */
  var GEN_HP          = 120;
  var BUBBLE_HP_MAX   = 300;
  var BUBBLE_RADIUS   = 2.5;
  var ALLY_SCAN_DIST  = 12;
  var DAMAGE_FACTOR   = 0.30;   /* 30 % damage passes through bubble */
  var SCORE_REWARD    = 350;
  var SHARD_COUNT     = 12;

  /* ════════════════════════════════════════════════════════════════
     AUDIO
  ════════════════════════════════════════════════════════════════ */
  function _getAudioCtx() {
    if (!_audioCtx) {
      try {
        _audioCtx = window._audioCtx || new (window.AudioContext || window.webkitAudioContext)();
      } catch (e) {}
    }
    return _audioCtx;
  }

  function _playBubbleDeploy() {
    var ctx = _getAudioCtx();
    if (!ctx) return;
    var osc = ctx.createOscillator();
    var gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(400, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(900, ctx.currentTime + 0.3);
    gain.gain.setValueAtTime(0.25, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.35);
  }

  function _playBubbleHit() {
    var ctx = _getAudioCtx();
    if (!ctx) return;
    var osc = ctx.createOscillator();
    var gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(700, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.15);
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.18);
  }

  function _playBubbleCollapse() {
    var ctx = _getAudioCtx();
    if (!ctx) return;
    var osc = ctx.createOscillator();
    var osc2 = ctx.createOscillator();
    var gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(600, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.5);
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1200, ctx.currentTime);
    osc2.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.4);
    gain.gain.setValueAtTime(0.4, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.55);
    osc.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc2.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.55);
    osc2.stop(ctx.currentTime + 0.55);
  }

  /* ════════════════════════════════════════════════════════════════
     MESH BUILDING
  ════════════════════════════════════════════════════════════════ */
  function _buildGeneratorMesh() {
    var group = new THREE.Group();

    /* Torso — dark blue */
    var torsoGeo = new THREE.BoxGeometry(0.5, 0.8, 0.3);
    var torsoMat = new THREE.MeshLambertMaterial({ color: 0x001166 });
    var torso = new THREE.Mesh(torsoGeo, torsoMat);
    torso.position.y = 0.0;
    group.add(torso);

    /* Head */
    var headGeo = new THREE.BoxGeometry(0.35, 0.35, 0.35);
    var headMat = new THREE.MeshLambertMaterial({ color: 0x001133 });
    var head = new THREE.Mesh(headGeo, headMat);
    head.position.y = 0.6;
    group.add(head);

    /* Cyan LED strip across chest */
    var ledGeo = new THREE.BoxGeometry(0.42, 0.06, 0.05);
    var ledMat = new THREE.MeshBasicMaterial({ color: 0x00FFFF });
    var led = new THREE.Mesh(ledGeo, ledMat);
    led.position.set(0, 0.1, 0.18);
    group.add(led);

    /* Cyan eye visor */
    var visorGeo = new THREE.BoxGeometry(0.25, 0.07, 0.04);
    var visorMat = new THREE.MeshBasicMaterial({ color: 0x00DDFF });
    var visor = new THREE.Mesh(visorGeo, visorMat);
    visor.position.set(0, 0.62, 0.19);
    group.add(visor);

    /* Shoulder accent lights */
    var accentGeo = new THREE.BoxGeometry(0.08, 0.08, 0.08);
    var accentMat = new THREE.MeshBasicMaterial({ color: 0x0088FF });
    var accentL = new THREE.Mesh(accentGeo, accentMat);
    accentL.position.set(-0.3, 0.25, 0);
    group.add(accentL);
    var accentR = new THREE.Mesh(accentGeo, accentMat);
    accentR.position.set(0.3, 0.25, 0);
    group.add(accentR);

    /* Legs */
    var legGeo = new THREE.BoxGeometry(0.18, 0.5, 0.18);
    var legMat = new THREE.MeshLambertMaterial({ color: 0x000844 });
    var legL = new THREE.Mesh(legGeo, legMat);
    legL.position.set(-0.14, -0.65, 0);
    group.add(legL);
    var legR = new THREE.Mesh(legGeo, legMat);
    legR.position.set(0.14, -0.65, 0);
    group.add(legR);

    return group;
  }

  function _buildBubbleMesh() {
    var geo = new THREE.SphereGeometry(BUBBLE_RADIUS, 16, 16);
    var mat = new THREE.MeshBasicMaterial({
      color: 0x0044FF,
      transparent: true,
      opacity: 0.25,
      side: THREE.DoubleSide
    });
    var mesh = new THREE.Mesh(geo, mat);
    return mesh;
  }

  /* ════════════════════════════════════════════════════════════════
     BUBBLE COLLAPSE — shatter into blue shards
  ════════════════════════════════════════════════════════════════ */
  function _collapseBubble(gen) {
    if (!gen.bubble) return;
    _playBubbleCollapse();

    var worldPos = new THREE.Vector3();
    gen.bubble.getWorldPosition(worldPos);

    if (_scene) _scene.remove(gen.bubble);
    gen.bubble = null;
    gen.bubbleActive = false;
    gen.bubbleHP = 0;
    window._shieldBubbleActive = false;

    /* Spawn shards */
    var i;
    for (i = 0; i < SHARD_COUNT; i++) {
      var shardGeo = new THREE.BoxGeometry(0.08, 0.08, 0.08);
      var shardMat = new THREE.MeshBasicMaterial({
        color: 0x0055FF,
        transparent: true,
        opacity: 0.9
      });
      var shard = new THREE.Mesh(shardGeo, shardMat);
      shard.position.copy(worldPos);
      shard.position.x += (Math.random() - 0.5) * BUBBLE_RADIUS * 2;
      shard.position.y += (Math.random() - 0.5) * BUBBLE_RADIUS * 2;
      shard.position.z += (Math.random() - 0.5) * BUBBLE_RADIUS * 2;
      shard._vel = new THREE.Vector3(
        (Math.random() - 0.5) * 5,
        Math.random() * 4 + 1,
        (Math.random() - 0.5) * 5
      );
      shard._rot = new THREE.Vector3(
        (Math.random() - 0.5) * 8,
        (Math.random() - 0.5) * 8,
        (Math.random() - 0.5) * 8
      );
      shard._age = 0;
      if (_scene) _scene.add(shard);
      _shards.push(shard);
    }
  }

  /* ════════════════════════════════════════════════════════════════
     RIPPLE EFFECT — ring at bullet-hit point on bubble surface
  ════════════════════════════════════════════════════════════════ */
  function _spawnRipple(position) {
    if (!_scene) return;
    var geo = new THREE.TorusGeometry(0.3, 0.05, 6, 12);
    var mat = new THREE.MeshBasicMaterial({
      color: 0x00CCFF,
      transparent: true,
      opacity: 0.85,
      side: THREE.DoubleSide
    });
    var ring = new THREE.Mesh(geo, mat);
    ring.position.copy(position);
    ring.lookAt(_camera ? _camera.position : new THREE.Vector3(0, 10, 0));
    ring._age = 0;
    ring._lifetime = 0.45;
    _scene.add(ring);
    _ripples.push(ring);
  }

  /* ════════════════════════════════════════════════════════════════
     BULLET INTERCEPTION  (_checkBullet is hooked onto _onShotFired)
  ════════════════════════════════════════════════════════════════ */
  function _checkBullet(pos, dir) {
    if (!_gen || !_gen.bubbleActive || !_gen.bubble) return;

    var bubblePos = new THREE.Vector3();
    _gen.bubble.getWorldPosition(bubblePos);

    /* Ray–sphere intersection */
    var oc = new THREE.Vector3().subVectors(pos, bubblePos);
    var dirN = dir.clone().normalize();
    var b = oc.dot(dirN);
    var c = oc.dot(oc) - BUBBLE_RADIUS * BUBBLE_RADIUS;
    var discriminant = b * b - c;

    if (discriminant < 0) return;  /* Ray misses bubble */

    var t = -b - Math.sqrt(discriminant);
    if (t < 0) t = -b + Math.sqrt(discriminant);
    if (t < 0) return;

    /* Hit point on bubble surface */
    var hitPoint = new THREE.Vector3().addVectors(pos, dirN.clone().multiplyScalar(t));

    /* Damage the bubble */
    _gen.bubbleHP -= 1;   /* Each bullet hit counts as 1 unit of bullet damage check */
    _playBubbleHit();
    _spawnRipple(hitPoint);

    if (_gen.bubbleHP <= 0) {
      _collapseBubble(_gen);
      return;
    }

    /* Reduce damage to any ally inside the bubble */
    var enemies = (window.Enemies && window.Enemies.getAll) ? window.Enemies.getAll() : [];
    var i;
    for (i = 0; i < enemies.length; i++) {
      var ally = enemies[i];
      if (!ally || !ally.position) continue;
      var dx = ally.position.x - bubblePos.x;
      var dy = ally.position.y - bubblePos.y;
      var dz = ally.position.z - bubblePos.z;
      var distSq = dx * dx + dy * dy + dz * dz;
      if (distSq < BUBBLE_RADIUS * BUBBLE_RADIUS) {
        /* Tag ally so damage systems can read the reduction */
        ally._shieldDamageMultiplier = DAMAGE_FACTOR;
      }
    }

    /* Clear multiplier after a short delay */
    setTimeout(function () {
      var allEnemies = (window.Enemies && window.Enemies.getAll) ? window.Enemies.getAll() : [];
      var j;
      for (j = 0; j < allEnemies.length; j++) {
        if (allEnemies[j]) allEnemies[j]._shieldDamageMultiplier = 1.0;
      }
    }, 100);
  }

  /* ════════════════════════════════════════════════════════════════
     ALLY DAMAGE WATCH — detect when an ally takes damage while near
  ════════════════════════════════════════════════════════════════ */
  function _watchAllyDamage() {
    /* Hook window._onAllyDamaged if available, else poll via _onShotFired */
    /* The bubble deploy is also triggered proactively inside update() */
  }

  /* ════════════════════════════════════════════════════════════════
     SPAWN
  ════════════════════════════════════════════════════════════════ */
  function spawn(x, y, z) {
    /* Max 1 active generator */
    if (_gen && !_gen.dead) return null;

    _scene = _scene || window._gameScene;
    _camera = _camera || window._camera;

    if (!_scene) return null;

    var group = _buildGeneratorMesh();
    group.position.set(x || 0, y || 0, z || 0);
    _scene.add(group);

    _gen = {
      group:        group,
      hp:           GEN_HP,
      dead:         false,
      deathTimer:   0,
      bubbleActive: false,
      bubble:       null,
      bubbleHP:     BUBBLE_HP_MAX,
      pulsePhase:   0,
      retreatTimer: 0
    };

    window._shieldBubbleActive = false;
    return _gen;
  }

  /* ════════════════════════════════════════════════════════════════
     DEPLOY BUBBLE
  ════════════════════════════════════════════════════════════════ */
  function _deployBubble(gen) {
    if (gen.bubbleActive || gen.bubbleHP <= 0) return;
    _playBubbleDeploy();
    gen.bubble = _buildBubbleMesh();
    gen.bubble.position.copy(gen.group.position);
    if (_scene) _scene.add(gen.bubble);
    gen.bubbleActive = true;
    gen.bubbleHP = BUBBLE_HP_MAX;
    window._shieldBubbleActive = true;
  }

  /* ════════════════════════════════════════════════════════════════
     DEATH
  ════════════════════════════════════════════════════════════════ */
  function _killGen(gen) {
    if (gen.dead) return;
    gen.dead = true;
    gen.deathTimer = 0;

    /* Collapse bubble immediately on death */
    if (gen.bubbleActive && gen.bubble) {
      _collapseBubble(gen);
    }
    window._shieldBubbleActive = false;

    /* Clear shield multiplier from all allies */
    var enemies = (window.Enemies && window.Enemies.getAll) ? window.Enemies.getAll() : [];
    var i;
    for (i = 0; i < enemies.length; i++) {
      if (enemies[i]) enemies[i]._shieldDamageMultiplier = 1.0;
    }

    /* Score */
    if (window.player && window.player.score !== undefined) {
      window.player.score += SCORE_REWARD;
    }

    /* Toast */
    if (window.HUD && window.HUD.showToast) {
      window.HUD.showToast('SHIELD GENERATOR DESTROYED');
    }
  }

  /* ════════════════════════════════════════════════════════════════
     TAKE DAMAGE (public — called by bullet/damage systems)
  ════════════════════════════════════════════════════════════════ */
  function takeDamage(amount) {
    if (!_gen || _gen.dead) return;

    /* Hitting the generator also damages the bubble */
    if (_gen.bubbleActive) {
      _gen.bubbleHP -= amount;
      _playBubbleHit();
      if (_gen.bubble) {
        var worldPos = new THREE.Vector3();
        _gen.bubble.getWorldPosition(worldPos);
        _spawnRipple(worldPos);
      }
      if (_gen.bubbleHP <= 0) {
        _collapseBubble(_gen);
      }
    }

    _gen.hp -= amount;
    if (_gen.hp <= 0) {
      _killGen(_gen);
    }
  }

  /* ════════════════════════════════════════════════════════════════
     UPDATE HELPERS
  ════════════════════════════════════════════════════════════════ */
  function _updateShards(dt) {
    var i;
    for (i = _shards.length - 1; i >= 0; i--) {
      var s = _shards[i];
      s._age += dt;
      s.position.x += s._vel.x * dt;
      s.position.y += s._vel.y * dt;
      s.position.z += s._vel.z * dt;
      s._vel.y -= 6 * dt;
      s.rotation.x += s._rot.x * dt;
      s.rotation.y += s._rot.y * dt;
      s.rotation.z += s._rot.z * dt;
      s.material.opacity = Math.max(0, 0.9 - s._age / 1.2);
      if (s._age > 1.2) {
        if (_scene) _scene.remove(s);
        _shards.splice(i, 1);
      }
    }
  }

  function _updateRipples(dt) {
    var i;
    for (i = _ripples.length - 1; i >= 0; i--) {
      var r = _ripples[i];
      r._age += dt;
      var progress = r._age / r._lifetime;
      var sc = 1.0 + progress * 2.5;
      r.scale.set(sc, sc, sc);
      r.material.opacity = Math.max(0, 0.85 * (1 - progress));
      if (r._age >= r._lifetime) {
        if (_scene) _scene.remove(r);
        _ripples.splice(i, 1);
      }
    }
  }

  function _updateBubble(gen, dt) {
    if (!gen.bubbleActive || !gen.bubble) return;

    /* Bubble follows generator */
    gen.bubble.position.copy(gen.group.position);

    /* Slow pulse scale: 1.0 → 1.05 → 1.0 */
    gen.pulsePhase += dt * 1.8;
    var sc = 1.0 + 0.05 * Math.sin(gen.pulsePhase);
    gen.bubble.scale.set(sc, sc, sc);

    /* Check if any ally is within ALLY_SCAN_DIST and deploy bubble */
    if (!gen.bubbleActive) {
      var enemies = (window.Enemies && window.Enemies.getAll) ? window.Enemies.getAll() : [];
      var gp = gen.group.position;
      var j;
      for (j = 0; j < enemies.length; j++) {
        var ally = enemies[j];
        if (!ally || !ally.position) continue;
        var dx2 = ally.position.x - gp.x;
        var dz2 = ally.position.z - gp.z;
        if (Math.sqrt(dx2 * dx2 + dz2 * dz2) < ALLY_SCAN_DIST) {
          _deployBubble(gen);
          break;
        }
      }
    }
  }

  function _scanAndDeployBubble(gen) {
    if (gen.bubbleActive || gen.bubbleHP <= 0) return;
    var enemies = (window.Enemies && window.Enemies.getAll) ? window.Enemies.getAll() : [];
    var gp = gen.group.position;
    var i;
    for (i = 0; i < enemies.length; i++) {
      var ally = enemies[i];
      if (!ally || !ally.position) continue;
      var dx = ally.position.x - gp.x;
      var dz = ally.position.z - gp.z;
      if (Math.sqrt(dx * dx + dz * dz) < ALLY_SCAN_DIST) {
        _deployBubble(gen);
        return;
      }
    }
  }

  function _doDeathCollapse(gen, dt) {
    gen.deathTimer += dt;
    var t = Math.min(gen.deathTimer / 0.7, 1);
    gen.group.rotation.x = t * (Math.PI / 2);
    if (gen.deathTimer > 1.0) {
      if (_scene) _scene.remove(gen.group);
      _gen = null;
    }
  }

  /* ════════════════════════════════════════════════════════════════
     INIT
  ════════════════════════════════════════════════════════════════ */
  function init(scene, camera) {
    _scene  = scene  || window._gameScene;
    _camera = camera || window._camera;
    _gen    = null;
    _ripples = [];
    _shards  = [];
    window._shieldBubbleActive = false;

    /* Hook bullet detection */
    var prev = window._onShotFired;
    window._onShotFired = function (pos, dir) {
      if (prev) prev(pos, dir);
      _checkBullet(pos, dir);
    };
  }

  /* ════════════════════════════════════════════════════════════════
     UPDATE  (call every frame with delta-time in seconds)
  ════════════════════════════════════════════════════════════════ */
  function update(dt) {
    _updateShards(dt);
    _updateRipples(dt);

    if (!_gen) return;

    if (_gen.dead) {
      _doDeathCollapse(_gen, dt);
      return;
    }

    /* Scan for allies to protect if bubble is not yet deployed */
    _scanAndDeployBubble(_gen);

    /* Pulse and track bubble */
    if (_gen.bubbleActive && _gen.bubble) {
      _updateBubble(_gen, dt);
    }

    /* Generator retreats from player — hang back from combat */
    _camera = _camera || window._camera;
    if (_camera) {
      var gp = _gen.group.position;
      var cp = _camera.position;
      var dx = cp.x - gp.x;
      var dz = cp.z - gp.z;
      var dist = Math.sqrt(dx * dx + dz * dz);

      /* Face away from player */
      _gen.group.rotation.y = Math.atan2(dx, dz) + Math.PI;

      /* Keep at least 10 units from player */
      if (dist < 10) {
        var speed = 1.5 * dt;
        _gen.group.position.x -= (dx / dist) * speed;
        _gen.group.position.z -= (dz / dist) * speed;
      }
    }
  }

  /* ════════════════════════════════════════════════════════════════
     RESET
  ════════════════════════════════════════════════════════════════ */
  function reset() {
    if (_gen) {
      if (_gen.bubble && _scene) _scene.remove(_gen.bubble);
      if (_gen.group && _scene) _scene.remove(_gen.group);
      _gen = null;
    }
    var i;
    for (i = 0; i < _shards.length; i++) {
      if (_scene) _scene.remove(_shards[i]);
    }
    _shards = [];
    for (i = 0; i < _ripples.length; i++) {
      if (_scene) _scene.remove(_ripples[i]);
    }
    _ripples = [];
    window._shieldBubbleActive = false;
  }

  /* ════════════════════════════════════════════════════════════════
     PUBLIC API
  ════════════════════════════════════════════════════════════════ */
  return {
    init:       init,
    update:     update,
    spawn:      spawn,
    reset:      reset,
    takeDamage: takeDamage
  };
})();
