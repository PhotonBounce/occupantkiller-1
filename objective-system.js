window.ObjectiveSystem = (function() {
  'use strict';

  var _scene = null;
  var _camera = null;
  var _objectives = [];
  var _activeObjective = null;
  var _completedCount = 0;
  var _failedCount = 0;
  var _hudEl = null;
  var _markerGroup = null;
  var _audioCtx = null;
  var _checkTimer = 0;

  var OBJ_TYPES = {
    ELIMINATE: 'ELIMINATE',
    DEFEND: 'DEFEND',
    CAPTURE: 'CAPTURE',
    REACH: 'REACH',
    SURVIVE: 'SURVIVE'
  };

  function _getAudioCtx() {
    if (!_audioCtx) {
      _audioCtx = window._audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    }
    return _audioCtx;
  }

  function _playComplete() {
    try {
      var ctx = _getAudioCtx();
      var freqs = [523, 659, 784, 1047];
      for (var i = 0; i < freqs.length; i++) {
        (function(freq, delay) {
          var osc = ctx.createOscillator();
          var gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.frequency.value = freq;
          osc.type = 'square';
          gain.gain.setValueAtTime(0.06, ctx.currentTime + delay);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.2);
          osc.start(ctx.currentTime + delay);
          osc.stop(ctx.currentTime + delay + 0.25);
        })(freqs[i], i * 0.12);
      }
    } catch(e) {}
  }

  function _playFail() {
    try {
      var ctx = _getAudioCtx();
      var osc = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 200;
      osc.frequency.linearRampToValueAtTime(80, ctx.currentTime + 0.6);
      osc.type = 'sawtooth';
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.7);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.7);
    } catch(e) {}
  }

  function _playNewObjective() {
    try {
      var ctx = _getAudioCtx();
      var osc = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 440;
      osc.frequency.linearRampToValueAtTime(880, ctx.currentTime + 0.15);
      osc.type = 'sine';
      gain.gain.setValueAtTime(0.07, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.3);
    } catch(e) {}
  }

  function _createHUD() {
    _hudEl = document.createElement('div');
    _hudEl.id = 'objective-hud';
    _hudEl.style.cssText = [
      'position:fixed', 'top:120px', 'right:20px', 'width:260px',
      'background:rgba(0,0,0,0.7)', 'border:1px solid #FFAA00',
      'border-left:4px solid #FFAA00', 'padding:8px 12px',
      'font-family:monospace', 'font-size:12px', 'color:#FFCC44',
      'z-index:900', 'display:none', 'pointer-events:none'
    ].join(';');
    document.body.appendChild(_hudEl);
  }

  function _updateHUD() {
    if (!_hudEl) return;
    if (!_activeObjective) {
      _hudEl.style.display = 'none';
      return;
    }
    _hudEl.style.display = 'block';
    var obj = _activeObjective;
    var typeColor = {
      ELIMINATE: '#FF4444', DEFEND: '#4488FF',
      CAPTURE: '#44FF88', REACH: '#FFFF44', SURVIVE: '#FF8844'
    };
    var col = typeColor[obj.type] || '#FFCC44';
    var progressText = '';
    if (obj.type === OBJ_TYPES.ELIMINATE) {
      progressText = ' (' + obj.killCount + '/' + obj.killTarget + ')';
    } else if (obj.type === OBJ_TYPES.SURVIVE) {
      progressText = ' (' + Math.ceil(obj.timeLeft) + 's)';
    } else if (obj.type === OBJ_TYPES.CAPTURE || obj.type === OBJ_TYPES.DEFEND) {
      var pct = Math.floor(obj.captureProgress * 100);
      progressText = ' [' + pct + '%]';
    } else if (obj.type === OBJ_TYPES.REACH) {
      var dist = obj.targetPos ? Math.floor(_distToTarget(obj.targetPos)) : '?';
      progressText = ' (' + dist + 'm away)';
    }
    _hudEl.innerHTML =
      '<div style="color:#AAA;font-size:10px;letter-spacing:2px">OBJECTIVE</div>' +
      '<div style="color:' + col + ';font-weight:bold;margin:2px 0">' + obj.type + progressText + '</div>' +
      '<div style="color:#DDD;font-size:11px">' + obj.description + '</div>' +
      (obj.timeLimit ? '<div style="color:#FF8844;font-size:11px;margin-top:4px">⏱ ' + Math.ceil(obj.timeLeft) + 's remaining</div>' : '');
  }

  function _createCaptureZone(pos, radius, color) {
    var geo = new THREE.CylinderGeometry(radius, radius, 0.1, 24);
    var mat = new THREE.MeshLambertMaterial({
      color: color, transparent: true, opacity: 0.35
    });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(pos.x, 0.1, pos.z);
    _scene.add(mesh);

    var ring = new THREE.Mesh(
      new THREE.TorusGeometry(radius, 0.12, 6, 24),
      new THREE.MeshLambertMaterial({ color: color })
    );
    ring.rotation.x = Math.PI / 2;
    ring.position.set(pos.x, 0.15, pos.z);
    _scene.add(ring);

    return { mesh: mesh, ring: ring, pulse: 0 };
  }

  function _destroyCaptureZone(zone) {
    if (!zone) return;
    if (zone.mesh) _scene.remove(zone.mesh);
    if (zone.ring) _scene.remove(zone.ring);
  }

  function _createWaypointMarker(pos) {
    if (!_markerGroup) {
      _markerGroup = new THREE.Group();
      _scene.add(_markerGroup);
    }
    var pillar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.06, 0.06, 3),
      new THREE.MeshLambertMaterial({ color: 0xFFAA00 })
    );
    pillar.position.set(pos.x, 1.5, pos.z);
    _markerGroup.add(pillar);

    var beacon = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.3),
      new THREE.MeshLambertMaterial({ color: 0xFFFF00, emissive: 0xFF8800 })
    );
    beacon.position.set(pos.x, 3.5, pos.z);
    _markerGroup.add(beacon);

    var light = new THREE.PointLight(0xFFAA00, 3, 10);
    light.position.set(pos.x, 3.5, pos.z);
    _markerGroup.add(light);

    return { pillar: pillar, beacon: beacon, light: light };
  }

  function _destroyWaypointMarker() {
    if (_markerGroup) {
      _scene.remove(_markerGroup);
      _markerGroup = null;
    }
  }

  function _distToTarget(pos) {
    var player = window.player || (window.GameManager && window.GameManager.getPlayer && window.GameManager.getPlayer());
    if (!player || !player.position) return 9999;
    var dx = (player.position.x || 0) - pos.x;
    var dz = (player.position.z || 0) - pos.z;
    return Math.sqrt(dx * dx + dz * dz);
  }

  function _completeObjective() {
    if (!_activeObjective) return;
    _completedCount++;
    _playComplete();
    if (window.HUD && window.HUD.showToast) {
      window.HUD.showToast('OBJECTIVE COMPLETE! +' + _activeObjective.reward);
    }
    var player = window.player || (window.GameManager && window.GameManager.getPlayer && window.GameManager.getPlayer());
    if (player && player.score !== undefined) {
      player.score += _activeObjective.reward;
      if (window.HUD && window.HUD.setScore) window.HUD.setScore(player.score);
    }
    if (_activeObjective.zone) _destroyCaptureZone(_activeObjective.zone);
    _destroyWaypointMarker();
    _activeObjective = null;
    setTimeout(function() { _pickNextObjective(); }, 8000);
  }

  function _failObjective() {
    if (!_activeObjective) return;
    _failedCount++;
    _playFail();
    if (window.HUD && window.HUD.showToast) {
      window.HUD.showToast('OBJECTIVE FAILED');
    }
    if (_activeObjective.zone) _destroyCaptureZone(_activeObjective.zone);
    _destroyWaypointMarker();
    _activeObjective = null;
    setTimeout(function() { _pickNextObjective(); }, 12000);
  }

  function _pickNextObjective() {
    var wave = (window.GameManager && window.GameManager.getCurrentWave) ?
      window.GameManager.getCurrentWave() : (window._waveNum || 1);

    var types = [OBJ_TYPES.ELIMINATE, OBJ_TYPES.SURVIVE, OBJ_TYPES.REACH];
    if (wave >= 4) types.push(OBJ_TYPES.CAPTURE);
    if (wave >= 6) types.push(OBJ_TYPES.DEFEND);

    var type = types[Math.floor(Math.random() * types.length)];
    var obj = {
      type: type,
      killCount: 0,
      killTarget: 0,
      timeLeft: 0,
      timeLimit: 0,
      captureProgress: 0,
      targetPos: null,
      zone: null,
      marker: null,
      reward: 0,
      description: ''
    };

    if (type === OBJ_TYPES.ELIMINATE) {
      obj.killTarget = 3 + Math.floor(wave / 3);
      obj.timeLimit = 60 + wave * 5;
      obj.timeLeft = obj.timeLimit;
      obj.reward = 300 + wave * 50;
      obj.description = 'Eliminate ' + obj.killTarget + ' enemies';
    } else if (type === OBJ_TYPES.SURVIVE) {
      obj.timeLeft = 20 + wave * 3;
      obj.timeLimit = obj.timeLeft;
      obj.reward = 200 + wave * 30;
      obj.description = 'Survive under fire for ' + Math.ceil(obj.timeLeft) + 's';
    } else if (type === OBJ_TYPES.CAPTURE) {
      obj.targetPos = { x: (Math.random() - 0.5) * 40, z: (Math.random() - 0.5) * 40 };
      obj.timeLimit = 90;
      obj.timeLeft = 90;
      obj.captureProgress = 0;
      obj.zone = _createCaptureZone(obj.targetPos, 4, 0x44FF88);
      obj.marker = _createWaypointMarker(obj.targetPos);
      obj.reward = 400 + wave * 40;
      obj.description = 'Capture the marked position';
    } else if (type === OBJ_TYPES.DEFEND) {
      obj.targetPos = { x: (Math.random() - 0.5) * 20, z: (Math.random() - 0.5) * 20 };
      obj.timeLimit = 45 + wave * 2;
      obj.timeLeft = obj.timeLimit;
      obj.captureProgress = 1;
      obj.zone = _createCaptureZone(obj.targetPos, 5, 0x4488FF);
      obj.marker = _createWaypointMarker(obj.targetPos);
      obj.reward = 500 + wave * 60;
      obj.description = 'Defend the marked area';
    } else if (type === OBJ_TYPES.REACH) {
      obj.targetPos = { x: (Math.random() - 0.5) * 60, z: (Math.random() - 0.5) * 60 };
      obj.timeLimit = 30 + wave * 4;
      obj.timeLeft = obj.timeLimit;
      obj.marker = _createWaypointMarker(obj.targetPos);
      obj.reward = 250 + wave * 35;
      obj.description = 'Reach the marked waypoint';
    }

    _activeObjective = obj;
    _playNewObjective();
    if (window.HUD && window.HUD.showToast) {
      window.HUD.showToast('NEW OBJECTIVE: ' + type);
    }
  }

  function _hookKillEvents() {
    var prev = window._onEnemyKilled;
    window._onEnemyKilled = function(enemy) {
      if (prev) prev(enemy);
      if (_activeObjective && _activeObjective.type === OBJ_TYPES.ELIMINATE) {
        _activeObjective.killCount++;
        if (_activeObjective.killCount >= _activeObjective.killTarget) {
          _completeObjective();
        }
      }
    };
  }

  function init(scene, camera) {
    _scene = scene || window._gameScene;
    _camera = camera || window._camera;
    _createHUD();
    _hookKillEvents();
    _objectives = [];
    _activeObjective = null;
    _completedCount = 0;
    _failedCount = 0;
    setTimeout(function() { _pickNextObjective(); }, 15000);
  }

  function update(dt) {
    if (!_activeObjective) return;
    var obj = _activeObjective;

    if (obj.timeLimit > 0) {
      obj.timeLeft -= dt;
      if (obj.timeLeft <= 0) {
        if (obj.type !== OBJ_TYPES.CAPTURE || obj.captureProgress < 1) {
          _failObjective();
          return;
        }
      }
    }

    var player = window.player || (window.GameManager && window.GameManager.getPlayer && window.GameManager.getPlayer());
    var px = player && player.position ? (player.position.x || 0) : 0;
    var pz = player && player.position ? (player.position.z || 0) : 0;

    if (obj.type === OBJ_TYPES.CAPTURE && obj.targetPos) {
      var dx = px - obj.targetPos.x;
      var dz = pz - obj.targetPos.z;
      var dist = Math.sqrt(dx * dx + dz * dz);
      if (dist < 4) {
        obj.captureProgress = Math.min(1, obj.captureProgress + dt / 6);
        if (obj.zone && obj.zone.mesh) {
          obj.zone.mesh.material.color.setHex(0xFFFF00);
        }
        if (obj.captureProgress >= 1) {
          _completeObjective();
          return;
        }
      }
    }

    if (obj.type === OBJ_TYPES.DEFEND && obj.targetPos) {
      var ddx = px - obj.targetPos.x;
      var ddz = pz - obj.targetPos.z;
      var ddist = Math.sqrt(ddx * ddx + ddz * ddz);
      if (ddist > 5) {
        obj.captureProgress = Math.max(0, obj.captureProgress - dt / 4);
        if (obj.captureProgress <= 0) {
          _failObjective();
          return;
        }
      }
      if (obj.zone && obj.zone.mesh) {
        var hue = obj.captureProgress;
        obj.zone.mesh.material.color.setHSL(0.6 * hue, 1, 0.5);
      }
      if (obj.timeLeft <= 0) {
        _completeObjective();
        return;
      }
    }

    if (obj.type === OBJ_TYPES.REACH && obj.targetPos) {
      var rdx = px - obj.targetPos.x;
      var rdz = pz - obj.targetPos.z;
      if (Math.sqrt(rdx * rdx + rdz * rdz) < 3) {
        _completeObjective();
        return;
      }
    }

    if (obj.type === OBJ_TYPES.SURVIVE) {
      if (obj.timeLeft <= 0) {
        _completeObjective();
        return;
      }
    }

    if (_markerGroup) {
      _markerGroup.children.forEach(function(child) {
        if (child.isOctahedron || child.geometry instanceof THREE.OctahedronGeometry) {
          child.rotation.y += 1.5 * dt;
        }
      });
      var pulse = Math.sin(Date.now() * 0.004);
      _markerGroup.children.forEach(function(child) {
        if (child.isPointLight || child.type === 'PointLight') {
          child.intensity = 2 + pulse;
        }
      });
    }

    _checkTimer -= dt;
    if (_checkTimer <= 0) {
      _checkTimer = 0.5;
      _updateHUD();
    }
  }

  function triggerObjective(type, config) {
    if (_activeObjective) {
      if (_activeObjective.zone) _destroyCaptureZone(_activeObjective.zone);
      _destroyWaypointMarker();
    }
    _activeObjective = null;
    _pickNextObjective();
  }

  function reset() {
    if (_activeObjective && _activeObjective.zone) {
      _destroyCaptureZone(_activeObjective.zone);
    }
    _destroyWaypointMarker();
    _activeObjective = null;
    _objectives = [];
    _completedCount = 0;
    _failedCount = 0;
    if (_hudEl) _hudEl.style.display = 'none';
  }

  return { init: init, update: update, triggerObjective: triggerObjective, reset: reset };
})();
