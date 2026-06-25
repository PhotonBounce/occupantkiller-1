window.LargoFort = (function() {
  'use strict';

  var objects = [];
  var lights = [];

  function createSelkirkStatue(scene) {
    var bronzeColor = 0x8B6914;
    var stonePlinthColor = 0x776655;

    // Plinth
    var plinthGeometry = new THREE.BoxGeometry(2, 4, 2);
    var plinthMaterial = new THREE.MeshLambertMaterial({ color: stonePlinthColor });
    var plinth = new THREE.Mesh(plinthGeometry, plinthMaterial);
    plinth.position.set(0, 2, 0);
    scene.add(plinth);
    objects.push(plinth);

    // Statue on plinth
    var statueGeometry = new THREE.BoxGeometry(1, 3, 1);
    var statueMaterial = new THREE.MeshLambertMaterial({ color: bronzeColor });
    var statue = new THREE.Mesh(statueGeometry, statueMaterial);
    statue.position.set(0, 6.5, 0);
    scene.add(statue);
    objects.push(statue);
  }

  function createLargoTower(scene) {
    var stoneColor = 0x776655;
    var ivyColor = 0x334433;

    // Main tower structure
    var towerGeometry = new THREE.BoxGeometry(6, 14, 6);
    var towerMaterial = new THREE.MeshLambertMaterial({ color: stoneColor });
    var tower = new THREE.Mesh(towerGeometry, towerMaterial);
    tower.position.set(-20, 7, -15);
    scene.add(tower);
    objects.push(tower);

    // Ivy patch suggestion (dark green box)
    var ivyGeometry = new THREE.BoxGeometry(3, 5, 0.3);
    var ivyMaterial = new THREE.MeshLambertMaterial({ color: ivyColor });
    var ivy = new THREE.Mesh(ivyGeometry, ivyMaterial);
    ivy.position.set(-20, 8, -11.5);
    scene.add(ivy);
    objects.push(ivy);
  }

  function createLargoLawHill(scene) {
    var earthColor = 0x665544;

    var hillGeometry = new THREE.BoxGeometry(12, 2, 12);
    var hillMaterial = new THREE.MeshLambertMaterial({ color: earthColor });
    var hill = new THREE.Mesh(hillGeometry, hillMaterial);
    hill.position.set(15, 1, 10);
    scene.add(hill);
    objects.push(hill);
  }

  function createShipwreck(scene) {
    var hullColor = 0x887766;

    var hullGeometry = new THREE.BoxGeometry(12, 3, 5);
    var hullMaterial = new THREE.MeshLambertMaterial({ color: hullColor });
    var hull = new THREE.Mesh(hullGeometry, hullMaterial);
    hull.position.set(-30, 0.5, 5);
    hull.rotation.z = 0.3;
    hull.userData.isWreck = true;
    scene.add(hull);
    objects.push(hull);
  }

  function createAnchorDisplay(scene) {
    var rustColor = 0x8B4513;

    // Crossed box shapes for anchor
    var anchorGeometry1 = new THREE.BoxGeometry(1, 4, 0.3);
    var anchorMaterial = new THREE.MeshLambertMaterial({ color: rustColor });
    var anchor1 = new THREE.Mesh(anchorGeometry1, anchorMaterial);
    anchor1.position.set(25, 2, -20);
    scene.add(anchor1);
    objects.push(anchor1);

    var anchorGeometry2 = new THREE.BoxGeometry(0.3, 4, 1);
    var anchor2 = new THREE.Mesh(anchorGeometry2, anchorMaterial);
    anchor2.position.set(25, 2, -20);
    scene.add(anchor2);
    objects.push(anchor2);

    var anchorGeometry3 = new THREE.BoxGeometry(1, 0.3, 1);
    var anchor3 = new THREE.Mesh(anchorGeometry3, anchorMaterial);
    anchor3.position.set(25, 4, -20);
    scene.add(anchor3);
    objects.push(anchor3);
  }

  function createCoastalLookout(scene) {
    var greyColor = 0x778877;
    var rockColor = 0x888888;

    // Rocky outcrop base
    var rockGeometry = new THREE.BoxGeometry(5, 3, 5);
    var rockMaterial = new THREE.MeshLambertMaterial({ color: rockColor });
    var rock = new THREE.Mesh(rockGeometry, rockMaterial);
    rock.position.set(35, 1.5, 0);
    scene.add(rock);
    objects.push(rock);

    // Lookout post on rock
    var postGeometry = new THREE.BoxGeometry(4, 6, 4);
    var postMaterial = new THREE.MeshLambertMaterial({ color: greyColor });
    var post = new THREE.Mesh(postGeometry, postMaterial);
    post.position.set(35, 6, 0);
    scene.add(post);
    objects.push(post);
  }

  function createBeachLanding(scene) {
    var sandColor = 0xCCBB88;

    var beachGeometry = new THREE.BoxGeometry(30, 0.3, 12);
    var beachMaterial = new THREE.MeshLambertMaterial({ color: sandColor });
    var beach = new THREE.Mesh(beachGeometry, beachMaterial);
    beach.position.set(0, 0.15, 20);
    scene.add(beach);
    objects.push(beach);
  }

  function createBeachObstacles(scene) {
    var concreteColor = 0x888888;

    for (var i = 0; i < 6; i++) {
      var obstacleGeometry = new THREE.ConeGeometry(0.8, 2, 8);
      var obstacleMaterial = new THREE.MeshLambertMaterial({ color: concreteColor });
      var obstacle = new THREE.Mesh(obstacleGeometry, obstacleMaterial);
      obstacle.position.set(-12 + i * 4, 1, 22);
      scene.add(obstacle);
      objects.push(obstacle);
    }
  }

  function createLighting(scene) {
    // Fife coastal golden ambient
    var ambientLight = new THREE.AmbientLight(0xFFCC88, 0.7);
    scene.add(ambientLight);
    lights.push(ambientLight);

    // Lookout post light
    var spotLight = new THREE.PointLight(0xFFFFFF, 1.0);
    spotLight.position.set(35, 10, 0);
    scene.add(spotLight);
    lights.push(spotLight);
  }

  function update(delta) {
    for (var i = 0; i < objects.length; i++) {
      if (objects[i].userData.isWreck) {
        objects[i].position.y = 0.5 + Math.sin(Date.now() * 0.001) * 0.1;
      }
    }
  }

  function reset(scene) {
    for (var i = objects.length - 1; i >= 0; i--) {
      scene.remove(objects[i]);
    }
    objects = [];

    for (var j = lights.length - 1; j >= 0; j--) {
      scene.remove(lights[j]);
    }
    lights = [];
  }

  function initialize(scene) {
    createSelkirkStatue(scene);
    createLargoTower(scene);
    createLargoLawHill(scene);
    createShipwreck(scene);
    createAnchorDisplay(scene);
    createCoastalLookout(scene);
    createBeachLanding(scene);
    createBeachObstacles(scene);
    createLighting(scene);
  }

  return {
    initialize: initialize,
    update: update,
    reset: reset,
    objects: objects,
    lights: lights
  };
}());
