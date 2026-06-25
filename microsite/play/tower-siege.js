window.TowerSiege = (function() {
  'use strict';

  var scene;
  var camera;
  var groups = {};
  var materials = {};
  var animations = {
    fireParticles: [],
    moatWaveTime: 0,
    trebuchetAngle: 0,
    cauldronGlows: []
  };

  var init = function(initScene, initCamera) {
    scene = initScene;
    camera = initCamera;

    createMaterials();
    buildEnvironment();
  };

  var createMaterials = function() {
    materials.stone = new THREE.MeshPhongMaterial({ color: 0x8B8680, roughness: 0.8 });
    materials.darkStone = new THREE.MeshPhongMaterial({ color: 0x4A4540, roughness: 0.9 });
    materials.wood = new THREE.MeshPhongMaterial({ color: 0x654321 });
    materials.darkWood = new THREE.MeshPhongMaterial({ color: 0x3D2817 });
    materials.water = new THREE.MeshPhongMaterial({ color: 0x1E5A8E, wireframe: false, transparent: true, opacity: 0.6 });
    materials.fire = new THREE.MeshBasicMaterial({ color: 0xFF6B1A, emissive: 0xFF4500 });
    materials.iron = new THREE.MeshPhongMaterial({ color: 0x2F2F2F, metalness: 0.8 });
    materials.straw = new THREE.MeshPhongMaterial({ color: 0xD4A574 });
  };

  var buildEnvironment = function() {
    createMoat();
    createOuterWallCircuit();
    createMainTower();
    createGateUnderSiege();
    createSiegeTower();
    createBoilingOilCauldrons();
    createTrebuchet();
    createScalingLadders();
    createBurningArrows();
    createRubble();
    createLighting();
  };

  var createMoat = function() {
    var moatWidth = 140;
    var moatLength = 160;
    var moatDepth = 8;
    var moatGeometry = new THREE.BoxGeometry(moatWidth, moatDepth, moatLength);
    var moat = new THREE.Mesh(moatGeometry, materials.water);
    moat.position.set(0, -moatDepth / 2, 0);
    moat.castShadow = true;
    moat.receiveShadow = true;
    scene.add(moat);
    groups.moat = moat;
  };

  var createOuterWallCircuit = function() {
    var wallGroup = new THREE.Group();
    var wallThickness = 3;
    var wallHeight = 24;
    var wallLength = 80;

    // Four walls of the circuit
    var wallPositions = [
      { x: 0, z: wallLength / 2, rot: 0 },
      { x: 0, z: -wallLength / 2, rot: 0 },
      { x: wallLength / 2, z: 0, rot: Math.PI / 2 },
      { x: -wallLength / 2, z: 0, rot: Math.PI / 2 }
    ];

    wallPositions.forEach(function(pos) {
      var wallGeo = new THREE.BoxGeometry(wallLength, wallHeight, wallThickness);
      var wall = new THREE.Mesh(wallGeo, materials.darkStone);
      wall.position.set(pos.x, wallHeight / 2, pos.z);
      wall.rotation.y = pos.rot;
      wall.castShadow = true;
      wall.receiveShadow = true;
      wallGroup.add(wall);

      // Battlements along wall
      var battlmentCount = 10;
      for (var i = 0; i < battlmentCount; i++) {
        var batt = new THREE.Mesh(
          new THREE.BoxGeometry(2, 3, wallThickness),
          materials.stone
        );
        var offset = (i - battlmentCount / 2) * (wallLength / battlmentCount);
        batt.position.set(offset, wallHeight + 1.5, 0);
        if (pos.rot !== 0) {
          var temp = batt.position.x;
          batt.position.x = Math.cos(pos.rot) * offset;
          batt.position.z = Math.sin(pos.rot) * offset;
        } else {
          batt.position.x = offset;
        }
        batt.castShadow = true;
        wallGroup.add(batt);
      }
    });

    scene.add(wallGroup);
    groups.outerWall = wallGroup;
  };

  var createMainTower = function() {
    var towerGeometry = new THREE.BoxGeometry(20, 65, 20);
    var tower = new THREE.Mesh(towerGeometry, materials.stone);
    tower.position.set(0, 32.5, 0);
    tower.castShadow = true;
    tower.receiveShadow = true;
    scene.add(tower);

    // Tower windows using LineSegments
    var windowsMaterial = new THREE.LineBasicMaterial({ color: 0x1A1A1A, linewidth: 2 });
    var windowsGeometry = new THREE.BufferGeometry();
    var positions = [];

    // Create window grid pattern
    for (var level = 0; level < 6; level++) {
      for (var side = 0; side < 4; side++) {
        var yPos = 20 + level * 8;
        var angle = (side * Math.PI / 2);
        var x = Math.cos(angle) * 10;
        var z = Math.sin(angle) * 10;
        var w = 1.5;
        var h = 2;

        // Window frame
        positions.push(x - w/2, yPos - h/2, z);
        positions.push(x + w/2, yPos - h/2, z);
        positions.push(x + w/2, yPos - h/2, z);
        positions.push(x + w/2, yPos + h/2, z);
        positions.push(x + w/2, yPos + h/2, z);
        positions.push(x - w/2, yPos + h/2, z);
        positions.push(x - w/2, yPos + h/2, z);
        positions.push(x - w/2, yPos - h/2, z);
      }
    }

    windowsGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(positions), 3));
    var windowsLines = new THREE.LineSegments(windowsGeometry, windowsMaterial);
    scene.add(windowsLines);
    groups.tower = tower;
  };

  var createGateUnderSiege = function() {
    var gateGroup = new THREE.Group();

    // Gate structure
    var gateWidth = 15;
    var gateHeight = 12;
    var archHeight = 3;

    // Left gate pillar
    var pillarGeo = new THREE.BoxGeometry(2, gateHeight, 3);
    var pillarL = new THREE.Mesh(pillarGeo, materials.darkStone);
    pillarL.position.set(-gateWidth / 2, gateHeight / 2, 45);
    pillarL.castShadow = true;
    gateGroup.add(pillarL);

    // Right gate pillar
    var pillarR = new THREE.Mesh(pillarGeo, materials.darkStone);
    pillarR.position.set(gateWidth / 2, gateHeight / 2, 45);
    pillarR.castShadow = true;
    gateGroup.add(pillarR);

    // Arch over gate
    var archGeo = new THREE.CylinderGeometry(gateWidth / 2 + 2, gateWidth / 2 + 2, 3, 16, 8, true, 0, Math.PI);
    var arch = new THREE.Mesh(archGeo, materials.stone);
    arch.position.set(0, gateHeight, 45);
    arch.rotation.z = Math.PI / 2;
    arch.castShadow = true;
    gateGroup.add(arch);

    // Battering ram frame
    var frameGeo = new THREE.BoxGeometry(3, 4, 10);
    var frame = new THREE.Mesh(frameGeo, materials.wood);
    frame.position.set(0, 2, 30);
    frame.castShadow = true;
    gateGroup.add(frame);

    // Wheels on frame
    var wheelGeo = new THREE.CylinderGeometry(2, 2, 1, 16);
    for (var w = 0; w < 4; w++) {
      var wheel = new THREE.Mesh(wheelGeo, materials.iron);
      var xOffset = (w < 2 ? -4 : 4);
      var zOffset = (w % 2 === 0 ? -4 : 4);
      wheel.position.set(xOffset, 1, zOffset + 30);
      wheel.rotation.z = Math.PI / 2;
      wheel.castShadow = true;
      gateGroup.add(wheel);
    }

    // Battering ram log
    var logGeo = new THREE.CylinderGeometry(1.5, 1.5, 16, 12);
    var log = new THREE.Mesh(logGeo, materials.darkWood);
    log.position.set(0, 3.5, 30);
    log.rotation.z = Math.PI / 2;
    log.castShadow = true;
    gateGroup.add(log);

    // Ram head (reinforced)
    var headGeo = new THREE.SphereGeometry(2, 8, 8);
    var head = new THREE.Mesh(headGeo, materials.iron);
    head.position.set(9, 3.5, 30);
    head.castShadow = true;
    gateGroup.add(head);

    scene.add(gateGroup);
    groups.gate = gateGroup;
  };

  var createSiegeTower = function() {
    var siegeGroup = new THREE.Group();

    // Main tower structure
    var towerGeo = new THREE.BoxGeometry(10, 20, 8);
    var towerMesh = new THREE.Mesh(towerGeo, materials.wood);
    towerMesh.position.set(-50, 10, 20);
    towerMesh.castShadow = true;
    siegeGroup.add(towerMesh);

    // Ramp extending from siege tower toward wall
    var rampGeo = new THREE.BoxGeometry(8, 2, 15);
    var ramp = new THREE.Mesh(rampGeo, materials.wood);
    ramp.position.set(-42, 14, 25);
    ramp.rotation.z = 0.3;
    ramp.castShadow = true;
    siegeGroup.add(ramp);

    // Wheels on siege tower
    var wheelGeo = new THREE.CylinderGeometry(3, 3, 2, 16);
    var wheelL = new THREE.Mesh(wheelGeo, materials.iron);
    wheelL.position.set(-55, 3, 20);
    wheelL.rotation.z = Math.PI / 2;
    wheelL.castShadow = true;
    siegeGroup.add(wheelL);

    var wheelR = new THREE.Mesh(wheelGeo, materials.iron);
    wheelR.position.set(-45, 3, 20);
    wheelR.rotation.z = Math.PI / 2;
    wheelR.castShadow = true;
    siegeGroup.add(wheelR);

    // Wooden bracing
    var braceGeo = new THREE.BoxGeometry(1, 18, 1);
    var braceL = new THREE.Mesh(braceGeo, materials.darkWood);
    braceL.position.set(-55, 9, 20);
    braceL.castShadow = true;
    siegeGroup.add(braceL);

    var braceR = new THREE.Mesh(braceGeo, materials.darkWood);
    braceR.position.set(-45, 9, 20);
    braceR.castShadow = true;
    siegeGroup.add(braceR);

    scene.add(siegeGroup);
    groups.siegeTower = siegeGroup;
  };

  var createBoilingOilCauldrons = function() {
    var cauldronGroup = new THREE.Group();

    // Cauldrons on four corners of battlements
    var positions = [
      { x: 37, z: 37 },
      { x: -37, z: 37 },
      { x: 37, z: -37 },
      { x: -37, z: -37 }
    ];

    positions.forEach(function(pos) {
      // Cauldron frame
      var frameGeo = new THREE.BoxGeometry(3, 4, 3);
      var frame = new THREE.Mesh(frameGeo, materials.iron);
      frame.position.set(pos.x, 47, pos.z);
      frame.castShadow = true;
      cauldronGroup.add(frame);

      // Cauldron itself
      var cauldronGeo = new THREE.CylinderGeometry(3, 3.5, 2.5, 16);
      var cauldron = new THREE.Mesh(cauldronGeo, materials.iron);
      cauldron.position.set(pos.x, 50, pos.z);
      cauldron.castShadow = true;
      cauldronGroup.add(cauldron);

      // Fire glow - SphereGeometry flame
      var glowGeo = new THREE.SphereGeometry(4, 8, 8);
      var glowMaterial = new THREE.MeshBasicMaterial({
        color: 0xFF4500,
        emissive: 0xFF6B1A,
        transparent: true,
        opacity: 0.3
      });
      var glow = new THREE.Mesh(glowGeo, glowMaterial);
      glow.position.set(pos.x, 50, pos.z);
      cauldronGroup.add(glow);

      animations.cauldronGlows.push({
        mesh: glow,
        baseScale: 1,
        time: Math.random() * Math.PI * 2
      });
    });

    scene.add(cauldronGroup);
    groups.cauldrons = cauldronGroup;
  };

  var createTrebuchet = function() {
    var trebuchetGroup = new THREE.Group();

    // Base platform
    var baseGeo = new THREE.BoxGeometry(8, 1, 8);
    var base = new THREE.Mesh(baseGeo, materials.wood);
    base.position.set(50, 0.5, 40);
    base.castShadow = true;
    trebuchetGroup.add(base);

    // Counterweight arm - this will swing
    var armGeo = new THREE.BoxGeometry(1, 1, 18);
    var arm = new THREE.Mesh(armGeo, materials.wood);
    arm.position.set(50, 3, 40);
    arm.castShadow = true;
    trebuchetGroup.add(arm);
    animations.trebuchetArm = { mesh: arm, baseY: 3, angle: 0 };

    // Counterweight on arm
    var weightGeo = new THREE.BoxGeometry(3, 3, 3);
    var weight = new THREE.Mesh(weightGeo, materials.iron);
    weight.position.set(50, 6, 49);
    weight.castShadow = true;
    trebuchetGroup.add(weight);

    // Projectile on arm
    var projectileGeo = new THREE.SphereGeometry(1.5, 8, 8);
    var projectile = new THREE.Mesh(projectileGeo, materials.stone);
    projectile.position.set(50, 3, 22);
    projectile.castShadow = true;
    trebuchetGroup.add(projectile);
    animations.trebuchetProjectile = { mesh: projectile, baseZ: 22 };

    // Support frame
    var supportGeo = new THREE.BoxGeometry(2, 6, 2);
    var supportL = new THREE.Mesh(supportGeo, materials.darkWood);
    supportL.position.set(45, 3, 40);
    supportL.castShadow = true;
    trebuchetGroup.add(supportL);

    var supportR = new THREE.Mesh(supportGeo, materials.darkWood);
    supportR.position.set(55, 3, 40);
    supportR.castShadow = true;
    trebuchetGroup.add(supportR);

    scene.add(trebuchetGroup);
    groups.trebuchet = trebuchetGroup;
  };

  var createScalingLadders = function() {
    var ladderGroup = new THREE.Group();

    // Two ladders leaning against outer wall
    var positions = [
      { x: -20, z: 40.5 },
      { x: 20, z: 40.5 }
    ];

    positions.forEach(function(pos) {
      // Ladder frame
      var frameLeftGeo = new THREE.BoxGeometry(0.5, 14, 0.5);
      var frameL = new THREE.Mesh(frameLeftGeo, materials.wood);
      frameL.position.set(pos.x - 1.5, 7, pos.z);
      frameL.rotation.z = 0.3;
      frameL.castShadow = true;
      ladderGroup.add(frameL);

      var frameRightGeo = new THREE.BoxGeometry(0.5, 14, 0.5);
      var frameR = new THREE.Mesh(frameRightGeo, materials.wood);
      frameR.position.set(pos.x + 1.5, 7, pos.z);
      frameR.rotation.z = 0.3;
      frameR.castShadow = true;
      ladderGroup.add(frameR);

      // Rungs using LineSegments
      var rungsGeo = new THREE.BufferGeometry();
      var rungsPositions = [];
      for (var rung = 0; rung < 8; rung++) {
        var yPos = 2 + rung * 1.6;
        var xOffL = pos.x - 1.5 - Math.sin(0.3) * (7 + rung * 1.6);
        var xOffR = pos.x + 1.5 - Math.sin(0.3) * (7 + rung * 1.6);
        var zOff = pos.z + Math.cos(0.3) * (7 + rung * 1.6);
        rungsPositions.push(xOffL, yPos, zOff);
        rungsPositions.push(xOffR, yPos, zOff);
      }
      rungsGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(rungsPositions), 3));
      var rungsMaterial = new THREE.LineBasicMaterial({ color: 0x654321, linewidth: 2 });
      var rungs = new THREE.LineSegments(rungsGeo, rungsMaterial);
      ladderGroup.add(rungs);
    });

    scene.add(ladderGroup);
    groups.ladders = ladderGroup;
  };

  var createBurningArrows = function() {
    var arrowGroup = new THREE.Group();

    // Scattered burning arrows as debris
    var arrowPositions = [
      { x: -15, y: 35, z: 10 },
      { x: 10, y: 30, z: 15 },
      { x: 25, y: 32, z: 8 },
      { x: -25, y: 28, z: 20 },
      { x: 5, y: 38, z: -5 }
    ];

    arrowPositions.forEach(function(pos) {
      // Arrow shaft
      var shaftGeo = new THREE.CylinderGeometry(0.3, 0.3, 4, 8);
      var shaft = new THREE.Mesh(shaftGeo, materials.darkWood);
      shaft.position.set(pos.x, pos.y, pos.z);
      shaft.rotation.z = Math.random() * Math.PI;
      shaft.rotation.x = Math.random() * Math.PI;
      shaft.castShadow = true;
      arrowGroup.add(shaft);

      // Fire tip
      var tipGeo = new THREE.SphereGeometry(0.6, 6, 6);
      var tipMaterial = new THREE.MeshBasicMaterial({
        color: 0xFF4500,
        emissive: 0xFF6B1A
      });
      var tip = new THREE.Mesh(tipGeo, tipMaterial);
      tip.position.set(pos.x, pos.y + 2.5, pos.z);
      arrowGroup.add(tip);

      animations.fireParticles.push({
        mesh: tip,
        basePos: { x: pos.x, y: pos.y + 2.5, z: pos.z },
        time: Math.random() * Math.PI * 2
      });
    });

    scene.add(arrowGroup);
    groups.arrows = arrowGroup;
  };

  var createRubble = function() {
    var rubbleGroup = new THREE.Group();

    // Scattered stone chunks from wall damage
    var rubblePositions = [
      { x: -8, y: 0.5, z: 42 },
      { x: 5, y: 1.2, z: 44 },
      { x: -18, y: 0.8, z: 41 },
      { x: 12, y: 0.6, z: 43 },
      { x: 0, y: 0.5, z: 45 },
      { x: 20, y: 0.7, z: 40 },
      { x: -22, y: 1.0, z: 38 }
    ];

    rubblePositions.forEach(function(pos) {
      var size = 0.8 + Math.random() * 1.2;
      var rubbleGeo = new THREE.BoxGeometry(size, size * 0.7, size);
      var rubble = new THREE.Mesh(rubbleGeo, materials.darkStone);
      rubble.position.set(pos.x, pos.y, pos.z);
      rubble.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
      );
      rubble.castShadow = true;
      rubbleGroup.add(rubble);
    });

    scene.add(rubbleGroup);
    groups.rubble = rubbleGroup;
  };

  var createLighting = function() {
    // Ambient light
    var ambient = new THREE.AmbientLight(0xFFFFFF, 0.5);
    scene.add(ambient);

    // Directional light (sun)
    var sunlight = new THREE.DirectionalLight(0xFFFFFF, 1.2);
    sunlight.position.set(60, 80, 60);
    sunlight.castShadow = true;
    sunlight.shadow.mapSize.width = 2048;
    sunlight.shadow.mapSize.height = 2048;
    sunlight.shadow.camera.left = -100;
    sunlight.shadow.camera.right = 100;
    sunlight.shadow.camera.top = 100;
    sunlight.shadow.camera.bottom = -100;
    sunlight.shadow.camera.far = 200;
    scene.add(sunlight);

    // Fire glow light
    var fireLight = new THREE.PointLight(0xFF4500, 0.8, 50);
    fireLight.position.set(0, 50, 0);
    scene.add(fireLight);

    // Gate area light
    var gateLight = new THREE.PointLight(0xFFFF99, 0.6, 40);
    gateLight.position.set(0, 15, 45);
    scene.add(gateLight);
  };

  var update = function(delta) {
    // Animate fire particles (burning arrows)
    animations.fireParticles.forEach(function(particle) {
      particle.time += delta * 2;
      var wobble = Math.sin(particle.time) * 0.5;
      particle.mesh.position.y = particle.basePos.y + wobble;
      var flicker = 0.9 + Math.sin(particle.time * 3) * 0.1;
      particle.mesh.scale.set(flicker, flicker, flicker);
    });

    // Animate moat water ripple
    animations.moatWaveTime += delta;
    if (groups.moat) {
      var waveAmount = Math.sin(animations.moatWaveTime) * 0.1;
      groups.moat.position.y = -4 + waveAmount;
    }

    // Animate cauldron glows
    animations.cauldronGlows.forEach(function(glow) {
      glow.time += delta * 1.5;
      var scale = glow.baseScale + Math.sin(glow.time) * 0.3;
      glow.mesh.scale.set(scale, scale, scale);
      var opacityFlicker = 0.2 + Math.sin(glow.time * 2) * 0.1;
      glow.mesh.material.opacity = opacityFlicker;
    });

    // Animate trebuchet arm swing
    if (animations.trebuchetArm) {
      animations.trebuchetAngle += delta * 0.5;
      var angle = Math.sin(animations.trebuchetAngle) * 0.4;
      animations.trebuchetArm.mesh.rotation.x = angle;
    }

    // Animate trebuchet projectile
    if (animations.trebuchetProjectile) {
      var armAngle = Math.sin(animations.trebuchetAngle) * 0.4;
      var projectileZ = animations.trebuchetProjectile.baseZ - Math.sin(armAngle) * 8;
      animations.trebuchetProjectile.mesh.position.z = projectileZ;
    }
  };

  var reset = function() {
    animations.fireParticles = [];
    animations.moatWaveTime = 0;
    animations.trebuchetAngle = 0;
    animations.cauldronGlows = [];
    if (groups.moat) {
      groups.moat.position.y = -4;
    }
  };

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
