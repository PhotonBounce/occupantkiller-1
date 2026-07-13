window.DhakaLalbagh = (function() {
    'use strict';
    var scene = null;
    var camera = null;
    var objects = [];
    var OX = 24440;

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
        mesh.position.set(OX + x, y + h / 2, z);
        return addMesh(mesh);
    }

    function cyl(rt, rb, h, segs, color, x, y, z) {
        var geo = new THREE.CylinderGeometry(rt, rb, h, segs);
        var mat = makeMat(color);
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(OX + x, y + h / 2, z);
        return addMesh(mesh);
    }

    function sph(r, color, x, y, z) {
        var geo = new THREE.SphereGeometry(r, 12, 8);
        var mat = makeMat(color);
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(OX + x, y, z);
        return addMesh(mesh);
    }

    function cone(r, h, segs, color, x, y, z) {
        var geo = new THREE.ConeGeometry(r, h, segs);
        var mat = makeMat(color);
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(OX + x, y + h / 2, z);
        return addMesh(mesh);
    }

    function build() {
        buildGround();
        buildLalbagh();
        buildParliament();
        buildStarMosque();
        buildShaheedMinar();
        buildBuriganga();
        buildAhsanManzil();
        buildDhakaUniversity();
        buildOldDhakaBazaar();
        buildHatirjheel();
        buildBashundharaCity();
    }

    function buildGround() {
        // Ground plane using thin box
        box(1200, 1, 1200, 0x5A7A4A, 0, -1, 0);
        // Dirt ground for old dhaka area
        box(400, 0.5, 400, 0x8A7A5A, -300, -0.5, 200);
    }

    // -----------------------------------------------------------------------
    // LALBAGH FORT  (Mughal, 17th c.)  centered at x=-350, z=-200
    // -----------------------------------------------------------------------
    function buildLalbagh() {
        var lx = -350;
        var lz = -200;
        var fc = 0xCC8855;
        var wall = 0xBB7744;
        var marble = 0xEEEEDD;

        // --- Fort outer walls (4 sides, incomplete) ---
        box(160, 12, 4, wall, lx, 0, lz - 80);          // north wall
        box(160, 12, 4, wall, lx, 0, lz + 80);          // south wall (partial gap)
        box(4, 12, 160, wall, lx - 80, 0, lz);          // west wall
        box(4, 12, 80, wall, lx + 80, 0, lz - 40);      // east wall north half
        // gap in east wall (incomplete fort)

        // Corner bastions
        cyl(8, 9, 14, 8, wall, lx - 80, 0, lz - 80);
        cyl(8, 9, 14, 8, wall, lx + 80, 0, lz - 80);
        cyl(8, 9, 14, 8, wall, lx - 80, 0, lz + 80);

        // --- Mosque (west end) ---
        box(40, 16, 30, fc, lx - 45, 0, lz);            // mosque body
        sph(7, fc, lx - 55, 22, lz);                    // left dome
        sph(8, fc, lx - 45, 23, lz);                    // centre dome
        sph(7, fc, lx - 35, 22, lz);                    // right dome
        // Mosque minarets
        cyl(2, 2.5, 22, 6, fc, lx - 65, 0, lz - 16);
        cone(2, 4, 6, 0xAA6633, lx - 65, 22, lz - 16);
        cyl(2, 2.5, 22, 6, fc, lx - 65, 0, lz + 16);
        cone(2, 4, 6, 0xAA6633, lx - 65, 22, lz + 16);
        // Mosque arched facade detail
        box(6, 14, 2, 0xBB7733, lx - 62, 0, lz);

        // --- Diwan-i-Aam (audience hall, centre) ---
        box(36, 10, 22, fc, lx, 0, lz);                 // main hall
        box(38, 2, 24, 0xAA7744, lx, 10, lz);           // roof parapet
        // Columns along facade
        cyl(1.2, 1.2, 10, 6, 0xDDCCAA, lx - 14, 0, lz - 12);
        cyl(1.2, 1.2, 10, 6, 0xDDCCAA, lx - 7, 0, lz - 12);
        cyl(1.2, 1.2, 10, 6, 0xDDCCAA, lx, 0, lz - 12);
        cyl(1.2, 1.2, 10, 6, 0xDDCCAA, lx + 7, 0, lz - 12);
        cyl(1.2, 1.2, 10, 6, 0xDDCCAA, lx + 14, 0, lz - 12);
        // Diwan-i-Aam dome
        sph(6, fc, lx, 15, lz);

        // --- Mausoleum of Bibi Pari (marble, east) ---
        box(24, 14, 24, marble, lx + 50, 0, lz);        // mausoleum base
        box(20, 10, 20, marble, lx + 50, 14, lz);       // upper octagonal drum
        sph(9, marble, lx + 50, 28, lz);                // main dome
        // Corner kiosks
        cyl(2.5, 2.5, 16, 8, marble, lx + 38, 0, lz - 12);
        sph(2.5, marble, lx + 38, 16, lz - 12);
        cyl(2.5, 2.5, 16, 8, marble, lx + 62, 0, lz - 12);
        sph(2.5, marble, lx + 62, 16, lz - 12);
        cyl(2.5, 2.5, 16, 8, marble, lx + 38, 0, lz + 12);
        sph(2.5, marble, lx + 38, 16, lz + 12);
        cyl(2.5, 2.5, 16, 8, marble, lx + 62, 0, lz + 12);
        sph(2.5, marble, lx + 62, 16, lz + 12);

        // Decorative finial on mausoleum
        cyl(1, 0, 5, 6, 0xDDAA55, lx + 50, 37, lz);

        // Courtyard paving
        box(160, 0.4, 160, 0xCCAA88, lx, 0, lz);
    }

    // -----------------------------------------------------------------------
    // NATIONAL PARLIAMENT HOUSE  centered at x=100, z=-300
    // -----------------------------------------------------------------------
    function buildParliament() {
        var px = 100;
        var pz = -300;
        var cc = 0x888888;
        var moat = 0x2A4A6A;

        // Main cylindrical chamber
        cyl(38, 38, 36, 16, cc, px, 0, pz);
        // Roof disc
        cyl(40, 40, 3, 16, 0x777777, px, 36, pz);

        // 8 satellite cylinders arranged around main chamber
        var satR = 62;
        var satC = 0x999999;
        for (var i = 0; i < 8; i++) {
            var ang = (i / 8) * Math.PI * 2;
            var sx = px + Math.cos(ang) * satR;
            var sz = pz + Math.sin(ang) * satR;
            cyl(14, 14, 30, 12, satC, sx, 0, sz);
            cyl(15, 15, 2, 12, 0x777777, sx, 30, sz);
            // Geometric cutout panel (dark rectangle to suggest void)
            box(8, 16, 1, 0x444444, sx + Math.cos(ang) * 14, 7, sz + Math.sin(ang) * 14);
        }

        // Connecting corridors between main chamber and satellites (alternate)
        for (var j = 0; j < 4; j++) {
            var cang = (j / 4) * Math.PI * 2 + Math.PI / 8;
            var cx2 = px + Math.cos(cang) * 50;
            var cz2 = pz + Math.sin(cang) * 50;
            box(18, 10, 10, cc, cx2, 0, cz2);
        }

        // Water moat / reflection pool (flat dark boxes)
        box(220, 0.5, 220, moat, px, -0.3, pz);
        box(200, 0.3, 200, 0x1A3A5A, px, 0, pz);

        // Outer plaza / approach
        box(220, 0.8, 30, 0xAAAAAA, px, 0, pz - 130);
        // Guard pillars at entrance
        cyl(3, 3, 18, 8, cc, px - 20, 0, pz - 130);
        cyl(3, 3, 18, 8, cc, px + 20, 0, pz - 130);
    }

    // -----------------------------------------------------------------------
    // STAR MOSQUE (TARA MASJID)  centered at x=200, z=150
    // -----------------------------------------------------------------------
    function buildStarMosque() {
        var mx = 200;
        var mz = 150;
        var blue = 0x4466CC;
        var darkBlue = 0x334499;
        var starWhite = 0xDDEEFF;

        // Main mosque body
        box(36, 14, 24, blue, mx, 0, mz);
        // Blue mosaic facade panels
        box(38, 16, 1, darkBlue, mx, 0, mz - 13);
        box(38, 16, 1, darkBlue, mx, 0, mz + 13);

        // Three domes
        sph(7, blue, mx - 11, 19, mz);
        sph(8, darkBlue, mx, 20, mz);
        sph(7, blue, mx + 11, 19, mz);
        // Star-pattern caps on domes (small white sphere on top)
        sph(1.5, starWhite, mx - 11, 26.5, mz);
        sph(1.8, starWhite, mx, 28, mz);
        sph(1.5, starWhite, mx + 11, 26.5, mz);

        // Four minaret towers
        cyl(2.5, 3, 28, 8, darkBlue, mx - 19, 0, mz - 13);
        cyl(2.5, 3, 28, 8, darkBlue, mx + 19, 0, mz - 13);
        cyl(2.5, 3, 28, 8, darkBlue, mx - 19, 0, mz + 13);
        cyl(2.5, 3, 28, 8, darkBlue, mx + 19, 0, mz + 13);
        // Minaret bulges (balcony)
        cyl(3.5, 3.5, 2, 8, blue, mx - 19, 20, mz - 13);
        cyl(3.5, 3.5, 2, 8, blue, mx + 19, 20, mz - 13);
        cyl(3.5, 3.5, 2, 8, blue, mx - 19, 20, mz + 13);
        cyl(3.5, 3.5, 2, 8, blue, mx + 19, 20, mz + 13);
        // Minaret finials
        cone(2.5, 5, 8, starWhite, mx - 19, 28, mz - 13);
        cone(2.5, 5, 8, starWhite, mx + 19, 28, mz - 13);
        cone(2.5, 5, 8, starWhite, mx - 19, 28, mz + 13);
        cone(2.5, 5, 8, starWhite, mx + 19, 28, mz + 13);

        // Star mosaic decorations (scattered small boxes on facade)
        for (var k = 0; k < 6; k++) {
            box(2, 2, 0.4, starWhite, mx - 15 + k * 6, 8, mz - 13.3);
            box(2, 2, 0.4, starWhite, mx - 15 + k * 6, 4, mz - 13.3);
        }

        // Courtyard
        box(50, 0.3, 40, 0xCCDDEE, mx, 0, mz);
        // Ablution fountain
        cyl(4, 4, 1, 8, 0x3355AA, mx, 0.3, mz + 25);
        cyl(2, 2, 2, 8, 0x4466CC, mx, 1, mz + 25);
    }

    // -----------------------------------------------------------------------
    // SHAHEED MINAR  centered at x=-50, z=-100
    // -----------------------------------------------------------------------
    function buildShaheedMinar() {
        var sx = -50;
        var sz = -100;
        var white = 0xCCCCCC;
        var accent = 0xDDDDDD;

        // Central split column (mother protecting children concept)
        // Left arm of arch
        box(3, 30, 3, white, sx - 8, 0, sz);
        // Right arm of arch
        box(3, 30, 3, white, sx + 8, 0, sz);
        // Crossbar connecting both (top arch)
        box(22, 3, 3, accent, sx, 28, sz);
        // Slight lean inward at top — represented by slightly offset caps
        box(4, 6, 4, white, sx - 8, 30, sz);
        box(4, 6, 4, white, sx + 8, 30, sz);

        // Central shorter column (the child / language)
        box(4, 22, 4, 0xBBBBBB, sx, 0, sz);
        box(5, 3, 5, accent, sx, 22, sz);

        // Curved approach ramp (flat boxes in arc)
        box(40, 0.4, 8, 0xCCCCBB, sx, 0, sz + 20);

        // Flanking low walls
        box(16, 2, 2, white, sx - 20, 0, sz + 10);
        box(16, 2, 2, white, sx + 20, 0, sz + 10);

        // Base platform
        box(50, 1, 20, accent, sx, 0, sz);
        box(60, 0.5, 30, 0xBBBBBB, sx, 0, sz);

        // Floral wreath marker (flat cylinder)
        cyl(6, 6, 0.5, 12, 0xCC3333, sx, 0.5, sz - 5);
    }

    // -----------------------------------------------------------------------
    // BURIGANGA RIVER  (south of city, z > 350)
    // -----------------------------------------------------------------------
    function buildBuriganga() {
        var rz = 400;
        var water = 0x2A4A5A;
        var boat = 0x885533;

        // River surface
        box(600, 0.6, 120, water, 0, -0.6, rz);
        box(600, 0.3, 80, 0x1A3A4A, 0, -0.1, rz);

        // Sadarghat port terminal building
        box(60, 12, 20, 0xCCBB99, 0, 0, rz - 50);
        box(62, 2, 22, 0xBBAA88, 0, 12, rz - 50);
        cyl(4, 4, 16, 8, 0xBBAA88, -20, 0, rz - 50);
        cyl(4, 4, 16, 8, 0xBBAA88, 20, 0, rz - 50);

        // Rocket steamer (large river boat)
        box(30, 6, 8, 0xCCCCBB, -80, 0, rz + 10);
        box(28, 8, 6, 0xBBBBBB, -80, 6, rz + 10);
        cyl(1.5, 1.5, 12, 6, 0x333333, -72, 8, rz + 10);
        cyl(1.5, 1.5, 12, 6, 0x333333, -85, 8, rz + 10);

        // Wooden country boats
        box(12, 2, 3, boat, 60, 0, rz + 20);
        box(10, 1, 2.5, 0x996644, 60, 2, rz + 20);
        cone(0.5, 8, 4, 0xAA8855, 60, 3, rz + 20);      // mast

        box(10, 2, 3, boat, 120, 0, rz - 10);
        box(8, 1, 2.5, 0x996644, 120, 2, rz - 10);

        // River port crane (simple box tower)
        box(3, 20, 3, 0x666666, -10, 0, rz - 55);
        box(20, 2, 2, 0x555555, -10, 20, rz - 55);
    }

    // -----------------------------------------------------------------------
    // AHSAN MANZIL (PINK PALACE)  centered at x=-150, z=300
    // -----------------------------------------------------------------------
    function buildAhsanManzil() {
        var ax = -150;
        var az = 300;
        var pink = 0xCC6666;
        var darkPink = 0xBB5555;

        // Main palace body
        box(70, 18, 30, pink, ax, 0, az);
        // Upper storey
        box(60, 10, 24, pink, ax, 18, az);

        // Central dome
        cyl(10, 12, 6, 12, pink, ax, 28, az);
        sph(10, darkPink, ax, 35, az);
        cyl(1.5, 1.5, 6, 6, 0xDDAA88, ax, 45, az);      // finial

        // Colonnaded verandah (ground floor)
        for (var c = -3; c <= 3; c++) {
            cyl(1.2, 1.2, 18, 8, 0xEEAAAA, ax + c * 10, 0, az - 16);
        }
        // First floor columns
        for (var d = -2; d <= 2; d++) {
            cyl(1, 1, 10, 8, 0xEEAAAA, ax + d * 10, 18, az - 13);
        }

        // Side wings
        box(20, 14, 28, pink, ax - 45, 0, az);
        box(20, 14, 28, pink, ax + 45, 0, az);
        sph(5, darkPink, ax - 45, 19, az);
        sph(5, darkPink, ax + 45, 19, az);

        // Front garden wall
        box(80, 3, 2, darkPink, ax, 0, az - 22);
        // Gate pillars
        cyl(2, 2, 12, 8, darkPink, ax - 12, 0, az - 22);
        cyl(2, 2, 12, 8, darkPink, ax + 12, 0, az - 22);
        // Lawn
        box(80, 0.3, 20, 0x447744, ax, 0, az - 18);
    }

    // -----------------------------------------------------------------------
    // DHAKA UNIVERSITY  centered at x=300, z=-100
    // -----------------------------------------------------------------------
    function buildDhakaUniversity() {
        var ux = 300;
        var uz = -100;
        var brick = 0xCCCCBB;
        var redBrick = 0xAA6644;

        // Curzon Hall main body (colonial brick building)
        box(50, 16, 30, redBrick, ux, 0, uz);
        // Central dome on Curzon Hall
        cyl(9, 10, 5, 12, redBrick, ux, 16, uz);
        sph(9, 0xBB5533, ux, 23, uz);

        // Wings
        box(18, 14, 26, redBrick, ux - 34, 0, uz);
        box(18, 14, 26, redBrick, ux + 34, 0, uz);

        // Arched facade
        box(54, 4, 2, 0x996644, ux, 12, uz - 16);

        // Columns
        cyl(1.2, 1.2, 14, 8, brick, ux - 18, 0, uz - 16);
        cyl(1.2, 1.2, 14, 8, brick, ux - 9, 0, uz - 16);
        cyl(1.2, 1.2, 14, 8, brick, ux, 0, uz - 16);
        cyl(1.2, 1.2, 14, 8, brick, ux + 9, 0, uz - 16);
        cyl(1.2, 1.2, 14, 8, brick, ux + 18, 0, uz - 16);

        // Adjacent academic building
        box(30, 12, 22, brick, ux + 70, 0, uz);
        box(30, 12, 22, brick, ux - 70, 0, uz);

        // Tree rows (cylinders as trunks, spheres as canopy)
        for (var t = -3; t <= 3; t++) {
            cyl(0.8, 0.8, 5, 6, 0x664422, ux + t * 12, 0, uz + 30);
            sph(4, 0x336622, ux + t * 12, 9, uz + 30);
        }
    }

    // -----------------------------------------------------------------------
    // OLD DHAKA BAZAAR  centered at x=-100, z=200
    // -----------------------------------------------------------------------
    function buildOldDhakaBazaar() {
        var bx = -100;
        var bz = 200;
        var bazaar = 0xC8A870;
        var street = 0xAA9966;

        // Dense market building blocks
        box(20, 12, 14, bazaar, bx - 30, 0, bz - 20);
        box(18, 10, 12, 0xBB9966, bx - 8, 0, bz - 18);
        box(22, 14, 10, bazaar, bx + 14, 0, bz - 22);
        box(16, 9, 16, 0xCC9944, bx + 32, 0, bz - 16);
        box(24, 12, 14, bazaar, bx - 28, 0, bz + 10);
        box(18, 11, 12, 0xBBAA77, bx + 2, 0, bz + 12);
        box(20, 10, 14, bazaar, bx + 24, 0, bz + 8);

        // Market stalls (short wide boxes)
        box(8, 3, 6, 0xDDB888, bx - 15, 0, bz - 8);
        box(8, 3, 6, 0xCCAA77, bx - 6, 0, bz - 8);
        box(8, 3, 6, 0xDDCC88, bx + 3, 0, bz - 8);
        box(8, 3, 6, 0xBBAA66, bx + 12, 0, bz - 8);

        // Awnings (thin flat boxes)
        box(9, 0.5, 4, 0xDD6633, bx - 15, 3, bz - 8);
        box(9, 0.5, 4, 0x3366CC, bx - 6, 3, bz - 8);
        box(9, 0.5, 4, 0xCC3333, bx + 3, 3, bz - 8);
        box(9, 0.5, 4, 0x33AA33, bx + 12, 3, bz - 8);

        // Narrow street alley (darker ground strip)
        box(60, 0.3, 6, street, bx, 0, bz);

        // Rickshaw (stylized box + wheels)
        box(3, 2, 2, 0xFF4444, bx - 5, 0, bz + 2);
        cyl(0.6, 0.6, 0.5, 8, 0x222222, bx - 6.5, 0.6, bz + 2);
        cyl(0.6, 0.6, 0.5, 8, 0x222222, bx - 3.5, 0.6, bz + 2);

        // Clock tower / landmark
        box(5, 25, 5, 0x997755, bx + 45, 0, bz);
        box(8, 3, 8, 0xAA8866, bx + 45, 25, bz);
        sph(3, 0xBB9977, bx + 45, 30, bz);
    }

    // -----------------------------------------------------------------------
    // HATIRJHEEL LAKE  centered at x=400, z=200
    // -----------------------------------------------------------------------
    function buildHatirjheel() {
        var hx = 400;
        var hz = 200;
        var lakeBlue = 0x2A6A8A;
        var bridge = 0xAAAAAA;

        // Lake surface (multi-box to suggest irregular shoreline)
        box(180, 0.5, 80, lakeBlue, hx, -0.3, hz);
        box(120, 0.5, 40, 0x1A5A7A, hx + 20, -0.1, hz + 30);
        box(100, 0.5, 30, lakeBlue, hx - 30, -0.1, hz - 30);

        // Pedestrian bridges over lake
        box(60, 1.5, 4, bridge, hx, 1, hz);               // east-west bridge
        box(4, 1.5, 80, bridge, hx + 50, 1, hz);          // north-south bridge

        // Bridge railings
        box(60, 1, 0.3, 0x999999, hx, 2, hz - 2);
        box(60, 1, 0.3, 0x999999, hx, 2, hz + 2);
        box(0.3, 1, 80, 0x999999, hx + 48, 2, hz);
        box(0.3, 1, 80, 0x999999, hx + 52, 2, hz);

        // Fountain in lake
        cyl(3, 3, 1, 8, 0x3A7A9A, hx - 40, 0, hz + 10);
        cyl(1.5, 0.8, 6, 8, 0x5599BB, hx - 40, 1, hz + 10);
        sph(3, 0x66AABB, hx - 40, 8, hz + 10);

        // Lakeside walkway
        box(180, 0.4, 6, 0xBBBBBB, hx, 0, hz - 46);

        // Apartment blocks around lake
        box(18, 35, 14, 0x9999AA, hx - 100, 0, hz);
        box(16, 28, 12, 0xAAAABB, hx - 80, 0, hz + 50);
        box(20, 40, 16, 0x888899, hx + 110, 0, hz);
    }

    // -----------------------------------------------------------------------
    // BASHUNDHARA CITY (shopping mall / skyscraper)  centered at x=500, z=-200
    // -----------------------------------------------------------------------
    function buildBashundharaCity() {
        var bx = 500;
        var bz = -200;
        var concrete = 0x888899;
        var glass = 0x6677AA;

        // Main tower block
        box(40, 90, 40, concrete, bx, 0, bz);
        // Glass curtain wall panels (slightly inset lighter color)
        box(36, 88, 2, glass, bx, 0, bz - 21);
        box(36, 88, 2, glass, bx, 0, bz + 21);
        box(2, 88, 36, glass, bx - 21, 0, bz);
        box(2, 88, 36, glass, bx + 21, 0, bz);

        // Rooftop mechanical box
        box(20, 8, 20, 0x777788, bx, 90, bz);
        // Antenna
        cyl(0.5, 0.5, 15, 4, 0x555566, bx, 98, bz);

        // Low-rise podium / mall base
        box(80, 18, 70, concrete, bx, 0, bz);
        box(82, 2, 72, 0x999AAA, bx, 18, bz);

        // Parking structure adjacent
        box(40, 14, 30, 0x777788, bx + 60, 0, bz);
        // Ramp
        box(10, 0.5, 28, 0x888899, bx + 78, 7, bz);

        // Signage box on podium
        box(30, 5, 1, 0xCC2222, bx, 19, bz - 37);

        // Neighboring high-rise (slightly shorter)
        box(30, 65, 26, 0x7777AA, bx + 70, 0, bz - 30);
        box(26, 63, 2, glass, bx + 70, 0, bz - 44);
        // Street level shops
        box(60, 5, 10, 0x999988, bx - 55, 0, bz - 40);
    }

    function update(delta) {
        // reserved for future animation (boats, fountain, etc.)
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
