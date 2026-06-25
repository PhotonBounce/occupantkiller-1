window.PortrushBeach = (function () {
    'use strict';

    var scene = null;
    var camera = null;
    var objects = [];

    var OX = 19680;
    var OY = 0;
    var OZ = 0;

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

    function makebox(w, h, d, color, x, y, z) {
        var geo = new THREE.BoxGeometry(w, h, d);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(OX + x, OY + y, OZ + z);
        return addMesh(mesh);
    }

    function makecyl(rt, rb, h, segs, color, x, y, z) {
        var geo = new THREE.CylinderGeometry(rt, rb, h, segs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(OX + x, OY + y, OZ + z);
        return addMesh(mesh);
    }

    function makesphere(r, ws, hs, color, x, y, z) {
        var geo = new THREE.SphereGeometry(r, ws, hs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(OX + x, OY + y, OZ + z);
        return addMesh(mesh);
    }

    function makecone(r, h, segs, color, x, y, z) {
        var geo = new THREE.ConeGeometry(r, h, segs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(OX + x, OY + y, OZ + z);
        return addMesh(mesh);
    }

    function build() {
        buildSea();
        buildPeninsula();
        buildEastStrand();
        buildWestStrand();
        buildSurfWaves();
        buildCurranCourt();
        buildBarrysAmusements();
        buildGolfCourse();
        buildDunluceCastle();
        buildPortrushTown();
        buildSkerriesRocks();
        buildHolidaymakers();
    }

    function buildSea() {
        // Atlantic ocean — large flat slab of water colour boxes around peninsula
        // North sea
        makebox(600, 4, 300, 0x1E6BA8,   0, -2, -220);
        // South sea
        makebox(600, 4, 300, 0x1E6BA8,   0, -2,  220);
        // East sea
        makebox(300, 4, 300, 0x1E6BA8,  250, -2,  0);
        // Deeper water darker
        makebox(800, 2, 800, 0x145A8A,   0, -5,  0);
        // White foam patches
        makebox(60,  1, 10, 0xE8F4FF,  -180, 1, -90);
        makebox(40,  1,  8, 0xE8F4FF,   200, 1,  60);
        makebox(50,  1,  9, 0xE8F4FF,  -160, 1,  80);
    }

    function buildPeninsula() {
        // Peninsula ground mass — Portrush sits on a rocky basalt peninsula
        makebox(280, 6, 160, 0x8B7355,   0,  -1,  0);
        // Rocky base cliffs on north edge
        makebox(280, 12, 20, 0x6B6B6B,   0,   0, -80);
        // Rocky base cliffs south edge
        makebox(280, 10, 20, 0x6B6B6B,   0,   0,  80);
        // Rocky cliffs east tip
        makebox(20,  14, 120, 0x5A5A5A,  140,  2,  0);
        // Headland ground flatten
        makebox(120, 4, 80, 0x7A6B4A,  -80, -1,  0);
    }

    function buildEastStrand() {
        // East Strand — long sandy beach on east side
        makebox(220, 3, 60, 0xF5DEB3,   60,  0,  100);
        // Beach layering for depth
        makebox(180, 2, 40, 0xEDD89F,   70,  1,  110);
        // Dry upper sand
        makebox(220, 2, 25, 0xFAEAC0,   60,  2,  90);
        // Sand dune ridges
        makebox(30,  5, 8, 0xE8D59A,   20,  3,  95);
        makebox(25,  4, 7, 0xE8D59A,   60,  3,  98);
        makebox(20,  4, 6, 0xE8D59A,  100,  3,  96);
        // Promenade edge strip
        makebox(200, 4, 6, 0xC0C0C0,   60,  2,  76);
    }

    function buildWestStrand() {
        // West Strand — wider beach on west/south side
        makebox(260, 3, 80, 0xF5DEB3,  -30,  0, -115);
        makebox(200, 2, 50, 0xEDD89F,  -20,  1, -120);
        // Upper dry sand
        makebox(240, 2, 30, 0xFAEAC0,  -30,  2, -100);
        // Dune ridges west
        makebox(35,  6, 9, 0xDECB8A,  -80,  3, -105);
        makebox(28,  5, 8, 0xDECB8A,  -40,  3, -108);
        makebox(22,  4, 6, 0xDECB8A,    0,  3, -106);
        // West promenade
        makebox(220, 4, 8, 0xB8B8B8,  -20,  2, -85);
    }

    function buildSurfWaves() {
        // White surf wave lines approaching East Strand
        makebox(200, 2, 6, 0xFFFAF0,   80,  1,  78);
        makebox(180, 2, 5, 0xFFFAF0,   85,  1,  85);
        makebox(160, 2, 4, 0xFFFAF0,   88,  1,  92);
        // Surf approaching West Strand
        makebox(220, 2, 6, 0xFFFAF0,  -20,  1, -82);
        makebox(200, 2, 5, 0xFFFAF0,  -15,  1, -90);
        makebox(180, 2, 4, 0xFFFAF0,  -10,  1, -97);
    }

    function buildCurranCourt() {
        // Victorian/Edwardian hotel and guesthouse terraces along seafront
        // Main hotel block — large imposing Victorian building
        makebox(40, 20, 18, 0xCD5C5C,  -60,  10, 60);
        // Hotel roof
        makebox(42, 4, 20, 0x8B3A3A,  -60,  22, 60);
        // Chimney stacks on hotel
        makebox(3,  8,  3, 0x7A3030,  -50,  28, 58);
        makebox(3,  8,  3, 0x7A3030,  -70,  28, 58);
        // Second guesthouse terrace block
        makebox(30, 18, 16, 0xC86464,  -20,   9, 60);
        makebox(32,  3, 18, 0x8B3A3A,  -20,  19, 60);
        // Third terrace — bay window protrusion
        makebox(25, 16, 14, 0xCD5C5C,   10,   8, 60);
        makebox(6,  14,  4, 0xB84444,   16,   7, 67);
        // Seafront guesthouses east row
        makebox(20, 15, 12, 0xC86464,   40,   7, 62);
        makebox(20, 15, 12, 0xC86464,   62,   7, 62);
        makebox(20, 15, 12, 0xCD5C5C,   84,   7, 62);
        // Seafront promenade wall
        makebox(200, 5, 4, 0xD3D3D3,    0,   2, 70);
    }

    function buildBarrysAmusements() {
        // Barry's Amusements — iconic fairground (now closed)
        // Big Wheel — CylinderGeometry ring (open cylinder = thin walls)
        // Outer ring
        makecyl(22, 22, 3, 24, 0xFF4500,  -110, 25, 30);
        // Inner ring
        makecyl(18, 18, 3, 24, 0xFF6030,  -110, 25, 30);
        // Wheel axle support pillar left
        makebox(4, 26, 4, 0x8B0000,  -128, 13, 30);
        // Wheel axle support pillar right
        makebox(4, 26, 4, 0x8B0000,  -92,  13, 30);
        // Axle cross bar
        makebox(40, 4, 4, 0xCC3300,  -110, 26, 30);
        // Gondola cars on wheel — 6 box gondolas
        makebox(5, 4, 5, 0xFFD700,  -110, 47, 30);
        makebox(5, 4, 5, 0xFFD700,  -110, 3,  30);
        makebox(5, 4, 5, 0xFFD700,  -88,  25, 30);
        makebox(5, 4, 5, 0xFFD700,  -132, 25, 30);
        makebox(5, 4, 5, 0xFFD700,  -99,  44, 30);
        makebox(5, 4, 5, 0xFFD700,  -121, 6,  30);
        // Roller coaster track sections
        makebox(60,  3,  6, 0xFF6600,  -90, 20, 10);
        makebox(60,  3,  6, 0xFF6600,  -90, 20, 50);
        makebox(8,   25, 6, 0xFF6600,  -65, 12, 10);
        makebox(8,   25, 6, 0xFF6600,  -65, 12, 50);
        // Roller coaster hill peak
        makebox(60,  3,  6, 0xFF6600,  -90, 34, 10);
        makebox(60,  3,  6, 0xFF6600,  -90, 34, 50);
        // Fun fair main building
        makebox(50, 14, 40, 0xFF4500,  -90,  7, 30);
        // Fun fair roof
        makebox(54,  4, 44, 0xCC2200,  -90, 15, 30);
        // Entrance archway
        makebox(12,  8,  4, 0xFF6600,  -90, 4, 10);
        // Ticket booth
        makebox(5,   6,  5, 0xFFAA00,  -82, 3, 8);
        // Carousel base
        makecyl(8, 8, 3, 16, 0xFF69B4,  -110, 2, 50);
        makecone(8, 6, 16, 0xFF1493,   -110, 8, 50);
    }

    function buildGolfCourse() {
        // Royal Portrush Golf Club — championship links course
        // Main fairway swathe — flat green surface
        makebox(180, 2, 90, 0x228B22,   60, 0, -40);
        // Second fairway
        makebox(140, 2, 70, 0x228B22,  -30, 0, -45);
        // Rough grass patches (darker)
        makebox(30,  2, 20, 0x1A6B1A,   90, 0, -20);
        makebox(25,  2, 18, 0x1A6B1A,   40, 0, -55);
        // Sand bunkers
        makebox(14,  1, 10, 0xF5DEB3,   70, 1, -30);
        makebox(12,  1,  9, 0xF5DEB3,  110, 1, -45);
        makebox(10,  1,  8, 0xF5DEB3,   30, 1, -52);
        // Flagstick on green
        makebox(1,  12,  1, 0xFFFFFF,   95, 6, -38);
        makebox(5,   3,  1, 0xFF0000,   97, 12, -38);
        // Second hole flagstick
        makebox(1,  12,  1, 0xFFFFFF,   45, 6, -48);
        makebox(5,   3,  1, 0xFF0000,   47, 12, -48);
        // Clubhouse — imposing whitewashed building
        makebox(40, 14, 24, 0xF5F5DC,   85,  7, -65);
        // Clubhouse wing
        makebox(20, 10, 16, 0xEDEDD5,  115,  5, -65);
        // Clubhouse roof
        makebox(44,  5, 28, 0xC8C8A0,   85, 16, -65);
        // Clubhouse chimney
        makebox(3,   8,  3, 0x808080,   80, 22, -62);
        makebox(3,   8,  3, 0x808080,   90, 22, -62);
        // Club car park
        makebox(40,  1, 20, 0x555555,   85,  1, -82);
    }

    function buildDunluceCastle() {
        // Dunluce Castle ruins on dramatic headland west of Portrush
        // Clifftop base
        makebox(60, 10, 50, 0x696969, -175, 5, -30);
        // Main castle tower keep
        makebox(18, 28, 16, 0x808080, -170, 14, -28);
        // Tower battlements row
        makebox(20,  4,  4, 0x707070, -170, 29, -28);
        // Tower ruined top section
        makebox(10, 10,  8, 0x787878, -164, 34, -28);
        // Second tower
        makebox(14, 22, 12, 0x808080, -188, 11, -32);
        makebox(16,  4,  4, 0x707070, -188, 24, -32);
        // Curtain wall between towers
        makebox(20, 16,  4, 0x787878, -179, 8, -28);
        // Gatehouse arch block
        makebox(10, 14,  8, 0x909090, -175, 7, -22);
        // Ruined inner wall
        makebox(30,  8,  4, 0x787878, -170, 4, -38);
        // Castle on sea cliff rock pinnacle
        makebox(50, 18, 40, 0x6B6560, -175, -1, -30);
        // Sea stack nearby
        makebox(8,  20,  8, 0x7A7268, -200, 10, -20);
    }

    function buildPortrushTown() {
        // Main Street Victorian commercial buildings
        makebox(30, 16, 14, 0xCD5C5C,  -30,  8,  35);
        makebox(28, 18, 14, 0xC86464,   -2,  9,  35);
        makebox(30, 14, 14, 0xBE5050,   26,  7,  35);
        // Shop front ground floors
        makebox(30,  5, 14, 0xE8A080,  -30,  2,  35);
        makebox(28,  5, 14, 0xE0906A,   -2,  2,  35);
        // Arcadia leisure complex — art deco style
        makebox(45, 20, 30, 0xD2B48C,   80,  10, 35);
        makebox(50,  5, 34, 0xC8A882,   80,  22, 35);
        // Arcadia dome
        makecyl(12, 12, 6, 16, 0xC0A87A,  80,  28, 35);
        makecone(12, 8, 16, 0xB09060,    80,  34, 35);
        // RNLI Lifeboat station — on harbour
        makebox(20, 10, 30, 0xFF6600,  120,  5,  50);
        makebox(22,  3, 32, 0xCC4400,  120, 11,  50);
        // Lifeboat slipway
        makebox(8,   2, 25, 0x888888,  120,  1,  65);
        // Harbour wall
        makebox(80,  8,  5, 0xAAAAAA,  100,  4,  72);
        makebox(5,   8, 40, 0xAAAAAA,  140,  4,  55);
        // Harbour water inside
        makebox(50,  2, 30, 0x1A5F9A,  115,  0,  55);
        // Town church with spire
        makebox(16, 20, 20, 0xD3D3D3,  -55,  10, 30);
        makecone(8,  18,  8, 0xC0C0C0, -55,  29, 30);
        // Church stained window box
        makebox(4,   6,  1, 0x4A90D9,  -55,  12, 20);
        // Post office / civic building
        makebox(22, 12, 14, 0xB8860B,   50,  6,  30);
        // Bus shelter / stop
        makebox(6,   5,  4, 0xADD8E6,  -10,  2,  25);
        // Seaside ice cream parlour
        makebox(12,  8, 10, 0xFFB6C1,   30,  4,  25);
    }

    function buildSkerriesRocks() {
        // Skerries — offshore rocky islets north of Portrush
        // Main rock group
        makebox(25, 8, 20, 0x696969,  -50, -2, -170);
        makecyl(6, 8, 10, 8, 0x5F5F5F, -45, 1, -172);
        makebox(18, 6, 14, 0x707070,  -30, -3, -175);
        makecyl(5, 7,  8, 8, 0x606060,  -62, 0, -168);
        // Second Skerries group
        makebox(20, 7, 16, 0x696969,   60, -2, -180);
        makecyl(4, 5,  7, 8, 0x5F5F5F,  68, 0, -182);
        // White foam around rocks
        makebox(35, 1, 25, 0xE8F4FF,  -50,  2, -170);
        makebox(28, 1, 20, 0xE8F4FF,   60,  2, -180);
        // Lighthouse on Skerries
        makecyl(3, 3, 18, 8, 0xFFFFFF,  -45, 9, -170);
        makecyl(4, 4,  3, 8, 0xCC0000,  -45, 19, -170);
        makecone(4, 5,  8, 0xFFFFFF,   -45, 22, -170);
    }

    function buildHolidaymakers() {
        // Summer holidaymakers — box figures on the beach
        // Figure person on East Strand 1
        makebox(3, 8,  3, 0xFFDAAA,   50, 4, 88);
        makebox(3, 3,  3, 0xFF9966,   50, 9, 88);
        // Figure person 2
        makebox(3, 8,  3, 0xFFCC99,   65, 4, 92);
        makebox(3, 3,  3, 0x3399FF,   65, 9, 92);
        // Figure person 3 — sitting (shorter)
        makebox(4, 4,  4, 0xFFBB88,   80, 2, 95);
        makebox(3, 3,  3, 0xFF3366,   80, 5, 95);
        // Figure person 4
        makebox(3, 8,  3, 0xFFCCAA,   95, 4, 90);
        makebox(3, 3,  3, 0x228B22,   95, 9, 90);
        // West Strand figures
        makebox(3, 8,  3, 0xFFDAAA,  -40, 4, -112);
        makebox(3, 3,  3, 0xFF6699,  -40, 9, -112);
        makebox(3, 8,  3, 0xFFCC99,  -60, 4, -115);
        makebox(3, 3,  3, 0x6699FF,  -60, 9, -115);
        // Child figure (smaller)
        makebox(2, 5,  2, 0xFFBB88,  -50, 2, -110);
        makebox(2, 2,  2, 0xFFAA00,  -50, 6, -110);
        // Ice cream van — white BoxGeometry van on promenade
        makebox(10, 6,  6, 0xFFFFF0,   30, 3, 74);
        makebox(10, 2,  6, 0xCCCCCC,   30, 6, 74);
        // Van cab section
        makebox(4,  5,  6, 0xEEEEEE,   38, 2, 74);
        // Van wheel boxes
        makebox(2,  2,  2, 0x333333,   26, 0, 72);
        makebox(2,  2,  2, 0x333333,   34, 0, 72);
        // Windmill / funfair kiosk near beach
        makecyl(5,  5, 8, 8, 0xFFAA00,  10, 4, 80);
        makecone(5, 5, 8,    0xFF6600,  10, 9, 80);
        // Lifeguard tower on East Strand
        makebox(5, 10, 5, 0xFF0000,  110, 5, 85);
        makebox(8,  2, 8, 0xFF3300,  110, 10, 85);
        // Beach windbreaks — coloured box panels
        makebox(1, 6, 12, 0xFF6699,   55, 3, 96);
        makebox(1, 6, 12, 0x3399FF,   68, 3, 99);
        // Deck chairs (flat box shapes)
        makebox(4, 1, 6, 0xFFFF00,    45, 2, 90);
        makebox(4, 1, 6, 0xFF6600,    52, 2, 92);
        makebox(4, 1, 6, 0x00CCFF,    59, 2, 88);
        // Seagull spheres (hovering over beach)
        makesphere(1.5, 6, 4, 0xFFFFFF,  60, 15, 85);
        makesphere(1.5, 6, 4, 0xFFFFFF,  45, 18, 92);
        makesphere(1.5, 6, 4, 0xCCCCCC,  90, 12, 80);
        // Litter bin on prom
        makecyl(2, 2, 5, 8, 0x006600,  20, 2, 73);
        makecyl(2, 2, 5, 8, 0x006600,  40, 2, 73);
        // Bench on promenade
        makebox(8, 2, 3, 0x8B4513,   70, 3, 72);
        makebox(8, 2, 3, 0x8B4513,  100, 3, 72);
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
