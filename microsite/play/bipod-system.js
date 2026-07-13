/**
 * bipod-system.js — Weapon bipod deployment for LMGs and sniper rifles
 *
 * Key F7 — toggle bipod deploy/fold when prone or crouching near a surface.
 * Eligible weapons: MG3, PKM, SVD, AXMC, M82, or any weapon with isBipodCapable flag.
 *
 * Global flags set when deployed:
 *   window._bipodDeployed  — true while bipod is deployed
 *
 * Callbacks:
 *   window._onBipodDeployed() — fired when bipod fully deploys
 *   window._onBipodFolded()   — fired when bipod fully folds
 */
window.BipodSystem = (function () {
  'use strict';

  // ── Eligible weapon names ─────────────────────────────────────────────────
  var BIPOD_WEAPONS = ['MG3', 'PKM', 'SVD', 'AXMC', 'M82'];

  // ── Animation constants ────────────────────────────────────────────────────
  var ANIM_DURATION      = 0.3;   // seconds for deploy / fold animation
  var LEG_SPLAY_ANGLE    = (30 * Math.PI) / 180;  // 30 degrees in radians
  var AUTO_FOLD_DISTANCE = 0.5;   // lateral movement (units) that auto-folds

  // ── States ─────────────────────────────────────────────────────────────────
  var STATE_FOLDED    = 'FOLDED';
  var STATE_DEPLOYING = 'DEPLOYING';
  var STATE_DEPLOYED  = 'DEPLOYED';
  var STATE_FOLDING   = 'FOLDING';

  // ── Internal state ─────────────────────────────────────────────────────────
  var _state       = STATE_FOLDED;
  var _animTimer   = 0;
  var _scene       = null;
  var _bipodMesh   = null;   // THREE.Group holding both leg meshes
  var _leftLeg     = null;   // THREE.Mesh
  var _rightLeg    = null;   // THREE.Mesh
  var _initialized = false;

  // HUD elements
  var _badgeEl  = null;   // "BIPOD DEPLOYED" green badge
  var _promptEl = null;   // "[F7] Deploy Bipod" prompt

  // Auto-fold: track player XZ position at deploy time
  var _deployedAtX = 0;
  var _deployedAtZ = 0;

  // ── Helper: check if current weapon is bipod-capable ─────────────────────
  function _isEligibleWeapon() {
    var name = window._currentWeapon || window._equippedWeapon || '';
    var i;
    for (i = 0; i < BIPOD_WEAPONS.length; i++) {
      if (name === BIPOD_WEAPONS[i]) return true;
    }
    if (window._currentWeaponObj && window._currentWeaponObj.isBipodCapable) return true;
    return false;
  }

  // ── Helper: check player stance ───────────────────────────────────────────
  function _isValidStance() {
    return !!(window._prone || window._crouching);
  }

  // ── Helper: surface detection — forward 0.5 units or floor ───────────────
  function _hasSurface() {
    if (window._prone) return true;

    if (typeof window.VoxelWorld !== 'undefined' && typeof window.VoxelWorld.isSolid === 'function') {
      var pos = window._playerPos || null;
      if (!pos) return true;
      var fx = pos.x + 0.5;
      var fz = pos.z;
      var fy = Math.floor(pos.y);
      if (window.VoxelWorld.isSolid(fx, fy, fz)) return true;
      if (window.VoxelWorld.isSolid(fx, fy - 1, fz)) return true;
    }
    return true;
  }

  // ── AudioContext metallic click sound (440 Hz, short burst) ──────────────
  function _playClickSound() {
    try {
      var AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      var ctx = new AudioCtx();
      var osc = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      gain.gain.setValueAtTime(0.18, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.08);
    } catch (e) {
      // AudioContext may be unavailable; silently ignore
    }
  }

  // ── Build bipod Three.js mesh ─────────────────────────────────────────────
  function _buildBipodMesh() {
    if (typeof THREE === 'undefined') return null;

    var group = new THREE.Group();
    group.name = 'BipodSystem_mesh';

    var geo = new THREE.CylinderGeometry(0.015, 0.015, 0.3, 8);
    var mat = new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.7, roughness: 0.3 });

    // Left leg — splays left (positive Z rotation)
    var leftLeg = new THREE.Mesh(geo, mat);
    leftLeg.name = 'BipodSystem_leftLeg';
    leftLeg.rotation.z = 0;
    leftLeg.position.set(-0.03, -0.15, 0);
    group.add(leftLeg);

    // Right leg — splays right (negative Z rotation)
    var rightLeg = new THREE.Mesh(geo, mat);
    rightLeg.name = 'BipodSystem_rightLeg';
    rightLeg.rotation.z = 0;
    rightLeg.position.set(0.03, -0.15, 0);
    group.add(rightLeg);

    // Attach near weapon barrel
    group.position.set(0, -0.05, -0.25);
    group.visible = false;

    _leftLeg  = leftLeg;
    _rightLeg = rightLeg;
    return group;
  }

  // ── Create HUD elements ───────────────────────────────────────────────────
  function _createHUD() {
    if (!_badgeEl) {
      _badgeEl = document.createElement('div');
      _badgeEl.id = 'bipod-deployed-badge';
      _badgeEl.style.cssText = [
        'display:none',
        'position:fixed',
        'bottom:48px',
        'left:50%',
        'transform:translateX(-50%)',
        'background:rgba(0,80,0,0.75)',
        'border:1px solid #00ff44',
        'color:#00ff88',
        'font-family:monospace',
        'font-size:11px',
        'font-weight:bold',
        'letter-spacing:0.12em',
        'padding:3px 10px',
        'border-radius:3px',
        'pointer-events:none',
        'z-index:201',
        'text-shadow:0 0 6px rgba(0,255,80,0.6)'
      ].join(';');
      _badgeEl.textContent = 'BIPOD DEPLOYED';
      document.body.appendChild(_badgeEl);
    }

    if (!_promptEl) {
      _promptEl = document.createElement('div');
      _promptEl.id = 'bipod-prompt';
      _promptEl.style.cssText = [
        'display:none',
        'position:fixed',
        'bottom:72px',
        'left:50%',
        'transform:translateX(-50%)',
        'background:rgba(0,0,0,0.55)',
        'border:1px solid rgba(255,255,255,0.25)',
        'color:#ccc',
        'font-family:monospace',
        'font-size:12px',
        'padding:3px 12px',
        'border-radius:4px',
        'pointer-events:none',
        'z-index:201'
      ].join(';');
      _promptEl.textContent = '[F7] Deploy Bipod';
      document.body.appendChild(_promptEl);
    }
  }

  // ── Update HUD visibility ─────────────────────────────────────────────────
  function _updateHUD() {
    if (_badgeEl) {
      _badgeEl.style.display =
        (_state === STATE_DEPLOYED || _state === STATE_DEPLOYING) ? 'block' : 'none';
    }

    if (_promptEl) {
      var showPrompt = (_state === STATE_FOLDED || _state === STATE_FOLDING)
        && _isValidStance()
        && _isEligibleWeapon();
      _promptEl.style.display = showPrompt ? 'block' : 'none';
    }
  }

  // ── Apply deployed game-state effects ────────────────────────────────────
  function _applyDeployedEffects() {
    window._bipodDeployed       = true;
    window._bipodRecoilMult     = 0.15;   // near-zero recoil
    window._bipodAccuracyDiv    = 4;      // spread / 4
    window._bipodADSZoomMult    = 1.3;    // ADS zoom x1.3
    window._bipodNoSprint       = true;   // locked to prone/crouch
    window._bipodFireRateCapOff = true;   // lift LMG fire rate cap
  }

  // ── Clear deployed effects ────────────────────────────────────────────────
  function _clearDeployedEffects() {
    window._bipodDeployed       = false;
    window._bipodRecoilMult     = 1.0;
    window._bipodAccuracyDiv    = 1;
    window._bipodADSZoomMult    = 1.0;
    window._bipodNoSprint       = false;
    window._bipodFireRateCapOff = false;
  }

  // ── Animate leg splay: t=0 folded, t=1 deployed ──────────────────────────
  function _applyLegAngle(t) {
    var angle = LEG_SPLAY_ANGLE * t;
    if (_leftLeg)  _leftLeg.rotation.z  =  angle;
    if (_rightLeg) _rightLeg.rotation.z = -angle;
  }

  // ── Public: deployBipod ───────────────────────────────────────────────────
  function deployBipod() {
    if (_state === STATE_DEPLOYED || _state === STATE_DEPLOYING) return;
    if (!_isEligibleWeapon()) return;
    if (!_isValidStance())    return;
    if (!_hasSurface())       return;

    _state     = STATE_DEPLOYING;
    _animTimer = 0;

    if (_bipodMesh) _bipodMesh.visible = true;

    var pos = window._playerPos || null;
    _deployedAtX = pos ? pos.x : 0;
    _deployedAtZ = pos ? pos.z : 0;

    _playClickSound();
    _updateHUD();
  }

  // ── Public: foldBipod ─────────────────────────────────────────────────────
  function foldBipod() {
    if (_state === STATE_FOLDED || _state === STATE_FOLDING) return;

    _state     = STATE_FOLDING;
    _animTimer = 0;

    _clearDeployedEffects();
    _updateHUD();
  }

  // ── Key handler ───────────────────────────────────────────────────────────
  function _onKeyDown(e) {
    if (e.code !== 'F7') return;
    e.preventDefault();

    if (_state === STATE_DEPLOYED || _state === STATE_DEPLOYING) {
      foldBipod();
    } else {
      deployBipod();
    }
  }

  // ── Public: init ──────────────────────────────────────────────────────────
  function init(scene) {
    if (_initialized) return;
    _initialized = true;

    _scene = scene || null;

    _createHUD();

    if (_scene && typeof THREE !== 'undefined') {
      _bipodMesh = _buildBipodMesh();
      if (_bipodMesh) {
        _scene.add(_bipodMesh);
      }
    }

    _clearDeployedEffects();
    _updateHUD();

    document.addEventListener('keydown', _onKeyDown);

    console.log('[BipodSystem] initialized');
  }

  // ── Public: update ────────────────────────────────────────────────────────
  function update(dt) {
    if (!_initialized) return;

    if (_state === STATE_DEPLOYING) {
      _animTimer += dt;
      var tDeploy = Math.min(1, _animTimer / ANIM_DURATION);
      _applyLegAngle(tDeploy);

      if (tDeploy >= 1) {
        _state = STATE_DEPLOYED;
        _applyLegAngle(1);
        _applyDeployedEffects();
        _updateHUD();

        if (typeof window._onBipodDeployed === 'function') {
          window._onBipodDeployed();
        }
      }
    } else if (_state === STATE_FOLDING) {
      _animTimer += dt;
      var tFold = Math.min(1, _animTimer / ANIM_DURATION);
      _applyLegAngle(1 - tFold);

      if (tFold >= 1) {
        _state = STATE_FOLDED;
        _applyLegAngle(0);
        if (_bipodMesh) _bipodMesh.visible = false;
        _updateHUD();

        if (typeof window._onBipodFolded === 'function') {
          window._onBipodFolded();
        }
      }
    }

    // Auto-fold: player stood up
    if (_state === STATE_DEPLOYED || _state === STATE_DEPLOYING) {
      if (!_isValidStance()) {
        foldBipod();
        return;
      }

      // Auto-fold: lateral movement exceeds threshold
      var pos = window._playerPos || null;
      if (pos) {
        var dx = pos.x - _deployedAtX;
        var dz = pos.z - _deployedAtZ;
        if (Math.sqrt(dx * dx + dz * dz) > AUTO_FOLD_DISTANCE) {
          foldBipod();
          return;
        }
      }
    }

    _updateHUD();
  }

  // ── Public: reset ─────────────────────────────────────────────────────────
  function reset() {
    _state     = STATE_FOLDED;
    _animTimer = 0;
    _applyLegAngle(0);
    if (_bipodMesh) _bipodMesh.visible = false;
    _clearDeployedEffects();
    _updateHUD();
  }

  return {
    init:        init,
    update:      update,
    deployBipod: deployBipod,
    foldBipod:   foldBipod,
    reset:       reset
  };

}());
