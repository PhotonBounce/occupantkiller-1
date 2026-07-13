// poison-dart.js — Silenced blowgun with damage-over-time poison effect
// Browser-based Three.js FPS — IIFE, all var (no let/const)
//
// Public API:
//   PoisonDart.init(scene, camera)
//   PoisonDart.update(dt)
//   PoisonDart.fire()
//   PoisonDart.reset()

window.PoisonDart = (function () {
  'use strict';

  // ------------------------------------------------------------------ config
  var MAX_DARTS          = 12;
  var DART_SPEED         = 30;      // units/s
  var DART_GRAVITY       = 4;       // units/s^2 drop
  var HIT_RADIUS         = 0.6;     // ray-sphere check radius
  var POISON_DURATION    = 8.0;     // seconds
  var POISON_DPS         = 5;       // damage per second
  var POISON_FLICKER_INT = 0.5;     // seconds between flicker
  var SPREAD_RADIUS      = 4;       // units for spread check
  var SPREAD_DURATION    = 4.0;     // half-duration spread poison
  var NEARBY_VIGNETTE_D  = 10;      // units — show green vignette
  var SCORE_DOT_KILL     = 25;
  var SCORE_TOXIN_CLOUD  = 150;
  var TOXIN_CLOUD_COUNT  = 3;       // simultaneous poisoned for bonus

  // ------------------------------------------------------------------ state
  var _scene        = null;
  var _camera       = null;
  var _darts        = 0;
  var _projectiles  = [];   // active dart projectiles
  var _audioCtx     = null;

  // DOM
  var _hudEl        = null;
  var _vigEl        = null;
  var _styleEl      = null;

  // tracking for toxin cloud bonus
  var _lastCloudBonus = false;

  // ------------------------------------------------------------------ audio

  function _getAudioCtx() {
    if (!_audioCtx) {
      try {
        _audioCtx = window._audioCtx || new (window.AudioContext || window.webkitAudioContext)();
      } catch (e) { _audioCtx = null; }
    }
    return _audioCtx;
  }

  function _playPffSound() {
    var ctx = _getAudioCtx();
    if (!ctx) return;
    try {
      // Very soft high-frequency burst — "pff" of air
      var rate   = ctx.sampleRate;
      var len    = Math.floor(rate * 0.07);
      var buf    = ctx.createBuffer(1, len, rate);
      var data   = buf.getChannelData(0);
      for (var i = 0; i < len; i++) {
        var t = i / len;
        data[i] = (Math.random() * 2 - 1) * (1 - t) * (1 - t);
      }

      var src    = ctx.createBufferSource();
      src.buffer = buf;

      var hp     = ctx.createBiquadFilter();
      hp.type    = 'highpass';
      hp.frequency.value = 4000;

      var gain   = ctx.createGain();
      gain.gain.setValueAtTime(0.07, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.07);

      src.connect(hp);
      hp.connect(gain);
      gain.connect(ctx.destination);
      src.start(ctx.currentTime);
    } catch (e) {}
  }

  // ------------------------------------------------------------------ CSS / DOM

  function _injectStyles() {
    if (_styleEl) return;
    _styleEl = document.createElement('style');
    _styleEl.id = 'poisonDartStyles';
    _styleEl.textContent = [
      '@keyframes pdVignettePulse {',
      '  0%   { opacity: 0.22; }',
      '  50%  { opacity: 0.45; }',
      '  100% { opacity: 0.22; }',
      '}'
    ].join('\n');
    document.head.appendChild(_styleEl);
  }

  function _ensureVignette() {
    if (_vigEl) return;
    _vigEl = document.createElement('div');
    _vigEl.id = 'poisonDartVignette';
    _vigEl.style.position        = 'fixed';
    _vigEl.style.top             = '0';
    _vigEl.style.left            = '0';
    _vigEl.style.width           = '100%';
    _vigEl.style.height          = '100%';
    _vigEl.style.pointerEvents   = 'none';
    _vigEl.style.zIndex          = '459';
    _vigEl.style.opacity         = '0';
    _vigEl.style.boxShadow       = 'inset 0 0 80px 30px rgba(0,200,40,0.5)';
    _vigEl.style.transition      = 'opacity 0.4s';
    document.body.appendChild(_vigEl);
  }

  function _setVignetteActive(active) {
    _ensureVignette();
    if (active) {
      _vigEl.style.animation = 'pdVignettePulse 1.2s ease-in-out infinite';
    } else {
      _vigEl.style.animation = 'none';
      _vigEl.style.opacity   = '0';
    }
  }

  function _ensureHUD() {
    if (_hudEl) return;
    _hudEl = document.createElement('div');
    _hudEl.id                      = 'poisonDartHUD';
    _hudEl.style.position          = 'fixed';
    _hudEl.style.bottom            = '60px';
    _hudEl.style.right             = '18px';
    _hudEl.style.color             = '#00FF44';
    _hudEl.style.background        = 'rgba(0,20,0,0.72)';
    _hudEl.style.fontFamily        = 'monospace, sans-serif';
    _hudEl.style.fontSize          = '15px';
    _hudEl.style.fontWeight        = 'bold';
    _hudEl.style.padding           = '4px 10px';
    _hudEl.style.borderRadius      = '4px';
    _hudEl.style.border            = '1px solid #00CC33';
    _hudEl.style.textShadow        = '0 0 8px #00FF44, 1px 1px 2px #000';
    _hudEl.style.pointerEvents     = 'none';
    _hudEl.style.zIndex            = '601';
    _hudEl.style.letterSpacing     = '1px';
    document.body.appendChild(_hudEl);
  }

  function _updateHUD() {
    _ensureHUD();
    _hudEl.textContent = '☠ DART ×' + _darts;
  }

  // ------------------------------------------------------------------ dart mesh

  function _makeDartMesh() {
    var geo  = new THREE.CylinderGeometry(0.01, 0.02, 0.25, 4);
    var mat  = new THREE.MeshLambertMaterial({
      color:            0x4B3210,
      emissive:         0x1A4A10,
      emissiveIntensity: 0.35
    });
    var mesh = new THREE.Mesh(geo, mat);
    // orient along Z (forward)
    mesh.rotation.x = Math.PI / 2;
    return mesh;
  }

  // ------------------------------------------------------------------ shooting

  function fire() {
    if (_darts <= 0) return;
    if (!_scene || !_camera) return;

    _darts--;
    _updateHUD();
    _playPffSound();

    var mesh = _makeDartMesh();

    // position at camera
    var pos = _camera.position.clone();
    mesh.position.copy(pos);

    // velocity along camera look direction
    var dir = new THREE.Vector3(0, 0, -1);
    dir.applyQuaternion(_camera.quaternion);

    var vel = {
      x: dir.x * DART_SPEED,
      y: dir.y * DART_SPEED,
      z: dir.z * DART_SPEED
    };

    // orient mesh to face direction
    mesh.quaternion.copy(_camera.quaternion);

    _scene.add(mesh);

    _projectiles.push({
      mesh:  mesh,
      vel:   vel,
      alive: true,
      age:   0
    });
  }

  // ------------------------------------------------------------------ hit detection

  function _getEnemies() {
    return (window.Enemies && window.Enemies.getAll) ? window.Enemies.getAll() : [];
  }

  function _dealDamage(enemy, dmg) {
    if (enemy.takeDamage) {
      enemy.takeDamage(dmg);
    } else if (typeof enemy.health === 'number') {
      enemy.health -= dmg;
    }
  }

  function _applyPoison(enemy, duration) {
    if (!enemy) return;
    if (enemy.poisoned && enemy.poisonTimer > duration) return; // already worse poison

    // save original color if not already saved
    if (!enemy._poisonOrigColors) {
      enemy._poisonOrigColors = [];
      if (enemy.mesh) {
        enemy.mesh.traverse(function (child) {
          if (child.isMesh && child.material) {
            var mats = Array.isArray(child.material) ? child.material : [child.material];
            for (var m = 0; m < mats.length; m++) {
              enemy._poisonOrigColors.push({
                mat:   mats[m],
                color: mats[m].color ? mats[m].color.clone() : null
              });
            }
          }
        });
      } else {
        // enemy itself may be a mesh
        if (enemy.isMesh && enemy.material) {
          var mats = Array.isArray(enemy.material) ? enemy.material : [enemy.material];
          for (var mi = 0; mi < mats.length; mi++) {
            enemy._poisonOrigColors.push({
              mat:   mats[mi],
              color: mats[mi].color ? mats[mi].color.clone() : null
            });
          }
        }
      }
    }

    enemy.poisoned     = true;
    enemy.poisonTimer  = duration;
    enemy._poisonDmgAcc = enemy._poisonDmgAcc || 0;
    enemy._poisonFlicker = enemy._poisonFlicker || 0;
    enemy._poisonFlickerOn = false;
  }

  function _checkHit(proj) {
    var enemies = _getEnemies();
    var px = proj.mesh.position.x;
    var py = proj.mesh.position.y;
    var pz = proj.mesh.position.z;

    for (var i = 0; i < enemies.length; i++) {
      var enemy = enemies[i];
      if (!enemy) continue;
      // skip dead enemies
      if (enemy.health !== undefined && enemy.health <= 0) continue;
      if (enemy.dead) continue;

      var epos = (enemy.position) || (enemy.mesh && enemy.mesh.position);
      if (!epos) continue;

      var dx = px - epos.x;
      var dy = py - epos.y;
      var dz = pz - epos.z;
      var dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

      if (dist <= HIT_RADIUS) {
        // stick dart to enemy
        var dartMesh = proj.mesh;
        _scene.remove(dartMesh);
        var target = enemy.mesh || enemy;
        if (target && target.add) {
          // convert to local space
          if (target.worldToLocal) {
            var localPos = target.worldToLocal(dartMesh.position.clone());
            dartMesh.position.copy(localPos);
          }
          target.add(dartMesh);
        }

        // apply poison
        _applyPoison(enemy, POISON_DURATION);

        // spread check
        _spreadPoison(enemy, enemies);

        proj.alive = false;
        return true;
      }
    }
    return false;
  }

  function _spreadPoison(hitEnemy, enemies) {
    var hitPos = (hitEnemy.position) || (hitEnemy.mesh && hitEnemy.mesh.position);
    if (!hitPos) return;

    var nearby = [];
    for (var i = 0; i < enemies.length; i++) {
      var e = enemies[i];
      if (!e || e === hitEnemy) continue;
      if (e.health !== undefined && e.health <= 0) continue;
      if (e.dead) continue;

      var epos = (e.position) || (e.mesh && e.mesh.position);
      if (!epos) continue;

      var dx = epos.x - hitPos.x;
      var dy = epos.y - hitPos.y;
      var dz = epos.z - hitPos.z;
      var dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

      if (dist <= SPREAD_RADIUS) {
        nearby.push(e);
      }
    }

    // spread to one adjacent enemy if 2+ nearby
    if (nearby.length >= 2) {
      _applyPoison(nearby[0], SPREAD_DURATION);
    }
  }

  // ------------------------------------------------------------------ poison tick

  function _tickPoison(dt) {
    var enemies     = _getEnemies();
    var poisonedCnt = 0;

    for (var i = 0; i < enemies.length; i++) {
      var enemy = enemies[i];
      if (!enemy || !enemy.poisoned) continue;
      if (enemy.health !== undefined && enemy.health <= 0) {
        // already dead — clean up
        _restoreEnemyColor(enemy);
        enemy.poisoned    = false;
        enemy.poisonTimer = 0;
        continue;
      }

      poisonedCnt++;
      enemy.poisonTimer -= dt;

      // deal damage
      enemy._poisonDmgAcc = (enemy._poisonDmgAcc || 0) + POISON_DPS * dt;
      if (enemy._poisonDmgAcc >= 1) {
        var dmg = Math.floor(enemy._poisonDmgAcc);
        enemy._poisonDmgAcc -= dmg;
        var healthBefore = enemy.health;
        _dealDamage(enemy, dmg);

        // check for poison kill
        if (enemy.health !== undefined && enemy.health <= 0 && healthBefore > 0) {
          // silent DOT kill — suppress ragdoll sound flag
          enemy._silentDeath = true;
          // score bonus
          _addScore(SCORE_DOT_KILL);
          _restoreEnemyColor(enemy);
          enemy.poisoned    = false;
          enemy.poisonTimer = 0;
          continue;
        }
      }

      // flicker green color
      enemy._poisonFlicker = (enemy._poisonFlicker || 0) + dt;
      if (enemy._poisonFlicker >= POISON_FLICKER_INT) {
        enemy._poisonFlicker = 0;
        enemy._poisonFlickerOn = !enemy._poisonFlickerOn;
        _setEnemyGreenFlicker(enemy, enemy._poisonFlickerOn);
      }

      // end poison
      if (enemy.poisonTimer <= 0) {
        enemy.poisoned    = false;
        enemy.poisonTimer = 0;
        _restoreEnemyColor(enemy);
      }
    }

    // toxin cloud bonus
    if (poisonedCnt >= TOXIN_CLOUD_COUNT && !_lastCloudBonus) {
      _lastCloudBonus = true;
      _addScore(SCORE_TOXIN_CLOUD);
      _showToast('TOXIN CLOUD! +150');
    } else if (poisonedCnt < TOXIN_CLOUD_COUNT) {
      _lastCloudBonus = false;
    }

    return poisonedCnt;
  }

  function _setEnemyGreenFlicker(enemy, on) {
    var GREEN = 0x44FF44;
    var objs  = [];

    if (enemy.mesh) {
      objs.push(enemy.mesh);
    } else if (enemy.isMesh) {
      objs.push(enemy);
    }

    for (var oi = 0; oi < objs.length; oi++) {
      objs[oi].traverse(function (child) {
        if (child.isMesh && child.material) {
          var mats = Array.isArray(child.material) ? child.material : [child.material];
          for (var m = 0; m < mats.length; m++) {
            if (mats[m].color) {
              if (on) {
                mats[m].color.setHex(GREEN);
              } else {
                // restore from saved originals
                _restoreOneMat(enemy, mats[m]);
              }
            }
          }
        }
      });
    }
  }

  function _restoreOneMat(enemy, mat) {
    if (!enemy._poisonOrigColors) return;
    for (var k = 0; k < enemy._poisonOrigColors.length; k++) {
      if (enemy._poisonOrigColors[k].mat === mat && enemy._poisonOrigColors[k].color) {
        mat.color.copy(enemy._poisonOrigColors[k].color);
        return;
      }
    }
  }

  function _restoreEnemyColor(enemy) {
    if (!enemy._poisonOrigColors) return;
    for (var k = 0; k < enemy._poisonOrigColors.length; k++) {
      var entry = enemy._poisonOrigColors[k];
      if (entry.mat && entry.color && entry.mat.color) {
        entry.mat.color.copy(entry.color);
      }
    }
    enemy._poisonOrigColors = null;
    enemy._poisonFlickerOn  = false;
  }

  // ------------------------------------------------------------------ helpers

  function _addScore(pts) {
    if (window.player && window.player.score !== undefined) {
      window.player.score += pts;
    }
  }

  function _showToast(msg) {
    if (window.HUD && window.HUD.showToast) {
      window.HUD.showToast(msg);
      return;
    }
    // fallback simple toast
    var el = document.createElement('div');
    el.textContent = msg;
    el.style.position    = 'fixed';
    el.style.top         = '38%';
    el.style.left        = '50%';
    el.style.transform   = 'translateX(-50%)';
    el.style.color       = '#00FF44';
    el.style.fontFamily  = 'monospace, sans-serif';
    el.style.fontSize    = '22px';
    el.style.fontWeight  = 'bold';
    el.style.letterSpacing = '2px';
    el.style.textShadow  = '0 0 12px #00FF44, 0 0 24px #00CC22, 1px 1px 3px #000';
    el.style.pointerEvents = 'none';
    el.style.zIndex      = '700';
    el.style.opacity     = '1';
    el.style.transition  = 'opacity 1.8s ease 1s';
    document.body.appendChild(el);
    // fade out after short delay
    setTimeout(function () {
      el.style.opacity = '0';
      setTimeout(function () {
        if (el.parentNode) el.parentNode.removeChild(el);
      }, 2000);
    }, 100);
  }

  function _getPlayerPos() {
    try {
      if (window.GameManager && window.GameManager.playerPosition) return window.GameManager.playerPosition;
      if (window._playerPos) return window._playerPos;
      if (window.player && window.player.position) return window.player.position;
      if (_camera) return _camera.position;
    } catch (e) {}
    return null;
  }

  function _nearbyPoisonedExists() {
    var playerPos = _getPlayerPos();
    if (!playerPos) return false;
    var enemies = _getEnemies();
    for (var i = 0; i < enemies.length; i++) {
      var enemy = enemies[i];
      if (!enemy || !enemy.poisoned) continue;
      var epos = (enemy.position) || (enemy.mesh && enemy.mesh.position);
      if (!epos) continue;
      var dx = epos.x - playerPos.x;
      var dy = epos.y - playerPos.y;
      var dz = epos.z - playerPos.z;
      var dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
      if (dist <= NEARBY_VIGNETTE_D) return true;
    }
    return false;
  }

  // ------------------------------------------------------------------ key handler

  function _onKeyDown(e) {
    if (e.altKey && (e.key === 'p' || e.key === 'P')) {
      e.preventDefault();
      fire();
    }
  }

  // ------------------------------------------------------------------ public API

  function init(scene, camera) {
    _scene  = scene  || window._gameScene;
    _camera = camera || window._camera;
    _darts  = MAX_DARTS;

    _injectStyles();
    _ensureVignette();
    _ensureHUD();
    _updateHUD();

    document.addEventListener('keydown', _onKeyDown);
  }

  function update(dt) {
    if (!_scene) {
      _scene  = window._gameScene;
      _camera = window._camera;
    }

    // -- update projectiles --
    var i = _projectiles.length - 1;
    while (i >= 0) {
      var proj = _projectiles[i];

      if (!proj.alive) {
        _scene.remove(proj.mesh);
        _projectiles.splice(i, 1);
        i--;
        continue;
      }

      proj.age += dt;
      // max travel time ~3s
      if (proj.age > 3) {
        _scene.remove(proj.mesh);
        _projectiles.splice(i, 1);
        i--;
        continue;
      }

      // physics
      proj.vel.y -= DART_GRAVITY * dt;
      proj.mesh.position.x += proj.vel.x * dt;
      proj.mesh.position.y += proj.vel.y * dt;
      proj.mesh.position.z += proj.vel.z * dt;

      // orient mesh along velocity
      var spd = Math.sqrt(proj.vel.x * proj.vel.x + proj.vel.y * proj.vel.y + proj.vel.z * proj.vel.z);
      if (spd > 0.01) {
        proj.mesh.lookAt(
          proj.mesh.position.x + proj.vel.x,
          proj.mesh.position.y + proj.vel.y,
          proj.mesh.position.z + proj.vel.z
        );
        // cylinder default is Y-up; rotate to align with forward
        proj.mesh.rotateX(Math.PI / 2);
      }

      // hit check
      _checkHit(proj);

      i--;
    }

    // -- tick poison on enemies --
    var poisonedCnt = _tickPoison(dt);

    // -- green vignette --
    _setVignetteActive(_nearbyPoisonedExists());
  }

  function reset() {
    // remove all live projectiles from scene
    var i;
    for (i = 0; i < _projectiles.length; i++) {
      if (_scene) _scene.remove(_projectiles[i].mesh);
    }
    _projectiles = [];

    // restore all poisoned enemies
    var enemies = _getEnemies();
    for (i = 0; i < enemies.length; i++) {
      var enemy = enemies[i];
      if (enemy && enemy.poisoned) {
        _restoreEnemyColor(enemy);
        enemy.poisoned    = false;
        enemy.poisonTimer = 0;
      }
    }

    _darts          = MAX_DARTS;
    _lastCloudBonus = false;
    _updateHUD();
    _setVignetteActive(false);
  }

  return {
    init:   init,
    update: update,
    fire:   fire,
    reset:  reset
  };

})();
