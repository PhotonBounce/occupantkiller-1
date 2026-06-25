window.OrbitalRelay = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var envGroup = null;
  var rotatingDishes = [];
  var thrusters = [];
  var debrisObjects = [];
  var starfield = null;

  function buildWalls() {
    var walls = new THREE.Group();
    var wallMaterial = new THREE.MeshPhongMaterial({ color: 0x2c3e50, shininess: 30 });

    for (var i = 0; i < 4; i++) {
      var angle = (i / 4) * Math.PI * 2;
      var wall = new THREE.Mesh(new THREE.BoxGeometry(15, 12, 0.5), wallMaterial);
      wall.position.set(Math.cos(angle) * 20, 0, Math.sin(angle) * 20);
      wall.rotation.y = angle;
      walls.add(wall);
    }
    return walls;
  }

  function buildHabitatTubes() {
    var tubes = new THREE.Group();
    var tubeMaterial = new THREE.MeshPhongMaterial({ color: 0x34495e, metalness: 0.4 });

    for (var i = 0; i < 3; i++) {
      var tube = new THREE.Mesh(new THREE.CylinderGeometry(2, 2, 20, 16), tubeMaterial);
      tube.rotation.z = Math.PI / 3 + (i * Math.PI / 6);
      tube.position.x = -10 + (i * 8);
      tube.position.y = 5 - (i * 3);
      tubes.add(tube);
    }
    return tubes;
  }

  function buildSolarPanels() {
    var panels = new THREE.Group();
    var panelMaterial = new THREE.MeshPhongMaterial({ color: 0xffdd00, emissive: 0xffaa00, shininess: 80 });

    for (var row = 0; row < 3; row++) {
      for (var col = 0; col < 4; col++) {
        var panel = new THREE.Mesh(new THREE.BoxGeometry(4, 6, 0.2), panelMaterial);
        panel.position.set(-6 + (col * 5), 15 + (row * 8), -25);
        panel.rotation.x = Math.PI / 6;
        panels.add(panel);
      }
    }
    return panels;
  }

  function buildDishes() {
    var dishes = new THREE.Group();
    var dishBase = new THREE.MeshPhongMaterial({ color: 0x7f8c8d });

    for (var i = 0; i < 2; i++) {
      var sphere = new THREE.Mesh(new THREE.SphereGeometry(3, 16, 16), dishBase);
      sphere.position.set(-15 + (i * 30), 12, 20);
      sphere.userData.rotSpeed = 0.5 + (i * 0.3);
      dishes.add(sphere);
      rotatingDishes.push(sphere);
    }
    return dishes;
  }

  function buildAirlocks() {
    var locks = new THREE.Group();
    var hatchMaterial = new THREE.MeshPhongMaterial({ color: 0xe74c3c });
    var frameMaterial = new THREE.MeshPhongMaterial({ color: 0x2c3e50 });

    for (var i = 0; i < 3; i++) {
      var hatch = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.5, 0.4, 16), hatchMaterial);
      hatch.position.set(-18 + (i * 18), -8, -20);
      locks.add(hatch);

      var frame = new THREE.Mesh(new THREE.BoxGeometry(3.5, 3.5, 0.3), frameMaterial);
      frame.position.copy(hatch.position);
      frame.position.z -= 0.5;
      locks.add(frame);
    }
    return locks;
  }

  function buildThrusterPods() {
    var thrusters = new THREE.Group();
    var thrusterMaterial = new THREE.MeshPhongMaterial({ color: 0x3498db });

    for (var i = 0; i < 4; i++) {
      var angle = (i / 4) * Math.PI * 2;
      var cone = new THREE.Mesh(new THREE.ConeGeometry(1.2, 3, 8), thrusterMaterial);
      cone.position.set(Math.cos(angle) * 22, Math.sin(angle) * 15, Math.sin(angle) * 20);
      cone.rotation.x = Math.PI / 4;
      cone.userData.flameScale = 0;
      thrusters.push(cone);
      thrusters.add(cone);
    }
    return thrusters;
  }

  function buildStarfield() {
    var stars = new THREE.Group();
    var starMaterial = new THREE.MeshPhongMaterial({ color: 0xffffff, emissive: 0xffffff });

    for (var i = 0; i < 40; i++) {
      var star = new THREE.Mesh(
        new THREE.SphereGeometry(0.3, 4, 4),
        starMaterial
      );
      var angle1 = Math.random() * Math.PI * 2;
      var angle2 = Math.random() * Math.PI * 2;
      var radius = 80 + Math.random() * 50;
      star.position.set(
        Math.cos(angle1) * Math.cos(angle2) * radius,
        Math.sin(angle1) * Math.cos(angle2) * radius,
        Math.sin(angle2) * radius
      );
      stars.add(star);
    }
    return stars;
  }

  function buildDebris() {
    var debris = new THREE.Group();
    var debrisMaterial = new THREE.MeshPhongMaterial({ color: 0x95a5a6 });

    for (var i = 0; i < 15; i++) {
      var box = new THREE.Mesh(
        new THREE.BoxGeometry(
          0.5 + Math.random() * 1.5,
          0.5 + Math.random() * 1.5,
          0.5 + Math.random() * 1.5
        ),
        debrisMaterial
      );
      box.position.set(
        (Math.random() - 0.5) * 60,
        (Math.random() - 0.5) * 40,
        (Math.random() - 0.5) * 50
      );
      box.rotation.set(
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI * 2
      );
      box.userData.vx = (Math.random() - 0.5) * 0.03;
      box.userData.vy = (Math.random() - 0.5) * 0.03;
      box.userData.vz = (Math.random() - 0.5) * 0.03;
      box.userData.rotx = (Math.random() - 0.5) * 0.02;
      box.userData.roty = (Math.random() - 0.5) * 0.02;
      box.userData.rotz = (Math.random() - 0.5) * 0.02;
      debrisObjects.push(box);
      debris.add(box);
    }
    return debris;
  }

  function buildTethers() {
    var tethers = new THREE.Group();
    var lineMaterial = new THREE.LineBasicMaterial({ color: 0x16a085, linewidth: 2 });

    for (var i = 0; i < 5; i++) {
      var points = [
        new THREE.Vector3(-20 + (i * 10), 10, -15),
        new THREE.Vector3(-18 + (i * 10), 2, -10)
      ];
      var geometry = new THREE.BufferGeometry().setFromPoints(points);
      var line = new THREE.LineSegments(geometry, lineMaterial);
      tethers.add(line);
    }
    return tethers;
  }

  function init(sceneParam, cameraParam) {
    scene = sceneParam;
    camera = cameraParam;
    envGroup = new THREE.Group();

    var lighting = new THREE.Group();
    var sunLight = new THREE.DirectionalLight(0xffffff, 1.2);
    sunLight.position.set(30, 20, 30);
    lighting.add(sunLight);

    var ambientLight = new THREE.AmbientLight(0x4488aa, 0.6);
    lighting.add(ambientLight);

    var pointLight = new THREE.PointLight(0xff6600, 0.8);
    pointLight.position.set(-20, 0, 15);
    lighting.add(pointLight);

    envGroup.add(lighting);
    envGroup.add(buildWalls());
    envGroup.add(buildHabitatTubes());
    envGroup.add(buildSolarPanels());
    envGroup.add(buildDishes());
    envGroup.add(buildAirlocks());
    envGroup.add(buildThrusterPods());
    envGroup.add(buildStarfield());
    envGroup.add(buildDebris());
    envGroup.add(buildTethers());

    scene.add(envGroup);
  }

  function update(delta) {
    var i = 0;

    for (i = 0; i < rotatingDishes.length; i++) {
      rotatingDishes[i].rotation.y += rotatingDishes[i].userData.rotSpeed * delta;
      rotatingDishes[i].rotation.z += rotatingDishes[i].userData.rotSpeed * delta * 0.3;
    }

    for (i = 0; i < debrisObjects.length; i++) {
      var obj = debrisObjects[i];
      obj.position.x += obj.userData.vx;
      obj.position.y += obj.userData.vy;
      obj.position.z += obj.userData.vz;
      obj.rotation.x += obj.userData.rotx;
      obj.rotation.y += obj.userData.roty;
      obj.rotation.z += obj.userData.rotz;

      if (Math.abs(obj.position.x) > 50 || Math.abs(obj.position.y) > 40 || Math.abs(obj.position.z) > 50) {
        obj.position.set(
          (Math.random() - 0.5) * 60,
          (Math.random() - 0.5) * 40,
          (Math.random() - 0.5) * 50
        );
      }
    }

    if (envGroup && envGroup.rotation) {
      envGroup.rotation.z += 0.0001 * delta;
    }
  }

  function reset() {
    if (scene && envGroup) {
      scene.remove(envGroup);
    }
    rotatingDishes = [];
    debrisObjects = [];
    thrusters = [];
    envGroup = null;
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
