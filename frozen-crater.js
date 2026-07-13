window.FrozenCrater = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var objects = [];
  var particles = [];
  var lights = [];
  var time = 0;

  var matIceBlueDark = null;
  var matIceBlueLight = null;
  var matRockGray = null;
  var matTentOrange = null;
  var matMetalGray = null;
  var matGlowing = null;

  function createMaterials() {
    matIceBlueDark = new THREE.MeshStandardMaterial({
      color: 0x1a4d7a,
      metalness: 0.3,
      roughness: 0.8
    });
    matIceBlueLight = new THREE.MeshStandardMaterial({
      color: 0x4da6ff,
      metalness: 0.4,
      roughness: 0.7
    });
    matRockGray = new THREE.MeshStandardMaterial({
      color: 0x505050,
      metalness: 0.2,
      roughness: 0.9
    });
    matTentOrange = new THREE.MeshStandardMaterial({
      color: 0xff8c00,
      metalness: 0.1,
      roughness: 0.6,
      emissive: 0xff6600,
      emissiveIntensity: 0.4
    });
    matMetalGray = new THREE.MeshStandardMaterial({
      color: 0x888888,
      metalness: 0.8,
      roughness: 0.2
    });
    matGlowing = new THREE.MeshStandardMaterial({
      color: 0x00ffff,
      emissive: 0x00ffff,
      emissiveIntensity: 0.8,
      metalness: 0.5,
      roughness: 0.3
    });
  }

  function addbox(x, y, z, sx, sy, sz, material) {
    var geom = new THREE.BoxGeometry(sx, sy, sz);
    var mesh = new THREE.Mesh(geom, material);
    mesh.position.set(x, y, z);
    scene.add(mesh);
    objects.push(mesh);
    return mesh;
  }

  function addcylinder(x, y, z, rTop, rBottom, height, material) {
    var geom = new THREE.CylinderGeometry(rTop, rBottom, height, 16);
    var mesh = new THREE.Mesh(geom, material);
    mesh.position.set(x, y, z);
    scene.add(mesh);
    objects.push(mesh);
    return mesh;
  }

  function addsphere(x, y, z, radius, material) {
    var geom = new THREE.SphereGeometry(radius, 16, 16);
    var mesh = new THREE.Mesh(geom, material);
    mesh.position.set(x, y, z);
    scene.add(mesh);
    objects.push(mesh);
    return mesh;
  }

  function addcone(x, y, z, radius, height, material) {
    var geom = new THREE.ConeGeometry(radius, height, 12);
    var mesh = new THREE.Mesh(geom, material);
    mesh.position.set(x, y, z);
    scene.add(mesh);
    objects.push(mesh);
    return mesh;
  }

  function addlines(points, material) {
    var geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.BufferAttribute(new Float32Array(points), 3));
    var line = new THREE.LineSegments(geom, material);
    scene.add(line);
    objects.push(line);
    return line;
  }

  function createcraterfloor() {
    var archerr = 35;
    var floory = -8;
    addbox(0, floory, 0, 70, 2, 70, matIceBlueDark);

    var rimpoints = [];
    for (var i = 0; i < 32; i++) {
      var angle = (i / 32) * Math.PI * 2;
      var x1 = Math.cos(angle) * archerr;
      var z1 = Math.sin(angle) * archerr;
      var x2 = Math.cos(angle) * (archerr + 1);
      var z2 = Math.sin(angle) * (archerr + 1);
      rimpoints.push(x1, floory + 2, z1);
      rimpoints.push(x2, floory + 2, z2);
    }
    var rimmat = new THREE.LineBasicMaterial({ color: 0x2d5a8c });
    addlines(rimpoints, rimmat);
  }

  function createcraterrim() {
    var rimradius = 35;
    var rimheight = 12;
    var rimwidth = 8;

    for (var i = 0; i < 8; i++) {
      var angle = (i / 8) * Math.PI * 2;
      var x = Math.cos(angle) * rimradius;
      var z = Math.sin(angle) * rimradius;
      addcone(x, 2, z, rimwidth, rimheight, matRockGray);
    }
  }

  function createalientartifact() {
    var artifacty = -5;
    var coregeom = new THREE.SphereGeometry(3, 12, 12);
    var coremesh = new THREE.Mesh(coregeom, matGlowing);
    coremesh.position.set(0, artifacty, 0);
    coremesh.userData.isartifact = true;
    scene.add(coremesh);
    objects.push(coremesh);

    addcylinder(0, artifacty - 2, 0, 2.5, 2.5, 4, matMetalGray);
    addcylinder(0, artifacty + 2, 0, 2, 2, 3, matMetalGray);

    for (var i = 0; i < 4; i++) {
      var angle = (i / 4) * Math.PI * 2;
      var x = Math.cos(angle) * 4;
      var z = Math.sin(angle) * 4;
      addbox(x, artifacty, z, 1, 4, 1, matMetalGray);
    }
  }

  function createiceformations() {
    addcone(12, -6, 15, 2.5, 8, matIceBlueLight);
    addcone(-18, -5, 12, 2, 7, matIceBlueLight);
    addcone(20, -4, -10, 3, 9, matIceBlueLight);
    addcone(-15, -6, -18, 2.5, 6, matIceBlueLight);
    addcone(28, -5, 8, 2, 7, matIceBlueLight);

    addsphere(10, -7, 25, 1.5, matIceBlueLight);
    addsphere(-25, -7, 8, 1.8, matIceBlueLight);
    addsphere(18, -6, -20, 1.6, matIceBlueLight);
  }

  function createmilitarycamp() {
    var rimx = 30;
    var rimz = -25;
    var rimh = 5;

    addbox(rimx, rimh, rimz, 4, 3.5, 6, matTentOrange);
    addbox(rimx + 10, rimh, rimz, 4, 3.5, 6, matTentOrange);
    addbox(rimx - 10, rimh, rimz, 4, 3.5, 6, matTentOrange);

    addbox(rimx, rimh - 4, rimz + 4, 12, 1, 8, matMetalGray);

    addcylinder(rimx + 6, rimh - 2, rimz - 5, 0.8, 0.8, 4, matMetalGray);
    addcylinder(rimx - 6, rimh - 2, rimz + 5, 0.8, 0.8, 4, matMetalGray);
  }

  function createdrillequipment() {
    var drillfx = -28;
    var drillfz = 22;
    var drillh = 3;

    addcylinder(drillfx, drillh + 4, drillfz, 1.5, 1.5, 8, matMetalGray);
    addbox(drillfx, drillh, drillfz, 6, 2, 6, matMetalGray);
    addcone(drillfx, drillh + 6, drillfz, 1.2, 2, matMetalGray);

    addbox(drillfx + 5, drillh + 1, drillfz, 2, 3, 2, matMetalGray);
    addcylinder(drillfx - 5, drillh + 2, drillfz, 0.6, 0.6, 5, matMetalGray);
  }

  function createicecaves() {
    var cavex1 = -32;
    var cavez1 = -30;
    var cavey = 2;

    addbox(cavex1, cavey, cavez1, 5, 4, 8, matIceBlueDark);
    addbox(cavex1 + 8, cavey, cavez1 - 5, 4, 3, 6, matIceBlueDark);

    var cavex2 = 32;
    var cavez2 = 25;
    addbox(cavex2, cavey, cavez2, 6, 5, 7, matIceBlueDark);
    addbox(cavex2 - 6, cavey - 2, cavez2 + 8, 4, 3, 5, matIceBlueDark);
  }

  function createfrozensoliders() {
    addbox(-20, -4, 18, 1, 3, 1.5, matMetalGray);
    addbox(-18, -3, 20, 1, 2.5, 1.5, matMetalGray);
    addbox(-22, -5, 22, 1.5, 2, 1, matMetalGray);
    addbox(22, -4, -22, 1, 3, 1.5, matMetalGray);
    addbox(24, -3, -20, 1, 2.8, 1.5, matMetalGray);
  }

  function createsupplysleds() {
    addbox(15, -6, 18, 3, 1.5, 5, matMetalGray);
    addcylinder(14, -5.5, 16, 0.5, 0.5, 2, matMetalGray);
    addcylinder(16, -5.5, 20, 0.5, 0.5, 2, matMetalGray);

    addbox(-12, -6, -15, 3, 1.5, 5, matMetalGray);
    addcylinder(-13, -5.5, -17, 0.5, 0.5, 2, matMetalGray);
    addcylinder(-11, -5.5, -13, 0.5, 0.5, 2, matMetalGray);
  }

  function createhelicoptercrash() {
    var helox = 35;
    var heloz = 30;
    var heloh = 1;

    addbox(helox, heloh, heloz, 8, 1.5, 12, matMetalGray);
    addcone(helox - 2, heloh + 3, heloz, 1, 4, matMetalGray);
    addcone(helox + 2, heloh + 3, heloz, 1, 4, matMetalGray);

    addbox(helox, heloh + 1, heloz - 6, 4, 2, 3, matMetalGray);
    addcylinder(helox - 3, heloh, heloz + 5, 0.4, 0.4, 1.5, matMetalGray);
  }

  function createcoverpods() {
    addbox(-8, -5, 8, 4, 3, 4, matRockGray);
    addbox(8, -5, -8, 4, 3, 4, matRockGray);
    addbox(0, -5, -12, 3, 2.5, 3, matRockGray);
    addbox(-28, -4, 10, 5, 2, 4, matRockGray);
    addbox(26, -4, -15, 5, 2, 4, matRockGray);
  }

  function createparticleeffects() {
    particles = [];

    for (var i = 0; i < 150; i++) {
      var particle = {
        x: (Math.random() - 0.5) * 80,
        y: Math.random() * 25,
        z: (Math.random() - 0.5) * 80,
        vx: (Math.random() - 0.5) * 2,
        vy: -Math.random() * 1.5,
        vz: (Math.random() - 0.5) * 2,
        life: Math.random() * 10,
        maxlife: 10
      };
      particles.push(particle);
    }
  }

  function createlights() {
    var amblight = new THREE.AmbientLight(0x4da6ff, 0.6);
    scene.add(amblight);
    lights.push(amblight);

    var dirlight = new THREE.DirectionalLight(0xffffff, 0.5);
    dirlight.position.set(20, 25, 15);
    scene.add(dirlight);
    lights.push(dirlight);

    var pointlight1 = new THREE.PointLight(0xff8c00, 1.5, 50);
    pointlight1.position.set(30, 8, -25);
    scene.add(pointlight1);
    lights.push(pointlight1);

    var pointlight2 = new THREE.PointLight(0x00ffff, 1, 40);
    pointlight2.position.set(0, 0, 0);
    scene.add(pointlight2);
    lights.push(pointlight2);
  }

  function updateparticles(delta) {
    var i;
    for (i = 0; i < particles.length; i++) {
      var p = particles[i];
      p.x += p.vx * delta;
      p.y += p.vy * delta;
      p.z += p.vz * delta;
      p.life -= delta;

      if (p.life <= 0) {
        p.x = (Math.random() - 0.5) * 80;
        p.y = Math.random() * 25 + 5;
        p.z = (Math.random() - 0.5) * 80;
        p.life = p.maxlife;
      }
    }
  }

  function updateartifact(delta) {
    var i;
    for (i = 0; i < objects.length; i++) {
      if (objects[i].userData && objects[i].userData.isartifact) {
        var scale = 1 + Math.sin(time * 3) * 0.15;
        objects[i].scale.set(scale, scale, scale);
        objects[i].rotation.y += delta * 0.5;
      }
    }
  }

  function updateauroralights(delta) {
    var aurorap = Math.sin(time * 0.5) * 0.5 + 0.5;
    if (lights.length > 1) {
      lights[1].intensity = 0.5 + aurorap * 0.3;
      var c1 = 0x4da6ff;
      var c2 = 0x00ff99;
      lights[1].color.setHex(c1);
    }
  }

  function updatetentglow(delta) {
    var i;
    for (i = 0; i < objects.length; i++) {
      var obj = objects[i];
      if (obj.material === matTentOrange) {
        var intensity = 0.4 + Math.sin(time * 2) * 0.2;
        obj.material.emissiveIntensity = intensity;
      }
    }
  }

  function init(initscene, initcamera) {
    scene = initscene;
    camera = initcamera;

    createMaterials();
    createcraterfloor();
    createcraterrim();
    createalientartifact();
    createiceformations();
    createmilitarycamp();
    createdrillequipment();
    createicecaves();
    createfrozensoliders();
    createsupplysleds();
    createhelicoptercrash();
    createcoverpods();
    createparticleeffects();
    createlights();
  }

  function update(delta) {
    time += delta;

    updateparticles(delta);
    updateartifact(delta);
    updateauroralights(delta);
    updatetentglow(delta);
  }

  function reset() {
    var i;
    for (i = objects.length - 1; i >= 0; i--) {
      scene.remove(objects[i]);
    }
    objects = [];

    for (i = lights.length - 1; i >= 0; i--) {
      scene.remove(lights[i]);
    }
    lights = [];

    particles = [];
    time = 0;
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
