/**
 * grenade-cooking.js — Hold G to cook grenade fuse for precise timing.
 *
 * Integration:
 *   • GrenadeSelector handles the G-key radial wheel (hold G opens wheel).
 *   • This module watches for the wheel-open state and, once it detects the
 *     player is holding G with the wheel visible, begins the cook sequence.
 *   • Release G OR left-click while cooking → throw with remaining fuse time.
 *   • Fuse hits 0 → self-detonation (80 damage, "COOKED IT!" text).
 *
 * Exported globals (readable by other modules):
 *   window._cookingGrenade        {boolean}
 *   window._grenadefuseRemaining  {number}  seconds remaining on fuse (0-4)
 */
window.GrenadeCooking = (function () {
  'use strict';

  // ─── Constants ────────────────────────────────────────────────────────────
  var FUSE_DURATION     = 4.0;   // seconds — full grenade fuse
  var DANGER_THRESHOLD  = 0.8;   // seconds remaining → "DANGER!" warning
  var THROWBACK_RADIUS  = 1.5;   // units — distance for enemy throw-back
  var THROWBACK_CHANCE  = 0.25;  // 25 % probability
  var SELF_DAMAGE       = 80;    // HP lost on cook-off
  var PITCH_BASE        = 2000;  // Hz — base fuse hiss frequency
  var PITCH_MAX         = 3400;  // Hz — pitch at 0 s remaining

  // ─── State ────────────────────────────────────────────────────────────────
  var _scene          = null;
  var _camera         = null;
  var _enemies        = null;

  var _cooking        = false;   // currently cooking?
  var _fuseRemaining  = 0;       // seconds left
  var _cookStarted    = false;   // pin-pulled flag (to avoid re-triggering)

  // Three.js HUD objects
  var _handMesh       = null;    // hand grip group (bottom-right 3-D overlay)
  var _grenMesh       = null;    // grenade body inside hand group
  var _timerRing      = null;    // torus that fills around grenade

  // DOM elements
  var _hudEl          = null;    // wrapper div
  var _cookLabelEl    = null;    // "COOK: 3.2s"
  var _dangerEl       = null;    // "DANGER!" pulsing text
  var _cookedEl       = null;    // "COOKED IT!" red flash
  var _throwbackEl    = null;    // "THROW BACK!" notification

  // Audio nodes
  var _audioCtx       = null;
  var _hissOsc        = null;
  var _hissGain       = null;

  // Timers
  var _dangerPulseT   = 0;
  var _cookedTextT    = 0;
  var _throwbackTextT = 0;

  // Input
  var _gKeyDown       = false;
  var _wheelWasOpen   = false;   // edge-detect: wheel just opened

  // ─── Init ─────────────────────────────────────────────────────────────────
  function init(scene, camera, enemies) {
    _scene   = scene   || null;
    _camera  = camera  || null;
    _enemies = enemies || null;

    _buildHUD();
    _bindEvents();

    // Publish globals
    window._cookingGrenade       = false;
    window._grenadefuseRemaining = 0;
  }

  // ─── HUD construction ─────────────────────────────────────────────────────
  function _buildHUD() {
    // Remove stale HUD from a previous init call
    if (_hudEl && _hudEl.parentNode) {
      _hudEl.parentNode.removeChild(_hudEl);
    }

    _hudEl = document.createElement('div');
    _hudEl.id = 'gc-hud';
    _applyStyles(_hudEl, {
      position:      'fixed',
      right:         '120px',
      bottom:        '80px',
      width:         '96px',
      textAlign:     'center',
      pointerEvents: 'none',
      display:       'none',
      zIndex:        '9999',
      userSelect:    'none'
    });

    // Grenade icon (CSS circle as stand-in for real mesh)
    var iconEl = document.createElement('div');
    iconEl.id = 'gc-icon';
    _applyStyles(iconEl, {
      width:         '64px',
      height:        '64px',
      margin:        '0 auto 4px',
      borderRadius:  '50%',
      background:    'radial-gradient(circle at 38% 38%, #7a9a60, #3a4a28)',
      boxShadow:     '0 0 0 3px rgba(255,255,255,0.15), inset 0 2px 6px rgba(0,0,0,0.5)',
      position:      'relative',
      overflow:      'visible'
    });

    // Timer ring — SVG circle stroke as progress ring
    var svgNS = 'http://www.w3.org/2000/svg';
    var svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('width',  '80');
    svg.setAttribute('height', '80');
    _applyStyles(svg, {
      position: 'absolute',
      top:      '-8px',
      left:     '-8px',
      overflow: 'visible',
      zIndex:   '2'
    });

    var circBg = document.createElementNS(svgNS, 'circle');
    circBg.setAttribute('cx', '40');
    circBg.setAttribute('cy', '40');
    circBg.setAttribute('r',  '36');
    circBg.setAttribute('fill', 'none');
    circBg.setAttribute('stroke', 'rgba(255,255,255,0.12)');
    circBg.setAttribute('stroke-width', '4');
    svg.appendChild(circBg);

    _timerRing = document.createElementNS(svgNS, 'circle');
    _timerRing.setAttribute('cx', '40');
    _timerRing.setAttribute('cy', '40');
    _timerRing.setAttribute('r',  '36');
    _timerRing.setAttribute('fill',             'none');
    _timerRing.setAttribute('stroke',           '#ff4400');
    _timerRing.setAttribute('stroke-width',     '4');
    _timerRing.setAttribute('stroke-dasharray', String(2 * Math.PI * 36));
    _timerRing.setAttribute('stroke-dashoffset', String(2 * Math.PI * 36));
    _timerRing.setAttribute('transform',        'rotate(-90 40 40)');
    svg.appendChild(_timerRing);

    iconEl.appendChild(svg);
    _hudEl.appendChild(iconEl);

    // Cook timer label
    _cookLabelEl = document.createElement('div');
    _applyStyles(_cookLabelEl, {
      color:      '#fff',
      fontFamily: 'monospace',
      fontSize:   '14px',
      fontWeight: 'bold',
      marginTop:  '2px',
      textShadow: '0 1px 3px #000'
    });
    _cookLabelEl.textContent = 'COOK: 4.0s';
    _hudEl.appendChild(_cookLabelEl);

    // DANGER! label
    _dangerEl = document.createElement('div');
    _applyStyles(_dangerEl, {
      color:       '#ff2200',
      fontFamily:  'monospace',
      fontSize:    '16px',
      fontWeight:  'bold',
      marginTop:   '2px',
      textShadow:  '0 0 8px #ff0000',
      display:     'none'
    });
    _dangerEl.textContent = 'DANGER!';
    _hudEl.appendChild(_dangerEl);

    document.body.appendChild(_hudEl);

    // "COOKED IT!" full-screen flash
    _cookedEl = document.createElement('div');
    _applyStyles(_cookedEl, {
      position:      'fixed',
      top:           '40%',
      left:          '50%',
      transform:     'translateX(-50%)',
      color:         '#ff1100',
      fontFamily:    'monospace',
      fontSize:      '36px',
      fontWeight:    'bold',
      textShadow:    '0 0 20px #ff0000, 0 2px 4px #000',
      pointerEvents: 'none',
      display:       'none',
      zIndex:        '10000'
    });
    _cookedEl.textContent = 'COOKED IT!';
    document.body.appendChild(_cookedEl);

    // "THROW BACK!" notification
    _throwbackEl = document.createElement('div');
    _applyStyles(_throwbackEl, {
      position:      'fixed',
      top:           '35%',
      left:          '50%',
      transform:     'translateX(-50%)',
      color:         '#ffcc00',
      fontFamily:    'monospace',
      fontSize:      '22px',
      fontWeight:    'bold',
      textShadow:    '0 0 12px #ff8800, 0 2px 4px #000',
      pointerEvents: 'none',
      display:       'none',
      zIndex:        '10000'
    });
    _throwbackEl.textContent = 'THROW BACK!';
    document.body.appendChild(_throwbackEl);
  }

  function _applyStyles(el, styles) {
    var keys = Object.keys(styles);
    for (var i = 0; i < keys.length; i++) {
      el.style[keys[i]] = styles[keys[i]];
    }
  }

  // ─── Input binding ─────────────────────────────────────────────────────────
  function _bindEvents() {
    document.addEventListener('keydown', function (e) {
      if (e.code === 'KeyG' && !e.ctrlKey && !e.shiftKey && !e.altKey) {
        _gKeyDown = true;
      }
    });

    document.addEventListener('keyup', function (e) {
      if (e.code === 'KeyG') {
        _gKeyDown = false;
        if (_cooking) {
          _throwCooked();
        }
      }
    });

    // Left-click during cook → throw
    document.addEventListener('mousedown', function (e) {
      if (e.button === 0 && _cooking) {
        e.stopPropagation();
        _throwCooked();
      }
    }, true); // capture phase so we intercept before shoot handler
  }

  // ─── Cook lifecycle ────────────────────────────────────────────────────────
  function startCook() {
    if (_cooking) { return; }

    // Only cook FRAG grenades.  Check ammo via GrenadeSelector or game-manager player.
    var hasGrenade = _checkHasGrenade();
    if (!hasGrenade) { return; }

    _cooking       = true;
    _fuseRemaining = FUSE_DURATION;
    _cookStarted   = true;

    window._cookingGrenade       = true;
    window._grenadefuseRemaining = _fuseRemaining;

    _showHUD();
    _playPinPull();
    _startHiss();
  }

  function _checkHasGrenade() {
    // Try GrenadeSelector API first
    if (window.GrenadeSelector && typeof window.GrenadeSelector.getCount === 'function') {
      var type = window.GrenadeSelector.getSelectedType ? window.GrenadeSelector.getSelectedType() : 'FRAG';
      return window.GrenadeSelector.getCount(type) > 0;
    }
    // Fallback: game-manager player object
    if (window._player && window._player.grenades > 0) { return true; }
    if (window.player  && window.player.grenades  > 0) { return true; }
    // Last resort: assume yes (game-manager will veto on throw)
    return true;
  }

  function throwCookedGrenade() {
    _throwCooked();
  }

  function _throwCooked() {
    if (!_cooking) { return; }

    var remaining = _fuseRemaining;
    _endCook(false);

    // Deduct ammo
    _deductGrenade();

    // Emit a throw event other systems can listen to.
    // We attach fuse remaining so game-manager / grenade-selector can use it.
    var evt = new CustomEvent('gc:throw', {
      detail: {
        fuseRemaining: remaining,
        type:          'FRAG'
      }
    });
    document.dispatchEvent(evt);

    // If GrenadeSelector is present, delegate the throw to it so the
    // existing parabolic-arc + physics code is reused.
    if (window.GrenadeSelector && typeof window.GrenadeSelector.throwWithFuse === 'function') {
      window.GrenadeSelector.throwWithFuse('FRAG', remaining);
    } else {
      // Fallback: fire game-manager's throw (full fuse, best we can do without hook)
      _fallbackThrow(remaining);
    }

    // Trigger enemy throw-back logic against any live grenades nearby
    _checkEnemyThrowback(remaining);
  }

  function _selfDetonate() {
    _endCook(true);

    // Deal self damage
    if (typeof onPlayerHit === 'function') {
      onPlayerHit(SELF_DAMAGE, null);
    } else if (window._player) {
      window._player.health = Math.max(0, (window._player.health || 100) - SELF_DAMAGE);
    } else if (window.player) {
      window.player.health  = Math.max(0, (window.player.health  || 100) - SELF_DAMAGE);
    }

    // Explosion VFX at player position
    var pos = _getPlayerPos();
    if (pos) {
      if (window.Tracers && typeof window.Tracers.spawnExplosion === 'function') {
        window.Tracers.spawnExplosion(pos, 1.0);
      }
      if (window.CameraSystem && typeof window.CameraSystem.shake === 'function') {
        window.CameraSystem.shake(0.6, 0.5);
      }
      if (window.AudioSystem && typeof window.AudioSystem.playExplosion === 'function') {
        window.AudioSystem.playExplosion(0.9);
      }
    }

    // "COOKED IT!" text
    _cookedEl.style.display = 'block';
    _cookedTextT = 2.5;
  }

  function _endCook(selfKill) {
    _cooking      = false;
    _fuseRemaining = 0;

    window._cookingGrenade       = false;
    window._grenadefuseRemaining = 0;

    _hideHUD();
    _stopHiss();

    if (!selfKill) {
      _dangerEl.style.display = 'none';
    }
  }

  // ─── Update (called every frame with delta seconds) ─────────────────────
  function update(dt) {
    // Edge-detect: G held + wheel just opened → begin cook
    var wheelOpen = !!window._grenadeWheelOpen;
    if (_gKeyDown && wheelOpen && !_wheelWasOpen && !_cooking) {
      // G is being held and the wheel just became visible — start cook
      startCook();
    }
    _wheelWasOpen = wheelOpen;

    if (_cooking) {
      _fuseRemaining -= dt;
      window._grenadefuseRemaining = _fuseRemaining;

      if (_fuseRemaining <= 0) {
        _selfDetonate();
        return;
      }

      // Update HUD
      _updateHUD();

      // DANGER pulse
      if (_fuseRemaining <= DANGER_THRESHOLD) {
        _dangerEl.style.display = 'block';
        _dangerPulseT += dt;
        var pulse = Math.abs(Math.sin(_dangerPulseT * 8));
        _dangerEl.style.opacity = String(0.4 + pulse * 0.6);
      }

      // Pitch shift on hiss oscillator
      _updateHissPitch();
    }

    // Decay timed text
    if (_cookedTextT > 0) {
      _cookedTextT -= dt;
      if (_cookedTextT <= 0) {
        _cookedEl.style.display = 'none';
        _cookedTextT = 0;
      }
    }

    if (_throwbackTextT > 0) {
      _throwbackTextT -= dt;
      if (_throwbackTextT <= 0) {
        _throwbackEl.style.display = 'none';
        _throwbackTextT = 0;
      }
    }
  }

  // ─── HUD helpers ──────────────────────────────────────────────────────────
  function _showHUD() {
    _hudEl.style.display       = 'block';
    _dangerEl.style.display    = 'none';
    _dangerPulseT              = 0;
    _updateHUD();
  }

  function _hideHUD() {
    _hudEl.style.display       = 'none';
    _dangerEl.style.display    = 'none';
  }

  function _updateHUD() {
    var fuse = Math.max(0, _fuseRemaining);

    // Label
    _cookLabelEl.textContent = 'COOK: ' + fuse.toFixed(1) + 's';

    // Ring fill: fraction elapsed (0 → 1 as fuse burns)
    var circumference = 2 * Math.PI * 36;
    var elapsed = (FUSE_DURATION - fuse) / FUSE_DURATION;  // 0 at start, 1 at detonation
    var offset  = circumference * (1 - elapsed);
    _timerRing.setAttribute('stroke-dashoffset', String(offset));

    // Colour shift: green → yellow → red
    var r, g;
    if (elapsed < 0.5) {
      r = Math.round(elapsed * 2 * 255);
      g = 200;
    } else {
      r = 255;
      g = Math.round((1 - (elapsed - 0.5) * 2) * 200);
    }
    _timerRing.setAttribute('stroke', 'rgb(' + r + ',' + g + ',0)');
  }

  // ─── Audio helpers ────────────────────────────────────────────────────────
  function _getAudioCtx() {
    if (_audioCtx) { return _audioCtx; }
    if (window._audioCtx) { _audioCtx = window._audioCtx; return _audioCtx; }
    try {
      var Ctor = window.AudioContext || window.webkitAudioContext;
      if (Ctor) { _audioCtx = new Ctor(); window._audioCtx = _audioCtx; }
    } catch (e) { /* no audio */ }
    return _audioCtx;
  }

  function _playPinPull() {
    var ctx = _getAudioCtx();
    if (!ctx) { return; }

    // Short metallic "click" — two brief noise bursts
    try {
      var buf = ctx.createBuffer(1, ctx.sampleRate * 0.08, ctx.sampleRate);
      var data = buf.getChannelData(0);
      for (var i = 0; i < data.length; i++) {
        // Sharp click with exponential decay
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (data.length * 0.12));
      }
      var src = ctx.createBufferSource();
      src.buffer = buf;
      var filt = ctx.createBiquadFilter();
      filt.type      = 'bandpass';
      filt.frequency.value = 3500;
      filt.Q.value   = 3;
      var gain = ctx.createGain();
      gain.gain.value = 0.55;
      src.connect(filt);
      filt.connect(gain);
      gain.connect(ctx.destination);
      src.start();
    } catch (e) { /* ignore */ }
  }

  function _startHiss() {
    var ctx = _getAudioCtx();
    if (!ctx) { return; }
    _stopHiss();

    try {
      _hissOsc = ctx.createOscillator();
      _hissOsc.type = 'sawtooth';
      _hissOsc.frequency.value = PITCH_BASE;

      // Add a lowpass to soften the sawtooth into a hiss
      var filt = ctx.createBiquadFilter();
      filt.type = 'lowpass';
      filt.frequency.value = 2400;
      filt.Q.value = 1.2;

      _hissGain = ctx.createGain();
      _hissGain.gain.value = 0.07;

      _hissOsc.connect(filt);
      filt.connect(_hissGain);
      _hissGain.connect(ctx.destination);
      _hissOsc.start();
    } catch (e) {
      _hissOsc  = null;
      _hissGain = null;
    }
  }

  function _stopHiss() {
    if (_hissOsc) {
      try { _hissOsc.stop(); } catch (e) { /* already stopped */ }
      _hissOsc  = null;
      _hissGain = null;
    }
  }

  function _updateHissPitch() {
    if (!_hissOsc) { return; }
    var ctx = _getAudioCtx();
    if (!ctx) { return; }
    var t       = _fuseRemaining / FUSE_DURATION;   // 1 at start → 0 at detonation
    var pitch   = PITCH_BASE + (PITCH_MAX - PITCH_BASE) * (1 - t);
    var volume  = 0.07 + (1 - t) * 0.08;           // gets slightly louder
    try {
      _hissOsc.frequency.setTargetAtTime(pitch,  ctx.currentTime, 0.1);
      _hissGain.gain.setTargetAtTime(volume, ctx.currentTime, 0.1);
    } catch (e) { /* ignore */ }
  }

  // ─── Throw-back mechanic ───────────────────────────────────────────────────
  function _checkEnemyThrowback(fuseRemaining) {
    // Only dangerous if enemy can react (>1.5 s left)
    if (fuseRemaining <= 1.5) { return; }

    var enemies = _getEnemies();
    if (!enemies || enemies.length === 0) { return; }

    var playerPos = _getPlayerPos();
    if (!playerPos) { return; }

    for (var i = 0; i < enemies.length; i++) {
      var enemy = enemies[i];
      if (!enemy || (enemy.health !== undefined && enemy.health <= 0)) { continue; }
      var epos = enemy.position || (enemy.mesh && enemy.mesh.position);
      if (!epos) { continue; }

      var dx = epos.x - playerPos.x;
      var dy = epos.y - playerPos.y;
      var dz = epos.z - playerPos.z;
      var dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

      if (dist <= THROWBACK_RADIUS && Math.random() < THROWBACK_CHANCE) {
        // Enemy throws grenade back — deal splash damage to player immediately
        // (simplified: no arc simulation, just damage + notification)
        var throwbackDmg = 40;
        if (typeof onPlayerHit === 'function') {
          onPlayerHit(throwbackDmg, epos);
        } else if (window._player) {
          window._player.health = Math.max(0, (window._player.health || 100) - throwbackDmg);
        } else if (window.player) {
          window.player.health = Math.max(0, (window.player.health || 100) - throwbackDmg);
        }

        _throwbackEl.style.display = 'block';
        _throwbackTextT = 2.0;

        if (window.CameraSystem && typeof window.CameraSystem.shake === 'function') {
          window.CameraSystem.shake(0.25, 0.3);
        }
        break; // Only one enemy throws it back
      }
    }
  }

  // ─── Utility ───────────────────────────────────────────────────────────────
  function _getPlayerPos() {
    if (window._camera && window._camera.position) { return window._camera.position; }
    if (_camera && _camera.position)               { return _camera.position; }
    if (window._player && window._player.position) { return window._player.position; }
    if (window.player  && window.player.position)  { return window.player.position; }
    return null;
  }

  function _getEnemies() {
    if (_enemies) {
      if (typeof _enemies.getAll === 'function') { return _enemies.getAll(); }
      if (Array.isArray(_enemies))               { return _enemies; }
    }
    if (window.Enemies && typeof window.Enemies.getAll === 'function') {
      return window.Enemies.getAll();
    }
    if (window._enemies && Array.isArray(window._enemies)) { return window._enemies; }
    return [];
  }

  function _deductGrenade() {
    if (window.GrenadeSelector && typeof window.GrenadeSelector.useGrenade === 'function') {
      var type = window.GrenadeSelector.getSelectedType ? window.GrenadeSelector.getSelectedType() : 'FRAG';
      window.GrenadeSelector.useGrenade(type);
      return;
    }
    if (window._player && window._player.grenades > 0) { window._player.grenades--; }
    else if (window.player && window.player.grenades > 0) { window.player.grenades--; }
  }

  function _fallbackThrow(fuseRemaining) {
    // Best-effort: fire the game-manager throw function if available.
    // The fuse override is stored in a global that game-manager can read.
    window._grenadefuseRemaining = fuseRemaining;
    if (typeof throwHandGrenade === 'function') {
      try { throwHandGrenade(); } catch (e) { /* ignore */ }
    }
  }

  // ─── Reset ────────────────────────────────────────────────────────────────
  function reset() {
    _cooking       = false;
    _fuseRemaining = 0;
    _gKeyDown      = false;
    _wheelWasOpen  = false;
    _cookStarted   = false;
    _dangerPulseT  = 0;
    _cookedTextT   = 0;
    _throwbackTextT = 0;

    window._cookingGrenade       = false;
    window._grenadefuseRemaining = 0;

    _hideHUD();
    _stopHiss();

    if (_cookedEl)    { _cookedEl.style.display    = 'none'; }
    if (_throwbackEl) { _throwbackEl.style.display  = 'none'; }
  }

  // ─── Public API ────────────────────────────────────────────────────────────
  return {
    init:               init,
    update:             update,
    startCook:          startCook,
    throwCookedGrenade: throwCookedGrenade,
    reset:              reset
  };
}());
