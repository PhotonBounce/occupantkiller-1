/*  explosion-chain.js
 *  Explosive Chain Reactions — shooting fuel barrels causes secondary
 *  explosions that propagate through the level.
 *
 *  Exposed as: window.ExplosionChain
 *  Pattern: IIFE, all var (no let/const)
 */

window.ExplosionChain = (function () {
  'use strict';

  /* ── Constants ─────────────────────────────────────────────────── */
  var MAX_CHAIN_LINKS = 8;
  var CHAIN_DELAY_MIN = 0.2;   // seconds
  var CHAIN_DELAY_MAX = 0.5;
  var SPAWN_COUNT_MIN = 8;
  var SPAWN_COUNT_MAX = 15;
  var SPAWN_RANGE     = 25;    // ±25 world units from origin

  var TYPES = {
    FUEL_DRUM:  { radius: 5,  damage: 90  },
    AMMO_CRATE: { radius: 4,  damage: 80  },
    GAS_TANK:   { radius: 6,  damage: 100 },
    PROPANE:    { radius: 4,  damage: 75  }
  };

  /* ── Private state ─────────────────────────────────────────────── */
  var _scene       = null;
  var _explosives  = [];   // array of explosive objects
  var _pending     = [];   // { index, timer } — delayed chain triggers
  var _vfxList     = [];   // active VFX objects for animation
  var _chainCount  = 0;    // resets each time a NEW root explosion fires
  var _inited      = false;

  /* ── Canvas texture: hazard stripes (red + yellow diagonal) ────── */
  function _makeHazardTexture() {
    var size = 128;
    var canvas = document.createElement('canvas');
    canvas.width  = size;
    canvas.height = size;
    var ctx = canvas.getContext('2d');

    // Red background
    ctx.fillStyle = '#cc2200';
    ctx.fillRect(0, 0, size, size);

    // Three yellow diagonal stripes
    ctx.strokeStyle = '#ffdd00';
    ctx.lineWidth   = 14;
    var stripe, x;
    for (stripe = 0; stripe < 3; stripe++) {
      x = (stripe / 3) * size * 1.6 - size * 0.3;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x + size * 0.6, size);
      ctx.stroke();
    }

    var tex = new THREE.CanvasTexture(canvas);
    return tex;
  }

  /* ── Build fuel drum mesh ───────────────────────────────────────── */
  function _buildFuelDrum(x, z) {
    var group = new THREE.Group();

    var bodyGeo = new THREE.CylinderGeometry(0.3, 0.3, 0.7, 8);
    var bodyMat = new THREE.MeshLambertMaterial({
      color: 0xcc2200,
      map: _makeHazardTexture()
    });
    var body = new THREE.Mesh(bodyGeo, bodyMat);
    group.add(body);

    // Top cap
    var topGeo = new THREE.CylinderGeometry(0.26, 0.3, 0.07, 8);
    var topMat = new THREE.MeshLambertMaterial({ color: 0x881100 });
    var top = new THREE.Mesh(topGeo, topMat);
    top.position.y = 0.385;
    group.add(top);

    group.position.set(x, 1, z);
    return group;
  }

  /* ── Build ammo crate mesh ─────────────────────────────────────── */
  function _buildAmmoCrate(x, z) {
    var geo = new THREE.BoxGeometry(0.5, 0.4, 0.5);
    var mat = new THREE.MeshLambertMaterial({ color: 0x4a5a2a });  // olive green
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, 1, z);
    return mesh;
  }

  /* ── Spawn one explosive at random XZ ─────────────────────────── */
  function _spawnExplosive() {
    var typeKeys = ['FUEL_DRUM', 'AMMO_CRATE', 'GAS_TANK', 'PROPANE'];
    var type = typeKeys[Math.floor(Math.random() * typeKeys.length)];

    var attempts = 0;
    var x, z, mesh;

    while (attempts < 20) {
      x = (Math.random() * 2 - 1) * SPAWN_RANGE;
      z = (Math.random() * 2 - 1) * SPAWN_RANGE;

      // Skip solid voxels
      if (window.VoxelWorld && typeof window.VoxelWorld.isSolid === 'function') {
        if (window.VoxelWorld.isSolid(Math.round(x), 1, Math.round(z))) {
          attempts++;
          continue;
        }
      }
      break;
    }

    if (type === 'FUEL_DRUM' || type === 'GAS_TANK' || type === 'PROPANE') {
      mesh = _buildFuelDrum(x, z);
    } else {
      mesh = _buildAmmoCrate(x, z);
    }

    if (_scene) _scene.add(mesh);

    var typeData = TYPES[type] || TYPES['FUEL_DRUM'];

    _explosives.push({
      mesh:      mesh,
      position:  mesh.position,
      type:      type,
      radius:    typeData.radius,
      damage:    typeData.damage,
      triggered: false,
      delay:     0
    });
  }

  /* ── VFX: fireball ─────────────────────────────────────────────── */
  function _spawnFireball(pos) {
    if (!_scene) return;

    var geo  = new THREE.SphereGeometry(0.5, 8, 8);
    var mat  = new THREE.MeshBasicMaterial({
      color:       0xff6600,
      transparent: true,
      opacity:     1.0,
      depthWrite:  false
    });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(pos);
    _scene.add(mesh);

    _vfxList.push({
      type:     'fireball',
      mesh:     mesh,
      age:      0,
      duration: 0.4
    });
  }

  /* ── VFX: smoke cloud ──────────────────────────────────────────── */
  function _spawnSmoke(pos) {
    if (!_scene) return;

    var geo  = new THREE.SphereGeometry(0.8, 6, 6);
    var mat  = new THREE.MeshLambertMaterial({
      color:       0x444444,
      transparent: true,
      opacity:     0.7,
      depthWrite:  false
    });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(pos.x, pos.y + 0.5, pos.z);
    _scene.add(mesh);

    _vfxList.push({
      type:     'smoke',
      mesh:     mesh,
      age:      0,
      duration: 1.8
    });
  }

  /* ── VFX: debris particles ─────────────────────────────────────── */
  function _spawnDebris(pos) {
    if (!_scene) return;

    var count = 6;
    var i, mesh, geo, mat, vel, angle, speed;
    for (i = 0; i < count; i++) {
      geo  = new THREE.BoxGeometry(0.08, 0.08, 0.08);
      mat  = new THREE.MeshLambertMaterial({ color: 0x555555 });
      mesh = new THREE.Mesh(geo, mat);
      mesh.position.copy(pos);

      angle = (i / count) * Math.PI * 2;
      speed = 3 + Math.random() * 4;
      vel   = new THREE.Vector3(
        Math.cos(angle) * speed,
        4 + Math.random() * 3,
        Math.sin(angle) * speed
      );

      _vfxList.push({
        type:     'debris',
        mesh:     mesh,
        age:      0,
        duration: 1.2,
        vel:      vel
      });

      _scene.add(mesh);
    }
  }

  /* ── VFX: point light flash ────────────────────────────────────── */
  function _spawnFlash(pos) {
    if (!_scene) return;

    var light = new THREE.PointLight(0xff6600, 8, 12);
    light.position.copy(pos);
    _scene.add(light);

    _vfxList.push({
      type:     'flash',
      mesh:     light,
      age:      0,
      duration: 0.3
    });
  }

  /* ── Core explosion: VFX + damage + chain detection ────────────── */
  function _doExplosion(idx, isChain) {
    var exp = _explosives[idx];
    if (!exp || exp.triggered) return;
    exp.triggered = true;

    var pos    = exp.position;
    var radius = exp.radius;
    var damage = exp.damage;

    // Remove mesh
    if (_scene && exp.mesh) {
      _scene.remove(exp.mesh);
      exp.mesh = null;
    }

    // Spawn VFX
    _spawnFireball(pos);
    _spawnSmoke(pos);
    _spawnDebris(pos);
    _spawnFlash(pos);

    // Audio
    if (window.AudioSystem) {
      if (typeof window.AudioSystem.playRicochetEnhanced === 'function') {
        window.AudioSystem.playRicochetEnhanced(0.5);
      }
      if (typeof window.AudioSystem.playMortarImpact === 'function') {
        window.AudioSystem.playMortarImpact(0);
      }
    }

    // ── Player damage ──────────────────────────────────────────────
    var playerPos = null;
    if (window._player && window._player.position) {
      playerPos = window._player.position;
    } else if (window.GameManager && window.GameManager.getPlayerPosition) {
      playerPos = window.GameManager.getPlayerPosition();
    }

    if (playerPos) {
      var pDist = pos.distanceTo(playerPos);
      if (pDist < radius) {
        var pDmg = Math.round(damage * (1 - pDist / radius));
        if (pDmg > 0) {
          if (typeof window._onPlayerHit === 'function') {
            window._onPlayerHit(pDmg, 'explosion');
          } else if (window._player) {
            window._player.hp = Math.max(0, (window._player.hp || 100) - pDmg);
          }
          // Red screen flash edge
          var vig = document.getElementById('damage-vignette');
          if (vig) {
            vig.style.opacity = '1';
            setTimeout(function () { if (vig) vig.style.opacity = '0'; }, 400);
          }
        }
      }

      // Camera shake proportional to proximity
      var camDist = Math.min(pDist, radius);
      var shakeIntensity = 0.6 * (1 - camDist / radius);
      if (shakeIntensity > 0.01) {
        if (typeof CameraSystem !== 'undefined' && CameraSystem.shake) {
          CameraSystem.shake(shakeIntensity * 0.08, 0.8);
        }
        // Also write the global hint so other systems can react
        window._cameraShake = { intensity: shakeIntensity, duration: 0.8 };
      }
    }

    // ── Enemy damage ───────────────────────────────────────────────
    if (window.Enemies && typeof window.Enemies.damageInRadius === 'function') {
      window.Enemies.damageInRadius(pos, radius, damage);
    } else if (window.Enemies && typeof window.Enemies.getAll === 'function') {
      var allEnemies = window.Enemies.getAll();
      var ei, en, eDist, eDir, eFalloff;
      for (ei = 0; ei < allEnemies.length; ei++) {
        en = allEnemies[ei];
        if (!en || !en.alive || !en.mesh) continue;
        eDist = pos.distanceTo(en.mesh.position);
        if (eDist < radius) {
          eFalloff = 1 - eDist / radius;
          // Blast push
          eDir = en.mesh.position.clone().sub(pos).normalize();
          en.mesh.position.add(eDir.multiplyScalar(3 * eFalloff));
          // Damage
          en.hp = (en.hp || 0) - Math.round(damage * eFalloff);
        }
      }
    }

    // ── Chain reaction ─────────────────────────────────────────────
    if (!isChain) _chainCount = 0;
    if (_chainCount >= MAX_CHAIN_LINKS) return;

    var ci, nb, dx, dz, dist, chainDelay;
    for (ci = 0; ci < _explosives.length; ci++) {
      if (ci === idx) continue;
      nb = _explosives[ci];
      if (!nb || nb.triggered) continue;

      dx   = nb.position.x - pos.x;
      dz   = nb.position.z - pos.z;
      dist = Math.sqrt(dx * dx + dz * dz);

      if (dist <= radius) {
        _chainCount++;
        if (_chainCount > MAX_CHAIN_LINKS) break;
        chainDelay = CHAIN_DELAY_MIN + Math.random() * (CHAIN_DELAY_MAX - CHAIN_DELAY_MIN);
        (function (chainIdx) {
          _pending.push({ index: chainIdx, timer: chainDelay, isChain: true });
        })(ci);
      }
    }
  }

  /* ── Public: triggerExplosion ──────────────────────────────────── */
  function triggerExplosion(idx) {
    _doExplosion(idx, false);
  }

  /* ── Public: registerExplosive ─────────────────────────────────── */
  function registerExplosive(mesh, type, position) {
    var typeData = TYPES[type] || TYPES['FUEL_DRUM'];
    _explosives.push({
      mesh:      mesh,
      position:  position || mesh.position,
      type:      type,
      radius:    typeData.radius,
      damage:    typeData.damage,
      triggered: false,
      delay:     0
    });
    if (_scene && mesh && !mesh.parent) _scene.add(mesh);
    return _explosives.length - 1;
  }

  /* ── Public: init ──────────────────────────────────────────────── */
  function init(scene) {
    _scene     = scene || null;
    _explosives = [];
    _pending    = [];
    _vfxList    = [];
    _chainCount = 0;
    _inited     = true;

    // Auto-spawn 8-15 explosives
    var count = SPAWN_COUNT_MIN + Math.floor(Math.random() * (SPAWN_COUNT_MAX - SPAWN_COUNT_MIN + 1));
    var i;
    for (i = 0; i < count; i++) {
      _spawnExplosive();
    }

    // Bullet-hit hook: called by weapons system with (origin, direction, maxDist)
    window._onBulletHitExplosive = function (origin, direction, maxDist) {
      var hi, exp, dx, dy, dz, t, cx, cy, cz, perp;
      for (hi = 0; hi < _explosives.length; hi++) {
        exp = _explosives[hi];
        if (!exp || exp.triggered) continue;
        dx = exp.position.x - origin.x;
        dy = exp.position.y - origin.y;
        dz = exp.position.z - origin.z;
        t  = dx * direction.x + dy * direction.y + dz * direction.z;
        if (t < 0 || t > (maxDist || 200)) continue;
        cx   = origin.x + direction.x * t - exp.position.x;
        cy   = origin.y + direction.y * t - exp.position.y;
        cz   = origin.z + direction.z * t - exp.position.z;
        perp = Math.sqrt(cx * cx + cy * cy + cz * cz);
        if (perp < 0.5) {
          triggerExplosion(hi);
          return hi;
        }
      }
      return -1;
    };
  }

  /* ── Public: update(delta) ─────────────────────────────────────── */
  function update(delta) {
    if (!_inited) return;

    // ── Bullet hit via last-position polling ────────────────────────
    if (window._lastBulletHitPosition) {
      var bPos = window._lastBulletHitPosition;
      var bi, bExp, bdx, bdy, bdz, bDist;
      for (bi = 0; bi < _explosives.length; bi++) {
        bExp = _explosives[bi];
        if (!bExp || bExp.triggered) continue;
        bdx   = bExp.position.x - bPos.x;
        bdy   = bExp.position.y - bPos.y;
        bdz   = bExp.position.z - bPos.z;
        bDist = Math.sqrt(bdx * bdx + bdy * bdy + bdz * bdz);
        if (bDist < 0.6) {
          triggerExplosion(bi);
          break;
        }
      }
    }

    // ── Pending chain timers ────────────────────────────────────────
    var pi;
    for (pi = _pending.length - 1; pi >= 0; pi--) {
      _pending[pi].timer -= delta;
      if (_pending[pi].timer <= 0) {
        _doExplosion(_pending[pi].index, _pending[pi].isChain);
        _pending.splice(pi, 1);
      }
    }

    // ── Animate active VFX ─────────────────────────────────────────
    var vi, vfx, t, scale, opacity;
    for (vi = _vfxList.length - 1; vi >= 0; vi--) {
      vfx  = _vfxList[vi];
      vfx.age += delta;
      t    = Math.min(1, vfx.age / vfx.duration);

      if (vfx.type === 'fireball') {
        // Scale 0.5 → 4.0 over duration
        scale = 0.5 + t * 3.5;
        vfx.mesh.scale.setScalar(scale);
        // Fade out in second half
        opacity = t < 0.5 ? 1.0 : 1.0 - (t - 0.5) * 2;
        vfx.mesh.material.opacity = Math.max(0, opacity);

      } else if (vfx.type === 'smoke') {
        scale = 1 + t * 3;
        vfx.mesh.scale.setScalar(scale);
        vfx.mesh.material.opacity = Math.max(0, 0.7 - t * 0.7);
        vfx.mesh.position.y += delta * 0.5; // drift upward

      } else if (vfx.type === 'debris') {
        // Gravity
        vfx.vel.y -= 9.8 * delta;
        vfx.mesh.position.x += vfx.vel.x * delta;
        vfx.mesh.position.y += vfx.vel.y * delta;
        vfx.mesh.position.z += vfx.vel.z * delta;
        // Stop at ground
        if (vfx.mesh.position.y < 0) vfx.mesh.position.y = 0;

      } else if (vfx.type === 'flash') {
        // Decay intensity
        vfx.mesh.intensity = 8 * (1 - t);
      }

      // Remove finished VFX
      if (vfx.age >= vfx.duration) {
        if (_scene) _scene.remove(vfx.mesh);
        // Dispose geometry/material to avoid leaks
        if (vfx.mesh.geometry)  vfx.mesh.geometry.dispose();
        if (vfx.mesh.material && vfx.mesh.material.dispose) {
          vfx.mesh.material.dispose();
        }
        _vfxList.splice(vi, 1);
      }
    }
  }

  /* ── Public: reset ─────────────────────────────────────────────── */
  function reset() {
    var i;
    // Remove all meshes from scene
    for (i = 0; i < _explosives.length; i++) {
      if (_scene && _explosives[i].mesh && !_explosives[i].triggered) {
        _scene.remove(_explosives[i].mesh);
      }
    }
    // Remove all VFX
    for (i = 0; i < _vfxList.length; i++) {
      if (_scene) _scene.remove(_vfxList[i].mesh);
    }
    _explosives = [];
    _pending    = [];
    _vfxList    = [];
    _chainCount = 0;
  }

  /* ── Public API ────────────────────────────────────────────────── */
  return {
    init:             init,
    registerExplosive: registerExplosive,
    triggerExplosion:  triggerExplosion,
    update:            update,
    reset:             reset
  };
})();
