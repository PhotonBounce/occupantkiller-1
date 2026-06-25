window.ViennaSchonbrunn = (function() {
    'use strict';

    var scene = null;
    var camera = null;
    var objects = [];

    var OX = 22720;
    var OY = 0;
    var OZ = 0;

    function makeMesh(geo, color, x, y, z) {
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(OX + x, OY + y, OZ + z);
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function makeBox(w, h, d, color, x, y, z) {
        return makeMesh(new THREE.BoxGeometry(w, h, d), color, x, y, z);
    }

    function makeCyl(rt, rb, h, segs, color, x, y, z) {
        return makeMesh(new THREE.CylinderGeometry(rt, rb, h, segs), color, x, y, z);
    }

    function makeSph(r, ws, hs, color, x, y, z) {
        return makeMesh(new THREE.SphereGeometry(r, ws, hs), color, x, y, z);
    }

    function makeCone(r, h, segs, color, x, y, z) {
        return makeMesh(new THREE.ConeGeometry(r, h, segs), color, x, y, z);
    }

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
        objects = [];
        build();
    }

    function build() {
        buildGround();
        buildSchonbrunn();
        buildStephansDom();
        buildRingstrasse();
        buildBelvedere();
        buildDanube();
        buildSpanishRidingSchool();
        buildKarlskirche();
        buildStateOpera();
        buildPraterFerrisWheel();
    }

    // Ground plane built from boxes
    function buildGround() {
        // Main ground
        makeBox(2000, 2, 2000, 0x567D46, 0, -1, 0);
        // Road surfaces
        makeBox(1800, 1, 40, 0x444444, 0, 0, 0);
        makeBox(40, 1, 1800, 0x444444, 0, 0, 0);
    }

    // =============================================
    // SCHONBRUNN PALACE
    // =============================================
    function buildSchonbrunn() {
        var px = -400;
        var pz = -300;
        var palaceColor = 0xF5D080;
        var roofColor = 0x5B7A3A;
        var windowColor = 0x8AB4CF;

        // Main central pavilion - tall central block
        makeBox(80, 40, 50, palaceColor, px, 20, pz);
        // Central pavilion roof
        makeBox(82, 8, 52, roofColor, px, 44, pz);
        // Central pavilion pediment
        makeBox(60, 12, 6, palaceColor, px, 48, pz - 25);

        // Left wing
        makeBox(160, 32, 45, palaceColor, px - 120, 16, pz);
        makeBox(162, 6, 47, roofColor, px - 120, 35, pz);

        // Right wing
        makeBox(160, 32, 45, palaceColor, px + 120, 16, pz);
        makeBox(162, 6, 47, roofColor, px + 120, 35, pz);

        // Far left end pavilion
        makeBox(30, 36, 48, palaceColor, px - 215, 18, pz);
        makeBox(32, 7, 50, roofColor, px - 215, 38, pz);

        // Far right end pavilion
        makeBox(30, 36, 48, palaceColor, px + 215, 18, pz);
        makeBox(32, 7, 50, roofColor, px + 215, 38, pz);

        // Window rows on main facade - decorative boxes
        for (var i = -3; i <= 3; i++) {
            makeBox(8, 12, 3, windowColor, px + i * 10, 24, pz - 26);
            makeBox(8, 12, 3, windowColor, px + i * 10, 10, pz - 26);
        }
        for (var j = -7; j <= 7; j++) {
            makeBox(7, 10, 3, windowColor, px - 120 + j * 10, 20, pz - 24);
            makeBox(7, 10, 3, windowColor, px + 120 + j * 10, 20, pz - 24);
        }

        // Columns on central pavilion
        for (var c = -3; c <= 3; c++) {
            makeCyl(1.2, 1.2, 36, 8, 0xE8C86A, px + c * 10, 18, pz - 24);
        }

        // Courtyard / forecourt
        makeBox(400, 1, 120, 0xCCBB88, px, 0.5, pz + 90);

        // Garden parterre in front
        makeBox(350, 1, 200, 0x4A7C3F, px, 0.5, pz + 260);
        // Garden path strips
        makeBox(350, 1.5, 10, 0xCCBB88, px, 0.5, pz + 200);
        makeBox(350, 1.5, 10, 0xCCBB88, px, 0.5, pz + 320);
        makeBox(10, 1.5, 200, 0xCCBB88, px, 0.5, pz + 260);

        // Neptune Fountain
        makeCyl(18, 20, 4, 12, 0x8899AA, px, 2, pz + 200);
        makeCyl(2, 2, 12, 8, 0xAABBCC, px, 8, pz + 200);
        makeSph(5, 8, 8, 0x9AABBC, px, 17, pz + 200);
        // Fountain statues (simplified as cylinders + spheres)
        makeCyl(1, 1, 8, 6, 0xC8C0A0, px - 8, 6, pz + 200);
        makeSph(2, 6, 6, 0xC8C0A0, px - 8, 11, pz + 200);
        makeCyl(1, 1, 8, 6, 0xC8C0A0, px + 8, 6, pz + 200);
        makeSph(2, 6, 6, 0xC8C0A0, px + 8, 11, pz + 200);

        // Gloriette triumphal arch on hilltop
        var gx = px;
        var gz = pz + 480;
        // Hill
        makeBox(200, 30, 80, 0x567D46, gx, 15, gz);
        // Central arch body
        makeBox(60, 25, 10, 0xDDC870, gx, 45, gz);
        // Arch opening (dark box set within)
        makeBox(20, 16, 12, 0x223322, gx, 43, gz);
        // Gloriette wings
        makeBox(50, 15, 8, 0xDDC870, gx - 55, 38, gz);
        makeBox(50, 15, 8, 0xDDC870, gx + 55, 38, gz);
        // Gloriette colonnade pillars
        for (var gp = -4; gp <= 4; gp++) {
            makeCyl(0.8, 0.8, 14, 6, 0xEED880, gx + gp * 6, 38, gz - 4);
        }
        // Eagle/statue on top
        makeSph(3, 8, 8, 0xDDC870, gx, 59, gz);
    }

    // =============================================
    // ST STEPHEN'S CATHEDRAL (STEPHANSDOM)
    // =============================================
    function buildStephansDom() {
        var sx = 100;
        var sz = 100;
        var stoneColor = 0xD4C8A0;
        var darkStone = 0xAA9F88;
        var roofPattern = 0x2E5E2E;
        var roofGold = 0xFFD700;

        // Main nave body
        makeBox(40, 30, 120, stoneColor, sx, 15, sz);

        // Colourful diamond-pattern tiled roof (alternating boxes)
        makeBox(42, 8, 122, roofPattern, sx, 34, sz);
        makeBox(38, 4, 118, 0xB0C830, sx, 37, sz);

        // South tower - 137m represented proportionally (very tall)
        makeBox(14, 90, 14, stoneColor, sx + 10, 45, sz + 65);
        // South tower spire
        makeCone(7, 40, 8, darkStone, sx + 10, 115, sz + 65);
        // South tower tip cross
        makeCyl(0.5, 0.5, 8, 4, roofGold, sx + 10, 155, sz + 65);

        // North stub tower (Romanesque, unfinished, short)
        makeBox(12, 50, 12, stoneColor, sx - 10, 25, sz + 65);
        makeBox(13, 6, 13, darkStone, sx - 10, 53, sz + 65);

        // Romanesque west front
        makeBox(44, 28, 10, stoneColor, sx, 14, sz - 65);
        // West portal arch
        makeBox(12, 18, 12, darkStone, sx, 9, sz - 70);
        // Rose window
        makeCyl(5, 5, 3, 12, 0x6688AA, sx, 22, sz - 70);

        // Transept crossing tower
        makeBox(20, 50, 20, stoneColor, sx, 25, sz);
        makeCone(10, 20, 8, darkStone, sx, 60, sz);

        // Flying buttresses (simplified as angled boxes)
        for (var b = -2; b <= 2; b++) {
            makeBox(6, 3, 14, stoneColor, sx - 25, 20 + b * 2, sz + b * 20);
            makeBox(6, 3, 14, stoneColor, sx + 25, 20 + b * 2, sz + b * 20);
        }

        // Apse (rounded east end - approximated with cylinders)
        makeCyl(20, 20, 30, 10, stoneColor, sx, 15, sz - 70);
        makeCone(20, 15, 10, roofPattern, sx, 37, sz - 70);
    }

    // =============================================
    // RINGSTRASSE BOULEVARD AND BUILDINGS
    // =============================================
    function buildRingstrasse() {
        // The boulevard itself
        makeBox(800, 1.5, 50, 0xDDDDDD, 200, 0.75, 200);

        // Pavement/sidewalks
        makeBox(800, 1, 15, 0xCCCCCC, 200, 0.5, 225);
        makeBox(800, 1, 15, 0xCCCCCC, 200, 0.5, 175);

        // Tree-lined median
        makeBox(800, 0.5, 12, 0x567D46, 200, 0.25, 200);
        for (var t = -15; t <= 15; t++) {
            makeCyl(0.5, 0.5, 10, 6, 0x5C3D1A, 200 + t * 25, 5, 200);
            makeSph(4, 6, 6, 0x2D6E2D, 200 + t * 25, 12, 200);
        }

        // PARLIAMENT (Greek Revival)
        buildParliament(0, 200);

        // VIENNA OPERA HOUSE (State Opera) - built separately below
        // KUNSTHISTORISCHES MUSEUM
        buildKunsthistorisches(120, 200);

        // RATHAUS (Gothic town hall)
        buildRathaus(-120, 200);

        // BURGTHEATER
        buildBurgtheater(-240, 200);
    }

    function buildParliament(bx, bz) {
        var col = 0xE8E4D0;
        // Main body
        makeBox(100, 28, 60, col, bx, 14, bz - 120);
        // Pediment
        makeBox(80, 12, 6, col, bx, 32, bz - 150);
        // Columns
        for (var pc = -4; pc <= 4; pc++) {
            makeCyl(2, 2, 26, 8, 0xDDDAC8, bx + pc * 9, 13, bz - 148);
        }
        // Wings
        makeBox(40, 22, 50, col, bx - 70, 11, bz - 115);
        makeBox(40, 22, 50, col, bx + 70, 11, bz - 115);
        // Attica figure (Athena statue)
        makeCyl(1.5, 1.5, 14, 6, 0xCCBB90, bx, 42, bz - 148);
        makeSph(3, 6, 6, 0xCCBB90, bx, 57, bz - 148);
    }

    function buildKunsthistorisches(bx, bz) {
        var col = 0xE0D4B0;
        makeBox(90, 32, 70, col, bx, 16, bz - 120);
        // Central dome
        makeCyl(18, 20, 10, 12, col, bx, 37, bz - 120);
        makeSph(18, 10, 10, col, bx, 47, bz - 120);
        makeCone(3, 12, 6, 0x88AA66, bx, 62, bz - 120);
        // Corner towers
        makeBox(16, 36, 16, col, bx - 47, 18, bz - 120);
        makeBox(16, 36, 16, col, bx + 47, 18, bz - 120);
    }

    function buildRathaus(bx, bz) {
        var col = 0xD8D0B8;
        // Main body
        makeBox(80, 36, 55, col, bx, 18, bz - 120);
        // Central tower (Gothic)
        makeBox(16, 70, 16, col, bx, 35, bz - 120);
        makeCone(8, 20, 4, col, bx, 80, bz - 120);
        // Rathaus spire figure
        makeCyl(0.8, 0.8, 10, 4, 0xCC2200, bx, 96, bz - 120);
        // Side towers
        makeBox(10, 50, 10, col, bx - 40, 25, bz - 120);
        makeBox(10, 50, 10, col, bx + 40, 25, bz - 120);
        makeCone(5, 12, 4, col, bx - 40, 56, bz - 120);
        makeCone(5, 12, 4, col, bx + 40, 56, bz - 120);
    }

    function buildBurgtheater(bx, bz) {
        var col = 0xF0EADA;
        makeBox(100, 28, 60, col, bx, 14, bz - 120);
        // Curved wings
        makeBox(30, 22, 55, col, bx - 65, 11, bz - 125);
        makeBox(30, 22, 55, col, bx + 65, 11, bz - 125);
        // Facade columns
        for (var bc = -4; bc <= 4; bc++) {
            makeCyl(1.5, 1.5, 24, 8, 0xE0D8C0, bx + bc * 10, 12, bz - 150);
        }
        // Attic
        makeBox(102, 10, 6, col, bx, 30, bz - 150);
    }

    // =============================================
    // BELVEDERE PALACE
    // =============================================
    function buildBelvedere() {
        var bpx = 300;
        var bpz = -100;
        var col = 0xF5F5DC;
        var roofCol = 0x4A6741;

        // Upper Belvedere (on higher ground)
        makeBox(10, 10, 180, 0x567D46, bpx, 5, bpz - 20);
        makeBox(120, 30, 60, col, bpx, 20, bpz - 20);
        // Upper Belvedere roof - curved mansard approximation
        makeBox(122, 10, 62, roofCol, bpx, 35, bpz - 20);
        // Central dome / pavilion
        makeBox(30, 40, 30, col, bpx, 25, bpz - 20);
        makeSph(16, 8, 8, roofCol, bpx, 52, bpz - 20);
        // Wings
        makeBox(30, 28, 58, col, bpx - 75, 14, bpz - 20);
        makeBox(30, 28, 58, col, bpx + 75, 14, bpz - 20);
        makeBox(32, 8, 60, roofCol, bpx - 75, 28, bpz - 20);
        makeBox(32, 8, 60, roofCol, bpx + 75, 28, bpz - 20);

        // Lower Belvedere
        makeBox(100, 22, 50, col, bpx, 11, bpz + 140);
        makeBox(102, 6, 52, roofCol, bpx, 25, bpz + 140);

        // Gardens between
        makeBox(110, 1, 120, 0x4A7C3F, bpx, 5.5, bpz + 60);
        // Garden fountains
        makeCyl(8, 10, 3, 10, 0x7799AA, bpx - 30, 7, bpz + 60);
        makeCyl(2, 2, 6, 8, 0x99BBCC, bpx - 30, 9, bpz + 60);
        makeCyl(8, 10, 3, 10, 0x7799AA, bpx + 30, 7, bpz + 60);
        makeCyl(2, 2, 6, 8, 0x99BBCC, bpx + 30, 9, bpz + 60);

        // Sphinxes (simplified)
        makeBox(8, 5, 14, 0xDDCC99, bpx - 50, 7, bpz + 20);
        makeBox(8, 5, 14, 0xDDCC99, bpx + 50, 7, bpz + 20);
    }

    // =============================================
    // DANUBE RIVER AND DONAUKANAL
    // =============================================
    function buildDanube() {
        var riverColor = 0x4682B4;
        // Danube main channel
        makeBox(1200, 1, 80, riverColor, 200, 0.2, -500);
        makeBox(1200, 1, 60, 0x3A75A8, 200, 0.3, -500);
        // Donaukanal (canal, narrower, closer in)
        makeBox(900, 1, 30, riverColor, 100, 0.2, -350);
        // Danube Island strip
        makeBox(800, 1, 20, 0x4A7C3F, 200, 0.5, -480);
        // Bridges
        makeBox(20, 3, 90, 0x888888, -200, 1.5, -350);
        makeCyl(2, 2, 90, 6, 0x777777, -200, 1.5, -350);
        makeBox(20, 3, 90, 0x888888, 0, 1.5, -350);
        makeBox(20, 3, 90, 0x888888, 200, 1.5, -350);
        // Reichsbrucke (tall bridge pylons)
        makeBox(6, 30, 6, 0xAAAAAA, 150, 15, -500);
        makeBox(6, 30, 6, 0xAAAAAA, 250, 15, -500);
        makeBox(100, 4, 8, 0x999999, 200, 4, -500);
    }

    // =============================================
    // SPANISH RIDING SCHOOL / HOFBURG
    // =============================================
    function buildSpanishRidingSchool() {
        var hx = -100;
        var hz = 50;
        var col = 0xF5F5DC;

        // Hofburg main wing
        makeBox(160, 30, 60, col, hx, 15, hz);
        makeBox(162, 6, 62, 0xE0DCC0, hx, 33, hz);

        // Spanish Riding School hall (large rectangular)
        makeBox(100, 22, 50, col, hx, 11, hz + 80);
        makeBox(102, 4, 52, 0xE0DCC0, hx, 23, hz + 80);
        // Riding school interior columns visible from outside
        for (var rsc = -4; rsc <= 4; rsc++) {
            makeCyl(1, 1, 20, 8, 0xDDD8C0, hx + rsc * 10, 10, hz + 80);
        }

        // Swiss Gate area
        makeBox(20, 25, 12, col, hx - 80, 12, hz - 5);
        makeBox(8, 16, 14, 0x223322, hx - 80, 8, hz - 5);

        // Michaelerplatz dome (circular entrance)
        makeCyl(22, 22, 10, 16, col, hx - 80, 5, hz - 60);
        makeSph(22, 10, 10, col, hx - 80, 20, hz - 60);
        makeCone(5, 10, 6, 0x889966, hx - 80, 37, hz - 60);

        // Heldenplatz open space
        makeBox(200, 0.5, 120, 0xCCBB88, hx, 0.25, hz - 100);
        // Equestrian statue
        makeCyl(2, 2, 8, 6, 0x886633, hx, 4, hz - 80);
        makeBox(6, 4, 10, 0x886633, hx, 9, hz - 80);
        makeSph(3, 6, 6, 0x886633, hx, 14, hz - 80);
    }

    // =============================================
    // KARLSKIRCHE (ST CHARLES'S CHURCH)
    // =============================================
    function buildKarlskirche() {
        var kx = 50;
        var kz = 250;
        var col = 0xF5F5DC;

        // Main body of church
        makeBox(50, 30, 80, col, kx, 15, kz);
        // Main dome
        makeCyl(22, 24, 14, 16, col, kx, 37, kz);
        makeSph(22, 10, 10, col, kx, 51, kz);
        // Lantern drum on dome
        makeCyl(8, 10, 12, 10, col, kx, 68, kz);
        makeCone(8, 15, 8, 0x7A9960, kx, 80, kz);
        // Cross on dome
        makeCyl(0.6, 0.6, 10, 4, 0xFFD700, kx, 93, kz);

        // Portico / entrance
        makeBox(40, 20, 10, col, kx, 10, kz + 45);
        // Portico columns
        for (var kc = -2; kc <= 2; kc++) {
            makeCyl(1.5, 1.5, 18, 8, 0xEEEAD8, kx + kc * 8, 9, kz + 48);
        }
        // Pediment
        makeBox(38, 8, 6, col, kx, 22, kz + 48);

        // Flanking Trajan-style columns (freestanding)
        makeCyl(3.5, 3.5, 32, 12, 0xE8E4D0, kx - 45, 16, kz + 20);
        makeSph(5, 8, 8, 0xCCBB88, kx - 45, 33, kz + 20);
        makeCyl(3.5, 3.5, 32, 12, 0xE8E4D0, kx + 45, 16, kz + 20);
        makeSph(5, 8, 8, 0xCCBB88, kx + 45, 33, kz + 20);

        // Side towers (short)
        makeBox(14, 36, 14, col, kx - 30, 18, kz);
        makeBox(14, 36, 14, col, kx + 30, 18, kz);
        makeCone(7, 12, 8, 0x889966, kx - 30, 42, kz);
        makeCone(7, 12, 8, 0x889966, kx + 30, 42, kz);

        // Reflecting pool in front
        makeBox(50, 0.5, 30, 0x4682B4, kx, 0.25, kz + 80);
    }

    // =============================================
    // VIENNA STATE OPERA
    // =============================================
    function buildStateOpera() {
        var ox = 60;
        var oz = 160;
        var col = 0xF5D080;
        var arcadeCol = 0xE8C060;

        // Main opera house body
        makeBox(100, 30, 70, col, ox, 15, oz);
        // Mansard roof
        makeBox(102, 10, 72, 0x556B4A, ox, 35, oz);
        // Roof dormer windows
        for (var od = -4; od <= 4; od++) {
            makeBox(6, 7, 5, col, ox + od * 11, 37, oz - 36);
        }

        // Loggia / arcade facade (Neo-Renaissance)
        makeBox(100, 10, 8, col, ox, 5, oz - 37);
        // Arcade arches (sets of cylinders for pilasters)
        for (var oa = -4; oa <= 4; oa++) {
            makeCyl(1.2, 1.2, 14, 8, arcadeCol, ox + oa * 10, 7, oz - 38);
        }
        // Second floor loggia
        makeBox(100, 8, 8, col, ox, 18, oz - 37);
        for (var ob = -4; ob <= 4; ob++) {
            makeCyl(1, 1, 10, 8, arcadeCol, ox + ob * 10, 18, oz - 38);
        }

        // Attic story with statues
        makeBox(100, 8, 6, col, ox, 29, oz - 36);
        for (var os = -3; os <= 3; os++) {
            makeCyl(1, 1, 7, 6, 0xDDCC88, ox + os * 14, 33, oz - 38);
            makeSph(2, 6, 6, 0xDDCC88, ox + os * 14, 41, oz - 38);
        }

        // Side wings
        makeBox(20, 28, 68, col, ox - 60, 14, oz);
        makeBox(20, 28, 68, col, ox + 60, 14, oz);

        // Rear fly tower (very tall box)
        makeBox(80, 50, 30, 0xCCB870, ox, 25, oz - 25);
    }

    // =============================================
    // PRATER FERRIS WHEEL (RIESENRAD)
    // =============================================
    function buildPraterFerrisWheel() {
        var fx = 500;
        var fz = -200;
        var wheelColor = 0xCC2200;
        var metalColor = 0x882200;

        // Base support A-frame pylons
        makeBox(6, 50, 6, metalColor, fx - 20, 25, fz - 10);
        makeBox(6, 50, 6, metalColor, fx + 20, 25, fz - 10);
        makeBox(6, 50, 6, metalColor, fx - 20, 25, fz + 10);
        makeBox(6, 50, 6, metalColor, fx + 20, 25, fz + 10);

        // Central axle / hub
        makeCyl(3, 3, 20, 8, metalColor, fx, 65, fz);

        // Main wheel rim (approximated by a set of cylinders arranged in a ring)
        // Wheel is 65m diameter, so r~32
        var numSpokes = 12;
        for (var sp = 0; sp < numSpokes; sp++) {
            var angle = (sp / numSpokes) * Math.PI * 2;
            var rx = Math.cos(angle) * 32;
            var ry = Math.sin(angle) * 32;
            // Spoke
            makeCyl(0.8, 0.8, 32, 4, metalColor, fx + rx * 0.5, 65 + ry * 0.5, fz);
            // Rim segment boxes at outer edge
            makeBox(3, 3, 3, wheelColor, fx + rx, 65 + ry, fz);
        }

        // Gondola cabins (red boxes hanging around the rim)
        var numCabins = 8;
        for (var cab = 0; cab < numCabins; cab++) {
            var cabAngle = (cab / numCabins) * Math.PI * 2;
            var cabX = Math.cos(cabAngle) * 30;
            var cabY = Math.sin(cabAngle) * 30;
            makeBox(10, 5, 4, wheelColor, fx + cabX, 65 + cabY, fz);
        }

        // Outer rim ring approximation
        makeCyl(33, 33, 3, 24, wheelColor, fx, 65, fz);
        makeCyl(28, 28, 3, 24, metalColor, fx, 65, fz);

        // Support lattice cross members
        makeBox(45, 4, 4, metalColor, fx, 55, fz);
        makeBox(4, 45, 4, metalColor, fx, 65, fz);
        makeBox(30, 4, 4, metalColor, fx, 40, fz);

        // Ground anchor concrete bases
        makeBox(16, 6, 16, 0x888888, fx - 20, 3, fz);
        makeBox(16, 6, 16, 0x888888, fx + 20, 3, fz);

        // Prater park surroundings
        makeBox(200, 1, 200, 0x3A6B32, fx, 0.5, fz);
        // Some trees
        for (var pt = -3; pt <= 3; pt++) {
            makeCyl(0.8, 0.8, 12, 6, 0x5C3D1A, fx + pt * 25, 6, fz + 60);
            makeSph(6, 6, 6, 0x2D6E2D, fx + pt * 25, 15, fz + 60);
        }
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

    return {
        init: init,
        update: update,
        reset: reset
    };
}());
