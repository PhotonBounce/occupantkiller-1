/* ───────────────────────────────────────────────────────────────────────────
   landslide-event.js — Terrain collapse events, avalanches, and
   environmental destruction chains for the FPS game engine.

   Trigger mechanic : explosions > 60 damage in 3s at same location
   Intentional      : fire into cliff face 5+ times
   Chain reaction   : 30% chance each adjacent cliff within 20 units
   Snow avalanche   : level index > 15 → instant kill, doubled width
   Flood variant    : water zone within 30 units → river blocked, tide rises
   Public API       : { init(scene, camera), update(delta),
                        triggerLandslide(x, z, direction),
                        getLandslideZones(), reset() }
   ─────────────────────────────────────────────────────────────────────────── */
window.LandslideEvent = (function () {
  'use strict';

  /* ── constants ─────────────────────────────────────────────────────────── */
  var CHUNK_COUNT          = 40;
  var CHUNK_MIN_SPEED      = 8;
  var CHUNK_MAX_SPEED      = 15;
  var CHUNK_FRICTION       = 0.98;
  var CHUNK_DAMAGE         = 50;
  var WARNING_DURATION     = 3;        // seconds before full slide
  var EXPLOSION_WINDOW     = 3;        // seconds for accumulation
  var EXPLOSION_THRESHOLD  = 60;       // damage in window
  var CLIFF_SHOT_TRIGGER   = 5;        // shots into cliff face
  var CHAIN_CHANCE         = 0.30;     // 30% chance of chain
  var CHAIN_RANGE          = 20;       // units
  var PEBBLE_COUNT         = 12;
  var SLIDE_WIDTH          = 40;       // normal width in units
  var AVALANCHE_WIDTH      = 80;       // snow avalanche doubled width
  var HIGH_ALT_LEVEL       = 15;       // level index threshold
  var FLOOD_WATER_RANGE    = 30;       // units to check for water zone
  var FLOOD_RISE           = 3;        // units water rises upstream
  var DEBRIS_FIELD_Y       = 0.25;     // half-height of flat debris pile

  /* ── state ─────────────────────────────────────────────────────────────── */
  var _scene    = null;
  var _camera   = null;
  var _audioCtx = null;

  /* explosion accumulation — tracks recent explosions per grid cell */
  var _explosionMap  = {};   // key → { damage, timer }

  /* cliff structures */
  var _cliffs = [];          /* { mesh, x, z, shotCount, riskTimer,
                                   pebbles[], warned, direction } */

  /* active landslides */
  var _slides = [];          /* { x, z, direction, width, chunks[],
                                   isAvalanche, active, fieldMesh } */

  /* warning HUD element */
  var _warningEl    = null;
  var _warningBlink = 0;
  var _warningVisible = false;

  /* ── helpers ───────────────────────────────────────────────────────────── */
  function _getAudioCtx() {
    if (!_audioCtx) {
      try {
        _audioCtx = window._audioCtx ||
          new (window.AudioContext || window.webkitAudioContext)();
      } catch (e) {}
    }
    return _audioCtx;
  }

  function _gridKey(x, z) {
    return (Math.round(x / 8) * 1000 + Math.round(z / 8)).toString();
  }

  function _dist2D(ax, az, bx, bz) {
    var dx = ax - bx;
    var dz = az - bz;
    return Math.sqrt(dx * dx + dz * dz);
  }

  function _getLevelIndex() {
    /* check common globals the game exposes */
    if (typeof window.currentWave === 'number') return window.currentWave;
    if (window.GameManager && typeof window.GameManager.getWave === 'function') {
      return window.GameManager.getWave();
    }
    return 0;
  }

  function _isHighAltitude() {
    return _getLevelIndex() > HIGH_ALT_LEVEL;
  }

  /* ── audio ─────────────────────────────────────────────────────────────── */
  function _playRumble(isAvalanche) {
    try {
      var ctx = _getAudioCtx();
      if (!ctx) return;

      /* oscillator sweep 80 Hz → 150 Hz over 2 s */
      var osc = ctx.createOscillator();
      var oscGain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(80, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(150, ctx.currentTime + 2);
      oscGain.gain.setValueAtTime(0.25, ctx.currentTime);
      oscGain.gain.linearRampToValueAtTime(0, ctx.currentTime + 2.5);
      osc.connect(oscGain);
      oscGain.connect(ctx.destination);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 2.5);

      /* broad noise burst */
      var bufLen = Math.floor(ctx.sampleRate * 2);
      var noiseBuf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
      var data = noiseBuf.getChannelData(0);
      for (var i = 0; i < bufLen; i++) {
        data[i] = (Math.random() * 2 - 1) *
                  Math.min(1, i / (ctx.sampleRate * 0.1)) *
                  (1 - i / bufLen);
      }
      var noiseFilter = ctx.createBiquadFilter();
      noiseFilter.type = 'lowpass';
      noiseFilter.frequency.value = isAvalanche ? 400 : 200;
      var noiseSrc = ctx.createBufferSource();
      noiseSrc.buffer = noiseBuf;
      var noiseGain = ctx.createGain();
      noiseGain.gain.value = isAvalanche ? 0.6 : 0.45;
      noiseSrc.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(ctx.destination);
      noiseSrc.start(ctx.currentTime + 2);
    } catch (e) {}
  }

  function _playWarningTick() {
    try {
      var ctx = _getAudioCtx();
      if (!ctx) return;
      var osc = ctx.createOscillator();
      var g = ctx.createGain();
      osc.frequency.value = 220;
      g.gain.setValueAtTime(0.15, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
      osc.connect(g);
      g.connect(ctx.destination);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.13);
    } catch (e) {}
  }

  /* ── HUD warning ───────────────────────────────────────────────────────── */
  function _createWarningEl() {
    if (_warningEl) return;
    _warningEl = document.createElement('div');
    _warningEl.style.cssText = [
      'position:fixed',
      'top:18%',
      'left:50%',
      'transform:translateX(-50%)',
      'color:#ff8800',
      'font-size:22px',
      'font-weight:bold',
      'font-family:monospace',
      'letter-spacing:3px',
      'text-shadow:0 0 8px #ff4400',
      'pointer-events:none',
      'z-index:9999',
      'display:none'
    ].join(';');
    _warningEl.textContent = 'LANDSLIDE RISK';
    document.body.appendChild(_warningEl);
  }

  function _showWarning() {
    if (!_warningEl) _createWarningEl();
    _warningVisible = true;
    _warningEl.style.display = 'block';
  }

  function _hideWarning() {
    _warningVisible = false;
    if (_warningEl) _warningEl.style.display = 'none';
  }

  function _updateWarningBlink(delta) {
    if (!_warningVisible || !_warningEl) return;
    _warningBlink += delta * 4;
    var alpha = 0.5 + 0.5 * Math.sin(_warningBlink * Math.PI);
    _warningEl.style.opacity = String(alpha);
  }

  /* ── pebbles (warning particles) ──────────────────────────────────────── */
  function _spawnPebbles(cliff, isAvalanche) {
    var pebbleColor = isAvalanche ? 0xffffff : 0x888888;
    for (var i = 0; i < PEBBLE_COUNT; i++) {
      var r = 0.05 + Math.random() * 0.1;
      var geo = new THREE.SphereGeometry(r, 4, 4);
      var mat = new THREE.MeshLambertMaterial({ color: pebbleColor });
      var mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(
        cliff.x + (Math.random() - 0.5) * 6,
        3 + Math.random() * 5,
        cliff.z + (Math.random() - 0.5) * 6
      );
      _scene.add(mesh);
      cliff.pebbles.push({
        mesh: mesh,
        vel: { x: (Math.random() - 0.5) * 1.5, y: -0.5 - Math.random() * 1, z: (Math.random() - 0.5) * 1.5 },
        life: WARNING_DURATION + Math.random()
      });
    }
  }

  function _updatePebbles(cliff, delta) {
    for (var i = cliff.pebbles.length - 1; i >= 0; i--) {
      var p = cliff.pebbles[i];
      p.vel.y -= 9.8 * delta;
      p.mesh.position.x += p.vel.x * delta;
      p.mesh.position.y += p.vel.y * delta;
      p.mesh.position.z += p.vel.z * delta;
      p.life -= delta;
      if (p.mesh.position.y <= 0 || p.life <= 0) {
        _scene.remove(p.mesh);
        cliff.pebbles.splice(i, 1);
      }
    }
  }

  /* ── cliff geometry ────────────────────────────────────────────────────── */
  function _spawnCliff(x, z, direction) {
    var w = 4 + Math.random() * 4;
    var h = 12 + Math.random() * 8;
    var d = 3 + Math.random() * 3;
    var geo = new THREE.BoxGeometry(w, h, d);
    var mat = new THREE.MeshLambertMaterial({ color: 0x6b5a4e });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, h / 2, z);
    _scene.add(mesh);

    var cliff = {
      mesh: mesh,
      x: x,
      z: z,
      direction: direction || new THREE.Vector3(0, -1, 1).normalize(),
      shotCount: 0,
      riskTimer: 0,
      pebbles: [],
      warned: false,
      isAvalanche: _isHighAltitude()
    };
    _cliffs.push(cliff);
    return cliff;
  }

  /* ── debris chunks ─────────────────────────────────────────────────────── */
  function _spawnChunk(x, z, direction, width, isAvalanche) {
    var w = 0.5 + Math.random() * 1.5;
    var h = 0.4 + Math.random() * 1.0;
    var d = 0.5 + Math.random() * 1.5;
    var geo = new THREE.BoxGeometry(w, h, d);
    var color = isAvalanche
      ? 0xeeeeff
      : (Math.random() > 0.5 ? 0x7a7a7a : 0x8b6914);
    var mat = new THREE.MeshLambertMaterial({ color: color });
    var mesh = new THREE.Mesh(geo, mat);

    var offsetX = (Math.random() - 0.5) * width;
    var offsetZ = (Math.random() - 0.5) * 4;
    mesh.position.set(x + offsetX, 4 + Math.random() * 6, z + offsetZ);
    mesh.rotation.set(
      Math.random() * Math.PI,
      Math.random() * Math.PI,
      Math.random() * Math.PI
    );
    _scene.add(mesh);

    var speed = CHUNK_MIN_SPEED + Math.random() * (CHUNK_MAX_SPEED - CHUNK_MIN_SPEED);
    var dir = direction || new THREE.Vector3(0, 0, 1);
    return {
      mesh: mesh,
      vel: {
        x: dir.x * speed + (Math.random() - 0.5) * 2,
        y: 1 + Math.random() * 2,
        z: dir.z * speed + (Math.random() - 0.5) * 2
      },
      settled: false,
      hitEntities: []     // track entities already hit to avoid multi-hit
    };
  }

  /* ── debris field (permanent obstacle) ────────────────────────────────── */
  function _spawnDebrisField(x, z, width, isAvalanche) {
    var fw = width * 0.9;
    var fd = 8;
    var fh = DEBRIS_FIELD_Y * 2;
    var geo = new THREE.BoxGeometry(fw, fh, fd);
    var color = isAvalanche ? 0xddddee : 0x6b5a3e;
    var mat = new THREE.MeshLambertMaterial({ color: color });
    var fieldMesh = new THREE.Mesh(geo, mat);
    fieldMesh.position.set(x, fh / 2, z + 10);
    _scene.add(fieldMesh);
    return fieldMesh;
  }

  /* ── flood effect ──────────────────────────────────────────────────────── */
  function _checkFloodTrigger(x, z) {
    if (!window.AmphibiousAssault) return;
    try {
      var zones = window.AmphibiousAssault.getWaterZones
        ? window.AmphibiousAssault.getWaterZones()
        : [];
      for (var i = 0; i < zones.length; i++) {
        var wz = zones[i];
        var dist = _dist2D(x, z, wz.x || 0, wz.z || 0);
        if (dist <= FLOOD_WATER_RANGE) {
          /* raise water level upstream */
          if (wz.mesh) {
            wz.mesh.position.y += FLOOD_RISE;
            if (wz.baseY !== undefined) wz.baseY += FLOOD_RISE;
          }
          break;
        }
      }
    } catch (e) {}
  }

  /* ── chain reaction ────────────────────────────────────────────────────── */
  function _checkChainReaction(originX, originZ) {
    for (var i = 0; i < _cliffs.length; i++) {
      var c = _cliffs[i];
      if (c.warned) continue;   // already in warning phase
      var dist = _dist2D(originX, originZ, c.x, c.z);
      if (dist > 0 && dist <= CHAIN_RANGE) {
        if (Math.random() < CHAIN_CHANCE) {
          /* slight delay for chain feel */
          (function (cliff) {
            var delay = 0.5 + Math.random() * 1.5;
            cliff._chainDelay = delay;
            cliff._chainPending = true;
          }(c));
        }
      }
    }
  }

  /* ── entity damage ─────────────────────────────────────────────────────── */
  function _applyChunkDamage(chunk, isAvalanche) {
    var cx = chunk.mesh.position.x;
    var cy = chunk.mesh.position.y;
    var cz = chunk.mesh.position.z;
    var hitRadius = 1.8;

    /* player */
    if (_camera) {
      var px = _camera.position.x;
      var py = _camera.position.y;
      var pz = _camera.position.z;
      var dx = px - cx;
      var dy = py - cy;
      var dz = pz - cz;
      var dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
      if (dist < hitRadius && chunk.hitEntities.indexOf('player') === -1) {
        chunk.hitEntities.push('player');
        if (isAvalanche) {
          /* instant kill */
          if (window.player && window.player.hp !== undefined) {
            window.player.hp = 0;
          }
          if (window.HUD && HUD.flashDamage) HUD.flashDamage(999);
        } else {
          if (window.player && window.player.hp !== undefined) {
            window.player.hp = Math.max(0, window.player.hp - CHUNK_DAMAGE);
          }
          if (window.HUD && HUD.flashDamage) HUD.flashDamage(CHUNK_DAMAGE);
        }
      }
    }

    /* enemies via global enemies array */
    try {
      var enemies = window.Enemies ? window.Enemies.getAll() : [];
      for (var i = 0; i < enemies.length; i++) {
        var e = enemies[i];
        if (!e || !e.position) continue;
        var edx = e.position.x - cx;
        var edy = e.position.y - cy;
        var edz = e.position.z - cz;
        var edist = Math.sqrt(edx * edx + edy * edy + edz * edz);
        var uid = 'e_' + i;
        if (edist < hitRadius && chunk.hitEntities.indexOf(uid) === -1) {
          chunk.hitEntities.push(uid);
          var dmg = isAvalanche ? 9999 : CHUNK_DAMAGE;
          if (typeof e.takeDamage === 'function') e.takeDamage(dmg);
          else if (e.hp !== undefined) e.hp = Math.max(0, e.hp - dmg);
        }
      }
    } catch (ex) {}
  }

  /* ── enemy AI flee ─────────────────────────────────────────────────────── */
  function _signalEnemiesFleeArea(x, z, direction) {
    try {
      var enemies = window.Enemies ? window.Enemies.getAll() : [];
      /* perpendicular to slide direction */
      var perpX = -direction.z;
      var perpZ = direction.x;
      for (var i = 0; i < enemies.length; i++) {
        var e = enemies[i];
        if (!e || !e.position) continue;
        var dist = _dist2D(e.position.x, e.position.z, x, z);
        if (dist < 35) {
          /* set flee target perpendicular */
          var side = Math.random() > 0.5 ? 1 : -1;
          var fleeX = e.position.x + perpX * side * 20;
          var fleeZ = e.position.z + perpZ * side * 20;
          if (e.setFleeTarget) {
            e.setFleeTarget(fleeX, fleeZ);
          } else if (e.fleeTarget) {
            e.fleeTarget.set(fleeX, e.position.y, fleeZ);
          } else if (e.state !== undefined) {
            e._fleeX = fleeX;
            e._fleeZ = fleeZ;
            e.state = 'flee';
          }
        }
      }
    } catch (ex) {}
  }

  /* ── landslide zones tracking ──────────────────────────────────────────── */
  var _landslideZones = [];   /* { x, z, radius, active } */

  /* ── public: triggerLandslide ──────────────────────────────────────────── */
  function triggerLandslide(x, z, direction) {
    var isAvalanche = _isHighAltitude();
    var width = isAvalanche ? AVALANCHE_WIDTH : SLIDE_WIDTH;
    var dir = direction instanceof THREE.Vector3
      ? direction.clone().normalize()
      : new THREE.Vector3(0, 0, 1);

    /* warning pebbles + sound start */
    /* (pebbles will fall immediately; chunks launch after WARNING_DURATION) */
    _playWarningTick();
    _playRumble(isAvalanche);

    /* register zone */
    _landslideZones.push({ x: x, z: z, radius: width / 2 + 5, active: true });

    /* signal enemies to flee */
    _signalEnemiesFleeArea(x, z, dir);

    /* schedule chunk launch after warning */
    var slideEntry = {
      x: x,
      z: z,
      direction: dir,
      width: width,
      isAvalanche: isAvalanche,
      chunks: [],
      active: false,
      fieldMesh: null,
      launchTimer: WARNING_DURATION,
      done: false
    };

    /* spawn pebble-warning via nearest cliff or virtual cliff */
    var virtualCliff = {
      x: x,
      z: z,
      direction: dir,
      shotCount: 0,
      riskTimer: 0,
      pebbles: [],
      warned: true,
      isAvalanche: isAvalanche
    };
    _spawnPebbles(virtualCliff, isAvalanche);
    slideEntry._warningCliff = virtualCliff;

    _showWarning();

    /* check flood */
    _checkFloodTrigger(x, z);

    /* chain reaction */
    _checkChainReaction(x, z);

    _slides.push(slideEntry);
    return slideEntry;
  }

  /* ── launch chunks (called after warning period) ───────────────────────── */
  function _launchSlide(slide) {
    slide.active = true;
    for (var i = 0; i < CHUNK_COUNT; i++) {
      var chunk = _spawnChunk(
        slide.x, slide.z, slide.direction, slide.width, slide.isAvalanche
      );
      slide.chunks.push(chunk);
    }
  }

  /* ── update slides ─────────────────────────────────────────────────────── */
  function _updateSlides(delta) {
    for (var i = _slides.length - 1; i >= 0; i--) {
      var slide = _slides[i];

      /* update warning pebbles */
      if (slide._warningCliff) {
        _updatePebbles(slide._warningCliff, delta);
      }

      /* countdown to launch */
      if (!slide.active) {
        slide.launchTimer -= delta;
        if (slide.launchTimer <= 0) {
          _launchSlide(slide);
          _hideWarning();
        }
        continue;
      }

      /* update chunks */
      var allSettled = true;
      for (var j = 0; j < slide.chunks.length; j++) {
        var chunk = slide.chunks[j];
        if (chunk.settled) continue;
        allSettled = false;

        /* gravity */
        chunk.vel.y -= 9.8 * delta;

        /* apply friction on horizontal */
        chunk.vel.x *= Math.pow(CHUNK_FRICTION, delta * 60);
        chunk.vel.z *= Math.pow(CHUNK_FRICTION, delta * 60);

        /* move */
        chunk.mesh.position.x += chunk.vel.x * delta;
        chunk.mesh.position.y += chunk.vel.y * delta;
        chunk.mesh.position.z += chunk.vel.z * delta;
        chunk.mesh.rotation.x += chunk.vel.z * delta * 0.3;
        chunk.mesh.rotation.z -= chunk.vel.x * delta * 0.3;

        /* stop at ground */
        if (chunk.mesh.position.y <= 0.25) {
          chunk.mesh.position.y = 0.25;
          chunk.vel.y = 0;
          chunk.vel.x *= 0.5;
          chunk.vel.z *= 0.5;
          if (Math.abs(chunk.vel.x) < 0.1 && Math.abs(chunk.vel.z) < 0.1) {
            chunk.settled = true;
          }
        }

        /* damage check */
        _applyChunkDamage(chunk, slide.isAvalanche);
      }

      /* when all chunks settled, replace with flat debris field */
      if (allSettled && !slide.done) {
        slide.done = true;
        /* remove individual chunk meshes */
        for (var k = 0; k < slide.chunks.length; k++) {
          _scene.remove(slide.chunks[k].mesh);
        }
        /* spawn permanent debris field */
        slide.fieldMesh = _spawnDebrisField(
          slide.x, slide.z + 8, slide.width, slide.isAvalanche
        );
        /* update zone to inactive (no longer sliding, but still blocked) */
        for (var zi = 0; zi < _landslideZones.length; zi++) {
          if (_landslideZones[zi].x === slide.x &&
              _landslideZones[zi].z === slide.z) {
            _landslideZones[zi].active = false;
          }
        }
      }
    }
  }

  /* ── update cliffs (risk timer, pebbles, chain) ────────────────────────── */
  function _updateCliffs(delta) {
    var anyWarning = false;

    for (var i = 0; i < _cliffs.length; i++) {
      var cliff = _cliffs[i];

      /* chain reaction pending */
      if (cliff._chainPending) {
        cliff._chainDelay -= delta;
        if (cliff._chainDelay <= 0) {
          cliff._chainPending = false;
          cliff.warned = true;
          cliff.riskTimer = WARNING_DURATION;
          _spawnPebbles(cliff, cliff.isAvalanche);
          _playWarningTick();
        }
      }

      if (!cliff.warned) continue;
      anyWarning = true;

      /* update warning pebbles */
      _updatePebbles(cliff, delta);

      /* countdown to actual slide */
      cliff.riskTimer -= delta;
      if (cliff.riskTimer <= 0) {
        cliff.warned = false;
        triggerLandslide(cliff.x, cliff.z, cliff.direction);
      }
    }

    if (anyWarning && !_warningVisible) _showWarning();
    if (!anyWarning && _warningVisible) {
      /* only hide if no pending slides either */
      var anyPending = false;
      for (var s = 0; s < _slides.length; s++) {
        if (!_slides[s].active) { anyPending = true; break; }
      }
      if (!anyPending) _hideWarning();
    }
  }

  /* ── update explosion map ──────────────────────────────────────────────── */
  function _updateExplosionMap(delta) {
    var keys = Object.keys(_explosionMap);
    for (var i = 0; i < keys.length; i++) {
      var k = keys[i];
      _explosionMap[k].timer -= delta;
      if (_explosionMap[k].timer <= 0) {
        delete _explosionMap[k];
      }
    }
  }

  /* ── public: notify explosion ──────────────────────────────────────────── */
  function notifyExplosion(x, z, damage) {
    var key = _gridKey(x, z);
    if (!_explosionMap[key]) {
      _explosionMap[key] = { damage: 0, timer: EXPLOSION_WINDOW };
    }
    _explosionMap[key].damage += damage;
    _explosionMap[key].timer = EXPLOSION_WINDOW;   /* reset window */

    if (_explosionMap[key].damage >= EXPLOSION_THRESHOLD) {
      delete _explosionMap[key];
      /* find nearest cliff or create risk at location */
      var nearest = _findNearestCliff(x, z, 15);
      if (nearest) {
        if (!nearest.warned) {
          nearest.warned = true;
          nearest.riskTimer = WARNING_DURATION;
          _spawnPebbles(nearest, nearest.isAvalanche);
          _playWarningTick();
        }
      } else {
        /* no cliff mesh registered — trigger directly */
        triggerLandslide(x, z, new THREE.Vector3(0, 0, 1));
      }
    }
  }

  /* ── public: notify cliff shot ─────────────────────────────────────────── */
  function notifyCliffShot(x, z) {
    var nearest = _findNearestCliff(x, z, 10);
    if (!nearest) return;
    nearest.shotCount++;
    if (nearest.shotCount >= CLIFF_SHOT_TRIGGER && !nearest.warned) {
      nearest.warned = true;
      nearest.riskTimer = WARNING_DURATION;
      _spawnPebbles(nearest, nearest.isAvalanche);
      _playWarningTick();
    }
  }

  function _findNearestCliff(x, z, maxDist) {
    var best = null;
    var bestDist = maxDist;
    for (var i = 0; i < _cliffs.length; i++) {
      var d = _dist2D(x, z, _cliffs[i].x, _cliffs[i].z);
      if (d < bestDist) {
        bestDist = d;
        best = _cliffs[i];
      }
    }
    return best;
  }

  /* ── public: getLandslideZones ─────────────────────────────────────────── */
  function getLandslideZones() {
    return _landslideZones.slice();
  }

  /* ── public: init ──────────────────────────────────────────────────────── */
  function init(scene, camera) {
    _scene  = scene;
    _camera = camera;

    _createWarningEl();

    /* spawn a few default cliff formations around the level */
    var defaultCliffs = [
      { x:  25, z: -20, dir: new THREE.Vector3(0, 0, 1) },
      { x: -30, z:  15, dir: new THREE.Vector3(1, 0, 0) },
      { x:  40, z:  30, dir: new THREE.Vector3(-1, 0, 1).normalize() }
    ];
    for (var i = 0; i < defaultCliffs.length; i++) {
      _spawnCliff(
        defaultCliffs[i].x,
        defaultCliffs[i].z,
        defaultCliffs[i].dir
      );
    }
  }

  /* ── public: update ────────────────────────────────────────────────────── */
  function update(delta) {
    if (!_scene) return;
    _updateExplosionMap(delta);
    _updateCliffs(delta);
    _updateSlides(delta);
    _updateWarningBlink(delta);
  }

  /* ── public: reset ─────────────────────────────────────────────────────── */
  function reset() {
    var i, j;

    /* remove cliff meshes + pebbles */
    for (i = 0; i < _cliffs.length; i++) {
      _scene.remove(_cliffs[i].mesh);
      for (j = 0; j < _cliffs[i].pebbles.length; j++) {
        _scene.remove(_cliffs[i].pebbles[j].mesh);
      }
    }
    _cliffs = [];

    /* remove slide chunks + field meshes */
    for (i = 0; i < _slides.length; i++) {
      var slide = _slides[i];
      for (j = 0; j < slide.chunks.length; j++) {
        _scene.remove(slide.chunks[j].mesh);
      }
      if (slide.fieldMesh) _scene.remove(slide.fieldMesh);
      if (slide._warningCliff) {
        for (j = 0; j < slide._warningCliff.pebbles.length; j++) {
          _scene.remove(slide._warningCliff.pebbles[j].mesh);
        }
      }
    }
    _slides = [];
    _landslideZones = [];
    _explosionMap = {};

    _hideWarning();
    _warningBlink = 0;
  }

  /* ── public API ────────────────────────────────────────────────────────── */
  return {
    init: init,
    update: update,
    triggerLandslide: triggerLandslide,
    getLandslideZones: getLandslideZones,
    notifyExplosion: notifyExplosion,
    notifyCliffShot: notifyCliffShot,
    reset: reset
  };

}());
