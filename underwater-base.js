window.UnderwaterBase = (function () {
  'use strict';
  var requestAnimationFrame = (typeof window !== 'undefined' && window.__ALLOW_EMBEDDED_MINIGAMES) ? window.requestAnimationFrame.bind(window) : function () { return 0; };
  var setTimeout = (typeof window !== 'undefined' && window.__ALLOW_EMBEDDED_MINIGAMES) ? window.setTimeout.bind(window) : function () { return 0; };

  var MODULE_NAME = 'UnderwaterBase';
  var ACTIVATION_KEY_U = 85;
  var ACTIVATION_KEY_B = 66;
  var ACTIVATION_WINDOW = 400;

  var state = {
    active: false,
    scene: null,
    camera: null,
    renderer: null,
    keys: {},
    keyTimes: {},
    playerPos: { x: 0, y: -5, z: 0 },
    playerHP: 100,
    o2: 90,
    o2Max: 90,
    depth: 0,
    pressureSuit: false,
    chargesPlanted: 0,
    chargesTotal: 3,
    torpedoRedirected: false,
    score: 0,
    inPressurizedDome: false,
    currentZoneActive: false,
    currentDirection: 'EAST',
    airlockState: 'closed',
    airlockTimer: 0,
    detonationReady: false,
    detonated: false,
    gameOver: false,
    lastTime: 0,
    animFrameId: null,
    objects: [],
    bubbles: [],
    divers: [],
    sharks: [],
    darts: [],
    airPockets: [],
    reactorPipes: [],
    currentZones: [],
    domes: [],
    tunnels: [],
    airlockMeshes: {},
    torpedoBay: null,
    torpedoTerminal: null,
    detonationLight: null,
    hudEl: null,
    hudInterval: null,
    pressureWarningActive: false,
    bloodAggro: false,
    sharkSprintTimer: 0,
    playerNearTerminal: false,
    playerNearAirlock: false,
    playerNearPipe: [],
    playerInCurrent: false
  };

  var keysDown = {};

  function init() {
    if (typeof window !== 'undefined' && !window.__ALLOW_EMBEDDED_MINIGAMES) return; /* standalone mini-game disabled: was auto-launching over the main game */

    if (state.active) return;
    state.active = true;

    if (typeof THREE === 'undefined') {
      console.warn('[UnderwaterBase] THREE.js not found');
      return;
    }

    setupScene();
    buildEnvironment();
    buildBase();
    buildAirlock();
    buildBubbles();
    buildAirPockets();
    buildDivers();
    buildSharks();
    buildCurrentZones();
    buildReactorPipes();
    buildTorpedoBay();
    buildHUD();
    bindKeys();
    animate(0);
  }

  function destroy() {
    if (!state.active) return;
    state.active = false;
    if (state.animFrameId) {
      cancelAnimationFrame(state.animFrameId);
      state.animFrameId = null;
    }
    if (state.renderer) {
      state.renderer.domElement.parentNode &&
        state.renderer.domElement.parentNode.removeChild(state.renderer.domElement);
      state.renderer.dispose();
      state.renderer = null;
    }
    if (state.hudEl && state.hudEl.parentNode) {
      state.hudEl.parentNode.removeChild(state.hudEl);
      state.hudEl = null;
    }
    if (state.hudInterval) {
      clearInterval(state.hudInterval);
      state.hudInterval = null;
    }
    unbindKeys();
    state.objects = [];
    state.bubbles = [];
    state.divers = [];
    state.sharks = [];
    state.darts = [];
    state.airPockets = [];
    state.reactorPipes = [];
    state.currentZones = [];
    state.domes = [];
    state.tunnels = [];
    state.scene = null;
    state.camera = null;
  }

  function setupScene() {
    var w = window.innerWidth;
    var h = window.innerHeight;

    state.scene = new THREE.Scene();
    state.scene.background = new THREE.Color(0x001A33);
    state.scene.fog = new THREE.FogExp2(0x003366, 0.04);

    state.camera = new THREE.PerspectiveCamera(70, w / h, 0.1, 500);
    state.camera.position.set(0, 2, 20);

    state.renderer = new THREE.WebGLRenderer({ antialias: true });
    state.renderer.setSize(w, h);
    state.renderer.domElement.style.position = 'fixed';
    state.renderer.domElement.style.top = '0';
    state.renderer.domElement.style.left = '0';
    state.renderer.domElement.style.zIndex = '9000';
    document.body.appendChild(state.renderer.domElement);

    var ambientLight = new THREE.AmbientLight(0x001144, 0.4);
    state.scene.add(ambientLight);

    var bluePoint = new THREE.PointLight(0x0044AA, 1.5, 80);
    bluePoint.position.set(0, 5, 0);
    state.scene.add(bluePoint);
  }

  function makeMesh(geo, mat) {
    var mesh = new THREE.Mesh(geo, mat);
    state.scene.add(mesh);
    state.objects.push(mesh);
    return mesh;
  }

  function buildEnvironment() {
    var floorGeo = new THREE.PlaneGeometry(200, 200);
    var floorMat = new THREE.MeshLambertMaterial({ color: 0x001122 });
    var floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -35;
    state.scene.add(floor);
  }

  function buildBase() {
    var domeCenters = [
      { x: 0, y: -10, z: 0 },
      { x: 30, y: -12, z: 5 },
      { x: -28, y: -11, z: -5 }
    ];

    var baseMat = new THREE.MeshLambertMaterial({ color: 0x335544 });

    for (var i = 0; i < domeCenters.length; i++) {
      var dc = domeCenters[i];

      var baseGeo = new THREE.SphereGeometry(12, 16, 16);
      var dome = new THREE.Mesh(baseGeo, baseMat);
      dome.position.set(dc.x, dc.y, dc.z);
      dome.userData.domeIndex = i;
      dome.userData.pressurized = true;
      state.scene.add(dome);
      state.domes.push(dome);
      state.objects.push(dome);
    }

    var tunnelMat = new THREE.MeshLambertMaterial({ color: 0x2A4A3A });

    var tunnelDefs = [
      { from: 0, to: 1 },
      { from: 0, to: 2 }
    ];

    for (var t = 0; t < tunnelDefs.length; t++) {
      var td = tunnelDefs[t];
      var fromDome = domeCenters[td.from];
      var toDome = domeCenters[td.to];

      var dx = toDome.x - fromDome.x;
      var dy = toDome.y - fromDome.y;
      var dz = toDome.z - fromDome.z;
      var length = Math.sqrt(dx * dx + dy * dy + dz * dz);

      var tunnelGeo = new THREE.CylinderGeometry(3, 3, length, 12);
      var tunnel = new THREE.Mesh(tunnelGeo, tunnelMat);
      tunnel.position.set(
        (fromDome.x + toDome.x) / 2,
        (fromDome.y + toDome.y) / 2,
        (fromDome.z + toDome.z) / 2
      );

      var axis = new THREE.Vector3(dx, dy, dz).normalize();
      var up = new THREE.Vector3(0, 1, 0);
      var quaternion = new THREE.Quaternion().setFromUnitVectors(up, axis);
      tunnel.setRotationFromQuaternion(quaternion);

      state.scene.add(tunnel);
      state.tunnels.push(tunnel);
      state.objects.push(tunnel);
    }
  }

  function buildAirlock() {
    var airlockMat = new THREE.MeshLambertMaterial({ color: 0x446644 });
    var doorMat = new THREE.MeshLambertMaterial({ color: 0x557755 });

    var airlockGeo = new THREE.BoxGeometry(3, 4, 3);
    var airlock = new THREE.Mesh(airlockGeo, airlockMat);
    airlock.position.set(0, -8, 13);
    state.scene.add(airlock);
    state.objects.push(airlock);
    state.airlockMeshes.body = airlock;

    var outerDoorGeo = new THREE.BoxGeometry(3, 4, 0.3);
    var outerDoor = new THREE.Mesh(outerDoorGeo, doorMat);
    outerDoor.position.set(0, -8, 14.65);
    state.scene.add(outerDoor);
    state.objects.push(outerDoor);
    state.airlockMeshes.outerDoor = outerDoor;

    var innerDoorGeo = new THREE.BoxGeometry(3, 4, 0.3);
    var innerDoor = new THREE.Mesh(innerDoorGeo, doorMat);
    innerDoor.position.set(0, -8, 11.35);
    state.scene.add(innerDoor);
    state.objects.push(innerDoor);
    state.airlockMeshes.innerDoor = innerDoor;

    state.airlockMeshes.outerOpen = false;
    state.airlockMeshes.innerOpen = false;
    state.airlockMeshes.filling = false;
    state.airlockMeshes.draining = false;
    state.airlockMeshes.fillTimer = 0;
    state.airlockMeshes.drainTimer = 0;
  }

  function buildBubbles() {
    var bubbleMat = new THREE.MeshLambertMaterial({
      color: 0x4488AA,
      transparent: true,
      opacity: 0.6
    });

    for (var i = 0; i < 20; i++) {
      var bubbleGeo = new THREE.SphereGeometry(0.2, 6, 6);
      var bubble = new THREE.Mesh(bubbleGeo, bubbleMat);
      bubble.position.set(
        (Math.random() - 0.5) * 80,
        -35 + Math.random() * 30,
        (Math.random() - 0.5) * 80
      );
      bubble.userData.speed = 0.5 + Math.random() * 1.5;
      bubble.userData.wobble = Math.random() * Math.PI * 2;
      state.scene.add(bubble);
      state.bubbles.push(bubble);
    }
  }

  function buildAirPockets() {
    var airPocketMat = new THREE.MeshLambertMaterial({
      color: 0x88BBFF,
      transparent: true,
      opacity: 0.4
    });

    var pocketPositions = [
      { x: -15, y: -5, z: 25 },
      { x: 20, y: -3, z: -20 },
      { x: -30, y: -6, z: 15 }
    ];

    for (var i = 0; i < pocketPositions.length; i++) {
      var pp = pocketPositions[i];
      var pocketGeo = new THREE.SphereGeometry(2, 8, 8);
      var pocket = new THREE.Mesh(pocketGeo, airPocketMat);
      pocket.position.set(pp.x, pp.y, pp.z);
      pocket.userData.used = false;
      pocket.userData.bonus = 30;
      state.scene.add(pocket);
      state.airPockets.push(pocket);
      state.objects.push(pocket);
    }
  }

  function buildDivers() {
    var diverMat = new THREE.MeshLambertMaterial({ color: 0x2A4A2A });

    for (var i = 0; i < 10; i++) {
      var diverGeo = new THREE.CylinderGeometry(0.4, 0.4, 1.8, 8);
      var diver = new THREE.Mesh(diverGeo, diverMat);
      diver.position.set(
        (Math.random() - 0.5) * 60,
        -10 + Math.random() * 5,
        (Math.random() - 0.5) * 60
      );
      diver.userData.hp = 60;
      diver.userData.speed = 5;
      diver.userData.inCorridor = false;
      diver.userData.shootTimer = 0;
      diver.userData.shootCooldown = 2 + Math.random() * 2;
      diver.userData.dir = new THREE.Vector3(Math.random() - 0.5, 0, Math.random() - 0.5).normalize();
      state.scene.add(diver);
      state.divers.push(diver);
      state.objects.push(diver);
    }
  }

  function buildSharks() {
    var sharkMat = new THREE.MeshLambertMaterial({ color: 0x667788 });

    var sharkPositions = [
      { x: 40, y: -8, z: 10 },
      { x: -35, y: -9, z: -15 },
      { x: 10, y: -7, z: -40 }
    ];

    for (var i = 0; i < sharkPositions.length; i++) {
      var sp = sharkPositions[i];
      var sharkGeo = new THREE.BoxGeometry(4, 1, 2);
      var shark = new THREE.Mesh(sharkGeo, sharkMat);
      shark.position.set(sp.x, sp.y, sp.z);
      shark.userData.aggro = false;
      shark.userData.sprintTimer = 0;
      shark.userData.patrolDir = new THREE.Vector3(Math.random() - 0.5, 0, Math.random() - 0.5).normalize();
      shark.userData.patrolTimer = 0;
      state.scene.add(shark);
      state.sharks.push(shark);
      state.objects.push(shark);
    }
  }

  function buildCurrentZones() {
    var currentDefs = [
      { x: 15, y: -8, z: 30, dir: 'EAST', push: new THREE.Vector3(3, 0, 0) },
      { x: -20, y: -8, z: -25, dir: 'NORTH', push: new THREE.Vector3(0, 0, -3) }
    ];

    for (var i = 0; i < currentDefs.length; i++) {
      var cd = currentDefs[i];
      var czGeo = new THREE.BoxGeometry(20, 10, 20);
      var czMat = new THREE.MeshLambertMaterial({
        color: 0x2244AA,
        transparent: true,
        opacity: 0.3
      });
      var cz = new THREE.Mesh(czGeo, czMat);
      cz.position.set(cd.x, cd.y, cd.z);
      cz.userData.direction = cd.dir;
      cz.userData.push = cd.push;
      state.scene.add(cz);
      state.currentZones.push(cz);
      state.objects.push(cz);
    }
  }

  function buildReactorPipes() {
    var pipeMat = new THREE.MeshLambertMaterial({ color: 0x778844 });
    var deepDome = state.domes[2];
    var baseX = deepDome ? deepDome.position.x : -28;
    var baseY = deepDome ? deepDome.position.y : -11;
    var baseZ = deepDome ? deepDome.position.z : -5;

    var pipeOffsets = [
      { x: -4, z: -2 },
      { x: 0, z: -2 },
      { x: 4, z: -2 }
    ];

    for (var i = 0; i < 3; i++) {
      var po = pipeOffsets[i];
      var pipeGeo = new THREE.CylinderGeometry(0.5, 0.5, 6, 8);
      var pipe = new THREE.Mesh(pipeGeo, pipeMat);
      pipe.position.set(baseX + po.x, baseY - 2, baseZ + po.z);
      pipe.userData.chargeIndex = i;
      pipe.userData.charged = false;
      pipe.userData.charging = false;
      pipe.userData.chargeProgress = 0;
      state.scene.add(pipe);
      state.reactorPipes.push(pipe);
      state.objects.push(pipe);
    }
  }

  function buildTorpedoBay() {
    var bayMat = new THREE.MeshLambertMaterial({ color: 0x445566 });
    var bayGeo = new THREE.BoxGeometry(8, 5, 3);
    var bay = new THREE.Mesh(bayGeo, bayMat);
    bay.position.set(30, -9, 5);
    state.scene.add(bay);
    state.objects.push(bay);
    state.torpedoBay = bay;

    var termMat = new THREE.MeshLambertMaterial({ color: 0x336644 });
    var termGeo = new THREE.BoxGeometry(1, 1.5, 0.5);
    var term = new THREE.Mesh(termGeo, termMat);
    term.position.set(30, -7.5, 3.75);
    state.scene.add(term);
    state.objects.push(term);
    state.torpedoTerminal = term;
  }

  function buildHUD() {
    var hud = document.createElement('div');
    hud.id = 'underwater-hud';
    hud.style.position = 'fixed';
    hud.style.top = '10px';
    hud.style.left = '50%';
    hud.style.transform = 'translateX(-50%)';
    hud.style.color = '#00FFCC';
    hud.style.fontFamily = 'monospace';
    hud.style.fontSize = '14px';
    hud.style.background = 'rgba(0,10,30,0.8)';
    hud.style.padding = '6px 14px';
    hud.style.borderRadius = '4px';
    hud.style.zIndex = '9999';
    hud.style.pointerEvents = 'none';
    hud.style.whiteSpace = 'nowrap';
    document.body.appendChild(hud);
    state.hudEl = hud;
    updateHUD();
  }

  function updateHUD() {
    if (!state.hudEl) return;
    var o2 = Math.max(0, Math.round(state.o2));
    var depth = Math.round(state.playerPos.y);
    var charges = state.chargesPlanted;
    var suit = state.pressureSuit ? 'ON' : 'OFF';
    var currentStr = state.playerInCurrent ? ' | CURRENT: ' + state.currentDirection : '';
    var pressureWarn = state.playerPos.y < -15 ? ' [!PRESSURE]' : '';
    state.hudEl.textContent =
      'UNDERWATER [O2: ' + o2 + 's] [DEPTH: ' + depth + 'm] [CHARGES: ' + charges + '/3] [PRESSURE SUIT: ' + suit + ']' + pressureWarn + currentStr;

    if (state.playerPos.y < -15) {
      state.hudEl.style.color = '#FF4444';
    } else {
      state.hudEl.style.color = '#00FFCC';
    }
  }

  function bindKeys() {
    state._onKeyDown = function (e) {
      keysDown[e.keyCode] = true;
      checkActivationCombo(e.keyCode);
      handleActionKey(e.keyCode);
    };
    state._onKeyUp = function (e) {
      keysDown[e.keyCode] = false;
    };
    window.addEventListener('keydown', state._onKeyDown);
    window.addEventListener('keyup', state._onKeyUp);
  }

  function unbindKeys() {
    if (state._onKeyDown) window.removeEventListener('keydown', state._onKeyDown);
    if (state._onKeyUp) window.removeEventListener('keyup', state._onKeyUp);
  }

  function checkActivationCombo(keyCode) {
    if (keyCode === ACTIVATION_KEY_U || keyCode === ACTIVATION_KEY_B) {
      var now = Date.now();
      state.keyTimes[keyCode] = now;
      var otherKey = keyCode === ACTIVATION_KEY_U ? ACTIVATION_KEY_B : ACTIVATION_KEY_U;
      if (state.keyTimes[otherKey] && (now - state.keyTimes[otherKey]) <= ACTIVATION_WINDOW) {
        if (!state.active) {
          init();
        }
      }
    }
  }

  function handleActionKey(keyCode) {
    if (!state.active) return;

    if (keyCode === 69) {
      handleEKey();
    }

    if (keyCode === 80) {
      state.pressureSuit = !state.pressureSuit;
    }

    if (keyCode === 32) {
      handleSpaceKey();
    }
  }

  function handleEKey() {
    if (state.playerNearAirlock) {
      triggerAirlock();
    }

    if (state.torpedoTerminal && !state.torpedoRedirected) {
      var dist = distanceTo(state.playerPos, state.torpedoTerminal.position);
      if (dist < 4) {
        state.torpedoRedirected = true;
        state.score += 600;
        state.torpedoTerminal.material.color.setHex(0x00FF44);
      }
    }

    for (var i = 0; i < state.reactorPipes.length; i++) {
      var pipe = state.reactorPipes[i];
      if (!pipe.userData.charged && !pipe.userData.charging) {
        var dist2 = distanceTo(state.playerPos, pipe.position);
        if (dist2 < 3) {
          pipe.userData.charging = true;
          pipe.userData.chargeProgress = 0;
        }
      }
    }
  }

  function triggerAirlock() {
    var al = state.airlockMeshes;
    if (al.airlockState === 'closed' || !al.outerOpen) {
      al.filling = true;
      al.fillTimer = 0;
      al.outerOpen = true;
      if (al.outerDoor) {
        al.outerDoor.position.y += 4;
      }
      state.airlockState = 'filling';
    }
  }

  function handleSpaceKey() {
    if (state.chargesPlanted >= 3 && !state.detonated) {
      var distFromBase = Math.sqrt(
        state.playerPos.x * state.playerPos.x +
        state.playerPos.z * state.playerPos.z
      );
      if (distFromBase > 40) {
        triggerDetonation();
      }
    }
  }

  function triggerDetonation() {
    state.detonated = true;
    state.detonationReady = false;

    var detonLight = new THREE.PointLight(0xFF4400, 20, 200);
    detonLight.position.set(0, -10, 0);
    state.scene.add(detonLight);
    state.detonationLight = detonLight;

    for (var i = 0; i < state.domes.length; i++) {
      var dome = state.domes[i];
      dome.userData.collapsing = true;
      dome.userData.collapseTimer = 0;
    }

    for (var t = 0; t < state.tunnels.length; t++) {
      state.tunnels[t].userData.collapsing = true;
      state.tunnels[t].userData.collapseTimer = 0;
    }

    state.score += 1000;
    if (state.hudEl) {
      state.hudEl.style.background = 'rgba(80,20,0,0.9)';
    }
  }

  function distanceTo(a, b) {
    var dx = a.x - b.x;
    var dy = a.y - b.y;
    var dz = a.z - b.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  function distanceTo2D(a, b) {
    var dx = a.x - b.x;
    var dz = a.z - b.z;
    return Math.sqrt(dx * dx + dz * dz);
  }

  function updateBubbles(dt) {
    for (var i = 0; i < state.bubbles.length; i++) {
      var b = state.bubbles[i];
      b.userData.wobble += dt * 2;
      b.position.y += b.userData.speed * dt;
      b.position.x += Math.sin(b.userData.wobble) * 0.02;
      if (b.position.y > 5) {
        b.position.y = -35;
        b.position.x = (Math.random() - 0.5) * 80;
        b.position.z = (Math.random() - 0.5) * 80;
      }
    }
  }

  function updateO2(dt) {
    if (state.inPressurizedDome) {
      state.o2 = Math.min(state.o2Max, state.o2 + dt * 10);
    } else {
      state.o2 -= dt;
      if (state.o2 <= 0) {
        state.o2 = 0;
        state.playerHP -= dt * 10;
      }
    }

    for (var i = 0; i < state.airPockets.length; i++) {
      var pocket = state.airPockets[i];
      if (!pocket.userData.used) {
        var dist = distanceTo(state.playerPos, pocket.position);
        if (dist < 2.5) {
          state.o2 = Math.min(state.o2Max, state.o2 + pocket.userData.bonus);
          pocket.userData.used = true;
          pocket.visible = false;
        }
      }
    }
  }

  function updateDepthDamage(dt) {
    var y = state.playerPos.y;
    state.depth = y;

    if (y < -30 && !state.pressureSuit) {
      state.playerHP -= 5 * dt;
      if (state.hudEl) {
        state.hudEl.style.border = '2px solid red';
      }
    } else {
      if (state.hudEl) {
        state.hudEl.style.border = 'none';
      }
    }
  }

  function updateDomeProximity() {
    state.inPressurizedDome = false;
    for (var i = 0; i < state.domes.length; i++) {
      var dome = state.domes[i];
      if (dome.userData.pressurized) {
        var dist = distanceTo(state.playerPos, dome.position);
        if (dist < 10) {
          state.inPressurizedDome = true;
          break;
        }
      }
    }
  }

  function updateCurrentZones() {
    state.playerInCurrent = false;
    for (var i = 0; i < state.currentZones.length; i++) {
      var cz = state.currentZones[i];
      var dx = Math.abs(state.playerPos.x - cz.position.x);
      var dy = Math.abs(state.playerPos.y - cz.position.y);
      var dz = Math.abs(state.playerPos.z - cz.position.z);
      if (dx < 10 && dy < 5 && dz < 10) {
        state.playerInCurrent = true;
        state.currentDirection = cz.userData.direction;
        state.playerPos.x += cz.userData.push.x * 0.016;
        state.playerPos.z += cz.userData.push.z * 0.016;
      }
    }
  }

  function updateDivers(dt) {
    for (var i = 0; i < state.divers.length; i++) {
      var diver = state.divers[i];
      if (diver.userData.hp <= 0) {
        diver.visible = false;
        continue;
      }

      var toPlayer = new THREE.Vector3(
        state.playerPos.x - diver.position.x,
        state.playerPos.y - diver.position.y,
        state.playerPos.z - diver.position.z
      );
      var distToPlayer = toPlayer.length();

      var speed = diver.userData.inCorridor ? 4 : 5;

      if (distToPlayer < 30) {
        var moveDir = toPlayer.clone().normalize();
        diver.position.add(moveDir.multiplyScalar(speed * dt * 0.5));
      } else {
        diver.position.add(diver.userData.dir.clone().multiplyScalar(speed * dt * 0.2));
        diver.userData.dir.x += (Math.random() - 0.5) * 0.1;
        diver.userData.dir.z += (Math.random() - 0.5) * 0.1;
        diver.userData.dir.normalize();
      }

      diver.userData.shootTimer += dt;
      if (diver.userData.shootTimer >= diver.userData.shootCooldown && distToPlayer < 25) {
        fireDart(diver.position, state.playerPos);
        diver.userData.shootTimer = 0;
        diver.userData.shootCooldown = 2 + Math.random() * 2;
      }
    }
  }

  function fireDart(fromPos, toPos) {
    var dir = new THREE.Vector3(
      toPos.x - fromPos.x,
      toPos.y - fromPos.y,
      toPos.z - fromPos.z
    ).normalize();

    var dartGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(dir.x * 2, dir.y * 2, dir.z * 2)
    ]);
    var dartMat = new THREE.LineBasicMaterial({ color: 0xFFAA00 });
    var dart = new THREE.LineSegments(dartGeo, dartMat);
    dart.position.set(fromPos.x, fromPos.y, fromPos.z);
    dart.userData.dir = dir;
    dart.userData.speed = 20;
    dart.userData.life = 3;
    state.scene.add(dart);
    state.darts.push(dart);
  }

  function updateDarts(dt) {
    for (var i = state.darts.length - 1; i >= 0; i--) {
      var dart = state.darts[i];
      dart.userData.life -= dt;
      if (dart.userData.life <= 0) {
        state.scene.remove(dart);
        state.darts.splice(i, 1);
        continue;
      }
      dart.position.x += dart.userData.dir.x * dart.userData.speed * dt;
      dart.position.y += dart.userData.dir.y * dart.userData.speed * dt;
      dart.position.z += dart.userData.dir.z * dart.userData.speed * dt;

      var distToPlayer = distanceTo(dart.position, state.playerPos);
      if (distToPlayer < 1.2) {
        state.playerHP -= 15;
        state.scene.remove(dart);
        state.darts.splice(i, 1);
        checkBloodAggro();
      }
    }
  }

  function checkBloodAggro() {
    if (state.playerHP < state.playerHP * 0.5 || state.playerHP < 50) {
      state.bloodAggro = true;
    }
  }

  function updateSharks(dt) {
    for (var i = 0; i < state.sharks.length; i++) {
      var shark = state.sharks[i];

      if (state.bloodAggro) {
        shark.userData.aggro = true;
      }

      if (shark.userData.aggro) {
        var toPlayer = new THREE.Vector3(
          state.playerPos.x - shark.position.x,
          0,
          state.playerPos.z - shark.position.z
        );
        var dist = toPlayer.length();
        if (dist > 0.5) {
          toPlayer.normalize();
          shark.position.add(toPlayer.multiplyScalar(6 * dt));
        }
        if (dist < 2) {
          state.playerHP -= 20 * dt;
        }
      } else {
        shark.userData.patrolTimer += dt;
        if (shark.userData.patrolTimer > 3) {
          shark.userData.patrolDir = new THREE.Vector3(Math.random() - 0.5, 0, Math.random() - 0.5).normalize();
          shark.userData.patrolTimer = 0;
        }
        shark.position.add(shark.userData.patrolDir.clone().multiplyScalar(3 * dt));
      }

      if (shark.userData.sprintTimer > 0) {
        shark.userData.sprintTimer -= dt;
        if (shark.userData.sprintTimer <= 0) {
          shark.userData.aggro = false;
        }
      }

      if (keysDown[16] && shark.userData.aggro) {
        shark.userData.sprintTimer = 3;
      }
    }
  }

  function updateAirlock(dt) {
    var al = state.airlockMeshes;

    if (al.filling) {
      al.fillTimer += dt;
      if (al.fillTimer >= 30) {
        al.filling = false;
        al.draining = true;
        al.drainTimer = 0;
        if (al.outerDoor) al.outerDoor.position.y -= 4;
      }
    }

    if (al.draining) {
      al.drainTimer += dt;
      if (al.drainTimer >= 5) {
        al.draining = false;
        al.innerOpen = true;
        if (al.innerDoor) al.innerDoor.position.y += 4;
        state.airlockState = 'open';
      }
    }
  }

  function updateReactorPipes(dt) {
    for (var i = 0; i < state.reactorPipes.length; i++) {
      var pipe = state.reactorPipes[i];
      if (pipe.userData.charging) {
        pipe.userData.chargeProgress += dt;
        if (pipe.userData.chargeProgress >= 5) {
          pipe.userData.charging = false;
          pipe.userData.charged = true;
          pipe.material.color.setHex(0xFF4400);
          state.chargesPlanted++;
          if (state.chargesPlanted >= 3) {
            state.detonationReady = true;
          }
        }
      }
    }

    state.playerNearAirlock = false;
    var al = state.airlockMeshes;
    if (al.body) {
      var distToAirlock = distanceTo(state.playerPos, al.body.position);
      if (distToAirlock < 5) {
        state.playerNearAirlock = true;
      }
    }
  }

  function updateCollapsingObjects(dt) {
    if (!state.detonated) return;

    if (state.detonationLight) {
      state.detonationLight.intensity = Math.max(0, state.detonationLight.intensity - dt * 5);
    }

    for (var i = 0; i < state.domes.length; i++) {
      var dome = state.domes[i];
      if (dome.userData.collapsing) {
        dome.userData.collapseTimer += dt;
        var scale = Math.max(0.01, 1 - dome.userData.collapseTimer * 0.3);
        dome.scale.set(scale, scale, scale);
      }
    }

    for (var t = 0; t < state.tunnels.length; t++) {
      var tunnel = state.tunnels[t];
      if (tunnel.userData.collapsing) {
        tunnel.userData.collapseTimer += dt;
        var scaleT = Math.max(0.01, 1 - tunnel.userData.collapseTimer * 0.3);
        tunnel.scale.set(scaleT, scaleT, scaleT);
      }
    }
  }

  function updateCamera() {
    if (!state.camera) return;
    state.camera.position.set(
      state.playerPos.x,
      state.playerPos.y + 2,
      state.playerPos.z + 18
    );
    state.camera.lookAt(state.playerPos.x, state.playerPos.y, state.playerPos.z);
  }

  function updatePlayer(dt) {
    var moveSpeed = 5;
    var moved = false;

    if (keysDown[65]) { state.playerPos.x -= moveSpeed * dt; moved = true; }
    if (keysDown[68]) { state.playerPos.x += moveSpeed * dt; moved = true; }
    if (keysDown[87]) { state.playerPos.z -= moveSpeed * dt; moved = true; }
    if (keysDown[83]) { state.playerPos.z += moveSpeed * dt; moved = true; }
    if (keysDown[81]) { state.playerPos.y += moveSpeed * dt; moved = true; }
    if (keysDown[90]) { state.playerPos.y -= moveSpeed * dt; moved = true; }

    state.playerPos.y = Math.max(-35, Math.min(10, state.playerPos.y));
  }

  function animate(timestamp) {
    if (!state.active) return;
    state.animFrameId = requestAnimationFrame(animate);

    var dt = (timestamp - state.lastTime) / 1000;
    if (dt > 0.1) dt = 0.1;
    state.lastTime = timestamp;

    updatePlayer(dt);
    updateBubbles(dt);
    updateO2(dt);
    updateDepthDamage(dt);
    updateDomeProximity();
    updateCurrentZones();
    updateDivers(dt);
    updateDarts(dt);
    updateSharks(dt);
    updateAirlock(dt);
    updateReactorPipes(dt);
    updateCollapsingObjects(dt);
    updateCamera();
    updateHUD();

    if (state.renderer && state.scene && state.camera) {
      state.renderer.render(state.scene, state.camera);
    }
  }

  var _uTime = null;
  var _bTime = null;

  function globalKeyHandler(e) {
    var now = Date.now();
    if (e.keyCode === ACTIVATION_KEY_U) _uTime = now;
    if (e.keyCode === ACTIVATION_KEY_B) _bTime = now;

    if (_uTime && _bTime && Math.abs(_uTime - _bTime) <= ACTIVATION_WINDOW) {
      _uTime = null;
      _bTime = null;
      if (!state.active) {
        init();
      }
    }

    if (e.keyCode === 27 && state.active) {
      destroy();
    }
  }

  window.addEventListener('keydown', globalKeyHandler);

  return {
    init: init,
    destroy: destroy,
    getState: function () { return state; }
  };

}());
