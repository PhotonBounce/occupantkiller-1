window.KenmoreCamp = (function() {
  'use strict';

  var objects = [];
  var lights = [];

  function createScene(scene) {
    // Kenmore Inn - oldest in Scotland
    var innGeometry = new THREE.BoxGeometry(12, 10, 6);
    var innMaterial = new THREE.MeshLambertMaterial({ color: 0xFFFFEE });
    var inn = new THREE.Mesh(innGeometry, innMaterial);
    inn.position.set(0, 5, 0);
    scene.add(inn);
    objects.push(inn);

    // Roof cones for Kenmore Inn
    var roofGeometry = new THREE.ConeGeometry(8, 4, 32);
    var roofMaterial = new THREE.MeshLambertMaterial({ color: 0x555555 });
    var roof = new THREE.Mesh(roofGeometry, roofMaterial);
    roof.position.set(0, 12, 0);
    scene.add(roof);
    objects.push(roof);

    // Loch Tay shoreline dock
    var dockGeometry = new THREE.BoxGeometry(20, 1, 4);
    var dockMaterial = new THREE.MeshLambertMaterial({ color: 0x888877 });
    var dock = new THREE.Mesh(dockGeometry, dockMaterial);
    dock.position.set(-15, 0.5, 10);
    scene.add(dock);
    objects.push(dock);

    // Breadalbane estate walled garden - 4 walls
    var wallGeometry = new THREE.BoxGeometry(0.5, 3, 12);
    var wallMaterial = new THREE.MeshLambertMaterial({ color: 0x998877 });

    var wallNorth = new THREE.Mesh(wallGeometry, wallMaterial);
    wallNorth.position.set(0, 1.5, 8);
    scene.add(wallNorth);
    objects.push(wallNorth);

    var wallSouth = new THREE.Mesh(wallGeometry, wallMaterial);
    wallSouth.position.set(0, 1.5, -8);
    scene.add(wallSouth);
    objects.push(wallSouth);

    var wallEastGeometry = new THREE.BoxGeometry(12, 3, 0.5);
    var wallEast = new THREE.Mesh(wallEastGeometry, wallMaterial);
    wallEast.position.set(8, 1.5, 0);
    scene.add(wallEast);
    objects.push(wallEast);

    var wallWest = new THREE.Mesh(wallEastGeometry, wallMaterial);
    wallWest.position.set(-8, 1.5, 0);
    scene.add(wallWest);
    objects.push(wallWest);

    // Military supply pontoon
    var pontoonGeometry = new THREE.BoxGeometry(18, 0.5, 6);
    var pontoonMaterial = new THREE.MeshLambertMaterial({ color: 0x888888 });
    var pontoon = new THREE.Mesh(pontoonGeometry, pontoonMaterial);
    pontoon.position.set(-15, 1.2, 5);
    pontoon.userData.originalY = 1.2;
    scene.add(pontoon);
    objects.push(pontoon);

    // Pontoon bollards
    var bollardGeometry = new THREE.CylinderGeometry(0.4, 0.4, 1.2, 16);
    var bollardMaterial = new THREE.MeshLambertMaterial({ color: 0x666666 });

    var bollard1 = new THREE.Mesh(bollardGeometry, bollardMaterial);
    bollard1.position.set(-25, 1.8, 2);
    scene.add(bollard1);
    objects.push(bollard1);

    var bollard2 = new THREE.Mesh(bollardGeometry, bollardMaterial);
    bollard2.position.set(-25, 1.8, 8);
    scene.add(bollard2);
    objects.push(bollard2);

    var bollard3 = new THREE.Mesh(bollardGeometry, bollardMaterial);
    bollard3.position.set(-5, 1.8, 2);
    scene.add(bollard3);
    objects.push(bollard3);

    var bollard4 = new THREE.Mesh(bollardGeometry, bollardMaterial);
    bollard4.position.set(-5, 1.8, 8);
    scene.add(bollard4);
    objects.push(bollard4);

    // Field artillery park - 3 cannons
    var cannonBarrelGeometry = new THREE.CylinderGeometry(0.3, 0.3, 4, 16);
    var cannonFrameGeometry = new THREE.BoxGeometry(1.5, 1, 1.5);
    var cannonMaterial = new THREE.MeshLambertMaterial({ color: 0x444444 });

    for (var i = 0; i < 3; i++) {
      var frame = new THREE.Mesh(cannonFrameGeometry, cannonMaterial);
      frame.position.set(15 + i * 4, 0.5, 0);
      scene.add(frame);
      objects.push(frame);

      var barrel = new THREE.Mesh(cannonBarrelGeometry, cannonMaterial);
      barrel.rotation.z = Math.PI / 6;
      barrel.position.set(15 + i * 4, 1.5, 0);
      scene.add(barrel);
      objects.push(barrel);
    }

    // Robert Burns plaque wall
    var plaqueGeometry = new THREE.BoxGeometry(2, 3, 0.5);
    var plaqueMaterial = new THREE.MeshLambertMaterial({ color: 0x888877 });
    var plaque = new THREE.Mesh(plaqueGeometry, plaqueMaterial);
    plaque.position.set(20, 1.5, 0);
    scene.add(plaque);
    objects.push(plaque);

    // Marquee field hospital
    var marqueeGeometry = new THREE.BoxGeometry(16, 12, 5);
    var marqueeMaterial = new THREE.MeshLambertMaterial({ color: 0xFFFFFF });
    var marquee = new THREE.Mesh(marqueeGeometry, marqueeMaterial);
    marquee.position.set(-30, 6, -10);
    scene.add(marquee);
    objects.push(marquee);

    // Red cross on marquee
    var crossGeometry = new THREE.SphereGeometry(0.8, 16, 16);
    var crossMaterial = new THREE.MeshLambertMaterial({ color: 0xFF0000 });
    var cross = new THREE.Mesh(crossGeometry, crossMaterial);
    cross.position.set(-30, 13.5, -10);
    scene.add(cross);
    objects.push(cross);

    // Loch depth marker poles
    var markerGeometry = new THREE.CylinderGeometry(0.3, 0.3, 3, 12);
    var markerMaterial = new THREE.MeshLambertMaterial({ color: 0x777777 });

    for (var j = 0; j < 5; j++) {
      var marker = new THREE.Mesh(markerGeometry, markerMaterial);
      marker.position.set(-10 + j * 5, 1.5, 15);
      scene.add(marker);
      objects.push(marker);

      // Stripe boxes on markers
      var stripeGeometry = new THREE.BoxGeometry(0.8, 0.3, 0.8);
      var stripeMaterial = new THREE.MeshLambertMaterial({ color: 0xFF0000 });
      var stripe = new THREE.Mesh(stripeGeometry, stripeMaterial);
      stripe.position.set(-10 + j * 5, 2.2, 15);
      scene.add(stripe);
      objects.push(stripe);
    }

    // Evening ambient light - golden
    var ambientLight = new THREE.Light();
    ambientLight.type = 'ambient';
    ambientLight.color = new THREE.Color(0xFFBB66);
    ambientLight.intensity = 0.7;
    scene.add(ambientLight);
    lights.push(ambientLight);

    // Inn door lantern
    var doorLight = new THREE.Light();
    doorLight.type = 'point';
    doorLight.color = new THREE.Color(0xFFEE88);
    doorLight.intensity = 1.0;
    doorLight.position.set(5, 2, -3);
    scene.add(doorLight);
    lights.push(doorLight);

    // Inn sign lantern
    var signLight = new THREE.Light();
    signLight.type = 'point';
    signLight.color = new THREE.Color(0xFFEE88);
    signLight.intensity = 1.0;
    signLight.position.set(-5, 8, -3);
    scene.add(signLight);
    lights.push(signLight);
  }

  function update(delta, scene) {
    // Gently bob the supply pontoon
    for (var i = 0; i < objects.length; i++) {
      if (objects[i].userData && objects[i].userData.originalY !== undefined) {
        objects[i].position.y = objects[i].userData.originalY + Math.sin(Date.now() * 0.001) * 0.2;
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

  function getObjects() {
    return objects;
  }

  function getLights() {
    return lights;
  }

  return {
    createScene: createScene,
    update: update,
    reset: reset,
    getObjects: getObjects,
    getLights: getLights
  };
}());
