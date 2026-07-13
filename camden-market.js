window.CamdenMarket = (function() {
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

    function makeMaterial(color) {
        return new THREE.MeshLambertMaterial({ color: color });
    }

    function makeBox(w, h, d, color, x, y, z) {
        var geo = new THREE.BoxGeometry(w, h, d);
        var mat = makeMaterial(color);
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        return addMesh(mesh);
    }

    function makeCylinder(rt, rb, h, segs, color, x, y, z) {
        var geo = new THREE.CylinderGeometry(rt, rb, h, segs);
        var mat = makeMaterial(color);
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        return addMesh(mesh);
    }

    function makeCone(r, h, segs, color, x, y, z) {
        var geo = new THREE.ConeGeometry(r, h, segs);
        var mat = makeMaterial(color);
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        return addMesh(mesh);
    }

    function makeSphere(r, ws, hs, color, x, y, z) {
        var geo = new THREE.SphereGeometry(r, ws, hs);
        var mat = makeMaterial(color);
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        return addMesh(mesh);
    }

    function buildGround() {
        // Ground plane for the Camden area
        makeBox(2400, 2, 2400, 0x555544, 12000, -1, 0);
    }

    function buildStablesMarket() {
        // Victorian horse stables converted to market — low brick arched buildings
        var bx = 12000;
        var bz = -200;

        // Main stables block — long low brick building
        makeBox(600, 60, 120, 0x8B4513, bx, 30, bz);
        // Roof
        makeBox(610, 8, 130, 0x6B3410, bx, 62, bz);

        // Arched supports along the front (simulated with cylinders)
        var archCount = 10;
        for (var i = 0; i < archCount; i++) {
            var ax = bx - 270 + i * 60;
            // Arch column left
            makeCylinder(6, 6, 55, 8, 0x8B4513, ax - 18, 27, bz - 62);
            // Arch column right
            makeCylinder(6, 6, 55, 8, 0x8B4513, ax + 18, 27, bz - 62);
            // Arch top crossbeam
            makeBox(40, 8, 8, 0x7A3B0F, ax, 56, bz - 62);
        }

        // Second stables block perpendicular
        makeBox(120, 55, 400, 0x8B4513, bx + 360, 27, bz + 100);
        makeBox(130, 8, 410, 0x6B3410, bx + 360, 57, bz + 100);

        // Stall vendor booths inside stables
        var stallColors = [
            0xCC3333, 0x3399CC, 0x33CC66, 0xFF9900,
            0x9933CC, 0xFF3399, 0x66CC33, 0xCC9933
        ];
        for (var s = 0; s < 8; s++) {
            var sx = bx - 210 + s * 60;
            makeBox(50, 35, 50, stallColors[s], sx, 17, bz - 10);
            // Stall awning
            makeBox(55, 4, 20, stallColors[(s + 1) % 8], sx, 37, bz - 28);
        }

        // Third wing
        makeBox(500, 55, 100, 0x9B5523, bx - 50, 27, bz + 260);
        makeBox(510, 8, 110, 0x7A3E16, bx - 50, 57, bz + 260);
    }

    function buildLockMarket() {
        // Canal-side Lock Market stalls
        var lx = 12000;
        var lz = 150;

        // Market building — long shed structure
        makeBox(500, 50, 80, 0x777766, lx, 25, lz);
        makeBox(510, 6, 90, 0x888877, lx, 52, lz);

        // Colourful vendor stalls along canal
        var colors = [
            0xDD4422, 0x22AA44, 0x4466DD, 0xDDCC22,
            0xAA22AA, 0x22CCCC, 0xDD7722, 0x778833
        ];
        for (var i = 0; i < 12; i++) {
            var sx = lx - 300 + i * 52;
            makeBox(45, 30, 40, colors[i % 8], sx, 15, lz + 65);
            // Awning
            makeBox(50, 3, 18, colors[(i + 2) % 8], sx, 32, lz + 74);
            // Display goods (small box)
            makeBox(20, 8, 15, colors[(i + 4) % 8], sx, 10, lz + 72);
        }

        // Connecting walkway roof
        makeBox(620, 5, 30, 0x888877, lx, 35, lz + 58);
    }

    function buildInvernessStreetMarket() {
        // Inverness Street outdoor market
        var ix = 11700;
        var iz = 400;

        // Street stalls — open-air
        for (var row = 0; row < 2; row++) {
            for (var col = 0; col < 8; col++) {
                var sx = ix + col * 55 - 190;
                var sz = iz + row * 70;
                var c = (row * 8 + col) % 8;
                var sc = [0xDD3333, 0x3366CC, 0x33BB55, 0xEEAA00,
                           0x9944AA, 0xFF4488, 0x55CC44, 0xBB8822][c];
                // Stall base
                makeBox(48, 25, 48, sc, sx, 12, sz);
                // Stall roof
                makeBox(55, 3, 55, 0xBBBBBB, sx, 27, sz);
                // Stall pole
                makeCylinder(2, 2, 28, 6, 0x888888, sx - 22, 14, sz - 22);
                makeCylinder(2, 2, 28, 6, 0x888888, sx + 22, 14, sz + 22);
            }
        }
    }

    function buildRegentsCanal() {
        // Canal water channel
        makeBox(1200, 4, 80, 0x1A5276, 12000, -2, 350);

        // Canal banks (towpath)
        makeBox(1200, 6, 25, 0x999977, 12000, 0, 393);
        makeBox(1200, 6, 25, 0x999977, 12000, 0, 307);

        // Lock walls — double lock
        // Upper lock chamber left wall
        makeBox(8, 40, 160, 0x8B7355, 11960, 20, 330);
        // Upper lock chamber right wall
        makeBox(8, 40, 160, 0x8B7355, 12040, 20, 330);

        // Lower lock chamber left wall
        makeBox(8, 40, 160, 0x8B7355, 11960, 20, 480);
        // Lower lock chamber right wall
        makeBox(8, 40, 160, 0x8B7355, 12040, 20, 480);

        // Lock gate upper — left leaf
        makeBox(38, 36, 6, 0x4A3728, 11982, 18, 260);
        // Lock gate upper — right leaf
        makeBox(38, 36, 6, 0x4A3728, 12018, 18, 260);

        // Lock gate middle — left leaf
        makeBox(38, 36, 6, 0x4A3728, 11982, 18, 410);
        // Lock gate middle — right leaf
        makeBox(38, 36, 6, 0x4A3728, 12018, 18, 410);

        // Lock gate lower — left leaf
        makeBox(38, 36, 6, 0x4A3728, 11982, 18, 560);
        // Lock gate lower — right leaf
        makeBox(38, 36, 6, 0x4A3728, 12018, 18, 560);

        // Lock gate balance beams (horizontal arms)
        makeBox(50, 5, 5, 0x5B4535, 11950, 35, 260);
        makeBox(50, 5, 5, 0x5B4535, 12050, 35, 260);
        makeBox(50, 5, 5, 0x5B4535, 11950, 35, 410);
        makeBox(50, 5, 5, 0x5B4535, 12050, 35, 410);

        // Lock keeper's cottage — beside the lock
        // Walls
        makeBox(70, 50, 60, 0xCC9966, 12120, 25, 340);
        // Roof
        makeBox(75, 20, 65, 0x884422, 12120, 60, 340);
        // Chimney
        makeCylinder(5, 5, 25, 8, 0x884422, 12130, 82, 335);
        // Door
        makeBox(12, 20, 4, 0x553311, 12120, 10, 310);
        // Windows
        makeBox(12, 12, 4, 0xCCDDEE, 12100, 30, 310);
        makeBox(12, 12, 4, 0xCCDDEE, 12140, 30, 310);

        // Narrowboats trapped between lock gates
        // Boat 1
        makeBox(20, 14, 100, 0xCC3322, 11990, 4, 335);
        // Boat cabin
        makeBox(16, 12, 55, 0xAA2211, 11990, 13, 315);
        // Boat 2
        makeBox(20, 14, 100, 0x2255AA, 12010, 4, 335);
        makeBox(16, 12, 55, 0x1A4499, 12010, 13, 315);

        // Canal side mooring posts
        for (var i = 0; i < 6; i++) {
            makeCylinder(3, 3, 20, 6, 0x333322, 11955, 10, 270 + i * 30);
            makeCylinder(3, 3, 20, 6, 0x333322, 12045, 10, 270 + i * 30);
        }

        // Water in lock chambers (darker water)
        makeBox(76, 3, 145, 0x0D3B4F, 12000, -1, 335);
        makeBox(76, 3, 145, 0x0D3B4F, 12000, -1, 485);
    }

    function buildRoundhouse() {
        // Roundhouse — iconic 1847 engine shed, circular drum building
        var rx = 11700;
        var rz = -400;

        // Main circular drum — brick exterior
        makeCylinder(130, 130, 90, 24, 0x8B4513, rx, 45, rz);

        // Inner drum (lighter interior visible through openings)
        makeCylinder(118, 118, 88, 24, 0x9B5523, rx, 45, rz);

        // Conical roof
        makeCone(135, 60, 24, 0x553322, rx, 105, rz);

        // Roof skylight dome at apex
        makeCylinder(20, 20, 15, 16, 0xAAAA88, rx, 138, rz);
        makeCone(22, 20, 16, 0x887766, rx, 155, rz);

        // Entrance portico
        makeBox(55, 75, 30, 0x7A3B0F, rx, 37, rz - 133);
        // Portico roof
        makeBox(60, 8, 35, 0x553311, rx, 77, rz - 133);
        // Entrance arch
        makeCylinder(22, 22, 8, 12, 0x7A3B0F, rx, 70, rz - 134);
        // Door
        makeBox(20, 45, 5, 0x332211, rx, 22, rz - 149);

        // Signage slab above entrance
        makeBox(60, 12, 4, 0x222222, rx, 80, rz - 150);

        // Perimeter low wall / plinth
        makeCylinder(145, 145, 10, 24, 0x7A6A5A, rx, 5, rz);

        // Small annex building
        makeBox(70, 35, 50, 0x8B4513, rx + 155, 17, rz - 30);
        makeBox(75, 6, 55, 0x6B3410, rx + 155, 37, rz - 30);
    }

    function buildCamdenHighStreet() {
        // Camden High Street — alternative shops
        var hx = 12200;
        var hz = -50;

        // Row of shopfronts on one side
        var shopColors = [
            0x222222, 0x441188, 0x882211, 0x114422,
            0x334455, 0x553300, 0x112244, 0x443300
        ];
        for (var i = 0; i < 8; i++) {
            var sx = hx;
            var sz = hz + i * 85 - 280;
            // Shop body
            makeBox(50, 55, 75, shopColors[i], sx, 27, sz);
            // Shop fascia
            makeBox(52, 12, 5, shopColors[(i + 3) % 8], sx, 57, sz - 38);
            // Shop window
            makeBox(35, 28, 4, 0xCCDDFF, sx, 22, sz - 38);
            // Door
            makeBox(14, 32, 4, 0x554433, sx, 16, sz - 38);
        }

        // Giant boot above shoe shop — iconic Camden landmark
        // Boot sole
        makeBox(40, 8, 60, 0x221100, hx, 80, hz - 100);
        // Boot body
        makeBox(32, 45, 40, 0x331100, hx, 108, hz - 88);
        // Boot toe
        makeBox(38, 14, 22, 0x221100, hx, 80, hz - 128);
        // Boot ankle/leg
        makeBox(22, 40, 28, 0x331100, hx - 2, 135, hz - 88);
        // Boot top rim
        makeBox(26, 6, 32, 0x442200, hx - 2, 157, hz - 88);

        // Giant guitar on music shop facade
        var gx = hx;
        var gz = hz + 150;
        // Guitar body lower bout
        makeSphere(28, 10, 8, 0xCC8822, gx, 95, gz - 38);
        // Guitar body upper bout
        makeSphere(20, 10, 8, 0xCC8822, gx, 130, gz - 38);
        // Guitar neck
        makeBox(8, 80, 5, 0x885511, gx, 185, gz - 38);
        // Guitar headstock
        makeBox(14, 20, 5, 0x885511, gx, 235, gz - 38);
        // Guitar strings (thin cylinders)
        for (var s = 0; s < 4; s++) {
            makeCylinder(1, 1, 160, 4, 0xCCCCCC, gx - 3 + s * 2, 155, gz - 38);
        }

        // Punk fashion store — dark storefront
        makeBox(55, 60, 70, 0x111111, hx, 30, hz + 280);
        makeBox(57, 14, 5, 0xCC0000, hx, 62, hz + 245);
        // Spiky decoration on facade
        for (var p = 0; p < 6; p++) {
            makeCone(4, 18, 4, 0xCC0000, hx - 18 + p * 7, 72, hz + 245);
        }
        makeBox(30, 30, 4, 0x220011, hx, 22, hz + 245);

        // Goth shop — dark purple
        makeBox(55, 60, 70, 0x220033, hx, 30, hz + 360);
        makeBox(57, 12, 5, 0x440066, hx, 62, hz + 325);
        makeBox(30, 30, 4, 0x110022, hx, 22, hz + 325);

        // Opposite side of street — more shops
        var ox = hx - 120;
        for (var j = 0; j < 6; j++) {
            var jz = hz + j * 90 - 200;
            var jc = shopColors[(j + 4) % 8];
            makeBox(50, 55, 80, jc, ox, 27, jz);
            makeBox(52, 12, 5, shopColors[(j + 1) % 8], ox, 57, jz + 42);
            makeBox(35, 28, 4, 0xCCDDFF, ox, 22, jz + 42);
            makeBox(14, 32, 4, 0x554433, ox, 16, jz + 42);
        }

        // Street pavement / road
        makeBox(120, 2, 900, 0x888877, hx - 60, 0, hz + 80);
    }

    function buildElectricBallroom() {
        // Electric Ballroom — art deco cinema-style music venue
        var ex = 12300;
        var ez = -150;

        // Main building body
        makeBox(120, 80, 70, 0x2A2A2A, ex, 40, ez);

        // Art deco stepped facade
        makeBox(130, 90, 8, 0x333333, ex, 45, ez - 39);
        makeBox(120, 85, 8, 0x3A3A3A, ex, 42, ez - 42);
        makeBox(108, 78, 8, 0x444444, ex, 39, ez - 45);

        // Stepped parapet top
        makeBox(132, 12, 12, 0x2A2A2A, ex, 92, ez - 38);
        makeBox(120, 18, 12, 0x333333, ex, 98, ez - 38);
        makeBox(100, 12, 12, 0x3A3A3A, ex, 108, ez - 38);

        // Art deco vertical fins on facade
        for (var f = 0; f < 5; f++) {
            makeBox(6, 60, 5, 0x555555, ex - 40 + f * 20, 60, ez - 45);
        }

        // Entrance canopy
        makeBox(90, 6, 30, 0x222222, ex, 18, ez - 55);
        // Canopy supports
        makeCylinder(3, 3, 18, 6, 0x444444, ex - 35, 9, ez - 60);
        makeCylinder(3, 3, 18, 6, 0x444444, ex + 35, 9, ez - 60);

        // Large entrance doors
        makeBox(28, 35, 4, 0x111111, ex - 20, 17, ez - 44);
        makeBox(28, 35, 4, 0x111111, ex + 20, 17, ez - 44);

        // Upper windows — art deco style
        for (var w = 0; w < 4; w++) {
            makeBox(14, 24, 4, 0x334455, ex - 40 + w * 28, 55, ez - 44);
        }

        // Neon sign slab
        makeBox(100, 16, 4, 0x111111, ex, 75, ez - 45);

        // Rooftop equipment boxes
        makeBox(30, 12, 25, 0x1A1A1A, ex - 30, 92, ez + 10);
        makeBox(20, 10, 20, 0x1A1A1A, ex + 30, 90, ez + 5);

        // Side alley wall
        makeBox(5, 75, 70, 0x2A2A2A, ex + 62, 37, ez);
        makeBox(5, 75, 70, 0x2A2A2A, ex - 62, 37, ez);
    }

    function buildCanalBridges() {
        // Road bridge over Regent's Canal
        makeBox(100, 14, 25, 0x999988, 12000, 6, 350);
        // Bridge parapets
        makeBox(100, 10, 4, 0x888877, 12000, 12, 338);
        makeBox(100, 10, 4, 0x888877, 12000, 12, 362);
        // Bridge support arch
        makeCylinder(30, 30, 14, 8, 0x888877, 12000, -6, 350);

        // Footbridge further along
        makeBox(80, 8, 18, 0xAAA999, 12080, 5, 480);
        makeBox(80, 6, 3, 0x999888, 12080, 9, 471);
        makeBox(80, 6, 3, 0x999888, 12080, 9, 489);
    }

    function buildCamdenTownStation() {
        // Camden Town Underground station
        var tx = 12280;
        var tz = 100;

        // Station building
        makeBox(80, 55, 60, 0x993311, tx, 27, tz);
        // Station frontage
        makeBox(85, 58, 5, 0x882200, tx, 29, tz - 32);

        // Classic roundel frame
        makeCylinder(22, 22, 5, 20, 0xCC2200, tx, 55, tz - 36);
        makeCylinder(16, 16, 5, 20, 0x003399, tx, 55, tz - 38);
        // Roundel crossbar
        makeBox(44, 10, 5, 0x003399, tx, 55, tz - 37);

        // Station entrance arch
        makeCylinder(25, 25, 5, 12, 0x882200, tx, 22, tz - 35);
        // Entrance door
        makeBox(20, 30, 4, 0x221100, tx, 15, tz - 35);

        // Station roof
        makeBox(82, 8, 62, 0x771100, tx, 57, tz);
    }

    function buildStreetFurniture() {
        // Lamp posts along high street
        for (var i = 0; i < 12; i++) {
            var lz = -300 + i * 60;
            makeCylinder(2, 2, 50, 6, 0x444444, 12160, 25, lz);
            makeSphere(5, 8, 6, 0xFFEECC, 12160, 52, lz);
            makeCylinder(2, 2, 50, 6, 0x444444, 12240, 25, lz);
            makeSphere(5, 8, 6, 0xFFEECC, 12240, 52, lz);
        }

        // Rubbish bins
        for (var b = 0; b < 8; b++) {
            makeCylinder(5, 4, 12, 8, 0x336633, 12165 + (b % 2) * 70, 6, -250 + b * 80);
        }

        // Market umbrellas / sunshades
        for (var u = 0; u < 5; u++) {
            makeCylinder(1, 1, 40, 6, 0x888888, 11870 + u * 60, 20, 420);
            makeCone(36, 15, 8, 0xCC6622, 11870 + u * 60, 47, 420);
        }

        // Signage pillars
        makeCylinder(8, 8, 60, 8, 0x333333, 12005, 30, -5);
        makeBox(30, 14, 4, 0xCC0000, 12005, 62, -5);

        makeCylinder(8, 8, 60, 8, 0x333333, 11800, 30, 50);
        makeBox(35, 14, 4, 0x0033CC, 11800, 62, 50);
    }

    function buildDecorativeDetails() {
        // Graffiti wall sections (colourful box panels on wall surfaces)
        for (var g = 0; g < 10; g++) {
            makeBox(50, 30, 3, [
                0xEE2222, 0x2222EE, 0x22EE22, 0xEEEE22,
                0xEE22EE, 0x22EEEE, 0xFF8800, 0x8800FF,
                0xFF0088, 0x00FF88
            ][g], 12140, 20 + (g % 3) * 15, -350 + g * 65);
        }

        // Camden-style colourful columns/totem poles
        var totemColors = [0xDD2222, 0x2222DD, 0x22DD22, 0xDDDD22, 0xDD22DD];
        for (var t = 0; t < 3; t++) {
            var tx2 = 11850 + t * 80;
            for (var ts = 0; ts < 5; ts++) {
                makeCylinder(5, 5, 14, 6, totemColors[ts], tx2, 7 + ts * 15, -50);
            }
        }

        // Decorative sphere clusters (colourful market decorations)
        for (var d = 0; d < 8; d++) {
            makeSphere(6, 8, 6, [
                0xFF4444, 0x44FF44, 0x4444FF, 0xFFFF44,
                0xFF44FF, 0x44FFFF, 0xFF8844, 0x44FF88
            ][d], 12000 - 180 + d * 52, 55, 160);
        }
    }

    function build() {
        buildGround();
        buildStablesMarket();
        buildLockMarket();
        buildInvernessStreetMarket();
        buildRegentsCanal();
        buildRoundhouse();
        buildCamdenHighStreet();
        buildElectricBallroom();
        buildCanalBridges();
        buildCamdenTownStation();
        buildStreetFurniture();
        buildDecorativeDetails();
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
