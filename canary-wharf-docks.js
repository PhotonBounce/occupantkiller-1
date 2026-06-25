window.CanaryWharfDocks = (function() {
    'use strict';

    var scene = null;
    var camera = null;
    var objects = [];

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

    function makeBox(w, h, d, color, x, y, z) {
        var geo = new THREE.BoxGeometry(w, h, d);
        var mat = makeMat(color);
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        return addMesh(mesh);
    }

    function makeCylinder(rt, rb, h, segs, color, x, y, z) {
        var geo = new THREE.CylinderGeometry(rt, rb, h, segs);
        var mat = makeMat(color);
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        return addMesh(mesh);
    }

    function makeCone(r, h, segs, color, x, y, z) {
        var geo = new THREE.ConeGeometry(r, h, segs);
        var mat = makeMat(color);
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        return addMesh(mesh);
    }

    function buildTowers() {
        var ox = 11840;

        // One Canada Square — tallest, 40 high, with pyramid cap
        makeBox(8, 40, 8, 0x99bbcc, ox + 0, 20, -10);
        // Pyramid cap on One Canada Square
        makeCone(3, 5, 4, 0x88aacc, ox + 0, 42.5, -10);

        // HSBC tower — wide blue slab, 30 high
        makeBox(14, 30, 6, 0x2255aa, ox + 22, 15, -8);

        // Citi tower — 26 high, steel-tinted
        makeBox(7, 26, 7, 0xaabbcc, ox + -18, 13, -5);

        // Barclays HQ — 28 high, dark glass
        makeBox(9, 28, 8, 0x334455, ox + 12, 14, 18);

        // KPMG Heron Quays — 22 high
        makeBox(7, 22, 7, 0x557788, ox + -10, 11, 20);

        // Tower 6 — 18 high, light glass
        makeBox(6, 18, 6, 0xbbddee, ox + 32, 9, 5);

        // Tower 7 — 24 high
        makeBox(8, 24, 7, 0x446677, ox + -28, 12, 12);

        // Tower 8 — 20 high
        makeBox(6, 20, 6, 0x99aabb, ox + 20, 10, -28);

        // Glass facade strips on One Canada Square
        makeBox(0.3, 38, 8.2, 0xaaccee, ox + 4.15, 20, -10);
        makeBox(0.3, 38, 8.2, 0xaaccee, ox + -4.15, 20, -10);
        makeBox(8.2, 38, 0.3, 0xaaccee, ox + 0, 20, -5.85);
        makeBox(8.2, 38, 0.3, 0xaaccee, ox + 0, 20, -14.15);

        // Podium base for tower cluster
        makeBox(60, 1.5, 50, 0x888888, ox + 2, 0.75, 5);
    }

    function buildWestIndiaDocks() {
        var ox = 11840;

        // Large dock basin — blue water rectangle
        makeBox(80, 0.4, 40, 0x1155aa, ox + 0, 0.2, 80);

        // Dock quay surrounds — stone grey
        makeBox(84, 1, 2, 0x888880, ox + 0, 0.5, 61);
        makeBox(84, 1, 2, 0x888880, ox + 0, 0.5, 99);
        makeBox(2, 1, 40, 0x888880, ox + -41, 0.5, 80);
        makeBox(2, 1, 40, 0x888880, ox + 41, 0.5, 80);

        // North Georgian warehouse range
        makeBox(80, 8, 14, 0x9b6b4a, ox + 0, 4, 55);
        // Warehouse windows row north
        makeBox(78, 0.5, 0.3, 0x5a3a1a, ox + 0, 7, 48.15);
        makeBox(78, 0.5, 0.3, 0x5a3a1a, ox + 0, 4, 48.15);

        // South Georgian warehouse range
        makeBox(80, 8, 14, 0x9b6b4a, ox + 0, 4, 105);
        // Warehouse windows row south
        makeBox(78, 0.5, 0.3, 0x5a3a1a, ox + 0, 7, 111.85);
        makeBox(78, 0.5, 0.3, 0x5a3a1a, ox + 0, 4, 111.85);

        // Museum of London Docklands — in west warehouse section
        // Signage panel
        makeBox(18, 0.2, 8, 0xddddff, ox + -30, 8.15, 55);

        // Warehouse internal floor levels (darker strips)
        makeBox(78, 0.3, 13.5, 0x7a4a2a, ox + 0, 8.15, 55);

        // Dock lock gate west
        makeBox(1.5, 2, 6, 0x555544, ox + -41, 1.0, 80);
        // Dock lock gate east
        makeBox(1.5, 2, 6, 0x555544, ox + 41, 1.0, 80);

        // Dock cranes (simplified cylinders)
        makeCylinder(0.4, 0.5, 12, 6, 0x445544, ox + -35, 6, 63);
        makeCylinder(0.4, 0.5, 12, 6, 0x445544, ox + 35, 6, 63);
        makeBox(10, 0.6, 0.6, 0x445544, ox + -35, 12.3, 63);
        makeBox(10, 0.6, 0.6, 0x445544, ox + 35, 12.3, 63);
    }

    function buildJubileeStation() {
        var ox = 11840;
        var sz = -60;

        // Surface glazed canopy — Norman Foster vaulted glass roof
        makeBox(36, 1.5, 20, 0x99ccdd, ox + 0, 7.5, sz);
        // Canopy arch supports
        makeCylinder(0.5, 0.5, 8, 8, 0x778899, ox + -17, 4, sz);
        makeCylinder(0.5, 0.5, 8, 8, 0x778899, ox + 17, 4, sz);
        makeCylinder(0.5, 0.5, 8, 8, 0x778899, ox + -17, 4, sz + 8);
        makeCylinder(0.5, 0.5, 8, 8, 0x778899, ox + 17, 4, sz + 8);
        makeCylinder(0.5, 0.5, 8, 8, 0x778899, ox + -17, 4, sz - 8);
        makeCylinder(0.5, 0.5, 8, 8, 0x778899, ox + 17, 4, sz - 8);

        // Concourse box at grade
        makeBox(34, 4, 18, 0xaabbbb, ox + 0, 2, sz);

        // Underground vaulted undercroft — concrete box deep below
        makeBox(34, 10, 18, 0x7a8a8a, ox + 0, -10, sz);
        // Undercroft vault ceiling curve (approximate with squashed cylinder)
        makeCylinder(9, 9, 34, 12, 0x889999, ox + 0, -5, sz);

        // Escalator shaft 1
        makeBox(4, 12, 3, 0x556677, ox + -6, -4, sz - 4);
        // Escalator shaft 2
        makeBox(4, 12, 3, 0x556677, ox + 6, -4, sz - 4);

        // Platform level box
        makeBox(34, 3, 16, 0x667777, ox + 0, -17, sz);

        // Ticket hall floor
        makeBox(32, 0.4, 16, 0x999999, ox + 0, 0.2, sz);

        // Entrance pillars
        makeCylinder(0.8, 0.8, 5, 8, 0x889988, ox + -15, 2.5, sz - 8);
        makeCylinder(0.8, 0.8, 5, 8, 0x889988, ox + 15, 2.5, sz - 8);
        makeCylinder(0.8, 0.8, 5, 8, 0x889988, ox + -15, 2.5, sz + 8);
        makeCylinder(0.8, 0.8, 5, 8, 0x889988, ox + 15, 2.5, sz + 8);
    }

    function buildDLR() {
        var ox = 11840;

        // Elevated viaduct piers — concrete columns
        var pierZ = [-40, -20, 0, 20, 40, 60];
        for (var i = 0; i < pierZ.length; i++) {
            makeCylinder(1.2, 1.4, 9, 6, 0x999988, ox + 50, 4.5, pierZ[i]);
            makeCylinder(1.2, 1.4, 9, 6, 0x999988, ox + 54, 4.5, pierZ[i]);
        }

        // Viaduct deck spanning piers
        makeBox(6, 1, 110, 0x888877, ox + 52, 9.5, 10);

        // DLR train car body
        makeBox(9, 2.5, 2.8, 0x2244aa, ox + 52, 11.8, -10);
        // Train windows strip
        makeBox(8, 0.8, 0.3, 0xaaccff, ox + 52, 12, -11.55);
        // Train front nose
        makeCone(1.4, 1.5, 4, 0x1133aa, ox + 52, 11.8, -15.25);
        // Train wheels (symbolic cylinders)
        makeCylinder(0.5, 0.5, 2.6, 8, 0x333333, ox + 52, 10.6, -9);
        makeCylinder(0.5, 0.5, 2.6, 8, 0x333333, ox + 52, 10.6, -11);

        // Rail lines on deck (two thin strips)
        makeBox(0.2, 0.2, 108, 0x555544, ox + 51, 10.1, 10);
        makeBox(0.2, 0.2, 108, 0x555544, ox + 53, 10.1, 10);

        // Overhead wire support masts
        makeCylinder(0.15, 0.15, 4, 4, 0x888888, ox + 52, 14, -20);
        makeCylinder(0.15, 0.15, 4, 4, 0x888888, ox + 52, 14, 0);
        makeCylinder(0.15, 0.15, 4, 4, 0x888888, ox + 52, 14, 20);
    }

    function buildCrossrailPlace() {
        var ox = 11840;
        var cz = -90;

        // Base building podium — Elizabeth line station box
        makeBox(40, 6, 28, 0x889988, ox + -50, 3, cz);

        // Roof garden bowl frame — timber-and-glass lattice roof
        // Bowl rim — large flattened sphere approximated with scaled box
        makeBox(38, 1, 26, 0x99aa88, ox + -50, 8, cz);

        // Bowl arch ribs (crossing timber beams)
        makeBox(0.6, 8, 26, 0xaa9966, ox + -50 - 16, 12, cz);
        makeBox(0.6, 8, 26, 0xaa9966, ox + -50 - 8, 14, cz);
        makeBox(0.6, 8, 26, 0xaa9966, ox + -50, 15, cz);
        makeBox(0.6, 8, 26, 0xaa9966, ox + -50 + 8, 14, cz);
        makeBox(0.6, 8, 26, 0xaa9966, ox + -50 + 16, 12, cz);

        // Cross ribs
        makeBox(38, 0.6, 0.6, 0xaa9966, ox + -50, 12, cz - 10);
        makeBox(38, 0.6, 0.6, 0xaa9966, ox + -50, 14, cz);
        makeBox(38, 0.6, 0.6, 0xaa9966, ox + -50, 12, cz + 10);

        // Glass infill panels between ribs
        makeBox(38, 6, 24, 0x99ddcc, ox + -50, 12, cz);

        // Roof garden planting beds
        makeBox(6, 0.8, 4, 0x336633, ox + -60, 8.8, cz - 6);
        makeBox(6, 0.8, 4, 0x336633, ox + -50, 8.8, cz - 6);
        makeBox(6, 0.8, 4, 0x336633, ox + -40, 8.8, cz - 6);
        makeBox(6, 0.8, 4, 0x336633, ox + -60, 8.8, cz + 6);
        makeBox(6, 0.8, 4, 0x336633, ox + -50, 8.8, cz + 6);
        makeBox(6, 0.8, 4, 0x336633, ox + -40, 8.8, cz + 6);

        // Elizabeth line entrance concourse at grade
        makeBox(16, 3, 10, 0x778899, ox + -50, 1.5, cz + 18);

        // Station entrance canopy
        makeBox(16, 0.5, 10, 0xaabb99, ox + -50, 4.5, cz + 18);

        // Underground platform box
        makeBox(38, 5, 10, 0x667777, ox + -50, -5, cz);
    }

    function buildGroundPlane() {
        var ox = 11840;
        // District ground plane
        makeBox(200, 0.5, 300, 0x555555, ox + 0, -0.25, 20);

        // Road network
        makeBox(200, 0.6, 6, 0x333333, ox + 0, 0.3, 0);
        makeBox(6, 0.6, 300, 0x333333, ox + 30, 0.3, 20);
        makeBox(6, 0.6, 300, 0x333333, ox + -30, 0.3, 20);

        // Pavement strips
        makeBox(200, 0.6, 2, 0x888877, ox + 0, 0.3, 4);
        makeBox(200, 0.6, 2, 0x888877, ox + 0, 0.3, -4);

        // Thames river edge (south)
        makeBox(200, 0.3, 20, 0x1144aa, ox + 0, 0.15, 145);
    }

    function build() {
        buildGroundPlane();
        buildTowers();
        buildWestIndiaDocks();
        buildJubileeStation();
        buildDLR();
        buildCrossrailPlace();
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
