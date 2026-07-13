window.LiverpoolDocks = (function () {
    'use strict';

    var scene = null;
    var camera = null;
    var objects = [];

    var BASE_X = 21200;
    var BASE_Y = 0;
    var BASE_Z = 0;

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
        objects = [];
        build();
    }

    function addMesh(mesh) {
        scene.add(mesh);
        objects.push(mesh);
    }

    function makeBox(w, h, d, color, x, y, z) {
        var geo = new THREE.BoxGeometry(w, h, d);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        return mesh;
    }

    function makeCylinder(rt, rb, h, segs, color, x, y, z) {
        var geo = new THREE.CylinderGeometry(rt, rb, h, segs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        return mesh;
    }

    function makeSphere(r, ws, hs, color, x, y, z) {
        var geo = new THREE.SphereGeometry(r, ws, hs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        return mesh;
    }

    function makeCone(r, h, segs, color, x, y, z) {
        var geo = new THREE.ConeGeometry(r, h, segs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        return mesh;
    }

    function build() {
        buildGround();
        buildRiver();
        buildRoyalLiverBuilding();
        buildCunardBuilding();
        buildPortOfLiverpoolBuilding();
        buildAlbertDock();
        buildTateLiverpool();
        buildMuseumOfLiverpool();
        buildMerseyFerry();
        buildMetropolitanCathedral();
        buildBirkenheadSkyline();
        buildPierHead();
        buildStreetFurniture();
    }

    function buildGround() {
        // Pier Head plaza ground — use a flat box
        addMesh(makeBox(600, 2, 400, 0x8B8680, BASE_X, BASE_Y - 1, BASE_Z));
        // Dock road surface
        addMesh(makeBox(600, 1, 60, 0x555555, BASE_X, BASE_Y, BASE_Z + 230));
        // Cobblestone dock area
        addMesh(makeBox(400, 1, 200, 0x9E8B7A, BASE_X - 60, BASE_Y, BASE_Z + 130));
    }

    function buildRiver() {
        // Main river Mersey surface — wide box
        addMesh(makeBox(1200, 2, 500, 0x006994, BASE_X + 200, BASE_Y - 3, BASE_Z - 300));
        // River bank retaining wall
        addMesh(makeBox(600, 8, 10, 0x696969, BASE_X, BASE_Y + 3, BASE_Z - 60));
        // River ripple detail strip
        addMesh(makeBox(1000, 1, 20, 0x0077A8, BASE_X + 100, BASE_Y - 2, BASE_Z - 150));
    }

    function buildRoyalLiverBuilding() {
        var bx = BASE_X - 160;
        var bz = BASE_Z - 20;

        // Main body
        addMesh(makeBox(90, 80, 60, 0x8B9B8B, bx, BASE_Y + 40, bz));
        // Left clock tower base
        addMesh(makeBox(22, 100, 22, 0x7A8A7A, bx - 28, BASE_Y + 50, bz));
        // Right clock tower base
        addMesh(makeBox(22, 100, 22, 0x7A8A7A, bx + 28, BASE_Y + 50, bz));
        // Left clock tower upper section
        addMesh(makeBox(18, 30, 18, 0x6B7B6B, bx - 28, BASE_Y + 115, bz));
        // Right clock tower upper section
        addMesh(makeBox(18, 30, 18, 0x6B7B6B, bx + 28, BASE_Y + 115, bz));
        // Left clock face (inset disc)
        addMesh(makeCylinder(8, 8, 2, 12, 0xCCBB88, bx - 28, BASE_Y + 120, bz - 9));
        // Right clock face
        addMesh(makeCylinder(8, 8, 2, 12, 0xCCBB88, bx + 28, BASE_Y + 120, bz - 9));
        // Left tower roof
        addMesh(makeCone(11, 20, 8, 0x5A6A5A, bx - 28, BASE_Y + 142, bz));
        // Right tower roof
        addMesh(makeCone(11, 20, 8, 0x5A6A5A, bx + 28, BASE_Y + 142, bz));
        // Left Liver Bird body (sphere)
        addMesh(makeSphere(5, 8, 8, 0x4A5A4A, bx - 28, BASE_Y + 158, bz));
        // Right Liver Bird body (sphere)
        addMesh(makeSphere(5, 8, 8, 0x4A5A4A, bx + 28, BASE_Y + 158, bz));
        // Left Liver Bird left wing (box feather)
        addMesh(makeBox(14, 3, 4, 0x3A4A3A, bx - 35, BASE_Y + 160, bz));
        // Left Liver Bird right wing (box feather)
        addMesh(makeBox(14, 3, 4, 0x3A4A3A, bx - 21, BASE_Y + 160, bz));
        // Right Liver Bird left wing
        addMesh(makeBox(14, 3, 4, 0x3A4A3A, bx + 21, BASE_Y + 160, bz));
        // Right Liver Bird right wing
        addMesh(makeBox(14, 3, 4, 0x3A4A3A, bx + 35, BASE_Y + 160, bz));
        // Main building cornice band
        addMesh(makeBox(94, 4, 64, 0x9DADAD, bx, BASE_Y + 82, bz));
        // Ground floor rusticated base
        addMesh(makeBox(92, 14, 62, 0x7A8A7A, bx, BASE_Y + 7, bz));
        // Central entrance arch
        addMesh(makeBox(14, 12, 4, 0x5C6C5C, bx, BASE_Y + 10, bz - 30));
    }

    function buildCunardBuilding() {
        var bx = BASE_X - 60;
        var bz = BASE_Z - 20;

        // Main palazzo body
        addMesh(makeBox(80, 60, 55, 0xD4C9B0, bx, BASE_Y + 30, bz));
        // Rusticated base
        addMesh(makeBox(82, 12, 57, 0xBFB49B, bx, BASE_Y + 6, bz));
        // Cornice top
        addMesh(makeBox(84, 5, 59, 0xC8BDA4, bx, BASE_Y + 63, bz));
        // Parapet top
        addMesh(makeBox(80, 6, 55, 0xD4C9B0, bx, BASE_Y + 67, bz));
        // Left column cluster
        addMesh(makeCylinder(2, 2, 40, 8, 0xCCC0A0, bx - 28, BASE_Y + 30, bz - 27));
        // Centre-left column
        addMesh(makeCylinder(2, 2, 40, 8, 0xCCC0A0, bx - 14, BASE_Y + 30, bz - 27));
        // Centre-right column
        addMesh(makeCylinder(2, 2, 40, 8, 0xCCC0A0, bx + 14, BASE_Y + 30, bz - 27));
        // Right column cluster
        addMesh(makeCylinder(2, 2, 40, 8, 0xCCC0A0, bx + 28, BASE_Y + 30, bz - 27));
        // Entrance portico roof
        addMesh(makeBox(36, 4, 12, 0xD4C9B0, bx, BASE_Y + 50, bz - 27));
    }

    function buildPortOfLiverpoolBuilding() {
        var bx = BASE_X + 50;
        var bz = BASE_Z - 20;

        // Main Baroque body
        addMesh(makeBox(80, 55, 60, 0xD4C9B0, bx, BASE_Y + 27, bz));
        // Rusticated base
        addMesh(makeBox(82, 10, 62, 0xC0B598, bx, BASE_Y + 5, bz));
        // Drum for dome
        addMesh(makeCylinder(20, 20, 18, 16, 0xCDC2A8, bx, BASE_Y + 64, bz));
        // Green copper dome (SphereGeometry)
        addMesh(makeSphere(21, 16, 12, 0x4E9B6F, bx, BASE_Y + 82, bz));
        // Lantern on dome
        addMesh(makeCylinder(4, 4, 10, 8, 0xCDC2A8, bx, BASE_Y + 101, bz));
        // Lantern cap cone
        addMesh(makeCone(4, 8, 8, 0x4E9B6F, bx, BASE_Y + 110, bz));
        // Corner turrets (4)
        addMesh(makeCylinder(5, 5, 20, 8, 0xD4C9B0, bx - 35, BASE_Y + 65, bz - 25));
        addMesh(makeCylinder(5, 5, 20, 8, 0xD4C9B0, bx + 35, BASE_Y + 65, bz - 25));
        addMesh(makeCylinder(5, 5, 20, 8, 0xD4C9B0, bx - 35, BASE_Y + 65, bz + 25));
        addMesh(makeCylinder(5, 5, 20, 8, 0xD4C9B0, bx + 35, BASE_Y + 65, bz + 25));
        // Turret cone caps
        addMesh(makeCone(5, 10, 8, 0x4E9B6F, bx - 35, BASE_Y + 76, bz - 25));
        addMesh(makeCone(5, 10, 8, 0x4E9B6F, bx + 35, BASE_Y + 76, bz - 25));
        addMesh(makeCone(5, 10, 8, 0x4E9B6F, bx - 35, BASE_Y + 76, bz + 25));
        addMesh(makeCone(5, 10, 8, 0x4E9B6F, bx + 35, BASE_Y + 76, bz + 25));
        // Front colonnade columns
        addMesh(makeCylinder(2.5, 2.5, 35, 8, 0xD4C9B0, bx - 25, BASE_Y + 27, bz - 30));
        addMesh(makeCylinder(2.5, 2.5, 35, 8, 0xD4C9B0, bx, BASE_Y + 27, bz - 30));
        addMesh(makeCylinder(2.5, 2.5, 35, 8, 0xD4C9B0, bx + 25, BASE_Y + 27, bz - 30));
    }

    function buildAlbertDock() {
        var bx = BASE_X - 80;
        var bz = BASE_Z + 120;

        // North warehouse block
        addMesh(makeBox(200, 40, 30, 0xCD5C5C, bx, BASE_Y + 20, bz - 50));
        // South warehouse block
        addMesh(makeBox(200, 40, 30, 0xCD5C5C, bx, BASE_Y + 20, bz + 50));
        // East warehouse block
        addMesh(makeBox(30, 40, 100, 0xCD5C5C, bx + 100, BASE_Y + 20, bz));
        // West warehouse block
        addMesh(makeBox(30, 40, 100, 0xCD5C5C, bx - 100, BASE_Y + 20, bz));
        // Dock water basin
        addMesh(makeBox(140, 2, 90, 0x005577, bx, BASE_Y - 1, bz));
        // Cast iron Doric columns along north block — 6 columns
        addMesh(makeCylinder(2, 2, 42, 8, 0x2F2F2F, bx - 80, BASE_Y + 21, bz - 35));
        addMesh(makeCylinder(2, 2, 42, 8, 0x2F2F2F, bx - 48, BASE_Y + 21, bz - 35));
        addMesh(makeCylinder(2, 2, 42, 8, 0x2F2F2F, bx - 16, BASE_Y + 21, bz - 35));
        addMesh(makeCylinder(2, 2, 42, 8, 0x2F2F2F, bx + 16, BASE_Y + 21, bz - 35));
        addMesh(makeCylinder(2, 2, 42, 8, 0x2F2F2F, bx + 48, BASE_Y + 21, bz - 35));
        addMesh(makeCylinder(2, 2, 42, 8, 0x2F2F2F, bx + 80, BASE_Y + 21, bz - 35));
        // Cast iron columns south block
        addMesh(makeCylinder(2, 2, 42, 8, 0x2F2F2F, bx - 80, BASE_Y + 21, bz + 35));
        addMesh(makeCylinder(2, 2, 42, 8, 0x2F2F2F, bx - 48, BASE_Y + 21, bz + 35));
        addMesh(makeCylinder(2, 2, 42, 8, 0x2F2F2F, bx + 48, BASE_Y + 21, bz + 35));
        addMesh(makeCylinder(2, 2, 42, 8, 0x2F2F2F, bx + 80, BASE_Y + 21, bz + 35));
        // Warehouse upper windows strip (dark boxes inset)
        addMesh(makeBox(180, 6, 2, 0x8B3A3A, bx, BASE_Y + 32, bz - 64));
        addMesh(makeBox(180, 6, 2, 0x8B3A3A, bx, BASE_Y + 32, bz + 64));
        // Dock edge quayside
        addMesh(makeBox(210, 3, 10, 0x888880, bx, BASE_Y + 1, bz - 55));
        addMesh(makeBox(210, 3, 10, 0x888880, bx, BASE_Y + 1, bz + 55));
    }

    function buildTateLiverpool() {
        // Tate occupies west end of Albert Dock
        var bx = BASE_X - 180;
        var bz = BASE_Z + 120;
        // Gallery body (already part of west dock block, add signage wall)
        addMesh(makeBox(28, 40, 95, 0xDDD0C8, bx, BASE_Y + 20, bz));
        // Tate entrance canopy
        addMesh(makeBox(20, 5, 10, 0xCCCCCC, bx, BASE_Y + 41, bz));
        // Internal atrium column
        addMesh(makeCylinder(3, 3, 38, 8, 0xAAA098, bx, BASE_Y + 20, bz));
    }

    function buildMuseumOfLiverpool() {
        // Modern angular museum on Pier Head, north of Three Graces
        var bx = BASE_X + 160;
        var bz = BASE_Z + 10;
        // Main angled body
        addMesh(makeBox(90, 30, 50, 0xD3D3D3, bx, BASE_Y + 15, bz));
        // Cantilevered upper wing
        addMesh(makeBox(70, 14, 40, 0xC8C8C8, bx + 10, BASE_Y + 37, bz));
        // Entrance stepped plinth
        addMesh(makeBox(50, 6, 14, 0xBBBBBB, bx, BASE_Y + 3, bz - 25));
        // Angled roof overhang
        var overhang = makeBox(92, 4, 54, 0xCFCFCF, bx, BASE_Y + 45, bz);
        overhang.rotation.z = 0.06;
        addMesh(overhang);
        // Glazing strip (dark)
        addMesh(makeBox(80, 8, 2, 0x3A4A5A, bx, BASE_Y + 28, bz - 25));
    }

    function buildMerseyFerry() {
        // Ferry crossing mid-river
        var bx = BASE_X + 80;
        var bz = BASE_Z - 200;
        // Hull
        addMesh(makeBox(40, 8, 18, 0x228822, bx, BASE_Y + 2, bz));
        // Superstructure deck
        addMesh(makeBox(32, 5, 14, 0xEEEEEE, bx, BASE_Y + 9, bz));
        // Bridge cabin
        addMesh(makeBox(14, 6, 10, 0xFFFFFF, bx + 2, BASE_Y + 15, bz));
        // Funnel
        addMesh(makeCylinder(3, 3.5, 12, 8, 0xDD2222, bx - 4, BASE_Y + 20, bz));
        // Funnel top black band
        addMesh(makeCylinder(3.1, 3.1, 3, 8, 0x111111, bx - 4, BASE_Y + 27, bz));
        // Bow bulge
        addMesh(makeSphere(6, 8, 6, 0x228822, bx + 20, BASE_Y + 1, bz));
        // Stern railing boxes
        addMesh(makeBox(2, 4, 18, 0xCCCCCC, bx - 18, BASE_Y + 13, bz));
    }

    function buildMetropolitanCathedral() {
        // "Paddy's Wigwam" — modern concrete circular cathedral
        var bx = BASE_X - 180;
        var bz = BASE_Z + 260;

        // Main cylindrical body
        addMesh(makeCylinder(45, 50, 30, 16, 0xD3D3D3, bx, BASE_Y + 15, bz));
        // Stepped plinth ring 1
        addMesh(makeCylinder(55, 58, 8, 16, 0xBBBBBB, bx, BASE_Y + 4, bz));
        // Stepped plinth ring 2
        addMesh(makeCylinder(62, 65, 5, 16, 0xB0B0B0, bx, BASE_Y + 2, bz));
        // Conical roof
        addMesh(makeCone(46, 40, 16, 0xC8C8C8, bx, BASE_Y + 50, bz));
        // Lantern tower cylinder
        addMesh(makeCylinder(10, 10, 20, 12, 0x8888AA, bx, BASE_Y + 80, bz));
        // Lantern cone crown
        addMesh(makeCone(10, 14, 12, 0x6666AA, bx, BASE_Y + 97, bz));
        // Parabolic flying buttress — N
        addMesh(makeBox(6, 25, 6, 0xCCCCCC, bx, BASE_Y + 25, bz - 56));
        // Buttress NE
        addMesh(makeBox(6, 25, 6, 0xCCCCCC, bx + 40, BASE_Y + 25, bz - 40));
        // Buttress E
        addMesh(makeBox(6, 25, 6, 0xCCCCCC, bx + 56, BASE_Y + 25, bz));
        // Buttress SE
        addMesh(makeBox(6, 25, 6, 0xCCCCCC, bx + 40, BASE_Y + 25, bz + 40));
        // Buttress S
        addMesh(makeBox(6, 25, 6, 0xCCCCCC, bx, BASE_Y + 25, bz + 56));
        // Buttress SW
        addMesh(makeBox(6, 25, 6, 0xCCCCCC, bx - 40, BASE_Y + 25, bz + 40));
        // Buttress W
        addMesh(makeBox(6, 25, 6, 0xCCCCCC, bx - 56, BASE_Y + 25, bz));
        // Buttress NW
        addMesh(makeBox(6, 25, 6, 0xCCCCCC, bx - 40, BASE_Y + 25, bz - 40));
    }

    function buildBirkenheadSkyline() {
        // Distant urban blocks across the Mersey (far z negative)
        var bx = BASE_X;
        var bz = BASE_Z - 520;
        // Row of varied building silhouettes
        addMesh(makeBox(40, 35, 20, 0x888888, bx - 200, BASE_Y + 17, bz));
        addMesh(makeBox(30, 50, 18, 0x777777, bx - 150, BASE_Y + 25, bz));
        addMesh(makeBox(50, 28, 22, 0x888888, bx - 90, BASE_Y + 14, bz));
        addMesh(makeBox(25, 60, 16, 0x666666, bx - 40, BASE_Y + 30, bz));
        addMesh(makeBox(35, 40, 20, 0x888888, bx + 20, BASE_Y + 20, bz));
        addMesh(makeBox(28, 55, 18, 0x777777, bx + 80, BASE_Y + 27, bz));
        addMesh(makeBox(45, 32, 22, 0x888888, bx + 140, BASE_Y + 16, bz));
        addMesh(makeBox(30, 48, 16, 0x666666, bx + 200, BASE_Y + 24, bz));
        // Birkenhead Priory church tower silhouette
        addMesh(makeBox(16, 55, 16, 0x777777, bx - 240, BASE_Y + 27, bz));
        addMesh(makeCone(8, 14, 4, 0x666666, bx - 240, BASE_Y + 62, bz));
    }

    function buildPierHead() {
        // Pier Head promenade and landing stage features
        var bx = BASE_X;
        var bz = BASE_Z - 50;
        // Promenade walkway
        addMesh(makeBox(500, 2, 20, 0xA09888, bx, BASE_Y, bz));
        // Landing stage jetty arm
        addMesh(makeBox(20, 4, 60, 0x8B7355, bx - 200, BASE_Y + 1, bz - 40));
        // Flagpole left
        addMesh(makeCylinder(0.8, 0.8, 30, 6, 0xCCCCCC, bx - 80, BASE_Y + 15, bz));
        // Flagpole right
        addMesh(makeCylinder(0.8, 0.8, 30, 6, 0xCCCCCC, bx + 80, BASE_Y + 15, bz));
        // Memorial plinth
        addMesh(makeBox(10, 10, 10, 0xC8C0B0, bx, BASE_Y + 5, bz - 10));
        addMesh(makeSphere(4, 8, 8, 0xB8B0A0, bx, BASE_Y + 14, bz - 10));
        // Bench rows (small boxes)
        addMesh(makeBox(8, 2, 3, 0x8B6914, bx - 40, BASE_Y + 2, bz + 5));
        addMesh(makeBox(8, 2, 3, 0x8B6914, bx, BASE_Y + 2, bz + 5));
        addMesh(makeBox(8, 2, 3, 0x8B6914, bx + 40, BASE_Y + 2, bz + 5));
    }

    function buildStreetFurniture() {
        var bx = BASE_X;
        var bz = BASE_Z + 200;
        // Street lamp posts along dock road
        addMesh(makeCylinder(0.5, 0.5, 16, 6, 0x333333, bx - 120, BASE_Y + 8, bz));
        addMesh(makeSphere(1.5, 6, 6, 0xFFEEAA, bx - 120, BASE_Y + 16, bz));
        addMesh(makeCylinder(0.5, 0.5, 16, 6, 0x333333, bx - 60, BASE_Y + 8, bz));
        addMesh(makeSphere(1.5, 6, 6, 0xFFEEAA, bx - 60, BASE_Y + 16, bz));
        addMesh(makeCylinder(0.5, 0.5, 16, 6, 0x333333, bx, BASE_Y + 8, bz));
        addMesh(makeSphere(1.5, 6, 6, 0xFFEEAA, bx, BASE_Y + 16, bz));
        addMesh(makeCylinder(0.5, 0.5, 16, 6, 0x333333, bx + 60, BASE_Y + 8, bz));
        addMesh(makeSphere(1.5, 6, 6, 0xFFEEAA, bx + 60, BASE_Y + 16, bz));
        addMesh(makeCylinder(0.5, 0.5, 16, 6, 0x333333, bx + 120, BASE_Y + 8, bz));
        addMesh(makeSphere(1.5, 6, 6, 0xFFEEAA, bx + 120, BASE_Y + 16, bz));
        // Bollards on quayside
        addMesh(makeCylinder(1.2, 1.2, 4, 6, 0x222222, bx - 100, BASE_Y + 2, BASE_Z - 55));
        addMesh(makeCylinder(1.2, 1.2, 4, 6, 0x222222, bx - 50, BASE_Y + 2, BASE_Z - 55));
        addMesh(makeCylinder(1.2, 1.2, 4, 6, 0x222222, bx, BASE_Y + 2, BASE_Z - 55));
        addMesh(makeCylinder(1.2, 1.2, 4, 6, 0x222222, bx + 50, BASE_Y + 2, BASE_Z - 55));
        addMesh(makeCylinder(1.2, 1.2, 4, 6, 0x222222, bx + 100, BASE_Y + 2, BASE_Z - 55));
    }

    function update(delta) {
        // Static environment — no per-frame animation required
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
