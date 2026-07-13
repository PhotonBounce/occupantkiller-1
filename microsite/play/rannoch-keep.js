window.RannochKeep = (function() {
  'use strict';

  var objects = [];
  var lights = [];
  var signalLight = null;
  var signalState = 0;

  function createWatchtower() {
    var geometry = new THREE.BoxGeometry(8, 20, 8);
    var material = new THREE.MeshLambertMaterial({ color: 0x554433 });
    var tower = new THREE.Mesh(geometry, material);
    tower.position.set(-30, 10, -40);
    objects.push(tower);
    return tower;
  }

  function createBogMarkers() {
    for (var i = 0; i < 6; i++) {
      var geometry = new THREE.CylinderGeometry(0.3, 0.3, 2, 8);
      var material = new THREE.MeshLambertMaterial({ color: 0x4a3520 });
      var marker = new THREE.Mesh(geometry, material);
      var angle = (i / 6) * Math.PI * 2;
      marker.position.set(Math.cos(angle) * 25, 1, Math.sin(angle) * 25 - 30);
      objects.push(marker);
    }
  }

  function createStation() {
    var geometry = new THREE.BoxGeometry(10, 4, 8);
    var material = new THREE.MeshLambertMaterial({ color: 0x888877 });
    var station = new THREE.Mesh(geometry, material);
    station.position.set(15, 2, -25);
    objects.push(station);
    return station;
  }

  function createRailPlatform() {
    var geometry = new THREE.BoxGeometry(30, 0.5, 3);
    var material = new THREE.MeshLambertMaterial({ color: 0x888888 });
    var platform = new THREE.Mesh(geometry, material);
    platform.position.set(20, 0.25, -20);
    objects.push(platform);
    return platform;
  }

  function createSignalGantry() {
    var baseGeometry = new THREE.CylinderGeometry(0.5, 0.5, 8, 8);
    var baseMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
    var base = new THREE.Mesh(baseGeometry, baseMaterial);
    base.position.set(35, 4, -15);
    objects.push(base);

    var redGeometry = new THREE.SphereGeometry(0.5, 8, 8);
    var redMaterial = new THREE.MeshLambertMaterial({ color: 0xFF0000 });
    var redLight = new THREE.Mesh(redGeometry, redMaterial);
    redLight.position.set(35, 8.5, -15);
    redLight.userData.isSignal = true;
    redLight.userData.color = 0xFF0000;
    objects.push(redLight);
    signalLight = redLight;

    var greenGeometry = new THREE.SphereGeometry(0.5, 8, 8);
    var greenMaterial = new THREE.MeshLambertMaterial({ color: 0x00AA00 });
    var greenLight = new THREE.Mesh(greenGeometry, greenMaterial);
    greenLight.position.set(35, 9.5, -15);
    greenLight.userData.isSignal = true;
    greenLight.userData.color = 0x00AA00;
    objects.push(greenLight);
  }

  function createWaterButt() {
    var geometry = new THREE.CylinderGeometry(2, 2, 3, 12);
    var material = new THREE.MeshLambertMaterial({ color: 0x3a4a30 });
    var butt = new THREE.Mesh(geometry, material);
    butt.position.set(-50, 1.5, -10);
    objects.push(butt);
    return butt;
  }

  function createPeatStacks() {
    for (var i = 0; i < 6; i++) {
      var geometry = new THREE.BoxGeometry(5, 1.5, 6);
      var material = new THREE.MeshLambertMaterial({ color: 0x5C3A1E });
      var stack = new THREE.Mesh(geometry, material);
      var xPos = -20 + (i % 3) * 12;
      var zPos = 20 + Math.floor(i / 3) * 10;
      stack.position.set(xPos, 0.75, zPos);
      objects.push(stack);
    }
  }

  function createBogPit() {
    var geometry = new THREE.BoxGeometry(8, 2, 6);
    var material = new THREE.MeshLambertMaterial({ color: 0x3a2a1a });
    var pit = new THREE.Mesh(geometry, material);
    pit.position.set(0, -1, 10);
    objects.push(pit);

    var points = [
      new THREE.Vector3(-4, 0, 3),
      new THREE.Vector3(4, 0, 3),
      new THREE.Vector3(4, 0, -3),
      new THREE.Vector3(-4, 0, -3),
      new THREE.Vector3(-4, 0, 3)
    ];
    var ropeGeometry = new THREE.BufferGeometry().setFromPoints(points);
    var ropeMaterial = new THREE.LineBasicMaterial({ color: 0xAA8844, linewidth: 2 });
    var rope = new THREE.LineSegments(ropeGeometry, ropeMaterial);
    rope.position.set(0, 0.5, 10);
    objects.push(rope);
  }

  function createMistAmbient() {
    var light = new THREE.AmbientLight(0xBBAFBB, 0.4);
    lights.push(light);
    return light;
  }

  function createWaitingRoomLight() {
    var light = new THREE.PointLight(0xFFEE88, 0.9, 20);
    light.position.set(15, 4, -25);
    lights.push(light);
    return light;
  }

  function update(delta) {
    if (signalLight) {
      signalState += delta;
      if (signalState > 1) {
        signalState = 0;
      }
      var threshold = 0.5;
      if (signalState < threshold) {
        signalLight.material.color.setHex(0xFF0000);
      } else {
        signalLight.material.color.setHex(0x00AA00);
      }
    }
  }

  function reset() {
    for (var i = 0; i < objects.length; i++) {
      objects[i] = null;
    }
    objects.length = 0;

    for (var j = 0; j < lights.length; j++) {
      lights[j] = null;
    }
    lights.length = 0;

    signalLight = null;
    signalState = 0;
  }

  function build(scene) {
    reset();

    createWatchtower();
    createBogMarkers();
    createStation();
    createRailPlatform();
    createSignalGantry();
    createWaterButt();
    createPeatStacks();
    createBogPit();

    var mistLight = createMistAmbient();
    var roomLight = createWaitingRoomLight();

    for (var i = 0; i < objects.length; i++) {
      scene.add(objects[i]);
    }

    for (var j = 0; j < lights.length; j++) {
      scene.add(lights[j]);
    }
  }

  return {
    build: build,
    update: update,
    reset: reset,
    objects: objects,
    lights: lights
  };
}());
