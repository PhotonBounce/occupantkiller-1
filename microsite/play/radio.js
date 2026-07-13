window.Radio = (function() {
  var _el = null;
  var _queue = [];
  var _playing = false;
  var _currentLevel = null;

  // Per-level radio messages: { levelId: [{ sender, text, delay }] }
  var LEVEL_MESSAGES = {
    KYIV: [
      { sender: 'Command', text: 'Alpha team, multiple T-72s spotted at grid reference Delta-7. Use AT weapons.', delay: 15 },
      { sender: 'Intel', text: 'Russian convoy has split — flanking movement detected north.', delay: 45 },
      { sender: 'Command', text: 'Good shooting! Keep the pressure on. Reinforcements inbound in 5 mikes.', delay: 90 },
    ],
    BAKHMUT: [
      { sender: 'Command', text: 'Bakhmut is the key. Every meter costs them blood. Hold the line.', delay: 10 },
      { sender: 'Intel', text: 'Wagner PMC units detected. These are professional killers — do not underestimate.', delay: 40 },
      { sender: 'Medic', text: 'We have wounded in the eastern sector. Keep that corridor open.', delay: 80 },
    ],
    MARIUPOL: [
      { sender: 'Command', text: 'Azovstal is our last position. We hold here until evacuation.', delay: 10 },
      { sender: 'Azov', text: 'For Mariupol. For Ukraine. We will not surrender.', delay: 35 },
      { sender: 'Command', text: 'Civilian evacuation corridors still blocked. Eliminate the blocking force.', delay: 70 },
    ],
    KHERSON: [
      { sender: 'Command', text: 'Kherson Liberation in progress. The people are waiting.', delay: 8 },
      { sender: 'Intel', text: 'Russian forces retreating across the Dnipro. Cut off their escape route.', delay: 40 },
      { sender: 'Command', text: 'Excellent work. The city is almost free. Push through to Freedom Square.', delay: 80 },
    ],
    KREMLIN: [
      { sender: 'Command', text: 'This is it. End this war at its source. Russia must feel the consequences.', delay: 5 },
      { sender: 'Intel', text: 'BOSS unit detected inside Kremlin. Heavy protection — use everything you have.', delay: 30 },
      { sender: 'Command', text: 'The world is watching. Finish this.', delay: 70 },
    ],
    SNAKE: [
      { sender: 'Pyzhyk', text: 'Russian warship... go fuck yourself!', delay: 5 },
      { sender: 'Command', text: 'Thirteen border guards defending Snake Island against a cruiser. Heroes.', delay: 25 },
      { sender: 'Neptune', text: 'Missile systems online. We have a target.', delay: 60 },
    ],
    BUCHA: [
      { sender: 'Command', text: 'What happened here must never be forgotten. And must never happen again.', delay: 8 },
      { sender: 'Intel', text: 'Evidence of war crimes throughout the sector. Document everything.', delay: 35 },
      { sender: 'Command', text: 'Justice will come. Today we ensure they cannot escape it.', delay: 70 },
    ],
    KHARKIV: [
      { sender: 'Command', text: 'Second largest city. They want to erase us from it. Make them regret that decision.', delay: 10 },
      { sender: 'Intel', text: 'Glide bombs incoming from the north. Take cover then advance under their reload window.', delay: 45 },
      { sender: 'Command', text: 'Kharkiv stands! Push them back to the border!', delay: 85 },
    ],
    CHORNOBYL: [
      { sender: 'Command', text: 'Russian forces have seized the exclusion zone. Idiots do not know what they are walking into.', delay: 8 },
      { sender: 'Intel', text: 'Radiation levels elevated in sectors 3 and 7. Keep moving, do not linger.', delay: 40 },
      { sender: 'Command', text: 'The ghost town of Pripyat is now a battlefield. History repeating itself.', delay: 80 },
    ],
    CRIMEA: [
      { sender: 'Command', text: 'The bridge is the lifeline. Destroy it and we cut them off.', delay: 10 },
      { sender: 'Intel', text: 'Russian naval assets in the strait. Use terrain for cover.', delay: 40 },
      { sender: 'Command', text: 'Bridge is burning! Outstanding work! Crimea will be free!', delay: 85 },
    ],
  };

  // Generic messages used for all levels
  var GENERIC_MESSAGES = [
    { sender: 'Command', text: 'Stay sharp. Enemy positions shift constantly.', delay: 20 },
    { sender: 'Intel', text: 'Drone activity overhead. They are watching your position.', delay: 50 },
    { sender: 'Medic', text: 'Bandages are in the drop kit. Do not bleed out.', delay: 90 },
    { sender: 'Command', text: 'Ammunition is limited. Make every shot count.', delay: 120 },
    { sender: 'Intel', text: 'Enemy reinforcements on the way. Finish fast.', delay: 150 },
  ];

  function init() {
    if (_el) return;
    _el = document.createElement('div');
    _el.id = 'radio-comms';
    _el.style.cssText = [
      'position:fixed;bottom:80px;left:50%;transform:translateX(-50%);',
      'max-width:500px;min-width:200px;',
      'background:rgba(0,0,0,0.75);border-left:3px solid #00ff88;',
      'color:#00ff88;font-family:monospace;font-size:13px;',
      'padding:8px 14px;border-radius:0 4px 4px 0;',
      'z-index:8500;display:none;pointer-events:none;',
      'text-shadow:0 0 8px rgba(0,255,136,0.5);',
    ].join('');
    document.body.appendChild(_el);
  }

  function setLevel(levelId) {
    _currentLevel = levelId;
    _queue = [];
    _playing = false;
    // Schedule level-specific messages
    var msgs = LEVEL_MESSAGES[levelId] || GENERIC_MESSAGES;
    for (var i = 0; i < msgs.length; i++) {
      (function(msg) {
        setTimeout(function() {
          _showMessage(msg.sender, msg.text);
        }, msg.delay * 1000);
      })(msgs[i]);
    }
  }

  function _showMessage(sender, text) {
    if (!_el) init();
    _el.innerHTML = '📻 <span style="color:#88ffcc;font-weight:bold">[' + sender.toUpperCase() + ']</span> ' + text;
    _el.style.display = 'block';
    _el.style.opacity = '1';
    // Fade out after 5 seconds
    setTimeout(function() {
      _el.style.transition = 'opacity 1s';
      _el.style.opacity = '0';
      setTimeout(function() { _el.style.display = 'none'; _el.style.transition = ''; }, 1000);
    }, 5000);
  }

  // Manual trigger (for special events)
  function broadcast(sender, text) {
    _showMessage(sender, text);
  }

  return { init: init, setLevel: setLevel, broadcast: broadcast };
})();
