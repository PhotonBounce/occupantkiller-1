window.CiaSafehouse = (function() {
  'use strict';

  // --- State ---
  var scene, camera, renderer, clock;
  var keys = {}, mouseDown = false;
  var yaw = 0, pitch = 0;
  var playerHP = 100, playerPos, playerVel;
  var wave = 0, waveActive = false, waveTimer = 0, totalTime = 0;
  var agents = [], barricades = [], entryPoints = [];
  var petrov, petrovHP = 60, petrovDead = false, petrovEscorted = false;
  var suv = null, suvHP = 3, helicopter = null, heliHP = 8;
  var heliFireTimer = 0;
  var flashbangActive = false, flashbangTimer = 0;
  var barricadeCounts = [3, 3, 3, 3]; // per entry point
  var c4Charges = 3, flashbangs = 3;
  var extractionHeli = null, extractionActive = false;
  var gameOver = false, gameWon = false;
  var hud = null;
  var raycaster, bullets = [];
  var cKeyTime = 0, iKeyTime = 0, activated = false;
  var waveConfig = [
    { agents: 3, sniper: false, suv: false, heli: false },
    { agents: 6, sniper: false, suv: false, heli: false },
    { agents: 8, sniper: true,  suv: false, heli: false },
    { agents: 10, sniper: false, suv: true, heli: false },
    { agents: 15, sniper: false, suv: false, heli: true }
  ];
  var ENTRY_POSITIONS = [
    new THREE.Vector3(-10, 0, 0),
    new THREE.Vector3(10, 0, 0),
    new THREE.Vector3(0, 0, -7.5),
    new THREE.Vector3(0, 0, 7.5)
  ];
  var spawns = [
    new THREE.Vector3(-40, 0, 0),
    new THREE.Vector3(40, 0, 0),
    new THREE.Vector3(0, 0, -40),
    new THREE.Vector3(0, 0, 40),
    new THREE.Vector3(-30, 0, 30),
    new THREE.Vector3(30, 0, -30)
  ];

  // --- Init ---
  function init(container) {
    if (!activated) return;
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a2e);
    scene.fog = new THREE.Fog(0x1a1a2e, 30, 120);

    camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 200);
    camera.position.set(0, 2, 10);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);

    clock = new THREE.Clock();
    raycaster = new THREE.Raycaster();
    playerPos = new THREE.Vector3(0, 2, 10);
    playerVel = new THREE.Vector3();

    buildWorld();
    buildHUD(container);
    setupInput(container);

    wave = 0;
    startWave(1);
  }

  function buildWorld() {
    // Ground
    var groundGeo = new THREE.BoxGeometry(200, 0.5, 200);
    var groundMat = new THREE.MeshLambertMaterial({ color: 0x333322 });
    var ground = new THREE.Mesh(groundGeo, groundMat);
    ground.position.y = -0.25;
    ground.receiveShadow = true;
    scene.add(ground);

    // Ambient + directional light
    var ambient = new THREE.AmbientLight(0x404060, 0.6);
    scene.add(ambient);
    var dirLight = new THREE.DirectionalLight(0xffeedd, 0.8);
    dirLight.position.set(20, 30, 10);
    dirLight.castShadow = true;
    scene.add(dirLight);

    // Safehouse main floor
    var shGeo = new THREE.BoxGeometry(20, 5, 15);
    var shMat = new THREE.MeshLambertMaterial({ color: 0x776655 });
    var safehouse = new THREE.Mesh(shGeo, shMat);
    safehouse.position.set(0, 2.5, 0);
    safehouse.castShadow = true;
    safehouse.receiveShadow = true;
    scene.add(safehouse);
    safehouse.userData.isSafehouse = true;

    // Basement (lower floor, partly underground)
    var bGeo = new THREE.BoxGeometry(18, 3, 13);
    var bMat = new THREE.MeshLambertMaterial({ color: 0x554433 });
    var basement = new THREE.Mesh(bGeo, bMat);
    basement.position.set(0, -1.5, 0);
    scene.add(basement);

    // Entry points (doors/windows markers)
    var epMat = new THREE.MeshLambertMaterial({ color: 0x887766 });
    for (var i = 0; i < ENTRY_POSITIONS.length; i++) {
      var ep = ENTRY_POSITIONS[i];
      var epGeo = new THREE.BoxGeometry(2, 3, 0.3);
      var epMesh = new THREE.Mesh(epGeo, epMat);
      epMesh.position.copy(ep);
      epMesh.position.y = 1.5;
      scene.add(epMesh);
      entryPoints.push({ pos: ep.clone(), mesh: epMesh, index: i });
    }

    // Alley
    var alleyGeo = new THREE.BoxGeometry(6, 0.2, 60);
    var alleyMat = new THREE.MeshLambertMaterial({ color: 0x555544 });
    var alley = new THREE.Mesh(alleyGeo, alleyMat);
    alley.position.set(15, 0.1, 0);
    scene.add(alley);

    // Apartment buildings
    var aptPositions = [
      [-30, 10], [-30, -15], [30, 10], [30, -15], [0, 30], [0, -30]
    ];
    for (var ai = 0; ai < aptPositions.length; ai++) {
      var h = 10 + Math.random() * 10;
      var aptGeo = new THREE.BoxGeometry(10, h, 10);
      var aptMat = new THREE.MeshLambertMaterial({ color: 0x445566 });
      var apt = new THREE.Mesh(aptGeo, aptMat);
      apt.position.set(aptPositions[ai][0], h / 2, aptPositions[ai][1]);
      apt.castShadow = true;
      scene.add(apt);
    }

    // Parked cars
    var carPositions = [
      [12, 0, 5], [12, 0, -5], [-15, 0, 8], [-15, 0, -8], [5, 0, 20]
    ];
    for (var ci = 0; ci < carPositions.length; ci++) {
      var carGeo = new THREE.BoxGeometry(4, 1.5, 2);
      var carMat = new THREE.MeshLambertMaterial({ color: 0x223344 });
      var car = new THREE.Mesh(carGeo, carMat);
      car.position.set(carPositions[ci][0], 0.75, carPositions[ci][2]);
      scene.add(car);
    }

    // Dr. Petrov in basement
    var petrovGeo = new THREE.BoxGeometry(0.6, 1.8, 0.4);
    var petrovMat = new THREE.MeshLambertMaterial({ color: 0x886655 });
    petrov = new THREE.Mesh(petrovGeo, petrovMat);
    petrov.position.set(0, -0.6, 0);
    scene.add(petrov);

    // Roof marker
    var roofGeo = new THREE.BoxGeometry(4, 0.2, 4);
    var roofMat = new THREE.MeshLambertMaterial({ color: 0xffff00 });
    var roof = new THREE.Mesh(roofGeo, roofMat);
    roof.position.set(0, 5.1, 0);
    roof.userData.isRoofLZ = true;
    scene.add(roof);
  }

  function buildHUD(container) {
    hud = document.createElement('div');
    hud.style.cssText = 'position:absolute;top:10px;left:10px;color:#00ff88;font:12px monospace;pointer-events:none;text-shadow:0 0 4px #00ff88;background:rgba(0,0,0,0.5);padding:6px 10px;border:1px solid #00ff88;';
    container.style.position = 'relative';
    container.appendChild(hud);

    var crosshair = document.createElement('div');
    crosshair.style.cssText = 'position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);color:#00ff88;font:20px monospace;pointer-events:none;';
    crosshair.textContent = '+';
    container.appendChild(crosshair);

    var msg = document.createElement('div');
    msg.id = 'cia-msg';
    msg.style.cssText = 'position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);color:#ffff00;font:18px monospace;pointer-events:none;text-align:center;display:none;';
    container.appendChild(msg);
  }

  function setupInput(container) {
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', function(e) { keys[e.code] = false; });
    container.addEventListener('click', function() {
      if (activated && !gameOver) container.requestPointerLock();
    });
    document.addEventListener('pointerlockchange', function() {});
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mousedown', function(e) { if (e.button === 0) mouseDown = true; shootBullet(); });
    document.addEventListener('mouseup', function(e) { if (e.button === 0) mouseDown = false; });
  }

  function onKeyDown(e) {
    keys[e.code] = true;
    // Activation: C then I within 400ms
    if (e.code === 'KeyC') cKeyTime = Date.now();
    if (e.code === 'KeyI') {
      iKeyTime = Date.now();
      if (iKeyTime - cKeyTime < 400) activated = true;
    }
    if (!activated || gameOver) return;
    if (e.code === 'KeyE') useE();
    if (e.code === 'KeyF') useFlashbang();
    if (e.code === 'KeyG') placeC4();
  }

  function onMouseMove(e) {
    if (!activated || gameOver) return;
    if (document.pointerLockElement) {
      yaw -= e.movementX * 0.002;
      pitch -= e.movementY * 0.002;
      pitch = Math.max(-Math.PI / 2.5, Math.min(Math.PI / 2.5, pitch));
    }
  }

  // --- Wave system ---
  function startWave(n) {
    wave = n;
    waveActive = true;
    waveTimer = 0;
    var cfg = waveConfig[n - 1];
    spawnAgents(cfg.agents);
    if (cfg.suv) spawnSUV();
    if (cfg.heli) spawnHelicopter();
    showMessage('WAVE ' + n + ' - INCOMING!', 2000);
  }

  function spawnAgents(count) {
    for (var i = 0; i < count; i++) {
      var sp = spawns[i % spawns.length].clone();
      sp.x += (Math.random() - 0.5) * 6;
      sp.z += (Math.random() - 0.5) * 6;
      var agGeo = new THREE.BoxGeometry(0.6, 1.8, 0.4);
      var agMat = new THREE.MeshLambertMaterial({ color: 0x334433 });
      var ag = new THREE.Mesh(agGeo, agMat);
      ag.position.copy(sp);
      ag.position.y = 0.9;
      scene.add(ag);
      agents.push({ mesh: ag, hp: 90, stunTimer: 0, target: getRandomEntry(), moveTimer: 0, breached: false });
    }
  }

  function spawnSUV() {
    var suvGeo = new THREE.BoxGeometry(4, 2, 8);
    var suvMat = new THREE.MeshLambertMaterial({ color: 0x334455 });
    suv = new THREE.Mesh(suvGeo, suvMat);
    suv.position.set(-40, 1, 0);
    suvHP = 3;
    scene.add(suv);
  }

  function spawnHelicopter() {
    var bodyGeo = new THREE.CylinderGeometry(0, 2, 3, 6);
    var bodyMat = new THREE.MeshLambertMaterial({ color: 0x223344 });
    helicopter = new THREE.Mesh(bodyGeo, bodyMat);
    helicopter.position.set(0, 25, 0);
    heliHP = 8;
    heliFireTimer = 0;
    scene.add(helicopter);

    var rotorGeo = new THREE.CylinderGeometry(0.1, 0.1, 0.2, 6);
    var rotorMat = new THREE.MeshLambertMaterial({ color: 0x445566 });
    var rotor = new THREE.Mesh(rotorGeo, rotorMat);
    rotor.position.y = 1.8;
    helicopter.add(rotor);

    var bladesGeo = new THREE.BoxGeometry(8, 0.1, 0.3);
    var bladesMat = new THREE.MeshLambertMaterial({ color: 0x556677 });
    var blades = new THREE.Mesh(bladesGeo, bladesMat);
    blades.position.y = 2.0;
    helicopter.add(blades);
  }

  // --- Game actions ---
  function useE() {
    // Check if near extraction LZ with Petrov escorted
    if (extractionActive && petrovEscorted && playerPos.y > 4) {
      triggerWin();
      return;
    }
    // Escort Petrov from basement
    if (!petrovEscorted && petrov && playerPos.distanceTo(petrov.position) < 5) {
      petrovEscorted = true;
      showMessage('DR. PETROV ESCORTED - REACH THE ROOF!', 3000);
      return;
    }
    // Place barricade at nearest entry point
    var nearest = getNearestEntry();
    if (nearest && nearest.dist < 5 && barricadeCounts[nearest.index] > 0) {
      barricadeCounts[nearest.index]--;
      placeBarricade(nearest.pos, nearest.index);
    }
  }

  function useFlashbang() {
    if (flashbangs <= 0) return;
    flashbangs--;
    flashbangActive = true;
    flashbangTimer = 3;
    // Stun all agents in "line of sight" (simplified: agents facing camera direction)
    for (var i = 0; i < agents.length; i++) {
      var ag = agents[i];
      var dir = ag.mesh.position.clone().sub(playerPos).normalize();
      var camDir = new THREE.Vector3();
      camera.getWorldDirection(camDir);
      var dot = dir.dot(camDir);
      if (dot > 0.3) {
        ag.stunTimer = 3;
      }
    }
    showMessage('FLASHBANG!', 1500);
  }

  function placeC4() {
    if (c4Charges <= 0) return;
    c4Charges--;
    // C4 explosion damages all nearby enemies
    for (var i = agents.length - 1; i >= 0; i--) {
      var ag = agents[i];
      if (ag.mesh.position.distanceTo(playerPos) < 8) {
        ag.hp -= 90;
        if (ag.hp <= 0) removeAgent(i);
      }
    }
    if (suv && suv.position.distanceTo(playerPos) < 10) {
      suvHP--;
      if (suvHP <= 0) destroySUV();
    }
    showMessage('C4 DETONATED!', 1500);
  }

  function placeBarricade(pos, idx) {
    var bGeo = new THREE.BoxGeometry(2, 1.5, 0.3);
    var bMat = new THREE.MeshLambertMaterial({ color: 0x886644 });
    var barr = new THREE.Mesh(bGeo, bMat);
    barr.position.copy(pos);
    barr.position.y = 0.75;
    scene.add(barr);
    barricades.push({ mesh: barr, hp: 60, entryIndex: idx });
  }

  function getNearestEntry() {
    var best = null, bestDist = Infinity;
    for (var i = 0; i < entryPoints.length; i++) {
      var d = playerPos.distanceTo(entryPoints[i].pos);
      if (d < bestDist) { bestDist = d; best = { pos: entryPoints[i].pos, index: i, dist: d }; }
    }
    return best;
  }

  function getRandomEntry() {
    return entryPoints[Math.floor(Math.random() * entryPoints.length)];
  }

  function shootBullet() {
    if (!activated || gameOver) return;
    var dir = new THREE.Vector3();
    camera.getWorldDirection(dir);
    var origin = camera.position.clone();
    raycaster.set(origin, dir);
    // Check agents
    var agMeshes = agents.map(function(a) { return a.mesh; });
    var hits = raycaster.intersectObjects(agMeshes);
    if (hits.length > 0) {
      var hit = hits[0].object;
      for (var i = agents.length - 1; i >= 0; i--) {
        if (agents[i].mesh === hit) {
          agents[i].hp -= 25;
          if (agents[i].hp <= 0) removeAgent(i);
          break;
        }
      }
    }
    // Check helicopter
    if (helicopter) {
      var heliHits = raycaster.intersectObject(helicopter, true);
      if (heliHits.length > 0) {
        heliHP--;
        if (heliHP <= 0) destroyHelicopter();
      }
    }
    // Check SUV
    if (suv) {
      var suvHits = raycaster.intersectObject(suv);
      if (suvHits.length > 0) {
        // Only C4/explosive damages SUV normally, but allow hits to register
        // (player needs G for C4; regular fire does 0 damage to SUV)
      }
    }
  }

  function removeAgent(i) {
    scene.remove(agents[i].mesh);
    agents.splice(i, 1);
  }

  function destroySUV() {
    if (suv) { scene.remove(suv); suv = null; }
    showMessage('SUV DESTROYED!', 1500);
  }

  function destroyHelicopter() {
    if (helicopter) { scene.remove(helicopter); helicopter = null; }
    showMessage('HELICOPTER DOWN!', 2000);
  }

  // --- Update ---
  function update() {
    if (!activated || gameOver) return;
    var dt = clock.getDelta();
    totalTime += dt;
    waveTimer += dt;

    updatePlayer(dt);
    updateAgents(dt);
    updateSUV(dt);
    updateHelicopter(dt);
    updatePetrov(dt);
    updateBarricades(dt);
    updateFlashbang(dt);
    checkWaveEnd();
    updateHUD();
    renderer.render(scene, camera);
  }

  function updatePlayer(dt) {
    var moveDir = new THREE.Vector3();
    var forward = new THREE.Vector3(-Math.sin(yaw), 0, -Math.cos(yaw));
    var right = new THREE.Vector3(Math.cos(yaw), 0, -Math.sin(yaw));

    if (keys['KeyW']) moveDir.add(forward);
    if (keys['KeyS']) moveDir.sub(forward);
    if (keys['KeyA']) moveDir.sub(right);
    if (keys['KeyD']) moveDir.add(right);

    moveDir.normalize().multiplyScalar(8 * dt);
    playerPos.add(moveDir);
    playerPos.y = Math.max(2, playerPos.y);

    // Gravity / vertical
    if (keys['Space']) playerPos.y += 5 * dt;

    camera.position.copy(playerPos);
    camera.rotation.order = 'YXZ';
    camera.rotation.y = yaw;
    camera.rotation.x = pitch;
  }

  function updateAgents(dt) {
    for (var i = agents.length - 1; i >= 0; i--) {
      var ag = agents[i];
      if (ag.stunTimer > 0) { ag.stunTimer -= dt; continue; }
      // Move toward entry point
      var ep = ag.target || entryPoints[0];
      var targetPos = ag.breached ? petrov.position.clone() : ep.pos.clone();
      targetPos.y = ag.mesh.position.y;
      var dir = targetPos.clone().sub(ag.mesh.position);
      var dist = dir.length();
      if (dist > 0.5) {
        dir.normalize().multiplyScalar(3 * dt);
        ag.mesh.position.add(dir);
      } else if (!ag.breached) {
        ag.breached = true;
        // Damage barricades at this entry
        for (var bi = barricades.length - 1; bi >= 0; bi--) {
          if (barricades[bi].entryIndex === ep.index) {
            barricades[bi].hp -= 20 * dt;
            if (barricades[bi].hp <= 0) {
              scene.remove(barricades[bi].mesh);
              barricades.splice(bi, 1);
            }
            break;
          }
        }
      }
      // Attack Petrov if close
      if (ag.breached && petrov && ag.mesh.position.distanceTo(petrov.position) < 2) {
        petrovHP -= 10 * dt;
        if (petrovHP <= 0 && !petrovDead) {
          petrovDead = true;
          triggerLose('DR. PETROV HAS BEEN ELIMINATED');
        }
      }
      // Attack player
      if (ag.mesh.position.distanceTo(playerPos) < 2) {
        playerHP -= 8 * dt;
        if (playerHP <= 0) triggerLose('AGENT DOWN');
      }
    }
  }

  function updateSUV(dt) {
    if (!suv) return;
    var frontDoor = ENTRY_POSITIONS[0];
    var dir = frontDoor.clone().sub(suv.position);
    var dist = dir.length();
    if (dist > 1) {
      dir.normalize().multiplyScalar(5 * dt);
      suv.position.add(dir);
    }
  }

  function updateHelicopter(dt) {
    if (!helicopter) return;
    helicopter.rotation.y += dt;
    heliFireTimer += dt;
    if (heliFireTimer > 5) {
      heliFireTimer = 0;
      playerHP -= 15;
      if (playerHP <= 0) triggerLose('AGENT DOWN - HELICOPTER FIRE');
      showMessage('HELICOPTER FIRE!', 1000);
    }
  }

  function updatePetrov(dt) {
    if (petrovDead || !petrov) return;
    // Slow heal
    if (petrovHP < 60) petrovHP = Math.min(60, petrovHP + 2 * dt);
    if (petrovEscorted) {
      // Follow player
      var dir = playerPos.clone().sub(petrov.position);
      dir.y = 0;
      if (dir.length() > 1.5) {
        dir.normalize().multiplyScalar(4 * dt);
        petrov.position.add(dir);
      }
    }
  }

  function updateBarricades(dt) {
    // Barricade decay handled in agent attack; nothing extra here
  }

  function updateFlashbang(dt) {
    if (flashbangActive) {
      flashbangTimer -= dt;
      if (flashbangTimer <= 0) flashbangActive = false;
    }
  }

  function checkWaveEnd() {
    if (!waveActive) return;
    var allDead = agents.length === 0 && !suv && !helicopter;
    if (allDead) {
      waveActive = false;
      if (wave >= 5) {
        // Trigger extraction
        extractionActive = true;
        spawnExtractionHeli();
        showMessage('EXTRACTION INBOUND - REACH THE ROOF WITH DR. PETROV!', 5000);
      } else {
        showMessage('WAVE ' + wave + ' CLEARED! PREPARE FOR NEXT WAVE...', 3000);
        var nextWave = wave + 1;
        setTimeout(function() { startWave(nextWave); }, 3000);
      }
    }
  }

  function spawnExtractionHeli() {
    var eGeo = new THREE.CylinderGeometry(0, 3, 4, 6);
    var eMat = new THREE.MeshLambertMaterial({ color: 0x334455 });
    extractionHeli = new THREE.Mesh(eGeo, eMat);
    extractionHeli.position.set(0, 12, 0);
    scene.add(extractionHeli);
  }

  function triggerWin() {
    gameWon = true;
    gameOver = true;
    showMessage('MISSION COMPLETE - DR. PETROV EXTRACTED SAFELY!', 99999);
  }

  function triggerLose(reason) {
    gameOver = true;
    showMessage('MISSION FAILED: ' + reason, 99999);
  }

  function showMessage(msg, duration) {
    var el = document.getElementById('cia-msg');
    if (!el) return;
    el.textContent = msg;
    el.style.display = 'block';
    if (duration < 99999) {
      setTimeout(function() { el.style.display = 'none'; }, duration);
    }
  }

  function updateHUD() {
    if (!hud) return;
    var minutes = Math.floor(totalTime / 60);
    var seconds = Math.floor(totalTime % 60);
    var timeStr = (minutes < 10 ? '0' : '') + minutes + ':' + (seconds < 10 ? '0' : '') + seconds;
    var petrovStatus = petrovDead ? 'DEAD' : (petrovHP < 20 ? 'WOUNDED ' + Math.floor(petrovHP) + 'HP' : 'SAFE ' + Math.floor(petrovHP) + 'HP');
    var totalBarricades = barricadeCounts[0] + barricadeCounts[1] + barricadeCounts[2] + barricadeCounts[3];
    hud.innerHTML =
      'CIA SAFEHOUSE [WAVE: ' + wave + '/5] [PETROV: ' + petrovStatus + '] [AGENTS: ' + agents.length + ']<br>' +
      '[BARRICADES: ' + totalBarricades + ' REMAINING] [TIMER: ' + timeStr + '] [HP: ' + Math.floor(playerHP) + ']<br>' +
      '[C4: ' + c4Charges + '] [FLASHBANGS: ' + flashbangs + '] [E:Barricade/Escort F:Flashbang G:C4]';
  }

  function reset() {
    agents = [];
    barricades = [];
    entryPoints = [];
    petrovHP = 60;
    petrovDead = false;
    petrovEscorted = false;
    playerHP = 100;
    wave = 0;
    waveActive = false;
    waveTimer = 0;
    totalTime = 0;
    suv = null;
    helicopter = null;
    extractionHeli = null;
    extractionActive = false;
    gameOver = false;
    gameWon = false;
    flashbangActive = false;
    flashbangTimer = 0;
    barricadeCounts = [3, 3, 3, 3];
    c4Charges = 3;
    flashbangs = 3;
    heliFireTimer = 0;
    activated = false;
    cKeyTime = 0;
    iKeyTime = 0;
    if (scene) {
      while (scene.children.length > 0) scene.remove(scene.children[0]);
    }
    if (renderer && renderer.domElement && renderer.domElement.parentNode) {
      renderer.domElement.parentNode.removeChild(renderer.domElement);
    }
    if (hud && hud.parentNode) hud.parentNode.removeChild(hud);
    scene = null; camera = null; renderer = null; clock = null; hud = null;
  }

  return { init: init, update: update, reset: reset };
})();
