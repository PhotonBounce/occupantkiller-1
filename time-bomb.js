// time-bomb.js — Plantable Time Bomb with 15s countdown
// Plant (Ctrl+B), defuse (hold F within 1.5 units), watch enemies try to disarm
// No let/const — only var throughout, IIFE pattern
window.TimeBomb = (function () {
  'use strict';

  // ── Constants ──────────────────────────────────────────────────────────────
  var MAX_ACTIVE = 2;
  var COUNTDOWN_DURATION = 15;   // seconds
  var PLANT_COOLDOWN = 45;       // seconds between plants
  var PRIMARY_RADIUS = 6;        // blast radius for 150 dmg
  var SECONDARY_RADIUS = 12;     // secondary radius for 60 dmg
  var ENEMY_AWARE_RADIUS = 8;    // enemies within this become aware
  var ENEMY_DISARM_RADIUS = 1.2; // enemy must be this close to attempt disarm
  var PLAYER_DEFUSE_RADIUS = 1.5;// player must be this close to defuse
  var DEFUSE_DURATION = 4;       // seconds to defuse
  var SCORCH_DURATION = 30;      // seconds scorch mark lasts
  var SHAKE_MAG = 0.4;
  var SHAKE_DUR = 0.8;

  // ── Module state ──────────────────────────────────────────────────────────
  var _scene = null;
  var _camera = null;
  var _onHit = null;             // callback(pos, isPlayer, amount)

  var _bombs = [];               // active planted bombs
  var _cooldownRemaining = 0;    // seconds until next plant allowed
  var _defuseProgress = 0;       // 0..DEFUSE_DURATION (current defuse attempt)
  var _defusingBombIdx = -1;     // index in _bombs of bomb being defused
  var _fKeyHeld = false;
  var _time = 0;

  // ── Expose global flag ────────────────────────────────────────────────────
  window._timeBombActive = false;

  // ── HUD element ──────────────────────────────────────────────────────────
  function _ensureHUD() {
    if (document.getElementById('timebomb-hud')) return;
    var el = document.createElement('div');
    el.id = 'timebomb-hud';
    el.style.cssText = [
      'position:fixed',
      'bottom:140px',
      'right:14px',
      'font-family:monospace',
      'font-size:13px',
      'color:#ff3300',
      'background:rgba(0,0,0,0.60)',
      'padding:4px 10px',
      'border-radius:4px',
      'z-index:1001',
      'pointer-events:none',
      'user-select:none',
      'border:1px solid rgba(200,50,0,0.5)',
      'display:none',
    ].join(';');
    document.body.appendChild(el);
  }

  function _updateHUD() {
    var el = document.getElementById('timebomb-hud');
    if (!el) return;

    // Build HUD lines
    var lines = [];

    // Per-bomb countdown lines
    for (var i = 0; i < _bombs.length; i++) {
      var b = _bombs[i];
      if (!b || b.exploded || b.defused) continue;
      var t = Math.ceil(b.timer);
      // Color: red above 8s, transition to orange in last 3s
      var col = t <= 3 ? '#ff8800' : '#ff3300';
      lines.push('<span style="color:' + col + '">&#x1F4A3; BOMB ' + t + 's</span>');
    }

    // Defuse progress bar
    if (_defusingBombIdx >= 0 && _defuseProgress > 0) {
      var pct = Math.floor((_defuseProgress / DEFUSE_DURATION) * 20);
      var bar = '';
      for (var pi = 0; pi < 20; pi++) {
        bar += pi < pct ? '█' : '░';
      }
      lines.push('<span style="color:#44ff88">DEFUSING [' + bar + ']</span>');
    }

    // Cooldown reminder
    if (_cooldownRemaining > 0 && _bombs.length < MAX_ACTIVE) {
      lines.push('<span style="color:#888">BOMB READY IN ' + Math.ceil(_cooldownRemaining) + 's</span>');
    }

    if (lines.length === 0) {
      el.style.display = 'none';
      return;
    }
    el.style.display = 'block';
    el.innerHTML = lines.join('<br>');
  }

  // ── Toast helper ──────────────────────────────────────────────────────────
  function _showToast(msg, color) {
    if (typeof HUD !== 'undefined' && HUD.showToast) {
      HUD.showToast(msg, 3500, color || '#ffcc00');
    } else if (typeof HUD !== 'undefined' && HUD.notifyPickup) {
      HUD.notifyPickup(msg, color || '#ffcc00');
    }
  }

  // ── Audio helpers ─────────────────────────────────────────────────────────
  function _getAudioCtx() {
    if (window._audioCtx) return window._audioCtx;
    try {
      var Ctx = window.AudioContext || window.webkitAudioContext;
      if (Ctx) {
        window._audioCtx = new Ctx();
        return window._audioCtx;
      }
    } catch (e) {}
    return null;
  }

  function _playBeep(freq, dur) {
    var ctx = _getAudioCtx();
    if (!ctx) return;
    try {
      var osc = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.18, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + dur);
    } catch (e) {}
  }

  function _playBoom() {
    var ctx = _getAudioCtx();
    if (!ctx) return;
    try {
      // Low rumble
      var osc1 = ctx.createOscillator();
      var g1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(55, ctx.currentTime);
      osc1.frequency.exponentialRampToValueAtTime(12, ctx.currentTime + 0.6);
      g1.gain.setValueAtTime(3.0, ctx.currentTime);
      g1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.7);
      osc1.connect(g1);
      g1.connect(ctx.destination);
      osc1.start();
      osc1.stop(ctx.currentTime + 0.7);
      // Crack
      var osc2 = ctx.createOscillator();
      var g2 = ctx.createGain();
      osc2.type = 'sawtooth';
      osc2.frequency.setValueAtTime(1400, ctx.currentTime);
      osc2.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.3);
      g2.gain.setValueAtTime(0.6, ctx.currentTime);
      g2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      osc2.connect(g2);
      g2.connect(ctx.destination);
      osc2.start();
      osc2.stop(ctx.currentTime + 0.35);
    } catch (e) {}
  }

  // ── Bomb mesh factory ─────────────────────────────────────────────────────
  function _buildBombMesh() {
    var group = new THREE.Group();

    // Main body — red box device
    var bodyGeo = new THREE.BoxGeometry(0.3, 0.2, 0.3);
    var bodyMat = new THREE.MeshLambertMaterial({ color: 0xcc0000 });
    var body = new THREE.Mesh(bodyGeo, bodyMat);
    group.add(body);

    // Digital display — black box on top
    var dispGeo = new THREE.BoxGeometry(0.18, 0.05, 0.12);
    var dispMat = new THREE.MeshLambertMaterial({ color: 0x111111 });
    var disp = new THREE.Mesh(dispGeo, dispMat);
    disp.position.set(0, 0.125, 0);
    group.add(disp);

    // Blinking red PointLight
    var light = new THREE.PointLight(0xff0000, 2, 2);
    light.position.set(0, 0.3, 0);
    group.add(light);

    return { group: group, light: light, bodyMat: bodyMat };
  }

  // ── Ground height helper ──────────────────────────────────────────────────
  function _groundY(x, z) {
    if (typeof VoxelWorld !== 'undefined' && VoxelWorld.getTerrainHeight) {
      return VoxelWorld.getTerrainHeight(x, z);
    }
    if (typeof player !== 'undefined' && player.position) {
      return player.position.y - 1.6;
    }
    return 0;
  }

  // ── Plant a bomb ──────────────────────────────────────────────────────────
  function plant() {
    if (!_scene || !_camera) return;

    if (_cooldownRemaining > 0) {
      _showToast('Bomb cooldown: ' + Math.ceil(_cooldownRemaining) + 's remaining', '#ff8800');
      return;
    }
    if (_bombs.length >= MAX_ACTIVE) {
      _showToast('Max bombs active (' + MAX_ACTIVE + ')! Wait for detonation.', '#ff8800');
      return;
    }

    // Position: at player's feet
    var pos = _camera.position.clone();
    pos.y = _groundY(pos.x, pos.z) + 0.1;

    var built = _buildBombMesh();
    built.group.position.copy(pos);
    if (_scene) _scene.add(built.group);

    var bomb = {
      group: built.group,
      light: built.light,
      bodyMat: built.bodyMat,
      pos: pos.clone(),
      timer: COUNTDOWN_DURATION,
      beepTimer: 0,
      lightTimer: 0,
      lightOn: true,
      exploded: false,
      defused: false,
      disarming: false,
      disarmTimer: 0,
      disarmEnemy: null,
      scorchMesh: null,
      scorchTimer: 0,
    };
    _bombs.push(bomb);

    window._timeBombActive = true;
    _cooldownRemaining = PLANT_COOLDOWN;

    _playBeep(660, 0.12);
    _showToast('&#x1F4A3; BOMB PLANTED — 15s countdown!', '#ff3300');
    _updateHUD();
  }

  // ── Defuse (player) ───────────────────────────────────────────────────────
  function defuse() {
    // Called externally or via F-key hold logic
    // Finds nearest in-range bomb and marks defused
    for (var i = 0; i < _bombs.length; i++) {
      var b = _bombs[i];
      if (!b || b.exploded || b.defused) continue;
      if (_camera) {
        var dx = b.pos.x - _camera.position.x;
        var dy = b.pos.y - _camera.position.y;
        var dz = b.pos.z - _camera.position.z;
        var dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
        if (dist <= PLAYER_DEFUSE_RADIUS) {
          _doDefuse(i, false);
          return;
        }
      }
    }
  }

  function _doDefuse(idx, byEnemy) {
    var b = _bombs[idx];
    if (!b || b.defused || b.exploded) return;
    b.defused = true;

    // Remove mesh
    if (_scene && b.group) _scene.remove(b.group);

    if (byEnemy) {
      _showToast('BOMB DISARMED BY ENEMY', '#ff8800');
    } else {
      _showToast('+500 BOMB DEFUSED', '#44ff88');
      // Award 500 points if possible
      if (typeof window !== 'undefined' && typeof window.addScore === 'function') {
        window.addScore(500);
      }
    }

    // Cleanup
    _defusingBombIdx = -1;
    _defuseProgress = 0;
    _updateBombActiveFlag();
    _updateHUD();
  }

  // ── Explosion ─────────────────────────────────────────────────────────────
  function _explode(bomb) {
    if (bomb.exploded) return;
    bomb.exploded = true;

    var pos = bomb.pos;

    // Remove bomb mesh
    if (_scene && bomb.group) _scene.remove(bomb.group);

    // ── Flash / fireball VFX ─────────────────────────────────────────────
    var flashGeo = new THREE.SphereGeometry(0.8, 10, 10);
    var flashMat = new THREE.MeshBasicMaterial({ color: 0xff6600, transparent: true, opacity: 0.95 });
    var flash = new THREE.Mesh(flashGeo, flashMat);
    flash.position.copy(pos);
    flash.position.y += 0.5;
    if (_scene) _scene.add(flash);

    // Explosion point light
    var expLight = new THREE.PointLight(0xff6600, 50, 20);
    expLight.position.copy(pos);
    expLight.position.y += 1.0;
    if (_scene) _scene.add(expLight);

    // ── Debris: 8 chunks ─────────────────────────────────────────────────
    var debGeo = new THREE.BoxGeometry(0.12, 0.12, 0.12);
    var debMat = new THREE.MeshLambertMaterial({ color: 0x444444 });
    var debrisList = [];
    for (var di = 0; di < 8; di++) {
      var d = new THREE.Mesh(debGeo, debMat);
      d.position.copy(pos);
      d.position.y += 0.3;
      var angle = (di / 8) * Math.PI * 2;
      var speed = 3 + Math.random() * 5;
      debrisList.push({
        mesh: d,
        vel: {
          x: Math.sin(angle) * speed,
          y: 4 + Math.random() * 4,
          z: Math.cos(angle) * speed,
        },
        life: 1.0 + Math.random() * 0.8,
      });
      if (_scene) _scene.add(d);
    }

    // ── Scorch mark ──────────────────────────────────────────────────────
    var scorchGeo = new THREE.CircleGeometry(2, 16);
    var scorchMat = new THREE.MeshBasicMaterial({ color: 0x111111, transparent: true, opacity: 0.85 });
    var scorch = new THREE.Mesh(scorchGeo, scorchMat);
    scorch.rotation.x = -Math.PI / 2;
    scorch.position.set(pos.x, _groundY(pos.x, pos.z) + 0.02, pos.z);
    if (_scene) _scene.add(scorch);
    bomb.scorchMesh = scorch;
    bomb.scorchTimer = SCORCH_DURATION;

    // ── Screen shake ─────────────────────────────────────────────────────
    if (typeof CameraSystem !== 'undefined' && CameraSystem.shake) {
      CameraSystem.shake(SHAKE_MAG, SHAKE_DUR);
    } else {
      window._cameraShake = { intensity: SHAKE_MAG, duration: SHAKE_DUR };
    }

    // ── Audio ─────────────────────────────────────────────────────────────
    if (typeof AudioSystem !== 'undefined' && AudioSystem.playMortarImpact) {
      AudioSystem.playMortarImpact();
    } else if (typeof AudioSystem !== 'undefined' && AudioSystem.playExplosion) {
      AudioSystem.playExplosion();
    }
    _playBoom();

    // ── Primary blast — 150 dmg within 6 units ───────────────────────────
    _damageArea(pos, PRIMARY_RADIUS, 150);

    // ── Secondary blast — 60 dmg within 12 units (beyond primary) ────────
    _damageArea(pos, SECONDARY_RADIUS, 60);

    // ── Player damage ─────────────────────────────────────────────────────
    if (typeof player !== 'undefined' && player.position && _onHit) {
      var pdx = player.position.x - pos.x;
      var pdy = player.position.y - pos.y;
      var pdz = player.position.z - pos.z;
      var pDist = Math.sqrt(pdx * pdx + pdy * pdy + pdz * pdz);
      if (pDist <= PRIMARY_RADIUS) {
        var falloff = Math.max(0, 1 - pDist / PRIMARY_RADIUS);
        _onHit(pos, true, Math.round(150 * falloff));
      } else if (pDist <= SECONDARY_RADIUS) {
        var falloff2 = Math.max(0, 1 - pDist / SECONDARY_RADIUS);
        _onHit(pos, true, Math.round(60 * falloff2));
      }
    }

    // ── Animate VFX ──────────────────────────────────────────────────────
    var startTime = null;
    function animateExp(ts) {
      if (!startTime) startTime = ts;
      var t = (ts - startTime) / 1000;

      // Flash: orange → white → transparent over 0.5s
      if (t < 0.15) {
        var s = 0.8 + (t / 0.15) * 5;
        flash.scale.set(s, s, s);
        // Shift toward white
        var whiteness = t / 0.15;
        var r = Math.round(255);
        var g = Math.round(102 + whiteness * 153);
        var bl = Math.round(whiteness * 255);
        flashMat.color.setRGB(r / 255, g / 255, bl / 255);
        flashMat.opacity = 0.95;
      } else if (t < 0.5) {
        var fadeT = (t - 0.15) / 0.35;
        flashMat.opacity = 0.95 * (1 - fadeT);
        expLight.intensity = 50 * (1 - fadeT);
        if (flashMat.opacity <= 0.01) {
          if (_scene) { _scene.remove(flash); _scene.remove(expLight); }
        }
      } else {
        if (_scene) { _scene.remove(flash); _scene.remove(expLight); }
      }

      // Debris
      var anyAlive = false;
      for (var dbi = 0; dbi < debrisList.length; dbi++) {
        var dp = debrisList[dbi];
        if (!dp || dp.life <= 0) continue;
        dp.life -= 0.016;
        dp.vel.y -= 9.8 * 0.016;
        dp.mesh.position.x += dp.vel.x * 0.016;
        dp.mesh.position.y += dp.vel.y * 0.016;
        dp.mesh.position.z += dp.vel.z * 0.016;
        dp.mesh.rotation.x += dp.vel.x * 0.05;
        dp.mesh.rotation.z += dp.vel.z * 0.05;
        if (dp.mesh.position.y < _groundY(dp.mesh.position.x, dp.mesh.position.z)) {
          dp.mesh.position.y = _groundY(dp.mesh.position.x, dp.mesh.position.z);
          dp.vel.y = 0;
        }
        if (dp.life <= 0) {
          if (_scene) _scene.remove(dp.mesh);
          debrisList[dbi] = null;
        } else {
          anyAlive = true;
        }
      }

      if (t < 0.5 || anyAlive) {
        requestAnimationFrame(animateExp);
      }
    }
    requestAnimationFrame(animateExp);

    _updateBombActiveFlag();
    _updateHUD();
  }

  // ── Damage enemies in radius (with falloff) ───────────────────────────────
  function _damageArea(pos, radius, baseDmg) {
    if (typeof Enemies !== 'undefined' && Enemies.getAll) {
      var enemies = Enemies.getAll();
      for (var ei = 0; ei < enemies.length; ei++) {
        var en = enemies[ei];
        if (!en || !en.mesh || en.hp <= 0) continue;
        var ep = en.mesh.position;
        var edx = ep.x - pos.x;
        var edy = ep.y - pos.y;
        var edz = ep.z - pos.z;
        var eDist = Math.sqrt(edx * edx + edy * edy + edz * edz);
        if (eDist <= radius) {
          var falloff = 1 - (eDist / radius) * 0.5;
          if (typeof Enemies.damage === 'function') {
            Enemies.damage(en, Math.round(baseDmg * falloff));
          }
        }
      }
    }
  }

  // ── Make enemies aware of nearby bombs ───────────────────────────────────
  function _alertEnemiesNearBomb(bomb) {
    if (typeof Enemies === 'undefined' || !Enemies.getAll) return;
    var enemies = Enemies.getAll();
    for (var ei = 0; ei < enemies.length; ei++) {
      var en = enemies[ei];
      if (!en || !en.mesh || en.hp <= 0) continue;
      var ep = en.mesh.position;
      var dx = ep.x - bomb.pos.x;
      var dy = ep.y - bomb.pos.y;
      var dz = ep.z - bomb.pos.z;
      var dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
      if (dist <= ENEMY_AWARE_RADIUS) {
        // Mark enemy as aware — use available fields from the codebase
        if (typeof en.alertLevel !== 'undefined') {
          en.alertLevel = Math.max(en.alertLevel || 0, 1.0);
        }
        if (typeof en.spotLevel !== 'undefined') {
          en.spotLevel = Math.max(en.spotLevel || 0, 1.0);
        }
        if (typeof en._squadAlertTimer !== 'undefined') {
          en._squadAlertTimer = 2.0;
        }
        if (typeof en._suppressedTimer !== 'undefined') {
          en._suppressedTimer = Math.max(en._suppressedTimer || 0, 2.5);
        }
        // Store bomb position as flee target
        en._fleeFromBomb = bomb.pos.clone();
        en._fleeFromBombTimer = 5.0;
      }
    }
  }

  // ── Enemy disarm attempt ──────────────────────────────────────────────────
  function _checkEnemyDisarm(bomb, delta, bombIdx) {
    if (bomb.disarming) {
      // An enemy is already attempting — count down
      bomb.disarmTimer -= delta;
      if (bomb.disarmTimer <= 0) {
        // 50% chance success
        if (Math.random() < 0.5) {
          _doDefuse(bombIdx, true);
        } else {
          bomb.disarming = false;
          bomb.disarmEnemy = null;
          bomb.disarmTimer = 0;
        }
      }
      return;
    }

    if (typeof Enemies === 'undefined' || !Enemies.getAll) return;
    var enemies = Enemies.getAll();
    for (var ei = 0; ei < enemies.length; ei++) {
      var en = enemies[ei];
      if (!en || !en.mesh || en.hp <= 0) continue;
      var ep = en.mesh.position;
      var dx = ep.x - bomb.pos.x;
      var dy = ep.y - bomb.pos.y;
      var dz = ep.z - bomb.pos.z;
      var dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
      if (dist <= ENEMY_DISARM_RADIUS) {
        // Enemy starts disarming
        bomb.disarming = true;
        bomb.disarmEnemy = en;
        bomb.disarmTimer = 3.0;
        break;
      }
    }
  }

  // ── Update active flag ────────────────────────────────────────────────────
  function _updateBombActiveFlag() {
    var anyActive = false;
    for (var i = 0; i < _bombs.length; i++) {
      var b = _bombs[i];
      if (b && !b.exploded && !b.defused) {
        anyActive = true;
        break;
      }
    }
    window._timeBombActive = anyActive;
  }

  // ── Find nearest in-range live bomb for defuse ────────────────────────────
  function _nearestDefusableBomb() {
    var best = -1;
    var bestDist = Infinity;
    if (!_camera) return -1;
    for (var i = 0; i < _bombs.length; i++) {
      var b = _bombs[i];
      if (!b || b.exploded || b.defused) continue;
      var dx = b.pos.x - _camera.position.x;
      var dy = b.pos.y - _camera.position.y;
      var dz = b.pos.z - _camera.position.z;
      var dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
      if (dist <= PLAYER_DEFUSE_RADIUS && dist < bestDist) {
        bestDist = dist;
        best = i;
      }
    }
    return best;
  }

  // ── Key handlers ──────────────────────────────────────────────────────────
  function _onKeyDown(e) {
    // Ctrl+B — plant bomb
    if ((e.ctrlKey || e.metaKey) && (e.code === 'KeyB' || e.key === 'b' || e.key === 'B')) {
      e.preventDefault();
      plant();
      return;
    }
    // F — start defuse hold
    if (e.code === 'KeyF' && !e.ctrlKey && !e.altKey) {
      _fKeyHeld = true;
    }
  }

  function _onKeyUp(e) {
    if (e.code === 'KeyF') {
      _fKeyHeld = false;
      // Cancel defuse if in progress
      if (_defusingBombIdx >= 0) {
        _defuseProgress = 0;
        _defusingBombIdx = -1;
        _showToast('Defuse cancelled', '#ff8800');
        _updateHUD();
      }
    }
  }

  // ── init ──────────────────────────────────────────────────────────────────
  function init(scene, camera, onHitCb) {
    _scene = scene;
    _camera = camera;
    _onHit = onHitCb || null;

    _bombs = [];
    _cooldownRemaining = 0;
    _defuseProgress = 0;
    _defusingBombIdx = -1;
    _fKeyHeld = false;
    _time = 0;
    window._timeBombActive = false;

    _ensureHUD();
    _updateHUD();

    document.addEventListener('keydown', _onKeyDown, true);
    document.addEventListener('keyup', _onKeyUp, true);
  }

  // ── update ────────────────────────────────────────────────────────────────
  function update(delta) {
    _time += delta;

    // Cooldown tick
    if (_cooldownRemaining > 0) {
      _cooldownRemaining -= delta;
      if (_cooldownRemaining < 0) _cooldownRemaining = 0;
    }

    // Defuse hold progress
    if (_fKeyHeld) {
      var nearIdx = _nearestDefusableBomb();
      if (nearIdx >= 0) {
        if (_defusingBombIdx !== nearIdx) {
          // Switched to a new bomb — reset progress
          _defuseProgress = 0;
          _defusingBombIdx = nearIdx;
        }
        _defuseProgress += delta;
        if (_defuseProgress >= DEFUSE_DURATION) {
          _doDefuse(nearIdx, false);
        }
      } else {
        // No bomb in range — reset
        if (_defusingBombIdx >= 0) {
          _defuseProgress = 0;
          _defusingBombIdx = -1;
        }
      }
    } else {
      if (_defusingBombIdx >= 0) {
        _defuseProgress = 0;
        _defusingBombIdx = -1;
      }
    }

    // Update each bomb
    var needHUDUpdate = false;
    for (var i = _bombs.length - 1; i >= 0; i--) {
      var b = _bombs[i];
      if (!b) { _bombs.splice(i, 1); continue; }

      // Clean up scorch marks
      if (b.exploded || b.defused) {
        if (b.scorchMesh) {
          b.scorchTimer -= delta;
          if (b.scorchTimer <= 0) {
            if (_scene) _scene.remove(b.scorchMesh);
            b.scorchMesh = null;
          } else {
            // Fade scorch over last 5 seconds
            var scorchFade = Math.min(1, b.scorchTimer / 5);
            b.scorchMesh.material.opacity = 0.85 * scorchFade;
          }
        } else {
          _bombs.splice(i, 1);
        }
        continue;
      }

      // Tick countdown
      var prevTime = b.timer;
      b.timer -= delta;
      needHUDUpdate = true;

      // Beep logic — every 1s, accelerates to every 0.25s in last 3s
      b.beepTimer -= delta;
      var beepInterval = b.timer <= 3 ? 0.25 : 1.0;
      if (b.beepTimer <= 0) {
        b.beepTimer = beepInterval;
        var beepFreq = b.timer <= 3 ? 1200 : 880;
        _playBeep(beepFreq, 0.06);
      }

      // Blink bomb light
      b.lightTimer += delta;
      var blinkRate = b.timer <= 3 ? 0.125 : 0.5;
      if (b.lightTimer >= blinkRate) {
        b.lightTimer = 0;
        b.lightOn = !b.lightOn;
        if (b.light) {
          b.light.intensity = b.lightOn ? 2 : 0;
        }
      }

      // Alert nearby enemies every ~2s
      if (Math.floor(prevTime) !== Math.floor(b.timer) && Math.floor(b.timer) % 2 === 0) {
        _alertEnemiesNearBomb(b);
      }

      // Check enemy disarm attempts
      _checkEnemyDisarm(b, delta, i);

      // Detonate when countdown reaches 0
      if (b.timer <= 0) {
        _explode(b);
        needHUDUpdate = true;
        continue;
      }
    }

    if (needHUDUpdate) {
      _updateHUD();
    }

    _updateBombActiveFlag();
  }

  // ── reset ─────────────────────────────────────────────────────────────────
  function reset() {
    // Remove all bomb meshes and scorch marks from scene
    for (var i = 0; i < _bombs.length; i++) {
      var b = _bombs[i];
      if (!b) continue;
      if (_scene && b.group) _scene.remove(b.group);
      if (_scene && b.scorchMesh) _scene.remove(b.scorchMesh);
    }
    _bombs = [];
    _cooldownRemaining = 0;
    _defuseProgress = 0;
    _defusingBombIdx = -1;
    _fKeyHeld = false;
    window._timeBombActive = false;

    document.removeEventListener('keydown', _onKeyDown, true);
    document.removeEventListener('keyup', _onKeyUp, true);

    _updateHUD();
  }

  return {
    init: init,
    update: update,
    plant: plant,
    defuse: defuse,
    reset: reset,
  };
})();
