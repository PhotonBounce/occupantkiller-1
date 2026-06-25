window.CyberRuins = (function() {
  'use strict';

  var scene;
  var objects = [];
  var floatingDebris = [];
  var neonSigns = [];
  var gridLines;
  var time = 0;

  function init(inputScene, camera) {
    scene = inputScene;
    time = 0;
    objects = [];
    floatingDebris = [];
    neonSigns = [];

    buildGround();
    buildTowers();
    buildCircuitWalls();
    buildHolographicSigns();
    buildFloatingDebris();
    buildGridLines();
  }

  function buildGround() {
    var geometry = new THREE.BoxGeometry(200, 2, 200);
    var material = new THREE.MeshStandardMaterial({
      color: 0x1a1a2e,
      metalness: 0.8,
      roughness: 0.3
    });
    var ground = new THREE.Mesh(geometry, material);
    ground.position.y = -10;
    scene.add(ground);
    objects.push(ground);
  }

  function buildTowers() {
    var positions = [
      { x: -60, z: -60 },
      { x: 60, z: -60 },
      { x: -60, z: 60 },
      { x: 60, z: 60 },
      { x: 0, z: 0 }
    ];

    positions.forEach(function(pos) {
      var height = Math.random() * 60 + 80;
      var geometry = new THREE.BoxGeometry(25, height, 25);
      var material = new THREE.MeshStandardMaterial({
        color: new THREE.Color().setHSL(0.6 + Math.random() * 0.2, 0.7, 0.3),
        metalness: 0.9,
        roughness: 0.4,
        emissive: new THREE.Color().setHSL(0.6, 0.8, 0.2),
        emissiveIntensity: 0.3
      });
      var tower = new THREE.Mesh(geometry, material);
      tower.position.set(pos.x, height / 2, pos.z);
      tower.castShadow = true;
      scene.add(tower);
      objects.push(tower);

      buildBrokenGlass(pos.x, height, pos.z);
    });
  }

  function buildBrokenGlass(x, height, z) {
    for (var i = 0; i < 5; i++) {
      var sizeX = Math.random() * 8 + 4;
      var sizeY = Math.random() * 12 + 6;
      var geometry = new THREE.BoxGeometry(sizeX, sizeY, 1);
      var material = new THREE.MeshStandardMaterial({
        color: 0x88ccff,
        metalness: 0.7,
        roughness: 0.1,
        emissive: 0x4488ff,
        emissiveIntensity: 0.5,
        transparent: true,
        opacity: 0.6
      });
      var glass = new THREE.Mesh(geometry, material);
      glass.position.set(
        x + (Math.random() - 0.5) * 30,
        height * Math.random(),
        z + (Math.random() - 0.5) * 30
      );
      glass.rotation.z = Math.random() * Math.PI;
      scene.add(glass);
      objects.push(glass);
    }
  }

  function buildCircuitWalls() {
    var wallConfigs = [
      { x: -80, z: 0, rotY: 0 },
      { x: 80, z: 0, rotY: 0 },
      { x: 0, z: -80, rotY: Math.PI / 2 },
      { x: 0, z: 80, rotY: Math.PI / 2 }
    ];

    wallConfigs.forEach(function(config) {
      var geometry = new THREE.BoxGeometry(120, 50, 8);
      var material = new THREE.MeshStandardMaterial({
        color: 0x0f3460,
        metalness: 0.85,
        roughness: 0.5,
        emissive: 0x00ff88,
        emissiveIntensity: 0.2
      });
      var wall = new THREE.Mesh(geometry, material);
      wall.position.set(config.x, 25, config.z);
      wall.rotation.y = config.rotY;
      scene.add(wall);
      objects.push(wall);

      buildExposedCircuitry(config.x, config.z, config.rotY);
    });
  }

  function buildExposedCircuitry(x, z, rotY) {
    for (var i = 0; i < 8; i++) {
      var geometry = new THREE.CylinderGeometry(1, 1, 40, 8);
      var material = new THREE.MeshStandardMaterial({
        color: 0xff00ff,
        metalness: 0.9,
        emissive: 0xff00ff,
        emissiveIntensity: 0.6
      });
      var pipe = new THREE.Mesh(geometry, material);
      var offsetX = (i - 3.5) * 12;
      pipe.position.set(x + offsetX * Math.cos(rotY), 25, z + offsetX * Math.sin(rotY));
      pipe.rotation.z = rotY;
      scene.add(pipe);
      objects.push(pipe);
    }
  }

  function buildHolographicSigns() {
    var signPositions = [
      { x: -40, y: 60, z: -40, color: 0xff0099 },
      { x: 40, y: 70, z: -40, color: 0x00ffff },
      { x: -40, y: 55, z: 40, color: 0xffff00 },
      { x: 40, y: 65, z: 40, color: 0x00ff00 },
      { x: 0, y: 80, z: 0, color: 0xff6600 }
    ];

    signPositions.forEach(function(pos) {
      var geometry = new THREE.BoxGeometry(12, 12, 2);
      var material = new THREE.MeshStandardMaterial({
        color: pos.color,
        metalness: 0.6,
        emissive: pos.color,
        emissiveIntensity: 0.8,
        transparent: true,
        opacity: 0.9
      });
      var sign = new THREE.Mesh(geometry, material);
      sign.position.set(pos.x, pos.y, pos.z);
      sign.castShadow = true;
      scene.add(sign);
      objects.push(sign);
      neonSigns.push({
        mesh: sign,
        baseIntensity: 0.8,
        color: pos.color
      });
    });
  }

  function buildFloatingDebris() {
    for (var i = 0; i < 15; i++) {
      var size = Math.random() * 3 + 1;
      var geometry = new THREE.BoxGeometry(size, size, size);
      var material = new THREE.MeshStandardMaterial({
        color: new THREE.Color().setHSL(Math.random(), 0.6, 0.4),
        metalness: 0.7,
        roughness: 0.4
      });
      var debris = new THREE.Mesh(geometry, material);
      debris.position.set(
        (Math.random() - 0.5) * 150,
        Math.random() * 40 + 5,
        (Math.random() - 0.5) * 150
      );
      debris.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
      );
      scene.add(debris);
      objects.push(debris);
      floatingDebris.push({
        mesh: debris,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        vz: (Math.random() - 0.5) * 0.3,
        rotX: Math.random() * 0.02,
        rotY: Math.random() * 0.02,
        rotZ: Math.random() * 0.02
      });
    }
  }

  function buildGridLines() {
    var geometry = new THREE.BufferGeometry();
    var positions = [];
    var spacing = 20;
    var size = 200;

    for (var x = -size; x <= size; x += spacing) {
      positions.push(x, 0.1, -size);
      positions.push(x, 0.1, size);
    }
    for (var z = -size; z <= size; z += spacing) {
      positions.push(-size, 0.1, z);
      positions.push(size, 0.1, z);
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(positions), 3));
    var material = new THREE.LineBasicMaterial({
      color: 0x00ff88,
      linewidth: 2,
      transparent: true,
      opacity: 0.4
    });
    gridLines = new THREE.LineSegments(geometry, material);
    scene.add(gridLines);
    objects.push(gridLines);
  }

  function update(delta) {
    time += delta;

    floatingDebris.forEach(function(item) {
      var mesh = item.mesh;
      mesh.position.x += item.vx;
      mesh.position.y += item.vy;
      mesh.position.z += item.vz;
      mesh.rotation.x += item.rotX;
      mesh.rotation.y += item.rotY;
      mesh.rotation.z += item.rotZ;

      if (mesh.position.y < 0) {
        mesh.position.y = 60;
      }
      if (Math.abs(mesh.position.x) > 120) {
        mesh.position.x *= -0.8;
      }
      if (Math.abs(mesh.position.z) > 120) {
        mesh.position.z *= -0.8;
      }
    });

    neonSigns.forEach(function(sign) {
      var flicker = Math.sin(time * 8 + Math.random() * 10) * 0.3 + 0.7;
      sign.mesh.material.emissiveIntensity = sign.baseIntensity * flicker;
    });

    if (gridLines) {
      gridLines.material.opacity = Math.sin(time * 2) * 0.2 + 0.3;
    }
  }

  function reset() {
    objects.forEach(function(obj) {
      scene.remove(obj);
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        if (Array.isArray(obj.material)) {
          obj.material.forEach(function(mat) { mat.dispose(); });
        } else {
          obj.material.dispose();
        }
      }
    });
    objects = [];
    floatingDebris = [];
    neonSigns = [];
    gridLines = null;
    time = 0;
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
