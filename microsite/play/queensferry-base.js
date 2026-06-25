window.QueensferryBase = (function() {
  'use strict';

  var objects = [];
  var lights = [];
  var railLights = [];
  var lightStrobeTime = 0;

  var Base = {};

  Base.create = function(scene) {
    objects = [];
    lights = [];
    railLights = [];

    var railBridgeRed = 0xCC3322;
    var railDeckDark = 0x882211;
    var greyConc = 0x888888;
    var whiteModern = 0xEEEEEE;
    var stoneOld = 0x888877;
    var greenModern = 0x778877;
    var gothicStone = 0x998877;
    var oliveGreen = 0x4a5240;
    var estuary = 0x8899CC;
    var redLight = 0xFF2200;

    // Forth Rail Bridge - three massive diamond towers
    var railTower1Pos = [-40, 0, -20];
    var railTower2Pos = [0, 0, -20];
    var railTower3Pos = [40, 0, -20];

    createRailTower(scene, railTower1Pos, railBridgeRed);
    createRailTower(scene, railTower2Pos, railBridgeRed);
    createRailTower(scene, railTower3Pos, railBridgeRed);

    // Rail deck connecting towers
    var deckGeom = new THREE.BoxGeometry(120, 2, 6);
    var deckMat = new THREE.MeshLambertMaterial({ color: railDeckDark });
    var deck = new THREE.Mesh(deckGeom, deckMat);
    deck.position.set(0, 5, -20);
    scene.add(deck);
    objects.push(deck);

    // Forth Road Bridge - two towers with cables
    var roadTower1 = createRoadTower(scene, [-30, 0, 15], greyConc);
    var roadTower2 = createRoadTower(scene, [30, 0, 15], greyConc);

    createCableLines(scene, roadTower1.position, roadTower2.position);

    // Queensferry Crossing - modern white tower
    var crossingTowerGeom = new THREE.BoxGeometry(4, 32, 4);
    var crossingMat = new THREE.MeshLambertMaterial({ color: whiteModern });
    var crossingTower = new THREE.Mesh(crossingTowerGeom, crossingMat);
    crossingTower.position.set(0, 16, 50);
    scene.add(crossingTower);
    objects.push(crossingTower);

    // Hawes Pier military dock
    var pierGeom = new THREE.BoxGeometry(20, 1, 6);
    var pierMat = new THREE.MeshLambertMaterial({ color: stoneOld });
    var pier = new THREE.Mesh(pierGeom, pierMat);
    pier.position.set(-35, 0.5, 35);
    scene.add(pier);
    objects.push(pier);

    // Ferry terminal fortified
    var terminalGeom = new THREE.BoxGeometry(16, 6, 10);
    var terminalMat = new THREE.MeshLambertMaterial({ color: greenModern });
    var terminal = new THREE.Mesh(terminalGeom, terminalMat);
    terminal.position.set(40, 3, 40);
    scene.add(terminal);
    objects.push(terminal);

    // Dalmeny House on hill - Gothic field HQ
    var houseGeom = new THREE.BoxGeometry(16, 8, 12);
    var houseMat = new THREE.MeshLambertMaterial({ color: gothicStone });
    var house = new THREE.Mesh(houseGeom, houseMat);
    house.position.set(-50, 4, -60);
    scene.add(house);
    objects.push(house);

    // Anti-aircraft battery on south shore
    createAABattery(scene, [50, 0, -50], oliveGreen);

    // Ambient light - Forth estuary
    var ambientLight = new THREE.AmbientLight(estuary, 0.7);
    scene.add(ambientLight);
    lights.push(ambientLight);

    // Red work lights at tower tops
    var lightPos1 = new THREE.Vector3(railTower1Pos[0], railTower1Pos[1] + 30, railTower1Pos[2]);
    var lightPos2 = new THREE.Vector3(railTower2Pos[0], railTower2Pos[1] + 30, railTower2Pos[2]);
    var lightPos3 = new THREE.Vector3(railTower3Pos[0], railTower3Pos[1] + 30, railTower3Pos[2]);

    var light1 = new THREE.PointLight(redLight, 0.6, 60);
    light1.position.copy(lightPos1);
    scene.add(light1);
    lights.push(light1);
    railLights.push(light1);

    var light2 = new THREE.PointLight(redLight, 0.6, 60);
    light2.position.copy(lightPos2);
    scene.add(light2);
    lights.push(light2);
    railLights.push(light2);

    var light3 = new THREE.PointLight(redLight, 0.6, 60);
    light3.position.copy(lightPos3);
    scene.add(light3);
    lights.push(light3);
    railLights.push(light3);
  };

  function createRailTower(scene, pos, color) {
    var towerGeom = new THREE.BoxGeometry(6, 30, 6);
    var towerMat = new THREE.MeshLambertMaterial({ color: color });
    var tower = new THREE.Mesh(towerGeom, towerMat);
    tower.position.set(pos[0], pos[1] + 15, pos[2]);
    scene.add(tower);
    objects.push(tower);

    // Diagonal strut boxes
    var strutGeom = new THREE.BoxGeometry(2, 20, 2);
    var strutMat = new THREE.MeshLambertMaterial({ color: color });

    var strut1 = new THREE.Mesh(strutGeom, strutMat);
    strut1.position.set(pos[0] - 6, pos[1] + 12, pos[2]);
    strut1.rotation.z = 0.4;
    scene.add(strut1);
    objects.push(strut1);

    var strut2 = new THREE.Mesh(strutGeom, strutMat);
    strut2.position.set(pos[0] + 6, pos[1] + 12, pos[2]);
    strut2.rotation.z = -0.4;
    scene.add(strut2);
    objects.push(strut2);
  }

  function createRoadTower(scene, pos, color) {
    var towerGeom = new THREE.BoxGeometry(4, 28, 4);
    var towerMat = new THREE.MeshLambertMaterial({ color: color });
    var tower = new THREE.Mesh(towerGeom, towerMat);
    tower.position.set(pos[0], pos[1] + 14, pos[2]);
    scene.add(tower);
    objects.push(tower);
    return tower;
  }

  function createCableLines(scene, pos1, pos2) {
    var points = [
      new THREE.Vector3(pos1.x, pos1.y + 14, pos1.z),
      new THREE.Vector3(pos2.x, pos2.y + 14, pos2.z)
    ];
    var geometry = new THREE.BufferGeometry().setFromPoints(points);
    var material = new THREE.LineBasicMaterial({ color: 0x444444 });
    var line = new THREE.LineSegments(geometry, material);
    scene.add(line);
    objects.push(line);
  }

  function createAABattery(scene, pos, color) {
    var baseGeom = new THREE.BoxGeometry(8, 0.5, 8);
    var baseMat = new THREE.MeshLambertMaterial({ color: color });
    var base = new THREE.Mesh(baseGeom, baseMat);
    base.position.set(pos[0], pos[1] + 0.25, pos[2]);
    scene.add(base);
    objects.push(base);

    var mountGeom = new THREE.BoxGeometry(3, 2, 3);
    var mountMat = new THREE.MeshLambertMaterial({ color: color });

    var mount1 = new THREE.Mesh(mountGeom, mountMat);
    mount1.position.set(pos[0] - 3, pos[1] + 1.5, pos[2] - 3);
    scene.add(mount1);
    objects.push(mount1);

    var mount2 = new THREE.Mesh(mountGeom, mountMat);
    mount2.position.set(pos[0] + 3, pos[1] + 1.5, pos[2] - 3);
    scene.add(mount2);
    objects.push(mount2);

    var mount3 = new THREE.Mesh(mountGeom, mountMat);
    mount3.position.set(pos[0] - 3, pos[1] + 1.5, pos[2] + 3);
    scene.add(mount3);
    objects.push(mount3);

    var mount4 = new THREE.Mesh(mountGeom, mountMat);
    mount4.position.set(pos[0] + 3, pos[1] + 1.5, pos[2] + 3);
    scene.add(mount4);
    objects.push(mount4);

    // Four barrels - cylinders
    var barrelGeom = new THREE.CylinderGeometry(0.4, 0.4, 8, 8);
    var barrelMat = new THREE.MeshLambertMaterial({ color: 0x222222 });

    var barrel1 = new THREE.Mesh(barrelGeom, barrelMat);
    barrel1.position.set(pos[0] - 3, pos[1] + 5, pos[2] - 3);
    scene.add(barrel1);
    objects.push(barrel1);

    var barrel2 = new THREE.Mesh(barrelGeom, barrelMat);
    barrel2.position.set(pos[0] + 3, pos[1] + 5, pos[2] - 3);
    scene.add(barrel2);
    objects.push(barrel2);

    var barrel3 = new THREE.Mesh(barrelGeom, barrelMat);
    barrel3.position.set(pos[0] - 3, pos[1] + 5, pos[2] + 3);
    scene.add(barrel3);
    objects.push(barrel3);

    var barrel4 = new THREE.Mesh(barrelGeom, barrelMat);
    barrel4.position.set(pos[0] + 3, pos[1] + 5, pos[2] + 3);
    scene.add(barrel4);
    objects.push(barrel4);
  }

  Base.update = function(delta) {
    lightStrobeTime += delta;
    var strobeIntensity = Math.sin(lightStrobeTime * 6) * 0.3 + 0.3;

    var i = 0;
    while (i < railLights.length) {
      railLights[i].intensity = strobeIntensity;
      i = i + 1;
    }
  };

  Base.reset = function(scene) {
    var i = 0;
    while (i < objects.length) {
      scene.remove(objects[i]);
      i = i + 1;
    }
    objects = [];

    var j = 0;
    while (j < lights.length) {
      scene.remove(lights[j]);
      j = j + 1;
    }
    lights = [];
    railLights = [];
  };

  Base.getObjects = function() {
    return objects;
  };

  Base.getLights = function() {
    return lights;
  };

  return Base;
}());
