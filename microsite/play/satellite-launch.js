window.SatelliteLaunch = (function() {
  'use strict';

  var launchPadGroup = null;
  var rocketGroup = null;
  var engineFlameGroup = null;
  var radarDish = null;
  var countdownDisplay = null;
  var countdownValue = 300;
  var engineGlowIntensity = 0;
  var isIgniting = false;
  var ignitionTimer = 0;
  var radarRotation = 0;
  var steamParticles = [];
  var waterVaporClouds = [];

  function init(scene, camera) {
    launchPadGroup = new THREE.Group();
    scene.add(launchPadGroup);

    // Launch pad massive concrete platform (blast-resistant)
    var padGeometry = new THREE.BoxGeometry(120, 8, 100);
    var padMaterial = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.8, metalness: 0.1 });
    var launchPad = new THREE.Mesh(padGeometry, padMaterial);
    launchPad.position.set(0, 4, 0);
    launchPad.castShadow = true;
    launchPad.receiveShadow = true;
    launchPadGroup.add(launchPad);

    // Flame trench - deep recessed channel for exhaust deflection
    var trenchGeometry = new THREE.BoxGeometry(35, 18, 60);
    var trenchMaterial = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.9, metalness: 0.2 });
    var flametrench = new THREE.Mesh(trenchGeometry, trenchMaterial);
    flametrench.position.set(0, -10, 25);
    flametrench.castShadow = true;
    flametrench.receiveShadow = true;
    launchPadGroup.add(flametrench);

    // Rocket assembly on pad
    rocketGroup = new THREE.Group();
    rocketGroup.position.set(0, 12, 0);
    launchPadGroup.add(rocketGroup);

    // Main rocket body (CylinderGeometry)
    var bodyGeometry = new THREE.CylinderGeometry(3.5, 3.5, 50, 32);
    var bodyMaterial = new THREE.MeshStandardMaterial({ color: 0xff6600, roughness: 0.3, metalness: 0.6 });
    var rocketBody = new THREE.Mesh(bodyGeometry, bodyMaterial);
    rocketBody.position.z = 0;
    rocketBody.castShadow = true;
    rocketBody.receiveShadow = true;
    rocketGroup.add(rocketBody);

    // Nose fairing (ConeGeometry)
    var noseGeometry = new THREE.ConeGeometry(3.5, 18, 32);
    var noseMaterial = new THREE.MeshStandardMaterial({ color: 0xff3300, roughness: 0.4, metalness: 0.5 });
    var noseFairing = new THREE.Mesh(noseGeometry, noseMaterial);
    noseFairing.position.y = 34;
    noseFairing.castShadow = true;
    noseFairing.receiveShadow = true;
    rocketGroup.add(noseFairing);

    // Rocket fins (BoxGeometry)
    var finGeometry = new THREE.BoxGeometry(1.5, 12, 8);
    var finMaterial = new THREE.MeshStandardMaterial({ color: 0xcccccc, roughness: 0.6, metalness: 0.4 });
    for (var i = 0; i < 4; i++) {
      var fin = new THREE.Mesh(finGeometry, finMaterial);
      fin.position.y = -18;
      fin.rotation.z = (Math.PI / 2) * i;
      fin.castShadow = true;
      fin.receiveShadow = true;
      rocketGroup.add(fin);
    }

    // Engine nozzle cluster at base (CylinderGeometry)
    engineFlameGroup = new THREE.Group();
    engineFlameGroup.position.y = -28;
    rocketGroup.add(engineFlameGroup);

    for (var j = 0; j < 4; j++) {
      var nozzleGeometry = new THREE.CylinderGeometry(1.2, 1.5, 4, 16);
      var nozzleMaterial = new THREE.MeshStandardMaterial({ color: 0x444444, roughness: 0.7, metalness: 0.8 });
      var nozzle = new THREE.Mesh(nozzleGeometry, nozzleMaterial);
      var angle = (Math.PI / 2) * j;
      nozzle.position.x = 2.5 * Math.cos(angle);
      nozzle.position.z = 2.5 * Math.sin(angle);
      nozzle.castShadow = true;
      nozzle.receiveShadow = true;
      engineFlameGroup.add(nozzle);
    }

    // Engine pre-ignition glow sphere (hidden until ignition)
    var glowGeometry = new THREE.SphereGeometry(4, 16, 16);
    var glowMaterial = new THREE.MeshStandardMaterial({
      color: 0xff6600,
      emissive: 0xff3300,
      emissiveIntensity: 0,
      roughness: 0.4,
      metalness: 0.3
    });
    var engineGlow = new THREE.Mesh(glowGeometry, glowMaterial);
    engineGlow.position.copy(engineFlameGroup.getWorldPosition(new THREE.Vector3()));
    engineGlow.position.y = -28 + 12;
    engineFlameGroup.add(engineGlow);

    // Mobile service tower/gantry (BoxGeometry lattice)
    var towerGroup = new THREE.Group();
    towerGroup.position.set(-45, 0, 0);
    launchPadGroup.add(towerGroup);

    // Tower main frame
    var verticalGeometry = new THREE.BoxGeometry(8, 80, 8);
    var steelMaterial = new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 0.5, metalness: 0.7 });
    var towerColumn1 = new THREE.Mesh(verticalGeometry, steelMaterial);
    towerColumn1.position.set(-8, 40, -8);
    towerColumn1.castShadow = true;
    towerColumn1.receiveShadow = true;
    towerGroup.add(towerColumn1);

    var towerColumn2 = new THREE.Mesh(verticalGeometry, steelMaterial);
    towerColumn2.position.set(8, 40, -8);
    towerColumn2.castShadow = true;
    towerColumn2.receiveShadow = true;
    towerGroup.add(towerColumn2);

    // Tower walkway arm
    var walkwayGeometry = new THREE.BoxGeometry(30, 6, 4);
    var walkway = new THREE.Mesh(walkwayGeometry, steelMaterial);
    walkway.position.set(5, 45, -5);
    walkway.castShadow = true;
    walkway.receiveShadow = true;
    towerGroup.add(walkway);

    // LineSegments bracing cables
    var cablePoints = [
      new THREE.Vector3(-8, 75, -8),
      new THREE.Vector3(8, 75, -8),
      new THREE.Vector3(8, 75, -8),
      new THREE.Vector3(-8, 5, -8),
      new THREE.Vector3(8, 5, -8),
      new THREE.Vector3(-8, 75, -8)
    ];
    var cableGeometry = new THREE.BufferGeometry().setFromPoints(cablePoints);
    var cableMaterial = new THREE.LineBasicMaterial({ color: 0xaaaaaa, linewidth: 2 });
    var cables = new THREE.LineSegments(cableGeometry, cableMaterial);
    towerGroup.add(cables);

    // Hold-down clamp arms (BoxGeometry mechanical)
    var clampGroup = new THREE.Group();
    clampGroup.position.set(0, 10, 5);
    launchPadGroup.add(clampGroup);

    for (var k = 0; k < 3; k++) {
      var clampGeometry = new THREE.BoxGeometry(4, 3, 18);
      var clampMaterial = new THREE.MeshStandardMaterial({ color: 0x666666, roughness: 0.6, metalness: 0.8 });
      var clamp = new THREE.Mesh(clampGeometry, clampMaterial);
      clamp.rotation.z = (Math.PI / 3) * k;
      clamp.position.y = 8;
      clamp.castShadow = true;
      clamp.receiveShadow = true;
      clampGroup.add(clamp);
    }

    // Umbilical mast (BoxGeometry tower + LineSegments cables)
    var umbilicalGeometry = new THREE.BoxGeometry(3, 35, 3);
    var umbilicalMaterial = new THREE.MeshStandardMaterial({ color: 0x777777, roughness: 0.5, metalness: 0.6 });
    var umbilicalMast = new THREE.Mesh(umbilicalGeometry, umbilicalMaterial);
    umbilicalMast.position.set(15, 20, -8);
    umbilicalMast.castShadow = true;
    umbilicalMast.receiveShadow = true;
    launchPadGroup.add(umbilicalMast);

    // Umbilical cables (LineSegments)
    var umbilicalPoints = [
      new THREE.Vector3(15, 35, -8),
      new THREE.Vector3(0, 15, 0),
      new THREE.Vector3(15, 35, -8),
      new THREE.Vector3(-10, 20, -5)
    ];
    var umbilicalCableGeometry = new THREE.BufferGeometry().setFromPoints(umbilicalPoints);
    var umbilicalCableMaterial = new THREE.LineBasicMaterial({ color: 0xff9900, linewidth: 2 });
    var umbilicalCables = new THREE.LineSegments(umbilicalCableGeometry, umbilicalCableMaterial);
    launchPadGroup.add(umbilicalCables);

    // Mission control bunker (BoxGeometry reinforced concrete)
    var bunkerGeometry = new THREE.BoxGeometry(40, 15, 30);
    var bunkerMaterial = new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.8, metalness: 0.1 });
    var bunker = new THREE.Mesh(bunkerGeometry, bunkerMaterial);
    bunker.position.set(-70, 8, 50);
    bunker.castShadow = true;
    bunker.receiveShadow = true;
    launchPadGroup.add(bunker);

    // Tracking radar dish (BoxGeometry mesh dish + CylinderGeometry pedestal)
    var radarGroup = new THREE.Group();
    radarGroup.position.set(60, 0, -60);
    launchPadGroup.add(radarGroup);
    radarDish = radarGroup;

    var radarPedestalGeometry = new THREE.CylinderGeometry(6, 8, 20, 16);
    var radarPedestalMaterial = new THREE.MeshStandardMaterial({ color: 0x666666, roughness: 0.5, metalness: 0.6 });
    var radarPedestal = new THREE.Mesh(radarPedestalGeometry, radarPedestalMaterial);
    radarPedestal.position.y = 10;
    radarPedestal.castShadow = true;
    radarPedestal.receiveShadow = true;
    radarGroup.add(radarPedestal);

    // Radar dish surface
    var dishGeometry = new THREE.BoxGeometry(28, 1, 24);
    var dishMaterial = new THREE.MeshStandardMaterial({ color: 0xdddddd, roughness: 0.4, metalness: 0.7 });
    var dish = new THREE.Mesh(dishGeometry, dishMaterial);
    dish.position.y = 26;
    dish.castShadow = true;
    dish.receiveShadow = true;
    radarGroup.add(dish);

    // Fuel storage spheres (SphereGeometry LOX/LH2 tanks)
    var tankGeometry = new THREE.SphereGeometry(12, 24, 24);
    var tankMaterial = new THREE.MeshStandardMaterial({ color: 0x0066cc, roughness: 0.3, metalness: 0.6 });
    var tank1 = new THREE.Mesh(tankGeometry, tankMaterial);
    tank1.position.set(-80, 15, 10);
    tank1.castShadow = true;
    tank1.receiveShadow = true;
    launchPadGroup.add(tank1);

    var tank2Geometry = new THREE.SphereGeometry(10, 24, 24);
    var tank2Material = new THREE.MeshStandardMaterial({ color: 0x00cc00, roughness: 0.3, metalness: 0.6 });
    var tank2 = new THREE.Mesh(tank2Geometry, tank2Material);
    tank2.position.set(-80, 15, -20);
    tank2.castShadow = true;
    tank2.receiveShadow = true;
    launchPadGroup.add(tank2);

    // Flame deflector water tank (BoxGeometry elevated)
    var deflectorGeometry = new THREE.BoxGeometry(35, 12, 25);
    var deflectorMaterial = new THREE.MeshStandardMaterial({ color: 0x333366, roughness: 0.6, metalness: 0.4 });
    var deflector = new THREE.Mesh(deflectorGeometry, deflectorMaterial);
    deflector.position.set(0, 28, -45);
    deflector.castShadow = true;
    deflector.receiveShadow = true;
    launchPadGroup.add(deflector);

    // Safety bunker blast shield (BoxGeometry heavy slabs)
    var shieldGeometry = new THREE.BoxGeometry(50, 12, 8);
    var shieldMaterial = new THREE.MeshStandardMaterial({ color: 0x444444, roughness: 0.8, metalness: 0.5 });
    var shield = new THREE.Mesh(shieldGeometry, shieldMaterial);
    shield.position.set(-90, 6, 0);
    shield.castShadow = true;
    shield.receiveShadow = true;
    launchPadGroup.add(shield);

    // Transport crawler path (BoxGeometry concrete road)
    var pathGeometry = new THREE.BoxGeometry(25, 2, 150);
    var pathMaterial = new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 0.9, metalness: 0.0 });
    var crawlerPath = new THREE.Mesh(pathGeometry, pathMaterial);
    crawlerPath.position.set(-45, 2, 20);
    crawlerPath.receiveShadow = true;
    launchPadGroup.add(crawlerPath);

    // Vehicle assembly building far (BoxGeometry massive tall)
    var vabGeometry = new THREE.BoxGeometry(90, 120, 85);
    var vabMaterial = new THREE.MeshStandardMaterial({ color: 0x4a4a4a, roughness: 0.7, metalness: 0.2 });
    var vab = new THREE.Mesh(vabGeometry, vabMaterial);
    vab.position.set(-60, 60, -100);
    vab.castShadow = true;
    vab.receiveShadow = true;
    launchPadGroup.add(vab);

    // Perimeter security fence (BoxGeometry posts + LineSegments)
    var fenceGroup = new THREE.Group();
    fenceGroup.position.set(0, 0, 0);
    launchPadGroup.add(fenceGroup);

    var fencePostGeometry = new THREE.BoxGeometry(2, 12, 2);
    var fencePostMaterial = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.7, metalness: 0.3 });
    var fencePositions = [
      [-120, 6, -90], [-120, 6, 90], [120, 6, -90], [120, 6, 90]
    ];
    for (var m = 0; m < fencePositions.length; m++) {
      var post = new THREE.Mesh(fencePostGeometry, fencePostMaterial);
      post.position.set(fencePositions[m][0], fencePositions[m][1], fencePositions[m][2]);
      post.castShadow = true;
      post.receiveShadow = true;
      fenceGroup.add(post);
    }

    // Fence lines
    var fenceLinePoints = [
      new THREE.Vector3(-120, 6, -90),
      new THREE.Vector3(-120, 6, 90),
      new THREE.Vector3(-120, 6, 90),
      new THREE.Vector3(120, 6, 90),
      new THREE.Vector3(120, 6, 90),
      new THREE.Vector3(120, 6, -90),
      new THREE.Vector3(120, 6, -90),
      new THREE.Vector3(-120, 6, -90)
    ];
    var fenceLineGeometry = new THREE.BufferGeometry().setFromPoints(fenceLinePoints);
    var fenceLineMaterial = new THREE.LineBasicMaterial({ color: 0x888888, linewidth: 1 });
    var fenceLines = new THREE.LineSegments(fenceLineGeometry, fenceLineMaterial);
    fenceGroup.add(fenceLines);

    // Countdown clock display (BoxGeometry emissive panel)
    var displayGeometry = new THREE.BoxGeometry(8, 4, 0.5);
    var displayMaterial = new THREE.MeshStandardMaterial({
      color: 0x001100,
      emissive: 0x00ff00,
      emissiveIntensity: 0.8,
      roughness: 0.2,
      metalness: 0.6
    });
    countdownDisplay = new THREE.Mesh(displayGeometry, displayMaterial);
    countdownDisplay.position.set(-50, 35, 15);
    countdownDisplay.castShadow = true;
    countdownDisplay.receiveShadow = true;
    launchPadGroup.add(countdownDisplay);

    // Sound suppression water towers (CylinderGeometry)
    var waterTowerGeometry = new THREE.CylinderGeometry(5, 6, 30, 16);
    var waterTowerMaterial = new THREE.MeshStandardMaterial({ color: 0x5588cc, roughness: 0.4, metalness: 0.5 });
    var waterTower1 = new THREE.Mesh(waterTowerGeometry, waterTowerMaterial);
    waterTower1.position.set(80, 20, 40);
    waterTower1.castShadow = true;
    waterTower1.receiveShadow = true;
    launchPadGroup.add(waterTower1);

    var waterTower2 = new THREE.Mesh(waterTowerGeometry, waterTowerMaterial);
    waterTower2.position.set(80, 20, -40);
    waterTower2.castShadow = true;
    waterTower2.receiveShadow = true;
    launchPadGroup.add(waterTower2);

    // Initialize steam/water vapor particles
    initializeSteamParticles();
  }

  function initializeSteamParticles() {
    for (var n = 0; n < 8; n++) {
      var steamGeometry = new THREE.SphereGeometry(3, 8, 8);
      var steamMaterial = new THREE.MeshStandardMaterial({
        color: 0xdddddd,
        transparent: true,
        opacity: 0.3,
        roughness: 0.8,
        metalness: 0.0
      });
      var steamParticle = new THREE.Mesh(steamGeometry, steamMaterial);
      steamParticle.position.set(
        (Math.random() - 0.5) * 40,
        Math.random() * 20,
        -35 + Math.random() * 20
      );
      steamParticles.push({
        mesh: steamParticle,
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * 0.5,
          Math.random() * 0.3 + 0.2,
          (Math.random() - 0.5) * 0.3
        ),
        life: Math.random() * 30 + 20
      });
      launchPadGroup.add(steamParticle);
    }

    for (var p = 0; p < 12; p++) {
      var cloudGeometry = new THREE.SphereGeometry(6, 8, 8);
      var cloudMaterial = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.2,
        roughness: 0.9,
        metalness: 0.0
      });
      var cloudParticle = new THREE.Mesh(cloudGeometry, cloudMaterial);
      cloudParticle.position.set(
        (Math.random() - 0.5) * 60,
        30 + Math.random() * 30,
        -40 + Math.random() * 40
      );
      waterVaporClouds.push({
        mesh: cloudParticle,
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * 0.2,
          Math.random() * 0.1,
          (Math.random() - 0.5) * 0.2
        ),
        life: Math.random() * 50 + 40
      });
      launchPadGroup.add(cloudParticle);
    }
  }

  function update(delta) {
    if (!launchPadGroup) return;

    // Countdown display flicker
    countdownValue -= delta;
    if (countdownValue < 0) {
      isIgniting = true;
      ignitionTimer = 0;
      countdownValue = 0;
    }

    if (countdownDisplay) {
      countdownDisplay.material.emissiveIntensity = 0.5 + Math.sin(countdownValue * 5) * 0.3;
    }

    // Radar dish rotation
    if (radarDish) {
      radarRotation += delta * 0.5;
      radarDish.rotation.y = radarRotation;
    }

    // Engine pre-ignition glow during countdown
    if (isIgniting) {
      ignitionTimer += delta;
      if (ignitionTimer < 3) {
        engineGlowIntensity = Math.min(ignitionTimer / 3, 1.0);
      } else {
        engineGlowIntensity = Math.max(1.0 - (ignitionTimer - 3) / 2, 0);
        if (ignitionTimer > 5) {
          isIgniting = false;
        }
      }

      for (var q = 0; q < engineFlameGroup.children.length; q++) {
        var child = engineFlameGroup.children[q];
        if (child.material && child.material.emissive) {
          child.material.emissiveIntensity = engineGlowIntensity * 1.5;
        }
      }
    }

    // Update steam particles
    for (var r = 0; r < steamParticles.length; r++) {
      var steam = steamParticles[r];
      steam.mesh.position.add(steam.velocity);
      steam.life -= delta;
      steam.mesh.material.opacity = Math.max(0, steam.life / 30);

      if (steam.life <= 0) {
        launchPadGroup.remove(steam.mesh);
        steamParticles.splice(r, 1);
        r--;
      }
    }

    // Update water vapor clouds
    for (var s = 0; s < waterVaporClouds.length; s++) {
      var cloud = waterVaporClouds[s];
      cloud.mesh.position.add(cloud.velocity);
      cloud.life -= delta;
      cloud.mesh.material.opacity = Math.max(0, cloud.life / 50);

      if (cloud.life <= 0) {
        launchPadGroup.remove(cloud.mesh);
        waterVaporClouds.splice(s, 1);
        s--;
      }
    }

    // Respawn steam particles
    if (steamParticles.length < 8 && Math.random() < 0.1) {
      var newSteamGeometry = new THREE.SphereGeometry(3, 8, 8);
      var newSteamMaterial = new THREE.MeshStandardMaterial({
        color: 0xdddddd,
        transparent: true,
        opacity: 0.3,
        roughness: 0.8,
        metalness: 0.0
      });
      var newSteam = new THREE.Mesh(newSteamGeometry, newSteamMaterial);
      newSteam.position.set(
        (Math.random() - 0.5) * 40,
        Math.random() * 15,
        -35 + Math.random() * 20
      );
      steamParticles.push({
        mesh: newSteam,
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * 0.5,
          Math.random() * 0.3 + 0.2,
          (Math.random() - 0.5) * 0.3
        ),
        life: Math.random() * 30 + 20
      });
      launchPadGroup.add(newSteam);
    }

    // Respawn water vapor clouds
    if (waterVaporClouds.length < 12 && Math.random() < 0.08) {
      var newCloudGeometry = new THREE.SphereGeometry(6, 8, 8);
      var newCloudMaterial = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.2,
        roughness: 0.9,
        metalness: 0.0
      });
      var newCloud = new THREE.Mesh(newCloudGeometry, newCloudMaterial);
      newCloud.position.set(
        (Math.random() - 0.5) * 60,
        30 + Math.random() * 30,
        -40 + Math.random() * 40
      );
      waterVaporClouds.push({
        mesh: newCloud,
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * 0.2,
          Math.random() * 0.1,
          (Math.random() - 0.5) * 0.2
        ),
        life: Math.random() * 50 + 40
      });
      launchPadGroup.add(newCloud);
    }
  }

  function reset() {
    countdownValue = 300;
    engineGlowIntensity = 0;
    isIgniting = false;
    ignitionTimer = 0;
    radarRotation = 0;

    for (var t = 0; t < steamParticles.length; t++) {
      launchPadGroup.remove(steamParticles[t].mesh);
    }
    steamParticles = [];

    for (var u = 0; u < waterVaporClouds.length; u++) {
      launchPadGroup.remove(waterVaporClouds[u].mesh);
    }
    waterVaporClouds = [];

    initializeSteamParticles();

    if (countdownDisplay) {
      countdownDisplay.material.emissiveIntensity = 0.8;
    }

    for (var v = 0; v < engineFlameGroup.children.length; v++) {
      var engineChild = engineFlameGroup.children[v];
      if (engineChild.material && engineChild.material.emissive) {
        engineChild.material.emissiveIntensity = 0;
      }
    }
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
