// counter-uav.js — Anti-drone missile system (Shift+F)
// Exposes: window.CounterUAV, window._counterUavCharges

window.CounterUAV = (function () {
  'use strict';

  // ── State ─────────────────────────────────────────────────────────────────
  var _scene    = null;
  var _camera   = null;
  var _player   = null;   // THREE.Object3D or {position}

  var _charges      = 3;
  var _maxCharges   = 3;
  var _missiles     = [];
  var _hudBadge     = null;
  var _audioCtx     = null;

  // Expose charges globally so other modules can read
  window._counterUavCharges = _charges;

  // ── Geometry helpers ──────────────────────────────────────────────────────
  var _missileMat  = null;
  var _smokeMat    = null;

  function _ensureMaterials() {
    if (!_missileMat) {
      _missileMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    }
    if (!_smokeMat) {
      _smokeMat = new THREE.MeshBasicMaterial({
        color: 0x888888,
        transparent: true,
        opacity: 0.55
      });
    }
  }

  // ── HUD badge ─────────────────────────────────────────────────────────────
  function _buildHUD() {
    if (_hudBadge) return;
    _hudBadge = document.createElement('div');
    _hudBadge.id = 'counter-uav-badge';
    _hudBadge.style.cssText = [
      'position:fixed',
      'top:58px',
      'right:14px',
      'z-index:220',
      'background:rgba(0,0,0,0.62)',
      'color:#fff',
      'font:bold 13px/1 monospace',
      'padding:4px 9px',
      'border-radius:4px',
      'border:1px solid rgba(255,255,255,0.25)',
      'pointer-events:none',
      'letter-spacing:0.04em'
    ].join(';');
    document.body.appendChild(_hudBadge);
    _refreshHUD();
  }

  function _refreshHUD() {
    if (!_hudBadge) return;
    _hudBadge.textContent = '🚀 C-UAV ×' + _charges;
    _hudBadge.style.opacity = _charges > 0 ? '1' : '0.38';
    window._counterUavCharges = _charges;
  }

  // ── Audio ─────────────────────────────────────────────────────────────────
  function _playLaunchWhoosh() {
    try {
      if (!_audioCtx) {
        _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      }
      var ctx = _audioCtx;
      var gain = ctx.createGain();
      gain.gain.setValueAtTime(0.35, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
      gain.connect(ctx.destination);

      var osc = ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(200, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.5);
      osc.connect(gain);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.52);
    } catch (e) { /* audio not available */ }
  }

  // ── Explosion VFX ─────────────────────────────────────────────────────────
  function _bigExplosion(pos) {
    if (!_scene) return;
    var light = new THREE.PointLight(0xff6600, 10, 30);
    light.position.copy(pos);
    _scene.add(light);
    setTimeout(function () { _scene.remove(light); }, 400);

    var particles = [];
    for (var i = 0; i < 24; i++) {
      var sp = new THREE.Mesh(
        new THREE.SphereGeometry(0.4 + Math.random() * 0.7, 5, 5),
        new THREE.MeshBasicMaterial({
          color: i < 12 ? 0xff4400 : 0x111111,
          transparent: true,
          opacity: 0.85
        })
      );
      sp.position.copy(pos);
      var spd = 6 + Math.random() * 8;
      var phi = Math.random() * Math.PI * 2;
      var theta = Math.random() * Math.PI;
      sp.userData.vel = new THREE.Vector3(
        spd * Math.sin(theta) * Math.cos(phi),
        spd * Math.cos(theta),
        spd * Math.sin(theta) * Math.sin(phi)
      );
      sp.userData.life = 1.2 + Math.random() * 0.8;
      sp.userData.maxLife = sp.userData.life;
      _scene.add(sp);
      particles.push(sp);
    }

    var startTime = null;
    function animateExplosion(ts) {
      if (!startTime) startTime = ts;
      var elapsed = (ts - startTime) / 1000;
      var alive = false;
      for (var j = particles.length - 1; j >= 0; j--) {
        var p = particles[j];
        p.userData.life -= 0.016;
        if (p.userData.life <= 0) {
          _scene.remove(p);
          particles.splice(j, 1);
        } else {
          p.position.addScaledVector(p.userData.vel, 0.016);
          p.userData.vel.y -= 4 * 0.016;
          p.material.opacity = (p.userData.life / p.userData.maxLife) * 0.85;
          alive = true;
        }
      }
      if (alive) requestAnimationFrame(animateExplosion);
    }
    requestAnimationFrame(animateExplosion);
  }

  // ── Toast helper (uses HUD.showToast if available) ────────────────────────
  function _toast(msg, color) {
    color = color || '#ffffff';
    if (window.HUD && typeof window.HUD.showToast === 'function') {
      window.HUD.showToast(msg, 2500, color);
    } else if (window.HUD && typeof window.HUD.notifyPickup === 'function') {
      window.HUD.notifyPickup(msg, color);
    }
  }

  // ── Score helper ──────────────────────────────────────────────────────────
  function _addScore(pts) {
    if (window.ScoreSystem && typeof window.ScoreSystem.add === 'function') {
      window.ScoreSystem.add(pts);
    } else if (window.GameManager && typeof window.GameManager.addScore === 'function') {
      window.GameManager.addScore(pts);
    } else {
      window._score = (window._score || 0) + pts;
    }
  }

  // ── Aerial target hunting ─────────────────────────────────────────────────
  function _findAerialTarget() {
    // 1. Enemy helicopter
    if (window._helicopterActive && window.EnemyHelicopter) {
      return 'helicopter';
    }
    // 2. Recon balloon
    if (window._reconBalloonActive && window.ReconBalloon) {
      return 'reconBalloon';
    }
    // 3. Drone flyby (generic flag)
    if (window._droneFlyby) {
      return 'droneFlyby';
    }
    // 4. Any window.enemies entry with Y > 5
    if (window.enemies && Array.isArray(window.enemies)) {
      for (var i = 0; i < window.enemies.length; i++) {
        var e = window.enemies[i];
        if (e && e.position && e.position.y > 5) {
          return { type: 'enemy', ref: e };
        }
      }
    }
    return null;
  }

  // Returns a THREE.Vector3 for a target token, or null
  function _targetPosition(target) {
    if (!target) return null;
    if (target === 'helicopter') {
      // EnemyHelicopter keeps its group private; we approximate via a known
      // aerial position — try the internal _heliGroup via a public query.
      // Best-effort: use window._helicopterPos if available, else estimate.
      if (window._helicopterPos) return window._helicopterPos.clone();
      return new THREE.Vector3(0, 14, 0); // safe fallback
    }
    if (target === 'reconBalloon') {
      if (window._reconBalloonPos) return window._reconBalloonPos.clone();
      return new THREE.Vector3(0, 20, 0);
    }
    if (target === 'droneFlyby') {
      if (window._droneFlybyPos) return window._droneFlybyPos.clone();
      return new THREE.Vector3(0, 10, 0);
    }
    if (target && target.type === 'enemy' && target.ref) {
      return target.ref.position.clone();
    }
    return null;
  }

  // ── Apply 200 damage to aerial target ────────────────────────────────────
  function _damageTarget(target, missilePos) {
    if (!target) return false;
    var destroyed = false;

    if (target === 'helicopter') {
      if (window.EnemyHelicopter && typeof window.EnemyHelicopter.takeDamage === 'function') {
        // Pass a fake hit object that satisfies the fuselage check
        var fakeHit = { userData: { isHeliFuselage: true } };
        var wasActive = window._helicopterActive;
        window.EnemyHelicopter.takeDamage(200, fakeHit);
        // Check if helicopter was destroyed (flag flipped)
        if (wasActive && !window._helicopterActive) {
          destroyed = true;
        }
      }
    } else if (target === 'reconBalloon') {
      if (window.ReconBalloon && typeof window.ReconBalloon.takeDamage === 'function') {
        window.ReconBalloon.takeDamage(200);
      } else {
        // Force shoot-down via the AA gun flag
        window._aaGunsFired = true;
        window._reconBalloonActive = false;
      }
    } else if (target === 'droneFlyby') {
      window._droneFlyby = false;
    } else if (target && target.type === 'enemy' && target.ref) {
      var ref = target.ref;
      if (typeof ref.takeDamage === 'function') {
        ref.takeDamage(200);
      } else if (ref.userData) {
        ref.userData.hp = (ref.userData.hp || 0) - 200;
      }
    }

    _bigExplosion(missilePos);
    return destroyed;
  }

  // ── Missile object factory ────────────────────────────────────────────────
  function _spawnMissile() {
    _ensureMaterials();
    if (!_scene || !_player) return null;

    var group = new THREE.Group();

    // Body
    var body = new THREE.Mesh(
      new THREE.CylinderGeometry(0.06, 0.06, 0.4, 8),
      _missileMat
    );
    group.add(body);

    // Nose cone
    var nose = new THREE.Mesh(
      new THREE.ConeGeometry(0.06, 0.14, 8),
      _missileMat
    );
    nose.position.y = 0.27;
    group.add(nose);

    // Fins (2 crossed quads simulated with thin boxes)
    var finMat = new THREE.MeshBasicMaterial({ color: 0xdddddd });
    for (var f = 0; f < 2; f++) {
      var fin = new THREE.Mesh(
        new THREE.BoxGeometry(0.18, 0.06, 0.02),
        finMat
      );
      fin.position.y = -0.18;
      fin.rotation.y = f * Math.PI / 2;
      group.add(fin);
    }

    // Smoke trail particles (8 spheres, animated in update)
    var trail = [];
    for (var s = 0; s < 8; s++) {
      var sm = new THREE.Mesh(
        new THREE.SphereGeometry(0.045, 4, 4),
        new THREE.MeshBasicMaterial({ color: 0x888888, transparent: true, opacity: 0.5 })
      );
      sm.visible = false;
      _scene.add(sm);
      trail.push({ mesh: sm, life: 0, maxLife: 0.6 });
    }

    // Spawn just in front of camera/player
    var spawnPos = _player.position.clone();
    var forward = new THREE.Vector3(0, 0, -1);
    if (_camera) {
      forward.applyQuaternion(_camera.quaternion);
    }
    spawnPos.addScaledVector(forward, 1.5);
    spawnPos.y += 0.8; // slight lift
    group.position.copy(spawnPos);

    _scene.add(group);

    var target = _findAerialTarget();

    return {
      group:      group,
      trail:      trail,
      trailHead:  0,     // circular index for next trail drop
      trailTimer: 0,
      velocity:   forward.clone().multiplyScalar(25),
      target:     target,
      noTarget:   !target,
      life:       8,     // max seconds before self-destruct
      startY:     spawnPos.y,
      dead:       false
    };
  }

  // ── Per-frame missile update ───────────────────────────────────────────────
  function _updateMissile(m, dt) {
    if (m.dead) return true;

    m.life -= dt;
    if (m.life <= 0) {
      _destroyMissile(m, false);
      return true;
    }

    var pos = m.group.position;
    var SPEED = 25;
    var TURN  = Math.PI / 2; // 90°/s in radians

    // Homing
    if (!m.noTarget) {
      var tpos = _targetPosition(m.target);
      if (tpos) {
        var desired = tpos.clone().sub(pos).normalize().multiplyScalar(SPEED);
        var maxDelta = TURN * dt * SPEED;
        var diff = desired.clone().sub(m.velocity);
        if (diff.length() > maxDelta) {
          diff.normalize().multiplyScalar(maxDelta);
        }
        m.velocity.add(diff);
        // Clamp to speed
        var spd = m.velocity.length();
        if (spd > SPEED * 1.05) m.velocity.multiplyScalar(SPEED / spd);

        // Check proximity hit
        var dist = pos.distanceTo(tpos);
        if (dist < 2.5) {
          var wasHeli = m.target === 'helicopter';
          var destroyed = _damageTarget(m.target, pos.clone());
          if (wasHeli && destroyed) {
            _addScore(500);
            _toast('SPLASH ONE!', '#ff9900');
          }
          _destroyMissile(m, true);
          return true;
        }
      } else {
        // Target gone — self-destruct
        _bigExplosion(pos.clone());
        _destroyMissile(m, false);
        return true;
      }
    } else {
      // No target: fly straight up
      m.velocity.set(0, SPEED, 0);
      if (pos.y - m.startY >= 30) {
        _bigExplosion(pos.clone());
        _destroyMissile(m, false);
        return true;
      }
    }

    // Move
    m.group.position.addScaledVector(m.velocity, dt);

    // Orient missile along velocity
    if (m.velocity.lengthSq() > 0.001) {
      var dir = m.velocity.clone().normalize();
      // CylinderGeometry Y-axis is along its length; aim +Y toward direction
      var up = new THREE.Vector3(0, 1, 0);
      var q = new THREE.Quaternion().setFromUnitVectors(up, dir);
      m.group.quaternion.copy(q);
    }

    // Smoke trail
    m.trailTimer -= dt;
    if (m.trailTimer <= 0) {
      m.trailTimer = 0.04; // emit every 40ms
      var slot = m.trail[m.trailHead % m.trail.length];
      m.trailHead++;
      slot.mesh.position.copy(m.group.position);
      // offset slightly behind missile
      var back = m.velocity.clone().normalize().multiplyScalar(-0.3);
      slot.mesh.position.add(back);
      slot.mesh.visible = true;
      slot.life = slot.maxLife;
      slot.mesh.material.opacity = 0.5;
    }
    // Fade existing trail particles
    for (var i = 0; i < m.trail.length; i++) {
      var t = m.trail[i];
      if (!t.mesh.visible) continue;
      t.life -= dt;
      if (t.life <= 0) {
        t.mesh.visible = false;
      } else {
        t.mesh.material.opacity = (t.life / t.maxLife) * 0.5;
        var sc = 0.5 + (1 - t.life / t.maxLife) * 0.8;
        t.mesh.scale.setScalar(sc);
      }
    }

    return false; // still alive
  }

  function _destroyMissile(m, exploded) {
    m.dead = true;
    if (_scene) {
      _scene.remove(m.group);
      for (var i = 0; i < m.trail.length; i++) {
        _scene.remove(m.trail[i].mesh);
      }
    }
    if (!exploded) {
      // small pop
      if (_scene) {
        var p = new THREE.PointLight(0xff8800, 3, 8);
        p.position.copy(m.group.position);
        _scene.add(p);
        setTimeout(function () { if (_scene) _scene.remove(p); }, 200);
      }
    }
  }

  // ── Keyboard listener ─────────────────────────────────────────────────────
  var _keyHandler = null;

  function _bindKeys() {
    _keyHandler = function (e) {
      // Shift+F
      if (e.code === 'KeyF' && e.shiftKey) {
        e.preventDefault();
        fire();
      }
    };
    window.addEventListener('keydown', _keyHandler);
  }

  // ── Public API ────────────────────────────────────────────────────────────

  function init(scene, camera, player) {
    _scene  = scene;
    _camera = camera;
    _player = player;
    _charges = _maxCharges;
    window._counterUavCharges = _charges;
    _buildHUD();
    _bindKeys();
  }

  function fire() {
    if (_charges <= 0) {
      _toast('C-UAV: NO CHARGES', '#ff4444');
      return false;
    }
    if (!_scene || !_player) return false;

    _charges--;
    window._counterUavCharges = _charges;
    _refreshHUD();

    _playLaunchWhoosh();

    var m = _spawnMissile();
    if (m) {
      _missiles.push(m);
      if (m.noTarget) {
        _toast('C-UAV FIRED — NO AERIAL TARGET', '#aaaaaa');
      } else {
        _toast('C-UAV MISSILE AWAY!', '#00ffcc');
      }
    }
    return true;
  }

  function update(dt) {
    for (var i = _missiles.length - 1; i >= 0; i--) {
      var done = _updateMissile(_missiles[i], dt);
      if (done) {
        _missiles.splice(i, 1);
      }
    }
  }

  function reset() {
    // Clean up live missiles
    for (var i = 0; i < _missiles.length; i++) {
      _destroyMissile(_missiles[i], false);
    }
    _missiles = [];
    _charges = _maxCharges;
    window._counterUavCharges = _charges;
    _refreshHUD();
  }

  // Expose globals immediately
  window._counterUavCharges = _charges;

  return {
    init:   init,
    update: update,
    fire:   fire,
    reset:  reset
  };
})();
