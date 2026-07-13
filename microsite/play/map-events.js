/* ─────────────────────────────────────────────────────────────────────────────
   MAP EVENTS — random mid-level map events (air raid, reinforcements, supply
   drop, blackout, EMP blast, fog roll-in)              Ukraine conflict theme
   ───────────────────────────────────────────────────────────────────────────── */
window.MapEvents = (function () {
  'use strict';

  /* ── public flags ────────────────────────────────────────────────────────── */
  window._mapEventsEnabled  = (window._mapEventsEnabled !== false);
  window._lastMapEvent      = null;
  window._mapEventCooldown  = 0;      /* seconds remaining until next event */
  window._empActive         = false;

  /* ── internal state ──────────────────────────────────────────────────────── */
  var _scene          = null;
  var _active         = [];           /* in-progress event objects */
  var _cooldownTimer  = 0;            /* counts down; fires event when <= 0   */
  var _nextInterval   = 0;            /* randomised 45-90 s interval          */
  var _running        = false;
  var _typewriterTimer = null;

  /* ────────────────────────────────────────────────────────────────────────────
     PUBLIC API
   ─────────────────────────────────────────────────────────────────────────── */
  function init(scene) {
    _scene  = scene;
    _active = [];
    _running = true;
    _scheduleNext();
  }

  function update(delta) {
    if (!_running) return;
    if (!window._mapEventsEnabled) { _cooldownTimer = 0; return; }

    /* tick event objects */
    for (var i = _active.length - 1; i >= 0; i--) {
      var ev = _active[i];
      if (ev && ev.tick) {
        ev.tick(delta);
        if (ev.done) _active.splice(i, 1);
      }
    }

    /* countdown to next event */
    _cooldownTimer -= delta;
    window._mapEventCooldown = Math.max(0, _cooldownTimer);

    if (_cooldownTimer <= 0) {
      _fireRandomEvent();
      _scheduleNext();
    }
  }

  function reset() {
    _running = false;
    for (var i = 0; i < _active.length; i++) {
      if (_active[i] && _active[i].cleanup) _active[i].cleanup();
    }
    _active = [];
    _cooldownTimer = 0;
    window._mapEventCooldown = 0;
    window._lastMapEvent = null;
    window._empActive = false;
    _restoreBlackout();
    _restoreEMP();
  }

  /* ────────────────────────────────────────────────────────────────────────────
     SCHEDULE / DISPATCH
   ─────────────────────────────────────────────────────────────────────────── */
  function _scheduleNext() {
    _nextInterval  = 45 + Math.random() * 45;   /* 45 – 90 s */
    _cooldownTimer = _nextInterval;
    window._mapEventCooldown = _cooldownTimer;
  }

  var EVENT_TYPES = [
    'AIR_RAID',
    'REINFORCEMENTS',
    'SUPPLY_DROP',
    'BLACKOUT',
    'EMP_BLAST',
    'FOG_ROLL_IN',
  ];

  function _fireRandomEvent() {
    var type = EVENT_TYPES[Math.floor(Math.random() * EVENT_TYPES.length)];
    window._lastMapEvent = type;

    /* call external hook if present */
    if (typeof window._onMapEvent === 'function') {
      try { window._onMapEvent(type); } catch (e) {}
    }

    switch (type) {
      case 'AIR_RAID':        _startAirRaid();        break;
      case 'REINFORCEMENTS':  _startReinforcements(); break;
      case 'SUPPLY_DROP':     _startSupplyDrop();     break;
      case 'BLACKOUT':        _startBlackout();       break;
      case 'EMP_BLAST':       _startEMP();            break;
      case 'FOG_ROLL_IN':     _startFogRollIn();      break;
    }
  }

  /* ────────────────────────────────────────────────────────────────────────────
     HUD HELPERS
   ─────────────────────────────────────────────────────────────────────────── */
  function _getOrCreateAnnounce() {
    var el = document.getElementById('mapEventAnnounce');
    if (!el) {
      el = document.createElement('div');
      el.id = 'mapEventAnnounce';
      el.style.cssText = [
        'position:fixed',
        'top:130px',
        'left:50%',
        'transform:translateX(-50%)',
        'background:rgba(0,0,0,0.82)',
        'border:2px solid rgba(255,60,60,0.8)',
        'color:#ff4444',
        'padding:10px 28px',
        'border-radius:7px',
        'font-size:16px',
        'font-family:monospace',
        'font-weight:bold',
        'z-index:600',
        'pointer-events:none',
        'text-align:center',
        'letter-spacing:2px',
        'text-shadow:0 0 12px rgba(255,60,60,0.7)',
        'transition:opacity 0.5s',
        'white-space:nowrap',
        'opacity:0',
      ].join(';');
      document.body.appendChild(el);
    }
    return el;
  }

  /* Typewriter effect for dramatic HUD announcement */
  function _announce(msg, color) {
    var el = _getOrCreateAnnounce();
    if (!color) color = '#ff4444';
    el.style.color = color;
    el.style.borderColor = color.replace(')', ', 0.8)').replace('rgb(', 'rgba(');
    el.style.textShadow = '0 0 12px ' + color;
    el.style.opacity = '1';
    el.textContent = '';

    /* typewriter */
    clearTimeout(_typewriterTimer);
    var idx = 0;
    function type() {
      if (idx <= msg.length) {
        el.textContent = msg.substring(0, idx);
        idx++;
        _typewriterTimer = setTimeout(type, 38);
      }
    }
    type();

    /* fade out after 5 s */
    setTimeout(function () {
      el.style.opacity = '0';
    }, 5000);
  }

  /* ────────────────────────────────────────────────────────────────────────────
     AUDIO HELPERS (Web Audio API — graceful fallback)
   ─────────────────────────────────────────────────────────────────────────── */
  function _makeAudioCtx() {
    try {
      return new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) { return null; }
  }

  /* Air-raid siren: two-tone alternating wail */
  function _playAirRaidSiren() {
    var ctx = _makeAudioCtx();
    if (!ctx) return;
    var dur = 4.0;
    var osc = ctx.createOscillator();
    var gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sawtooth';
    /* frequency wail: 400 Hz <-> 600 Hz, 2 cycles */
    osc.frequency.setValueAtTime(400, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(600, ctx.currentTime + 0.5);
    osc.frequency.linearRampToValueAtTime(400, ctx.currentTime + 1.0);
    osc.frequency.linearRampToValueAtTime(600, ctx.currentTime + 1.5);
    osc.frequency.linearRampToValueAtTime(400, ctx.currentTime + 2.0);
    osc.frequency.linearRampToValueAtTime(600, ctx.currentTime + 2.5);
    osc.frequency.linearRampToValueAtTime(400, ctx.currentTime + 3.0);
    osc.frequency.linearRampToValueAtTime(600, ctx.currentTime + 3.5);
    gain.gain.setValueAtTime(0.18, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0, ctx.currentTime + dur);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + dur);
    osc.onended = function () { try { ctx.close(); } catch (e) {} };
  }

  /* Radio crackle: short-burst noise */
  function _playRadioCrackle() {
    var ctx = _makeAudioCtx();
    if (!ctx) return;
    var bufLen = ctx.sampleRate * 0.25;
    var buf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
    var data = buf.getChannelData(0);
    for (var i = 0; i < bufLen; i++) {
      data[i] = (Math.random() * 2 - 1) * (i < bufLen * 0.1 ? i / (bufLen * 0.1) : Math.max(0, 1 - (i - bufLen * 0.1) / (bufLen * 0.9)));
    }
    var src = ctx.createBufferSource();
    src.buffer = buf;
    var bpf = ctx.createBiquadFilter();
    bpf.type = 'bandpass';
    bpf.frequency.value = 1200;
    bpf.Q.value = 0.5;
    var gain = ctx.createGain();
    gain.gain.setValueAtTime(0.4, ctx.currentTime);
    src.connect(bpf);
    bpf.connect(gain);
    gain.connect(ctx.destination);
    src.start(ctx.currentTime);
    src.onended = function () { try { ctx.close(); } catch (e) {} };
  }

  /* Supply drop whoosh: descending tone */
  function _playSupplyWhoosh() {
    var ctx = _makeAudioCtx();
    if (!ctx) return;
    var osc = ctx.createOscillator();
    var gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(200, ctx.currentTime + 1.8);
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 1.8);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 1.8);
    osc.onended = function () { try { ctx.close(); } catch (e) {} };
  }

  /* Blackout buzz: low hum + click */
  function _playBlackoutBuzz() {
    var ctx = _makeAudioCtx();
    if (!ctx) return;
    var osc = ctx.createOscillator();
    var gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'square';
    osc.frequency.setValueAtTime(60, ctx.currentTime);
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.3);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.3);
    osc.onended = function () { try { ctx.close(); } catch (e) {} };
  }

  /* EMP zap: high-freq burst descending */
  function _playEMPZap() {
    var ctx = _makeAudioCtx();
    if (!ctx) return;
    var osc = ctx.createOscillator();
    var gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'square';
    osc.frequency.setValueAtTime(3000, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(100, ctx.currentTime + 0.8);
    gain.gain.setValueAtTime(0.25, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.8);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.8);
    osc.onended = function () { try { ctx.close(); } catch (e) {} };
  }

  /* Fog ambient: low howl */
  function _playFogAmbient() {
    var ctx = _makeAudioCtx();
    if (!ctx) return;
    var osc = ctx.createOscillator();
    var gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(80, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(120, ctx.currentTime + 1.5);
    osc.frequency.linearRampToValueAtTime(80, ctx.currentTime + 3.0);
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.1, ctx.currentTime + 0.5);
    gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 3.0);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 3.0);
    osc.onended = function () { try { ctx.close(); } catch (e) {} };
  }

  /* ────────────────────────────────────────────────────────────────────────────
     HELPER: player position
   ─────────────────────────────────────────────────────────────────────────── */
  function _getPlayer() {
    return (typeof window !== 'undefined' && window.GameManager && window.GameManager.getPlayer)
      ? window.GameManager.getPlayer()
      : null;
  }

  /* ────────────────────────────────────────────────────────────────────────────
     EVENT 1 — AIR RAID INCOMING
     5 explosion craters drop from sky over 8 s; player must dodge
   ─────────────────────────────────────────────────────────────────────────── */
  function _startAirRaid() {
    _announce('!! AIR RAID INCOMING — TAKE COVER !!', '#ff2200');
    _playAirRaidSiren();

    var player  = _getPlayer();
    var originX = player ? player.position.x : 0;
    var originZ = player ? player.position.z : 0;

    var totalBombs  = 5;
    var dropInterval = 8.0 / totalBombs;
    var bombsQueued  = 0;
    var elapsed      = 0;

    var ev = {
      done: false,
      tick: function (delta) {
        elapsed += delta;
        var shouldDrop = Math.floor(elapsed / dropInterval);
        while (bombsQueued < shouldDrop && bombsQueued < totalBombs) {
          bombsQueued++;
          var bx = originX + (Math.random() - 0.5) * 36;
          var bz = originZ + (Math.random() - 0.5) * 36;
          _dropBomb(bx, bz, player);
        }
        if (bombsQueued >= totalBombs) ev.done = true;
      },
      cleanup: function () {},
    };

    _active.push(ev);
  }

  function _dropBomb(tx, tz, player) {
    if (!_scene) return;

    /* falling projectile */
    var projGeo = new THREE.SphereGeometry(0.25, 5, 5);
    var projMat = new THREE.MeshBasicMaterial({ color: 0xff3300 });
    var projMesh = new THREE.Mesh(projGeo, projMat);
    var startY = 50;
    projMesh.position.set(tx, startY, tz);
    _scene.add(projMesh);

    var fallElapsed = 0;
    var fallSpeed   = startY / 2.5;   /* reach ground in ~2.5 s */
    var impacted    = false;

    var bombEv = {
      done: false,
      tick: function (delta) {
        if (impacted) return;
        fallElapsed += delta;
        var ny = startY - fallSpeed * fallElapsed;
        if (ny <= 0) {
          ny = 0;
          impacted = true;
          if (_scene) _scene.remove(projMesh);
          _bombImpact(tx, tz, player);
          bombEv.done = true;
        }
        projMesh.position.y = ny;
      },
      cleanup: function () { if (_scene) _scene.remove(projMesh); },
    };
    _active.push(bombEv);
  }

  function _bombImpact(x, z, player) {
    if (!_scene) return;

    /* crater disk */
    var craterGeo = new THREE.CylinderGeometry(2.0, 2.0, 0.25, 12);
    var craterMat = new THREE.MeshLambertMaterial({ color: 0x1a1100 });
    var craterMesh = new THREE.Mesh(craterGeo, craterMat);
    craterMesh.position.set(x, 0.07, z);
    _scene.add(craterMesh);

    /* flash */
    var flashLight = new THREE.PointLight(0xff4400, 12, 22);
    flashLight.position.set(x, 1, z);
    _scene.add(flashLight);
    setTimeout(function () { if (_scene) _scene.remove(flashLight); }, 250);

    /* 10 debris particles */
    for (var di = 0; di < 10; di++) {
      var dMat = new THREE.MeshBasicMaterial({ color: 0x553300, transparent: true, opacity: 1 });
      var dGeo = new THREE.SphereGeometry(0.18, 4, 4);
      var dMesh = new THREE.Mesh(dGeo, dMat);
      dMesh.position.set(x, 0.5, z);
      var vel = new THREE.Vector3(
        (Math.random() - 0.5) * 10,
        Math.random() * 6 + 3,
        (Math.random() - 0.5) * 10
      );
      _scene.add(dMesh);
      (function (mesh, mat, v) {
        var life = 0;
        var maxLife = 0.6 + Math.random() * 0.5;
        var debrisEv = {
          done: false,
          tick: function (d) {
            life += d;
            mesh.position.addScaledVector(v, d);
            v.y -= 12 * d;
            mat.opacity = Math.max(0, 1 - life / maxLife);
            if (life >= maxLife) {
              if (_scene) _scene.remove(mesh);
              debrisEv.done = true;
            }
          },
          cleanup: function () { if (_scene) _scene.remove(mesh); },
        };
        _active.push(debrisEv);
      })(dMesh, dMat, vel);
    }

    /* player damage in radius 3 */
    if (player && player.position && !player.godMode) {
      var dx = player.position.x - x;
      var dz = player.position.z - z;
      if (Math.sqrt(dx * dx + dz * dz) < 3) {
        if (typeof window._takeDamageFromWaveEvent === 'function') {
          window._takeDamageFromWaveEvent(30);
        } else {
          player.hp = Math.max(0, (player.hp || 0) - 30);
          if (typeof HUD !== 'undefined' && HUD.setHealth) HUD.setHealth(player.hp, player.maxHp);
          if (typeof HUD !== 'undefined' && HUD.showDamageFlash) HUD.showDamageFlash(0xff2200, 0.7);
        }
      }
    }

    if (typeof AudioSystem !== 'undefined' && AudioSystem.playExplosion) {
      AudioSystem.playExplosion();
    }

    /* persist crater */
    _active.push({
      done: false,
      tick: function () {},
      cleanup: function () { if (_scene) _scene.remove(craterMesh); },
    });
  }

  /* ────────────────────────────────────────────────────────────────────────────
     EVENT 2 — REINFORCEMENTS CALLED
     6 extra enemies spawn at map edge
   ─────────────────────────────────────────────────────────────────────────── */
  function _startReinforcements() {
    _announce('!! REINFORCEMENTS CALLED — ENEMIES INCOMING !!', '#ff6600');
    _playRadioCrackle();

    var player  = _getPlayer();
    var originX = player ? player.position.x : 0;
    var originZ = player ? player.position.z : 0;

    /* spawn 6 soldiers at map edge (~50 units away) in a spread */
    var spawnCount = 6;
    for (var si = 0; si < spawnCount; si++) {
      var angle = (Math.PI * 2 / spawnCount) * si + Math.random() * 0.3;
      var dist  = 48 + Math.random() * 8;
      var sx    = originX + Math.cos(angle) * dist;
      var sz    = originZ + Math.sin(angle) * dist;
      (function (ex, ez) {
        try {
          if (typeof Enemies !== 'undefined' && Enemies.spawnSingle) {
            Enemies.spawnSingle('SOLDIER', { x: ex, z: ez });
          }
        } catch (e) {}
      })(sx, sz);
    }

    /* brief visual beacon at each edge direction */
    if (_scene) {
      for (var bi = 0; bi < 4; bi++) {
        var ba = (Math.PI / 2) * bi;
        var bx = originX + Math.cos(ba) * 48;
        var bz = originZ + Math.sin(ba) * 48;
        var beaconLight = new THREE.PointLight(0xff6600, 6, 18);
        beaconLight.position.set(bx, 2, bz);
        _scene.add(beaconLight);
        (function (bl) {
          setTimeout(function () { if (_scene) _scene.remove(bl); }, 3000);
        })(beaconLight);
      }
    }
  }

  /* ────────────────────────────────────────────────────────────────────────────
     EVENT 3 — SUPPLY DROP
     Airdrop crate with ammo/health at random position
   ─────────────────────────────────────────────────────────────────────────── */
  function _startSupplyDrop() {
    _announce('>> SUPPLY DROP INBOUND — SECURE THE CRATE <<', '#44ff88');
    _playSupplyWhoosh();

    var player  = _getPlayer();
    var originX = player ? player.position.x : 0;
    var originZ = player ? player.position.z : 0;

    var dropX   = originX + (Math.random() - 0.5) * 32;
    var dropZ   = originZ + (Math.random() - 0.5) * 32;
    var startY  = 40;

    /* crate */
    var crateGeo  = new THREE.BoxGeometry(1.4, 1.4, 1.4);
    var crateMat  = new THREE.MeshLambertMaterial({ color: 0x8B6914 });
    var crateMesh = new THREE.Mesh(crateGeo, crateMat);
    crateMesh.position.set(dropX, startY, dropZ);
    if (_scene) _scene.add(crateMesh);

    /* parachute cone */
    var chuteGeo  = new THREE.ConeGeometry(2.8, 3.5, 8);
    var chuteMat  = new THREE.MeshLambertMaterial({ color: 0xffffff, transparent: true, opacity: 0.82 });
    var chuteMesh = new THREE.Mesh(chuteGeo, chuteMat);
    chuteMesh.position.set(dropX, startY + 3.5, dropZ);
    if (_scene) _scene.add(chuteMesh);

    var falling   = true;
    var collected = false;
    var elapsed   = 0;

    var ev = {
      done: false,
      tick: function (delta) {
        elapsed += delta;

        if (falling) {
          var ny = crateMesh.position.y - 7 * delta;
          if (ny <= 0.7) {
            ny = 0.7;
            falling = false;
            chuteMesh.visible = false;
            /* landing flash */
            if (_scene) {
              var landLight = new THREE.PointLight(0xffffff, 4, 12);
              landLight.position.set(dropX, 1, dropZ);
              _scene.add(landLight);
              setTimeout(function () { if (_scene) _scene.remove(landLight); }, 200);
            }
          }
          crateMesh.position.y = ny;
          chuteMesh.position.y = ny + 3.5;
        }

        if (!collected && !falling && player && player.position) {
          var dx = player.position.x - dropX;
          var dz = player.position.z - dropZ;
          if (Math.sqrt(dx * dx + dz * dz) < 1.8) {
            collected = true;
            /* grant ammo + health */
            try {
              if (typeof Weapons !== 'undefined' && Weapons.addAmmo) {
                Weapons.addAmmo(60);
              } else if (typeof Weapons !== 'undefined' && Weapons.getCurrent) {
                var wep = Weapons.getCurrent();
                if (wep) wep.reserve = (wep.reserve || 0) + 60;
              }
            } catch (e) {}
            if (player.hp !== undefined && player.maxHp !== undefined) {
              player.hp = Math.min(player.maxHp, player.hp + 40);
              if (typeof HUD !== 'undefined' && HUD.setHealth) HUD.setHealth(player.hp, player.maxHp);
            }
            if (typeof HUD !== 'undefined' && HUD.notifyPickup) {
              HUD.notifyPickup('+60 AMMO | +40 HP (Supply Drop)', '#44ff88');
            }
            if (typeof AudioSystem !== 'undefined' && AudioSystem.playPickup) {
              AudioSystem.playPickup();
            }
            if (_scene) { _scene.remove(crateMesh); _scene.remove(chuteMesh); }
            ev.done = true;
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

    _active.push(ev);
  }

  /* ────────────────────────────────────────────────────────────────────────────
     EVENT 4 — BLACKOUT
     Screen dims 60 % for 20 s via CSS filter brightness(0.4)
   ─────────────────────────────────────────────────────────────────────────── */
  var _blackoutEl = null;

  function _restoreBlackout() {
    if (_blackoutEl) {
      _blackoutEl.style.opacity = '0';
      setTimeout(function () {
        if (_blackoutEl && _blackoutEl.parentNode) {
          _blackoutEl.parentNode.removeChild(_blackoutEl);
        }
        _blackoutEl = null;
      }, 600);
    }
  }

  function _startBlackout() {
    _announce('!! BLACKOUT — POWER GRID DOWN !!', '#ffcc00');
    _playBlackoutBuzz();

    /* dim overlay */
    var overlay = document.createElement('div');
    overlay.id = 'mapEventBlackout';
    overlay.style.cssText = [
      'position:fixed',
      'inset:0',
      'background:rgba(0,0,0,0.6)',
      'z-index:550',
      'pointer-events:none',
      'transition:opacity 0.6s',
      'opacity:0',
    ].join(';');
    document.body.appendChild(overlay);
    _blackoutEl = overlay;

    /* also apply CSS filter to game container */
    var gc = document.getElementById('game-container');
    if (gc) gc.style.filter = 'brightness(0.4)';

    /* force next frame for transition */
    setTimeout(function () { overlay.style.opacity = '1'; }, 20);

    var duration = 20.0;
    var elapsed  = 0;

    var ev = {
      done: false,
      tick: function (delta) {
        elapsed += delta;
        if (elapsed >= duration) {
          /* restore */
          if (gc) gc.style.filter = '';
          _restoreBlackout();
          ev.done = true;
        }
      },
      cleanup: function () {
        if (gc) gc.style.filter = '';
        _restoreBlackout();
      },
    };

    _active.push(ev);
  }

  /* ────────────────────────────────────────────────────────────────────────────
     EVENT 5 — EMP BLAST
     Disables minimap/HUD for 15 s; window._empActive = true
   ─────────────────────────────────────────────────────────────────────────── */
  var _empHiddenEls = [];

  function _restoreEMP() {
    window._empActive = false;
    for (var i = 0; i < _empHiddenEls.length; i++) {
      var info = _empHiddenEls[i];
      if (info && info.el) info.el.style.display = info.origDisplay;
    }
    _empHiddenEls = [];

    /* remove static overlay */
    var staticEl = document.getElementById('mapEventEMPStatic');
    if (staticEl && staticEl.parentNode) staticEl.parentNode.removeChild(staticEl);
  }

  function _startEMP() {
    _announce('!! EMP BLAST — ELECTRONICS DOWN !!', '#00ccff');
    _playEMPZap();

    window._empActive = true;

    /* hide minimap and HUD fragments */
    var hudIds = ['minimap-canvas', 'tactical-compass', 'uav-indicator', 'objective-pointer'];
    _empHiddenEls = [];
    for (var hi = 0; hi < hudIds.length; hi++) {
      var el = document.getElementById(hudIds[hi]);
      if (el) {
        _empHiddenEls.push({ el: el, origDisplay: el.style.display || '' });
        el.style.display = 'none';
      }
    }

    /* static/glitch overlay */
    var staticEl = document.createElement('canvas');
    staticEl.id = 'mapEventEMPStatic';
    staticEl.width  = 320;
    staticEl.height = 180;
    staticEl.style.cssText = [
      'position:fixed',
      'inset:0',
      'width:100vw',
      'height:100vh',
      'z-index:548',
      'pointer-events:none',
      'opacity:0.08',
      'image-rendering:pixelated',
    ].join(';');
    document.body.appendChild(staticEl);

    /* animate static noise */
    var _staticAnim = null;
    function _drawStatic() {
      if (!window._empActive) return;
      var ctx = staticEl.getContext('2d');
      var imgData = ctx.createImageData(320, 180);
      var d = imgData.data;
      for (var pi = 0; pi < d.length; pi += 4) {
        var v = Math.random() > 0.5 ? 255 : 0;
        d[pi] = v; d[pi + 1] = v; d[pi + 2] = v; d[pi + 3] = 180;
      }
      ctx.putImageData(imgData, 0, 0);
      _staticAnim = requestAnimationFrame(_drawStatic);
    }
    _drawStatic();

    var duration = 15.0;
    var elapsed  = 0;

    var ev = {
      done: false,
      tick: function (delta) {
        elapsed += delta;
        if (elapsed >= duration) {
          if (_staticAnim) cancelAnimationFrame(_staticAnim);
          _restoreEMP();
          ev.done = true;
        }
      },
      cleanup: function () {
        if (_staticAnim) cancelAnimationFrame(_staticAnim);
        _restoreEMP();
      },
    };

    _active.push(ev);
  }

  /* ────────────────────────────────────────────────────────────────────────────
     EVENT 6 — FOG ROLL-IN
     Fog density triples for 30 s via THREE.Fog density change
   ─────────────────────────────────────────────────────────────────────────── */
  function _startFogRollIn() {
    _announce('>> FOG ROLLING IN — VISIBILITY CRITICAL <<', '#aaccff');
    _playFogAmbient();

    if (!_scene) return;

    var origFogFar  = (_scene.fog && _scene.fog.far)  ? _scene.fog.far  : 120;
    var origFogNear = (_scene.fog && _scene.fog.near) ? _scene.fog.near : 1;
    var origFogColor = 0x888888;

    if (!_scene.fog) {
      _scene.fog = new THREE.Fog(origFogColor, origFogNear, origFogFar);
    }

    /* triple fog density = shrink far by 3x */
    var denseFar  = Math.max(origFogFar / 3, 6);
    var denseNear = Math.max(origFogNear, 1);

    _scene.fog.far  = denseFar;
    _scene.fog.near = denseNear;

    var duration    = 30.0;
    var fadeDur     = 6.0;
    var elapsed     = 0;
    var fadingBack  = false;
    var fadeElapsed = 0;

    var ev = {
      done: false,
      tick: function (delta) {
        elapsed += delta;

        if (!fadingBack && elapsed >= duration) {
          fadingBack = true;
        }

        if (fadingBack) {
          fadeElapsed += delta;
          var t = Math.min(1, fadeElapsed / fadeDur);
          if (_scene && _scene.fog) {
            _scene.fog.far  = denseFar + (origFogFar  - denseFar)  * t;
            _scene.fog.near = denseNear + (origFogNear - denseNear) * t;
          }
          if (fadeElapsed >= fadeDur) {
            if (_scene && _scene.fog) {
              _scene.fog.far  = origFogFar;
              _scene.fog.near = origFogNear;
            }
            ev.done = true;
          }
        }
      },
      cleanup: function () {
        if (_scene && _scene.fog) {
          _scene.fog.far  = origFogFar;
          _scene.fog.near = origFogNear;
        }
      },
    };

    _active.push(ev);
  }

  /* ── public surface ──────────────────────────────────────────────────────── */
  return { init: init, update: update, reset: reset };
})();
