window.MissionDebrief = (function() {
  'use strict';

  var _overlay = null;
  var _visible = false;
  var _animFrames = [];
  var _currentWave = 0;
  var STORAGE_KEY = 'okk_debrief_v1';

  // ── Audio helpers ──────────────────────────────────────────────────────────
  function _playFanfare(grade) {
    try {
      var ctx = new (window.AudioContext || window.webkitAudioContext)();

      function beep(freq, start, dur, gain) {
        var osc = ctx.createOscillator();
        var env = ctx.createGain();
        osc.connect(env);
        env.connect(ctx.destination);
        osc.frequency.value = freq;
        osc.type = 'triangle';
        env.gain.setValueAtTime(0, ctx.currentTime + start);
        env.gain.linearRampToValueAtTime(gain, ctx.currentTime + start + 0.02);
        env.gain.linearRampToValueAtTime(0, ctx.currentTime + start + dur);
        osc.start(ctx.currentTime + start);
        osc.stop(ctx.currentTime + start + dur + 0.05);
      }

      if (grade === 'S' || grade === 'A') {
        // A-chord arpeggio: A4 C#5 E5 A5
        beep(440,  0.0,  0.18, 0.3);
        beep(554,  0.12, 0.18, 0.3);
        beep(659,  0.24, 0.18, 0.3);
        beep(880,  0.36, 0.35, 0.35);
      } else if (grade === 'B' || grade === 'C') {
        // Neutral two-note resolve
        beep(392,  0.0,  0.15, 0.25);
        beep(440,  0.18, 0.25, 0.25);
      } else {
        // Minor descending: D4 A3 F3
        beep(294,  0.0,  0.2,  0.25);
        beep(220,  0.22, 0.2,  0.25);
        beep(175,  0.44, 0.3,  0.2);
      }
    } catch (e) {
      // Audio unavailable — silently ignore
    }
  }

  // ── Grade calculation ──────────────────────────────────────────────────────
  function _calcGrade(kills, accuracy, civilianPenalty) {
    var score = 0;

    // Kills component (max 40 pts)
    score += Math.min(40, kills * 2);

    // Accuracy component (max 40 pts) — accuracy is 0-100
    score += Math.min(40, accuracy * 0.4);

    // Civilian penalty (up to -30 pts)
    score -= civilianPenalty * 5;

    score = Math.max(0, score);

    if (score >= 95)  return 'S';
    if (score >= 80)  return 'A';
    if (score >= 65)  return 'B';
    if (score >= 50)  return 'C';
    if (score >= 35)  return 'D';
    return 'F';
  }

  function _gradeColor(grade) {
    var map = { S: '#ffd700', A: '#00ff88', B: '#4499ff', C: '#ffdd00', D: '#ff8800', F: '#ff2222' };
    return map[grade] || '#ffffff';
  }

  function _gradeGlow(grade) {
    var c = _gradeColor(grade);
    return '0 0 12px ' + c + ', 0 0 30px ' + c;
  }

  function _stars(grade) {
    var n = (grade === 'S' || grade === 'A') ? 3 : (grade === 'B' || grade === 'C') ? 2 : 1;
    var filled = '';
    var empty  = '';
    var i;
    for (i = 0; i < n; i++)     filled += '&#9733;';
    for (i = n; i < 3; i++)     empty  += '&#9734;';
    return '<span style="color:#ffd700;text-shadow:0 0 8px #ffd700;">' + filled + '</span>' +
           '<span style="color:#444;">' + empty + '</span>';
  }

  // ── localStorage helpers ───────────────────────────────────────────────────
  function _loadBest() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    } catch (e) { return {}; }
  }

  function _saveBest(wave, grade) {
    var RANK = { S:6, A:5, B:4, C:3, D:2, F:1 };
    try {
      var data = _loadBest();
      if (!data[wave] || RANK[grade] > RANK[data[wave]]) {
        data[wave] = grade;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      }
    } catch (e) {}
  }

  // ── Animated counter ───────────────────────────────────────────────────────
  function _animateCounter(el, target, duration, suffix) {
    suffix = suffix || '';
    var start = null;
    var from = 0;
    function step(ts) {
      if (!start) start = ts;
      var pct = Math.min((ts - start) / duration, 1);
      // ease-out cubic
      var eased = 1 - Math.pow(1 - pct, 3);
      el.textContent = Math.round(from + (target - from) * eased) + suffix;
      if (pct < 1) {
        _animFrames.push(requestAnimationFrame(step));
      }
    }
    _animFrames.push(requestAnimationFrame(step));
  }

  // ── Format time ───────────────────────────────────────────────────────────
  function _fmtTime(seconds) {
    seconds = Math.round(seconds || 0);
    var m = Math.floor(seconds / 60);
    var s = seconds % 60;
    return (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;
  }

  // ── Build overlay DOM ──────────────────────────────────────────────────────
  function _buildOverlay(waveNum, stats) {
    var div = document.createElement('div');
    div.id = 'mission-debrief-overlay';
    div.style.cssText = [
      'position:fixed', 'top:0', 'left:0', 'width:100%', 'height:100%',
      'background:rgba(0,0,0,0.88)', 'z-index:99999',
      'display:flex', 'align-items:center', 'justify-content:center',
      'font-family:monospace', 'color:#e0e0e0'
    ].join(';');

    var kills        = stats.kills        || 0;
    var headshots    = stats.headshots    || 0;
    var shotsFired   = stats.shotsFired   || 0;
    var shotsHit     = stats.shotsHit     || 0;
    var civAlive     = stats.civiliansAlive != null ? stats.civiliansAlive : 0;
    var civDead      = stats.civsDead     || 0;
    var duration     = stats.duration     || 0;
    var baseScore    = stats.baseScore    || 0;
    var objCount     = stats.objectivesCompleted || 0;

    var accuracy     = shotsFired > 0 ? Math.round((shotsHit / shotsFired) * 100) : 0;
    var waveBonus    = waveNum * 50;
    var headshotBonus = headshots * 25;
    var civPenalty   = civDead * 100;
    var total        = Math.max(0, baseScore + waveBonus + headshotBonus - civPenalty);

    var grade        = _calcGrade(kills, accuracy, civDead);
    var gradeColor   = _gradeColor(grade);
    var gradeGlow    = _gradeGlow(grade);

    // Persist
    _saveBest(waveNum, grade);
    window._lastDebriefGrade = grade;

    var bestData = _loadBest();
    var bestGrade = bestData[waveNum] || grade;

    // Card container
    var card = document.createElement('div');
    card.style.cssText = [
      'background:#0a0a0f',
      'border:1px solid #333',
      'border-top:3px solid #cc2200',
      'padding:32px 40px',
      'min-width:460px',
      'max-width:560px',
      'width:90vw',
      'box-shadow:0 0 40px rgba(200,0,0,0.25)',
      'position:relative'
    ].join(';');

    // Header
    var hdr = document.createElement('div');
    hdr.style.cssText = 'text-align:center;margin-bottom:24px;border-bottom:1px solid #222;padding-bottom:18px;';
    hdr.innerHTML =
      '<div style="font-size:11px;letter-spacing:6px;color:#666;margin-bottom:6px;">AFTER ACTION REPORT</div>' +
      '<div style="font-size:28px;font-weight:bold;color:#cc2200;letter-spacing:4px;text-shadow:0 0 16px #cc2200;">MISSION DEBRIEF</div>' +
      '<div style="font-size:15px;color:#cc8800;letter-spacing:3px;margin-top:8px;">WAVE ' + waveNum + ' COMPLETE</div>';
    card.appendChild(hdr);

    // Grade + stars row
    var gradeRow = document.createElement('div');
    gradeRow.style.cssText = 'display:flex;align-items:center;justify-content:space-between;margin-bottom:22px;';
    gradeRow.innerHTML =
      '<div>' +
        '<div style="font-size:11px;letter-spacing:3px;color:#555;margin-bottom:4px;">PERFORMANCE</div>' +
        '<div id="mdb-grade" style="font-size:72px;font-weight:bold;color:' + gradeColor + ';' +
          'text-shadow:' + gradeGlow + ';line-height:1;">' + grade + '</div>' +
        '<div style="font-size:11px;color:#444;margin-top:4px;">BEST: ' + bestGrade + '</div>' +
      '</div>' +
      '<div style="text-align:right;">' +
        '<div style="font-size:11px;letter-spacing:3px;color:#555;margin-bottom:8px;">RATING</div>' +
        '<div style="font-size:32px;letter-spacing:4px;">' + _stars(grade) + '</div>' +
      '</div>';
    card.appendChild(gradeRow);

    // Stats table
    var statsDiv = document.createElement('div');
    statsDiv.style.cssText = 'border:1px solid #1a1a1a;background:#050508;padding:16px;margin-bottom:20px;';

    function statRow(label, id, val, suffix) {
      return '<div style="display:flex;justify-content:space-between;padding:5px 0;border-bottom:1px solid #111;">' +
        '<span style="color:#888;letter-spacing:2px;font-size:12px;">' + label + '</span>' +
        '<span id="' + id + '" style="color:#e0e0e0;font-size:13px;">' + val + (suffix||'') + '</span>' +
        '</div>';
    }

    statsDiv.innerHTML =
      '<div style="font-size:10px;letter-spacing:4px;color:#444;margin-bottom:8px;">STATISTICS</div>' +
      statRow('ENEMIES KILLED',     'mdb-kills',      0) +
      statRow('HEADSHOTS',          'mdb-headshots',  0) +
      statRow('ACCURACY',           'mdb-accuracy',   0, '%') +
      statRow('CIVILIANS SAFE',     'mdb-civsafe',    0) +
      statRow('TIME',               'mdb-time',       '00:00') +
      (objCount > 0 ? statRow('OBJECTIVES COMPLETED', 'mdb-obj', 0) : '');
    card.appendChild(statsDiv);

    // Score breakdown
    var scoreDiv = document.createElement('div');
    scoreDiv.style.cssText = 'border:1px solid #1a1a1a;background:#050508;padding:16px;margin-bottom:20px;';
    scoreDiv.innerHTML =
      '<div style="font-size:10px;letter-spacing:4px;color:#444;margin-bottom:8px;">SCORE BREAKDOWN</div>' +
      '<div style="display:flex;justify-content:space-between;padding:4px 0;">' +
        '<span style="color:#666;font-size:12px;">BASE SCORE</span>' +
        '<span style="color:#aaa;font-size:12px;">' + baseScore + '</span>' +
      '</div>' +
      '<div style="display:flex;justify-content:space-between;padding:4px 0;">' +
        '<span style="color:#666;font-size:12px;">WAVE BONUS (x' + waveNum + ')</span>' +
        '<span style="color:#44ff88;font-size:12px;">+' + waveBonus + '</span>' +
      '</div>' +
      '<div style="display:flex;justify-content:space-between;padding:4px 0;">' +
        '<span style="color:#666;font-size:12px;">HEADSHOT BONUS</span>' +
        '<span style="color:#44ff88;font-size:12px;">+' + headshotBonus + '</span>' +
      '</div>' +
      (civPenalty > 0 ?
        '<div style="display:flex;justify-content:space-between;padding:4px 0;">' +
          '<span style="color:#666;font-size:12px;">CIVILIAN PENALTY</span>' +
          '<span style="color:#ff4444;font-size:12px;">-' + civPenalty + '</span>' +
        '</div>' : '') +
      '<div style="border-top:1px solid #333;margin-top:8px;padding-top:8px;display:flex;justify-content:space-between;">' +
        '<span style="color:#cc8800;font-size:13px;letter-spacing:2px;">&gt;&gt;&gt; TOTAL</span>' +
        '<span id="mdb-total" style="color:#ffffff;font-size:15px;font-weight:bold;">0</span>' +
      '</div>';
    card.appendChild(scoreDiv);

    // Buttons
    var btnRow = document.createElement('div');
    btnRow.style.cssText = 'display:flex;gap:12px;justify-content:center;';

    var btnStyle = [
      'font-family:monospace', 'font-size:13px', 'letter-spacing:3px',
      'padding:10px 28px', 'border:1px solid', 'cursor:pointer',
      'background:transparent', 'transition:all 0.15s'
    ].join(';');

    var continueBtn = document.createElement('button');
    continueBtn.id = 'mdb-btn-continue';
    continueBtn.style.cssText = btnStyle + ';color:#00ff88;border-color:#00ff88;';
    continueBtn.textContent = '[ CONTINUE ]';
    continueBtn.onmouseenter = function() { this.style.background = '#00ff8833'; };
    continueBtn.onmouseleave = function() { this.style.background = 'transparent'; };
    continueBtn.onclick = function() { _onContinue(); };

    var retryBtn = document.createElement('button');
    retryBtn.id = 'mdb-btn-retry';
    retryBtn.style.cssText = btnStyle + ';color:#ff8844;border-color:#ff8844;';
    retryBtn.textContent = '[ RETRY ]';
    retryBtn.onmouseenter = function() { this.style.background = '#ff884433'; };
    retryBtn.onmouseleave = function() { this.style.background = 'transparent'; };
    retryBtn.onclick = function() { _onRetry(); };

    btnRow.appendChild(continueBtn);
    btnRow.appendChild(retryBtn);
    card.appendChild(btnRow);

    div.appendChild(card);

    // Animate counters after DOM insertion (deferred)
    setTimeout(function() {
      var killEl   = document.getElementById('mdb-kills');
      var hsEl     = document.getElementById('mdb-headshots');
      var accEl    = document.getElementById('mdb-accuracy');
      var civEl    = document.getElementById('mdb-civsafe');
      var timeEl   = document.getElementById('mdb-time');
      var objEl    = document.getElementById('mdb-obj');
      var totalEl  = document.getElementById('mdb-total');

      var DUR = 1500;
      if (killEl)  _animateCounter(killEl,  kills,      DUR);
      if (hsEl)    _animateCounter(hsEl,    headshots,  DUR);
      if (accEl)   _animateCounter(accEl,   accuracy,   DUR, '%');
      if (civEl)   _animateCounter(civEl,   civAlive,   DUR);
      if (totalEl) _animateCounter(totalEl, total,      DUR);

      if (objEl && objCount > 0) _animateCounter(objEl, objCount, DUR);

      // Animate time by interpolating seconds
      if (timeEl) {
        var start = null;
        var dur = DUR;
        function stepTime(ts) {
          if (!start) start = ts;
          var pct = Math.min((ts - start) / dur, 1);
          var eased = 1 - Math.pow(1 - pct, 3);
          timeEl.textContent = _fmtTime(eased * duration);
          if (pct < 1) _animFrames.push(requestAnimationFrame(stepTime));
        }
        _animFrames.push(requestAnimationFrame(stepTime));
      }
    }, 50);

    return div;
  }

  // ── Button handlers ────────────────────────────────────────────────────────
  function _onContinue() {
    hide();
    window._isPaused = false;
    if (window.GameManager && typeof window.GameManager.resume === 'function') {
      window.GameManager.resume();
    }
  }

  function _onRetry() {
    hide();
    // Reload the current wave via GameManager if available
    if (window.GameManager && typeof window.GameManager.restartWave === 'function') {
      window.GameManager.restartWave();
    } else {
      location.reload();
    }
  }

  // ── Public API ─────────────────────────────────────────────────────────────
  function init() {
    // Hook into wave-complete global callback
    window._onWaveComplete = function(waveNum) {
      show(waveNum);
    };
  }

  function show(waveNum) {
    if (_visible) return;

    _currentWave = waveNum || 1;

    // Gather stats from globals
    var stats = {
      kills:               window._waveKillCount   || 0,
      headshots:           window._headshotCount   || 0,
      shotsFired:          window._shotsFired       || 0,
      shotsHit:            window._shotsHit         || 0,
      civiliansAlive:      window._civiliansAlive   != null ? window._civiliansAlive : 0,
      civsDead:            window._civsDead         || 0,
      duration:            window._waveDuration     || 0,
      baseScore:           (window.player && window.player.score) || 0,
      objectivesCompleted: (window.ObjectiveSystem && typeof window.ObjectiveSystem.getCompletedCount === 'function')
                             ? window.ObjectiveSystem.getCompletedCount() : 0
    };

    _overlay = _buildOverlay(_currentWave, stats);
    document.body.appendChild(_overlay);
    _visible = true;

    // Pause game
    window._isPaused = true;

    // Play fanfare based on grade
    _playFanfare(window._lastDebriefGrade);
  }

  function hide() {
    if (!_visible || !_overlay) return;

    // Cancel any running animation frames
    var i;
    for (i = 0; i < _animFrames.length; i++) {
      cancelAnimationFrame(_animFrames[i]);
    }
    _animFrames = [];

    if (_overlay && _overlay.parentNode) {
      _overlay.parentNode.removeChild(_overlay);
    }
    _overlay = null;
    _visible = false;
  }

  function reset() {
    hide();
    _currentWave = 0;
    window._lastDebriefGrade = null;
  }

  return { init: init, show: show, hide: hide, reset: reset };

})();
