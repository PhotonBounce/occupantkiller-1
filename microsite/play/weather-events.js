window.WeatherEvents = (function() {
  var _active = null;  // current event id
  var _endTime = 0;
  var _listeners = [];

  var EVENTS = [
    {
      id: 'rain_storm',
      name: 'Heavy Rainstorm',
      icon: '⛈',
      duration: 45000, // 45s
      fogMulti: 0.6,   // reduce fog distance to 60%
      speedDebuff: 0.85,
      desc: 'Visibility reduced — enemies move slower too',
      bgColorShift: 0x334466,
    },
    {
      id: 'night_fog',
      name: 'Night Fog',
      icon: '🌫',
      duration: 60000,
      fogMulti: 0.4,
      speedDebuff: 1.0,
      desc: 'Dense fog — NVG recommended',
      bgColorShift: 0x111122,
    },
    {
      id: 'sandstorm',
      name: 'Sandstorm',
      icon: '💨',
      duration: 35000,
      fogMulti: 0.5,
      speedDebuff: 0.9,
      desc: 'Airborne sand — accuracy reduced',
      accuracyPenalty: 0.3, // 30% spread increase
      bgColorShift: 0x886644,
    },
    {
      id: 'clear',
      name: 'Clearing Up',
      icon: '🌤',
      duration: 30000,
      fogMulti: 1.5,
      speedDebuff: 1.0,
      desc: 'Good visibility — sniper opportunity',
      bgColorShift: null,
    },
  ];

  function trigger(eventId) {
    var ev = null;
    for (var i = 0; i < EVENTS.length; i++) {
      if (EVENTS[i].id === eventId) { ev = EVENTS[i]; break; }
    }
    if (!ev) return;
    _active = ev;
    _endTime = Date.now() + ev.duration;
    // Notify listeners
    for (var j = 0; j < _listeners.length; j++) _listeners[j](ev);
    // Apply weather via existing Weather module if available
    if (typeof Weather !== 'undefined' && Weather.set) Weather.set(eventId === 'clear' ? 'clear' : ev.id);
    // HUD toast
    if (typeof HUD !== 'undefined' && HUD.showToast) {
      HUD.showToast(ev.icon + ' WEATHER: ' + ev.name + ' — ' + ev.desc, '#88aaff');
    }
    // Update HUD weather display
    if (typeof HUD !== 'undefined' && HUD.updateWeatherDisplay) {
      HUD.updateWeatherDisplay(eventId === 'clear' ? 'clear' : ev.id);
    }
  }

  function triggerRandom() {
    var idx = Math.floor(Math.random() * EVENTS.length);
    trigger(EVENTS[idx].id);
  }

  function update() {
    if (_active && Date.now() > _endTime) {
      _active = null;
      if (typeof HUD !== 'undefined' && HUD.showToast) HUD.showToast('☀ Weather clearing', '#ffdd88');
      if (typeof HUD !== 'undefined' && HUD.updateWeatherDisplay) HUD.updateWeatherDisplay('clear');
    }
  }

  function getActive() { return _active; }
  function getFogMulti() { return _active ? _active.fogMulti : 1.0; }
  function getSpeedDebuff() { return _active ? _active.speedDebuff : 1.0; }
  function getAccuracyPenalty() { return _active ? (_active.accuracyPenalty || 0) : 0; }
  function onEvent(fn) { _listeners.push(fn); }

  return { trigger: trigger, triggerRandom: triggerRandom, update: update, getActive: getActive, getFogMulti: getFogMulti, getSpeedDebuff: getSpeedDebuff, getAccuracyPenalty: getAccuracyPenalty, onEvent: onEvent };
})();
