window.SpacePrison = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var objects = [];
  var animatedObjects = [];
  var time = 0;

  function init(sceneRef, cameraRef) {
    scene = sceneRef;
    camera = cameraRef;
    objects = [];
    animatedObjects = [];
    time = 0;

    // Orbital prison ring structure - large hollow cylinder
    var ringGeometry = new THREE.CylinderGeometry(80, 80, 20, 32, 8, true);
    var ringMaterial = new THREE.MeshPhongMaterial({ color: 0x334455 });
    var ring = new THREE.Mesh(ringGeometry, ringMaterial);
    ring.position.set(0, 0, 0);
    ring.rotation.z = Math.PI / 2;
    scene.add(ring);
    objects.push(ring);

    // Cellblock corridors - dark metal corridors
    var corridorGeometry = new THREE.BoxGeometry(60, 8, 4);
    var corridorMaterial = new THREE.MeshPhongMaterial({ color: 0x333344 });
    var corridor1 = new THREE.Mesh(corridorGeometry, corridorMaterial);
    corridor1.position.set(0, 20, 0);
    scene.add(corridor1);
    objects.push(corridor1);

    var corridor2 = new THREE.Mesh(corridorGeometry, corridorMaterial);
    corridor2.position.set(0, -20, 0);
    scene.add(corridor2);
    objects.push(corridor2);

    // Prisoner containment pods - blue energy pods with emissive
    var podGeometry = new THREE.CylinderGeometry(3, 3, 8, 16);
    var podMaterial = new THREE.MeshPhongMaterial({
      color: 0x2244AA,
      emissive: 0x0088FF,
      emissiveIntensity: 0.5
    });
    var pod1 = new THREE.Mesh(podGeometry, podMaterial);
    pod1.position.set(-25, 15, -10);
    scene.add(pod1);
    objects.push(pod1);
    animatedObjects.push({ object: pod1, type: 'pod', intensity: 0.5 });

    var pod2 = new THREE.Mesh(podGeometry, podMaterial);
    pod2.position.set(25, 15, -10);
    scene.add(pod2);
    objects.push(pod2);
    animatedObjects.push({ object: pod2, type: 'pod', intensity: 0.5 });

    var pod3 = new THREE.Mesh(podGeometry, podMaterial);
    pod3.position.set(-25, -15, 10);
    scene.add(pod3);
    objects.push(pod3);
    animatedObjects.push({ object: pod3, type: 'pod', intensity: 0.5 });

    // Warden control tower - boxgeometry with emissive screens
    var towerGeometry = new THREE.BoxGeometry(12, 16, 10);
    var towerMaterial = new THREE.MeshPhongMaterial({ color: 0x445566 });
    var tower = new THREE.Mesh(towerGeometry, towerMaterial);
    tower.position.set(40, 25, 15);
    scene.add(tower);
    objects.push(tower);

    // Control tower screens
    var screenGeometry = new THREE.BoxGeometry(10, 6, 0.5);
    var screenMaterial = new THREE.MeshPhongMaterial({
      color: 0x00AAFF,
      emissive: 0x00AAFF,
      emissiveIntensity: 0.8
    });
    var screen = new THREE.Mesh(screenGeometry, screenMaterial);
    screen.position.set(40, 25, 20);
    scene.add(screen);
    objects.push(screen);
    animatedObjects.push({ object: screen, type: 'screen', intensity: 0.8 });

    // Force field barriers - LineSegments grid with emissive
    var fieldGeometry = new THREE.BufferGeometry();
    var fieldVertices = [];
    for (var i = -30; i <= 30; i += 10) {
      fieldVertices.push(i, 0, -40, i, 0, 40);
      fieldVertices.push(-30, 0, i, 30, 0, i);
    }
    fieldGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(fieldVertices), 3));
    var fieldMaterial = new THREE.LineBasicMaterial({
      color: 0x0088FF,
      linewidth: 2,
      emissive: 0x0088FF
    });
    var forceField = new THREE.LineSegments(fieldGeometry, fieldMaterial);
    forceField.position.set(0, 10, 0);
    scene.add(forceField);
    objects.push(forceField);
    animatedObjects.push({ object: forceField, type: 'field', intensity: 0.7 });

    // Guard robot patrol units - box body + cylinder head
    var bodyGeometry = new THREE.BoxGeometry(2, 3, 1.5);
    var bodyMaterial = new THREE.MeshPhongMaterial({ color: 0x444444 });
    var robotBody = new THREE.Mesh(bodyGeometry, bodyMaterial);
    robotBody.position.set(-35, 5, 0);
    scene.add(robotBody);
    objects.push(robotBody);

    var headGeometry = new THREE.CylinderGeometry(1.2, 1, 1.5, 8);
    var headMaterial = new THREE.MeshPhongMaterial({ color: 0x555555 });
    var robotHead = new THREE.Mesh(headGeometry, headMaterial);
    robotHead.position.set(-35, 7.5, 0);
    scene.add(robotHead);
    objects.push(robotHead);
    animatedObjects.push({ object: robotBody, type: 'robot', head: robotHead });

    var robotBody2 = new THREE.Mesh(bodyGeometry, bodyMaterial);
    robotBody2.position.set(35, 5, 0);
    scene.add(robotBody2);
    objects.push(robotBody2);

    var robotHead2 = new THREE.Mesh(headGeometry, headMaterial);
    robotHead2.position.set(35, 7.5, 0);
    scene.add(robotHead2);
    objects.push(robotHead2);
    animatedObjects.push({ object: robotBody2, type: 'robot', head: robotHead2 });

    // Zero-G combat arena - open box
    var arenaGeometry = new THREE.BoxGeometry(50, 30, 40);
    var arenaMaterial = new THREE.MeshPhongMaterial({
      color: 0x111122,
      wireframe: false
    });
    var arena = new THREE.Mesh(arenaGeometry, arenaMaterial);
    arena.position.set(0, -15, 60);
    scene.add(arena);
    objects.push(arena);

    // Floating debris - spheres
    var debrisGeometry = new THREE.SphereGeometry(0.8, 8, 8);
    var debrisMaterial = new THREE.MeshPhongMaterial({ color: 0x777788 });
    var debris1 = new THREE.Mesh(debrisGeometry, debrisMaterial);
    debris1.position.set(-15, -10, 60);
    scene.add(debris1);
    objects.push(debris1);
    animatedObjects.push({ object: debris1, type: 'debris' });

    var debris2 = new THREE.Mesh(debrisGeometry, debrisMaterial);
    debris2.position.set(10, -5, 70);
    scene.add(debris2);
    objects.push(debris2);
    animatedObjects.push({ object: debris2, type: 'debris' });

    var debris3 = new THREE.Mesh(debrisGeometry, debrisMaterial);
    debris3.position.set(5, -15, 50);
    scene.add(debris3);
    objects.push(debris3);
    animatedObjects.push({ object: debris3, type: 'debris' });

    // Escape route vents - cylinder with grate
    var ventGeometry = new THREE.CylinderGeometry(4, 4, 2, 12);
    var ventMaterial = new THREE.MeshPhongMaterial({ color: 0x555544 });
    var vent1 = new THREE.Mesh(ventGeometry, ventMaterial);
    vent1.position.set(-50, 10, -20);
    scene.add(vent1);
    objects.push(vent1);

    var grateGeometry = new THREE.BoxGeometry(3.5, 3.5, 0.3);
    var grateMaterial = new THREE.MeshPhongMaterial({ color: 0x666655 });
    var grate1 = new THREE.Mesh(grateGeometry, grateMaterial);
    grate1.position.set(-50, 10, 1.5);
    scene.add(grate1);
    objects.push(grate1);

    // Emergency stasis lockdown pods - sealed cylinders
    var stasisGeometry = new THREE.CylinderGeometry(2.5, 2.5, 6, 12);
    var stasisMaterial = new THREE.MeshPhongMaterial({ color: 0x334433 });
    var stasis1 = new THREE.Mesh(stasisGeometry, stasisMaterial);
    stasis1.position.set(50, 5, -15);
    scene.add(stasis1);
    objects.push(stasis1);

    var stasis2 = new THREE.Mesh(stasisGeometry, stasisMaterial);
    stasis2.position.set(55, 5, 5);
    scene.add(stasis2);
    objects.push(stasis2);

    // Armory vault - heavy box with alarm light
    var vaultGeometry = new THREE.BoxGeometry(15, 12, 10);
    var vaultMaterial = new THREE.MeshPhongMaterial({ color: 0x444433 });
    var vault = new THREE.Mesh(vaultGeometry, vaultMaterial);
    vault.position.set(0, -25, -30);
    scene.add(vault);
    objects.push(vault);

    // Armory alarm light
    var alarmGeometry = new THREE.SphereGeometry(1.5, 8, 8);
    var alarmMaterial = new THREE.MeshPhongMaterial({
      color: 0xFF2200,
      emissive: 0xFF2200,
      emissiveIntensity: 0.6
    });
    var alarm = new THREE.Mesh(alarmGeometry, alarmMaterial);
    alarm.position.set(0, -12, -35);
    scene.add(alarm);
    objects.push(alarm);
    animatedObjects.push({ object: alarm, type: 'alarm', intensity: 0.6 });

    // Space viewing port windows - boxes with stars
    var windowGeometry = new THREE.BoxGeometry(8, 8, 0.5);
    var windowMaterial = new THREE.MeshPhongMaterial({
      color: 0x001133,
      transparent: true,
      opacity: 0.7
    });
    var window1 = new THREE.Mesh(windowGeometry, windowMaterial);
    window1.position.set(-60, 0, 0);
    scene.add(window1);
    objects.push(window1);

    var starGeometry = new THREE.SphereGeometry(0.3, 4, 4);
    var starMaterial = new THREE.MeshPhongMaterial({
      color: 0xFFFFFF,
      emissive: 0xFFFFFF
    });
    var star1 = new THREE.Mesh(starGeometry, starMaterial);
    star1.position.set(-65, 5, 5);
    scene.add(star1);
    objects.push(star1);

    var star2 = new THREE.Mesh(starGeometry, starMaterial);
    star2.position.set(-65, -5, -5);
    scene.add(star2);
    objects.push(star2);

    // Cryogenic prisoner storage - ice-blue emissive cylinders
    var cryoGeometry = new THREE.CylinderGeometry(3, 3, 12, 16);
    var cryoMaterial = new THREE.MeshPhongMaterial({
      color: 0x1133AA,
      emissive: 0x0055FF,
      emissiveIntensity: 0.4
    });
    var cryo1 = new THREE.Mesh(cryoGeometry, cryoMaterial);
    cryo1.position.set(20, 15, -40);
    scene.add(cryo1);
    objects.push(cryo1);
    animatedObjects.push({ object: cryo1, type: 'cryo', intensity: 0.4 });

    var cryo2 = new THREE.Mesh(cryoGeometry, cryoMaterial);
    cryo2.position.set(-20, 15, -40);
    scene.add(cryo2);
    objects.push(cryo2);
    animatedObjects.push({ object: cryo2, type: 'cryo', intensity: 0.4 });

    // Security drone launch bay
    var bayGeometry = new THREE.BoxGeometry(20, 10, 15);
    var bayMaterial = new THREE.MeshPhongMaterial({ color: 0x334455 });
    var bay = new THREE.Mesh(bayGeometry, bayMaterial);
    bay.position.set(-30, -20, 50);
    scene.add(bay);
    objects.push(bay);

    // Security drones - sphere drones
    var droneGeometry = new THREE.SphereGeometry(1.5, 8, 8);
    var droneMaterial = new THREE.MeshPhongMaterial({ color: 0x555566 });
    var drone1 = new THREE.Mesh(droneGeometry, droneMaterial);
    drone1.position.set(-30, -15, 50);
    scene.add(drone1);
    objects.push(drone1);
    animatedObjects.push({ object: drone1, type: 'drone', center: { x: -30, y: -15, z: 50 }, radius: 8 });

    var drone2 = new THREE.Mesh(droneGeometry, droneMaterial);
    drone2.position.set(-30, -15, 50);
    scene.add(drone2);
    objects.push(drone2);
    animatedObjects.push({ object: drone2, type: 'drone', center: { x: -30, y: -15, z: 50 }, radius: 8, offset: Math.PI });

    // Power reactor core - pulsing sphere
    var reactorGeometry = new THREE.SphereGeometry(6, 16, 16);
    var reactorMaterial = new THREE.MeshPhongMaterial({
      color: 0x0055FF,
      emissive: 0x0055FF,
      emissiveIntensity: 0.8,
      wireframe: false
    });
    var reactor = new THREE.Mesh(reactorGeometry, reactorMaterial);
    reactor.position.set(30, -30, 70);
    scene.add(reactor);
    objects.push(reactor);
    animatedObjects.push({ object: reactor, type: 'reactor', intensity: 0.8 });
  }

  function update(delta) {
    time += delta;

    for (var i = 0; i < animatedObjects.length; i++) {
      var item = animatedObjects[i];

      if (item.type === 'pod') {
        var podPulse = 0.3 + 0.3 * Math.sin(time * 3);
        item.object.material.emissiveIntensity = 0.5 + podPulse;
      }

      if (item.type === 'screen') {
        var screenFlicker = 0.7 + 0.3 * Math.sin(time * 4 + Math.random());
        item.object.material.emissiveIntensity = Math.max(0.4, screenFlicker);
      }

      if (item.type === 'field') {
        var fieldFlicker = 0.5 + 0.5 * Math.sin(time * 5);
        item.object.material.linewidth = 1 + Math.abs(Math.sin(time * 4)) * 2;
      }

      if (item.type === 'robot') {
        var robotZ = Math.sin(time * 0.5) * 15;
        item.object.position.z = robotZ;
        if (item.head) {
          item.head.position.z = robotZ;
        }
      }

      if (item.type === 'debris') {
        item.object.rotation.x += delta * 0.3;
        item.object.rotation.y += delta * 0.4;
        item.object.rotation.z += delta * 0.2;
      }

      if (item.type === 'alarm') {
        var alarmBlink = Math.abs(Math.sin(time * 6));
        item.object.material.emissiveIntensity = 0.3 + alarmBlink * 0.7;
      }

      if (item.type === 'cryo') {
        var cryoGlow = 0.2 + 0.3 * Math.sin(time * 2);
        item.object.material.emissiveIntensity = 0.4 + cryoGlow;
      }

      if (item.type === 'drone') {
        var orbitAngle = (time * 0.4) + (item.offset || 0);
        var orbitX = item.center.x + Math.cos(orbitAngle) * item.radius;
        var orbitZ = item.center.z + Math.sin(orbitAngle) * item.radius;
        item.object.position.x = orbitX;
        item.object.position.z = orbitZ;
        item.object.rotation.y += delta * 1.5;
      }

      if (item.type === 'reactor') {
        var reactorGlow = 0.5 + 0.5 * Math.sin(time * 2);
        item.object.material.emissiveIntensity = 0.8 + reactorGlow;
        item.object.rotation.x += delta * 0.2;
        item.object.rotation.y += delta * 0.3;
      }
    }
  }

  function reset() {
    for (var i = 0; i < objects.length; i++) {
      scene.remove(objects[i]);
    }
    objects = [];
    animatedObjects = [];
    time = 0;
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
