window.FallenTemple = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var objects = [];
  var fireflies = [];
  var waterfall = null;
  var vines = [];
  var animationTime = 0;

  var MATERIALS = {};

  function createMaterials() {
    MATERIALS.stoneGray = new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.8, metalness: 0.1 });
    MATERIALS.darkStone = new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 0.9, metalness: 0 });
    MATERIALS.mossGreen = new THREE.MeshStandardMaterial({ color: 0x6b8e23, roughness: 0.7, metalness: 0 });
    MATERIALS.jungleGreen = new THREE.MeshStandardMaterial({ color: 0x2d5016, roughness: 0.8, metalness: 0 });
    MATERIALS.earthBrown = new THREE.MeshStandardMaterial({ color: 0x654321, roughness: 0.9, metalness: 0 });
    MATERIALS.darkBrown = new THREE.MeshStandardMaterial({ color: 0x3d2817, roughness: 0.85, metalness: 0 });
    MATERIALS.glowing = new THREE.MeshStandardMaterial({ color: 0xffff00, emissive: 0xffff00, emissiveIntensity: 0.8, roughness: 0.3, metalness: 0.5 });
    MATERIALS.water = new THREE.MeshStandardMaterial({ color: 0x4da6ff, emissive: 0x1a73e8, emissiveIntensity: 0.3, roughness: 0.2, metalness: 0.3 });
    MATERIALS.vines = new THREE.LineBasicMaterial({ color: 0x3d5c1b, linewidth: 2 });
  }

  function addObject(mesh) {
    scene.add(mesh);
    objects.push(mesh);
    return mesh;
  }

  function createTempleMainPyramid() {
    var pyramidGroup = new THREE.Group();

    // Main stepped pyramid structure - multiple tiers with partial collapse
    var tierSizes = [
      { width: 50, depth: 50, height: 8, y: 4 },
      { width: 42, depth: 42, height: 8, y: 16 },
      { width: 34, depth: 34, height: 8, y: 28 },
      { width: 26, depth: 26, height: 8, y: 40 },
      { width: 18, depth: 18, height: 8, y: 52 },
      { width: 10, depth: 10, height: 8, y: 64 }
    ];

    for (var i = 0; i < tierSizes.length; i++) {
      var tier = tierSizes[i];
      var pyramidTier = new THREE.Mesh(
        new THREE.BoxGeometry(tier.width, tier.height, tier.depth),
        MATERIALS.stoneGray
      );
      pyramidTier.position.y = tier.y;
      pyramidGroup.add(pyramidTier);

      // Collapsed sections on some tiers
      if (i === 1 || i === 3) {
        var rubble = new THREE.Mesh(
          new THREE.BoxGeometry(tier.width * 0.4, tier.height * 0.6, tier.depth * 0.5),
          MATERIALS.darkStone
        );
        rubble.position.set(tier.width * 0.35, tier.y + 6, 0);
        rubble.rotation.z = Math.PI / 8;
        pyramidGroup.add(rubble);

        var rubble2 = new THREE.Mesh(
          new THREE.BoxGeometry(tier.width * 0.35, tier.height * 0.5, tier.depth * 0.4),
          MATERIALS.stoneGray
        );
        rubble2.position.set(-tier.width * 0.3, tier.y - 4, tier.depth * 0.3);
        rubble2.rotation.x = Math.PI / 12;
        pyramidGroup.add(rubble2);
      }
    }

    pyramidGroup.position.set(0, 0, 0);
    addObject(pyramidGroup);
  }

  function createFallenStoneBlocks() {
    var positions = [
      { x: -35, y: 2, z: -35, rx: 0.3, rz: 0.5, sx: 12, sy: 4, sz: 8 },
      { x: 35, y: 1, z: -40, rx: 0.2, rz: -0.4, sx: 10, sy: 3, sz: 7 },
      { x: -40, y: 1.5, z: 35, rx: -0.3, rz: 0.3, sx: 14, sy: 4, sz: 9 },
      { x: 38, y: 2, z: 35, rx: 0.4, rz: 0.2, sx: 11, sy: 3.5, sz: 8 },
      { x: -20, y: 1, z: -25, rx: 0.1, rz: 0.6, sx: 8, sy: 3, sz: 6 },
      { x: 25, y: 2, z: 28, rx: -0.2, rz: -0.3, sx: 9, sy: 3.5, sz: 7 },
      { x: 0, y: 1.5, z: -38, rx: 0.25, rz: 0.4, sx: 13, sy: 4, sz: 8 },
      { x: -30, y: 2, z: 5, rx: 0.15, rz: -0.5, sx: 10, sy: 3, sz: 6 },
      { x: 32, y: 1, z: -18, rx: -0.3, rz: 0.2, sx: 11, sy: 3.5, sz: 7 },
      { x: -22, y: 2, z: -18, rx: 0.2, rz: 0.35, sx: 9, sy: 3, sz: 6 },
      { x: 15, y: 1.5, z: 30, rx: -0.1, rz: -0.4, sx: 8, sy: 3, sz: 5 },
      { x: -18, y: 1, z: 22, rx: 0.3, rz: 0.1, sx: 7, sy: 3, sz: 5 }
    ];

    for (var i = 0; i < positions.length; i++) {
      var pos = positions[i];
      var block = new THREE.Mesh(
        new THREE.BoxGeometry(pos.sx, pos.sy, pos.sz),
        MATERIALS.darkStone
      );
      block.position.set(pos.x, pos.y, pos.z);
      block.rotation.x = pos.rx;
      block.rotation.z = pos.rz;
      addObject(block);
    }
  }

  function createTreeTrunks() {
    var trunkPositions = [
      { x: -15, y: 15, z: 20, h: 35 },
      { x: 18, y: 18, z: -22, h: 38 },
      { x: -25, y: 10, z: -30, h: 25 },
      { x: 28, y: 12, z: 15, h: 30 },
      { x: 0, y: 20, z: 25, h: 40 },
      { x: 12, y: 8, z: -15, h: 22 },
      { x: -30, y: 14, z: 8, h: 32 },
      { x: 22, y: 16, z: 25, h: 35 },
      { x: -8, y: 6, z: -28, h: 20 }
    ];

    for (var i = 0; i < trunkPositions.length; i++) {
      var tpos = trunkPositions[i];
      var trunk = new THREE.Mesh(
        new THREE.CylinderGeometry(2.5, 3.5, tpos.h, 8),
        MATERIALS.darkBrown
      );
      trunk.position.set(tpos.x, tpos.y + tpos.h / 2, tpos.z);
      addObject(trunk);

      // Canopy shapes
      var canopyHeight = tpos.h + 12;
      var canopy1 = new THREE.Mesh(
        new THREE.ConeGeometry(18, 16, 8),
        MATERIALS.jungleGreen
      );
      canopy1.position.set(tpos.x, canopyHeight, tpos.z);
      addObject(canopy1);

      var canopy2 = new THREE.Mesh(
        new THREE.ConeGeometry(14, 12, 8),
        MATERIALS.mossGreen
      );
      canopy2.position.set(tpos.x + 5, canopyHeight + 8, tpos.z + 3);
      addObject(canopy2);
    }
  }

  function createVineNetworks() {
    var vineConfigs = [
      { start: [-30, 50, 15], end: [0, 5, 15], segments: 15 },
      { start: [25, 55, -20], end: [25, 5, 0], segments: 20 },
      { start: [-15, 60, -25], end: [15, 8, -25], segments: 18 },
      { start: [35, 45, 30], end: [5, 0, 35], segments: 16 },
      { start: [-25, 58, 0], end: [-35, 5, 20], segments: 17 },
      { start: [20, 50, 20], end: [-10, 3, 10], segments: 19 }
    ];

    for (var i = 0; i < vineConfigs.length; i++) {
      var config = vineConfigs[i];
      var points = [];
      for (var j = 0; j <= config.segments; j++) {
        var t = j / config.segments;
        var x = config.start[0] + (config.end[0] - config.start[0]) * t;
        var y = config.start[1] + (config.end[1] - config.start[1]) * t;
        var z = config.start[2] + (config.end[2] - config.start[2]) * t;

        // Add slight wave to vine
        var waveAmount = Math.sin(t * Math.PI) * 3;
        x += waveAmount;

        points.push(new THREE.Vector3(x, y, z));
      }

      var geometry = new THREE.BufferGeometry().setFromPoints(points);
      var vine = new THREE.LineSegments(geometry, MATERIALS.vines);
      scene.add(vine);
      vines.push({ mesh: vine, points: points, originalPoints: points.map(function(p) { return p.clone(); }) });
    }
  }

  function createHiddenChamberEntrance() {
    // Partly-obscured doorway in pyramid side
    var doorFrame = new THREE.Mesh(
      new THREE.BoxGeometry(12, 16, 2),
      MATERIALS.darkStone
    );
    doorFrame.position.set(0, 35, -28);
    addObject(doorFrame);

    // Door opening
    var doorInner = new THREE.Mesh(
      new THREE.BoxGeometry(10, 14, 1),
      MATERIALS.darkStone
    );
    doorInner.position.set(0, 35, -26);
    addObject(doorInner);

    // Stone debris blocking entrance
    var debris1 = new THREE.Mesh(
      new THREE.BoxGeometry(8, 6, 3),
      MATERIALS.stoneGray
    );
    debris1.position.set(-3, 28, -27);
    debris1.rotation.z = 0.3;
    addObject(debris1);

    var debris2 = new THREE.Mesh(
      new THREE.BoxGeometry(7, 5, 3),
      MATERIALS.darkStone
    );
    debris2.position.set(4, 30, -26);
    debris2.rotation.z = -0.2;
    addObject(debris2);
  }

  function createAncientAltar() {
    // Cleared jungle clearing area
    var clearingBase = new THREE.Mesh(
      new THREE.BoxGeometry(30, 0.5, 30),
      MATERIALS.earthBrown
    );
    clearingBase.position.set(-35, 0.2, -35);
    addObject(clearingBase);

    // Altar platform
    var altarPlatform = new THREE.Mesh(
      new THREE.BoxGeometry(12, 2, 12),
      MATERIALS.stoneGray
    );
    altarPlatform.position.set(-35, 1.5, -35);
    addObject(altarPlatform);

    // Altar main structure
    var altarMain = new THREE.Mesh(
      new THREE.BoxGeometry(8, 8, 8),
      MATERIALS.darkStone
    );
    altarMain.position.set(-35, 6, -35);
    addObject(altarMain);

    // Altar top ceremonial section
    var altarTop = new THREE.Mesh(
      new THREE.BoxGeometry(10, 2, 10),
      MATERIALS.stoneGray
    );
    altarTop.position.set(-35, 11, -35);
    addObject(altarTop);

    // Ornamental pillars around altar
    for (var i = 0; i < 4; i++) {
      var angle = (i / 4) * Math.PI * 2;
      var px = -35 + Math.cos(angle) * 15;
      var pz = -35 + Math.sin(angle) * 15;

      var pillar = new THREE.Mesh(
        new THREE.CylinderGeometry(1.5, 1.8, 10, 6),
        MATERIALS.darkStone
      );
      pillar.position.set(px, 5, pz);
      addObject(pillar);
    }
  }

  function createRootInvasion() {
    // Large root sections cracking through temple
    var rootConfigs = [
      { x: 10, y: 15, z: -5, sx: 3, sy: 18, sz: 2.5, rx: 0.4 },
      { x: -15, y: 20, z: 12, sx: 2.5, sy: 22, sz: 2, rx: -0.3 },
      { x: 20, y: 10, z: 20, sx: 3.5, sy: 14, sz: 2.5, rx: 0.5 },
      { x: -5, y: 25, z: -20, sx: 2, sy: 26, sz: 2, rx: -0.4 },
      { x: 15, y: 18, z: 5, sx: 2.5, sy: 20, sz: 2.5, rx: 0.3 },
      { x: -25, y: 22, z: -8, sx: 3, sy: 24, sz: 2, rx: -0.5 }
    ];

    for (var i = 0; i < rootConfigs.length; i++) {
      var cfg = rootConfigs[i];
      var root = new THREE.Mesh(
        new THREE.BoxGeometry(cfg.sx, cfg.sy, cfg.sz),
        MATERIALS.darkBrown
      );
      root.position.set(cfg.x, cfg.y, cfg.z);
      root.rotation.x = cfg.rx;
      addObject(root);
    }
  }

  function createTempleGuardians() {
    // Stone statue remnants - heads, torsos, limbs scattered
    // Head 1
    var head1 = new THREE.Mesh(
      new THREE.SphereGeometry(4, 8, 8),
      MATERIALS.stoneGray
    );
    head1.position.set(8, 3, -12);
    addObject(head1);

    // Torso pieces
    var torso1 = new THREE.Mesh(
      new THREE.BoxGeometry(6, 10, 5),
      MATERIALS.darkStone
    );
    torso1.position.set(-12, 4, 8);
    torso1.rotation.z = 0.3;
    addObject(torso1);

    var torso2 = new THREE.Mesh(
      new THREE.BoxGeometry(5, 9, 5),
      MATERIALS.stoneGray
    );
    torso2.position.set(25, 3, -18);
    torso2.rotation.z = -0.4;
    addObject(torso2);

    // Limb pieces scattered
    var limb1 = new THREE.Mesh(
      new THREE.BoxGeometry(2.5, 8, 2),
      MATERIALS.darkStone
    );
    limb1.position.set(-20, 2, 18);
    addObject(limb1);

    var limb2 = new THREE.Mesh(
      new THREE.BoxGeometry(2, 7, 2),
      MATERIALS.stoneGray
    );
    limb2.position.set(28, 2, 12);
    addObject(limb2);

    var limb3 = new THREE.Mesh(
      new THREE.BoxGeometry(2.5, 6, 2),
      MATERIALS.darkStone
    );
    limb3.position.set(5, 2, 32);
    addObject(limb3);

    // Head 2
    var head2 = new THREE.Mesh(
      new THREE.SphereGeometry(3.5, 8, 8),
      MATERIALS.stoneGray
    );
    head2.position.set(-32, 3, 12);
    addObject(head2);

    // Arm piece
    var arm = new THREE.Mesh(
      new THREE.BoxGeometry(2, 9, 2),
      MATERIALS.darkStone
    );
    arm.position.set(15, 2, -32);
    arm.rotation.z = 0.5;
    addObject(arm);
  }

  function createJungleUndergrowth() {
    // Many small bush shapes at ground level
    var bushCount = 45;
    for (var i = 0; i < bushCount; i++) {
      var angle = Math.random() * Math.PI * 2;
      var radius = 15 + Math.random() * 30;
      var x = Math.cos(angle) * radius;
      var z = Math.sin(angle) * radius;

      var bush = new THREE.Mesh(
        new THREE.ConeGeometry(2 + Math.random() * 1.5, 2.5 + Math.random() * 1, 6),
        MATERIALS.jungleGreen
      );
      bush.position.set(x, 1.2, z);
      addObject(bush);

      // Add some moss variants
      if (Math.random() > 0.5) {
        var subBush = new THREE.Mesh(
          new THREE.ConeGeometry(1.5 + Math.random() * 1, 1.5 + Math.random() * 0.8, 5),
          MATERIALS.mossGreen
        );
        subBush.position.set(x + (Math.random() - 0.5) * 2, 1, z + (Math.random() - 0.5) * 2);
        addObject(subBush);
      }
    }
  }

  function createArchaeologicalCamp() {
    var campX = 32;
    var campZ = -32;

    // Tent 1
    var tent1Base = new THREE.Mesh(
      new THREE.BoxGeometry(8, 0.3, 8),
      MATERIALS.earthBrown
    );
    tent1Base.position.set(campX, 0.1, campZ);
    addObject(tent1Base);

    var tent1Frame = new THREE.Mesh(
      new THREE.BoxGeometry(7, 6, 7),
      MATERIALS.earthBrown
    );
    tent1Frame.position.set(campX, 3.2, campZ);
    addObject(tent1Frame);

    // Tent 2
    var tent2Base = new THREE.Mesh(
      new THREE.BoxGeometry(7, 0.3, 7),
      MATERIALS.earthBrown
    );
    tent2Base.position.set(campX + 12, 0.1, campZ);
    addObject(tent2Base);

    var tent2Frame = new THREE.Mesh(
      new THREE.BoxGeometry(6, 5.5, 6),
      MATERIALS.earthBrown
    );
    tent2Frame.position.set(campX + 12, 3, campZ);
    addObject(tent2Frame);

    // Equipment crates
    var crate1 = new THREE.Mesh(
      new THREE.BoxGeometry(3, 2, 3),
      MATERIALS.darkBrown
    );
    crate1.position.set(campX - 8, 1, campZ - 10);
    addObject(crate1);

    var crate2 = new THREE.Mesh(
      new THREE.BoxGeometry(2.5, 1.8, 2.5),
      MATERIALS.darkBrown
    );
    crate2.position.set(campX - 5, 1, campZ - 12);
    addObject(crate2);

    // Workbench
    var workbench = new THREE.Mesh(
      new THREE.BoxGeometry(6, 1, 3),
      MATERIALS.darkBrown
    );
    workbench.position.set(campX + 6, 1, campZ - 10);
    addObject(workbench);

    // Shelving structure
    for (var i = 0; i < 3; i++) {
      var shelf = new THREE.Mesh(
        new THREE.BoxGeometry(4, 0.5, 2),
        MATERIALS.stoneGray
      );
      shelf.position.set(campX + 8, 2 + i * 2, campZ + 8);
      addObject(shelf);
    }
  }

  function createArtifactDisplay() {
    // Glowing artifacts on pedestals
    var artifactPositions = [
      { x: -38, z: 0 },
      { x: -35, z: 8 },
      { x: -30, z: -8 },
      { x: 0, z: -38 },
      { x: 8, z: -35 },
      { x: -8, z: -35 }
    ];

    for (var i = 0; i < artifactPositions.length; i++) {
      var apos = artifactPositions[i];

      // Pedestal
      var pedestal = new THREE.Mesh(
        new THREE.BoxGeometry(3, 4, 3),
        MATERIALS.stoneGray
      );
      pedestal.position.set(apos.x, 2, apos.z);
      addObject(pedestal);

      // Glowing artifact
      var artifact = new THREE.Mesh(
        new THREE.SphereGeometry(1.2, 8, 8),
        MATERIALS.glowing
      );
      artifact.position.set(apos.x, 6.5, apos.z);
      addObject(artifact);
    }
  }

  function createWaterfallFeature() {
    // Thin water cascades down pyramid face
    var waterfallGroup = new THREE.Group();
    var waterfallSegments = 8;

    for (var i = 0; i < waterfallSegments; i++) {
      var y = 70 - (i * 8);
      var width = 8 - (i * 0.5);
      var water = new THREE.Mesh(
        new THREE.BoxGeometry(width, 8, 0.5),
        MATERIALS.water
      );
      water.position.set(-8, y, -24);
      waterfallGroup.add(water);
    }

    waterfallGroup.position.set(0, 0, 0);
    addObject(waterfallGroup);
    waterfall = waterfallGroup;
  }

  function createFireflies() {
    var fireflyCount = 32;
    for (var i = 0; i < fireflyCount; i++) {
      var x = (Math.random() - 0.5) * 70;
      var y = 10 + Math.random() * 40;
      var z = (Math.random() - 0.5) * 70;

      var firefly = new THREE.Mesh(
        new THREE.SphereGeometry(0.3, 4, 4),
        new THREE.MeshStandardMaterial({ color: 0xffff00, emissive: 0xffff00, emissiveIntensity: 0.9 })
      );
      firefly.position.set(x, y, z);

      addObject(firefly);

      fireflies.push({
        mesh: firefly,
        baseX: x,
        baseY: y,
        baseZ: z,
        driftX: Math.random() * 0.03,
        driftY: Math.random() * 0.02,
        driftZ: Math.random() * 0.03,
        blinkSpeed: 1 + Math.random() * 2,
        blinkOffset: Math.random() * Math.PI * 2
      });
    }
  }

  function init(sceneRef, cameraRef) {
    scene = sceneRef;
    camera = cameraRef;
    objects = [];
    fireflies = [];
    vines = [];
    animationTime = 0;

    createMaterials();

    createTempleMainPyramid();
    createFallenStoneBlocks();
    createTreeTrunks();
    createVineNetworks();
    createHiddenChamberEntrance();
    createAncientAltar();
    createRootInvasion();
    createTempleGuardians();
    createJungleUndergrowth();
    createArchaeologicalCamp();
    createArtifactDisplay();
    createWaterfallFeature();
    createFireflies();

    // Verify geometry count
    var geometryCount = 0;
    for (var i = 0; i < objects.length; i++) {
      geometryCount += countGeometries(objects[i]);
    }
    console.log('Fallen Temple: ' + geometryCount + ' geometry objects created');
  }

  function countGeometries(obj) {
    var count = 0;
    if (obj.isMesh) {
      count = 1;
    }
    if (obj.children) {
      for (var i = 0; i < obj.children.length; i++) {
        count += countGeometries(obj.children[i]);
      }
    }
    return count;
  }

  function update(delta) {
    animationTime += delta;

    // Animate fireflies - drifting and blinking
    for (var i = 0; i < fireflies.length; i++) {
      var ff = fireflies[i];
      var driftAmount = 0.5;

      ff.mesh.position.x = ff.baseX + Math.sin(animationTime * ff.driftX) * driftAmount;
      ff.mesh.position.y = ff.baseY + Math.cos(animationTime * ff.driftY + ff.blinkOffset) * (driftAmount * 0.7);
      ff.mesh.position.z = ff.baseZ + Math.sin(animationTime * ff.driftZ + 1) * driftAmount;

      // Blinking effect
      var blink = Math.sin(animationTime * ff.blinkSpeed + ff.blinkOffset) * 0.5 + 0.5;
      ff.mesh.material.emissiveIntensity = 0.5 + blink * 0.4;
    }

    // Waterfall animation - slight vertical wave
    if (waterfall) {
      var waterfallChildren = waterfall.children;
      for (var j = 0; j < waterfallChildren.length; j++) {
        var wf = waterfallChildren[j];
        var waveAmount = Math.sin(animationTime * 2 + j * 0.3) * 0.3;
        wf.position.x = -8 + waveAmount;
      }
    }

    // Vine swaying - position oscillation
    for (var k = 0; k < vines.length; k++) {
      var vineData = vines[k];
      var vinePoints = vineData.points;
      var origPoints = vineData.originalPoints;

      for (var p = 0; p < vinePoints.length; p++) {
        var origPoint = origPoints[p];
        var swayAmount = Math.sin(animationTime * 1.5 + p * 0.2) * 1.5;
        vinePoints[p].x = origPoint.x + swayAmount;
        vinePoints[p].y = origPoint.y;
        vinePoints[p].z = origPoint.z + Math.cos(animationTime * 1.3 + p * 0.2) * 1;
      }

      vineData.mesh.geometry.attributes.position.needsUpdate = true;
    }
  }

  function reset() {
    // Clean up all objects added to scene
    for (var i = objects.length - 1; i >= 0; i--) {
      var obj = objects[i];
      scene.remove(obj);

      // Dispose geometries and materials
      if (obj.geometry) {
        obj.geometry.dispose();
      }
      if (obj.material) {
        if (Array.isArray(obj.material)) {
          for (var m = 0; m < obj.material.length; m++) {
            obj.material[m].dispose();
          }
        } else {
          obj.material.dispose();
        }
      }

      // Handle groups
      if (obj.children) {
        for (var c = obj.children.length - 1; c >= 0; c--) {
          var child = obj.children[c];
          if (child.geometry) {
            child.geometry.dispose();
          }
          if (child.material) {
            child.material.dispose();
          }
        }
      }
    }

    // Clean up vines
    for (var v = 0; v < vines.length; v++) {
      scene.remove(vines[v].mesh);
      if (vines[v].mesh.geometry) {
        vines[v].mesh.geometry.dispose();
      }
      if (vines[v].mesh.material) {
        vines[v].mesh.material.dispose();
      }
    }

    objects = [];
    fireflies = [];
    vines = [];
    animationTime = 0;
    waterfall = null;
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
