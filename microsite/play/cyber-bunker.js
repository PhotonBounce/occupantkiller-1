window.CyberBunker = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var objects = [];
  var animatedObjects = [];
  var time = 0;

  var init = function(sceneRef, cameraRef) {
    scene = sceneRef;
    camera = cameraRef;
    objects = [];
    animatedObjects = [];

    // Underground cyber bunker entrance - reinforced blast doors
    var entranceGroup = buildBlastEntrance();
    scene.add(entranceGroup);
    objects.push(entranceGroup);

    // Raised floor tiles grid
    var floorGrid = buildFloorTiles();
    scene.add(floorGrid);
    objects.push(floorGrid);

    // Server farm rows with emissive lights and LED cascades
    var serverFarm = buildServerFarm();
    scene.add(serverFarm);
    objects.push(serverFarm);
    animatedObjects.push(serverFarm);

    // Fiber optic cable trays overhead with LineSegments bundles
    var cableTrays = buildCableTrays();
    scene.add(cableTrays);
    objects.push(cableTrays);

    // Cooling unit towers with rotating fans
    var coolingUnits = buildCoolingUnits();
    scene.add(coolingUnits);
    objects.push(coolingUnits);
    animatedObjects.push(coolingUnits);

    // Water cooling pipes
    var waterPipes = buildWaterCoolingPipes();
    scene.add(waterPipes);
    objects.push(waterPipes);

    // Holographic tactical display tables with pulsing data nodes
    var holoDisplays = buildHoloDisplays();
    scene.add(holoDisplays);
    objects.push(holoDisplays);
    animatedObjects.push(holoDisplays);

    // Operator workstations with curved desks and monitors
    var workstations = buildWorkstations();
    scene.add(workstations);
    objects.push(workstations);

    // Biometric security door scanners with sweep animation
    var bioScanners = buildBioScanners();
    scene.add(bioScanners);
    objects.push(bioScanners);
    animatedObjects.push(bioScanners);

    // UPS battery banks
    var upsBanks = buildUPSBanks();
    scene.add(upsBanks);
    objects.push(upsBanks);

    // Network switch room with dense cabling
    var switchRoom = buildNetworkSwitchRoom();
    scene.add(switchRoom);
    objects.push(switchRoom);

    // Cyber ops center with large screen wall
    var opsCenter = buildCyberOpsCenter();
    scene.add(opsCenter);
    objects.push(opsCenter);

    // Emergency shielding cage - Faraday cage
    var shieldCage = buildShieldingCage();
    scene.add(shieldCage);
    objects.push(shieldCage);

    // Generator backup room
    var genRoom = buildGeneratorRoom();
    scene.add(genRoom);
    objects.push(genRoom);

    // Security camera mounts
    var cameras = buildSecurityCameras();
    scene.add(cameras);
    objects.push(cameras);

    // Ambient lighting for bunker atmosphere
    var ambientLight = new THREE.AmbientLight(0x1a1a2e, 0.6);
    scene.add(ambientLight);

    var keyLight = new THREE.DirectionalLight(0x00ff88, 0.4);
    keyLight.position.set(20, 15, 20);
    scene.add(keyLight);
  };

  var buildBlastEntrance = function() {
    var group = new THREE.Group();

    // Outer blast door frame
    var doorFrameGeom = new THREE.BoxGeometry(8, 10, 0.5);
    var doorFrameMat = new THREE.MeshStandardMaterial({
      color: 0x222222,
      metalness: 0.9,
      roughness: 0.2
    });
    var doorFrame = new THREE.Mesh(doorFrameGeom, doorFrameMat);
    doorFrame.position.set(0, 5, -15);
    doorFrame.castShadow = true;
    group.add(doorFrame);

    // Inner reinforced plate
    var innerPlateGeom = new THREE.BoxGeometry(7.8, 9.8, 0.3);
    var innerPlateMat = new THREE.MeshStandardMaterial({
      color: 0x111111,
      metalness: 0.95,
      roughness: 0.1
    });
    var innerPlate = new THREE.Mesh(innerPlateGeom, innerPlateMat);
    innerPlate.position.set(0, 5, -14.6);
    group.add(innerPlate);

    // Locking bolts around frame
    for (var i = 0; i < 12; i++) {
      var boltGeom = new THREE.SphereGeometry(0.3, 8, 8);
      var boltMat = new THREE.MeshStandardMaterial({
        color: 0x444444,
        metalness: 0.8
      });
      var bolt = new THREE.Mesh(boltGeom, boltMat);
      var angle = (i / 12) * Math.PI * 2;
      bolt.position.set(Math.cos(angle) * 4, 5 + Math.sin(angle) * 4.5, -15);
      group.add(bolt);
    }

    // Red warning stripes
    for (var i = 0; i < 5; i++) {
      var stripeGeom = new THREE.BoxGeometry(8.5, 0.4, 0.6);
      var stripeMat = new THREE.MeshStandardMaterial({ color: 0xff0000 });
      var stripe = new THREE.Mesh(stripeGeom, stripeMat);
      stripe.position.set(0, 2 + i * 1.8, -14.5);
      group.add(stripe);
    }

    return group;
  };

  var buildFloorTiles = function() {
    var group = new THREE.Group();
    var tileSize = 2;
    var gridX = 15;
    var gridZ = 25;

    for (var x = 0; x < gridX; x++) {
      for (var z = 0; z < gridZ; z++) {
        var tileGeom = new THREE.BoxGeometry(tileSize, 0.15, tileSize);
        var tileColor = ((x + z) % 2 === 0) ? 0x1a1a2e : 0x16213e;
        var tileMat = new THREE.MeshStandardMaterial({
          color: tileColor,
          metalness: 0.4,
          roughness: 0.6
        });
        var tile = new THREE.Mesh(tileGeom, tileMat);
        tile.position.set((x - gridX / 2) * tileSize, 0, (z - gridZ / 2) * tileSize);
        tile.castShadow = true;
        group.add(tile);

        // Glow grid lines
        if (x < gridX - 1 || z < gridZ - 1) {
          var lineGeom = new THREE.BoxGeometry(tileSize, 0.08, 0.1);
          var lineMat = new THREE.MeshStandardMaterial({
            color: 0x00ff88,
            emissive: 0x00ff88,
            emissiveIntensity: 0.3
          });
          var line = new THREE.Mesh(lineGeom, lineMat);
          line.position.set((x - gridX / 2) * tileSize, 0.1, (z - gridZ / 2) * tileSize);
          group.add(line);
        }
      }
    }

    return group;
  };

  var buildServerFarm = function() {
    var group = new THREE.Group();
    var rackHeight = 4;
    var rackDepth = 1;
    var rackWidth = 1.2;

    // Create 4 rows of server racks
    for (var row = 0; row < 4; row++) {
      for (var rack = 0; rack < 6; rack++) {
        var rackGeom = new THREE.BoxGeometry(rackWidth, rackHeight, rackDepth);
        var rackMat = new THREE.MeshStandardMaterial({
          color: 0x0a0a0a,
          metalness: 0.7,
          roughness: 0.3
        });
        var rackMesh = new THREE.Mesh(rackGeom, rackMat);
        rackMesh.position.set(
          (rack - 2.5) * 2,
          rackHeight / 2,
          (row - 1.5) * 3
        );
        rackMesh.castShadow = true;
        group.add(rackMesh);

        // Server unit slots with blue LEDs
        for (var slot = 0; slot < 8; slot++) {
          var slotGeom = new THREE.BoxGeometry(rackWidth - 0.2, 0.4, rackDepth - 0.2);
          var slotMat = new THREE.MeshStandardMaterial({
            color: 0x1a1a3a,
            metalness: 0.6
          });
          var slotMesh = new THREE.Mesh(slotGeom, slotMat);
          slotMesh.position.set(
            rackMesh.position.x,
            rackHeight / 2 - 2 + slot * 0.5,
            rackMesh.position.z
          );
          group.add(slotMesh);

          // Pulsing LED indicators
          var ledGeom = new THREE.BoxGeometry(0.15, 0.08, 0.08);
          var ledMat = new THREE.MeshStandardMaterial({
            color: 0x0088ff,
            emissive: 0x0088ff,
            emissiveIntensity: 0.8
          });
          var led = new THREE.Mesh(ledGeom, ledMat);
          led.position.set(
            rackMesh.position.x + 0.5,
            slotMesh.position.y,
            slotMesh.position.z
          );
          led.userData = { baseIntensity: 0.8, slot: slot, rack: rack, row: row };
          group.add(led);
        }
      }
    }

    group.userData = { type: 'serverFarm', ledIntensity: 0 };
    return group;
  };

  var buildCableTrays = function() {
    var group = new THREE.Group();

    // Overhead cable tray structure
    var trayGeom = new THREE.BoxGeometry(25, 0.3, 1.2);
    var trayMat = new THREE.MeshStandardMaterial({
      color: 0x333333,
      metalness: 0.6
    });
    var tray = new THREE.Mesh(trayGeom, trayMat);
    tray.position.set(0, 8, 0);
    group.add(tray);

    // Fiber optic cable bundles as LineSegments
    var cablePoints = [];
    for (var i = 0; i < 50; i++) {
      var x = (Math.random() - 0.5) * 24;
      var z = (Math.random() - 0.5) * 1;
      var y1 = 7.8;
      var y2 = 7.8 - 0.5;
      cablePoints.push(new THREE.Vector3(x, y1, z));
      cablePoints.push(new THREE.Vector3(x, y2, z));
    }
    var cableGeom = new THREE.BufferGeometry().setFromPoints(cablePoints);
    var cableMat = new THREE.LineBasicMaterial({ color: 0x00ff88, linewidth: 2 });
    var cables = new THREE.LineSegments(cableGeom, cableMat);
    group.add(cables);

    // Support brackets
    for (var i = 0; i < 8; i++) {
      var bracketGeom = new THREE.BoxGeometry(0.2, 1.5, 0.2);
      var bracketMat = new THREE.MeshStandardMaterial({ color: 0x444444 });
      var bracket = new THREE.Mesh(bracketGeom, bracketMat);
      bracket.position.set((i - 3.5) * 3.5, 6.3, 0);
      group.add(bracket);
    }

    return group;
  };

  var buildCoolingUnits = function() {
    var group = new THREE.Group();

    // 3 cooling tower units
    for (var tower = 0; tower < 3; tower++) {
      var baseX = -8 + tower * 8;

      // Main unit body
      var bodyGeom = new THREE.BoxGeometry(2, 3, 2);
      var bodyMat = new THREE.MeshStandardMaterial({
        color: 0x2a2a3a,
        metalness: 0.5
      });
      var body = new THREE.Mesh(bodyGeom, bodyMat);
      body.position.set(baseX, 1.5, -12);
      body.castShadow = true;
      group.add(body);

      // Rotating cooling fans (CylinderGeometry)
      for (var fan = 0; fan < 2; fan++) {
        var fanGeom = new THREE.CylinderGeometry(0.8, 0.8, 0.2, 16);
        var fanMat = new THREE.MeshStandardMaterial({
          color: 0x1a1a2e,
          metalness: 0.4
        });
        var fanMesh = new THREE.Mesh(fanGeom, fanMat);
        fanMesh.position.set(baseX, 2.2 + fan * 0.5, -12);
        fanMesh.userData = { type: 'fan', baseX: baseX };
        group.add(fanMesh);
      }

      // Intake vent
      var ventGeom = new THREE.BoxGeometry(1.8, 0.5, 0.3);
      var ventMat = new THREE.MeshStandardMaterial({
        color: 0x00ccff,
        emissive: 0x00ccff,
        emissiveIntensity: 0.2
      });
      var vent = new THREE.Mesh(ventGeom, ventMat);
      vent.position.set(baseX, 0.5, -12.5);
      group.add(vent);
    }

    group.userData = { type: 'coolingUnits' };
    return group;
  };

  var buildWaterCoolingPipes = function() {
    var group = new THREE.Group();

    // Horizontal main pipe
    var mainPipeGeom = new THREE.CylinderGeometry(0.2, 0.2, 20, 12);
    var pipeMat = new THREE.MeshStandardMaterial({
      color: 0x1a3a4a,
      metalness: 0.7
    });
    var mainPipe = new THREE.Mesh(mainPipeGeom, pipeMat);
    mainPipe.rotation.z = Math.PI / 2;
    mainPipe.position.set(0, 6, -8);
    group.add(mainPipe);

    // Distribution manifold
    var manifoldGeom = new THREE.BoxGeometry(1.5, 0.8, 0.8);
    var manifoldMat = new THREE.MeshStandardMaterial({
      color: 0x2a4a5a,
      metalness: 0.6
    });
    var manifold = new THREE.Mesh(manifoldGeom, manifoldMat);
    manifold.position.set(10, 6, -8);
    group.add(manifold);

    // Branch pipes to cooling units
    for (var i = 0; i < 3; i++) {
      var branchGeom = new THREE.CylinderGeometry(0.15, 0.15, 3, 8);
      var branch = new THREE.Mesh(branchGeom, pipeMat);
      branch.rotation.z = Math.PI / 2;
      branch.position.set(8 + i * 1, 6 - i * 0.3, -8 - i * 2);
      group.add(branch);
    }

    return group;
  };

  var buildHoloDisplays = function() {
    var group = new THREE.Group();

    // 2 holographic display tables
    for (var display = 0; display < 2; display++) {
      var tableX = -6 + display * 12;

      // Table base
      var baseGeom = new THREE.BoxGeometry(3, 0.3, 3);
      var baseMat = new THREE.MeshStandardMaterial({
        color: 0x1a1a2e,
        metalness: 0.6
      });
      var base = new THREE.Mesh(baseGeom, baseMat);
      base.position.set(tableX, 0.8, 5);
      group.add(base);

      // Table legs
      for (var leg = 0; leg < 4; leg++) {
        var legX = tableX + (leg < 2 ? -1.2 : 1.2);
        var legZ = 5 + (leg % 2 === 0 ? -1.2 : 1.2);
        var legGeom = new THREE.BoxGeometry(0.2, 0.8, 0.2);
        var legMat = new THREE.MeshStandardMaterial({ color: 0x333333 });
        var legMesh = new THREE.Mesh(legGeom, legMat);
        legMesh.position.set(legX, 0.4, legZ);
        group.add(legMesh);
      }

      // Holographic display surface (transparent)
      var displayGeom = new THREE.BoxGeometry(2.8, 0.1, 2.8);
      var displayMat = new THREE.MeshStandardMaterial({
        color: 0x00ffff,
        emissive: 0x00ffff,
        emissiveIntensity: 0.3,
        transparent: true,
        opacity: 0.5
      });
      var displayMesh = new THREE.Mesh(displayGeom, displayMat);
      displayMesh.position.set(tableX, 1.1, 5);
      group.add(displayMesh);

      // Floating holographic data nodes (SphereGeometry)
      for (var node = 0; node < 5; node++) {
        var nodeGeom = new THREE.SphereGeometry(0.25, 8, 8);
        var nodeMat = new THREE.MeshStandardMaterial({
          color: 0x00ff88,
          emissive: 0x00ff88,
          emissiveIntensity: 0.8
        });
        var nodeMesh = new THREE.Mesh(nodeGeom, nodeMat);
        nodeMesh.position.set(
          tableX + (Math.random() - 0.5) * 2,
          1.5 + Math.random() * 1.2,
          5 + (Math.random() - 0.5) * 2
        );
        nodeMesh.userData = {
          type: 'holoNode',
          baseY: nodeMesh.position.y,
          tableX: tableX
        };
        group.add(nodeMesh);
      }
    }

    group.userData = { type: 'holoDisplays' };
    return group;
  };

  var buildWorkstations = function() {
    var group = new THREE.Group();

    // 3 operator workstations
    for (var ws = 0; ws < 3; ws++) {
      var wsX = -5 + ws * 5;

      // Curved desk surface (BoxGeometry)
      var deskGeom = new THREE.BoxGeometry(2.5, 0.15, 1.5);
      var deskMat = new THREE.MeshStandardMaterial({
        color: 0x1a1a2e,
        metalness: 0.5
      });
      var desk = new THREE.Mesh(deskGeom, deskMat);
      desk.position.set(wsX, 1.2, 3);
      group.add(desk);

      // Desk support pedestal
      var pedestalGeom = new THREE.BoxGeometry(0.5, 1, 0.8);
      var pedestalMat = new THREE.MeshStandardMaterial({ color: 0x222222 });
      var pedestal = new THREE.Mesh(pedestalGeom, pedestalMat);
      pedestal.position.set(wsX, 0.5, 3);
      group.add(pedestal);

      // Left monitor
      var monitorGeom = new THREE.BoxGeometry(1, 1.5, 0.2);
      var monitorMat = new THREE.MeshStandardMaterial({
        color: 0x0a0a1a,
        emissive: 0x0088ff,
        emissiveIntensity: 0.4
      });
      var monLeft = new THREE.Mesh(monitorGeom, monitorMat);
      monLeft.position.set(wsX - 0.8, 1.8, 3);
      group.add(monLeft);

      // Right monitor
      var monRight = new THREE.Mesh(monitorGeom, monitorMat);
      monRight.position.set(wsX + 0.8, 1.8, 3);
      group.add(monRight);

      // Center keyboard/input area
      var kbGeom = new THREE.BoxGeometry(0.8, 0.1, 0.5);
      var kbMat = new THREE.MeshStandardMaterial({ color: 0x0a0a0a });
      var kb = new THREE.Mesh(kbGeom, kbMat);
      kb.position.set(wsX, 1.35, 3);
      group.add(kb);
    }

    return group;
  };

  var buildBioScanners = function() {
    var group = new THREE.Group();

    // 2 biometric scanner doors
    for (var door = 0; door < 2; door++) {
      var doorZ = -5 + door * 8;

      // Scanner panel
      var panelGeom = new THREE.BoxGeometry(1.5, 2, 0.3);
      var panelMat = new THREE.MeshStandardMaterial({
        color: 0x1a1a2e,
        metalness: 0.6
      });
      var panel = new THREE.Mesh(panelGeom, panelMat);
      panel.position.set(-13, 1, doorZ);
      group.add(panel);

      // Biometric scanner light (SphereGeometry)
      var scanGeom = new THREE.SphereGeometry(0.3, 16, 16);
      var scanMat = new THREE.MeshStandardMaterial({
        color: 0xff0000,
        emissive: 0xff0000,
        emissiveIntensity: 0.6
      });
      var scanLight = new THREE.Mesh(scanGeom, scanMat);
      scanLight.position.set(-13, 1, doorZ);
      scanLight.userData = { type: 'bioScanner', baseColor: 0xff0000, door: door };
      group.add(scanLight);

      // Scanner sweep line
      var sweepGeom = new THREE.BoxGeometry(0.1, 0.02, 1.2);
      var sweepMat = new THREE.MeshStandardMaterial({
        color: 0x00ff00,
        emissive: 0x00ff00,
        emissiveIntensity: 0.8
      });
      var sweep = new THREE.Mesh(sweepGeom, sweepMat);
      sweep.position.set(-13, 1, doorZ);
      sweep.userData = { type: 'bioSweep', doorZ: doorZ, baseX: -13 };
      group.add(sweep);
    }

    group.userData = { type: 'bioScanners' };
    return group;
  };

  var buildUPSBanks = function() {
    var group = new THREE.Group();

    // UPS battery cabinet rows
    for (var row = 0; row < 2; row++) {
      var rowZ = 8 + row * 2;
      for (var unit = 0; unit < 4; unit++) {
        var unitX = -6 + unit * 3;

        // UPS unit box
        var upsGeom = new THREE.BoxGeometry(1.5, 2, 1);
        var upsMat = new THREE.MeshStandardMaterial({
          color: 0x2a2a3a,
          metalness: 0.5
        });
        var upsMesh = new THREE.Mesh(upsGeom, upsMat);
        upsMesh.position.set(unitX, 1, rowZ);
        group.add(upsMesh);

        // Status indicator LED
        var ledGeom = new THREE.SphereGeometry(0.12, 8, 8);
        var ledMat = new THREE.MeshStandardMaterial({
          color: 0x00ff00,
          emissive: 0x00ff00,
          emissiveIntensity: 0.7
        });
        var led = new THREE.Mesh(ledGeom, ledMat);
        led.position.set(unitX, 1.8, rowZ - 0.4);
        group.add(led);
      }
    }

    return group;
  };

  var buildNetworkSwitchRoom = function() {
    var group = new THREE.Group();

    // Switch room outer walls (3 sides visible)
    var wall1Geom = new THREE.BoxGeometry(4, 3, 0.3);
    var wallMat = new THREE.MeshStandardMaterial({
      color: 0x1a1a2e,
      metalness: 0.4
    });
    var wall1 = new THREE.Mesh(wall1Geom, wallMat);
    wall1.position.set(-11, 1.5, 10);
    group.add(wall1);

    var wall2Geom = new THREE.BoxGeometry(0.3, 3, 4);
    var wall2 = new THREE.Mesh(wall2Geom, wallMat);
    wall2.position.set(-13, 1.5, 10);
    group.add(wall2);

    // Dense cabling visualization with LineSegments
    var cablePoints = [];
    for (var i = 0; i < 100; i++) {
      var x = -11 + Math.random() * 4;
      var y = Math.random() * 2.5 + 0.5;
      var z = 10 + Math.random() * 2;
      var x2 = x + (Math.random() - 0.5) * 0.5;
      var y2 = y + (Math.random() - 0.5) * 0.5;
      var z2 = z + (Math.random() - 0.5) * 0.5;
      cablePoints.push(new THREE.Vector3(x, y, z));
      cablePoints.push(new THREE.Vector3(x2, y2, z2));
    }
    var denseCableGeom = new THREE.BufferGeometry().setFromPoints(cablePoints);
    var denseCableMat = new THREE.LineBasicMaterial({ color: 0x00ff88, linewidth: 1 });
    var denseCables = new THREE.LineSegments(denseCableGeom, denseCableMat);
    group.add(denseCables);

    return group;
  };

  var buildCyberOpsCenter = function() {
    var group = new THREE.Group();

    // Large main screen wall
    var screenWallGeom = new THREE.BoxGeometry(8, 2.5, 0.3);
    var screenWallMat = new THREE.MeshStandardMaterial({
      color: 0x0a0a1a,
      emissive: 0x0044ff,
      emissiveIntensity: 0.3
    });
    var screenWall = new THREE.Mesh(screenWallGeom, screenWallMat);
    screenWall.position.set(0, 2, 12);
    group.add(screenWall);

    // Individual monitor tiles
    for (var i = 0; i < 9; i++) {
      var monGeom = new THREE.BoxGeometry(0.8, 0.75, 0.15);
      var monMat = new THREE.MeshStandardMaterial({
        color: 0x001155,
        emissive: 0x0088ff,
        emissiveIntensity: 0.5
      });
      var mon = new THREE.Mesh(monGeom, monMat);
      mon.position.set(
        -3 + (i % 3) * 1,
        1.5 + Math.floor(i / 3) * 0.9,
        12.3
      );
      group.add(mon);
    }

    return group;
  };

  var buildShieldingCage = function() {
    var group = new THREE.Group();

    // Faraday cage frame (BoxGeometry bars)
    var barThickness = 0.2;

    // Vertical bars
    for (var i = 0; i < 5; i++) {
      for (var j = 0; j < 5; j++) {
        var barGeom = new THREE.BoxGeometry(barThickness, 3, barThickness);
        var barMat = new THREE.MeshStandardMaterial({
          color: 0x444444,
          metalness: 0.8
        });
        var bar = new THREE.Mesh(barGeom, barMat);
        bar.position.set(-2 + i * 1, 1.5, 0 + j * 1);
        group.add(bar);
      }
    }

    // Cage mesh visualization with LineSegments
    var meshPoints = [];
    for (var i = 0; i < 5; i++) {
      for (var j = 0; j < 5; j++) {
        var x = -2 + i;
        var z = j;
        if (i < 4) {
          meshPoints.push(new THREE.Vector3(x, 1.5, z));
          meshPoints.push(new THREE.Vector3(x + 1, 1.5, z));
        }
        if (j < 4) {
          meshPoints.push(new THREE.Vector3(x, 1.5, z));
          meshPoints.push(new THREE.Vector3(x, 1.5, z + 1));
        }
      }
    }
    var meshGeom = new THREE.BufferGeometry().setFromPoints(meshPoints);
    var meshMat = new THREE.LineBasicMaterial({ color: 0x00ffff, linewidth: 1 });
    var mesh = new THREE.LineSegments(meshGeom, meshMat);
    group.add(mesh);

    return group;
  };

  var buildGeneratorRoom = function() {
    var group = new THREE.Group();

    // Generator unit
    var genGeom = new THREE.BoxGeometry(2, 2, 2.5);
    var genMat = new THREE.MeshStandardMaterial({
      color: 0x3a2a1a,
      metalness: 0.5
    });
    var gen = new THREE.Mesh(genGeom, genMat);
    gen.position.set(12, 1, 0);
    group.add(gen);

    // Engine cylinder
    var cylGeom = new THREE.CylinderGeometry(0.5, 0.5, 3, 12);
    var cylMat = new THREE.MeshStandardMaterial({
      color: 0x2a2a1a,
      metalness: 0.6
    });
    var cyl = new THREE.Mesh(cylGeom, cylMat);
    cyl.rotation.z = Math.PI / 2;
    cyl.position.set(12, 1.5, -1.5);
    group.add(cyl);

    // Exhaust vent
    var exhaustGeom = new THREE.BoxGeometry(0.8, 0.3, 0.3);
    var exhaustMat = new THREE.MeshStandardMaterial({
      color: 0x555555,
      metalness: 0.7
    });
    var exhaust = new THREE.Mesh(exhaustGeom, exhaustMat);
    exhaust.position.set(12, 2.5, 0.5);
    group.add(exhaust);

    return group;
  };

  var buildSecurityCameras = function() {
    var group = new THREE.Group();

    // 4 corner security cameras
    var positions = [
      [-12, 7, -12],
      [12, 7, -12],
      [-12, 7, 12],
      [12, 7, 12]
    ];

    for (var i = 0; i < positions.length; i++) {
      var pos = positions[i];

      // Camera mount box
      var mountGeom = new THREE.BoxGeometry(0.4, 0.4, 0.6);
      var mountMat = new THREE.MeshStandardMaterial({
        color: 0x333333,
        metalness: 0.6
      });
      var mount = new THREE.Mesh(mountGeom, mountMat);
      mount.position.set(pos[0], pos[1], pos[2]);
      group.add(mount);

      // Camera lens (SphereGeometry)
      var lensGeom = new THREE.SphereGeometry(0.15, 8, 8);
      var lensMat = new THREE.MeshStandardMaterial({
        color: 0x1a1a1a,
        metalness: 0.9
      });
      var lens = new THREE.Mesh(lensGeom, lensMat);
      lens.position.set(pos[0], pos[1], pos[2] - 0.3);
      group.add(lens);

      // Status indicator
      var statusGeom = new THREE.SphereGeometry(0.08, 8, 8);
      var statusMat = new THREE.MeshStandardMaterial({
        color: 0xff0000,
        emissive: 0xff0000,
        emissiveIntensity: 0.7
      });
      var status = new THREE.Mesh(statusGeom, statusMat);
      status.position.set(pos[0], pos[1] - 0.15, pos[2] + 0.25);
      group.add(status);
    }

    return group;
  };

  var update = function(delta) {
    time += delta;

    // Update all animated objects
    for (var i = 0; i < animatedObjects.length; i++) {
      var obj = animatedObjects[i];

      if (obj.userData.type === 'serverFarm') {
        // LED cascade animation
        var children = obj.children;
        for (var j = 0; j < children.length; j++) {
          var child = children[j];
          if (child.userData.baseIntensity) {
            var pulse = Math.sin(time * 3 + child.userData.slot * 0.3) * 0.4 + 0.6;
            if (child.material && child.material.emissiveIntensity !== undefined) {
              child.material.emissiveIntensity = child.userData.baseIntensity * pulse;
            }
          }
        }
      }

      if (obj.userData.type === 'coolingUnits') {
        // Fan rotation
        var children = obj.children;
        for (var j = 0; j < children.length; j++) {
          var child = children[j];
          if (child.userData.type === 'fan') {
            child.rotation.y += delta * 8;
          }
        }
      }

      if (obj.userData.type === 'holoDisplays') {
        // Data node pulsing and orbiting
        var children = obj.children;
        for (var j = 0; j < children.length; j++) {
          var child = children[j];
          if (child.userData.type === 'holoNode') {
            var orbit = Math.sin(time + j) * 0.5;
            child.position.y = child.userData.baseY + Math.abs(Math.cos(time * 2 + j)) * 0.3;
            child.position.x = child.userData.tableX + orbit;
            if (child.material && child.material.emissiveIntensity !== undefined) {
              child.material.emissiveIntensity = 0.6 + Math.sin(time * 2 + j) * 0.2;
            }
          }
        }
      }

      if (obj.userData.type === 'bioScanners') {
        // Door scanner sweep animation
        var children = obj.children;
        for (var j = 0; j < children.length; j++) {
          var child = children[j];
          if (child.userData.type === 'bioSweep') {
            var sweepPos = (time * 1.5) % 1;
            child.position.z = child.userData.doorZ + (sweepPos - 0.5) * 1.2;
          }
        }
      }
    }
  };

  var reset = function() {
    time = 0;
    for (var i = 0; i < objects.length; i++) {
      if (objects[i]) {
        scene.remove(objects[i]);
      }
    }
    objects = [];
    animatedObjects = [];
  };

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
