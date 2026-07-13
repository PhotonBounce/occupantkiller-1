// bounty-system.js — High Value Target (HVT) bounty system
// Each wave, one enemy is secretly marked as a High Value Target with bonus rewards
window.BountySystem = (function() {
  'use strict';

  var _scene = null;
  var _target = null;          // current HVT enemy object
  var _active = false;
  var _timer = 0;
  var _escaped = false;
  var _bountyDuration = 25;

  // Three.js decorators attached to the HVT
  var _ring = null;            // gold torus orbiting at head height
  var _light = null;           // gold point light above head
  var _labelSprite = null;     // "⭐ HVT" canvas billboard
  var _countdownSprite = null; // "BOUNTY: Xs" floating text

  // HUD panel element
  var _hudPanel = null;

  // ── Canvas sprite helpers ──────────────────────────────────────────────

  function _makeTextSprite(text, color, fontSize) {
    var canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 64;
    var ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, 256, 64);
    ctx.font = 'bold ' + (fontSize || 20) + 'px Arial';
    ctx.fillStyle = color || '#ffff00';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 128, 32);
    var tex = new THREE.CanvasTexture(canvas);
    var mat = new THREE.SpriteMaterial({ map: tex, depthTest: false, transparent: true });
    var sprite = new THREE.Sprite(mat);
    sprite.scale.set(2, 0.5, 1);
    return sprite;
  }

  function _updateCountdownCanvas(seconds) {
    if (!_countdownSprite) return;
    var canvas = _countdownSprite.material.map.image;
    var ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.font = 'bold 22px Arial';
    ctx.fillStyle = '#ff2222';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('BOUNTY: ' + Math.ceil(seconds) + 's', 128, 32);
    _countdownSprite.material.map.needsUpdate = true;
  }

  // ── HUD panel ──────────────────────────────────────────────────────────

  function _createHUD() {
    if (_hudPanel) return;
    _hudPanel = document.createElement('div');
    _hudPanel.id = 'bounty-hud-panel';
    _hudPanel.style.cssText = [
      'position:fixed',
      'top:60px',
      'left:50%',
      'transform:translateX(-50%)',
      'background:rgba(0,0,0,0.7)',
      'color:#ffd700',
      'font-family:monospace',
      'font-size:15px',
      'font-weight:bold',
      'padding:4px 14px',
      'border:1px solid #ffd700',
      'border-radius:4px',
      'pointer-events:none',
      'display:none',
      'z-index:999',
    ].join(';');
    document.body.appendChild(_hudPanel);
  }

  function _updateHUD(seconds) {
    if (!_hudPanel) return;
    if (!_active) {
      _hudPanel.style.display = 'none';
      return;
    }
    _hudPanel.style.display = 'block';
    _hudPanel.textContent = '⭐ HVT ACTIVE — ' + Math.ceil(seconds) + 's';
  }

  // ── Toast / flash helpers ──────────────────────────────────────────────

  function _showToast(msg, color) {
    try {
      if (window.HUD && HUD.showToast) {
        HUD.showToast(msg, color || '#ffd700');
        return;
      }
      if (window.HUD && HUD.notifyPickup) {
        HUD.notifyPickup(msg, color || '#ffd700');
        return;
      }
    } catch (e) {}
  }

  function _goldFlash() {
    try {
      var canvas = document.querySelector('canvas');
      if (!canvas) return;
      var origFilter = canvas.style.filter || '';
      canvas.style.filter = 'sepia(1) brightness(1.5)';
      setTimeout(function() { canvas.style.filter = origFilter; }, 300);
    } catch (e) {}
  }

  // ── Attach / detach decorators ─────────────────────────────────────────

  function _attachDecorators(enemy) {
    if (!_scene || !enemy || !enemy.mesh) return;

    // Gold pulsing torus ring
    var ringGeo = new THREE.TorusGeometry(0.6, 0.05, 8, 16);
    var ringMat = new THREE.MeshBasicMaterial({ color: 0xffd700, side: THREE.DoubleSide });
    _ring = new THREE.Mesh(ringGeo, ringMat);
    _ring.rotation.x = Math.PI / 2;
    _scene.add(_ring);

    // Gold point light
    _light = new THREE.PointLight(0xffcc00, 0.8, 4);
    _scene.add(_light);

    // Label sprite: "⭐ HVT"
    _labelSprite = _makeTextSprite('⭐ HVT', '#ffd700', 22);
    _scene.add(_labelSprite);

    // Countdown sprite
    _countdownSprite = _makeTextSprite('BOUNTY: 25s', '#ff2222', 20);
    _scene.add(_countdownSprite);
  }

  function _detachDecorators() {
    if (_ring) {
      if (_ring.parent) _ring.parent.remove(_ring);
      if (_ring.geometry) _ring.geometry.dispose();
      if (_ring.material) _ring.material.dispose();
      _ring = null;
    }
    if (_light) {
      if (_light.parent) _light.parent.remove(_light);
      _light = null;
    }
    if (_labelSprite) {
      if (_labelSprite.parent) _labelSprite.parent.remove(_labelSprite);
      if (_labelSprite.material && _labelSprite.material.map) _labelSprite.material.map.dispose();
      if (_labelSprite.material) _labelSprite.material.dispose();
      _labelSprite = null;
    }
    if (_countdownSprite) {
      if (_countdownSprite.parent) _countdownSprite.parent.remove(_countdownSprite);
      if (_countdownSprite.material && _countdownSprite.material.map) _countdownSprite.material.map.dispose();
      if (_countdownSprite.material) _countdownSprite.material.dispose();
      _countdownSprite = null;
    }
  }

  function _updateDecoratorPositions(mesh) {
    if (!mesh) return;
    var pos = mesh.position;
    // ring orbits at roughly head height (~1.8 units above base)
    if (_ring) {
      _ring.position.set(pos.x, pos.y + 1.8, pos.z);
    }
    // light floats 2.5 units above
    if (_light) {
      _light.position.set(pos.x, pos.y + 2.5, pos.z);
    }
    // label 2.8 units above
    if (_labelSprite) {
      _labelSprite.position.set(pos.x, pos.y + 2.8, pos.z);
    }
    // countdown 2.4 units above
    if (_countdownSprite) {
      _countdownSprite.position.set(pos.x, pos.y + 2.4, pos.z);
    }
  }

  // ── Public API ─────────────────────────────────────────────────────────

  function init(scene) {
    _scene = scene;
    _createHUD();
  }

  function markEnemy(enemyArray) {
    // Clear any previous bounty first
    clear();

    if (!enemyArray || enemyArray.length === 0) return;

    // Filter to living enemies
    var living = [];
    for (var i = 0; i < enemyArray.length; i++) {
      var e = enemyArray[i];
      if (e && !e.dead && e.alive !== false && e.hp > 0 && e.mesh) {
        living.push(e);
      }
    }
    if (living.length === 0) return;

    // Pick one at random
    var idx = Math.floor(Math.random() * living.length);
    _target = living[idx];

    // HP bonus +50%
    if (_target.maxHp) {
      _target.maxHp = Math.round(_target.maxHp * 1.5);
      _target.hp = Math.min(_target.hp * 1.5, _target.maxHp);
    } else if (_target.hp) {
      _target.hp = Math.round(_target.hp * 1.5);
    }

    // Mark name tag
    _target._isHVT = true;
    if (_target.nameTag || _target.label) {
      try {
        var tag = _target.nameTag || _target.label;
        if (tag.element) tag.element.textContent = 'HIGH VALUE TARGET';
        if (tag.setText) tag.setText('HIGH VALUE TARGET');
      } catch (e) {}
    }

    _active = true;
    _escaped = false;
    _timer = _bountyDuration;
    window._bountyKilled = false;
    window._bountyEscaped = false;

    _attachDecorators(_target);
    _updateHUD(_timer);
  }

  function update(delta) {
    if (!_active || !_target) return;

    // Check if target died by something other than checkKill (e.g. explosion)
    if (_target.dead || _target.alive === false || _target.hp <= 0) {
      // Treat as a kill
      checkKill(_target);
      return;
    }

    _timer -= delta;

    // Animate ring rotation
    if (_ring) {
      _ring.rotation.z += delta * 2.5;
    }

    // Update positions each frame
    _updateDecoratorPositions(_target.mesh);

    // Update countdown display every second (canvas re-draw is cheap, do each frame)
    _updateCountdownCanvas(_timer);
    _updateHUD(_timer);

    if (_timer <= 0) {
      // Target escaped
      _escaped = true;
      _active = false;
      window._bountyEscaped = true;
      _showToast('TARGET ESCAPED', '#ff4444');
      _updateHUD(0);
      _detachDecorators();
      _target = null;
    }
  }

  function checkKill(deadEnemy) {
    if (!_active || !_target || !deadEnemy) return false;
    if (deadEnemy !== _target) return false;

    // It's the HVT!
    _active = false;
    window._bountyKilled = true;

    // Score reward handled by game-manager caller (+2000)
    _showToast('⭐ BOUNTY CLAIMED! +2000', '#ffd700');
    _goldFlash();

    // Auto-clear the flag after 2s
    setTimeout(function() { window._bountyKilled = false; }, 2000);

    _detachDecorators();
    _updateHUD(0);
    _target = null;
    return true;
  }

  function clear() {
    _detachDecorators();
    _active = false;
    _timer = 0;
    _escaped = false;
    _target = null;
    window._bountyKilled = false;
    window._bountyEscaped = false;
    _updateHUD(0);
  }

  function reset() {
    clear();
  }

  function getActiveBounty() {
    return _active ? _target : null;
  }

  return {
    init: init,
    update: update,
    markEnemy: markEnemy,
    checkKill: checkKill,
    clear: clear,
    reset: reset,
    getActiveBounty: getActiveBounty,
  };
})();
