(function (window) {
  'use strict';

  // ─── Constants ───────────────────────────────────────────────────────────────
  var ZOMBIE_TYPES = {
    WALKER:  { color: 0x4A2A1A, speed: 2,   hp: 50,  scale: 1.0, name: 'WALKER'  },
    RUNNER:  { color: 0x2A1A0A, speed: 8,   hp: 30,  scale: 1.0, name: 'RUNNER'  },
    CRAWLER: { color: 0x3A1A0A, speed: 1.5, hp: 40,  scale: 1.0, name: 'CRAWLER' },
    TANK:    { color: 0x1A0A00, speed: 4,   hp: 200, scale: 1.8, name: 'TANK'    }
  };

  var WAVE_DEFS = [
    /* W1  */ [{ type: 'WALKER',  count: 5  }],
    /* W2  */ [{ type: 'WALKER',  count: 8  }, { type: 'RUNNER',  count: 1 }],
    /* W3  */ [{ type: 'WALKER',  count: 10 }, { type: 'RUNNER',  count: 2 }],
    /* W4  */ [{ type: 'CRAWLER', count: 12 }],
    /* W5  */ [{ type: 'TANK',    count: 1  }, { type: 'WALKER',  count: 5 }],
    /* W6  */ [{ type: 'WALKER',  count: 14 }, { type: 'RUNNER',  count: 4 }, { type: 'CRAWLER', count: 3 }],
    /* W7  */ [{ type: 'TANK',    count: 2  }, { type: 'RUNNER',  count: 6 }],
    /* W8  */ [{ type: 'CRAWLER', count: 15 }, { type: 'RUNNER',  count: 5 }, { type: 'WALKER',  count: 8 }],
    /* W9  */ [{ type: 'TANK',    count: 3  }, { type: 'CRAWLER', count: 8 }, { type: 'RUNNER',  count: 8 }],
    /* W10 */ [{ type: 'TANK',    count: 4  }, { type: 'RUNNER',  count: 10 }, { type: 'CRAWLER', count: 10 }, { type: 'WALKER', count: 10 }]
  ];

  var WEAPON_DEFS = {
    SHOTGUN:  { ammo: 48, spread: true,   arcKills: 3,  name: 'SHOTGUN'  },
    MOLOTOV:  { ammo: 4,  fire: true,     radius: 8,    duration: 10, name: 'MOLOTOV' },
    CHAINSAW: { ammo: 1,  melee: true,    kps: 10,      fuelTime: 5,  name: 'CHAINSAW' },
    CLAYMORE: { ammo: 3,  placeable: true, triggerRange: 6, name: 'CLAYMORE' }
  };

  var KEY_ACTIVATE_Z = 90; // 'z'
  var KEY_ACTIVATE_O = 79; // 'o'
  var ACTIVATE_WINDOW = 400;
  var BARRICADE_MAX_HP = 3;
  var BARRICADE_REINFORCE_TIME = 4000;
  var BARRICADE_REINFORCE_COST = 2;
  var HELICOPTER_CRATE_INTERVAL = 2; // every 2 waves
  var GENERATOR_REPAIR_TIME = 10000;
  var BATTERY_DRAIN_TIME = 180000; // 3 minutes
  var NOISE_SHOOT_RADIUS = 30;
  var NOISE_MOLOTOV_RADIUS = 20;
  var WAVE_INTERMISSION = 30000;
  var SURVIVOR_REWARD = 200;
  var MAX_WAVES = 10;

  // ─── Module ──────────────────────────────────────────────────────────────────
  function ZombieOutbreak(scene, camera, renderer) {
    this.scene    = scene;
    this.camera   = camera;
    this.renderer = renderer;
    this.active   = false;

    this.currentWave      = 0;
    this.zombies          = [];
    this.barricades       = [];
    this.claymores        = [];
    this.fireZones        = [];
    this.supplyCrates     = [];
    this.resources        = 0;
    this.score            = 0;
    this.ammo             = WEAPON_DEFS.SHOTGUN.ammo;
    this.currentWeapon    = 'SHOTGUN';
    this.chainsawActive   = false;
    this.chainsawFuel     = WEAPON_DEFS.CHAINSAW.fuelTime;
    this.generatorOn      = true;
    this.torchOn          = true;
    this.batteryRemaining = BATTERY_DRAIN_TIME;
    this.waveTimer        = 0;
    this.waveIntermission = false;
    this.intermissionTimer= 0;
    this.survivorSpawned  = false;
    this.survivorEscorted = false;
    this.survivorMesh     = null;
    this.survivorWaveFlag = false;
    this.generatorRepairing = false;
    this.generatorRepairTimer = 0;
    this.reinforcingIdx   = -1;
    this.reinforceTimer   = 0;
    this.gameOver         = false;
    this.victory          = false;

    // HUD element
    this.hudEl = null;
    this.bannerEl = null;

    // Key state
    this.keys = {};
    this.zPressTime = 0;
    this.oPressTime = 0;
    this.fKeyHeld   = false;

    // Three.js groups
    this.group       = null;
    this.baseGroup   = null;
    this.zombieGroup = null;
    this.envGroup    = null;

    // Lights
    this.torchLight    = null;
    this.generatorLight= null;
    this.ambientLight  = null;
    this.outsideDark   = null;

    // Timers / clocks
    this._clock   = null;
    this._animId  = null;
    this._boundKey = null;
    this._boundKeyUp = null;
    this._boundClick = null;
    this._boundUpdate = null;

    // Noise sources (for attraction)
    this.noiseShootPos   = null;
    this.noiseShootTimer = 0;
    this.noiseMolotovPos = null; // persistent while fire zone alive

    // Wave announcement cooldown
    this._bannerTimeout = null;
  }

  // ─── Init ───────────────────────────────────────────────────────────────────
  ZombieOutbreak.prototype.init = function () {
    var self = this;
    if (!window.THREE) { console.warn('ZombieOutbreak: THREE not found'); return; }

    this.group       = new window.THREE.Group();
    this.baseGroup   = new window.THREE.Group();
    this.zombieGroup = new window.THREE.Group();
    this.envGroup    = new window.THREE.Group();
    this.group.add(this.baseGroup, this.zombieGroup, this.envGroup);
    this.scene.add(this.group);

    this._clock = new window.THREE.Clock();

    this._buildBase();
    this._buildHUD();

    // Ambient darkness outside
    this.ambientLight = new window.THREE.AmbientLight(0x111122, 0.3);
    this.scene.add(this.ambientLight);

    // Torch at base
    this.torchLight = new window.THREE.PointLight(0xFFAA44, 1.5, 25);
    this.torchLight.position.set(0, 4, 0);
    this.baseGroup.add(this.torchLight);

    // Bind input
    this._boundKey   = function (e) { self._onKeyDown(e); };
    this._boundKeyUp = function (e) { self._onKeyUp(e);   };
    this._boundClick = function (e) { self._onClick(e);   };
    window.addEventListener('keydown', this._boundKey);
    window.addEventListener('keyup',   this._boundKeyUp);
    window.addEventListener('click',   this._boundClick);

    // Start update loop
    this._boundUpdate = function () { self._update(); };
    this._animId = requestAnimationFrame(this._boundUpdate);

    this._showBanner('ZOMBIE OUTBREAK — SURVIVE 10 WAVES!\nPress Z+O to activate');
    this._updateHUD();
  };

  // ─── Base Construction ───────────────────────────────────────────────────────
  ZombieOutbreak.prototype._buildBase = function () {
    var THREE = window.THREE;

    // Safe house
    var houseGeo  = new THREE.BoxGeometry(12, 4, 12);
    var houseMat  = new THREE.MeshLambertMaterial({ color: 0x445544 });
    var houseMesh = new THREE.Mesh(houseGeo, houseMat);
    houseMesh.position.set(0, 2, 0);
    this.baseGroup.add(houseMesh);

    // Ground
    var groundGeo  = new THREE.BoxGeometry(200, 0.2, 200);
    var groundMat  = new THREE.MeshLambertMaterial({ color: 0x223322 });
    var groundMesh = new THREE.Mesh(groundGeo, groundMat);
    groundMesh.position.set(0, -0.1, 0);
    this.envGroup.add(groundMesh);

    // Barricades: N, S, E, W
    var barricadePositions = [
      { x: 0,    z: -8,  ry: 0            },
      { x: 0,    z:  8,  ry: 0            },
      { x: -8,   z:  0,  ry: Math.PI / 2  },
      { x:  8,   z:  0,  ry: Math.PI / 2  }
    ];
    var barGeo = new THREE.BoxGeometry(6, 2, 0.5);
    for (var i = 0; i < barricadePositions.length; i++) {
      var bp   = barricadePositions[i];
      var bMat = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
      var bMesh = new THREE.Mesh(barGeo, bMat);
      bMesh.position.set(bp.x, 1, bp.z);
      bMesh.rotation.y = bp.ry;
      this.baseGroup.add(bMesh);
      this.barricades.push({
        mesh: bMesh,
        hp:   BARRICADE_MAX_HP,
        maxHp: BARRICADE_MAX_HP,
        alive: true,
        reinforcing: false
      });
    }

    // Generator
    var genGeo  = new THREE.BoxGeometry(1.5, 1, 1);
    var genMat  = new THREE.MeshLambertMaterial({ color: 0x666666 });
    this.generatorMesh = new THREE.Mesh(genGeo, genMat);
    this.generatorMesh.position.set(4, 0.5, 4);
    this.baseGroup.add(this.generatorMesh);

    this.generatorLight = new THREE.PointLight(0x88FFAA, 1.0, 12);
    this.generatorLight.position.set(4, 2, 4);
    this.baseGroup.add(this.generatorLight);
  };

  // ─── HUD ─────────────────────────────────────────────────────────────────────
  ZombieOutbreak.prototype._buildHUD = function () {
    var hud = document.createElement('div');
    hud.id = 'zombie-outbreak-hud';
    hud.style.cssText = [
      'position:fixed',
      'top:8px',
      'left:50%',
      'transform:translateX(-50%)',
      'background:rgba(0,0,0,0.75)',
      'color:#00FF88',
      'font:bold 13px monospace',
      'padding:5px 14px',
      'border:1px solid #00AA55',
      'border-radius:4px',
      'pointer-events:none',
      'z-index:9999',
      'white-space:nowrap'
    ].join(';');
    document.body.appendChild(hud);
    this.hudEl = hud;

    var banner = document.createElement('div');
    banner.id = 'zombie-outbreak-banner';
    banner.style.cssText = [
      'position:fixed',
      'top:20%',
      'left:50%',
      'transform:translateX(-50%)',
      'background:rgba(0,0,0,0.88)',
      'color:#FF4444',
      'font:bold 22px monospace',
      'padding:16px 32px',
      'border:2px solid #FF0000',
      'border-radius:6px',
      'pointer-events:none',
      'z-index:10000',
      'text-align:center',
      'white-space:pre-line',
      'display:none'
    ].join(';');
    document.body.appendChild(banner);
    this.bannerEl = banner;
  };

  ZombieOutbreak.prototype._updateHUD = function () {
    if (!this.hudEl) return;
    var aliveBarricades = 0;
    for (var i = 0; i < this.barricades.length; i++) {
      if (this.barricades[i].alive) aliveBarricades++;
    }
    var nextTime = '00:00';
    if (this.waveIntermission) {
      var rem = Math.max(0, Math.ceil((WAVE_INTERMISSION - this.intermissionTimer) / 1000));
      var mm = Math.floor(rem / 60);
      var ss = rem % 60;
      nextTime = (mm < 10 ? '0' : '') + mm + ':' + (ss < 10 ? '0' : '') + ss;
    }
    var wave = Math.min(this.currentWave + 1, MAX_WAVES);
    var waveDisplay = this.currentWave >= MAX_WAVES ? MAX_WAVES : wave;
    this.hudEl.textContent =
      'OUTBREAK' +
      ' [WAVE: ' + waveDisplay + '/' + MAX_WAVES + ']' +
      ' [ZOMBIES: ' + this.zombies.length + ']' +
      ' [BARRICADES: ' + aliveBarricades + '/4]' +
      ' [AMMO: ' + this.ammo + ']' +
      ' [RES: ' + this.resources + ']' +
      (this.waveIntermission ? ' | NEXT WAVE: ' + nextTime : '') +
      (this.generatorOn ? ' [GEN:ON]' : ' [GEN:OFF]') +
      ' | ' + this.currentWeapon;
  };

  ZombieOutbreak.prototype._showBanner = function (text, duration) {
    if (!this.bannerEl) return;
    if (this._bannerTimeout) clearTimeout(this._bannerTimeout);
    this.bannerEl.textContent = text;
    this.bannerEl.style.display = 'block';
    var self = this;
    this._bannerTimeout = setTimeout(function () {
      if (self.bannerEl) self.bannerEl.style.display = 'none';
    }, duration || 3000);
  };

  // ─── Key Handling ─────────────────────────────────────────────────────────────
  ZombieOutbreak.prototype._onKeyDown = function (e) {
    var k = e.keyCode;
    this.keys[k] = true;

    // Activation: Z + O within 400ms
    if (!this.active) {
      if (k === KEY_ACTIVATE_Z) { this.zPressTime = Date.now(); }
      if (k === KEY_ACTIVATE_O) { this.oPressTime = Date.now(); }
      if (this.keys[KEY_ACTIVATE_Z] && this.keys[KEY_ACTIVATE_O]) {
        var diff = Math.abs(this.zPressTime - this.oPressTime);
        if (diff <= ACTIVATE_WINDOW) { this._activate(); }
      }
      return;
    }

    if (!this.active) return;

    // Weapon select 1-4
    if (k === 49) { this._selectWeapon('SHOTGUN'); }
    if (k === 50) { this._selectWeapon('MOLOTOV'); }
    if (k === 51) { this._selectWeapon('CHAINSAW'); }
    if (k === 52) { this._selectWeapon('CLAYMORE'); }

    // Chainsaw F key
    if (k === 70) { this.fKeyHeld = true; }

    // Reinforce R key
    if (k === 82) { this._tryReinforce(); }

    // Repair generator E key
    if (k === 69) { this._tryRepairGenerator(); }
  };

  ZombieOutbreak.prototype._onKeyUp = function (e) {
    var k = e.keyCode;
    this.keys[k] = false;
    if (k === 70) { this.fKeyHeld = false; this.chainsawActive = false; }
  };

  ZombieOutbreak.prototype._onClick = function (e) {
    if (!this.active) return;
    this._fireWeapon();
  };

  // ─── Activation ──────────────────────────────────────────────────────────────
  ZombieOutbreak.prototype._activate = function () {
    if (this.active) return;
    this.active = true;
    this._showBanner('ZOMBIE OUTBREAK ACTIVATED!\nWave 1 starts NOW!', 3000);
    this._startWave();
  };

  // ─── Wave Management ─────────────────────────────────────────────────────────
  ZombieOutbreak.prototype._startWave = function () {
    if (this.currentWave >= MAX_WAVES) {
      this._victory();
      return;
    }
    this.waveIntermission = false;
    this.intermissionTimer = 0;
    this._showBanner('WAVE ' + (this.currentWave + 1) + ' INCOMING!\n' + this._waveDescription(), 4000);
    this._spawnWave(this.currentWave);

    // Helicopter crate drops every 2 waves
    if (this.currentWave > 0 && (this.currentWave % HELICOPTER_CRATE_INTERVAL) === 0) {
      this._dropHelicopterCrates();
    }

    // Survivor NPC appears at wave 3 and 7
    if ((this.currentWave === 2 || this.currentWave === 6) && !this.survivorEscorted) {
      this._spawnSurvivor();
    }
  };

  ZombieOutbreak.prototype._waveDescription = function () {
    if (this.currentWave >= WAVE_DEFS.length) return '';
    var defs = WAVE_DEFS[this.currentWave];
    var parts = [];
    for (var i = 0; i < defs.length; i++) {
      parts.push(defs[i].count + 'x ' + defs[i].type);
    }
    return parts.join(', ');
  };

  ZombieOutbreak.prototype._waveComplete = function () {
    this.currentWave++;
    if (this.currentWave >= MAX_WAVES) {
      this._victory();
      return;
    }
    this.waveIntermission = true;
    this.intermissionTimer = 0;
    this._showBanner('WAVE ' + this.currentWave + ' CLEAR!\nNext wave in 30s...', 4000);
  };

  // ─── Zombie Spawning ──────────────────────────────────────────────────────────
  ZombieOutbreak.prototype._spawnWave = function (waveIdx) {
    if (waveIdx >= WAVE_DEFS.length) return;
    var defs = WAVE_DEFS[waveIdx];
    for (var i = 0; i < defs.length; i++) {
      for (var j = 0; j < defs[i].count; j++) {
        this._spawnZombie(defs[i].type);
      }
    }
  };

  ZombieOutbreak.prototype._spawnZombie = function (type) {
    var THREE = window.THREE;
    var def   = ZOMBIE_TYPES[type];

    var geo  = new THREE.BoxGeometry(0.8, 1.8, 0.5);
    var mat  = new THREE.MeshLambertMaterial({ color: def.color });
    var mesh = new THREE.Mesh(geo, mat);

    // Spawn at random edge
    var angle = Math.random() * Math.PI * 2;
    var dist  = 55 + Math.random() * 10;
    mesh.position.set(
      Math.cos(angle) * dist,
      def.name === 'CRAWLER' ? 0.4 : 0.9,
      Math.sin(angle) * dist
    );

    // Apply scale
    var s = def.scale;
    if (def.name === 'CRAWLER') {
      mesh.scale.set(s, 0.4, s);
    } else {
      mesh.scale.set(s, s, s);
    }

    this.zombieGroup.add(mesh);

    var zombie = {
      mesh:      mesh,
      type:      type,
      hp:        def.hp * s,
      maxHp:     def.hp * s,
      speed:     def.speed,
      alive:     true,
      walkPhase: Math.random() * Math.PI * 2,
      erratic:   type === 'RUNNER' ? (Math.random() - 0.5) * 0.5 : 0,
      erraticTimer: 0,
      onFire:    false,
      fireTimer: 0
    };
    this.zombies.push(zombie);
    return zombie;
  };

  // ─── Helicopter Crate Drops ───────────────────────────────────────────────────
  ZombieOutbreak.prototype._dropHelicopterCrates = function () {
    var THREE = window.THREE;
    for (var i = 0; i < 3; i++) {
      var geo  = new THREE.BoxGeometry(0.6, 0.6, 0.6);
      var mat  = new THREE.MeshLambertMaterial({ color: 0xFFAA00, emissive: 0x442200 });
      var mesh = new THREE.Mesh(geo, mat);
      var angle = Math.random() * Math.PI * 2;
      var r     = 10 + Math.random() * 20;
      mesh.position.set(Math.cos(angle) * r, 0.3, Math.sin(angle) * r);
      this.envGroup.add(mesh);
      this.supplyCrates.push({ mesh: mesh, collected: false });
    }
  };

  // ─── Survivor NPC ────────────────────────────────────────────────────────────
  ZombieOutbreak.prototype._spawnSurvivor = function () {
    var THREE = window.THREE;
    this.survivorSpawned = true;
    var geo  = new THREE.BoxGeometry(0.6, 1.6, 0.4);
    var mat  = new THREE.MeshLambertMaterial({ color: 0xAA8855, emissive: 0x221100 });
    this.survivorMesh = new THREE.Mesh(geo, mat);
    var angle = Math.random() * Math.PI * 2;
    this.survivorMesh.position.set(Math.cos(angle) * 45, 0.8, Math.sin(angle) * 45);
    this.envGroup.add(this.survivorMesh);
    this._showBanner('SURVIVOR SPOTTED!\nEscort them to base for +200 score', 4000);
  };

  // ─── Weapons ─────────────────────────────────────────────────────────────────
  ZombieOutbreak.prototype._selectWeapon = function (weapon) {
    this.currentWeapon = weapon;
    if (weapon === 'SHOTGUN') { this.ammo = WEAPON_DEFS.SHOTGUN.ammo; }
    if (weapon === 'MOLOTOV') { this.ammo = WEAPON_DEFS.MOLOTOV.ammo; }
    if (weapon === 'CHAINSAW') { this.ammo = 1; this.chainsawFuel = WEAPON_DEFS.CHAINSAW.fuelTime; }
    if (weapon === 'CLAYMORE') { this.ammo = WEAPON_DEFS.CLAYMORE.ammo; }
    this._updateHUD();
  };

  ZombieOutbreak.prototype._fireWeapon = function () {
    if (this.gameOver || this.victory) return;
    var w = this.currentWeapon;

    if (w === 'SHOTGUN') {
      this._fireShotgun();
    } else if (w === 'MOLOTOV') {
      this._throwMolotov();
    } else if (w === 'CLAYMORE') {
      this._placeClaymore();
    }
    this._updateHUD();
  };

  ZombieOutbreak.prototype._fireShotgun = function () {
    if (this.ammo <= 0) { this._showBanner('SHOTGUN EMPTY!', 1500); return; }
    this.ammo--;
    // Noise attraction
    this.noiseShootPos   = this._playerPos();
    this.noiseShootTimer = 2000;

    // Kill up to 3 zombies in arc (front 60 degrees)
    var killed = 0;
    var ppos = this._playerPos();
    var forward = this._playerForward();

    for (var i = 0; i < this.zombies.length && killed < 3; i++) {
      var z = this.zombies[i];
      if (!z.alive) continue;
      var dx = z.mesh.position.x - ppos.x;
      var dz = z.mesh.position.z - ppos.z;
      var dist2 = Math.sqrt(dx * dx + dz * dz);
      if (dist2 > 15) continue;

      // Angle to zombie
      var dxn = dx / dist2;
      var dzn = dz / dist2;
      var dot = dxn * forward.x + dzn * forward.z;
      if (dot > 0.5) { // within ~60-degree cone
        z.hp -= 100;
        if (z.hp <= 0) { this._killZombie(i); killed++; }
      }
    }
  };

  ZombieOutbreak.prototype._throwMolotov = function () {
    if (this.ammo <= 0) { this._showBanner('NO MOLOTOVS!', 1500); return; }
    this.ammo--;
    var THREE = window.THREE;
    // Spawn fire zone where player is aiming (12 units ahead)
    var ppos = this._playerPos();
    var fwd  = this._playerForward();
    var fx   = ppos.x + fwd.x * 12;
    var fz   = ppos.z + fwd.z * 12;

    var geo  = new THREE.SphereGeometry(0.4, 6, 6);
    var mat  = new THREE.MeshLambertMaterial({ color: 0xFF6600, emissive: 0xFF2200 });
    var fireMarker = new THREE.Mesh(geo, mat);
    fireMarker.position.set(fx, 0.5, fz);
    this.envGroup.add(fireMarker);

    var fireLight = new THREE.PointLight(0xFF4400, 2, WEAPON_DEFS.MOLOTOV.radius);
    fireLight.position.set(fx, 1, fz);
    this.envGroup.add(fireLight);

    var fz_obj = {
      x:      fx,
      z:      fz,
      radius: WEAPON_DEFS.MOLOTOV.radius,
      timer:  0,
      maxTime: WEAPON_DEFS.MOLOTOV.duration * 1000,
      marker: fireMarker,
      light:  fireLight,
      active: true
    };
    this.fireZones.push(fz_obj);
    // Noise
    this.noiseMolotovPos = { x: fx, z: fz };
  };

  ZombieOutbreak.prototype._placeClaymore = function () {
    if (this.ammo <= 0) { this._showBanner('NO CLAYMORES!', 1500); return; }
    this.ammo--;
    var THREE = window.THREE;
    var ppos = this._playerPos();
    var fwd  = this._playerForward();
    var cx   = ppos.x + fwd.x * 3;
    var cz   = ppos.z + fwd.z * 3;

    var geo  = new THREE.BoxGeometry(0.4, 0.3, 0.1);
    var mat  = new THREE.MeshLambertMaterial({ color: 0x228822 });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(cx, 0.15, cz);
    this.envGroup.add(mesh);

    this.claymores.push({ x: cx, z: cz, mesh: mesh, triggered: false, triggerRange: WEAPON_DEFS.CLAYMORE.triggerRange });
  };

  ZombieOutbreak.prototype._triggerClaymore = function (idx) {
    var c = this.claymores[idx];
    if (c.triggered) return;
    c.triggered = true;
    this.envGroup.remove(c.mesh);
    // Kill zombies in range
    for (var i = 0; i < this.zombies.length; i++) {
      var z = this.zombies[i];
      if (!z.alive) continue;
      var dx = z.mesh.position.x - c.x;
      var dz = z.mesh.position.z - c.z;
      if (Math.sqrt(dx * dx + dz * dz) <= c.triggerRange) {
        z.hp = 0;
        this._killZombie(i);
      }
    }
  };

  ZombieOutbreak.prototype._chainsawSwipe = function (dt) {
    if (!this.fKeyHeld || this.currentWeapon !== 'CHAINSAW') return;
    this.chainsawActive = true;
    this.chainsawFuel   = Math.max(0, this.chainsawFuel - dt);

    var ppos   = this._playerPos();
    var killsThisFrame = WEAPON_DEFS.CHAINSAW.kps * dt;

    for (var i = 0; i < this.zombies.length; i++) {
      var z = this.zombies[i];
      if (!z.alive) continue;
      var dx = z.mesh.position.x - ppos.x;
      var dz = z.mesh.position.z - ppos.z;
      if (Math.sqrt(dx * dx + dz * dz) <= 2) {
        z.hp -= killsThisFrame * z.maxHp;
        if (z.hp <= 0) this._killZombie(i);
      }
    }

    if (this.chainsawFuel <= 0) {
      this.chainsawActive = false;
      this.fKeyHeld = false;
      this._showBanner('CHAINSAW OUT OF FUEL!', 2000);
    }
  };

  // ─── Barricade Management ─────────────────────────────────────────────────────
  ZombieOutbreak.prototype._tryReinforce = function () {
    if (this.resources < BARRICADE_REINFORCE_COST) {
      this._showBanner('NOT ENOUGH RESOURCES (need ' + BARRICADE_REINFORCE_COST + ')', 1500);
      return;
    }
    // Find nearest collapsed barricade to reinforce
    var ppos = this._playerPos();
    var bestIdx = -1;
    var bestDist = 999;
    for (var i = 0; i < this.barricades.length; i++) {
      var b  = this.barricades[i];
      if (b.alive && b.hp >= b.maxHp) continue;
      var dx = b.mesh.position.x - ppos.x;
      var dz = b.mesh.position.z - ppos.z;
      var d  = Math.sqrt(dx * dx + dz * dz);
      if (d < bestDist) { bestDist = d; bestIdx = i; }
    }
    if (bestIdx === -1) { this._showBanner('NO BARRICADES TO REINFORCE', 1500); return; }
    if (bestDist > 15)  { this._showBanner('TOO FAR FROM BARRICADE', 1500); return; }

    this.reinforcingIdx = bestIdx;
    this.reinforceTimer = 0;
    this.resources -= BARRICADE_REINFORCE_COST;
    this._showBanner('REINFORCING BARRICADE...', BARRICADE_REINFORCE_TIME);
  };

  ZombieOutbreak.prototype._tryRepairGenerator = function () {
    if (this.generatorOn) { this._showBanner('GENERATOR OK', 1500); return; }
    if (this.generatorRepairing) { this._showBanner('ALREADY REPAIRING...', 1000); return; }
    var ppos = this._playerPos();
    var gx = this.generatorMesh.position.x;
    var gz = this.generatorMesh.position.z;
    var d  = Math.sqrt((ppos.x - gx) * (ppos.x - gx) + (ppos.z - gz) * (ppos.z - gz));
    if (d > 8) { this._showBanner('TOO FAR FROM GENERATOR', 1500); return; }
    this.generatorRepairing = true;
    this.generatorRepairTimer = 0;
    this._showBanner('REPAIRING GENERATOR (10s)...', GENERATOR_REPAIR_TIME);
  };

  // ─── Zombie Kill ─────────────────────────────────────────────────────────────
  ZombieOutbreak.prototype._killZombie = function (idx) {
    var z = this.zombies[idx];
    if (!z.alive) return;
    z.alive = false;
    this.zombieGroup.remove(z.mesh);
    this.score += 10;
  };

  // ─── Supply Crate Collection ─────────────────────────────────────────────────
  ZombieOutbreak.prototype._checkCrateCollection = function () {
    var ppos = this._playerPos();
    for (var i = 0; i < this.supplyCrates.length; i++) {
      var c = this.supplyCrates[i];
      if (c.collected) continue;
      var dx = c.mesh.position.x - ppos.x;
      var dz = c.mesh.position.z - ppos.z;
      if (Math.sqrt(dx * dx + dz * dz) < 2) {
        c.collected = true;
        this.envGroup.remove(c.mesh);
        this.resources++;
        this._showBanner('SUPPLY CRATE COLLECTED! Resources: ' + this.resources, 1500);
      }
    }
  };

  // ─── Survivor Escort ──────────────────────────────────────────────────────────
  ZombieOutbreak.prototype._updateSurvivor = function (dt) {
    if (!this.survivorSpawned || this.survivorEscorted || !this.survivorMesh) return;
    var ppos = this._playerPos();
    // Survivor walks toward player
    var sx = this.survivorMesh.position.x;
    var sz = this.survivorMesh.position.z;
    var dx = ppos.x - sx;
    var dz = ppos.z - sz;
    var dist = Math.sqrt(dx * dx + dz * dz);
    if (dist > 1) {
      this.survivorMesh.position.x += (dx / dist) * 2 * dt;
      this.survivorMesh.position.z += (dz / dist) * 2 * dt;
      // Waving animation
      this.survivorMesh.rotation.z = Math.sin(Date.now() * 0.005) * 0.3;
    }

    // Check if near base
    var bx = this.survivorMesh.position.x;
    var bz = this.survivorMesh.position.z;
    if (Math.sqrt(bx * bx + bz * bz) < 8) {
      this.survivorEscorted = true;
      this.envGroup.remove(this.survivorMesh);
      this.survivorMesh = null;
      this.score += SURVIVOR_REWARD;
      // Grant extra barricade HP
      for (var i = 0; i < this.barricades.length; i++) {
        this.barricades[i].maxHp = BARRICADE_MAX_HP + 1;
      }
      this._showBanner('SURVIVOR SAVED! +200 SCORE\nBarricades reinforced!', 4000);
    }
  };

  // ─── Zombie AI ───────────────────────────────────────────────────────────────
  ZombieOutbreak.prototype._updateZombies = function (dt) {
    var alive = [];
    for (var i = 0; i < this.zombies.length; i++) {
      if (this.zombies[i].alive) alive.push(this.zombies[i]);
    }
    this.zombies = alive;

    for (var i = 0; i < this.zombies.length; i++) {
      var z = this.zombies[i];
      if (!z.alive) continue;
      this._updateZombieAI(z, dt, i);
    }
  };

  ZombieOutbreak.prototype._updateZombieAI = function (z, dt, idx) {
    // Fire damage
    if (z.onFire) {
      z.fireTimer -= dt;
      z.hp -= 20 * dt;
      if (z.fireTimer <= 0) z.onFire = false;
      if (z.hp <= 0) { this._killZombie(idx); return; }
    }

    // Target: noise > player pos
    var target = this._getZombieTarget(z);
    var tx = target.x - z.mesh.position.x;
    var tz = target.z - z.mesh.position.z;
    var dist = Math.sqrt(tx * tx + tz * tz);

    if (dist < 0.5) return; // At target

    // Erratic path for runners
    if (z.type === 'RUNNER') {
      z.erraticTimer -= dt;
      if (z.erraticTimer <= 0) {
        z.erratic = (Math.random() - 0.5) * 1.2;
        z.erraticTimer = 0.5 + Math.random() * 0.5;
      }
    }

    var nx = tx / dist + (z.type === 'RUNNER' ? z.erratic : 0);
    var nz = tz / dist + (z.type === 'RUNNER' ? (Math.random() - 0.5) * 0.3 : 0);

    // Normalize again
    var nl = Math.sqrt(nx * nx + nz * nz);
    if (nl > 0) { nx /= nl; nz /= nl; }

    z.mesh.position.x += nx * z.speed * dt;
    z.mesh.position.z += nz * z.speed * dt;

    // Walker stumble animation
    if (z.type === 'WALKER') {
      z.walkPhase += dt * 3;
      z.mesh.rotation.z = Math.sin(z.walkPhase) * 0.15;
    }

    // Face direction of movement
    if (Math.abs(nx) > 0.01 || Math.abs(nz) > 0.01) {
      z.mesh.rotation.y = Math.atan2(nx, nz);
    }

    // Barricade collision / damage
    this._checkZombieBarricadeCollision(z, idx);

    // Attack base if close
    if (dist < 7) {
      this._zombieAtBase();
    }
  };

  ZombieOutbreak.prototype._getZombieTarget = function (z) {
    // Priority: noise > molotov noise > player position (base)
    if (this.noiseShootTimer > 0 && this.noiseShootPos) {
      var dx = z.mesh.position.x - this.noiseShootPos.x;
      var dz = z.mesh.position.z - this.noiseShootPos.z;
      if (Math.sqrt(dx * dx + dz * dz) < NOISE_SHOOT_RADIUS) {
        return this.noiseShootPos;
      }
    }
    if (this.noiseMolotovPos) {
      var dx2 = z.mesh.position.x - this.noiseMolotovPos.x;
      var dz2 = z.mesh.position.z - this.noiseMolotovPos.z;
      if (Math.sqrt(dx2 * dx2 + dz2 * dz2) < NOISE_MOLOTOV_RADIUS) {
        return this.noiseMolotovPos;
      }
    }
    // Head toward base center
    return { x: 0, z: 0 };
  };

  ZombieOutbreak.prototype._checkZombieBarricadeCollision = function (z, zIdx) {
    for (var i = 0; i < this.barricades.length; i++) {
      var b = this.barricades[i];
      if (!b.alive) continue;
      var bx = b.mesh.position.x;
      var bz = b.mesh.position.z;
      var dx = z.mesh.position.x - bx;
      var dz = z.mesh.position.z - bz;
      var d  = Math.sqrt(dx * dx + dz * dz);
      if (d < 4) {
        // Tank breaks barricades
        if (z.type === 'TANK') {
          b.hp--;
          if (b.hp <= 0) {
            b.alive = false;
            this.baseGroup.remove(b.mesh);
            this._showBanner('BARRICADE DESTROYED!', 2000);
          }
        } else {
          // Block zombie
          z.mesh.position.x = bx + (dx / d) * 4.2;
          z.mesh.position.z = bz + (dz / d) * 4.2;
        }
      }
    }
  };

  ZombieOutbreak.prototype._zombieAtBase = function () {
    // Atmosphere only — game over if player HP depleted (not implemented here as separate system)
  };

  // ─── Fire Zone Updates ────────────────────────────────────────────────────────
  ZombieOutbreak.prototype._updateFireZones = function (dt) {
    var activeZones = [];
    for (var i = 0; i < this.fireZones.length; i++) {
      var fz = this.fireZones[i];
      fz.timer += dt * 1000;
      if (fz.timer >= fz.maxTime) {
        fz.active = false;
        this.envGroup.remove(fz.marker);
        this.envGroup.remove(fz.light);
        // Clear molotov noise if this was the source
        if (this.noiseMolotovPos &&
            Math.abs(this.noiseMolotovPos.x - fz.x) < 0.1 &&
            Math.abs(this.noiseMolotovPos.z - fz.z) < 0.1) {
          this.noiseMolotovPos = null;
        }
        continue;
      }
      activeZones.push(fz);

      // Burn zombies in range
      for (var j = 0; j < this.zombies.length; j++) {
        var z = this.zombies[j];
        if (!z.alive) continue;
        var dx = z.mesh.position.x - fz.x;
        var dz = z.mesh.position.z - fz.z;
        if (Math.sqrt(dx * dx + dz * dz) <= fz.radius) {
          z.onFire   = true;
          z.fireTimer = 3;
        }
      }
    }
    this.fireZones = activeZones;
  };

  // ─── Claymore Auto-Trigger ────────────────────────────────────────────────────
  ZombieOutbreak.prototype._updateClaymores = function () {
    for (var ci = 0; ci < this.claymores.length; ci++) {
      var c = this.claymores[ci];
      if (c.triggered) continue;
      for (var zi = 0; zi < this.zombies.length; zi++) {
        var z = this.zombies[zi];
        if (!z.alive) continue;
        var dx = z.mesh.position.x - c.x;
        var dz = z.mesh.position.z - c.z;
        if (Math.sqrt(dx * dx + dz * dz) <= c.triggerRange) {
          this._triggerClaymore(ci);
          break;
        }
      }
    }
    // Remove triggered claymores from list
    var active = [];
    for (var i = 0; i < this.claymores.length; i++) {
      if (!this.claymores[i].triggered) active.push(this.claymores[i]);
    }
    this.claymores = active;
  };

  // ─── Night Cycle ─────────────────────────────────────────────────────────────
  ZombieOutbreak.prototype._updateNightCycle = function (dt) {
    this.batteryRemaining -= dt * 1000;
    if (this.batteryRemaining <= 0 && this.torchOn) {
      this.torchOn = false;
      if (this.torchLight) this.torchLight.intensity = 0.1;
      this._showBanner('BATTERY DEAD — TORCH DIM!', 3000);
    }
  };

  // ─── Generator ────────────────────────────────────────────────────────────────
  ZombieOutbreak.prototype._updateGenerator = function (dt) {
    if (this.generatorRepairing) {
      this.generatorRepairTimer += dt * 1000;
      if (this.generatorRepairTimer >= GENERATOR_REPAIR_TIME) {
        this.generatorRepairing = false;
        this.generatorOn = true;
        if (this.generatorLight) this.generatorLight.intensity = 1.0;
        this._showBanner('GENERATOR REPAIRED!', 2000);
      }
    }
  };

  // ─── Reinforce Barricade ─────────────────────────────────────────────────────
  ZombieOutbreak.prototype._updateReinforce = function (dt) {
    if (this.reinforcingIdx === -1) return;
    this.reinforceTimer += dt * 1000;
    if (this.reinforceTimer >= BARRICADE_REINFORCE_TIME) {
      var b = this.barricades[this.reinforcingIdx];
      b.hp    = b.maxHp;
      b.alive = true;
      if (!this.baseGroup.children.includes(b.mesh)) {
        this.baseGroup.add(b.mesh);
      }
      b.mesh.material.color.setHex(0x8B4513);
      this.reinforcingIdx = -1;
      this.reinforceTimer = 0;
      this._showBanner('BARRICADE REINFORCED!', 2000);
    }
  };

  // ─── Noise Decay ─────────────────────────────────────────────────────────────
  ZombieOutbreak.prototype._updateNoise = function (dt) {
    if (this.noiseShootTimer > 0) {
      this.noiseShootTimer -= dt * 1000;
      if (this.noiseShootTimer <= 0) {
        this.noiseShootPos = null;
      }
    }
  };

  // ─── Wave Intermission ────────────────────────────────────────────────────────
  ZombieOutbreak.prototype._updateIntermission = function (dt) {
    if (!this.waveIntermission) return;
    this.intermissionTimer += dt * 1000;
    if (this.intermissionTimer >= WAVE_INTERMISSION) {
      this._startWave();
    }
  };

  // ─── Victory / Game Over ─────────────────────────────────────────────────────
  ZombieOutbreak.prototype._victory = function () {
    this.victory = true;
    this._showBanner('YOU SURVIVED ALL 10 WAVES!\nFINAL SCORE: ' + this.score, 9999999);
  };

  ZombieOutbreak.prototype._gameOver = function () {
    this.gameOver = true;
    this._showBanner('OVERRUN!\nFINAL SCORE: ' + this.score, 9999999);
  };

  // ─── Player Helpers ───────────────────────────────────────────────────────────
  ZombieOutbreak.prototype._playerPos = function () {
    if (this.camera) {
      return { x: this.camera.position.x, z: this.camera.position.z };
    }
    return { x: 0, z: 0 };
  };

  ZombieOutbreak.prototype._playerForward = function () {
    if (this.camera) {
      var dir = new window.THREE.Vector3();
      this.camera.getWorldDirection(dir);
      return { x: dir.x, z: dir.z };
    }
    return { x: 0, z: -1 };
  };

  // ─── Main Update ─────────────────────────────────────────────────────────────
  ZombieOutbreak.prototype._update = function () {
    var self = this;
    this._animId = requestAnimationFrame(function () { self._update(); });

    if (!this._clock) return;
    var dt = this._clock.getDelta();
    if (dt > 0.1) dt = 0.1; // clamp

    if (!this.active || this.gameOver || this.victory) {
      return;
    }

    // Zombie updates
    this._updateZombies(dt);

    // Fire zones
    this._updateFireZones(dt);

    // Claymores
    this._updateClaymores();

    // Chainsaw
    this._chainsawSwipe(dt);

    // Night cycle
    this._updateNightCycle(dt);

    // Generator
    this._updateGenerator(dt);

    // Reinforce
    this._updateReinforce(dt);

    // Noise decay
    this._updateNoise(dt);

    // Crate collection
    this._checkCrateCollection();

    // Survivor
    this._updateSurvivor(dt);

    // Wave complete check
    if (!this.waveIntermission && this.zombies.length === 0 && this.currentWave < MAX_WAVES) {
      this._waveComplete();
    }

    // Intermission countdown
    this._updateIntermission(dt);

    // HUD
    this._updateHUD();
  };

  // ─── Destroy ─────────────────────────────────────────────────────────────────
  ZombieOutbreak.prototype.destroy = function () {
    if (this._animId) cancelAnimationFrame(this._animId);
    if (this._boundKey)   window.removeEventListener('keydown', this._boundKey);
    if (this._boundKeyUp) window.removeEventListener('keyup',   this._boundKeyUp);
    if (this._boundClick) window.removeEventListener('click',   this._boundClick);
    if (this.group && this.scene) this.scene.remove(this.group);
    if (this.ambientLight && this.scene) this.scene.remove(this.ambientLight);
    if (this.hudEl    && this.hudEl.parentNode)    this.hudEl.parentNode.removeChild(this.hudEl);
    if (this.bannerEl && this.bannerEl.parentNode) this.bannerEl.parentNode.removeChild(this.bannerEl);
    if (this._bannerTimeout) clearTimeout(this._bannerTimeout);
  };

  // ─── Factory / Public API ────────────────────────────────────────────────────
  window.ZombieOutbreak = {
    create: function (scene, camera, renderer) {
      var instance = new ZombieOutbreak(scene, camera, renderer);
      instance.init();
      return instance;
    },
    ZombieOutbreak: ZombieOutbreak
  };

}(window));
