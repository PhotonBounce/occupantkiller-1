/**
 * tactical-reload.js
 * Full tactical animated weapon reload system for Three.js FPS game.
 * 3-phase reload animation, falling magazine mesh, HUD progress bar,
 * tactical/emergency reload distinction, multi-weapon reload times,
 * reload cancel penalty, and STANAG-compatible weapon integration.
 */
window.TacticalReload = (function() {
    'use strict';

    // ── State ─────────────────────────────────────────────────────────────────
    var _camera = null;
    var _scene  = null;
    var _active = false;

    // Current reload session
    var _phase        = 0;       // 1, 2, or 3
    var _phaseTimer   = 0;
    var _totalTimer   = 0;
    var _totalDur     = 0;
    var _isTactical   = false;
    var _weaponType   = 'AR';
    var _cancelled    = false;
    var _penaltyTimer = 0;

    // Per-phase durations (base values; scaled by weapon type)
    var PHASE1_DUR = 0.3;
    var PHASE2_DUR = 0.4;
    var PHASE3_DUR = 0.2;
    var BASE_DUR   = PHASE1_DUR + PHASE2_DUR + PHASE3_DUR;  // 0.9s for base

    // Weapon reload totals (seconds)
    var WEAPON_TIMES = {
        PISTOL:  1.2,
        SMG:     1.6,
        AR:      2.0,
        RIFLE:   2.0,
        SNIPER:  3.0,
        SHOTGUN: 0.6   // per shell (pump-action)
    };

    // Gun mesh baseline (saved on init)
    var _gunBasePos = null;   // THREE.Vector3
    var _gunBaseRot = null;   // THREE.Euler
    var _gunMesh    = null;

    // Magazine drop mesh
    var _magMesh      = null;
    var _magVelY      = 0;
    var _magActive    = false;
    var _magFadeTimer = 0;

    // HUD elements
    var _hudBar        = null;
    var _hudBarFill    = null;
    var _hudText       = null;
    var _hudTactical   = null;

    // Shotgun shell count
    var _shellsLeft    = 0;
    var _shellTotal    = 0;

    // ── Weapon type scale helpers ──────────────────────────────────────────────
    function _getReloadTime(wtype) {
        var t = WEAPON_TIMES[wtype];
        return (t !== undefined) ? t : WEAPON_TIMES['AR'];
    }

    function _getScaleFactor(wtype) {
        return _getReloadTime(wtype) / BASE_DUR;
    }

    // ── HUD creation ──────────────────────────────────────────────────────────
    function _createHUD() {
        if (_hudBar) return;

        // Wrapper
        var wrapper = document.createElement('div');
        wrapper.id = 'tr-hud';
        wrapper.style.cssText = [
            'position:fixed',
            'bottom:calc(50% - 40px)',
            'left:50%',
            'transform:translateX(-50%)',
            'display:none',
            'flex-direction:column',
            'align-items:center',
            'gap:4px',
            'pointer-events:none',
            'z-index:9990'
        ].join(';');

        // "RELOADING..." label
        var text = document.createElement('div');
        text.id = 'tr-text';
        text.textContent = 'RELOADING...';
        text.style.cssText = [
            'color:#ffffff',
            'font-family:monospace',
            'font-size:11px',
            'letter-spacing:3px',
            'text-shadow:0 0 6px rgba(255,255,255,0.6)',
            'opacity:0.9'
        ].join(';');
        wrapper.appendChild(text);

        // "TACTICAL RELOAD" bonus label
        var tactical = document.createElement('div');
        tactical.id = 'tr-tactical';
        tactical.textContent = 'TACTICAL RELOAD';
        tactical.style.cssText = [
            'color:#44ff88',
            'font-family:monospace',
            'font-size:10px',
            'letter-spacing:2px',
            'text-shadow:0 0 8px rgba(68,255,136,0.8)',
            'display:none'
        ].join(';');
        wrapper.appendChild(tactical);

        // Progress bar track
        var barTrack = document.createElement('div');
        barTrack.style.cssText = [
            'width:160px',
            'height:3px',
            'background:rgba(255,255,255,0.2)',
            'border-radius:2px',
            'overflow:hidden'
        ].join(';');

        // Progress bar fill
        var barFill = document.createElement('div');
        barFill.id = 'tr-bar-fill';
        barFill.style.cssText = [
            'width:0%',
            'height:100%',
            'background:#ffffff',
            'border-radius:2px',
            'transition:none'
        ].join(';');
        barTrack.appendChild(barFill);
        wrapper.appendChild(barTrack);

        document.body.appendChild(wrapper);

        _hudBar      = wrapper;
        _hudBarFill  = barFill;
        _hudText     = text;
        _hudTactical = tactical;
    }

    function _showHUD(tactical) {
        if (!_hudBar) _createHUD();
        _hudBar.style.display = 'flex';
        _hudBarFill.style.width = '0%';
        if (tactical) {
            _hudTactical.style.display = 'block';
        } else {
            _hudTactical.style.display = 'none';
        }
    }

    function _hideHUD() {
        if (_hudBar) {
            _hudBar.style.display = 'none';
        }
    }

    function _updateHUDProgress(ratio) {
        if (_hudBarFill) {
            _hudBarFill.style.width = (ratio * 100).toFixed(1) + '%';
        }
    }

    // ── Gun mesh helpers ───────────────────────────────────────────────────────
    function _findGunMesh() {
        if (!_camera) return null;
        for (var i = 0; i < _camera.children.length; i++) {
            var ch = _camera.children[i];
            if (ch.isMesh || ch.isGroup) return ch;
        }
        return null;
    }

    function _saveGunBase() {
        if (!_gunMesh) return;
        if (!_gunBasePos) {
            _gunBasePos = _gunMesh.position.clone();
        } else {
            _gunBasePos.copy(_gunMesh.position);
        }
        if (!_gunBaseRot) {
            _gunBaseRot = _gunMesh.rotation.clone();
        } else {
            _gunBaseRot.copy(_gunMesh.rotation);
        }
    }

    function _restoreGunBase() {
        if (!_gunMesh || !_gunBasePos || !_gunBaseRot) return;
        _gunMesh.position.copy(_gunBasePos);
        _gunMesh.rotation.copy(_gunBaseRot);
    }

    // ── Magazine drop mesh ─────────────────────────────────────────────────────
    function _spawnMagMesh() {
        if (!_scene) return;
        _removeMagMesh();

        var geo = new THREE.BoxGeometry(0.025, 0.08, 0.04);
        var mat = new THREE.MeshBasicMaterial({ color: 0x444444, transparent: true, opacity: 1.0 });
        _magMesh = new THREE.Mesh(geo, mat);

        // Spawn at camera position slightly below gun
        _magMesh.position.copy(_camera.position);
        _magMesh.position.y -= 0.3;

        // Copy camera yaw direction for a slight offset forward
        var dir = new THREE.Vector3(0, 0, -0.2);
        dir.applyQuaternion(_camera.quaternion);
        _magMesh.position.add(dir);

        _magVelY      = -0.5;  // initial downward velocity (units/s)
        _magActive    = true;
        _magFadeTimer = 0;

        _scene.add(_magMesh);
    }

    function _removeMagMesh() {
        if (_magMesh) {
            if (_magMesh.parent) _magMesh.parent.remove(_magMesh);
            if (_magMesh.geometry) _magMesh.geometry.dispose();
            if (_magMesh.material) _magMesh.material.dispose();
            _magMesh = null;
        }
        _magActive = false;
    }

    function _updateMagMesh(dt) {
        if (!_magMesh || !_magActive) return;

        if (_magMesh.position.y > 0) {
            _magVelY -= 9.8 * dt;   // gravity
            _magMesh.position.y += _magVelY * dt;
            _magMesh.rotation.x += 3.0 * dt;  // tumble
            if (_magMesh.position.y <= 0) {
                _magMesh.position.y = 0;
                _magVelY = 0;
                _magFadeTimer = 2.0;  // start 2s fade
            }
        } else {
            // Landed — count down fade
            _magFadeTimer -= dt;
            if (_magFadeTimer <= 0) {
                _removeMagMesh();
                return;
            }
            var alpha = Math.min(1.0, _magFadeTimer / 0.5);
            _magMesh.material.opacity = alpha;
        }
    }

    // ── Phase animation ────────────────────────────────────────────────────────
    //  t = normalized [0,1] within phase
    function _applyPhase1(t) {
        if (!_gunMesh || !_gunBasePos) return;
        // Magazine drop: tilt gun and lower slightly
        _gunMesh.position.y = _gunBasePos.y + (-0.15 * t);
        _gunMesh.rotation.z = _gunBaseRot.z + (0.3 * t);
    }

    function _applyPhase2(t) {
        if (!_gunMesh || !_gunBasePos) return;
        // Return to center with a brief Y oscillation (simulating mag insertion)
        var oscil = Math.sin(t * Math.PI * 4) * 0.03;
        _gunMesh.position.y = _gunBasePos.y + (-0.15 * (1.0 - t)) + oscil;
        _gunMesh.rotation.z = _gunBaseRot.z + (0.3 * (1.0 - t));
    }

    function _applyPhase3(t) {
        if (!_gunMesh || !_gunBasePos) return;
        // Bolt charge: gun moves back then forward
        var pullback = Math.sin(t * Math.PI) * 0.08;
        _gunMesh.position.z = _gunBasePos.z + pullback;
        _gunMesh.position.y = _gunBasePos.y;
        _gunMesh.rotation.z = _gunBaseRot.z;
    }

    // ── Core reload logic ──────────────────────────────────────────────────────
    function startReload(opts) {
        if (_active) return;  // already reloading

        opts = opts || {};
        _weaponType = (opts.weaponType || 'AR').toUpperCase();
        var currentAmmo = (typeof opts.currentAmmo === 'number') ? opts.currentAmmo : 0;

        _isTactical = (currentAmmo > 0);
        _cancelled  = false;

        // Resolve reload duration
        var scaleFactor = _getScaleFactor(_weaponType);
        var totalDur    = _getReloadTime(_weaponType);
        _totalDur       = totalDur;

        // Shotgun is per-shell; treat slightly differently in update
        _shellsLeft  = (opts.shellsLeft  !== undefined) ? opts.shellsLeft  : 1;
        _shellTotal  = (opts.shellTotal  !== undefined) ? opts.shellTotal  : 1;

        _phase       = 1;
        _phaseTimer  = 0;
        _totalTimer  = 0;
        _penaltyTimer = 0;
        _active      = true;

        // Refresh gun ref each reload (in case scene rebuilt)
        _gunMesh = _findGunMesh();
        _saveGunBase();

        _showHUD(_isTactical);

        // Hook into mouse click for cancel detection
        document.addEventListener('mousedown', _onMouseDown);

        if (window.AudioSystem && typeof window.AudioSystem.playReload === 'function') {
            window.AudioSystem.playReload();
        }
    }

    function cancelReload() {
        if (!_active) return;
        _finishReload(true);
    }

    function _onMouseDown(e) {
        if (!_active) return;
        if (e.button !== 0) return;   // left click = fire attempt
        // Cancel only allowed once past Phase 1
        if (_phase > 1) {
            _cancelWithPenalty();
        }
    }

    function _cancelWithPenalty() {
        if (!_active) return;
        _cancelled = true;
        _penaltyTimer = 0.5;  // 0.5s penalty lock
        _finishReload(true);
    }

    function _finishReload(cancelled) {
        _active   = false;
        _phase    = 0;

        document.removeEventListener('mousedown', _onMouseDown);
        _restoreGunBase();
        _hideHUD();

        if (!cancelled) {
            // Successful reload
            window._reloadComplete = true;

            if (_isTactical) {
                // Grant +1 bullet bonus by convention (caller can inspect window._reloadTacticalBonus)
                window._reloadTacticalBonus = true;
            }

            // STANAG — call window.Weapons.reload() if available
            if (window.Weapons && typeof window.Weapons.reload === 'function') {
                window.Weapons.reload();
            }
        } else {
            window._reloadTacticalBonus = false;
            // No mag swap; penalty timer handled in update()
        }
    }

    // ── Public API ─────────────────────────────────────────────────────────────
    function init(opts) {
        opts = opts || {};
        _camera = opts.camera || (window.GameManager && window.GameManager.camera) || null;
        _scene  = opts.scene  || (window.GameManager && window.GameManager.scene)  || null;

        _createHUD();

        // Hook the global reload trigger
        window._onWeaponReload = function(reloadOpts) {
            startReload(reloadOpts || {});
        };

        window._reloadComplete      = false;
        window._reloadTacticalBonus = false;
    }

    function update(dt) {
        // Penalty timer after cancelled reload
        if (_penaltyTimer > 0) {
            _penaltyTimer -= dt;
            return;
        }

        // Update falling magazine regardless of reload state
        if (_magActive) {
            _updateMagMesh(dt);
        }

        if (!_active) return;

        _totalTimer += dt;
        _phaseTimer += dt;

        // Update HUD progress bar
        var progress = Math.min(1.0, _totalTimer / _totalDur);
        _updateHUDProgress(progress);

        // Scaled phase durations
        var scale = _getScaleFactor(_weaponType);
        var dur1  = PHASE1_DUR * scale;
        var dur2  = PHASE2_DUR * scale;
        var dur3  = PHASE3_DUR * scale;

        if (_phase === 1) {
            var t = Math.min(1.0, _phaseTimer / dur1);
            _applyPhase1(t);

            if (_phaseTimer >= dur1) {
                // Spawn falling mag at end of phase 1
                _spawnMagMesh();
                _phase      = 2;
                _phaseTimer = 0;
            }

        } else if (_phase === 2) {
            var t2 = Math.min(1.0, _phaseTimer / dur2);
            _applyPhase2(t2);

            if (_phaseTimer >= dur2) {
                _phase      = 3;
                _phaseTimer = 0;
            }

        } else if (_phase === 3) {
            var t3 = Math.min(1.0, _phaseTimer / dur3);
            _applyPhase3(t3);

            if (_phaseTimer >= dur3) {
                // Shotgun pump-action: one shell at a time
                if (_weaponType === 'SHOTGUN' && _shellsLeft > 1) {
                    _shellsLeft--;
                    _phase      = 2;  // loop phases 2→3 for each shell
                    _phaseTimer = 0;
                    _totalDur  += _getReloadTime('SHOTGUN');
                    return;
                }
                _finishReload(false);
            }
        }
    }

    function reset() {
        if (_active) {
            document.removeEventListener('mousedown', _onMouseDown);
            _restoreGunBase();
        }
        _active       = false;
        _phase        = 0;
        _phaseTimer   = 0;
        _totalTimer   = 0;
        _penaltyTimer = 0;
        _cancelled    = false;

        _removeMagMesh();
        _hideHUD();

        window._reloadComplete      = false;
        window._reloadTacticalBonus = false;
    }

    // ── Module export ──────────────────────────────────────────────────────────
    return {
        init:         init,
        update:       update,
        startReload:  startReload,
        cancelReload: cancelReload,
        reset:        reset
    };

})();
