window.Slaughterhouse = (function() {
  'use strict';

  // Module state
  var scene = null;
  var camera = null;
  var objects = [];
  var animations = [];
  var lastSKeyTime = 0;
  var hudVisible = true;
  var workersFreed = 0;
  var productionLineDown = 0;
  var foremanNeutralized = false;

  // Scene management
  function addObject(obj) {
    objects.push(obj);
    scene.add(obj);
    return obj;
  }

  function removeAllObjects() {
    for (var i = 0; i < objects.length; i++) {
      scene.remove(objects[i]);
    }
    objects = [];
    animations = [];
  }

  // Material definitions
  function createMaterials() {
    var materials = {
      steel: new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.8, roughness: 0.2 }),
      concrete: new THREE.MeshStandardMaterial({ color: 0x555555, metalness: 0.1, roughness: 0.9 }),
      blood: new THREE.MeshStandardMaterial({ color: 0x8B0000, metalness: 0.3, roughness: 0.7 }),
      freezer: new THREE.MeshStandardMaterial({ color: 0x4A90E2, metalness: 0.6, roughness: 0.4 }),
      plastic: new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.1, roughness: 0.8 }),
      hardHat: new THREE.MeshStandardMaterial({ color: 0xFFD700, metalness: 0.4, roughness: 0.5 }),
      rubber: new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.05, roughness: 0.95 })
    };
    return materials;
  }

  // Factory floor initialization
  function createFactoryFloor(mat) {
    var floorGeom = new THREE.BoxGeometry(100, 1, 80);
    var floor = new THREE.Mesh(floorGeom, mat.concrete);
    floor.position.y = 0;
    floor.castShadow = true;
    floor.receiveShadow = true;
    addObject(floor);
    return floor;
  }

  // Main factory structure - large box
  function createMainFactory(mat) {
    var factoryGeom = new THREE.BoxGeometry(60, 20, 50);
    var factory = new THREE.Mesh(factoryGeom, mat.steel);
    factory.position.set(0, 10, 0);
    factory.castShadow = true;
    factory.receiveShadow = true;
    addObject(factory);
    return factory;
  }

  // Conveyor rail system with cylinder hooks
  function createConveyorRailSystem(mat) {
    var railGroup = {};

    // Main rail cylinders
    var railGeom = new THREE.CylinderGeometry(2, 2, 50, 16);
    var rail1 = new THREE.Mesh(railGeom, mat.steel);
    rail1.rotation.z = Math.PI / 2;
    rail1.position.set(-15, 15, 0);
    rail1.castShadow = true;
    addObject(rail1);

    var rail2 = new THREE.Mesh(railGeom, mat.steel);
    rail2.rotation.z = Math.PI / 2;
    rail2.position.set(15, 15, 0);
    rail2.castShadow = true;
    addObject(rail2);

    // Meat hooks (cylinder J-shapes) on rails
    for (var i = 0; i < 8; i++) {
      var hookGeom = new THREE.CylinderGeometry(1, 1, 6, 8);
      var hook = new THREE.Mesh(hookGeom, mat.blood);
      hook.position.set(-15 + (i * 6), 12, 0);
      hook.rotation.z = Math.PI / 4;
      hook.castShadow = true;
      addObject(hook);
    }

    railGroup.rail1 = rail1;
    railGroup.rail2 = rail2;
    return railGroup;
  }

  // Industrial grinder machine
  function createGrinder(mat) {
    var grinderGroup = {};

    // Main grinder body - large box
    var bodyGeom = new THREE.BoxGeometry(15, 12, 12);
    var body = new THREE.Mesh(bodyGeom, mat.steel);
    body.position.set(-30, 8, 20);
    body.castShadow = true;
    addObject(body);

    // Rotating drum inside
    var drumGeom = new THREE.CylinderGeometry(5, 5, 10, 16);
    var drum = new THREE.Mesh(drumGeom, mat.blood);
    drum.rotation.z = Math.PI / 2;
    drum.position.set(-30, 8, 20);
    drum.castShadow = true;
    addObject(drum);

    grinderGroup.body = body;
    grinderGroup.drum = drum;
    grinderGroup.drumRotation = 0;
    return grinderGroup;
  }

  // Blast freezer room
  function createBlastFreezer(mat) {
    var freezerGeom = new THREE.BoxGeometry(20, 15, 18);
    var freezer = new THREE.Mesh(freezerGeom, mat.freezer);
    freezer.position.set(25, 10, -25);
    freezer.castShadow = true;
    addObject(freezer);

    return { body: freezer, frostIntensity: 0 };
  }

  // Weapons crate production line
  function createCrateConveyor(mat) {
    var conveyorGroup = {};

    // Main conveyor belt - long box
    var beltGeom = new THREE.BoxGeometry(40, 2, 8);
    var belt = new THREE.Mesh(beltGeom, mat.rubber);
    belt.position.set(-5, 4, 35);
    belt.castShadow = true;
    addObject(belt);

    // Weapon crates moving along
    var crates = [];
    for (var i = 0; i < 5; i++) {
      var crateGeom = new THREE.BoxGeometry(4, 4, 4);
      var crate = new THREE.Mesh(crateGeom, mat.plastic);
      crate.position.set(-35 + (i * 10), 6, 35);
      crate.castShadow = true;
      addObject(crate);
      crates.push({ mesh: crate, offset: i * 10 });
    }

    conveyorGroup.belt = belt;
    conveyorGroup.crates = crates;
    conveyorGroup.conveyorPosition = 0;
    return conveyorGroup;
  }

  // Forklift
  function createForklift(mat) {
    var forkGroup = {};

    // Main body - box
    var bodyGeom = new THREE.BoxGeometry(3, 4, 5);
    var body = new THREE.Mesh(bodyGeom, mat.steel);
    body.position.set(-40, 3, 15);
    body.castShadow = true;
    addObject(body);

    // Wheels - cylinders
    var wheelGeom = new THREE.CylinderGeometry(1.5, 1.5, 3, 12);
    var wheel1 = new THREE.Mesh(wheelGeom, mat.plastic);
    wheel1.rotation.z = Math.PI / 2;
    wheel1.position.set(-40, 1.5, 12);
    wheel1.castShadow = true;
    addObject(wheel1);

    var wheel2 = new THREE.Mesh(wheelGeom, mat.plastic);
    wheel2.rotation.z = Math.PI / 2;
    wheel2.position.set(-40, 1.5, 18);
    wheel2.castShadow = true;
    addObject(wheel2);

    // Forks - boxes
    var forkGeom = new THREE.BoxGeometry(0.5, 3, 3);
    var fork1 = new THREE.Mesh(forkGeom, mat.steel);
    fork1.position.set(-40, 3, 13);
    fork1.castShadow = true;
    addObject(fork1);

    var fork2 = new THREE.Mesh(forkGeom, mat.steel);
    fork2.position.set(-40, 3, 17);
    fork2.castShadow = true;
    addObject(fork2);

    forkGroup.body = body;
    forkGroup.wheel1 = wheel1;
    forkGroup.wheel2 = wheel2;
    forkGroup.wheelRotation = 0;
    return forkGroup;
  }

  // Cold storage door
  function createColdStorageDoor(mat) {
    var doorGroup = {};

    // Main door - thick box
    var doorGeom = new THREE.BoxGeometry(8, 10, 1);
    var door = new THREE.Mesh(doorGeom, mat.steel);
    door.position.set(35, 8, -20);
    door.castShadow = true;
    addObject(door);

    // Rubber seal ring - cylinder
    var sealGeom = new THREE.CylinderGeometry(4.5, 4.5, 0.3, 16);
    var seal = new THREE.Mesh(sealGeom, mat.rubber);
    seal.position.set(35, 8, -19.5);
    seal.castShadow = true;
    addObject(seal);

    doorGroup.door = door;
    doorGroup.seal = seal;
    return doorGroup;
  }

  // Blood drain trench
  function createBloodDrainTrench(mat) {
    var trenchGroup = {};

    // Recessed trench box
    var trenchGeom = new THREE.BoxGeometry(60, 2, 4);
    var trench = new THREE.Mesh(trenchGeom, mat.blood);
    trench.position.set(0, 0.5, -35);
    trench.castShadow = true;
    addObject(trench);

    // Grate - LineSegments
    var grateGeom = new THREE.BufferGeometry();
    var gratePositions = [];

    for (var i = 0; i < 12; i++) {
      gratePositions.push(-30 + i * 5, 1.5, -35);
      gratePositions.push(-30 + i * 5, 1.5, -35);
    }
    for (var j = 0; j < 3; j++) {
      gratePositions.push(-30, 1.5, -37 + j * 2);
      gratePositions.push(30, 1.5, -37 + j * 2);
    }

    grateGeom.setAttribute('position', new THREE.BufferAttribute(new Float32Array(gratePositions), 3));
    var grate = new THREE.LineSegments(grateGeom, new THREE.LineBasicMaterial({ color: 0x444444 }));
    addObject(grate);

    trenchGroup.trench = trench;
    trenchGroup.grate = grate;
    return trenchGroup;
  }

  // Industrial fan exhaust
  function createIndustrialFan(mat) {
    var fanGroup = {};

    // Fan motor - cylinder
    var motorGeom = new THREE.CylinderGeometry(3, 3, 2, 16);
    var motor = new THREE.Mesh(motorGeom, mat.steel);
    motor.position.set(40, 18, -15);
    motor.castShadow = true;
    addObject(motor);

    // Fan housing - box
    var housingGeom = new THREE.BoxGeometry(8, 8, 2);
    var housing = new THREE.Mesh(housingGeom, mat.steel);
    housing.position.set(40, 18, -15);
    housing.castShadow = true;
    addObject(housing);

    // Fan blades - boxes arranged radially
    var bladeGeom = new THREE.BoxGeometry(6, 0.5, 1);
    var bladeRotation = 0;
    var blades = [];

    for (var i = 0; i < 4; i++) {
      var blade = new THREE.Mesh(bladeGeom, mat.plastic);
      blade.position.set(40, 18, -15);
      blade.castShadow = true;
      addObject(blade);
      blades.push(blade);
    }

    fanGroup.motor = motor;
    fanGroup.housing = housing;
    fanGroup.blades = blades;
    fanGroup.bladeRotation = 0;
    return fanGroup;
  }

  // Chain hoist
  function createChainHoist(mat) {
    var hoistGroup = {};

    // Hoist motor - cylinder
    var motorGeom = new THREE.CylinderGeometry(2, 2, 4, 12);
    var motor = new THREE.Mesh(motorGeom, mat.steel);
    motor.position.set(-20, 18, -20);
    motor.castShadow = true;
    addObject(motor);

    // Chain - LineSegments
    var chainGeom = new THREE.BufferGeometry();
    var chainPositions = [];

    for (var i = 0; i < 10; i++) {
      chainPositions.push(-20, 18 - (i * 1.5), -20);
      chainPositions.push(-20, 18 - (i * 1.5) - 1, -20);
    }

    chainGeom.setAttribute('position', new THREE.BufferAttribute(new Float32Array(chainPositions), 3));
    var chain = new THREE.LineSegments(chainGeom, new THREE.LineBasicMaterial({ color: 0x333333, linewidth: 2 }));
    addObject(chain);

    // Hook at end - small cylinder
    var hookGeom = new THREE.CylinderGeometry(1, 1, 3, 8);
    var hook = new THREE.Mesh(hookGeom, mat.steel);
    hook.position.set(-20, 3, -20);
    hook.castShadow = true;
    addObject(hook);

    hoistGroup.motor = motor;
    hoistGroup.chain = chain;
    hoistGroup.hook = hook;
    hoistGroup.hoistHeight = 0;
    hoistGroup.hoistDirection = 1;
    return hoistGroup;
  }

  // Control station
  function createControlStation(mat) {
    var stationGroup = {};

    // Console body - box
    var consoleGeom = new THREE.BoxGeometry(6, 3, 2);
    var console_ = new THREE.Mesh(consoleGeom, mat.steel);
    console_.position.set(35, 3, 20);
    console_.castShadow = true;
    addObject(console_);

    // Monitor - box
    var monitorGeom = new THREE.BoxGeometry(4, 3, 0.5);
    var monitor = new THREE.Mesh(monitorGeom, mat.freezer);
    monitor.position.set(35, 5, 20);
    monitor.castShadow = true;
    addObject(monitor);

    stationGroup.console = console_;
    stationGroup.monitor = monitor;
    return stationGroup;
  }

  // Loading dock
  function createLoadingDock(mat) {
    var dockGroup = {};

    // Main dock platform - flat box
    var platformGeom = new THREE.BoxGeometry(30, 1, 12);
    var platform = new THREE.Mesh(platformGeom, mat.concrete);
    platform.position.set(-50, 2, 0);
    platform.castShadow = true;
    addObject(platform);

    // Dock bumpers - boxes
    var bumperGeom = new THREE.BoxGeometry(0.5, 1, 12);
    var bumper1 = new THREE.Mesh(bumperGeom, mat.blood);
    bumper1.position.set(-65, 1.5, 0);
    bumper1.castShadow = true;
    addObject(bumper1);

    var bumper2 = new THREE.Mesh(bumperGeom, mat.blood);
    bumper2.position.set(-35, 1.5, 0);
    bumper2.castShadow = true;
    addObject(bumper2);

    dockGroup.platform = platform;
    dockGroup.bumper1 = bumper1;
    dockGroup.bumper2 = bumper2;
    return dockGroup;
  }

  // Refrigerant pipe cluster
  function createRefrigerantPipes(mat) {
    var pipeGroup = {};
    var pipes = [];

    // Multiple pipes overhead
    for (var i = 0; i < 5; i++) {
      var pipeGeom = new THREE.CylinderGeometry(1, 1, 40, 8);
      var pipe = new THREE.Mesh(pipeGeom, mat.freezer);
      pipe.rotation.z = Math.PI / 2;
      pipe.position.set(-10 + (i * 8), 20, -10);
      pipe.castShadow = true;
      addObject(pipe);
      pipes.push(pipe);
    }

    pipeGroup.pipes = pipes;
    return pipeGroup;
  }

  // Emergency shower station
  function createEmergencyShower(mat) {
    var showerGroup = {};

    // Pole - cylinder
    var poleGeom = new THREE.CylinderGeometry(0.5, 0.5, 8, 8);
    var pole = new THREE.Mesh(poleGeom, mat.steel);
    pole.position.set(-60, 4, -30);
    pole.castShadow = true;
    addObject(pole);

    // Shower head - small box
    var headGeom = new THREE.BoxGeometry(2, 0.5, 2);
    var head = new THREE.Mesh(headGeom, mat.steel);
    head.position.set(-60, 9, -30);
    head.castShadow = true;
    addObject(head);

    showerGroup.pole = pole;
    showerGroup.head = head;
    return showerGroup;
  }

  // Enemies - factory floor supervisors
  function createEnemySupervison(mat) {
    var enemies = [];

    for (var i = 0; i < 3; i++) {
      var enemyGroup = {};

      // Body - box
      var bodyGeom = new THREE.BoxGeometry(2, 3, 1.5);
      var body = new THREE.Mesh(bodyGeom, mat.steel);
      body.position.set(-20 + (i * 20), 2.5, 10);
      body.castShadow = true;
      addObject(body);

      // Head - sphere
      var headGeom = new THREE.SphereGeometry(1, 8, 8);
      var head = new THREE.Mesh(headGeom, mat.concrete);
      head.position.set(-20 + (i * 20), 4.5, 10);
      head.castShadow = true;
      addObject(head);

      // Hard hat - cone
      var hatGeom = new THREE.ConeGeometry(1.2, 0.8, 8);
      var hat = new THREE.Mesh(hatGeom, mat.hardHat);
      hat.position.set(-20 + (i * 20), 5.5, 10);
      hat.castShadow = true;
      addObject(hat);

      enemyGroup.body = body;
      enemyGroup.head = head;
      enemyGroup.hat = hat;
      enemyGroup.alive = true;
      enemies.push(enemyGroup);
    }

    return enemies;
  }

  // Create lighting
  function createLighting() {
    // Ambient light for base illumination
    var ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    // Directional light for shadows
    var dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(30, 30, 30);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.far = 200;
    dirLight.shadow.camera.left = -100;
    dirLight.shadow.camera.right = 100;
    dirLight.shadow.camera.top = 100;
    dirLight.shadow.camera.bottom = -100;
    scene.add(dirLight);

    // Flickering lights effect (emissive spheres)
    var lightGeom = new THREE.SphereGeometry(0.3, 8, 8);
    var lightMat = new THREE.MeshBasicMaterial({ color: 0xFFFF99, emissive: 0xFFFF99 });

    for (var i = 0; i < 5; i++) {
      var floorLight = new THREE.Mesh(lightGeom, lightMat);
      floorLight.position.set(-30 + (i * 25), 19, 0);
      scene.add(floorLight);
      animations.push({
        type: 'flicker',
        object: floorLight,
        originalColor: 0xFFFF99,
        time: Math.random() * Math.PI * 2
      });
    }
  }

  // Create fog and atmosphere
  function createAtmosphere() {
    scene.fog = new THREE.Fog(0x442222, 150, 200);
    scene.background = new THREE.Color(0x1a1a1a);
  }

  // Update animations
  function updateAnimations(delta) {
    for (var i = 0; i < animations.length; i++) {
      var anim = animations[i];

      if (anim.type === 'flicker') {
        anim.time += delta * 3;
        var intensity = 0.5 + Math.sin(anim.time) * 0.3 + Math.random() * 0.2;
        anim.object.material.emissiveIntensity = intensity;
      }
    }

    // Grinder drum rotation
    if (window.Slaughterhouse.grinder) {
      window.Slaughterhouse.grinder.drum.rotation.x += 0.05;
    }

    // Conveyor belt movement
    if (window.Slaughterhouse.conveyor) {
      window.Slaughterhouse.conveyor.conveyorPosition += 0.3;
      for (var j = 0; j < window.Slaughterhouse.conveyor.crates.length; j++) {
        var crateData = window.Slaughterhouse.conveyor.crates[j];
        var pos = (crateData.offset - window.Slaughterhouse.conveyor.conveyorPosition) % 40;
        if (pos < 0) pos += 40;
        crateData.mesh.position.x = -35 + pos;
      }
    }

    // Forklift wheel rotation
    if (window.Slaughterhouse.forklift) {
      window.Slaughterhouse.forklift.wheelRotation += 0.02;
      window.Slaughterhouse.forklift.wheel1.rotation.x = window.Slaughterhouse.forklift.wheelRotation;
      window.Slaughterhouse.forklift.wheel2.rotation.x = window.Slaughterhouse.forklift.wheelRotation;
    }

    // Fan blade rotation
    if (window.Slaughterhouse.fan) {
      window.Slaughterhouse.fan.bladeRotation += 0.1;
      for (var k = 0; k < window.Slaughterhouse.fan.blades.length; k++) {
        var angle = (window.Slaughterhouse.fan.bladeRotation + (k * Math.PI / 2));
        window.Slaughterhouse.fan.blades[k].rotation.y = angle;
      }
    }

    // Chain hoist animation
    if (window.Slaughterhouse.hoist) {
      window.Slaughterhouse.hoist.hoistHeight += 0.02 * window.Slaughterhouse.hoist.hoistDirection;
      if (window.Slaughterhouse.hoist.hoistHeight > 10) {
        window.Slaughterhouse.hoist.hoistDirection = -1;
      } else if (window.Slaughterhouse.hoist.hoistHeight < 0) {
        window.Slaughterhouse.hoist.hoistDirection = 1;
      }
      window.Slaughterhouse.hoist.hook.position.y = 3 + window.Slaughterhouse.hoist.hoistHeight;
    }

    // Freezer door frost effect
    if (window.Slaughterhouse.freezer) {
      window.Slaughterhouse.freezer.frostIntensity = 0.3 + Math.sin(Date.now() * 0.002) * 0.2;
      window.Slaughterhouse.freezer.body.material.emissiveIntensity = window.Slaughterhouse.freezer.frostIntensity;
    }
  }

  // HUD notification
  function showHUDNotification(text) {
    if (typeof console !== 'undefined') {
      console.log('HUD: ' + text);
    }
  }

  // Handle S+H keybind
  function handleKeyDown(event) {
    if (event.key === 's' || event.key === 'S') {
      var currentTime = Date.now();
      if (currentTime - lastSKeyTime < 400) {
        if (event.key === 's' && event.key !== lastSKey) {
          lastSKey = event.key;
          return;
        }
      }
      lastSKeyTime = currentTime;
      lastSKey = event.key;
      return;
    }

    if ((event.key === 'h' || event.key === 'H') && (Date.now() - lastSKeyTime < 400)) {
      hudVisible = !hudVisible;
      showHUDNotification(hudVisible ? 'HUD: ON' : 'HUD: OFF');
      lastSKeyTime = 0;
    }
  }

  var lastSKey = null;

  // Initialize the module
  function init(sceneRef, cameraRef) {
    scene = sceneRef;
    camera = cameraRef;

    removeAllObjects();
    lastSKeyTime = 0;
    hudVisible = true;
    workersFreed = 0;
    productionLineDown = 0;
    foremanNeutralized = false;

    // Create materials
    var mat = createMaterials();

    // Build the factory
    createFactoryFloor(mat);
    createMainFactory(mat);
    window.Slaughterhouse.conveyor = createCrateConveyor(mat);
    var railSystem = createConveyorRailSystem(mat);
    window.Slaughterhouse.grinder = createGrinder(mat);
    window.Slaughterhouse.freezer = createBlastFreezer(mat);
    createColdStorageDoor(mat);
    createBloodDrainTrench(mat);
    window.Slaughterhouse.fan = createIndustrialFan(mat);
    window.Slaughterhouse.hoist = createChainHoist(mat);
    createControlStation(mat);
    createLoadingDock(mat);
    createRefrigerantPipes(mat);
    createEmergencyShower(mat);
    createForklift(mat);

    // Create enemies
    window.Slaughterhouse.enemies = createEnemySupervison(mat);

    // Setup lighting and atmosphere
    createLighting();
    createAtmosphere();

    // Bind keyboard events
    if (typeof window !== 'undefined' && window.document) {
      window.addEventListener('keydown', handleKeyDown, false);
    }

    showHUDNotification('SLAUGHTERHOUSE INITIALIZED - WORKERS FREED: 0/10 - PRODUCTION LINE DOWN: 0/4 - FOREMAN NEUTRALIZED: NO');
  }

  // Update the module
  function update(delta) {
    updateAnimations(delta);
  }

  // Reset the module
  function reset() {
    removeAllObjects();
    scene.fog = null;
    scene.background = null;

    if (typeof window !== 'undefined' && window.document) {
      window.removeEventListener('keydown', handleKeyDown, false);
    }

    lastSKeyTime = 0;
    hudVisible = true;
    workersFreed = 0;
    productionLineDown = 0;
    foremanNeutralized = false;
  }

  // Public API
  return {
    init: init,
    update: update,
    reset: reset,
    setWorkersFreed: function(count) { workersFreed = count; },
    setProductionLineDown: function(count) { productionLineDown = count; },
    setForemanNeutralized: function(value) { foremanNeutralized = value; },
    getHUDVisible: function() { return hudVisible; },
    toggleHUD: function() { hudVisible = !hudVisible; }
  };
}());
