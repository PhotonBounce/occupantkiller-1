window.LismoreFort = (function() {
  'use strict';

  var objects = [];
  var lights = [];
  var hearth = null;

  function createKeep() {
    var geometry = new THREE.BoxGeometry(10, 10, 14);
    var material = new THREE.MeshLambertMaterial({ color: 0x777766 });
    var keep = new THREE.Mesh(geometry, material);
    keep.position.set(0, 5, 0);
    objects.push(keep);
    return keep;
  }

  function createBattlements(keep) {
    var battlementHeight = 2;
    var battlementWidth = 2;
    var battlementDepth = 2;
    var crenellationCount = 8;
    var keepWidth = 10;
    var keepDepth = 14;

    for (var i = 0; i < crenellationCount; i++) {
      var xPos = -keepWidth / 2 + (i + 1) * keepWidth / (crenellationCount + 1);
      var geometry = new THREE.BoxGeometry(battlementWidth, battlementHeight, battlementDepth);
      var material = new THREE.MeshLambertMaterial({ color: 0x777766 });
      var battlement = new THREE.Mesh(geometry, material);
      battlement.position.set(xPos, 11, -keepDepth / 2);
      objects.push(battlement);
    }

    for (var i = 0; i < crenellationCount; i++) {
      var xPos = -keepWidth / 2 + (i + 1) * keepWidth / (crenellationCount + 1);
      var geometry = new THREE.BoxGeometry(battlementWidth, battlementHeight, battlementDepth);
      var material = new THREE.MeshLambertMaterial({ color: 0x777766 });
      var battlement = new THREE.Mesh(geometry, material);
      battlement.position.set(xPos, 11, keepDepth / 2);
      objects.push(battlement);
    }

    for (var i = 0; i < crenellationCount; i++) {
      var zPos = -keepDepth / 2 + (i + 1) * keepDepth / (crenellationCount + 1);
      var geometry = new THREE.BoxGeometry(battlementDepth, battlementHeight, battlementWidth);
      var material = new THREE.MeshLambertMaterial({ color: 0x777766 });
      var battlement = new THREE.Mesh(geometry, material);
      battlement.position.set(-keepWidth / 2, 11, zPos);
      objects.push(battlement);
    }

    for (var i = 0; i < crenellationCount; i++) {
      var zPos = -keepDepth / 2 + (i + 1) * keepDepth / (crenellationCount + 1);
      var geometry = new THREE.BoxGeometry(battlementDepth, battlementHeight, battlementWidth);
      var material = new THREE.MeshLambertMaterial({ color: 0x777766 });
      var battlement = new THREE.Mesh(geometry, material);
      battlement.position.set(keepWidth / 2, 11, zPos);
      objects.push(battlement);
    }
  }

  function createRoundTowers() {
    var towerRadius = 3;
    var towerHeight = 10;
    var keepWidth = 10;
    var keepDepth = 14;

    var geometry1 = new THREE.CylinderGeometry(towerRadius, towerRadius, towerHeight, 16);
    var material1 = new THREE.MeshLambertMaterial({ color: 0x888877 });
    var tower1 = new THREE.Mesh(geometry1, material1);
    tower1.position.set(-keepWidth / 2 - towerRadius, towerHeight / 2, -keepDepth / 2 - towerRadius);
    objects.push(tower1);

    var geometry2 = new THREE.CylinderGeometry(towerRadius, towerRadius, towerHeight, 16);
    var material2 = new THREE.MeshLambertMaterial({ color: 0x888877 });
    var tower2 = new THREE.Mesh(geometry2, material2);
    tower2.position.set(keepWidth / 2 + towerRadius, towerHeight / 2, keepDepth / 2 + towerRadius);
    objects.push(tower2);
  }

  function createBaileyWall() {
    var wallHeight = 6;
    var wallThickness = 1;
    var baileyLength = 50;

    var wallLength = 18;

    var geometry1 = new THREE.BoxGeometry(wallLength, wallHeight, wallThickness);
    var material = new THREE.MeshLambertMaterial({ color: 0x888877 });
    var wall1 = new THREE.Mesh(geometry1, material);
    wall1.position.set(0, wallHeight / 2, -baileyLength / 2);
    objects.push(wall1);

    var geometry2 = new THREE.BoxGeometry(wallLength, wallHeight, wallThickness);
    var wall2 = new THREE.Mesh(geometry2, material);
    wall2.position.set(0, wallHeight / 2, baileyLength / 2);
    objects.push(wall2);

    var geometry3 = new THREE.BoxGeometry(wallThickness, wallHeight, wallLength);
    var wall3 = new THREE.Mesh(geometry3, material);
    wall3.position.set(-20, wallHeight / 2, 0);
    objects.push(wall3);

    var geometry4 = new THREE.BoxGeometry(wallThickness, wallHeight, wallLength);
    var wall4 = new THREE.Mesh(geometry4, material);
    wall4.position.set(20, wallHeight / 2, 0);
    objects.push(wall4);
  }

  function createLonghouse() {
    var geometry = new THREE.BoxGeometry(16, 4, 7);
    var material = new THREE.MeshLambertMaterial({ color: 0x8B5E3C });
    var longhouse = new THREE.Mesh(geometry, material);
    longhouse.position.set(-10, 2, 8);
    objects.push(longhouse);

    var roofGeometry = new THREE.BoxGeometry(18, 2, 9);
    var roofMaterial = new THREE.MeshLambertMaterial({ color: 0x8B5E3C });
    var roof = new THREE.Mesh(roofGeometry, roofMaterial);
    roof.position.set(-10, 6, 8);
    objects.push(roof);
  }

  function createWell() {
    var wellRadius = 1.5;
    var wellHeight = 2;

    var geometry = new THREE.CylinderGeometry(wellRadius, wellRadius, wellHeight, 16);
    var material = new THREE.MeshLambertMaterial({ color: 0x777766 });
    var well = new THREE.Mesh(geometry, material);
    well.position.set(15, wellHeight / 2, 0);
    objects.push(well);

    var beamGeometry = new THREE.BoxGeometry(4, 0.3, 0.3);
    var beamMaterial = new THREE.MeshLambertMaterial({ color: 0x8B5E3C });
    var beam = new THREE.Mesh(beamGeometry, beamMaterial);
    beam.position.set(15, wellHeight + 0.5, 0);
    objects.push(beam);
  }

  function createRunestone() {
    var geometry = new THREE.BoxGeometry(1, 5, 0.3);
    var material = new THREE.MeshLambertMaterial({ color: 0x556655 });
    var runestone = new THREE.Mesh(geometry, material);
    runestone.position.set(-8, 2.5, -15);
    objects.push(runestone);
  }

  function createCattleEnclosure() {
    var enclosureWidth = 12;
    var enclosureLength = 16;
    var wallHeight = 0.5;
    var wallThickness = 1;

    var geometry1 = new THREE.BoxGeometry(enclosureLength, wallHeight, wallThickness);
    var material = new THREE.MeshLambertMaterial({ color: 0x8B6914 });
    var wall1 = new THREE.Mesh(geometry1, material);
    wall1.position.set(12, wallHeight / 2, -12);
    objects.push(wall1);

    var geometry2 = new THREE.BoxGeometry(enclosureLength, wallHeight, wallThickness);
    var wall2 = new THREE.Mesh(geometry2, material);
    wall2.position.set(12, wallHeight / 2, 12);
    objects.push(wall2);

    var geometry3 = new THREE.BoxGeometry(wallThickness, wallHeight, enclosureLength);
    var wall3 = new THREE.Mesh(geometry3, material);
    wall3.position.set(6, wallHeight / 2, 0);
    objects.push(wall3);

    var geometry4 = new THREE.BoxGeometry(wallThickness, wallHeight, enclosureLength);
    var wall4 = new THREE.Mesh(geometry4, material);
    wall4.position.set(18, wallHeight / 2, 0);
    objects.push(wall4);
  }

  function createFerryQuay() {
    var geometry = new THREE.BoxGeometry(18, 1, 4);
    var material = new THREE.MeshLambertMaterial({ color: 0x888888 });
    var quay = new THREE.Mesh(geometry, material);
    quay.position.set(0, 0.5, 20);
    objects.push(quay);
  }

  function createHearth() {
    var geometry = new THREE.SphereGeometry(0.4, 16, 16);
    var material = new THREE.MeshLambertMaterial({ color: 0xFF5500 });
    hearth = new THREE.Mesh(geometry, material);
    hearth.position.set(-10, 3, 8);
    objects.push(hearth);

    var light = new THREE.PointLight(0xFF5500, 1.0);
    light.position.set(-10, 3, 8);
    lights.push(light);
  }

  function createLighting() {
    var ambientLight = new THREE.AmbientLight(0xCCBBAA, 0.7);
    lights.push(ambientLight);
  }

  function init(scene) {
    createKeep();
    createBattlements();
    createRoundTowers();
    createBaileyWall();
    createLonghouse();
    createWell();
    createRunestone();
    createCattleEnclosure();
    createFerryQuay();
    createHearth();
    createLighting();

    for (var i = 0; i < objects.length; i++) {
      scene.add(objects[i]);
    }

    for (var i = 0; i < lights.length; i++) {
      scene.add(lights[i]);
    }
  }

  function update(delta) {
    if (hearth && lights.length > 0) {
      var hearthLight = lights[lights.length - 1];
      hearthLight.intensity = 1.0 + 0.3 * Math.sin(Date.now() * 0.005);
    }
  }

  function reset(scene) {
    for (var i = 0; i < objects.length; i++) {
      scene.remove(objects[i]);
    }
    for (var i = 0; i < lights.length; i++) {
      scene.remove(lights[i]);
    }
    objects = [];
    lights = [];
    hearth = null;
  }

  return {
    init: init,
    update: update,
    reset: reset,
    objects: objects,
    lights: lights
  };
}());
