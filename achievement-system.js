/* achievement-system.js — 20 achievements with unlock toasts and gallery
 * Follows project convention: all var, IIFE, window.AchievementSystem
 */
window.AchievementSystem = (function() {
  'use strict';

  var STORAGE_KEY = 'okk_achievements_v1';

  /* ── Achievement definitions ────────────────────────────────── */
  var ACHIEVEMENTS = [
    { id: 'first_blood',   name: 'FIRST BLOOD',   desc: 'Get your first kill.',                              icon: '🩸', unlocked: false, secret: false },
    { id: 'headhunter',    name: 'HEADHUNTER',    desc: '5 headshots in a single wave.',                     icon: '🎯', unlocked: false, secret: false },
    { id: 'executioner',   name: 'EXECUTIONER',   desc: 'Execute 3 surrendered enemies.',                    icon: '⚔️', unlocked: false, secret: false },
    { id: 'mercy',         name: 'MERCY',         desc: 'Spare 5 surrendered enemies.',                      icon: '🕊️', unlocked: false, secret: false },
    { id: 'ghost',         name: 'GHOST',         desc: 'Complete a level without triggering any alerts.',   icon: '👻', unlocked: false, secret: false },
    { id: 'iron_will',     name: 'IRON WILL',     desc: 'Survive with less than 5 HP.',                     icon: '💪', unlocked: false, secret: false },
    { id: 'suppressor',    name: 'SUPPRESSOR',    desc: 'Kill 10 enemies while suppressed.',                 icon: '🔇', unlocked: false, secret: false },
    { id: 'technician',    name: 'TECHNICIAN',    desc: 'Defuse a bomb with less than 5 seconds remaining.', icon: '🔧', unlocked: false, secret: false },
    { id: 'predator',      name: 'PREDATOR',      desc: 'Achieve a 20-kill streak.',                        icon: '🦅', unlocked: false, secret: false },
    { id: 'blade_runner',  name: 'BLADE RUNNER',  desc: '5 stealth knife kills in one level.',              icon: '🔪', unlocked: false, secret: false },
    { id: 'tanker',        name: 'TANKER',        desc: 'Destroy a Bradley or BTR vehicle.',                icon: '🚛', unlocked: false, secret: false },
    { id: 'airborne',      name: 'AIRBORNE',      desc: 'Complete parachute insertion 3 times.',            icon: '🪂', unlocked: false, secret: false },
    { id: 'collector',     name: 'COLLECTOR',     desc: 'Find 5 intel documents in one level.',             icon: '📄', unlocked: false, secret: false },
    { id: 'fortress',      name: 'FORTRESS',      desc: 'Place 3 fortifications in one level.',             icon: '🏰', unlocked: false, secret: false },
    { id: 'medic',         name: 'MEDIC',         desc: 'Consume 5 field rations in one level.',            icon: '💊', unlocked: false, secret: false },
    { id: 'marksman',      name: 'MARKSMAN',      desc: 'Land a sniper shot from 50m or more.',             icon: '🏹', unlocked: false, secret: false },
    { id: 'survivor',      name: 'SURVIVOR',      desc: 'Complete the game in hardcore mode.',              icon: '🛡️', unlocked: false, secret: true  },
    { id: 'full_house',    name: 'FULL HOUSE',    desc: 'Capture all 3 territory control points.',          icon: '🏴', unlocked: false, secret: false },
    { id: 'exterminator',  name: 'EXTERMINATOR',  desc: 'Kill 500 enemies in total (cumulative).',          icon: '💀', unlocked: false, secret: false },
    { id: 'legend',        name: 'LEGEND',        desc: 'Reach the rank of General.',                       icon: '⭐', unlocked: false, secret: true  }
  ];

  /* ── Session stats ─────────────────────────────────────────── */
  window._totalKills         = window._totalKills         || 0;
  window._totalHeadshots     = window._totalHeadshots     || 0;
  window._currentStreak      = window._currentStreak      || 0;
  window._waveHeadshots      = window._waveHeadshots      || 0;
  window._waveStealth        = window._waveStealth        || 0;
  window._levelAlerts        = window._levelAlerts        || 0;
  window._levelKnifeKills    = window._levelKnifeKills    || 0;
  window._levelIntelFound    = window._levelIntelFound    || 0;
  window._levelFortifications= window._levelFortifications|| 0;
  window._levelRations       = window._levelRations       || 0;
  window._parachuteInserts   = window._parachuteInserts   || 0;
  window._surrenderExecuted  = window._surrenderExecuted  || 0;
  window._surrenderSpared    = window._surrenderSpared    || 0;
  window._suppKills          = window._suppKills          || 0;
  window._capturedPoints     = window._capturedPoints     || 0;

  /* ── Toast queue ───────────────────────────────────────────── */
  var _toastQueue = [];
  var _toastActive = false;

  /* ── Internal state ────────────────────────────────────────── */
  var _achievements = [];
  var _initialized = false;

  /* ── Persistence ────────────────────────────────────────────── */
  function _load() {
    var raw;
    try { raw = localStorage.getItem(STORAGE_KEY); } catch(e) { raw = null; }
    var saved = raw ? JSON.parse(raw) : {};
    _achievements = ACHIEVEMENTS.map(function(def) {
      return {
        id:       def.id,
        name:     def.name,
        desc:     def.desc,
        icon:     def.icon,
        secret:   def.secret,
        unlocked: saved[def.id] === true
      };
    });
  }

  function _save() {
    var map = {};
    for (var i = 0; i < _achievements.length; i++) {
      if (_achievements[i].unlocked) { map[_achievements[i].id] = true; }
    }
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(map)); } catch(e) {}
  }

  /* ── Audio: 4-note ascending arpeggio C-E-G-C ──────────────── */
  function _playAudio() {
    try {
      var AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) { return; }
      var ctx = new AudioCtx();
      var notes = [261.63, 329.63, 392.00, 523.25]; // C4, E4, G4, C5
      for (var n = 0; n < notes.length; n++) {
        (function(freq, delay) {
          var osc  = ctx.createOscillator();
          var gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);
          gain.gain.setValueAtTime(0.0, ctx.currentTime + delay);
          gain.gain.linearRampToValueAtTime(0.25, ctx.currentTime + delay + 0.02);
          gain.gain.linearRampToValueAtTime(0.0,  ctx.currentTime + delay + 0.18);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(ctx.currentTime + delay);
          osc.stop(ctx.currentTime  + delay + 0.2);
        })(notes[n], n * 0.15);
      }
      setTimeout(function() { try { ctx.close(); } catch(e) {} }, 1200);
    } catch(e) {}
  }

  /* ── Toast DOM ──────────────────────────────────────────────── */
  function _ensureStyles() {
    if (document.getElementById('ach-sys-style')) { return; }
    var s = document.createElement('style');
    s.id = 'ach-sys-style';
    s.textContent = [
      '@keyframes achSlideIn{from{transform:translateX(120%);opacity:0}to{transform:translateX(0);opacity:1}}',
      '@keyframes achSlideOut{from{transform:translateX(0);opacity:1}to{transform:translateX(120%);opacity:0}}',
      '@keyframes achStarSpin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}',
      '#ach-toast-container{position:fixed;top:80px;right:18px;z-index:9990;pointer-events:none;display:flex;flex-direction:column;gap:8px;}',
      '.ach-toast{background:rgba(10,8,2,0.95);border:2px solid #ffd700;border-radius:8px;padding:10px 16px;',
      '  font-family:monospace;color:#fff;min-width:260px;max-width:340px;',
      '  box-shadow:0 0 18px rgba(255,215,0,0.45);',
      '  animation:achSlideIn 0.35s cubic-bezier(0.22,1,0.36,1) forwards;}',
      '.ach-toast.ach-out{animation:achSlideOut 0.35s ease-in forwards;}',
      '.ach-toast-header{color:#ffd700;font-size:10px;letter-spacing:2px;margin-bottom:4px;display:flex;align-items:center;gap:6px;}',
      '.ach-toast-star{display:inline-block;font-size:13px;animation:achStarSpin 0.8s linear infinite;}',
      '.ach-toast-name{font-size:14px;font-weight:bold;color:#fff;margin-bottom:2px;}',
      '.ach-toast-desc{font-size:10px;color:#aaa;line-height:1.4;}',
      /* gallery */
      '#ach-gallery-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.85);z-index:9991;display:flex;align-items:center;justify-content:center;}',
      '#ach-gallery-box{background:#0d0d0d;border:2px solid #ffd700;border-radius:10px;padding:24px;',
      '  font-family:monospace;color:#fff;max-width:680px;width:90vw;max-height:80vh;overflow-y:auto;',
      '  box-shadow:0 0 40px rgba(255,215,0,0.3);}',
      '#ach-gallery-title{color:#ffd700;font-size:16px;letter-spacing:3px;margin-bottom:18px;text-align:center;}',
      '#ach-gallery-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:12px;}',
      '.ach-card{border-radius:6px;padding:10px 8px;text-align:center;transition:transform 0.15s;}',
      '.ach-card.locked{background:rgba(255,255,255,0.04);border:1px solid #333;color:#555;}',
      '.ach-card.unlocked{background:rgba(255,215,0,0.08);border:1px solid #ffd700;color:#fff;}',
      '.ach-card:hover{transform:scale(1.04);}',
      '.ach-card-icon{font-size:26px;margin-bottom:6px;}',
      '.ach-card.locked .ach-card-icon{filter:grayscale(1);opacity:0.3;}',
      '.ach-card-name{font-size:9px;letter-spacing:1px;font-weight:bold;margin-bottom:3px;}',
      '.ach-card-desc{font-size:8px;line-height:1.35;color:#888;}',
      '.ach-card.unlocked .ach-card-desc{color:#bbb;}',
      '.ach-card.locked .ach-card-name{color:#555;}',
      '.ach-gallery-close{display:block;margin:18px auto 0;padding:6px 28px;background:rgba(255,215,0,0.12);',
      '  border:1px solid #ffd700;color:#ffd700;cursor:pointer;font-family:monospace;font-size:12px;border-radius:4px;}',
      '.ach-gallery-close:hover{background:rgba(255,215,0,0.25);}'
    ].join('');
    document.head.appendChild(s);
  }

  function _ensureContainer() {
    if (document.getElementById('ach-toast-container')) { return; }
    var c = document.createElement('div');
    c.id = 'ach-toast-container';
    document.body.appendChild(c);
  }

  function _showNextToast() {
    if (_toastActive || _toastQueue.length === 0) { return; }
    _toastActive = true;
    var ach = _toastQueue.shift();
    _ensureContainer();
    var t = document.createElement('div');
    t.className = 'ach-toast';
    t.innerHTML =
      '<div class="ach-toast-header">' +
        '<span class="ach-toast-star">★</span>' +
        'ACHIEVEMENT UNLOCKED' +
      '</div>' +
      '<div class="ach-toast-name">' + ach.icon + '  ' + ach.name + '</div>' +
      '<div class="ach-toast-desc">' + ach.desc + '</div>';
    document.getElementById('ach-toast-container').appendChild(t);
    _playAudio();
    setTimeout(function() {
      t.classList.add('ach-out');
      setTimeout(function() {
        if (t.parentNode) { t.parentNode.removeChild(t); }
        _toastActive = false;
        _showNextToast();
      }, 380);
    }, 4000);
  }

  function _queueToast(ach) {
    _toastQueue.push(ach);
    _showNextToast();
  }

  /* ── Public: unlock ─────────────────────────────────────────── */
  function unlock(id) {
    for (var i = 0; i < _achievements.length; i++) {
      if (_achievements[i].id === id && !_achievements[i].unlocked) {
        _achievements[i].unlocked = true;
        _save();
        _queueToast(_achievements[i]);
        return true;
      }
    }
    return false;
  }

  /* ── Public: check ──────────────────────────────────────────── */
  function check(event, data) {
    data = data || {};
    switch (event) {

      case 'kill':
        window._totalKills = (window._totalKills || 0) + 1;
        window._currentStreak = (window._currentStreak || 0) + 1;
        if (window._totalKills === 1)                         { unlock('first_blood'); }
        if (window._currentStreak >= 20)                      { unlock('predator'); }
        if (window._totalKills >= 500)                        { unlock('exterminator'); }
        if (data.suppressed)  {
          window._suppKills = (window._suppKills || 0) + 1;
          if (window._suppKills >= 10)                        { unlock('suppressor'); }
        }
        if (data.stealth && data.knife) {
          window._levelKnifeKills = (window._levelKnifeKills || 0) + 1;
          if (window._levelKnifeKills >= 5)                   { unlock('blade_runner'); }
        }
        if (data.vehicle)                                     { unlock('tanker'); }
        break;

      case 'streak_reset':
        window._currentStreak = 0;
        break;

      case 'headshot':
        window._totalHeadshots = (window._totalHeadshots || 0) + 1;
        window._waveHeadshots  = (window._waveHeadshots  || 0) + 1;
        if (window._waveHeadshots >= 5)                       { unlock('headhunter'); }
        if (data.distance && data.distance >= 50)             { unlock('marksman'); }
        break;

      case 'wave_end':
        window._waveHeadshots  = 0;
        break;

      case 'level_end':
        if (window._levelAlerts === 0)                        { unlock('ghost'); }
        window._levelKnifeKills     = 0;
        window._levelAlerts         = 0;
        window._levelIntelFound     = 0;
        window._levelFortifications = 0;
        window._levelRations        = 0;
        break;

      case 'alert':
        window._levelAlerts = (window._levelAlerts || 0) + 1;
        break;

      case 'low_hp':
        if (data.hp !== undefined && data.hp < 5)             { unlock('iron_will'); }
        break;

      case 'defuse':
        if (data.timeLeft !== undefined && data.timeLeft < 5) { unlock('technician'); }
        break;

      case 'surrender_execute':
        window._surrenderExecuted = (window._surrenderExecuted || 0) + 1;
        if (window._surrenderExecuted >= 3)                   { unlock('executioner'); }
        break;

      case 'surrender_spare':
        window._surrenderSpared = (window._surrenderSpared || 0) + 1;
        if (window._surrenderSpared >= 5)                     { unlock('mercy'); }
        break;

      case 'parachute':
        window._parachuteInserts = (window._parachuteInserts || 0) + 1;
        if (window._parachuteInserts >= 3)                    { unlock('airborne'); }
        break;

      case 'intel':
        window._levelIntelFound = (window._levelIntelFound || 0) + 1;
        if (window._levelIntelFound >= 5)                     { unlock('collector'); }
        break;

      case 'fortification':
        window._levelFortifications = (window._levelFortifications || 0) + 1;
        if (window._levelFortifications >= 3)                 { unlock('fortress'); }
        break;

      case 'ration':
        window._levelRations = (window._levelRations || 0) + 1;
        if (window._levelRations >= 5)                        { unlock('medic'); }
        break;

      case 'point_captured':
        window._capturedPoints = (window._capturedPoints || 0) + 1;
        if (window._capturedPoints >= 3)                      { unlock('full_house'); }
        break;

      case 'rank_general':
        unlock('legend');
        break;

      case 'hardcore_complete':
        unlock('survivor');
        break;

      default:
        break;
    }
  }

  /* ── Public: showAll ────────────────────────────────────────── */
  function showAll() {
    _ensureStyles();
    if (document.getElementById('ach-gallery-overlay')) { return; }
    var overlay = document.createElement('div');
    overlay.id = 'ach-gallery-overlay';

    var unlockedCount = 0;
    for (var i = 0; i < _achievements.length; i++) {
      if (_achievements[i].unlocked) { unlockedCount++; }
    }

    var cards = '';
    for (var j = 0; j < _achievements.length; j++) {
      var a = _achievements[j];
      var cls = a.unlocked ? 'ach-card unlocked' : 'ach-card locked';
      var iconHtml = a.unlocked ? a.icon : (a.secret ? '?' : a.icon);
      var nameHtml = a.unlocked ? a.name : (a.secret ? '???' : a.name);
      var descHtml = a.unlocked ? a.desc : (a.secret ? 'Secret achievement' : a.desc);
      cards += '<div class="' + cls + '">' +
        '<div class="ach-card-icon">' + iconHtml + '</div>' +
        '<div class="ach-card-name">' + nameHtml + '</div>' +
        '<div class="ach-card-desc">'  + descHtml  + '</div>' +
        '</div>';
    }

    overlay.innerHTML =
      '<div id="ach-gallery-box">' +
        '<div id="ach-gallery-title">★ ACHIEVEMENTS ★</div>' +
        '<div style="text-align:center;font-size:11px;color:#888;margin-bottom:14px;">' +
          unlockedCount + ' / ' + _achievements.length + ' unlocked' +
        '</div>' +
        '<div id="ach-gallery-grid">' + cards + '</div>' +
        '<button class="ach-gallery-close" id="ach-gallery-close-btn">CLOSE</button>' +
      '</div>';

    document.body.appendChild(overlay);

    document.getElementById('ach-gallery-close-btn').addEventListener('click', function() {
      if (overlay.parentNode) { overlay.parentNode.removeChild(overlay); }
    });
    overlay.addEventListener('click', function(e) {
      if (e.target === overlay) {
        if (overlay.parentNode) { overlay.parentNode.removeChild(overlay); }
      }
    });
  }

  /* ── Public: reset ──────────────────────────────────────────── */
  function reset() {
    try { localStorage.removeItem(STORAGE_KEY); } catch(e) {}
    for (var i = 0; i < _achievements.length; i++) {
      _achievements[i].unlocked = false;
    }
    window._totalKills          = 0;
    window._totalHeadshots      = 0;
    window._currentStreak       = 0;
    window._waveHeadshots       = 0;
    window._waveStealth         = 0;
    window._levelAlerts         = 0;
    window._levelKnifeKills     = 0;
    window._levelIntelFound     = 0;
    window._levelFortifications = 0;
    window._levelRations        = 0;
    window._parachuteInserts    = 0;
    window._surrenderExecuted   = 0;
    window._surrenderSpared     = 0;
    window._suppKills           = 0;
    window._capturedPoints      = 0;
  }

  /* ── Public: init ───────────────────────────────────────────── */
  function init() {
    if (_initialized) { return; }
    _initialized = true;
    _load();
    _ensureStyles();

    /* Global hooks for other modules */
    window._onKillForAchievements = function(data) { check('kill', data); };
    window._onDefuseForAchievements = function(data) { check('defuse', data); };
    console.log('[AchievementSystem] init — ' + _achievements.length + ' achievements loaded.');
  }

  return { init: init, check: check, unlock: unlock, showAll: showAll, reset: reset };
})();
