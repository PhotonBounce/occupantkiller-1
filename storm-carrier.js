window.StormCarrier = (function() {
  'use strict';

  var objects = [];
  var scene = null;
  var camera = null;
  var animationState = {
    time: 0,
    jetRockAngle: 0,
    ciWSRotation: 0,
    radarSpin: 0,
    elevatorHeight: 0,
    beaconFlash: 0,
    wavePhase: 0
  };

  function init(inputScene, inputCamera) {
    scene = inputScene;
    camera = inputCamera;
    objects = [];
    animationState.time = 0;

    // Hull and main body
    var hullGeometry = new THREE.BoxGeometry(120, 30, 400);
    var hullMaterial = new THREE.MeshPhongMaterial({ color: 0x2a3a4a });
    var hull = new THREE.Mesh(hullGeometry, hullMaterial);
    hull.position.y = 5;
    hull.position.z = 0;
    scene.add(hull);
    objects.push(hull);

    // Flight deck
    var deckGeometry = new THREE.BoxGeometry(140, 2, 420);
    var deckMaterial = new THREE.MeshPhongMaterial({ color: 0x4a5a6a });
    var deck = new THREE.Mesh(deckGeometry, deckMaterial);
    deck.position.y = 20;
    deck.position.z = 0;
    scene.add(deck);
    objects.push(deck);

    // Island superstructure
    var islandGeometry = new THREE.BoxGeometry(30, 50, 40);
    var islandMaterial = new THREE.MeshPhongMaterial({ color: 0x3a4a5a });
    var island = new THREE.Mesh(islandGeometry, islandMaterial);
    island.position.x = -50;
    island.position.y = 35;
    island.position.z = -150;
    scene.add(island);
    objects.push(island);

    // Radar antenna array 1
    var radarGeometry1 = new THREE.CylinderGeometry(8, 8, 3, 32);
    var radarMaterial = new THREE.MeshPhongMaterial({ color: 0xffa500 });
    var radar1 = new THREE.Mesh(radarGeometry1, radarMaterial);
    radar1.position.x = -45;
    radar1.position.y = 75;
    radar1.position.z = -155;
    scene.add(radar1);
    objects.push(radar1);

    // Radar antenna array 2
    var radar2 = new THREE.Mesh(radarGeometry1, radarMaterial);
    radar2.position.x = -55;
    radar2.position.y = 75;
    radar2.position.z = -155;
    scene.add(radar2);
    objects.push(radar2);

    // CIWS gun mount 1
    var ciWSGeometry = new THREE.CylinderGeometry(4, 4, 8, 32);
    var ciWSMaterial = new THREE.MeshPhongMaterial({ color: 0x666666 });
    var ciWS1 = new THREE.Mesh(ciWSGeometry, ciWSMaterial);
    ciWS1.position.x = 55;
    ciWS1.position.y = 25;
    ciWS1.position.z = 150;
    scene.add(ciWS1);
    objects.push(ciWS1);

    // CIWS barrel 1
    var ciWSBarrelGeometry = new THREE.CylinderGeometry(2, 2, 12, 16);
    var ciWSBarrelMaterial = new THREE.MeshPhongMaterial({ color: 0x333333 });
    var ciWSBarrel1 = new THREE.Mesh(ciWSBarrelGeometry, ciWSBarrelMaterial);
    ciWSBarrel1.position.x = 55;
    ciWSBarrel1.position.y = 32;
    ciWSBarrel1.position.z = 150;
    ciWSBarrel1.rotation.z = Math.PI / 6;
    scene.add(ciWSBarrel1);
    objects.push(ciWSBarrel1);

    // CIWS gun mount 2
    var ciWS2 = new THREE.Mesh(ciWSGeometry, ciWSMaterial);
    ciWS2.position.x = -55;
    ciWS2.position.y = 25;
    ciWS2.position.z = -150;
    scene.add(ciWS2);
    objects.push(ciWS2);

    // CIWS barrel 2
    var ciWSBarrel2 = new THREE.Mesh(ciWSBarrelGeometry, ciWSBarrelMaterial);
    ciWSBarrel2.position.x = -55;
    ciWSBarrel2.position.y = 32;
    ciWSBarrel2.position.z = -150;
    ciWSBarrel2.rotation.z = Math.PI / 6;
    scene.add(ciWSBarrel2);
    objects.push(ciWSBarrel2);

    // Jet 1 - chained down on flight deck
    var jetGeometry1 = new THREE.ConeGeometry(6, 20, 8);
    var jetMaterial = new THREE.MeshPhongMaterial({ color: 0x1a1a1a });
    var jet1 = new THREE.Mesh(jetGeometry1, jetMaterial);
    jet1.position.x = -35;
    jet1.position.y = 22;
    jet1.position.z = 100;
    jet1.rotation.z = Math.PI / 2;
    scene.add(jet1);
    objects.push(jet1);

    // Jet 1 fuselage
    var jetFuselageGeometry1 = new THREE.CylinderGeometry(4, 4, 25, 16);
    var jetFuselage1 = new THREE.Mesh(jetFuselageGeometry1, jetMaterial);
    jetFuselage1.position.x = -35;
    jetFuselage1.position.y = 22;
    jetFuselage1.position.z = 100;
    scene.add(jetFuselage1);
    objects.push(jetFuselage1);

    // Jet 2 - chained down on flight deck
    var jet2 = new THREE.Mesh(jetGeometry1, jetMaterial);
    jet2.position.x = 35;
    jet2.position.y = 22;
    jet2.position.z = 50;
    jet2.rotation.z = Math.PI / 2;
    scene.add(jet2);
    objects.push(jet2);

    // Jet 2 fuselage
    var jetFuselage2 = new THREE.Mesh(jetFuselageGeometry1, jetMaterial);
    jetFuselage2.position.x = 35;
    jetFuselage2.position.y = 22;
    jetFuselage2.position.z = 50;
    scene.add(jetFuselage2);
    objects.push(jetFuselage2);

    // Arresting wire system - cable segments
    var wireGeometry = new THREE.BoxGeometry(100, 0.3, 2);
    var wireMaterial = new THREE.MeshPhongMaterial({ color: 0xcccccc });
    var wire1 = new THREE.Mesh(wireGeometry, wireMaterial);
    wire1.position.y = 20.5;
    wire1.position.z = 200;
    scene.add(wire1);
    objects.push(wire1);

    var wire2 = new THREE.Mesh(wireGeometry, wireMaterial);
    wire2.position.y = 20.5;
    wire2.position.z = 220;
    scene.add(wire2);
    objects.push(wire2);

    var wire3 = new THREE.Mesh(wireGeometry, wireMaterial);
    wire3.position.y = 20.5;
    wire3.position.z = 240;
    scene.add(wire3);
    objects.push(wire3);

    // Elevator lift system
    var elevatorGeometry = new THREE.BoxGeometry(50, 3, 50);
    var elevatorMaterial = new THREE.MeshPhongMaterial({ color: 0x8a9aaa });
    var elevator = new THREE.Mesh(elevatorGeometry, elevatorMaterial);
    elevator.position.x = -60;
    elevator.position.y = 20;
    elevator.position.z = -80;
    elevator.name = 'elevator';
    scene.add(elevator);
    objects.push(elevator);

    // Emergency beacon light
    var beaconGeometry = new THREE.SphereGeometry(3, 16, 16);
    var beaconMaterial = new THREE.MeshPhongMaterial({ color: 0xff0000, emissive: 0xff0000 });
    var beacon = new THREE.Mesh(beaconGeometry, beaconMaterial);
    beacon.position.x = -50;
    beacon.position.y = 85;
    beacon.position.z = -155;
    beacon.name = 'beacon';
    scene.add(beacon);
    objects.push(beacon);

    // Hangar entrance
    var hangarGeometry = new THREE.BoxGeometry(100, 40, 60);
    var hangarMaterial = new THREE.MeshPhongMaterial({ color: 0x1a2a3a });
    var hangar = new THREE.Mesh(hangarGeometry, hangarMaterial);
    hangar.position.y = 8;
    hangar.position.z = -120;
    scene.add(hangar);
    objects.push(hangar);

    // Fuel hose (swinging)
    var hoseGeometry = new THREE.CylinderGeometry(1.5, 1.5, 20, 8);
    var hoseMaterial = new THREE.MeshPhongMaterial({ color: 0xffaa00 });
    var hose = new THREE.Mesh(hoseGeometry, hoseMaterial);
    hose.position.x = 50;
    hose.position.y = 15;
    hose.position.z = -100;
    hose.name = 'hose';
    scene.add(hose);
    objects.push(hose);

    // Bow wave crash zone marker
    var waveMarkerGeometry = new THREE.SphereGeometry(40, 16, 16);
    var waveMarkerMaterial = new THREE.MeshPhongMaterial({ color: 0x0088cc, transparent: true, opacity: 0.2 });
    var waveMarker = new THREE.Mesh(waveMarkerGeometry, waveMarkerMaterial);
    waveMarker.position.y = 35;
    waveMarker.position.z = 200;
    scene.add(waveMarker);
    objects.push(waveMarker);

    // Maintenance crane
    var craneBaseGeometry = new THREE.BoxGeometry(20, 25, 20);
    var craneMaterial = new THREE.MeshPhongMaterial({ color: 0x555555 });
    var craneBase = new THREE.Mesh(craneBaseGeometry, craneMaterial);
    craneBase.position.x = -70;
    craneBase.position.y = 12;
    craneBase.position.z = -200;
    scene.add(craneBase);
    objects.push(craneBase);

    // Crane boom
    var craneBoomGeometry = new THREE.CylinderGeometry(2, 2, 60, 12);
    var craneBoom = new THREE.Mesh(craneBoomGeometry, craneMaterial);
    craneBoom.position.x = -70;
    craneBoom.position.y = 40;
    craneBoom.position.z = -200;
    craneBoom.rotation.z = Math.PI / 3;
    scene.add(craneBoom);
    objects.push(craneBoom);
  }

  function update(delta) {
    animationState.time += delta;

    // Rock jets in storm
    animationState.jetRockAngle = Math.sin(animationState.time * 2) * 0.15;
    for (var i = 0; i < objects.length; i++) {
      var obj = objects[i];
      if (obj.name === undefined) {
        if (i === 9 || i === 12) {
          // Jets at indices 9 and 12
          obj.rotation.z = Math.PI / 2 + animationState.jetRockAngle;
        }
      }
    }

    // CIWS rotation tracking
    animationState.ciWSRotation += delta * 0.8;
    for (var i = 0; i < objects.length; i++) {
      var obj = objects[i];
      if (i === 6 || i === 8) {
        // CIWS barrels
        obj.rotation.y = animationState.ciWSRotation;
      }
    }

    // Radar spin
    animationState.radarSpin += delta * 1.5;
    for (var i = 0; i < objects.length; i++) {
      var obj = objects[i];
      if (i === 4 || i === 5) {
        // Radar antennas
        obj.rotation.y = animationState.radarSpin;
      }
    }

    // Elevator rising and falling
    animationState.elevatorHeight = Math.sin(animationState.time * 0.5) * 8;
    for (var i = 0; i < objects.length; i++) {
      var obj = objects[i];
      if (obj.name === 'elevator') {
        obj.position.y = 20 + animationState.elevatorHeight;
      }
    }

    // Emergency beacon flashing
    animationState.beaconFlash = Math.max(0, Math.sin(animationState.time * 3) * 0.8 + 0.2);
    for (var i = 0; i < objects.length; i++) {
      var obj = objects[i];
      if (obj.name === 'beacon') {
        obj.material.emissiveIntensity = animationState.beaconFlash;
      }
    }

    // Fuel hose swinging in wind
    var hoseSwing = Math.sin(animationState.time * 1.3) * 0.3;
    for (var i = 0; i < objects.length; i++) {
      var obj = objects[i];
      if (obj.name === 'hose') {
        obj.rotation.z = hoseSwing;
      }
    }

    // Wave phase animation for water interaction
    animationState.wavePhase = (animationState.time * 2) % (Math.PI * 2);
  }

  function reset() {
    for (var i = 0; i < objects.length; i++) {
      scene.remove(objects[i]);
    }
    objects = [];
    animationState = {
      time: 0,
      jetRockAngle: 0,
      ciWSRotation: 0,
      radarSpin: 0,
      elevatorHeight: 0,
      beaconFlash: 0,
      wavePhase: 0
    };
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
