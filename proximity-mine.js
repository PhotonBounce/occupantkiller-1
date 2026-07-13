// proximity-mine.js — Precision deployable proximity mine with pressure sensor
// Keybind: Alt+M to plant at feet; 4 mines max, 25s recharge per mine
// Player NOT affected by own mines; approach + hold F 3s to recover.
// All var — no let/const. IIFE pattern.
window.ProximityMine = (function () {
  'use strict';

  // ── Constants ─────────────────────────────────────────────────────────────
  var MAX_MINES        = 4;     // max mines in world simultaneously
  var RECHARGE_TIME    = 25;    // seconds per mine recharge
  var ARM_DELAY        = 2.0;   // seconds after planting before mine arms
  var TRIGGER_RADIUS   = 1.2;   // units — enemy step-on radius
  var TRIGGER_DELAY    = 0.5;   // seconds between trigger and explosion
  var DISARM_RADIUS    = 1.5;   // units — player must be within to disarm
  var DISARM_HOLD      = 3.0;   // seconds F must be held to recover mine
  var BLAST_DMG_CLOSE  = 180;   // damage within 2.5 units
  var BLAST_DMG_MID    = 90;    // damage within 5 units
  var BLAST_DMG_FAR    = 40;    // damage within 8 units
  var BLAST_RADIUS_1   = 2.5;   // inner blast zone (units)
  var BLAST_RADIUS_2   = 5.0;   // mid blast zone (units)
  var BLAST_RADIUS_3   = 8.0;   // outer blast zone (units)
  var KNOCKBACK_Y      = 8;     // upward knockback applied to enemy
  var CHAIN_RADIUS     = 4.0;   // mines within this distance also trigger (1 chain max)
  var SCORE_PER_KILL   = 350;   // score per enemy killed
  var BLINK_ARMED      = 1.5;   // blink interval (seconds) when armed
  var BLINK_ARMING     = 0.15;  // fast blink interval (seconds) when arming

  // ── State ─────────────────────────────────────────────────────────────────
  var _scene       = null;
  var _camera      = null;
  var _mines       = [];        // active mine objects
  var _inventory   = MAX_MINES; // mines available to plant
  var _recharge    = 0;         // seconds until next mine recharges
  var _keyBound    = false;
  var _fKeyDown    = false;     // is F currently held
  var _disarmTimer = 0;         // how long F has been held near a mine
  var _disarmTarget = null;     // mine object being disarmed
  var _hudEl       = null;

  // Global array of active mine objects (for other systems to read)
  window._activeMines = window._activeMines || [];

  // ── Enemy / player access helpers ─────────────────────────────────────────
  function _getEnemies() {
    if (window._enemies && Array.isArray(window._enemies)) return window._enemies;
    if (window.Enemies && Array.isArray(window.Enemies.list)) return window.Enemies.list;
    if (window.Enemies && typeof window.Enemies.getAll === 'function') return window.Enemies.getAll();
    return [];
  }

  function _getPlayerPos() {
    if (window._player && window._player.position) return window._player.position;
    if (window.player  && window.player.position)  return window.player.position;
    if (_camera) return _camera.position;
    return new THREE.Vector3();
  }

  function _addScore(n) {
    if (window.player  && typeof window.player.score  === 'number') window.player.score  += n;
    if (window._player && typeof window._player.score === 'number') window._player.score += n;
    if (window.HUD && typeof window.HUD.setScore === 'function') {
      var s = (window.player && window.player.score) || (window._player && window._player.score) || 0;
      window.HUD.setScore(s);
    }
  }

  function _damageEnemy(en, dmg) {
    if (typeof en.takeDamage === 'function') {
      en.takeDamage(dmg);
    } else if (typeof en.hp === 'number') {
      en.hp -= dmg;
    } else if (typeof en.health === 'number') {
      en.health -= dmg;
    }
    var hp = (typeof en.hp === 'number') ? en.hp
           : (typeof en.health === 'number') ? en.health : 1;
    return hp <= 0;
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
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + dur);
    } catch (e) {}
  }

  function _playPlantSFX() {
    // Soft thud — mine set down
    var ctx = window._audioCtx;
    if (!ctx) return;
    try {
      var buf  = ctx.createBuffer(1, ctx.sampleRate * 0.15, ctx.sampleRate);
      var data = buf.getChannelData(0);
      for (var i = 0; i < data.length; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.max(0, 1 - i / data.length) * 0.25;
      }
      var src  = ctx.createBufferSource();
      var gain = ctx.createGain();
      src.buffer = buf;
      gain.gain.setValueAtTime(0.5, ctx.currentTime);
      src.connect(gain);
      gain.connect(ctx.destination);
      src.start();
    } catch (e) {}
  }

  function _playExplosionSFX() {
    var ctx = window._audioCtx;
    if (!ctx) return;
    try {
      var osc1  = ctx.createOscillator();
      var gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(80, ctx.currentTime);
      osc1.frequency.exponentialRampToValueAtTime(16, ctx.currentTime + 0.3);
      gain1.gain.setValueAtTime(1.5, ctx.currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start();
      osc1.stop(ctx.currentTime + 0.3);

      var osc2  = ctx.createOscillator();
      var gain2 = ctx.createGain();
      osc2.type = 'sawtooth';
      osc2.frequency.setValueAtTime(900, ctx.currentTime);
      osc2.frequency.exponentialRampToValueAtTime(180, ctx.currentTime + 0.18);
      gain2.gain.setValueAtTime(0.45, ctx.currentTime);
      gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start();
      osc2.stop(ctx.currentTime + 0.2);
    } catch (e) {}
  }

  function _playDisarmSFX() {
    _playBeep(1400, 0.06, 'square');
    setTimeout(function () { _playBeep(1800, 0.06, 'square'); }, 80);
  }

  function _playArmedSFX() {
    // Short double-beep: mine is now armed
    _playBeep(660, 0.05, 'square');
    setTimeout(function () { _playBeep(880, 0.05, 'square'); }, 90);
  }

  // ── Mine mesh builder ──────────────────────────────────────────────────────
  function _buildMineMesh() {
    var group = new THREE.Group();

    // Flat disk — main body, olive drab
    var diskGeo = new THREE.CylinderGeometry(0.25, 0.25, 0.06, 12);
    var diskMat = new THREE.MeshLambertMaterial({ color: 0x4A5A2A });
    var disk = new THREE.Mesh(diskGeo, diskMat);
    group.add(disk);

    // Raised pressure plate in center
    var plateGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.04, 8);
    var plateMat = new THREE.MeshLambertMaterial({ color: 0x3A4A1A });
    var plate = new THREE.Mesh(plateGeo, plateMat);
    plate.position.y = 0.05;
    group.add(plate);

    // Tiny blinking red point light on top
    var light = new THREE.PointLight(0xFF0000, 0.3, 1);
    light.position.y = 0.1;
    group.add(light);

    return { group: group, light: light };
  }

  // ── HUD ───────────────────────────────────────────────────────────────────
  function _ensureHUD() {
    if (document.getElementById('proximityMineHUD')) {
      _hudEl = document.getElementById('proximityMineHUD');
      return;
    }
    var el = document.createElement('div');
    el.id = 'proximityMineHUD';
    el.style.cssText = [
      'position:fixed',
      'bottom:112px',
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
    if (!_hudEl) _hudEl = document.getElementById('proximityMineHUD');
    if (!_hudEl) return;

    // Count live mines and check for any arming
    var liveMines = 0;
    var anyArming = false;
    for (var i = 0; i < _mines.length; i++) {
      var m = _mines[i];
      if (m && !m.triggered && !m.exploded) {
        liveMines++;
        if (!m.armed) anyArming = true;
      }
    }

    var label = '💣 MINE \xD7' + _inventory;
    if (_inventory < MAX_MINES) {
      var secs = Math.ceil(_recharge);
      label += ' (' + secs + 's)';
    }
    if (anyArming) {
      label += ' — ARMING...';
      _hudEl.style.color = '#ffcc00';
    } else {
      _hudEl.style.color = _inventory > 0 ? '#88cc55' : '#666655';
    }
    if (liveMines > 0 && !anyArming) {
      label += ' — PLACED:' + liveMines;
    }
    _hudEl.textContent = label;
  }

  // ── Disarm progress bar ────────────────────────────────────────────────────
  function _ensureDisarmBar() {
    if (document.getElementById('proximityMineDisarmBar')) return;
    var bar = document.createElement('div');
    bar.id = 'proximityMineDisarmBar';
    bar.style.cssText = [
      'position:fixed',
      'bottom:135px',
      'right:14px',
      'width:120px',
      'height:6px',
      'background:rgba(0,0,0,0.5)',
      'border-radius:3px',
      'z-index:1001',
      'pointer-events:none',
      'display:none'
    ].join(';');
    var fill = document.createElement('div');
    fill.id = 'proximityMineDisarmFill';
    fill.style.cssText = [
      'height:100%',
      'width:0%',
      'background:#ffcc00',
      'border-radius:3px',
      'transition:width 0.1s linear'
    ].join(';');
    bar.appendChild(fill);
    document.body.appendChild(bar);
  }

  function _setDisarmBar(pct) {
    var bar  = document.getElementById('proximityMineDisarmBar');
    var fill = document.getElementById('proximityMineDisarmFill');
    if (!bar || !fill) return;
    if (pct <= 0) {
      bar.style.display = 'none';
      fill.style.width  = '0%';
    } else {
      bar.style.display = 'block';
      fill.style.width  = Math.min(100, pct * 100) + '%';
    }
  }

  // ── Explosion VFX ─────────────────────────────────────────────────────────
  function _spawnExplosionVFX(pos) {
    if (!_scene) return;

    // Orange point light flash
    var flashLight = new THREE.PointLight(0xFF8800, 8, 10);
    flashLight.position.copy(pos);
    flashLight.position.y += 0.5;
    _scene.add(flashLight);

    // Smoke sphere
    var smokeGeo = new THREE.SphereGeometry(1, 7, 7);
    var smokeMat = new THREE.MeshBasicMaterial({ color: 0x555555, transparent: true, opacity: 0.55 });
    var smoke = new THREE.Mesh(smokeGeo, smokeMat);
    smoke.position.copy(pos);
    smoke.position.y += 0.4;
    _scene.add(smoke);

    // 10 debris chunks
    var debrisGeo = new THREE.BoxGeometry(0.08, 0.08, 0.08);
    var debrisMat = new THREE.MeshLambertMaterial({ color: 0x4A5A2A });
    var debrisList = [];
    for (var di = 0; di < 10; di++) {
      var d = new THREE.Mesh(debrisGeo, debrisMat);
      d.position.copy(pos);
      d.position.y += 0.1;
      var angle = (di / 10) * Math.PI * 2;
      var speed = 2 + Math.random() * 4;
      var dvel = {
        x: Math.sin(angle) * speed * (0.6 + Math.random() * 0.4),
        y: 3 + Math.random() * 4,
        z: Math.cos(angle) * speed * (0.6 + Math.random() * 0.4)
      };
      _scene.add(d);
      debrisList.push({ mesh: d, vel: dvel, life: 0.9 + Math.random() * 0.5 });
    }

    // Camera shake
    window._cameraShake = { intensity: 0.7, duration: 0.8 };

    var startTs = null;
    function animExp(ts) {
      if (!startTs) startTs = ts;
      var t = (ts - startTs) / 1000;

      // Flash light fades over 0.4s
      if (t < 0.4) {
        flashLight.intensity = 8 * (1 - t / 0.4);
      } else {
        if (_scene) _scene.remove(flashLight);
      }

      // Smoke rises and fades over 1.8s
      if (t < 1.8) {
        var ss = 1 + t * 1.5;
        smoke.scale.set(ss, ss * 0.6, ss);
        smoke.position.y = pos.y + 0.4 + t * 2;
        smokeMat.opacity = 0.55 * (1 - t / 1.8);
      } else {
        if (_scene) _scene.remove(smoke);
      }

      // Debris physics
      var anyDebris = false;
      for (var dbi = 0; dbi < debrisList.length; dbi++) {
        var dp = debrisList[dbi];
        if (!dp || dp.life <= 0) continue;
        dp.life -= 0.016;
        dp.vel.y -= 9.8 * 0.016;
        dp.mesh.position.x += dp.vel.x * 0.016;
        dp.mesh.position.y += dp.vel.y * 0.016;
        dp.mesh.position.z += dp.vel.z * 0.016;
        dp.mesh.rotation.x += dp.vel.x * 0.04;
        dp.mesh.rotation.z += dp.vel.z * 0.04;
        if (dp.mesh.position.y < pos.y) { dp.mesh.position.y = pos.y; dp.vel.y = 0; }
        if (dp.life <= 0) {
          if (_scene) _scene.remove(dp.mesh);
          debrisList[dbi] = null;
        } else { anyDebris = true; }
      }

      if (t < 1.8 || anyDebris) requestAnimationFrame(animExp);
    }
    requestAnimationFrame(animExp);
  }

  // ── Detonate a single mine ─────────────────────────────────────────────────
  function _detonateMine(mine, isChain) {
    if (mine.triggered || mine.exploded) return;
    mine.triggered = true;

    // Rapid red blink pre-explosion (already set in update loop, but force here)
    mine.rapidBlink = true;

    // Apply 0.5s delay before actual explosion
    setTimeout(function () {
      if (mine.exploded) return;
      mine.exploded = true;

      // Remove mesh from scene
      if (_scene && mine.group) _scene.remove(mine.group);

      _spawnExplosionVFX(mine.position.clone());
      _playExplosionSFX();

      var pos = mine.position;
      var enemies = _getEnemies();
      var kills = 0;
      for (var i = 0; i < enemies.length; i++) {
        var en = enemies[i];
        if (!en || !en.position) continue;
        var dist = en.position.distanceTo(pos);
        var dmg = 0;
        if (dist <= BLAST_RADIUS_1)      dmg = BLAST_DMG_CLOSE;
        else if (dist <= BLAST_RADIUS_2) dmg = BLAST_DMG_MID;
        else if (dist <= BLAST_RADIUS_3) dmg = BLAST_DMG_FAR;
        if (dmg > 0) {
          // Upward knockback
          if (en.velocity) {
            en.velocity.y = (en.velocity.y || 0) + KNOCKBACK_Y;
          } else if (en.vel) {
            en.vel.y = (en.vel.y || 0) + KNOCKBACK_Y;
          }
          var killed = _damageEnemy(en, dmg);
          if (killed) {
            kills++;
            if (window.HUD && typeof window.HUD.addKillFeedEntry === 'function') {
              window.HUD.addKillFeedEntry('You', 'Enemy', 'Proximity Mine');
            }
          }
        }
      }
      if (kills > 0) {
        _addScore(kills * SCORE_PER_KILL);
      }

      // Chain reaction — trigger nearby mines (1 chain max)
      if (!isChain) {
        for (var j = 0; j < _mines.length; j++) {
          var other = _mines[j];
          if (!other || other === mine || other.triggered || other.exploded) continue;
          if (other.position.distanceTo(pos) <= CHAIN_RADIUS) {
            (function (m) {
              setTimeout(function () { _detonateMine(m, true); }, 200);
            })(other);
          }
        }
      }

      _syncGlobals();
      _updateHUD();
    }, TRIGGER_DELAY * 1000);
  }

  // ── Sync global array ──────────────────────────────────────────────────────
  function _syncGlobals() {
    window._activeMines = [];
    for (var i = 0; i < _mines.length; i++) {
      var m = _mines[i];
      if (m && !m.exploded) window._activeMines.push(m);
    }
  }

  // ── Key binding ────────────────────────────────────────────────────────────
  function _bindKeys() {
    if (_keyBound) return;
    _keyBound = true;

    document.addEventListener('keydown', function (e) {
      // Alt+M — plant mine at feet
      if (e.altKey && (e.key === 'M' || e.key === 'm')) {
        e.preventDefault();
        plant();
        return;
      }
      // F — start disarm hold
      if (e.key === 'f' || e.key === 'F') {
        _fKeyDown = true;
      }
    });

    document.addEventListener('keyup', function (e) {
      if (e.key === 'f' || e.key === 'F') {
        _fKeyDown = false;
        _disarmTimer  = 0;
        _disarmTarget = null;
        _setDisarmBar(0);
      }
    });
  }

  // ── Public: plant ──────────────────────────────────────────────────────────
  function plant() {
    if (_inventory <= 0) {
      if (window.HUD && typeof window.HUD.showToast === 'function') {
        window.HUD.showToast('MINE RECHARGING...', 1500, '#888866');
      }
      return;
    }

    var playerPos = _getPlayerPos();
    // Snap to ground — place at feet (y - 0.9 from eye height, or floor at y=0)
    var groundY = 0;
    if (typeof VoxelWorld !== 'undefined' && VoxelWorld.getTerrainHeight) {
      groundY = VoxelWorld.getTerrainHeight(playerPos.x, playerPos.z);
    } else {
      groundY = playerPos.y - 0.9;
    }

    var built = _buildMineMesh();
    built.group.position.set(playerPos.x, groundY + 0.03, playerPos.z);
    if (_scene) _scene.add(built.group);

    var mine = {
      group:     built.group,
      light:     built.light,
      position:  built.group.position,
      armed:     false,           // becomes true after ARM_DELAY
      armTimer:  0,               // counts up to ARM_DELAY
      triggered: false,           // true once an enemy steps on it
      exploded:  false,           // true after boom
      rapidBlink:false,           // pre-explosion rapid blink state
      blinkTimer: 0,
      lightOn:   true,
      chainUsed: false
    };
    _mines.push(mine);
    _inventory--;

    if (_inventory < MAX_MINES && _recharge <= 0) {
      _recharge = RECHARGE_TIME;
    }

    _playPlantSFX();
    _syncGlobals();
    _updateHUD();

    if (window.HUD && typeof window.HUD.showToast === 'function') {
      window.HUD.showToast('💣 MINE PLANTED — ARMING...', 2000, '#ffcc00');
    }
    if (window.HUD && typeof window.HUD.addCombatLog === 'function') {
      window.HUD.addCombatLog('Proximity mine planted — arming in 2s', '#88cc55');
    }
  }

  // ── Public: init ──────────────────────────────────────────────────────────
  function init(scene, camera) {
    _scene      = scene;
    _camera     = camera;
    _mines      = [];
    _inventory  = MAX_MINES;
    _recharge   = 0;
    _disarmTimer = 0;
    _disarmTarget = null;
    _fKeyDown   = false;

    window._activeMines = [];

    _ensureHUD();
    _ensureDisarmBar();
    _updateHUD();
    _bindKeys();
  }

  // ── Public: update (called each frame with delta in seconds) ──────────────
  function update(delta) {
    if (!delta || delta <= 0) delta = 0.016;

    // Recharge logic
    if (_inventory < MAX_MINES) {
      _recharge -= delta;
      if (_recharge <= 0) {
        _inventory++;
        _recharge = _inventory < MAX_MINES ? RECHARGE_TIME : 0;
        _updateHUD();
        if (window.HUD && typeof window.HUD.showToast === 'function') {
          window.HUD.showToast('💣 MINE READY', 1600, '#88cc55');
        }
      }
      _updateHUD();
    }

    var playerPos = _getPlayerPos();
    var enemies   = _getEnemies();
    var didChange = false;

    // Disarm check — is player near a mine and holding F?
    var disarmCandidate = null;
    var disarmDist = Infinity;
    for (var di = 0; di < _mines.length; di++) {
      var dm = _mines[di];
      if (!dm || dm.triggered || dm.exploded) continue;
      var dDist = dm.position.distanceTo(playerPos);
      if (dDist <= DISARM_RADIUS && dDist < disarmDist) {
        disarmDist = dDist;
        disarmCandidate = dm;
      }
    }

    if (_fKeyDown && disarmCandidate) {
      if (_disarmTarget !== disarmCandidate) {
        _disarmTarget = disarmCandidate;
        _disarmTimer  = 0;
      }
      _disarmTimer += delta;
      _setDisarmBar(_disarmTimer / DISARM_HOLD);

      if (_disarmTimer >= DISARM_HOLD) {
        // Recover mine
        _disarmTarget.exploded = true;
        if (_scene && _disarmTarget.group) _scene.remove(_disarmTarget.group);
        _inventory = Math.min(MAX_MINES, _inventory + 1);
        _playDisarmSFX();
        if (window.HUD && typeof window.HUD.showToast === 'function') {
          window.HUD.showToast('💣 MINE RECOVERED', 1800, '#88cc55');
        }
        _disarmTarget = null;
        _disarmTimer  = 0;
        _setDisarmBar(0);
        didChange = true;
      }
    } else {
      if (!_fKeyDown) {
        _disarmTimer  = 0;
        _disarmTarget = null;
        _setDisarmBar(0);
      }
    }

    // Per-mine update loop
    for (var i = 0; i < _mines.length; i++) {
      var mine = _mines[i];
      if (!mine || mine.exploded) continue;

      // Arming countdown
      if (!mine.armed) {
        mine.armTimer += delta;
        // Yellow fast blink while arming
        mine.blinkTimer += delta;
        if (mine.blinkTimer >= BLINK_ARMING) {
          mine.blinkTimer = 0;
          mine.lightOn = !mine.lightOn;
          if (mine.light) {
            mine.light.color.set(0xFFFF00);
            mine.light.intensity = mine.lightOn ? 0.5 : 0;
          }
        }
        if (mine.armTimer >= ARM_DELAY) {
          mine.armed = true;
          mine.blinkTimer = 0;
          mine.lightOn = true;
          if (mine.light) {
            mine.light.color.set(0xFF0000);
            mine.light.intensity = 0.3;
          }
          _playArmedSFX();
          _updateHUD();
        }
        continue;
      }

      if (mine.triggered) {
        // Rapid red blink while waiting to explode
        mine.blinkTimer += delta;
        if (mine.blinkTimer >= 0.05) {
          mine.blinkTimer = 0;
          mine.lightOn = !mine.lightOn;
          if (mine.light) {
            mine.light.intensity = mine.lightOn ? 1.5 : 0;
          }
        }
        continue;
      }

      // Normal armed blink — red, 1.5s interval
      mine.blinkTimer += delta;
      if (mine.blinkTimer >= BLINK_ARMED) {
        mine.blinkTimer = 0;
        mine.lightOn = !mine.lightOn;
        if (mine.light) {
          mine.light.intensity = mine.lightOn ? 0.3 : 0;
        }
      }

      // Enemy trigger check
      for (var j = 0; j < enemies.length; j++) {
        var en = enemies[j];
        if (!en || !en.position) continue;
        var eDist = en.position.distanceTo(mine.position);
        if (eDist <= TRIGGER_RADIUS) {
          _detonateMine(mine, false);
          didChange = true;
          break;
        }
      }
    }

    // Prune dead mines
    if (didChange) {
      var live = [];
      for (var k = 0; k < _mines.length; k++) {
        if (_mines[k] && !_mines[k].exploded) live.push(_mines[k]);
      }
      _mines = live;
      _syncGlobals();
      _updateHUD();
    }
  }

  // ── Public: reset ─────────────────────────────────────────────────────────
  function reset() {
    for (var i = 0; i < _mines.length; i++) {
      var m = _mines[i];
      if (m && m.group && _scene) _scene.remove(m.group);
    }
    _mines       = [];
    _inventory   = MAX_MINES;
    _recharge    = 0;
    _disarmTimer = 0;
    _disarmTarget = null;
    _fKeyDown    = false;
    window._activeMines = [];
    _setDisarmBar(0);
    _updateHUD();
  }

  // ── Public API ────────────────────────────────────────────────────────────
  return { init: init, update: update, plant: plant, reset: reset };

})();
