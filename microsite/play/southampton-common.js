window.SouthamptonCommon = (function() {
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

    function makeLambert(color) {
        return new THREE.MeshLambertMaterial({ color: color });
    }

    function makeBox(w, h, d, color, x, y, z) {
        var geo = new THREE.BoxGeometry(w, h, d);
        var mat = makeLambert(color);
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        return addMesh(mesh);
    }

    function makeCylinder(rt, rb, h, seg, color, x, y, z) {
        var geo = new THREE.CylinderGeometry(rt, rb, h, seg);
        var mat = makeLambert(color);
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        return addMesh(mesh);
    }

    function makeSphere(r, ws, hs, color, x, y, z) {
        var geo = new THREE.SphereGeometry(r, ws, hs);
        var mat = makeLambert(color);
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        return addMesh(mesh);
    }

    function makeCone(r, h, seg, color, x, y, z) {
        var geo = new THREE.ConeGeometry(r, h, seg);
        var mat = makeLambert(color);
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        return addMesh(mesh);
    }

    // -------------------------------------------------------------------------
    // 1. THE BARGATE — medieval gatehouse at x=13280, z=0
    // -------------------------------------------------------------------------
    function buildBargate() {
        var ox = 13280;
        var oz = 0;

        // Central archway body
        makeBox(18, 14, 8, 0x8B7355, ox, 7, oz);

        // Archway opening (dark box representing the tunnel)
        makeBox(6, 8, 10, 0x2a2a2a, ox, 4, oz);

        // Guildhall chamber above arch
        makeBox(18, 6, 8, 0x9B8465, ox, 17, oz);

        // Left drum tower
        makeCylinder(4, 4, 18, 10, 0x7a6845, ox - 11, 9, oz);
        // Left tower cap
        makeCone(4.5, 5, 10, 0x5a4835, ox - 11, 20, oz);

        // Right drum tower
        makeCylinder(4, 4, 18, 10, 0x7a6845, ox + 11, 9, oz);
        // Right tower cap
        makeCone(4.5, 5, 10, 0x5a4835, ox + 11, 20, oz);

        // Battlements along top — left set
        makeBox(3, 2, 2, 0x8B7355, ox - 7, 21, oz - 3);
        makeBox(3, 2, 2, 0x8B7355, ox - 3, 21, oz - 3);
        makeBox(3, 2, 2, 0x8B7355, ox + 1, 21, oz - 3);
        makeBox(3, 2, 2, 0x8B7355, ox + 5, 21, oz - 3);

        // Rear battlements
        makeBox(3, 2, 2, 0x8B7355, ox - 7, 21, oz + 3);
        makeBox(3, 2, 2, 0x8B7355, ox - 3, 21, oz + 3);
        makeBox(3, 2, 2, 0x8B7355, ox + 1, 21, oz + 3);
        makeBox(3, 2, 2, 0x8B7355, ox + 5, 21, oz + 3);

        // Stone plinth base
        makeBox(22, 2, 10, 0x6B5D3F, ox, 1, oz);

        // Ornate facade detail strips
        makeBox(18, 1, 1, 0xA08060, ox, 12, oz - 4);
        makeBox(18, 1, 1, 0xA08060, ox, 16, oz - 4);

        // Flag pole on top
        makeCylinder(0.2, 0.2, 8, 6, 0x555555, ox, 26, oz);
    }

    // -------------------------------------------------------------------------
    // 2. MEDIEVAL WALLS — crenellated sections, towers
    // -------------------------------------------------------------------------
    function buildMedievalWalls() {
        var ox = 13280;

        // West wall section running north-south
        buildWallSection(ox - 80, 0, 0, 0, 120);
        buildWallSection(ox - 80, 0, 180, 0, 80);

        // Catchcold Tower (northern end)
        buildWallTower(ox - 80, 200, 0xA09070);

        // Arundel Tower (middle section)
        buildWallTower(ox - 80, 80, 0x9a8060);

        // West Quay gatehouse
        buildGatehouse(ox - 120, -60);

        // Short east wall stub
        buildWallSection(ox - 80, -80, 90, 0, 60);

        // Corner tower south
        buildWallTower(ox - 80, -120, 0xA09070);
    }

    function buildWallSection(cx, cz, rotY, dummy, length) {
        var wallColor = 0x8C7B5A;
        var geo = new THREE.BoxGeometry(8, 10, length);
        var mat = makeLambert(wallColor);
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(cx, 5, cz);
        mesh.rotation.y = rotY * Math.PI / 180;
        scene.add(mesh);
        objects.push(mesh);

        // Crenellations along wall
        var steps = Math.floor(length / 8);
        for (var i = 0; i < steps; i++) {
            var t = -length / 2 + 4 + i * 8;
            var bx = cx + Math.sin(rotY * Math.PI / 180) * t;
            var bz = cz + Math.cos(rotY * Math.PI / 180) * t;
            makeBox(3, 2, 4, 0x7a6a4a, bx, 12, bz);
        }
    }

    function buildWallTower(cx, cz, color) {
        makeCylinder(5, 5, 16, 10, color, cx, 8, cz);
        makeCone(6, 5, 10, 0x6a5a3a, cx, 18, cz);
        // Tower battlements ring
        for (var i = 0; i < 6; i++) {
            var ang = (i / 6) * Math.PI * 2;
            var bx = cx + Math.cos(ang) * 5;
            var bz = cz + Math.sin(ang) * 5;
            makeBox(2, 2, 2, color, bx, 17, bz);
        }
    }

    function buildGatehouse(cx, cz) {
        // Gatehouse body
        makeBox(20, 14, 10, 0x8B7355, cx, 7, cz);
        // Arch opening
        makeBox(5, 8, 12, 0x1a1a1a, cx, 4, cz);
        // Twin small towers
        makeCylinder(3, 3, 16, 8, 0x7a6845, cx - 11, 8, cz);
        makeCylinder(3, 3, 16, 8, 0x7a6845, cx + 11, 8, cz);
        makeCone(3.5, 4, 8, 0x5a4835, cx - 11, 18, cz);
        makeCone(3.5, 4, 8, 0x5a4835, cx + 11, 18, cz);
    }

    // -------------------------------------------------------------------------
    // 3. SOUTHAMPTON COMMON — 366-acre public space
    // -------------------------------------------------------------------------
    function buildSouthamptonCommon() {
        var ox = 13280;
        var oz = 300;

        // Ground plane for common (large flat area)
        makeBox(600, 0.5, 500, 0x4a7a3a, ox, 0, oz);

        // Boating lake
        makeBox(80, 0.3, 60, 0x2255aa, ox - 50, 0.4, oz - 80);

        // Lake island
        makeSphere(6, 8, 6, 0x3a6a2a, ox - 50, 0.8, oz - 80);

        // Bandstand — central feature
        buildBandstand(ox + 20, oz + 40);

        // Cafe building
        makeBox(20, 4, 15, 0xc8a870, ox + 80, 2, oz - 30);
        makeBox(22, 1, 17, 0xa06030, ox + 80, 4.5, oz - 30);

        // Children's zoo buildings
        makeBox(15, 3, 10, 0xddaa55, ox - 100, 1.5, oz + 100);
        makeBox(12, 3, 8, 0xccbb44, ox - 85, 1.5, oz + 115);
        makeBox(10, 3, 10, 0xdd9944, ox - 115, 1.5, oz + 110);
        // Zoo enclosure fence posts
        for (var zi = 0; zi < 8; zi++) {
            makeBox(0.5, 3, 0.5, 0x888866, ox - 120 + zi * 8, 1.5, oz + 90);
        }

        // Wooded areas — clusters of trees
        buildTreeCluster(ox - 150, oz - 100, 12);
        buildTreeCluster(ox + 150, oz + 150, 10);
        buildTreeCluster(ox - 200, oz + 200, 15);
        buildTreeCluster(ox + 200, oz - 50, 8);
        buildTreeCluster(ox, oz + 200, 10);

        // Paths (light coloured strips)
        makeBox(4, 0.2, 300, 0xd2c8a0, ox, 0.3, oz);
        makeBox(200, 0.2, 4, 0xd2c8a0, ox, 0.3, oz);
    }

    function buildBandstand(cx, cz) {
        // Base platform
        makeCylinder(12, 12, 1, 12, 0xc8c0a0, cx, 0.5, cz);
        // Support columns around ring
        for (var i = 0; i < 8; i++) {
            var ang = (i / 8) * Math.PI * 2;
            var bx = cx + Math.cos(ang) * 9;
            var bz = cz + Math.sin(ang) * 9;
            makeCylinder(0.4, 0.4, 5, 6, 0xa09070, bx, 3, bz);
        }
        // Central pole
        makeCylinder(0.5, 0.5, 7, 6, 0x808060, cx, 4, cz);
        // Roof cone
        makeCone(14, 4, 12, 0x884422, cx, 8, cz);
    }

    function buildTreeCluster(cx, cz, count) {
        for (var i = 0; i < count; i++) {
            var tx = cx + (Math.sin(i * 1.7) * 25);
            var tz = cz + (Math.cos(i * 1.3) * 25);
            var th = 6 + (i % 4);
            makeCylinder(0.4, 0.6, th, 5, 0x5a4a2a, tx, th / 2, tz);
            makeSphere(3 + (i % 3), 6, 5, 0x2a6a1a, tx, th + 2, tz);
        }
    }

    // -------------------------------------------------------------------------
    // 4. MAYFLOWER PARK — harbour park with Mayflower memorial
    // -------------------------------------------------------------------------
    function buildMayflowerPark() {
        var ox = 13280;
        var oz = -200;

        // Park ground
        makeBox(300, 0.3, 180, 0x4a7040, ox - 50, 0, oz);

        // Mayflower Memorial — column with ship motif
        makeCylinder(1.5, 2, 18, 8, 0xd0c8b0, ox, 9, oz);
        // Memorial sphere topper
        makeSphere(2, 8, 6, 0xc0b89a, ox, 20, oz);
        // Memorial base block
        makeBox(8, 2, 8, 0xb8b0a0, ox, 1, oz);
        makeBox(12, 1, 12, 0xa8a090, ox, 0.5, oz);

        // Pilgrim Father plaques (decorative slabs)
        makeBox(4, 5, 0.5, 0xc8c0a8, ox - 5, 3.5, oz - 4);
        makeBox(4, 5, 0.5, 0xc8c0a8, ox + 5, 3.5, oz - 4);

        // Ocean liner terminal building
        makeBox(120, 12, 30, 0xd8d0c8, ox + 60, 6, oz - 80);
        makeBox(130, 1, 32, 0xc0b8b0, ox + 60, 12.5, oz - 80);
        // Terminal windows row
        for (var wi = 0; wi < 10; wi++) {
            makeBox(6, 4, 0.5, 0x8899bb, ox - 20 + wi * 12, 7, oz - 64);
        }

        // Harbour cranes
        buildCrane(ox - 40, oz - 120);
        buildCrane(ox + 80, oz - 130);
        buildCrane(ox + 150, oz - 125);

        // Waterfront promenade
        makeBox(300, 0.3, 12, 0xc0b8a8, ox - 50, 0.3, oz - 70);

        // Benches along promenade
        for (var bi = 0; bi < 8; bi++) {
            makeBox(3, 0.4, 1, 0x8a6a3a, ox - 120 + bi * 35, 0.6, oz - 60);
        }
    }

    function buildCrane(cx, cz) {
        // Crane base tower
        makeBox(4, 30, 4, 0xd4a020, cx, 15, cz);
        // Horizontal boom
        makeBox(40, 2, 2, 0xd4a020, cx + 15, 31, cz);
        // Counter-weight arm
        makeBox(12, 2, 2, 0xd4a020, cx - 10, 31, cz);
        // Counter-weight
        makeBox(6, 4, 4, 0xb08010, cx - 16, 29, cz);
        // Hoist cable (thin box)
        makeBox(0.3, 10, 0.3, 0x444444, cx + 28, 25, cz);
        // Hook block
        makeBox(2, 2, 2, 0x888888, cx + 28, 19, cz);
    }

    // -------------------------------------------------------------------------
    // 5. TUDOR HOUSE MUSEUM — timber-framed Tudor building
    // -------------------------------------------------------------------------
    function buildTudorHouse() {
        var ox = 13280 + 60;
        var oz = 50;

        // Main timber-framed body
        makeBox(22, 10, 14, 0xf0e8d0, ox, 5, oz);

        // Dark timber frame stripes (vertical)
        makeBox(1, 10, 14, 0x3a2a1a, ox - 8, 5, oz);
        makeBox(1, 10, 14, 0x3a2a1a, ox, 5, oz);
        makeBox(1, 10, 14, 0x3a2a1a, ox + 8, 5, oz);

        // Horizontal timber rails
        makeBox(22, 1, 14, 0x3a2a1a, ox, 2.5, oz);
        makeBox(22, 1, 14, 0x3a2a1a, ox, 7.5, oz);

        // Upper jettied storey (overhangs slightly)
        makeBox(24, 6, 15, 0xe8e0c8, ox, 13, oz);

        // Upper storey timber frame
        makeBox(1, 6, 15, 0x3a2a1a, ox - 9, 13, oz);
        makeBox(1, 6, 15, 0x3a2a1a, ox + 9, 13, oz);
        makeBox(24, 1, 15, 0x3a2a1a, ox, 10.5, oz);
        makeBox(24, 1, 15, 0x3a2a1a, ox, 15.5, oz);

        // Steeply pitched roof
        makeCone(16, 8, 4, 0x5a3a2a, ox, 21, oz);

        // Chimney stack
        makeBox(3, 8, 3, 0xb08060, ox + 6, 24, oz);

        // Entrance porch
        makeBox(6, 8, 5, 0xf0e8d0, ox - 9, 4, oz - 9.5);
        makeCone(4, 4, 4, 0x5a3a2a, ox - 9, 9, oz - 9.5);

        // Medieval garden — walled garden adjacent
        makeBox(30, 0.3, 20, 0x3a6a2a, ox + 20, 0, oz + 20);
        // Garden wall
        makeBox(30, 2, 1, 0x8a7a5a, ox + 20, 1, oz + 10);
        makeBox(30, 2, 1, 0x8a7a5a, ox + 20, 1, oz + 30);
        makeBox(1, 2, 20, 0x8a7a5a, ox + 5, 1, oz + 20);
        makeBox(1, 2, 20, 0x8a7a5a, ox + 35, 1, oz + 20);

        // Garden herb beds
        makeBox(8, 0.5, 4, 0x2a5a1a, ox + 14, 0.5, oz + 18);
        makeBox(8, 0.5, 4, 0x2a5a1a, ox + 26, 0.5, oz + 18);
        makeBox(8, 0.5, 4, 0x2a5a1a, ox + 14, 0.5, oz + 24);
        makeBox(8, 0.5, 4, 0x2a5a1a, ox + 26, 0.5, oz + 24);

        // Central garden sundial
        makeCylinder(0.5, 1, 4, 6, 0x8a8a7a, ox + 20, 2, oz + 21);
        makeCylinder(2, 2, 0.3, 8, 0x9a9a8a, ox + 20, 4, oz + 21);
    }

    // -------------------------------------------------------------------------
    // 6. WESTQUAY SHOPPING CENTRE — large modern mall
    // -------------------------------------------------------------------------
    function buildWestQuay() {
        var ox = 13280 - 140;
        var oz = -20;

        // Main mall body — large footprint
        makeBox(200, 20, 120, 0xd8dde0, ox, 10, oz);

        // Upper glass atrium section
        makeBox(180, 10, 100, 0xc0cdd8, ox, 24, oz);

        // Roof plant room / lift overruns
        makeBox(60, 5, 40, 0xb0bbc8, ox, 31, oz);

        // South entrance canopy
        makeBox(60, 4, 12, 0xc8cdd0, ox, 21, oz + 60);
        // Canopy support columns
        makeCylinder(1, 1, 20, 6, 0xb0b5b8, ox - 25, 10, oz + 60);
        makeCylinder(1, 1, 20, 6, 0xb0b5b8, ox, 10, oz + 60);
        makeCylinder(1, 1, 20, 6, 0xb0b5b8, ox + 25, 10, oz + 60);

        // North entrance
        makeBox(40, 4, 12, 0xc8cdd0, ox, 21, oz - 60);
        makeCylinder(1, 1, 20, 6, 0xb0b5b8, ox - 15, 10, oz - 60);
        makeCylinder(1, 1, 20, 6, 0xb0b5b8, ox + 15, 10, oz - 60);

        // West facade glass curtain wall panels
        for (var gi = 0; gi < 8; gi++) {
            makeBox(20, 18, 1, 0x99aabb, ox - 100, 10 + (gi % 2) * 0.3, oz - 50 + gi * 14);
        }

        // Signage boxes on facade
        makeBox(30, 5, 2, 0xe8eaf0, ox, 22, oz + 61);
        makeBox(20, 5, 2, 0xe8eaf0, ox, 22, oz - 61);

        // Service road / loading bay
        makeBox(40, 0.3, 20, 0x888880, ox + 110, 0.2, oz);
        // Loading bay doors
        makeBox(8, 6, 1, 0x666660, ox + 100, 3, oz - 10);
        makeBox(8, 6, 1, 0x666660, ox + 100, 3, oz + 10);

        // Car park structure adjacent
        makeBox(80, 16, 60, 0xcacac8, ox + 150, 8, oz);
        // Car park deck lines
        makeBox(80, 0.3, 60, 0xbabab8, ox + 150, 5, oz);
        makeBox(80, 0.3, 60, 0xbabab8, ox + 150, 10, oz);
        makeBox(80, 0.3, 60, 0xbabab8, ox + 150, 15, oz);

        // Ancient wall boundary alongside (walls border WestQuay)
        makeBox(1, 10, 100, 0x8a7a5a, ox - 101, 5, oz);
        // Crenels on boundary wall top
        for (var ci = 0; ci < 8; ci++) {
            makeBox(4, 2, 3, 0x8a7a5a, ox - 101, 12, oz - 42 + ci * 12);
        }
    }

    // -------------------------------------------------------------------------
    // MAIN BUILD
    // -------------------------------------------------------------------------
    function build() {
        buildBargate();
        buildMedievalWalls();
        buildSouthamptonCommon();
        buildMayflowerPark();
        buildTudorHouse();
        buildWestQuay();
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
