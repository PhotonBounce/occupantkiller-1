window.WarsawOldTown = (function() {
    'use strict';
    var scene = null;
    var camera = null;
    var objects = [];

    var BASE_X = 22800;
    var BASE_Y = 0;
    var BASE_Z = 0;

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
        objects = [];
        build();
    }

    function addMesh(geometry, color, x, y, z, rx, ry, rz) {
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geometry, mat);
        mesh.position.set(BASE_X + (x || 0), BASE_Y + (y || 0), BASE_Z + (z || 0));
        if (rx) mesh.rotation.x = rx;
        if (ry) mesh.rotation.y = ry;
        if (rz) mesh.rotation.z = rz;
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function build() {
        buildGround();
        buildRoyalCastle();
        buildOldTownMarketSquare();
        buildTownhouseRow();
        buildWarsawMermaid();
        buildPalaceOfCultureAndScience();
        buildVistula();
        buildWarsawUprisingMonument();
        buildLazienkiPalace();
        buildWarsawBarbican();
        buildNeonSigns();
        buildModernSkyline();
    }

    function buildGround() {
        // Ground plane built from large flat boxes
        addMesh(new THREE.BoxGeometry(1200, 2, 1200), 0x4A7A3A, 0, -1, 0);
        // Cobblestone market square surface
        addMesh(new THREE.BoxGeometry(160, 1, 160), 0x8B8068, 0, -0.4, 0);
        // Road to castle
        addMesh(new THREE.BoxGeometry(30, 1, 300), 0x555555, -200, -0.3, 0);
        // Road along river
        addMesh(new THREE.BoxGeometry(20, 1, 600), 0x555555, 280, -0.3, 0);
    }

    function buildRoyalCastle() {
        // Main castle body — large rectangular block
        addMesh(new THREE.BoxGeometry(120, 80, 90), 0xC87020, -220, 40, -20);
        // Castle left wing
        addMesh(new THREE.BoxGeometry(50, 60, 70), 0xC87020, -290, 30, -15);
        // Castle right wing
        addMesh(new THREE.BoxGeometry(50, 60, 70), 0xC87020, -150, 30, -15);
        // Castle central tower
        addMesh(new THREE.BoxGeometry(30, 120, 30), 0xC87020, -220, 60, -20);
        // Tower clock face
        addMesh(new THREE.BoxGeometry(26, 26, 4), 0xF5F0DC, -220, 90, -3);
        // Tower roof — cone
        addMesh(new THREE.ConeGeometry(18, 40, 4), 0x444444, -220, 140, -20);
        // Left wing roof
        addMesh(new THREE.BoxGeometry(54, 10, 74), 0x553300, -290, 62, -15);
        // Right wing roof
        addMesh(new THREE.BoxGeometry(54, 10, 74), 0x553300, -150, 62, -15);
        // Main body roof
        addMesh(new THREE.BoxGeometry(124, 10, 94), 0x553300, -220, 82, -20);
        // Castle courtyard wall left
        addMesh(new THREE.BoxGeometry(8, 30, 60), 0xC07018, -260, 15, 30);
        // Castle courtyard wall right
        addMesh(new THREE.BoxGeometry(8, 30, 60), 0xC07018, -180, 15, 30);
        // Castle gate arch base left pillar
        addMesh(new THREE.BoxGeometry(12, 40, 12), 0xB86818, -228, 20, 55);
        // Castle gate arch base right pillar
        addMesh(new THREE.BoxGeometry(12, 40, 12), 0xB86818, -212, 20, 55);
        // Castle gate lintel
        addMesh(new THREE.BoxGeometry(28, 8, 12), 0xB86818, -220, 42, 55);
        // Castle corner turret left-front
        addMesh(new THREE.CylinderGeometry(8, 8, 70, 6), 0xC07018, -258, 35, -55);
        // Castle corner turret right-front
        addMesh(new THREE.CylinderGeometry(8, 8, 70, 6), 0xC07018, -182, 35, -55);
        // Turret roofs
        addMesh(new THREE.ConeGeometry(10, 25, 6), 0x333333, -258, 77, -55);
        addMesh(new THREE.ConeGeometry(10, 25, 6), 0x333333, -182, 77, -55);
        // Windows row on main body (decorative boxes)
        addMesh(new THREE.BoxGeometry(12, 18, 3), 0x8BADC0, -240, 55, -65);
        addMesh(new THREE.BoxGeometry(12, 18, 3), 0x8BADC0, -220, 55, -65);
        addMesh(new THREE.BoxGeometry(12, 18, 3), 0x8BADC0, -200, 55, -65);
    }

    function buildOldTownMarketSquare() {
        // North townhouse block
        addMesh(new THREE.BoxGeometry(160, 55, 30), 0xE8C060, 0, 27, -100);
        addMesh(new THREE.BoxGeometry(160, 6, 32), 0xBB6030, 0, 57, -100);
        // South townhouse block
        addMesh(new THREE.BoxGeometry(160, 55, 30), 0xD44444, 0, 27, 100);
        addMesh(new THREE.BoxGeometry(160, 6, 32), 0x993322, 0, 57, 100);
        // East townhouse block
        addMesh(new THREE.BoxGeometry(30, 55, 160), 0x4477CC, 100, 27, 0);
        addMesh(new THREE.BoxGeometry(32, 6, 160), 0x335599, 100, 57, 0);
        // West townhouse block
        addMesh(new THREE.BoxGeometry(30, 55, 160), 0xDDAA22, -100, 27, 0);
        addMesh(new THREE.BoxGeometry(32, 6, 160), 0xAA8811, -100, 57, 0);
        // Town Hall in market centre (original demolished, small remnant tower)
        addMesh(new THREE.BoxGeometry(20, 60, 20), 0xCC9944, 0, 30, 0);
        addMesh(new THREE.ConeGeometry(14, 30, 4), 0x444444, 0, 75, 0);
    }

    function buildTownhouseRow() {
        // A row of individual colourful townhouses along main street
        var colors = [0xE04040, 0xFFCC00, 0x3388DD, 0xFF8844, 0xCC44CC, 0x44BB66, 0xEEEE22];
        var roofColors = [0x992222, 0x997700, 0x225599, 0xAA5522, 0x883399, 0x227744, 0x999900];
        for (var i = 0; i < 7; i++) {
            var hx = -130 + i * 38;
            var hz = 145;
            addMesh(new THREE.BoxGeometry(34, 50 + i * 3, 28), colors[i], hx, 25 + i * 1.5, hz);
            addMesh(new THREE.BoxGeometry(36, 8, 30), roofColors[i], hx, 53 + i * 3, hz);
            // Attic gable
            addMesh(new THREE.CylinderGeometry(0, 17, 20, 4), roofColors[i], hx, 68 + i * 3, hz);
        }
        // Second row opposite side
        for (var j = 0; j < 5; j++) {
            var bx = -90 + j * 42;
            var bz = -145;
            addMesh(new THREE.BoxGeometry(36, 48 + j * 4, 28), colors[(j + 2) % 7], bx, 24 + j * 2, bz);
            addMesh(new THREE.BoxGeometry(38, 8, 30), roofColors[(j + 2) % 7], bx, 50 + j * 4, bz);
        }
    }

    function buildWarsawMermaid() {
        // Syrenka — mermaid statue in Market Square
        // Fish tail base
        addMesh(new THREE.CylinderGeometry(4, 7, 18, 6), 0xD3D3D3, 30, 9, 20);
        // Torso
        addMesh(new THREE.CylinderGeometry(3, 4, 14, 8), 0xD3D3D3, 30, 24, 20);
        // Head sphere
        addMesh(new THREE.SphereGeometry(4, 8, 6), 0xD3D3D3, 30, 33, 20);
        // Sword arm (vertical box)
        addMesh(new THREE.BoxGeometry(2, 22, 2), 0xC0C0C0, 34, 26, 20);
        // Shield (flat box to side)
        addMesh(new THREE.BoxGeometry(2, 14, 10), 0xA0A0A0, 26, 23, 20);
        // Pedestal
        addMesh(new THREE.BoxGeometry(16, 8, 16), 0x888888, 30, 4, 20);
        addMesh(new THREE.BoxGeometry(20, 4, 20), 0x666666, 30, 2, 20);
    }

    function buildPalaceOfCultureAndScience() {
        // PKiN — 237m Stalinist skyscraper east of Old Town
        // Base podium
        addMesh(new THREE.BoxGeometry(180, 30, 180), 0xAAAAAA, 300, 15, -200);
        // Central shaft lower
        addMesh(new THREE.BoxGeometry(80, 140, 80), 0xAAAAAA, 300, 100, -200);
        // Central shaft upper
        addMesh(new THREE.BoxGeometry(50, 140, 50), 0xB5B5B5, 300, 240, -200);
        // Central spire shaft
        addMesh(new THREE.BoxGeometry(14, 120, 14), 0xC0C0C0, 300, 370, -200);
        // Spire tip
        addMesh(new THREE.ConeGeometry(7, 40, 4), 0xDDDDDD, 300, 450, -200);
        // Wedding cake tier 1 — four corner towers at base level
        addMesh(new THREE.BoxGeometry(20, 80, 20), 0xAAAAAA, 250, 75, -250);
        addMesh(new THREE.BoxGeometry(20, 80, 20), 0xAAAAAA, 350, 75, -250);
        addMesh(new THREE.BoxGeometry(20, 80, 20), 0xAAAAAA, 250, 75, -150);
        addMesh(new THREE.BoxGeometry(20, 80, 20), 0xAAAAAA, 350, 75, -150);
        // Wedding cake tier 1 roofs
        addMesh(new THREE.ConeGeometry(12, 30, 4), 0x999999, 250, 125, -250);
        addMesh(new THREE.ConeGeometry(12, 30, 4), 0x999999, 350, 125, -250);
        addMesh(new THREE.ConeGeometry(12, 30, 4), 0x999999, 250, 125, -150);
        addMesh(new THREE.ConeGeometry(12, 30, 4), 0x999999, 350, 125, -150);
        // Mid-level setback detail band
        addMesh(new THREE.BoxGeometry(90, 8, 90), 0x999999, 300, 145, -200);
        // Upper corner mini-towers
        addMesh(new THREE.CylinderGeometry(5, 5, 50, 6), 0xB0B0B0, 270, 195, -220);
        addMesh(new THREE.CylinderGeometry(5, 5, 50, 6), 0xB0B0B0, 330, 195, -220);
        addMesh(new THREE.CylinderGeometry(5, 5, 50, 6), 0xB0B0B0, 270, 195, -180);
        addMesh(new THREE.CylinderGeometry(5, 5, 50, 6), 0xB0B0B0, 330, 195, -180);
        // Socialist realist decorative cornices
        addMesh(new THREE.BoxGeometry(84, 6, 84), 0x989898, 300, 172, -200);
        addMesh(new THREE.BoxGeometry(54, 5, 54), 0x989898, 300, 312, -200);
        // Large arch entrance
        addMesh(new THREE.BoxGeometry(40, 30, 8), 0x909090, 300, 45, -109);
        addMesh(new THREE.BoxGeometry(8, 30, 8), 0x909090, 280, 45, -109);
        addMesh(new THREE.BoxGeometry(8, 30, 8), 0x909090, 320, 45, -109);
    }

    function buildVistula() {
        // Wide Vistula river to the east — blue flat boxes
        addMesh(new THREE.BoxGeometry(200, 1, 800), 0x4682B4, 450, -0.8, 0);
        // River banks — sandy
        addMesh(new THREE.BoxGeometry(20, 1, 800), 0xD2B48C, 350, -0.5, 0);
        addMesh(new THREE.BoxGeometry(20, 1, 800), 0xD2B48C, 551, -0.5, 0);
        // Praga bank on far side
        addMesh(new THREE.BoxGeometry(200, 1, 800), 0x4A7A3A, 651, -0.8, 0);
        // Świętokrzyski Bridge
        addMesh(new THREE.BoxGeometry(220, 6, 18), 0x888888, 450, 3, 100);
        // Bridge pylon
        addMesh(new THREE.BoxGeometry(6, 50, 6), 0x777777, 430, 28, 100);
        addMesh(new THREE.BoxGeometry(6, 50, 6), 0x777777, 470, 28, 100);
    }

    function buildWarsawUprisingMonument() {
        // Monument — figures emerging from sewers/rubble
        // Base slab
        addMesh(new THREE.BoxGeometry(28, 4, 20), 0x888888, -80, 2, 200);
        // Left figure rising from ground
        addMesh(new THREE.BoxGeometry(6, 28, 5), 0x888888, -88, 16, 200);
        addMesh(new THREE.SphereGeometry(4, 6, 5), 0x888888, -88, 30, 200);
        addMesh(new THREE.BoxGeometry(4, 12, 4), 0x888888, -83, 22, 200);
        // Right figure with weapon raised
        addMesh(new THREE.BoxGeometry(6, 26, 5), 0x888888, -72, 15, 200);
        addMesh(new THREE.SphereGeometry(4, 6, 5), 0x888888, -72, 29, 200);
        addMesh(new THREE.BoxGeometry(2, 18, 2), 0x777777, -68, 28, 200);
        // Manhole / sewer opening at base
        addMesh(new THREE.CylinderGeometry(5, 5, 3, 8), 0x555555, -80, 1, 206);
        // Wall backdrop
        addMesh(new THREE.BoxGeometry(40, 50, 4), 0x777777, -80, 27, 188);
        // Inscription plate
        addMesh(new THREE.BoxGeometry(24, 10, 3), 0x999999, -80, 8, 188);
    }

    function buildLazienkiPalace() {
        // Łazienki — neoclassical palace on island, south of centre
        // Lake water
        addMesh(new THREE.BoxGeometry(200, 1, 160), 0x5599BB, -80, -0.7, 380);
        // Island base
        addMesh(new THREE.BoxGeometry(120, 2, 100), 0x5A8040, -80, 0.3, 380);
        // Main palace body
        addMesh(new THREE.BoxGeometry(100, 40, 50), 0xF5F5DC, -80, 21, 380);
        // Palace roof cornice
        addMesh(new THREE.BoxGeometry(104, 5, 54), 0xE8E8CC, -80, 43, 380);
        // Columned portico columns (4 columns)
        addMesh(new THREE.CylinderGeometry(2.5, 2.5, 40, 8), 0xFFFFEE, -96, 20, 355);
        addMesh(new THREE.CylinderGeometry(2.5, 2.5, 40, 8), 0xFFFFEE, -86, 20, 355);
        addMesh(new THREE.CylinderGeometry(2.5, 2.5, 40, 8), 0xFFFFEE, -74, 20, 355);
        addMesh(new THREE.CylinderGeometry(2.5, 2.5, 40, 8), 0xFFFFEE, -64, 20, 355);
        // Portico pediment
        addMesh(new THREE.BoxGeometry(40, 6, 5), 0xF0F0DC, -80, 43, 355);
        // Palace wings
        addMesh(new THREE.BoxGeometry(30, 28, 40), 0xF5F5DC, -148, 14, 380);
        addMesh(new THREE.BoxGeometry(30, 28, 40), 0xF5F5DC, -12, 14, 380);
        // Small dome on top
        addMesh(new THREE.SphereGeometry(10, 8, 6), 0xE8E8CC, -80, 52, 380);
    }

    function buildWarsawBarbican() {
        // Gothic defensive barbican — semicircular fortification
        // Main curved tower (approximated with cylinder)
        addMesh(new THREE.CylinderGeometry(22, 22, 50, 10), 0xAAAAAA, -140, 25, -60);
        // Hollow out approximation — inner darker cylinder (slightly smaller)
        addMesh(new THREE.CylinderGeometry(18, 18, 52, 10), 0x888888, -140, 25, -60);
        // Crenellations around top — row of merlons
        for (var m = 0; m < 10; m++) {
            var ang = (m / 10) * Math.PI * 2;
            var cx = -140 + Math.cos(ang) * 21;
            var cz = -60 + Math.sin(ang) * 21;
            addMesh(new THREE.BoxGeometry(4, 8, 4), 0xBBBBBB, cx - BASE_X + BASE_X, 53, cz - BASE_Z + BASE_Z);
        }
        // Gateway passage
        addMesh(new THREE.BoxGeometry(10, 30, 8), 0x666666, -140, 15, -40);
        // Flanking wall left
        addMesh(new THREE.BoxGeometry(60, 30, 8), 0xAAAAAA, -170, 15, -60);
        // Flanking wall right
        addMesh(new THREE.BoxGeometry(60, 30, 8), 0xAAAAAA, -110, 15, -60);
        // Barbican corner tower
        addMesh(new THREE.CylinderGeometry(7, 7, 40, 6), 0x999999, -200, 20, -60);
        addMesh(new THREE.ConeGeometry(9, 20, 6), 0x777777, -200, 50, -60);
        addMesh(new THREE.CylinderGeometry(7, 7, 40, 6), 0x999999, -80, 20, -60);
        addMesh(new THREE.ConeGeometry(9, 20, 6), 0x777777, -80, 50, -60);
    }

    function buildNeonSigns() {
        // Cold War-era neon signs — glowing coloured boxes on facades
        // Neon 1: Red neon bar
        addMesh(new THREE.BoxGeometry(30, 4, 3), 0xFF2222, -60, 60, 130);
        addMesh(new THREE.BoxGeometry(4, 20, 3), 0xFF2222, -70, 52, 130);
        // Neon 2: Cyan horizontal
        addMesh(new THREE.BoxGeometry(40, 3, 3), 0x00FFFF, 20, 55, 132);
        addMesh(new THREE.BoxGeometry(3, 16, 3), 0x00FFFF, 40, 48, 132);
        // Neon 3: Yellow vertical
        addMesh(new THREE.BoxGeometry(3, 30, 3), 0xFFEE00, 60, 50, 131);
        addMesh(new THREE.BoxGeometry(20, 3, 3), 0xFFEE00, 55, 66, 131);
        // Neon 4: Pink/magenta L-shape
        addMesh(new THREE.BoxGeometry(3, 22, 3), 0xFF44FF, -100, 62, -148);
        addMesh(new THREE.BoxGeometry(18, 3, 3), 0xFF44FF, -110, 51, -148);
        // Neon 5: Green Z-shape
        addMesh(new THREE.BoxGeometry(22, 3, 3), 0x22FF44, -40, 68, -148);
        addMesh(new THREE.BoxGeometry(3, 14, 3), 0x22FF44, -50, 61, -148);
        addMesh(new THREE.BoxGeometry(22, 3, 3), 0x22FF44, -40, 54, -148);
        // Neon 6: Orange arrow on PKiN-facing building
        addMesh(new THREE.BoxGeometry(24, 3, 3), 0xFF8800, 150, 42, -148);
        addMesh(new THREE.BoxGeometry(3, 16, 3), 0xFF8800, 162, 34, -148);
    }

    function buildModernSkyline() {
        // Glass skyscrapers of Warsaw financial district (west of PKiN)
        // Warsaw Trade Tower
        addMesh(new THREE.BoxGeometry(28, 220, 28), 0x88AACC, 180, 110, -300);
        addMesh(new THREE.BoxGeometry(30, 4, 30), 0x6688AA, 180, 222, -300);
        // Intraco II
        addMesh(new THREE.BoxGeometry(24, 160, 24), 0x99BBDD, 140, 80, -340);
        // Warsaw Financial Center
        addMesh(new THREE.BoxGeometry(32, 180, 32), 0x7799BB, 220, 90, -340);
        addMesh(new THREE.CylinderGeometry(16, 16, 10, 4), 0x6688AA, 220, 185, -340);
        // Rondo 1 tower
        addMesh(new THREE.CylinderGeometry(18, 18, 190, 8), 0xAABBCC, 160, 95, -390);
        addMesh(new THREE.ConeGeometry(10, 20, 8), 0x99AACC, 160, 200, -390);
        // Złota 44 residential tower
        addMesh(new THREE.BoxGeometry(18, 170, 18), 0xCCDDEE, 260, 85, -380);
        // Q22 office tower
        addMesh(new THREE.BoxGeometry(26, 155, 26), 0x88AACC, 130, 77, -440);
        // Glass reflection panels (thin flat faces)
        addMesh(new THREE.BoxGeometry(4, 180, 30), 0xBBCCDD, 168, 90, -302);
        addMesh(new THREE.BoxGeometry(4, 160, 26), 0xAABBCC, 152, 80, -342);
        // Millennium Plaza
        addMesh(new THREE.BoxGeometry(22, 120, 22), 0x99AABB, 300, 60, -360);
        // Ground level podium for district
        addMesh(new THREE.BoxGeometry(240, 12, 180), 0x666666, 200, 6, -360);
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
