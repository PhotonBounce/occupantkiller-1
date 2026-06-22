/* ─────────────────────────────────────────────────────────────────────────────
   WAVE EVENTS — random mid-wave events (helicopter crash, supply drop,
   convoy, artillery, fog of war)                          Ukraine conflict theme
   ───────────────────────────────────────────────────────────────────────────── */
window.WaveEvents = (function () {
  'use strict';

  /* ── internal state ───────────────────────────────────────────────────────── */
  var _scene = null;
  var _toastTimer = null;
  var _activeEvents = [];         // list of in-progress event objects
  var _midTriggered = false;      // guard: only fire 'mid' once per wave

  /* ── geometry / material caches (lazily created, reused across events) ───── */
  var _geoSphere03 = null;        // r=0.3 fire particle sphere
  var _geoSphere02 = null;        // r=0.2 shell debris sphere

  /* ────────────────────────────────────────────────────────────────────────────
     PUBLIC API
   ─────────────────────────────────────────────────────────────────────────── */
  function init(scene) {
    _scene = scene;
    _activeEvents = [];
    _midTriggered = false;
    _toastTimer = null;
  }

  /* triggerRandom(waveNum, phase)
     phase = 'start' | 'mid'
     Called by game-manager at wave start and when 50% of enemies are killed. */
  function triggerRandom(waveNum, phase) {
    if (!_scene) return;

    if (phase === 'start') {
      _midTriggered = false;

      /* HELICOPTER_CRASH: 30% at wave >= 3 */
      if (waveNum >= 3 && Math.random() < 0.30) {
        _startHelicopterCrash();
      }

      /* FOG_OF_WAR: 10% any wave */
      if (Math.random() < 0.10) {
        _startFogOfWar();
      }

      /* ARTILLERY_BARRAGE: 25% at wave >= 8 */
      if (waveNum >= 8 && Math.random() < 0.25) {
        _startArtilleryBarrage();
      }

      /* REINFORCEMENT_CONVOY: 15% at wave >= 5 */
      if (waveNum >= 5 && Math.random() < 0.15) {
        _startReinforcementConvoy();
      }
    }

    if (phase === 'mid' && !_midTriggered) {
      _midTriggered = true;

      /* SUPPLY_DROP_CONTESTED: 20% any wave (mid-point) */
      if (Math.random() < 0.20) {
        _startSupplyDrop();
      }
    }
  }

  /* update(delta) — called every frame from the main game loop */
  function update(delta) {
    for (var i = _activeEvents.length - 1; i >= 0; i--) {
      var ev = _activeEvents[i];
      if (ev && ev.tick) {
        ev.tick(delta);
        if (ev.done) {
          _activeEvents.splice(i, 1);
        }
      }
    }
  }

  /* clear() — called from applyStage to remove all event objects from scene */
  function clear() {
    for (var i = 0; i < _activeEvents.length; i++) {
      var ev = _activeEvents[i];
      if (ev && ev.cleanup) ev.cleanup();
    }
    _activeEvents = [];
    _midTriggered = false;
  }

  /* reset() — called after KillStreak.reset() on new game */
  function reset() {
    clear();
    _toastTimer = null;
  }

  /* ────────────────────────────────────────────────────────────────────────────
     HUD TOAST
   ─────────────────────────────────────────────────────────────────────────── */
  function _showToast(msg) {
    var el = document.getElementById('waveEventToast');
    if (!el) {
      el = document.createElement('div');
      el.id = 'waveEventToast';
      el.style.cssText = [
        'position:fixed',
        'top:80px',
        'left:50%',
        'transform:translateX(-50%)',
        'background:rgba(0,0,0,0.78)',
        'border:1px solid rgba(255,200,0,0.5)',
        'color:#ffd700',
        'padding:7px 22px',
        'border-radius:6px',
        'font-size:14px',
        'font-family:monospace',
        'z-index:500',
        'pointer-events:none',
        'text-align:center',
        'transition:opacity 0.5s',
        'white-space:nowrap',
      ].join(';');
      document.body.appendChild(el);
    }
    el.textContent = msg;
    el.style.opacity = '1';
    clearTimeout(_toastTimer);
    _toastTimer = setTimeout(function () { el.style.opacity = '0'; }, 4000);
  }

  /* ────────────────────────────────────────────────────────────────────────────
     HELPER: cached sphere geometry
   ─────────────────────────────────────────────────────────────────────────── */
  function _sphereGeo03() {
    if (!_geoSphere03) _geoSphere03 = new THREE.SphereGeometry(0.3, 5, 5);
    return _geoSphere03;
  }
  function _sphereGeo02() {
    if (!_geoSphere02) _geoSphere02 = new THREE.SphereGeometry(0.2, 5, 5);
    return _geoSphere02;
  }

  /* ────────────────────────────────────────────────────────────────────────────
     HELPER: get player position from game-manager's exported object
   ─────────────────────────────────────────────────────────────────────────── */
  function _getPlayer() {
    return (typeof window !== 'undefined' && window.GameManager && window.GameManager.getPlayer)
      ? window.GameManager.getPlayer()
      : null;
  }

  /* ────────────────────────────────────────────────────────────────────────────
     EVENT 1 — HELICOPTER_CRASH
   ─────────────────────────────────────────────────────────────────────────── */
  function _startHelicopterCrash() {
    var player = _getPlayer();
    var originX = player ? player.position.x : 0;
    var originZ = player ? player.position.z : 0;

    /* spawn position: 30 units away in a random direction, 40 up */
    var angle = Math.random() * Math.PI * 2;
    var startX = originX + Math.cos(angle) * 30;
    var startZ = originZ + Math.sin(angle) * 30;
    var startY = 40;

    /* ── build helicopter group ── */
    var heliGroup = new THREE.Group();

    /* body */
    var bodyGeo = new THREE.BoxGeometry(2, 1, 4);
    var metalMat = new THREE.MeshLambertMaterial({ color: 0x888888 });
    var bodyMesh = new THREE.Mesh(bodyGeo, metalMat);
    heliGroup.add(bodyMesh);

    /* main rotor (horizontal blade above body) */
    var rotorBladeGeo = new THREE.CylinderGeometry(0.08, 0.08, 3.5, 4);
    var rotorMat = new THREE.MeshLambertMaterial({ color: 0x666666 });
    var rotorBlade1 = new THREE.Mesh(rotorBladeGeo, rotorMat);
    rotorBlade1.rotation.z = Math.PI / 2;
    rotorBlade1.position.set(0, 0.7, 0);
    heliGroup.add(rotorBlade1);

    /* tail rotor */
    var tailRotorGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.8, 4);
    var tailRotorMesh = new THREE.Mesh(tailRotorGeo, rotorMat);
    tailRotorMesh.rotation.x = Math.PI / 2;
    tailRotorMesh.position.set(0, 0.3, -2.2);
    heliGroup.add(tailRotorMesh);

    heliGroup.position.set(startX, startY, startZ);
    _scene.add(heliGroup);

    var elapsed = 0;
    var duration = 8.0; /* seconds to reach ground */
    var groundY = 0;

    var ev = {
      done: false,
      _meshes: [heliGroup],
      _lights: [],
      tick: function (delta) {
        elapsed += delta;
        if (elapsed >= duration) {
          /* impact */
          _heliImpact(heliGroup);
          ev.tick = function () {}; /* silence further ticking */
          return;
        }
        var newY = startY - (startY - groundY) * (elapsed / duration);
        var wobbleX = Math.sin(elapsed * 3.0) * 0.4;
        var wobbleZ = Math.cos(elapsed * 2.5) * 0.3;
        heliGroup.position.set(startX + wobbleX, newY, startZ + wobbleZ);
        rotorBlade1.rotation.y += delta * 8;
        heliGroup.rotation.z = Math.sin(elapsed * 1.5) * 0.1;
        heliGroup.rotation.x = Math.sin(elapsed * 0.9) * 0.05;
      },
      cleanup: function () {
        for (var mi = 0; mi < ev._meshes.length; mi++) {
          if (_scene) _scene.remove(ev._meshes[mi]);
        }
        for (var li = 0; li < ev._lights.length; li++) {
          if (_scene) _scene.remove(ev._lights[li]);
        }
      },
    };

    _activeEvents.push(ev);
    _showToast('⚠️ HELICOPTER DOWN — enemy reinforcements inbound!');
  }

  function _heliImpact(heliGroup) {
    var pos = heliGroup.position.clone();
    pos.y = 0;
    heliGroup.position.copy(pos); /* settle on ground as wreck */

    /* 12 fire particles */
    for (var fi = 0; fi < 12; fi++) {
      var isRed = fi % 2 === 0;
      var fireMat = new THREE.MeshBasicMaterial({ color: isRed ? 0xff2200 : 0xff8800, transparent: true, opacity: 1 });
      var fireMesh = new THREE.Mesh(_sphereGeo03(), fireMat);
      fireMesh.position.copy(pos);
      var speed = 3 + Math.random() * 4;
      var dir = new THREE.Vector3(
        (Math.random() - 0.5) * 2,
        Math.random() * 1.5 + 0.5,
        (Math.random() - 0.5) * 2
      ).normalize().multiplyScalar(speed);
      _scene.add(fireMesh);
      (function (mesh, material, velocity) {
        var life = 0;
        var maxLife = 0.6 + Math.random() * 0.4;
        var particleEv = {
          done: false,
          _meshes: [mesh],
          _lights: [],
          tick: function (d) {
            life += d;
            mesh.position.addScaledVector(velocity, d);
            velocity.y -= 8 * d;
            material.opacity = Math.max(0, 1 - life / maxLife);
            if (life >= maxLife) {
              if (_scene) _scene.remove(mesh);
              particleEv.done = true;
            }
          },
          cleanup: function () { if (_scene) _scene.remove(mesh); },
        };
        _activeEvents.push(particleEv);
      })(fireMesh, fireMat, dir);
    }

    /* impact flash light */
    var flashLight = new THREE.PointLight(0xff4400, 8, 20);
    flashLight.position.set(pos.x, 1, pos.z);
    _scene.add(flashLight);
    setTimeout(function () { if (_scene) _scene.remove(flashLight); }, 300);

    if (typeof window !== 'undefined' && window.AudioSystem && window.AudioSystem.playExplosion) {
      window.AudioSystem.playExplosion();
    }
  }

  /* ────────────────────────────────────────────────────────────────────────────
     EVENT 2 — SUPPLY_DROP_CONTESTED
   ─────────────────────────────────────────────────────────────────────────── */
  function _startSupplyDrop() {
    var player = _getPlayer();
    var originX = player ? player.position.x : 0;
    var originZ = player ? player.position.z : 0;

    var dropX = originX + (Math.random() - 0.5) * 30;
    var dropZ = originZ + (Math.random() - 0.5) * 30;
    var startY = 35;
    var groundY = 0;

    var crateGeo = new THREE.BoxGeometry(1.5, 1.5, 1.5);
    var crateMat = new THREE.MeshLambertMaterial({ color: 0x8B6914 });
    var crateMesh = new THREE.Mesh(crateGeo, crateMat);
    crateMesh.position.set(dropX, startY, dropZ);
    _scene.add(crateMesh);

    var chuteGeo = new THREE.ConeGeometry(3, 4, 8);
    var chuteMat = new THREE.MeshLambertMaterial({ color: 0xffffff, transparent: true, opacity: 0.85 });
    var chuteMesh = new THREE.Mesh(chuteGeo, chuteMat);
    chuteMesh.position.set(dropX, startY + 4, dropZ);
    _scene.add(chuteMesh);

    /* flag nearest 3 enemies as targeting supply */
    var enemies = (typeof Enemies !== 'undefined' && Enemies.getAll) ? Enemies.getAll() : [];
    var alive = [];
    for (var ei = 0; ei < enemies.length; ei++) {
      if (enemies[ei] && enemies[ei].alive && enemies[ei].mesh) alive.push(enemies[ei]);
    }
    alive.sort(function (a, b) {
      var da = a.mesh.position.distanceTo(crateMesh.position);
      var db = b.mesh.position.distanceTo(crateMesh.position);
      return da - db;
    });
    for (var ni = 0; ni < Math.min(3, alive.length); ni++) {
      alive[ni]._targetingSupply = true;
    }

    var falling = true;
    var collected = false;
    var elapsed = 0;

    var ev = {
      done: false,
      _meshes: [crateMesh, chuteMesh],
      _lights: [],
      tick: function (delta) {
        elapsed += delta;

        if (falling) {
          var newY = crateMesh.position.y - 6 * delta;
          if (newY <= groundY + 0.75) {
            newY = groundY + 0.75;
            falling = false;
            chuteMesh.visible = false;
          }
          crateMesh.position.y = newY;
          chuteMesh.position.y = newY + 4;
        }

        if (!collected && !falling) {
          if (player && player.position) {
            var dx = player.position.x - crateMesh.position.x;
            var dz = player.position.z - crateMesh.position.z;
            if (Math.sqrt(dx * dx + dz * dz) < 1.5) {
              collected = true;
              if (typeof Weapons !== 'undefined' && Weapons.addAmmo) {
                Weapons.addAmmo(50);
              } else {
                try {
                  if (typeof Weapons !== 'undefined' && Weapons.getCurrent) {
                    var wep = Weapons.getCurrent();
                    if (wep) wep.reserve = (wep.reserve || 0) + 50;
                  }
                } catch (e) {}
              }
              if (player.grenades !== undefined) player.grenades++;
              if (typeof HUD !== 'undefined' && HUD.notifyPickup) {
                HUD.notifyPickup('+50 AMMO | +1 GRENADE (Supply Drop)', '#ffd700');
              }
              if (typeof AudioSystem !== 'undefined' && AudioSystem.playPickup) {
                AudioSystem.playPickup();
              }
              if (_scene) _scene.remove(crateMesh);
              ev.done = true;
            }
          }
        }

        /* auto-remove after 60 s */
        if (elapsed > 60) {
          if (_scene) { _scene.remove(crateMesh); _scene.remove(chuteMesh); }
          ev.done = true;
        }
      },
      cleanup: function () {
        if (_scene) { _scene.remove(crateMesh); _scene.remove(chuteMesh); }
      },
    };

    _activeEvents.push(ev);
    _showToast('📦 SUPPLY DROP CONTESTED — reach it first!');
  }

  /* ────────────────────────────────────────────────────────────────────────────
     EVENT 3 — REINFORCEMENT_CONVOY
   ─────────────────────────────────────────────────────────────────────────── */
  function _startReinforcementConvoy() {
    var player = _getPlayer();
    var originX = player ? player.position.x : 0;
    var originZ = player ? player.position.z : 0;

    var truckData = [];
    var xOffsets = [-8, 0, 8];

    for (var ti = 0; ti < 3; ti++) {
      var truckGeo = new THREE.BoxGeometry(4, 2, 8);
      var truckMat = new THREE.MeshLambertMaterial({ color: 0x777777 });
      var truckMesh = new THREE.Mesh(truckGeo, truckMat);
      truckMesh.position.set(originX + xOffsets[ti], 1, originZ - 40);
      _scene.add(truckMesh);
      truckData.push({ mesh: truckMesh, delivered: false, dead: false });
    }

    var ev = {
      done: false,
      _meshes: truckData.map(function (t) { return t.mesh; }),
      _lights: [],
      tick: function (delta) {
        var allDone = true;
        for (var ti2 = 0; ti2 < truckData.length; ti2++) {
          var td = truckData[ti2];
          if (td.dead || td.delivered) continue;
          allDone = false;

          if (td.mesh.position.z < originZ - 0.5) {
            td.mesh.position.z += 3 * delta;
          }

          var px = player ? player.position.x : originX;
          var pz = player ? player.position.z : originZ;
          var dx = td.mesh.position.x - px;
          var dz = td.mesh.position.z - pz;
          var distToPlayer = Math.sqrt(dx * dx + dz * dz);
          var distToCenter = Math.abs(td.mesh.position.z - originZ);

          if (distToPlayer < 5 || distToCenter < 0.5) {
            td.delivered = true;
            _spawnConvoySoldiers(td.mesh.position.x, td.mesh.position.z);
            if (_scene) _scene.remove(td.mesh);
            td.dead = true;
          }
        }
        if (allDone) ev.done = true;
      },
      cleanup: function () {
        for (var ti3 = 0; ti3 < truckData.length; ti3++) {
          if (!truckData[ti3].dead && _scene) _scene.remove(truckData[ti3].mesh);
        }
      },
    };

    _activeEvents.push(ev);
    _showToast('🚛 ENEMY CONVOY DETECTED — prepare for reinforcements!');
  }

  function _spawnConvoySoldiers(x, z) {
    try {
      if (typeof Enemies !== 'undefined' && Enemies.spawnSingle) {
        Enemies.spawnSingle('SOLDIER', { x: x - 1.5, z: z });
        Enemies.spawnSingle('SOLDIER', { x: x + 1.5, z: z });
      }
    } catch (e) {}
  }

  /* ────────────────────────────────────────────────────────────────────────────
     EVENT 4 — ARTILLERY_BARRAGE
   ─────────────────────────────────────────────────────────────────────────── */
  function _startArtilleryBarrage() {
    var player = _getPlayer();
    var originX = player ? player.position.x : 0;
    var originZ = player ? player.position.z : 0;

    var totalShells = 5;
    var interval = 6.0 / totalShells;
    var shellsFired = 0;
    var elapsed = 0;

    var ev = {
      done: false,
      _meshes: [],
      _lights: [],
      tick: function (delta) {
        elapsed += delta;
        var shouldFire = Math.floor(elapsed / interval);
        while (shellsFired < shouldFire && shellsFired < totalShells) {
          shellsFired++;
          var impactX = originX + (Math.random() - 0.5) * 40;
          var impactZ = originZ + (Math.random() - 0.5) * 40;
          _fireShell(impactX, impactZ, player);
        }
        if (shellsFired >= totalShells) ev.done = true;
      },
      cleanup: function () {},
    };

    _activeEvents.push(ev);
    _showToast('💥 ARTILLERY INBOUND — take cover!');
  }

  function _fireShell(impactX, impactZ, player) {
    _playWhistle();
    _flickerHUD();

    var shellGeo = new THREE.SphereGeometry(0.2, 5, 5);
    var shellMat = new THREE.MeshBasicMaterial({ color: 0xff2200 });
    var shellMesh = new THREE.Mesh(shellGeo, shellMat);
    var startY = 30;
    shellMesh.position.set(impactX, startY, impactZ);
    _scene.add(shellMesh);

    var elapsed = 0;
    var fallTime = startY / 20; /* 20 units/s */
    var impacted = false;

    var shellEv = {
      done: false,
      _meshes: [shellMesh],
      _lights: [],
      tick: function (delta) {
        if (!impacted) {
          elapsed += delta;
          var newY = startY - 20 * elapsed;
          if (newY <= 0) {
            newY = 0;
            impacted = true;
            if (_scene) _scene.remove(shellMesh);
            _shellImpact(impactX, impactZ, player);
            shellEv.done = true;
          }
          shellMesh.position.y = newY;
        }
      },
      cleanup: function () { if (_scene) _scene.remove(shellMesh); },
    };

    _activeEvents.push(shellEv);
  }

  function _shellImpact(x, z, player) {
    /* crater — flat disk */
    var craterGeo = new THREE.CylinderGeometry(1.5, 1.5, 0.3, 12);
    var craterMat = new THREE.MeshLambertMaterial({ color: 0x222200 });
    var craterMesh = new THREE.Mesh(craterGeo, craterMat);
    craterMesh.position.set(x, 0.05, z);
    _scene.add(craterMesh);

    /* impact flash */
    var impactLight = new THREE.PointLight(0xff2200, 10, 15);
    impactLight.position.set(x, 1, z);
    _scene.add(impactLight);
    setTimeout(function () { if (_scene) _scene.remove(impactLight); }, 200);

    /* 8 debris particles */
    for (var di = 0; di < 8; di++) {
      var debrisMat = new THREE.MeshBasicMaterial({ color: 0x553300, transparent: true, opacity: 1 });
      var debrisMesh = new THREE.Mesh(_sphereGeo02(), debrisMat);
      debrisMesh.position.set(x, 0.5, z);
      var vel = new THREE.Vector3(
        (Math.random() - 0.5) * 8,
        Math.random() * 5 + 2,
        (Math.random() - 0.5) * 8
      );
      _scene.add(debrisMesh);
      (function (mesh, mat, v) {
        var life = 0;
        var maxLife = 0.8 + Math.random() * 0.5;
        var debrisEv = {
          done: false,
          _meshes: [mesh],
          _lights: [],
          tick: function (d) {
            life += d;
            mesh.position.addScaledVector(v, d);
            v.y -= 10 * d;
            mat.opacity = Math.max(0, 1 - life / maxLife);
            if (life >= maxLife) {
              if (_scene) _scene.remove(mesh);
              debrisEv.done = true;
            }
          },
          cleanup: function () { if (_scene) _scene.remove(mesh); },
        };
        _activeEvents.push(debrisEv);
      })(debrisMesh, debrisMat, vel);
    }

    /* player damage if within 3 units */
    if (player && player.position) {
      var dx = player.position.x - x;
      var dz = player.position.z - z;
      if (Math.sqrt(dx * dx + dz * dz) < 3 && !player.godMode) {
        if (typeof window !== 'undefined' && typeof window._takeDamageFromWaveEvent === 'function') {
          window._takeDamageFromWaveEvent(25);
        } else {
          player.hp = Math.max(0, player.hp - 25);
          if (typeof HUD !== 'undefined' && HUD.setHealth) HUD.setHealth(player.hp, player.maxHp);
          if (typeof HUD !== 'undefined' && HUD.showDamageFlash) HUD.showDamageFlash(0xff4400, 0.6);
        }
      }
    }

    if (typeof AudioSystem !== 'undefined' && AudioSystem.playExplosion) {
      AudioSystem.playExplosion();
    }

    /* persist crater */
    _activeEvents.push({
      done: false,
      _meshes: [craterMesh],
      _lights: [],
      tick: function () {},
      cleanup: function () { if (_scene) _scene.remove(craterMesh); },
    });
  }

  /* descending 600 Hz to 200 Hz whistle via Web Audio API */
  function _playWhistle() {
    try {
      var ctx = new (window.AudioContext || window.webkitAudioContext)();
      var osc = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(200, ctx.currentTime + 1.5);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 1.5);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 1.5);
      osc.onended = function () { try { ctx.close(); } catch (e) {} };
    } catch (e) {}
  }

  /* brief HUD flicker */
  function _flickerHUD() {
    try {
      var hud = document.getElementById('hud');
      if (!hud) return;
      hud.style.opacity = '0.3';
      setTimeout(function () { hud.style.opacity = '1'; }, 150);
    } catch (e) {}
  }

  /* ────────────────────────────────────────────────────────────────────────────
     EVENT 5 — FOG_OF_WAR
   ─────────────────────────────────────────────────────────────────────────── */
  function _startFogOfWar() {
    if (!_scene) return;

    var origFogFar = (_scene.fog && _scene.fog.far) ? _scene.fog.far : 120;
    var origFogNear = (_scene.fog && _scene.fog.near) ? _scene.fog.near : 1;

    if (!_scene.fog) {
      _scene.fog = new THREE.Fog(0x888888, 1, origFogFar);
    }

    _scene.fog.far = 8;
    _scene.fog.near = 1;

    var minimapCanvas = document.getElementById('minimap-canvas');
    if (minimapCanvas) minimapCanvas.style.display = 'none';

    /* +40% speed boost to all current enemies */
    var foggedEnemies = (typeof Enemies !== 'undefined' && Enemies.getAll) ? Enemies.getAll() : [];
    for (var ei = 0; ei < foggedEnemies.length; ei++) {
      var e = foggedEnemies[ei];
      if (e && e.alive) {
        e._fogSpeedBoost = true;
        if (e.speed !== undefined) {
          e._origSpeed = e.speed;
          e.speed *= 1.4;
        }
      }
    }

    var fogActive = true;
    var elapsed = 0;
    var fogDuration = 20.0;
    var fadeDuration = 5.0;
    var fadingBack = false;
    var fadeElapsed = 0;

    var ev = {
      done: false,
      _meshes: [],
      _lights: [],
      tick: function (delta) {
        if (!fogActive) return;
        elapsed += delta;

        if (!fadingBack && elapsed >= fogDuration) {
          fadingBack = true;
          /* restore enemy speeds */
          for (var ei2 = 0; ei2 < foggedEnemies.length; ei2++) {
            var e2 = foggedEnemies[ei2];
            if (e2 && e2._fogSpeedBoost) {
              e2._fogSpeedBoost = false;
              if (e2._origSpeed !== undefined) {
                e2.speed = e2._origSpeed;
                delete e2._origSpeed;
              }
            }
          }
          if (minimapCanvas) minimapCanvas.style.display = '';
        }

        if (fadingBack) {
          fadeElapsed += delta;
          var t = Math.min(1, fadeElapsed / fadeDuration);
          if (_scene.fog) {
            _scene.fog.far = 8 + (origFogFar - 8) * t;
          }
          if (fadeElapsed >= fadeDuration) {
            if (_scene.fog) _scene.fog.far = origFogFar;
            fogActive = false;
            ev.done = true;
          }
        }
      },
      cleanup: function () {
        if (_scene && _scene.fog) {
          _scene.fog.far = origFogFar;
          _scene.fog.near = origFogNear;
        }
        if (minimapCanvas) minimapCanvas.style.display = '';
        for (var ei3 = 0; ei3 < foggedEnemies.length; ei3++) {
          var e3 = foggedEnemies[ei3];
          if (e3 && e3._fogSpeedBoost) {
            e3._fogSpeedBoost = false;
            if (e3._origSpeed !== undefined) {
              e3.speed = e3._origSpeed;
              delete e3._origSpeed;
            }
          }
        }
      },
    };

    _activeEvents.push(ev);
    _showToast('🌫️ FOG ROLL-IN — visibility lost!');
  }

  /* ── public surface ───────────────────────────────────────────────────────── */
  return { init: init, update: update, triggerRandom: triggerRandom, clear: clear, reset: reset };
})();
