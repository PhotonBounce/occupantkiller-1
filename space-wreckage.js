window.SpaceWreckage = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var sceneObjects = [];
  var scavengers = [];
  var debris = [];
  var hudVisible = true;
  var hudElement = null;

  var gameState = {
    scavengersEliminated: 0,
    salvageRecovered: 0,
    oxygen: 100,
    maxScavengers: 6,
    maxSalvage: 4
  };

  var keyState = {};
  var lastSKeyTime = 0;
  var sKeyPressed = false;

  function init(initScene, initCamera) {
    scene = initScene;
    camera = initCamera;
    sceneObjects = [];
    scavengers = [];
    debris = [];

    gameState.scavengersEliminated = 0;
    gameState.salvageRecovered = 0;
    gameState.oxygen = 100;

    createStarfield();
    createDebrisField();
    createScavengers();
    createHUD();
    setupKeyboardListener();
  }

  function createStarfield() {
    var starsGeometry = new THREE.BufferGeometry();
    var starPositions = [];
    var starCount = 500;

    for (var i = 0; i < starCount; i++) {
      var x = (Math.random() - 0.5) * 2000;
      var y = (Math.random() - 0.5) * 2000;
      var z = (Math.random() - 0.5) * 2000;
      starPositions.push(x, y, z);
    }

    starsGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(starPositions), 3));

    var starMaterial = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 2,
      emissive: 0xffffff,
      sizeAttenuation: true
    });

    var stars = new THREE.Points(starsGeometry, starMaterial);
    scene.add(stars);
    sceneObjects.push(stars);
  }

  function createDebrisField() {
    createDerelictHullSections();
    createSolarPanels();
    createFuelTanks();
    createEscapePod();
    createCommunicationDish();
    createThrusterNacelle();
    createMicrometoriteImpacts();
  }

  function createDerelictHullSections() {
    var colors = [0x333333, 0x444444, 0x222222];
    var positions = [
      {x: 0, y: 0, z: -50, rot: {x: 0.3, y: 0.2, z: 0}},
      {x: 40, y: 20, z: -80, rot: {x: 0.1, y: 0.5, z: 0.2}},
      {x: -35, y: -25, z: -100, rot: {x: 0.4, y: 0.1, z: 0.3}}
    ];

    for (var i = 0; i < positions.length; i++) {
      var pos = positions[i];
      var geometry = new THREE.BoxGeometry(50, 40, 30);
      var material = new THREE.MeshPhongMaterial({
        color: colors[i % colors.length],
        emissive: 0x111111
      });
      var hull = new THREE.Mesh(geometry, material);
      hull.position.set(pos.x, pos.y, pos.z);
      hull.rotation.set(pos.rot.x, pos.rot.y, pos.rot.z);

      hull.debrisData = {
        rotVel: {x: Math.random() * 0.02, y: Math.random() * 0.02, z: Math.random() * 0.01},
        type: 'hull'
      };

      scene.add(hull);
      sceneObjects.push(hull);
      debris.push(hull);
    }
  }

  function createSolarPanels() {
    var panelCount = 3;
    for (var i = 0; i < panelCount; i++) {
      var geometry = new THREE.BoxGeometry(60, 5, 40);
      var material = new THREE.MeshPhongMaterial({
        color: 0x1a1a4d,
        emissive: 0x0a0a2e
      });
      var panel = new THREE.Mesh(geometry, material);

      var angle = (i / panelCount) * Math.PI * 2;
      panel.position.set(Math.cos(angle) * 80, Math.sin(angle) * 80, -60 + i * 20);
      panel.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);

      panel.debrisData = {
        rotVel: {x: Math.random() * 0.015, y: Math.random() * 0.015, z: Math.random() * 0.015},
        type: 'panel'
      };

      scene.add(panel);
      sceneObjects.push(panel);
      debris.push(panel);
    }
  }

  function createFuelTanks() {
    var tankCount = 4;
    for (var i = 0; i < tankCount; i++) {
      var geometry = new THREE.SphereGeometry(15, 16, 16);
      var material = new THREE.MeshPhongMaterial({
        color: 0x330000,
        emissive: 0x661111,
        shininess: 30
      });
      var tank = new THREE.Mesh(geometry, material);

      var angle = (i / tankCount) * Math.PI * 2;
      tank.position.set(
        Math.cos(angle) * 100 + (Math.random() - 0.5) * 30,
        Math.sin(angle) * 100 + (Math.random() - 0.5) * 30,
        -70 + (Math.random() - 0.5) * 40
      );

      tank.debrisData = {
        rotVel: {x: Math.random() * 0.008, y: Math.random() * 0.008, z: Math.random() * 0.008},
        driftVel: {
          x: (Math.random() - 0.5) * 0.3,
          y: (Math.random() - 0.5) * 0.3,
          z: (Math.random() - 0.5) * 0.1
        },
        type: 'fuel'
      };

      scene.add(tank);
      sceneObjects.push(tank);
      debris.push(tank);
    }
  }

  function createEscapePod() {
    var geometry = new THREE.BoxGeometry(12, 16, 10);
    var material = new THREE.MeshPhongMaterial({
      color: 0x1a3a1a,
      emissive: 0x2a6a2a
    });
    var pod = new THREE.Mesh(geometry, material);
    pod.position.set(-50, 30, -90);
    pod.rotation.set(0.2, 0.3, 0);

    var viewGeometry = new THREE.SphereGeometry(3, 8, 8);
    var viewMaterial = new THREE.MeshPhongMaterial({
      color: 0x0a0a0a,
      emissive: 0x1a1a1a
    });
    var viewport = new THREE.Mesh(viewGeometry, viewMaterial);
    viewport.position.set(0, 2, -5.5);
    pod.add(viewport);

    pod.debrisData = {
      rotVel: {x: 0.005, y: 0.01, z: 0.003},
      beaconFlash: 0,
      type: 'escapePod'
    };

    scene.add(pod);
    sceneObjects.push(pod);
    debris.push(pod);
  }

  function createCommunicationDish() {
    var mainGeometry = new THREE.CylinderGeometry(20, 20, 5, 16);
    var material = new THREE.MeshPhongMaterial({
      color: 0x444444,
      emissive: 0x222222
    });
    var dish = new THREE.Mesh(mainGeometry, material);
    dish.position.set(60, -40, -80);
    dish.rotation.set(0.3, 0.2, 0.1);

    var coneGeometry = new THREE.ConeGeometry(8, 15, 12);
    var coneMaterial = new THREE.MeshPhongMaterial({
      color: 0x333333,
      emissive: 0x111111
    });
    var cone = new THREE.Mesh(coneGeometry, coneMaterial);
    cone.position.set(0, 12, 0);
    cone.rotation.z = Math.PI * 0.5;
    dish.add(cone);

    dish.debrisData = {
      rotVel: {x: 0.02, y: 0, z: 0.01},
      type: 'dish'
    };

    scene.add(dish);
    sceneObjects.push(dish);
    debris.push(dish);
  }

  function createThrusterNacelle() {
    var cylinderGeometry = new THREE.CylinderGeometry(8, 10, 40, 12);
    var material = new THREE.MeshPhongMaterial({
      color: 0x1a1a1a,
      emissive: 0x3a3a3a
    });
    var thruster = new THREE.Mesh(cylinderGeometry, material);
    thruster.position.set(-70, 0, -100);
    thruster.rotation.z = Math.PI * 0.5;

    var exhaustGeometry = new THREE.SphereGeometry(12, 12, 12);
    var exhaustMaterial = new THREE.MeshPhongMaterial({
      color: 0xff4400,
      emissive: 0xff8800,
      shininess: 60
    });
    var exhaust = new THREE.Mesh(exhaustGeometry, exhaustMaterial);
    exhaust.position.set(22, 0, 0);
    thruster.add(exhaust);

    thruster.debrisData = {
      rotVel: {x: 0, y: 0.015, z: 0.005},
      exhaustGlow: 0,
      type: 'thruster'
    };

    scene.add(thruster);
    sceneObjects.push(thruster);
    debris.push(thruster);
  }

  function createMicrometoriteImpacts() {
    var impactCount = 8;
    for (var i = 0; i < impactCount; i++) {
      var geometry = new THREE.BoxGeometry(8, 6, 4);
      var material = new THREE.MeshPhongMaterial({
        color: 0x111111,
        emissive: 0x0a0a0a
      });
      var impact = new THREE.Mesh(geometry, material);

      impact.position.set(
        (Math.random() - 0.5) * 200,
        (Math.random() - 0.5) * 150,
        -120 + Math.random() * 40
      );
      impact.scale.set(0.6, 0.4, 0.3);
      impact.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);

      impact.debrisData = {
        rotVel: {x: 0, y: 0, z: 0},
        type: 'impact'
      };

      scene.add(impact);
      sceneObjects.push(impact);
      debris.push(impact);
    }
  }

  function createScavengers() {
    var scavengerCount = 6;
    for (var i = 0; i < scavengerCount; i++) {
      var bodyGeometry = new THREE.BoxGeometry(6, 10, 5);
      var bodyMaterial = new THREE.MeshPhongMaterial({
        color: 0x666666,
        emissive: 0x333333
      });
      var body = new THREE.Mesh(bodyGeometry, bodyMaterial);

      var helmetGeometry = new THREE.SphereGeometry(4, 12, 12);
      var helmetMaterial = new THREE.MeshPhongMaterial({
        color: 0x888888,
        emissive: 0x444444,
        shininess: 40
      });
      var helmet = new THREE.Mesh(helmetGeometry, helmetMaterial);
      helmet.position.set(0, 7, 0);
      body.add(helmet);

      var angle = (i / scavengerCount) * Math.PI * 2;
      body.position.set(
        Math.cos(angle) * 120,
        (Math.random() - 0.5) * 80,
        -80 + Math.sin(angle) * 40
      );

      body.scavengerData = {
        alive: true,
        health: 1,
        moveVel: {
          x: (Math.random() - 0.5) * 15,
          y: (Math.random() - 0.5) * 5,
          z: (Math.random() - 0.5) * 10
        }
      };

      scene.add(body);
      sceneObjects.push(body);
      scavengers.push(body);
    }
  }

  function createHUD() {
    if (!document.getElementById('spaceWreckageHUD')) {
      hudElement = document.createElement('div');
      hudElement.id = 'spaceWreckageHUD';
      hudElement.style.position = 'fixed';
      hudElement.style.top = '20px';
      hudElement.style.left = '20px';
      hudElement.style.color = '#00ff00';
      hudElement.style.fontFamily = 'monospace';
      hudElement.style.fontSize = '14px';
      hudElement.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
      hudElement.style.padding = '15px';
      hudElement.style.border = '2px solid #00ff00';
      hudElement.style.zIndex = '1000';
      hudElement.style.display = hudVisible ? 'block' : 'none';
      document.body.appendChild(hudElement);
    } else {
      hudElement = document.getElementById('spaceWreckageHUD');
    }
    updateHUD();
  }

  function updateHUD() {
    if (hudElement) {
      hudElement.innerHTML =
        'SCAVENGERS ELIMINATED: ' + gameState.scavengersEliminated + '/' + gameState.maxScavengers + '<br>' +
        'SALVAGE RECOVERED: ' + gameState.salvageRecovered + '/' + gameState.maxSalvage + '<br>' +
        'OXYGEN: ' + Math.max(0, Math.floor(gameState.oxygen)) + '%';
    }
  }

  function setupKeyboardListener() {
    document.addEventListener('keydown', function(e) {
      keyState[e.key.toLowerCase()] = true;

      if (e.key.toLowerCase() === 's') {
        var now = Date.now();
        if (now - lastSKeyTime < 400) {
          if (!sKeyPressed) {
            sKeyPressed = true;
            hudVisible = !hudVisible;
            if (hudElement) {
              hudElement.style.display = hudVisible ? 'block' : 'none';
            }
            console.log('HUD toggled: ' + (hudVisible ? 'ON' : 'OFF'));
          }
        }
        lastSKeyTime = now;
        sKeyPressed = false;
      }
    });

    document.addEventListener('keyup', function(e) {
      keyState[e.key.toLowerCase()] = false;
    });

    document.addEventListener('click', function(e) {
      var raycaster = new THREE.Raycaster();
      var mouse = new THREE.Vector2();
      mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);

      var intersects = raycaster.intersectObjects(scavengers, false);
      for (var i = 0; i < intersects.length; i++) {
        var scav = intersects[i].object;
        if (scav.scavengerData && scav.scavengerData.alive) {
          scav.scavengerData.alive = false;
          gameState.scavengersEliminated++;
          scav.visible = false;
          updateHUD();
          break;
        }
      }
    });
  }

  function update(delta) {
    if (!scene) return;

    updateDebris(delta);
    updateScavengers(delta);
    updateBeacons(delta);
    updateOxygen(delta);
  }

  function updateDebris(delta) {
    for (var i = 0; i < debris.length; i++) {
      var obj = debris[i];
      if (!obj.debrisData) continue;

      var data = obj.debrisData;

      obj.rotation.x += data.rotVel.x;
      obj.rotation.y += data.rotVel.y;
      obj.rotation.z += data.rotVel.z;

      if (data.driftVel) {
        obj.position.x += data.driftVel.x * delta;
        obj.position.y += data.driftVel.y * delta;
        obj.position.z += data.driftVel.z * delta;
      }

      if (data.type === 'escapePod') {
        data.beaconFlash = (data.beaconFlash + delta * 2) % (Math.PI * 2);
        var pulseFactor = Math.sin(data.beaconFlash) * 0.5 + 0.5;
        obj.material.emissive.setHSL(0.35, 1, 0.3 + pulseFactor * 0.2);
      }

      if (data.type === 'thruster') {
        data.exhaustGlow = (data.exhaustGlow + delta * 1.5) % (Math.PI * 2);
        var exhaustPulse = Math.sin(data.exhaustGlow) * 0.3 + 0.7;
        if (obj.children && obj.children[0]) {
          obj.children[0].material.emissive.multiplyScalar(exhaustPulse);
        }
      }
    }
  }

  function updateScavengers(delta) {
    for (var i = 0; i < scavengers.length; i++) {
      var scav = scavengers[i];
      if (!scav.scavengerData || !scav.scavengerData.alive) continue;

      var data = scav.scavengerData;
      scav.position.x += data.moveVel.x * delta;
      scav.position.y += data.moveVel.y * delta;
      scav.position.z += data.moveVel.z * delta;

      if (Math.abs(scav.position.x) > 200 || Math.abs(scav.position.y) > 150 || scav.position.z > -30) {
        data.moveVel.x *= -1;
        data.moveVel.y *= -1;
        data.moveVel.z *= -1;
      }

      scav.rotation.y += 0.01;
    }
  }

  function updateBeacons(delta) {
    for (var i = 0; i < debris.length; i++) {
      var obj = debris[i];
      if (obj.debrisData && obj.debrisData.type === 'escapePod') {
        var beaconPhase = (Date.now() * 0.003) % (Math.PI * 2);
        var beaconBrightness = Math.sin(beaconPhase) * 0.4 + 0.6;
        obj.material.emissive.setHSL(0.35, 1, 0.2 * beaconBrightness);
      }
    }
  }

  function updateOxygen(delta) {
    gameState.oxygen = Math.max(0, gameState.oxygen - delta * 5);
    updateHUD();
  }

  function reset() {
    if (hudElement && hudElement.parentNode) {
      hudElement.parentNode.removeChild(hudElement);
      hudElement = null;
    }

    for (var i = 0; i < sceneObjects.length; i++) {
      scene.remove(sceneObjects[i]);
    }

    sceneObjects = [];
    scavengers = [];
    debris = [];

    gameState.scavengersEliminated = 0;
    gameState.salvageRecovered = 0;
    gameState.oxygen = 100;

    document.removeEventListener('keydown', null);
    document.removeEventListener('keyup', null);
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
