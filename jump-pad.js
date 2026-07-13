// jump-pad.js — Deployable launch pads for vertical/directional traversal
// Key: Ctrl+J to place a jump pad at player position (max 5 active pads)
// All var — no let/const. IIFE pattern.
window.JumpPad = (function () {
  'use strict';

  // ── Constants ──────────────────────────────────────────────────────────────
  var MAX_PADS         = 5;       // max pads in world simultaneously
  var TRIGGER_RADIUS   = 0.8;    // distance (units) to activate pad
  var LAUNCH_VEL_Y     = 18;     // upward launch velocity
  var LAUNCH_VEL_HORIZ = 6;      // horizontal launch velocity multiplier
  var COOLDOWN_SEC     = 1.5;    // seconds before pad can trigger again
  var PAD_LIFETIME     = 60;     // seconds before pad auto-expires
  var PAD_RADIUS_TOP   = 0.7;
  var PAD_RADIUS_BOT   = 0.7;
  var PAD_HEIGHT       = 0.1;
  var PAD_SEGMENTS     = 8;
  var PAD_COLOR        = 0xFF6600; // bright orange
  var INNER_DISK_COLOR = 0xFF9900;
  var LIGHT_COLOR      = 0xFF8800;
  var LIGHT_INTENSITY  = 4;
  var LIGHT_DIST       = 3;
  var ARROW_COUNT      = 4;
  var SOUND_FREQ_START = 200;    // Hz
  var SOUND_FREQ_END   = 800;    // Hz
  var SOUND_DURATION   = 0.2;   // seconds

  // ── State ──────────────────────────────────────────────────────────────────
  var _scene    = null;
  var _camera   = null;
  var _pads     = [];      // active pad objects
  var _keyBound = false;
  var _hudEl    = null;
  var _audioCtx = null;
  var _time     = 0;

  // ── Init ───────────────────────────────────────────────────────────────────
  function init(scene, camera) {
    _scene  = scene  || window._gameScene;
    _camera = camera || window._camera;
    _pads   = [];
    _time   = 0;
    _ensureHUD();
    _updateHUD();
    _bindKey();
  }

  // ── Key Binding (Ctrl+J) ───────────────────────────────────────────────────
  function _bindKey() {
    if (_keyBound) return;
    _keyBound = true;
    document.addEventListener('keydown', function (e) {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'j' || e.key === 'J')) {
        e.preventDefault();
        place();
      }
    });
  }

  // ── HUD ────────────────────────────────────────────────────────────────────
  function _ensureHUD() {
    if (document.getElementById('jumpPadHUD')) {
      _hudEl = document.getElementById('jumpPadHUD');
      return;
    }
    var el = document.createElement('div');
    el.id = 'jumpPadHUD';
    el.style.cssText = [
      'position:fixed',
      'bottom:56px',
      'left:50%',
      'transform:translateX(-50%)',
      'font-family:monospace',
      'font-size:14px',
      'font-weight:bold',
      'color:#FF6600',
      'text-shadow:0 0 8px #FF8800,0 0 2px #000',
      'background:rgba(0,0,0,0.55)',
      'padding:4px 12px',
      'border-radius:5px',
      'z-index:1000',
      'pointer-events:none',
      'user-select:none',
      'letter-spacing:1px'
    ].join(';');
    document.body.appendChild(el);
    _hudEl = el;
  }

  function _updateHUD() {
    if (!_hudEl) _hudEl = document.getElementById('jumpPadHUD');
    if (!_hudEl) return;
    var remaining = MAX_PADS - _pads.length;
    _hudEl.textContent = '⬆ PAD ×' + remaining;
  }

  // ── Audio ──────────────────────────────────────────────────────────────────
  function _playBoing() {
    try {
      if (!_audioCtx) {
        _audioCtx = window._audioCtx || new (window.AudioContext || window.webkitAudioContext)();
      }
      var ctx = _audioCtx;
      var osc = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(SOUND_FREQ_START, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(SOUND_FREQ_END, ctx.currentTime + SOUND_DURATION);
      gain.gain.setValueAtTime(0.4, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + SOUND_DURATION + 0.05);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + SOUND_DURATION + 0.1);
    } catch (e) {
      // audio unavailable — skip silently
    }
  }

  // ── Pad Mesh Creation ──────────────────────────────────────────────────────
  function _createPadMesh(position, yaw) {
    var group = new THREE.Group();
    group.position.copy(position);

    // Main flat cylinder (base pad)
    var baseGeo = new THREE.CylinderGeometry(PAD_RADIUS_TOP, PAD_RADIUS_BOT, PAD_HEIGHT, PAD_SEGMENTS);
    var baseMat = new THREE.MeshBasicMaterial({ color: PAD_COLOR });
    var baseMesh = new THREE.Mesh(baseGeo, baseMat);
    baseMesh.position.y = 0;
    group.add(baseMesh);

    // Inner animated disk (slightly smaller, sits on top)
    var diskGeo = new THREE.CylinderGeometry(PAD_RADIUS_TOP * 0.6, PAD_RADIUS_BOT * 0.6, PAD_HEIGHT * 0.5, PAD_SEGMENTS);
    var diskMat = new THREE.MeshBasicMaterial({ color: INNER_DISK_COLOR });
    var diskMesh = new THREE.Mesh(diskGeo, diskMat);
    diskMesh.position.y = PAD_HEIGHT * 0.75;
    group.add(diskMesh);

    // 4 ArrowHelpers pointing upward above pad, cycling orange→yellow
    var arrowColors = [0xFF6600, 0xFF8800, 0xFFAA00, 0xFFCC00];
    var arrows = [];
    var arrowDir = new THREE.Vector3(0, 1, 0);
    for (var i = 0; i < ARROW_COUNT; i++) {
      var angle = (i / ARROW_COUNT) * Math.PI * 2;
      var ox = Math.cos(angle) * 0.3;
      var oz = Math.sin(angle) * 0.3;
      var arrowOrigin = new THREE.Vector3(ox, PAD_HEIGHT + 0.1, oz);
      var arrow = new THREE.ArrowHelper(arrowDir, arrowOrigin, 0.5, arrowColors[i], 0.15, 0.1);
      group.add(arrow);
      arrows.push(arrow);
    }

    // Point light above pad
    var light = new THREE.PointLight(LIGHT_COLOR, LIGHT_INTENSITY, LIGHT_DIST);
    light.position.set(0, 0.8, 0);
    group.add(light);

    // Store yaw for angled launch
    group.userData.yaw = yaw;

    if (_scene) _scene.add(group);

    return {
      group:     group,
      diskMesh:  diskMesh,
      arrows:    arrows,
      light:     light,
      cooldown:  0,
      lifetime:  PAD_LIFETIME,
      position:  position.clone(),
      yaw:       yaw
    };
  }

  // ── Remove Pad ─────────────────────────────────────────────────────────────
  function _removePad(pad) {
    if (_scene && pad.group) {
      _scene.remove(pad.group);
      // Dispose geometries and materials
      pad.group.traverse(function (obj) {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) obj.material.dispose();
      });
    }
  }

  // ── Placement ──────────────────────────────────────────────────────────────
  function place() {
    var scene  = _scene  || window._gameScene;
    var camera = _camera || window._camera;
    if (!scene || !camera) return;

    if (_pads.length >= MAX_PADS) {
      if (window.HUD && window.HUD.showToast) {
        window.HUD.showToast('Max ' + MAX_PADS + ' jump pads active!');
      }
      return;
    }

    // Get player position
    var pos = null;
    if (window.player && window.player.position) {
      pos = window.player.position.clone();
    } else {
      pos = camera.position.clone();
    }
    // Place pad slightly below camera/player feet
    pos.y -= 1.0;

    // Get camera yaw (horizontal rotation)
    var euler = new THREE.Euler();
    euler.setFromQuaternion(camera.quaternion, 'YXZ');
    var yaw = euler.y;

    var pad = _createPadMesh(pos, yaw);
    _pads.push(pad);
    _updateHUD();

    if (window.HUD && window.HUD.showToast) {
      window.HUD.showToast('⬆ Jump pad placed! (' + _pads.length + '/' + MAX_PADS + ')');
    }
  }

  // ── Launch Entity ──────────────────────────────────────────────────────────
  function _launchEntity(isPlayer, padYaw) {
    var vx = Math.sin(-padYaw) * LAUNCH_VEL_HORIZ;
    var vz = Math.cos(-padYaw) * LAUNCH_VEL_HORIZ;

    if (isPlayer) {
      // Try setting on player object first
      if (window.player && window.player.velocity) {
        window.player.velocity.y = LAUNCH_VEL_Y;
        window.player.velocity.x = (window.player.velocity.x || 0) + vx;
        window.player.velocity.z = (window.player.velocity.z || 0) + vz;
      } else {
        // Fallback: global velocity vars
        window._playerVelocityY = LAUNCH_VEL_Y;
        window._playerVelocityX = (window._playerVelocityX || 0) + vx;
        window._playerVelocityZ = (window._playerVelocityZ || 0) + vz;
      }
    } else {
      // Enemy: use global velocity applied by enemy system hooks
      window._enemyLaunchVelocityY = LAUNCH_VEL_Y;
      window._enemyLaunchVelocityX = vx;
      window._enemyLaunchVelocityZ = vz;
    }
  }

  // ── Update ─────────────────────────────────────────────────────────────────
  function update(dt) {
    if (!dt || dt <= 0) return;
    _time += dt;

    var scene  = _scene  || window._gameScene;
    var camera = _camera || window._camera;
    if (!scene) return;

    // Get player position
    var playerPos = null;
    if (window.player && window.player.position) {
      playerPos = window.player.position;
    } else if (camera) {
      playerPos = camera.position;
    }

    // Get enemies list
    var enemies = [];
    if (window.Enemies && window.Enemies.getAll) {
      enemies = window.Enemies.getAll();
    }

    var i = _pads.length - 1;
    while (i >= 0) {
      var pad = _pads[i];

      // Decrement lifetime
      pad.lifetime -= dt;
      if (pad.lifetime <= 0) {
        _removePad(pad);
        _pads.splice(i, 1);
        i--;
        _updateHUD();
        continue;
      }

      // Cooldown tick
      if (pad.cooldown > 0) {
        pad.cooldown -= dt;
        if (pad.cooldown < 0) pad.cooldown = 0;
      }

      // Animate inner disk: pulse up and down
      var diskY = PAD_HEIGHT * 0.75 + Math.sin(_time * 5) * 0.05;
      pad.diskMesh.position.y = diskY;

      // Animate arrows: cycle colors orange→yellow
      var colorPhase = (_time * 2) % 1;
      for (var a = 0; a < pad.arrows.length; a++) {
        var t = ((colorPhase + a / ARROW_COUNT) % 1);
        // Lerp from orange (0xFF6600) to yellow (0xFFFF00)
        var r = 1.0;
        var g = 0.4 + t * 0.6;
        var b = 0;
        if (pad.arrows[a].line && pad.arrows[a].line.material) {
          pad.arrows[a].line.material.color.setRGB(r, g, b);
        }
        if (pad.arrows[a].cone && pad.arrows[a].cone.material) {
          pad.arrows[a].cone.material.color.setRGB(r, g, b);
        }
      }

      // Animate point light: flicker based on sin(time*8)
      var flicker = 0.7 + 0.3 * Math.sin(_time * 8 + i);
      pad.light.intensity = LIGHT_INTENSITY * flicker;

      // Check player activation
      if (pad.cooldown <= 0 && playerPos) {
        var dx = playerPos.x - pad.position.x;
        var dy = playerPos.y - pad.position.y;
        var dz = playerPos.z - pad.position.z;
        var dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
        if (dist < TRIGGER_RADIUS) {
          pad.cooldown = COOLDOWN_SEC;
          _launchEntity(true, pad.yaw);
          _playBoing();
          if (window.HUD && window.HUD.showToast) {
            window.HUD.showToast('⬆ LAUNCH!');
          }
        }
      }

      // Check enemy activation
      if (pad.cooldown <= 0 && enemies.length > 0) {
        for (var e = 0; e < enemies.length; e++) {
          var enemy = enemies[e];
          if (!enemy || !enemy.position) continue;
          var edx = enemy.position.x - pad.position.x;
          var edy = enemy.position.y - pad.position.y;
          var edz = enemy.position.z - pad.position.z;
          var edist = Math.sqrt(edx * edx + edy * edy + edz * edz);
          if (edist < TRIGGER_RADIUS) {
            pad.cooldown = COOLDOWN_SEC;
            _launchEntity(false, pad.yaw);
            // Apply velocity directly to enemy if possible
            if (enemy.velocity) {
              enemy.velocity.y = LAUNCH_VEL_Y;
            }
            _playBoing();
            break;
          }
        }
      }

      i--;
    }
  }

  // ── Reset ──────────────────────────────────────────────────────────────────
  function reset() {
    for (var i = 0; i < _pads.length; i++) {
      _removePad(_pads[i]);
    }
    _pads = [];
    _updateHUD();
  }

  // ── Public API ─────────────────────────────────────────────────────────────
  return {
    init:   init,
    update: update,
    place:  place,
    reset:  reset
  };

}());
