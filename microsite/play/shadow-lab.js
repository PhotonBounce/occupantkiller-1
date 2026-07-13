window.ShadowLab = (function() {
  'use strict';

  var sceneRef = null;
  var cameraRef = null;
  var labObjects = [];
  var animationState = {
    tankBubble: 0,
    laserSweep: 0,
    incineratorGlow: 0
  };

  var colors = {
    labWhite: 0xf0f0f0,
    shadowBlack: 0x1a1a1a,
    darkGray: 0x2a2a2a,
    hazmatYellow: 0xffdd00,
    hazmatBlack: 0x1a1a1a,
    ominousGreen: 0x00ff00,
    darkRed: 0x8b0000,
    orange: 0xff6600,
    steel: 0x707070,
    bloodRed: 0xff0000,
    darkPurple: 0x220033
  };

  function createBox(width, height, depth, color, x, y, z) {
    var geometry = new THREE.BoxGeometry(width, height, depth);
    var material = new THREE.MeshStandardMaterial({
      color: color,
      metalness: 0.3,
      roughness: 0.7
    });
    var mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    sceneRef.add(mesh);
    labObjects.push(mesh);
    return mesh;
  }

  function createCylinder(radiusTop, radiusBottom, height, color, x, y, z, segments) {
    var segs = segments || 32;
    var geometry = new THREE.CylinderGeometry(radiusTop, radiusBottom, height, segs);
    var material = new THREE.MeshStandardMaterial({
      color: color,
      metalness: 0.4,
      roughness: 0.6
    });
    var mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    sceneRef.add(mesh);
    labObjects.push(mesh);
    return mesh;
  }

  function createSphere(radius, color, x, y, z) {
    var geometry = new THREE.SphereGeometry(radius, 32, 32);
    var material = new THREE.MeshStandardMaterial({
      color: color,
      metalness: 0.5,
      roughness: 0.5,
      emissive: color,
      emissiveIntensity: 0.2
    });
    var mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    sceneRef.add(mesh);
    labObjects.push(mesh);
    return mesh;
  }

  function createCone(radius, height, color, x, y, z) {
    var geometry = new THREE.ConeGeometry(radius, height, 32);
    var material = new THREE.MeshStandardMaterial({
      color: color,
      metalness: 0.3,
      roughness: 0.7
    });
    var mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    sceneRef.add(mesh);
    labObjects.push(mesh);
    return mesh;
  }

  function createLineSegments(points, color) {
    var geometry = new THREE.BufferGeometry();
    var positions = new Float32Array(points.length * 3);
    for (var i = 0; i < points.length; i++) {
      positions[i * 3] = points[i].x;
      positions[i * 3 + 1] = points[i].y;
      positions[i * 3 + 2] = points[i].z;
    }
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    var material = new THREE.LineBasicMaterial({
      color: color,
      linewidth: 2,
      emissive: color,
      emissiveIntensity: 0.8
    });
    var line = new THREE.LineSegments(geometry, material);
    sceneRef.add(line);
    labObjects.push(line);
    return line;
  }

  function buildLabStructure() {
    // Main lab facility exterior walls - BoxGeometry
    createBox(60, 20, 60, colors.shadowBlack, 0, 0, 0); // Floor
    createBox(60, 2, 60, colors.darkGray, 0, 10, 0); // Ceiling
    createBox(2, 20, 60, colors.darkGray, -30, 0, 0); // West wall
    createBox(2, 20, 60, colors.darkGray, 30, 0, 0); // East wall
    createBox(60, 20, 2, colors.darkGray, 0, 0, -30); // North wall
    createBox(60, 20, 2, colors.darkGray, 0, 0, 30); // South wall

    // Interior support pillars - BoxGeometry
    createBox(2, 18, 2, colors.steel, -15, 1, -15);
    createBox(2, 18, 2, colors.steel, 15, 1, -15);
    createBox(2, 18, 2, colors.steel, -15, 1, 15);
    createBox(2, 18, 2, colors.steel, 15, 1, 15);
    createBox(2, 18, 2, colors.steel, 0, 1, 0);

    // Experiment chambers - sealed rooms with BoxGeometry
    createBox(20, 10, 20, colors.labWhite, -20, 3, -20); // Chamber 1
    createBox(20, 10, 20, colors.labWhite, 20, 3, -20); // Chamber 2
    createBox(20, 10, 20, colors.labWhite, -20, 3, 20); // Chamber 3
    createBox(20, 10, 20, colors.labWhite, 20, 3, 20); // Chamber 4

    // Chamber doors - BoxGeometry dark frames
    createBox(2, 8, 8, colors.darkGray, -30, 3, -20);
    createBox(2, 8, 8, colors.darkGray, 30, 3, -20);
    createBox(2, 8, 8, colors.darkGray, -30, 3, 20);
    createBox(2, 8, 8, colors.darkGray, 30, 3, 20);
  }

  function buildExperimentChambers() {
    // Black goo containment tanks - CylinderGeometry tanks filled with SphereGeometry
    var tankPositions = [
      { x: -15, y: 5, z: -15 },
      { x: -5, y: 5, z: -15 },
      { x: 5, y: 5, z: -15 },
      { x: 15, y: 5, z: -15 },
      { x: -15, y: 5, z: 15 },
      { x: -5, y: 5, z: 15 },
      { x: 5, y: 5, z: 15 },
      { x: 15, y: 5, z: 15 }
    ];

    for (var i = 0; i < tankPositions.length; i++) {
      var pos = tankPositions[i];
      createCylinder(2, 2, 6, colors.darkGray, pos.x, pos.y, pos.z, 16); // Tank exterior
      createSphere(1.5, colors.shadowBlack, pos.x, pos.y + 2, pos.z); // Black goo blob
      createSphere(0.8, colors.ominousGreen, pos.x, pos.y + 1, pos.z); // Radioactive core
    }
  }

  function buildNeuralRigs() {
    // Neural enhancement chairs - BoxGeometry reclined chairs with CylinderGeometry helmets
    var rigPositions = [
      { x: -20, y: 3, z: 0 },
      { x: 0, y: 3, z: 0 },
      { x: 20, y: 3, z: 0 }
    ];

    for (var i = 0; i < rigPositions.length; i++) {
      var pos = rigPositions[i];
      // Chair frame
      createBox(3, 6, 5, colors.darkRed, pos.x, pos.y, pos.z);
      // Helmet
      createCylinder(1.5, 1.5, 3, colors.steel, pos.x, pos.y + 5, pos.z, 16);
      // Neural contact points - Spheres
      createSphere(0.4, colors.bloodRed, pos.x - 1, pos.y + 6, pos.z);
      createSphere(0.4, colors.bloodRed, pos.x + 1, pos.y + 6, pos.z);
      createSphere(0.4, colors.bloodRed, pos.x, pos.y + 6.5, pos.z);
    }
  }

  function buildWeaponsFloor() {
    // Workbenches - BoxGeometry
    createBox(12, 2, 6, colors.labWhite, -15, 2, -8);
    createBox(12, 2, 6, colors.labWhite, 15, 2, -8);
    createBox(12, 2, 6, colors.labWhite, -15, 2, 8);
    createBox(12, 2, 6, colors.labWhite, 15, 2, 8);

    // Weapon prototype parts - CylinderGeometry
    for (var i = 0; i < 16; i++) {
      var angle = (i / 16) * Math.PI * 2;
      var x = -15 + Math.cos(angle) * 6;
      var z = -8 + Math.sin(angle) * 4;
      createCylinder(0.3, 0.3, 2, colors.steel, x, 3, z, 8);
    }

    for (var i = 0; i < 16; i++) {
      var angle = (i / 16) * Math.PI * 2;
      var x = 15 + Math.cos(angle) * 6;
      var z = -8 + Math.sin(angle) * 4;
      createCylinder(0.3, 0.3, 2, colors.steel, x, 3, z, 8);
    }

    for (var i = 0; i < 16; i++) {
      var angle = (i / 16) * Math.PI * 2;
      var x = -15 + Math.cos(angle) * 6;
      var z = 8 + Math.sin(angle) * 4;
      createCylinder(0.3, 0.3, 2, colors.steel, x, 3, z, 8);
    }

    for (var i = 0; i < 16; i++) {
      var angle = (i / 16) * Math.PI * 2;
      var x = 15 + Math.cos(angle) * 6;
      var z = 8 + Math.sin(angle) * 4;
      createCylinder(0.3, 0.3, 2, colors.steel, x, 3, z, 8);
    }
  }

  function buildBiohazardStorage() {
    // Yellow/black warning room - BoxGeometry
    createBox(18, 12, 18, colors.hazmatYellow, 0, 4, -20);
    createBox(18, 2, 18, colors.hazmatBlack, 0, 10, -20); // Hazard stripe ceiling

    // Biohazard drums - CylinderGeometry
    var drumPositions = [
      { x: -6, y: 3, z: -18 },
      { x: -2, y: 3, z: -18 },
      { x: 2, y: 3, z: -18 },
      { x: 6, y: 3, z: -18 },
      { x: -6, y: 3, z: -22 },
      { x: -2, y: 3, z: -22 },
      { x: 2, y: 3, z: -22 },
      { x: 6, y: 3, z: -22 },
      { x: -6, y: 3, z: -26 },
      { x: -2, y: 3, z: -26 },
      { x: 2, y: 3, z: -26 },
      { x: 6, y: 3, z: -26 }
    ];

    for (var i = 0; i < drumPositions.length; i++) {
      var pos = drumPositions[i];
      createCylinder(1, 1, 3, colors.hazmatYellow, pos.x, pos.y, pos.z, 16);
      createBox(0.4, 0.4, 0.4, colors.hazmatBlack, pos.x - 0.6, pos.y + 1.5, pos.z);
      createBox(0.4, 0.4, 0.4, colors.hazmatBlack, pos.x + 0.6, pos.y + 1.5, pos.z);
    }
  }

  function buildServerRoom() {
    // Server room - BoxGeometry towers
    createBox(16, 12, 10, colors.darkGray, -18, 4, 0);
    createBox(3, 10, 3, colors.shadowBlack, -22, 4, -3);
    createBox(3, 10, 3, colors.shadowBlack, -22, 4, 0);
    createBox(3, 10, 3, colors.shadowBlack, -22, 4, 3);
    createBox(3, 10, 3, colors.shadowBlack, -14, 4, -3);
    createBox(3, 10, 3, colors.shadowBlack, -14, 4, 0);
    createBox(3, 10, 3, colors.shadowBlack, -14, 4, 3);

    // Red status lights - SphereGeometry
    for (var i = 0; i < 21; i++) {
      var x = -22 + Math.floor(i / 7) * 4;
      var y = 5 + (i % 7) * 1.2;
      var z = -3 + ((i / 7) % 3) * 3;
      createSphere(0.3, colors.bloodRed, x, y, z);
    }
  }

  function buildIncineratorRoom() {
    // Incinerator furnace - BoxGeometry
    createBox(12, 10, 8, colors.darkGray, 18, 4, 0);
    createBox(6, 6, 6, colors.shadowBlack, 18, 5, 0); // Furnace chamber

    // Glowing barrel - CylinderGeometry
    createCylinder(2, 2, 8, colors.darkGray, 18, 3, 0, 16);
    var barrel = createCylinder(1.8, 1.8, 7.5, colors.orange, 18, 3.5, 0, 16);
    barrel.userData.isIncinerator = true;

    // Glow spheres inside
    createSphere(0.5, colors.orange, 18, 3, -1);
    createSphere(0.5, colors.orange, 18, 4, 1);
    createSphere(0.5, colors.orange, 18, 5, 0);
  }

  function buildStaffQuarters() {
    // Abandoned bunk rooms - BoxGeometry
    createBox(16, 8, 14, colors.labWhite, 0, 3, 16);
    createBox(4, 3, 6, colors.darkGray, -4, 2, 12); // Overturned bunk 1
    createBox(4, 3, 6, colors.darkGray, 4, 2, 12); // Overturned bunk 2
    createBox(4, 3, 6, colors.darkGray, -4, 2, 20); // Overturned bunk 3
    createBox(4, 3, 6, colors.darkGray, 4, 2, 20); // Overturned bunk 4

    // Scattered furniture debris - BoxGeometry
    createBox(2, 0.5, 2, colors.darkGray, -6, 2, 16);
    createBox(2, 0.5, 2, colors.darkGray, 6, 2, 16);
    createBox(2, 0.5, 2, colors.darkGray, -6, 2, 14);
    createBox(2, 0.5, 2, colors.darkGray, 6, 2, 14);
  }

  function buildSecurityStation() {
    // Control desk - BoxGeometry
    createBox(10, 3, 6, colors.labWhite, 0, 2, -5);
    createBox(1, 2, 2, colors.darkGray, -2, 3.5, -5);
    createBox(1, 2, 2, colors.darkGray, 2, 3.5, -5);

    // Emergency button - SphereGeometry red
    createSphere(0.6, colors.bloodRed, 0, 4, -5);

    // Control panel lights - SphereGeometry
    for (var i = 0; i < 12; i++) {
      var x = -3 + (i % 6) * 1.2;
      var y = 3.5 + Math.floor(i / 6) * 0.8;
      createSphere(0.25, colors.ominousGreen, x, y, -4.5);
    }
  }

  function buildEscapeTunnel() {
    // Blocked passage - BoxGeometry
    createBox(8, 8, 10, colors.shadowBlack, 0, 4, 28);
    createBox(7, 7, 9.5, colors.darkGray, 0, 4, 28);

    // Rubble and debris - BoxGeometry
    var rubblePositions = [
      { x: -2, y: 2, z: 26, w: 2, h: 2, d: 2 },
      { x: 2, y: 2, z: 26, w: 2, h: 2, d: 2 },
      { x: 0, y: 3, z: 27, w: 3, h: 1.5, d: 3 },
      { x: -3, y: 2.5, z: 28, w: 2, h: 2.5, d: 2 },
      { x: 3, y: 2.5, z: 28, w: 2, h: 2.5, d: 2 },
      { x: -2, y: 3.5, z: 29, w: 1.5, h: 2, d: 1.5 },
      { x: 2, y: 3.5, z: 29, w: 1.5, h: 2, d: 1.5 },
      { x: 0, y: 4.5, z: 30, w: 2, h: 1.5, d: 2 }
    ];

    for (var i = 0; i < rubblePositions.length; i++) {
      var pos = rubblePositions[i];
      createBox(pos.w, pos.h, pos.d, colors.shadowBlack, pos.x, pos.y, pos.z);
    }
  }

  function buildLaserSecuritySystem() {
    // Horizontal sweeping lasers - LineSegments
    var laserLines = [
      // Vertical grids
      { points: [
        { x: -25, y: 2, z: -25 }, { x: -25, y: 8, z: -25 },
        { x: -25, y: 2, z: 25 }, { x: -25, y: 8, z: 25 },
        { x: 25, y: 2, z: -25 }, { x: 25, y: 8, z: -25 },
        { x: 25, y: 2, z: 25 }, { x: 25, y: 8, z: 25 }
      ] },
      // Horizontal sweeps
      { points: [
        { x: -25, y: 5, z: -25 }, { x: 25, y: 5, z: -25 },
        { x: -25, y: 5, z: 0 }, { x: 25, y: 5, z: 0 },
        { x: -25, y: 5, z: 25 }, { x: 25, y: 5, z: 25 },
        { x: -25, y: 3, z: -25 }, { x: 25, y: 3, z: -25 },
        { x: -25, y: 3, z: 0 }, { x: 25, y: 3, z: 0 },
        { x: -25, y: 3, z: 25 }, { x: 25, y: 3, z: 25 }
      ] }
    ];

    for (var i = 0; i < laserLines.length; i++) {
      createLineSegments(laserLines[i].points, colors.ominousGreen);
    }
  }

  function buildBodyBags() {
    // Dark-wrapped body shapes - BoxGeometry
    var bodyPositions = [
      { x: -8, y: 1.5, z: 0 },
      { x: -4, y: 1.5, z: 0 },
      { x: 0, y: 1.5, z: 0 },
      { x: 4, y: 1.5, z: 0 },
      { x: 8, y: 1.5, z: 0 },
      { x: -8, y: 1.5, z: -8 },
      { x: -4, y: 1.5, z: -8 },
      { x: 0, y: 1.5, z: -8 },
      { x: 4, y: 1.5, z: -8 },
      { x: 8, y: 1.5, z: -8 },
      { x: -8, y: 1.5, z: 8 },
      { x: -4, y: 1.5, z: 8 },
      { x: 0, y: 1.5, z: 8 },
      { x: 4, y: 1.5, z: 8 },
      { x: 8, y: 1.5, z: 8 }
    ];

    for (var i = 0; i < bodyPositions.length; i++) {
      var pos = bodyPositions[i];
      createBox(1.5, 0.5, 5.5, colors.shadowBlack, pos.x, pos.y, pos.z);
    }
  }

  function init(scene, camera) {
    sceneRef = scene;
    cameraRef = camera;
    labObjects = [];
    animationState = {
      tankBubble: 0,
      laserSweep: 0,
      incineratorGlow: 0
    };

    // Set scene background
    sceneRef.background = new THREE.Color(colors.shadowBlack);

    // Build all lab components
    buildLabStructure();
    buildExperimentChambers();
    buildNeuralRigs();
    buildWeaponsFloor();
    buildBiohazardStorage();
    buildServerRoom();
    buildIncineratorRoom();
    buildStaffQuarters();
    buildSecurityStation();
    buildEscapeTunnel();
    buildLaserSecuritySystem();
    buildBodyBags();

    // Add lighting
    var ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    sceneRef.add(ambientLight);
    labObjects.push(ambientLight);

    var pointLight1 = new THREE.PointLight(0xff6600, 2, 40);
    pointLight1.position.set(18, 8, 0);
    sceneRef.add(pointLight1);
    labObjects.push(pointLight1);

    var pointLight2 = new THREE.PointLight(0x00ff00, 1.5, 50);
    pointLight2.position.set(-20, 6, 0);
    sceneRef.add(pointLight2);
    labObjects.push(pointLight2);

    var pointLight3 = new THREE.PointLight(0xff0000, 1, 30);
    pointLight3.position.set(0, 7, -5);
    sceneRef.add(pointLight3);
    labObjects.push(pointLight3);
  }

  function update(delta) {
    animationState.tankBubble += delta * 2;
    animationState.laserSweep += delta * 0.5;
    animationState.incineratorGlow += delta * 3;

    // Animate containment tanks - bubbling motion
    for (var i = 0; i < labObjects.length; i++) {
      var obj = labObjects[i];
      if (obj.userData && obj.userData.isBubbleTank) {
        obj.position.y += Math.sin(animationState.tankBubble + i) * 0.001;
        obj.scale.z = 1 + Math.sin(animationState.tankBubble * 2 + i) * 0.05;
      }
    }

    // Animate incinerator glow
    for (var i = 0; i < labObjects.length; i++) {
      var obj = labObjects[i];
      if (obj.userData && obj.userData.isIncinerator) {
        var intensity = 0.8 + Math.sin(animationState.incineratorGlow) * 0.3;
        if (obj.material && obj.material.emissive) {
          obj.material.emissiveIntensity = intensity;
        }
      }
    }

    // Laser beam animation - sweeping effect
    for (var i = 0; i < labObjects.length; i++) {
      var obj = labObjects[i];
      if (obj instanceof THREE.LineSegments) {
        var alphaValue = 0.3 + Math.sin(animationState.laserSweep + i) * 0.4;
        if (obj.material) {
          obj.material.opacity = alphaValue;
        }
      }
    }
  }

  function reset() {
    for (var i = labObjects.length - 1; i >= 0; i--) {
      var obj = labObjects[i];
      if (obj.geometry) {
        obj.geometry.dispose();
      }
      if (obj.material) {
        if (Array.isArray(obj.material)) {
          for (var j = 0; j < obj.material.length; j++) {
            obj.material[j].dispose();
          }
        } else {
          obj.material.dispose();
        }
      }
      sceneRef.remove(obj);
    }
    labObjects = [];
    animationState = {
      tankBubble: 0,
      laserSweep: 0,
      incineratorGlow: 0
    };
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
