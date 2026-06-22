/* ════════════════════════════════════════════════════════════════════
 *  SUICIDE-BOMBER.JS — Kamikaze Assault Enemy
 *  ─────────────────────────────────────────────────────────────────
 *  A fanatical soldier type that sprints toward the player and
 *  detonates at close range. Standard military-themed enemy (as seen
 *  in Call of Duty / Battlefield). Does NOT shoot — charges only.
 *
 *  Public API (window.SuicideBomber):
 *    SuicideBomber.init(scene, camera)  — call once after scene ready
 *    SuicideBomber.update(delta)        — per-frame tick
 *    SuicideBomber.spawn(x, z)         — spawn a bomber at world pos
 *    SuicideBomber.reset()             — clear all active bombers
 *
 *  Global flags set by this module:
 *    window._bomberActive              — true while any bomber alive
 *    window._onBomberSpawned           — hook(bomber) called on spawn
 * ═════════════════════════════════════════════════════════════════ */
window.SuicideBomber = (function () {
  'use strict';

  /* ── Constants ──────────────────────────────────────────────── */
  var MOVE_SPEED       = 7;      // units per second — faster than normal enemies
  var DETONATE_RANGE   = 2;      // distance at which countdown begins (units)
  var COUNTDOWN_SECS   = 3;      // seconds from start of beep to BOOM
  var EXPLOSION_RADIUS = 6;      // blast radius (units)
  var EXPLOSION_DAMAGE = 80;     // damage dealt to player
  var HUD_WARN_RANGE   = 12;     // distance that triggers HUD warning (units)
  var MAX_HP           = 60;     // can be killed before detonating
  var BODY_COLOR       = 0xCC2222; // red uniform — danger indicator
  var BEEP_INTERVAL    = 0.5;    // seconds between each beep tone

  /* ── Private state ──────────────────────────────────────────── */
  var _scene    = null;
  var _camera   = null;
  var _bombers  = [];            // array of active bomber objects
  var _audioCtx = null;
  var _hudEl    = null;          // HUD warning element (lazy-created)
  var _hudVisible = false;

  /* ── Internal helpers ───────────────────────────────────────── */

  function _getScene() {
    return _scene ||
      (window.GameManager && window.GameManager.getScene && window.GameManager.getScene());
  }

  function _getPlayer() {
    return window.GameManager && window.GameManager.getPlayer &&
           window.GameManager.getPlayer();
  }

  function _getAudioCtx() {
    if (!_audioCtx) {
      try {
        _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      } catch (e) { /* no audio */ }
    }
    return _audioCtx;
  }

  /* Short "beep beep" warning tone played during countdown */
  function _playBeep(urgency) {
    var ctx = _getAudioCtx();
    if (!ctx) return;
    var osc  = ctx.createOscillator();
    var gain = ctx.createGain();
    /* frequency rises with urgency (0→1) so beeps get higher as BOOM approaches */
    var freq = 600 + urgency * 800;
    osc.type = 'square';
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.setValueAtTime(0.25, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.12);
  }

  /* Orange fireball + shockwave ring for the explosion */
  function _spawnExplosionVFX(position) {
    var sc = _getScene();
    if (!sc) return;

    /* Fireball */
    var fbGeo = new THREE.SphereGeometry(EXPLOSION_RADIUS * 0.55, 12, 8);
    var fbMat = new THREE.MeshBasicMaterial({
      color: 0xff6600, transparent: true, opacity: 0.9, depthWrite: false
    });
    var fireball = new THREE.Mesh(fbGeo, fbMat);
    fireball.position.copy(position);
    fireball.position.y += 1;
    sc.add(fireball);

    /* Inner white-hot core */
    var coreGeo = new THREE.SphereGeometry(EXPLOSION_RADIUS * 0.25, 10, 6);
    var coreMat = new THREE.MeshBasicMaterial({
      color: 0xffffff, transparent: true, opacity: 0.95, depthWrite: false
    });
    var core = new THREE.Mesh(coreGeo, coreMat);
    core.position.copy(position);
    core.position.y += 1;
    sc.add(core);

    /* Ground shockwave ring */
    var ringGeo = new THREE.RingGeometry(0.1, 0.5, 24);
    var ringMat = new THREE.MeshBasicMaterial({
      color: 0xff8800, transparent: true, opacity: 0.7,
      side: THREE.DoubleSide, depthWrite: false
    });
    var ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.copy(position);
    ring.position.y += 0.05;
    sc.add(ring);

    /* Point light flash */
    var light = new THREE.PointLight(0xff6600, 6, EXPLOSION_RADIUS * 2.5);
    light.position.copy(position);
    light.position.y += 1.5;
    sc.add(light);

    /* Animate: expand + fade over ~0.8 s */
    var age = 0;
    var dur = 0.8;
    var _animId;

    function _step(ts) {
      if (!_stepLast) { _stepLast = ts; }
      var dt = Math.min((ts - _stepLast) / 1000, 0.1);
      _stepLast = ts;
      age += dt;
      var t = Math.min(age / dur, 1);

      var fbScale = 1 + t * 2.5;
      fireball.scale.setScalar(fbScale);
      fbMat.opacity = (1 - t) * 0.9;

      core.scale.setScalar(1 + t * 1.5);
      coreMat.opacity = (1 - t) * 0.95;

      var rScale = 1 + t * (EXPLOSION_RADIUS / 0.5);
      ring.scale.setScalar(rScale);
      ringMat.opacity = (1 - t) * 0.65;

      light.intensity = 6 * (1 - t);

      if (t < 1) {
        _animId = requestAnimationFrame(_step);
      } else {
        sc.remove(fireball); fbGeo.dispose(); fbMat.dispose();
        sc.remove(core);     coreGeo.dispose(); coreMat.dispose();
        sc.remove(ring);     ringGeo.dispose(); ringMat.dispose();
        sc.remove(light);
      }
    }
    var _stepLast = null;
    _animId = requestAnimationFrame(_step);
  }

  /* Damage the player if within explosion radius */
  function _doExplosionDamage(position) {
    var player = _getPlayer();
    if (!player) return;
    var px = player.position ? player.position.x : (player.x || 0);
    var pz = player.position ? player.position.z : (player.z || 0);
    var dx = px - position.x;
    var dz = pz - position.z;
    var dist = Math.sqrt(dx * dx + dz * dz);
    if (dist <= EXPLOSION_RADIUS) {
      /* Damage scales from full at center to 10% at edge */
      var scale = Math.max(0, 1 - dist / EXPLOSION_RADIUS);
      var dmg = Math.round(EXPLOSION_DAMAGE * (0.1 + scale * 0.9));
      if (window.GameManager && window.GameManager.damagePlayer) {
        window.GameManager.damagePlayer(dmg, 'explosion');
      } else if (window.playerHealth !== undefined) {
        window.playerHealth = Math.max(0, window.playerHealth - dmg);
      }
      /* Screen shake via AudioSystem if available */
      if (window.AudioSystem && window.AudioSystem.playExplosion) {
        window.AudioSystem.playExplosion();
      }
    }
  }

  /* Build the THREE.js mesh for one bomber */
  function _buildMesh() {
    var group = new THREE.Group();

    /* Body (torso) */
    var bodyGeo = new THREE.BoxGeometry(0.55, 0.7, 0.35);
    var bodyMat = new THREE.MeshLambertMaterial({ color: BODY_COLOR });
    var body    = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 1.05;
    group.add(body);

    /* Head */
    var headGeo = new THREE.BoxGeometry(0.38, 0.38, 0.38);
    var headMat = new THREE.MeshLambertMaterial({ color: 0xc8a070 });
    var head    = new THREE.Mesh(headGeo, headMat);
    head.position.y = 1.64;
    group.add(head);

    /* Legs */
    var legGeo = new THREE.BoxGeometry(0.20, 0.55, 0.22);
    var legMat = new THREE.MeshLambertMaterial({ color: 0x883333 });
    var legL   = new THREE.Mesh(legGeo, legMat);
    var legR   = new THREE.Mesh(legGeo, legMat);
    legL.position.set(-0.14, 0.50, 0);
    legR.position.set( 0.14, 0.50, 0);
    group.add(legL);
    group.add(legR);

    /* Arms (vest / bomb pack look) */
    var armGeo = new THREE.BoxGeometry(0.18, 0.55, 0.22);
    var armMat = new THREE.MeshLambertMaterial({ color: 0x993333 });
    var armL   = new THREE.Mesh(armGeo, armMat);
    var armR   = new THREE.Mesh(armGeo, armMat);
    armL.position.set(-0.38, 1.05, 0);
    armR.position.set( 0.38, 1.05, 0);
    group.add(armL);
    group.add(armR);

    /* Chest bomb vest — dark grey blocks strapped to torso */
    var vestGeo = new THREE.BoxGeometry(0.60, 0.20, 0.42);
    var vestMat = new THREE.MeshLambertMaterial({ color: 0x222222 });
    var vest    = new THREE.Mesh(vestGeo, vestMat);
    vest.position.y = 1.08;
    group.add(vest);

    return group;
  }

  /* ── HUD warning management ─────────────────────────────────── */

  function _ensureHudEl() {
    if (_hudEl) return _hudEl;
    _hudEl = document.createElement('div');
    _hudEl.id = 'bomber-hud-warning';
    _hudEl.style.cssText = [
      'position:fixed',
      'top:130px',
      'left:50%',
      'transform:translateX(-50%)',
      'background:rgba(200,0,0,0.2)',
      'border:2px solid #CC2222',
      'color:#ff4444',
      'padding:4px 18px',
      'border-radius:5px',
      'font-size:13px',
      'font-family:monospace',
      'font-weight:bold',
      'z-index:202',
      'pointer-events:none',
      'letter-spacing:1px',
      'display:none',
      'text-shadow:0 0 8px rgba(255,0,0,0.7)',
      'animation:bomberBlink 0.6s step-start infinite'
    ].join(';');
    _hudEl.textContent = '⚡ BOMBER INCOMING!';
    /* Inject keyframes once */
    if (!document.getElementById('bomber-blink-style')) {
      var sty = document.createElement('style');
      sty.id = 'bomber-blink-style';
      sty.textContent = '@keyframes bomberBlink{0%,100%{opacity:1}50%{opacity:0.35}}';
      document.head.appendChild(sty);
    }
    document.body.appendChild(_hudEl);
    return _hudEl;
  }

  function _showHudWarning(show) {
    if (_hudVisible === show) return;
    _hudVisible = show;
    var el = _ensureHudEl();
    el.style.display = show ? 'block' : 'none';
  }

  /* ── Update _bomberActive flag ───────────────────────────────── */
  function _syncActiveFlag() {
    window._bomberActive = _bombers.length > 0;
  }

  /* ── Detonate a bomber ──────────────────────────────────────── */
  function _detonate(bomber) {
    if (bomber.dead) return;
    bomber.dead = true;
    bomber.detonating = false;

    var sc = _getScene();
    if (sc && bomber.mesh) {
      sc.remove(bomber.mesh);
    }

    _spawnExplosionVFX(bomber.worldPos);
    _doExplosionDamage(bomber.worldPos);

    /* Remove from list */
    _bombers = _bombers.filter(function (b) { return b !== bomber; });
    _syncActiveFlag();
  }

  /* ── Kill a bomber (shot before detonation) ─────────────────── */
  function _killBomber(bomber) {
    if (bomber.dead) return;
    bomber.dead = true;
    bomber.detonating = false;

    var sc = _getScene();
    if (sc && bomber.mesh) {
      sc.remove(bomber.mesh);
    }

    /* Small puff effect on death */
    if (sc) {
      var puffGeo = new THREE.SphereGeometry(0.6, 8, 6);
      var puffMat = new THREE.MeshBasicMaterial({
        color: 0x884444, transparent: true, opacity: 0.6, depthWrite: false
      });
      var puff = new THREE.Mesh(puffGeo, puffMat);
      puff.position.copy(bomber.worldPos);
      puff.position.y += 1.2;
      sc.add(puff);
      var puffAge = 0;
      var puffStep = function () {
        puffAge += 0.05;
        puff.scale.setScalar(1 + puffAge * 3);
        puffMat.opacity = Math.max(0, 0.6 - puffAge * 2);
        if (puffAge < 0.4) {
          requestAnimationFrame(puffStep);
        } else {
          sc.remove(puff); puffGeo.dispose(); puffMat.dispose();
        }
      };
      requestAnimationFrame(puffStep);
    }

    if (window.AudioSystem && window.AudioSystem.playEnemyDeath) {
      window.AudioSystem.playEnemyDeath();
    }

    _bombers = _bombers.filter(function (b) { return b !== bomber; });
    _syncActiveFlag();
  }

  /* ── Public: apply damage to a bomber (called by game hit system) */
  function _takeDamage(bomber, amount) {
    if (bomber.dead) return;
    bomber.hp -= amount;
    if (bomber.hp <= 0) {
      _killBomber(bomber);
    }
  }

  /* ═══════════════════════════════════════════════════════════════
   *  PUBLIC API
   * ═══════════════════════════════════════════════════════════════ */

  /**
   * init(scene, camera)
   * Call once when the Three.js scene is ready.
   */
  function init(scene, camera) {
    _scene  = scene  || _getScene();
    _camera = camera || (window.GameManager && window.GameManager.getCamera &&
                         window.GameManager.getCamera());
    _bombers = [];
    window._bomberActive = false;
  }

  /**
   * spawn(x, z)
   * Place one suicide bomber at the given world coordinates.
   * Returns the bomber object so callers can track it.
   */
  function spawn(x, z) {
    var sc = _getScene();
    if (!sc) return null;

    var mesh = _buildMesh();
    mesh.position.set(x, 0, z);
    sc.add(mesh);

    var worldPos = new THREE.Vector3(x, 0, z);

    var bomber = {
      mesh:        mesh,
      worldPos:    worldPos,
      hp:          MAX_HP,
      maxHp:       MAX_HP,
      dead:        false,
      detonating:  false,
      countdownT:  0,
      beepTimer:   0,
      /* expose damage method on the object itself */
      takeDamage:  function (amt) { _takeDamage(bomber, amt); }
    };

    _bombers.push(bomber);
    _syncActiveFlag();

    /* Fire optional hook */
    if (typeof window._onBomberSpawned === 'function') {
      try { window._onBomberSpawned(bomber); } catch (e) {}
    }

    return bomber;
  }

  /**
   * update(delta)
   * Per-frame tick. delta is seconds since last frame.
   */
  function update(delta) {
    if (!delta || delta <= 0) return;

    var player  = _getPlayer();
    var sc      = _getScene();
    var anyNear = false;
    var i;

    for (i = _bombers.length - 1; i >= 0; i--) {
      var b = _bombers[i];
      if (b.dead) { _bombers.splice(i, 1); continue; }

      /* ── Determine distance to player ── */
      var playerX = 0, playerZ = 0;
      if (player && player.position) {
        playerX = player.position.x;
        playerZ = player.position.z;
      } else if (player) {
        playerX = player.x || 0;
        playerZ = player.z || 0;
      }

      var dx   = playerX - b.worldPos.x;
      var dz   = playerZ - b.worldPos.z;
      var dist = Math.sqrt(dx * dx + dz * dz);

      if (dist < HUD_WARN_RANGE) { anyNear = true; }

      /* ── Countdown / detonation phase ── */
      if (b.detonating) {
        b.countdownT += delta;

        /* Beep at intervals, increasing urgency */
        b.beepTimer += delta;
        if (b.beepTimer >= BEEP_INTERVAL) {
          b.beepTimer = 0;
          var urgency = Math.min(b.countdownT / COUNTDOWN_SECS, 1);
          _playBeep(urgency);
        }

        /* Visual pulse — make bomber flash red/white during countdown */
        if (b.mesh) {
          var pulse = (Math.sin(b.countdownT * Math.PI * 4) + 1) * 0.5;
          b.mesh.traverse(function (obj) {
            if (obj.isMesh && obj.material && obj.material.color) {
              var r = 0.8  + pulse * 0.2;
              var g = 0.13 * (1 - pulse);
              var bv= 0.13 * (1 - pulse);
              obj.material.color.setRGB(r, g, bv);
            }
          });
        }

        if (b.countdownT >= COUNTDOWN_SECS) {
          _detonate(b);
          continue;
        }
      } else {
        /* ── Chase phase — sprint toward player ── */
        if (dist > 0.1) {
          var nx  = dx / dist;
          var nz  = dz / dist;
          var spd = MOVE_SPEED * delta;
          b.worldPos.x += nx * spd;
          b.worldPos.z += nz * spd;
          if (b.mesh) {
            b.mesh.position.set(b.worldPos.x, 0, b.worldPos.z);
            /* Face the player */
            b.mesh.rotation.y = Math.atan2(nx, nz);
          }
        }

        /* ── Enter detonation range? Start countdown ── */
        if (dist <= DETONATE_RANGE) {
          b.detonating  = true;
          b.countdownT  = 0;
          b.beepTimer   = 0;
        }
      }
    }

    /* ── HUD warning ── */
    _showHudWarning(anyNear && _bombers.length > 0);
    _syncActiveFlag();
  }

  /**
   * reset()
   * Remove all active bombers from the scene and clear state.
   */
  function reset() {
    var sc = _getScene();
    var i;
    for (i = 0; i < _bombers.length; i++) {
      var b = _bombers[i];
      if (sc && b.mesh) {
        sc.remove(b.mesh);
      }
      b.dead = true;
    }
    _bombers = [];
    _showHudWarning(false);
    window._bomberActive = false;
  }

  /* ── Init global flag immediately ──────────────────────────── */
  window._bomberActive = false;

  return {
    init:   init,
    update: update,
    spawn:  spawn,
    reset:  reset
  };

}());
