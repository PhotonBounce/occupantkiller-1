window.BakuFlameTowers = (function() {
    'use strict';

    var scene = null;
    var camera = null;
    var objects = [];

    var BASE_X = 23760;
    var BASE_Y = 0;
    var BASE_Z = 0;

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
        objects = [];
        build();
    }

    function addMesh(geo, color, x, y, z, rx, ry, rz, sx, sy, sz) {
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(
            BASE_X + (x || 0),
            BASE_Y + (y || 0),
            BASE_Z + (z || 0)
        );
        if (rx) mesh.rotation.x = rx;
        if (ry) mesh.rotation.y = ry;
        if (rz) mesh.rotation.z = rz;
        if (sx) mesh.scale.set(sx, sy || sx, sz || sx);
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function build() {
        buildGround();
        buildFlameTowers();
        buildOldCity();
        buildHeydarAliyevCenter();
        buildCaspianWaterfront();
        buildAteshgah();
        buildCrystalHall();
        buildBibiHeybatMosque();
        buildNationalFlagSquare();
        buildCarpetMuseum();
        buildFountainsSquare();
    }

    function buildGround() {
        // Large ground plane approximated with BoxGeometry slabs
        addMesh(new THREE.BoxGeometry(2000, 2, 2000), 0x4A5A3A, 0, -1, 0);
        // Caspian Sea slab
        addMesh(new THREE.BoxGeometry(600, 1, 2000), 0x1A5A8A, 700, -1, 0);
    }

    function buildFlameTowers() {
        // Three iconic Flame Towers — triangular prism-like tapered forms
        // approximated with CylinderGeometry (triangular cross-section = 3 sides)
        // Tower 1 — tallest 182m, orange-flame
        var t1base = new THREE.CylinderGeometry(18, 22, 182, 3);
        addMesh(t1base, 0xFF6600, -60, 91, -30);
        // Flame tip cap for tower 1
        var t1tip = new THREE.ConeGeometry(18, 40, 3);
        addMesh(t1tip, 0xFF8800, -60, 202, -30);
        // LED facade glow strips — flat box panels on face of tower 1
        addMesh(new THREE.BoxGeometry(4, 160, 2), 0xFF4400, -42, 91, -12);
        addMesh(new THREE.BoxGeometry(4, 140, 2), 0xFFAA00, -42, 81, -13);

        // Tower 2 — 165m
        var t2base = new THREE.CylinderGeometry(16, 20, 165, 3);
        addMesh(t2base, 0xFF5500, 0, 82, -10);
        var t2tip = new THREE.ConeGeometry(16, 36, 3);
        addMesh(t2tip, 0xFF7700, 0, 183, -10);
        addMesh(new THREE.BoxGeometry(4, 145, 2), 0xFF3300, 16, 82, 6);
        addMesh(new THREE.BoxGeometry(4, 125, 2), 0xFF9900, 16, 72, 5);

        // Tower 3 — 140m
        var t3base = new THREE.CylinderGeometry(14, 18, 140, 3);
        addMesh(t3base, 0xFF6600, 50, 70, 20);
        var t3tip = new THREE.ConeGeometry(14, 32, 3);
        addMesh(t3tip, 0xFF8800, 50, 156, 20);
        addMesh(new THREE.BoxGeometry(4, 120, 2), 0xFF4400, 64, 70, 36);
        addMesh(new THREE.BoxGeometry(4, 100, 2), 0xFFAA00, 64, 60, 35);

        // Shared podium / base plaza for the towers
        addMesh(new THREE.BoxGeometry(160, 8, 100), 0x888888, -5, 4, 0);
        // Connecting lobby block
        addMesh(new THREE.BoxGeometry(80, 20, 40), 0x999999, -10, 10, 0);
    }

    function buildOldCity() {
        // UNESCO Walled Medieval City — İçərişəhər
        // Outer fortress wall sections
        addMesh(new THREE.BoxGeometry(200, 10, 4), 0xC8B880, -400, 5, -100);
        addMesh(new THREE.BoxGeometry(200, 10, 4), 0xC8B880, -400, 5, 100);
        addMesh(new THREE.BoxGeometry(4, 10, 204), 0xC8B880, -500, 5, 0);
        addMesh(new THREE.BoxGeometry(4, 10, 204), 0xC8B880, -300, 5, 0);
        // Corner bastions
        addMesh(new THREE.CylinderGeometry(8, 8, 12, 8), 0xC8B880, -500, 6, -100);
        addMesh(new THREE.CylinderGeometry(8, 8, 12, 8), 0xC8B880, -300, 6, -100);
        addMesh(new THREE.CylinderGeometry(8, 8, 12, 8), 0xC8B880, -500, 6, 100);
        addMesh(new THREE.CylinderGeometry(8, 8, 12, 8), 0xC8B880, -300, 6, 100);
        // Gate tower
        addMesh(new THREE.BoxGeometry(16, 18, 4), 0xC8B880, -300, 9, 0);

        // Maiden Tower (Qiz Qalasi) — 12th century cylindrical tower, 28m tall
        var maidenTower = new THREE.CylinderGeometry(7, 8, 28, 12);
        addMesh(maidenTower, 0xC8B880, -310, 14, 80);
        // Maiden Tower cap
        addMesh(new THREE.CylinderGeometry(7, 7, 3, 12), 0xB8A870, -310, 29, 80);
        // Maiden Tower balcony ring
        addMesh(new THREE.CylinderGeometry(9, 9, 2, 12), 0xB8A870, -310, 22, 80);

        // Palace of the Shirvanshahs — multi-wing medieval palace
        addMesh(new THREE.BoxGeometry(60, 12, 40), 0xC8B880, -420, 6, 40);
        addMesh(new THREE.BoxGeometry(30, 16, 20), 0xC0B078, -410, 8, 30);
        // Palace dome
        addMesh(new THREE.SphereGeometry(8, 8, 6), 0xD4C890, -410, 21, 30);
        // Palace minaret
        addMesh(new THREE.CylinderGeometry(2, 2.5, 22, 8), 0xC8B880, -435, 11, 25);
        addMesh(new THREE.ConeGeometry(2, 6, 8), 0xC0B078, -435, 23, 25);

        // Caravanserai — large courtyard building
        addMesh(new THREE.BoxGeometry(50, 10, 50), 0xC8B880, -450, 5, -40);
        addMesh(new THREE.BoxGeometry(30, 2, 30), 0xAA9966, -450, 10, -40);
        // Caravanserai arch gate
        addMesh(new THREE.BoxGeometry(4, 14, 10), 0xC8B880, -425, 7, -40);

        // Narrow lanes — represented as darker ground strips between buildings
        addMesh(new THREE.BoxGeometry(4, 1, 80), 0x9A8860, -380, 0, 0);
        addMesh(new THREE.BoxGeometry(80, 1, 4), 0x9A8860, -420, 0, -20);

        // Small old city buildings
        addMesh(new THREE.BoxGeometry(14, 9, 14), 0xC8B880, -360, 4, 60);
        addMesh(new THREE.BoxGeometry(14, 7, 14), 0xC0B078, -370, 3, -60);
        addMesh(new THREE.BoxGeometry(14, 11, 14), 0xCCBC84, -390, 5, -80);
    }

    function buildHeydarAliyevCenter() {
        // Zaha Hadid's iconic flowing white building — undulating form in BoxGeometry
        // Large sweeping base undulation approximated with rotated/scaled boxes
        addMesh(new THREE.BoxGeometry(120, 8, 80), 0xF5F5F5, 200, 4, 0);
        addMesh(new THREE.BoxGeometry(100, 12, 60), 0xF5F5F5, 200, 10, 0, 0.08, 0, 0);
        addMesh(new THREE.BoxGeometry(80, 20, 50), 0xF0F0F0, 200, 20, 10, 0.12, 0.05, 0);
        addMesh(new THREE.BoxGeometry(60, 30, 40), 0xF5F5F5, 205, 35, 15, 0.15, 0.1, 0);
        addMesh(new THREE.BoxGeometry(40, 24, 35), 0xEEEEEE, 215, 48, 18, 0.1, 0.12, 0.05);
        // Roof wave panels
        addMesh(new THREE.BoxGeometry(110, 3, 85), 0xFFFFFF, 200, 8, 0, 0.05, 0, 0);
        addMesh(new THREE.BoxGeometry(90, 3, 70), 0xFFFFFF, 200, 14, 5, 0.1, 0, 0);
        addMesh(new THREE.BoxGeometry(70, 3, 55), 0xFFFFFF, 200, 22, 10, 0.15, 0, 0);
        // Entry ramp sweep
        addMesh(new THREE.BoxGeometry(50, 2, 20), 0xF5F5F5, 170, 3, -30, -0.1, 0, 0);
        addMesh(new THREE.BoxGeometry(40, 2, 16), 0xF0F0F0, 180, 5, -28, -0.08, 0, 0);
    }

    function buildCaspianWaterfront() {
        // Baku Boulevard promenade
        addMesh(new THREE.BoxGeometry(600, 1, 40), 0xD0C8B0, 400, 0, 0);
        // Sea surface
        addMesh(new THREE.BoxGeometry(500, 1, 400), 0x1A5A8A, 700, -1, 0);

        // Pier / jetty
        addMesh(new THREE.BoxGeometry(6, 2, 100), 0x8B7355, 550, 1, 0);
        addMesh(new THREE.BoxGeometry(30, 2, 6), 0x8B7355, 600, 1, 0);

        // Boats in marina — small hull shapes
        addMesh(new THREE.BoxGeometry(12, 3, 4), 0xFFFFFF, 620, 1, 20);
        addMesh(new THREE.BoxGeometry(10, 2, 3), 0xCC2200, 635, 1, 35);
        addMesh(new THREE.BoxGeometry(14, 3, 4), 0x2244AA, 610, 1, -20);
        // Boat masts
        addMesh(new THREE.CylinderGeometry(0.2, 0.2, 14, 4), 0x888888, 620, 8, 20);
        addMesh(new THREE.CylinderGeometry(0.2, 0.2, 12, 4), 0x888888, 635, 7, 35);

        // Ferris Wheel (Little Venice) — approximated with rings of boxes
        addMesh(new THREE.CylinderGeometry(20, 20, 2, 16), 0xCCCCCC, 480, 21, -60);
        addMesh(new THREE.CylinderGeometry(18, 18, 1, 16), 0xAAAAAA, 480, 21, -60);
        addMesh(new THREE.CylinderGeometry(1, 1, 42, 6), 0xAAAAAA, 480, 21, -60, 0, 0, 1.5708);
        addMesh(new THREE.CylinderGeometry(1, 1, 42, 6), 0xAAAAAA, 480, 21, -60, 0, 0, 0.7854);
        addMesh(new THREE.CylinderGeometry(1, 1, 42, 6), 0xAAAAAA, 480, 21, -60, 0, 0, 2.3562);
        // Ferris wheel support legs
        addMesh(new THREE.BoxGeometry(2, 22, 2), 0x888888, 474, 10, -60);
        addMesh(new THREE.BoxGeometry(2, 22, 2), 0x888888, 486, 10, -60);

        // Flagpole — National Flag Square 162m
        addMesh(new THREE.CylinderGeometry(1.2, 2, 162, 8), 0xCCCCCC, 350, 81, -150);
        // Flag
        addMesh(new THREE.BoxGeometry(30, 15, 1), 0x0092BC, 365, 156, -150);
        addMesh(new THREE.BoxGeometry(10, 5, 1), 0xFF0000, 365, 158, -151);
        addMesh(new THREE.BoxGeometry(8, 5, 1), 0x00AF00, 365, 152, -151);

        // Promenade lamp posts
        addMesh(new THREE.CylinderGeometry(0.3, 0.3, 8, 4), 0x444444, 430, 4, 15);
        addMesh(new THREE.SphereGeometry(0.8, 4, 4), 0xFFFF99, 430, 8, 15);
        addMesh(new THREE.CylinderGeometry(0.3, 0.3, 8, 4), 0x444444, 460, 4, 15);
        addMesh(new THREE.SphereGeometry(0.8, 4, 4), 0xFFFF99, 460, 8, 15);
        addMesh(new THREE.CylinderGeometry(0.3, 0.3, 8, 4), 0x444444, 490, 4, 15);
        addMesh(new THREE.SphereGeometry(0.8, 4, 4), 0xFFFF99, 490, 8, 15);

        // Little Venice canal island
        addMesh(new THREE.BoxGeometry(40, 1, 30), 0xD4C8A0, 520, 0, -60);
        addMesh(new THREE.CylinderGeometry(4, 4, 10, 8), 0xBBAA88, 520, 5, -60);
    }

    function buildAteshgah() {
        // Ateshgah Fire Temple — quadrangular fortress
        // Outer fortress walls
        addMesh(new THREE.BoxGeometry(80, 8, 4), 0xD4C8A0, -600, 4, -200);
        addMesh(new THREE.BoxGeometry(80, 8, 4), 0xD4C8A0, -600, 4, -280);
        addMesh(new THREE.BoxGeometry(4, 8, 80), 0xD4C8A0, -640, 4, -240);
        addMesh(new THREE.BoxGeometry(4, 8, 80), 0xD4C8A0, -560, 4, -240);
        // Corner towers
        addMesh(new THREE.CylinderGeometry(5, 5, 10, 8), 0xC8BC98, -640, 5, -200);
        addMesh(new THREE.CylinderGeometry(5, 5, 10, 8), 0xC8BC98, -560, 5, -200);
        addMesh(new THREE.CylinderGeometry(5, 5, 10, 8), 0xC8BC98, -640, 5, -280);
        addMesh(new THREE.CylinderGeometry(5, 5, 10, 8), 0xC8BC98, -560, 5, -280);
        // Inner courtyard altar — central fire altar
        addMesh(new THREE.CylinderGeometry(4, 5, 8, 8), 0xD4C8A0, -600, 4, -240);
        // Natural gas flame effect — cone on top of altar
        addMesh(new THREE.ConeGeometry(2, 10, 6), 0xFF6600, -600, 13, -240);
        addMesh(new THREE.ConeGeometry(1.2, 7, 6), 0xFF9900, -600, 15, -240);
        // Temple cells around courtyard
        addMesh(new THREE.BoxGeometry(10, 6, 8), 0xD4C8A0, -625, 3, -220);
        addMesh(new THREE.BoxGeometry(10, 6, 8), 0xD4C8A0, -575, 3, -220);
        addMesh(new THREE.BoxGeometry(10, 6, 8), 0xD4C8A0, -625, 3, -260);
        addMesh(new THREE.BoxGeometry(10, 6, 8), 0xD4C8A0, -575, 3, -260);
        // Gate entrance
        addMesh(new THREE.BoxGeometry(14, 12, 4), 0xD4C8A0, -600, 6, -200);
    }

    function buildCrystalHall() {
        // Crystal Hall — oval concert arena with glowing crystal facade
        // Oval approximated with CylinderGeometry (many sides)
        addMesh(new THREE.CylinderGeometry(50, 50, 30, 16), 0x8899CC, 150, 15, 200);
        addMesh(new THREE.CylinderGeometry(52, 52, 4, 16), 0xAABBDD, 150, 32, 200);
        // Crystal facade panels around perimeter
        addMesh(new THREE.BoxGeometry(18, 28, 3), 0x99AADD, 150, 14, 248);
        addMesh(new THREE.BoxGeometry(18, 28, 3), 0x99AADD, 150, 14, 152);
        addMesh(new THREE.BoxGeometry(3, 28, 18), 0x99AADD, 198, 14, 200);
        addMesh(new THREE.BoxGeometry(3, 28, 18), 0x99AADD, 102, 14, 200);
        // Roof dome
        addMesh(new THREE.SphereGeometry(50, 12, 6, 0, 6.28, 0, 1.57), 0xBBCCEE, 150, 30, 200);
        // Entry canopy
        addMesh(new THREE.BoxGeometry(30, 4, 20), 0xCCDDFF, 150, 2, 265);
        addMesh(new THREE.BoxGeometry(2, 10, 2), 0xAAAAAA, 140, 5, 270);
        addMesh(new THREE.BoxGeometry(2, 10, 2), 0xAAAAAA, 160, 5, 270);
    }

    function buildBibiHeybatMosque() {
        // Bibi-Heybat Mosque — Ottoman-style mosque near Caspian
        // Main mosque body
        addMesh(new THREE.BoxGeometry(50, 14, 40), 0xD4C890, 600, 7, 200);
        // Main dome
        addMesh(new THREE.SphereGeometry(14, 10, 8), 0xC8BC80, 600, 21, 200);
        // Half-domes
        addMesh(new THREE.SphereGeometry(8, 8, 6, 0, 6.28, 0, 1.57), 0xC8BC80, 600, 14, 220);
        addMesh(new THREE.SphereGeometry(8, 8, 6, 0, 6.28, 0, 1.57), 0xC8BC80, 600, 14, 180);
        // Twin minarets
        addMesh(new THREE.CylinderGeometry(2.5, 3, 36, 8), 0xD4C890, 570, 18, 195);
        addMesh(new THREE.ConeGeometry(2.5, 8, 8), 0xB0A870, 570, 38, 195);
        addMesh(new THREE.CylinderGeometry(2.5, 3, 36, 8), 0xD4C890, 630, 18, 195);
        addMesh(new THREE.ConeGeometry(2.5, 8, 8), 0xB0A870, 630, 38, 195);
        // Minaret balcony rings
        addMesh(new THREE.CylinderGeometry(3.5, 3.5, 1.5, 8), 0xC8BC80, 570, 26, 195);
        addMesh(new THREE.CylinderGeometry(3.5, 3.5, 1.5, 8), 0xC8BC80, 630, 26, 195);
        // Courtyard
        addMesh(new THREE.BoxGeometry(70, 1, 60), 0xCCC0A0, 600, 0, 215);
        // Fountain in courtyard
        addMesh(new THREE.CylinderGeometry(5, 5, 1, 8), 0xCCCCCC, 600, 0, 235);
        addMesh(new THREE.CylinderGeometry(1, 1, 6, 6), 0xAAAAAA, 600, 3, 235);
    }

    function buildNationalFlagSquare() {
        // National Flag Square — 162m flagpole with Azerbaijani tricolor
        addMesh(new THREE.BoxGeometry(80, 1, 80), 0xD0C8B8, -100, 0, 200);
        addMesh(new THREE.CylinderGeometry(1.5, 2.5, 162, 8), 0xCCCCCC, -100, 81, 200);
        // Flag panels (tricolor — blue, red, green)
        addMesh(new THREE.BoxGeometry(40, 8, 1), 0x0092BC, -80, 161, 200);
        addMesh(new THREE.BoxGeometry(40, 8, 1), 0xFF0000, -80, 153, 200);
        addMesh(new THREE.BoxGeometry(40, 8, 1), 0x009000, -80, 145, 200);
        // Base podium
        addMesh(new THREE.BoxGeometry(12, 4, 12), 0x999999, -100, 2, 200);
        // Surrounding plaza benches
        addMesh(new THREE.BoxGeometry(10, 1, 3), 0xAAAAAA, -120, 0, 215);
        addMesh(new THREE.BoxGeometry(10, 1, 3), 0xAAAAAA, -80, 0, 215);
        addMesh(new THREE.BoxGeometry(10, 1, 3), 0xAAAAAA, -120, 0, 185);
        addMesh(new THREE.BoxGeometry(10, 1, 3), 0xAAAAAA, -80, 0, 185);
    }

    function buildCarpetMuseum() {
        // Azerbaijan Carpet Museum — building shaped like a rolled-up carpet
        // Main rolled cylinder body — elongated horizontal CylinderGeometry
        addMesh(new THREE.CylinderGeometry(18, 18, 80, 16), 0xCC8833, -200, 18, 300, 0, 0, 1.5708);
        // The unrolled flat section
        addMesh(new THREE.BoxGeometry(80, 2, 40), 0xCC8833, -200, 1, 340);
        // Side end caps
        addMesh(new THREE.CylinderGeometry(18, 18, 4, 16), 0xBB7722, -240, 18, 300, 0, 0, 1.5708);
        addMesh(new THREE.CylinderGeometry(18, 18, 4, 16), 0xBB7722, -160, 18, 300, 0, 0, 1.5708);
        // Carpet pattern strips on the roll (colored bands)
        addMesh(new THREE.BoxGeometry(4, 36, 82), 0xAA4422, -200, 18, 300);
        addMesh(new THREE.BoxGeometry(4, 36, 82), 0xDD9944, -190, 18, 300);
        addMesh(new THREE.BoxGeometry(4, 36, 82), 0xAA6633, -210, 18, 300);
        // Entry door
        addMesh(new THREE.BoxGeometry(8, 10, 3), 0x886622, -200, 5, 342);
    }

    function buildFountainsSquare() {
        // Fountains Square — city centre plaza
        addMesh(new THREE.BoxGeometry(120, 1, 120), 0xD4D0C8, -50, 0, 300);
        // Central fountain basin
        addMesh(new THREE.CylinderGeometry(15, 15, 1.5, 16), 0xCCCCCC, -50, 0, 300);
        // Central fountain column
        addMesh(new THREE.CylinderGeometry(1.5, 1.5, 10, 8), 0xAAAAAA, -50, 5, 300);
        // Fountain jets — vertical cylinders representing water streams
        addMesh(new THREE.CylinderGeometry(0.4, 0.4, 8, 4), 0x88BBDD, -50, 4, 312);
        addMesh(new THREE.CylinderGeometry(0.4, 0.4, 8, 4), 0x88BBDD, -50, 4, 288);
        addMesh(new THREE.CylinderGeometry(0.4, 0.4, 8, 4), 0x88BBDD, -62, 4, 300);
        addMesh(new THREE.CylinderGeometry(0.4, 0.4, 8, 4), 0x88BBDD, -38, 4, 300);
        // Secondary fountain ring
        addMesh(new THREE.CylinderGeometry(22, 22, 1, 16), 0xBBBBBB, -50, 0, 300);
        // More jet streams on secondary ring
        addMesh(new THREE.CylinderGeometry(0.3, 0.3, 6, 4), 0x88BBDD, -50, 3, 322);
        addMesh(new THREE.CylinderGeometry(0.3, 0.3, 6, 4), 0x88BBDD, -50, 3, 278);
        addMesh(new THREE.CylinderGeometry(0.3, 0.3, 6, 4), 0x88BBDD, -72, 3, 300);
        addMesh(new THREE.CylinderGeometry(0.3, 0.3, 6, 4), 0x88BBDD, -28, 3, 300);
        // Plaza benches and trees (boxes)
        addMesh(new THREE.BoxGeometry(8, 1, 2), 0x886644, -90, 0, 340);
        addMesh(new THREE.BoxGeometry(8, 1, 2), 0x886644, -10, 0, 340);
        addMesh(new THREE.BoxGeometry(8, 1, 2), 0x886644, -90, 0, 260);
        addMesh(new THREE.BoxGeometry(8, 1, 2), 0x886644, -10, 0, 260);
        // Tree trunks and canopies
        addMesh(new THREE.CylinderGeometry(0.6, 0.8, 5, 5), 0x553311, -90, 2, 320);
        addMesh(new THREE.SphereGeometry(4, 6, 5), 0x336622, -90, 8, 320);
        addMesh(new THREE.CylinderGeometry(0.6, 0.8, 5, 5), 0x553311, -10, 2, 320);
        addMesh(new THREE.SphereGeometry(4, 6, 5), 0x336622, -10, 8, 320);
        addMesh(new THREE.CylinderGeometry(0.6, 0.8, 5, 5), 0x553311, -90, 2, 280);
        addMesh(new THREE.SphereGeometry(4, 6, 5), 0x336622, -90, 8, 280);
        addMesh(new THREE.CylinderGeometry(0.6, 0.8, 5, 5), 0x553311, -10, 2, 280);
        addMesh(new THREE.SphereGeometry(4, 6, 5), 0x336622, -10, 8, 280);
    }

    function update(delta) {
        // Static environment — no per-frame updates needed
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
