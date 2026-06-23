window.LandmineField = (function () {
  'use strict';

  // ── constants ──────────────────────────────────────────────────────────────
  var MAX_MINES = 12;
  var ARM_DELAY = 2.0;          // seconds
  var PARTICLE_COUNT = 30;
  var PARTICLE_LIFE = 0.6;      // seconds
  var TRIGGER_RADIUS = 0.6;     // metres XZ
  var DETECTOR_RANGE = 3.0;     // metres
  var DETECTOR_CONE_HALF_ANGLE = Math.PI / 6; // 30°

  var MINE_TYPES = {
    AP: { name: 'AP',  damage: 80,  radius: 1.5, label: 'AP',  heavyOnly: false, bouncing: false },
    AT: { name: 'AT',  damage: 250, radius: 3.0, label: 'AT',  heavyOnly: true,  bouncing: false },
    BB: { name: 'BB',  damage: 120, radius: 4.0, label: 'BB',  heavyOnly: false, bouncing: true  }
  };
  var TYPE_ORDER = ['AP', 'AT', 'BB'];

  // ── state ──────────────────────────────────────────────────────────────────
  var scene        = null;
  var camera       = null;
  var playerRef    = null;
  var enemiesRef   = null;
  var onDamage     = null;

  var mines        = [];          // array of mine objects
  var particles    = [];          // array of particle objects
  var currentTypeIndex = 0;

  var detectorActive   = false;
  var audioCtx         = null;
  var beepOscillator   = null;
  var beepGain         = null;
  var beepInterval     = null;

  var hudEl        = null;

  // ── helpers ────────────────────────────────────────────────────────────────
  function getPlayerPos() {
    if (playerRef && playerRef.position) return playerRef.position;
    if (camera) return camera.position;
    return new THREE.Vector3();
  }

  function getPlayerDir() {
    if (camera) {
      var dir = new THREE.Vector3();
      camera.getWorldDirection(dir);
      return dir;
    }
    return new THREE.Vector3(0, 0, -1);
  }

  function xzDist(a, b) {
    var dx = a.x - b.x;
    var dz = (a.z !== undefined ? a.z : 0) - (b.z !== undefined ? b.z : 0);
    return Math.sqrt(dx * dx + dz * dz);
  }

  function dist3(a, b) {
    var dx = a.x - b.x;
    var dy = a.y - b.y;
    var dz = a.z - b.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  // ── HUD ───────────────────────────────────────────────────────────────────
  function createHUD() {
    hudEl = document.createElement('div');
    hudEl.id = 'lf-hud';
    hudEl.style.cssText = [
      'position:fixed',
      'top:12px',
      'left:12px',
      'color:#00ff44',
      'font-family:monospace',
      'font-size:14px',
      'font-weight:bold',
      'text-shadow:0 0 6px #00ff44',
      'pointer-events:none',
      'z-index:9999',
      'background:rgba(0,0,0,0.45)',
      'padding:4px 8px',
      'border-radius:3px'
    ].join(';');
    document.body.appendChild(hudEl);
    updateHUD();
  }

  function updateHUD() {
    if (!hudEl) return;
    var armed   = mines.filter(function (m) { return m.alive; }).length;
    var typeKey = TYPE_ORDER[currentTypeIndex];
    hudEl.textContent = 'MINES: ' + armed + '/' + MAX_MINES + ' [' + typeKey + ']';
  }

  // ── mine creation ─────────────────────────────────────────────────────────
  function createMineMesh(pos) {
    var geo  = new THREE.CylinderGeometry(0.25, 0.25, 0.08, 16);
    var mat  = new THREE.MeshStandardMaterial({ color: 0x4b5320, roughness: 0.8, metalness: 0.5 });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(pos.x, 0.04, pos.z);
    scene.add(mesh);

    // LED point light (amber while arming, red when armed)
    var light = new THREE.PointLight(0xffaa00, 1.5, 1.2);
    light.position.set(pos.x, 0.12, pos.z);
    scene.add(light);

    return { mesh: mesh, light: light };
  }

  function plant(typeOverride) {
    var alive = mines.filter(function (m) { return m.alive; });
    if (alive.length >= MAX_MINES) return false;

    var typeKey  = typeOverride || TYPE_ORDER[currentTypeIndex];
    var typeDef  = MINE_TYPES[typeKey];
    var pos      = getPlayerPos().clone();
    var meshObj  = createMineMesh(pos);
    var now      = (typeof performance !== 'undefined') ? performance.now() / 1000 : Date.now() / 1000;

    var mine = {
      alive:      true,
      armed:      false,
      placeTime:  now,
      typeKey:    typeKey,
      typeDef:    typeDef,
      mesh:       meshObj.mesh,
      light:      meshObj.light,
      bounceDone: false,
      bounceY:    0
    };

    mines.push(mine);
    addMinimapMarker(mine);
    updateHUD();
    return true;
  }

  // ── minimap ───────────────────────────────────────────────────────────────
  function addMinimapMarker(mine) {
    if (window.TacticalMinimap && typeof window.TacticalMinimap.addMarker === 'function') {
      mine._minimapId = window.TacticalMinimap.addMarker({
        type:  'mine',
        pos:   mine.mesh.position,
        color: '#ff2222',
        label: 'X'
      });
    }
  }

  function removeMinimapMarker(mine) {
    if (window.TacticalMinimap && mine._minimapId !== undefined &&
        typeof window.TacticalMinimap.removeMarker === 'function') {
      window.TacticalMinimap.removeMarker(mine._minimapId);
    }
  }

  // ── particles ─────────────────────────────────────────────────────────────
  function spawnExplosion(pos) {
    for (var i = 0; i < PARTICLE_COUNT; i++) {
      var geo = new THREE.SphereGeometry(0.06, 4, 4);
      var col = (Math.random() > 0.5) ? 0xff4400 : 0xff9900;
      var mat = new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 1 });
      var mesh = new THREE.Mesh(geo, mat);
      mesh.position.copy(pos);
      scene.add(mesh);

      particles.push({
        mesh:  mesh,
        vx:    (Math.random() - 0.5) * 8,
        vy:    Math.random() * 6 + 1,
        vz:    (Math.random() - 0.5) * 8,
        life:  PARTICLE_LIFE,
        timer: 0
      });
    }
  }

  // ── detonation ────────────────────────────────────────────────────────────
  function detonate(mine, explodePos) {
    if (!mine.alive) return;
    mine.alive = false;

    // remove mesh & light
    scene.remove(mine.mesh);
    scene.remove(mine.light);
    mine.mesh.geometry.dispose();
    mine.mesh.material.dispose();

    removeMinimapMarker(mine);
    spawnExplosion(explodePos || mine.mesh.position);

    var radius = mine.typeDef.radius;
    var damage = mine.typeDef.damage;
    var epos   = explodePos || mine.mesh.position;

    // damage enemies
    if (enemiesRef) {
      for (var i = 0; i < enemiesRef.length; i++) {
        var en = enemiesRef[i];
        if (!en || en.dead) continue;
        var ep = en.position || (en.mesh && en.mesh.position);
        if (!ep) continue;
        if (dist3(epos, ep) <= radius) {
          if (typeof en.takeDamage === 'function') en.takeDamage(damage);
        }
      }
    }

    // damage player
    var pp = getPlayerPos();
    if (dist3(epos, pp) <= radius) {
      if (typeof onDamage === 'function') onDamage(damage);
    }

    updateHUD();
  }

  // ── Bouncing Betty ────────────────────────────────────────────────────────
  function triggerBounce(mine) {
    if (mine.bounceDone) return;
    mine.bounceDone = true;
    mine.bounceVY   = 5;          // upward m/s
    mine.bounceTimer = 0;
  }

  // ── detector audio ────────────────────────────────────────────────────────
  function ensureAudio() {
    if (audioCtx) return;
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }

  function startBeep(freq) {
    ensureAudio();
    stopBeep();
    beepOscillator = audioCtx.createOscillator();
    beepGain       = audioCtx.createGain();
    beepOscillator.type      = 'square';
    beepOscillator.frequency.value = freq;
    beepGain.gain.value      = 0.15;
    beepOscillator.connect(beepGain);
    beepGain.connect(audioCtx.destination);
    beepOscillator.start();
    // pulse: on 80 ms, then stop
    beepOscillator.stop(audioCtx.currentTime + 0.08);
  }

  function stopBeep() {
    if (beepOscillator) {
      try { beepOscillator.stop(); } catch(e) {}
      beepOscillator.disconnect();
      beepOscillator = null;
    }
    if (beepGain) {
      beepGain.disconnect();
      beepGain = null;
    }
    if (beepInterval) {
      clearInterval(beepInterval);
      beepInterval = null;
    }
  }

  function runDetector() {
    var pp  = getPlayerPos();
    var dir = getPlayerDir();
    dir.y = 0;
    dir.normalize();

    var closest = Infinity;
    for (var i = 0; i < mines.length; i++) {
      var m = mines[i];
      if (!m.alive) continue;
      var mp  = m.mesh.position;
      var toM = new THREE.Vector3(mp.x - pp.x, 0, mp.z - pp.z);
      var d   = toM.length();
      if (d > DETECTOR_RANGE) continue;
      toM.normalize();
      var angle = Math.acos(Math.min(1, dir.dot(toM)));
      if (angle <= DETECTOR_CONE_HALF_ANGLE && d < closest) {
        closest = d;
      }
    }

    if (closest < Infinity) {
      // 200 Hz at 3m → 2000 Hz at 0m
      var freq     = 200 + (1800 * (1 - closest / DETECTOR_RANGE));
      var interval = Math.max(80, closest / DETECTOR_RANGE * 800);

      stopBeep();
      beepInterval = setInterval(function () {
        startBeep(freq);
      }, interval);
    } else {
      stopBeep();
    }
  }

  // ── keyboard ──────────────────────────────────────────────────────────────
  function onKeyDown(e) {
    // Alt+M — place mine
    if (e.altKey && (e.key === 'm' || e.key === 'M')) {
      e.preventDefault();
      plant();
      return;
    }
    // Ctrl+M — cycle type
    if (e.ctrlKey && (e.key === 'm' || e.key === 'M')) {
      e.preventDefault();
      currentTypeIndex = (currentTypeIndex + 1) % TYPE_ORDER.length;
      updateHUD();
      return;
    }
    // Q — toggle detector
    if (e.key === 'q' || e.key === 'Q') {
      detectorActive = !detectorActive;
      if (!detectorActive) stopBeep();
      return;
    }
  }

  // ── update ────────────────────────────────────────────────────────────────
  function update(dt) {
    var now = (typeof performance !== 'undefined') ? performance.now() / 1000 : Date.now() / 1000;

    // update mines
    for (var i = 0; i < mines.length; i++) {
      var m = mines[i];
      if (!m.alive) continue;

      // arming
      if (!m.armed) {
        if (now - m.placeTime >= ARM_DELAY) {
          m.armed = true;
          m.light.color.setHex(0xff0000);
        }
      }

      // Bouncing Betty spring phase
      if (m.typeDef.bouncing && m.bounceDone && !m._exploded) {
        m.bounceTimer += dt;
        m.bounceY     = (m.bounceVY * m.bounceTimer) - (4.9 * m.bounceTimer * m.bounceTimer);
        if (m.bounceY >= 1.5 && !m._primed) {
          m._primed = true;
        }
        if (m.bounceY >= 1.5 || (m._primed && m.bounceY < 1.5)) {
          if (m._primed) {
            // explode at chest height
            m._exploded = true;
            var ep = m.mesh.position.clone();
            ep.y = 1.4;
            scene.remove(m.mesh);
            scene.remove(m.light);
            detonate(m, ep);
            continue;
          }
        }
        // update mesh Y
        m.mesh.position.y = Math.max(0.04, 0.04 + m.bounceY);
        m.light.position.y = m.mesh.position.y + 0.08;
      }

      if (!m.armed) continue;

      // trigger check vs enemies
      if (enemiesRef) {
        for (var j = 0; j < enemiesRef.length; j++) {
          var en = enemiesRef[j];
          if (!en || en.dead) continue;

          // AT mines only trigger on heavy objects
          if (m.typeDef.heavyOnly && !en.isHeavy) continue;

          var ep2 = en.position || (en.mesh && en.mesh.position);
          if (!ep2) continue;
          if (xzDist(m.mesh.position, ep2) <= TRIGGER_RADIUS) {
            if (m.typeDef.bouncing) {
              triggerBounce(m);
            } else {
              detonate(m);
            }
            break;
          }
        }
      }
    }

    // update particles
    for (var k = particles.length - 1; k >= 0; k--) {
      var p = particles[k];
      p.timer += dt;
      if (p.timer >= p.life) {
        scene.remove(p.mesh);
        p.mesh.geometry.dispose();
        p.mesh.material.dispose();
        particles.splice(k, 1);
        continue;
      }
      p.mesh.position.x += p.vx * dt;
      p.mesh.position.y += p.vy * dt;
      p.mesh.position.z += p.vz * dt;
      p.vy -= 9.8 * dt;  // gravity
      p.mesh.material.opacity = 1 - (p.timer / p.life);
    }

    // detector
    if (detectorActive) runDetector();
  }

  // ── init ──────────────────────────────────────────────────────────────────
  function init(opts) {
    opts = opts || {};
    scene      = opts.scene      || null;
    camera     = opts.camera     || null;
    playerRef  = opts.player     || null;
    enemiesRef = opts.enemies    || null;
    onDamage   = opts.onDamage   || null;

    mines     = [];
    particles = [];
    currentTypeIndex = 0;
    detectorActive   = false;

    createHUD();
    document.addEventListener('keydown', onKeyDown);
  }

  // ── reset ─────────────────────────────────────────────────────────────────
  function reset() {
    // remove all mines
    for (var i = 0; i < mines.length; i++) {
      var m = mines[i];
      if (scene) {
        scene.remove(m.mesh);
        scene.remove(m.light);
      }
      if (m.mesh.geometry) m.mesh.geometry.dispose();
      if (m.mesh.material) m.mesh.material.dispose();
      removeMinimapMarker(m);
    }
    mines = [];

    // remove all particles
    for (var j = 0; j < particles.length; j++) {
      var p = particles[j];
      if (scene) scene.remove(p.mesh);
      if (p.mesh.geometry) p.mesh.geometry.dispose();
      if (p.mesh.material) p.mesh.material.dispose();
    }
    particles = [];

    stopBeep();
    detectorActive = false;
    updateHUD();
  }

  // ── public API ────────────────────────────────────────────────────────────
  return {
    init:   init,
    update: update,
    plant:  plant,
    reset:  reset
  };

})();
