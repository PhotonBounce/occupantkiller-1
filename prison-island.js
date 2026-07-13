window.PrisonIsland = (function() {
  'use strict';

  var scene, camera;
  var searchlightTime = 0;
  var waterTime = 0;
  var fireParticles = [];
  var rotorAngle = 0;

  var init = function(sceneIn, cameraIn) {
    scene = sceneIn;
    camera = cameraIn;

    // Ocean water base
    var waterGeom = new THREE.BoxGeometry(500, 2, 500);
    var waterMat = new THREE.MeshStandardMaterial({ color: 0x1a5a7a, metalness: 0.3, roughness: 0.4 });
    var water = new THREE.Mesh(waterGeom, waterMat);
    water.position.y = -30;
    scene.add(water);

    // Rocky island terrain
    var islandGeom = new THREE.BoxGeometry(200, 40, 150);
    var islandMat = new THREE.MeshStandardMaterial({ color: 0x5a4a3a, roughness: 0.9 });
    var island = new THREE.Mesh(islandGeom, islandMat);
    island.position.y = -10;
    island.castShadow = true;
    scene.add(island);

    // North cellblock - long rectangular building
    var cellblock1 = createCellblock(-60, 5, -50);
    scene.add(cellblock1);

    // South cellblock
    var cellblock2 = createCellblock(60, 5, 50);
    scene.add(cellblock2);

    // Northwest guard tower
    var tower1 = createGuardTower(-70, 0, -60);
    scene.add(tower1);

    // Northeast guard tower
    var tower2 = createGuardTower(70, 0, -60);
    scene.add(tower2);

    // Southwest guard tower
    var tower3 = createGuardTower(-70, 0, 60);
    scene.add(tower3);

    // Southeast guard tower
    var tower4 = createGuardTower(70, 0, 60);
    scene.add(tower4);

    // Perimeter walls with razor wire
    createPerimeterFence();

    // Prison yard courtyard
    var yardGeom = new THREE.BoxGeometry(80, 0.5, 60);
    var yardMat = new THREE.MeshStandardMaterial({ color: 0x666666 });
    var yard = new THREE.Mesh(yardGeom, yardMat);
    yard.position.set(0, 1, 0);
    scene.add(yard);

    // Warden's office building
    var wardenGeom = new THREE.BoxGeometry(40, 25, 30);
    var wardenMat = new THREE.MeshStandardMaterial({ color: 0x4a3a2a });
    var warden = new THREE.Mesh(wardenGeom, wardenMat);
    warden.position.set(0, 12, -40);
    warden.castShadow = true;
    scene.add(warden);

    // Antenna on warden building
    var antennaGeom = new THREE.CylinderGeometry(0.3, 0.3, 20, 8);
    var antennaMat = new THREE.MeshStandardMaterial({ color: 0xcccccc });
    var antenna = new THREE.Mesh(antennaGeom, antennaMat);
    antenna.position.set(0, 36, -40);
    scene.add(antenna);

    // Helicopter landing pad on warden building roof
    var padGeom = new THREE.BoxGeometry(50, 1, 50);
    var padMat = new THREE.MeshStandardMaterial({ color: 0xff3333 });
    var pad = new THREE.Mesh(padGeom, padMat);
    pad.position.set(0, 26.5, -40);
    scene.add(pad);

    // Boat dock
    createBoatDock();

    // Guard station checkpoint
    var checkpointGeom = new THREE.BoxGeometry(20, 8, 15);
    var checkpointMat = new THREE.MeshStandardMaterial({ color: 0x333333 });
    var checkpoint = new THREE.Mesh(checkpointGeom, checkpointMat);
    checkpoint.position.set(0, 4, 70);
    checkpoint.castShadow = true;
    scene.add(checkpoint);

    // Barrier arm at checkpoint
    var barrierGeom = new THREE.BoxGeometry(20, 1, 2);
    var barrierMat = new THREE.MeshStandardMaterial({ color: 0xffaa00 });
    var barrier = new THREE.Mesh(barrierGeom, barrierMat);
    barrier.position.set(0, 8.5, 85);
    scene.add(barrier);

    // Escape attempt - makeshift ladder against cellblock 1
    createEscapeLadder(-60, 5, -50);

    // Riot damage - overturned crates
    var crateGeom = new THREE.BoxGeometry(8, 8, 8);
    var crateMat = new THREE.MeshStandardMaterial({ color: 0x8a5a2a });
    var crate1 = new THREE.Mesh(crateGeom, crateMat);
    crate1.position.set(-40, 5, -20);
    crate1.rotation.z = 0.3;
    scene.add(crate1);

    var crate2 = new THREE.Mesh(crateGeom, crateMat);
    crate2.position.set(-45, 5, -15);
    crate2.rotation.z = -0.4;
    scene.add(crate2);

    // Initialize fire particles in damaged cellblock
    for (var i = 0; i < 20; i++) {
      var fireGeom = new THREE.SphereGeometry(0.8 + Math.random() * 0.5, 4, 4);
      var fireMat = new THREE.MeshBasicMaterial({ color: new THREE.Color().setHSL(0.08, 1, 0.5 + Math.random() * 0.2) });
      var fireBall = new THREE.Mesh(fireGeom, fireMat);
      fireBall.position.set(-60 + Math.random() * 10, 10 + Math.random() * 15, -50 + Math.random() * 10);
      fireBall.velocity = new THREE.Vector3((Math.random() - 0.5) * 0.5, Math.random() * 1.5, (Math.random() - 0.5) * 0.5);
      fireBall.life = Math.random() * 3;
      fireParticles.push(fireBall);
      scene.add(fireBall);
    }
  };

  var createCellblock = function(x, y, z) {
    var group = new THREE.Group();

    // Main building body
    var blockGeom = new THREE.BoxGeometry(15, 20, 60);
    var blockMat = new THREE.MeshStandardMaterial({ color: 0x4a4a4a });
    var block = new THREE.Mesh(blockGeom, blockMat);
    block.position.set(x, y, z);
    block.castShadow = true;
    group.add(block);

    // Barred windows - use LineSegments for bars
    for (var row = 0; row < 4; row++) {
      for (var col = 0; col < 6; col++) {
        createBarredWindow(x - 6, y + 2 + row * 4, z - 20 + col * 20, group);
      }
    }

    // Roof
    var roofGeom = new THREE.BoxGeometry(15, 1, 60);
    var roofMat = new THREE.MeshStandardMaterial({ color: 0x2a2a2a });
    var roof = new THREE.Mesh(roofGeom, roofMat);
    roof.position.set(x, y + 10.5, z);
    group.add(roof);

    return group;
  };

  var createBarredWindow = function(x, y, z, parent) {
    var positions = new Float32Array([
      x, y - 1, z,    x, y + 1, z,
      x + 2, y - 1, z,    x + 2, y + 1, z,
      x + 1, y - 1, z,    x + 1, y + 1, z,
      x, y, z,    x + 2, y, z
    ]);

    var geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    var mat = new THREE.LineBasicMaterial({ color: 0x333333, linewidth: 2 });
    var lines = new THREE.LineSegments(geom, mat);
    parent.add(lines);
  };

  var createGuardTower = function(x, y, z) {
    var group = new THREE.Group();

    // Tower body
    var towerGeom = new THREE.BoxGeometry(12, 30, 12);
    var towerMat = new THREE.MeshStandardMaterial({ color: 0x5a5a5a });
    var tower = new THREE.Mesh(towerGeom, towerMat);
    tower.position.set(x, y + 15, z);
    tower.castShadow = true;
    group.add(tower);

    // Searchlight sphere on top
    var lightGeom = new THREE.SphereGeometry(2, 8, 8);
    var lightMat = new THREE.MeshStandardMaterial({ color: 0xffff99, emissive: 0xffff00 });
    var searchlight = new THREE.Mesh(lightGeom, lightMat);
    searchlight.position.set(x, y + 32, z);
    searchlight.name = 'searchlight_' + x + '_' + z;
    group.add(searchlight);

    // Guard post platform
    var platGeom = new THREE.BoxGeometry(14, 1, 14);
    var platMat = new THREE.MeshStandardMaterial({ color: 0x4a4a4a });
    var platform = new THREE.Mesh(platGeom, platMat);
    platform.position.set(x, y + 30.5, z);
    group.add(platform);

    return group;
  };

  var createPerimeterFence = function() {
    // Create razor wire fence using LineSegments around perimeter
    var wirePositions = [];

    // North side
    for (var i = 0; i < 20; i++) {
      var xPos = -80 + (i / 20) * 160;
      wirePositions.push(xPos, 15, -75);
      wirePositions.push(xPos + 2, 16, -75);
    }

    // East side
    for (var i = 0; i < 15; i++) {
      var zPos = -75 + (i / 15) * 150;
      wirePositions.push(80, 15, zPos);
      wirePositions.push(80, 16, zPos + 2);
    }

    // South side
    for (var i = 0; i < 20; i++) {
      var xPos = 80 - (i / 20) * 160;
      wirePositions.push(xPos, 15, 75);
      wirePositions.push(xPos - 2, 16, 75);
    }

    // West side
    for (var i = 0; i < 15; i++) {
      var zPos = 75 - (i / 15) * 150;
      wirePositions.push(-80, 15, zPos);
      wirePositions.push(-80, 16, zPos - 2);
    }

    var geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.BufferAttribute(new Float32Array(wirePositions), 3));
    var mat = new THREE.LineBasicMaterial({ color: 0xaa0000, linewidth: 3 });
    var fence = new THREE.LineSegments(geom, mat);
    scene.add(fence);

    // Fence walls
    var wallMat = new THREE.MeshStandardMaterial({ color: 0x555555 });

    var northWallGeom = new THREE.BoxGeometry(160, 15, 2);
    var northWall = new THREE.Mesh(northWallGeom, wallMat);
    northWall.position.set(0, 7.5, -76);
    scene.add(northWall);

    var southWallGeom = new THREE.BoxGeometry(160, 15, 2);
    var southWall = new THREE.Mesh(southWallGeom, wallMat);
    southWall.position.set(0, 7.5, 76);
    scene.add(southWall);

    var eastWallGeom = new THREE.BoxGeometry(2, 15, 150);
    var eastWall = new THREE.Mesh(eastWallGeom, wallMat);
    eastWall.position.set(81, 7.5, 0);
    scene.add(eastWall);

    var westWallGeom = new THREE.BoxGeometry(2, 15, 150);
    var westWall = new THREE.Mesh(westWallGeom, wallMat);
    westWall.position.set(-81, 7.5, 0);
    scene.add(westWall);
  };

  var createBoatDock = function() {
    // Dock platform
    var dockGeom = new THREE.BoxGeometry(40, 2, 30);
    var dockMat = new THREE.MeshStandardMaterial({ color: 0x8a6a3a });
    var dock = new THREE.Mesh(dockGeom, dockMat);
    dock.position.set(-50, 0, 80);
    scene.add(dock);

    // Patrol boat hull
    var hullGeom = new THREE.BoxGeometry(15, 4, 8);
    var hullMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a });
    var hull = new THREE.Mesh(hullGeom, hullMat);
    hull.position.set(-50, 3, 95);
    scene.add(hull);

    // Boat cabin
    var cabinGeom = new THREE.BoxGeometry(8, 5, 5);
    var cabinMat = new THREE.MeshStandardMaterial({ color: 0x2a2a2a });
    var cabin = new THREE.Mesh(cabinGeom, cabinMat);
    cabin.position.set(-50, 7, 95);
    scene.add(cabin);

    // Engine
    var engineGeom = new THREE.CylinderGeometry(1, 1.2, 3, 8);
    var engineMat = new THREE.MeshStandardMaterial({ color: 0x333333 });
    var engine = new THREE.Mesh(engineGeom, engineMat);
    engine.position.set(-50, 2, 105);
    scene.add(engine);
  };

  var createEscapeLadder = function(x, y, z) {
    var positions = [];

    // Two vertical rails
    for (var i = 0; i < 12; i++) {
      var yPos = y + (i / 12) * 18;
      positions.push(x - 2, yPos, z + 8);
      positions.push(x + 2, yPos, z + 8);
    }

    // Horizontal rungs
    for (var i = 0; i < 11; i++) {
      var yPos = y + (i / 12) * 18;
      positions.push(x - 2, yPos, z + 8);
      positions.push(x + 2, yPos, z + 8);
    }

    var geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.BufferAttribute(new Float32Array(positions), 3));
    var mat = new THREE.LineBasicMaterial({ color: 0x8a6a3a, linewidth: 2 });
    var ladder = new THREE.LineSegments(geom, mat);
    scene.add(ladder);

    // Rope over fence (makeshift escape)
    var ropePositions = [
      x, y + 20, z + 8,
      0, 20, 75,
      0, 5, 75
    ];
    var ropeGeom = new THREE.BufferGeometry();
    ropeGeom.setAttribute('position', new THREE.BufferAttribute(new Float32Array(ropePositions), 3));
    var ropeMat = new THREE.LineBasicMaterial({ color: 0xaa8844, linewidth: 3 });
    var rope = new THREE.LineSegments(ropeGeom, ropeMat);
    scene.add(rope);
  };

  var update = function(delta) {
    searchlightTime += delta;
    waterTime += delta;
    rotorAngle += delta * 15;

    // Rotate searchlights
    var searchlights = scene.children.filter(function(obj) {
      return obj.children && obj.children.some(function(child) { return child.name && child.name.includes('searchlight'); });
    });

    searchlights.forEach(function(tower) {
      tower.children.forEach(function(child) {
        if (child.name && child.name.includes('searchlight')) {
          var angle = searchlightTime * 2;
          child.position.x += Math.sin(angle) * 0.5;
          child.position.z += Math.cos(angle) * 0.5;
        }
      });
    });

    // Animate water waves
    var waterObjects = scene.children.filter(function(obj) {
      return obj.geometry instanceof THREE.BoxGeometry && obj.position.y < -20;
    });

    waterObjects.forEach(function(water) {
      water.position.y = -30 + Math.sin(waterTime * 0.5) * 0.5;
      water.rotation.z = Math.sin(waterTime * 0.3) * 0.02;
    });

    // Update fire particles
    for (var i = fireParticles.length - 1; i >= 0; i--) {
      var particle = fireParticles[i];
      particle.life -= delta;

      if (particle.life <= 0) {
        scene.remove(particle);
        fireParticles.splice(i, 1);
      } else {
        particle.position.add(particle.velocity);
        particle.scale.x *= (1 - delta * 0.5);
        particle.scale.y *= (1 - delta * 0.5);
        particle.scale.z *= (1 - delta * 0.5);

        var hue = 0.08 - (particle.life / 3) * 0.08;
        particle.material.color.setHSL(hue, 1, 0.5);
      }
    }

    // Animate guard posts (idle movement)
    var towers = scene.children.filter(function(obj) {
      return obj.children && obj.children.some(function(child) { return child.name && child.name.includes('searchlight'); });
    });

    towers.forEach(function(tower, idx) {
      tower.rotation.y = Math.sin(searchlightTime + idx) * 0.05;
    });
  };

  var reset = function() {
    searchlightTime = 0;
    waterTime = 0;
    rotorAngle = 0;
    fireParticles = [];

    if (scene) {
      var objectsToRemove = [];
      scene.traverse(function(obj) {
        if (obj !== scene && obj.parent === scene) {
          objectsToRemove.push(obj);
        }
      });

      objectsToRemove.forEach(function(obj) {
        scene.remove(obj);
      });
    }
  };

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
