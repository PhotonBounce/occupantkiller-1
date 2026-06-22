// minefield-area.js — Deployable scatter minefield with chain-reaction detonation
// Key: Ctrl+Shift+M to scatter 8-12 anti-personnel mines in a 5-unit radius circle
// All var — no let/const. IIFE pattern.
window.MinefieldArea = (function () {
  'use strict';

  // ── Constants ─────────────────────────────────────────────────────────────
  var MAX_CHARGES       = 2;      // charges the player starts with
  var COOLDOWN_TIME     = 90;     // seconds per charge recharge
  var DROP_DISTANCE     = 10;     // units ahead of camera to center the field
  var SCATTER_RADIUS    = 5;      // radius of the scatter circle (units)
  var MINES_MIN         = 8;      // minimum mines per deploy
  var MINES_MAX         = 12;     // maximum mines per deploy
  var TRIGGER_RADIUS    = 0.6;    // per-mine trigger radius (units)
  var WARN_RADIUS       = 1.2;    // friendly-mine proximity warning
  var MINE_LIFETIME     = 120;    // seconds before self-destruct
  var CHAIN_DELAY       = 0.15;   // seconds delay for chain-reaction
  var CHAIN_RADIUS      = 2;      // units within which chain triggers
  var ENEMY_DMG         = 70;     // direct hit damage
  var BLAST_RADIUS      = 1.5;    // secondary blast radius (units)
  var BLAST_DMG         = 35;     // secondary blast damage
  var SCORE_PER_KILL    = 80;     // score bonus per enemy killed
  var DUST_PARTICLES    = 18;     // deploy dust particle count
  var FLASH_DURATION    = 0.3;    // explosion flash duration (seconds)

  // ── State ─────────────────────────────────────────────────────────────────
  var _scene      = null;
  var _camera     = null;
  var _charges    = MAX_CHARGES;
  var _cooldown   = 0;            // seconds remaining on recharge
  var _mines      = [];           // all mine objects
  var _hudEl      = null;
  var _warnEl     = null;
  var _warnTimer  = 0;
  var _keyBound   = false;

  // Expose mine positions for other systems (mine-sweeper-tool, pathfinding)
  window._minePositions     = window._minePositions     || [];
  window._minefieldPositions = window._minefieldPositions || [];

  // ── Helpers: enemy / player access ────────────────────────────────────────
  function _getEnemies() {
    if (window._enemies && Array.isArray(window._enemies)) return window._enemies;
    if (window.Enemies && Array.isArray(window.Enemies.list))  return window.Enemies.list;
    return [];
  }

  function _getPlayerPos() {
    if (window._player && window._player.position) return window._player.position;
    if (window.player  && window.player.position)  return window.player.position;
    if (_camera)                                    return _camera.position;
    return new THREE.Vector3();
  }

  function _addScore(n) {
    if (window.player  && typeof window.player.score  === 'number') { window.player.score  += n; }
    if (window._player && typeof window._player.score === 'number') { window._player.score += n; }
    if (window.HUD && typeof window.HUD.setScore === 'function') {
      var s = (window.player && window.player.score) || (window._player && window._player.score) || 0;
      window.HUD.setScore(s);
    }
  }

  // ── Audio helpers ──────────────────────────────────────────────────────────
  function _playBeep(freq, dur, type) {
    var ctx = window._audioCtx;
    if (!ctx) return;
    try {
      var osc  = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.type = type || 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.35, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + dur);
    } catch (e) {}
  }

  function _playExplosionSFX() {
    var ctx = window._audioCtx;
    if (!ctx) return;
    try {
      // Thump
      var osc1  = ctx.createOscillator();
      var gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(90, ctx.currentTime);
      osc1.frequency.exponentialRampToValueAtTime(18, ctx.currentTime + 0.25);
      gain1.gain.setValueAtTime(1.2, ctx.currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start();
      osc1.stop(ctx.currentTime + 0.25);
      // Crack
      var osc2  = ctx.createOscillator();
      var gain2 = ctx.createGain();
      osc2.type = 'sawtooth';
      osc2.frequency.setValueAtTime(700, ctx.currentTime);
      osc2.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.12);
      gain2.gain.setValueAtTime(0.5, ctx.currentTime);
      gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start();
      osc2.stop(ctx.currentTime + 0.12);
    } catch (e) {}
  }

  function _playDisarmSFX() {
    // Quiet click — mine lifetime expired
    _playBeep(1200, 0.04, 'square');
  }

  function _playWarnBeep() {
    _playBeep(880, 0.08, 'square');
    setTimeout(function () { _playBeep(880, 0.08, 'square'); }, 120);
  }

  function _playDeploySound() {
    // Soft thud + rustle
    var ctx = window._audioCtx;
    if (!ctx) return;
    try {
      var buf   = ctx.createBuffer(1, ctx.sampleRate * 0.2, ctx.sampleRate);
      var data  = buf.getChannelData(0);
      for (var i = 0; i < data.length; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.max(0, 1 - i / data.length) * 0.3;
      }
      var src  = ctx.createBufferSource();
      var gain = ctx.createGain();
      src.buffer = buf;
      gain.gain.setValueAtTime(0.6, ctx.currentTime);
      src.connect(gain);
      gain.connect(ctx.destination);
      src.start();
    } catch (e) {}
  }

  // ── HUD ───────────────────────────────────────────────────────────────────
  function _ensureHUD() {
    if (document.getElementById('minefieldHUD')) {
      _hudEl = document.getElementById('minefieldHUD');
      return;
    }
    var el = document.createElement('div');
    el.id = 'minefieldHUD';
    el.style.cssText = [
      'position:fixed',
      'bottom:136px',
      'right:14px',
      'font-family:monospace',
      'font-size:13px',
      'color:#88cc55',
      'text-shadow:0 0 5px #336600,0 0 2px #000',
      'background:rgba(0,0,0,0.50)',
      'padding:3px 8px',
      'border-radius:4px',
      'z-index:1000',
      'pointer-events:none',
      'user-select:none'
    ].join(';');
    document.body.appendChild(el);
    _hudEl = el;
  }

  function _updateHUD() {
    if (!_hudEl) _hudEl = document.getElementById('minefieldHUD');
    if (!_hudEl) return;
    var label = '💣 MINEFIELD \xD7' + _charges;
    if (_charges < MAX_CHARGES) {
      var secs = Math.ceil(_cooldown);
      label += ' (' + secs + 's)';
    }
    _hudEl.textContent = label;
    _hudEl.style.color = _charges > 0 ? '#88cc55' : '#666655';
  }

  function _ensureWarnEl() {
    if (document.getElementById('minefieldWarn')) {
      _warnEl = document.getElementById('minefieldWarn');
      return;
    }
    var el = document.createElement('div');
    el.id = 'minefieldWarn';
    el.style.cssText = [
      'position:fixed',
      'top:38%',
      'left:50%',
      'transform:translateX(-50%)',
      'font-family:monospace',
      'font-size:22px',
      'font-weight:bold',
      'color:#ffdd00',
      'text-shadow:0 0 8px #ff6600,0 0 2px #000',
      'background:rgba(0,0,0,0.55)',
      'padding:6px 18px',
      'border-radius:6px',
      'z-index:9998',
      'pointer-events:none',
      'display:none',
      'letter-spacing:2px'
    ].join(';');
    el.textContent = '⚠ FRIENDLY MINE';
    document.body.appendChild(el);
    _warnEl = el;
  }

  function _showFriendlyWarn() {
    if (!_warnEl) _warnEl = document.getElementById('minefieldWarn');
    if (!_warnEl) return;
    _warnEl.style.display = 'block';
    _warnTimer = 1.5;
  }

  // ── Mine mesh ─────────────────────────────────────────────────────────────
  function _buildMineMesh() {
    // Olive-green disk, slightly buried
    var geo = new THREE.CylinderGeometry(0.18, 0.22, 0.08, 12);
    var mat = new THREE.MeshLambertMaterial({
      color: 0x4a5a28,
      opacity: 0.7,
      transparent: true
    });
    var mesh = new THREE.Mesh(geo, mat);
    return mesh;
  }

  // ── Deploy VFX: dusty particle burst ──────────────────────────────────────
  function _spawnDustBurst(centerPos) {
    if (!_scene) return;
    var particles = [];
    var geo  = new THREE.SphereGeometry(0.05, 4, 4);
    var mat  = new THREE.MeshLambertMaterial({ color: 0xbbaa88, transparent: true, opacity: 0.7 });
    for (var i = 0; i < DUST_PARTICLES; i++) {
      var m = new THREE.Mesh(geo, mat.clone());
      var angle  = Math.random() * Math.PI * 2;
      var spread = Math.random() * SCATTER_RADIUS;
      m.position.set(
        centerPos.x + Math.cos(angle) * spread,
        centerPos.y + 0.1 + Math.random() * 0.3,
        centerPos.z + Math.sin(angle) * spread
      );
      var vel = {
        x: (Math.random() - 0.5) * 1.5,
        y: 0.5 + Math.random() * 1.0,
        z: (Math.random() - 0.5) * 1.5
      };
      _scene.add(m);
      particles.push({ mesh: m, vel: vel, life: 0.6 + Math.random() * 0.4 });
    }

    var last = null;
    function animDust(ts) {
      if (!last) last = ts;
      var dt = Math.min((ts - last) / 1000, 0.05);
      last = ts;
      var any = false;
      for (var j = 0; j < particles.length; j++) {
        var p = particles[j];
        if (!p || p.life <= 0) continue;
        p.life -= dt;
        p.vel.y -= 3 * dt;
        p.mesh.position.x += p.vel.x * dt;
        p.mesh.position.y += p.vel.y * dt;
        p.mesh.position.z += p.vel.z * dt;
        p.mesh.material.opacity = Math.max(0, p.life * 1.2) * 0.7;
        if (p.life <= 0) {
          if (_scene) _scene.remove(p.mesh);
          particles[j] = null;
        } else {
          any = true;
        }
      }
      if (any) requestAnimationFrame(animDust);
    }
    requestAnimationFrame(animDust);
  }

  // ── Explosion VFX ─────────────────────────────────────────────────────────
  function _spawnExplosionVFX(pos) {
    if (!_scene) return;

    // Flash sphere: orange → transparent over FLASH_DURATION
    var sGeo  = new THREE.SphereGeometry(0.3, 8, 8);
    var sMat  = new THREE.MeshBasicMaterial({ color: 0xFF6600, transparent: true, opacity: 1.0 });
    var flash = new THREE.Mesh(sGeo, sMat);
    flash.position.copy(pos);
    flash.position.y += 0.15;
    _scene.add(flash);

    // Point light pulse
    var light = new THREE.PointLight(0xFF4400, 10, 4);
    light.position.copy(flash.position);
    _scene.add(light);

    var start = null;
    function animFlash(ts) {
      if (!start) start = ts;
      var t = (ts - start) / (FLASH_DURATION * 1000);
      if (t < 1) {
        sMat.opacity = 1 - t;
        light.intensity = 10 * (1 - t);
        flash.scale.setScalar(1 + t * 2);
        requestAnimationFrame(animFlash);
      } else {
        if (_scene) { _scene.remove(flash); _scene.remove(light); }
      }
    }
    requestAnimationFrame(animFlash);
  }

  // ── Mine detonation ────────────────────────────────────────────────────────
  function _detonateMine(mine, fromChain) {
    if (!mine.active) return;
    mine.active = false;

    // Remove from scene
    if (_scene && mine.mesh) _scene.remove(mine.mesh);

    // Remove from global position arrays
    _syncGlobals();

    _spawnExplosionVFX(mine.position);
    _playExplosionSFX();

    // Damage enemies in blast radius
    var enemies = _getEnemies();
    for (var i = 0; i < enemies.length; i++) {
      var en = enemies[i];
      if (!en || !en.position) continue;
      var dist = en.position.distanceTo(mine.position);
      var killed = false;
      if (dist < TRIGGER_RADIUS) {
        // Direct hit
        killed = _damageEnemy(en, ENEMY_DMG);
      } else if (dist < BLAST_RADIUS) {
        // Secondary blast
        killed = _damageEnemy(en, BLAST_DMG);
      }
      if (killed) {
        _addScore(SCORE_PER_KILL);
        if (window.HUD && typeof window.HUD.addKillFeedEntry === 'function') {
          window.HUD.addKillFeedEntry('You', 'Enemy', 'Minefield');
        }
      }
    }

    // Chain reaction — trigger nearby mines after delay
    var pos = mine.position;
    for (var j = 0; j < _mines.length; j++) {
      var other = _mines[j];
      if (!other || !other.active) continue;
      if (other.position.distanceTo(pos) < CHAIN_RADIUS) {
        (function (m) {
          setTimeout(function () { _detonateMine(m, true); }, CHAIN_DELAY * 1000);
        })(other);
      }
    }
  }

  function _damageEnemy(en, dmg) {
    // Try common damage interfaces
    if (typeof en.takeDamage === 'function') {
      en.takeDamage(dmg);
    } else if (typeof en.hp === 'number') {
      en.hp -= dmg;
    } else if (typeof en.health === 'number') {
      en.health -= dmg;
    }
    var hp = (typeof en.hp === 'number') ? en.hp : (typeof en.health === 'number' ? en.health : 1);
    return hp <= 0;
  }

  // ── Place individual mines ─────────────────────────────────────────────────
  function _placeMine(x, y, z) {
    if (!_scene) return null;
    var mesh = _buildMineMesh();
    mesh.position.set(x, y + 0.03, z);  // slightly buried
    _scene.add(mesh);

    var mine = {
      mesh:     mesh,
      position: mesh.position,
      active:   true,
      lifetime: MINE_LIFETIME,
      warnedPlayer: false
    };
    _mines.push(mine);
    return mine;
  }

  // ── Sync global position arrays ────────────────────────────────────────────
  function _syncGlobals() {
    window._minePositions = [];
    window._minefieldPositions = [];
    for (var i = 0; i < _mines.length; i++) {
      var m = _mines[i];
      if (m && m.active) {
        window._minePositions.push(m.position.clone());
        window._minefieldPositions.push(m.position.clone());
      }
    }
  }

  // ── Key binding ────────────────────────────────────────────────────────────
  function _bindKey() {
    if (_keyBound) return;
    _keyBound = true;
    document.addEventListener('keydown', function (e) {
      if (e.ctrlKey && e.shiftKey && (e.key === 'M' || e.key === 'm')) {
        e.preventDefault();
        deploy();
      }
    });
  }

  // ── Public: deploy ─────────────────────────────────────────────────────────
  function deploy() {
    if (_charges <= 0) {
      if (window.HUD && typeof window.HUD.showToast === 'function') {
        window.HUD.showToast('MINEFIELD RECHARGING...', 1500, '#888866');
      }
      return;
    }
    if (!_camera) return;

    // Find drop point: DROP_DISTANCE units ahead at ground level
    var dir = new THREE.Vector3();
    _camera.getWorldDirection(dir);
    dir.y = 0;
    dir.normalize();

    var camPos = _camera.position;
    var centerX = camPos.x + dir.x * DROP_DISTANCE;
    var centerZ = camPos.z + dir.z * DROP_DISTANCE;
    var groundY = 0;

    // Count mines to scatter
    var count = MINES_MIN + Math.floor(Math.random() * (MINES_MAX - MINES_MIN + 1));
    for (var i = 0; i < count; i++) {
      var angle  = Math.random() * Math.PI * 2;
      var radius = Math.random() * SCATTER_RADIUS;
      var mx = centerX + Math.cos(angle) * radius;
      var mz = centerZ + Math.sin(angle) * radius;
      _placeMine(mx, groundY, mz);
    }

    // Deploy VFX and sound
    var centerPos = new THREE.Vector3(centerX, groundY, centerZ);
    _spawnDustBurst(centerPos);
    _playDeploySound();

    // Update globals and charges
    _charges--;
    _syncGlobals();
    _updateHUD();

    if (window.HUD && typeof window.HUD.showToast === 'function') {
      window.HUD.showToast('💣 MINEFIELD DEPLOYED', 1800, '#88cc55');
    }
    if (window.HUD && typeof window.HUD.addCombatLog === 'function') {
      window.HUD.addCombatLog('Minefield scattered (' + count + ' mines)', '#88cc55');
    }
  }

  // ── Public: init ──────────────────────────────────────────────────────────
  function init(scene, camera) {
    _scene   = scene;
    _camera  = camera;
    _charges = MAX_CHARGES;
    _cooldown = 0;
    _mines   = [];
    _warnTimer = 0;

    window._minePositions      = [];
    window._minefieldPositions = [];

    _ensureHUD();
    _ensureWarnEl();
    _updateHUD();
    _bindKey();
  }

  // ── Public: update (called each frame with delta in seconds) ──────────────
  function update(delta) {
    if (!delta || delta <= 0) delta = 0.016;

    // Recharge logic
    if (_charges < MAX_CHARGES) {
      _cooldown -= delta;
      if (_cooldown <= 0) {
        _charges++;
        _cooldown = _charges < MAX_CHARGES ? COOLDOWN_TIME : 0;
        _updateHUD();
        if (window.HUD && typeof window.HUD.showToast === 'function') {
          window.HUD.showToast('💣 MINEFIELD CHARGE READY', 1600, '#88cc55');
        }
      }
      // Update HUD countdown every frame (cheap text update throttled below)
      _updateHUD();
    }

    // Friendly-mine warning display
    if (_warnTimer > 0) {
      _warnTimer -= delta;
      if (_warnTimer <= 0) {
        _warnTimer = 0;
        if (_warnEl) _warnEl.style.display = 'none';
      }
    }

    var playerPos = _getPlayerPos();
    var now       = Date.now();
    var didSyncGlobals = false;

    for (var i = 0; i < _mines.length; i++) {
      var mine = _mines[i];
      if (!mine || !mine.active) continue;

      // Lifetime countdown
      mine.lifetime -= delta;
      if (mine.lifetime <= 0) {
        mine.active = false;
        if (_scene && mine.mesh) _scene.remove(mine.mesh);
        _playDisarmSFX();
        didSyncGlobals = true;
        continue;
      }

      // Friendly proximity warning (player-safe — never detonates on player)
      var playerDist = mine.position.distanceTo(playerPos);
      if (playerDist < WARN_RADIUS) {
        if (!mine.warnedPlayer) {
          mine.warnedPlayer = true;
          _playWarnBeep();
          _showFriendlyWarn();
        }
      } else {
        mine.warnedPlayer = false;
      }

      // Enemy trigger check
      var enemies = _getEnemies();
      for (var j = 0; j < enemies.length; j++) {
        var en = enemies[j];
        if (!en || !en.position) continue;
        var dist = en.position.distanceTo(mine.position);
        if (dist < TRIGGER_RADIUS) {
          _detonateMine(mine);
          didSyncGlobals = true;
          break;
        }
      }
    }

    // Prune dead mines periodically (avoid ever-growing array)
    // Use a simple modulo trick on array length change
    if (didSyncGlobals) {
      _syncGlobals();
      var live = [];
      for (var k = 0; k < _mines.length; k++) {
        if (_mines[k] && _mines[k].active) live.push(_mines[k]);
      }
      _mines = live;
    }
  }

  // ── Public: reset ─────────────────────────────────────────────────────────
  function reset() {
    for (var i = 0; i < _mines.length; i++) {
      var m = _mines[i];
      if (m && m.mesh && _scene) _scene.remove(m.mesh);
    }
    _mines    = [];
    _charges  = MAX_CHARGES;
    _cooldown = 0;
    _warnTimer = 0;
    if (_warnEl) _warnEl.style.display = 'none';
    window._minePositions      = [];
    window._minefieldPositions = [];
    _updateHUD();
  }

  // ── Public: getMines ──────────────────────────────────────────────────────
  function getMines() {
    var result = [];
    for (var i = 0; i < _mines.length; i++) {
      var m = _mines[i];
      if (!m) continue;
      result.push({ position: m.position.clone(), active: m.active });
    }
    return result;
  }

  // ── Public API ────────────────────────────────────────────────────────────
  return { init: init, update: update, deploy: deploy, reset: reset, getMines: getMines };

})();
