/* ─────────────────────────────────────────────────────────────────────────
   GRAPPLE — grappling hook system for vertical movement and mobility
   Keys:
     E (no Alt, no vehicle)  → fire / release
   Phase 1 (fire):   hook travels at 40 u/s; hits voxel surface or misses at 30 u
   Phase 2 (attach): pulls player toward anchor at 18 u/s; gravity/WASD at 30 %
   Phase 3 (retract):cable shrinks to 0 over 0.3 s
   Cooldown: 3 s after release
   ──────────────────────────────────────────────────────────────────────── */
window.Grapple = (function () {
  'use strict';

  /* ── constants ─────────────────────────────────────────────────── */
  var HOOK_SPEED      = 40;      // units/sec travelling
  var MAX_RANGE       = 30;      // units max reach
  var PULL_ACCEL      = 18;      // units/sec applied toward anchor
  var GRAVITY_MULT    = 0.30;    // gravity fraction while attached
  var WASD_MULT       = 0.30;    // WASD effectiveness while attached
  var COOLDOWN_SEC    = 3.0;
  var ANCHOR_SNAP     = 1.0;     // snap-release when this close to anchor
  var RETRACT_TIME    = 0.3;     // secs to retract cable after release
  var SNAP_BACK_TIME  = 0.5;     // secs to snap back on miss

  /* ── state ─────────────────────────────────────────────────────── */
  var _scene        = null;
  var _camera       = null;

  // phases: 'idle' | 'firing' | 'attached' | 'retracting' | 'snapback'
  var _phase        = 'idle';
  var _cooldown     = 0;

  // Fire phase
  var _hookPos      = null;   // THREE.Vector3 — current hook tip
  var _hookDir      = null;   // normalised THREE.Vector3 — travel direction
  var _hookDist     = 0;      // how far the hook has travelled

  // Attach phase
  var _anchor       = null;   // THREE.Vector3 — world position hit
  var _pullVel      = null;   // THREE.Vector3 — accumulated pull velocity

  // Retract / snapback phase
  var _retractTimer = 0;
  var _retractStart = null;   // THREE.Vector3 — anchor at moment of release

  // Cable visuals
  var _cableLine    = null;   // THREE.Line
  var _hookHead     = null;   // THREE.Mesh — small box at tip

  // HUD
  var _hudEl        = null;

  /* ── helpers ───────────────────────────────────────────────────── */
  function _makeCableVisuals() {
    // Line geometry: 2 points (player origin → hook tip)
    var geo = new THREE.BufferGeometry();
    var positions = new Float32Array(6); // 2 × vec3
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    var mat = new THREE.LineBasicMaterial({ color: 0x888888, linewidth: 1 });
    _cableLine = new THREE.Line(geo, mat);
    _cableLine.frustumCulled = false;
    _scene.add(_cableLine);

    // Hook head cube
    var hGeo = new THREE.BoxGeometry(0.12, 0.12, 0.12);
    var hMat = new THREE.MeshBasicMaterial({ color: 0x444444 });
    _hookHead = new THREE.Mesh(hGeo, hMat);
    _scene.add(_hookHead);
  }

  function _removeCableVisuals() {
    if (_cableLine) {
      _scene.remove(_cableLine);
      if (_cableLine.geometry) _cableLine.geometry.dispose();
      if (_cableLine.material) _cableLine.material.dispose();
      _cableLine = null;
    }
    if (_hookHead) {
      _scene.remove(_hookHead);
      if (_hookHead.geometry) _hookHead.geometry.dispose();
      if (_hookHead.material) _hookHead.material.dispose();
      _hookHead = null;
    }
  }

  function _updateCable(playerPos, tipPos) {
    if (!_cableLine) return;
    var attr = _cableLine.geometry.attributes.position;
    attr.setXYZ(0, playerPos.x, playerPos.y, playerPos.z);
    attr.setXYZ(1, tipPos.x, tipPos.y, tipPos.z);
    attr.needsUpdate = true;
    _cableLine.geometry.computeBoundingBox();
    if (_hookHead) _hookHead.position.copy(tipPos);
  }

  /* ── raycasting hit-test against scene objects ─────────────────── */
  function _raycastScene(origin, direction) {
    var raycaster = new THREE.Raycaster(origin, direction, 0.1, MAX_RANGE);
    // Collect all mesh children of the scene for hit testing
    var targets = [];
    _scene.traverse(function (obj) {
      if (obj.isMesh && obj !== _hookHead) targets.push(obj);
    });
    var hits = raycaster.intersectObjects(targets, false);
    if (hits.length > 0) {
      return hits[0].point.clone();
    }
    return null;
  }

  /* ── HUD ───────────────────────────────────────────────────────── */
  function _buildHUD() {
    if (_hudEl || typeof document === 'undefined') return;
    _hudEl = document.createElement('div');
    _hudEl.id = 'grapple-hud';
    _hudEl.style.cssText = [
      'position:fixed',
      'top:10px',
      'left:10px',
      'font-family:monospace',
      'font-size:13px',
      'font-weight:bold',
      'color:#00ff88',
      'background:rgba(0,0,0,0.45)',
      'padding:4px 8px',
      'border-radius:4px',
      'pointer-events:none',
      'z-index:9000',
      'user-select:none',
    ].join(';');
    _hudEl.textContent = '⛓ GRAPPLE';
    document.body.appendChild(_hudEl);
  }

  function _updateHUD() {
    if (!_hudEl) return;
    if (_phase === 'attached' || _phase === 'firing') {
      _hudEl.style.color = '#ff8800';
      _hudEl.textContent = '⛓ GRAPPLING';
    } else if (_cooldown > 0) {
      _hudEl.style.color = '#ff4444';
      _hudEl.textContent = '⛓ ' + _cooldown.toFixed(1) + 's';
    } else {
      _hudEl.style.color = '#00ff88';
      _hudEl.textContent = '⛓ GRAPPLE';
    }
  }

  /* ── public: init ──────────────────────────────────────────────── */
  function init(scene, camera) {
    _scene  = scene;
    _camera = camera;
    _phase  = 'idle';
    _cooldown = 0;
    _buildHUD();
  }

  /* ── public: fire ──────────────────────────────────────────────── */
  function fire(playerPos, camera) {
    if (_phase !== 'idle' || _cooldown > 0) return;

    var cam = camera || _camera;
    if (!cam || !_scene) return;

    // Direction from camera facing
    var dir = new THREE.Vector3(0, 0, -1).applyQuaternion(cam.quaternion).normalize();

    // Immediate raycast — if we hit something within range, go straight to attached
    var hitPt = _raycastScene(playerPos.clone(), dir);
    if (hitPt && hitPt.distanceTo(playerPos) <= MAX_RANGE) {
      _anchor   = hitPt;
      _pullVel  = new THREE.Vector3();
      _hookPos  = hitPt.clone();
      _hookDir  = dir.clone();
      _hookDist = hitPt.distanceTo(playerPos);
      _phase    = 'attached';
      _makeCableVisuals();
    } else {
      // Fire phase — hook travels outward
      _hookPos  = playerPos.clone();
      _hookDir  = dir.clone();
      _hookDist = 0;
      _anchor   = null;
      _pullVel  = new THREE.Vector3();
      _phase    = 'firing';
      _makeCableVisuals();
    }
  }

  /* ── public: release ───────────────────────────────────────────── */
  function release() {
    if (_phase === 'idle') return;
    _retractTimer = RETRACT_TIME;
    _retractStart = _hookPos ? _hookPos.clone() : (_anchor ? _anchor.clone() : new THREE.Vector3());
    _phase    = 'retracting';
    _cooldown = COOLDOWN_SEC;
  }

  /* ── public: isActive ──────────────────────────────────────────── */
  function isActive() {
    return _phase === 'attached';
  }

  /* ── public: update ────────────────────────────────────────────── */
  function update(delta, playerPos, camera) {
    if (!_scene) return;

    // Cooldown countdown
    if (_cooldown > 0) {
      _cooldown = Math.max(0, _cooldown - delta);
    }

    if (_phase === 'idle') {
      _updateHUD();
      return;
    }

    if (_phase === 'firing') {
      _hookDist += HOOK_SPEED * delta;
      _hookPos = new THREE.Vector3(
        playerPos.x + _hookDir.x * _hookDist,
        playerPos.y + _hookDir.y * _hookDist,
        playerPos.z + _hookDir.z * _hookDist
      );

      // Check for voxel/mesh hit along the path
      var testDir = _hookDir.clone();
      var testOri = playerPos.clone();
      var hit = _raycastScene(testOri, testDir);
      if (hit && hit.distanceTo(playerPos) <= _hookDist + 0.5) {
        // Hit something within the distance the hook has reached
        _anchor   = hit;
        _hookPos  = hit.clone();
        _hookDist = hit.distanceTo(playerPos);
        _phase    = 'attached';
      } else if (_hookDist >= MAX_RANGE) {
        // Miss — snap back
        _retractTimer = SNAP_BACK_TIME;
        _retractStart = _hookPos.clone();
        _phase = 'snapback';
        _cooldown = COOLDOWN_SEC;
      }

      _updateCable(playerPos, _hookPos);
    }

    if (_phase === 'attached') {
      var toAnchor = new THREE.Vector3().subVectors(_anchor, playerPos);
      var dist = toAnchor.length();

      // Release if close enough
      if (dist < ANCHOR_SNAP) {
        release();
      } else {
        // Apply pull toward anchor — accumulate into player.velocity if accessible
        // We apply directly to playerPos here via a pull delta
        toAnchor.normalize();
        var pullDelta = PULL_ACCEL * delta;

        // Accumulate pull velocity
        _pullVel.addScaledVector(toAnchor, pullDelta);

        // Cap pull speed
        if (_pullVel.length() > PULL_ACCEL) {
          _pullVel.normalize().multiplyScalar(PULL_ACCEL);
        }

        // Apply to player position
        playerPos.addScaledVector(_pullVel, delta);

        // Try to write back to player velocity for momentum retention
        var gm = window.GameManager;
        if (gm && gm._player && gm._player.velocity) {
          gm._player.velocity.copy(_pullVel);
        } else if (typeof player !== 'undefined' && player && player.velocity) {
          player.velocity.copy(_pullVel);
        }
      }

      _updateCable(playerPos, _anchor);
    }

    if (_phase === 'retracting') {
      _retractTimer -= delta;
      var t = Math.max(0, _retractTimer / RETRACT_TIME);
      // Interpolate cable end from anchor back to player
      if (_retractStart) {
        var tipPos = new THREE.Vector3().lerpVectors(playerPos, _retractStart, t);
        _updateCable(playerPos, tipPos);
      }
      if (_retractTimer <= 0) {
        _phase = 'idle';
        _removeCableVisuals();
      }
    }

    if (_phase === 'snapback') {
      _retractTimer -= delta;
      var tSnap = Math.max(0, _retractTimer / SNAP_BACK_TIME);
      if (_retractStart) {
        var snapTip = new THREE.Vector3().lerpVectors(playerPos, _retractStart, tSnap);
        _updateCable(playerPos, snapTip);
      }
      if (_retractTimer <= 0) {
        _phase = 'idle';
        _removeCableVisuals();
      }
    }

    _updateHUD();
  }

  /* ── public: gravityMultiplier ─────────────────────────────────── */
  function gravityMultiplier() {
    return (_phase === 'attached') ? GRAVITY_MULT : 1.0;
  }

  /* ── public: movementMultiplier ────────────────────────────────── */
  function movementMultiplier() {
    return (_phase === 'attached') ? WASD_MULT : 1.0;
  }

  /* ── public: clear (new level) ──────────────────────────────────── */
  function clear() {
    _removeCableVisuals();
    _phase     = 'idle';
    _cooldown  = 0;
    _anchor    = null;
    _hookPos   = null;
    _hookDir   = null;
    _pullVel   = null;
  }

  /* ── public: reset (new game) ──────────────────────────────────── */
  function reset() {
    clear();
  }

  return {
    init: init,
    update: update,
    fire: fire,
    release: release,
    isActive: isActive,
    gravityMultiplier: gravityMultiplier,
    movementMultiplier: movementMultiplier,
    clear: clear,
    reset: reset,
  };
})();
