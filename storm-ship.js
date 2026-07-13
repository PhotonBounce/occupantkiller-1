window.StormShip = (function() {
  'use strict';

  var scene;
  var camera;
  var lightningLight;
  var particles;
  var waveTime;
  var radarDish;
  var turrets;
  var objects;

  function init(_scene, _camera) {
    scene = _scene;
    camera = _camera;
    waveTime = 0;
    turrets = [];
    objects = [];

    scene.background = new THREE.Color(0x1a2835);
    scene.fog = new THREE.Fog(0x1a2835, 150, 200);

    buildhull();
    buildbridge();
    buildgun();
    buildcontainers();
    buildradar();
    buildwaveeffects();
    buildenvironment();
    builddynamiclights();
  }

  function buildhull() {
    var hullmaterial = new THREE.MeshStandardMaterial({ color: 0x445566, metalness: 0.6, roughness: 0.4 });
    var rustmaterial = new THREE.MeshStandardMaterial({ color: 0x8b4513, metalness: 0.3, roughness: 0.8 });

    var mainbody = new THREE.Mesh(new THREE.BoxGeometry(40, 12, 20), hullmaterial);
    mainbody.position.set(0, 5, 0);
    mainbody.castShadow = true;
    mainbody.receiveShadow = true;
    scene.add(mainbody);
    objects.push(mainbody);

    var rightside = new THREE.Mesh(new THREE.BoxGeometry(2, 15, 22), rustmaterial);
    rightside.position.set(20, 8, 0);
    rightside.castShadow = true;
    rightside.receiveShadow = true;
    scene.add(rightside);
    objects.push(rightside);

    var leftside = new THREE.Mesh(new THREE.BoxGeometry(2, 15, 22), rustmaterial);
    leftside.position.set(-20, 8, 0);
    leftside.castShadow = true;
    leftside.receiveShadow = true;
    scene.add(leftside);
    objects.push(leftside);

    var backplate = new THREE.Mesh(new THREE.BoxGeometry(42, 14, 2), hullmaterial);
    backplate.position.set(0, 7, 9);
    backplate.castShadow = true;
    backplate.receiveShadow = true;
    scene.add(backplate);
    objects.push(backplate);

    var frontplate = new THREE.Mesh(new THREE.BoxGeometry(42, 14, 2), hullmaterial);
    frontplate.position.set(0, 7, -9);
    frontplate.castShadow = true;
    frontplate.receiveShadow = true;
    scene.add(frontplate);
    objects.push(frontplate);

    var bottomplate = new THREE.Mesh(new THREE.BoxGeometry(42, 2, 22), hullmaterial);
    bottomplate.position.set(0, 0, 0);
    bottomplate.castShadow = true;
    bottomplate.receiveShadow = true;
    scene.add(bottomplate);
    objects.push(bottomplate);

    var rupturedeck = new THREE.Mesh(new THREE.BoxGeometry(35, 8, 18), hullmaterial);
    rupturedeck.position.set(-8, 13, 0);
    rupturedeck.rotation.z = 0.3;
    rupturedeck.castShadow = true;
    rupturedeck.receiveShadow = true;
    scene.add(rupturedeck);
    objects.push(rupturedeck);

    var engineroom = new THREE.Mesh(new THREE.BoxGeometry(15, 10, 12), hullmaterial);
    engineroom.position.set(15, 8, 0);
    engineroom.castShadow = true;
    engineroom.receiveShadow = true;
    scene.add(engineroom);
    objects.push(engineroom);
  }

  function buildbridge() {
    var metalmaterial = new THREE.MeshStandardMaterial({ color: 0x4a5568, metalness: 0.7, roughness: 0.3 });
    var windowmaterial = new THREE.MeshStandardMaterial({ color: 0x1a2835, metalness: 0.8, roughness: 0.1 });

    var basepillar = new THREE.Mesh(new THREE.CylinderGeometry(3, 4, 8, 8), metalmaterial);
    basepillar.position.set(-15, 15, 3);
    basepillar.castShadow = true;
    basepillar.receiveShadow = true;
    scene.add(basepillar);
    objects.push(basepillar);

    var bridgestructure = new THREE.Mesh(new THREE.BoxGeometry(8, 6, 10), metalmaterial);
    bridgestructure.position.set(-15, 24, 3);
    bridgestructure.castShadow = true;
    bridgestructure.receiveShadow = true;
    scene.add(bridgestructure);
    objects.push(bridgestructure);

    var radarpost = new THREE.Mesh(new THREE.CylinderGeometry(2, 2.5, 6, 6), metalmaterial);
    radarpost.position.set(-15, 28, -4);
    radarpost.castShadow = true;
    radarpost.receiveShadow = true;
    scene.add(radarpost);
    objects.push(radarpost);

    var antenna1 = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 4, 4), metalmaterial);
    antenna1.position.set(-12, 32, 2);
    antenna1.castShadow = true;
    antenna1.receiveShadow = true;
    scene.add(antenna1);
    objects.push(antenna1);

    var antenna2 = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 5, 4), metalmaterial);
    antenna2.position.set(-18, 33, 2);
    antenna2.rotation.z = 0.2;
    antenna2.castShadow = true;
    antenna2.receiveShadow = true;
    scene.add(antenna2);
    objects.push(antenna2);
  }

  function buildgun() {
    var gunmetal = new THREE.MeshStandardMaterial({ color: 0x2d3436, metalness: 0.8, roughness: 0.2 });
    var turretmaterial = new THREE.MeshStandardMaterial({ color: 0x454d55, metalness: 0.6, roughness: 0.5 });

    var leftturretbase = new THREE.Mesh(new THREE.CylinderGeometry(4, 5, 4, 8), turretmaterial);
    leftturretbase.position.set(-8, 13, 8);
    leftturretbase.castShadow = true;
    leftturretbase.receiveShadow = true;
    scene.add(leftturretbase);
    objects.push(leftturretbase);

    var leftgun = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 1, 12, 6), gunmetal);
    leftgun.position.set(-8, 16, 8);
    leftgun.rotation.z = 0.4;
    leftgun.castShadow = true;
    leftgun.receiveShadow = true;
    scene.add(leftgun);
    objects.push(leftgun);
    turrets.push({ mesh: leftgun, baseangle: 0.4 });

    var rightturretbase = new THREE.Mesh(new THREE.CylinderGeometry(4, 5, 4, 8), turretmaterial);
    rightturretbase.position.set(12, 13, -10);
    rightturretbase.castShadow = true;
    rightturretbase.receiveShadow = true;
    scene.add(rightturretbase);
    objects.push(rightturretbase);

    var rightgun = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 1, 11, 6), gunmetal);
    rightgun.position.set(12, 15, -10);
    rightgun.rotation.z = -0.5;
    rightgun.castShadow = true;
    rightgun.receiveShadow = true;
    scene.add(rightgun);
    objects.push(rightgun);
    turrets.push({ mesh: rightgun, baseangle: -0.5 });

    var centerturretbase = new THREE.Mesh(new THREE.CylinderGeometry(3.5, 4.5, 3, 8), turretmaterial);
    centerturretbase.position.set(0, 12, -8);
    centerturretbase.castShadow = true;
    centerturretbase.receiveShadow = true;
    scene.add(centerturretbase);
    objects.push(centerturretbase);

    var centergun = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.9, 10, 6), gunmetal);
    centergun.position.set(0, 15, -8);
    centergun.rotation.z = -0.6;
    centergun.castShadow = true;
    centergun.receiveShadow = true;
    scene.add(centergun);
    objects.push(centergun);
    turrets.push({ mesh: centergun, baseangle: -0.6 });
  }

  function buildcontainers() {
    var containermaterial = new THREE.MeshStandardMaterial({ color: 0xff6b35, metalness: 0.5, roughness: 0.6 });
    var container1 = new THREE.Mesh(new THREE.BoxGeometry(4, 3, 4), containermaterial);
    container1.position.set(8, 6, -12);
    container1.castShadow = true;
    container1.receiveShadow = true;
    scene.add(container1);
    objects.push(container1);

    var container2 = new THREE.Mesh(new THREE.BoxGeometry(4, 3, 4), containermaterial);
    container2.position.set(12, 6, -10);
    container2.rotation.z = 0.15;
    container2.castShadow = true;
    container2.receiveShadow = true;
    scene.add(container2);
    objects.push(container2);

    var container3 = new THREE.Mesh(new THREE.BoxGeometry(4, 3, 4), containermaterial);
    container3.position.set(18, 5, -8);
    container3.rotation.z = 0.25;
    container3.castShadow = true;
    container3.receiveShadow = true;
    scene.add(container3);
    objects.push(container3);

    var container4 = new THREE.Mesh(new THREE.BoxGeometry(5, 2, 3), containermaterial);
    container4.position.set(-12, 7, 6);
    container4.castShadow = true;
    container4.receiveShadow = true;
    scene.add(container4);
    objects.push(container4);

    var liferaft = new THREE.Mesh(new THREE.CylinderGeometry(2, 2, 1, 8), containermaterial);
    liferaft.position.set(22, 12, 5);
    liferaft.castShadow = true;
    liferaft.receiveShadow = true;
    scene.add(liferaft);
    objects.push(liferaft);
  }

  function buildradar() {
    var radarmaterial = new THREE.MeshStandardMaterial({ color: 0x34495e, metalness: 0.8, roughness: 0.3 });
    var mashmaterial = new THREE.MeshStandardMaterial({ color: 0x445566, metalness: 0.6, roughness: 0.5 });

    var fallenmaststub = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 2, 4, 8), mashmaterial);
    fallenmaststub.position.set(20, 18, -5);
    fallenmaststub.rotation.z = 1.5;
    fallenmaststub.castShadow = true;
    fallenmaststub.receiveShadow = true;
    scene.add(fallenmaststub);
    objects.push(fallenmaststub);

    var radarbase = new THREE.Mesh(new THREE.CylinderGeometry(3, 3.5, 1, 12), radarmaterial);
    radarbase.position.set(-20, 25, 2);
    radarbase.castShadow = true;
    radarbase.receiveShadow = true;
    scene.add(radarbase);
    objects.push(radarbase);

    var radardish = new THREE.Mesh(new THREE.SphereGeometry(2.5, 8, 6), radarmaterial);
    radardish.position.set(-20, 27, 2);
    radardish.castShadow = true;
    radardish.receiveShadow = true;
    scene.add(radardish);
    objects.push(radardish);
    radarDish = radardish;
  }

  function buildwaveeffects() {
    var particlecount = 200;
    var particlegeometry = new THREE.BufferGeometry();
    var positions = new Float32Array(particlecount * 3);
    var velocities = new Float32Array(particlecount * 3);

    for (var i = 0; i < particlecount; i++) {
      var idx = i * 3;
      positions[idx] = (Math.random() - 0.5) * 80;
      positions[idx + 1] = Math.random() * 30;
      positions[idx + 2] = (Math.random() - 0.5) * 80;

      velocities[idx] = (Math.random() - 0.5) * 15;
      velocities[idx + 1] = (Math.random() - 0.5) * 20;
      velocities[idx + 2] = (Math.random() - 0.5) * 15;
    }

    particlegeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particlegeometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));

    var particlematerial = new THREE.PointsMaterial({ color: 0xcccccc, size: 0.5, transparent: true, opacity: 0.6 });
    particles = new THREE.Points(particlegeometry, particlematerial);
    scene.add(particles);
  }

  function buildenvironment() {
    var rockmaterial = new THREE.MeshStandardMaterial({ color: 0x3d3d3d, metalness: 0.1, roughness: 0.9 });
    var watersurfacematerial = new THREE.MeshStandardMaterial({ color: 0x1e3a5f, metalness: 0.7, roughness: 0.2 });

    var rockshore = new THREE.Mesh(new THREE.BoxGeometry(80, 2, 80), rockmaterial);
    rockshore.position.set(0, -2, 0);
    rockshore.castShadow = true;
    rockshore.receiveShadow = true;
    scene.add(rockshore);
    objects.push(rockshore);

    var rock1 = new THREE.Mesh(new THREE.SphereGeometry(3, 8, 8), rockmaterial);
    rock1.position.set(30, 1, 25);
    rock1.castShadow = true;
    rock1.receiveShadow = true;
    scene.add(rock1);
    objects.push(rock1);

    var rock2 = new THREE.Mesh(new THREE.SphereGeometry(2.5, 8, 8), rockmaterial);
    rock2.position.set(-35, 0.5, -30);
    rock2.castShadow = true;
    rock2.receiveShadow = true;
    scene.add(rock2);
    objects.push(rock2);

    var water = new THREE.Mesh(new THREE.BoxGeometry(100, 1, 100), watersurfacematerial);
    water.position.set(0, -5, 0);
    water.receiveShadow = true;
    scene.add(water);
    objects.push(water);

    var debrisbeam = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 25, 6), rockmaterial);
    debrisbeam.position.set(25, 8, -18);
    debrisbeam.rotation.z = 0.4;
    debrisbeam.castShadow = true;
    debrisbeam.receiveShadow = true;
    scene.add(debrisbeam);
    objects.push(debrisbeam);

    var debrisbeam2 = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 22, 6), rockmaterial);
    debrisbeam2.position.set(-22, 10, 12);
    debrisbeam2.rotation.z = -0.35;
    debrisbeam2.castShadow = true;
    debrisbeam2.receiveShadow = true;
    scene.add(debrisbeam2);
    objects.push(debrisbeam2);
  }

  function builddynamiclights() {
    var mainlight = new THREE.DirectionalLight(0xaabbcc, 0.8);
    mainlight.position.set(40, 50, 30);
    mainlight.castShadow = true;
    mainlight.shadow.mapSize.width = 2048;
    mainlight.shadow.mapSize.height = 2048;
    mainlight.shadow.camera.left = -60;
    mainlight.shadow.camera.right = 60;
    mainlight.shadow.camera.top = 60;
    mainlight.shadow.camera.bottom = -60;
    mainlight.shadow.camera.far = 150;
    scene.add(mainlight);

    var ambientlight = new THREE.AmbientLight(0x667788, 0.4);
    scene.add(ambientlight);

    lightningLight = new THREE.PointLight(0xffffff, 0, 100);
    lightningLight.position.set(0, 60, 0);
    scene.add(lightningLight);

    var stormlight = new THREE.PointLight(0x556699, 0.3, 80);
    stormlight.position.set(-40, 40, 40);
    scene.add(stormlight);
  }

  function update(delta) {
    waveTime += delta;

    if (radarDish) {
      radarDish.rotation.y += delta * 0.8;
    }

    for (var i = 0; i < turrets.length; i++) {
      var turret = turrets[i];
      turret.mesh.rotation.z = turret.baseangle + Math.sin(waveTime * 0.7 + i) * 0.2;
    }

    if (particles) {
      var positions = particles.geometry.attributes.position.array;
      var velocities = particles.geometry.attributes.velocity.array;

      for (var j = 0; j < positions.length; j += 3) {
        positions[j] += velocities[j] * delta;
        positions[j + 1] += velocities[j + 1] * delta;
        positions[j + 2] += velocities[j + 2] * delta;

        if (positions[j + 1] < -10) {
          positions[j + 1] = 40;
        }
        if (Math.abs(positions[j]) > 50) {
          positions[j] = -positions[j];
        }
        if (Math.abs(positions[j + 2]) > 50) {
          positions[j + 2] = -positions[j + 2];
        }
      }

      particles.geometry.attributes.position.needsUpdate = true;
    }

    var lightningintensity = Math.max(0, Math.sin(waveTime * 3.5) * 0.4);
    if (lightningLight) {
      lightningLight.intensity = lightningintensity * 2;
    }

    if (lightningintensity > 0.3) {
      scene.fog.far = 120 + Math.sin(waveTime * 20) * 30;
    } else {
      scene.fog.far = 200;
    }
  }

  function reset() {
    waveTime = 0;

    for (var i = 0; i < objects.length; i++) {
      var obj = objects[i];
      if (obj.userData.originalposition) {
        obj.position.copy(obj.userData.originalposition);
      }
      if (obj.userData.originalrotation) {
        obj.rotation.copy(obj.userData.originalrotation);
      }
    }

    if (radarDish) {
      radarDish.rotation.y = 0;
    }

    for (var t = 0; t < turrets.length; t++) {
      turrets[t].mesh.rotation.z = turrets[t].baseangle;
    }
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
