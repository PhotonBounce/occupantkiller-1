/**
 * grenade-types.js — Expanded grenade arsenal with 8 distinct grenade types,
 * full physics (velocity + gravity, bounce, roll friction), cooking mechanic,
 * bounce audio, and HUD display.
 *
 * Grenade types (cycle with G key, throw with Shift+G):
 *   1. FRAG        — gray,   3s fuse, 8m radius, 100 HP, 12 shrapnel fragments
 *   2. SMOKE       — white,  on land: expanding cloud 0->5 radius, 30s
 *   3. FLASHBANG   — white,  on land: fullscreen flash 1.5s, stun 4s / 6m
 *   4. WP          — yellow, on land: 8 burning particles w/ PointLight, 8s
 *   5. THERMITE    — orange, on land: crater disc + PointLight 0xFF2200 / 20s
 *   6. EMP         — blue,   on detonate: window._empActive=true 10s, blue light
 *   7. INCENDIARY  — red,    5 fire patches, -5 HP/s / 8s / 3m radius
 *   8. CONCUSSION  — dark,   12m radius, -50 HP, camera shake 0.8s, knockback 4
 *
 * Cooking mechanic: hold Shift+G cooks fuse, indicator counts down, release throws.
 * Bounce sound: AudioContext click on each bounce.
 *
 * Integration:
 *   window.GrenadeTypes.init(scene, camera, enemies)
 *   window.GrenadeTypes.update(dt)   — call every frame
 *   window.GrenadeTypes.reset()
 */

window.GrenadeTypes = (function () {
  'use strict';

  // ─── Constants ─────────────────────────────────────────────────────────────
  var GRAVITY        = -9.8;
  var RESTITUTION    = 0.4;
  var ROLL_FRICTION  = 0.95;
  var GRENADE_RADIUS = 0.15;
  var THROW_SPEED    = 14;    // m/s initial throw speed
  var THROW_ARC      = 0.35;  // upward angle component

  var TYPE_NAMES = ['FRAG', 'SMOKE', 'FLASHBANG', 'WP', 'THERMITE', 'EMP', 'INCENDIARY', 'CONCUSSION'];

  var TYPE_CONFIG = {
    FRAG:        { color: 0x888888, fuse: 3.0,  label: 'FRAG' },
    SMOKE:       { color: 0xDDDDDD, fuse: 999,  label: 'SMOKE' },
    FLASHBANG:   { color: 0xFFFFFF, fuse: 999,  label: 'FLASH' },
    WP:          { color: 0xFFEE00, fuse: 999,  label: 'WP' },
    THERMITE:    { color: 0xFF6600, fuse: 999,  label: 'THERM' },
    EMP:         { color: 0x0066FF, fuse: 999,  label: 'EMP' },
    INCENDIARY:  { color: 0xFF1100, fuse: 999,  label: 'INCEN' },
    CONCUSSION:  { color: 0x444444, fuse: 999,  label: 'CONC' }
  };

  // ─── State ─────────────────────────────────────────────────────────────────
  var _scene   = null;
  var _camera  = null;
  var _enemies = null;

  var _currentTypeIndex = 0;
  var _activeGrenades   = [];
  var _activeEffects    = [];   // persistent VFX (smoke clouds, fire, lights, etc.)

  // Cooking state
  var _cooking          = false;
  var _cookFuse         = 0;
  var _cookMax          = 3.0;
  var _shiftGDown       = false;

  // DOM
  var _hudEl            = null;
  var _cookIndicatorEl  = null;
  var _flashOverlayEl   = null;

  // AudioContext (lazy)
  var _audioCtx         = null;

  // EMP timer
  var _empTimer         = 0;

  // ─── Init ──────────────────────────────────────────────────────────────────
  function init(scene, camera, enemies) {
    _scene   = scene   || null;
    _camera  = camera  || null;
    _enemies = enemies || null;

    _currentTypeIndex = 0;
    _activeGrenades   = [];
    _activeEffects    = [];
    _cooking          = false;
    _cookFuse         = 0;
    _shiftGDown       = false;
    _empTimer         = 0;

    _buildHUD();
    _bindEvents();
    _updateHUD();
  }

  // ─── HUD ───────────────────────────────────────────────────────────────────
  function _buildHUD() {
    if (_hudEl && _hudEl.parentNode) {
      _hudEl.parentNode.removeChild(_hudEl);
    }

    _hudEl = document.createElement('div');
    _hudEl.id = 'gt-hud';
    _hudEl.style.cssText = [
      'position:fixed',
      'bottom:100px',
      'left:50%',
      'transform:translateX(-50%)',
      'background:rgba(0,0,0,0.55)',
      'color:#fff',
      'font-family:monospace',
      'font-size:13px',
      'font-weight:bold',
      'padding:4px 12px',
      'border-radius:4px',
      'pointer-events:none',
      'z-index:9990',
      'text-align:center',
      'letter-spacing:1px',
      'text-shadow:0 1px 3px #000'
    ].join(';');
    document.body.appendChild(_hudEl);

    // Cook indicator
    _cookIndicatorEl = document.createElement('div');
    _cookIndicatorEl.id = 'gt-cook';
    _cookIndicatorEl.style.cssText = [
      'position:fixed',
      'bottom:120px',
      'left:50%',
      'transform:translateX(-50%)',
      'background:rgba(255,80,0,0.8)',
      'color:#fff',
      'font-family:monospace',
      'font-size:14px',
      'font-weight:bold',
      'padding:3px 10px',
      'border-radius:4px',
      'pointer-events:none',
      'z-index:9991',
      'display:none',
      'text-shadow:0 1px 3px #000'
    ].join(';');
    document.body.appendChild(_cookIndicatorEl);

    // Flashbang overlay
    if (_flashOverlayEl && _flashOverlayEl.parentNode) {
      _flashOverlayEl.parentNode.removeChild(_flashOverlayEl);
    }
    _flashOverlayEl = document.createElement('div');
    _flashOverlayEl.id = 'gt-flash-overlay';
    _flashOverlayEl.style.cssText = [
      'position:fixed',
      'top:0',
      'left:0',
      'width:100%',
      'height:100%',
      'pointer-events:none',
      'z-index:10000',
      'background:transparent',
      'display:none'
    ].join(';');
    document.body.appendChild(_flashOverlayEl);
  }

  function _updateHUD() {
    if (!_hudEl) { return; }
    var cfg = TYPE_CONFIG[TYPE_NAMES[_currentTypeIndex]];
    _hudEl.textContent = '[G] ' + cfg.label + ' (' + (_currentTypeIndex + 1) + '/' + TYPE_NAMES.length + ')  [Shift+G] THROW';
  }

  // ─── Input ─────────────────────────────────────────────────────────────────
  function _bindEvents() {
    document.addEventListener('keydown', function (e) {
      if (e.code !== 'KeyG') { return; }

      if (!e.shiftKey) {
        // G only → cycle type
        _currentTypeIndex = (_currentTypeIndex + 1) % TYPE_NAMES.length;
        _updateHUD();
        return;
      }

      // Shift+G down → start cooking
      if (!_shiftGDown) {
        _shiftGDown = true;
        _startCook();
      }
    });

    document.addEventListener('keyup', function (e) {
      if (e.code === 'KeyG' && _shiftGDown) {
        _shiftGDown = false;
        if (_cooking) {
          _throwGrenade();
        }
      }
    });
  }

  // ─── Cooking ───────────────────────────────────────────────────────────────
  function _startCook() {
    var type = TYPE_NAMES[_currentTypeIndex];
    var cfg  = TYPE_CONFIG[type];
    _cookMax  = cfg.fuse < 900 ? cfg.fuse : 3.0;
    _cookFuse = _cookMax;
    _cooking  = true;
    if (_cookIndicatorEl) {
      _cookIndicatorEl.style.display = 'block';
    }
  }

  function _throwGrenade() {
    if (!_cooking) { return; }
    var type       = TYPE_NAMES[_currentTypeIndex];
    var fuseLeft   = _cookFuse;
    _cooking       = false;
    _cookFuse      = 0;
    if (_cookIndicatorEl) { _cookIndicatorEl.style.display = 'none'; }

    _spawnGrenade(type, fuseLeft);
  }

  // ─── Grenade spawn ─────────────────────────────────────────────────────────
  function _spawnGrenade(type, fuseLeft) {
    if (!_scene || !_camera) { return; }

    var cfg     = TYPE_CONFIG[type];
    var geo     = new THREE.SphereGeometry(GRENADE_RADIUS, 8, 6);
    var mat     = new THREE.MeshStandardMaterial ? new THREE.MeshStandardMaterial({ color: cfg.color }) : new THREE.MeshBasicMaterial({ color: cfg.color });
    var mesh    = new THREE.Mesh(geo, mat);

    // Spawn at camera position, offset slightly forward+down
    var spawnPos = _camera.position.clone();
    var fwd      = new THREE.Vector3(0, 0, -1).applyQuaternion(_camera.quaternion).normalize();
    spawnPos.addScaledVector(fwd, 0.8);
    spawnPos.y -= 0.1;
    mesh.position.copy(spawnPos);
    _scene.add(mesh);

    // Initial velocity: forward + upward arc
    var vel = fwd.clone().multiplyScalar(THROW_SPEED);
    vel.y  += THROW_SPEED * THROW_ARC;

    var grenade = {
      type:      type,
      mesh:      mesh,
      vel:       vel,
      fuse:      fuseLeft,
      bounces:   0,
      alive:     true,
      landed:    false
    };

    _activeGrenades.push(grenade);
  }

  // ─── Physics update ────────────────────────────────────────────────────────
  function _updatePhysics(g, dt) {
    // Gravity
    g.vel.y += GRAVITY * dt;

    // Integrate position
    g.mesh.position.x += g.vel.x * dt;
    g.mesh.position.y += g.vel.y * dt;
    g.mesh.position.z += g.vel.z * dt;

    // Bounce on Y=0 ground
    if (g.mesh.position.y <= GRENADE_RADIUS) {
      g.mesh.position.y = GRENADE_RADIUS;
      if (Math.abs(g.vel.y) > 0.5) {
        g.vel.y = -g.vel.y * RESTITUTION;
        g.bounces++;
        _playBounceClick();

        // For SMOKE/FLASHBANG/WP/THERMITE/EMP/INCENDIARY/CONCUSSION detonate on first land
        if (!g.landed) {
          g.landed = true;
          var nonFrag = g.type !== 'FRAG';
          if (nonFrag) {
            g.fuse = 0.05; // detonate next frame for non-frag
          }
        }
      } else {
        // Rolling
        g.vel.y  = 0;
        g.vel.x *= ROLL_FRICTION;
        g.vel.z *= ROLL_FRICTION;
        g.landed = true;
        if (!_isFragType(g.type) && !g.detonateArmed) {
          g.detonateArmed = true;
          g.fuse = Math.min(g.fuse, 0.1);
        }
      }
    }
  }

  function _isFragType(type) {
    return type === 'FRAG';
  }

  // ─── Detonation ────────────────────────────────────────────────────────────
  function _detonate(g) {
    var pos = g.mesh.position.clone();
    _scene.remove(g.mesh);
    g.alive = false;

    if (g.type === 'FRAG')        { _detonFrag(pos); }
    else if (g.type === 'SMOKE')       { _detonSmoke(pos); }
    else if (g.type === 'FLASHBANG')   { _detonFlashbang(pos); }
    else if (g.type === 'WP')          { _detonWP(pos); }
    else if (g.type === 'THERMITE')    { _detonThermite(pos); }
    else if (g.type === 'EMP')         { _detonEMP(pos); }
    else if (g.type === 'INCENDIARY')  { _detonIncendiary(pos); }
    else if (g.type === 'CONCUSSION')  { _detonConcussion(pos); }
  }

  // 1. FRAG ───────────────────────────────────────────────────────────────────
  function _detonFrag(pos) {
    var RADIUS  = 8;
    var DAMAGE  = 100;

    // Damage enemies
    _damageEnemiesInRadius(pos, RADIUS, DAMAGE);

    // 12 shrapnel fragments (BoxGeometry) fly outward
    var i;
    for (i = 0; i < 12; i++) {
      var geo  = new THREE.BoxGeometry(0.08, 0.08, 0.2);
      var mat  = new THREE.MeshBasicMaterial({ color: 0x666666 });
      var mesh = new THREE.Mesh(geo, mat);
      mesh.position.copy(pos);
      _scene.add(mesh);

      var angle   = (i / 12) * Math.PI * 2 + (Math.random() - 0.5) * 0.5;
      var elev    = (Math.random() * 0.5) + 0.1;
      var speed   = 8 + Math.random() * 6;
      var vel     = new THREE.Vector3(
        Math.cos(angle) * Math.cos(elev) * speed,
        Math.sin(elev) * speed,
        Math.sin(angle) * Math.cos(elev) * speed
      );

      _activeEffects.push({
        kind:     'shrapnel',
        mesh:     mesh,
        vel:      vel,
        life:     0.6 + Math.random() * 0.4,
        elapsed:  0
      });
    }

    // Camera shake
    _cameraShake(0.5, 0.5);
    _playExplosionSound();
  }

  // 2. SMOKE ──────────────────────────────────────────────────────────────────
  function _detonSmoke(pos) {
    var group = new THREE.Group();
    group.position.copy(pos);
    _scene.add(group);

    var geo  = new THREE.SphereGeometry(1, 8, 6);
    var mat  = new THREE.MeshBasicMaterial({
      color:       0xCCCCCC,
      transparent: true,
      opacity:     0.6,
      depthWrite:  false
    });
    var cloud = new THREE.Mesh(geo, mat);
    group.add(cloud);

    _activeEffects.push({
      kind:       'smoke',
      group:      group,
      cloud:      cloud,
      elapsed:    0,
      duration:   30,
      maxRadius:  5
    });
  }

  // 3. FLASHBANG ──────────────────────────────────────────────────────────────
  function _detonFlashbang(pos) {
    var STUN_RADIUS = 6;
    var STUN_DUR    = 4000; // ms

    // Screen flash
    if (_flashOverlayEl) {
      _flashOverlayEl.style.background    = '#ffffff';
      _flashOverlayEl.style.display       = 'block';
      _flashOverlayEl.style.opacity       = '1';
      _activeEffects.push({
        kind:     'flashOverlay',
        elapsed:  0,
        duration: 1.5
      });
    }

    // Stun nearby enemies
    _iterateEnemies(function (enemy) {
      var epos = _getEnemyPos(enemy);
      if (!epos) { return; }
      var dist = pos.distanceTo(epos);
      if (dist <= STUN_RADIUS) {
        enemy._stunned       = true;
        enemy._stunnedUntil  = performance.now() + STUN_DUR;
      }
    });

    // SFX
    _playFlashSound();
  }

  // 4. WP (White Phosphorus) ──────────────────────────────────────────────────
  function _detonWP(pos) {
    var i;
    for (i = 0; i < 8; i++) {
      var angle  = (i / 8) * Math.PI * 2;
      var dist   = 0.5 + Math.random() * 2.5;
      var bPos   = new THREE.Vector3(
        pos.x + Math.cos(angle) * dist,
        pos.y,
        pos.z + Math.sin(angle) * dist
      );

      var geo    = new THREE.SphereGeometry(0.12, 5, 4);
      var mat    = new THREE.MeshBasicMaterial({ color: 0xFF4400 });
      var mesh   = new THREE.Mesh(geo, mat);
      mesh.position.copy(bPos);
      _scene.add(mesh);

      var light  = new THREE.PointLight(0xFF4400, 1.5, 4);
      light.position.copy(bPos);
      _scene.add(light);

      _activeEffects.push({
        kind:     'wp_particle',
        mesh:     mesh,
        light:    light,
        elapsed:  0,
        duration: 8,
        baseY:    bPos.y,
        flickerT: 0
      });
    }
  }

  // 5. THERMITE ───────────────────────────────────────────────────────────────
  function _detonThermite(pos) {
    // Blackened crater disc
    var geo  = new THREE.CircleGeometry(0.8, 16);
    var mat  = new THREE.MeshBasicMaterial({ color: 0x111111, side: THREE.DoubleSide });
    var disc = new THREE.Mesh(geo, mat);
    disc.rotation.x = -Math.PI / 2;
    disc.position.set(pos.x, 0.01, pos.z);
    _scene.add(disc);

    // Intense orange-red point light
    var light = new THREE.PointLight(0xFF2200, 3, 8);
    light.position.set(pos.x, pos.y + 0.5, pos.z);
    _scene.add(light);

    _activeEffects.push({
      kind:     'thermite',
      disc:     disc,
      light:    light,
      elapsed:  0,
      duration: 20,
      flickerT: 0
    });
  }

  // 6. EMP ────────────────────────────────────────────────────────────────────
  function _detonEMP(pos) {
    window._empActive = true;
    _empTimer = 10;

    // Blue pulse light
    var light = new THREE.PointLight(0x0066FF, 4, 12);
    light.position.copy(pos);
    _scene.add(light);

    _activeEffects.push({
      kind:     'emp_light',
      light:    light,
      elapsed:  0,
      duration: 1.0
    });

    _playEMPSound();
  }

  // 7. INCENDIARY ─────────────────────────────────────────────────────────────
  function _detonIncendiary(pos) {
    var PATCH_RADIUS   = 3;
    var BURN_DURATION  = 8;
    var DAMAGE_PER_SEC = 5;

    var i;
    for (i = 0; i < 5; i++) {
      var angle   = (i / 5) * Math.PI * 2;
      var spread  = Math.random() * 2.5;
      var pPos    = new THREE.Vector3(
        pos.x + Math.cos(angle) * spread,
        0.01,
        pos.z + Math.sin(angle) * spread
      );

      var geo  = new THREE.CircleGeometry(PATCH_RADIUS, 12);
      var mat  = new THREE.MeshBasicMaterial({
        color:       0xFF3300,
        transparent: true,
        opacity:     0.6,
        side:        THREE.DoubleSide,
        depthWrite:  false
      });
      var disc = new THREE.Mesh(geo, mat);
      disc.rotation.x = -Math.PI / 2;
      disc.position.copy(pPos);
      _scene.add(disc);

      var light = new THREE.PointLight(0xFF3300, 1.5, 6);
      light.position.set(pPos.x, pPos.y + 1, pPos.z);
      _scene.add(light);

      _activeEffects.push({
        kind:          'incendiary_patch',
        disc:          disc,
        light:         light,
        center:        pPos.clone(),
        radius:        PATCH_RADIUS,
        damagePerSec:  DAMAGE_PER_SEC,
        elapsed:       0,
        duration:      BURN_DURATION,
        flickerT:      0,
        damageAccum:   0
      });
    }
  }

  // 8. CONCUSSION ─────────────────────────────────────────────────────────────
  function _detonConcussion(pos) {
    var RADIUS   = 12;
    var DAMAGE   = 50;
    var KNOCKBACK = 4;

    // Damage and knock back enemies
    _iterateEnemies(function (enemy) {
      var epos = _getEnemyPos(enemy);
      if (!epos) { return; }
      var dist = pos.distanceTo(epos);
      if (dist <= RADIUS) {
        // Damage
        _applyEnemyDamage(enemy, DAMAGE);

        // Knockback: push away from blast center
        var dir = new THREE.Vector3().subVectors(epos, pos).normalize();
        if (enemy.position) {
          enemy.position.addScaledVector(dir, KNOCKBACK);
        } else if (enemy.mesh && enemy.mesh.position) {
          enemy.mesh.position.addScaledVector(dir, KNOCKBACK);
        }
      }
    });

    // Camera shake 0.8s
    _cameraShake(0.8, 0.7);
    _playExplosionSound();
  }

  // ─── Effect update ─────────────────────────────────────────────────────────
  function _updateEffects(dt) {
    var i, eff;
    for (i = _activeEffects.length - 1; i >= 0; i--) {
      eff = _activeEffects[i];

      if (eff.kind === 'shrapnel') {
        eff.elapsed += dt;
        eff.vel.y   += GRAVITY * dt;
        eff.mesh.position.addScaledVector(eff.vel, dt);
        if (eff.mesh.position.y < 0) { eff.mesh.position.y = 0; }
        if (eff.elapsed >= eff.life) {
          _scene.remove(eff.mesh);
          _activeEffects.splice(i, 1);
        }
      }

      else if (eff.kind === 'smoke') {
        eff.elapsed += dt;
        var tSmoke  = Math.min(eff.elapsed / eff.duration, 1);
        var growT   = Math.min(eff.elapsed / 5, 1);  // grows over 5s
        var radius  = growT * eff.maxRadius;
        if (eff.group) { eff.group.scale.setScalar(radius > 0 ? radius : 0.01); }
        // Fade out in last 5s
        var fadeT   = eff.elapsed > eff.duration - 5 ? (eff.elapsed - (eff.duration - 5)) / 5 : 0;
        if (eff.cloud && eff.cloud.material) {
          eff.cloud.material.opacity = Math.max(0, 0.6 * (1 - fadeT));
        }
        if (eff.elapsed >= eff.duration) {
          if (eff.group && _scene) { _scene.remove(eff.group); }
          _activeEffects.splice(i, 1);
        }
      }

      else if (eff.kind === 'flashOverlay') {
        eff.elapsed += dt;
        var tFlash  = Math.min(eff.elapsed / eff.duration, 1);
        if (_flashOverlayEl) {
          _flashOverlayEl.style.opacity = String(Math.max(0, 1 - tFlash));
        }
        if (eff.elapsed >= eff.duration) {
          if (_flashOverlayEl) {
            _flashOverlayEl.style.display = 'none';
            _flashOverlayEl.style.opacity = '1';
          }
          _activeEffects.splice(i, 1);
        }
      }

      else if (eff.kind === 'wp_particle') {
        eff.elapsed  += dt;
        eff.flickerT += dt;
        var wpAlive   = eff.elapsed < eff.duration;
        var flicker   = 0.8 + 0.7 * Math.abs(Math.sin(eff.flickerT * 14 + Math.random()));
        if (eff.light) { eff.light.intensity = wpAlive ? flicker : 0; }
        // Slight upward drift
        if (eff.mesh) { eff.mesh.position.y += dt * 0.15; }
        if (eff.elapsed >= eff.duration) {
          if (eff.mesh  && _scene) { _scene.remove(eff.mesh); }
          if (eff.light && _scene) { _scene.remove(eff.light); }
          _activeEffects.splice(i, 1);
        }
      }

      else if (eff.kind === 'thermite') {
        eff.elapsed  += dt;
        eff.flickerT += dt;
        var thermFlicker = 1.5 + 1.5 * Math.abs(Math.sin(eff.flickerT * 10 + Math.random() * 0.5));
        if (eff.light) {
          eff.light.intensity = eff.elapsed < eff.duration ? thermFlicker : 0;
        }
        if (eff.elapsed >= eff.duration) {
          // Leave disc (burn scar) but remove light
          if (eff.light && _scene) { _scene.remove(eff.light); }
          _activeEffects.splice(i, 1);
        }
      }

      else if (eff.kind === 'emp_light') {
        eff.elapsed += dt;
        var tEMP     = Math.min(eff.elapsed / eff.duration, 1);
        if (eff.light) { eff.light.intensity = Math.max(0, 4 * (1 - tEMP)); }
        if (eff.elapsed >= eff.duration) {
          if (eff.light && _scene) { _scene.remove(eff.light); }
          _activeEffects.splice(i, 1);
        }
      }

      else if (eff.kind === 'incendiary_patch') {
        eff.elapsed  += dt;
        eff.flickerT += dt;
        var incFlicker = 0.8 + 0.7 * Math.abs(Math.sin(eff.flickerT * 8));
        if (eff.light) { eff.light.intensity = eff.elapsed < eff.duration ? incFlicker : 0; }

        // Damage enemies standing in patch
        eff.damageAccum += dt;
        if (eff.damageAccum >= 1.0) {
          eff.damageAccum -= 1.0;
          _iterateEnemies(function (enemy) {
            var epos = _getEnemyPos(enemy);
            if (!epos) { return; }
            var dx   = epos.x - eff.center.x;
            var dz   = epos.z - eff.center.z;
            var dist = Math.sqrt(dx * dx + dz * dz);
            if (dist <= eff.radius) {
              _applyEnemyDamage(enemy, eff.damagePerSec);
            }
          });
        }

        // Fade out in last 2s
        var incFadeT = eff.elapsed > eff.duration - 2 ? (eff.elapsed - (eff.duration - 2)) / 2 : 0;
        if (eff.disc && eff.disc.material) {
          eff.disc.material.opacity = Math.max(0, 0.6 * (1 - incFadeT));
        }

        if (eff.elapsed >= eff.duration) {
          if (eff.disc  && _scene) { _scene.remove(eff.disc); }
          if (eff.light && _scene) { _scene.remove(eff.light); }
          _activeEffects.splice(i, 1);
        }
      }
    }
  }

  // ─── Camera shake ──────────────────────────────────────────────────────────
  var _shakeTimer    = 0;
  var _shakeMagnitude = 0;
  var _shakeOrigin   = null;

  function _cameraShake(duration, magnitude) {
    _shakeTimer     = duration;
    _shakeMagnitude = magnitude;
    if (_camera) { _shakeOrigin = _camera.position.clone(); }
  }

  function _updateCameraShake(dt) {
    if (_shakeTimer <= 0 || !_camera) { return; }
    _shakeTimer -= dt;
    if (_shakeTimer <= 0) {
      _shakeTimer = 0;
      // Restore
      if (_shakeOrigin) {
        _camera.position.x = _shakeOrigin.x;
        _camera.position.y = _shakeOrigin.y;
        _camera.position.z = _shakeOrigin.z;
      }
      return;
    }
    var intensity = (_shakeTimer > 0 ? _shakeTimer : 0) * _shakeMagnitude * 0.05;
    if (_shakeOrigin) {
      _camera.position.x = _shakeOrigin.x + (Math.random() - 0.5) * intensity * 2;
      _camera.position.y = _shakeOrigin.y + (Math.random() - 0.5) * intensity;
      _camera.position.z = _shakeOrigin.z + (Math.random() - 0.5) * intensity * 2;
    }
  }

  // ─── Main update ───────────────────────────────────────────────────────────
  function update(dt) {
    if (!dt || dt <= 0) { dt = 0.016; }

    // Cook fuse countdown
    if (_cooking) {
      _cookFuse -= dt;
      if (_cookFuse <= 0) {
        // Fuse burned out in hand — self throw at 0
        _cookFuse = 0;
        _throwGrenade();
      } else {
        if (_cookIndicatorEl) {
          _cookIndicatorEl.textContent = 'COOK: ' + _cookFuse.toFixed(1) + 's';
        }
      }
    }

    // EMP timer
    if (_empTimer > 0) {
      _empTimer -= dt;
      if (_empTimer <= 0) {
        _empTimer = 0;
        window._empActive = false;
      }
    }

    // Grenade physics
    var i, g;
    for (i = _activeGrenades.length - 1; i >= 0; i--) {
      g = _activeGrenades[i];
      if (!g.alive) { _activeGrenades.splice(i, 1); continue; }

      // Fuse countdown
      g.fuse -= dt;
      _updatePhysics(g, dt);

      if (g.fuse <= 0) {
        _detonate(g);
        _activeGrenades.splice(i, 1);
      }
    }

    // VFX effects
    _updateEffects(dt);

    // Camera shake
    _updateCameraShake(dt);

    // Stun timer cleanup on enemies
    _iterateEnemies(function (enemy) {
      if (enemy._stunned && performance.now() > (enemy._stunnedUntil || 0)) {
        enemy._stunned = false;
      }
    });
  }

  // ─── Audio ─────────────────────────────────────────────────────────────────
  function _getAudioCtx() {
    if (_audioCtx) { return _audioCtx; }
    if (window._audioCtx) { _audioCtx = window._audioCtx; return _audioCtx; }
    try {
      var Ctor = window.AudioContext || window.webkitAudioContext;
      if (Ctor) { _audioCtx = new Ctor(); window._audioCtx = _audioCtx; }
    } catch (e) { /* no audio */ }
    return _audioCtx;
  }

  function _playBounceClick() {
    var ctx = _getAudioCtx();
    if (!ctx) { return; }
    try {
      var buf  = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.04), ctx.sampleRate);
      var data = buf.getChannelData(0);
      var j;
      for (j = 0; j < data.length; j++) {
        data[j] = (Math.random() * 2 - 1) * Math.exp(-j / (data.length * 0.15));
      }
      var src  = ctx.createBufferSource();
      src.buffer = buf;
      var gain = ctx.createGain();
      gain.gain.value = 0.3;
      src.connect(gain);
      gain.connect(ctx.destination);
      src.start();
    } catch (e) { /* ignore */ }
  }

  function _playExplosionSound() {
    var ctx = _getAudioCtx();
    if (!ctx) { return; }
    try {
      var dur   = 0.6;
      var buf   = ctx.createBuffer(1, Math.floor(ctx.sampleRate * dur), ctx.sampleRate);
      var data  = buf.getChannelData(0);
      var j;
      for (j = 0; j < data.length; j++) {
        var t = j / data.length;
        data[j] = (Math.random() * 2 - 1) * Math.pow(1 - t, 2);
      }
      var src   = ctx.createBufferSource();
      src.buffer = buf;
      var filt  = ctx.createBiquadFilter();
      filt.type = 'lowpass';
      filt.frequency.value = 400;
      var gain  = ctx.createGain();
      gain.gain.value = 0.8;
      src.connect(filt);
      filt.connect(gain);
      gain.connect(ctx.destination);
      src.start();
    } catch (e) { /* ignore */ }
  }

  function _playFlashSound() {
    var ctx = _getAudioCtx();
    if (!ctx) { return; }
    try {
      var osc  = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.frequency.value = 6000;
      osc.type = 'sine';
      gain.gain.setValueAtTime(0.5, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.12);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.12);

      var osc2  = ctx.createOscillator();
      var gain2 = ctx.createGain();
      osc2.frequency.value = 2500;
      osc2.type = 'sine';
      gain2.gain.setValueAtTime(0.25, ctx.currentTime);
      gain2.gain.linearRampToValueAtTime(0, ctx.currentTime + 1.5);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start();
      osc2.stop(ctx.currentTime + 1.5);
    } catch (e) { /* ignore */ }
  }

  function _playEMPSound() {
    var ctx = _getAudioCtx();
    if (!ctx) { return; }
    try {
      var osc  = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(1200, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(200, ctx.currentTime + 0.5);
      gain.gain.setValueAtTime(0.4, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.5);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.5);
    } catch (e) { /* ignore */ }
  }

  // ─── Enemy helpers ─────────────────────────────────────────────────────────
  function _iterateEnemies(cb) {
    var enemyList = null;
    if (_enemies) {
      if (typeof _enemies.getAll === 'function') { enemyList = _enemies.getAll(); }
      else if (Array.isArray(_enemies))           { enemyList = _enemies; }
    }
    if (!enemyList && window.Enemies && typeof window.Enemies.getAll === 'function') {
      enemyList = window.Enemies.getAll();
    }
    if (!enemyList && window._enemies && Array.isArray(window._enemies)) {
      enemyList = window._enemies;
    }
    if (!enemyList) { return; }
    var i;
    for (i = 0; i < enemyList.length; i++) {
      var e = enemyList[i];
      if (!e || e.dead || e.health <= 0) { continue; }
      cb(e);
    }
  }

  function _getEnemyPos(enemy) {
    if (enemy.position)                       { return enemy.position; }
    if (enemy.mesh && enemy.mesh.position)    { return enemy.mesh.position; }
    return null;
  }

  function _applyEnemyDamage(enemy, dmg) {
    if (typeof enemy.takeDamage === 'function') {
      enemy.takeDamage(dmg);
    } else if (typeof enemy.health !== 'undefined') {
      enemy.health = Math.max(0, (enemy.health || 0) - dmg);
    }
  }

  function _damageEnemiesInRadius(pos, radius, dmg) {
    _iterateEnemies(function (enemy) {
      var epos = _getEnemyPos(enemy);
      if (!epos) { return; }
      var dist = pos.distanceTo(epos);
      if (dist <= radius) {
        // Scale damage by distance (full at center, 0 at edge)
        var falloff  = 1 - (dist / radius);
        var actualDmg = Math.round(dmg * falloff);
        _applyEnemyDamage(enemy, actualDmg);
      }
    });
  }

  // ─── Reset ─────────────────────────────────────────────────────────────────
  function reset() {
    var i, g, eff;

    // Remove live grenades from scene
    for (i = 0; i < _activeGrenades.length; i++) {
      g = _activeGrenades[i];
      if (g.mesh && _scene) { _scene.remove(g.mesh); }
    }
    _activeGrenades = [];

    // Remove effects
    for (i = 0; i < _activeEffects.length; i++) {
      eff = _activeEffects[i];
      if (eff.mesh  && _scene) { _scene.remove(eff.mesh); }
      if (eff.light && _scene) { _scene.remove(eff.light); }
      if (eff.group && _scene) { _scene.remove(eff.group); }
      if (eff.disc  && _scene) { _scene.remove(eff.disc); }
    }
    _activeEffects = [];

    _cooking          = false;
    _cookFuse         = 0;
    _shiftGDown       = false;
    _currentTypeIndex = 0;
    _empTimer         = 0;
    _shakeTimer       = 0;
    _shakeMagnitude   = 0;
    _shakeOrigin      = null;
    window._empActive = false;

    if (_cookIndicatorEl) { _cookIndicatorEl.style.display = 'none'; }
    if (_flashOverlayEl)  { _flashOverlayEl.style.display  = 'none'; }

    _updateHUD();
  }

  // ─── Public API ────────────────────────────────────────────────────────────
  return {
    init:   init,
    update: update,
    reset:  reset
  };
}());
