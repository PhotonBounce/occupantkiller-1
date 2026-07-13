window.MilitaryParade = (function() {
  'use strict';

  var config = {
    enabled: false,
    keybind: 'MP',
    keyTimeout: 400,
    lastKeyTime: 0,
    lastKey: '',
    particleCount: 0,
    maxParticles: 500
  };

  var state = {
    sceneObjects: [],
    scene: null,
    camera: null,
    hudActive: false,
    assetsDestroyed: 0,
    paradeDisrupted: false,
    camerasActive: 3
  };

  var animations = {
    formations: [],
    rotors: [],
    flags: [],
    spotlights: [],
    mortars: [],
    turrets: [],
    particles: [],
    time: 0
  };

  function createParadeBlvd() {
    var geometry = new THREE.BoxGeometry(200, 0.5, 400);
    var material = new THREE.MeshPhongMaterial({ color: 0x444444 });
    var ground = new THREE.Mesh(geometry, material);
    ground.castShadow = true;
    ground.receiveShadow = true;
    state.scene.add(ground);
    state.sceneObjects.push(ground);
    return ground;
  }

  function createGrandstand() {
    var container = [];
    var baseGeo = new THREE.BoxGeometry(80, 2, 40);
    var baseMat = new THREE.MeshPhongMaterial({ color: 0x8B4513 });
    var base = new THREE.Mesh(baseGeo, baseMat);
    base.position.y = 1;
    base.castShadow = true;
    base.receiveShadow = true;
    state.scene.add(base);
    state.sceneObjects.push(base);
    container.push(base);

    for (var i = 0; i < 4; i++) {
      var tierGeo = new THREE.BoxGeometry(70 - i * 10, 1.5, 35 - i * 5);
      var tierMat = new THREE.MeshPhongMaterial({ color: 0xCD853F });
      var tier = new THREE.Mesh(tierGeo, tierMat);
      tier.position.y = 3 + i * 2;
      tier.position.z = -i * 3;
      tier.castShadow = true;
      tier.receiveShadow = true;
      state.scene.add(tier);
      state.sceneObjects.push(tier);
      container.push(tier);
    }
    return container;
  }

  function createTank() {
    var tank = new THREE.Group();

    var hullGeo = new THREE.BoxGeometry(8, 4, 14);
    var hullMat = new THREE.MeshPhongMaterial({ color: 0x2F4F2F });
    var hull = new THREE.Mesh(hullGeo, hullMat);
    hull.position.y = 2;
    hull.castShadow = true;
    hull.receiveShadow = true;
    tank.add(hull);

    var turretGeo = new THREE.CylinderGeometry(3, 3.5, 3, 16);
    var turretMat = new THREE.MeshPhongMaterial({ color: 0x2F4F2F });
    var turret = new THREE.Mesh(turretGeo, turretMat);
    turret.position.y = 4.5;
    turret.castShadow = true;
    turret.receiveShadow = true;
    tank.add(turret);

    var barrelGeo = new THREE.CylinderGeometry(0.8, 0.8, 12, 8);
    var barrelMat = new THREE.MeshPhongMaterial({ color: 0x1a1a1a });
    var barrel = new THREE.Mesh(barrelGeo, barrelMat);
    barrel.rotation.z = Math.PI / 2;
    barrel.position.set(6, 4.5, 0);
    barrel.castShadow = true;
    barrel.receiveShadow = true;
    tank.add(barrel);

    state.scene.add(tank);
    state.sceneObjects.push(tank);
    animations.turrets.push({ turret: turret, time: 0 });
    return tank;
  }

  function createMissileLauncher() {
    var launcher = new THREE.Group();

    var truckGeo = new THREE.BoxGeometry(10, 5, 20);
    var truckMat = new THREE.MeshPhongMaterial({ color: 0x556B2F });
    var truck = new THREE.Mesh(truckGeo, truckMat);
    truck.position.y = 2.5;
    truck.castShadow = true;
    truck.receiveShadow = true;
    launcher.add(truck);

    for (var i = 0; i < 3; i++) {
      var missileGeo = new THREE.CylinderGeometry(1.5, 1.5, 20, 8);
      var missileMat = new THREE.MeshPhongMaterial({ color: 0xDC143C });
      var missile = new THREE.Mesh(missileGeo, missileMat);
      missile.rotation.z = Math.PI / 2;
      missile.position.set(-3 + i * 3, 6, 0);
      missile.castShadow = true;
      missile.receiveShadow = true;
      launcher.add(missile);
    }

    state.scene.add(launcher);
    state.sceneObjects.push(launcher);
    return launcher;
  }

  function createParadeArch() {
    var arch = new THREE.Group();

    var pillarGeo = new THREE.BoxGeometry(6, 25, 6);
    var pillarMat = new THREE.MeshPhongMaterial({ color: 0xF0E68C });

    var pillarL = new THREE.Mesh(pillarGeo, pillarMat);
    pillarL.position.set(-25, 12.5, 0);
    pillarL.castShadow = true;
    pillarL.receiveShadow = true;
    arch.add(pillarL);

    var pillarR = new THREE.Mesh(pillarGeo, pillarMat);
    pillarR.position.set(25, 12.5, 0);
    pillarR.castShadow = true;
    pillarR.receiveShadow = true;
    arch.add(pillarR);

    var beamGeo = new THREE.BoxGeometry(56, 3, 6);
    var beamMat = new THREE.MeshPhongMaterial({ color: 0xFFD700 });
    var beam = new THREE.Mesh(beamGeo, beamMat);
    beam.position.y = 24;
    beam.castShadow = true;
    beam.receiveShadow = true;
    arch.add(beam);

    state.scene.add(arch);
    state.sceneObjects.push(arch);
    return arch;
  }

  function createFlagPole() {
    var pole = new THREE.Group();

    var poleGeo = new THREE.CylinderGeometry(0.8, 0.8, 18, 8);
    var poleMat = new THREE.MeshPhongMaterial({ color: 0x8B4513 });
    var poleBase = new THREE.Mesh(poleGeo, poleMat);
    poleBase.position.y = 9;
    poleBase.castShadow = true;
    poleBase.receiveShadow = true;
    pole.add(poleBase);

    var flagGeo = new THREE.BoxGeometry(6, 4, 0.2);
    var flagMat = new THREE.MeshPhongMaterial({ color: 0xFF0000, emissive: 0xFF0000, emissiveIntensity: 0.3 });
    var flag = new THREE.Mesh(flagGeo, flagMat);
    flag.position.set(4, 16, 0);
    flag.castShadow = true;
    flag.receiveShadow = true;
    pole.add(flag);

    state.scene.add(pole);
    state.sceneObjects.push(pole);
    animations.flags.push({ flag: flag, time: 0 });
    return pole;
  }

  function createBarricade() {
    var barricade = new THREE.Group();

    for (var i = 0; i < 6; i++) {
      var railGeo = new THREE.BoxGeometry(2, 1.5, 0.3);
      var railMat = new THREE.MeshPhongMaterial({ color: 0x696969 });
      var rail = new THREE.Mesh(railGeo, railMat);
      rail.position.set(-5 + i * 2, 0.75, 0);
      rail.castShadow = true;
      rail.receiveShadow = true;
      barricade.add(rail);
    }

    state.scene.add(barricade);
    state.sceneObjects.push(barricade);
    return barricade;
  }

  function createMarchingFormation() {
    var formation = new THREE.Group();

    for (var row = 0; row < 3; row++) {
      for (var col = 0; col < 5; col++) {
        var soldierGeo = new THREE.BoxGeometry(0.8, 2.5, 0.8);
        var soldierMat = new THREE.MeshPhongMaterial({ color: 0x2F4F4F });
        var soldier = new THREE.Mesh(soldierGeo, soldierMat);
        soldier.position.set(-8 + col * 4, 1.25, -8 + row * 4);
        soldier.castShadow = true;
        soldier.receiveShadow = true;
        formation.add(soldier);
      }
    }

    state.scene.add(formation);
    state.sceneObjects.push(formation);
    animations.formations.push({ formation: formation, time: 0 });
    return formation;
  }

  function createPropagandaBanner() {
    var banner = new THREE.Group();

    var bannerGeo = new THREE.BoxGeometry(40, 15, 1);
    var bannerMat = new THREE.MeshPhongMaterial({
      color: 0xFF0000,
      emissive: 0xFF0000,
      emissiveIntensity: 0.5
    });
    var bannerMesh = new THREE.Mesh(bannerGeo, bannerMat);
    bannerMesh.position.y = 20;
    bannerMesh.castShadow = true;
    bannerMesh.receiveShadow = true;
    banner.add(bannerMesh);

    var supportGeo = new THREE.CylinderGeometry(1.5, 1.5, 25, 8);
    var supportMat = new THREE.MeshPhongMaterial({ color: 0x8B4513 });

    var supportL = new THREE.Mesh(supportGeo, supportMat);
    supportL.position.set(-20, 12.5, 0);
    supportL.castShadow = true;
    supportL.receiveShadow = true;
    banner.add(supportL);

    var supportR = new THREE.Mesh(supportGeo, supportMat);
    supportR.position.set(20, 12.5, 0);
    supportR.castShadow = true;
    supportR.receiveShadow = true;
    banner.add(supportR);

    state.scene.add(banner);
    state.sceneObjects.push(banner);
    return banner;
  }

  function createSmokeMortar() {
    var mortar = new THREE.Group();

    var mortarGeo = new THREE.CylinderGeometry(1, 1, 4, 8);
    var mortarMat = new THREE.MeshPhongMaterial({ color: 0x696969 });
    var mortarBase = new THREE.Mesh(mortarGeo, mortarMat);
    mortarBase.castShadow = true;
    mortarBase.receiveShadow = true;
    mortar.add(mortarBase);

    state.scene.add(mortar);
    state.sceneObjects.push(mortar);
    animations.mortars.push({ mortar: mortar, time: 0 });
    return mortar;
  }

  function createHelicopter() {
    var heli = new THREE.Group();

    var fuselageGeo = new THREE.BoxGeometry(5, 4, 15);
    var fuselageMat = new THREE.MeshPhongMaterial({ color: 0x2F4F2F });
    var fuselage = new THREE.Mesh(fuselageGeo, fuselageMat);
    fuselage.position.y = 2;
    fuselage.castShadow = true;
    fuselage.receiveShadow = true;
    heli.add(fuselage);

    var rotorGeo = new THREE.CylinderGeometry(15, 15, 0.5, 16);
    var rotorMat = new THREE.MeshPhongMaterial({ color: 0x555555 });
    var rotor = new THREE.Mesh(rotorGeo, rotorMat);
    rotor.position.y = 5;
    rotor.castShadow = true;
    rotor.receiveShadow = true;
    heli.add(rotor);

    var tailRotorGeo = new THREE.CylinderGeometry(3, 3, 0.3, 8);
    var tailRotor = new THREE.Mesh(tailRotorGeo, rotorMat);
    tailRotor.rotation.x = Math.PI / 2;
    tailRotor.position.set(0, 4, -7);
    tailRotor.castShadow = true;
    tailRotor.receiveShadow = true;
    heli.add(tailRotor);

    heli.position.set(50, 40, 50);
    state.scene.add(heli);
    state.sceneObjects.push(heli);
    animations.rotors.push({ rotor: rotor, tailRotor: tailRotor });
    return heli;
  }

  function createSniperPerch() {
    var perch = new THREE.Group();

    var buildingGeo = new THREE.BoxGeometry(20, 30, 20);
    var buildingMat = new THREE.MeshPhongMaterial({ color: 0x8B7355 });
    var building = new THREE.Mesh(buildingGeo, buildingMat);
    building.position.set(-60, 15, 80);
    building.castShadow = true;
    building.receiveShadow = true;
    perch.add(building);

    var roofGeo = new THREE.ConeGeometry(15, 5, 4);
    var roofMat = new THREE.MeshPhongMaterial({ color: 0x8B4513 });
    var roof = new THREE.Mesh(roofGeo, roofMat);
    roof.position.set(-60, 33, 80);
    roof.castShadow = true;
    roof.receiveShadow = true;
    perch.add(roof);

    state.scene.add(perch);
    state.sceneObjects.push(perch);
    return perch;
  }

  function createSpotlightArray() {
    var array = new THREE.Group();

    for (var i = 0; i < 4; i++) {
      var baseGeo = new THREE.CylinderGeometry(2, 2, 2, 8);
      var baseMat = new THREE.MeshPhongMaterial({ color: 0x333333 });
      var base = new THREE.Mesh(baseGeo, baseMat);
      base.position.set(-60 + i * 40, 1, -100);
      base.castShadow = true;
      base.receiveShadow = true;
      array.add(base);

      var poleGeo = new THREE.CylinderGeometry(0.5, 0.5, 15, 8);
      var poleMat = new THREE.MeshPhongMaterial({ color: 0x333333 });
      var pole = new THREE.Mesh(poleGeo, poleMat);
      pole.position.set(-60 + i * 40, 8.5, -100);
      pole.castShadow = true;
      pole.receiveShadow = true;
      array.add(pole);

      var spotGeo = new THREE.CylinderGeometry(1.5, 1.5, 2, 8);
      var spotMat = new THREE.MeshPhongMaterial({ color: 0xFFFF00, emissive: 0xFFFF00 });
      var spot = new THREE.Mesh(spotGeo, spotMat);
      spot.position.set(-60 + i * 40, 16, -100);
      spot.castShadow = true;
      spot.receiveShadow = true;
      array.add(spot);

      var boltGeo = new THREE.ConeGeometry(3, 8, 16);
      var boltMat = new THREE.MeshPhongMaterial({
        color: 0xFFFFFF,
        emissive: 0xFFFF00,
        emissiveIntensity: 0.6,
        transparent: true,
        opacity: 0.2
      });
      var bolt = new THREE.Mesh(boltGeo, boltMat);
      bolt.position.set(-60 + i * 40, 8, -100);
      bolt.castShadow = false;
      bolt.receiveShadow = false;
      array.add(bolt);

      animations.spotlights.push({ bolt: bolt, base: -60 + i * 40, time: i * 0.5 });
    }

    state.scene.add(array);
    state.sceneObjects.push(array);
    return array;
  }

  function createLampPost() {
    var post = new THREE.Group();

    var baseGeo = new THREE.CylinderGeometry(1, 1, 0.5, 8);
    var baseMat = new THREE.MeshPhongMaterial({ color: 0x333333 });
    var base = new THREE.Mesh(baseGeo, baseMat);
    base.castShadow = true;
    base.receiveShadow = true;
    post.add(base);

    var poleGeo = new THREE.CylinderGeometry(0.4, 0.4, 12, 8);
    var poleMat = new THREE.MeshPhongMaterial({ color: 0x333333 });
    var pole = new THREE.Mesh(poleGeo, poleMat);
    pole.position.y = 6.5;
    pole.castShadow = true;
    pole.receiveShadow = true;
    post.add(pole);

    var lampGeo = new THREE.BoxGeometry(1.5, 1.5, 1.5);
    var lampMat = new THREE.MeshPhongMaterial({ color: 0xFFFF99, emissive: 0xFFFF00 });
    var lamp = new THREE.Mesh(lampGeo, lampMat);
    lamp.position.y = 13;
    lamp.castShadow = true;
    lamp.receiveShadow = true;
    post.add(lamp);

    state.scene.add(post);
    state.sceneObjects.push(post);
    return post;
  }

  function createPASpeakerTower() {
    var tower = new THREE.Group();

    var baseGeo = new THREE.CylinderGeometry(2, 2, 1, 8);
    var baseMat = new THREE.MeshPhongMaterial({ color: 0x333333 });
    var base = new THREE.Mesh(baseGeo, baseMat);
    base.castShadow = true;
    base.receiveShadow = true;
    tower.add(base);

    var poleGeo = new THREE.CylinderGeometry(0.6, 0.6, 15, 8);
    var poleMat = new THREE.MeshPhongMaterial({ color: 0x333333 });
    var pole = new THREE.Mesh(poleGeo, poleMat);
    pole.position.y = 8.5;
    pole.castShadow = true;
    pole.receiveShadow = true;
    tower.add(pole);

    var speakerGeo = new THREE.BoxGeometry(3, 3, 2);
    var speakerMat = new THREE.MeshPhongMaterial({ color: 0x696969 });
    var speaker = new THREE.Mesh(speakerGeo, speakerMat);
    speaker.position.y = 17;
    speaker.castShadow = true;
    speaker.receiveShadow = true;
    tower.add(speaker);

    state.scene.add(tower);
    state.sceneObjects.push(tower);
    return tower;
  }

  function createParticle() {
    var pGeo = new THREE.SphereGeometry(0.3, 4, 4);
    var pMat = new THREE.MeshPhongMaterial({ color: 0xAAAAAA });
    var particle = new THREE.Mesh(pGeo, pMat);
    particle.position.set(
      Math.random() * 100 - 50,
      Math.random() * 50,
      Math.random() * 100 - 50
    );
    particle.velocity = new THREE.Vector3(
      (Math.random() - 0.5) * 3,
      Math.random() * 2,
      (Math.random() - 0.5) * 3
    );
    state.scene.add(particle);
    state.sceneObjects.push(particle);
    animations.particles.push(particle);
    return particle;
  }

  function updateAnimations(delta) {
    animations.time += delta;

    for (var i = 0; i < animations.formations.length; i++) {
      animations.formations[i].formation.position.z += delta * 5;
      if (animations.formations[i].formation.position.z > 100) {
        animations.formations[i].formation.position.z = -100;
      }
    }

    for (var i = 0; i < animations.rotors.length; i++) {
      animations.rotors[i].rotor.rotation.z += delta * 15;
      animations.rotors[i].tailRotor.rotation.x += delta * 20;
    }

    for (var i = 0; i < animations.flags.length; i++) {
      animations.flags[i].time += delta;
      animations.flags[i].flag.rotation.z = Math.sin(animations.flags[i].time * 3) * 0.3;
    }

    for (var i = 0; i < animations.turrets.length; i++) {
      animations.turrets[i].time += delta;
      animations.turrets[i].turret.rotation.y = Math.sin(animations.turrets[i].time * 1.5) * 0.5;
    }

    for (var i = 0; i < animations.spotlights.length; i++) {
      animations.spotlights[i].time += delta;
      var angle = animations.spotlights[i].time * 2;
      animations.spotlights[i].bolt.rotation.z = Math.sin(angle) * 0.8;
    }

    for (var i = 0; i < animations.mortars.length; i++) {
      animations.mortars[i].time += delta;
      if (Math.sin(animations.mortars[i].time * 4) > 0.8) {
        if (Math.random() > 0.95 && animations.particles.length < config.maxParticles) {
          createParticle();
        }
      }
    }

    for (var i = animations.particles.length - 1; i >= 0; i--) {
      var p = animations.particles[i];
      p.position.add(p.velocity.clone().multiplyScalar(delta));
      p.velocity.y -= 9.8 * delta;
      p.position.y -= 0.5 * delta;

      if (p.position.y < 0) {
        state.scene.remove(p);
        animations.particles.splice(i, 1);
        var idx = state.sceneObjects.indexOf(p);
        if (idx > -1) {
          state.sceneObjects.splice(idx, 1);
        }
      }
    }
  }

  function displayHUD() {
    var disruptedText = state.paradeDisrupted ? 'YES' : 'NO';
    var hudText = 'PARADE DISRUPTED: ' + disruptedText + '\n' +
                  'ASSETS DESTROYED: ' + state.assetsDestroyed + '/5\n' +
                  'PROPAGANDA CAMERAS: ' + state.camerasActive + ' ACTIVE';
    console.log(hudText);
  }

  function handleKeyPress(event) {
    if (event.key.toUpperCase() === 'M' || event.key.toUpperCase() === 'P') {
      var now = Date.now();
      if (now - config.lastKeyTime > config.keyTimeout) {
        config.lastKey = event.key.toUpperCase();
        config.lastKeyTime = now;
      } else {
        config.lastKey += event.key.toUpperCase();
        if (config.lastKey.indexOf('M') !== -1 && config.lastKey.indexOf('P') !== -1 && config.lastKey.length >= 2) {
          toggleModule();
          config.lastKey = '';
        }
      }
    }
  }

  function toggleModule() {
    config.enabled = !config.enabled;
    var status = config.enabled ? 'MILITARY PARADE ACTIVE' : 'MILITARY PARADE INACTIVE';
    console.log('[HUD] ' + status);
    if (config.enabled) {
      displayHUD();
    }
  }

  function init(scene, camera) {
    state.scene = scene;
    state.camera = camera;
    state.sceneObjects = [];
    state.assetsDestroyed = 0;
    state.paradeDisrupted = false;
    state.camerasActive = 3;

    animations.formations = [];
    animations.rotors = [];
    animations.flags = [];
    animations.spotlights = [];
    animations.mortars = [];
    animations.turrets = [];
    animations.particles = [];
    animations.time = 0;

    scene.fog = new THREE.Fog(0xA9A9A9, 300, 500);
    scene.background = new THREE.Color(0xB0C4DE);

    createParadeBlvd();
    createGrandstand();

    var tankPositions = [
      [-30, 2, -30],
      [-30, 2, 0],
      [-30, 2, 30],
      [30, 2, -30],
      [30, 2, 0],
      [30, 2, 30]
    ];
    for (var i = 0; i < tankPositions.length; i++) {
      var t = createTank();
      t.position.set(tankPositions[i][0], tankPositions[i][1], tankPositions[i][2]);
    }

    var missileLaunchers = [
      [-50, 2, 80],
      [50, 2, 80]
    ];
    for (var i = 0; i < missileLaunchers.length; i++) {
      var m = createMissileLauncher();
      m.position.set(missileLaunchers[i][0], missileLaunchers[i][1], missileLaunchers[i][2]);
    }

    createParadeArch();

    for (var i = 0; i < 5; i++) {
      var f = createFlagPole();
      f.position.set(-40 + i * 20, 0, 0);
    }

    for (var i = 0; i < 6; i++) {
      var b = createBarricade();
      b.position.set(-80 + i * 30, 0, -60 + i % 2 * 10);
    }

    createMarchingFormation();
    createPropagandaBanner();

    for (var i = 0; i < 3; i++) {
      var s = createSmokeMortar();
      s.position.set(-40 + i * 40, 5, 60);
    }

    createHelicopter();
    createSniperPerch();
    createSpotlightArray();

    for (var i = 0; i < 4; i++) {
      var l = createLampPost();
      l.position.set(-80 + i * 50, 0, 100);
    }

    for (var i = 0; i < 2; i++) {
      var p = createPASpeakerTower();
      p.position.set(-50 + i * 100, 0, -80);
    }

    document.addEventListener('keydown', handleKeyPress);
  }

  function update(delta) {
    if (config.enabled) {
      updateAnimations(delta);
    }
  }

  function reset() {
    document.removeEventListener('keydown', handleKeyPress);

    for (var i = state.sceneObjects.length - 1; i >= 0; i--) {
      state.scene.remove(state.sceneObjects[i]);
    }
    state.sceneObjects = [];

    animations.formations = [];
    animations.rotors = [];
    animations.flags = [];
    animations.spotlights = [];
    animations.mortars = [];
    animations.turrets = [];
    animations.particles = [];
    animations.time = 0;

    config.enabled = false;
    config.lastKey = '';
    config.lastKeyTime = 0;
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
