window.PolarStation = (function() {
  'use strict';

  var scene, camera, windTurbines, auroraLines, snowParticles, weatherBalloon;
  var blizzardActive = false;
  var auroraIntensity = 0.5;
  var auroraDirection = 1;

  function init(targetScene, targetCamera) {
    scene = targetScene;
    camera = targetCamera;
    windTurbines = [];
    auroraLines = null;
    snowParticles = [];

    // Ground: vast white ice field
    var groundGeometry = new THREE.BoxGeometry(2000, 2, 2000);
    var groundMaterial = new THREE.MeshStandardMaterial({
      color: 0xf0f8ff,
      roughness: 0.8,
      metalness: 0.0
    });
    var ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.position.y = -10;
    ground.castShadow = true;
    ground.receiveShadow = true;
    scene.add(ground);

    // Snow drift berms: sculpted BoxGeometry hills
    var bermGeometry1 = new THREE.BoxGeometry(300, 30, 150);
    var bermMaterial = new THREE.MeshStandardMaterial({
      color: 0xe8f4f8,
      roughness: 0.9
    });
    var berm1 = new THREE.Mesh(bermGeometry1, bermMaterial);
    berm1.position.set(400, -5, -300);
    berm1.scale.z = 0.6;
    berm1.rotation.z = 0.2;
    berm1.castShadow = true;
    berm1.receiveShadow = true;
    scene.add(berm1);

    var bermGeometry2 = new THREE.BoxGeometry(250, 25, 180);
    var berm2 = new THREE.Mesh(bermGeometry2, bermMaterial);
    berm2.position.set(-500, -8, 400);
    berm2.scale.z = 0.5;
    berm2.rotation.z = -0.25;
    berm2.castShadow = true;
    berm2.receiveShadow = true;
    scene.add(berm2);

    // Geodesic dome buildings
    var domePositions = [
      { x: 0, z: 0, label: 'main' },
      { x: -150, z: 100, label: 'lab' },
      { x: 150, z: 100, label: 'habitat' },
      { x: 0, z: 200, label: 'command' }
    ];

    domePositions.forEach(function(pos) {
      createGeodesicDome(pos.x, 0, pos.z);
    });

    // Connecting corridors between domes
    createCorridor(0, 50, 0, 30, 150);      // main to command
    createCorridor(-75, 50, 50, 20, 100);   // main to lab
    createCorridor(75, 50, 50, 20, 100);    // main to habitat

    // Ice runway
    var runwayGeometry = new THREE.BoxGeometry(1500, 1, 100);
    var runwayMaterial = new THREE.MeshStandardMaterial({
      color: 0xd0e8f2,
      roughness: 0.7,
      metalness: 0.1
    });
    var runway = new THREE.Mesh(runwayGeometry, runwayMaterial);
    runway.position.set(0, -9, -400);
    runway.castShadow = true;
    runway.receiveShadow = true;
    scene.add(runway);

    // Runway markings
    for (var i = -700; i < 700; i += 150) {
      var lineGeometry = new THREE.BoxGeometry(20, 0.5, 8);
      var lineMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff });
      var line = new THREE.Mesh(lineGeometry, lineMaterial);
      line.position.set(i, -8.5, -400);
      scene.add(line);
    }

    // Snow tractor
    createSnowTractor(-200, 0, -300);

    // Wind turbine array
    for (var t = 0; t < 5; t++) {
      var turbineX = -400 + t * 200;
      createWindTurbine(turbineX, 50, 300);
    }

    // Weather balloon launch pad
    createWeatherBalloon(300, 0, 150);

    // Underground lab access hatch
    createUndergroundHatch(0, -8, -80);

    // Ice core sample storage
    createCoreStorage(100, 0, -150);

    // Communications dome
    createCommunicationsDome(-300, 0, -200);

    // Fuel bladder farm
    for (var f = 0; f < 4; f++) {
      var fuelX = -600 + f * 120;
      createFuelBladder(fuelX, 0, 500);
    }

    // Emergency survival cache (red)
    createSurvivalCache(400, 0, 400);

    // Crevasse danger zones
    createCrevasse(-700, -50, -600);
    createCrevasse(600, -40, 700);

    // Supply pallet air-drop
    createAirDrop(200, 100, -200);

    // Scientific drilling rig
    createDrillingRig(-300, 0, 300);

    // Flagpoles with national flags
    createFlagpole(-250, 0, 0, 0xff0000);  // Red flag
    createFlagpole(250, 0, 0, 0x0000ff);   // Blue flag
    createFlagpole(0, 0, -150, 0xffff00);  // Yellow flag

    // Aurora borealis effect (overhead)
    createAurora();
  }

  function createGeodesicDome(x, y, z) {
    var domeGeometry = new THREE.SphereGeometry(80, 16, 8);
    var domeMaterial = new THREE.MeshStandardMaterial({
      color: 0xccddee,
      transparent: true,
      opacity: 0.7,
      roughness: 0.3,
      metalness: 0.6
    });
    var dome = new THREE.Mesh(domeGeometry, domeMaterial);
    dome.position.set(x, y + 40, z);
    dome.castShadow = true;
    dome.receiveShadow = true;
    scene.add(dome);

    // Base ring
    var baseGeometry = new THREE.CylinderGeometry(85, 85, 5, 32);
    var baseMaterial = new THREE.MeshStandardMaterial({ color: 0x888888 });
    var base = new THREE.Mesh(baseGeometry, baseMaterial);
    base.position.set(x, y + 5, z);
    base.castShadow = true;
    base.receiveShadow = true;
    scene.add(base);
  }

  function createCorridor(x, y, z, width, length) {
    var corridorGeometry = new THREE.BoxGeometry(width, 20, length);
    var corridorMaterial = new THREE.MeshStandardMaterial({
      color: 0xaabbcc,
      roughness: 0.4
    });
    var corridor = new THREE.Mesh(corridorGeometry, corridorMaterial);
    corridor.position.set(x, y, z);
    corridor.castShadow = true;
    corridor.receiveShadow = true;
    scene.add(corridor);
  }

  function createSnowTractor(x, y, z) {
    // Main body
    var bodyGeometry = new THREE.BoxGeometry(60, 40, 100);
    var bodyMaterial = new THREE.MeshStandardMaterial({
      color: 0xff6600,
      roughness: 0.5
    });
    var body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.set(x, y + 30, z);
    body.castShadow = true;
    body.receiveShadow = true;
    scene.add(body);

    // Cab (raised)
    var cabGeometry = new THREE.BoxGeometry(40, 30, 50);
    var cabMaterial = new THREE.MeshStandardMaterial({ color: 0xffe5cc });
    var cab = new THREE.Mesh(cabGeometry, cabMaterial);
    cab.position.set(x, y + 55, z - 20);
    cab.castShadow = true;
    scene.add(cab);

    // Left track
    var leftTrackGeometry = new THREE.CylinderGeometry(15, 15, 100, 12);
    var trackMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
    var leftTrack = new THREE.Mesh(leftTrackGeometry, trackMaterial);
    leftTrack.rotation.z = Math.PI / 2;
    leftTrack.position.set(x - 35, y + 15, z);
    leftTrack.castShadow = true;
    scene.add(leftTrack);

    // Right track
    var rightTrack = new THREE.Mesh(leftTrackGeometry, trackMaterial);
    rightTrack.rotation.z = Math.PI / 2;
    rightTrack.position.set(x + 35, y + 15, z);
    rightTrack.castShadow = true;
    scene.add(rightTrack);
  }

  function createWindTurbine(x, y, z) {
    // Tower
    var towerGeometry = new THREE.CylinderGeometry(8, 12, 150, 16);
    var towerMaterial = new THREE.MeshStandardMaterial({
      color: 0xcccccc,
      roughness: 0.6
    });
    var tower = new THREE.Mesh(towerGeometry, towerMaterial);
    tower.position.set(x, y + 75, z);
    tower.castShadow = true;
    tower.receiveShadow = true;
    scene.add(tower);

    // Nacelle
    var nacelleGeometry = new THREE.BoxGeometry(25, 15, 35);
    var nacelleMaterial = new THREE.MeshStandardMaterial({ color: 0x888888 });
    var nacelle = new THREE.Mesh(nacelleGeometry, nacelleMaterial);
    nacelle.position.set(x, y + 155, z);
    nacelle.castShadow = true;
    scene.add(nacelle);

    // Rotor blades (3 BoxGeometry stubs extending from nacelle)
    var bladeGeometry = new THREE.BoxGeometry(10, 40, 60);
    var bladeMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff });

    for (var b = 0; b < 3; b++) {
      var blade = new THREE.Mesh(bladeGeometry, bladeMaterial);
      blade.position.set(x, y + 155, z);
      blade.castShadow = true;
      scene.add(blade);
      windTurbines.push({ blade: blade, angle: (b * Math.PI * 2 / 3) });
    }
  }

  function createWeatherBalloon(x, y, z) {
    // Launch pad base
    var padGeometry = new THREE.BoxGeometry(100, 5, 80);
    var padMaterial = new THREE.MeshStandardMaterial({ color: 0x888888 });
    var pad = new THREE.Mesh(padGeometry, padMaterial);
    pad.position.set(x, y - 5, z);
    pad.castShadow = true;
    scene.add(pad);

    // Gas tank (cylinder)
    var tankGeometry = new THREE.CylinderGeometry(20, 20, 80, 16);
    var tankMaterial = new THREE.MeshStandardMaterial({ color: 0x444444 });
    var tank = new THREE.Mesh(tankGeometry, tankMaterial);
    tank.position.set(x - 30, y + 40, z);
    tank.castShadow = true;
    scene.add(tank);

    // Balloon (sphere)
    var balloonGeometry = new THREE.SphereGeometry(35, 12, 12);
    var balloonMaterial = new THREE.MeshStandardMaterial({
      color: 0xff3333,
      emissive: 0x330000
    });
    weatherBalloon = new THREE.Mesh(balloonGeometry, balloonMaterial);
    weatherBalloon.position.set(x, y + 150, z);
    weatherBalloon.castShadow = true;
    scene.add(weatherBalloon);

    // Tether line
    var tetherGeometry = new THREE.BufferGeometry();
    var tetherPositions = new Float32Array([x, y + 80, z, x, y + 150, z]);
    tetherGeometry.setAttribute('position', new THREE.BufferAttribute(tetherPositions, 3));
    var tetherMaterial = new THREE.LineBasicMaterial({ color: 0x666666 });
    var tether = new THREE.LineSegments(tetherGeometry, tetherMaterial);
    scene.add(tether);
  }

  function createUndergroundHatch(x, y, z) {
    // Reinforced hatch door
    var hatchGeometry = new THREE.BoxGeometry(80, 10, 80);
    var hatchMaterial = new THREE.MeshStandardMaterial({
      color: 0x333333,
      metalness: 0.8,
      roughness: 0.2
    });
    var hatch = new THREE.Mesh(hatchGeometry, hatchMaterial);
    hatch.position.set(x, y + 5, z);
    hatch.castShadow = true;
    scene.add(hatch);

    // Surrounding reinforced frame
    var frameGeometry = new THREE.BoxGeometry(100, 15, 100);
    var frameMaterial = new THREE.MeshStandardMaterial({ color: 0x555555 });
    var frame = new THREE.Mesh(frameGeometry, frameMaterial);
    frame.position.set(x, y, z);
    scene.add(frame);
  }

  function createCoreStorage(x, y, z) {
    // Climate-controlled storage room
    var storageGeometry = new THREE.BoxGeometry(80, 60, 120);
    var storageMaterial = new THREE.MeshStandardMaterial({
      color: 0xccccdd,
      roughness: 0.4
    });
    var storage = new THREE.Mesh(storageGeometry, storageMaterial);
    storage.position.set(x, y + 30, z);
    storage.castShadow = true;
    storage.receiveShadow = true;
    scene.add(storage);

    // Core sample tubes (cylinders)
    for (var c = 0; c < 6; c++) {
      var coreGeometry = new THREE.CylinderGeometry(3, 3, 80, 8);
      var coreMaterial = new THREE.MeshStandardMaterial({ color: 0x8899aa });
      var core = new THREE.Mesh(coreGeometry, coreMaterial);
      core.position.set(x - 20 + c * 10, y + 40, z - 40);
      core.castShadow = true;
      scene.add(core);
    }
  }

  function createCommunicationsDome(x, y, z) {
    // Communications sphere dome
    var commGeometry = new THREE.SphereGeometry(50, 12, 8);
    var commMaterial = new THREE.MeshStandardMaterial({
      color: 0xddccff,
      transparent: true,
      opacity: 0.6,
      roughness: 0.4
    });
    var commDome = new THREE.Mesh(commGeometry, commMaterial);
    commDome.position.set(x, y + 25, z);
    commDome.castShadow = true;
    scene.add(commDome);

    // Antenna array on top
    for (var a = 0; a < 4; a++) {
      var antennaGeometry = new THREE.CylinderGeometry(2, 2, 40, 8);
      var antennaMaterial = new THREE.MeshStandardMaterial({ color: 0x666666 });
      var antenna = new THREE.Mesh(antennaGeometry, antennaMaterial);
      var angle = (a * Math.PI / 2);
      antenna.position.set(
        x + Math.cos(angle) * 35,
        y + 50,
        z + Math.sin(angle) * 35
      );
      antenna.castShadow = true;
      scene.add(antenna);
    }
  }

  function createFuelBladder(x, y, z) {
    var bladderGeometry = new THREE.CylinderGeometry(25, 25, 80, 16);
    var bladderMaterial = new THREE.MeshStandardMaterial({
      color: 0xccaa44,
      roughness: 0.6
    });
    var bladder = new THREE.Mesh(bladderGeometry, bladderMaterial);
    bladder.position.set(x, y + 40, z);
    bladder.castShadow = true;
    bladder.receiveShadow = true;
    scene.add(bladder);

    // Fuel line to bladder
    var lineGeometry = new THREE.BoxGeometry(8, 8, 40);
    var lineMaterial = new THREE.MeshStandardMaterial({ color: 0x666666 });
    var line = new THREE.Mesh(lineGeometry, lineMaterial);
    line.position.set(x - 30, y + 60, z + 20);
    scene.add(line);
  }

  function createSurvivalCache(x, y, z) {
    // Red emergency supply container
    var cacheGeometry = new THREE.BoxGeometry(100, 80, 60);
    var cacheMaterial = new THREE.MeshStandardMaterial({
      color: 0xdd0000,
      roughness: 0.5
    });
    var cache = new THREE.Mesh(cacheGeometry, cacheMaterial);
    cache.position.set(x, y + 40, z);
    cache.castShadow = true;
    cache.receiveShadow = true;
    scene.add(cache);

    // Yellow warning stripe
    var stripeGeometry = new THREE.BoxGeometry(100, 8, 60);
    var stripeMaterial = new THREE.MeshStandardMaterial({ color: 0xffff00 });
    var stripe = new THREE.Mesh(stripeGeometry, stripeMaterial);
    stripe.position.set(x, y + 70, z);
    scene.add(stripe);
  }

  function createCrevasse(x, y, z) {
    // Deep dark crevasse
    var crevGeometry = new THREE.BoxGeometry(60, 100, 150);
    var crevMaterial = new THREE.MeshStandardMaterial({
      color: 0x001a4d,
      roughness: 0.95
    });
    var crevasse = new THREE.Mesh(crevGeometry, crevMaterial);
    crevasse.position.set(x, y, z);
    crevasse.castShadow = true;
    scene.add(crevasse);
  }

  function createAirDrop(x, y, z) {
    // Pallet
    var palletGeometry = new THREE.BoxGeometry(80, 20, 80);
    var palletMaterial = new THREE.MeshStandardMaterial({ color: 0x8b7355 });
    var pallet = new THREE.Mesh(palletGeometry, palletMaterial);
    pallet.position.set(x, y - 30, z);
    pallet.castShadow = true;
    scene.add(pallet);

    // Parachute (sphere canopy)
    var parachuteGeometry = new THREE.SphereGeometry(50, 12, 12);
    var parachteMaterial = new THREE.MeshStandardMaterial({
      color: 0xff9933,
      emissive: 0x331100
    });
    var parachute = new THREE.Mesh(parachuteGeometry, parachteMaterial);
    parachute.position.set(x, y + 100, z);
    parachute.castShadow = true;
    scene.add(parachute);

    // Shroud lines
    for (var s = 0; s < 8; s++) {
      var shroudGeometry = new THREE.BufferGeometry();
      var angle = (s * Math.PI * 2 / 8);
      var shroudPositions = new Float32Array([
        x + Math.cos(angle) * 45, y + 50, z + Math.sin(angle) * 45,
        x, y - 30, z
      ]);
      shroudGeometry.setAttribute('position', new THREE.BufferAttribute(shroudPositions, 3));
      var shroudMaterial = new THREE.LineBasicMaterial({ color: 0xcccccc });
      var shroud = new THREE.LineSegments(shroudGeometry, shroudMaterial);
      scene.add(shroud);
    }
  }

  function createDrillingRig(x, y, z) {
    // Derrick tower
    var derrickGeometry = new THREE.BoxGeometry(30, 180, 30);
    var derrickMaterial = new THREE.MeshStandardMaterial({
      color: 0x666666,
      roughness: 0.6
    });
    var derrick = new THREE.Mesh(derrickGeometry, derrickMaterial);
    derrick.position.set(x, y + 90, z);
    derrick.castShadow = true;
    scene.add(derrick);

    // Drill string (cylinder)
    var drillGeometry = new THREE.CylinderGeometry(8, 8, 120, 8);
    var drillMaterial = new THREE.MeshStandardMaterial({ color: 0x444444 });
    var drill = new THREE.Mesh(drillGeometry, drillMaterial);
    drill.position.set(x, y + 20, z);
    drill.castShadow = true;
    scene.add(drill);

    // Base platform
    var baseGeometry = new THREE.BoxGeometry(100, 10, 100);
    var baseMaterial = new THREE.MeshStandardMaterial({ color: 0x888888 });
    var base = new THREE.Mesh(baseGeometry, baseMaterial);
    base.position.set(x, y - 5, z);
    base.castShadow = true;
    scene.add(base);
  }

  function createFlagpole(x, y, z, flagColor) {
    // Pole (cylinder)
    var poleGeometry = new THREE.CylinderGeometry(3, 3, 40, 8);
    var poleMaterial = new THREE.MeshStandardMaterial({ color: 0x999999 });
    var pole = new THREE.Mesh(poleGeometry, poleMaterial);
    pole.position.set(x, y + 20, z);
    pole.castShadow = true;
    scene.add(pole);

    // Flag (box)
    var flagGeometry = new THREE.BoxGeometry(50, 30, 2);
    var flagMaterial = new THREE.MeshStandardMaterial({ color: flagColor });
    var flag = new THREE.Mesh(flagGeometry, flagMaterial);
    flag.position.set(x + 30, y + 25, z);
    flag.castShadow = true;
    scene.add(flag);
  }

  function createAurora() {
    var auroraPositions = [];
    var auroraColors = [];

    for (var w = 0; w < 30; w++) {
      var waveX = (w / 30) * 2000 - 1000;
      for (var h = 0; h < 8; h++) {
        var height = 300 + h * 40;
        auroraPositions.push(waveX, height, -800);
        auroraPositions.push(waveX + 50, height + 20, -800);

        // Color gradient: green, cyan, purple
        var hueIndex = (w + h) % 3;
        if (hueIndex === 0) {
          auroraColors.push(0, 1, 0.5);
          auroraColors.push(0, 1, 0.5);
        } else if (hueIndex === 1) {
          auroraColors.push(0, 1, 1);
          auroraColors.push(0, 1, 1);
        } else {
          auroraColors.push(1, 0, 1);
          auroraColors.push(1, 0, 1);
        }
      }
    }

    var auroraGeometry = new THREE.BufferGeometry();
    auroraGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(auroraPositions), 3));
    auroraGeometry.setAttribute('color', new THREE.BufferAttribute(new Float32Array(auroraColors), 3));

    var auroraMaterial = new THREE.LineBasicMaterial({
      vertexColors: true,
      linewidth: 2,
      transparent: true,
      opacity: 0.6
    });

    auroraLines = new THREE.LineSegments(auroraGeometry, auroraMaterial);
    scene.add(auroraLines);
  }

  function update(delta) {
    // Spin wind turbine blades
    windTurbines.forEach(function(turbine) {
      turbine.angle += delta * 2;
      var rad = 60;
      turbine.blade.position.z += Math.sin(turbine.angle) * 0.5;
      turbine.blade.rotation.y = turbine.angle;
    });

    // Aurora wave intensity oscillation
    if (auroraLines) {
      auroraIntensity += auroraDirection * delta * 0.3;
      if (auroraIntensity > 1.0) {
        auroraIntensity = 1.0;
        auroraDirection = -1;
      } else if (auroraIntensity < 0.3) {
        auroraIntensity = 0.3;
        auroraDirection = 1;
      }
      auroraLines.material.opacity = auroraIntensity;
    }

    // Weather balloon sway
    if (weatherBalloon) {
      weatherBalloon.position.x += Math.sin(Date.now() * 0.001) * 0.3;
      weatherBalloon.position.z += Math.cos(Date.now() * 0.0008) * 0.2;
    }

    // Blizzard snow particles
    if (blizzardActive && snowParticles.length < 100) {
      for (var p = 0; p < 3; p++) {
        var snowGeometry = new THREE.SphereGeometry(2, 4, 4);
        var snowMaterial = new THREE.MeshStandardMaterial({
          color: 0xffffff,
          emissive: 0x666666
        });
        var snowball = new THREE.Mesh(snowGeometry, snowMaterial);
        snowball.position.set(
          Math.random() * 800 - 400,
          400 + Math.random() * 200,
          Math.random() * 800 - 400
        );
        snowball.velocity = {
          x: (Math.random() - 0.5) * 50,
          y: -Math.random() * 80,
          z: (Math.random() - 0.5) * 20
        };
        scene.add(snowball);
        snowParticles.push(snowball);
      }
    }

    // Update snow particle positions
    for (var sp = snowParticles.length - 1; sp >= 0; sp--) {
      var particle = snowParticles[sp];
      particle.position.x += particle.velocity.x * delta;
      particle.position.y += particle.velocity.y * delta;
      particle.position.z += particle.velocity.z * delta;

      if (particle.position.y < -100) {
        scene.remove(particle);
        snowParticles.splice(sp, 1);
      }
    }
  }

  function reset() {
    windTurbines.forEach(function(turbine) {
      turbine.angle = 0;
    });

    auroraIntensity = 0.5;
    auroraDirection = 1;

    snowParticles.forEach(function(particle) {
      scene.remove(particle);
    });
    snowParticles = [];

    if (weatherBalloon) {
      weatherBalloon.position.x = 300;
      weatherBalloon.position.z = 150;
    }

    blizzardActive = false;
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
