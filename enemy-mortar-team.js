/* ════════════════════════════════════════════════════════════════════
 *  ENEMY MORTAR TEAM — 2-man crew that lobs shells in high arcs
 *  ─────────────────────────────────────────────────────────────────
 *  From wave 6, 1 team spawns every 4 waves, positioned 25-35 units
 *  from the player at the edge of visibility. The crew stays stationary:
 *  spotter "looks" at player and signals; operator fires every 8s.
 *
 *  Blast radii:  ≤3u → 100 dmg   ≤6u → 60 dmg   ≤10u → 30 dmg
 *  First shot ±6 units random; subsequent shots walk toward player.
 *  Destroying mortar tube → operators flee.
 *  Killing operator → spotter picks up tube, fires at 12s interval.
 *
 *  Public API:
 *    EnemyMortarTeam.init(scene, camera)
 *    EnemyMortarTeam.update(delta)
 *    EnemyMortarTeam.spawn(x, y, z)
 *    EnemyMortarTeam.reset()
 *    EnemyMortarTeam.takeDamage(teamIndex, target, amount)
 * ════════════════════════════════════════════════════════════════════ */
window.EnemyMortarTeam = (function () {
  'use strict';

  /* ── private state ─────────────────────────────────────────────── */
  var _scene  = null;
  var _camera = null;
  var _initialized = false;

  var _teams          = [];   /* active team objects */
  var _shells         = [];   /* shells in flight */
  var _indicators     = [];   /* landing circle indicators */
  var _smokeParticles = [];   /* smoke trail particles */

  var _lastSpawnWave = -999;

  /* ── constants ──────────────────────────────────────────────────── */
  var OPERATOR_HP   = 60;
  var SPOTTER_HP    = 60;
  var TUBE_HP       = 40;
  var SCORE_REWARD  = 500;

  var FIRE_INTERVAL_NORMAL = 8;
  var FIRE_INTERVAL_SLOW   = 12;

  var SHELL_PEAK_ABOVE      = 20;   /* peak height above player Y */
  var SHELL_TRAVEL_TIME     = 3.5;  /* seconds from launch to impact */
  var WARNING_BEFORE_IMPACT = 1.5;  /* seconds indicator shows before impact */

  var BLAST_R1 = 3;  var BLAST_D1 = 100;
  var BLAST_R2 = 6;  var BLAST_D2 = 60;
  var BLAST_R3 = 10; var BLAST_D3 = 30;

  var FIRST_SHOT_SPREAD = 6;    /* ±units on first shot */
  var ACCURACY_STEP     = 0.8;  /* spread shrinks per shot */

  var OPERATOR_COLOR = 0x2D4A1A;
  var SPOTTER_COLOR  = 0x1A3A0E;
  var TUBE_COLOR     = 0x666666;
  var BASEPLATE_COL  = 0x555555;
  var SHELL_COLOR    = 0x111111;
  var SMOKE_COLOR    = 0x888888;

  var FLEE_SPEED     = 5;
  var SPAWN_MIN_DIST = 25;
  var SPAWN_MAX_DIST = 35;

  /* ════════════════════════════════════════════════════════════════
     AUDIO — inline Web Audio (no external dependency)
  ════════════════════════════════════════════════════════════════ */
  function _getAudioCtx() {
    if (!window._audioCtx) {
      try {
        window._audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      } catch (e) { return null; }
    }
    return window._audioCtx;
  }

  function _playLaunch() {
    var ctx = _getAudioCtx();
    if (!ctx) return;
    try {
      var dur  = 0.25;
      var rate = ctx.sampleRate;
      var buf  = ctx.createBuffer(1, Math.floor(rate * dur), rate);
      var data = buf.getChannelData(0);
      for (var i = 0; i < data.length; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (rate * 0.06));
      }
      var src  = ctx.createBufferSource();
      src.buffer = buf;
      var gain = ctx.createGain();
      gain.gain.value = 0.3;
      src.connect(gain);
      gain.connect(ctx.destination);
      src.start();
    } catch (e) { /* silent */ }
  }

  /* Descending whistle as shell drops toward player */
  function _playWhistle() {
    var ctx = _getAudioCtx();
    if (!ctx) return;
    try {
      var osc  = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(900, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + WARNING_BEFORE_IMPACT);
      gain.gain.setValueAtTime(0.18, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.0,  ctx.currentTime + WARNING_BEFORE_IMPACT + 0.05);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + WARNING_BEFORE_IMPACT + 0.1);
    } catch (e) { /* silent */ }
  }

  function _playExplosion() {
    var ctx = _getAudioCtx();
    if (!ctx) return;
    try {
      var dur  = 0.7;
      var rate = ctx.sampleRate;
      var buf  = ctx.createBuffer(1, Math.floor(rate * dur), rate);
      var data = buf.getChannelData(0);
      for (var i = 0; i < data.length; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (rate * 0.12));
      }
      var src  = ctx.createBufferSource();
      src.buffer = buf;
      var gain = ctx.createGain();
      gain.gain.value = 0.55;
      src.connect(gain);
      gain.connect(ctx.destination);
      src.start();
    } catch (e) { /* silent */ }
  }

  /* ════════════════════════════════════════════════════════════════
     MESH BUILDERS
  ════════════════════════════════════════════════════════════════ */

  function _buildSoldierMesh(color, crouched) {
    var group = new THREE.Group();
    var mat   = new THREE.MeshLambertMaterial({ color: color });
    var dark  = new THREE.MeshLambertMaterial({ color: 0x111111 });

    /* torso */
    var torsoGeo = new THREE.BoxGeometry(0.55, 0.78, 0.32);
    var torso    = new THREE.Mesh(torsoGeo, mat);
    torso.position.y = crouched ? 0.28 : 0.52;
    group.add(torso);

    /* head */
    var headGeo = new THREE.BoxGeometry(0.32, 0.32, 0.32);
    var head    = new THREE.Mesh(headGeo, mat);
    head.position.y = crouched ? 0.76 : 1.08;
    group.add(head);

    /* arms */
    var armGeo = new THREE.BoxGeometry(0.18, 0.55, 0.2);
    var lArm   = new THREE.Mesh(armGeo, mat);
    var rArm   = new THREE.Mesh(armGeo, mat);
    var armY   = crouched ? 0.22 : 0.46;
    lArm.position.set(-0.38, armY, 0);
    rArm.position.set( 0.38, armY, 0);
    group.add(lArm);
    group.add(rArm);

    /* legs */
    var legGeo = new THREE.BoxGeometry(0.22, 0.55, 0.24);
    var lLeg   = new THREE.Mesh(legGeo, dark);
    var rLeg   = new THREE.Mesh(legGeo, dark);
    lLeg.position.set(-0.16, crouched ? -0.15 : -0.12, 0);
    rLeg.position.set( 0.16, crouched ? -0.15 : -0.12, 0);
    group.add(lLeg);
    group.add(rLeg);

    return group;
  }

  function _buildSpotterMesh() {
    var group   = _buildSoldierMesh(SPOTTER_COLOR, false);
    /* binoculars — small box at face height */
    var binoGeo = new THREE.BoxGeometry(0.2, 0.08, 0.12);
    var binoMat = new THREE.MeshLambertMaterial({ color: 0x222222 });
    var bino    = new THREE.Mesh(binoGeo, binoMat);
    bino.position.set(0, 1.08, 0.22);
    group.add(bino);
    return group;
  }

  function _buildMortarMount() {
    var group = new THREE.Group();

    /* baseplate */
    var baseGeo = new THREE.BoxGeometry(0.3, 0.1, 0.3);
    var baseMat = new THREE.MeshLambertMaterial({ color: BASEPLATE_COL });
    var base    = new THREE.Mesh(baseGeo, baseMat);
    base.position.y = 0.05;
    group.add(base);

    /* tube — 60° from horizontal = 30° from vertical; tilt via X rotation */
    var tubeGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.8, 8);
    var tubeMat = new THREE.MeshLambertMaterial({ color: TUBE_COLOR });
    var tube    = new THREE.Mesh(tubeGeo, tubeMat);
    tube.rotation.x = -Math.PI / 6;  /* -30° from vertical → muzzle angled 60° from ground */
    tube.position.set(0, 0.5, -0.1);
    group.add(tube);

    group.userData.tube = tube;
    return group;
  }

  /* ════════════════════════════════════════════════════════════════
     SCENE / PLAYER HELPERS
  ════════════════════════════════════════════════════════════════ */
  function _getScene() {
    if (_scene) return _scene;
    if (window.GameManager && window.GameManager.getScene) return window.GameManager.getScene();
    return window._gameScene || null;
  }

  function _getPlayer() {
    if (window.GameManager && window.GameManager.getPlayer) return window.GameManager.getPlayer();
    return window.player || null;
  }

  function _dealDamage(amount) {
    if (window._takeDamageFromWaveEvent) {
      window._takeDamageFromWaveEvent(amount);
    } else if (window.GameManager && window.GameManager.takeDamage) {
      window.GameManager.takeDamage(amount, 'mortar');
    } else {
      var p = _getPlayer();
      if (p) {
        if (typeof p.health === 'number') { p.health = Math.max(0, p.health - amount); }
        else if (typeof p.hp === 'number') { p.hp    = Math.max(0, p.hp    - amount); }
      }
    }
    if (window.HUD && window.HUD.showDamageFlash) { window.HUD.showDamageFlash(); }
  }

  function _showToast(msg) {
    if (window.HUD && window.HUD.showToast) { window.HUD.showToast(msg); }
  }

  function _showIncomingHUD() {
    _showToast('INCOMING FIRE!');
    try {
      var flash = document.createElement('div');
      flash.style.cssText = [
        'position:fixed',
        'top:0',
        'left:0',
        'width:100%',
        'height:100%',
        'background:rgba(255,0,0,0.35)',
        'pointer-events:none',
        'z-index:9999'
      ].join(';');
      document.body.appendChild(flash);
      setTimeout(function () {
        if (flash.parentNode) { flash.parentNode.removeChild(flash); }
      }, 500);
    } catch (e) { /* not in browser env */ }
  }

  /* ════════════════════════════════════════════════════════════════
     LANDING INDICATOR — red circle flashes on ground before impact
  ════════════════════════════════════════════════════════════════ */
  function _spawnIndicator(tx, tz) {
    var sc = _getScene();
    if (!sc) return null;

    var geo  = new THREE.CircleGeometry(1.5, 20);
    var mat  = new THREE.MeshBasicMaterial({
      color: 0xFF0000,
      transparent: true,
      opacity: 0.75,
      depthWrite: false,
      side: THREE.DoubleSide
    });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(tx, 0.05, tz);
    sc.add(mesh);

    var ind = { mesh: mesh, mat: mat, life: 0, maxLife: WARNING_BEFORE_IMPACT };
    _indicators.push(ind);
    return ind;
  }

  /* ════════════════════════════════════════════════════════════════
     SMOKE TRAIL PARTICLE
  ════════════════════════════════════════════════════════════════ */
  function _spawnSmoke(x, y, z) {
    var sc = _getScene();
    if (!sc) return;

    var geo  = new THREE.SphereGeometry(0.07 + Math.random() * 0.09, 4, 4);
    var mat  = new THREE.MeshBasicMaterial({
      color: SMOKE_COLOR,
      transparent: true,
      opacity: 0.55
    });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, z);
    sc.add(mesh);

    _smokeParticles.push({
      mesh    : mesh,
      mat     : mat,
      life    : 0,
      maxLife : 0.8 + Math.random() * 0.5,
      vx      : (Math.random() - 0.5) * 0.4,
      vy      : 0.3 + Math.random() * 0.5,
      vz      : (Math.random() - 0.5) * 0.4
    });
  }

  /* ════════════════════════════════════════════════════════════════
     BLAST HANDLER
  ════════════════════════════════════════════════════════════════ */
  function _handleBlast(tx, tz) {
    _playExplosion();

    var player = _getPlayer();
    if (player && player.position) {
      var dx   = player.position.x - tx;
      var dz   = player.position.z - tz;
      var dist = Math.sqrt(dx * dx + dz * dz);

      var dmg = 0;
      if      (dist <= BLAST_R1) { dmg = BLAST_D1; }
      else if (dist <= BLAST_R2) { dmg = BLAST_D2; }
      else if (dist <= BLAST_R3) { dmg = BLAST_D3; }

      if (dmg > 0) {
        _dealDamage(dmg);
        _showIncomingHUD();
      }
    }

    /* debris smoke puffs */
    for (var i = 0; i < 12; i++) {
      _spawnSmoke(
        tx + (Math.random() - 0.5) * 2,
        0.2 + Math.random() * 1.0,
        tz + (Math.random() - 0.5) * 2
      );
    }
  }

  /* ════════════════════════════════════════════════════════════════
     SHELL LAUNCH
  ════════════════════════════════════════════════════════════════ */
  function _fireShell(team) {
    var sc = _getScene();
    if (!sc) return;

    var player = _getPlayer();
    if (!player || !player.position) return;

    /* target with spread; accuracy improves each shot */
    var spread = team.currentSpread;
    var tx = player.position.x + (Math.random() * 2 - 1) * spread;
    var tz = player.position.z + (Math.random() * 2 - 1) * spread;
    team.currentSpread = Math.max(0.3, team.currentSpread - ACCURACY_STEP);
    team.shotsFired++;

    var sx = team.pos.x;
    var sz = team.pos.z;
    var sy = 1.2;  /* muzzle height */

    var peakY = (player.position.y || 0) + SHELL_PEAK_ABOVE;

    var geo  = new THREE.SphereGeometry(0.18, 7, 7);
    var mat  = new THREE.MeshLambertMaterial({ color: SHELL_COLOR });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(sx, sy, sz);
    sc.add(mesh);

    _playLaunch();

    _shells.push({
      mesh             : mesh,
      startX           : sx,
      startY           : sy,
      startZ           : sz,
      targetX          : tx,
      targetZ          : tz,
      peakY            : peakY,
      life             : 0,
      travelTime       : SHELL_TRAVEL_TIME,
      smokeTimer       : 0,
      indicatorSpawned : false,
      whistlePlayed    : false
    });
  }

  /* ════════════════════════════════════════════════════════════════
     TEAM DEATH / KILL HELPERS
  ════════════════════════════════════════════════════════════════ */
  function _removeMeshes(team) {
    var sc = _getScene();
    if (!sc) return;
    if (team.operatorMesh) { sc.remove(team.operatorMesh); }
    if (team.spotterMesh)  { sc.remove(team.spotterMesh);  }
    if (team.mortarGroup)  { sc.remove(team.mortarGroup);  }
    team.operatorMesh = null;
    team.spotterMesh  = null;
    team.mortarGroup  = null;
  }

  function _killTeam(team) {
    if (team.dead) return;
    team.dead = true;

    if (!team.scoreGiven) {
      team.scoreGiven = true;
      var p = _getPlayer();
      if (p && typeof p.score === 'number') { p.score += SCORE_REWARD; }
      _showToast('+500 — Mortar team eliminated!');
    }

    _removeMeshes(team);
  }

  /* ════════════════════════════════════════════════════════════════
     PUBLIC takeDamage — called by ray-cast hit system
     target: 'operator' | 'spotter' | 'tube'
     teamIndex: index in _teams array
  ════════════════════════════════════════════════════════════════ */
  function takeDamage(teamIndex, target, amount) {
    var team = _teams[teamIndex];
    if (!team || team.dead) return;

    if (target === 'operator') {
      team.operatorHP -= amount;
      if (team.operatorHP <= 0) {
        team.operatorHP    = 0;
        team.operatorAlive = false;
        if (team.operatorMesh) { team.operatorMesh.visible = false; }

        if (team.spotterAlive && team.tubeAlive) {
          /* spotter picks up tube — slower fire rate, reset timer */
          team.fireTimer = FIRE_INTERVAL_SLOW;
          _showToast('Operator down — spotter taking over!');
        } else {
          _checkTeamDead(teamIndex);
        }
      }
    } else if (target === 'spotter') {
      team.spotterHP -= amount;
      if (team.spotterHP <= 0) {
        team.spotterHP    = 0;
        team.spotterAlive = false;
        if (team.spotterMesh) { team.spotterMesh.visible = false; }
        _checkTeamDead(teamIndex);
      }
    } else if (target === 'tube') {
      team.tubeHP -= amount;
      if (team.tubeHP <= 0) {
        team.tubeHP    = 0;
        team.tubeAlive = false;
        if (team.mortarGroup) { team.mortarGroup.visible = false; }

        /* operators flee */
        team.fleeing = true;
        var angle = Math.random() * Math.PI * 2;
        team.fleeDir.set(Math.cos(angle), 0, Math.sin(angle));
        _showToast('Mortar tube destroyed — crew fleeing!');
      }
    }
  }

  function _checkTeamDead(teamIndex) {
    var team = _teams[teamIndex];
    if (!team) return;
    if (!team.operatorAlive && !team.spotterAlive) { _killTeam(team); }
  }

  /* ════════════════════════════════════════════════════════════════
     TEAM OBJECT FACTORY
  ════════════════════════════════════════════════════════════════ */
  function _createTeam(x, z) {
    var operatorMesh = _buildSoldierMesh(OPERATOR_COLOR, true);
    var spotterMesh  = _buildSpotterMesh();
    var mortarGroup  = _buildMortarMount();

    operatorMesh.position.set(x + 0.5, 0, z);
    spotterMesh.position.set(x - 0.8, 0, z + 0.3);
    mortarGroup.position.set(x, 0, z - 0.4);

    var sc = _getScene();
    if (sc) {
      sc.add(operatorMesh);
      sc.add(spotterMesh);
      sc.add(mortarGroup);
    }

    return {
      operatorMesh   : operatorMesh,
      spotterMesh    : spotterMesh,
      mortarGroup    : mortarGroup,
      pos            : new THREE.Vector3(x, 0, z),

      operatorHP     : OPERATOR_HP,
      spotterHP      : SPOTTER_HP,
      tubeHP         : TUBE_HP,

      operatorAlive  : true,
      spotterAlive   : true,
      tubeAlive      : true,

      fleeing        : false,
      fleeDir        : new THREE.Vector3(0, 0, 0),

      spotterPhase   : 0,
      spotterTimer   : 0,

      fireTimer      : FIRE_INTERVAL_NORMAL * 0.5,
      shotsFired     : 0,
      currentSpread  : FIRST_SHOT_SPREAD,

      dead           : false,
      scoreGiven     : false
    };
  }

  /* ════════════════════════════════════════════════════════════════
     SPAWN (public)
  ════════════════════════════════════════════════════════════════ */
  function spawn(x, y, z) {
    if (!_scene) {
      _scene  = (window.GameManager && window.GameManager.getScene)
                ? window.GameManager.getScene()
                : window._gameScene;
      _camera = (window.GameManager && window.GameManager.getCamera)
                ? window.GameManager.getCamera()
                : window._camera;
    }

    var spawnX = (x !== undefined) ? x : 0;
    var spawnZ = (z !== undefined) ? z : 0;

    if (x === undefined) {
      var player = _getPlayer();
      if (player && player.position) {
        var angle = Math.random() * Math.PI * 2;
        var dist  = SPAWN_MIN_DIST + Math.random() * (SPAWN_MAX_DIST - SPAWN_MIN_DIST);
        spawnX = player.position.x + Math.cos(angle) * dist;
        spawnZ = player.position.z + Math.sin(angle) * dist;
      }
    }

    var team = _createTeam(spawnX, spawnZ);
    _teams.push(team);
    return team;
  }

  /* ════════════════════════════════════════════════════════════════
     UPDATE SUB-SYSTEMS
  ════════════════════════════════════════════════════════════════ */

  function _updateWaveSpawn() {
    var gm = window.GameManager;
    if (!gm || !gm.getCurrentWave) return;
    var wave = gm.getCurrentWave();
    if (wave < 6) return;

    /* wave 6, 10, 14, 18 … → every 4th wave from 6 */
    if ((wave - 6) % 4 !== 0) return;
    if (wave === _lastSpawnWave) return;
    _lastSpawnWave = wave;
    spawn();
  }

  function _updateTeams(delta) {
    var i, team, player, dx, dz, dist;

    for (i = _teams.length - 1; i >= 0; i--) {
      team = _teams[i];
      if (!team) continue;

      if (team.dead) {
        _teams.splice(i, 1);
        continue;
      }

      /* flee movement when tube is destroyed */
      if (team.fleeing) {
        team.pos.x += team.fleeDir.x * FLEE_SPEED * delta;
        team.pos.z += team.fleeDir.z * FLEE_SPEED * delta;

        if (team.operatorMesh) {
          team.operatorMesh.position.set(team.pos.x + 0.5, 0, team.pos.z);
        }
        if (team.spotterMesh) {
          team.spotterMesh.position.set(team.pos.x - 0.8, 0, team.pos.z + 0.3);
        }

        player = _getPlayer();
        if (player && player.position) {
          dx   = team.pos.x - player.position.x;
          dz   = team.pos.z - player.position.z;
          dist = Math.sqrt(dx * dx + dz * dz);
          if (dist > 80) {
            _removeMeshes(team);
            team.dead = true;
          }
        }
        continue;
      }

      /* spotter looks at player */
      player = _getPlayer();
      if (player && player.position && team.spotterMesh) {
        team.spotterMesh.lookAt(
          player.position.x,
          team.spotterMesh.position.y,
          player.position.z
        );
      }

      /* spotter signal bob */
      team.spotterTimer += delta;
      if (team.spotterTimer > 2.0) {
        team.spotterTimer = 0;
        team.spotterPhase = (team.spotterPhase === 0) ? 1 : 0;
        if (team.spotterMesh) {
          team.spotterMesh.position.y = (team.spotterPhase === 1) ? 0.06 : 0;
        }
      }

      /* fire control — needs tube plus at least one crew member */
      if (!team.tubeAlive) continue;
      if (!team.operatorAlive && !team.spotterAlive) continue;

      team.fireTimer -= delta;
      if (team.fireTimer <= 0) {
        var interval = team.operatorAlive ? FIRE_INTERVAL_NORMAL : FIRE_INTERVAL_SLOW;
        team.fireTimer = interval;
        _fireShell(team);
      }
    }
  }

  function _updateShells(delta) {
    var i, s, t, px, pz, py, baseY, arcY, timeLeft, sc;

    for (i = _shells.length - 1; i >= 0; i--) {
      s = _shells[i];
      s.life += delta;
      t = Math.min(s.life / s.travelTime, 1.0);

      /* parabolic arc interpolation */
      px    = s.startX + (s.targetX - s.startX) * t;
      pz    = s.startZ + (s.targetZ - s.startZ) * t;
      baseY = s.startY * (1 - t);
      arcY  = 4 * s.peakY * t * (1 - t);
      py    = baseY + arcY;

      s.mesh.position.set(px, py, pz);

      /* smoke trail */
      s.smokeTimer += delta;
      if (s.smokeTimer > 0.05) {
        s.smokeTimer = 0;
        _spawnSmoke(px, py, pz);
      }

      /* landing indicator appears WARNING_BEFORE_IMPACT s before impact */
      timeLeft = s.travelTime - s.life;
      if (!s.indicatorSpawned && timeLeft <= WARNING_BEFORE_IMPACT) {
        s.indicatorSpawned = true;
        _spawnIndicator(s.targetX, s.targetZ);
      }

      /* whistle starts at apex (t=0.5) */
      if (!s.whistlePlayed && t >= 0.5) {
        s.whistlePlayed = true;
        _playWhistle();
      }

      /* impact */
      if (t >= 1.0) {
        sc = _getScene();
        if (sc) { sc.remove(s.mesh); }
        _shells.splice(i, 1);
        _handleBlast(s.targetX, s.targetZ);
      }
    }
  }

  function _updateIndicators(delta) {
    var i, ind, phase, sc;

    for (i = _indicators.length - 1; i >= 0; i--) {
      ind = _indicators[i];
      ind.life += delta;

      /* flash by oscillating opacity */
      phase = ind.life / ind.maxLife;
      ind.mat.opacity = 0.4 + 0.55 * Math.abs(Math.sin(phase * Math.PI * 6));

      if (ind.life >= ind.maxLife) {
        sc = _getScene();
        if (sc) { sc.remove(ind.mesh); }
        _indicators.splice(i, 1);
      }
    }
  }

  function _updateSmoke(delta) {
    var i, p, t, sc;

    for (i = _smokeParticles.length - 1; i >= 0; i--) {
      p = _smokeParticles[i];
      p.life += delta;
      t = p.life / p.maxLife;

      p.mesh.position.x += p.vx * delta;
      p.mesh.position.y += p.vy * delta;
      p.mesh.position.z += p.vz * delta;
      p.mat.opacity = 0.55 * (1 - t);

      if (p.life >= p.maxLife) {
        sc = _getScene();
        if (sc) { sc.remove(p.mesh); }
        _smokeParticles.splice(i, 1);
      }
    }
  }

  /* ════════════════════════════════════════════════════════════════
     INIT (public)
  ════════════════════════════════════════════════════════════════ */
  function init(scene, camera) {
    _scene  = scene  || (window.GameManager && window.GameManager.getScene
              ? window.GameManager.getScene()
              : window._gameScene);
    _camera = camera || (window.GameManager && window.GameManager.getCamera
              ? window.GameManager.getCamera()
              : window._camera);

    _teams          = [];
    _shells         = [];
    _indicators     = [];
    _smokeParticles = [];
    _lastSpawnWave  = -999;
    _initialized    = true;
  }

  /* ════════════════════════════════════════════════════════════════
     UPDATE (public)
  ════════════════════════════════════════════════════════════════ */
  function update(delta) {
    if (!_scene) {
      _scene  = (window.GameManager && window.GameManager.getScene)
                ? window.GameManager.getScene()
                : window._gameScene;
      _camera = (window.GameManager && window.GameManager.getCamera)
                ? window.GameManager.getCamera()
                : window._camera;
    }

    _updateWaveSpawn();
    _updateTeams(delta);
    _updateShells(delta);
    _updateIndicators(delta);
    _updateSmoke(delta);
  }

  /* ════════════════════════════════════════════════════════════════
     RESET (public)
  ════════════════════════════════════════════════════════════════ */
  function reset() {
    var sc = _getScene();
    var i;

    for (i = 0; i < _teams.length; i++) {
      if (sc) {
        if (_teams[i].operatorMesh) { sc.remove(_teams[i].operatorMesh); }
        if (_teams[i].spotterMesh)  { sc.remove(_teams[i].spotterMesh);  }
        if (_teams[i].mortarGroup)  { sc.remove(_teams[i].mortarGroup);  }
      }
    }
    for (i = 0; i < _shells.length; i++) {
      if (sc && _shells[i].mesh) { sc.remove(_shells[i].mesh); }
    }
    for (i = 0; i < _indicators.length; i++) {
      if (sc && _indicators[i].mesh) { sc.remove(_indicators[i].mesh); }
    }
    for (i = 0; i < _smokeParticles.length; i++) {
      if (sc && _smokeParticles[i].mesh) { sc.remove(_smokeParticles[i].mesh); }
    }

    _teams          = [];
    _shells         = [];
    _indicators     = [];
    _smokeParticles = [];
    _lastSpawnWave  = -999;
  }

  /* ════════════════════════════════════════════════════════════════
     PUBLIC API
  ════════════════════════════════════════════════════════════════ */
  return {
    init       : init,
    update     : update,
    spawn      : spawn,
    reset      : reset,
    takeDamage : takeDamage
  };

})();
