window.MoltenBridge = (function() {
  'use strict';

  var scene, camera;
  var bridgeSegments = [];
  var gargoyles = [];
  var lavaParticles = [];
  var smokeColumns = [];
  var reinforcementBeams = [];
  var emissiveObjects = [];
  var time = 0;

  var meshesToCleanup = [];

  function addMesh(mesh) {
    meshesToCleanup.push(mesh);
    scene.add(mesh);
    return mesh;
  }

  function buildBridge() {
    var bridgeLength = 120;
    var bridgeWidth = 20;
    var bridgeHeight = 8;
    var segmentSize = 15;

    for (var i = 0; i < bridgeLength; i += segmentSize) {
      var geometry = new THREE.BoxGeometry(segmentSize, bridgeHeight, bridgeWidth);
      var isCracked = Math.random() > 0.6;
      var material;

      if (isCracked) {
        material = new THREE.MeshStandardMaterial({
          color: 0x8B4513,
          roughness: 0.7,
          metalness: 0.1,
          emissive: 0xFF6600,
          emissiveIntensity: 0.6
        });
        emissiveObjects.push({ mesh: null, intensity: 0.6, baseIntensity: 0.6 });
      } else {
        material = new THREE.MeshStandardMaterial({
          color: 0x654321,
          roughness: 0.8,
          metalness: 0
        });
      }

      var mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(i - bridgeLength / 2, 0, 0);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      addMesh(mesh);
      bridgeSegments.push(mesh);

      if (isCracked) {
        emissiveObjects[emissiveObjects.length - 1].mesh = mesh;
      }

      if (Math.random() > 0.7) {
        createCrumblingSection(i - bridgeLength / 2);
      }
    }

    createParapets(bridgeLength);
  }

  function createParapets(bridgeLength) {
    var parapetGeometry = new THREE.BoxGeometry(120, 4, 2);
    var parapetMaterial = new THREE.MeshStandardMaterial({
      color: 0x8B4513,
      roughness: 0.8,
      metalness: 0.05
    });

    var leftParapet = new THREE.Mesh(parapetGeometry, parapetMaterial);
    leftParapet.position.set(0, 5, -12);
    leftParapet.castShadow = true;
    leftParapet.receiveShadow = true;
    addMesh(leftParapet);

    var rightParapet = new THREE.Mesh(parapetGeometry, parapetMaterial);
    rightParapet.position.set(0, 5, 12);
    rightParapet.castShadow = true;
    rightParapet.receiveShadow = true;
    addMesh(rightParapet);
  }

  function createCrumblingSection(centerX) {
    var chunkCount = 3 + Math.floor(Math.random() * 3);
    for (var i = 0; i < chunkCount; i++) {
      var geometry = new THREE.BoxGeometry(
        3 + Math.random() * 4,
        2 + Math.random() * 3,
        2 + Math.random() * 3
      );
      var material = new THREE.MeshStandardMaterial({
        color: 0x654321,
        roughness: 0.9,
        metalness: 0
      });
      var mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(
        centerX + (Math.random() - 0.5) * 8,
        -5 - Math.random() * 8,
        (Math.random() - 0.5) * 10
      );
      mesh.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
      );
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      addMesh(mesh);
    }
  }

  function createGargoyles() {
    var gargoylePositions = [-30, -10, 10, 30];
    var sidePositions = [-13, 13];

    for (var i = 0; i < gargoylePositions.length; i++) {
      for (var j = 0; j < sidePositions.length; j++) {
        var gargoyle = createGargoyle(gargoylePositions[i], sidePositions[j]);
        gargoyles.push(gargoyle);
      }
    }
  }

  function createGargoyle(posX, posZ) {
    var group = new THREE.Group();

    var bodyGeometry = new THREE.BoxGeometry(3, 5, 2);
    var stoneMaterial = new THREE.MeshStandardMaterial({
      color: 0x555555,
      roughness: 0.9,
      metalness: 0
    });
    var body = new THREE.Mesh(bodyGeometry, stoneMaterial);
    body.position.y = 2;
    group.add(body);

    var headGeometry = new THREE.SphereGeometry(2, 16, 16);
    var head = new THREE.Mesh(headGeometry, stoneMaterial);
    head.position.y = 6;
    head.scale.set(1, 1.3, 0.9);
    group.add(head);

    var leftWingGeometry = new THREE.ConeGeometry(2, 4, 8);
    var leftWing = new THREE.Mesh(leftWingGeometry, stoneMaterial);
    leftWing.position.set(-2.5, 4, 0);
    leftWing.rotation.z = Math.PI / 6;
    group.add(leftWing);

    var rightWingGeometry = new THREE.ConeGeometry(2, 4, 8);
    var rightWing = new THREE.Mesh(rightWingGeometry, stoneMaterial);
    rightWing.position.set(2.5, 4, 0);
    rightWing.rotation.z = -Math.PI / 6;
    group.add(rightWing);

    group.position.set(posX, 10, posZ);
    group.castShadow = true;
    group.receiveShadow = true;

    addMesh(group);
    return group;
  }

  function createLavaPools() {
    var poolPositions = [
      { x: -25, z: -15 },
      { x: 0, z: -20 },
      { x: 25, z: -15 },
      { x: -35, z: 18 },
      { x: 15, z: 22 }
    ];

    for (var i = 0; i < poolPositions.length; i++) {
      var geometry = new THREE.SphereGeometry(4, 16, 16);
      var material = new THREE.MeshStandardMaterial({
        color: 0xFF4500,
        emissive: 0xFF6600,
        emissiveIntensity: 0.8,
        roughness: 0.4,
        metalness: 0.2
      });
      var pool = new THREE.Mesh(geometry, material);
      pool.position.set(poolPositions[i].x, -40, poolPositions[i].z);
      pool.scale.set(1, 0.3, 1);
      pool.castShadow = true;
      pool.receiveShadow = true;
      addMesh(pool);
      emissiveObjects.push({ mesh: pool, intensity: 0.8, baseIntensity: 0.8 });
      lavaParticles.push(pool);
    }
  }

  function createSmokeColumns() {
    var smokePositions = [-40, -20, 0, 20, 40];

    for (var i = 0; i < smokePositions.length; i++) {
      var geometry = new THREE.CylinderGeometry(3, 5, 20, 8);
      var material = new THREE.MeshStandardMaterial({
        color: 0x444444,
        transparent: true,
        opacity: 0.3,
        roughness: 1,
        metalness: 0
      });
      var column = new THREE.Mesh(geometry, material);
      column.position.set(smokePositions[i], -30, 0);
      addMesh(column);
      smokeColumns.push({
        mesh: column,
        baseY: -30,
        phase: Math.random() * Math.PI * 2
      });
    }
  }

  function createReinforcementBeams() {
    var beamPositions = [-45, -15, 15, 45];

    for (var i = 0; i < beamPositions.length; i++) {
      var beamX = beamPositions[i];

      var verticalGeometry = new THREE.BoxGeometry(0.8, 18, 0.8);
      var metalMaterial = new THREE.MeshStandardMaterial({
        color: 0x888888,
        roughness: 0.3,
        metalness: 0.9
      });
      var vertical = new THREE.Mesh(verticalGeometry, metalMaterial);
      vertical.position.set(beamX, 2, -14);
      vertical.castShadow = true;
      vertical.receiveShadow = true;
      addMesh(vertical);
      reinforcementBeams.push(vertical);

      var horizontalGeometry = new THREE.BoxGeometry(12, 0.8, 0.8);
      var horizontal = new THREE.Mesh(horizontalGeometry, metalMaterial);
      horizontal.position.set(beamX, 8, -14);
      horizontal.castShadow = true;
      horizontal.receiveShadow = true;
      addMesh(horizontal);
      reinforcementBeams.push(horizontal);
    }
  }

  function createLighting() {
    var ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    var sunLight = new THREE.DirectionalLight(0xffffff, 1);
    sunLight.position.set(50, 60, 30);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.far = 200;
    sunLight.shadow.camera.left = -100;
    sunLight.shadow.camera.right = 100;
    sunLight.shadow.camera.top = 100;
    sunLight.shadow.camera.bottom = -100;
    scene.add(sunLight);

    var lavaGlow = new THREE.PointLight(0xFF6600, 2, 100);
    lavaGlow.position.set(0, -35, 0);
    scene.add(lavaGlow);
  }

  function init(inScene, inCamera) {
    scene = inScene;
    camera = inCamera;

    var fogColor = 0x1a1a1a;
    scene.fog = new THREE.Fog(fogColor, 150, 300);
    scene.background = new THREE.Color(fogColor);

    buildBridge();
    createGargoyles();
    createLavaPools();
    createSmokeColumns();
    createReinforcementBeams();
    createLighting();
  }

  function update(delta) {
    time += delta;

    for (var i = 0; i < emissiveObjects.length; i++) {
      var obj = emissiveObjects[i];
      var pulse = Math.sin(time * 2 + i) * 0.3 + 1;
      obj.mesh.material.emissiveIntensity = obj.baseIntensity * pulse;
    }

    for (var i = 0; i < smokeColumns.length; i++) {
      var column = smokeColumns[i];
      var wave = Math.sin(time + column.phase) * 2;
      column.mesh.position.y = column.baseY + wave;
      column.mesh.rotation.y += delta * 0.5;
    }

    for (var i = 0; i < gargoyles.length; i++) {
      var gargoyle = gargoyles[i];
      gargoyle.children[2].rotation.z = Math.sin(time * 1.5 + i) * 0.3 + Math.PI / 6;
      gargoyle.children[3].rotation.z = Math.sin(time * 1.5 + i) * 0.3 - Math.PI / 6;
    }
  }

  function reset() {
    for (var i = 0; i < meshesToCleanup.length; i++) {
      var mesh = meshesToCleanup[i];
      if (mesh.geometry) mesh.geometry.dispose();
      if (mesh.material) {
        if (Array.isArray(mesh.material)) {
          for (var j = 0; j < mesh.material.length; j++) {
            mesh.material[j].dispose();
          }
        } else {
          mesh.material.dispose();
        }
      }
      scene.remove(mesh);
    }

    bridgeSegments = [];
    gargoyles = [];
    lavaParticles = [];
    smokeColumns = [];
    reinforcementBeams = [];
    emissiveObjects = [];
    meshesToCleanup = [];
    time = 0;
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
