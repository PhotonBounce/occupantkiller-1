window.OrbitalStation = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var meshes = [];
  var lights = [];
  var spawnPoints = [];
  var stationState = {
    solarRotation: 0,
    warningLightPhase: 0,
    airlockCycle: 0,
    impactorRotation: 0,
    earthRotation: 0,
    ambientPhase: 0,
    solarEnergyScale: 1.0
  };

  function init(sceneParam, cameraParam) {
    scene = sceneParam;
    camera = cameraParam;
    meshes = [];
    lights = [];
    spawnPoints = [];
    stationState = {
      solarRotation: 0,
      warningLightPhase: 0,
      airlockCycle: 0,
      impactorRotation: 0,
      earthRotation: 0,
      ambientPhase: 0,
      solarEnergyScale: 1.0
    };

    // Create star field backdrop
    createStarField();

    // Create central hub module (octagonal body)
    createCentralHub();

    // Create connecting tunnels
    createConnectingTunnels();

    // Create solar panel arrays
    createSolarPanels();

    // Create weapon pod bays
    createWeaponPodBays();

    // Create kinetic impactor storage rack
    createImpactorStorage();

    // Create airlock chambers
    createAirlockChambers();

    // Create radar/comm dish
    createRadarDish();

    // Create observation dome
    createObservationDome();

    // Create emergency escape pod bay
    createEscapePodBay();

    // Create power conduit lines
    createPowerConduits();

    // Create Earth view below
    createEarthView();

    // Setup lighting
    setupLighting();

    // Define spawn points
    defineSpawnPoints();
  }

  function createStarField() {
    var starGeometry = new THREE.SphereGeometry(2000, 64, 64);
    var canvas = document.createElement('canvas');
    canvas.width = 2048;
    canvas.height = 2048;
    var ctx = canvas.getContext('2d');
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#ffffff';
    for (var i = 0; i < 5000; i++) {
      var x = Math.random() * canvas.width;
      var y = Math.random() * canvas.height;
      var size = Math.random() * 2;
      ctx.fillRect(x, y, size, size);
    }
    var texture = new THREE.CanvasTexture(canvas);
    var material = new THREE.MeshBasicMaterial({ map: texture, side: THREE.BackSide });
    var stars = new THREE.Mesh(starGeometry, material);
    scene.add(stars);
    meshes.push(stars);
  }

  function createCentralHub() {
    // Main octagonal hub body using box geometry
    var hubGeometry = new THREE.BoxGeometry(80, 60, 80);
    var hubMaterial = new THREE.MeshPhongMaterial({ color: 0xcccccc });
    var hub = new THREE.Mesh(hubGeometry, hubMaterial);
    hub.position.set(0, 0, 0);
    scene.add(hub);
    meshes.push(hub);

    // Hub window panels
    var windowGeometry = new THREE.BoxGeometry(20, 15, 2);
    var windowMaterial = new THREE.MeshPhongMaterial({ color: 0x4488ff });
    for (var i = 0; i < 4; i++) {
      var angle = (i * Math.PI * 2) / 4;
      var window = new THREE.Mesh(windowGeometry, windowMaterial);
      window.position.set(Math.cos(angle) * 50, 0, Math.sin(angle) * 50);
      window.rotation.y = angle;
      scene.add(window);
      meshes.push(window);
    }

    // Spawn point in central hub
    spawnPoints.push({ position: new THREE.Vector3(0, 10, 0), direction: 0 });
  }

  function createConnectingTunnels() {
    // Tunnel segments connecting hub to outer modules
    for (var i = 0; i < 4; i++) {
      var angle = (i * Math.PI * 2) / 4;
      var tunnelLength = 100;
      var tunnelX = Math.cos(angle) * (40 + tunnelLength / 2);
      var tunnelZ = Math.sin(angle) * (40 + tunnelLength / 2);

      var tunnelGeometry = new THREE.BoxGeometry(20, 20, tunnelLength);
      var tunnelMaterial = new THREE.MeshPhongMaterial({ color: 0xaaaaaa });
      var tunnel = new THREE.Mesh(tunnelGeometry, tunnelMaterial);
      tunnel.position.set(tunnelX, 0, tunnelZ);
      tunnel.rotation.y = angle;
      scene.add(tunnel);
      meshes.push(tunnel);

      // Tunnel reinforcement rings
      for (var j = 0; j < 3; j++) {
        var ringGeometry = new THREE.BoxGeometry(22, 22, 2);
        var ringMaterial = new THREE.MeshPhongMaterial({ color: 0xffaa00 });
        var ring = new THREE.Mesh(ringGeometry, ringMaterial);
        ring.position.set(tunnelX, 0, tunnelZ - tunnelLength / 3 + j * tunnelLength / 3);
        ring.rotation.y = angle;
        scene.add(ring);
        meshes.push(ring);
      }
    }
  }

  function createSolarPanels() {
    // Large flat wing sections
    for (var i = 0; i < 2; i++) {
      var panelArrayGeometry = new THREE.BoxGeometry(200, 10, 150);
      var panelMaterial = new THREE.MeshPhongMaterial({ color: 0xffdd00 });
      var panelArray = new THREE.Mesh(panelArrayGeometry, panelMaterial);
      panelArray.position.set((i === 0 ? -120 : 120), 50, 0);
      panelArray.rotation.z = 0.3;
      scene.add(panelArray);
      meshes.push(panelArray);

      // Individual solar panel segments
      for (var j = 0; j < 8; j++) {
        var segmentGeometry = new THREE.BoxGeometry(20, 8, 18);
        var segmentMaterial = new THREE.MeshPhongMaterial({ color: 0xffee66 });
        var segment = new THREE.Mesh(segmentGeometry, segmentMaterial);
        segment.position.set(
          (i === 0 ? -120 : 120) - 80 + j * 20,
          50,
          0
        );
        segment.rotation.z = 0.3;
        scene.add(segment);
        meshes.push(segment);
      }
    }
  }

  function createWeaponPodBays() {
    // Weapon pod housings (elongated boxes)
    for (var i = 0; i < 6; i++) {
      var angle = (i * Math.PI * 2) / 6;
      var radius = 120;
      var x = Math.cos(angle) * radius;
      var z = Math.sin(angle) * radius;

      var podGeometry = new THREE.BoxGeometry(25, 35, 60);
      var podMaterial = new THREE.MeshPhongMaterial({ color: 0x333333 });
      var pod = new THREE.Mesh(podGeometry, podMaterial);
      pod.position.set(x, -20, z);
      pod.rotation.y = angle;
      scene.add(pod);
      meshes.push(pod);

      // Warning light on pod
      var lightGeometry = new THREE.BoxGeometry(3, 3, 1);
      var lightMaterial = new THREE.MeshPhongMaterial({ color: 0xff0000 });
      var light = new THREE.Mesh(lightGeometry, lightMaterial);
      light.position.set(x + 5, -10, z + 35);
      light.rotation.y = angle;
      scene.add(light);
      meshes.push(light);
    }

    // Spawn point in weapon bay
    spawnPoints.push({ position: new THREE.Vector3(130, -20, 0), direction: Math.PI });
  }

  function createImpactorStorage() {
    // Storage frame (BoxGeometry)
    var frameGeometry = new THREE.BoxGeometry(100, 120, 40);
    var frameMaterial = new THREE.MeshPhongMaterial({ color: 0x666666 });
    var frame = new THREE.Mesh(frameGeometry, frameMaterial);
    frame.position.set(0, -80, -130);
    scene.add(frame);
    meshes.push(frame);

    // Kinetic impactor rods (CylinderGeometry)
    for (var i = 0; i < 5; i++) {
      for (var j = 0; j < 4; j++) {
        var rodGeometry = new THREE.CylinderGeometry(3, 3, 100, 16);
        var rodMaterial = new THREE.MeshPhongMaterial({ color: 0x888888 });
        var rod = new THREE.Mesh(rodGeometry, rodMaterial);
        rod.position.set(
          -30 + i * 15,
          -80,
          -130 - 20 + j * 13
        );
        scene.add(rod);
        meshes.push(rod);
      }
    }

    // Targeting reticle (rotating BoxGeometry)
    var reticleGeometry = new THREE.BoxGeometry(50, 50, 2);
    var reticleMaterial = new THREE.MeshPhongMaterial({ color: 0x00ff00, emissive: 0x00ff00 });
    var reticle = new THREE.Mesh(reticleGeometry, reticleMaterial);
    reticle.position.set(0, -30, -130);
    reticle.name = 'impactorReticle';
    scene.add(reticle);
    meshes.push(reticle);

    // Spawn point in impactor bay
    spawnPoints.push({ position: new THREE.Vector3(0, -40, -100), direction: 0 });
  }

  function createAirlockChambers() {
    // Double-door airlock modules
    for (var i = 0; i < 3; i++) {
      var airlockX = -100 + i * 100;
      var airlockGeometry = new THREE.BoxGeometry(50, 70, 60);
      var airlockMaterial = new THREE.MeshPhongMaterial({ color: 0xbbbbbb });
      var airlock = new THREE.Mesh(airlockGeometry, airlockMaterial);
      airlock.position.set(airlockX, 40, -150);
      scene.add(airlock);
      meshes.push(airlock);

      // Left door
      var doorGeometry = new THREE.BoxGeometry(20, 50, 3);
      var doorMaterial = new THREE.MeshPhongMaterial({ color: 0x444444 });
      var leftDoor = new THREE.Mesh(doorGeometry, doorMaterial);
      leftDoor.position.set(airlockX - 10, 40, -120);
      leftDoor.name = 'airlockDoor';
      scene.add(leftDoor);
      meshes.push(leftDoor);

      // Right door
      var rightDoor = new THREE.Mesh(doorGeometry, doorMaterial);
      rightDoor.position.set(airlockX + 10, 40, -120);
      rightDoor.name = 'airlockDoor';
      scene.add(rightDoor);
      meshes.push(rightDoor);

      // Pressure gauge indicator
      var gaugeGeometry = new THREE.BoxGeometry(8, 8, 1);
      var gaugeMaterial = new THREE.MeshPhongMaterial({ color: 0x00ff00 });
      var gauge = new THREE.Mesh(gaugeGeometry, gaugeMaterial);
      gauge.position.set(airlockX, 60, -145);
      scene.add(gauge);
      meshes.push(gauge);
    }

    // Spawn point in airlock
    spawnPoints.push({ position: new THREE.Vector3(-100, 45, -120), direction: Math.PI / 2 });
  }

  function createRadarDish() {
    // Cylindrical base for dish
    var baseGeometry = new THREE.CylinderGeometry(8, 12, 20, 16);
    var baseMaterial = new THREE.MeshPhongMaterial({ color: 0x444444 });
    var base = new THREE.Mesh(baseGeometry, baseMaterial);
    base.position.set(150, 100, -80);
    scene.add(base);
    meshes.push(base);

    // Dish panels (BoxGeometry arranged in grid)
    for (var i = 0; i < 3; i++) {
      for (var j = 0; j < 3; j++) {
        var panelGeometry = new THREE.BoxGeometry(15, 15, 1);
        var panelMaterial = new THREE.MeshPhongMaterial({ color: 0x555555 });
        var panel = new THREE.Mesh(panelGeometry, panelMaterial);
        panel.position.set(
          150 - 15 + i * 15,
          120 + 15 + j * 15,
          -80
        );
        panel.name = 'radarPanel';
        scene.add(panel);
        meshes.push(panel);
      }
    }
  }

  function createObservationDome() {
    // Glass dome (SphereGeometry)
    var domeGeometry = new THREE.SphereGeometry(40, 32, 32);
    var domeMaterial = new THREE.MeshPhongMaterial({
      color: 0x4488ff,
      emissive: 0x1144ff,
      transparent: true,
      opacity: 0.3
    });
    var dome = new THREE.Mesh(domeGeometry, domeMaterial);
    dome.position.set(-150, 60, 0);
    scene.add(dome);
    meshes.push(dome);

    // Dome frame reinforcement (BoxGeometry bands)
    for (var i = 0; i < 4; i++) {
      var bandGeometry = new THREE.BoxGeometry(80, 3, 3);
      var bandMaterial = new THREE.MeshPhongMaterial({ color: 0xcccccc });
      var band = new THREE.Mesh(bandGeometry, bandMaterial);
      band.position.set(-150, 40 + i * 15, 0);
      band.rotation.z = Math.PI / 4;
      scene.add(band);
      meshes.push(band);
    }

    // Spawn point in observation dome
    spawnPoints.push({ position: new THREE.Vector3(-150, 70, 0), direction: Math.PI * 1.5 });
  }

  function createEscapePodBay() {
    // Escape pods (SphereGeometry)
    for (var i = 0; i < 4; i++) {
      var podGeometry = new THREE.SphereGeometry(15, 16, 16);
      var podMaterial = new THREE.MeshPhongMaterial({ color: 0xff6600 });
      var pod = new THREE.Mesh(podGeometry, podMaterial);
      pod.position.set(
        -50 + (i % 2) * 50,
        -150 + Math.floor(i / 2) * 50,
        150
      );
      scene.add(pod);
      meshes.push(pod);
    }

    // Escape pod bay structure
    var bayGeometry = new THREE.BoxGeometry(150, 120, 100);
    var bayMaterial = new THREE.MeshPhongMaterial({ color: 0x888888 });
    var bay = new THREE.Mesh(bayGeometry, bayMaterial);
    bay.position.set(0, -140, 150);
    scene.add(bay);
    meshes.push(bay);

    // Spawn point in escape pod bay
    spawnPoints.push({ position: new THREE.Vector3(0, -100, 150), direction: Math.PI });
  }

  function createPowerConduits() {
    // Power conduit lines using LineSegments
    var points = [
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(80, 0, 0),
      new THREE.Vector3(80, 60, 0),
      new THREE.Vector3(150, 60, -80),
      new THREE.Vector3(150, 100, -80),
      new THREE.Vector3(0, -50, -130),
      new THREE.Vector3(-150, 60, 0),
      new THREE.Vector3(-100, 40, -150),
      new THREE.Vector3(0, -80, -130)
    ];

    for (var i = 0; i < points.length - 1; i++) {
      var geometry = new THREE.BufferGeometry();
      geometry.setAttribute(
        'position',
        new THREE.BufferAttribute(
          new Float32Array([
            points[i].x, points[i].y, points[i].z,
            points[i + 1].x, points[i + 1].y, points[i + 1].z
          ]),
          3
        )
      );
      var material = new THREE.LineBasicMaterial({ color: 0xffff00, linewidth: 2 });
      var line = new THREE.LineSegments(geometry, material);
      scene.add(line);
      meshes.push(line);
    }
  }

  function createEarthView() {
    // Large Earth sphere far below
    var earthGeometry = new THREE.SphereGeometry(300, 64, 64);
    var canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    var ctx = canvas.getContext('2d');

    // Blue ocean
    ctx.fillStyle = '#1166cc';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Continents
    ctx.fillStyle = '#00aa44';
    ctx.fillRect(100, 150, 150, 100);
    ctx.fillRect(400, 100, 200, 120);
    ctx.fillRect(700, 200, 100, 80);

    // Cloud swirls
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.beginPath();
    ctx.arc(300, 100, 50, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(600, 400, 40, 0, Math.PI * 2);
    ctx.fill();

    var texture = new THREE.CanvasTexture(canvas);
    var material = new THREE.MeshPhongMaterial({ map: texture });
    var earth = new THREE.Mesh(earthGeometry, material);
    earth.position.set(0, -1000, 0);
    earth.name = 'earth';
    scene.add(earth);
    meshes.push(earth);
  }

  function setupLighting() {
    // Ambient light for overall illumination
    var ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    lights.push(ambientLight);

    // Directional light from distant sun
    var sunLight = new THREE.DirectionalLight(0xffffff, 0.8);
    sunLight.position.set(500, 500, 500);
    sunLight.name = 'sunLight';
    scene.add(sunLight);
    lights.push(sunLight);

    // Point light on central hub
    var hubLight = new THREE.PointLight(0xff0000, 0.5, 300);
    hubLight.position.set(0, 0, 0);
    scene.add(hubLight);
    lights.push(hubLight);

    // Point light in observation dome
    var domeLight = new THREE.PointLight(0x4488ff, 0.4, 200);
    domeLight.position.set(-150, 80, 0);
    scene.add(domeLight);
    lights.push(domeLight);
  }

  function defineSpawnPoints() {
    // Spawn points already defined during module creation
    // Total of 5 spawn points across different station modules
  }

  function update(delta) {
    stationState.solarRotation += delta * 0.1;
    stationState.warningLightPhase += delta * 3;
    stationState.airlockCycle += delta;
    stationState.impactorRotation += delta * 0.3;
    stationState.earthRotation += delta * 0.05;
    stationState.ambientPhase += delta * 0.5;
    stationState.solarEnergyScale = 0.7 + 0.3 * Math.sin(stationState.ambientPhase);

    // Rotate solar panels to track sun
    for (var i = 0; i < meshes.length; i++) {
      if (meshes[i].position.y > 40 && meshes[i].position.z === 0) {
        if (Math.abs(meshes[i].position.x) > 100) {
          meshes[i].rotation.z = 0.3 + 0.2 * Math.sin(stationState.solarRotation);
        }
      }
    }

    // Blink warning lights on weapon pods
    for (var i = 0; i < meshes.length; i++) {
      if (meshes[i].name === 'radarPanel') {
        var brightness = 0.5 + 0.5 * Math.sin(stationState.warningLightPhase);
        meshes[i].material.emissive.setHSL(0, 0.5, brightness * 0.3);
      }
    }

    // Airlock door cycling
    var airlockOpenness = Math.sin(stationState.airlockCycle * 0.5) * 0.5 + 0.5;
    for (var i = 0; i < meshes.length; i++) {
      if (meshes[i].name === 'airlockDoor') {
        if (meshes[i].position.x < 0) {
          meshes[i].position.x = -10 - airlockOpenness * 15;
        } else {
          meshes[i].position.x = 10 + airlockOpenness * 15;
        }
      }
    }

    // Impactor targeting system rotation
    for (var i = 0; i < meshes.length; i++) {
      if (meshes[i].name === 'impactorReticle') {
        meshes[i].rotation.z += delta * 0.5;
        var scale = 1.0 + 0.2 * Math.sin(stationState.impactorRotation);
        meshes[i].scale.set(scale, scale, 1);
      }
    }

    // Earth slowly rotating
    for (var i = 0; i < meshes.length; i++) {
      if (meshes[i].name === 'earth') {
        meshes[i].rotation.y = stationState.earthRotation;
      }
    }

    // Station ambient light pulsing
    if (lights.length > 0) {
      lights[0].intensity = 0.4 + 0.3 * Math.sin(stationState.ambientPhase);
    }

    // Solar energy display scaling
    for (var i = 0; i < meshes.length; i++) {
      if (meshes[i].position.y > 40 && (meshes[i].position.x < -100 || meshes[i].position.x > 100)) {
        if (meshes[i].position.z === 0 || (meshes[i].position.z > -5 && meshes[i].position.z < 5)) {
          meshes[i].scale.y = stationState.solarEnergyScale;
        }
      }
    }
  }

  function reset() {
    // Remove all meshes from scene
    for (var i = meshes.length - 1; i >= 0; i--) {
      scene.remove(meshes[i]);
      meshes.pop();
    }

    // Remove all lights from scene
    for (var i = lights.length - 1; i >= 0; i--) {
      scene.remove(lights[i]);
      lights.pop();
    }

    // Clear spawn points
    spawnPoints = [];

    // Reset state
    stationState = {
      solarRotation: 0,
      warningLightPhase: 0,
      airlockCycle: 0,
      impactorRotation: 0,
      earthRotation: 0,
      ambientPhase: 0,
      solarEnergyScale: 1.0
    };
  }

  return {
    init: init,
    update: update,
    reset: reset,
    getSpawnPoints: function() { return spawnPoints; }
  };
}());
