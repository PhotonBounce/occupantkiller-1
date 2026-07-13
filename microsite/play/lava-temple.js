window.LavaTemple = (function() {
  'use strict';

  var sceneRef = null;
  var cameraRef = null;
  var objects = [];
  var animationData = {};

  // Color definitions
  var COLORS = {
    darkStone: 0x2a2a2a,
    mediumStone: 0x3a3a3a,
    lightStone: 0x4a4a4a,
    ancientRed: 0x8b4513,
    lavaOrange: 0xff6600,
    lavaRed: 0xff3300,
    gold: 0xffd700,
    darkGold: 0xdaa520,
    glowOrange: 0xffaa00
  };

  function createObject(geometry, material, position, scale, rotation) {
    var mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(position.x, position.y, position.z);
    if (scale) mesh.scale.set(scale.x, scale.y, scale.z);
    if (rotation) mesh.rotation.set(rotation.x, rotation.y, rotation.z);
    sceneRef.add(mesh);
    objects.push(mesh);
    return mesh;
  }

  function createTemplatePyramid() {
    // Stepped pyramid temple structure
    var baseMaterial = new THREE.MeshPhongMaterial({ color: COLORS.darkStone });

    // Base layer
    createObject(
      new THREE.BoxGeometry(40, 2, 40),
      baseMaterial,
      { x: 0, y: 0, z: 0 },
      { x: 1, y: 1, z: 1 }
    );

    // Second tier
    createObject(
      new THREE.BoxGeometry(32, 2, 32),
      baseMaterial,
      { x: 0, y: 2, z: 0 },
      { x: 1, y: 1, z: 1 }
    );

    // Third tier
    createObject(
      new THREE.BoxGeometry(24, 2, 24),
      baseMaterial,
      { x: 0, y: 4, z: 0 },
      { x: 1, y: 1, z: 1 }
    );

    // Fourth tier
    createObject(
      new THREE.BoxGeometry(16, 2, 16),
      baseMaterial,
      { x: 0, y: 6, z: 0 },
      { x: 1, y: 1, z: 1 }
    );

    // Top tier
    createObject(
      new THREE.BoxGeometry(8, 2, 8),
      baseMaterial,
      { x: 0, y: 8, z: 0 },
      { x: 1, y: 1, z: 1 }
    );

    // Pyramid cap
    createObject(
      new THREE.BoxGeometry(6, 4, 6),
      new THREE.MeshPhongMaterial({ color: COLORS.mediumStone }),
      { x: 0, y: 11, z: 0 },
      { x: 1, y: 1, z: 1 }
    );
  }

  function createTempleEntrance() {
    var columnMaterial = new THREE.MeshPhongMaterial({ color: COLORS.lightStone });
    var doorMaterial = new THREE.MeshPhongMaterial({ color: COLORS.darkStone });

    // Left column
    createObject(
      new THREE.CylinderGeometry(2, 2.5, 12, 16),
      columnMaterial,
      { x: -8, y: 6, z: 10 },
      { x: 1, y: 1, z: 1 }
    );

    // Right column
    createObject(
      new THREE.CylinderGeometry(2, 2.5, 12, 16),
      columnMaterial,
      { x: 8, y: 6, z: 10 },
      { x: 1, y: 1, z: 1 }
    );

    // Doorway frame - top
    createObject(
      new THREE.BoxGeometry(16, 2, 1),
      doorMaterial,
      { x: 0, y: 12.5, z: 10 },
      { x: 1, y: 1, z: 1 }
    );

    // Doorway frame - left side
    createObject(
      new THREE.BoxGeometry(1, 10, 1),
      doorMaterial,
      { x: -7.5, y: 5, z: 10 },
      { x: 1, y: 1, z: 1 }
    );

    // Doorway frame - right side
    createObject(
      new THREE.BoxGeometry(1, 10, 1),
      doorMaterial,
      { x: 7.5, y: 5, z: 10 },
      { x: 1, y: 1, z: 1 }
    );

    // Doorway opening (dark chamber entrance)
    createObject(
      new THREE.BoxGeometry(14, 8, 0.5),
      new THREE.MeshPhongMaterial({ color: 0x0a0a0a }),
      { x: 0, y: 5, z: 10.25 },
      { x: 1, y: 1, z: 1 }
    );
  }

  function createAltarChamber() {
    var chamberMaterial = new THREE.MeshPhongMaterial({ color: COLORS.darkStone });
    var glowMaterial = new THREE.MeshPhongMaterial({
      color: COLORS.lavaOrange,
      emissive: COLORS.glowOrange,
      emissiveIntensity: 0.6
    });

    // Chamber walls
    createObject(
      new THREE.BoxGeometry(16, 8, 16),
      chamberMaterial,
      { x: 0, y: 4, z: 10 },
      { x: 1, y: 1, z: 1 }
    );

    // Central altar base
    var altarBase = createObject(
      new THREE.BoxGeometry(8, 1, 8),
      new THREE.MeshPhongMaterial({ color: COLORS.ancientRed }),
      { x: 0, y: 5, z: 10 },
      { x: 1, y: 1, z: 1 }
    );

    // Altar structure - top tier
    var altarTop = createObject(
      new THREE.BoxGeometry(6, 1.5, 6),
      glowMaterial,
      { x: 0, y: 6.5, z: 10 },
      { x: 1, y: 1, z: 1 }
    );

    animationData.altar = {
      mesh: altarTop,
      baseIntensity: 0.6,
      minIntensity: 0.4,
      maxIntensity: 0.9,
      speed: 2
    };

    // Altar center focus
    var altarGlow = createObject(
      new THREE.BoxGeometry(2, 2, 2),
      glowMaterial,
      { x: 0, y: 7.5, z: 10 },
      { x: 1, y: 1, z: 1 }
    );
    altarGlow.userData.isAltarGlow = true;
  }

  function createLavaChannels() {
    var lavaChannelMaterial = new THREE.MeshPhongMaterial({
      color: COLORS.lavaRed,
      emissive: COLORS.lavaOrange,
      emissiveIntensity: 0.5
    });

    var channelWidth = 3;
    var channelDepth = 2;

    // North channel
    var northChannel = createObject(
      new THREE.BoxGeometry(50, channelDepth, channelWidth),
      lavaChannelMaterial,
      { x: 0, y: 1, z: -25 },
      { x: 1, y: 1, z: 1 }
    );
    northChannel.userData.isLavaChannel = true;

    // South channel
    var southChannel = createObject(
      new THREE.BoxGeometry(50, channelDepth, channelWidth),
      lavaChannelMaterial,
      { x: 0, y: 1, z: 25 },
      { x: 1, y: 1, z: 1 }
    );
    southChannel.userData.isLavaChannel = true;

    // East channel
    var eastChannel = createObject(
      new THREE.BoxGeometry(channelWidth, channelDepth, 50),
      lavaChannelMaterial,
      { x: 25, y: 1, z: 0 },
      { x: 1, y: 1, z: 1 }
    );
    eastChannel.userData.isLavaChannel = true;

    // West channel
    var westChannel = createObject(
      new THREE.BoxGeometry(channelWidth, channelDepth, 50),
      lavaChannelMaterial,
      { x: -25, y: 1, z: 0 },
      { x: 1, y: 1, z: 1 }
    );
    westChannel.userData.isLavaChannel = true;

    // Store for animation
    animationData.lavaChannels = {
      channels: [northChannel, southChannel, eastChannel, westChannel],
      minColor: 0xff3300,
      maxColor: 0xff6600,
      speed: 1.5
    };
  }

  function createStoneStatues() {
    var stoneMaterial = new THREE.MeshPhongMaterial({ color: COLORS.lightStone });

    // Statue 1 - Left of entrance
    createObject(
      new THREE.BoxGeometry(3, 8, 2),
      stoneMaterial,
      { x: -12, y: 4, z: 10 },
      { x: 1, y: 1, z: 1 }
    );
    createObject(
      new THREE.BoxGeometry(1.5, 3, 1.5),
      stoneMaterial,
      { x: -12, y: 9, z: 10 },
      { x: 1, y: 1, z: 1 }
    );

    // Statue 2 - Right of entrance
    createObject(
      new THREE.BoxGeometry(3, 8, 2),
      stoneMaterial,
      { x: 12, y: 4, z: 10 },
      { x: 1, y: 1, z: 1 }
    );
    createObject(
      new THREE.BoxGeometry(1.5, 3, 1.5),
      stoneMaterial,
      { x: 12, y: 9, z: 10 },
      { x: 1, y: 1, z: 1 }
    );

    // Statue 3 - North path
    createObject(
      new THREE.BoxGeometry(2.5, 7, 2),
      stoneMaterial,
      { x: -6, y: 3.5, z: -15 },
      { x: 1, y: 1, z: 1 }
    );
    createObject(
      new THREE.BoxGeometry(1.2, 2.5, 1.2),
      stoneMaterial,
      { x: -6, y: 8, z: -15 },
      { x: 1, y: 1, z: 1 }
    );

    // Statue 4 - South path
    createObject(
      new THREE.BoxGeometry(2.5, 7, 2),
      stoneMaterial,
      { x: 6, y: 3.5, z: 15 },
      { x: 1, y: 1, z: 1 }
    );
    createObject(
      new THREE.BoxGeometry(1.2, 2.5, 1.2),
      stoneMaterial,
      { x: 6, y: 8, z: 15 },
      { x: 1, y: 1, z: 1 }
    );
  }

  function createSacrificialPit() {
    var pitMaterial = new THREE.MeshPhongMaterial({ color: COLORS.darkStone });
    var lavaMaterial = new THREE.MeshPhongMaterial({
      color: COLORS.lavaRed,
      emissive: COLORS.lavaOrange,
      emissiveIntensity: 0.7
    });

    // Pit walls
    createObject(
      new THREE.BoxGeometry(12, 16, 12),
      pitMaterial,
      { x: 0, y: -8, z: -20 },
      { x: 1, y: 1, z: 1 }
    );

    // Pit rim
    createObject(
      new THREE.BoxGeometry(14, 1, 14),
      new THREE.MeshPhongMaterial({ color: COLORS.mediumStone }),
      { x: 0, y: 1, z: -20 },
      { x: 1, y: 1, z: 1 }
    );

    // Lava bottom glow
    createObject(
      new THREE.SphereGeometry(5, 16, 16),
      lavaMaterial,
      { x: 0, y: -15, z: -20 },
      { x: 1, y: 1, z: 1 }
    );

    // Lava bubble effects
    for (var i = 0; i < 4; i++) {
      var offsetX = (Math.random() - 0.5) * 6;
      var offsetZ = (Math.random() - 0.5) * 6;
      createObject(
        new THREE.SphereGeometry(1.5, 8, 8),
        lavaMaterial,
        { x: offsetX, y: -12, z: -20 + offsetZ },
        { x: 1, y: 1, z: 1 }
      );
    }
  }

  function createBridgeOfTrials() {
    var bridgeMaterial = new THREE.MeshPhongMaterial({ color: COLORS.mediumStone });

    // Main bridge deck
    createObject(
      new THREE.BoxGeometry(8, 1, 30),
      bridgeMaterial,
      { x: 0, y: 2, z: -10 },
      { x: 1, y: 1, z: 1 }
    );

    // Support pillars
    createObject(
      new THREE.CylinderGeometry(1, 1.5, 4, 12),
      new THREE.MeshPhongMaterial({ color: COLORS.lightStone }),
      { x: -3, y: 0, z: -10 },
      { x: 1, y: 1, z: 1 }
    );

    createObject(
      new THREE.CylinderGeometry(1, 1.5, 4, 12),
      new THREE.MeshPhongMaterial({ color: COLORS.lightStone }),
      { x: 3, y: 0, z: -10 },
      { x: 1, y: 1, z: 1 }
    );

    // Railing segments
    for (var i = -12; i < 12; i += 4) {
      createObject(
        new THREE.BoxGeometry(0.5, 1.5, 1),
        new THREE.MeshPhongMaterial({ color: COLORS.mediumStone }),
        { x: -4.5, y: 3, z: i },
        { x: 1, y: 1, z: 1 }
      );
      createObject(
        new THREE.BoxGeometry(0.5, 1.5, 1),
        new THREE.MeshPhongMaterial({ color: COLORS.mediumStone }),
        { x: 4.5, y: 3, z: i },
        { x: 1, y: 1, z: 1 }
      );
    }
  }

  function createAncientPillars() {
    var pillarMaterial = new THREE.MeshPhongMaterial({ color: COLORS.lightStone });

    // Two rows of pillars leading to entrance
    var positions = [
      { x: -8, z: -35 }, { x: -8, z: -28 }, { x: -8, z: -21 },
      { x: 8, z: -35 }, { x: 8, z: -28 }, { x: 8, z: -21 }
    ];

    for (var i = 0; i < positions.length; i++) {
      var pos = positions[i];
      createObject(
        new THREE.CylinderGeometry(1.5, 2, 10, 12),
        pillarMaterial,
        { x: pos.x, y: 5, z: pos.z },
        { x: 1, y: 1, z: 1 }
      );

      // Capital
      createObject(
        new THREE.BoxGeometry(3.5, 0.5, 3.5),
        new THREE.MeshPhongMaterial({ color: COLORS.darkGold }),
        { x: pos.x, y: 10.5, z: pos.z },
        { x: 1, y: 1, z: 1 }
      );

      // Base
      createObject(
        new THREE.BoxGeometry(3.5, 0.5, 3.5),
        new THREE.MeshPhongMaterial({ color: COLORS.darkGold }),
        { x: pos.x, y: -0.5, z: pos.z },
        { x: 1, y: 1, z: 1 }
      );
    }
  }

  function createReliefCarvings() {
    var reliefMaterial = new THREE.MeshPhongMaterial({ color: COLORS.mediumStone });

    // North wall carvings
    for (var i = -8; i < 9; i += 4) {
      for (var j = 1; j < 12; j += 3) {
        createObject(
          new THREE.BoxGeometry(0.8, 0.8, 0.3),
          reliefMaterial,
          { x: i, y: j, z: -20 },
          { x: 1, y: 1, z: 1 }
        );
      }
    }

    // South wall carvings
    for (var i = -8; i < 9; i += 4) {
      for (var j = 1; j < 12; j += 3) {
        createObject(
          new THREE.BoxGeometry(0.8, 0.8, 0.3),
          reliefMaterial,
          { x: i, y: j, z: 20 },
          { x: 1, y: 1, z: 1 }
        );
      }
    }

    // East wall carvings
    for (var i = -8; i < 9; i += 4) {
      for (var j = 1; j < 12; j += 3) {
        createObject(
          new THREE.BoxGeometry(0.3, 0.8, 0.8),
          reliefMaterial,
          { x: 20, y: j, z: i },
          { x: 1, y: 1, z: 1 }
        );
      }
    }

    // West wall carvings
    for (var i = -8; i < 9; i += 4) {
      for (var j = 1; j < 12; j += 3) {
        createObject(
          new THREE.BoxGeometry(0.3, 0.8, 0.8),
          reliefMaterial,
          { x: -20, y: j, z: i },
          { x: 1, y: 1, z: 1 }
        );
      }
    }
  }

  function createTreasureChambr() {
    var chamberMaterial = new THREE.MeshPhongMaterial({ color: COLORS.darkStone });
    var treasureMaterial = new THREE.MeshPhongMaterial({
      color: COLORS.gold,
      emissive: COLORS.darkGold,
      emissiveIntensity: 0.3
    });

    // Treasure chamber room
    createObject(
      new THREE.BoxGeometry(12, 6, 12),
      chamberMaterial,
      { x: 20, y: 3, z: 10 },
      { x: 1, y: 1, z: 1 }
    );

    // Treasure containers
    var treasurePositions = [
      { x: 16, z: 6 },
      { x: 16, z: 14 },
      { x: 24, z: 6 },
      { x: 24, z: 14 }
    ];

    for (var i = 0; i < treasurePositions.length; i++) {
      var pos = treasurePositions[i];
      createObject(
        new THREE.BoxGeometry(3, 3, 3),
        treasureMaterial,
        { x: pos.x, y: 3, z: pos.z },
        { x: 1, y: 1, z: 1 }
      );
    }

    // Pedestal
    createObject(
      new THREE.BoxGeometry(4, 2, 4),
      treasureMaterial,
      { x: 20, y: 2, z: 10 },
      { x: 1, y: 1, z: 1 }
    );
  }

  function createCrumblingStones() {
    var crumbleMaterial = new THREE.MeshPhongMaterial({ color: COLORS.mediumStone });

    // North-east crumble
    for (var i = 0; i < 8; i++) {
      var rotation = {
        x: (Math.random() - 0.5) * 0.6,
        y: Math.random() * Math.PI,
        z: (Math.random() - 0.5) * 0.6
      };
      createObject(
        new THREE.BoxGeometry(3, 2, 3),
        crumbleMaterial,
        {
          x: 25 + Math.random() * 6,
          y: 2 + i * 0.8,
          z: -25 + Math.random() * 6
        },
        { x: 1, y: 1, z: 1 },
        rotation
      );
    }

    // South-west crumble
    for (var i = 0; i < 6; i++) {
      var rotation = {
        x: (Math.random() - 0.5) * 0.6,
        y: Math.random() * Math.PI,
        z: (Math.random() - 0.5) * 0.6
      };
      createObject(
        new THREE.BoxGeometry(3, 2, 3),
        crumbleMaterial,
        {
          x: -25 - Math.random() * 6,
          y: 2 + i * 0.8,
          z: 25 - Math.random() * 6
        },
        { x: 1, y: 1, z: 1 },
        rotation
      );
    }
  }

  function createLavaGeysers() {
    var geyserBaseMaterial = new THREE.MeshPhongMaterial({ color: COLORS.darkStone });
    var geyserLavaMaterial = new THREE.MeshPhongMaterial({
      color: COLORS.lavaOrange,
      emissive: COLORS.glowOrange,
      emissiveIntensity: 0.8
    });

    var geyserPositions = [
      { x: -30, z: -30 },
      { x: 30, z: -30 },
      { x: -30, z: 30 },
      { x: 30, z: 30 },
      { x: -35, z: 0 },
      { x: 35, z: 0 },
      { x: 0, z: -35 },
      { x: 0, z: 35 }
    ];

    for (var i = 0; i < geyserPositions.length; i++) {
      var pos = geyserPositions[i];

      // Geyser base
      createObject(
        new THREE.CylinderGeometry(2, 2.5, 1, 12),
        geyserBaseMaterial,
        { x: pos.x, y: 0.5, z: pos.z },
        { x: 1, y: 1, z: 1 }
      );

      // Geyser column (animated)
      var geyserColumn = createObject(
        new THREE.CylinderGeometry(1.2, 1.2, 4, 12),
        geyserLavaMaterial,
        { x: pos.x, y: 2, z: pos.z },
        { x: 1, y: 1, z: 1 }
      );
      geyserColumn.userData.isGeyser = true;
      geyserColumn.userData.baseY = 2;
      geyserColumn.userData.phase = Math.random() * Math.PI * 2;
    }

    // Initialize geyser animation data
    animationData.geysers = {
      speed: 2.5,
      amplitude: 3,
      baseHeight: 4
    };
  }

  function addLavaPlatformPerimeter() {
    var platformMaterial = new THREE.MeshPhongMaterial({ color: COLORS.ancientRed });

    // Create a perimeter wall/cliff edge
    var positions = [
      { x: 0, z: -40, w: 80, d: 1 },
      { x: 0, z: 40, w: 80, d: 1 },
      { x: -40, z: 0, w: 1, d: 80 },
      { x: 40, z: 0, w: 1, d: 80 }
    ];

    for (var i = 0; i < positions.length; i++) {
      var pos = positions[i];
      createObject(
        new THREE.BoxGeometry(pos.w, 1, pos.d),
        platformMaterial,
        { x: pos.x, y: -0.5, z: pos.z },
        { x: 1, y: 1, z: 1 }
      );
    }
  }

  function init(scene, camera) {
    sceneRef = scene;
    cameraRef = camera;
    objects = [];
    animationData = {};

    createLavaPlatformPerimeter();
    createTemplatePyramid();
    createTempleEntrance();
    createAltarChamber();
    createLavaChannels();
    createStoneStatues();
    createSacrificialPit();
    createBridgeOfTrials();
    createAncientPillars();
    createReliefCarvings();
    createTreasureChambr();
    createCrumblingStones();
    createLavaGeysers();
  }

  function update(delta) {
    // Animate altar glow pulsing
    if (animationData.altar) {
      var altar = animationData.altar;
      var time = Date.now() * 0.001;
      var pulse = Math.sin(time * altar.speed) * 0.5 + 0.5;
      var intensity = altar.minIntensity + (altar.maxIntensity - altar.minIntensity) * pulse;
      altar.mesh.material.emissiveIntensity = intensity;
    }

    // Animate lava channel color cycling
    if (animationData.lavaChannels) {
      var lavaData = animationData.lavaChannels;
      var time = Date.now() * 0.001;
      var cycle = Math.sin(time * lavaData.speed) * 0.5 + 0.5;

      for (var i = 0; i < lavaData.channels.length; i++) {
        var channel = lavaData.channels[i];
        var r1 = (lavaData.minColor >> 16) & 255;
        var g1 = (lavaData.minColor >> 8) & 255;
        var b1 = lavaData.minColor & 255;

        var r2 = (lavaData.maxColor >> 16) & 255;
        var g2 = (lavaData.maxColor >> 8) & 255;
        var b2 = lavaData.maxColor & 255;

        var r = Math.round(r1 + (r2 - r1) * cycle);
        var g = Math.round(g1 + (g2 - g1) * cycle);
        var b = Math.round(b1 + (b2 - b1) * cycle);

        var color = (r << 16) | (g << 8) | b;
        channel.material.color.setHex(color);
      }
    }

    // Animate geyser height oscillation
    for (var i = 0; i < objects.length; i++) {
      var obj = objects[i];
      if (obj.userData.isGeyser) {
        var time = Date.now() * 0.001;
        var geyserData = animationData.geysers;
        var oscillation = Math.sin(time * geyserData.speed + obj.userData.phase) * geyserData.amplitude;
        obj.scale.y = 1 + (oscillation / geyserData.baseHeight);
      }
    }
  }

  function reset() {
    for (var i = 0; i < objects.length; i++) {
      sceneRef.remove(objects[i]);
    }
    objects = [];
    animationData = {};
    sceneRef = null;
    cameraRef = null;
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
