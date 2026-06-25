window.EastleighSpitfire = (function() {
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

    function makeBox(w, h, d, color, x, y, z) {
        var geo = new THREE.BoxGeometry(w, h, d);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        return addMesh(mesh);
    }

    function makeCylinder(rt, rb, h, segs, color, x, y, z) {
        var geo = new THREE.CylinderGeometry(rt, rb, h, segs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        return addMesh(mesh);
    }

    function makeSphere(r, ws, hs, color, x, y, z) {
        var geo = new THREE.SphereGeometry(r, ws, hs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        return addMesh(mesh);
    }

    function makeCone(r, h, segs, color, x, y, z) {
        var geo = new THREE.ConeGeometry(r, h, segs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        return addMesh(mesh);
    }

    function makeLines(points, color) {
        var geo = new THREE.BufferGeometry().setFromPoints(points);
        var mat = new THREE.LineBasicMaterial({ color: color });
        var ls = new THREE.LineSegments(geo, mat);
        return addMesh(ls);
    }

    function buildSupermarineWorks() {
        var bx = 13320;
        var bz = -200;

        // Main factory building - long industrial brick structure
        makeBox(120, 18, 50, 0x8B4513, bx, 9, bz);
        // Roof
        makeBox(122, 2, 52, 0x5C3317, bx, 18, bz);

        // Design office wing
        makeBox(40, 22, 30, 0x9B5523, bx + 75, 11, bz - 10);
        makeBox(42, 2, 32, 0x5C3317, bx + 75, 22, bz - 10);

        // Windows on main factory (decorative panels)
        for (var wi = 0; wi < 8; wi++) {
            makeBox(8, 10, 1, 0x87CEEB, bx - 52 + wi * 15, 12, bz - 25.5);
            makeBox(8, 10, 1, 0x87CEEB, bx - 52 + wi * 15, 12, bz + 25.5);
        }

        // Chimney stacks
        makeCylinder(2, 2.5, 30, 8, 0x654321, bx - 40, 33, bz - 18);
        makeCylinder(2, 2.5, 30, 8, 0x654321, bx - 20, 33, bz - 18);

        // Small outbuildings / stores
        makeBox(25, 10, 20, 0x8B6914, bx - 80, 5, bz + 35);
        makeBox(25, 2, 22, 0x5C3317, bx - 80, 10, bz + 35);

        makeBox(20, 10, 20, 0x8B6914, bx - 55, 5, bz + 35);
        makeBox(22, 2, 22, 0x5C3317, bx - 55, 10, bz + 35);

        // Memorial plaques wall
        makeBox(30, 8, 1, 0xC0C0C0, bx + 20, 4, bz + 60);
        makeBox(28, 6, 0.5, 0x8B0000, bx + 20, 4, bz + 60.5);

        // Gate posts / entrance
        makeBox(2, 12, 2, 0x696969, bx - 15, 6, bz + 62);
        makeBox(2, 12, 2, 0x696969, bx + 15, 6, bz + 62);
        makeBox(32, 1.5, 1.5, 0x696969, bx, 12, bz + 62);

        // Yard surface
        makeBox(160, 0.5, 80, 0x808080, bx, 0, bz);
    }

    function buildSpitfireMemorial() {
        var mx = 13320;
        var mz = 150;

        // Memorial garden base / paved area
        makeBox(60, 0.5, 60, 0xD3D3D3, mx, 0, mz);

        // Main plinth
        makeCylinder(6, 8, 6, 6, 0xBEBEBE, mx, 3, mz);
        makeCylinder(5, 5, 1, 6, 0xA9A9A9, mx, 6.5, mz);

        // Spitfire body on plinth - fuselage
        makeBox(22, 3, 5, 0x4F6F8F, mx, 12, mz);
        // Spitfire nose cone
        makeCone(2.5, 8, 8, 0x3A5A7A, mx + 14, 12, mz);
        // Cockpit canopy
        makeSphere(2.5, 8, 6, 0x87CEEB, mx + 3, 14.5, mz);
        // Wings
        makeBox(40, 1, 12, 0x4F6F8F, mx, 11.5, mz);
        // Tail fins
        makeBox(1.5, 6, 8, 0x4F6F8F, mx - 10, 15, mz);
        makeBox(8, 1, 6, 0x4F6F8F, mx - 11, 17, mz);
        // Propeller
        makeCylinder(0.3, 0.3, 12, 6, 0x2F2F2F, mx + 18, 12, mz);
        makeCylinder(0.3, 0.3, 12, 6, 0x2F2F2F, mx + 18, 12, mz);

        // R.J. Mitchell statue base
        makeBox(4, 6, 4, 0x808080, mx - 18, 3, mz + 15);
        // Statue figure (simplified)
        makeCylinder(1, 1.2, 5, 8, 0x696969, mx - 18, 10.5, mz + 15);
        makeSphere(1.2, 8, 6, 0x8B7355, mx - 18, 14, mz + 15);
        makeBox(3, 1, 1, 0x696969, mx - 18, 12, mz + 15);

        // Garden of remembrance - flower beds
        makeBox(10, 0.8, 4, 0x228B22, mx + 15, 0.4, mz + 18);
        makeBox(10, 0.8, 4, 0x228B22, mx + 15, 0.4, mz - 18);
        makeBox(4, 0.8, 10, 0x228B22, mx - 23, 0.4, mz);

        // Flowers on beds
        for (var fi = 0; fi < 5; fi++) {
            makeSphere(0.8, 6, 4, 0xFF0000, mx + 11 + fi * 2, 1.5, mz + 18);
            makeSphere(0.8, 6, 4, 0xFF6347, mx + 11 + fi * 2, 1.5, mz - 18);
        }

        // Flagpoles
        makeCylinder(0.2, 0.2, 18, 6, 0xC0C0C0, mx + 25, 9, mz + 25);
        makeCylinder(0.2, 0.2, 18, 6, 0xC0C0C0, mx - 25, 9, mz + 25);
        makeBox(6, 3, 0.2, 0xC0001A, mx + 25, 18, mz + 25);
        makeBox(6, 3, 0.2, 0x003380, mx - 25, 18, mz + 25);

        // Benches around memorial
        makeBox(6, 0.5, 1.5, 0x8B4513, mx + 22, 1, mz);
        makeBox(0.5, 1.5, 1.5, 0x8B4513, mx + 19, 1.25, mz);
        makeBox(0.5, 1.5, 1.5, 0x8B4513, mx + 25, 1.25, mz);

        makeBox(6, 0.5, 1.5, 0x8B4513, mx - 22, 1, mz);
        makeBox(0.5, 1.5, 1.5, 0x8B4513, mx - 19, 1.25, mz);
        makeBox(0.5, 1.5, 1.5, 0x8B4513, mx - 25, 1.25, mz);

        // Low hedge border
        makeBox(62, 2, 2, 0x006400, mx, 1, mz + 30);
        makeBox(62, 2, 2, 0x006400, mx, 1, mz - 30);
        makeBox(2, 2, 60, 0x006400, mx + 30, 1, mz);
        makeBox(2, 2, 60, 0x006400, mx - 30, 1, mz);
    }

    function buildSouthamptonAirport() {
        var ax = 13320;
        var az = -600;

        // Main runway surface
        makeBox(600, 0.5, 30, 0x2C2C2C, ax, 0, az);
        // Runway centreline markings
        for (var ri = 0; ri < 20; ri++) {
            makeBox(20, 0.6, 1, 0xFFFFFF, ax - 280 + ri * 30, 0.05, az);
        }
        // Runway threshold markings
        makeBox(28, 0.6, 20, 0xFFFFFF, ax - 285, 0.05, az);
        makeBox(28, 0.6, 20, 0xFFFFFF, ax + 285, 0.05, az);

        // Taxiway
        makeBox(500, 0.5, 15, 0x383838, ax, 0, az + 50);

        // Apron / parking area
        makeBox(200, 0.5, 80, 0x404040, ax - 180, 0, az + 100);

        // Terminal building
        makeBox(100, 20, 40, 0xE8E8E8, ax - 130, 10, az + 160);
        makeBox(102, 2, 42, 0xC0C0C0, ax - 130, 20, az + 160);
        // Terminal glazed front
        makeBox(100, 16, 1, 0x87CEEB, ax - 130, 10, az + 140.5);
        // Terminal canopy
        makeBox(80, 2, 15, 0xBDBDBD, ax - 130, 22, az + 148);

        // Departure lounge extension
        makeBox(40, 15, 20, 0xD0D0D0, ax - 80, 7.5, az + 155);
        makeBox(40, 1, 20, 0xC0C0C0, ax - 80, 15, az + 155);

        // Control tower
        makeBox(10, 40, 10, 0xF5F5F5, ax - 50, 20, az + 175);
        makeBox(16, 6, 16, 0xD0D0D0, ax - 50, 43, az + 175);
        makeBox(17, 1, 17, 0xBBBBBB, ax - 50, 46, az + 175);
        // Tower glass cab
        makeBox(14, 5, 14, 0x87CEEB, ax - 50, 43, az + 175);
        // Radar dish
        makeCylinder(4, 4, 0.5, 8, 0xC0C0C0, ax - 50, 47.5, az + 175);
        makeCylinder(0.3, 0.3, 5, 6, 0xAAAAAA, ax - 50, 50, az + 175);

        // Parked aircraft 1
        makeBox(26, 4, 6, 0xFFFFFF, ax - 200, 2, az + 110);
        makeBox(1, 1, 6, 0xFFFFFF, ax - 200, 5, az + 110);
        makeBox(34, 1, 7, 0xFFFFFF, ax - 200, 1.5, az + 110);
        makeCone(2.5, 10, 8, 0xCCCCCC, ax - 212, 2, az + 110);
        makeCylinder(2, 2.2, 3, 8, 0x333333, ax - 194, 0, az + 116);
        makeCylinder(2, 2.2, 3, 8, 0x333333, ax - 194, 0, az + 104);
        makeCylinder(2, 2.2, 3, 8, 0x333333, ax - 208, 0, az + 116);
        makeCylinder(2, 2.2, 3, 8, 0x333333, ax - 208, 0, az + 104);

        // Parked aircraft 2
        makeBox(26, 4, 6, 0x003087, ax - 230, 2, az + 125);
        makeBox(34, 1, 7, 0xFFFFFF, ax - 230, 1.5, az + 125);
        makeCone(2.5, 10, 8, 0x003087, ax - 242, 2, az + 125);

        // Aircraft hangar
        makeBox(80, 25, 60, 0xB0B0B0, ax - 80, 12.5, az + 100);
        makeBox(82, 2, 62, 0x909090, ax - 80, 25, az + 100);
        makeBox(80, 22, 1, 0x888888, ax - 80, 12.5, az + 70.5);

        // Fuel depot
        makeCylinder(8, 8, 15, 10, 0xFF8C00, ax + 80, 7.5, az + 165);
        makeCylinder(8, 8, 15, 10, 0xFF8C00, ax + 100, 7.5, az + 165);

        // Airport perimeter fence
        makeBox(610, 4, 1, 0x808080, ax, 2, az - 20);
        makeBox(610, 4, 1, 0x808080, ax, 2, az + 200);
        makeBox(1, 4, 220, 0x808080, ax - 305, 2, az + 90);
        makeBox(1, 4, 220, 0x808080, ax + 305, 2, az + 90);

        // Airport road
        makeBox(200, 0.5, 10, 0x3C3C3C, ax - 130, 0.1, az + 210);
    }

    function buildRailwayWorks() {
        var rx = 13320;
        var rz = 400;

        // Large engine shed 1
        makeBox(100, 25, 40, 0x8B6914, rx - 80, 12.5, rz);
        makeBox(102, 3, 42, 0x5C3317, rx - 80, 25, rz);
        // Shed entrance
        makeBox(20, 20, 1, 0x2C2C2C, rx - 80, 10, rz - 20.5);

        // Engine shed 2
        makeBox(80, 22, 35, 0x8B6914, rx + 60, 11, rz - 20);
        makeBox(82, 3, 37, 0x5C3317, rx + 60, 22, rz - 20);

        // Workshop building
        makeBox(60, 18, 30, 0x9B6B23, rx - 20, 9, rz + 70);
        makeBox(62, 2, 32, 0x6B4315, rx - 20, 18, rz + 70);

        // Repair bay / pit building
        makeBox(70, 15, 25, 0x7B5B13, rx + 55, 7.5, rz + 65);
        makeBox(72, 2, 27, 0x5C3317, rx + 55, 15, rz + 65);

        // Chimney stacks on works
        makeCylinder(2.5, 3, 40, 8, 0x654321, rx - 100, 33, rz - 5);
        makeCylinder(2, 2.5, 35, 8, 0x654321, rx - 60, 30, rz + 5);
        makeCylinder(2.5, 3, 40, 8, 0x654321, rx + 40, 33, rz - 30);

        // Coal store / fuel depot
        makeBox(30, 8, 25, 0x2C2C2C, rx - 130, 4, rz + 30);

        // Preserved steam engine 1 on track
        makeBox(20, 5, 4, 0x1A1A1A, rx - 80, 6, rz + 45);
        makeCylinder(2.5, 2.5, 20, 10, 0x1A1A1A, rx - 80, 8, rz + 45);
        makeCone(2.5, 6, 8, 0x1A1A1A, rx - 89, 6, rz + 45);
        makeCylinder(1.5, 1.5, 12, 8, 0x2A2A2A, rx - 76, 14, rz + 45);
        // Wheels
        makeCylinder(2, 2, 0.8, 10, 0x333333, rx - 73, 2, rz + 43);
        makeCylinder(2, 2, 0.8, 10, 0x333333, rx - 73, 2, rz + 47);
        makeCylinder(2, 2, 0.8, 10, 0x333333, rx - 80, 2, rz + 43);
        makeCylinder(2, 2, 0.8, 10, 0x333333, rx - 80, 2, rz + 47);
        makeCylinder(2, 2, 0.8, 10, 0x333333, rx - 87, 2, rz + 43);
        makeCylinder(2, 2, 0.8, 10, 0x333333, rx - 87, 2, rz + 47);

        // Preserved steam engine 2
        makeBox(18, 5, 4, 0x8B0000, rx + 60, 6, rz + 55);
        makeCylinder(2.5, 2.5, 18, 10, 0x8B0000, rx + 60, 8, rz + 55);
        makeCone(2.5, 6, 8, 0x8B0000, rx + 51, 6, rz + 55);
        makeCylinder(1.2, 1.2, 10, 8, 0xCC0000, rx + 64, 13, rz + 55);

        // Railway tracks
        for (var ti = 0; ti < 4; ti++) {
            makeBox(200, 0.4, 0.5, 0x696969, rx, 0.2, rz - 15 + ti * 8);
        }

        // Administrative office
        makeBox(30, 14, 20, 0x9B7B4B, rx + 100, 7, rz + 30);
        makeBox(32, 2, 22, 0x6B4B2B, rx + 100, 14, rz + 30);

        // Perimeter brick wall
        makeBox(240, 6, 2, 0x8B4513, rx, 3, rz - 55);
        makeBox(2, 6, 160, 0x8B4513, rx - 120, 3, rz + 25);
        makeBox(2, 6, 160, 0x8B4513, rx + 120, 3, rz + 25);
    }

    function buildTownCentre() {
        var tx = 13320;
        var tz = 650;

        // The Point shopping centre - main block
        makeBox(80, 20, 50, 0xD2B48C, tx - 50, 10, tz);
        makeBox(82, 2, 52, 0xC8A882, tx - 50, 20, tz);
        // Modern glazed front
        makeBox(80, 18, 1, 0x87CEEB, tx - 50, 10, tz - 25.5);
        // Entrance canopy
        makeBox(30, 3, 10, 0xBBBBBB, tx - 50, 21, tz - 28);

        // Swan Centre
        makeBox(70, 18, 45, 0xC8C8C8, tx + 70, 9, tz - 10);
        makeBox(72, 2, 47, 0xAAAAAA, tx + 70, 18, tz - 10);
        makeBox(70, 16, 1, 0x87CEEB, tx + 70, 9, tz - 32.5);

        // Town Hall
        makeBox(40, 24, 30, 0xE8D5A0, tx - 20, 12, tz + 90);
        makeBox(42, 2, 32, 0xC8A060, tx - 20, 24, tz + 90);
        // Clock tower
        makeBox(10, 30, 10, 0xD4B870, tx - 20, 27, tz + 90);
        makeCone(6, 8, 4, 0x5C3317, tx - 20, 44, tz + 90);
        // Columns
        makeCylinder(1.2, 1.2, 24, 8, 0xF5F5DC, tx - 30, 12, tz + 76);
        makeCylinder(1.2, 1.2, 24, 8, 0xF5F5DC, tx - 20, 12, tz + 76);
        makeCylinder(1.2, 1.2, 24, 8, 0xF5F5DC, tx - 10, 12, tz + 76);

        // Market stalls area
        makeBox(60, 0.5, 40, 0x808070, tx + 30, 0.25, tz + 80);
        for (var si = 0; si < 4; si++) {
            for (var sj = 0; sj < 3; sj++) {
                makeBox(8, 4, 7, 0xFF6347, tx + 5 + si * 14, 2, tz + 70 + sj * 12);
                makeBox(10, 0.3, 9, 0xFF4500, tx + 5 + si * 14, 4, tz + 70 + sj * 12);
            }
        }

        // Shops along main street
        for (var shi = 0; shi < 6; shi++) {
            makeBox(12, 14, 15, 0xDEB887, tx - 100 + shi * 16, 7, tz + 50);
            makeBox(12, 2, 15, 0xC8A870, tx - 100 + shi * 16, 14, tz + 50);
            makeBox(8, 8, 1, 0x87CEEB, tx - 100 + shi * 16, 6, tz + 42.5);
        }

        // Street pavement / plaza
        makeBox(250, 0.5, 30, 0xC8C8B4, tx, 0.25, tz + 40);
        makeBox(250, 0.5, 30, 0xD0D0C0, tx, 0.25, tz - 35);

        // Street trees
        for (var stri = 0; stri < 8; stri++) {
            makeCylinder(0.4, 0.5, 6, 6, 0x8B4513, tx - 105 + stri * 30, 3, tz + 35);
            makeSphere(4, 8, 6, 0x228B22, tx - 105 + stri * 30, 8, tz + 35);
        }

        // Car park multi-storey
        makeBox(50, 24, 40, 0xC8C8C8, tx + 140, 12, tz + 20);
        makeBox(52, 1, 42, 0xAAAAAA, tx + 140, 8, tz + 20);
        makeBox(52, 1, 42, 0xAAAAAA, tx + 140, 16, tz + 20);
        makeBox(52, 1, 42, 0xAAAAAA, tx + 140, 24, tz + 20);

        // Pub / Wetherspoons type
        makeBox(25, 16, 18, 0xB8860B, tx - 110, 8, tz + 80);
        makeBox(27, 2, 20, 0x8B6914, tx - 110, 16, tz + 80);
        makeBox(24, 12, 1, 0x87CEEB, tx - 110, 8, tz + 71.5);
    }

    function buildLakesideCountryPark() {
        var lx = 13320;
        var lz = 950;

        // Lake - flat blue surface
        makeBox(180, 0.4, 120, 0x1E90FF, lx, 0.2, lz);

        // Lake shores / banks
        makeBox(200, 0.8, 8, 0x8B7355, lx, 0.4, lz - 64);
        makeBox(200, 0.8, 8, 0x8B7355, lx, 0.4, lz + 64);
        makeBox(8, 0.8, 140, 0x8B7355, lx - 94, 0.4, lz);
        makeBox(8, 0.8, 140, 0x8B7355, lx + 94, 0.4, lz);

        // Reedbed areas around lake edge
        for (var rri = 0; rri < 12; rri++) {
            makeCylinder(0.3, 0.3, 4, 5, 0xD2691E, lx - 85 + rri * 14, 2, lz - 60);
            makeSphere(1, 6, 4, 0x8B6914, lx - 85 + rri * 14, 5, lz - 60);
        }
        for (var rri2 = 0; rri2 < 10; rri2++) {
            makeCylinder(0.3, 0.3, 4, 5, 0xD2691E, lx - 85 + rri2 * 16, 2, lz + 60);
            makeSphere(1, 6, 4, 0x8B6914, lx - 85 + rri2 * 16, 5, lz + 60);
        }

        // Visitor centre building
        makeBox(30, 10, 20, 0x8B7355, lx - 100, 5, lz - 90);
        makeBox(32, 2, 22, 0x6B5335, lx - 100, 10, lz - 90);
        makeBox(28, 8, 1, 0x87CEEB, lx - 100, 5, lz - 79.5);
        // Green roof / living roof
        makeBox(30, 0.8, 20, 0x556B2F, lx - 100, 11, lz - 90);

        // Visitor car park
        makeBox(50, 0.4, 30, 0x606060, lx - 115, 0.2, lz - 120);

        // Picnic area - benches and tables
        for (var pi = 0; pi < 4; pi++) {
            makeBox(3, 0.4, 1.5, 0x8B4513, lx + 60 + pi * 15, 1, lz - 85);
            makeBox(4, 0.4, 1.5, 0x654321, lx + 60 + pi * 15, 0.8, lz - 87);
        }

        // Cycle path
        makeBox(300, 0.5, 3, 0xAA8844, lx, 0.25, lz + 75);

        // Footbridge over lake inlet
        makeBox(20, 1, 5, 0x8B4513, lx + 80, 2, lz + 20);
        makeBox(20, 3, 0.3, 0xA0522D, lx + 80, 2.5, lz + 22.5);
        makeBox(20, 3, 0.3, 0xA0522D, lx + 80, 2.5, lz + 17.5);

        // Trees around park perimeter
        for (var tri = 0; tri < 14; tri++) {
            makeCylinder(0.6, 0.8, 8, 6, 0x8B4513, lx - 110 + tri * 17, 4, lz + 80);
            makeSphere(5, 8, 6, 0x2E8B57, lx - 110 + tri * 17, 11, lz + 80);
        }
        for (var tri2 = 0; tri2 < 10; tri2++) {
            makeCylinder(0.6, 0.8, 7, 6, 0x8B4513, lx - 95 + tri2 * 20, 3.5, lz - 80);
            makeSphere(4.5, 8, 6, 0x228B22, lx - 95 + tri2 * 20, 10, lz - 80);
        }

        // Willow trees near water
        makeCylinder(0.5, 0.7, 10, 6, 0x5C4033, lx + 80, 5, lz - 50);
        makeSphere(7, 8, 6, 0x6B8E23, lx + 80, 12, lz - 50);
        makeCylinder(0.5, 0.7, 9, 6, 0x5C4033, lx - 70, 4.5, lz + 50);
        makeSphere(6, 8, 6, 0x556B2F, lx - 70, 11, lz + 50);

        // Information boards / signs
        makeBox(0.2, 3, 0.2, 0x8B4513, lx + 50, 1.5, lz - 68);
        makeBox(2, 1.5, 0.1, 0x228B22, lx + 50, 3.5, lz - 68);

        makeBox(0.2, 3, 0.2, 0x8B4513, lx - 50, 1.5, lz - 68);
        makeBox(2, 1.5, 0.1, 0x228B22, lx - 50, 3.5, lz - 68);

        // Pond dipping platform
        makeBox(12, 0.5, 8, 0x8B4513, lx + 88, 1, lz + 40);
        makeBox(12, 3, 0.3, 0xA0522D, lx + 88, 2, lz + 44);
    }

    function buildGroundPlane() {
        makeBox(800, 0.5, 1600, 0x5C7A3E, 13320, -0.25, 350);
    }

    function build() {
        buildGroundPlane();
        buildSupermarineWorks();
        buildSpitfireMemorial();
        buildSouthamptonAirport();
        buildRailwayWorks();
        buildTownCentre();
        buildLakesideCountryPark();
    }

    function update(delta) {
        // Static environment — no animation needed
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
