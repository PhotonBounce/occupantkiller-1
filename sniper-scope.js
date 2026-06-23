/**
 * sniper-scope.js — Advanced Sniper Scope System
 * Three.js FPS game
 *
 * Full-screen SVG scope reticle, zoom levels, breathing sway,
 * breath hold, wind drift, range finder, heartbeat audio.
 *
 * IIFE pattern, all var (never let/const).
 * Exports: window.SniperScope
 */
window.SniperScope = (function () {
  'use strict';

  /* ── Zoom level definitions ─────────────────────────────────────── */
  var ZOOM_LEVELS = [
    { label: '4x',  fov: 15 },
    { label: '8x',  fov: 8  },
    { label: '12x', fov: 5  }
  ];
  var HIPFIRE_FOV = 75;

  /* ── Sway constants ──────────────────────────────────────────────── */
  var SWAY_AMP       = 0.0003; /* radians */
  var SWAY_FREQ      = 0.8;    /* Hz */

  /* ── Breath hold constants ───────────────────────────────────────── */
  var BREATH_HOLD_DURATION = 3.0;   /* seconds max hold */
  var BREATH_HOLD_COOLDOWN = 8.0;   /* seconds cooldown */

  /* ── Heartbeat constants ─────────────────────────────────────────── */
  var HB_BPM_NORMAL = 60;
  var HB_BPM_RELEASE = 90; /* after breath hold ends */
  var HB_RELEASE_DECAY = 5.0; /* seconds to decay back to normal */

  /* ── Wind constants ──────────────────────────────────────────────── */
  var WIND_DIRS = ['E', 'NE', 'N', 'NW', 'W', 'SW', 'S', 'SE'];
  var WIND_ARROWS = ['→', '↗', '↑', '↖',
                     '←', '↙', '↓', '↘'];

  /* ── Internal state ──────────────────────────────────────────────── */
  var _scene         = null;
  var _camera        = null;
  var _active        = false;
  var _zoomIdx       = 0;      /* index into ZOOM_LEVELS */

  /* Time tracking */
  var _elapsedTime   = 0;      /* accumulated seconds while scoped */

  /* Breath hold state */
  var _breathKeyDown    = false;
  var _breathHolding    = false;
  var _breathHoldTimer  = 0;   /* seconds remaining in hold */
  var _breathCooldown   = 0;   /* seconds remaining in cooldown */

  /* Wind state */
  var _windSpeed    = 0;   /* mph */
  var _windDirIdx   = 0;   /* index into WIND_DIRS */

  /* Range */
  var _rangeMeters  = 0;

  /* Heartbeat audio */
  var _audioCtx     = null;
  var _hbInterval   = null;
  var _hbBpm        = HB_BPM_NORMAL;
  var _hbReleaseTimer = 0; /* seconds decaying from release bpm */

  /* DOM references */
  var _overlayEl      = null;
  var _reticleWrapEl  = null;
  var _zoomLabelEl    = null;
  var _rangeTextEl    = null;
  var _windArrowEl    = null;
  var _windSpeedEl    = null;
  var _breathHoldEl   = null;
  var _cooldownEl     = null;

  /* Sway camera offset (radians) applied to camera.rotation */
  var _swayX = 0;
  var _swayY = 0;
  var _prevSwayX = 0;
  var _prevSwayY = 0;

  /* ── Build overlay DOM ───────────────────────────────────────────── */
  function _buildOverlay() {
    var old = document.getElementById('sniperScopeOverlay');
    if (old) { old.parentNode.removeChild(old); }

    var el = document.createElement('div');
    el.id = 'sniperScopeOverlay';

    /* Inject styles */
    var styleEl = document.createElement('style');
    styleEl.textContent = [
      '#sniperScopeOverlay {',
      '  display: none;',
      '  position: fixed;',
      '  top: 0; left: 0; right: 0; bottom: 0;',
      '  z-index: 500;',
      '  pointer-events: none;',
      '  overflow: hidden;',
      '  background: radial-gradient(circle at 50% 50%, transparent 34.5%, rgba(0,0,0,0.97) 35.5%);',
      '}',

      /* Sharp ring border */
      '#sniperScopeOverlay .snsc-ring {',
      '  position: absolute;',
      '  top: 50%; left: 50%;',
      '  transform: translate(-50%, -50%);',
      '  width: 70vmin; height: 70vmin;',
      '  border-radius: 50%;',
      '  border: 2px solid rgba(20,20,20,0.9);',
      '  box-shadow: 0 0 0 200vmax rgba(0,0,0,0.97), inset 0 0 30px rgba(0,0,0,0.3);',
      '  pointer-events: none;',
      '}',

      /* Reticle wrapper — sway applied via transform */
      '#sniperScopeOverlay .snsc-reticle-wrap {',
      '  position: absolute;',
      '  top: 50%; left: 50%;',
      '  transform: translate(-50%, -50%);',
      '  width: 70vmin; height: 70vmin;',
      '}',

      '#sniperScopeOverlay .snsc-svg {',
      '  position: absolute;',
      '  top: 0; left: 0;',
      '  width: 100%; height: 100%;',
      '  overflow: visible;',
      '}',

      /* Top-right HUD */
      '#sniperScopeOverlay .snsc-hud {',
      '  position: absolute;',
      '  top: 50%; left: 50%;',
      '  margin-top: calc(-35vmin + 8px);',
      '  margin-left: calc(3vmin);',
      '  font-family: "Courier New", monospace;',
      '  font-size: 11px;',
      '  color: #b8d8b8;',
      '  letter-spacing: 1.5px;',
      '  line-height: 1.8;',
      '  text-shadow: 0 0 5px #000, 0 1px 2px #000;',
      '  white-space: nowrap;',
      '}',

      /* Bottom-right zoom label */
      '#sniperScopeOverlay .snsc-zoom-label {',
      '  position: absolute;',
      '  bottom: 50%; right: 50%;',
      '  margin-bottom: calc(-35vmin + 8px);',
      '  margin-right: calc(3vmin);',
      '  font-family: "Courier New", monospace;',
      '  font-size: 13px;',
      '  color: #b8d8b8;',
      '  letter-spacing: 2px;',
      '  text-shadow: 0 0 5px #000;',
      '  white-space: nowrap;',
      '}',

      /* Wind arrow overlay */
      '#sniperScopeOverlay .snsc-wind-arrow {',
      '  position: absolute;',
      '  top: 50%; left: 50%;',
      '  transform: translate(-50%, -50%);',
      '  font-size: 22px;',
      '  color: rgba(255, 200, 60, 0.85);',
      '  text-shadow: 0 0 6px rgba(0,0,0,0.9);',
      '  transition: transform 0.3s;',
      '}',

      /* Breath hold text */
      '#sniperScopeOverlay .snsc-breathhold {',
      '  display: none;',
      '  position: absolute;',
      '  top: 50%; left: 50%;',
      '  margin-top: calc(35vmin - 28px);',
      '  transform: translateX(-50%);',
      '  font-family: "Courier New", monospace;',
      '  font-size: 12px;',
      '  letter-spacing: 3px;',
      '  color: #80ff80;',
      '  text-shadow: 0 0 8px #00ff00, 0 0 3px #000;',
      '}',

      /* Cooldown text */
      '#sniperScopeOverlay .snsc-cooldown {',
      '  display: none;',
      '  position: absolute;',
      '  top: 50%; left: 50%;',
      '  margin-top: calc(35vmin - 28px);',
      '  transform: translateX(-50%);',
      '  font-family: "Courier New", monospace;',
      '  font-size: 11px;',
      '  letter-spacing: 2px;',
      '  color: #ff6060;',
      '  text-shadow: 0 0 5px #ff0000, 0 0 3px #000;',
      '}',

      /* Top-left badge */
      '#sniperScopeOverlay .snsc-badge {',
      '  position: absolute;',
      '  top: 50%; left: 50%;',
      '  margin-top: calc(-35vmin + 8px);',
      '  margin-left: calc(-35vmin);',
      '  font-family: "Courier New", monospace;',
      '  font-size: 10px;',
      '  color: rgba(150, 180, 150, 0.6);',
      '  letter-spacing: 2px;',
      '  text-shadow: 0 0 4px #000;',
      '  white-space: nowrap;',
      '}'
    ].join('\n');

    document.head.appendChild(styleEl);

    /* Build the SVG reticle */
    var svgNS = 'http://www.w3.org/2000/svg';
    var svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('class', 'snsc-svg');
    svg.setAttribute('viewBox', '0 0 700 700');

    /* Helper to create SVG elements */
    function svgEl(tag, attrs) {
      var elem = document.createElementNS(svgNS, tag);
      var k;
      for (k in attrs) {
        if (attrs.hasOwnProperty(k)) {
          elem.setAttribute(k, attrs[k]);
        }
      }
      return elem;
    }

    /* Outer scope circle wire */
    svg.appendChild(svgEl('circle', {
      cx: '350', cy: '350', r: '340',
      stroke: 'rgba(0,0,0,0.5)', 'stroke-width': '0.8', fill: 'none'
    }));

    /* Thin wire cross — full lines across circle */
    /* Vertical line */
    svg.appendChild(svgEl('line', {
      x1: '350', y1: '10', x2: '350', y2: '690',
      stroke: 'rgba(0,0,0,0.85)', 'stroke-width': '1.0'
    }));
    /* Horizontal line */
    svg.appendChild(svgEl('line', {
      x1: '10', y1: '350', x2: '690', y2: '350',
      stroke: 'rgba(0,0,0,0.85)', 'stroke-width': '1.0'
    }));

    /* Thicker central cross arms (inner 30%) */
    svg.appendChild(svgEl('line', {
      x1: '350', y1: '215', x2: '350', y2: '485',
      stroke: 'rgba(0,0,0,0.92)', 'stroke-width': '1.6'
    }));
    svg.appendChild(svgEl('line', {
      x1: '215', y1: '350', x2: '485', y2: '350',
      stroke: 'rgba(0,0,0,0.92)', 'stroke-width': '1.6'
    }));

    /* ── Horizontal mil-dots: 5 each side ──
       Placed at 100, 200, 300, 400, 500 MOA equiv positions
       using 58px spacing from center (350) */
    var milDotPositions = [292, 234, 176, 118, 60];
    var i, cx, cy;

    /* Left arm dots */
    for (i = 0; i < milDotPositions.length; i++) {
      svg.appendChild(svgEl('circle', {
        cx: String(milDotPositions[i]), cy: '350',
        r: '3.5', fill: 'rgba(0,0,0,0.85)'
      }));
      /* Small tick marks above/below each dot */
      svg.appendChild(svgEl('line', {
        x1: String(milDotPositions[i]), y1: '344',
        x2: String(milDotPositions[i]), y2: '340',
        stroke: 'rgba(0,0,0,0.6)', 'stroke-width': '0.8'
      }));
      svg.appendChild(svgEl('line', {
        x1: String(milDotPositions[i]), y1: '356',
        x2: String(milDotPositions[i]), y2: '360',
        stroke: 'rgba(0,0,0,0.6)', 'stroke-width': '0.8'
      }));
    }

    /* Right arm dots */
    var rightPositions = [408, 466, 524, 582, 640];
    for (i = 0; i < rightPositions.length; i++) {
      svg.appendChild(svgEl('circle', {
        cx: String(rightPositions[i]), cy: '350',
        r: '3.5', fill: 'rgba(0,0,0,0.85)'
      }));
      svg.appendChild(svgEl('line', {
        x1: String(rightPositions[i]), y1: '344',
        x2: String(rightPositions[i]), y2: '340',
        stroke: 'rgba(0,0,0,0.6)', 'stroke-width': '0.8'
      }));
      svg.appendChild(svgEl('line', {
        x1: String(rightPositions[i]), y1: '356',
        x2: String(rightPositions[i]), y2: '360',
        stroke: 'rgba(0,0,0,0.6)', 'stroke-width': '0.8'
      }));
    }

    /* Vertical mil-dots: 5 each arm */
    var vertUpPos = [292, 234, 176, 118, 60];
    for (i = 0; i < vertUpPos.length; i++) {
      svg.appendChild(svgEl('circle', {
        cx: '350', cy: String(vertUpPos[i]),
        r: '3.5', fill: 'rgba(0,0,0,0.85)'
      }));
    }
    var vertDownPos = [408, 466, 524, 582, 640];
    for (i = 0; i < vertDownPos.length; i++) {
      svg.appendChild(svgEl('circle', {
        cx: '350', cy: String(vertDownPos[i]),
        r: '3.5', fill: 'rgba(0,0,0,0.85)'
      }));
    }

    /* BDC hash marks with labels on vertical lower arm */
    var bdcData = [
      { y: 408, label: '100m', w: 24 },
      { y: 466, label: '200m', w: 30 },
      { y: 524, label: '300m', w: 36 },
      { y: 582, label: '400m', w: 42 }
    ];
    for (i = 0; i < bdcData.length; i++) {
      svg.appendChild(svgEl('line', {
        x1: String(350 - bdcData[i].w / 2), y1: String(bdcData[i].y),
        x2: String(350 + bdcData[i].w / 2), y2: String(bdcData[i].y),
        stroke: 'rgba(0,0,0,0.75)', 'stroke-width': '1.2'
      }));
      var lbl = document.createElementNS(svgNS, 'text');
      lbl.setAttribute('x', String(350 + bdcData[i].w / 2 + 5));
      lbl.setAttribute('y', String(bdcData[i].y + 4));
      lbl.setAttribute('font-family', 'monospace');
      lbl.setAttribute('font-size', '11');
      lbl.setAttribute('fill', 'rgba(0,0,0,0.65)');
      lbl.textContent = bdcData[i].label;
      svg.appendChild(lbl);
    }

    /* Centre dot */
    svg.appendChild(svgEl('circle', {
      cx: '350', cy: '350', r: '2.2', fill: 'rgba(0,0,0,0.95)'
    }));

    /* Reticle wrapper div */
    var reticleWrap = document.createElement('div');
    reticleWrap.className = 'snsc-reticle-wrap';
    reticleWrap.id = 'snscReticleWrap';
    reticleWrap.appendChild(svg);

    /* Wind arrow inside reticle (at center offset) */
    var windArrow = document.createElement('div');
    windArrow.className = 'snsc-wind-arrow';
    windArrow.id = 'snscWindArrow';
    reticleWrap.appendChild(windArrow);

    /* Ring border */
    var ring = document.createElement('div');
    ring.className = 'snsc-ring';

    /* HUD panel */
    var hud = document.createElement('div');
    hud.className = 'snsc-hud';
    hud.innerHTML = [
      '<div id="snscRangeText">RANGE: ---m</div>',
      '<div id="snscWindText">WIND: --mph --</div>'
    ].join('');

    /* Zoom label */
    var zoomLabel = document.createElement('div');
    zoomLabel.className = 'snsc-zoom-label';
    zoomLabel.id = 'snscZoomLabel';
    zoomLabel.textContent = ZOOM_LEVELS[0].label;

    /* Breath hold indicator */
    var breathHoldEl = document.createElement('div');
    breathHoldEl.className = 'snsc-breathhold';
    breathHoldEl.id = 'snscBreathHold';
    breathHoldEl.textContent = 'BREATH HOLD';

    /* Cooldown indicator */
    var cooldownEl = document.createElement('div');
    cooldownEl.className = 'snsc-cooldown';
    cooldownEl.id = 'snscCooldown';
    cooldownEl.textContent = 'BREATH COOLING DOWN';

    /* Badge */
    var badge = document.createElement('div');
    badge.className = 'snsc-badge';
    badge.textContent = 'SNIPER SCOPE';

    el.appendChild(ring);
    el.appendChild(reticleWrap);
    el.appendChild(hud);
    el.appendChild(zoomLabel);
    el.appendChild(breathHoldEl);
    el.appendChild(cooldownEl);
    el.appendChild(badge);

    document.body.appendChild(el);
    return el;
  }

  /* ── Web Audio heartbeat ─────────────────────────────────────────── */
  function _getAudioCtx() {
    if (_audioCtx) { return _audioCtx; }
    try {
      var AudioCtxClass = window.AudioContext || window.webkitAudioContext;
      if (AudioCtxClass) {
        _audioCtx = new AudioCtxClass();
      }
    } catch (e) {
      _audioCtx = null;
    }
    return _audioCtx;
  }

  function _playHeartbeatTone() {
    var ctx = _getAudioCtx();
    if (!ctx) { return; }
    try {
      /* Resume if suspended (autoplay policy) */
      if (ctx.state === 'suspended') { ctx.resume(); }

      /* Two quick "lub-dub" pulses — very subtle */
      var masterGain = ctx.createGain();
      masterGain.gain.value = 0.04;
      masterGain.connect(ctx.destination);

      var now = ctx.currentTime;

      /* Pulse 1: lub */
      var osc1 = ctx.createOscillator();
      var env1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.value = 55;
      env1.gain.setValueAtTime(0, now);
      env1.gain.linearRampToValueAtTime(1.0, now + 0.04);
      env1.gain.linearRampToValueAtTime(0, now + 0.12);
      osc1.connect(env1);
      env1.connect(masterGain);
      osc1.start(now);
      osc1.stop(now + 0.15);

      /* Pulse 2: dub (slightly higher pitch) */
      var osc2 = ctx.createOscillator();
      var env2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.value = 70;
      env2.gain.setValueAtTime(0, now + 0.12);
      env2.gain.linearRampToValueAtTime(0.7, now + 0.16);
      env2.gain.linearRampToValueAtTime(0, now + 0.24);
      osc2.connect(env2);
      env2.connect(masterGain);
      osc2.start(now + 0.12);
      osc2.stop(now + 0.28);
    } catch (e) {
      /* Silently ignore audio errors */
    }
  }

  function _startHeartbeat() {
    _stopHeartbeat();
    _hbBpm = HB_BPM_NORMAL;
    _scheduleHeartbeat();
  }

  function _scheduleHeartbeat() {
    if (!_active) { return; }
    _playHeartbeatTone();
    var intervalMs = Math.round(60000 / _hbBpm);
    _hbInterval = setTimeout(_scheduleHeartbeat, intervalMs);
  }

  function _stopHeartbeat() {
    if (_hbInterval !== null) {
      clearTimeout(_hbInterval);
      _hbInterval = null;
    }
  }

  /* ── Wind initialization ─────────────────────────────────────────── */
  function _initWind() {
    _windSpeed  = Math.round(Math.random() * 10); /* 0–10 mph */
    _windDirIdx = Math.floor(Math.random() * WIND_DIRS.length);
  }

  /* ── FOV application ─────────────────────────────────────────────── */
  function _applyZoomFOV() {
    if (!_camera) { return; }
    _camera.fov = ZOOM_LEVELS[_zoomIdx].fov;
    _camera.updateProjectionMatrix();
  }

  function _restoreFOV() {
    if (!_camera) { return; }
    _camera.fov = HIPFIRE_FOV;
    _camera.updateProjectionMatrix();
  }

  /* ── Scroll wheel zoom ───────────────────────────────────────────── */
  function _onWheel(e) {
    if (!_active) { return; }
    e.preventDefault();
    if (e.deltaY > 0) {
      /* Scroll down — zoom out */
      _zoomIdx = (_zoomIdx + 1) % ZOOM_LEVELS.length;
    } else {
      /* Scroll up — zoom in */
      _zoomIdx = (_zoomIdx - 1 + ZOOM_LEVELS.length) % ZOOM_LEVELS.length;
    }
    _applyZoomFOV();
    if (_zoomLabelEl) {
      _zoomLabelEl.textContent = ZOOM_LEVELS[_zoomIdx].label;
    }
  }

  /* ── Right-click range finder ────────────────────────────────────── */
  function _onContextMenu(e) {
    if (!_active) { return; }
    e.preventDefault();

    /* Fake range: use camera pitch angle to simulate distance */
    var angleDeg = 0;
    if (_camera) {
      angleDeg = Math.abs(_camera.rotation.x * 180 / Math.PI);
    }
    /* Formula: angle gives a proxy — roughly dist / 3 meters */
    var pseudoDist = (angleDeg + 1) * 47 + Math.random() * 30;
    _rangeMeters = Math.round(pseudoDist / 3 * 10) / 10;

    if (_rangeTextEl) {
      _rangeTextEl.textContent = 'RANGE: ' + _rangeMeters.toFixed(0) + 'm';
    }
  }

  /* ── Toggle key handler (Ctrl+Shift+Z) ──────────────────────────── */
  function _onKeyDown(e) {
    /* Toggle scope: Ctrl+Shift+Z */
    if (e.ctrlKey && e.shiftKey && (e.key === 'Z' || e.key === 'z')) {
      e.preventDefault();
      toggle();
      return;
    }

    /* Breath hold: Shift (while scoped) */
    if (_active && e.key === 'Shift' && !e.ctrlKey) {
      if (!_breathKeyDown && _breathCooldown <= 0 && !_breathHolding) {
        _breathKeyDown = true;
        _breathHolding = true;
        _breathHoldTimer = BREATH_HOLD_DURATION;
      }
    }
  }

  function _onKeyUp(e) {
    if (e.key === 'Shift') {
      _breathKeyDown = false;
    }
  }

  /* ── Update sway ─────────────────────────────────────────────────── */
  function _updateSway(dt) {
    if (_breathHolding) {
      /* Frozen — no sway */
      _swayX = 0;
      _swayY = 0;
      return;
    }

    var t = _elapsedTime;
    var twoPiFreq = 2 * Math.PI * SWAY_FREQ;
    _swayX = SWAY_AMP * Math.sin(twoPiFreq * t);
    _swayY = SWAY_AMP * Math.cos(twoPiFreq * t * 0.7 + 0.4);
  }

  /* ── Apply sway to camera ────────────────────────────────────────── */
  function _applyCameraSwayDelta() {
    if (!_camera) { return; }
    /* Remove previous sway, apply new */
    _camera.rotation.y -= _prevSwayX;
    _camera.rotation.x -= _prevSwayY;
    _camera.rotation.y += _swayX;
    _camera.rotation.x += _swayY;
    _prevSwayX = _swayX;
    _prevSwayY = _swayY;
  }

  function _removeCameraSwayDelta() {
    if (!_camera) { return; }
    _camera.rotation.y -= _prevSwayX;
    _camera.rotation.x -= _prevSwayY;
    _prevSwayX = 0;
    _prevSwayY = 0;
  }

  /* ── Update DOM ──────────────────────────────────────────────────── */
  function _updateDOM() {
    if (!_overlayEl) { return; }

    /* Reticle sway (DOM offset in pixels equivalent) */
    if (_reticleWrapEl) {
      var pxX = _swayX * 3000;
      var pxY = _swayY * 3000;
      _reticleWrapEl.style.transform =
        'translate(calc(-50% + ' + pxX.toFixed(2) + 'px), calc(-50% + ' + pxY.toFixed(2) + 'px))';
    }

    /* Wind arrow: show with offset proportional to wind speed */
    if (_windArrowEl) {
      _windArrowEl.textContent = WIND_ARROWS[_windDirIdx];
      /* Drift offset: wind pushes reticle left/right/up/down */
      var driftX = 0;
      var driftY = 0;
      /* Map direction index to unit vector */
      var driftMap = [
        [1, 0], [0.707, -0.707], [0, -1], [-0.707, -0.707],
        [-1, 0], [-0.707, 0.707], [0, 1], [0.707, 0.707]
      ];
      var dv = driftMap[_windDirIdx];
      driftX = dv[0] * _windSpeed * 3;
      driftY = dv[1] * _windSpeed * 3;
      _windArrowEl.style.transform =
        'translate(calc(-50% + ' + driftX.toFixed(1) + 'px), calc(-50% + ' + driftY.toFixed(1) + 'px))';
    }

    /* Wind text in HUD */
    if (_windTextEl) {
      _windTextEl.textContent =
        'WIND: ' + _windSpeed + 'mph ' + WIND_ARROWS[_windDirIdx] + ' ' + WIND_DIRS[_windDirIdx];
    }

    /* Breath hold text */
    if (_breathHoldEl && _cooldownEl) {
      if (_breathHolding) {
        _breathHoldEl.style.display = 'block';
        _cooldownEl.style.display = 'none';
        _breathHoldEl.textContent =
          'BREATH HOLD ' + _breathHoldTimer.toFixed(1) + 's';
      } else if (_breathCooldown > 0) {
        _breathHoldEl.style.display = 'none';
        _cooldownEl.style.display = 'block';
        _cooldownEl.textContent =
          'COOLDOWN ' + _breathCooldown.toFixed(1) + 's';
      } else {
        _breathHoldEl.style.display = 'none';
        _cooldownEl.style.display = 'none';
      }
    }
  }

  /* ── Public: init ────────────────────────────────────────────────── */
  function init(scene, camera) {
    _scene  = scene  || _scene;
    _camera = camera || _camera;

    if (typeof document === 'undefined') { return; }

    _overlayEl     = _buildOverlay();
    _reticleWrapEl = document.getElementById('snscReticleWrap');
    _rangeTextEl   = document.getElementById('snscRangeText');
    _windTextEl    = document.getElementById('snscWindText');
    _windArrowEl   = document.getElementById('snscWindArrow');
    _zoomLabelEl   = document.getElementById('snscZoomLabel');
    _breathHoldEl  = document.getElementById('snscBreathHold');
    _cooldownEl    = document.getElementById('snscCooldown');

    /* Key bindings */
    document.addEventListener('keydown', _onKeyDown);
    document.addEventListener('keyup',   _onKeyUp);

    /* Scroll wheel zoom */
    document.addEventListener('wheel', _onWheel, { passive: false });

    /* Right-click range finder */
    document.addEventListener('contextmenu', _onContextMenu);

    console.log('[SniperScope] initialized — Ctrl+Shift+Z to toggle');
  }

  /* ── Public: toggle ──────────────────────────────────────────────── */
  function toggle() {
    if (_active) {
      _deactivate();
    } else {
      _activate();
    }
  }

  /* ── Internal activate / deactivate ─────────────────────────────── */
  function _activate() {
    if (_active) { return; }
    _active = true;
    _zoomIdx = 0;
    _elapsedTime = 0;
    _swayX = 0; _swayY = 0;
    _prevSwayX = 0; _prevSwayY = 0;
    _breathHolding = false;
    _breathHoldTimer = 0;
    _breathCooldown = 0;
    _breathKeyDown = false;
    _hbReleaseTimer = 0;

    _initWind();

    if (_overlayEl) { _overlayEl.style.display = 'block'; }
    if (_zoomLabelEl) { _zoomLabelEl.textContent = ZOOM_LEVELS[_zoomIdx].label; }

    /* Hide standard crosshair if present */
    var stdCross = document.getElementById('crosshair') ||
                   document.getElementById('adsReticle');
    if (stdCross) { stdCross.style.display = 'none'; }

    _applyZoomFOV();
    _startHeartbeat();

    console.log('[SniperScope] activated');
  }

  function _deactivate() {
    if (!_active) { return; }

    _removeCameraSwayDelta();
    _active = false;

    if (_overlayEl) { _overlayEl.style.display = 'none'; }

    /* Restore crosshair */
    var stdCross = document.getElementById('crosshair') ||
                   document.getElementById('adsReticle');
    if (stdCross) { stdCross.style.display = ''; }

    _restoreFOV();
    _stopHeartbeat();

    _breathHolding = false;
    _breathKeyDown = false;
    _breathHoldTimer = 0;
    _breathCooldown = 0;

    console.log('[SniperScope] deactivated');
  }

  /* ── Public: update (dt in seconds) ─────────────────────────────── */
  function update(dt) {
    if (!_active) { return; }

    var safeDt = (dt && dt > 0) ? Math.min(dt, 0.1) : 0.016;
    _elapsedTime += safeDt;

    /* ── Breath hold logic ── */
    if (_breathHolding) {
      _breathHoldTimer -= safeDt;
      if (_breathHoldTimer <= 0 || !_breathKeyDown) {
        /* Breath hold expired or released */
        _breathHolding = false;
        _breathHoldTimer = 0;
        _breathCooldown = BREATH_HOLD_COOLDOWN;
        _breathKeyDown = false;

        /* Speed up heartbeat after hold ends */
        _hbBpm = HB_BPM_RELEASE;
        _hbReleaseTimer = HB_RELEASE_DECAY;
        _stopHeartbeat();
        _scheduleHeartbeat();
      }
    } else if (_breathCooldown > 0) {
      _breathCooldown -= safeDt;
      if (_breathCooldown < 0) { _breathCooldown = 0; }
    }

    /* ── Heartbeat BPM decay back to normal ── */
    if (_hbReleaseTimer > 0) {
      _hbReleaseTimer -= safeDt;
      var t = Math.max(0, _hbReleaseTimer / HB_RELEASE_DECAY);
      _hbBpm = HB_BPM_NORMAL + (HB_BPM_RELEASE - HB_BPM_NORMAL) * t;
      if (_hbReleaseTimer <= 0) {
        _hbBpm = HB_BPM_NORMAL;
        _hbReleaseTimer = 0;
      }
    }

    /* ── Sway ── */
    _updateSway(safeDt);
    _applyCameraSwayDelta();

    /* ── DOM ── */
    _updateDOM();
  }

  /* ── Public: reset ───────────────────────────────────────────────── */
  function reset() {
    _deactivate();
    _elapsedTime    = 0;
    _zoomIdx        = 0;
    _windSpeed      = 0;
    _windDirIdx     = 0;
    _rangeMeters    = 0;
    _hbBpm          = HB_BPM_NORMAL;
    _hbReleaseTimer = 0;
    _breathHolding  = false;
    _breathKeyDown  = false;
    _breathHoldTimer = 0;
    _breathCooldown  = 0;
    _swayX = 0; _swayY = 0;
    _prevSwayX = 0; _prevSwayY = 0;
    if (_camera) {
      _camera.fov = HIPFIRE_FOV;
      _camera.updateProjectionMatrix();
    }
    console.log('[SniperScope] reset');
  }

  /* ── Public: isActive ────────────────────────────────────────────── */
  function isActive() {
    return _active;
  }

  /* ── Expose public API ───────────────────────────────────────────── */
  return {
    init:     init,
    update:   update,
    toggle:   toggle,
    reset:    reset,
    isActive: isActive
  };

}());
