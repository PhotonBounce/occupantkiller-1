window.ReadingTown = (function() {
    'use strict';

    var scene = null;
    var camera = null;
    var objects = [];

    var OX = 12720;

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
        objects = [];
        build();
    }

    function addObj(mesh) {
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function makebox(w, h, d, color, x, y, z) {
        var geo = new THREE.BoxGeometry(w, h, d);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        return addObj(mesh);
    }

    function makecylinder(rt, rb, h, segs, color, x, y, z) {
        var geo = new THREE.CylinderGeometry(rt, rb, h, segs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        return addObj(mesh);
    }

    function makesphere(r, ws, hs, color, x, y, z) {
        var geo = new THREE.SphereGeometry(r, ws, hs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        return addObj(mesh);
    }

    function makecone(r, h, segs, color, x, y, z) {
        var geo = new THREE.ConeGeometry(r, h, segs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        return addObj(mesh);
    }

    function makeWireBox(w, h, d, color, x, y, z) {
        var geo = new THREE.BoxGeometry(w, h, d);
        var edges = new THREE.EdgesGeometry(geo);
        var mat = new THREE.LineBasicMaterial({ color: color });
        var lines = new THREE.LineSegments(edges, mat);
        lines.position.set(x, y, z);
        return addObj(lines);
    }

    // ── SELECT CAR LEASING STADIUM (Reading FC) ──────────────────────────
    // Position: OX + 200, Z = -400 (south of centre)
    function buildStadium() {
        var sx = OX + 200;
        var sz = -400;

        // Pitch (grass)
        makebox(105, 0.5, 68, 0x2d8a2d, sx, 0.25, sz);

        // Pitch markings (white lines outline)
        makeWireBox(105, 0.1, 68, 0xffffff, sx, 0.6, sz);

        // --- East Stand (large main stand, royal blue) ---
        makebox(110, 18, 16, 0x003087, sx, 9, sz + 42);
        // East Stand roof
        makebox(110, 1.5, 16, 0xcccccc, sx, 18.5, sz + 42);
        // Seating tier
        makebox(106, 6, 10, 0x003087, sx, 4, sz + 38);

        // --- West Stand ---
        makebox(110, 12, 12, 0x003087, sx, 6, sz - 42);
        makebox(110, 1, 12, 0xaaaaaa, sx, 12.3, sz - 42);
        makebox(106, 4, 8, 0x00308799, sx, 2.5, sz - 37);

        // --- North Stand ---
        makebox(14, 10, 72, 0x003087, sx + 60, 5, sz);
        makebox(14, 1, 72, 0xaaaaaa, sx + 60, 10.3, sz);

        // --- South Stand ---
        makebox(14, 10, 72, 0x003087, sx - 60, 5, sz);
        makebox(14, 1, 72, 0xaaaaaa, sx - 60, 10.3, sz);

        // Scoreboard (East Stand centre)
        makebox(12, 5, 1, 0x111111, sx, 22, sz + 42);

        // Royal blue seat colours in stands
        makebox(102, 3, 2, 0x0040c0, sx, 6, sz + 34);
        makebox(102, 3, 2, 0x0040c0, sx, 6, sz - 34);

        // Floodlight pylons — 4 corners
        var floodPositions = [
            [sx + 58, sz + 40],
            [sx - 58, sz + 40],
            [sx + 58, sz - 40],
            [sx - 58, sz - 40]
        ];
        for (var i = 0; i < floodPositions.length; i++) {
            var fp = floodPositions[i];
            // Pylon shaft
            makecylinder(0.4, 0.6, 22, 6, 0x999999, fp[0], 11, fp[1]);
            // Light cluster box
            makebox(4, 1.5, 4, 0xffffee, fp[0], 22.5, fp[1]);
        }

        // Stadium exterior walls / concourse
        makebox(120, 3, 2, 0xf0f0f0, sx, 1.5, sz + 51);
        makebox(120, 3, 2, 0xf0f0f0, sx, 1.5, sz - 51);
        makebox(2, 3, 80, 0xf0f0f0, sx + 68, 1.5, sz);
        makebox(2, 3, 80, 0xf0f0f0, sx - 68, 1.5, sz);

        // Club sign on East Stand
        makebox(20, 3, 0.5, 0x003087, sx, 14, sz + 51);
    }

    // ── READING ABBEY RUINS ──────────────────────────────────────────────
    // Position: OX - 100, Z = +200 (town centre area)
    function buildAbbey() {
        var ax = OX - 100;
        var az = 200;
        var flintColor = 0x7a7060;
        var archColor = 0x8a8070;

        // Ground footprint
        makebox(90, 0.3, 70, 0x6b5d3f, ax, 0.15, az);

        // North wall (partial, ruined)
        makebox(90, 8, 2, flintColor, ax, 4, az - 35);
        // Break in north wall
        makebox(15, 8, 2.2, 0x000000, ax + 20, 4, az - 35); // gap (black cutout)
        makebox(15, 8, 2.2, 0x000000, ax - 25, 4, az - 35);

        // South wall (partial)
        makebox(60, 6, 2, flintColor, ax - 15, 3, az + 35);

        // East wall (tall, main surviving fragment)
        makebox(2, 14, 70, flintColor, ax + 45, 7, az);
        // Arched window openings in east wall — tall narrow boxes removed by overlay
        makebox(2.5, 8, 5, archColor, ax + 45, 8, az - 15);
        makebox(2.5, 8, 5, archColor, ax + 45, 8, az + 15);
        // Arch tops — cones to suggest Gothic arches
        makecone(2.5, 3, 4, archColor, ax + 45, 13, az - 15);
        makecone(2.5, 3, 4, archColor, ax + 45, 13, az + 15);

        // West wall (short remnant)
        makebox(2, 6, 40, flintColor, ax - 45, 3, az);

        // Cloister outline — low walls
        makebox(30, 1.2, 1, flintColor, ax - 5, 0.6, az - 10);
        makebox(30, 1.2, 1, flintColor, ax - 5, 0.6, az + 10);
        makebox(1, 1.2, 20, flintColor, ax - 20, 0.6, az);
        makebox(1, 1.2, 20, flintColor, ax + 10, 0.6, az);

        // Rubble piles
        makebox(4, 1.5, 4, 0x6a5f50, ax + 30, 0.75, az + 20);
        makebox(3, 1, 3, 0x6a5f50, ax - 10, 0.5, az - 28);
        makebox(5, 1, 3, 0x6a5f50, ax + 15, 0.5, az + 30);

        // Grass within ruins
        makebox(85, 0.1, 65, 0x3a7a3a, ax, 0.4, az);

        // Henry I tomb marker slab
        makebox(5, 0.4, 3, 0x888888, ax, 0.55, az);
    }

    // ── FORBURY GARDENS + MAIWAND LION ──────────────────────────────────
    // Position: OX - 60, Z = +120
    function buildForbury() {
        var fx = OX - 60;
        var fz = 120;

        // Garden lawn
        makebox(80, 0.2, 60, 0x3e8c3e, fx, 0.1, fz);

        // Bandstand — circular roof (cylinder) on pillars
        makecylinder(8, 8, 0.5, 12, 0x228822, fx - 20, 4.5, fz);
        makecylinder(7, 7.5, 0.8, 12, 0x1a6e1a, fx - 20, 5.1, fz);
        // Pillars
        for (var i = 0; i < 8; i++) {
            var angle = (i / 8) * Math.PI * 2;
            var px = fx - 20 + Math.cos(angle) * 6;
            var pz = fz + Math.sin(angle) * 6;
            makecylinder(0.3, 0.3, 4, 6, 0xdddddd, px, 2, pz);
        }

        // Paths through garden
        makebox(80, 0.05, 3, 0xd4b896, fx, 0.2, fz);
        makebox(3, 0.05, 60, 0xd4b896, fx, 0.2, fz);

        // Flower beds
        makebox(8, 0.3, 6, 0xff4444, fx + 20, 0.3, fz + 15);
        makebox(8, 0.3, 6, 0xffaa00, fx + 20, 0.3, fz - 15);
        makebox(8, 0.3, 6, 0xff66aa, fx - 5, 0.3, fz + 20);

        // Trees (cylinders + cones)
        var treeSpots = [
            [fx + 30, fz + 20],
            [fx + 30, fz - 20],
            [fx - 30, fz + 25],
            [fx - 30, fz - 25],
            [fx + 10, fz + 28],
            [fx + 10, fz - 28]
        ];
        for (var t = 0; t < treeSpots.length; t++) {
            var tx = treeSpots[t][0];
            var tz = treeSpots[t][1];
            makecylinder(0.4, 0.5, 5, 6, 0x7a5230, tx, 2.5, tz);
            makecone(3, 6, 8, 0x2a6e2a, tx, 8, tz);
        }

        // Maiwand Lion Plinth
        makebox(6, 2, 4, 0x888880, fx + 5, 1, fz);
        makebox(5, 0.4, 3, 0x999990, fx + 5, 2.2, fz);

        // Lion body (elongated sphere)
        makesphere(1.8, 8, 6, 0x8b6914, fx + 5, 4, fz);
        // Lion head
        makesphere(1.2, 8, 6, 0x9a7520, fx + 5, 5, fz - 1.5);
        // Lion mane ring
        makecylinder(1.4, 1.4, 0.6, 10, 0x6b4a10, fx + 5, 5, fz - 1.5);
        // Front paws (boxes)
        makebox(0.8, 0.6, 1.5, 0x8b6914, fx + 5 + 1, 3.3, fz - 2.5);
        makebox(0.8, 0.6, 1.5, 0x8b6914, fx + 5 - 1, 3.3, fz - 2.5);
        // Tail (small cylinder curving up)
        makecylinder(0.3, 0.3, 2.5, 5, 0x8b6914, fx + 5, 4.5, fz + 2.8);

        // Perimeter railings (low fence posts)
        for (var r = 0; r < 10; r++) {
            makebox(0.3, 1.2, 0.3, 0x222222, fx - 38 + r * 8, 0.6, fz + 31);
            makebox(0.3, 1.2, 0.3, 0x222222, fx - 38 + r * 8, 0.6, fz - 31);
        }
        for (var r2 = 0; r2 < 8; r2++) {
            makebox(0.3, 1.2, 0.3, 0x222222, fx - 40, 0.6, fz - 28 + r2 * 8);
            makebox(0.3, 1.2, 0.3, 0x222222, fx + 40, 0.6, fz - 28 + r2 * 8);
        }
    }

    // ── THE ORACLE SHOPPING CENTRE ───────────────────────────────────────
    // Position: OX + 80, Z = +80
    function buildOracle() {
        var ox2 = OX + 80;
        var oz = 80;

        // Main mall building (glass-fronted — light blue)
        makebox(100, 14, 50, 0x5588aa, ox2, 7, oz);
        // Glass facade front
        makebox(100, 14, 1, 0x88bbdd, ox2, 7, oz - 25.5);
        // Roof parapet
        makebox(102, 1, 52, 0xdddddd, ox2, 14.5, oz);

        // Upper level walkway
        makebox(90, 0.5, 8, 0xcccccc, ox2, 9, oz);

        // Cinema block (taller section, NW corner)
        makebox(30, 20, 25, 0x334455, ox2 - 35, 10, oz - 12);
        // Cinema signage strip
        makebox(30, 3, 1, 0xff4400, ox2 - 35, 18, oz - 24);

        // Riverside restaurant terrace (south edge, over River Kennet)
        makebox(60, 0.5, 15, 0xccaa88, ox2, 1, oz + 35);
        // Terrace railings
        for (var i = 0; i < 8; i++) {
            makebox(0.3, 1.5, 0.3, 0x888888, ox2 - 28 + i * 8, 1.8, oz + 42);
        }
        // Restaurant awnings
        makebox(25, 0.3, 8, 0xdd3333, ox2 - 15, 5, oz + 32);
        makebox(25, 0.3, 8, 0xdd3333, ox2 + 15, 5, oz + 32);

        // Shop entrances (recessed glass boxes)
        for (var s = 0; s < 4; s++) {
            makebox(10, 10, 3, 0x99bbcc, ox2 - 37 + s * 25, 5, oz - 27);
        }

        // Connecting bridge to car park
        makebox(20, 0.5, 4, 0xaaaaaa, ox2 + 58, 8, oz);
        // Car park block
        makebox(30, 16, 40, 0x999999, ox2 + 73, 8, oz);
        // Car park deck slots
        for (var d = 0; d < 4; d++) {
            makebox(30, 0.3, 38, 0x888888, ox2 + 73, 3 + d * 3.5, oz);
        }

        // River Kennet (blue strip south of Oracle)
        makebox(160, 0.3, 18, 0x2255aa, ox2 - 10, 0.1, oz + 48);
    }

    // ── RIVERS KENNET AND THAMES CONFLUENCE ─────────────────────────────
    // Position: OX + 50, Z = +300
    function buildRivers() {
        var rx = OX + 50;
        var rz = 300;

        // River Thames (wide, east-west)
        makebox(400, 0.4, 40, 0x1a4a8a, rx, 0.0, rz);
        // River Kennet (narrower, south tributary)
        makebox(20, 0.4, 200, 0x2255aa, rx - 80, 0.0, rz - 150);

        // Confluence area (slightly wider)
        makebox(60, 0.4, 60, 0x1a4a8a, rx - 70, 0.0, rz);

        // Canal lock gates (wooden beams)
        makebox(1.5, 2, 14, 0x5a3a1a, rx - 100, 1, rz - 60);
        makebox(1.5, 2, 14, 0x5a3a1a, rx - 98, 1, rz - 60);
        // Lock chamber walls
        makebox(2, 3, 20, 0x888888, rx - 93, 1.5, rz - 60);
        makebox(2, 3, 20, 0x888888, rx - 107, 1.5, rz - 60);
        // Lock gate bottom
        makebox(1.5, 2, 14, 0x5a3a1a, rx - 100, 1, rz - 80);

        // Narrowboats (2)
        makebox(15, 2, 3.5, 0xcc2200, rx - 120, 1.5, rz - 70);
        makebox(3, 1.5, 3, 0x004400, rx - 120, 3, rz - 70);
        makebox(15, 2, 3.5, 0x0033cc, rx - 60, 1.5, rz - 90);
        makebox(3, 1.5, 3, 0xcc6600, rx - 60, 3, rz - 90);

        // Pedestrian footbridge over Kennet
        makebox(25, 0.5, 3, 0xbbbbbb, rx - 80, 3.5, rz - 120);
        // Bridge handrails
        makebox(25, 1, 0.2, 0x888888, rx - 80, 4.2, rz - 118.5);
        makebox(25, 1, 0.2, 0x888888, rx - 80, 4.2, rz - 121.5);
        // Bridge supports
        makecylinder(0.5, 0.5, 3.5, 6, 0x999999, rx - 90, 1.75, rz - 120);
        makecylinder(0.5, 0.5, 3.5, 6, 0x999999, rx - 70, 1.75, rz - 120);

        // Thames riverside path
        makebox(400, 0.2, 5, 0xc8a870, rx, 0.4, rz - 25);

        // Riverside trees along Thames
        for (var i = 0; i < 8; i++) {
            var tx = rx - 180 + i * 52;
            makecylinder(0.4, 0.5, 5, 6, 0x5a3a1a, tx, 2.5, rz - 28);
            makecone(3, 5, 8, 0x2a6e2a, tx, 8, rz - 28);
        }

        // Caversham Bridge (road bridge over Thames)
        makebox(60, 2, 12, 0x999999, rx + 100, 2, rz);
        makecylinder(2, 2, 6, 8, 0x888888, rx + 80, 3, rz);
        makecylinder(2, 2, 6, 8, 0x888888, rx + 120, 3, rz);
    }

    // ── TOWN CENTRE — MARKET PLACE / BROAD STREET ───────────────────────
    // Position: OX, Z = 0
    function buildTownCentre() {
        var tx = OX;
        var tz = 0;

        // Ground plane / paved area
        makebox(180, 0.2, 120, 0xc8c0b0, tx, 0.1, tz);

        // Broad Street pedestrianised (lighter paving)
        makebox(160, 0.25, 20, 0xddd8cc, tx, 0.2, tz);

        // Market Place open square
        makebox(50, 0.3, 50, 0xbbaa99, tx - 40, 0.2, tz + 40);

        // Market stalls
        for (var m = 0; m < 3; m++) {
            makebox(8, 2.5, 4, 0xcc3333, tx - 55 + m * 12, 1.25, tz + 38);
            makebox(8, 0.3, 4, 0xdd4444, tx - 55 + m * 12, 2.6, tz + 38);
        }

        // Civic Centre Tower (tall office block)
        makebox(22, 55, 22, 0x778899, tx + 70, 27.5, tz - 40);
        // Tower windows (dark glass facade)
        makebox(20, 55, 1, 0x445566, tx + 70, 27.5, tz - 51.5);
        makebox(20, 55, 1, 0x445566, tx + 70, 27.5, tz - 28.5);
        makebox(1, 55, 20, 0x445566, tx + 59, 27.5, tz - 40);
        makebox(1, 55, 20, 0x445566, tx + 81, 27.5, tz - 40);
        // Tower roof plant
        makebox(18, 3, 18, 0x666677, tx + 70, 56.5, tz - 40);
        // Civic flag mast
        makecylinder(0.2, 0.2, 8, 4, 0xaaaaaa, tx + 70, 62, tz - 40);
        makebox(3, 2, 0.2, 0xcc0000, tx + 71.5, 64, tz - 40);

        // Secondary office blocks
        makebox(25, 20, 18, 0x8899aa, tx + 30, 10, tz - 45);
        makebox(18, 15, 20, 0x7788aa, tx - 20, 7.5, tz - 50);

        // Shops along Broad Street
        var shopColors = [
            0xee9944, 0x4499ee, 0xee4444, 0x44aa44,
            0xeeee44, 0xaa44ee, 0xee7744, 0x44eeee
        ];
        for (var sh = 0; sh < 8; sh++) {
            makebox(15, 8, 12, shopColors[sh], tx - 80 + sh * 20, 4, tz + 16);
            makebox(13, 0.4, 6, 0xffffff, tx - 80 + sh * 20, 8.3, tz + 14);
        }
        for (var sh2 = 0; sh2 < 8; sh2++) {
            makebox(15, 8, 12, shopColors[(sh2 + 3) % 8], tx - 80 + sh2 * 20, 4, tz - 16);
        }

        // Oracle entrance arch
        makebox(20, 10, 2, 0x5588aa, tx + 40, 5, tz + 10);
        makecylinder(0.8, 0.8, 10, 6, 0x5588aa, tx + 30, 5, tz + 10);
        makecylinder(0.8, 0.8, 10, 6, 0x5588aa, tx + 50, 5, tz + 10);

        // Street lamps
        for (var l = 0; l < 8; l++) {
            makecylinder(0.2, 0.2, 6, 5, 0x888888, tx - 70 + l * 20, 3, tz + 11);
            makesphere(0.5, 5, 5, 0xffffcc, tx - 70 + l * 20, 6.3, tz + 11);
        }

        // Town hall / Reading Museum building
        makebox(40, 16, 30, 0xc8a84a, tx - 60, 8, tz - 50);
        // Museum columns (4)
        for (var c = 0; c < 4; c++) {
            makecylinder(1, 1, 14, 8, 0xddcc88, tx - 75 + c * 10, 7, tz - 35);
        }
        // Pediment roof
        makebox(42, 2, 1, 0xc8a84a, tx - 60, 17, tz - 35);

        // Blagrave Street area (small blocks)
        makebox(20, 10, 15, 0xaaaaaa, tx - 80, 5, tz - 20);
        makebox(18, 12, 12, 0x999999, tx - 80, 6, tz + 50);
    }

    // ── MAIN BUILD FUNCTION ──────────────────────────────────────────────
    function build() {
        buildStadium();
        buildAbbey();
        buildForbury();
        buildOracle();
        buildRivers();
        buildTownCentre();
    }

    function update(delta) {
        // Static environment — no per-frame updates required
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
