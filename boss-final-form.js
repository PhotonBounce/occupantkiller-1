/* ─────────────────────────────────────────────────────────────────────────────
   BOSS FINAL FORM — Wave 20 ultimate boss second phase transformation
   When the final boss's HP drops to 30%, it transforms into a devastating
   second phase with new attacks, visuals, and a massive reward on death.
   ───────────────────────────────────────────────────────────────────────────── */
window.BossFinalForm = (function () {
  'use strict';

  /* ── internal state ───────────────────────────────────────────────────────── */
  var _scene           = null;
  var _camera          = null;
  var _phase2Active    = false;
  var _triggered       = false;   // one-shot: only transform once per session
  var _boss            = null;    // reference to the enemy object

  /* transformation */
  var _scaleTimer      = 0;       // time into scale-up animation (0→2s)
  var _scaleDuration   = 2.0;

  /* shield orbs */
  var _shieldOrbs      = [];      // array of {mesh, angle}
  var _orbitRadius     = 3.5;
  var _orbitSpeed      = 1.2;     // radians/sec
  var _orbAngleOffset  = Math.PI * 2 / 4;  // 90° between orbs

  /* laser beam */
  var _laserMesh       = null;
  var _laserAngle      = 0;
  var _laserSpeed      = 0.4;     // rad/sec
  var _laserDmgTimer   = 0;
  var _laserDmgRate    = 0.1;     // check every 0.1s

  /* minion summon */
  var _minionTimer     = 0;
  var _minionInterval  = 15;

  /* ground slam */
  var _slamTimer       = 0;
  var _slamInterval    = 10;
  var _slamParticles   = [];      // {mesh, vel, life, maxLife}

  /* shockwave (spawn-burst visual) */
  var _shockwaveMesh   = null;
  var _shockwaveTimer  = 0;
  var _shockwaveDur    = 0.5;

  /* light dim */
  var _lightDimTimer   = 0;
  var _lightDimDur     = 1.5;
  var _lightsDimmed    = false;
  var _savedLights     = [];      // [{light, originalIntensity}]

  /* vignette */
  var _vignetteEl      = null;

  /* audio ctx (Web Audio fallback) */
  var _audioCtx        = null;

  /* phase 2 death explosion */
  var _deathActive     = false;
  var _deathTimer      = 0;
  var _deathDuration   = 5.0;
  var _deathParticles  = [];
  var _deathStage      = 0;       // 0,1,2 — three explosion stages
  var _deathStageTimes = [1.5, 3.0, 5.0];

  /* ── geometry/material caches ─────────────────────────────────────────────── */
  var _geoShield   = null;    // SphereGeometry(0.4)
  var _matShield   = null;
  var _geoFire     = null;    // fire burst particles
  var _matFire     = null;
  var _geoExplosion = null;
  var _matExplosion = null;

  /* ────────────────────────────────────────────────────────────────────────────
     PUBLIC API
   ─────────────────────────────────────────────────────────────────────────── */

  /* init(scene, camera) — called once when scene is ready */
  function init(scene, camera) {
    _scene  = scene;
    _camera = camera;
    _reset();
  }

  /* update(delta) — called every frame from the main game loop */
  function update(delta) {
    if (!_scene) return;

    /* ── watch for trigger condition ── */
    if (!_triggered && !_phase2Active) {
      _checkTrigger();
    }

    if (!_phase2Active && !_deathActive) return;

    /* ── shockwave expand/fade ── */
    if (_shockwaveMesh) {
      _shockwaveTimer += delta;
      var sw = _shockwaveTimer / _shockwaveDur;
      if (sw >= 1) {
        _scene.remove(_shockwaveMesh);
        _shockwaveMesh = null;
      } else {
        var swScale = 1 + sw * 24;   // expand from 1 to 25 units
        _shockwaveMesh.scale.setScalar(swScale);
        _shockwaveMesh.material.opacity = (1 - sw) * 0.7;
      }
    }

    /* ── scale boss up over 2s ── */
    if (_phase2Active && _boss && _boss.mesh && _scaleTimer < _scaleDuration) {
      _scaleTimer += delta;
      var t = Math.min(_scaleTimer / _scaleDuration, 1);
      var s = 1 + t * 2;   // lerp 1→3
      _boss.mesh.scale.setScalar(s);
    }

    /* ── dim lights momentarily after transform ── */
    if (_lightsDimmed) {
      _lightDimTimer += delta;
      var progress = _lightDimTimer / _lightDimDur;
      if (progress >= 1) {
        /* restore */
        for (var ri = 0; ri < _savedLights.length; ri++) {
          _savedLights[ri].light.intensity = _savedLights[ri].orig;
        }
        _savedLights = [];
        _lightsDimmed = false;
      } else {
        /* 0→0.5: dim; 0.5→1: restore */
        var factor;
        if (progress < 0.5) {
          factor = 1 - (progress / 0.5) * 0.7;   // 1→0.3
        } else {
          factor = 0.3 + ((progress - 0.5) / 0.5) * 0.7;  // 0.3→1
        }
        for (var li2 = 0; li2 < _savedLights.length; li2++) {
          _savedLights[li2].light.intensity = _savedLights[li2].orig * factor;
        }
      }
    }

    if (_phase2Active) {
      /* guard: boss may have died */
      if (!_boss || !_boss.alive) {
        if (_boss && _boss.hp <= 0 && !_deathActive) {
          _startPhase2Death();
        }
        return;
      }

      /* ── orbit shield orbs ── */
      for (var oi = 0; oi < _shieldOrbs.length; oi++) {
        var orb = _shieldOrbs[oi];
        orb.angle += _orbitSpeed * delta;
        if (_boss.mesh) {
          orb.mesh.position.x = _boss.mesh.position.x + Math.cos(orb.angle) * _orbitRadius;
          orb.mesh.position.y = _boss.mesh.position.y + 1.2;
          orb.mesh.position.z = _boss.mesh.position.z + Math.sin(orb.angle) * _orbitRadius;
        }
      }

      /* ── rotate laser beam ── */
      if (_laserMesh && _boss.mesh) {
        _laserAngle += _laserSpeed * delta;
        _laserMesh.position.copy(_boss.mesh.position);
        _laserMesh.position.y += 1.5;
        _laserMesh.rotation.y = _laserAngle;

        /* check player hit */
        _laserDmgTimer += delta;
        if (_laserDmgTimer >= _laserDmgRate) {
          _laserDmgTimer = 0;
          _checkLaserHit();
        }
      }

      /* ── minion summon every 15s ── */
      _minionTimer += delta;
      if (_minionTimer >= _minionInterval) {
        _minionTimer = 0;
        _spawnMinions();
      }

      /* ── ground slam every 10s ── */
      _slamTimer += delta;
      if (_slamTimer >= _slamInterval) {
        _slamTimer = 0;
        _groundSlam();
      }

      /* ── tick fire burst particles ── */
      for (var fi = _slamParticles.length - 1; fi >= 0; fi--) {
        var fp = _slamParticles[fi];
        fp.life -= delta;
        if (fp.life <= 0) {
          _scene.remove(fp.mesh);
          _slamParticles.splice(fi, 1);
        } else {
          fp.mesh.position.x += fp.vel.x * delta;
          fp.mesh.position.y += fp.vel.y * delta;
          fp.mesh.position.z += fp.vel.z * delta;
          fp.vel.y -= 4 * delta;   // gravity
          fp.mesh.material.opacity = fp.life / fp.maxLife;
        }
      }

      /* ── update boss bar HUD ── */
      if (typeof HUD !== 'undefined' && HUD.showBossBar) {
        HUD.showBossBar('PHASE 2 — THE DESTROYER', _boss.hp, _boss.maxHp || 2500);
      }
    }

    /* ── death explosion sequence ── */
    if (_deathActive) {
      _tickDeathExplosion(delta);
    }
  }

  /* trigger() — force-trigger the phase 2 transformation (for testing) */
  function trigger() {
    if (_triggered) return;
    var allEnemies = (typeof Enemies !== 'undefined' && Enemies.getAll) ? Enemies.getAll() : [];
    for (var i = 0; i < allEnemies.length; i++) {
      var e = allEnemies[i];
      if (e && e.alive && e.typeName && e.typeName.indexOf('BOSS') !== -1) {
        _boss = e;
        break;
      }
    }
    if (_boss) _beginTransformation();
  }

  /* reset() — called between waves/stages */
  function reset() {
    _reset();
  }

  /* ────────────────────────────────────────────────────────────────────────────
     INTERNAL — trigger check
   ─────────────────────────────────────────────────────────────────────────── */
  function _checkTrigger() {
    /* must be wave 20 */
    var wave = 0;
    if (typeof GameManager !== 'undefined' && GameManager.getCurrentWave) {
      wave = GameManager.getCurrentWave();
    } else if (typeof window._waveNum === 'number') {
      wave = window._waveNum;
    }
    if (wave < 20) return;

    /* find the active boss */
    var allEnemies = (typeof Enemies !== 'undefined' && Enemies.getAll) ? Enemies.getAll() : [];
    var foundBoss = null;
    for (var i = 0; i < allEnemies.length; i++) {
      var e = allEnemies[i];
      if (!e || !e.alive) continue;
      var tn = e.typeName || (e.typeCfg && e.typeCfg.name) || '';
      if (tn.indexOf('BOSS') !== -1 || (e.typeCfg && e.typeCfg.role === 'boss')) {
        foundBoss = e;
        break;
      }
    }
    if (!foundBoss) return;

    /* check HP threshold: 30% */
    var hpPct = foundBoss.hp / (foundBoss.maxHp || foundBoss.hp);
    if (hpPct <= 0.30) {
      _boss = foundBoss;
      _beginTransformation();
    }
  }

  /* ────────────────────────────────────────────────────────────────────────────
     INTERNAL — transformation
   ─────────────────────────────────────────────────────────────────────────── */
  function _beginTransformation() {
    if (_triggered) return;
    _triggered    = true;
    _phase2Active = true;
    _scaleTimer   = 0;

    /* ── shockwave sphere (visual only) ── */
    var geoSW = new THREE.SphereGeometry(1, 16, 8);
    var matSW = new THREE.MeshBasicMaterial({
      color: 0xff4400,
      transparent: true,
      opacity: 0.7,
      wireframe: true
    });
    _shockwaveMesh = new THREE.Mesh(geoSW, matSW);
    if (_boss && _boss.mesh) {
      _shockwaveMesh.position.copy(_boss.mesh.position);
    }
    _scene.add(_shockwaveMesh);
    _shockwaveTimer = 0;

    /* ── boss color → blood red + orange emissive ── */
    if (_boss && _boss.mesh) {
      _boss.mesh.traverse(function (child) {
        if (child.isMesh && child.material) {
          var mats = Array.isArray(child.material) ? child.material : [child.material];
          for (var mi = 0; mi < mats.length; mi++) {
            try { mats[mi].color.setHex(0x8B0000); } catch (e) {}
            try {
              if (mats[mi].emissive) mats[mi].emissive.setHex(0xff6600);
              if (typeof mats[mi].emissiveIntensity !== 'undefined') mats[mi].emissiveIntensity = 0.6;
            } catch (e) {}
          }
        }
      });
    }

    /* ── refill HP to 2500 ── */
    if (_boss) {
      _boss.hp    = 2500;
      _boss.maxHp = 2500;
    }

    /* ── dim all scene lights to 30% ── */
    _dimLights();

    /* ── spawn 4 orbiting shield orbs ── */
    _spawnShieldOrbs();

    /* ── spawn rotating laser beam ── */
    _spawnLaser();

    /* ── show vignette ── */
    _showVignette();

    /* ── dramatic audio ── */
    _playTransformSound();

    /* ── HUD announcement ── */
    if (typeof HUD !== 'undefined' && HUD.showBossIntro) {
      HUD.showBossIntro('THE DESTROYER — PHASE 2');
    } else if (typeof HUD !== 'undefined' && HUD.notifyPickup) {
      HUD.notifyPickup('⚠ PHASE 2 — THE DESTROYER ⚠', '#8B0000');
    }

    /* reset attack timers so attacks don't fire immediately */
    _minionTimer = 5;   /* first minions after 5s */
    _slamTimer   = 5;   /* first slam after 5s */
  }

  /* ── dim scene lights ── */
  function _dimLights() {
    if (!_scene) return;
    _savedLights = [];
    _scene.traverse(function (obj) {
      if (obj.isLight && typeof obj.intensity === 'number') {
        _savedLights.push({ light: obj, orig: obj.intensity });
      }
    });
    /* apply 30% immediately; _lightsDimmed loop will interpolate */
    _lightsDimmed  = true;
    _lightDimTimer = 0;
  }

  /* ── spawn 4 orbiting shield spheres ── */
  function _spawnShieldOrbs() {
    if (!_geoShield) _geoShield = new THREE.SphereGeometry(0.4, 8, 6);
    if (!_matShield) _matShield = new THREE.MeshStandardMaterial({
      color: 0xff6600,
      emissive: new THREE.Color(0xff3300),
      emissiveIntensity: 0.8,
      transparent: true,
      opacity: 0.85
    });

    _shieldOrbs = [];
    for (var i = 0; i < 4; i++) {
      var orbMesh = new THREE.Mesh(_geoShield, _matShield.clone());
      var startAngle = i * _orbAngleOffset;
      if (_boss && _boss.mesh) {
        orbMesh.position.set(
          _boss.mesh.position.x + Math.cos(startAngle) * _orbitRadius,
          _boss.mesh.position.y + 1.2,
          _boss.mesh.position.z + Math.sin(startAngle) * _orbitRadius
        );
      }
      _scene.add(orbMesh);
      _shieldOrbs.push({ mesh: orbMesh, angle: startAngle });
    }
  }

  /* ── spawn rotating laser cylinder ── */
  function _spawnLaser() {
    var geoLaser = new THREE.CylinderGeometry(0.05, 0.05, 50, 8);
    var matLaser = new THREE.MeshBasicMaterial({
      color: 0xff0000,
      transparent: true,
      opacity: 0.85
    });
    _laserMesh = new THREE.Mesh(geoLaser, matLaser);
    /* rotate cylinder so it lies horizontally along X; then rotation.y sweeps it */
    _laserMesh.rotation.z = Math.PI / 2;
    /* offset so it extends forward from the centre: CylinderGeometry is centred,
       so we wrap it in a pivot group offset by half the length */
    var pivot = new THREE.Group();
    if (_boss && _boss.mesh) {
      pivot.position.copy(_boss.mesh.position);
      pivot.position.y += 1.5;
    }
    _laserMesh.position.x = 25;   /* half of 50, beam extends 0→50 from boss */
    pivot.add(_laserMesh);
    _laserMesh._pivot = pivot;     /* store ref for updates */
    _scene.add(pivot);
    /* replace _laserMesh reference with the group for position updates */
    _laserMesh = pivot;
  }

  /* ── check laser hit on player ── */
  function _checkLaserHit() {
    if (!_boss || !_boss.mesh || !_camera) return;
    var playerPos = _camera.position;
    var bossPos   = _boss.mesh.position;

    /* project player onto laser plane (assume laser sweeps in XZ at height ~bossPos.y + 1.5) */
    var dx = playerPos.x - bossPos.x;
    var dz = playerPos.z - bossPos.z;
    var dist = Math.sqrt(dx * dx + dz * dz);
    if (dist < 1 || dist > 26) return;   /* too close or too far */

    var playerAngle = Math.atan2(dz, dx);
    /* normalise angles to [0, 2π] */
    var la = ((_laserAngle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
    var pa = ((playerAngle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
    var diff = Math.abs(la - pa);
    if (diff > Math.PI) diff = Math.PI * 2 - diff;

    if (diff < 0.25) {   /* within ~14° */
      /* 15 dmg/s, but checked every 0.1s → 1.5 dmg per check */
      var dmg = 15 * _laserDmgRate;
      var gm = typeof GameManager !== 'undefined' ? GameManager : null;
      if (gm && gm.getPlayer) {
        var p = gm.getPlayer();
        if (p && !p.godMode) {
          p.hp = Math.max(0, p.hp - dmg);
          if (typeof HUD !== 'undefined' && HUD.setHealth) HUD.setHealth(p.hp, p.maxHp);
          if (typeof HUD !== 'undefined' && HUD.showDamageFlash) HUD.showDamageFlash(0xff0000, 0.1);
        }
      }
    }
  }

  /* ── spawn 3 regular enemies ── */
  function _spawnMinions() {
    if (typeof Enemies === 'undefined' || !Enemies.spawnSingle || !_boss || !_boss.mesh) return;
    var bx = _boss.mesh.position.x;
    var bz = _boss.mesh.position.z;
    var minionTypes = ['STORMER', 'CONSCRIPT', 'ARMORED'];
    for (var i = 0; i < 3; i++) {
      var angle = (i / 3) * Math.PI * 2;
      var sx = bx + Math.cos(angle) * 6;
      var sz = bz + Math.sin(angle) * 6;
      try {
        Enemies.spawnSingle(minionTypes[i] || 'STORMER', { x: sx, z: sz });
      } catch (e) {}
    }
    if (typeof HUD !== 'undefined' && HUD.notifyPickup) {
      HUD.notifyPickup('THE DESTROYER CALLS REINFORCEMENTS', '#ff4400');
    }
  }

  /* ── ground slam ── */
  function _groundSlam() {
    if (!_boss || !_boss.mesh || !_scene) return;
    var bpos = _boss.mesh.position;

    /* camera shake */
    if (typeof CameraSystem !== 'undefined' && CameraSystem.shake) {
      CameraSystem.shake(0.3, 1.0);
    }

    /* radial fire burst — 16 particles outward 8 units */
    if (!_geoFire) _geoFire = new THREE.SphereGeometry(0.15, 4, 4);
    if (!_matFire) _matFire = new THREE.MeshBasicMaterial({
      color: 0xff4400,
      transparent: true,
      opacity: 1.0
    });

    for (var i = 0; i < 16; i++) {
      var angle  = (i / 16) * Math.PI * 2;
      var speed  = 6 + Math.random() * 3;
      var pMesh  = new THREE.Mesh(_geoFire, _matFire.clone());
      pMesh.position.set(bpos.x, bpos.y + 0.3, bpos.z);
      _scene.add(pMesh);
      var life = 1.2 + Math.random() * 0.6;
      _slamParticles.push({
        mesh: pMesh,
        vel:  {
          x: Math.cos(angle) * speed,
          y: 2 + Math.random() * 3,
          z: Math.sin(angle) * speed
        },
        life:    life,
        maxLife: life
      });
    }

    /* damage player if within 8 units */
    var gm = typeof GameManager !== 'undefined' ? GameManager : null;
    if (gm && gm.getPlayer && _camera) {
      var p = gm.getPlayer();
      if (p) {
        var pdx = _camera.position.x - bpos.x;
        var pdz = _camera.position.z - bpos.z;
        var pdist = Math.sqrt(pdx * pdx + pdz * pdz);
        if (pdist <= 8 && !p.godMode) {
          p.hp = Math.max(0, p.hp - 30);
          if (typeof HUD !== 'undefined' && HUD.setHealth) HUD.setHealth(p.hp, p.maxHp);
          if (typeof HUD !== 'undefined' && HUD.showDamageFlash) HUD.showDamageFlash(0xff6600, 0.3);
        }
      }
    }
  }

  /* ── vignette ── */
  function _showVignette() {
    if (_vignetteEl) return;
    _vignetteEl = document.createElement('div');
    _vignetteEl.id = 'boss-phase2-vignette';
    _vignetteEl.style.cssText = [
      'position:fixed;top:0;left:0;width:100%;height:100%;',
      'pointer-events:none;z-index:500;',
      'background:radial-gradient(',
      '  transparent 55%,',
      '  rgba(139,0,0,0.35) 80%,',
      '  rgba(100,0,0,0.6) 100%',
      ');'
    ].join('');
    document.body.appendChild(_vignetteEl);
  }

  function _removeVignette() {
    if (_vignetteEl && _vignetteEl.parentNode) {
      _vignetteEl.parentNode.removeChild(_vignetteEl);
    }
    _vignetteEl = null;
  }

  /* ── dramatic transformation audio (Web Audio API) ── */
  function _playTransformSound() {
    try {
      if (!_audioCtx) {
        _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      }
      var ctx = _audioCtx;

      /* deep bass crash */
      var bassOsc  = ctx.createOscillator();
      var bassGain = ctx.createGain();
      bassOsc.type = 'sawtooth';
      bassOsc.frequency.setValueAtTime(60, ctx.currentTime);
      bassOsc.frequency.exponentialRampToValueAtTime(20, ctx.currentTime + 1.5);
      bassGain.gain.setValueAtTime(0.6, ctx.currentTime);
      bassGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 2.0);
      bassOsc.connect(bassGain);
      bassGain.connect(ctx.destination);
      bassOsc.start(ctx.currentTime);
      bassOsc.stop(ctx.currentTime + 2.0);

      /* rising tone */
      var riseOsc  = ctx.createOscillator();
      var riseGain = ctx.createGain();
      riseOsc.type = 'sine';
      riseOsc.frequency.setValueAtTime(80, ctx.currentTime + 0.3);
      riseOsc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 2.5);
      riseGain.gain.setValueAtTime(0.0, ctx.currentTime + 0.3);
      riseGain.gain.linearRampToValueAtTime(0.4, ctx.currentTime + 1.0);
      riseGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 3.0);
      riseOsc.connect(riseGain);
      riseGain.connect(ctx.destination);
      riseOsc.start(ctx.currentTime + 0.3);
      riseOsc.stop(ctx.currentTime + 3.0);

      /* reverb crash (noise burst) */
      var bufLen    = ctx.sampleRate * 0.8;
      var buffer    = ctx.createBuffer(1, bufLen, ctx.sampleRate);
      var bufData   = buffer.getChannelData(0);
      for (var i = 0; i < bufLen; i++) {
        bufData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufLen, 3);
      }
      var bufSrc    = ctx.createBufferSource();
      var noiseGain = ctx.createGain();
      bufSrc.buffer = buffer;
      noiseGain.gain.setValueAtTime(0.5, ctx.currentTime);
      bufSrc.connect(noiseGain);
      noiseGain.connect(ctx.destination);
      bufSrc.start(ctx.currentTime);
    } catch (e) {
      /* audio unavailable — silent fail */
    }
  }

  /* ────────────────────────────────────────────────────────────────────────────
     INTERNAL — phase 2 death
   ─────────────────────────────────────────────────────────────────────────── */
  function _startPhase2Death() {
    _deathActive = true;
    _deathTimer  = 0;
    _deathStage  = 0;
    _phase2Active = false;

    /* clear laser, orbs */
    _clearPhase2Objects();

    if (typeof HUD !== 'undefined' && HUD.notifyPickup) {
      HUD.notifyPickup('THE DESTROYER HAS FALLEN', '#ffd700');
    }
    _spawnDeathParticles(0);
  }

  function _tickDeathExplosion(delta) {
    _deathTimer += delta;

    /* progress to next explosion stage */
    if (_deathStage < 3 && _deathTimer >= _deathStageTimes[_deathStage]) {
      _deathStage++;
      if (_deathStage < 3) {
        _spawnDeathParticles(_deathStage);
        if (typeof CameraSystem !== 'undefined' && CameraSystem.shake) {
          CameraSystem.shake(0.4, 1.5);
        }
      }
    }

    /* tick death particles */
    for (var i = _deathParticles.length - 1; i >= 0; i--) {
      var dp = _deathParticles[i];
      dp.life -= delta;
      if (dp.life <= 0) {
        if (_scene) _scene.remove(dp.mesh);
        _deathParticles.splice(i, 1);
      } else {
        dp.mesh.position.x += dp.vel.x * delta;
        dp.mesh.position.y += dp.vel.y * delta;
        dp.mesh.position.z += dp.vel.z * delta;
        dp.vel.y -= 5 * delta;
        var lifePct = dp.life / dp.maxLife;
        dp.mesh.material.opacity = lifePct;
        var s = 1 + (1 - lifePct) * 2;
        dp.mesh.scale.setScalar(s);
      }
    }

    /* done: grant reward, remove vignette */
    if (_deathTimer >= _deathDuration && _deathActive) {
      _deathActive = false;
      _grantPhase2Reward();
      _removeVignette();
    }
  }

  function _spawnDeathParticles(stage) {
    if (!_scene || !_boss || !_boss.mesh) return;
    if (!_geoExplosion) _geoExplosion = new THREE.SphereGeometry(0.3, 6, 4);
    if (!_matExplosion) _matExplosion = new THREE.MeshBasicMaterial({
      color: 0xff6600,
      transparent: true,
      opacity: 1.0
    });

    var bpos  = _boss.mesh.position;
    var count = 20 + stage * 15;
    var speedMulti = 1 + stage * 0.8;

    for (var i = 0; i < count; i++) {
      var pMesh = new THREE.Mesh(_geoExplosion, _matExplosion.clone());
      pMesh.position.copy(bpos);
      pMesh.position.x += (Math.random() - 0.5) * 3;
      pMesh.position.y += (Math.random()) * 2;
      pMesh.position.z += (Math.random() - 0.5) * 3;
      _scene.add(pMesh);
      var speed = (4 + Math.random() * 6) * speedMulti;
      var theta = Math.random() * Math.PI * 2;
      var phi   = Math.random() * Math.PI;
      var life  = 1.5 + Math.random() * 1.5;
      _deathParticles.push({
        mesh: pMesh,
        vel: {
          x: Math.sin(phi) * Math.cos(theta) * speed,
          y: Math.abs(Math.cos(phi)) * speed,
          z: Math.sin(phi) * Math.sin(theta) * speed
        },
        life:    life,
        maxLife: life
      });
    }
  }

  function _grantPhase2Reward() {
    var reward = 2500;
    if (typeof Marketplace !== 'undefined') {
      if (Marketplace.awardCustomOKC) {
        Marketplace.awardCustomOKC(reward, 'boss_phase2_kill', {});
      } else if (Marketplace.addOKC) {
        Marketplace.addOKC(reward);
      }
      if (typeof HUD !== 'undefined' && HUD.updateOKC) {
        HUD.updateOKC(Marketplace.getOKC());
      }
    }
    if (typeof HUD !== 'undefined' && HUD.notifyPickup) {
      HUD.notifyPickup('+2500 OKC — THE DESTROYER SLAIN', '#ffd700');
    }
  }

  /* ────────────────────────────────────────────────────────────────────────────
     INTERNAL — cleanup helpers
   ─────────────────────────────────────────────────────────────────────────── */
  function _clearPhase2Objects() {
    /* shield orbs */
    for (var i = 0; i < _shieldOrbs.length; i++) {
      if (_scene) _scene.remove(_shieldOrbs[i].mesh);
    }
    _shieldOrbs = [];

    /* laser */
    if (_laserMesh) {
      if (_scene) _scene.remove(_laserMesh);
      _laserMesh = null;
    }

    /* shockwave */
    if (_shockwaveMesh) {
      if (_scene) _scene.remove(_shockwaveMesh);
      _shockwaveMesh = null;
    }

    /* slam particles */
    for (var si = _slamParticles.length - 1; si >= 0; si--) {
      if (_scene) _scene.remove(_slamParticles[si].mesh);
    }
    _slamParticles = [];
  }

  function _reset() {
    _clearPhase2Objects();

    /* death particles */
    for (var di = _deathParticles.length - 1; di >= 0; di--) {
      if (_scene) _scene.remove(_deathParticles[di].mesh);
    }
    _deathParticles = [];

    /* restore lights if dimmed */
    if (_lightsDimmed) {
      for (var li = 0; li < _savedLights.length; li++) {
        _savedLights[li].light.intensity = _savedLights[li].orig;
      }
    }
    _savedLights   = [];
    _lightsDimmed  = false;
    _lightDimTimer = 0;

    _removeVignette();

    _phase2Active  = false;
    _triggered     = false;
    _boss          = null;
    _scaleTimer    = 0;
    _laserAngle    = 0;
    _laserDmgTimer = 0;
    _minionTimer   = 0;
    _slamTimer     = 0;
    _shockwaveTimer = 0;
    _deathActive   = false;
    _deathTimer    = 0;
    _deathStage    = 0;
  }

  /* ────────────────────────────────────────────────────────────────────────────
     SHIELD DAMAGE REDUCTION (called by Enemies.damage intercept if supported)
   ─────────────────────────────────────────────────────────────────────────── */
  /* Returns the damage multiplier for the active boss when phase 2 shields are up. */
  function getPhase2DamageMultiplier() {
    if (_phase2Active && _shieldOrbs.length > 0) {
      return 0.30;   /* 70% reduction */
    }
    return 1.0;
  }

  /* ────────────────────────────────────────────────────────────────────────────
     EXPORTS
   ─────────────────────────────────────────────────────────────────────────── */
  return {
    init:   init,
    update: update,
    trigger: trigger,
    reset:  reset,
    isPhase2Active:             function () { return _phase2Active; },
    getPhase2DamageMultiplier:  getPhase2DamageMultiplier
  };

})();
