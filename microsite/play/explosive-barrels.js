window.ExplosiveBarrels = (function () {
  'use strict';

  // ─── private state ────────────────────────────────────────────────────────
  var _scene    = null;
  var _camera   = null;
  var _barrels  = [];
  var _prevOnShotFired = null;
  var _respawnTimer    = -1;
  var _chainKillCount  = 0;
  var _chainActive     = false;

  // ─── constants ────────────────────────────────────────────────────────────
  var BARREL_HP            = 50;
  var BARREL_RADIUS        = 0.45;
  var EXPLOSION_LIGHT_DIST = 15;
  var EXPLOSION_LIGHT_INT  = 20;
  var CHAIN_RADIUS         = 6;
  var CHAIN_DELAY_MS       = 300;
  var BLAST_INNER_RADIUS   = 4;
  var BLAST_OUTER_RADIUS   = 7;
  var PLAYER_INNER_DMG     = 30;
  var ENEMY_INNER_DMG      = 80;
  var ENEMY_OUTER_DMG      = 40;
  var SCORE_BARREL_KILL    = 300;
  var SCORE_CHAIN_BONUS    = 800;
  var CHAIN_KILL_THRESHOLD = 3;
  var RESPAWN_DELAY_MS     = 30000;
  var SPAWN_MIN_DIST       = 20;
  var SPAWN_MAX_DIST       = 50;
  var SPAWN_COUNT_MIN      = 8;
  var SPAWN_COUNT_MAX      = 12;
  var SMOKE_EXPAND_RADIUS  = 4;
  var SMOKE_DURATION_MS    = 1000;
  var WARNING_HP_FRACTION  = 0.25;

  // ─── canvas texture for hazard stripes ───────────────────────────────────
  function _makeStripeTexture() {
    var canvas = document.createElement('canvas');
    canvas.width  = 64;
    canvas.height = 128;
    var ctx = canvas.getContext('2d');
    var bandH = canvas.height / 8;
    for (var i = 0; i < 8; i++) {
      ctx.fillStyle = (i % 2 === 0) ? '#cc2200' : '#111111';
      ctx.fillRect(0, i * bandH, canvas.width, bandH);
    }
    return new THREE.CanvasTexture(canvas);
  }

  // ─── barrel mesh construction ─────────────────────────────────────────────
  function _buildBarrelMesh(x, y, z) {
    var group = new THREE.Group();

    // Body — CylinderGeometry(0.35, 0.35, 0.9, 8) with stripe texture
    var bodyGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.9, 8);
    var bodyMat = new THREE.MeshLambertMaterial({ map: _makeStripeTexture() });
    var body    = new THREE.Mesh(bodyGeo, bodyMat);
    group.add(body);

    // Top cap (dark)
    var capGeo = new THREE.CylinderGeometry(0.32, 0.35, 0.06, 8);
    var capMat = new THREE.MeshLambertMaterial({ color: 0x222222 });
    var cap    = new THREE.Mesh(capGeo, capMat);
    cap.position.y = 0.48;
    group.add(cap);

    // Rivets — 4 small spheres around the top rim
    var rivetGeo    = new THREE.SphereGeometry(0.04, 5, 4);
    var rivetMat    = new THREE.MeshLambertMaterial({ color: 0x888888 });
    var rivetAngles = [0, Math.PI * 0.5, Math.PI, Math.PI * 1.5];
    for (var ri = 0; ri < rivetAngles.length; ri++) {
      var rv = new THREE.Mesh(rivetGeo, rivetMat);
      rv.position.set(
        Math.cos(rivetAngles[ri]) * 0.31,
        0.50,
        Math.sin(rivetAngles[ri]) * 0.31
      );
      group.add(rv);
    }

    group.position.set(x, y + 0.45, z);
    if (_scene) _scene.add(group);
    return group;
  }

  // ─── warning glow ─────────────────────────────────────────────────────────
  function _addWarningGlow(barrel) {
    if (barrel._warnLight) return;
    var wl  = new THREE.PointLight(0xff2200, 2.5, 3);
    wl.position.copy(barrel.mesh.position);
    if (_scene) _scene.add(wl);
    barrel._warnLight = wl;
    var dir = 1;
    var pulseFn = function () {
      if (!barrel._warnLight) return;
      wl.intensity += dir * 0.12;
      if (wl.intensity > 3.5) dir = -1;
      if (wl.intensity < 1.0) dir =  1;
      if (!barrel.exploded && barrel.hp > 0 && barrel.hp < BARREL_HP * WARNING_HP_FRACTION) {
        if (typeof requestAnimationFrame !== 'undefined') requestAnimationFrame(pulseFn);
      } else {
        if (_scene) _scene.remove(wl);
        barrel._warnLight = null;
      }
    };
    if (typeof requestAnimationFrame !== 'undefined') requestAnimationFrame(pulseFn);
    _emitWarnSmoke(barrel);
  }

  function _emitWarnSmoke(barrel) {
    if (!_scene || barrel.exploded) return;
    var sg  = new THREE.SphereGeometry(0.2, 4, 3);
    var sm  = new THREE.MeshLambertMaterial({ color: 0x555555, transparent: true, opacity: 0.5, depthWrite: false });
    var smk = new THREE.Mesh(sg, sm);
    smk.position.copy(barrel.mesh.position);
    smk.position.y += 0.6;
    _scene.add(smk);
    var age = 0;
    var step = function () {
      age += 0.05;
      smk.position.y += 0.015;
      smk.material.opacity = Math.max(0, 0.5 - age);
      if (age < 1 && typeof requestAnimationFrame !== 'undefined') {
        requestAnimationFrame(step);
      } else {
        if (_scene) _scene.remove(smk);
      }
    };
    if (typeof requestAnimationFrame !== 'undefined') requestAnimationFrame(step);
    if (!barrel.exploded && barrel.hp > 0 && barrel.hp < BARREL_HP * WARNING_HP_FRACTION) {
      setTimeout(function () { _emitWarnSmoke(barrel); }, 600);
    }
  }

  function _playWarningSound() {
    try {
      var ctx = window._audioCtx || new (window.AudioContext || window.webkitAudioContext)();
      window._audioCtx = ctx;
      var osc  = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'square';
      osc.frequency.setValueAtTime(220, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(110, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.2);
    } catch (e) { /* ignore */ }
  }

  function _playExplosionSound() {
    try {
      var ctx    = window._audioCtx || new (window.AudioContext || window.webkitAudioContext)();
      window._audioCtx = ctx;
      var bufLen = ctx.sampleRate * 0.4;
      var buf    = ctx.createBuffer(1, bufLen, ctx.sampleRate);
      var data   = buf.getChannelData(0);
      for (var i = 0; i < bufLen; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.12));
      }
      var src  = ctx.createBufferSource();
      var gain = ctx.createGain();
      src.buffer = buf;
      src.connect(gain);
      gain.connect(ctx.destination);
      gain.gain.setValueAtTime(0.7, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      src.start(ctx.currentTime);
    } catch (e) { /* ignore */ }
  }

  // ─── explosion VFX ────────────────────────────────────────────────────────
  function _spawnExplosionFX(pos) {
    if (!_scene) return;

    // PointLight(0xFF8800, 20, 15) burst
    var flash = new THREE.PointLight(0xFF8800, EXPLOSION_LIGHT_INT, EXPLOSION_LIGHT_DIST);
    flash.position.copy(pos);
    _scene.add(flash);
    var fadeLight = function () {
      flash.intensity -= 1.2;
      if (flash.intensity > 0 && typeof requestAnimationFrame !== 'undefined') {
        requestAnimationFrame(fadeLight);
      } else {
        if (_scene) _scene.remove(flash);
      }
    };
    if (typeof requestAnimationFrame !== 'undefined') requestAnimationFrame(fadeLight);

    // 10 debris chunks
    var dbGeo = new THREE.BoxGeometry(0.1, 0.1, 0.1);
    var dbMat = new THREE.MeshLambertMaterial({ color: 0x882200 });
    for (var di = 0; di < 10; di++) {
      (function () {
        var chunk = new THREE.Mesh(dbGeo, dbMat);
        chunk.position.copy(pos);
        var vx = (Math.random() - 0.5) * 8;
        var vy = Math.random() * 6 + 2;
        var vz = (Math.random() - 0.5) * 8;
        if (_scene) _scene.add(chunk);
        var age = 0;
        var step = function () {
          age += 0.016;
          chunk.position.x += vx * 0.016;
          chunk.position.y += vy * 0.016;
          chunk.position.z += vz * 0.016;
          vy -= 9.8 * 0.016;
          chunk.rotation.x += 0.1;
          chunk.rotation.z += 0.08;
          if (age < 1.2 && typeof requestAnimationFrame !== 'undefined') {
            requestAnimationFrame(step);
          } else {
            if (_scene) _scene.remove(chunk);
          }
        };
        if (typeof requestAnimationFrame !== 'undefined') requestAnimationFrame(step);
      })();
    }

    // Orange smoke sphere expands to radius 4, fades over 1 s
    var smokeGeo = new THREE.SphereGeometry(1, 7, 6);
    var smokeMat = new THREE.MeshLambertMaterial({
      color: 0xFF6600, transparent: true, opacity: 0.75, depthWrite: false
    });
    var smoke      = new THREE.Mesh(smokeGeo, smokeMat);
    smoke.position.copy(pos);
    _scene.add(smoke);
    var smokeStart = Date.now();
    var smokeStep  = function () {
      var elapsed = Date.now() - smokeStart;
      var t = Math.min(elapsed / SMOKE_DURATION_MS, 1);
      smoke.scale.setScalar(1 + t * (SMOKE_EXPAND_RADIUS - 1));
      smoke.material.opacity = 0.75 * (1 - t);
      if (t < 1 && typeof requestAnimationFrame !== 'undefined') {
        requestAnimationFrame(smokeStep);
      } else {
        if (_scene) _scene.remove(smoke);
      }
    };
    if (typeof requestAnimationFrame !== 'undefined') requestAnimationFrame(smokeStep);
  }

  // ─── blast damage ─────────────────────────────────────────────────────────
  function _applyBlastDamage(pos) {
    var enemies     = (window.Enemies && window.Enemies.getAll) ? window.Enemies.getAll() : [];
    var barrelKills = 0;
    for (var ei = 0; ei < enemies.length; ei++) {
      var en = enemies[ei];
      if (!en || en.dead) continue;
      var ep = en.position || (en.mesh && en.mesh.position);
      if (!ep) continue;
      var dx   = ep.x - pos.x;
      var dy   = (ep.y || 0) - pos.y;
      var dz   = ep.z - pos.z;
      var dist = Math.sqrt(dx*dx + dy*dy + dz*dz);
      var dmg  = 0;
      if (dist <= BLAST_INNER_RADIUS)      dmg = ENEMY_INNER_DMG;
      else if (dist <= BLAST_OUTER_RADIUS) dmg = ENEMY_OUTER_DMG;
      if (dmg > 0) {
        var wasAlive = ((en.health !== undefined ? en.health : (en.hp || 0)) > 0);
        if (en.takeDamage) {
          en.takeDamage(dmg);
        } else {
          if (en.health !== undefined) en.health -= dmg;
          else if (en.hp !== undefined) en.hp    -= dmg;
        }
        var nowDead = ((en.health !== undefined ? en.health : (en.hp || 0)) <= 0);
        if (wasAlive && nowDead) {
          barrelKills++;
          _chainKillCount++;
          _addScore(SCORE_BARREL_KILL);
          _showToast('BARREL KILL! +' + SCORE_BARREL_KILL);
        }
      }
    }

    // Chain-kill bonus (deferred so cascades can accumulate)
    if (barrelKills > 0 && _chainActive) {
      setTimeout(function () {
        if (_chainKillCount >= CHAIN_KILL_THRESHOLD) {
          _addScore(SCORE_CHAIN_BONUS);
          _showToast('CHAIN REACTION! +' + SCORE_CHAIN_BONUS);
          _chainKillCount = 0;
        }
      }, CHAIN_DELAY_MS * 5);
    }

    // Player damage (inner radius only)
    if (_camera) {
      var pp   = _camera.position;
      var pdx  = pp.x - pos.x;
      var pdy  = pp.y - pos.y;
      var pdz  = pp.z - pos.z;
      var pd   = Math.sqrt(pdx*pdx + pdy*pdy + pdz*pdz);
      if (pd <= BLAST_INNER_RADIUS && window.player) {
        if (window.player.health !== undefined) window.player.health -= PLAYER_INNER_DMG;
      }
    }
  }

  // ─── score / HUD helpers ──────────────────────────────────────────────────
  function _addScore(pts) {
    if (window.player && window.player.score !== undefined) window.player.score += pts;
  }
  function _showToast(msg) {
    if (window.HUD && window.HUD.showToast) window.HUD.showToast(msg);
  }

  // ─── core explosion ───────────────────────────────────────────────────────
  function _triggerExplosion(idx) {
    var b = _barrels[idx];
    if (!b || b.exploded) return;
    b.exploded = true;

    if (b._warnLight && _scene) { _scene.remove(b._warnLight); b._warnLight = null; }

    var px = b.mesh.position.x;
    var py = b.mesh.position.y;
    var pz = b.mesh.position.z;
    if (_scene) _scene.remove(b.mesh);

    var fxPos = new THREE.Vector3(px, py, pz);
    _spawnExplosionFX(fxPos);
    _playExplosionSound();
    _applyBlastDamage(fxPos);

    if (typeof window._onExplosion === 'function') {
      window._onExplosion(px, py, pz, CHAIN_RADIUS, ENEMY_INNER_DMG);
    }

    // Start chain-kill tracking window
    if (!_chainActive) {
      _chainActive = true;
      setTimeout(function () { _chainActive = false; _chainKillCount = 0; }, 3000);
    }

    // Chain detonation — nearby barrels blow with 300 ms delay
    for (var ci = 0; ci < _barrels.length; ci++) {
      if (_barrels[ci].exploded || ci === idx) continue;
      var nb  = _barrels[ci];
      var ddx = nb.mesh.position.x - px;
      var ddz = nb.mesh.position.z - pz;
      if (Math.sqrt(ddx*ddx + ddz*ddz) <= CHAIN_RADIUS) {
        (function (nidx) {
          setTimeout(function () { _triggerExplosion(nidx); }, CHAIN_DELAY_MS);
        })(ci);
      }
    }
  }

  // ─── hit a barrel ────────────────────────────────────────────────────────
  function _hitBarrel(idx, dmg) {
    var b = _barrels[idx];
    if (!b || b.exploded) return;
    b.hp -= (dmg || 25);

    // Darken at half HP
    if (b.hp < BARREL_HP * 0.5 && b.mesh.children[0] &&
        b.mesh.children[0].material && b.mesh.children[0].material.color) {
      b.mesh.children[0].material.color.setHex(0x881100);
    }

    // Pre-explosion warning below 25 % HP
    if (b.hp > 0 && b.hp < BARREL_HP * WARNING_HP_FRACTION) {
      _addWarningGlow(b);
      _playWarningSound();
    }

    if (b.hp <= 0) _triggerExplosion(idx);
  }

  // ─── spawn helpers ────────────────────────────────────────────────────────
  function _spawnBarrel(x, z) {
    var y = 0;
    if (typeof window.VoxelWorld !== 'undefined' && window.VoxelWorld.getTerrainHeight) {
      y = window.VoxelWorld.getTerrainHeight(x, z);
    }
    var mesh   = _buildBarrelMesh(x, y, z);
    var barrel = {
      mesh:       mesh,
      hp:         BARREL_HP,
      maxHp:      BARREL_HP,
      exploded:   false,
      _warnLight: null,
      position:   mesh.position
    };
    _barrels.push(barrel);
    return barrel;
  }

  function _spawnInitialBarrels() {
    var count = SPAWN_COUNT_MIN + Math.floor(Math.random() * (SPAWN_COUNT_MAX - SPAWN_COUNT_MIN + 1));
    for (var i = 0; i < count; i++) {
      var angle = Math.random() * Math.PI * 2;
      var dist  = SPAWN_MIN_DIST + Math.random() * (SPAWN_MAX_DIST - SPAWN_MIN_DIST);
      _spawnBarrel(Math.cos(angle) * dist, Math.sin(angle) * dist);
    }
  }

  function _clearAll() {
    for (var i = 0; i < _barrels.length; i++) {
      var b = _barrels[i];
      if (b._warnLight && _scene) _scene.remove(b._warnLight);
      if (!b.exploded && _scene)  _scene.remove(b.mesh);
    }
    _barrels = [];
  }

  // ─── shot-fired hook ──────────────────────────────────────────────────────
  function _hookShotFired() {
    _prevOnShotFired   = window._onShotFired || null;
    window._onShotFired = function (shotPos, shotDir) {
      for (var i = 0; i < _barrels.length; i++) {
        var b  = _barrels[i];
        if (b.exploded) continue;
        var bp = b.mesh.position;
        var dx = bp.x - shotPos.x;
        var dy = bp.y - shotPos.y;
        var dz = bp.z - shotPos.z;
        var t  = dx * shotDir.x + dy * shotDir.y + dz * shotDir.z;
        if (t < 0) continue;
        var cx     = shotPos.x + shotDir.x * t - bp.x;
        var cy     = shotPos.y + shotDir.y * t - bp.y;
        var cz     = shotPos.z + shotDir.z * t - bp.z;
        var perpSq = cx*cx + cy*cy + cz*cz;
        if (perpSq < BARREL_RADIUS * BARREL_RADIUS) {
          _hitBarrel(i, 25);
          break;
        }
      }
      if (_prevOnShotFired) _prevOnShotFired(shotPos, shotDir);
    };
  }

  function _unhookShotFired() {
    window._onShotFired = _prevOnShotFired;
    _prevOnShotFired    = null;
  }

  // ─── public API ───────────────────────────────────────────────────────────

  /**
   * init(scene, camera)
   * Spawns 8-12 barrels scattered 20-50 units from origin.
   */
  function init(scene, camera) {
    _scene  = scene  || window._gameScene || null;
    _camera = camera || window._camera    || null;
    _clearAll();
    _hookShotFired();
    _spawnInitialBarrels();
  }

  /** update(dt) — reserved for future per-frame logic. */
  function update(dt) { /* no-op */ }

  /** reset() — clear barrels, unhook callbacks, cancel respawn. */
  function reset() {
    _clearAll();
    _unhookShotFired();
    if (_respawnTimer >= 0) { clearTimeout(_respawnTimer); _respawnTimer = -1; }
    _chainKillCount = 0;
    _chainActive    = false;
  }

  /** spawnBarrel(x, z) — manually place a barrel. */
  function spawnBarrel(x, z) { return _spawnBarrel(x, z); }

  /**
   * getBarrels()
   * Returns live barrel array.  Each entry: { mesh, hp, maxHp, exploded, position }.
   */
  function getBarrels() { return _barrels; }

  /** onWaveClear() — respawns new barrels after 30 s. */
  function onWaveClear() {
    _clearAll();
    _respawnTimer = setTimeout(function () {
      _respawnTimer = -1;
      if (_scene) _spawnInitialBarrels();
    }, RESPAWN_DELAY_MS);
  }

  return {
    init:        init,
    update:      update,
    reset:       reset,
    spawnBarrel: spawnBarrel,
    getBarrels:  getBarrels,
    onWaveClear: onWaveClear,
    hitBarrel:   function (idx, dmg) { _hitBarrel(idx, dmg); },
  };

})();
