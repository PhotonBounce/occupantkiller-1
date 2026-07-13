window.WindsorCastle = (function() {
    'use strict';

    var scene = null;
    var camera = null;
    var objects = [];

    var X_OFFSET = 12760;

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
        objects = [];
        build();
    }

    function addObj(mesh) {
        scene.add(mesh);
        objects.push(mesh);
    }

    function makebox(w, h, d, color, x, y, z) {
        var geo = new THREE.BoxGeometry(w, h, d);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        addObj(mesh);
        return mesh;
    }

    function makecyl(rt, rb, h, segs, color, x, y, z) {
        var geo = new THREE.CylinderGeometry(rt, rb, h, segs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        addObj(mesh);
        return mesh;
    }

    function makesphere(r, ws, hs, color, x, y, z) {
        var geo = new THREE.SphereGeometry(r, ws, hs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        addObj(mesh);
        return mesh;
    }

    function makecone(r, h, segs, color, x, y, z) {
        var geo = new THREE.ConeGeometry(r, h, segs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        addObj(mesh);
        return mesh;
    }

    function buildRoundTower() {
        var bx = X_OFFSET + 0;
        var bz = 0;

        // Motte (earthen mound)
        makecyl(18, 22, 10, 64, 0x5a7a3a, bx, 5, bz);

        // Round Tower base - wide lower section
        makecyl(12, 13, 28, 32, 0x9e8e7a, bx, 24, bz);

        // Round Tower upper section - narrower
        makecyl(10, 12, 16, 32, 0x8e7e6a, bx, 46, bz);

        // Battlements ring
        makecyl(11, 11, 3, 32, 0x7a6a5a, bx, 56, bz);

        // Battlement merlons (series of boxes around top)
        var merCount = 16;
        for (var m = 0; m < merCount; m++) {
            var ang = (m / merCount) * Math.PI * 2;
            var mx = bx + Math.cos(ang) * 10.5;
            var mz = bz + Math.sin(ang) * 10.5;
            makebox(1.5, 3, 1.5, 0x7a6a5a, mx, 59, mz);
        }

        // Flagpole
        makecyl(0.15, 0.15, 18, 6, 0x8b7355, bx, 67, bz);

        // Union Jack flag (simplified as layered colored boxes)
        makebox(5, 0.2, 3, 0xc8102e, bx + 2.5, 74, bz);
        makebox(5, 0.2, 1, 0x012169, bx + 2.5, 74.1, bz);
        makebox(1.5, 0.2, 3, 0x012169, bx + 2.5, 74.2, bz);
        makebox(5, 0.2, 0.5, 0xffffff, bx + 2.5, 74.3, bz);
        makebox(0.5, 0.2, 3, 0xffffff, bx + 2.5, 74.35, bz);

        // Tower door arch base
        makebox(4, 6, 2, 0x6a5a4a, bx + 12, 18, bz);
    }

    function buildUpperWard() {
        var bx = X_OFFSET + 30;
        var bz = 0;
        var stoneColor = 0x9e8e7a;
        var darkStone = 0x7a6a5a;
        var windowColor = 0x87ceeb;

        // Main State Apartments north range
        makebox(80, 20, 18, stoneColor, bx, 10, bz - 20);

        // South range
        makebox(80, 18, 16, stoneColor, bx, 9, bz + 20);

        // East range connecting
        makebox(16, 18, 56, stoneColor, bx + 48, 9, bz);

        // West range
        makebox(16, 20, 56, stoneColor, bx - 48, 10, bz);

        // Crenellated parapet - north range
        for (var i = 0; i < 18; i++) {
            makebox(2, 3, 2, darkStone, bx - 36 + i * 4.2, 21, bz - 20);
        }

        // Crenellated parapet - south range
        for (var j = 0; j < 18; j++) {
            makebox(2, 3, 2, darkStone, bx - 36 + j * 4.2, 20, bz + 20);
        }

        // Corner towers
        makecyl(5, 5, 24, 16, stoneColor, bx - 48, 12, bz - 28);
        makecyl(5, 5, 24, 16, stoneColor, bx + 48, 12, bz - 28);
        makecyl(5, 5, 22, 16, stoneColor, bx - 48, 11, bz + 28);
        makecyl(5, 5, 22, 16, stoneColor, bx + 48, 11, bz + 28);

        // Corner tower battlements
        makecyl(5.5, 5.5, 2, 16, darkStone, bx - 48, 25, bz - 28);
        makecyl(5.5, 5.5, 2, 16, darkStone, bx + 48, 25, bz - 28);
        makecyl(5.5, 5.5, 2, 16, darkStone, bx - 48, 23, bz + 28);
        makecyl(5.5, 5.5, 2, 16, darkStone, bx + 48, 23, bz + 28);

        // Sash windows - north facade
        for (var w = 0; w < 10; w++) {
            makebox(3, 4, 0.5, windowColor, bx - 40 + w * 8.5, 10, bz - 29.5);
        }

        // Sash windows - south facade
        for (var v = 0; v < 10; v++) {
            makebox(3, 4, 0.5, windowColor, bx - 40 + v * 8.5, 9, bz + 28.5);
        }

        // Quadrangle ground
        makebox(72, 0.5, 44, 0x8b8b7a, bx, 0.3, bz);

        // Flagpole on main building
        makecyl(0.15, 0.15, 14, 6, 0x8b7355, bx + 20, 26, bz - 20);
    }

    function buildStGeorgesChapel() {
        var bx = X_OFFSET - 30;
        var bz = 50;
        var chapelStone = 0xc8b89a;
        var darkChapel = 0xa09080;
        var glassColor = 0xd4a0ff;

        // Main nave body
        makebox(50, 18, 22, chapelStone, bx, 9, bz);

        // Higher clerestory
        makebox(38, 8, 14, chapelStone, bx - 2, 22, bz);

        // Nave roof (pitched)
        makebox(40, 5, 16, darkChapel, bx - 2, 29, bz);

        // West front facade
        makebox(22, 30, 4, chapelStone, bx - 27, 15, bz);

        // West window tracery (large Perpendicular window)
        makebox(14, 22, 0.5, glassColor, bx - 27, 18, bz);
        // Window tracery mullions
        makebox(0.8, 22, 0.8, darkChapel, bx - 27, 18, bz - 1);
        makebox(0.8, 22, 0.8, chapelStone, bx - 24, 18, bz);
        makebox(0.8, 22, 0.8, chapelStone, bx - 30, 18, bz);
        makebox(14, 0.8, 0.8, chapelStone, bx - 27, 22, bz);
        makebox(14, 0.8, 0.8, chapelStone, bx - 27, 27, bz);

        // West front twin towers
        makebox(6, 38, 6, chapelStone, bx - 38, 19, bz - 10);
        makebox(6, 38, 6, chapelStone, bx - 38, 19, bz + 10);

        // Tower pinnacles
        makecone(2, 8, 4, darkChapel, bx - 38, 42, bz - 10);
        makecone(2, 8, 4, darkChapel, bx - 38, 42, bz + 10);

        // Pinnacles along nave
        for (var p = 0; p < 6; p++) {
            makecone(1.2, 6, 4, darkChapel, bx - 18 + p * 7.5, 32, bz - 12);
            makecone(1.2, 6, 4, darkChapel, bx - 18 + p * 7.5, 32, bz + 12);
        }

        // Flying buttresses (simplified as angled boxes)
        for (var b = 0; b < 5; b++) {
            makebox(5, 1.5, 1.5, darkChapel, bx - 16 + b * 8, 22, bz - 15);
            makebox(5, 1.5, 1.5, darkChapel, bx - 16 + b * 8, 22, bz + 15);
        }

        // Choir / east end apse
        makecyl(11, 11, 18, 8, chapelStone, bx + 28, 9, bz);
        makecone(4, 8, 8, darkChapel, bx + 28, 22, bz);

        // Side aisle windows
        for (var s = 0; s < 5; s++) {
            makebox(4, 8, 0.5, glassColor, bx - 14 + s * 8, 8, bz - 12);
            makebox(4, 8, 0.5, glassColor, bx - 14 + s * 8, 8, bz + 12);
        }

        // Chapel entrance steps
        makebox(12, 1, 6, 0xd2c4b0, bx - 27, 0.5, bz);
    }

    function buildLongWalk() {
        var bx = X_OFFSET + 10;
        var walkLength = 600;
        var treeSpacing = 12;
        var treeCount = Math.floor(walkLength / treeSpacing);

        // Walk surface (gravel path)
        makebox(12, 0.3, walkLength, 0xc8b88a, bx, 0.15, walkLength / 2 + 80);

        // Double row of trees on each side
        for (var t = 0; t < treeCount; t++) {
            var tz = 80 + t * treeSpacing;

            // Left row - trunks
            makecyl(0.5, 0.6, 8, 8, 0x5a3a1a, bx - 9, 4, tz);
            // Left canopy
            makesphere(3.5, 8, 6, 0x2d5a1a, bx - 9, 10, tz);

            // Right row - trunks
            makecyl(0.5, 0.6, 8, 8, 0x5a3a1a, bx + 9, 4, tz);
            // Right canopy
            makesphere(3.5, 8, 6, 0x2d5a1a, bx + 9, 10, tz);
        }

        // Snow Hill motte at end of Long Walk
        makecyl(25, 30, 15, 32, 0x4a6a2a, bx, 7.5, 80 + walkLength + 10);

        // Copper Horse statue (George III on horse - simplified)
        makebox(2, 5, 4, 0x7a5a2a, bx, 19, 80 + walkLength + 10);
        makecyl(1, 1, 5, 8, 0x7a5a2a, bx, 17, 80 + walkLength + 12);
        makesphere(1.5, 8, 6, 0x8a6a3a, bx, 22, 80 + walkLength + 12);
    }

    function buildWindsorTown() {
        var bx = X_OFFSET + 60;
        var bz = -60;
        var shopColor = 0xd4b896;
        var roofColor = 0xa05030;

        // Peascod Street shops - row of buildings
        for (var s = 0; s < 8; s++) {
            var sx = bx + s * 12;
            makebox(10, 12, 14, shopColor, sx, 6, bz);
            makebox(10, 3, 15, roofColor, sx, 13.5, bz);
            // Shop window
            makebox(6, 4, 0.5, 0x87ceeb, sx, 4, bz - 7.3);
            // Shop sign
            makebox(6, 2, 0.5, 0x8b4513, sx, 9, bz - 7.3);
        }

        // Guildhall (Wren) - prominent civic building
        var gx = bx + 50;
        var gz = bz - 20;
        makebox(24, 14, 18, 0xe8d8b8, gx, 7, gz);
        makebox(28, 3, 22, 0xd4c4a0, gx, 15.5, gz);
        // Guildhall columns
        for (var c = 0; c < 5; c++) {
            makecyl(0.6, 0.6, 10, 8, 0xf0e8d0, gx - 9 + c * 4.5, 5, gz - 9.5);
        }
        // Guildhall clock tower
        makebox(7, 22, 7, 0xe8d8b8, gx, 11, gz - 5);
        makecyl(3, 3, 4, 4, 0xd4c4a0, gx, 23, gz - 5);
        makecone(2.5, 6, 4, 0x808080, gx, 28, gz - 5);

        // Castle gateway / Norman Gate
        makebox(20, 22, 8, 0x9e8e7a, X_OFFSET - 10, 11, -45);
        // Gateway arch opening
        makebox(8, 12, 9, 0x2a2a2a, X_OFFSET - 10, 8, -45);
        // Gate towers
        makecyl(4, 4, 24, 12, 0x9e8e7a, X_OFFSET - 18, 12, -45);
        makecyl(4, 4, 24, 12, 0x9e8e7a, X_OFFSET - 2, 12, -45);

        // Gate guards (simplified as box figures)
        makebox(1.5, 5, 1.5, 0x1a1a2e, X_OFFSET - 14, 3.5, -50);
        makebox(1.5, 5, 1.5, 0x1a1a2e, X_OFFSET - 6, 3.5, -50);
        // Bearskin hats
        makebox(2, 3, 2, 0x1a1a1a, X_OFFSET - 14, 7.5, -50);
        makebox(2, 3, 2, 0x1a1a1a, X_OFFSET - 6, 7.5, -50);

        // Castle walls
        makebox(120, 12, 3, 0x8e7e6a, X_OFFSET, 6, -48);
        makebox(3, 12, 80, 0x8e7e6a, X_OFFSET - 60, 6, -10);
        makebox(3, 12, 80, 0x8e7e6a, X_OFFSET + 60, 6, -10);

        // Wall battlements
        for (var wb = 0; wb < 26; wb++) {
            makebox(2, 3, 2, 0x7a6a5a, X_OFFSET - 60 + wb * 4.8, 14, -48);
        }
    }

    function buildThames() {
        // Thames river running east-west
        makebox(600, 0.5, 40, 0x4a7aaa, X_OFFSET + 100, -0.3, -120);

        // Thames bank south side
        makebox(600, 2, 8, 0x6a8a5a, X_OFFSET + 100, 0.8, -105);

        // Windsor Bridge (simplified)
        makebox(30, 2, 40, 0xc8b890, X_OFFSET + 40, 2, -120);
        // Bridge arches supports
        for (var ba = 0; ba < 3; ba++) {
            makecyl(2, 3, 5, 8, 0xb0a080, X_OFFSET + 30 + ba * 10, 0, -120);
        }

        // Boat punts on Thames
        makebox(8, 1, 3, 0x8b6914, X_OFFSET + 80, 1.5, -120);
        makebox(8, 1, 3, 0x5a3a0a, X_OFFSET + 100, 1.5, -118);
        makebox(8, 1, 3, 0x7a4a1a, X_OFFSET + 120, 1.5, -122);

        // Punt poles
        makecyl(0.15, 0.15, 10, 6, 0x8b7355, X_OFFSET + 80, 7, -120);
        makecyl(0.15, 0.15, 10, 6, 0x8b7355, X_OFFSET + 100, 7, -118);
    }

    function buildEtonCollege() {
        var bx = X_OFFSET + 80;
        var bz = -180;
        var etonColor = 0xd4b896;
        var brickColor = 0xc87050;

        // Main school buildings (Long Chamber etc)
        makebox(60, 16, 18, etonColor, bx, 8, bz);
        makebox(60, 14, 18, etonColor, bx, 7, bz + 40);

        // Roofs
        makebox(62, 4, 20, 0xa06040, bx, 18, bz);
        makebox(62, 4, 20, 0xa06040, bx, 16, bz + 40);

        // School Library
        makebox(22, 18, 22, brickColor, bx + 42, 9, bz + 20);
        makebox(24, 4, 24, 0x905040, bx + 42, 20, bz + 20);

        // Eton College Chapel - dominant landmark tower
        makebox(18, 30, 18, 0xd0c0a0, bx - 30, 15, bz + 20);
        makebox(20, 4, 20, 0xb0a090, bx - 30, 31, bz + 20);
        // Chapel windows
        makebox(6, 14, 0.5, 0x87ceeb, bx - 30, 18, bz + 11.3);
        makebox(6, 14, 0.5, 0x87ceeb, bx - 30, 18, bz + 28.7);
        // Chapel pinnacles
        makecone(2, 8, 4, 0xb0a090, bx - 38, 38, bz + 12);
        makecone(2, 8, 4, 0xb0a090, bx - 22, 38, bz + 12);
        makecone(2, 8, 4, 0xb0a090, bx - 38, 38, bz + 28);
        makecone(2, 8, 4, 0xb0a090, bx - 22, 38, bz + 28);

        // Lupton's Tower (gatehouse)
        makebox(10, 28, 10, 0xd0c0a0, bx, 14, bz + 20);
        makecyl(5, 5, 3, 4, 0xb0a090, bx, 29, bz + 20);

        // School Yard courtyard
        makebox(55, 0.3, 35, 0x9a9a8a, bx, 0.15, bz + 20);

        // Playing fields (flat green)
        makebox(200, 0.3, 100, 0x3a6a2a, bx + 60, 0.1, bz - 20);

        // 4th June punts on school side of Thames
        makebox(9, 1, 3, 0x6b4226, bx - 60, 1.5, -128);
        makebox(9, 1, 3, 0x4a2a08, bx - 40, 1.5, -130);
        // Eton boys in punts (box figures)
        makebox(1, 4, 1, 0x1a3a6a, bx - 60, 4, -128);
        makebox(1, 4, 1, 0x1a3a6a, bx - 40, 4, -130);

        // School wall
        makebox(3, 6, 80, 0xc87050, bx - 52, 3, bz + 20);
    }

    function buildGround() {
        // Castle grounds / Windsor Great Park base
        makebox(400, 0.5, 800, 0x4a6a2a, X_OFFSET + 20, -0.25, 100);

        // Terrace below castle
        makebox(150, 2, 30, 0xb0a080, X_OFFSET, 1, -30);

        // North Terrace
        makebox(120, 1.5, 20, 0xc0b090, X_OFFSET, 0.75, -65);
    }

    function build() {
        buildGround();
        buildRoundTower();
        buildUpperWard();
        buildStGeorgesChapel();
        buildLongWalk();
        buildWindsorTown();
        buildThames();
        buildEtonCollege();
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

    return { init: init, update: update, reset: reset };
}());
