/* ============================================================
 *  ENEMY-VOICES.JS — Enemy proximity voice lines
 *  Enemies speak via Web Speech API (TTS) with Web Audio API
 *  fallback. Situational triggers based on proximity/combat state.
 *
 *  Public API:
 *    EnemyVoices.init(camera)        — call once; pass THREE camera
 *    EnemyVoices.update(dt, enemies, playerPos)  — per-frame
 *    EnemyVoices.playVoiceLine(enemy, category)  — manual trigger
 *    EnemyVoices.reset()             — clear state between stages
 * ============================================================ */
window.EnemyVoices = (function () {
  'use strict';

  /* ── Voice line banks (Ukrainian) ──────────────────────── */
  var VOICE_LINES = {
    SPOTTED: [
      'Противника виявлено!',
      'Ціль виявлена, відкриваю вогонь!',
      'Є контакт! Є контакт!',
      'Тут, тут! Вогонь!'
    ],
    RETREAT: [
      'Відступаємо! Відступаємо!',
      'Занадто велика сила!',
      'Відходимо!'
    ],
    SUPPRESSED: [
      'Прикрийте мене!',
      'Піднята голова!',
      'Важкий вогонь, залягай!'
    ],
    GRENADE: [
      'Граната!',
      'Кидай гранату!',
      'Граната, лягай!'
    ],
    COMBAT: [
      'Не дайте йому вибратися!',
      'Вогонь по цілі!',
      'Він там, вогонь!'
    ],
    COMMANDER_DEATH: [
      'Командир убитий! Продовжувати бій!',
      'Ми залишилися без командира!'
    ],
    LOW_AMMO: [
      'Потрібен патрон!',
      'У мене закінчуються патрони!'
    ]
  };

  /* ── English translations (for subtitles) ──────────────── */
  var TRANSLATIONS = {
    SPOTTED: [
      'Enemy spotted!',
      'Target found, opening fire!',
      'Contact! Contact!',
      'Here, here! Fire!'
    ],
    RETREAT: [
      'Retreating! Retreating!',
      'Too many of them!',
      'Pull back!'
    ],
    SUPPRESSED: [
      'Cover me!',
      'Heads down!',
      'Heavy fire, get down!'
    ],
    GRENADE: [
      'Grenade!',
      'Throw a grenade!',
      'Grenade, down!'
    ],
    COMBAT: [
      "Don't let him escape!",
      'Fire on target!',
      "He's there, fire!"
    ],
    COMMANDER_DEATH: [
      'Commander killed! Continue the fight!',
      "We're without a commander!"
    ],
    LOW_AMMO: [
      'Need ammo!',
      'Running low on ammo!'
    ]
  };

  /* ── Enemy type pitch values ────────────────────────────── */
  var PITCH_BY_TYPE = {
    HEAVY:   0.8,
    SOLDIER: 1.0,
    OFFICER: 1.1
  };

  /* ── Config ─────────────────────────────────────────────── */
  var CFG = {
    COOLDOWN_MS:         8000,   // per-enemy cooldown (ms)
    MAX_SIMULTANEOUS:    2,      // max lines playing at once
    MAX_DISTANCE:        15,     // beyond this, volume = 0
    COMBAT_CHANCE:       0.10,   // 10% random combat line
    COMBAT_INTERVAL_MS:  5000,   // check every 5s
    RETREAT_CHANCE:      0.30,   // 30% chance when hp < 30%
    TTS_RATE:            1.2,
    TTS_VOLUME_BASE:     0.6,
    SUBTITLE_DURATION:   3000,   // ms
    STORAGE_KEY:         'okk_enemy_voices'
  };

  /* ── Module state ───────────────────────────────────────── */
  var _camera = null;
  var _enabled = true;
  var _activeCount = 0;         // currently speaking lines
  var _lastCombatCheck = 0;     // timestamp for periodic combat lines
  var _subtitleEl = null;       // DOM element
  var _subtitleTimer = null;
  var _toggleBtn = null;
  var _hasSpeechSynthesis = false;
  var _audioCtx = null;

  /* ── Init ───────────────────────────────────────────────── */
  function init(camera) {
    _camera = camera;

    // Detect speech synthesis
    _hasSpeechSynthesis = !!(window.speechSynthesis && window.SpeechSynthesisUtterance);

    // Restore preference
    try {
      var pref = localStorage.getItem(CFG.STORAGE_KEY);
      if (pref === 'off') _enabled = false;
    } catch (_e) {}

    _buildSubtitleEl();
    _buildToggleBtn();
  }

  /* ── Subtitle DOM element ───────────────────────────────── */
  function _buildSubtitleEl() {
    if (_subtitleEl) return;
    _subtitleEl = document.createElement('div');
    _subtitleEl.id = 'enemy-voice-subtitle';
    _subtitleEl.style.cssText = [
      'display:none;',
      'position:fixed;',
      'bottom:32px;',
      'left:50%;',
      'transform:translateX(-50%);',
      'background:rgba(0,0,0,0.75);',
      'color:#e8e8e8;',
      'font-family:monospace;',
      'font-size:12px;',
      'padding:4px 14px;',
      'border-radius:3px;',
      'z-index:3100;',
      'pointer-events:none;',
      'white-space:nowrap;',
      'max-width:90vw;',
      'overflow:hidden;',
      'text-overflow:ellipsis;',
    ].join('');
    document.body.appendChild(_subtitleEl);
  }

  /* ── Toggle button ──────────────────────────────────────── */
  function _buildToggleBtn() {
    if (_toggleBtn) return;
    _toggleBtn = document.createElement('button');
    _toggleBtn.id = 'enemy-voice-toggle';
    _toggleBtn.textContent = '[V]';
    _toggleBtn.title = 'Toggle enemy voices';
    _toggleBtn.style.cssText = [
      'position:fixed;',
      'bottom:8px;',
      'left:8px;',
      'background:rgba(0,0,0,0.5);',
      'border:1px solid rgba(255,255,255,0.25);',
      'color:' + (_enabled ? '#aaffaa' : '#888') + ';',
      'padding:2px 7px;',
      'border-radius:4px;',
      'font-size:11px;',
      'font-family:monospace;',
      'z-index:210;',
      'cursor:pointer;',
    ].join('');
    _toggleBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      _toggleEnabled();
    });
    document.body.appendChild(_toggleBtn);
  }

  function _toggleEnabled() {
    _enabled = !_enabled;
    try { localStorage.setItem(CFG.STORAGE_KEY, _enabled ? 'on' : 'off'); } catch (_e) {}
    if (_toggleBtn) _toggleBtn.style.color = _enabled ? '#aaffaa' : '#888';
    if (!_enabled && _subtitleEl) _subtitleEl.style.display = 'none';
  }

  /* ── Spatial distance volume ────────────────────────────── */
  function _distanceVolume(enemy, playerPos) {
    if (!enemy || !enemy.mesh || !playerPos) return 0;
    var ep = enemy.mesh.position;
    var dx = ep.x - playerPos.x;
    var dy = ep.y - playerPos.y;
    var dz = ep.z - playerPos.z;
    var dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
    return Math.max(0, 1 - dist / CFG.MAX_DISTANCE) * 0.7;
  }

  /* ── Pick voice by type ─────────────────────────────────── */
  function _pitchForEnemy(enemy) {
    var kind = (enemy && enemy.kind) ? String(enemy.kind).toUpperCase() : 'SOLDIER';
    return PITCH_BY_TYPE[kind] || PITCH_BY_TYPE.SOLDIER;
  }

  /* ── Show subtitle ──────────────────────────────────────── */
  function _showSubtitle(enemyLabel, lineIndex, category) {
    if (!_subtitleEl) return;
    var translation = '';
    var trans = TRANSLATIONS[category];
    if (trans && trans[lineIndex]) translation = trans[lineIndex];
    var ukr = VOICE_LINES[category] ? VOICE_LINES[category][lineIndex] : '';
    _subtitleEl.textContent = enemyLabel + ': "' + translation + '" [' + ukr + ']';
    _subtitleEl.style.display = 'block';

    if (_subtitleTimer) clearTimeout(_subtitleTimer);
    _subtitleTimer = setTimeout(function () {
      if (_subtitleEl) _subtitleEl.style.display = 'none';
    }, CFG.SUBTITLE_DURATION);
  }

  /* ── Web Audio fallback squawk ──────────────────────────── */
  function _playFallbackSquawk(volume) {
    try {
      if (!_audioCtx) {
        _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      }
      var ctx = _audioCtx;

      // Two-tone "radio squawk"
      var tones = [880, 660];
      var startTime = ctx.currentTime;
      for (var ti = 0; ti < tones.length; ti++) {
        (function (freq, offset) {
          var osc = ctx.createOscillator();
          var gain = ctx.createGain();
          osc.type = 'square';
          osc.frequency.value = freq;
          gain.gain.setValueAtTime(volume * 0.25, startTime + offset);
          gain.gain.exponentialRampToValueAtTime(0.001, startTime + offset + 0.12);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(startTime + offset);
          osc.stop(startTime + offset + 0.14);
        })(tones[ti], ti * 0.18);
      }
    } catch (_e) {
      // Audio not available — silent fallback
    }
  }

  /* ── Core: play a voice line for an enemy ───────────────── */
  function playVoiceLine(enemy, category, playerPos) {
    if (!_enabled) return;
    if (_activeCount >= CFG.MAX_SIMULTANEOUS) return;
    if (!VOICE_LINES[category] || !VOICE_LINES[category].length) return;

    // Per-enemy cooldown
    var now = Date.now();
    if (enemy._voiceCooldown && now < enemy._voiceCooldown) return;
    enemy._voiceCooldown = now + CFG.COOLDOWN_MS;

    // Pick random line
    var lines = VOICE_LINES[category];
    var idx = Math.floor(Math.random() * lines.length);
    var text = lines[idx];

    // Compute volume (spatial)
    var vol = playerPos ? _distanceVolume(enemy, playerPos) : CFG.TTS_VOLUME_BASE;
    if (vol <= 0) return;

    // Enemy label for subtitle
    var kind = (enemy && enemy.kind) ? String(enemy.kind).toUpperCase() : 'SOLDIER';
    var eid  = (enemy && enemy.id   !== undefined) ? enemy.id : '?';
    var label = kind + '-' + eid;

    _activeCount++;

    if (_hasSpeechSynthesis) {
      try {
        var utter = new SpeechSynthesisUtterance(text);
        utter.rate   = CFG.TTS_RATE;
        utter.volume = Math.min(1, vol * (CFG.TTS_VOLUME_BASE / 0.7));
        utter.pitch  = _pitchForEnemy(enemy);

        // Try language preference: uk-UA → ru-RU → en-US
        var voices = window.speechSynthesis.getVoices();
        var chosenVoice = null;
        var langPref = ['uk', 'ru', 'en'];
        for (var pi = 0; pi < langPref.length && !chosenVoice; pi++) {
          for (var vi = 0; vi < voices.length; vi++) {
            if (voices[vi].lang && voices[vi].lang.toLowerCase().indexOf(langPref[pi]) === 0) {
              chosenVoice = voices[vi];
              break;
            }
          }
        }
        if (chosenVoice) utter.voice = chosenVoice;

        utter.onend = function () { _activeCount = Math.max(0, _activeCount - 1); };
        utter.onerror = function () { _activeCount = Math.max(0, _activeCount - 1); };
        window.speechSynthesis.speak(utter);
      } catch (_e) {
        _activeCount = Math.max(0, _activeCount - 1);
        _playFallbackSquawk(vol);
      }
    } else {
      // Fallback squawk
      _playFallbackSquawk(vol);
      // Release slot after approx squawk duration
      setTimeout(function () {
        _activeCount = Math.max(0, _activeCount - 1);
      }, 500);
    }

    _showSubtitle(label, idx, category);
  }

  /* ── Per-frame update ───────────────────────────────────── */
  function update(dt, enemies, playerPos) {
    if (!_enabled || !enemies) return;

    var now = Date.now();

    // Periodic combat line check (every 5s)
    var doCombatCheck = (now - _lastCombatCheck >= CFG.COMBAT_INTERVAL_MS);
    if (doCombatCheck) _lastCombatCheck = now;

    for (var i = 0; i < enemies.length; i++) {
      var e = enemies[i];
      if (!e || !e.mesh) continue;

      // Skip dead enemies
      if (e.dead || e.hp <= 0) continue;

      // ── Spotted (enemy is alerted/aware of player) ──────
      if (e.spotted && !e._voiceSpottedFired) {
        e._voiceSpottedFired = true;
        playVoiceLine(e, 'SPOTTED', playerPos);
        continue;
      }

      // ── Low ammo ────────────────────────────────────────
      if (e.lowAmmo && !e._voiceLowAmmoFired) {
        e._voiceLowAmmoFired = true;
        playVoiceLine(e, 'LOW_AMMO', playerPos);
        continue;
      }

      // ── Suppressed ──────────────────────────────────────
      if (e.suppressed && !e._voiceSuppressedFired) {
        e._voiceSuppressedFired = true;
        playVoiceLine(e, 'SUPPRESSED', playerPos);
        continue;
      }
      if (!e.suppressed) e._voiceSuppressedFired = false;

      // ── Retreat: hp < 30% ───────────────────────────────
      if (e.hp > 0 && e.maxHp > 0 && (e.hp / e.maxHp) < 0.30) {
        if (!e._voiceRetreating && Math.random() < CFG.RETREAT_CHANCE) {
          e._voiceRetreating = true;
          playVoiceLine(e, 'RETREAT', playerPos);
          continue;
        }
      } else {
        e._voiceRetreating = false;
      }

      // ── Periodic COMBAT line ─────────────────────────────
      if (doCombatCheck && e.alert && Math.random() < CFG.COMBAT_CHANCE) {
        playVoiceLine(e, 'COMBAT', playerPos);
      }
    }
  }

  /* ── Grenade trigger (call externally) ─────────────────── */
  function onGrenade(nearbyEnemies, playerPos) {
    if (!_enabled || !nearbyEnemies) return;
    for (var i = 0; i < nearbyEnemies.length; i++) {
      playVoiceLine(nearbyEnemies[i], 'GRENADE', playerPos);
    }
  }

  /* ── Commander killed trigger (call externally) ─────────── */
  function onCommanderKilled(nearbyEnemies, playerPos) {
    if (!_enabled || !nearbyEnemies) return;
    for (var i = 0; i < nearbyEnemies.length; i++) {
      playVoiceLine(nearbyEnemies[i], 'COMMANDER_DEATH', playerPos);
    }
  }

  /* ── Reset (between stages / restarts) ─────────────────── */
  function reset() {
    _activeCount = 0;
    _lastCombatCheck = 0;
    if (_subtitleTimer) {
      clearTimeout(_subtitleTimer);
      _subtitleTimer = null;
    }
    if (_subtitleEl) _subtitleEl.style.display = 'none';
    // Cancel any pending speech
    try {
      if (_hasSpeechSynthesis) window.speechSynthesis.cancel();
    } catch (_e) {}
  }

  /* ── Public API ─────────────────────────────────────────── */
  return {
    init:              init,
    update:            update,
    playVoiceLine:     playVoiceLine,
    onGrenade:         onGrenade,
    onCommanderKilled: onCommanderKilled,
    reset:             reset,
    VOICE_LINES:       VOICE_LINES
  };

})();
