window.IronValley = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var objects = [];
  var animatingObjects = [];
  var oreCarPosition = 0;
  var smelterGlowIntensity = 1.0;
  var furnaceFireRotation = 0;

  var colors = {
    rustRed: 0xA0422E,
    darkRed: 0x5C2416,
    ironBlack: 0x1a1a1a,
    lightGray: 0xB0B0B0,
    darkGray: 0x4A4A4A,
    moltenOrange: 0xFF8C00,
    brownOre: 0x704020,
    steelGray: 0x6B7280,
    brickRed: 0x8B3A1F
  };

  function createObject(geometry, material, position, rotation, scale) {
    var mesh = new THREE.Mesh(geometry, material);
    if (position) mesh.position.set(position.x, position.y, position.z);
    if (rotation) mesh.rotation.set(rotation.x, rotation.y, rotation.z);
    if (scale) mesh.scale.set(scale.x, scale.y, scale.z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);
    objects.push(mesh);
    return mesh;
  }

  function init(sceneRef, cameraRef) {
    scene = sceneRef;
    camera = cameraRef;
    objects = [];
    animatingObjects = [];
    oreCarPosition = 0;
    smelterGlowIntensity = 1.0;
    furnaceFireRotation = 0;

    buildValleyFloor();
    buildValleyWalls();
    buildIronOreDeposits();
    buildMiningInfrastructure();
    buildOreProcessingPlant();
    buildRailLine();
    buildMilitaryFortification();
    buildValleyFloorStructures();
    buildIndustrialCrane();
    buildMiningPit();
    buildIronOreStockpiles();
    buildRailBridge();
    buildMagneticSeparator();
  }

  function buildValleyFloor() {
    var floorMaterial = new THREE.MeshStandardMaterial({ color: colors.darkGray, roughness: 0.9 });
    var floorGeometry = new THREE.BoxGeometry(80, 0.5, 80);
    createObject(floorGeometry, floorMaterial, { x: 0, y: 0, z: 0 });

    // Add smaller floor sections with slight elevation variation
    var floorGeometry2 = new THREE.BoxGeometry(40, 0.3, 30);
    createObject(floorGeometry2, floorMaterial, { x: 15, y: 0.2, z: 15 });

    var floorGeometry3 = new THREE.BoxGeometry(35, 0.3, 28);
    createObject(floorGeometry3, floorMaterial, { x: -18, y: 0.15, z: -18 });
  }

  function buildValleyWalls() {
    var leftWallMaterial = new THREE.MeshStandardMaterial({ color: colors.rustRed, roughness: 0.8 });
    var rightWallMaterial = new THREE.MeshStandardMaterial({ color: colors.darkRed, roughness: 0.8 });

    // Left cliff wall - steep iron ore cliff
    var leftWallGeometry = new THREE.BoxGeometry(3, 25, 90);
    var leftWall = createObject(leftWallGeometry, leftWallMaterial, { x: -38.5, y: 12, z: 0 });

    // Right cliff wall - steep iron ore cliff
    var rightWallGeometry = new THREE.BoxGeometry(3, 25, 90);
    var rightWall = createObject(rightWallGeometry, rightWallMaterial, { x: 38.5, y: 12, z: 0 });

    // Create texture variation on walls with smaller boxes
    for (var i = 0; i < 12; i++) {
      var varMat1 = new THREE.MeshStandardMaterial({ color: colors.brownOre, roughness: 0.85 });
      var varGeo1 = new THREE.BoxGeometry(2.8, 3, 4);
      createObject(varGeo1, varMat1,
        { x: -38.5, y: 5 + i * 2.2, z: -30 + Math.random() * 10 },
        { x: 0, y: 0, z: Math.random() * 0.3 }
      );

      var varMat2 = new THREE.MeshStandardMaterial({ color: colors.brickRed, roughness: 0.85 });
      var varGeo2 = new THREE.BoxGeometry(2.8, 3, 4);
      createObject(varGeo2, varMat2,
        { x: 38.5, y: 5 + i * 2.2, z: 25 + Math.random() * 10 },
        { x: 0, y: 0, z: Math.random() * 0.3 }
      );
    }

    // Wall top variations
    for (var j = 0; j < 8; j++) {
      var topMat = new THREE.MeshStandardMaterial({ color: colors.ironBlack, roughness: 0.9 });
      var topGeo = new THREE.BoxGeometry(3.5, 2, 8);
      createObject(topGeo, topMat, { x: -38.5, y: 24, z: -25 + j * 12 });
      createObject(topGeo, topMat, { x: 38.5, y: 24, z: -25 + j * 12 });
    }
  }

  function buildIronOreDeposits() {
    var oreMaterial = new THREE.MeshStandardMaterial({ color: colors.rustRed, roughness: 0.7, metalness: 0.6 });
    var darkOreMaterial = new THREE.MeshStandardMaterial({ color: colors.brownOre, roughness: 0.8, metalness: 0.4 });

    // Left wall ore clusters
    for (var i = 0; i < 16; i++) {
      var oreGeometry = new THREE.SphereGeometry(1.5 + Math.random() * 1.5, 8, 8);
      var mat = i % 2 === 0 ? oreMaterial : darkOreMaterial;
      createObject(oreGeometry, mat,
        { x: -36 + Math.random() * 4, y: 4 + i * 1.5, z: -35 + Math.random() * 6 }
      );
    }

    // Right wall ore clusters
    for (var j = 0; j < 14; i++) {
      var oreGeo2 = new THREE.SphereGeometry(1.2 + Math.random() * 1.8, 8, 8);
      var mat2 = j % 2 === 0 ? darkOreMaterial : oreMaterial;
      createObject(oreGeo2, mat2,
        { x: 34 + Math.random() * 5, y: 6 + j * 1.6, z: 20 + Math.random() * 8 }
      );
      j++;
    }

    // Scattered ore deposits in cliff faces
    for (var k = 0; k < 18; k++) {
      var smallOre = new THREE.SphereGeometry(0.8 + Math.random() * 1.2, 6, 6);
      var oreMat = k % 3 === 0 ? darkOreMaterial : oreMaterial;
      createObject(smallOre, oreMat,
        { x: -35 + Math.random() * 70, y: 10 + Math.random() * 15, z: -40 + Math.random() * 15 }
      );
    }
  }

  function buildMiningInfrastructure() {
    var shaftMaterial = new THREE.MeshStandardMaterial({ color: colors.ironBlack, roughness: 0.9 });
    var frameMaterial = new THREE.MeshStandardMaterial({ color: colors.steelGray, roughness: 0.7, metalness: 0.8 });

    // Left cliff mine shaft entrances (multiple shafts)
    for (var i = 0; i < 3; i++) {
      var shaftEntrance = new THREE.BoxGeometry(4, 5, 2);
      createObject(shaftEntrance, shaftMaterial,
        { x: -36, y: 8 + i * 6, z: -36 }
      );

      // Shaft frame support beams
      for (var j = 0; j < 4; j++) {
        var frameGeo = new THREE.BoxGeometry(0.3, 6, 0.3);
        createObject(frameGeo, frameMaterial,
          { x: -34.5 + j * 1.2, y: 8 + i * 6, z: -37 }
        );
      }

      // Horizontal support beams
      var horizFrame = new THREE.BoxGeometry(4.5, 0.3, 0.3);
      createObject(horizFrame, frameMaterial,
        { x: -36, y: 5 + i * 6, z: -36 }
      );
      createObject(horizFrame, frameMaterial,
        { x: -36, y: 11 + i * 6, z: -36 }
      );
    }

    // Right cliff mine shaft entrances
    for (var m = 0; m < 2; m++) {
      var shaftEnt2 = new THREE.BoxGeometry(4, 5, 2);
      createObject(shaftEnt2, shaftMaterial,
        { x: 34, y: 10 + m * 7, z: 35 }
      );

      // Shaft frame
      for (var n = 0; n < 3; n++) {
        var frameGeo2 = new THREE.BoxGeometry(0.3, 6, 0.3);
        createObject(frameGeo2, frameMaterial,
          { x: 32.5 + n * 1.3, y: 10 + m * 7, z: 34 }
        );
      }
    }

    // Mining equipment boxes near shafts
    var equipMaterial = new THREE.MeshStandardMaterial({ color: colors.darkGray, roughness: 0.6 });
    for (var p = 0; p < 5; p++) {
      var equipGeo = new THREE.BoxGeometry(2, 2, 2);
      createObject(equipGeo, equipMaterial,
        { x: -28 + p * 3, y: 1, z: -32 }
      );
    }
  }

  function buildOreProcessingPlant() {
    var plantMaterial = new THREE.MeshStandardMaterial({ color: colors.darkGray, roughness: 0.75 });
    var roofMaterial = new THREE.MeshStandardMaterial({ color: colors.ironBlack, roughness: 0.9 });
    var furnaceMaterial = new THREE.MeshStandardMaterial({ color: colors.brickRed, roughness: 0.8 });

    // Main processing facility building
    var mainBuilding = new THREE.BoxGeometry(20, 10, 15);
    createObject(mainBuilding, plantMaterial, { x: 5, y: 5, z: 25 });

    // Building roof
    var roofGeo = new THREE.BoxGeometry(20.5, 1, 15.5);
    createObject(roofGeo, roofMaterial, { x: 5, y: 15, z: 25 });

    // Roof peak accent
    var peakGeo = new THREE.BoxGeometry(21, 0.5, 16);
    createObject(peakGeo, roofMaterial, { x: 5, y: 15.8, z: 25 });

    // Processing unit boxes
    for (var i = 0; i < 6; i++) {
      var unitGeo = new THREE.BoxGeometry(3, 6, 3);
      createObject(unitGeo, plantMaterial,
        { x: -6 + i * 3.5, y: 3, z: 28 }
      );
    }

    // Smelter furnace - main cylinder
    var furnaceGeo = new THREE.CylinderGeometry(3, 3.5, 8, 8);
    var furnace = createObject(furnaceGeo, furnaceMaterial, { x: 15, y: 8, z: 20 });
    animatingObjects.push(furnace);

    // Furnace base
    var furnaceBase = new THREE.CylinderGeometry(3.8, 4, 1, 8);
    createObject(furnaceBase, plantMaterial, { x: 15, y: 4, z: 20 });

    // Furnace top cap
    var furnaceTop = new THREE.CylinderGeometry(2.8, 3, 0.5, 8);
    createObject(furnaceTop, roofMaterial, { x: 15, y: 16, z: 20 });

    // Smelter chimneys (tall cylinders)
    for (var j = 0; j < 4; j++) {
      var chimneyGeo = new THREE.CylinderGeometry(1.2, 1.5, 12, 6);
      var chimney = createObject(chimneyGeo, furnaceMaterial,
        { x: 8 + j * 3, y: 11, z: 22 }
      );
      animatingObjects.push(chimney);

      // Chimney cap
      var capGeo = new THREE.CylinderGeometry(1.1, 1.4, 0.4, 6);
      createObject(capGeo, roofMaterial, { x: 8 + j * 3, y: 23.2, z: 22 });
    }

    // Support pillars
    for (var k = 0; k < 4; k++) {
      var pillarGeo = new THREE.CylinderGeometry(0.8, 1, 14, 4);
      createObject(pillarGeo, plantMaterial,
        { x: 0 + k * 10, y: 7, z: 15 }
      );
    }

    // Molten ore output sphere (glowing)
    var moltenGeo = new THREE.SphereGeometry(1.5, 8, 8);
    var moltenMat = new THREE.MeshStandardMaterial({
      color: colors.moltenOrange,
      roughness: 0.3,
      metalness: 0.9,
      emissive: colors.moltenOrange,
      emissiveIntensity: 0.8
    });
    var molten = createObject(moltenGeo, moltenMat, { x: 15, y: 2, z: 15 });
    animatingObjects.push(molten);
  }

  function buildRailLine() {
    var railMaterial = new THREE.MeshStandardMaterial({ color: colors.ironBlack, roughness: 0.8, metalness: 0.7 });
    var sleeperMaterial = new THREE.MeshStandardMaterial({ color: colors.darkGray, roughness: 0.9 });

    // Rail tracks - two parallel rails
    var railGeo = new THREE.BoxGeometry(0.4, 0.3, 60);
    createObject(railGeo, railMaterial, { x: -3, y: 0.5, z: 0 });
    createObject(railGeo, railMaterial, { x: 3, y: 0.5, z: 0 });

    // Rail sleepers
    for (var i = 0; i < 30; i++) {
      var sleeperGeo = new THREE.BoxGeometry(7, 0.2, 0.8);
      createObject(sleeperGeo, sleeperMaterial,
        { x: 0, y: 0.3, z: -25 + i * 2 }
      );
    }

    // Ore cart on rails (moving)
    var cartGeo = new THREE.BoxGeometry(2.5, 1.8, 4);
    var cartMat = new THREE.MeshStandardMaterial({ color: colors.rustRed, roughness: 0.7 });
    var oreCart = createObject(cartGeo, cartMat, { x: 0, y: 1.2, z: -20 });
    animatingObjects.push(oreCart);

    // Cart wheels (using spheres as placeholders)
    for (var j = 0; j < 2; j++) {
      for (var k = 0; k < 2; k++) {
        var wheelGeo = new THREE.CylinderGeometry(0.5, 0.5, 0.3, 8);
        createObject(wheelGeo, railMaterial,
          { x: -1.2 + j * 2.4, y: 0.5, z: -22 + k * 4 }
        );
      }
    }

    // Additional ore cars parked
    for (var m = 0; m < 3; m++) {
      var parkedCart = new THREE.BoxGeometry(2.5, 1.8, 4);
      createObject(parkedCart, cartMat,
        { x: 10 + m * 4, y: 1.2, z: -15 }
      );
    }
  }

  function buildMilitaryFortification() {
    var fortMaterial = new THREE.MeshStandardMaterial({ color: colors.steelGray, roughness: 0.7, metalness: 0.6 });
    var gunMaterial = new THREE.MeshStandardMaterial({ color: colors.ironBlack, roughness: 0.9, metalness: 0.8 });

    // Gun positions built into left cliff
    for (var i = 0; i < 4; i++) {
      // Bunker
      var bunkerGeo = new THREE.BoxGeometry(4, 3, 2.5);
      createObject(bunkerGeo, fortMaterial,
        { x: -36, y: 6 + i * 5, z: 15 + i * 3 }
      );

      // Gun barrel (cylinder)
      var barrelGeo = new THREE.CylinderGeometry(0.4, 0.4, 3, 6);
      createObject(barrelGeo, gunMaterial,
        { x: -34, y: 8 + i * 5, z: 16 + i * 3 },
        { x: 0, y: 0, z: 0.3 }
      );

      // Gun mounting (box)
      var mountGeo = new THREE.BoxGeometry(1.5, 1.2, 1.5);
      createObject(mountGeo, gunMaterial,
        { x: -35, y: 6.5 + i * 5, z: 17 + i * 3 }
      );
    }

    // Gun positions on right cliff
    for (var j = 0; j < 3; j++) {
      var bunkerGeo2 = new THREE.BoxGeometry(4, 3, 2.5);
      createObject(bunkerGeo2, fortMaterial,
        { x: 36, y: 8 + j * 6, z: -20 + j * 4 }
      );

      var barrelGeo2 = new THREE.CylinderGeometry(0.4, 0.4, 3, 6);
      createObject(barrelGeo2, gunMaterial,
        { x: 34, y: 10 + j * 6, z: -19 + j * 4 },
        { x: 0, y: 0, z: -0.3 }
      );

      var mountGeo2 = new THREE.BoxGeometry(1.5, 1.2, 1.5);
      createObject(mountGeo2, gunMaterial,
        { x: 35, y: 8.5 + j * 6, z: -18 + j * 4 }
      );
    }

    // Defensive walls connecting fortifications
    for (var k = 0; k < 6; k++) {
      var wallGeo = new THREE.BoxGeometry(2, 2.5, 2);
      createObject(wallGeo, fortMaterial,
        { x: -32 + k * 10, y: 2, z: 10 }
      );
    }
  }

  function buildValleyFloorStructures() {
    var barrackMaterial = new THREE.MeshStandardMaterial({ color: colors.darkGray, roughness: 0.75 });
    var roofMaterial = new THREE.MeshStandardMaterial({ color: colors.brickRed, roughness: 0.8 });

    // Barracks building 1
    var barr1Geo = new THREE.BoxGeometry(12, 5, 8);
    createObject(barr1Geo, barrackMaterial, { x: -20, y: 2.5, z: 10 });

    var barr1RoofGeo = new THREE.BoxGeometry(12.5, 0.8, 8.5);
    createObject(barr1RoofGeo, roofMaterial, { x: -20, y: 8.5, z: 10 });

    // Barracks building 2
    var barr2Geo = new THREE.BoxGeometry(10, 4, 7);
    createObject(barr2Geo, barrackMaterial, { x: -20, y: 2, z: -8 });

    var barr2RoofGeo = new THREE.BoxGeometry(10.5, 0.7, 7.5);
    createObject(barr2RoofGeo, roofMaterial, { x: -20, y: 7.5, z: -8 });

    // Command center (tower-like structure)
    var cmdGeo = new THREE.BoxGeometry(6, 8, 6);
    createObject(cmdGeo, barrackMaterial, { x: 25, y: 4, z: 5 });

    var cmdRoofGeo = new THREE.BoxGeometry(6.5, 1, 6.5);
    createObject(cmdRoofGeo, roofMaterial, { x: 25, y: 12.5, z: 5 });

    // Watch tower (using box as vertical structure)
    var towerGeo = new THREE.BoxGeometry(2.5, 10, 2.5);
    createObject(towerGeo, barrackMaterial, { x: 28, y: 5, z: 15 });

    var towerCap = new THREE.CylinderGeometry(1.8, 1.8, 1.5, 6);
    createObject(towerCap, roofMaterial, { x: 28, y: 15.8, z: 15 });

    // Storage structures
    for (var i = 0; i < 4; i++) {
      var storageGeo = new THREE.BoxGeometry(4, 4, 5);
      createObject(storageGeo, barrackMaterial,
        { x: 10 + i * 5, y: 2, z: -12 }
      );
    }

    // Support structures/pillars
    for (var j = 0; j < 8; j++) {
      var pillarGeo = new THREE.CylinderGeometry(0.5, 0.6, 6, 4);
      createObject(pillarGeo, barrackMaterial,
        { x: -25 + j * 7, y: 3, z: 15 }
      );
    }
  }

  function buildIndustrialCrane() {
    var craneMaterial = new THREE.MeshStandardMaterial({ color: colors.steelGray, roughness: 0.7, metalness: 0.7 });
    var boomMaterial = new THREE.MeshStandardMaterial({ color: colors.darkGray, roughness: 0.8 });

    // Crane base structure
    var baseGeo = new THREE.BoxGeometry(5, 2, 5);
    createObject(baseGeo, craneMaterial, { x: -10, y: 1, z: 0 });

    // Vertical mast
    var mastGeo = new THREE.BoxGeometry(1, 15, 1);
    createObject(mastGeo, craneMaterial, { x: -10, y: 8, z: 0 });

    // Crane boom (horizontal arm)
    var boomGeo = new THREE.BoxGeometry(12, 0.8, 0.8);
    createObject(boomGeo, boomMaterial, { x: -4, y: 14, z: 0 });

    // Cable attachment mechanism
    var cableGeo = new THREE.CylinderGeometry(0.3, 0.3, 8, 4);
    createObject(cableGeo, craneMaterial, { x: 2, y: 10, z: 0 });

    // Crane hook (sphere)
    var hookGeo = new THREE.SphereGeometry(0.6, 6, 6);
    createObject(hookGeo, craneMaterial, { x: 2, y: 4, z: 0 });

    // Counterweight box on boom
    var counterGeo = new THREE.BoxGeometry(2, 2, 2);
    createObject(counterGeo, boomMaterial, { x: -14, y: 13.5, z: 0 });

    // Pulley attachment points
    for (var i = 0; i < 3; i++) {
      var pulleyGeo = new THREE.CylinderGeometry(0.4, 0.4, 0.3, 8);
      createObject(pulleyGeo, craneMaterial,
        { x: -8 + i * 4, y: 13, z: 0.5 }
      );
    }

    // Grab bucket structure
    var bucketGeo = new THREE.BoxGeometry(1.5, 2, 1.5);
    createObject(bucketGeo, boomMaterial, { x: 2, y: 2, z: 0 });
  }

  function buildMiningPit() {
    var pitMaterial = new THREE.MeshStandardMaterial({ color: colors.brownOre, roughness: 0.9 });
    var edgeMaterial = new THREE.MeshStandardMaterial({ color: colors.ironBlack, roughness: 0.85 });

    // Pit walls - stepped levels
    var level1Geo = new THREE.BoxGeometry(25, 1, 25);
    createObject(level1Geo, pitMaterial, { x: -20, y: -1, z: -20 });

    var level2Geo = new THREE.BoxGeometry(20, 1, 20);
    createObject(level2Geo, pitMaterial, { x: -20, y: -3, z: -20 });

    var level3Geo = new THREE.BoxGeometry(15, 1, 15);
    createObject(level3Geo, pitMaterial, { x: -20, y: -5, z: -20 });

    // Pit bottom
    var pitBottomGeo = new THREE.BoxGeometry(12, 1, 12);
    createObject(pitBottomGeo, edgeMaterial, { x: -20, y: -6.5, z: -20 });

    // Pit edge supports
    for (var i = 0; i < 8; i++) {
      var edgeGeo = new THREE.BoxGeometry(1.5, 3, 1.5);
      createObject(edgeGeo, edgeMaterial,
        { x: -12 + i * 4, y: -1, z: -24 }
      );
    }

    // Interior pit supports
    for (var j = 0; j < 6; j++) {
      var supportGeo = new THREE.CylinderGeometry(0.6, 0.8, 6, 4);
      createObject(supportGeo, edgeMaterial,
        { x: -26 + j * 4, y: -3, z: -20 }
      );
    }

    // Ore deposits in pit
    for (var k = 0; k < 8; k++) {
      var oreGeo = new THREE.SphereGeometry(1.5, 8, 8);
      createObject(oreGeo, pitMaterial,
        { x: -22 + Math.random() * 5, y: -5.5 + Math.random() * 2, z: -20 + Math.random() * 6 }
      );
    }
  }

  function buildIronOreStockpiles() {
    var stackMaterial = new THREE.MeshStandardMaterial({ color: colors.brownOre, roughness: 0.85 });
    var baseMaterial = new THREE.MeshStandardMaterial({ color: colors.darkGray, roughness: 0.8 });

    // Stockpile 1 - pyramid of ore boxes
    var stack1Base = new THREE.BoxGeometry(8, 1, 8);
    createObject(stack1Base, baseMaterial, { x: 12, y: 0.5, z: 10 });

    var stack1Layer1 = new THREE.BoxGeometry(6, 1.5, 6);
    createObject(stack1Layer1, stackMaterial, { x: 12, y: 2.2, z: 10 });

    var stack1Layer2 = new THREE.BoxGeometry(4, 1.5, 4);
    createObject(stack1Layer2, stackMaterial, { x: 12, y: 4, z: 10 });

    var stack1Layer3 = new THREE.BoxGeometry(2, 1.5, 2);
    createObject(stack1Layer3, stackMaterial, { x: 12, y: 5.8, z: 10 });

    // Stockpile 2 - larger mound
    var stack2Base = new THREE.BoxGeometry(10, 1.5, 10);
    createObject(stack2Base, baseMaterial, { x: 12, y: 0.8, z: 23 });

    var stack2Layer1 = new THREE.BoxGeometry(7, 2, 7);
    createObject(stack2Layer1, stackMaterial, { x: 12, y: 2.8, z: 23 });

    var stack2Layer2 = new THREE.BoxGeometry(4, 2, 4);
    createObject(stack2Layer2, stackMaterial, { x: 12, y: 5, z: 23 });

    // Stockpile 3 - small pile
    var stack3Geo = new THREE.BoxGeometry(6, 1, 6);
    createObject(stack3Geo, baseMaterial, { x: 28, y: 0.5, z: 18 });

    var stack3Top = new THREE.BoxGeometry(4, 1.5, 4);
    createObject(stack3Top, stackMaterial, { x: 28, y: 2.2, z: 18 });

    // Individual ore chunks around stockpiles
    for (var i = 0; i < 15; i++) {
      var chunkGeo = new THREE.SphereGeometry(0.6 + Math.random() * 0.8, 6, 6);
      createObject(chunkGeo, stackMaterial,
        { x: 8 + Math.random() * 8, y: 1.5 + Math.random() * 1, z: 5 + Math.random() * 20 }
      );
    }
  }

  function buildRailBridge() {
    var bridgeMaterial = new THREE.MeshStandardMaterial({ color: colors.steelGray, roughness: 0.7, metalness: 0.8 });
    var railMaterial = new THREE.MeshStandardMaterial({ color: colors.ironBlack, roughness: 0.8 });

    // Bridge deck
    var deckGeo = new THREE.BoxGeometry(8, 1, 20);
    createObject(deckGeo, bridgeMaterial, { x: -15, y: 5, z: 5 });

    // Bridge rails (two on sides)
    var railGeo = new THREE.BoxGeometry(0.5, 1.2, 20);
    createObject(railGeo, railMaterial, { x: -19, y: 5.8, z: 5 });
    createObject(railGeo, railMaterial, { x: -11, y: 5.8, z: 5 });

    // Support pillars under bridge
    for (var i = 0; i < 3; i++) {
      var pillarGeo = new THREE.BoxGeometry(1.5, 4, 1.5);
      createObject(pillarGeo, bridgeMaterial,
        { x: -15, y: 2, z: -5 + i * 10 }
      );
    }

    // Bridge truss work (diagonal supports)
    for (var j = 0; j < 4; j++) {
      var trussGeo = new THREE.BoxGeometry(0.4, 0.4, 5);
      createObject(trussGeo, bridgeMaterial,
        { x: -17 + j * 3, y: 4.2, z: 0 + j * 4 },
        { x: 0.4, y: 0, z: 0 }
      );
    }

    // Connector beams between pillars
    for (var k = 0; k < 2; k++) {
      var connectorGeo = new THREE.BoxGeometry(2, 0.5, 10);
      createObject(connectorGeo, bridgeMaterial,
        { x: -15, y: 3.5, z: 0 + k * 10 }
      );
    }
  }

  function buildMagneticSeparator() {
    var sepMaterial = new THREE.MeshStandardMaterial({ color: colors.darkGray, roughness: 0.7 });
    var drumMaterial = new THREE.MeshStandardMaterial({ color: colors.ironBlack, roughness: 0.8, metalness: 0.8 });

    // Main separator housing
    var housingGeo = new THREE.BoxGeometry(8, 5, 6);
    createObject(housingGeo, sepMaterial, { x: -15, y: 3, z: -10 });

    // Separator drums (rotating cylinders)
    var drum1Geo = new THREE.CylinderGeometry(1.5, 1.5, 6, 8);
    var drum1 = createObject(drum1Geo, drumMaterial,
      { x: -19, y: 4.5, z: -10 },
      { x: 0, y: 0, z: 1.57 }
    );
    animatingObjects.push(drum1);

    var drum2Geo = new THREE.CylinderGeometry(1.5, 1.5, 6, 8);
    var drum2 = createObject(drum2Geo, drumMaterial,
      { x: -15, y: 4.5, z: -10 },
      { x: 0, y: 0, z: 1.57 }
    );
    animatingObjects.push(drum2);

    var drum3Geo = new THREE.CylinderGeometry(1.5, 1.5, 6, 8);
    var drum3 = createObject(drum3Geo, drumMaterial,
      { x: -11, y: 4.5, z: -10 },
      { x: 0, y: 0, z: 1.57 }
    );
    animatingObjects.push(drum3);

    // Hopper input
    var hopperGeo = new THREE.ConeGeometry(2, 2.5, 8);
    createObject(hopperGeo, sepMaterial,
      { x: -15, y: 6.5, z: -10 },
      { x: 0, y: 0, z: 0 }
    );

    // Output chutes
    for (var i = 0; i < 3; i++) {
      var chuteGeo = new THREE.BoxGeometry(1.5, 2, 2);
      createObject(chuteGeo, sepMaterial,
        { x: -19 + i * 4, y: 1, z: -10 }
      );
    }

    // Vibrator mechanism (small boxes)
    for (var j = 0; j < 4; j++) {
      var vibratorGeo = new THREE.BoxGeometry(0.6, 0.6, 0.6);
      createObject(vibratorGeo, drumMaterial,
        { x: -18 + j * 2, y: 2.5, z: -8 }
      );
    }

    // Motor housing
    var motorGeo = new THREE.CylinderGeometry(1, 1, 2, 6);
    createObject(motorGeo, sepMaterial,
      { x: -21, y: 3.5, z: -10 }
    );

    // Control panel
    var panelGeo = new THREE.BoxGeometry(2.5, 3, 0.5);
    createObject(panelGeo, sepMaterial,
      { x: -18, y: 4, z: -12 }
    );
  }

  function update(delta) {
    // Animate ore cart on rails
    oreCarPosition += delta * 8;
    if (oreCarPosition > 50) oreCarPosition = -25;

    for (var i = 0; i < animatingObjects.length; i++) {
      var obj = animatingObjects[i];

      // Move ore cart if it's the cart object
      if (i === 0) {
        obj.position.z = -20 + oreCarPosition;
      }
      // Rotate drums
      else if (i >= 3 && i <= 5) {
        obj.rotation.z += delta * 2;
      }
      // Furnace rotation
      else if (i === 1) {
        furnaceFireRotation += delta * 0.5;
        obj.rotation.z = Math.sin(furnaceFireRotation) * 0.05;
      }
      // Chimneys
      else if (i === 2 || (i > 5 && i < 10)) {
        obj.rotation.x += delta * 0.3;
      }
      // Molten ore glow pulsing
      if (obj.material && obj.material.emissiveIntensity !== undefined) {
        smelterGlowIntensity += delta * 0.8;
        var glowValue = 0.6 + Math.sin(smelterGlowIntensity) * 0.4;
        obj.material.emissiveIntensity = glowValue;
      }
    }
  }

  function reset() {
    for (var i = 0; i < objects.length; i++) {
      scene.remove(objects[i]);
    }
    objects = [];
    animatingObjects = [];
    oreCarPosition = 0;
    smelterGlowIntensity = 1.0;
    furnaceFireRotation = 0;
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
