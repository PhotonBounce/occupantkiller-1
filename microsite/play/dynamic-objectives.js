/* ─────────────────────────────────────────────────────────────────────────────
   DYNAMIC OBJECTIVES — mission objectives that update based on player progress
   Left-side HUD panel, wave-aware, bonus objectives, secret classified missions
   All var, IIFE pattern — no let/const
   ───────────────────────────────────────────────────────────────────────────── */
window.DynamicObjectives = (function () {
  'use strict';

  /* ── Objective type constants ─────────────────────────────────────────────── */
  var OBJECTIVE_TYPES = {
    KILL_COUNT:     'Eliminate X enemies',
    KILL_STREAK:    'Achieve X kill streak without dying',
    HEADSHOT_COUNT: 'Land X headshots',
    SURVIVE_TIME:   'Survive for X seconds',
    CAPTURE_POINT:  'Capture the objective',
    PROTECT_AREA:   'Keep enemies out of the zone',
    COLLECT_INTEL:  'Collect X intel documents',
    ELIMINATE_HVT:  'Eliminate the High Value Target',
    REACH_POSITION: 'Reach the marked position'
  };

  /* ── Internal state ───────────────────────────────────────────────────────── */
  var _primaryObjective   = null;   // { type, label, target, progress, complete, failed }
  var _bonusObjective     = null;   // same shape, or null
  var _classifiedObj      = null;   // secret objective or null
  var _classifiedUnlocked = false;
  var _hasClassified      = false;  // 10% chance roll per wave
  var _waveNum            = 0;
  var _waveEnemyCount     = 0;      // total enemies for this wave (set by init)
  var _midBonusTriggered  = false;  // guard: add bonus once at 50%
  var _surviveTimer       = 0;      // seconds elapsed this wave
  var _surviveTarget      = 0;      // seconds required for survive-time objective
  var _panelEl            = null;   // left HUD panel DOM element
  var _stylesInjected     = false;
  var _timeIntervalId     = null;   // setInterval handle for survive-time ticking
  var _bannerQueue        = [];     // queued full-screen banners
  var _bannerActive       = false;

  /* ── Style injection ──────────────────────────────────────────────────────── */
  function _injectStyles() {
    if (_stylesInjected || document.getElementById('dyn-obj-style')) { _stylesInjected = true; return; }
    _stylesInjected = true;
    var st = document.createElement('style');
    st.id = 'dyn-obj-style';
    st.textContent = [
      '@keyframes doSlideIn {',
      '  from { transform: translateX(-110%); opacity: 0; }',
      '  to   { transform: translateX(0);     opacity: 1; }',
      '}',
      '@keyframes doSlideOut {',
      '  from { transform: translateX(0);     opacity: 1; }',
      '  to   { transform: translateX(-110%); opacity: 0; }',
      '}',
      '@keyframes doCheckFlash {',
      '  0%   { color: #fff; text-shadow: 0 0 8px #0f0; }',
      '  40%  { color: #0f0; text-shadow: 0 0 16px #0f0; }',
      '  100% { color: #0f0; text-shadow: 0 0 4px #0f0; }',
      '}',
      '@keyframes doBannerIn {',
      '  from { opacity: 0; transform: translateX(-50%) scaleX(0.6); }',
      '  to   { opacity: 1; transform: translateX(-50%) scaleX(1); }',
      '}',
      '@keyframes doBannerOut {',
      '  from { opacity: 1; }',
      '  to   { opacity: 0; }',
      '}',
      '@keyframes doClassifiedPulse {',
      '  0%,100% { box-shadow: 0 0 8px #a020f0; }',
      '  50%     { box-shadow: 0 0 24px #d060ff; }',
      '}',
      '#dyn-obj-panel {',
      '  position: fixed;',
      '  top: 200px;',
      '  left: 12px;',
      '  width: 220px;',
      '  z-index: 210;',
      '  pointer-events: none;',
      '  font-family: "Courier New", Courier, monospace;',
      '  font-size: 12px;',
      '  animation: doSlideIn 0.45s cubic-bezier(0.22,0.61,0.36,1) both;',
      '}',
      '#dyn-obj-panel.do-hidden {',
      '  animation: doSlideOut 0.35s ease-in both;',
      '}',
      '.do-box {',
      '  background: rgba(0,0,0,0.72);',
      '  border: 1px solid rgba(255,200,60,0.45);',
      '  border-radius: 4px;',
      '  margin-bottom: 6px;',
      '  overflow: hidden;',
      '}',
      '.do-box-classified {',
      '  border-color: rgba(160,32,240,0.7);',
      '  animation: doClassifiedPulse 1.4s ease-in-out infinite;',
      '}',
      '.do-header {',
      '  background: rgba(255,200,60,0.18);',
      '  color: #ffd24a;',
      '  font-weight: bold;',
      '  font-size: 10px;',
      '  letter-spacing: 1.5px;',
      '  padding: 3px 7px;',
      '  border-bottom: 1px solid rgba(255,200,60,0.25);',
      '}',
      '.do-header-bonus {',
      '  background: rgba(0,180,255,0.15);',
      '  color: #66ddff;',
      '  border-bottom-color: rgba(0,180,255,0.25);',
      '}',
      '.do-header-classified {',
      '  background: rgba(160,32,240,0.2);',
      '  color: #d080ff;',
      '  border-bottom-color: rgba(160,32,240,0.35);',
      '}',
      '.do-body {',
      '  padding: 5px 7px;',
      '  color: #e0e0e0;',
      '  line-height: 1.45;',
      '}',
      '.do-label {',
      '  margin-bottom: 3px;',
      '}',
      '.do-progress-row {',
      '  display: flex;',
      '  align-items: center;',
      '  gap: 5px;',
      '  margin-top: 3px;',
      '}',
      '.do-progress-track {',
      '  flex: 1;',
      '  height: 6px;',
      '  background: rgba(255,255,255,0.12);',
      '  border-radius: 3px;',
      '  overflow: hidden;',
      '}',
      '.do-progress-fill {',
      '  height: 100%;',
      '  background: linear-gradient(90deg, #ffd24a, #ff8800);',
      '  border-radius: 3px;',
      '  transition: width 0.3s ease;',
      '}',
      '.do-progress-fill-bonus {',
      '  background: linear-gradient(90deg, #00c8ff, #0055ff);',
      '}',
      '.do-progress-fill-classified {',
      '  background: linear-gradient(90deg, #a020f0, #d060ff);',
      '}',
      '.do-progress-txt {',
      '  color: #aaa;',
      '  font-size: 10px;',
      '  min-width: 28px;',
      '  text-align: right;',
      '}',
      '.do-complete .do-header { background: rgba(0,180,0,0.2); color: #44ff88; border-bottom-color: rgba(0,200,0,0.3); }',
      '.do-complete .do-progress-fill { background: #44cc66; }',
      '.do-complete .do-check { animation: doCheckFlash 0.6s ease-out both; color: #44ff88; }',
      '.do-failed .do-header { color: #888; background: rgba(80,80,80,0.2); }',
      '.do-failed .do-body   { color: #666; }',
      '.do-failed .do-progress-fill { background: #555; }',
      '#dyn-obj-banner {',
      '  position: fixed;',
      '  top: 28%;',
      '  left: 50%;',
      '  transform: translateX(-50%);',
      '  pointer-events: none;',
      '  z-index: 300;',
      '  font-family: "Courier New", Courier, monospace;',
      '  font-size: 22px;',
      '  font-weight: bold;',
      '  text-shadow: 0 0 16px #000, 0 2px 6px #000;',
      '  text-align: center;',
      '  padding: 8px 28px;',
      '  border-radius: 6px;',
      '  white-space: nowrap;',
      '  animation: doBannerIn 0.3s cubic-bezier(0.22,0.61,0.36,1) both;',
      '  display: none;',
      '}',
      '#dyn-obj-banner.do-banner-gold {',
      '  color: #ffd700;',
      '  background: rgba(0,0,0,0.82);',
      '  border: 2px solid #ffd700;',
      '  box-shadow: 0 0 24px rgba(255,215,0,0.55);',
      '}',
      '#dyn-obj-banner.do-banner-purple {',
      '  color: #d080ff;',
      '  background: rgba(0,0,0,0.82);',
      '  border: 2px solid #a020f0;',
      '  box-shadow: 0 0 24px rgba(160,32,240,0.6);',
      '}',
      '#dyn-obj-banner.do-banner-green {',
      '  color: #44ff88;',
      '  background: rgba(0,0,0,0.82);',
      '  border: 2px solid #44ff88;',
      '  box-shadow: 0 0 24px rgba(68,255,136,0.5);',
      '}',
    ].join('\n');
    document.head.appendChild(st);
  }

  /* ── DOM helpers ──────────────────────────────────────────────────────────── */
  function _getOrCreatePanel() {
    if (_panelEl && _panelEl.parentNode) return _panelEl;
    _panelEl = document.getElementById('dyn-obj-panel');
    if (!_panelEl) {
      _panelEl = document.createElement('div');
      _panelEl.id = 'dyn-obj-panel';
      document.body.appendChild(_panelEl);
    }
    return _panelEl;
  }

  function _getOrCreateBanner() {
    var el = document.getElementById('dyn-obj-banner');
    if (!el) {
      el = document.createElement('div');
      el.id = 'dyn-obj-banner';
      document.body.appendChild(el);
    }
    return el;
  }

  /* ── Progress bar ASCII (16 cells) ────────────────────────────────────────── */
  function _buildAsciiBar(progress, target, cells) {
    cells = cells || 16;
    var pct = target > 0 ? Math.min(1, progress / target) : 0;
    var filled = Math.round(pct * cells);
    var bar = '';
    for (var i = 0; i < cells; i++) bar += i < filled ? '█' : '░';
    return bar;
  }

  /* ── Render a single objective box ────────────────────────────────────────── */
  function _renderBox(obj, role) {
    if (!obj) return '';
    var isBonus      = role === 'bonus';
    var isClassified = role === 'classified';
    var complete     = !!obj.complete;
    var failed       = !!obj.failed;

    var boxClass    = 'do-box';
    var headerClass = 'do-header';
    if (isBonus)      headerClass += ' do-header-bonus';
    if (isClassified) { boxClass += ' do-box-classified'; headerClass += ' do-header-classified'; }
    if (complete)  boxClass += ' do-complete';
    if (failed)    boxClass += ' do-failed';

    var headerLabel = isBonus      ? 'BONUS OBJECTIVE'
                    : isClassified ? 'CLASSIFIED'
                    :                'PRIMARY OBJECTIVE';

    var checkMark = complete ? '<span class="do-check"> ✔</span>' : (failed ? ' ✗' : '');

    var labelText = obj.label || '';
    if (isClassified && !_classifiedUnlocked && !complete && !failed) {
      labelText = '??? (Complete a hidden action)';
    }

    var pct     = obj.target > 0 ? Math.min(1, obj.progress / obj.target) : 0;
    var fillPct = Math.round(pct * 100);
    var fillClass = 'do-progress-fill';
    if (isBonus)      fillClass += ' do-progress-fill-bonus';
    if (isClassified) fillClass += ' do-progress-fill-classified';

    var progressRow = '';
    if (obj.type !== OBJECTIVE_TYPES.ELIMINATE_HVT && obj.type !== OBJECTIVE_TYPES.REACH_POSITION && obj.type !== OBJECTIVE_TYPES.CAPTURE_POINT) {
      progressRow = '<div class="do-progress-row">'
        + '<div class="do-progress-track"><div class="' + fillClass + '" style="width:' + fillPct + '%"></div></div>'
        + '<span class="do-progress-txt">' + obj.progress + '/' + obj.target + '</span>'
        + '</div>';
    }

    return '<div class="' + boxClass + '">'
      + '<div class="' + headerClass + '">' + headerLabel + checkMark + '</div>'
      + '<div class="do-body">'
      + '<div class="do-label">' + _esc(labelText) + '</div>'
      + progressRow
      + '</div>'
      + '</div>';
  }

  /* ── Full panel re-render ─────────────────────────────────────────────────── */
  function _render() {
    var panel = _getOrCreatePanel();
    var html  = '';
    html += _renderBox(_primaryObjective, 'primary');
    if (_bonusObjective) html += _renderBox(_bonusObjective, 'bonus');
    if (_hasClassified && (_classifiedUnlocked || (_classifiedObj && (_classifiedObj.complete || _classifiedObj.failed)))) {
      html += _renderBox(_classifiedObj, 'classified');
    }
    panel.innerHTML = html;
  }

  /* ── Show the panel (slide in) ────────────────────────────────────────────── */
  function _showPanel() {
    var panel = _getOrCreatePanel();
    panel.classList.remove('do-hidden');
    panel.style.display = 'block';
    // Re-trigger animation
    panel.style.animation = 'none';
    /* jshint ignore:start */
    void panel.offsetWidth; // reflow
    /* jshint ignore:end */
    panel.style.animation = '';
    _render();
  }

  /* ── Hide the panel (slide out) ───────────────────────────────────────────── */
  function _hidePanel() {
    if (!_panelEl) return;
    _panelEl.classList.add('do-hidden');
    var el = _panelEl;
    setTimeout(function () {
      if (el && el.parentNode) el.style.display = 'none';
    }, 400);
  }

  /* ── Full-screen banner queue ─────────────────────────────────────────────── */
  function _showBanner(text, styleClass, duration) {
    _bannerQueue.push({ text: text, styleClass: styleClass || 'do-banner-gold', duration: duration || 3000 });
    if (!_bannerActive) _nextBanner();
  }

  function _nextBanner() {
    if (_bannerQueue.length === 0) { _bannerActive = false; return; }
    _bannerActive = true;
    var item = _bannerQueue.shift();
    var el = _getOrCreateBanner();
    el.textContent = item.text;
    el.className   = item.styleClass;
    el.style.display = 'block';
    el.style.opacity = '1';
    setTimeout(function () {
      el.style.transition = 'opacity 0.4s';
      el.style.opacity = '0';
      setTimeout(function () {
        el.style.display = 'none';
        el.style.transition = '';
        _nextBanner();
      }, 420);
    }, item.duration);
  }

  /* ── HTML escape ──────────────────────────────────────────────────────────── */
  function _esc(str) {
    return String(str).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  /* ── Add score + XP to player via game globals ────────────────────────────── */
  function _awardScore(score, xp) {
    try {
      if (window.GameManager && GameManager._addScore) {
        GameManager._addScore(score);
      } else if (window.GameManager && GameManager.player) {
        GameManager.player.score = (GameManager.player.score || 0) + score;
        if (window.HUD && HUD.setScore) HUD.setScore(GameManager.player.score);
      }
    } catch (e) {}
    try {
      if (window.Progression && Progression.addXP) Progression.addXP(xp);
    } catch (e) {}
    try {
      if (window.HUD && HUD.showStreakBanner) HUD.showStreakBanner('+' + score + ' BONUS SCORE', score);
    } catch (e) {}
  }

  /* ── Award dog tag (classified reward) ────────────────────────────────────── */
  function _awardDogTag(label) {
    try {
      if (window.DogTags && DogTags.awardSpecial) DogTags.awardSpecial(label || 'CLASSIFIED OP');
    } catch (e) {}
  }

  /* ── Build objective object ───────────────────────────────────────────────── */
  function _makeObjective(type, label, target, progress) {
    return {
      type:     type,
      label:    label,
      target:   target   || 0,
      progress: progress || 0,
      complete: false,
      failed:   false
    };
  }

  /* ── Wave-to-objective mapping ────────────────────────────────────────────── */
  function _buildPrimaryForWave(waveNum, enemyCount) {
    var killTarget = enemyCount || Math.max(5, 5 + waveNum * 2);
    // Boss wave: multiples of 10, or wave 10+
    if (waveNum > 0 && waveNum % 10 === 0) {
      return _makeObjective(
        OBJECTIVE_TYPES.ELIMINATE_HVT,
        'Eliminate the High Value Target',
        1, 0
      );
    }
    // All other waves: kill count primary
    return _makeObjective(
      OBJECTIVE_TYPES.KILL_COUNT,
      'Eliminate ' + killTarget + ' enemies',
      killTarget, 0
    );
  }

  function _buildBonusForWave(waveNum) {
    if (waveNum <= 2) {
      // No bonus for first waves — bonus is added mid-wave at 50%
      return null;
    }
    if (waveNum <= 4) {
      return _makeObjective(OBJECTIVE_TYPES.HEADSHOT_COUNT, 'Land 5 headshots', 5, 0);
    }
    if (waveNum <= 6) {
      _surviveTarget = 30 + waveNum * 5;
      return _makeObjective(OBJECTIVE_TYPES.SURVIVE_TIME, 'Survive for ' + _surviveTarget + ' seconds', _surviveTarget, 0);
    }
    // wave 7+
    return _makeObjective(OBJECTIVE_TYPES.KILL_STREAK, 'Achieve a 3-kill streak for +500 score', 3, 0);
  }

  function _buildMidWaveBonus(waveNum) {
    // Added dynamically at 50% kills
    if (waveNum <= 2) {
      return _makeObjective(OBJECTIVE_TYPES.KILL_STREAK, 'BONUS: Achieve 3-kill streak for +500 score', 3, 0);
    }
    if (waveNum <= 4) {
      return _makeObjective(OBJECTIVE_TYPES.HEADSHOT_COUNT, 'BONUS: Land 3 headshots for +500 score', 3, 0);
    }
    if (waveNum <= 6) {
      _surviveTarget = 20 + waveNum * 3;
      return _makeObjective(OBJECTIVE_TYPES.SURVIVE_TIME, 'BONUS: Survive ' + _surviveTarget + 's under pressure for +500 score', _surviveTarget, 0);
    }
    return _makeObjective(OBJECTIVE_TYPES.KILL_STREAK, 'BONUS: 3-kill streak for +500 score', 3, 0);
  }

  function _buildClassifiedForWave(waveNum) {
    return {
      type:      'CLASSIFIED',
      label:     'Land a headshot from beyond 40m',
      target:    1,
      progress:  0,
      complete:  false,
      failed:    false,
      reward:    { score: 1000, tag: 'CLASSIFIED OP WAVE ' + waveNum }
    };
  }

  /* ── Start survive-time ticker ────────────────────────────────────────────── */
  function _startSurviveTimer() {
    _stopSurviveTimer();
    _surviveTimer = 0;
    _timeIntervalId = setInterval(function () {
      if (!_bonusObjective || _bonusObjective.complete || _bonusObjective.failed) {
        _stopSurviveTimer();
        return;
      }
      if (_bonusObjective.type !== OBJECTIVE_TYPES.SURVIVE_TIME) {
        _stopSurviveTimer();
        return;
      }
      _surviveTimer++;
      _bonusObjective.progress = _surviveTimer;
      if (_surviveTimer >= _surviveTarget) {
        _completeObjective('bonus');
      } else {
        _render();
        if (window._onTimeForObjective) {
          try { window._onTimeForObjective(_surviveTimer, _surviveTarget); } catch (e) {}
        }
      }
    }, 1000);
  }

  function _stopSurviveTimer() {
    if (_timeIntervalId !== null) {
      clearInterval(_timeIntervalId);
      _timeIntervalId = null;
    }
  }

  /* ── Complete objective helper ────────────────────────────────────────────── */
  function _completeObjective(role) {
    var obj = role === 'primary' ? _primaryObjective
            : role === 'bonus'   ? _bonusObjective
            :                      _classifiedObj;
    if (!obj || obj.complete) return;
    obj.complete  = true;
    obj.progress  = obj.target;
    _render();

    if (role === 'bonus') {
      _stopSurviveTimer();
      _awardScore(500, 50);
      _showBanner('★ BONUS COMPLETE ★', 'do-banner-gold', 3000);
    } else if (role === 'classified') {
      _awardScore(1000, 100);
      _awardDogTag(obj.reward ? obj.reward.tag : 'CLASSIFIED OP');
      _showBanner('★ CLASSIFIED OBJECTIVE COMPLETE ★', 'do-banner-purple', 3500);
    } else if (role === 'primary') {
      // Check for "perfect mission" (primary + bonus + classified all complete)
      var bonusDone      = !_bonusObjective   || _bonusObjective.complete;
      var classifiedDone = !_hasClassified    || !_classifiedUnlocked || (_classifiedObj && _classifiedObj.complete);
      if (bonusDone && classifiedDone) {
        _awardScore(1500, 150);
        _showBanner('+1500 BONUS SCORE — PERFECT MISSION', 'do-banner-green', 4000);
      }
    }
  }

  /* ── Kill handling (called from game-manager hook) ────────────────────────── */
  function onKill(enemy, isHeadshot, streak) {
    if (!_primaryObjective || _primaryObjective.complete) return;

    // Primary: kill count
    if (_primaryObjective.type === OBJECTIVE_TYPES.KILL_COUNT && !_primaryObjective.failed) {
      _primaryObjective.progress = Math.min(_primaryObjective.target, _primaryObjective.progress + 1);
      if (_primaryObjective.progress >= _primaryObjective.target) {
        _completeObjective('primary');
      }
    }

    // Primary: HVT — game must mark enemy.isHVT = true
    if (_primaryObjective.type === OBJECTIVE_TYPES.ELIMINATE_HVT && enemy && enemy.isHVT) {
      _primaryObjective.progress = 1;
      _completeObjective('primary');
    }

    // Mid-wave bonus trigger: add at 50% kills
    if (!_midBonusTriggered && _primaryObjective.type === OBJECTIVE_TYPES.KILL_COUNT
        && _waveEnemyCount > 0
        && _primaryObjective.progress >= Math.ceil(_waveEnemyCount * 0.5)) {
      _midBonusTriggered = true;
      if (!_bonusObjective) {
        _bonusObjective = _buildMidWaveBonus(_waveNum);
        if (_bonusObjective && _bonusObjective.type === OBJECTIVE_TYPES.SURVIVE_TIME) {
          _startSurviveTimer();
        }
        _render();
        _showBanner('BONUS OBJECTIVE ADDED!', 'do-banner-gold', 2500);
      }
    }

    // Bonus: headshot count
    if (_bonusObjective && !_bonusObjective.complete && !_bonusObjective.failed
        && _bonusObjective.type === OBJECTIVE_TYPES.HEADSHOT_COUNT && isHeadshot) {
      _bonusObjective.progress = Math.min(_bonusObjective.target, _bonusObjective.progress + 1);
      if (_bonusObjective.progress >= _bonusObjective.target) {
        _completeObjective('bonus');
      }
    }

    // Bonus: kill streak
    if (_bonusObjective && !_bonusObjective.complete && !_bonusObjective.failed
        && _bonusObjective.type === OBJECTIVE_TYPES.KILL_STREAK) {
      var currentStreak = (streak !== undefined && streak !== null) ? streak : 0;
      if (currentStreak > _bonusObjective.progress) {
        _bonusObjective.progress = currentStreak;
      }
      if (_bonusObjective.progress >= _bonusObjective.target) {
        _completeObjective('bonus');
      }
    }

    // Classified: long-range headshot trigger
    if (_hasClassified && !_classifiedUnlocked && !_classifiedObj.complete) {
      var killDist = 0;
      try {
        if (enemy && enemy.mesh && window.GameManager && GameManager.player) {
          killDist = enemy.mesh.position.distanceTo(GameManager.player.position);
        }
      } catch (e) {}
      if (isHeadshot && killDist >= 40) {
        _classifiedUnlocked = true;
        _classifiedObj.progress = 1;
        _completeObjective('classified');
        _render();
        _showBanner('★ CLASSIFIED OBJECTIVE UNLOCKED ★', 'do-banner-purple', 3500);
      }
    }

    _render();
  }

  /* ── Public: setObjective (manual override) ──────────────────────────────── */
  function setObjective(role, type, label, target, progress) {
    var obj = _makeObjective(type || '', label || '', target || 0, progress || 0);
    if (role === 'primary') {
      _primaryObjective = obj;
    } else if (role === 'bonus') {
      _bonusObjective = obj;
    }
    _render();
  }

  /* ── Public: completeObjective ────────────────────────────────────────────── */
  function completeObjective(role) {
    _completeObjective(role);
  }

  /* ── Public: getActive ────────────────────────────────────────────────────── */
  function getActive() {
    return {
      primary:    _primaryObjective,
      bonus:      _bonusObjective,
      classified: _hasClassified ? _classifiedObj : null
    };
  }

  /* ── Public: reset ────────────────────────────────────────────────────────── */
  function reset() {
    _stopSurviveTimer();
    _primaryObjective   = null;
    _bonusObjective     = null;
    _classifiedObj      = null;
    _classifiedUnlocked = false;
    _hasClassified      = false;
    _midBonusTriggered  = false;
    _surviveTimer       = 0;
    _surviveTarget      = 0;
    _waveNum            = 0;
    _waveEnemyCount     = 0;
    _bannerQueue        = [];
    _bannerActive       = false;
    if (_panelEl) { _panelEl.innerHTML = ''; _panelEl.style.display = 'none'; }
  }

  /* ── Public: init — called at each wave start ─────────────────────────────── */
  function init(waveNum, enemyCount) {
    _injectStyles();
    _stopSurviveTimer();

    _waveNum        = waveNum  || 1;
    _waveEnemyCount = enemyCount || 0;
    _midBonusTriggered  = false;
    _classifiedUnlocked = false;
    _bannerQueue        = [];
    _bannerActive       = false;

    // Build primary
    _primaryObjective = _buildPrimaryForWave(_waveNum, _waveEnemyCount);

    // Build bonus (if wave >= 3; waves 1-2 get bonus added dynamically at 50%)
    if (_waveNum >= 3) {
      _bonusObjective = _buildBonusForWave(_waveNum);
      if (_bonusObjective && _bonusObjective.type === OBJECTIVE_TYPES.SURVIVE_TIME) {
        _startSurviveTimer();
      }
    } else {
      _bonusObjective = null;
    }

    // 10% chance of classified objective
    _hasClassified = (Math.random() < 0.10);
    if (_hasClassified) {
      _classifiedObj = _buildClassifiedForWave(_waveNum);
    } else {
      _classifiedObj = null;
    }

    // Install global kill hook
    window._onKillForObjective = function (enemy, isHeadshot, streak) {
      onKill(enemy, isHeadshot, streak);
    };

    // Time hook (for external time-of-day or survive-time polling)
    window._onTimeForObjective = null;

    _showPanel();
  }

  /* ── Public: update — called each game frame (optional) ──────────────────── */
  function update(dt) {
    // Survive-time is handled via setInterval; nothing extra needed per-frame.
    // This hook is available for future objectives needing per-frame checks.
  }

  /* ── Public API ──────────────────────────────────────────────────────────── */
  return {
    init:             init,
    update:           update,
    setObjective:     setObjective,
    completeObjective: completeObjective,
    getActive:        getActive,
    reset:            reset,
    onKill:           onKill,
    // Expose constants for external use
    TYPES:            OBJECTIVE_TYPES
  };

})();
