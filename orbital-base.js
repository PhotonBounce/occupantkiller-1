window.OrbitalBase = (function() {
  'use strict';

  var scene;
  var objects = [];
  var lights = [];
  var navLights = [];
  var debris = [];
  var solarPanels = [];

  function buildCorridor(x, y, z, length, isVertical) {
    var geometry = new THREE.CylinderGeometry(0.8, 0.8, length, 8, 1);
    var material = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.7, roughness: 0.3 });
    var corridor = new THREE.Mesh(geometry, material);
    corridor.position.set(x, y, z);
    if (!isVertical) {
      corridor.rotation.z = Math.PI / 2;
    }
    scene.add(corridor);
    objects.push(corridor);
    return corridor;
  }

  function buildHabitatRing(x, y, z, radius) {
    var geometry = new THREE.CylinderGeometry(radius, radius, 2, 12, 3);
    var material = new THREE.MeshStandardMaterial({ color: 0x1a4d2e, metalness: 0.6, roughness: 0.4 });
    var ring = new THREE.Mesh(geometry, material);
    ring.position.set(x, y, z);
    scene.add(ring);
    objects.push(ring);

    for (var i = 0; i < 8; i++) {
      var angle = (i / 8) * Math.PI * 2;
      var portX = x + Math.cos(angle) * (radius + 0.5);
      var portZ = z + Math.sin(angle) * (radius + 0.5);
      var portGeometry = new THREE.SphereGeometry(0.3, 8, 8);
      var portMaterial = new THREE.MeshStandardMaterial({ color: 0x0066cc, emissive: 0x003366 });
      var port = new THREE.Mesh(portGeometry, portMaterial);
      port.position.set(portX, y, portZ);
      scene.add(port);
      objects.push(port);
    }
  }

  function buildSolarPanel(x, y, z) {
    var frameGeometry = new THREE.BoxGeometry(0.2, 3, 0.2);
    var frameMaterial = new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.8 });
    var frame = new THREE.Mesh(frameGeometry, frameMaterial);
    frame.position.set(x, y, z);
    scene.add(frame);
    objects.push(frame);

    var panelGeometry = new THREE.BoxGeometry(2.5, 3, 0.05);
    var panelMaterial = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, metalness: 0.5, roughness: 0.2 });
    var panel = new THREE.Mesh(panelGeometry, panelMaterial);
    panel.position.set(x + 1.5, y, z);
    panel.castShadow = true;
    scene.add(panel);
    objects.push(panel);
    solarPanels.push({ mesh: panel, frame: frame, baseX: x, baseY: y, baseZ: z });
  }

  function buildDockingBay(x, y, z) {
    var bayGeometry = new THREE.BoxGeometry(3, 2, 4);
    var bayMaterial = new THREE.MeshStandardMaterial({ color: 0x404040, metalness: 0.5, roughness: 0.5 });
    var bay = new THREE.Mesh(bayGeometry, bayMaterial);
    bay.position.set(x, y, z);
    scene.add(bay);
    objects.push(bay);

    var fighterGeometry = new THREE.ConeGeometry(0.4, 2.5, 8);
    var fighterMaterial = new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.8, roughness: 0.2 });
    var fighter = new THREE.Mesh(fighterGeometry, fighterMaterial);
    fighter.position.set(x, y + 1, z);
    fighter.rotation.z = Math.PI / 2;
    scene.add(fighter);
    objects.push(fighter);
  }

  function buildEscapePodTube(x, y, z) {
    var tubeGeometry = new THREE.CylinderGeometry(0.35, 0.35, 5, 6, 2);
    var tubeMaterial = new THREE.MeshStandardMaterial({ color: 0xff6600, metalness: 0.6, roughness: 0.4 });
    var tube = new THREE.Mesh(tubeGeometry, tubeMaterial);
    tube.position.set(x, y, z);
    scene.add(tube);
    objects.push(tube);

    var podGeometry = new THREE.SphereGeometry(0.45, 8, 8);
    var podMaterial = new THREE.MeshStandardMaterial({ color: 0xff8833, emissive: 0x663300 });
    var pod = new THREE.Mesh(podGeometry, podMaterial);
    pod.position.set(x, y + 3, z);
    scene.add(pod);
    objects.push(pod);
  }

  function buildObservationCupola(x, y, z) {
    var domeGeometry = new THREE.SphereGeometry(1.5, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2);
    var domeMaterial = new THREE.MeshStandardMaterial({ color: 0x0a0a0a, metalness: 0.9, roughness: 0.1, side: THREE.BackSide });
    var dome = new THREE.Mesh(domeGeometry, domeMaterial);
    dome.position.set(x, y, z);
    scene.add(dome);
    objects.push(dome);

    var rimGeometry = new THREE.CylinderGeometry(1.5, 1.5, 0.3, 12);
    var rimMaterial = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.7 });
    var rim = new THREE.Mesh(rimGeometry, rimMaterial);
    rim.position.set(x, y - 0.15, z);
    scene.add(rim);
    objects.push(rim);
  }

  function buildNavigationLight(x, y, z, color) {
    var lightGeometry = new THREE.SphereGeometry(0.15, 6, 6);
    var lightMaterial = new THREE.MeshStandardMaterial({ color: color, emissive: color });
    var lightMesh = new THREE.Mesh(lightGeometry, lightMaterial);
    lightMesh.position.set(x, y, z);
    scene.add(lightMesh);
    objects.push(lightMesh);
    navLights.push({ mesh: lightMesh, color: color, intensity: 0 });
  }

  function buildDebris(x, y, z) {
    var shapes = [
      new THREE.BoxGeometry(0.3, 0.2, 0.15),
      new THREE.SphereGeometry(0.2, 6, 6),
      new THREE.CylinderGeometry(0.1, 0.1, 0.4, 4)
    ];
    var shapeIndex = Math.floor(Math.random() * shapes.length);
    var debrisMaterial = new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.9, roughness: 0.3 });
    var debrisObject = new THREE.Mesh(shapes[shapeIndex], debrisMaterial);
    debrisObject.position.set(x, y, z);
    debrisObject.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
    scene.add(debrisObject);
    objects.push(debrisObject);
    debris.push({
      mesh: debrisObject,
      vx: (Math.random() - 0.5) * 0.02,
      vy: (Math.random() - 0.5) * 0.02,
      vz: (Math.random() - 0.5) * 0.02,
      rx: (Math.random() - 0.5) * 0.01,
      ry: (Math.random() - 0.5) * 0.01,
      rz: (Math.random() - 0.5) * 0.01
    });
  }

  function buildStars() {
    var starGeometry = new THREE.BufferGeometry();
    var starCount = 2000;
    var positions = new Float32Array(starCount * 3);
    for (var i = 0; i < starCount * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 400;
      positions[i + 1] = (Math.random() - 0.5) * 400;
      positions[i + 2] = (Math.random() - 0.5) * 400;
    }
    starGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    var starMaterial = new THREE.PointsMaterial({ color: 0xffffff, size: 0.5 });
    var stars = new THREE.Points(starGeometry, starMaterial);
    scene.add(stars);
    objects.push(stars);
  }

  function init(inputScene, camera) {
    scene = inputScene;
    objects = [];
    lights = [];
    navLights = [];
    debris = [];
    solarPanels = [];

    buildStars();

    buildHabitatRing(0, 0, 0, 4);
    buildHabitatRing(0, 0, 12, 3.5);
    buildHabitatRing(0, 0, -12, 3.5);

    buildCorridor(0, 0, 6, 12, false);
    buildCorridor(0, 0, -6, 12, false);
    buildCorridor(6, 0, 0, 10, true);
    buildCorridor(-6, 0, 0, 10, true);

    buildSolarPanel(8, 0, 0);
    buildSolarPanel(-8, 0, 0);
    buildSolarPanel(8, 0, 10);
    buildSolarPanel(-8, 0, -10);

    buildDockingBay(10, 0, 5);
    buildDockingBay(-10, 0, -5);

    buildEscapePodTube(0, 5, 10);
    buildEscapePodTube(0, 5, -10);
    buildEscapePodTube(5, 5, 0);
    buildEscapePodTube(-5, 5, 0);

    buildObservationCupola(0, 6, 0);

    buildNavigationLight(8, 3, 0, 0xff0000);
    buildNavigationLight(-8, 3, 0, 0x00ff00);
    buildNavigationLight(0, 3, 12, 0x0000ff);
    buildNavigationLight(0, 3, -12, 0xffff00);

    for (var i = 0; i < 25; i++) {
      buildDebris(
        (Math.random() - 0.5) * 30,
        (Math.random() - 0.5) * 20,
        (Math.random() - 0.5) * 30
      );
    }

    var mainLight = new THREE.DirectionalLight(0xffffff, 0.6);
    mainLight.position.set(20, 10, 10);
    scene.add(mainLight);
    lights.push(mainLight);

    var ambientLight = new THREE.AmbientLight(0x404040);
    scene.add(ambientLight);
    lights.push(ambientLight);
  }

  function update(delta) {
    var i;
    for (i = 0; i < solarPanels.length; i++) {
      solarPanels[i].mesh.rotation.y += delta * 0.3;
    }

    for (i = 0; i < navLights.length; i++) {
      navLights[i].intensity = (Math.sin(Date.now() * 0.003 + i) + 1) * 0.5;
      navLights[i].mesh.material.emissiveIntensity = navLights[i].intensity;
    }

    for (i = 0; i < debris.length; i++) {
      var d = debris[i];
      d.mesh.position.x += d.vx;
      d.mesh.position.y += d.vy;
      d.mesh.position.z += d.vz;
      d.mesh.rotation.x += d.rx;
      d.mesh.rotation.y += d.ry;
      d.mesh.rotation.z += d.rz;
    }
  }

  function reset() {
    for (var i = objects.length - 1; i >= 0; i--) {
      scene.remove(objects[i]);
    }
    for (var j = lights.length - 1; j >= 0; j--) {
      scene.remove(lights[j]);
    }
    objects = [];
    lights = [];
    navLights = [];
    debris = [];
    solarPanels = [];
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
