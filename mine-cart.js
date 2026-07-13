window.MineCart = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var carts = [];
  var crusher = null;
  var crusherDrum = null;
  var lanterns = [];
  var waterBody = null;
  var canaryBird = null;
  var canary = null;
  var canyonTime = 0;
  var cartTracks = [];
  var gemVeins = [];

  var init = function(initScene, initCamera) {
    scene = initScene;
    camera = initCamera;
    carts = [];
    lanterns = [];
    gemVeins = [];
    canyonTime = 0;

    scene.background = new THREE.Color(0x1a1a2e);
    scene.fog = new THREE.Fog(0x1a1a2e, 150, 300);

    buildMineTracks();
    buildMineCarts();
    buildSupportBeams();
    buildExplosivesStorage();
    buildCaveInSection();
    buildUndergroundLake();
    buildGemVeins();
    buildOreProcessing();
    buildHeadlamps();
    buildDynamiteCharges();
    buildCanaryCage();

    var ambientLight = new THREE.AmbientLight(0x3d3d5c, 0.4);
    scene.add(ambientLight);

    var pointLight1 = new THREE.PointLight(0xffaa00, 1.5, 80);
    pointLight1.position.set(20, 25, 0);
    scene.add(pointLight1);

    var pointLight2 = new THREE.PointLight(0x6666ff, 1, 60);
    pointLight2.position.set(-30, 20, 40);
    scene.add(pointLight2);
  };

  var buildMineTracks = function() {
    var trackMaterial = new THREE.LineBasicMaterial({ color: 0x8b7355, linewidth: 2 });

    var mainTrack = new THREE.Geometry();
    mainTrack.vertices.push(new THREE.Vector3(-80, 5, -40));
    mainTrack.vertices.push(new THREE.Vector3(-40, 5, -20));
    mainTrack.vertices.push(new THREE.Vector3(0, 5, 0));
    mainTrack.vertices.push(new THREE.Vector3(40, 5, 20));
    mainTrack.vertices.push(new THREE.Vector3(80, 5, 60));

    var leftRail = new THREE.LineSegments(mainTrack, trackMaterial);
    leftRail.position.x = -3;
    scene.add(leftRail);
    cartTracks.push(mainTrack.vertices);

    var rightRail = new THREE.LineSegments(mainTrack, trackMaterial);
    rightRail.position.x = 3;
    scene.add(rightRail);

    var junctionTrack = new THREE.Geometry();
    junctionTrack.vertices.push(new THREE.Vector3(0, 5, 0));
    junctionTrack.vertices.push(new THREE.Vector3(0, 5, 50));
    junctionTrack.vertices.push(new THREE.Vector3(-50, 5, 80));

    var junctionLeft = new THREE.LineSegments(junctionTrack, trackMaterial);
    junctionLeft.position.x = -3;
    scene.add(junctionLeft);

    var junctionRight = new THREE.LineSegments(junctionTrack, trackMaterial);
    junctionRight.position.x = 3;
    scene.add(junctionRight);

    var verticalTrack = new THREE.Geometry();
    verticalTrack.vertices.push(new THREE.Vector3(60, 5, 40));
    verticalTrack.vertices.push(new THREE.Vector3(60, 40, 40));

    var verticalLeft = new THREE.LineSegments(verticalTrack, trackMaterial);
    verticalLeft.position.x = -3;
    scene.add(verticalLeft);

    var verticalRight = new THREE.LineSegments(verticalTrack, trackMaterial);
    verticalRight.position.x = 3;
    scene.add(verticalRight);
  };

  var buildMineCarts = function() {
    var cartPositions = [
      { x: -70, y: 7, z: -35, speed: 0.02, trackIndex: 0 },
      { x: 20, y: 7, z: 10, speed: 0.015, trackIndex: 0 },
      { x: 50, y: 7, z: 40, speed: 0.025, trackIndex: 0 }
    ];

    cartPositions.forEach(function(cartPos) {
      var cartGroup = new THREE.Group();

      var cartBody = new THREE.Mesh(
        new THREE.BoxGeometry(8, 6, 14),
        new THREE.MeshStandardMaterial({ color: 0xff6b35, metalness: 0.3, roughness: 0.7 })
      );
      cartBody.position.y = 3;
      cartGroup.add(cartBody);

      var wheelFront = new THREE.Mesh(
        new THREE.CylinderGeometry(3, 3, 2, 16),
        new THREE.MeshStandardMaterial({ color: 0x2a2a2a, metalness: 0.8, roughness: 0.2 })
      );
      wheelFront.rotation.z = Math.PI / 2;
      wheelFront.position.set(0, 2, 5);
      cartGroup.add(wheelFront);

      var wheelBack = new THREE.Mesh(
        new THREE.CylinderGeometry(3, 3, 2, 16),
        new THREE.MeshStandardMaterial({ color: 0x2a2a2a, metalness: 0.8, roughness: 0.2 })
      );
      wheelBack.rotation.z = Math.PI / 2;
      wheelBack.position.set(0, 2, -5);
      cartGroup.add(wheelBack);

      var sideLeft = new THREE.Mesh(
        new THREE.BoxGeometry(1, 8, 14),
        new THREE.MeshStandardMaterial({ color: 0xff6b35, metalness: 0.2 })
      );
      sideLeft.position.set(-4, 4, 0);
      cartGroup.add(sideLeft);

      var sideRight = new THREE.Mesh(
        new THREE.BoxGeometry(1, 8, 14),
        new THREE.MeshStandardMaterial({ color: 0xff6b35, metalness: 0.2 })
      );
      sideRight.position.set(4, 4, 0);
      cartGroup.add(sideRight);

      cartGroup.position.set(cartPos.x, cartPos.y, cartPos.z);
      scene.add(cartGroup);

      carts.push({
        group: cartGroup,
        speed: cartPos.speed,
        progress: 0,
        wheelFront: wheelFront,
        wheelBack: wheelBack
      });
    });
  };

  var buildSupportBeams = function() {
    var beamMaterial = new THREE.MeshStandardMaterial({ color: 0x8b4513, roughness: 0.8 });

    var zPositions = [-40, -20, 0, 20, 40, 60];
    zPositions.forEach(function(z) {
      var verticalBeam = new THREE.Mesh(
        new THREE.BoxGeometry(2, 45, 2),
        beamMaterial
      );
      verticalBeam.position.set(-50, 22.5, z);
      scene.add(verticalBeam);

      var verticalBeam2 = new THREE.Mesh(
        new THREE.BoxGeometry(2, 45, 2),
        beamMaterial
      );
      verticalBeam2.position.set(50, 22.5, z);
      scene.add(verticalBeam2);

      var horizontalBeam = new THREE.Mesh(
        new THREE.BoxGeometry(100, 2, 2),
        beamMaterial
      );
      horizontalBeam.position.set(0, 45, z);
      scene.add(horizontalBeam);
    });

    for (var i = -60; i <= 60; i += 10) {
      var crossBeam1 = new THREE.Mesh(
        new THREE.BoxGeometry(2, 2, 50),
        beamMaterial
      );
      crossBeam1.position.set(i, 30, 0);
      scene.add(crossBeam1);

      var crossBeam2 = new THREE.Mesh(
        new THREE.BoxGeometry(2, 2, 50),
        beamMaterial
      );
      crossBeam2.position.set(i, 15, 0);
      scene.add(crossBeam2);
    }
  };

  var buildExplosivesStorage = function() {
    var cratesMaterial = new THREE.MeshStandardMaterial({ color: 0x8b0000, roughness: 0.6 });
    var plungerMaterial = new THREE.MeshStandardMaterial({ color: 0xffff00, metalness: 0.9 });

    for (var x = -35; x <= -15; x += 10) {
      for (var z = -50; z <= -30; z += 10) {
        var crate = new THREE.Mesh(
          new THREE.BoxGeometry(8, 8, 8),
          cratesMaterial
        );
        crate.position.set(x, 12, z);
        scene.add(crate);

        var plunger = new THREE.Mesh(
          new THREE.CylinderGeometry(0.8, 0.8, 3, 8),
          plungerMaterial
        );
        plunger.position.set(x, 16, z);
        scene.add(plunger);

        var detonator = new THREE.Mesh(
          new THREE.SphereGeometry(0.4, 8, 8),
          new THREE.MeshStandardMaterial({ color: 0xff6600, emissive: 0xff3300 })
        );
        detonator.position.set(x, 18.5, z);
        scene.add(detonator);
      }
    }
  };

  var buildCaveInSection = function() {
    var rockMaterial = new THREE.MeshStandardMaterial({ color: 0x5a5a5a, roughness: 0.9 });

    var cavePosition = { x: 25, y: 0, z: 45 };

    for (var i = 0; i < 12; i++) {
      var rockSize = 8 + Math.random() * 8;
      var rock = new THREE.Mesh(
        new THREE.BoxGeometry(rockSize, rockSize * 0.7, rockSize * 0.8),
        rockMaterial
      );
      rock.position.set(
        cavePosition.x + (Math.random() - 0.5) * 30,
        cavePosition.y + rockSize * 0.35,
        cavePosition.z + (Math.random() - 0.5) * 20
      );
      rock.rotation.set(
        Math.random() * Math.PI * 0.5,
        Math.random() * Math.PI,
        Math.random() * Math.PI * 0.3
      );
      scene.add(rock);
    }

    var dustCloud = new THREE.Mesh(
      new THREE.SphereGeometry(25, 16, 16),
      new THREE.MeshStandardMaterial({ color: 0x9a9a9a, transparent: true, opacity: 0.15 })
    );
    dustCloud.position.set(cavePosition.x, cavePosition.y + 15, cavePosition.z);
    scene.add(dustCloud);
  };

  var buildUndergroundLake = function() {
    var lakeX = 70;
    var lakeY = 0;
    var lakeZ = -60;

    var waterGeometry = new THREE.BoxGeometry(40, 25, 50);
    waterBody = new THREE.Mesh(
      waterGeometry,
      new THREE.MeshStandardMaterial({
        color: 0x1e90ff,
        transparent: true,
        opacity: 0.6,
        metalness: 0.8,
        roughness: 0.1
      })
    );
    waterBody.position.set(lakeX, lakeY + 12.5, lakeZ);
    scene.add(waterBody);

    var lakeBeds = [];
    for (var i = 0; i < 8; i++) {
      var bedX = lakeX + (Math.random() - 0.5) * 35;
      var bedZ = lakeZ + (Math.random() - 0.5) * 45;
      var bed = new THREE.Mesh(
        new THREE.BoxGeometry(5 + Math.random() * 5, 2, 8),
        new THREE.MeshStandardMaterial({ color: 0x6b4423, roughness: 0.9 })
      );
      bed.position.set(bedX, 1, bedZ);
      scene.add(bed);
      lakeBeds.push(bed);
    }
  };

  var buildGemVeins = function() {
    var gemColors = [0xffff00, 0x0099ff, 0x9933ff];
    var wallPositions = [
      { x: -90, z: -30 },
      { x: -90, z: 30 },
      { x: 90, z: 0 },
      { x: 0, z: -90 },
      { x: 0, z: 90 }
    ];

    wallPositions.forEach(function(wallPos) {
      for (var i = 0; i < 5; i++) {
        var gemColor = gemColors[Math.floor(Math.random() * gemColors.length)];
        var gem = new THREE.Mesh(
          new THREE.ConeGeometry(2 + Math.random() * 2, 4 + Math.random() * 3, 6),
          new THREE.MeshStandardMaterial({
            color: gemColor,
            emissive: gemColor,
            emissiveIntensity: 0.4,
            metalness: 0.9,
            roughness: 0.2
          })
        );
        gem.position.set(
          wallPos.x + (Math.random() - 0.5) * 5,
          10 + Math.random() * 30,
          wallPos.z + (Math.random() - 0.5) * 5
        );
        gem.rotation.set(
          Math.random() * Math.PI,
          Math.random() * Math.PI,
          Math.random() * Math.PI
        );
        scene.add(gem);
        gemVeins.push(gem);
      }
    });
  };

  var buildOreProcessing = function() {
    var baseX = -60;
    var baseY = 8;
    var baseZ = 30;

    var base = new THREE.Mesh(
      new THREE.BoxGeometry(30, 4, 20),
      new THREE.MeshStandardMaterial({ color: 0x4a4a4a, roughness: 0.8 })
    );
    base.position.set(baseX, baseY, baseZ);
    scene.add(base);

    var frame1 = new THREE.Mesh(
      new THREE.BoxGeometry(3, 25, 3),
      new THREE.MeshStandardMaterial({ color: 0x2a2a2a, metalness: 0.7 })
    );
    frame1.position.set(baseX - 12, baseY + 12.5, baseZ - 8);
    scene.add(frame1);

    var frame2 = new THREE.Mesh(
      new THREE.BoxGeometry(3, 25, 3),
      new THREE.MeshStandardMaterial({ color: 0x2a2a2a, metalness: 0.7 })
    );
    frame2.position.set(baseX + 12, baseY + 12.5, baseZ - 8);
    scene.add(frame2);

    crusherDrum = new THREE.Mesh(
      new THREE.CylinderGeometry(6, 6, 18, 16),
      new THREE.MeshStandardMaterial({ color: 0x1a1a1a, metalness: 0.9, roughness: 0.3 })
    );
    crusherDrum.rotation.z = Math.PI / 2;
    crusherDrum.position.set(baseX, baseY + 12, baseZ);
    scene.add(crusherDrum);

    var hopper = new THREE.Mesh(
      new THREE.BoxGeometry(22, 15, 16),
      new THREE.MeshStandardMaterial({ color: 0x8b7355, roughness: 0.7 })
    );
    hopper.position.set(baseX, baseY + 22.5, baseZ);
    scene.add(hopper);

    crusher = {
      drum: crusherDrum,
      rotation: 0
    };
  };

  var buildHeadlamps = function() {
    var lampPositions = [];
    for (var x = -80; x <= 80; x += 20) {
      for (var z = -60; z <= 80; z += 15) {
        lampPositions.push({ x: x, z: z });
      }
    }

    lampPositions.forEach(function(pos) {
      var lampGroup = new THREE.Group();

      var lampBulb = new THREE.Mesh(
        new THREE.SphereGeometry(1.2, 8, 8),
        new THREE.MeshStandardMaterial({
          color: 0xffdd77,
          emissive: 0xffdd77,
          emissiveIntensity: 0.6
        })
      );
      lampGroup.add(lampBulb);

      var lampCage = new THREE.Mesh(
        new THREE.CylinderGeometry(1.5, 1.5, 2.5, 8),
        new THREE.MeshStandardMaterial({ color: 0x8b7355, roughness: 0.8 })
      );
      lampCage.position.y = -1.5;
      lampGroup.add(lampCage);

      var lampBracket = new THREE.Mesh(
        new THREE.BoxGeometry(0.5, 3, 0.5),
        new THREE.MeshStandardMaterial({ color: 0x2a2a2a, metalness: 0.7 })
      );
      lampBracket.position.set(0, -2.5, 0);
      lampGroup.add(lampBracket);

      lampGroup.position.set(pos.x, 42, pos.z);
      scene.add(lampGroup);

      lanterns.push({
        bulb: lampBulb,
        baseIntensity: 0.6,
        phase: Math.random() * Math.PI * 2
      });
    });
  };

  var buildDynamiteCharges = function() {
    var chargePositions = [
      { x: 15, y: 8, z: 35 },
      { x: -25, y: 10, z: 50 },
      { x: 45, y: 6, z: 15 },
      { x: -45, y: 12, z: -25 }
    ];

    chargePositions.forEach(function(pos) {
      for (var i = 0; i < 3; i++) {
        var stick = new THREE.Mesh(
          new THREE.CylinderGeometry(0.6, 0.6, 4, 8),
          new THREE.MeshStandardMaterial({ color: 0xff0000, roughness: 0.9 })
        );
        stick.position.set(pos.x + i * 1.5, pos.y, pos.z);
        scene.add(stick);

        var fuseStart = new THREE.Vector3(pos.x + i * 1.5, pos.y + 2, pos.z);
        var fuseEnd = new THREE.Vector3(pos.x + i * 1.5 + 3, pos.y + 5, pos.z);
        var fuseGeometry = new THREE.Geometry();
        fuseGeometry.vertices.push(fuseStart);
        fuseGeometry.vertices.push(fuseEnd);

        var fuse = new THREE.LineSegments(
          fuseGeometry,
          new THREE.LineBasicMaterial({ color: 0xffff00, linewidth: 1.5 })
        );
        scene.add(fuse);
      }
    });
  };

  var buildCanaryCage = function() {
    var cageX = -70;
    var cageY = 40;
    var cageZ = 50;

    var cageFrame = new THREE.Mesh(
      new THREE.CylinderGeometry(3, 3, 6, 12),
      new THREE.MeshStandardMaterial({ color: 0x8b7355, roughness: 0.7 })
    );
    cageFrame.position.set(cageX, cageY, cageZ);
    scene.add(cageFrame);

    var cageBars = [];
    for (var i = 0; i < 8; i++) {
      var angle = (i / 8) * Math.PI * 2;
      var barX = cageX + Math.cos(angle) * 3;
      var barZ = cageZ + Math.sin(angle) * 3;

      var bar = new THREE.Mesh(
        new THREE.CylinderGeometry(0.2, 0.2, 6, 4),
        new THREE.MeshStandardMaterial({ color: 0x8b7355, roughness: 0.8 })
      );
      bar.position.set(barX, cageY, barZ);
      scene.add(bar);
      cageBars.push(bar);
    }

    var cageBottom = new THREE.Mesh(
      new THREE.CylinderGeometry(2.8, 2.8, 0.4, 12),
      new THREE.MeshStandardMaterial({ color: 0x8b7355, roughness: 0.7 })
    );
    cageBottom.position.set(cageX, cageY - 3, cageZ);
    scene.add(cageBottom);

    canaryBird = new THREE.Mesh(
      new THREE.SphereGeometry(0.4, 6, 6),
      new THREE.MeshStandardMaterial({
        color: 0xffdd00,
        emissive: 0xffaa00,
        emissiveIntensity: 0.3
      })
    );
    canaryBird.position.set(cageX, cageY - 1, cageZ);
    scene.add(canaryBird);

    var wing = new THREE.Mesh(
      new THREE.SphereGeometry(0.2, 4, 4),
      new THREE.MeshStandardMaterial({ color: 0xffdd00 })
    );
    wing.scale.set(2, 0.5, 0.3);
    wing.position.set(cageX + 0.3, cageY - 0.9, cageZ);
    canaryBird.add(wing);

    canary = {
      bird: canaryBird,
      cageX: cageX,
      cageY: cageY,
      cageZ: cageZ,
      bouncePhase: 0
    };
  };

  var update = function(delta) {
    canyonTime += delta;

    carts.forEach(function(cart) {
      cart.progress += cart.speed * delta;
      if (cart.progress > 1) cart.progress = 0;

      var t = cart.progress;
      var x = -70 + (t * 150);
      var z = -35 + (t * 95);
      var y = 7 + Math.sin(t * Math.PI) * 3;

      cart.group.position.set(x, y, z);

      cart.wheelFront.rotation.x += 0.1;
      cart.wheelBack.rotation.x += 0.1;
    });

    if (crusher && crusherDrum) {
      crusher.rotation += 0.02;
      crusherDrum.rotation.z = crusher.rotation;
    }

    waterBody.position.y = 12.5 + Math.sin(canyonTime * 0.5) * 0.3;

    lanterns.forEach(function(lantern, index) {
      var flicker = lantern.baseIntensity + Math.sin(canyonTime * 3 + lantern.phase) * 0.15;
      lantern.bulb.material.emissiveIntensity = flicker;
    });

    gemVeins.forEach(function(gem) {
      gem.rotation.x += 0.005;
      gem.rotation.y += 0.008;
      var pulse = 0.3 + Math.sin(canyonTime * 2 + gem.position.x) * 0.2;
      gem.material.emissiveIntensity = pulse;
    });

    if (canary && canaryBird) {
      canary.bouncePhase += 0.05;
      canaryBird.position.y = canary.cageY - 1 + Math.sin(canary.bouncePhase) * 0.8;
      canaryBird.rotation.z = Math.sin(canary.bouncePhase * 0.5) * 0.3;
    }
  };

  var reset = function() {
    carts.forEach(function(cart) {
      cart.progress = 0;
      cart.group.position.set(-70, 7, -35);
    });
    canyonTime = 0;
    if (crusher) crusher.rotation = 0;
  };

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
