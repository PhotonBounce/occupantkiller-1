window.QuantumLab = (function() {
  'use strict';

  var objects = [];
  var animationObjects = {};

  function init(scene, camera) {
    if (!scene) return;

    // Particle Accelerator Ring
    var accelGeom = new THREE.CylinderGeometry(20, 20, 2, 64);
    var accelMat = new THREE.MeshStandardMaterial({ color: 0x334455 });
    var accelMesh = new THREE.Mesh(accelGeom, accelMat);
    accelMesh.position.set(-30, 10, -20);
    scene.add(accelMesh);
    objects.push(accelMesh);

    // Particle accelerator beam path (LineSegments)
    var beamPoints = [];
    for (var i = 0; i <= 64; i++) {
      var angle = (i / 64) * Math.PI * 2;
      beamPoints.push(
        new THREE.Vector3(Math.cos(angle) * 20, 10, Math.sin(angle) * 20 - 20)
      );
    }
    var beamGeom = new THREE.BufferGeometry().setFromPoints(beamPoints);
    var beamMat = new THREE.LineBasicMaterial({ color: 0x00AAFF });
    var beamLine = new THREE.Line(beamGeom, beamMat);
    beamLine.position.x = -30;
    scene.add(beamLine);
    objects.push(beamLine);
    animationObjects.acceleratorBeam = beamLine;

    // Quantum Computer Array
    var qcGeom = new THREE.BoxGeometry(8, 12, 8);
    var qcMat = new THREE.MeshStandardMaterial({ color: 0x001133 });
    var qcMesh = new THREE.Mesh(qcGeom, qcMat);
    qcMesh.position.set(10, 6, 0);
    scene.add(qcMesh);
    objects.push(qcMesh);

    // Quantum Computer Qubits
    for (var q = 0; q < 4; q++) {
      var qubitGeom = new THREE.SphereGeometry(1, 16, 16);
      var qubitMat = new THREE.MeshStandardMaterial({
        color: 0x00AAFF,
        emissive: 0x00AAFF,
        emissiveIntensity: 0.5
      });
      var qubitMesh = new THREE.Mesh(qubitGeom, qubitMat);
      qubitMesh.position.set(8 + q * 1.5, 8 + q * 2, 0);
      scene.add(qubitMesh);
      objects.push(qubitMesh);
      animationObjects['qubit' + q] = qubitMesh;
    }

    // Dimensional Rift Containment
    var riftGeom = new THREE.SphereGeometry(5, 32, 32);
    var riftMat = new THREE.MeshStandardMaterial({
      color: 0x8800FF,
      emissive: 0x8800FF,
      emissiveIntensity: 0.7
    });
    var riftMesh = new THREE.Mesh(riftGeom, riftMat);
    riftMesh.position.set(0, 8, 20);
    scene.add(riftMesh);
    objects.push(riftMesh);
    animationObjects.rift = riftMesh;

    // Dimensional rift containment ring
    var riftRingPoints = [];
    for (var ri = 0; ri <= 64; ri++) {
      var rangle = (ri / 64) * Math.PI * 2;
      riftRingPoints.push(
        new THREE.Vector3(Math.cos(rangle) * 6, 0, Math.sin(rangle) * 6)
      );
    }
    var riftRingGeom = new THREE.BufferGeometry().setFromPoints(riftRingPoints);
    var riftRingMat = new THREE.LineBasicMaterial({ color: 0xFF00FF });
    var riftRing = new THREE.Line(riftRingGeom, riftRingMat);
    riftRing.position.copy(riftMesh.position);
    scene.add(riftRing);
    objects.push(riftRing);

    // Cryogenic Cooling Pods
    for (var c = 0; c < 3; c++) {
      var cryo1Geom = new THREE.CylinderGeometry(2, 2, 8, 16);
      var cryoMat = new THREE.MeshStandardMaterial({
        color: 0x2244AA,
        emissive: 0x2244AA,
        emissiveIntensity: 0.4
      });
      var cryoMesh = new THREE.Mesh(cryo1Geom, cryoMat);
      cryoMesh.position.set(-15 + c * 8, 4, 10);
      scene.add(cryoMesh);
      objects.push(cryoMesh);
    }

    // Laser Optical Bench
    var laserBenchGeom = new THREE.BoxGeometry(12, 2, 3);
    var laserBenchMat = new THREE.MeshStandardMaterial({ color: 0x333344 });
    var laserBenchMesh = new THREE.Mesh(laserBenchGeom, laserBenchMat);
    laserBenchMesh.position.set(5, 2, -15);
    scene.add(laserBenchMesh);
    objects.push(laserBenchMesh);

    // Laser Emitters
    for (var l = 0; l < 3; l++) {
      var laserEmitterGeom = new THREE.CylinderGeometry(0.8, 0.8, 2, 16);
      var laserEmitterMat = new THREE.MeshStandardMaterial({ color: 0xFF0000 });
      var laserEmitterMesh = new THREE.Mesh(laserEmitterGeom, laserEmitterMat);
      laserEmitterMesh.position.set(-4 + l * 4, 3.5, -15);
      scene.add(laserEmitterMesh);
      objects.push(laserEmitterMesh);
      animationObjects['laserEmitter' + l] = laserEmitterMesh;
    }

    // Antimatter Storage Units
    for (var a = 0; a < 2; a++) {
      var antimatterStorageGeom = new THREE.CylinderGeometry(1.5, 1.5, 6, 16);
      var antimatterStorageMat = new THREE.MeshStandardMaterial({ color: 0x333355 });
      var antimatterStorageMesh = new THREE.Mesh(antimatterStorageGeom, antimatterStorageMat);
      antimatterStorageMesh.position.set(-20 + a * 15, 3, -5);
      scene.add(antimatterStorageMesh);
      objects.push(antimatterStorageMesh);

      var antimatterSphereGeom = new THREE.SphereGeometry(1.2, 16, 16);
      var antimatterSphereMat = new THREE.MeshStandardMaterial({
        color: 0x00FFFF,
        emissive: 0x00FFFF,
        emissiveIntensity: 0.6
      });
      var antimatterSphereMesh = new THREE.Mesh(antimatterSphereGeom, antimatterSphereMat);
      antimatterSphereMesh.position.set(-20 + a * 15, 4.5, -5);
      scene.add(antimatterSphereMesh);
      objects.push(antimatterSphereMesh);
    }

    // Gravity Well Device
    var gravityWellGeom = new THREE.SphereGeometry(4, 24, 24);
    var gravityWellMat = new THREE.MeshStandardMaterial({
      color: 0x0044AA,
      emissive: 0x0044AA,
      emissiveIntensity: 0.5
    });
    var gravityWellMesh = new THREE.Mesh(gravityWellGeom, gravityWellMat);
    gravityWellMesh.position.set(20, 8, 10);
    scene.add(gravityWellMesh);
    objects.push(gravityWellMesh);
    animationObjects.gravityWell = gravityWellMesh;

    // Holographic Data Displays
    for (var h = 0; h < 2; h++) {
      var holoDisplayGeom = new THREE.BoxGeometry(4, 6, 0.5);
      var holoDisplayMat = new THREE.MeshStandardMaterial({
        color: 0x001122,
        emissive: 0x00CCFF,
        emissiveIntensity: 0.5
      });
      var holoDisplayMesh = new THREE.Mesh(holoDisplayGeom, holoDisplayMat);
      holoDisplayMesh.position.set(-10 + h * 20, 8, -25);
      scene.add(holoDisplayMesh);
      objects.push(holoDisplayMesh);
    }

    // Magnetic Containment Rings
    var magRingGeom = new THREE.CylinderGeometry(8, 8, 1, 32);
    var magRingMat = new THREE.MeshStandardMaterial({ color: 0x555566 });
    var magRingMesh = new THREE.Mesh(magRingGeom, magRingMat);
    magRingMesh.position.set(0, 6, -10);
    scene.add(magRingMesh);
    objects.push(magRingMesh);

    // Magnetic containment coils (LineSegments)
    var coilPoints = [];
    for (var ci = 0; ci <= 32; ci++) {
      var cangle = (ci / 32) * Math.PI * 2;
      coilPoints.push(
        new THREE.Vector3(Math.cos(cangle) * 8.5, (ci / 32) * 2 - 1, Math.sin(cangle) * 8.5)
      );
    }
    var coilGeom = new THREE.BufferGeometry().setFromPoints(coilPoints);
    var coilMat = new THREE.LineBasicMaterial({ color: 0x00FFFF });
    var coilLine = new THREE.Line(coilGeom, coilMat);
    coilLine.position.copy(magRingMesh.position);
    scene.add(coilLine);
    objects.push(coilLine);

    // Particle Beam Emitters
    for (var pb = 0; pb < 2; pb++) {
      var beamEmitterGeom = new THREE.CylinderGeometry(0.6, 0.6, 3, 16);
      var beamEmitterMat = new THREE.MeshStandardMaterial({ color: 0x444455 });
      var beamEmitterMesh = new THREE.Mesh(beamEmitterGeom, beamEmitterMat);
      beamEmitterMesh.position.set(15 + pb * 8, 5, 0);
      scene.add(beamEmitterMesh);
      objects.push(beamEmitterMesh);

      var beamEndGeom = new THREE.SphereGeometry(0.8, 12, 12);
      var beamEndMat = new THREE.MeshStandardMaterial({
        color: 0xFFAA00,
        emissive: 0xFFAA00,
        emissiveIntensity: 0.7
      });
      var beamEndMesh = new THREE.Mesh(beamEndGeom, beamEndMat);
      beamEndMesh.position.set(15 + pb * 8, 6.5, 0);
      scene.add(beamEndMesh);
      objects.push(beamEndMesh);
      animationObjects['beamEmitter' + pb] = beamEndMesh;
    }

    // Quantum Entanglement Chamber
    var entangledChamberGeom = new THREE.BoxGeometry(6, 8, 6);
    var entangledChamberMat = new THREE.MeshStandardMaterial({ color: 0x001133 });
    var entangledChamberMesh = new THREE.Mesh(entangledChamberGeom, entangledChamberMat);
    entangledChamberMesh.position.set(-25, 4, 0);
    scene.add(entangledChamberMesh);
    objects.push(entangledChamberMesh);

    // Twin Qubits in Entanglement Chamber
    var twinQubit1Geom = new THREE.SphereGeometry(1.5, 16, 16);
    var twinQubitMat = new THREE.MeshStandardMaterial({
      color: 0x00AAFF,
      emissive: 0x00AAFF,
      emissiveIntensity: 0.6
    });
    var twinQubit1Mesh = new THREE.Mesh(twinQubit1Geom, twinQubitMat);
    twinQubit1Mesh.position.set(-27, 5, 0);
    scene.add(twinQubit1Mesh);
    objects.push(twinQubit1Mesh);
    animationObjects.twinQubit1 = twinQubit1Mesh;

    var twinQubit2Geom = new THREE.SphereGeometry(1.5, 16, 16);
    var twinQubit2Mesh = new THREE.Mesh(twinQubit2Geom, twinQubitMat);
    twinQubit2Mesh.position.set(-23, 5, 0);
    scene.add(twinQubit2Mesh);
    objects.push(twinQubit2Mesh);
    animationObjects.twinQubit2 = twinQubit2Mesh;

    // Emergency Containment Shields
    var shieldGeom = new THREE.BoxGeometry(15, 15, 1);
    var shieldMat = new THREE.MeshStandardMaterial({ color: 0x334455 });
    var shieldMesh = new THREE.Mesh(shieldGeom, shieldMat);
    shieldMesh.position.set(0, 8, -30);
    scene.add(shieldMesh);
    objects.push(shieldMesh);
    animationObjects.shield = shieldMesh;

    // Scientist Workstation Cluster
    for (var w = 0; w < 3; w++) {
      var deskGeom = new THREE.BoxGeometry(3, 2, 2);
      var deskMat = new THREE.MeshStandardMaterial({ color: 0x334466 });
      var deskMesh = new THREE.Mesh(deskGeom, deskMat);
      deskMesh.position.set(-8 + w * 6, 1, 15);
      scene.add(deskMesh);
      objects.push(deskMesh);

      var screenGeom = new THREE.BoxGeometry(2.5, 1.5, 0.2);
      var screenMat = new THREE.MeshStandardMaterial({
        color: 0x001122,
        emissive: 0x00CCFF,
        emissiveIntensity: 0.4
      });
      var screenMesh = new THREE.Mesh(screenGeom, screenMat);
      screenMesh.position.set(-8 + w * 6, 3.5, 15);
      scene.add(screenMesh);
      objects.push(screenMesh);
    }

    // Power Fusion Core
    var fusionCoreGeom = new THREE.SphereGeometry(3, 24, 24);
    var fusionCoreMat = new THREE.MeshStandardMaterial({
      color: 0xFF5500,
      emissive: 0xFF5500,
      emissiveIntensity: 0.8
    });
    var fusionCoreMesh = new THREE.Mesh(fusionCoreGeom, fusionCoreMat);
    fusionCoreMesh.position.set(15, 10, -20);
    scene.add(fusionCoreMesh);
    objects.push(fusionCoreMesh);
    animationObjects.fusionCore = fusionCoreMesh;
  }

  function update(delta) {
    if (!delta) delta = 0.016;

    var time = Date.now() * 0.001;

    // Accelerator beam pulse animation
    if (animationObjects.acceleratorBeam) {
      animationObjects.acceleratorBeam.material.linewidth = 1 + Math.sin(time * 3) * 0.5;
    }

    // Dimensional rift throbs
    if (animationObjects.rift) {
      animationObjects.rift.material.emissiveIntensity = 0.5 + Math.sin(time * 2) * 0.3;
      animationObjects.rift.scale.set(
        1 + Math.sin(time * 1.5) * 0.1,
        1 + Math.sin(time * 1.5) * 0.1,
        1 + Math.sin(time * 1.5) * 0.1
      );
    }

    // Quantum bits blink
    for (var q = 0; q < 4; q++) {
      if (animationObjects['qubit' + q]) {
        var blinkVal = Math.sin(time * 8 + q) > 0 ? 0.8 : 0.2;
        animationObjects['qubit' + q].material.emissiveIntensity = blinkVal;
      }
    }

    // Gravity well distorts
    if (animationObjects.gravityWell) {
      var gwScale = 1 + Math.sin(time * 2) * 0.15;
      animationObjects.gravityWell.scale.set(gwScale, gwScale, gwScale);
    }

    // Laser emitters sweep
    for (var l = 0; l < 3; l++) {
      if (animationObjects['laserEmitter' + l]) {
        animationObjects['laserEmitter' + l].rotation.y = Math.sin(time * 2 + l) * 0.5;
      }
    }

    // Beam emitter pulsing
    for (var pb = 0; pb < 2; pb++) {
      if (animationObjects['beamEmitter' + pb]) {
        var pulseIntensity = 0.3 + Math.sin(time * 4 + pb) * 0.4;
        animationObjects['beamEmitter' + pb].material.emissiveIntensity = pulseIntensity;
      }
    }

    // Twin qubits entanglement animation
    if (animationObjects.twinQubit1) {
      animationObjects.twinQubit1.material.emissiveIntensity = 0.4 + Math.sin(time * 3) * 0.2;
    }
    if (animationObjects.twinQubit2) {
      animationObjects.twinQubit2.material.emissiveIntensity = 0.4 + Math.cos(time * 3) * 0.2;
    }

    // Shield alarm pulse
    if (animationObjects.shield) {
      var alarmIntensity = Math.sin(time * 5) > 0 ? 1 : 0.3;
      animationObjects.shield.material.color.setHex(alarmIntensity > 0.5 ? 0xFF2200 : 0x334455);
    }

    // Fusion core glows brighter/dimmer
    if (animationObjects.fusionCore) {
      var glowIntensity = 0.5 + Math.sin(time * 1.5) * 0.3;
      animationObjects.fusionCore.material.emissiveIntensity = glowIntensity;
    }
  }

  function reset() {
    for (var i = 0; i < objects.length; i++) {
      if (objects[i].parent) {
        objects[i].parent.remove(objects[i]);
      }
    }
    objects = [];
    animationObjects = {};
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
