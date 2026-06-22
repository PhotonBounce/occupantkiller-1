window.BodyDrag = (function() {
  'use strict';

  // --- State ---
  var _deadBodies = [];          // array of THREE.Object3D meshes (horizontal enemy bodies)
  var _draggedBody = null;       // currently dragged body mesh
  var _dragStartPos = null;      // Vector3 of position where drag began
  var _holdTimer = 0;            // seconds E has been held near a body
  var _holdTarget = null;        // body being held-E towards
  var _scene = null;
  var _camera = null;
  var _particleTimers = [];      // [{mesh, elapsed, duration}]

  // HUD elements
  var _hudDragging = null;
  var _hudBorderEl = null;
  var _borderPulseTime = 0;

  // Constants
  var PROXIMITY_DIST = 1.5;
  var HOLD_TIME = 0.8;
  var DRAG_OFFSET = 0.8;
  var MAX_DRAG_RANGE = 8;
  var RELEASE_DIST = 3;
  var CONCEAL_DIST = 2.5;
  var SCORE_CONCEAL = 300;

  // --- Internal helpers ---

  function _vec3Dist2D(a, b) {
    var dx = a.x - b.x;
    var dz = a.z - b.z;
    return Math.sqrt(dx * dx + dz * dz);
  }

  function _createHUD() {
    if (_hudDragging) return;

    _hudDragging = document.createElement('div');
    _hudDragging.id = 'body-drag-hud';
    _hudDragging.textContent = 'DRAGGING BODY';
    _hudDragging.style.cssText = [
      'position:fixed',
      'top:18px',
      'left:50%',
      'transform:translateX(-50%)',
      'color:#ff2222',
      'font-size:18px',
      'font-weight:bold',
      'font-family:monospace',
      'letter-spacing:3px',
      'pointer-events:none',
      'z-index:9999',
      'display:none',
      'text-shadow:0 0 8px #ff0000'
    ].join(';');
    document.body.appendChild(_hudDragging);

    _hudBorderEl = document.createElement('div');
    _hudBorderEl.id = 'body-drag-border';
    _hudBorderEl.style.cssText = [
      'position:fixed',
      'top:0',
      'left:0',
      'width:100%',
      'height:100%',
      'pointer-events:none',
      'z-index:9998',
      'box-shadow:inset 0 0 0 4px rgba(255,0,0,0)',
      'display:none'
    ].join(';');
    document.body.appendChild(_hudBorderEl);
  }

  function _showDragHUD(show) {
    if (!_hudDragging) _createHUD();
    _hudDragging.style.display = show ? 'block' : 'none';
    _hudBorderEl.style.display = show ? 'block' : 'none';
    if (!show) {
      _borderPulseTime = 0;
    }
  }

  function _updateBorderPulse(dt) {
    if (!_hudBorderEl || _hudBorderEl.style.display === 'none') return;
    _borderPulseTime += dt;
    var alpha = 0.3 + 0.3 * Math.sin(_borderPulseTime * 1.5);
    _hudBorderEl.style.boxShadow = 'inset 0 0 0 4px rgba(255,0,0,' + alpha + ')';
  }

  function _showPrompt(text) {
    var el = document.getElementById('body-drag-prompt');
    if (!el) {
      el = document.createElement('div');
      el.id = 'body-drag-prompt';
      el.style.cssText = [
        'position:fixed',
        'bottom:120px',
        'left:50%',
        'transform:translateX(-50%)',
        'color:#ffffff',
        'font-size:15px',
        'font-family:monospace',
        'background:rgba(0,0,0,0.55)',
        'padding:6px 18px',
        'border-radius:4px',
        'pointer-events:none',
        'z-index:9999',
        'display:none'
      ].join(';');
      document.body.appendChild(el);
    }
    if (text) {
      el.textContent = text;
      el.style.display = 'block';
    } else {
      el.style.display = 'none';
    }
  }

  function _showMessage(text, color, duration) {
    var el = document.createElement('div');
    el.textContent = text;
    var c = color || '#ffffff';
    el.style.cssText = [
      'position:fixed',
      'top:50%',
      'left:50%',
      'transform:translate(-50%,-50%)',
      'color:' + c,
      'font-size:22px',
      'font-weight:bold',
      'font-family:monospace',
      'letter-spacing:2px',
      'pointer-events:none',
      'z-index:10000',
      'text-shadow:0 0 12px ' + c
    ].join(';');
    document.body.appendChild(el);
    var ms = (duration || 2) * 1000;
    setTimeout(function() {
      if (el.parentNode) el.parentNode.removeChild(el);
    }, ms);
  }

  function _isNearCover(pos) {
    var positions = window._wreckPositions;
    if (!positions || !positions.length) return false;
    for (var i = 0; i < positions.length; i++) {
      var wp = positions[i];
      var dx = pos.x - wp.x;
      var dz = pos.z - (wp.z !== undefined ? wp.z : 0);
      if (Math.sqrt(dx * dx + dz * dz) <= CONCEAL_DIST) return true;
    }
    return false;
  }

  function _spawnConcealParticles(pos) {
    if (!_scene) return;
    var THREE = window.THREE;
    if (!THREE) return;

    for (var i = 0; i < 3; i++) {
      var geo = new THREE.SphereGeometry(0.06, 4, 4);
      var mat = new THREE.MeshBasicMaterial({ color: (i % 2 === 0) ? 0x4a7c2f : 0x8b6914 });
      var mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(
        pos.x + (Math.random() - 0.5) * 0.5,
        pos.y + 0.1 + Math.random() * 0.3,
        pos.z + (Math.random() - 0.5) * 0.5
      );
      _scene.add(mesh);
      _particleTimers.push({ mesh: mesh, elapsed: 0, duration: 2, vy: 0.3 + Math.random() * 0.4 });
    }
  }

  function _updateParticles(dt) {
    var toRemove = [];
    for (var i = 0; i < _particleTimers.length; i++) {
      var p = _particleTimers[i];
      p.elapsed += dt;
      p.mesh.position.y += p.vy * dt;
      p.vy -= 0.5 * dt;
      var alpha = 1 - (p.elapsed / p.duration);
      if (p.mesh.material) p.mesh.material.opacity = alpha;
      if (p.elapsed >= p.duration) {
        if (_scene) _scene.remove(p.mesh);
        if (p.mesh.geometry) p.mesh.geometry.dispose();
        if (p.mesh.material) p.mesh.material.dispose();
        toRemove.push(i);
      }
    }
    for (var j = toRemove.length - 1; j >= 0; j--) {
      _particleTimers.splice(toRemove[j], 1);
    }
  }

  function _releaseBody(playerPos) {
    if (!_draggedBody) return;

    var body = _draggedBody;
    var dropped = body.position.clone();

    _draggedBody = null;
    _dragStartPos = null;
    window._draggingBody = false;

    _showDragHUD(false);

    // Check concealment
    if (_isNearCover(dropped)) {
      _showMessage('BODY CONCEALED', '#00ff88', 2.5);
      _spawnConcealParticles(dropped);

      // Award score bonus
      if (typeof window._addScore === 'function') {
        window._addScore(SCORE_CONCEAL);
      } else if (window.ScoreSystem && typeof window.ScoreSystem.add === 'function') {
        window.ScoreSystem.add(SCORE_CONCEAL);
      }

      // Mark as concealed so patrol AI ignores it
      body._isConcealed = true;
    } else {
      // Alert patrol group
      if (typeof window._onPatrolAlerted === 'function') {
        window._onPatrolAlerted(body, dropped);
      }
    }
  }

  // --- Key state tracking ---
  var _eKeyDown = false;
  var _eWasDown = false;

  function _setupKeyListeners() {
    document.addEventListener('keydown', function(e) {
      if (e.code === 'KeyE' && !e.repeat) _eKeyDown = true;
    });
    document.addEventListener('keyup', function(e) {
      if (e.code === 'KeyE') {
        _eKeyDown = false;
        _holdTimer = 0;
        _holdTarget = null;
      }
    });
  }

  // --- Public API ---

  function init(scene, camera) {
    _scene = scene || (window.GameManager && window.GameManager.scene) || null;
    _camera = camera || (window.GameManager && window.GameManager.camera) || null;
    _createHUD();
    _setupKeyListeners();
    window._draggingBody = false;
    window._nearDeadBody = false;
  }

  function registerBody(bodyMesh) {
    if (bodyMesh && _deadBodies.indexOf(bodyMesh) === -1) {
      _deadBodies.push(bodyMesh);
    }
  }

  function unregisterBody(bodyMesh) {
    var idx = _deadBodies.indexOf(bodyMesh);
    if (idx !== -1) _deadBodies.splice(idx, 1);
    if (_draggedBody === bodyMesh) {
      _draggedBody = null;
      _dragStartPos = null;
      window._draggingBody = false;
      _showDragHUD(false);
    }
  }

  function startDrag(bodyMesh, playerPos) {
    if (_draggedBody) return;
    _draggedBody = bodyMesh;
    _dragStartPos = playerPos.clone ? playerPos.clone() : { x: playerPos.x, y: playerPos.y, z: playerPos.z };
    window._draggingBody = true;
    _showDragHUD(true);
  }

  function update(dt, playerPos, playerDir) {
    if (!playerPos) return;

    // Resolve scene/camera lazily
    if (!_scene && window.GameManager) _scene = window.GameManager.scene;
    if (!_camera && window.GameManager) _camera = window.GameManager.camera;

    _updateParticles(dt);
    _updateBorderPulse(dt);

    // --- Update dragged body position ---
    if (_draggedBody) {
      // Move body offset behind player along camera direction
      var dir = playerDir;
      if (!dir && _camera) {
        // derive from camera
        var THREE = window.THREE;
        if (THREE) {
          dir = new THREE.Vector3(0, 0, -1).applyQuaternion(_camera.quaternion);
        }
      }

      if (dir) {
        _draggedBody.position.x = playerPos.x - dir.x * DRAG_OFFSET;
        _draggedBody.position.z = playerPos.z - dir.z * DRAG_OFFSET;
        // keep body on ground (y unchanged, or slight floor snap)
        // body.position.y stays as-is
      }

      // Check max drag range from pickup point
      if (_dragStartPos) {
        var dragDist = _vec3Dist2D(playerPos, _dragStartPos);
        if (dragDist > MAX_DRAG_RANGE) {
          _releaseBody(playerPos);
          return;
        }
      }

      // Press E again while dragging → release
      if (_eKeyDown && !_eWasDown) {
        _releaseBody(playerPos);
        _eWasDown = true;
        return;
      }

      // Apply 60% speed modifier hint for other systems
      window._bodyDragSpeedMult = 0.6;
      window._bodyDragNoSprint = true;
      window._bodyDragNoADS = true;
    } else {
      window._bodyDragSpeedMult = 1.0;
      window._bodyDragNoSprint = false;
      window._bodyDragNoADS = false;
    }

    _eWasDown = _eKeyDown;

    // --- Proximity scan for dead bodies ---
    var nearestBody = null;
    var nearestDist = PROXIMITY_DIST;

    for (var i = _deadBodies.length - 1; i >= 0; i--) {
      var body = _deadBodies[i];
      if (!body || body === _draggedBody) continue;
      if (!body.parent) {
        // Body was removed from scene, clean up
        _deadBodies.splice(i, 1);
        continue;
      }
      var d = _vec3Dist2D(playerPos, body.position);
      if (d < nearestDist) {
        nearestDist = d;
        nearestBody = body;
      }
    }

    window._nearDeadBody = (nearestBody !== null) || (_draggedBody !== null);

    if (!_draggedBody) {
      if (nearestBody) {
        _showPrompt('[Hold E] Drag Body');

        if (_eKeyDown) {
          if (_holdTarget !== nearestBody) {
            _holdTimer = 0;
            _holdTarget = nearestBody;
          }
          _holdTimer += dt;
          if (_holdTimer >= HOLD_TIME) {
            _holdTimer = 0;
            _holdTarget = null;
            startDrag(nearestBody, playerPos);
          }
        } else {
          _holdTimer = 0;
          _holdTarget = null;
        }
      } else {
        _showPrompt(null);
        _holdTimer = 0;
        _holdTarget = null;
      }
    } else {
      _showPrompt(null);
    }
  }

  function reset() {
    if (_draggedBody) {
      _draggedBody = null;
      window._draggingBody = false;
      _showDragHUD(false);
    }
    _dragStartPos = null;
    _holdTimer = 0;
    _holdTarget = null;
    _eKeyDown = false;
    _eWasDown = false;
    window._nearDeadBody = false;
    window._bodyDragSpeedMult = 1.0;
    window._bodyDragNoSprint = false;
    window._bodyDragNoADS = false;
    _showPrompt(null);

    // Clean up particles
    for (var i = 0; i < _particleTimers.length; i++) {
      var p = _particleTimers[i];
      if (_scene) _scene.remove(p.mesh);
      if (p.mesh.geometry) p.mesh.geometry.dispose();
      if (p.mesh.material) p.mesh.material.dispose();
    }
    _particleTimers = [];
  }

  return {
    init: init,
    update: update,
    startDrag: startDrag,
    reset: reset,
    registerBody: registerBody,
    unregisterBody: unregisterBody
  };
})();
