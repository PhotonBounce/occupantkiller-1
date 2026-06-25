window.DoverCliffs = (function() {
    'use strict';

    var OFFSET_X = 4280;
    var OFFSET_Z = 2200;
    var objects = [];
    var scene = null;

    function makebox(w, h, d, color, x, y, z) {
        var geo = new THREE.BoxGeometry(w, h, d);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(OFFSET_X + x, y, OFFSET_Z + z);
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function makecylinder(rt, rb, h, segs, color, x, y, z) {
        var geo = new THREE.CylinderGeometry(rt, rb, h, segs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(OFFSET_X + x, y, OFFSET_Z + z);
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function makecone(r, h, segs, color, x, y, z) {
        var geo = new THREE.ConeGeometry(r, h, segs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(OFFSET_X + x, y, OFFSET_Z + z);
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function buildcliffs() {
        // Main White Cliffs face — long chalk wall
        makebox(80, 28, 8, 0xFFFFFF, 0, 14, 0);
        // Grass strip on top of cliffs
        makebox(80, 2, 8, 0x228B22, 0, 29, 0);

        // Extended cliff sections eastward
        makebox(40, 28, 8, 0xFFFFFF, 60, 14, 4);
        makebox(40, 2, 8, 0x228B22, 60, 29, 4);

        makebox(30, 24, 8, 0xFFFFFF, 100, 12, 8);
        makebox(30, 2, 8, 0x228B22, 100, 26, 8);
    }

    function buildshakespearecliff() {
        // Shakespeare Cliff — western dramatic headland
        makebox(24, 32, 12, 0xFFFFFF, -70, 16, -5);
        makebox(24, 2, 12, 0x228B22, -70, 33, -5);
        // Railway tunnel entrance at base of Shakespeare Cliff
        makebox(6, 6, 3, 0x111111, -64, 3, -5);
        makebox(6, 1, 3, 0x444444, -64, 7, -5);
        // Tunnel side walls
        makebox(1, 6, 3, 0x888888, -61, 3, -5);
        makebox(1, 6, 3, 0x888888, -67, 3, -5);
    }

    function buildhellfiretunnels() {
        // WWII Hellfire Corner tunnel entrances in cliff face
        makebox(3, 4, 2, 0x111111, -10, 2, -1);
        makebox(3, 4, 2, 0x111111, -2, 2, -1);
        makebox(3, 4, 2, 0x111111, 6, 2, -1);
        makebox(3, 4, 2, 0x111111, 14, 2, -1);
        // Frame surrounds for tunnel entrances
        makebox(3, 1, 2, 0x555555, -10, 5, -1);
        makebox(3, 1, 2, 0x555555, -2, 5, -1);
        makebox(3, 1, 2, 0x555555, 6, 5, -1);
        makebox(3, 1, 2, 0x555555, 14, 5, -1);
    }

    function buildcastle() {
        // Dover Castle — on top of cliffs
        // Curtain walls perimeter — four sides
        makebox(60, 8, 3, 0x808080, 5, 34, -30);   // north wall
        makebox(60, 8, 3, 0x808080, 5, 34, -80);   // south wall
        makebox(3, 8, 50, 0x808080, -25, 34, -55); // west wall
        makebox(3, 8, 50, 0x808080, 35, 34, -55);  // east wall

        // Corner towers on curtain walls
        makebox(5, 12, 5, 0x707070, -25, 38, -30);
        makebox(5, 12, 5, 0x707070, 35, 38, -30);
        makebox(5, 12, 5, 0x707070, -25, 38, -80);
        makebox(5, 12, 5, 0x707070, 35, 38, -80);

        // Great Tower / Keep
        makebox(12, 16, 12, 0x808080, 5, 42, -55);

        // Roman Pharos lighthouse tower inside walls
        makebox(4, 12, 4, 0x999999, -10, 38, -45);

        // Gatehouse
        makebox(10, 10, 6, 0x757575, 5, 37, -32);
        // Gatehouse arch opening
        makebox(4, 6, 6, 0x333333, 5, 34, -32);
    }

    function buildferryport() {
        // Dover Ferry Port — east of cliffs in harbour area
        // Terminal buildings
        makebox(30, 8, 15, 0xBBBBBB, 160, 4, 40);
        makebox(20, 6, 10, 0xCCCCCC, 140, 3, 20);
        makebox(25, 10, 12, 0xAAAAAA, 170, 5, 60);

        // Ferry ship 1 — white hull
        makebox(40, 8, 12, 0xFFFFFF, 180, 4, 30);
        // Blue stripe on ferry 1
        makebox(40, 2, 12, 0x0000CD, 180, 7, 30);
        // Ferry 1 superstructure
        makebox(20, 6, 10, 0xEEEEEE, 178, 11, 30);
        // Ferry 1 funnel
        makebox(3, 5, 3, 0xDD0000, 185, 16, 30);

        // Ferry ship 2
        makebox(40, 8, 12, 0xFFFFFF, 180, 4, 70);
        makebox(40, 2, 12, 0x0000CD, 180, 7, 70);
        makebox(20, 6, 10, 0xEEEEEE, 178, 11, 70);
        makebox(3, 5, 3, 0xDD0000, 185, 16, 70);

        // Ferry ship 3 — departing
        makebox(40, 8, 12, 0xFFFFFF, 220, 4, 50);
        makebox(40, 2, 12, 0x1E90FF, 220, 7, 50);
        makebox(20, 6, 10, 0xEEEEEE, 218, 11, 50);

        // Harbour crane structures
        makebox(2, 20, 2, 0xFF6600, 155, 10, 45);
        makebox(14, 2, 2, 0xFF6600, 162, 21, 45);
        makebox(2, 20, 2, 0xFF6600, 155, 10, 55);
        makebox(14, 2, 2, 0xFF6600, 162, 21, 55);
    }

    function buildpier() {
        // Prince of Wales Pier — long pier enclosing Eastern Docks
        // Main pier arm going east
        makebox(50, 3, 4, 0x888888, 120, 1, 10);
        // Pier head
        makebox(8, 3, 20, 0x888888, 146, 1, 15);
        // Pier railings
        makebox(50, 1, 1, 0x666666, 120, 3, 8);
        makebox(50, 1, 1, 0x666666, 120, 3, 12);
        // Pier bollards
        makebox(1, 2, 1, 0x444444, 100, 3, 10);
        makebox(1, 2, 1, 0x444444, 110, 3, 10);
        makebox(1, 2, 1, 0x444444, 120, 3, 10);
        makebox(1, 2, 1, 0x444444, 130, 3, 10);
        makebox(1, 2, 1, 0x444444, 140, 3, 10);
    }

    function buildfanbayshelter() {
        // Fan Bay Deep Shelter — WWII lookout pillboxes along clifftop
        // Pillbox 1
        makebox(5, 3, 5, 0x556655, 30, 31, -15);
        makebox(5, 1, 5, 0x445544, 30, 34, -15);
        makebox(1, 1, 5, 0x333333, 28, 32, -15); // firing slit

        // Pillbox 2
        makebox(5, 3, 5, 0x556655, 50, 31, -18);
        makebox(5, 1, 5, 0x445544, 50, 34, -18);
        makebox(1, 1, 5, 0x333333, 48, 32, -18);

        // Pillbox 3
        makebox(5, 3, 5, 0x556655, 70, 31, -20);
        makebox(5, 1, 5, 0x445544, 70, 34, -20);
        makebox(1, 1, 5, 0x333333, 68, 32, -20);

        // Observation post / shelter entrance
        makebox(8, 4, 6, 0x4A5E4A, 40, 31, -12);
        makebox(3, 3, 2, 0x111111, 40, 30, -10);
    }

    function buildsouthforelandlighthouse() {
        // South Foreland Lighthouse — first electric lighthouse
        // White tower
        makebox(4, 16, 4, 0xFFFFFF, 90, 8, -40);
        // Lantern room
        makebox(5, 3, 5, 0xDDDDDD, 90, 17, -40);
        // Black cone top
        makecone(3, 4, 8, 0x111111, 90, 21, -40);
        // Keeper's cottage
        makebox(10, 5, 8, 0xFFFFFF, 96, 2, -40);
        makebox(10, 2, 8, 0xCC4444, 96, 6, -40); // red roof
        // Boundary wall
        makebox(20, 2, 1, 0xCCCCCC, 90, 1, -35);
        makebox(20, 2, 1, 0xCCCCCC, 90, 1, -46);
        makebox(1, 2, 12, 0xCCCCCC, 80, 1, -41);
        makebox(1, 2, 12, 0xCCCCCC, 100, 1, -41);
    }

    function builddealcastle() {
        // Deal Castle — Henry VIII artillery fort
        // Circular plan using CylinderGeometry (radius 10, height 5)
        makecylinder(10, 10, 5, 16, 0x808080, -120, 2, -60);
        // Inner keep cylinder
        makecylinder(5, 5, 7, 12, 0x707070, -120, 3, -60);
        // 6 semicircular bastions around perimeter
        makecylinder(4, 4, 4, 8, 0x787878, -120, 2, -49);  // north
        makecylinder(4, 4, 4, 8, 0x787878, -120, 2, -71);  // south
        makecylinder(4, 4, 4, 8, 0x787878, -129, 2, -55);  // northwest
        makecylinder(4, 4, 4, 8, 0x787878, -111, 2, -55);  // northeast
        makecylinder(4, 4, 4, 8, 0x787878, -129, 2, -65);  // southwest
        makecylinder(4, 4, 4, 8, 0x787878, -111, 2, -65);  // southeast
        // Moat / ditch outline boxes
        makebox(28, 1, 2, 0x556644, -120, 0, -47);
        makebox(28, 1, 2, 0x556644, -120, 0, -73);
        makebox(2, 1, 28, 0x556644, -133, 0, -60);
        makebox(2, 1, 28, 0x556644, -107, 0, -60);
    }

    function buildchannel() {
        // English Channel — blue-grey water east of cliffs
        makebox(120, 1, 200, 0x4682B4, 200, 0, 50);
        // Deeper water further out
        makebox(80, 1, 200, 0x36648B, 260, 0, 50);
        // Harbour basin water
        makebox(80, 1, 80, 0x4682B4, 140, 0, 50);
        // Wave effect boxes
        makebox(100, 1, 2, 0x87CEEB, 200, 1, 20);
        makebox(100, 1, 2, 0x87CEEB, 200, 1, 35);
        makebox(100, 1, 2, 0x87CEEB, 200, 1, 50);
    }

    function buildground() {
        // Ground plane built from boxes — clifftop ground
        makebox(200, 2, 80, 0x5D8A3C, 0, -1, -50);
        // Lower ground at base of cliffs
        makebox(120, 2, 30, 0x8B7355, 40, -14, 15);
        // Road to ferry port
        makebox(60, 1, 4, 0x444444, 100, -13, 30);
    }

    function init(sceneref) {
        scene = sceneref;
        objects = [];
        buildground();
        buildcliffs();
        buildshakespearecliff();
        buildhellfiretunnels();
        buildcastle();
        buildferryport();
        buildpier();
        buildfanbayshelter();
        buildsouthforelandlighthouse();
        builddealcastle();
        buildchannel();
    }

    function update(delta) {
        // Static environment — no per-frame updates needed
    }

    function reset() {
        var i;
        for (i = 0; i < objects.length; i++) {
            scene.remove(objects[i]);
            if (objects[i].geometry) {
                objects[i].geometry.dispose();
            }
            if (objects[i].material) {
                objects[i].material.dispose();
            }
        }
        objects = [];
        scene = null;
    }

    return { init: init, update: update, reset: reset };
}());
