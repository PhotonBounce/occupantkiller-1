/* cinematic.js — CLEAN HUD (F8)
 *
 * Occupant Killer draws a lot of HUD. A capture taken during real play showed
 * roughly twenty overlapping panels — challenges, mission tracker, target
 * assist, tacmap, decoys, breach status, streaks, wallet, toasts — leaving the
 * actual game visible only in the gaps between them. That is bad for a new
 * player and useless for a screenshot someone is meant to look at and want.
 *
 * Clean HUD hides every positioned overlay except a small essential set:
 * crosshair, health, ammo and the weapon name. It is a toggle, off by default,
 * so normal play is untouched.
 *
 * Why this hides things at runtime rather than with a stylesheet: several of
 * the busiest panels (DECOYS, BREACH, TACMAP, the match-stats block) are built
 * in JavaScript and never appear in index.html, so there is no stable id to
 * write a rule against. Walking the live DOM catches them, and re-walking on a
 * timer catches the ones that appear later — toasts and banners spawn mid-fight
 * and would otherwise pop back into an otherwise clean frame.
 */
(function () {
  'use strict';

  // Kept visible. Everything else that is positioned gets hidden.
  var KEEP_IDS = [
    'crosshair',
    'health-section', 'health-bar-container', 'health-bar', 'health-value', 'health-label',
    'ammo-section', 'ammo-display', 'ammo-reserve', 'ammo-label',
    'weapon-section', 'weapon-name-display', 'weapon-label',
  ];
  // Never touch these regardless of position — hiding them hides the game.
  var NEVER_HIDE_TAGS = { CANVAS: 1, HTML: 1, BODY: 1 };

  var on = false;
  var timer = null;

  function keepSet() {
    var keep = new Set();
    // The kept elements, plus every ancestor — hiding a parent would hide the
    // child we are trying to preserve.
    KEEP_IDS.forEach(function (id) {
      var el = document.getElementById(id);
      while (el && el !== document.documentElement) { keep.add(el); el = el.parentElement; }
    });
    // The renderer's canvas and its ancestors.
    var cvs = document.querySelectorAll('canvas');
    for (var i = 0; i < cvs.length; i++) {
      // The minimap and tactical map are HUD, not the game view.
      if (cvs[i].id === 'minimap-canvas' || cvs[i].id === 'tactical-map-canvas') continue;
      var n = cvs[i];
      while (n && n !== document.documentElement) { keep.add(n); n = n.parentElement; }
    }
    return keep;
  }

  function apply() {
    var keep = keepSet();
    // Release anything we hid earlier that now belongs in the keep set. The
    // renderer's canvas is present before play starts, but a panel we hid could
    // later become the parent of something essential, and a black frame is a
    // much worse failure than a stray visible panel.
    var hidden = document.querySelectorAll('[data-okcin]');
    for (var h = 0; h < hidden.length; h++) {
      if (keep.has(hidden[h])) {
        hidden[h].style.removeProperty('display');
        hidden[h].removeAttribute('data-okcin');
      }
    }
    var all = document.querySelectorAll('body *');
    for (var i = 0; i < all.length; i++) {
      var el = all[i];
      if (keep.has(el) || NEVER_HIDE_TAGS[el.tagName]) continue;
      if (el.hasAttribute('data-okcin')) continue;         // already hidden by us
      var cs;
      try { cs = getComputedStyle(el); } catch (e) { continue; }
      if (cs.position !== 'fixed' && cs.position !== 'absolute') continue;
      if (cs.display === 'none') continue;                  // leave already-hidden alone
      el.setAttribute('data-okcin', '1');
      el.style.setProperty('display', 'none', 'important');
    }
  }

  function restore() {
    var hidden = document.querySelectorAll('[data-okcin]');
    for (var i = 0; i < hidden.length; i++) {
      hidden[i].style.removeProperty('display');
      hidden[i].removeAttribute('data-okcin');
    }
  }

  function set(v) {
    v = !!v;
    if (v === on) return on;
    on = v;
    if (on) {
      apply();
      // Panels spawn during play; re-sweep so they do not pop into a clean shot.
      timer = setInterval(apply, 700);
    } else {
      if (timer) { clearInterval(timer); timer = null; }
      restore();
    }
    try {
      if (window.HUD && HUD.notifyPickup) {
        HUD.notifyPickup(on ? '🎬 CLEAN HUD ON  ·  F8' : '🎬 CLEAN HUD OFF', '#c8ff4d');
      }
    } catch (e) {}
    return on;
  }

  document.addEventListener('keydown', function (e) {
    if (e.code === 'F8' && !e.ctrlKey && !e.altKey) { e.preventDefault(); set(!on); }
  });

  window.Cinematic = { set: set, toggle: function () { return set(!on); }, isOn: function () { return on; } };
})();
