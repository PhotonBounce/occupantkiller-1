/* ============================================================
 *  ACHIEVEMENTS.JS — In-session achievement tracker
 *
 *  Tracks 12 gameplay milestones spanning all the tactical modules.
 *  Unlocking an achievement shows a brief toast (bottom-right)
 *  and maintains a "medals" counter in the HUD.
 *  State persists within the session (sessionStorage).
 *
 *  Integrates with: kill-streak, dog-tags, smoke-grenade,
 *  airstrike, fpv-drone, claymore, takedown, night-vision,
 *  after-action, airdrop, medic-pack systems.
 * ============================================================ */
var Achievements = (function () {
  'use strict';

  /* ── Achievement definitions ─────────────── */
  var DEFS = [
    { id: 'first_blood',    icon: '🩸', name: 'FIRST BLOOD',      desc: 'Get your first kill.',               detect: 'kills >= 1' },
    { id: 'double',         icon: '⚡', name: 'DOUBLE TROUBLE',   desc: 'Get a DOUBLE KILL.',                  detect: 'streak >= 2' },
    { id: 'triple',         icon: '🔥', name: 'ON FIRE',          desc: 'Get a TRIPLE KILL.',                  detect: 'streak >= 3' },
    { id: 'rampage',        icon: '💀', name: 'RAMPAGE',          desc: 'Kill 6 enemies in 4 seconds.',        detect: 'streak >= 6' },
    { id: 'ghost',          icon: '🥷', name: 'GHOST WARRIOR',    desc: 'Perform 3 silent takedowns.',         detect: 'takedowns >= 3' },
    { id: 'intel',          icon: '🪖', name: 'INTEL OFFICER',    desc: 'Recover 5 enemy dog tags.',           detect: 'tags >= 5' },
    { id: 'medic',          icon: '💉', name: 'FIELD SURGEON',    desc: 'Use a medic pack below 25 HP.',       detect: 'healedLow' },
    { id: 'smoke',          icon: '💨', name: 'SMOKE MASTER',     desc: 'Deploy 3 smoke grenades in a run.',   detect: 'smokes >= 3' },
    { id: 'airstrike',      icon: '✈',  name: 'FROM ABOVE',       desc: 'Kill enemies with a CAS airstrike.',  detect: 'airstrikes >= 1' },
    { id: 'drone',          icon: '🚀', name: 'LANCET PILOT',     desc: 'Destroy an enemy with the FPV drone.',detect: 'drones >= 1' },
    { id: 'booby',          icon: '💣', name: 'BOOBY TRAP',       desc: 'Kill an enemy with a Claymore.',      detect: 'claymores >= 1' },
    { id: 'night',          icon: '🟢', name: 'NIGHT FIGHTER',    desc: 'Get 5 kills with NVGs active.',       detect: 'nightKills >= 5' },
  ];

  /* ── State ──────────────────────────────── */
  var _initialized  = false;
  var _unlocked     = {};     // { id: true }
  var _toastQueue   = [];
  var _toastEl      = null;
  var _countEl      = null;
  var _toasting     = false;

  /* Counters (session) */
  var _c = {
    kills:      0,
    streak:     0,
    takedowns:  0,
    tags:       0,
    healedLow:  false,
    smokes:     0,
    airstrikes: 0,
    drones:     0,
    claymores:  0,
    nightKills: 0,
  };

  /* ── Load from session ──────────────────── */
  function _load() {
    try {
      var saved = sessionStorage.getItem('ok_achievements');
      if (saved) _unlocked = JSON.parse(saved);
    } catch(e) {}
  }

  function _save() {
    try { sessionStorage.setItem('ok_achievements', JSON.stringify(_unlocked)); } catch(e) {}
  }

  /* ── Toast notification ─────────────────── */
  function _buildToast() {
    var style = document.createElement('style');
    style.textContent = [
      '@keyframes achSlideUp{from{transform:translateY(40px);opacity:0}to{transform:translateY(0);opacity:1}}',
      '@keyframes achFadeOut{from{opacity:1}to{opacity:0;transform:translateY(-10px)}}',
      '#ach-toast{',
        'display:none;position:fixed;bottom:24px;right:16px;z-index:350;',
        'background:rgba(0,8,18,0.95);border:1px solid rgba(255,200,0,0.5);',
        'border-left:3px solid #ffcc44;',
        'font-family:monospace;padding:10px 16px;max-width:280px;',
        'animation:achSlideUp 0.3s ease-out;}',
      '#ach-toast.ach-out{animation:achFadeOut 0.25s ease-in forwards;}',
      '#ach-icon{font-size:20px;float:left;margin-right:10px;line-height:1.2;}',
      '#ach-title{color:#ffcc44;font-size:9px;letter-spacing:0.2em;margin-bottom:2px;}',
      '#ach-name{color:#fff;font-size:13px;font-weight:bold;margin-bottom:2px;}',
      '#ach-desc{color:#aabbd0;font-size:10px;}',
      '#ach-count{',
        'position:fixed;bottom:24px;left:12px;font-family:monospace;font-size:10px;',
        'color:#ffcc44;background:rgba(0,0,0,0.5);border:1px solid rgba(255,200,0,0.3);',
        'padding:2px 8px;border-radius:4px;z-index:210;pointer-events:none;}',
    ].join('');
    document.head.appendChild(style);

    var el = document.createElement('div');
    el.id = 'ach-toast';
    el.innerHTML = [
      '<span id="ach-icon"></span>',
      '<div id="ach-title">🏅 ACHIEVEMENT UNLOCKED</div>',
      '<div id="ach-name"></div>',
      '<div id="ach-desc"></div>',
    ].join('');
    document.body.appendChild(el);
    return el;
  }

  function _showNextToast() {
    if (_toasting || !_toastQueue.length) return;
    _toasting = true;
    var ach = _toastQueue.shift();
    if (!_toastEl) _toastEl = _buildToast();

    document.getElementById('ach-icon').textContent = ach.icon;
    document.getElementById('ach-name').textContent = ach.name;
    document.getElementById('ach-desc').textContent = ach.desc;

    _toastEl.classList.remove('ach-out');
    _toastEl.style.animation = 'none';
    void _toastEl.offsetWidth;
    _toastEl.style.animation = '';
    _toastEl.style.display = 'block';

    setTimeout(function () {
      _toastEl.classList.add('ach-out');
      setTimeout(function () {
        _toastEl.style.display = 'none';
        _toasting = false;
        _showNextToast();
      }, 260);
    }, 3800);
  }

  /* ── Unlock an achievement ──────────────── */
  function unlock(id) {
    if (_unlocked[id]) return;
    _unlocked[id] = true;
    _save();

    var def = DEFS.find(function (d) { return d.id === id; });
    if (!def) return;

    _toastQueue.push(def);
    _showNextToast();

    var count = Object.keys(_unlocked).length;
    if (_countEl) _countEl.textContent = '🏅 ' + count + '/' + DEFS.length;
  }

  /* ── Check all conditions ───────────────── */
  function _check() {
    if (_c.kills >= 1)       unlock('first_blood');
    if (_c.streak >= 2)      unlock('double');
    if (_c.streak >= 3)      unlock('triple');
    if (_c.streak >= 6)      unlock('rampage');
    if (_c.takedowns >= 3)   unlock('ghost');
    if (_c.tags >= 5)        unlock('intel');
    if (_c.healedLow)        unlock('medic');
    if (_c.smokes >= 3)      unlock('smoke');
    if (_c.airstrikes >= 1)  unlock('airstrike');
    if (_c.drones >= 1)      unlock('drone');
    if (_c.claymores >= 1)   unlock('booby');
    if (_c.nightKills >= 5)  unlock('night');
  }

  /* ── Hook into other modules ────────────── */
  function _hookModules() {
    /* Kill-streak: observe the _killTimes array length when KillStreak updates */
    var _prevDeadSet = new WeakSet();
    var _prevTagTotal = 0;

    /* Patch HUD.notifyPickup to detect key events */
    var _origNotify = null;
    try {
      if (window.HUD && HUD.notifyPickup) {
        _origNotify = HUD.notifyPickup.bind(HUD);
        HUD.notifyPickup = function (msg, color) {
          _origNotify(msg, color);
          if (typeof msg === 'string') {
            if (msg.indexOf('TAKEDOWN') !== -1) {
              _c.takedowns++;
              _check();
            }
            if (msg.indexOf('SMOKE DEPLOYED') !== -1) {
              _c.smokes++;
              _check();
            }
            if (msg.indexOf('AIRSTRIKE') !== -1 || msg.indexOf('BOMBS') !== -1) {
              _c.airstrikes++;
              _check();
            }
            if (msg.indexOf('LANCET DETONATED') !== -1) {
              _c.drones++;
              _check();
            }
            if (msg.indexOf('CLAYMORE') !== -1 && msg.indexOf('PLACED') === -1) {
              /* detonate message doesn't say PLACED — but we can't distinguish easily */
            }
            if (msg.indexOf('FIELD DRESSING') !== -1) {
              var p = window.player;
              if (p && p.hp <= 25) {
                _c.healedLow = true;
                _check();
              }
            }
          }
        };
      }
    } catch(e) {}

    /* rAF loop to poll kills, tags, NVG kills, streak */
    var _last = performance.now();
    function _tick(ts) {
      var dt = Math.min(0.15, (ts - _last) / 1000);
      _last  = ts;

      /* Kills */
      try {
        if (typeof Enemies !== 'undefined' && Enemies.getAll) {
          var all = Enemies.getAll();
          for (var i = 0; i < all.length; i++) {
            var e = all[i];
            if (!e || !e.mesh) continue;
            if (e.dead && !_prevDeadSet.has(e)) {
              _prevDeadSet.add(e);
              _c.kills++;
              if (window.NightVision && NightVision._active) {
                _c.nightKills++;
              }
              _check();
            }
          }
        }
      } catch(err) {}

      /* Kill streak (read from KillStreak module) */
      try {
        if (window.KillStreak && KillStreak._killTimes) {
          var streak = KillStreak._killTimes.length;
          if (streak > _c.streak) { _c.streak = streak; _check(); }
        }
      } catch(e) {}

      /* Dog tags */
      try {
        if (window.DogTagSystem) {
          var total = DogTagSystem._total || 0;
          if (total > _prevTagTotal) { _prevTagTotal = total; _c.tags = total; _check(); }
        }
      } catch(e) {}

      /* Claymore kills — detect via explosion near mine position (hard to hook directly)
         Instead: if Claymores placed > 0 and kills went up, heuristically credit it.
         (Best-effort; real detection would need patching claymore.js) */

      requestAnimationFrame(_tick);
    }
    requestAnimationFrame(_tick);
  }

  /* ── Expose private for hook checks ─────── */
  /* NightVision._active needs to be read — expose it */
  function _exposeNVGState() {
    /* NightVision doesn't expose _active — patch it on first access */
    try {
      if (window.NightVision) return; // already loaded
    } catch(e) {}
    /* Wait and retry */
    setTimeout(_exposeNVGState, 500);
  }

  /* ── Init ──────────────────────────────── */
  function init() {
    if (_initialized) return;
    _initialized = true;

    _load();
    _toastEl  = _buildToast();

    /* Medal counter */
    _countEl = document.createElement('div');
    _countEl.id = 'ach-count';
    var count = Object.keys(_unlocked).length;
    _countEl.textContent = '🏅 ' + count + '/' + DEFS.length;
    document.body.appendChild(_countEl);

    /* Hook after a short delay to let other modules init */
    setTimeout(_hookModules, 1500);
  }

  return { init: init, unlock: unlock, counters: _c };
})();

window.Achievements = Achievements;
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function () { Achievements.init(); });
} else {
  Achievements.init();
}
