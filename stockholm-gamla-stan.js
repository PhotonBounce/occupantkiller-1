window.StockholmGamlaStan = (function() {
    'use strict';

    var scene = null;
    var camera = null;
    var objects = [];

    var BASE_X = 22840;
    var BASE_Y = 0;
    var BASE_Z = 0;

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
        objects = [];
        build();
    }

    function makeMesh(geo, color) {
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        return mesh;
    }

    function addMesh(mesh) {
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function placeMesh(mesh, x, y, z) {
        mesh.position.set(BASE_X + x, BASE_Y + y, BASE_Z + z);
        return mesh;
    }

    function box(w, h, d, color, x, y, z) {
        var geo = new THREE.BoxGeometry(w, h, d);
        var mesh = makeMesh(geo, color);
        placeMesh(mesh, x, y, z);
        addMesh(mesh);
        return mesh;
    }

    function cyl(rt, rb, h, segs, color, x, y, z) {
        var geo = new THREE.CylinderGeometry(rt, rb, h, segs);
        var mesh = makeMesh(geo, color);
        placeMesh(mesh, x, y, z);
        addMesh(mesh);
        return mesh;
    }

    function cone(r, h, segs, color, x, y, z) {
        var geo = new THREE.ConeGeometry(r, h, segs);
        var mesh = makeMesh(geo, color);
        placeMesh(mesh, x, y, z);
        addMesh(mesh);
        return mesh;
    }

    function sph(r, ws, hs, color, x, y, z) {
        var geo = new THREE.SphereGeometry(r, ws, hs);
        var mesh = makeMesh(geo, color);
        placeMesh(mesh, x, y, z);
        addMesh(mesh);
        return mesh;
    }

    function build() {
        buildArchipelagoWaters();
        buildGamlaStan();
        buildRoyalPalace();
        buildStorkyrkan();
        buildRiddarholmskyrkan();
        buildCityHall();
        buildVasaMuseum();
        buildDjurgarden();
        buildSodermalm();
        buildTCentralen();
        buildGermanChurch();
        buildStortorget();
        buildStreetDetails();
    }

    // -------------------------------------------------------------------------
    // ARCHIPELAGO WATERS — dark blue-grey Baltic Sea base
    // -------------------------------------------------------------------------
    function buildArchipelagoWaters() {
        // Large water base island slabs using BoxGeometry as ground planes
        box(600, 2, 600, 0x1A4A6A, 0, -1, 0);
        // Inner harbour channels
        box(80, 1.5, 300, 0x163D5C, -120, -0.5, -80);
        box(300, 1.5, 60, 0x163D5C, 60, -0.5, 120);
        box(200, 1.5, 80, 0x163D5C, 80, -0.5, -150);
        // Water ripple accent strips
        box(600, 0.5, 4, 0x1E5070, 0, 0.5, 30);
        box(600, 0.5, 4, 0x1E5070, 0, 0.5, -30);
        box(600, 0.5, 4, 0x1E5070, 0, 0.5, 90);
        box(4, 0.5, 600, 0x1E5070, 50, 0.5, 0);
    }

    // -------------------------------------------------------------------------
    // GAMLA STAN — Medieval Old Town island
    // -------------------------------------------------------------------------
    function buildGamlaStan() {
        // Island base ground
        box(180, 4, 140, 0x8B7355, 0, 2, 0);

        // Cobblestone street grid — thin flat boxes for street surfaces
        box(160, 0.5, 6, 0x7A6A50, 0, 4.3, -20);
        box(160, 0.5, 6, 0x7A6A50, 0, 4.3, 20);
        box(6, 0.5, 120, 0x7A6A50, -30, 4.3, 0);
        box(6, 0.5, 120, 0x7A6A50, 30, 4.3, 0);
        box(6, 0.5, 120, 0x7A6A50, -60, 4.3, 0);

        // Row of medieval narrow buildings — orange/red palette
        // Building 1 - Tall ochre
        box(10, 22, 12, 0xCC7722, -70, 15, -30);
        box(10, 2, 12, 0xAA5500, -70, 26, -30);
        cone(6, 8, 4, 0x993300, -70, 31, -30);

        // Building 2 - Red
        box(12, 18, 10, 0xBB4411, -56, 13, -30);
        box(12, 2.5, 10, 0x993300, -56, 22, -30);
        cone(6, 6, 4, 0x772200, -56, 26, -30);

        // Building 3 - Yellow ochre
        box(9, 24, 11, 0xDDA822, -44, 16, -30);
        box(9, 2, 11, 0xBB8800, -44, 28, -30);
        cone(5, 7, 4, 0x996600, -44, 32, -30);

        // Building 4 - Burnt orange
        box(11, 20, 10, 0xCC5511, -32, 14, -30);
        box(11, 2, 10, 0xAA3300, -32, 25, -30);

        // Building 5 - Golden yellow
        box(10, 26, 12, 0xDDBB22, -20, 17, -30);
        box(10, 2, 12, 0xBB9900, -20, 29, -30);
        cone(6, 9, 4, 0x997700, -20, 35, -30);

        // Building 6 - Terracotta
        box(8, 19, 9, 0xCC6644, -8, 13.5, -30);

        // Building 7 - Deep red
        box(12, 21, 11, 0xAA2200, 4, 14.5, -30);
        box(12, 2, 11, 0x881100, 4, 25.5, -30);

        // Building 8 - Orange
        box(9, 17, 10, 0xDD7733, 16, 12.5, -30);
        cone(5, 6, 4, 0xBB5511, 16, 21, -30);

        // Building 9 - Yellow
        box(11, 23, 11, 0xEEBB33, 28, 15.5, -30);
        box(11, 2.5, 11, 0xCCA011, 28, 27.5, -30);

        // Opposite side of street — buildings facing south
        box(10, 20, 12, 0xBB5522, -65, 14, 30);
        cone(6, 7, 4, 0x993311, -65, 25, 30);

        box(12, 24, 10, 0xDD9922, -52, 16, 30);
        box(12, 2, 10, 0xBB7700, -52, 28, 30);
        cone(6, 8, 4, 0x995500, -52, 33, 30);

        box(9, 18, 11, 0xCC4433, -40, 13, 30);
        box(9, 2, 11, 0xAA2211, -40, 22, 30);

        box(11, 22, 10, 0xDDAA33, -28, 15, 30);
        cone(6, 7, 4, 0xBB8811, -28, 27, 30);

        box(10, 16, 12, 0xCC6622, -16, 12, 30);

        box(13, 25, 11, 0xEE9933, -2, 16.5, 30);
        box(13, 2, 11, 0xCC7711, -2, 29, 30);
        cone(7, 9, 4, 0xAA5500, -2, 34.5, 30);

        box(9, 19, 10, 0xBB3311, 10, 13.5, 30);

        box(12, 21, 11, 0xDD8822, 22, 14.5, 30);
        cone(6, 7, 4, 0xBB6600, 22, 26, 30);
    }

    // -------------------------------------------------------------------------
    // ROYAL PALACE — Large Baroque palace, 4 facades, ceremonial courtyard
    // -------------------------------------------------------------------------
    function buildRoyalPalace() {
        var px = 80;
        var pz = -10;

        // Main palace body
        box(70, 30, 60, 0xD4A870, px, 19, pz);

        // Four identical facade wings
        box(70, 28, 8, 0xC8A060, px, 18, pz - 34);
        box(70, 28, 8, 0xC8A060, px, 18, pz + 34);
        box(8, 28, 60, 0xC8A060, px - 39, 18, pz);
        box(8, 28, 60, 0xC8A060, px + 39, 18, pz);

        // Roofline balustrade
        box(72, 3, 62, 0xBE9860, px, 35.5, pz);

        // Central clock tower / cupola
        cyl(4, 4, 12, 8, 0xD4A870, px, 42, pz);
        sph(5, 8, 6, 0xC8A060, px, 49, pz);

        // Corner towers — 4 corners
        cyl(3, 3, 28, 8, 0xC8A060, px - 35, 18, pz - 30);
        cone(3, 6, 8, 0xA08040, px - 35, 33, pz - 30);

        cyl(3, 3, 28, 8, 0xC8A060, px + 35, 18, pz - 30);
        cone(3, 6, 8, 0xA08040, px + 35, 33, pz - 30);

        cyl(3, 3, 28, 8, 0xC8A060, px - 35, 18, pz + 30);
        cone(3, 6, 8, 0xA08040, px - 35, 33, pz + 30);

        cyl(3, 3, 28, 8, 0xC8A060, px + 35, 18, pz + 30);
        cone(3, 6, 8, 0xA08040, px + 35, 33, pz + 30);

        // Ceremonial courtyard ground
        box(40, 1, 35, 0xC4B090, px, 4.5, pz);

        // Courtyard gate pillars
        box(3, 10, 3, 0xBCA870, px - 10, 9, pz - 20);
        box(3, 10, 3, 0xBCA870, px + 10, 9, pz - 20);
        box(20, 2, 2, 0xBCA870, px, 14, pz - 20);

        // Palace windows accent rows
        box(60, 1, 1, 0xBE9058, px, 12, pz - 30.5);
        box(60, 1, 1, 0xBE9058, px, 22, pz - 30.5);
        box(1, 16, 1, 0xBE9058, px - 25, 20, pz - 30.5);
        box(1, 16, 1, 0xBE9058, px, 20, pz - 30.5);
        box(1, 16, 1, 0xBE9058, px + 25, 20, pz - 30.5);
    }

    // -------------------------------------------------------------------------
    // STORKYRKAN CATHEDRAL — beside Royal Palace
    // -------------------------------------------------------------------------
    function buildStorkyrkan() {
        var sx = 55;
        var sz = -50;

        // Main nave
        box(20, 22, 36, 0xD4C8A0, sx, 15, sz);

        // Transept
        box(34, 18, 12, 0xD4C8A0, sx, 13, sz);

        // Tower
        box(8, 40, 8, 0xC8BC90, sx - 12, 24, sz - 18);
        box(8, 3, 8, 0xB8AC80, sx - 12, 44, sz - 18);
        cone(4, 14, 4, 0x706050, sx - 12, 51, sz - 18);

        // Apse — semicircular east end approximated with cylinders
        cyl(9, 9, 22, 8, 0xD4C8A0, sx, 15, sz + 18);

        // Roof ridge
        box(20, 3, 36, 0xC0B488, sx, 28, sz);
        cone(10, 6, 4, 0xB0A478, sx, 32, sz);
    }

    // -------------------------------------------------------------------------
    // RIDDARHOLMSKYRKAN — Gothic church, burial place of Swedish kings
    // -------------------------------------------------------------------------
    function buildRiddarholmskyrkan() {
        var rx = -60;
        var rz = -60;

        // Main body
        box(18, 24, 32, 0xAAAAAA, rx, 16, rz);

        // Gothic tower — tall and slender cast iron spire
        box(6, 50, 6, 0x999999, rx - 8, 29, rz - 14);

        // Distinctive openwork iron spire
        cyl(1.5, 2.5, 35, 6, 0x777777, rx - 8, 62, rz - 14);
        cone(1.5, 12, 6, 0x555555, rx - 8, 80, rz - 14);

        // Choir chapels (royal burial chapels)
        box(8, 16, 10, 0xAAAAAA, rx + 12, 12, rz - 8);
        box(8, 16, 10, 0xAAAAAA, rx + 12, 12, rz + 8);
        cone(4, 8, 4, 0x999999, rx + 12, 21, rz - 8);
        cone(4, 8, 4, 0x999999, rx + 12, 21, rz + 8);

        // Buttresses
        box(2, 20, 4, 0xBBBBBB, rx - 10, 14, rz - 10);
        box(2, 20, 4, 0xBBBBBB, rx - 10, 14, rz + 10);
    }

    // -------------------------------------------------------------------------
    // GERMAN CHURCH (Tyska kyrkan) — in Gamla Stan
    // -------------------------------------------------------------------------
    function buildGermanChurch() {
        var gx = -10;
        var gz = -55;

        // Body
        box(16, 20, 26, 0xC8A878, gx, 14, gz);

        // Twin towers
        box(5, 32, 5, 0xB89868, gx - 7, 20, gz - 12);
        box(5, 32, 5, 0xB89868, gx + 7, 20, gz - 12);
        cone(3, 10, 8, 0x886644, gx - 7, 37, gz - 12);
        cone(3, 10, 8, 0x886644, gx + 7, 37, gz - 12);

        // Copper dome
        cyl(5, 5, 6, 8, 0x7A9060, gx, 23, gz);
        sph(5, 8, 6, 0x6A8050, gx, 27, gz);
    }

    // -------------------------------------------------------------------------
    // STORTORGET — Great Square with multicoloured facades
    // -------------------------------------------------------------------------
    function buildStortorget() {
        var qx = 10;
        var qz = -5;

        // Square ground paving
        box(30, 0.5, 30, 0x9A8A70, qx, 4.8, qz);

        // Well / fountain in centre
        cyl(2, 2.5, 4, 8, 0x888888, qx, 7, qz);
        cyl(2.5, 2.5, 0.5, 8, 0x777777, qx, 9.2, qz);

        // Multicoloured buildings around square
        box(10, 20, 8, 0xCC3322, qx - 15, 14, qz - 15);
        box(10, 24, 8, 0xDDAA22, qx - 4, 16, qz - 15);
        box(10, 18, 8, 0x3366AA, qx + 7, 13, qz - 15);

        box(8, 22, 8, 0xCC7733, qx - 15, 15, qz + 13);
        box(8, 17, 8, 0xDDCC44, qx - 6, 12.5, qz + 13);
        box(8, 25, 8, 0x996633, qx + 3, 16.5, qz + 13);
        box(8, 20, 8, 0xBB4422, qx + 12, 14, qz + 13);
    }

    // -------------------------------------------------------------------------
    // STOCKHOLM CITY HALL (Stadshuset)
    // -------------------------------------------------------------------------
    function buildCityHall() {
        var chx = -130;
        var chz = 50;

        // Main building body — red brick
        box(60, 28, 45, 0xC87020, chx, 18, chz);

        // South wing
        box(20, 22, 45, 0xC87020, chx - 40, 15, chz);

        // North wing
        box(20, 22, 45, 0xC87020, chx + 40, 15, chz);

        // Waterfront arcade arches base
        box(60, 8, 6, 0xB86010, chx, 8, chz + 25);

        // The 106m tower
        box(12, 75, 12, 0xC87020, chx + 24, 41.5, chz - 15);

        // Tower upper section
        box(10, 18, 10, 0xB86010, chx + 24, 87, chz - 15);

        // Three Crowns copper top — golden spire
        cyl(4, 5, 8, 8, 0x4A7A40, chx + 24, 99, chz - 15);

        // Three small crowns as spheres at apex
        sph(2, 6, 5, 0x5A9050, chx + 24, 104, chz - 15);
        sph(1.2, 6, 5, 0x5A9050, chx + 20, 101, chz - 15);
        sph(1.2, 6, 5, 0x5A9050, chx + 28, 101, chz - 15);

        // Golden spire tip
        cyl(0.3, 1.5, 10, 6, 0xDAA520, chx + 24, 110, chz - 15);

        // Tower base decorative band
        box(14, 2, 14, 0x9A5010, chx + 24, 76, chz - 15);

        // Corner turrets on main building
        cyl(2, 2, 28, 8, 0xB86010, chx - 30, 18, chz - 22);
        cyl(2, 2, 28, 8, 0xB86010, chx + 30, 18, chz - 22);
        cyl(2, 2, 22, 8, 0xB86010, chx - 30, 15, chz + 22);
        cyl(2, 2, 22, 8, 0xB86010, chx + 30, 15, chz + 22);

        // Rooftop parapet
        box(62, 2, 47, 0xA86010, chx, 34, chz);
    }

    // -------------------------------------------------------------------------
    // VASA MUSEUM — museum with 17th century warship inside
    // -------------------------------------------------------------------------
    function buildVasaMuseum() {
        var vx = 100;
        var vz = 80;

        // Museum building — large warehouse-like structure
        box(55, 22, 40, 0xC8B89A, vx, 15, vz);

        // Distinctive roof profile — stepped
        box(55, 6, 40, 0xB8A88A, vx, 28, vz);
        box(40, 6, 28, 0xA8987A, vx, 34, vz);

        // Museum entry hall protrusion
        box(14, 18, 10, 0xD8C8AA, vx - 30, 13, vz);

        // Vasa warship hull inside (visible through glass — represented as dark wooden hull)
        box(10, 16, 35, 0x4A3018, vx, 10, vz);

        // Ship masts poking above roofline
        cyl(0.8, 1, 30, 6, 0x3A2010, vx - 5, 26, vz);
        cyl(0.6, 0.8, 22, 6, 0x3A2010, vx + 8, 22, vz);
        cyl(0.5, 0.7, 18, 6, 0x3A2010, vx + 16, 20, vz);

        // Bowsprit angle approximation
        box(15, 1, 1, 0x3A2010, vx - 14, 16, vz - 5);

        // Museum skylight ridge
        box(55, 1, 5, 0xE8D8BA, vx, 37.5, vz);
    }

    // -------------------------------------------------------------------------
    // DJURGARDEN — green island with Skansen open-air museum
    // -------------------------------------------------------------------------
    function buildDjurgarden() {
        var dx = 160;
        var dz = 60;

        // Island base
        box(120, 3, 90, 0x4CAF50, dx, 1.5, dz);

        // Forest — clusters of trees using cylinders and cones
        cyl(1, 1.5, 10, 6, 0x3A7A30, dx - 40, 10, dz - 30);
        cone(5, 12, 6, 0x2D6B26, dx - 40, 18, dz - 30);

        cyl(1, 1.5, 10, 6, 0x3A7A30, dx - 28, 10, dz - 20);
        cone(5, 12, 6, 0x2D6B26, dx - 28, 18, dz - 20);

        cyl(1, 1.5, 8, 6, 0x3A7A30, dx - 50, 9, dz - 10);
        cone(4, 10, 6, 0x2D6B26, dx - 50, 16, dz - 10);

        cyl(1, 1.5, 12, 6, 0x3A7A30, dx + 30, 11, dz + 20);
        cone(6, 14, 6, 0x2D6B26, dx + 30, 20, dz + 20);

        cyl(1, 1.5, 10, 6, 0x3A7A30, dx + 42, 10, dz + 30);
        cone(5, 12, 6, 0x2D6B26, dx + 42, 18, dz + 30);

        cyl(1, 1.5, 9, 6, 0x3A7A30, dx + 20, 9.5, dz + 10);
        cone(5, 11, 6, 0x2D6B26, dx + 20, 17, dz + 10);

        // Skansen open-air museum buildings
        // Main entrance building
        box(16, 10, 12, 0xCC8833, dx - 10, 9, dz + 20);
        cone(8, 6, 4, 0xAA6611, dx - 10, 16, dz + 20);

        // Traditional red farm houses
        box(10, 7, 8, 0xAA2222, dx + 10, 7.5, dz + 25);
        box(10, 2, 8, 0x882222, dx + 10, 12, dz + 25);
        cone(5, 5, 4, 0x661111, dx + 10, 15.5, dz + 25);

        box(8, 6, 7, 0xCC3333, dx + 24, 7, dz + 15);
        cone(4, 4, 4, 0xAA1111, dx + 24, 12, dz + 15);

        // Windmill
        cyl(1.5, 2, 14, 8, 0xCC9944, dx - 30, 11, dz + 30);
        box(1, 10, 1, 0xAA7722, dx - 30, 17, dz + 30);
        box(10, 1, 1, 0xAA7722, dx - 30, 21, dz + 30);
        cone(1.5, 3, 6, 0x886633, dx - 30, 18, dz + 30);
    }

    // -------------------------------------------------------------------------
    // SODERMALM — high rocky cliffs with buildings on top
    // -------------------------------------------------------------------------
    function buildSodermalm() {
        var sx = -20;
        var sz = 120;

        // Cliff faces — large grey boxes stepped
        box(220, 30, 20, 0x888888, sx, 19, sz);
        box(200, 15, 15, 0x909090, sx, 37.5, sz - 5);
        box(180, 10, 10, 0x9A9A9A, sx, 50, sz - 8);

        // Colourful buildings on cliff top
        box(14, 16, 12, 0xCC4422, sx - 70, 66, sz - 8);
        cone(7, 6, 4, 0xAA2200, sx - 70, 80, sz - 8);

        box(12, 14, 10, 0xDDAA22, sx - 50, 65, sz - 8);
        box(10, 18, 11, 0x3355AA, sx - 35, 67, sz - 8);

        box(13, 15, 12, 0xCC7733, sx - 18, 65.5, sz - 8);
        cone(6, 7, 4, 0xAA5511, sx - 18, 80, sz - 8);

        box(11, 16, 10, 0xBBCCDD, sx, 66, sz - 8);
        box(12, 14, 11, 0xCCBB22, sx + 18, 65, sz - 8);

        box(10, 17, 12, 0xAA3322, sx + 35, 66.5, sz - 8);
        box(14, 15, 10, 0xDDAA33, sx + 52, 65.5, sz - 8);
        cone(7, 6, 4, 0xBB8811, sx + 52, 80, sz - 8);

        box(12, 16, 11, 0x44AA66, sx + 70, 66, sz - 8);

        // Monteliusvägen promenade — viewing platform ledge
        box(220, 1, 5, 0xBBBBBB, sx, 56.5, sz - 3);

        // Cliff base water edge
        box(220, 2, 5, 0x1A4A6A, sx, 1, sz + 12);
    }

    // -------------------------------------------------------------------------
    // T-CENTRALEN METRO STATION — blue cave-like subway
    // -------------------------------------------------------------------------
    function buildTCentralen() {
        var tx = -80;
        var tz = 100;

        // Underground station entrance building
        box(20, 8, 16, 0x222266, tx, 8, tz);
        box(20, 1, 16, 0x111155, tx, 12.5, tz);

        // Blue cave tunnel mouth
        box(8, 7, 4, 0x3333AA, tx - 5, 7.5, tz - 9);
        box(8, 7, 4, 0x3333AA, tx + 5, 7.5, tz - 9);

        // Tunnel arch
        cyl(4, 4, 8, 8, 0x4444CC, tx, 10, tz - 11);

        // Blue painted cave walls — represented as coloured slabs
        box(16, 12, 1, 0x3344BB, tx, 10, tz - 13);
        box(1, 12, 18, 0x2233AA, tx - 8, 10, tz);
        box(1, 12, 18, 0x2233AA, tx + 8, 10, tz);

        // Station canopy
        box(22, 1, 18, 0x4444CC, tx, 13, tz);

        // Escalator shaft
        box(4, 10, 8, 0x555599, tx + 6, 9, tz + 5);

        // T-Bana red T sign pole
        cyl(0.3, 0.3, 8, 6, 0xCCCCCC, tx - 9, 8, tz - 6);
        box(3, 2, 0.5, 0xDD2222, tx - 9, 12.5, tz - 6);
    }

    // -------------------------------------------------------------------------
    // STREET / DETAIL LAYER — lamps, bollards, bridges
    // -------------------------------------------------------------------------
    function buildStreetDetails() {
        // Street lamps in Gamla Stan
        cyl(0.2, 0.2, 6, 6, 0x333333, -50, 7, -5);
        sph(0.6, 5, 4, 0xFFFF99, -50, 10.5, -5);

        cyl(0.2, 0.2, 6, 6, 0x333333, -20, 7, -5);
        sph(0.6, 5, 4, 0xFFFF99, -20, 10.5, -5);

        cyl(0.2, 0.2, 6, 6, 0x333333, 10, 7, -5);
        sph(0.6, 5, 4, 0xFFFF99, 10, 10.5, -5);

        cyl(0.2, 0.2, 6, 6, 0x333333, 40, 7, -5);
        sph(0.6, 5, 4, 0xFFFF99, 40, 10.5, -5);

        // Bridge between Gamla Stan and City Hall side (Vasabron approximation)
        box(80, 3, 10, 0x8A8A8A, -55, 3, 80);
        // Bridge pylons
        cyl(1.5, 2, 10, 6, 0x777777, -80, 9, 80);
        cyl(1.5, 2, 10, 6, 0x777777, -60, 9, 80);
        cyl(1.5, 2, 10, 6, 0x777777, -40, 9, 80);
        cyl(1.5, 2, 10, 6, 0x777777, -20, 9, 80);

        // Riksbron bridge (Parliament island connection)
        box(50, 2, 8, 0x9A9A9A, 50, 2, -60);

        // Bollards along waterfront
        cyl(0.4, 0.4, 2.5, 5, 0x222222, -10, 6, 75);
        cyl(0.4, 0.4, 2.5, 5, 0x222222, -5, 6, 75);
        cyl(0.4, 0.4, 2.5, 5, 0x222222, 0, 6, 75);
        cyl(0.4, 0.4, 2.5, 5, 0x222222, 5, 6, 75);
        cyl(0.4, 0.4, 2.5, 5, 0x222222, 10, 6, 75);

        // Gamla Stan harbour quayside
        box(160, 2, 6, 0x6A5A40, 0, 5, 73);

        // Riddarfjärden harbour mouth box (water)
        box(100, 1, 40, 0x163D5C, -100, 0, 90);

        // Parliament building (Riksdag) — on its own island
        box(50, 18, 30, 0xD4C090, 50, 13, -40);
        box(50, 3, 30, 0xC4B080, 50, 22, -40);
        // Parliament dome
        cyl(8, 9, 10, 10, 0xC4B488, 50, 27, -40);
        sph(8, 8, 6, 0xB4A478, 50, 33, -40);

        // Slussen — lock/interchange
        box(30, 4, 30, 0x888890, -30, 4, 95);
    }

    function update(delta) {
        // Static environment — no animation needed
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
