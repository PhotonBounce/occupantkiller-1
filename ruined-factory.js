window.RuinedFactory = (function() {
  'use strict';

  var meshes = [];
  var fireEmbers = [];
  var scene = null;
  var camera = null;

  var RUST_RED = 0xB73E1D;
  var DARK_RUST = 0x8B4513;
  var CONCRETE_GRAY = 0x888888;
  var DARK_GRAY = 0x444444;
  var CHARCOAL_BLACK = 0x1A1A1A;
  var OXIDIZED_GREEN = 0x4A7C59;
  var EMBER_ORANGE = 0xFF6B35;
  var WATER_COLOR = 0x5A7A8C;
  var DIRT_BROWN = 0x6B5344;

  function addMesh(geometry, material, x, y, z, scale, rotation) {
    var mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    if (scale) {
      if (typeof scale === 'object') {
        mesh.scale.copy(scale);
      } else {
        mesh.scale.set(scale, scale, scale);
      }
    }
    if (rotation) {
      if (rotation.x !== undefined) mesh.rotation.x = rotation.x;
      if (rotation.y !== undefined) mesh.rotation.y = rotation.y;
      if (rotation.z !== undefined) mesh.rotation.z = rotation.z;
    }
    scene.add(mesh);
    meshes.push(mesh);
    return mesh;
  }

  function createCollapsedWalls() {
    var material = new THREE.MeshStandardMaterial({ color: CONCRETE_GRAY, roughness: 0.9, metalness: 0 });
    var darkMaterial = new THREE.MeshStandardMaterial({ color: DARK_GRAY, roughness: 0.95, metalness: 0 });

    addMesh(new THREE.BoxGeometry(15, 12, 2), material, -35, 6, -30, 1, { x: 0.3, y: 0.1, z: 0 });
    addMesh(new THREE.BoxGeometry(12, 10, 2), darkMaterial, -32, 5, -25, 1, { x: 0.25, y: -0.15, z: 0 });
    addMesh(new THREE.BoxGeometry(18, 14, 2), material, 30, 8, -28, 1, { x: -0.2, y: 0.2, z: 0.1 });
    addMesh(new THREE.BoxGeometry(16, 11, 2), darkMaterial, 35, 7, -20, 1, { x: 0.35, y: -0.1, z: 0 });

    addMesh(new THREE.BoxGeometry(20, 9, 2), material, -38, 4, 15, 1, { x: 0.15, y: 0.3, z: 0 });
    addMesh(new THREE.BoxGeometry(14, 13, 2), darkMaterial, 32, 6, 20, 1, { x: -0.25, y: 0.1, z: 0.2 });
    addMesh(new THREE.BoxGeometry(17, 11, 2), material, 25, 5, 32, 1, { x: 0.2, y: -0.2, z: 0 });

    addMesh(new THREE.BoxGeometry(8, 15, 2), darkMaterial, -25, 8, 35, 1, { x: 0.4, y: 0, z: 0.1 });
    addMesh(new THREE.BoxGeometry(10, 12, 2), material, -18, 6, 28, 1, { x: -0.15, y: 0.25, z: 0 });

    var rubbleMaterial = new THREE.MeshStandardMaterial({ color: DARK_GRAY, roughness: 1, metalness: 0 });
    for (var i = 0; i < 12; i++) {
      var rubbleX = -40 + Math.random() * 80;
      var rubbleY = 1 + Math.random() * 3;
      var rubbleZ = -40 + Math.random() * 80;
      var rubbleScale = 0.5 + Math.random() * 1.5;
      var rubbleGeo = new THREE.BoxGeometry(2, 1.5, 2);
      addMesh(rubbleGeo, rubbleMaterial, rubbleX, rubbleY, rubbleZ, rubbleScale, {
        x: Math.random() * 0.5,
        y: Math.random() * Math.PI * 2,
        z: Math.random() * 0.5
      });
    }
  }

  function createRustedMachinery() {
    var machMaterial = new THREE.MeshStandardMaterial({ color: RUST_RED, roughness: 0.8, metalness: 0.3 });
    var rotorMaterial = new THREE.MeshStandardMaterial({ color: DARK_RUST, roughness: 0.7, metalness: 0.5 });

    addMesh(new THREE.BoxGeometry(12, 15, 10), machMaterial, -20, 8, 0, 1, {});
    addMesh(new THREE.CylinderGeometry(3, 3, 8, 16), rotorMaterial, -20, 15, 0, 1, {});
    addMesh(new THREE.CylinderGeometry(2.5, 2.5, 0.5, 16), rotorMaterial, -20, 15.5, -2, 1, {});
    addMesh(new THREE.CylinderGeometry(2.5, 2.5, 0.5, 16), rotorMaterial, -20, 14.5, 2, 1, {});

    addMesh(new THREE.BoxGeometry(10, 12, 8), machMaterial, 15, 7, -8, 1, {});
    addMesh(new THREE.CylinderGeometry(2.8, 2.8, 7, 16), rotorMaterial, 15, 14, -8, 1, {});
    addMesh(new THREE.CylinderGeometry(2.2, 2.2, 0.4, 16), rotorMaterial, 15, 14.5, -10, 1, {});
    addMesh(new THREE.CylinderGeometry(2.2, 2.2, 0.4, 16), rotorMaterial, 15, 13.5, -6, 1, {});

    addMesh(new THREE.BoxGeometry(14, 18, 9), machMaterial, -8, 9, 20, 1, {});
    addMesh(new THREE.CylinderGeometry(3.2, 3.2, 9, 16), rotorMaterial, -8, 18, 20, 1, {});
    addMesh(new THREE.BoxGeometry(2, 8, 2), rotorMaterial, -5, 12, 18, 1, {});
    addMesh(new THREE.BoxGeometry(2, 8, 2), rotorMaterial, -11, 12, 22, 1, {});

    addMesh(new THREE.BoxGeometry(11, 14, 11), machMaterial, 28, 7, 8, 1, { y: 0.2 });
    addMesh(new THREE.CylinderGeometry(2.9, 2.9, 8, 16), rotorMaterial, 28, 14, 8, 1, {});
  }

  function createRoofSections() {
    var roofMaterial = new THREE.MeshStandardMaterial({ color: DARK_GRAY, roughness: 0.85, metalness: 0.2 });
    var beamMaterial = new THREE.MeshStandardMaterial({ color: CHARCOAL_BLACK, roughness: 0.8, metalness: 0.4 });

    addMesh(new THREE.BoxGeometry(25, 1, 20), roofMaterial, -15, 18, 5, 1, { x: 0.15, z: 0.1 });
    addMesh(new THREE.BoxGeometry(22, 1, 18), roofMaterial, 20, 19, -5, 1, { x: -0.12, z: 0.08 });
    addMesh(new THREE.BoxGeometry(20, 1, 16), roofMaterial, 0, 20, 25, 1, { x: 0.2, z: -0.1 });

    addMesh(new THREE.BoxGeometry(2, 12, 2), beamMaterial, -18, 12, 2, 1, {});
    addMesh(new THREE.BoxGeometry(2, 12, 2), beamMaterial, 18, 12, 2, 1, {});
    addMesh(new THREE.BoxGeometry(2, 14, 2), beamMaterial, -22, 13, 10, 1, {});
    addMesh(new THREE.BoxGeometry(2, 13, 2), beamMaterial, 25, 12, -8, 1, {});

    addMesh(new THREE.BoxGeometry(18, 0.8, 14), roofMaterial, 5, 16, -22, 1, { x: 0.3, z: 0.15 });
    addMesh(new THREE.BoxGeometry(16, 0.8, 12), roofMaterial, -28, 17, 18, 1, { x: -0.25, z: -0.12 });

    var fallenBeam = addMesh(new THREE.BoxGeometry(30, 1.5, 1.5), beamMaterial, -10, 8, -35, 1, { x: 0.5, z: 0.3 });
    var fallenBeam2 = addMesh(new THREE.BoxGeometry(28, 1.5, 1.5), beamMaterial, 12, 7, 35, 1, { x: -0.45, z: -0.25 });
  }

  function createAssemblyLine() {
    var frameMaterial = new THREE.MeshStandardMaterial({ color: RUST_RED, roughness: 0.75, metalness: 0.4 });
    var rollerMaterial = new THREE.MeshStandardMaterial({ color: DARK_RUST, roughness: 0.8, metalness: 0.3 });

    var frame1 = addMesh(new THREE.BoxGeometry(40, 4, 6), frameMaterial, 0, 5, -15, 1, { y: 0.1 });
    addMesh(new THREE.CylinderGeometry(1, 1, 35, 12), rollerMaterial, 0, 5.5, -15, 1, { z: Math.PI / 2 });
    addMesh(new THREE.CylinderGeometry(0.8, 0.8, 35, 12), rollerMaterial, 0, 7, -15, 1, { z: Math.PI / 2 });
    addMesh(new THREE.CylinderGeometry(0.8, 0.8, 35, 12), rollerMaterial, 0, 3, -15, 1, { z: Math.PI / 2 });

    addMesh(new THREE.BoxGeometry(2, 5, 2), frameMaterial, -18, 3, -15, 1, {});
    addMesh(new THREE.BoxGeometry(2, 5, 2), frameMaterial, 18, 3, -15, 1, {});

    var frame2 = addMesh(new THREE.BoxGeometry(35, 4, 6), frameMaterial, 5, 6, 10, 1, { y: -0.08, x: 0.1 });
    addMesh(new THREE.CylinderGeometry(1, 1, 30, 12), rollerMaterial, 5, 6.5, 10, 1, { z: Math.PI / 2 });
    addMesh(new THREE.CylinderGeometry(0.8, 0.8, 30, 12), rollerMaterial, 5, 8, 10, 1, { z: Math.PI / 2 });

    addMesh(new THREE.BoxGeometry(2, 5, 2), frameMaterial, -13, 4, 10, 1, {});
    addMesh(new THREE.BoxGeometry(2, 5, 2), frameMaterial, 23, 4, 10, 1, {});
  }

  function createOverheadCranes() {
    var beamMaterial = new THREE.MeshStandardMaterial({ color: CHARCOAL_BLACK, roughness: 0.8, metalness: 0.5 });
    var hookMaterial = new THREE.MeshStandardMaterial({ color: RUST_RED, roughness: 0.7, metalness: 0.6 });

    addMesh(new THREE.BoxGeometry(35, 2, 2), beamMaterial, -8, 22, -10, 1, { x: 0.05 });
    addMesh(new THREE.CylinderGeometry(0.8, 0.8, 8, 12), hookMaterial, -15, 16, -10, 1, {});
    addMesh(new THREE.CylinderGeometry(0.6, 0.8, 2, 12), hookMaterial, -15, 15.5, -10, 1, {});
    addMesh(new THREE.CylinderGeometry(0.8, 0.8, 8, 12), hookMaterial, 5, 16, -10, 1, {});

    addMesh(new THREE.BoxGeometry(2, 15, 2), beamMaterial, -25, 15, -10, 1, {});
    addMesh(new THREE.BoxGeometry(2, 15, 2), beamMaterial, 10, 15, -10, 1, {});

    addMesh(new THREE.BoxGeometry(38, 2, 2), beamMaterial, 15, 21, 12, 1, { x: -0.06, y: 0.1 });
    addMesh(new THREE.CylinderGeometry(0.8, 0.8, 7, 12), hookMaterial, 5, 16.5, 12, 1, {});
    addMesh(new THREE.CylinderGeometry(0.8, 0.8, 7, 12), hookMaterial, 28, 16.5, 12, 1, {});

    addMesh(new THREE.BoxGeometry(2, 14, 2), beamMaterial, -5, 14.5, 12, 1, {});
    addMesh(new THREE.BoxGeometry(2, 14, 2), beamMaterial, 35, 14.5, 12, 1, {});
  }

  function createChemicalStorage() {
    var drumMaterial = new THREE.MeshStandardMaterial({ color: OXIDIZED_GREEN, roughness: 0.7, metalness: 0.4 });
    var spillMaterial = new THREE.MeshStandardMaterial({ color: 0x6B8E23, roughness: 0.6, metalness: 0 });

    addMesh(new THREE.CylinderGeometry(2, 2, 5, 16), drumMaterial, -32, 3, -8, 1, {});
    addMesh(new THREE.CylinderGeometry(1.9, 1.9, 0.3, 16), drumMaterial, -32, 5.5, -8, 1, {});
    addMesh(new THREE.SphereGeometry(0.8, 8, 8), spillMaterial, -32, 0.5, -6, 1, {});
    addMesh(new THREE.SphereGeometry(0.6, 8, 8), spillMaterial, -33.5, 0.3, -8, 1, {});

    addMesh(new THREE.CylinderGeometry(2.2, 2.2, 5.5, 16), drumMaterial, -28, 3, 5, 1, {});
    addMesh(new THREE.CylinderGeometry(2.1, 2.1, 0.3, 16), drumMaterial, -28, 6, 5, 1, {});
    addMesh(new THREE.SphereGeometry(0.7, 8, 8), spillMaterial, -28, 0.5, 3.5, 1, {});
    addMesh(new THREE.SphereGeometry(0.5, 8, 8), spillMaterial, -26.5, 0.2, 5, 1, {});

    addMesh(new THREE.CylinderGeometry(2, 2, 4.8, 16), drumMaterial, 30, 2.5, -5, 1, {});
    addMesh(new THREE.CylinderGeometry(1.9, 1.9, 0.3, 16), drumMaterial, 30, 5, -5, 1, {});
    addMesh(new THREE.SphereGeometry(0.75, 8, 8), spillMaterial, 30, 0.4, -3, 1, {});
    addMesh(new THREE.SphereGeometry(0.6, 8, 8), spillMaterial, 31.5, 0.25, -5.5, 1, {});

    addMesh(new THREE.CylinderGeometry(2.1, 2.1, 5.2, 16), drumMaterial, 33, 3.2, 15, 1, {});
    addMesh(new THREE.CylinderGeometry(2, 2, 0.3, 16), drumMaterial, 33, 5.8, 15, 1, {});
    addMesh(new THREE.SphereGeometry(0.65, 8, 8), spillMaterial, 33, 0.3, 13, 1, {});
  }

  function createBombCrater() {
    var craterMaterial = new THREE.MeshStandardMaterial({ color: DIRT_BROWN, roughness: 0.95, metalness: 0 });
    var craterEdgeMaterial = new THREE.MeshStandardMaterial({ color: 0x4A3728, roughness: 1, metalness: 0 });

    addMesh(new THREE.BoxGeometry(30, 3, 30), craterMaterial, 5, -2, 0, 1, {});
    addMesh(new THREE.BoxGeometry(26, 2, 26), craterEdgeMaterial, 5, 1, 0, 1, {});

    addMesh(new THREE.BoxGeometry(8, 2, 8), craterMaterial, -5, -2.5, -8, 1, { x: 0.15 });
    addMesh(new THREE.BoxGeometry(8, 2, 8), craterMaterial, 15, -2, 8, 1, { x: -0.12 });
    addMesh(new THREE.BoxGeometry(10, 2.5, 10), craterMaterial, 8, -1.8, -5, 1, { y: 0.1 });

    for (var i = 0; i < 15; i++) {
      var craterX = 5 + (Math.random() - 0.5) * 28;
      var craterZ = (Math.random() - 0.5) * 28;
      var craterSize = 1 + Math.random() * 2;
      addMesh(new THREE.BoxGeometry(craterSize, craterSize * 0.6, craterSize), craterEdgeMaterial,
        craterX, -2.5 + Math.random() * 1, craterZ, 1, {
        x: Math.random() * 0.3,
        y: Math.random() * Math.PI * 2,
        z: Math.random() * 0.3
      });
    }
  }

  function createFirePits() {
    var pitMaterial = new THREE.MeshStandardMaterial({ color: CHARCOAL_BLACK, roughness: 1, metalness: 0 });

    var pit1 = { x: -15, y: 1, z: 8 };
    var pit2 = { x: 22, y: 1, z: -12 };
    var pit3 = { x: -8, y: 1, z: 28 };
    var pit4 = { x: 28, y: 1, z: 20 };

    var pits = [pit1, pit2, pit3, pit4];

    for (var i = 0; i < pits.length; i++) {
      var pit = pits[i];
      addMesh(new THREE.BoxGeometry(4, 0.8, 4), pitMaterial, pit.x, pit.y, pit.z, 1, {});

      for (var j = 0; j < 6; j++) {
        var ember = {
          mesh: addMesh(new THREE.SphereGeometry(0.4, 8, 8),
            new THREE.MeshStandardMaterial({ color: EMBER_ORANGE, emissive: EMBER_ORANGE, emissiveIntensity: 0.8 }),
            pit.x + (Math.random() - 0.5) * 3,
            pit.y + Math.random() * 0.5,
            pit.z + (Math.random() - 0.5) * 3,
            1, {}),
          baseX: pit.x + (Math.random() - 0.5) * 3,
          baseY: pit.y + Math.random() * 0.5,
          baseZ: pit.z + (Math.random() - 0.5) * 3,
          vx: (Math.random() - 0.5) * 0.3,
          vy: 0.5 + Math.random() * 0.5,
          vz: (Math.random() - 0.5) * 0.3,
          time: Math.random() * 10,
          intensity: 0.6 + Math.random() * 0.4
        };
        fireEmbers.push(ember);
      }
    }
  }

  function createSmokestacks() {
    var stackMaterial = new THREE.MeshStandardMaterial({ color: CHARCOAL_BLACK, roughness: 0.85, metalness: 0.1 });
    var rubbleMaterial = new THREE.MeshStandardMaterial({ color: RUST_RED, roughness: 0.9, metalness: 0.2 });

    addMesh(new THREE.CylinderGeometry(2.5, 2.5, 28, 16), stackMaterial, -35, 14, 15, 1, {});
    addMesh(new THREE.BoxGeometry(6, 3, 6), rubbleMaterial, -35, 2, 15, 1, { x: 0.15, y: 0.2 });
    addMesh(new THREE.BoxGeometry(4, 2, 4), rubbleMaterial, -36, 1, 16, 1, { x: -0.1, y: -0.1 });

    addMesh(new THREE.CylinderGeometry(2.2, 2.2, 25, 16), stackMaterial, 32, 13, -18, 1, { x: 0.1 });
    addMesh(new THREE.BoxGeometry(5, 2.5, 5), rubbleMaterial, 32, 2, -18, 1, { x: 0.2, y: 0.15 });

    addMesh(new THREE.CylinderGeometry(2.8, 2.8, 30, 16), stackMaterial, 5, 15, 32, 1, {});
    addMesh(new THREE.BoxGeometry(7, 3, 7), rubbleMaterial, 5, 2, 32, 1, { x: -0.12, y: 0.25 });
    addMesh(new THREE.BoxGeometry(5, 2, 5), rubbleMaterial, 3, 1, 33, 1, {});
  }

  function createChainLinkFences() {
    var postMaterial = new THREE.MeshStandardMaterial({ color: RUST_RED, roughness: 0.8, metalness: 0.3 });

    var fenceLine1 = [
      { x: -38, z: -38 },
      { x: -38, z: -20 },
      { x: -38, z: 0 },
      { x: -38, z: 20 },
      { x: -38, z: 38 }
    ];

    for (var i = 0; i < fenceLine1.length; i++) {
      addMesh(new THREE.BoxGeometry(1.2, 6, 1.2), postMaterial, fenceLine1[i].x, 3, fenceLine1[i].z, 1, {});
    }

    for (var i = 0; i < fenceLine1.length - 1; i++) {
      var x1 = fenceLine1[i].x;
      var z1 = fenceLine1[i].z;
      var x2 = fenceLine1[i + 1].x;
      var z2 = fenceLine1[i + 1].z;
      var midX = (x1 + x2) / 2;
      var midZ = (z1 + z2) / 2;
      var dist = Math.sqrt((x2 - x1) * (x2 - x1) + (z2 - z1) * (z2 - z1));
      var angle = Math.atan2(z2 - z1, x2 - x1);

      var geometry = new THREE.BufferGeometry();
      var positions = new Float32Array([
        -dist / 2, 2, 0, dist / 2, 2, 0,
        -dist / 2, 4.5, 0, dist / 2, 4.5, 0
      ]);
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      var lineMaterial = new THREE.LineBasicMaterial({ color: RUST_RED, linewidth: 2 });
      var line = new THREE.LineSegments(geometry, lineMaterial);
      line.position.set(midX, 3, midZ);
      line.rotation.y = angle;
      scene.add(line);
      meshes.push(line);
    }

    var fenceLine2 = [
      { x: -38, z: -38 },
      { x: -20, z: -38 },
      { x: 0, z: -38 },
      { x: 20, z: -38 },
      { x: 38, z: -38 }
    ];

    for (var i = 0; i < fenceLine2.length; i++) {
      addMesh(new THREE.BoxGeometry(1.2, 6, 1.2), postMaterial, fenceLine2[i].x, 3, fenceLine2[i].z, 1, {});
    }
  }

  function createBurnedOutVehicles() {
    var truckMaterial = new THREE.MeshStandardMaterial({ color: CHARCOAL_BLACK, roughness: 0.9, metalness: 0.1 });
    var truckAccentMaterial = new THREE.MeshStandardMaterial({ color: DARK_RUST, roughness: 0.8, metalness: 0.3 });

    addMesh(new THREE.BoxGeometry(8, 4, 3), truckMaterial, -25, 2, -28, 1, { y: 0.3 });
    addMesh(new THREE.BoxGeometry(5, 3, 3), truckAccentMaterial, -22, 3, -28, 1, { y: 0.3 });
    addMesh(new THREE.CylinderGeometry(0.8, 0.8, 7, 12), truckMaterial, -28, 1.5, -28, 1, { z: Math.PI / 2 });
    addMesh(new THREE.CylinderGeometry(0.8, 0.8, 7, 12), truckMaterial, -22, 1.5, -28, 1, { z: Math.PI / 2 });

    addMesh(new THREE.BoxGeometry(6, 3, 2.5), truckMaterial, 18, 2, 22, 1, { y: -0.25 });
    addMesh(new THREE.BoxGeometry(4, 2.5, 2.5), truckAccentMaterial, 20, 2.5, 22, 1, { y: -0.25 });
    addMesh(new THREE.CylinderGeometry(0.75, 0.75, 6, 12), truckMaterial, 15, 1.3, 22, 1, { z: Math.PI / 2 });
    addMesh(new THREE.CylinderGeometry(0.75, 0.75, 6, 12), truckMaterial, 21, 1.3, 22, 1, { z: Math.PI / 2 });

    var forkMaterial = new THREE.MeshStandardMaterial({ color: RUST_RED, roughness: 0.8, metalness: 0.4 });
    addMesh(new THREE.BoxGeometry(5, 5, 2), forkMaterial, -10, 3, 12, 1, { x: 0.2 });
    addMesh(new THREE.BoxGeometry(4, 3, 2), truckAccentMaterial, -8, 5, 12, 1, { x: 0.2 });
    addMesh(new THREE.CylinderGeometry(0.7, 0.7, 4, 12), truckMaterial, -12, 1, 12, 1, { z: Math.PI / 2 });
    addMesh(new THREE.CylinderGeometry(0.7, 0.7, 4, 12), truckMaterial, -8, 1, 12, 1, { z: Math.PI / 2 });
    addMesh(new THREE.BoxGeometry(0.5, 3, 3), forkMaterial, -10, 4, 10, 1, {});
    addMesh(new THREE.BoxGeometry(0.5, 3, 3), forkMaterial, -10, 4, 14, 1, {});
  }

  function createWaterPooling() {
    var waterMaterial = new THREE.MeshStandardMaterial({ color: WATER_COLOR, roughness: 0.3, metalness: 0.1 });

    addMesh(new THREE.BoxGeometry(8, 0.3, 6), waterMaterial, -12, 0.15, 5, 1, {});
    addMesh(new THREE.BoxGeometry(6, 0.3, 8), waterMaterial, 20, 0.15, -18, 1, {});
    addMesh(new THREE.BoxGeometry(10, 0.3, 7), waterMaterial, 8, 0.15, 15, 1, {});
    addMesh(new THREE.BoxGeometry(7, 0.3, 9), waterMaterial, -28, 0.15, 12, 1, {});
  }

  function createAdditionalRubble() {
    var rubbleMaterials = [
      new THREE.MeshStandardMaterial({ color: CONCRETE_GRAY, roughness: 0.9, metalness: 0 }),
      new THREE.MeshStandardMaterial({ color: DARK_GRAY, roughness: 0.95, metalness: 0 }),
      new THREE.MeshStandardMaterial({ color: RUST_RED, roughness: 0.85, metalness: 0.2 })
    ];

    for (var i = 0; i < 25; i++) {
      var x = -38 + Math.random() * 76;
      var y = 1 + Math.random() * 2;
      var z = -38 + Math.random() * 76;
      var w = 1 + Math.random() * 2;
      var h = 0.8 + Math.random() * 1.5;
      var d = 1 + Math.random() * 2;
      var matIdx = Math.floor(Math.random() * rubbleMaterials.length);
      addMesh(new THREE.BoxGeometry(w, h, d), rubbleMaterials[matIdx], x, y, z, 1, {
        x: Math.random() * 0.4 - 0.2,
        y: Math.random() * Math.PI * 2,
        z: Math.random() * 0.4 - 0.2
      });
    }
  }

  function init(sceneParam, cameraParam) {
    scene = sceneParam;
    camera = cameraParam;
    meshes = [];
    fireEmbers = [];

    createCollapsedWalls();
    createRustedMachinery();
    createRoofSections();
    createAssemblyLine();
    createOverheadCranes();
    createChemicalStorage();
    createBombCrater();
    createFirePits();
    createSmokestacks();
    createChainLinkFences();
    createBurnedOutVehicles();
    createWaterPooling();
    createAdditionalRubble();
  }

  function update(delta) {
    for (var i = 0; i < fireEmbers.length; i++) {
      var ember = fireEmbers[i];
      ember.time += delta;

      var cycleTime = 8;
      var cycleProgress = (ember.time % cycleTime) / cycleTime;

      ember.mesh.position.x = ember.baseX + ember.vx * cycleProgress * cycleTime;
      ember.mesh.position.y = ember.baseY + ember.vy * cycleProgress * cycleTime + Math.sin(cycleProgress * Math.PI * 2) * 0.3;
      ember.mesh.position.z = ember.baseZ + ember.vz * cycleProgress * cycleTime;

      var flickerIntensity = 0.5 + 0.5 * Math.sin(ember.time * 3) + Math.sin(ember.time * 7) * 0.3;
      flickerIntensity = Math.max(0.3, Math.min(1, flickerIntensity));
      ember.mesh.material.emissiveIntensity = flickerIntensity * ember.intensity;

      if (cycleProgress > 0.9) {
        ember.mesh.position.x = ember.baseX + (Math.random() - 0.5) * 3;
        ember.mesh.position.y = ember.baseY + Math.random() * 0.5;
        ember.mesh.position.z = ember.baseZ + (Math.random() - 0.5) * 3;
        ember.time = 0;
      }
    }
  }

  function reset() {
    for (var i = 0; i < meshes.length; i++) {
      scene.remove(meshes[i]);
    }
    meshes = [];
    fireEmbers = [];
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
