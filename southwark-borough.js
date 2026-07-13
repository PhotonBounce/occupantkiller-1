window.SouthwarkBorough = (function() {
    'use strict';

    var OX = 4960;
    var OZ = 2200;
    var objects = [];
    var scene = null;

    function makebox(w, h, d, color, x, y, z) {
        var geo = new THREE.BoxGeometry(w, h, d);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(OX + x, y, OZ + z);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function makeboxrot(w, h, d, color, x, y, z, ry) {
        var geo = new THREE.BoxGeometry(w, h, d);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(OX + x, y, OZ + z);
        mesh.rotation.y = ry;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function makecylinder(rt, rb, h, segs, color, x, y, z) {
        var geo = new THREE.CylinderGeometry(rt, rb, h, segs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(OX + x, y, OZ + z);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function makecone(r, h, segs, color, x, y, z) {
        var geo = new THREE.ConeGeometry(r, h, segs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(OX + x, y, OZ + z);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    // 1. The Shard — stacked tapering Box floors, 40 blocks tall
    function buildshard() {
        var sx = 120;
        var sz = -80;
        var glassColor = 0x87CEEB;
        var floors = 40;
        // Base 12x12, top 2x2, linear interpolation
        for (var i = 0; i < floors; i++) {
            var t = i / (floors - 1);
            var side = 12 - (10 * t);
            var floorH = 3;
            var centerY = (i * floorH) + floorH / 2;
            // Triangular floor plan suggestion — three offset sub-boxes per floor
            makebox(side, floorH - 0.2, side, glassColor, sx, centerY, sz);
            // Triangular facet suggestion — a rotated box offset
            makeboxrot(side * 0.7, floorH - 0.3, side * 0.7, 0x6BB8D4, sx + (side * 0.15), centerY, sz + (side * 0.15), 0.785);
        }
        // Spire tip box
        makebox(0.8, 8, 0.8, 0xCCEEFF, sx, (floors * 3) + 4, sz);
    }

    // 2. Shakespeare's Globe — Tudor theatre reconstruction
    function buildglobe() {
        var gx = -60;
        var gz = 20;
        var creamColor = 0xFFF8DC;
        var thatchColor = 0x8B6914;

        // Main cylindrical body — radius 12, height 6
        makecylinder(12, 12, 6, 16, creamColor, gx, 3, gz);

        // Thatched roof ring on top — CylinderGeometry, wider base taper
        makecylinder(13, 11, 3, 16, thatchColor, gx, 7.5, gz);

        // Open courtyard center — dark Box floor
        makebox(14, 0.5, 14, 0x5C4A1E, gx, 0.25, gz);

        // Inner gallery walls — 3 tiers of Box seating rings
        makebox(20, 2, 2, creamColor, gx, 1, gz - 13);
        makebox(20, 2, 2, creamColor, gx, 1, gz + 13);
        makebox(2, 2, 20, creamColor, gx - 13, 1, gz);
        makebox(2, 2, 20, creamColor, gx + 13, 1, gz);

        // Second gallery tier
        makebox(20, 2, 2, 0xEEE8D0, gx, 3, gz - 13);
        makebox(20, 2, 2, 0xEEE8D0, gx, 3, gz + 13);
        makebox(2, 2, 20, 0xEEE8D0, gx - 13, 3, gz);
        makebox(2, 2, 20, 0xEEE8D0, gx + 13, 3, gz);

        // Stage thrust — rectangular Box stage projecting into yard
        makebox(8, 1, 6, 0x8B6914, gx, 0.5, gz - 4);

        // Stage canopy
        makebox(8, 0.5, 6, thatchColor, gx, 5.5, gz - 4);

        // Entrance gatehouse Box
        makebox(4, 8, 3, creamColor, gx - 14, 4, gz);
    }

    // 3. Borough Market — Victorian iron market hall
    function buildboroughmarket() {
        var mx = -20;
        var mz = 80;
        var ironColor = 0x1C1C1C;
        var glassColor = 0x87CEEB;

        // Main market hall — 25x6x15 Victorian ironwork
        makebox(25, 6, 15, ironColor, mx, 3, mz);

        // Glass roof sections over the hall
        makebox(10, 0.4, 13, glassColor, mx - 6, 6.2, mz);
        makebox(10, 0.4, 13, glassColor, mx + 6, 6.2, mz);

        // Iron roof ridge beam
        makebox(25, 0.5, 1, ironColor, mx, 6.5, mz);

        // Iron support columns — interior
        makebox(0.4, 6, 0.4, ironColor, mx - 11, 3, mz - 6);
        makebox(0.4, 6, 0.4, ironColor, mx - 11, 3, mz + 6);
        makebox(0.4, 6, 0.4, ironColor, mx, 3, mz - 6);
        makebox(0.4, 6, 0.4, ironColor, mx, 3, mz + 6);
        makebox(0.4, 6, 0.4, ironColor, mx + 11, 3, mz - 6);
        makebox(0.4, 6, 0.4, ironColor, mx + 11, 3, mz + 6);

        // Market stall tables inside
        makebox(3, 1, 1.5, 0x8B4513, mx - 8, 1, mz - 3);
        makebox(3, 1, 1.5, 0x8B4513, mx - 4, 1, mz - 3);
        makebox(3, 1, 1.5, 0x8B4513, mx, 1, mz - 3);
        makebox(3, 1, 1.5, 0x8B4513, mx + 4, 1, mz - 3);
        makebox(3, 1, 1.5, 0x8B4513, mx + 8, 1, mz - 3);
        makebox(3, 1, 1.5, 0x8B4513, mx - 8, 1, mz + 3);
        makebox(3, 1, 1.5, 0x8B4513, mx - 4, 1, mz + 3);
        makebox(3, 1, 1.5, 0x8B4513, mx, 1, mz + 3);
        makebox(3, 1, 1.5, 0x8B4513, mx + 4, 1, mz + 3);
        makebox(3, 1, 1.5, 0x8B4513, mx + 8, 1, mz + 3);

        // Facade entrance arch
        makebox(4, 7, 1, ironColor, mx - 12.5, 3.5, mz);
        makebox(4, 7, 1, ironColor, mx + 12.5, 3.5, mz);
    }

    // 4. Southwark Cathedral — medieval perpendicular Gothic
    function buildsouthwarkcathedral() {
        var cx = 30;
        var cz = 60;
        var stoneColor = 0x888888;
        var darkStone = 0x666666;

        // Main nave — 25x8x8
        makebox(25, 8, 8, stoneColor, cx, 4, cz);

        // Choir / chancel extension east
        makebox(10, 7, 7, stoneColor, cx + 17, 3.5, cz);

        // Central tower — 4x14x4
        makebox(4, 14, 4, stoneColor, cx, 7, cz);

        // Tower pinnacles
        makecone(0.8, 3, 6, darkStone, cx - 1.5, 14.5, cz - 1.5);
        makecone(0.8, 3, 6, darkStone, cx + 1.5, 14.5, cz - 1.5);
        makecone(0.8, 3, 6, darkStone, cx - 1.5, 14.5, cz + 1.5);
        makecone(0.8, 3, 6, darkStone, cx + 1.5, 14.5, cz + 1.5);

        // West front towers
        makebox(3, 12, 3, stoneColor, cx - 13, 6, cz - 5);
        makebox(3, 12, 3, stoneColor, cx - 13, 6, cz + 5);
        makecone(1.2, 4, 6, darkStone, cx - 13, 14, cz - 5);
        makecone(1.2, 4, 6, darkStone, cx - 13, 14, cz + 5);

        // Flying buttresses — pairs of Box members angled out from nave
        makebox(3, 0.5, 0.5, darkStone, cx - 6, 6, cz - 5);
        makebox(3, 0.5, 0.5, darkStone, cx - 6, 6, cz + 5);
        makebox(3, 0.5, 0.5, darkStone, cx + 6, 6, cz - 5);
        makebox(3, 0.5, 0.5, darkStone, cx + 6, 6, cz + 5);

        // Buttress piers
        makebox(1, 6, 1, stoneColor, cx - 8, 3, cz - 5);
        makebox(1, 6, 1, stoneColor, cx - 8, 3, cz + 5);
        makebox(1, 6, 1, stoneColor, cx + 8, 3, cz - 5);
        makebox(1, 6, 1, stoneColor, cx + 8, 3, cz + 5);

        // Porch Box
        makebox(4, 5, 3, stoneColor, cx - 14, 2.5, cz);
    }

    // 5. The Golden Hinde — Drake's replica ship
    function buildgoldenhinde() {
        var hx = -90;
        var hz = -20;
        var goldColor = 0xD4A017;
        var darkWood = 0x6B3A1F;

        // Hull — 20 long x 6 wide x 4 tall
        makebox(20, 4, 6, goldColor, hx, 2, hz);

        // Hull gunwale (upper rail)
        makebox(20, 0.5, 6.5, darkWood, hx, 4.25, hz);

        // Forecastle box
        makebox(5, 3, 6, goldColor, hx - 8, 4.5, hz);

        // Sterncastle box
        makebox(6, 4, 6, goldColor, hx + 8, 5, hz);

        // 3 masts — CylinderGeometry
        makecylinder(0.3, 0.35, 14, 6, darkWood, hx - 5, 11, hz);
        makecylinder(0.35, 0.4, 16, 6, darkWood, hx + 1, 12, hz);
        makecylinder(0.25, 0.3, 10, 6, darkWood, hx + 7, 9, hz);

        // Yard arms — horizontal Boxes on each mast
        makebox(8, 0.4, 0.4, darkWood, hx - 5, 14, hz);
        makebox(10, 0.4, 0.4, darkWood, hx + 1, 16, hz);
        makebox(6, 0.4, 0.4, darkWood, hx + 7, 12, hz);

        // Lower yards
        makebox(7, 0.4, 0.4, darkWood, hx - 5, 10, hz);
        makebox(9, 0.4, 0.4, darkWood, hx + 1, 12, hz);

        // Bowsprit mast
        makecylinder(0.2, 0.25, 8, 6, darkWood, hx - 11, 6, hz);
    }

    // 6. City Hall (old GLA) — onion-shaped stacked rotated Box floors
    function buildcityhall() {
        var chx = 70;
        var chz = -40;
        var glassColor = 0x87CEEB;

        // Stack of progressively rotated Box floors creating spherical suggestion
        // Widest floor in middle, narrower top and bottom
        var floorData = [
            [10, 2, 10, 0],
            [12, 2, 12, 0.2],
            [13, 2, 13, 0.4],
            [14, 2, 14, 0.6],
            [14, 2, 14, 0.8],
            [13, 2, 13, 1.0],
            [12, 2, 12, 1.2],
            [11, 2, 11, 1.4],
            [9, 2, 9, 1.6],
            [7, 2, 7, 1.8]
        ];
        for (var i = 0; i < floorData.length; i++) {
            var fd = floorData[i];
            makeboxrot(fd[0], fd[1], fd[2], glassColor, chx, (i * 2) + 1, chz, fd[3]);
        }

        // Access ramp spiral suggestion — angled Box
        makeboxrot(12, 0.4, 2, 0x888888, chx - 8, 4, chz - 4, 0.3);
        makeboxrot(12, 0.4, 2, 0x888888, chx + 8, 8, chz + 4, 0.9);

        // Base entrance area
        makebox(16, 0.5, 14, 0x999999, chx, 0.25, chz);
    }

    // 7. Bermondsey — Victorian railway arches
    function buildrailwayarches() {
        var ax = -40;
        var az = 130;
        var brickColor = 0x8B3A3A;
        var shopColor = 0x996644;

        for (var i = 0; i < 8; i++) {
            var xOff = ax + (i * 12);

            // Arch span box (side walls)
            makebox(10, 8, 2, brickColor, xOff, 4, az);
            makebox(10, 8, 2, brickColor, xOff, 4, az + 14);

            // Arch crown — top box
            makebox(10, 2, 14, brickColor, xOff, 8, az + 7);

            // Shop inside arch space
            makebox(8, 5, 11, shopColor, xOff, 2.5, az + 7);

            // Shop front glass panel
            makebox(7, 3, 0.3, 0x87CEEB, xOff, 3, az + 0.5);
        }

        // Elevated railway track bed over arches
        makebox(96, 1, 3, 0x555555, ax + 42, 9.5, az + 7);
    }

    // 8. Tate Modern Turbine Hall interior suggestion
    function buildtatemodern() {
        var tx = -130;
        var tz = -60;
        var brickColor = 0x8B6355;
        var steelColor = 0x555555;

        // Massive main chimney — CylinderGeometry
        makecylinder(3, 4, 50, 8, steelColor, tx, 25, tz);

        // Turbine hall outer box shell — huge scale
        makebox(60, 20, 30, brickColor, tx, 10, tz);

        // Interior turbine hall space suggestion — lighter inner box
        makebox(55, 18, 25, 0x9B7B6A, tx, 10, tz);

        // Large entrance gallery front
        makebox(60, 20, 2, brickColor, tx, 10, tz - 16);

        // Glass entrance doors
        makebox(12, 8, 0.4, 0x87CEEB, tx, 6, tz - 16.5);

        // Boiler house extension wing
        makebox(20, 15, 30, brickColor, tx - 40, 7.5, tz);

        // Roof extension — steel and glass addition
        makebox(60, 6, 30, steelColor, tx, 23, tz);
        makebox(58, 5, 28, 0x87CEEB, tx, 23.5, tz);
    }

    // 9. Clink Prison — original London prison
    function buildclinkprison() {
        var px = 10;
        var pz = -10;
        var darkStone = 0x555555;
        var signColor = 0x8B0000;

        // Ruined outer walls — Box segments
        makebox(12, 5, 1.5, darkStone, px, 2.5, pz - 8);
        makebox(1.5, 5, 12, darkStone, px - 8, 2.5, pz);
        makebox(8, 3, 1.5, darkStone, px + 6, 1.5, pz + 8);
        makebox(1.5, 4, 8, darkStone, px + 8, 2, pz - 4);

        // Ruined interior wall stump
        makebox(6, 2, 1.5, darkStone, px, 1, pz);

        // Dungeon cell block
        makebox(8, 4, 6, darkStone, px, 2, pz + 2);

        // Barred window slots
        makebox(2, 1, 0.3, 0x333333, px - 2, 3, pz + 5.1);
        makebox(2, 1, 0.3, 0x333333, px + 2, 3, pz + 5.1);

        // Sign marker — red Board
        makebox(3, 1.5, 0.2, signColor, px, 4.5, pz - 8.2);

        // Chain detail Boxes
        makebox(0.3, 2, 0.3, 0x444444, px - 1, 1.5, pz);
        makebox(0.3, 2, 0.3, 0x444444, px + 1, 1.5, pz);
        makebox(2, 0.3, 0.3, 0x444444, px, 0.5, pz);
    }

    // 10. River Thames south bank — walkway, cafes, pubs, barges
    function buildsouthbank() {
        var walkwayColor = 0x808080;
        var cafeColor = 0xCC9966;
        var pubColor = 0x8B5E3C;
        var bargeColor = 0x4A6741;
        var waterColor = 0x2B5BA8;

        // Riverside walkway — long Box running east-west
        makebox(300, 0.5, 8, walkwayColor, 0, 0.25, -100);

        // River Thames water surface
        makebox(300, 0.5, 40, waterColor, 0, -0.5, -120);

        // Cafe buildings along walkway
        makebox(8, 4, 6, cafeColor, -80, 2, -96);
        makebox(8, 4, 6, cafeColor, -60, 2, -96);
        makebox(8, 4, 6, cafeColor, -40, 2, -96);
        makebox(8, 4, 6, cafeColor, -20, 2, -96);
        makebox(8, 4, 6, cafeColor, 0, 2, -96);

        // Cafe signs / rooftop details
        makebox(8, 0.5, 6, 0xCC7722, -80, 4.25, -96);
        makebox(8, 0.5, 6, 0xCC7722, -60, 4.25, -96);
        makebox(8, 0.5, 6, 0xCC7722, -40, 4.25, -96);

        // Pub buildings
        makebox(10, 5, 8, pubColor, 30, 2.5, -96);
        makebox(10, 5, 8, pubColor, 55, 2.5, -96);
        makebox(10, 5, 8, pubColor, 80, 2.5, -96);

        // Pub signboards
        makebox(2, 2, 0.2, 0xFFCC00, 30, 5, -100.2);
        makebox(2, 2, 0.2, 0xFFCC00, 55, 5, -100.2);

        // Moored barges — Box hulls along riverbank
        makebox(18, 2, 5, bargeColor, -70, 1, -112);
        makebox(18, 2, 5, bargeColor, -45, 1, -112);
        makebox(18, 2, 5, bargeColor, -15, 1, -112);
        makebox(18, 2, 5, bargeColor, 20, 1, -112);
        makebox(18, 2, 5, bargeColor, 50, 1, -112);

        // Barge cabin boxes
        makebox(6, 2, 4, 0x5B4A3A, -70, 3, -112);
        makebox(6, 2, 4, 0x5B4A3A, -45, 3, -112);
        makebox(6, 2, 4, 0x5B4A3A, -15, 3, -112);
        makebox(6, 2, 4, 0x5B4A3A, 20, 3, -112);

        // Riverside benches / seats Boxes
        makebox(2, 0.4, 0.8, 0x8B6914, -50, 0.7, -103);
        makebox(2, 0.4, 0.8, 0x8B6914, -30, 0.7, -103);
        makebox(2, 0.4, 0.8, 0x8B6914, 10, 0.7, -103);
        makebox(2, 0.4, 0.8, 0x8B6914, 40, 0.7, -103);

        // Lamp posts — CylinderGeometry
        makecylinder(0.15, 0.2, 5, 6, 0x333333, -75, 2.5, -100);
        makecylinder(0.15, 0.2, 5, 6, 0x333333, -55, 2.5, -100);
        makecylinder(0.15, 0.2, 5, 6, 0x333333, -35, 2.5, -100);
        makecylinder(0.15, 0.2, 5, 6, 0x333333, -15, 2.5, -100);
        makecylinder(0.15, 0.2, 5, 6, 0x333333, 5, 2.5, -100);
        makecylinder(0.15, 0.2, 5, 6, 0x333333, 25, 2.5, -100);
        makecylinder(0.15, 0.2, 5, 6, 0x333333, 45, 2.5, -100);
        makecylinder(0.15, 0.2, 5, 6, 0x333333, 65, 2.5, -100);

        // Lamp heads
        makebox(0.8, 0.5, 0.8, 0xFFEE88, -75, 5.25, -100);
        makebox(0.8, 0.5, 0.8, 0xFFEE88, -55, 5.25, -100);
        makebox(0.8, 0.5, 0.8, 0xFFEE88, -35, 5.25, -100);
        makebox(0.8, 0.5, 0.8, 0xFFEE88, -15, 5.25, -100);
        makebox(0.8, 0.5, 0.8, 0xFFEE88, 5, 5.25, -100);
        makebox(0.8, 0.5, 0.8, 0xFFEE88, 25, 5.25, -100);
        makebox(0.8, 0.5, 0.8, 0xFFEE88, 45, 5.25, -100);
        makebox(0.8, 0.5, 0.8, 0xFFEE88, 65, 5.25, -100);
    }

    function buildground() {
        // Main borough ground
        makebox(350, 0.5, 350, 0x5A7040, 0, -0.25, 0);
        // Paved area near market and cathedral
        makebox(80, 0.4, 60, 0x999977, 10, 0.1, 70);
        // Globe theatre area ground
        makebox(50, 0.4, 50, 0x7A9A5A, -60, 0.1, 20);
    }

    function init(sceneRef) {
        scene = sceneRef;
        objects = [];

        buildground();
        buildshard();
        buildglobe();
        buildboroughmarket();
        buildsouthwarkcathedral();
        buildgoldenhinde();
        buildcityhall();
        buildrailwayarches();
        buildtatemodern();
        buildclinkprison();
        buildsouthbank();
    }

    function update(delta) {
        // Static environment — no per-frame logic needed
    }

    function reset() {
        for (var i = 0; i < objects.length; i++) {
            scene.remove(objects[i]);
            if (objects[i].geometry) {
                objects[i].geometry.dispose();
            }
            if (objects[i].material) {
                objects[i].material.dispose();
            }
        }
        objects = [];
    }

    return { init: init, update: update, reset: reset };
}());
