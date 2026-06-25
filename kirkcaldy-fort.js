window.KirkcaldyFort = (function() {
  'use strict';

  var objects = [];
  var lights = [];
  var ribTime = 0;
  var ribMesh = null;

  function create(scene) {
    objects = [];
    lights = [];

    // Kirkcaldy Esplanade seawall (50x4x2 stone wall)
    var seawallGeometry = new THREE.BoxGeometry(50, 4, 2);
    var stoneGrey = new THREE.MeshLambertMaterial({ color: 0x888877 });
    var seawallMesh = new THREE.Mesh(seawallGeometry, stoneGrey);
    seawallMesh.position.set(0, 2, -30);
    scene.add(seawallMesh);
    objects.push(seawallMesh);

    // Ravenscraig Castle towers (2x cylinder towers)
    var towerGeometry = new THREE.CylinderGeometry(4, 4, 12, 16);
    var stoneBrown = new THREE.MeshLambertMaterial({ color: 0x998877 });

    var tower1Mesh = new THREE.Mesh(towerGeometry, stoneBrown);
    tower1Mesh.position.set(-15, 6, 0);
    scene.add(tower1Mesh);
    objects.push(tower1Mesh);

    var tower2Mesh = new THREE.Mesh(towerGeometry, stoneBrown);
    tower2Mesh.position.set(15, 6, 0);
    scene.add(tower2Mesh);
    objects.push(tower2Mesh);

    // Castle wall connecting towers
    var castleWallGeometry = new THREE.BoxGeometry(30, 8, 2);
    var castleWallMesh = new THREE.Mesh(castleWallGeometry, stoneBrown);
    castleWallMesh.position.set(0, 4, 2);
    scene.add(castleWallMesh);
    objects.push(castleWallMesh);

    // Adam Smith memorial (stone slab on plinth)
    var plinthGeometry = new THREE.BoxGeometry(2, 2, 2);
    var plinthMesh = new THREE.Mesh(plinthGeometry, stoneBrown);
    plinthMesh.position.set(-35, 1, 15);
    scene.add(plinthMesh);
    objects.push(plinthMesh);

    var slabGeometry = new THREE.BoxGeometry(2, 5, 0.5);
    var slabMesh = new THREE.Mesh(slabGeometry, stoneGrey);
    slabMesh.position.set(-35, 4, 15);
    scene.add(slabMesh);
    objects.push(slabMesh);

    // Linoleum factory ruin
    var factoryGeometry = new THREE.BoxGeometry(20, 14, 6);
    var brickRed = new THREE.MeshLambertMaterial({ color: 0x8B3A3A });
    var factoryMesh = new THREE.Mesh(factoryGeometry, brickRed);
    factoryMesh.position.set(30, 7, 10);
    scene.add(factoryMesh);
    objects.push(factoryMesh);

    // Beveridge Park fortified bandstand
    var bandstandGeometry = new THREE.CylinderGeometry(5, 5, 3, 16);
    var whiteMat = new THREE.MeshLambertMaterial({ color: 0xFFFFFF });
    var bandstandMesh = new THREE.Mesh(bandstandGeometry, whiteMat);
    bandstandMesh.position.set(-25, 1.5, 25);
    scene.add(bandstandMesh);
    objects.push(bandstandMesh);

    // Dome sphere on bandstand
    var domeGeometry = new THREE.SphereGeometry(5, 16, 12);
    var domeMesh = new THREE.Mesh(domeGeometry, whiteMat);
    domeMesh.position.set(-25, 6.5, 25);
    scene.add(domeMesh);
    objects.push(domeMesh);

    // RNLI Lifeboat station
    var lifebootGeometry = new THREE.BoxGeometry(8, 6, 5);
    var orangeMat = new THREE.MeshLambertMaterial({ color: 0xFF8800 });
    var lifebootMesh = new THREE.Mesh(lifebootGeometry, orangeMat);
    lifebootMesh.position.set(40, 3, -20);
    scene.add(lifebootMesh);
    objects.push(lifebootMesh);

    // Coastal patrol RIB (fast boat)
    var ribGeometry = new THREE.BoxGeometry(6, 1.5, 2.5);
    ribMesh = new THREE.Mesh(ribGeometry, orangeMat);
    ribMesh.position.set(45, 1, -25);
    scene.add(ribMesh);
    objects.push(ribMesh);

    // Castle floodlights at tower bases
    var light1 = new THREE.PointLight(0xFFEE88, 1.0, 50);
    light1.position.set(-15, 12, 0);
    scene.add(light1);
    lights.push(light1);

    var light2 = new THREE.PointLight(0xFFEE88, 1.0, 50);
    light2.position.set(15, 12, 0);
    scene.add(light2);
    lights.push(light2);

    // Firth mist ambient
    var ambientLight = new THREE.AmbientLight(0x889AAA, 0.6);
    scene.add(ambientLight);
    lights.push(ambientLight);
  }

  function update(delta) {
    if (ribMesh) {
      ribTime += delta;
      ribMesh.position.y = 1 + Math.sin(ribTime * 2) * 0.3;
    }
  }

  function reset(scene) {
    var i;
    for (i = 0; i < objects.length; i++) {
      scene.remove(objects[i]);
    }
    for (i = 0; i < lights.length; i++) {
      scene.remove(lights[i]);
    }
    objects = [];
    lights = [];
    ribMesh = null;
  }

  var api = {
    create: create,
    update: update,
    reset: reset,
    objects: objects,
    lights: lights
  };

  return api;
}());
