window.SteelCanyon = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var allObjects = [];

  var colors = {
    darkSteel: 0x2a3a4a,
    lightSteel: 0x4a5a6a,
    rustRed: 0x8b4513,
    yellow: 0xffaa00,
    black: 0x1a1a1a,
    darkGray: 0x3a3a3a,
    blue: 0x4488ff,
    brightYellow: 0xffdd00
  };

  var steamPuffs = [];
  var craneHook = null;
  var searchlights = [];

  function addObject(object) {
    scene.add(object);
    allObjects.push(object);
    return object;
  }

  function createCanyonWalls() {
    // East wall - main factory structure
    var eastWallGeometry = new THREE.BoxGeometry(4, 35, 80);
    var eastWallMaterial = new THREE.MeshPhongMaterial({ color: colors.darkSteel });
    var eastWall = new THREE.Mesh(eastWallGeometry, eastWallMaterial);
    eastWall.position.set(8, 17.5, 0);
    eastWall.castShadow = true;
    eastWall.receiveShadow = true;
    addObject(eastWall);

    // West wall - main factory structure
    var westWallGeometry = new THREE.BoxGeometry(4, 35, 80);
    var westWallMaterial = new THREE.MeshPhongMaterial({ color: colors.darkSteel });
    var westWall = new THREE.Mesh(westWallGeometry, westWallMaterial);
    westWall.position.set(-8, 17.5, 0);
    westWall.castShadow = true;
    westWall.receiveShadow = true;
    addObject(westWall);

    // East wall upper section
    var eastUpperGeometry = new THREE.BoxGeometry(4, 8, 80);
    var eastUpperMaterial = new THREE.MeshPhongMaterial({ color: colors.lightSteel });
    var eastUpper = new THREE.Mesh(eastUpperGeometry, eastUpperMaterial);
    eastUpper.position.set(8, 34, 0);
    eastUpper.castShadow = true;
    addObject(eastUpper);

    // West wall upper section
    var westUpperGeometry = new THREE.BoxGeometry(4, 8, 80);
    var westUpperMaterial = new THREE.MeshPhongMaterial({ color: colors.lightSteel });
    var westUpper = new THREE.Mesh(westUpperGeometry, westUpperMaterial);
    westUpper.position.set(-8, 34, 0);
    westUpper.castShadow = true;
    addObject(westUpper);
  }

  function createFactoryWindows() {
    var windowCount = 0;

    // East wall windows - 5 rows, multiple windows per row
    for (var row = 0; row < 5; row++) {
      for (var col = 0; col < 8; col++) {
        var xPos = 8.5;
        var yPos = 5 + row * 6;
        var zPos = -32 + col * 10;

        // Window frame
        var frameGeometry = new THREE.BoxGeometry(1.2, 2, 2);
        var frameMaterial = new THREE.MeshPhongMaterial({ color: colors.yellow });
        var frame = new THREE.Mesh(frameGeometry, frameMaterial);
        frame.position.set(xPos, yPos, zPos);
        addObject(frame);
        windowCount++;

        // Window glass (blue inset)
        var glassGeometry = new THREE.BoxGeometry(1.0, 1.8, 1.8);
        var glassMaterial = new THREE.MeshPhongMaterial({ color: colors.blue, emissive: 0x223366 });
        var glass = new THREE.Mesh(glassGeometry, glassMaterial);
        glass.position.set(xPos + 0.15, yPos, zPos);
        addObject(glass);
        windowCount++;
      }
    }

    // West wall windows - symmetric
    for (var row = 0; row < 5; row++) {
      for (var col = 0; col < 8; col++) {
        var xPos = -8.5;
        var yPos = 5 + row * 6;
        var zPos = -32 + col * 10;

        // Window frame
        var frameGeometry = new THREE.BoxGeometry(1.2, 2, 2);
        var frameMaterial = new THREE.MeshPhongMaterial({ color: colors.yellow });
        var frame = new THREE.Mesh(frameGeometry, frameMaterial);
        frame.position.set(xPos, yPos, zPos);
        addObject(frame);
        windowCount++;

        // Window glass
        var glassGeometry = new THREE.BoxGeometry(1.0, 1.8, 1.8);
        var glassMaterial = new THREE.MeshPhongMaterial({ color: colors.blue, emissive: 0x223366 });
        var glass = new THREE.Mesh(glassGeometry, glassMaterial);
        glass.position.set(xPos - 0.15, yPos, zPos);
        addObject(glass);
        windowCount++;
      }
    }
  }

  function createBridgeWalkways() {
    // Mid-level bridge
    var bridge1Geometry = new THREE.BoxGeometry(16, 1.5, 3);
    var bridgeMaterial = new THREE.MeshPhongMaterial({ color: colors.lightSteel });
    var bridge1 = new THREE.Mesh(bridge1Geometry, bridgeMaterial);
    bridge1.position.set(0, 15, 0);
    bridge1.castShadow = true;
    bridge1.receiveShadow = true;
    addObject(bridge1);

    // Upper bridge
    var bridge2Geometry = new THREE.BoxGeometry(16, 1.5, 3);
    var bridge2 = new THREE.Mesh(bridge2Geometry, bridgeMaterial);
    bridge2.position.set(0, 25, -25);
    bridge2.castShadow = true;
    bridge2.receiveShadow = true;
    addObject(bridge2);

    // Lower bridge
    var bridge3Geometry = new THREE.BoxGeometry(16, 1.5, 3);
    var bridge3 = new THREE.Mesh(bridge3Geometry, bridgeMaterial);
    bridge3.position.set(0, 8, 25);
    bridge3.castShadow = true;
    bridge3.receiveShadow = true;
    addObject(bridge3);

    // Diagonal bridge support struts
    var strutGeometry = new THREE.BoxGeometry(1, 1, 10);
    var strutMaterial = new THREE.MeshPhongMaterial({ color: colors.darkSteel });
    for (var i = 0; i < 4; i++) {
      var strut = new THREE.Mesh(strutGeometry, strutMaterial);
      strut.position.set(-4 + i * 2.5, 12, 0);
      strut.rotation.z = 0.3;
      addObject(strut);
    }
  }

  function createIndustrialPipes() {
    var pipeCount = 0;

    // Horizontal pipes running along east wall
    for (var i = 0; i < 6; i++) {
      var pipeGeometry = new THREE.CylinderGeometry(0.4, 0.4, 80, 12);
      var pipeMaterial = new THREE.MeshPhongMaterial({ color: colors.rustRed });
      var pipe = new THREE.Mesh(pipeGeometry, pipeMaterial);
      pipe.rotation.z = Math.PI / 2;
      pipe.position.set(8.5, 6 + i * 4, 0);
      pipe.castShadow = true;
      addObject(pipe);
      pipeCount++;
    }

    // Horizontal pipes running along west wall
    for (var i = 0; i < 6; i++) {
      var pipeGeometry = new THREE.CylinderGeometry(0.4, 0.4, 80, 12);
      var pipeMaterial = new THREE.MeshPhongMaterial({ color: colors.rustRed });
      var pipe = new THREE.Mesh(pipeGeometry, pipeMaterial);
      pipe.rotation.z = Math.PI / 2;
      pipe.position.set(-8.5, 6 + i * 4, 0);
      pipe.castShadow = true;
      addObject(pipe);
      pipeCount++;
    }

    // Vertical pipes running up east wall
    for (var i = 0; i < 4; i++) {
      var pipeGeometry = new THREE.CylinderGeometry(0.35, 0.35, 35, 12);
      var pipeMaterial = new THREE.MeshPhongMaterial({ color: colors.darkGray });
      var pipe = new THREE.Mesh(pipeGeometry, pipeMaterial);
      pipe.position.set(7 + i * 0.8, 17.5, 35);
      pipe.castShadow = true;
      addObject(pipe);
      pipeCount++;
    }

    // Vertical pipes running up west wall
    for (var i = 0; i < 4; i++) {
      var pipeGeometry = new THREE.CylinderGeometry(0.35, 0.35, 35, 12);
      var pipeMaterial = new THREE.MeshPhongMaterial({ color: colors.darkGray });
      var pipe = new THREE.Mesh(pipeGeometry, pipeMaterial);
      pipe.position.set(-7 - i * 0.8, 17.5, 35);
      pipe.castShadow = true;
      addObject(pipe);
      pipeCount++;
    }

    // Diagonal pipes across canyon
    for (var i = 0; i < 3; i++) {
      var pipeGeometry = new THREE.CylinderGeometry(0.3, 0.3, 18, 12);
      var pipeMaterial = new THREE.MeshPhongMaterial({ color: colors.rustRed });
      var pipe = new THREE.Mesh(pipeGeometry, pipeMaterial);
      pipe.rotation.z = Math.PI / 4;
      pipe.position.set(0, 18 + i * 5, -30 + i * 15);
      addObject(pipe);
      pipeCount++;
    }
  }

  function createSteamVents() {
    // Vent locations
    var ventLocations = [
      { x: 7, y: 4, z: -30 },
      { x: -7, y: 4, z: -20 },
      { x: 7, y: 8, z: 0 },
      { x: -7, y: 8, z: 20 },
      { x: 7, y: 12, z: 30 },
      { x: -7, y: 12, z: 35 }
    ];

    ventLocations.forEach(function(loc) {
      // Vent housing
      var ventGeometry = new THREE.CylinderGeometry(0.8, 0.8, 2, 16);
      var ventMaterial = new THREE.MeshPhongMaterial({ color: colors.yellow });
      var vent = new THREE.Mesh(ventGeometry, ventMaterial);
      vent.position.set(loc.x, loc.y, loc.z);
      vent.castShadow = true;
      addObject(vent);

      // Create steam puffs
      for (var i = 0; i < 3; i++) {
        var steamGeometry = new THREE.SphereGeometry(0.6, 8, 8);
        var steamMaterial = new THREE.MeshPhongMaterial({
          color: 0xcccccc,
          transparent: true,
          opacity: 0.4
        });
        var steam = new THREE.Mesh(steamGeometry, steamMaterial);
        steam.position.set(loc.x, loc.y + 1.5, loc.z);
        addObject(steam);

        steamPuffs.push({
          mesh: steam,
          startY: loc.y + 1.5,
          velocity: 0.3 + Math.random() * 0.3,
          life: 0,
          maxLife: 3 + Math.random() * 2,
          scaleVelocity: 0.15 + Math.random() * 0.1,
          offsetX: (Math.random() - 0.5) * 2,
          offsetZ: (Math.random() - 0.5) * 2
        });
      }
    });
  }

  function createCanyonFloor() {
    // Main floor
    var floorGeometry = new THREE.BoxGeometry(20, 1, 80);
    var floorMaterial = new THREE.MeshPhongMaterial({ color: colors.darkSteel });
    var floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.position.set(0, 0, 0);
    floor.receiveShadow = true;
    addObject(floor);

    // Oil slick patches
    for (var i = 0; i < 8; i++) {
      var oilGeometry = new THREE.BoxGeometry(4, 0.1, 8);
      var oilMaterial = new THREE.MeshPhongMaterial({ color: colors.black, emissive: 0x111111 });
      var oil = new THREE.Mesh(oilGeometry, oilMaterial);
      oil.position.set(-8 + Math.random() * 16, 0.5, -30 + i * 10);
      addObject(oil);
    }

    // Drain grates - using LineSegments
    for (var row = 0; row < 8; row++) {
      for (var col = 0; col < 3; col++) {
        var grateGeometry = new THREE.BufferGeometry();
        var grateVertices = new Float32Array([
          -2, 0.6, -2 + row * 10,   2, 0.6, -2 + row * 10,
          2, 0.6, -2 + row * 10,    2, 0.6, 2 + row * 10,
          2, 0.6, 2 + row * 10,    -2, 0.6, 2 + row * 10,
          -2, 0.6, 2 + row * 10,   -2, 0.6, -2 + row * 10,
          -1, 0.6, -1 + row * 10,   1, 0.6, -1 + row * 10,
          -1, 0.6, 1 + row * 10,    1, 0.6, 1 + row * 10
        ]);
        grateGeometry.setAttribute('position', new THREE.BufferAttribute(grateVertices, 3));
        var grateMaterial = new THREE.LineBasicMaterial({ color: colors.darkGray });
        var grate = new THREE.LineSegments(grateGeometry, grateMaterial);
        grate.position.set(-8 + col * 8, 0, 0);
        addObject(grate);
      }
    }
  }

  function createOverheadCraneTracks() {
    // Crane track rails
    var trackGeometry = new THREE.BoxGeometry(20, 0.5, 1);
    var trackMaterial = new THREE.MeshPhongMaterial({ color: colors.lightSteel });
    var track = new THREE.Mesh(trackGeometry, trackMaterial);
    track.position.set(0, 32, 0);
    track.castShadow = true;
    addObject(track);

    // Crane hook structure
    var hookSupportGeometry = new THREE.BoxGeometry(3, 8, 1);
    var hookSupportMaterial = new THREE.MeshPhongMaterial({ color: colors.lightSteel });
    var hookSupport = new THREE.Mesh(hookSupportGeometry, hookSupportMaterial);
    hookSupport.position.set(0, 26, 0);
    hookSupport.castShadow = true;
    addObject(hookSupport);

    // Crane hook (cylinder)
    var hookGeometry = new THREE.CylinderGeometry(1, 1, 3, 16);
    var hookMaterial = new THREE.MeshPhongMaterial({ color: colors.yellow });
    craneHook = new THREE.Mesh(hookGeometry, hookMaterial);
    craneHook.position.set(0, 21, 0);
    craneHook.castShadow = true;
    addObject(craneHook);

    // Crane cable - LineSegments
    var cableGeometry = new THREE.BufferGeometry();
    var cableVertices = new Float32Array([
      0, 26, 0,  0, 21, 0
    ]);
    cableGeometry.setAttribute('position', new THREE.BufferAttribute(cableVertices, 3));
    var cableMaterial = new THREE.LineBasicMaterial({ color: colors.darkGray, linewidth: 2 });
    var cable = new THREE.LineSegments(cableGeometry, cableMaterial);
    addObject(cable);
  }

  function createLoadingPlatforms() {
    // East wall platforms
    for (var i = 0; i < 4; i++) {
      var platformGeometry = new THREE.BoxGeometry(6, 2, 4);
      var platformMaterial = new THREE.MeshPhongMaterial({ color: colors.rustRed });
      var platform = new THREE.Mesh(platformGeometry, platformMaterial);
      platform.position.set(11, 8 + i * 7, -35 + i * 15);
      platform.castShadow = true;
      platform.receiveShadow = true;
      addObject(platform);

      // Platform support
      var supportGeometry = new THREE.BoxGeometry(1, 8 + i * 7, 4);
      var supportMaterial = new THREE.MeshPhongMaterial({ color: colors.darkSteel });
      var support = new THREE.Mesh(supportGeometry, supportMaterial);
      support.position.set(14, (8 + i * 7) / 2, -35 + i * 15);
      addObject(support);
    }

    // West wall platforms
    for (var i = 0; i < 4; i++) {
      var platformGeometry = new THREE.BoxGeometry(6, 2, 4);
      var platformMaterial = new THREE.MeshPhongMaterial({ color: colors.rustRed });
      var platform = new THREE.Mesh(platformGeometry, platformMaterial);
      platform.position.set(-11, 8 + i * 7, 35 - i * 15);
      platform.castShadow = true;
      platform.receiveShadow = true;
      addObject(platform);

      // Platform support
      var supportGeometry = new THREE.BoxGeometry(1, 8 + i * 7, 4);
      var supportMaterial = new THREE.MeshPhongMaterial({ color: colors.darkSteel });
      var support = new THREE.Mesh(supportGeometry, supportMaterial);
      support.position.set(-14, (8 + i * 7) / 2, 35 - i * 15);
      addObject(support);
    }
  }

  function createFireEscapes() {
    // East wall fire escape
    for (var level = 0; level < 5; level++) {
      // Horizontal platform
      var platformGeometry = new THREE.BoxGeometry(2, 1, 3);
      var platformMaterial = new THREE.MeshPhongMaterial({ color: colors.yellow });
      var platform = new THREE.Mesh(platformGeometry, platformMaterial);
      platform.position.set(6.5, 5 + level * 6, -30 + level * 4);
      addObject(platform);

      // Vertical connector
      if (level < 4) {
        var connectorGeometry = new THREE.BoxGeometry(0.3, 6, 0.3);
        var connectorMaterial = new THREE.MeshPhongMaterial({ color: colors.rustRed });
        var connector = new THREE.Mesh(connectorGeometry, connectorMaterial);
        connector.position.set(6.5, 8 + level * 6, -30 + level * 4);
        addObject(connector);
      }
    }

    // West wall fire escape
    for (var level = 0; level < 5; level++) {
      // Horizontal platform
      var platformGeometry = new THREE.BoxGeometry(2, 1, 3);
      var platformMaterial = new THREE.MeshPhongMaterial({ color: colors.yellow });
      var platform = new THREE.Mesh(platformGeometry, platformMaterial);
      platform.position.set(-6.5, 5 + level * 6, 30 - level * 4);
      addObject(platform);

      // Vertical connector
      if (level < 4) {
        var connectorGeometry = new THREE.BoxGeometry(0.3, 6, 0.3);
        var connectorMaterial = new THREE.MeshPhongMaterial({ color: colors.rustRed });
        var connector = new THREE.Mesh(connectorGeometry, connectorMaterial);
        connector.position.set(-6.5, 8 + level * 6, 30 - level * 4);
        addObject(connector);
      }
    }
  }

  function createRustedMetalDebris() {
    // Scrap chunks scattered on ground
    var scrapCount = 0;
    for (var i = 0; i < 12; i++) {
      var scrapGeometry = new THREE.BoxGeometry(
        1 + Math.random() * 2,
        0.5 + Math.random() * 1.5,
        1 + Math.random() * 2
      );
      var scrapMaterial = new THREE.MeshPhongMaterial({ color: colors.rustRed });
      var scrap = new THREE.Mesh(scrapGeometry, scrapMaterial);
      scrap.position.set(
        -9 + Math.random() * 18,
        0.5,
        -35 + Math.random() * 70
      );
      scrap.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
      scrap.castShadow = true;
      scrap.receiveShadow = true;
      addObject(scrap);
      scrapCount++;
    }

    // Pipe segments
    for (var i = 0; i < 8; i++) {
      var pipeGeometry = new THREE.CylinderGeometry(0.3, 0.3, 3 + Math.random() * 4, 12);
      var pipeMaterial = new THREE.MeshPhongMaterial({ color: colors.darkGray });
      var pipe = new THREE.Mesh(pipeGeometry, pipeMaterial);
      pipe.position.set(
        -8 + Math.random() * 16,
        0.5,
        -30 + Math.random() * 60
      );
      pipe.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
      pipe.castShadow = true;
      addObject(pipe);
    }
  }

  function createSecurityGates() {
    // Gate locations blocking passages
    var gateLocations = [
      { x: 0, y: 5, z: -35 },
      { x: 0, y: 10, z: 0 },
      { x: 0, y: 15, z: 35 }
    ];

    gateLocations.forEach(function(loc) {
      // Gate frame
      var frameGeometry = new THREE.BoxGeometry(15, 8, 0.5);
      var frameMaterial = new THREE.MeshPhongMaterial({ color: colors.yellow });
      var frame = new THREE.Mesh(frameGeometry, frameMaterial);
      frame.position.set(loc.x, loc.y, loc.z);
      addObject(frame);

      // Vertical bar pattern - LineSegments
      var barGeometry = new THREE.BufferGeometry();
      var barVertices = [];
      for (var bar = 0; bar < 10; bar++) {
        var barX = -7 + bar * 1.5;
        barVertices.push(barX, loc.y - 4, loc.z, barX, loc.y + 4, loc.z);
      }
      barGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(barVertices), 3));
      var barMaterial = new THREE.LineBasicMaterial({ color: colors.darkGray, linewidth: 2 });
      var bars = new THREE.LineSegments(barGeometry, barMaterial);
      bars.position.set(loc.x, loc.y, loc.z);
      addObject(bars);
    });
  }

  function createSearchlights() {
    var searchlightLocations = [
      { x: 8, y: 28, z: -35 },
      { x: -8, y: 28, z: -35 },
      { x: 8, y: 28, z: 35 },
      { x: -8, y: 28, z: 35 }
    ];

    searchlightLocations.forEach(function(loc) {
      // Searchlight housing
      var housingGeometry = new THREE.CylinderGeometry(0.8, 0.8, 2, 16);
      var housingMaterial = new THREE.MeshPhongMaterial({ color: colors.darkGray });
      var housing = new THREE.Mesh(housingGeometry, housingMaterial);
      housing.position.set(loc.x, loc.y, loc.z);
      housing.castShadow = true;
      addObject(housing);

      // Beam (SphereGeometry represents light sphere)
      var beamGeometry = new THREE.SphereGeometry(3, 12, 12);
      var beamMaterial = new THREE.MeshPhongMaterial({
        color: colors.brightYellow,
        emissive: 0xffff00,
        transparent: true,
        opacity: 0.15
      });
      var beam = new THREE.Mesh(beamGeometry, beamMaterial);
      beam.position.set(loc.x, loc.y - 5, loc.z);
      addObject(beam);

      searchlights.push({
        housing: housing,
        beam: beam,
        angle: Math.random() * Math.PI * 2,
        speed: 0.5 + Math.random() * 0.5
      });
    });
  }

  function createCeiling() {
    // Ceiling structure
    var ceilingGeometry = new THREE.BoxGeometry(20, 1, 80);
    var ceilingMaterial = new THREE.MeshPhongMaterial({ color: colors.darkSteel });
    var ceiling = new THREE.Mesh(ceilingGeometry, ceilingMaterial);
    ceiling.position.set(0, 38, 0);
    ceiling.receiveShadow = true;
    addObject(ceiling);

    // Ceiling support beams
    for (var i = 0; i < 5; i++) {
      var beamGeometry = new THREE.BoxGeometry(1, 6, 80);
      var beamMaterial = new THREE.MeshPhongMaterial({ color: colors.lightSteel });
      var beam = new THREE.Mesh(beamGeometry, beamMaterial);
      beam.position.set(-8 + i * 4, 34, 0);
      beam.castShadow = true;
      addObject(beam);
    }
  }

  function init(sceneParam, cameraParam) {
    scene = sceneParam;
    camera = cameraParam;
    allObjects = [];
    steamPuffs = [];
    searchlights = [];

    // Build all canyon elements
    createCanyonWalls();
    createFactoryWindows();
    createBridgeWalkways();
    createIndustrialPipes();
    createSteamVents();
    createCanyonFloor();
    createOverheadCraneTracks();
    createLoadingPlatforms();
    createFireEscapes();
    createRustedMetalDebris();
    createSecurityGates();
    createSearchlights();
    createCeiling();

    // Add lighting
    var ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    var directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 25, 10);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.left = -30;
    directionalLight.shadow.camera.right = 30;
    directionalLight.shadow.camera.top = 40;
    directionalLight.shadow.camera.bottom = -10;
    directionalLight.shadow.camera.near = 0.1;
    directionalLight.shadow.camera.far = 100;
    scene.add(directionalLight);

    return true;
  }

  function update(delta) {
    // Update steam puffs
    for (var i = steamPuffs.length - 1; i >= 0; i--) {
      var puff = steamPuffs[i];
      puff.life += delta;

      if (puff.life >= puff.maxLife) {
        scene.remove(puff.mesh);
        steamPuffs.splice(i, 1);
      } else {
        // Rise upward
        puff.mesh.position.y += puff.velocity * delta;

        // Horizontal drift
        puff.mesh.position.x += puff.offsetX * delta * 0.1;
        puff.mesh.position.z += puff.offsetZ * delta * 0.1;

        // Fade out
        var fadeProgress = puff.life / puff.maxLife;
        puff.mesh.material.opacity = 0.4 * (1 - fadeProgress);

        // Scale up slightly
        var scaleAmount = 1 + puff.life * puff.scaleVelocity;
        puff.mesh.scale.set(scaleAmount, scaleAmount, scaleAmount);
      }
    }

    // Animate crane hook swinging
    if (craneHook) {
      var swingAmount = Math.sin(Date.now() * 0.001) * 2;
      craneHook.position.x = swingAmount;
    }

    // Rotate searchlights
    for (var i = 0; i < searchlights.length; i++) {
      var light = searchlights[i];
      light.angle += light.speed * delta;

      var offsetX = Math.cos(light.angle) * 5;
      var offsetZ = Math.sin(light.angle) * 5;

      light.beam.position.x = light.housing.position.x + offsetX;
      light.beam.position.z = light.housing.position.z + offsetZ;
    }
  }

  function reset() {
    // Remove all objects from scene
    for (var i = 0; i < allObjects.length; i++) {
      scene.remove(allObjects[i]);
    }

    allObjects = [];
    steamPuffs = [];
    searchlights = [];
    craneHook = null;
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
