/* ───────────────────────────────────────────────────────────────────────
   MINE SWEEPER TOOL — handheld mine detector and safe-disarm tool
   Toggle with M key. Detects all mine types, shows directional arrow,
   proximity beeps, and allows safe disarm (hold E 4s within 1 unit).
   All var, IIFE pattern.
   ─────────────────────────────────────────────────────────────────────── */
window.MineSweeperTool = (function () {
  'use strict';

  // ── State ────────────────────────────────────────────────────────────
  var _scene = null;
  var _camera = null;
  var _active = false;
  var _initialized = false;
  var _audioCtxCache = null;

  // HUD elements
  var _hudEl = null;
  var _arrowEl = null;
  var _disarmBarEl = null;
  var _nearMissEl = null;

  // Beep timing
  var _beepTimer = 0;
  var _beepInterval = 1.5;

  // Disarm state
  var _eHeld = false;
  var _disarmTimer = 0;
  var _disarmTarget = null;
  var DISARM_TIME = 4.0;
  var DISARM_RADIUS = 1.0;

  // Glow lights attached to nearby mines
  var _glowLights = [];  // { light, mine }

  // Near-miss warning cooldown
  var _nearMissWarnTimer = 0;
  var _nearMissFlashTimer = 0;

  // Pickup count
  var _toolCount = 1;

  // Constants
  var DETECT_RANGE = 15;
  var GLOW_RANGE = 8;
  var NEAR_MISS_RANGE = 0.5;
  var BEEP_FAR_INTERVAL = 1.5;
  var BEEP_NEAR_INTERVAL = 0.05;
  var BEEP_CLOSE_DIST = 0.8;

  // ── Audio ─────────────────────────────────────────────────────────────
  function _getAudioCtx() {
    if (_audioCtxCache && _audioCtxCache.state !== 'closed') return _audioCtxCache;
    try {
      _audioCtxCache = window._audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
      _audioCtxCache = null;
    }
    return _audioCtxCache;
  }

  function _beep(freq, duration, volume) {
    var ctx = _getAudioCtx();
    if (!ctx) return;
    try {
      var osc = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq || 880;
      gain.gain.setValueAtTime(volume !== undefined ? volume : 0.35, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + (duration || 0.07));
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + (duration || 0.07));
    } catch (e) {}
  }

  function _warningBeep() {
    _beep(1200, 0.12, 0.5);
    setTimeout(function () { _beep(1200, 0.12, 0.5); }, 150);
  }

  // ── Mine collection ───────────────────────────────────────────────────
  function _getAllMineObjects() {
    var list = [];

    // MinefieldSystem
    if (window.MinefieldSystem && window.MinefieldSystem.getMines) {
      var sm = window.MinefieldSystem.getMines();
      if (sm) {
        for (var a = 0; a < sm.length; a++) {
          if (sm[a] && !sm[a].triggered) list.push(sm[a]);
        }
      }
    }

    // _activeMines (scatter-mine / generic)
    if (window._activeMines) {
      for (var b = 0; b < window._activeMines.length; b++) {
        var m = window._activeMines[b];
        if (m && m.position) list.push(m);
      }
    }

    // _claymores
    if (window._claymores) {
      for (var c = 0; c < window._claymores.length; c++) {
        var cl = window._claymores[c];
        if (cl && cl.position) list.push(cl);
      }
    }

    // _claymoreDirectionalMines
    if (window._claymoreDirectionalMines) {
      for (var d = 0; d < window._claymoreDirectionalMines.length; d++) {
        var cd = window._claymoreDirectionalMines[d];
        if (cd && cd.position) list.push(cd);
      }
    }

    // _tripwireIeds
    if (window._tripwireIeds) {
      for (var e2 = 0; e2 < window._tripwireIeds.length; e2++) {
        var tw = window._tripwireIeds[e2];
        if (tw && tw.position) list.push(tw);
      }
    }

    return list;
  }

  function _getMinePosition(mine) {
    // Mine objects may expose position directly or via mesh
    if (mine.position) return mine.position;
    if (mine.mesh && mine.mesh.position) return mine.mesh.position;
    return null;
  }

  function _getPlayerPos() {
    if (_camera) return _camera.position;
    if (window._camera) return window._camera.position;
    return null;
  }

  function _distToMine(mine) {
    var pp = _getPlayerPos();
    if (!pp) return 9999;
    var mp = _getMinePosition(mine);
    if (!mp) return 9999;
    var dx = mp.x - pp.x;
    var dy = mp.y - pp.y;
    var dz = mp.z - pp.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  function _findNearest(mines) {
    var nearest = null;
    var nearestDist = 9999;
    for (var i = 0; i < mines.length; i++) {
      var d = _distToMine(mines[i]);
      if (d < nearestDist) {
        nearestDist = d;
        nearest = mines[i];
      }
    }
    return { mine: nearest, dist: nearestDist };
  }

  // ── HUD creation ───────────────────────────────────────────────────────
  function _createHUD() {
    // Main detector panel
    _hudEl = document.createElement('div');
    _hudEl.id = 'mine-sweeper-hud';
    _hudEl.style.cssText = [
      'position:fixed',
      'bottom:160px',
      'right:20px',
      'width:200px',
      'background:rgba(0,20,0,0.88)',
      'color:#00FF44',
      'font-family:monospace',
      'font-size:12px',
      'padding:8px 10px',
      'border:2px solid #00FF44',
      'border-radius:6px',
      'display:none',
      'z-index:950',
      'pointer-events:none',
      'box-shadow:0 0 12px rgba(0,255,68,0.4)'
    ].join(';');
    _hudEl.innerHTML = [
      '<div style="text-align:center;font-size:14px;letter-spacing:2px;border-bottom:1px solid #00FF44;margin-bottom:6px;padding-bottom:4px">MINE SWEEPER</div>',
      '<pre style="margin:0;line-height:1.3">',
      ' +-------+',
      ' | [===] |',
      ' |  |||  |',
      ' | [===] |',
      ' +---+---+',
      '     |',
      '</pre>',
      '<div id="msw-screen" style="background:#001400;border:1px solid #00AA22;padding:4px 6px;margin-top:6px;min-height:36px;">',
      '<div id="msw-status" style="color:#00FF44">-- SCANNING --</div>',
      '<div id="msw-dist" style="color:#FFFF00;font-size:11px"></div>',
      '</div>'
    ].join('\n');
    document.body.appendChild(_hudEl);

    // Directional arrow overlay
    _arrowEl = document.createElement('div');
    _arrowEl.id = 'mine-sweeper-arrow';
    _arrowEl.style.cssText = [
      'position:fixed',
      'top:50%',
      'left:50%',
      'transform:translate(-50%,-50%)',
      'color:#FFFF00',
      'font-size:32px',
      'font-weight:bold',
      'display:none',
      'z-index:951',
      'pointer-events:none',
      'text-shadow:0 0 8px #FF8800,0 0 16px #FF4400',
      'transition:transform 0.15s'
    ].join(';');
    _arrowEl.innerHTML = '<span id="msw-arrow-char">&#8593;</span><div style="font-size:12px;color:#FFFF00;text-align:center;margin-top:2px" id="msw-arrow-dist"></div>';
    document.body.appendChild(_arrowEl);

    // Disarm progress bar
    _disarmBarEl = document.createElement('div');
    _disarmBarEl.id = 'mine-sweeper-disarm';
    _disarmBarEl.style.cssText = [
      'position:fixed',
      'bottom:60px',
      'left:50%',
      'transform:translateX(-50%)',
      'width:260px',
      'background:rgba(0,0,0,0.85)',
      'border:2px solid #FFAA00',
      'border-radius:6px',
      'padding:8px 12px',
      'color:#FFAA00',
      'font-family:monospace',
      'font-size:13px',
      'text-align:center',
      'display:none',
      'z-index:952',
      'pointer-events:none'
    ].join(';');
    _disarmBarEl.innerHTML = [
      '<div style="letter-spacing:1px;margin-bottom:6px">CUTTING WIRES...</div>',
      '<div style="background:#111;border:1px solid #FFAA00;border-radius:3px;height:12px;overflow:hidden">',
      '<div id="msw-bar-fill" style="height:100%;width:0%;background:#FFAA00;transition:width 0.1s"></div>',
      '</div>'
    ].join('');
    document.body.appendChild(_disarmBarEl);

    // Near-miss warning flash
    _nearMissEl = document.createElement('div');
    _nearMissEl.id = 'mine-sweeper-nearmiss';
    _nearMissEl.style.cssText = [
      'position:fixed',
      'top:30%',
      'left:50%',
      'transform:translateX(-50%)',
      'color:#FF2200',
      'font-family:monospace',
      'font-size:22px',
      'font-weight:bold',
      'text-shadow:0 0 10px #FF0000',
      'display:none',
      'z-index:960',
      'pointer-events:none',
      'background:rgba(80,0,0,0.6)',
      'padding:8px 20px',
      'border:2px solid #FF2200',
      'border-radius:6px'
    ].join(';');
    _nearMissEl.textContent = '⚠ MINE NEARBY!';
    document.body.appendChild(_nearMissEl);
  }

  // ── Glow lights ────────────────────────────────────────────────────────
  function _clearGlowLights() {
    for (var i = 0; i < _glowLights.length; i++) {
      var gl = _glowLights[i];
      if (gl.light && gl.light.parent) {
        gl.light.parent.remove(gl.light);
      } else if (_scene) {
        _scene.remove(gl.light);
      }
    }
    _glowLights = [];
  }

  function _updateGlowLights(mines) {
    var sc = _scene || window._gameScene;
    if (!sc) return;

    // Remove lights for mines now out of range or if sweeper deactivated
    var toKeep = [];
    for (var i = _glowLights.length - 1; i >= 0; i--) {
      var gl = _glowLights[i];
      var stillValid = _active && (_distToMine(gl.mine) <= GLOW_RANGE);
      if (!stillValid) {
        if (gl.light.parent) gl.light.parent.remove(gl.light);
        else sc.remove(gl.light);
      } else {
        toKeep.push(gl);
      }
    }
    _glowLights = toKeep;

    if (!_active) return;

    // Add lights for mines newly in range
    for (var j = 0; j < mines.length; j++) {
      var mine = mines[j];
      if (_distToMine(mine) > GLOW_RANGE) continue;

      // Check if already has a light
      var alreadyHas = false;
      for (var k = 0; k < _glowLights.length; k++) {
        if (_glowLights[k].mine === mine) { alreadyHas = true; break; }
      }
      if (alreadyHas) continue;

      var mp = _getMinePosition(mine);
      if (!mp) continue;

      var light = new THREE.PointLight(0xFFFF00, 4, 4);
      light.position.set(mp.x, mp.y + 0.3, mp.z);
      sc.add(light);
      _glowLights.push({ light: light, mine: mine });
    }
  }

  // ── Arrow direction ────────────────────────────────────────────────────
  function _updateArrow(mine, dist) {
    if (!mine || !_arrowEl || !_camera) return;
    var mp = _getMinePosition(mine);
    if (!mp) return;

    var pp = _camera.position;
    // Direction vector in world XZ space
    var dx = mp.x - pp.x;
    var dz = mp.z - pp.z;

    // Camera yaw from rotation.y (Three.js Y-up, negate for screen)
    var camYaw = _camera.rotation.y;
    // Rotate world direction into camera space
    var screenX = dx * Math.cos(camYaw) - dz * Math.sin(camYaw);
    var screenZ = dx * Math.sin(camYaw) + dz * Math.cos(camYaw);

    // Angle from camera forward (+Z is forward in camera space, but world -Z is typically forward)
    var angle = Math.atan2(screenX, -screenZ) * (180 / Math.PI);

    var arrowChar = document.getElementById('msw-arrow-char');
    var arrowDist = document.getElementById('msw-arrow-dist');

    if (arrowChar) {
      // Rotate the arrow div
      _arrowEl.style.transform = 'translate(-50%,-50%) rotate(' + angle + 'deg)';
      arrowChar.textContent = '↑';
    }
    if (arrowDist) {
      // Reset rotation for text readability
      arrowDist.style.transform = 'rotate(' + (-angle) + 'deg)';
      arrowDist.textContent = dist.toFixed(1) + 'm';
    }
  }

  // ── Score / toast helpers ─────────────────────────────────────────────
  function _addScore(pts) {
    if (window.player && window.player.score !== undefined) {
      window.player.score += pts;
    }
  }

  function _showToast(msg) {
    if (window.HUD && window.HUD.showToast) {
      window.HUD.showToast(msg);
    }
  }

  // ── Disarm logic ───────────────────────────────────────────────────────
  function _removeMine(mine) {
    var sc = _scene || window._gameScene;

    // Remove mesh from scene
    var mesh = mine.mesh || mine;
    if (mesh && mesh.parent) {
      mesh.parent.remove(mesh);
    } else if (sc && mesh && mesh.isObject3D) {
      sc.remove(mesh);
    }

    // Remove from known arrays
    function _spliceFrom(arr, obj) {
      if (!arr) return;
      var idx = arr.indexOf(obj);
      if (idx !== -1) arr.splice(idx, 1);
    }

    if (window._activeMines) _spliceFrom(window._activeMines, mine);
    if (window._claymores) _spliceFrom(window._claymores, mine);
    if (window._claymoreDirectionalMines) _spliceFrom(window._claymoreDirectionalMines, mine);
    if (window._tripwireIeds) _spliceFrom(window._tripwireIeds, mine);

    // MinefieldSystem internal array — call its own remove if available
    if (window.MinefieldSystem && window.MinefieldSystem.removeMine) {
      window.MinefieldSystem.removeMine(mine);
    }
  }

  // ── Update ─────────────────────────────────────────────────────────────
  function update(dt) {
    if (!_initialized) return;

    var mines = _getAllMineObjects();
    var pp = _getPlayerPos();

    // ── Near-miss warning (regardless of sweeper active state) ──────────
    if (pp && _nearMissWarnTimer > 0) _nearMissWarnTimer -= dt;
    if (pp) {
      for (var ni = 0; ni < mines.length; ni++) {
        var nmd = _distToMine(mines[ni]);
        if (nmd <= NEAR_MISS_RANGE && !_active) {
          if (_nearMissWarnTimer <= 0) {
            _nearMissWarnTimer = 2.5;
            _warningBeep();
            if (_nearMissEl) {
              _nearMissEl.style.display = 'block';
              _nearMissFlashTimer = 2.0;
            }
            _showToast('⚠ MINE NEARBY!');
          }
          break;
        }
      }
    }

    // Flash near-miss HUD
    if (_nearMissFlashTimer > 0) {
      _nearMissFlashTimer -= dt;
      if (_nearMissFlashTimer <= 0 && _nearMissEl) {
        _nearMissEl.style.display = 'none';
      }
    }

    // ── Sweeper inactive ──────────────────────────────────────────────────
    if (!_active) {
      _clearGlowLights();
      return;
    }

    // ── Glow lights ────────────────────────────────────────────────────────
    _updateGlowLights(mines);

    // ── Find nearest mine within detect range ──────────────────────────────
    var withinRange = [];
    for (var wi = 0; wi < mines.length; wi++) {
      if (_distToMine(mines[wi]) <= DETECT_RANGE) withinRange.push(mines[wi]);
    }

    var nearest = _findNearest(withinRange);
    var nearestMine = nearest.mine;
    var nearestDist = nearest.dist;

    // ── Beeping ───────────────────────────────────────────────────────────
    _beepTimer -= dt;
    if (nearestMine) {
      var ratio = 1 - Math.min(1, (nearestDist - BEEP_CLOSE_DIST) / (DETECT_RANGE - BEEP_CLOSE_DIST));
      if (ratio < 0) ratio = 0;
      _beepInterval = BEEP_FAR_INTERVAL - ratio * (BEEP_FAR_INTERVAL - BEEP_NEAR_INTERVAL);
      if (_beepTimer <= 0) {
        _beepTimer = _beepInterval;
        var freq = 600 + ratio * 1000;
        _beep(freq, 0.06, 0.3);
      }
    } else {
      _beepTimer = 0;
    }

    // ── Arrow + HUD display ───────────────────────────────────────────────
    var statusEl = document.getElementById('msw-status');
    var distEl = document.getElementById('msw-dist');

    if (nearestMine) {
      _arrowEl.style.display = 'block';
      _updateArrow(nearestMine, nearestDist);

      if (statusEl) {
        statusEl.style.color = nearestDist < 3 ? '#FF4444' : nearestDist < 7 ? '#FFAA00' : '#00FF44';
        statusEl.textContent = nearestDist < BEEP_CLOSE_DIST ? '!! DANGER CLOSE !!' : 'MINE DETECTED';
      }
      if (distEl) {
        distEl.textContent = 'DIST: ' + nearestDist.toFixed(1) + 'm';
      }
    } else {
      _arrowEl.style.display = 'none';
      if (statusEl) { statusEl.style.color = '#00FF44'; statusEl.textContent = '-- CLEAR --'; }
      if (distEl) { distEl.textContent = ''; }
    }

    // ── Disarm logic ──────────────────────────────────────────────────────
    if (_eHeld && nearestMine && nearestDist <= DISARM_RADIUS) {
      _disarmTarget = nearestMine;
      _disarmTimer += dt;

      if (_disarmBarEl) _disarmBarEl.style.display = 'block';
      var fill = document.getElementById('msw-bar-fill');
      if (fill) {
        fill.style.width = Math.min(100, (_disarmTimer / DISARM_TIME) * 100) + '%';
      }

      if (_disarmTimer >= DISARM_TIME) {
        // Defuse!
        _removeMine(_disarmTarget);
        _addScore(500);
        _showToast('MINE DEFUSED +500');
        _disarmTimer = 0;
        _disarmTarget = null;
        if (_disarmBarEl) _disarmBarEl.style.display = 'none';
        var fill2 = document.getElementById('msw-bar-fill');
        if (fill2) fill2.style.width = '0%';
        // Beep success
        _beep(1200, 0.15, 0.4);
        setTimeout(function () { _beep(1500, 0.15, 0.4); }, 180);
      }
    } else {
      // Reset disarm if E released or moved away
      if (_disarmTimer > 0) {
        _disarmTimer = 0;
        _disarmTarget = null;
        if (_disarmBarEl) _disarmBarEl.style.display = 'none';
        var fill3 = document.getElementById('msw-bar-fill');
        if (fill3) fill3.style.width = '0%';
      }
    }
  }

  // ── Toggle ─────────────────────────────────────────────────────────────
  function toggle() {
    if (_toolCount <= 0) {
      _showToast('NO MINE SWEEPER TOOL');
      return;
    }
    _active = !_active;
    if (_hudEl) _hudEl.style.display = _active ? 'block' : 'none';
    if (!_active) {
      _arrowEl.style.display = 'none';
      _disarmBarEl.style.display = 'none';
      _clearGlowLights();
    }
    _showToast(_active ? 'MINE SWEEPER: ON' : 'MINE SWEEPER: OFF');
  }

  // ── Init ──────────────────────────────────────────────────────────────
  function init(scene, camera) {
    if (_initialized) return;
    _scene = scene || window._gameScene;
    _camera = camera || window._camera;

    _createHUD();

    document.addEventListener('keydown', function (e) {
      if (e.repeat) return;
      if (e.code === 'KeyM') {
        toggle();
      }
      if (e.code === 'KeyE') {
        _eHeld = true;
      }
    });

    document.addEventListener('keyup', function (e) {
      if (e.code === 'KeyE') {
        _eHeld = false;
      }
    });

    _initialized = true;
  }

  // ── Reset ─────────────────────────────────────────────────────────────
  function reset() {
    _active = false;
    _eHeld = false;
    _disarmTimer = 0;
    _disarmTarget = null;
    _beepTimer = 0;
    _nearMissWarnTimer = 0;
    _nearMissFlashTimer = 0;
    _toolCount = 1;
    _clearGlowLights();
    if (_hudEl) _hudEl.style.display = 'none';
    if (_arrowEl) _arrowEl.style.display = 'none';
    if (_disarmBarEl) _disarmBarEl.style.display = 'none';
    if (_nearMissEl) _nearMissEl.style.display = 'none';
  }

  // ── Public API ────────────────────────────────────────────────────────
  return {
    init: init,
    update: update,
    toggle: toggle,
    reset: reset,
    addTool: function () { _toolCount++; },
    isActive: function () { return _active; }
  };

}());
