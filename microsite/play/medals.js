window.Medals = (function() {
  'use strict';
  // Use var throughout — never let/const

  var MEDALS = [
    // Combat medals
    { id: 'SHARPSHOOTER',    name: 'Sharpshooter',      icon: '🎯', color: '#ffd700', condition: function(s) { return s.accuracy >= 75; },                    desc: '75%+ accuracy this wave' },
    { id: 'HEADHUNTER',      name: 'Headhunter',         icon: '💀', color: '#ff4444', condition: function(s) { return s.headshots >= 5; },                     desc: '5+ headshots' },
    { id: 'UNTOUCHABLE',     name: 'Untouchable',         icon: '🛡', color: '#44aaff', condition: function(s) { return s.damageTaken === 0; },                 desc: 'Zero damage taken' },
    { id: 'RAPID_FIRE',      name: 'Rapid Fire',          icon: '⚡', color: '#ffaa00', condition: function(s) { return s.kills >= 8; },                        desc: '8+ kills this wave' },
    { id: 'EXECUTIONER',     name: 'Executioner',         icon: '⚔', color: '#cc0000', condition: function(s) { return s.kills >= 15; },                       desc: '15+ kills this wave' },
    { id: 'GHOST',           name: 'Ghost',               icon: '👻', color: '#88ccff', condition: function(s) { return s.damageTaken < 10; },                  desc: 'Under 10 damage taken' },
    { id: 'DEMOLITIONS',     name: 'Demolitions Expert',  icon: '💣', color: '#ff8800', condition: function(s) { return s.explosiveKills >= 3; },               desc: '3+ kills with explosives' },
    { id: 'MEDIC',           name: 'Combat Medic',        icon: '🏥', color: '#44ff88', condition: function(s) { return s.healsUsed >= 2; },                    desc: 'Used bandages 2+ times' },
    { id: 'IRON_WILL',       name: 'Iron Will',           icon: '💪', color: '#ff6644', condition: function(s) { return s.damageTaken >= 80 && s.survived; },   desc: 'Survived despite 80+ damage taken' },
    { id: 'SPEED_DEMON',     name: 'Speed Demon',         icon: '🏃', color: '#ffdd00', condition: function(s) { return s.waveTime <= 60; },                    desc: 'Wave cleared under 60 seconds' },
    { id: 'MARKSMAN',        name: 'Marksman',            icon: '🔭', color: '#44ff44', condition: function(s) { return s.headshotRatio >= 0.5; },               desc: '50%+ headshot ratio' },
    { id: 'DESTROYER',       name: 'Destroyer',           icon: '🔥', color: '#ff2200', condition: function(s) { return s.vehicleKills >= 1; },                 desc: 'Destroyed an enemy vehicle' },
    { id: 'SURVIVOR',        name: 'Survivor',            icon: '❤', color: '#ff4488', condition: function(s) { return s.survived && s.hp <= 20; },            desc: 'Survived with low HP' },
    { id: 'CONSERVATIONIST', name: 'Conservationist',     icon: '📦', color: '#88aaff', condition: function(s) { return s.ammoUsed <= 20 && s.kills >= 5; },   desc: '5 kills using 20 or fewer shots' },
  ];

  var _earnedMedals = {};  // medalId → count (session total)
  var _overlay = null;

  function evaluateWave(stats) {
    var earned = [];
    stats.headshotRatio = stats.shots > 0 ? (stats.headshots / stats.shots) : 0;
    stats.accuracy = stats.shots > 0 ? Math.round((stats.headshots / stats.shots) * 100) : 0;
    // Use waveHits for accuracy if available
    if (stats.waveHits !== undefined && stats.shots > 0) {
      stats.accuracy = Math.round((stats.waveHits / stats.shots) * 100);
    }
    for (var i = 0; i < MEDALS.length; i++) {
      try {
        if (MEDALS[i].condition(stats)) {
          earned.push(MEDALS[i]);
          _earnedMedals[MEDALS[i].id] = (_earnedMedals[MEDALS[i].id] || 0) + 1;
        }
      } catch(e) {}
    }
    return earned;
  }

  function showWaveMedals(earnedArray, waveNum) {
    if (!earnedArray || earnedArray.length === 0) return;
    if (_overlay) { document.body.removeChild(_overlay); _overlay = null; }

    _overlay = document.createElement('div');
    _overlay.id = 'wave-medals';
    _overlay.style.cssText = [
      'position:fixed;bottom:80px;left:50%;transform:translateX(-50%);',
      'z-index:8000;pointer-events:none;',
      'display:flex;gap:8px;flex-wrap:wrap;justify-content:center;',
      'max-width:600px;',
      'transition:opacity 0.5s;opacity:0;',
    ].join('');

    for (var i = 0; i < earnedArray.length; i++) {
      var m = earnedArray[i];
      var chip = document.createElement('div');
      chip.style.cssText = [
        'background:rgba(0,0,0,0.85);border:1px solid ' + m.color + ';',
        'border-radius:20px;padding:5px 12px;',
        'font-family:monospace;font-size:12px;',
        'color:' + m.color + ';',
        'display:flex;align-items:center;gap:6px;',
      ].join('');
      chip.innerHTML = '<span style="font-size:18px">' + m.icon + '</span>' +
        '<span style="font-weight:bold">' + m.name + '</span>';
      _overlay.appendChild(chip);
    }

    document.body.appendChild(_overlay);
    // Fade in
    requestAnimationFrame(function() { _overlay.style.opacity = '1'; });
    // Fade out after 4s
    setTimeout(function() {
      if (_overlay) {
        _overlay.style.opacity = '0';
        setTimeout(function() {
          if (_overlay && document.body.contains(_overlay)) {
            document.body.removeChild(_overlay);
            _overlay = null;
          }
        }, 500);
      }
    }, 4000);
  }

  function getEarned() { return _earnedMedals; }
  function getTotalMedals() {
    var total = 0;
    for (var k in _earnedMedals) total += _earnedMedals[k];
    return total;
  }
  function reset() { _earnedMedals = {}; }

  return {
    evaluateWave: evaluateWave,
    showWaveMedals: showWaveMedals,
    getEarned: getEarned,
    getTotalMedals: getTotalMedals,
    reset: reset,
    MEDALS: MEDALS,
  };
})();
