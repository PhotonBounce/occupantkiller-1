/* ───────────────────────────────────────────────────────────────────────
   OXYGEN SYSTEM — Underwater breath management
   Detects when the player is submerged (position.y < window._waterLevel),
   depletes a 30-second oxygen meter, applies screen tint, bubble particles,
   drowning damage, and muffled audio while underwater.
   Exports: window.OxygenSystem  { init, update, reset }
   Readable globals: window._oxygenLevel (0-30), window._isUnderwater
   ─────────────────────────────────────────────────────────────────────── */

window.OxygenSystem = (function () {
  'use strict';

  /* ── Constants ───────────────────────────────────────────────────── */
  var MAX_OXYGEN        = 30;
  var DEPLETE_RATE      = 1;
  var REFILL_RATE       = 4;
  var DROWN_DAMAGE      = 5;
  var LOW_OXYGEN_THRESH = 10;
  var GAS_MASK_BONUS    = 20;
  var BUBBLE_INTERVAL   = 0.18;
  var MAX_BUBBLES       = 30;
  var SPEED_FACTOR      = 0.6;

  /* ── State ───────────────────────────────────────────────────────── */
  var _scene          = null;
  var _camera         = null;
  var _oxygen         = MAX_OXYGEN;
  var _isUnderwater   = false;
  var _wasUnderwater  = false;
  var _bubbleTimer    = 0;
  var _bubbles        = [];
  var _drownAccum     = 0;
  var _gasMaskApplied = false;
  var _flashTimer     = 0;

  /* ── DOM Elements ────────────────────────────────────────────────── */
  var _barContainer = null;
  var _barFill      = null;
  var _barLabel     = null;
  var _screenTint   = null;

  /* ── Audio ───────────────────────────────────────────────────────── */
  var _audioCtx    = null;
  var _lowpassNode = null;
  var _ambientOsc  = null;
  var _ambientGain = null;
  var _audioInited = false;

  /* ── Bubble geometry cache ───────────────────────────────────────── */
  var _bubbleGeo = null;
  var _bubbleMat = null;

  /* ────────────────────────────────────────────────────────────────── */
  /*  DOM setup                                                         */
  /* ────────────────────────────────────────────────────────────────── */
  function _createHUD() {
    _screenTint = document.createElement('div');
    _screenTint.id = 'oxygen-screen-tint';
    _screenTint.style.cssText = [
      'position:fixed', 'top:0', 'left:0', 'right:0', 'bottom:0',
      'pointer-events:none', 'z-index:197', 'display:none',
      'transition:opacity 0.4s'
    ].join(';');
    document.body.appendChild(_screenTint);

    _barContainer = document.createElement('div');
    _barContainer.id = 'oxygen-bar-container';
    _barContainer.style.cssText = [
      'position:fixed', 'bottom:80px', 'left:50%',
      'transform:translateX(-50%)', 'width:160px',
      'background:rgba(0,0,0,0.45)',
      'border:1px solid rgba(0,150,255,0.45)',
      'border-radius:4px', 'z-index:201', 'pointer-events:none',
      'display:none', 'overflow:hidden', 'font-family:monospace'
    ].join(';');

    _barLabel = document.createElement('div');
    _barLabel.style.cssText = [
      'font-size:9px', 'color:#88ccff', 'letter-spacing:1px',
      'text-align:center', 'padding:2px 0 0', 'line-height:1'
    ].join(';');
    _barLabel.textContent = 'OXYGEN';
    _barContainer.appendChild(_barLabel);

    var track = document.createElement('div');
    track.style.cssText = [
      'width:calc(100% - 8px)', 'height:6px',
      'background:rgba(0,0,0,0.4)', 'border-radius:3px',
      'margin:3px 4px 4px', 'overflow:hidden'
    ].join(';');

    _barFill = document.createElement('div');
    _barFill.style.cssText = [
      'width:100%', 'height:100%',
      'background:linear-gradient(90deg,#0077ff,#00ccff)',
      'border-radius:3px', 'transition:width 0.2s'
    ].join(';');
    track.appendChild(_barFill);
    _barContainer.appendChild(track);
    document.body.appendChild(_barContainer);
  }

  /* ────────────────────────────────────────────────────────────────── */
  /*  Audio                                                             */
  /* ────────────────────────────────────────────────────────────────── */
  function _initAudio() {
    if (_audioInited) return;
    try {
      var ACtx = window.AudioContext || window.webkitAudioContext;
      if (!ACtx) return;
      _audioCtx = new ACtx();

      _lowpassNode = _audioCtx.createBiquadFilter();
      _lowpassNode.type = 'lowpass';
      _lowpassNode.frequency.value = 20000;
      _lowpassNode.connect(_audioCtx.destination);

      _ambientGain = _audioCtx.createGain();
      _ambientGain.gain.value = 0;
      _ambientGain.connect(_lowpassNode);

      _ambientOsc = _audioCtx.createOscillator();
      _ambientOsc.type = 'sine';
      _ambientOsc.frequency.value = 80;
      _ambientOsc.connect(_ambientGain);
      _ambientOsc.start();

      _audioInited = true;
    } catch (e) {}
  }

  function _setUnderwaterAudio(underwater) {
    if (!_audioInited || !_audioCtx) return;
    try {
      if (_audioCtx.state === 'suspended') _audioCtx.resume();
      var now = _audioCtx.currentTime;
      if (underwater) {
        _lowpassNode.frequency.setTargetAtTime(400, now, 0.3);
        _ambientGain.gain.setTargetAtTime(0.07, now, 0.5);
      } else {
        _lowpassNode.frequency.setTargetAtTime(20000, now, 0.3);
        _ambientGain.gain.setTargetAtTime(0, now, 0.3);
      }
    } catch (e) {}
  }

  function _playGasp() {
    if (!_audioInited || !_audioCtx) return;
    try {
      if (_audioCtx.state === 'suspended') _audioCtx.resume();
      var osc = _audioCtx.createOscillator();
      var env = _audioCtx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.value = 260;
      env.gain.value = 0.15;
      osc.connect(env);
      env.connect(_audioCtx.destination);
      var now = _audioCtx.currentTime;
      osc.frequency.setValueAtTime(260, now);
      osc.frequency.exponentialRampToValueAtTime(520, now + 0.04);
      osc.frequency.exponentialRampToValueAtTime(200, now + 0.18);
      env.gain.setValueAtTime(0.15, now);
      env.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);
      osc.start(now);
      osc.stop(now + 0.25);
    } catch (e) {}
  }

  /* ────────────────────────────────────────────────────────────────── */
  /*  Bubble particles                                                  */
  /* ────────────────────────────────────────────────────────────────── */
  function _getBubbleGeo() {
    if (!_bubbleGeo) _bubbleGeo = new THREE.SphereGeometry(0.04, 4, 4);
    return _bubbleGeo;
  }

  function _getBubbleMat() {
    if (!_bubbleMat) {
      _bubbleMat = new THREE.MeshBasicMaterial({
        color: 0x88ddff, transparent: true, opacity: 0.55, depthWrite: false
      });
    }
    return _bubbleMat;
  }

  function _spawnBubble() {
    if (!_scene || _bubbles.length >= MAX_BUBBLES) return;
    var player = window.player;
    if (!player || !player.position) return;
    var mesh = new THREE.Mesh(_getBubbleGeo(), _getBubbleMat());
    mesh.position.set(
      player.position.x + (Math.random() - 0.5) * 0.4,
      player.position.y + (Math.random() * 0.6),
      player.position.z + (Math.random() - 0.5) * 0.4
    );
    mesh._life    = 0;
    mesh._maxLife = 1.2 + Math.random() * 1.4;
    mesh._vx      = (Math.random() - 0.5) * 0.015;
    mesh._vz      = (Math.random() - 0.5) * 0.015;
    mesh._vy      = 0.5 + Math.random() * 0.6;
    _scene.add(mesh);
    _bubbles.push(mesh);
  }

  function _updateBubbles(dt) {
    for (var i = _bubbles.length - 1; i >= 0; i--) {
      var b = _bubbles[i];
      b._life += dt;
      b.position.x += b._vx;
      b.position.y += b._vy * dt;
      b.position.z += b._vz;
      var t = b._life / b._maxLife;
      if (t > 0.7) b.material.opacity = 0.55 * (1 - (t - 0.7) / 0.3);
      if (b._life >= b._maxLife) {
        _scene.remove(b);
        _bubbles.splice(i, 1);
      }
    }
  }

  function _clearBubbles() {
    for (var i = 0; i < _bubbles.length; i++) {
      if (_scene) _scene.remove(_bubbles[i]);
    }
    _bubbles.length = 0;
  }

  /* ────────────────────────────────────────────────────────────────── */
  /*  HUD update                                                        */
  /* ────────────────────────────────────────────────────────────────── */
  function _updateHUD(dt) {
    if (!_barContainer || !_barFill) return;
    var pct   = Math.max(0, Math.min(1, _oxygen / MAX_OXYGEN));
    var isLow = _oxygen < LOW_OXYGEN_THRESH;

    _barContainer.style.display =
      (_isUnderwater || _oxygen < MAX_OXYGEN) ? 'block' : 'none';

    _barFill.style.width = (pct * 100).toFixed(1) + '%';

    if (isLow) {
      _flashTimer += dt;
      var flashOn = Math.sin(_flashTimer * Math.PI * 3) > 0;
      _barFill.style.background = flashOn
        ? 'linear-gradient(90deg,#ff2200,#ff6600)'
        : 'linear-gradient(90deg,#660000,#aa2200)';
      if (_barLabel) _barLabel.style.color = flashOn ? '#ff4444' : '#aa2222';
    } else {
      _flashTimer = 0;
      _barFill.style.background = 'linear-gradient(90deg,#0077ff,#00ccff)';
      if (_barLabel) _barLabel.style.color = '#88ccff';
    }
  }

  /* ────────────────────────────────────────────────────────────────── */
  /*  Screen tint                                                       */
  /* ────────────────────────────────────────────────────────────────── */
  function _applyScreenTint(underwater) {
    var canvas = document.querySelector('canvas');
    if (canvas) {
      canvas.style.transition = 'filter 0.5s';
      canvas.style.filter = underwater ? 'hue-rotate(180deg) saturate(0.6)' : '';
    }
    if (_screenTint) _screenTint.style.display = underwater ? 'block' : 'none';
  }

  /* ────────────────────────────────────────────────────────────────── */
  /*  Speed hook                                                        */
  /* ────────────────────────────────────────────────────────────────── */
  function _applySpeedModifier(underwater) {
    window._underwaterSpeedFactor = underwater ? SPEED_FACTOR : 1.0;
  }

  /* ────────────────────────────────────────────────────────────────── */
  /*  Gas mask pickup                                                   */
  /* ────────────────────────────────────────────────────────────────── */
  function _checkGasMask() {
    if (window._hasGasMask && !_gasMaskApplied) {
      _oxygen = Math.min(MAX_OXYGEN + GAS_MASK_BONUS, _oxygen + GAS_MASK_BONUS);
      _gasMaskApplied = true;
    }
    if (!window._hasGasMask) _gasMaskApplied = false;
  }

  /* ────────────────────────────────────────────────────────────────── */
  /*  Drowning damage                                                   */
  /* ────────────────────────────────────────────────────────────────── */
  function _applyDrownDamage(dt) {
    _drownAccum += dt;
    if (_drownAccum >= 1) {
      _drownAccum -= 1;
      if (typeof GameManager !== 'undefined' && GameManager.takeDamage) {
        GameManager.takeDamage(DROWN_DAMAGE, 'drown');
      } else if (window.player && typeof window.player.hp !== 'undefined') {
        window.player.hp = Math.max(0, window.player.hp - DROWN_DAMAGE);
      } else if (typeof window._playerHealth !== 'undefined') {
        window._playerHealth = Math.max(0, window._playerHealth - DROWN_DAMAGE);
      }
    }
  }

  /* ────────────────────────────────────────────────────────────────── */
  /*  Public: init                                                      */
  /* ────────────────────────────────────────────────────────────────── */
  function init(scene, camera) {
    _scene  = scene  || null;
    _camera = camera || null;

    _oxygen         = MAX_OXYGEN;
    _isUnderwater   = false;
    _wasUnderwater  = false;
    _drownAccum     = 0;
    _flashTimer     = 0;
    _gasMaskApplied = false;

    window._oxygenLevel           = _oxygen;
    window._isUnderwater          = false;
    window._underwaterSpeedFactor = 1.0;
    if (typeof window._waterLevel === 'undefined') window._waterLevel = -2;

    _createHUD();
    _initAudio();
  }

  /* ────────────────────────────────────────────────────────────────── */
  /*  Public: update  (dt in seconds)                                   */
  /* ────────────────────────────────────────────────────────────────── */
  function update(dt) {
    if (!dt || dt <= 0) return;
    if (dt > 0.5) dt = 0.5;

    var player     = window.player;
    var waterLevel = (typeof window._waterLevel !== 'undefined') ? window._waterLevel : -2;
    var playerY    = (player && player.position) ? player.position.y : 0;
    _isUnderwater  = playerY < waterLevel;

    if (_wasUnderwater && !_isUnderwater) {
      _playGasp();
      _clearBubbles();
    }

    if (_isUnderwater !== _wasUnderwater) {
      _setUnderwaterAudio(_isUnderwater);
      _applyScreenTint(_isUnderwater);
      _applySpeedModifier(_isUnderwater);
    }

    _checkGasMask();

    if (_isUnderwater) {
      _oxygen -= DEPLETE_RATE * dt;
      if (_oxygen < 0) {
        _oxygen = 0;
        _applyDrownDamage(dt);
      }
      _bubbleTimer += dt;
      if (_bubbleTimer >= BUBBLE_INTERVAL) {
        _bubbleTimer -= BUBBLE_INTERVAL;
        _spawnBubble();
      }
    } else {
      _drownAccum = 0;
      if (_oxygen < MAX_OXYGEN) _oxygen = Math.min(MAX_OXYGEN, _oxygen + REFILL_RATE * dt);
    }

    _updateBubbles(dt);
    _updateHUD(dt);

    window._oxygenLevel  = _oxygen;
    window._isUnderwater = _isUnderwater;
    _wasUnderwater       = _isUnderwater;
  }

  /* ────────────────────────────────────────────────────────────────── */
  /*  Public: reset                                                     */
  /* ────────────────────────────────────────────────────────────────── */
  function reset() {
    _oxygen         = MAX_OXYGEN;
    _isUnderwater   = false;
    _wasUnderwater  = false;
    _drownAccum     = 0;
    _flashTimer     = 0;
    _gasMaskApplied = false;
    _bubbleTimer    = 0;

    window._oxygenLevel           = _oxygen;
    window._isUnderwater          = false;
    window._underwaterSpeedFactor = 1.0;

    _clearBubbles();
    _applyScreenTint(false);
    _applySpeedModifier(false);
    _setUnderwaterAudio(false);

    if (_barContainer) _barContainer.style.display = 'none';
  }

  /* ── Public API ──────────────────────────────────────────────────── */
  return { init: init, update: update, reset: reset };

}());
