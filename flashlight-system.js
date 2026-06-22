// flashlight-system.js — Tactical weapon-mounted flashlight
// Toggle: Alt+L (L alone = Night Vision; Alt+L = Flashlight)
// Battery: 180s total, no recharge. AA battery pickups restore 60s.
// Enemy detection: enemies in cone (dist <18, angle <22deg) are immediately alerted.
// Enemy suppression: enemies hit by light get _flashlightBlinded = true (30% accuracy penalty 2s).
// Night-vision interaction: if _nightVisionActive, flashlight overexposes screen 0.5s.
// Global: window._flashlightOn (boolean)

window.FlashlightSystem = (function () {
  'use strict';

  // ── Constants ────────────────────────────────────────────────────────────
  var BATTERY_MAX      = 180;    // seconds total
  var BATTERY_PICKUP   = 60;     // seconds restored per AA battery
  var DETECT_DIST      = 18;     // units — enemy alert distance
  var DETECT_ANGLE_DEG = 22;     // half-cone for detection
  var BLIND_DIST       = 18;     // units — blinding range
  var BLIND_DUR        = 2;      // seconds flashlight blind lasts
  var SPOT_COLOR       = 0xFFFFCC;
  var SPOT_INTENSITY   = 2.5;
  var SPOT_RANGE       = 25;
  var SPOT_ANGLE       = 0.4;    // radians (~23°) — THREE.SpotLight angle
  var SPOT_PENUMBRA    = 0.6;
  var CONE_RADIUS_TOP  = 0;
  var CONE_RADIUS_BOT  = 2.5;
  var CONE_HEIGHT      = 12;
  var CONE_SEGS        = 12;
  var NV_OVEREXPOSE_DUR = 0.5;   // seconds screen bleach lasts

  // ── State ────────────────────────────────────────────────────────────────
  var _on          = false;
  var _battery     = BATTERY_MAX;
  var _scene       = null;
  var _camera      = null;
  var _spotLight   = null;
  var _coneMesh    = null;
  var _hudEl       = null;
  var _toastEl     = null;
  var _toastTimer  = 0;
  var _nvTimer     = 0;         // countdown for NV overexpose effect
  var _batteries   = [];        // spawned AA pickups in world
  var _audioCtx    = null;
  var _inited      = false;

  // ── Audio — soft click via Web Audio API ─────────────────────────────────
  function _playClick() {
    try {
      if (!_audioCtx) {
        _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      }
      var osc  = _audioCtx.createOscillator();
      var gain = _audioCtx.createGain();
      osc.connect(gain);
      gain.connect(_audioCtx.destination);
      osc.type      = 'square';
      osc.frequency.setValueAtTime(2000, _audioCtx.currentTime);
      gain.gain.setValueAtTime(0.08, _audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, _audioCtx.currentTime + 0.02);
      osc.start(_audioCtx.currentTime);
      osc.stop(_audioCtx.currentTime + 0.02);
    } catch (err) {
      // AudioContext unavailable — silent fail
    }
  }

  // ── Toast notification ────────────────────────────────────────────────────
  function _showToast(msg, color) {
    if (!_toastEl) return;
    _toastEl.textContent = msg;
    _toastEl.style.color = color || '#FFEE88';
    _toastEl.style.opacity = '1';
    _toastTimer = 2.5;
  }

  // ── HUD battery bar ───────────────────────────────────────────────────────
  function _buildHUD() {
    _toastEl = document.createElement('div');
    _toastEl.id = 'flashlight-toast';
    _toastEl.style.cssText = [
      'position:fixed',
      'bottom:445px',
      'left:50%',
      'transform:translateX(-50%)',
      'background:rgba(0,0,0,0.65)',
      'border:1px solid #FFEE88',
      'color:#FFEE88',
      'padding:3px 14px',
      'border-radius:4px',
      'font-size:12px',
      'font-family:monospace',
      'z-index:200',
      'pointer-events:none',
      'opacity:0',
      'transition:opacity 0.2s'
    ].join(';');
    document.body.appendChild(_toastEl);

    _hudEl = document.createElement('div');
    _hudEl.id = 'flashlight-hud';
    _hudEl.style.cssText = [
      'display:none',
      'position:fixed',
      'bottom:470px',
      'left:50%',
      'transform:translateX(-50%)',
      'color:#FFEE88',
      'font-size:10px',
      'font-family:monospace',
      'z-index:200',
      'pointer-events:none',
      'background:rgba(0,0,0,0.55)',
      'padding:2px 8px',
      'border-radius:3px',
      'border:1px solid rgba(255,238,136,0.35)'
    ].join(';');
    document.body.appendChild(_hudEl);
  }

  function _updateHUD() {
    if (!_hudEl) return;
    if (!_on && _battery >= BATTERY_MAX) {
      _hudEl.style.display = 'none';
      return;
    }
    _hudEl.style.display = 'block';
    var pct    = Math.max(0, _battery / BATTERY_MAX);
    var bars   = Math.round(pct * 4);
    var filled = '';
    var empty  = '';
    var i;
    for (i = 0; i < bars; i++) filled += '█';
    for (i = bars; i < 4; i++) empty  += '░';
    var secs   = Math.ceil(_battery);
    _hudEl.textContent = '💡 TORCH: ' + filled + empty + ' ' + secs + 's';
  }

  // ── THREE objects ─────────────────────────────────────────────────────────
  function _buildLight() {
    if (!_scene) return;
    _spotLight = new THREE.SpotLight(SPOT_COLOR, SPOT_INTENSITY, SPOT_RANGE, SPOT_ANGLE, SPOT_PENUMBRA);
    _spotLight.castShadow = false;
    _spotLight.visible    = false;
    _scene.add(_spotLight);
    _scene.add(_spotLight.target);

    var coneGeo = new THREE.ConeGeometry(CONE_RADIUS_BOT, CONE_HEIGHT, CONE_SEGS);
    var coneMat = new THREE.MeshBasicMaterial({
      color:       0xFFFFFF,
      transparent: true,
      opacity:     0.05,
      side:        THREE.FrontSide,
      depthWrite:  false
    });
    _coneMesh = new THREE.Mesh(coneGeo, coneMat);
    _coneMesh.visible = false;
    _scene.add(_coneMesh);
  }

  // ── Battery pickups ───────────────────────────────────────────────────────
  function _spawnBatteryPickup(position) {
    if (!_scene) return;
    var geo = new THREE.BoxGeometry(0.12, 0.06, 0.2);
    var cvs = document.createElement('canvas');
    cvs.width  = 64;
    cvs.height = 32;
    var ctx = cvs.getContext('2d');
    ctx.fillStyle = '#FFDD00';
    ctx.fillRect(0, 0, 64, 32);
    ctx.fillStyle = '#222';
    ctx.font      = 'bold 14px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('AA', 32, 16);
    var tex = new THREE.CanvasTexture(cvs);
    var mat = new THREE.MeshLambertMaterial({ color: 0xFFDD00, map: tex });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(position || new THREE.Vector3(
      (Math.random() - 0.5) * 30,
      0.5,
      (Math.random() - 0.5) * 30
    ));
    mesh.userData.isFlashlightBattery = true;
    mesh.userData.bobPhase = Math.random() * Math.PI * 2;
    _scene.add(mesh);
    _batteries.push(mesh);
  }

  // ── Check battery pickup collision ────────────────────────────────────────
  function _checkPickups(playerPos, dt) {
    var PICKUP_RADIUS = 1.2;
    var toRemove = [];
    var i;
    for (i = 0; i < _batteries.length; i++) {
      var b = _batteries[i];
      var dx = b.position.x - playerPos.x;
      var dz = b.position.z - playerPos.z;
      var dist2 = dx * dx + dz * dz;
      if (dist2 < PICKUP_RADIUS * PICKUP_RADIUS) {
        _battery = Math.min(BATTERY_MAX, _battery + BATTERY_PICKUP);
        _showToast('AA BATTERY +' + BATTERY_PICKUP + 's', '#FFDD00');
        _scene.remove(b);
        if (b.geometry) b.geometry.dispose();
        toRemove.push(i);
      } else {
        // Bob up and down
        b.userData.bobPhase += dt * 2;
        b.position.y = 0.5 + Math.sin(b.userData.bobPhase) * 0.08;
        b.rotation.y += dt * 1.2;
      }
    }
    for (i = toRemove.length - 1; i >= 0; i--) {
      _batteries.splice(toRemove[i], 1);
    }
  }

  // ── Enemy detection & suppression ─────────────────────────────────────────
  function _processEnemies(camPos, camDir) {
    var enemies = window._enemies || window.EnemyManager && window.EnemyManager.getAll && window.EnemyManager.getAll();
    if (!enemies || !enemies.length) return;

    var DETECT_COS = Math.cos(DETECT_ANGLE_DEG * Math.PI / 180);
    var now = (typeof performance !== 'undefined' ? performance.now() : Date.now()) / 1000;
    var i;

    for (i = 0; i < enemies.length; i++) {
      var en = enemies[i];
      if (!en || !en.position) continue;

      var ex = en.position.x - camPos.x;
      var ey = en.position.y - camPos.y;
      var ez = en.position.z - camPos.z;
      var dist = Math.sqrt(ex * ex + ey * ey + ez * ez);
      if (dist < 0.001) continue;

      var nx = ex / dist;
      var ny = ey / dist;
      var nz = ez / dist;
      var dot = nx * camDir.x + ny * camDir.y + nz * camDir.z;

      // Detection: cone + range
      if (dist < DETECT_DIST && dot > DETECT_COS) {
        // Alert enemy
        if (en.state !== 'alerted' && en.state !== 'attacking') {
          en.state = 'alerted';
          if (en.alertCooldown === undefined || now > en.alertCooldown) {
            en.alertCooldown = now + 5;
            if (typeof HUD !== 'undefined' && HUD.notifyPickup) {
              HUD.notifyPickup('TORCH SPOTTED BY ENEMY', '#FF4444');
            }
          }
        }
        en.hostile = true;
      }

      // Suppression / blinding: tighter range, same cone
      if (dist < BLIND_DIST && dot > DETECT_COS) {
        en._flashlightBlinded = true;
        en._flashlightBlindedExpiry = now + BLIND_DUR;
      }
    }
  }

  // ── Night vision overexpose ───────────────────────────────────────────────
  function _triggerNVOverexpose() {
    window._nvOverexposed = true;
    var el = document.getElementById('flashbang-overlay');
    if (el) {
      el.style.opacity = '1';
    }
    _nvTimer = NV_OVEREXPOSE_DUR;
  }

  function _tickNVOverexpose(dt) {
    if (_nvTimer <= 0) return;
    _nvTimer -= dt;
    if (_nvTimer <= 0) {
      _nvTimer = 0;
      window._nvOverexposed = false;
      var el = document.getElementById('flashbang-overlay');
      if (el) el.style.opacity = '0';
    }
  }

  // ── Toggle ────────────────────────────────────────────────────────────────
  function toggle() {
    if (_battery <= 0 && !_on) {
      _showToast('NO BATTERY', '#888888');
      return;
    }
    _on = !_on;
    window._flashlightOn = _on;

    _playClick();

    if (_spotLight) _spotLight.visible = _on;
    if (_coneMesh)  _coneMesh.visible  = _on;
    if (_hudEl)     _hudEl.style.display = _on ? 'block' : (_battery < BATTERY_MAX ? 'block' : 'none');

    _showToast(_on ? 'FLASHLIGHT ON' : 'FLASHLIGHT OFF', _on ? '#FFEE88' : '#888888');

    // Night vision interaction
    if (_on && window._nightVisionActive) {
      _triggerNVOverexpose();
    }
  }

  // ── Keyboard listener ─────────────────────────────────────────────────────
  function _bindKeys() {
    document.addEventListener('keydown', function (e) {
      // Alt+L — flashlight toggle
      if (e.code === 'KeyL' && e.altKey && !e.ctrlKey && !e.shiftKey) {
        e.preventDefault();
        toggle();
      }
    }, false);
  }

  // ── Init ──────────────────────────────────────────────────────────────────
  function init(opts) {
    if (_inited) return;
    _inited = true;

    opts = opts || {};
    _scene  = opts.scene  || (window.GameManager && window.GameManager.scene)  || window._scene  || null;
    _camera = opts.camera || (window.GameManager && window.GameManager.camera) || window._camera || null;

    _buildHUD();

    if (_scene) {
      _buildLight();
      // Spawn a couple of AA batteries in the world to find
      _spawnBatteryPickup(new THREE.Vector3(8,  0.5,  12));
      _spawnBatteryPickup(new THREE.Vector3(-15, 0.5, -8));
    }

    _bindKeys();
    window._flashlightOn = false;

    console.log('[FlashlightSystem] ready — Alt+L to toggle');
  }

  // ── Update (call every frame) ─────────────────────────────────────────────
  function update(dt) {
    if (!_inited) return;

    dt = dt || 0.016;

    // Drain battery when on
    if (_on && _battery > 0) {
      _battery -= dt;
      if (_battery <= 0) {
        _battery = 0;
        _on = false;
        window._flashlightOn = false;
        if (_spotLight) _spotLight.visible = false;
        if (_coneMesh)  _coneMesh.visible  = false;
        _showToast('BATTERY DEAD', '#FF4444');
      }
    }

    // Sync light to camera
    if (_on && _camera) {
      var camPos = _camera.position;
      var camDir = new THREE.Vector3(0, 0, -1).applyQuaternion(_camera.quaternion);

      if (_spotLight) {
        _spotLight.position.copy(camPos);
        _spotLight.target.position.copy(camPos).addScaledVector(camDir, 10);
        _spotLight.target.updateMatrixWorld();
      }

      if (_coneMesh) {
        // Place cone starting just in front of camera, aligned with view direction
        var coneOffset = camDir.clone().multiplyScalar(CONE_HEIGHT * 0.5);
        _coneMesh.position.copy(camPos).add(coneOffset);
        // Orient cone along camera direction (cone points along -Y by default; rotate to face camDir)
        var up = new THREE.Vector3(0, 1, 0);
        var q  = new THREE.Quaternion();
        q.setFromUnitVectors(up, camDir);
        _coneMesh.quaternion.copy(q);
      }

      // Enemy processing
      _processEnemies(camPos, camDir);

      // Battery pickups
      _checkPickups(camPos, dt);
    } else if (_camera) {
      // Still check pickups even with light off
      _checkPickups(_camera.position, dt);
    }

    // NV overexpose timer
    _tickNVOverexpose(dt);

    // Toast fade
    if (_toastTimer > 0) {
      _toastTimer -= dt;
      if (_toastTimer <= 0) {
        _toastTimer = 0;
        if (_toastEl) _toastEl.style.opacity = '0';
      }
    }

    _updateHUD();

    // Clear expired flashlight blind flags on enemies
    var enemies = window._enemies || (window.EnemyManager && window.EnemyManager.getAll && window.EnemyManager.getAll());
    if (enemies && enemies.length) {
      var now = (typeof performance !== 'undefined' ? performance.now() : Date.now()) / 1000;
      var i;
      for (i = 0; i < enemies.length; i++) {
        var en = enemies[i];
        if (en && en._flashlightBlinded && en._flashlightBlindedExpiry && now > en._flashlightBlindedExpiry) {
          en._flashlightBlinded = false;
        }
      }
    }
  }

  // ── Reset ─────────────────────────────────────────────────────────────────
  function reset() {
    _on      = false;
    _battery = BATTERY_MAX;
    window._flashlightOn = false;

    if (_spotLight) _spotLight.visible = false;
    if (_coneMesh)  _coneMesh.visible  = false;

    // Remove battery pickups
    var i;
    for (i = 0; i < _batteries.length; i++) {
      if (_scene) _scene.remove(_batteries[i]);
      if (_batteries[i].geometry) _batteries[i].geometry.dispose();
    }
    _batteries = [];

    _updateHUD();
  }

  // ── Public API ────────────────────────────────────────────────────────────
  return { init: init, update: update, toggle: toggle, reset: reset };

}());
