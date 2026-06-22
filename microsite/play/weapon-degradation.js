window.WeaponDegradation = (function () {
  'use strict';

  var _conditions = {};
  var _jammingClear = false;
  var _rKeyDown = false;
  var _rKeyStart = 0;
  var _hudEl = null;
  var _jamMsgEl = null;
  var _jamBarEl = null;
  var _jamBarWrapEl = null;
  var _jamClearedEl = null;
  var _toastEl = null;
  var _flashInterval = null;

  var WEAPON_DEGRADE = {
    AK74: 0.06,
    MG3: 0.12,
    MOSSBERG: 0.15
  };
  var DEFAULT_DEGRADE = 0.08;

  function _getDegrade(weaponType) {
    var base = WEAPON_DEGRADE[weaponType] !== undefined ? WEAPON_DEGRADE[weaponType] : DEFAULT_DEGRADE;
    var mult = 1.0;
    if (window._weatherType === 'RAIN') { mult = 1.3; }
    if (window._weatherType === 'DUST_STORM') { mult = 1.5; }
    return base * mult;
  }

  function _getCondition(weaponType) {
    if (_conditions[weaponType] === undefined) { _conditions[weaponType] = 100; }
    return _conditions[weaponType];
  }

  function _setCondition(weaponType, val) {
    _conditions[weaponType] = Math.max(0, Math.min(100, val));
  }

  function _conditionState(c) {
    if (c >= 80) { return { label: 'PRISTINE', color: '#00ff00' }; }
    if (c >= 60) { return { label: 'GOOD', color: '#aaff00' }; }
    if (c >= 40) { return { label: 'WORN', color: '#ffff00' }; }
    if (c >= 20) { return { label: 'DAMAGED', color: '#ff8800' }; }
    return { label: 'CRITICAL', color: '#ff0000' };
  }

  function _jamChance(c) {
    if (c > 40) { return 0; }
    if (c > 20) { return 0.005 + (40 - c) / 20 * 0.025; }
    return 0.03 + (20 - c) / 20 * 0.07;
  }

  function _playJamSound() {
    try {
      var ctx = new (window.AudioContext || window.webkitAudioContext)();
      var clicks = 6;
      var interval = 0.05;
      var i;
      for (i = 0; i < clicks; i++) {
        var osc = ctx.createOscillator();
        var gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = 300;
        osc.type = 'square';
        gain.gain.setValueAtTime(0.3, ctx.currentTime + i * interval);
        gain.gain.linearRampToValueAtTime(0, ctx.currentTime + i * interval + 0.03);
        osc.start(ctx.currentTime + i * interval);
        osc.stop(ctx.currentTime + i * interval + 0.04);
      }
    } catch (e) {}
  }

  function _showJamMsg() {
    if (_jamMsgEl) { _jamMsgEl.style.display = 'block'; }
  }

  function _hideJamMsg() {
    if (_jamMsgEl) { _jamMsgEl.style.display = 'none'; }
  }

  function _showJamBar(pct) {
    if (_jamBarWrapEl) {
      _jamBarWrapEl.style.display = 'block';
      _jamBarEl.style.width = (pct * 100) + '%';
    }
  }

  function _hideJamBar() {
    if (_jamBarWrapEl) { _jamBarWrapEl.style.display = 'none'; }
  }

  function _showJamCleared() {
    if (_jamClearedEl) {
      _jamClearedEl.style.display = 'block';
      setTimeout(function () { _jamClearedEl.style.display = 'none'; }, 2000);
    }
  }

  function _showToast(msg) {
    if (_toastEl) {
      _toastEl.textContent = msg;
      _toastEl.style.display = 'block';
      _toastEl.style.opacity = '1';
      setTimeout(function () {
        _toastEl.style.opacity = '0';
        setTimeout(function () { _toastEl.style.display = 'none'; }, 600);
      }, 2000);
    }
  }

  function _startFlash() {
    if (_flashInterval) { return; }
    var vis = true;
    _flashInterval = setInterval(function () {
      if (_hudEl) {
        var dot = _hudEl.querySelector('.wd-dot');
        if (dot) { dot.style.visibility = vis ? 'visible' : 'hidden'; }
      }
      vis = !vis;
    }, 300);
  }

  function _stopFlash() {
    if (_flashInterval) {
      clearInterval(_flashInterval);
      _flashInterval = null;
    }
    if (_hudEl) {
      var dot = _hudEl.querySelector('.wd-dot');
      if (dot) { dot.style.visibility = 'visible'; }
    }
  }

  function _updateHUD() {
    if (!_hudEl) { return; }
    var wt = window._currentWeapon || 'DEFAULT';
    var c = _getCondition(wt);
    window._weaponCondition = c;
    var state = _conditionState(c);
    var dot = _hudEl.querySelector('.wd-dot');
    var lbl = _hudEl.querySelector('.wd-label');
    if (dot) { dot.style.color = state.color; }
    if (lbl) { lbl.textContent = state.label; lbl.style.color = state.color; }
    if (state.label === 'CRITICAL') {
      _startFlash();
    } else {
      _stopFlash();
    }
  }

  function _createHUD() {
    _hudEl = document.createElement('div');
    _hudEl.id = 'wd-hud';
    _hudEl.style.cssText = 'position:fixed;bottom:60px;right:20px;color:#fff;font-family:monospace;font-size:13px;z-index:9999;pointer-events:none;text-align:right;';
    _hudEl.innerHTML = '<span class="wd-dot" style="font-size:16px;">&#9679;</span> <span class="wd-label">PRISTINE</span>';
    document.body.appendChild(_hudEl);

    _jamMsgEl = document.createElement('div');
    _jamMsgEl.id = 'wd-jam-msg';
    _jamMsgEl.textContent = 'WEAPON JAMMED!';
    _jamMsgEl.style.cssText = 'display:none;position:fixed;top:40%;left:50%;transform:translate(-50%,-50%);color:#ff0000;font-family:monospace;font-size:32px;font-weight:bold;z-index:10000;text-shadow:0 0 10px #ff0000;pointer-events:none;';
    document.body.appendChild(_jamMsgEl);

    _jamBarWrapEl = document.createElement('div');
    _jamBarWrapEl.id = 'wd-jam-bar-wrap';
    _jamBarWrapEl.style.cssText = 'display:none;position:fixed;top:50%;left:50%;transform:translate(-50%,20px);width:200px;height:12px;background:#333;border:1px solid #fff;z-index:10000;border-radius:4px;overflow:hidden;';
    _jamBarEl = document.createElement('div');
    _jamBarEl.style.cssText = 'height:100%;width:0%;background:#00ff88;transition:width 0.05s linear;';
    _jamBarWrapEl.appendChild(_jamBarEl);
    document.body.appendChild(_jamBarWrapEl);

    _jamClearedEl = document.createElement('div');
    _jamClearedEl.id = 'wd-jam-cleared';
    _jamClearedEl.textContent = 'JAM CLEARED';
    _jamClearedEl.style.cssText = 'display:none;position:fixed;top:40%;left:50%;transform:translate(-50%,-50%);color:#00ff88;font-family:monospace;font-size:28px;font-weight:bold;z-index:10000;pointer-events:none;';
    document.body.appendChild(_jamClearedEl);

    _toastEl = document.createElement('div');
    _toastEl.id = 'wd-toast';
    _toastEl.style.cssText = 'display:none;position:fixed;top:20%;left:50%;transform:translateX(-50%);color:#00ff88;font-family:monospace;font-size:18px;font-weight:bold;z-index:10000;pointer-events:none;transition:opacity 0.6s;';
    document.body.appendChild(_toastEl);
  }

  function _onKeyDown(e) {
    if (e.code === 'KeyR' && !_rKeyDown) {
      if (window._weaponJammed) {
        _rKeyDown = true;
        _rKeyStart = performance.now();
        _jammingClear = true;
      }
    }
  }

  function _onKeyUp(e) {
    if (e.code === 'KeyR') {
      _rKeyDown = false;
      _jammingClear = false;
      _hideJamBar();
    }
  }

  function init() {
    _createHUD();
    document.addEventListener('keydown', _onKeyDown);
    document.addEventListener('keyup', _onKeyUp);
    if (window._cleaningKitAvailable === undefined) {
      window._cleaningKitAvailable = false;
    }
    window._weaponJammed = false;
    window._weaponCondition = 100;
    _updateHUD();
  }

  function update(dt) {
    _updateHUD();
    if (_jammingClear && _rKeyDown && window._weaponJammed) {
      var elapsed = (performance.now() - _rKeyStart) / 1000;
      var pct = Math.min(elapsed / 2.0, 1.0);
      _showJamBar(pct);
      if (pct >= 1.0) {
        _jammingClear = false;
        _rKeyDown = false;
        window._weaponJammed = false;
        _hideJamMsg();
        _hideJamBar();
        _showJamCleared();
      }
    }
    if (window._cleaningKitAvailable && window._waveShopOpen) {
      window._waveShopCleaningKitPrice = 200;
    }
  }

  function onShot(weaponType) {
    if (window._weaponJammed) { return false; }
    var wt = weaponType || window._currentWeapon || 'DEFAULT';
    var degrade = _getDegrade(wt);
    var c = _getCondition(wt);
    c = Math.max(0, c - degrade);
    _setCondition(wt, c);
    window._weaponCondition = c;
    var chance = _jamChance(c);
    if (chance > 0 && Math.random() < chance) {
      window._weaponJammed = true;
      _showJamMsg();
      _playJamSound();
      return false;
    }
    return true;
  }

  function clearJam() {
    window._weaponJammed = false;
    _hideJamMsg();
    _hideJamBar();
    _showJamCleared();
  }

  function _applyCleaningKit() {
    var wt = window._currentWeapon || 'DEFAULT';
    _setCondition(wt, 100);
    window._weaponCondition = 100;
    _showToast('+WEAPON CLEANED');
    _updateHUD();
  }

  function reset() {
    _conditions = {};
    window._weaponCondition = 100;
    window._weaponJammed = false;
    _jammingClear = false;
    _rKeyDown = false;
    _hideJamMsg();
    _hideJamBar();
    _stopFlash();
    _updateHUD();
  }

  window._weaponDegradationApplyCleaningKit = _applyCleaningKit;

  return { init: init, update: update, onShot: onShot, clearJam: clearJam, reset: reset };
})();
