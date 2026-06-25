window.CulzeanCastle = (function() {
    'use strict';

    var WX = 2260;
    var WZ = 2200;

    function makeBox(scene, w, h, d, color, x, y, z) {
        var geo = new THREE.BoxGeometry(w, h, d);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(WX + x, y, WZ + z);
        scene.add(mesh);
        return mesh;
    }

    function makeCylinder(scene, rt, rb, h, segs, color, x, y, z) {
        var geo = new THREE.CylinderGeometry(rt, rb, h, segs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(WX + x, y, WZ + z);
        scene.add(mesh);
        return mesh;
    }

    function makeSphere(scene, r, ws, hs, color, x, y, z) {
        var geo = new THREE.SphereGeometry(r, ws, hs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(WX + x, y, WZ + z);
        scene.add(mesh);
        return mesh;
    }

    function makeCone(scene, r, h, segs, color, x, y, z) {
        var geo = new THREE.ConeGeometry(r, h, segs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(WX + x, y, WZ + z);
        scene.add(mesh);
        return mesh;
    }

    function makeEdges(scene, w, h, d, color, x, y, z) {
        var geo = new THREE.BoxGeometry(w, h, d);
        var edges = new THREE.EdgesGeometry(geo);
        var mat = new THREE.LineBasicMaterial({ color: color });
        var lines = new THREE.LineSegments(edges, mat);
        lines.position.set(WX + x, y, WZ + z);
        scene.add(lines);
        return lines;
    }

    // ── Clifftop and Sea ─────────────────────────────────────────────────────
    // The castle perches on a sheer basalt cliff above the Firth of Clyde
    function buildCliff(scene) {
        var cliffColor = 0x3A3A4A;
        var seaColor   = 0x1A4A6A;
        var rockColor  = 0x2A2A3A;

        // Main cliff face — sheer drop of 16 units
        makeBox(scene, 80, 16, 8, cliffColor,    0, -8,  32);
        makeBox(scene, 80, 16, 8, cliffColor,    0, -8,  36);
        // Side cliff faces
        makeBox(scene, 8, 16, 40, cliffColor,  -40, -8,  20);
        makeBox(scene, 8, 16, 40, cliffColor,   40, -8,  20);

        // Rocky cliff base where cliffs meet the sea
        makeBox(scene, 80, 4, 6, rockColor,   0, -17, 37);
        makeBox(scene, 6, 4, 40, rockColor, -41, -17, 20);
        makeBox(scene, 6, 4, 40, rockColor,  41, -17, 20);

        // Sea surface — Firth of Clyde
        makeBox(scene, 200, 1, 100, seaColor,  0, -19, 70);
        // Whitecap detail strips
        makeBox(scene, 80, 0.5, 2, 0x9AB8CC, 0, -18, 55);
        makeBox(scene, 60, 0.5, 2, 0x9AB8CC, 10, -18, 65);
    }

    // ── Castle Platform ───────────────────────────────────────────────────────
    // Elevated clifftop ground level
    function buildPlatform(scene) {
        var grassColor = 0x4A6A30;
        var pathColor  = 0xB0A080;

        // Main clifftop lawn platform
        makeBox(scene, 80, 1, 60, grassColor, 0, 0.5, 0);
        // Gravel path approaching the castle from inland
        makeBox(scene, 6, 0.6, 30, pathColor, 0, 0.8, -30);
        // Terraced ground behind castle (inland side)
        makeBox(scene, 80, 1, 30, 0x5A7A3A, 0, 0.5, -45);
    }

    // ── Castle Main Block ─────────────────────────────────────────────────────
    // Robert Adam neoclassical mansion — honey sandstone
    function buildMainBlock(scene) {
        var sandstone  = 0xD4A97A;
        var roofColor  = 0x5A5565;
        var darkStone  = 0xB8906A;

        // Main mansion body — 22 wide × 16 tall × 14 deep
        makeBox(scene, 22, 16, 14, sandstone, 0, 8, 0);

        // Roof parapet / balustrade row along top
        makeBox(scene, 22, 1.5, 1, sandstone, 0, 16.75, -7.2);
        makeBox(scene, 22, 1.5, 1, sandstone, 0, 16.75,  7.2);
        makeBox(scene, 1, 1.5, 14, sandstone, -11.2, 16.75, 0);
        makeBox(scene, 1, 1.5, 14, sandstone,  11.2, 16.75, 0);

        // Balustrade merlons — south face
        var mxs = [-9, -6, -3, 0, 3, 6, 9];
        for (var m = 0; m < mxs.length; m++) {
            makeBox(scene, 1.5, 1, 0.8, sandstone, mxs[m], 17.75, -7.2);
            makeBox(scene, 1.5, 1, 0.8, sandstone, mxs[m], 17.75,  7.2);
        }

        // South facade pilaster details (Adamesque columns)
        makeCylinder(scene, 0.5, 0.6, 12, 8, darkStone, -8, 6, -7.2);
        makeCylinder(scene, 0.5, 0.6, 12, 8, darkStone,  0, 6, -7.2);
        makeCylinder(scene, 0.5, 0.6, 12, 8, darkStone,  8, 6, -7.2);

        // Pedimented entrance portico — projecting porch
        makeBox(scene, 10, 12, 3, sandstone,  0, 6, -9.5);
        // Pediment triangle top
        makeBox(scene, 10, 2, 0.8, darkStone, 0, 13, -11);
        makeBox(scene, 7,  1, 0.8, darkStone, 0, 14, -11);
        makeBox(scene, 4,  1, 0.8, darkStone, 0, 15, -11);

        // Portico columns
        makeCylinder(scene, 0.6, 0.7, 10, 8, 0xE0C090, -3.5, 5, -11);
        makeCylinder(scene, 0.6, 0.7, 10, 8, 0xE0C090,  3.5, 5, -11);

        // Front door arch (dark insert)
        makeBox(scene, 3, 5, 3.2, 0x2A1A0A, 0, 2.5, -9.5);

        // Ground floor windows — south face
        makeBox(scene, 2, 3, 0.4, 0xC8B070, -8, 5, -7.3);
        makeBox(scene, 2, 3, 0.4, 0xC8B070,  8, 5, -7.3);
        // Ground floor windows — north face (seaward)
        makeBox(scene, 2, 3, 0.4, 0xC8B070, -8, 5, 7.3);
        makeBox(scene, 2, 3, 0.4, 0xC8B070,  0, 5, 7.3);
        makeBox(scene, 2, 3, 0.4, 0xC8B070,  8, 5, 7.3);

        // Upper floor windows (plain glazed)
        makeBox(scene, 2, 3, 0.4, 0xC8B888, -8, 11, -7.3);
        makeBox(scene, 2, 3, 0.4, 0xC8B888,  0, 11, -7.3);
        makeBox(scene, 2, 3, 0.4, 0xC8B888,  8, 11, -7.3);
        makeBox(scene, 2, 3, 0.4, 0xC8B888, -8, 11,  7.3);
        makeBox(scene, 2, 3, 0.4, 0xC8B888,  0, 11,  7.3);
        makeBox(scene, 2, 3, 0.4, 0xC8B888,  8, 11,  7.3);

        // Roof — low hipped slab
        makeBox(scene, 24, 2, 16, roofColor, 0, 18, 0);
        makeBox(scene, 20, 1.5, 12, roofColor, 0, 19.5, 0);

        // Chimney stacks
        makeBox(scene, 2, 5, 2, 0x8A7060, -7, 21, -2);
        makeBox(scene, 2, 5, 2, 0x8A7060,  7, 21, -2);
        makeBox(scene, 2, 5, 2, 0x8A7060, -7, 21,  2);
        makeBox(scene, 2, 5, 2, 0x8A7060,  7, 21,  2);
        // Chimney pots
        makeCylinder(scene, 0.4, 0.5, 1.5, 6, 0x6A5A4A, -7, 24.25, -2);
        makeCylinder(scene, 0.4, 0.5, 1.5, 6, 0x6A5A4A,  7, 24.25, -2);
        makeCylinder(scene, 0.4, 0.5, 1.5, 6, 0x6A5A4A, -7, 24.25,  2);
        makeCylinder(scene, 0.4, 0.5, 1.5, 6, 0x6A5A4A,  7, 24.25,  2);
    }

    // ── Central Round Tower ───────────────────────────────────────────────────
    // The Saloon — Robert Adam's famous oval/round room in the central tower
    function buildCentralTower(scene) {
        var sandstone = 0xD4A97A;
        var roofColor = 0x5A5565;

        // Round tower body — r=5, h=18
        makeCylinder(scene, 5, 5, 18, 16, sandstone, 0, 9, 0);

        // Tower parapet ring
        makeCylinder(scene, 5.4, 5.4, 1.5, 16, 0xC0906A, 0, 18.75, 0);

        // Dome / conical cap
        makeCone(scene, 5, 6, 16, roofColor, 0, 22, 0);

        // Tower windows — upper belt (4 directions)
        makeBox(scene, 2.5, 4, 0.5, 0xC8B888,  0, 14, -5.2);
        makeBox(scene, 2.5, 4, 0.5, 0xC8B888,  0, 14,  5.2);
        makeBox(scene, 0.5, 4, 2.5, 0xC8B888, -5.2, 14, 0);
        makeBox(scene, 0.5, 4, 2.5, 0xC8B888,  5.2, 14, 0);

        // Lower belt windows
        makeBox(scene, 2.5, 3.5, 0.5, 0xC8B888,  0, 7, -5.2);
        makeBox(scene, 2.5, 3.5, 0.5, 0xC8B888,  0, 7,  5.2);
        makeBox(scene, 0.5, 3.5, 2.5, 0xC8B888, -5.2, 7, 0);
        makeBox(scene, 0.5, 3.5, 2.5, 0xC8B888,  5.2, 7, 0);
    }

    // ── Flanking Towers ───────────────────────────────────────────────────────
    // Twin round towers at the east and west ends of the mansion
    function buildFlankingTowers(scene) {
        var sandstone = 0xD4A97A;
        var roofColor = 0x5A5565;

        // West flanking tower
        makeCylinder(scene, 4, 4, 16, 12, sandstone, -15, 8, 0);
        makeCylinder(scene, 4.3, 4.3, 1.5, 12, 0xC0906A, -15, 16.75, 0);
        makeCone(scene, 4, 5, 12, roofColor, -15, 20, 0);
        // West tower windows
        makeBox(scene, 2, 3, 0.4, 0xC8B888, -15, 11, -4.2);
        makeBox(scene, 2, 3, 0.4, 0xC8B888, -15, 11,  4.2);
        makeBox(scene, 0.4, 3, 2, 0xC8B888, -19.2, 11, 0);
        makeBox(scene, 2, 3, 0.4, 0xC8B888, -15,  5, -4.2);
        makeBox(scene, 2, 3, 0.4, 0xC8B888, -15,  5,  4.2);

        // East flanking tower
        makeCylinder(scene, 4, 4, 16, 12, sandstone, 15, 8, 0);
        makeCylinder(scene, 4.3, 4.3, 1.5, 12, 0xC0906A, 15, 16.75, 0);
        makeCone(scene, 4, 5, 12, roofColor, 15, 20, 0);
        // East tower windows
        makeBox(scene, 2, 3, 0.4, 0xC8B888, 15, 11, -4.2);
        makeBox(scene, 2, 3, 0.4, 0xC8B888, 15, 11,  4.2);
        makeBox(scene, 0.4, 3, 2, 0xC8B888, 19.2, 11, 0);
        makeBox(scene, 2, 3, 0.4, 0xC8B888, 15,  5, -4.2);
        makeBox(scene, 2, 3, 0.4, 0xC8B888, 15,  5,  4.2);

        // Connecting wing blocks between towers and main block
        makeBox(scene, 5, 14, 12, sandstone, -8.5, 7, 0);
        makeBox(scene, 5, 14, 12, sandstone,  8.5, 7, 0);
    }

    // ── Eisenhower Apartment Windows ──────────────────────────────────────────
    // Top floor lit windows — Eisenhower was given this apartment in perpetuity
    function buildEisenhowerWindows(scene) {
        var litGlass  = 0xFFDD88;
        var litGlass2 = 0xFFCC66;

        // Top floor south face — warm lit windows
        makeBox(scene, 2.2, 3, 0.45, litGlass, -8, 14.5, -7.4);
        makeBox(scene, 2.2, 3, 0.45, litGlass,  0, 14.5, -7.4);
        makeBox(scene, 2.2, 3, 0.45, litGlass,  8, 14.5, -7.4);

        // Top floor north face — seaward side
        makeBox(scene, 2.2, 3, 0.45, litGlass2, -8, 14.5, 7.4);
        makeBox(scene, 2.2, 3, 0.45, litGlass2,  0, 14.5, 7.4);
        makeBox(scene, 2.2, 3, 0.45, litGlass2,  8, 14.5, 7.4);

        // Flanking tower top windows lit
        makeBox(scene, 2.2, 3, 0.45, litGlass, -15, 13.5, -4.3);
        makeBox(scene, 2.2, 3, 0.45, litGlass,  15, 13.5, -4.3);
        makeBox(scene, 2.2, 3, 0.45, litGlass2, -15, 13.5,  4.3);
        makeBox(scene, 2.2, 3, 0.45, litGlass2,  15, 13.5,  4.3);

        // Small balcony railing indication on seaward side
        makeBox(scene, 10, 0.4, 1, 0x8A7060, 0, 1.2, 8.5);
        makeBox(scene, 0.2, 2, 1, 0x8A7060, -5, 2, 8.5);
        makeBox(scene, 0.2, 2, 1, 0x8A7060,  5, 2, 8.5);
        makeBox(scene, 0.2, 2, 1, 0x8A7060,  0, 2, 8.5);
    }

    // ── Walled Garden ─────────────────────────────────────────────────────────
    // Formal walled garden with parterres — characteristic of Scottish estates
    function buildWalledGarden(scene) {
        var wallColor  = 0x9A8A78;
        var greenBed   = 0x3A6A2A;
        var creamBed   = 0xE8DCC0;
        var pathColor  = 0xB0A080;

        // Garden positioned inland to the north-west
        // Perimeter walls: box 1×4×30 sides
        // North wall
        makeBox(scene, 30, 4, 1, wallColor, -55, 2, -55);
        // South wall
        makeBox(scene, 30, 4, 1, wallColor, -55, 2, -25);
        // East wall (1×4×30)
        makeBox(scene, 1, 4, 30, wallColor, -40, 2, -40);
        // West wall (1×4×30)
        makeBox(scene, 1, 4, 30, wallColor, -70, 2, -40);

        // Garden gate opening (missing segment on south wall)
        makeBox(scene, 10, 4, 1, wallColor, -62, 2, -25);
        makeBox(scene, 10, 4, 1, wallColor, -48, 2, -25);

        // Gate piers
        makeCylinder(scene, 0.6, 0.7, 5, 6, wallColor, -56.5, 2.5, -25);
        makeCylinder(scene, 0.6, 0.7, 5, 6, wallColor, -53.5, 2.5, -25);
        makeSphere(scene, 0.8, 6, 6, 0xC0B090, -56.5, 5.4, -25);
        makeSphere(scene, 0.8, 6, 6, 0xC0B090, -53.5, 5.4, -25);

        // Garden floor — central path
        makeBox(scene, 2, 0.3, 28, pathColor, -55, 1.2, -40);
        makeBox(scene, 28, 0.3, 2, pathColor,  -55, 1.2, -40);

        // Formal parterres — alternating green/cream box beds
        // Quadrant 1 — green
        makeBox(scene, 10, 0.4, 10, greenBed,  -62, 1.2, -47);
        // Quadrant 2 — cream
        makeBox(scene, 10, 0.4, 10, creamBed,  -48, 1.2, -47);
        // Quadrant 3 — cream
        makeBox(scene, 10, 0.4, 10, creamBed,  -62, 1.2, -33);
        // Quadrant 4 — green
        makeBox(scene, 10, 0.4, 10, greenBed,  -48, 1.2, -33);

        // Parterre sub-beds inside each quadrant
        makeBox(scene, 4, 0.5, 4, 0x2A5A1A, -64, 1.5, -49);
        makeBox(scene, 4, 0.5, 4, 0x2A5A1A, -60, 1.5, -45);
        makeBox(scene, 4, 0.5, 4, 0xD0C8A0, -50, 1.5, -49);
        makeBox(scene, 4, 0.5, 4, 0xD0C8A0, -46, 1.5, -45);
        makeBox(scene, 4, 0.5, 4, 0xD0C8A0, -64, 1.5, -35);
        makeBox(scene, 4, 0.5, 4, 0xD0C8A0, -60, 1.5, -31);
        makeBox(scene, 4, 0.5, 4, 0x2A5A1A, -50, 1.5, -35);
        makeBox(scene, 4, 0.5, 4, 0x2A5A1A, -46, 1.5, -31);

        // Sundial at garden centre
        makeBox(scene, 1.5, 0.8, 1.5, 0x9A8A70, -55, 1.4, -40);
        makeCylinder(scene, 0.3, 0.4, 3, 6, 0x888878, -55, 2.9, -40);
        makeBox(scene, 1.2, 0.2, 1.2, 0xB0A888, -55, 4.4, -40);

        // Garden edge wire outline
        makeEdges(scene, 30, 4, 30, 0x7A6A58, -55, 2, -40);
    }

    // ── Gas House ─────────────────────────────────────────────────────────────
    // Round stone building that stored coal gas to light the castle
    function buildGasHouse(scene) {
        var stoneColor = 0x9A8A78;
        var roofColor  = 0x4A4A5A;

        // Round building body — r=4, h=6
        makeCylinder(scene, 4, 4.2, 6, 12, stoneColor, 35, 3, -30);

        // Conical roof
        makeCone(scene, 4.5, 3, 12, roofColor, 35, 7.5, -30);

        // Stone banding
        makeCylinder(scene, 4.3, 4.3, 0.6, 12, 0x8A7A68, 35, 1.3, -30);
        makeCylinder(scene, 4.3, 4.3, 0.6, 12, 0x8A7A68, 35, 4.3, -30);

        // Door — small dark box insert
        makeBox(scene, 1.8, 3, 0.5, 0x2A1A0A, 35, 1.5, -34.3);

        // Small window
        makeBox(scene, 1.2, 1.2, 0.5, 0x8888AA, 35, 4.5, -34.3);

        // Ventilation cap on roof
        makeCylinder(scene, 0.6, 0.8, 1.2, 6, 0x4A4040, 35, 9.6, -30);

        // Connecting pipe (horizontal cylinder to castle)
        makeCylinder(scene, 0.3, 0.3, 10, 6, 0x5A5050, 30, 1, -30);
    }

    // ── Sea Batteries ─────────────────────────────────────────────────────────
    // WWII coastal gun emplacements on the clifftop
    function buildSeaBatteries(scene) {
        var concreteColor = 0x8A8A7A;
        var darkColor     = 0x3A3A3A;
        var metalColor    = 0x4A4A4A;

        // Battery 1 — west position
        // Concrete emplacement platform
        makeBox(scene, 10, 2, 10, concreteColor, -25, 1, 20);
        // Blast wall — L-shape
        makeBox(scene, 10, 3, 1.5, concreteColor, -25, 2.5, 15.25);
        makeBox(scene, 1.5, 3, 10, concreteColor, -30.25, 2.5, 20);
        // Gun mounting ring
        makeCylinder(scene, 2, 2.2, 0.8, 12, darkColor, -25, 2.4, 20);
        // Gun barrel (box approximation)
        makeBox(scene, 8, 1, 1, metalColor, -21, 3.5, 20);
        // Gun shield
        makeBox(scene, 2, 2, 1.5, concreteColor, -25, 3.2, 20);

        // Battery 2 — east position
        makeBox(scene, 10, 2, 10, concreteColor, 25, 1, 20);
        makeBox(scene, 10, 3, 1.5, concreteColor, 25, 2.5, 15.25);
        makeBox(scene, 1.5, 3, 10, concreteColor, 30.25, 2.5, 20);
        makeCylinder(scene, 2, 2.2, 0.8, 12, darkColor, 25, 2.4, 20);
        makeBox(scene, 8, 1, 1, metalColor, 21, 3.5, 20);
        makeBox(scene, 2, 2, 1.5, concreteColor, 25, 3.2, 20);

        // Underground magazine access (dark box)
        makeBox(scene, 3, 2, 3, darkColor, -22, 0.5, 18);
        makeBox(scene, 3, 2, 3, darkColor,  22, 0.5, 18);

        // Observation post — small concrete box on cliff edge
        makeBox(scene, 4, 3, 4, concreteColor, 0, 1.5, 28);
        // Observation slit
        makeBox(scene, 3, 0.8, 0.5, darkColor, 0, 2.8, 30.3);
        // Observation post roof
        makeBox(scene, 4.5, 0.6, 4.5, concreteColor, 0, 3.3, 28);

        // Searchlight position
        makeCylinder(scene, 1.5, 1.8, 1, 8, concreteColor, -10, 1, 26);
        makeCylinder(scene, 0.6, 0.6, 4, 6, metalColor, -10, 3, 26);
        makeSphere(scene, 1, 8, 6, 0xCCCCCC, -10, 5.5, 26);

        // Barbed wire / perimeter detail (LineSegments)
        var wirePoints = [
            new THREE.Vector3(WX - 35, 1, WZ + 14),
            new THREE.Vector3(WX - 15, 1, WZ + 14),
            new THREE.Vector3(WX - 15, 1, WZ + 14),
            new THREE.Vector3(WX +  0, 1, WZ + 14),
            new THREE.Vector3(WX +  0, 1, WZ + 14),
            new THREE.Vector3(WX + 15, 1, WZ + 14),
            new THREE.Vector3(WX + 15, 1, WZ + 14),
            new THREE.Vector3(WX + 35, 1, WZ + 14)
        ];
        var wireGeo = new THREE.BufferGeometry().setFromPoints(wirePoints);
        var wireMat = new THREE.LineBasicMaterial({ color: 0x888888 });
        var wire = new THREE.LineSegments(wireGeo, wireMat);
        scene.add(wire);
    }

    // ── Castle Grounds and Approaches ────────────────────────────────────────
    function buildGrounds(scene) {
        var sandstone = 0xD4A97A;

        // Courtyard terrace to seaward side (south)
        makeBox(scene, 26, 0.6, 8, 0xC0A870, 0, 0.8, 12);

        // Ha-ha wall (sunken retaining wall, keeps cattle out)
        makeBox(scene, 50, 3, 1, 0x9A8A70, 0, -0.5, 18);

        // Carriageway approach from east
        makeBox(scene, 30, 0.4, 5, 0xA09070, 35, 0.7, -10);

        // Trees — mature scots pines flanking approach
        var trunkCol = 0x3B2F2F;
        var leafCol  = 0x2A5A1A;
        var treePos = [
            [30, -20], [30, -5], [30, 5],
            [40, -20], [40, -5], [40, 5],
            [-30, -20], [-30, -5]
        ];
        for (var t = 0; t < treePos.length; t++) {
            var tx = treePos[t][0];
            var tz = treePos[t][1];
            makeCylinder(scene, 0.5, 0.7, 7, 6, trunkCol, tx, 3.5, tz);
            makeCone(scene, 2.5, 7, 7, leafCol, tx, 10, tz);
            makeCone(scene, 2, 5, 7, leafCol, tx, 12, tz);
        }

        // Fountain / ornamental feature on terrace
        makeCylinder(scene, 2.5, 2.8, 0.8, 12, 0xB0A090, 0, 1.2, 12);
        makeCylinder(scene, 0.3, 0.3, 3, 6, 0x9A9090, 0, 2.8, 12);
        makeCylinder(scene, 1.5, 1.5, 0.4, 12, 0xB0A090, 0, 4.2, 12);

        // Stone gate piers at estate entrance
        makeBox(scene, 2, 5, 2, sandstone, -5, 2.5, -65);
        makeBox(scene, 2, 5, 2, sandstone,  5, 2.5, -65);
        makeSphere(scene, 1, 8, 8, sandstone, -5, 5.5, -65);
        makeSphere(scene, 1, 8, 8, sandstone,  5, 5.5, -65);
        // Iron gate (thin dark bars)
        makeBox(scene, 0.2, 4, 0.2, 0x2A2A2A, -3, 2, -65);
        makeBox(scene, 0.2, 4, 0.2, 0x2A2A2A, -1, 2, -65);
        makeBox(scene, 0.2, 4, 0.2, 0x2A2A2A,  1, 2, -65);
        makeBox(scene, 0.2, 4, 0.2, 0x2A2A2A,  3, 2, -65);
        makeBox(scene, 8, 0.3, 0.2, 0x2A2A2A,  0, 4, -65);

        // Wall connecting gate piers inland
        makeBox(scene, 1, 3.5, 30, sandstone, -14, 1.75, -50);
        makeBox(scene, 1, 3.5, 30, sandstone,  14, 1.75, -50);
    }

    // ── Lighting ──────────────────────────────────────────────────────────────
    function buildLighting(scene) {
        // Overcast west-coast Scottish light
        var ambient = new THREE.AmbientLight(0xCCDDEE, 0.55);
        scene.add(ambient);

        // Sun low in the west over the Firth of Clyde
        var sun = new THREE.DirectionalLight(0xFFEECC, 0.85);
        sun.position.set(WX - 60, 80, WZ + 40);
        scene.add(sun);

        // Cool sea-reflected fill
        var seaFill = new THREE.DirectionalLight(0xAABBCC, 0.3);
        seaFill.position.set(WX + 20, 30, WZ + 80);
        scene.add(seaFill);
    }

    // ── Public API ────────────────────────────────────────────────────────────
    function init(scene) {
        buildCliff(scene);
        buildPlatform(scene);
        buildMainBlock(scene);
        buildCentralTower(scene);
        buildFlankingTowers(scene);
        buildEisenhowerWindows(scene);
        buildWalledGarden(scene);
        buildGasHouse(scene);
        buildSeaBatteries(scene);
        buildGrounds(scene);
        buildLighting(scene);
    }

    return {
        init: init,
        worldX: WX,
        worldZ: WZ
    };

}());
