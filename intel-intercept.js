/* ============================================================
 *  INTEL-INTERCEPT.JS — Enemy radio comms intercepts
 *
 *  Every 35-55 seconds (randomised), a "SIGNAL INTERCEPTED"
 *  panel slides in from the right edge showing translated enemy
 *  radio chatter. Adapts message type to current game state:
 *    • wave 1-2:  confusion, disbelief
 *    • wave 3-4:  calls for reinforcement, flanking orders
 *    • wave 5+:   desperation, panic, unit collapse
 *  Auto-dismisses after 9 seconds. Click X to close early.
 * ============================================================ */
var IntelIntercept = (function () {
  'use strict';

  /* ── Message banks keyed by phase ─────────
     Formatted as [callsign]: "message text"
  ── */
  var MSGS = {
    early: [
      ['Zubr-1', 'Contact! They\'re stronger than reported. Requesting fire support.'],
      ['Berkut-6', 'We lost the advance squad. Holding at grid 47-Charlie.'],
      ['Volk-3', 'What is this? They were supposed to be militia. These are regulars.'],
      ['Groza-2', 'Command, we need more time. Our flank is exposed. Where is support?'],
      ['Medved-1', 'Position marked on map. Engaging. Send the second platoon.'],
      ['Tigr-4', 'Negative on the advance. The crossroads is covered. Alternate route?'],
    ],
    mid: [
      ['Berkut-6', 'We\'re taking fire from three sides. REQUEST IMMEDIATE REINFORCEMENT.'],
      ['Sokol-1', 'Flanking manoeuvre initiated. Zubr-3, do you copy? Zubr-3?'],
      ['Orёl-2', 'Command, I\'ve lost half my squad. We need extraction or support NOW.'],
      ['Zubr-4', 'Moving to secondary position. Primary is compromised. Too many of them.'],
      ['Volk-1', 'Send the BMPs. Dismounted infantry isn\'t working. They\'re dug in.'],
      ['Groza-5', 'This isn\'t on the map. There are fortifications here. Pull back!'],
      ['Tigr-3', 'Sniper active in sector. Two down. Everyone get down and stay down.'],
    ],
    late: [
      ['Berkut-2', 'Command, we\'re collapsing. Squad is gone. I repeat — squad is GONE.'],
      ['Orёl-4', 'I can\'t raise anyone. Is anyone on this net? Anyone?'],
      ['Volk-6', 'Abort the mission. There\'s no mission anymore. ABORT.'],
      ['Groza-1', 'I surrender. I SURRENDER. Dropping weapon. Do not shoot.'],
      ['Zubr-2', 'This was supposed to be a training exercise. Nobody told me — nobody—'],
      ['Sokol-3', 'We were told 3 days. It has been weeks. We have nothing left.'],
      ['Medved-7', 'Who authorised this operation? We are dying for NOTHING.'],
    ],
  };

  /* ── State ──────────────────────────────── */
  var _initialized = false;
  var _el          = null;
  var _bodyEl      = null;
  var _timer       = 20;   // first intercept sooner
  var _nextIn      = 20;
  var _shown       = false;
  var _hideTimer   = null;

  /* ── Pick a message based on wave ──────── */
  function _pickMsg() {
    var wave = 1;
    try { wave = (window.GameManager && GameManager.getCurrentWave) ? (GameManager.getCurrentWave() || 1) : 1; } catch(e){}
    var bank;
    if (wave <= 2)      bank = MSGS.early;
    else if (wave <= 4) bank = MSGS.mid;
    else                bank = MSGS.late;
    var m = bank[Math.floor(Math.random() * bank.length)];
    return { callsign: m[0], text: m[1] };
  }

  /* ── Build overlay element ──────────────── */
  function _build() {
    var style = document.createElement('style');
    style.textContent = [
      '@keyframes iiSlideIn{from{transform:translateX(110%)}to{transform:translateX(0)}}',
      '@keyframes iiSlideOut{from{transform:translateX(0)}to{transform:translateX(110%)}}',
      '@keyframes iiBlink{0%,100%{opacity:1}40%{opacity:0.3}}',
      '#ii-panel{',
        'display:none;position:fixed;right:0;top:50%;transform:translateY(-50%);',
        'width:min(310px,85vw);z-index:320;',
        'background:rgba(0,8,18,0.92);border:1px solid rgba(255,150,0,0.4);',
        'border-right:none;border-top:2px solid #ff9900;',
        'font-family:monospace;padding:0;}',
      '#ii-panel.ii-in{animation:iiSlideIn 0.35s ease-out forwards;}',
      '#ii-panel.ii-out{animation:iiSlideOut 0.3s ease-in forwards;}',
      '#ii-head{',
        'background:rgba(255,150,0,0.12);padding:6px 10px;',
        'display:flex;justify-content:space-between;align-items:center;}',
      '#ii-title{color:#ff9900;font-size:9px;letter-spacing:0.22em;}',
      '#ii-blink{color:#ff9900;font-size:9px;animation:iiBlink 0.8s step-end infinite;}',
      '#ii-close{color:#ff9900;cursor:pointer;font-size:14px;padding:0 4px;',
        'background:none;border:none;font-family:monospace;line-height:1;}',
      '#ii-body{padding:10px 12px 14px;}',
      '#ii-cs{color:#ffcc44;font-size:10px;letter-spacing:0.12em;margin-bottom:6px;}',
      '#ii-text{color:#ddc;font-size:12px;line-height:1.55;font-style:italic;}',
      '#ii-foot{color:rgba(255,150,0,0.35);font-size:9px;letter-spacing:0.1em;',
        'padding:0 12px 8px;text-align:right;}',
    ].join('');
    document.head.appendChild(style);

    var el = document.createElement('div');
    el.id = 'ii-panel';
    el.innerHTML = [
      '<div id="ii-head">',
        '<span id="ii-title">◉ SIGNAL INTERCEPTED</span>',
        '<span id="ii-blink">REC</span>',
        '<button id="ii-close" title="Dismiss">✕</button>',
      '</div>',
      '<div id="ii-body">',
        '<div id="ii-cs"></div>',
        '<div id="ii-text"></div>',
      '</div>',
      '<div id="ii-foot">GUR TACTICAL NET · ENCRYPTED</div>',
    ].join('');
    document.body.appendChild(el);

    document.getElementById('ii-close').addEventListener('click', _hide);
    _bodyEl = el;
    return el;
  }

  /* ── Show intercept ─────────────────────── */
  function _show() {
    if (_shown) return;
    if (!_el) _el = _build();

    var msg = _pickMsg();
    document.getElementById('ii-cs').textContent  = '▶ ' + msg.callsign;
    document.getElementById('ii-text').textContent = '"' + msg.text + '"';

    _el.style.display = 'block';
    _el.classList.remove('ii-out');
    _el.classList.add('ii-in');
    _shown = true;

    if (_hideTimer) clearTimeout(_hideTimer);
    _hideTimer = setTimeout(_hide, 9000);
  }

  function _hide() {
    if (!_shown || !_el) return;
    _el.classList.remove('ii-in');
    _el.classList.add('ii-out');
    _shown = false;
    if (_hideTimer) { clearTimeout(_hideTimer); _hideTimer = null; }
    setTimeout(function () { if (_el) _el.style.display = 'none'; }, 340);
  }

  /* ── Poll timer ─────────────────────────── */
  function update(dt) {
    _timer += dt;
    if (_timer >= _nextIn && !_shown) {
      _timer  = 0;
      _nextIn = 35 + Math.random() * 20;
      _show();
    }
  }

  /* ── Init ──────────────────────────────── */
  function init() {
    if (_initialized) return;
    _initialized = true;

    _el = _build();

    var _last = performance.now();
    function _tick(ts) {
      var dt = Math.min(0.2, (ts - _last) / 1000);
      _last  = ts;
      update(dt);
      requestAnimationFrame(_tick);
    }
    requestAnimationFrame(_tick);
  }

  return { init: init, trigger: _show };
})();

window.IntelIntercept = IntelIntercept;
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function () { IntelIntercept.init(); });
} else {
  IntelIntercept.init();
}
