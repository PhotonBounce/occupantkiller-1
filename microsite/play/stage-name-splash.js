/* ============================================================
 *  STAGE-NAME-SPLASH.JS — cinematic stage title on stage change (passive)
 *
 *  Watches GameManager.getStageInfo() for stage ID changes.
 *  On transition fires a 2-second cinematic:
 *
 *    ── thin full-width separator line sweeps in ──
 *    STAGE N / TOTAL
 *    [STAGE NAME]  (large)
 *    [description] (small, if available)
 *    ── line sweeps out ──
 *
 *  Entirely CSS. z-index 495 (below boss-warning 497 and wave-intro 498).
 *  Passive — no keybind.
 * ============================================================ */
var StageNameSplash = (function () {
  'use strict';

  var HOLD_TIME  = 1.8;   /* seconds before fade */
  var COOLDOWN   = 4.0;   /* minimum gap between triggers */

  var _wrap     = null;
  var _init     = false;
  var _lastId   = null;
  var _lastTs   = 0;
  var _lastFire = 0;
  var _frameN   = 0;

  function _buildStyle() {
    var s = document.createElement('style');
    s.textContent = [
      '@keyframes snsSweep{',
        '0%{opacity:0;transform:scaleX(0)}',
        '20%{opacity:1;transform:scaleX(1)}',
        '80%{opacity:1;transform:scaleX(1)}',
        '100%{opacity:0;transform:scaleX(0)}',
      '}',
      '@keyframes snsTitle{',
        '0%{opacity:0;transform:translateY(8px)}',
        '15%{opacity:1;transform:translateY(0)}',
        '80%{opacity:1;transform:translateY(0)}',
        '100%{opacity:0;transform:translateY(-6px)}',
      '}',
      '#sns-wrap{',
        'position:fixed;left:0;top:50%;width:100%;',
        'transform:translateY(-50%);',
        'pointer-events:none;z-index:495;',
        'display:none;',
        'text-align:center;',
      '}',
      '#sns-line-top,#sns-line-bot{',
        'height:1px;width:100%;',
        'background:rgba(80,200,255,0.4);',
        'transform-origin:left center;',
        'display:block;',
        'margin:0;',
      '}',
      '#sns-body{',
        'padding:18px 0 16px;',
        'background:rgba(0,4,12,0.55);',
      '}',
      '#sns-number{',
        'font-family:"Courier New",monospace;',
        'font-size:9px;font-weight:bold;',
        'letter-spacing:6px;',
        'color:rgba(80,200,255,0.7);',
        'display:block;margin-bottom:6px;',
      '}',
      '#sns-name{',
        'font-family:"Courier New",monospace;',
        'font-size:24px;font-weight:900;',
        'letter-spacing:4px;',
        'color:rgba(255,255,255,0.95);',
        'text-shadow:0 0 40px rgba(80,200,255,0.6);',
        'display:block;margin-bottom:6px;',
      '}',
      '#sns-desc{',
        'font-family:"Courier New",monospace;',
        'font-size:8px;',
        'letter-spacing:2px;',
        'color:rgba(180,180,180,0.6);',
        'display:block;',
        'max-width:480px;margin:0 auto;',
        'white-space:nowrap;overflow:hidden;text-overflow:ellipsis;',
      '}',
    ].join('');
    document.head.appendChild(s);
  }

  function _buildDom() {
    _wrap = document.createElement('div');
    _wrap.id = 'sns-wrap';
    _wrap.innerHTML = [
      '<div id="sns-line-top"></div>',
      '<div id="sns-body">',
        '<span id="sns-number"></span>',
        '<span id="sns-name"></span>',
        '<span id="sns-desc"></span>',
      '</div>',
      '<div id="sns-line-bot"></div>',
    ].join('');
    document.body.appendChild(_wrap);
  }

  function _fire(info) {
    if (!_wrap) return;
    var num  = document.getElementById('sns-number');
    var name = document.getElementById('sns-name');
    var desc = document.getElementById('sns-desc');
    var lt   = document.getElementById('sns-line-top');
    var lb   = document.getElementById('sns-line-bot');

    if (num)  num.textContent  = 'STAGE ' + (info.id || '?');
    if (name) name.textContent = (info.name || 'OPERATION').toUpperCase();
    if (desc) desc.textContent = (info.description || info.objective || '').toUpperCase().slice(0, 80);

    var dur = HOLD_TIME + 0.5;
    _wrap.style.display = 'block';

    var animStr = 'snsSweep ' + dur + 's ease forwards';
    var titStr  = 'snsTitle ' + dur + 's ease forwards';

    if (lt)   { lt.style.animation = 'none';   void lt.offsetWidth;   lt.style.animation   = animStr; }
    if (lb)   { lb.style.animation = 'none';   void lb.offsetWidth;   lb.style.animation   = animStr; }
    if (num)  { num.style.animation  = 'none'; void num.offsetWidth;  num.style.animation  = titStr;  }
    if (name) { name.style.animation = 'none'; void name.offsetWidth; name.style.animation = titStr;  }
    if (desc) { desc.style.animation = 'none'; void desc.offsetWidth; desc.style.animation = titStr;  }

    var wrap = _wrap;
    setTimeout(function () { if (wrap) wrap.style.display = 'none'; }, dur * 1000);
  }

  function _tick(ts) {
    requestAnimationFrame(_tick);
    _frameN++;
    var dt = Math.min(0.1, (ts - (_lastTs || ts)) / 1000);
    _lastTs = ts;
    var now = ts / 1000;

    if (_frameN % 45 !== 0) return;
    if (now - _lastFire < COOLDOWN) return;

    try {
      if (typeof GameManager === 'undefined' || !GameManager.getStageInfo) return;
      var info = GameManager.getStageInfo();
      if (!info) return;
      var id = info.id !== undefined ? info.id : info.name;
      if (_lastId === null) { _lastId = id; return; }
      if (id !== _lastId) {
        _lastId   = id;
        _lastFire = now;
        _fire(info);
      }
    } catch (er) {}
  }

  function init() {
    if (_init) return;
    _init = true;
    _buildStyle();
    _buildDom();
    requestAnimationFrame(_tick);
  }

  return { init: init };
})();

window.StageNameSplash = StageNameSplash;
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function () { StageNameSplash.init(); });
} else {
  StageNameSplash.init();
}
