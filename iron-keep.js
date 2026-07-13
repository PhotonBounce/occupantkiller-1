window.IronKeep = (function() {
  'use strict';

  var objects = [];
  var scene = null;
  var camera = null;
  var turrets = [];
  var gears = [];
  var forgeFires = [];
  var portcullis = null;
  var drawbridge = null;

  var COLORS = {
    ironBlack: 0x1a1a1a,
    rustOrange: 0xcc6633,
    forgeFire: 0xff4400,
    metallicGray: 0x888888,
    darkGray: 0x333333,
    lightGray: 0xbbbbbb
  };

  function createBox(width, height, depth, color, x, y, z, scene) {
    var geometry = new THREE.BoxGeometry(width, height, depth);
    var material = new THREE.MeshStandardMaterial({ color: color, metalness: 0.8, roughness: 0.4 });
    var mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);
    objects.push(mesh);
    return mesh;
  }

  function createCylinder(radiusTop, radiusBottom, height, color, x, y, z, scene) {
    var geometry = new THREE.CylinderGeometry(radiusTop, radiusBottom, height, 32);
    var material = new THREE.MeshStandardMaterial({ color: color, metalness: 0.8, roughness: 0.4 });
    var mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);
    objects.push(mesh);
    return mesh;
  }

  function createSphere(radius, color, x, y, z, scene) {
    var geometry = new THREE.SphereGeometry(radius, 32, 32);
    var material = new THREE.MeshStandardMaterial({ color: color, emissive: color, metalness: 0.6, roughness: 0.3 });
    var mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);
    objects.push(mesh);
    return mesh;
  }

  function createCone(radius, height, color, x, y, z, scene) {
    var geometry = new THREE.ConeGeometry(radius, height, 32);
    var material = new THREE.MeshStandardMaterial({ color: color, metalness: 0.8, roughness: 0.4 });
    var mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);
    objects.push(mesh);
    return mesh;
  }

  function createLineSegments(points, color, x, y, z, scene) {
    var geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(points), 3));
    var material = new THREE.LineBasicMaterial({ color: color, linewidth: 2 });
    var lineSegments = new THREE.LineSegments(geometry, material);
    lineSegments.position.set(x, y, z);
    scene.add(lineSegments);
    objects.push(lineSegments);
    return lineSegments;
  }

  function addRivets(meshWidth, meshHeight, meshDepth, rivetSpacing) {
    var rivets = [];
    var rivetSize = 0.3;
    for (var x = -meshWidth / 2; x <= meshWidth / 2; x += rivetSpacing) {
      for (var z = -meshDepth / 2; z <= meshDepth / 2; z += rivetSpacing) {
        var rivet = createBox(rivetSize, rivetSize, rivetSize, COLORS.darkGray, x, meshHeight / 2 + rivetSize, z, scene);
        rivets.push(rivet);
      }
    }
    return rivets;
  }

  function buildCentralKeep() {
    var keepWidth = 20;
    var keepDepth = 20;
    var keepHeight = 30;

    var keepBase = createBox(keepWidth, keepHeight, keepDepth, COLORS.ironBlack, 0, keepHeight / 2, 0, scene);
    keepBase.castShadow = true;
    keepBase.receiveShadow = true;

    addRivets(keepWidth, keepHeight, keepDepth, 4);

    var roofHeight = 4;
    var roof = createBox(keepWidth + 1, roofHeight, keepDepth + 1, COLORS.rustOrange, 0, keepHeight + roofHeight / 2, 0, scene);

    var cornerSpire1 = createCone(1.5, 5, COLORS.metallicGray, keepWidth / 2 - 1, keepHeight + 4, keepDepth / 2 - 1, scene);
    var cornerSpire2 = createCone(1.5, 5, COLORS.metallicGray, -keepWidth / 2 + 1, keepHeight + 4, keepDepth / 2 - 1, scene);
    var cornerSpire3 = createCone(1.5, 5, COLORS.metallicGray, keepWidth / 2 - 1, keepHeight + 4, -keepDepth / 2 + 1, scene);
    var cornerSpire4 = createCone(1.5, 5, COLORS.metallicGray, -keepWidth / 2 + 1, keepHeight + 4, -keepDepth / 2 + 1, scene);

    var crenellationSize = 2;
    var crenellationHeight = 3;
    var crenellationSpacing = 6;

    for (var i = 0; i < 4; i++) {
      for (var j = 0; j < 3; j++) {
        var cx = (i % 2 === 0) ? (j - 1) * crenellationSpacing : (keepWidth / 2 + 1);
        var cy = keepHeight + crenellationHeight / 2;
        var cz = (i < 2) ? ((j - 1) * crenellationSpacing) : ((i === 2) ? (keepDepth / 2 + 1) : (-keepDepth / 2 - 1));

        if (i === 0) {
          cx = (j - 1) * crenellationSpacing;
          cz = keepDepth / 2 + 1;
        } else if (i === 1) {
          cx = (j - 1) * crenellationSpacing;
          cz = -keepDepth / 2 - 1;
        } else if (i === 2) {
          cx = keepWidth / 2 + 1;
          cz = (j - 1) * crenellationSpacing;
        } else {
          cx = -keepWidth / 2 - 1;
          cz = (j - 1) * crenellationSpacing;
        }

        createBox(crenellationSize, crenellationHeight, crenellationSize, COLORS.ironBlack, cx, cy, cz, scene);
      }
    }
  }

  function buildPerimeterWalls() {
    var wallHeight = 15;
    var wallThickness = 1.5;
    var wallLength = 60;

    var northWall = createBox(wallLength, wallHeight, wallThickness, COLORS.ironBlack, 0, wallHeight / 2, wallLength / 2, scene);
    var southWall = createBox(wallLength, wallHeight, wallThickness, COLORS.ironBlack, 0, wallHeight / 2, -wallLength / 2, scene);
    var eastWall = createBox(wallThickness, wallHeight, wallLength, COLORS.ironBlack, wallLength / 2, wallHeight / 2, 0, scene);
    var westWall = createBox(wallThickness, wallHeight, wallLength, COLORS.ironBlack, -wallLength / 2, wallHeight / 2, 0, scene);

    addRivets(wallLength, wallHeight, wallThickness, 5);
    addRivets(wallThickness, wallHeight, wallLength, 5);

    var buttressSize = 2;
    var buttressHeight = wallHeight;
    var buttressSpacing = 15;

    for (var i = -1; i <= 1; i++) {
      createBox(buttressSize, buttressHeight, buttressSize, COLORS.rustOrange, i * buttressSpacing, buttressHeight / 2, wallLength / 2 + buttressSize / 2, scene);
      createBox(buttressSize, buttressHeight, buttressSize, COLORS.rustOrange, i * buttressSpacing, buttressHeight / 2, -wallLength / 2 - buttressSize / 2, scene);
      createBox(buttressSize, buttressHeight, buttressSize, COLORS.rustOrange, wallLength / 2 + buttressSize / 2, buttressHeight / 2, i * buttressSpacing, scene);
      createBox(buttressSize, buttressHeight, buttressSize, COLORS.rustOrange, -wallLength / 2 - buttressSize / 2, buttressHeight / 2, i * buttressSpacing, scene);
    }
  }

  function buildMechanicalGate() {
    var gateWidth = 8;
    var gateHeight = 12;
    var barSpacing = 0.8;
    var barThickness = 0.3;

    var gateFrame = createBox(gateWidth + 2, gateHeight + 2, 0.5, COLORS.darkGray, 0, gateHeight / 2 + 2, 28, scene);

    portcullis = {
      bars: [],
      position: 0,
      targetPosition: 0,
      group: new THREE.Group()
    };

    for (var i = 0; i < 10; i++) {
      var barX = -gateWidth / 2 + i * barSpacing;
      var bar = createBox(barThickness, gateHeight, barThickness, COLORS.ironBlack, barX, gateHeight / 2, 28, scene);
      portcullis.bars.push(bar);
    }

    var gearRadius = 2.5;
    var gearLeft = createCylinder(gearRadius, gearRadius, 1.5, COLORS.metallicGray, -gateWidth / 2 - 3, gateHeight + 2, 28, scene);
    var gearRight = createCylinder(gearRadius, gearRadius, 1.5, COLORS.metallicGray, gateWidth / 2 + 3, gateHeight + 2, 28, scene);

    gears.push({ mesh: gearLeft, speed: 2 });
    gears.push({ mesh: gearRight, speed: 2 });

    var gearTeeth = 8;
    for (var j = 0; j < gearTeeth; j++) {
      var angle = (j / gearTeeth) * Math.PI * 2;
      var toothX = -gateWidth / 2 - 3 + Math.cos(angle) * (gearRadius + 0.5);
      var toothZ = 28 + Math.sin(angle) * (gearRadius + 0.5);
      createBox(0.4, 1, 0.4, COLORS.darkGray, toothX, gateHeight + 2, toothZ, scene);
    }
  }

  function buildSteamCannons() {
    var cannonPositions = [
      { x: 25, z: 25 },
      { x: -25, z: 25 },
      { x: 25, z: -25 },
      { x: -25, z: -25 }
    ];

    cannonPositions.forEach(function(pos) {
      var mountWidth = 4;
      var mountHeight = 3;
      var mountDepth = 4;

      var mount = createBox(mountWidth, mountHeight, mountDepth, COLORS.ironBlack, pos.x, mountHeight / 2 + 2, pos.z, scene);

      var barrelRadius = 0.6;
      var barrelLength = 6;
      var barrel = createCylinder(barrelRadius, barrelRadius, barrelLength, COLORS.metallicGray, pos.x, mountHeight + 1.5, pos.z, scene);
      barrel.rotation.z = Math.PI / 6;

      var steamPipe1 = createCylinder(0.3, 0.3, 3, COLORS.darkGray, pos.x - 1.5, mountHeight + 2, pos.z, scene);
      var steamPipe2 = createCylinder(0.3, 0.3, 3, COLORS.darkGray, pos.x + 1.5, mountHeight + 2, pos.z, scene);

      var exhaustPort = createCylinder(0.4, 0.4, 0.5, COLORS.rustOrange, pos.x, mountHeight + 0.5, pos.z, scene);
    });
  }

  function buildRotatingTurrets() {
    var turretPositions = [
      { x: 28, z: 0 },
      { x: -28, z: 0 },
      { x: 0, z: 28 },
      { x: 0, z: -28 }
    ];

    turretPositions.forEach(function(pos) {
      var turretBase = createCylinder(3, 3, 4, COLORS.ironBlack, pos.x, 4, pos.z, scene);

      var roofCone = createCone(3.5, 2, COLORS.rustOrange, pos.x, 6, pos.z, scene);

      var gunArm = createBox(2, 1, 6, COLORS.metallicGray, pos.x, 6, pos.z, scene);

      var gunBarrel = createCylinder(0.4, 0.4, 4, COLORS.darkGray, pos.x, 6.5, pos.z + 3, scene);

      turrets.push({
        base: turretBase,
        arm: gunArm,
        barrel: gunBarrel,
        cone: roofCone,
        rotation: Math.random() * Math.PI * 2,
        speed: 0.3 + Math.random() * 0.2
      });

      var ringMount = createCylinder(3.2, 3.2, 0.3, COLORS.darkGray, pos.x, 2, pos.z, scene);
    });
  }

  function buildChainmailCurtain() {
    var curtainSections = [
      { x: -15, z: 32 },
      { x: 15, z: 32 },
      { x: 32, z: 15 },
      { x: 32, z: -15 }
    ];

    curtainSections.forEach(function(pos) {
      var points = [];
      var chainLinks = 6;
      var linkSpacing = 2;

      for (var i = 0; i < chainLinks; i++) {
        for (var j = 0; j < 4; j++) {
          var x = pos.x + (i * linkSpacing) - (chainLinks * linkSpacing) / 2;
          var y = 12 - (j * 3);
          var z = pos.z;

          points.push(x, y, z);
          points.push(x + linkSpacing * 0.3, y - 1.5, z);
        }
      }

      if (points.length >= 6) {
        createLineSegments(points, COLORS.darkGray, 0, 0, 0, scene);
      }
    });
  }

  function buildIronSpikeBarriers() {
    var spikePositions = [
      { x: -32, z: -32 },
      { x: 32, z: -32 },
      { x: -32, z: 32 },
      { x: 32, z: 32 }
    ];

    spikePositions.forEach(function(pos) {
      var spikeRadius = 0.4;
      var spikeHeight = 3;

      for (var i = -2; i <= 2; i++) {
        for (var j = -2; j <= 2; j++) {
          var spikeX = pos.x + i * 2;
          var spikeZ = pos.z + j * 2;
          createCone(spikeRadius, spikeHeight, COLORS.rustOrange, spikeX, spikeHeight / 2 + 0.5, spikeZ, scene);
        }
      }
    });
  }

  function buildForgeRoom() {
    var forgeX = -28;
    var forgeZ = -28;
    var forgeWidth = 10;
    var forgeHeight = 8;
    var forgeDepth = 10;

    var forgeWalls = createBox(forgeWidth, forgeHeight, forgeDepth, COLORS.ironBlack, forgeX, forgeHeight / 2, forgeZ, scene);

    var furnaceRadius = 2;
    var furnaceHeight = 6;
    var furnace = createCylinder(furnaceRadius, furnaceRadius, furnaceHeight, COLORS.darkGray, forgeX, furnaceHeight / 2 + 1, forgeZ, scene);

    var furnaceTop = createCylinder(furnaceRadius + 0.5, furnaceRadius - 0.3, 1, COLORS.rustOrange, forgeX, furnaceHeight + 1.2, forgeZ, scene);

    forgeFires.push({
      fire1: createSphere(1.5, COLORS.forgeFire, forgeX - 1, 3, forgeZ, scene),
      fire2: createSphere(1.2, COLORS.forgeFire, forgeX, 3.5, forgeZ + 1, scene),
      fire3: createSphere(1.3, COLORS.forgeFire, forgeX + 1, 3.2, forgeZ - 1, scene),
      pulsePhase: Math.random() * Math.PI * 2
    });

    for (var i = 0; i < 3; i++) {
      var toolRack = createBox(0.3, 3, 4, COLORS.metallicGray, forgeX - 3 + i * 2, 2, forgeZ, scene);
    }
  }

  function buildArmory() {
    var armoryX = 28;
    var armoryZ = -28;
    var armoryWidth = 10;
    var armoryHeight = 8;
    var armoryDepth = 10;

    var armoryWalls = createBox(armoryWidth, armoryHeight, armoryDepth, COLORS.ironBlack, armoryX, armoryHeight / 2, armoryZ, scene);

    for (var i = 0; i < 5; i++) {
      var rackX = armoryX - 2 + i * 1.5;
      var rackHolder = createBox(0.8, 4, 0.8, COLORS.metallicGray, rackX, 2.5, armoryZ, scene);

      for (var j = 0; j < 3; j++) {
        var weaponBarrel = createCylinder(0.2, 0.2, 3, COLORS.darkGray, rackX, 1.5 + j * 1.2, armoryZ - 0.5, scene);
      }
    }

    var anvil = createBox(2, 1, 2, COLORS.darkGray, armoryX, 1.5, armoryZ + 3, scene);
  }

  function buildDrawbridge() {
    var bridgeX = 0;
    var bridgeZ = -32;
    var bridgeWidth = 12;
    var bridgeLength = 8;
    var bridgeThickness = 0.8;

    drawbridge = createBox(bridgeWidth, bridgeThickness, bridgeLength, COLORS.ironBlack, bridgeX, 1, bridgeZ, scene);
    drawbridge.rotation.z = -0.3;

    var chainLeft = createCylinder(0.2, 0.2, 4, COLORS.darkGray, bridgeX - bridgeWidth / 2, 3, bridgeZ - 2, scene);
    var chainRight = createCylinder(0.2, 0.2, 4, COLORS.darkGray, bridgeX + bridgeWidth / 2, 3, bridgeZ - 2, scene);

    var anchorPointLeft = createBox(0.5, 0.5, 0.5, COLORS.metallicGray, bridgeX - bridgeWidth / 2, 5, bridgeZ - 2, scene);
    var anchorPointRight = createBox(0.5, 0.5, 0.5, COLORS.metallicGray, bridgeX + bridgeWidth / 2, 5, bridgeZ - 2, scene);
  }

  function buildMoatWithStakes() {
    var moatX = 0;
    var moatZ = 0;
    var moatWidth = 80;
    var moatDepth = 80;
    var moatDepthValue = 3;

    var moatBottom = createBox(moatWidth, moatDepthValue, moatDepth, COLORS.darkGray, moatX, -moatDepthValue / 2, moatZ, scene);

    var stakeRadius = 0.3;
    var stakeHeight = 2;
    var stakeSpacing = 4;

    for (var i = -10; i <= 10; i += stakeSpacing) {
      for (var j = -10; j <= 10; j += stakeSpacing) {
        var stakeX = moatX + i;
        var stakeZ = moatZ + j;
        createCone(stakeRadius, stakeHeight, COLORS.rustOrange, stakeX, stakeHeight / 2, stakeZ, scene);
      }
    }
  }

  function buildIronEagleStandard() {
    var flagpoleX = -25;
    var flagpoleZ = 25;
    var flagpoleRadius = 0.5;
    var flagpoleHeight = 12;

    var flagpole = createCylinder(flagpoleRadius, flagpoleRadius, flagpoleHeight, COLORS.metallicGray, flagpoleX, flagpoleHeight / 2 + 3, flagpoleZ, scene);

    var flagpoleBase = createCylinder(2, 2, 1, COLORS.ironBlack, flagpoleX, 0.5, flagpoleZ, scene);

    var eagleWingLeft = createBox(3, 0.3, 2, COLORS.ironBlack, flagpoleX - 2, flagpoleHeight + 3, flagpoleZ, scene);
    eagleWingLeft.rotation.z = 0.3;

    var eagleWingRight = createBox(3, 0.3, 2, COLORS.ironBlack, flagpoleX + 2, flagpoleHeight + 3, flagpoleZ, scene);
    eagleWingRight.rotation.z = -0.3;

    var eagleBody = createBox(1, 1.5, 2, COLORS.ironBlack, flagpoleX, flagpoleHeight + 3, flagpoleZ, scene);

    var eagleHead = createBox(0.6, 0.8, 0.8, COLORS.metallicGray, flagpoleX, flagpoleHeight + 3.5, flagpoleZ + 1, scene);

    var beakCone = createCone(0.3, 1, COLORS.rustOrange, flagpoleX, flagpoleHeight + 3.5, flagpoleZ + 1.8, scene);
  }

  function buildClockworkMechanisms() {
    var mechanismPositions = [
      { x: -28, z: 0 },
      { x: 28, z: 0 },
      { x: 0, z: -28 }
    ];

    mechanismPositions.forEach(function(pos) {
      var centerX = pos.x;
      var centerZ = pos.z;

      var mainGear = createCylinder(2.5, 2.5, 1, COLORS.metallicGray, centerX, 8, centerZ, scene);
      gears.push({ mesh: mainGear, speed: 1.5 });

      var smallGear1 = createCylinder(1.5, 1.5, 1, COLORS.darkGray, centerX + 3, 8, centerZ, scene);
      gears.push({ mesh: smallGear1, speed: 2.5 });

      var smallGear2 = createCylinder(1.5, 1.5, 1, COLORS.darkGray, centerX - 3, 8, centerZ, scene);
      gears.push({ mesh: smallGear2, speed: 2.5 });

      var gearTeeth = 12;
      for (var k = 0; k < gearTeeth; k++) {
        var angle = (k / gearTeeth) * Math.PI * 2;
        var toothX1 = centerX + Math.cos(angle) * 3;
        var toothZ1 = centerZ + Math.sin(angle) * 3;
        createBox(0.3, 0.8, 0.3, COLORS.darkGray, toothX1, 8, toothZ1, scene);

        var toothX2 = centerX + 3 + Math.cos(angle) * 2;
        var toothZ2 = centerZ + Math.sin(angle) * 2;
        createBox(0.2, 0.6, 0.2, COLORS.darkGray, toothX2, 8, toothZ2, scene);

        var toothX3 = centerX - 3 + Math.cos(angle) * 2;
        var toothZ3 = centerZ + Math.sin(angle) * 2;
        createBox(0.2, 0.6, 0.2, COLORS.darkGray, toothX3, 8, toothZ3, scene);
      }

      var axleLeft = createCylinder(0.3, 0.3, 5, COLORS.metallicGray, centerX - 1, 8, centerZ, scene);
      var axleRight = createCylinder(0.3, 0.3, 5, COLORS.metallicGray, centerX + 1, 8, centerZ, scene);

      var frame = createBox(8, 4, 0.5, COLORS.ironBlack, centerX, 8, centerZ, scene);
    });
  }

  function init(sceneParam, cameraParam) {
    scene = sceneParam;
    camera = cameraParam;
    objects = [];
    turrets = [];
    gears = [];
    forgeFires = [];

    buildCentralKeep();
    buildPerimeterWalls();
    buildMechanicalGate();
    buildSteamCannons();
    buildRotatingTurrets();
    buildChainmailCurtain();
    buildIronSpikeBarriers();
    buildForgeRoom();
    buildArmory();
    buildDrawbridge();
    buildMoatWithStakes();
    buildIronEagleStandard();
    buildClockworkMechanisms();

    return true;
  }

  function update(delta) {
    if (!scene) return;

    turrets.forEach(function(turret) {
      turret.rotation += turret.speed * delta;
      turret.arm.rotation.y = turret.rotation;
      turret.barrel.rotation.y = turret.rotation;
    });

    gears.forEach(function(gear) {
      gear.mesh.rotation.z += gear.speed * delta;
    });

    forgeFires.forEach(function(forge) {
      forge.pulsePhase += delta * 2;

      var pulse1 = 1 + Math.sin(forge.pulsePhase) * 0.15;
      var pulse2 = 1 + Math.sin(forge.pulsePhase + Math.PI / 3) * 0.15;
      var pulse3 = 1 + Math.sin(forge.pulsePhase + (2 * Math.PI / 3)) * 0.15;

      forge.fire1.scale.set(pulse1, pulse1, pulse1);
      forge.fire2.scale.set(pulse2, pulse2, pulse2);
      forge.fire3.scale.set(pulse3, pulse3, pulse3);

      var intensity1 = 0.5 + Math.sin(forge.pulsePhase) * 0.4;
      var intensity2 = 0.5 + Math.sin(forge.pulsePhase + Math.PI / 3) * 0.4;
      var intensity3 = 0.5 + Math.sin(forge.pulsePhase + (2 * Math.PI / 3)) * 0.4;

      forge.fire1.material.emissiveIntensity = intensity1;
      forge.fire2.material.emissiveIntensity = intensity2;
      forge.fire3.material.emissiveIntensity = intensity3;
    });

    if (portcullis) {
      portcullis.bars.forEach(function(bar) {
        bar.position.y += (portcullis.targetPosition - portcullis.position) * delta * 0.5;
        portcullis.position = bar.position.y;
      });
    }

    if (drawbridge) {
      var targetAngle = -0.3 + Math.sin(Date.now() * 0.0005) * 0.15;
      drawbridge.rotation.z += (targetAngle - drawbridge.rotation.z) * delta * 0.3;
    }
  }

  function reset() {
    objects.forEach(function(obj) {
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

    objects = [];
    turrets = [];
    gears = [];
    forgeFires = [];
    portcullis = null;
    drawbridge = null;
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
