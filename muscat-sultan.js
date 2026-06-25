window.MuscatSultan = (function() {
    'use strict';
    var scene = null;
    var camera = null;
    var objects = [];
    var BASE_X = 24240;

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
        mesh.position.set(BASE_X + x, y, z);
        return addMesh(mesh);
    }

    function cyl(rt, rb, h, segs, color, x, y, z) {
        var geo = new THREE.CylinderGeometry(rt, rb, h, segs);
        var mat = makeMat(color);
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(BASE_X + x, y, z);
        return addMesh(mesh);
    }

    function sph(r, ws, hs, color, x, y, z) {
        var geo = new THREE.SphereGeometry(r, ws, hs);
        var mat = makeMat(color);
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(BASE_X + x, y, z);
        return addMesh(mesh);
    }

    function cone(r, h, segs, color, x, y, z) {
        var geo = new THREE.ConeGeometry(r, h, segs);
        var mat = makeMat(color);
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(BASE_X + x, y, z);
        return addMesh(mesh);
    }

    function build() {
        buildGround();
        buildArabianSea();
        buildHajarMountains();
        buildSultanQaboosGrandMosque();
        buildMutrahCorniche();
        buildAlAlamPalace();
        buildMutrahFort();
        buildNizwaFort();
        buildRoyalOperaHouse();
        buildJabrinCastle();
        buildMuttrahSouq();
    }

    function buildGround() {
        // Ground plane using boxes
        box(2000, 2, 2000, 0xC8B89A, 0, -1, 0);
        // Desert sand areas
        box(600, 1, 600, 0xD4C8A0, -200, 0, -200);
        box(500, 1, 500, 0xC8B880, 300, 0, 200);
    }

    function buildArabianSea() {
        // Sea surface - turquoise water
        box(1200, 1, 600, 0x1A5A8A, -600, -0.5, 400);
        // Sea depth variation
        box(400, 2, 200, 0x1A6A9A, -500, -1, 350);
        box(500, 2, 250, 0x1A5A8A, -700, -1, 500);
        // Rocky coastline
        box(40, 12, 30, 0x6A6A5A, -300, 6, 280);
        box(30, 8, 25, 0x7A7A6A, -340, 4, 300);
        box(50, 15, 35, 0x6A6A5A, -280, 7, 310);
        // Fishing village structures
        box(20, 10, 18, 0xD4A850, -420, 5, 320);
        box(18, 8, 16, 0xC8B880, -450, 4, 300);
        box(22, 9, 20, 0xD4C8A0, -400, 4, 290);
    }

    function buildHajarMountains() {
        // Dramatic bare limestone peaks
        cone(90, 220, 6, 0x8A7A6A, 400, 110, -300);
        cone(70, 180, 6, 0x9A8A7A, 480, 90, -350);
        cone(110, 260, 7, 0x7A6A5A, 320, 130, -250);
        cone(60, 150, 5, 0x8A8070, 550, 75, -280);
        cone(80, 200, 6, 0x8A7A6A, 350, 100, -400);
        cone(100, 240, 7, 0x7A6A5A, 460, 120, -200);
        // Mountain base ridges
        box(300, 60, 80, 0x8A7A6A, 430, 30, -290);
        box(250, 40, 70, 0x9A8A7A, 370, 20, -360);
        // Wadi (dry riverbed) - lower ground
        box(200, 3, 30, 0xC8B09A, 390, 0, -220);
    }

    function buildSultanQaboosGrandMosque() {
        // Grand mosque - magnificent white marble
        var WH = 0xF5F5F5;
        var WD = 0xEAEAE8;
        var GD = 0xD4AF37; // gold accents

        // Main prayer hall - vast rectangular base
        box(140, 18, 120, WH, 0, 9, -50);
        // Prayer hall walls detail
        box(142, 2, 122, WD, 0, 18, -50);

        // Central massive dome
        sph(32, 16, 12, WH, 0, 50, -50);
        // Dome drum (cylindrical base)
        cyl(32, 34, 20, 16, WH, 0, 31, -50);
        // Dome finial - gold
        cyl(2, 2, 8, 8, GD, 0, 86, -50);
        sph(3, 8, 6, GD, 0, 91, -50);

        // 4 Minarets at corners - tall elegant towers
        // Minaret 1 (front-left)
        cyl(5, 6, 70, 8, WH, -55, 35, 5);
        cyl(7, 5, 4, 8, WD, -55, 72, 5);
        cone(4, 12, 8, WH, -55, 80, 5);
        sph(1.5, 6, 5, GD, -55, 87, 5);

        // Minaret 2 (front-right)
        cyl(5, 6, 70, 8, WH, 55, 35, 5);
        cyl(7, 5, 4, 8, WD, 55, 72, 5);
        cone(4, 12, 8, WH, 55, 80, 5);
        sph(1.5, 6, 5, GD, 55, 87, 5);

        // Minaret 3 (rear-left)
        cyl(5, 6, 70, 8, WH, -55, 35, -105);
        cyl(7, 5, 4, 8, WD, -55, 72, -105);
        cone(4, 12, 8, WH, -55, 80, -105);
        sph(1.5, 6, 5, GD, -55, 87, -105);

        // Minaret 4 (rear-right)
        cyl(5, 6, 70, 8, WH, 55, 35, -105);
        cyl(7, 5, 4, 8, WD, 55, 72, -105);
        cone(4, 12, 8, WH, 55, 80, -105);
        sph(1.5, 6, 5, GD, 55, 87, -105);

        // Secondary smaller domes flanking main dome
        sph(14, 12, 10, WH, -40, 28, -50);
        cyl(14, 15, 10, 12, WH, -40, 21, -50);
        sph(14, 12, 10, WH, 40, 28, -50);
        cyl(14, 15, 10, 12, WH, 40, 21, -50);

        // Persian carpet area (world's largest) - rich colored floor
        box(120, 0.5, 100, 0x8B0000, 0, 18.5, -50);
        // Carpet border pattern suggestion
        box(124, 0.3, 104, 0xD4AF37, 0, 18.4, -50);

        // Elaborate gardens - landscaping
        box(200, 1, 30, 0x3A7A3A, 0, 0, 20);
        // Garden trees/hedges as cylinders
        cyl(4, 4, 12, 6, 0x2A6A2A, -80, 6, 25);
        cyl(4, 4, 12, 6, 0x2A6A2A, -40, 6, 25);
        cyl(4, 4, 12, 6, 0x2A6A2A, 0, 6, 25);
        cyl(4, 4, 12, 6, 0x2A6A2A, 40, 6, 25);
        cyl(4, 4, 12, 6, 0x2A6A2A, 80, 6, 25);

        // Garden fountains
        cyl(8, 10, 2, 10, WH, -60, 1, 30);
        cyl(3, 3, 6, 10, WH, -60, 5, 30);
        cyl(8, 10, 2, 10, WH, 60, 1, 30);
        cyl(3, 3, 6, 10, WH, 60, 5, 30);

        // Entry gate / grand archway base
        box(40, 20, 8, WH, 0, 10, 30);
        box(8, 20, 8, WH, -24, 10, 30);
        box(8, 20, 8, WH, 24, 10, 30);
        // Arch top piece
        box(40, 4, 8, WD, 0, 22, 30);
    }

    function buildMutrahCorniche() {
        var SEA = 0x1A5A8A;
        var PROM = 0xD4C8A0;
        var BOAT = 0x8B4513;

        // Seafront promenade walkway
        box(400, 2, 20, PROM, -200, 1, 200);

        // Promenade lampposts
        cyl(0.8, 0.8, 12, 6, 0x888888, -180, 6, 200);
        cyl(0.8, 0.8, 12, 6, 0x888888, -120, 6, 200);
        cyl(0.8, 0.8, 12, 6, 0x888888, -60, 6, 200);
        cyl(0.8, 0.8, 12, 6, 0x888888, 0, 6, 200);
        cyl(0.8, 0.8, 12, 6, 0x888888, 60, 6, 200);

        // Traditional dhow boats on the water
        // Dhow 1 hull
        box(22, 5, 7, BOAT, -280, 2, 280);
        // Dhow 1 mast
        cyl(0.5, 0.5, 22, 5, 0x5A3A1A, -280, 16, 280);
        // Dhow 1 sail (box approximation)
        box(10, 14, 1, 0xF5F5DC, -277, 18, 280);

        // Dhow 2
        box(18, 4, 6, 0x6B3A1A, -350, 2, 300);
        cyl(0.4, 0.4, 18, 5, 0x5A3A1A, -350, 13, 300);
        box(8, 12, 1, 0xF5F5DC, -347, 16, 300);

        // Dhow 3 - smaller fishing boat
        box(14, 3, 5, BOAT, -220, 2, 320);
        cyl(0.4, 0.4, 14, 5, 0x5A3A1A, -220, 11, 320);

        // Fish market building
        box(50, 14, 30, 0xD4C8A0, -180, 7, 170);
        box(52, 2, 32, 0xC8B880, -180, 14, 170);
        // Fish market stalls
        box(10, 5, 8, 0xC8A858, -200, 2.5, 165);
        box(10, 5, 8, 0xC8A858, -185, 2.5, 165);
        box(10, 5, 8, 0xC8A858, -170, 2.5, 165);

        // Incense souq cluster
        box(30, 10, 20, 0xC8A858, -280, 5, 180);
        box(15, 8, 10, 0xD4A850, -265, 4, 190);
        box(15, 8, 10, 0xD4A850, -295, 4, 190);
    }

    function buildAlAlamPalace() {
        // Sultan's ceremonial palace - blue/gold striped facade
        var GOLD = 0xD4A850;
        var BLUE = 0x1A3A7A;
        var PALE = 0xF0E8D0;

        // Main palace building
        box(100, 25, 60, PALE, -100, 12.5, -150);
        // Blue/gold striped facade bands
        box(102, 4, 2, BLUE, -100, 8, -121);
        box(102, 4, 2, GOLD, -100, 14, -121);
        box(102, 4, 2, BLUE, -100, 20, -121);
        box(102, 4, 2, GOLD, -100, 26, -121);

        // Palace roof
        box(104, 4, 62, GOLD, -100, 27, -150);

        // Twin towers flanking entrance
        cyl(8, 9, 40, 8, PALE, -150, 20, -121);
        cyl(6, 6, 8, 8, GOLD, -150, 44, -121);
        cone(5, 14, 8, BLUE, -150, 54, -121);

        cyl(8, 9, 40, 8, PALE, -50, 20, -121);
        cyl(6, 6, 8, 8, GOLD, -50, 44, -121);
        cone(5, 14, 8, BLUE, -50, 54, -121);

        // Palm-lined approach
        cyl(1, 2, 20, 6, 0x5A3A1A, -130, 10, -100);
        sph(6, 6, 4, 0x2A6A1A, -130, 22, -100);
        cyl(1, 2, 20, 6, 0x5A3A1A, -120, 10, -100);
        sph(6, 6, 4, 0x2A6A1A, -120, 22, -100);
        cyl(1, 2, 20, 6, 0x5A3A1A, -110, 10, -100);
        sph(6, 6, 4, 0x2A6A1A, -110, 22, -100);
        cyl(1, 2, 20, 6, 0x5A3A1A, -100, 10, -100);
        sph(6, 6, 4, 0x2A6A1A, -100, 22, -100);
        cyl(1, 2, 20, 6, 0x5A3A1A, -90, 10, -100);
        sph(6, 6, 4, 0x2A6A1A, -90, 22, -100);
        cyl(1, 2, 20, 6, 0x5A3A1A, -80, 10, -100);
        sph(6, 6, 4, 0x2A6A1A, -80, 22, -100);

        // Ceremonial gateway
        box(30, 22, 6, PALE, -100, 11, -115);
        box(6, 22, 6, GOLD, -115, 11, -115);
        box(6, 22, 6, GOLD, -85, 11, -115);
    }

    function buildMutrahFort() {
        // Portuguese fortress on rocky promontory
        var FORT = 0xD4A870;
        var ROCK = 0x7A6A5A;

        // Rocky promontory base
        box(80, 20, 60, ROCK, -400, 10, 200);
        box(60, 30, 40, ROCK, -400, 15, 200);

        // Main fort walls - crenellated
        box(50, 18, 6, FORT, -400, 9, 175);
        box(50, 18, 6, FORT, -400, 9, 225);
        box(6, 18, 56, FORT, -373, 9, 200);
        box(6, 18, 56, FORT, -427, 9, 200);

        // Crenellations on walls
        box(54, 3, 2, FORT, -400, 21, 175);
        box(54, 3, 2, FORT, -400, 21, 225);

        // Circular towers at corners
        cyl(9, 10, 22, 8, FORT, -373, 11, 175);
        cyl(9, 10, 22, 8, FORT, -427, 11, 175);
        cyl(9, 10, 22, 8, FORT, -373, 11, 225);
        cyl(9, 10, 22, 8, FORT, -427, 11, 225);

        // Tower tops
        cone(9, 6, 8, 0xC09060, -373, 25, 175);
        cone(9, 6, 8, 0xC09060, -427, 25, 175);
        cone(9, 6, 8, 0xC09060, -373, 25, 225);
        cone(9, 6, 8, 0xC09060, -427, 25, 225);

        // Fort interior courtyard - lower area
        box(36, 1, 44, 0xC8B09A, -400, 18.5, 200);

        // Flag/watch tower
        cyl(3, 3, 30, 6, FORT, -400, 33, 200);
        box(6, 1, 1, 0xCC0000, -400, 49, 200);
    }

    function buildNizwaFort() {
        // Massive 17th century fort - 40m diameter circular drum tower
        var FORT = 0xC8B880;
        var DARK = 0xB0A060;

        // Surrounding castle walls
        box(120, 16, 8, FORT, 200, 8, 150);
        box(120, 16, 8, FORT, 200, 8, 250);
        box(8, 16, 108, FORT, 140, 8, 200);
        box(8, 16, 108, FORT, 260, 8, 200);

        // Castle towers at corners
        cyl(10, 11, 20, 8, FORT, 140, 10, 150);
        cyl(10, 11, 20, 8, FORT, 260, 10, 150);
        cyl(10, 11, 20, 8, FORT, 140, 10, 250);
        cyl(10, 11, 20, 8, FORT, 260, 10, 250);

        // THE massive circular drum tower - 40m diameter
        cyl(40, 42, 30, 16, FORT, 200, 15, 200);
        // Drum tower upper section
        cyl(38, 40, 10, 16, DARK, 200, 35, 200);
        // Drum tower top walkway
        cyl(42, 42, 2, 16, 0xB8A870, 200, 41, 200);

        // Crenellations on drum tower
        cyl(43, 43, 4, 16, FORT, 200, 45, 200);

        // Surrounding souq market stalls
        box(80, 6, 10, 0xC8A858, 200, 3, 275);
        box(10, 6, 8, 0xD4A850, 165, 3, 278);
        box(10, 6, 8, 0xD4A850, 180, 3, 278);
        box(10, 6, 8, 0xD4A850, 195, 3, 278);
        box(10, 6, 8, 0xD4A850, 210, 3, 278);
        box(10, 6, 8, 0xD4A850, 225, 3, 278);

        // Castle gate / entrance
        box(20, 16, 4, FORT, 200, 8, 258);
        box(4, 16, 4, DARK, 188, 8, 258);
        box(4, 16, 4, DARK, 212, 8, 258);
    }

    function buildRoyalOperaHouse() {
        // Opulent opera house - traditional Omani architecture
        var CREAM = 0xD4C8A0;
        var GOLD = 0xD4AF37;
        var ARCH = 0xC8B880;

        // Main opera house building
        box(90, 22, 55, CREAM, 100, 11, -150);
        // Decorative facade bands
        box(92, 3, 2, GOLD, 100, 6, -123);
        box(92, 3, 2, GOLD, 100, 14, -123);
        box(92, 3, 2, GOLD, 100, 22, -123);

        // Ornate arcaded front colonnade
        cyl(3, 3, 18, 8, CREAM, 65, 9, -125);
        cyl(3, 3, 18, 8, CREAM, 80, 9, -125);
        cyl(3, 3, 18, 8, CREAM, 95, 9, -125);
        cyl(3, 3, 18, 8, CREAM, 110, 9, -125);
        cyl(3, 3, 18, 8, CREAM, 125, 9, -125);
        cyl(3, 3, 18, 8, CREAM, 140, 9, -125);

        // Arcade entablature
        box(80, 3, 4, GOLD, 102, 19, -125);

        // Central dome over auditorium
        sph(16, 12, 10, CREAM, 100, 36, -155);
        cyl(16, 17, 10, 12, CREAM, 100, 28, -155);

        // Side wings
        box(30, 16, 40, ARCH, 55, 8, -155);
        box(30, 16, 40, ARCH, 145, 8, -155);

        // Roof detail
        box(94, 3, 57, GOLD, 100, 24, -150);
    }

    function buildJabrinCastle() {
        // 17th century castle - painted ceilings, carved plaster
        var CASTLE = 0xD4A870;
        var DETAIL = 0xC89050;

        // Main castle body
        box(60, 20, 45, CASTLE, 300, 10, -150);

        // Decorative upper level
        box(62, 5, 47, DETAIL, 300, 22.5, -150);

        // Corner towers
        cyl(7, 8, 26, 8, CASTLE, 270, 13, -128);
        cyl(7, 8, 26, 8, CASTLE, 330, 13, -128);
        cyl(7, 8, 26, 8, CASTLE, 270, 13, -173);
        cyl(7, 8, 26, 8, CASTLE, 330, 13, -173);

        // Tower conical caps
        cone(7, 10, 8, DETAIL, 270, 32, -128);
        cone(7, 10, 8, DETAIL, 330, 32, -128);
        cone(7, 10, 8, DETAIL, 270, 32, -173);
        cone(7, 10, 8, DETAIL, 330, 32, -173);

        // Interior courtyard
        box(40, 1, 25, 0xC8B09A, 300, 20.5, -150);

        // Carved plaster facade detail blocks
        box(64, 2, 2, 0xE0C090, 300, 12, -128);
        box(64, 2, 2, 0xE0C090, 300, 16, -128);
        box(64, 2, 2, 0xE0C090, 300, 20, -128);

        // Gate entrance
        box(16, 20, 4, CASTLE, 300, 10, -128);
        box(4, 14, 4, 0x8A6030, 292, 7, -128);
        box(4, 14, 4, 0x8A6030, 308, 7, -128);
    }

    function buildMuttrahSouq() {
        // Labyrinthine covered market - incense, silver, traditional crafts
        var SOUQ = 0xC8A858;
        var ROOF = 0xB89040;
        var STALL = 0xD4A850;

        // Main souq building - elongated covered market
        box(120, 12, 40, SOUQ, -100, 6, -50);
        // Barrel-vaulted roof approximated with boxes
        box(122, 4, 42, ROOF, -100, 14, -50);
        box(120, 2, 40, 0xC8A040, -100, 16, -50);

        // Souq alley stalls interior
        box(10, 8, 6, STALL, -150, 4, -48);
        box(10, 8, 6, STALL, -135, 4, -48);
        box(10, 8, 6, STALL, -120, 4, -48);
        box(10, 8, 6, STALL, -105, 4, -48);
        box(10, 8, 6, STALL, -90, 4, -48);
        box(10, 8, 6, STALL, -75, 4, -48);
        box(10, 8, 6, STALL, -60, 4, -48);

        // Incense burner decoration elements
        cyl(2, 3, 6, 6, 0xD4AF37, -145, 3, -44);
        cyl(2, 3, 6, 6, 0xD4AF37, -115, 3, -44);
        cyl(2, 3, 6, 6, 0xD4AF37, -85, 3, -44);
        cyl(2, 3, 6, 6, 0xD4AF37, -65, 3, -44);

        // Souq entrance arch
        box(20, 14, 6, SOUQ, -160, 7, -50);
        box(4, 14, 6, 0xA87830, -170, 7, -50);
        box(4, 14, 6, 0xA87830, -150, 7, -50);
        // Arch top
        sph(10, 8, 6, SOUQ, -160, 17, -50);

        // Silver market section
        box(40, 10, 18, 0xD0D0C0, -60, 5, -65);
        // Craft workshop
        box(30, 10, 15, STALL, -140, 5, -65);
    }

    function update(delta) {
        // Static environment - no per-frame updates required
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
