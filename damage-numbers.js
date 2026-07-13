// damage-numbers.js — floating color-coded CSS damage numbers above enemies
// Ukraine conflict theme FPS — Three.js browser game
// IIFE pattern, all var (no let/const)

window.DamageNumbers = (function () {
  var _camera = null;
  var _container = null;
  var _active = []; // array of { div, worldPos, initialX, initialY, drift, elapsed }

  // ------------------------------------------------------------------
  // init(scene, camera) — store camera ref, create DOM container
  // ------------------------------------------------------------------
  function init(scene, camera) {
    _camera = camera;

    // Remove existing container if any (e.g. stage reset)
    var existing = document.getElementById('dmgNumberContainer');
    if (existing && existing.parentNode) {
      existing.parentNode.removeChild(existing);
    }
    _active = [];

    _container = document.createElement('div');
    _container.id = 'dmgNumberContainer';
    _container.style.position = 'absolute';
    _container.style.top = '0';
    _container.style.left = '0';
    _container.style.width = '100%';
    _container.style.height = '100%';
    _container.style.pointerEvents = 'none';
    _container.style.zIndex = '500';
    _container.style.overflow = 'hidden';
    document.body.appendChild(_container);
  }

  // ------------------------------------------------------------------
  // spawnNumber(worldPos, damage, isHeadshot, isCrit)
  // ------------------------------------------------------------------
  function spawnNumber(worldPos, damage, isHeadshot, isCrit) {
    if (!_camera || !_container) return;

    // Project world position (offset upward to enemy head) to screen
    var v = new THREE.Vector3(worldPos.x, worldPos.y + 1.5, worldPos.z);
    v.project(_camera);

    // Discard if behind camera (z > 1)
    if (v.z > 1) return;

    var sx = (v.x * 0.5 + 0.5) * window.innerWidth;
    var sy = (-v.y * 0.5 + 0.5) * window.innerHeight;

    // Determine display text
    var dmgInt = Math.round(damage);
    var text = String(dmgInt);
    if (isHeadshot) {
      text = text + ' HEADSHOT';
    } else if (isCrit) {
      text = text + '!';
    }

    // Determine color and font size
    var color, fontSize, outline;
    outline = false;

    if (isHeadshot) {
      color = '#00ffff';
      fontSize = 28;
    } else if (dmgInt >= 100) {
      color = '#ff2200';
      fontSize = 28; // largest (base 20-28, 100+ gets biggest)
      outline = true;
    } else if (dmgInt >= 51) {
      color = '#ff8800';
      fontSize = 24;
    } else if (dmgInt >= 26) {
      color = '#ffff00';
      fontSize = 20;
    } else {
      color = '#ffffff';
      fontSize = 20;
    }

    // Gold color for crit (overrides other color unless headshot)
    if (isCrit && !isHeadshot) {
      color = '#ffd700';
    }

    // Random horizontal drift ±15px
    var drift = (Math.random() * 30) - 15;

    // Create div
    var div = document.createElement('div');
    div.style.position = 'absolute';
    div.style.left = sx + 'px';
    div.style.top = sy + 'px';
    div.style.color = color;
    div.style.fontSize = fontSize + 'px';
    div.style.fontWeight = 'bold';
    div.style.fontFamily = 'monospace, sans-serif';
    div.style.textShadow = '1px 1px 2px #000';
    div.style.opacity = '1';
    div.style.pointerEvents = 'none';
    div.style.whiteSpace = 'nowrap';
    div.style.userSelect = 'none';
    div.style.transform = 'translate(-50%, -50%)';
    if (outline) {
      div.style.webkitTextStroke = '1px #000';
      div.style.textStroke = '1px #000';
    }
    div.textContent = text;

    _container.appendChild(div);

    _active.push({
      div: div,
      worldPos: { x: worldPos.x, y: worldPos.y, z: worldPos.z },
      initialX: sx,
      initialY: sy,
      drift: drift,
      elapsed: 0
    });
  }

  // ------------------------------------------------------------------
  // update(delta) — advance animation, reproject, remove expired
  // ------------------------------------------------------------------
  function update(delta) {
    if (!_camera || !_container) return;

    var i = _active.length - 1;
    while (i >= 0) {
      var num = _active[i];
      num.elapsed += delta;

      if (num.elapsed > 1.2) {
        // Remove expired
        if (num.div.parentNode) {
          num.div.parentNode.removeChild(num.div);
        }
        _active.splice(i, 1);
        i--;
        continue;
      }

      // Reproject world position (enemy may have moved)
      var v = new THREE.Vector3(num.worldPos.x, num.worldPos.y + 1.5, num.worldPos.z);
      v.project(_camera);

      // If behind camera, hide but keep tracking
      if (v.z > 1) {
        num.div.style.opacity = '0';
        i--;
        continue;
      }

      var screenX = (v.x * 0.5 + 0.5) * window.innerWidth;
      var screenY = (-v.y * 0.5 + 0.5) * window.innerHeight;

      // Update base position from reprojection
      num.initialX = screenX;
      num.initialY = screenY;

      // Float upward 60px over 1.2s, apply horizontal drift
      var progress = num.elapsed / 1.2;
      var topPx = screenY - progress * 60;
      var leftPx = screenX + num.drift * progress;

      num.div.style.top = topPx + 'px';
      num.div.style.left = leftPx + 'px';

      // Fade out over last 0.4s (starts at elapsed = 0.8s)
      var opacity = 1 - Math.max(0, (num.elapsed - 0.8) / 0.4);
      num.div.style.opacity = String(opacity);

      i--;
    }
  }

  // ------------------------------------------------------------------
  // clear() — remove all active number divs
  // ------------------------------------------------------------------
  function clear() {
    for (var i = 0; i < _active.length; i++) {
      var div = _active[i].div;
      if (div && div.parentNode) {
        div.parentNode.removeChild(div);
      }
    }
    _active = [];
  }

  return { init: init, spawnNumber: spawnNumber, update: update, clear: clear };
})();
