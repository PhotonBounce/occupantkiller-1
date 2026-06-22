/* ─────────────────────────────────────────────────────────────────────────
   mission-debrief.js  —  Animated post-mission stats and grade screen
   Shown after a stage is cleared, before the next-level transition.
   API:  MissionDebrief.init()
         MissionDebrief.show(stats, onContinue)
         MissionDebrief.hide()
   ───────────────────────────────────────────────────────────────────────── */
window.MissionDebrief = (function () {
  'use strict';

  /* ── Module-level vars ──────────────────────────────────────────────── */
  var _el           = null;   // root overlay element
  var _countdownId  = null;   // auto-advance interval
  var _onContinue   = null;   // callback from show()
  var _visible      = false;
  var _countdownSec = 12;

  /* ── Medal definitions ──────────────────────────────────────────────── */
  var MEDAL_LABELS = {
    SHARPSHOOTER: { icon: '🎯', label: 'SHARPSHOOTER' },
    IRON_WILL:    { icon: '🛡', label: 'IRON WILL'    },
    GHOST:        { icon: '👻', label: 'GHOST'         },
    HEADHUNTER:   { icon: '💀', label: 'HEADHUNTER'   },
    SPEEDRUN:     { icon: '⚡', label: 'SPEED RUN'     },
    BERSERKER:    { icon: '🔥', label: 'BERSERKER'    },
  };

  /* ── Grade calculation ───────────────────────────────────────────────── */
  function calcGrade(stats) {
    var acc      = stats.accuracy || 0;
    var kills    = stats.kills    || 0;
    var total    = stats.totalEnemies || kills;
    var headshots = stats.headshots || 0;
    var hsPct    = kills > 0 ? headshots / kills : 0;

    if (acc >= 80 && kills >= total && hsPct >= 0.20) return 'S';
    if (acc >= 65 || hsPct >= 0.15)                   return 'A';
    if (acc >= 50)                                     return 'B';
    if (acc >= 35)                                     return 'C';
    return 'D';
  }

  var GRADE_STARS = { S: 5, A: 4, B: 3, C: 2, D: 1 };
  var GRADE_COLOR = { S: '#ffe066', A: '#88ff88', B: '#66ccff', C: '#ffaa44', D: '#ff6666' };

  function starsHtml(n) {
    var s = '';
    for (var i = 0; i < 5; i++) {
      s += '<span style="color:' + (i < n ? '#ffd700' : '#444') + ';font-size:1.2em;">★</span>';
    }
    return s;
  }

  /* ── Time formatter ─────────────────────────────────────────────────── */
  function fmtTime(sec) {
    var s = Math.floor(sec || 0);
    var m = Math.floor(s / 60);
    var rs = s % 60;
    return (m < 10 ? '0' : '') + m + ':' + (rs < 10 ? '0' : '') + rs;
  }

  /* ── Animated counter (counts from 0 to target over ~350 ms) ────────── */
  function animateCount(el, target, suffix, duration) {
    var start   = performance.now();
    var dur     = duration || 350;
    var tgt     = target || 0;
    var suf     = suffix || '';

    function tick(now) {
      var elapsed = now - start;
      var prog    = Math.min(elapsed / dur, 1);
      var eased   = 1 - Math.pow(1 - prog, 3);   // ease-out cubic
      var cur     = Math.round(eased * tgt);
      el.textContent = cur + suf;
      if (prog < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  /* ── Progress bar fill ──────────────────────────────────────────────── */
  function animateBar(barEl, pct, delay) {
    setTimeout(function () {
      barEl.style.transition = 'width 400ms ease-out';
      barEl.style.width = Math.min(100, pct) + '%';
    }, delay || 0);
  }

  /* ── Audio: star ping (Web Audio API oscillator) ────────────────────── */
  function playStarPing() {
    try {
      var ctx = new (window.AudioContext || window.webkitAudioContext)();
      var osc = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type      = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1760, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.18, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.5);
    } catch (e) { /* audio unavailable */ }
  }

  /* ── Build stat card HTML ───────────────────────────────────────────── */
  function statCardHtml(id, iconHtml, label, value, pct) {
    return '<div class="md-card" id="md-card-' + id + '" style="' +
      'border:1px solid #4a6a2a;background:rgba(20,40,10,0.6);padding:16px;' +
      'border-radius:4px;min-width:160px;flex:1;opacity:0;' +
      'transition:opacity 200ms ease-in;">' +
      '<div style="font-size:10px;letter-spacing:2px;color:#8aab44;margin-bottom:6px;">' + label + '</div>' +
      '<div style="font-size:1.6em;font-weight:bold;color:#e8e0c0;" id="md-val-' + id + '">' + iconHtml + ' 0</div>' +
      '<div style="margin-top:8px;height:4px;background:#1a2a0a;border-radius:2px;">' +
        '<div id="md-bar-' + id + '" style="height:4px;background:#6aaa22;width:0%;border-radius:2px;"></div>' +
      '</div>' +
    '</div>';
  }

  /* ── Build the full debrief DOM ─────────────────────────────────────── */
  function buildDom(stats, grade) {
    var levelName = (stats.levelName || 'UNKNOWN').toUpperCase();
    var numStars  = GRADE_STARS[grade] || 1;
    var gradeCol  = GRADE_COLOR[grade] || '#e8e0c0';

    /* Medals */
    var medals = stats.medals || window._lastWaveMedals || [];
    var medalsHtml = '';
    if (medals.length > 0) {
      var chips = '';
      for (var mi = 0; mi < medals.length; mi++) {
        var key = medals[mi].replace(/\s+/g, '_').toUpperCase();
        var def = MEDAL_LABELS[key] || { icon: '🎖', label: key };
        chips += '<span style="display:inline-flex;align-items:center;gap:4px;' +
          'border:1px solid #6a8a2a;background:rgba(40,60,10,0.7);' +
          'padding:4px 10px;border-radius:3px;font-size:11px;letter-spacing:1px;color:#ccee88;margin:3px;">' +
          def.icon + ' ' + def.label + '</span>';
      }
      medalsHtml = '<div id="md-medals" style="margin-top:18px;opacity:0;transition:opacity 300ms;">' +
        '<div style="font-size:10px;letter-spacing:2px;color:#8aab44;margin-bottom:8px;">MEDALS EARNED</div>' +
        '<div>' + chips + '</div>' +
        '</div>';
    }

    /* Typewriter placeholder (filled by JS) */
    var html =
      '<div style="max-width:660px;width:90%;padding:32px 28px;' +
        'border:1px solid #3a5a1a;background:rgba(8,18,4,0.95);border-radius:6px;">' +

        /* Header */
        '<div id="md-header" style="text-align:center;opacity:0;transform:translateY(-30px);' +
          'transition:opacity 400ms,transform 400ms;">' +
          '<div style="font-size:11px;letter-spacing:4px;color:#8aab44;margin-bottom:4px;">🎖</div>' +
          '<div style="font-size:2em;font-weight:bold;letter-spacing:6px;color:#ccff88;' +
            'text-shadow:0 0 18px rgba(100,255,60,0.5);">MISSION COMPLETE</div>' +
          '<div style="height:1px;background:linear-gradient(90deg,transparent,#4a8a1a,transparent);' +
            'margin:14px 0;"></div>' +
        '</div>' +

        /* Operation name (typewriter target) */
        '<div id="md-opname" style="font-size:11px;letter-spacing:3px;color:#aac860;' +
          'text-align:center;margin-bottom:22px;min-height:18px;"></div>' +

        /* Stat cards grid */
        '<div style="display:flex;flex-wrap:wrap;gap:10px;margin-bottom:16px;">' +
          statCardHtml('kills',  '🔫', 'ELIMINATIONS', stats.kills, stats.kills > 0 ? 100 : 0) +
          statCardHtml('acc',    '🎯', 'ACCURACY',     stats.accuracy, stats.accuracy) +
        '</div>' +
        '<div style="display:flex;flex-wrap:wrap;gap:10px;margin-bottom:16px;">' +
          statCardHtml('hs',     '💀', 'HEADSHOTS',    stats.headshots, stats.kills > 0 ? Math.round(stats.headshots / stats.kills * 100) : 0) +
          statCardHtml('time',   '⏱', 'TIME',         stats.timeSeconds, 100) +
        '</div>' +
        '<div style="display:flex;flex-wrap:wrap;gap:10px;margin-bottom:16px;">' +
          statCardHtml('score',  '💰', 'SCORE',        stats.score, 100) +
          /* Grade card */
          '<div class="md-card" id="md-card-grade" style="' +
            'border:1px solid #4a6a2a;background:rgba(20,40,10,0.6);padding:16px;' +
            'border-radius:4px;min-width:160px;flex:1;opacity:0;' +
            'transition:opacity 200ms ease-in;">' +
            '<div style="font-size:10px;letter-spacing:2px;color:#8aab44;margin-bottom:6px;">GRADE</div>' +
            '<div id="md-grade-val" style="font-size:1.6em;font-weight:bold;color:' + gradeCol + ';opacity:0;transition:opacity 400ms;">' +
              starsHtml(numStars) + ' <span style="font-size:1.3em;">' + grade + '</span>' +
            '</div>' +
            '<div style="margin-top:8px;height:4px;background:#1a2a0a;border-radius:2px;">' +
              '<div id="md-bar-grade" style="height:4px;background:' + gradeCol + ';width:0%;border-radius:2px;"></div>' +
            '</div>' +
          '</div>' +
        '</div>' +

        medalsHtml +

        /* Continue button */
        '<div style="text-align:center;margin-top:22px;">' +
          '<button id="md-continue" style="' +
            'border:2px solid #88aa44;color:#ccff88;background:transparent;' +
            'font-family:Courier New,monospace;font-size:13px;letter-spacing:3px;' +
            'padding:12px 40px;cursor:pointer;border-radius:3px;' +
            'transition:background 200ms;outline:none;opacity:0;' +
            'animation:md-pulse 1.8s ease-in-out infinite;"' +
            '>CONTINUE (12)</button>' +
        '</div>' +

      '</div>';  /* end panel */

    _el.innerHTML = '<style>' +
      '@keyframes md-pulse{0%,100%{box-shadow:0 0 0 0 rgba(136,170,68,0);}50%{box-shadow:0 0 0 8px rgba(136,170,68,0.25);}}' +
      '#md-continue:hover{background:rgba(80,120,20,0.6);}' +
      '</style>' + html;
  }

  /* ── Typewriter animation ───────────────────────────────────────────── */
  function typeWrite(el, text, msPerChar, cb) {
    var i   = 0;
    var txt = text || '';
    el.textContent = '';
    function step() {
      if (i < txt.length) {
        el.textContent += txt[i];
        i++;
        setTimeout(step, msPerChar || 40);
      } else {
        if (typeof cb === 'function') cb();
      }
    }
    step();
  }

  /* ── Run the animation sequence ─────────────────────────────────────── */
  function runSequence(stats, grade) {
    var levelName = 'OPERATION: ' + (stats.levelName || 'UNKNOWN').toUpperCase();

    /* 0.0s  Fade-in overlay */
    _el.style.opacity = '0';
    _el.style.transition = 'opacity 400ms';
    _el.style.display = 'flex';
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        _el.style.opacity = '1';
      });
    });

    /* 0.4s  Header slides down */
    setTimeout(function () {
      var hdr = document.getElementById('md-header');
      if (hdr) {
        hdr.style.opacity = '1';
        hdr.style.transform = 'translateY(0)';
      }
    }, 400);

    /* 0.8s  Typewriter for operation name */
    setTimeout(function () {
      var opEl = document.getElementById('md-opname');
      if (opEl) typeWrite(opEl, levelName, 40);
    }, 800);

    /* 1.5s  Stat cards animate in one by one */
    var CARD_IDS  = ['kills', 'acc', 'hs', 'time', 'score'];
    var CARD_VALS = [
      stats.kills    || 0,
      stats.accuracy || 0,
      stats.headshots || 0,
      stats.timeSeconds || 0,
      stats.score    || 0
    ];
    var CARD_SUFX = ['', '%', '', '', ''];
    var CARD_PCTS = [
      stats.kills > 0 ? 100 : 0,
      stats.accuracy || 0,
      stats.kills > 0 ? Math.round((stats.headshots / stats.kills) * 100) : 0,
      100,
      100
    ];

    for (var ci = 0; ci < CARD_IDS.length; ci++) {
      (function (idx) {
        setTimeout(function () {
          var card = document.getElementById('md-card-' + CARD_IDS[idx]);
          var valEl = document.getElementById('md-val-' + CARD_IDS[idx]);
          var barEl = document.getElementById('md-bar-' + CARD_IDS[idx]);
          if (card) card.style.opacity = '1';
          if (valEl) {
            /* Time card: show formatted time instead of counter */
            if (CARD_IDS[idx] === 'time') {
              animateCount(valEl, CARD_VALS[idx], 's', 350);
              setTimeout(function () {
                if (valEl) valEl.textContent = '⏱ ' + fmtTime(CARD_VALS[idx]);
              }, 380);
            } else {
              var pfx = (CARD_IDS[idx] === 'score') ? '💰 ' :
                        (CARD_IDS[idx] === 'kills') ? '🔫 ' :
                        (CARD_IDS[idx] === 'hs')    ? '💀 ' :
                        (CARD_IDS[idx] === 'acc')   ? '🎯 ' : '';
              animateCount(valEl, CARD_VALS[idx], CARD_SUFX[idx], 350);
              setTimeout(function (p) {
                return function () {
                  if (valEl) valEl.textContent = p + CARD_VALS[idx] + CARD_SUFX[idx];
                };
              }(pfx), 380);
            }
          }
          if (barEl) animateBar(barEl, CARD_PCTS[idx], 50);
        }, 1500 + idx * 200);
      })(ci);
    }

    /* 2.5s  Grade card */
    setTimeout(function () {
      var card = document.getElementById('md-card-grade');
      if (card) card.style.opacity = '1';
      setTimeout(function () {
        var gv = document.getElementById('md-grade-val');
        var gb = document.getElementById('md-bar-grade');
        if (gv) gv.style.opacity = '1';
        if (gb) animateBar(gb, 100, 0);
        playStarPing();
      }, 150);
    }, 2500);

    /* 3.0s  Medals row */
    setTimeout(function () {
      var med = document.getElementById('md-medals');
      if (med) med.style.opacity = '1';
    }, 3000);

    /* 3.5s  Continue button pulses in + start countdown */
    setTimeout(function () {
      var btn = document.getElementById('md-continue');
      if (btn) {
        btn.style.opacity = '1';
        btn.addEventListener('click', _onContinueFired);
      }
      startCountdown();
    }, 3500);
  }

  /* ── Continue button click + auto-advance ───────────────────────────── */
  function _onContinueFired() {
    hide();
    if (typeof _onContinue === 'function') {
      var cb = _onContinue;
      _onContinue = null;
      cb();
    }
  }

  function startCountdown() {
    var remaining = _countdownSec;
    if (_countdownId) clearInterval(_countdownId);
    _countdownId = setInterval(function () {
      remaining--;
      var btn = document.getElementById('md-continue');
      if (btn) btn.textContent = 'CONTINUE (' + Math.max(0, remaining) + ')';
      if (remaining <= 0) {
        clearInterval(_countdownId);
        _countdownId = null;
        _onContinueFired();
      }
    }, 1000);
  }

  /* ── Public API ─────────────────────────────────────────────────────── */

  function init() {
    if (_el) return;   /* already initialised */
    _el = document.createElement('div');
    _el.id = 'missionDebrief';
    _el.style.cssText = [
      'position:fixed', 'top:0', 'left:0', 'width:100%', 'height:100%',
      'background:rgba(0,0,0,0.9)',
      'display:none', 'z-index:1000',
      'font-family:Courier New,monospace', 'color:#e8e0c0',
      'flex-direction:column', 'align-items:center', 'justify-content:center',
      'overflow-y:auto'
    ].join(';');
    document.body.appendChild(_el);
  }

  function show(stats, onContinue) {
    if (!_el) init();

    /* Cancel any previous countdown */
    if (_countdownId) { clearInterval(_countdownId); _countdownId = null; }

    _onContinue = onContinue || null;
    _visible    = true;

    var s = stats || {};
    var grade = calcGrade(s);

    buildDom(s, grade);

    _el.style.display = 'flex';
    _el.style.opacity = '0';

    runSequence(s, grade);
  }

  function hide() {
    if (_countdownId) { clearInterval(_countdownId); _countdownId = null; }
    _visible = false;
    if (!_el) return;
    _el.style.transition = 'opacity 300ms';
    _el.style.opacity = '0';
    setTimeout(function () {
      if (_el) _el.style.display = 'none';
    }, 320);
  }

  return { init: init, show: show, hide: hide };
})();
