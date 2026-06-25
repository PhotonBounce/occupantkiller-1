window.ThermalPlant = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var turbines = [];
  var steamVents = [];
  var sparkEmitters = [];
  var coolantTanks = [];
  var reliefValves = [];
  var steamClouds = [];
  var turbineRotationSpeed = 0.02;
  var steamBurstTimer = 0;
  var sparkTimer = 0;

  function init(initScene, initCamera) {
    scene = initScene;
    camera = initCamera;
    turbines = [];
    steamVents = [];
    sparkEmitters = [];
    coolantTanks = [];
    reliefValves = [];
    steamClouds = [];

    // Turbine Hall - main structure
    var hallGeometry = new THREE.BoxGeometry(80, 40, 120);
    var hallMaterial = new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.8 });
    var hall = new THREE.Mesh(hallGeometry, hallMaterial);
    hall.position.set(0, 20, 0);
    hall.receiveShadow = true;
    scene.add(hall);

    // Massive turbine rotors (3 units)
    for (var t = 0; t < 3; t++) {
      var turbineRotor = createTurbineRotor(t);
      turbines.push(turbineRotor);
      scene.add(turbineRotor);
    }

    // Steam pipes overhead network
    createSteamPipeNetwork();

    // Heat exchangers (radiator units in rows)
    createHeatExchangers();

    // Control room elevated platform
    createControlRoom();

    // Drill shaft in floor with heat glow
    createDrillShaft();

    // Coolant tanks (spherical pressure vessels)
    for (var c = 0; c < 2; c++) {
      var tank = createCoolantTank(c);
      coolantTanks.push(tank);
      scene.add(tank);
    }

    // Steam vents with emission system
    createSteamVents();

    // Danger zone floor markings
    createDangerZones();

    // Electrical panels with wiring
    createElectricalPanels();

    // Worker platforms and catwalks
    createWorkerPlatforms();

    // Emergency pressure relief system
    createPressureRelief();

    // Ambient lighting
    var ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    var directionalLight = new THREE.DirectionalLight(0xffaa66, 0.8);
    directionalLight.position.set(40, 50, 40);
    scene.add(directionalLight);

    // Heat glow point light from drill shaft
    var heatLight = new THREE.PointLight(0xff6600, 1.5, 100);
    heatLight.position.set(0, 5, 0);
    scene.add(heatLight);
  }

  function createTurbineRotor(index) {
    var group = new THREE.Group();
    var xPos = (index - 1) * 40;

    // Main rotor cylinder (stator housing)
    var statorGeometry = new THREE.CylinderGeometry(15, 15, 35, 16);
    var statorMaterial = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, metalness: 0.9, roughness: 0.3 });
    var stator = new THREE.Mesh(statorGeometry, statorMaterial);
    stator.castShadow = true;
    stator.receiveShadow = true;
    group.add(stator);

    // Spinning rotor blades
    var rotorGroup = new THREE.Group();
    for (var b = 0; b < 4; b++) {
      var bladeGeometry = new THREE.BoxGeometry(4, 12, 28);
      var bladeMaterial = new THREE.MeshStandardMaterial({ color: 0x444444, metalness: 0.8 });
      var blade = new THREE.Mesh(bladeGeometry, bladeMaterial);
      blade.position.z = 0;
      blade.rotation.y = (b / 4) * Math.PI * 2;
      blade.castShadow = true;
      rotorGroup.add(blade);
    }
    rotorGroup.castShadow = true;
    group.add(rotorGroup);
    group.userData.rotorGroup = rotorGroup;

    // Mounting bearings
    var bearingGeometry = new THREE.CylinderGeometry(18, 18, 4, 8);
    var bearingMaterial = new THREE.MeshStandardMaterial({ color: 0x666666 });
    var bearing = new THREE.Mesh(bearingGeometry, bearingMaterial);
    bearing.position.y = 18;
    bearing.castShadow = true;
    group.add(bearing);

    group.position.set(xPos, 15, -30);
    return group;
  }

  function createSteamPipeNetwork() {
    // Main overhead pipe runs
    var pipePositions = [
      { x: -25, z: -20 },
      { x: 0, z: 0 },
      { x: 25, z: 20 }
    ];

    pipePositions.forEach(function(pos) {
      var pipeGeometry = new THREE.CylinderGeometry(3, 3, 80, 8);
      var pipeMaterial = new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.7 });
      var pipe = new THREE.Mesh(pipeGeometry, pipeMaterial);
      pipe.rotation.z = Math.PI / 2;
      pipe.position.set(pos.x, 35, pos.z);
      pipe.castShadow = true;
      scene.add(pipe);

      // Valve wheels (created from LineSegments spokes)
      var valvePositions = [0, 40, 80];
      valvePositions.forEach(function(offset) {
        var wheelGeometry = new THREE.BufferGeometry();
        var wheelVertices = new Float32Array();
        for (var s = 0; s < 8; s++) {
          var angle = (s / 8) * Math.PI * 2;
          wheelVertices = new Float32Array([
            Math.cos(angle) * 3, Math.sin(angle) * 3, 0,
            Math.cos(angle) * 5, Math.sin(angle) * 5, 0
          ]);
        }
        var wheelMaterial = new THREE.LineBasicMaterial({ color: 0xffaa00 });
        var valve = new THREE.LineSegments(wheelGeometry, wheelMaterial);
        valve.position.set(pos.x + offset, 35, pos.z);
        scene.add(valve);
      });
    });
  }

  function createHeatExchangers() {
    // Radiator-style heat exchanger units
    for (var h = 0; h < 4; h++) {
      var exchangerGroup = new THREE.Group();
      var xPos = -30 + h * 20;

      // Main exchanger body
      var bodyGeometry = new THREE.BoxGeometry(12, 25, 8);
      var bodyMaterial = new THREE.MeshStandardMaterial({ color: 0x444444, metalness: 0.6 });
      var body = new THREE.Mesh(bodyGeometry, bodyMaterial);
      body.castShadow = true;
      exchangerGroup.add(body);

      // Cooling fins (thin plates in rows)
      for (var f = 0; f < 15; f++) {
        var finGeometry = new THREE.BoxGeometry(12, 1.5, 0.4);
        var finMaterial = new THREE.MeshStandardMaterial({ color: 0x555555 });
        var fin = new THREE.Mesh(finGeometry, finMaterial);
        fin.position.y = -10 + (f * 1.8);
        fin.castShadow = true;
        exchangerGroup.add(fin);
      }

      exchangerGroup.position.set(xPos, 12, 45);
      scene.add(exchangerGroup);
    }
  }

  function createControlRoom() {
    var roomGroup = new THREE.Group();

    // Main platform
    var platformGeometry = new THREE.BoxGeometry(30, 2, 25);
    var platformMaterial = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.4 });
    var platform = new THREE.Mesh(platformGeometry, platformMaterial);
    platform.position.y = 30;
    platform.castShadow = true;
    roomGroup.add(platform);

    // Support pillars
    for (var p = 0; p < 4; p++) {
      var pillarGeometry = new THREE.CylinderGeometry(2, 2, 30, 6);
      var pillarMaterial = new THREE.MeshStandardMaterial({ color: 0x222222 });
      var pillar = new THREE.Mesh(pillarGeometry, pillarMaterial);
      pillar.position.set(-12 + p * 8, 15, -10 + p * 5);
      pillar.castShadow = true;
      roomGroup.add(pillar);
    }

    // Console panels (instrument dashboards)
    for (var i = 0; i < 3; i++) {
      var consoleGeometry = new THREE.BoxGeometry(8, 12, 2);
      var consoleMaterial = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, emissive: 0x003300 });
      var console = new THREE.Mesh(consoleGeometry, consoleMaterial);
      console.position.set(-8 + i * 8, 38, 12);
      console.castShadow = true;
      roomGroup.add(console);

      // Screen indicators (glowing boxes)
      for (var s = 0; s < 4; s++) {
        var screenGeometry = new THREE.BoxGeometry(1.5, 1.5, 0.2);
        var screenMaterial = new THREE.MeshStandardMaterial({ color: 0x00ff00, emissive: 0x00ff00 });
        var screen = new THREE.Mesh(screenGeometry, screenMaterial);
        screen.position.set(-3 + s * 2, 38 + 3, 12.5);
        roomGroup.add(screen);
      }
    }

    roomGroup.position.set(0, 0, -50);
    scene.add(roomGroup);
  }

  function createDrillShaft() {
    var shaftGroup = new THREE.Group();

    // Main borehole shaft descending
    var shaftGeometry = new THREE.CylinderGeometry(12, 12, 60, 16);
    var shaftMaterial = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.5 });
    var shaft = new THREE.Mesh(shaftGeometry, shaftMaterial);
    shaft.position.y = -30;
    shaft.castShadow = true;
    shaftGroup.add(shaft);

    // Heat ring marker (danger zone)
    var heatRingGeometry = new THREE.CylinderGeometry(13, 13, 0.5, 16);
    var heatRingMaterial = new THREE.MeshStandardMaterial({ color: 0xff3300, emissive: 0xff3300 });
    var heatRing = new THREE.Mesh(heatRingGeometry, heatRingMaterial);
    heatRing.position.y = 1;
    shaftGroup.add(heatRing);

    // Drill bit at bottom
    var bitGeometry = new THREE.ConeGeometry(10, 15, 8);
    var bitMaterial = new THREE.MeshStandardMaterial({ color: 0x666666, metalness: 0.8 });
    var bit = new THREE.Mesh(bitGeometry, bitMaterial);
    bit.position.y = -60;
    bit.castShadow = true;
    shaftGroup.add(bit);

    scene.add(shaftGroup);
  }

  function createCoolantTank(index) {
    var tankGroup = new THREE.Group();
    var xPos = -35 + index * 70;

    // Main spherical tank
    var tankGeometry = new THREE.SphereGeometry(10, 12, 12);
    var tankMaterial = new THREE.MeshStandardMaterial({ color: 0x1a1a4d, metalness: 0.7, roughness: 0.3 });
    var tank = new THREE.Mesh(tankGeometry, tankMaterial);
    tank.castShadow = true;
    tank.receiveShadow = true;
    tankGroup.add(tank);

    // Pressure gauge dial (CylinderGeometry representation)
    var gaugeGeometry = new THREE.CylinderGeometry(2, 2, 0.5, 8);
    var gaugeMaterial = new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.9 });
    var gauge = new THREE.Mesh(gaugeGeometry, gaugeMaterial);
    gauge.position.set(0, 8, 10.5);
    gauge.castShadow = true;
    tankGroup.add(gauge);

    // Pressure indicator needle (LineSegments)
    var needleGeometry = new THREE.BufferGeometry();
    var needleVertices = new Float32Array([0, 0, 0, 2, 2, 0]);
    needleGeometry.setAttribute('position', new THREE.BufferAttribute(needleVertices, 3));
    var needleMaterial = new THREE.LineBasicMaterial({ color: 0xff0000, linewidth: 2 });
    var needle = new THREE.LineSegments(needleGeometry, needleMaterial);
    needle.position.set(0, 8, 10.5);
    tankGroup.add(needle);

    // Support base cylinder
    var baseGeometry = new THREE.CylinderGeometry(12, 12, 2, 8);
    var baseMaterial = new THREE.MeshStandardMaterial({ color: 0x444444 });
    var base = new THREE.Mesh(baseGeometry, baseMaterial);
    base.position.y = -12;
    base.castShadow = true;
    tankGroup.add(base);

    tankGroup.position.set(xPos, 10, 55);
    return tankGroup;
  }

  function createSteamVents() {
    var ventPositions = [
      { x: -20, z: -40 },
      { x: 20, z: -40 },
      { x: -15, z: 20 },
      { x: 15, z: 20 }
    ];

    ventPositions.forEach(function(pos) {
      var ventGroup = new THREE.Group();

      // Vent pipe (CylinderGeometry)
      var ventGeometry = new THREE.CylinderGeometry(4, 4, 20, 8);
      var ventMaterial = new THREE.MeshStandardMaterial({ color: 0x777777, metalness: 0.8 });
      var vent = new THREE.Mesh(ventGeometry, ventMaterial);
      vent.position.y = 10;
      vent.castShadow = true;
      ventGroup.add(vent);

      // Vent opening
      var openingGeometry = new THREE.CylinderGeometry(4, 4, 0.5, 8);
      var openingMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
      var opening = new THREE.Mesh(openingGeometry, openingMaterial);
      opening.position.y = 20;
      ventGroup.add(opening);

      // Steam cloud emitter (will animate)
      var cloudGroup = new THREE.Group();
      for (var cloud = 0; cloud < 3; cloud++) {
        var cloudGeometry = new THREE.SphereGeometry(3, 6, 6);
        var cloudMaterial = new THREE.MeshStandardMaterial({
          color: 0xcccccc,
          transparent: true,
          opacity: 0.4
        });
        var cloudMesh = new THREE.Mesh(cloudGeometry, cloudMaterial);
        cloudMesh.position.y = 25 + cloud * 5;
        cloudMesh.scale.set(0.8, 0.8, 0.8);
        cloudGroup.add(cloudMesh);
      }
      cloudGroup.userData.isCloudGroup = true;
      ventGroup.add(cloudGroup);
      steamClouds.push(cloudGroup);

      ventGroup.position.set(pos.x, 0, pos.z);
      scene.add(ventGroup);
      steamVents.push(ventGroup);
    });
  }

  function createDangerZones() {
    // Red floor markings around hot equipment
    var dangerPositions = [
      { x: 0, z: -30, scale: 3 },
      { x: -35, z: 55, scale: 2.5 },
      { x: 35, z: 55, scale: 2.5 }
    ];

    dangerPositions.forEach(function(pos) {
      var dangerGeometry = new THREE.CylinderGeometry(pos.scale * 8, pos.scale * 8, 0.1, 16);
      var dangerMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000, emissive: 0x660000 });
      var danger = new THREE.Mesh(dangerGeometry, dangerMaterial);
      danger.position.set(pos.x, 0.05, pos.z);
      scene.add(danger);

      // Danger zone stripes (thin boxes)
      for (var stripe = 0; stripe < 8; stripe++) {
        var stripeGeometry = new THREE.BoxGeometry(pos.scale * 2, 0.15, pos.scale * 16);
        var stripeMaterial = new THREE.MeshStandardMaterial({ color: 0xffff00, emissive: 0x666600 });
        var stripeBox = new THREE.Mesh(stripeGeometry, stripeMaterial);
        stripeBox.position.set(pos.x, 0.1, pos.z);
        stripeBox.rotation.y = (stripe / 8) * Math.PI;
        scene.add(stripeBox);
      }
    });
  }

  function createElectricalPanels() {
    var panelPositions = [
      { x: -35, z: 10 },
      { x: 35, z: 10 },
      { x: 0, z: -60 }
    ];

    panelPositions.forEach(function(pos) {
      var panelGroup = new THREE.Group();

      // Main cabinet box
      var cabinetGeometry = new THREE.BoxGeometry(6, 15, 3);
      var cabinetMaterial = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, metalness: 0.8 });
      var cabinet = new THREE.Mesh(cabinetGeometry, cabinetMaterial);
      cabinet.castShadow = true;
      panelGroup.add(cabinet);

      // Circuit breakers (small boxes)
      for (var breaker = 0; breaker < 9; breaker++) {
        var breakerGeometry = new THREE.BoxGeometry(1.2, 1, 0.5);
        var breakerMaterial = new THREE.MeshStandardMaterial({ color: 0xcccccc });
        var breakerBox = new THREE.Mesh(breakerGeometry, breakerMaterial);
        breakerBox.position.set(-1.5 + (breaker % 3) * 1.5, 4 - Math.floor(breaker / 3) * 1.5, 1.6);
        panelGroup.add(breakerBox);
      }

      // Electrical wiring (LineSegments)
      var wiringGeometry = new THREE.BufferGeometry();
      var wiringVertices = new Float32Array();
      for (var wire = 0; wire < 6; wire++) {
        var wireStart = -2 + wire * 1;
        wiringVertices = new Float32Array([
          wireStart, 5, -1.5,
          wireStart, -5, -1.5
        ]);
      }
      var wiringMaterial = new THREE.LineBasicMaterial({ color: 0x00ff00, linewidth: 1 });
      var wiring = new THREE.LineSegments(wiringGeometry, wiringMaterial);
      panelGroup.add(wiring);

      panelGroup.position.set(pos.x, 7, pos.z);
      scene.add(panelGroup);

      // Spark emitter at this location
      sparkEmitters.push({
        group: panelGroup,
        position: new THREE.Vector3(pos.x, 7, pos.z),
        active: false
      });
    });
  }

  function createWorkerPlatforms() {
    // Elevated catwalks and work platforms
    var platformData = [
      { x: -30, y: 25, z: 0, width: 40 },
      { x: 30, y: 25, z: 0, width: 40 },
      { x: 0, y: 20, z: 40, width: 30 }
    ];

    platformData.forEach(function(data) {
      var walkGroup = new THREE.Group();

      // Main walkway
      var walkGeometry = new THREE.BoxGeometry(data.width, 1, 3);
      var walkMaterial = new THREE.MeshStandardMaterial({ color: 0x444444, metalness: 0.5 });
      var walk = new THREE.Mesh(walkGeometry, walkMaterial);
      walk.castShadow = true;
      walkGroup.add(walk);

      // Safety railings (LineSegments posts and wires)
      var railGeometry = new THREE.BufferGeometry();
      var railVertices = new Float32Array();
      for (var rail = 0; rail < 8; rail++) {
        var railX = -data.width / 2 + (rail * data.width / 7);
        railVertices = new Float32Array([
          railX, 0, -1.5,
          railX, 1.2, -1.5,
          railX, 0, 1.5,
          railX, 1.2, 1.5
        ]);
      }
      var railMaterial = new THREE.LineBasicMaterial({ color: 0x999999, linewidth: 1 });
      var rails = new THREE.LineSegments(railGeometry, railMaterial);
      walkGroup.add(rails);

      walkGroup.position.set(data.x, data.y, data.z);
      scene.add(walkGroup);
    });
  }

  function createPressureRelief() {
    // Emergency pressure relief system
    var reliefGroup = new THREE.Group();

    // Relief valve outlet pipe
    var outletGeometry = new THREE.CylinderGeometry(5, 5, 12, 8);
    var outletMaterial = new THREE.MeshStandardMaterial({ color: 0x999999, metalness: 0.7 });
    var outlet = new THREE.Mesh(outletGeometry, outletMaterial);
    outlet.rotation.z = Math.PI / 4;
    outlet.position.set(0, 12, 0);
    outlet.castShadow = true;
    reliefGroup.add(outlet);

    // Valve wheel
    var wheelGeometry = new THREE.CylinderGeometry(4, 4, 2, 8);
    var wheelMaterial = new THREE.MeshStandardMaterial({ color: 0xffaa00, metalness: 0.8 });
    var wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
    wheel.rotation.y = Math.PI / 4;
    wheel.position.set(0, 15, 0);
    wheel.castShadow = true;
    reliefGroup.add(wheel);

    // Pressure accumulator sphere
    var accumulatorGeometry = new THREE.SphereGeometry(6, 8, 8);
    var accumulatorMaterial = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.6 });
    var accumulator = new THREE.Mesh(accumulatorGeometry, accumulatorMaterial);
    accumulator.position.set(0, 5, 0);
    accumulator.castShadow = true;
    reliefGroup.add(accumulator);

    reliefGroup.position.set(0, 8, -70);
    scene.add(reliefGroup);
    reliefValves.push(reliefGroup);
  }

  function update(delta) {
    // Turbine spin animation
    turbines.forEach(function(turbine) {
      var rotorGroup = turbine.userData.rotorGroup;
      if (rotorGroup) {
        rotorGroup.rotation.z += turbineRotationSpeed;
      }
    });

    // Steam burst and cloud animation
    steamBurstTimer += delta;
    if (steamBurstTimer > 2) {
      steamBurstTimer = 0;
      steamClouds.forEach(function(cloudGroup) {
        cloudGroup.children.forEach(function(cloud, index) {
          cloud.position.y += Math.random() * 8;
          cloud.scale.x += delta * 0.5;
          cloud.scale.y += delta * 0.5;
          cloud.scale.z += delta * 0.5;
          if (cloud.material.opacity) {
            cloud.material.opacity -= delta * 0.3;
          }
        });
      });
    }

    // Spark emitter random bursts
    sparkTimer += delta;
    if (sparkTimer > 1.5) {
      sparkTimer = 0;
      sparkEmitters.forEach(function(emitter) {
        if (Math.random() > 0.6) {
          emitter.active = true;
          var sparkLife = 0;
          for (var spark = 0; spark < 5; spark++) {
            var sparkGeometry = new THREE.BoxGeometry(0.3, 0.3, 0.3);
            var sparkMaterial = new THREE.MeshStandardMaterial({ color: 0xffff00, emissive: 0xffaa00 });
            var sparkBox = new THREE.Mesh(sparkGeometry, sparkMaterial);
            sparkBox.position.copy(emitter.position);
            sparkBox.position.x += (Math.random() - 0.5) * 3;
            sparkBox.position.y += Math.random() * 2;
            sparkBox.position.z += (Math.random() - 0.5) * 3;
            scene.add(sparkBox);

            var sparkVelocity = {
              x: (Math.random() - 0.5) * 15,
              y: Math.random() * 10,
              z: (Math.random() - 0.5) * 15
            };

            setTimeout(function() {
              scene.remove(sparkBox);
            }, 500);
          }
        }
      });
    }

    // Coolant tank pump oscillation
    coolantTanks.forEach(function(tank, index) {
      var oscillation = Math.sin(Date.now() * 0.003 + index) * 0.4;
      tank.position.y = 10 + oscillation;
    });

    // Relief valve periodic animation
    reliefValves.forEach(function(relief) {
      var wobble = Math.sin(Date.now() * 0.002) * 2;
      relief.rotation.x = wobble * 0.05;
    });
  }

  function reset() {
    turbines = [];
    steamVents = [];
    sparkEmitters = [];
    coolantTanks = [];
    reliefValves = [];
    steamClouds = [];
    steamBurstTimer = 0;
    sparkTimer = 0;

    if (scene) {
      var objectsToRemove = [];
      scene.traverse(function(child) {
        if (child.geometry) {
          objectsToRemove.push(child);
        }
      });
      objectsToRemove.forEach(function(obj) {
        scene.remove(obj);
        if (obj.geometry) {
          obj.geometry.dispose();
        }
        if (obj.material) {
          if (Array.isArray(obj.material)) {
            obj.material.forEach(function(mat) { mat.dispose(); });
          } else {
            obj.material.dispose();
          }
        }
      });
    }
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
