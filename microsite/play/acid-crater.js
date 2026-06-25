window.AcidCrater = (function() {
  'use strict';

  var scene = null;
  var objects = [];
  var acidSurface = null;
  var particles = [];
  var bubbles = [];
  var time = 0;

  function buildCraterWalls() {
    var wallGeometry = new THREE.CylinderGeometry(80, 100, 60, 32);
    var wallMaterial = new THREE.MeshPhongMaterial({ color: 0x4a3728, emissive: 0x1a0f05 });
    var wall = new THREE.Mesh(wallGeometry, wallMaterial);
    wall.position.y = -30;
    wall.castShadow = true;
    wall.receiveShadow = true;
    scene.add(wall);
    objects.push(wall);
  }

  function buildAcidLake() {
    var acidGeometry = new THREE.CylinderGeometry(75, 75, 8, 64);
    var acidMaterial = new THREE.MeshPhongMaterial({
      color: 0x88dd00,
      emissive: 0x44aa00,
      shininess: 100
    });
    acidSurface = new THREE.Mesh(acidGeometry, acidMaterial);
    acidSurface.position.y = -25;
    acidSurface.castShadow = true;
    acidSurface.receiveShadow = true;
    scene.add(acidSurface);
    objects.push(acidSurface);
  }

  function buildMeltedRocks() {
    var positions = [
      { x: -50, y: 0, z: -40 },
      { x: 55, y: 5, z: 35 },
      { x: -30, y: -5, z: 50 },
      { x: 40, y: 10, z: -30 }
    ];

    positions.forEach(function(pos) {
      var geometry = new THREE.SphereGeometry(15, 12, 8);
      var material = new THREE.MeshPhongMaterial({
        color: 0x664422,
        emissive: 0x332211
      });
      var rock = new THREE.Mesh(geometry, material);
      rock.position.set(pos.x, pos.y, pos.z);
      rock.scale.set(1.2, 0.8, 1.3);
      rock.castShadow = true;
      rock.receiveShadow = true;
      scene.add(rock);
      objects.push(rock);
    });
  }

  function buildMilitaryOutpost() {
    var baseGeometry = new THREE.BoxGeometry(20, 8, 20);
    var baseMaterial = new THREE.MeshPhongMaterial({ color: 0x2a2a2a });
    var base = new THREE.Mesh(baseGeometry, baseMaterial);
    base.position.set(60, 10, 55);
    base.castShadow = true;
    base.receiveShadow = true;
    scene.add(base);
    objects.push(base);

    var towerGeometry = new THREE.CylinderGeometry(4, 5, 15, 8);
    var towerMaterial = new THREE.MeshPhongMaterial({ color: 0x444444 });
    var tower = new THREE.Mesh(towerGeometry, towerMaterial);
    tower.position.set(65, 25, 60);
    tower.castShadow = true;
    tower.receiveShadow = true;
    scene.add(tower);
    objects.push(tower);
  }

  function buildFloatingPlatforms() {
    var platformPositions = [
      { x: -30, y: 5, z: -45 },
      { x: 35, y: 15, z: 0 },
      { x: -15, y: 10, z: 40 }
    ];

    platformPositions.forEach(function(pos) {
      var platformGeometry = new THREE.BoxGeometry(16, 2, 16);
      var platformMaterial = new THREE.MeshPhongMaterial({
        color: 0x8b7355,
        emissive: 0x3d3428
      });
      var platform = new THREE.Mesh(platformGeometry, platformMaterial);
      platform.position.set(pos.x, pos.y, pos.z);
      platform.castShadow = true;
      platform.receiveShadow = true;
      scene.add(platform);
      objects.push(platform);

      buildChainSuspension(pos.x, pos.y, pos.z);
    });
  }

  function buildChainSuspension(x, y, z) {
    var chainMaterial = new THREE.LineBasicMaterial({ color: 0x888888 });
    var chainPoints = [
      new THREE.Vector3(x - 6, y, z - 6),
      new THREE.Vector3(x - 8, y + 8, z - 8),
      new THREE.Vector3(x - 12, y + 20, z - 12)
    ];
    var chainGeometry = new THREE.BufferGeometry().setFromPoints(chainPoints);
    var chain1 = new THREE.LineSegments(chainGeometry, chainMaterial);
    scene.add(chain1);
    objects.push(chain1);

    var chain2Points = [
      new THREE.Vector3(x + 6, y, z + 6),
      new THREE.Vector3(x + 8, y + 8, z + 8),
      new THREE.Vector3(x + 12, y + 20, z + 12)
    ];
    var chain2Geometry = new THREE.BufferGeometry().setFromPoints(chain2Points);
    var chain2 = new THREE.LineSegments(chain2Geometry, chainMaterial);
    scene.add(chain2);
    objects.push(chain2);
  }

  function buildCorrodedStructures() {
    var pipeGeometry = new THREE.CylinderGeometry(2, 2.5, 45, 6);
    var pipeMaterial = new THREE.MeshPhongMaterial({
      color: 0x8b4513,
      emissive: 0x3d1f0f
    });
    var pipe = new THREE.Mesh(pipeGeometry, pipeMaterial);
    pipe.position.set(-45, 5, 30);
    pipe.rotation.z = Math.PI / 6;
    pipe.castShadow = true;
    pipe.receiveShadow = true;
    scene.add(pipe);
    objects.push(pipe);

    var tankGeometry = new THREE.SphereGeometry(8, 8, 8);
    var tankMaterial = new THREE.MeshPhongMaterial({
      color: 0x666666,
      emissive: 0x222222
    });
    var tank = new THREE.Mesh(tankGeometry, tankMaterial);
    tank.position.set(35, 8, -50);
    tank.scale.set(1.5, 1.3, 1.2);
    tank.castShadow = true;
    tank.receiveShadow = true;
    scene.add(tank);
    objects.push(tank);
  }

  function buildToxicVents() {
    var ventPositions = [
      { x: 0, z: 0 },
      { x: -25, z: -25 },
      { x: 30, z: 20 }
    ];

    ventPositions.forEach(function(pos) {
      var ventGeometry = new THREE.CylinderGeometry(3, 4, 2, 8);
      var ventMaterial = new THREE.MeshPhongMaterial({ color: 0x333333 });
      var vent = new THREE.Mesh(ventGeometry, ventMaterial);
      vent.position.set(pos.x, -23, pos.z);
      vent.castShadow = true;
      scene.add(vent);
      objects.push(vent);
    });
  }

  function createBubbles() {
    for (var i = 0; i < 20; i++) {
      var bubbleGeometry = new THREE.SphereGeometry(0.5, 8, 8);
      var bubbleMaterial = new THREE.MeshPhongMaterial({
        color: 0x88dd00,
        transparent: true,
        opacity: 0.6
      });
      var bubble = new THREE.Mesh(bubbleGeometry, bubbleMaterial);
      bubble.position.set(
        (Math.random() - 0.5) * 150,
        -20,
        (Math.random() - 0.5) * 150
      );
      bubble.velocity = {
        x: (Math.random() - 0.5) * 2,
        y: Math.random() * 3 + 2,
        z: (Math.random() - 0.5) * 2
      };
      bubble.lifespan = Math.random() * 80 + 60;
      bubble.age = 0;
      scene.add(bubble);
      bubbles.push(bubble);
    }
  }

  function init(initScene, initCamera) {
    scene = initScene;
    time = 0;
    objects = [];
    bubbles = [];

    buildCraterWalls();
    buildAcidLake();
    buildMeltedRocks();
    buildMilitaryOutpost();
    buildFloatingPlatforms();
    buildCorrodedStructures();
    buildToxicVents();
    createBubbles();

    return true;
  }

  function update(delta) {
    time += delta;

    if (acidSurface) {
      var geom = acidSurface.geometry;
      var posAttribute = geom.getAttribute('position');
      if (posAttribute) {
        var positions = posAttribute.array;
        for (var i = 0; i < positions.length; i += 3) {
          var waveX = Math.sin(time + positions[i] * 0.05) * 0.3;
          var waveZ = Math.cos(time + positions[i + 2] * 0.05) * 0.3;
          positions[i + 1] = 0.5 + waveX + waveZ;
        }
        posAttribute.needsUpdate = true;
      }
    }

    for (var i = bubbles.length - 1; i >= 0; i--) {
      var bubble = bubbles[i];
      bubble.age += delta;
      bubble.position.x += bubble.velocity.x * delta;
      bubble.position.y += bubble.velocity.y * delta;
      bubble.position.z += bubble.velocity.z * delta;
      bubble.material.opacity = (1 - bubble.age / bubble.lifespan) * 0.6;

      if (bubble.age > bubble.lifespan) {
        scene.remove(bubble);
        bubbles.splice(i, 1);
      }
    }

    if (bubbles.length < 20 && Math.random() < 0.3) {
      createBubbles();
    }
  }

  function reset() {
    while (objects.length > 0) {
      var obj = objects.pop();
      scene.remove(obj);
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        if (Array.isArray(obj.material)) {
          obj.material.forEach(function(m) { m.dispose(); });
        } else {
          obj.material.dispose();
        }
      }
    }

    while (bubbles.length > 0) {
      var b = bubbles.pop();
      scene.remove(b);
      if (b.geometry) b.geometry.dispose();
      if (b.material) b.material.dispose();
    }

    acidSurface = null;
    time = 0;
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
