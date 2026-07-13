/* ───────────────────────────────────────────────────────────────────────
   TRIPWIRE TRAP — deployable wire that triggers an explosion on enemy crossing
   Alt+W to plant (max 3). Wire arms after 1.5s, triggers on enemy crossing.
   Refills from supply caches. +300 score for enemy killed by tripwire.
   ─────────────────────────────────────────────────────────────────────── */
window.TripwireTrap = (function () {
  'use strict';

  var _scene   = null;
  var _camera  = null;
  var _traps   = [];          // active tripwire objects
  var _MAX_TRAPS = 3;

  window._activeTripwires = [];
  window._tripwireCount   = _MAX_TRAPS;

  // ── HUD element ──────────────────────────────────────────────────────
  var _hudEl = null;

  function _ensureHUD() {
    if (_hudEl && document.body.contains(_hudEl)) return;
    _hudEl = document.getElementById('tripwire-hud-badge');
    if (!_hudEl) {
      _hudEl = document.createElement('div');
      _hudEl.id = 'tripwire-hud-badge';
      _hudEl.style.cssText = [
        'position:fixed',
        'top:14px',
        'left:14px',
        'background:rgba(30,10,10,0.82)',
        'color:#c06060',
        'font-family:monospace',
        'font-size:14px',
        'font-weight:bold',
        'padding:5px 12px',
        'border-radius:5px',
        'border:1px solid #702020',
        'pointer-events:none',
        'z-index:9010',
        'user-select:none',
        'letter-spacing:1px'
      ].join(';');
      if (document.body) document.body.appendChild(_hudEl);
    }
    _updateHUD();
  }

  function _updateHUD() {
    if (!_hudEl) return;
    _hudEl.textContent = 'TRIPWIRE x' + window._tripwireCount;
    // Turns red when any wire is armed
    var hasArmed = false;
    for (var i = 0; i < _traps.length; i++) {
      if (_traps[i].armed) { hasArmed = true; break; }
    }
    _hudEl.style.color = hasArmed ? '#ff2222' : '#c06060';
    _hudEl.style.borderColor = hasArmed ? '#ff2222' : '#702020';
  }

  // ── Geometry helpers ─────────────────────────────────────────────────
  function _makePost(color) {
    var geo = new THREE.CylinderGeometry(0.04, 0.04, 0.3, 6);
    var mat = new THREE.MeshLambertMaterial({ color: color });
    return new THREE.Mesh(geo, mat);
  }

  function _makeWireLine(a, b) {
    var positions = new Float32Array([a.x, a.y + 0.15, a.z, b.x, b.y + 0.15, b.z]);
    var geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    var mat = new THREE.LineBasicMaterial({
      color: 0xff2222,
      transparent: true,
      opacity: 0.22
    });
    return new THREE.Line(geo, mat);
  }

  function _updateWireLine(trap) {
    var a = trap.anchorA;
    var b = trap.anchorB;
    var positions = trap.wireLine.geometry.attributes.position.array;
    positions[0] = a.x; positions[1] = a.y + 0.15; positions[2] = a.z;
    positions[3] = b.x; positions[4] = b.y + 0.15; positions[5] = b.z;
    trap.wireLine.geometry.attributes.position.needsUpdate = true;
  }

  // ── Planting ─────────────────────────────────────────────────────────
  function plant(playerPos, playerDir) {
    if (window._tripwireCount <= 0) return;

    var anchorA = new THREE.Vector3(playerPos.x, playerPos.y, playerPos.z);
    // Second anchor 6 units in the direction the player faces (horizontal only)
    var fwd = new THREE.Vector3(playerDir.x, 0, playerDir.z).normalize();
    var anchorB = anchorA.clone().addScaledVector(fwd, 6);

    var group = new THREE.Group();
    _scene.add(group);

    // Posts
    var postA = _makePost(0x6b3a1f);
    postA.position.copy(anchorA);
    postA.position.y += 0.15;
    group.add(postA);

    var postB = _makePost(0x6b3a1f);
    postB.position.copy(anchorB);
    postB.position.y += 0.15;
    group.add(postB);

    // Wire line
    var wireLine = _makeWireLine(anchorA, anchorB);
    group.add(wireLine);

    // Midpoint glow light
    var mid = anchorA.clone().add(anchorB).multiplyScalar(0.5);
    mid.y += 0.15;
    var glow = new THREE.PointLight(0xff0000, 0.5, 4);
    glow.position.copy(mid);
    group.add(glow);

    var trap = {
      group:    group,
      postA:    postA,
      postB:    postB,
      wireLine: wireLine,
      glow:     glow,
      anchorA:  anchorA,
      anchorB:  anchorB,
      armed:    false,
      armTimer: 0,
      triggered: false,
      blastTimer: 0
    };

    _traps.push(trap);
    window._activeTripwires.push(trap);
    window._tripwireCount--;
    _updateHUD();

    // Beep during arming
    _playBeep();

    return trap;
  }

  // ── Closest-point distance from point P to segment AB (2D XZ) ────────
  function _distPointToSegment(px, pz, ax, az, bx, bz) {
    var abx = bx - ax, abz = bz - az;
    var apx = px - ax, apz = pz - az;
    var len2 = abx * abx + abz * abz;
    if (len2 < 0.0001) return Math.sqrt(apx * apx + apz * apz);
    var t = Math.max(0, Math.min(1, (apx * abx + apz * abz) / len2));
    var cx = ax + t * abx, cz = az + t * abz;
    var dx = px - cx, dz = pz - cz;
    return Math.sqrt(dx * dx + dz * dz);
  }

  // ── Blast ─────────────────────────────────────────────────────────────
  function _triggerBlast(trap) {
    if (trap.triggered) return;
    trap.triggered = true;
    trap.armed     = false;

    var mid = trap.anchorA.clone().add(trap.anchorB).multiplyScalar(0.5);
    mid.y += 0.3;

    // Fireball light
    var fireLight = new THREE.PointLight(0xff8800, 6, 10);
    fireLight.position.copy(mid);
    _scene.add(fireLight);

    // 8 debris particles (simple sphere meshes)
    var debrisMat = new THREE.MeshBasicMaterial({ color: 0xff6600 });
    var debrisGeo = new THREE.SphereGeometry(0.07, 4, 4);
    var debris = [];
    for (var d = 0; d < 8; d++) {
      var m = new THREE.Mesh(debrisGeo, debrisMat);
      m.position.copy(mid);
      var vx = (Math.random() - 0.5) * 8;
      var vy = Math.random() * 6 + 2;
      var vz = (Math.random() - 0.5) * 8;
      debris.push({ mesh: m, vx: vx, vy: vy, vz: vz, life: 1.2 });
      _scene.add(m);
    }

    // Remove wire group immediately
    _scene.remove(trap.group);

    // Damage enemies
    _damageEnemiesInBlast(mid);

    // Whip / explosion sound
    _playWhip();

    // Animate fireball then clean up
    trap.blastTimer   = 0;
    trap.fireLight    = fireLight;
    trap.debris       = debris;
    trap.blastActive  = true;

    _updateHUD();
  }

  function _damageEnemiesInBlast(mid) {
    try {
      var enemies = window.Enemies ? window.Enemies.getAll() : [];
      if (!enemies) return;
      for (var i = 0; i < enemies.length; i++) {
        var e = enemies[i];
        if (!e || e.dead) continue;
        var ep = e.position || (e.mesh && e.mesh.position);
        if (!ep) continue;
        var dx = ep.x - mid.x;
        var dy = ep.y - mid.y;
        var dz = ep.z - mid.z;
        var dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
        var dmg = 0;
        if (dist <= 3) dmg = 120;
        else if (dist <= 6) dmg = 60;
        if (dmg > 0) {
          var killed = false;
          if (typeof e.takeDamage === 'function') {
            killed = e.takeDamage(dmg, 'tripwire');
          } else if (typeof window.Enemies.damage === 'function') {
            killed = window.Enemies.damage(e, dmg);
          }
          if (killed) {
            try {
              if (window.GameManager && typeof window.GameManager.addScore === 'function') {
                window.GameManager.addScore(300);
              }
            } catch (ex2) {}
          }
        }
      }
    } catch (ex) {}
  }

  // ── Audio stubs ───────────────────────────────────────────────────────
  function _playBeep() {
    try {
      if (window.AudioSystem && typeof window.AudioSystem.playTone === 'function') {
        window.AudioSystem.playTone(880, 0.1, 0.08);
        setTimeout(function () {
          try { window.AudioSystem.playTone(880, 0.1, 0.08); } catch (e2) {}
        }, 300);
      }
    } catch (ex) {}
  }

  function _playWhip() {
    try {
      if (window.AudioSystem) {
        if (typeof window.AudioSystem.playExplosion === 'function') {
          window.AudioSystem.playExplosion(1.0);
        } else if (typeof window.AudioSystem.play === 'function') {
          window.AudioSystem.play('explosion');
        }
      }
    } catch (ex) {}
  }

  // ── Key handling ──────────────────────────────────────────────────────
  var _altHeld = false;

  function _onKeyDown(e) {
    if (e.key === 'Alt') _altHeld = true;
    if ((e.key === 'w' || e.key === 'W') && _altHeld) {
      e.preventDefault();
      _tryPlant();
    }
  }

  function _onKeyUp(e) {
    if (e.key === 'Alt') _altHeld = false;
  }

  function _tryPlant() {
    if (window._tripwireCount <= 0) return;
    try {
      var playerPos = null;
      var playerDir = null;
      if (window.GameManager && window.GameManager.getPlayerPosition) {
        playerPos = window.GameManager.getPlayerPosition();
      } else if (window.CameraSystem && window.CameraSystem.getPosition) {
        playerPos = window.CameraSystem.getPosition();
      }
      if (!playerPos) return;

      if (window.GameManager && window.GameManager.getPlayerDirection) {
        playerDir = window.GameManager.getPlayerDirection();
      } else if (window.CameraSystem && window.CameraSystem.getDirection) {
        playerDir = window.CameraSystem.getDirection();
      }
      if (!playerDir) {
        if (_camera) {
          var v = new THREE.Vector3();
          _camera.getWorldDirection(v);
          playerDir = v;
        } else {
          playerDir = new THREE.Vector3(0, 0, -1);
        }
      }
      plant(playerPos, playerDir);
    } catch (ex) {}
  }

  // ── Public init ───────────────────────────────────────────────────────
  function init(scene, camera) {
    _scene   = scene;
    _camera  = camera || null;
    window._activeTripwires = [];
    window._tripwireCount   = _MAX_TRAPS;
    _traps   = [];
    _altHeld = false;
    document.addEventListener('keydown', _onKeyDown);
    document.addEventListener('keyup',   _onKeyUp);
    _ensureHUD();
  }

  // ── Update loop ───────────────────────────────────────────────────────
  function update(dt) {
    if (!_scene) return;
    _ensureHUD();

    for (var i = _traps.length - 1; i >= 0; i--) {
      var trap = _traps[i];

      if (trap.blastActive) {
        // Animate blast
        trap.blastTimer += dt;
        var fadeRatio = Math.max(0, 1 - trap.blastTimer / 0.6);
        if (trap.fireLight) trap.fireLight.intensity = 6 * fadeRatio;

        if (trap.debris) {
          for (var d = 0; d < trap.debris.length; d++) {
            var p = trap.debris[d];
            p.life -= dt;
            if (p.life > 0) {
              p.mesh.position.x += p.vx * dt;
              p.mesh.position.y += p.vy * dt;
              p.mesh.position.z += p.vz * dt;
              p.vy -= 9.8 * dt;
            } else {
              _scene.remove(p.mesh);
            }
          }
        }

        if (trap.blastTimer > 0.7) {
          if (trap.fireLight) _scene.remove(trap.fireLight);
          if (trap.debris) {
            for (var d2 = 0; d2 < trap.debris.length; d2++) {
              _scene.remove(trap.debris[d2].mesh);
            }
          }
          _traps.splice(i, 1);
          var wIdx = window._activeTripwires.indexOf(trap);
          if (wIdx !== -1) window._activeTripwires.splice(wIdx, 1);
        }
        continue;
      }

      if (trap.triggered) continue;

      if (!trap.armed) {
        trap.armTimer += dt;
        // Blink glow during arming
        if (trap.glow) {
          trap.glow.intensity = (Math.floor(trap.armTimer * 8) % 2 === 0) ? 0.8 : 0;
        }
        if (trap.armTimer >= 1.5) {
          trap.armed = true;
          if (trap.glow) trap.glow.intensity = 0.5;
          _updateHUD();
        }
        continue;
      }

      // Armed — check enemies
      try {
        var enemies = window.Enemies ? window.Enemies.getAll() : [];
        if (!enemies) continue;
        for (var j = 0; j < enemies.length; j++) {
          var en = enemies[j];
          if (!en || en.dead) continue;
          var ep = en.position || (en.mesh && en.mesh.position);
          if (!ep) continue;
          var dist2d = _distPointToSegment(
            ep.x, ep.z,
            trap.anchorA.x, trap.anchorA.z,
            trap.anchorB.x, trap.anchorB.z
          );
          if (dist2d < 0.3) {
            _triggerBlast(trap);
            break;
          }
        }
      } catch (ex) {}
    }
  }

  // ── Reset ─────────────────────────────────────────────────────────────
  function reset() {
    for (var i = 0; i < _traps.length; i++) {
      var trap = _traps[i];
      if (trap.group && _scene) _scene.remove(trap.group);
      if (trap.fireLight && _scene) _scene.remove(trap.fireLight);
      if (trap.debris && _scene) {
        for (var d = 0; d < trap.debris.length; d++) {
          _scene.remove(trap.debris[d].mesh);
        }
      }
    }
    _traps = [];
    window._activeTripwires = [];
    window._tripwireCount   = _MAX_TRAPS;
    _altHeld = false;
    _updateHUD();
  }

  // ── Supply cache refill (called externally) ───────────────────────────
  function refill(amount) {
    window._tripwireCount = Math.min(_MAX_TRAPS, window._tripwireCount + (amount || 1));
    _updateHUD();
  }

  return { init: init, update: update, plant: plant, reset: reset, refill: refill };
})();
