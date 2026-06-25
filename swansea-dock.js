window.SwanseaDock = (function () {
  'use strict';

  var WORLD_X = 3490;
  var WORLD_Z = 2200;

  function makeBox(w, h, d, color, x, y, z, scene) {
    var geo = new THREE.BoxGeometry(w, h, d);
    var mat = new THREE.MeshLambertMaterial({ color: color });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(WORLD_X + x, y, WORLD_Z + z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);
    return mesh;
  }

  function makeCylinder(rt, rb, h, segs, color, x, y, z, scene) {
    var geo = new THREE.CylinderGeometry(rt, rb, h, segs);
    var mat = new THREE.MeshLambertMaterial({ color: color });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(WORLD_X + x, y, WORLD_Z + z);
    mesh.castShadow = true;
    scene.add(mesh);
    return mesh;
  }

  function makeSphere(r, ws, hs, color, x, y, z, scene) {
    var geo = new THREE.SphereGeometry(r, ws, hs);
    var mat = new THREE.MeshLambertMaterial({ color: color });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(WORLD_X + x, y, WORLD_Z + z);
    mesh.castShadow = true;
    scene.add(mesh);
    return mesh;
  }

  function makeCone(r, h, segs, color, x, y, z, scene) {
    var geo = new THREE.ConeGeometry(r, h, segs);
    var mat = new THREE.MeshLambertMaterial({ color: color });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(WORLD_X + x, y, WORLD_Z + z);
    mesh.castShadow = true;
    scene.add(mesh);
    return mesh;
  }

  function makeWireBox(w, h, d, color, x, y, z, scene) {
    var geo = new THREE.BoxGeometry(w, h, d);
    var edges = new THREE.EdgesGeometry(geo);
    var mat = new THREE.LineBasicMaterial({ color: color });
    var lines = new THREE.LineSegments(edges, mat);
    lines.position.set(WORLD_X + x, y, WORLD_Z + z);
    scene.add(lines);
    return lines;
  }

  /* -----------------------------------------------------------------------
     Swansea Castle ruins — 14th-century tower in city centre
  ----------------------------------------------------------------------- */
  function buildCastleRuins(scene) {
    // Main tower body
    makeBox(10, 12, 8, 0x9A8A78, 0, 6, 0, scene);
    // Ruined parapet — shorter box offset atop
    makeBox(10, 2, 3, 0x9A8A78, 0, 13, 2.5, scene);
    makeBox(10, 2, 3, 0x9A8A78, 0, 13, -2.5, scene);
    makeBox(3, 2, 8, 0x9A8A78, 4, 13, 0, scene);
    // Crumbling side wall fragment
    makeBox(2, 6, 8, 0x9A8A78, 7, 3, 0, scene);
    // Arcade fragment — thin box arches
    makeBox(1, 5, 12, 0x8A7A68, -6, 2.5, 0, scene);
    makeBox(12, 1, 1, 0x8A7A68, -1, 5, 3, scene);
    makeBox(12, 1, 1, 0x8A7A68, -1, 5, -3, scene);
    // Corner turret stump
    makeCylinder(1.5, 1.8, 6, 8, 0x9A8A78, 5, 3, 4, scene);
    makeCylinder(1.5, 1.8, 6, 8, 0x9A8A78, -5, 3, -4, scene);
  }

  /* -----------------------------------------------------------------------
     Dylan Thomas birthplace — 5 Cwmdonkin Drive terraced house
  ----------------------------------------------------------------------- */
  function buildDylanBirthplace(scene) {
    var bx = 60;
    var bz = -40;
    // Main terraced house body
    makeBox(6, 5, 5, 0xF0F0F0, bx, 2.5, bz, scene);
    // Roof (low-pitched hip — use a flattened box)
    makeBox(7, 1.5, 6, 0x884444, bx, 6.25, bz, scene);
    // Blue heritage plaque box on facade
    makeBox(0.6, 0.6, 0.1, 0x1A4A9A, bx - 3, 3, bz - 2.55, scene);
    // Chimney stack
    makeBox(0.8, 3, 0.8, 0xCC8866, bx + 1, 8, bz, scene);
    makeBox(1, 0.4, 1, 0x9A6644, bx + 1, 9.7, bz, scene);
    // Front garden wall
    makeBox(7, 0.8, 0.3, 0xDDDDDD, bx, 0.4, bz - 3.5, scene);
    // Neighbour terraces (repeating units)
    makeBox(6, 5, 5, 0xF0E8E0, bx + 7, 2.5, bz, scene);
    makeBox(7, 1.5, 6, 0x7A3A3A, bx + 7, 6.25, bz, scene);
    makeBox(6, 5, 5, 0xF0E8E0, bx - 7, 2.5, bz, scene);
    makeBox(7, 1.5, 6, 0x7A3A3A, bx - 7, 6.25, bz, scene);
  }

  /* -----------------------------------------------------------------------
     SA1 Marina — converted dock basin with modern apartment towers
  ----------------------------------------------------------------------- */
  function buildSA1Marina(scene) {
    var mx = -80;
    var mz = 60;
    // Dock water surface (shallow box, blue)
    makeBox(80, 0.5, 40, 0x1A6B8A, mx, 0.25, mz, scene);
    // Dock walls
    makeBox(80, 2, 2, 0x666666, mx, 1, mz - 21, scene);
    makeBox(80, 2, 2, 0x666666, mx, 1, mz + 21, scene);
    makeBox(2, 2, 40, 0x666666, mx - 41, 1, mz, scene);
    makeBox(2, 2, 40, 0x666666, mx + 41, 1, mz, scene);
    // Modern apartment towers
    makeBox(6, 20, 6, 0x888888, mx - 30, 10, mz + 32, scene);
    makeBox(6, 20, 6, 0x888888, mx - 20, 10, mz + 32, scene);
    makeBox(6, 20, 6, 0x888888, mx - 10, 10, mz + 32, scene);
    makeBox(6, 24, 6, 0x999999, mx, 12, mz + 32, scene);
    makeBox(6, 20, 6, 0x888888, mx + 10, 10, mz + 32, scene);
    makeBox(6, 20, 6, 0x888888, mx + 20, 10, mz + 32, scene);
    makeBox(6, 18, 6, 0x888888, mx + 30, 9, mz + 32, scene);
    // Tower window grids (wireframe accent)
    makeWireBox(6, 20, 6, 0xBBCCDD, mx - 30, 10, mz + 32, scene);
    makeWireBox(6, 24, 6, 0xBBCCDD, mx, 12, mz + 32, scene);
    // Floating pontoon walkway
    makeBox(60, 0.4, 3, 0xAA9977, mx, 0.7, mz - 10, scene);
    // Converted heritage warehouse
    makeBox(20, 6, 10, 0x8B5A2B, mx + 30, 3, mz - 12, scene);
    makeBox(20, 1, 10, 0x5A3A1A, mx + 30, 6.5, mz - 12, scene);
  }

  /* -----------------------------------------------------------------------
     Copper Works ruins — Lower Swansea Valley Victorian smelting complex
  ----------------------------------------------------------------------- */
  function buildCopperWorks(scene) {
    var cx = 100;
    var cz = 80;
    // Main smelting hall ruin
    makeBox(30, 8, 15, 0x6A5A4A, cx, 4, cz, scene);
    // Tall chimney stacks (industrial)
    makeCylinder(1.2, 1.8, 22, 10, 0x5A4A3A, cx - 12, 11, cz - 5, scene);
    makeCylinder(1.2, 1.8, 18, 10, 0x5A4A3A, cx + 10, 9, cz - 5, scene);
    makeCylinder(1.0, 1.4, 26, 10, 0x5A4A3A, cx + 2, 13, cz + 4, scene);
    // Chimney caps
    makeCylinder(1.5, 1.2, 1, 8, 0x3A2A2A, cx - 12, 22.5, cz - 5, scene);
    makeCylinder(1.5, 1.2, 1, 8, 0x3A2A2A, cx + 10, 18.5, cz - 5, scene);
    makeCylinder(1.5, 1.2, 1, 8, 0x3A2A2A, cx + 2, 26.5, cz + 4, scene);
    // Secondary furnace building
    makeBox(15, 6, 10, 0x7A6A5A, cx + 25, 3, cz + 5, scene);
    // Ruined wall stubs
    makeBox(2, 5, 15, 0x6A5A4A, cx - 16, 2.5, cz, scene);
    makeBox(30, 1, 2, 0x6A5A4A, cx, 8, cz - 8, scene);
    // Ore heap mounds (spheres)
    makeSphere(3, 8, 6, 0x7A6A50, cx - 8, 0.5, cz + 10, scene);
    makeSphere(2, 8, 6, 0x7A6A50, cx + 5, 0.5, cz + 12, scene);
    // Slag waste field (low flat boxes)
    makeBox(20, 0.5, 10, 0x4A4A44, cx - 5, 0.25, cz + 16, scene);
  }

  /* -----------------------------------------------------------------------
     Gower Peninsula — cliffs, Three Cliffs Bay, Oxwich Bay beach
  ----------------------------------------------------------------------- */
  function buildGower(scene) {
    var gx = -150;
    var gz = -120;
    // Limestone cliff faces
    makeBox(40, 18, 8, 0x9A8A78, gx, 9, gz, scene);
    makeBox(30, 14, 8, 0x9A8A78, gx + 50, 7, gz + 5, scene);
    makeBox(25, 20, 8, 0x8A7A68, gx - 40, 10, gz - 5, scene);
    // Three Cliffs Bay — three distinctive cliff spires
    makeBox(5, 22, 5, 0x9A8A78, gx - 5, 11, gz + 15, scene);
    makeBox(5, 18, 5, 0x9A8A78, gx + 5, 9, gz + 18, scene);
    makeBox(5, 25, 5, 0x9A8A78, gx - 15, 12.5, gz + 12, scene);
    // Natural arch bridge at Three Cliffs (thin box bridge)
    makeBox(10, 2, 3, 0x9A8A78, gx - 5, 22, gz + 15, scene);
    // Beach sand — Oxwich Bay
    makeBox(60, 0.5, 20, 0xD4B483, gx + 10, 0.25, gz + 35, scene);
    // Sand dunes
    makeBox(8, 2, 8, 0xC4A473, gx - 5, 1, gz + 40, scene);
    makeBox(6, 1.5, 6, 0xC4A473, gx + 15, 0.75, gz + 42, scene);
    makeBox(10, 2.5, 10, 0xC4A473, gx + 30, 1.25, gz + 38, scene);
    // Headland cliff continuation
    makeBox(20, 12, 6, 0x9A8A78, gx + 60, 6, gz + 10, scene);
    makeBox(15, 8, 6, 0x8A7A68, gx + 70, 4, gz + 25, scene);
    // Gower cottage (whitewashed)
    makeBox(5, 3, 4, 0xF5F5F0, gx + 20, 1.5, gz + 20, scene);
    makeBox(6, 1, 5, 0x884444, gx + 20, 3.5, gz + 20, scene);
  }

  /* -----------------------------------------------------------------------
     Swansea Bay beach — long curved sandy beach with pier
  ----------------------------------------------------------------------- */
  function buildSwanseaBay(scene) {
    var bx = -40;
    var bz = 160;
    // Main beach strip
    makeBox(80, 1, 20, 0xD4B483, bx, 0.5, bz, scene);
    // Wet sand near water (darker)
    makeBox(80, 0.3, 5, 0xBDA070, bx, 0.15, bz + 12, scene);
    // Promenade / sea wall behind beach
    makeBox(90, 1.5, 3, 0xCCCCCC, bx, 0.75, bz - 13, scene);
    // Pier structure extending into sea
    makeBox(3, 1, 40, 0x886644, bx + 20, 1, bz + 30, scene);
    // Pier deck
    makeBox(3.5, 0.3, 40, 0xAA8855, bx + 20, 1.7, bz + 30, scene);
    // Pier support pillars
    makeCylinder(0.3, 0.3, 3, 6, 0x665533, bx + 20, 0.5, bz + 15, scene);
    makeCylinder(0.3, 0.3, 3, 6, 0x665533, bx + 20, 0.5, bz + 25, scene);
    makeCylinder(0.3, 0.3, 3, 6, 0x665533, bx + 20, 0.5, bz + 35, scene);
    makeCylinder(0.3, 0.3, 3, 6, 0x665533, bx + 20, 0.5, bz + 45, scene);
    // Pier pavilion at end
    makeBox(5, 3, 5, 0xBB9966, bx + 20, 2, bz + 50, scene);
    makeCone(3.5, 2, 8, 0x884422, bx + 20, 4.5, bz + 50, scene);
    // Lifeguard hut
    makeBox(3, 2, 3, 0xFF4400, bx - 10, 1, bz - 8, scene);
    makeCone(2, 1.5, 6, 0xCC3300, bx - 10, 2.75, bz - 8, scene);
    // Beach windbreak fence
    makeBox(20, 1, 0.2, 0xAA9966, bx, 0.5, bz - 5, scene);
    // Sea water beyond pier
    makeBox(90, 0.4, 30, 0x1A6B8A, bx, 0.2, bz + 28, scene);
  }

  /* -----------------------------------------------------------------------
     Public API
  ----------------------------------------------------------------------- */
  function build(scene) {
    buildCastleRuins(scene);
    buildDylanBirthplace(scene);
    buildSA1Marina(scene);
    buildCopperWorks(scene);
    buildGower(scene);
    buildSwanseaBay(scene);
  }

  return {
    build: build,
    WORLD_X: WORLD_X,
    WORLD_Z: WORLD_Z
  };
}());
