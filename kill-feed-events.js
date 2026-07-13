/* kill-feed-events.js — Enhanced military-style kill feed event log
 * Top-right corner, 8 events max, each fades after 4s.
 * All var, no let/const. IIFE pattern.
 */

window.KillFeedEvents = (function () {
  'use strict';

  /* ── Configuration ─────────────────────────────────────────── */
  var MAX_ENTRIES   = 8;
  var DISPLAY_MS    = 4000;    // base display time (ms)
  var SLIDE_MS      = 200;     // slide-in transition (ms)
  var FADE_AFTER_MS = 3500;    // when opacity begins fading
  var FADE_DUR_MS   = 500;     // opacity transition duration

  /* ── State ─────────────────────────────────────────────────── */
  var _container    = null;
  var _totalKills   = 0;       // for 5-kill divider
  var _stylesInjected = false;

  /* ── Default enabled flag ───────────────────────────────────── */
  if (typeof window._killFeedEnabled === 'undefined') {
    window._killFeedEnabled = true;
  }

  /* ── Weapon icon map ────────────────────────────────────────── */
  var WEAPON_ICONS = {
    knife:     '🔪',
    melee:     '🔪',
    bayonet:   '🔪',
    shovel:    '🔪',
    launcher:  '🚀',
    rpg:       '🚀',
    rocket:    '🚀',
    missile:   '🚀',
    stinger:   '🚀',
    grenade:   '💥',
    explosive: '💥',
    mortar:    '💥',
    c4:        '💥',
    claymore:  '💥',
    mine:      '💥',
    artillery: '💥',
    frag:      '💥',
    vehicle:   '🚗',
    tank:      '🚗',
    car:       '🚗',
    truck:     '🚗',
    drone:     '✈'
  };

  function _weaponIcon(weapon) {
    if (!weapon) return '🔫';
    var w = String(weapon).toLowerCase();
    if (WEAPON_ICONS[w]) return WEAPON_ICONS[w];
    for (var key in WEAPON_ICONS) {
      if (WEAPON_ICONS.hasOwnProperty(key) && w.indexOf(key) !== -1) {
        return WEAPON_ICONS[key];
      }
    }
    return '🔫';
  }

  /* ── Timestamp helper ───────────────────────────────────────── */
  function _timestamp() {
    var d = new Date();
    var h = d.getHours();
    var m = d.getMinutes();
    var s = d.getSeconds();
    return '[' +
      (h < 10 ? '0' : '') + h + ':' +
      (m < 10 ? '0' : '') + m + ':' +
      (s < 10 ? '0' : '') + s + ']';
  }

  /* ── Inject stylesheet once ─────────────────────────────────── */
  function _injectStyles() {
    if (_stylesInjected) return;
    _stylesInjected = true;
    if (document.getElementById('kfe-style')) return;
    var st = document.createElement('style');
    st.id = 'kfe-style';
    st.textContent = [
      '@keyframes kfeSlideIn {',
      '  from { transform: translateX(100px); opacity: 0; }',
      '  to   { transform: translateX(0);     opacity: 1; }',
      '}',
      '@keyframes kfeBossFlash {',
      '  0%,100% { background: rgba(120,0,0,0.65); }',
      '  40%     { background: rgba(255,40,0,0.75); }',
      '}',
      '#kfe-container {',
      '  position: fixed;',
      '  top: 80px;',
      '  right: 15px;',
      '  width: 300px;',
      '  z-index: 203;',
      '  pointer-events: none;',
      '  display: flex;',
      '  flex-direction: column;',
      '  gap: 3px;',
      '}',
      '.kfe-entry {',
      '  background: rgba(0,0,0,0.60);',
      '  padding: 3px 8px;',
      '  font-family: monospace;',
      '  font-size: 11px;',
      '  border-radius: 3px;',
      '  color: #fff;',
      '  animation: kfeSlideIn ' + (SLIDE_MS / 1000) + 's ease-out;',
      '  transition: opacity ' + (FADE_DUR_MS / 1000) + 's;',
      '  overflow: hidden;',
      '  white-space: nowrap;',
      '  text-overflow: ellipsis;',
      '  line-height: 1.5;',
      '  border-left: 2px solid rgba(255,255,255,0.15);',
      '}',
      '.kfe-entry.kfe-fading {',
      '  opacity: 0;',
      '}',
      '.kfe-boss {',
      '  font-size: 13px;',
      '  font-weight: bold;',
      '  border-left: 3px solid #ff3333;',
      '  animation: kfeSlideIn ' + (SLIDE_MS / 1000) + 's ease-out, kfeBossFlash 0.6s ease-in-out 0.1s 3;',
      '}',
      '.kfe-divider {',
      '  text-align: center;',
      '  color: #888;',
      '  font-size: 10px;',
      '  letter-spacing: 2px;',
      '  background: rgba(0,0,0,0.4);',
      '  border-left: none;',
      '}',
      '.kfe-ts {',
      '  color: #555;',
      '  font-size: 10px;',
      '  margin-right: 4px;',
      '}',
    ].join('\n');
    document.head.appendChild(st);
  }

  /* ── Get or create container ────────────────────────────────── */
  function _getContainer() {
    if (_container && _container.parentNode) return _container;
    _container = document.getElementById('kfe-container');
    if (!_container) {
      _container = document.createElement('div');
      _container.id = 'kfe-container';
      document.body.appendChild(_container);
    }
    return _container;
  }

  /* ── Trim to MAX_ENTRIES ────────────────────────────────────── */
  function _trim() {
    var c = _getContainer();
    while (c.children.length > MAX_ENTRIES) {
      c.removeChild(c.firstChild);
    }
  }

  /* ── Schedule fade + removal ────────────────────────────────── */
  function _scheduleRemove(el, duration) {
    var dur = duration || DISPLAY_MS;
    var fadeDelay = (dur <= FADE_DUR_MS) ? 0 : (dur - FADE_DUR_MS);
    setTimeout(function () {
      el.classList.add('kfe-fading');
      setTimeout(function () {
        if (el.parentNode) el.parentNode.removeChild(el);
      }, FADE_DUR_MS);
    }, fadeDelay);
  }

  /* ── Play confirm tick sound ────────────────────────────────── */
  function _playTick() {
    try {
      if (typeof AudioContext === 'undefined' && typeof webkitAudioContext === 'undefined') return;
      var Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      var ctx = new Ctx();
      var osc = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 50;
      gain.gain.setValueAtTime(0.02, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.08);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.08);
    } catch (e) {
      // audio not available — silent fail
    }
  }

  /* ── Append a raw entry div ─────────────────────────────────── */
  function _append(html, extraClass, duration) {
    _injectStyles();
    if (!window._killFeedEnabled) return null;
    var c = _getContainer();
    var div = document.createElement('div');
    div.className = 'kfe-entry' + (extraClass ? ' ' + extraClass : '');
    div.innerHTML = html;
    c.appendChild(div);
    _trim();
    _scheduleRemove(div, duration || DISPLAY_MS);
    return div;
  }

  /* ── 5-kill divider logic ───────────────────────────────────── */
  function _checkMilestone(killCount) {
    if (killCount > 0 && killCount % 5 === 0) {
      var divHtml = '--- ' + killCount + ' KILLS ---';
      _append(divHtml, 'kfe-divider', DISPLAY_MS);
    }
  }

  /* ── Multi-kill label from streak ──────────────────────────── */
  function _multiKillLabel(streak) {
    if (streak >= 5) return '💀\xd7' + streak + ' MEGA KILL';
    if (streak === 4) return '💀\xd74 ULTRA KILL';
    if (streak === 3) return '💀\xd73 TRIPLE KILL';
    if (streak === 2) return '💀\xd72 DOUBLE KILL';
    return null;
  }

  /* ══════════════════════════════════════════════════════════════
     Public API
  ══════════════════════════════════════════════════════════════ */

  /**
   * init() — call once after DOM ready (auto-called on DOMContentLoaded too).
   */
  function init() {
    _injectStyles();
    _getContainer();
  }

  /**
   * update(delta) — called each frame from game loop (no-op for now; reserved).
   */
  function update(delta) {
    // no per-frame work needed; fade is CSS-driven
  }

  /**
   * addKill(type, weapon)
   *   type   — 'kill' | 'headshot' | 'boss' | 'friendly' | 'player_death' |
   *             'explosive' | 'vehicle' | 'multi'
   *   weapon — weapon id string (optional)
   */
  function addKill(type, weapon) {
    _injectStyles();
    if (!window._killFeedEnabled) return;

    var ts = _timestamp();
    var tsSpan = '<span class="kfe-ts">' + ts + '</span>';
    var icon = _weaponIcon(weapon);
    var streak = (typeof window._headshotStreak === 'number') ? window._headshotStreak : 0;
    var html, extraClass, duration;
    duration = DISPLAY_MS;

    if (type === 'headshot') {
      _totalKills++;
      html = tsSpan + '&#127919; <span style="color:#ffee00;font-weight:bold">HEADSHOT KILL</span>';
      extraClass = '';
      _playTick();
      _checkMilestone(_totalKills);

    } else if (type === 'boss') {
      html = tsSpan + '&#9760; <span style="color:#ff3333;font-weight:bold;font-size:13px">BOSS ELIMINATED</span>';
      extraClass = 'kfe-boss';
      duration = 8000;
      _playTick();

    } else if (type === 'friendly') {
      html = tsSpan + '&#9888; <span style="color:#ff8800;font-weight:bold">FRIENDLY FIRE</span>';
      extraClass = '';

    } else if (type === 'player_death') {
      html = tsSpan + '&#128128; <span style="color:#ff3333;font-weight:bold">PLAYER DOWN</span>';
      extraClass = '';

    } else if (type === 'explosive') {
      _totalKills++;
      html = tsSpan + '&#128165; <span style="color:#ff8800;font-weight:bold">FRAG KILL</span>';
      extraClass = '';
      _playTick();
      _checkMilestone(_totalKills);

    } else if (type === 'vehicle') {
      _totalKills++;
      html = tsSpan + '&#128663; <span style="color:#ffee00;font-weight:bold">VEHICLE DESTROYED</span>';
      extraClass = '';
      _playTick();
      _checkMilestone(_totalKills);

    } else if (type === 'multi') {
      var label = _multiKillLabel(streak) || ('&#128128;\xd7' + Math.max(streak, 2) + ' MULTI KILL');
      html = tsSpan + '<span style="color:#ffd700;font-weight:bold">' + label + '</span>';
      extraClass = '';
      _playTick();

    } else {
      /* default: standard kill */
      _totalKills++;
      var multiLabel = (streak >= 2) ? _multiKillLabel(streak) : null;
      if (multiLabel) {
        html = tsSpan + '<span style="color:#ffd700;font-weight:bold">' + multiLabel + '</span>';
      } else {
        html = tsSpan + icon + ' <span style="color:#44ff88;font-weight:bold">ENEMY ELIMINATED</span>';
      }
      extraClass = '';
      _playTick();
      _checkMilestone(_totalKills);
    }

    _append(html, extraClass, duration);
  }

  /**
   * addEvent(text, color, icon, duration)
   *   Generic event — usable by any system.
   */
  function addEvent(text, color, icon, duration) {
    _injectStyles();
    if (!window._killFeedEnabled) return;
    var ts = _timestamp();
    var tsSpan = '<span class="kfe-ts">' + ts + '</span>';
    var c = color || '#ffcc00';
    var ic = icon ? (icon + ' ') : '';
    var html = tsSpan + ic + '<span style="color:' + c + '">' + text + '</span>';
    _append(html, '', duration || DISPLAY_MS);
  }

  /**
   * reset() — clear all visible entries and reset kill counter.
   */
  function reset() {
    _totalKills = 0;
    var c = _getContainer();
    if (c) {
      while (c.firstChild) c.removeChild(c.firstChild);
    }
  }

  /* ── Hook window._onEnemyKilled (chain) ─────────────────────── */
  var _prevOnEnemyKilled = window._onEnemyKilled || null;
  window._onEnemyKilled = function (enemyType, weapon, isHeadshot) {
    // Call prior handler first
    if (typeof _prevOnEnemyKilled === 'function') {
      _prevOnEnemyKilled(enemyType, weapon, isHeadshot);
    }
    // Determine kill type
    if (isHeadshot) {
      addKill('headshot', weapon);
    } else if (enemyType && (String(enemyType).toUpperCase().indexOf('BOSS') !== -1)) {
      addKill('boss', weapon);
    } else if (weapon && (String(weapon).toLowerCase() === 'grenade' ||
                          String(weapon).toLowerCase() === 'explosive' ||
                          String(weapon).toLowerCase() === 'frag' ||
                          String(weapon).toLowerCase().indexOf('mortar') !== -1 ||
                          String(weapon).toLowerCase().indexOf('artillery') !== -1)) {
      addKill('explosive', weapon);
    } else if (weapon && (String(weapon).toLowerCase().indexOf('vehicle') !== -1 ||
                          String(weapon).toLowerCase().indexOf('tank') !== -1)) {
      addKill('vehicle', weapon);
    } else {
      addKill('kill', weapon);
    }
  };

  /* Built-in event helpers for external systems */
  window._kfeAddEvent = function (text, color, icon, duration) {
    addEvent(text, color, icon, duration);
  };

  /* Supply cache found */
  window._kfeSupplyFound = function () {
    addEvent('CACHE FOUND', '#4499ff', '&#128230;', DISPLAY_MS);
  };

  /* Player death */
  window._kfePlayerDeath = function () {
    addKill('player_death', null);
  };

  /* Friendly fire */
  window._kfeFriendlyFire = function () {
    addKill('friendly', null);
  };

  /* ── Auto-init when DOM is ready ─────────────────────────────── */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  return { init: init, update: update, addKill: addKill, addEvent: addEvent, reset: reset };

})();
