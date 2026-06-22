/* ───────────────────────────────────────────────────────────────────────
   TROPHY SYSTEM — 15 unlockable trophies, persisted in localStorage
   Key: okk_trophies_v1
   Tab key shows/hides the trophy cabinet (grid layout, gold/grey tiles).
   On unlock: gold slide-in panel top-right, 3s, plays achievement sound.
   window._onTrophyUnlock(id, trophy) hook fires after each award.
   ─────────────────────────────────────────────────────────────────────── */
window.TrophySystem = (function () {
  'use strict';

  var STORAGE_KEY = 'okk_trophies_v1';

  /* ── Trophy definitions ───────────────────────────────────────────────── */
  var TROPHY_DEFS = [
    {
      id: 'FIRST_BLOOD',
      icon: '🩸',
      name: 'FIRST BLOOD',
      desc: 'Get your first kill'
    },
    {
      id: 'DEADEYE',
      icon: '🎯',
      name: 'DEADEYE',
      desc: '10 headshots in one life'
    },
    {
      id: 'IRON_FIST',
      icon: '🔪',
      name: 'IRON FIST',
      desc: 'Kill 5 enemies with knife'
    },
    {
      id: 'GHOST',
      icon: '👻',
      name: 'GHOST',
      desc: 'Survive 3 minutes without taking damage'
    },
    {
      id: 'BUNKER_BUSTER',
      icon: '💥',
      name: 'BUNKER BUSTER',
      desc: 'Destroy 3 explosive barrels in one wave'
    },
    {
      id: 'COMMANDER_SLAYER',
      icon: '⭐',
      name: 'COMMANDER SLAYER',
      desc: 'Kill the patrol commander'
    },
    {
      id: 'MEDIC',
      icon: '🏥',
      name: 'MEDIC!',
      desc: 'Survive below 10 HP for 30 seconds'
    },
    {
      id: 'DRONE_MASTER',
      icon: '🚁',
      name: 'DRONE MASTER',
      desc: 'Destroy enemy helicopter with counter-UAV'
    },
    {
      id: 'HORDE_SURVIVOR',
      icon: '🌊',
      name: 'HORDE SURVIVOR',
      desc: 'Survive 10 waves in horde mode'
    },
    {
      id: 'BOMB_TECHNICIAN',
      icon: '💣',
      name: 'BOMB TECHNICIAN',
      desc: 'Defuse 3 bombs in total'
    },
    {
      id: 'SUPPLY_KING',
      icon: '📦',
      name: 'SUPPLY KING',
      desc: 'Complete 5 supply runs'
    },
    {
      id: 'BERSERK',
      icon: '⚡',
      name: 'BERSERK!',
      desc: 'Kill 5 enemies during berserk mode'
    },
    {
      id: 'CHAINSAW',
      icon: '⚔',
      name: 'CHAINSAW',
      desc: 'Kill 8 enemies in 4 seconds'
    },
    {
      id: 'STALKER_HUNTER',
      icon: '🕵️',
      name: 'STALKER HUNTER',
      desc: 'Kill the invisible stalker'
    },
    {
      id: 'FULL_INTEL',
      icon: '📜',
      name: 'FULL INTEL',
      desc: 'Collect all 6 lore documents'
    }
  ];

  /* ── Internal state ───────────────────────────────────────────────────── */
  var _unlocked = {};       // id -> { unlockedAt: ISO string }
  var _cabinetVisible = false;
  var _notifQueue = [];
  var _notifShowing = false;
  var _cabinetEl = null;
  var _notifEl = null;
  var _tabListener = null;

  /* ── Persist / load ───────────────────────────────────────────────────── */
  function _load() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        _unlocked = JSON.parse(raw);
      }
    } catch (e) {
      _unlocked = {};
    }
  }

  function _save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(_unlocked));
    } catch (e) { /* quota exceeded – silently ignore */ }
  }

  /* ── UI helpers ───────────────────────────────────────────────────────── */
  function _createNotifEl() {
    var el = document.createElement('div');
    el.id = 'trophy-notif';
    el.style.cssText = [
      'position:fixed',
      'top:60px',
      'right:-360px',
      'width:320px',
      'background:linear-gradient(135deg,rgba(30,20,0,0.97) 0%,rgba(60,45,0,0.97) 100%)',
      'border:2px solid #ffd700',
      'border-radius:10px',
      'padding:12px 16px',
      'font-family:monospace',
      'z-index:9500',
      'pointer-events:none',
      'transition:right 0.4s cubic-bezier(0.22,1,0.36,1)',
      'box-shadow:0 4px 24px rgba(255,215,0,0.35)'
    ].join(';');
    document.body.appendChild(el);
    return el;
  }

  function _createCabinetEl() {
    var el = document.createElement('div');
    el.id = 'trophy-cabinet';
    el.style.cssText = [
      'display:none',
      'position:fixed',
      'top:50%',
      'left:50%',
      'transform:translate(-50%,-50%)',
      'background:rgba(10,8,0,0.96)',
      'border:2px solid #ffd700',
      'border-radius:12px',
      'padding:24px',
      'z-index:9400',
      'font-family:monospace',
      'color:#fff',
      'min-width:540px',
      'max-width:90vw',
      'max-height:80vh',
      'overflow-y:auto',
      'pointer-events:auto',
      'box-shadow:0 8px 40px rgba(255,215,0,0.25)'
    ].join(';');
    el.innerHTML = [
      '<div style="text-align:center;color:#ffd700;font-size:18px;font-weight:bold;',
      'margin-bottom:16px;letter-spacing:3px">',
      '🏆 TROPHY CABINET</div>',
      '<div id="trophy-cabinet-grid" style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px"></div>',
      '<div style="text-align:center;margin-top:16px;color:#555;font-size:10px;letter-spacing:1px">',
      'TAB · Close</div>'
    ].join('');
    document.body.appendChild(el);
    return el;
  }

  function _renderCabinet() {
    if (!_cabinetEl) { return; }
    var grid = _cabinetEl.querySelector('#trophy-cabinet-grid');
    if (!grid) { return; }
    var html = '';
    for (var i = 0; i < TROPHY_DEFS.length; i++) {
      var t = TROPHY_DEFS[i];
      var data = _unlocked[t.id];
      var isUnlocked = !!data;
      var dateStr = isUnlocked ? new Date(data.unlockedAt).toLocaleDateString() : '';
      html += '<div style="' +
        'background:' + (isUnlocked ? 'linear-gradient(135deg,rgba(60,45,0,0.9),rgba(40,30,0,0.9))' : 'rgba(20,20,20,0.9)') + ';' +
        'border:1px solid ' + (isUnlocked ? '#ffd700' : '#333') + ';' +
        'border-radius:8px;padding:10px 8px;text-align:center;">' +
        '<div style="font-size:22px;margin-bottom:4px;' + (isUnlocked ? '' : 'filter:grayscale(1);opacity:0.3') + '">' +
        t.icon + '</div>' +
        '<div style="font-size:10px;font-weight:bold;color:' + (isUnlocked ? '#ffd700' : '#555') + ';letter-spacing:1px;margin-bottom:3px">' +
        t.name + '</div>' +
        '<div style="font-size:9px;color:' + (isUnlocked ? '#aaa' : '#444') + ';line-height:1.3">' +
        t.desc + '</div>' +
        (isUnlocked ? '<div style="font-size:8px;color:#888;margin-top:4px">' + dateStr + '</div>' : '') +
        '</div>';
    }
    grid.innerHTML = html;
  }

  function _showCabinet() {
    if (!_cabinetEl) { return; }
    _renderCabinet();
    _cabinetEl.style.display = 'block';
    _cabinetVisible = true;
  }

  function _hideCabinet() {
    if (!_cabinetEl) { return; }
    _cabinetEl.style.display = 'none';
    _cabinetVisible = false;
  }

  function _toggleCabinet() {
    if (_cabinetVisible) {
      _hideCabinet();
    } else {
      _showCabinet();
    }
  }

  /* ── Notification slide-in ────────────────────────────────────────────── */
  function _showNextNotif() {
    if (_notifShowing || _notifQueue.length === 0) { return; }
    _notifShowing = true;
    var t = _notifQueue.shift();
    if (!_notifEl) { return; }

    _notifEl.innerHTML = [
      '<div style="display:flex;align-items:center;gap:12px">',
      '  <div style="font-size:32px">' + t.icon + '</div>',
      '  <div>',
      '    <div style="color:#ffd700;font-size:11px;letter-spacing:2px;margin-bottom:2px">TROPHY UNLOCKED</div>',
      '    <div style="color:#fff;font-size:14px;font-weight:bold;letter-spacing:1px">' + t.name + '</div>',
      '    <div style="color:#aaa;font-size:10px;margin-top:2px">' + t.desc + '</div>',
      '  </div>',
      '</div>'
    ].join('');

    /* Slide in */
    _notifEl.style.right = '16px';

    /* Play achievement sound via AudioSystem stub/real */
    try {
      if (window.AudioSystem && typeof window.AudioSystem.playAchievementUnlock === 'function') {
        window.AudioSystem.playAchievementUnlock();
      }
    } catch (e) { /* ignore */ }

    /* Slide out after 3s */
    setTimeout(function () {
      if (_notifEl) { _notifEl.style.right = '-360px'; }
      setTimeout(function () {
        _notifShowing = false;
        _showNextNotif();
      }, 420);
    }, 3000);
  }

  function _queueNotif(t) {
    _notifQueue.push(t);
    _showNextNotif();
  }

  /* ── Public API ───────────────────────────────────────────────────────── */
  function init() {
    _load();

    /* Create DOM elements once */
    if (!document.getElementById('trophy-notif')) {
      _notifEl = _createNotifEl();
    } else {
      _notifEl = document.getElementById('trophy-notif');
    }

    if (!document.getElementById('trophy-cabinet')) {
      _cabinetEl = _createCabinetEl();
    } else {
      _cabinetEl = document.getElementById('trophy-cabinet');
    }

    /* Tab key listener */
    if (_tabListener) {
      document.removeEventListener('keydown', _tabListener);
    }
    _tabListener = function (e) {
      if (e.key === 'Tab') {
        e.preventDefault();
        _toggleCabinet();
      }
    };
    document.addEventListener('keydown', _tabListener);

    console.log('[TrophySystem] init — ' + Object.keys(_unlocked).length + '/15 unlocked');
  }

  function update() {
    /* Intentional no-op: TrophySystem is event-driven, not tick-driven.
       GameManager may call update() on all modules each frame safely. */
  }

  function award(id) {
    /* Silently ignore if already unlocked */
    if (_unlocked[id]) { return false; }

    /* Find definition */
    var def = null;
    for (var i = 0; i < TROPHY_DEFS.length; i++) {
      if (TROPHY_DEFS[i].id === id) { def = TROPHY_DEFS[i]; break; }
    }
    if (!def) {
      console.warn('[TrophySystem] Unknown trophy id:', id);
      return false;
    }

    /* Record unlock */
    _unlocked[id] = { unlockedAt: new Date().toISOString() };
    _save();

    /* Notify UI */
    _queueNotif(def);

    /* Re-render cabinet if open */
    if (_cabinetVisible) { _renderCabinet(); }

    /* Fire external hook */
    try {
      if (typeof window._onTrophyUnlock === 'function') {
        window._onTrophyUnlock(id, def);
      }
    } catch (e) { /* ignore */ }

    console.log('[TrophySystem] Unlocked:', def.name);
    return true;
  }

  function reset() {
    _unlocked = {};
    _save();
    if (_cabinetVisible) { _renderCabinet(); }
    console.log('[TrophySystem] All trophies reset');
  }

  return {
    init: init,
    update: update,
    award: award,
    reset: reset,

    /* Read-only helpers exposed for external callers */
    isUnlocked: function (id) { return !!_unlocked[id]; },
    getAll: function () { return TROPHY_DEFS; },
    getUnlocked: function () { return JSON.parse(JSON.stringify(_unlocked)); }
  };
})();
