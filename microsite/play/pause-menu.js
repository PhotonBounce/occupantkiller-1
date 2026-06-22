/* pause-menu.js — In-game pause menu for OccupantKiller Three.js FPS
 * Escape key pauses/resumes. Self-initializing IIFE.
 * All var, no let/const.
 */
window.PauseMenu = (function () {

  // ── State ──────────────────────────────────────────────────────────────────
  var _visible = false;
  var _overlay = null;
  var _card = null;
  var _settingsPanel = null;
  var _controlsPanel = null;
  var _confirmPanel = null;
  var _currentSubPanel = null; // 'settings' | 'controls' | 'confirm' | null

  // ── Settings persistence key ───────────────────────────────────────────────
  var SETTINGS_KEY = 'okk_settings_v1';
  var SENSITIVITY_KEY = 'okk_sensitivity';

  function _loadSettings() {
    var defaults = {
      masterVolume: 50,
      musicVolume: 50,
      sensitivity: 5,
      shadows: true,
      fov: 75
    };
    try {
      var raw = localStorage.getItem(SETTINGS_KEY);
      if (raw) {
        var parsed = JSON.parse(raw);
        return {
          masterVolume:  (parsed.masterVolume  !== undefined) ? parsed.masterVolume  : defaults.masterVolume,
          musicVolume:   (parsed.musicVolume   !== undefined) ? parsed.musicVolume   : defaults.musicVolume,
          sensitivity:   (parsed.sensitivity   !== undefined) ? parsed.sensitivity   : defaults.sensitivity,
          shadows:       (parsed.shadows       !== undefined) ? parsed.shadows       : defaults.shadows,
          fov:           (parsed.fov           !== undefined) ? parsed.fov           : defaults.fov
        };
      }
    } catch (e) {}
    return defaults;
  }

  function _saveSettings(s) {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
      localStorage.setItem(SENSITIVITY_KEY, String(s.sensitivity));
    } catch (e) {}
  }

  // ── CSS injection ──────────────────────────────────────────────────────────
  function _injectStyles() {
    var style = document.createElement('style');
    style.id = 'pause-menu-styles';
    style.textContent = [
      '@keyframes pm-slideDown {',
      '  from { transform: translateY(-100%); opacity: 0; }',
      '  to   { transform: translateY(0);     opacity: 1; }',
      '}',
      '@keyframes pm-slideInRight {',
      '  from { transform: translateX(100%); opacity: 0; }',
      '  to   { transform: translateX(0);   opacity: 1; }',
      '}',
      '@keyframes pm-flashWhite {',
      '  0%   { opacity: 0; }',
      '  30%  { opacity: 1; }',
      '  100% { opacity: 0; }',
      '}',
      '#pm-overlay {',
      '  position: fixed;',
      '  inset: 0;',
      '  z-index: 9999;',
      '  background: rgba(0,0,0,0.75);',
      '  display: flex;',
      '  align-items: center;',
      '  justify-content: center;',
      '  font-family: "Courier New", Courier, monospace;',
      '}',
      '#pm-flash {',
      '  position: fixed;',
      '  inset: 0;',
      '  z-index: 10000;',
      '  background: #fff;',
      '  pointer-events: none;',
      '  opacity: 0;',
      '}',
      '#pm-card {',
      '  position: relative;',
      '  width: 400px;',
      '  background: #0a120a;',
      '  border: 1px solid #00cc44;',
      '  border-radius: 4px;',
      '  overflow: hidden;',
      '  animation: pm-slideDown 0.3s cubic-bezier(0.22,1,0.36,1) both;',
      '  box-shadow: 0 0 40px rgba(0,204,68,0.15), 0 8px 32px rgba(0,0,0,0.6);',
      '}',
      '#pm-header {',
      '  padding: 20px 24px 0;',
      '}',
      '#pm-title-gear {',
      '  font-size: 11px;',
      '  color: #00cc44;',
      '  letter-spacing: 3px;',
      '  text-transform: uppercase;',
      '  opacity: 0.7;',
      '  margin-bottom: 2px;',
      '}',
      '#pm-title {',
      '  font-size: 22px;',
      '  font-weight: bold;',
      '  color: #e8ffe8;',
      '  letter-spacing: 5px;',
      '  text-transform: uppercase;',
      '  text-shadow: 0 0 16px rgba(0,204,68,0.4);',
      '}',
      '#pm-subtitle {',
      '  font-size: 10px;',
      '  color: #4a7a4a;',
      '  letter-spacing: 3px;',
      '  margin-top: 2px;',
      '  text-transform: uppercase;',
      '}',
      '#pm-ukraine-bar {',
      '  height: 3px;',
      '  margin: 14px 0 0;',
      '  background: linear-gradient(90deg, #0057b8 50%, #ffd700 50%);',
      '}',
      '#pm-divider {',
      '  height: 1px;',
      '  background: #00cc44;',
      '  opacity: 0.3;',
      '}',
      '#pm-buttons {',
      '  padding: 16px 24px 20px;',
      '  display: flex;',
      '  flex-direction: column;',
      '  gap: 8px;',
      '}',
      '.pm-btn {',
      '  background: #0f1a0f;',
      '  border: 1px solid #1e3a1e;',
      '  color: #a8d4a8;',
      '  padding: 11px 20px;',
      '  font-family: "Courier New", Courier, monospace;',
      '  font-size: 13px;',
      '  font-weight: bold;',
      '  letter-spacing: 3px;',
      '  text-transform: uppercase;',
      '  cursor: pointer;',
      '  border-radius: 2px;',
      '  text-align: left;',
      '  transition: border-color 0.15s, color 0.15s, background 0.15s, box-shadow 0.15s;',
      '  outline: none;',
      '}',
      '.pm-btn:hover {',
      '  border-color: #00cc44;',
      '  color: #00ff55;',
      '  background: #0d1f0d;',
      '  box-shadow: 0 0 12px rgba(0,204,68,0.25);',
      '  animation: pm-btnPulse 0.6s ease-in-out;',
      '}',
      '.pm-btn-danger {',
      '  border-color: #3a1e1e;',
      '  color: #d47a7a;',
      '}',
      '.pm-btn-danger:hover {',
      '  border-color: #cc2200;',
      '  color: #ff4422;',
      '  background: #1f0d0d;',
      '  box-shadow: 0 0 12px rgba(204,34,0,0.25);',
      '}',
      '@keyframes pm-btnPulse {',
      '  0%   { box-shadow: 0 0 0 rgba(0,204,68,0); }',
      '  50%  { box-shadow: 0 0 18px rgba(0,204,68,0.4); }',
      '  100% { box-shadow: 0 0 12px rgba(0,204,68,0.25); }',
      '}',
      /* Sub-panel shared */
      '.pm-sub {',
      '  position: absolute;',
      '  top: 0; right: 0; bottom: 0;',
      '  width: 100%;',
      '  background: #080f08;',
      '  border-left: 1px solid #00cc44;',
      '  overflow-y: auto;',
      '  animation: pm-slideInRight 0.25s cubic-bezier(0.22,1,0.36,1) both;',
      '  padding: 20px 24px;',
      '  box-sizing: border-box;',
      '}',
      '.pm-sub-title {',
      '  font-size: 13px;',
      '  color: #00cc44;',
      '  letter-spacing: 4px;',
      '  text-transform: uppercase;',
      '  margin-bottom: 18px;',
      '  border-bottom: 1px solid rgba(0,204,68,0.2);',
      '  padding-bottom: 10px;',
      '}',
      '.pm-setting-row {',
      '  margin-bottom: 16px;',
      '}',
      '.pm-setting-label {',
      '  font-size: 10px;',
      '  color: #4a7a4a;',
      '  letter-spacing: 2px;',
      '  text-transform: uppercase;',
      '  margin-bottom: 5px;',
      '}',
      '.pm-slider {',
      '  -webkit-appearance: none;',
      '  appearance: none;',
      '  width: 100%;',
      '  height: 4px;',
      '  background: #1e3a1e;',
      '  border-radius: 2px;',
      '  outline: none;',
      '  accent-color: #00cc44;',
      '}',
      '.pm-slider::-webkit-slider-thumb {',
      '  -webkit-appearance: none;',
      '  width: 14px;',
      '  height: 14px;',
      '  background: #00cc44;',
      '  border-radius: 50%;',
      '  cursor: pointer;',
      '  box-shadow: 0 0 6px rgba(0,204,68,0.5);',
      '}',
      '.pm-toggle {',
      '  display: inline-block;',
      '  width: 40px;',
      '  height: 20px;',
      '  background: #1e3a1e;',
      '  border-radius: 10px;',
      '  position: relative;',
      '  cursor: pointer;',
      '  border: 1px solid #1e3a1e;',
      '  transition: background 0.2s;',
      '  vertical-align: middle;',
      '}',
      '.pm-toggle.on {',
      '  background: #00cc44;',
      '  border-color: #00cc44;',
      '}',
      '.pm-toggle::after {',
      '  content: "";',
      '  position: absolute;',
      '  top: 2px;',
      '  left: 2px;',
      '  width: 14px;',
      '  height: 14px;',
      '  background: #fff;',
      '  border-radius: 50%;',
      '  transition: transform 0.2s;',
      '}',
      '.pm-toggle.on::after {',
      '  transform: translateX(20px);',
      '}',
      '.pm-val-label {',
      '  font-size: 11px;',
      '  color: #00cc44;',
      '  margin-left: 8px;',
      '  letter-spacing: 1px;',
      '}',
      /* Controls table */
      '.pm-controls-table {',
      '  width: 100%;',
      '  border-collapse: collapse;',
      '  font-size: 11px;',
      '}',
      '.pm-controls-table tr {',
      '  border-bottom: 1px solid rgba(0,204,68,0.06);',
      '}',
      '.pm-controls-table td {',
      '  padding: 5px 4px;',
      '  color: #a8d4a8;',
      '  vertical-align: middle;',
      '}',
      '.pm-controls-table td:first-child {',
      '  color: #00cc44;',
      '  font-weight: bold;',
      '  letter-spacing: 1px;',
      '  width: 48%;',
      '  padding-right: 8px;',
      '}',
      '.pm-controls-table td:last-child {',
      '  color: #6a9a6a;',
      '}',
      /* Confirm dialog */
      '#pm-confirm {',
      '  padding: 28px 24px 24px;',
      '  text-align: center;',
      '}',
      '#pm-confirm-msg {',
      '  font-size: 14px;',
      '  color: #ff4422;',
      '  letter-spacing: 2px;',
      '  text-transform: uppercase;',
      '  margin-bottom: 8px;',
      '}',
      '#pm-confirm-sub {',
      '  font-size: 10px;',
      '  color: #8a5a5a;',
      '  margin-bottom: 20px;',
      '  letter-spacing: 1px;',
      '}',
      '#pm-confirm-btns {',
      '  display: flex;',
      '  gap: 10px;',
      '  justify-content: center;',
      '}'
    ].join('\n');
    document.head.appendChild(style);
  }

  // ── Build DOM ──────────────────────────────────────────────────────────────
  function _buildDOM() {
    // Flash element (for resume animation)
    var flash = document.createElement('div');
    flash.id = 'pm-flash';
    document.body.appendChild(flash);

    // Outer overlay
    _overlay = document.createElement('div');
    _overlay.id = 'pm-overlay';
    _overlay.style.display = 'none';

    // Card
    _card = document.createElement('div');
    _card.id = 'pm-card';

    // Header
    var header = document.createElement('div');
    header.id = 'pm-header';
    header.innerHTML = [
      '<div id="pm-title-gear">&#9881; ALPHA-1 // OCCUPANT KILLER</div>',
      '<div id="pm-title">MISSION PAUSED</div>',
      '<div id="pm-subtitle">CURRENT OPERATION SUSPENDED</div>',
      '<div id="pm-ukraine-bar"></div>'
    ].join('');

    // Divider
    var divider = document.createElement('div');
    divider.id = 'pm-divider';

    // Button area
    var buttons = document.createElement('div');
    buttons.id = 'pm-buttons';

    var btnResume = _makeBtn('[ RESUME MISSION ]', false, function () {
      _hideWithFlash();
    });
    var btnSettings = _makeBtn('[ SETTINGS ]', false, function () {
      _openSubPanel('settings');
    });
    var btnControls = _makeBtn('[ CONTROLS ]', false, function () {
      _openSubPanel('controls');
    });
    var btnAbandon = _makeBtn('[ ABANDON MISSION ]', true, function () {
      _openSubPanel('confirm');
    });

    buttons.appendChild(btnResume);
    buttons.appendChild(btnSettings);
    buttons.appendChild(btnControls);
    buttons.appendChild(btnAbandon);

    _card.appendChild(header);
    _card.appendChild(divider);
    _card.appendChild(buttons);

    // Settings sub-panel
    _settingsPanel = _buildSettingsPanel();
    _card.appendChild(_settingsPanel);

    // Controls sub-panel
    _controlsPanel = _buildControlsPanel();
    _card.appendChild(_controlsPanel);

    // Confirm sub-panel
    _confirmPanel = _buildConfirmPanel();
    _card.appendChild(_confirmPanel);

    _overlay.appendChild(_card);
    document.body.appendChild(_overlay);
  }

  function _makeBtn(label, isDanger, onClick) {
    var btn = document.createElement('button');
    btn.className = 'pm-btn' + (isDanger ? ' pm-btn-danger' : '');
    btn.textContent = label;
    btn.addEventListener('click', onClick);
    return btn;
  }

  // ── Settings panel ─────────────────────────────────────────────────────────
  function _buildSettingsPanel() {
    var panel = document.createElement('div');
    panel.id = 'pm-settings';
    panel.className = 'pm-sub';
    panel.style.display = 'none';

    var s = _loadSettings();

    panel.innerHTML = '<div class="pm-sub-title">&#9881; SETTINGS</div>';

    // Master Vol
    panel.appendChild(_makeSliderRow('MASTER VOL', 'pm-master-vol', 0, 100, s.masterVolume, function (v) {
      window._masterVolume = v / 100;
      if (window.AudioSystem && window.AudioSystem.setVolume) {
        window.AudioSystem.setVolume(v / 100);
      }
    }));

    // Music Vol
    panel.appendChild(_makeSliderRow('MUSIC VOL', 'pm-music-vol', 0, 100, s.musicVolume, function (v) {
      window._musicVolume = v / 100;
      if (window.AudioSystem && window.AudioSystem.setMusicVolume) {
        window.AudioSystem.setMusicVolume(v / 100);
      }
    }));

    // Sensitivity
    panel.appendChild(_makeSliderRow('SENSITIVITY', 'pm-sensitivity', 1, 10, s.sensitivity, function (v) {
      try { localStorage.setItem(SENSITIVITY_KEY, String(v)); } catch (e) {}
    }));

    // Shadows toggle
    panel.appendChild(_makeToggleRow('SHADOWS', 'pm-shadows', s.shadows, function (v) {
      window._shadowsEnabled = v;
    }));

    // FOV
    panel.appendChild(_makeSliderRow('FIELD OF VIEW', 'pm-fov', 70, 110, s.fov, function (v) {
      try {
        var saved = JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}');
        saved.fov = v;
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(saved));
      } catch (e) {}
      // Apply to Three.js camera if available
      if (window.camera && window.camera.fov !== undefined) {
        window.camera.fov = v;
        window.camera.updateProjectionMatrix();
      }
    }));

    // Save & Back
    var saveBtn = _makeBtn('[ SAVE & BACK ]', false, function () {
      _saveCurrentSettings();
      _closeSubPanel();
    });
    saveBtn.style.marginTop = '8px';
    panel.appendChild(saveBtn);

    return panel;
  }

  function _makeSliderRow(labelText, id, min, max, val, onChange) {
    var row = document.createElement('div');
    row.className = 'pm-setting-row';

    var label = document.createElement('div');
    label.className = 'pm-setting-label';
    label.textContent = labelText;

    var wrap = document.createElement('div');
    wrap.style.display = 'flex';
    wrap.style.alignItems = 'center';

    var slider = document.createElement('input');
    slider.type = 'range';
    slider.className = 'pm-slider';
    slider.id = id;
    slider.min = String(min);
    slider.max = String(max);
    slider.value = String(val);
    slider.style.flex = '1';

    var valLabel = document.createElement('span');
    valLabel.className = 'pm-val-label';
    valLabel.id = id + '-val';
    valLabel.textContent = String(val);

    slider.addEventListener('input', function () {
      var v = parseFloat(slider.value);
      valLabel.textContent = String(Math.round(v));
      onChange(v);
    });

    wrap.appendChild(slider);
    wrap.appendChild(valLabel);
    row.appendChild(label);
    row.appendChild(wrap);
    return row;
  }

  function _makeToggleRow(labelText, id, initialVal, onChange) {
    var row = document.createElement('div');
    row.className = 'pm-setting-row';
    row.style.display = 'flex';
    row.style.alignItems = 'center';
    row.style.justifyContent = 'space-between';

    var label = document.createElement('div');
    label.className = 'pm-setting-label';
    label.style.marginBottom = '0';
    label.textContent = labelText;

    var toggle = document.createElement('span');
    toggle.className = 'pm-toggle' + (initialVal ? ' on' : '');
    toggle.id = id;

    var state = initialVal;
    toggle.addEventListener('click', function () {
      state = !state;
      if (state) {
        toggle.className = 'pm-toggle on';
      } else {
        toggle.className = 'pm-toggle';
      }
      onChange(state);
    });

    row.appendChild(label);
    row.appendChild(toggle);
    return row;
  }

  function _saveCurrentSettings() {
    var masterEl = document.getElementById('pm-master-vol');
    var musicEl  = document.getElementById('pm-music-vol');
    var sensEl   = document.getElementById('pm-sensitivity');
    var shadowEl = document.getElementById('pm-shadows');
    var fovEl    = document.getElementById('pm-fov');

    var s = {
      masterVolume: masterEl ? parseFloat(masterEl.value) : 50,
      musicVolume:  musicEl  ? parseFloat(musicEl.value)  : 50,
      sensitivity:  sensEl   ? parseFloat(sensEl.value)   : 5,
      shadows:      shadowEl ? shadowEl.classList.contains('on') : true,
      fov:          fovEl    ? parseFloat(fovEl.value)    : 75
    };
    _saveSettings(s);
    // Apply globals
    window._masterVolume  = s.masterVolume / 100;
    window._musicVolume   = s.musicVolume  / 100;
    window._shadowsEnabled = s.shadows;
  }

  // ── Controls panel ─────────────────────────────────────────────────────────
  function _buildControlsPanel() {
    var panel = document.createElement('div');
    panel.id = 'pm-controls';
    panel.className = 'pm-sub';
    panel.style.display = 'none';

    panel.innerHTML = '<div class="pm-sub-title">&#128275; CONTROLS</div>';

    var binds = [
      ['WASD',         'Move'],
      ['Shift',        'Sprint'],
      ['Space',        'Jump'],
      ['Ctrl',         'Crouch / Prone'],
      ['Left Click',   'Fire'],
      ['Right Click',  'Aim / ADS'],
      ['R',            'Reload'],
      ['G',            'Grenade / IED'],
      ['T',            'Gas Mask'],
      ['V',            'Knife'],
      ['N',            'Night Vision'],
      ['M',            'Mortar'],
      ['C',            'Claymore'],
      ['Tab',          'Weapon Skin'],
      ['P',            'Stats'],
      ['F1',           'Weapon Codex'],
      ['Z',            'Smoke Grenade'],
      ['X',            'Flashbang']
    ];

    var table = document.createElement('table');
    table.className = 'pm-controls-table';

    for (var i = 0; i < binds.length; i++) {
      var tr = document.createElement('tr');
      var tdKey = document.createElement('td');
      var tdDesc = document.createElement('td');
      tdKey.textContent  = binds[i][0];
      tdDesc.textContent = '— ' + binds[i][1];
      tr.appendChild(tdKey);
      tr.appendChild(tdDesc);
      table.appendChild(tr);
    }

    panel.appendChild(table);

    var backBtn = _makeBtn('[ BACK ]', false, function () {
      _closeSubPanel();
    });
    backBtn.style.marginTop = '16px';
    panel.appendChild(backBtn);

    return panel;
  }

  // ── Confirm (Abandon) panel ─────────────────────────────────────────────────
  function _buildConfirmPanel() {
    var panel = document.createElement('div');
    panel.id = 'pm-confirm-panel';
    panel.className = 'pm-sub';
    panel.style.display = 'none';

    var inner = document.createElement('div');
    inner.id = 'pm-confirm';

    var msg = document.createElement('div');
    msg.id = 'pm-confirm-msg';
    msg.textContent = 'ABANDON MISSION?';

    var sub = document.createElement('div');
    sub.id = 'pm-confirm-sub';
    sub.textContent = 'Progress will be lost. This cannot be undone.';

    var btnWrap = document.createElement('div');
    btnWrap.id = 'pm-confirm-btns';

    var confirmBtn = _makeBtn('[ CONFIRM ]', true, function () {
      location.reload();
    });
    var cancelBtn = _makeBtn('[ CANCEL ]', false, function () {
      _closeSubPanel();
    });

    btnWrap.appendChild(confirmBtn);
    btnWrap.appendChild(cancelBtn);
    inner.appendChild(msg);
    inner.appendChild(sub);
    inner.appendChild(btnWrap);
    panel.appendChild(inner);

    return panel;
  }

  // ── Sub-panel open/close ───────────────────────────────────────────────────
  function _openSubPanel(name) {
    _closeSubPanel();
    _currentSubPanel = name;
    if (name === 'settings') {
      _settingsPanel.style.display = 'block';
    } else if (name === 'controls') {
      _controlsPanel.style.display = 'block';
    } else if (name === 'confirm') {
      _confirmPanel.style.display = 'block';
    }
  }

  function _closeSubPanel() {
    if (_settingsPanel) _settingsPanel.style.display = 'none';
    if (_controlsPanel) _controlsPanel.style.display = 'none';
    if (_confirmPanel)  _confirmPanel.style.display  = 'none';
    _currentSubPanel = null;
  }

  // ── Show / Hide ────────────────────────────────────────────────────────────
  function show() {
    if (_visible) return;
    _visible = true;
    window._gamePaused = true;

    // Release pointer lock
    if (document.exitPointerLock) {
      document.exitPointerLock();
    }

    // Reset card animation
    if (_card) {
      _card.style.animation = 'none';
      // Trigger reflow
      void _card.offsetWidth;
      _card.style.animation = '';
    }

    _closeSubPanel();
    _overlay.style.display = 'flex';
  }

  function hide() {
    if (!_visible) return;
    _visible = false;
    window._gamePaused = false;
    _overlay.style.display = 'none';
    _closeSubPanel();

    // Re-acquire pointer lock on the canvas
    var canvas = document.querySelector('canvas');
    if (canvas && canvas.requestPointerLock) {
      canvas.requestPointerLock();
    }
  }

  function _hideWithFlash() {
    // White flash then hide
    var flash = document.getElementById('pm-flash');
    if (flash) {
      flash.style.transition = 'none';
      flash.style.opacity = '0';
      void flash.offsetWidth;
      flash.style.transition = 'opacity 0.35s ease-out';
      flash.style.opacity = '1';
      setTimeout(function () {
        flash.style.opacity = '0';
      }, 80);
    }
    hide();
  }

  function isVisible() {
    return _visible;
  }

  function toggle() {
    if (_visible) {
      hide();
    } else {
      show();
    }
  }

  // ── Keyboard listener ──────────────────────────────────────────────────────
  function _onKeyDown(e) {
    if (e.key === 'Escape' || e.keyCode === 27) {
      // If a sub-panel is open, close it instead of closing the whole menu
      if (_visible && _currentSubPanel) {
        _closeSubPanel();
        return;
      }
      toggle();
    }
  }

  // ── Init ───────────────────────────────────────────────────────────────────
  function init() {
    if (document.getElementById('pm-overlay')) return; // already inited
    _injectStyles();
    _buildDOM();

    // Apply saved settings to globals on init
    var s = _loadSettings();
    window._masterVolume   = s.masterVolume / 100;
    window._musicVolume    = s.musicVolume  / 100;
    window._shadowsEnabled = s.shadows;

    document.addEventListener('keydown', _onKeyDown, false);
  }

  // Auto-init when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  return {
    init:      init,
    show:      show,
    hide:      hide,
    isVisible: isVisible,
    toggle:    toggle
  };

})();
