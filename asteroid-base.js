window.AsteroidBase = (function() {
  'use strict';

  // State variables
  var scene = null;
  var camera = null;
  var gameObjects = [];
  var enemies = [];
  var time = 0;
  var keysPressed = {};
  var lastKeyTime = 0;
  var keySequence = [];
  var hudState = {
    massDriverCharge: 67,
    baseDestroyed: 0,
    evacuationInitiated: false,
    hudEnabled: true
  };

  // Object pool for animations
  var miningLaser = null;
  var solarPanels = [];
  var oreConveyor = null;
  var massDriver = null;
  var dockedFighter = null;
  var escapePods = [];
  var asteroid = null;

  // Initialize the module
  var init = function(sceneRef, cameraRef) {
    scene = sceneRef;
    camera = cameraRef;
    gameObjects = [];
    enemies = [];
    time = 0;

    scene.background = new THREE.Color(0x000000);

    // Add ambient darkness
    var ambientLight = new THREE.AmbientLight(0x1a1a2e, 0.3);
    scene.add(ambientLight);
    gameObjects.push(ambientLight);

    // Add harsh directional light (sun from space)
    var directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
    directionalLight.position.set(100, 80, 120);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    scene.add(directionalLight);
    gameObjects.push(directionalLight);

    // Create distant stars
    createStarfield();

    // Create asteroid base structure
    createAsteroidBase();

    // Create enemies
    createEnemies();

    // Set up key listeners for keybind toggling
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);

    return true;
  };

  var createStarfield = function() {
    var starGeometry = new THREE.BufferGeometry();
    var starCount = 1000;
    var positions = new Float32Array(starCount * 3);

    for (var i = 0; i < starCount * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 4000;
      positions[i + 1] = (Math.random() - 0.5) * 4000;
      positions[i + 2] = (Math.random() - 0.5) * 4000;
    }

    starGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    var starMaterial = new THREE.PointsMaterial({ color: 0xffffff, size: 2, sizeAttenuation: true });
    var stars = new THREE.Points(starGeometry, starMaterial);
    scene.add(stars);
    gameObjects.push(stars);
  };

  var createAsteroidBase = function() {
    // Main asteroid surface (large dark irregular box)
    var asteroidGeometry = new THREE.BoxGeometry(400, 300, 350);
    var asteroidMaterial = new THREE.MeshStandardMaterial({
      color: 0x332211,
      roughness: 0.9,
      metalness: 0.1
    });
    asteroid = new THREE.Mesh(asteroidGeometry, asteroidMaterial);
    asteroid.position.set(0, 0, 0);
    asteroid.castShadow = true;
    asteroid.receiveShadow = true;
    scene.add(asteroid);
    gameObjects.push(asteroid);

    // Tunnel entrance (carved box opening)
    var tunnelGeometry = new THREE.BoxGeometry(80, 80, 40);
    var tunnelMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a1a1a,
      roughness: 0.95,
      metalness: 0.0
    });
    var tunnel = new THREE.Mesh(tunnelGeometry, tunnelMaterial);
    tunnel.position.set(0, 30, 180);
    tunnel.castShadow = true;
    tunnel.receiveShadow = true;
    scene.add(tunnel);
    gameObjects.push(tunnel);

    // Habitat modules (cylinders with box airlocks)
    createHabitatModule(80, -80, 100);
    createHabitatModule(-80, -80, 80);
    createHabitatModule(100, 50, 120);

    // Solar panel arrays
    createSolarPanelArray(120, 120, 0);
    createSolarPanelArray(-120, 120, 0);

    // Mining laser drill (large cylinder with cone tip)
    miningLaser = createMiningLaser(0, -150, 150);

    // Ore conveyor system
    oreConveyor = createOreConveyor(-60, -100, 80);

    // Mass driver barrel (very long cylinder pointing into space)
    massDriver = createMassDriver(180, 0, 0);

    // Docked fighter craft
    dockedFighter = createDockedFighter(-150, 80, 100);

    // Airlock doors
    createAirlockDoor(40, 10, 100);
    createAirlockDoor(-40, 10, 100);

    // Communications dish
    createCommunicationsDish(140, 100, -100);

    // Pressure suit rack
    createPressureSuitRack(-100, -50, -120);

    // Decompressed section (box with crack lines)
    createDecompressedSection(50, -120, -100);

    // Ore hopper
    createOreHopper(-120, 80, -100);

    // Emergency escape pods
    escapePods.push(createEscapePod(70, 150, 80));
    escapePods.push(createEscapePod(-70, 150, 80));
    escapePods.push(createEscapePod(0, 160, 0));

    // Asteroid fragment rocks
    createAsteroidFragments();
  };

  var createHabitatModule = function(x, y, z) {
    // Cylinder habitat
    var habitatGeometry = new THREE.CylinderGeometry(40, 40, 60, 8);
    var habitatMaterial = new THREE.MeshStandardMaterial({
      color: 0x2a3f5f,
      roughness: 0.6,
      metalness: 0.4
    });
    var habitat = new THREE.Mesh(habitatGeometry, habitatMaterial);
    habitat.position.set(x, y, z);
    habitat.castShadow = true;
    habitat.receiveShadow = true;
    scene.add(habitat);
    gameObjects.push(habitat);

    // Airlock entrance (box)
    var airlockGeometry = new THREE.BoxGeometry(25, 35, 20);
    var airlockMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a1a2e,
      roughness: 0.5,
      metalness: 0.6
    });
    var airlock = new THREE.Mesh(airlockGeometry, airlockMaterial);
    airlock.position.set(x, y - 35, z);
    airlock.castShadow = true;
    airlock.receiveShadow = true;
    scene.add(airlock);
    gameObjects.push(airlock);
  };

  var createSolarPanelArray = function(x, y, z) {
    // Main panel (flat box)
    var panelGeometry = new THREE.BoxGeometry(120, 5, 80);
    var panelMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a3a52,
      roughness: 0.4,
      metalness: 0.8,
      emissive: 0x0066ff,
      emissiveIntensity: 0.2
    });
    var panel = new THREE.Mesh(panelGeometry, panelMaterial);
    panel.position.set(x, y, z);
    panel.castShadow = true;
    panel.receiveShadow = true;
    scene.add(panel);
    gameObjects.push(panel);
    solarPanels.push(panel);

    // Support arm (thin cylinder)
    var armGeometry = new THREE.CylinderGeometry(4, 4, 80, 6);
    var armMaterial = new THREE.MeshStandardMaterial({
      color: 0x444444,
      roughness: 0.7,
      metalness: 0.5
    });
    var arm = new THREE.Mesh(armGeometry, armMaterial);
    arm.position.set(x, y - 50, z);
    arm.castShadow = true;
    arm.receiveShadow = true;
    scene.add(arm);
    gameObjects.push(arm);
  };

  var createMiningLaser = function(x, y, z) {
    // Large cylinder body
    var laserGeometry = new THREE.CylinderGeometry(25, 25, 100, 12);
    var laserMaterial = new THREE.MeshStandardMaterial({
      color: 0xff4400,
      roughness: 0.3,
      metalness: 0.9,
      emissive: 0xff2200,
      emissiveIntensity: 0.0
    });
    var laser = new THREE.Mesh(laserGeometry, laserMaterial);
    laser.position.set(x, y, z);
    laser.rotation.z = Math.PI / 2;
    laser.castShadow = true;
    laser.receiveShadow = true;
    scene.add(laser);
    gameObjects.push(laser);

    // Cone tip
    var coneGeometry = new THREE.ConeGeometry(18, 35, 12);
    var coneMaterial = new THREE.MeshStandardMaterial({
      color: 0xff6600,
      roughness: 0.2,
      metalness: 1.0,
      emissive: 0xff3300,
      emissiveIntensity: 0.3
    });
    var cone = new THREE.Mesh(coneGeometry, coneMaterial);
    cone.position.set(x + 65, y, z);
    cone.rotation.z = Math.PI / 2;
    cone.castShadow = true;
    cone.receiveShadow = true;
    scene.add(cone);
    gameObjects.push(cone);

    return { laser: laser, cone: cone };
  };

  var createOreConveyor = function(x, y, z) {
    // Track (box)
    var trackGeometry = new THREE.BoxGeometry(15, 8, 120);
    var trackMaterial = new THREE.MeshStandardMaterial({
      color: 0x444444,
      roughness: 0.8,
      metalness: 0.3
    });
    var track = new THREE.Mesh(trackGeometry, trackMaterial);
    track.position.set(x, y, z);
    track.castShadow = true;
    track.receiveShadow = true;
    scene.add(track);
    gameObjects.push(track);

    // Rollers (cylinders)
    var rollers = [];
    for (var i = 0; i < 4; i++) {
      var rollerGeometry = new THREE.CylinderGeometry(6, 6, 20, 8);
      var rollerMaterial = new THREE.MeshStandardMaterial({
        color: 0x333333,
        roughness: 0.7,
        metalness: 0.6
      });
      var roller = new THREE.Mesh(rollerGeometry, rollerMaterial);
      roller.position.set(x, y, z - 30 + i * 40);
      roller.rotation.x = Math.PI / 2;
      roller.castShadow = true;
      roller.receiveShadow = true;
      scene.add(roller);
      gameObjects.push(roller);
      rollers.push(roller);
    }

    return { track: track, rollers: rollers };
  };

  var createMassDriver = function(x, y, z) {
    // Very long cylinder barrel
    var barrelGeometry = new THREE.CylinderGeometry(20, 20, 400, 16);
    var barrelMaterial = new THREE.MeshStandardMaterial({
      color: 0x222222,
      roughness: 0.4,
      metalness: 0.8,
      emissive: 0x0099ff,
      emissiveIntensity: 0.0
    });
    var barrel = new THREE.Mesh(barrelGeometry, barrelMaterial);
    barrel.position.set(x, y, z);
    barrel.rotation.z = Math.PI / 2;
    barrel.castShadow = true;
    barrel.receiveShadow = true;
    scene.add(barrel);
    gameObjects.push(barrel);

    // Charging chamber (separate box)
    var chamberGeometry = new THREE.BoxGeometry(60, 50, 50);
    var chamberMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a1a1a,
      roughness: 0.5,
      metalness: 0.7,
      emissive: 0x003366,
      emissiveIntensity: 0.1
    });
    var chamber = new THREE.Mesh(chamberGeometry, chamberMaterial);
    chamber.position.set(x - 120, y, z);
    chamber.castShadow = true;
    chamber.receiveShadow = true;
    scene.add(chamber);
    gameObjects.push(chamber);

    return { barrel: barrel, chamber: chamber };
  };

  var createDockedFighter = function(x, y, z) {
    // Sleek box fuselage
    var fuselageGeometry = new THREE.BoxGeometry(15, 12, 50);
    var fuselageMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a2a3a,
      roughness: 0.5,
      metalness: 0.8,
      emissive: 0x0066ff,
      emissiveIntensity: 0.15
    });
    var fuselage = new THREE.Mesh(fuselageGeometry, fuselageMaterial);
    fuselage.position.set(x, y, z);
    fuselage.castShadow = true;
    fuselage.receiveShadow = true;
    scene.add(fuselage);
    gameObjects.push(fuselage);

    // Engine cylinders
    var engines = [];
    for (var i = 0; i < 2; i++) {
      var engineGeometry = new THREE.CylinderGeometry(6, 6, 20, 8);
      var engineMaterial = new THREE.MeshStandardMaterial({
        color: 0xff4400,
        roughness: 0.3,
        metalness: 0.9,
        emissive: 0xff6600,
        emissiveIntensity: 0.0
      });
      var engine = new THREE.Mesh(engineGeometry, engineMaterial);
      engine.position.set(x + (i === 0 ? -8 : 8), y - 8, z - 20);
      engine.rotation.z = Math.PI / 2;
      engine.castShadow = true;
      engine.receiveShadow = true;
      scene.add(engine);
      gameObjects.push(engine);
      engines.push(engine);
    }

    return { fuselage: fuselage, engines: engines };
  };

  var createAirlockDoor = function(x, y, z) {
    // Thick door (box)
    var doorGeometry = new THREE.BoxGeometry(30, 50, 10);
    var doorMaterial = new THREE.MeshStandardMaterial({
      color: 0x3a3a3a,
      roughness: 0.6,
      metalness: 0.7
    });
    var door = new THREE.Mesh(doorGeometry, doorMaterial);
    door.position.set(x, y, z);
    door.castShadow = true;
    door.receiveShadow = true;
    scene.add(door);
    gameObjects.push(door);

    // Seal ring (cylinder)
    var sealGeometry = new THREE.CylinderGeometry(16, 16, 3, 16);
    var sealMaterial = new THREE.MeshStandardMaterial({
      color: 0x00aa00,
      roughness: 0.4,
      metalness: 0.8,
      emissive: 0x00ff00,
      emissiveIntensity: 0.3
    });
    var seal = new THREE.Mesh(sealGeometry, sealMaterial);
    seal.position.set(x, y, z - 8);
    seal.rotation.x = Math.PI / 2;
    seal.castShadow = true;
    seal.receiveShadow = true;
    scene.add(seal);
    gameObjects.push(seal);
  };

  var createCommunicationsDish = function(x, y, z) {
    // Dish base (cylinder)
    var baseGeometry = new THREE.CylinderGeometry(35, 35, 8, 16);
    var baseMaterial = new THREE.MeshStandardMaterial({
      color: 0x444444,
      roughness: 0.7,
      metalness: 0.5
    });
    var base = new THREE.Mesh(baseGeometry, baseMaterial);
    base.position.set(x, y, z);
    base.castShadow = true;
    base.receiveShadow = true;
    scene.add(base);
    gameObjects.push(base);

    // Support arm (cylinder)
    var armGeometry = new THREE.CylinderGeometry(5, 5, 60, 8);
    var armMaterial = new THREE.MeshStandardMaterial({
      color: 0x555555,
      roughness: 0.6,
      metalness: 0.6
    });
    var arm = new THREE.Mesh(armGeometry, armMaterial);
    arm.position.set(x, y + 40, z);
    arm.castShadow = true;
    arm.receiveShadow = true;
    scene.add(arm);
    gameObjects.push(arm);

    // Antenna cone
    var coneGeometry = new THREE.ConeGeometry(20, 40, 12);
    var coneMaterial = new THREE.MeshStandardMaterial({
      color: 0x336699,
      roughness: 0.4,
      metalness: 0.8,
      emissive: 0x0066ff,
      emissiveIntensity: 0.2
    });
    var cone = new THREE.Mesh(coneGeometry, coneMaterial);
    cone.position.set(x, y + 80, z);
    cone.castShadow = true;
    cone.receiveShadow = true;
    scene.add(cone);
    gameObjects.push(cone);
  };

  var createPressureSuitRack = function(x, y, z) {
    // Rack box
    var rackGeometry = new THREE.BoxGeometry(40, 80, 30);
    var rackMaterial = new THREE.MeshStandardMaterial({
      color: 0x2a2a2a,
      roughness: 0.7,
      metalness: 0.5
    });
    var rack = new THREE.Mesh(rackGeometry, rackMaterial);
    rack.position.set(x, y, z);
    rack.castShadow = true;
    rack.receiveShadow = true;
    scene.add(rack);
    gameObjects.push(rack);

    // Helmet suits (sphere helmets on simplified stands)
    for (var i = 0; i < 3; i++) {
      var helmetGeometry = new THREE.SphereGeometry(8, 8, 8);
      var helmetMaterial = new THREE.MeshStandardMaterial({
        color: 0xcccccc,
        roughness: 0.3,
        metalness: 0.9,
        emissive: 0x6699ff,
        emissiveIntensity: 0.1
      });
      var helmet = new THREE.Mesh(helmetGeometry, helmetMaterial);
      helmet.position.set(x - 15 + i * 15, y + 30, z);
      helmet.castShadow = true;
      helmet.receiveShadow = true;
      scene.add(helmet);
      gameObjects.push(helmet);
    }
  };

  var createDecompressedSection = function(x, y, z) {
    // Cracked box section
    var sectionGeometry = new THREE.BoxGeometry(80, 60, 60);
    var sectionMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a1a1a,
      roughness: 0.9,
      metalness: 0.1
    });
    var section = new THREE.Mesh(sectionGeometry, sectionMaterial);
    section.position.set(x, y, z);
    section.castShadow = true;
    section.receiveShadow = true;
    scene.add(section);
    gameObjects.push(section);

    // Crack lines
    var crackPoints = [
      new THREE.Vector3(-30, 20, 0),
      new THREE.Vector3(-10, 0, 0),
      new THREE.Vector3(20, -20, 0),
      new THREE.Vector3(40, -10, 0)
    ];
    var crackGeometry = new THREE.BufferGeometry().setFromPoints(crackPoints);
    var crackMaterial = new THREE.LineBasicMaterial({ color: 0xff4400, linewidth: 2 });
    var crack = new THREE.Line(crackGeometry, crackMaterial);
    crack.position.set(x, y, z);
    scene.add(crack);
    gameObjects.push(crack);
  };

  var createOreHopper = function(x, y, z) {
    // Inverted cone
    var hopperGeometry = new THREE.ConeGeometry(50, 80, 12);
    var hopperMaterial = new THREE.MeshStandardMaterial({
      color: 0x664422,
      roughness: 0.8,
      metalness: 0.3,
      emissive: 0x996633,
      emissiveIntensity: 0.1
    });
    var hopper = new THREE.Mesh(hopperGeometry, hopperMaterial);
    hopper.position.set(x, y, z);
    hopper.rotation.x = Math.PI;
    hopper.castShadow = true;
    hopper.receiveShadow = true;
    scene.add(hopper);
    gameObjects.push(hopper);

    // Outlet cylinder
    var outletGeometry = new THREE.CylinderGeometry(15, 15, 40, 8);
    var outletMaterial = new THREE.MeshStandardMaterial({
      color: 0x333333,
      roughness: 0.7,
      metalness: 0.5
    });
    var outlet = new THREE.Mesh(outletGeometry, outletMaterial);
    outlet.position.set(x, y - 60, z);
    outlet.castShadow = true;
    outlet.receiveShadow = true;
    scene.add(outlet);
    gameObjects.push(outlet);
  };

  var createEscapePod = function(x, y, z) {
    // Pod capsule (box)
    var podGeometry = new THREE.BoxGeometry(20, 30, 20);
    var podMaterial = new THREE.MeshStandardMaterial({
      color: 0x333333,
      roughness: 0.5,
      metalness: 0.7
    });
    var pod = new THREE.Mesh(podGeometry, podMaterial);
    pod.position.set(x, y, z);
    pod.castShadow = true;
    pod.receiveShadow = true;
    scene.add(pod);
    gameObjects.push(pod);

    // Ready light (small sphere)
    var lightGeometry = new THREE.SphereGeometry(3, 6, 6);
    var lightMaterial = new THREE.MeshStandardMaterial({
      color: 0xff0000,
      roughness: 0.2,
      metalness: 0.8,
      emissive: 0xff0000,
      emissiveIntensity: 0.5
    });
    var light = new THREE.Mesh(lightGeometry, lightMaterial);
    light.position.set(x, y + 12, z);
    scene.add(light);
    gameObjects.push(light);

    return { pod: pod, light: light };
  };

  var createAsteroidFragments = function() {
    // Irregular sphere cluster around asteroid
    for (var i = 0; i < 12; i++) {
      var fragmentGeometry = new THREE.SphereGeometry(
        10 + Math.random() * 25,
        6,
        6
      );
      var fragmentMaterial = new THREE.MeshStandardMaterial({
        color: 0x442211,
        roughness: 0.85,
        metalness: 0.05
      });
      var fragment = new THREE.Mesh(fragmentGeometry, fragmentMaterial);

      var angle = (i / 12) * Math.PI * 2;
      var distance = 200 + Math.random() * 100;
      fragment.position.set(
        Math.cos(angle) * distance,
        Math.sin(angle) * 100 - 50,
        Math.sin(angle * 0.7) * distance
      );
      fragment.castShadow = true;
      fragment.receiveShadow = true;
      scene.add(fragment);
      gameObjects.push(fragment);
    }
  };

  var createEnemies = function() {
    // Space pirates
    createPirate(60, 50, 80);
    createPirate(-60, -30, 100);
    createPirate(40, -80, -50);

    // Mining robots
    createMiningRobot(0, 80, 120);
    createMiningRobot(-80, 20, 60);

    // Base commander (larger presence)
    createBaseCommander(120, 80, 80);
  };

  var createPirate = function(x, y, z) {
    // Body (box)
    var bodyGeometry = new THREE.BoxGeometry(16, 30, 12);
    var bodyMaterial = new THREE.MeshStandardMaterial({
      color: 0x2a3a4a,
      roughness: 0.6,
      metalness: 0.5
    });
    var body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.set(x, y, z);
    body.castShadow = true;
    body.receiveShadow = true;
    scene.add(body);
    gameObjects.push(body);
    enemies.push(body);

    // Helmet (sphere)
    var helmetGeometry = new THREE.SphereGeometry(10, 8, 8);
    var helmetMaterial = new THREE.MeshStandardMaterial({
      color: 0xcccccc,
      roughness: 0.3,
      metalness: 0.8,
      emissive: 0xff6600,
      emissiveIntensity: 0.2
    });
    var helmet = new THREE.Mesh(helmetGeometry, helmetMaterial);
    helmet.position.set(x, y + 20, z);
    helmet.castShadow = true;
    helmet.receiveShadow = true;
    scene.add(helmet);
    gameObjects.push(helmet);
    enemies.push(helmet);
  };

  var createMiningRobot = function(x, y, z) {
    // Body (box)
    var bodyGeometry = new THREE.BoxGeometry(20, 35, 18);
    var bodyMaterial = new THREE.MeshStandardMaterial({
      color: 0x444444,
      roughness: 0.7,
      metalness: 0.6
    });
    var body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.set(x, y, z);
    body.castShadow = true;
    body.receiveShadow = true;
    scene.add(body);
    gameObjects.push(body);
    enemies.push(body);

    // Arms (cylinders)
    for (var i = 0; i < 2; i++) {
      var armGeometry = new THREE.CylinderGeometry(5, 5, 40, 8);
      var armMaterial = new THREE.MeshStandardMaterial({
        color: 0x555555,
        roughness: 0.6,
        metalness: 0.7
      });
      var arm = new THREE.Mesh(armGeometry, armMaterial);
      arm.position.set(x + (i === 0 ? -15 : 15), y + 5, z);
      arm.rotation.z = (i === 0 ? -0.3 : 0.3);
      arm.castShadow = true;
      arm.receiveShadow = true;
      scene.add(arm);
      gameObjects.push(arm);
      enemies.push(arm);
    }
  };

  var createBaseCommander = function(x, y, z) {
    // Larger body
    var bodyGeometry = new THREE.BoxGeometry(22, 40, 16);
    var bodyMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a3a5a,
      roughness: 0.5,
      metalness: 0.7,
      emissive: 0x0066ff,
      emissiveIntensity: 0.2
    });
    var body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.set(x, y, z);
    body.castShadow = true;
    body.receiveShadow = true;
    scene.add(body);
    gameObjects.push(body);
    enemies.push(body);

    // Command helmet
    var helmetGeometry = new THREE.SphereGeometry(12, 10, 10);
    var helmetMaterial = new THREE.MeshStandardMaterial({
      color: 0xffaa00,
      roughness: 0.2,
      metalness: 0.9,
      emissive: 0xff6600,
      emissiveIntensity: 0.4
    });
    var helmet = new THREE.Mesh(helmetGeometry, helmetMaterial);
    helmet.position.set(x, y + 25, z);
    helmet.castShadow = true;
    helmet.receiveShadow = true;
    scene.add(helmet);
    gameObjects.push(helmet);
    enemies.push(helmet);
  };

  var handleKeyDown = function(e) {
    var currentTime = Date.now();
    var lastKeyCode = keySequence[keySequence.length - 1];

    // Check for A+B keybind (A=65, B=66)
    if (e.keyCode === 65) {
      keySequence = [65];
      lastKeyTime = currentTime;
    } else if (e.keyCode === 66 && lastKeyCode === 65) {
      if (currentTime - lastKeyTime < 400) {
        hudState.hudEnabled = !hudState.hudEnabled;
        console.log('HUD toggled: ' + (hudState.hudEnabled ? 'ON' : 'OFF'));
        keySequence = [];
      } else {
        keySequence = [];
      }
    } else {
      keySequence = [];
    }

    keysPressed[e.keyCode] = true;
  };

  var handleKeyUp = function(e) {
    keysPressed[e.keyCode] = false;
  };

  // Update function called each frame
  var update = function(delta) {
    if (!scene) return;

    time += delta;

    // Rotate asteroid slowly
    if (asteroid) {
      asteroid.rotation.x += delta * 0.05;
      asteroid.rotation.y += delta * 0.08;
    }

    // Mining laser pulse and rotate
    if (miningLaser) {
      miningLaser.laser.rotation.y += delta * 2;
      miningLaser.cone.rotation.y += delta * 2;

      var pulseIntensity = 0.3 + Math.sin(time * 3) * 0.3;
      if (miningLaser.cone.material) {
        miningLaser.cone.material.emissiveIntensity = pulseIntensity;
      }
    }

    // Solar panels track sun (simple rotation)
    for (var i = 0; i < solarPanels.length; i++) {
      solarPanels[i].rotation.y += delta * 0.3;
    }

    // Ore conveyor moves
    if (oreConveyor) {
      for (var i = 0; i < oreConveyor.rollers.length; i++) {
        oreConveyor.rollers[i].rotation.z += delta * 5;
      }
    }

    // Mass driver charging builds intensity
    if (massDriver) {
      var chargeIntensity = 0.1 + (hudState.massDriverCharge / 100) * 0.4;
      if (massDriver.chamber.material) {
        massDriver.chamber.material.emissiveIntensity = chargeIntensity;
      }
      if (massDriver.barrel.material) {
        massDriver.barrel.material.emissiveIntensity = chargeIntensity * 0.5;
      }
    }

    // Docked fighter engine glow pulses
    if (dockedFighter) {
      for (var i = 0; i < dockedFighter.engines.length; i++) {
        var enginePulse = 0.2 + Math.sin(time * 4 + i) * 0.2;
        if (dockedFighter.engines[i].material) {
          dockedFighter.engines[i].material.emissiveIntensity = enginePulse;
        }
      }
    }

    // Escape pod ready light blinks
    for (var i = 0; i < escapePods.length; i++) {
      var blinkIntensity = Math.sin(time * 3) > 0 ? 0.6 : 0.3;
      if (escapePods[i].light.material) {
        escapePods[i].light.material.emissiveIntensity = blinkIntensity;
      }
    }

    // Slowly move enemies for animation
    for (var i = 0; i < enemies.length; i++) {
      enemies[i].position.y += Math.sin(time + i) * delta * 0.5;
    }
  };

  // Reset function
  var reset = function() {
    // Remove all game objects from scene
    for (var i = gameObjects.length - 1; i >= 0; i--) {
      scene.remove(gameObjects[i]);

      // Dispose geometries and materials
      if (gameObjects[i].geometry) {
        gameObjects[i].geometry.dispose();
      }
      if (gameObjects[i].material) {
        if (Array.isArray(gameObjects[i].material)) {
          for (var j = 0; j < gameObjects[i].material.length; j++) {
            gameObjects[i].material[j].dispose();
          }
        } else {
          gameObjects[i].material.dispose();
        }
      }
    }

    gameObjects = [];
    enemies = [];
    solarPanels = [];
    escapePods = [];

    miningLaser = null;
    oreConveyor = null;
    massDriver = null;
    dockedFighter = null;
    asteroid = null;

    hudState = {
      massDriverCharge: 67,
      baseDestroyed: 0,
      evacuationInitiated: false,
      hudEnabled: true
    };

    time = 0;
    keysPressed = {};
    lastKeyTime = 0;
    keySequence = [];

    // Remove key listeners
    document.removeEventListener('keydown', handleKeyDown);
    document.removeEventListener('keyup', handleKeyUp);
  };

  // Public API
  return {
    init: init,
    update: update,
    reset: reset,
    getHUDState: function() { return hudState; },
    getMassDriverCharge: function() { return hudState.massDriverCharge; },
    getBaseDestroyed: function() { return hudState.baseDestroyed; },
    isEvacuationInitiated: function() { return hudState.evacuationInitiated; },
    isHUDEnabled: function() { return hudState.hudEnabled; }
  };
}());
