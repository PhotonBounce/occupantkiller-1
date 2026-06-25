window.KerreraCamp = (function() {
  'use strict';

  var objects = [];
  var lights = [];
  var campfireLights = [];

  var module = {};

  function createTowerRuin() {
    var geometry = new THREE.BoxGeometry(8, 20, 8);
    var material = new THREE.MeshLambertMaterial({ color: 0x666655 });
    var tower = new THREE.Mesh(geometry, material);
    tower.position.set(0, 10, 0);
    tower.castShadow = true;
    tower.receiveShadow = true;
    objects.push(tower);
    return tower;
  }

  function createWallFragments() {
    var positions = [
      { x: -12, y: 4, z: 0, rotZ: 0 },
      { x: 12, y: 4, z: 5, rotZ: Math.PI / 6 },
      { x: 0, y: 4, z: -15, rotZ: Math.PI / 3 }
    ];

    positions.forEach(function(pos) {
      var geometry = new THREE.BoxGeometry(1, 8, 10);
      var material = new THREE.MeshLambertMaterial({ color: 0x777766 });
      var wall = new THREE.Mesh(geometry, material);
      wall.position.set(pos.x, pos.y, pos.z);
      wall.rotation.z = pos.rotZ;
      wall.castShadow = true;
      wall.receiveShadow = true;
      objects.push(wall);
    });
  }

  function createSpiralStairOutline() {
    var geometry = new THREE.CylinderGeometry(2, 2, 20, 16, 4, true);
    var material = new THREE.MeshLambertMaterial({ color: 0x444444, side: THREE.DoubleSide });
    var stair = new THREE.Mesh(geometry, material);
    stair.position.set(0, 10, 0);
    stair.castShadow = true;
    stair.receiveShadow = true;
    objects.push(stair);

    var platformCount = 5;
    for (var i = 0; i < platformCount; i++) {
      var platformGeo = new THREE.BoxGeometry(3, 0.3, 3);
      var platformMat = new THREE.MeshLambertMaterial({ color: 0x555544 });
      var platform = new THREE.Mesh(platformGeo, platformMat);
      platform.position.set(0, 4 + (i * 4), 0);
      platform.castShadow = true;
      platform.receiveShadow = true;
      objects.push(platform);
    }
  }

  function createTents() {
    var positions = [
      { x: -20, z: -15 },
      { x: -20, z: 0 },
      { x: -20, z: 15 },
      { x: 20, z: -15 },
      { x: 20, z: 0 },
      { x: 20, z: 15 }
    ];

    positions.forEach(function(pos) {
      var geometry = new THREE.BoxGeometry(3, 2, 3);
      var material = new THREE.MeshLambertMaterial({ color: 0x6B7355 });
      var tent = new THREE.Mesh(geometry, material);
      tent.position.set(pos.x, 1, pos.z);
      tent.castShadow = true;
      tent.receiveShadow = true;
      objects.push(tent);
    });
  }

  function createFieldKitchen() {
    var kitchenGeo = new THREE.BoxGeometry(8, 3, 6);
    var kitchenMat = new THREE.MeshLambertMaterial({ color: 0x5C3A1E });
    var kitchen = new THREE.Mesh(kitchenGeo, kitchenMat);
    kitchen.position.set(-35, 1.5, 0);
    kitchen.castShadow = true;
    kitchen.receiveShadow = true;
    objects.push(kitchen);

    var chimneyGeo = new THREE.CylinderGeometry(0.6, 0.6, 4, 8);
    var chimneyMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
    var chimney = new THREE.Mesh(chimneyGeo, chimneyMat);
    chimney.position.set(-35, 5, 0);
    chimney.castShadow = true;
    chimney.receiveShadow = true;
    objects.push(chimney);
  }

  function createObservationOP() {
    var parapeGeo = new THREE.BoxGeometry(2, 2, 2);
    var parapeMat = new THREE.MeshLambertMaterial({ color: 0xC2A06E });
    var parapet = new THREE.Mesh(parapeGeo, parapeMat);
    parapet.position.set(0, 22, 0);
    parapet.castShadow = true;
    parapet.receiveShadow = true;
    objects.push(parapet);

    var corners = [
      { x: 1.5, z: 1.5 },
      { x: -1.5, z: 1.5 },
      { x: 1.5, z: -1.5 },
      { x: -1.5, z: -1.5 }
    ];

    corners.forEach(function(corner) {
      var sandbagGeo = new THREE.BoxGeometry(0.6, 0.8, 0.6);
      var sandbagMat = new THREE.MeshLambertMaterial({ color: 0xC2A06E });
      var sandbag = new THREE.Mesh(sandbagGeo, sandbagMat);
      sandbag.position.set(corner.x, 22.8, corner.z);
      sandbag.castShadow = true;
      sandbag.receiveShadow = true;
      objects.push(sandbag);
    });
  }

  function createRangefinder() {
    var baseGeo = new THREE.BoxGeometry(1.5, 0.8, 1.5);
    var baseMat = new THREE.MeshLambertMaterial({ color: 0x444444 });
    var base = new THREE.Mesh(baseGeo, baseMat);
    base.position.set(0, 23, 3);
    base.castShadow = true;
    base.receiveShadow = true;
    objects.push(base);

    var scopeGeo = new THREE.CylinderGeometry(0.3, 0.3, 1.2, 8);
    var scopeMat = new THREE.MeshLambertMaterial({ color: 0x222222 });
    var scope = new THREE.Mesh(scopeGeo, scopeMat);
    scope.position.set(0, 23.8, 3);
    scope.rotation.z = Math.PI / 2;
    scope.castShadow = true;
    scope.receiveShadow = true;
    objects.push(scope);
  }

  function createMooringRing() {
    var postGeo = new THREE.CylinderGeometry(0.5, 0.5, 3, 8);
    var postMat = new THREE.MeshLambertMaterial({ color: 0x555555 });
    var post = new THREE.Mesh(postGeo, postMat);
    post.position.set(30, 1.5, -25);
    post.castShadow = true;
    post.receiveShadow = true;
    objects.push(post);
  }

  function createCampfires() {
    var positions = [
      { x: -25, z: 10 },
      { x: 25, z: 10 }
    ];

    positions.forEach(function(pos) {
      var fireGeo = new THREE.SphereGeometry(0.3, 8, 8);
      var fireMat = new THREE.MeshLambertMaterial({ color: 0xFF4400 });
      var fire = new THREE.Mesh(fireGeo, fireMat);
      fire.position.set(pos.x, 0.5, pos.z);
      fire.castShadow = true;
      fire.receiveShadow = true;
      objects.push(fire);

      var fireLight = new THREE.PointLight(0xFF4400, 1.5, 30);
      fireLight.position.set(pos.x, 1, pos.z);
      fireLight.castShadow = true;
      campfireLights.push(fireLight);
      lights.push(fireLight);
    });
  }

  function setupLighting() {
    var ambientLight = new THREE.AmbientLight(0xFFAA66, 0.6);
    lights.push(ambientLight);

    var directionalLight = new THREE.DirectionalLight(0xFFFFFF, 0.5);
    directionalLight.position.set(50, 50, 50);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    lights.push(directionalLight);
  }

  module.initialize = function(scene) {
    createTowerRuin();
    createWallFragments();
    createSpiralStairOutline();
    createTents();
    createFieldKitchen();
    createObservationOP();
    createRangefinder();
    createMooringRing();
    createCampfires();
    setupLighting();

    objects.forEach(function(obj) {
      scene.add(obj);
    });

    lights.forEach(function(light) {
      scene.add(light);
    });
  };

  module.update = function(delta) {
    campfireLights.forEach(function(light) {
      var flicker = 0.8 + Math.sin(Date.now() * 0.01) * 0.2;
      light.intensity = 1.5 * flicker;
    });
  };

  module.reset = function(scene) {
    objects.forEach(function(obj) {
      scene.remove(obj);
      if (obj.geometry) {
        obj.geometry.dispose();
      }
      if (obj.material) {
        obj.material.dispose();
      }
    });

    lights.forEach(function(light) {
      scene.remove(light);
    });

    objects = [];
    lights = [];
    campfireLights = [];
  };

  module.getObjects = function() {
    return objects;
  };

  module.getLights = function() {
    return lights;
  };

  return module;
}());
