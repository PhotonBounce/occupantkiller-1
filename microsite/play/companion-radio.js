/* companion-radio.js — AI tactical companion radio chatter system
 * Ukrainian military AI companion "ALPHA-2 // KALYNA" gives real-time
 * tactical advice via radio speech bubbles in the bottom-left HUD.
 *
 * Public API (IIFE):
 *   CompanionRadio.init()
 *   CompanionRadio.update(delta)
 *   CompanionRadio.trigger(category)
 *   CompanionRadio.onWaveStart()
 *   CompanionRadio.onWaveComplete()
 *   CompanionRadio.onPlayerLowHealth()
 *   CompanionRadio.onBossSpawn()
 *   CompanionRadio.onKillStreak(count)
 *   CompanionRadio.clear()
 */

window.CompanionRadio = (function () {

  /* ─────────────── Message Library ─────────────── */
  var MESSAGES = {
    wave_start: [
      "ALPHA-2 to unit — contacts spotted. Weapons free.",
      "Kalyna here. Intel shows 12+ tangos in your AO. Stay sharp.",
      "New wave inbound. Watch your flanks — they like to circle.",
      "ALPHA-2: Reinforcements sighted. They're pushing hard.",
      "You're outnumbered but that's normal. Make it count."
    ],
    wave_complete: [
      "Sector clear. Outstanding work.",
      "ALPHA-2: Area secure. Resupply en route.",
      "Good shooting. Prepare for next contact.",
      "Zone neutralized. Command sends regards.",
      "Enemy routed. Stand by for orders."
    ],
    low_health: [
      "You're hit bad! Find cover — NOW!",
      "ALPHA-2: You're bleeding out. Fall back!",
      "Kalyna here — you need a medic, move!",
      "Critical status! Break contact, find cover!",
      "Command, we have a man down — get moving!"
    ],
    boss_spawn: [
      "ALPHA-2: HVT confirmed! Priority target — take him down!",
      "High-value target acquired. All units engage!",
      "Kalyna: That's their commander. He goes down, they break.",
      "ALPHA-2: Boss-class contact. Careful — he hits hard.",
      "Command confirms: Priority Zulu is in your zone. Neutralize!"
    ],
    kill_streak: [
      "ALPHA-2: Six confirmed kills. You're on fire!",
      "Kalyna: Target rich environment — keep going!",
      "Command is watching. Impressive work.",
      "You're carrying this whole operation.",
      "ALPHA-2: Enemy morale is breaking — push it!"
    ],
    idle: [
      "Stay frosty. They'll be back.",
      "ALPHA-2: Ammunition status?",
      "Kalyna here. All quiet on my end.",
      "Command says hold position.",
      "Keep your eyes open. Don't get comfortable."
    ]
  };

  /* ─────────────── State ─────────────── */
  var _container = null;     // outer #companionRadio div
  var _bubble = null;        // speech bubble div
  var _bubbleText = null;    // text node container inside bubble
  var _portrait = null;      // portrait div

  var _typeTimer = null;     // setInterval handle for typewriter
  var _hideTimer = null;     // setTimeout handle for fade-out
  var _lastMsgTime = 0;      // performance.now() of last message shown
  var _lowHealthLastTime = -30000; // throttle for low_health (ms)
  var _idleTimer = 0;        // accumulated seconds for idle trigger
  var _idleInterval = 0;     // next idle trigger interval (45-90s)
  var _initialized = false;

  var _audioCtx = null;      // Web Audio context (lazy init)

  /* ─────────────── CSS / DOM Injection ─────────────── */
  function _injectStyles() {
    var style = document.createElement('style');
    style.textContent = [
      '@keyframes companionBreathe {',
      '  0%   { transform: scale(1.0); }',
      '  50%  { transform: scale(1.02); }',
      '  100% { transform: scale(1.0); }',
      '}',
      '@keyframes companionSlideUp {',
      '  from { opacity: 0; transform: translateY(10px); }',
      '  to   { opacity: 1; transform: translateY(0); }',
      '}',
      '@keyframes companionFadeOut {',
      '  from { opacity: 1; }',
      '  to   { opacity: 0; }',
      '}',
      '#companionRadio {',
      '  position: fixed;',
      '  bottom: 18px;',
      '  left: 14px;',
      '  z-index: 220;',
      '  display: flex;',
      '  flex-direction: column;',
      '  align-items: flex-start;',
      '  pointer-events: none;',
      '  filter: contrast(1.1) brightness(1.05);',
      '  font-family: monospace;',
      '}',
      '#companionBubble {',
      '  background: rgba(10, 15, 10, 0.92);',
      '  border: 1px solid #00cc44;',
      '  color: #b8ffcc;',
      '  font-size: 11px;',
      '  line-height: 1.45;',
      '  padding: 7px 10px;',
      '  border-radius: 5px;',
      '  max-width: 230px;',
      '  min-width: 120px;',
      '  margin-bottom: 6px;',
      '  position: relative;',
      '  word-break: break-word;',
      '  box-shadow: 0 0 8px rgba(0, 204, 68, 0.25);',
      '  animation: companionSlideUp 0.22s ease-out forwards;',
      '}',
      '#companionBubble::after {',
      '  content: "";',
      '  position: absolute;',
      '  bottom: -7px;',
      '  left: 22px;',
      '  border-width: 7px 6px 0 6px;',
      '  border-style: solid;',
      '  border-color: #00cc44 transparent transparent transparent;',
      '}',
      '#companionBubble.cr-fading {',
      '  animation: companionFadeOut 0.5s ease-out forwards;',
      '}',
      '#companionPortrait {',
      '  width: 52px;',
      '  height: 52px;',
      '  border-radius: 50%;',
      '  border: 2px solid #00cc44;',
      '  background: linear-gradient(180deg, #005bbb 0%, #005bbb 50%, #ffd700 50%, #ffd700 100%);',
      '  position: relative;',
      '  overflow: hidden;',
      '  box-shadow: 0 0 10px rgba(0, 204, 68, 0.4), inset 0 0 6px rgba(0,0,0,0.5);',
      '  animation: companionBreathe 3s ease-in-out infinite;',
      '  flex-shrink: 0;',
      '}',
      /* Soldier silhouette using CSS clip/borders */
      '#companionPortrait::before {',
      '  content: "";',
      '  position: absolute;',
      '  bottom: 6px;',
      '  left: 50%;',
      '  transform: translateX(-50%);',
      '  width: 22px;',
      '  height: 28px;',
      '  background: rgba(20, 30, 20, 0.85);',
      '  border-radius: 3px 3px 0 0;',
      '  border-top: 4px solid rgba(30, 40, 30, 0.9);',
      '}',
      /* Helmet */
      '#companionPortrait::after {',
      '  content: "";',
      '  position: absolute;',
      '  bottom: 30px;',
      '  left: 50%;',
      '  transform: translateX(-50%);',
      '  width: 18px;',
      '  height: 16px;',
      '  background: rgba(20, 35, 20, 0.9);',
      '  border-radius: 50% 50% 20% 20%;',
      '  border-bottom: 3px solid rgba(10, 20, 10, 0.8);',
      '}',
      '#companionCallsign {',
      '  font-size: 9px;',
      '  color: #00cc44;',
      '  letter-spacing: 1px;',
      '  margin-top: 3px;',
      '  text-align: center;',
      '  width: 52px;',
      '  text-shadow: 0 0 4px rgba(0, 204, 68, 0.5);',
      '}',
      '#companionPortraitWrap {',
      '  display: flex;',
      '  flex-direction: column;',
      '  align-items: center;',
      '}'
    ].join('\n');
    document.head.appendChild(style);
  }

  function _buildDOM() {
    _container = document.createElement('div');
    _container.id = 'companionRadio';

    /* Speech bubble (hidden by default) */
    _bubble = document.createElement('div');
    _bubble.id = 'companionBubble';
    _bubble.style.display = 'none';
    _bubbleText = document.createElement('span');
    _bubble.appendChild(_bubbleText);
    _container.appendChild(_bubble);

    /* Portrait + callsign */
    var portraitWrap = document.createElement('div');
    portraitWrap.id = 'companionPortraitWrap';

    _portrait = document.createElement('div');
    _portrait.id = 'companionPortrait';

    var callsign = document.createElement('div');
    callsign.id = 'companionCallsign';
    callsign.textContent = 'ALPHA-2 // KALYNA';

    portraitWrap.appendChild(_portrait);
    portraitWrap.appendChild(callsign);
    _container.appendChild(portraitWrap);

    document.body.appendChild(_container);
  }

  /* ─────────────── Audio helpers ─────────────── */
  function _getAudioCtx() {
    if (_audioCtx) return _audioCtx;
    try {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (AC) {
        _audioCtx = new AC();
      }
    } catch (e) {}
    return _audioCtx;
  }

  function _playPTTPress() {
    try {
      var ctx = _getAudioCtx();
      if (!ctx) return;
      if (ctx.state === 'suspended') ctx.resume();

      var now = ctx.currentTime;

      /* White noise burst — 0.08s */
      var bufLen = Math.floor(ctx.sampleRate * 0.08);
      var buf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
      var data = buf.getChannelData(0);
      for (var i = 0; i < bufLen; i++) {
        data[i] = (Math.random() * 2 - 1) * 0.12;
      }
      var noise = ctx.createBufferSource();
      noise.buffer = buf;

      /* Bandpass filter simulating radio compression */
      var bpf = ctx.createBiquadFilter();
      bpf.type = 'bandpass';
      bpf.frequency.value = 1800;
      bpf.Q.value = 5;

      /* 1200 Hz click */
      var osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = 1200;
      var oscGain = ctx.createGain();
      oscGain.gain.setValueAtTime(0.08, now);
      oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
      osc.connect(oscGain);
      oscGain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.05);

      var noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.18, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      noise.connect(bpf);
      bpf.connect(noiseGain);
      noiseGain.connect(ctx.destination);
      noise.start(now);
    } catch (e) {}
  }

  function _playSquelch() {
    try {
      var ctx = _getAudioCtx();
      if (!ctx) return;
      if (ctx.state === 'suspended') ctx.resume();

      var now = ctx.currentTime;
      var bufLen = Math.floor(ctx.sampleRate * 0.05);
      var buf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
      var data = buf.getChannelData(0);
      for (var i = 0; i < bufLen; i++) {
        data[i] = (Math.random() * 2 - 1) * 0.08;
      }
      var noise = ctx.createBufferSource();
      noise.buffer = buf;

      var bpf = ctx.createBiquadFilter();
      bpf.type = 'bandpass';
      bpf.frequency.value = 1800;
      bpf.Q.value = 5;

      var g = ctx.createGain();
      g.gain.setValueAtTime(0.15, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
      noise.connect(bpf);
      bpf.connect(g);
      g.connect(ctx.destination);
      noise.start(now);
    } catch (e) {}
  }

  /* ─────────────── Typewriter ─────────────── */
  function _typeMessage(text) {
    /* Clear any pending timers */
    if (_typeTimer) { clearInterval(_typeTimer); _typeTimer = null; }
    if (_hideTimer) { clearTimeout(_hideTimer); _hideTimer = null; }

    /* Reset bubble state */
    _bubble.className = '';
    _bubble.style.display = 'block';
    _bubble.style.animation = 'none';
    /* Force reflow to restart animation */
    void _bubble.offsetWidth;
    _bubble.style.animation = '';
    _bubbleText.textContent = '';

    _playPTTPress();
    _lastMsgTime = (typeof performance !== 'undefined') ? performance.now() : Date.now();

    var idx = 0;
    _typeTimer = setInterval(function () {
      if (idx < text.length) {
        _bubbleText.textContent += text.charAt(idx);
        idx++;
      } else {
        clearInterval(_typeTimer);
        _typeTimer = null;
        /* Squelch at end of transmission */
        _playSquelch();
        /* Hide bubble after 4 seconds */
        _hideTimer = setTimeout(function () {
          _bubble.classList.add('cr-fading');
          _hideTimer = setTimeout(function () {
            _bubble.style.display = 'none';
            _bubble.classList.remove('cr-fading');
          }, 500);
        }, 4000);
      }
    }, 25);
  }

  /* ─────────────── Random picker ─────────────── */
  function _pickRandom(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  /* ─────────────── Public API ─────────────── */
  function init() {
    if (_initialized) return;
    _initialized = true;
    _injectStyles();
    _buildDOM();
    _idleInterval = 45 + Math.random() * 45; // first idle: 45-90s
    _idleTimer = 0;
  }

  function update(delta) {
    if (!_initialized) return;
    _idleTimer += delta;
    if (_idleTimer >= _idleInterval) {
      _idleTimer = 0;
      _idleInterval = 45 + Math.random() * 45;
      /* Only fire idle if no recent message (last msg > 20s ago) */
      var now = (typeof performance !== 'undefined') ? performance.now() : Date.now();
      if (now - _lastMsgTime > 20000) {
        trigger('idle');
      }
    }
  }

  function trigger(category) {
    if (!_initialized) return;
    var msgs = MESSAGES[category];
    if (!msgs || !msgs.length) return;
    _typeMessage(_pickRandom(msgs));
  }

  function onWaveStart() {
    trigger('wave_start');
  }

  function onWaveComplete() {
    setTimeout(function () {
      trigger('wave_complete');
    }, 1000);
  }

  function onPlayerLowHealth() {
    var now = (typeof performance !== 'undefined') ? performance.now() : Date.now();
    if (now - _lowHealthLastTime < 15000) return;
    _lowHealthLastTime = now;
    trigger('low_health');
  }

  function onBossSpawn() {
    trigger('boss_spawn');
  }

  function onKillStreak(count) {
    if (count >= 7) {
      trigger('kill_streak');
    }
  }

  function clear() {
    if (_typeTimer) { clearInterval(_typeTimer); _typeTimer = null; }
    if (_hideTimer) { clearTimeout(_hideTimer); _hideTimer = null; }
    if (_bubble) {
      _bubble.style.display = 'none';
      _bubble.classList.remove('cr-fading');
    }
    if (_bubbleText) _bubbleText.textContent = '';
    _idleTimer = 0;
    _idleInterval = 45 + Math.random() * 45;
  }

  return {
    init: init,
    update: update,
    trigger: trigger,
    onWaveStart: onWaveStart,
    onWaveComplete: onWaveComplete,
    onPlayerLowHealth: onPlayerLowHealth,
    onBossSpawn: onBossSpawn,
    onKillStreak: onKillStreak,
    clear: clear
  };

})();
