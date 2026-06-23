/**
 * RappellingSystem — tactical rappelling and vertical movement system
 *
 * Public API:
 *   RappellingSystem.init()            — registers key handlers and creates HUD elements
 *   RappellingSystem.update(dt)        — advances rappel state each frame
 *   RappellingSystem.startRappel(fast) — programmatically start rappel (fast=true for fast rope)
 *   RappellingSystem.cutRope()         — cut the rope and enter freefall
 *   RappellingSystem.reset()           — detaches rope, removes meshes, resets state
 */
window.RappellingSystem = (function () {
  'use strict';

  // ── Constants ──────────────────────────────────────────────────────────────
  var DESCEND_SPEED      = 3;       // m/s normal descent (W key)
  var ASCEND_SPEED       = 2;       // m/s ascend (S key)
  var FAST_ROPE_SPEED    = 8;       // m/s fast rope descent (Alt+R mode)
  var KICK_OFF_H         = 5;       // horizontal velocity when kicking off wall
  var KICK_OFF_V         = 2;       // vertical velocity when kicking off wall
  var MAX_ROPE_LEN       = 15;      // maximum rope length in units
  var ROPE_RADIUS        = 0.015;   // rope mesh radius
  var ROPE_COLOR         = 0xcccccc; // grey-white
  var SWING_TILT         = 0.1;     // camera.rotation.z max tilt during swing
  var BOB_AMPLITUDE      = 0.002;   // camera bob amplitude on position.x
  var BOB_FREQUENCY      = 2;       // Hz
  var CAM_TILT_DOWN      = 0.1;     // camera looks slightly down while rappelling
  var DAMAGE_CUT_THRESH  = 20;      // damage in one hit that severs the rope
  var ANCHOR_PROBE_DIST  = 1;       // raycast distance above player to find anchor

  // ── State ──────────────────────────────────────────────────────────────────
  var _initialized    = false;
  var _rappelling     = false;
  var _fastRope       = false;
  var _anchorPoint    = null;   // THREE.Vector3
  var _ropeMesh       = null;
  var _hudEl          = null;
  var _bobTime        = 0;
  var _swingDir       = 0;     // -1 left, 0 neutral, 1 right
  var _swingAngle     = 0;     // current pendulum offset

  // Key state
  var _keys = {
    w: false, s: false, a: false, d: false, space: false,
    ctrl: false, alt: false, shift: false
  };

  // ── Helpers ─────────────────────────────────────────────────────────────────
  function _getScene()  { return window.scene  || (window.gameState && window.gameState.scene);  }
  function _getCamera() { return window.camera || (window.gameState && window.gameState.camera); }
  function _getPlayer() {
    return window.player ||
           (window.gameState && window.gameState.player) ||
           (window.camera);   // fallback: camera is player position
  }

  function _createRopeMesh(topY, botY) {
    var scene  = _getScene();
    var player = _getPlayer();
    if (!scene || !player) return null;

    var height = Math.abs(topY - botY);
    if (height < 0.01) height = 0.01;

    var geo  = new THREE.CylinderGeometry(ROPE_RADIUS, ROPE_RADIUS, height, 6);
    var mat  = new THREE.MeshLambertMaterial({ color: ROPE_COLOR });
    var mesh = new THREE.Mesh(geo, mat);

    var midY = (topY + botY) / 2;
    mesh.position.set(player.position.x, midY, player.position.z);
    scene.add(mesh);
    return mesh;
  }

  function _updateRopeMesh() {
    if (!_ropeMesh || !_anchorPoint) return;
    var player = _getPlayer();
    if (!player) return;

    var topY   = _anchorPoint.y;
    var botY   = player.position.y;
    var height = Math.max(0.01, topY - botY);

    // Rebuild geometry to resize the rope
    if (_ropeMesh.geometry) _ropeMesh.geometry.dispose();
    _ropeMesh.geometry = new THREE.CylinderGeometry(ROPE_RADIUS, ROPE_RADIUS, height, 6);

    _ropeMesh.position.set(
      player.position.x,
      botY + height / 2,
      player.position.z
    );
  }

  function _removeRopeMesh() {
    var scene = _getScene();
    if (_ropeMesh && scene) {
      scene.remove(_ropeMesh);
      if (_ropeMesh.geometry) _ropeMesh.geometry.dispose();
      if (_ropeMesh.material) _ropeMesh.material.dispose();
    }
    _ropeMesh = null;
  }

  function _showHud(text) {
    if (!_hudEl) {
      _hudEl = document.createElement('div');
      _hudEl.id = 'rappelling-hud';
      _hudEl.style.cssText = [
        'position:fixed',
        'bottom:80px',
        'left:50%',
        'transform:translateX(-50%)',
        'color:#fff',
        'font-family:monospace',
        'font-size:14px',
        'background:rgba(0,0,0,0.5)',
        'padding:4px 10px',
        'border-radius:4px',
        'pointer-events:none',
        'z-index:9999'
      ].join(';');
      document.body.appendChild(_hudEl);
    }
    _hudEl.textContent = text;
    _hudEl.style.display = text ? 'block' : 'none';
  }

  function _hideHud() {
    if (_hudEl) _hudEl.style.display = 'none';
  }

  // ── Raycast helpers ─────────────────────────────────────────────────────────
  function _findAnchorAbove(playerPos) {
    var scene = _getScene();
    if (!scene || typeof THREE === 'undefined' || !THREE.Raycaster) {
      // No raycaster available — anchor directly above
      return new THREE.Vector3(playerPos.x, playerPos.y + ANCHOR_PROBE_DIST, playerPos.z);
    }
    try {
      var raycaster = new THREE.Raycaster(
        new THREE.Vector3(playerPos.x, playerPos.y, playerPos.z),
        new THREE.Vector3(0, 1, 0),
        0,
        ANCHOR_PROBE_DIST
      );
      var targets = [];
      scene.traverse(function (obj) {
        if (obj.isMesh && obj !== _ropeMesh) targets.push(obj);
      });
      var hits = raycaster.intersectObjects(targets, false);
      if (hits.length > 0) {
        return hits[0].point.clone();
      }
    } catch (e) { /* ignore */ }
    // Default: anchor 1 m above player
    return new THREE.Vector3(playerPos.x, playerPos.y + ANCHOR_PROBE_DIST, playerPos.z);
  }

  // ── Core actions ─────────────────────────────────────────────────────────────
  function startRappel(fast) {
    if (_rappelling) return;
    var player = _getPlayer();
    if (!player) return;

    // Must be at height > 2
    if (player.position.y <= 2) return;

    _fastRope  = !!fast;
    _rappelling = true;
    _swingAngle = 0;
    _swingDir   = 0;
    _bobTime    = 0;

    _anchorPoint = _findAnchorAbove(player.position);

    // Clamp anchor so rope can't exceed max length from anchor to ground
    var ropeLen = _anchorPoint.y - 0;   // down to Y=0
    if (ropeLen > MAX_ROPE_LEN) {
      _anchorPoint.y = MAX_ROPE_LEN;
    }

    // Create rope from anchor down to player.y (which then extends to 0 visually)
    _ropeMesh = _createRopeMesh(_anchorPoint.y, player.position.y);

    if (_fastRope) {
      _showHud('FAST ROPE [W=SlideDown  Space=Release]');
    } else {
      _showHud('RAPPELLING [W=Down  S=Up  A/D=Swing  Space=Jump-off]');
    }

    window._rappelActive = true;

    // Apply downward camera tilt
    var camera = _getCamera();
    if (camera) {
      camera.rotation.x += CAM_TILT_DOWN;
    }
  }

  function cutRope() {
    if (!_rappelling) return;
    _detach(true);
  }

  function _detach(freefall) {
    _rappelling = false;
    _fastRope   = false;
    _anchorPoint = null;
    _swingAngle  = 0;
    _swingDir    = 0;
    window._rappelActive = false;

    _removeRopeMesh();
    _hideHud();

    // Restore camera tilt
    var camera = _getCamera();
    if (camera) {
      camera.rotation.x -= CAM_TILT_DOWN;
      camera.rotation.z  = 0;
    }

    if (freefall) {
      // Optionally trigger parachute
      if (window.ParachuteDrop && typeof window.ParachuteDrop.canDeploy === 'function') {
        // Signal that player is in freefall — parachute can be deployed
        if (window.ParachuteDrop.enterFreefall) {
          window.ParachuteDrop.enterFreefall();
        }
      }
    }
  }

  // ── Damage hook ─────────────────────────────────────────────────────────────
  // Listen for damage events to cut rope on heavy hit
  function _onDamageTaken(amount) {
    if (_rappelling && amount >= DAMAGE_CUT_THRESH) {
      cutRope();
    }
  }

  // Expose damage hook globally so game damage system can call it
  window._rappellingOnDamage = _onDamageTaken;

  // ── Window breach ──────────────────────────────────────────────────────────
  var _breachedYLevels = {};

  function _checkWindowBreach(playerY) {
    if (!window.WallBreach || typeof window.WallBreach.place !== 'function') return;
    // Trigger breach at whole-unit Y levels (any window floor)
    var yLevel = Math.floor(playerY);
    if (!_breachedYLevels[yLevel]) {
      _breachedYLevels[yLevel] = true;
      try {
        window.WallBreach.place();
      } catch (e) { /* ignore */ }
    }
  }

  // ── Update ───────────────────────────────────────────────────────────────────
  function update(dt) {
    if (!_rappelling) return;
    if (!dt || dt <= 0) dt = 0.016;

    var player = _getPlayer();
    var camera = _getCamera();
    if (!player) return;

    _bobTime += dt;

    // ── Movement ─────────────────────────────────────────────────────────────
    if (_fastRope) {
      // Fast rope: always descend, no ascent
      if (_keys.w) {
        player.position.y -= FAST_ROPE_SPEED * dt;
      }
      // Space to release
      if (_keys.space) {
        _keys.space = false;
        _detach(false);
        return;
      }
    } else {
      // Normal rappel
      if (_keys.w) {
        // Descend
        player.position.y -= DESCEND_SPEED * dt;
      }
      if (_keys.s) {
        // Ascend — cannot go above anchor
        var newY = player.position.y + ASCEND_SPEED * dt;
        if (_anchorPoint && newY < _anchorPoint.y) {
          player.position.y = newY;
        }
      }

      // Swing left/right (pendulum)
      if (_keys.a) {
        _swingDir = -1;
      } else if (_keys.d) {
        _swingDir = 1;
      } else {
        _swingDir = 0;
        // Dampen swing back toward 0
        _swingAngle *= 0.9;
      }

      if (_swingDir !== 0) {
        _swingAngle += _swingDir * dt * 0.5;
        _swingAngle = Math.max(-1, Math.min(1, _swingAngle));
      }

      // Kick off wall (Space)
      if (_keys.space) {
        _keys.space = false;
        // Apply horizontal velocity in facing direction
        if (camera) {
          var facingX = -Math.sin(camera.rotation.y) * KICK_OFF_H;
          var facingZ = -Math.cos(camera.rotation.y) * KICK_OFF_H;
          if (window.playerVelocity) {
            window.playerVelocity.x = facingX;
            window.playerVelocity.z = facingZ;
            window.playerVelocity.y = KICK_OFF_V;
          } else if (window.gameState && window.gameState.velocity) {
            window.gameState.velocity.x = facingX;
            window.gameState.velocity.z = facingZ;
            window.gameState.velocity.y = KICK_OFF_V;
          }
        }
        _detach(false);
        return;
      }
    }

    // Clamp player to ground (cannot go below Y=0)
    if (player.position.y <= 0) {
      player.position.y = 0;
      _detach(false);
      return;
    }

    // Clamp by rope length from anchor
    if (_anchorPoint) {
      var ropeLen = _anchorPoint.y - player.position.y;
      if (ropeLen > MAX_ROPE_LEN) {
        player.position.y = _anchorPoint.y - MAX_ROPE_LEN;
      }
    }

    // ── Camera effects ────────────────────────────────────────────────────────
    if (camera) {
      // Pendulum camera roll during swing
      var targetZ = _swingAngle * SWING_TILT;
      camera.rotation.z = camera.rotation.z + (targetZ - camera.rotation.z) * 0.15;

      // Bob on position.x
      camera.position.x += Math.sin(_bobTime * BOB_FREQUENCY * Math.PI * 2) * BOB_AMPLITUDE;
    }

    // ── Rope visual update ────────────────────────────────────────────────────
    _updateRopeMesh();

    // ── Window breach check ───────────────────────────────────────────────────
    _checkWindowBreach(player.position.y);

    // ── HUD update ────────────────────────────────────────────────────────────
    if (_fastRope) {
      _showHud('FAST ROPE [W=SlideDown  Space=Release]');
    } else {
      _showHud('RAPPELLING [W=Down  S=Up  A/D=Swing  Space=Jump-off]');
    }
  }

  // ── Key handlers ─────────────────────────────────────────────────────────────
  function _onKeyDown(e) {
    var key = e.key ? e.key.toLowerCase() : '';

    if (key === 'w') _keys.w = true;
    if (key === 's') _keys.s = true;
    if (key === 'a') _keys.a = true;
    if (key === 'd') _keys.d = true;
    if (key === ' ') _keys.space = true;
    if (key === 'control') _keys.ctrl = true;
    if (key === 'alt')     _keys.alt  = true;
    if (key === 'shift')   _keys.shift = true;

    // Ctrl+R — deploy or cut rope
    if (key === 'r' && _keys.ctrl && !_keys.alt && !_keys.shift) {
      e.preventDefault();
      if (_rappelling) {
        cutRope();
      } else {
        startRappel(false);
      }
      return;
    }

    // Ctrl+Shift+R — alternate deploy toggle
    if (key === 'r' && _keys.ctrl && _keys.shift && !_keys.alt) {
      e.preventDefault();
      if (_rappelling) {
        cutRope();
      } else {
        startRappel(false);
      }
      return;
    }

    // Alt+R — fast rope insertion
    if (key === 'r' && _keys.alt && !_keys.ctrl) {
      e.preventDefault();
      if (!_rappelling) {
        startRappel(true);
      }
      return;
    }
  }

  function _onKeyUp(e) {
    var key = e.key ? e.key.toLowerCase() : '';
    if (key === 'w') _keys.w = false;
    if (key === 's') _keys.s = false;
    if (key === 'a') _keys.a = false;
    if (key === 'd') _keys.d = false;
    if (key === ' ') _keys.space = false;
    if (key === 'control') _keys.ctrl  = false;
    if (key === 'alt')     _keys.alt   = false;
    if (key === 'shift')   _keys.shift = false;
  }

  // ── Init ──────────────────────────────────────────────────────────────────
  function init() {
    if (_initialized) return;
    _initialized = true;

    document.addEventListener('keydown', _onKeyDown, false);
    document.addEventListener('keyup',   _onKeyUp,   false);

    window._rappelActive = false;
  }

  // ── Reset ─────────────────────────────────────────────────────────────────
  function reset() {
    _detach(false);
    _breachedYLevels = {};
    _bobTime         = 0;
    _keys = { w: false, s: false, a: false, d: false, space: false,
              ctrl: false, alt: false, shift: false };
  }

  // ── Public API ────────────────────────────────────────────────────────────
  return {
    init:        init,
    update:      update,
    startRappel: startRappel,
    cutRope:     cutRope,
    reset:       reset
  };

})();
