const InputManager = (function () {
  "use strict";

  /* ════════════════════════════════════════════════════════════════════ */
  /*  Private State                                                    */
  /* ════════════════════════════════════════════════════════════════════ */
  const keys = {};
  let mouseDown = false;
  let mouseNewPress = false;
  let _mouseDeltaX = 0;
  let _mouseDeltaY = 0;

  const touch = {
    moveX: 0, moveY: 0,
    lookX: 0, lookY: 0,
    aimX: 0, aimY: 0,
    firing: false,
    jumping: false,
    reloading: false,
    sprinting: false,
    moveActive: false,
    lookActive: false,
    aimActive: false,
    moveTouchId: null,
    lookTouchId: null,
    aimTouchId: null,
    moveStartX: 0, moveStartY: 0,
    aimStartX: 0, aimStartY: 0,
    moveMaxDist: 32,
    aimMaxDist: 32,
    // Tap-to-shoot tracking
    tapStartX: 0, tapStartY: 0, tapStartTime: 0,
    // Gyro aim (mobile DeviceOrientation)
    gyroEnabled: false,
    gyroReady: false,
    gyroPrevAlpha: null,
    gyroPrevBeta: null,
    gyroDX: 0,
    gyroDY: 0,
    gyroSensitivity: 4.0,
    gyroAutoAssist: true,
  };

  var _isMobile = (typeof window !== 'undefined' && typeof window.isMobile !== 'undefined')
    ? window.isMobile
    : (typeof navigator !== 'undefined' && /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
  var _mobileControlsReady = false;
  var _pointerLockGraceUntil = 0;
  var _skipNextEsc = false;
  var _renderer = null;

  /* ════════════════════════════════════════════════════════════════════ */
  /*  Placeholder Callbacks for GameManager Integration                */
  /* ════════════════════════════════════════════════════════════════════ */
  var callbacks = {
    onKeyDown: null,
    onKeyUp: null,
    onMouseDown: null,
    onMouseUp: null,
    onMouseMove: null,
    onWheel: null,
    onTouchStart: null,
    onTouchMove: null,
    onTouchEnd: null,
    onPointerLockChange: null,
    onVisibilityChange: null,
    onFullscreenChange: null,
    onContextMenu: null,
    onAudioResume: null,
    onMobileAim: null,
    onSyncTouchDrive: null,
    onMobileVisibilityCheck: null,
    onMobileButton: null,
    onMobileWeaponSwitch: null,
    onMobileReload: null,
    onMobilePause: null,
    onMobileGrenade: null,
    onMobileMelee: null,
  };

  /* ════════════════════════════════════════════════════════════════════ */
  /*  Helper Functions                                                  */
  /* ════════════════════════════════════════════════════════════════════ */

  function getKeyValueFromCode(code) {
    var map = {
      Escape: 'Escape',
      Tab: 'Tab',
      Space: ' ',
      KeyB: 'b',
      KeyC: 'c',
      KeyF: 'f',
      KeyG: 'g',
      KeyL: 'l',
      KeyV: 'v',
      KeyX: 'x',
      KeyZ: 'z'
    };
    return map[code] || code;
  }

  function tapVirtualKey(code, holdMs) {
    var key = getKeyValueFromCode(code);
    document.dispatchEvent(new KeyboardEvent('keydown', {
      code: code, key: key, bubbles: true, cancelable: true
    }));
    window.setTimeout(function () {
      document.dispatchEvent(new KeyboardEvent('keyup', {
        code: code, key: key, bubbles: true, cancelable: true
      }));
    }, holdMs || 70);
  }

  function setMobileAim(active) {
    if (callbacks.onMobileAim) {
      callbacks.onMobileAim(active);
    }
  }

  function syncTouchDriveKeys() {
    if (!_isMobile) return;
    var forwardActive = touch.moveActive && touch.moveY < -0.2;
    var backActive = touch.moveActive && touch.moveY > 0.2;
    var leftActive = touch.moveActive && touch.moveX < -0.2;
    var rightActive = touch.moveActive && touch.moveX > 0.2;
    if (callbacks.onSyncTouchDrive) {
      callbacks.onSyncTouchDrive({
        forward: forwardActive,
        back: backActive,
        left: leftActive,
        right: rightActive,
        jumping: !!touch.jumping,
        sprinting: !!touch.sprinting,
        firing: !!touch.firing,
      });
    }
  }

  function updateMobileControlsVisibility() {
    if (!_isMobile) return;
    var mobileControls = document.getElementById('mobile-controls');
    if (!mobileControls) return;
    var shouldShow = true;
    if (callbacks.onMobileVisibilityCheck) {
      shouldShow = callbacks.onMobileVisibilityCheck();
    }
    mobileControls.style.display = shouldShow ? 'block' : 'none';
  }

  function requestPointerLock() {
    if (_isMobile) return;
    _pointerLockGraceUntil = performance.now() + 1600;
    if (!_renderer || !_renderer.domElement) return;
    var canvas = _renderer.domElement;
    var ownerDoc = canvas.ownerDocument || document;
    if (!canvas.isConnected || ownerDoc !== document || !document.contains(canvas)) return;
    if (ownerDoc.pointerLockElement === canvas) return;
    if (ownerDoc.visibilityState && ownerDoc.visibilityState !== 'visible') return;
    try {
      var req = canvas.requestPointerLock();
      if (req && typeof req.catch === 'function') {
        req.catch(function () {});
      }
    } catch (_) {}
  }

  function _onDeviceOrientation(e) {
    if (!touch.gyroEnabled) return;
    var a = e.alpha, b = e.beta;
    if (a == null || b == null) return;
    if (touch.gyroPrevAlpha === null) {
      touch.gyroPrevAlpha = a;
      touch.gyroPrevBeta = b;
      return;
    }
    var dA = a - touch.gyroPrevAlpha;
    if (dA > 180) dA -= 360; else if (dA < -180) dA += 360;
    var dB = b - touch.gyroPrevBeta;
    touch.gyroPrevAlpha = a;
    touch.gyroPrevBeta = b;
    if (Math.abs(dA) > 30 || Math.abs(dB) > 30) return;
    var sens = touch.gyroSensitivity;
    touch.gyroDX += -dA * sens;
    touch.gyroDY += dB * sens * 0.6;
  }

  function toggleGyroAim() {
    if (!_isMobile) return;
    var enable = !touch.gyroEnabled;
    var btn = document.getElementById('btn-gyro');
    function _activate() {
      touch.gyroEnabled = true;
      touch.gyroPrevAlpha = null;
      touch.gyroPrevBeta = null;
      touch.gyroDX = 0;
      touch.gyroDY = 0;
      if (!touch.gyroReady) {
        window.addEventListener('deviceorientation', _onDeviceOrientation, true);
        touch.gyroReady = true;
      }
      if (btn) btn.classList.add('active');
      try { localStorage.setItem('ok_gyro', '1'); } catch (_e) {}
    }
    function _deactivate() {
      touch.gyroEnabled = false;
      touch.gyroDX = 0;
      touch.gyroDY = 0;
      if (btn) btn.classList.remove('active');
      try { localStorage.setItem('ok_gyro', '0'); } catch (_e) {}
    }
    if (!enable) { _deactivate(); return; }
    var DOE = window.DeviceOrientationEvent;
    if (DOE && typeof DOE.requestPermission === 'function') {
      DOE.requestPermission().then(function (state) {
        if (state === 'granted') _activate();
        else if (btn) btn.classList.remove('active');
      }).catch(function () {});
    } else {
      _activate();
    }
  }

  /* ════════════════════════════════════════════════════════════════════ */
  /*  Core Event Handlers                                               */
  /* ════════════════════════════════════════════════════════════════════ */

  function _onKeyDown(e) {
    keys[e.code] = true;

    // Fullscreen-exit ESC suppression
    if (e.code === 'Escape') {
      if (e.isTrusted && (document.fullscreenElement || document.webkitFullscreenElement || _skipNextEsc)) {
        _skipNextEsc = false;
        return;
      }
    }

    if (callbacks.onKeyDown) {
      callbacks.onKeyDown(e);
    }
  }

  function _onKeyUp(e) {
    keys[e.code] = false;
    if (callbacks.onKeyUp) {
      callbacks.onKeyUp(e);
    }
  }

  function _onMouseDown(e) {
    if (callbacks.onAudioResume) {
      callbacks.onAudioResume();
    } else if (typeof window !== 'undefined' && window.AudioSystem && typeof window.AudioSystem.resume === 'function') {
      try { window.AudioSystem.resume(); } catch (_e) {}
    }

    if (e.button === 0) {
      if (!_isMobile && !document.pointerLockElement) {
        requestPointerLock();
        if (callbacks.onMouseDown) {
          var ret = callbacks.onMouseDown(e);
          if (ret === false) return;
        }
      }
      mouseDown = true;
      mouseNewPress = true;
    }

    if (callbacks.onMouseDown) {
      callbacks.onMouseDown(e);
    }
  }

  function _onMouseUp(e) {
    if (e.button === 0) {
      mouseDown = false;
      mouseNewPress = false;
    }
    if (callbacks.onMouseUp) {
      callbacks.onMouseUp(e);
    }
  }

  function _onMouseMove(e) {
    if (document.pointerLockElement) {
      _mouseDeltaX = e.movementX;
      _mouseDeltaY = e.movementY;
      if (callbacks.onMouseMove) {
        callbacks.onMouseMove(e.movementX, e.movementY);
      }
    }
  }

  function _onWheel(e) {
    if (callbacks.onWheel) {
      callbacks.onWheel(e.deltaY);
    }
  }

  function _onContextMenu(e) {
    e.preventDefault();
    if (callbacks.onContextMenu) {
      callbacks.onContextMenu(e);
    }
  }

  function _onTouchStartAudio(e) {
    if (callbacks.onAudioResume) {
      callbacks.onAudioResume();
    } else if (typeof window !== 'undefined' && window.AudioSystem && typeof window.AudioSystem.resume === 'function') {
      try { window.AudioSystem.resume(); } catch (_e) {}
    }
    if (callbacks.onTouchStart) {
      callbacks.onTouchStart(e);
    }
  }

  function _onVisibilityChange() {
    if (callbacks.onVisibilityChange) {
      callbacks.onVisibilityChange(document.hidden);
    }
  }

  function _onPointerLockChange() {
    if (!document.pointerLockElement) {
      if (performance.now() < _pointerLockGraceUntil) return;
    }
    if (callbacks.onPointerLockChange) {
      callbacks.onPointerLockChange(document.pointerLockElement);
    }
  }

  function _onFullscreenChange() {
    if (!document.fullscreenElement) _skipNextEsc = true;
    if (callbacks.onFullscreenChange) {
      callbacks.onFullscreenChange(document.fullscreenElement);
    }
  }

  function _onWebkitFullscreenChange() {
    if (!document.webkitFullscreenElement) _skipNextEsc = true;
    if (callbacks.onFullscreenChange) {
      callbacks.onFullscreenChange(document.webkitFullscreenElement);
    }
  }

  /* ════════════════════════════════════════════════════════════════════ */
  /*  Touch Look Controls (mobile)                                    */
  /* ════════════════════════════════════════════════════════════════════ */

  function _setupTouchLook() {
    var lookZone = document.getElementById('mobile-look-zone') || (_renderer && _renderer.domElement);
    if (!lookZone) return;

    lookZone.addEventListener('touchstart', function (e) {
      e.preventDefault();
      for (var i = 0; i < e.changedTouches.length; i++) {
        var t = e.changedTouches[i];
        touch.lookTouchId = t.identifier;
        touch.lookActive = true;
        touch._lookPrevX = t.clientX;
        touch._lookPrevY = t.clientY;
        touch.tapStartX = t.clientX;
        touch.tapStartY = t.clientY;
        touch.tapStartTime = performance.now();
        try { lookZone.classList.add('look-active'); } catch (_e) {}
      }
      if (callbacks.onTouchStart) callbacks.onTouchStart(e);
    }, { passive: false });

    lookZone.addEventListener('touchmove', function (e) {
      e.preventDefault();
      for (var i = 0; i < e.changedTouches.length; i++) {
        var t = e.changedTouches[i];
        if (t.identifier === touch.lookTouchId) {
          var dx = t.clientX - touch._lookPrevX;
          var dy = t.clientY - touch._lookPrevY;
          touch.lookX += dx;
          touch.lookY += dy;
          touch._lookPrevX = t.clientX;
          touch._lookPrevY = t.clientY;
        }
      }
      if (callbacks.onTouchMove) callbacks.onTouchMove(e);
    }, { passive: false });

    document.addEventListener('touchmove', function (e) {
      if (touch.lookTouchId === null) return;
      for (var i = 0; i < e.changedTouches.length; i++) {
        var t = e.changedTouches[i];
        if (t.identifier === touch.lookTouchId) {
          var dx = t.clientX - touch._lookPrevX;
          var dy = t.clientY - touch._lookPrevY;
          touch.lookX += dx;
          touch.lookY += dy;
          touch._lookPrevX = t.clientX;
          touch._lookPrevY = t.clientY;
        }
      }
      if (callbacks.onTouchMove) callbacks.onTouchMove(e);
    }, { passive: false });

    function _releaseLookTouch(e) {
      for (var i = 0; i < e.changedTouches.length; i++) {
        var t = e.changedTouches[i];
        if (t.identifier === touch.lookTouchId) {
          var tapDur = performance.now() - touch.tapStartTime;
          var tapDx = t.clientX - touch.tapStartX;
          var tapDy = t.clientY - touch.tapStartY;
          if (tapDur < 250 && Math.abs(tapDx) < 12 && Math.abs(tapDy) < 12) {
            touch.firing = true;
            mouseNewPress = true;
            window.setTimeout(function () {
              touch.firing = false;
              mouseNewPress = false;
            }, 120);
          }
          touch.lookTouchId = null;
          touch.lookActive = false;
          try { lookZone.classList.remove('look-active'); } catch (_e) {}
        }
      }
      if (callbacks.onTouchEnd) callbacks.onTouchEnd(e);
    }

    lookZone.addEventListener('touchend', _releaseLookTouch, { passive: true });
    lookZone.addEventListener('touchcancel', _releaseLookTouch, { passive: true });
    document.addEventListener('touchend', _releaseLookTouch, { passive: true });
    document.addEventListener('touchcancel', _releaseLookTouch, { passive: true });
  }

  /* ════════════════════════════════════════════════════════════════════ */
  /*  Mobile Controls Setup                                             */
  /* ════════════════════════════════════════════════════════════════════ */

  function _setupMobileControls() {
    if (_mobileControlsReady) return;
    _mobileControlsReady = true;

    // One-time touch-controls hint
    try {
      if (typeof localStorage !== 'undefined' && !localStorage.getItem('okc_mob_hint_v1')) {
        window.setTimeout(function () {
          if (typeof window !== 'undefined' && window.HUD && window.HUD.showToast) {
            window.HUD.showToast('📱 Drag anywhere to LOOK · tap to SHOOT · left stick to MOVE', 5500, '#5cc8ff');
          }
          try { localStorage.setItem('okc_mob_hint_v1', '1'); } catch (_e) {}
        }, 1400);
      }
    } catch (_e) {}

    var joystickZone = document.getElementById('joystick-zone');
    var joystickThumb = document.getElementById('joystick-thumb');

    if (joystickZone) {
      joystickZone.addEventListener('touchstart', function (e) {
        e.preventDefault();
        var t = e.changedTouches[0];
        touch.moveTouchId = t.identifier;
        touch.moveActive = true;
        var rect = joystickZone.getBoundingClientRect();
        var currentBaseSize = rect.width || 110;
        var currentThumbSize = joystickThumb ? joystickThumb.offsetWidth : 46;
        touch.moveStartX = rect.left + currentBaseSize / 2;
        touch.moveStartY = rect.top + currentBaseSize / 2;
        touch.moveMaxDist = (currentBaseSize - currentThumbSize) / 2;
      }, { passive: false });

      joystickZone.addEventListener('touchmove', function (e) {
        e.preventDefault();
        for (var i = 0; i < e.changedTouches.length; i++) {
          var t = e.changedTouches[i];
          if (t.identifier === touch.moveTouchId) {
            var dx = t.clientX - touch.moveStartX;
            var dy = t.clientY - touch.moveStartY;
            var maxDist = touch.moveMaxDist || 32;
            var dist = Math.sqrt(dx * dx + dy * dy);
            if (dist > maxDist) {
              dx = dx / dist * maxDist;
              dy = dy / dist * maxDist;
              dist = maxDist;
            }
            touch.moveX = dx / maxDist;
            touch.moveY = dy / maxDist;
            if (joystickThumb) {
              var rect = joystickZone.getBoundingClientRect();
              var currentBaseSize = rect.width || 110;
              var currentThumbSize = joystickThumb.offsetWidth || 46;
              joystickThumb.style.left = (currentBaseSize / 2 - currentThumbSize / 2 + dx) + 'px';
              joystickThumb.style.top = (currentBaseSize / 2 - currentThumbSize / 2 + dy) + 'px';
            }
          }
        }
      }, { passive: false });

      function resetJoystick() {
        touch.moveTouchId = null;
        touch.moveActive = false;
        touch.moveX = 0;
        touch.moveY = 0;
        if (joystickThumb && joystickZone) {
          var rect = joystickZone.getBoundingClientRect();
          var currentBaseSize = rect.width || 110;
          var currentThumbSize = joystickThumb.offsetWidth || 46;
          joystickThumb.style.left = (currentBaseSize / 2 - currentThumbSize / 2) + 'px';
          joystickThumb.style.top = (currentBaseSize / 2 - currentThumbSize / 2) + 'px';
        }
      }
      function _onMoveTouchEnd(e) {
        for (var i = 0; i < e.changedTouches.length; i++) {
          if (e.changedTouches[i].identifier === touch.moveTouchId) resetJoystick();
        }
      }
      joystickZone.addEventListener('touchend', _onMoveTouchEnd, { passive: true });
      joystickZone.addEventListener('touchcancel', _onMoveTouchEnd, { passive: true });
      document.addEventListener('touchend', _onMoveTouchEnd, { passive: true });
      document.addEventListener('touchcancel', _onMoveTouchEnd, { passive: true });
    }

    // ── Aim Joystick (right side, mirrors move joystick) ──
    var aimZone = document.getElementById('aim-joystick-zone');
    var aimThumb = document.getElementById('aim-joystick-thumb');
    if (aimZone && aimThumb) {
      aimZone.addEventListener('touchstart', function (e) {
        e.preventDefault();
        var t = e.changedTouches[0];
        touch.aimTouchId = t.identifier;
        touch.aimActive = true;
        var rect = aimZone.getBoundingClientRect();
        var currentBaseSize = rect.width || 110;
        var currentThumbSize = aimThumb.offsetWidth || 46;
        touch.aimStartX = rect.left + currentBaseSize / 2;
        touch.aimStartY = rect.top + currentBaseSize / 2;
        touch.aimMaxDist = (currentBaseSize - currentThumbSize) / 2;
      }, { passive: false });

      aimZone.addEventListener('touchmove', function (e) {
        e.preventDefault();
        for (var i = 0; i < e.changedTouches.length; i++) {
          var t = e.changedTouches[i];
          if (t.identifier === touch.aimTouchId) {
            var dx = t.clientX - touch.aimStartX;
            var dy = t.clientY - touch.aimStartY;
            var maxDist = touch.aimMaxDist || 32;
            var dist = Math.sqrt(dx * dx + dy * dy);
            if (dist > maxDist) {
              dx = dx / dist * maxDist;
              dy = dy / dist * maxDist;
            }
            touch.aimX = dx / maxDist;
            touch.aimY = dy / maxDist;
            var rect = aimZone.getBoundingClientRect();
            var currentBaseSize = rect.width || 110;
            var currentThumbSize = aimThumb.offsetWidth || 46;
            aimThumb.style.left = (currentBaseSize / 2 - currentThumbSize / 2 + dx) + 'px';
            aimThumb.style.top = (currentBaseSize / 2 - currentThumbSize / 2 + dy) + 'px';
          }
        }
      }, { passive: false });

      function resetAimJoystick() {
        touch.aimTouchId = null;
        touch.aimActive = false;
        touch.aimX = 0;
        touch.aimY = 0;
        var rect = aimZone.getBoundingClientRect();
        var currentBaseSize = rect.width || 110;
        var currentThumbSize = aimThumb.offsetWidth || 46;
        aimThumb.style.left = (currentBaseSize / 2 - currentThumbSize / 2) + 'px';
        aimThumb.style.top = (currentBaseSize / 2 - currentThumbSize / 2) + 'px';
      }
      function _onAimTouchEnd(e) {
        for (var i = 0; i < e.changedTouches.length; i++) {
          if (e.changedTouches[i].identifier === touch.aimTouchId) resetAimJoystick();
        }
      }
      aimZone.addEventListener('touchend', _onAimTouchEnd, { passive: true });
      aimZone.addEventListener('touchcancel', _onAimTouchEnd, { passive: true });
      document.addEventListener('touchend', _onAimTouchEnd, { passive: true });
      document.addEventListener('touchcancel', _onAimTouchEnd, { passive: true });
    }

    // Fire button
    var btnFire = document.getElementById('btn-fire');
    if (btnFire) {
      btnFire.addEventListener('touchstart', function (e) {
        e.preventDefault();
        touch.firing = true;
        mouseNewPress = true;
        btnFire.classList.add('active');
      }, { passive: false });
      btnFire.addEventListener('touchend', function () {
        touch.firing = false;
        mouseNewPress = false;
        btnFire.classList.remove('active');
      });
      btnFire.addEventListener('touchcancel', function () {
        touch.firing = false;
        mouseNewPress = false;
        btnFire.classList.remove('active');
      });
    }

    // Aim button
    var btnAim = document.getElementById('btn-aim');
    if (btnAim) {
      btnAim.addEventListener('touchstart', function (e) {
        e.preventDefault();
        setMobileAim(true);
        btnAim.classList.add('active');
      }, { passive: false });
      btnAim.addEventListener('touchend', function () {
        setMobileAim(false);
        btnAim.classList.remove('active');
      });
      btnAim.addEventListener('touchcancel', function () {
        setMobileAim(false);
        btnAim.classList.remove('active');
      });
    }

    // Reload button
    var btnReload = document.getElementById('btn-reload');
    if (btnReload) {
      btnReload.addEventListener('touchstart', function (e) {
        e.preventDefault();
        if (callbacks.onMobileReload) callbacks.onMobileReload();
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
          try { navigator.vibrate([10, 40, 10]); } catch (er) {}
        }
        btnReload.classList.add('active');
      }, { passive: false });
      btnReload.addEventListener('touchend', function () {
        btnReload.classList.remove('active');
      });
    }

    // Jump button
    var btnJump = document.getElementById('btn-jump');
    if (btnJump) {
      btnJump.addEventListener('touchstart', function (e) {
        e.preventDefault();
        touch.jumping = true;
        btnJump.classList.add('active');
      }, { passive: false });
      btnJump.addEventListener('touchend', function () {
        touch.jumping = false;
        btnJump.classList.remove('active');
      });
      btnJump.addEventListener('touchcancel', function () {
        touch.jumping = false;
        btnJump.classList.remove('active');
      });
    }

    // Sprint button (toggle)
    var btnSprint = document.getElementById('btn-sprint');
    if (btnSprint) {
      btnSprint.addEventListener('touchstart', function (e) {
        e.preventDefault();
        touch.sprinting = !touch.sprinting;
        btnSprint.classList.toggle('active', touch.sprinting);
      }, { passive: false });
    }

    // Weapon prev/next
    var btnPrev = document.getElementById('btn-weapon-prev');
    var btnNext = document.getElementById('btn-weapon-next');
    if (btnPrev) {
      btnPrev.addEventListener('touchstart', function (e) {
        e.preventDefault();
        if (callbacks.onMobileWeaponSwitch) callbacks.onMobileWeaponSwitch('prev');
        btnPrev.classList.add('active');
      }, { passive: false });
      btnPrev.addEventListener('touchend', function () {
        btnPrev.classList.remove('active');
      });
    }
    if (btnNext) {
      btnNext.addEventListener('touchstart', function (e) {
        e.preventDefault();
        if (callbacks.onMobileWeaponSwitch) callbacks.onMobileWeaponSwitch('next');
        btnNext.classList.add('active');
      }, { passive: false });
      btnNext.addEventListener('touchend', function () {
        btnNext.classList.remove('active');
      });
    }

    function bindTapButton(id, handler) {
      var btn = document.getElementById(id);
      if (!btn) return;
      btn.addEventListener('touchstart', function (e) {
        e.preventDefault();
        handler();
        btn.classList.add('active');
      }, { passive: false });
      btn.addEventListener('touchend', function () {
        btn.classList.remove('active');
      });
      btn.addEventListener('touchcancel', function () {
        btn.classList.remove('active');
      });
    }

    bindTapButton('btn-use', function () {
      if (callbacks.onMobileButton) callbacks.onMobileButton('use');
    });
    bindTapButton('btn-vehicle', function () {
      if (callbacks.onMobileButton) callbacks.onMobileButton('vehicle');
    });
    bindTapButton('btn-build', function () {
      if (callbacks.onMobileButton) callbacks.onMobileButton('build');
    });

    // Build-opt tap: select template directly on mobile
    document.querySelectorAll('.build-opt[data-template]').forEach(function (el) {
      el.addEventListener('click', function () {
        if (callbacks.onMobileButton) callbacks.onMobileButton('build-template', el.dataset.template);
      });
    });
    // Mobile: relabel build-opt key hints to bare names
    if (_isMobile) {
      var _bOpts = [
        ['barracks', 'Barracks'], ['factory', 'Factory'], ['turret', 'Turret'],
        ['droneHangar', 'Drone Hangar'], ['commandCenter', 'Command Center'], ['wall', 'Wall'], ['dugout', 'Dugout']
      ];
      _bOpts.forEach(function (pair) {
        var el = document.querySelector('.build-opt[data-template="' + pair[0] + '"]');
        if (el) el.textContent = pair[1];
      });
      var binfo = document.querySelector('#build-hud .build-info');
      if (binfo) binfo.textContent = 'TAP · Select | Fire · Place | 🔨 · Exit';
    }

    bindTapButton('btn-view', function () {
      if (callbacks.onMobileButton) callbacks.onMobileButton('view');
    });
    bindTapButton('btn-night', function () {
      tapVirtualKey('KeyL');
    });
    bindTapButton('btn-gyro', function () {
      toggleGyroAim();
    });
    bindTapButton('btn-inventory-mobile', function () {
      if (callbacks.onMobilePause) callbacks.onMobilePause();
    });
    bindTapButton('btn-crouch', function () {
      tapVirtualKey('KeyZ', 140);
    });
    bindTapButton('btn-melee', function () {
      if (callbacks.onMobileMelee) callbacks.onMobileMelee();
    });
    bindTapButton('btn-grenade', function () {
      if (callbacks.onMobileGrenade) callbacks.onMobileGrenade();
    });

    // Pause / inventory button
    var btnPause = document.getElementById('btn-pause');
    if (btnPause) {
      btnPause.addEventListener('touchstart', function (e) {
        e.preventDefault();
        if (callbacks.onMobilePause) callbacks.onMobilePause();
      }, { passive: false });
    }

    // Restore gyro preference
    try {
      if (typeof localStorage !== 'undefined' && localStorage.getItem('ok_gyro') === '1') {
        var DOE = window.DeviceOrientationEvent;
        if (!(DOE && typeof DOE.requestPermission === 'function')) {
          toggleGyroAim();
        }
      }
    } catch (_e) {}
  }

  /* ════════════════════════════════════════════════════════════════════ */
  /*  Init / Setup                                                      */
  /* ════════════════════════════════════════════════════════════════════ */

  function init() {
    // Discover renderer from global or DOM
    _renderer = (typeof window !== 'undefined' && window.__renderer) ? window.__renderer : null;
    if (!_renderer) {
      var canvas = document.querySelector('canvas');
      if (canvas) {
        // Try to find a renderer reference attached to the canvas
        // (some apps stash it on the element)
        _renderer = canvas.__renderer || null;
      }
    }

    document.addEventListener('keydown', _onKeyDown);
    document.addEventListener('keyup', _onKeyUp);
    document.addEventListener('mousedown', _onMouseDown);
    document.addEventListener('mouseup', _onMouseUp);
    document.addEventListener('mousemove', _onMouseMove);
    document.addEventListener('wheel', _onWheel, { passive: true });
    document.addEventListener('contextmenu', _onContextMenu);
    document.addEventListener('pointerlockchange', _onPointerLockChange);
    document.addEventListener('fullscreenchange', _onFullscreenChange);
    document.addEventListener('webkitfullscreenchange', _onWebkitFullscreenChange);
    document.addEventListener('visibilitychange', _onVisibilityChange);
    document.addEventListener('touchstart', _onTouchStartAudio, { passive: true });

    if (_isMobile) {
      _setupTouchLook();
      _setupMobileControls();
    }
  }

  /* ════════════════════════════════════════════════════════════════════ */
  /*  Public API                                                        */
  /* ════════════════════════════════════════════════════════════════════ */

  return {
    init: init,
    isKeyDown: function (code) { return !!keys[code]; },
    getKeyState: function () {
      var copy = {};
      for (var k in keys) copy[k] = keys[k];
      return copy;
    },
    isMouseDown: function () { return mouseDown; },
    isMouseNewPress: function () { return mouseNewPress; },
    getTouchState: function () {
      // Return a shallow copy so consumers can read but not mutate internals
      return {
        moveX: touch.moveX, moveY: touch.moveY,
        lookX: touch.lookX, lookY: touch.lookY,
        aimX: touch.aimX, aimY: touch.aimY,
        firing: touch.firing,
        jumping: touch.jumping,
        reloading: touch.reloading,
        sprinting: touch.sprinting,
        moveActive: touch.moveActive,
        lookActive: touch.lookActive,
        aimActive: touch.aimActive,
        moveTouchId: touch.moveTouchId,
        lookTouchId: touch.lookTouchId,
        aimTouchId: touch.aimTouchId,
        gyroEnabled: touch.gyroEnabled,
        gyroReady: touch.gyroReady,
        gyroDX: touch.gyroDX,
        gyroDY: touch.gyroDY,
        gyroSensitivity: touch.gyroSensitivity,
        gyroAutoAssist: touch.gyroAutoAssist,
      };
    },
    getMouseDelta: function () {
      var dx = _mouseDeltaX;
      var dy = _mouseDeltaY;
      _mouseDeltaX = 0;
      _mouseDeltaY = 0;
      return { x: dx, y: dy };
    },
    setupPointerLock: requestPointerLock,
    toggleGyro: toggleGyroAim,
    tapVirtualKey: tapVirtualKey,
    setMobileAim: setMobileAim,
    updateMobileVisibility: updateMobileControlsVisibility,
    syncTouchDriveKeys: syncTouchDriveKeys,

    // Callback setters for GameManager integration
    onKeyDown: function (cb) { callbacks.onKeyDown = cb; },
    onKeyUp: function (cb) { callbacks.onKeyUp = cb; },
    onMouseDown: function (cb) { callbacks.onMouseDown = cb; },
    onMouseUp: function (cb) { callbacks.onMouseUp = cb; },
    onMouseMove: function (cb) { callbacks.onMouseMove = cb; },
    onWheel: function (cb) { callbacks.onWheel = cb; },
    onTouchStart: function (cb) { callbacks.onTouchStart = cb; },
    onTouchMove: function (cb) { callbacks.onTouchMove = cb; },
    onTouchEnd: function (cb) { callbacks.onTouchEnd = cb; },
    onPointerLockChange: function (cb) { callbacks.onPointerLockChange = cb; },
    onVisibilityChange: function (cb) { callbacks.onVisibilityChange = cb; },
    onFullscreenChange: function (cb) { callbacks.onFullscreenChange = cb; },
    onContextMenu: function (cb) { callbacks.onContextMenu = cb; },
    onAudioResume: function (cb) { callbacks.onAudioResume = cb; },
    onMobileAim: function (cb) { callbacks.onMobileAim = cb; },
    onSyncTouchDrive: function (cb) { callbacks.onSyncTouchDrive = cb; },
    onMobileVisibilityCheck: function (cb) { callbacks.onMobileVisibilityCheck = cb; },
    onMobileButton: function (cb) { callbacks.onMobileButton = cb; },
    onMobileWeaponSwitch: function (cb) { callbacks.onMobileWeaponSwitch = cb; },
    onMobileReload: function (cb) { callbacks.onMobileReload = cb; },
    onMobilePause: function (cb) { callbacks.onMobilePause = cb; },
    onMobileGrenade: function (cb) { callbacks.onMobileGrenade = cb; },
    onMobileMelee: function (cb) { callbacks.onMobileMelee = cb; },
  };
})();
