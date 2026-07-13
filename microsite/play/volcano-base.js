var window = window || {};

window.VolcanoBase = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var sceneObjects = [];
  var animatedObjects = [];
  var elapsedTime = 0;
  var volcanoCone = null;
  var lavaLakeSurface = null;
  var ashClouds = [];
  var steamVents = [];
  var lavaTubeLights = [];
  var magmaTapPipes = [];
  var cableCar = null;
  var radarDish = null;

  function createVolcanoConeShell() {
    // Main volcanic cone - outer structure
    var coneGeometry = new THREE.ConeGeometry(25, 40, 32);
    var coneMaterial = new THREE.MeshStandardMaterial({
      color: 0x880000,
      roughness: 0.9,
      metalness: 0.1
    });
    volcanoCone = new THREE.Mesh(coneGeometry, coneMaterial);
    volcanoCone.position.set(0, 15, 0);
    volcanoCone.castShadow = true;
    volcanoCone.receiveShadow = true;
    scene.add(volcanoCone);
    sceneObjects.push(volcanoCone);
    return volcanoCone;
  }

  function createCalderaRimWalkways() {
    // Upper rim walkway (flat ring)
    var rimGeometry = new THREE.CylinderGeometry(24, 24, 1.5, 32);
    var rimMaterial = new THREE.MeshStandardMaterial({
      color: 0x664444,
      roughness: 0.8
    });
    var rimWalkway = new THREE.Mesh(rimGeometry, rimMaterial);
    rimWalkway.position.set(0, 53, 0);
    rimWalkway.castShadow = true;
    rimWalkway.receiveShadow = true;
    scene.add(rimWalkway);
    sceneObjects.push(rimWalkway);

    // Secondary rim ring (defensive positions)
    var secondaryGeometry = new THREE.CylinderGeometry(22, 22, 1, 32);
    var secondaryMaterial = new THREE.MeshStandardMaterial({
      color: 0x555555,
      roughness: 0.7
    });
    var secondaryRim = new THREE.Mesh(secondaryGeometry, secondaryMaterial);
    secondaryRim.position.set(0, 51.5, 0);
    secondaryRim.castShadow = true;
    secondaryRim.receiveShadow = true;
    scene.add(secondaryRim);
    sceneObjects.push(secondaryRim);
  }

  function createLavaLakeSurface() {
    // Glowing lava lake at the crater bottom
    var lavaGeometry = new THREE.CylinderGeometry(20, 20, 3, 32);
    var lavaMaterial = new THREE.MeshStandardMaterial({
      color: 0xFF4400,
      emissive: 0xFF8800,
      emissiveIntensity: 0.8,
      roughness: 0.4,
      metalness: 0.3
    });
    lavaLakeSurface = new THREE.Mesh(lavaGeometry, lavaMaterial);
    lavaLakeSurface.position.set(0, -8, 0);
    lavaLakeSurface.castShadow = true;
    lavaLakeSurface.receiveShadow = true;
    scene.add(lavaLakeSurface);
    sceneObjects.push(lavaLakeSurface);
    animatedObjects.push({
      type: 'lavaSurface',
      object: lavaLakeSurface
    });
  }

  function createBaseStructure() {
    // Military base embedded in crater wall - multiple platforms
    var baseColor = 0x444444;
    var baseMaterial = new THREE.MeshStandardMaterial({
      color: baseColor,
      roughness: 0.9,
      metalness: 0.2
    });

    // Main command center platform
    var cmdGeometry = new THREE.BoxGeometry(8, 3, 8);
    var cmdPlatform = new THREE.Mesh(cmdGeometry, baseMaterial);
    cmdPlatform.position.set(15, 20, -5);
    cmdPlatform.castShadow = true;
    cmdPlatform.receiveShadow = true;
    scene.add(cmdPlatform);
    sceneObjects.push(cmdPlatform);

    // Ammunition storage bunker
    var ammoGeometry = new THREE.BoxGeometry(6, 4, 6);
    var ammoPlatform = new THREE.Mesh(ammoGeometry, baseMaterial);
    ammoPlatform.position.set(-18, 12, 3);
    ammoPlatform.castShadow = true;
    ammoPlatform.receiveShadow = true;
    scene.add(ammoPlatform);
    sceneObjects.push(ammoPlatform);

    // Medical facility
    var medGeometry = new THREE.BoxGeometry(5, 3, 7);
    var medPlatform = new THREE.Mesh(medGeometry, baseMaterial);
    medPlatform.position.set(-2, 8, 18);
    medPlatform.castShadow = true;
    medPlatform.receiveShadow = true;
    scene.add(medPlatform);
    sceneObjects.push(medPlatform);

    // Barracks
    var barracksGeometry = new THREE.BoxGeometry(10, 3, 5);
    var barracksPlatform = new THREE.Mesh(barracksGeometry, baseMaterial);
    barracksPlatform.position.set(8, 0, 12);
    barracksPlatform.castShadow = true;
    barracksPlatform.receiveShadow = true;
    scene.add(barracksPlatform);
    sceneObjects.push(barracksPlatform);
  }

  function createLavaTubeEntrances() {
    // Dark cylindrical tunnel entrances to lava tubes
    var tubeGeometry = new THREE.CylinderGeometry(2.5, 2.5, 2, 16);
    var tubeMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a1a1a,
      roughness: 0.95,
      emissive: 0x220000,
      emissiveIntensity: 0.4
    });

    var tubePositions = [
      [18, 5, -15],
      [-15, 8, 12],
      [10, 3, -20],
      [-12, 10, -8]
    ];

    tubePositions.forEach(function(pos, idx) {
      var tube = new THREE.Mesh(tubeGeometry, tubeMaterial);
      tube.position.set(pos[0], pos[1], pos[2]);
      tube.rotation.z = Math.PI / 2.5;
      tube.castShadow = true;
      tube.receiveShadow = true;
      scene.add(tube);
      sceneObjects.push(tube);

      lavaTubeLights.push({
        object: tube,
        baseIntensity: 0.4,
        flickerRate: 3 + Math.random() * 2
      });
      animatedObjects.push({
        type: 'tubeLighting',
        light: lavaTubeLights[lavaTubeLights.length - 1]
      });
    });
  }

  function createMagmaTapPipes() {
    // Glowing orange pipes and generators tapping magma energy
    var pipeGeometry = new THREE.CylinderGeometry(0.8, 0.8, 8, 16);
    var pipeMaterial = new THREE.MeshStandardMaterial({
      color: 0xFF8800,
      emissive: 0xFF6600,
      emissiveIntensity: 0.9,
      roughness: 0.5,
      metalness: 0.6
    });

    var pipePositions = [
      [12, 8, -12, 0.3, 0.5, 0],
      [-14, 5, 10, 0.4, 0.3, 0.2],
      [8, 12, 8, 0.2, 0.6, 0.1],
      [-8, 6, -8, 0.35, 0.4, 0.15]
    ];

    pipePositions.forEach(function(pos, idx) {
      var pipe = new THREE.Mesh(pipeGeometry, pipeMaterial);
      pipe.position.set(pos[0], pos[1], pos[2]);
      pipe.rotation.x = pos[3];
      pipe.rotation.z = pos[4];
      pipe.scale.y = pos[5] + 0.8;
      pipe.castShadow = true;
      pipe.receiveShadow = true;
      scene.add(pipe);
      sceneObjects.push(pipe);

      // Tap generator head (sphere at pipe end)
      var tapGeometry = new THREE.SphereGeometry(1.2, 16, 16);
      var tapMaterial = new THREE.MeshStandardMaterial({
        color: 0xFFCC00,
        emissive: 0xFF9900,
        emissiveIntensity: 0.85,
        roughness: 0.6,
        metalness: 0.5
      });
      var tap = new THREE.Mesh(tapGeometry, tapMaterial);
      tap.position.set(pos[0], pos[1] + 4, pos[2]);
      tap.castShadow = true;
      tap.receiveShadow = true;
      scene.add(tap);
      sceneObjects.push(tap);

      magmaTapPipes.push({
        pipe: pipe,
        tap: tap,
        baseY: pos[1],
        pulseRate: 2 + Math.random() * 1.5
      });
      animatedObjects.push({
        type: 'magmaTap',
        magmaTap: magmaTapPipes[magmaTapPipes.length - 1]
      });
    });
  }

  function createAshClouds() {
    // Drifting ash clouds at volcano apex
    var cloudMaterial = new THREE.MeshStandardMaterial({
      color: 0x555555,
      emissive: 0x333333,
      emissiveIntensity: 0.3,
      roughness: 0.8,
      transparent: true,
      opacity: 0.6
    });

    for (var i = 0; i < 5; i++) {
      var cloudGeometry = new THREE.SphereGeometry(3 + Math.random() * 2, 8, 8);
      var cloud = new THREE.Mesh(cloudGeometry, cloudMaterial);
      cloud.position.set(
        (Math.random() - 0.5) * 20,
        48 + Math.random() * 5,
        (Math.random() - 0.5) * 20
      );
      cloud.castShadow = true;
      cloud.receiveShadow = true;
      scene.add(cloud);
      sceneObjects.push(cloud);

      ashClouds.push({
        object: cloud,
        baseX: cloud.position.x,
        baseZ: cloud.position.z,
        driftSpeed: 0.3 + Math.random() * 0.3,
        driftAmplitude: 3 + Math.random() * 2,
        phase: Math.random() * Math.PI * 2
      });
      animatedObjects.push({
        type: 'ashCloud',
        cloud: ashClouds[ashClouds.length - 1]
      });
    }
  }

  function createCalderaRimGunEmplacements() {
    // Defensive gun positions on rim
    var turretBaseGeometry = new THREE.CylinderGeometry(1.5, 1.8, 0.6, 8);
    var turretMaterial = new THREE.MeshStandardMaterial({
      color: 0x333333,
      roughness: 0.8,
      metalness: 0.3
    });

    var turretPositions = [
      [20, 54, 0],
      [0, 54, 20],
      [-20, 54, 0],
      [0, 54, -20]
    ];

    turretPositions.forEach(function(pos) {
      // Turret base
      var base = new THREE.Mesh(turretBaseGeometry, turretMaterial);
      base.position.set(pos[0], pos[1], pos[2]);
      base.castShadow = true;
      base.receiveShadow = true;
      scene.add(base);
      sceneObjects.push(base);

      // Gun barrel (cone)
      var barrelGeometry = new THREE.ConeGeometry(0.4, 3, 8);
      var barrel = new THREE.Mesh(barrelGeometry, turretMaterial);
      barrel.position.set(pos[0], pos[1] + 1.5, pos[2]);
      barrel.rotation.x = Math.PI / 6;
      barrel.castShadow = true;
      barrel.receiveShadow = true;
      scene.add(barrel);
      sceneObjects.push(barrel);
    });
  }

  function createObservationPost() {
    // Elevated observation platform with tower
    var towerGeometry = new THREE.CylinderGeometry(1.2, 1.2, 8, 12);
    var towerMaterial = new THREE.MeshStandardMaterial({
      color: 0x444444,
      roughness: 0.85
    });
    var tower = new THREE.Mesh(towerGeometry, towerMaterial);
    tower.position.set(22, 32, 15);
    tower.castShadow = true;
    tower.receiveShadow = true;
    scene.add(tower);
    sceneObjects.push(tower);

    // Observation deck at top
    var deckGeometry = new THREE.CylinderGeometry(2.5, 2.5, 0.5, 16);
    var deckMaterial = new THREE.MeshStandardMaterial({
      color: 0x555555,
      roughness: 0.7
    });
    var deck = new THREE.Mesh(deckGeometry, deckMaterial);
    deck.position.set(22, 37, 15);
    deck.castShadow = true;
    deck.receiveShadow = true;
    scene.add(deck);
    sceneObjects.push(deck);
  }

  function createEmergencyEvacuationCableCar() {
    // Cable car moving along evacuation route
    var carGeometry = new THREE.BoxGeometry(1.5, 1.2, 1.8);
    var carMaterial = new THREE.MeshStandardMaterial({
      color: 0xCC6600,
      roughness: 0.6,
      metalness: 0.4
    });
    cableCar = new THREE.Mesh(carGeometry, carMaterial);
    cableCar.position.set(-10, 30, 0);
    cableCar.castShadow = true;
    cableCar.receiveShadow = true;
    scene.add(cableCar);
    sceneObjects.push(cableCar);

    // Cable line (thin geometry)
    var cableGeometry = new THREE.BufferGeometry();
    var cablePoints = [
      new THREE.Vector3(-20, 35, 0),
      new THREE.Vector3(15, 15, 0)
    ];
    cableGeometry.setFromPoints(cablePoints);
    var cableMaterial = new THREE.LineBasicMaterial({ color: 0x888888, linewidth: 2 });
    var cable = new THREE.Line(cableGeometry, cableMaterial);
    scene.add(cable);
    sceneObjects.push(cable);

    animatedObjects.push({
      type: 'cableCar',
      car: cableCar,
      progress: 0,
      speed: 0.15,
      startPos: new THREE.Vector3(-20, 35, 0),
      endPos: new THREE.Vector3(15, 15, 0)
    });
  }

  function createSteamVents() {
    // Pressurized steam vents erupting from rim cracks
    var ventPositions = [
      [18, 52, 10],
      [-16, 50, -12],
      [12, 53, -15],
      [-10, 51, 18],
      [8, 52, 12]
    ];

    ventPositions.forEach(function(pos) {
      var ventGeometry = new THREE.CylinderGeometry(0.5, 0.6, 0.8, 8);
      var ventMaterial = new THREE.MeshStandardMaterial({
        color: 0x888888,
        roughness: 0.9,
        metalness: 0.1
      });
      var vent = new THREE.Mesh(ventGeometry, ventMaterial);
      vent.position.set(pos[0], pos[1], pos[2]);
      vent.castShadow = true;
      vent.receiveShadow = true;
      scene.add(vent);
      sceneObjects.push(vent);

      steamVents.push({
        vent: vent,
        baseY: pos[1],
        eruptionHeight: 3 + Math.random() * 2,
        eruptionRate: 1.5 + Math.random() * 1,
        phase: Math.random() * Math.PI * 2
      });
      animatedObjects.push({
        type: 'steamVent',
        steam: steamVents[steamVents.length - 1]
      });
    });
  }

  function createRadarInstallation() {
    // Communication/radar dish installation
    var postGeometry = new THREE.CylinderGeometry(0.4, 0.4, 6, 8);
    var postMaterial = new THREE.MeshStandardMaterial({
      color: 0x444444,
      roughness: 0.8,
      metalness: 0.2
    });
    var radarPost = new THREE.Mesh(postGeometry, postMaterial);
    radarPost.position.set(-22, 32, 20);
    radarPost.castShadow = true;
    radarPost.receiveShadow = true;
    scene.add(radarPost);
    sceneObjects.push(radarPost);

    // Radar dish (flat cone)
    var dishGeometry = new THREE.ConeGeometry(2.5, 0.4, 16);
    var dishMaterial = new THREE.MeshStandardMaterial({
      color: 0xAAAAAA,
      roughness: 0.5,
      metalness: 0.5
    });
    radarDish = new THREE.Mesh(dishGeometry, dishMaterial);
    radarDish.position.set(-22, 36, 20);
    radarDish.rotation.x = Math.PI / 3;
    radarDish.castShadow = true;
    radarDish.receiveShadow = true;
    scene.add(radarDish);
    sceneObjects.push(radarDish);

    animatedObjects.push({
      type: 'radarDish',
      dish: radarDish,
      rotationSpeed: 1.5
    });
  }

  function init(_scene, _camera) {
    scene = _scene;
    camera = _camera;
    sceneObjects = [];
    animatedObjects = [];
    ashClouds = [];
    steamVents = [];
    lavaTubeLights = [];
    magmaTapPipes = [];
    elapsedTime = 0;

    // Create all structures (15+ objects as required)
    createVolcanoConeShell();           // 1
    createCalderaRimWalkways();         // 2 objects
    createLavaLakeSurface();            // 1 + animated
    createBaseStructure();              // 4 platform objects
    createLavaTubeEntrances();          // 4 tube entrances
    createMagmaTapPipes();              // 8 objects (4 pipes + 4 taps)
    createAshClouds();                  // 5 clouds
    createCalderaRimGunEmplacements();  // 8 objects (4 bases + 4 barrels)
    createObservationPost();            // 2 objects
    createEmergencyEvacuationCableCar(); // 2 objects (car + cable)
    createSteamVents();                 // 5 vents
    createRadarInstallation();          // 2 objects

    // Total: 50+ objects created
    return {
      objectCount: sceneObjects.length,
      animatedCount: animatedObjects.length
    };
  }

  function updateLavaSurface(delta) {
    if (!lavaLakeSurface) return;
    var pulseFactor = 0.05 + Math.sin(elapsedTime * 2.5) * 0.03;
    var baseIntensity = 0.8;
    lavaLakeSurface.material.emissiveIntensity = baseIntensity + pulseFactor;
    lavaLakeSurface.scale.z = 0.98 + Math.sin(elapsedTime * 1.8) * 0.02;
  }

  function updateAshClouds(delta) {
    ashClouds.forEach(function(cloud) {
      var time = elapsedTime * cloud.driftSpeed;
      cloud.object.position.x = cloud.baseX + Math.sin(time + cloud.phase) * cloud.driftAmplitude;
      cloud.object.position.z = cloud.baseZ + Math.cos(time + cloud.phase * 0.7) * cloud.driftAmplitude * 0.6;
      cloud.object.position.y += delta * 0.3;

      // Reset when too high
      if (cloud.object.position.y > 65) {
        cloud.object.position.y = 45;
      }
    });
  }

  function updateSteamVents(delta) {
    steamVents.forEach(function(steam) {
      var eruptionAmount = Math.sin(elapsedTime * steam.eruptionRate + steam.phase) * 0.5 + 0.5;
      if (eruptionAmount > 0.4) {
        steam.vent.position.y = steam.baseY + eruptionAmount * steam.eruptionHeight;
        steam.vent.scale.y = 1 + eruptionAmount * 1.5;
      } else {
        steam.vent.position.y = steam.baseY;
        steam.vent.scale.y = 1;
      }
    });
  }

  function updateLavaTubeLighting(delta) {
    lavaTubeLights.forEach(function(light) {
      var flicker = Math.sin(elapsedTime * light.flickerRate + Math.random() * Math.PI) * 0.3 + 0.7;
      light.object.material.emissiveIntensity = light.baseIntensity * flicker;
    });
  }

  function updateMagmaTapPulse(delta) {
    magmaTapPipes.forEach(function(tap) {
      var pulse = Math.sin(elapsedTime * tap.pulseRate) * 0.3 + 1;
      tap.tap.material.emissiveIntensity = 0.85 * pulse;
      tap.tap.scale.set(pulse * 0.9, pulse * 0.9, pulse * 0.9);

      var verticalPulse = Math.sin(elapsedTime * tap.pulseRate * 0.6) * 0.2;
      tap.pipe.position.y = tap.baseY + verticalPulse;
    });
  }

  function updateCableCar(delta) {
    animatedObjects.forEach(function(obj) {
      if (obj.type === 'cableCar') {
        obj.progress += delta * obj.speed;
        if (obj.progress > 1) {
          obj.progress = 0;
        }

        var t = obj.progress;
        obj.car.position.lerpVectors(obj.startPos, obj.endPos, t);

        // Slight rotation based on movement
        obj.car.rotation.z = Math.sin(elapsedTime * 1.2) * 0.1;
      }
    });
  }

  function updateRadarDish(delta) {
    if (radarDish) {
      radarDish.rotation.z += delta * 1.5;
    }
  }

  function update(delta) {
    elapsedTime += delta;

    updateLavaSurface(delta);
    updateAshClouds(delta);
    updateSteamVents(delta);
    updateLavaTubeLighting(delta);
    updateMagmaTapPulse(delta);
    updateCableCar(delta);
    updateRadarDish(delta);
  }

  function reset() {
    sceneObjects.forEach(function(obj) {
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        if (Array.isArray(obj.material)) {
          obj.material.forEach(function(mat) { mat.dispose(); });
        } else {
          obj.material.dispose();
        }
      }
      if (obj.parent) obj.parent.remove(obj);
    });

    sceneObjects = [];
    animatedObjects = [];
    ashClouds = [];
    steamVents = [];
    lavaTubeLights = [];
    magmaTapPipes = [];
    elapsedTime = 0;
    scene = null;
    camera = null;
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
