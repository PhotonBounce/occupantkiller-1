/* kill-feed.js — COD-style kill feed, top-right corner
 * Standalone IIFE — no game-manager.js changes required for basic use.
 * All var, no let/const.
 */

window.KillFeed = (function () {

  var MAX_ENTRIES = 6;
  var DISPLAY_MS  = 4000;
  var FADE_MS     = 300;
  var _feedEl     = null;

  /* ── inject stylesheet once ───────────────────────────── */
  function _injectStyles() {
    if (document.getElementById('kf-style')) return;
    var st = document.createElement('style');
    st.id = 'kf-style';
    st.textContent = [
      '@keyframes kfSlideIn {',
      '  from { transform: translateX(100%); opacity: 0; }',
      '  to   { transform: translateX(0);    opacity: 1; }',
      '}',
      '@keyframes kfGoldFlash {',
      '  0%,100% { background: rgba(0,0,0,0.55); }',
      '  30%     { background: rgba(180,140,0,0.55); }',
      '  60%     { background: rgba(120,80,0,0.45); }',
      '}',
      '#killFeed {',
      '  position: fixed;',
      '  top: 80px;',
      '  right: 15px;',
      '  width: 280px;',
      '  z-index: 202;',
      '  pointer-events: none;',
      '  display: flex;',
      '  flex-direction: column;',
      '  gap: 4px;',
      '}',
      '.kf-entry {',
      '  background: rgba(0,0,0,0.55);',
      '  padding: 4px 8px;',
      '  font-family: monospace;',
      '  font-size: 12px;',
      '  border-radius: 3px;',
      '  color: #fff;',
      '  animation: kfSlideIn 0.2s ease-out;',
      '  transition: opacity ' + (FADE_MS / 1000) + 's;',
      '  overflow: hidden;',
      '  white-space: nowrap;',
      '  text-overflow: ellipsis;',
      '  line-height: 1.5;',
      '}',
      '.kf-entry.kf-fading {',
      '  opacity: 0;',
      '}',
      '.kf-boss {',
      '  font-size: 13px;',
      '  font-weight: bold;',
      '  animation: kfSlideIn 0.2s ease-out, kfGoldFlash 0.8s ease-in-out 0.1s 2;',
      '}',
      '.kf-headshot-tag {',
      '  color: #00e5ff;',
      '  font-weight: bold;',
      '  margin-right: 4px;',
      '}',
      '.kf-streak {',
      '  color: #ffcc00;',
      '  font-weight: bold;',
      '}',
      '.kf-soldier  { color: #ffffff; }',
      '.kf-heavy    { color: #ff8800; font-weight: bold; }',
      '.kf-boss-txt { color: #ff3333; font-weight: bold; }',
    ].join('\n');
    document.head.appendChild(st);
  }

  /* ── create / locate the feed container ───────────────── */
  function _getOrCreateFeed() {
    if (_feedEl && _feedEl.parentNode) return _feedEl;
    _feedEl = document.getElementById('killFeed');
    if (!_feedEl) {
      _feedEl = document.createElement('div');
      _feedEl.id = 'killFeed';
      document.body.appendChild(_feedEl);
    }
    return _feedEl;
  }

  /* ── weapon string → emoji icon ───────────────────────── */
  function _weaponIcon(weapon) {
    if (!weapon) return '🔫';
    var w = String(weapon).toLowerCase();
    if (w === 'knife' || w === 'melee' || w === 'bayonet' || w === 'shovel') return '🔪';
    if (w === 'launcher' || w === 'rpg' || w === 'rocket' || w === 'missile' || w === 'stinger') return '🚀';
    if (w === 'grenade' || w === 'explosive' || w === 'mortar' || w === 'c4' ||
        w === 'claymore' || w === 'mine' || w === 'artillery') return '💥';
    return '🔫';
  }

  /* ── enemy type → CSS class + display label ───────────── */
  function _enemyClass(type) {
    if (!type) return { cls: 'kf-soldier', label: 'ENEMY' };
    var t = String(type).toUpperCase();
    if (t === 'BOSS' || t.indexOf('BOSS') !== -1)   return { cls: 'kf-boss-txt', label: t };
    if (t === 'HEAVY' || t.indexOf('HEAVY') !== -1) return { cls: 'kf-heavy',    label: t };
    return { cls: 'kf-soldier', label: t };
  }

  /* ── trim old entries to MAX_ENTRIES ──────────────────── */
  function _trim() {
    var feed = _getOrCreateFeed();
    while (feed.children.length > MAX_ENTRIES) {
      feed.removeChild(feed.firstChild);
    }
  }

  /* ── schedule fade + removal ──────────────────────────── */
  function _scheduleRemove(el) {
    setTimeout(function () {
      el.classList.add('kf-fading');
      setTimeout(function () {
        if (el.parentNode) el.parentNode.removeChild(el);
      }, FADE_MS);
    }, DISPLAY_MS);
  }

  /* ── append a raw entry div ───────────────────────────── */
  function _append(html, extraClass) {
    var feed = _getOrCreateFeed();
    var div = document.createElement('div');
    div.className = 'kf-entry' + (extraClass ? ' ' + extraClass : '');
    div.innerHTML = html;
    feed.appendChild(div);
    _trim();
    _scheduleRemove(div);
    return div;
  }

  /* ══════════════════════════════════════════════════════
     Public API
  ══════════════════════════════════════════════════════ */

  /**
   * init() — call once after DOM is ready (or not at all — first addKill will auto-init).
   */
  function init() {
    _injectStyles();
    _getOrCreateFeed();
  }

  /**
   * addKill(enemyType, weapon, isHeadshot, bossName)
   *   enemyType  — e.g. 'SOLDIER', 'HEAVY', 'BOSS', 'TANK'
   *   weapon     — weapon id / type string (e.g. 'rifle', 'knife', 'launcher')
   *   isHeadshot — boolean
   *   bossName   — optional; if truthy, render as boss-kill entry
   */
  function addKill(enemyType, weapon, isHeadshot, bossName) {
    _injectStyles();
    var icon = _weaponIcon(weapon);
    var typeStr = (enemyType ? String(enemyType).toUpperCase() : 'ENEMY');

    /* Boss kill — special full-width banner */
    if (bossName || typeStr === 'BOSS' || typeStr.indexOf('BOSS') !== -1) {
      var bName = bossName || typeStr;
      var bossHtml = '<span style="color:#ff3333">☠ BOSS ELIMINATED — ' + bName + '</span>';
      _append(bossHtml, 'kf-boss');
      return;
    }

    /* Headshot tag */
    var hsTag = '';
    if (isHeadshot) {
      hsTag = '<span class="kf-headshot-tag">[💀 HEADSHOT]</span>';
    }

    /* Enemy label with type-coloured class */
    var ec = _enemyClass(typeStr);
    var enemyLabel = '<span class="' + ec.cls + '">' + ec.label + '</span>';

    /* Player icon on left, weapon icon, optional headshot tag, enemy */
    var html = '🪖 ' + icon + ' ' + hsTag + enemyLabel;
    _append(html, '');
  }

  /**
   * addEvent(text, color)
   *   Generic event line — yellow by default.
   */
  function addEvent(text, color) {
    _injectStyles();
    var c = color || '#ffcc00';
    var html = '<span style="color:' + c + '">' + text + '</span>';
    _append(html, '');
  }

  /**
   * clear() — remove all visible entries immediately.
   */
  function clear() {
    var feed = _getOrCreateFeed();
    while (feed.firstChild) feed.removeChild(feed.firstChild);
  }

  /* ── Global hook surface (no game-manager.js edits needed) ── */
  window._onKillForFeed = function (enemyType, weapon, isHeadshot) {
    KillFeed.addKill(enemyType, weapon, isHeadshot);
  };
  window._onBossKillForFeed = function (bossName) {
    KillFeed.addKill('BOSS', 'rifle', false, bossName);
  };
  window._onStreakForFeed = function (n) {
    KillFeed.addEvent('⚡ KILL STREAK ×' + n, '#ffcc00');
  };

  /* ── Auto-init when DOM is ready ──────────────────────── */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  return { init: init, addKill: addKill, addEvent: addEvent, clear: clear };

})();
