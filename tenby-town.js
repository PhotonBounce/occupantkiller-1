window.TenbyTown = (function() {
    'use strict';

    var scene = null;
    var camera = null;
    var objects = [];

    var X_OFFSET = 14600;

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
        objects = [];
        build();
    }

    function makeMesh(geo, color, x, y, z, rx, ry, rz) {
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        if (rx !== undefined) mesh.rotation.x = rx;
        if (ry !== undefined) mesh.rotation.y = ry;
        if (rz !== undefined) mesh.rotation.z = rz;
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function buildTownWalls() {
        var wallColor = 0x9e8e7a;
        var stoneColor = 0x8a7a68;

        // South curtain wall - long stretch
        makeMesh(new THREE.BoxGeometry(80, 10, 3), wallColor, X_OFFSET - 20, 5, 80);
        // North curtain wall
        makeMesh(new THREE.BoxGeometry(60, 10, 3), wallColor, X_OFFSET + 10, 5, 20);
        // East curtain wall
        makeMesh(new THREE.BoxGeometry(3, 10, 60), wallColor, X_OFFSET + 40, 5, 50);
        // West curtain wall
        makeMesh(new THREE.BoxGeometry(3, 10, 60), wallColor, X_OFFSET - 60, 5, 50);

        // Wall walk - parapet crenellations (series of merlons)
        var i;
        for (i = 0; i < 8; i++) {
            makeMesh(new THREE.BoxGeometry(4, 3, 2), stoneColor, X_OFFSET - 50 + i * 10, 12, 80);
        }
        for (i = 0; i < 6; i++) {
            makeMesh(new THREE.BoxGeometry(4, 3, 2), stoneColor, X_OFFSET - 10 + i * 10, 12, 20);
        }

        // Corner towers - round towers
        makeMesh(new THREE.CylinderGeometry(4, 4, 14, 8), stoneColor, X_OFFSET + 40, 7, 80);
        makeMesh(new THREE.CylinderGeometry(4, 4, 14, 8), stoneColor, X_OFFSET - 60, 7, 80);
        makeMesh(new THREE.CylinderGeometry(4, 4, 14, 8), stoneColor, X_OFFSET + 40, 7, 20);
        makeMesh(new THREE.CylinderGeometry(4, 4, 14, 8), stoneColor, X_OFFSET - 60, 7, 20);

        // Tower tops / conical caps
        makeMesh(new THREE.ConeGeometry(4.5, 5, 8), 0x6a5a48, X_OFFSET + 40, 17, 80);
        makeMesh(new THREE.ConeGeometry(4.5, 5, 8), 0x6a5a48, X_OFFSET - 60, 17, 80);
        makeMesh(new THREE.ConeGeometry(4.5, 5, 8), 0x6a5a48, X_OFFSET + 40, 17, 20);
        makeMesh(new THREE.ConeGeometry(4.5, 5, 8), 0x6a5a48, X_OFFSET - 60, 17, 20);

        // Five Arches Gatehouse - main gate, south side
        // Gate base / left pier
        makeMesh(new THREE.BoxGeometry(5, 12, 6), stoneColor, X_OFFSET - 8, 6, 80);
        // Gate base / right pier
        makeMesh(new THREE.BoxGeometry(5, 12, 6), stoneColor, X_OFFSET + 8, 6, 80);
        // Gate lintel / arch top
        makeMesh(new THREE.BoxGeometry(20, 3, 6), stoneColor, X_OFFSET, 13, 80);
        // Gate tower left
        makeMesh(new THREE.BoxGeometry(6, 18, 6), stoneColor, X_OFFSET - 14, 9, 80);
        // Gate tower right
        makeMesh(new THREE.BoxGeometry(6, 18, 6), stoneColor, X_OFFSET + 14, 9, 80);
        // Gate tower tops
        makeMesh(new THREE.ConeGeometry(4, 5, 4), 0x6a5a48, X_OFFSET - 14, 20, 80);
        makeMesh(new THREE.ConeGeometry(4, 5, 4), 0x6a5a48, X_OFFSET + 14, 20, 80);

        // Five arch cutout representations (small dark boxes between piers)
        makeMesh(new THREE.BoxGeometry(3, 6, 7), 0x222222, X_OFFSET - 4, 5, 80);
        makeMesh(new THREE.BoxGeometry(3, 6, 7), 0x222222, X_OFFSET, 5, 80);
        makeMesh(new THREE.BoxGeometry(3, 6, 7), 0x222222, X_OFFSET + 4, 5, 80);
    }

    function buildHarbour() {
        // Harbour wall - stone breakwater
        var harbourWallColor = 0x7a8a7a;
        makeMesh(new THREE.BoxGeometry(3, 5, 80), harbourWallColor, X_OFFSET - 80, 2, -20);
        makeMesh(new THREE.BoxGeometry(60, 5, 3), harbourWallColor, X_OFFSET - 50, 2, -60);

        // Harbour cottages - colourful pastel painted
        var cottageColors = [0xf4a0b0, 0xfde97a, 0x90c8f0, 0x98e898, 0xf4c06a, 0xe8a0d8, 0xa0d8b8, 0xf4e0a0];
        var j;
        // Row of cottages along harbour front
        for (j = 0; j < 8; j++) {
            var cottageX = X_OFFSET - 60 + j * 12;
            var cottageZ = -10;
            var cottageH = 8 + (j % 3) * 2;
            // Ground floor
            makeMesh(new THREE.BoxGeometry(10, cottageH, 8), cottageColors[j], cottageX, cottageH / 2, cottageZ);
            // Roof
            makeMesh(new THREE.CylinderGeometry(0.5, 7, 5, 4), 0x8b4513, cottageX, cottageH + 2.5, cottageZ, 0, Math.PI / 4, 0);
            // Chimney
            makeMesh(new THREE.BoxGeometry(1.5, 4, 1.5), 0x8a7a68, cottageX + 2, cottageH + 7, cottageZ);
            // Upper jettied floor / window gap
            makeMesh(new THREE.BoxGeometry(11, 4, 8.5), cottageColors[j], cottageX, cottageH + 2, cottageZ);
        }

        // Second row of cottages - slightly further back
        for (j = 0; j < 6; j++) {
            var cX = X_OFFSET - 52 + j * 14;
            var cZ = 5;
            var cH = 9 + (j % 2) * 3;
            makeMesh(new THREE.BoxGeometry(12, cH, 8), cottageColors[(j + 3) % 8], cX, cH / 2, cZ);
            makeMesh(new THREE.CylinderGeometry(0.5, 8, 5, 4), 0x8b4513, cX, cH + 2.5, cZ, 0, Math.PI / 4, 0);
            makeMesh(new THREE.BoxGeometry(1.5, 4, 1.5), 0x8a7a68, cX + 3, cH + 7, cZ);
        }

        // Fishing boats in harbour (simple box hulls)
        makeMesh(new THREE.BoxGeometry(8, 2, 3), 0x4a6a9a, X_OFFSET - 70, 1, -30);
        makeMesh(new THREE.BoxGeometry(6, 2, 2.5), 0xd04040, X_OFFSET - 75, 1, -40);
        makeMesh(new THREE.BoxGeometry(7, 2, 3), 0xf0e030, X_OFFSET - 65, 1, -45);
        // Boat masts
        makeMesh(new THREE.CylinderGeometry(0.2, 0.2, 10, 4), 0x8b6914, X_OFFSET - 70, 7, -30);
        makeMesh(new THREE.CylinderGeometry(0.2, 0.2, 9, 4), 0x8b6914, X_OFFSET - 75, 6.5, -40);
        makeMesh(new THREE.CylinderGeometry(0.2, 0.2, 9, 4), 0x8b6914, X_OFFSET - 65, 6.5, -45);
        // Boat cabins
        makeMesh(new THREE.BoxGeometry(3, 2, 2), 0xc0c0c0, X_OFFSET - 70, 3, -30);
        makeMesh(new THREE.BoxGeometry(2.5, 2, 2), 0xd0d0d0, X_OFFSET - 75, 3, -40);

        // South Beach - flat sandy expanse
        makeMesh(new THREE.BoxGeometry(100, 0.5, 30), 0xf5deb3, X_OFFSET, 0, 110);

        // North Beach
        makeMesh(new THREE.BoxGeometry(60, 0.5, 20), 0xf5deb3, X_OFFSET - 50, 0, -80);

        // Beach cliffs
        makeMesh(new THREE.BoxGeometry(20, 15, 30), 0x8a7a68, X_OFFSET + 55, 7, 110);
        makeMesh(new THREE.BoxGeometry(20, 12, 20), 0x8a7a68, X_OFFSET - 55, 6, -80);
    }

    function buildCastle() {
        // Headland promontory
        makeMesh(new THREE.BoxGeometry(40, 8, 50), 0x7a8a6a, X_OFFSET + 70, 4, -40);
        makeMesh(new THREE.BoxGeometry(30, 6, 30), 0x7a8a6a, X_OFFSET + 80, 3, -60);

        // Ruined castle walls
        var ruinColor = 0x9e8e7a;
        // Main ruined tower - partial
        makeMesh(new THREE.BoxGeometry(12, 20, 12), ruinColor, X_OFFSET + 70, 10, -45);
        // Tower inner void (dark)
        makeMesh(new THREE.BoxGeometry(8, 21, 8), 0x333333, X_OFFSET + 70, 10, -45);
        // Broken top of tower
        makeMesh(new THREE.BoxGeometry(13, 4, 5), ruinColor, X_OFFSET + 70, 22, -45);
        // Castle keep partial wall north
        makeMesh(new THREE.BoxGeometry(25, 14, 2), ruinColor, X_OFFSET + 70, 7, -52);
        // Castle keep partial wall west
        makeMesh(new THREE.BoxGeometry(2, 14, 20), ruinColor, X_OFFSET + 58, 7, -44);
        // Broken wall stump
        makeMesh(new THREE.BoxGeometry(2, 8, 15), ruinColor, X_OFFSET + 82, 4, -40);
        // Castle gate arch base
        makeMesh(new THREE.BoxGeometry(4, 10, 3), ruinColor, X_OFFSET + 65, 5, -40);
        makeMesh(new THREE.BoxGeometry(4, 10, 3), ruinColor, X_OFFSET + 75, 5, -40);
        makeMesh(new THREE.BoxGeometry(14, 3, 3), ruinColor, X_OFFSET + 70, 12, -40);
    }

    function buildTudorMerchantsHouse() {
        var houseX = X_OFFSET - 5;
        var houseZ = 45;

        // Ground floor - narrow medieval plot
        makeMesh(new THREE.BoxGeometry(8, 4, 10), 0xb8a898, houseX, 2, houseZ);
        // First floor - jettied (slightly wider)
        makeMesh(new THREE.BoxGeometry(9, 4, 11), 0xc8b8a0, houseX, 6, houseZ);
        // Second floor - jettied again
        makeMesh(new THREE.BoxGeometry(10, 4, 12), 0xd8c8b0, houseX, 10, houseZ);
        // Roof
        makeMesh(new THREE.CylinderGeometry(0.5, 7, 5, 4), 0x8b4513, houseX, 15, houseZ, 0, Math.PI / 4, 0);
        // Tudor chimney stack - tall and ornate (represented by cylinder)
        makeMesh(new THREE.CylinderGeometry(0.8, 0.8, 8, 6), 0x9e3820, houseX + 2, 18, houseZ - 2);
        // Chimney pot
        makeMesh(new THREE.CylinderGeometry(1, 0.8, 2, 6), 0x7a2810, houseX + 2, 23, houseZ - 2);
        // Window openings (dark recesses front face)
        makeMesh(new THREE.BoxGeometry(2, 2, 1), 0x222222, houseX - 2, 6, houseZ - 5);
        makeMesh(new THREE.BoxGeometry(2, 2, 1), 0x222222, houseX + 2, 6, houseZ - 5);
        makeMesh(new THREE.BoxGeometry(2, 2, 1), 0x222222, houseX - 2, 10, houseZ - 5);
        makeMesh(new THREE.BoxGeometry(2, 2, 1), 0x222222, houseX + 2, 10, houseZ - 5);
        // Timber framing suggestion (dark vertical strips)
        makeMesh(new THREE.BoxGeometry(0.5, 8, 0.5), 0x4a3020, houseX - 3, 6, houseZ - 4.5);
        makeMesh(new THREE.BoxGeometry(0.5, 8, 0.5), 0x4a3020, houseX + 3, 6, houseZ - 4.5);
        makeMesh(new THREE.BoxGeometry(6.5, 0.5, 0.5), 0x4a3020, houseX, 8, houseZ - 4.5);
    }

    function buildCaldeyIsland() {
        // Island landmass - offshore
        makeMesh(new THREE.BoxGeometry(60, 5, 40), 0x6a8a5a, X_OFFSET - 30, 2, -130);
        makeMesh(new THREE.BoxGeometry(40, 4, 25), 0x6a8a5a, X_OFFSET - 20, 2, -155);

        // Monastery buildings - white painted
        var monasteryWhite = 0xf0ece0;
        // Main monastery block
        makeMesh(new THREE.BoxGeometry(20, 10, 14), monasteryWhite, X_OFFSET - 25, 9, -135);
        // Monastery roof
        makeMesh(new THREE.CylinderGeometry(0.5, 14, 5, 4), 0xb0a898, X_OFFSET - 25, 16, -135, 0, Math.PI / 4, 0);
        // Monks' cells wing
        makeMesh(new THREE.BoxGeometry(12, 8, 8), monasteryWhite, X_OFFSET - 10, 8, -135);
        // Cloister courtyard wall
        makeMesh(new THREE.BoxGeometry(20, 4, 2), monasteryWhite, X_OFFSET - 25, 6, -143);
        makeMesh(new THREE.BoxGeometry(2, 4, 14), monasteryWhite, X_OFFSET - 35, 6, -135);

        // Abbey church - with tower
        makeMesh(new THREE.BoxGeometry(8, 12, 18), monasteryWhite, X_OFFSET - 40, 10, -140);
        // Church tower
        makeMesh(new THREE.BoxGeometry(6, 18, 6), 0xe0dcd0, X_OFFSET - 40, 17, -140);
        // Tower top crenellations
        makeMesh(new THREE.BoxGeometry(7, 3, 7), 0xd0ccc0, X_OFFSET - 40, 27, -140);
        // Church roof ridge
        makeMesh(new THREE.CylinderGeometry(0.5, 6, 4, 4), 0x9a8a78, X_OFFSET - 40, 14, -140, 0, Math.PI / 4, 0);

        // Lighthouse
        makeMesh(new THREE.CylinderGeometry(2, 2.5, 16, 8), 0xffffff, X_OFFSET - 5, 12, -155);
        makeMesh(new THREE.CylinderGeometry(3, 2, 3, 8), 0xd0c8b8, X_OFFSET - 5, 21, -155);
        makeMesh(new THREE.ConeGeometry(3, 4, 8), 0xc0b8a8, X_OFFSET - 5, 26, -155);
        // Light housing
        makeMesh(new THREE.SphereGeometry(1.5, 8, 8), 0xffffcc, X_OFFSET - 5, 22, -155);

        // Boat trip - small ferry between island and mainland
        makeMesh(new THREE.BoxGeometry(10, 2, 4), 0x4080c0, X_OFFSET - 40, 1, -100);
        makeMesh(new THREE.BoxGeometry(4, 3, 3), 0xd0d0d0, X_OFFSET - 40, 3.5, -100);
        makeMesh(new THREE.CylinderGeometry(0.3, 0.3, 10, 4), 0x606060, X_OFFSET - 40, 7, -100);
    }

    function buildStMarysChurch() {
        var churchX = X_OFFSET + 10;
        var churchZ = 50;
        var stoneColor = 0xb0a890;

        // Nave
        makeMesh(new THREE.BoxGeometry(16, 12, 35), stoneColor, churchX, 6, churchZ);
        // Nave roof
        makeMesh(new THREE.CylinderGeometry(0.5, 12, 6, 4), 0x8a7a68, churchX, 16, churchZ, 0, Math.PI / 4, 0);

        // Chancel (east end)
        makeMesh(new THREE.BoxGeometry(12, 10, 12), stoneColor, churchX, 5, churchZ - 22);
        makeMesh(new THREE.CylinderGeometry(0.5, 9, 5, 4), 0x8a7a68, churchX, 13, churchZ - 22, 0, Math.PI / 4, 0);

        // North aisle
        makeMesh(new THREE.BoxGeometry(8, 9, 30), stoneColor, churchX + 12, 4.5, churchZ);
        makeMesh(new THREE.CylinderGeometry(0.5, 6, 4, 4), 0x8a7a68, churchX + 12, 11, churchZ, 0, Math.PI / 4, 0);

        // South aisle
        makeMesh(new THREE.BoxGeometry(8, 9, 30), stoneColor, churchX - 12, 4.5, churchZ);
        makeMesh(new THREE.CylinderGeometry(0.5, 6, 4, 4), 0x8a7a68, churchX - 12, 11, churchZ, 0, Math.PI / 4, 0);

        // Impressive Perpendicular tower - tall
        makeMesh(new THREE.BoxGeometry(10, 32, 10), stoneColor, churchX, 16, churchZ + 20);
        // Tower belfry stage (slightly wider)
        makeMesh(new THREE.BoxGeometry(11, 8, 11), 0xa09880, churchX, 34, churchZ + 20);
        // Tower battlements
        makeMesh(new THREE.BoxGeometry(12, 4, 12), 0xa09880, churchX, 40, churchZ + 20);
        // Corner pinnacles on tower
        makeMesh(new THREE.ConeGeometry(1, 5, 4), 0x908870, churchX + 5, 45, churchZ + 15);
        makeMesh(new THREE.ConeGeometry(1, 5, 4), 0x908870, churchX - 5, 45, churchZ + 15);
        makeMesh(new THREE.ConeGeometry(1, 5, 4), 0x908870, churchX + 5, 45, churchZ + 25);
        makeMesh(new THREE.ConeGeometry(1, 5, 4), 0x908870, churchX - 5, 45, churchZ + 25);

        // Flying buttresses - angled supports
        makeMesh(new THREE.BoxGeometry(1.5, 1.5, 8), stoneColor, churchX + 8, 9, churchZ - 10, -0.3, 0, 0);
        makeMesh(new THREE.BoxGeometry(1.5, 1.5, 8), stoneColor, churchX + 8, 9, churchZ + 10, 0.3, 0, 0);
        makeMesh(new THREE.BoxGeometry(1.5, 1.5, 8), stoneColor, churchX - 8, 9, churchZ - 10, -0.3, 0, 0);
        makeMesh(new THREE.BoxGeometry(1.5, 1.5, 8), stoneColor, churchX - 8, 9, churchZ + 10, 0.3, 0, 0);
        // Buttress piers
        makeMesh(new THREE.BoxGeometry(2, 12, 2), stoneColor, churchX + 15, 6, churchZ - 8);
        makeMesh(new THREE.BoxGeometry(2, 12, 2), stoneColor, churchX + 15, 6, churchZ + 8);
        makeMesh(new THREE.BoxGeometry(2, 12, 2), stoneColor, churchX - 15, 6, churchZ - 8);
        makeMesh(new THREE.BoxGeometry(2, 12, 2), stoneColor, churchX - 15, 6, churchZ + 8);

        // Churchyard wall
        makeMesh(new THREE.BoxGeometry(50, 3, 2), stoneColor, churchX, 1.5, churchZ + 35);
        makeMesh(new THREE.BoxGeometry(50, 3, 2), stoneColor, churchX, 1.5, churchZ - 35);
        makeMesh(new THREE.BoxGeometry(2, 3, 70), stoneColor, churchX + 25, 1.5, churchZ);
        makeMesh(new THREE.BoxGeometry(2, 3, 70), stoneColor, churchX - 25, 1.5, churchZ);

        // Church windows (dark Gothic openings)
        makeMesh(new THREE.BoxGeometry(3, 6, 1), 0x334455, churchX - 4, 8, churchZ + 17);
        makeMesh(new THREE.BoxGeometry(3, 6, 1), 0x334455, churchX + 4, 8, churchZ + 17);
        makeMesh(new THREE.BoxGeometry(3, 6, 1), 0x334455, churchX - 4, 8, churchZ - 10);
        makeMesh(new THREE.BoxGeometry(3, 6, 1), 0x334455, churchX + 4, 8, churchZ - 10);
        // Tower belfry windows
        makeMesh(new THREE.BoxGeometry(3, 5, 1), 0x334455, churchX - 3, 32, churchZ + 15);
        makeMesh(new THREE.BoxGeometry(3, 5, 1), 0x334455, churchX + 3, 32, churchZ + 15);
        makeMesh(new THREE.BoxGeometry(1, 5, 3), 0x334455, churchX + 5, 32, churchZ + 20);
        makeMesh(new THREE.BoxGeometry(1, 5, 3), 0x334455, churchX - 5, 32, churchZ + 20);
    }

    function buildGroundAndSea() {
        // Town ground
        makeMesh(new THREE.BoxGeometry(180, 1, 200), 0x7a8a6a, X_OFFSET, 0, 30);
        // Headland rock
        makeMesh(new THREE.BoxGeometry(50, 4, 60), 0x6a6a5a, X_OFFSET + 60, 2, -30);
        // Sea / harbour water
        makeMesh(new THREE.BoxGeometry(120, 0.5, 80), 0x3a6a9a, X_OFFSET - 30, 0, -70);
        // Channel between town and Caldey
        makeMesh(new THREE.BoxGeometry(200, 0.5, 60), 0x2a5a8a, X_OFFSET - 20, 0, -115);
        // Cobbled streets (darker patches)
        makeMesh(new THREE.BoxGeometry(6, 0.2, 50), 0x7a7060, X_OFFSET - 20, 0.6, 55);
        makeMesh(new THREE.BoxGeometry(6, 0.2, 40), 0x7a7060, X_OFFSET + 5, 0.6, 60);
        makeMesh(new THREE.BoxGeometry(40, 0.2, 6), 0x7a7060, X_OFFSET, 0.6, 45);
    }

    function build() {
        buildGroundAndSea();
        buildTownWalls();
        buildHarbour();
        buildCastle();
        buildTudorMerchantsHouse();
        buildCaldeyIsland();
        buildStMarysChurch();
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
