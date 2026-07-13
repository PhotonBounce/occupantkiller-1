window.SunkenPalace = (function() {
  'use strict';

  var scene;
  var camera;
  var meshes = [];
  var animationStates = {};

  function createMarbleMaterial() {
    return new THREE.MeshStandardMaterial({
      color: 0xf5f5f0,
      roughness: 0.3,
      metalness: 0.1
    });
  }

  function createCoralMaterial() {
    return new THREE.MeshStandardMaterial({
      color: 0xf08080,
      roughness: 0.6,
      metalness: 0.0
    });
  }

  function createSeaDarkMaterial() {
    return new THREE.MeshStandardMaterial({
      color: 0x1a5f5f,
      roughness: 0.7,
      metalness: 0.2
    });
  }

  function createGlowMaterial(color) {
    return new THREE.MeshStandardMaterial({
      color: color,
      emissive: color,
      emissiveIntensity: 0.5,
      roughness: 0.4,
      metalness: 0.3
    });
  }

  function addMarbleColumn(x, y, z, height) {
    var geometry = new THREE.CylinderGeometry(2, 2, height, 16);
    var material = createMarbleMaterial();
    var mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y + height / 2, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);
    meshes.push(mesh);
    return mesh;
  }

  function addCoralGrowth(x, y, z) {
    var geometry = new THREE.SphereGeometry(1.5, 8, 8);
    var material = createCoralMaterial();
    var mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    mesh.scale.set(1.2, 0.8, 1.2);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);
    meshes.push(mesh);
    return mesh;
  }

  function addWallSection(x, y, z, width, height, depth) {
    var geometry = new THREE.BoxGeometry(width, height, depth);
    var material = createSeaDarkMaterial();
    var mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);
    meshes.push(mesh);
    return mesh;
  }

  function addThroneBase() {
    var geometry = new THREE.BoxGeometry(8, 2, 8);
    var material = createMarbleMaterial();
    var mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(0, 1, 0);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);
    meshes.push(mesh);

    var backGeometry = new THREE.BoxGeometry(6, 5, 1);
    var backMesh = new THREE.Mesh(backGeometry, createCoralMaterial());
    backMesh.position.set(0, 3.5, -3.5);
    backMesh.castShadow = true;
    backMesh.receiveShadow = true;
    scene.add(backMesh);
    meshes.push(backMesh);
  }

  function addVaultDoor(x, y, z) {
    var geometry = new THREE.BoxGeometry(4, 4, 0.5);
    var material = createGlowMaterial(0x008080);
    var mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);
    meshes.push(mesh);

    animationStates[mesh.uuid] = {
      type: 'vault',
      offset: 0,
      maxOffset: 0.3,
      speed: 1.5
    };

    return mesh;
  }

  function addDebris(x, y, z) {
    var sizes = [0.5, 0.7, 0.4];
    var index = Math.floor(Math.random() * sizes.length);
    var geometry = new THREE.BoxGeometry(sizes[index], sizes[index] * 0.5, sizes[index]);
    var material = createSeaDarkMaterial();
    var mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);
    meshes.push(mesh);

    animationStates[mesh.uuid] = {
      type: 'float',
      originalY: y,
      amplitude: 0.3 + Math.random() * 0.3,
      speed: 0.5 + Math.random() * 0.8,
      phase: Math.random() * Math.PI * 2
    };

    return mesh;
  }

  function addPressureDoor(x, y, z, isVertical) {
    var width = isVertical ? 3 : 5;
    var height = isVertical ? 5 : 3;
    var geometry = new THREE.BoxGeometry(width, height, 0.3);
    var material = createGlowMaterial(0x2f4f7f);
    var mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);
    meshes.push(mesh);

    animationStates[mesh.uuid] = {
      type: 'pressure',
      minZ: z - 0.5,
      maxZ: z + 0.5,
      speed: 2.0,
      offset: 0
    };

    return mesh;
  }

  function addAirHoseSystem(x, y, z) {
    var pipeGeometry = new THREE.CylinderGeometry(0.3, 0.3, 6, 8);
    var pipeMaterial = createSeaDarkMaterial();
    var pipeMesh = new THREE.Mesh(pipeGeometry, pipeMaterial);
    pipeMesh.position.set(x, y + 3, z);
    pipeMesh.rotation.z = Math.PI / 4;
    pipeMesh.castShadow = true;
    pipeMesh.receiveShadow = true;
    scene.add(pipeMesh);
    meshes.push(pipeMesh);

    var connectorGeometry = new THREE.SphereGeometry(0.6, 8, 8);
    var connectorMaterial = createGlowMaterial(0xff6b6b);
    var connectorMesh = new THREE.Mesh(connectorGeometry, connectorMaterial);
    connectorMesh.position.set(x, y, z);
    connectorMesh.castShadow = true;
    connectorMesh.receiveShadow = true;
    scene.add(connectorMesh);
    meshes.push(connectorMesh);

    animationStates[connectorMesh.uuid] = {
      type: 'pulse',
      baseIntensity: 0.5,
      maxIntensity: 1.0,
      speed: 2.5
    };
  }

  function addKelpStructure(x, y, z) {
    var baseGeometry = new THREE.ConeGeometry(1.5, 5, 12);
    var baseMaterial = createSeaDarkMaterial();
    var baseMesh = new THREE.Mesh(baseGeometry, baseMaterial);
    baseMesh.position.set(x, y + 2.5, z);
    baseMesh.castShadow = true;
    baseMesh.receiveShadow = true;
    scene.add(baseMesh);
    meshes.push(baseMesh);

    for (var i = 0; i < 4; i++) {
      var angle = (Math.PI * 2 / 4) * i;
      var leafX = x + Math.cos(angle) * 2;
      var leafZ = z + Math.sin(angle) * 2;
      var leafGeometry = new THREE.BoxGeometry(0.3, 3, 1.5);
      var leafMaterial = createCoralMaterial();
      var leafMesh = new THREE.Mesh(leafGeometry, leafMaterial);
      leafMesh.position.set(leafX, y + 3, leafZ);
      leafMesh.rotation.z = angle;
      leafMesh.castShadow = true;
      leafMesh.receiveShadow = true;
      scene.add(leafMesh);
      meshes.push(leafMesh);
    }
  }

  function addBioluminescentOrb(x, y, z) {
    var geometry = new THREE.SphereGeometry(0.8, 16, 16);
    var material = createGlowMaterial(0x00ff88);
    var mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);
    meshes.push(mesh);

    animationStates[mesh.uuid] = {
      type: 'glow',
      baseIntensity: 0.4,
      maxIntensity: 0.9,
      speed: 1.2,
      phase: Math.random() * Math.PI * 2
    };

    return mesh;
  }

  function addAqueductChannel(x, y, z, length) {
    var geometry = new THREE.BoxGeometry(3, 1.5, length);
    var material = createSeaDarkMaterial();
    var mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);
    meshes.push(mesh);

    var rubbleGeometry = new THREE.BoxGeometry(0.8, 0.4, 0.8);
    var rubbleMaterial = createMarbleMaterial();
    for (var i = 0; i < 5; i++) {
      var rubbleX = x + (Math.random() - 0.5) * 2;
      var rubbleZ = z + (length / 5) * i - length / 2 + 2;
      var rubbleMesh = new THREE.Mesh(rubbleGeometry, rubbleMaterial);
      rubbleMesh.position.set(rubbleX, y + 0.5, rubbleZ);
      rubbleMesh.castShadow = true;
      rubbleMesh.receiveShadow = true;
      scene.add(rubbleMesh);
      meshes.push(rubbleMesh);
    }
  }

  function addFloor(x, y, z, width, length) {
    var geometry = new THREE.BoxGeometry(width, 0.5, length);
    var material = createMarbleMaterial();
    var mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    mesh.receiveShadow = true;
    scene.add(mesh);
    meshes.push(mesh);
  }

  function initEnvironment() {
    addFloor(0, 0, 0, 80, 80);

    addMarbleColumn(-20, 0, -20, 12);
    addMarbleColumn(20, 0, -20, 12);
    addMarbleColumn(-20, 0, 20, 12);
    addMarbleColumn(20, 0, 20, 12);

    addMarbleColumn(-10, 0, 0, 10);
    addMarbleColumn(10, 0, 0, 10);
    addMarbleColumn(0, 0, -10, 10);
    addMarbleColumn(0, 0, 10, 10);

    addCoralGrowth(-20, 6, -20);
    addCoralGrowth(20, 6, -20);
    addCoralGrowth(-20, 6, 20);
    addCoralGrowth(20, 6, 20);

    addWallSection(-35, 3, 0, 2, 8, 40);
    addWallSection(35, 3, 0, 2, 8, 40);
    addWallSection(0, 3, -35, 40, 8, 2);
    addWallSection(0, 3, 35, 40, 8, 2);

    addThroneBase();

    addVaultDoor(0, 5, -25);
    addVaultDoor(25, 5, 25);

    addPressureDoor(-25, 4, 0, true);
    addPressureDoor(25, 4, 0, true);
    addPressureDoor(0, 4, -25, false);
    addPressureDoor(0, 4, 25, false);

    addAirHoseSystem(-28, 0, 28);
    addAirHoseSystem(28, 0, -28);

    addKelpStructure(-15, 0, 15);
    addKelpStructure(15, 0, -15);

    addBioluminescentOrb(-25, 7, -25);
    addBioluminescentOrb(25, 7, 25);
    addBioluminescentOrb(-25, 7, 25);
    addBioluminescentOrb(25, 7, -25);

    addAqueductChannel(-20, 1, 0, 25);
    addAqueductChannel(20, 1, 0, 25);

    for (var i = 0; i < 12; i++) {
      var angle = (Math.PI * 2 / 12) * i;
      var debrisX = Math.cos(angle) * 30;
      var debrisZ = Math.sin(angle) * 30;
      addDebris(debrisX, 2 + Math.random() * 2, debrisZ);
    }
  }

  function init(_scene, _camera) {
    scene = _scene;
    camera = _camera;

    var ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    var directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(30, 30, 30);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 100;
    directionalLight.shadow.camera.left = -50;
    directionalLight.shadow.camera.right = 50;
    directionalLight.shadow.camera.top = 50;
    directionalLight.shadow.camera.bottom = -50;
    scene.add(directionalLight);

    var pointLight1 = new THREE.PointLight(0x00ff88, 1.0, 40);
    pointLight1.position.set(-25, 8, -25);
    scene.add(pointLight1);

    var pointLight2 = new THREE.PointLight(0x00ff88, 1.0, 40);
    pointLight2.position.set(25, 8, 25);
    scene.add(pointLight2);

    var fogColor = 0x2a5a7a;
    scene.background = new THREE.Color(fogColor);
    scene.fog = new THREE.Fog(fogColor, 100, 200);

    initEnvironment();
  }

  function updateAnimations(delta) {
    for (var uuid in animationStates) {
      if (animationStates.hasOwnProperty(uuid)) {
        var state = animationStates[uuid];
        var mesh = undefined;

        for (var i = 0; i < meshes.length; i++) {
          if (meshes[i].uuid === uuid) {
            mesh = meshes[i];
            break;
          }
        }

        if (!mesh) continue;

        if (state.type === 'float') {
          state.phase += delta * state.speed;
          var floatY = state.originalY + Math.sin(state.phase) * state.amplitude;
          mesh.position.y = floatY;
        } else if (state.type === 'glow') {
          state.phase += delta * state.speed;
          var intensity = state.baseIntensity + Math.sin(state.phase) * (state.maxIntensity - state.baseIntensity) * 0.5;
          if (mesh.material.emissiveIntensity !== undefined) {
            mesh.material.emissiveIntensity = intensity;
          }
        } else if (state.type === 'pulse') {
          state.phase = (state.phase || 0) + delta * state.speed;
          var pulseIntensity = state.baseIntensity + Math.sin(state.phase) * (state.maxIntensity - state.baseIntensity) * 0.5;
          if (mesh.material.emissiveIntensity !== undefined) {
            mesh.material.emissiveIntensity = pulseIntensity;
          }
        } else if (state.type === 'vault') {
          state.offset += delta * state.speed;
          if (state.offset > state.maxOffset * 2) {
            state.offset = 0;
          }
          var vaultOffset = Math.abs(state.offset - state.maxOffset) - state.maxOffset * 0.5;
          mesh.position.z += vaultOffset * 0.1;
        } else if (state.type === 'pressure') {
          state.offset += delta * state.speed;
          var cycle = Math.sin(state.offset) * 0.5 + 0.5;
          mesh.position.z = state.minZ + (state.maxZ - state.minZ) * cycle;
        }
      }
    }
  }

  function update(delta) {
    updateAnimations(delta);
  }

  function reset() {
    for (var i = 0; i < meshes.length; i++) {
      scene.remove(meshes[i]);
    }
    meshes = [];
    animationStates = {};
    init(scene, camera);
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
