/**
 * night-vision-gen3.js
 * Night Vision Goggles system — Gen 1 / 2 / 3 upgradeable
 * Toggle key: Alt+N (N and Shift+N are already bound in game-manager.js)
 * Generations unlocked via upgrade() from "NV UPGRADE" world pickups.
 */
window.NightVisionGen3 = (function() {
  'use strict';

  // ── State ─────────────────────────────────────────────────────────────────
  var _active      = false;
  var _currentGen  = 1;          // 1, 2, or 3
  var _battery     = 100;        // 0-100 %
  var _maxGen      = 1;          // highest gen unlocked

  // Drain rates % per second
  var DRAIN_RATE = { 1: 0.8, 2: 0.6, 3: 0.4 };

  // CSS filter per generation
  var FILTERS = {
    1: 'brightness(2.5) contrast(1.5) hue-rotate(100deg) saturate(4)',
    2: 'brightness(3)   contrast(2)   hue-rotate(110deg) saturate(5)',
    3: 'brightness(3.5) contrast(2.5) hue-rotate(115deg) saturate(6)'
  };

  // Grain opacity per generation
  var GRAIN_OPACITY = { 1: 0.30, 2: 0.15, 3: 0.05 };

  // ── DOM overlay references ────────────────────────────────────────────────
  var _filterTarget  = null;   // the canvas / element we apply CSS filter to
  var _hudEl         = null;   // goggles frame SVG overlay
  var _hudBatteryEl  = null;   // battery text element
  var _hudGenEl      = null;   // gen label element
  var _grainCanvas   = null;   // 120×120 noise canvas
  var _grainCtx      = null;
  var _grainEl       = null;   // stretched full-viewport div containing canvas
  var _bloomEl       = null;   // Gen2/3 bloom glow overlay div
  var _audioCtx      = null;   // Web AudioContext
  var _oscillator    = null;   // hum oscillator kept alive while NV on

  // ── Gen 3 enemy highlight tracking ───────────────────────────────────────
  var _highlightedMeshes = [];  // { mesh, origEmissive, origEmissiveIntensity }

  // ── Audio helpers ─────────────────────────────────────────────────────────
  function _getAudioCtx() {
    if (!_audioCtx) {
      try { _audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { /* silent */ }
    }
    return _audioCtx;
  }

  function _playOnSound() {
    var ctx = _getAudioCtx();
    if (!ctx) return;
    // Electronic hum: 60 Hz oscillator with 1s gain ramp-in
    if (_oscillator) { try { _oscillator.stop(); } catch (e) {} _oscillator = null; }
    var osc  = ctx.createOscillator();
    var gain = ctx.createGain();
    osc.type      = 'sine';
    osc.frequency.setValueAtTime(60, ctx.currentTime);
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 1.0);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    _oscillator = osc;
  }

  function _playOffSound() {
    var ctx = _getAudioCtx();
    // Stop hum
    if (_oscillator) {
      var gain = ctx.createGain();
      _oscillator.connect(gain);
      gain.connect(ctx.destination);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.15);
      try { _oscillator.stop(ctx.currentTime + 0.2); } catch (e) {}
      _oscillator = null;
    }
    if (!ctx) return;
    // Electronic pop
    var popBuf = ctx.createBuffer(1, ctx.sampleRate * 0.05, ctx.sampleRate);
    var data   = popBuf.getChannelData(0);
    for (var i = 0; i < data.length; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
    }
    var src  = ctx.createBufferSource();
    var gPop = ctx.createGain();
    src.buffer = popBuf;
    gPop.gain.setValueAtTime(0.25, ctx.currentTime);
    gPop.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.05);
    src.connect(gPop);
    gPop.connect(ctx.destination);
    src.start();
  }

  // ── DOM creation ──────────────────────────────────────────────────────────
  function _ensureOverlays() {
    if (_hudEl) return;

    // Locate canvas / renderer element to apply filter
    _filterTarget = document.getElementById('c') || document.querySelector('canvas');

    // Goggles frame SVG (two overlapping circles, green border)
    _hudEl = document.createElement('div');
    _hudEl.id = 'nvg3-frame';
    _hudEl.style.cssText = [
      'position:fixed;top:0;left:0;width:100%;height:100%;',
      'pointer-events:none;z-index:7100;display:none;'
    ].join('');
    _hudEl.innerHTML = [
      '<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%"',
      '     viewBox="0 0 800 600" preserveAspectRatio="xMidYMid meet"',
      '     style="position:absolute;top:0;left:0;width:100%;height:100%;">',
      '  <!-- Vignette / black frame -->',
      '  <defs>',
      '    <mask id="nvg3-lens-mask">',
      '      <rect width="800" height="600" fill="white"/>',
      '      <circle cx="270" cy="300" r="175" fill="black"/>',
      '      <circle cx="530" cy="300" r="175" fill="black"/>',
      '    </mask>',
      '    <mask id="nvg3-inner-mask">',
      '      <rect width="800" height="600" fill="black"/>',
      '      <circle cx="270" cy="300" r="175" fill="white"/>',
      '      <circle cx="530" cy="300" r="175" fill="white"/>',
      '    </mask>',
      '  </defs>',
      '  <!-- Black surround -->',
      '  <rect width="800" height="600" fill="rgba(0,0,0,0.82)" mask="url(#nvg3-lens-mask)"/>',
      '  <!-- Green circle borders -->',
      '  <circle cx="270" cy="300" r="175" fill="none" stroke="#00ff55" stroke-width="3" opacity="0.85"/>',
      '  <circle cx="530" cy="300" r="175" fill="none" stroke="#00ff55" stroke-width="3" opacity="0.85"/>',
      '  <!-- Bridge -->',
      '  <line x1="445" y1="295" x2="355" y2="295" stroke="#00ff55" stroke-width="2.5" opacity="0.7"/>',
      '</svg>'
    ].join('');
    document.body.appendChild(_hudEl);

    // Battery + gen HUD text (inside the goggles area, bottom-left)
    _hudBatteryEl = document.createElement('div');
    _hudBatteryEl.id = 'nvg3-battery';
    _hudBatteryEl.style.cssText = [
      'position:fixed;bottom:18px;left:20px;',
      'font-family:monospace;font-size:13px;color:#00ff44;',
      'text-shadow:0 0 6px #00ff44;pointer-events:none;z-index:7102;display:none;'
    ].join('');
    document.body.appendChild(_hudBatteryEl);

    _hudGenEl = document.createElement('div');
    _hudGenEl.id = 'nvg3-gen';
    _hudGenEl.style.cssText = [
      'position:fixed;bottom:34px;left:20px;',
      'font-family:monospace;font-size:11px;color:#00cc33;',
      'text-shadow:0 0 5px #00cc33;pointer-events:none;z-index:7102;display:none;'
    ].join('');
    document.body.appendChild(_hudGenEl);

    // Grain canvas overlay
    _grainEl = document.createElement('div');
    _grainEl.id = 'nvg3-grain';
    _grainEl.style.cssText = [
      'position:fixed;top:0;left:0;width:100%;height:100%;',
      'pointer-events:none;z-index:7101;display:none;',
      'image-rendering:pixelated;'
    ].join('');

    _grainCanvas = document.createElement('canvas');
    _grainCanvas.width  = 120;
    _grainCanvas.height = 120;
    _grainCanvas.style.cssText = 'width:100%;height:100%;display:block;';
    _grainCtx = _grainCanvas.getContext('2d');
    _grainEl.appendChild(_grainCanvas);
    document.body.appendChild(_grainEl);

    // Bloom overlay for Gen 2+
    _bloomEl = document.createElement('div');
    _bloomEl.id = 'nvg3-bloom';
    _bloomEl.style.cssText = [
      'position:fixed;top:0;left:0;width:100%;height:100%;',
      'pointer-events:none;z-index:7099;display:none;',
      'background:radial-gradient(ellipse at 60% 35%, rgba(0,255,80,0.07) 0%, transparent 60%),',
      'radial-gradient(ellipse at 30% 60%, rgba(0,255,80,0.05) 0%, transparent 55%);',
      'mix-blend-mode:screen;'
    ].join('');
    document.body.appendChild(_bloomEl);
  }

  // ── Grain rendering ───────────────────────────────────────────────────────
  function _drawGrain(opacity) {
    if (!_grainCtx) return;
    var w = 120, h = 120;
    _grainCtx.clearRect(0, 0, w, h);
    _grainCtx.fillStyle = 'rgba(0,0,0,0)';
    _grainCtx.fillRect(0, 0, w, h);
    // Random green-ish noise dots
    var dotCount = Math.floor(w * h * 0.08); // ~8 % of pixels
    for (var i = 0; i < dotCount; i++) {
      var x = Math.random() * w | 0;
      var y = Math.random() * h | 0;
      var brightness = (Math.random() * 200 + 55) | 0;
      _grainCtx.fillStyle = 'rgba(0,' + brightness + ',30,' + opacity.toFixed(2) + ')';
      _grainCtx.fillRect(x, y, 1, 1);
    }
  }

  // ── Battery HUD ───────────────────────────────────────────────────────────
  function _buildBatteryBar(pct) {
    var total  = 10;
    var filled = Math.round(pct / 100 * total);
    var bar    = '';
    for (var i = 0; i < total; i++) {
      bar += (i < filled) ? '█' : '░';
    }
    return 'NV: ' + bar + ' ' + Math.round(pct) + '%';
  }

  function _updateHUD() {
    if (!_hudBatteryEl) return;
    _hudBatteryEl.textContent = _buildBatteryBar(_battery);
    _hudGenEl.textContent     = 'GEN ' + _currentGen;
  }

  // ── Gen 3 enemy highlights ────────────────────────────────────────────────
  function _nvHighlightEnemies() {
    _nvClearEnemyHighlights();
    if (typeof window.Enemies === 'undefined' || !window.Enemies.getAll) return;
    var all = window.Enemies.getAll();
    for (var i = 0; i < all.length; i++) {
      var e = all[i];
      if (!e || !e.alive) continue;
      // Traverse Three.js group/mesh
      var mesh = e.mesh || e.sprite || null;
      if (!mesh) continue;
      mesh.traverse(function(obj) {
        if (obj.isMesh && obj.material) {
          var mats = Array.isArray(obj.material) ? obj.material : [obj.material];
          for (var m = 0; m < mats.length; m++) {
            var mat = mats[m];
            if (mat.emissive !== undefined) {
              _highlightedMeshes.push({
                mat:          mat,
                origEmissive: mat.emissive.clone(),
                origIntensity: mat.emissiveIntensity
              });
              mat.emissive.setHex(0x00ff44);
              mat.emissiveIntensity = 0.4;
            }
          }
        }
      });
    }
  }

  function _nvClearEnemyHighlights() {
    for (var i = 0; i < _highlightedMeshes.length; i++) {
      var entry = _highlightedMeshes[i];
      entry.mat.emissive.copy(entry.origEmissive);
      entry.mat.emissiveIntensity = entry.origIntensity;
    }
    _highlightedMeshes = [];
  }

  // ── Apply / remove visual effect ──────────────────────────────────────────
  function _applyEffect() {
    var target = _filterTarget || document.getElementById('c') || document.querySelector('canvas');
    if (target) target.style.filter = FILTERS[_currentGen];

    _hudEl.style.display        = '';
    _hudBatteryEl.style.display = '';
    _hudGenEl.style.display     = '';
    _grainEl.style.display      = '';
    _grainEl.style.opacity      = String(GRAIN_OPACITY[_currentGen]);

    if (_currentGen >= 2) {
      _bloomEl.style.display = '';
    } else {
      _bloomEl.style.display = 'none';
    }

    _updateHUD();

    if (_currentGen === 3) {
      _nvHighlightEnemies();
    }
  }

  function _removeEffect() {
    var target = _filterTarget || document.getElementById('c') || document.querySelector('canvas');
    if (target) target.style.filter = '';

    if (_hudEl)         _hudEl.style.display        = 'none';
    if (_hudBatteryEl)  _hudBatteryEl.style.display  = 'none';
    if (_hudGenEl)      _hudGenEl.style.display       = 'none';
    if (_grainEl)       _grainEl.style.display        = 'none';
    if (_bloomEl)       _bloomEl.style.display        = 'none';

    _nvClearEnemyHighlights();
  }

  // ── Key listener ──────────────────────────────────────────────────────────
  function _onKey(e) {
    if (e.code === 'KeyN' && e.altKey && !e.ctrlKey) {
      e.preventDefault();
      toggle();
    }
  }

  // ── Public API ────────────────────────────────────────────────────────────
  function init() {
    _ensureOverlays();
    document.addEventListener('keydown', _onKey);
  }

  function toggle() {
    if (_battery <= 0 && !_active) {
      if (typeof HUD !== 'undefined' && HUD.notifyPickup) {
        HUD.notifyPickup('NV BATTERY DEAD', '#ff4422');
      }
      return;
    }
    _active = !_active;
    if (_active) {
      _playOnSound();
      _applyEffect();
      if (typeof HUD !== 'undefined' && HUD.notifyPickup) {
        HUD.notifyPickup('NVG GEN ' + _currentGen + ' ON — Alt+N', '#00ff44');
      }
    } else {
      _playOffSound();
      _removeEffect();
      if (typeof HUD !== 'undefined' && HUD.notifyPickup) {
        HUD.notifyPickup('NVG OFF', '#888888');
      }
    }
  }

  /**
   * update(dt) — called each frame by game-manager / render loop.
   * dt: seconds elapsed since last frame.
   */
  function update(dt) {
    if (!_active) return;

    // Battery drain
    _battery -= DRAIN_RATE[_currentGen] * dt;
    if (_battery < 0) _battery = 0;

    // Grain update each frame
    _drawGrain(GRAIN_OPACITY[_currentGen]);

    // Gen 3: refresh enemy highlights each frame (enemies may move / spawn)
    if (_currentGen === 3) {
      _nvHighlightEnemies();
    }

    // Update HUD
    _updateHUD();

    // Auto-off when battery dead
    if (_battery <= 0) {
      _active  = false;
      _removeEffect();
      if (typeof HUD !== 'undefined' && HUD.notifyPickup) {
        HUD.notifyPickup('NVG BATTERY DEPLETED', '#ff4422');
      }
    }
  }

  /**
   * upgrade() — advance to the next generation (called when player picks up
   *   an "NV UPGRADE" item in the world).
   */
  function upgrade() {
    if (_maxGen >= 3) {
      if (typeof HUD !== 'undefined' && HUD.notifyPickup) {
        HUD.notifyPickup('NVG ALREADY AT GEN 3', '#00ff44');
      }
      return;
    }
    _maxGen++;
    _currentGen = _maxGen;
    if (typeof HUD !== 'undefined' && HUD.notifyPickup) {
      HUD.notifyPickup('NVG UPGRADED TO GEN ' + _currentGen + '!', '#00ffaa');
    }
    // If currently active, re-apply with new gen settings
    if (_active) {
      _applyEffect();
    }
  }

  /**
   * addBattery(amount) — called when player picks up an "NV BATTERY" item.
   *   amount: percentage points to restore (default 50).
   */
  function addBattery(amount) {
    var add = (typeof amount === 'number') ? amount : 50;
    _battery = Math.min(100, _battery + add);
    if (typeof HUD !== 'undefined' && HUD.notifyPickup) {
      HUD.notifyPickup('NV BATTERY +' + add + '%', '#00ff44');
    }
    _updateHUD();
  }

  /**
   * reset() — turn off NV and remove all overlays (called on level reset / death).
   */
  function reset() {
    _active = false;
    _removeEffect();
    _battery    = 100;
    _currentGen = 1;
    _maxGen     = 1;
    if (_oscillator) {
      try { _oscillator.stop(); } catch (e) {}
      _oscillator = null;
    }
  }

  // ── Battery pickup geometry helper (for world-builder) ───────────────────
  /**
   * createBatteryPickupMesh() — returns a THREE.js Mesh for the "NV BATTERY"
   *   world pickup: BoxGeometry(0.15, 0.1, 0.07), bright green MeshLambertMaterial.
   *   Caller is responsible for adding to scene and handling collision.
   */
  function createBatteryPickupMesh() {
    if (typeof THREE === 'undefined') return null;
    var geo = new THREE.BoxGeometry(0.15, 0.1, 0.07);
    var mat = new THREE.MeshLambertMaterial({ color: 0x00ff44, emissive: 0x003300, emissiveIntensity: 0.5 });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.userData.nvBatteryPickup = true;
    return mesh;
  }

  return {
    init:                   init,
    update:                 update,
    toggle:                 toggle,
    upgrade:                upgrade,
    addBattery:             addBattery,
    reset:                  reset,
    createBatteryPickupMesh: createBatteryPickupMesh
  };
})();
