/* ============================================================================
   OccupantKiller — Extras Control Panel (ties together rounds 1–4).
   Lets the player toggle every added overlay/FX on or off, persisted to
   localStorage, plus a clean-view mode and a controls cheatsheet. This makes the
   12 added features curatable instead of all-on clutter.
     H  — open/close the Extras settings panel (releases pointer lock to click)
     K  — clean view: hide ALL extras instantly (for screenshots)
     ?  — controls cheatsheet
   Reads/sets window.__OK_EXTRAS (honored by hud-extras 1/2/3) and FXExtras.
   ========================================================================== */
(function () {
  'use strict';

  var DEFAULTS = { hud1: true, hud2: true, hud3: true, hud4: true, stats: true, cinematic: false, particles: false };
  var prefs = load();
  function load() {
    try { var s = JSON.parse(localStorage.getItem('ok_extras_prefs') || '{}'); var o = {}; for (var k in DEFAULTS) o[k] = (k in s) ? !!s[k] : DEFAULTS[k]; return o; } catch (e) { return Object.assign({}, DEFAULTS); }
  }
  function save() { try { localStorage.setItem('ok_extras_prefs', JSON.stringify(prefs)); } catch (e) {} }

  function applyHud() { window.__OK_EXTRAS = { hud1: prefs.hud1, hud2: prefs.hud2, hud3: prefs.hud3, hud4: prefs.hud4, stats: prefs.stats }; }
  function applyFX(tries) {
    if (typeof window.FXExtras === 'undefined') { if ((tries || 0) < 20) return setTimeout(function () { applyFX((tries || 0) + 1); }, 200); return; }
    try { FXExtras.cinematic(prefs.cinematic); FXExtras.particles(prefs.particles); } catch (e) {}
  }
  applyHud(); applyFX();

  var CONFIG = [
    ['hud1', 'HUD I — compass · readout · reticle'],
    ['hud2', 'HUD II — minimap · wave bar · streaks'],
    ['hud3', 'HUD III — damage · kill feed · speed'],
    ['hud4', 'HUD IV — threat tracking (arrows/lock)'],
    ['stats', 'Match stats — kills/time/streak + recap'],
    ['cinematic', 'FX — cinematic mode (letterbox)'],
    ['particles', 'FX — atmosphere particles']
  ];

  function el(tag, css, parent) { var d = document.createElement(tag); if (css) d.style.cssText = css; (parent || document.body).appendChild(d); return d; }

  /* Settings panel ----------------------------------------------------------- */
  var panel = el('div',
    'position:fixed;top:50%;right:16px;transform:translateY(-50%);z-index:970;display:none;'
    + 'pointer-events:auto;width:300px;padding:16px 18px;border-radius:12px;'
    + 'background:rgba(10,16,28,.94);border:1px solid rgba(0,216,255,.4);'
    + 'box-shadow:0 10px 40px rgba(0,0,0,.6);color:#dff1ff;font-family:"JetBrains Mono",monospace;');
  var panelOpen = false;
  el('div', 'font-size:13px;font-weight:700;letter-spacing:2px;color:#7fd5ff;margin-bottom:10px;', panel).textContent = '⚙ HUD EXTRAS';

  // Quick presets — one-click curation across all groups.
  var PRESETS = {
    'Minimal': { hud1: true, hud2: false, hud3: false, hud4: false, stats: false, cinematic: false, particles: false },
    'Combat':  { hud1: true, hud2: true, hud3: true, hud4: true, stats: true, cinematic: false, particles: false },
    'Full':    { hud1: true, hud2: true, hud3: true, hud4: true, stats: true, cinematic: true, particles: true },
    'Off':     { hud1: false, hud2: false, hud3: false, hud4: false, stats: false, cinematic: false, particles: false }
  };
  var prow = el('div', 'display:flex;gap:6px;margin:0 0 10px;', panel);
  Object.keys(PRESETS).forEach(function (nm) {
    var btn = el('button', 'flex:1;padding:5px 2px;font:600 10px "JetBrains Mono",monospace;cursor:pointer;'
      + 'border-radius:6px;border:1px solid rgba(0,216,255,.4);background:rgba(0,216,255,.08);color:#cfeaff;', prow);
    btn.textContent = nm;
    btn.onclick = function () { var ps = PRESETS[nm]; for (var key in ps) prefs[key] = ps[key]; apply(); save(); render(); };
  });

  var rows = {};
  CONFIG.forEach(function (c) {
    var row = el('label', 'display:flex;align-items:center;gap:9px;padding:6px 0;font-size:12px;cursor:pointer;', panel);
    var box = el('span', 'width:16px;height:16px;border-radius:4px;border:1px solid #4ad;flex:0 0 auto;display:inline-block;', row);
    el('span', '', row).textContent = c[1];
    row.onclick = function () { prefs[c[0]] = !prefs[c[0]]; apply(); save(); render(); };
    rows[c[0]] = box;
  });
  var note = el('div', 'margin-top:10px;font-size:10px;opacity:.6;line-height:1.5;', panel);
  note.innerHTML = 'K = clean view (hide all) · ? = controls<br>Settings are saved on this device.';

  function render() {
    CONFIG.forEach(function (c) {
      var on = !!prefs[c[0]];
      rows[c[0]].style.background = on ? '#33e0ff' : 'transparent';
      rows[c[0]].style.boxShadow = on ? '0 0 7px #33e0ff' : 'none';
    });
  }
  function apply() { applyHud(); applyFX(); }

  function openPanel(o) {
    panelOpen = (typeof o === 'boolean') ? o : !panelOpen;
    panel.style.display = panelOpen ? 'block' : 'none';
    if (panelOpen) { render(); try { if (document.exitPointerLock) document.exitPointerLock(); } catch (e) {} }
  }

  /* Clean view --------------------------------------------------------------- */
  var cleanOn = false;
  function cleanView(o) {
    cleanOn = (typeof o === 'boolean') ? o : !cleanOn;
    if (cleanOn) { window.__OK_EXTRAS = { hud1: false, hud2: false, hud3: false, hud4: false, stats: false }; try { FXExtras.cinematic(false); FXExtras.particles(false); } catch (e) {} }
    else { apply(); }
  }

  /* Cheatsheet --------------------------------------------------------------- */
  var sheet = el('div',
    'position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);z-index:971;display:none;'
    + 'pointer-events:auto;min-width:320px;padding:20px 24px;border-radius:12px;'
    + 'background:rgba(8,12,22,.95);border:1px solid rgba(255,212,0,.4);color:#fff;'
    + 'font-family:"JetBrains Mono",monospace;font-size:12px;line-height:1.9;box-shadow:0 10px 40px rgba(0,0,0,.6);');
  sheet.innerHTML =
    '<div style="font-size:14px;font-weight:700;letter-spacing:2px;color:#ffd400;margin-bottom:10px">CONTROLS</div>'
    + '<div><b style="color:#7fd5ff">H</b> — HUD Extras settings</div>'
    + '<div><b style="color:#7fd5ff">K</b> — clean view (hide all extras)</div>'
    + '<div><b style="color:#7fd5ff">C</b> — cinematic mode</div>'
    + '<div><b style="color:#7fd5ff">V</b> — atmosphere particles</div>'
    + '<div><b style="color:#7fd5ff">P</b> — skill progression</div>'
    + '<div><b style="color:#7fd5ff">1–0 / F-keys</b> — weapon slots</div>'
    + '<div style="margin-top:8px;opacity:.55;font-size:10px">Press ? or Esc to close</div>';
  var sheetOpen = false;
  function cheatsheet(o) { sheetOpen = (typeof o === 'boolean') ? o : !sheetOpen; sheet.style.display = sheetOpen ? 'block' : 'none'; }

  /* Keys --------------------------------------------------------------------- */
  window.addEventListener('keydown', function (e) {
    if (e.ctrlKey || e.altKey || e.metaKey) return;
    var k = e.key;
    if (k === 'h' || k === 'H') { openPanel(); e.preventDefault(); }
    else if (k === 'k' || k === 'K') { cleanView(); e.preventDefault(); }
    else if (k === '?' || (k === '/' && e.shiftKey)) { cheatsheet(); e.preventDefault(); }
    else if (k === 'Escape') { if (panelOpen) openPanel(false); if (sheetOpen) cheatsheet(false); }
  });

  // First-run onboarding toast (once per device) so players discover the panel.
  function onboard(force) {
    try { if (!force && localStorage.getItem('ok_extras_onboarded')) return; } catch (e) {}
    var tip = el('div',
      'position:fixed;left:50%;bottom:84px;transform:translateX(-50%);z-index:972;pointer-events:none;'
      + 'padding:10px 16px;border-radius:10px;background:rgba(8,12,22,.93);border:1px solid rgba(0,216,255,.5);'
      + 'color:#dff1ff;font-family:"JetBrains Mono",monospace;font-size:12px;box-shadow:0 6px 24px rgba(0,0,0,.5);'
      + 'opacity:0;transition:opacity .4s;');
    tip.innerHTML = '✨ HUD Extras installed — press <b style="color:#7fd5ff">H</b> to customize · <b style="color:#7fd5ff">?</b> for controls';
    requestAnimationFrame(function () { tip.style.opacity = '1'; });
    setTimeout(function () { tip.style.opacity = '0'; }, 8000);
    setTimeout(function () { if (tip.parentNode) tip.parentNode.removeChild(tip); }, 8500);
    try { localStorage.setItem('ok_extras_onboarded', '1'); } catch (e) {}
  }
  onboard();

  window.ExtrasPanel = {
    open: function () { openPanel(true); }, close: function () { openPanel(false); },
    cleanView: cleanView, cheatsheet: function () { cheatsheet(true); },
    testOnboard: function () { onboard(true); },
    get: function () { return Object.assign({}, prefs); }, _panel: panel, _sheet: sheet
  };
})();
