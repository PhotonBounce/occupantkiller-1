window.CircusTent = (function() {
  'use strict';

  var objects = [];
  var scene = null;
  var camera = null;
  var trapezeAngle = 0;
  var cannonAngle = 0;
  var spotlightAngle = 0;
  var cageShake = 0;
  var popcornFlame = 0;

  function init(initScene, initCamera) {
    scene = initScene;
    camera = initCamera;
    objects = [];

    // 1. Big top tent frame - cylindrical structure with cone roof
    var tentFrameGeometry = new THREE.CylinderGeometry(30, 30, 25, 16);
    var tentFrameMaterial = new THREE.MeshBasicMaterial({
      color: 0xFF6B35,
      wireframe: false
    });
    var tentFrame = new THREE.Mesh(tentFrameGeometry, tentFrameMaterial);
    tentFrame.position.set(0, 12.5, 0);
    scene.add(tentFrame);
    objects.push(tentFrame);

    // 2. Tent roof cone
    var roofGeometry = new THREE.ConeGeometry(32, 15, 16);
    var roofMaterial = new THREE.MeshBasicMaterial({
      color: 0xFF1744,
      wireframe: false
    });
    var roof = new THREE.Mesh(roofGeometry, roofMaterial);
    roof.position.set(0, 32.5, 0);
    scene.add(roof);
    objects.push(roof);

    // 3. Tightrope wire - using LineSegments
    var wireGeometry = new THREE.BufferGeometry();
    var wirePositions = new Float32Array([
      -25, 20, -15,
      25, 20, -15,
      -25, 20, 15,
      25, 20, 15
    ]);
    wireGeometry.setAttribute('position', new THREE.BufferAttribute(wirePositions, 3));
    var wireMaterial = new THREE.LineBasicMaterial({ color: 0xFFFFFF, linewidth: 2 });
    var wire = new THREE.LineSegments(wireGeometry, wireMaterial);
    scene.add(wire);
    objects.push(wire);

    // 4. Trapeze platform
    var trapezePlatformGeometry = new THREE.BoxGeometry(8, 1, 4);
    var trapezePlatformMaterial = new THREE.MeshBasicMaterial({
      color: 0x8B4513,
      wireframe: false
    });
    var trapezePlatform = new THREE.Mesh(trapezePlatformGeometry, trapezePlatformMaterial);
    trapezePlatform.position.set(-20, 28, 0);
    scene.add(trapezePlatform);
    objects.push(trapezePlatform);

    // 5. Trapeze bar - cylinder
    var trapezeBarGeometry = new THREE.CylinderGeometry(0.3, 0.3, 6, 8);
    var trapezeBarMaterial = new THREE.MeshBasicMaterial({
      color: 0xFFD700,
      wireframe: false
    });
    var trapezeBar = new THREE.Mesh(trapezeBarGeometry, trapezeBarMaterial);
    trapezeBar.rotation.z = Math.PI / 2;
    trapezeBar.position.set(-20, 22, 0);
    trapezeBar.name = 'trapezeBar';
    scene.add(trapezeBar);
    objects.push(trapezeBar);

    // 6. Lion tamer cage - box
    var cageGeometry = new THREE.BoxGeometry(6, 8, 6);
    var cageMaterial = new THREE.MeshBasicMaterial({
      color: 0x444444,
      wireframe: true
    });
    var cage = new THREE.Mesh(cageGeometry, cageMaterial);
    cage.position.set(15, 4, 0);
    cage.name = 'lionCage';
    scene.add(cage);
    objects.push(cage);

    // 7. Cannon barrel - cylinder
    var cannonBarrelGeometry = new THREE.CylinderGeometry(1, 1, 8, 8);
    var cannonBarrelMaterial = new THREE.MeshBasicMaterial({
      color: 0x2C2C2C,
      wireframe: false
    });
    var cannonBarrel = new THREE.Mesh(cannonBarrelGeometry, cannonBarrelMaterial);
    cannonBarrel.rotation.z = Math.PI / 4;
    cannonBarrel.position.set(-15, 8, 15);
    cannonBarrel.name = 'cannonBarrel';
    scene.add(cannonBarrel);
    objects.push(cannonBarrel);

    // 8. Cannon base - sphere
    var cannonBaseGeometry = new THREE.SphereGeometry(2, 8, 8);
    var cannonBaseMaterial = new THREE.MeshBasicMaterial({
      color: 0x3D3D3D,
      wireframe: false
    });
    var cannonBase = new THREE.Mesh(cannonBaseGeometry, cannonBaseMaterial);
    cannonBase.position.set(-15, 6, 15);
    scene.add(cannonBase);
    objects.push(cannonBase);

    // 9. Funhouse mirror maze - corridor structure with boxes
    var mazeWall1Geometry = new THREE.BoxGeometry(2, 10, 20);
    var mazeWallMaterial = new THREE.MeshBasicMaterial({
      color: 0x9932CC,
      wireframe: false
    });
    var mazeWall1 = new THREE.Mesh(mazeWall1Geometry, mazeWallMaterial);
    mazeWall1.position.set(-30, 5, 0);
    scene.add(mazeWall1);
    objects.push(mazeWall1);

    // 10. Maze wall 2
    var mazeWall2 = new THREE.Mesh(mazeWall1Geometry, mazeWallMaterial);
    mazeWall2.position.set(30, 5, 0);
    scene.add(mazeWall2);
    objects.push(mazeWall2);

    // 11. Maze corridor section
    var mazeFloorGeometry = new THREE.BoxGeometry(12, 0.5, 20);
    var mazeFloorMaterial = new THREE.MeshBasicMaterial({
      color: 0x663399,
      wireframe: false
    });
    var mazeFloor = new THREE.Mesh(mazeFloorGeometry, mazeFloorMaterial);
    mazeFloor.position.set(0, 0.25, 0);
    scene.add(mazeFloor);
    objects.push(mazeFloor);

    // 12. Ticket booth barricade - box tower
    var boothGeometry = new THREE.BoxGeometry(4, 6, 4);
    var boothMaterial = new THREE.MeshBasicMaterial({
      color: 0xDC143C,
      wireframe: false
    });
    var booth = new THREE.Mesh(boothGeometry, boothMaterial);
    booth.position.set(0, 3, -25);
    scene.add(booth);
    objects.push(booth);

    // 13. Bleacher seating with sandbag - stacked boxes
    var bleacherGeometry = new THREE.BoxGeometry(15, 2, 10);
    var bleacherMaterial = new THREE.MeshBasicMaterial({
      color: 0xB8860B,
      wireframe: false
    });
    var bleacher1 = new THREE.Mesh(bleacherGeometry, bleacherMaterial);
    bleacher1.position.set(-20, 1, -20);
    scene.add(bleacher1);
    objects.push(bleacher1);

    var bleacher2 = new THREE.Mesh(bleacherGeometry, bleacherMaterial);
    bleacher2.position.set(-20, 4, -20);
    scene.add(bleacher2);
    objects.push(bleacher2);

    // 14. Sandbag - sphere
    var sandbagGeometry = new THREE.SphereGeometry(1.5, 8, 8);
    var sandbagMaterial = new THREE.MeshBasicMaterial({
      color: 0x8B7355,
      wireframe: false
    });
    var sandbag = new THREE.Mesh(sandbagGeometry, sandbagMaterial);
    sandbag.position.set(-20, 6, -20);
    scene.add(sandbag);
    objects.push(sandbag);

    // 15. Popcorn machine - cylinder with cone top
    var popcornMachineGeometry = new THREE.CylinderGeometry(2, 2, 5, 8);
    var popcornMachineMaterial = new THREE.MeshBasicMaterial({
      color: 0xFF4500,
      wireframe: false
    });
    var popcornMachine = new THREE.Mesh(popcornMachineGeometry, popcornMachineMaterial);
    popcornMachine.position.set(20, 2.5, -15);
    scene.add(popcornMachine);
    objects.push(popcornMachine);

    // 16. Popcorn machine top cone
    var popcornTopGeometry = new THREE.ConeGeometry(2.5, 3, 8);
    var popcornTopMaterial = new THREE.MeshBasicMaterial({
      color: 0xFF6347,
      wireframe: false
    });
    var popcornTop = new THREE.Mesh(popcornTopGeometry, popcornTopMaterial);
    popcornTop.position.set(20, 6.5, -15);
    popcornTop.name = 'popcornFlame';
    scene.add(popcornTop);
    objects.push(popcornTop);

    // 17. Juggler prop pole - cylinder
    var jugglePoleGeometry = new THREE.CylinderGeometry(0.5, 0.5, 12, 8);
    var jugglePoleMaterial = new THREE.MeshBasicMaterial({
      color: 0xFFB6C1,
      wireframe: false
    });
    var jugglePole = new THREE.Mesh(jugglePoleGeometry, jugglePoleMaterial);
    jugglePole.position.set(20, 6, 15);
    scene.add(jugglePole);
    objects.push(jugglePole);

    // 18. Juggler prop weapons - spheres
    var juggleProp1Geometry = new THREE.SphereGeometry(0.8, 6, 6);
    var jugglerPropMaterial = new THREE.MeshBasicMaterial({
      color: 0xFF0000,
      wireframe: false
    });
    var jugglerProp1 = new THREE.Mesh(juggleProp1Geometry, jugglerPropMaterial);
    jugglerProp1.position.set(18, 10, 15);
    jugglerProp1.name = 'jugglerProp1';
    scene.add(jugglerProp1);
    objects.push(jugglerProp1);

    var jugglerProp2 = new THREE.Mesh(juggleProp1Geometry, jugglerPropMaterial);
    jugglerProp2.position.set(20, 12, 15);
    jugglerProp2.name = 'jugglerProp2';
    scene.add(jugglerProp2);
    objects.push(jugglerProp2);

    var jugglerProp3 = new THREE.Mesh(juggleProp1Geometry, jugglerPropMaterial);
    jugglerProp3.position.set(22, 10, 15);
    jugglerProp3.name = 'jugglerProp3';
    scene.add(jugglerProp3);
    objects.push(jugglerProp3);
  }

  function update(delta) {
    // Trapeze swinging animation
    trapezeAngle += delta * 0.5;
    var trapezeBar = scene.getObjectByName('trapezeBar');
    if (trapezeBar) {
      trapezeBar.rotation.x = Math.sin(trapezeAngle) * 0.3;
    }

    // Cannon rotation
    cannonAngle += delta * 0.3;
    var cannonBarrel = scene.getObjectByName('cannonBarrel');
    if (cannonBarrel) {
      cannonBarrel.rotation.y = Math.sin(cannonAngle) * 0.4;
    }

    // Spotlight sweep animation
    spotlightAngle += delta * 0.8;

    // Lion cage rattle
    cageShake += delta;
    var lionCage = scene.getObjectByName('lionCage');
    if (lionCage) {
      lionCage.position.x = 15 + Math.sin(cageShake * 3) * 0.2;
    }

    // Popcorn machine fire hazard flicker
    popcornFlame += delta * 2;
    var popcornTop = scene.getObjectByName('popcornFlame');
    if (popcornTop) {
      popcornTop.scale.y = 1 + Math.sin(popcornFlame) * 0.3;
    }

    // Juggler props rotation
    var prop1 = scene.getObjectByName('jugglerProp1');
    var prop2 = scene.getObjectByName('jugglerProp2');
    var prop3 = scene.getObjectByName('jugglerProp3');

    if (prop1) {
      prop1.rotation.x += delta * 2;
      prop1.position.y = 10 + Math.sin(cageShake) * 2;
    }
    if (prop2) {
      prop2.rotation.y += delta * 2.5;
      prop2.position.y = 12 + Math.cos(cageShake) * 2;
    }
    if (prop3) {
      prop3.rotation.z += delta * 2;
      prop3.position.y = 10 + Math.sin(cageShake + 1) * 2;
    }
  }

  function reset() {
    if (scene) {
      var i = objects.length - 1;
      while (i >= 0) {
        scene.remove(objects[i]);
        i--;
      }
    }
    objects = [];
    trapezeAngle = 0;
    cannonAngle = 0;
    spotlightAngle = 0;
    cageShake = 0;
    popcornFlame = 0;
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
