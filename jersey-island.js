window.JerseyIsland = (function() {
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

    function makeBox(w, h, d, color, x, y, z) {
        var geo = new THREE.BoxGeometry(w, h, d);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        return addMesh(mesh);
    }

    function makeCylinder(rt, rb, h, segs, color, x, y, z) {
        var geo = new THREE.CylinderGeometry(rt, rb, h, segs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        return addMesh(mesh);
    }

    function makeSphere(r, ws, hs, color, x, y, z) {
        var geo = new THREE.SphereGeometry(r, ws, hs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        return addMesh(mesh);
    }

    function makeCone(r, h, segs, color, x, y, z) {
        var geo = new THREE.ConeGeometry(r, h, segs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        return addMesh(mesh);
    }

    function build() {
        var cx = 22400;

        // ── Ground base (island terrain) ──────────────────────────────────────
        // Main island ground using stacked boxes to simulate terrain
        makeBox(1800, 12, 2000, 0x5A7A3A, cx, -6, 0);

        // ── St Aubin's Bay — water and beach ─────────────────────────────────
        // Bay water (south coast)
        makeBox(1600, 4, 600, 0x006994, cx - 100, -4, 900);
        // Sandy beach strip
        makeBox(1400, 5, 80, 0xF4E0A0, cx - 80, -3.5, 680);
        // Deeper water further out
        makeBox(1800, 3, 300, 0x005580, cx, -5, 1150);

        // ── Mont Orgueil Castle (Gorey, east coast) ───────────────────────────
        // Rocky headland base
        makeCylinder(60, 80, 60, 8, 0x7A6A50, cx + 600, 30, -300);
        // Lower ward outer wall south
        makeBox(120, 30, 12, 0x8B7355, cx + 600, 55, -360);
        // Lower ward outer wall north
        makeBox(120, 30, 12, 0x8B7355, cx + 600, 55, -240);
        // Lower ward outer wall east
        makeBox(12, 30, 120, 0x8B7355, cx + 660, 55, -300);
        // Lower ward outer wall west
        makeBox(12, 30, 120, 0x8B7355, cx + 540, 55, -300);
        // Lower ward round tower SW
        makeCylinder(14, 14, 35, 10, 0x8B7355, cx + 543, 72, -357);
        // Lower ward round tower SE
        makeCylinder(14, 14, 35, 10, 0x8B7355, cx + 657, 72, -357);
        // Lower ward round tower NE
        makeCylinder(14, 14, 35, 10, 0x8B7355, cx + 657, 72, -243);
        // Middle ward — second level
        makeBox(80, 25, 8, 0x7A6545, cx + 600, 90, -330);
        makeBox(80, 25, 8, 0x7A6545, cx + 600, 90, -270);
        makeBox(8, 25, 60, 0x7A6545, cx + 640, 90, -300);
        makeBox(8, 25, 60, 0x7A6545, cx + 560, 90, -300);
        // Middle ward round towers
        makeCylinder(12, 12, 30, 10, 0x7A6545, cx + 563, 102, -327);
        makeCylinder(12, 12, 30, 10, 0x7A6545, cx + 637, 102, -327);
        // Keep at summit
        makeBox(50, 45, 50, 0x6A5A3A, cx + 600, 120, -300);
        // Keep round corner towers
        makeCylinder(10, 10, 50, 10, 0x6A5A3A, cx + 575, 132, -275);
        makeCylinder(10, 10, 50, 10, 0x6A5A3A, cx + 625, 132, -275);
        makeCylinder(10, 10, 50, 10, 0x6A5A3A, cx + 575, 132, -325);
        makeCylinder(10, 10, 50, 10, 0x6A5A3A, cx + 625, 132, -325);
        // Keep crenellated top suggestion (flat cap)
        makeBox(54, 6, 54, 0x5A4A2A, cx + 600, 147, -300);
        // Keep conical roof on main tower
        makeCone(12, 20, 8, 0x4A3A20, cx + 600, 162, -300);
        // Gate tower
        makeBox(20, 40, 15, 0x8B7355, cx + 540, 80, -300);
        makeCone(10, 15, 8, 0x5A3A20, cx + 540, 107, -300);

        // ── St Helier — capital town ──────────────────────────────────────────
        // Royal Square central area
        makeBox(80, 4, 80, 0xC8C0A0, cx - 200, 2, 100);
        // States Assembly building
        makeBox(60, 22, 40, 0xD4C8A0, cx - 200, 17, 60);
        makeBox(64, 6, 44, 0xC4B890, cx - 200, 25, 60);
        // Columns suggestion on States Assembly
        makeCylinder(2, 2, 22, 6, 0xE0D8C0, cx - 218, 17, 50);
        makeCylinder(2, 2, 22, 6, 0xE0D8C0, cx - 210, 17, 50);
        makeCylinder(2, 2, 22, 6, 0xE0D8C0, cx - 190, 17, 50);
        makeCylinder(2, 2, 22, 6, 0xE0D8C0, cx - 182, 17, 50);
        // Victorian terraced row 1
        makeBox(140, 28, 20, 0xD4C8A0, cx - 100, 20, 150);
        makeBox(144, 4, 24, 0xC8BC94, cx - 100, 36, 150);
        // Victorian terraced row 2
        makeBox(120, 24, 18, 0xCCC0A0, cx - 280, 18, 120);
        // Georgian building with pitched roof
        makeBox(45, 20, 30, 0xDDD0B0, cx - 160, 16, 90);
        makeCone(24, 12, 4, 0xB08050, cx - 160, 32, 90);
        // Church
        makeBox(25, 35, 20, 0xE0D8C0, cx - 220, 23, 200);
        makeCylinder(6, 6, 45, 8, 0xD8D0B8, cx - 220, 28, 190);
        makeCone(6, 14, 8, 0xA09070, cx - 220, 57, 190);
        // Market building
        makeBox(50, 18, 35, 0xD0C498, cx - 150, 15, 200);
        // Town hall style building
        makeBox(40, 24, 28, 0xE4DCC8, cx - 240, 18, 160);
        makeCylinder(5, 5, 30, 8, 0xD8D0B8, cx - 240, 27, 148);
        makeCone(5, 10, 8, 0x806040, cx - 240, 52, 148);
        // Road grid suggestion
        makeBox(300, 2, 8, 0x444444, cx - 170, 1, 130);
        makeBox(8, 2, 200, 0x444444, cx - 200, 1, 150);

        // ── Elizabeth Castle (St Aubin's Bay tidal island) ────────────────────
        // Tidal causeway
        makeBox(200, 3, 12, 0x888880, cx - 500, 0, 750);
        // Castle base rock
        makeCylinder(55, 65, 18, 8, 0x777770, cx - 600, 9, 800);
        // Main castle walls
        makeBox(100, 20, 8, 0x888888, cx - 600, 26, 845);
        makeBox(100, 20, 8, 0x888888, cx - 600, 26, 755);
        makeBox(8, 20, 90, 0x888888, cx - 550, 26, 800);
        makeBox(8, 20, 90, 0x888888, cx - 650, 26, 800);
        // Elizabeth Castle keep
        makeBox(45, 30, 45, 0x808080, cx - 600, 42, 800);
        // Castle towers
        makeCylinder(10, 10, 30, 8, 0x888888, cx - 648, 33, 843);
        makeCylinder(10, 10, 30, 8, 0x888888, cx - 552, 33, 843);
        makeCylinder(10, 10, 30, 8, 0x888888, cx - 648, 33, 757);
        // Castle upper works
        makeBox(50, 8, 50, 0x707070, cx - 600, 58, 800);
        // Lighthouse on castle
        makeCylinder(4, 4, 18, 8, 0xFFFFEE, cx - 600, 75, 800);
        makeCone(4, 6, 8, 0xCC2222, cx - 600, 87, 800);

        // ── German WWII Bunkers ───────────────────────────────────────────────
        // Gun battery - south coast (multiple bunkers)
        makeBox(30, 10, 20, 0x666666, cx - 400, 11, 620);
        makeBox(30, 10, 20, 0x666666, cx - 340, 11, 640);
        makeBox(30, 10, 20, 0x666666, cx - 460, 11, 600);
        // Gun embrasure slits
        makeBox(32, 4, 4, 0x555555, cx - 400, 16, 610);
        makeBox(32, 4, 4, 0x555555, cx - 340, 16, 630);
        // Observation tower
        makeCylinder(8, 10, 25, 8, 0x666666, cx - 300, 18, 550);
        makeBox(18, 4, 18, 0x555555, cx - 300, 31, 550);
        // Todt bunker (larger command bunker)
        makeBox(40, 15, 30, 0x666666, cx + 100, 13, 580);
        makeBox(42, 5, 32, 0x555555, cx + 100, 21, 580);
        // Coastal artillery position
        makeBox(35, 8, 35, 0x616161, cx + 200, 10, 560);
        makeCylinder(5, 5, 15, 8, 0x606060, cx + 200, 19, 560);
        // Anti-tank wall segment
        makeBox(200, 8, 5, 0x606060, cx - 200, 10, 670);
        // Small pillbox
        makeCylinder(12, 12, 8, 8, 0x666666, cx + 300, 10, 600);
        makeBox(14, 4, 14, 0x555555, cx + 300, 18, 600);

        // ── Jersey War Tunnels (Ho8 underground hospital) ─────────────────────
        // Tunnel entrance mound
        makeBox(40, 20, 30, 0x4A6030, cx - 50, 16, 300);
        // Tunnel entrance portal
        makeBox(12, 10, 8, 0x555555, cx - 50, 21, 285);
        makeBox(14, 3, 6, 0x444444, cx - 50, 29, 285);

        // ── La Hougue Bie — Neolithic passage tomb ────────────────────────────
        // Main mound
        makeSphere(35, 12, 8, 0xC8A870, cx + 300, 18, 300);
        // Medieval chapel on top of mound
        makeBox(15, 14, 20, 0xD0C090, cx + 300, 53, 300);
        makeCone(8, 10, 4, 0x907050, cx + 300, 67, 300);
        // Passage entrance stones
        makeBox(3, 8, 3, 0xB09860, cx + 265, 9, 300);
        makeBox(3, 8, 3, 0xB09860, cx + 271, 9, 300);
        makeBox(10, 3, 3, 0xB09860, cx + 268, 17, 300);

        // ── North Coast Pink Granite Cliffs ───────────────────────────────────
        // Cliff face sections (north coast is dramatically high)
        makeBox(300, 80, 30, 0xC8B89A, cx - 400, 34, -600);
        makeBox(280, 70, 25, 0xC4B496, cx - 100, 29, -620);
        makeBox(300, 90, 28, 0xCCBCA0, cx + 200, 39, -590);
        makeBox(250, 60, 22, 0xC0B090, cx + 450, 24, -610);
        // Cliff top boulders
        makeSphere(15, 8, 6, 0xD0C0A8, cx - 400, 80, -580);
        makeSphere(10, 8, 6, 0xC8B8A0, cx - 350, 75, -575);
        makeSphere(12, 8, 6, 0xCCC0A8, cx + 220, 86, -570);

        // ── Jersey Cows in green fields ───────────────────────────────────────
        // Cow bodies (cream/fawn colored boxes)
        makeBox(8, 5, 4, 0xD4B896, cx + 50, 8, 100);
        makeBox(8, 5, 4, 0xCCAA80, cx + 80, 8, 120);
        makeBox(8, 5, 4, 0xD0B090, cx + 110, 8, 95);
        makeBox(8, 5, 4, 0xD4B896, cx + 140, 8, 110);
        // Cow heads
        makeBox(3, 3, 3, 0xC8A870, cx + 54, 12, 100);
        makeBox(3, 3, 3, 0xC0A068, cx + 84, 12, 120);
        makeBox(3, 3, 3, 0xC8A870, cx + 114, 12, 95);
        makeBox(3, 3, 3, 0xC8A870, cx + 144, 12, 110);
        // Cow legs
        makeBox(1, 4, 1, 0xC0A060, cx + 48, 4, 99);
        makeBox(1, 4, 1, 0xC0A060, cx + 52, 4, 99);
        makeBox(1, 4, 1, 0xC0A060, cx + 48, 4, 101);
        makeBox(1, 4, 1, 0xC0A060, cx + 52, 4, 101);
        // Field fence
        makeBox(200, 4, 2, 0x8B6040, cx + 100, 8, 50);
        makeBox(200, 4, 2, 0x8B6040, cx + 100, 8, 160);
        makeBox(2, 4, 110, 0x8B6040, cx, 8, 105);
        makeBox(2, 4, 110, 0x8B6040, cx + 200, 8, 105);

        // ── St Helier Harbour ─────────────────────────────────────────────────
        // Harbour walls / piers
        makeBox(250, 8, 12, 0x555555, cx - 350, 8, 810);
        makeBox(12, 8, 200, 0x555555, cx - 480, 8, 720);
        makeBox(12, 8, 180, 0x555555, cx - 240, 8, 730);
        // Ferry boat (large)
        makeBox(40, 12, 14, 0xDDD8D0, cx - 380, 12, 780);
        makeBox(38, 6, 12, 0xCCC8C0, cx - 380, 22, 780);
        makeCylinder(4, 4, 14, 8, 0xCC4422, cx - 370, 31, 778);
        // Fishing boats (smaller)
        makeBox(14, 6, 6, 0x4488CC, cx - 300, 9, 820);
        makeBox(14, 6, 6, 0xCC4444, cx - 320, 9, 828);
        makeBox(14, 6, 6, 0x44CC44, cx - 340, 9, 815);
        // Harbour crane
        makeBox(3, 30, 3, 0x888888, cx - 440, 21, 750);
        makeBox(25, 3, 3, 0x888888, cx - 427, 36, 750);
        // Harbour master building
        makeBox(18, 12, 14, 0xD0C890, cx - 450, 12, 780);
        // Lighthouse at pier end
        makeCylinder(5, 6, 22, 8, 0xFFFFEE, cx - 240, 17, 640);
        makeCone(5, 8, 8, 0xCC2222, cx - 240, 32, 640);

        // ── Trees / vegetation ────────────────────────────────────────────────
        // Scattered trees across island
        makeCylinder(1, 2, 10, 6, 0x6B4226, cx + 400, 11, 50);
        makeCone(10, 18, 8, 0x2D7A2D, cx + 400, 22, 50);
        makeCylinder(1, 2, 8, 6, 0x6B4226, cx + 430, 10, 70);
        makeCone(8, 14, 8, 0x2D7A2D, cx + 430, 19, 70);
        makeCylinder(1, 2, 12, 6, 0x6B4226, cx - 100, 12, 400);
        makeCone(11, 16, 8, 0x347A34, cx - 100, 24, 400);
        makeCylinder(1, 2, 9, 6, 0x6B4226, cx + 350, 11, 200);
        makeCone(9, 15, 8, 0x2D7A2D, cx + 350, 22, 200);

        // ── Additional terrain variation ──────────────────────────────────────
        // Inland hills
        makeSphere(120, 10, 8, 0x507040, cx + 250, -30, -100);
        makeSphere(100, 10, 8, 0x4A6838, cx - 300, -40, -200);
        makeSphere(90, 10, 8, 0x527242, cx + 100, -35, -150);

        // ── Jersey coastline detail ───────────────────────────────────────────
        // East coast harbour at Gorey below castle
        makeBox(80, 5, 10, 0x555555, cx + 620, 3, -200);
        makeBox(10, 5, 60, 0x555555, cx + 660, 3, -230);
        // Small boat in Gorey harbour
        makeBox(10, 5, 5, 0xCCBBAA, cx + 630, 6, -215);
        // Slipway
        makeBox(15, 3, 30, 0x888880, cx + 600, 1, -180);

        // ── Victoria Avenue road (coastal road) ───────────────────────────────
        makeBox(800, 2, 10, 0x404040, cx - 200, 1, 650);
        // Road markings
        makeBox(30, 2, 2, 0xFFFF88, cx - 300, 1.5, 650);
        makeBox(30, 2, 2, 0xFFFF88, cx - 200, 1.5, 650);
        makeBox(30, 2, 2, 0xFFFF88, cx - 100, 1.5, 650);

        // ── Howard Davis Park (public garden) ────────────────────────────────
        // Grass paths
        makeBox(60, 2, 60, 0x6A9A4A, cx + 50, 1, 300);
        // Bandstand
        makeCylinder(12, 12, 6, 10, 0xC8C0B0, cx + 50, 7, 300);
        makeCone(14, 8, 10, 0x228844, cx + 50, 14, 300);

        // ── Sunken road / lane (Jersey has many ───────────────────────────────
        makeBox(6, 3, 300, 0x3A3A3A, cx + 500, 1, 0);

        // ── Martello tower (coastal defence) ─────────────────────────────────
        makeCylinder(14, 16, 18, 12, 0x999988, cx - 700, 15, 600);
        makeBox(30, 4, 30, 0x888877, cx - 700, 24, 600);
        // Flag pole
        makeBox(1, 20, 1, 0x8B8060, cx - 700, 34, 600);
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
