/* ─────────────────────────────────────────────────────────────────────────
   end-screen.js  —  Mission Complete / Mission Failed cinematic overlay
   API:  EndScreen.init()
         EndScreen.showMissionComplete(stats, onContinue)
         EndScreen.showMissionFailed(stats, onContinue)

   stats for showMissionComplete:
     { levelName, kills, accuracy, headshots, timeSec, score,
       xpEarned, rankUp, newAchievement, intelFound, intelTotal }

   stats for showMissionFailed:
     { kills, timeSec, score }

   Global hooks set on window:
     window._onMissionComplete(stats)
     window._onMissionFailed(stats)
   ───────────────────────────────────────────────────────────────────────── */

window.EndScreen = (function () {
  'use strict';

  /* ── Module state ────────────────────────────────────────────────────── */
  var _overlay       = null;
  var _initialized   = false;
  var _animTimers    = [];   // setTimeout ids for cleanup

  /* ── Shared style constants ──────────────────────────────────────────── */
  var FONT_FAMILY = '"Courier New", Courier, monospace';

  /* ── Inject keyframe CSS once ────────────────────────────────────────── */
  function _injectStyles() {
    if (document.getElementById('end-screen-styles')) { return; }
    var style = document.createElement('style');
    style.id  = 'end-screen-styles';
    style.textContent = [
      '@keyframes es-pulse {',
      '  0%,100% { text-shadow: 0 0 8px currentColor, 0 0 24px currentColor; }',
      '  50%     { text-shadow: 0 0 24px currentColor, 0 0 60px currentColor, 0 0 80px currentColor; }',
      '}',
      '@keyframes es-blink {',
      '  0%,49% { opacity:1; }',
      '  50%,100%{ opacity:0; }',
      '}',
      '@keyframes es-scanline {',
      '  0%   { top:-8%; }',
      '  100% { top:108%; }',
      '}',
      '@keyframes es-slide-in {',
      '  from { transform:translateX(120%); opacity:0; }',
      '  to   { transform:translateX(0);    opacity:1; }',
      '}',
      '@keyframes es-fade-in {',
      '  from { opacity:0; }',
      '  to   { opacity:1; }',
      '}',
      '@keyframes es-vignette-pulse {',
      '  0%,100% { opacity:0.55; }',
      '  50%     { opacity:0.80; }',
      '}'
    ].join('\n');
    document.head.appendChild(style);
  }

  /* ── Clear all pending animation timers ─────────────────────────────── */
  function _clearTimers() {
    for (var i = 0; i < _animTimers.length; i++) {
      clearTimeout(_animTimers[i]);
    }
    _animTimers = [];
  }

  /* ── Remove existing overlay ─────────────────────────────────────────── */
  function _destroy() {
    _clearTimers();
    if (_overlay && _overlay.parentNode) {
      _overlay.parentNode.removeChild(_overlay);
    }
    _overlay = null;
  }

  /* ── Format seconds as MM:SS ─────────────────────────────────────────── */
  function _fmtTime(sec) {
    var s = Math.floor(sec || 0);
    var m = Math.floor(s / 60);
    var r = s % 60;
    return (m < 10 ? '0' : '') + m + ':' + (r < 10 ? '0' : '') + r;
  }

  /* ── Format number with commas ───────────────────────────────────────── */
  function _fmtNum(n) {
    return (n || 0).toLocaleString('en-US');
  }

  /* ── Star rating helpers ──────────────────────────────────────────────── */
  function _starsForKills(kills) {
    if (kills > 100) { return 5; }
    if (kills > 60)  { return 4; }
    if (kills > 30)  { return 3; }
    if (kills > 10)  { return 2; }
    return 1;
  }

  function _starsForAccuracy(pct) {
    if (pct > 80) { return 5; }
    if (pct > 60) { return 4; }
    if (pct > 40) { return 3; }
    if (pct > 20) { return 2; }
    return 1;
  }

  function _starsForTime(sec) {
    if (sec < 180)  { return 5; }
    if (sec < 300)  { return 4; }
    if (sec < 480)  { return 3; }
    if (sec < 720)  { return 2; }
    return 1;
  }

  /* ── Render N filled / empty stars ──────────────────────────────────── */
  function _starsHtml(n, id) {
    var html = '<span id="' + (id || '') + '" style="letter-spacing:2px;">';
    for (var i = 0; i < 5; i++) {
      html += '<span class="es-star" style="color:#333;font-size:1.1em;" data-index="' + i + '" ' +
              'data-filled="' + (i < n ? '1' : '0') + '">★</span>';
    }
    html += '</span>';
    return html;
  }

  /* ── Animate stars in one by one ─────────────────────────────────────── */
  function _animateStars(container, baseDelay) {
    var stars = container.querySelectorAll('.es-star');
    for (var i = 0; i < stars.length; i++) {
      (function (star, idx) {
        var tid = setTimeout(function () {
          if (star.getAttribute('data-filled') === '1') {
            star.style.color = '#ffd700';
            star.style.textShadow = '0 0 8px #ffd700';
          } else {
            star.style.color = '#333';
          }
        }, baseDelay + idx * 300);
        _animTimers.push(tid);
      })(stars[i], i);
    }
  }

  /* ── Animate all star groups in the overlay ──────────────────────────── */
  function _animateAllStars(overlay, startDelay) {
    var groups = overlay.querySelectorAll('.es-star-group');
    for (var g = 0; g < groups.length; g++) {
      _animateStars(groups[g], startDelay + g * 200);
    }
  }

  /* ── Count-up number animation ───────────────────────────────────────── */
  function _countUp(el, target, delayMs) {
    var tgt    = Math.round(target || 0);
    var step   = Math.max(1, Math.ceil(tgt / 200));   // ~200 increments
    var cur    = 0;
    el.textContent = '0';

    var tid = setTimeout(function kick() {
      cur = Math.min(cur + step, tgt);
      el.textContent = _fmtNum(cur);
      if (cur < tgt) {
        var next = setTimeout(kick, 60);
        _animTimers.push(next);
      }
    }, delayMs || 0);
    _animTimers.push(tid);
  }

  /* ── Row helper: label + value + optional stars ──────────────────────── */
  function _rowHtml(label, value, stars, valueId) {
    var starsCell = stars !== undefined
      ? '<td style="width:110px;text-align:right;" class="es-star-group">' + _starsHtml(stars) + '</td>'
      : '<td></td>';
    return '<tr>' +
      '<td style="color:#8aab44;letter-spacing:2px;padding:4px 12px 4px 0;">' + label + '</td>' +
      '<td id="' + (valueId || '') + '" style="color:#e8e0c0;text-align:right;min-width:80px;padding:4px 12px;">' + value + '</td>' +
      starsCell +
    '</tr>';
  }

  /* ── Divider row ─────────────────────────────────────────────────────── */
  function _dividerRow(color) {
    return '<tr><td colspan="3"><div style="height:1px;background:linear-gradient(90deg,' +
      'transparent,' + (color || '#3a5a1a') + ',transparent);margin:8px 0;"></div></td></tr>';
  }

  /* ── Score bonus row ─────────────────────────────────────────────────── */
  function _bonusRowHtml(label, amount, valueId) {
    return '<tr>' +
      '<td style="color:#8aab44;letter-spacing:2px;padding:3px 12px 3px 0;">' + label + '</td>' +
      '<td id="' + (valueId || '') + '" style="color:#ccee88;text-align:right;padding:3px 12px;">' +
        (amount >= 0 ? '+' : '') + _fmtNum(amount) +
      '</td>' +
      '<td></td>' +
    '</tr>';
  }

  /* ────────────────────────────────────────────────────────────────────────
     showMissionComplete
     ──────────────────────────────────────────────────────────────────────── */
  function showMissionComplete(stats, onContinue) {
    _destroy();
    _injectStyles();

    stats = stats || {};
    var levelName    = (stats.levelName    || 'UNKNOWN OPERATION').toUpperCase();
    var kills        = stats.kills         || 0;
    var accuracy     = stats.accuracy      || 0;   /* 0-100 */
    var headshots    = stats.headshots     || 0;
    var timeSec      = stats.timeSec       || 0;
    var score        = stats.score         || 0;
    var xpEarned     = stats.xpEarned      || 0;
    var rankUp       = !!stats.rankUp;
    var newAch       = stats.newAchievement || null;
    var intelFound   = stats.intelFound    || 0;
    var intelTotal   = stats.intelTotal    || 5;

    var killStars    = _starsForKills(kills);
    var accStars     = _starsForAccuracy(accuracy);
    var timeStars    = _starsForTime(timeSec);

    /* ── Score bonuses ── */
    var baseScore    = Math.round(score * 0.74);
    var accBonus     = Math.round(score * 0.11);
    var speedBonus   = Math.round(score * 0.07);
    var intelBonus   = Math.round(score * 0.08);
    /* Re-derive from actual score so they add up exactly */
    var leftover     = score - (baseScore + accBonus + speedBonus + intelBonus);
    baseScore       += leftover;

    /* ── Build overlay ── */
    _overlay = document.createElement('div');
    _overlay.id = 'end-screen-overlay';
    _overlay.style.cssText = [
      'position:fixed;top:0;left:0;width:100%;height:100%;z-index:9000;',
      'display:flex;align-items:center;justify-content:center;',
      'background:rgba(0,0,0,0.88);',
      'font-family:' + FONT_FAMILY + ';',
      'animation:es-fade-in 0.4s ease forwards;'
    ].join('');

    /* Green vignette overlay */
    var vignette = document.createElement('div');
    vignette.style.cssText = [
      'position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;',
      'background:radial-gradient(ellipse at center,transparent 40%,rgba(20,80,10,0.55) 100%);',
      'animation:es-vignette-pulse 3s ease-in-out infinite;'
    ].join('');
    _overlay.appendChild(vignette);

    /* ── Card ── */
    var card = document.createElement('div');
    card.style.cssText = [
      'position:relative;z-index:1;',
      'max-width:560px;width:92%;',
      'border:1px solid #4a7a1a;',
      'background:rgba(6,16,3,0.97);',
      'border-radius:4px;padding:28px 32px 24px;'
    ].join('');

    /* Title */
    var titleDiv = document.createElement('div');
    titleDiv.style.cssText = 'text-align:center;margin-bottom:18px;';
    titleDiv.innerHTML =
      '<div style="font-size:1.9em;font-weight:bold;letter-spacing:6px;color:#88ff66;' +
        'animation:es-pulse 2s ease-in-out infinite;">' +
        '&#9733; MISSION COMPLETE &#9733;</div>' +
      '<div style="font-size:0.82em;letter-spacing:3px;color:#6aaa44;margin-top:6px;">' +
        'OPERATION: ' + levelName + '</div>';
    card.appendChild(titleDiv);

    /* Divider */
    card.innerHTML += '<div style="height:1px;background:linear-gradient(90deg,' +
      'transparent,#4a8a1a,transparent);margin-bottom:14px;"></div>';

    /* Stats table */
    var table = document.createElement('table');
    table.style.cssText = 'width:100%;border-collapse:collapse;margin-bottom:6px;';
    table.innerHTML =
      _rowHtml('KILLS:', _fmtNum(kills),   killStars,  'es-kills-val') +
      _rowHtml('ACCURACY:', accuracy + '%', accStars,   'es-acc-val') +
      _rowHtml('HEADSHOTS:', _fmtNum(headshots), undefined, 'es-hs-val') +
      _rowHtml('TIME:', _fmtTime(timeSec), timeStars, 'es-time-val') +
      _rowHtml('INTEL FOUND:', intelFound + '/' + intelTotal, undefined);
    card.appendChild(table);

    /* Divider */
    card.innerHTML += '<div style="height:1px;background:linear-gradient(90deg,' +
      'transparent,#3a5a1a,transparent);margin:10px 0;"></div>';

    /* Score breakdown table */
    var scoreTable = document.createElement('table');
    scoreTable.style.cssText = 'width:100%;border-collapse:collapse;';
    scoreTable.innerHTML =
      _bonusRowHtml('BASE SCORE:',      baseScore,  'es-base-val') +
      _bonusRowHtml('ACCURACY BONUS:',  accBonus,   'es-accb-val') +
      _bonusRowHtml('SPEED BONUS:',     speedBonus, 'es-speed-val') +
      _bonusRowHtml('INTEL BONUS:',     intelBonus, 'es-intel-val') +
      '<tr><td colspan="3"><div style="height:1px;background:#2a4a0a;margin:6px 0;"></div></td></tr>' +
      '<tr>' +
        '<td style="color:#ccff88;letter-spacing:2px;font-size:1.05em;padding:4px 12px 4px 0;">' +
          'FINAL SCORE:</td>' +
        '<td id="es-final-val" style="color:#ffe066;text-align:right;font-size:1.2em;' +
          'font-weight:bold;padding:4px 12px;">0</td>' +
        '<td></td>' +
      '</tr>';
    card.appendChild(scoreTable);

    /* Divider */
    card.innerHTML += '<div style="height:1px;background:linear-gradient(90deg,' +
      'transparent,#4a8a1a,transparent);margin:12px 0 10px;"></div>';

    /* XP / Rank */
    var xpDiv = document.createElement('div');
    xpDiv.style.cssText = 'display:flex;align-items:center;gap:14px;margin-bottom:10px;';
    var rankHtml = rankUp
      ? '<span id="es-rankup" style="color:#ffd700;font-weight:bold;letter-spacing:2px;' +
          'animation:es-blink 0.8s step-start infinite;">&#9733; RANK UP!</span>'
      : '';
    xpDiv.innerHTML =
      '<span style="color:#8aab44;letter-spacing:2px;font-size:0.85em;">XP EARNED:</span>' +
      '<span style="color:#ffe066;font-weight:bold;" id="es-xp-val">+0</span>' +
      rankHtml;
    card.appendChild(xpDiv);

    /* Achievement badge (hidden until revealed) */
    var achDiv = document.createElement('div');
    achDiv.id = 'es-ach-badge';
    achDiv.style.cssText = [
      'display:none;',
      'border:1px solid #6a8a2a;background:rgba(20,50,10,0.8);',
      'padding:8px 14px;border-radius:3px;',
      'color:#aaddaa;font-size:0.8em;letter-spacing:1px;',
      'margin-bottom:10px;'
    ].join('');
    achDiv.innerHTML = '&#127942; ACHIEVEMENT UNLOCKED: <strong id="es-ach-name" style="color:#88ff88;"></strong>';
    card.appendChild(achDiv);

    /* Continue button */
    var btnDiv = document.createElement('div');
    btnDiv.style.cssText = 'text-align:center;margin-top:14px;';
    var btn = document.createElement('button');
    btn.id = 'es-continue-btn';
    btn.textContent = 'CONTINUE →';
    btn.style.cssText = [
      'background:transparent;border:1px solid #4a8a1a;color:#88ff66;',
      'font-family:' + FONT_FAMILY + ';',
      'font-size:1em;letter-spacing:3px;padding:10px 32px;cursor:pointer;',
      'transition:background 0.2s,color 0.2s;'
    ].join('');
    btn.addEventListener('mouseover', function () {
      btn.style.background = '#1a3a0a';
      btn.style.color = '#ccff88';
    });
    btn.addEventListener('mouseout', function () {
      btn.style.background = 'transparent';
      btn.style.color = '#88ff66';
    });
    btn.addEventListener('click', function () {
      _destroy();
      if (typeof onContinue === 'function') { onContinue(); }
    });
    btnDiv.appendChild(btn);
    card.appendChild(btnDiv);

    _overlay.appendChild(card);
    document.body.appendChild(_overlay);

    /* ── Animate stats ── */
    /* Stars: start at 600ms */
    _animateAllStars(_overlay, 600);

    /* Count-up numbers */
    var finalEl = document.getElementById('es-final-val');
    if (finalEl) { _countUp(finalEl, score, 1200); }

    var xpEl = document.getElementById('es-xp-val');
    if (xpEl) {
      var tid = setTimeout(function () {
        var cur = 0;
        var step = Math.max(1, Math.ceil(xpEarned / 50));
        function tick() {
          cur = Math.min(cur + step, xpEarned);
          xpEl.textContent = '+' + _fmtNum(cur);
          if (cur < xpEarned) {
            var ntid = setTimeout(tick, 60);
            _animTimers.push(ntid);
          }
        }
        tick();
      }, 1400);
      _animTimers.push(tid);
    }

    /* Achievement slide in */
    if (newAch) {
      var achTid = setTimeout(function () {
        var badge = document.getElementById('es-ach-badge');
        var name  = document.getElementById('es-ach-name');
        if (badge && name) {
          name.textContent = newAch;
          badge.style.display = 'block';
          badge.style.animation = 'es-slide-in 0.5s cubic-bezier(0.22,1,0.36,1) forwards';
        }
      }, 1800);
      _animTimers.push(achTid);
    }
  }

  /* ────────────────────────────────────────────────────────────────────────
     showMissionFailed
     ──────────────────────────────────────────────────────────────────────── */
  function showMissionFailed(stats, onContinue) {
    _destroy();
    _injectStyles();

    stats = stats || {};
    var kills   = stats.kills   || 0;
    var timeSec = stats.timeSec || 0;
    var score   = stats.score   || 0;

    /* Optional death stinger */
    if (window.AudioSystem && typeof window.AudioSystem.playDeathStinger === 'function') {
      window.AudioSystem.playDeathStinger();
    }

    /* ── Overlay ── */
    _overlay = document.createElement('div');
    _overlay.id = 'end-screen-overlay';
    _overlay.style.cssText = [
      'position:fixed;top:0;left:0;width:100%;height:100%;z-index:9000;',
      'display:flex;align-items:center;justify-content:center;',
      'background:rgba(0,0,0,0.90);',
      'font-family:' + FONT_FAMILY + ';',
      'overflow:hidden;',
      'animation:es-fade-in 0.4s ease forwards;'
    ].join('');

    /* Red vignette */
    var vignette = document.createElement('div');
    vignette.style.cssText = [
      'position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;',
      'background:radial-gradient(ellipse at center,transparent 35%,rgba(80,5,5,0.60) 100%);'
    ].join('');
    _overlay.appendChild(vignette);

    /* Scanline sweep */
    var scanline = document.createElement('div');
    scanline.style.cssText = [
      'position:absolute;left:0;width:100%;height:8%;',
      'background:linear-gradient(180deg,transparent,rgba(180,0,0,0.07),transparent);',
      'pointer-events:none;',
      'animation:es-scanline 4s linear infinite;'
    ].join('');
    _overlay.appendChild(scanline);

    /* ── Card ── */
    var card = document.createElement('div');
    card.style.cssText = [
      'position:relative;z-index:1;',
      'max-width:500px;width:90%;',
      'border:1px solid #7a1a1a;',
      'background:rgba(14,3,3,0.97);',
      'border-radius:4px;padding:28px 32px 24px;'
    ].join('');

    /* Title */
    var titleDiv = document.createElement('div');
    titleDiv.style.cssText = 'text-align:center;margin-bottom:16px;';
    titleDiv.innerHTML =
      '<div style="font-size:1.9em;font-weight:bold;letter-spacing:6px;color:#ff4444;' +
        'animation:es-pulse 2s ease-in-out infinite;">' +
        '&#10006; MISSION FAILED &#10006;</div>' +
      '<div style="font-size:0.85em;letter-spacing:2px;color:#aa4444;margin-top:6px;">' +
        'You were eliminated.</div>';
    card.appendChild(titleDiv);

    /* Divider */
    var div1 = document.createElement('div');
    div1.style.cssText = 'height:1px;background:linear-gradient(90deg,' +
      'transparent,#7a2a1a,transparent);margin-bottom:14px;';
    card.appendChild(div1);

    /* Stats table */
    var table = document.createElement('table');
    table.style.cssText = 'width:100%;border-collapse:collapse;margin-bottom:6px;';
    table.innerHTML =
      '<tr>' +
        '<td style="color:#aa6666;letter-spacing:2px;padding:5px 12px 5px 0;">KILLS:</td>' +
        '<td style="color:#e8c0c0;text-align:right;padding:5px 12px;" id="es-f-kills">' + _fmtNum(kills) + '</td>' +
      '</tr>' +
      '<tr>' +
        '<td style="color:#aa6666;letter-spacing:2px;padding:5px 12px 5px 0;">SURVIVED:</td>' +
        '<td style="color:#e8c0c0;text-align:right;padding:5px 12px;">' + _fmtTime(timeSec) + '</td>' +
      '</tr>' +
      '<tr>' +
        '<td style="color:#aa6666;letter-spacing:2px;padding:5px 12px 5px 0;">SCORE:</td>' +
        '<td id="es-f-score" style="color:#e8c0c0;text-align:right;padding:5px 12px;">0</td>' +
      '</tr>';
    card.appendChild(table);

    /* Divider */
    var div2 = document.createElement('div');
    div2.style.cssText = 'height:1px;background:linear-gradient(90deg,' +
      'transparent,#5a1a1a,transparent);margin:12px 0;';
    card.appendChild(div2);

    /* Buttons */
    var btnDiv = document.createElement('div');
    btnDiv.style.cssText = 'display:flex;gap:12px;justify-content:center;margin-top:8px;';

    var retryBtn = document.createElement('button');
    retryBtn.textContent = 'RETRY MISSION';
    retryBtn.style.cssText = [
      'background:transparent;border:1px solid #7a1a1a;color:#ff6666;',
      'font-family:' + FONT_FAMILY + ';',
      'font-size:0.9em;letter-spacing:2px;padding:9px 20px;cursor:pointer;',
      'transition:background 0.2s;'
    ].join('');
    retryBtn.addEventListener('mouseover', function () {
      retryBtn.style.background = '#2a0808';
    });
    retryBtn.addEventListener('mouseout', function () {
      retryBtn.style.background = 'transparent';
    });
    retryBtn.addEventListener('click', function () {
      _destroy();
      if (typeof onContinue === 'function') { onContinue('retry'); }
    });

    var menuBtn = document.createElement('button');
    menuBtn.textContent = 'MAIN MENU';
    menuBtn.style.cssText = [
      'background:transparent;border:1px solid #552222;color:#cc8888;',
      'font-family:' + FONT_FAMILY + ';',
      'font-size:0.9em;letter-spacing:2px;padding:9px 20px;cursor:pointer;',
      'transition:background 0.2s;'
    ].join('');
    menuBtn.addEventListener('mouseover', function () {
      menuBtn.style.background = '#1a0505';
    });
    menuBtn.addEventListener('mouseout', function () {
      menuBtn.style.background = 'transparent';
    });
    menuBtn.addEventListener('click', function () {
      _destroy();
      if (typeof onContinue === 'function') { onContinue('menu'); }
    });

    btnDiv.appendChild(retryBtn);
    btnDiv.appendChild(menuBtn);
    card.appendChild(btnDiv);

    _overlay.appendChild(card);
    document.body.appendChild(_overlay);

    /* Animate score count-up */
    var scoreEl = document.getElementById('es-f-score');
    if (scoreEl) { _countUp(scoreEl, score, 400); }
  }

  /* ── init: inject styles & wire global hooks ─────────────────────────── */
  function init() {
    if (_initialized) { return; }
    _initialized = true;
    _injectStyles();

    window._onMissionComplete = function (stats, onContinue) {
      showMissionComplete(stats, onContinue);
    };

    window._onMissionFailed = function (stats, onContinue) {
      showMissionFailed(stats, onContinue);
    };
  }

  /* ── Auto-init when DOM is ready ─────────────────────────────────────── */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  return {
    init:                init,
    showMissionComplete: showMissionComplete,
    showMissionFailed:   showMissionFailed
  };

})();
