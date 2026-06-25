window.ThunderKeep = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var objects = [];
  var lightningBolts = [];
  var weatherVane = null;
  var cloudCluster = null;
  var moatMesh = null;
  var lastLightningTime = 0;
  var weatherVaneRotation = 0;
  var moatGlowIntensity = 0.5;
  var moatGlowDirection = 1;

  var COLORS = {
    stormBlack: 0x1a1a2e,
    lightningBlue: 0x00d4ff,
    lightningWhite: 0xffffff,
    charredGray: 0x333333,
    copperOrange: 0xcc6600,
    darkGray: 0x2a2a3e,
    blackStone: 0x0f0f1e,
    glowBlue: 0x0099ff
  };

  function createMaterial(color, emissive) {
    emissive = emissive || 0x000000;
    return new THREE.MeshPhongMaterial({
      color: color,
      emissive: emissive,
      shininess: 30
    });
  }

  function createLineMaterial(color) {
    return new THREE.LineBasicMaterial({ color: color, linewidth: 2 });
  }

  function addObject(mesh) {
    scene.add(mesh);
    objects.push(mesh);
    return mesh;
  }

  function init(sceneRef, cameraRef) {
    scene = sceneRef;
    camera = cameraRef;
    objects = [];
    lightningBolts = [];
    lastLightningTime = 0;
    weatherVaneRotation = 0;

    // Mountain peak: large rocky summit
    var peakGeometry = new THREE.BoxGeometry(100, 40, 100);
    var peakMaterial = createMaterial(COLORS.blackStone);
    var peak = new THREE.Mesh(peakGeometry, peakMaterial);
    peak.position.set(0, -20, 0);
    peak.castShadow = true;
    peak.receiveShadow = true;
    addObject(peak);

    // Mountain texture patches (darker areas on mountain)
    for (var i = 0; i < 12; i++) {
      var patchGeometry = new THREE.BoxGeometry(
        8 + Math.random() * 15,
        6 + Math.random() * 12,
        8 + Math.random() * 15
      );
      var patchMaterial = createMaterial(COLORS.charredGray);
      var patch = new THREE.Mesh(patchGeometry, patchMaterial);
      patch.position.set(
        -40 + Math.random() * 80,
        -10 + Math.random() * 20,
        -40 + Math.random() * 80
      );
      patch.castShadow = true;
      patch.receiveShadow = true;
      addObject(patch);
    }

    // Fortress walls (4 sections forming a rough square)
    var wallHeight = 25;
    var wallThickness = 3;
    var wallDistance = 30;

    // North wall
    var northWallGeometry = new THREE.BoxGeometry(60, wallHeight, wallThickness);
    var wallMaterial = createMaterial(COLORS.stormBlack, COLORS.charredGray);
    var northWall = new THREE.Mesh(northWallGeometry, wallMaterial);
    northWall.position.set(0, 12, -wallDistance);
    northWall.castShadow = true;
    northWall.receiveShadow = true;
    addObject(northWall);

    // South wall
    var southWallGeometry = new THREE.BoxGeometry(60, wallHeight, wallThickness);
    var southWall = new THREE.Mesh(southWallGeometry, wallMaterial);
    southWall.position.set(0, 12, wallDistance);
    southWall.castShadow = true;
    southWall.receiveShadow = true;
    addObject(southWall);

    // East wall
    var eastWallGeometry = new THREE.BoxGeometry(wallThickness, wallHeight, 60);
    var eastWall = new THREE.Mesh(eastWallGeometry, wallMaterial);
    eastWall.position.set(wallDistance, 12, 0);
    eastWall.castShadow = true;
    eastWall.receiveShadow = true;
    addObject(eastWall);

    // West wall
    var westWallGeometry = new THREE.BoxGeometry(wallThickness, wallHeight, 60);
    var westWall = new THREE.Mesh(westWallGeometry, wallMaterial);
    westWall.position.set(-wallDistance, 12, 0);
    westWall.castShadow = true;
    westWall.receiveShadow = true;
    addObject(westWall);

    // Lightning scars on walls (dark patches)
    for (var w = 0; w < 16; w++) {
      var scarGeometry = new THREE.BoxGeometry(2, 8 + Math.random() * 12, 0.5);
      var scarMaterial = createMaterial(COLORS.charredGray);
      var scar = new THREE.Mesh(scarGeometry, scarMaterial);

      var wallSide = w % 4;
      if (wallSide === 0) {
        scar.position.set(
          -25 + Math.random() * 50,
          5 + Math.random() * 20,
          -wallDistance - 0.5
        );
      } else if (wallSide === 1) {
        scar.position.set(
          -25 + Math.random() * 50,
          5 + Math.random() * 20,
          wallDistance + 0.5
        );
      } else if (wallSide === 2) {
        scar.position.set(
          wallDistance + 0.5,
          5 + Math.random() * 20,
          -25 + Math.random() * 50
        );
      } else {
        scar.position.set(
          -wallDistance - 0.5,
          5 + Math.random() * 20,
          -25 + Math.random() * 50
        );
      }
      addObject(scar);
    }

    // Central keep tower
    var towerGeometry = new THREE.BoxGeometry(12, 50, 12);
    var towerMaterial = createMaterial(COLORS.stormBlack, COLORS.darkGray);
    var tower = new THREE.Mesh(towerGeometry, towerMaterial);
    tower.position.set(0, 25, 0);
    tower.castShadow = true;
    tower.receiveShadow = true;
    addObject(tower);

    // Lightning rod array on tower top
    var rodSpacing = 3;
    for (var rx = -4; rx <= 4; rx += rodSpacing) {
      for (var rz = -4; rz <= 4; rz += rodSpacing) {
        var rodGeometry = new THREE.CylinderGeometry(0.3, 0.3, 8, 8);
        var rodMaterial = createMaterial(COLORS.copperOrange, COLORS.glowBlue);
        var rod = new THREE.Mesh(rodGeometry, rodMaterial);
        rod.position.set(rx, 54, rz);
        addObject(rod);
      }
    }

    // Lightning conductor network (copper cables down walls)
    var conductorCount = 0;
    for (var c = 0; c < 8; c++) {
      var cableGeometry = new THREE.CylinderGeometry(0.4, 0.4, 45, 6);
      var cableMaterial = createMaterial(COLORS.copperOrange, COLORS.charredGray);
      var cable = new THREE.Mesh(cableGeometry, cableMaterial);
      var angle = (c / 8) * Math.PI * 2;
      cable.position.set(
        Math.cos(angle) * 10,
        12,
        Math.sin(angle) * 10
      );
      addObject(cable);
      conductorCount++;
    }

    // Ground rods at base
    for (var g = 0; g < 8; g++) {
      var groundRodGeometry = new THREE.CylinderGeometry(0.6, 0.6, 15, 8);
      var groundRodMaterial = createMaterial(COLORS.copperOrange);
      var groundRod = new THREE.Mesh(groundRodGeometry, groundRodMaterial);
      var gAngle = (g / 8) * Math.PI * 2;
      groundRod.position.set(
        Math.cos(gAngle) * 18,
        -8,
        Math.sin(gAngle) * 18
      );
      addObject(groundRod);
    }

    // Storm clouds: clusters of large spheres high above
    cloudCluster = new THREE.Group();
    var cloudSeed = 0;
    for (var clx = -25; clx <= 25; clx += 15) {
      for (var clz = -25; clz <= 25; clz += 15) {
        for (var cly = 0; cly < 3; cly++) {
          var cloudGeometry = new THREE.SphereGeometry(8 + Math.random() * 6, 8, 8);
          var cloudMaterial = createMaterial(COLORS.darkGray, 0x222222);
          var cloud = new THREE.Mesh(cloudGeometry, cloudMaterial);
          cloud.position.set(
            clx + (Math.random() - 0.5) * 8,
            65 + cly * 12 + Math.random() * 8,
            clz + (Math.random() - 0.5) * 8
          );
          cloud.scale.set(
            0.8 + Math.random() * 0.4,
            0.7 + Math.random() * 0.3,
            0.8 + Math.random() * 0.4
          );
          cloudCluster.add(cloud);
        }
      }
    }
    scene.add(cloudCluster);
    objects.push(cloudCluster);

    // Burned battlements (crenellations) on walls
    var crenelHeight = 4;
    var crenelSpacing = 4;

    // North battlements
    for (var bn = -28; bn <= 28; bn += crenelSpacing * 2) {
      var crenelGeometry = new THREE.BoxGeometry(3, crenelHeight, 2);
      var crenelMaterial = createMaterial(COLORS.charredGray);
      var crenel = new THREE.Mesh(crenelGeometry, crenelMaterial);
      crenel.position.set(bn, 24, -wallDistance - 1);
      addObject(crenel);
    }

    // South battlements
    for (var bs = -28; bs <= 28; bs += crenelSpacing * 2) {
      var crenelGeometry2 = new THREE.BoxGeometry(3, crenelHeight, 2);
      var crenel2 = new THREE.Mesh(crenelGeometry2, crenelMaterial);
      crenel2.position.set(bs, 24, wallDistance + 1);
      addObject(crenel2);
    }

    // East battlements
    for (var be = -28; be <= 28; be += crenelSpacing * 2) {
      var crenelGeometry3 = new THREE.BoxGeometry(2, crenelHeight, 3);
      var crenel3 = new THREE.Mesh(crenelGeometry3, crenelMaterial);
      crenel3.position.set(wallDistance + 1, 24, be);
      addObject(crenel3);
    }

    // West battlements
    for (var bw = -28; bw <= 28; bw += crenelSpacing * 2) {
      var crenelGeometry4 = new THREE.BoxGeometry(2, crenelHeight, 3);
      var crenel4 = new THREE.Mesh(crenelGeometry4, crenelMaterial);
      crenel4.position.set(-wallDistance - 1, 24, bw);
      addObject(crenel4);
    }

    // Thunder cannon (large weapon)
    var cannonBaseGeometry = new THREE.BoxGeometry(8, 6, 8);
    var cannonBaseMaterial = createMaterial(COLORS.stormBlack);
    var cannonBase = new THREE.Mesh(cannonBaseGeometry, cannonBaseMaterial);
    cannonBase.position.set(-22, 18, -22);
    addObject(cannonBase);

    // Cannon barrel (cylinder)
    var barrelGeometry = new THREE.CylinderGeometry(1.2, 1.2, 16, 12);
    var barrelMaterial = createMaterial(COLORS.copperOrange, COLORS.charredGray);
    var barrel = new THREE.Mesh(barrelGeometry, barrelMaterial);
    barrel.position.set(-22, 22, -22);
    barrel.rotation.z = Math.PI / 6;
    addObject(barrel);

    // Charge coils around barrel
    for (var cc = 0; cc < 4; cc++) {
      var coilGeometry = new THREE.CylinderGeometry(2, 2, 3, 8);
      var coilMaterial = createMaterial(COLORS.stormBlack, COLORS.lightningBlue);
      var coil = new THREE.Mesh(coilGeometry, coilMaterial);
      coil.position.set(-22 + (cc - 1.5) * 3, 20, -22);
      addObject(coil);
    }

    // Shelter tunnels (underground passages)
    var tunnelWidth = 6;
    var tunnelHeight = 5;

    // Tunnel entrance hatch 1
    var hatch1Geometry = new THREE.BoxGeometry(4, 3, 4);
    var hatchMaterial = createMaterial(COLORS.stormBlack);
    var hatch1 = new THREE.Mesh(hatch1Geometry, hatchMaterial);
    hatch1.position.set(15, 2, 15);
    addObject(hatch1);

    // Chain for hatch 1
    var chain1Points = [
      new THREE.Vector3(15, 2, 15),
      new THREE.Vector3(15, 6, 15),
      new THREE.Vector3(18, 8, 15)
    ];
    var chain1Geometry = new THREE.BufferGeometry().setFromPoints(chain1Points);
    var chainMaterial = createLineMaterial(COLORS.copperOrange);
    var chain1 = new THREE.LineSegments(chain1Geometry, chainMaterial);
    addObject(chain1);

    // Underground tunnel passages
    for (var t = 0; t < 3; t++) {
      var tunnelGeometry = new THREE.BoxGeometry(tunnelWidth, tunnelHeight, 25);
      var tunnelMaterial = createMaterial(COLORS.charredGray);
      var tunnel = new THREE.Mesh(tunnelGeometry, tunnelMaterial);
      tunnel.position.set(-10 + t * 20, -5, 0);
      addObject(tunnel);
    }

    // Tunnel entrance hatch 2
    var hatch2Geometry = new THREE.BoxGeometry(4, 3, 4);
    var hatch2 = new THREE.Mesh(hatch2Geometry, hatchMaterial);
    hatch2.position.set(-15, 2, 15);
    addObject(hatch2);

    // Lightning collection array: rows of rods on platform
    var platformGeometry = new THREE.BoxGeometry(40, 2, 20);
    var platformMaterial = createMaterial(COLORS.stormBlack);
    var platform = new THREE.Mesh(platformGeometry, platformMaterial);
    platform.position.set(0, 35, 20);
    addObject(platform);

    var rodSpacing2 = 3.5;
    for (var prx = -18; prx <= 18; prx += rodSpacing2) {
      for (var prz = 15; prz <= 25; prz += rodSpacing2) {
        var collectionRodGeometry = new THREE.CylinderGeometry(0.4, 0.4, 10, 8);
        var collectionRodMaterial = createMaterial(COLORS.copperOrange, COLORS.lightningBlue);
        var collectionRod = new THREE.Mesh(collectionRodGeometry, collectionRodMaterial);
        collectionRod.position.set(prx, 40, prz);
        addObject(collectionRod);
      }
    }

    // Electrified moat: BoxGeometry water channel
    var moatGeometry = new THREE.BoxGeometry(95, 3, 95);
    var moatMaterial = createMaterial(COLORS.glowBlue, COLORS.glowBlue);
    moatMesh = new THREE.Mesh(moatGeometry, moatMaterial);
    moatMesh.position.set(0, -30, 0);
    moatMesh.receiveShadow = true;
    addObject(moatMesh);

    // Moat edge walls
    for (var me = 0; me < 4; me++) {
      var moatEdgeGeometry = new THREE.BoxGeometry(97, 2, 2);
      var moatEdgeMaterial = createMaterial(COLORS.lightningBlue, COLORS.glowBlue);
      var moatEdge = new THREE.Mesh(moatEdgeGeometry, moatEdgeMaterial);

      if (me === 0) {
        moatEdge.position.set(0, -29, 47.5);
      } else if (me === 1) {
        moatEdge.position.set(0, -29, -47.5);
      } else if (me === 2) {
        moatEdge.rotation.z = Math.PI / 2;
        moatEdge.position.set(47.5, -29, 0);
      } else {
        moatEdge.rotation.z = Math.PI / 2;
        moatEdge.position.set(-47.5, -29, 0);
      }
      addObject(moatEdge);
    }

    // Weather vane: mast with rotating cone arrow
    var mastGeometry = new THREE.CylinderGeometry(0.5, 0.5, 12, 8);
    var mastMaterial = createMaterial(COLORS.copperOrange);
    var mast = new THREE.Mesh(mastGeometry, mastMaterial);
    mast.position.set(22, 30, -22);
    addObject(mast);

    // Weather vane arrow (cone)
    var arrowGeometry = new THREE.ConeGeometry(1.5, 5, 8);
    var arrowMaterial = createMaterial(COLORS.charredGray, COLORS.lightningBlue);
    weatherVane = new THREE.Mesh(arrowGeometry, arrowMaterial);
    weatherVane.position.set(22, 36, -22);
    weatherVane.rotation.z = Math.PI / 2;
    addObject(weatherVane);

    // Additional lightning rod clusters
    for (var lr = 0; lr < 6; lr++) {
      var lrGeometry = new THREE.CylinderGeometry(0.3, 0.3, 6, 8);
      var lrMaterial = createMaterial(COLORS.copperOrange, COLORS.glowBlue);
      var lrods = new THREE.Mesh(lrGeometry, lrMaterial);
      var lrAngle = (lr / 6) * Math.PI * 2;
      lrods.position.set(
        Math.cos(lrAngle) * 12,
        40,
        Math.sin(lrAngle) * 12
      );
      addObject(lrods);
    }

    // Create initial lightning bolts
    createLightningBolts();
  }

  function createLightningBolts() {
    // Remove old lightning bolts
    for (var lb = 0; lb < lightningBolts.length; lb++) {
      scene.remove(lightningBolts[lb]);
    }
    lightningBolts = [];

    // Create new random lightning bolts
    for (var nb = 0; nb < 3; nb++) {
      var startX = -15 + Math.random() * 30;
      var startZ = -15 + Math.random() * 30;
      var startY = 70;
      var endX = startX + (Math.random() - 0.5) * 10;
      var endZ = startZ + (Math.random() - 0.5) * 10;
      var endY = 50 + Math.random() * 5;

      var points = [];
      var segments = 8;
      for (var s = 0; s <= segments; s++) {
        var t = s / segments;
        var x = startX + (endX - startX) * t + (Math.random() - 0.5) * 3;
        var y = startY + (endY - startY) * t + (Math.random() - 0.5) * 4;
        var z = startZ + (endZ - startZ) * t + (Math.random() - 0.5) * 3;
        points.push(new THREE.Vector3(x, y, z));
      }

      var boltGeometry = new THREE.BufferGeometry().setFromPoints(points);
      var boltMaterial = createLineMaterial(COLORS.lightningWhite);
      var bolt = new THREE.LineSegments(boltGeometry, boltMaterial);
      scene.add(bolt);
      lightningBolts.push(bolt);
    }
  }

  function update(delta) {
    if (!scene || !camera) return;

    // Lightning bolt flashing and regeneration
    lastLightningTime += delta;
    if (lastLightningTime > 2 + Math.random() * 4) {
      createLightningBolts();
      lastLightningTime = 0;
    }

    // Lightning bolt visibility (flash effect)
    for (var lb = 0; lb < lightningBolts.length; lb++) {
      var alpha = 1.0;
      if (lastLightningTime > 1.5) {
        alpha = Math.max(0, 1 - (lastLightningTime - 1.5) / 0.5);
      }
      lightningBolts[lb].material.opacity = alpha;
    }

    // Weather vane spinning
    if (weatherVane) {
      weatherVaneRotation += delta * 0.3;
      weatherVane.rotation.y = weatherVaneRotation;
    }

    // Cloud cluster slow drift
    if (cloudCluster) {
      cloudCluster.position.x = Math.sin(lastLightningTime * 0.2) * 5;
      cloudCluster.position.z = Math.cos(lastLightningTime * 0.15) * 5;
    }

    // Moat glow pulsing
    if (moatMesh) {
      moatGlowIntensity += moatGlowDirection * delta * 0.5;
      if (moatGlowIntensity >= 1.0) {
        moatGlowIntensity = 1.0;
        moatGlowDirection = -1;
      } else if (moatGlowIntensity <= 0.3) {
        moatGlowIntensity = 0.3;
        moatGlowDirection = 1;
      }

      var glowColor = new THREE.Color(COLORS.glowBlue);
      glowColor.multiplyScalar(moatGlowIntensity);
      moatMesh.material.emissive = glowColor;
    }
  }

  function reset() {
    // Remove all objects from scene
    for (var i = objects.length - 1; i >= 0; i--) {
      scene.remove(objects[i]);
    }
    objects = [];

    // Remove lightning bolts
    for (var lb = 0; lb < lightningBolts.length; lb++) {
      scene.remove(lightningBolts[lb]);
    }
    lightningBolts = [];

    // Reset state
    weatherVane = null;
    cloudCluster = null;
    moatMesh = null;
    lastLightningTime = 0;
    weatherVaneRotation = 0;
    moatGlowIntensity = 0.5;
    moatGlowDirection = 1;
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
