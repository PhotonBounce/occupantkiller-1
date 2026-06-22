/* ════════════════════════════════════════════════════════════════════
 *  ENEMY SNIPER SYSTEM
 *  ─────────────────────────────────────────────────────────────────
 *  Camouflaged ghillie-suit sniper that picks off the player from
 *  long range. Stationary, waits for line-of-sight, laser-dot
 *  warning, then fires for heavy damage. Repositions after 3 shots.
 *
 *  Public API:
 *    EnemySniper.init(scene, camera)  — call once after scene exists
 *    EnemySniper.update(delta)        — per-frame (seconds)
 *    EnemySniper.spawn()              — force-spawn a sniper
 *    EnemySniper.reset()              — clear all snipers
 *    EnemySniper.takeDamage(sniper, dmg) — deal damage to a sniper
 * ═════════════════════════════════════════════════════════════════ */
window.EnemySniper = (function () {
  'use strict';

  var _scene  = null;
  var _camera = null;

  /* ── Config ── */
  var MAX_SNIPERS    = 2;
  var SNIPER_HP      = 60;
  var SHOT_DAMAGE    = 55;
  var LOS_WAIT_S     = 2.0;   // seconds in LOS before shooting
  var LASER_WARN_S   = 0.5;   // laser dot visible before shot
  var RELOAD_S       = 4.0;   // seconds between shots
  var SHOTS_BEFORE_REPOSITION = 3;
  var SCORE_VALUE    = 400;
  var GHILLIE_COLOR  = 0x2D4A1A;
  var BODY_COLOR     = 0x3A5A2A;

  /* ── Active snipers list ── */
  var _snipers = [];

  /* ── Raycaster for LOS ── */
  var _raycaster = null;

  /* ══════════════════════════════════════════════════
   *  INIT
   * ══════════════════════════════════════════════════ */
  function init(scene, camera) {
    _scene  = scene  || window._gameScene;
    _camera = camera || window._camera;
    _snipers = [];
    window._sniperActive = false;

    if (typeof THREE !== 'undefined') {
      _raycaster = new THREE.Raycaster();
    }
  }

  /* ══════════════════════════════════════════════════
   *  BUILD GHILLIE MESH
   * ══════════════════════════════════════════════════ */
  function _buildMesh() {
    var group = new THREE.Group();

    /* body */
    var bodyGeo = new THREE.BoxGeometry(0.5, 1.0, 0.35);
    var bodyMat = new THREE.MeshLambertMaterial({ color: BODY_COLOR, transparent: true, opacity: 0.3 });
    var body    = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 0.5;
    group.add(body);

    /* head */
    var headGeo = new THREE.BoxGeometry(0.28, 0.28, 0.28);
    var headMat = new THREE.MeshLambertMaterial({ color: BODY_COLOR, transparent: true, opacity: 0.3 });
    var head    = new THREE.Mesh(headGeo, headMat);
    head.position.y = 1.14;
    group.add(head);

    /* ghillie fragments — 5 PlaneGeometry(0.2, 0.35) at random rotations */
    var ghillieMat = new THREE.MeshLambertMaterial({
      color: GHILLIE_COLOR,
      transparent: true,
      opacity: 0.3,
      side: THREE.DoubleSide
    });

    for (var i = 0; i < 5; i++) {
      var fragGeo = new THREE.PlaneGeometry(0.2, 0.35);
      var frag    = new THREE.Mesh(fragGeo, ghillieMat.clone());
      /* distribute around body */
      frag.position.set(
        (Math.random() - 0.5) * 0.55,
        0.3 + Math.random() * 0.7,
        (Math.random() - 0.5) * 0.40
      );
      frag.rotation.set(
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI * 2
      );
      group.add(frag);
    }

    /* store material refs for opacity changes */
    group.userData.materials = [];
    group.traverse(function (obj) {
      if (obj.isMesh && obj.material) {
        group.userData.materials.push(obj.material);
      }
    });

    return group;
  }

  /* ══════════════════════════════════════════════════
   *  SPAWN
   * ══════════════════════════════════════════════════ */
  function spawn() {
    if (!_scene) return;
    if (_snipers.length >= MAX_SNIPERS) return;

    var playerPos = _getPlayerPos();
    if (!playerPos) return;

    var angle = Math.random() * Math.PI * 2;
    var dist  = 25 + Math.random() * 15;   /* 25-40 units */
    var px    = playerPos.x + Math.cos(angle) * dist;
    var pz    = playerPos.z + Math.sin(angle) * dist;
    var py    = 2 + Math.random() * 2;     /* Y = 2-4 */

    var mesh = _buildMesh();
    mesh.position.set(px, py, pz);
    /* face toward player */
    mesh.lookAt(playerPos.x, py, playerPos.z);
    _scene.add(mesh);

    var sniper = {
      mesh:        mesh,
      hp:          SNIPER_HP,
      alive:       true,
      state:       'idle',   /* idle | aiming | laser | firing | reload | repositioning */
      losTimer:    0,        /* time player has been in LOS */
      reloadTimer: 0,
      shotsFired:  0,
      laserTimer:  0,
      laserLight:  null,
      tracerLine:  null,
      tracerTimer: 0,
    };

    _snipers.push(sniper);
    _updateSniperActiveFlag();
  }

  /* ══════════════════════════════════════════════════
   *  UPDATE — called every frame
   * ══════════════════════════════════════════════════ */
  function update(delta) {
    if (!_scene) return;

    for (var i = _snipers.length - 1; i >= 0; i--) {
      var s = _snipers[i];
      if (!s.alive) {
        _snipers.splice(i, 1);
        continue;
      }
      _updateSniper(s, delta);
    }

    _updateSniperActiveFlag();
  }

  function _updateSniper(s, delta) {
    var playerPos = _getPlayerPos();

    /* ── tracer fade ── */
    if (s.tracerLine && s.tracerTimer > 0) {
      s.tracerTimer -= delta;
      if (s.tracerTimer <= 0) {
        _scene.remove(s.tracerLine);
        s.tracerLine.geometry.dispose();
        s.tracerLine.material.dispose();
        s.tracerLine = null;
      }
    }

    if (!playerPos) return;

    /* ── face player ── */
    s.mesh.lookAt(playerPos.x, s.mesh.position.y, playerPos.z);

    if (s.state === 'idle') {
      /* check LOS every frame */
      if (_hasLOS(s.mesh.position, playerPos)) {
        s.losTimer += delta;
        if (s.losTimer >= LOS_WAIT_S) {
          s.state    = 'laser';
          s.losTimer = 0;
          _showLaserDot(s, playerPos);
          s.laserTimer = LASER_WARN_S;
          _setCamouflage(s, false); /* reveal slightly when aiming */
        }
      } else {
        s.losTimer = 0;
        _setCamouflage(s, true);
      }

    } else if (s.state === 'laser') {
      s.laserTimer -= delta;
      /* keep laser dot on player */
      if (s.laserLight) {
        s.laserLight.position.copy(playerPos);
        s.laserLight.position.y += 1.0;
      }
      if (s.laserTimer <= 0) {
        _removeLaserDot(s);
        _fireShot(s, playerPos);
      }

    } else if (s.state === 'reload') {
      s.reloadTimer -= delta;
      if (s.reloadTimer <= 0) {
        /* check if still has LOS */
        if (_hasLOS(s.mesh.position, playerPos)) {
          s.state      = 'laser';
          s.laserTimer = LASER_WARN_S;
          _showLaserDot(s, playerPos);
        } else {
          s.state    = 'idle';
          s.losTimer = 0;
          _setCamouflage(s, true);
        }
      }
    } else if (s.state === 'repositioning') {
      /* instant reposition — already done in _reposition(), just set idle */
      s.state    = 'idle';
      s.losTimer = 0;
      _setCamouflage(s, true);
    }
  }

  /* ══════════════════════════════════════════════════
   *  FIRE SHOT
   * ══════════════════════════════════════════════════ */
  function _fireShot(s, playerPos) {
    s.state      = 'reload';
    s.reloadTimer = RELOAD_S;
    s.shotsFired++;

    /* damage player */
    if (window.player && window.player.health !== undefined) {
      window.player.health -= SHOT_DAMAGE;
    }

    /* camera shake */
    if (_camera) {
      _camera.position.x += (Math.random() - 0.5) * 0.2;
      _camera.position.y += (Math.random() - 0.5) * 0.2;
    }

    /* tracer line VFX */
    _showTracer(s, playerPos);

    /* sound */
    _playSniperCrack();

    /* camouflage back on after firing */
    _setCamouflage(s, true);

    /* reposition after N shots */
    if (s.shotsFired >= SHOTS_BEFORE_REPOSITION) {
      s.shotsFired = 0;
      _reposition(s, playerPos);
    }
  }

  /* ══════════════════════════════════════════════════
   *  TRACER LINE
   * ══════════════════════════════════════════════════ */
  function _showTracer(s, playerPos) {
    if (!_scene) return;
    if (s.tracerLine) {
      _scene.remove(s.tracerLine);
      s.tracerLine.geometry.dispose();
      s.tracerLine.material.dispose();
      s.tracerLine = null;
    }

    var points = [
      s.mesh.position.clone(),
      new THREE.Vector3(playerPos.x, playerPos.y + 1.0, playerPos.z)
    ];
    var geo = new THREE.BufferGeometry().setFromPoints(points);
    var mat = new THREE.LineBasicMaterial({ color: 0xFFFF00, linewidth: 2 });
    var line = new THREE.Line(geo, mat);
    _scene.add(line);
    s.tracerLine  = line;
    s.tracerTimer = 0.2;
  }

  /* ══════════════════════════════════════════════════
   *  LASER DOT
   * ══════════════════════════════════════════════════ */
  function _showLaserDot(s, playerPos) {
    if (!_scene) return;
    _removeLaserDot(s);
    var light = new THREE.PointLight(0xFF0000, 3, 1);
    light.position.set(playerPos.x, playerPos.y + 1.2, playerPos.z);
    _scene.add(light);
    s.laserLight = light;
  }

  function _removeLaserDot(s) {
    if (s.laserLight && _scene) {
      _scene.remove(s.laserLight);
      s.laserLight = null;
    }
  }

  /* ══════════════════════════════════════════════════
   *  CAMOUFLAGE OPACITY
   * ══════════════════════════════════════════════════ */
  function _setCamouflage(s, camouflaged) {
    var opacity = camouflaged ? 0.3 : 0.85;
    var mats = s.mesh.userData.materials || [];
    for (var i = 0; i < mats.length; i++) {
      mats[i].opacity = opacity;
    }
  }

  /* ══════════════════════════════════════════════════
   *  LINE-OF-SIGHT CHECK
   * ══════════════════════════════════════════════════ */
  function _hasLOS(fromPos, toPos) {
    if (!_raycaster || !_scene) return true; /* assume LOS if no raycaster */

    var dir = new THREE.Vector3(
      toPos.x - fromPos.x,
      (toPos.y + 1.0) - fromPos.y,
      toPos.z - fromPos.z
    );
    var dist = dir.length();
    if (dist < 1) return true;
    dir.normalize();

    _raycaster.set(fromPos, dir);
    _raycaster.far = dist - 0.5;

    /* collect scene objects that may block LOS (exclude sniper meshes) */
    var obstacles = [];
    _scene.traverse(function (obj) {
      if (obj.isMesh) {
        var isSniperMesh = false;
        for (var i = 0; i < _snipers.length; i++) {
          if (_snipers[i].mesh === obj || _snipers[i].mesh === obj.parent) {
            isSniperMesh = true;
            break;
          }
        }
        if (!isSniperMesh) {
          obstacles.push(obj);
        }
      }
    });

    var hits = _raycaster.intersectObjects(obstacles, false);
    return hits.length === 0;
  }

  /* ══════════════════════════════════════════════════
   *  REPOSITION
   * ══════════════════════════════════════════════════ */
  function _reposition(s, playerPos) {
    var angle = Math.random() * Math.PI * 2;
    var dist  = 20 + Math.random() * 20;  /* 20-40 units */
    var nx    = playerPos.x + Math.cos(angle) * dist;
    var nz    = playerPos.z + Math.sin(angle) * dist;
    var ny    = 2 + Math.random() * 2;

    s.mesh.position.set(nx, ny, nz);
    s.state = 'repositioning';
    _setCamouflage(s, true);
  }

  /* ══════════════════════════════════════════════════
   *  TAKE DAMAGE — public
   * ══════════════════════════════════════════════════ */
  function takeDamage(sniper, dmg) {
    if (!sniper || !sniper.alive) return;
    sniper.hp -= dmg;
    if (sniper.hp <= 0) {
      _killSniper(sniper);
    }
  }

  /* ══════════════════════════════════════════════════
   *  KILL SNIPER
   * ══════════════════════════════════════════════════ */
  function _killSniper(s) {
    s.alive = false;
    _removeLaserDot(s);

    /* remove tracer if visible */
    if (s.tracerLine && _scene) {
      _scene.remove(s.tracerLine);
      s.tracerLine.geometry.dispose();
      s.tracerLine.material.dispose();
      s.tracerLine = null;
    }

    /* remove mesh */
    if (_scene && s.mesh) {
      _scene.remove(s.mesh);
      s.mesh.traverse(function (obj) {
        if (obj.isMesh) {
          if (obj.geometry) obj.geometry.dispose();
          if (obj.material) obj.material.dispose();
        }
      });
    }

    /* score */
    if (window.player && window.player.score !== undefined) {
      window.player.score += SCORE_VALUE;
    }

    /* toast */
    if (window.HUD && window.HUD.showToast) {
      window.HUD.showToast('ENEMY SNIPER NEUTRALIZED');
    }

    /* rifle pickup */
    _spawnRiflePickup(s.mesh ? s.mesh.position : null);

    _updateSniperActiveFlag();
  }

  /* ══════════════════════════════════════════════════
   *  RIFLE PICKUP
   * ══════════════════════════════════════════════════ */
  function _spawnRiflePickup(pos) {
    if (!pos || !_scene) return;
    try {
      if (window.Pickups && window.Pickups.spawnAt) {
        window.Pickups.spawnAt('rifle', pos.x, pos.y, pos.z);
        return;
      }
      /* fallback: simple visible marker */
      var geo = new THREE.BoxGeometry(0.15, 0.6, 0.06);
      var mat = new THREE.MeshLambertMaterial({ color: 0x8B6914 });
      var mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(pos.x, pos.y, pos.z);
      _scene.add(mesh);
      /* auto-remove after 30s */
      setTimeout(function () {
        if (_scene) {
          _scene.remove(mesh);
          geo.dispose();
          mat.dispose();
        }
      }, 30000);
    } catch (e) {
      /* silent — pickup is cosmetic */
    }
  }

  /* ══════════════════════════════════════════════════
   *  SOUND — sniper crack + echo
   * ══════════════════════════════════════════════════ */
  function _playSniperCrack() {
    try {
      var ctx = window._audioCtx || new (window.AudioContext || window.webkitAudioContext)();
      if (!window._audioCtx) window._audioCtx = ctx;

      var now = ctx.currentTime;

      /* ── crack: short sharp oscillator burst ── */
      var crackOsc  = ctx.createOscillator();
      var crackGain = ctx.createGain();
      crackOsc.type = 'sawtooth';
      crackOsc.frequency.setValueAtTime(1800, now);
      crackOsc.frequency.exponentialRampToValueAtTime(200, now + 0.06);
      crackGain.gain.setValueAtTime(1.0, now);
      crackGain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
      crackOsc.connect(crackGain);
      crackGain.connect(ctx.destination);
      crackOsc.start(now);
      crackOsc.stop(now + 0.08);

      /* ── noise burst ── */
      var bufLen = ctx.sampleRate * 0.12;
      var buf    = ctx.createBuffer(1, bufLen, ctx.sampleRate);
      var data   = buf.getChannelData(0);
      for (var i = 0; i < bufLen; i++) {
        data[i] = (Math.random() * 2 - 1) * (1 - i / bufLen);
      }
      var noiseNode  = ctx.createBufferSource();
      var noiseGain  = ctx.createGain();
      noiseNode.buffer = buf;
      noiseGain.gain.setValueAtTime(0.7, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
      noiseNode.connect(noiseGain);
      noiseGain.connect(ctx.destination);
      noiseNode.start(now);

      /* ── echo / reverb (simple delay) ── */
      var delay     = ctx.createDelay(2.0);
      var echoGain  = ctx.createGain();
      delay.delayTime.value = 0.35;
      echoGain.gain.setValueAtTime(0.3, now);
      echoGain.gain.exponentialRampToValueAtTime(0.001, now + 1.4);
      crackGain.connect(delay);
      delay.connect(echoGain);
      echoGain.connect(ctx.destination);

    } catch (e) {
      /* audio not available — silent */
    }
  }

  /* ══════════════════════════════════════════════════
   *  HELPERS
   * ══════════════════════════════════════════════════ */
  function _getPlayerPos() {
    if (window.player && window.player.position) {
      return window.player.position;
    }
    if (_camera) {
      return _camera.position;
    }
    return null;
  }

  function _updateSniperActiveFlag() {
    var anyAlive = false;
    for (var i = 0; i < _snipers.length; i++) {
      if (_snipers[i].alive) { anyAlive = true; break; }
    }
    window._sniperActive = anyAlive;
  }

  /* ══════════════════════════════════════════════════
   *  RESET
   * ══════════════════════════════════════════════════ */
  function reset() {
    for (var i = 0; i < _snipers.length; i++) {
      var s = _snipers[i];
      _removeLaserDot(s);
      if (s.tracerLine && _scene) {
        _scene.remove(s.tracerLine);
        if (s.tracerLine.geometry) s.tracerLine.geometry.dispose();
        if (s.tracerLine.material) s.tracerLine.material.dispose();
        s.tracerLine = null;
      }
      if (_scene && s.mesh) {
        _scene.remove(s.mesh);
        s.mesh.traverse(function (obj) {
          if (obj.isMesh) {
            if (obj.geometry) obj.geometry.dispose();
            if (obj.material) obj.material.dispose();
          }
        });
      }
    }
    _snipers = [];
    window._sniperActive = false;
  }

  /* ── public API ── */
  return {
    init:       init,
    update:     update,
    spawn:      spawn,
    reset:      reset,
    takeDamage: takeDamage
  };

})();
