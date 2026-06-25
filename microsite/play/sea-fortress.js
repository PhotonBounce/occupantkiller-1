window.SeaFortress = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var fortressObjects = [];
  var wavefoamObjects = [];
  var animatedObjects = [];
  var rotatingObjects = [];
  var wavingObjects = [];
  var time = 0;

  function createMaterial(color, props) {
    var materialProps = {
      color: color,
      side: THREE.DoubleSide
    };
    if (props) {
      for (var key in props) {
        if (props.hasOwnProperty(key)) {
          materialProps[key] = props[key];
        }
      }
    }
    return new THREE.MeshStandardMaterial(materialProps);
  }

  function addToFortress(mesh) {
    fortressObjects.push(mesh);
    scene.add(mesh);
  }

  function createRockyOutcrops() {
    var oceanFloorY = -15;
    var rockyMaterial = createMaterial(0x4a5568, { roughness: 0.8, metalness: 0.1 });

    // Large central rock formation
    var rock1Geom = new THREE.BoxGeometry(12, 18, 14);
    var rock1 = new THREE.Mesh(rock1Geom, rockyMaterial);
    rock1.position.set(0, oceanFloorY + 9, 0);
    rock1.scale.set(0.95, 1, 0.92);
    rock1.castShadow = true;
    rock1.receiveShadow = true;
    addToFortress(rock1);

    // Left flank rock
    var rock2Geom = new THREE.BoxGeometry(10, 12, 10);
    var rock2 = new THREE.Mesh(rock2Geom, rockyMaterial);
    rock2.position.set(-18, oceanFloorY + 8, -8);
    rock2.rotation.set(0.15, 0.3, -0.1);
    rock2.scale.set(0.88, 0.95, 0.9);
    rock2.castShadow = true;
    rock2.receiveShadow = true;
    addToFortress(rock2);

    // Right flank rock
    var rock3Geom = new THREE.BoxGeometry(11, 13, 11);
    var rock3 = new THREE.Mesh(rock3Geom, rockyMaterial);
    rock3.position.set(20, oceanFloorY + 7, 5);
    rock3.rotation.set(-0.12, -0.25, 0.08);
    rock3.scale.set(0.92, 0.93, 0.91);
    rock3.castShadow = true;
    rock3.receiveShadow = true;
    addToFortress(rock3);

    // Front ledge rock
    var rock4Geom = new THREE.BoxGeometry(14, 8, 8);
    var rock4 = new THREE.Mesh(rock4Geom, rockyMaterial);
    rock4.position.set(0, oceanFloorY + 4, 20);
    rock4.rotation.set(0.1, 0, -0.05);
    rock4.scale.set(0.94, 0.97, 0.93);
    rock4.castShadow = true;
    rock4.receiveShadow = true;
    addToFortress(rock4);

    // Back ledge rock
    var rock5Geom = new THREE.BoxGeometry(13, 7, 9);
    var rock5 = new THREE.Mesh(rock5Geom, rockyMaterial);
    rock5.position.set(0, oceanFloorY + 3, -22);
    rock5.rotation.set(-0.08, 0, 0.06);
    rock5.scale.set(0.93, 0.96, 0.94);
    rock5.castShadow = true;
    rock5.receiveShadow = true;
    addToFortress(rock5);

    // Lower left rocky detail
    var rock6Geom = new THREE.BoxGeometry(7, 5, 6);
    var rock6 = new THREE.Mesh(rock6Geom, rockyMaterial);
    rock6.position.set(-12, oceanFloorY + 2, -12);
    rock6.rotation.set(0.2, -0.15, 0.1);
    rock6.castShadow = true;
    rock6.receiveShadow = true;
    addToFortress(rock6);

    // Lower right rocky detail
    var rock7Geom = new THREE.BoxGeometry(6, 5, 7);
    var rock7 = new THREE.Mesh(rock7Geom, rockyMaterial);
    rock7.position.set(14, oceanFloorY + 2, 14);
    rock7.rotation.set(-0.18, 0.2, -0.12);
    rock7.castShadow = true;
    rock7.receiveShadow = true;
    addToFortress(rock7);
  }

  function createOceanSurface() {
    var oceanMaterial = createMaterial(0x3a4a5a, { roughness: 0.6, metalness: 0.3 });
    var oceanGeom = new THREE.BoxGeometry(160, 2, 160);
    var ocean = new THREE.Mesh(oceanGeom, oceanMaterial);
    ocean.position.set(0, -30, 0);
    ocean.castShadow = true;
    ocean.receiveShadow = true;
    addToFortress(ocean);
  }

  function createFortressWalls() {
    var wallMaterial = createMaterial(0x6b7280, { roughness: 0.9, metalness: 0.05 });

    // Main front wall
    var wallFrontGeom = new THREE.BoxGeometry(16, 6, 1.2);
    var wallFront = new THREE.Mesh(wallFrontGeom, wallMaterial);
    wallFront.position.set(0, 4, 10);
    wallFront.castShadow = true;
    wallFront.receiveShadow = true;
    addToFortress(wallFront);

    // Main back wall
    var wallBackGeom = new THREE.BoxGeometry(16, 6, 1.2);
    var wallBack = new THREE.Mesh(wallBackGeom, wallMaterial);
    wallBack.position.set(0, 4, -10);
    wallBack.castShadow = true;
    wallBack.receiveShadow = true;
    addToFortress(wallBack);

    // Left connecting wall
    var wallLeftGeom = new THREE.BoxGeometry(1.2, 5.5, 18);
    var wallLeft = new THREE.Mesh(wallLeftGeom, wallMaterial);
    wallLeft.position.set(-8, 3.5, 0);
    wallLeft.castShadow = true;
    wallLeft.receiveShadow = true;
    addToFortress(wallLeft);

    // Right connecting wall
    var wallRightGeom = new THREE.BoxGeometry(1.2, 5.5, 18);
    var wallRight = new THREE.Mesh(wallRightGeom, wallMaterial);
    wallRight.position.set(8, 3.5, 0);
    wallRight.castShadow = true;
    wallRight.receiveShadow = true;
    addToFortress(wallRight);

    // Corner reinforcement left-front
    var cornerLFGeom = new THREE.BoxGeometry(2, 6, 2);
    var cornerLF = new THREE.Mesh(cornerLFGeom, wallMaterial);
    cornerLF.position.set(-8, 4, 10);
    cornerLF.castShadow = true;
    cornerLF.receiveShadow = true;
    addToFortress(cornerLF);

    // Corner reinforcement right-front
    var cornerRFGeom = new THREE.BoxGeometry(2, 6, 2);
    var cornerRF = new THREE.Mesh(cornerRFGeom, wallMaterial);
    cornerRF.position.set(8, 4, 10);
    cornerRF.castShadow = true;
    cornerRF.receiveShadow = true;
    addToFortress(cornerRF);

    // Corner reinforcement left-back
    var cornerLBGeom = new THREE.BoxGeometry(2, 6, 2);
    var cornerLB = new THREE.Mesh(cornerLBGeom, wallMaterial);
    cornerLB.position.set(-8, 4, -10);
    cornerLB.castShadow = true;
    cornerLB.receiveShadow = true;
    addToFortress(cornerLB);

    // Corner reinforcement right-back
    var cornerRBGeom = new THREE.BoxGeometry(2, 6, 2);
    var cornerRB = new THREE.Mesh(cornerRBGeom, wallMaterial);
    cornerRB.position.set(8, 4, -10);
    cornerRB.castShadow = true;
    cornerRB.receiveShadow = true;
    addToFortress(cornerRB);
  }

  function createSeaFortressTowers() {
    var towerMaterial = createMaterial(0x5a6a7a, { roughness: 0.85, metalness: 0.1 });
    var capMaterial = createMaterial(0x8b7355, { roughness: 0.8, metalness: 0.05 });

    // Main lighthouse tower
    var towerMainGeom = new THREE.CylinderGeometry(2.5, 3, 14, 8);
    var towerMain = new THREE.Mesh(towerMainGeom, towerMaterial);
    towerMain.position.set(0, 11, 0);
    towerMain.castShadow = true;
    towerMain.receiveShadow = true;
    addToFortress(towerMain);

    // Main tower cap
    var capMainGeom = new THREE.ConeGeometry(2.8, 3, 8);
    var capMain = new THREE.Mesh(capMainGeom, capMaterial);
    capMain.position.set(0, 19, 0);
    capMain.castShadow = true;
    capMain.receiveShadow = true;
    addToFortress(capMain);

    // Left corner tower
    var towerLeftGeom = new THREE.CylinderGeometry(1.8, 2.3, 10, 8);
    var towerLeft = new THREE.Mesh(towerLeftGeom, towerMaterial);
    towerLeft.position.set(-8, 9, -8);
    towerLeft.castShadow = true;
    towerLeft.receiveShadow = true;
    addToFortress(towerLeft);

    // Left corner tower cap
    var capLeftGeom = new THREE.ConeGeometry(2, 2.4, 8);
    var capLeft = new THREE.Mesh(capLeftGeom, capMaterial);
    capLeft.position.set(-8, 15, -8);
    capLeft.castShadow = true;
    capLeft.receiveShadow = true;
    addToFortress(capLeft);

    // Right corner tower
    var towerRightGeom = new THREE.CylinderGeometry(1.8, 2.3, 10, 8);
    var towerRight = new THREE.Mesh(towerRightGeom, towerMaterial);
    towerRight.position.set(8, 9, 8);
    towerRight.castShadow = true;
    towerRight.receiveShadow = true;
    addToFortress(towerRight);

    // Right corner tower cap
    var capRightGeom = new THREE.ConeGeometry(2, 2.4, 8);
    var capRight = new THREE.Mesh(capRightGeom, capMaterial);
    capRight.position.set(8, 15, 8);
    capRight.castShadow = true;
    capRight.receiveShadow = true;
    addToFortress(capRight);

    // Watch tower front
    var towerFrontGeom = new THREE.CylinderGeometry(1.5, 2, 8, 8);
    var towerFront = new THREE.Mesh(towerFrontGeom, towerMaterial);
    towerFront.position.set(0, 8, 12);
    towerFront.castShadow = true;
    towerFront.receiveShadow = true;
    addToFortress(towerFront);

    // Watch tower front cap
    var capFrontGeom = new THREE.ConeGeometry(1.7, 2, 8);
    var capFront = new THREE.Mesh(capFrontGeom, capMaterial);
    capFront.position.set(0, 13, 12);
    capFront.castShadow = true;
    capFront.receiveShadow = true;
    addToFortress(capFront);
  }

  function createNavalGunBattery() {
    var batteryMaterial = createMaterial(0x5a6a7a, { roughness: 0.85, metalness: 0.1 });
    var barrelMaterial = createMaterial(0x444444, { roughness: 0.6, metalness: 0.7 });

    // Left battery emplacement
    var batteryLeftGeom = new THREE.BoxGeometry(3, 2, 4);
    var batteryLeft = new THREE.Mesh(batteryLeftGeom, batteryMaterial);
    batteryLeft.position.set(-6, 3, 6);
    batteryLeft.castShadow = true;
    batteryLeft.receiveShadow = true;
    addToFortress(batteryLeft);

    // Left gun barrel
    var barrelLeftGeom = new THREE.CylinderGeometry(0.4, 0.45, 6, 8);
    var barrelLeft = new THREE.Mesh(barrelLeftGeom, barrelMaterial);
    barrelLeft.rotation.z = 0.3;
    barrelLeft.position.set(-6, 5.5, 9);
    barrelLeft.castShadow = true;
    barrelLeft.receiveShadow = true;
    addToFortress(barrelLeft);

    // Right battery emplacement
    var batteryRightGeom = new THREE.BoxGeometry(3, 2, 4);
    var batteryRight = new THREE.Mesh(batteryRightGeom, batteryMaterial);
    batteryRight.position.set(6, 3, 6);
    batteryRight.castShadow = true;
    batteryRight.receiveShadow = true;
    addToFortress(batteryRight);

    // Right gun barrel
    var barrelRightGeom = new THREE.CylinderGeometry(0.4, 0.45, 6, 8);
    var barrelRight = new THREE.Mesh(barrelRightGeom, barrelMaterial);
    barrelRight.rotation.z = 0.3;
    barrelRight.position.set(6, 5.5, 9);
    barrelRight.castShadow = true;
    barrelRight.receiveShadow = true;
    addToFortress(barrelRight);

    // Center battery emplacement
    var batteryCenterGeom = new THREE.BoxGeometry(4, 2.5, 3.5);
    var batteryCenter = new THREE.Mesh(batteryCenterGeom, batteryMaterial);
    batteryCenter.position.set(0, 3.2, 7);
    batteryCenter.castShadow = true;
    batteryCenter.receiveShadow = true;
    addToFortress(batteryCenter);

    // Center gun barrel
    var barrelCenterGeom = new THREE.CylinderGeometry(0.5, 0.55, 8, 8);
    var barrelCenter = new THREE.Mesh(barrelCenterGeom, barrelMaterial);
    barrelCenter.rotation.z = 0.25;
    barrelCenter.position.set(0, 6.5, 11);
    barrelCenter.castShadow = true;
    barrelCenter.receiveShadow = true;
    addToFortress(barrelCenter);
  }

  function createHarborEntrance() {
    var gateMaterial = createMaterial(0x6b7280, { roughness: 0.9, metalness: 0.1 });
    var chainMaterial = createMaterial(0x333333, { roughness: 0.5, metalness: 0.9 });

    // Left gate post
    var gateLeftGeom = new THREE.BoxGeometry(1.5, 7, 1.5);
    var gateLeft = new THREE.Mesh(gateLeftGeom, gateMaterial);
    gateLeft.position.set(-5, 5, 18);
    gateLeft.castShadow = true;
    gateLeft.receiveShadow = true;
    addToFortress(gateLeft);

    // Right gate post
    var gateRightGeom = new THREE.BoxGeometry(1.5, 7, 1.5);
    var gateRight = new THREE.Mesh(gateRightGeom, gateMaterial);
    gateRight.position.set(5, 5, 18);
    gateRight.castShadow = true;
    gateRight.receiveShadow = true;
    addToFortress(gateRight);

    // Top gate structure
    var gateTopGeom = new THREE.BoxGeometry(11, 1.2, 1);
    var gateTop = new THREE.Mesh(gateTopGeom, gateMaterial);
    gateTop.position.set(0, 9.5, 18);
    gateTop.castShadow = true;
    gateTop.receiveShadow = true;
    addToFortress(gateTop);

    // Chain barrier left strand
    var chainPoints1 = [
      new THREE.Vector3(-4, 6.5, 18),
      new THREE.Vector3(-4, 3, 20)
    ];
    var chainGeom1 = new THREE.BufferGeometry().setFromPoints(chainPoints1);
    var chain1 = new THREE.LineSegments(chainGeom1, new THREE.LineBasicMaterial({ color: 0x333333, linewidth: 4 }));
    addToFortress(chain1);

    // Chain barrier middle-left strand
    var chainPoints2 = [
      new THREE.Vector3(-1, 6.5, 18),
      new THREE.Vector3(-1, 3, 20)
    ];
    var chainGeom2 = new THREE.BufferGeometry().setFromPoints(chainPoints2);
    var chain2 = new THREE.LineSegments(chainGeom2, new THREE.LineBasicMaterial({ color: 0x333333, linewidth: 4 }));
    addToFortress(chain2);

    // Chain barrier middle-right strand
    var chainPoints3 = [
      new THREE.Vector3(1, 6.5, 18),
      new THREE.Vector3(1, 3, 20)
    ];
    var chainGeom3 = new THREE.BufferGeometry().setFromPoints(chainPoints3);
    var chain3 = new THREE.LineSegments(chainGeom3, new THREE.LineBasicMaterial({ color: 0x333333, linewidth: 4 }));
    addToFortress(chain3);

    // Chain barrier right strand
    var chainPoints4 = [
      new THREE.Vector3(4, 6.5, 18),
      new THREE.Vector3(4, 3, 20)
    ];
    var chainGeom4 = new THREE.BufferGeometry().setFromPoints(chainPoints4);
    var chain4 = new THREE.LineSegments(chainGeom4, new THREE.LineBasicMaterial({ color: 0x333333, linewidth: 4 }));
    addToFortress(chain4);
  }

  function createBoatDock() {
    var dockMaterial = createMaterial(0x8b7355, { roughness: 0.9, metalness: 0.05 });
    var boatMaterial = createMaterial(0x1a3a4a, { roughness: 0.7, metalness: 0.2 });
    var engineMaterial = createMaterial(0x666666, { roughness: 0.6, metalness: 0.5 });

    // Dock platform
    var dockGeom = new THREE.BoxGeometry(10, 0.8, 8);
    var dock = new THREE.Mesh(dockGeom, dockMaterial);
    dock.position.set(-12, 0.5, -12);
    dock.castShadow = true;
    dock.receiveShadow = true;
    addToFortress(dock);

    // Dock support post left
    var postLeftGeom = new THREE.BoxGeometry(0.6, 3, 0.6);
    var postLeft = new THREE.Mesh(postLeftGeom, dockMaterial);
    postLeft.position.set(-8, 1.5, -12);
    postLeft.castShadow = true;
    postLeft.receiveShadow = true;
    addToFortress(postLeft);

    // Dock support post right
    var postRightGeom = new THREE.BoxGeometry(0.6, 3, 0.6);
    var postRight = new THREE.Mesh(postRightGeom, dockMaterial);
    postRight.position.set(-16, 1.5, -12);
    postRight.castShadow = true;
    postRight.receiveShadow = true;
    addToFortress(postRight);

    // Patrol boat hull
    var boatHullGeom = new THREE.BoxGeometry(3.5, 1.5, 6);
    var boatHull = new THREE.Mesh(boatHullGeom, boatMaterial);
    boatHull.position.set(-12, 1.5, -10);
    boatHull.castShadow = true;
    boatHull.receiveShadow = true;
    addToFortress(boatHull);

    // Boat cabin
    var boatCabinGeom = new THREE.BoxGeometry(2, 1.2, 2);
    var boatCabin = new THREE.Mesh(boatCabinGeom, boatMaterial);
    boatCabin.position.set(-12, 2.8, -9);
    boatCabin.castShadow = true;
    boatCabin.receiveShadow = true;
    addToFortress(boatCabin);

    // Boat engine (cylinder)
    var boatEngineGeom = new THREE.CylinderGeometry(0.5, 0.5, 2, 6);
    var boatEngine = new THREE.Mesh(boatEngineGeom, engineMaterial);
    boatEngine.position.set(-12, 1.8, -8);
    boatEngine.castShadow = true;
    boatEngine.receiveShadow = true;
    addToFortress(boatEngine);

    // Dock rope left
    var ropePoints1 = [
      new THREE.Vector3(-8, 1.5, -12),
      new THREE.Vector3(-10, 2.5, -10)
    ];
    var ropeGeom1 = new THREE.BufferGeometry().setFromPoints(ropePoints1);
    var rope1 = new THREE.LineSegments(ropeGeom1, new THREE.LineBasicMaterial({ color: 0x8b4513, linewidth: 3 }));
    addToFortress(rope1);

    // Dock rope right
    var ropePoints2 = [
      new THREE.Vector3(-16, 1.5, -12),
      new THREE.Vector3(-14, 2.5, -10)
    ];
    var ropeGeom2 = new THREE.BufferGeometry().setFromPoints(ropePoints2);
    var rope2 = new THREE.LineSegments(ropeGeom2, new THREE.LineBasicMaterial({ color: 0x8b4513, linewidth: 3 }));
    addToFortress(rope2);
  }

  function createBarracksBuilding() {
    var barracksMaterial = createMaterial(0x7a8a9a, { roughness: 0.8, metalness: 0.1 });
    var roofMaterial = createMaterial(0x5a3a2a, { roughness: 0.85, metalness: 0.05 });

    // Main barracks structure
    var barracksGeom = new THREE.BoxGeometry(8, 5, 10);
    var barracks = new THREE.Mesh(barracksGeom, barracksMaterial);
    barracks.position.set(14, 3, 2);
    barracks.castShadow = true;
    barracks.receiveShadow = true;
    addToFortress(barracks);

    // Barracks roof left
    var roofLeftGeom = new THREE.BoxGeometry(8.2, 0.6, 5.2);
    var roofLeft = new THREE.Mesh(roofLeftGeom, roofMaterial);
    roofLeft.position.set(14, 6, -2);
    roofLeft.castShadow = true;
    roofLeft.receiveShadow = true;
    addToFortress(roofLeft);

    // Barracks roof right
    var roofRightGeom = new THREE.BoxGeometry(8.2, 0.6, 5.2);
    var roofRight = new THREE.Mesh(roofRightGeom, roofMaterial);
    roofRight.position.set(14, 6, 6);
    roofRight.castShadow = true;
    roofRight.receiveShadow = true;
    addToFortress(roofRight);

    // Door frame
    var doorGeom = new THREE.BoxGeometry(1.2, 2.2, 0.3);
    var door = new THREE.Mesh(doorGeom, createMaterial(0x3a2a1a));
    door.position.set(14, 2, 6.8);
    door.castShadow = true;
    door.receiveShadow = true;
    addToFortress(door);

    // Window 1
    var window1Geom = new THREE.BoxGeometry(1.2, 1.2, 0.2);
    var window1 = new THREE.Mesh(window1Geom, createMaterial(0x4a6a7a));
    window1.position.set(10, 3.5, 6.8);
    window1.castShadow = true;
    window1.receiveShadow = true;
    addToFortress(window1);

    // Window 2
    var window2Geom = new THREE.BoxGeometry(1.2, 1.2, 0.2);
    var window2 = new THREE.Mesh(window2Geom, createMaterial(0x4a6a7a));
    window2.position.set(18, 3.5, 6.8);
    window2.castShadow = true;
    window2.receiveShadow = true;
    addToFortress(window2);

    // Window 3
    var window3Geom = new THREE.BoxGeometry(1.2, 1.2, 0.2);
    var window3 = new THREE.Mesh(window3Geom, createMaterial(0x4a6a7a));
    window3.position.set(10, 3.5, -2.5);
    window3.castShadow = true;
    window3.receiveShadow = true;
    addToFortress(window3);

    // Window 4
    var window4Geom = new THREE.BoxGeometry(1.2, 1.2, 0.2);
    var window4 = new THREE.Mesh(window4Geom, createMaterial(0x4a6a7a));
    window4.position.set(18, 3.5, -2.5);
    window4.castShadow = true;
    window4.receiveShadow = true;
    addToFortress(window4);
  }

  function createSupplyTunnel() {
    var tunnelMaterial = createMaterial(0x5a6a7a, { roughness: 0.85, metalness: 0.1 });

    // Tunnel opening entrance
    var tunnelEntranceGeom = new THREE.BoxGeometry(3, 3, 0.5);
    var tunnelEntrance = new THREE.Mesh(tunnelEntranceGeom, tunnelMaterial);
    tunnelEntrance.position.set(-10, 2, 0);
    tunnelEntrance.castShadow = true;
    tunnelEntrance.receiveShadow = true;
    addToFortress(tunnelEntrance);

    // Tunnel structure section 1
    var tunnelSec1Geom = new THREE.BoxGeometry(2.8, 2.8, 4);
    var tunnelSec1 = new THREE.Mesh(tunnelSec1Geom, tunnelMaterial);
    tunnelSec1.position.set(-10, 2, -3);
    tunnelSec1.castShadow = true;
    tunnelSec1.receiveShadow = true;
    addToFortress(tunnelSec1);

    // Tunnel structure section 2
    var tunnelSec2Geom = new THREE.BoxGeometry(2.8, 2.8, 4);
    var tunnelSec2 = new THREE.Mesh(tunnelSec2Geom, tunnelMaterial);
    tunnelSec2.position.set(-10, 2, -7);
    tunnelSec2.castShadow = true;
    tunnelSec2.receiveShadow = true;
    addToFortress(tunnelSec2);

    // Tunnel support beam 1
    var beamGeom = new THREE.BoxGeometry(0.4, 2.2, 1.5);
    var beam1 = new THREE.Mesh(beamGeom, tunnelMaterial);
    beam1.position.set(-8.5, 1.5, -5);
    beam1.castShadow = true;
    beam1.receiveShadow = true;
    addToFortress(beam1);

    // Tunnel support beam 2
    var beam2 = new THREE.Mesh(beamGeom, tunnelMaterial);
    beam2.position.set(-11.5, 1.5, -5);
    beam2.castShadow = true;
    beam2.receiveShadow = true;
    addToFortress(beam2);

    // Tunnel interior detail block 1
    var interiorGeom = new THREE.BoxGeometry(0.8, 0.8, 0.8);
    var interior1 = new THREE.Mesh(interiorGeom, createMaterial(0x444444));
    interior1.position.set(-10, 0.5, -5);
    interior1.castShadow = true;
    interior1.receiveShadow = true;
    addToFortress(interior1);
  }

  function createCoastalArtillery() {
    var platformMaterial = createMaterial(0x6b7280, { roughness: 0.85, metalness: 0.1 });
    var barrelMaterial = createMaterial(0x333333, { roughness: 0.6, metalness: 0.8 });

    // Large gun platform 1 left
    var platform1Geom = new THREE.BoxGeometry(5, 1.5, 6);
    var platform1 = new THREE.Mesh(platform1Geom, platformMaterial);
    platform1.position.set(-15, 2.5, 8);
    platform1.castShadow = true;
    platform1.receiveShadow = true;
    addToFortress(platform1);

    // Large barrel 1
    var barrelHeavyGeom = new THREE.CylinderGeometry(0.55, 0.65, 12, 8);
    var barrel1 = new THREE.Mesh(barrelHeavyGeom, barrelMaterial);
    barrel1.rotation.z = 0.4;
    barrel1.position.set(-15, 6, 12);
    barrel1.castShadow = true;
    barrel1.receiveShadow = true;
    addToFortress(barrel1);

    // Barrel breech reinforcement
    var breechGeom = new THREE.BoxGeometry(1.5, 1.5, 2);
    var breech1 = new THREE.Mesh(breechGeom, barrelMaterial);
    breech1.position.set(-15, 4.5, 6);
    breech1.castShadow = true;
    breech1.receiveShadow = true;
    addToFortress(breech1);

    // Large gun platform 2 right
    var platform2Geom = new THREE.BoxGeometry(5, 1.5, 6);
    var platform2 = new THREE.Mesh(platform2Geom, platformMaterial);
    platform2.position.set(15, 2.5, 8);
    platform2.castShadow = true;
    platform2.receiveShadow = true;
    addToFortress(platform2);

    // Large barrel 2
    var barrel2 = new THREE.Mesh(barrelHeavyGeom, barrelMaterial);
    barrel2.rotation.z = 0.4;
    barrel2.position.set(15, 6, 12);
    barrel2.castShadow = true;
    barrel2.receiveShadow = true;
    addToFortress(barrel2);

    // Barrel breech reinforcement 2
    var breech2 = new THREE.Mesh(breechGeom, barrelMaterial);
    breech2.position.set(15, 4.5, 6);
    breech2.castShadow = true;
    breech2.receiveShadow = true;
    addToFortress(breech2);

    // Platform support pillar 1
    var pillarGeom = new THREE.BoxGeometry(0.8, 2, 0.8);
    var pillar1 = new THREE.Mesh(pillarGeom, platformMaterial);
    pillar1.position.set(-15, 1, 8);
    pillar1.castShadow = true;
    pillar1.receiveShadow = true;
    addToFortress(pillar1);

    // Platform support pillar 2
    var pillar2 = new THREE.Mesh(pillarGeom, platformMaterial);
    pillar2.position.set(15, 1, 8);
    pillar2.castShadow = true;
    pillar2.receiveShadow = true;
    addToFortress(pillar2);
  }

  function createTorpedoStorage() {
    var storeMaterial = createMaterial(0x6a7a8a, { roughness: 0.8, metalness: 0.1 });
    var torpedoMaterial = createMaterial(0x4a4a4a, { roughness: 0.7, metalness: 0.6 });

    // Storage building main
    var storeGeom = new THREE.BoxGeometry(6, 4, 8);
    var store = new THREE.Mesh(storeGeom, storeMaterial);
    store.position.set(-12, 3, 8);
    store.castShadow = true;
    store.receiveShadow = true;
    addToFortress(store);

    // Torpedo shape 1 left
    var torpedoGeom = new THREE.CylinderGeometry(0.4, 0.35, 4, 6);
    var torpedo1 = new THREE.Mesh(torpedoGeom, torpedoMaterial);
    torpedo1.rotation.x = Math.PI / 2;
    torpedo1.position.set(-14, 2, 8);
    torpedo1.castShadow = true;
    torpedo1.receiveShadow = true;
    addToFortress(torpedo1);

    // Torpedo shape 2 center
    var torpedo2 = new THREE.Mesh(torpedoGeom, torpedoMaterial);
    torpedo2.rotation.x = Math.PI / 2;
    torpedo2.position.set(-12, 2, 8);
    torpedo2.castShadow = true;
    torpedo2.receiveShadow = true;
    addToFortress(torpedo2);

    // Torpedo shape 3 right
    var torpedo3 = new THREE.Mesh(torpedoGeom, torpedoMaterial);
    torpedo3.rotation.x = Math.PI / 2;
    torpedo3.position.set(-10, 2, 8);
    torpedo3.castShadow = true;
    torpedo3.receiveShadow = true;
    addToFortress(torpedo3);

    // Torpedo tip 1
    var tipGeom = new THREE.ConeGeometry(0.4, 0.8, 6);
    var tip1 = new THREE.Mesh(tipGeom, torpedoMaterial);
    tip1.rotation.x = Math.PI / 2;
    tip1.position.set(-16, 2, 8);
    tip1.castShadow = true;
    tip1.receiveShadow = true;
    addToFortress(tip1);

    // Torpedo tip 2
    var tip2 = new THREE.Mesh(tipGeom, torpedoMaterial);
    tip2.rotation.x = Math.PI / 2;
    tip2.position.set(-14, 2, 6);
    tip2.castShadow = true;
    tip2.receiveShadow = true;
    addToFortress(tip2);

    // Torpedo tip 3
    var tip3 = new THREE.Mesh(tipGeom, torpedoMaterial);
    tip3.rotation.x = Math.PI / 2;
    tip3.position.set(-12, 2, 6);
    tip3.castShadow = true;
    tip3.receiveShadow = true;
    addToFortress(tip3);

    // Storage door
    var doorGeom = new THREE.BoxGeometry(1.5, 2, 0.3);
    var door = new THREE.Mesh(doorGeom, createMaterial(0x3a2a1a));
    door.position.set(-12, 2, 12.3);
    door.castShadow = true;
    door.receiveShadow = true;
    addToFortress(door);
  }

  function createWaveAction() {
    var foamMaterial = createMaterial(0xcccccc, { roughness: 0.9, metalness: 0 });

    // Wave foam clusters around rocks
    for (var i = 0; i < 15; i++) {
      var foamGeom = new THREE.SphereGeometry(0.6 + Math.random() * 0.4, 4, 4);
      var foam = new THREE.Mesh(foamGeom, foamMaterial);

      var angle = (i / 15) * Math.PI * 2;
      var radius = 12 + Math.random() * 5;
      foam.position.x = Math.cos(angle) * radius;
      foam.position.z = Math.sin(angle) * radius;
      foam.position.y = -14 + Math.random() * 2;

      foam.castShadow = true;
      foam.receiveShadow = true;
      addToFortress(foam);
      wavefoamObjects.push(foam);
      animatedObjects.push({
        mesh: foam,
        type: 'foam',
        baseY: foam.position.y,
        speed: 0.5 + Math.random() * 1.5
      });
    }
  }

  function createFlagTower() {
    var poleMaterial = createMaterial(0x666666, { roughness: 0.7, metalness: 0.5 });
    var flagMaterial = createMaterial(0x001a4d, { roughness: 0.6, metalness: 0 });

    // Flag pole
    var poleGeom = new THREE.CylinderGeometry(0.35, 0.4, 8, 6);
    var pole = new THREE.Mesh(poleGeom, poleMaterial);
    pole.position.set(0, 14, -8);
    pole.castShadow = true;
    pole.receiveShadow = true;
    addToFortress(pole);

    // Flag panel
    var flagGeom = new THREE.BoxGeometry(3, 2, 0.2);
    var flag = new THREE.Mesh(flagGeom, flagMaterial);
    flag.position.set(2.5, 16, -8);
    flag.castShadow = true;
    flag.receiveShadow = true;
    addToFortress(flag);

    // Track waving motion
    wavingObjects.push({
      mesh: flag,
      baseX: flag.position.x,
      baseY: flag.position.y,
      baseZ: flag.position.z,
      baseRotation: 0,
      speed: 2
    });

    // Top flag finial
    var finialGeom = new THREE.SphereGeometry(0.5, 4, 4);
    var finial = new THREE.Mesh(finialGeom, poleMaterial);
    finial.position.set(0, 18.5, -8);
    finial.castShadow = true;
    finial.receiveShadow = true;
    addToFortress(finial);
  }

  function createSearchlight() {
    var baseMaterial = createMaterial(0x333333, { roughness: 0.6, metalness: 0.7 });

    // Searchlight base
    var baseGeom = new THREE.CylinderGeometry(1.5, 1.8, 1, 8);
    var base = new THREE.Mesh(baseGeom, baseMaterial);
    base.position.set(8, 16, -8);
    base.castShadow = true;
    base.receiveShadow = true;
    addToFortress(base);

    // Searchlight body
    var bodyGeom = new THREE.CylinderGeometry(0.8, 0.8, 2, 8);
    var body = new THREE.Mesh(bodyGeom, baseMaterial);
    body.position.set(8, 18.5, -8);
    body.castShadow = true;
    body.receiveShadow = true;
    addToFortress(body);

    // Searchlight lens
    var lensGeom = new THREE.SphereGeometry(0.7, 6, 6);
    var lens = new THREE.Mesh(lensGeom, createMaterial(0xffff99, { emissive: 0xffff99, emissiveIntensity: 0.3 }));
    lens.position.set(8, 20, -8);
    lens.castShadow = true;
    addToFortress(lens);

    // Track rotation
    rotatingObjects.push({
      mesh: body,
      axis: 'y',
      speed: 1.5
    });
  }

  function createAdditionalStructures() {
    var stoneMaterial = createMaterial(0x6a7a8a, { roughness: 0.85, metalness: 0.08 });

    // Guard post 1
    var guardGeom = new THREE.BoxGeometry(2.5, 3, 2.5);
    var guard1 = new THREE.Mesh(guardGeom, stoneMaterial);
    guard1.position.set(10, 3, -8);
    guard1.castShadow = true;
    guard1.receiveShadow = true;
    addToFortress(guard1);

    // Guard post 2
    var guard2 = new THREE.Mesh(guardGeom, stoneMaterial);
    guard2.position.set(-10, 3, 8);
    guard2.castShadow = true;
    guard2.receiveShadow = true;
    addToFortress(guard2);

    // Small storage shed 1
    var shedGeom = new THREE.BoxGeometry(3, 2.5, 3);
    var shed1 = new THREE.Mesh(shedGeom, stoneMaterial);
    shed1.position.set(18, 2, -6);
    shed1.castShadow = true;
    shed1.receiveShadow = true;
    addToFortress(shed1);

    // Small storage shed 2
    var shed2 = new THREE.Mesh(shedGeom, stoneMaterial);
    shed2.position.set(-18, 2, 6);
    shed2.castShadow = true;
    shed2.receiveShadow = true;
    addToFortress(shed2);

    // Ammunition rack 1
    var rackGeom = new THREE.BoxGeometry(2, 2.5, 1.5);
    var rack1 = new THREE.Mesh(rackGeom, createMaterial(0x5a5a5a, { roughness: 0.7, metalness: 0.4 }));
    rack1.position.set(-4, 1.5, -6);
    rack1.castShadow = true;
    rack1.receiveShadow = true;
    addToFortress(rack1);

    // Ammunition rack 2
    var rack2 = new THREE.Mesh(rackGeom, createMaterial(0x5a5a5a, { roughness: 0.7, metalness: 0.4 }));
    rack2.position.set(4, 1.5, 6);
    rack2.castShadow = true;
    rack2.receiveShadow = true;
    addToFortress(rack2);

    // Water cistern 1
    var cisternGeom = new THREE.CylinderGeometry(1.2, 1.2, 2.5, 6);
    var cistern1 = new THREE.Mesh(cisternGeom, createMaterial(0x4a5a6a, { roughness: 0.6, metalness: 0.5 }));
    cistern1.position.set(12, 2, 4);
    cistern1.castShadow = true;
    cistern1.receiveShadow = true;
    addToFortress(cistern1);

    // Water cistern 2
    var cistern2 = new THREE.Mesh(cisternGeom, createMaterial(0x4a5a6a, { roughness: 0.6, metalness: 0.5 }));
    cistern2.position.set(-12, 2, -4);
    cistern2.castShadow = true;
    cistern2.receiveShadow = true;
    addToFortress(cistern2);

    // Lookout platform extension 1
    var platformGeom = new THREE.BoxGeometry(3, 0.5, 3);
    var platform1 = new THREE.Mesh(platformGeom, stoneMaterial);
    platform1.position.set(10, 10, 0);
    platform1.castShadow = true;
    platform1.receiveShadow = true;
    addToFortress(platform1);

    // Lookout platform extension 2
    var platform2 = new THREE.Mesh(platformGeom, stoneMaterial);
    platform2.position.set(-10, 10, 0);
    platform2.castShadow = true;
    platform2.receiveShadow = true;
    addToFortress(platform2);

    // Radio mast
    var mastGeom = new THREE.CylinderGeometry(0.25, 0.3, 6, 4);
    var mast = new THREE.Mesh(mastGeom, createMaterial(0x444444, { roughness: 0.5, metalness: 0.8 }));
    mast.position.set(-8, 12, 12);
    mast.castShadow = true;
    mast.receiveShadow = true;
    addToFortress(mast);

    // Rock buttress 1
    var buttressGeom = new THREE.BoxGeometry(2, 4, 2);
    var buttress1 = new THREE.Mesh(buttressGeom, stoneMaterial);
    buttress1.position.set(12, 2, -10);
    buttress1.castShadow = true;
    buttress1.receiveShadow = true;
    addToFortress(buttress1);

    // Rock buttress 2
    var buttress2 = new THREE.Mesh(buttressGeom, stoneMaterial);
    buttress2.position.set(-12, 2, 10);
    buttress2.castShadow = true;
    buttress2.receiveShadow = true;
    addToFortress(buttress2);

    // Defense wall segment 1
    var wallSegGeom = new THREE.BoxGeometry(4, 3.5, 0.8);
    var wallSeg1 = new THREE.Mesh(wallSegGeom, stoneMaterial);
    wallSeg1.position.set(-6, 3, 0);
    wallSeg1.castShadow = true;
    wallSeg1.receiveShadow = true;
    addToFortress(wallSeg1);

    // Defense wall segment 2
    var wallSeg2 = new THREE.Mesh(wallSegGeom, stoneMaterial);
    wallSeg2.position.set(6, 3, 0);
    wallSeg2.castShadow = true;
    wallSeg2.receiveShadow = true;
    addToFortress(wallSeg2);

    // Stairway structure 1
    for (var i = 0; i < 4; i++) {
      var stepGeom = new THREE.BoxGeometry(2, 0.6, 2);
      var step = new THREE.Mesh(stepGeom, stoneMaterial);
      step.position.set(0, 5 + i * 0.8, 12 + i * 0.5);
      step.castShadow = true;
      step.receiveShadow = true;
      addToFortress(step);
    }
  }

  function init(sceneArg, cameraArg) {
    scene = sceneArg;
    camera = cameraArg;
    fortressObjects = [];
    wavefoamObjects = [];
    animatedObjects = [];
    rotatingObjects = [];
    wavingObjects = [];
    time = 0;

    createRockyOutcrops();
    createOceanSurface();
    createFortressWalls();
    createSeaFortressTowers();
    createNavalGunBattery();
    createHarborEntrance();
    createBoatDock();
    createBarracksBuilding();
    createSupplyTunnel();
    createCoastalArtillery();
    createTorpedoStorage();
    createWaveAction();
    createFlagTower();
    createSearchlight();
    createAdditionalStructures();

    return fortressObjects.length;
  }

  function update(delta) {
    time += delta;

    // Animate wave foam
    for (var i = 0; i < animatedObjects.length; i++) {
      var animObj = animatedObjects[i];
      if (animObj.type === 'foam') {
        var foamPhase = (time * animObj.speed) % (Math.PI * 2);
        animObj.mesh.position.y = animObj.baseY + Math.sin(foamPhase) * 0.8;
        animObj.mesh.material.opacity = 0.6 + Math.sin(foamPhase) * 0.4;
      }
    }

    // Rotate searchlight and cannons
    for (var j = 0; j < rotatingObjects.length; j++) {
      var rotObj = rotatingObjects[j];
      if (rotObj.axis === 'y') {
        rotObj.mesh.rotation.y += delta * rotObj.speed;
      }
    }

    // Wave flag
    for (var k = 0; k < wavingObjects.length; k++) {
      var waveObj = wavingObjects[k];
      var wavePhase = (time * waveObj.speed) % (Math.PI * 2);
      waveObj.mesh.rotation.z = waveObj.baseRotation + Math.sin(wavePhase) * 0.3;
      waveObj.mesh.position.x = waveObj.baseX + Math.cos(wavePhase) * 0.4;
    }
  }

  function reset() {
    for (var i = fortressObjects.length - 1; i >= 0; i--) {
      scene.remove(fortressObjects[i]);
    }
    fortressObjects = [];
    wavefoamObjects = [];
    animatedObjects = [];
    rotatingObjects = [];
    wavingObjects = [];
    time = 0;
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
