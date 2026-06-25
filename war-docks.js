window.WarDocks = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var environmentObjects = [];
  var animationState = {
    fireFlicker: 0,
    craneRotation: 0,
    mineBob: 0
  };

  var DOCK_COLOR = 0x4a4a4a;
  var RUST_COLOR = 0x8b4513;
  var WATER_COLOR = 0x1a3a52;
  var FIRE_COLOR = 0xff6b1a;
  var DARK_GRAY = 0x2d2d2d;
  var LIGHT_GRAY = 0x7a7a7a;

  function createDockPiers() {
    var piersGroup = new THREE.Group();

    // Main concrete pier
    var mainPierGeo = new THREE.BoxGeometry(60, 2, 8);
    var mainPierMat = new THREE.MeshStandardMaterial({ color: DOCK_COLOR });
    var mainPier = new THREE.Mesh(mainPierGeo, mainPierMat);
    mainPier.position.set(0, 0.5, 20);
    mainPier.castShadow = true;
    mainPier.receiveShadow = true;
    piersGroup.add(mainPier);
    environmentObjects.push(mainPier);

    // Side pier extensions
    for (var i = 0; i < 3; i++) {
      var sidePierGeo = new THREE.BoxGeometry(6, 2, 35);
      var sidePierMat = new THREE.MeshStandardMaterial({ color: DOCK_COLOR });
      var sidePier = new THREE.Mesh(sidePierGeo, sidePierMat);
      sidePier.position.set(-20 + i * 20, 0.5, 0);
      sidePier.castShadow = true;
      sidePier.receiveShadow = true;
      piersGroup.add(sidePier);
      environmentObjects.push(sidePier);
    }

    // Concrete support pillars
    for (var i = 0; i < 8; i++) {
      var pillarGeo = new THREE.CylinderGeometry(0.8, 1, 3, 8);
      var pillarMat = new THREE.MeshStandardMaterial({ color: 0x5a5a5a });
      var pillar = new THREE.Mesh(pillarGeo, pillarMat);
      pillar.position.set(-30 + i * 10, -1.5, 25);
      pillar.castShadow = true;
      pillar.receiveShadow = true;
      piersGroup.add(pillar);
      environmentObjects.push(pillar);
    }

    scene.add(piersGroup);
  }

  function createDestroyerHulls() {
    var hullGroup = new THREE.Group();

    // Destroyer 1
    var hull1GastroGeo = new THREE.BoxGeometry(8, 6, 25);
    var hullMat = new THREE.MeshStandardMaterial({ color: DARK_GRAY });
    var hull1 = new THREE.Mesh(hull1GastroGeo, hullMat);
    hull1.position.set(-15, 2, -5);
    hull1.castShadow = true;
    hull1.receiveShadow = true;
    hullGroup.add(hull1);
    environmentObjects.push(hull1);

    // Destroyer 1 superstructure (tower)
    var superGeo1 = new THREE.BoxGeometry(6, 8, 5);
    var superMat = new THREE.MeshStandardMaterial({ color: LIGHT_GRAY });
    var super1 = new THREE.Mesh(superGeo1, superMat);
    super1.position.set(-15, 7, -8);
    super1.castShadow = true;
    super1.receiveShadow = true;
    hullGroup.add(super1);
    environmentObjects.push(super1);

    // Destroyer 1 funnels
    for (var i = 0; i < 2; i++) {
      var funnelGeo = new THREE.CylinderGeometry(1.2, 1, 6, 12);
      var funnelMat = new THREE.MeshStandardMaterial({ color: RUST_COLOR });
      var funnel = new THREE.Mesh(funnelGeo, funnelMat);
      funnel.position.set(-18 + i * 6, 8, -8);
      funnel.castShadow = true;
      funnel.receiveShadow = true;
      hullGroup.add(funnel);
      environmentObjects.push(funnel);
    }

    // Destroyer 1 gun turrets
    for (var i = 0; i < 2; i++) {
      var turretGeo = new THREE.CylinderGeometry(1.5, 1.8, 2, 16);
      var turretMat = new THREE.MeshStandardMaterial({ color: 0x3a3a3a });
      var turret = new THREE.Mesh(turretGeo, turretMat);
      turret.position.set(-15, 10, -15 + i * 15);
      turret.castShadow = true;
      turret.receiveShadow = true;
      hullGroup.add(turret);
      environmentObjects.push(turret);

      // Gun barrels
      var barrelGeo = new THREE.CylinderGeometry(0.4, 0.4, 5, 8);
      var barrelMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a });
      var barrel = new THREE.Mesh(barrelGeo, barrelMat);
      barrel.position.set(-15, 11.5, -15 + i * 15);
      barrel.rotation.z = 0.3;
      barrel.castShadow = true;
      barrel.receiveShadow = true;
      hullGroup.add(barrel);
      environmentObjects.push(barrel);
    }

    // Destroyer 2
    var hull2GastroGeo = new THREE.BoxGeometry(8, 6, 25);
    var hull2 = new THREE.Mesh(hull2GastroGeo, hullMat);
    hull2.position.set(15, 2, -5);
    hull2.castShadow = true;
    hull2.receiveShadow = true;
    hullGroup.add(hull2);
    environmentObjects.push(hull2);

    // Destroyer 2 superstructure
    var super2 = new THREE.Mesh(superGeo1, superMat);
    super2.position.set(15, 7, -8);
    super2.castShadow = true;
    super2.receiveShadow = true;
    hullGroup.add(super2);
    environmentObjects.push(super2);

    // Destroyer 2 funnels
    for (var i = 0; i < 2; i++) {
      var funnelGeo = new THREE.CylinderGeometry(1.2, 1, 6, 12);
      var funnelMat = new THREE.MeshStandardMaterial({ color: RUST_COLOR });
      var funnel = new THREE.Mesh(funnelGeo, funnelMat);
      funnel.position.set(12 + i * 6, 8, -8);
      funnel.castShadow = true;
      funnel.receiveShadow = true;
      hullGroup.add(funnel);
      environmentObjects.push(funnel);
    }

    // Destroyer 2 gun turrets
    for (var i = 0; i < 2; i++) {
      var turretGeo = new THREE.CylinderGeometry(1.5, 1.8, 2, 16);
      var turretMat = new THREE.MeshStandardMaterial({ color: 0x3a3a3a });
      var turret = new THREE.Mesh(turretGeo, turretMat);
      turret.position.set(15, 10, -15 + i * 15);
      turret.castShadow = true;
      turret.receiveShadow = true;
      hullGroup.add(turret);
      environmentObjects.push(turret);

      var barrelGeo = new THREE.CylinderGeometry(0.4, 0.4, 5, 8);
      var barrelMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a });
      var barrel = new THREE.Mesh(barrelGeo, barrelMat);
      barrel.position.set(15, 11.5, -15 + i * 15);
      barrel.rotation.z = 0.3;
      barrel.castShadow = true;
      barrel.receiveShadow = true;
      hullGroup.add(barrel);
      environmentObjects.push(barrel);
    }

    scene.add(hullGroup);
  }

  function createDryDock() {
    var dryDockGroup = new THREE.Group();

    // Outer basin walls
    var basinWallGeo = new THREE.BoxGeometry(28, 8, 2);
    var wallMat = new THREE.MeshStandardMaterial({ color: 0x505050 });

    var wallFront = new THREE.Mesh(basinWallGeo, wallMat);
    wallFront.position.set(0, 2, -25);
    wallFront.castShadow = true;
    wallFront.receiveShadow = true;
    dryDockGroup.add(wallFront);
    environmentObjects.push(wallFront);

    var wallBack = new THREE.Mesh(basinWallGeo, wallMat);
    wallBack.position.set(0, 2, -45);
    wallBack.castShadow = true;
    wallBack.receiveShadow = true;
    dryDockGroup.add(wallBack);
    environmentObjects.push(wallBack);

    var wallLeftGeo = new THREE.BoxGeometry(2, 8, 20);
    var wallLeft = new THREE.Mesh(wallLeftGeo, wallMat);
    wallLeft.position.set(-14, 2, -35);
    wallLeft.castShadow = true;
    wallLeft.receiveShadow = true;
    dryDockGroup.add(wallLeft);
    environmentObjects.push(wallLeft);

    var wallRight = new THREE.Mesh(wallLeftGeo, wallMat);
    wallRight.position.set(14, 2, -35);
    wallRight.castShadow = true;
    wallRight.receiveShadow = true;
    dryDockGroup.add(wallRight);
    environmentObjects.push(wallRight);

    // Ship in dry dock
    var dockshipHullGeo = new THREE.BoxGeometry(10, 8, 20);
    var dockshipMat = new THREE.MeshStandardMaterial({ color: 0x7a5a3a });
    var dockship = new THREE.Mesh(dockshipHullGeo, dockshipMat);
    dockship.position.set(0, 1, -35);
    dockship.castShadow = true;
    dockship.receiveShadow = true;
    dryDockGroup.add(dockship);
    environmentObjects.push(dockship);

    // Dry dock floor
    var floorGeo = new THREE.BoxGeometry(28, 1, 20);
    var floorMat = new THREE.MeshStandardMaterial({ color: 0x3a3a3a });
    var floor = new THREE.Mesh(floorGeo, floorMat);
    floor.position.set(0, -3.5, -35);
    floor.receiveShadow = true;
    dryDockGroup.add(floor);
    environmentObjects.push(floor);

    scene.add(dryDockGroup);
  }

  function createDockyardCranes() {
    var craneGroup = new THREE.Group();

    // Crane 1 (left side)
    var towerGeo1 = new THREE.BoxGeometry(3, 30, 3);
    var towerMat = new THREE.MeshStandardMaterial({ color: LIGHT_GRAY });
    var tower1 = new THREE.Mesh(towerGeo1, towerMat);
    tower1.position.set(-25, 15, 10);
    tower1.castShadow = true;
    tower1.receiveShadow = true;
    craneGroup.add(tower1);
    environmentObjects.push(tower1);

    // Crane 1 horizontal arm
    var armGeo1 = new THREE.BoxGeometry(20, 2, 2);
    var armMat = new THREE.MeshStandardMaterial({ color: 0x6a6a6a });
    var arm1 = new THREE.Mesh(armGeo1, armMat);
    arm1.position.set(-15, 30, 10);
    arm1.castShadow = true;
    arm1.receiveShadow = true;
    arm1.userData.isArmLeft = true;
    arm1.userData.baseRotation = 0;
    craneGroup.add(arm1);
    environmentObjects.push(arm1);

    // Crane 1 cable drum
    var drumGeo1 = new THREE.CylinderGeometry(1.5, 1.5, 4, 16);
    var drumMat = new THREE.MeshStandardMaterial({ color: RUST_COLOR });
    var drum1 = new THREE.Mesh(drumGeo1, drumMat);
    drum1.position.set(-25, 28, 10);
    drum1.rotation.z = Math.PI / 2;
    drum1.castShadow = true;
    drum1.receiveShadow = true;
    drum1.userData.isCraneDrum = true;
    craneGroup.add(drum1);
    environmentObjects.push(drum1);

    // Crane 2 (right side)
    var towerGeo2 = new THREE.BoxGeometry(3, 30, 3);
    var tower2 = new THREE.Mesh(towerGeo2, towerMat);
    tower2.position.set(25, 15, 10);
    tower2.castShadow = true;
    tower2.receiveShadow = true;
    craneGroup.add(tower2);
    environmentObjects.push(tower2);

    // Crane 2 horizontal arm
    var armGeo2 = new THREE.BoxGeometry(20, 2, 2);
    var arm2 = new THREE.Mesh(armGeo2, armMat);
    arm2.position.set(15, 30, 10);
    arm2.castShadow = true;
    arm2.receiveShadow = true;
    arm2.userData.isArmRight = true;
    arm2.userData.baseRotation = 0;
    craneGroup.add(arm2);
    environmentObjects.push(arm2);

    // Crane 2 cable drum
    var drum2 = new THREE.Mesh(drumGeo1, drumMat);
    drum2.position.set(25, 28, 10);
    drum2.rotation.z = Math.PI / 2;
    drum2.castShadow = true;
    drum2.receiveShadow = true;
    drum2.userData.isCraneDrum = true;
    craneGroup.add(drum2);
    environmentObjects.push(drum2);

    scene.add(craneGroup);
  }

  function createNavalWarehouses() {
    var warehouseGroup = new THREE.Group();

    // Warehouse 1
    var warehouse1Geo = new THREE.BoxGeometry(15, 12, 20);
    var warehouseMat = new THREE.MeshStandardMaterial({ color: 0x4a3a2a });
    var warehouse1 = new THREE.Mesh(warehouse1Geo, warehouseMat);
    warehouse1.position.set(-30, 6, 35);
    warehouse1.castShadow = true;
    warehouse1.receiveShadow = true;
    warehouseGroup.add(warehouse1);
    environmentObjects.push(warehouse1);

    // Warehouse 1 roof
    var roofGeo1 = new THREE.BoxGeometry(15, 1, 20);
    var roofMat = new THREE.MeshStandardMaterial({ color: 0x5a4a3a });
    var roof1 = new THREE.Mesh(roofGeo1, roofMat);
    roof1.position.set(-30, 12.5, 35);
    roof1.castShadow = true;
    roof1.receiveShadow = true;
    warehouseGroup.add(roof1);
    environmentObjects.push(roof1);

    // Warehouse 2
    var warehouse2Geo = new THREE.BoxGeometry(12, 10, 18);
    var warehouse2 = new THREE.Mesh(warehouse2Geo, warehouseMat);
    warehouse2.position.set(30, 5, 35);
    warehouse2.castShadow = true;
    warehouse2.receiveShadow = true;
    warehouseGroup.add(warehouse2);
    environmentObjects.push(warehouse2);

    // Warehouse 2 roof
    var roof2 = new THREE.Mesh(roofGeo1, roofMat);
    roof2.position.set(30, 10.5, 35);
    roof2.castShadow = true;
    roof2.receiveShadow = true;
    warehouseGroup.add(roof2);
    environmentObjects.push(roof2);

    // Storage containers (small boxes)
    for (var i = 0; i < 6; i++) {
      var containerGeo = new THREE.BoxGeometry(4, 4, 4);
      var containerMat = new THREE.MeshStandardMaterial({ color: 0x6a5a4a });
      var container = new THREE.Mesh(containerGeo, containerMat);
      container.position.set(-30 + (i % 3) * 6, 2, 50 + Math.floor(i / 3) * 6);
      container.castShadow = true;
      container.receiveShadow = true;
      warehouseGroup.add(container);
      environmentObjects.push(container);
    }

    scene.add(warehouseGroup);
  }

  function createTorpedoBoat() {
    var boatGroup = new THREE.Group();

    // Torpedo boat hull
    var boatHullGeo = new THREE.BoxGeometry(5, 3, 12);
    var boatMat = new THREE.MeshStandardMaterial({ color: DARK_GRAY });
    var boatHull = new THREE.Mesh(boatHullGeo, boatMat);
    boatHull.position.set(35, 1.5, 15);
    boatHull.castShadow = true;
    boatHull.receiveShadow = true;
    boatGroup.add(boatHull);
    environmentObjects.push(boatHull);

    // Torpedo boat cabin
    var cabinGeo = new THREE.BoxGeometry(4, 2.5, 4);
    var cabinMat = new THREE.MeshStandardMaterial({ color: LIGHT_GRAY });
    var cabin = new THREE.Mesh(cabinGeo, cabinMat);
    cabin.position.set(35, 3.5, 10);
    cabin.castShadow = true;
    cabin.receiveShadow = true;
    boatGroup.add(cabin);
    environmentObjects.push(cabin);

    // Gun turret
    var gunTurretGeo = new THREE.CylinderGeometry(1, 1.2, 1.5, 12);
    var gunMat = new THREE.MeshStandardMaterial({ color: 0x3a3a3a });
    var gunTurret = new THREE.Mesh(gunTurretGeo, gunMat);
    gunTurret.position.set(35, 5, 8);
    gunTurret.castShadow = true;
    gunTurret.receiveShadow = true;
    boatGroup.add(gunTurret);
    environmentObjects.push(gunTurret);

    // Gun barrel
    var gunBarrelGeo = new THREE.CylinderGeometry(0.3, 0.3, 3, 8);
    var gunBarrel = new THREE.Mesh(gunBarrelGeo, gunMat);
    gunBarrel.position.set(35, 6, 8);
    gunBarrel.rotation.z = 0.2;
    gunBarrel.castShadow = true;
    gunBarrel.receiveShadow = true;
    boatGroup.add(gunBarrel);
    environmentObjects.push(gunBarrel);

    // Torpedo mounts (2)
    for (var i = 0; i < 2; i++) {
      var torpedoMountGeo = new THREE.BoxGeometry(3, 1, 1);
      var torpedoMat = new THREE.MeshStandardMaterial({ color: RUST_COLOR });
      var torpedoMount = new THREE.Mesh(torpedoMountGeo, torpedoMat);
      torpedoMount.position.set(34 - i * 2, 2, 15);
      torpedoMount.castShadow = true;
      torpedoMount.receiveShadow = true;
      boatGroup.add(torpedoMount);
      environmentObjects.push(torpedoMount);
    }

    scene.add(boatGroup);
  }

  function createAmmoHandlingCrane() {
    var ammoGroup = new THREE.Group();

    // Crane base tower
    var baseGeo = new THREE.BoxGeometry(4, 25, 4);
    var baseMat = new THREE.MeshStandardMaterial({ color: LIGHT_GRAY });
    var base = new THREE.Mesh(baseGeo, baseMat);
    base.position.set(-35, 12.5, 0);
    base.castShadow = true;
    base.receiveShadow = true;
    ammoGroup.add(base);
    environmentObjects.push(base);

    // Crane arm
    var armGeo = new THREE.BoxGeometry(18, 1.5, 1.5);
    var armMat = new THREE.MeshStandardMaterial({ color: 0x6a6a6a });
    var arm = new THREE.Mesh(armGeo, armMat);
    arm.position.set(-26, 24, 0);
    arm.castShadow = true;
    arm.receiveShadow = true;
    ammoGroup.add(arm);
    environmentObjects.push(arm);

    // Cable drum
    var drumGeo = new THREE.CylinderGeometry(1.2, 1.2, 3, 16);
    var drumMat = new THREE.MeshStandardMaterial({ color: RUST_COLOR });
    var drum = new THREE.Mesh(drumGeo, drumMat);
    drum.position.set(-35, 23, 0);
    drum.rotation.z = Math.PI / 2;
    drum.castShadow = true;
    drum.receiveShadow = true;
    ammoGroup.add(drum);
    environmentObjects.push(drum);

    // Torpedo shapes on crane
    for (var i = 0; i < 3; i++) {
      var torpedoGeo = new THREE.CylinderGeometry(0.6, 0.6, 4, 12);
      var torpedoMat = new THREE.MeshStandardMaterial({ color: 0x2a2a2a });
      var torpedo = new THREE.Mesh(torpedoGeo, torpedoMat);
      torpedo.position.set(-35 + i * 5, 20, 0);
      torpedo.rotation.z = Math.PI / 2;
      torpedo.castShadow = true;
      torpedo.receiveShadow = true;
      ammoGroup.add(torpedo);
      environmentObjects.push(torpedo);
    }

    // Ammunition on ground
    for (var i = 0; i < 8; i++) {
      var ammoBoxGeo = new THREE.BoxGeometry(2, 2, 2);
      var ammoMat = new THREE.MeshStandardMaterial({ color: 0x4a4a4a });
      var ammoBox = new THREE.Mesh(ammoBoxGeo, ammoMat);
      ammoBox.position.set(-38 + (i % 4) * 3, 1, -2 + Math.floor(i / 4) * 3);
      ammoBox.castShadow = true;
      ammoBox.receiveShadow = true;
      ammoGroup.add(ammoBox);
      environmentObjects.push(ammoBox);
    }

    scene.add(ammoGroup);
  }

  function createDockControlTower() {
    var towerGroup = new THREE.Group();

    // Main tower body
    var towerBodyGeo = new THREE.BoxGeometry(6, 22, 6);
    var towerMat = new THREE.MeshStandardMaterial({ color: LIGHT_GRAY });
    var towerBody = new THREE.Mesh(towerBodyGeo, towerMat);
    towerBody.position.set(-40, 11, 20);
    towerBody.castShadow = true;
    towerBody.receiveShadow = true;
    towerGroup.add(towerBody);
    environmentObjects.push(towerBody);

    // Tower top section (observation deck)
    var topGeo = new THREE.BoxGeometry(5, 3, 5);
    var topMat = new THREE.MeshStandardMaterial({ color: 0x5a5a5a });
    var top = new THREE.Mesh(topGeo, topMat);
    top.position.set(-40, 23, 20);
    top.castShadow = true;
    top.receiveShadow = true;
    towerGroup.add(top);
    environmentObjects.push(top);

    // Antenna
    var antennaGeo = new THREE.CylinderGeometry(0.3, 0.3, 8, 8);
    var antennaMat = new THREE.MeshStandardMaterial({ color: 0x2a2a2a });
    var antenna = new THREE.Mesh(antennaGeo, antennaMat);
    antenna.position.set(-40, 28, 20);
    antenna.castShadow = true;
    antenna.receiveShadow = true;
    towerGroup.add(antenna);
    environmentObjects.push(antenna);

    // Windows (small boxes as representation)
    for (var i = 0; i < 4; i++) {
      var windowGeo = new THREE.BoxGeometry(1, 1, 0.5);
      var windowMat = new THREE.MeshStandardMaterial({ color: 0x1a1a4a });
      var window = new THREE.Mesh(windowGeo, windowMat);
      window.position.set(-40, 15 + i * 2, 23.5);
      window.castShadow = true;
      window.receiveShadow = true;
      towerGroup.add(window);
      environmentObjects.push(window);
    }

    scene.add(towerGroup);
  }

  function createSubmarinePen() {
    var penGroup = new THREE.Group();

    // Pen structure
    var penWallGeo = new THREE.BoxGeometry(20, 12, 2);
    var penMat = new THREE.MeshStandardMaterial({ color: 0x505050 });

    var penFront = new THREE.Mesh(penWallGeo, penMat);
    penFront.position.set(40, 6, -10);
    penFront.castShadow = true;
    penFront.receiveShadow = true;
    penGroup.add(penFront);
    environmentObjects.push(penFront);

    var penBack = new THREE.Mesh(penWallGeo, penMat);
    penBack.position.set(40, 6, -30);
    penBack.castShadow = true;
    penBack.receiveShadow = true;
    penGroup.add(penBack);
    environmentObjects.push(penBack);

    var penLeftGeo = new THREE.BoxGeometry(2, 12, 20);
    var penLeft = new THREE.Mesh(penLeftGeo, penMat);
    penLeft.position.set(30, 6, -20);
    penLeft.castShadow = true;
    penLeft.receiveShadow = true;
    penGroup.add(penLeft);
    environmentObjects.push(penLeft);

    var penRight = new THREE.Mesh(penLeftGeo, penMat);
    penRight.position.set(50, 6, -20);
    penRight.castShadow = true;
    penRight.receiveShadow = true;
    penGroup.add(penRight);
    environmentObjects.push(penRight);

    // Submarine inside pen
    var subHullGeo = new THREE.CylinderGeometry(2, 2, 15, 16);
    var subMat = new THREE.MeshStandardMaterial({ color: 0x3a3a3a });
    var subHull = new THREE.Mesh(subHullGeo, subMat);
    subHull.position.set(40, 3, -20);
    subHull.rotation.z = Math.PI / 2;
    subHull.castShadow = true;
    subHull.receiveShadow = true;
    penGroup.add(subHull);
    environmentObjects.push(subHull);

    // Submarine conning tower
    var conningGeo = new THREE.CylinderGeometry(1.2, 1.2, 3, 12);
    var conning = new THREE.Mesh(conningGeo, subMat);
    conning.position.set(40, 5, -20);
    conning.castShadow = true;
    conning.receiveShadow = true;
    penGroup.add(conning);
    environmentObjects.push(conning);

    scene.add(penGroup);
  }

  function createSeaMines() {
    var mineGroup = new THREE.Group();

    // Create multiple sea mines
    for (var i = 0; i < 4; i++) {
      var mineBodyGeo = new THREE.SphereGeometry(1.5, 12, 12);
      var mineMat = new THREE.MeshStandardMaterial({ color: 0x2a2a2a });
      var mineBody = new THREE.Mesh(mineBodyGeo, mineMat);
      mineBody.position.set(-25 + i * 18, 0.5, -50 + Math.random() * 10);
      mineBody.castShadow = true;
      mineBody.receiveShadow = true;
      mineBody.userData.isMine = true;
      mineBody.userData.baseY = mineBody.position.y;
      mineGroup.add(mineBody);
      environmentObjects.push(mineBody);

      // Spike protrusions
      for (var j = 0; j < 6; j++) {
        var spikeGeo = new THREE.CylinderGeometry(0.25, 0.25, 2, 6);
        var spikeMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a });
        var spike = new THREE.Mesh(spikeGeo, spikeMat);
        var angle = (j / 6) * Math.PI * 2;
        spike.position.set(
          mineBody.position.x + Math.cos(angle) * 1.8,
          mineBody.position.y + 0.5 + Math.sin(angle) * 0.5,
          mineBody.position.z + Math.sin(angle) * 1.5
        );
        spike.rotation.z = angle;
        spike.castShadow = true;
        spike.receiveShadow = true;
        mineGroup.add(spike);
        environmentObjects.push(spike);
      }
    }

    scene.add(mineGroup);
  }

  function createHarborWater() {
    var waterGeo = new THREE.BoxGeometry(80, 0.5, 80);
    var waterMat = new THREE.MeshStandardMaterial({ color: WATER_COLOR });
    waterMat.metalness = 0.1;
    waterMat.roughness = 0.6;
    var water = new THREE.Mesh(waterGeo, waterMat);
    water.position.set(0, -0.8, 0);
    water.receiveShadow = true;
    scene.add(water);
    environmentObjects.push(water);
  }

  function createAntiShipGunBatteries() {
    var batteryGroup = new THREE.Group();

    // Gun battery 1 (left side)
    var platformGeo = new THREE.BoxGeometry(8, 1, 8);
    var platformMat = new THREE.MeshStandardMaterial({ color: DOCK_COLOR });
    var platform1 = new THREE.Mesh(platformGeo, platformMat);
    platform1.position.set(-35, 0.5, -60);
    platform1.castShadow = true;
    platform1.receiveShadow = true;
    batteryGroup.add(platform1);
    environmentObjects.push(platform1);

    // Large gun barrel
    var gunGeo1 = new THREE.CylinderGeometry(0.8, 0.8, 10, 12);
    var gunMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a });
    var gun1 = new THREE.Mesh(gunGeo1, gunMat);
    gun1.position.set(-35, 3, -60);
    gun1.rotation.z = -0.4;
    gun1.castShadow = true;
    gun1.receiveShadow = true;
    gun1.userData.isGun = true;
    batteryGroup.add(gun1);
    environmentObjects.push(gun1);

    // Gun breach (cylinder)
    var breachGeo = new THREE.CylinderGeometry(1.5, 1.5, 2, 12);
    var breach1 = new THREE.Mesh(breachGeo, gunMat);
    breach1.position.set(-35, 2.5, -60);
    breach1.castShadow = true;
    breach1.receiveShadow = true;
    batteryGroup.add(breach1);
    environmentObjects.push(breach1);

    // Gun battery 2 (right side)
    var platform2 = new THREE.Mesh(platformGeo, platformMat);
    platform2.position.set(35, 0.5, -60);
    platform2.castShadow = true;
    platform2.receiveShadow = true;
    batteryGroup.add(platform2);
    environmentObjects.push(platform2);

    var gun2 = new THREE.Mesh(gunGeo1, gunMat);
    gun2.position.set(35, 3, -60);
    gun2.rotation.z = -0.4;
    gun2.castShadow = true;
    gun2.receiveShadow = true;
    gun2.userData.isGun = true;
    batteryGroup.add(gun2);
    environmentObjects.push(gun2);

    var breach2 = new THREE.Mesh(breachGeo, gunMat);
    breach2.position.set(35, 2.5, -60);
    breach2.castShadow = true;
    breach2.receiveShadow = true;
    batteryGroup.add(breach2);
    environmentObjects.push(breach2);

    scene.add(batteryGroup);
  }

  function createShipFire() {
    var fireGroup = new THREE.Group();

    // Fire clusters on damaged vessel (destroyer 1)
    for (var i = 0; i < 5; i++) {
      var fireGeo = new THREE.SphereGeometry(1.5 + Math.random() * 0.8, 8, 8);
      var fireMat = new THREE.MeshStandardMaterial({
        color: FIRE_COLOR,
        emissive: 0xff4500,
        emissiveIntensity: 0.8
      });
      var fire = new THREE.Mesh(fireGeo, fireMat);
      fire.position.set(-15 + Math.random() * 4, 12 + Math.random() * 3, -8 + Math.random() * 4);
      fire.castShadow = true;
      fire.userData.isFire = true;
      fire.userData.baseScale = 1;
      fireGroup.add(fire);
      environmentObjects.push(fire);
    }

    scene.add(fireGroup);
  }

  function init(sceneParam, cameraParam) {
    scene = sceneParam;
    camera = cameraParam;
    environmentObjects = [];
    animationState = {
      fireFlicker: 0,
      craneRotation: 0,
      mineBob: 0
    };

    createHarborWater();
    createDockPiers();
    createDestroyerHulls();
    createDryDock();
    createDockyardCranes();
    createNavalWarehouses();
    createTorpedoBoat();
    createAmmoHandlingCrane();
    createDockControlTower();
    createSubmarinePen();
    createSeaMines();
    createAntiShipGunBatteries();
    createShipFire();

    return environmentObjects.length;
  }

  function update(delta) {
    if (!scene) return;

    animationState.fireFlicker += delta;
    animationState.craneRotation += delta * 0.3;
    animationState.mineBob += delta;

    // Animate fire flickering
    var fireObjects = scene.children.flatMap(function(obj) {
      return obj.children ? obj.children.filter(function(child) { return child.userData.isFire; }) : [];
    });
    fireObjects.forEach(function(fire) {
      var flicker = 0.8 + Math.sin(animationState.fireFlicker * 5) * 0.2;
      fire.scale.set(flicker, flicker, flicker);
      fire.material.emissiveIntensity = 0.6 + Math.sin(animationState.fireFlicker * 8) * 0.4;
    });

    // Animate crane arm movement
    var craneArms = scene.children.flatMap(function(obj) {
      return obj.children ? obj.children.filter(function(child) {
        return child.userData.isArmLeft || child.userData.isArmRight;
      }) : [];
    });
    craneArms.forEach(function(arm) {
      arm.rotation.y = Math.sin(animationState.craneRotation) * 0.5;
    });

    // Animate mine bobbing
    var mines = scene.children.flatMap(function(obj) {
      return obj.children ? obj.children.filter(function(child) { return child.userData.isMine; }) : [];
    });
    mines.forEach(function(mine) {
      mine.position.y = mine.userData.baseY + Math.sin(animationState.mineBob + mine.position.x * 0.1) * 0.5;
    });
  }

  function reset() {
    if (!scene) return;

    environmentObjects.forEach(function(obj) {
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        if (Array.isArray(obj.material)) {
          obj.material.forEach(function(mat) { mat.dispose(); });
        } else {
          obj.material.dispose();
        }
      }
      scene.remove(obj);
    });

    environmentObjects = [];
    animationState = {
      fireFlicker: 0,
      craneRotation: 0,
      mineBob: 0
    };
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
