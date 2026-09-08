window.TrenchWar = (function() {
  'use strict';
  var requestAnimationFrame = (typeof window !== 'undefined' && window.__ALLOW_EMBEDDED_MINIGAMES) ? window.requestAnimationFrame.bind(window) : function () { return 0; };
  var setTimeout = (typeof window !== 'undefined' && window.__ALLOW_EMBEDDED_MINIGAMES) ? window.setTimeout.bind(window) : function () { return 0; };

  var scene;
  var camera;
  var renderer;
  var environment = [];
  var dynamicElements = [];
  var flareLight;
  var artilleryLight;
  var gasAlarmBell;
  var time = 0;

  var COLORS = {
    mudBrown: 0x5C4033,
    darkMetal: 0x2B2B2B,
    sandTan: 0xC2B280,
    barbed: 0x8B7355,
    wood: 0x654321,
    sandbag: 0xA0826D,
    concrete: 0x808080,
    grass: 0x3D5C2F
  };

  function createRenderer(container) {
    var width = window.innerWidth || 1024;
    var height = window.innerHeight || 768;

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowShadowMap;

    if (container) {
      container.appendChild(renderer.domElement);
    } else if (document.body) {
      document.body.appendChild(renderer.domElement);
    }

    return renderer;
  }

  function createCamera() {
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 3, 0);
    camera.lookAt(0, 0, 20);
    return camera;
  }

  function createLights() {
    var ambientLight = new THREE.AmbientLight(0xFFFFFF, 0.4);
    scene.add(ambientLight);

    var directionalLight = new THREE.DirectionalLight(0xFFFFFF, 0.6);
    directionalLight.position.set(40, 40, 40);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.left = -100;
    directionalLight.shadow.camera.right = 100;
    directionalLight.shadow.camera.top = 100;
    directionalLight.shadow.camera.bottom = -100;
    scene.add(directionalLight);

    flareLight = new THREE.PointLight(0xFFFFFF, 0, 100);
    flareLight.position.set(-30, 35, 10);
    scene.add(flareLight);

    artilleryLight = new THREE.PointLight(0xFF6600, 0, 80);
    artilleryLight.position.set(25, 20, -30);
    scene.add(artilleryLight);
  }

  function createMainTrench() {
    var trenchGroup = new THREE.Group();

    // Main trench walls (deep zigzag corridor)
    var wallMaterial = new THREE.MeshStandardMaterial({
      color: COLORS.mudBrown,
      roughness: 0.8,
      metalness: 0.1
    });

    // Left wall of main trench
    var leftWallGeom = new THREE.BoxGeometry(2, 8, 60);
    var leftWall = new THREE.Mesh(leftWallGeom, wallMaterial);
    leftWall.position.set(-6, -4, 0);
    leftWall.castShadow = true;
    leftWall.receiveShadow = true;
    trenchGroup.add(leftWall);
    environment.push(leftWall);

    // Right wall of main trench
    var rightWallGeom = new THREE.BoxGeometry(2, 8, 60);
    var rightWall = new THREE.Mesh(rightWallGeom, wallMaterial);
    rightWall.position.set(6, -4, 0);
    rightWall.castShadow = true;
    rightWall.receiveShadow = true;
    trenchGroup.add(rightWall);
    environment.push(rightWall);

    // Duckboard flooring
    var duckboardMaterial = new THREE.MeshStandardMaterial({
      color: COLORS.wood,
      roughness: 0.7,
      metalness: 0.0
    });

    for (var i = 0; i < 8; i++) {
      var boardGeom = new THREE.BoxGeometry(11, 0.3, 6);
      var board = new THREE.Mesh(boardGeom, duckboardMaterial);
      board.position.set(0, -4.5, -27 + i * 7.5);
      board.castShadow = true;
      board.receiveShadow = true;
      trenchGroup.add(board);
      environment.push(board);
    }

    scene.add(trenchGroup);
  }

  function createZigzagSection() {
    var zigzagGroup = new THREE.Group();

    // Communication trench connecting lines
    var commTrenchMaterial = new THREE.MeshStandardMaterial({
      color: COLORS.mudBrown,
      roughness: 0.8,
      metalness: 0.05
    });

    // Left diagonal connection
    var leftDiagGeom = new THREE.BoxGeometry(2, 7, 15);
    var leftDiag = new THREE.Mesh(leftDiagGeom, commTrenchMaterial);
    leftDiag.position.set(-12, -4, 25);
    leftDiag.rotation.z = 0.3;
    leftDiag.castShadow = true;
    leftDiag.receiveShadow = true;
    zigzagGroup.add(leftDiag);
    environment.push(leftDiag);

    // Right diagonal connection
    var rightDiagGeom = new THREE.BoxGeometry(2, 7, 15);
    var rightDiag = new THREE.Mesh(rightDiagGeom, commTrenchMaterial);
    rightDiag.position.set(12, -4, 25);
    rightDiag.rotation.z = -0.3;
    rightDiag.castShadow = true;
    rightDiag.receiveShadow = true;
    zigzagGroup.add(rightDiag);
    environment.push(rightDiag);

    scene.add(zigzagGroup);
  }

  function createCommandBunker() {
    var bunkerGroup = new THREE.Group();

    var bunkerMaterial = new THREE.MeshStandardMaterial({
      color: COLORS.concrete,
      roughness: 0.9,
      metalness: 0.1
    });

    // Main bunker box (reinforced dugout)
    var bunkerGeom = new THREE.BoxGeometry(8, 5, 10);
    var bunker = new THREE.Mesh(bunkerGeom, bunkerMaterial);
    bunker.position.set(-15, -3, 10);
    bunker.castShadow = true;
    bunker.receiveShadow = true;
    bunkerGroup.add(bunker);
    environment.push(bunker);

    // Bunker roof support beams
    var beamMaterial = new THREE.MeshStandardMaterial({
      color: COLORS.darkMetal,
      roughness: 0.5,
      metalness: 0.8
    });

    for (var i = 0; i < 3; i++) {
      var beamGeom = new THREE.CylinderGeometry(0.3, 0.3, 8, 16);
      var beam = new THREE.Mesh(beamGeom, beamMaterial);
      beam.position.set(-15 + (i - 1) * 4, 0, 10);
      beam.castShadow = true;
      bunkerGroup.add(beam);
      environment.push(beam);
    }

    scene.add(bunkerGroup);
  }

  function createAmmoDump() {
    var ammoGroup = new THREE.Group();

    var ammoMaterial = new THREE.MeshStandardMaterial({
      color: COLORS.sandbag,
      roughness: 0.8,
      metalness: 0.0
    });

    // Stacked ammo crates
    for (var x = 0; x < 3; x++) {
      for (var z = 0; z < 2; z++) {
        var crateGeom = new THREE.BoxGeometry(2, 2, 2);
        var crate = new THREE.Mesh(crateGeom, ammoMaterial);
        crate.position.set(15 + x * 2.5, -1.5 + z * 2, 5);
        crate.castShadow = true;
        crate.receiveShadow = true;
        ammoGroup.add(crate);
        environment.push(crate);
      }
    }

    scene.add(ammoGroup);
  }

  function createArtilleryPosition() {
    var artilleryGroup = new THREE.Group();

    var metalMaterial = new THREE.MeshStandardMaterial({
      color: COLORS.darkMetal,
      roughness: 0.4,
      metalness: 0.9
    });

    // Howitzer barrel
    var barrelGeom = new THREE.CylinderGeometry(0.4, 0.4, 8, 16);
    var barrel = new THREE.Mesh(barrelGeom, metalMaterial);
    barrel.position.set(20, 2, -25);
    barrel.rotation.z = 0.4;
    barrel.castShadow = true;
    artilleryGroup.add(barrel);
    environment.push(barrel);

    // Gun breech
    var breechGeom = new THREE.SphereGeometry(0.8, 16, 16);
    var breech = new THREE.Mesh(breechGeom, metalMaterial);
    breech.position.set(20, 0.5, -25);
    breech.castShadow = true;
    artilleryGroup.add(breech);
    environment.push(breech);

    // Gun carriage
    var carriageGeom = new THREE.BoxGeometry(3, 1, 2);
    var carriage = new THREE.Mesh(carriageGeom, metalMaterial);
    carriage.position.set(20, -1.5, -25);
    carriage.castShadow = true;
    carriage.receiveShadow = true;
    artilleryGroup.add(carriage);
    environment.push(carriage);

    scene.add(artilleryGroup);
  }

  function createObservationPost() {
    var obsGroup = new THREE.Group();

    var metalMaterial = new THREE.MeshStandardMaterial({
      color: COLORS.darkMetal,
      roughness: 0.5,
      metalness: 0.8
    });

    // Periscope pole
    var poleGeom = new THREE.CylinderGeometry(0.2, 0.2, 6, 12);
    var pole = new THREE.Mesh(poleGeom, metalMaterial);
    pole.position.set(-20, 0, -20);
    pole.castShadow = true;
    obsGroup.add(pole);
    environment.push(pole);

    // Periscope head
    var headGeom = new THREE.BoxGeometry(1, 1, 1.5);
    var head = new THREE.Mesh(headGeom, metalMaterial);
    head.position.set(-20, 3, -20);
    head.castShadow = true;
    obsGroup.add(head);
    environment.push(head);

    // Observation platform
    var platformGeom = new THREE.BoxGeometry(5, 0.4, 5);
    var platform = new THREE.Mesh(platformGeom, metalMaterial);
    platform.position.set(-20, -3.5, -20);
    platform.castShadow = true;
    platform.receiveShadow = true;
    obsGroup.add(platform);
    environment.push(platform);

    scene.add(obsGroup);
  }

  function createShellCraters() {
    var craterGroup = new THREE.Group();

    var craterMaterial = new THREE.MeshStandardMaterial({
      color: COLORS.mudBrown,
      roughness: 0.9,
      metalness: 0.0
    });

    // Shell crater 1 (no man's land)
    var crater1Geom = new THREE.SphereGeometry(3, 16, 12);
    var crater1 = new THREE.Mesh(crater1Geom, craterMaterial);
    crater1.position.set(10, -1, 35);
    crater1.scale.y = 0.4;
    crater1.castShadow = true;
    crater1.receiveShadow = true;
    craterGroup.add(crater1);
    environment.push(crater1);

    // Shell crater 2
    var crater2Geom = new THREE.SphereGeometry(4, 16, 12);
    var crater2 = new THREE.Mesh(crater2Geom, craterMaterial);
    crater2.position.set(-8, -1.2, 40);
    crater2.scale.y = 0.35;
    crater2.castShadow = true;
    crater2.receiveShadow = true;
    craterGroup.add(crater2);
    environment.push(crater2);

    // Shell crater 3
    var crater3Geom = new THREE.SphereGeometry(2.5, 16, 12);
    var crater3 = new THREE.Mesh(crater3Geom, craterMaterial);
    crater3.position.set(0, -0.8, 45);
    crater3.scale.y = 0.3;
    crater3.castShadow = true;
    crater3.receiveShadow = true;
    craterGroup.add(crater3);
    environment.push(crater3);

    scene.add(craterGroup);
  }

  function createBarbedWire() {
    var wireGroup = new THREE.Group();

    var wireLineMaterial = new THREE.LineBasicMaterial({
      color: COLORS.barbed,
      linewidth: 2
    });

    // Barbed wire tangled sections (using line segments)
    var wirePositions = [
      [-15, 3, 35], [-12, 4, 37], [-10, 2, 38], [-8, 4, 39], [-5, 3, 40],
      [5, 3, 36], [8, 4, 38], [12, 2, 39], [15, 4, 41],
      [-20, 2.5, 30], [-18, 3, 32], [20, 2.5, 30], [22, 3, 32]
    ];

    for (var i = 0; i < wirePositions.length - 1; i++) {
      var points = [
        new THREE.Vector3(wirePositions[i][0], wirePositions[i][1], wirePositions[i][2]),
        new THREE.Vector3(wirePositions[i + 1][0], wirePositions[i + 1][1], wirePositions[i + 1][2])
      ];
      var wireGeom = new THREE.BufferGeometry().setFromPoints(points);
      var wire = new THREE.LineSegments(wireGeom, wireLineMaterial);
      wireGroup.add(wire);
    }

    scene.add(wireGroup);
  }

  function createGasAlarmBell() {
    var bellGroup = new THREE.Group();

    var bellMetalMaterial = new THREE.MeshStandardMaterial({
      color: COLORS.darkMetal,
      roughness: 0.3,
      metalness: 0.95
    });

    // Bell tower pole
    var towerGeom = new THREE.CylinderGeometry(0.3, 0.3, 7, 12);
    var tower = new THREE.Mesh(towerGeom, bellMetalMaterial);
    tower.position.set(0, -0.5, -35);
    tower.castShadow = true;
    bellGroup.add(tower);
    environment.push(tower);

    // Bell frame
    var frameGeom = new THREE.BoxGeometry(2, 0.5, 2);
    var frame = new THREE.Mesh(frameGeom, bellMetalMaterial);
    frame.position.set(0, 3, -35);
    frame.castShadow = true;
    bellGroup.add(frame);
    environment.push(frame);

    // Bell itself (cone shape)
    var bellGeom = new THREE.ConeGeometry(1.2, 1.8, 16);
    gasAlarmBell = new THREE.Mesh(bellGeom, bellMetalMaterial);
    gasAlarmBell.position.set(0, 2, -35);
    gasAlarmBell.castShadow = true;
    bellGroup.add(gasAlarmBell);
    environment.push(gasAlarmBell);

    dynamicElements.push({
      object: gasAlarmBell,
      type: 'bell'
    });

    scene.add(bellGroup);
  }

  function createSandbagWalls() {
    var sandbagGroup = new THREE.Group();

    var sandbagMaterial = new THREE.MeshStandardMaterial({
      color: COLORS.sandTan,
      roughness: 0.8,
      metalness: 0.0
    });

    // Sandbag wall reinforcement (left side)
    for (var i = 0; i < 4; i++) {
      var bagGeom = new THREE.BoxGeometry(2, 1, 0.8);
      var bag = new THREE.Mesh(bagGeom, sandbagMaterial);
      bag.position.set(-7.5, -3 + i * 1.2, 15);
      bag.castShadow = true;
      bag.receiveShadow = true;
      sandbagGroup.add(bag);
      environment.push(bag);
    }

    // Sandbag wall reinforcement (right side)
    for (var i = 0; i < 4; i++) {
      var bagGeom = new THREE.BoxGeometry(2, 1, 0.8);
      var bag = new THREE.Mesh(bagGeom, sandbagMaterial);
      bag.position.set(7.5, -3 + i * 1.2, 15);
      bag.castShadow = true;
      bag.receiveShadow = true;
      sandbagGroup.add(bag);
      environment.push(bag);
    }

    // Sandbag barricade at communication trench
    for (var i = 0; i < 3; i++) {
      var bagGeom = new THREE.BoxGeometry(1.5, 1.5, 1);
      var bag = new THREE.Mesh(bagGeom, sandbagMaterial);
      bag.position.set(-13 + i * 2, -2, 28);
      bag.castShadow = true;
      bag.receiveShadow = true;
      sandbagGroup.add(bag);
      environment.push(bag);
    }

    scene.add(sandbagGroup);
  }

  function createGroundLevel() {
    var groundMaterial = new THREE.MeshStandardMaterial({
      color: COLORS.grass,
      roughness: 0.95,
      metalness: 0.0
    });

    var groundGeom = new THREE.BoxGeometry(80, 0.5, 80);
    var ground = new THREE.Mesh(groundGeom, groundMaterial);
    ground.position.set(0, -8.25, 0);
    ground.receiveShadow = true;
    scene.add(ground);
    environment.push(ground);
  }

  function init(container) {
    if (typeof window !== 'undefined' && !window.__ALLOW_EMBEDDED_MINIGAMES) return; /* standalone mini-game disabled: own renderer */

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB);
    scene.fog = new THREE.Fog(0x87CEEB, 150, 300);

    createRenderer(container);
    createCamera();
    createLights();
    createGroundLevel();
    createMainTrench();
    createZigzagSection();
    createCommandBunker();
    createAmmoDump();
    createArtilleryPosition();
    createObservationPost();
    createShellCraters();
    createBarbedWire();
    createGasAlarmBell();
    createSandbagWalls();

    return renderer;
  }

  function update() {
    time += 0.016;

    // Gas alarm bell rotation (periodic ringing animation)
    if (gasAlarmBell) {
      var bellCycle = Math.sin(time * 1.5) * 0.08;
      gasAlarmBell.rotation.x = bellCycle;
    }

    // Flare light arcing across sky
    var flareArc = Math.sin(time * 0.4) * 40;
    var flareHeight = Math.cos(time * 0.4) * 20 + 35;
    flareLight.position.set(flareArc - 30, flareHeight, 15 + Math.sin(time * 0.3) * 5);
    flareLight.intensity = Math.max(0, Math.sin(time * 0.4 + 1.5) * 15 + 5);

    // Artillery distant flash (random appearance, rhythmic)
    var artilleryFlash = Math.sin(time * 0.8) * 0.5 + 0.5;
    artilleryLight.intensity = Math.random() < 0.05 ? Math.random() * 20 : artilleryFlash * 5;
    artilleryLight.position.z = -30 + Math.sin(time * 0.5) * 10;

    // Camera subtle sway for immersion
    camera.position.x = Math.sin(time * 0.3) * 0.3;
    camera.position.y = 3 + Math.sin(time * 0.25) * 0.1;

    if (renderer) renderer.render(scene, camera);
  }

  function reset() {
    time = 0;
    camera.position.set(0, 3, 0);
    camera.lookAt(0, 0, 20);
    if (gasAlarmBell) {
      gasAlarmBell.rotation.x = 0;
    }
  }

  function getScene() {
    return scene;
  }

  function getCamera() {
    return camera;
  }

  function getEnvironment() {
    return environment;
  }

  return {
    init: init,
    update: update,
    reset: reset,
    getScene: getScene,
    getCamera: getCamera,
    getEnvironment: getEnvironment
  };
}());
