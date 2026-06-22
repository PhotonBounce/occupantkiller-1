/* ============================================================
 *  WEAPON-WHEEL.JS — Radial weapon selection overlay
 *
 *  Hold Alt to open an 8-slot circular weapon wheel.
 *  Mouse position determines the highlighted sector.
 *  Release Alt to confirm selection.
 *
 *  Reads:
 *    window._currentWeapons  — array of weapon name strings (optional)
 *    window._weaponKills     — { [name]: number } kill counts (optional)
 *    window._isSprinting     — bool guard (don't open while sprinting)
 *    window._isDead          — bool guard (don't open while dead)
 *    window._isPaused        — bool guard (don't open while paused)
 *
 *  Writes:
 *    window._timeScale       — set to 0.4 while wheel open, 1 on close
 *    window._selectedWeapon  — string: currently selected weapon name
 *
 *  Public API: init(), update(), reset()
 * ============================================================ */
window.WeaponWheel = (function () {
  'use strict';

  // ── Config ──────────────────────────────────────────────────
  var WHEEL_SIZE    = 360;   // px, total circle diameter
  var SLOT_COUNT    = 8;
  var SLOT_SIZE     = 60;    // px, icon area
  var SLOW_SCALE    = 0.4;
  var FADE_DURATION = 0.1;   // seconds (matches CSS transition)

  var DEFAULT_WEAPONS = ['AK74', 'M16', 'GLOCK', 'MOSSBERG', 'DRAGUNOV', 'RPG', 'M249', 'KNIFE'];

  // Emoji icons for each default weapon slot (fallback)
  var WEAPON_ICONS = {
    'AK74':     '🔫',
    'M16':      '🪖',
    'GLOCK':    '🔫',
    'MOSSBERG': '🔫',
    'DRAGUNOV': '🎯',
    'RPG':      '💥',
    'M249':     '🔫',
    'KNIFE':    '🔪'
  };

  // ── State ────────────────────────────────────────────────────
  var _open          = false;
  var _hoveredSlot   = -1;   // 0-7
  var _selectedSlot  = 0;    // confirmed slot index
  var _mouseX        = 0;
  var _mouseY        = 0;

  // ── DOM refs ─────────────────────────────────────────────────
  var _overlayEl   = null;
  var _circleEl    = null;
  var _slotEls     = [];
  var _centerEl    = null;
  var _initialized = false;

  // ── Internal helpers ─────────────────────────────────────────
  function _getWeapons() {
    if (window._currentWeapons && window._currentWeapons.length > 0) {
      return window._currentWeapons.slice(0, SLOT_COUNT);
    }
    return DEFAULT_WEAPONS;
  }

  function _getSelectedName() {
    var weapons = _getWeapons();
    return weapons[_selectedSlot] || weapons[0] || 'NONE';
  }

  function _isBlocked() {
    if (window._isSprinting) return true;
    if (window._isDead)      return true;
    if (window._isPaused)    return true;
    return false;
  }

  // Convert slot index (0-7) to CSS transform position around a 360px circle.
  // Slot 0 is at top (270deg), slots go clockwise.
  function _slotPosition(i) {
    var angleDeg = (i / SLOT_COUNT) * 360 - 90; // start at top
    var angleRad = angleDeg * Math.PI / 180;
    var radius   = WHEEL_SIZE / 2 - SLOT_SIZE / 2 - 4; // 4px inner padding
    var cx = Math.cos(angleRad) * radius;
    var cy = Math.sin(angleRad) * radius;
    return { x: cx, y: cy };
  }

  // Determine which slot the mouse is hovering based on angle from center.
  function _angleToSlot(dx, dy) {
    var angle = Math.atan2(dy, dx); // -PI to PI, 0 = right
    // Convert so 0 = top (subtract 90 deg = -PI/2)
    angle = angle + Math.PI / 2;
    if (angle < 0) angle += 2 * Math.PI;
    // Normalize 0-1
    var norm = angle / (2 * Math.PI);
    return Math.floor(norm * SLOT_COUNT) % SLOT_COUNT;
  }

  // ── DOM construction ─────────────────────────────────────────
  function _buildDOM() {
    // Outer full-screen overlay (pointer-events: none on container, auto on circle)
    _overlayEl = document.createElement('div');
    _overlayEl.id = 'weapon-wheel-overlay';
    _overlayEl.style.cssText = [
      'position:fixed',
      'inset:0',
      'z-index:9000',
      'display:flex',
      'align-items:center',
      'justify-content:center',
      'pointer-events:none',
      'opacity:0',
      'transition:opacity ' + FADE_DURATION + 's ease'
    ].join(';');

    // Circle container
    _circleEl = document.createElement('div');
    _circleEl.id = 'weapon-wheel-circle';
    _circleEl.style.cssText = [
      'position:relative',
      'width:'  + WHEEL_SIZE + 'px',
      'height:' + WHEEL_SIZE + 'px',
      'border-radius:50%',
      'background:rgba(0,0,0,0.72)',
      'border:2px solid rgba(255,255,255,0.18)',
      'pointer-events:auto',
      'box-shadow:0 0 40px rgba(0,0,0,0.6)'
    ].join(';');

    // Build 8 slots
    var weapons = _getWeapons();
    _slotEls = [];
    var half = WHEEL_SIZE / 2;

    for (var i = 0; i < SLOT_COUNT; i++) {
      (function (idx) {
        var pos    = _slotPosition(idx);
        var slotEl = document.createElement('div');
        slotEl.className = 'ww-slot';
        slotEl.style.cssText = [
          'position:absolute',
          'width:'  + SLOT_SIZE + 'px',
          'height:' + SLOT_SIZE + 'px',
          'left:'   + (half + pos.x - SLOT_SIZE / 2) + 'px',
          'top:'    + (half + pos.y - SLOT_SIZE / 2) + 'px',
          'border-radius:50%',
          'background:rgba(30,30,30,0.7)',
          'border:1px solid rgba(255,255,255,0.2)',
          'display:flex',
          'flex-direction:column',
          'align-items:center',
          'justify-content:center',
          'cursor:pointer',
          'transition:background 0.08s,border-color 0.08s,box-shadow 0.08s',
          'user-select:none',
          'font-family:monospace'
        ].join(';');

        // Icon
        var iconEl = document.createElement('div');
        iconEl.className = 'ww-slot-icon';
        iconEl.style.cssText = 'font-size:20px;line-height:1;pointer-events:none';
        var wname = weapons[idx] || DEFAULT_WEAPONS[idx] || '?';
        iconEl.textContent = WEAPON_ICONS[wname] || '🔫';

        // Label
        var labelEl = document.createElement('div');
        labelEl.className = 'ww-slot-label';
        labelEl.style.cssText = [
          'font-size:8px',
          'color:#ccc',
          'margin-top:2px',
          'letter-spacing:0.5px',
          'pointer-events:none',
          'text-align:center',
          'max-width:' + (SLOT_SIZE - 4) + 'px',
          'overflow:hidden',
          'white-space:nowrap'
        ].join(';');
        labelEl.textContent = wname;

        // Kill badge
        var badgeEl = document.createElement('div');
        badgeEl.className = 'ww-slot-badge';
        badgeEl.style.cssText = [
          'position:absolute',
          'top:2px',
          'right:2px',
          'background:#ff4444',
          'color:#fff',
          'font-size:7px',
          'padding:1px 3px',
          'border-radius:6px',
          'font-family:monospace',
          'pointer-events:none',
          'display:none'
        ].join(';');

        slotEl.appendChild(iconEl);
        slotEl.appendChild(labelEl);
        slotEl.appendChild(badgeEl);
        _circleEl.appendChild(slotEl);
        _slotEls.push({ el: slotEl, badge: badgeEl, label: labelEl, icon: iconEl });
      })(i);
    }

    // Center label (shows selected weapon name)
    _centerEl = document.createElement('div');
    _centerEl.id = 'weapon-wheel-center';
    _centerEl.style.cssText = [
      'position:absolute',
      'left:50%',
      'top:50%',
      'transform:translate(-50%,-50%)',
      'color:#fff',
      'font-size:11px',
      'font-family:monospace',
      'letter-spacing:1px',
      'text-align:center',
      'pointer-events:none',
      'text-shadow:0 0 8px rgba(255,255,255,0.5)',
      'white-space:nowrap'
    ].join(';');
    _centerEl.textContent = _getSelectedName();
    _circleEl.appendChild(_centerEl);

    _overlayEl.appendChild(_circleEl);
    document.body.appendChild(_overlayEl);
  }

  // ── Slot highlight refresh ────────────────────────────────────
  function _refreshSlots() {
    var weapons = _getWeapons();
    for (var i = 0; i < _slotEls.length; i++) {
      var entry  = _slotEls[i];
      var el     = entry.el;
      var isHov  = (i === _hoveredSlot);
      var isSel  = (i === _selectedSlot);

      if (isHov) {
        el.style.background   = 'rgba(255,255,255,0.18)';
        el.style.borderColor  = 'rgba(255,255,255,0.7)';
        el.style.boxShadow    = '0 0 16px rgba(255,255,255,0.35)';
      } else if (isSel) {
        el.style.background   = 'rgba(255,255,255,0.10)';
        el.style.borderColor  = 'rgba(255,255,255,1)';
        el.style.boxShadow    = '0 0 12px rgba(255,255,255,0.6)';
      } else {
        el.style.background   = 'rgba(30,30,30,0.7)';
        el.style.borderColor  = 'rgba(255,255,255,0.2)';
        el.style.boxShadow    = 'none';
      }

      // Update kill badge
      var wname = weapons[i] || '';
      var kills = (window._weaponKills && window._weaponKills[wname]) || 0;
      if (kills > 0) {
        entry.badge.style.display = 'block';
        entry.badge.textContent   = kills > 999 ? '999+' : String(kills);
      } else {
        entry.badge.style.display = 'none';
      }

      // Update weapon name & icon in case _currentWeapons changed
      var icon  = WEAPON_ICONS[wname] || '🔫';
      entry.icon.textContent  = icon;
      entry.label.textContent = wname;
    }

    // Update center label
    if (_centerEl) {
      var hovName = (weapons[_hoveredSlot] !== undefined) ? weapons[_hoveredSlot] : _getSelectedName();
      _centerEl.textContent = hovName;
    }
  }

  // ── Open / close ─────────────────────────────────────────────
  function _openWheel() {
    if (_open) return;
    if (_isBlocked()) return;
    _open = true;
    window._timeScale = SLOW_SCALE;
    _refreshSlots();
    if (_overlayEl) {
      _overlayEl.style.pointerEvents = 'auto';
      _overlayEl.style.opacity = '1';
    }
  }

  function _closeWheel(confirm) {
    if (!_open) return;
    _open = false;
    window._timeScale = 1;
    if (_overlayEl) {
      _overlayEl.style.pointerEvents = 'none';
      _overlayEl.style.opacity = '0';
    }
    if (confirm && _hoveredSlot >= 0) {
      _selectedSlot = _hoveredSlot;
      var weapons = _getWeapons();
      window._selectedWeapon = weapons[_selectedSlot] || _getSelectedName();
    }
    _hoveredSlot = -1;
  }

  // ── Mouse tracking ───────────────────────────────────────────
  function _onMouseMove(e) {
    _mouseX = e.clientX;
    _mouseY = e.clientY;
    if (!_open || !_circleEl) return;

    var rect = _circleEl.getBoundingClientRect();
    var cx   = rect.left + rect.width  / 2;
    var cy   = rect.top  + rect.height / 2;
    var dx   = _mouseX - cx;
    var dy   = _mouseY - cy;
    var dist = Math.sqrt(dx * dx + dy * dy);

    // Only register hover if outside a small dead zone in the center (24px)
    if (dist < 24) {
      _hoveredSlot = -1;
    } else {
      _hoveredSlot = _angleToSlot(dx, dy);
    }
    _refreshSlots();
  }

  // ── Keyboard handlers ────────────────────────────────────────
  function _onKeyDown(e) {
    if (e.code === 'AltLeft' || e.code === 'AltRight') {
      e.preventDefault();
      _openWheel();
    }
  }

  function _onKeyUp(e) {
    if (e.code === 'AltLeft' || e.code === 'AltRight') {
      e.preventDefault();
      _closeWheel(true);
    }
  }

  // ── Public API ───────────────────────────────────────────────
  function init() {
    if (_initialized) return;
    _initialized = true;

    _buildDOM();

    document.addEventListener('keydown',   _onKeyDown, false);
    document.addEventListener('keyup',     _onKeyUp,   false);
    document.addEventListener('mousemove', _onMouseMove, false);

    // Seed selected slot from existing state if available
    if (window._selectedWeapon) {
      var weapons = _getWeapons();
      for (var i = 0; i < weapons.length; i++) {
        if (weapons[i] === window._selectedWeapon) {
          _selectedSlot = i;
          break;
        }
      }
    }

    // Default timeScale if unset
    if (typeof window._timeScale === 'undefined') {
      window._timeScale = 1;
    }
  }

  function update() {
    // Nothing heavy needed per-frame; mouse/key events drive the wheel.
    // Re-refresh slots each frame while open to pick up dynamic kill counts.
    if (_open) {
      _refreshSlots();
    }
  }

  function reset() {
    _closeWheel(false);
    _selectedSlot = 0;
    _hoveredSlot  = -1;
    if (typeof window._timeScale !== 'undefined') {
      window._timeScale = 1;
    }
  }

  return { init: init, update: update, reset: reset };

})();
