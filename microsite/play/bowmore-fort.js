window.BowmoreFort = (function() {
  'use strict';

  var objects = [];
  var lights = [];

  function addTower(scene) {
    var geometry = new THREE.CylinderGeometry(4, 4, 14, 32);
    var material = new THREE.MeshLambertMaterial({ color: 0x888888 });
    var tower = new THREE.Mesh(geometry, material);
    tower.position.set(0, 7, 0);
    scene.add(tower);
    objects.push(tower);

    var towerLight = new THREE.PointLight(0xFFCC44, 1.0, 50);
    towerLight.position.set(0, 10, 0);
    scene.add(towerLight);
    lights.push(towerLight);
  }

  function addWallRing(scene) {
    var ringRadius = 25;
    var segments = 16;
    var angleStep = (Math.PI * 2) / segments;

    for (var i = 0; i < segments; i++) {
      var angle = i * angleStep;
      var x = Math.cos(angle) * ringRadius;
      var z = Math.sin(angle) * ringRadius;

      var geometry = new THREE.BoxGeometry(1, 4, 8);
      var material = new THREE.MeshLambertMaterial({ color: 0x777777 });
      var panel = new THREE.Mesh(geometry, material);
      panel.position.set(x, 2, z);
      panel.rotation.y = angle;
      scene.add(panel);
      objects.push(panel);
    }
  }

  function addBastions(scene) {
    var positions = [
      { x: 30, z: 30 },
      { x: -30, z: 30 },
      { x: -30, z: -30 },
      { x: 30, z: -30 }
    ];

    for (var i = 0; i < positions.length; i++) {
      var pos = positions[i];
      var geometry = new THREE.BoxGeometry(4, 6, 4);
      var material = new THREE.MeshLambertMaterial({ color: 0x666666 });
      var bastion = new THREE.Mesh(geometry, material);
      bastion.position.set(pos.x, 3, pos.z);
      scene.add(bastion);
      objects.push(bastion);
    }
  }

  function addVillageHouses(scene) {
    var housePositions = [
      { x: -15, z: -20 },
      { x: -5, z: -22 },
      { x: 5, z: -20 },
      { x: 15, z: -22 },
      { x: 0, z: -30 },
      { x: 10, z: -28 }
    ];

    for (var i = 0; i < housePositions.length; i++) {
      var pos = housePositions[i];

      var wallGeometry = new THREE.BoxGeometry(4, 3, 4);
      var wallMaterial = new THREE.MeshLambertMaterial({ color: 0xEEEEEE });
      var house = new THREE.Mesh(wallGeometry, wallMaterial);
      house.position.set(pos.x, 1.5, pos.z);
      scene.add(house);
      objects.push(house);

      var roofGeometry = new THREE.ConeGeometry(3, 2, 4);
      var roofMaterial = new THREE.MeshLambertMaterial({ color: 0x888888 });
      var roof = new THREE.Mesh(roofGeometry, roofMaterial);
      roof.position.set(pos.x, 4, pos.z);
      scene.add(roof);
      objects.push(roof);
    }
  }

  function addAmmoDepot(scene) {
    var geometry = new THREE.BoxGeometry(6, 4, 6);
    var material = new THREE.MeshLambertMaterial({ color: 0x4a5240 });
    var depot = new THREE.Mesh(geometry, material);
    depot.position.set(35, 2, 0);
    scene.add(depot);
    objects.push(depot);
  }

  function addAAGun(scene) {
    var baseGeometry = new THREE.CylinderGeometry(3, 3, 1, 16);
    var baseMaterial = new THREE.MeshLambertMaterial({ color: 0x444444 });
    var base = new THREE.Mesh(baseGeometry, baseMaterial);
    base.position.set(-35, 0.5, 0);
    scene.add(base);
    objects.push(base);

    var barrelGeometry = new THREE.BoxGeometry(1, 1, 8);
    var barrelMaterial = new THREE.MeshLambertMaterial({ color: 0x444444 });
    var barrel = new THREE.Mesh(barrelGeometry, barrelMaterial);
    barrel.position.set(-35, 1.5, 0);
    barrel.rotation.z = Math.PI / 6;
    barrel.userData.isRotating = true;
    scene.add(barrel);
    objects.push(barrel);
  }

  function addSandbagWalls(scene) {
    var sbPositions = [
      { x: 20, z: 20 },
      { x: -20, z: 20 },
      { x: -20, z: -20 },
      { x: 20, z: -20 },
      { x: 0, z: 35 },
      { x: 0, z: -35 }
    ];

    for (var i = 0; i < sbPositions.length; i++) {
      var pos = sbPositions[i];
      var geometry = new THREE.BoxGeometry(2, 1, 6);
      var material = new THREE.MeshLambertMaterial({ color: 0xC2A06E });
      var wall = new THREE.Mesh(geometry, material);
      wall.position.set(pos.x, 0.5, pos.z);
      scene.add(wall);
      objects.push(wall);
    }
  }

  function addPerimeterLights(scene) {
    var lightPositions = [
      { x: 40, z: 40 },
      { x: -40, z: 40 },
      { x: -40, z: -40 },
      { x: 40, z: -40 }
    ];

    for (var i = 0; i < lightPositions.length; i++) {
      var pos = lightPositions[i];
      var light = new THREE.PointLight(0xCCDDFF, 0.5, 80);
      light.position.set(pos.x, 15, pos.z);
      scene.add(light);
      lights.push(light);
    }
  }

  function create(scene) {
    addTower(scene);
    addWallRing(scene);
    addBastions(scene);
    addVillageHouses(scene);
    addAmmoDepot(scene);
    addAAGun(scene);
    addSandbagWalls(scene);
    addPerimeterLights(scene);
  }

  function update(delta) {
    for (var i = 0; i < objects.length; i++) {
      var obj = objects[i];
      if (obj.userData.isRotating) {
        obj.rotation.z += delta * 0.5;
      }
    }
  }

  function reset(scene) {
    for (var i = 0; i < objects.length; i++) {
      scene.remove(objects[i]);
    }
    for (var j = 0; j < lights.length; j++) {
      scene.remove(lights[j]);
    }
    objects = [];
    lights = [];
  }

  return {
    create: create,
    update: update,
    reset: reset,
    objects: objects,
    lights: lights
  };
}());
