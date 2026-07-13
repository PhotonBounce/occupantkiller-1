window.PrisonColony = (function() {
  'use strict';

  var scene, camera, renderer, canvas, ctx, raycaster, mouse;
  var sceneObjects = [];
  var materials = {};
  var groups = {};
  var time = 0;
  var prisonersNeutralized = 0;
  var guardsAlive = 5;
  var escapeBoatSecured = true;
  var showHUD = true;
  var keysPressed = {};
  var lastPKey = 0;

  function init(container) {
    // Scene setup
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a2e);
    scene.fog = new THREE.Fog(0x1a1a2e, 300, 600);

    // Camera
    camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      2000
    );
    camera.position.set(0, 50, 80);
    camera.lookAt(0, 0, 0);

    // Renderer
    var width = window.innerWidth;
    var height = window.innerHeight;
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowShadowMap;
    container.appendChild(renderer.domElement);

    // Canvas HUD
    canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    canvas.style.position = 'absolute';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.pointerEvents = 'none';
    container.appendChild(canvas);
    ctx = canvas.getContext('2d');

    // Raycaster
    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();

    // Lighting
    var ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    var directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(100, 150, 100);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.left = -200;
    directionalLight.shadow.camera.right = 200;
    directionalLight.shadow.camera.top = 200;
    directionalLight.shadow.camera.bottom = -200;
    directionalLight.shadow.camera.far = 500;
    scene.add(directionalLight);

    // Hemispherical light for Arctic feel
    var hemiLight = new THREE.HemisphereLight(0x87ceeb, 0x4a90e2, 0.6);
    scene.add(hemiLight);

    // Materials
    materials.concrete = new THREE.MeshStandardMaterial({
      color: 0x8b8b8b,
      roughness: 0.8,
      metalness: 0.1
    });
    materials.snow = new THREE.MeshStandardMaterial({
      color: 0xe8e8f0,
      roughness: 0.9,
      metalness: 0
    });
    materials.steel = new THREE.MeshStandardMaterial({
      color: 0x404040,
      roughness: 0.3,
      metalness: 0.9
    });
    materials.wood = new THREE.MeshStandardMaterial({
      color: 0x8b7355,
      roughness: 0.7,
      metalness: 0
    });
    materials.prisoner = new THREE.MeshStandardMaterial({
      color: 0x7a7a7a,
      roughness: 0.6,
      metalness: 0
    });
    materials.guard = new THREE.MeshStandardMaterial({
      color: 0x2c2c2c,
      roughness: 0.7,
      metalness: 0.2
    });
    materials.searchlight = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0xffffff,
      emissiveIntensity: 1,
      metalness: 0.8
    });
    materials.fence = new THREE.LineBasicMaterial({ color: 0x444444, linewidth: 2 });
    materials.alarm = new THREE.MeshStandardMaterial({
      color: 0xff0000,
      emissive: 0xff0000,
      emissiveIntensity: 0.5
    });
    materials.boat = new THREE.MeshStandardMaterial({
      color: 0x1a472a,
      roughness: 0.6,
      metalness: 0.3
    });

    // Build scene
    buildArctic();
    buildMainCellBlock();
    buildSecondarycellBlock();
    buildGuardTower1();
    buildGuardTower2();
    buildPrisonYardFence();
    buildAdministrationBuilding();
    buildPrisonerBarracks();
    buildKitchenMessHall();
    buildWatchtowerSearchlight();
    buildRiotBarricade();
    buildPrisonerFigures();
    buildGuardFigures();
    buildGuardDogKennel();
    buildSolitaryConfinement();
    buildHelicopterPad();
    buildEscapeBoatDock();

    // Event listeners
    window.addEventListener('resize', onWindowResize);
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    return renderer;
  }

  function buildArctic() {
    var groundGeom = new THREE.BoxGeometry(400, 1, 400);
    var ground = new THREE.Mesh(groundGeom, materials.snow);
    ground.position.y = -1;
    ground.receiveShadow = true;
    scene.add(ground);
    sceneObjects.push(ground);
  }

  function buildMainCellBlock() {
    var blockGeom = new THREE.BoxGeometry(60, 25, 15);
    var block = new THREE.Mesh(blockGeom, materials.concrete);
    block.position.set(0, 13, -50);
    block.castShadow = true;
    block.receiveShadow = true;
    scene.add(block);
    sceneObjects.push(block);

    // Window bars
    var barGeom = new THREE.BufferGeometry();
    var positions = [];
    for (var i = 0; i < 8; i++) {
      var x = -28 + i * 8;
      positions.push(x, 5, -50);
      positions.push(x, 20, -50);
    }
    barGeom.setAttribute('position', new THREE.BufferAttribute(new Float32Array(positions), 3));
    var bars = new THREE.LineSegments(barGeom, materials.fence);
    bars.position.z = -42;
    scene.add(bars);
    sceneObjects.push(bars);
  }

  function buildSecondarycelBlock() {
    var blockGeom = new THREE.BoxGeometry(15, 25, 60);
    var block = new THREE.Mesh(blockGeom, materials.concrete);
    block.position.set(-60, 13, 0);
    block.castShadow = true;
    block.receiveShadow = true;
    scene.add(block);
    sceneObjects.push(block);

    // Window bars
    var barGeom = new THREE.BufferGeometry();
    var positions = [];
    for (var i = 0; i < 8; i++) {
      var z = -28 + i * 8;
      positions.push(-60, 5, z);
      positions.push(-60, 20, z);
    }
    barGeom.setAttribute('position', new THREE.BufferAttribute(new Float32Array(positions), 3));
    var bars = new THREE.LineSegments(barGeom, materials.fence);
    bars.position.x = -52;
    scene.add(bars);
    sceneObjects.push(bars);
  }

  function buildGuardTower1() {
    var cabinGeom = new THREE.BoxGeometry(10, 10, 10);
    var cabin = new THREE.Mesh(cabinGeom, materials.steel);
    cabin.position.set(70, 45, -70);
    cabin.castShadow = true;
    cabin.receiveShadow = true;
    scene.add(cabin);
    sceneObjects.push(cabin);

    // Legs
    var legGeom = new THREE.CylinderGeometry(1, 1, 40, 8);
    for (var i = 0; i < 4; i++) {
      var offsetX = i < 2 ? -4 : 4;
      var offsetZ = i % 2 === 0 ? -4 : 4;
      var leg = new THREE.Mesh(legGeom, materials.steel);
      leg.position.set(70 + offsetX, 20, -70 + offsetZ);
      leg.castShadow = true;
      leg.receiveShadow = true;
      scene.add(leg);
      sceneObjects.push(leg);
    }
  }

  function buildGuardTower2() {
    var cabinGeom = new THREE.BoxGeometry(10, 10, 10);
    var cabin = new THREE.Mesh(cabinGeom, materials.steel);
    cabin.position.set(-70, 45, 70);
    cabin.castShadow = true;
    cabin.receiveShadow = true;
    scene.add(cabin);
    sceneObjects.push(cabin);

    // Legs
    var legGeom = new THREE.CylinderGeometry(1, 1, 40, 8);
    for (var i = 0; i < 4; i++) {
      var offsetX = i < 2 ? -4 : 4;
      var offsetZ = i % 2 === 0 ? -4 : 4;
      var leg = new THREE.Mesh(legGeom, materials.steel);
      leg.position.set(-70 + offsetX, 20, 70 + offsetZ);
      leg.castShadow = true;
      leg.receiveShadow = true;
      scene.add(leg);
      sceneObjects.push(leg);
    }
  }

  function buildPrisonYardFence() {
    var fenceGeom = new THREE.BufferGeometry();
    var positions = [];

    // Rectangle perimeter
    var corners = [
      [-80, -80], [-80, 80], [80, 80], [80, -80]
    ];

    for (var i = 0; i < corners.length; i++) {
      var c1 = corners[i];
      var c2 = corners[(i + 1) % corners.length];
      positions.push(c1[0], 0, c1[1]);
      positions.push(c2[0], 0, c2[1]);
      positions.push(c1[0], 12, c1[1]);
      positions.push(c2[0], 12, c2[1]);
    }

    fenceGeom.setAttribute('position', new THREE.BufferAttribute(new Float32Array(positions), 3));
    var fence = new THREE.LineSegments(fenceGeom, materials.fence);
    scene.add(fence);
    sceneObjects.push(fence);

    // Fence posts (cylinders)
    var postGeom = new THREE.CylinderGeometry(0.8, 0.8, 12, 8);
    for (var j = 0; j < 16; j++) {
      var angle = (j / 16) * Math.PI * 2;
      var px = Math.cos(angle) * 80;
      var pz = Math.sin(angle) * 80;
      var post = new THREE.Mesh(postGeom, materials.steel);
      post.position.set(px, 6, pz);
      post.castShadow = true;
      post.receiveShadow = true;
      scene.add(post);
      sceneObjects.push(post);
    }

    // Alarm lights on posts
    groups.alarmLights = [];
    for (var k = 0; k < 8; k++) {
      var angle2 = (k / 8) * Math.PI * 2;
      var lx = Math.cos(angle2) * 80;
      var lz = Math.sin(angle2) * 80;
      var alarmGeom = new THREE.BoxGeometry(1, 1, 1);
      var alarm = new THREE.Mesh(alarmGeom, materials.alarm);
      alarm.position.set(lx, 13, lz);
      scene.add(alarm);
      sceneObjects.push(alarm);
      groups.alarmLights.push(alarm);
    }
  }

  function buildAdministrationBuilding() {
    var adminGeom = new THREE.BoxGeometry(40, 15, 25);
    var admin = new THREE.Mesh(adminGeom, materials.concrete);
    admin.position.set(0, 8, 60);
    admin.castShadow = true;
    admin.receiveShadow = true;
    scene.add(admin);
    sceneObjects.push(admin);

    // Flagpole
    var poleGeom = new THREE.CylinderGeometry(0.5, 0.5, 20, 8);
    var pole = new THREE.Mesh(poleGeom, materials.steel);
    pole.position.set(0, 25, 60);
    pole.castShadow = true;
    pole.receiveShadow = true;
    scene.add(pole);
    sceneObjects.push(pole);
  }

  function buildPrisonerBarracks() {
    var barracksGeom = new THREE.BoxGeometry(50, 12, 20);
    var barracks = new THREE.Mesh(barracksGeom, materials.wood);
    barracks.position.set(50, 6, -30);
    barracks.castShadow = true;
    barracks.receiveShadow = true;
    scene.add(barracks);
    sceneObjects.push(barracks);
  }

  function buildKitchenMessHall() {
    var kitchenGeom = new THREE.BoxGeometry(35, 14, 30);
    var kitchen = new THREE.Mesh(kitchenGeom, materials.concrete);
    kitchen.position.set(-50, 7, -30);
    kitchen.castShadow = true;
    kitchen.receiveShadow = true;
    scene.add(kitchen);
    sceneObjects.push(kitchen);

    // Exhaust vent
    var ventGeom = new THREE.CylinderGeometry(1.5, 1.5, 20, 8);
    var vent = new THREE.Mesh(ventGeom, materials.steel);
    vent.position.set(-50, 24, -30);
    vent.castShadow = true;
    vent.receiveShadow = true;
    scene.add(vent);
    sceneObjects.push(vent);
  }

  function buildWatchtowerSearchlight() {
    var searchGeom = new THREE.SphereGeometry(2, 16, 16);
    var searchlight = new THREE.Mesh(searchGeom, materials.searchlight);
    searchlight.position.set(70, 50, 70);
    scene.add(searchlight);
    sceneObjects.push(searchlight);
    groups.searchlight = searchlight;
  }

  function buildRiotBarricade() {
    // Overturned table
    var tableGeom = new THREE.BoxGeometry(10, 2, 10);
    var table = new THREE.Mesh(tableGeom, materials.wood);
    table.position.set(-20, 3, 20);
    table.rotation.z = 0.3;
    table.castShadow = true;
    table.receiveShadow = true;
    scene.add(table);
    sceneObjects.push(table);

    // Mattress boxes
    for (var i = 0; i < 3; i++) {
      var mattGeom = new THREE.BoxGeometry(8, 4, 8);
      var matt = new THREE.Mesh(mattGeom, materials.prisoner);
      matt.position.set(-20 + i * 5, 5 + i * 2, 25 + i * 3);
      matt.castShadow = true;
      matt.receiveShadow = true;
      scene.add(matt);
      sceneObjects.push(matt);
    }
  }

  function buildPrisonerFigures() {
    groups.prisoners = [];
    var positions = [
      [-30, 0, 0], [-20, 0, 10], [-10, 0, -5], [0, 0, 5],
      [10, 0, -10], [20, 0, 0], [30, 0, 10], [5, 0, -20]
    ];

    for (var i = 0; i < 8; i++) {
      var group = new THREE.Group();
      var bodyGeom = new THREE.BoxGeometry(2, 4, 1.5);
      var body = new THREE.Mesh(bodyGeom, materials.prisoner);
      body.castShadow = true;
      body.receiveShadow = true;
      group.add(body);

      var headGeom = new THREE.SphereGeometry(1, 8, 8);
      var head = new THREE.Mesh(headGeom, materials.prisoner);
      head.position.y = 3;
      head.castShadow = true;
      head.receiveShadow = true;
      group.add(head);

      group.position.set(positions[i][0], positions[i][1], positions[i][2]);
      scene.add(group);
      sceneObjects.push(group);
      groups.prisoners.push(group);
    }
  }

  function buildGuardFigures() {
    groups.guards = [];
    var positions = [
      [60, 0, -60], [50, 0, 50], [-60, 0, 60], [0, 0, -80], [40, 0, 40]
    ];

    for (var i = 0; i < 5; i++) {
      var group = new THREE.Group();
      var bodyGeom = new THREE.BoxGeometry(2, 4, 1.5);
      var body = new THREE.Mesh(bodyGeom, materials.guard);
      body.castShadow = true;
      body.receiveShadow = true;
      group.add(body);

      var headGeom = new THREE.SphereGeometry(1, 8, 8);
      var head = new THREE.Mesh(headGeom, materials.guard);
      head.position.y = 3;
      head.castShadow = true;
      head.receiveShadow = true;
      group.add(head);

      group.position.set(positions[i][0], positions[i][1], positions[i][2]);
      scene.add(group);
      sceneObjects.push(group);
      groups.guards.push(group);
    }
  }

  function buildGuardDogKennel() {
    var kennelGeom = new THREE.BoxGeometry(8, 6, 8);
    var kennel = new THREE.Mesh(kennelGeom, materials.wood);
    kennel.position.set(60, 3, 20);
    kennel.castShadow = true;
    kennel.receiveShadow = true;
    scene.add(kennel);
    sceneObjects.push(kennel);
  }

  function buildSolitaryConfinement() {
    for (var i = 0; i < 4; i++) {
      var cellGeom = new THREE.BoxGeometry(5, 8, 5);
      var cell = new THREE.Mesh(cellGeom, materials.steel);
      cell.position.set(-50 + i * 8, 4, 40);
      cell.castShadow = true;
      cell.receiveShadow = true;
      scene.add(cell);
      sceneObjects.push(cell);

      // Door bars
      var barGeom = new THREE.BufferGeometry();
      var positions = [];
      for (var j = 0; j < 5; j++) {
        var y = j * 2;
        positions.push(-50 + i * 8, y, 2.5);
        positions.push(-50 + i * 8, y, -2.5);
      }
      barGeom.setAttribute('position', new THREE.BufferAttribute(new Float32Array(positions), 3));
      var bars = new THREE.LineSegments(barGeom, materials.fence);
      scene.add(bars);
      sceneObjects.push(bars);
    }
  }

  function buildHelicopterPad() {
    var padGeom = new THREE.BoxGeometry(30, 0.5, 30);
    var pad = new THREE.Mesh(padGeom, materials.concrete);
    pad.position.set(60, 0, -60);
    pad.receiveShadow = true;
    scene.add(pad);
    sceneObjects.push(pad);

    // H marking
    var hGeom = new THREE.BufferGeometry();
    var positions = [];
    positions.push(-8, 0.3, -8);
    positions.push(-8, 0.3, 8);
    positions.push(8, 0.3, -8);
    positions.push(8, 0.3, 8);
    positions.push(-8, 0.3, 0);
    positions.push(8, 0.3, 0);
    hGeom.setAttribute('position', new THREE.BufferAttribute(new Float32Array(positions), 3));
    var hMark = new THREE.LineSegments(hGeom, new THREE.LineBasicMaterial({ color: 0xffff00 }));
    hMark.position.set(60, 0, -60);
    scene.add(hMark);
    sceneObjects.push(hMark);

    // Pulse light
    groups.heliPad = new THREE.Mesh(
      new THREE.SphereGeometry(1.5, 8, 8),
      new THREE.MeshStandardMaterial({
        color: 0xff6600,
        emissive: 0xff6600,
        emissiveIntensity: 0.8
      })
    );
    groups.heliPad.position.set(60, 1, -60);
    scene.add(groups.heliPad);
    sceneObjects.push(groups.heliPad);
  }

  function buildEscapeBoatDock() {
    // Pier
    var pierGeom = new THREE.BoxGeometry(20, 2, 30);
    var pier = new THREE.Mesh(pierGeom, materials.wood);
    pier.position.set(-70, 1, 0);
    pier.castShadow = true;
    pier.receiveShadow = true;
    scene.add(pier);
    sceneObjects.push(pier);

    // Motorboat
    var boatGeom = new THREE.BoxGeometry(12, 4, 8);
    var boat = new THREE.Mesh(boatGeom, materials.boat);
    boat.position.set(-70, 4, 0);
    boat.castShadow = true;
    boat.receiveShadow = true;
    scene.add(boat);
    sceneObjects.push(boat);
    groups.escapeBoat = boat;
  }

  function update() {
    time += 0.016;

    // Searchlight sweep
    if (groups.searchlight) {
      var angle = time * 0.3;
      groups.searchlight.position.x = 70 + Math.sin(angle) * 30;
      groups.searchlight.position.z = 70 + Math.cos(angle) * 30;
    }

    // Prisoners surge toward guards
    if (groups.prisoners) {
      for (var i = 0; i < groups.prisoners.length; i++) {
        var prisoner = groups.prisoners[i];
        var wave = Math.sin(time * 1.5 + i) * 5;
        prisoner.position.y = Math.max(0, wave);
        prisoner.rotation.z = Math.sin(time * 2 + i) * 0.2;
      }
    }

    // Guards retreat to barricades
    if (groups.guards) {
      for (var j = 0; j < groups.guards.length; j++) {
        var guard = groups.guards[j];
        var retreat = Math.sin(time * 0.8 + j * 1.5) * 3;
        guard.position.x += retreat * 0.01;
        guard.rotation.z = Math.sin(time * 1.2 + j) * 0.15;
      }
    }

    // Helicopter pad light pulse
    if (groups.heliPad) {
      var pulseMult = 0.5 + Math.sin(time * 3) * 0.5;
      groups.heliPad.material.emissiveIntensity = pulseMult;
    }

    // Fence alarm lights strobe
    if (groups.alarmLights) {
      var strobeOn = Math.floor(time * 4) % 2 === 0;
      for (var k = 0; k < groups.alarmLights.length; k++) {
        groups.alarmLights[k].visible = strobeOn;
      }
    }

    // Render
    renderer.render(scene, camera);

    // Draw HUD
    if (showHUD) {
      drawHUD();
    }
  }

  function drawHUD() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.font = 'bold 20px Arial';
    ctx.fillText('PRISONERS NEUTRALIZED: ' + prisonersNeutralized + '/8', 20, 40);
    ctx.fillText('GUARDS ALIVE: ' + guardsAlive + '/5', 20, 70);
    var boatStatus = escapeBoatSecured ? 'SECURED' : 'ESCAPED';
    ctx.fillText('ESCAPE BOAT: ' + boatStatus, 20, 100);
  }

  function onKeyDown(e) {
    keysPressed[e.key] = true;

    // Detect P+C chord (P then C within 400ms)
    if (e.key === 'p' || e.key === 'P') {
      lastPKey = Date.now();
    }
    if ((e.key === 'c' || e.key === 'C') && (Date.now() - lastPKey < 400)) {
      showHUD = !showHUD;
      lastPKey = 0;
    }
  }

  function onKeyUp(e) {
    keysPressed[e.key] = false;
  }

  function onWindowResize() {
    var width = window.innerWidth;
    var height = window.innerHeight;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
    canvas.width = width;
    canvas.height = height;
  }

  function reset() {
    // Dispose all materials
    var materialsArray = Object.keys(materials);
    for (var i = 0; i < materialsArray.length; i++) {
      materials[materialsArray[i]].dispose();
    }

    // Dispose all geometries and objects
    for (var j = 0; j < sceneObjects.length; j++) {
      var obj = sceneObjects[j];
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        if (Array.isArray(obj.material)) {
          for (var k = 0; k < obj.material.length; k++) {
            obj.material[k].dispose();
          }
        } else {
          obj.material.dispose();
        }
      }
      scene.remove(obj);
    }

    sceneObjects = [];
    materials = {};
    groups = {};
    time = 0;
    prisonersNeutralized = 0;
    guardsAlive = 5;
    escapeBoatSecured = true;
    showHUD = true;

    if (renderer) renderer.dispose();
    if (canvas && canvas.parentNode) canvas.parentNode.removeChild(canvas);
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
