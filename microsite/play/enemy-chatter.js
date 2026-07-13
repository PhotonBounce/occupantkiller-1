window.EnemyChatter = (function() {
  'use strict';
  // var only — no let/const

  var _camera = null;
  var _activeChatter = [];  // {el, enemy, expiry, yOffset}

  // ── Phrase banks (Russian phrases) ────────────────────────────────────────
  var PHRASES = {
    spot: [
      'Вижу цель!',      // I see the target!
      'Цель замечена!',  // Target spotted!
      'Там противник!',  // Enemy there!
      'Огонь по врагу!', // Fire on the enemy!
      'К бою!',          // To battle!
    ],
    attack: [
      'Огонь!',          // Fire!
      'Уничтожить!',     // Destroy!
      'Атакуем!',        // Attacking!
      'За Путина!',      // For Putin! (ironic/hostile)
      'Вперёд!',         // Forward!
    ],
    hurt: [
      'Ранен!',          // Wounded!
      'Попали!',         // Hit!
      'Медика!',         // Medic!
      'Назад!',          // Back!
      'Отступаем!',      // Retreating!
    ],
    death: [
      'Убит...',         // Killed...
      'Конец...',        // The end...
    ],
    grenade: [
      'Граната!',        // Grenade!
      'Ложись!',         // Get down!
      'Взрывчатка!',     // Explosive!
    ],
  };

  // ── Screen-space position calculation ─────────────────────────────────────
  function _worldToScreen(pos3d) {
    if (!_camera || !pos3d) return null;
    var v = pos3d.clone();
    v.project(_camera);
    if (v.z > 1 || v.z < -1) return null; // behind camera or too far
    return {
      x: (v.x * 0.5 + 0.5) * window.innerWidth,
      y: (-v.y * 0.5 + 0.5) * window.innerHeight,
    };
  }

  // ── Create chatter bubble ──────────────────────────────────────────────────
  function say(enemy, eventType) {
    if (!enemy || !enemy.mesh) return;

    var phrases = PHRASES[eventType];
    if (!phrases || !phrases.length) return;

    // Max 8 active bubbles (performance)
    if (_activeChatter.length >= 8) return;

    // Throttle: don't let same enemy chatter more than once per 3s
    var now = Date.now();
    if (enemy._lastChatterTime && now - enemy._lastChatterTime < 3000) return;
    enemy._lastChatterTime = now;

    var text = phrases[Math.floor(Math.random() * phrases.length)];

    var el = document.createElement('div');
    el.style.cssText = [
      'position:fixed;pointer-events:none;z-index:3000;',
      'font-family:monospace;font-size:12px;',
      'color:#ffcccc;text-shadow:1px 1px 2px #000,0 0 4px rgba(0,0,0,0.8);',
      'background:rgba(0,0,0,0.65);',
      'padding:3px 8px;border-radius:12px;',
      'border:1px solid rgba(255,100,100,0.4);',
      'white-space:nowrap;',
      'transition:opacity 0.3s;',
      'opacity:0;',
    ].join('');
    el.textContent = text;
    document.body.appendChild(el);

    // Fade in
    requestAnimationFrame(function() { el.style.opacity = '1'; });

    _activeChatter.push({
      el: el,
      enemy: enemy,
      expiry: now + 2500,
      yOffset: -2.5,  // float 2.5 units above enemy center
    });
  }

  // ── Update (called per frame) ──────────────────────────────────────────────
  function update() {
    if (!_camera) return;
    var now = Date.now();

    for (var i = _activeChatter.length - 1; i >= 0; i--) {
      var c = _activeChatter[i];

      // Expire
      if (now > c.expiry || !c.enemy || !c.enemy.mesh) {
        c.el.style.opacity = '0';
        var _el = c.el;
        setTimeout(function() { if (document.body.contains(_el)) document.body.removeChild(_el); }, 350);
        _activeChatter.splice(i, 1);
        continue;
      }

      // Project to screen
      var worldPos = c.enemy.mesh.position.clone();
      worldPos.y += 2.5;  // above head
      var screen = _worldToScreen(worldPos);

      if (!screen) {
        c.el.style.opacity = '0';
        continue;
      }

      c.el.style.left = (screen.x - c.el.offsetWidth / 2) + 'px';
      c.el.style.top = (screen.y - 20) + 'px';
      c.el.style.opacity = '1';
    }
  }

  // ── Init and clear ─────────────────────────────────────────────────────────
  function init(camera) { _camera = camera; }

  function clear() {
    for (var i = 0; i < _activeChatter.length; i++) {
      if (document.body.contains(_activeChatter[i].el)) {
        document.body.removeChild(_activeChatter[i].el);
      }
    }
    _activeChatter = [];
  }

  return {
    init: init,
    say: say,
    update: update,
    clear: clear,
    PHRASES: PHRASES,
  };
})();
