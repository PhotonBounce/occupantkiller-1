window.HarborAssault = (function() {
  'use strict';

  var state = {
    lighthouses: [],
    patrolBoats: [],
    gunEmplacements: [],
    cranes: [],
    waterSurfaces: [],
    fuelBarges: [],
    anchorChains: [],
    containers: [],
    ships: [],
    spawnPoints: [],
    scene: null,
    assets: {}
  };

  function init(scene, camera) {
    state.scene = scene;
    scene.background = new THREE.Color(0x87CEEB);
    scene.fog = new THREE.Fog(0x87CEEB, 300, 1000);

    // Water surface - dark blue thin BoxGeometry layer
    var waterGeometry = new THREE.BoxGeometry(500, 1, 400);
    var waterMaterial = new THREE.MeshStandardMaterial({
      color: 0x1A3A5C,
      metalness: 0.7,
      roughness: 0.2
    });
    var waterMesh = new THREE.Mesh(waterGeometry, waterMaterial);
    waterMesh.position.set(0, -5, 0);
    waterMesh.receiveShadow = true;
    scene.add(waterMesh);
    state.waterSurfaces.push({
      mesh: waterMesh,
      baseY: -5,
      waveAmplitude: 0.3,
      waveFreq: 1.5,
      time: 0
    });

    // Concrete pier sections - multiple BoxGeometry platforms
    var pierColors = [0x666666, 0x777777, 0x666666];
    for (var i = 0; i < 5; i++) {
      var pierGeometry = new THREE.BoxGeometry(40, 3, 50);
      var pierMaterial = new THREE.MeshStandardMaterial({
        color: pierColors[i % 3],
        metalness: 0.1,
        roughness: 0.8
      });
      var pier = new THREE.Mesh(pierGeometry, pierMaterial);
      pier.position.set(-100 + i * 45, -2, 0);
      pier.castShadow = true;
      pier.receiveShadow = true;
      scene.add(pier);
    }

    // Bollard mooring posts - CylinderGeometry
    for (var i = 0; i < 12; i++) {
      var bollardGeometry = new THREE.CylinderGeometry(1.5, 2, 4, 8);
      var bollardMaterial = new THREE.MeshStandardMaterial({
        color: 0xFF6633,
        metalness: 0.6,
        roughness: 0.4
      });
      var bollard = new THREE.Mesh(bollardGeometry, bollardMaterial);
      bollard.position.set(-100 + i * 18, 1.5, -25);
      bollard.castShadow = true;
      bollard.receiveShadow = true;
      scene.add(bollard);
    }

    // Shipping containers on pier - stacked BoxGeometry
    var containerColors = [0xFF0000, 0x00AA00, 0x0033FF, 0xFFCC00, 0xFF6600];
    var containerCount = 0;
    for (var stack = 0; stack < 5; stack++) {
      for (var level = 0; level < 3; level++) {
        var containerGeometry = new THREE.BoxGeometry(15, 12, 12);
        var containerMaterial = new THREE.MeshStandardMaterial({
          color: containerColors[containerCount % 5],
          metalness: 0.3,
          roughness: 0.6
        });
        var container = new THREE.Mesh(containerGeometry, containerMaterial);
        container.position.set(-50 + stack * 40, 6 + level * 12.5, 60);
        container.castShadow = true;
        container.receiveShadow = true;
        scene.add(container);
        state.containers.push(container);
        containerCount++;
      }
    }

    // Anchored cargo ships - BoxGeometry hulls with superstructures
    for (var shipNum = 0; shipNum < 3; shipNum++) {
      var hullGeometry = new THREE.BoxGeometry(45, 25, 120);
      var hullMaterial = new THREE.MeshStandardMaterial({
        color: 0x333333,
        metalness: 0.4,
        roughness: 0.7
      });
      var hull = new THREE.Mesh(hullGeometry, hullMaterial);
      hull.position.set(120 + shipNum * 120, 12, 80 + shipNum * 40);
      hull.castShadow = true;
      hull.receiveShadow = true;
      scene.add(hull);
      state.ships.push(hull);

      // Superstructure - BoxGeometry tower
      var superGeometry = new THREE.BoxGeometry(30, 35, 25);
      var superMaterial = new THREE.MeshStandardMaterial({
        color: 0x444444,
        metalness: 0.3,
        roughness: 0.8
      });
      var superstructure = new THREE.Mesh(superGeometry, superMaterial);
      superstructure.position.set(120 + shipNum * 120, 35, 40 + shipNum * 40);
      superstructure.castShadow = true;
      superstructure.receiveShadow = true;
      scene.add(superstructure);

      // Funnel - CylinderGeometry
      var funnelGeometry = new THREE.CylinderGeometry(4, 4.5, 22, 12);
      var funnelMaterial = new THREE.MeshStandardMaterial({
        color: 0xCC3300,
        metalness: 0.5,
        roughness: 0.6
      });
      var funnel = new THREE.Mesh(funnelGeometry, funnelMaterial);
      funnel.position.set(110 + shipNum * 120, 48, 40 + shipNum * 40);
      funnel.castShadow = true;
      funnel.receiveShadow = true;
      scene.add(funnel);
    }

    // Naval gun emplacement - BoxGeometry bunker + CylinderGeometry barrel
    var bunkerGeometry = new THREE.BoxGeometry(50, 15, 50);
    var bunkerMaterial = new THREE.MeshStandardMaterial({
      color: 0x555555,
      metalness: 0.2,
      roughness: 0.9
    });
    var bunker = new THREE.Mesh(bunkerGeometry, bunkerMaterial);
    bunker.position.set(-250, 5, -120);
    bunker.castShadow = true;
    bunker.receiveShadow = true;
    scene.add(bunker);

    var gunBarrelGeometry = new THREE.CylinderGeometry(2, 2.5, 45, 8);
    var gunBarrelMaterial = new THREE.MeshStandardMaterial({
      color: 0x222222,
      metalness: 0.8,
      roughness: 0.3
    });
    var gunBarrel = new THREE.Mesh(gunBarrelGeometry, gunBarrelMaterial);
    gunBarrel.position.set(-250, 12, -120);
    gunBarrel.rotation.z = Math.PI / 12;
    gunBarrel.castShadow = true;
    gunBarrel.receiveShadow = true;
    scene.add(gunBarrel);

    var gunEmplacement = {
      bunker: bunker,
      barrel: gunBarrel,
      baseRotation: 0,
      barrelElevation: Math.PI / 12,
      trackingAngle: 0
    };
    state.gunEmplacements.push(gunEmplacement);

    // Patrol boat - BoxGeometry hull + CylinderGeometry engine
    var boatHullGeometry = new THREE.BoxGeometry(20, 8, 35);
    var boatHullMaterial = new THREE.MeshStandardMaterial({
      color: 0x1A4D7A,
      metalness: 0.4,
      roughness: 0.6
    });
    var boatHull = new THREE.Mesh(boatHullGeometry, boatHullMaterial);
    boatHull.position.set(50, 2, -80);
    boatHull.castShadow = true;
    boatHull.receiveShadow = true;
    scene.add(boatHull);

    var boatEngineGeometry = new THREE.CylinderGeometry(3, 3.5, 8, 6);
    var boatEngineMaterial = new THREE.MeshStandardMaterial({
      color: 0xCC3300,
      metalness: 0.6,
      roughness: 0.5
    });
    var boatEngine = new THREE.Mesh(boatEngineGeometry, boatEngineMaterial);
    boatEngine.position.set(50, 8, -85);
    boatEngine.castShadow = true;
    boatEngine.receiveShadow = true;
    scene.add(boatEngine);

    var patrolBoat = {
      hull: boatHull,
      engine: boatEngine,
      baseX: 50,
      baseZ: -80,
      bobAmplitude: 0.8,
      bobFreq: 2.0,
      moveSpeed: 25,
      moveTime: 0,
      moveDistance: 150
    };
    state.patrolBoats.push(patrolBoat);

    // Harbor crane - BoxGeometry frame + CylinderGeometry drum + LineSegments nets
    var craneFrameGeometry = new THREE.BoxGeometry(8, 80, 8);
    var craneFrameMaterial = new THREE.MeshStandardMaterial({
      color: 0xFF9900,
      metalness: 0.4,
      roughness: 0.6
    });
    var craneFrame = new THREE.Mesh(craneFrameGeometry, craneFrameMaterial);
    craneFrame.position.set(-30, 40, 120);
    craneFrame.castShadow = true;
    craneFrame.receiveShadow = true;
    scene.add(craneFrame);

    var craneBoomGeometry = new THREE.BoxGeometry(100, 5, 5);
    var craneBoomMaterial = new THREE.MeshStandardMaterial({
      color: 0xFF9900,
      metalness: 0.4,
      roughness: 0.6
    });
    var craneBoom = new THREE.Mesh(craneBoomGeometry, craneBoomMaterial);
    craneBoom.position.set(20, 78, 120);
    craneBoom.castShadow = true;
    craneBoom.receiveShadow = true;
    scene.add(craneBoom);

    var drummGeometry = new THREE.CylinderGeometry(6, 6, 8, 8);
    var drummMaterial = new THREE.MeshStandardMaterial({
      color: 0x222222,
      metalness: 0.7,
      roughness: 0.4
    });
    var drumm = new THREE.Mesh(drummGeometry, drummMaterial);
    drumm.position.set(-30, 50, 120);
    drumm.rotation.z = Math.PI / 2;
    drumm.castShadow = true;
    drumm.receiveShadow = true;
    scene.add(drumm);

    // Crane nets - LineSegments
    var netGeometry = new THREE.BufferGeometry();
    var netPoints = [];
    for (var row = 0; row < 6; row++) {
      for (var col = 0; col < 6; col++) {
        netPoints.push(new THREE.Vector3(20 + col * 5, 65 - row * 4, 120));
      }
    }
    netGeometry.setFromPoints(netPoints);
    var netMaterial = new THREE.LineBasicMaterial({ color: 0xCCCCCC, linewidth: 1 });
    var nets = new THREE.LineSegments(netGeometry, netMaterial);
    scene.add(nets);
    state.anchorChains.push(nets);

    var crane = {
      frame: craneFrame,
      boom: craneBoom,
      drum: drumm,
      baseRotation: 0,
      swingAngle: 0,
      swingSpeed: 0.5,
      nets: nets
    };
    state.cranes.push(crane);

    // Lighthouse - CylinderGeometry tower + SphereGeometry light
    var lighthouseGeometry = new THREE.CylinderGeometry(4, 5, 60, 12);
    var lighthouseMaterial = new THREE.MeshStandardMaterial({
      color: 0xFFFFFF,
      metalness: 0.2,
      roughness: 0.7
    });
    var lighthouse = new THREE.Mesh(lighthouseGeometry, lighthouseMaterial);
    lighthouse.position.set(-280, 30, 200);
    lighthouse.castShadow = true;
    lighthouse.receiveShadow = true;
    scene.add(lighthouse);

    var lightBulbGeometry = new THREE.SphereGeometry(3, 8, 8);
    var lightBulbMaterial = new THREE.MeshStandardMaterial({
      color: 0xFFFF00,
      emissive: 0xFFFF00,
      emissiveIntensity: 0.5,
      metalness: 0.3,
      roughness: 0.6
    });
    var lightBulb = new THREE.Mesh(lightBulbGeometry, lightBulbMaterial);
    lightBulb.position.set(-280, 63, 200);
    lightBulb.castShadow = true;
    scene.add(lightBulb);

    var beacon = new THREE.PointLight(0xFFFF00, 1, 200);
    beacon.position.set(-280, 65, 200);
    beacon.castShadow = true;
    scene.add(beacon);

    var lighthouseObj = {
      tower: lighthouse,
      bulb: lightBulb,
      beacon: beacon,
      rotationSpeed: 2.0,
      baseRotation: 0,
      pulsePhase: 0,
      pulseSpeed: 3.0
    };
    state.lighthouses.push(lighthouseObj);

    // Harbor master building - BoxGeometry
    var buildingGeometry = new THREE.BoxGeometry(40, 25, 35);
    var buildingMaterial = new THREE.MeshStandardMaterial({
      color: 0x8B7355,
      metalness: 0.1,
      roughness: 0.8
    });
    var building = new THREE.Mesh(buildingGeometry, buildingMaterial);
    building.position.set(180, 12.5, -60);
    building.castShadow = true;
    building.receiveShadow = true;
    scene.add(building);

    // Roof structure
    var roofGeometry = new THREE.BoxGeometry(42, 3, 37);
    var roofMaterial = new THREE.MeshStandardMaterial({
      color: 0x8B4513,
      metalness: 0.2,
      roughness: 0.7
    });
    var roof = new THREE.Mesh(roofGeometry, roofMaterial);
    roof.position.set(180, 27.5, -60);
    roof.castShadow = true;
    roof.receiveShadow = true;
    scene.add(roof);

    // Fuel barge - BoxGeometry flat hull + CylinderGeometry tanks
    var bargeHullGeometry = new THREE.BoxGeometry(35, 4, 50);
    var bargeHullMaterial = new THREE.MeshStandardMaterial({
      color: 0x1A3A5C,
      metalness: 0.5,
      roughness: 0.5
    });
    var bargeHull = new THREE.Mesh(bargeHullGeometry, bargeHullMaterial);
    bargeHull.position.set(300, -3, 100);
    bargeHull.castShadow = true;
    bargeHull.receiveShadow = true;
    scene.add(bargeHull);

    for (var tank = 0; tank < 4; tank++) {
      var tankGeometry = new THREE.CylinderGeometry(5, 5, 12, 8);
      var tankMaterial = new THREE.MeshStandardMaterial({
        color: 0xFF4444,
        metalness: 0.6,
        roughness: 0.4
      });
      var tankMesh = new THREE.Mesh(tankGeometry, tankMaterial);
      tankMesh.position.set(285 + tank * 8, 4, 100);
      tankMesh.rotation.z = Math.PI / 2;
      tankMesh.castShadow = true;
      tankMesh.receiveShadow = true;
      scene.add(tankMesh);
    }

    var fuelbarge = {
      hull: bargeHull,
      baseX: 300,
      baseY: -3,
      baseZ: 100,
      rockAmplitude: 0.4,
      rockFreq: 1.2,
      time: 0
    };
    state.fuelBarges.push(fuelbarge);

    // Anchor chain lines - LineSegments
    var chainGeometry = new THREE.BufferGeometry();
    var chainPoints = [];
    for (var i = 0; i < 20; i++) {
      chainPoints.push(new THREE.Vector3(120, 8 - i * 1.2, 80));
      chainPoints.push(new THREE.Vector3(120, 8 - i * 1.2 - 1, 80));
    }
    chainGeometry.setFromPoints(chainPoints);
    var chainMaterial = new THREE.LineBasicMaterial({ color: 0x444444, linewidth: 2 });
    var chain = new THREE.LineSegments(chainGeometry, chainMaterial);
    scene.add(chain);
    state.anchorChains.push(chain);

    // Additional anchor chains for other ships
    for (var ship = 1; ship < 3; ship++) {
      var shipChainGeometry = new THREE.BufferGeometry();
      var shipChainPoints = [];
      for (var i = 0; i < 20; i++) {
        shipChainPoints.push(new THREE.Vector3(120 + ship * 120, 8 - i * 1.2, 80 + ship * 40));
        shipChainPoints.push(new THREE.Vector3(120 + ship * 120, 8 - i * 1.2 - 1, 80 + ship * 40));
      }
      shipChainGeometry.setFromPoints(shipChainPoints);
      var shipChain = new THREE.LineSegments(shipChainGeometry, chainMaterial);
      scene.add(shipChain);
      state.anchorChains.push(shipChain);
    }

    // Spawn points at pier entrance, behind containers, on ships
    state.spawnPoints = [
      new THREE.Vector3(-120, 5, -40),
      new THREE.Vector3(-80, 5, -35),
      new THREE.Vector3(-50, 5, 75),
      new THREE.Vector3(-30, 5, 75),
      new THREE.Vector3(20, 5, 80)
    ];

    // Ambient light
    var ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    // Directional light (sun)
    var directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(100, 150, 100);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.far = 500;
    scene.add(directionalLight);
  }

  function update(delta) {
    // Update lighthouses - rotation and pulsing beacon
    for (var i = 0; i < state.lighthouses.length; i++) {
      var lh = state.lighthouses[i];
      lh.baseRotation += lh.rotationSpeed * delta;
      lh.tower.rotation.y = lh.baseRotation;

      lh.pulsePhase += lh.pulseSpeed * delta;
      var pulseIntensity = 0.5 + 0.5 * Math.sin(lh.pulsePhase);
      lh.beacon.intensity = pulseIntensity;
      lh.bulb.material.emissiveIntensity = pulseIntensity * 0.5;
    }

    // Update patrol boats - bobbing motion and patrol path
    for (var i = 0; i < state.patrolBoats.length; i++) {
      var boat = state.patrolBoats[i];
      boat.moveTime += delta;

      var cycleTime = boat.moveDistance / boat.moveSpeed;
      var normalizedTime = (boat.moveTime % cycleTime) / cycleTime;
      var newX = boat.baseX + (normalizedTime < 0.5 ?
        normalizedTime * 2 * boat.moveDistance :
        (2 - normalizedTime * 2) * boat.moveDistance);

      var bobY = boat.baseY + Math.sin(boat.moveTime * boat.bobFreq * 2 * Math.PI) * boat.bobAmplitude;

      boat.hull.position.x = newX;
      boat.hull.position.y = bobY;
      boat.engine.position.x = newX;
      boat.engine.position.y = bobY + 6;
    }

    // Update naval gun - tracking motion
    for (var i = 0; i < state.gunEmplacements.length; i++) {
      var gun = state.gunEmplacements[i];
      gun.trackingAngle += 1.5 * delta;
      gun.barrel.rotation.y = gun.trackingAngle;
      var elevationVariation = 0.2 * Math.sin(gun.trackingAngle * 0.5);
      gun.barrel.rotation.z = gun.barrelElevation + elevationVariation;
    }

    // Update cranes - swinging boom motion
    for (var i = 0; i < state.cranes.length; i++) {
      var crane = state.cranes[i];
      crane.swingAngle += crane.swingSpeed * delta;
      var swingOffset = Math.sin(crane.swingAngle) * 0.3;
      crane.boom.rotation.z = swingOffset;
      crane.drum.rotation.y += 1.0 * delta;
    }

    // Update water surface - wave oscillation
    for (var i = 0; i < state.waterSurfaces.length; i++) {
      var water = state.waterSurfaces[i];
      water.time += delta;
      var waveY = water.baseY + Math.sin(water.time * water.waveFreq * 2 * Math.PI) * water.waveAmplitude;
      water.mesh.position.y = waveY;
    }

    // Update fuel barge - rocking motion
    for (var i = 0; i < state.fuelBarges.length; i++) {
      var barge = state.fuelBarges[i];
      barge.time += delta;
      var rockY = barge.baseY + Math.sin(barge.time * barge.rockFreq * 2 * Math.PI) * barge.rockAmplitude;
      barge.hull.position.y = rockY;
    }

    // Update anchor chains - swaying motion
    for (var i = 0; i < state.anchorChains.length; i++) {
      var chain = state.anchorChains[i];
      chain.rotation.z = 0.05 * Math.sin(state.time * 1.5);
    }

    state.time = (state.time || 0) + delta;
  }

  function reset() {
    if (state.scene) {
      var objectsToRemove = [];
      state.scene.traverse(function(obj) {
        if (obj !== state.scene) {
          objectsToRemove.push(obj);
        }
      });

      for (var i = 0; i < objectsToRemove.length; i++) {
        state.scene.remove(objectsToRemove[i]);
      }
    }

    state.lighthouses = [];
    state.patrolBoats = [];
    state.gunEmplacements = [];
    state.cranes = [];
    state.waterSurfaces = [];
    state.fuelBarges = [];
    state.anchorChains = [];
    state.containers = [];
    state.ships = [];
    state.spawnPoints = [];
    state.time = 0;
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
