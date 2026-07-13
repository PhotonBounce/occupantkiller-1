window.HadriansWall = (function() {
  'use strict';

  var WX = 2590;
  var WZ = 2200;

  function makeMaterial(color) {
    return new THREE.MeshLambertMaterial({ color: color });
  }

  function makeBox(w, h, d, color, x, y, z, group) {
    var geo = new THREE.BoxGeometry(w, h, d);
    var mat = makeMaterial(color);
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, z);
    group.add(mesh);
    return mesh;
  }

  function buildWallSection(group) {
    // Main wall body: 80x5x2 running east-west
    makeBox(80, 5, 2, 0x9A9A8A, WX, 2.5, WZ);

    // Merlons (crenellations) on top of wall, every 2 units along x
    var merlonCount = 20;
    var startX = WX - 38;
    var i;
    for (i = 0; i < merlonCount; i++) {
      makeBox(1, 1.5, 2, 0x9A9A8A, startX + i * 4, 6.25, WZ);
    }
  }

  function buildDitchAndVallum(group) {
    // North ditch (Fossa): dark trench box north of wall
    makeBox(80, 1, 3, 0x3A3A3A, WX, 0.5, WZ - 5);
    // South vallum ditch: parallel earthwork south of wall
    makeBox(80, 1, 3, 0x3A3A3A, WX, 0.5, WZ + 8);
    // Vallum north mound
    makeBox(80, 1.5, 2, 0x5A5A4A, WX, 0.75, WZ + 6);
    // Vallum south mound
    makeBox(80, 1.5, 2, 0x5A5A4A, WX, 0.75, WZ + 10);
  }

  function buildHousesteadsFort(group) {
    var fx = WX - 30;
    var fz = WZ + 20;

    // Fort floor
    makeBox(20, 1, 15, 0x9A8A78, fx, 0.5, fz);

    // Four perimeter walls: north, south, east, west
    makeBox(20, 5, 2, 0x9A8A78, fx, 3, fz - 6.5);
    makeBox(20, 5, 2, 0x9A8A78, fx, 3, fz + 6.5);
    makeBox(2, 5, 15, 0x9A8A78, fx - 9, 3, fz);
    makeBox(2, 5, 15, 0x9A8A78, fx + 9, 3, fz);

    // Gate towers at each of 4 sides (5x8x4)
    // North gate tower
    makeBox(5, 8, 4, 0x8A7A68, fx, 4, fz - 8.5);
    // South gate tower
    makeBox(5, 8, 4, 0x8A7A68, fx, 4, fz + 8.5);
    // East gate tower
    makeBox(4, 8, 5, 0x8A7A68, fx + 11, 4, fz);
    // West gate tower
    makeBox(4, 8, 5, 0x8A7A68, fx - 11, 4, fz);

    // Internal barracks buildings
    makeBox(6, 3, 4, 0x8A7A68, fx - 4, 2, fz - 2);
    makeBox(6, 3, 4, 0x8A7A68, fx + 4, 2, fz - 2);
    makeBox(6, 3, 4, 0x8A7A68, fx - 4, 2, fz + 2);
    makeBox(6, 3, 4, 0x8A7A68, fx + 4, 2, fz + 2);

    // Headquarters (principia) in centre
    makeBox(5, 4, 5, 0x7A6A58, fx, 2.5, fz);
  }

  function buildSycamoreGap(group) {
    var tx = WX + 15;
    var tz = WZ;
    var ty = 0;

    // Wall dip — lower wall segment at Sycamore Gap
    makeBox(10, 3, 2, 0x9A9A8A, tx, 1.5, tz);

    // Trunk
    var trunkGeo = new THREE.CylinderGeometry(0.3, 0.5, 5, 8);
    var trunkMat = makeMaterial(0x5A3A1A);
    var trunk = new THREE.Mesh(trunkGeo, trunkMat);
    trunk.position.set(tx, ty + 2.5, tz);
    group.add(trunk);

    // Canopy
    var canopyGeo = new THREE.SphereGeometry(3, 8, 6);
    var canopyMat = makeMaterial(0x3A7A2A);
    var canopy = new THREE.Mesh(canopyGeo, canopyMat);
    canopy.position.set(tx, ty + 7, tz);
    group.add(canopy);

    // Secondary branch clusters
    var canopyGeo2 = new THREE.SphereGeometry(2, 8, 6);
    var canopyMat2 = makeMaterial(0x2A6A1A);
    var canopy2 = new THREE.Mesh(canopyGeo2, canopyMat2);
    canopy2.position.set(tx + 1.5, ty + 6, tz);
    group.add(canopy2);

    var canopyGeo3 = new THREE.SphereGeometry(2, 8, 6);
    var canopyMat3 = makeMaterial(0x2A6A1A);
    var canopy3 = new THREE.Mesh(canopyGeo3, canopyMat3);
    canopy3.position.set(tx - 1.5, ty + 6, tz);
    group.add(canopy3);
  }

  function buildVindolandaFort(group) {
    var vx = WX + 35;
    var vz = WZ + 25;

    // Excavated floor area
    makeBox(18, 0.5, 14, 0x8A7060, vx, 0.25, vz);

    // Perimeter wall remnants
    makeBox(18, 3, 1.5, 0x8A8070, vx, 1.5, vz - 7);
    makeBox(18, 3, 1.5, 0x8A8070, vx, 1.5, vz + 7);
    makeBox(1.5, 3, 14, 0x8A8070, vx - 8.25, 1.5, vz);
    makeBox(1.5, 3, 14, 0x8A8070, vx + 8.25, 1.5, vz);

    // Latrine building: 6x3x8
    makeBox(6, 3, 8, 0x7A7060, vx + 4, 2, vz - 3);

    // Latrine seat-hole markers (small dark boxes on top of latrine)
    makeBox(0.6, 0.3, 0.4, 0x2A2018, vx + 2, 3.65, vz - 3);
    makeBox(0.6, 0.3, 0.4, 0x2A2018, vx + 3, 3.65, vz - 3);
    makeBox(0.6, 0.3, 0.4, 0x2A2018, vx + 4, 3.65, vz - 3);
    makeBox(0.6, 0.3, 0.4, 0x2A2018, vx + 5, 3.65, vz - 3);
    makeBox(0.6, 0.3, 0.4, 0x2A2018, vx + 6, 3.65, vz - 3);

    // Barracks blocks
    makeBox(5, 2.5, 4, 0x8A7A6A, vx - 3, 1.25, vz + 2);
    makeBox(5, 2.5, 4, 0x8A7A6A, vx + 2, 1.25, vz + 2);

    // Granary (horreum) — raised floor supports visible
    makeBox(6, 2, 4, 0x9A8A7A, vx - 4, 1, vz - 3);
    makeBox(5.5, 0.3, 0.5, 0x5A4A3A, vx - 4, 0.5, vz - 4.5);
    makeBox(5.5, 0.3, 0.5, 0x5A4A3A, vx - 4, 0.5, vz - 3.5);
    makeBox(5.5, 0.3, 0.5, 0x5A4A3A, vx - 4, 0.5, vz - 2.5);
    makeBox(5.5, 0.3, 0.5, 0x5A4A3A, vx - 4, 0.5, vz - 1.5);

    // Commander's house (praetorium)
    makeBox(5, 3.5, 5, 0x7A6A5A, vx, 1.75, vz);
  }

  function buildMilecastle(group) {
    var mx = WX - 20;
    var mz = WZ;

    // Four walls of milecastle: box 8x6x8 walls
    // North wall
    makeBox(8, 6, 1, 0x9A9A8A, mx, 3, mz - 3.5);
    // South wall with gate arch gap — two shorter wall segments
    makeBox(2.5, 6, 1, 0x9A9A8A, mx - 2.75, 3, mz + 3.5);
    makeBox(2.5, 6, 1, 0x9A9A8A, mx + 2.75, 3, mz + 3.5);
    // Gate arch lintel over south gap
    makeBox(3, 1, 1, 0x8A8A7A, mx, 5.5, mz + 3.5);
    // East wall
    makeBox(1, 6, 8, 0x9A9A8A, mx + 3.5, 3, mz);
    // West wall
    makeBox(1, 6, 8, 0x9A9A8A, mx - 3.5, 3, mz);

    // Floor
    makeBox(6, 0.5, 6, 0x8A8070, mx, 0.25, mz);

    // Internal building
    makeBox(3, 3, 3, 0x8A8A7A, mx, 1.75, mz - 1);

    // Corner turrets (small boxes at each corner)
    makeBox(1.5, 7, 1.5, 0x8A8A7A, mx - 3.5, 3.5, mz - 3.5);
    makeBox(1.5, 7, 1.5, 0x8A8A7A, mx + 3.5, 3.5, mz - 3.5);
    makeBox(1.5, 7, 1.5, 0x8A8A7A, mx - 3.5, 3.5, mz + 3.5);
    makeBox(1.5, 7, 1.5, 0x8A8A7A, mx + 3.5, 3.5, mz + 3.5);
  }

  function buildWireframe(group) {
    // Subtle wireframe edge lines on main wall using LineSegments
    var geo = new THREE.BoxGeometry(80, 5, 2);
    var edges = new THREE.EdgesGeometry(geo);
    var mat = new THREE.LineBasicMaterial({ color: 0x7A7A6A, opacity: 0.4, transparent: true });
    var lines = new THREE.LineSegments(edges, mat);
    lines.position.set(WX, 2.5, WZ);
    group.add(lines);
  }

  function build(scene) {
    var group = new THREE.Group();

    buildWallSection(group);
    buildDitchAndVallum(group);
    buildHousesteadsFort(group);
    buildSycamoreGap(group);
    buildVindolandaFort(group);
    buildMilecastle(group);
    buildWireframe(group);

    scene.add(group);
    return group;
  }

  return {
    build: build
  };
}());
