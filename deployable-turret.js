// deployable-turret.js — Player-deployable auto-targeting turret
// Press F5 to deploy/retrieve. Max 2 turrets. Third F5 picks up nearest (range 3 units).
// Turret AI: targets nearest enemy within 15 units, auto-fires every 0.15s, 12 dmg/shot.
// HP: 150. Barrel flash light (0.05s). "DEPLOYED" DOM badge. Health bar above turret.
// Audio: square wave at 220 Hz via AudioContext.
// Public API: init(scene, camera), update(dt), deploy(), reset()

window.DeployableTurret = (function () {
  'use strict';

  // ─── Private state ────────────────────────────────────────────────────────

  var _scene = null;
  var _camera = null;

  var _turrets = [];          // active turret objects
  var _MAX_TURRETS = 2;
  var _FIRE_RATE = 0.15;      // seconds between shots
  var _RANGE = 15;            // targeting range in world units
  var _DAMAGE = 12;           // damage per shot
  var _MAX_HP = 150;

  var _keyDown = false;       // debounce F5

  // DOM overlay container for badges / health bars
  var _overlay = null;

  // ─── Mesh builder ─────────────────────────────────────────────────────────

  function _buildTurretMesh() {
    var group = new THREE.Group();

    // Base — dark gray box
    var baseMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
    var base = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.3, 0.6), baseMat);
    base.position.y = 0.15;
    group.add(base);

    // Rotating drum — mounted on base
    var drumMat = new THREE.MeshLambertMaterial({ color: 0x222222 });
    var drum = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.4, 8), drumMat);
    drum.position.y = 0.5;
    group.add(drum);

    // Twin barrels — two cylinders side by side, parented to a pivot group
    var barrelPivot = new THREE.Group();
    barrelPivot.position.y = 0.5; // same height as drum
    group.add(barrelPivot);

    var barrelMat = new THREE.MeshLambertMaterial({ color: 0x111111 });
    var leftBarrel = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.5, 6), barrelMat);
    leftBarrel.rotation.x = Math.PI / 2; // point forward (z)
    leftBarrel.position.set(-0.1, 0, -0.4);
    barrelPivot.add(leftBarrel);

    var rightBarrel = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.5, 6), barrelMat);
    rightBarrel.rotation.x = Math.PI / 2;
    rightBarrel.position.set(0.1, 0, -0.4);
    barrelPivot.add(rightBarrel);

    // Barrel flash light — initially off
    var flash = new THREE.PointLight(0xFF6600, 0, 1.5);
    flash.position.set(0, 0.5, -0.65);
    group.add(flash);

    return { group: group, drum: drum, barrelPivot: barrelPivot, flash: flash };
  }

  // ─── DOM overlay helpers ──────────────────────────────────────────────────

  function _ensureOverlay() {
    if (_overlay) return;
    _overlay = document.createElement('div');
    _overlay.id = 'deployable-turret-overlay';
    _overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:240;overflow:hidden';
    document.body.appendChild(_overlay);
  }

  function _createTurretDOM(t) {
    _ensureOverlay();

    // Badge label "🔫 AUTO TURRET"
    var badge = document.createElement('div');
    badge.style.cssText = [
      'position:absolute',
      'transform:translate(-50%,-100%)',
      'background:rgba(0,0,0,0.6)',
      'border:1px solid #ff8800',
      'color:#ffaa44',
      'font-family:monospace',
      'font-size:10px',
      'padding:2px 7px',
      'border-radius:3px',
      'white-space:nowrap',
      'pointer-events:none',
    ].join(';');
    badge.textContent = '🔫 AUTO TURRET';
    _overlay.appendChild(badge);
    t.domBadge = badge;

    // Health bar wrapper
    var hpWrap = document.createElement('div');
    hpWrap.style.cssText = [
      'position:absolute',
      'transform:translate(-50%,0)',
      'width:60px',
      'height:5px',
      'background:rgba(0,0,0,0.5)',
      'border:1px solid #555',
      'border-radius:2px',
      'overflow:hidden',
      'pointer-events:none',
    ].join(';');

    var hpFill = document.createElement('div');
    hpFill.style.cssText = 'width:100%;height:100%;background:#44ff44;border-radius:2px;transition:width 0.1s';
    hpWrap.appendChild(hpFill);
    _overlay.appendChild(hpWrap);

    t.domHpWrap = hpWrap;
    t.domHpFill = hpFill;
  }

  function _removeTurretDOM(t) {
    if (t.domBadge && t.domBadge.parentNode) t.domBadge.parentNode.removeChild(t.domBadge);
    if (t.domHpWrap && t.domHpWrap.parentNode) t.domHpWrap.parentNode.removeChild(t.domHpWrap);
    t.domBadge = null;
    t.domHpWrap = null;
    t.domHpFill = null;
  }

  // Project a world position to screen coords; returns null if behind camera
  function _worldToScreen(worldPos) {
    if (!_camera) return null;
    var v = new THREE.Vector3(worldPos.x, worldPos.y, worldPos.z);
    v.project(_camera);
    if (v.z > 1) return null; // behind camera
    return {
      x: (v.x * 0.5 + 0.5) * window.innerWidth,
      y: (-v.y * 0.5 + 0.5) * window.innerHeight
    };
  }

  // ─── Toast helper ─────────────────────────────────────────────────────────

  function _toast(text, color) {
    try {
      if (window.HUD && window.HUD.showToast) {
        window.HUD.showToast(text, 2500, color || '#ffaa44');
      }
    } catch (e) {}
  }

  // ─── Audio ────────────────────────────────────────────────────────────────

  function _playFireSFX() {
    var ctx = window._audioCtx;
    if (!ctx) {
      try {
        if (typeof AudioContext !== 'undefined') {
          window._audioCtx = new AudioContext();
          ctx = window._audioCtx;
        } else if (typeof webkitAudioContext !== 'undefined') {
          window._audioCtx = new webkitAudioContext(); // eslint-disable-line new-cap
          ctx = window._audioCtx;
        }
      } catch (e) { return; }
    }
    if (!ctx) return;
    try {
      var osc = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(220, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(110, ctx.currentTime + 0.06);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.08);
    } catch (e) {}
  }

  // ─── Explosion effect when turret is destroyed ────────────────────────────

  function _explodeTurret(t) {
    if (!_scene) return;
    var pos = t.group.position;

    // Orange flash
    var flashLight = new THREE.PointLight(0xFF6600, 10, 6);
    flashLight.position.copy(pos);
    _scene.add(flashLight);
    var flashStart = null;
    function fadeFlash(ts) {
      if (!flashStart) flashStart = ts;
      var elapsed = (ts - flashStart) / 400;
      if (elapsed < 1) {
        flashLight.intensity = 10 * (1 - elapsed);
        requestAnimationFrame(fadeFlash);
      } else {
        try { _scene.remove(flashLight); } catch (e) {}
      }
    }
    requestAnimationFrame(fadeFlash);

    // Debris parts
    var debrisMat = new THREE.MeshLambertMaterial({ color: 0x555555 });
    var parts = [];
    var pi;
    for (pi = 0; pi < 8; pi++) {
      var pMesh = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.08), debrisMat);
      pMesh.position.copy(pos);
      _scene.add(pMesh);
      var angle = Math.random() * Math.PI * 2;
      var speed = 1.5 + Math.random() * 3;
      parts.push({
        mesh: pMesh,
        vel: { x: Math.cos(angle) * speed, y: 3 + Math.random() * 3, z: Math.sin(angle) * speed },
        life: 1.2 + Math.random() * 0.6
      });
    }

    // Smoke puffs
    var smokeMat = new THREE.MeshBasicMaterial({ color: 0x222222, transparent: true, opacity: 0.6 });
    var smokeList = [];
    var si;
    for (si = 0; si < 5; si++) {
      var sm = new THREE.Mesh(new THREE.SphereGeometry(0.12 + Math.random() * 0.1, 5, 5), smokeMat.clone());
      sm.position.set(
        pos.x + (Math.random() - 0.5) * 0.4,
        pos.y + 0.3 + Math.random() * 0.3,
        pos.z + (Math.random() - 0.5) * 0.4
      );
      _scene.add(sm);
      smokeList.push({ mesh: sm, vy: 0.5 + Math.random() * 0.5, life: 1.5 });
    }

    var lastT = null;
    function animateParts(ts) {
      if (!lastT) lastT = ts;
      var dt = Math.min((ts - lastT) / 1000, 0.05);
      lastT = ts;
      var anyPart = false;
      var anySmoke = false;
      var ii;
      for (ii = 0; ii < parts.length; ii++) {
        var p = parts[ii];
        if (!p || p.life <= 0) continue;
        p.life -= dt;
        p.vel.y -= 9.8 * dt;
        p.mesh.position.x += p.vel.x * dt;
        p.mesh.position.y += p.vel.y * dt;
        p.mesh.position.z += p.vel.z * dt;
        if (p.mesh.position.y < 0) { p.mesh.position.y = 0; p.vel.y = 0; }
        if (p.life <= 0) { try { _scene.remove(p.mesh); } catch (e) {} parts[ii] = null; }
        else anyPart = true;
      }
      for (ii = 0; ii < smokeList.length; ii++) {
        var sk = smokeList[ii];
        if (!sk || sk.life <= 0) continue;
        sk.life -= dt;
        sk.mesh.position.y += sk.vy * dt;
        sk.mesh.material.opacity = Math.max(0, sk.life / 1.5 * 0.6);
        if (sk.life <= 0) { try { _scene.remove(sk.mesh); } catch (e) {} smokeList[ii] = null; }
        else anySmoke = true;
      }
      if (anyPart || anySmoke) requestAnimationFrame(animateParts);
    }
    requestAnimationFrame(animateParts);
  }

  // ─── Place a turret in the world ──────────────────────────────────────────

  function _placeTurret() {
    if (!_scene || !_camera) return;

    var px = _camera.position.x;
    var pz = _camera.position.z;
    var py = 0;
    try {
      if (window.VoxelWorld && window.VoxelWorld.getTerrainHeight) {
        py = window.VoxelWorld.getTerrainHeight(px, pz) || 0;
      }
    } catch (e) {}

    var parts = _buildTurretMesh();
    parts.group.position.set(px, py, pz);
    _scene.add(parts.group);

    var t = {
      group: parts.group,
      drum: parts.drum,
      barrelPivot: parts.barrelPivot,
      flash: parts.flash,
      hp: _MAX_HP,
      fireTimer: 0,
      flashTimer: 0,
      domBadge: null,
      domHpWrap: null,
      domHpFill: null,
      destroyed: false
    };

    _createTurretDOM(t);
    _turrets.push(t);
    window._activeTurretCount = _turrets.length;

    _toast('🔫 AUTO TURRET DEPLOYED (' + _turrets.length + '/' + _MAX_TURRETS + ')', '#ffaa44');
  }

  // ─── Find nearest turret to a position ───────────────────────────────────

  function _findNearest(pos) {
    var bestIdx = -1;
    var bestDist = Infinity;
    var i;
    for (i = 0; i < _turrets.length; i++) {
      var t = _turrets[i];
      if (!t || t.destroyed) continue;
      var dx = t.group.position.x - pos.x;
      var dz = t.group.position.z - pos.z;
      var dist = Math.sqrt(dx * dx + dz * dz);
      if (dist < bestDist) {
        bestDist = dist;
        bestIdx = i;
      }
    }
    return { idx: bestIdx, dist: bestDist };
  }

  function _removeTurretAt(idx) {
    var t = _turrets[idx];
    if (!t) return;
    try { _scene.remove(t.group); } catch (e) {}
    _removeTurretDOM(t);
    _turrets.splice(idx, 1);
    window._activeTurretCount = _turrets.length;
  }

  // ─── Public: deploy ───────────────────────────────────────────────────────

  function deploy() {
    if (!_scene || !_camera) return;

    var playerPos = _camera.position;

    if (_turrets.length >= _MAX_TURRETS) {
      // Pick up nearest turret within 3 units
      var nearest = _findNearest(playerPos);
      if (nearest.idx >= 0 && nearest.dist <= 3) {
        var hp = _turrets[nearest.idx].hp;
        _removeTurretAt(nearest.idx);
        if (hp > 0) {
          _toast('TURRET RETRIEVED', '#44ff88');
        } else {
          _toast('TURRET DESTROYED — nothing to retrieve', '#ff4444');
        }
      } else {
        _toast('MAX TURRETS DEPLOYED — walk closer to pick one up (F5)', '#ff8888');
      }
      return;
    }

    _placeTurret();
  }

  // ─── Public: update(dt) ───────────────────────────────────────────────────

  function update(dt) {
    if (!_scene || !_camera) return;

    // Clamp dt to avoid physics explosions after tab resume
    var safeDt = Math.min(dt, 0.1);
    var i;

    for (i = _turrets.length - 1; i >= 0; i--) {
      var t = _turrets[i];
      if (!t || t.destroyed) {
        _turrets.splice(i, 1);
        window._activeTurretCount = _turrets.length;
        continue;
      }

      // ── Find nearest enemy ──────────────────────────────────────────────
      var target = null;
      var targetDist = Infinity;

      try {
        if (typeof Enemies !== 'undefined' && Enemies.getAll) {
          var list = Enemies.getAll();
          var ei;
          for (ei = 0; ei < list.length; ei++) {
            var en = list[ei];
            if (!en || !en.mesh || en.hp <= 0) continue;
            var edx = en.mesh.position.x - t.group.position.x;
            var edz = en.mesh.position.z - t.group.position.z;
            var eDist = Math.sqrt(edx * edx + edz * edz);
            if (eDist < _RANGE && eDist < targetDist) {
              targetDist = eDist;
              target = en;
            }
          }
        }
      } catch (e) {}

      // ── Aim drum toward target ──────────────────────────────────────────
      if (target && target.mesh) {
        var tx = target.mesh.position.x - t.group.position.x;
        var tz = target.mesh.position.z - t.group.position.z;
        var targetAngle = Math.atan2(tx, tz);
        t.drum.rotation.y = targetAngle;
        t.barrelPivot.rotation.y = targetAngle;

        // ── Fire ───────────────────────────────────────────────────────────
        t.fireTimer -= safeDt;
        if (t.fireTimer <= 0) {
          t.fireTimer = _FIRE_RATE;

          // Deal damage to target
          try {
            if (typeof Enemies !== 'undefined' && Enemies.damage) {
              Enemies.damage(target, _DAMAGE);
            }
          } catch (e) {}

          // Barrel flash
          t.flash.intensity = 3;
          t.flashTimer = 0.05;

          // Audio: rapid mechanical clicking
          _playFireSFX();
        }
      }

      // ── Decay barrel flash ─────────────────────────────────────────────
      if (t.flashTimer > 0) {
        t.flashTimer -= safeDt;
        if (t.flashTimer <= 0) {
          t.flashTimer = 0;
          t.flash.intensity = 0;
        }
      }

      // ── Project DOM elements to screen ────────────────────────────────
      var labelPos = new THREE.Vector3(
        t.group.position.x,
        t.group.position.y + 1.5,
        t.group.position.z
      );
      var screen = _worldToScreen(labelPos);
      if (screen) {
        if (t.domBadge) {
          t.domBadge.style.left = screen.x + 'px';
          t.domBadge.style.top = (screen.y - 18) + 'px';
          t.domBadge.style.display = 'block';
        }
        if (t.domHpWrap) {
          t.domHpWrap.style.left = screen.x + 'px';
          t.domHpWrap.style.top = screen.y + 'px';
          t.domHpWrap.style.display = 'block';
        }
        if (t.domHpFill) {
          var hpPct = Math.max(0, (t.hp / _MAX_HP) * 100);
          t.domHpFill.style.width = hpPct + '%';
          if (hpPct > 60) {
            t.domHpFill.style.background = '#44ff44';
          } else if (hpPct > 30) {
            t.domHpFill.style.background = '#ffcc00';
          } else {
            t.domHpFill.style.background = '#ff3333';
          }
        }
      } else {
        // Behind camera — hide DOM elements
        if (t.domBadge) t.domBadge.style.display = 'none';
        if (t.domHpWrap) t.domHpWrap.style.display = 'none';
      }

      // ── Check if turret is destroyed ──────────────────────────────────
      if (t.hp <= 0) {
        t.destroyed = true;
        _explodeTurret(t);
        try { _scene.remove(t.group); } catch (e) {}
        _removeTurretDOM(t);
        _turrets.splice(i, 1);
        window._activeTurretCount = _turrets.length;
        _toast('AUTO TURRET DESTROYED!', '#ff4444');
      }
    }
  }

  // ─── Receive damage from enemies (for external callers) ──────────────────

  function damageTurret(turret, amount) {
    if (!turret || turret.destroyed) return;
    turret.hp -= amount;
  }

  // Returns active turrets for external damage integration
  function getTurretsForDamage() {
    return _turrets;
  }

  // ─── Public: reset ────────────────────────────────────────────────────────

  function reset() {
    var i;
    for (i = 0; i < _turrets.length; i++) {
      var t = _turrets[i];
      if (!t) continue;
      try { if (_scene) _scene.remove(t.group); } catch (e) {}
      _removeTurretDOM(t);
    }
    _turrets = [];
    window._activeTurretCount = 0;
  }

  // ─── Public: init ─────────────────────────────────────────────────────────

  function init(scene, camera) {
    _scene = scene;
    _camera = camera;
    _turrets = [];
    _keyDown = false;
    window._activeTurretCount = 0;

    _ensureOverlay();

    // F5 key listener — deploy or pickup
    document.addEventListener('keydown', function (e) {
      if (e.code !== 'F5') return;
      // Skip when build-hud is visible (BUILD_MODE owns F5 for commandCenter)
      var buildHud = document.getElementById('build-hud');
      if (buildHud && buildHud.style.display !== 'none' && buildHud.style.display !== '') return;
      if (_keyDown) return;
      _keyDown = true;
      e.preventDefault();
      deploy();
    });

    document.addEventListener('keyup', function (e) {
      if (e.code === 'F5') _keyDown = false;
    });
  }

  // ─── Expose public API ────────────────────────────────────────────────────

  return { init: init, update: update, deploy: deploy, reset: reset, damageTurret: damageTurret, getTurretsForDamage: getTurretsForDamage };
})();
