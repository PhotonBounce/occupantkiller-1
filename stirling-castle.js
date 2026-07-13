window.StirlingCastle = (function() {
    'use strict';

    var WX = 1900;
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

    // ── Castle Rock Base ──────────────────────────────────────────────────────
    // Volcanic basalt rock rising 20 units in stacked irregular tiers
    function buildCastleRock(scene) {
        var basalt = 0x4A4A4A;
        var basaltDark = 0x3A3A3A;
        var basaltMid  = 0x525252;

        // Tier 1 — widest base slab
        makeBox(scene, 80, 4, 70, basaltDark,  0,  2,   0);
        // Tier 2 — narrowing
        makeBox(scene, 70, 4, 60, basalt,      0,  6,  -2);
        // Tier 3
        makeBox(scene, 60, 4, 52, basaltMid,   2,  10,  -2);
        // Tier 4 — near summit
        makeBox(scene, 50, 4, 44, basalt,      2,  14,  -2);
        // Tier 5 — summit platform
        makeBox(scene, 44, 4, 38, basaltDark,  2,  18,  -2);

        // Rocky outcrops and irregularity lumps
        makeBox(scene, 12, 6, 10, basalt,     -30,  5,  18);
        makeBox(scene, 10, 5,  8, basaltMid,   30,  5,  15);
        makeBox(scene, 14, 8, 10, basaltDark, -28,  6, -20);
        makeBox(scene, 10, 6,  8, basalt,      32,  6, -18);
        makeBox(scene, 18, 3, 14, basaltDark,  0,  22,  12);
        makeBox(scene, 16, 3, 12, basaltMid,  -4,  22, -14);
    }

    // ── Great Hall ────────────────────────────────────────────────────────────
    // Massive medieval hall on the castle summit — golden sandstone
    function buildGreatHall(scene) {
        var sandstone  = 0xD4A97A;
        var glassBlue  = 0x4A7FA5;
        var glassGreen = 0x4A9A6A;
        var roofSlate  = 0x5A5A6A;

        // Hall body: 24 wide × 10 tall × 12 deep, summit at y≈22
        makeBox(scene,  24, 10, 12, sandstone,  0, 27, 0);

        // Roof pitched ridge — two sloping slab approximations
        makeBox(scene, 25, 2, 7, roofSlate,  0, 33,  -2.5);
        makeBox(scene, 25, 2, 7, roofSlate,  0, 33,   2.5);
        makeBox(scene, 25, 1, 1, roofSlate,  0, 35,   0);  // ridge

        // Thick end walls (gable)
        makeBox(scene,  2, 10, 12, sandstone, -13, 27, 0);
        makeBox(scene,  2, 10, 12, sandstone,  13, 27, 0);

        // Gothic windows — south face: 3 tall narrow glass inserts
        makeBox(scene, 2, 4, 0.4, glassBlue,  -7, 28, -6.2);
        makeBox(scene, 2, 4, 0.4, glassBlue,   0, 28, -6.2);
        makeBox(scene, 2, 4, 0.4, glassBlue,   7, 28, -6.2);

        // Gothic windows — north face
        makeBox(scene, 2, 4, 0.4, glassGreen, -7, 28,  6.2);
        makeBox(scene, 2, 4, 0.4, glassGreen,  0, 28,  6.2);
        makeBox(scene, 2, 4, 0.4, glassGreen,  7, 28,  6.2);

        // Pointed window arch tops (small dark caps)
        makeBox(scene, 2, 1, 0.4, 0xC09060, -7, 30.5, -6.2);
        makeBox(scene, 2, 1, 0.4, 0xC09060,  0, 30.5, -6.2);
        makeBox(scene, 2, 1, 0.4, 0xC09060,  7, 30.5, -6.2);
        makeBox(scene, 2, 1, 0.4, 0xC09060, -7, 30.5,  6.2);
        makeBox(scene, 2, 1, 0.4, 0xC09060,  0, 30.5,  6.2);
        makeBox(scene, 2, 1, 0.4, 0xC09060,  7, 30.5,  6.2);

        // Buttresses along the hall sides
        makeBox(scene,  3, 10, 3, sandstone, -10, 27, -7);
        makeBox(scene,  3, 10, 3, sandstone,  10, 27, -7);
        makeBox(scene,  3, 10, 3, sandstone, -10, 27,  7);
        makeBox(scene,  3, 10, 3, sandstone,  10, 27,  7);

        // Battlements along the parapet
        var merlonColor = sandstone;
        var mXs = [-10, -6, -2, 2, 6, 10];
        for (var m = 0; m < mXs.length; m++) {
            makeBox(scene, 2, 1.5, 1, merlonColor, mXs[m], 33, -7);
            makeBox(scene, 2, 1.5, 1, merlonColor, mXs[m], 33,  7);
        }

        // Corner towers flanking the hall
        var towerColor = 0xC09868;
        makeCylinder(scene, 3, 3, 14, 8, towerColor, -13, 29, -7);
        makeCylinder(scene, 3, 3, 14, 8, towerColor,  13, 29, -7);
        makeCylinder(scene, 3, 3, 14, 8, towerColor, -13, 29,  7);
        makeCylinder(scene, 3, 3, 14, 8, towerColor,  13, 29,  7);

        // Cone caps on corner towers
        makeCone(scene, 3, 4, 8, roofSlate, -13, 37, -7);
        makeCone(scene, 3, 4, 8, roofSlate,  13, 37, -7);
        makeCone(scene, 3, 4, 8, roofSlate, -13, 37,  7);
        makeCone(scene, 3, 4, 8, roofSlate,  13, 37,  7);

        // Gatehouse / entrance porch — south side
        makeBox(scene, 8, 8, 4, sandstone,  0, 26, -10);
        makeBox(scene, 6, 1, 4, roofSlate,  0, 30, -10);

        // Portcullis archway — dark insert
        makeBox(scene, 3, 4, 4.2, 0x1A1A1A,  0, 24, -10);
    }

    // ── Curtain Walls ─────────────────────────────────────────────────────────
    // Defensive outer walls on the summit
    function buildCurtainWalls(scene) {
        var wallColor = 0xB89060;

        // North wall segment
        makeBox(scene, 44, 6, 2, wallColor,  2, 24, -22);
        // South wall segment
        makeBox(scene, 44, 6, 2, wallColor,  2, 24,  20);
        // East wall
        makeBox(scene,  2, 6, 42, wallColor, 24, 24,  -2);
        // West wall
        makeBox(scene,  2, 6, 42, wallColor,-20, 24,  -2);

        // Merlons on north wall
        var mNs = [-18, -12, -6, 0, 6, 12, 18];
        for (var n = 0; n < mNs.length; n++) {
            makeBox(scene, 2, 1.5, 1, wallColor, mNs[n] + 2, 27.75, -22);
            makeBox(scene, 2, 1.5, 1, wallColor, mNs[n] + 2, 27.75,  20);
        }

        // Wall towers at corners
        makeCylinder(scene, 2.5, 2.5, 8, 8, 0xA07850, -20, 25, -22);
        makeCylinder(scene, 2.5, 2.5, 8, 8, 0xA07850,  24, 25, -22);
        makeCylinder(scene, 2.5, 2.5, 8, 8, 0xA07850, -20, 25,  20);
        makeCylinder(scene, 2.5, 2.5, 8, 8, 0xA07850,  24, 25,  20);
    }

    // ── Wallace Monument ──────────────────────────────────────────────────────
    // 220ft Victorian tower on Abbey Craig — northeast of castle
    function buildWallaceMonument(scene) {
        var monColor  = 0x9A8A78;
        var darkStone = 0x7A6A58;
        var roofColor = 0x3A3A4A;

        // Abbey Craig rocky base
        makeBox(scene, 22, 8, 22, 0x5A5040, 80, 4, -70);
        makeBox(scene, 16, 6, 16, 0x4A4030, 80, 10, -70);
        makeBox(scene, 12, 4, 12, 0x5A5040, 80, 14, -70);

        // Octagonal tower body (approximated as 4×30×4 box)
        makeBox(scene,  4, 30,  4, monColor,  80, 31, -70);

        // Tower buttresses to add octagonal feel
        makeBox(scene,  6,  28, 2, monColor,  80, 30, -70);
        makeBox(scene,  2,  28, 6, monColor,  80, 30, -70);

        // Horizontal band details every 8 units
        makeBox(scene,  6.5, 0.8, 6.5, darkStone, 80, 22, -70);
        makeBox(scene,  6.5, 0.8, 6.5, darkStone, 80, 30, -70);
        makeBox(scene,  6.5, 0.8, 6.5, darkStone, 80, 38, -70);

        // Crown — stepped top
        makeBox(scene,  7, 3, 7, monColor,   80, 47, -70);
        makeBox(scene,  5, 2, 5, monColor,   80, 51, -70);

        // Crown spikes / pinnacles at 4 corners
        makeCylinder(scene, 0.5, 0.5, 4, 6, darkStone, 77, 53, -73);
        makeCylinder(scene, 0.5, 0.5, 4, 6, darkStone, 83, 53, -73);
        makeCylinder(scene, 0.5, 0.5, 4, 6, darkStone, 77, 53, -67);
        makeCylinder(scene, 0.5, 0.5, 4, 6, darkStone, 83, 53, -67);
        makeCone(scene, 0.5, 2, 6, roofColor, 77, 57, -73);
        makeCone(scene, 0.5, 2, 6, roofColor, 83, 57, -73);
        makeCone(scene, 0.5, 2, 6, roofColor, 77, 57, -67);
        makeCone(scene, 0.5, 2, 6, roofColor, 83, 57, -67);

        // Main spire cap
        makeCone(scene, 1.5, 5, 8, roofColor, 80, 55, -70);

        // Arrow-slit windows (dark inserts)
        makeBox(scene, 0.5, 2, 0.2, 0x1A1A1A, 80, 28, -72.1);
        makeBox(scene, 0.5, 2, 0.2, 0x1A1A1A, 80, 36, -72.1);
        makeBox(scene, 0.5, 2, 0.2, 0x1A1A1A, 80, 44, -72.1);

        // Visitor centre at base
        makeBox(scene, 14, 4, 10, 0xC0B090, 80, 20, -58);
        makeBox(scene, 14, 0.5, 10, 0x8A8A7A, 80, 22.25, -58);
    }

    // ── Bannockburn Battlefield ───────────────────────────────────────────────
    // Open flat area with Bruce statue and battlefield markers
    function buildBannockburn(scene) {
        var groundColor = 0x5A7A3A;
        var stoneColor  = 0x888878;

        // Battlefield open ground
        makeBox(scene, 80, 0.4, 60, groundColor, -80, 0.2, 60);

        // Trampled earth in main battle area
        makeBox(scene, 50, 0.3, 40, 0x7A6A50, -80, 0.3, 60);

        // Robert the Bruce statue — cylindrical post on plinth
        // Plinth base
        makeBox(scene, 3, 1, 3, stoneColor, -80, 0.5, 60);
        makeBox(scene, 2.5, 1, 2.5, stoneColor, -80, 1.5, 60);
        // Figure post (body)
        makeCylinder(scene, 0.4, 0.5, 3.5, 8, 0x5A4A3A, -80, 4.25, 60);
        // Head sphere
        makeSphere(scene, 0.5, 8, 8, 0x8A7A6A, -80, 6.5, 60);
        // Raised arm (horizontal box)
        makeBox(scene, 2, 0.3, 0.3, 0x5A4A3A, -78.5, 5.5, 60);
        // Sword (thin vertical box)
        makeBox(scene, 0.15, 2.5, 0.15, 0x888888, -77, 6.5, 60);

        // Battlefield marker stones (4 positions)
        makeBox(scene, 1, 2, 0.4, stoneColor, -70, 1, 55);
        makeBox(scene, 1, 2, 0.4, stoneColor, -75, 1, 75);
        makeBox(scene, 1, 2, 0.4, stoneColor, -90, 1, 58);
        makeBox(scene, 1, 2, 0.4, stoneColor, -95, 1, 70);

        // Informational panel boards
        makeBox(scene, 3, 2, 0.2, 0x996633, -68, 2, 60);
        makeBox(scene, 3, 2, 0.2, 0x996633, -92, 2, 65);

        // Heritage visitor flag poles
        makeCylinder(scene, 0.15, 0.15, 8, 6, 0x888888, -65, 4, 60);
        makeCylinder(scene, 0.15, 0.15, 8, 6, 0x888888, -65, 4, 55);
        // Flag boxes at top
        makeBox(scene, 2.5, 1.5, 0.1, 0x003399, -63.75, 8.25, 60);
        makeBox(scene, 2.5, 1.5, 0.1, 0x006633, -63.75, 8.25, 55);

        // Battle re-enactment area rope lines (LineSegments)
        var ropePoints = [
            new THREE.Vector3(WX - 100, 1, WZ + 45),
            new THREE.Vector3(WX - 55,  1, WZ + 45),
            new THREE.Vector3(WX - 55,  1, WZ + 85),
            new THREE.Vector3(WX - 100, 1, WZ + 85),
            new THREE.Vector3(WX - 100, 1, WZ + 45)
        ];
        var ropeGeo = new THREE.BufferGeometry().setFromPoints(ropePoints);
        var ropeMat = new THREE.LineBasicMaterial({ color: 0xCC9933 });
        var rope = new THREE.LineSegments(ropeGeo, ropeMat);
        scene.add(rope);
    }

    // ── Stirling Old Bridge ───────────────────────────────────────────────────
    // 16th-century narrow bridge with 4 arch piers
    function buildOldBridge(scene) {
        var bridgeColor  = 0xA09070;
        var waterColor   = 0x2A6A8A;
        var pierColor    = 0x887A60;

        // River Forth — water surface below the bridge
        makeBox(scene, 60, 0.4, 18, waterColor, -50, -0.2, -45);

        // Main bridge deck — 30×3×5 narrow span
        makeBox(scene, 30, 3, 5, bridgeColor, -45, 4, -45);

        // Approach ramps
        makeBox(scene, 8, 2, 5, 0x9A8A6A, -31, 3, -45);
        makeBox(scene, 8, 2, 5, 0x9A8A6A, -61, 3, -45);

        // 4 arch piers beneath bridge deck
        // Pier 1
        makeBox(scene, 3, 5, 4, pierColor, -38, 2.5, -45);
        // Pier arch opening (dark box cutout visual)
        makeBox(scene, 1.5, 2, 4.2, 0x1A1A1A, -38, 2, -45);

        // Pier 2
        makeBox(scene, 3, 5, 4, pierColor, -44, 2.5, -45);
        makeBox(scene, 1.5, 2, 4.2, 0x1A1A1A, -44, 2, -45);

        // Pier 3
        makeBox(scene, 3, 5, 4, pierColor, -50, 2.5, -45);
        makeBox(scene, 1.5, 2, 4.2, 0x1A1A1A, -50, 2, -45);

        // Pier 4
        makeBox(scene, 3, 5, 4, pierColor, -56, 2.5, -45);
        makeBox(scene, 1.5, 2, 4.2, 0x1A1A1A, -56, 2, -45);

        // Parapet walls along bridge edges
        makeBox(scene, 30, 1.5, 0.6, bridgeColor, -45, 6.25, -42.7);
        makeBox(scene, 30, 1.5, 0.6, bridgeColor, -45, 6.25, -47.3);

        // Parapet merlons
        var bXs = [-56, -52, -48, -44, -40, -36, -32];
        for (var b = 0; b < bXs.length; b++) {
            makeBox(scene, 1.5, 1, 0.6, bridgeColor, bXs[b], 7.5, -42.7);
            makeBox(scene, 1.5, 1, 0.6, bridgeColor, bXs[b], 7.5, -47.3);
        }

        // Toll booth at south end of bridge
        makeBox(scene, 4, 5, 4, 0xC0A870, -30, 2.5, -45);
        makeBox(scene, 4, 0.5, 4, 0x7A6A50, -30, 5.25, -45);
        makeBox(scene, 1, 3, 0.3, 0x4A3A2A, -30, 1.5, -47.2);

        // Historical marker post at bridge entrance
        makeCylinder(scene, 0.2, 0.2, 4, 6, 0x555555, -27, 2, -45);
        makeSphere(scene, 0.4, 6, 6, 0xCC8800, -27, 4.5, -45);

        // River bank reeds (cylinder clusters)
        makeCylinder(scene, 0.15, 0.15, 3, 6, 0x6A8A4A, -35, 1.5, -53);
        makeCylinder(scene, 0.15, 0.15, 3, 6, 0x6A8A4A, -36, 1.5, -52);
        makeCylinder(scene, 0.15, 0.15, 3, 6, 0x6A8A4A, -64, 1.5, -53);
        makeCylinder(scene, 0.15, 0.15, 3, 6, 0x6A8A4A, -63, 1.5, -52);

        // Bridge outline edges for detail
        makeEdges(scene, 30, 3, 5, 0x7A6A50, -45, 4, -45);
    }

    // ── Cowane's Hospital ─────────────────────────────────────────────────────
    // Charitable institution — golden sandstone with clock tower
    function buildCowanesHospital(scene) {
        var wallColor  = 0xD4B483;
        var roofColor  = 0x5A5A6A;
        var clockColor = 0xC0A870;
        var darkColor  = 0x2A2A2A;

        // Main building body — 16×8×10
        makeBox(scene, 16, 8, 10, wallColor, -50, 4, -5);

        // Roof — pitched with two slabs
        makeBox(scene, 17, 2, 5.5, roofColor, -50, 9,  -7.25);
        makeBox(scene, 17, 2, 5.5, roofColor, -50, 9,  -2.75);
        makeBox(scene, 17, 0.6, 1, roofColor, -50, 10.3, -5); // ridge

        // End gables
        makeBox(scene, 2, 8, 10, wallColor, -59, 4, -5);
        makeBox(scene, 2, 8, 10, wallColor, -41, 4, -5);

        // Clock tower on main facade — rises above building
        makeBox(scene, 4, 12, 4, clockColor, -50, 10, -5);
        // Clock face (round-ish flat box inserts each side)
        makeBox(scene, 2.5, 2.5, 0.3, 0xF5F5DC, -50, 14, -7.2);
        makeBox(scene, 2.5, 2.5, 0.3, 0xF5F5DC, -50, 14, -2.8);
        makeCone(scene, 2, 3, 4, roofColor, -50, 17, -5);

        // Entrance porch — colonnade columns
        makeCylinder(scene, 0.4, 0.4, 4, 8, wallColor, -47, 2, -10.5);
        makeCylinder(scene, 0.4, 0.4, 4, 8, wallColor, -50, 2, -10.5);
        makeCylinder(scene, 0.4, 0.4, 4, 8, wallColor, -53, 2, -10.5);
        // Porch lintel
        makeBox(scene, 8, 0.6, 1, wallColor, -50, 4.3, -10.5);

        // Windows — 3 per long side
        makeBox(scene, 2, 3, 0.3, 0x87CEEB, -56, 5, -10.2);
        makeBox(scene, 2, 3, 0.3, 0x87CEEB, -50, 5, -10.2);
        makeBox(scene, 2, 3, 0.3, 0x87CEEB, -44, 5, -10.2);
        makeBox(scene, 2, 3, 0.3, 0x87CEEB, -56, 5,  0.2);
        makeBox(scene, 2, 3, 0.3, 0x87CEEB, -50, 5,  0.2);
        makeBox(scene, 2, 3, 0.3, 0x87CEEB, -44, 5,  0.2);

        // Garden wall enclosure
        makeBox(scene, 20, 2, 1, wallColor, -50, 1, -16);
        makeBox(scene, 1, 2, 12, wallColor, -40, 1, -10);
        makeBox(scene, 1, 2, 12, wallColor, -60, 1, -10);

        // Gate piers
        makeCylinder(scene, 0.5, 0.5, 3, 6, 0xC0A870, -47, 1.5, -16);
        makeCylinder(scene, 0.5, 0.5, 3, 6, 0xC0A870, -53, 1.5, -16);
        makeSphere(scene, 0.6, 6, 6, 0xC0A870, -47, 3.1, -16);
        makeSphere(scene, 0.6, 6, 6, 0xC0A870, -53, 3.1, -16);

        // Sundial / statue plinth in garden
        makeBox(scene, 1.5, 1, 1.5, 0x9A8A70, -50, 0.5, -13);
        makeBox(scene, 1, 1.5, 1, 0x9A8A70, -50, 1.75, -13);
        makeSphere(scene, 0.4, 6, 6, 0xCC9944, -50, 2.7, -13);
    }

    // ── Outer Castle Grounds ──────────────────────────────────────────────────
    function buildGrounds(scene) {
        // General cobblestone ground around castle
        makeBox(scene, 120, 0.4, 100, 0x7A7060, 0, 0.2, 0);

        // Esplanade to south (visitors approach)
        makeBox(scene, 40, 0.3, 30, 0x9A9080, 0, 0.25, -35);

        // Pathways
        makeBox(scene, 4, 0.35, 30, 0x888070, 0, 0.25, -50);

        // Cemetery nearby (historical — old gravestones)
        var gstoneColor = 0x9A9A9A;
        makeBox(scene, 0.5, 2, 0.2, gstoneColor,  30, 1, -30);
        makeBox(scene, 0.5, 2, 0.2, gstoneColor,  32, 1, -30);
        makeBox(scene, 0.5, 2, 0.2, gstoneColor,  34, 1, -30);
        makeBox(scene, 0.5, 2, 0.2, gstoneColor,  36, 1, -30);
        makeBox(scene, 0.5, 1.5, 0.2, gstoneColor, 30, 1, -33);
        makeBox(scene, 0.5, 1.5, 0.2, gstoneColor, 33, 1, -33);

        // Trees
        var trunkColor = 0x3B2F2F;
        var leafColor  = 0x2D5A1B;
        var treeXZs = [
            [20, -30], [-20, -30], [25, 30], [-25, 30],
            [35, -20], [-35, -20], [40, 15], [-40, 15]
        ];
        for (var t = 0; t < treeXZs.length; t++) {
            var tx = treeXZs[t][0];
            var tz = treeXZs[t][1];
            makeCylinder(scene, 0.5, 0.7, 5, 6, trunkColor, tx, 2.5, tz);
            makeSphere(scene, 3, 7, 7, leafColor, tx, 7.5, tz);
        }

        // Statue of William Wallace near esplanade
        makeBox(scene, 1.5, 1, 1.5, 0x9A9080, 8, 0.5, -38);
        makeCylinder(scene, 0.3, 0.35, 3, 8, 0x5A4A3A, 8, 2.5, -38);
        makeSphere(scene, 0.45, 8, 8, 0x7A6A5A, 8, 4.5, -38);

        // General ground edge details
        makeEdges(scene, 40, 0.3, 30, 0x666055, 0, 0.25, -35);
    }

    // ── Lighting ──────────────────────────────────────────────────────────────
    function buildLighting(scene) {
        var ambient = new THREE.AmbientLight(0xFFEECC, 0.5);
        scene.add(ambient);

        var sun = new THREE.DirectionalLight(0xFFEEAA, 0.9);
        sun.position.set(WX + 50, 120, WZ - 80);
        scene.add(sun);

        var fill = new THREE.DirectionalLight(0xCCDDFF, 0.3);
        fill.position.set(WX - 60, 40, WZ + 60);
        scene.add(fill);
    }

    // ── Public API ────────────────────────────────────────────────────────────
    function init(scene) {
        buildCastleRock(scene);
        buildGreatHall(scene);
        buildCurtainWalls(scene);
        buildWallaceMonument(scene);
        buildBannockburn(scene);
        buildOldBridge(scene);
        buildCowanesHospital(scene);
        buildGrounds(scene);
        buildLighting(scene);
    }

    return {
        init: init,
        worldX: WX,
        worldZ: WZ
    };

}());
