window.HookLighthouse = (function() {
    'use strict';

    var scene = null;
    var camera = null;
    var objects = [];

    var OX = 17720;
    var OY = 0;
    var OZ = 0;

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
        objects = [];
        build();
    }

    function addMesh(mesh) {
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function makeMat(color) {
        return new THREE.MeshLambertMaterial({ color: color });
    }

    function box(w, h, d, color, x, y, z) {
        var geo = new THREE.BoxGeometry(w, h, d);
        var mat = makeMat(color);
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(OX + x, OY + y, OZ + z);
        return addMesh(mesh);
    }

    function cyl(rt, rb, h, segs, color, x, y, z) {
        var geo = new THREE.CylinderGeometry(rt, rb, h, segs);
        var mat = makeMat(color);
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(OX + x, OY + y, OZ + z);
        return addMesh(mesh);
    }

    function sph(r, wsegs, hsegs, color, x, y, z) {
        var geo = new THREE.SphereGeometry(r, wsegs, hsegs);
        var mat = makeMat(color);
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(OX + x, OY + y, OZ + z);
        return addMesh(mesh);
    }

    function cone(r, h, segs, color, x, y, z) {
        var geo = new THREE.ConeGeometry(r, h, segs);
        var mat = makeMat(color);
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(OX + x, OY + y, OZ + z);
        return addMesh(mesh);
    }

    function build() {
        buildTower();
        buildLanternRoom();
        buildKeepersQuarters();
        buildFortifiedWalls();
        buildRockyHeadland();
        buildWavePlatform();
        buildNorthSea();
        buildFieldWalls();
        buildMonkCells();
        buildFogHornBuilding();
        buildHelicopterPad();
        buildOuterDetails();
    }

    function buildTower() {
        // Hook Lighthouse tower - alternating white and dark grey bands stacked as cylinders
        // Height 20 total, 10 bands of 2 units each
        var bandH = 2.0;
        var colors = [0xFFFFFF, 0x333333];
        var totalBands = 10;
        var baseY = 1.0; // bottom of first band sits at y=1 so bottom face is at y=0

        for (var i = 0; i < totalBands; i++) {
            var topR = 1.8 - i * 0.08;
            var botR = 1.8 - i * 0.08 + 0.04;
            if (topR < 0.8) { topR = 0.8; }
            if (botR < 0.84) { botR = 0.84; }
            var bandColor = colors[i % 2];
            var bandY = baseY + i * bandH + bandH * 0.5;
            cyl(topR, botR, bandH, 16, bandColor, 0, bandY, 0);
        }

        // Thick base plinth
        cyl(2.6, 3.0, 2.0, 16, 0x888888, 0, 1.0, 0);

        // Doorway arch lintel (box over entrance)
        box(0.9, 0.25, 0.2, 0x555555, 1.8, 2.2, 0);

        // Door surround left
        box(0.15, 1.2, 0.2, 0x555555, 1.45, 1.6, 0);

        // Door surround right
        box(0.15, 1.2, 0.2, 0x555555, 2.15, 1.6, 0);
    }

    function buildLanternRoom() {
        // Gallery platform below lantern room
        cyl(2.2, 2.0, 0.5, 16, 0xCCCCCC, 0, 21.25, 0);

        // Lantern room drum - orange
        cyl(1.4, 1.6, 1.8, 12, 0xFF6B35, 0, 22.9, 0);

        // Lens dome - bright sphere
        sph(1.1, 12, 8, 0xFFEE88, 0, 24.1, 0);

        // Top cap / lightning rod base
        cyl(0.15, 0.4, 0.6, 8, 0x333333, 0, 25.0, 0);

        // Lightning rod tip
        cyl(0.04, 0.08, 0.8, 6, 0xAAAAAA, 0, 25.7, 0);

        // Railing posts around gallery - 8 posts
        for (var p = 0; p < 8; p++) {
            var angle = (p / 8) * Math.PI * 2;
            var rx = Math.cos(angle) * 2.0;
            var rz = Math.sin(angle) * 2.0;
            cyl(0.05, 0.05, 0.8, 6, 0x444444, rx, 21.9, rz);
        }

        // Railing top ring (approximated with a flat thin cylinder)
        cyl(2.05, 2.1, 0.08, 16, 0x444444, 0, 22.3, 0);
    }

    function buildKeepersQuarters() {
        // Main keepers cottage - south side
        box(6, 3, 4, 0x808080, -8, 1.5, 0);
        // Roof
        cone(4.5, 2, 4, 0x555555, -8, 4.0, 0);

        // Chimney
        box(0.5, 1.5, 0.5, 0x666666, -6.5, 4.5, 0.5);

        // Windows on cottage (inset dark boxes)
        box(0.8, 0.8, 0.1, 0x1A2A3A, -6.5, 2.0, -2.05);
        box(0.8, 0.8, 0.1, 0x1A2A3A, -9.5, 2.0, -2.05);
        box(0.8, 0.8, 0.1, 0x1A2A3A, -8.0, 2.0, -2.05);

        // Door
        box(0.7, 1.4, 0.1, 0x4A2C10, -8.0, 0.7, -2.06);

        // Second smaller outbuilding - north side
        box(4, 2.5, 3, 0x808080, -8, 1.25, 6);
        cone(3, 1.5, 4, 0x555555, -8, 3.25, 6);

        // Storage shed
        box(3, 2, 2.5, 0x707070, 6, 1.0, -7);
        box(3, 0.2, 2.6, 0x555555, 6, 2.1, -7);

        // Small annex attached to main cottage
        box(2.5, 2.5, 2.5, 0x7A7A7A, -11.5, 1.25, 0);
        box(2.6, 0.2, 2.6, 0x555555, -11.5, 2.6, 0);

        // Engine room / generator shed
        box(4, 3, 3, 0x888888, 8, 1.5, 5);
        box(4.1, 0.3, 3.1, 0x666666, 8, 3.15, 5);
    }

    function buildFortifiedWalls() {
        // Medieval fortified perimeter walls
        // South wall
        box(22, 3, 0.8, 0x777777, 0, 1.5, -14);
        // North wall
        box(22, 3, 0.8, 0x777777, 0, 1.5, 14);
        // East wall
        box(0.8, 3, 28, 0x777777, 11, 1.5, 0);
        // West wall
        box(0.8, 3, 28, 0x777777, -11, 1.5, 0);

        // Corner turrets (small cylinders)
        cyl(1.2, 1.4, 3.5, 8, 0x696969, 11, 1.75, 14);
        cyl(1.2, 1.4, 3.5, 8, 0x696969, -11, 1.75, 14);
        cyl(1.2, 1.4, 3.5, 8, 0x696969, 11, 1.75, -14);
        cyl(1.2, 1.4, 3.5, 8, 0x696969, -11, 1.75, -14);

        // Battlements on south wall - merlons
        for (var m = 0; m < 6; m++) {
            box(1.0, 0.8, 0.9, 0x777777, -10 + m * 4, 3.4, -14);
        }
        // Battlements on north wall
        for (var mn = 0; mn < 6; mn++) {
            box(1.0, 0.8, 0.9, 0x777777, -10 + mn * 4, 3.4, 14);
        }

        // Gateway arch entrance south
        box(2.5, 0.5, 0.9, 0x777777, 0, 3.25, -14);

        // Outer defensive wall further out
        box(30, 1.5, 0.5, 0x666666, 2, 0.75, -20);
        box(0.5, 1.5, 12, 0x666666, 17, 0.75, -14);
        box(0.5, 1.5, 12, 0x666666, -13, 0.75, -14);
    }

    function buildRockyHeadland() {
        // Scattered rock boulders and outcroppings around the base
        box(3.5, 1.2, 2.8, 0x696969, 15, 0.6, 10);
        box(2.0, 0.8, 1.5, 0x5A5A5A, 18, 0.4, 12);
        box(4.0, 1.5, 3.0, 0x696969, -15, 0.75, 8);
        box(2.5, 1.0, 2.0, 0x5F5F5F, -17, 0.5, -10);
        box(3.0, 1.8, 2.5, 0x696969, 13, 0.9, -12);
        box(1.8, 0.7, 1.4, 0x6A6A6A, -12, 0.35, 15);
        box(5.0, 2.0, 4.0, 0x606060, 20, 1.0, -5);
        box(2.2, 0.9, 1.8, 0x5A5A5A, -20, 0.45, 5);
        box(3.5, 1.3, 3.0, 0x696969, 22, 0.65, 8);
        box(1.5, 0.6, 1.2, 0x686868, 14, 0.3, 18);

        // Larger outcroppings further out
        box(6, 2.5, 5, 0x585858, 25, 1.25, -10);
        box(4, 1.8, 3.5, 0x636363, -23, 0.9, -12);
        box(5, 2.2, 4, 0x5D5D5D, 27, 1.1, 5);

        // Smaller rubble scatter
        box(1.0, 0.4, 0.8, 0x707070, 5, 0.2, -16);
        box(0.8, 0.3, 0.7, 0x686868, -5, 0.15, 17);
        box(1.2, 0.5, 1.0, 0x696969, 10, 0.25, 16);
        box(0.9, 0.35, 0.7, 0x6A6A6A, -8, 0.175, -17);
    }

    function buildWavePlatform() {
        // Wave-cut rock platform slabs at sea level
        box(12, 0.4, 8, 0x808080, 18, -0.2, 18);
        box(8, 0.3, 6, 0x7A7A7A, 26, -0.15, 12);
        box(10, 0.35, 7, 0x787878, -18, -0.175, 16);
        box(6, 0.3, 5, 0x828282, -24, -0.15, -14);
        box(9, 0.4, 6, 0x7C7C7C, 22, -0.2, -16);
        box(5, 0.25, 4, 0x7E7E7E, -16, -0.125, -20);
        box(7, 0.3, 5, 0x808080, 0, -0.15, 22);
    }

    function buildNorthSea() {
        // Deep blue water plane using BoxGeometry (flat slabs)
        box(80, 0.5, 30, 0x006994, 0, -1.25, 40);
        box(80, 0.5, 30, 0x006994, 0, -1.25, -40);
        box(30, 0.5, 30, 0x005A80, 40, -1.25, 0);
        box(30, 0.5, 30, 0x005A80, -40, -1.25, 0);

        // Ground plane under the headland
        box(60, 0.5, 60, 0x4A6741, 0, -0.75, 0);

        // Small waves (slightly raised water boxes)
        box(6, 0.15, 2, 0x0077AA, 30, -0.9, 25);
        box(5, 0.15, 2, 0x0077AA, -28, -0.9, 22);
        box(4, 0.15, 2, 0x0080B0, 32, -0.9, -20);
    }

    function buildFieldWalls() {
        // Low stone field walls across the headland
        box(12, 0.8, 0.5, 0x808080, -5, 0.4, -8);
        box(10, 0.8, 0.5, 0x787878, 7, 0.4, -10);
        box(8, 0.8, 0.5, 0x828282, -14, 0.4, 2);
        box(0.5, 0.8, 10, 0x7E7E7E, -18, 0.4, -4);
        box(14, 0.8, 0.5, 0x808080, 5, 0.4, 10);
        box(0.5, 0.8, 8, 0x787878, 14, 0.4, 8);
        box(6, 0.6, 0.4, 0x7A7A7A, -6, 0.3, 12);
        box(0.4, 0.6, 6, 0x808080, -10, 0.3, 10);
    }

    function buildMonkCells() {
        // Beehive hut monk cells (450 AD) - ConeGeometry roof on BoxGeometry base
        // Cell 1
        box(2.5, 2.0, 2.5, 0x909090, -6, 1.0, -5);
        cone(1.5, 2.0, 6, 0x808080, -6, 3.0, -5);

        // Cell 2
        box(2.2, 1.8, 2.2, 0x8A8A8A, -9, 0.9, -4);
        cone(1.3, 1.8, 6, 0x7A7A7A, -9, 2.7, -4);

        // Cell 3
        box(2.0, 1.6, 2.0, 0x949494, -7, 0.8, -7);
        cone(1.2, 1.6, 6, 0x848484, -7, 2.4, -7);

        // Cell 4 - slightly larger, abbot's cell
        box(3.0, 2.2, 3.0, 0x909090, -5, 1.1, -3);
        cone(1.8, 2.4, 6, 0x808080, -5, 3.3, -3);

        // Oratory / small chapel nearby
        box(4.0, 2.5, 5.0, 0x8C8C8C, -5, 1.25, -10);
        cone(2.2, 2.0, 4, 0x7C7C7C, -5, 3.5, -10);

        // Small stone crosses outside cells (thin tall boxes)
        box(0.15, 1.2, 0.15, 0x6A6A6A, -4, 0.6, -3);
        box(0.15, 1.2, 0.15, 0x6A6A6A, -10, 0.6, -6);
    }

    function buildFogHornBuilding() {
        // Main fog horn building - white mechanical building
        box(5, 3, 4, 0xFFFFFF, 12, 1.5, -8);
        // Flat roof
        box(5.2, 0.25, 4.2, 0xDDDDDD, 12, 3.125, -8);

        // Ventilation boxes on roof
        box(1.0, 0.6, 1.0, 0xEEEEEE, 11, 3.55, -7.5);
        box(1.0, 0.6, 1.0, 0xEEEEEE, 13, 3.55, -7.5);
        box(0.8, 0.5, 0.8, 0xDDDDDD, 12, 3.5, -9.0);

        // Fog horn trumpet - horizontal cylinder
        var hornGeo = new THREE.CylinderGeometry(0.3, 0.6, 2.5, 8);
        var hornMat = makeMat(0xCCCCCC);
        var hornMesh = new THREE.Mesh(hornGeo, hornMat);
        hornMesh.rotation.z = Math.PI / 2;
        hornMesh.position.set(OX + 15.25, OY + 2.5, OZ + -8);
        scene.add(hornMesh);
        objects.push(hornMesh);

        // Second horn
        var hornGeo2 = new THREE.CylinderGeometry(0.25, 0.5, 2.0, 8);
        var hornMat2 = makeMat(0xCCCCCC);
        var hornMesh2 = new THREE.Mesh(hornGeo2, hornMat2);
        hornMesh2.rotation.z = Math.PI / 2;
        hornMesh2.position.set(OX + 15.0, OY + 3.2, OZ + -8);
        scene.add(hornMesh2);
        objects.push(hornMesh2);

        // Small door
        box(0.8, 1.4, 0.1, 0xBBBBBB, 12, 0.7, -6.05);

        // Window
        box(0.7, 0.7, 0.1, 0x1A2A3A, 13.5, 2.0, -6.05);

        // Pipe / exhaust stack
        cyl(0.15, 0.2, 1.5, 6, 0x888888, 14, 4.0, -7.5);
    }

    function buildHelicopterPad() {
        // Concrete helicopter pad
        box(8, 0.2, 8, 0x808080, 12, 0.1, 8);

        // Yellow H marking - horizontal bar
        box(4.0, 0.05, 0.8, 0xFFD700, 12, 0.21, 8);

        // Yellow H marking - vertical bars
        box(0.8, 0.05, 3.5, 0xFFD700, 10, 0.21, 8);
        box(0.8, 0.05, 3.5, 0xFFD700, 14, 0.21, 8);

        // Pad border markers - corner boxes
        box(0.4, 0.3, 0.4, 0xFFD700, 8.2, 0.25, 4.2);
        box(0.4, 0.3, 0.4, 0xFFD700, 15.8, 0.25, 4.2);
        box(0.4, 0.3, 0.4, 0xFFD700, 8.2, 0.25, 11.8);
        box(0.4, 0.3, 0.4, 0xFFD700, 15.8, 0.25, 11.8);

        // Wind sock pole
        cyl(0.05, 0.06, 2.0, 6, 0xAAAAAA, 16.5, 1.0, 4.5);
        // Wind sock
        cone(0.25, 0.8, 6, 0xFF4400, 16.5, 2.4, 4.5);
    }

    function buildOuterDetails() {
        // Flagpole
        cyl(0.05, 0.07, 4.0, 6, 0xCCCCCC, -10, 2.0, -13);
        // Flag
        box(1.5, 0.8, 0.05, 0x009A44, -9.25, 3.8, -13);

        // Fuel / oil storage tanks (cylinders)
        cyl(1.0, 1.0, 2.5, 10, 0x777777, 9, 1.25, -5);
        cyl(1.0, 1.0, 2.5, 10, 0x777777, 11, 1.25, -5);

        // Water cistern
        cyl(1.5, 1.5, 3.0, 10, 0x8A8A8A, -13, 1.5, 8);
        // Cistern top
        cyl(1.55, 1.5, 0.2, 10, 0x6A6A6A, -13, 3.1, 8);

        // Lamp equipment shed
        box(2.5, 2.0, 2.0, 0x909090, 7, 1.0, -4);
        box(2.5, 0.15, 2.0, 0x777777, 7, 2.075, -4);

        // Coastal marker buoy on shore (sphere)
        sph(0.5, 8, 6, 0xFF2200, 24, 0.5, 16);
        cyl(0.06, 0.06, 1.2, 6, 0xAAAAAA, 24, 1.6, 16);

        // Distant rocky stack (sea stack)
        cyl(1.2, 2.0, 6.0, 8, 0x585858, 35, 3.0, -18);
        sph(1.1, 8, 6, 0x505050, 35, 6.5, -18);

        // Second sea stack
        cyl(0.9, 1.5, 4.5, 8, 0x606060, -32, 2.25, 20);

        // Path / walkway from gate to tower (flat light box)
        box(1.5, 0.05, 12, 0x9A9A9A, 0, 0.025, -7);

        // Anchor display on pad near entrance
        box(0.2, 1.2, 0.2, 0x333333, -1.5, 0.6, -13.5);
        box(1.8, 0.2, 0.2, 0x333333, -1.5, 0.1, -13.5);

        // Visitor information board
        box(1.2, 1.0, 0.1, 0x8B4513, -3, 1.2, -13.8);
        box(0.1, 1.4, 0.1, 0x6A3000, -3, 0.7, -13.8);

        // Picnic table
        box(2.0, 0.1, 0.8, 0x8B6914, -15, 0.8, -3);
        box(0.1, 0.8, 0.8, 0x7A5810, -14.2, 0.4, -3);
        box(0.1, 0.8, 0.8, 0x7A5810, -15.8, 0.4, -3);

        // Boundary marker posts
        box(0.2, 1.0, 0.2, 0xEEEEEE, -10, 0.5, -20);
        box(0.2, 1.0, 0.2, 0xEEEEEE, -5, 0.5, -20);
        box(0.2, 1.0, 0.2, 0xEEEEEE, 0, 0.5, -20);
        box(0.2, 1.0, 0.2, 0xEEEEEE, 5, 0.5, -20);
        box(0.2, 1.0, 0.2, 0xEEEEEE, 10, 0.5, -20);

        // Steps up to tower door
        box(1.5, 0.25, 0.8, 0x888888, 1.5, 0.125, -1.6);
        box(1.5, 0.5, 0.6, 0x888888, 1.5, 0.25, -1.1);
        box(1.5, 0.75, 0.5, 0x888888, 1.5, 0.375, -0.65);
    }

    function update(delta) {
    }

    function reset() {
        for (var i = 0; i < objects.length; i++) {
            scene.remove(objects[i]);
        }
        objects = [];
        scene = null;
        camera = null;
    }

    return { init: init, update: update, reset: reset };
}());
