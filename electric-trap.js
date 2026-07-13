// electric-trap.js — Deployable electric trap with arc VFX, stun, and recharge
// Key: Ctrl+E to deploy at player position (max 3 active)
// All var — no let/const. IIFE pattern.
window.ElectricTrap = (function () {
  'use strict';

  // ── Constants ───────────────────────────────────────────────────────────────
  var MAX_ACTIVE      = 3;       // max traps in world simultaneously
  var TRIGGER_RADIUS  = 1.2;     // distance (units) to trigger arc
  var STUN_DURATION   = 2.5;     // seconds enemy is stunned
  var DAMAGE_PER_SEC  = 40;      // DPS while in arc range
  var RECHARGE_TIME   = 8;       // seconds per charge recharge
  var MAX_CHARGES     = 2;       // charges per trap
  var TRAP_HP         = 30;      // hitpoints before trap destroyed
  var ARC_LINES       = 3;       // number of LineSegments per arc
  var ARC_SEGMENTS    = 6;       // jitter points per arc line
  var ARC_DURATION    = 0.15;    // seconds arc VFX stays visible after trigger
  var FLASH_DURATION  = 0.1;     // seconds of yellow screen flash
  var TRAP_RADIUS     = 0.4;     // CylinderGeometry top/bottom radius
  var TRAP_HEIGHT     = 0.05;    // CylinderGeometry height
  var TRAP_SEGMENTS   = 8;       // CylinderGeometry radial segments
  var LIGHT_COLOR     = 0xFFFF00;
  var LIGHT_INTENSITY = 1.5;
  var LIGHT_DIST      = 1.5;
  var ARC_COLOR       = 0xFFFF00;
  var AUDIO_FREQ      = 100;     // Hz sawtooth base
  var LFO_RATE        = 30;      // Hz LFO for crackling

  // ── State ──────────────────────────────────────────────────────────────────
  var _scene      = null;
  var _camera     = null;
  var _traps      = [];     // active trap objects
  var _keyBound   = false;
  var _hudEl      = null;
  var _flashEl    = null;
  var _flashTimer = 0;
  var _audioCtx   = null;

  // ── Init ───────────────────────────────────────────────────────────────────
  function init(scene, camera) {
    _scene  = scene;
    _camera = camera;
    _traps  = [];
    _flashTimer = 0;
    _ensureHUD();
    _ensureFlashOverlay();
    _updateHUD();
    _bindKey();
  }

  // ── Key Binding (Ctrl+E) ────────────────────────────────────────────────────
  function _bindKey() {
    if (_keyBound) return;
    _keyBound = true;
    document.addEventListener('keydown', function (e) {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'e' || e.key === 'E')) {
        e.preventDefault();
        deploy();
      }
    });
  }

  // ── HUD ────────────────────────────────────────────────────────────────────
  function _ensureHUD() {
    if (document.getElementById('electricTrapHUD')) return;
    var el = document.createElement('div');
    el.id = 'electricTrapHUD';
    el.style.cssText = [
      'position:fixed',
      'bottom:112px',
      'right:14px',
      'font-family:monospace',
      'font-size:13px',
      'color:#ffff00',
      'text-shadow:0 0 6px #ffcc00,0 0 2px #000',
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
    if (!_hudEl) _hudEl = document.getElementById('electricTrapHUD');
    if (!_hudEl) return;
    var remaining = MAX_ACTIVE - _traps.length;
    _hudEl.textContent = '⚡ TRAPS: ' + remaining;
  }

  // ── Flash Overlay ──────────────────────────────────────────────────────────
  function _ensureFlashOverlay() {
    if (document.getElementById('electricFlashOverlay')) {
      _flashEl = document.getElementById('electricFlashOverlay');
      return;
    }
    var el = document.createElement('div');
    el.id = 'electricFlashOverlay';
    el.style.cssText = [
      'position:fixed',
      'top:0','left:0','width:100%','height:100%',
      'background:rgba(255,255,0,0.35)',
      'pointer-events:none',
      'z-index:9999',
      'display:none'
    ].join(';');
    document.body.appendChild(el);
    _flashEl = el;
  }

  function _triggerFlash() {
    if (!_flashEl) return;
    _flashEl.style.display = 'block';
    _flashTimer = FLASH_DURATION;
  }

  // ── Striped Texture ────────────────────────────────────────────────────────
  function _buildStripeTexture() {
    var size = 64;
    var canvas = document.createElement('canvas');
    canvas.width  = size;
    canvas.height = size;
    var ctx = canvas.getContext('2d');
    // Black background
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, size, size);
    // Yellow diagonal stripes
    ctx.fillStyle = '#FFFF00';
    var stripeW = 8;
    for (var x = -size; x < size * 2; x += stripeW * 2) {
      ctx.save();
      ctx.translate(x, 0);
      ctx.fillRect(0, 0, stripeW, size);
      ctx.restore();
    }
    var tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(4, 1);
    return tex;
  }

  // ── Trap Mesh ──────────────────────────────────────────────────────────────
  function _buildTrapMesh() {
    var group = new THREE.Group();

    var geo = new THREE.CylinderGeometry(
      TRAP_RADIUS, TRAP_RADIUS, TRAP_HEIGHT, TRAP_SEGMENTS
    );
    var tex = _buildStripeTexture();
    var mat = new THREE.MeshLambertMaterial({ map: tex });
    var disc = new THREE.Mesh(geo, mat);
    disc.position.y = TRAP_HEIGHT / 2;
    group.add(disc);
    group._disc = disc;

    // Glow point light (visible when charged)
    var light = new THREE.PointLight(LIGHT_COLOR, LIGHT_INTENSITY, LIGHT_DIST);
    light.position.set(0, 0.4, 0);
    group.add(light);
    group._light = light;

    return group;
  }

  // ── Arc VFX ────────────────────────────────────────────────────────────────
  function _buildArcLines(trap) {
    var lines = [];
    for (var i = 0; i < ARC_LINES; i++) {
      var positions = new Float32Array((ARC_SEGMENTS + 1) * 3);
      var geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      var mat = new THREE.LineBasicMaterial({ color: ARC_COLOR, linewidth: 1 });
      var line = new THREE.LineSegments(geo, mat);
      _scene.add(line);
      lines.push({ line: line, geo: geo, positions: positions });
    }
    trap._arcLines = lines;
    trap._arcTimer = 0;
  }

  function _updateArcLines(trap, enemyPos) {
    var src = trap.group.position.clone();
    src.y += 0.1;
    var dst = enemyPos.clone();

    for (var i = 0; i < trap._arcLines.length; i++) {
      var arc = trap._arcLines[i];
      var pos = arc.positions;
      var idx = 0;
      for (var s = 0; s <= ARC_SEGMENTS; s++) {
        var t = s / ARC_SEGMENTS;
        var px = src.x + (dst.x - src.x) * t + (Math.random() - 0.5) * 0.25 * (1 - Math.abs(t - 0.5) * 2);
        var py = src.y + (dst.y - src.y) * t + (Math.random() - 0.5) * 0.2;
        var pz = src.z + (dst.z - src.z) * t + (Math.random() - 0.5) * 0.25 * (1 - Math.abs(t - 0.5) * 2);
        pos[idx++] = px;
        pos[idx++] = py;
        pos[idx++] = pz;
      }
      arc.geo.attributes.position.needsUpdate = true;
      arc.line.visible = true;
    }
  }

  function _hideArcLines(trap) {
    if (!trap._arcLines) return;
    for (var i = 0; i < trap._arcLines.length; i++) {
      trap._arcLines[i].line.visible = false;
    }
  }

  function _removeArcLines(trap) {
    if (!trap._arcLines) return;
    for (var i = 0; i < trap._arcLines.length; i++) {
      _scene.remove(trap._arcLines[i].line);
    }
    trap._arcLines = null;
  }

  // ── Audio ──────────────────────────────────────────────────────────────────
  function _playCrackleSound() {
    try {
      if (!_audioCtx) {
        _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      }
      var ctx = _audioCtx;
      var osc = ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(AUDIO_FREQ, ctx.currentTime);

      // LFO for crackling modulation
      var lfo = ctx.createOscillator();
      lfo.type = 'square';
      lfo.frequency.setValueAtTime(LFO_RATE, ctx.currentTime);
      var lfoGain = ctx.createGain();
      lfoGain.gain.setValueAtTime(60, ctx.currentTime);
      lfo.connect(lfoGain);
      lfoGain.connect(osc.frequency);

      var gain = ctx.createGain();
      gain.gain.setValueAtTime(0.18, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);

      osc.connect(gain);
      gain.connect(ctx.destination);

      lfo.start(ctx.currentTime);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.6);
      lfo.stop(ctx.currentTime + 0.6);
    } catch (err) {
      // Audio unavailable — silent fallback
    }
  }

  // ── Deploy ─────────────────────────────────────────────────────────────────
  function deploy() {
    if (!_scene || !_camera) return;
    if (_traps.length >= MAX_ACTIVE) {
      _flashHUD('Max traps active (' + MAX_ACTIVE + ')');
      return;
    }

    var pos = _camera.position.clone();
    pos.y = 0; // sit on ground

    var group = _buildTrapMesh();
    group.position.copy(pos);
    _scene.add(group);

    var trap = {
      group:       group,
      hp:          TRAP_HP,
      charges:     MAX_CHARGES,
      rechargeT:   0,       // recharge countdown (per charge)
      arcTimer:    0,       // arc VFX countdown
      stunTimer:   0,       // how long current stun lasts
      activeEnemy: null,    // enemy currently being zapped
      _arcLines:   null
    };

    _buildArcLines(trap);
    _hideArcLines(trap);
    _traps.push(trap);
    _updateHUD();
  }

  // ── Damage trap from external hit ─────────────────────────────────────────
  function damageTrap(trapIndex, amount) {
    if (trapIndex < 0 || trapIndex >= _traps.length) return;
    var trap = _traps[trapIndex];
    trap.hp -= amount;
    if (trap.hp <= 0) {
      _destroyTrap(trap, trapIndex);
    }
  }

  function _destroyTrap(trap, index) {
    _removeArcLines(trap);
    _scene.remove(trap.group);
    _traps.splice(index, 1);
    _updateHUD();
  }

  // ── HUD flash helper ───────────────────────────────────────────────────────
  function _flashHUD(msg) {
    if (!_hudEl) return;
    var prev = _hudEl.textContent;
    _hudEl.textContent = msg;
    _hudEl.style.color = '#ff4444';
    setTimeout(function () {
      _hudEl.style.color = '#ffff00';
      _updateHUD();
    }, 1200);
  }

  // ── Get enemies from global state ──────────────────────────────────────────
  function _getEnemies() {
    if (window._enemies && Array.isArray(window._enemies)) return window._enemies;
    if (window.Enemies && Array.isArray(window.Enemies.list)) return window.Enemies.list;
    return [];
  }

  // ── Update (called each frame) ─────────────────────────────────────────────
  function update(delta) {
    if (!_scene) return;

    // Flash overlay countdown
    if (_flashTimer > 0) {
      _flashTimer -= delta;
      if (_flashTimer <= 0 && _flashEl) {
        _flashEl.style.display = 'none';
        _flashTimer = 0;
      }
    }

    var enemies = _getEnemies();
    var i, j, trap, enemy, dist, diff;

    for (i = _traps.length - 1; i >= 0; i--) {
      trap = _traps[i];

      // Recharge logic
      if (trap.charges < MAX_CHARGES) {
        trap.rechargeT -= delta;
        if (trap.rechargeT <= 0) {
          trap.charges += 1;
          trap.rechargeT = trap.charges < MAX_CHARGES ? RECHARGE_TIME : 0;
        }
      }

      // Glow when charged
      if (trap.group._light) {
        trap.group._light.visible = (trap.charges > 0);
      }

      // Arc timer (arc VFX active)
      if (trap.arcTimer > 0) {
        trap.arcTimer -= delta;

        // Jitter arc lines if enemy still present
        if (trap.activeEnemy && trap.activeEnemy.mesh) {
          var enemyPos = trap.activeEnemy.mesh.position;
          _updateArcLines(trap, enemyPos);

          // Apply ongoing damage
          if (trap.activeEnemy._stunned) {
            if (typeof trap.activeEnemy.hp === 'number') {
              trap.activeEnemy.hp -= DAMAGE_PER_SEC * delta;
            }
            if (trap.activeEnemy.hp !== undefined && trap.activeEnemy.hp <= 0) {
              trap.activeEnemy._stunned = false;
              trap.activeEnemy = null;
            }
          }
        }

        if (trap.arcTimer <= 0) {
          _hideArcLines(trap);
          if (trap.activeEnemy) {
            trap.activeEnemy._stunned = false;
            trap.activeEnemy = null;
          }
          trap.arcTimer = 0;
        }
        continue; // arc firing — don't trigger again this frame
      }

      // Skip if no charges
      if (trap.charges <= 0) continue;

      // Scan enemies
      for (j = 0; j < enemies.length; j++) {
        enemy = enemies[j];
        if (!enemy || enemy._dead || enemy._stunned) continue;
        var mesh = enemy.mesh || enemy.group || enemy.object3D;
        if (!mesh) continue;

        diff = new THREE.Vector3();
        diff.subVectors(mesh.position, trap.group.position);
        dist = diff.length();

        if (dist <= TRIGGER_RADIUS) {
          // Trigger arc!
          trap.charges -= 1;
          trap.rechargeT = RECHARGE_TIME;

          enemy._stunned = true;
          trap.activeEnemy = enemy;
          trap.arcTimer = STUN_DURATION;

          _updateArcLines(trap, mesh.position);
          _triggerFlash();
          _playCrackleSound();
          break; // one enemy per trap activation
        }
      }
    }
  }

  // ── Reset ──────────────────────────────────────────────────────────────────
  function reset() {
    var i;
    for (i = 0; i < _traps.length; i++) {
      _removeArcLines(_traps[i]);
      if (_scene) _scene.remove(_traps[i].group);
    }
    _traps = [];
    _flashTimer = 0;
    if (_flashEl) _flashEl.style.display = 'none';
    _updateHUD();
  }

  // ── Public API ─────────────────────────────────────────────────────────────
  return {
    init:        init,
    update:      update,
    deploy:      deploy,
    reset:       reset,
    damageTrap:  damageTrap
  };

})();
