window.RebelOutpost = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var hudElement = null;
  var lastHKeyTime = 0;
  var rKeyPressed = false;
  var animationTime = 0;

  // State tracking
  var gameState = {
    rebelCount: 6,
    govForcesCount: 4,
    radioTowerActive: true,
    helicopterAngle: 0,
    cacheFireIntensity: 0.7,
    rebelPositions: [],
    govPositions: [],
    extractionSmokeIntensity: 0.6
  };

  // Store scene objects for animation
  var sceneObjects = {
    helicopter: null,
    helicopterRotor: null,
    cache: null,
    cacheFireSpheres: [],
    radioTowerLight: null,
    extractionSmoke: [],
    governmentTroops: [],
    rebellTroops: [],
    humvees: []
  };

  function init(_scene, _camera) {
    scene = _scene;
    camera = _camera;

    // Set scene background to jungle sky
    scene.background = new THREE.Color(0x2a5a2a);
    scene.fog = new THREE.Fog(0x2a5a2a, 150, 500);

    // Create all scene elements
    createJungleGround();
    createTreeLine();
    createMainBarracks();
    createRadioTower();
    createBurningSupplyCache();
    createMedicalTent();
    createRebelGuerrillas();
    createGovernmentTroops();
    createMilitaryHumvees();
    createAirstrikeCrater();
    createHelicopterGunship();
    createMunitionsCache();
    createLookoutPlatform();
    createCamouflageMetting();
    createRopeBridge();
    createExtractionZone();

    // Create HUD
    createHUD();

    // Setup event listeners
    setupEventListeners();
  }

  function createJungleGround() {
    var groundGeometry = new THREE.BoxGeometry(400, 0.3, 400);
    var groundMaterial = new THREE.MeshLambertMaterial({ color: 0x1a3a0a });
    var ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.position.y = -0.15;
    ground.receiveShadow = true;
    scene.add(ground);
  }

  function createTreeLine() {
    var treePositions = [
      { x: -120, z: 150 },
      { x: -90, z: 160 },
      { x: -60, z: 155 },
      { x: -30, z: 165 },
      { x: 0, z: 170 },
      { x: 30, z: 165 },
      { x: 60, z: 160 },
      { x: 90, z: 155 },
      { x: 120, z: 150 },
      { x: 140, z: 145 },
      { x: 160, z: 140 },
      { x: -150, z: 145 }
    ];

    for (var i = 0; i < treePositions.length; i++) {
      var pos = treePositions[i];
      var trunkGeometry = new THREE.BoxGeometry(3, 35, 3);
      var trunkMaterial = new THREE.MeshLambertMaterial({ color: 0x1a1a0a });
      var trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
      trunk.position.set(pos.x, 17.5, pos.z);
      trunk.castShadow = true;
      trunk.receiveShadow = true;
      scene.add(trunk);

      // Add canopy (sphere)
      var canopyGeometry = new THREE.SphereGeometry(20, 8, 8);
      var canopyMaterial = new THREE.MeshLambertMaterial({ color: 0x2d5a1a });
      var canopy = new THREE.Mesh(canopyGeometry, canopyMaterial);
      canopy.position.set(pos.x, 45, pos.z);
      canopy.castShadow = true;
      canopy.receiveShadow = true;
      scene.add(canopy);

      // Add canopy box accent
      var canopyBoxGeometry = new THREE.BoxGeometry(25, 18, 25);
      var canopyBox = new THREE.Mesh(canopyBoxGeometry, canopyMaterial);
      canopyBox.position.set(pos.x, 40, pos.z);
      canopyBox.castShadow = true;
      canopyBox.receiveShadow = true;
      scene.add(canopyBox);
    }
  }

  function createMainBarracks() {
    var barracksGeometry = new THREE.BoxGeometry(30, 4, 12);
    var barricksMaterial = new THREE.MeshLambertMaterial({ color: 0x4a3a2a });
    var barracks = new THREE.Mesh(barracksGeometry, barricksMaterial);
    barracks.position.set(-50, 2, -20);
    barracks.castShadow = true;
    barracks.receiveShadow = true;
    scene.add(barracks);

    // Add roof
    var roofGeometry = new THREE.BoxGeometry(32, 1, 14);
    var roofMaterial = new THREE.MeshLambertMaterial({ color: 0x3a2a1a });
    var roof = new THREE.Mesh(roofGeometry, roofMaterial);
    roof.position.set(-50, 5, -20);
    roof.castShadow = true;
    scene.add(roof);
  }

  function createRadioTower() {
    // Tower base
    var towerGeometry = new THREE.BoxGeometry(2, 30, 2);
    var towerMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
    var tower = new THREE.Mesh(towerGeometry, towerMaterial);
    tower.position.set(40, 15, 30);
    tower.castShadow = true;
    tower.receiveShadow = true;
    scene.add(tower);

    // Antenna (thin vertical box)
    var antennaGeometry = new THREE.BoxGeometry(0.3, 20, 0.3);
    var antennaMaterial = new THREE.MeshLambertMaterial({ color: 0x666666 });
    var antenna = new THREE.Mesh(antennaGeometry, antennaMaterial);
    antenna.position.set(40, 40, 30);
    antenna.castShadow = true;
    scene.add(antenna);

    // Dish
    var dishGeometry = new THREE.SphereGeometry(3, 16, 12);
    var dishMaterial = new THREE.MeshLambertMaterial({ color: 0xaaaaaa });
    var dish = new THREE.Mesh(dishGeometry, dishMaterial);
    dish.position.set(40, 32, 30);
    dish.scale.set(1, 0.3, 1);
    dish.castShadow = true;
    scene.add(dish);

    // Blinking light
    var lightGeometry = new THREE.SphereGeometry(0.5, 8, 8);
    var lightMaterial = new THREE.MeshLambertMaterial({ color: 0xff0000, emissive: 0xff0000 });
    sceneObjects.radioTowerLight = new THREE.Mesh(lightGeometry, lightMaterial);
    sceneObjects.radioTowerLight.position.set(40, 45, 30);
    scene.add(sceneObjects.radioTowerLight);

    // Point light for radio tower
    var pointLight = new THREE.PointLight(0xff0000, 2, 50);
    pointLight.position.set(40, 45, 30);
    pointLight.castShadow = true;
    scene.add(pointLight);
  }

  function createBurningSupplyCache() {
    var cratePositions = [
      { x: -80, z: -60 },
      { x: -75, z: -58 },
      { x: -85, z: -62 },
      { x: -72, z: -65 },
      { x: -88, z: -55 },
      { x: -78, z: -52 }
    ];

    for (var i = 0; i < cratePositions.length; i++) {
      var pos = cratePositions[i];
      var crateGeometry = new THREE.BoxGeometry(4, 4, 4);
      var crateMaterial = new THREE.MeshLambertMaterial({ color: 0x6a4a2a });
      var crate = new THREE.Mesh(crateGeometry, crateMaterial);
      crate.position.set(pos.x, 2, pos.z);
      crate.castShadow = true;
      crate.receiveShadow = true;
      scene.add(crate);
    }

    // Large fire sphere cluster
    var fireCluster = new THREE.Group();
    var fireSpherePositions = [
      { x: 0, y: 0, z: 0, scale: 1.2 },
      { x: -3, y: 2, z: 2, scale: 0.9 },
      { x: 3, y: 1, z: -3, scale: 1.0 },
      { x: -2, y: 3, z: -1, scale: 0.8 },
      { x: 2, y: 2.5, z: 2, scale: 0.7 }
    ];

    for (var j = 0; j < fireSpherePositions.length; j++) {
      var fpos = fireSpherePositions[j];
      var fireGeometry = new THREE.SphereGeometry(5 * fpos.scale, 8, 8);
      var fireMaterial = new THREE.MeshLambertMaterial({
        color: 0xff6600,
        emissive: 0xff4400
      });
      var fireSphere = new THREE.Mesh(fireGeometry, fireMaterial);
      fireSphere.position.set(fpos.x, fpos.y, fpos.z);
      fireCluster.add(fireSphere);
      sceneObjects.cacheFireSpheres.push(fireSphere);
    }

    fireCluster.position.set(-80, 8, -60);
    sceneObjects.cache = fireCluster;
    scene.add(fireCluster);

    // Fire light
    var fireLight = new THREE.PointLight(0xff6600, 4, 80);
    fireLight.position.set(-80, 15, -60);
    fireLight.castShadow = true;
    scene.add(fireLight);
  }

  function createMedicalTent() {
    // Tent body (tilted box)
    var tentGeometry = new THREE.BoxGeometry(8, 5, 10);
    var tentMaterial = new THREE.MeshLambertMaterial({ color: 0xffffff });
    var tent = new THREE.Mesh(tentGeometry, tentMaterial);
    tent.position.set(60, 2.5, -30);
    tent.rotation.z = 0.3; // Tilt for damaged effect
    tent.castShadow = true;
    tent.receiveShadow = true;
    scene.add(tent);

    // Red cross marker
    var crossVertGeometry = new THREE.BoxGeometry(1.5, 4, 0.2);
    var crossMaterial = new THREE.MeshLambertMaterial({ color: 0xff0000 });
    var crossVert = new THREE.Mesh(crossVertGeometry, crossMaterial);
    crossVert.position.set(60, 4, -25);
    scene.add(crossVert);

    var crossHorizGeometry = new THREE.BoxGeometry(4, 1.5, 0.2);
    var crossHoriz = new THREE.Mesh(crossHorizGeometry, crossMaterial);
    crossHoriz.position.set(60, 4, -25);
    scene.add(crossHoriz);
  }

  function createRebelGuerrillas() {
    var rebelStartPositions = [
      { x: -20, z: -40 },
      { x: 10, z: -45 },
      { x: -35, z: -10 },
      { x: 0, z: 0 },
      { x: 25, z: -20 },
      { x: -45, z: 10 }
    ];

    for (var i = 0; i < rebelStartPositions.length; i++) {
      var pos = rebelStartPositions[i];
      var figureGroup = new THREE.Group();

      // Body
      var bodyGeometry = new THREE.BoxGeometry(1.2, 2, 0.8);
      var bodyMaterial = new THREE.MeshLambertMaterial({ color: 0x3a4a2a });
      var body = new THREE.Mesh(bodyGeometry, bodyMaterial);
      body.position.y = 1;
      figureGroup.add(body);

      // Head
      var headGeometry = new THREE.SphereGeometry(0.5, 8, 8);
      var headMaterial = new THREE.MeshLambertMaterial({ color: 0x5a4a3a });
      var head = new THREE.Mesh(headGeometry, headMaterial);
      head.position.y = 2.5;
      figureGroup.add(head);

      figureGroup.position.set(pos.x, 0, pos.z);
      figureGroup.castShadow = true;
      figureGroup.receiveShadow = true;
      sceneObjects.rebellTroops.push(figureGroup);
      scene.add(figureGroup);
      gameState.rebelPositions.push({ x: pos.x, z: pos.z });
    }
  }

  function createGovernmentTroops() {
    var govStartPositions = [
      { x: 150, z: 140 },
      { x: 160, z: 135 },
      { x: 140, z: 130 },
      { x: 155, z: 145 }
    ];

    for (var i = 0; i < govStartPositions.length; i++) {
      var pos = govStartPositions[i];
      var figureGroup = new THREE.Group();

      // Body
      var bodyGeometry = new THREE.BoxGeometry(1.2, 2, 0.8);
      var bodyMaterial = new THREE.MeshLambertMaterial({ color: 0x5a6a4a });
      var body = new THREE.Mesh(bodyGeometry, bodyMaterial);
      body.position.y = 1;
      figureGroup.add(body);

      // Head
      var headGeometry = new THREE.SphereGeometry(0.5, 8, 8);
      var headMaterial = new THREE.MeshLambertMaterial({ color: 0x6a6a5a });
      var head = new THREE.Mesh(headGeometry, headMaterial);
      head.position.y = 2.5;
      figureGroup.add(head);

      figureGroup.position.set(pos.x, 0, pos.z);
      figureGroup.castShadow = true;
      figureGroup.receiveShadow = true;
      sceneObjects.governmentTroops.push(figureGroup);
      scene.add(figureGroup);
      gameState.govPositions.push({ x: pos.x, z: pos.z });
    }
  }

  function createMilitaryHumvees() {
    var humveePositions = [
      { x: 145, z: 125 },
      { x: 165, z: 120 }
    ];

    for (var i = 0; i < humveePositions.length; i++) {
      var pos = humveePositions[i];
      var vehicleGroup = new THREE.Group();

      // Body
      var bodyGeometry = new THREE.BoxGeometry(4, 2.5, 8);
      var bodyMaterial = new THREE.MeshLambertMaterial({ color: 0x2a3a1a });
      var body = new THREE.Mesh(bodyGeometry, bodyMaterial);
      body.position.y = 1.25;
      vehicleGroup.add(body);

      // Cabin
      var cabinGeometry = new THREE.BoxGeometry(3.5, 2, 3);
      var cabin = new THREE.Mesh(cabinGeometry, bodyMaterial);
      cabin.position.set(0, 2.5, 1);
      vehicleGroup.add(cabin);

      // Machine gun mount
      var gunMountGeometry = new THREE.BoxGeometry(0.4, 1, 0.4);
      var gunMaterial = new THREE.MeshLambertMaterial({ color: 0x1a1a0a });
      var gunMount = new THREE.Mesh(gunMountGeometry, gunMaterial);
      gunMount.position.set(0, 3.5, 0);
      vehicleGroup.add(gunMount);

      // Gun barrel
      var barrelGeometry = new THREE.BoxGeometry(0.2, 0.2, 3);
      var barrel = new THREE.Mesh(barrelGeometry, gunMaterial);
      barrel.position.set(0, 4, 1.5);
      vehicleGroup.add(barrel);

      vehicleGroup.position.set(pos.x, 0, pos.z);
      vehicleGroup.castShadow = true;
      vehicleGroup.receiveShadow = true;
      sceneObjects.humvees.push(vehicleGroup);
      scene.add(vehicleGroup);
    }
  }

  function createAirstrikeCrater() {
    // Crater depression
    var craterGeometry = new THREE.BoxGeometry(40, 0.5, 40);
    var craterMaterial = new THREE.MeshLambertMaterial({ color: 0x0a0a0a });
    var crater = new THREE.Mesh(craterGeometry, craterMaterial);
    crater.position.set(-120, -0.2, 80);
    crater.receiveShadow = true;
    scene.add(crater);

    // Smoke cluster
    var smokeSphereCount = 8;
    for (var i = 0; i < smokeSphereCount; i++) {
      var smokeGeometry = new THREE.SphereGeometry(8, 8, 8);
      var smokeMaterial = new THREE.MeshLambertMaterial({
        color: 0x5a5a5a,
        transparent: true,
        opacity: 0.5
      });
      var smoke = new THREE.Mesh(smokeGeometry, smokeMaterial);
      smoke.position.set(-120 + (Math.random() - 0.5) * 20, 15 + i * 3, 80 + (Math.random() - 0.5) * 20);
      scene.add(smoke);
      sceneObjects.cacheFireSpheres.push(smoke);
    }
  }

  function createHelicopterGunship() {
    var heliGroup = new THREE.Group();

    // Fuselage
    var fuselageGeometry = new THREE.BoxGeometry(3, 2.5, 10);
    var fuselageMaterial = new THREE.MeshLambertMaterial({ color: 0x2a3a1a });
    var fuselage = new THREE.Mesh(fuselageGeometry, fuselageMaterial);
    fuselage.position.y = 2;
    heliGroup.add(fuselage);

    // Cockpit
    var cockpitGeometry = new THREE.BoxGeometry(2.5, 1.5, 2);
    var cockpitMaterial = new THREE.MeshLambertMaterial({ color: 0x1a2a1a });
    var cockpit = new THREE.Mesh(cockpitGeometry, cockpitMaterial);
    cockpit.position.set(0, 3.5, 3);
    heliGroup.add(cockpit);

    // Main rotor (spinning)
    var rotorGeometry = new THREE.BoxGeometry(0.3, 0.3, 15);
    var rotorMaterial = new THREE.MeshLambertMaterial({ color: 0x1a1a0a });
    var rotor = new THREE.Mesh(rotorGeometry, rotorMaterial);
    rotor.position.set(0, 4, 0);
    heliGroup.add(rotor);
    sceneObjects.helicopterRotor = rotor;

    // Tail boom
    var boomGeometry = new THREE.BoxGeometry(0.8, 0.8, 8);
    var boomMaterial = new THREE.MeshLambertMaterial({ color: 0x2a3a1a });
    var boom = new THREE.Mesh(boomGeometry, boomMaterial);
    boom.position.set(0, 2, -5);
    heliGroup.add(boom);

    // Rocket pods (2 on each side)
    var podPositions = [
      { x: -2, z: 2 },
      { x: -2, z: -2 },
      { x: 2, z: 2 },
      { x: 2, z: -2 }
    ];

    for (var i = 0; i < podPositions.length; i++) {
      var ppos = podPositions[i];
      var podGeometry = new THREE.BoxGeometry(0.8, 0.8, 3);
      var podMaterial = new THREE.MeshLambertMaterial({
        color: 0x333333,
        emissive: 0x444444
      });
      var pod = new THREE.Mesh(podGeometry, podMaterial);
      pod.position.set(ppos.x, 2.5, ppos.z);
      heliGroup.add(pod);
    }

    heliGroup.position.set(80, 50, 100);
    heliGroup.castShadow = true;
    sceneObjects.helicopter = heliGroup;
    scene.add(heliGroup);

    // Helicopter light
    var heliLight = new THREE.PointLight(0xffffff, 2, 100);
    heliLight.position.set(80, 52, 100);
    scene.add(heliLight);
  }

  function createMunitionsCache() {
    var munitionPositions = [
      { x: 20, z: 50 },
      { x: 25, z: 48 },
      { x: 22, z: 45 },
      { x: 18, z: 52 },
      { x: 28, z: 50 }
    ];

    for (var i = 0; i < munitionPositions.length; i++) {
      var pos = munitionPositions[i];
      var boxGeometry = new THREE.BoxGeometry(3, 3, 3);
      var boxMaterial = new THREE.MeshLambertMaterial({ color: 0x5a5a2a });
      var box = new THREE.Mesh(boxGeometry, boxMaterial);
      box.position.set(pos.x, 1.5, pos.z);
      box.castShadow = true;
      box.receiveShadow = true;
      scene.add(box);
    }

    // Scattered ammo boxes
    for (var j = 0; j < 3; j++) {
      var scatPos = {
        x: 20 + Math.random() * 15,
        z: 45 + Math.random() * 15
      };
      var smallBoxGeometry = new THREE.BoxGeometry(1.5, 1.5, 1.5);
      var smallBoxMaterial = new THREE.MeshLambertMaterial({ color: 0x4a4a1a });
      var smallBox = new THREE.Mesh(smallBoxGeometry, smallBoxMaterial);
      smallBox.position.set(scatPos.x, 0.75, scatPos.z);
      smallBox.castShadow = true;
      smallBox.receiveShadow = true;
      scene.add(smallBox);
    }
  }

  function createLookoutPlatform() {
    // Platform box
    var platformGeometry = new THREE.BoxGeometry(6, 0.5, 6);
    var platformMaterial = new THREE.MeshLambertMaterial({ color: 0x4a3a2a });
    var platform = new THREE.Mesh(platformGeometry, platformMaterial);
    platform.position.set(-100, 35, 100);
    platform.castShadow = true;
    platform.receiveShadow = true;
    scene.add(platform);

    // Support pole
    var poleGeometry = new THREE.BoxGeometry(0.8, 35, 0.8);
    var poleMaterial = new THREE.MeshLambertMaterial({ color: 0x3a2a1a });
    var pole = new THREE.Mesh(poleGeometry, poleMaterial);
    pole.position.set(-100, 17.5, 100);
    pole.castShadow = true;
    scene.add(pole);

    // Guard railing
    var railGeometry = new THREE.BoxGeometry(6.5, 1, 0.3);
    var railMaterial = new THREE.MeshLambertMaterial({ color: 0x3a2a1a });
    var rail1 = new THREE.Mesh(railGeometry, railMaterial);
    rail1.position.set(-100, 35.7, 97);
    scene.add(rail1);

    var rail2 = new THREE.Mesh(railGeometry, railMaterial);
    rail2.position.set(-100, 35.7, 103);
    scene.add(rail2);
  }

  function createCamouflageMetting() {
    // Draped camouflage net (flat boxes arranged)
    var netPositions = [
      { x: -40, y: 6, z: -70, sx: 15, sy: 0.1, sz: 10 },
      { x: -30, y: 5.5, z: -65, sx: 12, sy: 0.1, sz: 8 },
      { x: -50, y: 6.5, z: -75, sx: 18, sy: 0.1, sz: 12 }
    ];

    for (var i = 0; i < netPositions.length; i++) {
      var npos = netPositions[i];
      var netGeometry = new THREE.BoxGeometry(npos.sx, npos.sy, npos.sz);
      var netMaterial = new THREE.MeshLambertMaterial({ color: 0x3a4a2a });
      var net = new THREE.Mesh(netGeometry, netMaterial);
      net.position.set(npos.x, npos.y, npos.z);
      net.rotation.x = 0.2; // Slight tilt
      net.castShadow = true;
      scene.add(net);
    }
  }

  function createRopeBridge() {
    // Bridge planks (horizontal boxes)
    var plankCount = 6;
    for (var i = 0; i < plankCount; i++) {
      var plankGeometry = new THREE.BoxGeometry(8, 0.3, 1.5);
      var plankMaterial = new THREE.MeshLambertMaterial({ color: 0x5a4a3a });
      var plank = new THREE.Mesh(plankGeometry, plankMaterial);
      plank.position.set(0, 25 + i * 0.2, 120 + i * 2);
      plank.castShadow = true;
      plank.receiveShadow = true;
      scene.add(plank);
    }

    // Support posts
    var postGeometry = new THREE.BoxGeometry(0.8, 25, 0.8);
    var postMaterial = new THREE.MeshLambertMaterial({ color: 0x3a2a1a });
    var post1 = new THREE.Mesh(postGeometry, postMaterial);
    post1.position.set(-5, 12.5, 120);
    post1.castShadow = true;
    scene.add(post1);

    var post2 = new THREE.Mesh(postGeometry, postMaterial);
    post2.position.set(5, 12.5, 132);
    post2.castShadow = true;
    scene.add(post2);
  }

  function createExtractionZone() {
    // Cleared extraction area (flat)
    var zoneGeometry = new THREE.BoxGeometry(50, 0.2, 50);
    var zoneMaterial = new THREE.MeshLambertMaterial({ color: 0x2a3a2a });
    var zone = new THREE.Mesh(zoneGeometry, zoneMaterial);
    zone.position.set(100, 0.05, -100);
    zone.receiveShadow = true;
    scene.add(zone);

    // Signal smoke (green emissive spheres rising)
    var smokeCount = 5;
    for (var i = 0; i < smokeCount; i++) {
      var smokeGeometry = new THREE.SphereGeometry(4, 8, 8);
      var smokeMaterial = new THREE.MeshLambertMaterial({
        color: 0x00ff00,
        emissive: 0x00aa00,
        transparent: true,
        opacity: 0.6
      });
      var smoke = new THREE.Mesh(smokeGeometry, smokeMaterial);
      smoke.position.set(100 + (Math.random() - 0.5) * 8, 8 + i * 5, -100 + (Math.random() - 0.5) * 8);
      scene.add(smoke);
      sceneObjects.extractionSmoke.push(smoke);
    }

    // Extraction light beacon
    var beaconLight = new THREE.PointLight(0x00ff00, 3, 80);
    beaconLight.position.set(100, 15, -100);
    scene.add(beaconLight);
  }

  function createHUD() {
    hudElement = document.createElement('div');
    hudElement.id = 'rebel-outpost-hud';
    hudElement.style.position = 'fixed';
    hudElement.style.top = '20px';
    hudElement.style.left = '20px';
    hudElement.style.color = '#00ff00';
    hudElement.style.fontFamily = 'monospace';
    hudElement.style.fontSize = '14px';
    hudElement.style.zIndex = '1000';
    hudElement.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    hudElement.style.padding = '10px';
    hudElement.style.border = '1px solid #00ff00';
    updateHUD();
    document.body.appendChild(hudElement);
  }

  function updateHUD() {
    if (!hudElement) return;
    var radioStatus = gameState.radioTowerActive ? 'ACTIVE' : 'OFFLINE';
    hudElement.innerHTML = 'REBELS: ' + gameState.rebelCount + '<br/>' +
                           'GOV FORCES: ' + gameState.govForcesCount + '<br/>' +
                           'RADIO TOWER: ' + radioStatus;
  }

  function setupEventListeners() {
    document.addEventListener('keydown', function(event) {
      if (event.key.toLowerCase() === 'h') {
        var now = Date.now();
        if (now - lastHKeyTime < 400) {
          rKeyPressed = true;
          if (rKeyPressed) {
            toggleRadioTower();
          }
        }
        lastHKeyTime = now;
      }
    });
  }

  function toggleRadioTower() {
    gameState.radioTowerActive = !gameState.radioTowerActive;
    if (sceneObjects.radioTowerLight) {
      sceneObjects.radioTowerLight.visible = gameState.radioTowerActive;
    }
    updateHUD();
  }

  function update(delta) {
    animationTime += delta;

    // Helicopter rotation and firing
    if (sceneObjects.helicopter) {
      sceneObjects.helicopterAngle += delta * 0.5;
      sceneObjects.helicopter.position.x = 80 + Math.sin(sceneObjects.helicopterAngle) * 30;
      sceneObjects.helicopter.position.z = 100 + Math.cos(sceneObjects.helicopterAngle) * 30;
      sceneObjects.helicopter.rotation.y += delta * 0.3;
    }

    // Helicopter rotor spin
    if (sceneObjects.helicopterRotor) {
      sceneObjects.helicopterRotor.rotation.z += delta * 50;
    }

    // Cache fire flicker
    for (var i = 0; i < sceneObjects.cacheFireSpheres.length; i++) {
      var sphere = sceneObjects.cacheFireSpheres[i];
      var flicker = 0.6 + Math.sin(animationTime * 5 + i) * 0.3;
      sphere.material.emissiveIntensity = flicker;
    }

    // Radio tower light blink
    if (sceneObjects.radioTowerLight) {
      var blink = Math.sin(animationTime * 3) > 0 ? 1 : 0.2;
      sceneObjects.radioTowerLight.material.emissiveIntensity = blink;
    }

    // Government troops advance
    for (var j = 0; j < sceneObjects.governmentTroops.length; j++) {
      var troop = sceneObjects.governmentTroops[j];
      troop.position.x -= delta * 5;
      troop.position.z -= delta * 3;
    }

    // Rebels take defensive positions (small movements)
    for (var k = 0; k < sceneObjects.rebellTroops.length; k++) {
      var rebel = sceneObjects.rebellTroops[k];
      rebel.rotation.y = Math.sin(animationTime * 2 + k) * 0.3;
    }

    // Extraction smoke rises
    for (var m = 0; m < sceneObjects.extractionSmoke.length; m++) {
      var smoke = sceneObjects.extractionSmoke[m];
      smoke.position.y += delta * 8;
      if (smoke.position.y > 40) {
        smoke.position.y = 8;
      }
    }
  }

  function reset() {
    // Reset animation state
    animationTime = 0;
    gameState.rebelCount = 6;
    gameState.govForcesCount = 4;
    gameState.radioTowerActive = true;
    gameState.helicopterAngle = 0;
    gameState.cacheFireIntensity = 0.7;
    gameState.extractionSmokeIntensity = 0.6;
    lastHKeyTime = 0;
    rKeyPressed = false;

    // Reset positions
    for (var i = 0; i < sceneObjects.governmentTroops.length; i++) {
      sceneObjects.governmentTroops[i].position.x = gameState.govPositions[i].x;
      sceneObjects.governmentTroops[i].position.z = gameState.govPositions[i].z;
    }

    for (var j = 0; j < sceneObjects.rebellTroops.length; j++) {
      sceneObjects.rebellTroops[j].position.x = gameState.rebelPositions[j].x;
      sceneObjects.rebellTroops[j].position.z = gameState.rebelPositions[j].z;
    }

    updateHUD();
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
