window.ThreeaveCastle = (function () {
    'use strict';

    var scene = null;
    var camera = null;
    var objects = [];

    var OX = 20760;
    var OY = 0;
    var OZ = 0;

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
        objects = [];
        build();
    }

    function makeMesh(geometry, color, x, y, z, rx, ry, rz) {
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geometry, mat);
        mesh.position.set(OX + (x || 0), OY + (y || 0), OZ + (z || 0));
        if (rx) mesh.rotation.x = rx;
        if (ry) mesh.rotation.y = ry;
        if (rz) mesh.rotation.z = rz;
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function build() {
        buildRiverIsland();
        buildRiverDee();
        buildThreaveMainTower();
        buildParapet();
        buildHangingStones();
        buildArtilleryWall();
        buildGunTowers();
        buildLandingStage();
        buildRowingBoat();
        buildThreaveGardens();
        buildCastleDouglasTown();
        buildCarlingwarkLoch();
        buildReedBeds();
        buildGallowayHills();
        buildFarmhouses();
        buildBeltedGallowayCattle();
        buildSurroundingFields();
        buildScatteredTrees();
    }

    // --- River Island (small grassy tidal island) ---
    function buildRiverIsland() {
        // Main island body — slightly raised flat box
        makeMesh(new THREE.BoxGeometry(80, 3, 50), 0x4a7c3f, 0, -0.5, 0);
        // Island surface grass hump central
        makeMesh(new THREE.BoxGeometry(60, 2, 36), 0x3d6b34, 0, 1.5, 0);
        // Island edges — lower grassy strips
        makeMesh(new THREE.BoxGeometry(80, 1, 6), 0x3a6030, 0, 0.5, -22);
        makeMesh(new THREE.BoxGeometry(80, 1, 6), 0x3a6030, 0, 0.5, 22);
        makeMesh(new THREE.BoxGeometry(8, 1, 38), 0x3a6030, -36, 0.5, 0);
        makeMesh(new THREE.BoxGeometry(8, 1, 38), 0x3a6030, 36, 0.5, 0);
        // Muddy shoreline strip around island
        makeMesh(new THREE.BoxGeometry(90, 0.5, 60), 0x5c4a32, 0, -1.5, 0);
    }

    // --- River Dee surrounding island ---
    function buildRiverDee() {
        // Wide river body
        makeMesh(new THREE.BoxGeometry(400, 1, 200), 0x006994, 0, -3, 0);
        // River near island — slightly raised water plane around island
        makeMesh(new THREE.BoxGeometry(200, 0.8, 100), 0x0077aa, 0, -2, 0);
        // River banks — far bank north
        makeMesh(new THREE.BoxGeometry(400, 4, 40), 0x4a7c3f, 0, -2, -120);
        // River bank south
        makeMesh(new THREE.BoxGeometry(400, 4, 40), 0x4a7c3f, 0, -2, 120);
        // Rocky riverbed visible patches
        makeMesh(new THREE.BoxGeometry(20, 0.3, 12), 0x7a7060, -60, -2.5, 30);
        makeMesh(new THREE.BoxGeometry(14, 0.3, 10), 0x7a7060, 70, -2.5, -25);
    }

    // --- Threave Main Tower (4-storey plain tower house) ---
    function buildThreaveMainTower() {
        // Foundation plinth
        makeMesh(new THREE.BoxGeometry(22, 2, 18), 0x7a6545, 0, 1, 0);
        // Ground floor — massive thick walls, very plain
        makeMesh(new THREE.BoxGeometry(20, 8, 16), 0x8B7355, 0, 6, 0);
        // First floor
        makeMesh(new THREE.BoxGeometry(20, 7, 16), 0x857050, 0, 13.5, 0);
        // Second floor
        makeMesh(new THREE.BoxGeometry(20, 7, 16), 0x8B7355, 0, 20.5, 0);
        // Third floor (top storey)
        makeMesh(new THREE.BoxGeometry(20, 7, 16), 0x857050, 0, 27.5, 0);
        // Wall top / wallhead course
        makeMesh(new THREE.BoxGeometry(22, 1.5, 18), 0x7a6545, 0, 31.5, 0);

        // Window embrasures — small slitted openings (dark recessed boxes)
        // Ground floor slits
        makeMesh(new THREE.BoxGeometry(1, 2.5, 0.5), 0x3a3028, 5, 6, -8);
        makeMesh(new THREE.BoxGeometry(1, 2.5, 0.5), 0x3a3028, -5, 6, -8);
        // First floor windows
        makeMesh(new THREE.BoxGeometry(1.5, 3, 0.5), 0x3a3028, 5, 13, -8);
        makeMesh(new THREE.BoxGeometry(1.5, 3, 0.5), 0x3a3028, -5, 13, -8);
        makeMesh(new THREE.BoxGeometry(1.5, 3, 0.5), 0x3a3028, 0, 13, -8);
        // Second floor windows
        makeMesh(new THREE.BoxGeometry(1.5, 3, 0.5), 0x3a3028, 5, 20, -8);
        makeMesh(new THREE.BoxGeometry(1.5, 3, 0.5), 0x3a3028, -5, 20, -8);
        makeMesh(new THREE.BoxGeometry(1.5, 3, 0.5), 0x3a3028, 0, 20, -8);
        // Third floor windows
        makeMesh(new THREE.BoxGeometry(1.5, 3, 0.5), 0x3a3028, 5, 27, -8);
        makeMesh(new THREE.BoxGeometry(1.5, 3, 0.5), 0x3a3028, -5, 27, -8);
        // East side slits
        makeMesh(new THREE.BoxGeometry(0.5, 2.5, 1), 0x3a3028, 10, 13, 0);
        makeMesh(new THREE.BoxGeometry(0.5, 2.5, 1), 0x3a3028, 10, 20, 0);

        // Entrance doorway — narrow, arched-ish
        makeMesh(new THREE.BoxGeometry(2.5, 4, 0.6), 0x2a2018, 0, 4, -8);
    }

    // --- Corbelled parapet with merlons ---
    function buildParapet() {
        // Corbel course — slightly oversailing the walls
        makeMesh(new THREE.BoxGeometry(24, 2, 20), 0x7a6545, 0, 33.5, 0);

        // Merlons (battlements) — North wall
        makeMesh(new THREE.BoxGeometry(3, 3, 2), 0x8B7355, -8, 36, -10);
        makeMesh(new THREE.BoxGeometry(3, 3, 2), 0x8B7355, 0, 36, -10);
        makeMesh(new THREE.BoxGeometry(3, 3, 2), 0x8B7355, 8, 36, -10);
        // South wall merlons
        makeMesh(new THREE.BoxGeometry(3, 3, 2), 0x8B7355, -8, 36, 10);
        makeMesh(new THREE.BoxGeometry(3, 3, 2), 0x8B7355, 0, 36, 10);
        makeMesh(new THREE.BoxGeometry(3, 3, 2), 0x8B7355, 8, 36, 10);
        // East wall merlons
        makeMesh(new THREE.BoxGeometry(2, 3, 3), 0x8B7355, 12, 36, -4);
        makeMesh(new THREE.BoxGeometry(2, 3, 3), 0x8B7355, 12, 36, 4);
        // West wall merlons
        makeMesh(new THREE.BoxGeometry(2, 3, 3), 0x8B7355, -12, 36, -4);
        makeMesh(new THREE.BoxGeometry(2, 3, 3), 0x8B7355, -12, 36, 4);
    }

    // --- Hanging stones (corbels for executing enemies) ---
    function buildHangingStones() {
        // Projecting corbels on parapet from which enemies were hanged
        makeMesh(new THREE.BoxGeometry(1.2, 0.8, 1.2), 0x6a5540, -6, 34.5, -10);
        makeMesh(new THREE.BoxGeometry(1.2, 0.8, 1.2), 0x6a5540, 0, 34.5, -10);
        makeMesh(new THREE.BoxGeometry(1.2, 0.8, 1.2), 0x6a5540, 6, 34.5, -10);
        makeMesh(new THREE.BoxGeometry(1.2, 0.8, 1.2), 0x6a5540, -6, 34.5, 10);
        makeMesh(new THREE.BoxGeometry(1.2, 0.8, 1.2), 0x6a5540, 0, 34.5, 10);
        makeMesh(new THREE.BoxGeometry(1.2, 0.8, 1.2), 0x6a5540, 6, 34.5, 10);
    }

    // --- Outer artillery wall (15th century, later addition) ---
    function buildArtilleryWall() {
        // North curtain wall segment
        makeMesh(new THREE.BoxGeometry(70, 6, 3.5), 0x8B7355, 0, 4, -30);
        // South curtain wall segment
        makeMesh(new THREE.BoxGeometry(70, 6, 3.5), 0x8B7355, 0, 4, 30);
        // West curtain wall
        makeMesh(new THREE.BoxGeometry(3.5, 6, 60), 0x8B7355, -35, 4, 0);
        // East curtain wall
        makeMesh(new THREE.BoxGeometry(3.5, 6, 60), 0x8B7355, 35, 4, 0);
        // Wall coping
        makeMesh(new THREE.BoxGeometry(74, 1, 3.5), 0x7a6545, 0, 7.5, -30);
        makeMesh(new THREE.BoxGeometry(74, 1, 3.5), 0x7a6545, 0, 7.5, 30);
        makeMesh(new THREE.BoxGeometry(3.5, 1, 60), 0x7a6545, -35, 7.5, 0);
        makeMesh(new THREE.BoxGeometry(3.5, 1, 60), 0x7a6545, 35, 7.5, 0);
        // Gateway gap in east wall (boat landing side) — represented by shorter wall segments
        makeMesh(new THREE.BoxGeometry(3.5, 6, 20), 0x8B7355, 35, 4, -20);
        makeMesh(new THREE.BoxGeometry(3.5, 6, 20), 0x8B7355, 35, 4, 20);
    }

    // --- Round gun towers at corners (artillery additions) ---
    function buildGunTowers() {
        // NW corner tower
        makeMesh(new THREE.CylinderGeometry(5, 5.5, 8, 10), 0x8B7355, -35, 4, -30);
        // NE corner tower
        makeMesh(new THREE.CylinderGeometry(5, 5.5, 8, 10), 0x8B7355, 35, 4, -30);
        // SW corner tower
        makeMesh(new THREE.CylinderGeometry(5, 5.5, 8, 10), 0x8B7355, -35, 4, 30);
        // SE corner tower
        makeMesh(new THREE.CylinderGeometry(5, 5.5, 8, 10), 0x8B7355, 35, 4, 30);
        // Gun tower caps
        makeMesh(new THREE.ConeGeometry(5.5, 4, 10), 0x7a6545, -35, 10, -30);
        makeMesh(new THREE.ConeGeometry(5.5, 4, 10), 0x7a6545, 35, 10, -30);
        makeMesh(new THREE.ConeGeometry(5.5, 4, 10), 0x7a6545, -35, 10, 30);
        makeMesh(new THREE.ConeGeometry(5.5, 4, 10), 0x7a6545, 35, 10, 30);
        // Gunports (dark rectangles on tower faces)
        makeMesh(new THREE.BoxGeometry(1.2, 0.8, 0.5), 0x2a2018, -35, 4, -35);
        makeMesh(new THREE.BoxGeometry(1.2, 0.8, 0.5), 0x2a2018, 35, 4, -35);
        makeMesh(new THREE.BoxGeometry(1.2, 0.8, 0.5), 0x2a2018, -35, 4, 35);
        makeMesh(new THREE.BoxGeometry(1.2, 0.8, 0.5), 0x2a2018, 35, 4, 35);
    }

    // --- Landing stage (wooden jetty, east side of island) ---
    function buildLandingStage() {
        // Jetty deck planks — represented as flat boxes
        makeMesh(new THREE.BoxGeometry(16, 0.8, 5), 0x8B6914, 52, 0.5, 0);
        makeMesh(new THREE.BoxGeometry(10, 0.8, 5), 0x8B6914, 62, 0.5, 0);
        // Jetty posts
        makeMesh(new THREE.CylinderGeometry(0.3, 0.3, 4, 6), 0x6b4e1a, 44, -0.5, 2);
        makeMesh(new THREE.CylinderGeometry(0.3, 0.3, 4, 6), 0x6b4e1a, 44, -0.5, -2);
        makeMesh(new THREE.CylinderGeometry(0.3, 0.3, 4, 6), 0x6b4e1a, 52, -0.5, 2);
        makeMesh(new THREE.CylinderGeometry(0.3, 0.3, 4, 6), 0x6b4e1a, 52, -0.5, -2);
        makeMesh(new THREE.CylinderGeometry(0.3, 0.3, 4, 6), 0x6b4e1a, 60, -0.5, 2);
        makeMesh(new THREE.CylinderGeometry(0.3, 0.3, 4, 6), 0x6b4e1a, 60, -0.5, -2);
    }

    // --- Rowing boat (no bridge — only way across) ---
    function buildRowingBoat() {
        // Boat hull
        makeMesh(new THREE.BoxGeometry(7, 1.2, 2.8), 0x5c3d1a, 75, -1.2, 0);
        // Boat sides — raised
        makeMesh(new THREE.BoxGeometry(7, 0.8, 0.3), 0x4a2e10, 75, -0.5, 1.4);
        makeMesh(new THREE.BoxGeometry(7, 0.8, 0.3), 0x4a2e10, 75, -0.5, -1.4);
        // Bow
        makeMesh(new THREE.BoxGeometry(0.5, 0.8, 2.8), 0x4a2e10, 71.3, -0.5, 0);
        // Stern
        makeMesh(new THREE.BoxGeometry(0.5, 0.8, 2.8), 0x4a2e10, 78.7, -0.5, 0);
        // Oars (flat thin boxes)
        makeMesh(new THREE.BoxGeometry(8, 0.15, 0.4), 0x6b4e1a, 75, 0.2, 2.5, 0, 0, 0.3);
        makeMesh(new THREE.BoxGeometry(8, 0.15, 0.4), 0x6b4e1a, 75, 0.2, -2.5, 0, 0, -0.3);
    }

    // --- Threave Gardens (NTS walled garden, nearby) ---
    function buildThreaveGardens() {
        // Walled garden walls
        makeMesh(new THREE.BoxGeometry(60, 3, 2), 0x8B7355, -120, 1.5, -80);
        makeMesh(new THREE.BoxGeometry(60, 3, 2), 0x8B7355, -120, 1.5, -140);
        makeMesh(new THREE.BoxGeometry(2, 3, 60), 0x8B7355, -150, 1.5, -110);
        makeMesh(new THREE.BoxGeometry(2, 3, 60), 0x8B7355, -90, 1.5, -110);
        // Garden interior — grass
        makeMesh(new THREE.BoxGeometry(56, 0.5, 56), 0x3d8b40, -120, 0.3, -110);
        // Spring bulb beds — small raised colourful strips
        makeMesh(new THREE.BoxGeometry(12, 0.5, 3), 0xffd700, -120, 0.8, -100);
        makeMesh(new THREE.BoxGeometry(12, 0.5, 3), 0xffffff, -120, 0.8, -110);
        makeMesh(new THREE.BoxGeometry(12, 0.5, 3), 0xcc44aa, -120, 0.8, -120);
        // Garden path (gravel)
        makeMesh(new THREE.BoxGeometry(4, 0.4, 56), 0xc8b89a, -120, 0.6, -110);
        makeMesh(new THREE.BoxGeometry(56, 0.4, 4), 0xc8b89a, -120, 0.6, -110);
        // Glasshouse / greenhouse
        makeMesh(new THREE.BoxGeometry(16, 5, 8), 0x8bbccc, -105, 3, -110);
        makeMesh(new THREE.ConeGeometry(10, 3, 4), 0x6aaabb, -105, 6.5, -110, 0, 0.785, 0);
        // Visitor centre building
        makeMesh(new THREE.BoxGeometry(20, 7, 14), 0x8B7355, -140, 3.5, -60);
        makeMesh(new THREE.BoxGeometry(22, 1, 16), 0x7a6545, -140, 7.5, -60);
    }

    // --- Castle Douglas town ---
    function buildCastleDouglasTown() {
        // Main street buildings — row of terraced shops/houses
        makeMesh(new THREE.BoxGeometry(10, 8, 8), 0xF5F0E8, -160, 4, 80);
        makeMesh(new THREE.BoxGeometry(10, 9, 8), 0xF5F0E8, -150, 4.5, 80);
        makeMesh(new THREE.BoxGeometry(10, 8, 8), 0xE8E0D8, -140, 4, 80);
        makeMesh(new THREE.BoxGeometry(10, 10, 8), 0xF5F0E8, -130, 5, 80);
        makeMesh(new THREE.BoxGeometry(10, 8, 8), 0xF5F0E8, -120, 4, 80);
        // Roofs (pitched)
        makeMesh(new THREE.ConeGeometry(7.8, 4, 4), 0xCD5C5C, -160, 10, 80, 0, 0.785, 0);
        makeMesh(new THREE.ConeGeometry(7.8, 4, 4), 0xCD5C5C, -150, 11.5, 80, 0, 0.785, 0);
        makeMesh(new THREE.ConeGeometry(7.8, 4, 4), 0xCD5C5C, -140, 10, 80, 0, 0.785, 0);
        makeMesh(new THREE.ConeGeometry(7.8, 4, 4), 0xCD5C5C, -130, 13, 80, 0, 0.785, 0);
        makeMesh(new THREE.ConeGeometry(7.8, 4, 4), 0xCD5C5C, -120, 10, 80, 0, 0.785, 0);
        // Town square / market cross area — cobbled square
        makeMesh(new THREE.BoxGeometry(30, 0.4, 30), 0xb0a090, -145, 0.2, 110);
        // Market cross pillar
        makeMesh(new THREE.CylinderGeometry(0.5, 0.7, 6, 6), 0x909090, -145, 3, 110);
        // Church
        makeMesh(new THREE.BoxGeometry(18, 12, 24), 0x8B7355, -100, 6, 90);
        makeMesh(new THREE.ConeGeometry(4, 20, 4), 0x8B7355, -100, 22, 90, 0, 0.785, 0);
        // Church door
        makeMesh(new THREE.BoxGeometry(3, 5, 0.5), 0x5c3d1a, -100, 4, 78);
        // Additional town row (opposite side of street)
        makeMesh(new THREE.BoxGeometry(10, 8, 8), 0xE8E0D8, -160, 4, 100);
        makeMesh(new THREE.BoxGeometry(10, 9, 8), 0xF5F0E8, -150, 4.5, 100);
        makeMesh(new THREE.BoxGeometry(10, 8, 8), 0xF5F0E8, -140, 4, 100);
        makeMesh(new THREE.ConeGeometry(7.8, 4, 4), 0xCD5C5C, -160, 10, 100, 0, 0.785, 0);
        makeMesh(new THREE.ConeGeometry(7.8, 4, 4), 0xCD5C5C, -150, 11.5, 100, 0, 0.785, 0);
        makeMesh(new THREE.ConeGeometry(7.8, 4, 4), 0xCD5C5C, -140, 10, 100, 0, 0.785, 0);
        // Road surface (main street)
        makeMesh(new THREE.BoxGeometry(60, 0.3, 14), 0x888078, -140, 0.1, 90);
    }

    // --- Carlingwark Loch ---
    function buildCarlingwarkLoch() {
        // Loch water body
        makeMesh(new THREE.BoxGeometry(120, 1, 80), 0x006994, -180, -2, 170);
        // Loch surface shimmer
        makeMesh(new THREE.BoxGeometry(110, 0.3, 70), 0x0077bb, -180, -1.5, 170);
        // Loch shoreline
        makeMesh(new THREE.BoxGeometry(130, 1, 90), 0x5c8a4a, -180, -3, 170);
        // Small wooded peninsula
        makeMesh(new THREE.BoxGeometry(20, 1, 12), 0x3d6b34, -145, -2.2, 155);
    }

    // --- Reed beds around loch ---
    function buildReedBeds() {
        makeMesh(new THREE.BoxGeometry(18, 3, 5), 0x8b9b4a, -160, 0, 135);
        makeMesh(new THREE.BoxGeometry(12, 3, 5), 0x8b9b4a, -200, 0, 138);
        makeMesh(new THREE.BoxGeometry(20, 3, 4), 0x8b9b4a, -175, 0, 212);
        makeMesh(new THREE.BoxGeometry(8, 3, 6), 0x7a8b3a, -220, 0, 175);
        makeMesh(new THREE.BoxGeometry(10, 3, 6), 0x7a8b3a, -152, 0, 185);
    }

    // --- Galloway Hills (Merrick and Kells range in background) ---
    function buildGallowayHills() {
        // Merrick — highest point of Southern Uplands
        makeMesh(new THREE.ConeGeometry(80, 120, 6), 0x5a5a5a, -80, 0, -350);
        makeMesh(new THREE.ConeGeometry(60, 90, 6), 0x626262, 60, 0, -370);
        // Kells range
        makeMesh(new THREE.ConeGeometry(70, 100, 6), 0x5a5a5a, -200, 0, -360);
        makeMesh(new THREE.ConeGeometry(55, 80, 6), 0x646464, -310, 0, -340);
        // Lower foothills
        makeMesh(new THREE.ConeGeometry(90, 50, 7), 0x6a7060, 180, 0, -300);
        makeMesh(new THREE.ConeGeometry(75, 40, 7), 0x6a7060, -380, 0, -290);
        // Snow caps on Merrick and Kells in background
        makeMesh(new THREE.ConeGeometry(22, 25, 6), 0xeeeeee, -80, 100, -350);
        makeMesh(new THREE.ConeGeometry(18, 20, 6), 0xeeeeee, -200, 70, -360);
        // Ridge connecting hills
        makeMesh(new THREE.BoxGeometry(200, 30, 40), 0x585858, -140, 10, -355);
    }

    // --- Old granite farmhouses ---
    function buildFarmhouses() {
        // Farmhouse 1
        makeMesh(new THREE.BoxGeometry(14, 6, 8), 0x8B8B8B, 100, 3, 80);
        makeMesh(new THREE.BoxGeometry(16, 1, 10), 0x7a7a7a, 100, 6.5, 80);
        makeMesh(new THREE.ConeGeometry(9, 4, 4), 0x777777, 100, 9, 80, 0, 0.785, 0);
        // Farmhouse outbuildings
        makeMesh(new THREE.BoxGeometry(10, 4, 6), 0x888888, 116, 2, 80);
        makeMesh(new THREE.ConeGeometry(7, 3, 4), 0x777777, 116, 5.5, 80, 0, 0.785, 0);
        // Drystone field walls
        makeMesh(new THREE.BoxGeometry(40, 1.2, 0.8), 0x808080, 100, 0.6, 95);
        makeMesh(new THREE.BoxGeometry(0.8, 1.2, 30), 0x808080, 80, 0.6, 82);

        // Farmhouse 2 (different spot)
        makeMesh(new THREE.BoxGeometry(12, 6, 8), 0x8B8B8B, 160, 3, -60);
        makeMesh(new THREE.ConeGeometry(8, 3.5, 4), 0x777777, 160, 7.8, -60, 0, 0.785, 0);
        makeMesh(new THREE.BoxGeometry(8, 3.5, 5), 0x898989, 174, 1.75, -60);
        makeMesh(new THREE.BoxGeometry(30, 1.2, 0.8), 0x808080, 155, 0.6, -44);
    }

    // --- Belted Galloway cattle ("Belties") ---
    function buildBeltedGallowayCattle() {
        buildBeltie(90, 0, 50);
        buildBeltie(103, 0, 55);
        buildBeltie(96, 0, 62);
        buildBeltie(115, 0, 50);
        buildBeltie(85, 0, 70);
    }

    function buildBeltie(x, y, z) {
        // Body — black with white mid-band
        makeMesh(new THREE.BoxGeometry(4.5, 2.8, 2), 0x222211, x, y + 2.4, z);
        // White belt band in middle
        makeMesh(new THREE.BoxGeometry(1.5, 2.9, 2.05), 0xffffff, x, y + 2.4, z);
        // Head
        makeMesh(new THREE.BoxGeometry(1.4, 1.4, 1.2), 0x222211, x + 2.6, y + 3.2, z);
        // Legs
        makeMesh(new THREE.CylinderGeometry(0.25, 0.22, 2.2, 5), 0x222211, x + 1.3, y + 1.1, z + 0.7);
        makeMesh(new THREE.CylinderGeometry(0.25, 0.22, 2.2, 5), 0x222211, x + 1.3, y + 1.1, z - 0.7);
        makeMesh(new THREE.CylinderGeometry(0.25, 0.22, 2.2, 5), 0x222211, x - 1.3, y + 1.1, z + 0.7);
        makeMesh(new THREE.CylinderGeometry(0.25, 0.22, 2.2, 5), 0x222211, x - 1.3, y + 1.1, z - 0.7);
    }

    // --- Surrounding fields ---
    function buildSurroundingFields() {
        // Agricultural fields in Galloway landscape
        makeMesh(new THREE.BoxGeometry(100, 0.5, 80), 0x4a7c3f, 100, -0.5, 50);
        makeMesh(new THREE.BoxGeometry(80, 0.5, 60), 0x3d8b40, 180, -0.5, -50);
        makeMesh(new THREE.BoxGeometry(90, 0.5, 70), 0x4a7c3f, -100, -0.5, 160);
        makeMesh(new THREE.BoxGeometry(70, 0.5, 90), 0x56883a, 50, -0.5, 130);
    }

    // --- Scattered trees (oaks and scots pines typical of Galloway) ---
    function buildScatteredTrees() {
        buildTree(70, 0, -70);
        buildTree(-70, 0, 50);
        buildTree(110, 0, -40);
        buildTree(-95, 0, 90);
        buildTree(130, 0, 120);
    }

    function buildTree(x, y, z) {
        // Trunk
        makeMesh(new THREE.CylinderGeometry(0.6, 0.9, 7, 7), 0x5c3d1a, x, y + 3.5, z);
        // Canopy
        makeMesh(new THREE.SphereGeometry(5, 7, 6), 0x2d5a1b, x, y + 10, z);
        // Secondary canopy layer
        makeMesh(new THREE.SphereGeometry(3.5, 7, 6), 0x336622, x + 2, y + 12, z - 1);
    }

    function update(delta) {
        // Static scene — no per-frame animation needed
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
