window.DeltaForce = (function() {
  'use strict';

  var scene = null;
  var sceneObjects = [];
  var animationState = {
    holographicRotation: 0,
    antennaRotation: 0,
    chargingPulse: 0,
    heloMarkerBlink: 0
  };

  function createHALOJumpRack() {
    var group = new THREE.Group();

    // Main frame
    var frameMaterial = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, metalness: 0.8 });
    var frame = new THREE.Mesh(new THREE.BoxGeometry(1.5, 3, 0.3), frameMaterial);
    frame.position.set(0, 1.5, 0);
    group.add(frame);

    // Harness rack pegs
    var pegMaterial = new THREE.MeshStandardMaterial({ color: 0xff6600, metalness: 0.9 });
    for (var i = 0; i < 4; i++) {
      var peg = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.3, 16), pegMaterial);
      peg.rotation.z = Math.PI / 2;
      peg.position.set(0.6, 2.2 - i * 0.6, 0.25);
      group.add(peg);
    }

    return group;
  }

  function createFastRopeAnchor() {
    var group = new THREE.Group();

    // Main beam
    var beamMaterial = new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.7 });
    var beam = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 4, 16), beamMaterial);
    beam.rotation.z = Math.PI / 2;
    beam.position.set(0, 2, 0);
    group.add(beam);

    // Anchor points
    var anchorMaterial = new THREE.MeshStandardMaterial({ color: 0xffaa00, metalness: 0.95 });
    for (var i = 0; i < 3; i++) {
      var anchor = new THREE.Mesh(new THREE.SphereGeometry(0.12, 16, 16), anchorMaterial);
      anchor.position.set(1.5 - i * 1.5, 2.3, 0);
      group.add(anchor);
    }

    // Rope lines
    var ropeGeometry = new THREE.BufferGeometry();
    var ropePositions = new Float32Array([
      1.5, 2, 0, 1.5, -2, 0,
      0, 2, 0, 0, -2, 0,
      -1.5, 2, 0, -1.5, -2, 0
    ]);
    ropeGeometry.setAttribute('position', new THREE.BufferAttribute(ropePositions, 3));
    var ropeMaterial = new THREE.LineBasicMaterial({ color: 0xcccccc, linewidth: 2 });
    var ropes = new THREE.LineSegments(ropeGeometry, ropeMaterial);
    group.add(ropes);

    return group;
  }

  function createHolographicMap() {
    var group = new THREE.Group();

    // Base table
    var tableMaterial = new THREE.MeshStandardMaterial({ color: 0x0a0a0a, metalness: 0.6 });
    var tableTop = new THREE.Mesh(new THREE.BoxGeometry(2, 0.1, 2), tableMaterial);
    tableTop.position.y = 0.05;
    group.add(tableTop);

    var tableBase = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.5, 2.2), tableMaterial);
    tableBase.position.y = -0.25;
    group.add(tableBase);

    // Holographic display cylinder
    var hologramMaterial = new THREE.MeshStandardMaterial({
      color: 0x00ff00,
      metalness: 0.3,
      emissive: 0x00aa00,
      emissiveIntensity: 0.5,
      transparent: true,
      opacity: 0.7
    });
    var hologram = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 1.5, 32), hologramMaterial);
    hologram.position.y = 1;
    hologram.userData.isHologram = true;
    group.add(hologram);

    // Control panel
    var panelMaterial = new THREE.MeshStandardMaterial({ color: 0x1a1a1a });
    var panel = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.3, 0.2), panelMaterial);
    panel.position.set(0, 0.2, -1.1);
    group.add(panel);

    // Control buttons
    var buttonMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000, metalness: 0.8 });
    for (var i = 0; i < 3; i++) {
      var button = new THREE.Mesh(new THREE.SphereGeometry(0.08, 16, 16), buttonMaterial);
      button.position.set(-0.5 + i * 0.5, 0.35, -1.05);
      group.add(button);
    }

    return group;
  }

  function createCommsStation() {
    var group = new THREE.Group();

    // Main console
    var consoleMaterial = new THREE.MeshStandardMaterial({ color: 0x151515, metalness: 0.5 });
    var console = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.2, 0.6), consoleMaterial);
    console.position.set(0, 0.6, 0);
    group.add(console);

    // Screen display
    var screenMaterial = new THREE.MeshStandardMaterial({
      color: 0x001a00,
      emissive: 0x003300,
      emissiveIntensity: 0.3
    });
    var screen = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.7, 0.05), screenMaterial);
    screen.position.set(0, 1.05, 0.3);
    group.add(screen);

    // Antenna
    var antennaMaterial = new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.9 });
    var antenna = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.5, 16), antennaMaterial);
    antenna.position.set(0.65, 1.8, 0);
    antenna.userData.isAntenna = true;
    group.add(antenna);

    // Antenna base
    var antennaBase = new THREE.Mesh(new THREE.SphereGeometry(0.1, 16, 16), antennaMaterial);
    antennaBase.position.set(0.65, 1.2, 0);
    group.add(antennaBase);

    // Control knobs
    var knobMaterial = new THREE.MeshStandardMaterial({ color: 0xaa6600, metalness: 0.7 });
    for (var i = 0; i < 4; i++) {
      var knob = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.15, 16), knobMaterial);
      knob.rotation.z = Math.PI / 2;
      knob.position.set(-0.4 + i * 0.3, 0.4, 0.35);
      group.add(knob);
    }

    return group;
  }

  function createNightVisionChargers() {
    var group = new THREE.Group();

    // Charging station frame
    var frameMaterial = new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.6 });
    var station = new THREE.Mesh(new THREE.BoxGeometry(2, 1.5, 0.4), frameMaterial);
    station.position.y = 0.75;
    group.add(station);

    // Charging slots for goggles
    var slotMaterial = new THREE.MeshStandardMaterial({ color: 0x001a00 });
    for (var i = 0; i < 6; i++) {
      var slot = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.5, 0.25), slotMaterial);
      slot.position.set(-0.8 + i * 0.35, 1, 0);
      slot.userData.chargingSlot = i;
      group.add(slot);
    }

    // Indicator lights
    var lightMaterial = new THREE.MeshStandardMaterial({
      color: 0x00ff00,
      emissive: 0x00aa00,
      emissiveIntensity: 0.6
    });
    for (var i = 0; i < 6; i++) {
      var light = new THREE.Mesh(new THREE.SphereGeometry(0.05, 16, 16), lightMaterial);
      light.position.set(-0.8 + i * 0.35, 1.35, 0.15);
      light.userData.indicatorLight = i;
      group.add(light);
    }

    return group;
  }

  function createBreachingBench() {
    var group = new THREE.Group();

    // Work bench surface
    var benchMaterial = new THREE.MeshStandardMaterial({ color: 0x3a2817, metalness: 0.4 });
    var benchTop = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.1, 1), benchMaterial);
    benchTop.position.y = 0.7;
    group.add(benchTop);

    // Bench legs
    for (var i = 0; i < 4; i++) {
      var leg = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.7, 0.1), benchMaterial);
      leg.position.set(-1 + i * 0.7, 0.35, i % 2 === 0 ? 0.4 : -0.4);
      group.add(leg);
    }

    // Breaching charges (cone shaped)
    var chargeMaterial = new THREE.MeshStandardMaterial({ color: 0xff3300, metalness: 0.3 });
    for (var i = 0; i < 3; i++) {
      var charge = new THREE.Mesh(new THREE.ConeGeometry(0.15, 0.4, 16), chargeMaterial);
      charge.position.set(-0.7 + i * 0.7, 0.9, 0);
      group.add(charge);
    }

    // Tool rack
    var toolRackMaterial = new THREE.MeshStandardMaterial({ color: 0x444444, metalness: 0.5 });
    var rack = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.15, 0.15), toolRackMaterial);
    rack.position.set(0, 1.3, 0.5);
    group.add(rack);

    return group;
  }

  function createSniperZerogRange() {
    var group = new THREE.Group();

    // Shooting bench
    var benchMaterial = new THREE.MeshStandardMaterial({ color: 0x2a2a2a, metalness: 0.5 });
    var bench = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.3, 0.8), benchMaterial);
    bench.position.set(0, 0.15, 0);
    group.add(bench);

    // Target stand
    var standMaterial = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, metalness: 0.4 });
    var stand = new THREE.Mesh(new THREE.BoxGeometry(0.2, 2, 0.2), standMaterial);
    stand.position.set(0, 1, 3);
    group.add(stand);

    // Target with concentric circles (approximated with spheres)
    var targetMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff });
    var target = new THREE.Mesh(new THREE.SphereGeometry(0.5, 16, 16), targetMaterial);
    target.position.set(0, 1, 3.3);
    target.scale.set(1, 1, 0.1);
    group.add(target);

    // Scope rail on bench
    var railMaterial = new THREE.MeshStandardMaterial({ color: 0x555555, metalness: 0.7 });
    var rail = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.5, 16), railMaterial);
    rail.rotation.z = Math.PI / 2;
    rail.position.set(0, 0.4, 0);
    group.add(rail);

    return group;
  }

  function createCQBKillHouse() {
    var group = new THREE.Group();

    // Main structure - walls
    var wallMaterial = new THREE.MeshStandardMaterial({ color: 0x4a4a4a, metalness: 0.2 });

    var frontWall = new THREE.Mesh(new THREE.BoxGeometry(3, 2.5, 0.2), wallMaterial);
    frontWall.position.set(0, 1.25, -2);
    group.add(frontWall);

    var leftWall = new THREE.Mesh(new THREE.BoxGeometry(0.2, 2.5, 4), wallMaterial);
    leftWall.position.set(-1.5, 1.25, 0);
    group.add(leftWall);

    var rightWall = new THREE.Mesh(new THREE.BoxGeometry(0.2, 2.5, 4), wallMaterial);
    rightWall.position.set(1.5, 1.25, 0);
    group.add(rightWall);

    // Door frame
    var doorFrameMaterial = new THREE.MeshStandardMaterial({ color: 0xaa6600, metalness: 0.6 });
    var doorFrame = new THREE.Mesh(new THREE.BoxGeometry(0.8, 2, 0.15), doorFrameMaterial);
    doorFrame.position.set(0, 1, -1.95);
    group.add(doorFrame);

    // Training targets (sphere-based)
    var targetMaterial = new THREE.MeshStandardMaterial({ color: 0x990000, emissive: 0x330000 });
    for (var i = 0; i < 3; i++) {
      var targetObj = new THREE.Mesh(new THREE.SphereGeometry(0.2, 16, 16), targetMaterial);
      targetObj.position.set(-0.8 + i * 0.8, 1.3, -1);
      group.add(targetObj);
    }

    return group;
  }

  function createMedicalTraumaStation() {
    var group = new THREE.Group();

    // Medical table
    var tableMaterial = new THREE.MeshStandardMaterial({ color: 0xf5f5dc, metalness: 0.3 });
    var tableTop = new THREE.Mesh(new THREE.BoxGeometry(2, 0.15, 1), tableMaterial);
    tableTop.position.set(0, 0.8, 0);
    group.add(tableTop);

    var tableLeg = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.8, 0.15), tableMaterial);
    tableLeg.position.set(-0.9, 0.4, -0.4);
    group.add(tableLeg);

    var tableLeg2 = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.8, 0.15), tableMaterial);
    tableLeg2.position.set(0.9, 0.4, -0.4);
    group.add(tableLeg2);

    // Supply cabinet
    var cabinetMaterial = new THREE.MeshStandardMaterial({ color: 0xaa0000, metalness: 0.4 });
    var cabinet = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.5, 0.6), cabinetMaterial);
    cabinet.position.set(0, 0.75, 1.2);
    group.add(cabinet);

    // Supply drawers (3 compartments)
    var drawerMaterial = new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.5 });
    for (var i = 0; i < 3; i++) {
      var drawer = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.3, 0.3), drawerMaterial);
      drawer.position.set(-0.3 + i * 0.3, 1.2 - i * 0.35, 1.5);
      group.add(drawer);
    }

    return group;
  }

  function createHelicopterLandingZone() {
    var group = new THREE.Group();

    // Main H marker structure - using lines
    var markerGeometry = new THREE.BufferGeometry();
    var markerPositions = new Float32Array([
      -1, 0.01, -1, -1, 0.01, 1,
      1, 0.01, -1, 1, 0.01, 1,
      -1, 0.01, 0, 1, 0.01, 0,
      0, 0.01, -1, 0, 0.01, 1
    ]);
    markerGeometry.setAttribute('position', new THREE.BufferAttribute(markerPositions, 3));
    var markerMaterial = new THREE.LineBasicMaterial({ color: 0xffff00, linewidth: 3 });
    var marker = new THREE.LineSegments(markerGeometry, markerMaterial);
    group.add(marker);

    // Landing zone boundary lights
    var lightMaterial = new THREE.MeshStandardMaterial({
      color: 0xff6600,
      emissive: 0xff3300,
      emissiveIntensity: 0.7
    });
    for (var i = 0; i < 8; i++) {
      var angle = (i / 8) * Math.PI * 2;
      var light = new THREE.Mesh(new THREE.SphereGeometry(0.15, 16, 16), lightMaterial);
      light.position.set(
        Math.cos(angle) * 1.5,
        0.2,
        Math.sin(angle) * 1.5
      );
      light.userData.heloMarkerLight = true;
      group.add(light);
    }

    // Center landing pad
    var padMaterial = new THREE.MeshStandardMaterial({
      color: 0x333333,
      metalness: 0.3
    });
    var pad = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, 0.05, 32), padMaterial);
    pad.position.y = 0.025;
    group.add(pad);

    return group;
  }

  function init() {
    if (!THREE || !THREE.Scene) {
      console.error('THREE.js not loaded');
      return false;
    }

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a0a);
    scene.fog = new THREE.Fog(0x0a0a0a, 20, 50);

    // Lighting
    var ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    var directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 10, 10);
    scene.add(directionalLight);

    var pointLight1 = new THREE.PointLight(0x00ff00, 0.5, 20);
    pointLight1.position.set(0, 2, 0);
    scene.add(pointLight1);

    var pointLight2 = new THREE.PointLight(0xff6600, 0.4, 20);
    pointLight2.position.set(10, 5, 10);
    scene.add(pointLight2);

    // Create all scene objects
    var haloRack = createHALOJumpRack();
    haloRack.position.set(-8, 0, -5);
    scene.add(haloRack);
    sceneObjects.push(haloRack);

    var fastRope = createFastRopeAnchor();
    fastRope.position.set(-4, 0, -5);
    scene.add(fastRope);
    sceneObjects.push(fastRope);

    var holoMap = createHolographicMap();
    holoMap.position.set(0, 0, -8);
    scene.add(holoMap);
    sceneObjects.push(holoMap);

    var comms = createCommsStation();
    comms.position.set(4, 0, -5);
    scene.add(comms);
    sceneObjects.push(comms);

    var nvChargers = createNightVisionChargers();
    nvChargers.position.set(-8, 0, 2);
    scene.add(nvChargers);
    sceneObjects.push(nvChargers);

    var breachBench = createBreachingBench();
    breachBench.position.set(-2, 0, 3);
    scene.add(breachBench);
    sceneObjects.push(breachBench);

    var sniperRange = createSniperZerogRange();
    sniperRange.position.set(4, 0, 2);
    scene.add(sniperRange);
    sceneObjects.push(sniperRange);

    var cqbKill = createCQBKillHouse();
    cqbKill.position.set(0, 0, 6);
    scene.add(cqbKill);
    sceneObjects.push(cqbKill);

    var medicalStation = createMedicalTraumaStation();
    medicalStation.position.set(8, 0, 3);
    scene.add(medicalStation);
    sceneObjects.push(medicalStation);

    var heloZone = createHelicopterLandingZone();
    heloZone.position.set(0, 0, 12);
    scene.add(heloZone);
    sceneObjects.push(heloZone);

    return true;
  }

  function update() {
    if (!scene) return false;

    animationState.holographicRotation += 0.01;
    animationState.antennaRotation += 0.02;
    animationState.chargingPulse += 0.05;
    animationState.heloMarkerBlink += 0.1;

    // Rotate holographic map
    scene.traverse(function(obj) {
      if (obj.userData && obj.userData.isHologram) {
        obj.rotation.y = animationState.holographicRotation;
      }

      // Rotate antenna
      if (obj.userData && obj.userData.isAntenna) {
        obj.rotation.x = Math.sin(animationState.antennaRotation) * 0.3;
      }

      // Pulse charging indicators
      if (obj.userData && obj.userData.indicatorLight !== undefined) {
        var pulseValue = Math.sin(animationState.chargingPulse + obj.userData.indicatorLight * 0.3);
        obj.material.emissiveIntensity = 0.3 + pulseValue * 0.4;
      }

      // Blink helo marker lights
      if (obj.userData && obj.userData.heloMarkerLight) {
        var blinkValue = Math.sin(animationState.heloMarkerBlink) > 0 ? 1 : 0.2;
        obj.material.emissiveIntensity = blinkValue;
      }
    });

    return true;
  }

  function reset() {
    if (!scene) return false;

    // Remove all objects from scene
    for (var i = sceneObjects.length - 1; i >= 0; i--) {
      scene.remove(sceneObjects[i]);
    }
    sceneObjects = [];

    // Reset animation state
    animationState = {
      holographicRotation: 0,
      antennaRotation: 0,
      chargingPulse: 0,
      heloMarkerBlink: 0
    };

    return true;
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
