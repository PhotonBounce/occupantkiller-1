/* voice-lines.js — pre-recorded UA/RU soldier battle voice lines.
 *
 * Plays real recorded speech (assets/battle-voices/<lang>/<id>_vN.mp3) for
 * battlefield events: Ukrainian lines for the player's side, Russian lines
 * for occupant forces. Degrades to silence if the asset pack is absent.
 *
 * Zero hard dependencies: poll-based hooks read GameManager/Enemies state in
 * update(); integration needs only the script tag + VoiceLines.update(delta)
 * in the main loop.
 *
 * Public API:
 *   VoiceLines.init()
 *   VoiceLines.update(delta)
 *   VoiceLines.play(lang, cat)          // random line from a category
 *   VoiceLines.playId(lang, id)         // specific line
 *   VoiceLines.setEnabled(bool) / isEnabled()
 *   VoiceLines.setVolume(0..1)
 */
window.VoiceLines = (function () {
  'use strict';

  var BASE = 'assets/battle-voices/';
  var _manifest = null;
  var _enabled = true;
  var _volume = 0.85;
  var _ready = false;
  var _byCat = { ua: {}, ru: {} };   // cat -> [line]
  var _cool = {};                    // "lang:cat" -> next allowed time (s)
  var _now = 0;
  var _audioPool = [];
  var MAX_CONCURRENT = 4;

  // per-category cooldowns (seconds) — keep the battlefield chatty but not spammy
  var COOLDOWN = {
    battlecry: 9, contact: 7, order: 6, grenade: 4, reload: 5, kill: 6,
    pain: 4, fear: 8, surrender: 10, radio: 14, word: 6, misc: 16, taunt: 20
  };

  function init() {
    try {
      fetch(BASE + 'manifest.json')
        .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
        .then(function (m) {
          _manifest = m;
          ['ua', 'ru'].forEach(function (lang) {
            var L = m.languages && m.languages[lang];
            if (!L) return;
            L.lines.forEach(function (line) {
              (_byCat[lang][line.cat] = _byCat[lang][line.cat] || []).push(line);
            });
          });
          _ready = true;
          if (window.console) console.log('[VoiceLines] loaded',
            (m.languages.ua ? m.languages.ua.count : 0) + ' ua /',
            (m.languages.ru ? m.languages.ru.count : 0) + ' ru lines');
        })
        .catch(function () { /* asset pack not deployed — stay silent */ });
    } catch (e) {}
  }

  function _playFile(lang, file, vol) {
    // cull finished audio elements
    _audioPool = _audioPool.filter(function (a) { return !a.ended && !a.paused; });
    if (_audioPool.length >= MAX_CONCURRENT) return false;
    try {
      var a = new Audio(BASE + lang + '/' + file);
      a.volume = Math.max(0, Math.min(1, vol != null ? vol : _volume));
      // slight playback-rate jitter so repeated lines don't sound canned
      a.playbackRate = 0.94 + Math.random() * 0.12;
      var p = a.play();
      if (p && p.catch) p.catch(function () {});
      _audioPool.push(a);
      return true;
    } catch (e) { return false; }
  }

  function play(lang, cat, opts) {
    if (!_enabled || !_ready) return false;
    opts = opts || {};
    var key = lang + ':' + cat;
    if (!opts.force && _now < (_cool[key] || 0)) return false;
    var pool = _byCat[lang] && _byCat[lang][cat];
    if (!pool || !pool.length) return false;
    var line = pool[(Math.random() * pool.length) | 0];
    var file = line.files[(Math.random() * line.files.length) | 0];
    if (_playFile(lang, file, opts.volume)) {
      _cool[key] = _now + (COOLDOWN[cat] || 8) * (0.8 + Math.random() * 0.5);
      return true;
    }
    return false;
  }

  function playId(lang, id) {
    if (!_enabled || !_ready || !_manifest) return false;
    var L = _manifest.languages[lang];
    if (!L) return false;
    for (var i = 0; i < L.lines.length; i++) {
      if (L.lines[i].id === id) {
        return _playFile(lang, L.lines[i].files[(Math.random() * L.lines[i].files.length) | 0]);
      }
    }
    return false;
  }

  /* ── event detection (poll-based, no core-file surgery) ── */
  var _lastWave = -1, _lastKills = -1, _lastHp = -1, _lastAlive = -1, _surrSeen = -1;

  function update(delta) {
    if (!_ready || !_enabled) return;
    _now += delta || 0.016;
    var gm = window.GameManager;
    if (!gm || gm.getState() !== 'playing') return;
    var pl; try { pl = gm.getPlayer(); } catch (e) { return; }
    var wave = gm.getCurrentWave();
    var kills = (pl && pl.kills) || 0;
    var hp = pl ? pl.hp : 0;

    // wave start: both sides shout
    if (wave !== _lastWave) {
      if (_lastWave >= 0) {
        play('ru', 'battlecry');
        setTimeout(function () { play('ua', wave > 1 ? 'order' : 'contact'); }, 900);
      }
      _lastWave = wave;
    }
    // player scored kills: RU pain scream + occasional UA confirm
    if (_lastKills >= 0 && kills > _lastKills) {
      play('ru', 'pain', { volume: _volume * 0.9 });
      if (Math.random() < 0.35) setTimeout(function () { play('ua', 'kill'); }, 700);
      // a multi-kill burst rattles them
      if (kills - _lastKills >= 3 && Math.random() < 0.6) {
        setTimeout(function () { play('ru', 'fear'); }, 1400);
      }
    }
    _lastKills = kills;
    // player hurt badly: UA medic call
    if (_lastHp > 0 && hp < _lastHp && hp / (pl.maxHp || 100) < 0.35) play('ua', 'pain');
    _lastHp = hp;
    // surrendering enemies plead
    try {
      if (window.Enemies && Enemies.getSurrenderCount) {
        var s = Enemies.getSurrenderCount();
        if (_surrSeen >= 0 && s > _surrSeen) play('ru', 'surrender', { force: true });
        _surrSeen = s;
      }
    } catch (e) {}
    // ambient chatter when the field is busy
    try {
      if (window.Enemies && Enemies.getAliveCount) {
        var alive = Enemies.getAliveCount();
        if (alive > 6 && Math.random() < 0.002) play(Math.random() < 0.5 ? 'ru' : 'ua', Math.random() < 0.5 ? 'order' : 'contact');
        _lastAlive = alive;
      }
    } catch (e) {}
  }

  return {
    init: init,
    update: update,
    play: play,
    playId: playId,
    setEnabled: function (v) { _enabled = !!v; },
    isEnabled: function () { return _enabled; },
    setVolume: function (v) { _volume = Math.max(0, Math.min(1, v)); },
  };
})();
