/* ───────────────────────────────────────────────────────────────────────────
   forward-observer.js — Forward Observer / Fire Mission Calling System
   F+O keys  → equip laser designator (binocular view, FOV 15°, zoom 4×)
   T         → lase target at aim point while in binocular mode
   R         → open range card (up to 5 stored reference points)
   API       : window.ForwardObserver = { init, update, reset }
   ─────────────────────────────────────────────────────────────────────────── */
window.ForwardObserver = (function () {
  'use strict';

  /* ── constants ─────────────────────────────────────────────────────────── */
  var BINO_FOV          = 15;       // degrees FOV in bino mode
  var NORMAL_FOV        = 75;       // degrees FOV normal
  var LASE_DISTANCE     = 60;       // units forward from player
  var COOLDOWN_DURATION = 45;       // seconds between fire missions
  var COUNTDOWN_SECONDS = 8;        // delay before strike executes

  var ARTY_SHELLS       = 3;
  var ARTY_RADIUS       = 12;
  var ARTY_INTERVAL     = 2.0;      // seconds between shells
  var CAS_FIRE_COUNT    = 6;        // napalm cubes
  var NAVAL_RADIUS      = 15;
  var MORTAR_COUNT      = 5;
  var MORTAR_SPREAD     = 5;        // ±units offset

  var MAX_RANGE_POINTS  = 5;

  /* wind direction names and adjustment text */
  var WIND_DIRS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  var WIND_COMPASS_OPP = ['S', 'SW', 'W', 'NW', 'N', 'NE', 'E', 'SE'];

  /* ── state ─────────────────────────────────────────────────────────────── */
  var _scene    = null;
  var _camera   = null;
  var _canvas   = null;
  var _player   = null;   // optional player object with .position

  /* binocular mode */
  var _binoActive   = false;
  var _fKeyDown     = false;
  var _oKeyDown     = false;
  var _savedFOV     = NORMAL_FOV;

  /* laser designation */
  var _targetMarker     = null;   // THREE.Mesh glowing box
  var _targetLight      = null;   // THREE.PointLight
  var _targetPos        = null;   // { x, y, z }
  var _targetGrid       = '';     // "GRID XXXX-YYYY"
  var _targetDist       = 0;      // estimated metres
  var _targetDesignated = false;
  var _lightPulseT      = 0;

  /* range card */
  var _rangePoints      = [];     // [{grid, dist, x, y, z}]
  var _rangeCardOpen    = false;

  /* fire mission */
  var _fireMissionOpen  = false;
  var _selectedMunition = 'ARTY'; // ARTY | CAS | NAVAL | MORTAR
  var _countdownActive  = false;
  var _countdownTimer   = 0;
  var _cooldownTimer    = 0;
  var _strikePhase      = 'idle'; // idle | countdown | executing | bda
  var _strikeTimer      = 0;

  /* ARTY execution */
  var _artyShellsFired  = 0;
  var _artyIntervalAcc  = 0;
  var _artyMeshes       = [];
  var _artySmoke        = [];

  /* general VFX */
  var _vfxMeshes        = [];     // { mesh, life, maxLife, vy, scaleTarget }
  var _lightFlashes     = [];     // { light, life, maxLife }
  var _shakeTime        = 0;
  var _shakeAmt         = 0;

  /* wind state */
  var _windSpeed        = 0;
  var _windDirIdx       = 0;

  /* BDA */
  var _bdaCasualties    = 0;

  /* HUD / overlay DOM */
  var _hudEl            = null;
  var _binoOverlayEl    = null;
  var _reticleCanvas    = null;
  var _fireMissionEl    = null;
  var _rangeCardEl      = null;
  var _bdaEl            = null;

  /* key tracking */
  var _keysDown = {};

  /* ── init ───────────────────────────────────────────────────────────────── */
  function init(scene, camera, canvas, player) {
    _scene  = scene;
    _camera = camera;
    _canvas = canvas || document.getElementById('c') || document.querySelector('canvas');
    _player = player || null;

    _randomiseWind();
    _buildHUD();
    _buildBinoOverlay();
    _buildFireMissionPanel();
    _buildRangeCard();
    _buildBDAPanel();
    _bindKeys();
    _updateHUD();
  }

  /* ── wind ───────────────────────────────────────────────────────────────── */
  function _randomiseWind() {
    _windSpeed  = Math.floor(Math.random() * 18) + 4;   // 4-21 kt
    _windDirIdx = Math.floor(Math.random() * 8);
  }

  function _windAdjustText() {
    var oppDir = WIND_COMPASS_OPP[_windDirIdx];
    var adj    = Math.floor(_windSpeed / 4) + 1;
    var cardinal = WIND_DIRS[_windDirIdx];
    var westEast = (cardinal.indexOf('W') >= 0) ? 'EAST' : 'WEST';
    if (cardinal === 'N' || cardinal === 'S') { westEast = 'RIGHT'; }
    return 'WIND: ' + _windSpeed + 'kt ' + cardinal + ' — ADJUST AIM ' + adj + 'm ' + westEast;
  }

  /* ── grid coordinate helpers ────────────────────────────────────────────── */
  function _worldToGrid(x, z) {
    var gx = Math.abs(Math.floor(x * 10)) % 10000;
    var gz = Math.abs(Math.floor(z * 10)) % 10000;
    var sx = String(gx);
    var sz = String(gz);
    while (sx.length < 4) { sx = '0' + sx; }
    while (sz.length < 4) { sz = '0' + sz; }
    return 'GRID ' + sx + '-' + sz;
  }

  function _suggestMunition(dist) {
    if (dist < 150)       { return 'MORTAR'; }
    if (dist < 350)       { return 'ARTY'; }
    if (dist < 600)       { return 'CAS'; }
    return 'GUNSHIP';
  }

  /* ── DOM builders ───────────────────────────────────────────────────────── */
  function _buildHUD() {
    var old = document.getElementById('fo-hud');
    if (old) { old.parentNode.removeChild(old); }

    var el = document.createElement('div');
    el.id  = 'fo-hud';
    el.style.cssText = [
      'position:fixed',
      'bottom:16px',
      'right:16px',
      'font-family:monospace',
      'font-size:13px',
      'color:#00ff88',
      'background:rgba(0,0,0,0.65)',
      'padding:8px 12px',
      'border:1px solid #00ff8888',
      'border-radius:4px',
      'pointer-events:none',
      'z-index:600',
      'white-space:nowrap',
      'line-height:1.6'
    ].join(';');
    document.body.appendChild(el);
    _hudEl = el;
  }

  function _buildBinoOverlay() {
    var old = document.getElementById('fo-bino-overlay');
    if (old) { old.parentNode.removeChild(old); }

    var style = document.createElement('style');
    style.textContent = [
      '#fo-bino-overlay {',
      '  display:none;',
      '  position:fixed;',
      '  top:0;left:0;right:0;bottom:0;',
      '  z-index:500;',
      '  pointer-events:none;',
      '  background:black;',
      '}',
      '#fo-bino-mask {',
      '  position:absolute;',
      '  top:0;left:0;right:0;bottom:0;',
      '  background:black;',
      '  clip-path:',
      '    polygon(0 0, 0 100%, 100% 100%, 100% 0)',
      ';',
      '  -webkit-mask-image:',
      '    radial-gradient(circle at 34% 50%, transparent 22%, black 22.5%),',
      '    radial-gradient(circle at 66% 50%, transparent 22%, black 22.5%);',
      '  mask-image:',
      '    radial-gradient(circle at 34% 50%, transparent 22%, black 22.5%),',
      '    radial-gradient(circle at 66% 50%, transparent 22%, black 22.5%);',
      '  -webkit-mask-composite:intersect;',
      '  mask-composite:intersect;',
      '}',
      '#fo-reticle-canvas {',
      '  position:absolute;',
      '  top:0;left:0;width:100%;height:100%;',
      '}',
      '#fo-wind-bar {',
      '  position:absolute;',
      '  bottom:60px;',
      '  left:50%;',
      '  transform:translateX(-50%);',
      '  font-family:monospace;',
      '  font-size:12px;',
      '  color:#ffdd44;',
      '  background:rgba(0,0,0,0.6);',
      '  padding:4px 10px;',
      '  border:1px solid #ffdd4488;',
      '  border-radius:3px;',
      '  letter-spacing:1px;',
      '}'
    ].join('\n');
    document.head.appendChild(style);

    var el = document.createElement('div');
    el.id  = 'fo-bino-overlay';

    var mask = document.createElement('div');
    mask.id  = 'fo-bino-mask';
    el.appendChild(mask);

    var rc = document.createElement('canvas');
    rc.id  = 'fo-reticle-canvas';
    el.appendChild(rc);
    _reticleCanvas = rc;

    var wb = document.createElement('div');
    wb.id  = 'fo-wind-bar';
    wb.textContent = _windAdjustText();
    el.appendChild(wb);

    document.body.appendChild(el);
    _binoOverlayEl = el;
  }

  function _drawReticle() {
    if (!_reticleCanvas) { return; }
    var w = window.innerWidth;
    var h = window.innerHeight;
    _reticleCanvas.width  = w;
    _reticleCanvas.height = h;
    var ctx = _reticleCanvas.getContext('2d');
    ctx.clearRect(0, 0, w, h);

    /* draw reticle in each eye circle */
    var eyes = [
      { cx: w * 0.34, cy: h * 0.5 },
      { cx: w * 0.66, cy: h * 0.5 }
    ];
    var r = Math.min(w, h) * 0.22;

    for (var i = 0; i < eyes.length; i++) {
      var cx = eyes[i].cx;
      var cy = eyes[i].cy;

      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.clip();

      /* crosshair lines */
      ctx.strokeStyle = 'rgba(0,255,100,0.85)';
      ctx.lineWidth   = 1.2;

      /* horizontal */
      ctx.beginPath();
      ctx.moveTo(cx - r, cy);
      ctx.lineTo(cx + r, cy);
      ctx.stroke();

      /* vertical */
      ctx.beginPath();
      ctx.moveTo(cx, cy - r);
      ctx.lineTo(cx, cy + r);
      ctx.stroke();

      /* center gap */
      ctx.strokeStyle = 'rgba(0,0,0,0)';
      ctx.clearRect(cx - 6, cy - 6, 12, 12);

      /* redraw crosshair gaps around center */
      ctx.strokeStyle = 'rgba(0,255,100,0.85)';
      ctx.beginPath();
      ctx.moveTo(cx - r, cy);
      ctx.lineTo(cx - 14, cy);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx + 14, cy);
      ctx.lineTo(cx + r, cy);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx, cy - r);
      ctx.lineTo(cx, cy - 14);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx, cy + 14);
      ctx.lineTo(cx, cy + r);
      ctx.stroke();

      /* mil-dots along horizontal */
      var milSpacing = r * 0.18;
      for (var m = -3; m <= 3; m++) {
        if (m === 0) { continue; }
        ctx.beginPath();
        ctx.arc(cx + m * milSpacing, cy, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0,255,100,0.9)';
        ctx.fill();
      }

      /* mil-dots along vertical */
      for (var mv = -2; mv <= 2; mv++) {
        if (mv === 0) { continue; }
        ctx.beginPath();
        ctx.arc(cx, cy + mv * milSpacing, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0,255,100,0.9)';
        ctx.fill();
      }

      /* range-finder bracket ticks */
      var tickLen = r * 0.08;
      ctx.strokeStyle = 'rgba(0,255,100,0.6)';
      ctx.lineWidth = 1;
      for (var t = 1; t <= 3; t++) {
        var ty = cy - t * milSpacing * 2;
        ctx.beginPath();
        ctx.moveTo(cx - tickLen, ty);
        ctx.lineTo(cx + tickLen, ty);
        ctx.stroke();

        ty = cy + t * milSpacing * 2;
        ctx.beginPath();
        ctx.moveTo(cx - tickLen, ty);
        ctx.lineTo(cx + tickLen, ty);
        ctx.stroke();
      }

      /* lasing indicator */
      if (_targetDesignated) {
        ctx.strokeStyle = 'rgba(255,68,0,0.9)';
        ctx.lineWidth   = 2;
        ctx.beginPath();
        ctx.arc(cx, cy, 10, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = 'rgba(255,68,0,0.3)';
        ctx.fill();
      }

      ctx.restore();
    }

    /* distance + grid readout between the eyes */
    if (_targetDesignated) {
      ctx.font      = '13px monospace';
      ctx.fillStyle = '#ff4400';
      ctx.textAlign = 'center';
      ctx.fillText(_targetGrid, w * 0.5, h * 0.5 - r - 14);
      ctx.fillText('DIST: ' + Math.floor(_targetDist) + 'm', w * 0.5, h * 0.5 - r - 0);
    }
  }

  function _buildFireMissionPanel() {
    var old = document.getElementById('fo-fire-mission');
    if (old) { old.parentNode.removeChild(old); }

    var el = document.createElement('div');
    el.id  = 'fo-fire-mission';
    el.style.cssText = [
      'display:none',
      'position:fixed',
      'top:50%',
      'left:50%',
      'transform:translate(-50%,-50%)',
      'background:rgba(0,0,0,0.88)',
      'color:#00ff88',
      'font-family:monospace',
      'font-size:14px',
      'border:2px solid #00ff88',
      'border-radius:6px',
      'padding:20px 28px',
      'z-index:700',
      'min-width:320px',
      'line-height:1.8'
    ].join(';');
    document.body.appendChild(el);
    _fireMissionEl = el;
  }

  function _renderFireMissionPanel() {
    if (!_fireMissionEl) { return; }

    var suggested = _suggestMunition(_targetDist);
    var munitions = ['ARTY', 'CAS', 'NAVAL', 'MORTAR'];

    var cooldownStr = (_cooldownTimer > 0)
      ? ('<span style="color:#ff4400">COOLDOWN: ' + Math.ceil(_cooldownTimer) + 's</span>')
      : '';

    var btnHTML = '';
    for (var mi = 0; mi < munitions.length; mi++) {
      var m = munitions[mi];
      var sel    = (m === _selectedMunition);
      var bgCol  = sel ? '#00ff88' : 'transparent';
      var fgCol  = sel ? '#000'    : '#00ff88';
      var border = '1px solid #00ff88';
      btnHTML += '<button data-munition="' + m + '" style="' +
        'background:' + bgCol + ';color:' + fgCol + ';' +
        'border:' + border + ';' +
        'font-family:monospace;font-size:13px;' +
        'padding:4px 10px;margin:4px 4px 4px 0;cursor:pointer;' +
        'border-radius:3px;' +
      '">' + m + '</button>';
    }

    var countdownHTML = '';
    if (_countdownActive) {
      countdownHTML = '<div style="color:#ff4400;font-size:18px;margin-top:8px">' +
        'INBOUND: ' + Math.ceil(_countdownTimer) + 's' +
      '</div>';
    }

    var callBtnDisabled = (_cooldownTimer > 0 || _countdownActive);
    var callBtnStyle = [
      'display:block',
      'margin-top:12px',
      'background:' + (callBtnDisabled ? '#333' : '#ff4400'),
      'color:' + (callBtnDisabled ? '#666' : '#fff'),
      'border:2px solid ' + (callBtnDisabled ? '#555' : '#ff4400'),
      'font-family:monospace',
      'font-size:15px',
      'font-weight:bold',
      'padding:8px 20px',
      'cursor:' + (callBtnDisabled ? 'default' : 'pointer'),
      'border-radius:4px',
      'letter-spacing:2px'
    ].join(';');

    _fireMissionEl.innerHTML = [
      '<div style="font-size:16px;font-weight:bold;letter-spacing:2px;margin-bottom:8px">',
      '  █ FIRE MISSION █',
      '</div>',
      '<div>TARGET: <span style="color:#ffdd44">' + _targetGrid + '</span></div>',
      '<div>DISTANCE: <span style="color:#ffdd44">' + Math.floor(_targetDist) + 'm</span></div>',
      '<div>SUGGESTED: <span style="color:#ffdd44">' + suggested + '</span></div>',
      '<div style="color:#aaa;font-size:11px">' + _windAdjustText() + '</div>',
      '<hr style="border-color:#00ff8844;margin:10px 0">',
      '<div>MUNITION SELECT:</div>',
      '<div>' + btnHTML + '</div>',
      countdownHTML,
      cooldownStr,
      '<button id="fo-call-btn" style="' + callBtnStyle + '"' +
        (callBtnDisabled ? ' disabled' : '') +
      '>CALL FOR FIRE</button>',
      '<button id="fo-close-btn" style="' +
        'display:block;margin-top:8px;background:transparent;' +
        'color:#888;border:1px solid #555;font-family:monospace;' +
        'font-size:12px;padding:4px 10px;cursor:pointer;border-radius:3px;' +
      '">[ESC] CLOSE</button>'
    ].join('');

    /* bind munition buttons */
    var btns = _fireMissionEl.querySelectorAll('[data-munition]');
    for (var bi = 0; bi < btns.length; bi++) {
      (function (btn) {
        btn.addEventListener('click', function () {
          _selectedMunition = btn.getAttribute('data-munition');
          _renderFireMissionPanel();
        });
      })(btns[bi]);
    }

    var callBtn = document.getElementById('fo-call-btn');
    if (callBtn) {
      callBtn.addEventListener('click', function () {
        if (!callBtnDisabled) { _startCountdown(); }
      });
    }

    var closeBtn = document.getElementById('fo-close-btn');
    if (closeBtn) {
      closeBtn.addEventListener('click', _closeFireMission);
    }
  }

  function _buildRangeCard() {
    var old = document.getElementById('fo-range-card');
    if (old) { old.parentNode.removeChild(old); }

    var el = document.createElement('div');
    el.id  = 'fo-range-card';
    el.style.cssText = [
      'display:none',
      'position:fixed',
      'top:20px',
      'right:20px',
      'background:rgba(0,0,0,0.88)',
      'color:#00ff88',
      'font-family:monospace',
      'font-size:13px',
      'border:2px solid #00ff88',
      'border-radius:5px',
      'padding:14px 18px',
      'z-index:650',
      'min-width:260px',
      'line-height:1.8'
    ].join(';');
    document.body.appendChild(el);
    _rangeCardEl = el;
  }

  function _renderRangeCard() {
    if (!_rangeCardEl) { return; }
    var rows = '';
    for (var i = 0; i < _rangePoints.length; i++) {
      var rp = _rangePoints[i];
      rows += '<div style="border-bottom:1px solid #00ff8833;padding:2px 0">' +
        '<span style="color:#ffdd44">RP-' + (i + 1) + '</span>' +
        '  ' + rp.grid +
        '  <span style="color:#aaa">' + Math.floor(rp.dist) + 'm</span>' +
      '</div>';
    }
    if (_rangePoints.length === 0) {
      rows = '<div style="color:#555">No reference points stored.</div>';
    }
    _rangeCardEl.innerHTML = [
      '<div style="font-size:15px;font-weight:bold;letter-spacing:2px;margin-bottom:8px">',
      '  RANGE CARD',
      '</div>',
      '<div style="color:#aaa;font-size:11px;margin-bottom:8px">',
      '  Press T to lase and store target (max 5)',
      '</div>',
      rows,
      '<button id="fo-rc-close" style="' +
        'margin-top:10px;background:transparent;color:#888;' +
        'border:1px solid #555;font-family:monospace;font-size:11px;' +
        'padding:3px 8px;cursor:pointer;border-radius:3px;' +
      '">[R] CLOSE</button>'
    ].join('');

    var closeBtn = document.getElementById('fo-rc-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', _closeRangeCard);
    }
  }

  function _buildBDAPanel() {
    var old = document.getElementById('fo-bda');
    if (old) { old.parentNode.removeChild(old); }

    var el = document.createElement('div');
    el.id  = 'fo-bda';
    el.style.cssText = [
      'display:none',
      'position:fixed',
      'top:50%',
      'left:50%',
      'transform:translate(-50%,-50%)',
      'background:rgba(0,0,0,0.9)',
      'color:#00ff88',
      'font-family:monospace',
      'font-size:14px',
      'border:2px solid #ffdd44',
      'border-radius:6px',
      'padding:20px 28px',
      'z-index:800',
      'min-width:300px',
      'line-height:2'
    ].join(';');
    document.body.appendChild(el);
    _bdaEl = el;
  }

  function _showBDA() {
    if (!_bdaEl) { return; }
    _bdaCasualties = Math.floor(Math.random() * 13);
    var munLabel = _selectedMunition;

    _bdaEl.innerHTML = [
      '<div style="font-size:16px;font-weight:bold;letter-spacing:2px;color:#ffdd44;margin-bottom:8px">',
      '  █ BDA REPORT █',
      '</div>',
      '<div>MUNITION: <span style="color:#ff4400">' + munLabel + '</span></div>',
      '<div>TARGET: <span style="color:#ffdd44">' + _targetGrid + '</span></div>',
      '<div>STRIKE: <span style="color:#00ff88">CONFIRMED HITS</span></div>',
      '<div>EST. CASUALTIES: <span style="color:#ff4400">' + _bdaCasualties + ' KIA</span></div>',
      '<div style="color:#aaa;font-size:11px;margin-top:6px">Next mission available in ' + COOLDOWN_DURATION + 's</div>',
      '<button id="fo-bda-next" style="' +
        'margin-top:8px;background:#00ff88;color:#000;border:none;' +
        'font-family:monospace;font-size:13px;font-weight:bold;' +
        'padding:6px 14px;cursor:pointer;border-radius:3px;margin-right:8px;' +
      '">DESIGNATE NEXT TARGET</button>',
      '<button id="fo-bda-close" style="' +
        'margin-top:8px;background:transparent;color:#888;' +
        'border:1px solid #555;font-family:monospace;font-size:12px;' +
        'padding:6px 10px;cursor:pointer;border-radius:3px;' +
      '">CLOSE</button>'
    ].join('');

    _bdaEl.style.display = 'block';

    var nextBtn = document.getElementById('fo-bda-next');
    if (nextBtn) {
      nextBtn.addEventListener('click', function () {
        _bdaEl.style.display = 'none';
        _strikePhase = 'idle';
        _closeMission();
        _activateBino();
      });
    }
    var closeBtn = document.getElementById('fo-bda-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', function () {
        _bdaEl.style.display = 'none';
        _strikePhase = 'idle';
        _closeMission();
      });
    }
  }

  /* ── HUD update ─────────────────────────────────────────────────────────── */
  function _updateHUD() {
    if (!_hudEl) { return; }

    var parts = ['FO'];

    if (_binoActive) {
      parts.push('[LASING]');
    }
    if (_targetDesignated) {
      parts.push('[' + _targetGrid + ']');
      parts.push('[DIST: ' + Math.floor(_targetDist) + 'm]');
    }
    if (_cooldownTimer > 0) {
      var mm = Math.floor(_cooldownTimer / 60);
      var ss = Math.floor(_cooldownTimer % 60);
      var ssStr = ss < 10 ? '0' + ss : '' + ss;
      parts.push('| NEXT MISSION: ' + mm + ':' + ssStr);
    }

    _hudEl.textContent = parts.join(' ');
  }

  /* ── binocular mode ─────────────────────────────────────────────────────── */
  function _activateBino() {
    if (_binoActive) { return; }
    _binoActive = true;
    if (_camera) {
      _savedFOV = _camera.fov || NORMAL_FOV;
      _camera.fov = BINO_FOV;
      if (_camera.updateProjectionMatrix) { _camera.updateProjectionMatrix(); }
    }
    if (_binoOverlayEl) {
      _binoOverlayEl.style.display = 'block';
      var wb = document.getElementById('fo-wind-bar');
      if (wb) { wb.textContent = _windAdjustText(); }
    }
    _drawReticle();
  }

  function _deactivateBino() {
    if (!_binoActive) { return; }
    _binoActive = false;
    if (_camera) {
      _camera.fov = _savedFOV;
      if (_camera.updateProjectionMatrix) { _camera.updateProjectionMatrix(); }
    }
    if (_binoOverlayEl) { _binoOverlayEl.style.display = 'none'; }
    _closeFireMission();
    _closeRangeCard();
  }

  /* ── target designation ─────────────────────────────────────────────────── */
  function _laseTarget() {
    if (!_binoActive || !_scene || !_camera) { return; }

    /* compute aim point: player.position + camera.direction * LASE_DISTANCE */
    var origin = { x: 0, y: 0, z: 0 };
    if (_player && _player.position) {
      origin.x = _player.position.x;
      origin.y = _player.position.y;
      origin.z = _player.position.z;
    } else if (_camera) {
      origin.x = _camera.position.x;
      origin.y = _camera.position.y;
      origin.z = _camera.position.z;
    }

    /* extract forward direction from camera rotation matrix */
    var dir = { x: 0, y: 0, z: -1 };
    if (_camera.getWorldDirection) {
      var tmp = new THREE.Vector3();
      _camera.getWorldDirection(tmp);
      dir.x = tmp.x;
      dir.y = tmp.y;
      dir.z = tmp.z;
    }

    var tx = origin.x + dir.x * LASE_DISTANCE;
    var ty = origin.y + dir.y * LASE_DISTANCE;
    var tz = origin.z + dir.z * LASE_DISTANCE;

    /* place / move target marker */
    if (_targetMarker) {
      _scene.remove(_targetMarker);
      _targetMarker = null;
    }
    if (_targetLight) {
      _scene.remove(_targetLight);
      _targetLight = null;
    }

    var geo  = new THREE.BoxGeometry(0.5, 0.5, 0.5);
    var mat  = new THREE.MeshBasicMaterial({ color: 0xFF4400, transparent: true, opacity: 0.9 });
    _targetMarker = new THREE.Mesh(geo, mat);
    _targetMarker.position.set(tx, ty, tz);
    _scene.add(_targetMarker);

    var pl = new THREE.PointLight(0xFF4400, 2, 12);
    pl.position.set(tx, ty, tz);
    _scene.add(pl);
    _targetLight = pl;

    _targetPos  = { x: tx, y: ty, z: tz };
    _targetGrid = _worldToGrid(tx, tz);

    /* distance from player / camera */
    var dx = tx - origin.x;
    var dy = ty - origin.y;
    var dz = tz - origin.z;
    _targetDist = Math.sqrt(dx * dx + dy * dy + dz * dz);

    _targetDesignated = true;

    /* store in range card if space available */
    if (_rangePoints.length < MAX_RANGE_POINTS) {
      _rangePoints.push({
        grid: _targetGrid,
        dist: _targetDist,
        x: tx, y: ty, z: tz
      });
    }

    /* update reticle */
    _drawReticle();

    /* auto-open fire mission */
    _openFireMission();
    _updateHUD();
  }

  /* ── fire mission panel open / close ────────────────────────────────────── */
  function _openFireMission() {
    if (!_fireMissionEl) { return; }
    _fireMissionOpen = true;
    _fireMissionEl.style.display = 'block';
    _renderFireMissionPanel();
  }

  function _closeFireMission() {
    if (!_fireMissionEl) { return; }
    _fireMissionOpen = false;
    _fireMissionEl.style.display = 'none';
  }

  function _openRangeCard() {
    if (!_rangeCardEl) { return; }
    _rangeCardOpen = true;
    _rangeCardEl.style.display = 'block';
    _renderRangeCard();
  }

  function _closeRangeCard() {
    if (!_rangeCardEl) { return; }
    _rangeCardOpen = false;
    _rangeCardEl.style.display = 'none';
  }

  function _closeMission() {
    _targetDesignated = false;
    if (_targetMarker) {
      try { _scene.remove(_targetMarker); } catch (e) {}
      _targetMarker = null;
    }
    if (_targetLight) {
      try { _scene.remove(_targetLight); } catch (e) {}
      _targetLight = null;
    }
    _targetPos  = null;
    _targetGrid = '';
    _targetDist = 0;
    _closeFireMission();
    _closeRangeCard();
    _updateHUD();
  }

  /* ── countdown + strike execution ───────────────────────────────────────── */
  function _startCountdown() {
    if (_cooldownTimer > 0 || _countdownActive) { return; }
    _countdownActive = true;
    _countdownTimer  = COUNTDOWN_SECONDS;
    _strikePhase     = 'countdown';
    _renderFireMissionPanel();
  }

  function _executeStrike() {
    if (!_targetPos) { return; }
    _closeFireMission();
    _strikePhase = 'executing';

    if (_selectedMunition === 'ARTY')   { _launchARTY(); }
    if (_selectedMunition === 'CAS')    { _launchCAS(); }
    if (_selectedMunition === 'NAVAL')  { _launchNAVAL(); }
    if (_selectedMunition === 'MORTAR') { _launchMORTAR(); }

    _cooldownTimer = COOLDOWN_DURATION;
    _countdownActive = false;
    _countdownTimer  = 0;
  }

  /* ── ARTY strike ────────────────────────────────────────────────────────── */
  function _launchARTY() {
    _artyShellsFired = 0;
    _artyIntervalAcc = 0;
  }

  function _artyImpact(offsetX, offsetZ) {
    if (!_targetPos) { return; }
    var x = _targetPos.x + offsetX;
    var y = _targetPos.y;
    var z = _targetPos.z + offsetZ;

    /* debris cluster */
    for (var d = 0; d < 6; d++) {
      var debGeo = new THREE.BoxGeometry(
        0.3 + Math.random() * 0.4,
        0.3 + Math.random() * 0.4,
        0.3 + Math.random() * 0.4
      );
      var debMat = new THREE.MeshBasicMaterial({ color: 0x553300 });
      var deb = new THREE.Mesh(debGeo, debMat);
      deb.position.set(
        x + (Math.random() - 0.5) * 3,
        y + Math.random() * 2,
        z + (Math.random() - 0.5) * 3
      );
      _scene.add(deb);
      _vfxMeshes.push({ mesh: deb, life: 3.0, maxLife: 3.0, vy: 3 + Math.random() * 2, scaleTarget: 0 });
    }

    /* smoke sphere */
    var smokeGeo = new THREE.SphereGeometry(2, 8, 8);
    var smokeMat = new THREE.MeshBasicMaterial({ color: 0x888888, transparent: true, opacity: 0.6 });
    var smoke = new THREE.Mesh(smokeGeo, smokeMat);
    smoke.position.set(x, y + 1, z);
    _scene.add(smoke);
    _vfxMeshes.push({ mesh: smoke, life: 5.0, maxLife: 5.0, vy: 0.8, scaleTarget: 3 });

    /* flash light */
    var fl = new THREE.PointLight(0xFF8800, 8, ARTY_RADIUS);
    fl.position.set(x, y + 1, z);
    _scene.add(fl);
    _lightFlashes.push({ light: fl, life: 0.4, maxLife: 0.4 });

    _shakeTime = 0.35;
    _shakeAmt  = 0.12;
  }

  /* ── CAS napalm streak ──────────────────────────────────────────────────── */
  function _launchCAS() {
    if (!_targetPos) { return; }
    var x = _targetPos.x;
    var y = _targetPos.y;
    var z = _targetPos.z;

    for (var i = 0; i < CAS_FIRE_COUNT; i++) {
      var geo = new THREE.BoxGeometry(1.2, 0.6, 3.0);
      var mat = new THREE.MeshBasicMaterial({ color: 0xFF4400, transparent: true, opacity: 0.85 });
      var cube = new THREE.Mesh(geo, mat);
      cube.position.set(
        x + (i - CAS_FIRE_COUNT * 0.5) * 3.5,
        y + 0.3,
        z
      );
      _scene.add(cube);
      _vfxMeshes.push({ mesh: cube, life: 6.0 + i * 0.3, maxLife: 6.0 + i * 0.3, vy: 0.2, scaleTarget: 1.5 });

      /* accompanying light */
      var fl = new THREE.PointLight(0xFF4400, 3, 8);
      fl.position.copy(cube.position);
      _scene.add(fl);
      _lightFlashes.push({ light: fl, life: 2.0, maxLife: 2.0 });
    }

    _shakeTime = 0.5;
    _shakeAmt  = 0.08;

    /* schedule BDA */
    _scheduleStrikeDone(2.5);
  }

  /* ── NAVAL heavy round ──────────────────────────────────────────────────── */
  function _launchNAVAL() {
    if (!_targetPos) { return; }
    var x = _targetPos.x;
    var y = _targetPos.y;
    var z = _targetPos.z;

    var geo = new THREE.SphereGeometry(NAVAL_RADIUS, 12, 12);
    var mat = new THREE.MeshBasicMaterial({ color: 0xFF6600, transparent: true, opacity: 0.7, wireframe: false });
    var ball = new THREE.Mesh(geo, mat);
    ball.position.set(x, y + 2, z);
    _scene.add(ball);
    _vfxMeshes.push({ mesh: ball, life: 3.0, maxLife: 3.0, vy: 1.0, scaleTarget: 0 });

    /* massive light */
    var fl = new THREE.PointLight(0xFF6600, 20, NAVAL_RADIUS * 3);
    fl.position.set(x, y + 2, z);
    _scene.add(fl);
    _lightFlashes.push({ light: fl, life: 1.2, maxLife: 1.2 });

    /* smoke */
    var sGeo = new THREE.SphereGeometry(8, 8, 8);
    var sMat = new THREE.MeshBasicMaterial({ color: 0x444444, transparent: true, opacity: 0.5 });
    var sm = new THREE.Mesh(sGeo, sMat);
    sm.position.set(x, y + 4, z);
    _scene.add(sm);
    _vfxMeshes.push({ mesh: sm, life: 8.0, maxLife: 8.0, vy: 1.2, scaleTarget: 2 });

    /* ground shake */
    _shakeTime = 1.5;
    _shakeAmt  = 0.4;

    _scheduleStrikeDone(3.0);
  }

  /* ── MORTAR rapid impacts ───────────────────────────────────────────────── */
  function _launchMORTAR() {
    if (!_targetPos) { return; }
    for (var r = 0; r < MORTAR_COUNT; r++) {
      (function (round) {
        var delay = round * 0.35;
        _addDelayedMortar(delay, round);
      })(r);
    }
    _scheduleStrikeDone(MORTAR_COUNT * 0.35 + 1.5);
  }

  function _addDelayedMortar(delay, round) {
    /* store in vfxMeshes with a negative "countdown" life */
    var placeholder = {
      mesh: null,
      life: delay,
      maxLife: delay,
      vy: 0,
      scaleTarget: 0,
      mortarRound: round,
      pending: true
    };
    _vfxMeshes.push(placeholder);
  }

  function _fireMortarImpact() {
    if (!_targetPos || !_scene) { return; }
    var ox = (Math.random() - 0.5) * MORTAR_SPREAD * 2;
    var oz = (Math.random() - 0.5) * MORTAR_SPREAD * 2;
    var x  = _targetPos.x + ox;
    var y  = _targetPos.y;
    var z  = _targetPos.z + oz;

    var geo = new THREE.SphereGeometry(3, 8, 8);
    var mat = new THREE.MeshBasicMaterial({ color: 0xFF5500, transparent: true, opacity: 0.75 });
    var ball = new THREE.Mesh(geo, mat);
    ball.position.set(x, y + 0.5, z);
    _scene.add(ball);
    _vfxMeshes.push({ mesh: ball, life: 1.8, maxLife: 1.8, vy: 1.5, scaleTarget: 0 });

    var fl = new THREE.PointLight(0xFF5500, 5, 10);
    fl.position.set(x, y + 1, z);
    _scene.add(fl);
    _lightFlashes.push({ light: fl, life: 0.3, maxLife: 0.3 });

    _shakeTime = Math.max(_shakeTime, 0.2);
    _shakeAmt  = 0.07;
  }

  /* ── scheduled BDA trigger ──────────────────────────────────────────────── */
  function _scheduleStrikeDone(delaySeconds) {
    var token = { life: delaySeconds, maxLife: delaySeconds, pending: true, strikeDone: true, mesh: null, vy: 0, scaleTarget: 0 };
    _vfxMeshes.push(token);
  }

  /* ── key bindings ───────────────────────────────────────────────────────── */
  function _bindKeys() {
    document.addEventListener('keydown', _onKeyDown);
    document.addEventListener('keyup',   _onKeyUp);
  }

  function _onKeyDown(e) {
    var key = e.key ? e.key.toLowerCase() : '';
    _keysDown[key] = true;

    /* F+O combo → bino mode */
    if (key === 'f' || key === 'o') {
      if (_keysDown['f'] && _keysDown['o']) {
        if (_binoActive) {
          _deactivateBino();
        } else {
          _activateBino();
        }
      }
    }

    /* T → lase target */
    if (key === 't' && _binoActive) {
      _laseTarget();
    }

    /* R → range card */
    if (key === 'r' && _binoActive) {
      if (_rangeCardOpen) {
        _closeRangeCard();
      } else {
        _openRangeCard();
      }
    }

    /* Escape → close panels */
    if (key === 'escape') {
      _closeFireMission();
      _closeRangeCard();
      if (_bdaEl) { _bdaEl.style.display = 'none'; }
    }
  }

  function _onKeyUp(e) {
    var key = e.key ? e.key.toLowerCase() : '';
    _keysDown[key] = false;
  }

  /* ── update (call every frame with delta-time in seconds) ───────────────── */
  function update(dt) {
    if (!_scene) { return; }

    /* countdown tick */
    if (_countdownActive && _strikePhase === 'countdown') {
      _countdownTimer -= dt;
      _renderFireMissionPanel();
      if (_countdownTimer <= 0) {
        _countdownTimer = 0;
        _countdownActive = false;
        _executeStrike();
      }
    }

    /* cooldown tick */
    if (_cooldownTimer > 0) {
      _cooldownTimer = Math.max(0, _cooldownTimer - dt);
      _updateHUD();
      if (_cooldownTimer === 0) {
        _randomiseWind();
        _updateHUD();
      }
    }

    /* ARTY sequential shells */
    if (_strikePhase === 'executing' && _selectedMunition === 'ARTY' && _artyShellsFired < ARTY_SHELLS) {
      _artyIntervalAcc += dt;
      if (_artyIntervalAcc >= ARTY_INTERVAL) {
        _artyIntervalAcc -= ARTY_INTERVAL;
        var oX = (Math.random() - 0.5) * ARTY_RADIUS;
        var oZ = (Math.random() - 0.5) * ARTY_RADIUS;
        _artyImpact(oX, oZ);
        _artyShellsFired++;
        if (_artyShellsFired >= ARTY_SHELLS) {
          _scheduleStrikeDone(3.0);
        }
      }
    }

    /* VFX update */
    var nextVfx = [];
    for (var vi = 0; vi < _vfxMeshes.length; vi++) {
      var vfx = _vfxMeshes[vi];

      /* mortar pending rounds */
      if (vfx.pending && vfx.mortarRound !== undefined) {
        vfx.life -= dt;
        if (vfx.life <= 0) {
          _fireMortarImpact();
          /* discard */
          continue;
        }
        nextVfx.push(vfx);
        continue;
      }

      /* strike-done token */
      if (vfx.pending && vfx.strikeDone) {
        vfx.life -= dt;
        if (vfx.life <= 0) {
          if (_strikePhase === 'executing') {
            _strikePhase = 'bda';
            _showBDA();
          }
          continue;
        }
        nextVfx.push(vfx);
        continue;
      }

      if (!vfx.mesh) { continue; }

      vfx.life -= dt;
      if (vfx.life <= 0) {
        try { _scene.remove(vfx.mesh); } catch (e) {}
        continue;
      }

      /* float upward */
      vfx.mesh.position.y += vfx.vy * dt;

      /* fade out */
      var t = vfx.life / vfx.maxLife;
      if (vfx.mesh.material && vfx.mesh.material.transparent) {
        vfx.mesh.material.opacity = t * 0.85;
      }

      /* scale towards scaleTarget */
      if (vfx.scaleTarget > 0) {
        var currS = vfx.mesh.scale.x;
        var targetS = vfx.scaleTarget;
        var newS = currS + (targetS - currS) * dt * 1.2;
        vfx.mesh.scale.setScalar(newS);
      }

      nextVfx.push(vfx);
    }
    _vfxMeshes = nextVfx;

    /* light flash update */
    var nextFlashes = [];
    for (var fi = 0; fi < _lightFlashes.length; fi++) {
      var lf = _lightFlashes[fi];
      lf.life -= dt;
      if (lf.life <= 0) {
        try { _scene.remove(lf.light); } catch (e) {}
        continue;
      }
      lf.light.intensity = 8 * (lf.life / lf.maxLife);
      nextFlashes.push(lf);
    }
    _lightFlashes = nextFlashes;

    /* target marker pulse */
    if (_targetLight && _targetDesignated) {
      _lightPulseT += dt * 3;
      _targetLight.intensity = 1.5 + Math.sin(_lightPulseT) * 1.0;
    }

    /* screen shake */
    if (_shakeTime > 0 && _camera) {
      _shakeTime -= dt;
      var shake = Math.sin(_shakeTime * 40) * _shakeAmt * (_shakeTime / 0.4);
      _camera.position.y += shake;
    }
  }

  /* ── reset ──────────────────────────────────────────────────────────────── */
  function reset() {
    _deactivateBino();
    _closeMission();

    /* remove all VFX */
    for (var vi = 0; vi < _vfxMeshes.length; vi++) {
      if (_vfxMeshes[vi].mesh) {
        try { _scene.remove(_vfxMeshes[vi].mesh); } catch (e) {}
      }
    }
    _vfxMeshes = [];

    for (var fi = 0; fi < _lightFlashes.length; fi++) {
      try { _scene.remove(_lightFlashes[fi].light); } catch (e) {}
    }
    _lightFlashes = [];

    _cooldownTimer   = 0;
    _countdownTimer  = 0;
    _countdownActive = false;
    _strikePhase     = 'idle';
    _artyShellsFired = 0;
    _artyIntervalAcc = 0;
    _rangePoints     = [];

    if (_bdaEl) { _bdaEl.style.display = 'none'; }

    _randomiseWind();
    _updateHUD();
  }

  /* ── public API ─────────────────────────────────────────────────────────── */
  return {
    init:   init,
    update: update,
    reset:  reset
  };

})();
